// Chart bindability gate (R18-68).
//
// The claim being guarded is a CONTRACT, not a rendering: a histogram consumer
// drives a widget by *writing* `bins` / `backgroundData` and *reading* `range`,
// and the widget is expected to publish the numeric selection on its brush
// events. A grep cannot prove that — it would pass on an accessor that stores
// the value and never draws it, which is the exact failure ("implementation
// without consumption") this repository keeps shipping.
//
// So this gate asks Chromium, against the shipped bundle, and asserts the
// consequences: a pushed bin array becoming bars, a background array becoming
// context bars that are not focusable, a `range` write moving the brush and a
// brush interaction publishing `detail.range`.
//
// It also records the two behaviours that are deliberately NOT bin-published:
// a raw `values` histogram with no bucket count has no boundaries to publish,
// so `bins` stays empty rather than inventing index coordinates. That is
// asserted, not left to prose, because a later "fix" that quietly makes up
// coordinates would be wrong in the other direction.
//
// Self-discipline: it counts the assertions it ran and fails on an empty sweep,
// and it refuses to start unless `window.ContourElements` proves the bundle
// actually loaded — a page that never upgraded a component would otherwise
// report "0 failures" against fixtures that were never elements.
//
// Run: node tools/audit/chart-bindable.mjs   (exit 1 on failure)
import { chromium } from "./lib/browser.mjs";
import { resolve } from "node:path";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const BUNDLE = resolve(ROOT, "dist/contour-wc.min.js");

const failures = [];
const fail = (message) => {
  failures.push(message);
  console.error("FAIL:", message);
};
let assertions = 0;
const check = (condition, message) => {
  assertions += 1;
  if (!condition) fail(message);
};

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage();
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push(String(e)));

await page.setContent("<!DOCTYPE html><body></body>");
await page.addScriptTag({ path: BUNDLE });

const registry = await page.evaluate(() => (window.ContourElements ? window.ContourElements.length : 0));
if (!registry) {
  console.error("chart-bindable: FAIL — the shipped bundle published no window.ContourElements, so nothing was upgraded and this run proves nothing");
  await browser.close();
  process.exit(1);
}

const result = await page.evaluate(async () => {
  const settle = () => new Promise((r) => setTimeout(r, 30));
  const out = {};

  // 1) bins pushed with no `series` attribute at all.
  const chart = document.createElement("contour-chart");
  document.body.appendChild(chart);
  await settle();
  chart.bins = [
    { x0: 0, x1: 10, count: 4 },
    { x0: 10, x1: 20, count: 9 },
    { x0: 20, x1: 30, count: 2 },
  ];
  await settle();
  out.binsReadBack = chart.bins.length;
  out.bars = chart.querySelectorAll(".c-chart__bar:not([data-context])").length;

  // 2) backgroundData becomes context bars, not marks.
  chart.backgroundData = [
    { x0: 0, x1: 10, count: 30 },
    { x0: 10, x1: 20, count: 40 },
    { x0: 20, x1: 30, count: 50 },
  ];
  await settle();
  out.backgroundReadBack = chart.backgroundData.length;
  const contextBars = [...chart.querySelectorAll(".c-chart__bar[data-context]")];
  out.contextBars = contextBars.length;
  out.contextHidden = contextBars.every((n) => n.getAttribute("aria-hidden") === "true");
  out.contextFocusable = contextBars.some((n) => n.hasAttribute("tabindex"));

  // 3) `range` is a two-way accessor over the brush, in data units.
  out.rangeBefore = chart.range;
  chart.range = [10, 20];
  await settle();
  out.rangeAfter = chart.range;
  out.brushMin = chart.querySelector("contour-brush")?.getAttribute("min");
  out.brushMax = chart.querySelector("contour-brush")?.getAttribute("max");
  chart.range = null;
  await settle();
  out.rangeCleared = chart.range;
  const clearedBrush = chart.querySelector("contour-brush");
  out.brushAfterClear = !!clearedBrush;
  out.brushClearStart = clearedBrush?.getAttribute("start");
  out.brushClearEnd = clearedBrush?.getAttribute("end");

  // 4) a brush interaction publishes the numeric pair.
  const brush = document.createElement("contour-brush");
  brush.setAttribute("min", "0");
  brush.setAttribute("max", "100");
  brush.setAttribute("start", "12");
  brush.setAttribute("end", "48");
  document.body.appendChild(brush);
  await settle();
  const seen = {};
  brush.addEventListener("contour:brush-start", (e) => { seen.start = e.detail.range; });
  brush.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  await settle();
  out.brushStartRange = seen.start || null;

  // 5) the chart re-dispatches the selection as contour:select, range intact.
  chart.setAttribute("series", JSON.stringify([{ type: "histogram", bins: [
    { x0: 0, x1: 10, count: 4 },
    { x0: 10, x1: 20, count: 9 },
  ] }]));
  chart.setAttribute("brush", "");
  chart.setAttribute("brush-start", "5");
  chart.setAttribute("brush-end", "15");
  await settle();
  let selectRange = null;
  chart.addEventListener("contour:select", (e) => { selectRange = e.detail.range; });
  chart.querySelector("contour-brush").dispatchEvent(new CustomEvent("contour:brush-end", {
    bubbles: true,
    composed: true,
    detail: { start: "5", end: "15", value: "15", range: [5, 15] },
  }));
  await settle();
  out.selectRange = selectRange;

  // 6) a pre-binned series with no `values` renders instead of hitting the line path.
  const declared = document.createElement("contour-chart");
  declared.setAttribute("series", JSON.stringify([{ type: "histogram", bins: [
    { x0: 0, x1: 1, count: 3 },
    { x0: 1, x1: 2, count: 7 },
  ] }]));
  document.body.appendChild(declared);
  await settle();
  out.declaredBins = declared.bins.length;
  out.declaredBars = declared.querySelectorAll(".c-chart__bar").length;
  out.declaredFailed = /failed to render/i.test(declared.textContent || "");

  // 7) the legacy values path is unchanged and publishes no invented boundaries.
  const legacy = document.createElement("contour-chart");
  legacy.setAttribute("series", JSON.stringify([{ type: "histogram", values: [4, 9, 2] }]));
  document.body.appendChild(legacy);
  await settle();
  out.legacyBars = legacy.querySelectorAll(".c-chart__bar").length;
  out.legacyBins = legacy.bins.length;

  // 8) bucket-count publishes real boundaries in value units.
  const bucketed = document.createElement("contour-chart");
  bucketed.setAttribute("series", JSON.stringify([{ type: "histogram", values: [1, 2, 2, 3, 9] }]));
  bucketed.setAttribute("bucket-count", "3");
  document.body.appendChild(bucketed);
  await settle();
  out.bucketBins = bucketed.bins;

  // 9) a chart switched away from a histogram stops publishing its bins.
  const switched = document.createElement("contour-chart");
  switched.setAttribute("series", JSON.stringify([{ type: "histogram", bins: [{ x0: 0, x1: 1, count: 2 }] }]));
  document.body.appendChild(switched);
  await settle();
  out.switchedBefore = switched.bins.length;
  switched.setAttribute("series", JSON.stringify([{ values: [1, 2, 3] }]));
  await settle();
  out.switchedAfter = switched.bins.length;

  out.chartRegistered = !!customElements.get("contour-chart");
  return out;
});

await browser.close();

check(result.chartRegistered, "contour-chart never registered — the bundle loaded but the element did not");
check(result.binsReadBack === 3, `pushing 3 bins with no \`series\` published ${result.binsReadBack} back`);
check(result.bars === 3, `pushing 3 bins rendered ${result.bars} bar(s) — a stored value that draws nothing is the failure this gate exists for`);
check(result.backgroundReadBack === 3, `pushing 3 background bins published ${result.backgroundReadBack} back`);
check(result.contextBars === 3, `pushing 3 background bins rendered ${result.contextBars} context bar(s)`);
check(result.contextHidden, "context bars are not aria-hidden — they are backdrop, not marks");
check(!result.contextFocusable, "context bars are focusable — they duplicate the marks' tab stops");
check(result.rangeBefore === null, `an unbrushed chart reported range ${JSON.stringify(result.rangeBefore)} instead of null`);
check(
  JSON.stringify(result.rangeAfter) === JSON.stringify([10, 20]),
  `range = [10, 20] read back as ${JSON.stringify(result.rangeAfter)}`,
);
check(result.brushMin === "0" && result.brushMax === "30", `the brush track did not derive from the bins: min=${result.brushMin} max=${result.brushMax}`);
check(
  result.rangeCleared === null && result.brushAfterClear && result.brushClearStart === "0" && result.brushClearEnd === "30",
  `range = null did not read as "no constraint": range=${JSON.stringify(result.rangeCleared)} brush=${result.brushAfterClear} start=${result.brushClearStart} end=${result.brushClearEnd}`,
);
check(
  JSON.stringify(result.brushStartRange) === JSON.stringify([12, 48]),
  `contour:brush-start carried range ${JSON.stringify(result.brushStartRange)}, expected [12, 48]`,
);
check(
  JSON.stringify(result.selectRange) === JSON.stringify([5, 15]),
  `contour:select did not carry the brush range: ${JSON.stringify(result.selectRange)}`,
);
check(result.declaredBins === 2 && result.declaredBars === 2, `a pre-binned series rendered bins=${result.declaredBins} bars=${result.declaredBars}`);
check(!result.declaredFailed, "a pre-binned series painted “Component failed to render.”");
check(result.legacyBars === 3, `the legacy values path rendered ${result.legacyBars} bar(s), expected 3`);
check(result.legacyBins === 0, `raw values with no bucket count published ${result.legacyBins} invented bin(s); there are no boundaries to publish`);
check(
  Array.isArray(result.bucketBins) && result.bucketBins.length === 3 && result.bucketBins.every((b) => Number.isFinite(b.x0) && Number.isFinite(b.x1) && Number.isFinite(b.count)),
  `bucket-count did not publish three finite bins: ${JSON.stringify(result.bucketBins)}`,
);
check(
  result.switchedBefore === 1 && result.switchedAfter === 0,
  `a chart switched from histogram to line still reports bins=${result.switchedAfter} (was ${result.switchedBefore}) — a stale distribution is worse than none`,
);

if (consoleErrors.length) {
  fail(`the page logged ${consoleErrors.length} console error(s): ${consoleErrors.slice(0, 3).join(" | ")}`);
}

if (!assertions) {
  console.error("chart-bindable: FAIL — no assertion ran, so a green exit would mean nothing");
  process.exit(1);
}

if (failures.length) {
  console.error(`chart-bindable: FAIL — ${assertions} assertion(s), ${failures.length} failed`);
  process.exit(1);
}

console.log(
  `chart-bindable: OK — ${assertions} assertion(s) against ${registry} registered element(s): ` +
    "bins/backgroundData push and render, range reads and writes the brush, brush events carry detail.range.",
);