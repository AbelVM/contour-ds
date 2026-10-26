#!/usr/bin/env node
/**
 * Execute the docs (C-58): mount each extracted snippet standalone and validate.
 *
 * Extracts every generated snippet from index.html, wraps it in a minimal
 * page that links ds.css, and runs html-validate over the result. A snippet
 * that does not parse as valid HTML, or that names a class the system never
 * defined, fails here rather than in a consumer's project.
 *
 * The class assertion reads the *shipped* bytes — dist/contour.css and
 * dist/hljs.css are minified, so every `.foo` in them is a selector, never a
 * comment — plus the names published in dist/contour.components.json. A name in
 * a snippet that resolves in neither is markup a reader copies and gets nothing
 * for, which is the one failure mode a syntax-only linter cannot see.
 *
 * Three buckets, and only the first is silent:
 *   c-/t-  a system-shaped name the system does not define. Refused unless it
 *          sits in LEDGER below, which names the defect and its owner row and
 *          goes stale on purpose: a ledgered name that starts resolving fails
 *          too, so the ledger cannot outlive the bug it describes.
 *   ds-    the guide's own furniture reaching a copy target, which AGENTS.md
 *          rule 7 forbids. Counted and printed, refused by --strict, because
 *          the fix is in the specimens, not here.
 *   other  classes a third-party runtime writes (highlight.js, MapLibre). The
 *          guide loads those on purpose; see ALLOWED_THIRD_PARTY.
 *
 * Run: node tools/execute-docs.mjs [--strict] [--class-check-only]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { decodeEntities } from "./lib/html.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");
const STRICT = process.argv.includes("--strict");
const CLASS_ONLY = process.argv.includes("--class-check-only");

const html = read("index.html");
// Find generated snippet code blocks: <code id="ds-code-N">...</code>
const re = /<code id="ds-code-(\d+)">([\s\S]*?)<\/code>/g;
const snippets = [];
let m;
while ((m = re.exec(html))) {
  const id = m[1];
  // Decode with the parser's own single-pass decoder, the inverse of the
  // serialiser that wrote the snippet. A chain of replaces decodes twice: an
  // attribute the author wrote as `[&quot;One&quot;]` is published as
  // `&amp;quot;`, which `&amp;`-then-`&quot;` collapses to raw quotes — so the gate
  // mounted markup no browser would read, and reported the emitter's escape as
  // the specimen's fault. AGENTS.md rule 8 is about exactly this pair.
  const code = decodeEntities(m[2]);
  snippets.push({ id, code });
}

if (!snippets.length) {
  console.error("execute-docs: FAIL — no snippets found");
  process.exit(1);
}

// ---- the class assertion the header of this file has always promised -------
const SHIPPED = ["dist/contour.css", "dist/hljs.css", "dist/contour.components.json"];
const missing = SHIPPED.filter((f) => !existsSync(join(ROOT, ...f.split("/"))));
if (missing.length) {
  console.error(`execute-docs: FAIL — the class check reads the shipped bytes and these are absent: ${missing.join(", ")}. Run node tools/build.mjs first (this gate does not skip a missing artifact).`);
  process.exit(1);
}

const defined = new Set();
for (const sheet of ["dist/contour.css", "dist/hljs.css"]) {
  // Minified output has no comments, so a class-shaped token is a selector.
  for (const token of read(sheet).match(/\.[a-zA-Z_-][\w-]*/g) || []) defined.add(token.slice(1));
}
const inventory = JSON.parse(read("dist/contour.components.json"));
for (const block of inventory.blocks) {
  defined.add(block.name);
  for (const list of [block.elements, block.variants, block.states]) {
    for (const name of list || []) defined.add(String(name).replace(/^\./, "").split(/[\s[]/)[0]);
  }
}

// Phantom names in the system's own namespace: the guide's markup claims them,
// no shipped rule resolves them. Listed with what they cost a reader, so the
// gate can be read as a to-do list rather than a wall of failures.
const LEDGER = [
  {
    name: "c-search-trigger--header",
    where: "snippet 39",
    why: "a variant no sheet defines: `.c-search-trigger` ships `__text` and `__kbd` only, so `--header` is a name without a rule",
    owner: "either the header variant is real and belongs in components-shell.css, or the specimen is lying about it",
  },
  {
    name: "c-cursor-demo",
    where: "snippet 114",
    why: "guide furniture wearing a system prefix: the demo span carries an inline `style=` and no shipped rule, which is AGENTS.md's ownership boundary and its rule 7 in one token",
    owner: "move it to `ds-` in the guide's markup and out of the snippet, or ship it as a documented block",
  },
];
const ledgered = new Map(LEDGER.map((e) => [e.name, e]));

// Names a consumer needs the loaded library for, not for contour.css.
const ALLOWED_THIRD_PARTY = [
  { prefix: "hljs-", why: "highlight.js theme classes — the guide loads the library to show the Contour theme (README.md discloses the script)" },
  { prefix: "function_", why: "highlight.js writes this alongside `hljs-title`; it carries no style and belongs to the library" },
  { prefix: "language-", why: "highlight.js language hint on <code>; the library reads it to select the grammar, contour.css does not style it" },
  { prefix: "nohighlight", why: "highlight.js opt-out marker on a code block that is already highlighted by hand (the hljs theme specimen)" },
  { prefix: "maplibregl-", why: "MapLibre's own control markup, which the map specimen mounts" },
];

const classErrors = [];
let guideLeaks = 0;
let thirdPartyUses = 0;
let unresolvedTotal = 0;
let ledgerHits = 0;
for (const { id, code } of snippets) {
  for (const attr of code.match(/class="([^"]*)"/g) || []) {
    for (const token of attr.slice(7, -1).trim().split(/\s+/)) {
      if (!token || defined.has(token)) continue;
      unresolvedTotal++;
      const external = ALLOWED_THIRD_PARTY.find((a) => token.startsWith(a.prefix));
      if (external) {
        thirdPartyUses++;
        continue;
      }
      if (token.startsWith("ds-")) {
        guideLeaks++;
        if (STRICT) classErrors.push(`snippet ${id}: guide-only class \`${token}\` is in a copy target — AGENTS.md rule 7 keeps the guide's own furniture out of the markup a consumer takes`);
        continue;
      }
      const entry = ledgered.get(token);
      if (entry) {
        ledgerHits++;
      } else {
        classErrors.push(`snippet ${id}: class \`${token}\` is not defined in dist/contour.css, dist/hljs.css or the component contract — a reader copies markup that renders unstyled`);
      }
    }
  }
}
// A ledger entry whose bug is fixed is a lie about the tree.
for (const entry of LEDGER) {
  if (defined.has(entry.name)) {
    classErrors.push(`stale ledger: \`${entry.name}\` (${entry.where}) now resolves in the shipped CSS — delete its LEDGER entry, the gate will stop excusing it`);
  }
}

if (classErrors.length) {
  console.error("execute-docs: class existence FAIL");
  for (const e of classErrors) console.error("  " + e);
  process.exit(1);
}
if (CLASS_ONLY) {
  console.log(`execute-docs: --class-check-only — ${unresolvedTotal} unresolved token(s) in ${snippets.length} snippet(s): ${thirdPartyUses} third-party (allowed by name), ${guideLeaks} guide-only (${STRICT ? "refused" : "print-only"}), ${ledgerHits} ledgered, ${unresolvedTotal - thirdPartyUses - guideLeaks - ledgerHits} refused. Nothing outside the ledger resolved to a missing rule.`);
  process.exit(0);
}

const outDir = join(ROOT, "tmp", "executed-docs");
if (existsSync(outDir)) rmSync(outDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

let errors = 0;
let validated = 0;
let fragments = 0;
for (const { id, code } of snippets) {
  const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>snippet ${id}</title>
<link rel="stylesheet" href="../../src/css/ds.css">
</head>
<body>
${code}
</body>
</html>`;
  const file = join(outDir, `snippet-${id}.html`);
  writeFileSync(file, page);
  try {
    execFileSync("npx", ["html-validate", file], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    validated++;
  } catch (e) {
    const raw = (e.stdout || e.stderr || "").trim();
    const lines = raw.split("\n").filter(function(l){ return l.indexOf("npm notice") === -1; });
    const msg = lines.join(" ").slice(0, 300);
    // Fragment snippets (partial lists, partial grids) are expected to be
    // incomplete documents; only fail on real markup errors.
    const fragmentOnly = /no-implicit-close|Unclosed element|close-order/.test(msg)
      && !/no-raw-characters|no-trailing-whitespace|element-permitted-content/.test(msg);
    if (fragmentOnly) {
      fragments++;
      if (process.argv.includes("--verbose")) console.log(`snippet ${id}: fragment (skipped)`);
    } else {
      errors++;
      if (errors <= 10) console.error(`snippet ${id}: ${msg}`);
    }
  }
}

// Every exemption the summary line would otherwise fold into its own pass.
console.log(
  `execute-docs: ${validated}/${snippets.length} snippet(s) valid HTML, ${errors} failure(s), ` +
    `${fragments} excused as fragments (unclosed markup that is not a syntax error, listed with --verbose), ` +
    `${unresolvedTotal} unresolved class token(s) outside the shipped contract, ` +
    `${guideLeaks} guide-only ds- token(s) in copy targets (${STRICT ? "refused" : "print-only"})${STRICT ? "" : ", --strict refuses them"}, ` +
    `${thirdPartyUses} third-party token(s) allowed, ${LEDGER.length} ledger name(s) owned elsewhere.`,
);
if (errors) process.exit(1);
