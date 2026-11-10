#!/usr/bin/env node
/**
 * Generate editor snippets from the shipped component contract (CDS-037).
 * Output: dist/contour.code-snippets (VS Code snippet JSON)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const DIST = join(ROOT, "dist");

function blockToTag(name) {
  const base = name.replace(/^c-/, "");
  return base.startsWith("contour-") ? base : "contour-" + base;
}

const components = JSON.parse(readFileSync(join(DIST, "contour.components.json"), "utf8"));
const dts = readFileSync(join(DIST, "contour.d.ts"), "utf8");
const mapMatch = dts.match(/interface HTMLElementTagNameMap\s*\{([\s\S]*?)\n\s*\}/);
if (!mapMatch) throw new Error("HTMLElementTagNameMap not found");
const registered = new Set();
for (const m of mapMatch[1].matchAll(/"([^"]+)"/g)) registered.add(m[1]);

const blocksByTag = new Map();
for (const b of components.blocks) blocksByTag.set(blockToTag(b.name), b);

const snippets = {};
for (const tag of [...registered].sort()) {
  const block = blocksByTag.get(tag);
  const name = block ? block.name : tag;
  // Skip shadow-internal helpers? keep all registered tags - they are real elements.
  const attrs = block ? (block.attributes || []) : [];
  const bools = new Set(block ? (block.booleanAttributes || []) : []);
  // pick a couple of common non-boolean attrs for tabstops
  const attrParts = [];
  let tab = 1;
  for (const a of attrs) {
    if (bools.has(a)) continue;
    if (["src","items","data","series","rows","columns","options","value","label","title","placeholder","name"].includes(a)) {
      attrParts.push(` ${a}="\${${tab++}:${a}}"`);
      if (tab > 3) break;
    }
  }
  const body = attrParts.length ? `<${tag}${attrParts.join("")}>$0</${tag}>` : `<${tag}>$0</${tag}>`;
  snippets[`Contour: ${tag}`] = {
    prefix: [tag, name],
    body: [body],
    description: block ? `Contour ${name} (${block.maturity || "component"})` : `Contour element ${tag}`,
    scope: "html,vue,jsx,tsx"
  };
}

writeFileSync(join(DIST, "contour.code-snippets"), JSON.stringify(snippets, null, 2) + "\n", "utf8");
console.log(`gen-snippets-editor: ${Object.keys(snippets).length} snippets`);
