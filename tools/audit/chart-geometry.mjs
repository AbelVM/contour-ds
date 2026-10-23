// Chart geometry seam gate (C-24).
//
// The claim being guarded is a CONSTRUCTION: the gridline band is derived from
// `--chart-ticks`, so a gridline falls on every value interval whatever that
// count is. A text grep cannot prove that — it would pass on a file that still
// said `25%` in a comment, and fail on one that had been reformatted. So this
// gate asks a browser, and it asks the only question that distinguishes a derived
// band from a literal one: change the number, does the band move?
//
// It also guards two things this repository has repeatedly shipped as
// declarations without consumers:
//
//   `.c-chart__hover`  a rule no author can reach is not a state. Hover must be
//                      reachable as :hover on a real mark.
//   `.c-chart__tooltip` had only a colour pair — no position, no padding, no
//                      stacking — so it could not sit on top of the mark it
//                      describes, and nothing in the repository used it.
//
// Measurement notes, all learned in this file's own drafts:
//   - Chromium serialises a repeating-gradient period as a PERCENTAGE
//     (`rgba(0, 0, 0, 0) 25%`), and only the hairline stop as px. Reading px
//     lengths alone reports the 1px hairline as the "band" and tells you the
//     seam does not follow, when the failure is in the ruler.
//   - `transparent` never survives serialisation, so matching that literal
//     finds no stop at all.
//   - Measure through a real property. getPropertyValue('--chart-ticks')
//     returns the author's text, which proves a declaration, not a render.
//
// Run: node tools/audit/chart-geometry.mjs   (exit 1 on failure)
import { chromium } from "./lib/browser.mjs";
import { readFileSync } from "node:fs";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const failures = [];
const fail = (m) => {
  failures.push(m);
  console.error("FAIL:", m);
};

const css = readFileSync(`${ROOT}/src/css/components-data.css`, "utf8");

// The rule must exist before a browser can obey it. Checked statically because
// the assertion is about the source, not the render.
const plotRule = /\.c-chart__plot\s*\{[\s\S]*?\n  \}/.exec(css);
if (!plotRule) {
  fail(".c-chart__plot is not a rule I can find in components-data.css — cannot judge its geometry");
} else {
  if (!/var\(--chart-ticks/.test(plotRule[0]))
    fail(".c-chart__plot does not read --chart-ticks: the band is a literal again");
  const literal = /transparent\s+1px\s+(\d+(?:\.\d+)?)%/.exec(plotRule[0]);
  if (literal) fail(`.c-chart__plot still hard-codes a ${literal[1]}% band`);
}
if (/\.c-chart__hover\s*\{/.test(css))
  fail(".c-chart__hover is still a class rule with no author able to reach it");
if (!/\.c-chart__[a-z]+:hover/.test(css)) fail("no :hover state exists on any chart mark");

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
await page.goto(`file://${ROOT}/index.html`, { waitUntil: "load" });
await page.waitForTimeout(800);

const plots = await page.evaluate(() => document.querySelectorAll(".c-chart__plot").length);
if (!plots) fail("the guide renders no .c-chart__plot, so the construction cannot be measured");

// The construction test. Four counts, none of them the default: if the band is
// derived it follows every one; if it is a literal it follows none.
//
// The 0.6 percentage-point tolerance is measured, not chosen. Against the
// derived rule the engine returned 33.3333% where 100/3 = 33.33 is expected, and
// 25, 20, 12.5 and 10 exactly — a spread of 0.0033, which is serialisation
// rounding. So the bound sits ~180x above the estimator's own noise and ~3x
// below the smallest real deviation this gate exists to catch (a wrong tick
// count moves the band by whole percentage points).
const COUNTS = [4, 5, 6, 9, 11];
let followed = 0;
for (const ticks of COUNTS) {
  const got = await page.evaluate((n) => {
    const plot = document.querySelector(".c-chart__plot");
    plot.style.setProperty("--chart-ticks", String(n));
    const bi = getComputedStyle(plot).backgroundImage;
    const h = plot.getBoundingClientRect().height;
    const stops = [...bi.matchAll(/(\d+(?:\.\d+)?)(%|px)/g)].map((m) => ({ v: Number(m[1]), u: m[2] }));
    if (!stops.length) return { pct: null, raw: bi };
    const last = stops[stops.length - 1];
    return { pct: last.u === "%" ? last.v : +((last.v / h) * 100).toFixed(3), raw: bi.slice(0, 120) };
  }, ticks);
  const expected = +((100 / (ticks - 1)).toFixed(2));
  if (got.pct === null) {
    fail(`--chart-ticks=${ticks}: computed background-image has no readable stop (${got.raw})`);
    continue;
  }
  if (Math.abs(got.pct - expected) > 0.6) {
    fail(`--chart-ticks=${ticks}: band is ${got.pct}% of the plot, expected ${expected}% — the grid does not follow the number`);
    continue;
  }
  followed++;
  console.log(`--chart-ticks=${ticks}: band ${got.pct}% (expected ${expected}%)`);
}
if (followed !== COUNTS.length && !failures.length)
  fail(`band followed in ${followed} of ${COUNTS.length} counts — a partial derivation is not a construction`);
await page.evaluate(() => document.querySelector(".c-chart__plot").style.removeProperty("--chart-ticks"));

// The tooltip must be able to sit on top of its plot, and a chart must use it.
const tip = await page.evaluate(() => {
  const t = document.querySelector(".c-chart__tooltip");
  if (!t) return null;
  const cs = getComputedStyle(t);
  const plot = t.closest(".c-chart__plot");
  return {
    position: cs.position,
    zIndex: cs.zIndex,
    padding: cs.padding,
    pointerEvents: cs.pointerEvents,
    inPlot: !!plot,
    offsetParent: t.offsetParent ? t.offsetParent.className : null,
  };
});
if (!tip) {
  fail("no .c-chart__tooltip is rendered anywhere in the guide — the geometry it has is unused");
} else {
  if (tip.position !== "absolute") fail(`tooltip position is ${tip.position}, not absolute`);
  if (Number(tip.zIndex) < 1) fail(`tooltip z-index is ${tip.zIndex}: it cannot float above its mark`);
  if (!/px/.test(tip.padding) || tip.padding.startsWith("0")) fail(`tooltip padding is ${tip.padding}`);
  if (tip.pointerEvents !== "none")
    fail(`tooltip pointer-events is ${tip.pointerEvents}: a tip that takes the pointer sits over its own mark, cancels the :hover that opened it, and flickers`);
  if (!tip.inPlot) fail("the tooltip is not inside a .c-chart__plot, so the plot cannot anchor it");
  console.log(`tooltip: ${JSON.stringify(tip)}`);
}

await browser.close();
if (failures.length) {
  console.error(`chart-geometry: FAIL (${failures.length})`);
  process.exit(1);
}
console.log(
  `chart-geometry: OK — band derived from --chart-ticks in ${followed}/${COUNTS.length} counts, ` +
    `hover is a :hover state, tooltip positioned and consumed.`,
);
