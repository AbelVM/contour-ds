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
 *   node tools/check-css.mjs          exit 1 on any collision
 *   node tools/check-css.mjs --json   machine-readable report
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const CSS = join(ROOT, "src/css");

const SHEETS = readdirSync(CSS)
  .filter((f) => /^components.*\.css$/.test(f))
  .sort();

// Collect top-level selector lists per sheet. We only care about the selector
// text before the first `{`, split on commas, trimmed. Nested selectors inside
// @media/@supports are flattened by stripping the at-rule wrapper.
function selectorsIn(text) {
  const out = [];
  // Remove comments.
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, "");
  // Walk braces, tracking selector text.
  let depth = 0;
  let buf = "";
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (ch === "{") {
      const sel = buf.trim();
      if (sel && !sel.startsWith("@")) {
        // Split comma-separated selectors.
        for (const part of sel.split(",")) {
          const p = part.trim();
          if (p) out.push(p);
        }
      }
      depth++;
      buf = "";
    } else if (ch === "}") {
      depth--;
      buf = "";
    } else {
      if (depth === 0) buf += ch;
    }
  }
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