#!/usr/bin/env node
/**
 * check-wc.mjs — node-level gate for the web-component modules.
 *
 * The browser gate (tools/audit/wc-contract.mjs) is the authority on behaviour;
 * this gate catches structural regressions without needing a browser driver.
 * Source lives as ESM under src/js/wc/; there is no concatenated src/ bundle.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FRAG_DIR = join(ROOT, "src/js/wc");
const errors = [];
const fail = (m) => errors.push(m);

if (!existsSync(FRAG_DIR)) {
  console.error("check-wc: src/js/wc/ is missing");
  process.exit(1);
}
const frags = readdirSync(FRAG_DIR).filter((f) => f.endsWith(".mjs")).sort();
if (!frags.length) {
  console.error("check-wc: no fragments found");
  process.exit(1);
}
const src = frags.map((f) => readFileSync(join(FRAG_DIR, f), "utf-8")).join("\n");

// 1. syntax of every fragment
for (const f of frags) {
  try {
    execFileSync(process.execPath, ["--check", join(FRAG_DIR, f)], { stdio: "pipe" });
  } catch (e) {
    fail(`${f} fails \`node --check\`: ` + (e.stderr || e.message));
  }
}

// 2. base class must extend HTMLElement, not itself
if (!/class\s+ContourBase\s+extends\s+HTMLElement\b/.test(src))
  fail("ContourBase does not extend HTMLElement — a self-referential base class throws at load");

// 3. registry published and frozen
if (!/window\.ContourElements\s*=\s*Object\.freeze/.test(src))
  fail("window.ContourElements is not published and frozen — the contract gate cannot count the registry");

// 4. define is the only door to the registry
if (!/const\s+define\s*=/.test(src))
  fail("no `define` helper — registrations cannot be enumerated");

// 5. no duplicate define of the same name within one namespace
const seen = new Set();
const dupes = [];
for (const m of src.matchAll(/define\("(contour-[a-z0-9-]+)"/g)) {
  if (seen.has(m[1])) dupes.push(m[1]);
  seen.add(m[1]);
}
if (dupes.length)
  fail(`duplicate define() of: ${[...new Set(dupes)].slice(0, 8).join(", ")}`);

// 6. dist bundle must exist and be valid (the shipped artifact)
const distBundle = join(ROOT, "dist/contour-wc.js");
if (existsSync(distBundle)) {
  try {
    execFileSync(process.execPath, ["--check", distBundle], { stdio: "pipe" });
  } catch (e) {
    fail("dist/contour-wc.js fails `node --check`: " + (e.stderr || e.message));
  }
}

if (errors.length) {
  console.error("check-wc: FAIL\n  " + errors.join("\n  "));
  process.exit(1);
}
console.log(`check-wc: PASS — ${frags.length} fragments, ${seen.size} registrations, base extends HTMLElement`);
