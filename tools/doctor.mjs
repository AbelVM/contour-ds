#!/usr/bin/env node
/**
 * ds doctor — dispatches the existing gates with machine-readable output (C-48).
 *
 * Runs each gate in the "before you finish" list, captures exit code + stdout/
 * stderr, and prints a JSON report. Exits 0 only when every gate passes.
 *
 * Gates run concurrently, because the sweep is dominated by a handful of slow
 * browser gates and the rest are independent readers of `dist/`. Two things keep
 * that honest:
 *
 *   - Output is emitted in declaration order, not completion order. A CI log
 *     that reorders itself between runs cannot be diffed against the last one.
 *   - A gate that mutates shared state runs by itself, first. `npm pack` in
 *     check-consumer-install fires the package's `prepack`, which is
 *     `tools/build.mjs --single` — a non-atomic rewrite of `dist/` while every
 *     other gate is reading it. See SERIAL below.
 *
 * Concurrency is `DOCTOR_JOBS` (default: min(4, availableParallelism())). Four
 * is the ceiling because the slow gates are browser gates: each one launches a
 * Chromium of its own, and the point of the sweep is to finish, not to thrash.
 *
 * Run: node tools/doctor.mjs [--json]
 */
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { availableParallelism } from "node:os";
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
  ["check-css", "node", ["tools/check-css.mjs"]],
  ["check-dead-css", "node", ["tools/check-dead-css.mjs"]],
  ["check-map-chrome", "node", ["tools/check-map-chrome.mjs"]],
  ["check-layout", "node", ["tools/check-layout.mjs"]],
  ["check-motion", "node", ["tools/check-motion.mjs"]],
  ["check-defs", "node", ["tools/check-defs.mjs"]],
  ["check-markup", "node", ["tools/check-markup.mjs"]],
  ["check-claims", "node", ["tools/check-claims.mjs"]],
  ["check-llms", "node", ["tools/check-llms.mjs"]],
  ["stamp", "node", ["tools/stamp.mjs", "--check"]],
  ["gen-light-dark", "node", ["tools/gen-light-dark.mjs", "--check"]],
  ["check-size", "node", ["tools/check-size.mjs"]],
  ["check-consumer-install", "node", ["tools/check-consumer-install.mjs"]],
  ["check-ssr", "node", ["tools/check-ssr.mjs"]],
  ["check-dist", "node", ["tools/check-dist.mjs"]],
  ["check-agent-rules", "node", ["tools/check-agent-rules.mjs"]],
  ["check-wc", "node", ["tools/check-wc.mjs"]],
  ["family-gate", "node", ["tools/audit/family-gate.mjs"]],
  ["wc-contract", "node", ["tools/audit/wc-contract.mjs"]],
  ["check-absent-components", "node", ["tools/check-absent-components.mjs"]],
  ["component-inventory", "node", ["tools/audit/component-inventory.mjs"]],
  ["check-rtl", "node", ["tools/audit/check-rtl.mjs"]],
  ["check-large-data", "node", ["tools/check-large-data.mjs"]],
  ["check-diagnostics", "node", ["tools/check-diagnostics.mjs"]],
  ["check-dsd", "node", ["tools/check-dsd.mjs"]],
  ["docs-behaviours", "node", ["tools/audit/docs-behaviours.mjs"]],
  ["workspace-shell", "node", ["tools/audit/workspace-shell.mjs"]],
  ["glass-budget", "node", ["tools/audit/glass-budget.mjs"]],
  ["check-recipes", "node", ["tools/check-recipes.mjs"]],
  ["perf-budget", "node", ["tools/audit/perf-budget.mjs"]],
  ["check-visual", "node", ["tools/check-visual.mjs", "--verify"]],
  ["check-storybook-stale", "node", ["tools/check-storybook-stale.mjs"]],
  ["contrast-cross-browser", "node", ["tools/audit/contrast-and-aria-cross-browser.mjs"]],
  ["check-api-contracts", "node", ["tools/check-api-contracts.mjs"]],
];

// Gates that write to a path another gate reads. They run alone, before the
// pool, so no reader ever sees a half-written file. Today that is exactly one
// gate: check-consumer-install shells out to `npm pack`, and npm runs the
// package's `prepack` (`tools/build.mjs --single`) before packing, which
// rewrites `dist/` in place with plain writeFileSync calls. Everything else in
// the list only reads, or writes under its own tmp/ subdirectory.
const SERIAL = new Set(["check-consumer-install"]);

// Gates that import tools/audit/lib/browser.mjs. That module calls process.exit(1)
// at import time when it cannot resolve a driver, so in a job with no browser and
// no node_modules these gates do not fail a measurement — they fail to start. The
// `validate` job is exactly that job: it installs nothing, because every gate it
// lists explicitly is dependency-free by design. Running the whole sweep there
// turned nine browser gates into nine import errors and took the job red for a
// reason that had nothing to do with the tree (F-CI1).
//
// --node-only runs the dependency-free subset and NAMES what it left out. It does
// not count the omissions as passes: the browser gates are run, and reported, by
// the `contract` job, which installs a driver on purpose.
const BROWSER_GATES = new Set([
  "component-inventory",
  "check-rtl",
  "check-visual",
  "contrast-cross-browser",
  "docs-behaviours",
  "glass-budget",
  "perf-budget",
  "wc-contract",
  "workspace-shell",
]);
const nodeOnly = process.argv.includes("--node-only");
const selected = nodeOnly ? gates.filter(([n]) => !BROWSER_GATES.has(n)) : gates;
const deferred = nodeOnly ? gates.filter(([n]) => BROWSER_GATES.has(n)).map(([n]) => n) : [];

const present = selected.filter(([, , args]) => existsSync(join(ROOT, args[0])));
const absent = selected
  .filter(([, , args]) => !existsSync(join(ROOT, args[0])))
  .map(([n]) => n)
  .concat(deferred.map((n) => `${n} (browser)`));
// A gate that is not in this artifact cannot pass, fail, or mean anything.
// `files` ships dist/ and src/ only, so the published bin used to report
// "FAIL check-tokens ... FAIL family-gate" — 17 failures on a healthy tree, because
// every dispatched path was missing. Absent is reported as absent, and an empty run
// is a failure rather than a pass.
if (!present.length) {
  console.error("doctor: no gates present in this artifact — that is a report of nothing, not a pass.");
  process.exit(1);
}

const JOBS = Math.max(
  1,
  Number(process.env.DOCTOR_JOBS) || Math.min(4, availableParallelism?.() ?? 1),
);

/** Run one gate and resolve to its result row. Never rejects. */
function runGate([name, cmd, args]) {
  return new Promise((resolve) => {
    execFile(
      cmd,
      args,
      { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
      (err, stdout, stderr) => {
        const exit = err ? (typeof err.code === "number" ? err.code : 1) : 0;
        const out = err ? (stdout || "") + (stderr || "") : stdout || "";
        resolve({
          name,
          ok: exit === 0,
          exit,
          output: out.trim().split("\n").slice(-3).join(" | "),
        });
      },
    );
  });
}

const results = new Array(present.length);
let next = 0;
let printed = 0;

// Print in declaration order as soon as the next row is known, so the log reads
// the same on every run while still streaming while the pool is still working.
function flush() {
  while (printed < results.length && results[printed]) {
    const r = results[printed];
    if (!json) console.log(`${r.ok ? "OK  " : "FAIL"} ${r.name}`);
    printed += 1;
  }
}

// Phase 1 — the mutators, alone.
for (let i = 0; i < present.length; i += 1) {
  if (!SERIAL.has(present[i][0])) continue;
  results[i] = await runGate(present[i]);
  flush();
}

// Phase 2 — every reader, through a bounded pool.
await Promise.all(
  Array.from({ length: Math.min(JOBS, present.length) }, async () => {
    for (;;) {
      const i = next;
      next += 1;
      if (i >= present.length) return;
      if (results[i]) continue; // already done in the serial phase
      results[i] = await runGate(present[i]);
      flush();
    }
  }),
);

const allOk = results.every((r) => r.ok);

if (!json && absent.length) {
  // Two different reasons end up here and they must not read the same: a gate
  // this artifact does not ship, and a gate this *run* was told to leave to
  // another job. Only the second is a statement about the tree.
  console.log(`SKIP ${absent.length} gate(s) not run here: ${absent.join(", ")}`);
  if (deferred.length) {
    console.log(`     ${deferred.length} of those need a browser driver and are run by the \`contract\` job.`);
  }
}
if (json) {
  console.log(JSON.stringify({ ok: allOk, gates: results, notShipped: absent }, null, 2));
}
process.exit(allOk ? 0 : 1);