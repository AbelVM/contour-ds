#!/usr/bin/env node
/**
 * The deliberate-absence guard (R18-35).
 *
 * Four chart primitives were proposed and declined because no consumer exists
 * for any of them (see INVENTORY.md, "Deliberately not shipped"). A declined
 * proposal is only durable if something refuses to let it back in as a
 * half-built claim — this repository's recurring failure is a name that is
 * documented, typed or storied while no implementation exists, and every gate
 * that counts definitions stays green while that is true.
 *
 * Three rules:
 *
 *   NOT DEFINED        no `define()` for the tag, no `contour-<name>` anywhere
 *                      in `src/`, and no `c-<block>` rule in `src/css`.
 *   NOT DECLARED       no `"contour-<name>"` in the shipped `contour.d.ts`
 *                      TagNameMap, so a typed consumer cannot write markup the
 *                      bundle has no element for.
 *   NOT RENDERED       no `<contour-<name>` in a shipped page, a template or a
 *                      story — the render-all arm of `wc-contract` would fail
 *                      on it, but this says why before it gets that far.
 *
 * And the decision itself must stay published: every name has to appear in
 * INVENTORY.md's absence list. A guard that only forbids would let someone
 * "fix" a red run by deleting the record of why the answer is no.
 *
 * Self-discipline: it prints how many files it read and how many names it
 * checked, and an empty scan is a failure rather than a pass.
 *
 *   node tools/check-absent-components.mjs
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

const ABSENT = [
  { tag: "contour-box-plot", block: "c-box-plot" },
  { tag: "contour-bullet", block: "c-bullet" },
  { tag: "contour-waterfall", block: "c-waterfall" },
  { tag: "contour-sankey", block: "c-sankey" },
];

const errors = [];
const fail = (message) => {
  errors.push(message);
  console.error("FAIL:", message);
};

/** Every file under a directory, recursively, skipping the dirs we never ship. */
const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".zvec-grep") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
};

const srcFiles = walk(join(ROOT, "src"));
const cssFiles = srcFiles.filter((f) => f.endsWith(".css"));
const jsFiles = srcFiles.filter((f) => f.endsWith(".mjs") || f.endsWith(".js"));
const storyFiles = walk(join(ROOT, "stories")).filter((f) => f.endsWith(".js") || f.endsWith(".mjs"));
const pages = [
  join(ROOT, "index.html"),
  ...walk(join(ROOT, "templates")).filter((f) => f.endsWith(".html")),
].filter((f) => existsSync(f));
const dts = join(ROOT, "dist", "contour.d.ts");

if (!srcFiles.length) {
  console.error("check-absent-components: found no source files under src/ — the tree moved, so this scan proves nothing");
  process.exit(1);
}
if (!pages.length) {
  console.error("check-absent-components: found no shipped page — an absence that is only checked against code is half a check");
  process.exit(1);
}

let scanned = 0;
let checked = 0;

for (const { tag, block } of ABSENT) {
  checked += 1;

  // 1) Not defined, referenced or styled anywhere in src/.
  for (const file of jsFiles) {
    scanned += 1;
    const text = readFileSync(file, "utf-8");
    if (text.includes(tag) || text.includes("contour-shadow-" + tag.replace(/^contour-/, ""))) {
      fail(`${relative(ROOT, file)} names ${tag} — the tag is declined, so a reference here is a claim with no element behind it`);
    }
  }
  for (const file of cssFiles) {
    scanned += 1;
    const text = readFileSync(file, "utf-8");
    if (new RegExp(`\\.${block.replace(/[.-]/g, "\\$&")}\\b`).test(text)) {
      fail(`${relative(ROOT, file)} defines .${block} — a CSS block for a component that was declined is half a component`);
    }
  }

  // 2) Not declared in the shipped type map.
  if (existsSync(dts)) {
    scanned += 1;
    const text = readFileSync(dts, "utf-8");
    if (text.includes(`"${tag}"`)) {
      fail(`dist/contour.d.ts declares "${tag}" — a typed consumer would write markup the bundle never defines`);
    }
  } else {
    fail("dist/contour.d.ts is missing — run `node tools/build.mjs`; an undeclared type surface cannot be checked");
  }

  // 3) Not rendered by a shipped page, template or story.
  for (const file of pages.concat(storyFiles)) {
    scanned += 1;
    const text = readFileSync(file, "utf-8");
    if (text.includes(`<${tag}`)) {
      fail(`${relative(ROOT, file)} renders <${tag}> — a shipped surface claims an element that does not exist`);
    }
  }
}

// 4) The decision stays published, with a reason, in the tracked inventory.
const inventoryPath = join(ROOT, "INVENTORY.md");
if (!existsSync(inventoryPath)) {
  fail("INVENTORY.md is missing — the record of why these are absent went with it");
} else {
  scanned += 1;
  const inventory = readFileSync(inventoryPath, "utf-8");
  const heading = "## Deliberately not shipped";
  const start = inventory.indexOf(heading);
  if (start === -1) {
    fail(`INVENTORY.md has no "${heading}" section — the absence decision is no longer recorded anywhere a maintainer reads`);
  } else {
    const nextHeading = inventory.indexOf("\n## ", start + heading.length);
    const section = nextHeading === -1 ? inventory.slice(start) : inventory.slice(start, nextHeading);
    for (const { tag } of ABSENT) {
      if (!section.includes(tag)) {
        fail(`INVENTORY.md's absence list does not name ${tag} — a name dropped from the record is a decision reopened by omission`);
      }
    }
  }
}

if (!scanned) {
  console.error("check-absent-components: read no files — a green exit here would mean nothing");
  process.exit(1);
}

if (errors.length) {
  console.error(`check-absent-components: FAIL — ${checked} declined name(s), ${scanned} file(s) read, ${errors.length} problem(s)`);
  process.exit(1);
}

console.log(
  `check-absent-components: OK — ${checked} declined component(s) absent from ${scanned} file(s) ` +
    "(src, CSS, types, pages, templates, stories) and recorded in INVENTORY.md.",
);