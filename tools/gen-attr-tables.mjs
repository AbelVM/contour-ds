#!/usr/bin/env node
/**
 * Generates compact attribute/property reference tables HTML for §23 of index.html.
 * Reads dist/contour.components.json and emits one table per block with real attributes.
 * Output is written to stdout.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const COMPONENTS = join(ROOT, "dist", "contour.components.json");

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const data = JSON.parse(readFileSync(COMPONENTS, "utf8"));
const blocks = data.blocks || [];

// Only blocks with real (non-slot) attributes
const meaningful = blocks.filter((b) =>
  (b.attributes || []).filter((a) => a !== "").length > 0 ||
  (b.booleanAttributes || []).length > 0
);

const rows = [];
for (const b of meaningful) {
  const name = b.name;
  const attrs = (b.attributes || [])
    .filter((a) => a !== "")
    .map((a) => `<code>${esc(a)}</code>`)
    .join(", ") || "—";
  const bools = (b.booleanAttributes || [])
    .map((a) => `<code>${esc(a)}</code>`)
    .join(", ") || "—";
  const slots = (b.slots || [])
    .map((s) => `<code>${esc(s === "" ? "(default)" : s)}</code>`)
    .join(", ") || "—";
  const parts = (b.parts || [])
    .map((p) => `<code>${esc(p)}</code>`)
    .join(", ") || "—";

  rows.push(`
    <tr>
      <td><code>${esc(name)}</code></td>
      <td>${attrs}</td>
      <td>${bools}</td>
      <td>${slots}</td>
      <td>${parts}</td>
    </tr>
  `);
}

const html = `
          <div class="c-panel">
            <div class="c-panel__head">
              <div>
                <h3 class="c-panel__title">Attribute &amp; property reference</h3>
                <p class="c-panel__desc">
                  Every attribute, boolean attribute, slot and part declared by each block,
                  counted from <code class="c-kbd">dist/contour.components.json</code>.
                  Boolean attributes are set by presence; all others take a string value.
                  Blocks with no declared attributes are omitted.
                </p>
              </div>
            </div>
            <div class="c-panel__body">
              <div class="c-table-wrap">
                <table class="c-table">
                  <caption>Component attribute reference (${meaningful.length} blocks)</caption>
                  <thead>
                    <tr>
                      <th>Block</th>
                      <th>Attributes</th>
                      <th>Boolean attributes</th>
                      <th>Slots</th>
                      <th>Parts</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows.join("")}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
`;

// Strip trailing whitespace from every line so html-validate passes.
process.stdout.write(html.split("\n").map((line) => line.replace(/\s+$/, "")).join("\n"));
