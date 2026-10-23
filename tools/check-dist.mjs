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
// Map-chrome artifacts (T-93) ship in dist/ and must not be orphaned.
for (const f of ["map-chrome-contract.json","map-chrome.maplibre.css","map-chrome.mapbox.css"]) {
  if (!existsSync(join(ROOT, "dist", f))) errors.push("missing shipped artifact: " + f);
}
// -- Referenced, not merely present (C-16) ----------------------------------
// Existence was never the failure. These three files shipped for weeks while
// nothing in the repository named them, linked them or described them, and every
// gate stayed green because each one counted declarations in files the artifacts
// were not in. So the contract here has two halves, and the second is the one
// that decays: a shipped artifact must be *named* by a document and *loaded* by a
// surface. A silent unlink — or a document section deleted — turns this red
// instead of shipping an orphan again.
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
  for (const f of ["map-chrome-contract.json", "map-chrome.maplibre.css", "map-chrome.mapbox.css"]) {
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
  const source = join(ROOT, "src/css/map-chrome.css");
  if (!existsSync(source)) {
    errors.push("missing the map-chrome source: src/css/map-chrome.css, which dist/ profiles are copied from");
  } else {
    const want = readFileSync(source, "utf8");
    for (const f of ["map-chrome.maplibre.css", "map-chrome.mapbox.css"]) {
      const path = join(ROOT, "dist", f);
      if (existsSync(path) && readFileSync(path, "utf8") !== want) {
        errors.push(`dist/${f} is not the source profile — rebuild, or the emitter has grown its own copy of the CSS`);
      }
    }
  }
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
