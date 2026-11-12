#!/usr/bin/env node
/**
 * Cross-browser contrast and ARIA audit.
 *
 * Runs the colour-accurate contrast contract and the document-hygiene checks
 * against the rendered guide in Chromium, Firefox and WebKit, at desktop and
 * mobile widths. This is the cross-browser half of contrast-and-aria.mjs: the
 * same contract, measured in three engines, because a ratio that holds in one
 * engine's colour resolver is not proof it holds in another's.
 *
 * The guide is served over HTTP, not file://. Chromium blocks ES modules from
 * file:// (CORS), so the web components never upgrade there and the page the
 * gate measures is not the page a consumer gets. A gate that measures a
 * different page than it claims is worse than no gate.
 *
 * Run: node tools/audit/contrast-and-aria-cross-browser.mjs
 * Exit 1 when any browser fails the contract.
 */
import { chromium, firefox, webkit } from "./lib/browser.mjs";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");

const BROWSERS = [
  { name: "chromium", launcher: chromium, args: ["--no-sandbox"] },
  { name: "firefox", launcher: firefox, args: [] },
  { name: "webkit", launcher: webkit, args: [] },
];

const VIEWPORTS = [
  { width: 1440, height: 1000, name: "desktop" },
  { width: 390, height: 844, name: "mobile" },
];

const TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".json": "application/json",
};

// The colour resolver, injected into every page. It resolves a CSS colour to
// sRGB 0-255 + alpha via a canvas, which handles oklch/oklab/color-mix/named/
// rgb the same way in every engine that implements the canvas colour parser.
const RESOLVER = `
window.__canvas = document.createElement('canvas');
window.__canvas.width = 1; window.__canvas.height = 1;
window.__ctx = window.__canvas.getContext('2d', { willReadFrequently: true });
window.__rgb = (css) => {
  const c = window.__ctx;
  c.clearRect(0,0,1,1);
  c.fillStyle = 'rgba(0,0,0,0)';
  c.fillStyle = css;
  c.globalCompositeOperation = 'copy';
  c.fillStyle = css;
  c.fillRect(0,0,1,1);
  const d = c.getImageData(0,0,1,1).data;
  c.globalCompositeOperation = 'source-over';
  return { r: d[0], g: d[1], b: d[2], a: d[3]/255 };
};
window.__over = (css, backdrop) => {
  const c = window.__ctx;
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = backdrop;
  c.fillRect(0,0,1,1);
  c.fillStyle = css;
  c.fillRect(0,0,1,1);
  const d = c.getImageData(0,0,1,1).data;
  return { r: d[0], g: d[1], b: d[2] };
};
window.__lum = (rgb) => {
  const lin = (v) => { v/=255; return v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
  return 0.2126*lin(rgb.r) + 0.7152*lin(rgb.g) + 0.0722*lin(rgb.b);
};
window.__ratio = (a, b) => {
  const la = window.__lum(a), lb = window.__lum(b);
  const hi = Math.max(la,lb), lo = Math.min(la,lb);
  return +(((hi+0.05)/(lo+0.05)).toFixed(2));
};
window.__tok = (name) => {
  const p = document.createElement('div');
  p.style.color = 'var(' + name + ')';
  document.body.appendChild(p);
  const cs = getComputedStyle(p);
  const raw = cs.color;
  p.remove();
  const c = window.__ctx;
  c.globalCompositeOperation = 'copy';
  c.fillStyle = raw; c.fillRect(0,0,1,1);
  const d = c.getImageData(0,0,1,1).data;
  c.globalCompositeOperation = 'source-over';
  return { raw, r: d[0], g: d[1], b: d[2], a: d[3]/255 };
};
window.__tokOver = (name, backdropName) => {
  const fg = window.__tok(name);
  const bg = window.__tok(backdropName);
  const c = window.__ctx;
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = 'rgb(' + bg.r + ',' + bg.g + ',' + bg.b + ')';
  c.fillRect(0,0,1,1);
  c.fillStyle = fg.raw; c.fillRect(0,0,1,1);
  const d = c.getImageData(0,0,1,1).data;
  return { r: d[0], g: d[1], b: d[2] };
};
`;

// The contract, measured in the page. The control edge and the focus ring must
// clear 3:1 against every surface a control can sit on (WCAG 1.4.11). The
// border-strong hairline is deliberately NOT gated: it is decorative, and the
// main gate (contrast-and-aria.mjs) splits decorative from control edges for
// exactly this reason. Every categorical series clears 3:1 against the panel it
// is drawn on. The document-hygiene checks are the same ones the main gate
// makes: one h1, one main, no duplicate ids, no nameless button, no unlabelled
// input. Target size exempts inline links (WCAG 2.5.8) — a link inside a
// sentence is not a 24x24 control.
const CONTRACT = () => {
  const surfaces = [
    "--color-canvas",
    "--color-canvas-sunken",
    "--color-surface-1",
    "--color-surface-2",
    "--color-surface-3",
    "--color-surface-raised",
  ];
  const controlEdge = window.__tok("--color-control-edge");
  const focusRing = window.__tok("--color-focus-ring");
  const contrast = {};
  for (const name of surfaces) {
    const surface = window.__tok(name);
    contrast[name] = {
      controlEdge: window.__ratio(controlEdge, surface),
      focusRing: window.__ratio(focusRing, surface),
    };
  }

  // Every categorical series clears 3:1 against the panel it is drawn on.
  const series = [];
  for (let i = 1; i <= 8; i++) {
    const token = "--chart-" + i;
    const fg = window.__tok(token);
    if (!fg.raw || fg.a === 0) continue;
    for (const panel of ["--color-surface-1", "--color-canvas"]) {
      const bg = window.__tok(panel);
      series.push({ token, panel, ratio: window.__ratio(fg, bg) });
    }
  }

  // Document hygiene — the same counts the main gate asserts. A <main> inside
  // an inert subtree is not in the accessibility tree, so it is not a landmark
  // the page exposes; count only the ones a reader would meet.
  const isExposed = (el) => {
    for (let n = el; n; n = n.parentElement) {
      if (n.hasAttribute && n.hasAttribute("inert")) return false;
      if (n.getAttribute && n.getAttribute("aria-hidden") === "true") return false;
    }
    return true;
  };
  const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
  const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => +h.tagName[1]);
  const jumps = [];
  for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) jumps.push(`${hs[i - 1]}->${hs[i]}@${i}`);
  const inputs = [...document.querySelectorAll("input:not([type=hidden])")];
  const unlabelled = inputs.filter((i) => {
    if (i.hidden || i.getAttribute("aria-hidden") === "true") return false;
    if (i.getAttribute("aria-label") || i.getAttribute("aria-labelledby")) return false;
    if (i.id && document.querySelector('label[for="' + i.id + '"]')) return false;
    if (i.closest("label")) return false;
    return true;
  }).length;
  const btns = [...document.querySelectorAll("button")];
  const namelessBtns = btns.filter((b) => {
    const t = (b.textContent || "").trim();
    return !t && !b.getAttribute("aria-label") && !b.getAttribute("title") && !b.getAttribute("aria-labelledby");
  }).length;

  return {
    contrast,
    series,
    doc: {
      h1: document.querySelectorAll("h1").length,
      main: [...document.querySelectorAll("main")].filter(isExposed).length,
      duplicateIds: dupes.length,
      imgsNoAlt: [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).length,
      unlabelledInputs: unlabelled,
      namelessButtons: namelessBtns,
      headingJumps: jumps.length,
      skipLink: !!document.querySelector(".skip-link"),
      lang: document.documentElement.lang,
    },
  };
};

async function runAudit(browserName, launcher, viewport, launchArgs, origin) {
  const browser = await launcher.launch({ args: launchArgs });
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  try {
    await page.goto(origin + "/index.html", { waitUntil: "load" });
    // The web components upgrade asynchronously; wait for the registry to
    // publish so the measured page is the page a consumer gets.
    await page.waitForFunction(() => window.ContourElements && window.ContourElements.length > 0, null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);
    await page.evaluate(RESOLVER);
    const results = await page.evaluate(CONTRACT);
    await browser.close();
    return { browser: browserName, viewport: viewport.name, success: true, results, errors };
  } catch (e) {
    await browser.close().catch(() => {});
    return { browser: browserName, viewport: viewport.name, success: false, error: e.message };
  }
}

async function main() {
  // Serve the guide over HTTP so Chromium loads the ES module bundle.
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const filePath = join(ROOT, urlPath === "/" ? "index.html" : urlPath);
    if (!filePath.startsWith(ROOT) || !existsSync(filePath)) {
      res.writeHead(404).end("not found");
      return;
    }
    const type = TYPES[extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "content-type": type }).end(readFileSync(filePath));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const origin = "http://127.0.0.1:" + server.address().port;

  const allResults = [];
  let hasFailures = false;

  for (const { name, launcher, args } of BROWSERS) {
    for (const viewport of VIEWPORTS) {
      const result = await runAudit(name, launcher, viewport, args, origin);
      allResults.push(result);
      const label = `${name} @ ${viewport.name} (${viewport.width}x${viewport.height})`;
      if (!result.success) {
        hasFailures = true;
        console.error(`  ✗ ${label}: ${result.error}`);
        continue;
      }
      const { results, errors } = result;
      if (errors.length) {
        hasFailures = true;
        console.error(`  ✗ ${label}: page errors: ${errors.slice(0, 2).join(" | ")}`);
      }
      // Contrast: control edge and focus ring, every surface.
      for (const [surface, ratios] of Object.entries(results.contrast)) {
        if (ratios.controlEdge < 3) {
          hasFailures = true;
          console.error(`  ✗ ${label}: control edge on ${surface}: ${ratios.controlEdge} < 3`);
        }
        if (ratios.focusRing < 3) {
          hasFailures = true;
          console.error(`  ✗ ${label}: focus ring on ${surface}: ${ratios.focusRing} < 3`);
        }
      }
      // Series: every series clears 3:1 on every panel.
      for (const s of results.series) {
        if (s.ratio < 3) {
          hasFailures = true;
          console.error(`  ✗ ${label}: ${s.token} on ${s.panel}: ${s.ratio} < 3`);
        }
      }
      // Document hygiene — the same assertions the main gate makes.
      const d = results.doc;
      if (d.h1 !== 1) { hasFailures = true; console.error(`  ✗ ${label}: ${d.h1} <h1> (want exactly 1)`); }
      if (d.main !== 1) { hasFailures = true; console.error(`  ✗ ${label}: ${d.main} <main> (want exactly 1)`); }
      if (d.duplicateIds) { hasFailures = true; console.error(`  ✗ ${label}: ${d.duplicateIds} duplicate id(s)`); }
      if (d.imgsNoAlt) { hasFailures = true; console.error(`  ✗ ${label}: ${d.imgsNoAlt} <img> without alt`); }
      if (d.unlabelledInputs) { hasFailures = true; console.error(`  ✗ ${label}: ${d.unlabelledInputs} unlabelled input(s)`); }
      if (d.namelessButtons) { hasFailures = true; console.error(`  ✗ ${label}: ${d.namelessButtons} nameless button(s)`); }
      if (d.headingJumps) { hasFailures = true; console.error(`  ✗ ${label}: ${d.headingJumps} heading level jump(s)`); }
      if (!d.skipLink) { hasFailures = true; console.error(`  ✗ ${label}: no skip link`); }
      if (!d.lang) { hasFailures = true; console.error(`  ✗ ${label}: no lang on <html>`); }
    }
  }

  server.close();

  console.log("\n=== SUMMARY ===");
  for (const r of allResults) {
    const label = `${r.browser} @ ${r.viewport}`;
    if (!r.success) console.log(`  ${label}: FAIL - ${r.error}`);
    else console.log(`  ${label}: measured`);
  }

  if (hasFailures) {
    console.error("\n✗ Cross-browser audit FAILED");
    process.exit(1);
  } else {
    console.log("\n✓ Cross-browser audit PASSED");
    process.exit(0);
  }
}

main().catch((e) => {
  console.error("Audit error:", e);
  process.exit(1);
});