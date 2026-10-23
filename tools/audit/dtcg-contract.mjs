#!/usr/bin/env node
/**
 * The DTCG conformance contract (M7 / C-42): validate the SHIPPED token
 * artifacts against an independent implementation of the spec, and publish only
 * the claim that run earns.
 *
 * Why this gate exists at all. Every other gate in this repository counts
 * declarations, and `tools/check-export.mjs` had been certifying
 * `dist/contour.tokens.json` as "the token layer for Figma or Style Dictionary"
 * while that document produced **241 errors** under a real DTCG 2025.10
 * validator. Two of the gate's own rules were the cause: it required a
 * `{ light, dark }` object as a colour's `$value`, which the Format Module does
 * not define, and it read bare CSS strings as colour values, which the spec
 * does not allow. A green lane was enforcing a non-conformant artifact.
 *
 * So this gate asks the implementation, not this repository:
 *
 *   1. the Format document validates with zero errors, and is recognized as a
 *      token document, not a resolver document;
 *   2. `contour.themes.json` validates with zero errors and is recognized as
 *      `documentType: "resolver"` — the lawful home for the theme axis;
 *   3. the validator's own token count is asserted against the artifact, so a
 *      run that inspected nothing cannot report success;
 *   4. no `$type` outside the spec's vocabulary survives (an unknown type is a
 *      warning, and a warning this file ignores is a fabricated type);
 *   5. every published colour denotes the colour the stylesheet declares,
 *      cross-checked through dembrandt's parser — never through this repository
 *      reading its own output twice.
 *
 * The claim that may be published from this is "exports DTCG 2025.10, validated
 * in CI". NOT "DTCG-compatible", NOT "reads from Figma", NOT any bidirectional
 * design-tool sync: Style Dictionary v4 states in its own docs that 2025.10
 * "does not have full support yet", and Figma's Code Connect documentation never
 * mentions tokens. Conformance in one direction is not interoperability.
 *
 * Like the browser gates, this one EXITS rather than skips when its dependency
 * is missing — a gate that silently does not run is a gate that passes. It lives
 * in the `contract` CI job because that is the job that installs `tools/audit`.
 *
 *   node tools/audit/dtcg-contract.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { inventory } from "../lib/inventory.mjs";
import { lightDarkPair } from "../lib/lightdark.mjs";
import { nameFromPath } from "../lib/dtcg.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..", "..");
const TOKENS = join(ROOT, "dist/contour.tokens.json");
const THEMES = join(ROOT, "dist/contour.themes.json");

// Resolution comes from this directory's own manifest, so npm's export map picks
// the file. Hard-coding node_modules/dembrandt/dist/lib/dtcg/validate.js would
// turn a library refactor into a false report that the grammar changed.
const req = createRequire(join(here, "package.json"));

function loadModule(name, hint) {
  try {
    return req(name);
  } catch (e) {
    if (e.code !== "ERR_MODULE_NOT_FOUND" && e.code !== "MODULE_NOT_FOUND") throw e;
    console.error(`dtcg-contract: cannot load ${name} (${e.code}).`);
    console.error(`  ${hint}`);
    process.exit(1);
  }
}

const { validateTokensObject } = loadModule(
  "dembrandt/dtcg",
  "install the audit dev dependencies:  npm --prefix tools/audit install",
);
const colors = loadModule(
  "dembrandt/colors",
  "it ships with dembrandt:  npm --prefix tools/audit install",
);

const isNode = (v) => Boolean(v) && typeof v === "object" && "$value" in v;
function walk(doc, prefix = "") {
  const out = new Map();
  for (const [k, v] of Object.entries(doc)) {
    if (k.startsWith("$")) continue;
    const path = prefix ? `${prefix}.${k}` : k;
    if (isNode(v)) out.set(path, v);
    else if (v && typeof v === "object") for (const [p, n] of walk(v, path)) out.set(p, n);
  }
  return out;
}

/** Serialize emitted components back into CSS, for the identity cross-check. */
function serialize(v) {
  if (!v || typeof v !== "object" || !Array.isArray(v.components)) return typeof v === "string" ? v : null;
  const a = v.alpha === undefined ? "" : ` / ${v.alpha}`;
  const c = v.components;
  switch (v.colorSpace) {
    case "oklch":
      return `oklch(${c[0] * 100}% ${c[1]} ${c[2]}${a})`;
    case "oklab":
      return `oklab(${c[0] * 100}% ${c[1]} ${c[2]}${a})`;
    // lab and lch carry a 0-100 lightness exactly as authored; scaling it moves it.
    case "lab":
    case "lch":
      return `${v.colorSpace}(${c[0]} ${c[1]} ${c[2]}${a})`;
    case "srgb":
      return `rgb(${c[0] * 255} ${c[1] * 255} ${c[2] * 255}${a})`;
    case "hsl":
      return `hsl(${c[0]} ${c[1] * 100}% ${c[2] * 100}%${a})`;
    default:
      return null;
  }
}

function main() {
  for (const f of [TOKENS, THEMES]) {
    if (!existsSync(f)) {
      console.error(`dtcg-contract: ${f.replace(ROOT + "/", "")} is missing — run \`node tools/build.mjs\` first.`);
      return 1;
    }
  }

  const tokensDoc = JSON.parse(readFileSync(TOKENS, "utf8"));
  const themesDoc = JSON.parse(readFileSync(THEMES, "utf8"));
  const census = inventory().tokens.census;
  const errors = [];
  const asText = (e) => (typeof e === "string" ? e : JSON.stringify(e));

  // -- 1 and 2. Both documents, against the implementation --------------------
  const results = [
    ["dist/contour.tokens.json", tokensDoc, false],
    ["dist/contour.themes.json", themesDoc, true],
  ];
  let checkedNodes = 0;
  for (const [label, doc, expectResolver] of results) {
    const r = validateTokensObject(doc);
    const errs = (r.errors ?? []).map(asText);
    const warns = (r.warnings ?? []).map(asText);
    if (!r.valid || errs.length) {
      errors.push(`${label} does NOT conform to DTCG 2025.10 (${errs.length} error(s))`);
      for (const e of errs.slice(0, 12)) errors.push(`    ${e}`);
    }
    const isResolver = r.documentType === "resolver";
    if (isResolver !== expectResolver) {
      errors.push(`${label} was read as documentType=${JSON.stringify(r.documentType)}; expected resolver=${expectResolver}`);
    }
    // 3. A run that inspected nothing is not a pass. `walk()` returns a Map, so
    // the nodes are taken through Array.from — `Map.prototype.filter` does not
    // exist, and a gate that throws is a gate that never ran.
    const inThisDoc = expectResolver ? walk(themesDoc.sets?.dark?.sources?.[0]?.tokens ?? {}) : walk(doc);
    if (inThisDoc.size === 0) errors.push(`${label} contains no token nodes — nothing was validated`);
    if (typeof r.tokenCount === "number" && !expectResolver && r.tokenCount !== inThisDoc.size) {
      errors.push(`${label}: the validator counted ${r.tokenCount} tokens, the artifact holds ${inThisDoc.size}`);
    }
    checkedNodes += inThisDoc.size;
    // 4. Unknown $type is only a warning to the validator; it is an error here.
    const badTypes = warns.filter((w) => /Unknown \$type/.test(w));
    if (badTypes.length) {
      errors.push(`${label} publishes ${badTypes.length} $type outside the spec's vocabulary`);
      for (const w of badTypes.slice(0, 6)) errors.push(`    ${w}`);
    }
    for (const w of warns.filter((w) => !/Unknown \$type/.test(w))) errors.push(`    ${label} warning: ${w}`);
  }

  // -- 5. Colour identity, through an independent parser ---------------------
  const base = walk(tokensDoc);
  const dark = walk(themesDoc.sets?.dark?.sources?.[0]?.tokens ?? {});
  const resolveDeclared = (text) => {
    let out = String(text).replace(/\s+/g, " ").trim();
    for (let i = 0; i < 24; i++) {
      const m = out.match(/var\((--[a-z0-9-]+)(\s*,[^()]*)?\)/);
      if (!m) return { text: out };
      const value = census[m[1]]?.value;
      if (value === undefined) return { unresolvable: `not declared: ${m[1]}` };
      out = out.replace(m[0], String(value).replace(/\s+/g, " ").trim());
    }
    return { unresolvable: "var() nested too deep" };
  };
  const dereference = (value, seen = new Set()) => {
    let v = value;
    for (let i = 0; i < 8; i++) {
      if (!(typeof v === "string" && /^\{.+\}$/.test(v))) return v;
      const path = v.slice(1, -1);
      if (seen.has(path)) return null;
      seen.add(path);
      v = base.get(path)?.$value;
      if (v === undefined) return null;
    }
    return null;
  };

  // `base` is a Map, so it is taken through Array.from before filtering.
  const targets = Array.from(base)
    .filter(([, n]) => n.$type === "color")
    .map(([p, n]) => [p, n, "base"]);
  for (const [p, n] of dark) if (n.$type === "color") targets.push([p, n, "dark"]);

  let validatedColours = 0;
  const colourFailures = [];
  for (const [path, node, side] of targets) {
    const name = nameFromPath(path);
    const declaredRaw = census[name]?.value;
    if (declaredRaw === undefined) {
      colourFailures.push(`${name}: ${side} path ${path} reverses to an undeclared property`);
      continue;
    }
    const pair = lightDarkPair(declaredRaw);
    if (side === "dark" && !pair) {
      colourFailures.push(`${name}: a dark branch is published for a declaration that is not a pair`);
      continue;
    }
    const text = pair ? (side === "dark" ? pair.dark : pair.light) : declaredRaw;
    const value = dereference(node.$value);
    const rebuilt = serialize(value);
    const res = resolveDeclared(text);
    if (!rebuilt || res.unresolvable) {
      colourFailures.push(`${name} (${side}): could not be compared (${res.unresolvable ?? `cannot serialize ${JSON.stringify(value)}`})`);
      continue;
    }
    const A = colors.convertColor(res.text);
    const B = colors.convertColor(rebuilt);
    if (!A || !B) {
      colourFailures.push(`${name} (${side}): dembrandt could not parse "${res.text}" or "${rebuilt}"`);
      continue;
    }
    validatedColours++;
    // Both sides pass through the same 8-bit sRGB path, so a correct read agrees
    // exactly; `rgb` is compared too because `hex` silently drops alpha.
    if (A.hex !== B.hex || A.rgb !== B.rgb) {
      colourFailures.push(`${name} (${side}): declared ${res.text} → ${A.hex} ${A.rgb} | published ${rebuilt} → ${B.hex} ${B.rgb}`);
    }
  }
  if (colourFailures.length) {
    errors.push(`${colourFailures.length} published colour(s) do not match the declaration, or could not be checked`);
    for (const c of colourFailures.slice(0, 10)) errors.push(`    ${c}`);
  }
  if (validatedColours !== targets.length) {
    errors.push(`only ${validatedColours} of ${targets.length} published colours were checked — an incomplete check is a failure`);
  }

  if (errors.length) {
    console.error(`dtcg-contract: ${errors.length} problem(s)`);
    for (const e of errors) console.error("  " + e);
    return 1;
  }

  const ledgerCount = Object.values(tokensDoc.$extensions?.["com.contour.dtcg"]?.reasons ?? {}).reduce((a, r) => a + (r.count ?? r.tokens?.length ?? 0), 0);
  console.log(
    `dtcg-contract: both artifacts conform to DTCG 2025.10 under an independent validator — ` +
      `${checkedNodes} nodes across the Format document and the Resolver set, ${validatedColours}/${targets.length} colours ` +
      `confirmed identical to the declaration, ${ledgerCount} declared values ledgered as inexpressible. OK`,
  );
  return 0;
}

process.exit(main());
