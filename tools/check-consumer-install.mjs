#!/usr/bin/env node
/**
 * CDS-021: Clean-install consumer fixture verification.
 *
 * Generates the npm tarball from the built `dist/`, installs it into each
 * clean consumer fixture (plain HTML, Vite), and verifies that the shipped
 * files resolve and the package exports are reachable.
 *
 * This does NOT require network access — it installs from the locally
 * generated tarball, simulating what a consumer would do after `npm publish`.
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const FIXTURES = join(ROOT, 'test-fixtures');
const TARBALL = join(ROOT, 'contour-ds-1.7.2.tgz');

let failures = 0;
let passes = 0;

function ok(msg) {
  passes += 1;
  console.log(`  OK   ${msg}`);
}

function fail(msg, err) {
  failures += 1;
  console.log(`  FAIL ${msg}`);
  if (err) console.log(`         ${err.message}`);
}

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts });
}

/**
 * Collect every `contour-ds/…` specifier a fixture imports, so the gate can
 * resolve each one against the installed package rather than guessing from a
 * hand-written list. A hand-written list is what let four broken specifiers
 * live in fixtures and templates while the gate only checked file existence.
 */
function collectSpecifiers(dir) {
  const found = new Set();
  const walk = (d) => {
    let entries;
    try { entries = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = join(d, e.name);
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === '.git') continue;
        walk(p);
      } else if (/\.(js|mjs|cjs|jsx|ts|tsx|html|astro)$/.test(e.name)) {
        let text;
        try { text = readFileSync(p, 'utf8'); } catch { continue; }
        const re = /(?:import|export)\s+(?:[^;]*\s+from\s+)?['"]\s*((?:\.\/|\.\.\/)?(?:node_modules\/)?contour-ds\/[A-Za-z0-9._/*-]+)\s*['"]/g;
        let m;
        while ((m = re.exec(text)) !== null) found.add(m[1]);
      }
    }
  };
  walk(dir);
  return [...found];
}

// ── Step 1: generate the tarball ──────────────────────────────────────────

console.log('Step 1: generating npm tarball from dist/');

try {
  run('npm pack --pack-destination .', { cwd: ROOT });
  if (!existsSync(TARBALL)) {
    fail('tarball was not produced at contour-ds-1.7.2.tgz');
    process.exit(1);
  }
  const size = readFileSync(TARBALL).length;
  ok(`tarball produced (${(size / 1024).toFixed(1)} kB)`);
} catch (err) {
  fail('npm pack failed', err);
  process.exit(1);
}

// ── Step 2: install into each fixture ─────────────────────────────────────

const fixtures = readdirSync(FIXTURES).filter((f) =>
  existsSync(join(FIXTURES, f, 'package.json'))
);

console.log(`\nStep 2: installing tarball into ${fixtures.length} fixture(s)`);

for (const fixture of fixtures) {
  const dir = join(FIXTURES, fixture);
  console.log(`\n  Fixture: ${fixture}`);

  // Remove any existing node_modules to ensure a clean install
  const nm = join(dir, 'node_modules');
  if (existsSync(nm)) {
    try { run(`rm -rf "${nm}"`, { cwd: dir }); } catch {}
  }

  // Install from the local tarball
  try {
    run(`npm install "${TARBALL}" --no-save --no-audit --no-fund`, {
      cwd: dir,
    });
    ok('tarball installed cleanly');
  } catch (err) {
    fail(`npm install failed in ${fixture}`, err);
    continue;
  }

  // Verify the package files exist in node_modules
  const pkgDir = join(dir, 'node_modules', 'contour-ds');
  if (!existsSync(pkgDir)) {
    fail(`contour-ds not found in ${fixture}/node_modules`);
    continue;
  }
  ok('contour-ds present in node_modules');

  // Verify key exports exist
  const keyExports = [
    'dist/contour.css',
    'dist/contour.min.css',
    'dist/contour.esm.min.js',
    'dist/contour.min.js',
    'dist/contour.d.ts',
    'dist/contour.tokens.json',
    'dist/contour.themes.json',
    'dist/contour.components.json',
  ];
  for (const exp of keyExports) {
    if (existsSync(join(pkgDir, exp))) {
      ok(`export present: ${exp}`);
    } else {
      fail(`export missing: ${exp}`);
    }
  }

  // Verify package.json exports are reachable
  try {
    const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
    const exports = Object.keys(pkg.exports || {});
    ok(`package.json declares ${exports.length} export paths`);
  } catch (err) {
    fail('could not read installed package.json', err);
  }

  // Verify the specifiers this fixture actually imports resolve against the
  // installed package's exports map. Existence alone is not the contract: a
  // fixture can import `contour-ds/dist/wc/contour-wc-button.esm.min.js`, find
  // the file on disk (it is copied by `files`), and still blow up at runtime
  // because the exports map refuses the subpath. Resolving the specifier is
  // what a consumer's bundler does, so it is what this gate does.
  const fixtureRequire = createRequire(join(dir, 'package.json'));
  const specifiers = collectSpecifiers(dir);
  if (!specifiers.length) {
    fail('fixture imports no contour-ds specifier — nothing was resolved');
  }
  for (const spec of specifiers) {
    // Normalise a fixture-relative path (`node_modules/contour-ds/…`) to the
    // bare package specifier the exports map keys on.
    const bare = spec.replace(/^(\.\/|\.\.\/)?node_modules\//, "");
    try {
      fixtureRequire.resolve(bare, { paths: [dir] });
      ok(`specifier resolves: ${spec}`);
    } catch (err) {
      fail(`specifier does not resolve: ${spec}`, err);
    }
  }
}

// ── Step 3: summary ───────────────────────────────────────────────────────

console.log(`\nStep 3: summary — ${passes} passed, ${failures} failed`);

// Clean up the tarball so it doesn't get committed
try { run(`rm -f "${TARBALL}"`); } catch {}

if (failures > 0) {
  process.exit(1);
}
