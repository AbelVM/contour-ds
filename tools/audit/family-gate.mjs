// Run libreship's token gate (scripts/check-widget-tokens.mjs) against Contour's
// stylesheet, adapted to Contour's token names and to the oklch() colour space.
// Run: node tools/audit/family-gate.mjs
//
// This is the ONLY gate in the repository that enforces "no raw colour literal, read
// a token" — `check-tokens.mjs` owns the census and the unread ledger, not colour
// literals. So the ledger below is the whole of that rule's exception path, and it is
// written as named entries rather than one loose regex.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

// Derived from this file, like every other gate. It used to be the literal
// "/data/projects/DS/src/css", which confined the only check that really enforces
// "no raw hex, read a token" to one machine — and worse than crashing, it silently
// scanned THIS repo when run from any other tree. Proven by A/B: a copy holding
// `color: #ff0000` reported 0 mentions and exit 0 before the fix, 6 mentions and
// exit 1 after. A gate that cannot read the tree it stands in is not a gate.
const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const DIR = join(ROOT, "src/css");
// Guarded before readdirSync, not after it: on a missing directory readdirSync threw
// ENOENT out of the module top level, so the "compared nothing" verdict below was
// unreachable exactly when it was needed. A crash and a check are not the same thing.
if (!existsSync(DIR)) {
  console.error(`family-gate: ${DIR} does not exist — the sweep compared nothing, which is not a pass`);
  process.exit(1);
}
const files = readdirSync(DIR).filter((f) => f.endsWith(".css"));
if (!files.length) {
  console.error(`family-gate: no .css files found in ${DIR} — the sweep compared nothing, which is not a pass`);
  process.exit(1);
}

// The upstream gate's two literals. oklch() is Contour's colour space, so the
// adapted gate adds it.
const COLOUR_UPSTREAM = /#[0-9a-fA-F]{3,8}\b|\brgba?\(/;
const COLOUR_ADAPTED = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\boklch\(|\boklab\(|\bhsl\(/;

/*
 * Named colours, which neither literal above can ever reach.
 *
 * Every branch of COLOUR_ADAPTED is a hash or a function name, so a bare CSS colour
 * keyword is invisible to it by construction: `color: red` sails through, and the gate
 * certifies the tree clean. This is not hypothetical — `src/css/utilities.css` carries a
 * comment saying its old `background: white; color: black` sat in a print block that
 * "no colour gate could see", because the vocabulary "matched none of them".
 *
 * The fix cannot be a wider regex. `white`, `black` and `red` are ordinary English words
 * that appear in `white-space`, `print-color-adjust: exact` and `color-scheme: light`,
 * none of which is a colour at all. So the rule is scoped twice: only declarations whose
 * property can hold a paint are read, and only whole words that are CSS colour keywords
 * count. Both lists are explicit, because a rule that refuses the wrong thing gets
 * disabled inside a week.
 */
/**
 * Which declarations can hold a paint.
 *
 * A name set plus one compound pattern, not a hand-typed alternation. The first draft of
 * this rule was a single regex, and it did NOT match `border-color`: the alternation
 * required two hyphens before `color`, so the most common border paint in a stylesheet
 * would have walked straight through a rule written to catch it — and because the tree
 * holds no raw named colours today, the gate would have reported parity and looked right.
 * An explicit set cannot miss that way, and the falsification run keeps a case per shape.
 */
const PAINT_EXACT = new Set([
  "color", "fill", "stroke", "caret-color", "accent-color", "stop-color", "flood-color",
  "lighting-color", "scrollbar-color", "text-decoration-color", "text-emphasis-color",
  "text-fill-color", "tap-highlight-color", "box-shadow", "text-shadow",
]);
// background|border|outline|column-rule|text-decoration, optionally by side, optionally
// ending in -color or -image. Every optional group starts with its own hyphen, which is
// what makes plain `border-color` a member.
const PAINT_COMPOUND = /^(?:background|border|outline|column-rule|text-decoration)(?:-(?:top|right|bottom|left|block-start|block-end|inline-start|inline-end))?(?:-(?:color|image))?$/;

const isPaint = (property) => {
  const bare = property.replace(/^-(?:webkit|moz)-/, "");
  return PAINT_EXACT.has(bare) || PAINT_COMPOUND.test(bare);
};

// System colours and CSS-wide keywords: bare identifiers in a paint position that are
// deliberately NOT literals. `CanvasText` is the print block's chosen answer and reads a
// colour out of the reader's own palette, which is the point of the fix recorded above.
const PAINT_KEYWORDS = new Set([
  "inherit", "initial", "unset", "revert", "revert-layer", "none", "auto", "currentcolor",
  "transparent", "canvas", "canvastext", "linktext", "visitedtext", "activetext",
  "selectedtext", "highlight", "highlighttext", "carettext", "accentcolor", "accentcolortext",
  "dark", "light", "forced-colors", "invert", "context-fill", "context-stroke",
]);

// The CSS Color 4 named colours: 147 keywords plus rebeccapurple.
//
// This list is not typed by hand. It was spliced by tmp/status/apply-named-colours.mjs from
// dembrandt's colour table, because the hand-typed version of this list dropped white,
// lightcyan, limegreen and midnightblue and invented limeyellow and midnightwheat — and it
// still reported parity, because parity only says the tree holds none of the names the list
// happens to contain. The size and canary assertions below are what turn that class of edit
// into a build failure instead of a gate that quietly certifies the colour it lost.
const NAMED_COLOURS = new Set(("aliceblue antiquewhite aqua aquamarine azure beige bisque black " +
  "blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse " +
  "chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan " +
  "darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta " +
  "darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen " +
  "darkslateblue darkslategray darkslategrey darkturquoise darkviolet " +
  "deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite " +
  "forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green " +
  "greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender " +
  "lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan " +
  "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink " +
  "lightsalmon lightseagreen lightskyblue lightslategray lightslategrey " +
  "lightsteelblue lightyellow lime limegreen linen magenta maroon " +
  "mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen " +
  "mediumslateblue mediumspringgreen mediumturquoise mediumvioletred " +
  "midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive " +
  "olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise " +
  "palevioletred papayawhip peachpuff peru pink plum powderblue purple " +
  "rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown " +
  "seagreen seashell sienna silver skyblue slateblue slategray slategrey " +
  "snow springgreen steelblue tan teal thistle tomato turquoise violet " +
  "wheat white whitesmoke yellow yellowgreen")
  // A wrapped line ends in a space, and `" ".split(" ")` yields a trailing empty token, so
  // the set is 149 without this filter. The splice script checked its own output WITH the
  // filter and still emitted code without it — a check that parses differently from the
  // program it verified is not a check.
  .split(" ")
  .filter(Boolean));

// Named here, not interpolated from the patch script: the first version of this message
// carried a `${EXPECTED}` that only existed in the file that wrote it, so the gate threw a
// ReferenceError on every run — and `node --check` passed it, because a ReferenceError is
// not a syntax error.
const CSS_COLOUR_NAMES = 148; // CSS Color 4: 147 keywords + rebeccapurple
if (NAMED_COLOURS.size !== CSS_COLOUR_NAMES) {
  console.error(`family-gate: the named-colour vocabulary holds ${NAMED_COLOURS.size} entries, not the ${CSS_COLOUR_NAMES} of CSS Color 4 — a name was dropped, fused or turned into an empty token in editing`);
  process.exit(1);
}
for (const canary of ["white", "black", "red", "rebeccapurple"]) {
  if (!NAMED_COLOURS.has(canary)) {
    console.error(`family-gate: the named-colour vocabulary lost the canary "${canary}"`);
    process.exit(1);
  }
}


/**
 * Blank out everything in a paint value that could read like a colour but is not one.
 *
 * Order matters. Custom-property names go first (`--color-gray` is a reference to the
 * vocabulary, and its spelling must not be scanned), then `url(...)` entirely, then
 * function names — because `tan` is a CSS colour, `tan()` is a math function, and the
 * difference is the parenthesis. What survives is the value's own word tokens, which is
 * exactly the surface the rule is about.
 */
const paintWords = (value) => {
  const masked = value
    .replace(/--[A-Za-z0-9_-]+/g, " ")
    .replace(/url\([^)]*\)/gi, " ")
    .replace(/[A-Za-z][A-Za-z0-9-]*\s*\(/g, "(");
  return (masked.match(/\b[a-z][a-z0-9-]*\b/gi) ?? []).map((w) => w.toLowerCase());
};

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));

/**
 * The declaration a line belongs to, by walking back to its property.
 *
 * Needed because a multi-line `mask:` reports the colour on a continuation line —
 * `#000 63% 100%` on its own says nothing about whether it is paint or mask geometry,
 * and an exemption that excuses the literal wherever it appears is the same thing as
 * not having the rule. Stopping at a brace or semicolon keeps the walk from reading a
 * neighbouring declaration's property onto this one.
 */
function declProperty(lines, index) {
  for (let i = index; i >= 0; i -= 1) {
    const match = lines[i].match(/^\s*(--[\w-]+|[-a-z]+)\s*:/);
    if (match) return match[1];
    if (i !== index && /[{};]/.test(lines[i])) return null;
  }
  return null;
}

/**
 * The exception ledger. Each entry names the declaration it excuses, the literal it
 * excuses, and why — and every entry must excuse at least one real finding, checked at
 * the end. An entry that matches nothing is a rule someone can no longer see, which is
 * how the old substring ledger accumulated exemptions nobody could defend.
 */
const LEDGER = [
  {
    name: "reduced-motion collapse",
    property: /^(animation|transition)(-[a-z-]+)?$/,
    literal: /\b0\.01ms\b/,
    because: "a duration short enough to be cancelled by `prefers-reduced-motion: reduce`, which is the point of the declaration, not a colour choice",
  },
  {
    name: "mask alpha geometry",
    property: /^(-webkit-)?mask(-image)?$/,
    literal: /#000\b/,
    because: "an opaque stop inside a mask: there it is geometry, not a paint colour, and no token exists for it by design",
  },
];

const findings = { upstream: [], adapted: [] };
const ledgerHits = new Map(LEDGER.map((e) => [e.name, 0]));

for (const f of files) {
  const source = readFileSync(join(DIR, f), "utf8");
  const text = stripComments(source);
  const lines = text.split("\n");

  /* --- durations, exactly as upstream does it: over declarations --- */
  const declarations = source.matchAll(/(?:^|[;{])\s*(transition|animation)(?:-[a-z-]+)?\s*:\s*([^;{}]*)/g);
  for (const d of declarations) {
    const value = d[2];
    if (!/\b\d*\.?\d+m?s\b/.test(value)) continue;
    if (/var\(\s*--/.test(value)) continue;
    if (/^\s*none\s*$/.test(value)) continue;
    const line = source.slice(0, d.index).split("\n").length;
    const finding = { file: f, line, property: d[1], text: `${d[1]}: ${value.trim().slice(0, 70)}` };
    findings.upstream.push(finding);
    findings.adapted.push(finding);
  }

  /* --- colour literals, attributed to their declaration --- */
  lines.forEach((raw, i) => {
    const code = raw.replace(/\/\/.*$/, "");
    if (!code.trim()) return;
    const property = declProperty(lines, i);
    if (property && property.startsWith("--")) return; // a token definition IS the vocabulary
    // Parity with the gate this replaces: a line that reads a token is compliant, and
    // this rule is about literals that bypass the vocabulary. (An earlier draft of
    // this block had no body — a comment-only `if`, which changes nothing and reads as
    // if it did.)
    if (/var\(\s*--/.test(code)) return;
    if (COLOUR_UPSTREAM.test(code) || COLOUR_ADAPTED.test(code)) {
      const finding = { file: f, line: i + 1, property, text: code.trim().slice(0, 90) };
      if (COLOUR_UPSTREAM.test(code)) findings.upstream.push(finding);
      if (COLOUR_ADAPTED.test(code)) findings.adapted.push(finding);
    }
  });

  /* --- named colours: one pass per declaration, not per line --- */
  // A bare colour keyword is neither a hash nor a function name, so no literal regex above
  // can ever reach it. Measured before this pass existed: a scratch tree holding
  // `color: red; background: white; border-color: black; outline-color: green` was
  // certified clean while `color: #ff0000` in the same run was caught.
  //
  // Declaration-level because a paint spans lines (`linear-gradient(\n white,\n black)`),
  // and scoped to paint properties because `white-space`, `print-color-adjust: exact` and
  // `color-scheme: light` are not colours — a rule that refuses them is a rule that gets
  // switched off inside a week. Swept on `text` because the print block's comment QUOTES
  // the `background: white` it replaced, and stripping preserves newlines, so line
  // numbers still line up with the source.
  for (const d of text.matchAll(/(?:^|[;{}])\s*(--[\w-]+|[-\w]+)\s*:\s*([^;{}]*)/g)) {
    const property = d[1];
    if (property.startsWith("--")) continue; // a token definition IS the vocabulary
    if (!isPaint(property)) continue;
    // PAINT_KEYWORDS is a guard, not today's filter: no system keyword is also a named
    // colour, so nothing is excused here yet. It is the rule's stated boundary, and it
    // holds if a future CSS level names a colour after a keyword the palette already uses.
    const named = [...new Set(paintWords(d[2]).filter((w) => NAMED_COLOURS.has(w) && !PAINT_KEYWORDS.has(w)))];
    if (!named.length) continue;
    const line = text.slice(0, d.index).split("\n").length;
    // `adapted` only, never `upstream`: the libreship gate this was adapted from has no
    // named-colour rule, and filing one there would misstate what the borrowed check does.
    findings.adapted.push({
      file: f,
      line,
      property,
      named: named.join(", "),
      text: `${property}: ${d[2].trim().replace(/\s+/g, " ").slice(0, 70)}`,
    });
  }
}

const fmt = (p) => `${p.file}:${p.line} — ${p.text}`;
/** Which ledger entry excuses a finding, if any. Matched on property AND literal. */
const exemptionFor = (finding) =>
  LEDGER.find((e) => e.property.test(finding.property ?? "") && e.literal.test(finding.text)) ?? null;

console.log("=== upstream gate (hex/rgb only), against Contour src/css ===");
console.log(findings.upstream.length + " violation(s)");
findings.upstream.forEach((p) => console.log("  " + fmt(p)));

console.log("\n=== adapted gate (adds oklch/oklab/hsl), against Contour src/css ===");
console.log(findings.adapted.length + " violation(s)");
findings.adapted.forEach((p) => console.log("  " + fmt(p)));

const unexempted = [];
for (const finding of findings.adapted) {
  const exemption = exemptionFor(finding);
  if (exemption) ledgerHits.set(exemption.name, ledgerHits.get(exemption.name) + 1);
  else unexempted.push(finding);
}

if (unexempted.length) {
  console.error("\nfamily-gate: " + unexempted.length + " non-exempt violation(s):");
  unexempted.forEach((p) => console.error("  " + fmt(p)));
  process.exit(1);
}

// Dead entries: an exemption that excuses nothing is a rule nobody can defend, and
// reporting it is the only way it ever gets deleted. The ledger's shape is asserted,
// not its remembered size.
const dead = [...ledgerHits].filter(([, n]) => n === 0).map(([name]) => name);
if (dead.length) {
  console.error(`family-gate: ${dead.length} ledger entr${dead.length === 1 ? "y" : "ies"} excuse nothing and must be removed: ${dead.join(", ")}`);
  console.error(`  swept ${files.length} stylesheet(s), found ${findings.adapted.length} violation(s), all ledgered`);
  process.exit(1);
}

console.log(`\nfamily-gate: ${findings.adapted.length} violation(s) across ${files.length} stylesheets, every one excused by a named ledger entry. OK`);
for (const [name, n] of ledgerHits) {
  const entry = LEDGER.find((e) => e.name === name);
  console.log(`  ${n} × ${name} — ${entry.because}`);
}

/* --- how many are in the component layer vs the token layer? --- */
const comp = findings.adapted.filter((p) => p.file !== "tokens.css");
console.log(`\n${comp.length} of ${findings.adapted.length} are in the component/base/utility layers (tokens.css is exempt by definition).`);
