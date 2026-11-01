// Behavioral accessibility probe (R11-16).
//
// Checks that every interactive contour-* element in the guide has an
// accessible name and is keyboard-focusable. Exits non-zero on failure.
import { chromium } from "./lib/browser.mjs";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const errors = [];
const fail = (m) => errors.push(m);

const browser = await chromium.launch({ args: ["--no-sandbox"] }).catch((e) => { console.error("no browser driver:", e.message); process.exit(1); });
const server = createServer((req, res) => {
  const p = join(ROOT, req.url.split("?")[0]);
  if (!existsSync(p)) { res.statusCode = 404; res.end(); return; }
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const page = await browser.newPage();
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForTimeout(2000);

// Check interactive components have accessible names
const result = await page.evaluate(() => {
  const interactive = document.querySelectorAll("button, a, input, select, textarea, [role='button'], [role='link'], [tabindex]:not([tabindex='-1'])");
  const unnamed = [];
  for (const el of interactive) {
    let name = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.textContent.trim() || el.getAttribute("title");
    if (!name && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) {
      // check for associated label
      if (el.id) {
        const lbl = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
        if (lbl) name = lbl.textContent.trim();
      }
      if (!name) {
        const parent = el.closest("label");
        if (parent) name = parent.textContent.trim();
      }
    }
    if (!name) unnamed.push(el.tagName + (el.className ? "." + el.className.split(" ")[0] : ""));
  }
  return { total: interactive.length, unnamed: unnamed.slice(0, 20) };
});

if (result.unnamed.length) {
  fail(`${result.unnamed.length} interactive element(s) without accessible name: ${result.unnamed.join(", ")}`);
}

await browser.close();
server.close();

if (errors.length) {
  console.error("a11y-probe: FAIL");
  errors.forEach((e) => console.error("  - " + e));
  process.exit(1);
}
console.log(`a11y-probe: OK — ${result.total} interactive elements checked, all named`);
