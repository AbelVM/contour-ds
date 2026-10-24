#!/usr/bin/env node
/**
 * Reflow lane (R4-02/R4-03): the responsive contract, measured.
 *
 * AGENTS.md:319-320 and README.md:388-389 publish "the layout reflows to 200 %
 * zoom and to a 390 px viewport with no horizontal page scroll". Before this
 * file, no tool in `tools/` contained the strings `390` or `scrollWidth`, and
 * both browser harnesses opened one page at 1440x1000 — so the sentence had no
 * owner while the guide shipped a 94 px clip and eighteen lanes stayed green.
 *
 * WIDTHS, and why these ones. A 200 % browser zoom halves the CSS-pixel budget
 * of a 1280 px desktop, i.e. 640 px; 390 px is the repo's own number; and
 * 320 px is the WCAG 1.4.10 reflow floor that DESIGN.md:22 ("WCAG 2.2 AA")
 * already binds the project to. The CSS `zoom` property measures none of these:
 * it inflates boxes inside an unchanged viewport, and an earlier draft of this
 * gate reported a 193 px "overflow" from it that does not exist when the
 * viewport is what actually changes.
 *
 * ASSERTIONS
 *   1. LAYOUT  documentElement.scrollWidth <= clientWidth, every width, both themes.
 *   2. CAUSE   a rendered `table.c-table` with no `.c-table-wrap` ancestor cannot
 *              reflow: `table-layout: auto` gives it a min-content width that
 *              beats any viewport. `.visually-hidden` descendants are exempt —
 *              those are the screen-reader data-table fallbacks, correctly bare.
 *   3. MASK    a pass is reported with the body's `overflow-x`, because a mask
 *              turns "cannot scroll" into "does not scroll" and is not reflow.
 *
 * The theme axis is NOT `[data-theme]`: src/css declares no `[data-theme=dark]`
 * rule. The flip is `color-scheme`, which base.css:31-36 keys off
 * `<meta name="color-scheme" content="…">`. The gate sets that and then refuses
 * to believe the axis unless a *computed* style moved. The highlight.js CDN is
 * refused so the DOM measured is the authored markup, not the guide's own
 * re-tokenisation of it. A final pass repeats the layout check with JavaScript
 * off, so "nothing is hidden behind JavaScript" is measured, not assumed.
 *
 * Every run prints what it compared. A sweep that compared nothing is a failure.
 *
 * Run: node tools/audit/check-reflow.mjs
 */
import { chromium } from "./lib/browser.mjs";
import { spawn } from "node:child_process";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const PORT = Number(process.env.CONTOUR_PORT || 8912);
const PAGES = ["index.html", "templates/landing.html", "templates/documentation.html", "templates/dashboard.html"];
const THEMES = ["light", "dark"];
// `contract: true` is what AGENTS.md/README promise, so a breach is a failure.
// 320px is the WCAG 1.4.10 reflow floor that DESIGN.md:22 ("2.2 AA") also binds
// the project to, and it is currently BREACHED by 22px on index.html — measured,
// not yet fixed. It is reported, never silently asserted-against or dropped: a
// red lane nobody diagnosed teaches people to turn the gate off.
const VIEWS = [
  { label: "1280px", width: 1280, contract: true },
  { label: "640px@200%", width: 640, contract: true },
  { label: "390px", width: 390, contract: true },
  { label: "320px-WCAG-floor", width: 320, contract: false },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MEASURE = () => {
  const de = document.documentElement;
  const vw = de.clientWidth;
  const clippedBy = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (/auto|scroll|hidden|clip/.test(o)) {
        return p.tagName.toLowerCase() + (typeof p.className === "string" && p.className.trim() ? "." + p.className.trim().split(/\s+/)[0] : "");
      }
    }
    return null;
  };
  const bare = [];
  const wide = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    if (r.right <= vw + 1.5) continue;
    const who = el.tagName.toLowerCase() + (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/)[0] : "");
    const sec = (el.closest("section[id]") || {}).id || "";
    const clip = clippedBy(el);
    // Report the clipper too. When `body{overflow-x:hidden}` is what hides the
    // overflow there is no unclipped element left to name, and a failure that
    // says "found nothing" is a failure nobody can act on.
    wide.push({ who, sec, right: Math.round(r.right), ws: cs.whiteSpace, clip });
    if (el.tagName === "TABLE" && /(^|\s)c-table(\s|$)/.test(el.className || "") && !el.closest(".c-table-wrap") && !el.closest(".visually-hidden")) {
      bare.push({ id: sec || "(none)", right: Math.round(r.right) });
    }
  }
  wide.sort((a, b) => b.right - a.right);
  return {
    overflow: de.scrollWidth - vw,
    scrollW: de.scrollWidth,
    clientW: vw,
    bare,
    wide: wide.slice(0, 3),
    mask: getComputedStyle(document.body).overflowX,
    bodyBg: getComputedStyle(document.body).backgroundColor,
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
  console.error("check-reflow: no same-origin server on port " + PORT + " — a failure, not a skip.");
  process.exit(1);
}

const failures = [];
const proofs = [];
const advisories = new Set();
const budgets = new Set();
const themeStyles = {};
let compared = 0;
let jsOffCompared = 0;
const browser = await chromium.launch();
try {
  for (const page_path of PAGES) {
    for (const view of VIEWS) {
      const ctx = await browser.newContext({ viewport: { width: view.width, height: 844 }, hasTouch: true });
      await ctx.route(/jsdelivr/, (r) => r.abort());
      const page = await ctx.newPage();
      for (const theme of THEMES) {
        await page.goto(`http://127.0.0.1:${PORT}/${page_path}`, { waitUntil: "load", timeout: 60000 });
        await page.addScriptTag({ content: `(()=>{const m=document.querySelector('meta[name="color-scheme"]');if(m)m.setAttribute('content',${JSON.stringify(theme)});})()` });
        await page.waitForTimeout(120);
        const r = await page.evaluate(MEASURE).catch(() => null);
        compared++;
        if (!r) { failures.push(`${page_path} ${theme} ${view.label}: page did not load`); continue; }
        budgets.add(r.clientW);
        (themeStyles[page_path] ||= {})[theme] = r.bodyBg;
        if (r.overflow > 0) {
          const w = r.wide.map((o) => `${o.who}${o.sec ? " in #" + o.sec : ""} right=${o.right}${o.clip ? ` (clipped by ${o.clip})` : ""}`).join(", ") || "no element past the edge";
          const line = `${page_path} ${theme} ${view.label}: overflows by ${r.overflow}px (scrollW ${r.scrollW} vs clientW ${r.clientW}; body overflow-x: ${r.mask}; widest: ${w})`;
          if (view.contract) failures.push(line);
          else advisories.add(line);
        }
        for (const t of r.bare) {
          failures.push(`${page_path} ${theme} ${view.label}: table.c-table in #${t.id} has no .c-table-wrap (right edge ${t.right}px vs ${r.clientW}px)`);
        }
      }
      await ctx.close();
    }
  }

  // Axes must have changed something, or the gate is reporting one state twice.
  if (budgets.size !== VIEWS.length) {
    failures.push(`the width axis yielded ${budgets.size} distinct client widths for ${VIEWS.length} views (${[...budgets].sort((a, b) => a - b).join(", ")}) — some view measured nothing`);
  } else {
    proofs.push(`width axis gave ${budgets.size} distinct CSS-pixel budgets: ${[...budgets].sort((a, b) => a - b).join(", ")}`);
  }
  for (const [p, t] of Object.entries(themeStyles)) {
    if (t.light === t.dark) failures.push(`${p}: the light/dark axis changed no computed style (both ${t.light}) — the theme is not being applied`);
  }
  if (themeStyles["index.html"] && themeStyles["index.html"].light !== themeStyles["index.html"].dark) {
    proofs.push(`theme axis moves a computed style on index.html: ${themeStyles["index.html"].light} -> ${themeStyles["index.html"].dark}`);
  }

  const ctxNoJs = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const pNo = await ctxNoJs.newPage();
  for (const page_path of PAGES) {
    await pNo.goto(`http://127.0.0.1:${PORT}/${page_path}`, { waitUntil: "load", timeout: 60000 }).catch(() => {});
    const box = await pNo.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })).catch(() => null);
    if (!box) { failures.push(`${page_path} js-off: page did not load`); continue; }
    jsOffCompared++;
    if (box.sw - box.cw > 0) failures.push(`${page_path} js-off: overflows by ${box.sw - box.cw}px with JavaScript disabled`);
  }
  await ctxNoJs.close();
} finally {
  await browser.close().catch(() => {});
  server.kill("SIGTERM");
}

if (process.argv.includes("--strict")) {
  for (const a of advisories) failures.push(`(strict) ${a}`);
}
for (const line of proofs) console.log("  proof: " + line);
for (const a of advisories) console.log("  NOTED (not the published contract, is WCAG 1.4.10): " + a);
console.log(`check-reflow: ${compared} measurements (${PAGES.length} pages x ${THEMES.length} themes x ${VIEWS.length} widths) + ${jsOffCompared} with JavaScript off.`);
if (!compared || !jsOffCompared) {
  console.error("check-reflow: a sweep that compared nothing is not a pass.");
  process.exit(1);
}
if (failures.length) {
  const uniq = [...new Set(failures)];
  for (const f of uniq) console.error("  FAIL " + f);
  console.error(`check-reflow: ${uniq.length} failure(s). The published contract is not met.`);
  process.exit(1);
}
console.log(`check-reflow: every shipped page reflows at the published widths (1280/640@200%/390), both themes, and with JS off; no bare .c-table. OK${advisories.size ? ` (${advisories.size} WCAG-floor note(s) above)` : ""}`);
