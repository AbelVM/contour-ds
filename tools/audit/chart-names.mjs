// Chart accessible names, measured in the accessibility tree (C-25).
//
// Why a browser gate and not a grep: the claim is that a blind reader gets the
// data. A static scan can prove an attribute is present, which is how the repo
// got two charts whose aria-label was the word "Chart" -- syntactically a name,
// informationally nothing. So this asks Chromium what the node actually carries.
//
// Why the data is a SIBLING of the named image and never its child, measured by
// tmp probes on 2026-10-23 and encoded here as a rule:
//   - a table nested inside role="img" left the AX node with NO description, even
//     though Chromium still listed the table;
//   - the same data as an aria-describedby sibling surfaced a description;
//   - an aria-hidden subtree correctly surfaced nothing, which is what proves
//     the readout can see hiding at all, and so what makes the other two
//     readings worth anything.
// Chromium exposing a nested table is not a thing to build on: ARIA defines img
// as a leaf role, so another engine may prune it. The sibling works either way.
//
// Self-discipline: it asserts the population it scanned and fails on an empty
// sweep. A gate that finds no charts must not exit 0.
//
// Run: node tools/audit/chart-names.mjs   (exit 1 on failure)
import { chromium } from "./lib/browser.mjs";
import { existsSync } from "node:fs";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
// Every page the repository ships. A name fixed in the guide but absent from the
// starter a consumer copies is the half-fix this row was written about.
const PAGES = ["index.html", "templates/landing.html", "templates/dashboard.html", "templates/documentation.html"];
// A name that identifies nothing. "Chart" is the value the guide shipped with.
const GENERIC = new Set(["", "chart", "graph", "image", "img", "plot", "figure", "data", "visualization"]);

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const failures = [];
let charts = 0;
let chartsWithDescription = 0;

for (const rel of PAGES) {
  if (!existsSync(`${ROOT}/${rel}`)) {
    failures.push(`${rel}: listed as a shipped page, but it is not on disk — the gate cannot see it`);
    continue;
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const cdp = await page.context().newCDPSession(page);
  await page.goto(`file://${ROOT}/${rel}`, { waitUntil: "load" });
  await page.waitForTimeout(650);
  await cdp.send("Accessibility.enable");

  // The DOM read is page-wide and cheap; the AX read is per-chart. A chart
  // 65,000 px down the page sits behind a `content-visibility: auto` panel, and
  // Chromium prunes offscreen cv subtrees from the accessibility tree — so a
  // single tree read at load time reports the authored aria-label as a
  // different name, or reports nothing at all, for a chart a reader reaches by
  // navigating to it. Scrolling the chart into view first is what a reader
  // does, and it is what makes the measurement true.
  const dom = await page.evaluate(() =>
    [...document.querySelectorAll(".c-chart")].map((c, i) => {
      const db = c.getAttribute("aria-describedby");
      const target = db ? document.getElementById(db) : null;
      return {
        i,
        role: c.getAttribute("role"),
        label: (c.getAttribute("aria-label") || "").trim(),
        byId: (c.getAttribute("aria-labelledby") || "").trim(),
        db,
        exists: !!target,
        nested: !!(target && c.contains(target)),
        text: target ? target.textContent.replace(/\s+/g, " ").trim() : "",
        marks: c.querySelectorAll(".c-chart__line, .c-chart__bar, .c-chart__point, .c-chart__band").length,
      };
    }),
  );
  charts += dom.length;
  for (const d of dom) {
    const at = `${rel} chart ${d.i + 1}`;
    const problems = [];
    if (d.role !== "img") problems.push(`role is ${d.role ?? "absent"}, not img`);
    const named = !GENERIC.has(d.label.toLowerCase()) || (!!d.byId && !GENERIC.has(d.byId.toLowerCase()));
    if (!named) problems.push(d.label ? `generic name "${d.label}"` : "no accessible name");
    // Every mark needs describing: a chart with no data alternative is the
    // defect, and one with marks and no describedby is exactly that.
    if (d.marks && !d.db) problems.push(`${d.marks} data mark(s) and no aria-describedby`);
    if (d.db && !d.exists) problems.push(`aria-describedby points at #${d.db}, which is not in the document`);
    if (d.nested) problems.push("data description is a DESCENDANT of the named image — a leaf role may prune it");
    if (d.exists && d.text.length < 20) problems.push(`description is ${d.text.length} char(s); too short to carry the data`);

    // Scroll this chart into view, then read the accessibility tree: a chart
    // behind content-visibility is not in the tree at all, and a chart whose
    // node is present but offscreen can carry a stale name. Both are real
    // states a reader can reach, so measure the one the reader reaches.
    await page.evaluate((i) => {
      const c = document.querySelectorAll(".c-chart")[i];
      if (c) { c.scrollIntoView({ block: "center" }); c.getBoundingClientRect(); }
    }, d.i);
    await page.waitForTimeout(50);
    const { nodes } = await cdp.send("Accessibility.getFullAXTree");
    const images = nodes.filter((n) => n.role?.value === "image");

    // The decisive check: not that the attributes are set, but that the node an
    // assistive technology reads actually carries both halves.
    const ax = images.find((n) => (n.name?.value || "").trim() === (d.label || d.byId) && d.label);
    if (d.label && !ax) problems.push(`no AX image node named "${d.label}"`);
    else if (ax?.ignored) problems.push("AX node is ignored");
    else if (ax && !ax.description?.value) problems.push("AX description is empty — the data did not surface");
    else if (ax?.description?.value) chartsWithDescription++;

    if (problems.length) failures.push(`${at}: ${problems.join("; ")}`);
  }
}
await browser.close();

if (!charts) {
  console.error("chart-names: FAIL — no .c-chart found on any shipped page, so this gate measured nothing");
  process.exit(1);
}
// The templates must be covered by name, or "all pages" is a claim about a loop
// body that happened to contain zero interesting members.
if (!PAGES.some((p) => p.startsWith("templates/"))) {
  console.error("chart-names: FAIL — the page list covers no template, so the starter files are ungated");
  process.exit(1);
}

if (failures.length) {
  console.error(`chart-names: FAIL — ${charts} chart(s) scanned`);
  failures.forEach((f) => console.error("  " + f));
  process.exit(1);
}
console.log(
  `chart-names: OK — ${charts} chart(s) across ${PAGES.length} shipped page(s); ` +
    `${chartsWithDescription} carry a name AND a surfaced description in the accessibility tree.`,
);
