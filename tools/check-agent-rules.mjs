#!/usr/bin/env node
/**
 * The agent-rules guard (C-47). Reads `dist/agent-rules.json` and verifies that
 * every rule cites gates that exist and run in a CI lane.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const DIST = join(ROOT, "dist");
const errors = [];

const path = join(DIST, "agent-rules.json");
if (!existsSync(path)) {
  console.error("check-agent-rules: dist/agent-rules.json missing — run `node tools/build.mjs`");
  process.exit(1);
}
const doc = JSON.parse(readFileSync(path, "utf8"));
const ci = readFileSync(join(ROOT, ".github/workflows/ci.yml"), "utf8");

if (!Array.isArray(doc.rules) || !doc.rules.length) errors.push("agent-rules.json holds no rules");

let checked = 0;
for (const r of doc.rules || []) {
  if (!Array.isArray(r.enforcement) || !r.enforcement.length) {
    errors.push(`rule ${r.id}: no enforcement cited`);
    continue;
  }
  for (const e of r.enforcement) {
    checked++;
    if (!e.gate) { errors.push(`rule ${r.id}: enforcement missing gate`); continue; }
    if (!existsSync(join(ROOT, e.gate))) errors.push(`rule ${r.id}: gate ${e.gate} does not exist`);
    else if (!ci.includes(e.gate)) errors.push(`rule ${r.id}: gate ${e.gate} runs in no CI lane`);
  }
}

if (!checked) errors.push("check-agent-rules: matched no enforcement entries, so it proved nothing");

if (errors.length) {
  console.error("check-agent-rules: FAIL");
  errors.forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log(`check-agent-rules: OK — ${doc.rules.length} rule(s), ${checked} enforcement reference(s), all gates exist and are CI-wired.`);
