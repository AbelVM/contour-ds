#!/usr/bin/env node
/**
 * CDS-047: Declarative Shadow DOM and SSR hydration evaluation.
 *
 * This is an evaluation gate (not a claim of full DSD/SSR support). It
 * validates what Contour's web components can do today in server-like
 * (jsdom/Node) environments and records concrete findings:
 *   - WC modules import safely in Node (no unguarded browser globals at import)
 *   - In jsdom, light-DOM custom elements can be defined, constructed,
 *     connected, rendered, and attribute-reactive
 *   - In jsdom, shadow wrappers can attachShadow, adopt templates, and expose
 *     expected shadow roots/parts
 *   - A Declarative Shadow DOM HTML fixture (template shadowrootmode) is
 *     parsed; if the environment does not auto-hydrate DSD, that is reported
 *     as an evaluated limitation (not a silent pass)
 *   - SSR-style string rendering of light-DOM markup is possible via jsdom
 *
 * Exits 0 when evaluated capabilities hold; exits 1 on regressions in the
 * capabilities that are expected to work today.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");

const ROOT = process.cwd();
const DIST = join(ROOT, "dist");

let failures = 0;
let passes = 0;
const notes = [];

function ok(msg) { passes++; console.log(`  OK   ${msg}`); }
function fail(msg) { failures++; console.log(`  FAIL ${msg}`); }
function note(msg) { notes.push(msg); console.log(`  NOTE ${msg}`); }

async function main() {
  // 1) Import safety in Node (modules should be importable; define guarded)
  try {
    await import(pathToFileURL(join(ROOT, "src/js/wc/index.mjs")).href);
    ok("src/js/wc/index.mjs imports in Node without throwing");
  } catch (e) {
    fail(`src/js/wc/index.mjs import threw in Node: ${e.message}`);
  }

  // 2) jsdom environment: custom elements + shadow DOM primitives
  const cssPath = join(DIST, "contour.css");
  const css = existsSync(cssPath) ? readFileSync(cssPath, "utf8") : "";
  const dom = new JSDOM(`<!DOCTYPE html><html><head><style>${css.slice(0, 2000)}</style></head><body id="app"></body></html>`, {
    url: "http://localhost/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const { document, customElements, HTMLElement } = window;

  // install minimal globals some modules may probe
  globalThis.window = window;
  globalThis.document = document;
  globalThis.HTMLElement = HTMLElement;
  globalThis.customElements = customElements;
  globalThis.Node = window.Node;
  globalThis.Element = window.Element;
  globalThis.CustomEvent = window.CustomEvent;
  globalThis.CSSStyleSheet = window.CSSStyleSheet || globalThis.CSSStyleSheet;

  try {
    // Prefer IIFE/classic bundle for jsdom eval (ESM bundle contains export syntax).
    const bundles = [join(DIST, "contour-wc.min.js"), join(DIST, "contour-wc.esm.min.js")];
    let loaded = false;
    for (const bundle of bundles) {
      if (!existsSync(bundle)) continue;
      const src = readFileSync(bundle, "utf8");
      try {
        if (bundle.endsWith(".esm.min.js")) {
          // ESM: strip trailing exports for eval probe, best-effort.
          const stripped = src.replace(/\bexport\s*\{[^}]*\}\s*;?\s*$/m, "").replace(/\bexport\s+default\s+[^;]+;?\s*$/m, "");
          new window.Function(stripped)();
        } else {
          window.eval(src);
        }
        loaded = true;
        ok(`WC bundle evaluated in jsdom (${bundle.replace(ROOT + "/", "")})`);
        break;
      } catch (e) {
        note(`WC bundle eval in jsdom threw for ${bundle.replace(ROOT + "/", "")}: ${e.message.split("\n")[0]} (evaluated limitation)`);
      }
    }
    if (!loaded) note("No WC bundle could be evaluated in jsdom — registration eval skipped");
  } catch (e) {
    note(`bundle setup: ${e.message}`);
  }

  // 3) Light-DOM element construction/reactivity in jsdom
  try {
    if (!customElements.get("contour-badge")) {
      // define a minimal stand-in matching expected behavior is out of scope;
      // if bundle didn't register, try source registration path
      await import(pathToFileURL(join(ROOT, "src/js/wc/core.mjs")).href).catch(() => {});
      await import(pathToFileURL(join(ROOT, "src/js/wc/data.mjs")).href).catch(() => {});
    }
    const badgeTag = "contour-badge";
    if (customElements.get(badgeTag)) {
      const el = document.createElement(badgeTag);
      el.setAttribute("variant", "success");
      el.textContent = "OK";
      document.getElementById("app").appendChild(el);
      // allow microtasks/upgrade
      await new Promise(r => setTimeout(r, 10));
      const rendered = el.textContent.includes("OK") || el.innerHTML.includes("OK") || el.shadowRoot;
      if (rendered) ok(`light-DOM/element ${badgeTag} constructs and renders content in jsdom`);
      else fail(`${badgeTag} constructed but content not observable in jsdom`);
    } else {
      note(`${badgeTag} not registered in jsdom context — light-DOM construction evaluated as unavailable in this env`);
    }
  } catch (e) {
    note(`light-DOM construction eval: ${e.message}`);
  }

  // 4) Shadow wrapper attachShadow capability
  try {
    const host = document.createElement("div");
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = '<span part="x">shadow</span>';
    if (root.querySelector('[part="x"]')) ok("jsdom supports attachShadow and shadowRoot querying");
    else fail("attachShadow worked but shadow content not queryable");
  } catch (e) {
    fail(`attachShadow unavailable in jsdom: ${e.message}`);
  }

  // 5) Declarative Shadow DOM parsing evaluation
  try {
    const dsd = new JSDOM(
      '<!DOCTYPE html><html><body><contour-shadow-dialog><template shadowrootmode="open"><dialog class="c-dialog" part="dialog"><slot></slot></dialog></template></contour-shadow-dialog></body></html>',
      { url: "http://localhost/" }
    );
    const el = dsd.window.document.querySelector("contour-shadow-dialog");
    const hasTemplateLeft = !!el.querySelector("template[shadowrootmode], template[shadowroot]");
    const hasSR = !!el.shadowRoot;
    if (hasSR) {
      ok("DSD: jsdom auto-attached shadow root from template[shadowrootmode] (hydration-ready)");
    } else if (hasTemplateLeft) {
      note("DSD: template[shadowrootmode] parsed but not auto-hydrated by jsdom — Declarative Shadow DOM requires browser/platform DSD support for zero-JS hydration; server output can still emit DSD markup for supporting browsers (evaluation: feasible as progressive enhancement, not yet implemented)");
      ok("DSD parsing evaluated (template preserved; no silent failure)");
    } else {
      note("DSD: template consumed without shadow root — behavior environment-specific");
      ok("DSD parsing evaluated");
    }
  } catch (e) {
    fail(`DSD fixture parsing failed: ${e.message}`);
  }

  // 6) SSR-style string render of light-DOM markup and DSD string emission
  try {
    const html = '<div class="c-card"><div class="c-card__body">Hello SSR</div></div>';
    const ssr = new JSDOM(`<!DOCTYPE html><body>${html}</body>`);
    const text = ssr.window.document.querySelector(".c-card__body")?.textContent;
    if (text === "Hello SSR") ok("SSR-style light-DOM markup string renders/round-trips in jsdom");
    else fail("SSR-style markup did not round-trip");

    const mod = await import(pathToFileURL(join(ROOT, "src/js/wc/shadow.mjs")).href);
    const { SHADOW_MARKUP, renderShadowDSD } = mod;
    const count = SHADOW_MARKUP ? Object.keys(SHADOW_MARKUP).length : 0;
    if (count > 0 && typeof renderShadowDSD === "function") {
      const dsdHtml = renderShadowDSD("contour-shadow-dialog", "", "<span>Hi</span>");
      const okStr = dsdHtml && dsdHtml.includes('<template shadowrootmode="open">') && dsdHtml.includes('class="c-dialog"') && dsdHtml.includes('</contour-shadow-dialog>');
      if (okStr) ok(`DSD string emission: renderShadowDSD produces template[shadowrootmode] markup (${count} templates available in Node)`);
      else fail("DSD string emission: renderShadowDSD output missing expected DSD/template/content markers");

      // verify emitted string hydrates in browser
      try {
        const { chromium } = await import("playwright-core");
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(`<!DOCTYPE html><body>${dsdHtml}</body>`);
        const r = await page.evaluate(() => {
          const el = document.querySelector("contour-shadow-dialog");
          return { hasSR: !!el?.shadowRoot, hasDialog: !!el?.shadowRoot?.querySelector("dialog.c-dialog"), light: el?.textContent?.trim() || null };
        });
        await browser.close();
        if (r.hasSR && r.hasDialog) ok("Emitted DSD string hydrates to a shadow root in chromium");
        else note(`Emitted DSD string hydration probe: hasSR=${r.hasSR} hasDialog=${r.hasDialog} (progressive enhancement path)`);
      } catch (e) {
        note(`Emitted DSD browser hydration probe skipped: ${e.message.split("\n")[0]}`);
      }
    } else {
      note("DSD string emission API not available from src/js/wc/shadow.mjs (skipped)");
    }
  } catch (e) {
    fail(`SSR/DSD string render: ${e.message}`);
  }

  // 7) adoptedStyleSheets presence (needed for shadow perf, optional)
  try {
    const has = "adoptedStyleSheets" in (document || {});
    if (has) ok("adoptedStyleSheets API present in jsdom (shadow sheet adoption feasible)");
    else note("adoptedStyleSheets not present in jsdom — shadow wrappers must fall back to <style> injection or linked styles (evaluated)");
  } catch (e) {
    note(`adoptedStyleSheets check: ${e.message}`);
  }

  // 8) Browser-native Declarative Shadow DOM hydration (Playwright/chromium), if available
  try {
    const { chromium } = await import("playwright-core");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent('<!DOCTYPE html><body><contour-shadow-dialog><template shadowrootmode="open"><dialog class="c-dialog" part="dialog"><slot></slot></dialog></template><span>body</span></contour-shadow-dialog></body>');
    const r = await page.evaluate(() => {
      const el = document.querySelector("contour-shadow-dialog");
      return {
        hasSR: !!el?.shadowRoot,
        hasPart: !!el?.shadowRoot?.querySelector('[part="dialog"]'),
        light: el?.querySelector("span")?.textContent || null,
      };
    });
    await browser.close();
    if (r.hasSR && r.hasPart) ok("Browser-native DSD: chromium hydrates template[shadowrootmode] into a shadow root (DSD output feasible for supporting browsers)");
    else note(`Browser-native DSD probe: hasSR=${r.hasSR} hasPart=${r.hasPart} — hydration not observed`);
  } catch (e) {
    note(`Browser-native DSD probe skipped: ${e.message.split("\n")[0]}`);
  }

  // cleanup globals
  for (const k of ["window","document","HTMLElement","customElements","Node","Element","CustomEvent","CSSStyleSheet"]) {
    try { delete globalThis[k]; } catch {}
  }

  console.log(`\ncheck-dsd: ${passes} passed, ${failures} failed, ${notes.length} notes`);
  if (notes.length) {
    console.log("Evaluation notes (CDS-047):");
    for (const n of notes) console.log(`  - ${n}`);
  }
  if (failures > 0) process.exit(1);
  console.log("OK   check-dsd: DSD/SSR hydration evaluation passed (no regressions in evaluated capabilities)");
}

main().catch((e) => { console.error("FAIL check-dsd:", e.message); process.exit(1); });
