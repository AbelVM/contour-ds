// Browser-measured audit of the Contour design system — colour-accurate.
// Run: node /tmp/kilo/audit/ds-browser2.mjs
import { chromium } from "/data/projects/libreship/node_modules/.pnpm/playwright-core@1.64.1/node_modules/playwright-core/index.mjs";
import fs from "node:fs";

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

results.lightScale = await ramp(["--color-scale-1","--color-scale-2","--color-scale-3","--color-scale-4","--color-scale-5","--color-scale-6"]);
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
results.darkScale = await ramp(["--color-scale-1","--color-scale-2","--color-scale-3","--color-scale-4","--color-scale-5","--color-scale-6"]);
results.darkSeq = await ramp(["--chart-seq-1","--chart-seq-2","--chart-seq-3","--chart-seq-4","--chart-seq-5","--chart-seq-6","--chart-seq-7"]);
results.darkSeries = await page.evaluate(() => {
  const out = [];
  for (let i = 1; i <= 8; i++) {
    const fg = window.__tokOver("--chart-" + i, "--color-surface-1");
    out.push({ i, vsSurface1: window.__ratio(fg, window.__tok("--color-surface-1")) });
  }
  return out;
});

results.errors = errors;
fs.writeFileSync("/tmp/kilo/audit/ds-browser2.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
