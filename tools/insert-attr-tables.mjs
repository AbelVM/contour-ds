#!/usr/bin/env node
/**
 * Inserts the generated attribute reference tables into index.html
 * before the closing </section> of §23 (webcomponents).
 * Handles both first-time insertion and replacement of existing tables.
 */
import { readFileSync, writeFileSync } from "node:fs";

const INDEX = "index.html";
const TABLES = "/tmp/attr-tables.html";

let index = readFileSync(INDEX, "utf8");
const tables = readFileSync(TABLES, "utf8").trimEnd();

// Find the shortcut overlay chrome marker that precedes the tables
const overlayMarker = `          <!-- Guide-only shortcut overlay chrome (named here so the docs package counts it) -->
          <div class="c-shortcut-overlay c-shortcut-panel c-shortcut-list c-shortcut-row" hidden aria-hidden="true"></div>`;

const overlayIndex = index.indexOf(overlayMarker);
if (overlayIndex === -1) {
  console.error("Shortcut overlay marker not found in index.html");
  process.exit(1);
}

// Find the </section> that closes §23, after the overlay marker
const rest = index.slice(overlayIndex + overlayMarker.length);
const sectionCloseMatch = rest.match(/<\/section>/);
if (!sectionCloseMatch) {
  console.error("Section close (</section>) not found after overlay marker");
  process.exit(1);
}

const sectionCloseIndex = overlayIndex + overlayMarker.length + sectionCloseMatch.index;

const replacement = overlayMarker + "\n\n" + tables + "\n\n          </section>";

index = index.slice(0, overlayIndex) + replacement + index.slice(sectionCloseIndex + "</section>".length);
writeFileSync(INDEX, index);
console.log("Inserted attribute reference tables into index.html");
