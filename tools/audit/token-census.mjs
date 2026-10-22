// Static audit of the Contour token layer + selector hygiene.
// Run: node /tmp/kilo/audit/ds-static.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const CSS = path.join(ROOT, "src/css");
const files = fs.readdirSync(CSS).filter((f) => f.endsWith(".css"));
const src = Object.fromEntries(files.map((f) => [f, fs.readFileSync(path.join(CSS, f), "utf8")]));
const tokensCss = src["tokens.css"];
const allSrc = Object.values(src).join("\n");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const templates = fs
  .readdirSync(path.join(ROOT, "templates"))
  .filter((f) => f.endsWith(".html"))
  .map((f) => fs.readFileSync(path.join(ROOT, "templates", f), "utf8"))
  .join("\n");

/* ---------- 1. token census, grouped the way the README groups them ---------- */
const declared = [...tokensCss.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]);
const unique = [...new Set(declared)].sort();

const groups = {
  "Colour ramps": /^--(basalt|tidal|lumen|plasma|sol|clay)-\d+$/,
  "Semantic colours": /^--color-/,
  Chart: /^--(chart|color-scale)-/,
  Typography: /^--(font|type|weight|leading|tracking|measure)-/,
  "Space and layout": /^--(space|gutter|container|header-height|section)/,
  Shape: /^--(radius|border-width|border-width-thick|hairline|shadow)-/,
  Motion: /^--(dur|ease)-/,
  "Z-index": /^--z-/,
  "Brand ramp": /^--brand-/,
  Density: /^--density/,
  Gradients: /^--gradient-/,
};
const counts = Object.fromEntries(Object.keys(groups).map((k) => [k, 0]));
const uncategorised = [];
for (const t of unique) {
  let hit = false;
  for (const [k, re] of Object.entries(groups)) {
    if (re.test(t)) {
      counts[k]++;
      hit = true;
      break;
    }
  }
  if (!hit) uncategorised.push(t);
}

console.log("=== TOKEN CENSUS (unique custom properties in src/css/tokens.css) ===");
console.log("unique:", unique.length, " declarations:", declared.length);
for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(20)} ${v}`);
console.log(
  "  README table sum:",
  Object.values(counts).reduce((a, b) => a + b, 0),
);
console.log("  uncategorised:", uncategorised.length, uncategorised.join(", "));

/* ---------- 2. orphan tokens: declared, never referenced ---------- */
const refs = new Map();
for (const t of unique) {
  const used =
    (allSrc.match(new RegExp(`var\\(\\s*${t.replace(/[-]/g, "\\-")}\\b`, "g")) || []).length +
    (html.match(new RegExp(`var\\(\\s*${t.replace(/[-]/g, "\\-")}\\b`, "g")) || []).length +
    (templates.match(new RegExp(`var\\(\\s*${t.replace(/[-]/g, "\\-")}\\b`, "g")) || []).length;
  const selfDecl = (tokensCss.match(new RegExp(`--${t.slice(2)}[^:]*:\\s*[^;]*\\b${t.replace(/[-]/g, "\\-")}\\b`, "g")) || []).length;
  refs.set(t, used - selfDecl);
}
const orphans = [...refs.entries()].filter(([, n]) => n <= 0).map(([t]) => t);
console.log("\n=== ORPHAN TOKENS (declared, zero var() references anywhere) ===");
console.log(orphans.length, orphans.join(", "));

/* ---------- 3. cross-component descendant selectors ---------- */
const blockOf = (cls) => cls.replace(/__.*$/, "").replace(/--.*$/, "");
const cross = [];
for (const [f, text] of Object.entries(src)) {
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, "");
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(stripped))) {
    const sel = m[1].trim();
    if (sel.startsWith("@") || sel.includes("@")) continue;
    for (const part of sel.split(",")) {
      const p = part.trim();
      if (!p.includes(".")) continue;
      const classes = [...p.matchAll(/\.([a-z][a-z0-9-]*)/g)].map((x) => x[1]);
      const cClasses = classes.filter((c) => c.startsWith("c-"));
      if (cClasses.length < 2) continue;
      const blocks = [...new Set(cClasses.map(blockOf))];
      if (blocks.length > 1) cross.push({ file: f, sel: p, blocks });
    }
  }
}
console.log("\n=== CROSS-COMPONENT DESCENDANT SELECTORS (src/css) ===");
console.log("count:", cross.length);
for (const c of cross) console.log(`  ${c.file}: ${c.sel}   [${c.blocks.join(" -> ")}]`);

/* ---------- 4. hardcoded hues that should follow --brand-hue ---------- */
console.log("\n=== HARDCODED BRAND HUE (180) IN THE PRIMARY LAYER ===");
for (const [f, text] of Object.entries(src)) {
  text.split("\n").forEach((line, i) => {
    if (/var\(--brand-hue\)/.test(line)) return;
    if (/\boklch\([^)]*\b180\b/.test(line)) console.log(`  ${f}:${i + 1}: ${line.trim()}`);
  });
}

/* ---------- 5. density token consumers ---------- */
console.log("\n=== --density* CONSUMERS ===");
for (const [f, text] of Object.entries(src)) {
  text.split("\n").forEach((line, i) => {
    if (/var\(--density/.test(line)) console.log(`  ${f}:${i + 1}: ${line.trim()}`);
  });
}

/* ---------- 6. hardcoded durations in animation/transition shorthand ---------- */
console.log("\n=== HARDCODED DURATIONS (not var(--dur-*)) ===");
for (const [f, text] of Object.entries(src)) {
  text.split("\n").forEach((line, i) => {
    if (!/animation:|transition:/.test(line)) return;
    if (/var\(--dur/.test(line)) return;
    console.log(`  ${f}:${i + 1}: ${line.trim()}`);
  });
}

/* ---------- 7. duplicate token declarations inside tokens.css ---------- */
const seen = new Map();
for (const m of tokensCss.matchAll(/(--[a-z0-9-]+)\s*:/g)) {
  seen.set(m[1], (seen.get(m[1]) || 0) + 1);
}
console.log("\n=== TOKENS DECLARED MORE THAN ONCE IN tokens.css ===");
for (const [t, n] of [...seen.entries()].filter(([, n]) => n > 1)) console.log(`  ${t} x${n}`);

/* ---------- 8. forced-colors coverage ---------- */
console.log("\n=== forced-colors COVERAGE ===");
for (const [f, text] of Object.entries(src)) {
  const m = text.match(/@media \(forced-colors: active\)\s*\{([\s\S]*?)\n {2}\}/);
  if (m) console.log(`  src/${f}: ${[...m[1].matchAll(/\.(c-[a-z0-9-]+)/g)].map((x) => x[1]).join(", ")}`);
}
const docs = fs.readFileSync(path.join(ROOT, "assets/css/docs.css"), "utf8");
console.log(
  "  assets/css/docs.css forced-colors rules:",
  (docs.match(/@media \(forced-colors: active\)/g) || []).length,
);

/* ---------- 9. print / prefers-contrast / prefers-reduced-data ---------- */
console.log("\n=== MEDIA FEATURE COVERAGE ===");
for (const q of ["@media print", "prefers-contrast", "prefers-reduced-data", "prefers-reduced-motion", "forced-colors", "prefers-color-scheme", "hover: none", "pointer: coarse", "any-hover", "forced-colors"]) {
  const n = (allSrc.match(new RegExp(q.replace(/[()]/g, "\\$&"), "g")) || []).length;
  console.log(`  src/css  ${q.padEnd(24)} ${n}`);
}

/* ---------- 10. appearance:none targets (native controls restyled) ---------- */
console.log("\n=== appearance:none — WHICH NATIVE CONTROLS ARE RESTYLED ===");
for (const [f, text] of Object.entries(src)) {
  const re = /([^{}]+)\{([^{}]*appearance:\s*none[^{}]*)\}/g;
  let m;
  while ((m = re.exec(text))) {
    const before = text.slice(0, m.index);
    const line = before.split("\n").length;
    console.log(`  ${f}:~${line}: ${m[1].trim().split("\n").pop().trim()}`);
  }
}

/* ---------- 11. focus-visible rules and their declarations ---------- */
console.log("\n=== :focus-visible RULES ===");
for (const [f, text] of Object.entries(src)) {
  const re = /([^{}]*:focus-visible[^{}]*)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(text))) {
    const decls = m[2].split(";").map((s) => s.trim()).filter(Boolean);
    const line = text.slice(0, m.index).split("\n").length;
    console.log(`  ${f}:${line}: ${m[1].trim().replace(/\s+/g, " ")}  →  ${decls.join("; ")}`);
  }
}
