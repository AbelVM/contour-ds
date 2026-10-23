/**
 * CSS → DTCG 2025.10. The token export is generated from `src/css/tokens.css`
 * and never hand-edited; the stylesheet stays the source of truth, because the
 * Format Module cannot carry the hue knob, `light-dark()` or a subtree scope,
 * and a document that pretends otherwise is a document that lies.
 *
 * Two hard rules, both learned the expensive way in this repository:
 *
 *  1. Every count and every value comes from `tools/lib/inventory.mjs`. The
 *     build used to keep its own idea of the token layer, which is how
 *     `contour.tokens.json` published 151 tokens while the census reported 273
 *     and both looked internally consistent.
 *  2. Nothing is dropped silently. A declared value with no lawful
 *     representation is *named* in a refusal ledger with a public reason, and
 *     the gate requires exported + refused to equal the census exactly. A
 *     partial export that prints a confident count is the failure this file
 *     exists to prevent.
 *
 * The grammar below was measured against an independent implementation of the
 * spec (dembrandt's DTCG validator), not read off a summary: dimension units are
 * `px` and `rem` only; oklch lightness is range-checked 0..1; a `{ref}` to a
 * token that is not in the document is an error; `shadow` requires `spread`;
 * `strokeStyle` requires a `lineCap` a dash token never states; and token names
 * may not contain `.`, `{`, `}` or `"`.
 */

import { lightDarkPair, topLevelSplit } from "./lightdark.mjs";

export const FORMAT_SCHEMA = "https://www.designtokens.org/TR/2025.10/format/";
export const RESOLVER_VERSION = "2025.10";

/**
 * The closed vocabulary of refusals. A reason not in this map is a bug in the
 * exporter, so the gate fails rather than shipping an unlabelled gap.
 */
export const REFUSALS = {
  "unit-not-expressible": "the Format Module allows only px and rem; the declared length is in another unit",
  "fluid-value": "clamp()/min()/max() resolve per viewport, so there is no single value to publish",
  "gradient-value": "a CSS gradient is not the array of stops the gradient type requires",
  "dash-list": "strokeStyle needs a lineCap that a dash token never states; inventing one would be a new claim",
  "composite-value": "a computed expression over other tokens, or a multi-part value (a shadow list, a length with a style), that is not one typed value",
  "alias-target-refused": "the token it aliases is itself refused, so a reference would dangle",
  "alias-target-unknown": "the value aliases a custom property that is not declared in the token layer",
  "colour-not-parseable": "not a colour literal this exporter can read without guessing",
  "value-not-classified": "the exporter reached the end of its rules without a type — treat as a defect",
};

/**
 * `--brand-600` → `{group: "brand", leaf: "600"}`, so its reference is
 * `{brand.600}` — the form that carries lineage, where `var(--brand-600)`
 * destroyed it.
 *
 * The rule is one split, on the first hyphen, and it puts EVERY token at
 * `group.leaf`. A single-segment name takes the group for both halves:
 * `--density` → `density.density`, `--hairline` → `hairline.hairline`. That is
 * not a flourish. The first version of this file put `--density` at the root as
 * `density` and `--density-compact` inside a group called `density`, so the two
 * writes merged into one object holding both a `$value` and children — three
 * tokens vanished from a 243-token export while every count still added up, and
 * only the validator's own tally (240) gave it away. A name cannot be a token
 * and a group at the same level, so this rule makes that state unreachable
 * rather than detecting it after the fact.
 *
 * The mapping stays reversible: strip `--`, and a leaf equal to its group means
 * the CSS name was that one segment.
 */
function tokenPath(name) {
  const bare = name.replace(/^--/, "");
  const i = bare.indexOf("-");
  if (i < 0) return { group: bare, leaf: bare };
  return { group: bare.slice(0, i), leaf: bare.slice(i + 1) };
}

const pathOf = (name) => {
  const { group, leaf } = tokenPath(name);
  return `${group}.${leaf}`;
};

/**
 * The exact inverse of `tokenPath`, so a published path names the CSS custom
 * property it came from. The export gate needs that sum to balance and the
 * census needs the name to read the declared text; this is why it lives beside
 * the rule rather than being re-derived there. `density.density` reverses to
 * `--density`, which is the one case a naive `--` + path.join("-") gets wrong.
 */
export function nameFromPath(path) {
  const i = path.indexOf(".");
  if (i < 0) return `--${path}`;
  const group = path.slice(0, i);
  const leaf = path.slice(i + 1);
  return leaf === group ? `--${group}` : `--${group}-${leaf}`;
}

/** A number written bare or as a percentage: `51%` → 0.51, `1.25` → 1.25. */
function num(text) {
  const m = String(text).match(/^(-?(?:\d+\.?\d*|\.\d+))(%)?$/);
  if (!m) return null;
  return m[2] ? Number(m[1]) / 100 : Number(m[1]);
}

function color(colorSpace, components, alpha) {
  const value = { colorSpace, components };
  if (alpha !== undefined) value.alpha = alpha;
  return value;
}

/**
 * Read a colour literal into `{colorSpace, components, alpha}`.
 *
 * The components are the author's own numbers with the percentage notation
 * scaled out — never a colour conversion. An independent library resolves
 * colours through 8-bit sRGB, which would quantize `oklch(51% 0.016 230)` by up
 * to 6/255 in a channel and quietly restate the palette as an approximation of
 * itself.
 */
function colourFromLiteral(value) {
  const v = value.replace(/\s+/g, " ").trim();

  const hex = v.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    const h = hex[1];
    if (h.length === 3 || h.length === 4) {
      const d = (c) => parseInt(c + c, 16) / 255;
      return color("srgb", [d(h[0]), d(h[1]), d(h[2])], h.length === 4 ? d(h[3]) : undefined);
    }
    if (h.length === 6 || h.length === 8) {
      const at = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
      return color("srgb", [at(0), at(2), at(4)], h.length === 8 ? at(6) : undefined);
    }
    return null;
  }

  const call = v.match(/^(oklch|oklab|lab|lch|rgb|hsl|color)\(([^)]*)\)$/i);
  if (!call) return null;
  const fn = call[1].toLowerCase();
  const body = call[2].trim();
  const slash = body.indexOf("/");
  const alpha = slash < 0 ? undefined : num(body.slice(slash + 1).trim());
  if (slash >= 0 && alpha === undefined) return null;

  const parts = (slash < 0 ? body : body.slice(0, slash)).trim().split(/[\s,]+/).filter(Boolean);
  if (fn === "color") {
    if (parts.length < 2) return null;
    const comps = parts.slice(1).map(num);
    if (!/^[a-z0-9-]+$/i.test(parts[0]) || comps.some((c) => c === null)) return null;
    return color(parts[0], comps, alpha);
  }
  if (parts.length < 3) return null;
  const comps = parts.slice(0, 3).map(num);
  if (comps.some((c) => c === null)) return null;
  // rgb() channels are 0-255 and a percentage lightness is 0-100: both are
  // written to the 0-1 the type expects. Hues and a*/b* stay as authored.
  if (fn === "rgb") return color("srgb", comps.map((c) => c / 255), alpha);
  if (fn === "hsl") return color("hsl", [comps[0], comps[1] / 100, comps[2] / 100], alpha);
  return color(fn, comps, alpha);
}

/**
 * Substitute a numeric knob for the number it declares.
 *
 * `oklch(61% 0.115 var(--brand-hue))` cannot be a component, so the knob is
 * resolved to the value the stylesheet itself declares and the result is
 * *annotated*. The annotation is the point: without it a design tool would read
 * a fixed hue and conclude the knob does not exist — the kind of confident,
 * undocumented loss this repository keeps having to re-find.
 */
function resolveKnobs(value, knobs) {
  let used = null;
  const out = String(value).replace(/var\(\s*(--[a-z0-9-]+)\s*\)/g, (whole, name) => {
    if (!(name in knobs)) return whole;
    (used ||= []).push(name);
    return String(knobs[name]);
  });
  return { value: out.replace(/\s+/g, " ").trim(), used };
}

/** `calc(<length> * <number>)` — the one arithmetic form the token layer uses. */
function calcScaled(text) {
  const m = String(text).match(/^calc\(\s*(-?[\d.]+)(px|rem)\s*\*\s*(-?(?:\d+\.?\d*))\s*\)$/);
  if (!m) return null;
  return { value: Number(m[1]) * Number(m[3]), unit: m[2] };
}

/**
 * One declared value → one typed token, or a refusal with a public reason.
 *
 * `target(name)` answers for a token this one references: `undefined` when it is
 * not decided yet, `{refused}` when it was refused, `{entry}` when it exported.
 * An alias to a refused token must refuse too, or the document would carry a
 * `{ref}` that resolves to nothing — which the validator reports as an error, and
 * which we must therefore report ourselves before the artifact ships.
 */
function classify(value, knobs, target) {
  const trimmed = String(value).replace(/\s+/g, " ").trim();

  const alias = trimmed.match(/^var\((--[a-z0-9-]+)\)$/);
  if (alias) {
    const t = target(alias[1]);
    if (t === undefined) return { pending: true };
    if (t.refused) return { refuse: "alias-target-refused", detail: alias[1] };
    return { type: "alias", ref: alias[1] };
  }

  const pair = lightDarkPair(trimmed);
  if (pair) {
    const light = classify(pair.light, knobs, target);
    const dark = classify(pair.dark, knobs, target);
    if (light.pending || dark.pending) return { pending: true };
    const bad = light.refuse || dark.refuse;
    if (bad) return { refuse: bad, detail: light.detail || dark.detail };
    // The two branches need not be written the same way. `light-dark(oklch(100% 0
    // 0), var(--basalt-950))` is a colour in both themes — one authored as a
    // literal, one as an alias — and refusing it because the TEXT differs would
    // drop the surfaces, which is the semantic layer the export exists to carry.
    // So: both branches must be colour-ish, and the published type is the light
    // branch's, with an alias on either side staying a reference.
    const colourish = (e) => e.type === "color" || e.type === "alias" || e.type === "pair";
    if (!colourish(light) || !colourish(dark)) {
      return { refuse: "value-not-classified", detail: `theme branches hold different types (${light.type}/${dark.type})` };
    }
    return { type: "pair", pairType: light.type === "alias" ? "alias" : light.type, light, dark };
  }

  // A `light-dark()` that is not the whole value — `0 1px 2px light-dark(A, B)` —
  // has no legal form: there is no colour token to publish, only a shadow whose
  // colour changes per theme, and the shadow type cannot carry two of them.
  if (/light-dark\(/.test(trimmed)) return { refuse: "composite-value", detail: "light-dark() inside a composition" };

  const sub = resolveKnobs(trimmed, knobs);
  if (sub.used) {
    const resolved = colourFromLiteral(sub.value);
    if (resolved) return { type: "color", value: resolved, knob: sub.used, declared: trimmed };
    const calc = calcScaled(sub.value);
    if (calc) return { type: "dimension", value: calc, knob: sub.used, declared: trimmed };
    return { refuse: "colour-not-parseable", detail: `knob substitution left ${sub.value.slice(0, 40)}` };
  }

  const calc = calcScaled(trimmed);
  if (calc) return { type: "dimension", value: calc };

  const literal = colourFromLiteral(trimmed);
  if (literal) return { type: "color", value: literal };
  if (/^(oklch|oklab|lab|lch|rgb|hsl|color)\(/i.test(trimmed) || /^#[0-9a-f]{3,8}$/i.test(trimmed)) {
    return { refuse: "colour-not-parseable" };
  }

  const len = trimmed.match(/^(-?[\d.]+)(rem|px|em|ex|ch|%|vw|vh|deg|s|ms)$/);
  if (len) {
    if (len[2] === "ms" || len[2] === "s") return { type: "duration", value: { value: Number(len[1]), unit: len[2] } };
    if (len[2] !== "rem" && len[2] !== "px") return { refuse: "unit-not-expressible", detail: len[2] };
    return { type: "dimension", value: { value: Number(len[1]), unit: len[2] } };
  }

  if (/^(clamp|min|max)\(/i.test(trimmed)) return { refuse: "fluid-value" };
  if (/gradient\(/i.test(trimmed)) return { refuse: "gradient-value" };
  if (/^cubic-bezier\(([^)]*)\)$/i.test(trimmed)) {
    const nums = trimmed.match(/-?[\d.]+/g).map(Number);
    if (nums.length !== 4) return { refuse: "colour-not-parseable", detail: "cubic-bezier arity" };
    return { type: "cubicBezier", value: nums };
  }
  if (/^-?[\d.]+$/.test(trimmed)) return { type: "number", value: Number(trimmed) };
  if (/^none$/i.test(trimmed) || /^[\d. ]+$/.test(trimmed)) return { refuse: "dash-list" };

  // `<length> solid <colour>` is the border type, and both halves can stay
  // references, so the lineage survives the shorthand.
  const border = trimmed.match(/^var\((--[a-z0-9-]+)\)\s+(solid|dashed|dotted|double|groove|ridge|outset|inset)\s+var\((--[a-z0-9-]+)\)$/i);
  if (border) {
    const [, w, style, c] = border;
    const tw = target(w);
    const tc = target(c);
    if (tw === undefined || tc === undefined) return { pending: true };
    if (tw.refused || tc.refused) return { refuse: "alias-target-refused", detail: tw.refused ? w : c };
    return { type: "border", width: w, style, colour: c };
  }

  const stack = topLevelSplit(trimmed);
  if (stack.length > 1 && stack.every((p) => !/[(),]/.test(p) && /^[a-z0-9 "'-]+$/i.test(p))) {
    return { type: "fontFamily", value: stack.map((p) => p.replace(/^"|"$/g, "")) };
  }

  // Anything still holding a var() is an expression over other tokens.
  if (/var\(/.test(trimmed)) return { refuse: "composite-value", detail: "expression over var()" };

  return { refuse: "value-not-classified", detail: trimmed.slice(0, 60) };
}

/**
 * Harvest `$description` from the stylesheet's own prose — a trailing comment on
 * the declaration line, or the multi-line block comment that sits directly above
 * it. Nothing here invents a sentence: a description the exporter wrote itself
 * would be a claim with no author.
 *
 * The block comments used to be discarded on the theory that they are prose about
 * a mechanism rather than a definition. That theory was tested against the
 * artifact and it was wrong: it left the semantic layer with 0 descriptions of 95
 * published tokens, because the file's real definitions ARE block comments —
 * "Control edge: the border of an input, select, textarea or secondary/outline
 * button. Must clear 3:1 against every surface it can sit on (WCAG 1.4.11)" is
 * `--color-control-edge`'s definition, and "Filled surfaces need one extra step of
 * depth so white text clears 4.5:1" is `--color-primary-solid`'s rationale. An
 * export that reads the stylesheet and publishes none of what it says is barely an
 * export.
 *
 * Attribution is deliberately narrow, because a block heading a run of tokens must
 * not be pasted onto all of them: a block becomes a token's description only when
 * the block's last line is the nearest non-blank line above THAT declaration, so it
 * is the first thing the author commented on. The section banner is still tracked
 * separately, for the group descriptions.
 */
function commentMap(css) {
  const lines = css.split("\n");

  // Pass 1: every comment span by line. A span is multi-line when its `*/` lands
  // on a later line than its `/*`.
  const spanByStart = new Map();
  for (let i = 0; i < lines.length; i++) {
    const head = lines[i].trim();
    if (!head.startsWith("/*")) continue;
    if (head.endsWith("*/")) {
      spanByStart.set(i, { start: i, end: i, text: head });
      continue;
    }
    for (let j = i + 1; j < lines.length; j++) {
      const body = lines[j].trim();
      if (body.endsWith("*/")) {
        spanByStart.set(i, { start: i, end: j, text: [head, ...lines.slice(i + 1, j + 1).map((l) => l.trim())].join("\n") });
        break;
      }
    }
  }
  const spanEndsAt = new Map();
  for (const [start, span] of spanByStart) spanEndsAt.set(span.end, span);

  // One parser for both jobs. The previous version carried two cleaners whose
  // rules disagreed — one called a line a heading only for a run of six or more
  // dashes, the other stripped a dash run of any length — so the block above
  // `--color-heat-1`, whose heading ends in just two dashes, was read as prose
  // and shipped `-- Heat scale (multi-hue, …) --` as that token's description.
  // Two rules for one question is how a document starts lying about itself.
  //
  // A decorative rule is `=====`, `-----` or a line of nothing but punctuation;
  // runs of six or more dashes inside a line are stripped. Shorter runs stay, so
  // `--color-surface-3`, `34-inch`, `light-dark()` and `--chart-seq-*` survive.
  const PUNCT_LINE = /^[\s\-–—=*.]+$/;
  const DECORATED = /^[-–—]{2,}[\s(]|[\s)][-–—]{2,}$|[-–—]{6,}/;
  const stripDecor = (s) =>
    s
      .replace(/[-–—]{6,}/g, " ")
      .replace(/^[-–—\s]+/, "")
      .replace(/[-–—\s]+$/, "")
      .replace(/^[0-9]+\.\s*/, "")
      .replace(/\s+/g, " ")
      .trim();
  const joinLines = (ls) => ls.join(" ").replace(/[-–—]{6,}/g, " ").replace(/\s+/g, " ").trim();

  /** @returns {{heading: string|null, prose: string|null}} */
  function parseSpan(text) {
    const raw = text
      .replace(/^\/\*+\s*/, "")
      .replace(/\s*\*\/\s*$/, "")
      .split("\n")
      .map((l) => l.replace(/^\s*\*\s?/, "").trim())
      .filter(Boolean);
    const lines = raw.filter((l) => !PUNCT_LINE.test(l));
    if (!lines.length) return { heading: null, prose: null };

    if (DECORATED.test(lines[0])) {
      const heading = stripDecor(lines[0]);
      const prose = lines.length > 1 ? joinLines(lines.slice(1)) : "";
      return { heading: heading || null, prose: prose.length > 3 ? prose : null };
    }
    // A lone content line is a heading, never a definition. If it also became
    // prose, the numbered section banners ("1. PRIMITIVES — Basalt (cool ink
    // neutrals)") would be pasted onto the first token under them, which is the
    // mis-attribution this whole parser exists to avoid.
    if (lines.length === 1) {
      const lone = stripDecor(lines[0]);
      return { heading: lone.length > 2 && lone.length < 62 ? lone : null, prose: null };
    }
    const prose = joinLines(lines);
    return { heading: null, prose: prose.length > 3 ? prose : null };
  }

  const out = new Map();
  let banner = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (spanByStart.has(i)) {
      const span = spanByStart.get(i);
      span.parsed = parseSpan(span.text);
      const { heading } = span.parsed;
      if (heading && heading.length > 2 && heading.length < 62 && !heading.startsWith("@")) banner = heading;
      i = span.end;
      continue;
    }

    const decl = line.match(/(--[a-z0-9-]+)\s*:/);
    if (!decl) continue;
    // FIRST occurrence wins, matching the census. `tokens.css` re-declares a
    // dozen semantic tokens inside `.c-theme-scope`, and those later lines carry
    // no comment; writing unconditionally let the last occurrence overwrite the
    // first, which deleted `--color-primary-solid`'s own definition — the comment
    // "Filled surfaces need one extra step of depth so white text clears 4.5:1"
    // sat directly above line 310 and vanished because line ~576 said "none".
    if (out.has(decl[1])) continue;
    const trailing = line.match(/;\s*\/\*\s*(.+?)\s*\*\/\s*$/);

    let k = i - 1;
    while (k >= 0 && !lines[k].trim()) k -= 1;
    const above = k >= 0 ? spanEndsAt.get(k) : null;
    const block = above && above.end > above.start ? above.parsed?.prose ?? null : null;

    out.set(decl[1], {
      banner,
      trailing: trailing ? trailing[1].replace(/\s+/g, " ").trim() : null,
      block,
    });
  }
  return out;
}

const TYPE_OF = {
  color: "color",
  dimension: "dimension",
  duration: "duration",
  number: "number",
  cubicBezier: "cubicBezier",
  fontFamily: "fontFamily",
  border: "border",
  alias: null, // the type is inherited from the token the reference resolves to
};

const refFor = (name) => `{${pathOf(name)}}`;

/**
 * @param {Array<{name: string, value: string}>} declared the census, in order
 * @param {string} tokensCss the raw stylesheet, read for comments only
 */
export function buildDocuments(declared, tokensCss) {
  const comments = commentMap(tokensCss);
  const knobs = {};
  for (const { name, value } of declared) {
    const t = String(value).trim();
    if (/^-?[\d.]+$/.test(t)) knobs[name] = Number(t);
  }

  const names = new Set(declared.map((d) => d.name));
  const state = new Map();
  // A decided token is stored as either `{type, …}` (it exported) or
  // `{refused, reason, detail}`. `classify()` reports a refusal as `{refuse}`, and
  // every consumer here reads `.refused` — the first version of this file kept the
  // raw shape in `state`, so an alias to a refused token looked *not* refused and
  // published a `{ref}` to a token that was never in the document. Normalize on
  // write so there is one spelling of "refused" in this module.
  const target = (name) => {
    if (!names.has(name)) return { refused: true, reason: "alias-target-unknown", detail: name };
    return state.get(name);
  };
  const decide = (name, entry) => {
    state.set(name, entry.refuse ? { refused: true, reason: entry.refuse, detail: entry.detail } : entry);
  };

  // Dependencies first: a value that references another token can only be
  // decided once that token is decided, and references are not in file order
  // (`--container-gutter` aliases `--gutter`, declared later). So classify in
  // rounds, deferring anything whose target is still undecided, until a round
  // makes no progress — which is also how a reference cycle is found.
  const deps = (value) => [...String(value).matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]);
  let pending = declared.slice();
  for (let round = 0; round < 12 && pending.length; round++) {
    const later = [];
    for (const d of pending) {
      // A self-reference is not a dependency: `--brand-hue` is a knob and other
      // tokens read it, but nothing may read itself.
      const needs = deps(d.value).filter((n) => n !== d.name);
      if (needs.some((n) => !names.has(n))) {
        decide(d.name, { refuse: "alias-target-unknown", detail: needs.find((n) => !names.has(n)) });
        continue;
      }
      if (needs.some((n) => !state.has(n))) {
        later.push(d);
        continue;
      }
      const entry = classify(d.value, knobs, target);
      if (entry.pending) {
        later.push(d);
        continue;
      }
      decide(d.name, entry);
    }
    if (later.length === pending.length) {
      for (const d of later) decide(d.name, { refuse: "value-not-classified", detail: "reference cycle or undecided" });
      break;
    }
    pending = later;
  }
  for (const d of pending) if (!state.has(d.name)) decide(d.name, { refuse: "value-not-classified", detail: "never decided" });

  const tree = {};
  const dark = {};
  const refused = {};
  let exported = 0;
  let pairs = 0;

  const place = (dest, name, built) => {
    const { group, leaf } = tokenPath(name);
    const holder = group ? (dest[group] ||= {}) : dest;
    holder[leaf] = built;
  };

  const branchValue = (e) => (e.type === "alias" ? refFor(e.ref) : e.type === "border" ? borderValue(e) : e.value);
  const borderValue = (e) => ({ width: refFor(e.width), style: e.style, color: refFor(e.colour) });

  const build = (name, entry, declaredText, branch) => {
    const out = {};
    const type = entry.type === "pair" ? TYPE_OF[entry.pairType] : TYPE_OF[entry.type];
    if (type) out.$type = type;
    out.$value = entry.type === "pair" ? branchValue(branch === "dark" ? entry.dark : entry.light) : branchValue(entry);
    // A pair carries its knob on the BRANCH that used it, not on the pair itself:
    // `--color-on-primary: light-dark(oklch(99% 0.01 var(--brand-hue)),
    // var(--basalt-1000))` resolves a knob in one theme only. Reading just
    // `entry.knob` annotated none of them, so the export published a fixed hue
    // and stayed silent about the knob — which is the one thing a consumer must
    // not be left guessing, since the knob is the system's brand mechanism.
    const knobs = [...new Set([entry.knob, entry.light?.knob, entry.dark?.knob].filter(Boolean).flat())];
    const wantsKnob = branch === "dark" ? entry.dark?.knob : entry.knob || entry.light?.knob || entry.dark?.knob;
    if (wantsKnob && knobs.length) {
      // The dark branch says WHICH knob moved, not the declaration again: the
      // full `declared` text already sits on the base node, and copying it into
      // the override set doubled the byte cost of every hue-derived colour.
      out.$extensions = {
        "com.contour.css": branch === "dark" ? { "knob-resolved": knobs } : { "knob-resolved": knobs, declared: declaredText.replace(/\s+/g, " ").trim() },
      };
    }
    // A token's meaning is stated once, in the Format document. An override set
    // carries the value that differs and nothing else — repeating the prose there
    // is what pushed `contour.themes.json` from 20.0 kB to 21.3 kB while adding no
    // fact, and the size budget is the gate that said so.
    if (branch !== "dark") {
      const c = comments.get(name);
      const description = c ? c.trailing || c.block : null;
      if (description) out.$description = description;
    }
    return out;
  };

  for (const d of declared) {
    const s = state.get(d.name);
    if (s.refused) {
      const key = s.detail ? `${s.reason} (${s.detail})` : s.reason;
      (refused[key] ||= []).push(d.name);
      continue;
    }
    exported++;
    if (s.type === "pair") {
      pairs++;
      place(tree, d.name, build(d.name, s, d.value, "light"));
      place(dark, d.name, build(d.name, s, d.value, "dark"));
      continue;
    }
    place(tree, d.name, build(d.name, s, d.value));
  }

  const tokensDoc = { $schema: FORMAT_SCHEMA, ...tree };

  // A group gets the banner description only when every token under it shares
  // one; two banners means the group would inherit a sentence about half of it.
  const bannersByGroup = new Map();
  for (const d of declared) {
    const { group } = tokenPath(d.name);
    if (!group || !tokensDoc[group]) continue;
    const c = comments.get(d.name);
    if (!c || !c.banner) continue;
    (bannersByGroup.get(group) || bannersByGroup.set(group, new Set()).get(group)).add(c.banner);
  }
  for (const [group, set] of bannersByGroup) {
    if (set.size === 1) tokensDoc[group].$description = [...set][0];
  }

  const refusedCount = Object.values(refused).reduce((a, b) => a + b.length, 0);
  if (refusedCount) {
    tokensDoc.$extensions = {
      "com.contour.dtcg": {
        source: "src/css/tokens.css",
        statement:
          "Generated by tools/build.mjs; src/css stays the source of truth. The tokens named here are declared CSS the Format Module cannot represent, so a consumer must read the stylesheet for them — they are listed rather than dropped, and tools/check-export.mjs fails unless exported plus refused equals the census. Note what this document CANNOT say: a knob-resolved colour is published at the value :root declares, so the JSON describes the default theme only. Re-pointing --brand-hue works from :root and not from a subtree — that is why .c-theme-scope re-derives the whole brand layer rather than overriding one value — and a Resolver set carries themes, not an arbitrary hue. Read src/css for the mechanism.",
        refusedCount,
        reasons: Object.fromEntries(
          Object.entries(refused).map(([key, list]) => {
            const reason = key.split(" ")[0];
            return [key, { count: list.length, tokens: list, because: REFUSALS[reason] || "see the reason key" }];
          }),
        ),
      },
    };
  }

  const resolverDoc = {
    version: RESOLVER_VERSION,
    name: "Contour",
    description:
      "Contour's theme axis is `color-scheme` plus `light-dark()` in CSS, which the Format Module cannot carry: a token there has one value. So every token whose declaration is a top-level light-dark() pair publishes its light branch in contour.tokens.json — that document IS the light theme — and this set carries the dark branch. Applying `dark` over the base document gives the dark theme; the base document alone is complete. Generated, never hand-edited: src/css/tokens.css remains the source of truth.",
    sets: {
      dark: {
        description: `The dark branch of every light-dark() pair in the token layer (${pairs} tokens).`,
        sources: [{ tokens: dark }],
      },
    },
    resolutionOrder: [{ $ref: "#/sets/dark" }],
  };

  return {
    tokensDoc,
    resolverDoc,
    stats: { declared: declared.length, exported, refused: refusedCount, pairs },
    refused,
    state,
  };
}
