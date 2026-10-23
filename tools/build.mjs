/**
 * Build the distributable version of Contour.
 *
 * The design system itself needs no build step — `src/css/ds.css` is the whole
 * thing and can be linked straight from a file system. This script exists
 * for the other case: shipping a single file, minified, with the assets
 * beside it.
 *
 *     node tools/build.mjs
 *
 * The output is the design system and nothing else: no style guide, no
 * starter templates, no guide-only artwork.
 *
 * Output:
 *   dist/contour.css          the bundled, readable stylesheet
 *   dist/contour.min.css      the same, minified
 *   dist/contour.js           the optional enhancement
 *   dist/contour.min.js       the same, minified
 *   dist/contour.tokens.json  the token layer, for Figma or Style Dictionary
 *   dist/svg/contour-mark.svg the brand mark
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { minifyCss, minifyJs } from "./lib/minify.mjs";
import { lightDarkPair } from "./lib/lightdark.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const dist = join(root, "dist");

const LAYER_ORDER = "@layer tokens, base, components, utilities;";

/**
 * Read a CSS file and inline its `@import` statements.
 * @param {string} file
 * @param {Set<string>} seen
 * @returns {string}
 */
function inline(file, seen = new Set()) {
  const path = join(root, file);
  if (seen.has(path)) return "";
  seen.add(path);

  const source = readFileSync(path, "utf-8");

  const withLayer = source.replace(
    /@import\s+url\(["']?([^"')]+)["']?\)\s*layer\(([^)]+)\)\s*;/g,
    (_, target, layer) => {
      const resolved = join(dirname(file), target);
      const inlined = inline(resolved, seen);
      // Preserve the layer() semantics of the @import: wrap the inlined
      // sheet in its named layer so unlayered rules in the source cannot
      // escape into the bundle's top level.
      return `@layer ${layer.trim()} {\n${inlined}\n}`;
    },
  );

  // Both forms are substituted in sequence, not one-or-the-other. A file that
  // mixes them — ds.css does — would otherwise resolve its layered imports and
  // leave the plain one sitting in the bundle as an unresolved @import, which
  // still works off a disk and silently breaks for every consumer who inlines
  // or re-hosts the stylesheet.
  return withLayer.replace(/@import\s+url\(["']?([^"')]+)["']?\)\s*;/g, (_, target) => {
    // A sheet that declares its OWN layers: the light-dark() fallback spans
    // tokens and utilities, so no single layer() clause could express it, and
    // inlining it as written is the only reading that keeps both.
    const resolved = join(dirname(file), target);
    if (seen.has(join(root, resolved))) return "";
    return inline(resolved, seen);
  });
}

/**
 * The token layer is not one block: `tokens.css` declares inside three
 * separate `:root` rules — primitives and semantic colour, the brand layer,
 * the override knobs. Matching a single block exported 151 of the 273 tokens,
 * which is why the semantic half was missing from `contour.tokens.json`.
 *
 * Comments are dropped first, so a `:root` shown inside a code example is not
 * mistaken for a declaration. Braces are counted, not matched lazily, so a
 * nested `light-dark(…)` or `calc(…)` cannot end the block early.
 *
 * @param {string} css
 * @returns {string} the concatenated body of every `:root { … }` block
 */
function tokenBodies(css) {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, " ");
  const bodies = [];
  const opener = /:root\s*\{/g;
  let match;
  while ((match = opener.exec(source))) {
    let i = opener.lastIndex;
    const start = i;
    let depth = 1;
    while (i < source.length && depth > 0) {
      const ch = source[i];
      if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
      i += 1;
    }
    bodies.push(source.slice(start, i - 1));
  }
  return bodies.join("\n");
}

/**
 * Read the token layer and write it out as JSON.
 * @param {string} css
 * @returns {Record<string, string>}
 */
function tokenType(value) {
  const v = String(value).trim();
  if (/oklch|rgb|hsl|#[0-9a-f]/i.test(v)) return "color";
  if (/rem$|px$|em$|%$/.test(v)) return "dimension";
  if (/^[0-9.]+$/.test(v)) return "number";
  if (/^cubic-bezier|ease|linear/.test(v)) return "cubicBezier";
  return "string";
}

function tokensToJson(css) {
  const tokens = {};
  const body = tokenBodies(css);
  const pattern = /(--[a-z0-9-]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = pattern.exec(body))) {
    const [, name, raw] = match;
    const value = raw.trim();
    // `light-dark(a, b)` is exported as both values, so a tool can pick. The
    // split goes through tools/lib/lightdark.mjs rather than a regex here.
    const pair = lightDarkPair(value);
    if (pair) {
      tokens[name] = { "$value": pair, "$type": "color" };
    } else {
      tokens[name] = { "$value": value, "$type": tokenType(value) };
    }
  }
  return tokens;
}

/**
 * Assert that no style rule sits at the top level of a bundle outside an
 * `@layer` block. Unlayered normal declarations outrank every layered rule,
 * which is the cascade inversion this gate exists to prevent.
 * @param {string} css
 */
function assertNoUnlayeredRules(css) {
  // Strip comments.
  const src = css.replace(/\/\*[\s\S]*?\*\//g, " ");
  let depth = 0;
  let i = 0;
  // We scan for `{` and `}` tracking depth; an opening brace at depth 0 is a
  // top-level block. It is legal only if it opens an @layer (or another
  // wrapping at-rule) — never a bare selector list.
  let violations = [];
  // Find each top-level block opener.
  const re = /\{/g;
  let m;
  // We'll walk manually.
  let idx = 0;
  let buf = "";
  // Collect segments: track depth, record opener context.
  let d = 0;
  let lastNonWs = "";
  // iterate char by char
  let j = 0;
  const n = src.length;
  while (j < n) {
    const ch = src[j];
    if (ch === "{") {
      if (d === 0) {
        // gather the preceding statement
        const stmt = buf.trim();
        const isLayer = /^@layer\b/.test(stmt);
        const isWrap = /^@(media|supports|keyframes|container|scope|page|font-face|property)\b/.test(stmt);
        if (!isLayer && !isWrap && stmt.length > 0) {
          violations.push(stmt.slice(0, 80));
        }
      }
      d += 1;
      buf = "";
      j += 1;
      continue;
    }
    if (ch === "}") {
      d = Math.max(0, d - 1);
      buf = "";
      j += 1;
      continue;
    }
    if (ch === ";") {
      // statement boundary at depth 0 (e.g. @layer reset, tokens, ...;)
      buf = "";
      j += 1;
      continue;
    }
    buf += ch;
    j += 1;
  }
  if (violations.length) {
    console.error("build: unlayered top-level rules in bundle:");
    for (const v of violations.slice(0, 20)) console.error("  " + v);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

// -- The stylesheet ---------------------------------------------------------
const bundled = inline("src/css/ds.css");
const css = `${LAYER_ORDER}\n${bundled.trim()}\n`;
assertNoUnlayeredRules(css);
writeFileSync(join(dist, "contour.css"), css, "utf-8");

const minifiedCss = minifyCss(css);
writeFileSync(join(dist, "contour.min.css"), `${minifiedCss}\n`, "utf-8");

// -- The per-surface bundles -------------------------------------------------
// The component layer is split by audience, and the README has always said a
// product that needs one surface can take one file. Until now `dist/` proved
// it: the only bundle shipped was the whole system, so the claim was about
// `src/`, not about what a consumer downloads.
//
// `patterns.css` is composition, not audience — the dash, docs and landing
// shells sit in one file — so it rides in core rather than being carved up
// here. Splitting it is the follow-up that would make the per-surface
// bundles smaller again.
// The core list is DERIVED from ds.css rather than written out beside it. It was
// a hand-maintained array, which is a second enumeration of the same fact: a
// sheet added to ds.css — as the light-dark() fallback just was — lands in
// `contour.css` and in no surface bundle, and every gate stayed green while that
// happened. `inline()` resolves ds.css's own imports, so ds.css is the source of
// truth for what the system contains.
const dsImports = [
  ...readFileSync(join(root, "src/css/ds.css"), "utf8").matchAll(/@import\s+url\(["']?\.\/([^"')]+)["']?\)/g),
].map((m) => m[1]);

// A component file split by audience stays out of the bundle that does not need
// it; everything else ds.css imports is core to all four surfaces.
const SURFACE_ONLY = {
  "components-docs.css": "docs",
  "components-data.css": "data",
  "components-landing.css": "landing",
};
const CORE = dsImports.filter((f) => !(f in SURFACE_ONLY));
const SURFACES = {
  core: CORE,
  docs: [...CORE, "components-docs.css"],
  data: [...CORE, "components-data.css"],
  landing: [...CORE, "components-landing.css"],
};

// The derivation is only trustworthy if it is checked. The rule is NOT "every
// import in every bundle" — that would delete the whole point of a per-surface
// bundle, and a first draft of this assertion failed the build for exactly that
// reason. The rule is: a shared sheet must reach all four surfaces, and a sheet
// split by audience must reach its own surface and no other.
const bundleErrors = [];
for (const f of dsImports) {
  if (!existsSync(join(root, "src/css", f))) bundleErrors.push(`ds.css imports ./${f}, which does not exist in src/css`);
  const home = SURFACE_ONLY[f];
  for (const [surface, files] of Object.entries(SURFACES)) {
    const inBundle = files.includes(f);
    if (home === undefined && !inBundle) bundleErrors.push(`./${f} is shared but the ${surface} bundle omits it`);
    if (home !== undefined && inBundle !== (surface === home)) {
      bundleErrors.push(
        `./${f} belongs to the ${home} surface, and the ${surface} bundle ${inBundle ? "carries it anyway" : "is missing it"}`,
      );
    }
  }
}
if (bundleErrors.length) {
  console.error("build: the surface bundles do not cover ds.css");
  for (const e of bundleErrors) console.error("  " + e);
  process.exit(1);
}

const surfacesDir = join(dist, "surfaces");
mkdirSync(surfacesDir, { recursive: true });

const bundleOf = (files) =>
  `${LAYER_ORDER}\n${files.map((f) => readFileSync(join(root, "src/css", f), "utf-8").trim()).join("\n")}\n`;

const surfaceSizes = {};
for (const [name, files] of Object.entries(SURFACES)) {
  const bundle = bundleOf(files);
  assertNoUnlayeredRules(bundle);
  const min = minifyCss(bundle);
  writeFileSync(join(surfacesDir, `contour-${name}.min.css`), `${min}\n`, "utf-8");
  surfaceSizes[`surfaces/contour-${name}.min.css`] = Buffer.byteLength(min, "utf8") + 1;
}

// -- The script -------------------------------------------------------------
const js = readFileSync(join(root, "src/js/ds.js"), "utf-8");
writeFileSync(join(dist, "contour.js"), js, "utf-8");
writeFileSync(join(dist, "contour.min.js"), `${minifyJs(js)}\n`, "utf-8");

// -- The tokens -------------------------------------------------------------
const tokens = tokensToJson(readFileSync(join(root, "src/css/tokens.css"), "utf-8"));
const dtcg = { "$schema": "https://tr.designtokens.org/format/", ...tokens };
writeFileSync(join(dist, "contour.tokens.json"), `${JSON.stringify(dtcg, null, 2)}\n`, "utf-8");

// -- The component contract (T-151) --------------------------------------
const componentBlocks = [...new Set(
  (bundled.match(/\.c-[a-z0-9-]+/g) || [])
    .map((c) => c.replace(/^\./, "").replace(/__.*$/, "").replace(/--.*$/, ""))
)].sort();
const componentsJson = {
  version: "1.0",
  blocks: componentBlocks,
  count: componentBlocks.length,
};
writeFileSync(join(dist, "contour.components.json"), `${JSON.stringify(componentsJson, null, 2)}\n`, "utf-8");

// -- The map-chrome contract (T-93) -----------------------------------------
const mapChromeContract = {
  version: "1.0",
  description: "Vendor-neutralisation contract for map chrome. A host re-keys a vendor control cluster onto Contour tokens.",
  contourTokens: { surface: "--color-surface-1", border: "--color-border", radius: "--radius-md", icon: "--color-text-muted", gap: "--space-3xs" },
  engines: {
    maplibre: { controls: ["navigation","fullscreen","compass","geolocate","globe","terrain","scale","attribution","logo","layer-control"] },
    mapbox: { controls: ["navigation","fullscreen","geolocate","scale","attribution","logo"] },
  },
};
writeFileSync(join(dist, "map-chrome-contract.json"), `${JSON.stringify(mapChromeContract, null, 2)}\n`, "utf-8");

// Vendor re-key profiles (T-143): control-class → token overrides.
// The rules live in `src/css/map-chrome.css`, not in this file. They were a
// string literal here, which is the whole reason three artifacts shipped in
// `dist/` referenced by nothing: the only copy of the CSS sat inside a build
// script, so a consumer taking `src/` alone had nothing to link, a source
// checkout had no `dist/` to link (it is gitignored), and no CSS-level gate —
// the token census, def reachability, the ownership check — could read rules
// that existed only as a JS string. Publishing a copy means `dist/` cannot
// drift from `src/` and the profile is linkable from either.
for (const engine of ["maplibre", "mapbox"]) {
  copyFileSync(
    join(root, "src/css/map-chrome.css"),
    join(dist, `map-chrome.${engine}.css`),
  );
}

// -- The assets -------------------------------------------------------------
// The brand mark ships with the system (it is the favicon and the logo).
// `contour-field.svg` does not: it is the guide's chart-paper texture.
mkdirSync(join(dist, "svg"), { recursive: true });
copyFileSync(
  join(root, "src/svg/contour-mark.svg"),
  join(dist, "svg/contour-mark.svg"),
);

const size = (path) => (existsSync(path) ? `${(readFileSync(path).length / 1024).toFixed(1)} kB` : "—");

// -- The manifest ------------------------------------------------------------
// A failed build leaves the previous `dist/` in place, and every lane that
// runs after it then certifies code that was never built. The manifest is what
// lets `tools/check-size.mjs` tell a large bundle apart from a stale one: it
// records what the sources were at the moment this output was produced.
const manifestSources = [
  ...readdirSync(join(root, "src/css")).filter((f) => f.endsWith(".css")).map((f) => join(root, "src/css", f)),
  join(root, "src/js/ds.js"),
  join(root, "src/svg/contour-mark.svg"),
];

const manifest = {
  builtAt: new Date().toISOString(),
  sources: Object.fromEntries(
    manifestSources.map((p) => {
      const buf = readFileSync(p);
      return [p.slice(root.length + 1), { bytes: buf.length, mtimeMs: statSync(p).mtimeMs, sha256: createHash("sha256").update(buf).digest("hex").slice(0, 16) }];
    }),
  ),
  outputs: {
    ...Object.fromEntries(
      ["contour.css", "contour.min.css", "contour.js", "contour.min.js", "contour.tokens.json", "svg/contour-mark.svg"].map((f) => [f, statSync(join(dist, f)).size]),
    ),
    ...surfaceSizes,
  },
};
writeFileSync(join(dist, "build-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");

console.log("dist:");
console.log(`  contour.css         ${size(join(dist, "contour.css"))}`);
console.log(`  contour.min.css     ${size(join(dist, "contour.min.css"))}`);
for (const name of Object.keys(SURFACES)) {
  console.log(`  surfaces/contour-${name}.min.css ${size(join(surfacesDir, `contour-${name}.min.css`))}`);
}
console.log(`  contour.js          ${size(join(dist, "contour.js"))}`);
console.log(`  contour.min.js      ${size(join(dist, "contour.min.js"))}`);
console.log(`  contour.tokens.json ${size(join(dist, "contour.tokens.json"))}`);
console.log(`  svg/contour-mark.svg ${size(join(dist, "svg/contour-mark.svg"))}`);
console.log(`  tokens exported     ${Object.keys(tokens).length}`);
