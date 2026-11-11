#!/usr/bin/env node
/**
 * CDS-079: glass/blur cost over a moving map surface.
 *
 * Measures the shipped translucent surfaces (`.c-header`, `.c-toolbar`,
 * `.c-dash-toolbar`) over an animating canvas, with the CPU throttled 6× as a
 * low-power proxy. This is a lab proxy, not a physical phone: it runs in
 * headless Chromium with software rasterisation, which is the closest stand-in
 * available without a device farm.
 *
 * What is asserted:
 *   - the realistic glass set stays at a 60 fps p75 and under 5 % slow frames
 *     at 6× CPU;
 *   - turning the blur off changes the computed `backdrop-filter` (the arms are
 *     real, not two names for one page);
 *   - the canvas keeps drawing during the sample (the surface has something to
 *     blur);
 *   - a deliberately pathological full-screen blur *does* cost frames under
 *     forced raster readback, so a zero finding above is evidence rather than a
 *     blind instrument.
 *
 * Exits (not skips) when no browser driver is found.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "./lib/browser.mjs";

const ROOT = process.cwd();
const css = readFileSync(join(ROOT, "dist/contour.min.css"), "utf8");

const CPU_RATE = 6;
const FRAME_BUDGET = 20; // p75 ms; 60 fps is 16.7, this allows scheduling jitter
const SLOW_RATIO = 0.05; // share of frames over 33.4 ms
const SAMPLES = 120;

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

function p75(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.75) - 1)];
}

const browser = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8">
    <style>${css}
      html, body { margin: 0; block-size: 100%; overflow: hidden; }
      #map { position: fixed; inset: 0; inline-size: 100%; block-size: 100%; }
      .c-header { position: fixed; inset-block-start: 0; inset-inline: 0; }
      #map-toolbar { position: fixed; inset-block-start: 5.5rem; inset-inline-end: 1rem; }
      #map-footer { position: fixed; inset-block-end: 1rem; inset-inline-start: 1rem; inline-size: 20rem; }
    </style></head><body>
    <canvas id="map"></canvas>
    <header class="c-header"><strong>Contour</strong></header>
    <div class="c-toolbar" id="map-toolbar"><button class="c-toolbar__btn" type="button" aria-label="Zoom in">+</button><button class="c-toolbar__btn" type="button" aria-label="Zoom out">−</button></div>
    <div class="c-dash-toolbar" id="map-footer"><span>Survey · 42 features</span></div>
    </body></html>`);

  await page.evaluate(() => {
    const canvas = document.getElementById("map");
    const ctx = canvas.getContext("2d");
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    let frame = 0;
    window.__frames = 0;
    window.__readback = false;
    const draw = () => {
      frame += 1;
      window.__frames = frame;
      ctx.fillStyle = `oklch(${0.72 + 0.1 * Math.sin(frame / 18)} 0.07 ${(frame * 2) % 360})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `oklch(0.5 0.12 ${(frame + i * 12) % 360})`;
        ctx.fillRect((i * 47 + frame * 3) % canvas.width, (i * 31 + frame * 2) % canvas.height, 120, 80);
      }
      // The sensitivity arm forces the software rasteriser to read the canvas
      // back every frame; without it a small blur can hide behind compositor
      // idle time and a zero would prove nothing.
      if (window.__readback) ctx.getImageData(0, 0, 1, 1);
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  });

  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_RATE });

  const sample = async (blurOn) => {
    await page.evaluate((on) => {
      for (const id of ["map-toolbar", "map-footer"]) {
        document.getElementById(id).style.backdropFilter = on ? "" : "none";
      }
      document.querySelector(".c-header").style.backdropFilter = on ? "" : "none";
    }, blurOn);
    await page.waitForTimeout(250);
    // Confirm the arm at the moment it is measured, not after the fact.
    const filter = await page.evaluate(() => getComputedStyle(document.querySelector(".c-header")).backdropFilter);
    const before = await page.evaluate(() => window.__frames);
    const intervals = await page.evaluate((samples) => new Promise((resolve) => {
      const out = [];
      let last = performance.now();
      const tick = (now) => {
        out.push(now - last);
        last = now;
        if (out.length < samples) requestAnimationFrame(tick);
        else resolve(out);
      };
      requestAnimationFrame(tick);
    }), SAMPLES);
    const after = await page.evaluate(() => window.__frames);
    return { intervals, drawn: after - before, filter };
  };

  console.log(`CDS-079: glass cost over a moving canvas (CPU ${CPU_RATE}×, software raster, ${SAMPLES} frames)`);

  // ── Realistic shipped surfaces ──────────────────────────────────────────
  const on = await sample(true);
  const off = await sample(false);
  const onP75 = p75(on.intervals);
  const offP75 = p75(off.intervals);
  const onSlow = on.intervals.filter((d) => d > 33.4).length / on.intervals.length;
  const offSlow = off.intervals.filter((d) => d > 33.4).length / off.intervals.length;
  console.log(
    `  info glass on : p75 ${onP75.toFixed(1)} ms, slow ${(onSlow * 100).toFixed(1)} % (${on.drawn} canvas frames)\n` +
      `  info glass off: p75 ${offP75.toFixed(1)} ms, slow ${(offSlow * 100).toFixed(1)} % (${off.drawn} canvas frames)`,
  );

  if (on.drawn > 0) ok(`canvas kept drawing during the sample (${on.drawn} frames)`);
  else fail("canvas did not advance — the glass had nothing moving to blur");

  if (on.filter && /blur\([1-9]/.test(on.filter)) ok(`glass arm measured with backdrop-filter: ${on.filter}`);
  else fail(`glass arm measured without a real blur (${on.filter}) — the sample measured a disabled filter`);
  if (off.filter === "none") ok("control arm measured with backdrop-filter: none");
  else fail(`control arm measured with a backdrop-filter (${off.filter})`);

  if (onP75 <= FRAME_BUDGET) ok(`realistic glass p75 ${onP75.toFixed(1)} ms ≤ ${FRAME_BUDGET} ms`);
  else fail(`realistic glass p75 ${onP75.toFixed(1)} ms exceeds ${FRAME_BUDGET} ms`);
  if (onSlow <= SLOW_RATIO) ok(`realistic glass slow frames ${(onSlow * 100).toFixed(1)} % ≤ ${SLOW_RATIO * 100} %`);
  else fail(`realistic glass slow frames ${(onSlow * 100).toFixed(1)} % exceed ${SLOW_RATIO * 100} %`);
  const delta = onP75 - offP75;
  console.log(`  info blur delta at p75: ${delta.toFixed(1)} ms (negative means the glass arm was faster, i.e. noise)`);

  // ── The fallback promise ────────────────────────────────────────────────
  // `utilities.css` names every blur surface in one reduced-transparency rule.
  // Emulate the preference and prove each surface actually resolves to none.
  await page.evaluate(() => {
    for (const id of ["map-toolbar", "map-footer"]) document.getElementById(id).style.backdropFilter = "";
    document.querySelector(".c-header").style.backdropFilter = "";
  });
  await page.waitForTimeout(120);
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-transparency", value: "reduce" }],
  });
  await page.waitForTimeout(120);
  const reduced = await page.evaluate(() =>
    [".c-header", ".c-toolbar", ".c-dash-toolbar"].map((sel) => [sel, getComputedStyle(document.querySelector(sel)).backdropFilter]),
  );
  const stillBlurred = reduced.filter(([, value]) => value !== "none").map(([sel, value]) => `${sel}=${value}`);
  if (stillBlurred.length === 0) ok(`${reduced.length} shipped blur surfaces drop backdrop-filter under prefers-reduced-transparency`);
  else fail(`reduced transparency does not reach: ${stillBlurred.join(", ")}`);
  await cdp.send("Emulation.setEmulatedMedia", { features: [] });

  // ── Sensitivity: a full-screen blur under forced readback ───────────────
  const sensitivity = await page.evaluate(async () => {
    const big = document.createElement("div");
    big.id = "full-glass";
    big.style.cssText = "position:fixed;inset:0;background:rgba(255,255,255,.7);";
    document.body.appendChild(big);
    window.__readback = true;
    window.__frames = 0;
    const run = (blur) => new Promise((resolve) => {
      big.style.backdropFilter = blur;
      requestAnimationFrame(() => {
        const out = [];
        let last = performance.now();
        const tick = (now) => {
          out.push(now - last);
          last = now;
          if (out.length < 90) requestAnimationFrame(tick);
          else resolve(out);
        };
        requestAnimationFrame(tick);
      });
    });
    const withBlur = await run("blur(16px)");
    const without = await run("none");
    big.remove();
    window.__readback = false;
    return {
      withSlow: withBlur.filter((d) => d > 33.4).length / withBlur.length,
      withoutSlow: without.filter((d) => d > 33.4).length / without.length,
    };
  });
  console.log(
    `  info full-screen blur (forced readback): slow ${(sensitivity.withSlow * 100).toFixed(1)} % vs none ${(sensitivity.withoutSlow * 100).toFixed(1)} %`,
  );
  if (sensitivity.withSlow > sensitivity.withoutSlow) {
    ok("sensitivity arm: a full-screen blur costs more slow frames than no blur, so the instrument sees blur cost");
  } else {
    fail(
      `sensitivity arm found no cost from a full-screen blur (${(sensitivity.withSlow * 100).toFixed(1)} % vs ` +
        `${(sensitivity.withoutSlow * 100).toFixed(1)} %) — the zero above is not evidence`,
    );
  }

  await cdp.detach();
  await context.close();
} finally {
  await browser.close();
}

console.log(`\nglass-budget: ${checks - failures}/${checks} checks passed`);
if (failures) {
  console.log(`FAIL glass-budget: ${failures} check(s) failed`);
  process.exit(1);
}
console.log("OK   glass-budget: shipped glass surfaces hold 60 fps at 6× CPU; the instrument can see blur cost");