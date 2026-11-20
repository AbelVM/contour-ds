#!/usr/bin/env node
/**
 * Storybook freshness — the committed site is the deploy artifact.
 *
 * `storybook/` is committed so GitHub Pages can serve it without a build step.
 * That makes the directory a *derived* artifact with no build between a source
 * edit and a deploy: change `src/js/wc/data.mjs`, and the site Pages serves is
 * still the old one until someone remembers to run `npm run build:storybook`.
 * Nothing in the repository said so, and the drift was real — `build-manifest.json`
 * recorded a build older than eight sources (F-STALE1).
 *
 * `storybook/build-manifest.json` already records a sha256 for every source it
 * consumed, so the check is a re-hash and a comparison rather than a guess about
 * timestamps. It fails in two directions:
 *
 *   - a source that changed after the build (the site is behind), and
 *   - a source the manifest names that no longer exists (the manifest is stale
 *     in a way a re-hash alone would not notice).
 *
 * It deliberately does not rebuild. A gate that fixed the thing it measures
 * would pass on a tree nobody reviewed.
 *
 * Run: node tools/check-storybook-stale.mjs
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MANIFEST = join(ROOT, "storybook", "build-manifest.json");

function fail(lines) {
  for (const l of lines) console.error(l);
  process.exit(1);
}

if (!existsSync(MANIFEST)) {
  fail([
    "check-storybook-stale: storybook/build-manifest.json is missing.",
    "  The committed site is the Pages artifact; run `npm run build:storybook` and commit storybook/.",
  ]);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
} catch (e) {
  fail([`check-storybook-stale: build-manifest.json is not readable JSON (${e.message}).`]);
}

const sources = manifest.sources || {};
const names = Object.keys(sources);
if (!names.length) {
  fail(["check-storybook-stale: the manifest names no sources, so it proves nothing."]);
}

// sha256, truncated the way build.mjs records it.
const digest = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 16);

const stale = [];
const missing = [];
for (const rel of names) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) { missing.push(rel); continue; }
  const recorded = sources[rel].sha256;
  const actual = digest(readFileSync(abs));
  if (recorded && recorded !== actual) stale.push(rel);
}

// A source the manifest does not name but the build would consume is invisible
// to the comparison above, so the two directories the manifest covers are
// checked for new files too. Only files that exist in both places are compared;
// an untracked addition is reported as a coverage gap rather than a mismatch.
const COVERED = ["src/css", "src/js"];
const covered = new Set(names);
const uncovered = [];
for (const dir of COVERED) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) continue;
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      const rel = relative(ROOT, p);
      if (e.isDirectory()) walk(p);
      else if (/\.(css|mjs|js)$/.test(e.name) && !covered.has(rel)) uncovered.push(rel);
    }
  };
  walk(abs);
}

const problems = [];
if (stale.length) {
  problems.push(`  ${stale.length} source(s) changed after the build:`);
  for (const s of stale) problems.push(`    ${s}`);
}
if (missing.length) {
  problems.push(`  ${missing.length} source(s) in the manifest no longer exist:`);
  for (const s of missing) problems.push(`    ${s}`);
}
if (uncovered.length) {
  problems.push(`  ${uncovered.length} source file(s) the manifest does not cover:`);
  for (const s of uncovered.slice(0, 20)) problems.push(`    ${s}`);
  if (uncovered.length > 20) problems.push(`    … and ${uncovered.length - 20} more`);
}

if (problems.length) {
  console.error("check-storybook-stale: the committed Storybook site is behind src/.");
  console.error(`  manifest built at ${manifest.builtAt} from revision ${String(manifest.sourceRevision).slice(0, 8)}`);
  for (const p of problems) console.error(p);
  console.error("  Run `npm run build:storybook` and commit storybook/ — Pages serves what is committed.");
  process.exit(1);
}

console.log(
  `check-storybook-stale: ${names.length} source hashes compared against the committed site ` +
  `(built ${manifest.builtAt}); no source is newer, none is missing, none is uncovered. OK`
);