#!/usr/bin/env node
/**
 * CDS-022: SSR and framework interoperability validation.
 *
 * Validates that Contour's package exports can be imported during server-side
 * rendering without accessing browser globals (`window`, `document`,
 * `HTMLElement`, `customElements`) prematurely.
 *
 * Safe for SSR: CSS entry, WC entry point (guarded), individual WC modules.
 * Not safe for SSR: ds.js (accesses window/document at module top level) —
 * this is intentional progressive enhancement; consumers must only load it in
 * the browser (e.g. via <script type=module> or dynamic import after hydration).
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');

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

// Strip line comments and block comments from source for accurate analysis
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')   // block comments
    .replace(/\/\/.*$/gm, '');           // line comments
}

// Check for unguarded top-level browser-global access, tracking if-guards
// `file` can be a path relative to ROOT or an absolute path.
function auditFile(file) {
  const fullPath = file.startsWith('/') ? file : join(ROOT, file);
  const src = readFileSync(fullPath, 'utf8');
  const clean = stripComments(src);
  const lines = clean.split('\n');
  const browserGlobals = ['window', 'document', 'HTMLElement', 'customElements', 'navigator'];
  let unguarded = 0;
  let guardDepth = 0; // how many typeof-guards we're currently inside

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track guard depth: if (typeof X !== "undefined") { ... }
    if (/if\s*\(\s*typeof\s+\w+\s*!==\s*"undefined"\s*\)/.test(trimmed)) {
      guardDepth += 1;
      continue;
    }
    if (trimmed === '}' || trimmed === '} else') {
      if (guardDepth > 0) guardDepth -= 1;
      continue;
    }

    // Only check top-level (indent 0) code that's not inside a guard
    const indent = line.match(/^\s*/)[0].length;
    if (indent !== 0 || guardDepth > 0) continue;

    for (const global of browserGlobals) {
      // Match the global as a standalone identifier (not part of another word)
      const regex = new RegExp(`\\b${global}\\b`);
      if (regex.test(trimmed)) {
        unguarded += 1;
        console.log(`    ${file}:${i + 1}: unguarded ${global}`);
      }
    }
  }

  return unguarded;
}

// ── Step 1: dist file existence ───────────────────────────────────────────

console.log('\nStep 1: dist entry points exist for SSR-safe imports');

const entries = [
  'contour.css',
  'contour.min.css',
  'contour.esm.min.js',
  'contour.min.js',
  'contour-wc.esm.min.js',
  'contour-wc.min.js',
  'contour.d.ts',
];

for (const entry of entries) {
  if (existsSync(join(DIST, entry))) {
    ok(`dist/${entry} present`);
  } else {
    fail(`dist/${entry} missing`);
  }
}

// ── Step 2: source-level SSR audit ────────────────────────────────────────

console.log('\nStep 2: source-level SSR audit (top-level browser-global access)');

const jsFiles = [
  'src/js/ds.js',
  'src/js/wc/index.mjs',
  'src/js/wc/core.mjs',
  'src/js/wc/registration.mjs',
];

for (const file of jsFiles) {
  const count = auditFile(file);
  if (count === 0) {
    ok(`${file}: no unguarded top-level browser-global access`);
  } else {
    fail(`${file}: ${count} unguarded top-level browser-global access(es)`);
  }
}

// ── Step 3: WC module entry points ────────────────────────────────────────

console.log('\nStep 3: individual WC module SSR safety');

const wcDir = join(ROOT, 'src/js/wc');
const wcFiles = readdirSync(wcDir).filter((f) => f.endsWith('.mjs'));

let wcUnguarded = 0;
for (const file of wcFiles) {
  const count = auditFile(join(wcDir, file));
  if (count > 0) wcUnguarded += count;
}

if (wcUnguarded === 0) {
  ok(`all ${wcFiles.length} WC modules: no unguarded top-level browser-global access`);
} else {
  fail(`${wcUnguarded} unguarded access(es) across ${wcFiles.length} WC modules`);
}

// ── Summary ───────────────────────────────────────────────────────────────

console.log(`\nStep 4: summary — ${passes} passed, ${failures} failed`);

if (failures > 0) {
  process.exit(1);
}
