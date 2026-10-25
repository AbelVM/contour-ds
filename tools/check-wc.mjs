#!/usr/bin/env node
/**
 * check-wc.mjs — node-level gate for src/js/contour-wc.js.
 *
 * The browser gate (tools/audit/wc-contract.mjs) is the authority on behaviour;
 * this gate catches the structural regressions that `node --check` cannot see
 * (a self-referential base class, an IIFE that closes early, a missing registry)
 * without needing a browser driver.
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
const frags = readdirSync(FRAG_DIR).filter((f) => f.endsWith(".js")).sort();
if (!frags.length) {
  console.error("check-wc: no fragments found");
  process.exit(1);
}
const src = frags.map((f) => readFileSync(join(FRAG_DIR, f), "utf-8")).join("");

// 1. syntax (checked against the committed bundle, which must stay in sync)
const BUNDLE = join(ROOT, "src/js/contour-wc.js");
try {
  execFileSync(process.execPath, ["--check", BUNDLE], { stdio: "pipe" });
} catch (e) {
  fail("src/js/contour-wc.js fails `node --check`: " + (e.stderr || e.message));
}

// 2. base class must extend HTMLElement, not itself
if (!/class\s+ContourBase\s+extends\s+HTMLElement\b/.test(src))
  fail("ContourBase does not extend HTMLElement — a self-referential base class throws at load");

// 3. exactly one top-level IIFE closer (a line that is exactly `})();`)
const topLevelClosers = src.split("\n").filter((l) => l === "})();").length;
if (topLevelClosers !== 1)
  fail(`expected exactly one top-level IIFE closer, found ${topLevelClosers}`);

// 4. registry published and frozen
if (!/window\.ContourElements\s*=\s*Object\.freeze/.test(src))
  fail("window.ContourElements is not published and frozen — the contract gate cannot count the registry");

// 5. define is the only door to the registry
if (!/const\s+define\s*=/.test(src))
  fail("no `define` helper — registrations cannot be enumerated");

// 6. no duplicate define of the same name within one namespace
const seen = new Set();
const dupes = [];
for (const m of src.matchAll(/define\("(contour-[a-z0-9-]+)"/g)) {
  if (seen.has(m[1])) dupes.push(m[1]);
  seen.add(m[1]);
}
if (dupes.length)
  fail(`duplicate define() of: ${[...new Set(dupes)].slice(0, 8).join(", ")}`);

if (errors.length) {
  console.error("check-wc: FAIL\n  " + errors.join("\n  "));
  process.exit(1);
}
console.log(`check-wc: PASS — ${seen.size} registrations, ${topLevelClosers} top-level IIFE closer, base extends HTMLElement`);