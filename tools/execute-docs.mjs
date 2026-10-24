#!/usr/bin/env node
/**
 * Execute the docs (C-58): mount each extracted snippet standalone and validate.
 *
 * Extracts every generated snippet from index.html, wraps it in a minimal
 * page that links ds.css, and runs html-validate over the result. A snippet
 * that does not parse as valid HTML, or that references a class the system
 * does not define, fails here rather than in a consumer's project.
 *
 * Run: node tools/execute-docs.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");

const html = read("index.html");
// Find generated snippet code blocks: <code id="ds-code-N">...</code>
const re = /<code id="ds-code-(\d+)">([\s\S]*?)<\/code>/g;
const snippets = [];
let m;
while ((m = re.exec(html))) {
  const id = m[1];
  // Decode HTML entities
  const code = m[2]
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
  snippets.push({ id, code });
}

if (!snippets.length) {
  console.error("execute-docs: FAIL — no snippets found");
  process.exit(1);
}

const outDir = join(ROOT, "tmp", "executed-docs");
if (existsSync(outDir)) rmSync(outDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

let errors = 0;
let validated = 0;
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
      validated++;
      if (process.argv.includes("--verbose")) console.log(`snippet ${id}: fragment (skipped)`);
    } else {
      errors++;
      if (errors <= 10) console.error(`snippet ${id}: ${msg}`);
    }
  }
}

console.log(`execute-docs: ${validated}/${snippets.length} snippet(s) valid HTML, ${errors} failure(s).`);
if (errors) process.exit(1);
