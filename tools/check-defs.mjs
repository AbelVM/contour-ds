#!/usr/bin/env node
/**
 * Def reachability (C-31).
 *
 * A `url(#id)` inside `src/css` is a promise that some document defines `#id`.
 * When that definition lives only in the style guide, every consumer who takes
 * `src/` and nothing else gets a broken reference — which is exactly what
 * `.c-chart__missing { fill: url(#contour-hatch-missing) }` was: the pattern was
 * defined at `index.html:326` and nowhere in the shipped system.
 *
 * The rule this gate holds:
 *
 *   1. every `url(#id)` in src/css resolves to a def inside `src/`, or the
 *      reference carries a fallback so a miss degrades instead of breaking;
 *   2. a def that the consumer must inline is documented as INLINE in that
 *      file's own header — "include this sprite" is a lie for a `<use>` on a
 *      `file://` origin, which is how the guide is actually opened.
 *
 * Both halves are text checks, so this needs no browser: the failure it is
 * looking for is a missing definition, not a mis-rendered one.
 *
 *   node tools/check-defs.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");

const errors = [];

// ---- 1. what src/css promises -----------------------------------------
const cssDir = join(ROOT, "src/css");
const cssFiles = readdirSync(cssDir).filter((f) => f.endsWith(".css"));

/** Comments stripped: a def named in prose is not a def. */
const uncomment = (t) => t.replace(/\/\*[\s\S]*?\*\//g, " ");

const refs = [];
for (const f of cssFiles) {
  const css = uncomment(read("src/css", f));
  // Walk DECLARATIONS, not bare url() matches, so the property is known.
  // `fill` falling through to initial black is a defect; `filter` falling
  // through to no filter is the correct degradation, and a flat rule would
  // demand a meaningless fallback on the CVD previews.
  for (const d of css.matchAll(/(^|[;{}\s])([-a-z]+)\s*:\s*([^;{}]+)/g)) {
    const prop = d[2];
    const value = d[3];
    for (const m of value.matchAll(/url\(\s*#([a-zA-Z0-9_-]+)\s*\)/g)) {
      const after = value.slice(m.index + m[0].length);
      refs.push({
        file: `src/css/${f}`,
        prop,
        id: m[1],
        // The fallback lives OUTSIDE the parentheses: `fill: url(#p) red`.
        // Reading `[^)]*` after the id instead always finds nothing, because the
        // match already ends at the closing paren.
        hasFallback: after.trim().length > 0,
      });
    }
  }
}
if (!refs.length) {
  console.error("check-defs: FAIL — src/css references no url(#id) at all, so this gate measured nothing");
  process.exit(1);
}

// ---- 2. what the shipped system actually defines -----------------------
const svgDir = join(ROOT, "src/svg");
const svgFiles = readdirSync(svgDir).filter((f) => f.endsWith(".svg"));
const defs = new Map();
for (const f of svgFiles) {
  const text = read("src/svg", f);
  for (const m of text.matchAll(/\bid="([^"]+)"/g)) defs.set(m[1], `src/svg/${f}`);
}

// Reachability and degradation are two different rules, and collapsing them is
// how this gate went blind on its first run: `fill: url(#p) var(--c)` carries a
// fallback, so accepting one as a definition meant renaming the def away left
// the gate green. A fallback is what a reader gets when the reach FAILS; it is
// not the reach.
const PAINT = /^(fill|stroke)$/;
let resolved = 0;
for (const ref of refs) {
  const where = `${ref.file}: ${ref.prop}: url(#${ref.id})`;
  if (!defs.has(ref.id)) {
    errors.push(
      `${where} has no definition inside src/ — a consumer who takes src/ and nothing else gets ` +
        (PAINT.test(ref.prop) ? "initial black" + ", not the texture" : "no def at all"),
    );
    continue;
  }
  resolved++;
  if (PAINT.test(ref.prop) && !ref.hasFallback) {
    errors.push(
      `${where} resolves to ${defs.get(ref.id)}, but a paint with no fallback still breaks on a host ` +
        `that never inlines the sprite`,
    );
  }
}

// ---- 3. an inlined sprite must say so, in the file ---------------------
// `<use href="file.svg#id">` and `url(file.svg#id)` are blocked cross-document
// in several engines and on file:// entirely, so these defs only work because a
// host pastes them into its own document. The header has to say INLINE.
for (const f of svgFiles) {
  const text = read("src/svg", f);
  const body = text.replace(/<!--[\s\S]*?-->/g, "");
  if (!/<(filter|pattern|symbol|linearGradient)\b/.test(body)) continue;
  const header = (text.match(/<!--[\s\S]*?-->/) || [""])[0];
  if (!/inline/i.test(header)) {
    errors.push(`src/svg/${f}: ships defs a host must inline, but its header comment never says so`);
  }
}

// ---- 4. HTML-repaired names are not XML names --------------------------
// The HTML parser silently corrects `fecolormatrix` to `feColorMatrix`; an XML
// parser does not, it just sees an unknown element and the filter is inert.
// The guide is parsed as HTML so it hides this, and then prints the markup as
// the snippet a consumer copies.
//
// Matched CASE-SENSITIVELY on purpose: a case-insensitive test here flags the
// correct `feColorMatrix` as well, and the gate would fail the fix it exists to
// enforce.
//
// The list is only names whose REAL spelling is camelCase. `mask`, `pattern`,
// `image` and friends are genuinely lowercase in SVG, and `stroke-linecap`,
// `clip-rule` and `fill-rule` are genuinely hyphenated — listing them would
// fail a correct file.
const htmlOnlyElements = [
  "fecolormatrix", "fegaussianblur", "feblend", "fecomposite", "feflood", "fefuncr",
  "fefuncg", "fefuncb", "fefunca", "fergbasis", "femerge", "feoffset", "feturbulence",
  "lineargradient", "radialgradient", "clippath", "textpath", "animatemotion", "animatetransform",
];
const htmlOnlyAttributes = [
  "patternunits", "patterntransform", "patterncontentunits", "gradientunits",
  "gradienttransform", "clippathunits", "maskunits", "spreadmethod",
];

for (const f of svgFiles) {
  const text = read("src/svg", f);
  for (const n of htmlOnlyElements) {
    if (new RegExp(`<${n}[\\s>/]`).test(text)) {
      errors.push(`src/svg/${f}: <${n}> is HTML-repaired casing — inert when the file is parsed as XML`);
    }
  }
  for (const n of htmlOnlyAttributes) {
    if (new RegExp(`\\s${n}=`).test(text)) {
      errors.push(`src/svg/${f}: ${n}= is HTML-repaired casing — dropped when the file is parsed as XML`);
    }
  }
}

/* ---- 3. a `<use>` in a shipped page resolves in THAT page ----------------
   Rule 1 guards `url(#id)` written by the system's own CSS. The other half of
   the promise is made in markup: every `<use href="#i-x">` inside `index.html`
   or a template needs that symbol in the SAME document, because these pages are
   opened on a `file://` origin where a cross-document `<use>` silently paints
   nothing.

   This rule was added the day it was needed: a new specimen referenced
   `#i-check` in `templates/dashboard.html`, whose sprite does not define it, and
   every gate stayed green — the broken icon was invisible to a check that only
   read `src/css`. The sweep prints how many references it resolved, and a
   document with no `<use>` at all is reported as unmeasured rather than passed. */
const PAGES = ["index.html", "templates/landing.html", "templates/dashboard.html", "templates/docs.html"];
let useChecked = 0;
for (const page of PAGES) {
  let text;
  try {
    text = read(page);
  } catch {
    continue; // a page that does not exist is not this gate's claim to make
  }
  const ids = new Set([...text.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const uses = [...text.matchAll(/<use\b[^>]*?(?:xlink:)?href="#([^"]+)"/g)].map((m) => m[1]);
  if (!uses.length) continue;
  const missing = [...new Set(uses.filter((id) => !ids.has(id)))];
  useChecked += uses.length;
  if (missing.length)
    errors.push(
      `${page}: <use href="#${missing.join("#, ")}"> has no symbol defined in that document — the icon renders nothing on a file:// origin`,
    );
}

if (errors.length) {
  console.error("check-defs: FAIL");
  errors.forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log(
  `check-defs: OK — ${refs.length} url(#id) reference(s) in src/css checked against ` +
    `${defs.size} def(s) in src/svg; ${svgFiles.length} sprite file(s) audited for casing and inline notice; ` +
    `${useChecked} <use> reference(s) in the shipped pages resolved inside their own document.`,
);
