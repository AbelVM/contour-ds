#!/usr/bin/env node
/**
 * ds doctor — dispatches the existing gates with machine-readable output (C-48).
 *
 * Runs each gate in the "before you finish" list, captures exit code + stdout/
 * stderr, and prints a JSON report. Exits 0 only when every gate passes.
 *
 * Run: node tools/doctor.mjs [--json]
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const json = process.argv.includes("--json");

const gates = [
  ["check-tokens", "node", ["tools/check-tokens.mjs"]],
  ["check-export", "node", ["tools/check-export.mjs"]],
  ["check-components", "node", ["tools/check-components.mjs"]],
  ["check-docs", "node", ["tools/check-docs.mjs"]],
  ["check-registry", "node", ["tools/check-registry.mjs"]],
  ["check-ownership", "node", ["tools/check-ownership.mjs"]],
  ["check-layout", "node", ["tools/check-layout.mjs"]],
  ["check-motion", "node", ["tools/check-motion.mjs"]],
  ["check-defs", "node", ["tools/check-defs.mjs"]],
  ["check-markup", "node", ["tools/check-markup.mjs"]],
  ["check-claims", "node", ["tools/check-claims.mjs"]],
  ["stamp", "node", ["tools/stamp.mjs", "--check"]],
  ["gen-light-dark", "node", ["tools/gen-light-dark.mjs", "--check"]],
  ["check-size", "node", ["tools/check-size.mjs"]],
  ["check-dist", "node", ["tools/check-dist.mjs"]],
  ["check-agent-rules", "node", ["tools/check-agent-rules.mjs"]],
  ["family-gate", "node", ["tools/audit/family-gate.mjs"]],
];

// A gate that is not in this artifact cannot pass, fail, or mean anything.
// `files` ships dist/ and src/ only, so the published bin used to report
// "FAIL check-tokens ... FAIL family-gate" — 17 failures on a healthy tree, because
// every dispatched path was missing. Absent is reported as absent, and an empty run
// is a failure rather than a pass.
const present = gates.filter(([, , args]) => existsSync(join(ROOT, args[0])));
const absent = gates.filter(([, , args]) => !existsSync(join(ROOT, args[0]))).map(([n]) => n);
if (!present.length) {
  console.error("doctor: no gates present in this artifact — that is a report of nothing, not a pass.");
  process.exit(1);
}

const results = [];
let allOk = true;
for (const [name, cmd, args] of present) {
  let exit = 0;
  let out = "";
  try {
    out = execFileSync(cmd, args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    exit = e.status ?? 1;
    out = (e.stdout || "") + (e.stderr || "");
    allOk = false;
  }
  const ok = exit === 0;
  if (!ok) allOk = false;
  results.push({ name, ok, exit, output: out.trim().split("\n").slice(-3).join(" | ") });
  if (!json) console.log(`${ok ? "OK  " : "FAIL"} ${name}`);
}

if (!json && absent.length) console.log(`SKIP ${absent.length} gate(s) not shipped here: ${absent.join(", ")}`);
if (json) {
  console.log(JSON.stringify({ ok: allOk, gates: results, notShipped: absent }, null, 2));
}
process.exit(allOk ? 0 : 1);
