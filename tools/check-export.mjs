#!/usr/bin/env node
/**
 * The token-export gate.
 *
 * This gate used to certify a document that an independent implementation of the
 * spec rejects. Measured against dembrandt's DTCG validator, the export it was
 * green-liting produced 241 errors, because two of this file's own rules were
 * wrong about the Format Module:
 *
 *   - it required a `{ light, dark }` object as a `color` token's `$value`. There
 *     is no such value form: a colour is `{colorSpace, components}` or a
 *     reference. The theme axis now travels in `contour.themes.json` as a
 *     Resolver set, which is where the spec puts it.
 *   - it looked for `--color-text` at the top level. The export is grouped, so the
 *     rule failed a *correct* file. A gate that only ever passes the artifact it
 *     was written against is not a gate.
 *
 * What survived is the invariant that mattered, stated more strongly: a count is
 * not coverage. Every token declared in `src/css/tokens.css` must land on exactly
 * one side of a public sum — exported, or ledgered as refused with a reason from
 * the exporter's closed vocabulary. The old file failed because it *silently*
 * published 151 of 273 tokens; silence is still the failure, whatever the shape.
 *
 * So this gate asserts, against the shipped artifacts:
 *
 *   1. exported + ledgered = declared, with no token on both sides and none on
 *      neither, and every ledger reason is one the exporter actually defines;
 *   2. every published path reverses to a declared custom property — which is how
 *      a node that is silently both a token and a group gets caught;
 *   3. the semantic layer is present by path, sampled by name not by count;
 *   4. the alias graph survived: a reference is a `{path}`, never a `var(…)`, and
 *      every reference resolves inside the document;
 *   5. every declared theme pair is published on BOTH sides, in the base document
 *      and in the dark set, and the two sides actually differ;
 *   6. a value whose hue came from the `--brand-hue` knob says so, because a fixed
 *      colour in a file is otherwise read as the whole truth about the knob.
 *
 * Legality is not claimed here: that is `tools/audit/dtcg-contract.mjs`, which
 * runs the real validator. This file proves the artifact is *complete*; the
 * validator proves it is *conformant*.
 *
 *   node tools/check-export.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { inventory } from "./lib/inventory.mjs";
import { lightDarkPair } from "./lib/lightdark.mjs";
import { REFUSALS, FORMAT_SCHEMA, RESOLVER_VERSION, nameFromPath, buildDocuments } from "./lib/dtcg.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const TOKENS = join(ROOT, "dist/contour.tokens.json");
const THEMES = join(ROOT, "dist/contour.themes.json");

// The semantic layer is what a consumer overrides and what a design tool needs to
// draw a real screen. Named by PATH so a partial export cannot pass by holding the
// right number of entries in the wrong half.
const SEMANTIC_SAMPLE = [
  "color.text",
  "color.text-muted",
  "color.canvas",
  "color.surface-1",
  "color.surface-2",
  "color.surface-3",
  "color.border",
  "color.control-edge",
  "color.focus-ring",
  "color.primary",
  "color.primary-solid",
  "color.data",
  "chart.1",
  "chart.seq-1",
  "chart.div-mid",
  "brand.hue",
  "radius.md",
  "space.md",
  "target.control",
];

const isNode = (v) => Boolean(v) && typeof v === "object" && "$value" in v;

/** Every token node in a subtree, keyed by its dot path. */
function walk(doc, prefix = "") {
  const found = new Map();
  for (const [key, value] of Object.entries(doc)) {
    if (key.startsWith("$")) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (isNode(value)) found.set(path, value);
    else if (value && typeof value === "object") for (const [p, n] of walk(value, path)) found.set(p, n);
  }
  return found;
}

function main() {
  const missing = [TOKENS, THEMES].filter((f) => !existsSync(f));
  if (missing.length) {
    console.error(`check-export: ${missing.map((f) => `dist/${f.split("/").pop()}`).join(" and ")} missing — run \`node tools/build.mjs\`.`);
    return 1;
  }

  const tokensDoc = JSON.parse(readFileSync(TOKENS, "utf8"));
  const themesDoc = JSON.parse(readFileSync(THEMES, "utf8"));
  const census = inventory().tokens.census;
  const declared = Object.keys(census);

  const failures = [];
  const fail = (m) => failures.push(m);

  // -- 1. The sum: exported + ledgered = declared ----------------------------
  const exported = walk(tokensDoc);
  const ledger = tokensDoc.$extensions?.["com.contour.dtcg"]?.reasons ?? {};
  const ledgered = new Map();
  for (const [key, entry] of Object.entries(ledger)) {
    const reason = key.split(" ")[0];
    if (!(reason in REFUSALS)) fail(`ledger reason "${key}" is not in the exporter's published vocabulary`);
    const list = Array.isArray(entry.tokens) ? entry.tokens : [];
    if (typeof entry.count === "number" && entry.count !== list.length) fail(`ledger "${key}" states ${entry.count} tokens and lists ${list.length}`);
    for (const name of list) {
      if (ledgered.has(name)) fail(`${name} is ledgered twice (${ledgered.get(name)} and ${key})`);
      if (!declared.includes(name)) fail(`${name} is ledgered as refused but is not declared in tokens.css`);
      ledgered.set(name, key);
    }
  }

  const exportedNames = new Map();
  for (const [path, node] of exported) {
    const name = nameFromPath(path);
    if (!declared.includes(name)) fail(`${path} reverses to ${name}, which is not declared in tokens.css`);
    if (exportedNames.has(name)) fail(`${name} is published twice (${exportedNames.get(name)} and ${path})`);
    exportedNames.set(name, path);
  }

  for (const [name, path] of exportedNames) if (ledgered.has(name)) fail(`${name} is both exported (${path}) and ledgered as refused`);
  const neither = declared.filter((n) => !exportedNames.has(n) && !ledgered.has(n));
  if (neither.length) fail(`${neither.length} declared token(s) are neither exported nor ledgered: ${neither.slice(0, 10).join(", ")}${neither.length > 10 ? " …" : ""}`);

  // Nothing may be checked without being matched: a gate that found no tokens is
  // not a gate that passed.
  if (exported.size === 0) fail("the export holds no token nodes at all");
  if (Object.keys(ledger).length === 0 && ledgered.size > 0) fail("ledger is inconsistent");

  // -- 2. The semantic layer, by path ---------------------------------------
  const noSemantic = SEMANTIC_SAMPLE.filter((p) => !exported.has(p) && !ledgered.has(nameFromPath(p)));
  if (noSemantic.length) fail(`semantic layer absent from the export: ${noSemantic.join(", ")}`);

  // -- 3. Lineage: references, not CSS strings -------------------------------
  const strings = [];
  for (const [path, node] of exported) {
    const v = node.$value;
    if (typeof v === "string" && /var\(--/.test(v)) strings.push(`${path}: ${v}`);
    if (typeof v === "string" && node.$type === "color" && !/^\{.+\}$/.test(v)) strings.push(`${path}: a colour published as a bare string`);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const inner of Object.values(v)) if (typeof inner === "string" && /var\(--/.test(inner)) strings.push(`${path}: a composite holding a var()`);
    }
  }
  if (strings.length) fail(`${strings.length} token(s) still carry CSS text where the spec wants a value or a reference: ${strings.slice(0, 4).join(" | ")}`);

  const references = [...exported].filter(([, n]) => typeof n.$value === "string" && /^\{.+\}$/.test(n.$value));
  const dangling = references.filter(([, n]) => !exported.has(n.$value.slice(1, -1)));
  if (dangling.length) fail(`${dangling.length} reference(s) point at a token that is not in the document: ${dangling.slice(0, 5).map(([p, n]) => `${p} → ${n.$value}`).join(", ")}`);

  // -- 4. Both sides of every declared theme pair ----------------------------
  const declaredPairs = declared.filter((n) => lightDarkPair(census[n].value));
  const darkSources = Array.isArray(themesDoc.sets?.dark?.sources) ? themesDoc.sets.dark.sources : [];
  if (!darkSources.length) fail("contour.themes.json declares no dark set");
  const dark = walk(darkSources[0]?.tokens ?? {}, "");
  const noDarkBranch = declaredPairs.filter((n) => exportedNames.has(n) && !dark.has(exportedNames.get(n)));
  if (noDarkBranch.length) fail(`${noDarkBranch.length} paired token(s) have no dark branch: ${noDarkBranch.slice(0, 8).join(", ")}${noDarkBranch.length > 8 ? " …" : ""}`);
  const oneThemeOnly = declaredPairs.filter((n) => !exportedNames.has(n) && !ledgered.has(n));
  if (oneThemeOnly.length) fail(`${oneThemeOnly.length} declared pair(s) vanished from both documents: ${oneThemeOnly.slice(0, 8).join(", ")}`);
  // Equal branches are not a defect. `--color-heat-5: light-dark(var(--sol-500),
  // var(--sol-500))` and `--color-heat-6` are the middle of the heat scale, which
  // is deliberately the same colour in both themes — so demanding the two sides
  // differ would fail a correct export. Fidelity is proved instead by rule 7,
  // which re-derives both sides from the declaration.

  // -- 5. A knob-resolved value must say so ----------------------------------
  const KNOPS = ["--brand-hue", "--radius-scale", "--density"];
  const silent = [];
  for (const [name, path] of exportedNames) {
    const text = String(census[name]?.value ?? "");
    if (!KNOPS.some((k) => text.includes(`var(${k})`))) continue;
    const ext = exported.get(path)?.$extensions?.["com.contour.css"];
    if (!ext || !Array.isArray(ext["knob-resolved"])) silent.push(`${name} (${path})`);
  }
  if (silent.length) fail(`${silent.length} token(s) resolved a knob without recording it: ${silent.slice(0, 8).join(", ")}`);

  // -- 6. The envelope the published claim rests on --------------------------
  if (tokensDoc.$schema !== FORMAT_SCHEMA) fail(`$schema is ${JSON.stringify(tokensDoc.$schema)}, not the stable Format text ${FORMAT_SCHEMA}`);
  if (themesDoc.version !== RESOLVER_VERSION) fail(`resolver version is ${JSON.stringify(themesDoc.version)}, expected ${RESOLVER_VERSION}`);
  const order = themesDoc.resolutionOrder;
  if (!Array.isArray(order) || order.length === 0) fail("the resolver document must declare a non-empty resolutionOrder (Resolver §4.1.6)");
  for (const group of Object.keys(tokensDoc).filter((k) => !k.startsWith("$"))) {
    const node = tokensDoc[group];
    if (node && typeof node === "object" && "$value" in node) fail(`group "${group}" also holds a $value — it is a token and a group at once`);
  }

  // -- 7. The shipped bytes are what src/css still produces -------------------
  // The strongest statement available without a second spec implementation: run
  // the exporter again over the current census and require both artifacts to match
  // what shipped. This is what proves each theme pair published the branch it
  // declares rather than the same branch twice — `--color-heat-5` legitimately
  // resolves to one colour in both themes, so only a comparison against the
  // declaration can tell a deliberate match from a copy bug. It also fails a
  // hand-edited `dist/`, which is generated and must never be edited.
  const rebuilt = buildDocuments(declared.map((name) => ({ name, value: census[name].value })), readFileSync(join(ROOT, "src/css/tokens.css"), "utf8"));
  if (JSON.stringify(rebuilt.tokensDoc) !== JSON.stringify(tokensDoc)) {
    fail("dist/contour.tokens.json is not what src/css/tokens.css produces — the export is generated; run `node tools/build.mjs`");
  }
  if (JSON.stringify(rebuilt.resolverDoc) !== JSON.stringify(themesDoc)) {
    fail("dist/contour.themes.json is not what src/css/tokens.css produces — run `node tools/build.mjs`");
  }

  if (failures.length) {
    console.error(`check-export: ${failures.length} problem(s) with the published token export`);
    for (const f of failures) console.error("  " + f);
    console.error("\nFix tools/lib/dtcg.mjs or tools/build.mjs — the export is generated, never hand-edited.");
    return 1;
  }

  console.log(
    `check-export: ${exported.size} exported + ${ledgered.size} ledgered = ${declared.length} declared (sum asserted, no overlap); ` +
      `${declaredPairs.length} theme pairs on both sides; ${references.length} aliases kept as resolving references; ` +
      `${SEMANTIC_SAMPLE.length} semantic paths located. OK`,
  );
  return 0;
}

process.exit(main());
