#!/usr/bin/env node
/**
 * API-CONTRACTS.md is a proposal, not a contract — but a proposal that names
 * events the bundle does not emit is a false claim, and a reader who codes
 * against it ships a handler for an event that never fires.
 *
 * This gate reads the `contour:*` event names in API-CONTRACTS.md and fails
 * when one is not in CONTOUR_EVENTS (src/js/wc/core.mjs). It does not require
 * every manifest event to appear in the doc — the doc is a per-family sample,
 * not an exhaustive list — only that every event it names is real.
 *
 * Run: node tools/check-api-contracts.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const DOC = join(ROOT, "API-CONTRACTS.md");
const CORE = join(ROOT, "src/js/wc/core.mjs");

if (!existsSync(DOC)) {
  console.error("check-api-contracts: API-CONTRACTS.md is absent — the proposal it records cannot be checked.");
  process.exit(1);
}

const doc = readFileSync(DOC, "utf-8");
const core = readFileSync(CORE, "utf-8");

// The manifest: every "contour:*" key in CONTOUR_EVENTS.
const manifest = new Set(
  [...core.matchAll(/"(contour:[a-z-]+)"\s*:\s*\{/g)].map((m) => m[1]),
);
if (!manifest.size) {
  console.error("check-api-contracts: CONTOUR_EVENTS yielded no events — the manifest moved; update this gate.");
  process.exit(1);
}

// Every contour:* name mentioned in the doc's tables — the blockquote status
// note legitimately names absent events as examples of what is not implemented,
// so it is stripped before the scan.
const tableText = doc.split("\n").filter((l) => !/^\s*>/.test(l)).join("\n");
const named = new Set([...tableText.matchAll(/contour:[a-z-]+/g)].map((m) => m[0]));

const absent = [...named].filter((e) => !manifest.has(e)).sort();

// The doc must say it is a proposal, or a reader takes it as the contract.
const labelled = /status:\s*proposal/i.test(doc);

if (!labelled) {
  console.error("check-api-contracts: API-CONTRACTS.md does not label itself a proposal — a table that names absent APIs reads as a contract.");
  process.exit(1);
}

if (absent.length) {
  console.error(`check-api-contracts: ${absent.length} event(s) named in API-CONTRACTS.md are not in CONTOUR_EVENTS:`);
  for (const e of absent) console.error(`  ${e}`);
  console.error("  Remove the row, implement the event, or move it to an explicit 'proposed' note.");
  process.exit(1);
}

console.log(`check-api-contracts: ${named.size} event name(s) in the proposal, all present in CONTOUR_EVENTS (${manifest.size} in the manifest). OK`);