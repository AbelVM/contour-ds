// Run libreship's token gate (scripts/check-widget-tokens.mjs) against Contour's
// stylesheet, adapted to Contour's token names and to the oklch() colour space.
// Run: node /tmp/kilo/audit/ds-gate.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "/data/projects/DS/src/css";
const files = readdirSync(DIR).filter((f) => f.endsWith(".css"));

// The upstream gate's two literals. oklch() is Contour's colour space, so the
// adapted gate adds it.
const COLOUR_UPSTREAM = /#[0-9a-fA-F]{3,8}\b|\brgba?\(/;
const COLOUR_ADAPTED = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\boklch\(|\boklab\(|\bhsl\(/;

const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).split("\n");

const findings = { upstream: [], adapted: [] };

for (const f of files) {
  const source = readFileSync(join(DIR, f), "utf8");
  const lines = stripComments(source);

  /* --- durations, exactly as upstream does it: over declarations --- */
  const declarations = source.matchAll(/(?:^|[;{])\s*(transition|animation)(?:-[a-z-]+)?\s*:\s*([^;{}]*)/g);
  for (const d of declarations) {
    const value = d[2];
    if (!/\b\d*\.?\d+m?s\b/.test(value)) continue;
    if (/var\(\s*--/.test(value)) continue;
    if (/^\s*none\s*$/.test(value)) continue;
    const line = source.slice(0, d.index).split("\n").length;
    findings.upstream.push(`${f}:${line} — ${d[1]}: ${value.trim().slice(0, 70)}`);
    findings.adapted.push(`${f}:${line} — ${d[1]}: ${value.trim().slice(0, 70)}`);
  }

  /* --- colour literals --- */
  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, "");
    const isTokenDefinition = /^\s*--[a-z0-9-]+\s*:/.test(code);
    const isTokenRead = /var\(\s*--/.test(code);
    if (isTokenDefinition || isTokenRead) return;
    if (COLOUR_UPSTREAM.test(code)) {
      findings.upstream.push(`${f}:${i + 1} — ${code.trim().slice(0, 90)}`);
    }
    if (COLOUR_ADAPTED.test(code)) {
      findings.adapted.push(`${f}:${i + 1} — ${code.trim().slice(0, 90)}`);
    }
  });
}

console.log("=== upstream gate (hex/rgb only), against Contour src/css ===");
console.log(findings.upstream.length + " violation(s)");
findings.upstream.forEach((p) => console.log("  " + p));

console.log("\n=== adapted gate (adds oklch/oklab/hsl), against Contour src/css ===");
console.log(findings.adapted.length + " violation(s)");
findings.adapted.forEach((p) => console.log("  " + p));

/* --- how many are in the component layer vs the token layer? --- */
const comp = findings.adapted.filter((p) => !p.startsWith("tokens.css"));
console.log(`\n${comp.length} of ${findings.adapted.length} are in the component/base/utility layers (tokens.css is exempt by definition).`);
