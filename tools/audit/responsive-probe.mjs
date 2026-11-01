// Responsive and touch-compatibility probe (R11-25).
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

// Test at 320px width with touch emulation
const context = await browser.newContext({ viewport: { width: 320, height: 568 }, hasTouch: true });
const page = await context.newPage();
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForTimeout(2000);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
if (overflow) fail("horizontal overflow at 320px width");

// Check touch targets >= 24px
const smallTargets = await page.evaluate(() => {
  const targets = document.querySelectorAll("button, a, [role='button'], [tabindex]:not([tabindex='-1'])");
  let small = 0;
  for (const t of targets) {
    const r = t.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24)) small++;
  }
  return small;
});
// advisory only, not a failure
console.log(`responsive-probe: ${smallTargets} touch targets below 24px (advisory)`);

await browser.close();
server.close();

if (errors.length) {
  console.error("responsive-probe: FAIL");
  errors.forEach((e) => console.error("  - " + e));
  process.exit(1);
}
console.log("responsive-probe: OK — no horizontal overflow at 320px with touch emulation");
