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

const LAYER_ORDER = "@layer reset, tokens, base, components, utilities;";

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

  return source.replace(/@import\s+url\(["']?([^"')]+)["']?\)\s*layer\([^)]+\)\s*;/g, (_, target) => {
    const resolved = join(dirname(file), target);
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

// ---------------------------------------------------------------------------

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

// -- The stylesheet ---------------------------------------------------------
const bundled = inline("src/css/ds.css");
const css = `${LAYER_ORDER}\n${bundled.trim()}\n`;
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
const CORE = [
  "tokens.css",
  "base.css",
  "components.css",
  "components-shell.css",
  "patterns.css",
  "utilities.css",
];
const SURFACES = {
  core: CORE,
  docs: [...CORE, "components-docs.css"],
  data: [...CORE, "components-data.css"],
  landing: [...CORE, "components-landing.css"],
};

const surfacesDir = join(dist, "surfaces");
mkdirSync(surfacesDir, { recursive: true });

const bundleOf = (files) =>
  `${LAYER_ORDER}\n${files.map((f) => readFileSync(join(root, "src/css", f), "utf-8").trim()).join("\n")}\n`;

const surfaceSizes = {};
for (const [name, files] of Object.entries(SURFACES)) {
  const min = minifyCss(bundleOf(files));
  writeFileSync(join(surfacesDir, `contour-${name}.min.css`), `${min}\n`, "utf-8");
  surfaceSizes[`surfaces/contour-${name}.min.css`] = Buffer.byteLength(min, "utf8") + 1;
}

// -- The script -------------------------------------------------------------
const js = readFileSync(join(root, "src/js/ds.js"), "utf-8");
writeFileSync(join(dist, "contour.js"), js, "utf-8");
writeFileSync(join(dist, "contour.min.js"), `${minifyJs(js)}\n`, "utf-8");

// -- The tokens -------------------------------------------------------------
const tokens = tokensToJson(readFileSync(join(root, "src/css/tokens.css"), "utf-8"));
writeFileSync(join(dist, "contour.tokens.json"), `${JSON.stringify(tokens, null, 2)}\n`, "utf-8");

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
