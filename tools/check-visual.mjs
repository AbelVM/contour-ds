#!/usr/bin/env node
/**
 * CDS-019: Visual regression integration.
 *
 * Captures screenshots of key Storybook stories across theme/viewport matrix
 * and compares against committed baselines. Uses Playwright (chromium).
 *
 * Usage:
 *   node tools/check-visual.mjs --baseline   # (re)generate baseline
 *   node tools/check-visual.mjs --compare    # full capture+compare against baseline
 *   node tools/check-visual.mjs --verify     # lightweight: baseline present/armed (doctor)
 *   node tools/check-visual.mjs              # defaults to --compare
 *
 * Env:
 *   STORYBOOK_URL  (default http://127.0.0.1:6006 or file://storybook/index.html)
 *   VISUAL_BASE    (default tests/visual/baseline)
 *   VISUAL_CURRENT (default tmp/visual/current)
 *   VISUAL_DIFF    (default tmp/visual/diff)
 *
 * Matrix: light/dark × 390/1440 × curated stories (key states/components).
 * Baselines live in tests/visual/baseline by default (committable). --compare
 * SKIPs if no baseline is armed; run --baseline to generate/refresh.
 */

import { chromium } from "playwright-core";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, basename } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const args = new Set(process.argv.slice(2));
const mode = args.has("--baseline") ? "baseline" : args.has("--compare") ? "compare" : args.has("--verify") ? "verify" : "compare";

const BASE_DIR = process.env.VISUAL_BASE || join(ROOT, "tests/visual/baseline");
const CUR_DIR = process.env.VISUAL_CURRENT || join(ROOT, "tmp/visual/current");
const DIFF_DIR = process.env.VISUAL_DIFF || join(ROOT, "tmp/visual/diff");

function storybookUrl() {
  if (process.env.STORYBOOK_URL) return process.env.STORYBOOK_URL;
  const staticIndex = join(ROOT, "storybook/index.html");
  if (existsSync(staticIndex)) return pathToFileURL(staticIndex).href.replace(/\/index\.html$/, "");
  return "http://127.0.0.1:6006";
}

const STORIES = [
  "contour-interaction-button--default",
  "contour-forms-input--default",
  "contour-overlays-dialog--default",
  "contour-navigation-tabs--default",
  "contour-data-chart--default",
  "contour-data-table--default",
  "contour-workflows-dashboard--default",
  "contour-map-panel--default",
  "forms-select--default",
  "forms-textarea--default",
  "layerandstyle-layerpanel--default",
  "layerandstyle-stylepanel--default",
  "composition-dialog-form--form-in-dialog",
  "composition-combobox-field--combobox-with-field",
  "composition-chart-legend--chart-with-legend",
  "composition-layer-map--layer-panel-with-map",
  "composition-split-pane--resizable-split",
];

const THEMES = ["light", "dark"];
const WIDTHS = [390, 1440];

function shotName(story, theme, width) {
  return `${story}--${theme}--${width}.png`;
}

function hash(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

async function capture(outDir) {
  mkdirSync(outDir, { recursive: true });
  const base = storybookUrl();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    console.log(`SKIP check-visual: chromium unavailable (${e.message})`);
    process.exit(0);
  }
  const failures = [];
  let captured = 0;
  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      const context = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : 900 },
        colorScheme: theme,
        reducedMotion: "reduce",
      });
      for (const story of STORIES) {
        const page = await context.newPage();
        const url = `${base}/iframe.html?id=${story}&viewMode=story&globals=theme:${theme}`;
        const out = join(outDir, shotName(story, theme, width));
        try {
          await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
          await page.addStyleTag({
            content: "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }",
          });
          try { await page.evaluate(() => document.fonts?.ready); } catch {}
          try { await page.waitForFunction((t) => document.documentElement.dataset.theme === t, theme, { timeout: 3000 }); } catch {}
          await page.waitForTimeout(120);
          const buf = await page.screenshot({ fullPage: false });
          writeFileSync(out, buf);
          captured++;
        } catch (e) {
          failures.push(`${story} ${theme} ${width}: ${e.message.split("\n")[0]}`);
        }
        await page.close();
      }
      await context.close();
    }
  }
  await browser.close();
  return { captured, failures };
}

async function main() {
  if (mode === "baseline") {
    console.log(`check-visual: generating baseline in ${BASE_DIR}`);
    rmSync(BASE_DIR, { recursive: true, force: true });
    const { captured, failures } = await capture(BASE_DIR);
    console.log(`OK   check-visual baseline: ${captured} screenshots captured`);
    if (failures.length) {
      console.log(`WARN ${failures.length} capture failure(s):`);
      for (const f of failures) console.log(`     - ${f}`);
    }
    process.exit(0);
  }

  // verify mode: lightweight armament check for doctor/CI (no browser capture)
  if (mode === "verify") {
    const count = existsSync(BASE_DIR) ? readdirSync(BASE_DIR).filter(f => f.endsWith(".png")).length : 0;
    if (count === 0) {
      console.log(`SKIP check-visual: no baseline in ${BASE_DIR.replace(ROOT + "/", "")} (run: npm run visual:baseline)`);
      process.exit(0);
    }
    console.log(`OK   check-visual: baseline armed (${count} screenshots in ${BASE_DIR.replace(ROOT + "/", "")}); run npm run visual:check for full comparison`);
    process.exit(0);
  }

  // compare mode
  if (!existsSync(BASE_DIR) || readdirSync(BASE_DIR).filter(f => f.endsWith(".png")).length === 0) {
    console.log(`SKIP check-visual: no baseline in ${BASE_DIR.replace(ROOT + "/", "")} (run: npm run visual:baseline)`);
    process.exit(0);
  }

  rmSync(CUR_DIR, { recursive: true, force: true });
  mkdirSync(DIFF_DIR, { recursive: true });
  console.log(`check-visual: capturing current screenshots to ${CUR_DIR}`);
  const { captured, failures: capFailures } = await capture(CUR_DIR);

  const baselineFiles = readdirSync(BASE_DIR).filter(f => f.endsWith(".png")).sort();
  let compared = 0;
  let diffs = 0;
  let missing = 0;
  const diffList = [];

  for (const file of baselineFiles) {
    const bPath = join(BASE_DIR, file);
    const cPath = join(CUR_DIR, file);
    if (!existsSync(cPath)) { missing++; diffList.push(`${file}: missing in current`); continue; }
    compared++;
    const bHash = hash(readFileSync(bPath));
    const cHash = hash(readFileSync(cPath));
    if (bHash !== cHash) {
      diffs++;
      diffList.push(file);
      // copy current as "diff evidence" (no pixel-diff lib available)
      writeFileSync(join(DIFF_DIR, `current-${file}`), readFileSync(cPath));
      writeFileSync(join(DIFF_DIR, `baseline-${file}`), readFileSync(bPath));
    }
  }

  console.log(`check-visual: ${compared} compared, ${diffs} differ, ${missing} missing, ${captured} captured`);
  if (capFailures.length) {
    console.log(`WARN ${capFailures.length} capture failure(s):`);
    for (const f of capFailures.slice(0, 10)) console.log(`     - ${f}`);
  }
  if (diffs > 0 || missing > 0) {
    console.log("FAIL visual regressions detected:");
    for (const d of diffList.slice(0, 30)) console.log(`     - ${d}`);
    console.log(`     evidence: ${DIFF_DIR}`);
    process.exit(1);
  }
  console.log("OK   check-visual: no visual regressions");
  process.exit(0);
}

main().catch((e) => { console.error("FAIL check-visual:", e.message); process.exit(1); });
