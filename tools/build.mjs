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

import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { minifyCss, minifyJs } from "./lib/minify.mjs";

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
 * Read the token layer and write it out as JSON.
 * @param {string} css
 * @returns {Record<string, string>}
 */
function tokensToJson(css) {
  const tokens = {};
  // The semantic layer is the one a consumer overrides, so it is the one
  // that is worth exporting with a resolved light and dark value.
  const block = /:root\s*\{([\s\S]*?)\n\s*\}/.exec(css);
  if (!block) return tokens;

  const body = block[1];
  const pattern = /(--[a-z0-9-]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = pattern.exec(body))) {
    const [, name, raw] = match;
    const value = raw.trim();
    // `light-dark(a, b)` is exported as both values, so a tool can pick.
    const lightDark = /^light-dark\(([^,]+),\s*(.+)\)$/.exec(value);
    if (lightDark) {
      tokens[name] = { light: lightDark[1].trim(), dark: lightDark[2].trim() };
    } else {
      tokens[name] = value;
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

// -- The script -------------------------------------------------------------
const js = readFileSync(join(root, "src/js/ds.js"), "utf-8");
writeFileSync(join(dist, "contour.js"), js, "utf-8");
writeFileSync(join(dist, "contour.min.js"), `${minifyJs(js)}\n`, "utf-8");

// -- The tokens -------------------------------------------------------------
const tokens = tokensToJson(readFileSync(join(root, "src/css/tokens.css"), "utf-8"));
writeFileSync(join(dist, "contour.tokens.json"), `${JSON.stringify(tokens, null, 2)}\n`, "utf-8");

// -- The assets -------------------------------------------------------------
// The brand mark ships with the system (it is the favicon and the logo).
// `contour-field.svg` does not: it is the guide's chart-paper texture.
mkdirSync(join(dist, "svg"), { recursive: true });
copyFileSync(
  join(root, "src/svg/contour-mark.svg"),
  join(dist, "svg/contour-mark.svg"),
);

const size = (path) => (existsSync(path) ? `${(readFileSync(path).length / 1024).toFixed(1)} kB` : "—");

console.log("dist:");
console.log(`  contour.css         ${size(join(dist, "contour.css"))}`);
console.log(`  contour.min.css     ${size(join(dist, "contour.min.css"))}`);
console.log(`  contour.js          ${size(join(dist, "contour.js"))}`);
console.log(`  contour.min.js      ${size(join(dist, "contour.min.js"))}`);
console.log(`  contour.tokens.json ${size(join(dist, "contour.tokens.json"))}`);
console.log(`  svg/contour-mark.svg ${size(join(dist, "svg/contour-mark.svg"))}`);
console.log(`  tokens exported     ${Object.keys(tokens).length}`);
