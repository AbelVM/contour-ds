#!/usr/bin/env node
/**
 * CDS-070: dock/workspace shell composition.
 *
 * The composition is a layout contract, so the assertions are computed layout,
 * not class names: four columns on a wide screen, one stacked column below
 * 64rem, the resize handle removed where there is nothing to resize, and the
 * docked inspector turned into a native popover drawer with the page still
 * free of horizontal scroll.
 *
 * Exits (not skips) when no browser driver is found.
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
  const mount = async (width, height) => {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8">
      <style>${css}
        html, body { margin: 0; block-size: 100%; }
        .c-workspace-shell { block-size: 44rem; }
      </style></head><body>
      <div class="c-workspace-shell">
        <header class="c-panel"><strong>Contour Workspace</strong></header>
        <div class="c-workspace-shell__body">
          <aside class="c-workspace-shell__sidebar c-panel" aria-label="Workspace sections">
            <a href="#overview" aria-current="page">Overview</a>
          </aside>
          <main class="c-workspace-shell__stage c-panel">
            <h2>Central stage</h2>
            <button class="c-workspace-shell__inspector-toggle" type="button" popovertarget="workspace-inspector">Inspector</button>
            <p>Stage content.</p>
          </main>
          <div class="c-workspace-shell__resize c-resize-handle" role="separator" aria-orientation="vertical" aria-label="Resize inspector"></div>
          <contour-panel class="c-workspace-shell__inspector" id="workspace-inspector" popover title="Docked inspector"></contour-panel>
        </div>
      </div></body></html>`);
    await page.addScriptTag({ content: wc });
    await page.waitForFunction(() => customElements.get("contour-panel"), null, { timeout: 15000 });
    await page.waitForTimeout(150);
    return page;
  };

  {
    const page = await mount(1440, 900);
    const s = await page.evaluate(() => {
      const body = document.querySelector(".c-workspace-shell__body");
      const inspector = document.getElementById("workspace-inspector");
      const toggle = document.querySelector(".c-workspace-shell__inspector-toggle");
      const resize = document.querySelector(".c-workspace-shell__resize");
      return {
        columns: getComputedStyle(body).gridTemplateColumns.split(" ").filter(Boolean).length,
        inspectorDisplay: getComputedStyle(inspector).display,
        inspectorPosition: getComputedStyle(inspector).position,
        toggleDisplay: getComputedStyle(toggle).display,
        resizeDisplay: getComputedStyle(resize).display,
        open: inspector.matches(":popover-open"),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expectEqual(s.columns, 4, "1440: body has four columns (sidebar · stage · handle · inspector)");
    expectEqual(s.inspectorDisplay, "block", "1440: docked inspector is an ordinary column");
    expectEqual(s.inspectorPosition, "static", "1440: inspector is not taken out of the grid");
    expectEqual(s.open, false, "1440: inspector is not in the top layer");
    expectEqual(s.toggleDisplay, "none", "1440: drawer toggle is not rendered");
    expectEqual(s.resizeDisplay === "none", false, "1440: resize handle is rendered");
    expectEqual(s.overflow, 0, "1440: no horizontal overflow");
    await page.close();
  }

  {
    const page = await mount(390, 844);
    const state = () => page.evaluate(() => {
      const body = document.querySelector(".c-workspace-shell__body");
      const inspector = document.getElementById("workspace-inspector");
      const toggle = document.querySelector(".c-workspace-shell__inspector-toggle");
      const resize = document.querySelector(".c-workspace-shell__resize");
      const rect = inspector.getBoundingClientRect();
      return {
        cols: getComputedStyle(body).gridTemplateColumns.split(" ").filter(Boolean).length,
        inspectorDisplay: getComputedStyle(inspector).display,
        inspectorPosition: getComputedStyle(inspector).position,
        toggleDisplay: getComputedStyle(toggle).display,
        resizeDisplay: getComputedStyle(resize).display,
        open: inspector.matches(":popover-open"),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

    let s = await state();
    expectEqual(s.cols, 1, "390: body collapses to one column");
    expectEqual(["flex", "inline-flex"].includes(s.toggleDisplay), true, "390: inspector toggle is rendered");
    expectEqual(s.resizeDisplay, "none", "390: resize handle is removed");
    expectEqual(s.open, false, "390: inspector starts closed");
    expectEqual(s.inspectorDisplay, "none", "390: closed inspector is not painted");
    expectEqual(s.overflow, 0, "390: no horizontal overflow");

    await page.click(".c-workspace-shell__inspector-toggle");
    await page.waitForTimeout(120);
    s = await state();
    expectEqual(s.open, true, "390: toggle opens the inspector drawer");
    expectEqual(s.inspectorDisplay, "block", "390: open inspector paints");
    expectEqual(s.inspectorPosition, "fixed", "390: open inspector leaves the grid");
    if (s.right <= 390) ok(`390: inspector stays inside the viewport (right edge ${s.right})`);
    else fail(`390: inspector overflows the viewport (right edge ${s.right})`);
    if (s.width > 0 && s.width <= 390) ok(`390: inspector has a usable drawer width (${s.width}px)`);
    else fail(`390: inspector width is unusable (${s.width}px)`);
    expectEqual(s.overflow, 0, "390: open drawer adds no horizontal page overflow");

    await page.keyboard.press("Escape");
    await page.waitForTimeout(120);
    expectEqual((await state()).open, false, "390: Escape closes the inspector drawer");
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(`\nworkspace-shell: ${checks - failures}/${checks} checks passed`);
if (failures) {
  console.log(`FAIL workspace-shell: ${failures} check(s) failed`);
  process.exit(1);
}
console.log("OK   workspace-shell: four columns wide, one column narrow, inspector a native drawer");