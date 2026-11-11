#!/usr/bin/env node
/**
 * CDS-075: documentation behaviours that a static story cannot prove.
 *
 * Two claims need a real scrolling page and a real viewport:
 *
 *   1. the TOC marks the section the reader is in — at load, after scrolling
 *      forward, after scrolling back, and at the bottom of the document;
 *   2. below 56rem the docs navigation is a native popover drawer: closed and
 *      hidden by default, opened by its toggle, dismissed by Escape, with the
 *      page still free of horizontal scroll.
 *
 * Exits non-zero on a failed assertion and exits (not skips) when no browser
 * driver is found, because a gate that does not run is a gate that passes.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "./lib/browser.mjs";

const ROOT = process.cwd();
const css = readFileSync(join(ROOT, "dist/contour.min.css"), "utf8");
const wc = readFileSync(join(ROOT, "dist/contour-wc.min.js"), "utf8");

let failures = 0;
let checks = 0;

function ok(msg) {
  checks += 1;
  console.log(`  OK   ${msg}`);
}

function fail(msg) {
  failures += 1;
  checks += 1;
  console.log(`  FAIL ${msg}`);
}

function expectEqual(actual, expected, msg) {
  if (actual === expected) ok(`${msg} (${JSON.stringify(actual)})`);
  else fail(`${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const browser = await chromium.launch({ headless: true });
try {
  // ── 1. TOC scroll-spy ───────────────────────────────────────────────────
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8">
      <style>${css}
        html { scroll-behavior: auto; }
        body { margin: 0; padding: 1rem; }
        #toc { margin-block-end: 2rem; }
        article { max-inline-size: 60ch; margin-inline: auto; }
        section { block-size: 1200px; }
      </style></head><body>
      <contour-toc id="toc" title="On this page" items='[
        {"label":"Introduction","href":"#intro"},
        {"label":"Installation","href":"#install"},
        {"label":"Theming","href":"#theming"}
      ]'></contour-toc>
      <article>
        <section id="intro"><h2>Introduction</h2><p>Intro copy.</p></section>
        <section id="install"><h2>Installation</h2><p>Install copy.</p></section>
        <section id="theming"><h2>Theming</h2><p>Theming copy.</p></section>
      </article></body></html>`);
    await page.addScriptTag({ content: wc });
    await page.waitForFunction(() => customElements.get("contour-toc"), null, { timeout: 15000 });
    await page.waitForFunction(() => document.querySelectorAll(".c-toc__link").length === 3, null, { timeout: 5000 });

    const current = () => page.evaluate(() => {
      const links = Array.from(document.querySelectorAll(".c-toc__link"));
      const marked = links.filter((a) => a.getAttribute("aria-current") === "true");
      return { count: marked.length, id: marked[0] ? marked[0].getAttribute("href") : null, scrollY: Math.round(window.scrollY) };
    });
    const settle = async () => { await page.waitForTimeout(120); };

    expectEqual((await current()).id, "#intro", "TOC at load marks the first section");
    expectEqual((await current()).count, 1, "TOC at load marks exactly one link");

    await page.evaluate(() => document.getElementById("install").scrollIntoView({ block: "start", behavior: "auto" }));
    await settle();
    const mid = await current();
    expectEqual(mid.id, "#install", "TOC after scrolling forward marks the section under the reading line");
    expectEqual(mid.count, 1, "TOC after scrolling forward marks exactly one link");
    if (mid.scrollY > 0) ok(`scroll position really moved (${mid.scrollY}px)`);
    else fail("scroll position did not move — the spy was measured at the top");

    await page.evaluate(() => document.getElementById("theming").scrollIntoView({ block: "start", behavior: "auto" }));
    await settle();
    expectEqual((await current()).id, "#theming", "TOC marks the last section after scrolling to it");

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await settle();
    const bottom = await current();
    expectEqual(bottom.id, "#theming", "TOC at the document bottom keeps the last link current");
    expectEqual(bottom.count, 1, "TOC at the document bottom marks exactly one link");

    await page.evaluate(() => window.scrollTo(0, 0));
    await settle();
    const back = await current();
    expectEqual(back.id, "#intro", "TOC after scrolling back to the top marks the first section again");
    expectEqual(back.count, 1, "TOC after scrolling back marks exactly one link");

    await page.close();
  }

  // ── 2. Docs navigation drawer ───────────────────────────────────────────
  const drawerPage = async (width, height) => {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8">
      <style>${css}
        body { margin: 0; padding: 1rem; }
        article { min-block-size: 60rem; }
      </style></head><body>
      <div class="c-docs-shell">
        <button class="c-docs-shell__nav-toggle" type="button" popovertarget="doc-nav" aria-label="Documentation menu">Menu</button>
        <nav class="c-docs-shell__nav" id="doc-nav" popover aria-label="Documentation">
          <div class="c-docs-nav">
            <a class="c-docs-nav__link" href="#doc-intro">Introduction</a>
            <a class="c-docs-nav__link" href="#doc-install">Installation</a>
          </div>
        </nav>
        <article class="c-docs-shell__article">
          <h1 id="doc-intro">Introduction</h1>
          <p>Article copy.</p>
          <h2 id="doc-install">Installation</h2>
        </article>
      </div></body></html>`);
    await page.waitForTimeout(120);
    return page;
  };

  {
    const page = await drawerPage(390, 844);
    const state = () => page.evaluate(() => {
      const toggle = document.querySelector(".c-docs-shell__nav-toggle");
      const nav = document.getElementById("doc-nav");
      const rect = nav.getBoundingClientRect();
      return {
        toggleVisible: getComputedStyle(toggle).display !== "none",
        navDisplay: getComputedStyle(nav).display,
        open: nav.matches(":popover-open"),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

    let s = await state();
    expectEqual(s.toggleVisible, true, "390: drawer toggle is visible");
    expectEqual(s.open, false, "390: drawer starts closed");
    expectEqual(s.navDisplay, "none", "390: closed drawer is not painted");
    expectEqual(s.overflow, 0, "390: page has no horizontal overflow");

    await page.click(".c-docs-shell__nav-toggle");
    await page.waitForTimeout(120);
    s = await state();
    expectEqual(s.open, true, "390: toggle opens the popover drawer");
    expectEqual(s.navDisplay, "block", "390: open drawer paints");
    if (s.right <= 390) ok(`390: drawer stays inside the viewport (right edge ${s.right})`);
    else fail(`390: drawer overflows the viewport (right edge ${s.right})`);
    expectEqual(s.overflow, 0, "390: open drawer adds no horizontal page overflow");

    await page.keyboard.press("Escape");
    await page.waitForTimeout(120);
    s = await state();
    expectEqual(s.open, false, "390: Escape closes the drawer");
    const focusReturned = await page.evaluate(() => document.activeElement?.classList.contains("c-docs-shell__nav-toggle"));
    expectEqual(focusReturned, true, "390: focus returns to the drawer toggle");

    await page.close();
  }

  {
    const page = await drawerPage(1440, 900);
    const s = await page.evaluate(() => {
      const toggle = document.querySelector(".c-docs-shell__nav-toggle");
      const nav = document.getElementById("doc-nav");
      return {
        toggleDisplay: getComputedStyle(toggle).display,
        navDisplay: getComputedStyle(nav).display,
        open: nav.matches(":popover-open"),
        static: getComputedStyle(nav).position,
      };
    });
    expectEqual(s.toggleDisplay, "none", "1440: drawer toggle is not rendered");
    expectEqual(s.navDisplay, "block", "1440: nav is an ordinary column");
    expectEqual(s.open, false, "1440: nav is not in the top layer");
    expectEqual(s.static, "sticky", "1440: nav keeps the sticky column position");
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(`\ndocs-behaviours: ${checks - failures}/${checks} checks passed`);
if (failures) {
  console.log(`FAIL docs-behaviours: ${failures} check(s) failed`);
  process.exit(1);
}
console.log("OK   docs-behaviours: TOC follows the reading position and the drawer is a native popover");