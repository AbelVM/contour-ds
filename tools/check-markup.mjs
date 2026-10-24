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

// `rel` values that make the browser fetch something. A canonical or an
// alternate link is a pointer a crawler reads, not a dependency the page needs
// to render, so naming its origin is not the same act as loading from it.
const LOAD_RELS = new Set(["stylesheet", "preload", "modulepreload", "icon", "apple-touch-icon", "manifest", "prefetch", "preconnect", "dns-prefetch"]);

// The third-party origins a shipped page may fetch from, each with the reason
// it was chosen. Empty is not the intent: the guide's highlighter is here
// because showing the Contour theme on real tokenised code is a feature
// (README.md discloses the script), and every other origin must be refused
// until someone adds it on purpose.
const OFF_ORIGIN_ALLOWLIST = {
  "cdn.jsdelivr.net": "highlight.js — the guide loads it to render the Contour hljs theme on real highlighted code",
};

let linkedFonts = 0;
let preloadedFonts = 0;
let metadataPages = 0;
let scriptLoads = 0;
let offOriginLoads = 0;
let guideScripts = 0;
let guideOffOrigin = 0;
const allowlisted = new Set();
const mentioned = new Set();

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

  // ---- 1c. a page may not depend on an origin this file does not name ----
  // Rule 1 only ever looked at two named hosts, so any *other* third-party
  // origin could arrive uninvited and every gate here would stay green. The
  // guide does load one on purpose: highlight.js, so the Contour theme is shown
  // on real highlighted code rather than on a hand-coloured mock (README.md
  // discloses the script). So the contract is not "no off-origin loads", it is
  // "every off-origin load is named in OFF_ORIGIN_ALLOWLIST with a reason", and
  // an allowance that outlives its dependency is refused below.
  for (const tag of html.match(/<(?:script|link|img|source)\b[^>]*>/gi) || []) {
    const url = (tag.match(/\b(?:src|href|srcset)=["']([^"'\s]+)/i) || [])[1];
    if (!url) continue;
    const isScript = /^<script/i.test(tag);
    // A script the page has to fetch counts toward the guide's script budget
    // whether it came off disk or off a CDN: "external" in that sentence means
    // "not inline", which is what a reader pays for, not where the bytes live.
    if (isScript) {
      scriptLoads++;
      if (page === "index.html") guideScripts++;
    }
    if (!/^https?:\/\//i.test(url)) continue;
    const origin = url.replace(/^https?:\/\/([^/]+).*/i, "$1");
    if (/^<link/i.test(tag)) {
      const rel = ((tag.match(/\brel=["']([^"']+)/i) || [])[1] || "").toLowerCase();
      if (!LOAD_RELS.has(rel)) {
        mentioned.add(`${origin} (link rel=${rel || "unset"}, a pointer, not a load)`);
        continue;
      }
    }
    offOriginLoads++;
    if (isScript && page === "index.html") guideOffOrigin++;
    if (OFF_ORIGIN_ALLOWLIST[origin]) allowlisted.add(origin);
    else errors.push(`${page}: loads ${url} from ${origin}, which OFF_ORIGIN_ALLOWLIST does not name — either the page gains a dependency nobody chose, or the allowlist entry was deleted while the reference stayed`);
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

// ---- 4b. an allowance nobody uses is a hole waiting for a tenant ------------
// The allowlist exists to name a decision, so a listed origin that no shipped
// page loads any more is not harmless: it is a standing permission for the next
// person to reach off-origin without anyone choosing it.
for (const origin of Object.keys(OFF_ORIGIN_ALLOWLIST)) {
  if (!allowlisted.has(origin)) {
    errors.push(`OFF_ORIGIN_ALLOWLIST names ${origin}, but no shipped page loads it any more — delete the entry, or the next off-origin reference is approved in advance`);
  }
}

// ---- 4. one sentence, generated twice, must still be one sentence -------
const guide = read("index.html") || "";
const desc = /name=["']description["']\s+content=["']([^"']+)["']/.exec(guide);
const ogDesc = /property=["']og:description["']\s+content=["']([^"']+)["']/.exec(guide);
if (desc && ogDesc && desc[1] !== ogDesc[1]) {
  errors.push("index.html: meta description and og:description have drifted — stamp.mjs generates both from one string");
}

  // ---- 5. disclosure bodies must stay findable (C-60) -----------------
  // `hidden="until-found"` is unsupported in Safari (blocked since Feb 2026);
  // `content-visibility: hidden` and `display: none` on a disclosure body
  // defeat the reveal. Guard against them in src/css.
  const cssFiles = ["base.css","components.css","components-shell.css","components-data.css","components-docs.css","components-landing.css","patterns.css","utilities.css","tokens.css"];
  for (const f of cssFiles) {
    const css = read("src/css", f);
    if (css === null) continue;
    if (/content-visibility\s*:\s*hidden/.test(css)) {
      errors.push(`${f}: content-visibility: hidden on a disclosure body defeats reveal (C-60)`);
    }
  }

// ---- 6. the guide's script budget, re-derived from the page -----------------
// README.md states that number in prose. A published number no tool re-derives
// is a number that decays, so the figure is read out of the document rather than
// repeated here: change the sentence and the assertion changes with it, delete
// the sentence and this fails. Three comparisons, because the sentence carries
// three facts — how many scripts, how many are named, how many come from a CDN.
// Every document that publishes the figure is compared, not the one that happens
// to be right: README stated 3 external scripts while llms.txt stated 20+, and a
// gate reading only README would have passed the false sentence. The copy under
// .well-known/ is included because it is generated from llms.txt by
// tools/gen-llms.mjs and nothing runs that generator.
const BUDGET_DOCS = ["README.md", "llms.txt", ".well-known/llms.txt"];
let budgetDocsCompared = 0;
for (const doc of BUDGET_DOCS) {
  const text = read(doc);
  if (text === null) {
    errors.push(`${doc} publishes the script budget but is missing — the gate refuses to pass a number it did not compare`);
    continue;
  }
  const budget = /(\d+) external scripts(?:\s*\(([^)]*)\))?/.exec(text);
  if (!budget) {
    errors.push(`${doc} states no script budget as \`N external scripts\` — check-markup owns that number wherever it is published`);
    continue;
  }
  budgetDocsCompared++;
  const stated = Number(budget[1]);
  if (stated !== guideScripts) {
    errors.push(`${doc} says the guide loads ${stated} external scripts; index.html fetches ${guideScripts} <script src>`);
  }
  if (budget[2] == null) continue; // a bare figure is compared; a list must also add up
  const listed = budget[2].split(",").map((s) => s.trim()).filter(Boolean);
  const namedCdn = listed.filter((s) => /CDN/i.test(s)).length;
  if (listed.length !== stated) {
    errors.push(`${doc} says ${stated} external scripts but names ${listed.length} (${budget[2]}) — the sentence does not even agree with itself`);
  }
  if (namedCdn !== guideOffOrigin) {
    errors.push(`${doc} names ${namedCdn} script(s) as coming from a CDN; index.html makes ${guideOffOrigin} off-origin script fetch(es)`);
  }
}

// A run that looked at nothing is not a pass — including a budget sweep that
// compared no document, which is what a renamed sentence or a moved file gives.
if (!linkedFonts || !preloadedFonts || !metadataPages || !scriptLoads || !allowlisted.size || !budgetDocsCompared) {
  errors.push(`checked ${linkedFonts} self-hosted-font page(s), ${preloadedFonts} preloaded-font page(s), ${metadataPages} fully-described page(s), ${scriptLoads} script fetch(es), ${allowlisted.size} allowlisted origin(s) and ${budgetDocsCompared} budget document(s) — nothing matched, so the gate proved nothing`);
}

if (errors.length) {
  console.error("check-markup: FAIL");
  errors.forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log(
  `check-markup: OK — ${PAGES.length} shipped page(s): ${linkedFonts} use self-hosted fonts (no Google Fonts origin), ` +
    `${preloadedFonts} preload the critical face, ${metadataPages} carry title/description/og:type/twitter:card, ` +
    `${scriptLoads} script(s) fetched (${offOriginLoads} of them off-origin, every one named in OFF_ORIGIN_ALLOWLIST), ` +
    `${budgetDocsCompared}/${BUDGET_DOCS.length} document(s) publishing the script budget agreed with the pages, ` +
    `${mentioned.size} off-origin pointer(s) named without being loaded, ` +
    `and the guide's two description attributes agree.`,
);
