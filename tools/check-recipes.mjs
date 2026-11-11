#!/usr/bin/env node
/**
 * CDS-065: adoption recipes are a tested artifact.
 *
 * `integrations/frameworks/README.md` tells a consumer what to import, which
 * tags to write and which events to listen for. Prose is not a contract, so
 * this gate reads the recipes and checks every concrete claim against the
 * shipped artifacts:
 *
 *   - every `contour-ds/…` specifier resolves through `package.json` exports
 *     and names a file that exists;
 *   - every `<contour-…>` tag is declared in `dist/custom-elements.json`;
 *   - every `contour:*` event is in that manifest's event vocabulary.
 *
 * It prints how many of each it compared and fails when it compared nothing:
 * a recipe file with no claims would otherwise pass by being empty.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DOC = join(ROOT, "integrations/frameworks/README.md");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const cem = JSON.parse(readFileSync(join(ROOT, "dist/custom-elements.json"), "utf8"));

let failures = 0;
let checked = 0;

function fail(msg) {
  failures += 1;
  console.log(`  FAIL ${msg}`);
}

function ok(msg) {
  console.log(`  OK   ${msg}`);
}

if (!existsSync(DOC)) {
  console.log("FAIL check-recipes: integrations/frameworks/README.md is missing");
  process.exit(1);
}

const text = readFileSync(DOC, "utf8");

/** All string targets an exports entry can resolve to. */
function targets(entry) {
  if (typeof entry === "string") return [entry];
  if (Array.isArray(entry)) return entry.flatMap(targets);
  if (entry && typeof entry === "object") return Object.values(entry).flatMap(targets);
  return [];
}

/** Resolve `contour-ds/…` through the package's own exports map. */
function resolveSpecifier(spec) {
  const sub = "." + spec.slice("contour-ds".length);
  const ex = pkg.exports || {};
  const candidates = [];
  if (ex[sub]) candidates.push(...targets(ex[sub]));
  for (const key of Object.keys(ex)) {
    if (!key.includes("*")) continue;
    const [pre, post] = key.split("*");
    if (!sub.startsWith(pre) || !sub.endsWith(post)) continue;
    const star = sub.slice(pre.length, sub.length - post.length);
    candidates.push(...targets(ex[key]).map((t) => t.replace("*", star)));
  }
  return candidates.filter((t) => typeof t === "string" && existsSync(join(ROOT, t)));
}

// ── Specifiers ────────────────────────────────────────────────────────────

const specifiers = [...new Set(text.match(/contour-ds\/[A-Za-z0-9._/*-]+/g) || [])]
  // `contour-ds/wc/<family>.mjs` is a pattern illustration, not an import.
  .filter((s) => !s.endsWith("/") && !s.includes("<"))
  .sort();
for (const spec of specifiers) {
  checked += 1;
  const files = resolveSpecifier(spec);
  if (files.length) ok(`${spec} → ${files[0]}`);
  else fail(`${spec} does not resolve through package.json exports to a file that exists`);
}

// ── Tags ──────────────────────────────────────────────────────────────────

const declaredTags = new Set(
  (cem.modules || []).flatMap((m) => (m.declarations || []).map((d) => d.tagName)).filter(Boolean),
);
const tags = [...new Set(text.match(/<contour-[a-z0-9-]+/g) || [])].map((t) => t.slice(1)).sort();
for (const tag of tags) {
  checked += 1;
  if (declaredTags.has(tag)) ok(`<${tag}> declared`);
  else fail(`<${tag}> is not declared in dist/custom-elements.json`);
}

// ── Events ────────────────────────────────────────────────────────────────

const declaredEvents = new Set((cem["x-contour-events"] || []).map((e) => e.name));
const events = [...new Set(text.match(/contour:[a-z0-9-]+/g) || [])].sort();
for (const event of events) {
  checked += 1;
  if (declaredEvents.has(event)) ok(`${event} declared`);
  else fail(`${event} is not in the manifest event vocabulary`);
}

// ── Result ────────────────────────────────────────────────────────────────

console.log(
  `\ncheck-recipes: ${specifiers.length} specifier(s), ${tags.length} tag(s), ${events.length} event(s), ` +
    `${checked} claim(s) compared against dist/`,
);

if (checked === 0) {
  console.log("FAIL check-recipes: the recipe file made no checkable claim — nothing was compared");
  process.exit(1);
}
if (specifiers.length === 0 || tags.length === 0 || events.length === 0) {
  console.log("FAIL check-recipes: one claim family is empty; the recipes no longer exercise it");
  process.exit(1);
}
if (failures) {
  console.log(`FAIL check-recipes: ${failures} claim(s) do not resolve`);
  process.exit(1);
}
console.log("OK   check-recipes: every recipe claim resolves against the shipped artifacts");