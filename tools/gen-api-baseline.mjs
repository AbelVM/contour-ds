#!/usr/bin/env node
/**
 * Regenerate the API compatibility baseline from the current component contract.
 *
 * Run this intentionally when a breaking change has been approved:
 *
 *   node tools/gen-api-baseline.mjs
 *
 * It copies dist/contour.components.json (freshly derived from src/css by the
 * build) into tools/lib/contour.components.baseline.json, which the gate
 * compares against on every run.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const ARTIFACT = join(ROOT, "dist/contour.components.json");
const BASELINE = join(ROOT, "tools/lib/contour.components.baseline.json");

if (!existsSync(ARTIFACT)) {
  console.error("gen-api-baseline: dist/contour.components.json is missing — run `node tools/build.mjs` first.");
  process.exit(1);
}

const doc = JSON.parse(readFileSync(ARTIFACT, "utf8"));
writeFileSync(BASELINE, JSON.stringify(doc, null, 2) + "\n", "utf8");
console.log(`gen-api-baseline: wrote ${BASELINE} (${doc.blocks.length} blocks, ${doc.counts.attributes ?? "n/a"} attribute entries)`);
