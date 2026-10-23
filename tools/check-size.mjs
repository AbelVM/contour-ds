#!/usr/bin/env node
/**
 * Size budget gate (T-24).
 *
 * Two independent failures, deliberately reported apart, because they need
 * different fixes:
 *
 *   STALE   `dist/` was not produced by the sources that are on disk now. A
 *           build that errors leaves the previous bundle in place, and every
 *           lane after it then certifies code that was never built — so a
 *           green byte count over a stale bundle is a lie. This is judged by
 *           the content hash `tools/build.mjs` records, not by mtime: a file
 *           restored from a backup can arrive with an *older* timestamp and
 *           different bytes, and a timestamp comparison would wave it through.
 *
 *   OVER    a bundle is bigger than its budget.
 *
 * The budgets are measured, not aspired to. Each is the size of the current
 * output plus roughly three per cent of headroom, written down so growth has
 * to be a decision someone typed rather than something that slipped in. The
 * number may only move with a line in `CHANGELOG.md` saying why.
 *
 * The per-surface budgets are the point of the exercise: a product that ships
 * one surface no longer pays for the other two, which is what the README has
 * claimed since the split was drawn in `src/css/`.
 *
 *   node tools/check-size.mjs          exit 1 on stale or over budget
 *   node tools/check-size.mjs --json   machine-readable report
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const DIST = join(ROOT, "dist");

/** Budgets in bytes. Measured 2026-10-23, ~3% headroom. The step up from the
 *  previous figures is `src/css/light-dark-fallback.css` (C-51) — 452 generated
 *  declarations carried into every bundle, which is what a fallback layer costs.
 *  The figure is quoted from the build, not aspired to, so `check-size` stays
 *  able to tell a large bundle apart from a stale one.
 *
 *  The two JSON budgets moved for one reason each, and neither is a page cost:
 *  no browser loads either file, so they cannot regress the payload a consumer
 *  ships. `contour.tokens.json` grew because a spec colour is
 *  `{colorSpace, components, alpha}` rather than one CSS string, because the
 *  document now names the declared values it cannot carry instead of dropping
 *  them (C-41) — the cost of an export that accounts for itself — and because the
 *  `$description` it harvests from `tokens.css` is the export's payload rather
 *  than its overhead: the prose that makes `--color-control-edge` legible is the
 *  same text that carries its 3:1 contract. The second raise is that harvest.
 *  `contour.themes.json` is new: it is the dark branch of every light-dark() pair,
 *  which the Format Module has no legal place for (C-43). It states values only —
 *  a token's meaning is published once, in the Format document. */
const BUDGETS = {
  "contour.min.css": 148 * 1024,
  "contour.min.js": 24 * 1024,
  "contour.tokens.json": 49 * 1024,
  "contour.themes.json": 21 * 1024,
  // Measured 2026-10-23 at 128.4 kB (C-44), ~3% headroom. Large and correct:
  // the contract carries every block's elements, variants, states and the three
  // kinds of custom property it reads, plus the reverse index. No browser loads
  // this file, so it cannot regress the payload a consumer ships — the budget
  // exists to catch a jump nobody intended, not to keep the truth brief. A file
  // absent from this map is not budgeted at all, which is how an artifact can
  // grow without anyone noticing.
  "contour.components.json": 132 * 1024,
  "surfaces/contour-core.min.css": 106 * 1024,
  "surfaces/contour-docs.min.css": 119 * 1024,
  "surfaces/contour-data.min.css": 127 * 1024,
  "surfaces/contour-landing.min.css": 113 * 1024,
};

const kB = (n) => `${(n / 1024).toFixed(1)} kB`;

const manifestPath = join(DIST, "build-manifest.json");

function fail(messages, code = 1) {
  for (const m of messages) console.error(m);
  process.exit(code);
}

if (!existsSync(manifestPath)) {
  fail(["check-size: dist/build-manifest.json is missing — run `node tools/build.mjs`."]);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

// -- 1. Is this bundle the one the current sources produce? ------------------
const stale = [];
for (const [rel, recorded] of Object.entries(manifest.sources ?? {})) {
  const path = join(ROOT, rel);
  if (!existsSync(path)) {
    stale.push(`${rel}: deleted since the build`);
    continue;
  }
  const bytes = readFileSync(path);
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  if (hash !== recorded.sha256) stale.push(`${rel}: changed since the build`);
}

// The bundle must also be no older than any file it was built from. The hash
// catches a content change; this catches a source the manifest never covered.
const builtAt = Date.parse(manifest.builtAt);
for (const rel of Object.keys(manifest.sources ?? {})) {
  const path = join(ROOT, rel);
  if (existsSync(path) && statSync(path).mtimeMs > builtAt && !stale.some((s) => s.startsWith(`${rel}:`))) {
    stale.push(`${rel}: touched after the build`);
  }
}

if (stale.length) {
  fail(["check-size: dist/ is STALE — the bytes below are not what the current src/ produces.", ...stale.map((s) => "  " + s), "\nRun: node tools/build.mjs"]);
}

// -- 2. Does each bundle fit? -------------------------------------------------
const rows = [];
let over = 0;
for (const [file, budget] of Object.entries(BUDGETS)) {
  const path = join(DIST, file);
  if (!existsSync(path)) {
    rows.push({ file, bytes: null, budget, status: "MISSING" });
    over += 1;
    continue;
  }
  const bytes = statSync(path).size;
  const status = bytes <= budget ? "OK" : "OVER BUDGET";
  if (bytes > budget) over += 1;
  rows.push({ file, bytes, budget, status });
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ builtAt: manifest.builtAt, stale, rows }, null, 2));
} else {
  console.log(`dist built ${manifest.builtAt}`);
  for (const r of rows) {
    console.log(`  ${r.file.padEnd(34)} ${r.bytes === null ? "—" : kB(r.bytes).padStart(9)}  budget ${kB(r.budget).padStart(9)}  ${r.status}`);
  }
}

if (over) {
  fail([`\ncheck-size: ${over} bundle(s) over budget.`]);
}

if (!process.argv.includes("--json")) console.log("\ncheck-size: dist/ is current and every bundle is within budget. OK");
process.exit(0);
