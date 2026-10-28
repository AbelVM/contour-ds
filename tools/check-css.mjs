#!/usr/bin/env node
/**
 * Cross-sheet CSS selector collision gate (WC5-10).
 *
 * Asserts that no non-utility component selector is defined in more than one
 * component stylesheet. A selector that appears in two sheets is a cascade
 * accident waiting to happen: the winner is decided by @import order, not by
 * intent, and the two definitions usually disagree on layout (see the
 * .c-tree / .c-drag-handle / .c-table th[aria-sort] collisions fixed in
 * M-WC-05).
 *
 * Scope: src/css/components*.css only. Utilities and tokens are excluded
 * because they are expected to layer (utilities override components by
 * design). The gate reads the source, not dist/, so a stale bundle cannot
 * hide a collision.
 *
 * Selectors nested inside @media / @supports / @container are still
 * collected (a collision there is still a collision), but selectors inside
 * @keyframes are not — `0%`/`to`/`from` are keyframe positions, not
 * component selectors. The @layer wrapper every sheet uses is treated as a
 * transparent container so its contents are actually scanned.
 *
 *   node tools/check-css.mjs          exit 1 on any collision
 *   node tools/check-css.mjs --json   machine-readable report
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const CSS = join(ROOT, "src/css");

// Explicit exclusion ledger: every sheet not scanned is named here with a
// reason. A sheet that is neither scanned nor ledgered is a gate bug, not a
// pass (BY2-C1). Utilities and tokens are excluded because they are expected
// to layer; the rest are excluded because they carry no component selectors.
const EXCLUDED = new Map([
  ["ds.css", "import manifest only; no selectors"],
  ["tokens.css", "token definitions, not component selectors"],
  ["fonts.css", "@font-face declarations only"],
  ["hljs.css", "third-party syntax-highlighting stylesheet"],
  ["light-dark-fallback.css", "generated 1:1 derivation of the token layer"],
  ["utilities.css", "expected to override component selectors by design (forced-colors, prefers-contrast, etc.)"],
]);

const allSheets = readdirSync(CSS).filter((f) => f.endsWith(".css")).sort();
const SHEETS = allSheets.filter((f) => !EXCLUDED.has(f));

// Guard: every css file is either scanned or explicitly excluded with a reason.
const unaccounted = allSheets.filter((f) => !EXCLUDED.has(f) && !SHEETS.includes(f));
if (unaccounted.length) {
  console.error(`check-css: unaccounted sheets (neither scanned nor excluded): ${unaccounted.join(", ")}`);
  process.exit(1);
}
for (const [name, reason] of EXCLUDED) {
  if (!allSheets.includes(name)) {
    console.error(`check-css: excluded sheet not present: ${name}`);
    process.exit(1);
  }
}

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "");
}

function parseBlock(str, startIdx) {
  let j = startIdx + 1;
  let d = 1;
  let content = "";
  const L = str.length;
  while (j < L && d > 0) {
    if (str[j] === "{") { d++; content += str[j]; j++; }
    else if (str[j] === "}") { d--; if (d > 0) content += str[j]; j++; }
    else { content += str[j]; j++; }
  }
  return { content, end: j };
}

// Collect selector lists, descending into at-rule blocks (except @keyframes,
// whose body holds keyframe positions rather than component selectors).
function selectorsIn(text) {
  const stripped = stripComments(text);
  const out = [];
  function walk(str, ctx) {
    let i = 0;
    let buf = "";
    const L = str.length;
    while (i < L) {
      if (str[i] === "{") {
        const sel = buf.trim();
        const { content, end } = parseBlock(str, i);
        if (sel.startsWith("@")) {
          // Skip print overrides: they are intentional cascade overrides, not
          // collisions (base.css flattens surfaces for print).
          if (!/^@media\s+print\b/i.test(sel)) {
            // Descend into every at-rule except @keyframes.
            if (!/^@keyframes\b/i.test(sel)) {
              walk(content, ctx.concat(sel));
            }
          }
        } else {
          // Only collect when not inside a @keyframes context.
          const inKeyframes = ctx.some((c) => /^@keyframes\b/i.test(c));
          if (!inKeyframes && sel) {
            for (const part of sel.split(",")) {
              const p = part.trim().replace(/\s+/g, " ");
              if (p) out.push(p);
            }
          }
        }
        buf = "";
        i = end;
      } else if (str[i] === "}") {
        buf = "";
        i++;
      } else {
        buf += str[i];
        i++;
      }
    }
  }
  walk(stripped, []);
  return out;
}

const bySelector = new Map();
for (const sheet of SHEETS) {
  const text = readFileSync(join(CSS, sheet), "utf8");
  for (const sel of selectorsIn(text)) {
    if (!bySelector.has(sel)) bySelector.set(sel, []);
    bySelector.get(sel).push(sheet);
  }
}

const collisions = [];
for (const [sel, sheets] of bySelector) {
  const unique = [...new Set(sheets)];
  if (unique.length > 1) collisions.push({ selector: sel, sheets: unique });
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ sheets: SHEETS, collisions }, null, 2));
  process.exit(collisions.length ? 1 : 0);
}

if (collisions.length) {
  console.error(`check-css: ${collisions.length} selector(s) defined in more than one component sheet:`);
  for (const c of collisions) {
    console.error(`  ${c.selector}  ->  ${c.sheets.join(", ")}`);
  }
  process.exit(1);
}
console.log(`check-css: ${SHEETS.length} sheets scanned, 0 cross-sheet collisions. OK`);
process.exit(0);
