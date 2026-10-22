#!/usr/bin/env node
/**
 * Token export gate (T-62, first instalment).
 *
 * `dist/contour.tokens.json` is the file a design tool reads. For most of this
 * session it carried 151 of the 273 tokens, because the exporter matched one
 * `:root` block and `tokens.css` declares in three — so the whole semantic
 * layer, the part a consumer actually overrides, was silently missing from the
 * published artefact while `dist/` looked complete.
 *
 * The invariant is therefore not "at least N entries" — that number was passed
 * by a broken export once N was raised, and a count says nothing about which
 * half is absent. The invariant is:
 *
 *   1. every token declared in src/css/tokens.css appears in the export;
 *   2. the semantic layer is present, sampled by name, not by count;
 *   3. every `light-dark()` token exports BOTH themes, since a tool that can
 *      see only one theme cannot render the other.
 *
 * It reads its token list from `tools/lib/inventory.mjs` — the same source the
 * census gate uses. The old disagreement was precisely that the build had its
 * own idea of the token layer: it printed 151 while the census reported 273,
 * and neither was wrong about its own arithmetic.
 *
 *   node tools/check-export.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { inventory } from "./lib/inventory.mjs";
import { lightDarkPair } from "./lib/lightdark.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const EXPORT = join(ROOT, "dist/contour.tokens.json");

// The semantic layer is what a consumer overrides and what a design tool needs
// to draw a real screen. Named deliberately, so a partial export cannot pass by
// having the right number of primitives.
const SEMANTIC_SAMPLE = [
  "--color-text",
  "--color-text-muted",
  "--color-canvas",
  "--color-surface-1",
  "--color-surface-2",
  "--color-surface-3",
  "--color-border",
  "--color-control-edge",
  "--color-focus-ring",
  "--color-primary",
  "--color-data",
  "--chart-1",
  "--chart-seq-1",
  "--chart-div-mid",
  "--brand-hue",
  "--radius-md",
  "--space-md",
  "--target-control",
];

function main() {
  if (!existsSync(EXPORT)) {
    console.error("check-export: dist/contour.tokens.json is missing — run `node tools/build.mjs`.");
    return 1;
  }

  const exported = JSON.parse(readFileSync(EXPORT, "utf8"));
  const inv = inventory();
  const declared = Object.keys(inv.tokens.census);

  const failures = [];

  // 1. Coverage: nothing declared may be absent from the export.
  const missing = declared.filter((name) => !(name in exported));
  if (missing.length) {
    failures.push(`${missing.length} declared token(s) are missing from the export`);
    for (const m of missing.slice(0, 12)) failures.push(`    ${m}`);
    if (missing.length > 12) failures.push(`    … and ${missing.length - 12} more`);
  }

  // Exporting more than is declared means the exporter is reading something it
  // should not — a comment block parsed as a declaration, for instance.
  const extra = Object.keys(exported).filter((name) => !declared.includes(name));
  if (extra.length) {
    failures.push(`${extra.length} token(s) in the export are not declared in tokens.css`);
    for (const e of extra.slice(0, 12)) failures.push(`    ${e}`);
  }

  // 2. The semantic layer must be present by name, not by count.
  const noSemantic = SEMANTIC_SAMPLE.filter((name) => !(name in exported));
  if (noSemantic.length) failures.push(`semantic layer absent from the export: ${noSemantic.join(", ")}`);

  // 3. A token whose DECLARED value is exactly one top-level light-dark() call
  //    must export both themes. A composition that merely contains such a call
  //    -- `--shadow-xs: 0 1px 2px light-dark(...)`, `--hairline: var(--border-width)
  //    solid var(--color-border)` -- is legitimately one value: the browser
  //    resolves the whole expression per theme, and no tool can split an offset
  //    shadow into "a light shadow" and "a dark shadow". Requiring a pair there
  //    was this gate's own first-pass bug, and it flagged twenty sound tokens.
  const halfThemed = [];
  for (const [name, value] of Object.entries(exported)) {
    const source = inv.tokens.census[name];
    if (!source) continue;
    const declaredPair = lightDarkPair(source.value);
    const v = value && value.$value;
    const exportedPair = Boolean(v && typeof v === "object" && "light" in v && "dark" in v);
    if (declaredPair && !exportedPair) {
      halfThemed.push(`${name} (declared light-dark(), published as one string)`);
    }
    if (exportedPair && (!("light" in v) || !("dark" in v))) {
      halfThemed.push(`${name} (one theme only)`);
    }
  }
  if (halfThemed.length) failures.push(`light-dark() tokens not exported as both themes: ${halfThemed.join(", ")}`);

  if (failures.length) {
    console.error(`check-export: ${failures.length} problem(s) with dist/contour.tokens.json`);
    for (const f of failures) console.error("  " + f);
    console.error("\nFix tools/build.mjs — the export is generated, never hand-edited.");
    return 1;
  }

  const themed = Object.values(exported).filter((v) => v && v.$value && typeof v.$value === "object" && "light" in v.$value).length;
  console.log(`check-export: ${Object.keys(exported).length}/${declared.length} tokens exported, ${themed} as light/dark pairs, semantic layer present. OK`);
  return 0;
}

process.exit(main());
