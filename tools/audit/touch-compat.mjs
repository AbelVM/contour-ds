#!/usr/bin/env node
/**
 * touch-compat.mjs — responsive and touch-compatibility contract (R11-25).
 * Checks that spatial workflows have touch alternatives and safe-area handling.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const errors = [];
const fail = (m) => errors.push(m);

const cssFiles = readdirSync(join(ROOT, "src/css")).filter(f => f.endsWith(".css"));
const allCss = cssFiles.map(f => readFileSync(join(ROOT, "src/css", f), "utf-8")).join("\n");

// Touch-action for draggable/pannable surfaces
if (!allCss.includes("touch-action")) fail("no touch-action declarations — drag/pan gestures may fight native scroll");

// Safe-area insets for notched devices
if (!allCss.includes("safe-area-inset")) fail("no safe-area-inset usage — notched devices unhandled");

// Coarse pointer touch targets
if (!allCss.includes("pointer: coarse")) fail("no @media (pointer: coarse) touch-target rules");

// Reduced motion covers transitions
const base = readFileSync(join(ROOT, "src/css/base.css"), "utf-8");
if (!base.includes("prefers-reduced-motion: reduce")) fail("no reduced-motion contract");

if (errors.length) {
  console.error("touch-compat: FAIL\n  " + errors.join("\n  "));
  process.exit(1);
}
console.log("touch-compat: PASS — touch-action, safe-area-inset, coarse-pointer, reduced-motion present");
