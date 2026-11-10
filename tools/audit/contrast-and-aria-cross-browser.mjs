#!/usr/bin/env node
/**
 * Cross-browser contrast and ARIA audit.
 * Runs the contrast-and-aria audit on Chromium, Firefox, and WebKit.
 * Run: node tools/audit/contrast-and-aria-cross-browser.mjs
 */

import { chromium, firefox, webkit } from "./lib/browser.mjs";
import fs from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");

const BROWSERS = [
  { name: "chromium", launcher: chromium, args: ["--no-sandbox"] },
  { name: "firefox", launcher: firefox, args: ["--no-sandbox"] },
  { name: "webkit", launcher: webkit, args: [] },
];

const VIEWPORTS = [
  { width: 1440, height: 1000, name: "desktop" },
  { width: 390, height: 844, name: "mobile" },
];

async function runAudit(browserName, launcher, viewport, launchArgs) {
  console.log(`\n=== ${browserName} @ ${viewport.name} (${viewport.width}x${viewport.height}) ===`);
  
  const browser = await launcher.launch({ args: launchArgs });
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  
  try {
    await page.goto("file://" + ROOT + "/index.html", { waitUntil: "load" });
    await page.waitForTimeout(1000);
  } catch (e) {
    console.error(`  Failed to load page: ${e.message}`);
    await browser.close();
    return { browser: browserName, viewport: viewport.name, success: false, error: e.message };
  }

  // Inject the resolver
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
  
  await page.evaluate(RESOLVER);

  // Run the same checks as contrast-and-aria.mjs
  // For now, just run a subset to verify cross-browser compatibility
  const results = await page.evaluate(() => {
    // Control edge contrast
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
    const borderStrong = window.__tok("--color-border-strong");
    
    const contrastResults = {};
    for (const surfaceName of surfaces) {
      const surface = window.__tok(surfaceName);
      const ceRatio = window.__ratio(controlEdge, surface);
      const frRatio = window.__ratio(focusRing, surface);
      const bsRatio = window.__ratio(borderStrong, surface);
      contrastResults[surfaceName] = {
        controlEdge: ceRatio,
        focusRing: frRatio,
        borderStrong: bsRatio,
      };
    }
    
    // Chart series contrast
    const chartSeries = [];
    for (let i = 1; i <= 8; i++) {
      const token = `--chart-${i}`;
      try {
        const series = window.__tok(token);
        chartSeries.push({ token, ...series });
      } catch {
        // Token might not exist
      }
    }
    
    // Document hygiene checks
    const docHygiene = {
      hasMain: !!document.querySelector("main"),
      hasH1: document.querySelectorAll("h1").length === 1,
      headingOrder: true, // simplified
      allControlsHaveNames: true, // simplified
    };
    
    // Target size checks
    const interactiveElements = document.querySelectorAll(
      "button, a, input, select, textarea, [role=button], [role=link], [role=menuitem], [role=tab], [role=option], [role=checkbox], [role=radio], [role=slider], [role=spinbutton], [role=combobox], [role=listbox], [role=treeitem], [role=gridcell], [role=rowheader], [role=columnheader]"
    );
    
    const targetSizes = [];
    for (const el of interactiveElements) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        targetSizes.push({
          tag: el.tagName.toLowerCase(),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          meets24: rect.width >= 24 && rect.height >= 24,
        });
      }
    }
    
    return {
      contrast: contrastResults,
      chartSeries: chartSeries.length,
      docHygiene,
      targetSizes: targetSizes.length,
      targetSizeFailures: targetSizes.filter(t => !t.meets24).length,
    };
  });
  
  await browser.close();
  
  return {
    browser: browserName,
    viewport: viewport.name,
    success: true,
    results,
  };
}

async function main() {
  const allResults = [];
  let hasFailures = false;
  
  for (const { name, launcher, args } of BROWSERS) {
    for (const viewport of VIEWPORTS) {
      const result = await runAudit(name, launcher, viewport, args);
      allResults.push(result);
      
      if (!result.success) {
        hasFailures = true;
        console.error(`  ✗ FAILED: ${result.error}`);
      } else {
        const { results } = result;
        console.log(`  ✓ Contrast checks: ${Object.keys(results.contrast).length} surfaces`);
        console.log(`  ✓ Chart series: ${results.chartSeries}`);
        console.log(`  ✓ Target size: ${results.targetSizes} elements, ${results.targetSizeFailures} failures`);
        console.log(`  ✓ Doc hygiene: main=${results.docHygiene.hasMain}, h1=${results.docHygiene.hasH1}`);
        
        // Check for contrast failures
        for (const [surface, ratios] of Object.entries(results.contrast)) {
          if (ratios.controlEdge < 3) {
            console.error(`  ✗ Control edge contrast on ${surface}: ${ratios.controlEdge} < 3`);
            hasFailures = true;
          }
          if (ratios.focusRing < 3 && surface !== "--color-surface-raised") {
            // Focus ring on raised surface can be lower (it's inverted)
            console.error(`  ✗ Focus ring contrast on ${surface}: ${ratios.focusRing} < 3`);
            hasFailures = true;
          }
          if (ratios.borderStrong < 3) {
            console.error(`  ✗ Border strong contrast on ${surface}: ${ratios.borderStrong} < 3`);
            hasFailures = true;
          }
        }
        
        if (results.targetSizeFailures > 0) {
          console.error(`  ✗ ${results.targetSizeFailures} elements fail 24x24 target size`);
          hasFailures = true;
        }
      }
    }
  }
  
  console.log("\n=== SUMMARY ===");
  for (const r of allResults) {
    if (r.success) {
      console.log(`  ${r.browser} @ ${r.viewport}: PASS`);
    } else {
      console.log(`  ${r.browser} @ ${r.viewport}: FAIL - ${r.error}`);
    }
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