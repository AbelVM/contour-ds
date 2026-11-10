#!/usr/bin/env node
/**
 * CDS-031: Browser RTL audit.
 *
 * Loads each shipped page with `dir="rtl"` on the root element and checks for
 * horizontal overflow at the published viewport widths, in both themes.
 * Mirrors check-reflow.mjs but adds the direction axis.
 *
 * Run: node tools/audit/check-rtl.mjs
 */

import { chromium } from "./lib/browser.mjs";
import { spawn } from "node:child_process";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const PORT = Number(process.env.CONTOUR_PORT || 8913);
const PAGES = ["index.html", "templates/landing.html", "templates/documentation.html", "templates/dashboard.html"];
const THEMES = ["light", "dark"];
const DIRECTIONS = ["ltr", "rtl"];
const VIEWS = [
  { label: "1280px", width: 1280, contract: true },
  { label: "640px@200%", width: 640, contract: true },
  { label: "390px", width: 390, contract: true },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MEASURE = () => {
  const de = document.documentElement;
  const vw = de.clientWidth;
  const wide = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    // In RTL, overflow can extend to the left (negative left) or right.
    // Check both: right edge beyond viewport, or left edge negative.
    if (r.right <= vw + 1.5 && r.left >= -1.5) continue;
    const who = el.tagName.toLowerCase() + (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/)[0] : "");
    const sec = (el.closest("section[id]") || {}).id || "";
    wide.push({ who, sec, right: Math.round(r.right), left: Math.round(r.left) });
  }
  wide.sort((a, b) => b.right - a.right);
  return {
    overflow: de.scrollWidth - vw,
    scrollW: de.scrollWidth,
    clientW: vw,
    wide: wide.slice(0, 10),
    mask: getComputedStyle(document.body).overflowX,
    dir: document.documentElement.dir,
  };
};

const server = spawn("python3", ["-m", "http.server", String(PORT), "-d", ROOT], { stdio: "ignore" });
let served = false;
for (let i = 0; i < 40 && !served; i++) {
  await sleep(150);
  try { served = (await fetch(`http://127.0.0.1:${PORT}/${PAGES[0]}`)).ok; } catch { /* not up yet */ }
}
if (!served) {
  server.kill("SIGTERM");
  console.error("check-rtl: no same-origin server on port " + PORT + " — a failure, not a skip.");
  process.exit(1);
}

const failures = [];
const proofs = [];
let compared = 0;
const browser = await chromium.launch();
try {
  for (const page_path of PAGES) {
    for (const view of VIEWS) {
      for (const dir of DIRECTIONS) {
        const ctx = await browser.newContext({ viewport: { width: view.width, height: 844 }, hasTouch: true });
        const page = await ctx.newPage();
        for (const theme of THEMES) {
          await page.goto(`http://127.0.0.1:${PORT}/${page_path}`, { waitUntil: "load", timeout: 60000 });
          // Set direction and theme
          await page.addScriptTag({ content: `
            (()=>{
              document.documentElement.dir = ${JSON.stringify(dir)};
              const m = document.querySelector('meta[name="color-scheme"]');
              if (m) m.setAttribute('content', ${JSON.stringify(theme)});
            })()
          `});
          const result = await page.evaluate(MEASURE);
          compared += 1;
          const label = `${page_path} ${view.label} ${theme} dir=${dir}`;
          if (result.overflow > 0) {
            failures.push(`${label}: scrollWidth ${result.scrollW} > clientWidth ${result.clientW} (overflow ${result.overflow}px), mask=${result.mask}`);
            for (const w of result.wide) {
              failures.push(`  wide: ${w.who} (sec=${w.sec}) right=${w.right} left=${w.left}`);
            }
          } else {
            proofs.push(`${label}: no overflow (scrollW=${result.scrollW}, clientW=${result.clientW}, mask=${result.mask})`);
          }
        }
        await ctx.close();
      }
    }
  }
} finally {
  await browser.close();
  server.kill("SIGTERM");
}

console.log(`check-rtl: ${compared} measurements (${PAGES.length} pages x ${VIEWS.length} views x ${THEMES.length} themes x ${DIRECTIONS.length} directions)`);
for (const p of proofs) console.log(`  OK   ${p}`);
if (failures.length) {
  for (const f of failures) console.log(`  FAIL ${f}`);
  console.log(`check-rtl: ${failures.length} failure(s) — RTL reflow breach`);
  process.exit(1);
}
console.log("check-rtl: no horizontal overflow in LTR or RTL at any published width, both themes. OK");
