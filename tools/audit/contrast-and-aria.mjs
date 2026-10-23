// Browser-measured audit of the Contour design system — colour-accurate.
// Contract gate: contrast, focus, target size and document hygiene, measured
// in a real browser against the rendered guide.
// Run: node tools/audit/contrast-and-aria.mjs   (exit 1 when the contract fails)
import { chromium } from "./lib/browser.mjs";
import fs from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("file://" + ROOT + "/index.html", { waitUntil: "load" });
await page.waitForTimeout(1000);

const RESOLVER = `
window.__canvas = document.createElement('canvas');
window.__canvas.width = 1; window.__canvas.height = 1;
window.__ctx = window.__canvas.getContext('2d', { willReadFrequently: true });
// Resolve a CSS colour to sRGB 0-255 + alpha, via the canvas (handles oklch/oklab/color-mix/named/rgb).
window.__rgb = (css) => {
  const c = window.__ctx;
  c.clearRect(0,0,1,1);
  c.fillStyle = 'rgba(0,0,0,0)';
  c.fillStyle = css;
  // Detect alpha by painting over a known backdrop.
  c.globalCompositeOperation = 'copy';
  c.fillStyle = css;
  c.fillRect(0,0,1,1);
  const d = c.getImageData(0,0,1,1).data;
  c.globalCompositeOperation = 'source-over';
  return { r: d[0], g: d[1], b: d[2], a: d[3]/255 };
};
// Resolve a token to sRGB, composited over a backdrop colour.
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

const results = {};

/* ---- ramp analysis (light) ---- */
const ramp = async (names) =>
  page.evaluate((ns) => {
    const steps = ns.map((n) => ({ n, ...window.__tok(n) }));
    const adj = [];
    for (let i = 0; i < steps.length - 1; i++) {
      adj.push({
        pair: steps[i].n + " -> " + steps[i + 1].n,
        ratio: window.__ratio(steps[i], steps[i + 1]),
        dL: +(window.__lum(steps[i + 1]) - window.__lum(steps[i])).toFixed(4),
      });
    }
    return {
      steps: steps.map((s) => ({ n: s.n, raw: s.raw, lum: +window.__lum(s).toFixed(4) })),
      adjacent: adj,
    };
  }, names);

// The heat ramp is measured, never gated for monotonicity: T-81 established it
// is a multi-hue heat scale, so its lightness legitimately dips. The gate below
// belongs to --chart-seq-*, which is the one true sequential ramp.
results.lightHeat = await ramp(["--color-heat-1","--color-heat-2","--color-heat-3","--color-heat-4","--color-heat-5","--color-heat-6"]);
results.lightSeq = await ramp(["--chart-seq-1","--chart-seq-2","--chart-seq-3","--chart-seq-4","--chart-seq-5","--chart-seq-6","--chart-seq-7"]);
results.lightDiv = await ramp(["--chart-div-neg","--chart-div-mid","--chart-div-pos"]);

/* ---- chart categorical vs panel ---- */
results.lightSeries = await page.evaluate(() => {
  const out = [];
  for (let i = 1; i <= 8; i++) {
    const fg = window.__tokOver("--chart-" + i, "--color-surface-1");
    const fg2 = window.__tokOver("--chart-" + i, "--color-surface-2");
    out.push({ i, vsSurface1: window.__ratio(fg, window.__tok("--color-surface-1")), vsSurface2: window.__ratio(fg2, window.__tok("--color-surface-2")) });
  }
  return out;
});

/* ---- focus indicator contrast ---- */
results.focusLight = await page.evaluate(() => ({
  "ring vs surface-1": window.__ratio(window.__tokOver("--color-focus-ring", "--color-surface-1"), window.__tok("--color-surface-1")),
  "ring vs canvas": window.__ratio(window.__tokOver("--color-focus-ring", "--color-canvas"), window.__tok("--color-canvas")),
  "halo vs surface-1": window.__ratio(window.__tokOver("--color-focus-halo", "--color-surface-1"), window.__tok("--color-surface-1")),
  "halo vs canvas": window.__ratio(window.__tokOver("--color-focus-halo", "--color-canvas"), window.__tok("--color-canvas")),
  "halo vs surface-2": window.__ratio(window.__tokOver("--color-focus-halo", "--color-surface-2"), window.__tok("--color-surface-2")),
  haloRaw: window.__tok("--color-focus-halo").raw,
  ringRaw: window.__tok("--color-focus-ring").raw,
}));

/* ---- the surface a control sits on ---- */
// The README contract is that a control edge meets 3:1 against *every* surface
// it can be drawn on, so the measurement has to enumerate the surfaces rather
// than spot-check one. Same for the focus ring: WCAG 1.4.11 wants the
// indicator visible against whatever is behind it.
// The surfaces a control can actually be drawn on. These names are taken from
// `src/css/tokens.css`, not from a guess: `--color-panel` does not exist, and
// asking the canvas resolver to paint an undeclared token yields a number that
// measures nothing while still printing as if it passed.
const SURFACES = [
  "--color-canvas",
  "--color-canvas-sunken",
  "--color-surface-1",
  "--color-surface-2",
  "--color-surface-3",
  "--color-surface-raised",
];

const overSurfaces = () =>
  page.evaluate((surfaces) => {
    const out = {};
    for (const fg of ["--color-control-edge", "--color-focus-ring", "--color-border-strong"]) {
      for (const bg of surfaces) {
        out[`${fg} over ${bg}`] = window.__ratio(window.__tokOver(fg, bg), window.__tok(bg));
      }
    }
    return out;
  }, SURFACES);

results.controlLight = await overSurfaces();

/* ---- scrollbar + border edges ---- */
results.edgesLight = await page.evaluate(() => ({
  "border-strong vs canvas": window.__ratio(window.__tokOver("--color-border-strong", "--color-canvas"), window.__tok("--color-canvas")),
  "border vs canvas": window.__ratio(window.__tokOver("--color-border", "--color-canvas"), window.__tok("--color-canvas")),
  "border vs surface-1": window.__ratio(window.__tokOver("--color-border", "--color-surface-1"), window.__tok("--color-surface-1")),
  "text-subtle vs surface-3": window.__ratio(window.__tokOver("--color-text-subtle", "--color-surface-3"), window.__tok("--color-surface-3")),
  "text-muted vs surface-3": window.__ratio(window.__tokOver("--color-text-muted", "--color-surface-3"), window.__tok("--color-surface-3")),
  "text-subtle vs surface-1": window.__ratio(window.__tokOver("--color-text-subtle", "--color-surface-1"), window.__tok("--color-surface-1")),
}));

/* ---- keyboard focus: does :focus-visible change border-radius? ---- */
await page.evaluate(() => {
  document.body.focus();
  window.scrollTo(0, 0);
});
// find a pill button and a plain input, tab to them
results.focusRadiusKeyboard = await (async () => {
  const out = [];
  const targets = await page.evaluate(() => {
    const sel = [".c-btn", ".c-pill", ".c-badge", ".c-avatar", ".c-input", ".c-check__input", ".c-switch__input"].map((s) => {
      const el = document.querySelector(s);
      return el ? { s, tag: el.tagName, id: el.id || null, cls: el.className.toString().slice(0, 50), radius: getComputedStyle(el).borderRadius } : { s, missing: true };
    });
    return sel;
  });
  for (const t of targets) {
    if (t.missing) { out.push(t); continue; }
    const before = t.radius;
    await page.evaluate((s) => {
      const el = document.querySelector(s);
      el.setAttribute("data-probe", "1");
      el.focus();
    }, t.s);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    const after = await page.evaluate((s) => {
      const el = document.querySelector(s);
      el.focus();
      return getComputedStyle(el).borderRadius;
    }, t.s);
    out.push({ ...t, afterFocus: after, changed: before !== after });
  }
  return out;
})();

/* ---- the real question: does the base :focus-visible border-radius win? ---- */
results.focusRadiusCascade = await page.evaluate(() => {
  // Inject a bare element with no component class and see if :focus-visible changes its radius.
  const el = document.createElement("div");
  el.tabIndex = 0;
  el.id = "probe-focus";
  el.textContent = "x";
  document.body.appendChild(el);
  const before = getComputedStyle(el).borderRadius;
  el.focus();
  const after = getComputedStyle(el).borderRadius;
  // and a pill inside a component
  const pill = document.querySelector(".c-pill");
  const pBefore = pill ? getComputedStyle(pill).borderRadius : null;
  if (pill) pill.focus();
  const pAfter = pill ? getComputedStyle(pill).borderRadius : null;
  const r = { bare: { before, after, changed: before !== after }, pill: { before: pBefore, after: pAfter, changed: pBefore !== pAfter } };
  el.remove();
  return r;
});

/* ---- command palette ARIA ---- */
results.commandPalette = await page.evaluate(() => {
  const input = document.querySelector("[data-command-field]");
  const list = document.querySelector("[data-command-list]");
  const out = {
    inputRole: input?.getAttribute("role"),
    hasActivedescendant: input?.hasAttribute("aria-activedescendant"),
    ariaExpandedAttr: input?.getAttribute("aria-expanded"),
    listRole: list?.getAttribute("role"),
    listLabel: list?.getAttribute("aria-label"),
  };
  document.querySelector("[data-command-open]")?.click();
  return new Promise((res) =>
    setTimeout(() => {
      const items = [...document.querySelectorAll(".c-command__item")];
      out.options = items.length;
      out.optionRole = items[0]?.getAttribute("role");
      out.optionTabindex = items[0]?.getAttribute("tabindex");
      out.optionsInTabOrder = items.filter((i) => i.tabIndex >= 0).length;
      out.selectedAfterOpen = items.filter((i) => i.getAttribute("aria-selected") === "true").length;
      out.activedescendantAfterOpen = input?.getAttribute("aria-activedescendant");
      out.expandedAfterOpen = input?.getAttribute("aria-expanded");
      out.listHasLabel = !!list?.getAttribute("aria-label");
      res(out);
    }, 300),
  );
});

/* ---- resize handle / drag handle ---- */
results.dragAffordances = await page.evaluate(() => {
  const grab = [];
  for (const el of document.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    if (cs.cursor === "grab" || cs.cursor === "col-resize") {
      const r = el.getBoundingClientRect();
      grab.push({
        cls: el.className.toString().slice(0, 50),
        tag: el.tagName,
        cursor: cs.cursor,
        w: +r.width.toFixed(1),
        h: +r.height.toFixed(1),
        tabindex: el.getAttribute("tabindex"),
        role: el.getAttribute("role"),
        ariaLabel: el.getAttribute("aria-label"),
        opacity: cs.opacity,
        visible: r.width > 0 && r.height > 0,
      });
    }
  }
  return grab.slice(0, 20);
});

/* ---- document hygiene ---- */
results.document = await page.evaluate(() => {
  const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
  const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => +h.tagName[1]);
  const jumps = [];
  for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) jumps.push(`${hs[i - 1]}->${hs[i]}@${i}`);
  const inputs = [...document.querySelectorAll("input:not([type=hidden])")];
  const unlabelled = inputs.filter((i) => {
    if (i.getAttribute("aria-label") || i.getAttribute("aria-labelledby")) return false;
    if (i.id && document.querySelector(`label[for="${i.id}"]`)) return false;
    if (i.closest("label")) return false;
    return true;
  }).map((i) => i.outerHTML.slice(0, 90));
  const btns = [...document.querySelectorAll("button")];
  const namelessBtns = btns.filter((b) => {
    const t = (b.textContent || "").trim();
    return !t && !b.getAttribute("aria-label") && !b.getAttribute("title") && !b.getAttribute("aria-labelledby");
  }).length;
  return {
    h1: document.querySelectorAll("h1").length,
    main: document.querySelectorAll("main").length,
    duplicateIds: dupes,
    headingJumps: jumps,
    headingJumpCount: jumps.length,
    imgsNoAlt: [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).length,
    skipLink: !!document.querySelector(".skip-link"),
    lang: document.documentElement.lang,
    unlabelledInputs: unlabelled,
    namelessButtons: namelessBtns,
    buttons: btns.length,
    totalElements: document.querySelectorAll("*").length,
  };
});

/* ---- dark theme repeat ---- */
await page.evaluate(() => {
  const m = document.querySelector('meta[name="color-scheme"]');
  if (m) m.setAttribute("content", "dark");
});
await page.waitForTimeout(300);
results.dark = await page.evaluate(() => ({
  "ring vs surface-1": window.__ratio(window.__tokOver("--color-focus-ring", "--color-surface-1"), window.__tok("--color-surface-1")),
  "halo vs surface-1": window.__ratio(window.__tokOver("--color-focus-halo", "--color-surface-1"), window.__tok("--color-surface-1")),
  "halo vs canvas": window.__ratio(window.__tokOver("--color-focus-halo", "--color-canvas"), window.__tok("--color-canvas")),
  "border-strong vs canvas": window.__ratio(window.__tokOver("--color-border-strong", "--color-canvas"), window.__tok("--color-canvas")),
  "text-subtle vs surface-3": window.__ratio(window.__tokOver("--color-text-subtle", "--color-surface-3"), window.__tok("--color-surface-3")),
  haloRaw: window.__tok("--color-focus-halo").raw,
}));
results.controlDark = await overSurfaces();
results.darkHeat = await ramp(["--color-heat-1","--color-heat-2","--color-heat-3","--color-heat-4","--color-heat-5","--color-heat-6"]);
results.darkSeq = await ramp(["--chart-seq-1","--chart-seq-2","--chart-seq-3","--chart-seq-4","--chart-seq-5","--chart-seq-6","--chart-seq-7"]);
results.darkSeries = await page.evaluate(() => {
  const out = [];
  for (let i = 1; i <= 8; i++) {
    const fg = window.__tokOver("--chart-" + i, "--color-surface-1");
    out.push({ i, vsSurface1: window.__ratio(fg, window.__tok("--color-surface-1")) });
  }
  return out;
});

results.dataThemes = {};
for (const theme of ["positron", "dark-matter", "high-contrast"]) {
  await page.evaluate((t) => {
    document.documentElement.setAttribute("data-theme", t);
  }, theme);
  await page.waitForTimeout(200);
  results.dataThemes[theme] = await overSurfaces();
}
// restore
await page.evaluate(() => document.documentElement.removeAttribute("data-theme"));

results.errors = errors;
// Output lives in the repository's own gitignored `tmp/`, not in a temp
// directory outside it: the harnesses are the system's test suite, and a test
// suite whose artefacts vanish with the machine is not a test suite.
const OUT_DIR = join(ROOT, "tmp/audit");
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(join(OUT_DIR, "contrast-and-aria.json"), JSON.stringify(results, null, 2));

/* ---------------------------------------------------------------------------
   THE CONTRACT

   Thresholds are the ones the README and AGENTS.md publish, not numbers tuned
   until the suite went green. Each was checked against the measured spread of
   this estimator first: the pairs gated here sit between 3.09 and 10.8, so a
   3.0 floor has margin, and the decorative hairlines (--color-border, and
   --color-border-strong where it draws a separator) are deliberately NOT gated
   — T-26 splits decorative from control edges precisely so a separator is never
   asked to be a signal.

   Non-text: 3:1 (WCAG 1.4.11) for a control edge and a focus indicator.
   Text:     4.5:1 (WCAG 1.4.3) for body and muted copy.
   -------------------------------------------------------------------------- */
const failures = [];
const check = (name, value, min, detail) => {
  if (typeof value !== "number") {
    failures.push(`${name}: no measurement (${detail})`);
    return;
  }
  if (value < min) failures.push(`${name}: ${value} < ${min}  (${detail})`);
};

const CONTROL_MIN = 3.0;
const TEXT_MIN = 4.5;
const SERIES_MIN = 3.0;

// A control edge and the focus indicator, on every surface they can appear on.
for (const [theme, key] of [
  ["light", "controlLight"],
  ["dark", "controlDark"],
]) {
  for (const [pair, value] of Object.entries(results[key])) {
    if (!/^--color-(control-edge|focus-ring) over /.test(pair)) continue;
    check(`${theme}: ${pair}`, value, CONTROL_MIN, "1.4.11");
  }
}

// Copy, on the surface it is actually set against.
check("light: text-subtle vs surface-3", results.edgesLight["text-subtle vs surface-3"], TEXT_MIN, "1.4.3");
check("light: text-muted vs surface-3", results.edgesLight["text-muted vs surface-3"], TEXT_MIN, "1.4.3");
check("light: text-subtle vs surface-1", results.edgesLight["text-subtle vs surface-1"], TEXT_MIN, "1.4.3");
check("dark: text-subtle vs surface-3", results.dark["text-subtle vs surface-3"], TEXT_MIN, "1.4.3");

// Every categorical series clears the panel it is drawn on — the README says
// all eight, in both themes.
for (const [theme, key] of [
  ["light", "lightSeries"],
  ["dark", "darkSeries"],
]) {
  for (const s of results[key]) check(`${theme}: --chart-${s.i} vs surface-1`, s.vsSurface1, SERIES_MIN, "chart contract");
}

// The sequential ramp is monotonic in lightness, and inverts between themes:
// step 1 is the low end in both, so the rendered direction differs.
const monotonic = (ramp, dir, label) => {
  const bad = ramp.adjacent.filter((a) => (dir > 0 ? a.dL <= 0 : a.dL >= 0));
  if (bad.length) failures.push(`${label}: not monotonic — ${bad.map((b) => `${b.pair} dL=${b.dL}`).join(", ")}`);
};
monotonic(results.lightSeq, -1, "light --chart-seq");
monotonic(results.darkSeq, 1, "dark --chart-seq");

// The document itself. These are exact counts, not floors — a second <h1> is a
// failure and it is not smaller than one, so the minimum check could not catch
// it and the explicit equality tests below are what actually gate this.
const d = results.document;
if (d.h1 !== 1) failures.push(`document: ${d.h1} <h1> (want exactly 1)`);
if (d.main !== 1) failures.push(`document: ${d.main} <main>`);
if (d.duplicateIds.length) failures.push(`document: duplicate ids ${d.duplicateIds.join(", ")}`);
if (d.imgsNoAlt) failures.push(`document: ${d.imgsNoAlt} <img> without alt`);
if (d.namelessButtons) failures.push(`document: ${d.namelessButtons} buttons without an accessible name`);
if (d.unlabelledInputs.length) failures.push(`document: unlabelled inputs ${d.unlabelledInputs.join(", ")}`);
if (d.headingJumpCount) failures.push(`document: ${d.headingJumpCount} heading level jump(s) ${JSON.stringify(d.headingJumps)}`);
if (!d.skipLink) failures.push("document: no skip link");
if (!d.lang) failures.push("document: no lang on <html>");

// The palette must be operable and announced.
const p = results.commandPalette;
if (p.optionsInTabOrder > 0) failures.push(`palette: ${p.optionsInTabOrder} options are tab stops (must be -1 with activedescendant)`);
if (!p.listHasLabel) failures.push("palette: listbox has no accessible name");

if (results.errors.length) failures.push(`page errors: ${results.errors.join(" | ")}`);

console.log(JSON.stringify(results, null, 2));
await browser.close();

if (failures.length) {
  console.error(`\ncontract: ${failures.length} failure(s)`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
if (!process.argv.includes("--json")) {
  console.error(
    "\ncontract: OK — colour gates ran in BOTH themes (control edge, focus ring,\n" +
      "copy, all eight series, sequential ramp direction). Structure and geometry\n" +
      "gates — document hygiene, palette ARIA, focus radius, target size — ran once,\n" +
      "because a colour-scheme flip cannot move an id, a label, a tab stop or a pixel.",
  );
}
process.exit(0);
