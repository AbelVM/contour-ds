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

// 8. the event manifest, in both directions (BY-45)
// Every "contour:*" name the fragments emit — however it is dispatched,
// directly, through wcEmit, _emitForm, emitState or the view emitter —
// must have a manifest entry, and every manifest entry must be emitted:
// a name that ships with a spec but is never dispatched is documentation
// that has already gone stale, and a dispatch without an entry is a page
// that cannot learn from the component. The manifest is the count, and
// this gate asserts it owns every number in the event vocabulary.
const eventsBlock = /CONTOUR_EVENTS\s*=\s*Object\.freeze\(\{([\s\S]*?)\n\s*\}\);/.exec(src);
if (!eventsBlock) {
  fail("no `CONTOUR_EVENTS = Object.freeze({...})` in the fragments — the event vocabulary has no manifest to gate");
} else {
  const manifestKeys = new Set([...eventsBlock[1].matchAll(/"contour:([a-z-]+)"/g)].map((m) => "contour:" + m[1]));
  // The vocabulary is read the way the source writes it: every quoted
  // "contour:*" literal outside the manifest block, which covers direct
  // CustomEvent constructions, wcEmit/_emitForm/emitState/emit calls, and the
  // dynamic dispatches (e.g. `newState === "open" ? "contour:show" : "contour:hide"`,
  // where the name is a literal inside the ternary rather than after `CustomEvent(` —
  // a narrow regex that only matches the direct shape reports those two as dead,
  // which the first run of this gate did).
  const outside = src.replace(eventsBlock[0], "");
  const referenced = new Set([...outside.matchAll(/"contour:([a-z-]+)"/g)].map((m) => "contour:" + m[1]));
  const unmanifested = [...referenced].filter((n) => !manifestKeys.has(n)).sort();
  const dead = [...manifestKeys].filter((n) => !referenced.has(n)).sort();
  if (unmanifested.length)
    fail(`references contour: names with no manifest entry: ${unmanifested.slice(0, 10).join(", ")} — add each to CONTOUR_EVENTS or stop naming it`);
  if (dead.length)
    fail(`manifest names nothing references: ${dead.slice(0, 10).join(", ")} — the vocabulary drifted from the layer that claims to own it`);
}

if (errors.length) {
  console.error("check-wc: FAIL\n  " + errors.join("\n  "));
  process.exit(1);
}
console.log(`check-wc: PASS — ${frags.length} fragments, ${seen.size} registrations, base extends HTMLElement`);

// 7. per-component observed-attribute honesty (WC4-07)
// Every attribute a component reads in render() must be in its own observed()
// list, and every observed attribute must be reflected in properties().
const INTERNAL = new Set(["role", "open", "aria-label", "aria-valuenow", "aria-valuemin", "aria-valuemax", "tabindex", "class"]);
const classRe = /class\s+(\w+)\s+extends\s+ContourBase\s*\{([\s\S]*?)(?=\n(?:class |define\(|export ))/g;
let cm;
const perCompErrors = [];
while ((cm = classRe.exec(src)) !== null) {
  const body = cm[2];
  const obsM = body.match(/static get observed\(\)\s*\{\s*return\s*\[([^\]]*)\]/);
  if (!obsM) continue; // uses default full list
  const obs = new Set([...obsM[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]));
  const propM = body.match(/static get properties\(\)\s*\{\s*return\s*\{([\s\S]*?)\};\s*\}/);
  const propAttrs = new Set(propM ? [...propM[1].matchAll(/attribute:\s*"([^"]+)"/g)].map((x) => x[1]) : []);
  const writes = new Set([...body.matchAll(/this\.setAttribute\("([^"]+)"/g)].map((x) => x[1]));
  const reads = new Set([...body.matchAll(/this\.(?:getAttribute|hasAttribute)\("([^"]+)"\)/g)].map((x) => x[1]));
  for (const a of reads) {
    if (INTERNAL.has(a)) continue;
    if (writes.has(a)) continue;
    if (!obs.has(a)) perCompErrors.push(`${cm[1]} reads "${a}" but does not observe it`);
  }
  for (const a of obs) {
    if (INTERNAL.has(a)) continue;
    if (!propAttrs.has(a)) perCompErrors.push(`${cm[1]} observes "${a}" but does not reflect it in properties()`);
  }
}
if (perCompErrors.length) {
  for (const e of perCompErrors.slice(0, 20)) fail(e);
  if (perCompErrors.length > 20) fail(`...and ${perCompErrors.length - 20} more observed/property mismatches`);
}
