#!/usr/bin/env node
/**
 * Generate Custom Elements Manifest (CEM) from shipped artifacts (CDS-037).
 * Output: dist/custom-elements.json
 * Sources: dist/contour.components.json, dist/contour.d.ts, src/js/wc/core.mjs (events)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const DIST = join(ROOT, "dist");

function readJson(name) { return JSON.parse(readFileSync(join(DIST, name), "utf8")); }

function parseRegisteredTags(dts) {
  const mapMatch = dts.match(/interface HTMLElementTagNameMap\s*\{([\s\S]*?)\n\s*\}/);
  if (!mapMatch) throw new Error("HTMLElementTagNameMap not found");
  const tags = new Map();
  for (const m of mapMatch[1].matchAll(/"([^"]+)":\s*([^;]+);/g)) tags.set(m[1], m[2].trim());
  return tags;
}

function blockToTag(name) {
  const base = name.replace(/^c-/, "");
  return base.startsWith("contour-") ? base : "contour-" + base;
}

function parseEvents(coreSrc) {
  const evBlock = /CONTOUR_EVENTS\s*=\s*Object\.freeze\(\{([\s\S]*?)\n\s*\}\);/.exec(coreSrc);
  const events = [];
  if (!evBlock) return events;
  for (const line of evBlock[1].split("\n")) {
    const m = line.match(/"(contour:[a-z-]+)"\s*:\s*\{\s*payload:\s*\[([^\]]*)\]/);
    if (!m) continue;
    const payload = m[2].trim();
    const keys = payload ? payload.split(",").map(k => k.trim().replace(/^"|"$/g, "")).filter(Boolean) : [];
    events.push({ name: m[1], keys });
  }
  return events;
}

function main() {
  const components = readJson("contour.components.json");
  const dts = readFileSync(join(DIST, "contour.d.ts"), "utf8");
  const coreSrc = readFileSync(join(ROOT, "src/js/wc/core.mjs"), "utf8");
  const registeredTags = parseRegisteredTags(dts);
  const globalEvents = parseEvents(coreSrc);

  const blocksByTag = new Map();
  for (const b of components.blocks) blocksByTag.set(blockToTag(b.name), b);

  const declarations = [];
  for (const [tag, iface] of [...registeredTags.entries()].sort((a,b)=>a[0].localeCompare(b[0]))) {
    const block = blocksByTag.get(tag);
    const decl = {
      kind: "class",
      name: iface || "ContourElement",
      tagName: tag,
      customElement: true,
    };
    if (block) {
      decl.description = `Contour component ${block.name} (${block.maturity || "component"}).`;
      const attrs = [...new Set([...(block.attributes||[]), ...(block.booleanAttributes||[])])].sort();
      if (attrs.length) {
        decl.attributes = attrs.map(a => {
          const isBool = (block.booleanAttributes||[]).includes(a);
          return {
            name: a,
            type: { text: isBool ? "boolean" : "string" },
            description: isBool ? `Boolean attribute for ${block.name}.` : `Attribute for ${block.name}.`,
          };
        });
        decl.members = attrs.map(a => {
          const isBool = (block.booleanAttributes||[]).includes(a);
          return {
            kind: "field",
            name: a.replace(/-([a-z])/g, (_,c)=>c.toUpperCase()),
            type: { text: isBool ? "boolean" : "string | null" },
            attribute: a,
          };
        });
      }
      const slots = (block.slots||[]).filter(s => s !== undefined);
      if (slots.length) {
        decl.slots = slots.map(s => s ? { name: s } : { name: "", description: "Default slot" });
      }
      const parts = (block.parts||[]).filter(Boolean);
      if (parts.length) decl.cssParts = parts.map(p => ({ name: p }));
      if (block.variants?.length) decl.cssStates = undefined; // not standard; keep out
    } else {
      decl.description = `Contour custom element ${tag}.`;
    }
    // Do not invent per-element events; global event vocabulary is documented separately.
    declarations.push(decl);
  }

  const manifest = {
    schemaVersion: "1.0.0",
    readme: "",
    modules: [
      {
        kind: "javascript-module",
        path: "dist/contour-wc.esm.js",
        declarations,
        exports: declarations.map(d => ({ kind: "custom-element-definition", name: d.tagName, declaration: { name: d.name, module: "dist/contour-wc.esm.js" } })),
      }
    ],
    // Non-standard extension: global contour:* event vocabulary derived from core.mjs
    "x-contour-events": globalEvents,
  };

  writeFileSync(join(DIST, "custom-elements.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`gen-cem: wrote custom-elements.json (${declarations.length} declarations, ${globalEvents.length} global events)`);
}

main();
