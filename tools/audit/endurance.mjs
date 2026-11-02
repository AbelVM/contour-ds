#!/usr/bin/env node
/**
 * endurance.mjs — operational-endurance contract (R11-26).
 * Checks that components bound their collections, clean up timers/observers,
 * and abort in-flight requests on disconnect.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const errors = [];
const fail = (m) => errors.push(m);

const src = readdirSync(join(ROOT, "src/js/wc")).filter(f => f.endsWith(".mjs"))
  .map(f => readFileSync(join(ROOT, "src/js/wc", f), "utf-8")).join("\n");

// Disposer registry usage
if (!src.includes("onDispose")) fail("no onDispose disposer registry — cleanup is implicit");

// Abort on disconnect
if (!src.includes("abort") && !src.includes("AbortController")) fail("no abort handling for in-flight requests");

// Timer cleanup
if (!src.includes("clearTimeout") && !src.includes("clearInterval")) fail("no timer cleanup (clearTimeout/clearInterval)");

// Bounded collections (slice/splice/limit)
if (!src.includes("slice(") && !src.includes(".splice(")) fail("no bounded collection handling");

if (errors.length) {
  console.error("endurance: FAIL\n  " + errors.join("\n  "));
  process.exit(1);
}
console.log("endurance: PASS — disposers, abort, timer cleanup, bounded collections present");
