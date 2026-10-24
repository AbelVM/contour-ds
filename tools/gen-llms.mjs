#!/usr/bin/env node
/**
 * Generates llms-full.txt and .well-known/llms.txt from dist/docs/ (C-49).
 * Run: node tools/gen-llms.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");

const docsDir = join(ROOT, "dist", "docs");
const index = JSON.parse(read("dist", "docs", "index.json"));

let full = "# Contour — full documentation\n\n";
full += "Generated from dist/docs/. See llms.txt for the index.\n\n";
for (const sec of index.sections) {
  const content = read("dist", "docs", sec.file.replace("docs/", ""));
  full += `\n---\n\n# ${sec.title || sec.id}\n\n${content}\n`;
}
writeFileSync(join(ROOT, "llms-full.txt"), full);

const wellKnown = join(ROOT, ".well-known");
if (!existsSync(wellKnown)) mkdirSync(wellKnown, { recursive: true });
writeFileSync(join(wellKnown, "llms.txt"), read("llms.txt"));

console.log("gen-llms: wrote llms-full.txt and .well-known/llms.txt");
