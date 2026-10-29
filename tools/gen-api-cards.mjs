#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { inventory } from "./lib/inventory.mjs";
import { buildComponentsDocument } from "./lib/components.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
// The same derivation tools/build.mjs and tools/check-components.mjs call, so a
// card can never read a field the shipped contour.components.json would not have
// (inventory itself carries no `blocks` key — the detail map is `rules`).
const doc = buildComponentsDocument(inventory());
const blocks = doc.blocks;
if (!blocks.length) throw new Error("refusing to emit API cards from an empty component document");

// Build a compact API card per block from inventory data.
const cards = blocks.map((b) => {
  const name = b.name;
  const tag = "contour-" + name.replace(/^c-/, "");
  const inputs = (b.inputs || []).map((i) => `<code>${i}</code>`).join(", ") || "—";
  const vars = (b.vars || []).map((v) => `<code>${v}</code>`).join(", ") || "—";
  const variants = (b.variants || []).map((v) => `<code>${v}</code>`).join(", ") || "—";
  const elems = (b.elements || []).length;
  const toks = (b.tokens || []).length;
  return `          <details class="c-disclosure" data-api-card="${name}">
            <summary class="c-disclosure__summary"><code>${tag}</code></summary>
            <div class="c-disclosure__body">
              <dl class="c-stack">
                <dt>Inputs</dt><dd>${inputs}</dd>
                <dt>Vars</dt><dd>${vars}</dd>
                <dt>Variants</dt><dd>${variants}</dd>
                <dt>Elements</dt><dd>${elems}</dd>
                <dt>Tokens</dt><dd>${toks}</dd>
              </dl>
            </div>
          </details>`;
}).join("\n");

const marker = "<!-- API-CARDS:GENERATED -->";
const endMarker = "<!-- /API-CARDS:GENERATED -->";
const block = `${marker}\n          <div class="c-panel">\n            <div class="c-panel__head"><div><h3 class="c-panel__title">Component API reference</h3></div></div>\n            <div class="c-panel__body">\n              <div class="c-stack">\n                <p>Per-element reference generated from <code>contour.components.json</code>: host-set inputs, sheet-defaulted vars, variants, element count and token count. Regenerate with <code>node tools/gen-api-cards.mjs</code>.</p>\n${cards}\n              </div>\n            </div>\n          </div>\n${endMarker}`;

const indexPath = join(ROOT, "index.html");
const html = readFileSync(indexPath, "utf-8");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Replace the whole region — the blank line before the block, the block itself
// and the blank line after it — with one canonical layout. Stripping only
// marker..endMarker while inserting "\n\n" grew the file by two blank lines on
// every run, so a regenerated guide could never be a fixed point.
const re = new RegExp("\\n*" + esc(marker) + "[\\s\\S]*?" + esc(endMarker) + "\\n*");
let out;
if (re.test(html)) {
  out = html.replace(re, `\n\n${block}\n\n`);
} else {
  // No block yet: insert before the "Reactivity, counted" panel.
  const anchor = '          <div class="c-panel" data-wc-demo>';
  if (!html.includes(anchor)) throw new Error("anchor not found");
  out = html.replace(anchor, `\n${block}\n\n${anchor}`, 1);
}
writeFileSync(indexPath, out);
console.log("Injected", blocks.length, "API cards into index.html");
