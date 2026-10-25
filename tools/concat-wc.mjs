#!/usr/bin/env node
/**
 * concat-wc.mjs — bundles src/js/wc/*.mjs into src/js/contour-wc.js.
 *
 * The web-component source is authored as ES modules under src/js/wc/ for
 * maintainability. The shipped entry point (src/js/contour-wc.js, and the dist
 * copy produced by build.mjs) is a classic script: the modules are concatenated
 * in filename order with their `import`/`export` statements stripped, wrapped in
 * a single IIFE. Run this after editing a fragment. `--check` (CI) fails when
 * the committed bundle is stale against the fragments.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FRAG_DIR = join(ROOT, "src/js/wc");
const BUNDLE = join(ROOT, "src/js/contour-wc.js");

const check = process.argv.includes("--check");

if (!existsSync(FRAG_DIR)) {
  console.error("concat-wc: src/js/wc/ is missing");
  process.exit(1);
}
const frags = readdirSync(FRAG_DIR).filter((f) => f.endsWith(".mjs")).sort();
if (!frags.length) {
  console.error("concat-wc: no fragments found");
  process.exit(1);
}

function strip(code) {
  // drop import statements
  code = code.replace(/^\s*import\s+[^;]*;?\s*$/gm, "");
  // drop `export` keyword (keep the declaration)
  code = code.replace(/^\s*export\s+/gm, "");
  // drop standalone `export { ... }` lines
  code = code.replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, "");
  return code;
}

const body = frags.map((f) => strip(readFileSync(join(FRAG_DIR, f), "utf-8"))).join("\n");
const out = `(function () {\n  "use strict";\n${body}\n})();\n`;

if (check) {
  const current = existsSync(BUNDLE) ? readFileSync(BUNDLE, "utf-8") : "";
  if (current !== out) {
    console.error("concat-wc: STALE — src/js/contour-wc.js does not match src/js/wc/*.mjs");
    process.exit(1);
  }
  console.log(`concat-wc: OK — ${frags.length} fragment(s), ${Buffer.byteLength(out, "utf8")} bytes`);
} else {
  writeFileSync(BUNDLE, out, "utf-8");
  console.log(`concat-wc: wrote ${BUNDLE} from ${frags.length} fragment(s)`);
}
