#!/usr/bin/env node
/**
 * experience-quality.mjs — lightweight experience-quality gate (R11-24).
 * Checks that the system ships the spatial-interaction vocabulary the review
 * requires: motion tokens, reduced-motion contract, focus-visible policy,
 * touch-target media queries, and contour-path reveal primitives.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const errors = [];
const fail = (m) => errors.push(m);

const tokens = readFileSync(join(ROOT, "src/css/tokens.css"), "utf-8");
const base = readFileSync(join(ROOT, "src/css/base.css"), "utf-8");
import { readdirSync } from "node:fs";
const cssFiles = readdirSync(join(ROOT, "src/css")).filter(f => f.endsWith(".css"));
const allCss = cssFiles.map(f => readFileSync(join(ROOT, "src/css", f), "utf-8")).join("\n");

// Motion tokens
for (const t of ["--dur-fast", "--dur-base", "--dur-reveal", "--dur-focus", "--ease-standard", "--ease-reveal", "--reveal-distance"]) {
  if (!tokens.includes(t)) fail(`missing motion token ${t}`);
}

// Reduced-motion contract
if (!base.includes("prefers-reduced-motion: reduce")) fail("no prefers-reduced-motion contract in base.css");

// Focus-visible policy
if (!base.includes(":focus-visible")) fail("no :focus-visible policy in base.css");

// Touch-target media queries
if (!allCss.includes("pointer: coarse")) fail("no @media (pointer: coarse) touch-target rules");
if (!allCss.includes("hover: none")) fail("no @media (hover: none) fallback rules");

// Contour-path reveal primitive (transform/opacity, not layout)
if (!allCss.includes("--reveal-distance")) fail("missing --reveal-distance token");

if (errors.length) {
  console.error("experience-quality: FAIL\n  " + errors.join("\n  "));
  process.exit(1);
}
console.log("experience-quality: PASS — motion tokens, reduced-motion, focus-visible, touch-targets, reveal-distance present");
