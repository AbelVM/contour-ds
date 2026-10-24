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
