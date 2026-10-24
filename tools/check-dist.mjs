#!/usr/bin/env node
/**
 * Dist-loading smoke check (T-111): verifies the shipped bundle is syntactically
 * valid and free of the known minifier corruption patterns.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const errors = [];
const js = readFileSync(join(ROOT, "dist/contour.min.js"), "utf8");
const css = readFileSync(join(ROOT, "dist/contour.min.css"), "utf8");
// Shipped artifacts that must not be orphaned. C-16 found map chrome built into
// `dist/`, published by `files`, and named by nothing; the token export (C-41)
// and the Resolver set (C-43) are the same hazard in a new costume, so they are
// covered by the same contract rather than a second one. One list, because the
// last time this was written the names were repeated in three places and only
// two of them got updated.
//
// `docs/index.json` joins it for the same reason. Its 23 section files are not
// listed one by one — they are generated from the guide's section count, so a
// per-file entry would be re-typed on every added section — but the index names
// every one of them, and `tools/check-docs.mjs` fails when a file on disk is
// named by no row or a row names a file that is not on disk. Naming the index
// here is what makes the package as a whole reachable from a document.
const SHIPPED_JSON = ["map-chrome-contract.json", "contour.tokens.json", "contour.themes.json", "contour.components.json", "docs/index.json", "registry/registry.json", "agent-rules.json"];
const SHIPPED_CSS_PROFILES = ["map-chrome.maplibre.css", "map-chrome.mapbox.css"];
// The highlight.js companion (C-68) is copied from its own source, so it is listed
// here and NOT in SHIPPED_CSS_PROFILES: that list feeds a loop which compares every
// entry against src/css/map-chrome.css, and adding hljs.css to it made check-dist
// report the theme against the wrong file. Existence and byte-equality against its
// real source are both asserted below, which is the C-16 contract extended to a
// third copied sheet.
const COPIED_CSS_SOURCE = { "hljs.css": "src/css/hljs.css" };
for (const f of [...SHIPPED_JSON, ...SHIPPED_CSS_PROFILES]) {
  if (!existsSync(join(ROOT, "dist", f))) errors.push("missing shipped artifact: " + f);
}
// -- Referenced, not merely present (C-16) ----------------------------------
// Existence was never the failure. The map-chrome files shipped for weeks while
// nothing in the repository named them, linked them or described them, and every
// gate stayed green because each one counted declarations in files the artifacts
// were not in. So the contract here has two halves, and the second is the one
// that decays: a shipped artifact must be *named* by a document, and a shipped
// stylesheet must also be *loaded* by a surface. A silent unlink — or a document
// section deleted — turns this red instead of shipping an orphan again.
const SEARCH = ["README.md", "llms.txt", "index.html"];
{
  const templatesDir = join(ROOT, "templates");
  if (!existsSync(templatesDir)) {
    errors.push("reference check: templates/ is missing, so no shipped surface was searched");
  }
  for (const f of existsSync(templatesDir) ? readdirSync(templatesDir) : []) if (f.endsWith(".html")) SEARCH.push(`templates/${f}`);
  const corpus = [];
  for (const rel of SEARCH) {
    const path = join(ROOT, rel);
    if (!existsSync(path)) { errors.push(`reference check: ${rel} is missing, so the search below is not the whole truth`); continue; }
    const body = readFileSync(path, "utf8");
    if (!body.trim()) { errors.push(`reference check: ${rel} is empty, so it cannot reference anything`); continue; }
    corpus.push({ rel, body });
  }
  for (const f of [...SHIPPED_JSON, ...SHIPPED_CSS_PROFILES]) {
    const namer = corpus.filter((doc) => doc.body.includes(f)).map((doc) => doc.rel);
    if (!namer.length) errors.push(`shipped but named by nothing: dist/${f} is not referenced in ${SEARCH.join(", ")}`);
  }
  // Prose alone is not a wire: at least one page has to load the profile, or the
  // artifact is documentation, not a stylesheet anybody's map ever picks up.
  const loader = corpus.filter((doc) => /<link[^>]+href=["'][^"']*map-chrome[^"']*\.css["']/.test(doc.body));
  if (!loader.length) errors.push("the map-chrome profile is documented but linked by no page (checked: " + SEARCH.join(", ") + ")");
  // The published profiles are copies of one source. If the emitter goes back to
  // writing its own CSS — which is how these files came to be invisible to every
  // CSS-level gate in this repository — the two halves diverge and this catches it.
  // Self-hosted fonts (C-52): the @font-face rules in src/css/fonts.css point at
// `fonts/...`, which must resolve in both src/ and dist/. Verify the directory
// shipped and is non-empty.
const fontsDir = join(ROOT, "dist", "fonts");
if (!existsSync(fontsDir)) errors.push("missing shipped directory: dist/fonts/");
else if (readdirSync(fontsDir).filter((f) => f.endsWith(".woff2")).length < 3)
  errors.push("dist/fonts/ is missing the self-hosted woff2 files");

let copiedCompared = 0;
for (const [shipped, src] of Object.entries(COPIED_CSS_SOURCE)) {
  const sourcePath = join(ROOT, src);
  copiedCompared++;
  if (!existsSync(sourcePath)) {
    errors.push(`missing the source of dist/${shipped}: ${src}, which the build copies`);
    continue;
  }
  const copied = join(ROOT, "dist", shipped);
  if (!existsSync(copied)) {
    errors.push(`missing shipped artifact: dist/${shipped}, copied from ${src}`);
    continue;
  }
  if (readFileSync(copied, "utf8") !== readFileSync(sourcePath, "utf8")) {
    errors.push(`dist/${shipped} is not ${src} — rebuild, or the build has stopped copying it`);
    continue;
  }
}
if (!errors.length)
  console.log(`copied CSS compared against its source: ${copiedCompared + SHIPPED_CSS_PROFILES.length} profiles`);

const source = join(ROOT, "src/css/map-chrome.css");
  if (!existsSync(source)) {
    errors.push("missing the map-chrome source: src/css/map-chrome.css, which dist/ profiles are copied from");
  } else {
    const want = readFileSync(source, "utf8");
    for (const f of SHIPPED_CSS_PROFILES) {
      const path = join(ROOT, "dist", f);
      if (existsSync(path) && readFileSync(path, "utf8") !== want) {
        errors.push(`dist/${f} is not the source profile — rebuild, or the emitter has grown its own copy of the CSS`);
      }
    }
  }
}
// Opt-in single-file bundle (only present after `build --single`): it must be
// self-contained, i.e. no reference to the separate fonts/ directory.
const singlePath = join(ROOT, "dist", "contour.single.min.css");
if (existsSync(singlePath)) {
  const single = readFileSync(singlePath, "utf8");
  if (/fonts\//.test(single)) errors.push("contour.single.min.css still references fonts/ — inlining failed");
}
const singleHtmlPath = join(ROOT, "dist", "contour.single.html");
if (existsSync(singleHtmlPath)) {
  const html = readFileSync(singleHtmlPath, "utf8");
  if (!/<style>/.test(html)) errors.push("contour.single.html is missing inlined CSS");
}
const singleJsPath = join(ROOT, "dist", "contour.single.min.js");
if (existsSync(singleJsPath)) {
  try { new Function(readFileSync(singleJsPath, "utf8")); }
  catch (e) { errors.push("contour.single.min.js syntax: " + e.message); }
}
// JS syntax check via Function constructor (best-effort).
try { new Function(js); } catch (e) { errors.push("JS syntax: " + e.message); }
// Corruption patterns.
if (/\[data-[a-z-]+\][a-z]/.test(js)) errors.push("JS: descendant combinator eaten in selector");
if (/rootMargin:"[^"]*0px[0-9]/.test(js)) errors.push("JS: rootMargin space eaten");
if (/calc\([^)]*\+[0-9]/.test(css)) errors.push("CSS: calc() space eaten");
if (/oklch\(\d+%\d/.test(css)) errors.push("CSS: oklch() space eaten");
if (/\.c-radio-list\.c-radio/.test(css) || /\[dir="rtl"\]\.c-/.test(css)) errors.push("CSS: descendant combinator eaten in selector");
if (errors.length) {
  console.error("check-dist: FAIL");
  errors.forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log("check-dist: OK");
process.exit(0);
