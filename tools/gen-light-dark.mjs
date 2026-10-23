#!/usr/bin/env node
/**
 * The light-dark() fallback layer (C-51) — generated, never hand-written.
 *
 * `light-dark()` is Baseline newly-available since May 2024 and becomes WIDELY
 * available on 2026-11-13. Until that date a real share of readers sit on an
 * engine without it, and the failure is not graceful:
 *
 *   an UNREGISTERED custom property accepts any token sequence, so
 *   `--color-canvas: light-dark(a, b)` parses fine and stores the text. The
 *   break happens one step later, when `var(--color-canvas)` is substituted into
 *   `background:` — the declaration is then invalid at computed-value time and
 *   the property falls to its initial value. Every theme-sensitive token in the
 *   system paints nothing.
 *
 * So the fix overrides the custom properties themselves, with the branch the
 * engine can parse, only on engines that cannot parse the function. Three rules:
 *
 *   1. Guard on the VALUE: `@supports not (color: light-dark(white, black))`.
 *      `@supports (color: var(--x))` is ALWAYS true — var() is valid syntax
 *      wherever a property value may go — so that guard would ship a fallback
 *      that also applies to modern engines and freeze the palette at light.
 *   2. Reuse `tools/lib/lightdark.mjs`, the one parser this repo already has.
 *      Two parsers is how `contour.tokens.json` came to hold 151 tokens while
 *      the census reported 273 and both looked self-consistent.
 *   3. Only a value that is EXACTLY one top-level `light-dark()` call is a
 *      two-theme token. A composition that merely contains one is reported and
 *      skipped, never guessed at.
 *
 * Dark still works, because `color-scheme` is Baseline widely available since
 * 2023-12-26 — three months WIDER than `light-dark()`. An engine with the scheme
 * and not the function is exactly the case this file serves, so it gets the dark
 * branch twice over: from `@media (prefers-color-scheme: dark)` for the OS, and
 * from the manual `<meta name="color-scheme">` flip that base.css already maps
 * onto `color-scheme`. Without the second, a manual flip on an old engine would
 * repaint the form controls dark and leave every token light.
 *
 * Idempotent by design: run it twice, the bytes are identical. AGENTS.md rule 8
 * is about every round trip, not only the HTML one.
 *
 *   node tools/gen-light-dark.mjs           write src/css/light-dark-fallback.css
 *   node tools/gen-light-dark.mjs --check   fail if it is stale or absent  (CI)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { lightDarkPair, resolveLightDark } from "./lib/lightdark.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const CSS = join(ROOT, "src/css");
const OUT = join(CSS, "light-dark-fallback.css");
const CHECK = process.argv.includes("--check");

// The files that declare theme-sensitive tokens, and the layer each belongs to.
// The layer must be preserved: utilities wins over tokens, so a `prefers-contrast`
// override emitted into the tokens layer would silently stop overriding.
const SOURCES = [
  ["tokens.css", "tokens"],
  ["utilities.css", "utilities"],
];

const uncomment = (t) => t.replace(/\/\*[\s\S]*?\*\//g, " ");

/**
 * Walk a stylesheet for `selector { … }` blocks with their `@media` chain and
 * `@layer`. Braces are counted. A block whose depth goes NEGATIVE is an early
 * close, and counting alone cannot see it: the total still balances, and the
 * parser returns a body that is really the tail of another rule. So depth < 0
 * throws, and so does a block that never closes.
 */
function blocks(css, file) {
  const out = [];
  const stack = [];
  let i = 0;
  let text = css;
  while (i < text.length) {
    const open = text.indexOf("{", i);
    if (open < 0) break;
    const head = text.slice(i, open).trim();
    // Counting depth cannot see an EARLY close: `@layer tokens { :root { … } } }`
    // still ends balanced, and the parser returns a body that is the tail of a
    // different rule. A `}` inside a selector head is that close, so it throws
    // instead of producing a confidently wrong block.
    if (head.includes("}")) throw new Error(`${file}: a } closes a block before "${head.slice(-48)}" opens one`);
    let depth = 1;
    let j = open + 1;
    let early = false;
    while (j < text.length && depth > 0) {
      if (text[j] === "{") depth++;
      else if (text[j] === "}") depth--;
      if (depth < 0) {
        early = true;
        break;
      }
      j++;
    }
    if (early) throw new Error(`${file}: a } closes a block that never opened near "${head.slice(0, 48)}"`);
    if (depth !== 0) throw new Error(`${file}: unclosed block starting at "${head.slice(0, 48)}"`);
    const body = text.slice(open + 1, j - 1);
    if (/^@media/.test(head)) {
      stack.push(head);
      out.push(...blocks(body, file));
      stack.pop();
    } else if (/^@/.test(head)) {
      out.push(...blocks(body, file)); // @layer, @keyframes: no selectors of their own
    } else {
      out.push({ selector: head.replace(/\s+/g, " "), body, media: stack.slice() });
    }
    i = j;
  }
  return out;
}

const entries = [];
const unresolvable = [];
let pairs = 0;
let compositions = 0;

for (const [f, layer] of SOURCES) {
  const path = join(CSS, f);
  if (!existsSync(path)) continue;
  for (const b of blocks(uncomment(readFileSync(path, "utf8")), f)) {
    for (const stmt of b.body.split(";")) {
      const m = /^\s*(--[a-z0-9-]+)\s*:([\s\S]+)$/.exec(stmt);
      if (!m) continue;
      const name = m[1];
      const value = m[2].trim();
      if (!/\blight-dark\(/.test(value)) continue;
      const pair = lightDarkPair(value);
      if (pair) {
        pairs++;
        entries.push({ layer, file: f, media: b.media, selector: b.selector, name, light: pair.light, dark: pair.dark });
        continue;
      }
      // Not a two-theme token, but every call inside it can still be
      // substituted: `0 1px 2px light-dark(A, B)` is not a colour that can be
      // published as two themes, yet leaving the text intact makes the whole
      // declaration invalid at computed-value time and the shadow disappears.
      const l = resolveLightDark(value, "light");
      const d = resolveLightDark(value, "dark");
      if (!l || !d || !l.changed) {
        unresolvable.push({ file: f, name, value });
        continue;
      }
      compositions++;
      entries.push({ layer, file: f, media: b.media, selector: b.selector, name, light: l.value, dark: d.value });
    }
  }
}

if (!pairs) {
  console.error("gen-light-dark: FAIL — no top-level light-dark() token found, so there is nothing to fall back to");
  process.exit(1);
}

const FLIP_DARK = ':root:has(> head > meta[name="color-scheme"][content="dark"])';
const FLIP_LIGHT = ':root:has(> head > meta[name="color-scheme"][content="light"])';

/** One rule block per (media chain, selector), declarations in source order. */
function rulesFor(list, mapSelector) {
  const map = new Map();
  for (const e of list) {
    const sel = mapSelector ? mapSelector(e) : e.selector;
    if (!sel) continue;
    const key = `${e.media.join("|")} >>> ${sel}`;
    if (!map.has(key)) map.set(key, { media: e.media, selector: sel, decls: [] });
    map.get(key).decls.push(`    ${e.name}: ${e.value};`);
  }
  return [...map.values()];
}

const fmt = (groups, indent) =>
  groups
    .map(({ media, selector, decls }) => {
      const pad = " ".repeat(indent);
      const rule = `${pad}${selector} {\n${decls.map((d) => pad + "  " + d.trim()).join("\n")}\n${pad}}`;
      if (!media.length) return rule;
      return media
        .slice()
        .reverse()
        .reduce((inner, q) => `${pad}${q} {\n${inner.split("\n").map((l) => "  " + l).join("\n")}\n${pad}}`, rule);
    })
    .join("\n\n");

const lightList = entries.map((e) => ({ ...e, value: e.light }));
const darkList = entries.map((e) => ({ ...e, value: e.dark }));

// Manual flip: the dark branch must reach the tokens, not only `color-scheme`.
// A scope selector becomes a descendant of the flipped root, so a subtree theme
// follows the flip the same way it follows light-dark() today.
const flip = (list, rootSel) =>
  rulesFor(list, (e) => (e.selector === ":root" ? rootSel : `${rootSel} ${e.selector}`));

const layers = [...new Set(entries.map((e) => e.layer))];
const body = layers
  .map((layer) => {
    const L = lightList.filter((e) => e.layer === layer);
    const D = darkList.filter((e) => e.layer === layer);
    // The dark rules MUST stay inside the media query. Emitted bare, they would
    // follow the light block at equal specificity and win, handing every engine
    // without light-dark() a permanently dark page.
    const osDark = fmt(rulesFor(D.filter((e) => !e.media.length)), 0);
    const mediaDark = fmt(rulesFor(D.filter((e) => e.media.length)), 0);
    const indent = (s, n) =>
      s
        ? s
            .split("\n")
            .map((l) => (l.trim() ? " ".repeat(n) + l : l))
            .join("\n")
        : "";
    const blocks = [
      `    /* The engine has no light-dark(): default to the light branch, because a\n` +
        `       reader who expressed no preference saw the light branch before this\n` +
        `       function existed. */\n` +
        indent(fmt(rulesFor(L), 0), 4),
      `    /* OS preference — the same switch light-dark() consults. */\n` +
        `    @media (prefers-color-scheme: dark) {\n` +
        indent(osDark, 6) +
        `\n    }`,
      mediaDark
        ? `    /* A dark branch declared inside its own @media (utilities carries\n` +
          `       prefers-contrast): keep that chain, or the override lands at the\n` +
          `       wrong precedence. */\n` +
          indent(mediaDark, 4)
        : null,
      `    /* The manual flip. base.css maps <meta name="color-scheme"> onto\n` +
        `       color-scheme with :has(); on an engine without light-dark() the scheme\n` +
        `       alone cannot pick a branch, so the tokens are re-pointed here too.\n` +
        `       Light is emitted AFTER dark: a reader who flips to light while the OS\n` +
        `       says dark has to win, and these selectors carry equal specificity. */\n` +
        indent(fmt(flip(D, FLIP_DARK), 0), 4) +
        `\n\n` +
        indent(fmt(flip(L, FLIP_LIGHT), 0), 4),
    ].filter(Boolean);
    return `@layer ${layer} {
  /* Guarded on the value, never on \`color: var(--x)\`, which is always true. */
  @supports not (color: light-dark(white, black)) {

${blocks.join("\n\n")}
  }
}`;
  })
  .join("\n\n");
const out = `/* GENERATED by tools/gen-light-dark.mjs — do not hand-edit.
   Regenerate:  node tools/gen-light-dark.mjs        Verify:  --check (CI lane)

   The light-dark() fallback (C-51).

   light-dark() is Baseline newly-available May 2024, widely available
   2026-11-13. color-scheme is years older than the function, and no Baseline
   date for it is asserted here: dates must be recomputed from
   web-features/browser-compat-data, not reused from a note, and a reused note is
   how this project has published a wrong one before. That gap between the two
   features is the population this file serves — an engine that knows the scheme
   but not the function.

   Why it breaks without this: an unregistered custom property accepts any token
   sequence, so \`--x: light-dark(a, b)\` parses and stores the TEXT; the failure
   is deferred to \`var(--x)\` substitution, which makes the real declaration
   invalid at computed-value time and drops it to its initial value.

   ${pairs} two-theme token(s) and ${compositions} composition(s) rewritten, from ${[
    ...new Set(entries.map((e) => e.file)),
  ].join(", ")}${
    unresolvable.length
      ? `; ${unresolvable.length} value(s) could not be parsed as two branches and are NOT rewritten: ` +
        unresolvable.map((s) => s.name).join(", ")
      : ""
  }.

   A composition is substituted, not split: \`0 1px 2px light-dark(A, B)\` is not
   a colour a tool can publish as two themes, but replacing the call with one
   branch is well-defined, and it is what keeps the shadow painted at all.

   Named theme sets still work: a [data-theme] block that re-points tokens with
   literals is parsed by every engine, which is why src/ ships the mechanism and
   no named set.
   ========================================================================= */

${body}
`;

if (CHECK) {
  if (!existsSync(OUT)) {
    console.error("gen-light-dark: FAIL — src/css/light-dark-fallback.css does not exist; run node tools/gen-light-dark.mjs");
    process.exit(1);
  }
  if (readFileSync(OUT, "utf8") !== out) {
    console.error("gen-light-dark: FAIL — the committed fallback is stale against src/css; run node tools/gen-light-dark.mjs");
    process.exit(1);
  }
  console.log(`gen-light-dark: OK — ${pairs} two-theme token(s) covered and the committed file matches src/css.`);
  process.exit(0);
}

writeFileSync(OUT, out, "utf-8");
console.log(`gen-light-dark: wrote src/css/light-dark-fallback.css — ${pairs} two-theme token(s) across ${layers.length} layer(s).`);
