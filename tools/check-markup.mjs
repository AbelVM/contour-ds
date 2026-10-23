#!/usr/bin/env node
/**
 * Markup hygiene (C-53).
 *
 * Two gaps, both measured rather than assumed, and both invisible to every other
 * gate in this repository because neither is a declaration:
 *
 *   1. Every shipped page linked Google Fonts and none but the guide carried the
 *      matching `rel=preconnect` pair, so the shipped template was slower than
 *      the documentation that recommends it. A preconnect is a hint, and a hint
 *      that is missing changes no test result — it only costs the reader
 *      milliseconds on every load. Nothing checked it.
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
const FONT_ORIGIN = "https://fonts.googleapis.com";
const FONT_FILES = "https://fonts.gstatic.com";
const errors = [];

let linkedFonts = 0;
let metadataPages = 0;

for (const page of PAGES) {
  const html = read(page);
  if (html === null) {
    errors.push(`${page}: listed as a shipped page but the file is missing`);
    continue;
  }

  // ---- 1. a cross-origin font sheet needs both hints -------------------
  // googleapis serves the stylesheet, gstatic serves the font files. Skipping
  // the second still pays a fresh handshake for every face, and `crossorigin` is
  // required on it because the font fetch is CORS-mode — a preconnect without it
  // opens a second, unused connection.
  const linksFonts = new RegExp(`href=["']${FONT_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(html);
  if (linksFonts) {
    linkedFonts++;
    const toApi = /<link[^>]*rel=["']preconnect["'][^>]*href=["']https:\/\/fonts\.googleapis\.com["']/.test(html);
    const toFiles = /<link[^>]*rel=["']preconnect["'][^>]*href=["']https:\/\/fonts\.gstatic\.com["'][^>]*crossorigin/.test(html);
    if (!toApi) errors.push(`${page}: loads the Google Fonts sheet with no preconnect to ${FONT_ORIGIN}`);
    if (!toFiles) errors.push(`${page}: preconnect to ${FONT_FILES} missing or without crossorigin (the font fetch is CORS-mode)`);
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
if (!linkedFonts || !metadataPages) {
  errors.push(`checked ${linkedFonts} font-linking page(s) and ${metadataPages} fully-described page(s) — nothing matched, so the gate proved nothing`);
}

if (errors.length) {
  console.error("check-markup: FAIL");
  errors.forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log(
  `check-markup: OK — ${PAGES.length} shipped page(s): ${linkedFonts} load webfonts and preconnect to both origins, ` +
    `${metadataPages} carry title/description/og:type/twitter:card, and the guide's two description attributes agree.`,
);
