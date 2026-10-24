#!/usr/bin/env node
/**
 * Ownership check (T-157): anything that only makes sense inside the guide
 * must not leak into src/. Fails (exit 1) if any guide-only token or class
 * name appears in the design system source.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const SRC = join(ROOT, "src");

const FORBIDDEN = [
  "ridgeline",
  "chart-paper",
  "--contour-field",
  "--contour-opacity",
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = walk(SRC).filter((f) => /\.(css|js|html|svg)$/.test(f));
const hits = [];
for (const f of files) {
  const text = readFileSync(f, "utf8");
  for (const term of FORBIDDEN) {
    if (text.includes(term)) hits.push(`${f.replace(ROOT + "/", "")}: ${term}`);
  }
  // ds- class names in src/ (guide-only prefix)
  const dsMatches = text.match(/\.ds-[a-zA-Z0-9_-]+/g);
  if (dsMatches) {
    for (const m of new Set(dsMatches)) hits.push(`${f.replace(ROOT + "/", "")}: ${m}`);
  }
}

if (hits.length) {
  console.error("check-ownership: FAIL — guide-only identifiers found in src/:");
  hits.forEach((h) => console.error("  " + h));
  process.exit(1);
}

/* ----------------------------------------------------------------------
   Zero runtime dependencies (C-06 owner).

   README publishes "zero runtime dependencies, no build step". A sentence
   with no check behind it is precisely what this file's sibling,
   check-claims.mjs, was written to end — so the claim is owned here, next to
   the other rule about what src/ is allowed to contain. Two halves, because
   "no dependencies" means both: the manifest declares none, and the source
   reaches for none.
   ---------------------------------------------------------------------- */
const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
for (const field of ["dependencies", "peerDependencies", "optionalDependencies"]) {
  const n = Object.keys(manifest[field] || {}).length;
  if (n) hits.push(`package.json: declares ${n} ${field} — README says zero runtime dependencies`);
}

// An import or require of anything that is not a relative path is a dependency,
// whatever the manifest says. Checked only in the shipped JS: tools/ is dev-side
// and is allowed to use node: builtins.
const shipped = files.filter((f) => f.endsWith(".js"));
let externals = 0;
for (const f of shipped) {
  const text = readFileSync(f, "utf8");
  const specs = [
    ...text.matchAll(/\bimport\s+(?:[^'"]*from\s*)?["']([^"']+)["']/g),
    ...text.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/g),
  ].map((m) => m[1]);
  for (const s of specs) {
    if (s.startsWith(".") || s.startsWith("/") || s.startsWith("node:")) continue;
    externals++;
    hits.push(`${f.replace(ROOT + "/", "")}: imports "${s}" — not a relative path, so it is a dependency`);
  }
}

if (hits.length) {
  console.error("check-ownership: FAIL — guide-only identifiers or a runtime dependency found in src/:");
  hits.forEach((h) => console.error("  " + h));
  process.exit(1);
}
console.log(
  `check-ownership: OK — no guide-only identifiers in ${files.length} shipped file(s); ` +
    `${shipped.length} script(s) import nothing external and the manifest declares no dependencies.`,
);
process.exit(0);

