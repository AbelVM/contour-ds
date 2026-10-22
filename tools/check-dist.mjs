#!/usr/bin/env node
/**
 * Dist-loading smoke check (T-111): verifies the shipped bundle is syntactically
 * valid and free of the known minifier corruption patterns.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const js = readFileSync(join(ROOT, "dist/contour.min.js"), "utf8");
const css = readFileSync(join(ROOT, "dist/contour.min.css"), "utf8");
const errors = [];
// JS syntax check via Function constructor (best-effort).
try { new Function(js); } catch (e) { errors.push("JS syntax: " + e.message); }
// Corruption patterns.
if (/\[data-[a-z-]+\][a-z]/.test(js)) errors.push("JS: descendant combinator eaten in selector");
if (/rootMargin:"[^"]*0px[0-9]/.test(js)) errors.push("JS: rootMargin space eaten");
if (/calc\([^)]*\+[0-9]/.test(css)) errors.push("CSS: calc() space eaten");
if (/oklch\(\d+%\d/.test(css)) errors.push("CSS: oklch() space eaten");
if (/\.c-radio-list\.c-radio/.test(css) || /\[dir="rtl"\]\.c-/.test(css)) errors.push("CSS: descendant combinator eaten in selector");
if (errors.length) {
  console.error("check-dist: FAIL");
  errors.forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log("check-dist: OK");
process.exit(0);
