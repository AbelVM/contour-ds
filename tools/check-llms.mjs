#!/usr/bin/env node
/**
 * Gate: llms-full.txt and .well-known/llms.txt must match a fresh derivation
 * from dist/docs/ and llms.txt. Fails when the committed copies are stale.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");

const docsDir = join(ROOT, "dist", "docs");
if (!existsSync(docsDir)) {
  console.error("check-llms: dist/docs/ missing — run build first");
  process.exit(1);
}

const index = JSON.parse(read("dist", "docs", "index.json"));
let full = "# Contour — full documentation\n\n";
full += "Generated from dist/docs/. See llms.txt for the index.\n\n";
for (const sec of index.sections) {
  const content = read("dist", "docs", sec.file.replace("docs/", ""));
  full += `\n---\n\n# ${sec.title || sec.id}\n\n${content}\n`;
}

const committed = existsSync(join(ROOT, "llms-full.txt")) ? read("llms-full.txt") : null;
if (committed !== full) {
  console.error("check-llms: llms-full.txt is stale — run node tools/build.mjs");
  process.exit(1);
}

const wellKnown = existsSync(join(ROOT, ".well-known", "llms.txt")) ? read(".well-known", "llms.txt") : null;
const source = read("llms.txt");
if (wellKnown !== source) {
  console.error("check-llms: .well-known/llms.txt is stale — run node tools/build.mjs");
  process.exit(1);
}

console.log("check-llms: llms-full.txt and .well-known/llms.txt are current. OK");
