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
import { join } from "node:path";
import { serveStatic } from "./lib/static-server.mjs";

const ROOT = process.cwd();
const args = new Set(process.argv.slice(2));
const mode = args.has("--baseline") ? "baseline" : args.has("--compare") ? "compare" : args.has("--verify") ? "verify" : "compare";

const BASE_DIR = process.env.VISUAL_BASE || join(ROOT, "tests/visual/baseline");
const CUR_DIR = process.env.VISUAL_CURRENT || join(ROOT, "tmp/visual/current");
const DIFF_DIR = process.env.VISUAL_DIFF || join(ROOT, "tmp/visual/diff");

// A static Storybook cannot be opened over `file://`: its iframe loads ES
// modules and a stylesheet, and Chromium refuses both at that origin. The gate
// then screenshots an empty page and calls the theme consistent — which is
// exactly what happened before `tools/lib/static-server.mjs` existed. Serve
// the build over loopback instead, and require the story root to hold an
// element before a screenshot counts.
async function storybookUrl() {
  if (process.env.STORYBOOK_URL) return { base: process.env.STORYBOOK_URL, close: async () => {} };
  const staticIndex = join(ROOT, "storybook/index.html");
  if (existsSync(staticIndex)) {
    const server = await serveStatic(join(ROOT, "storybook"));
    console.log(`check-visual: serving ${join("storybook")} at ${server.url}`);
    return { base: server.url, close: server.close };
  }
  return { base: "http://127.0.0.1:6006", close: async () => {} };
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
  "contour-forms-select--default",
  "contour-forms-textarea--default",
  "contour-map-layerandstyle--layer-panel",
  "contour-map-layerandstyle--style-panel",
  "contour-compositions-dialogform--dialog-with-form-validation",
  "contour-compositions-comboboxfield--combobox-with-label-and-error",
  "contour-compositions-chartlegend--chart-with-legend",
  "contour-compositions-layerpanelmap--layer-panel-emits-visibility-intent",
  "contour-compositions-splitpaneoverlays--split-pane-with-dialog",
  "contour-compositions-tablefilters--table-with-filter-bar",
  "contour-compositions-tablefilters--table-with-pagination-and-sorting",
  "contour-compositions-tablefilters--table-with-selection-and-bulk-actions",
  "contour-compositions-charttable--chart-with-table-cross-selection",
  "contour-compositions-charttable--chart-with-time-slider",
  "contour-compositions-charttable--multi-series-chart-with-legend-toggle",
  "contour-compositions-realworlddemos--spatial-dashboard-demo",
  "contour-compositions-realworlddemos--documentation-page-demo",
  "contour-compositions-realworlddemos--landing-page-demo",
  "contour-compositions-realworlddemos--analytics-workspace-demo",
  "contour-compositions-realworlddemos--documentation-portal-demo",
  "contour-compositions-realworlddemos--comparison-workspace-demo",
  "contour-compositions-workspaceshell--dock-workspace-shell",
  "contour-compositions-docsbehaviors--docs-nav-drawer-contract",
];

const THEMES = ["light", "dark"];
const WIDTHS = [390, 1440];

// Key states: a rendered example is only half the contract — the states a
// reader meets (open overlay, failed request, pending request, live toast)
// must survive both themes and both widths too.
const STATE_STORIES = [
  "contour-overlays-dialog--open-close",
  "contour-overlays-dialog--nested-overlay-escape",
  "contour-data-table--loading",
  "contour-data-table--error-retry",
  "contour-feedback-toast--default",
];

// Axes beyond theme × width. Forced Colors Mode replaces the page's palette
// with the system's, so it is one theme by definition; compact density is a
// real token switch and is checked in both themes. The default axis keeps the
// original file name so an existing baseline stays valid.
const AXES = [
  { id: "", stories: [...STORIES, ...STATE_STORIES], themes: THEMES },
  { id: "forced-colors", stories: STATE_STORIES, themes: ["light"], context: { forcedColors: "active" } },
  { id: "compact", stories: STATE_STORIES, themes: THEMES, density: "compact" },
];

function shotName(story, theme, width, axis = "") {
  return `${story}--${theme}--${width}${axis ? "--" + axis : ""}.png`;
}

// A story id is a name the built Storybook has to know. When a title or an
// export is renamed, the old id renders an empty stage and — before the
// content guard — produced a screenshot that compared equal forever. Capture
// modes check every id against the build's own index before opening a page.
// `--verify` does not: it is the doctor's armament check, it opens no page,
// and the committed `storybook/` artifact can legitimately be older than the
// stories until `build-storybook` runs (which CI does before comparing).
function validateStoryIds() {
  const indexPath = join(ROOT, "storybook/index.json");
  if (!existsSync(indexPath)) {
    console.log("check-visual: no storybook/index.json — ids are not validated against a build (using the running server)");
    return;
  }
  const entries = new Set(Object.keys(JSON.parse(readFileSync(indexPath, "utf8")).entries || {}));
  const all = [...new Set(AXES.flatMap((a) => a.stories))];
  const missing = all.filter((id) => !entries.has(id));
  if (missing.length) {
    console.log(`FAIL check-visual: ${missing.length} story id(s) are not in the built Storybook:`);
    for (const id of missing) console.log(`     - ${id}`);
    console.log("     A renamed story would otherwise be captured as a blank page and compare equal forever.");
    process.exit(1);
  }
  console.log(`check-visual: ${all.length} story ids resolve in the built Storybook (${AXES.length} axes)`);
}

function hash(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

async function capture(outDir) {
  mkdirSync(outDir, { recursive: true });
  const storybook = await storybookUrl();
  const base = storybook.base;
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    console.log(`SKIP check-visual: chromium unavailable (${e.message})`);
    process.exit(0);
  }
  const failures = [];
  let captured = 0;
  for (const axis of AXES) {
    for (const theme of axis.themes || THEMES) {
      for (const width of WIDTHS) {
        const context = await browser.newContext({
          viewport: { width, height: width === 390 ? 844 : 900 },
          colorScheme: theme,
          reducedMotion: "reduce",
          ...(axis.context || {}),
        });
        for (const story of axis.stories) {
          const page = await context.newPage();
          const url = `${base}/iframe.html?id=${story}&viewMode=story&globals=theme:${theme}`;
          const out = join(outDir, shotName(story, theme, width, axis.id));
          try {
            // `networkidle` never settles on a story that keeps a request open
            // (remote `src`, fonts, a polling control) and turns one slow
            // example into a 30 s stall. The rendered root and the fonts are the
            // two things a screenshot actually needs.
            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
            // A blank story is not a passing story. Storybook's root must hold
            // the rendered example, not an empty stage.
            await page.waitForFunction(
              () => (document.getElementById("storybook-root")?.childElementCount || 0) > 0,
              null,
              { timeout: 10000 },
            );
            await page.addStyleTag({
              content: "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }",
            });
            try { await page.evaluate(() => document.fonts?.ready); } catch {}
            try { await page.waitForFunction((t) => document.documentElement.dataset.theme === t, theme, { timeout: 3000 }); } catch {}
            if (axis.density) {
              await page.evaluate((d) => { document.documentElement.dataset.density = d; }, axis.density);
            }
            await page.waitForTimeout(120);
            const buf = await page.screenshot({ fullPage: false });
            writeFileSync(out, buf);
            captured++;
          } catch (e) {
            failures.push(`${story} ${theme} ${width}${axis.id ? " " + axis.id : ""}: ${e.message.split("\n")[0]}`);
          }
          await page.close();
        }
        await context.close();
      }
    }
  }
  await browser.close();
  await storybook.close();
  return { captured, failures };
}

async function main() {
  if (mode !== "verify") validateStoryIds();
  if (mode === "baseline") {
    console.log(`check-visual: generating baseline in ${BASE_DIR}`);
    rmSync(BASE_DIR, { recursive: true, force: true });
    const { captured, failures } = await capture(BASE_DIR);
    console.log(`OK   check-visual baseline: ${captured} screenshots captured`);
    if (failures.length) {
      // A baseline built from failed captures is a baseline of the failure.
      console.log(`FAIL check-visual baseline: ${failures.length} capture failure(s):`);
      for (const f of failures) console.log(`     - ${f}`);
      process.exit(1);
    }
    process.exit(0);
  }

  // verify mode: lightweight armament check for doctor/CI (no browser capture)
  if (mode === "verify") {
    const files = existsSync(BASE_DIR) ? readdirSync(BASE_DIR).filter(f => f.endsWith(".png")) : [];
    if (files.length === 0) {
      console.log(`SKIP check-visual: no baseline in ${BASE_DIR.replace(ROOT + "/", "")} (run: npm run visual:baseline)`);
      process.exit(0);
    }
    // An axis that produces the same pixels as the default axis is not an axis
    // — it is a second name for the same measurement. Prove at least one shot
    // per non-default axis actually differs from its default counterpart.
    const problems = [];
    for (const axis of AXES.filter(a => a.id)) {
      const forAxis = files.filter(f => f.endsWith(`--${axis.id}.png`));
      if (!forAxis.length) { problems.push(`axis "${axis.id}" has no baseline shots`); continue; }
      const changed = forAxis.some(f => {
        const base = join(BASE_DIR, f.slice(0, -`--${axis.id}.png`.length) + ".png");
        return existsSync(base) && hash(readFileSync(join(BASE_DIR, f))) !== hash(readFileSync(base));
      });
      if (!changed) problems.push(`axis "${axis.id}" is identical to the default in every shot — it measures nothing`);
    }
    if (problems.length) {
      console.log("FAIL check-visual: axis liveness");
      for (const p of problems) console.log(`     - ${p}`);
      process.exit(1);
    }
    console.log(`OK   check-visual: baseline armed (${files.length} screenshots in ${BASE_DIR.replace(ROOT + "/", "")}, ${AXES.length - 1} extra axis/axes live); run npm run visual:check for full comparison`);
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

  // A byte hash is too strict for a rendered frame: text antialiasing moves a
  // handful of pixels between two captures of the same story (measured 2–102
  // of ~1.4 M here). Compare pixels in the browser the gate already owns, and
  // allow a tenth of a percent before calling a frame different — a missing
  // border or a moved control is orders of magnitude above that.
  const TOLERANCE = 0.001;
  const diffBrowser = await chromium.launch({ headless: true });
  const diffPage = await diffBrowser.newPage();
  const countDiff = async (aBuf, bBuf) => diffPage.evaluate(async ({ a, b }) => {
    const load = (src) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { total: ia.width * ia.height, diff: Infinity };
    const canvas = document.createElement("canvas");
    canvas.width = ia.width;
    canvas.height = ia.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(ia, 0, 0);
    const da = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(ib, 0, 0);
    const db = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let diff = 0;
    for (let i = 0; i < da.length; i += 4) {
      if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2] || da[i + 3] !== db[i + 3]) diff++;
    }
    return { total: canvas.width * canvas.height, diff };
  }, { a: `data:image/png;base64,${aBuf.toString("base64")}`, b: `data:image/png;base64,${bBuf.toString("base64")}` });

  for (const file of baselineFiles) {
    const bPath = join(BASE_DIR, file);
    const cPath = join(CUR_DIR, file);
    if (!existsSync(cPath)) { missing++; diffList.push(`${file}: missing in current`); continue; }
    compared++;
    const bBuf = readFileSync(bPath);
    const cBuf = readFileSync(cPath);
    if (hash(bBuf) === hash(cBuf)) continue;
    const { total, diff } = await countDiff(bBuf, cBuf);
    const ratio = total ? diff / total : Infinity;
    if (ratio > TOLERANCE) {
      diffs++;
      diffList.push(`${file}: ${diff}/${total} px (${(ratio * 100).toFixed(3)}%)`);
      writeFileSync(join(DIFF_DIR, `current-${file}`), cBuf);
      writeFileSync(join(DIFF_DIR, `baseline-${file}`), bBuf);
    }
  }
  await diffBrowser.close();

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
