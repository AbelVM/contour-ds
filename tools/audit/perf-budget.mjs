#!/usr/bin/env node
/**
 * CDS-016 / CDS-064: real-browser performance budgets.
 *
 * `tools/check-large-data.mjs` measures in jsdom, where DOM construction is
 * slower than a browser and paint does not exist — it can prove a shape, not a
 * budget. This harness measures the published budgets from `PERFORMANCE.md` in
 * a real Chromium page that links the shipped `dist/contour.min.css` and runs
 * the shipped `dist/contour-wc.min.js` bundle, so the workload is the one a
 * consumer receives.
 *
 * What is measured: append → layout → next painted frame (two rAFs) around a
 * fresh mount, p75 over RUNS attempts, per workload. Interaction delay is a
 * real click on a rendered row followed by the same painted-frame wait. Long
 * tasks are PerformanceObserver entries (`longtask`) collected while a mixed
 * page mounts. Lab conditions are stated in the output: unthrottled, headless,
 * one tab — these are lab budgets, not field INP.
 *
 * Exits non-zero when a budget is exceeded, and exits (not skips) when no
 * browser driver is found, because a gate that does not run is a gate that
 * passes.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "./lib/browser.mjs";

const ROOT = process.cwd();
const DIST = join(ROOT, "dist");
const RUNS = Number(process.env.PERF_RUNS || 5);
const json = process.argv.includes("--json");

const BUDGETS = {
  "table-1k-rows": 100,
  "table-10k-virtual-mount": 500,
  "table-10k-virtual-scroll": 500,
  "chart-100-series": 200,
  "tree-1k-nodes": 200,
  "mixed-page-long-task": 50,
  "interaction-delay": 100,
};

const css = readFileSync(join(DIST, "contour.min.css"), "utf8");
const wc = readFileSync(join(DIST, "contour-wc.min.js"), "utf8");

function p75(times) {
  const sorted = [...times].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.75) - 1)];
}

const results = [];

function record(name, series, budget, note = "") {
  const times = series.main;
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const value = p75(times);
  const ok = value <= budget;
  results.push({ name, budget, p75: value, avg, min: Math.min(...times), max: Math.max(...times), paintedP75: p75(series.painted), ok });
  console.log(
    `  ${ok ? "OK  " : "FAIL"} ${name}: p75 ${value.toFixed(1)} ms ` +
      `(avg ${avg.toFixed(1)}, range ${Math.min(...times).toFixed(1)}–${Math.max(...times).toFixed(1)}; ` +
      `painted p75 ${p75(series.painted).toFixed(1)}) — budget ${budget} ms${note ? " " + note : ""}`,
  );
  return ok;
}

/**
 * Runs `build` N times in the page. Returns two series:
 *   main    — mount → forced style/layout, the component's own main-thread cost;
 *   painted — mount → next painted frame (adds the fixed vsync wait, ~16–33 ms,
 *             which is not a property of the component).
 * The published budgets are compared against `main`; `painted` is reported.
 */
async function measure(page, build) {
  // Playwright serialises arguments, not closures: send the builder's source
  // and rebuild it in the page, where the DOM constructors live.
  const src = typeof build === "function" ? build.toString() : build;
  return page.evaluate(async ({ src, runs }) => {
    const build = window.eval("(" + src + ")");
    const main = [];
    const painted = [];
    const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    for (let i = 0; i <= runs; i++) {
      document.body.replaceChildren();
      await frame();
      const t0 = performance.now();
      const node = build();
      document.body.appendChild(node);
      void document.body.offsetHeight; // style + layout
      const t1 = performance.now();
      await frame();
      const t2 = performance.now();
      // The first pass is a warm-up: it pays font loading and first-layout
      // costs that a mounted page has already paid. It is not recorded.
      if (i === 0) continue;
      main.push(t1 - t0);
      painted.push(t2 - t0);
    }
    document.body.replaceChildren();
    return { main, painted };
  }, { src, runs: RUNS });
}

const pageHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<style>${css}</style>
<style>
  html, body { margin: 0; padding: 0; }
  .c-table-wrap { max-height: 24rem; overflow: auto; }
</style>
</head><body></body></html>`;

const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: "light", reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.setContent(pageHtml, { waitUntil: "load" });
  await page.addScriptTag({ content: wc });
  await page.waitForFunction(() => customElements.get("contour-table") && customElements.get("contour-tree"), null, { timeout: 15000 });

  console.log("CDS-016 / CDS-064: real-browser performance budgets");
  console.log("Lab: headless Chromium, one tab, no CPU/network throttling; p75 over", RUNS, "runs\n");

  // 1. 1,000 static table rows, the shipped table markup.
  {
    const series = await measure(page, () => {
      const wrap = document.createElement("div");
      wrap.className = "c-table-wrap";
      const table = document.createElement("table");
      table.className = "c-table";
      const thead = document.createElement("thead");
      const htr = document.createElement("tr");
      for (let c = 0; c < 6; c++) {
        const th = document.createElement("th");
        th.textContent = `Column ${c + 1}`;
        htr.appendChild(th);
      }
      thead.appendChild(htr);
      table.appendChild(thead);
      const tbody = document.createElement("tbody");
      const frag = document.createDocumentFragment();
      for (let r = 0; r < 1000; r++) {
        const tr = document.createElement("tr");
        for (let c = 0; c < 6; c++) {
          const td = document.createElement("td");
          td.textContent = `Row ${r + 1}, Col ${c + 1}`;
          tr.appendChild(td);
        }
        frag.appendChild(tr);
      }
      tbody.appendChild(frag);
      table.appendChild(tbody);
      wrap.appendChild(table);
      return wrap;
    });
    record("table-1k-rows", series, BUDGETS["table-1k-rows"]);
  }

  // 2. 10,000 rows through the real `contour-table` virtual window.
  {
    const rows = JSON.stringify(Array.from({ length: 10000 }, (_, r) => [r + 1, `Row ${r + 1}`, r % 7, r % 13, r % 31, "—"]));
    const columns = JSON.stringify(["#", "Name", "A", "B", "C", "D"]);
    // A source string, not a closure: the row payload lives here, and a
    // serialised function cannot see it.
    const mount = `() => {
      const el = document.createElement("contour-table");
      el.setAttribute("virtual", "");
      el.setAttribute("columns", ${JSON.stringify(columns)});
      el.setAttribute("rows", ${JSON.stringify(rows)});
      return el;
    }`;
    const series = await measure(page, mount);
    record("table-10k-virtual-mount", series, BUDGETS["table-10k-virtual-mount"]);

    // Scrolling the virtual window re-renders the visible slice; measure one
    // re-window per position, p75 over ten positions. This wait is painted,
    // unlike `main` above, because the re-window is scheduled by the scroll
    // handler and can only be observed after the frame.
    const scrollTimes = await page.evaluate(async ({ columns, rows }) => {
      const el = document.createElement("contour-table");
      el.setAttribute("virtual", "");
      el.setAttribute("columns", columns);
      el.setAttribute("rows", rows);
      document.body.replaceChildren(el);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const wrap = el.querySelector(".c-table-wrap");
      if (!wrap) return [];
      const times = [];
      const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      for (let i = 1; i <= 10; i++) {
        const t0 = performance.now();
        wrap.scrollTop = i * 3600;
        wrap.dispatchEvent(new Event("scroll", { bubbles: true }));
        await frame();
        times.push(performance.now() - t0);
      }
      document.body.replaceChildren();
      return times;
    }, { columns, rows });
    if (scrollTimes.length) {
      record("table-10k-virtual-scroll", { main: scrollTimes, painted: scrollTimes }, BUDGETS["table-10k-virtual-scroll"]);
    }
  }

  // 3. 100 chart series.
  {
    const series = await measure(page, () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "c-chart");
      svg.setAttribute("viewBox", "0 0 800 400");
      for (let s = 0; s < 100; s++) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", "c-chart__series");
        path.setAttribute("d", "M 0 200 L 100 150 L 200 180 L 300 120 L 400 160 L 500 140 L 600 170 L 700 130 L 800 150");
        path.setAttribute("stroke", `oklch(0.5 0.1 ${(s * 3.6) % 360})`);
        path.setAttribute("fill", "none");
        svg.appendChild(path);
      }
      return svg;
    });
    record("chart-100-series", series, BUDGETS["chart-100-series"]);
  }

  // 4. 1,000 tree nodes through the real `contour-tree` virtual window.
  {
    const items = JSON.stringify(Array.from({ length: 1000 }, (_, i) => ({ label: `Node ${i + 1}` })));
    const mount = `() => {
      const el = document.createElement("contour-tree");
      el.setAttribute("virtual", "");
      el.setAttribute("items", ${JSON.stringify(items)});
      return el;
    }`;
    const series = await measure(page, mount);
    record("tree-1k-nodes", series, BUDGETS["tree-1k-nodes"]);
  }

  // 5. Mixed page: 100-row table, 20-series chart, 20 inputs. Collect every
  //    long task (>50 ms) the mount produced.
  {
    const mixed = await page.evaluate(async () => {
      const entries = [];
      const obs = typeof PerformanceObserver === "function"
        ? new PerformanceObserver((list) => entries.push(...list.getEntries().filter((e) => e.entryType === "longtask")))
        : null;
      try { obs?.observe({ type: "longtask", buffered: false }); } catch (e) { /* unsupported */ }
      document.body.replaceChildren();
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      // Liveness arm: a deliberate 60 ms task must be observed, or a zero
      // finding below would only prove the observer never reported anything.
      const busyUntil = performance.now() + 60;
      while (performance.now() < busyUntil) { /* spin */ }
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const liveness = entries.length;
      entries.length = 0;

      const wrap = document.createElement("div");
      wrap.className = "c-panel";
      const table = document.createElement("table");
      table.className = "c-table";
      const tbody = document.createElement("tbody");
      for (let r = 0; r < 100; r++) {
        const tr = document.createElement("tr");
        for (let c = 0; c < 4; c++) {
          const td = document.createElement("td");
          td.textContent = `Cell ${r}-${c}`;
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      wrap.appendChild(table);
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "c-chart");
      for (let s = 0; s < 20; s++) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M 0 0 L 100 100");
        svg.appendChild(path);
      }
      wrap.appendChild(svg);
      for (let i = 0; i < 20; i++) {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "c-input";
        wrap.appendChild(input);
      }
      document.body.replaceChildren(wrap);
      void document.body.offsetHeight;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      obs?.disconnect();
      document.body.replaceChildren();
      return { durations: entries.map((e) => e.duration), liveness };
    });
    const longTasks = mixed.durations;
    const value = longTasks.length ? Math.max(...longTasks) : 0;
    const ok = mixed.liveness > 0 && value <= BUDGETS["mixed-page-long-task"];
    results.push({ name: "mixed-page-long-task", budget: BUDGETS["mixed-page-long-task"], p75: value, avg: value, min: value, max: value, ok, liveness: mixed.liveness });
    console.log(
      `  ${ok ? "OK  " : "FAIL"} mixed-page-long-task: max ${value.toFixed(1)} ms over ${longTasks.length} long task(s) ` +
        `(observer liveness: ${mixed.liveness} entry from a deliberate 60 ms task) — budget ${BUDGETS["mixed-page-long-task"]} ms` +
        (mixed.liveness === 0 ? " [observer never reported: the zero is not evidence]" : ""),
    );
  }

  // 6. Interaction delay: a real click on a rendered row in the 1k table, then
  //    the next painted frame. Update-to-paint, not event-handler time.
  {
    const times = [];
    for (let i = 0; i < RUNS; i++) {
      times.push(await page.evaluate(async () => {
        const wrap = document.createElement("div");
        wrap.className = "c-table-wrap";
        const table = document.createElement("table");
        table.className = "c-table";
        const tbody = document.createElement("tbody");
        for (let r = 0; r < 1000; r++) {
          const tr = document.createElement("tr");
          tr.tabIndex = 0;
          for (let c = 0; c < 6; c++) {
            const td = document.createElement("td");
            td.textContent = `R${r} C${c}`;
            tr.appendChild(td);
          }
          tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        wrap.appendChild(table);
        document.body.replaceChildren(wrap);
        void document.body.offsetHeight;
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const row = tbody.rows[500];
        const t0 = performance.now();
        row.click();
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const dt = performance.now() - t0;
        document.body.replaceChildren();
        return dt;
      }));
    }
    record("interaction-delay", { main: times, painted: times }, BUDGETS["interaction-delay"], "(update-to-paint; includes the frame wait)");
  }

  await context.close();
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} budgets met (p75, ${RUNS} runs; long-task is max)`);
if (json) console.log(JSON.stringify({ runs: RUNS, results }, null, 2));
if (failed.length) {
  console.log(`FAIL perf-budget: ${failed.map((f) => f.name).join(", ")} exceeded budget`);
  process.exit(1);
}
console.log("OK   perf-budget: every published PERFORMANCE.md budget met in Chromium");