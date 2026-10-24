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
 * `dist/docs/` is the one guide-derived thing that ships, and it tests the rule
 * rather than bending it: it carries the guide's prose and pointers, and no
 * markup, CSS, artwork or URL. tools/check-docs.mjs asserts exactly that, so
 * "the system and nothing else" is a checked property instead of a sentence
 * somebody has to keep honest by hand. It exists because an agent that installs
 * the package should read the documentation of the version it installed, and
 * `index.html` is a good human artifact and a poor machine one.
 *
 * Output:
 *   dist/contour.css          the bundled, readable stylesheet
 *   dist/contour.min.css      the same, minified
 *   dist/contour.js           the optional enhancement
 *   dist/contour.min.js       the same, minified
 *   dist/contour.tokens.json  the token layer, as a DTCG 2025.10 Format document
 *   dist/contour.themes.json  the dark branch of every light-dark() pair, as a
 *                             Resolver document — the Format Module gives a token
 *                             one value, so the theme axis cannot live there
 *   dist/svg/contour-mark.svg the brand mark
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { minifyCss, minifyJs } from "./lib/minify.mjs";
import { buildDocuments } from "./lib/dtcg.mjs";
import { buildComponentsDocument } from "./lib/components.mjs";
import { buildDocs, guideProvenance, readGuide, stampTables } from "./lib/docs.mjs";
import { buildRegistry, registryJson } from "./lib/registry.mjs";
import { inventory } from "./lib/inventory.mjs";
import { buildAgentRules, agentRulesJson } from "./lib/agent-rules.mjs";

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

// -- Opt-in single-file bundle (--single) ---------------------------------
// Inlines the self-hosted fonts as data URIs so a consumer can ship ONE file.
// Off by default: it bloats the CSS by ~260 kB and defeats font caching.
if (process.argv.includes("--single")) {
  let singleCss = css;
  const fontsDir = join(root, "src/css/fonts");
  for (const f of readdirSync(fontsDir).filter((x) => x.endsWith(".woff2"))) {
    const b64 = readFileSync(join(fontsDir, f)).toString("base64");
    const dataUri = `data:font/woff2;base64,${b64}`;
    singleCss = singleCss.replace(new RegExp(`fonts/${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"), dataUri);
  }
  const singleMin = minifyCss(singleCss);
  writeFileSync(join(dist, "contour.single.min.css"), `${singleMin}\n`, "utf-8");
  console.log(`  contour.single.min.css ${ (singleMin.length/1024).toFixed(1)} kB (fonts inlined)`);
}

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

// -- Web components (optional progressive enhancement) ---------------------
const wc = readFileSync(join(root, "src/js/contour-wc.js"), "utf-8");
writeFileSync(join(dist, "contour-wc.js"), wc, "utf-8");
writeFileSync(join(dist, "contour-wc.min.js"), `${minifyJs(wc)}\n`, "utf-8");

// -- TypeScript definitions ------------------------------------------------
const { inventory: invFn } = await import("./lib/inventory.mjs");
const inv = invFn();
const compNames = inv.components.names;
const tokenNames = Object.keys(inv.tokens.census);
const tsLines = [
  "/** Contour Design System — TypeScript definitions. Generated. */",
  "",
  "export type ContourComponent =",
  ...compNames.map((n) => `  | "${n}"`),
  ";",
  "",
  "export type ContourToken =",
  ...tokenNames.map((t) => `  | "${t}"`),
  ";",
  "",
  "export interface ContourAPI {",
  "  __loaded: true;",
  "  version: string;",
  "  toast: (message: string) => void;",
  "  setScheme: (scheme: 'dark' | 'light') => void;",
  "  scrollTo: (id: string | HTMLElement) => void;",
  "  copy: (text: string) => Promise<void>;",
  "  chart: { scale: (d: [number, number], r: [number, number]) => (v: number) => number; ticks: (min: number, max: number, count: number) => number[]; };",
  "  commands: { register: (cmd: { title: string; hint?: string; icon?: string; shortcut?: string; run: () => void }) => void; list: () => Array<{ title: string; hint: string; icon: string; shortcut: string | null }>; };",
  "}",
  "",
  "declare global { interface Window { Contour: ContourAPI; } }",
  "",
];
writeFileSync(join(dist, "contour.d.ts"), tsLines.join("\n"), "utf-8");
if (process.argv.includes("--single") && existsSync(join(dist, "contour.single.min.css"))) {
  const singleMinCss = readFileSync(join(dist, "contour.single.min.css"), "utf-8");
  const singleHtml = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<title>Contour — single file</title>\n<style>\n${singleMinCss.trim()}\n</style>\n</head>\n<body>\n<main class="container section"><h1>Contour</h1><p>Single-file build.</p></main>\n<script>\n${minifyJs(js)}\n</script>\n</body>\n</html>\n`;
  writeFileSync(join(dist, "contour.single.html"), singleHtml, "utf-8");
  console.log(`  contour.single.html written`);
}

// -- Opt-in single-file JS (--single-js) ----------------------------------
// The JS is already a single file (contour.min.js); this flag emits a copy
// under the single.* name so a consumer can reference one consistent prefix.
if (process.argv.includes("--single-js")) {
  writeFileSync(join(dist, "contour.single.min.js"), `${minifyJs(js)}\n`, "utf-8");
  console.log(`  contour.single.min.js written`);
}

// -- The tokens (C-41) ------------------------------------------------------
// The census in tools/lib/inventory.mjs is the only source for WHICH tokens exist
// and WHAT they declare. This file used to parse `tokens.css` itself, and that
// second parser is exactly how the export came to hold 151 tokens while the
// census held 273 and neither looked wrong from inside.
const tokensCss = readFileSync(join(root, "src/css/tokens.css"), "utf-8");
const declared = Object.entries(inventory().tokens.census).map(([name, t]) => ({ name, value: t.value }));
// src/css stays the source of truth: the artefact is a one-way export, and the
// Format Module cannot carry `light-dark()` or the hue knob, so the dark branch
// is published as a Resolver set and the knobs are annotated, never hidden.
const dtcg = buildDocuments(declared, tokensCss);
writeFileSync(join(dist, "contour.tokens.json"), `${JSON.stringify(dtcg.tokensDoc, null, 2)}\n`, "utf-8");
writeFileSync(join(dist, "contour.themes.json"), `${JSON.stringify(dtcg.resolverDoc, null, 2)}\n`, "utf-8");

// -- The component contract (T-151, C-44) --------------------------------
// Derived from the inventory, not from a regex over `bundled`. This file used to
// keep its own idea of which blocks exist, which made three lists of one thing —
// here, in tools/lib/inventory.mjs, and in the audit harness — and they agreed
// only by luck. The shape lives in tools/lib/components.mjs, which the gate also
// calls, so a field the build invents cannot pass unnoticed.
const componentsDoc = buildComponentsDocument(inventory());
writeFileSync(join(dist, "contour.components.json"), `${JSON.stringify(componentsDoc, null, 2)}\n`, "utf-8");

// -- The docs package (C-45) -------------------------------------------------
// Generated from the guide into dist/docs/. The guide is a large human artifact
// and a poor machine one; an agent reading an installed package should get the
// prose and the pointers, not the stylesheet. The provenance recipe lives in
// tools/lib/docs.mjs because tools/check-docs.mjs has to run the SAME derivation
// to prove the shipped bytes are not an edit — two recipes for one hash is how a
// guard starts failing a current file, or passes a stale one.
const guide = guideProvenance(root);
const docs = buildDocs(readGuide(guide.source), inventory(), guide.src, stampTables(root));
const docsDir = join(dist, "docs");
mkdirSync(docsDir, { recursive: true });
writeFileSync(join(docsDir, "index.json"), `${JSON.stringify(docs.index, null, 2)}\n`, "utf-8");
for (const [rel, body] of Object.entries(docs.files)) writeFileSync(join(dist, rel), body, "utf-8");

// -- The registry export (C-46) -----------------------------------------------
// One item per surface bundle, and the input is the build's OWN output directory, so
// a fifth surface cannot appear in the registry without appearing in dist/surfaces —
// and vice versa. That is why this reads dist/ rather than re-deriving the surface
// list here: a second enumeration of the same fact is the failure this repository has
// paid for repeatedly. Pointer-only by decision (see tools/lib/registry.mjs): the
// alternative was 466,887 bytes of CSS copied into JSON beside the files it copies.
const registry = buildRegistry(dist);
mkdirSync(join(dist, "registry", "items"), { recursive: true });
writeFileSync(join(dist, "registry", "registry.json"), registryJson(registry.index), "utf-8");
for (const [rel, body] of Object.entries(registry.files)) writeFileSync(join(dist, rel), registryJson(body), "utf-8");

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

// -- The highlight.js companion (optional) ----------------------------------
// Maps highlight.js token classes onto Contour tokens. Not imported by ds.css
// (highlight.js is a third-party library and Contour ships zero runtime deps),
// so it ships as a separate, opt-in sheet — same shape as map-chrome.css.
copyFileSync(
  join(root, "src/css/hljs.css"),
  join(dist, "hljs.css"),
);



// -- The agent-rules artifact (C-47) ---------------------------------------
// Machine-readable constraints for an agent generating UI with Contour. Each rule
// names the gate that enforces it; the build throws if a cited gate is missing
// or unwired, so the artifact cannot ship with a dangling enforcement.
const agentRules = buildAgentRules(root);
writeFileSync(join(dist, "agent-rules.json"), agentRulesJson(agentRules), "utf-8");

// -- The assets -------------------------------------------------------------
// The brand mark ships with the system (it is the favicon and the logo).
// `contour-field.svg` does not: it is the guide's chart-paper texture.
mkdirSync(join(dist, "svg"), { recursive: true });
copyFileSync(
  join(root, "src/svg/contour-mark.svg"),
  join(dist, "svg/contour-mark.svg"),
);

// -- Self-hosted fonts (C-52) ---------------------------------------------
// IBM Plex ships with the system so a consumer does not depend on a
// third-party font CDN (and the IP transfer that comes with it — see
// README.md "Performance / Fonts" and LG München I, 3 O 17493/20).
// The @font-face rules live in src/css/fonts.css and use relative
// `fonts/...` paths, which resolve identically from src/css/ and dist/.
mkdirSync(join(dist, "fonts"), { recursive: true });
for (const f of readdirSync(join(root, "src/css/fonts"))) {
  if (f === "OFL.txt") continue;
  copyFileSync(join(root, "src/css/fonts", f), join(dist, "fonts", f));
}
copyFileSync(join(root, "src/css/fonts/OFL.txt"), join(dist, "fonts/OFL.txt"));

const size = (path) => (existsSync(path) ? `${(readFileSync(path).length / 1024).toFixed(1)} kB` : "—");

// -- The manifest ------------------------------------------------------------
// A failed build leaves the previous `dist/` in place, and every lane that
// runs after it then certifies code that was never built. The manifest is what
// lets `tools/check-size.mjs` tell a large bundle apart from a stale one: it
// records what the sources were at the moment this output was produced.
const manifestSources = [
  ...readdirSync(join(root, "src/css")).filter((f) => f.endsWith(".css")).map((f) => join(root, "src/css", f)),
  // Self-hosted fonts (C-52) are build inputs too: the @font-face rules in
  // src/css/fonts.css point at them, and dist/fonts/ is a copy. A font swap
  // that nobody rebuilds must not certify as current.
  ...readdirSync(join(root, "src/css/fonts")).map((f) => join(root, "src/css/fonts", f)),
  join(root, "src/js/ds.js"),
  join(root, "src/svg/contour-mark.svg"),
  // `index.html` is a build input now that `dist/docs/` is derived from it. This
  // list named only `src/`, so the guide could be edited and `check-size` would
  // still certify `dist/` as current: the staleness guard had a hole exactly as
  // wide as the newest output. `check-docs` re-derives the bytes independently,
  // which catches an edit to a doc; this line catches the source it was generated
  // from moving under a bundle nobody rebuilt.
  join(root, "index.html"),
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
      ["contour.css", "contour.min.css", "contour.js", "contour.min.js", "contour.tokens.json", "contour.themes.json", "contour.components.json", "docs/index.json", "registry/registry.json", "svg/contour-mark.svg"].map((f) => [f, statSync(join(dist, f)).size]),
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
console.log(`  contour.themes.json ${size(join(dist, "contour.themes.json"))}`);
console.log(`  svg/contour-mark.svg ${size(join(dist, "svg/contour-mark.svg"))}`);
// The export accounting, printed from the build rather than from a note: every
// declared token must land on one side of this sum or the export is partial.
console.log(
  `  tokens            ${dtcg.stats.exported} exported + ${dtcg.stats.refused} refused = ${dtcg.stats.declared} declared, ${dtcg.stats.pairs} as theme pairs`,
);
