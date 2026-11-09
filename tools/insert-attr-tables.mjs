#!/usr/bin/env node
/**
 * Inserts the generated attribute reference tables into index.html
 * before the closing </section> of §23 (webcomponents).
 */
import { readFileSync, writeFileSync } from "node:fs";

const INDEX = "index.html";
const TABLES = "/tmp/attr-tables.html";

let index = readFileSync(INDEX, "utf8");
const tables = readFileSync(TABLES, "utf8").trimEnd();

// Find the closing </section> of §23 — it's the one right after the shortcut overlay div
const marker = `          <!-- Guide-only shortcut overlay chrome (named here so the docs package counts it) -->
          <div class="c-shortcut-overlay c-shortcut-panel c-shortcut-list c-shortcut-row" hidden aria-hidden="true"></div>

          </section>`;

if (!index.includes(marker)) {
  console.error("Marker not found in index.html");
  process.exit(1);
}

const replacement = `          <!-- Guide-only shortcut overlay chrome (named here so the docs package counts it) -->
          <div class="c-shortcut-overlay c-shortcut-panel c-shortcut-list c-shortcut-row" hidden aria-hidden="true"></div>

${tables}

          </section>`;

index = index.replace(marker, replacement);
writeFileSync(INDEX, index);
console.log("Inserted attribute reference tables into index.html");
