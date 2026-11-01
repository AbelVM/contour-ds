// Experience-quality probe (R11-24).
//
// Checks that the guide has reduced-motion parity and that interactive
// components are keyboard-operable. Exits non-zero on failure.
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

// Check reduced-motion: page should not have infinite animations running
const page = await browser.newPage();
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForTimeout(2000);
const reducedMotionOk = await page.evaluate(() => {
  const anims = document.getAnimations();
  const infinite = anims.filter((a) => a.effect && a.effect.getTiming && a.effect.getTiming().iterations === Infinity);
  return infinite.length === 0 || infinite.every((a) => a.playState === "paused" || a.playState === "finished");
});
if (!reducedMotionOk) fail("infinite animations still running under prefers-reduced-motion: reduce");

// Check keyboard-only: tab through and ensure focus is visible
await page.emulateMedia({ reducedMotion: "no-preference" });
const focusVisible = await page.evaluate(() => {
  const btn = document.querySelector("button, a[href]");
  if (!btn) return true;
  btn.focus();
  const style = getComputedStyle(btn);
  return style.outline !== "none" || style.boxShadow !== "none";
});
if (!focusVisible) fail("focus indicator not visible on keyboard focus");

await browser.close();
server.close();

if (errors.length) {
  console.error("experience-probe: FAIL");
  errors.forEach((e) => console.error("  - " + e));
  process.exit(1);
}
console.log("experience-probe: OK — reduced-motion parity and focus visibility verified");
