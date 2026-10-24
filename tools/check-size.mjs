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

import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
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
  // The docs package (C-45). Measured 2026-10-23 at 43.6 kB: 23 section files
  // (37.4 kB) plus the index (6.2 kB) — figures this gate recomputes and prints on
  // every run, so the numbers above are a dated record, not the thing enforced.
  // The budget was first reached by removing content instead of raising the limit:
  // the per-element, variant and state figures that already ship in
  // `contour.components.json`, and a four-bullet provenance block repeated in
  // every file where one line naming the source hash does the job.
  //
  // The index then grew 4.8 → 6.2 kB for one reason, and it is a deliverable
  // rather than slack: the token census table, 1,284 bytes, which is 20% of the
  // index and appears EXACTLY ONCE in the shipped package — no other artifact in
  // `dist/` carries a `**Total**` row and no section file repeats it. C-45 asks the
  // docs to carry the tables stamp computes, so the line moves; had the table been
  // restated in the section files too, the answer would have been to delete the
  // copies, not to raise the budget.
  //
  // It is budgeted as ONE directory total because its file count is the guide's
  // section count: a per-file limit would be re-typed every time a section is
  // added, which is a chore that quietly turns into a rubber stamp. The index gets
  // its own tighter line so a change there is not hidden by the files around it
  // shrinking. The two overlap on purpose — these are independent limits, not a
  // partition — and a directory key is measured by summing the files under it,
  // because `statSync` on a directory reports the inode's size, which would make
  // this budget a pass at 4 kB over a 42 kB package.
  "docs/": 45 * 1024,
  "docs/index.json": 7 * 1024,
  // The registry (C-46). Measured 2026-10-24 at 16,443 bytes across 5 files:
  // registry.json 8,952 B plus four item files of 1,869–1,884 B — figures this gate
  // recomputes and prints every run, so the numbers here are a dated record, not the
  // thing enforced. The budget is deliberately small because the registry is POINTERS
  // (`files[].path`): the alternative shape the live schema also allows,
  // `files[].content`, would have copied the four stylesheets into JSON beside the
  // files that already ship — 466,887 bytes measured, a 70% jump on all of dist/. If
  // this line ever moves sharply, check whether someone inlined content before
  // reaching for a bigger budget.
  "registry/": 18 * 1024,
  // Opt-in single-file bundle (build --single): the minified CSS with the
  // self-hosted fonts inlined as data URIs. Budgeted loosely because it is
  // ~260 kB larger than contour.min.css by construction; the gate exists to
  // catch an accidental doubling, not to keep it small.
  "contour.single.min.css": 500 * 1024,
  "contour.single.html": 520 * 1024,
  "contour.single.min.js": 24 * 1024,
  "agent-rules.json": 12 * 1024,
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

// There used to be a second staleness test here: any source whose mtime was newer than
// `builtAt` was called stale, on the theory that it caught "a source the manifest never
// covered". It could not — the loop iterated `manifest.sources`, every entry of which
// the hash pass above already reads. So its only unique behaviour was to fire when the
// CONTENT was identical and only the timestamp had moved, which is a false red.
//
// That stayed latent until C-46 made `index.html` a build input, because
// `tools/snippets.mjs` rewrites `index.html` unconditionally (line 220 writes without
// comparing). Running the documented order — snippets, build, check-size — then became
// impossible: the repo's own tooling reported the bundle stale against bytes it had not
// changed. The hash pass is strictly stronger in both directions: it fires on every
// content change, including one restored by `cp` with an OLDER mtime that this branch
// waved through, and it stays quiet on a touch-only rewrite. So the branch is gone
// rather than narrowed, and `builtAt` with it.

if (stale.length) {
  fail(["check-size: dist/ is STALE — the bytes below are not what the current src/ produces.", ...stale.map((s) => "  " + s), "\nRun: node tools/build.mjs"]);
}

// -- 2. Does each bundle fit? -------------------------------------------------
/**
 * Bytes of a shipped path, and how many files that figure was summed over.
 *
 * A budget key ending in `/` is a directory. `statSync` on a directory returns
 * the size of its inode — 4 kB on this filesystem — so a 44 kB budget over a
 * 42 kB package would have passed while measuring nothing at all. The file count
 * travels with the bytes and is printed, so a pass states what it compared
 * instead of implying it.
 */
function measure(path) {
  const st = statSync(path);
  if (!st.isDirectory()) return { bytes: st.size, files: 1 };
  let bytes = 0;
  let files = 0;
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const p = join(path, entry.name);
    if (entry.isDirectory()) {
      const nested = measure(p);
      bytes += nested.bytes;
      files += nested.files;
    } else {
      bytes += statSync(p).size;
      files += 1;
    }
  }
  return { bytes, files };
}

const rows = [];
let over = 0;
for (const [file, budget] of Object.entries(BUDGETS)) {
  const path = join(DIST, file);
  if (!existsSync(path)) {
    // Opt-in artifacts (build --single) are not required in a default build.
    if (file === "contour.single.min.css" || file === "contour.single.html" || file === "contour.single.min.js") continue;
    rows.push({ file, bytes: null, files: null, budget, status: "MISSING" });
    over += 1;
    continue;
  }
  const { bytes, files } = measure(path);
  // An empty directory is not "within budget", it is a budget over nothing.
  if (files === 0) {
    rows.push({ file, bytes: 0, files: 0, budget, status: "EMPTY" });
    over += 1;
    continue;
  }
  const status = bytes <= budget ? "OK" : "OVER BUDGET";
  if (bytes > budget) over += 1;
  rows.push({ file, bytes, files, budget, status });
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ builtAt: manifest.builtAt, stale, rows }, null, 2));
} else {
  console.log(`dist built ${manifest.builtAt}`);
  for (const r of rows) {
    const size = r.bytes === null ? "—" : `${kB(r.bytes).padStart(9)}${r.files > 1 ? ` (${r.files} files)` : ""}`;
    console.log(`  ${r.file.padEnd(34)} ${size}  budget ${kB(r.budget).padStart(9)}  ${r.status}`);
  }
}

if (over) {
  fail([`\ncheck-size: ${over} bundle(s) over budget.`]);
}

if (!process.argv.includes("--json")) console.log("\ncheck-size: dist/ is current and every bundle is within budget. OK");
process.exit(0);
