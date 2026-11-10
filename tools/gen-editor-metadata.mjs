#!/usr/bin/env node
/**
 * Generate editor integration metadata from the shipped component contract.
 *
 * Outputs (all derived, never hand-edited):
 *   dist/contour.html-data.json   VS Code HTML custom data (tags/attributes)
 *   dist/contour.web-types.json   JetBrains web-types (basic tag/attribute map)
 *
 * Sources of truth:
 *   - dist/contour.components.json  (blocks, attributes, slots, parts, variants)
 *   - dist/contour.d.ts             (registered tag -> element interface map)
 *
 * Run after build: `node tools/gen-editor-metadata.mjs`
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const DIST = join(ROOT, "dist");

function readJson(name) {
  return JSON.parse(readFileSync(join(DIST, name), "utf8"));
}

function parseRegisteredTags(dts) {
  // Extract "tag-name": InterfaceName; pairs from HTMLElementTagNameMap
  const mapMatch = dts.match(/interface HTMLElementTagNameMap\s*\{([\s\S]*?)\n\s*\}/);
  if (!mapMatch) throw new Error("HTMLElementTagNameMap not found in contour.d.ts");
  const tags = new Map();
  for (const m of mapMatch[1].matchAll(/"([^"]+)":\s*([^;]+);/g)) {
    tags.set(m[1], m[2].trim());
  }
  return tags;
}

function blockToTag(name) {
  const base = name.replace(/^c-/, "");
  return base.startsWith("contour-") ? base : "contour-" + base;
}

function attrDescription(block, attr) {
  if (block.booleanAttributes?.includes(attr)) return `Boolean attribute for ${block.name}.`;
  return `Attribute for ${block.name}.`;
}

function tagDescription(block) {
  const parts = [];
  parts.push(`Contour component \`${block.name}\` (${block.maturity || "component"}).`);
  if (block.variants?.length) parts.push(`Variants: ${block.variants.join(", ")}.`);
  if (block.elements?.length) parts.push(`Elements: ${block.elements.join(", ")}.`);
  if (block.parts?.length) parts.push(`Parts: ${block.parts.join(", ")}.`);
  if (block.slots?.length) parts.push(`Slots: ${block.slots.map(s => s || "(default)").join(", ")}.`);
  return parts.join(" ");
}

function buildHtmlData(components, registeredTags) {
  const blocksByTag = new Map();
  for (const b of components.blocks) blocksByTag.set(blockToTag(b.name), b);

  const tags = [];
  for (const [tag] of [...registeredTags.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const block = blocksByTag.get(tag);
    const entry = { name: tag };
    if (block) {
      entry.description = { kind: "markdown", value: tagDescription(block) };
      const attrs = [...new Set([...(block.attributes || []), ...(block.booleanAttributes || [])])].sort();
      if (attrs.length) {
        entry.attributes = attrs.map(a => ({
          name: a,
          description: attrDescription(block, a),
        }));
      }
      // References: point to local docs package if present conceptually; no external URL.
      entry.references = [{ name: "Contour docs", url: `dist/docs/` }];
    } else {
      // Shadow or untracked wrapper tag present in type map.
      entry.description = { kind: "markdown", value: `Contour custom element \`${tag}\`.` };
    }
    tags.push(entry);
  }

  // Also include global/common attributes useful for contour elements
  const globalAttributes = [
    { name: "data-contour", description: "Contour data/configuration attribute hook." },
  ];

  return {
    version: 1.1,
    tags,
    globalAttributes,
  };
}

function buildWebTypes(components, registeredTags) {
  const blocksByTag = new Map();
  for (const b of components.blocks) blocksByTag.set(blockToTag(b.name), b);

  const tags = [];
  for (const [tag, iface] of [...registeredTags.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const block = blocksByTag.get(tag);
    const attrs = block ? [...new Set([...(block.attributes || []), ...(block.booleanAttributes || [])])].sort() : [];
    tags.push({
      name: tag,
      description: block ? tagDescription(block) : `Contour custom element \`${tag}\`.`,
      attributes: attrs.map(a => ({ name: a, description: block ? attrDescription(block, a) : "" })),
      js: { properties: [], events: [] },
      source: { module: "contour-ds" },
    });
  }

  return {
    "$schema": "https://raw.githubusercontent.com/JetBrains/web-types/master/schema/web-types.json",
    name: "contour-ds",
    version: components.version || "2.0",
    "js-types-syntax": "typescript",
    "description-markup": "markdown",
    contributions: {
      html: {
        elements: tags,
      },
    },
  };
}

function main() {
  const components = readJson("contour.components.json");
  const dts = readFileSync(join(DIST, "contour.d.ts"), "utf8");
  const registeredTags = parseRegisteredTags(dts);

  const htmlData = buildHtmlData(components, registeredTags);
  const webTypes = buildWebTypes(components, registeredTags);

  writeFileSync(join(DIST, "contour.html-data.json"), JSON.stringify(htmlData, null, 2) + "\n", "utf8");
  writeFileSync(join(DIST, "contour.web-types.json"), JSON.stringify(webTypes, null, 2) + "\n", "utf8");

  console.log(`gen-editor-metadata: wrote contour.html-data.json (${htmlData.tags.length} tags) and contour.web-types.json`);
}

main();
