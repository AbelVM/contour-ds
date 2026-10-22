#!/usr/bin/env node
/**
 * Size budget gate.
 * Fails if any file in dist/ exceeds its budget.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const DIST = join(ROOT, "dist");

const budgets = {
  "contour.min.css": 110 * 1024,  // 110 kB
  "contour.min.js": 20 * 1024,    // 20 kB
  "contour.tokens.json": 10 * 1024, // 10 kB
};

let failed = false;
for (const [file, budget] of Object.entries(budgets)) {
  const path = join(DIST, file);
  try {
    const size = statSync(path).size;
    const status = size <= budget ? "OK" : "OVER BUDGET";
    console.log(`${file}: ${(size / 1024).toFixed(1)} kB (budget ${(budget / 1024).toFixed(0)} kB) — ${status}`);
    if (size > budget) failed = true;
  } catch (e) {
    console.error(`${file}: not found`);
    failed = true;
  }
}

if (failed) {
  console.error("\nSize budget exceeded.");
  process.exit(1);
}
console.log("\nSize budget: OK");
