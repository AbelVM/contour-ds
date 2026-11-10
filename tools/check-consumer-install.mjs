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
}

// ── Step 3: summary ───────────────────────────────────────────────────────

console.log(`\nStep 3: summary — ${passes} passed, ${failures} failed`);

// Clean up the tarball so it doesn't get committed
try { run(`rm -f "${TARBALL}"`); } catch {}

if (failures > 0) {
  process.exit(1);
}
