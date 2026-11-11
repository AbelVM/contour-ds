#!/usr/bin/env node
/**
 * CDS-057: Contour development diagnostics (build/dev-only utility).
 *
 * Inspects source and dist artifacts for common authoring mistakes:
 *   - unknown .c-* classes used in HTML but not defined in src/css
 *   - custom elements used in HTML but not registered
 *   - duplicate IDs in shipped pages
 *   - form controls missing accessible labels in specimens
 *   - tokens referenced via var(--*) but not declared in tokens.css
 *
 * This is a development-time report, not a runtime dependency.
 * Exits 0 when no blocking issues are found; prints warnings for advisory items.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
let failures = 0;
let warnings = 0;

function fail(msg) { failures++; console.log(`  FAIL ${msg}`); }
function warn(msg) { warnings++; console.log(`  WARN ${msg}`); }
function ok(msg) { console.log(`  OK   ${msg}`); }

function read(p) { return readFileSync(join(ROOT, p), "utf8"); }
function walkCss() {
  const dir = join(ROOT, "src/css");
  return readdirSync(dir).filter(f => f.endsWith(".css")).map(f => read(`src/css/${f}`)).join("\n");
}

// ── 1. Defined .c-* classes ───────────────────────────────────────────────
const css = walkCss();
const definedClasses = new Set([...css.matchAll(/\.((?:c|ds)-[a-z0-9_-]+)/g)].map(m => m[1]));

// ── 2. Registered custom elements ─────────────────────────────────────────
let registered = new Set();
const compPath = join(ROOT, "dist/contour.components.json");
if (existsSync(compPath)) {
  const comp = JSON.parse(readFileSync(compPath, "utf8"));
  for (const b of comp.blocks || []) registered.add("contour-" + b.name.slice(2));
}
if (!registered.size) {
  warn("dist/contour.components.json missing or empty — custom-element registration check skipped");
}

// ── 3. Declared tokens ────────────────────────────────────────────────────
const tokensCss = read("src/css/tokens.css");
const declaredTokens = new Set([...tokensCss.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map(m => m[1]));

// ── 4. Scan HTML files ────────────────────────────────────────────────────
const htmlFiles = ["index.html", ...readdirSync(join(ROOT, "templates")).filter(f => f.endsWith(".html")).map(f => `templates/${f}`)];
const unknownClasses = new Map();
const unknownShadowTags = new Set();
const unknownTags = new Set();
const duplicateIds = [];
const unlabeled = [];

for (const file of htmlFiles) {
  if (!existsSync(join(ROOT, file))) continue;
  const html = read(file);
  // classes
  for (const m of html.matchAll(/class="([^"]+)"/g)) {
    for (const cls of m[1].split(/\s+/)) {
      if (!/^(?:c|ds)-/.test(cls)) continue;
      if (!definedClasses.has(cls)) {
        if (!unknownClasses.has(cls)) unknownClasses.set(cls, file);
      }
    }
  }
  // custom elements
  for (const m of html.matchAll(/<(contour-[a-z0-9-]+)/g)) {
    const tag = m[1];
    if (registered.size && !registered.has(tag)) {
      if (tag.startsWith("contour-shadow-")) unknownShadowTags.add(tag);
      else unknownTags.add(tag);
    }
  }
  // duplicate IDs (simple scan) — ignore code snippet content (guides show markup as text)
  const htmlNoSnippets = html.replace(/<code[\s\S]*?<\/code>/g, '').replace(/<pre[\s\S]*?<\/pre>/g, '');
  const ids = [...htmlNoSnippets.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) duplicateIds.push(`${file}: #${id}`);
    seen.add(id);
  }
  // unlabeled form controls (advisory, heuristic)
  for (const m of html.matchAll(/<(input|select|textarea)\b([^>]*)>/g)) {
    const attrs = m[2];
    if (/type="hidden"|aria-label|aria-labelledby/.test(attrs)) continue;
    if (/\bid="([^"]+)"/.test(attrs)) {
      const id = attrs.match(/\bid="([^"]+)"/)[1];
      if (new RegExp(`for="${id}"`).test(html)) continue;
    }
    unlabeled.push(`${file}: <${m[1]}> without obvious label association`);
  }
}

console.log("CDS-057: Contour development diagnostics");
console.log("=======================================");
console.log(`Scanned ${htmlFiles.length} HTML files, ${definedClasses.size} defined c/ds classes, ${registered.size} registered elements, ${declaredTokens.size} declared tokens.`);

if (unknownClasses.size) {
  for (const [cls, file] of unknownClasses) warn(`unknown class .${cls} (first seen in ${file}) — not defined in src/css`);
} else {
  ok("no unknown .c-* / .ds-* classes in shipped HTML");
}

if (unknownTags.size) {
  for (const tag of unknownTags) fail(`unknown custom element <${tag}> — not in contour.components.json`);
} else if (registered.size) {
  ok("no unknown non-shadow contour-* elements in shipped HTML");
}
if (unknownShadowTags.size) {
  for (const tag of unknownShadowTags) warn(`shadow wrapper <${tag}> not in contour.components.json blocks (advisory — may be registered by shadow fragment)`);
}

if (duplicateIds.length) {
  for (const d of duplicateIds) { const isTemplate = /^templates\//.test(d); (isTemplate ? fail : warn)(`duplicate ID: ${d}`); }
} else {
  ok("no duplicate IDs in shipped HTML");
}

if (unlabeled.length) {
  warn(`${unlabeled.length} form control(s) without obvious label association (heuristic, advisory)`);
} else {
  ok("form controls appear label-associated (heuristic)");
}

// ── 5. Token usage sanity (advisory, src only) ───────────────────────────
const usedTokens = new Set([...css.matchAll(/var\((--[a-z0-9-]+)/g)].map(m => m[1]));
const undefinedUsed = [...usedTokens].filter(t => !declaredTokens.has(t));
if (undefinedUsed.length) {
  warn(`${undefinedUsed.length} token(s) used via var() but not declared in tokens.css: ${undefinedUsed.slice(0,5).join(", ")}${undefinedUsed.length>5?"…":""}`);
} else {
  ok("all var(--*) token references in src/css resolve to declared tokens");
}

console.log(`\nSummary: ${failures} failure(s), ${warnings} warning(s)`);
process.exit(failures ? 1 : 0);
