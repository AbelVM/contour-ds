#!/usr/bin/env node
/**
 * Markup hygiene (C-53).
 *
 * Two gaps, both measured rather than assumed, and both invisible to every other
 * gate in this repository because neither is a declaration:
 *
 *   1. Fonts are now self-hosted (C-52), so no shipped page may reach out to
 *      a Google Fonts origin — a leftover `fonts.googleapis.com` / `fonts.gstatic.com`
 *      reference is the failure mode this check exists to catch. The preconnect
 *      pair that used to guard that origin is gone with it.
 *   2. No page carried `og:` or `twitter:` metadata, so a landing surface whose
 *      entire pitch is a visual identity shared into Slack, X or GitHub with no
 *      card at all: no title, no description, no image.
 *
 * The gate deliberately does NOT require an `og:image`. The system ships no
 * raster, only the SVG mark, and the crawlers will not render an SVG as a card
 * image — requiring the tag would be answered by a URL that renders nothing,
 * which is a worse outcome than the tag being absent and said so. What it DOES
 * require is that an `og:image`, if anyone adds one, is an absolute https URL
 * whose path exists in this repository. A dead image URL is the failure mode.
 *
 * It also holds one sentence in one place: `stamp.mjs` generates both the guide's
 * `meta description` and its `og:description`, so this checks they still agree.
 * Two attributes carrying a hand-copied count is how a document ends up
 * publishing a number the source no longer holds.
 *
 * Run: node tools/check-markup.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const read = (...p) => (existsSync(join(ROOT, ...p)) ? readFileSync(join(ROOT, ...p), "utf8") : null);

const PAGES = ["index.html", "templates/landing.html", "templates/dashboard.html", "templates/documentation.html"];
const errors = [];

let linkedFonts = 0;
let preloadedFonts = 0;
let metadataPages = 0;

for (const page of PAGES) {
  const html = read(page);
  if (html === null) {
    errors.push(`${page}: listed as a shipped page but the file is missing`);
    continue;
  }

  // ---- 1. fonts are self-hosted: no third-party font origin may remain ----
  // C-52 moved IBM Plex into src/css/fonts/ and ds.css loads it through
  // src/css/fonts.css, so a shipped page must not reach out to Google Fonts
  // (no DNS/TCP/TLS chain, no IP transfer — LG Muenchen I, 3 O 17493/20).
  // A leftover googleapis/gstatic reference is the failure mode this check
  // exists to catch; the preconnect pair that used to guard it is gone with
  // the origin it pointed at.
  const referencesGoogleFonts = /fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html);
  if (referencesGoogleFonts) {
    errors.push(`${page}: still references a Google Fonts origin — fonts are self-hosted via src/css/fonts.css`);
  } else {
    linkedFonts++;
  }

  // ---- 1b. the critical face is preloaded so text is not invisible ----
  // Self-hosting removes the third-party chain, but the browser still discovers
  // the @font-face only after parsing the CSS. Preloading the body variable
  // font keeps LCP from waiting on that discovery. `crossorigin` is required
  // because font fetches are CORS-mode; a preload without it opens a second,
  // unused connection.
  const preloadsSans = /<link[^>]*rel=["']preload["'][^>]*as=["']font["'][^>]*href=["'][^"']*ibm-plex-sans-var\.woff2["'][^>]*crossorigin/.test(html)
    || /<link[^>]*rel=["']preload["'][^>]*href=["'][^"']*ibm-plex-sans-var\.woff2["'][^>]*as=["']font["'][^>]*crossorigin/.test(html);
  if (!preloadsSans) {
    errors.push(`${page}: self-hosted fonts but no preload for ibm-plex-sans-var.woff2 (as="font", crossorigin)`);
  } else {
    preloadedFonts++;
  }

  // ---- 2. a page that can be shared should say what it is -------------
  const has = (re) => re.test(html);
  const missing = [
    ['og:title', /property=["']og:title["']\s+content=["']([^"']+)["']/],
    ["og:description", /property=["']og:description["']\s+content=["']([^"']+)["']/],
    ["og:type", /property=["']og:type["']\s+content=["']([^"']+)["']/],
    ["twitter:card", /name=["']twitter:card["']\s+content=["']([^"']+)["']/],
    ["a description", /name=["']description["']\s+content=["']([^"']+)["']/],
  ].filter(([, re]) => !has(re));
  if (missing.length) {
    errors.push(`${page}: missing ${missing.map(([n]) => n).join(", ")}`);
  } else {
    metadataPages++;
  }

  // ---- 3. an og:image must resolve, or must not be claimed -------------
  const img = /property=["']og:image["']\s+content=["']([^"']*)["']/.exec(html);
  if (img) {
    const url = img[1].trim();
    if (!/^https:\/\//.test(url)) {
      errors.push(`${page}: og:image "${url}" is not an absolute https URL — crawlers will not resolve a relative one`);
    } else {
      const inRepo = url.match(/\/(src|assets|dist)\/[^\s"']+/);
      if (inRepo && !existsSync(join(ROOT, inRepo[1]))) {
        errors.push(`${page}: og:image points at ${url}, and ${inRepo[0]} does not exist in this repository`);
      }
    }
  }
}

// ---- 4. one sentence, generated twice, must still be one sentence -------
const guide = read("index.html") || "";
const desc = /name=["']description["']\s+content=["']([^"']+)["']/.exec(guide);
const ogDesc = /property=["']og:description["']\s+content=["']([^"']+)["']/.exec(guide);
if (desc && ogDesc && desc[1] !== ogDesc[1]) {
  errors.push("index.html: meta description and og:description have drifted — stamp.mjs generates both from one string");
}

// A run that looked at nothing is not a pass.
if (!linkedFonts || !preloadedFonts || !metadataPages) {
  errors.push(`checked ${linkedFonts} self-hosted-font page(s), ${preloadedFonts} preloaded-font page(s) and ${metadataPages} fully-described page(s) — nothing matched, so the gate proved nothing`);
}

if (errors.length) {
  console.error("check-markup: FAIL");
  errors.forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log(
  `check-markup: OK — ${PAGES.length} shipped page(s): ${linkedFonts} use self-hosted fonts (no Google Fonts origin), ` +
    `${preloadedFonts} preload the critical face, ${metadataPages} carry title/description/og:type/twitter:card, ` +
    `and the guide's two description attributes agree.`,
);
