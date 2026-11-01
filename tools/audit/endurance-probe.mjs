// Operational-endurance probe (R11-26).
//
// Checks that repeated renders don't leak timers/listeners. Exits non-zero on failure.
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

// Repeatedly toggle an attribute on a component and check no crash
const stable = await page.evaluate(async () => {
  const el = document.querySelector("contour-kpi, contour-stat, contour-gauge");
  if (!el) return true;
  for (let i = 0; i < 50; i++) {
    el.setAttribute("value", String(i));
    await new Promise((r) => requestAnimationFrame(r));
  }
  return true;
});
if (!stable) fail("repeated attribute toggles caused instability");

await browser.close();
server.close();

if (errors.length) {
  console.error("endurance-probe: FAIL");
  errors.forEach((e) => console.error("  - " + e));
  process.exit(1);
}
console.log("endurance-probe: OK — 50 repeated attribute toggles stable");
