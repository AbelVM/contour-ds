// Render probe for the theme mechanism (C-05).
//
// Every other gate in this repository counts *declarations*: a token declared,
// a rule present, a specimen rendered — all green — while what the page actually
// paints never moves. This gate asks a browser what a real control looks like
// after a theme set is selected. It fails at HEAD if a declared set cannot
// recolour the primary action, which is what the guide's own `daylight` set did
// for as long as it re-pointed `--color-primary` — a token no solid surface
// consumes — instead of `--brand-hue`.
//
// Three rules this file learned the hard way (four probes, two withdrawn
// readings — review 3 §5.4):
//
//   1. Mount a FRESH control. `background-color` is transitioned, so a
//      pre-existing button read just after a switch is mid-flight and looks
//      unchanged. And never sample a specimen: the guide's first
//      `.c-btn--primary` sits inside a `.c-theme-scope` that pins `--brand-hue`
//      locally, and a locally pinned subtree can never show a root change — that
//      reading is what made the mechanism look broken.
//   2. Decode colours; never compare strings. Chromium serialises a computed
//      colour in the author's own space, so `oklab(0.51 -0.0999 -0.00436)` *is*
//      `oklch(0.51 0.1 182.5)`, and a string diff calls that a change.
//   3. A canvas handed a value it cannot parse keeps its previous fill style and
//      does not throw. Every ratio measured after that is a plausible number
//      about the wrong colour. So the fill style is read back after assignment
//      and a refused value is reported as a failure, never as a lag.
//
// The sweep runs as one in-page call per theme. Per-read round trips across
// 25 hues x 6 surfaces x 2 themes is what turns a gate into a timeout.
//
// Run: node tools/audit/theme-render-probe.mjs   (exit 1 on failure)
import { chromium } from "./lib/browser.mjs";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const errors = [];
const failures = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("file://" + ROOT + "/index.html", { waitUntil: "load" });
await page.waitForTimeout(1000);

const fail = (msg) => {
  failures.push(msg);
  console.error("FAIL:", msg);
};

const RESOLVER = `
window.__canvas = document.createElement('canvas');
window.__canvas.width = 1; window.__canvas.height = 1;
window.__ctx = window.__canvas.getContext('2d', { willReadFrequently: true });
window.__rejected = [];
// A sentinel the system can never legitimately produce: if the fill style is
// still the sentinel after the assignment, the value was refused outright.
window.__SENTINEL = 'rgba(1, 2, 3, 0.5)';
window.__rgb = (css) => {
  const c = window.__ctx;
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = window.__SENTINEL;
  c.fillStyle = css;
  if (c.fillStyle === window.__SENTINEL) {
    window.__rejected.push(css);
    return null;
  }
  c.globalCompositeOperation = 'copy';
  c.fillStyle = css;
  c.fillRect(0, 0, 1, 1);
  const d = c.getImageData(0, 0, 1, 1).data;
  c.globalCompositeOperation = 'source-over';
  return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
};
// Measure a custom property through a real property. getPropertyValue() on an
// unregistered custom property returns its raw token text, which canvas refuses.
window.__tok = (name) => {
  const p = document.createElement('div');
  p.style.color = 'var(' + name + ')';
  document.body.appendChild(p);
  const raw = getComputedStyle(p).color;
  p.remove();
  return { raw: raw, rgb: window.__rgb(raw) };
};
// A token carrying alpha must be composited over the surface it sits on first,
// or the ratio is measured against a colour nobody actually sees.
window.__over = (name, backdrop) => {
  const fg = window.__tok(name);
  const bg = window.__tok(backdrop);
  if (!fg.rgb || !bg.rgb) return null;
  const c = window.__ctx;
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = 'rgb(' + bg.rgb.r + ',' + bg.rgb.g + ',' + bg.rgb.b + ')';
  c.fillRect(0, 0, 1, 1);
  c.fillStyle = fg.raw;
  c.fillRect(0, 0, 1, 1);
  const d = c.getImageData(0, 0, 1, 1).data;
  return { r: d[0], g: d[1], b: d[2] };
};
window.__lum = (rgb) => {
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
};
window.__ratio = (a, b) => {
  const la = window.__lum(a), lb = window.__lum(b);
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return +(((hi + 0.05) / (lo + 0.05)).toFixed(2));
};
window.__freshPrimaryButton = () => {
  const btn = document.createElement('button');
  btn.className = 'c-btn c-btn--primary';
  btn.textContent = 'probe';
  btn.style.position = 'fixed';
  btn.style.top = '-9999px';
  btn.style.left = '-9999px';
  document.body.appendChild(btn);
  const cs = getComputedStyle(btn);
  const out = { bg: cs.backgroundColor, fg: cs.color };
  btn.remove();
  return out;
};
window.__setTheme = (v) => {
  if (v) document.documentElement.setAttribute('data-theme', v);
  else document.documentElement.removeAttribute('data-theme');
};
window.__setScheme = (v) => {
  const m = document.querySelector('meta[name="color-scheme"]');
  if (m) m.setAttribute('content', v);
};
`;
await page.evaluate(RESOLVER);

// ---- the hue sweep, in both themes -------------------------------------
// Only the pairs the contract already owns are asserted here: a control edge
// and the focus indicator at 3:1 against every surface (contrast-and-aria.mjs
// enumerates the same six, and deliberately measures --color-border-strong
// without promising it). The button's own label is a second thing worth keeping
// true of a brand ramp, so it is measured against the same 4.5:1 the README
// gives body text.
const SWEEP = await page.evaluate(() => {
  const SURFACES = [
    "--color-canvas",
    "--color-canvas-sunken",
    "--color-surface-1",
    "--color-surface-2",
    "--color-surface-3",
    "--color-surface-raised",
  ];
  const FG = ["--color-control-edge", "--color-focus-ring"];
  const out = { min: {}, labelMin: null, pairs: 0, hues: 0 };
  for (const scheme of ["light", "dark"]) {
    window.__setScheme(scheme);
    for (let h = 0; h <= 360; h += 15) {
      document.documentElement.style.setProperty("--brand-hue", String(h));
      out.hues++;
      for (const fgName of FG) {
        for (const bgName of SURFACES) {
          const painted = window.__over(fgName, bgName);
          const bg = window.__tok(bgName).rgb;
          if (!painted || !bg) continue;
          const key = `${scheme}: ${fgName} over ${bgName}`;
          const r = window.__ratio(painted, bg);
          out.pairs++;
          if (out.min[key] === undefined || r < out.min[key]) out.min[key] = r;
        }
      }
      const btn = window.__freshPrimaryButton();
      const label = window.__rgb(btn.fg);
      const solid = window.__rgb(btn.bg);
      if (label && solid) {
        const r = window.__ratio(label, solid);
        if (out.labelMin === null || r < out.labelMin) out.labelMin = r;
      }
    }
    document.documentElement.style.removeProperty("--brand-hue");
  }
  window.__setScheme("light dark auto");
  return out;
});

for (const [key, ratio] of Object.entries(SWEEP.min)) {
  if (ratio < 3) fail(`sweep --brand-hue 0..360: ${key} fell to ${ratio}:1, below the 3:1 non-text contract`);
}
if (SWEEP.labelMin === null) fail("sweep: the button label was never measured, so it proved nothing");
else if (SWEEP.labelMin < 4.5)
  fail(`sweep --brand-hue 0..360: .c-btn--primary label fell to ${SWEEP.labelMin}:1, below 4.5:1`);

// ---- every declared set must actually reach the primary action ----------
// Names come from the guide's own switcher, never from a list repeated here —
// the same self-discipline as contrast-and-aria.mjs. A hard-coded list stops
// measuring the moment a set is added, renamed or removed, and measuring
// nothing must never be reported as a pass.
const sets = await page.evaluate(() =>
  [...document.querySelectorAll("[data-theme-set] [data-theme-value]")]
    .map((b) => b.dataset.themeValue)
    .filter(Boolean),
);
if (!sets.length) fail("the guide declares no [data-theme] set, so the render probe measured nothing");

const read = (set) =>
  page.evaluate((v) => {
    window.__setTheme(v);
    const btn = window.__freshPrimaryButton();
    const solid = window.__tok("--color-primary-solid");
    return {
      set: v,
      hue: getComputedStyle(document.documentElement).getPropertyValue("--brand-hue").trim(),
      bg: btn.bg,
      bgRgb: window.__rgb(btn.bg),
      solidRaw: solid.raw,
      solidRgb: solid.rgb,
    };
  }, set);

const baseline = await read(null);
const readings = [];
for (const set of sets) readings.push(await read(set));

for (const r of readings) {
  if (!r.bgRgb || !r.solidRgb) break; // rule 3: report the refusal, not a lag
  if (r.hue === baseline.hue) fail(`set "${r.set}": --brand-hue is still ${r.hue}, so the brand cannot move`);
  const still =
    Math.abs(r.bgRgb.r - baseline.bgRgb.r) < 2 &&
    Math.abs(r.bgRgb.g - baseline.bgRgb.g) < 2 &&
    Math.abs(r.bgRgb.b - baseline.bgRgb.b) < 2;
  if (still)
    fail(
      `set "${r.set}": a fresh .c-btn--primary still paints ${r.bg} — the set does not reach the primary action`,
    );
  // It must land on the set's brand surface, not merely differ from baseline.
  // A set that moved the button somewhere unrelated passes a "changed" check and
  // is still wrong.
  const offTarget =
    Math.abs(r.bgRgb.r - r.solidRgb.r) > 2 ||
    Math.abs(r.bgRgb.g - r.solidRgb.g) > 2 ||
    Math.abs(r.bgRgb.b - r.solidRgb.b) > 2;
  if (offTarget) fail(`set "${r.set}": button ${r.bg} does not match --color-primary-solid ${r.solidRaw}`);
  console.log(`set "${r.set}": hue ${baseline.hue} -> ${r.hue}; button ${baseline.bg} -> ${r.bg}`);
}

// A name nobody declared must move nothing — otherwise "it changed" is noise.
const bogus = await page.evaluate(() => {
  window.__setTheme("no-such-set-xyz");
  const rgb = window.__rgb(window.__freshPrimaryButton().bg);
  window.__setTheme(null);
  return rgb;
});
if (bogus && baseline.bgRgb) {
  const moved =
    Math.abs(bogus.r - baseline.bgRgb.r) >= 2 ||
    Math.abs(bogus.g - baseline.bgRgb.g) >= 2 ||
    Math.abs(bogus.b - baseline.bgRgb.b) >= 2;
  if (moved) fail("a set name that does not exist moved the button — the probe cannot tell change from noise");
}

const rejected = await page.evaluate(() => window.__rejected);
if (rejected.length)
  fail(`the canvas refused ${rejected.length} colour(s): ${[...new Set(rejected)].join(", ")}`);

await browser.close();
if (failures.length || errors.length) {
  if (errors.length) console.error("page errors:", errors);
  console.error(`theme-render-probe: FAIL (${failures.length} failure(s))`);
  process.exit(1);
}
const binding = Object.entries(SWEEP.min).sort((a, b) => a[1] - b[1])[0];
console.log(
  `theme-render-probe: OK — ${sets.length} set(s) render-tested, bogus name discriminated, ` +
    `sweep ${SWEEP.hues} hues x ${SWEEP.pairs} pairs (binding ${binding[0]} at ${binding[1]}:1, ` +
    `label floor ${SWEEP.labelMin}:1).`,
);
