// Full component inventory + specimen coverage + target sizes.
import fs from "node:fs";
import path from "node:path";
// Discovered, not assumed: see ./lib/browser.mjs for the resolution order and
// why a path into another project's store was removed.
import { chromium } from "./lib/browser.mjs";
// One class pattern and one fold, shared with the inventory that publishes every
// count. This scan had its own `\.c-[a-z0-9-]+`, which stops at the first
// underscore, so it reached the same block names only because folding happened to
// agree — three readers of one vocabulary, each free to drift.
import { CLASS_RE, blockOf } from "../lib/inventory.mjs";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const CSS = path.join(ROOT, "src/css");
const files = fs.readdirSync(CSS).filter((f) => f.endsWith(".css"));
const blocks = new Set();
const blockFile = new Map();
for (const f of files) {
  const text = fs.readFileSync(path.join(CSS, f), "utf8");
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(text))) {
    const sel = m[1].replace(/\/\*[\s\S]*?\*\//g, "").trim();
    if (sel.startsWith("@")) continue;
    for (const part of sel.split(",")) {
      const p = part.trim();
      if (!p) continue;
      for (const c of p.matchAll(CLASS_RE)) {
        const name = blockOf(c[1]);
        blocks.add(name);
        if (!blockFile.has(name)) blockFile.set(name, f);
      }
    }
  }
}
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const templates = fs.readdirSync(path.join(ROOT, "templates"))
  .filter((f) => f.endsWith(".html"))
  .map((f) => fs.readFileSync(path.join(ROOT, "templates", f), "utf8"))
  .join("\n");

// Hooks are marker/utility classes that are not standalone components and are
// ledgered rather than specimened.
const HOOKS = new Set(["c-advanced"]);
const isHook = (b) => HOOKS.has(b) || b.startsWith("is-") || b.startsWith("u-");

const noSpecimen = [];
const specimenOnly = [];
const unshownBlocks = [];
for (const b of [...blocks].sort()) {
  if (isHook(b)) continue;
  const inGuide = new RegExp(`class="[^"]*\\b${b}\\b`).test(html);
  const inTpl = new RegExp(`class="[^"]*\\b${b}\\b`).test(templates);
  if (!inGuide && !inTpl) {
    noSpecimen.push(`${b}  (${blockFile.get(b)})`);
    unshownBlocks.push(b);
  } else if (!inGuide) specimenOnly.push(`${b}  (${blockFile.get(b)})`);
}
console.log("=== COMPONENT INVENTORY ===");
console.log("distinct .c-* blocks in src/css:", blocks.size);
console.log("\n--- NO SPECIMEN ANYWHERE (guide + templates): " + noSpecimen.length + " ---");
noSpecimen.forEach((s) => console.log("  " + s));
console.log("\n--- templates only, not in the guide: " + specimenOnly.length + " ---");
specimenOnly.forEach((s) => console.log("  " + s));

if (unshownBlocks.length) {
  console.error("\nspecimen-gate: " + unshownBlocks.length + " shipped block(s) have no specimen anywhere:");
  unshownBlocks.forEach((b) => console.error("  " + b));
  console.error("\nAdd a specimen or remove the block. (Hooks are ledgered, not gated.)");
  process.exit(1);
}

/* ---------- target sizes ---------- */
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto("file://" + ROOT + "/index.html", { waitUntil: "load" });
await page.waitForTimeout(800);
// Target sizes, by kind.
//
// The previous version of this pass asked every element one question — is it
// under 24px? — and counted 251 of 296 "controls" failing a 44px floor. That
// number was a property of the measurement, not of the stylesheet: 91 of the 251
// were `opacity: 0` — the copy buttons AGENTS rule 7 keeps in the layout and
// hides until a disclosure opens — and 59 were the guide's own rail links, whose
// 35.8px height clears the AA requirement they are actually under.
//
// So: invisible elements are not targets, and the floors come from the
// `--target-*` tokens rather than being hardcoded here, so the estimator and the
// contract cannot drift apart.
//
//   gate     --target-option / --target-chart / 24px (WCAG 2.5.8 AA) for
//            anything a pointer has to hit. This is the standard the system
//            claims to meet, so it is the number that fails the build.
//   advisory --target-control (44px, WCAG 2.5.5 AAA). Reported per kind, never
//            gating: several real controls are deliberately smaller (toolbar,
//            pagination, segmented tabs, filter pills), and T-30 has to decide
//            per component which floor it owns before 44 can be a law.
const targets = await page.evaluate(() => {
  const root = getComputedStyle(document.documentElement);
  const floorPx = (name) => {
    const raw = root.getPropertyValue(name).trim();
    const rem = /^([\d.]+)rem$/.exec(raw);
    if (rem) return Math.round(parseFloat(rem[1]) * parseFloat(root.fontSize));
    const num = parseFloat(raw);
    return Number.isFinite(num) ? num : null;
  };
  const AA = 24;
  const want = {
    control: floorPx("--target-control"),
    option: floorPx("--target-option"),
    chart: floorPx("--target-chart"),
    aaa: AA,
  };

  const kindOf = (el) => {
    const cls = el.className ? el.className.toString() : "";
    const role = el.getAttribute("role") || "";
    const type = el.type || "";
    // A range input is a chart control; its thumb is small by design.
    if (type === "range" || role === "slider" || /\bc-legend\b|\bc-chart\b/.test(cls)) return "chart";
    // A list option is a target, but a short one by design.
    if (role === "option" || /\bc-(menu|command|nav|toc|docs-nav)__/.test(cls)) return "option";
    // A plain anchor is reported but NOT gated. 2.5.8 exempts a target "in a
    // sentence or its size is otherwise constrained by the line-height of
    // non-target text", and that is a fact about the surrounding prose, not
    // about a bounding box: eight of the nine elements this pass first flagged
    // were 21.4px text links — one line of copy — which the standard excuses.
    // Deciding it automatically would mean guessing, so it stays advisory.
    // An anchor carrying a control role or a button class IS a discrete
    // control, and remains gated below.
    if (el.tagName === "A" && !["button", "tab", "switch", "combobox"].includes(role) && !/\bc-(btn|pill|chip|segmented|page)\b/.test(cls)) return "link";
    if (/^(BUTTON|SELECT|TEXTAREA)$/.test(el.tagName) || ["button", "tab", "switch", "combobox", "link"].includes(role)) return "control";
    if (el.tagName === "A" || (el.tagName === "INPUT" && !["hidden", "radio", "checkbox"].includes(type))) return "control";
    // The native radio and checkbox input sits behind the styled box; the box is
    // the target, so the input is not measured.
    if (type === "radio" || type === "checkbox") return "proxy";
    if (el.tabIndex >= 0) return "control";
    return "skip";
  };

  const visible = (el, cs, r) => {
    if (!r.width || !r.height) return false;
    if (cs.visibility === "hidden" || cs.display === "none") return false;
    if (parseFloat(cs.opacity) === 0) return false; // hidden but kept in flow
    if (cs.pointerEvents === "none") return false; // cannot be hit by a pointer
    // The .visually-hidden anchor: 1px box, clipped.
    if ((r.width <= 1 || r.height <= 1)) return false;
    return true;
  };

  const sel = "button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=switch], [role=option], [role=slider], [role=combobox], [tabindex]:not([tabindex='-1'])";
  const stats = {};
  // Anchors are measured and printed, never gated: see kindOf().
  const links = { n: 0, min: Infinity, belowAA: 0 };
  let measured = 0;

  for (const el of document.querySelectorAll(sel)) {
    const kind = kindOf(el);
    if (kind === "skip" || kind === "proxy") continue;
    const r = el.getBoundingClientRect();
    if (!visible(el, getComputedStyle(el), r)) continue;
    const side = Math.min(r.width, r.height);
    if (kind === "link") {
      links.n++;
      if (side < links.min) links.min = +side.toFixed(1);
      if (side < want.aaa) links.belowAA++;
      continue;
    }
    measured++;
    const s = (stats[kind] = stats[kind] || { n: 0, min: Infinity, belowAA: 0, belowAAA: 0, worst: null });
    s.n++;
    if (side < s.min) s.min = +side.toFixed(1);
    if (side < want.aaa) {
      s.belowAA++;
      if (!s.worst || side < s.worst.side) {
        s.worst = { side: +side.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), what: (el.className || el.tagName).toString().split(" ")[0], label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 24) };
      }
    }
    if (kind === "control" && want.control && side < want.control) s.belowAAA++;
  }
  return { stats, links, measured, want };
});

console.log("\n=== TARGET SIZES (guide, 1440px, visible pointer targets only) ===");
console.log("measured:", targets.measured, " floors from tokens:", JSON.stringify(targets.want));
for (const [k, s] of Object.entries(targets.stats)) {
  const aaa = k === "control" && targets.want.control ? `  under ${targets.want.control} (AAA, advisory): ${s.belowAAA}` : "";
  console.log(`  ${k.padEnd(8)} n=${String(s.n).padStart(3)}  min side ${String(s.min).padStart(5)}  under ${targets.want.aaa} (AA, gated): ${s.belowAA}${aaa}${s.worst ? "  worst: " + JSON.stringify(s.worst) : ""}`);
}

const aaFailures = Object.entries(targets.stats).filter(([, s]) => s.belowAA > 0);

console.log(
  `  link     n=${String(targets.links.n).padStart(3)}  min side ${String(targets.links.min).padStart(5)}  under ${targets.want.aaa}: ${targets.links.belowAA}  (advisory — 2.5.8 Inline exception, see kindOf())`,
);

/* ---------- the spatial contract (C-12, C-13, C-14, C-15) ----------
   Four rows, one harness: this file already boots a browser over the guide, and
   a gate nobody wires is a gate that passes by never running.

   C-12 deliberately does NOT keep its own list of spatial blocks. The family is
   whatever the guide composes inside `[data-spatial-workspace]`, read from the
   DOM, and coverage is taken from `inventory()` — the same hand that publishes
   every other count. A second scanner would disagree with the number the README
   prints, which is the failure this repository keeps having.
   The claim the rows make is that the differentiator RENDERS: a block presented
   in the guide's one composed workspace and shipped in no template is a block a
   consumer has to discover from the guide's source, not from a starter page. */
const { inventory: buildInventory } = await import("../lib/inventory.mjs");
const inv = buildInventory();

const spatial = await page.evaluate(() => {
  const blockOf = (cls) => cls.replace(/__.*$/, "").replace(/--.*$/, "");
  const workspace = document.querySelector("[data-spatial-workspace]");
  const family = new Set();
  if (workspace)
    for (const el of workspace.querySelectorAll("[class]"))
      for (const c of el.classList) if (c.startsWith("c-")) family.add(blockOf(c));

  // C-15 — the attribution band. Geometry must come from the tokens, the vendor
  // mark must keep the box it ships in, and a credit line that is invisible over
  // the canvas is not a credit line.
  const band = document.querySelector(".c-map-slot__attribution");
  const cs = band ? getComputedStyle(band) : null;
  const px = (v) => parseFloat(v) || 0;
  // A custom property is measured THROUGH a real property, never by parsing its
  // raw text: `--map-attribution-inset-block` serialises as "0.1875rem", and
  // parseFloat hands back 0.1875 — a number with no unit, compared against a
  // resolved 3px. That made two assertions fail loudly and, far worse, made the
  // two mark-box assertions pass quietly (65px could never be "less than" 4.06).
  // The probe below is the same discipline as the `ch` measurement further down.
  const tokenPx = (name, prop) => {
    const p = document.createElement("div");
    p.style.cssText = "position:absolute;visibility:hidden;display:flex";
    p.style[prop] = `var(${name})`;
    document.body.append(p);
    const v = px(getComputedStyle(p)[prop]);
    p.remove();
    return v;
  };
  const mark = band && band.querySelector(".c-map-slot__attribution-mark");
  const mcs = mark && getComputedStyle(mark);

  // C-14 — the ladder. 111.32 km per degree, divided by the decimal place.
  const ladder = [...document.querySelectorAll("[data-ladder] tbody tr")].map((tr) => {
    const dp = Number(tr.querySelector("[data-dp]").dataset.dp);
    return { dp, printed: Number(tr.querySelector("[data-m]").dataset.m), expect: 111320 / 10 ** dp };
  });
  const readouts = [...document.querySelectorAll(".c-readout[data-precision]")].map((r) => {
    const v = r.querySelector(".c-readout__value--coord");
    const order = r.querySelector(".c-readout__order");
    const ch = (() => {
      if (!v) return 0;
      const probe = document.createElement("span");
      probe.textContent = "0";
      probe.style.cssText = "position:absolute;visibility:hidden;width:1ch";
      probe.style.font = getComputedStyle(v).font;
      v.parentElement.append(probe);
      const w = probe.getBoundingClientRect().width;
      probe.remove();
      return w;
    })();
    const parts = (v?.textContent || "").split(",").map((s) => s.trim());
    return {
      declared: Number(r.dataset.precision),
      decimals: parts.map((p) => (p.split(".")[1] || "").length),
      order: order ? order.textContent.trim().toLowerCase() : null,
      minWidth: v ? px(getComputedStyle(v).minInlineSize) : 0,
      ch,
    };
  });

  // C-13 — a classified legend is a claim about the data.
  const classified = [...document.querySelectorAll(".c-legend[data-classification]")].map((l) => ({
    scheme: l.dataset.classification,
    method: (l.querySelector(".c-legend__method")?.textContent || "").trim(),
    norm: (l.querySelector(".c-legend__norm")?.textContent || "").trim(),
  }));

  return {
    family: [...family],
    band: band
      ? {
          present: true,
          insetBlock: px(cs.insetBlockEnd),
          tokenInsetBlock: tokenPx("--map-attribution-inset-block", "insetBlockEnd"),
          gap: px(cs.gap),
          tokenGap: tokenPx("--map-attribution-gap", "gap"),
          links: band.querySelectorAll("a").length,
          visible: cs.visibility !== "hidden" && cs.display !== "none" && px(cs.opacity) !== 0,
          markMinInline: mcs ? px(mcs.minInlineSize) : 0,
          tokenMarkInline: tokenPx("--map-attribution-logo-inline", "minInlineSize"),
          markMinBlock: mcs ? px(mcs.minBlockSize) : 0,
          tokenMarkBlock: tokenPx("--map-attribution-logo-block", "minBlockSize"),
          markFilter: mcs ? mcs.filter : null,
        }
      : { present: false },
    ladder,
    readouts,
    classified,
  };
});

const spatialFailures = [];

// C-12: the family, discovered, must reach a template.
if (!spatial.family.length) {
  spatialFailures.push("workspace: the guide has no [data-spatial-workspace] specimen — the family sweep measured nothing");
} else {
  const surfaces = Object.keys(inv.components.specimens[spatial.family[0]]?.surfaces || {});
  if (!surfaces.length) spatialFailures.push("workspace: inventory() reports no template surfaces, so coverage cannot be checked");
  const unshipped = spatial.family.filter((b) => !surfaces.some((s) => inv.components.specimens[b]?.surfaces?.[s]));
  console.log(`\n=== SPATIAL WORKSPACE (guide-composed family → templates) ===`);
  console.log(`  family: ${spatial.family.length} block(s) [${spatial.family.join(", ")}]`);
  for (const s of surfaces)
    console.log(`  ${s.padEnd(10)} ${spatial.family.filter((b) => inv.components.specimens[b]?.surfaces?.[s]).length}/${spatial.family.length}`);
  if (unshipped.length)
    spatialFailures.push(
      `workspace: ${unshipped.join(", ")} — composed in the guide's workspace and shipped in NO template. Either the starter page renders the family or the guide is not showing what a consumer can assemble.`,
    );
}

// C-15: the band.
const b = spatial.band;
if (!b.present) spatialFailures.push("attribution: no .c-map-slot__attribution in the guide — the band has no specimen to measure");
else {
  if (!b.visible) spatialFailures.push("attribution: the band is not visible over the map");
  if (Math.abs(b.insetBlock - b.tokenInsetBlock) > 0.6)
    spatialFailures.push(`attribution: inset-block-end is ${b.insetBlock}px, the token says ${b.tokenInsetBlock}px — geometry is hard-coded, not token-owned`);
  if (Math.abs(b.gap - b.tokenGap) > 0.6)
    spatialFailures.push(`attribution: gap is ${b.gap}px, --map-attribution-gap is ${b.tokenGap}px`);
  if (b.links < 3) spatialFailures.push(`attribution: ${b.links} text link(s) — the vendor's own help page requires at least three`);
  if (b.markMinInline < b.tokenMarkInline - 0.6)
    spatialFailures.push(`attribution: the mark slot reserves ${b.markMinInline}px wide, the shipped mark is ${b.tokenMarkInline}px`);
  if (b.markMinBlock < b.tokenMarkBlock - 0.6)
    spatialFailures.push(`attribution: the mark slot reserves ${b.markMinBlock}px tall, the shipped mark is ${b.tokenMarkBlock}px`);
  if (b.markFilter && b.markFilter !== "none")
    spatialFailures.push(`attribution: filter "${b.markFilter}" is applied to the vendor mark — its terms forbid styling it`);
}

// C-14: the ladder arithmetic and the precision contract.
if (!spatial.ladder.length) spatialFailures.push("precision: [data-ladder] has no rows — the ladder table was measured empty");
for (const row of spatial.ladder) {
  const drift = Math.abs(row.printed - row.expect) / row.expect;
  if (drift > 0.01)
    spatialFailures.push(
      `precision: ${row.dp} decimals is published as ${row.printed} m but 111.32 km / 10^${row.dp} = ${row.expect.toFixed(5)} m — the table disagrees with its own formula`,
    );
}
if (!spatial.readouts.length) spatialFailures.push("precision: no .c-readout[data-precision] anywhere — the contract has no consumer to check");
for (const r of spatial.readouts) {
  if (r.decimals.some((d) => d !== r.declared))
    spatialFailures.push(`precision: data-precision="${r.declared}" prints ${JSON.stringify(r.decimals)} decimals — the claim and the value differ`);
  if (!r.order || !/^lon,?\s*lat$/.test(r.order))
    spatialFailures.push(`precision: coordinate readout has no lon-then-lat order badge (got ${JSON.stringify(r.order)}) — RFC 7946 §3.1.1 makes the order normative`);
  const wantCh = r.declared + 5;
  if (r.ch && Math.abs(r.minWidth - wantCh * r.ch) > r.ch)
    spatialFailures.push(`precision: the value column reserves ${r.minWidth.toFixed(1)}px, the ladder says ${wantCh}ch (${(wantCh * r.ch).toFixed(1)}px)`);
}

// C-13: a classified legend states its method and its denominator.
if (!spatial.classified.length) spatialFailures.push("classification: no .c-legend[data-classification] specimen — the disclosure contract measured nothing");
for (const c of spatial.classified) {
  if (!c.method) spatialFailures.push(`classification: a ${c.scheme}-classified legend prints no .c-legend__method — the reader cannot tell what the breaks mean`);
  const classes = Number((c.method.match(/(\d+)\s*class/) || [])[1]);
  if (classes && (classes < 3 || classes > 7))
    spatialFailures.push(`classification: ${classes} classes — the system caps a classified ramp at 3–7 (its own bound; the review's GeoLinter and EU sources did not resolve)`);
  if (!c.norm) spatialFailures.push(`classification: no .c-legend__norm — a count presented as a ramp reads as density`);
  // A denominator in any spelling the system ships: the word, a slash, an
  // exponent, or a percentage.
  else if (!/(?:\bper\b|\/|²|%)/.test(c.norm))
    spatialFailures.push(`classification: the normalisation "${c.norm}" states no denominator`);
}

// --surface: per-surface coverage, the same numbers in reporting form.
if (process.argv.includes("--surface")) {
  console.log("\n=== SURFACE MODE — shipped blocks not rendered on each surface ===");
  for (const surface of surfacesOf(inv)) {
    const missing = inv.components.names.filter((n) => !inv.components.specimens[n].surfaces?.[surface]);
    console.log(`  ${surface.padEnd(14)} ${String(missing.length).padStart(3)} of ${inv.components.names.length} absent`);
  }
}

function surfacesOf(i) {
  // The key is `surfaces` — the name inventory() emits. Reading a name that does
  // not exist would return [] and the mode would print nothing while looking OK,
  // which is the exact silent-empty pass this repository keeps ending.
  const first = Object.values(i.components.specimens).find((s) => s.surfaces) || {};
  return Object.keys(first.surfaces || {});
}

await browser.close();

if (spatialFailures.length) {
  console.error(`\nspatial-contract: ${spatialFailures.length} failure(s)`);
  for (const f of spatialFailures) console.error("  ✗ " + f);
  process.exit(1);
}

if (aaFailures.length) {
  console.error("\ntarget-size: AA floor (24px) not met —");
  for (const [k, s] of aaFailures) console.error(`  ${k}: ${s.belowAA} target(s) under 24px, smallest ${s.min}px ${JSON.stringify(s.worst)}`);
  process.exit(1);
}
console.log("\ntarget-size: every visible pointer target meets the 24px AA floor. OK");
process.exit(0);
