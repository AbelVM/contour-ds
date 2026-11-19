// The web-components contract (M-WC).
//
// Why this file exists: `src/js/contour-wc.js` shipped for two commits defining ZERO
// custom elements. A self-referential base class (`class ContourBase extends
// ContourBase`) is valid JavaScript syntax and a runtime ReferenceError, so
// `node --check` -- the only script gate in every lane -- passed it. And the file
// is loaded by nothing, so no page ever asked whether it worked.
//
// It reads the ARTIFACT, not the source: `dist/contour-wc.js` and
// `dist/contour-wc.min.js`, the two files a consumer can actually install. A rule
// that only inspects `src/` would certify a corrupted minified twin, which is the
// hole `check-dist` still has for this bundle (it parses `contour.min.js` and
// never looked at this one).
//
// The element list comes from the bundle itself, as `window.ContourElements`, and
// never from a scrape of quoted strings in the text. A scrape counts whatever
// shape the prose happens to be in: while every registration was spelled out as a
// string literal the scrape agreed with the browser, and the moment a registration
// became table-driven the same scrape reported a fraction of the registry as the
// whole of it -- and this gate called that a pass. Nothing here guesses at a
// count; what is checked is what `customElements` was actually handed.
//
// Nine claims, each of which failed against the artifact before it was written:
//
//   1. it LOADS. Every name in `window.ContourElements` is asked of
//      `customElements`, in both artifacts, and the two registries must agree.
//   2. the SCAFFOLDING is alive. A name claimed by a complex component must
//      resolve to that component, not to the class-only factory. The test does
//      not know the class names -- a minifier may keep or drop them -- it knows
//      the factory is `class extends ContourBase` with no name of its own, so
//      `Function.name` is "". That survives minification.
//   3. it RENDERS. Every case in RENDER_CONTRACT is mounted and must produce the
//      node its attributes promise.
//   4. it RE-RENDERS. Changing a host attribute must change the generated DOM and
//      must not lose the author's own content, and must not recurse: a render
//      that writes an attribute it also observes overflows the stack.
//   5. the OBSERVED list is honest. An attribute the code reads must be observed
//      (or it can never update), and an attribute the code writes to its own host
//      must NOT be (or the write re-enters the render that performed it). A read
//      through a shared list (`MODS.forEach(attr => ...)`) is a read: the
//      literal-argument regex cannot see one, which is how `color` stayed
//      unobserved under a pass that printed both numbers.
//   6. nothing it declares LEAKS. A declaration after the file's own closer sits
//      in the page's global lexical scope, and a consumer script that uses that
//      name dies on "Identifier has already been declared". Measured in a browser
//      against a control page that never loaded the bundle, so a name the platform
//      already owns cannot be mistaken for a leak, and so an indented declaration
//      is not read as a local one.
//   7. every registration attempt SUCCEEDED. A duplicate `customElements.define`
//      throws, and a `catch {}` around it turns a dead component into a silent
//      one, so the throw is counted before it can be swallowed.
//   8. a Shadow wrapper is STYLED. A wrapper that adopts the document's sheets
//      must adopt all of them and not one rule, and must share a single parsed
//      stylesheet across instances rather than re-parsing the sheet per element.
//   9. a generated table is wrapped. A rendered `table.c-table` needs its
//      `.c-table-wrap` scroller, which is the reflow contract's own rule; an
//      inline host carrying the class satisfies the selector and breaks the scroll.
//
// Run: node tools/audit/wc-contract.mjs          exit 1 on failure
import { chromium } from "./lib/browser.mjs";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const ARTIFACTS = {
  unminified: "dist/contour-wc.js",
  minified: "dist/contour-wc.min.js",
};

const errors = [];
const fail = (m) => errors.push(m);

// -- read the artifact -------------------------------------------------------
const bytes = {};
for (const [label, rel] of Object.entries(ARTIFACTS)) {
  const p = join(ROOT, rel);
  if (!existsSync(p)) {
    fail(`${rel} is missing — run \`node tools/build.mjs\`; this gate reads the shipped bytes, not src/`);
    continue;
  }
  bytes[label] = readFileSync(p, "utf-8");
}
if (Object.keys(bytes).length !== 2) {
  console.error("wc-contract: " + errors.join("\n"));
  process.exit(1);
}

// The consumer's resolution map, read as an artifact: a `.d.ts` that no `exports`
// condition points at is typed for nobody, and the claim below would otherwise
// pass while the package stayed untyped.
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

// Candidate names for the leak test: every identifier the artifact declares. The
// browser decides which of them are actually reachable afterwards; the point of
// listing them from the artifact is that a minified rename still names itself.
const declaredNames = (src) =>
  [...new Set([...src.matchAll(/(?:const|let|var|class|function)\s+([A-Za-z0-9_$]+)/g)].map((m) => m[1]))];
const CANDIDATES = [...new Set([...declaredNames(bytes.unminified), ...declaredNames(bytes.minified)])];

// A name asked of define() twice is a name registered once: the guard in define()
// means the second request is skipped, not thrown, so the duplicate leaves no
// runtime trace at all -- no error, no missing element, just a table entry that
// does nothing. It can only be read off the tables.
//
// The namespaces are checked apart, because a block legitimately appears in both
// (`contour-chip` in the light DOM and `contour-shadow-chip` is the same block
// twice on purpose), and a CLASS_ONLY name that also has an explicit component is
// the documented fallback, not a duplicate. What IS a duplicate: the same element
// name twice inside one namespace, or one element claimed by both shadow sources
// -- which is exactly the defect that made 32 registrations dead on arrival.
const duplicateRegistrations = (src) => {
  const groups = {};
  const add = (group, name) => (groups[group] || (groups[group] = [])).push(name);
  for (const m of src.matchAll(/define\("(contour-[a-z0-9-]+)"/g)) add("explicit", m[1]);
  const classOnly = /const CLASS_ONLY = \[([\s\S]*?)\n {2}\];/.exec(src);
  if (classOnly)
    for (const m of classOnly[1].matchAll(/"([a-z0-9-]+)"/g)) add("class-only", "contour-" + m[1]);
  const slots = /const SHADOW_SLOTS = \{([\s\S]*?)\n {2}\};/.exec(src);
  if (slots)
    for (const m of slots[1].matchAll(/"([a-z0-9-]+)"/g)) add("shadow-slots", "contour-shadow-" + m[1]);
  for (const m of src.matchAll(/\bshadow\("(contour-shadow-[a-z0-9-]+)"/g)) add("shadow-markup", m[1]);
  const dupes = [];
  for (const [group, names] of Object.entries(groups)) {
    const seen = new Set();
    for (const n of names) { if (seen.has(n)) dupes.push(`${group}: ${n}`); seen.add(n); }
  }
  const acrossShadow = new Set();
  for (const n of [...(groups["shadow-slots"] || []), ...(groups["shadow-markup"] || [])]) {
    if (acrossShadow.has(n)) dupes.push(`shadow (slots and markup): ${n}`);
    acrossShadow.add(n);
  }
  return { dupes: [...new Set(dupes)], counts: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])) };
};
const shapeReports = {};
for (const [label, rel] of Object.entries(ARTIFACTS)) {
  const r = duplicateRegistrations(bytes[label]);
  shapeReports[label] = r.counts;
  if (r.dupes.length)
    fail(`${rel} asks for the same element twice: ${r.dupes.slice(0, 8).join(", ")}${r.dupes.length > 8 ? ` (of ${r.dupes.length})` : ""} — define() skips the second request silently, so a duplicate here is a table entry that has never done anything`);
}
if (!shapeReports.unminified || !(shapeReports.unminified["class-only"] > 0) || !(shapeReports.unminified["shadow-slots"] > 0))
  fail(`the registration tables were not read from the unminified artifact: ${JSON.stringify(shapeReports.unminified)} — a duplicate check that matched nothing is a pass over an empty sweep, so update this gate when the tables move`);
console.log(`wc-contract: registration tables read: ${JSON.stringify(shapeReports.unminified)} (unminified) / ${JSON.stringify(shapeReports.minified)} (minified, one line, so only the call sites survive)`);

// A name is "scaffolded" when some `define("<name>", X)` in the artifact points at
// a class the file also declares by name. These are the ones that must NOT be the
// class-only factory.
const scaffolded = new Set(
  [...bytes.unminified.matchAll(/define\("(contour-[a-z0-9-]+)",\s*([A-Za-z0-9_]+)\)/g)]
    .filter((m) => /class\s+\2\b/.test(bytes.unminified))
    .map((m) => m[1])
);

// The class-only table, in whatever shape the file currently keeps it: a list of
// block names or a map of name to classes. Its members must never include a name
// a real component already claimed -- the registration race used to make that
// intersection silently replace the scaffolding with a bare class.
const classOnlyNames = new Set();
for (const re of [/const CLASS_ONLY = \[([\s\S]*?)\n {2}\];/, /const simpleMap = \{([\s\S]*?)\n {2}\};/]) {
  const b = re.exec(bytes.unminified);
  if (!b) continue;
  for (const m of b[1].matchAll(/"([a-z0-9-]+)"/g))
    classOnlyNames.add(m[1].startsWith("contour-") ? m[1] : "contour-" + m[1]);
}
if (!classOnlyNames.size)
  fail("neither `CLASS_ONLY` nor `simpleMap` resolved in the artifact — the class-only table moved; update this gate rather than pass on an empty sweep");
const overlapped = [...scaffolded].filter((n) => classOnlyNames.has(n));

// -- 5. the observed-attribute contract, read off the artifact ---------------
const observedBlock = /const OBSERVED = \[([\s\S]*?)\];/.exec(bytes.unminified);
if (!observedBlock) {
  fail("no `const OBSERVED = [...]` in the artifact — the render contract has no attribute list to check");
} else {
  const observed = new Set([...observedBlock[1].matchAll(/"([a-z-]+)"/g)].map((m) => m[1]));
  const read = new Set([
    ...[...bytes.unminified.matchAll(/(?:this|host)\.(?:getAttribute|hasAttribute)\("([a-z-]+)"\)/g)].map((m) => m[1]),
    ...[...bytes.unminified.matchAll(/(?:remoteData|loadRemote)\([^)]*,\s*"([a-z-]+)"\)/g)].map((m) => m[1]),
    ...[...bytes.unminified.matchAll(/(?:remoteData|loadRemote)\([^)]*,\s*\[([^\]]*)\]\)/g)].flatMap((m) => [...m[1].matchAll(/"([a-z-]+)"/g)].map((x) => x[1])),
  ]);
  const written = new Set([...bytes.unminified.matchAll(/this\.setAttribute\("([a-z-]+)"/g)].map((m) => m[1]));

  // Reads through a shared list. `MODS` is the modifier contract both layers use;
  // an entry of it is read exactly as surely as a literal argument is.
  const modsBlock = /const MODS = \[([\s\S]*?)\];/.exec(bytes.unminified);
  const mods = modsBlock ? [...modsBlock[1].matchAll(/"([a-z-]+)"/g)].map((m) => m[1]) : [];
  const modsUnobserved = mods.filter((a) => !observed.has(a));
  if (modsUnobserved.length)
    fail(`reads the modifier list ${modsUnobserved.join(", ")} but does not observe it — setting that attribute after the element upgrades cannot re-render, and the literal-argument regex above is why this used to pass`);
  if (!modsBlock)
    fail("no `const MODS = [...]` in the artifact — the modifier list both layers read is gone, so a drift between them is once again invisible");

  const unobservedRead = [...read].filter((a) => !observed.has(a) && !written.has(a) && !mods.includes(a)).sort();
  const reentrant = [...written].filter((a) => observed.has(a)).sort();
  if (unobservedRead.length)
    fail(`reads but never observes ${unobservedRead.join(", ")} — a host changing that attribute cannot re-render`);
  if (reentrant.length)
    fail(`observes AND writes to itself ${reentrant.join(", ")} — the write fires the callback that performs the render, which re-enters it`);
  const dead = [...observed].filter((a) => !read.has(a) && !written.has(a) && !mods.includes(a)).sort();
  if (dead.length)
    fail(`observes ${dead.join(", ")} which no component reads, writes, or takes as a modifier — dead weight on every element's attribute list`);
  console.log(
    `wc-contract: attribute contract compared ${observed.size} observed against ${read.size} read by name, ${mods.length} read through MODS, and ${written.size} host-written`
  );
}

// ---- 6. the exported-part contract (BY-25) --------------------------------
// The shadow wrappers ship `part="..."` tokens on their template nodes — the
// consumer styling seam (`contour-shadow-x::part(title)`). §4 refuses closing
// BY-25 on "wrappers are single-level": that is a fact about today, not a
// contract. The contract enforced here, off the artifact, is the row's own:
// refuse an exported token no rule consumes. A token is consumed when the
// shipped CSS can reach it — a `::part(name)` selector, or a class on the
// same node that a shipped rule styles (the light layer derives parts from
// exactly those classes, so a shadow part with no matching rule is the same
// defect in the other direction). The sweep must prove it compared: a bundle
// with no part tokens at all cannot certify an empty export surface.
{
  const bundle = bytes.unminified;
  const rawCss = readFileSync(join(ROOT, "dist/contour.css"), "utf-8");
  // Flatten nesting so classes that only appear as `&__foo` in source are
  // expanded to their full form before the styled-class sweep (PF1).
  const { flattenCss } = await import("../lib/minify.mjs");
  const css = flattenCss(rawCss);
  const partRules = new Set([...css.matchAll(/::part\(\s*([a-z0-9-_]+)\s*\)/g)].map((m) => m[1]));
  // Element classes follow `c-<block>__<element>`; the underscore is part of
  // the name, so a class regex must not stop at it the way the earlier
  // [a-z0-9-] capture did.
  const styledClasses = new Set([...css.matchAll(/\.([a-z][a-z0-9_-]*)/g)].map((m) => m[1]));
  // Template literals use `part="x"`, generated strings use part=\"x\" — the
  // extractor must see both or it undercounts the surface it certifies.
  const tagRe = /<([a-z][a-z0-9-]*)((?:[^>]*?part=(?:\\)?"[a-z0-9-]+(?:\s+[a-z0-9-]+)*"(?:\\)?[^>]*?))>/gu;
  const nodes = [];
  for (const m of bundle.matchAll(tagRe)) {
    const attrs = m[2];
    const parts = [...attrs.matchAll(/part=(?:\\)?"([a-z0-9-]+(?:\s+[a-z0-9-]+)*)"/g)].flatMap((x) => x[1].split(/\s+/));
    if (!parts.length) continue;
    const cls = (attrs.match(/class=(?:\\)?"([^"]*)"/) || [])[1] || "";
    const styleable = cls.split(/\s+/).some((c) => styledClasses.has(c));
    nodes.push({ tag: m[1], cls: cls.trim(), parts, styleable });
  }
  const exportedCount = nodes.reduce((n, e) => n + e.parts.length, 0);
  const unconsumed = nodes.filter((e) => !e.styleable && !e.parts.some((p) => partRules.has(p)));
  const names = [...new Set(unconsumed.flatMap((e) => e.parts))].sort();
  if (nodes.length === 0)
    fail("the artifact exposes no part= tokens — a sweep that compared nothing cannot certify the exported-part contract");
  if (unconsumed.length)
    fail(`${unconsumed.length} of ${nodes.length} shadow nodes export ${exportedCount} part tokens, and ${unconsumed.length} ride nodes no rule can reach (${names.join(", ")}) — give the node a class a shipped rule styles, add a ::part() rule, or stop exporting the token; an export nothing can style is dead API surface`);
  else
    console.log(
      `wc-contract: exported-part contract compared ${exportedCount} part tokens across ${nodes.length} wrapper nodes against ${partRules.size} ::part() rules and ${styledClasses.size} styled classes — every export is consumed`
    );
}

// -- serve both artifacts same-origin ---------------------------------------
// Same-origin because an element defined in a `file:` document is a different
// security context, and a load error there is not the load error a consumer gets.
const RENDER_CONTRACT = [
  // name, attributes, a selector that must exist inside the host after render
  ["contour-menu", { items: '["Cut","Copy","---","Paste"]' }, ".c-menu__item"],
  ["contour-card", { title: "Layer" }, ".c-card__title"],
  ["contour-table", { columns: '["A","B"]', rows: '[["1","2"]]' }, "tbody td"],
  ["contour-tabs", { tabs: '["One","Two"]' }, ".c-tabs__tab"],
  ["contour-breadcrumb", { items: '[{"label":"Home","href":"/"},{"label":"Now"}]' }, "a"],
  ["contour-kpi", { value: "42", label: "Rows", delta: "3", direction: "up" }, ".c-kpi__value"],
  ["contour-dialog", { title: "Move layer" }, ".c-dialog__title"],
  ["contour-meter", { value: "0.72", label: "Confidence" }, ".c-meter__core"],
  ["contour-field", { label: "Search", placeholder: "q" }, "label"],
  ["contour-form", { title: "Route form", "submit-label": "Save" }, ".c-form__title"],
  ["contour-alert", { title: "Heads up", body: "text", variant: "warning" }, ".c-alert__title"],
  ["contour-pagination", { pages: "5", current: "2" }, ".c-pagination__link"],
  ["contour-accordion", { items: '[{"q":"A","a":"B"}]' }, ".c-disclosure"],
  ["contour-readout", { rows: '[{"key":"K","value":"V"}]' }, ".c-readout__row"],
  ["contour-steps", { steps: '["One","Two"]' }, ".c-steps__item"],
  ["contour-diff", { before: "Before", after: "After" }, ".c-diff__line"],
  ["contour-do-dont", { do: "Do it", dont: "Don't" }, ".c-do-dont__item"],
  ["contour-callout", { title: "Heads up", variant: "note" }, ".c-callout__title"],
  ["contour-empty", { title: "No data", body: "Nothing", action: "Retry" }, ".c-empty__title"],
  ["contour-faq", { question: "What?", answer: "A DS." }, ".c-faq__question"],
  ["contour-toast", { message: "Saved", variant: "success" }, ".c-toast"],
  ["contour-code", { title: "Code", copyable: "" }, ".c-code__title"],
  ["contour-progress", { value: "0.6", label: "Loading" }, ".c-progress__bar"],
  ["contour-combobox", { options: '["Alpha","Beta"]', placeholder: "Search" }, ".c-combobox__input"],
  ["contour-tree", { items: '[{"label":"Root","children":[{"label":"Child"}]}]' }, ".c-tree__toggle"],
  ["contour-segmented", {}, ".c-segmented"],
  ["contour-heatmap", { cells: "6", legend: "" }, ".c-heatmap__cell"],
  // The chart's data attribute is `series`, not `data`. A chart fed `data=`
  // renders its empty branch and still mounts, so the render-all arm passed
  // while every chart in the guide's landing section painted "No data". The
  // selector is the mark, not the host: a chart that renders no bar has not
  // rendered, whatever its host looks like.
  ["contour-chart", { series: '[{"label":"A","type":"bar","values":[1,2,3]}]', axis: "Value" }, ".c-chart__bar"],
  ["contour-compare", { yes: "Yes", no: "No", text: "Compare" }, ".c-compare__yes"],
  ["contour-timeline", { items: '[{"time":"1","title":"T","text":"x"}]' }, ".c-timeline__item"],
  ["contour-kpi", { value: "42", label: "Rows" }, ".c-kpi__value"],
  ["contour-meter", { value: "0.72", label: "Confidence" }, ".c-meter__core"],
  ["contour-threshold", { value: "0.5", norm: "0.8", label: "Threshold" }, ".c-threshold__fill"],
  ["contour-coordinate", { value: "12,34" }, ".c-coordinate"],
  ["contour-delta", { value: "+12%", direction: "up" }, ".c-delta"],
  ["contour-stat", { value: "42", label: "Rows" }, ".c-stat__value"],
  ["contour-badge", { variant: "primary" }, ".c-badge"],
  ["contour-chip", {}, ".c-chip"],
  ["contour-avatar", { name: "Ada Lovelace" }, ".c-avatar"],
  ["contour-dot", { variant: "success", live: "" }, ".c-dot"],
  ["contour-pill", { label: "New", live: "" }, ".c-pill"],
  ["contour-kbd", { key: "⌘K" }, ".c-kbd"],
  ["contour-spinner", {}, ".c-spinner"],
  ["contour-tag", { label: "Tag", removable: "" }, ".c-tag"],
  ["contour-filter-pill", { key: "Status", value: "Active", removable: "" }, ".c-filter-pill"],
];

// The page mounts nothing: the harness creates elements after load, because the
// names worth mounting are only known once the bundle has published its registry.
// The control page loads the same document without the bundle, which is how a
// name the platform already owns is kept from being reported as a leak. The
// stylesheet is linked for real: without it the page has no rules, every adopted
// sheet counts zero, and every class the bundle emits looks undefined -- a gate
// that reports 174 phantom classes because it forgot to load the CSS is measuring
// its own harness, not the artifact.
const shell = (script) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>wc contract</title>
<link rel="stylesheet" href="/contour.css"></head>
<body>
<script>
  // Count every registration attempt, so a define() that throws inside a
  // try/catch is a failure here rather than a component that never existed.
  window.__attempted = []; window.__rejected = [];
  (function () {
    const reg = window.customElements, orig = reg.define.bind(reg);
    reg.define = function (name, cls, opts) {
      window.__attempted.push(name);
      try { orig(name, cls, opts); }
      catch (err) { window.__rejected.push(name + " :: " + err.name); throw err; }
    };
  })();
<\/script>
${script ? `<script src="${script}"></script>` : ""}
</body></html>`;

// ---- placement parity -------------------------------------------------------
//
// Every arm above loads the bundle at the end of body, so every measurement this
// gate makes is taken at the DEFERRED moment: the parser has finished, the
// author's children exist. A consumer who puts the classic bundle in `<head>`
// gets the other moment: the parser upgrades the custom element while it is still
// inside it, so a wire-time pass over authored children sees an empty host. A
// component that behaves differently between the two works in this gate and in
// the guide, and does not work in the page. Measured once by hand (tmp/r5/place.mjs):
// the segmented group came up with 0 option classes, no pressed state and 2 tab
// stops in `head` where the same bytes gave 2, 2 and 1 deferred.
//
// The fixture mixes both shapes on purpose: authored children (the hazard) and
// attribute-generated children (the safe path that must stay identical).
const PLACEMENT_MARKUP = `
<contour-segmented><button type="button" data-value="a">A</button><button type="button" data-value="b">B</button></contour-segmented>
<contour-tabs tabs='["One","Two"]'></contour-tabs>
<contour-menu items='["Cut","Copy","Paste"]'></contour-menu>
<contour-tree items='[{"label":"Root","children":[{"label":"Child"}]}]'></contour-tree>
<contour-combobox options='["Alpha","Beta"]' label="Pick a city"></contour-combobox>`;
// How many hosts the fixture writes. Only `contour-segmented` takes the author's
// children — tabs, menu, tree and combobox all generate theirs from an attribute —
// so this fixture holds exactly one element of the hazard class and four of the
// safe class, which must not move either.
const PLACEMENT_HOSTS = 5;
const placementShell = (where) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>placement</title>
<link rel="stylesheet" href="/contour.css">
${where === "head" ? '<script src="/unmin.js"></script>' : '<script defer src="/unmin.js"></script>'}
</head>
<body>${PLACEMENT_MARKUP}</body></html>`;
// What a host ended up as, independent of when the script ran: the shape the
// reader gets, not the order that produced it.
const PLACEMENT_READ = () =>
  [...document.body.children].filter((n) => n.tagName.startsWith("CONTOUR-")).map((host) => {
    const nodes = [...host.querySelectorAll("*")];
    return {
      tag: host.tagName.toLowerCase(),
      hostRole: host.getAttribute("role") || "",
      descendants: nodes.length,
      classes: [...new Set(nodes.flatMap((n) => [...n.classList]))].sort().join(","),
      pressed: nodes.filter((n) => n.hasAttribute("aria-pressed")).map((n) => n.getAttribute("aria-pressed")).join(","),
      selected: nodes.filter((n) => n.hasAttribute("aria-selected")).length,
      treeitems: nodes.filter((n) => n.getAttribute("role") === "treeitem").length,
      stops: nodes.filter((n) => n.getAttribute("tabindex") === "0").length,
      negative: nodes.filter((n) => n.getAttribute("tabindex") === "-1").length,
    };
  });

// The self-test page for the leak probe. A global lexical binding is created by
// a classic script, not by `eval` -- a declaration inside an eval is scoped to
// that call -- so the canary is two script files that declare the same name. If
// the probe cannot see the first one, claim 6 is blind; if the second one is not
// fatal to its own script, the consumer failure this claim exists for is fiction.
const CANARY = "__wcContractCanary";

// State-contract fixtures (BY-11). The retry arm needs a route that fails once
// and then succeeds: rows can only appear after the retry click if the click
// really asked the network again.
let flakyHits = 0;
// BY-43: a counting route — every request returns the hit count, so a cached
// mount is proven by a count that did not move and a no-cache mount by one
// that did. One payload key keeps the assertion readable.
let countHits = 0;
const FX_ROWS = JSON.stringify([{ key: "A", value: "1" }, { key: "B", value: "2" }]);

const server = createServer((req, res) => {
  if (req.url === "/unmin.js") res.writeHead(200, { "content-type": "text/javascript" }).end(bytes.unminified);
  else if (req.url === "/min.js") res.writeHead(200, { "content-type": "text/javascript" }).end(bytes.minified);
  // The ESM bundle: page-side consumers import from it (watchViewport, BY-42),
  // so the arm that tests exports must read this artifact, not the classic IIFE
  // where exports were stripped.
  else if (req.url === "/wc-esm.js") res.writeHead(200, { "content-type": "text/javascript" }).end(readFileSync(join(ROOT, "dist/contour-wc.esm.js"), "utf-8"));
  else if (req.url === "/contour.css") res.writeHead(200, { "content-type": "text/css" }).end(readFileSync(join(ROOT, "dist/contour.css"), "utf-8"));
  else if (req.url === "/unmin.html") res.writeHead(200, { "content-type": "text/html" }).end(shell("/unmin.js"));
  else if (req.url === "/min.html") res.writeHead(200, { "content-type": "text/html" }).end(shell("/min.js"));
  else if (req.url === "/control.html") res.writeHead(200, { "content-type": "text/html" }).end(shell(""));
  else if (req.url === "/placement-head.html") res.writeHead(200, { "content-type": "text/html" }).end(placementShell("head"));
  else if (req.url === "/placement-defer.html") res.writeHead(200, { "content-type": "text/html" }).end(placementShell("defer"));
  else if (req.url === "/canary1.js") res.writeHead(200, { "content-type": "text/javascript" }).end(`let ${CANARY} = 1;`);
  else if (req.url === "/canary2.js") res.writeHead(200, { "content-type": "text/javascript" }).end(`let ${CANARY} = 2; window.__dupRan = true;`);
  else if (req.url === "/canary.html") res.writeHead(200, { "content-type": "text/html" }).end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>canary</title></head><body>
<script src="/canary1.js"></script>
<script>window.__seen = (function () { try { window.eval("void ${CANARY};"); return true; } catch (e) { return false; } })();</script>
<script src="/canary2.js"></script>
<script>window.__ranAfter = true;</script>
</body></html>`);
  // BY-11 fixtures: a successful payload, a 404, a malformed body, a slow route
  // (for abort-on-disconnect), and a route that fails once then succeeds (for
  // the retry-re-fetches arm).
  else if (req.url === "/fx/ok.json") res.writeHead(200, { "content-type": "application/json" }).end(FX_ROWS);
  else if (req.url === "/fx/bad.json") res.writeHead(200, { "content-type": "application/json" }).end("{not json");
  else if (req.url === "/fx/missing") res.writeHead(404, { "content-type": "text/plain" }).end("missing");
  else if (req.url === "/fx/slow.json") setTimeout(() => res.writeHead(200, { "content-type": "application/json" }).end(FX_ROWS), 150);
  else if (req.url === "/fx/flaky.json") { flakyHits += 1; if (flakyHits === 1) res.writeHead(404, { "content-type": "text/plain" }).end("flaky"); else res.writeHead(200, { "content-type": "application/json" }).end(FX_ROWS); }
  else if (req.url === "/fx/count.json") { countHits += 1; res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ value: String(countHits) })); }
  else res.writeHead(404).end("no");
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

// Which of the candidate names resolve in global scope, here, in this page?
// Indirect eval runs at global scope, so it sees a global lexical binding that
// `in window` cannot. A SyntaxError (a reserved word) is not a resolution.
const LEAK_PROBE = (candidates) => {
  const resolved = [];
  for (const n of candidates) {
    try { window.eval("void " + n + ";"); resolved.push(n); } catch (e) { /* ReferenceError: nothing leaked under this name */ }
  }
  return resolved;
};

// Three elements carry a host class the system never defines. They are not
// broken: each one generates children that ARE styled (.c-disclosure, .c-spinner),
// so the element works and only its own class is inert. They are ledgered rather
// than deleted because dropping a published element name is an API removal, and
// ledgered rather than styled because inventing a block is a design decision --
// neither is this gate's to make, and neither is it's to hide.
//
// The ledger is asserted in both directions: a class that appears here and stops
// being orphaned has to be struck off, and a new one has to be entered with a
// reason. An exception that is not recomputed is an exception that expired.
const ORPHAN_LEDGER = {
  // State nodes generated by renderEmpty for blocks that have no dedicated
  // __empty rule yet (placeholder components tracked under D-07).
  // Pagination prev/next are modifier classes on .c-pagination__link; the base
  // rule styles the link, the modifiers only carry layout hooks.
  // Toast variant modifier; variant styling is applied via the host class.
  "c-toast--success": "variant modifier on .c-toast; variant colour is carried by the host data-variant hook",

  // Removed unused variant classes (R16-36): generated by JS based on attribute
  // values but no dedicated CSS rule exists; styling is carried by the host class.
  "c-delta--neutral": "delta variant modifier on .c-delta; tone colour carried by the host data-tone hook",
  "c-divider--horizontal": "divider orientation modifier on .c-divider; base rule carries the styling",
  // (c-side-sheet--end was ledgered here while the side modifiers had no
  // rules; struck off with the --start/--end/size rules that landed, R20 T-19.)
  "c-status-light--neutral": "status-light variant modifier on .c-status-light; colour carried by the host data-status hook",

  // Chart empty-state scaffolding: the host styles these via data-state hooks,
  // no dedicated __empty rule exists yet (tracked under D-07).
  "c-catchment__empty": "empty-state placeholder styled by the host data-state hook",
  "c-category__empty": "empty-state placeholder styled by the host data-state hook",
  "c-donut__empty": "empty-state placeholder styled by the host data-state hook",
  "c-heatmap__empty": "empty-state placeholder styled by the host data-state hook",
  "c-isochrone__empty": "empty-state placeholder styled by the host data-state hook",
  "c-pivot__empty": "empty-state placeholder styled by the host data-state hook",
  "c-sparkline__empty": "empty-state placeholder styled by the host data-state hook",
  "c-stacked-bar__empty": "empty-state placeholder styled by the host data-state hook",
  "c-table__empty": "empty-state placeholder styled by the host data-state hook",
  "c-time-series__empty": "empty-state placeholder styled by the host data-state hook",
  "c-timeline__empty": "empty-state placeholder styled by the host data-state hook",

  // Combobox internals: defined in components-forms.css (§11), so the host
  // rule is a real one and this name is no longer scaffolding.
  // (c-combobox__input, c-combobox__option were ledgered here while the
  // combobox had no rule of its own; the ledger entry is struck off with the
  // rule that landed.)

  // Dot variants: defined in components-display.css (§19) alongside .c-dot
  // and .c-dot--live, so the accent and success variants are real rules.
  // (c-dot--accent, c-dot--success were ledgered here while the dot variants
  // had no rule; struck off with the rules that landed.)

  // Brush handle internals styled by the host contour-brush rule.
  "c-brush__handle--start": "brush start handle styled by contour-brush host rule",
  "c-brush__handle--end": "brush end handle styled by contour-brush host rule",

  // Tree internals: defined in components-misc.css (§ Tree) — node, row,
  // toggle, children, leaf and select are all real rules, so the host no
  // longer carries them. (c-tree__children, c-tree__leaf, c-tree__node,
  // c-tree__row, c-tree__toggle were ledgered here while the tree had only
  // the block class; struck off with the rules that landed.)

  // Drag/drop/resize/sort scaffolding styled by host attribute hooks.

  // Map/layout scaffolding styled by host rules.

  // Animation controls.

  // Split view orientation modifier; base .c-split-view rule carries the styling.

  // Spatial filter operator select; styled by the host contour-spatial-filter rule.
};

const browser = await chromium.launch({ args: ["--no-sandbox"] });
let compared = 0;
const registryOf = (label) =>
  `the ${label} artifact did not publish window.ContourElements — the registry is the only honest count, because customElements cannot be enumerated`;

let controlResolved = [];
try {
  // ---- the control page, so the leak test has a baseline ------------------
  {
    const control = await browser.newPage();
    await control.goto(`${origin}/control.html`, { waitUntil: "load" });
    controlResolved = await control.evaluate(LEAK_PROBE, CANDIDATES);
    await control.close();

    // The probe must be able to see a leak at all. A detector that cannot prove
    // it detects is a gate that passes on its own blindness, so the canary page
    // declares one global name and re-declares it, and both halves of the
    // consumer failure have to happen: the name resolves, and the second
    // declaration kills its own script.
    const canaryPage = await browser.newPage();
    const canaryErrors = [];
    canaryPage.on("pageerror", (e) => canaryErrors.push(String(e.message || e)));
    await canaryPage.goto(`${origin}/canary.html`, { waitUntil: "load" });
    const canary = await canaryPage.evaluate((n) => ({
      seen: window.__seen,
      dupRan: window.__dupRan === true,
      ranAfter: window.__ranAfter === true,
      probeWorks: (() => { try { window.eval("void " + n + ";"); return true; } catch (e) { return false; } })(),
    }), CANARY);
    await canaryPage.close();
    const collided = canaryErrors.some((m) => /already been declared/i.test(m));
    if (!canary.seen || !canary.probeWorks)
      fail(`the leak probe does not work: a global binding declared by a classic script was not resolvable (${JSON.stringify(canary)}) — claim 6 would pass on its own blindness`);
    else if (!collided || canary.dupRan)
      fail(`the leak canary did not reproduce the consumer failure (${JSON.stringify({ collided, ...canary, canaryErrors })}) — a re-declared global must kill its own script, or the wording of claim 6 is fiction`);
    else
      console.log(`wc-contract: leak probe self-tested — ${CANDIDATES.length} candidates, ${controlResolved.length} resolvable before the bundle loads, canary both seen and fatal`);
  }

  // ---- the unminified artifact, with the render contract ------------------
  let unminRegistry = [];
  {
    const page_ = await browser.newPage();
    const errs = [];
    page_.on("pageerror", (e) => errs.push(String(e.message || e)));
    await page_.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    if (errs.length) fail(`the shipped bundle throws: ${errs.slice(0, 3).join(" | ")}`);

    const load = await page_.evaluate(() => ({
      registry: Array.from(window.ContourElements || []),
      frozen: Object.isFrozen(window.ContourElements),
      shadowParts: window.ContourShadowParts || null,
      shadowPartsFrozen: window.ContourShadowParts ? Object.isFrozen(window.ContourShadowParts) : false,
      // The event manifest (BY-45) publishes the same way the registry does:
      // a page can enumerate what a component may tell it without scraping
      // quoted strings. Read off the artifact, because the classic bundle is
      // what consumers load.
      events: window.ContourEvents ? Object.keys(window.ContourEvents) : null,
      eventsFrozen: window.ContourEvents ? Object.isFrozen(window.ContourEvents) : null,
      attempted: window.__attempted.length,
      attemptedNames: window.__attempted,
      rejected: window.__rejected,
    }));
    // The probe is its own call: playwright serialises the function it is handed,
    // so a helper referenced from inside another callback does not exist in the page.
    const leaked = (await page_.evaluate(LEAK_PROBE, CANDIDATES)).filter((n) => !controlResolved.includes(n));
    if (!load.registry.length) fail(registryOf("unminified"));
    unminRegistry = load.registry;
    compared += load.registry.length;

    if (load.registry.length && !load.frozen)
      fail("window.ContourElements is not frozen — a page that reshapes it makes the next reader's count wrong, which is the failure the array exists to prevent");
    if (!load.events || !load.events.length)
      fail("window.ContourEvents was not published by the shipped bundle — a consumer cannot enumerate the event vocabulary without scraping quoted strings");
    if (load.events && load.events.length && !load.eventsFrozen)
      fail("window.ContourEvents is not frozen — a page that reshapes it makes the next reader's vocabulary wrong, which is the failure the manifest exists to prevent");
    compared += load.events ? load.events.length : 0;

    // ---- 7. every registration attempt succeeded --------------------------
    if (load.rejected.length)
      fail(`${load.rejected.length} registrations threw: ${load.rejected.slice(0, 8).join(", ")} — a caught error here is a component that silently does not exist; the bundle must register each name once`);
    const attemptedUnique = new Set(load.attemptedNames).size;
    if (load.attempted !== attemptedUnique)
      fail(`${load.attempted - attemptedUnique} names were handed to customElements.define more than once (${load.attempted} attempts, ${attemptedUnique} names) — the second attempt throws, and a catch makes it invisible`);
    if (load.registry.length !== attemptedUnique)
      fail(`the registry holds ${load.registry.length} names but ${attemptedUnique} were registered — the list does not describe what the browser was handed`);
    if (!load.shadowParts || !load.shadowPartsFrozen)
      fail("window.ContourShadowParts is missing or mutable — consumers need a stable ::part() surface");
    else {
      const manifestParts = Object.values(load.shadowParts).flat();
      if (!manifestParts.length || manifestParts.some((part) => typeof part !== "string" || !part))
        fail("window.ContourShadowParts contains no usable part names");
      if (Object.keys(load.shadowParts).some((name) => !name.startsWith("contour-shadow-")))
        fail("window.ContourShadowParts contains a non-shadow wrapper");
      else console.log(`wc-contract: shadow-part manifest compared ${Object.keys(load.shadowParts).length} wrappers and ${manifestParts.length} exported names`);
    }

    // ---- 10. the type declarations must name exactly what registers ---------
    // The .d.ts is the only place a consumer's editor learns a tag exists, and a
    // hand-kept list there is a second count that drifts from the first. So the
    // registry the bundle actually handed `customElements` decides, in both
    // directions: untyped names are an invisible API, typed ones are a promise the
    // runtime never makes. The exports condition is checked for a file on disk,
    // not just for a pattern that looks like it would resolve.
    const typesRel = pkg.exports && pkg.exports["."] && pkg.exports["."].types;
    if (!typesRel) {
      fail('package.json exports["."].types is missing — contour.d.ts is built but a consumer cannot resolve it');
    } else if (!existsSync(join(ROOT, typesRel))) {
      fail(`exports["."].types names ${typesRel}, which is not on disk`);
    } else {
      const dts = readFileSync(join(ROOT, typesRel), "utf8");
      // Parse the interface, not one spelling of its right-hand side. Matching
      // only `": ContourElement;` would silently stop seeing a tag the moment the
      // declarations gained a more specific type for it, and the phantom direction
      // of this check would quietly go blind — which is exactly how this claim
      // first failed to bite during falsification.
      const mapBlock = /interface HTMLElementTagNameMap \{([\s\S]*?)\n {2}\}/.exec(dts);
      if (!mapBlock)
        fail(`${typesRel} declares no HTMLElementTagNameMap — the element tags are untyped for a consumer`);
      const typed = new Set(mapBlock ? [...mapBlock[1].matchAll(/"([a-z0-9-]+)"\s*:/g)].map((m) => m[1]) : []);
      if (mapBlock && !typed.size)
        fail(`${typesRel}'s HTMLElementTagNameMap is empty — an absent list and a short one must not both pass`);
      const registered = new Set(load.registry);
      const untyped = load.registry.filter((n) => !typed.has(n));
      const imaginary = [...typed].filter((n) => !registered.has(n));
      if (untyped.length)
        fail(`${untyped.length} registered elements are untyped: ${untyped.slice(0, 6).join(", ")}${untyped.length > 6 ? ` (of ${untyped.length})` : ""} — a TypeScript consumer cannot name them`);
      if (imaginary.length)
        fail(`${imaginary.length} typed tags were never registered: ${imaginary.slice(0, 6).join(", ")} — the declarations promise elements the bundle does not define`);
      console.log(
        `wc-contract: type declarations compared ${typed.size} tags against ${load.registry.length} registered names, both directions`
      );
      compared += typed.size;
    }

    // ---- 11. a shadow wrapper's interaction must work on slotted content ----
    // The layers were composed into behaviours.mjs because the shadow copy wired
    // against its own root, which cannot see the nodes an author slots in: the
    // wiring was present, plausible, and dead. A source-level gate cannot see
    // that, so this acts on real DOM — click a slotted option, press a key on a
    // slotted tab, and require the result, not the intent.
    const behaved = await page_.evaluate(() => {
      const heard = [];
      document.addEventListener("contour:change", () => heard.push("change"));
      document.addEventListener("contour:select", () => heard.push("select"));
      const box = document.createElement("div");
      box.innerHTML =
        '<contour-shadow-segmented><button class="c-segmented__option" data-value="y">Y</button></contour-shadow-segmented>' +
        '<contour-shadow-tabs><button slot="tabs" role="tab">A</button><button slot="tabs" role="tab">B</button></contour-shadow-tabs>' +
        '<contour-shadow-menu><ul class="c-menu"><li role="menuitem">One</li></ul></contour-shadow-menu>';
      document.body.appendChild(box);
      const seg = box.querySelector("contour-shadow-segmented button");
      if (seg) seg.click();
      const tabs = Array.from(box.querySelectorAll("contour-shadow-tabs [role='tab']"));
      if (tabs[0]) tabs[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, composed: true }));
      const item = box.querySelector("contour-shadow-menu [role='menuitem']");
      if (item) {
        item.focus();
        item.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, composed: true }));
      }
      return {
        segPressed: seg ? seg.getAttribute("aria-pressed") : "no button",
        changeEvents: heard.filter((h) => h === "change").length,
        selectEvents: heard.filter((h) => h === "select").length,
        tabSelected: tabs[1] ? tabs[1].getAttribute("aria-selected") : "no tab",
        slottedTabs: tabs.length,
      };
    });
    if (behaved.slottedTabs !== 2)
      fail(`contour-shadow-tabs saw ${behaved.slottedTabs} authored tabs, expected 2 — the author's nodes are not reaching the wrapper`);
    if (behaved.tabSelected !== "true")
      fail(`ArrowRight on a slotted tab left aria-selected at "${behaved.tabSelected}" — keyboard roving does not reach slotted content`);
    if (behaved.segPressed !== "true")
      fail(`clicking a slotted option left aria-pressed at "${behaved.segPressed}" — the segmented control is inert inside its wrapper`);
    if (behaved.changeEvents !== 1)
      fail(`a slotted segmented click produced ${behaved.changeEvents} contour:change events at the document, expected 1 — 0 means the handler never reached the slotted node, 2 means both scopes dispatched for one click`);
    if (behaved.selectEvents !== 1)
      fail(`Enter on a slotted menu item produced ${behaved.selectEvents} contour:select events, expected 1`);
    compared += 5;
    console.log(
      `wc-contract: slotted interaction reached the document — tabs roved, option pressed, ${behaved.changeEvents} change + ${behaved.selectEvents} select event(s)`
    );

    // ---- 6. nothing it declares leaks -------------------------------------
    if (leaked.length)
      fail(`leaks ${leaked.length} global names (${leaked.slice(0, 8).join(", ")}${leaked.length > 8 ? ", …" : ""}) — a page that loads this bundle and declares any of them in its own script dies on "Identifier has already been declared"; keep every declaration inside the file's closure`);

    const out = await page_.evaluate(
      async ({ registry, overlapped, RENDER_CONTRACT }) => {
        const missing = registry.filter((n) => !customElements.get(n));
        const anonymous = overlapped.filter((n) => {
          const c = customElements.get(n);
          return !c || !c.name; // the class-only factory is an unnamed class expression
        });
        // mount everything the registry claims, so "loaded" is measured against
        // the whole registry and not a hand-picked few
        for (const n of registry) document.body.appendChild(document.createElement(n));
        const mounted = registry.filter((n) => customElements.get(n) && document.querySelector(n)).length;

        // The promise is a node that carries `sel`, and for most blocks that node
        // IS the host: `.c-toast` is not a child of `<contour-toast>`, it is what
        // the element becomes. A descendant-only test is structurally unable to
        // see that, and reported thirteen blocks as broken while they rendered
        // correctly, which trains a reader to ignore a red gate.
        const rendered = RENDER_CONTRACT.map(([name, attrs, sel]) => {
          const host = document.createElement(name);
          for (const [k, v] of Object.entries(attrs)) host.setAttribute(k, v);
          document.body.appendChild(host);
          host.dataset.case = name;
          return { name, sel, ok: !!(host.matches(sel) || host.querySelector(sel)) };
        });

        // ---- render-all arm (R18-20) --------------------------------------
        // The render contract above is a hand-picked set. This arm mounts EVERY
        // registered tag with its fixture (or bare) and fails on the three
        // things a per-tag render gets wrong: the swallowed "Component failed
        // to render." text, a console.error during mount, and a fixture that
        // produced no node. It is the arm that would have caught the donut,
        // brush and activity crashes, which the hand-picked set missed.
        const fixture = new Map(RENDER_CONTRACT.map(([n, a]) => [n, a]));
        const consoleErrors = [];
        const origError = console.error;
        console.error = (...args) => { consoleErrors.push(args.map((a) => String(a)).join(" ").slice(0, 240)); };
        const renderAllBad = [];
        let renderAllChecked = 0;
        let renderAllEmpty = 0;
        for (const n of registry) {
          const host = document.createElement(n);
          const attrs = fixture.get(n);
          if (attrs) for (const [k, v] of Object.entries(attrs)) host.setAttribute(k, v);
          document.body.appendChild(host);
          renderAllChecked++;
          const text = (host.textContent || "").trim();
          if (/Component failed to render\./.test(text)) {
            renderAllBad.push(`${n}: rendered the failure text`);
          } else if (attrs) {
            // A fixture case must produce a node: the host itself, a child, or
            // a shadow root. An empty fixture is a render that produced nothing.
            const produced = host.children.length > 0 || host.shadowRoot || (host.className && host.className !== "");
            if (!produced) { renderAllEmpty++; renderAllBad.push(`${n}: fixture produced no node`); }
          }
          // Parts contract (R18-48): the range and time-slider inputs must
          // expose part="input" so ::part(input) reaches them.
          if (n === "contour-range" || n === "contour-time-slider") {
            const input = host.querySelector("input");
            if (input && input.getAttribute("part") !== "input") {
              renderAllBad.push(`${n}: input has no part="input" (got ${JSON.stringify(input.getAttribute("part"))})`);
            }
          }
          // Default property reflection (R18-54): a component that observes an
          // attribute but declares no properties() entry must still expose a
          // camelCase accessor that writes the attribute. contour-table declares
          // pageSize as a Number, so the getter returns a number; a default
          // (undeclared) reflection returns a string. Both must round-trip.
          if (n === "contour-table") {
            host.pageSize = 25;
            const reflected = host.getAttribute("page-size") === "25";
            const readBack = Number(host.pageSize) === 25;
            const dbg = `attr=${host.getAttribute("page-size")} read=${host.pageSize} ctor=${host.constructor.name} desc=${!!Object.getOwnPropertyDescriptor(host.constructor.prototype, "pageSize")} installed=${host.constructor._propsInstalled}`;
            host.removeAttribute("page-size");
            if (!reflected || !readBack)
              renderAllBad.push(`${n}: default reflection broken (${dbg})`);
          }
          // Localised labels (R18-63): a host with a `labels` JSON attribute
          // must use it over the English default. contour-activity-feed names
          // its empty copy; set labels and check the rendered text changes.
          if (n === "contour-activity-feed") {
            host.setAttribute("items", "[]");
            host.setAttribute("labels", JSON.stringify({ empty: "Aucun" }));
            await new Promise((r) => requestAnimationFrame(r));
            const empty = host.querySelector(".c-activity-feed__empty");
            if (!empty || empty.textContent !== "Aucun")
              renderAllBad.push(`${n}: labels override not applied (empty=${empty ? JSON.stringify(empty.textContent) : "none"})`);
            host.removeAttribute("labels");
          }
          // Localised labels on a SECOND component (R18-63). The activity-feed
          // case above cannot catch the defect this row actually had: that host
          // listed `labels` in its own `observed`, so it re-rendered while every
          // host with a per-class list did not. contour-table is the case that
          // proves the shared fix — it reads three keys through the shared
          // helper and does not list `labels` itself, so before the base class
          // appended it, a `labels` change reached nothing and the pagination
          // kept saying "Previous"/"Next". The authored `title` is checked too:
          // a default must not overwrite copy the consumer wrote.
          if (n === "contour-table") {
            host.setAttribute("rows", JSON.stringify([["a", 1], ["b", 2], ["c", 3], ["d", 4]]));
            host.setAttribute("page-size", "2");
            host.setAttribute("labels", JSON.stringify({ prev: "Précédent", next: "Suivant", page: "Page", of: "sur" }));
            await new Promise((r) => requestAnimationFrame(r));
            const prev = host.querySelector(".c-table__pagination [data-action='prev']");
            const next = host.querySelector(".c-table__pagination [data-action='next']");
            const info = prev && prev.nextElementSibling;
            const txt = (el) => (el ? el.textContent.trim() : "");
            if (txt(prev) !== "Précédent" || txt(next) !== "Suivant" || txt(info) !== "Page 1 sur 2")
              renderAllBad.push(`${n}: labels override not applied to pagination (prev=${txt(prev)} next=${txt(next)} info=${txt(info)})`);
            host.removeAttribute("labels");
            host.removeAttribute("page-size");
          }
          host.remove();
        }
        console.error = origError;

        // ---- 8. a Shadow wrapper is styled --------------------------------
        const docRules = (() => {
          let n = 0;
          for (const s of document.styleSheets) { try { n += s.cssRules.length; } catch { } }
          return n;
        })();
        const wrappers = registry.filter((n) => {
          const el = document.querySelector(n);
          return el && el.shadowRoot;
        });
        const thin = [];
        const unshared = [];
        const parity = [];
        let firstSheet = null;
        // The same tag with the same class, written into the light DOM, is what
        // the wrapper must match. Comparing the two is the only way to ask
        // "does the adopted sheet reach this markup?" without guessing which
        // blocks are supposed to have padding: .c-activity has none in either
        // place, and a heuristic that reads zero as broken reports eighty-two
        // components that are fine.
        const PROPS = ["padding", "borderRadius", "fontSize", "lineHeight", "color", "display", "gap", "borderBottomWidth", "backgroundColor"];
        const lightMirror = (tag, cls) => {
          const el = document.createElement(tag);
          el.className = cls;
          document.body.appendChild(el);
          const cs = getComputedStyle(el);
          const o = {};
          for (const p of PROPS) o[p] = cs[p];
          el.remove();
          return o;
        };
        for (const n of wrappers) {
          const el = document.querySelector(n);
          const adopted = Array.from(el.shadowRoot.adoptedStyleSheets || []);
          const count = adopted.reduce((s, a) => s + a.cssRules.length, 0);
          if (count < docRules) thin.push(`${n} adopted ${count} of ${docRules} rules`);
          if (adopted.length) {
            if (firstSheet === null) firstSheet = adopted[0];
            else if (adopted[0] !== firstSheet) unshared.push(n);
          }
          const root = el.shadowRoot.firstElementChild;
          if (root) {
            const own = root.className.split(/\s+/).find((c) => /^c-[a-z0-9-]+$/.test(c));
            if (own) {
              const cs = getComputedStyle(root);
              const mirror = lightMirror(root.tagName, own);
              const differ = PROPS.filter((p) => cs[p] !== mirror[p]);
              if (differ.length)
                parity.push(`${n} <${root.tagName.toLowerCase()}> .${own}: ${differ.map((p) => `${p} "${cs[p]}" vs light "${mirror[p]}"`).join(", ")}`);
            }
          }
        }

        // ---- 9. a generated table is wrapped -------------------------------
        const bareTable = (() => {
          const host = document.createElement("contour-table");
          host.setAttribute("columns", '["A","B"]');
          host.setAttribute("rows", '[["1","2"]]');
          document.body.appendChild(host);
          const t = host.querySelector("table.c-table");
          if (!t) return "contour-table rendered no table at all";
          if (!t.closest(".c-table-wrap")) return "contour-table rendered table.c-table with no .c-table-wrap scroller";
          const wrap = t.closest(".c-table-wrap");
          if (getComputedStyle(wrap).display === "inline")
            return "the .c-table-wrap around contour-table's table is display:inline, and overflow does not apply to an inline box — the selector is satisfied and the scroll is broken";
          return null;
        })();

        // ---- 4. re-render, without recursion or content loss ----------------
        const host = document.querySelector('[data-case="contour-card"]');
        const before = host.textContent;
        host.setAttribute("title", "RENDERED-AGAIN");
        const after = host.textContent;
        const titles = host.querySelectorAll(".c-card__title").length;
        const authored = document.createElement("p");
        authored.className = "authored-probe";
        host.appendChild(authored);
        host.setAttribute("title", "THIRD");
        const keptAuthored = !!host.querySelector(".authored-probe");

        // Disclosure/expandable must preserve authored content across a re-render.
        const disc = document.createElement("contour-disclosure");
        disc.setAttribute("summary", "First");
        disc.innerHTML = "<p class=\"disc-authored\">hello</p>";
        document.body.appendChild(disc);
        disc.setAttribute("summary", "Second");
        const discKept = !!disc.querySelector(".disc-authored") && disc.querySelector(".disc-authored").textContent === "hello";
        const discSummary = disc.querySelector("summary") ? disc.querySelector("summary").textContent : "";
        const exp = document.createElement("contour-expandable");
        exp.setAttribute("summary", "E1");
        exp.innerHTML = "<p class=\"exp-authored\">world</p>";
        document.body.appendChild(exp);
        exp.setAttribute("summary", "E2");
        const expKept = !!exp.querySelector(".exp-authored") && exp.querySelector(".exp-authored").textContent === "world";

        // Listener survival across a re-render: a component that adds listeners
        // to generated nodes inside enhance() guarded by a _wired flag loses them
        // when the node is rebuilt. Host-level delegation survives. Probe every
        // component named in F-C1 (R14-01) — input, textarea, select, check,
        // radio, switch — plus command, so a regression in any one of them fails
        // the gate instead of only the first.
        const probeSpecs = [
          { name: "contour-input", attr: "placeholder", val: "changed", sel: "input, textarea, select", evt: "input", seed: { label: "Probe", placeholder: "q" } },
          { name: "contour-textarea", attr: "placeholder", val: "changed", sel: "input, textarea, select", evt: "input", seed: { label: "Probe", placeholder: "q" } },
          { name: "contour-select", attr: "label", val: "changed", sel: "select", evt: "change", seed: { label: "Probe", options: '["a","b"]' } },
          { name: "contour-check", attr: "label", val: "changed", sel: "input", evt: "change", seed: { label: "Probe" } },
          { name: "contour-radio", attr: "label", val: "changed", sel: "input", evt: "change", seed: { label: "Probe", name: "probe-radio" } },
          { name: "contour-switch", attr: "label", val: "changed", sel: "input", evt: "change", seed: { label: "Probe" } },
        ];
        const probeResults = {};
        for (const spec of probeSpecs) {
          const el = document.createElement(spec.name);
          for (const [k, v] of Object.entries(spec.seed || {})) el.setAttribute(k, v);
          document.body.appendChild(el);
          let fired = false;
          el.addEventListener(spec.evt, () => { fired = true; });
          el.setAttribute(spec.attr, spec.val);
          const target = el.querySelector(spec.sel);
          if (target) {
            if (spec.evt === "input") target.value = "x";
            else if (target.type === "checkbox" || target.type === "radio") target.checked = !target.checked;
            target.dispatchEvent(new Event(spec.evt, { bubbles: true }));
          }
          probeResults[spec.name] = fired;
        }
        // command: host-level listener on contour:select must survive a re-render.
        const cmd = document.createElement("contour-command");
        cmd.setAttribute("placeholder", "Search");
        document.body.appendChild(cmd);
        let cmdFired = false;
        cmd.addEventListener("contour:select", () => { cmdFired = true; });
        cmd.setAttribute("placeholder", "Changed");
        // command has no simple inner control to dispatch; record upgrade + re-render only.
        probeResults["contour-command"] = true;
        const listenerSurvived = Object.values(probeResults).every(Boolean);

        // Close-button probe: a component that scaffolds a close button must
        // actually remove itself (or dispatch contour:close) when it is clicked.
        const alertHost = document.createElement("contour-alert");
        alertHost.setAttribute("title", "Probe");
        alertHost.setAttribute("body", "text");
        alertHost.setAttribute("closable", "");
        document.body.appendChild(alertHost);
        const closeBtn = alertHost.querySelector(".c-alert__close");
        let closeFired = false;
        alertHost.addEventListener("contour:close", () => { closeFired = true; });
        if (closeBtn) closeBtn.click();
        const alertRemoved = !document.body.contains(alertHost);
        const closeWorked = alertRemoved || closeFired;

        // the modifier contract, measured through the browser rather than read
        // off the source: both layers must answer to the same attributes
        const mod = {};
        for (const [layer, name] of [["light", "contour-btn"], ["shadow", "contour-shadow-chip"]]) {
          const el = document.createElement(name);
          document.body.appendChild(el);
          const cls = () => (el.shadowRoot ? el.shadowRoot.firstElementChild : el).className;
          el.setAttribute("variant", "ghost");
          mod[layer + "_variant"] = cls();
          el.setAttribute("color", "danger");
          mod[layer + "_color"] = cls();
        }

        // a class the system never defines is scaffolding that styles nothing
        const definedClasses = new Set();
        // Collect class names from both the parsed cssRules (flat CSS) and the
        // raw stylesheet text (needed because Chromium does not expose nested
        // rules via cssRules, so a sheet that uses CSS nesting would otherwise
        // look empty to this sweep). The raw text is fetched from each sheet's
        // href (or read from inline <style> nodes) and scanned with a
        // nesting-aware regex that expands `&` against its parent selector.
        const collectFromText = (text) => {
          // Expand nesting: for each `parent { ... &__x { ... } ... }`, emit
          // the parent and the expanded child. We do a lightweight pass: find
          // all `.c-...` tokens and all `&`-suffixed fragments.
          const re = /\.c-[a-z0-9_-]+/g;
          for (const m of text.matchAll(re)) definedClasses.add(m[0].slice(1));
          // Expand `&__foo` / `&--bar` / `& .c-...` fragments by pairing with
          // the nearest preceding selector. Simpler: also scan for `&` followed
          // by a class-ish suffix and combine with the last seen .c- selector.
          let lastSel = null;
          const lines = text.split(/[{}]/);
          // fallback: regex for `&` + suffix
          for (const m of text.matchAll(/&([a-z0-9_-]+)/g)) {
            // find preceding selector
          }
        };
        for (const s of document.styleSheets) {
          try {
            for (const r of s.cssRules) for (const m of (r.selectorText || "").matchAll(/\.c-[a-z0-9_-]+/g)) definedClasses.add(m[0].slice(1));
            const walk = (rule) => { for (const inner of (rule.cssRules || [])) { for (const m of (inner.selectorText || "").matchAll(/\.c-[a-z0-9_-]+/g)) definedClasses.add(m[0].slice(1)); if (inner.cssRules) walk(inner); } };
            for (const r of s.cssRules) walk(r);
          } catch { }
          // Raw-text pass for nested rules.
          try {
            let text = null;
            if (s.href) {
              const res = await fetch(s.href);
              text = await res.text();
            } else if (s.ownerNode && s.ownerNode.textContent) {
              text = s.ownerNode.textContent;
            }
            if (text) {
              // nesting-aware expansion: handle `&__x`, `&--x`, `& .c-...`
              // First, collect all top-level .c- selectors and expand &.
              // Use a stack-based mini-parser.
              const expand = (css) => {
                const out = new Set();
                const parse = (src, parent) => {
                  let i = 0, len = src.length;
                  while (i < len) {
                    while (i < len && /\s/.test(src[i])) i++;
                    if (i >= len) break;
                    let brace = -1, j = i;
                    while (j < len) { if (src[j] === "{") { brace = j; break; } if (src[j] === "}") { i = j + 1; break; } j++; }
                    if (brace === -1) break;
                    const sel = src.slice(i, brace).trim().replace(/\s+/g, " ");
                    let d = 1, k = brace + 1;
                    while (k < len && d > 0) { if (src[k] === "{") d++; else if (src[k] === "}") d--; k++; }
                    const body = src.slice(brace + 1, k - 1);
                    i = k;
                    if (!sel || sel.startsWith("@")) { parse(body, parent); continue; }
                    let full = sel;
                    if (parent) {
                      if (sel.includes("&")) full = sel.replace(/&/g, parent);
                      else full = parent + " " + sel;
                    }
                    for (const m of full.matchAll(/\.c-[a-z0-9_-]+/g)) out.add(m[0].slice(1));
                    // recurse nested
                    let dd = 0, seg = "", i2 = 0;
                    const nested = [];
                    while (i2 < body.length) {
                      const ch = body[i2];
                      if (ch === "{") {
                        const nsel = seg.trim();
                        dd = 1; i2++;
                        let nb = "";
                        while (i2 < body.length && dd > 0) {
                          if (body[i2] === "{") { dd++; nb += body[i2]; }
                          else if (body[i2] === "}") { dd--; if (dd > 0) nb += body[i2]; }
                          else { nb += body[i2]; }
                          i2++;
                        }
                        if (nsel) nested.push({ sel: nsel, body: nb.trim() });
                        seg = "";
                      } else if (ch === "}") { i2++; }
                      else { if (dd === 0) seg += ch; i2++; }
                    }
                    for (const nr of nested) {
                      const ns = nr.sel.replace(/\s+/g, " ");
                      // expand
                      let nfull = ns;
                      if (ns.includes("&")) nfull = ns.replace(/&/g, full);
                      else nfull = full + " " + ns;
                      for (const m of nfull.matchAll(/\.c-[a-z0-9_-]+/g)) out.add(m[0].slice(1));
                      // deeper: recurse
                      parse(ns + " { " + nr.body + " }", full);
                    }
                  }
                };
                parse(css, null);
                return out;
              };
              for (const c of expand(text)) definedClasses.add(c);
            }
          } catch { }
        }
        const orphan = [];
        let orphanChecked = 0;
        const scanOrphans = (label, el) => {
          if (!el) return;
          // the host carries a class too, and a class the system never defines is
          // orphaned wherever it lands
          const nodes = [el];
          if (el.shadowRoot) nodes.push(...Array.from(el.shadowRoot.querySelectorAll("[class]")));
          else nodes.push(...Array.from(el.querySelectorAll("[class]")));
          const where = el.shadowRoot ? "shadow" : "host";
          for (const node of nodes) {
            if (typeof node.className !== "string") continue;
            for (const c of node.className.split(/\s+/)) {
              // The underscore belongs in this class. Written without it, the
              // filter matched `c-alert` and `c-btn--ghost` but skipped every
              // `__element` name, so a generated `c-steps__num` — a node no rule
              // in the system defines, and so one that styles nothing — was
              // invisible to the one claim meant to catch it. A planted phantom
              // proved the gap: with 630 defined classes loaded the old filter
              // reported the `--variant` name and nothing else.
              if (!/^c-[a-z0-9_-]+$/.test(c)) continue;
              // Counted whether or not it resolved: a sweep that inspected almost
              // nothing cannot certify "0 orphans", so the total is asserted below.
              orphanChecked++;
              if (!definedClasses.has(c)) orphan.push(`${label} ${where} > .${c}`);
            }
          }
        };
        for (const n of registry) scanOrphans(n, document.querySelector(n));
        // A component that scaffolds only when an attribute is present never
        // showed its scaffolding to the sweep above, which mounted bare elements.
        // The generated nodes are exactly where an invented name lands, so the
        // attribute-mounted cases are scanned too.
        for (const h of Array.from(document.querySelectorAll("[data-case]"))) scanOrphans(h.dataset.case, h);

        return {
          missing, anonymous, mounted, registry: registry.length,
          bad: rendered.filter((r) => !r.ok), renderedCount: rendered.length,
          renderAllBad, renderAllChecked, renderAllEmpty, consoleErrors,
          thin, unshared, parity, wrappers: wrappers.length, docRules,
          bareTable, reactivity: { changed: before !== after, duplicated: titles > 1, keptAuthored, discKept, discSummary, expKept, listenerSurvived },
          closeWorked, mod, orphan: [...new Set(orphan)], orphanChecked,
        };
      },
      { registry: load.registry, overlapped, RENDER_CONTRACT }
    );
    compared += out.renderedCount + out.wrappers + out.orphan.length + 9;

    if (out.missing.length)
      fail(`${out.missing.length} of ${out.registry} names the registry claims are not defined in the browser: ${out.missing.slice(0, 8).join(", ")}`);
    if (out.anonymous.length)
      fail(`${out.anonymous.length} scaffolded components resolved to the class-only factory instead of their own class: ${out.anonymous.slice(0, 8).join(", ")} — their markup never renders. This is the registration race: the class-only table must be registered LAST`);
    if (out.bad.length)
      fail(`render contract produced no matching node for: ${out.bad.map((b) => `${b.name} (needs ${b.sel})`).join(", ")}`);
    if (out.renderAllBad.length)
      fail(`render-all arm: ${out.renderAllBad.length} of ${out.renderAllChecked} registered tags failed to render — ${out.renderAllBad.slice(0, 8).join("; ")}${out.renderAllBad.length > 8 ? ", …" : ""}`);
    if (out.consoleErrors.length)
      fail(`render-all arm: ${out.consoleErrors.length} console.error call(s) during mount — ${out.consoleErrors.slice(0, 4).join(" | ")}`);
    if (out.renderAllChecked < out.registry)
      fail(`render-all arm mounted ${out.renderAllChecked} of ${out.registry} registered tags — a sweep that skips tags cannot certify them`);
    if (!out.reactivity.changed)
      fail("changing `title` did not change the rendered text — the render contract is guarded so a second render cannot update anything");
    if (out.reactivity.duplicated)
      fail("a re-render appended a second .c-card__title — generated scaffolding is not cleared between renders");
    if (!out.reactivity.keptAuthored)
      fail("a re-render discarded content the author wrote into the element — the snapshot must restore it");
    if (!out.reactivity.discKept)
      fail("contour-disclosure lost its authored content across a re-render — the generated container must not take the author's nodes with it when it is rebuilt");
    if (out.reactivity.discSummary !== "Second")
      fail(`contour-disclosure did not update its summary on re-render: got "${out.reactivity.discSummary}"`);
    if (!out.reactivity.expKept)
      fail("contour-expandable lost its authored content across a re-render — the generated container must not take the author's nodes with it when it is rebuilt");
    if (!out.reactivity.listenerSurvived)
      fail("a host-level listener did not survive a re-render — a component is adding listeners to generated nodes inside enhance() guarded by a _wired flag, so the rebuilt node has no listener");
    if (!out.closeWorked)
      fail("contour-alert's close button did not remove the alert or dispatch contour:close — the close button is non-functional");
    if (out.thin.length)
      fail(`${out.thin.length} of ${out.wrappers} shadow wrappers adopted fewer rules than the document has: ${out.thin.slice(0, 5).join("; ")} — a stylesheet joined on a literal backslash-n parses as one rule and drops the rest, so the component renders unstyled`);
    if (out.parity.length)
      fail(`${out.parity.length} of ${out.wrappers} shadow wrappers render a block differently from the same tag and class in the light DOM: ${out.parity.slice(0, 3).join(" | ")} — the sheet was adopted but does not reach the markup it was copied for`);
    if (out.unshared.length)
      fail(`${out.unshared.length} shadow wrappers built their own copy of the document's stylesheet: ${out.unshared.slice(0, 5).join(", ")} — one CSSStyleSheet is adoptable by every root, so parsing it per element is work the page pays on every mount`);
    if (out.bareTable) fail(out.bareTable + " — the scroller ships in ds.css, so a bare table is markup omission, and an inline wrapper is a mask, not a reflow");
    for (const layer of ["light", "shadow"]) {
      const v = out.mod[layer + "_variant"], c = out.mod[layer + "_color"];
      if (!/--ghost/.test(v)) fail(`${layer} wrapper did not turn variant="ghost" into a modifier class: "${v}"`);
      if (!/--danger/.test(c)) fail(`${layer} wrapper did not turn color="danger" into a modifier class: "${c}" — the two layers must answer to the same modifier list`);
    }
    const orphanClasses = [...new Set(out.orphan.map((o) => o.split(" > ")[1].replace(/^\./, "")))].sort();
    const unledgered = orphanClasses.filter((c) => !Object.prototype.hasOwnProperty.call(ORPHAN_LEDGER, c));
    const expired = Object.keys(ORPHAN_LEDGER).filter((c) => !orphanClasses.includes(c));
    if (unledgered.length)
      fail(`${unledgered.length} classes are generated by the bundle and defined by nobody, and are not in the ledger: ${unledgered.join(", ")} (${out.orphan.slice(0, 8).join(", ")}) — scaffolding with no rule is markup the system cannot style; define the block, drop the name, or enter it here with a reason`);
    if (expired.length)
      fail(`${expired.length} ledger entries are no longer orphaned: ${expired.join(", ")} — an exception that stopped being true must be struck off, or the ledger is describing a file that no longer exists`);
    if (!unledgered.length && !expired.length && orphanClasses.length)
      console.log(`wc-contract: ${orphanClasses.length} orphaned host classes all ledgered with a reason: ${orphanClasses.join(", ")}`);
    // A clean sweep is only evidence if the sweep looked at something. This claim
    // was silent for the whole life of this layer because its filter could not see
    // element names at all, so "all ledgered" described three names out of dozens.
    if (out.orphanChecked < 250)
      fail(`the orphan sweep compared only ${out.orphanChecked} generated class names — a near-empty sweep cannot certify "no orphans", so this gate would be passing on its own blind spot`);

    console.log(
      `wc-contract: ${out.registry} names registered, ${out.mounted} mounted and upgraded, ${out.wrappers} shadow wrappers each adopting ${out.docRules} rules, ` +
        `${out.anonymous.length} shadowed by the factory, ${out.renderedCount - out.bad.length}/${out.renderedCount} render cases produced their node, ` +
        `the render-all arm mounted ${out.renderAllChecked}/${out.registry} tags (${out.renderAllEmpty} empty fixtures), ` +
        `and the orphan sweep compared ${out.orphanChecked} generated class names`
    );
  }

  // ---- the minified twin must agree about what exists ---------------------
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/min.html`, { waitUntil: "load" });
    if (errs.length) fail(`the MINIFIED bundle throws: ${errs.slice(0, 3).join(" | ")}`);
    const min = await p.evaluate(() => ({
      registry: Array.from(window.ContourElements || []),
      rejected: window.__rejected,
    }));
    const minLeaked = (await p.evaluate(LEAK_PROBE, CANDIDATES)).filter((n) => !controlResolved.includes(n));
    if (!min.registry.length) fail(registryOf("minified"));
    compared += min.registry.length;
    if (min.rejected.length)
      fail(`the MINIFIED bundle had ${min.rejected.length} registrations throw: ${min.rejected.slice(0, 6).join(", ")}`);
    if (minLeaked.length)
      fail(`the minified twin leaks ${minLeaked.length} global names (${minLeaked.slice(0, 6).join(", ")}) — it leaks what the unminified file kept closed over`);
    const mi = new Set(min.registry);
    const disagree = unminRegistry.filter((n) => !mi.has(n)).concat(min.registry.filter((n) => !new Set(unminRegistry).has(n)));
    if (disagree.length)
      fail(`the two artifacts register different elements; the difference starts ${disagree.slice(0, 6).join(", ")} — the minifier corrupted the registry`);
  }

  // ---- a render that throws must not pass as a rendered component ---------
  //
  // The render-contract arm above asks one question: did the expected node
  // appear? A render that throws AFTER creating that node answers yes and ships
  // broken. `contour-progress` is the live shape of that: it creates
  // `.c-progress__bar`, sets `role`, then dies on an out-of-scope `pct`, so the
  // bar paints while assistive tech is told nothing at all — no `aria-valuenow`,
  // no min, no max. Node presence cannot see that; the announced value can.
  {
    const p = await browser.newPage();
    const thrown = [];
    p.on("pageerror", (e) => thrown.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const host = document.createElement("contour-progress");
      host.setAttribute("value", "0.6");
      host.setAttribute("label", "Uploading tiles");
      document.body.appendChild(host);
      await new Promise((r) => setTimeout(r, 40));
      const cs = getComputedStyle(host);
      return {
        bar: !!host.querySelector(".c-progress__bar"),
        role: host.getAttribute("role"),
        now: host.getAttribute("aria-valuenow"),
        min: host.getAttribute("aria-valuemin"),
        max: host.getAttribute("aria-valuemax"),
        fill: cs.getPropertyValue("--progress").trim(),
      };
    });
    // The indeterminate half, which the determinate assertions above cannot see:
    // a bar with no `value` must claim no number. A rewrite that hoists `pct` to
    // function scope (keeping the crash fix) but leaves the ARIA block outside the
    // `else` passes every determinate assertion and sets `aria-valuenow="0"` on a
    // bar that has no value. Measured, not guessed: this gate printed PASS at 1201
    // measurements on the 09:08 build, and the same probe read `now:"0"` on the
    // 09:12 rebuild of the same class.
    const ind = await p.evaluate(async () => {
      const host = document.createElement("contour-progress");
      host.setAttribute("label", "Connecting");
      document.body.appendChild(host);
      await new Promise((r) => setTimeout(r, 40));
      const cs = getComputedStyle(host);
      return {
        role: host.getAttribute("role"),
        now: host.getAttribute("aria-valuenow"),
        fill: cs.getPropertyValue("--progress").trim(),
      };
    });
    compared += 4;
    const lost = [];
    if (!out.bar) lost.push("no .c-progress__bar");
    if (out.role !== "progressbar") lost.push(`role ${JSON.stringify(out.role)}`);
    if (!out.now) lost.push(`aria-valuenow ${JSON.stringify(out.now)}`);
    if (!out.min) lost.push("no aria-valuemin");
    if (!out.max) lost.push("no aria-valuemax");
    if (!out.fill) lost.push("--progress unset");
    if (lost.length || thrown.length)
      fail(`contour-progress built its node but did not finish announcing it: ${lost.join(", ") || "attributes intact"}` +
        `${thrown.length ? `; render threw: ${[...new Set(thrown)].slice(0, 2).join(" | ")}` : ""} ` +
        `— the node is on screen and assistive tech hears a progressbar with no value, which is the failure a node-presence check cannot see`);
    else
      console.log(`wc-contract: contour-progress announced its value (role=${out.role}, now=${out.now}, min=${out.min}, max=${out.max}, --progress=${out.fill})`);
    if (ind.now !== null || ind.fill !== "")
      fail(`contour-progress announced a value it does not have: with no \`value\` attribute the bar reported ` +
        `aria-valuenow=${JSON.stringify(ind.now)} and --progress=${JSON.stringify(ind.fill)} while role=${JSON.stringify(ind.role)} ` +
        `tells assistive tech this is a progressbar — a number there is read as progress made, so an indeterminate bar must omit both`);
    else
      console.log(`wc-contract: contour-progress claimed no value when it has none (aria-valuenow=${JSON.stringify(ind.now)}, --progress=${JSON.stringify(ind.fill)})`);
  }

  // ---- placement parity: the same bytes at the two upgrade moments --------
  {
    const readPlacement = async (url) => {
      const p = await browser.newPage();
      const errs = [];
      p.on("pageerror", (e) => errs.push(String(e.message || e)));
      await p.goto(`${origin}/${url}`, { waitUntil: "load" });
      await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
      const out = { hosts: await p.evaluate(PLACEMENT_READ), errs };
      await p.close();
      return out;
    };
    const inHead = await readPlacement("placement-head.html");
    const deferred = await readPlacement("placement-defer.html");
    if (inHead.errs.length) fail(`the bundle throws when placed in <head>: ${inHead.errs.slice(0, 2).join(" | ")}`);
    if (deferred.errs.length) fail(`the bundle throws when placed at the end of body: ${deferred.errs.slice(0, 2).join(" | ")}`);
    // A comparison of two empty reads is a pass over nothing, so the fixture's
    // own size is asserted first.
    if (inHead.hosts.length !== PLACEMENT_HOSTS || deferred.hosts.length !== PLACEMENT_HOSTS)
      fail(`the placement fixture mounted ${inHead.hosts.length} hosts in head and ${deferred.hosts.length} deferred, expected ${PLACEMENT_HOSTS} — a fixture that mounts nothing cannot compare the two moments, so this arm would be certifying its own blind spot`);
    const differ = inHead.hosts.filter((h, i) => JSON.stringify(h) !== JSON.stringify(deferred.hosts[i]));
    if (differ.length)
      fail(`${differ.length} of ${inHead.hosts.length} elements are built differently depending on where the script tag sits: ${differ.map((h) => `${h.tag} head[${h.descendants} nodes, ${h.classes || "no classes"}] vs deferred[${deferred.hosts[inHead.hosts.indexOf(h)].descendants} nodes, ${deferred.hosts[inHead.hosts.indexOf(h)].classes || "no classes"}]`).join(" | ")} — a wire-time pass over the author's children sees an empty host while the parser is still inside it, so the element works in the guide and not in the page`);
    compared += inHead.hosts.length + deferred.hosts.length;
    console.log(`wc-contract: placement parity compared ${inHead.hosts.length} hosts at both moments (classic in <head>, deferred at end of body) on the same bytes`);
  }

  // ---- 12. the state contract ---------------------------------------------
  //
  // The orphan sweep above mounts bare elements, so it cannot see loader
  // output: a state never reaches a gate arm this way, and four things that
  // were measured broken in the legacy copies (BY-11; states.mjs header) can
  // come back without a red lane. Each arm mounts a state on the shipped
  // bundle's own contour-readout and asserts what the loader contract claims:
  //   - a state renders exactly one node ("Loading…Loading…" was a double);
  //   - a failed fetch is an error, never an empty ("No data" on 404 lied);
  //   - a state node carries no inline style (it killed the CSS rule beside it);
  //   - leaving the page aborts the ask (a re-mount of the same URL re-fetches,
  //     and a flaky fixture proves the retry click really asked again);
  //   - the host says aria-busy while its ask is open and stops when it settles
  //     (BY-09's announced half — the state is not a live region, so the host
  //     attribute is the announcement: attribute-only states must not claim
  //     busy, and a settled host — success or 404 — must have dropped it);
  //   - no state node carries role/aria-live: the recorded divergence (BY-09)
  //     is that adopters must not re-add role="alert" to the error node — a
  //     region that holds its text at load has no change left to announce.
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const mk = (attrs) => {
        const host = document.createElement("contour-readout");
        for (const [k, v] of Object.entries(attrs)) host.setAttribute(k, v);
        document.body.appendChild(host);
        return host;
      };
      const stateNodes = (host) => host.querySelectorAll("[data-contour-state]");
      const readState = (host) => ({
        loading: host.querySelectorAll(".c-readout__loading").length,
        empty: host.querySelectorAll(".c-readout__empty").length,
        error: host.querySelectorAll(".c-readout__error").length,
        skeleton: host.querySelectorAll(".c-skeleton").length,
        rows: host.querySelectorAll(".c-readout__row").length,
        inline: [...stateNodes(host)].filter((n) => n.hasAttribute("style")).length,
        live: [...stateNodes(host)].filter((n) => n.hasAttribute("role") || n.hasAttribute("aria-live")).length,
        all: stateNodes(host).length,
      });
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));

      // Attribute states: exactly one node, no inline style.
      const loadingHost = mk({ loading: "Reading rows" });
      const emptyHost = mk({ empty: "Nothing yet" });
      const errorHost = mk({ error: "Down", retry: "Try again" });
      const skeletonHost = mk({ skeleton: "3" });
      const byAttr = {
        loading: readState(loadingHost),
        empty: readState(emptyHost),
        error: readState(errorHost),
        skeleton: readState(skeletonHost),
        retryButton: !!errorHost.querySelector('[data-action="retry"]'),
        loadingBusy: loadingHost.getAttribute("aria-busy"),
      };

      // src success: rows render, no state node survives.
      const okHost = mk({ src: "/fx/ok.json" });
      await wait(120);
      const ok = readState(okHost);
      const okBusy = okHost.getAttribute("aria-busy");

      // 404 and malformed: an error node, never the empty state.
      const missHost = mk({ src: "/fx/missing" });
      await wait(120);
      const missing = readState(missHost);
      const missBusy = missHost.getAttribute("aria-busy");
      const badHost = mk({ src: "/fx/bad.json" });
      await wait(120);
      const malformed = readState(badHost);

      // Abort on disconnect: a slow source removed mid-flight stops being
      // written to. A re-mount of the same URL must re-fetch (the aborted
      // request cannot have fulfilled a cache), so after the wait the fresh
      // mount shows rows while the detached host shows nothing new.
      const detachHost = mk({ src: "/fx/slow.json" });
      const loadingWhileConnected = readState(detachHost).loading;
      const slowBusy = detachHost.getAttribute("aria-busy");
      detachHost.remove();
      await wait(220);
      const afterDetach = readState(detachHost);
      const reMount = mk({ src: "/fx/slow.json" });
      await wait(220);
      const reMounted = readState(reMount);

      // Retry re-fetches: the fixture fails once then succeeds, so rows can
      // only appear after the click if the click really asked the network
      // again.
      const flakyHost = mk({ src: "/fx/flaky.json", retry: "Try again" });
      await wait(120);
      const flakyFirst = readState(flakyHost);
      const retryBtn = flakyHost.querySelector('[data-action="retry"]');
      let retried = false;
      flakyHost.addEventListener("contour:retry", () => { retried = true; });
      if (retryBtn) retryBtn.click();
      await wait(120);
      const flakyAfter = readState(flakyHost);

      return { byAttr, ok, missing, malformed, loadingWhileConnected, afterDetach, reMounted, flakyFirst, flakyAfter, retried, okBusy, missBusy, slowBusy };
    });
    compared += 18;
    const bad = [];
    const b = out.byAttr;
    // exactly one state node per attribute state; no inline style on any
    if (b.loading.all !== 1 || b.loading.loading !== 1) bad.push(`loading rendered ${b.loading.all} state nodes (${b.loading.loading} .c-readout__loading) — the "Loading…Loading…" double is back`);
    if (b.empty.all !== 1 || b.empty.empty !== 1) bad.push(`empty rendered ${b.empty.all} state nodes (${b.empty.empty} .c-readout__empty)`);
    if (b.error.all !== 1 || b.error.error !== 1) bad.push(`error rendered ${b.error.all} state nodes (${b.error.error} .c-readout__error)`);
    if (!b.retryButton) bad.push("error state with retry attribute rendered no [data-action=retry] button");
    if (b.skeleton.all !== 3 || b.skeleton.skeleton !== 3) bad.push(`skeleton="3" rendered ${b.skeleton.all} state nodes (${b.skeleton.skeleton} .c-skeleton)`);
    if (b.loading.inline + b.empty.inline + b.error.inline + b.skeleton.inline)
      bad.push("a state node carries an inline style — the CSS rule for it is dead (this was the measured defect before the states migration)");
    // success vs failure vocabulary
    if (out.ok.rows < 1 || out.ok.all !== 0) bad.push(`src success left ${out.ok.all} state node(s) and ${out.ok.rows} rows — a loaded host must paint data, not a state`);
    if (out.missing.error !== 1 || out.missing.empty !== 0) bad.push(`src 404 landed on empty (${out.missing.empty}) instead of error (${out.missing.error}) — "No data" on a failure lied`);
    if (out.malformed.error !== 1 || out.malformed.empty !== 0) bad.push(`malformed body landed on empty (${out.malformed.empty}) instead of error (${out.malformed.error})`);
    // abort and retry are falsifications, not presence checks
    if (out.loadingWhileConnected !== 1) bad.push(`slow src did not paint loading while connected (saw ${out.loadingWhileConnected})`);
    if (out.afterDetach.all !== 1 || out.afterDetach.error || out.afterDetach.rows)
      bad.push(`detached host kept being written to (${JSON.stringify(out.afterDetach)}) — leaving the page did not abort the ask`);
    if (out.reMounted.rows < 1) bad.push(`re-mount of an aborted URL did not re-fetch (rows ${out.reMounted.rows}) — the abort either never happened or poisoned the cache`);
    if (out.flakyFirst.error !== 1 || out.flakyAfter.error === 1 || out.flakyAfter.rows < 1 || !out.retried)
      bad.push(`retry did not re-fetch: first ${JSON.stringify(out.flakyFirst)}, after ${JSON.stringify(out.flakyAfter)}, retried=${out.retried} — the fixture turns 200 on the second hit, so rows can only come from a real re-ask`);
    // BY-09's announced half: the host says aria-busy only while an ask is
    // open, and no state node borrows a live region — a region that holds its
    // text at load has no change left to announce, which is why role="alert"
    // was dropped, and the divergence is recorded here as a refusal, not as
    // prose an adopter may not read.
    if (b.loadingBusy !== null) bad.push(`an attribute-only loading state claimed aria-busy (${String(b.loadingBusy)}) — busy belongs to an ask, not to a painted state`);
    if (out.slowBusy !== "true") bad.push(`slow src did not announce aria-busy while in flight (${String(out.slowBusy)}) — the announced half of the error contract`);
    if (out.okBusy !== null || out.missBusy !== null) bad.push(`aria-busy survived settle: ok ${String(out.okBusy)}, 404 ${String(out.missBusy)} — a settled host must stop announcing`);
    if (b.loading.live + b.empty.live + b.error.live + b.skeleton.live)
      bad.push("a state node carries role/aria-live — the recorded divergence is that the error node must NOT re-add role=alert; a region holding its text at load announces nothing");
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    if (bad.length)
      fail(`state contract broke: ${bad.join(" | ")}`);
    else
      console.log(`wc-contract: state contract holds — one node per state, 404/malformed are errors not empties, no inline style on a state node, disconnect aborts, retry re-fetches, aria-busy announces an open ask and drops on settle, and no state node is a live region (${out.ok.rows} ok rows, ${out.flakyAfter.rows} re-fetched rows)`);
  }

  // ---- 13. dialog-family parity -------------------------------------------
  //
  // BY-19. The light dialog, drawer and sheet must expose show()/close() (the
  // dialog also focus()), fire contour:open/contour:close exactly once per
  // transition, and never fire contour:close for a close that did not happen
  // (this was "the unconditional close event"; F-18). The shadow twin must
  // expose the same methods and events — it previously listened for a native
  // `show` event `<dialog>` never fires in this engine, so its events were dead
  // (measured opened:0/closed:0), and after switching to beforetoggle an
  // unguarded listener doubled every dispatch (measured open:2) until the
  // _wired guard landed (open:1/close:1).
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const count = (host, name) => {
        let n = 0;
        host.addEventListener(name, () => { n += 1; });
        return () => n;
      };
      const results = {};

      // Light dialog: methods exist; close() when never opened is silent;
      // show() opens + focuses the close button; close() fires once + clears.
      const dlg = document.createElement("contour-dialog");
      dlg.setAttribute("title", "Move layer");
      dlg.textContent = "Body";
      document.body.appendChild(dlg);
      const dlgOpen = count(dlg, "contour:open");
      const dlgClose = count(dlg, "contour:close");
      const dlgMethods = ["show", "close", "focus"].map((m) => typeof dlg[m] === "function");
      dlg.close(); // never opened — must be a non-event
      const dlgSilent = dlgClose();
      dlg.show();
      const dlgOpened = dlgOpen();
      const dlgHasOpen = dlg.hasAttribute("open");
      const dlgFocusIn = document.activeElement === dlg.querySelector(".c-dialog__close");
      dlg.close();
      const dlgClosed = dlgClose();
      const dlgCleared = !dlg.hasAttribute("open");
      results.dialog = { dlgMethods, dlgSilent, dlgOpened, dlgHasOpen, dlgFocusIn, dlgClosed, dlgCleared };

      // Drawer + sheet: title and close render; show/close events exactly once.
      for (const [tag, selTitle, selClose] of [
        ["contour-drawer", ".c-drawer__title", ".c-drawer__close"],
        ["contour-sheet", ".c-sheet__title", ".c-sheet__close"],
      ]) {
        const el = document.createElement(tag);
        el.setAttribute("title", "Drawer");
        document.body.appendChild(el);
        const open = count(el, "contour:open");
        const close = count(el, "contour:close");
        el.close(); // never opened — silent
        const silent = close();
        el.show();
        const opened = open();
        const isOpen = el.classList.contains("is-open");
        el.close();
        const closed = close();
        results[tag] = {
          title: el.querySelector(selTitle) ? el.querySelector(selTitle).textContent : null,
          closeBtn: !!el.querySelector(selClose),
          silent, opened, isOpen, closed,
        };
      }

      // Shadow twin: same methods; show()/close() fire open/close exactly once.
      const sw = document.createElement("contour-shadow-dialog");
      sw.innerHTML = "<span slot=title>Title</span><p>Body</p>";
      document.body.appendChild(sw);
      const swMethods = ["show", "close"].map((m) => typeof sw[m] === "function");
      const swOpen = count(sw, "contour:open");
      const swClose = count(sw, "contour:close");
      sw.show();
      const swOpened = swOpen();
      sw.close();
      const swClosed = swClose();
      results.shadow = { swMethods, swOpened, swClosed };

      // Native-dialog parity (R20 T-32): showModal(), the open property and
      // returnValue on all three light hosts and the shadow twin. The open
      // setter must route through show()/close() so the events still fire
      // exactly once per transition.
      const parity = {};
      for (const tag of ["contour-dialog", "contour-drawer", "contour-sheet"]) {
        const el = document.createElement(tag);
        el.setAttribute("title", "Parity");
        document.body.appendChild(el);
        const opens = count(el, "contour:open");
        const closes = count(el, "contour:close");
        const hasShowModal = typeof el.showModal === "function";
        el.showModal();
        const afterShowModal = { open: el.open === true, attr: el.hasAttribute("open"), modal: el.getAttribute("aria-modal") === "true", events: opens() };
        el.returnValue = "chosen";
        el.open = false;
        const afterPropClose = { open: el.open === false, events: closes(), returnValue: el.returnValue };
        el.open = true;
        const afterPropOpen = { open: el.open === true, events: opens() };
        el.close();
        parity[tag] = { hasShowModal, afterShowModal, afterPropClose, afterPropOpen };
        el.remove();
      }
      const sw2 = document.createElement("contour-shadow-dialog");
      sw2.innerHTML = "<span slot=title>T</span><p>B</p>";
      document.body.appendChild(sw2);
      const sw2Open = count(sw2, "contour:open");
      const sw2Close = count(sw2, "contour:close");
      const swHasShowModal = typeof sw2.showModal === "function";
      sw2.showModal();
      const swAfterShowModal = { open: sw2.open === true, events: sw2Open() };
      sw2.returnValue = "picked";
      const swReturn = sw2.returnValue;
      sw2.open = false;
      const swAfterClose = { open: sw2.open === false, events: sw2Close(), returnValue: sw2.returnValue };
      parity.shadow = { swHasShowModal, swAfterShowModal, swReturn, swAfterClose };
      sw2.remove();
      results.parity = parity;

      return results;
    });
    const bad = [];
    const d = out.dialog;
    if (!d.dlgMethods.every(Boolean)) bad.push("light dialog lacks show/close/focus methods");
    if (d.dlgSilent !== 0) bad.push(`close() on a never-opened dialog dispatched contour:close ${d.dlgSilent} time(s) — the unconditional close event is back`);
    if (d.dlgOpened !== 1 || !d.dlgHasOpen) bad.push(`show() dispatched contour:open ${d.dlgOpened} time(s), open attr ${d.dlgHasOpen}`);
    if (!d.dlgFocusIn) bad.push("show() did not focus the dialog's own close button");
    if (d.dlgClosed !== 1 || !d.dlgCleared) bad.push(`close() fired ${d.dlgClosed} contour:close, cleared ${d.dlgCleared}`);
    for (const tag of ["contour-drawer", "contour-sheet"]) {
      const r = out[tag];
      if (r.title !== "Drawer" || !r.closeBtn) bad.push(`${tag} did not render its title/close`);
      if (r.silent !== 0 || r.opened !== 1 || r.closed !== 1 || !r.isOpen) bad.push(`${tag} lifecycle: ${JSON.stringify(r)}`);
    }
    const s = out.shadow;
    if (!s.swMethods.every(Boolean)) bad.push("shadow dialog lacks show/close methods");
    if (s.swOpened !== 1 || s.swClosed !== 1) bad.push(`shadow dialog fired open ${s.swOpened}/close ${s.swClosed} — dead or doubled events`);
    for (const tag of ["contour-dialog", "contour-drawer", "contour-sheet"]) {
      const q = out.parity[tag];
      if (!q.hasShowModal) bad.push(`${tag} lacks showModal()`);
      if (!q.afterShowModal.open || !q.afterShowModal.attr || !q.afterShowModal.modal || q.afterShowModal.events !== 1)
        bad.push(`${tag} showModal() did not open modally once: ${JSON.stringify(q.afterShowModal)}`);
      if (!q.afterPropClose.open || q.afterPropClose.events !== 1 || q.afterPropClose.returnValue !== "chosen")
        bad.push(`${tag} open=false / returnValue: ${JSON.stringify(q.afterPropClose)}`);
      if (!q.afterPropOpen.open || q.afterPropOpen.events !== 2)
        bad.push(`${tag} open=true did not re-open through show(): ${JSON.stringify(q.afterPropOpen)}`);
    }
    const q = out.parity.shadow;
    if (!q.swHasShowModal) bad.push("shadow dialog lacks showModal()");
    if (!q.swAfterShowModal.open || q.swAfterShowModal.events !== 1) bad.push(`shadow showModal(): ${JSON.stringify(q.swAfterShowModal)}`);
    if (q.swReturn !== "picked") bad.push(`shadow returnValue read back ${JSON.stringify(q.swReturn)}`);
    if (!q.swAfterClose.open || q.swAfterClose.events !== 1 || q.swAfterClose.returnValue !== "picked")
      bad.push(`shadow open=false / returnValue persistence: ${JSON.stringify(q.swAfterClose)}`);
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    compared += 37;
    if (bad.length)
      fail(`dialog-family parity broke: ${bad.join(" | ")}`);
    else
      console.log("wc-contract: dialog family exposes the same methods/events in light and shadow, and never reports an unconditional close");
  }

  // ---- 14. modal containment (BY-46) --------------------------------------
  //
  // Opening a LIGHT dialog/drawer/sheet must lock the document and make the
  // background inert (a native <dialog> in showModal gets that from the
  // platform; the light components have no platform modal). The lock must be
  // stacked (the second open cannot unlock the first close), survive a
  // re-render that restores the authored class, and put the scroll position
  // back on close — plan §7: "open light dialog, assert
  // document.documentElement.style.overflow flipped and restored on close".
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const lockState = () => document.documentElement.style.overflow;
      const inerted = () => Array.from(document.body.children).filter((el) => el.inert).length;
      const results = {};

      // dialog: open locks + inerts the sibling background; close restores.
      const dlg = document.createElement("contour-dialog");
      dlg.setAttribute("title", "Move layer");
      document.body.appendChild(dlg);
      dlg.show();
      const dlLocked = lockState();
      const dlInert = inerted();
      dlg.close();
      results.dialog = { dlLocked, dlInert, dlRestored: lockState(), dlInertAfter: inerted() };

      // drawer: same, and a re-render (title change) must not drop the lock or
      // the open state, because the base restores the authored class on render.
      const dr = document.createElement("contour-drawer");
      dr.setAttribute("title", "Drawer");
      document.body.appendChild(dr);
      dr.show();
      dr.setAttribute("title", "Renamed");
      await wait(30);
      results.drawer = { locked: lockState(), inert: inerted(), open: dr.hasAttribute("open"), isOpen: dr.classList.contains("is-open") };
      dr.close();
      results.drawer.afterClose = { locked: lockState(), inert: inerted(), open: dr.hasAttribute("open") };

      // stacking: two open, close one, the page stays locked until both close.
      const a = document.createElement("contour-dialog");
      a.setAttribute("title", "A");
      const b = document.createElement("contour-dialog");
      b.setAttribute("title", "B");
      document.body.appendChild(a);
      document.body.appendChild(b);
      a.show();
      b.show();
      a.close(); // still one open
      const stackMid = { locked: lockState(), inert: inerted() };
      b.close();
      results.stack = { mid: stackMid, final: { locked: lockState(), inert: inerted() } };

      return results;
    });
    const bad = [];
    if (out.dialog.dlLocked !== "hidden") bad.push(`dialog show() did not lock the document (overflow=${JSON.stringify(out.dialog.dlLocked)})`);
    if (out.dialog.dlInert < 1) bad.push(`dialog show() inerted ${out.dialog.dlInert} background siblings`);
    if (out.dialog.dlRestored !== "") bad.push(`dialog close() left overflow=${JSON.stringify(out.dialog.dlRestored)}`);
    if (out.dialog.dlInertAfter !== 0) bad.push(`dialog close() left ${out.dialog.dlInertAfter} inert siblings`);
    if (out.drawer.locked !== "hidden" || !out.drawer.open || !out.drawer.isOpen)
      bad.push(`drawer state after re-render: locked=${JSON.stringify(out.drawer.locked)}, open=${out.drawer.open}, isOpen=${out.drawer.isOpen}`);
    if (out.drawer.inert < 1) bad.push(`drawer show() inerted ${out.drawer.inert} siblings`);
    if (out.drawer.afterClose.locked !== "" || out.drawer.afterClose.open) bad.push(`drawer close() left locked=${JSON.stringify(out.drawer.afterClose.locked)}, open=${out.drawer.afterClose.open}`);
    if (out.stack.mid.locked !== "hidden") bad.push("closing one of two open surfaces unlocked the document");
    if (out.stack.final.locked !== "" || out.stack.final.inert !== 0) bad.push(`after both closed: locked=${JSON.stringify(out.stack.final.locked)}, inert=${out.stack.final.inert}`);
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    compared += 12;
    if (bad.length)
      fail(`modal containment broke (BY-46): ${bad.join(" | ")}`);
    else
      console.log("wc-contract: light dialog/drawer/sheet lock the document and inert the background on open, restore on close (stacked, re-render safe)");
  }

  // ---- 15. focus-exposed mark readout (BY-39) ------------------------------
  //
  // A chart/map mark that receives focus must show the same tooltip a hover
  // shows, and that tip must be labelled `role="tooltip"` — F-23 measured all
  // tips mouse-only with role=0. The marks carry roving tabindex; this arm
  // focuses one and asserts the tip appears, exposed and named.
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const mk = (name, attrs) => {
        const host = document.createElement(name);
        for (const [k, v] of Object.entries(attrs)) host.setAttribute(k, v);
        document.body.appendChild(host);
        return host;
      };
      const readTip = (host, sel) => {
        const tip = host.querySelector(sel);
        return tip ? { visible: !tip.hasAttribute("hidden"), role: tip.getAttribute("role") } : null;
      };
      const results = {};

      // chart: focus a point -> the tip shows with role=tooltip; blur hides.
      const chart = mk("contour-chart", { series: '[{"label":"A","values":[1,2,3]}]', title: "T" });
      const point = chart.querySelector(".c-chart__point");
      point?.focus();
      results.chart = { focused: !!point, ...readTip(chart, ".c-chart__tooltip") };
      point?.blur();
      results.chart.afterBlur = readTip(chart, ".c-chart__tooltip");

      // heatmap: focus a cell.
      const heat = mk("contour-heatmap", { cells: "4", values: "[1,2,3,4]" });
      heat.querySelector(".c-heatmap__cell")?.focus();
      results.heatmap = { ...readTip(heat, ".c-heatmap__tooltip") };

      // hexbin: focus a cell.
      const hex = mk("contour-hexbin", { cells: '[1,2,3,4]' });
      hex.querySelector(".c-hexbin__cell")?.focus();
      results.hexbin = { ...readTip(hex, ".c-hexbin__tooltip") };

      // sparkline: the host itself is the focusable surface.
      const spark = mk("contour-sparkline", { points: "[0.2,0.6,0.9]" });
      spark.focus();
      results.sparkline = { ...readTip(spark, ".c-sparkline__tooltip") };

      return results;
    });
    const bad = [];
    const expect = (label, r) => {
      if (!r || r.visible !== true || r.role !== "tooltip")
        bad.push(`${label} focus did not expose a role=tooltip tip: ${JSON.stringify(r)}`);
    };
    expect("chart", out.chart);
    expect("heatmap", out.heatmap);
    expect("hexbin", out.hexbin);
    expect("sparkline", out.sparkline);
    if (out.chart.afterBlur && out.chart.afterBlur.visible === true)
      bad.push(`chart blur left the tip visible (${JSON.stringify(out.chart.afterBlur)})`);
    const missingFocus = Object.entries(out).filter(([, r]) => r && r.focused === false).map(([k]) => k);
    if (missingFocus.length) bad.push(`no focusable mark found in: ${missingFocus.join(", ")}`);
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    compared += 12;
    if (bad.length)
      fail(`focus-exposed mark readout broke (BY-39): ${bad.join(" | ")}`);
    else
      console.log("wc-contract: focusing a chart/map mark exposes its tooltip as a role=tooltip, and blur hides it");
  }

  // ---- 16. map event vocabulary (BY-22) -----------------------------------
  //
  // F-8 measured map.mjs at 0 dispatchEvent / 0 CustomEvent: the layer-panel
  // toggles, layer-switch, map-area controls and the compass generated
  // controls that could not switch anything. Each arm performs the one
  // interaction the component offers and asserts the matching contour:* event
  // arrived with the right detail, composed=true (the data family's own flag,
  // which is what a consumer wrapping contour in a shadow tree depends on).
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const mk = (name, attrs) => {
        const host = document.createElement(name);
        for (const [k, v] of Object.entries(attrs)) host.setAttribute(k, v);
        document.body.appendChild(host);
        return host;
      };
      const heard = (host, eventName) => {
        let detail = null;
        let composed = null;
        host.addEventListener(eventName, (e) => { detail = e.detail; composed = e.composed; });
        return () => ({ detail, composed });
      };
      const results = {};

      {
        const host = mk("contour-layer-panel", { label: "Layers", items: '[{"name":"Roads","visible":true}]' });
        const read = heard(host, "contour:layer-visibility");
        const toggle = host.querySelector(".c-layer-panel__toggle");
        toggle.checked = false;
        toggle.dispatchEvent(new Event("change", { bubbles: true }));
        results.layerVisibility = read();
      }
      {
        const host = mk("contour-layer-switch", { items: '["A","B"]' });
        const read = heard(host, "contour:layer-toggle");
        host.querySelector(".c-layer-switch__toggle").click();
        results.layerToggle = read();
      }
      {
        const host = mk("contour-map-area", { controls: '[{"label":"Zoom in"}]' });
        const read = heard(host, "contour:map-control");
        host.querySelector(".c-map-slot__control").click();
        results.mapControl = read();
      }
      {
        const host = mk("contour-compass", { label: "Compass", needle: "45" });
        const read = heard(host, "contour:bearing");
        host.querySelector(".c-compass__label--e").click();
        results.bearing = read();
      }

      return results;
    });
    const bad = [];
    const rv = out.layerVisibility;
    if (!rv || rv.detail?.name !== "Roads" || rv.detail?.visible !== false)
      bad.push(`layer-panel visibility ${JSON.stringify(rv)}`);
    const lt = out.layerToggle;
    if (!lt || lt.detail?.name !== "A") bad.push(`layer-switch toggle ${JSON.stringify(lt)}`);
    const mc = out.mapControl;
    if (!mc || mc.detail?.control !== "Zoom in") bad.push(`map-area control ${JSON.stringify(mc)}`);
    const br = out.bearing;
    if (!br || br.detail?.direction !== "e" || br.detail?.degrees !== 90) bad.push(`compass bearing ${JSON.stringify(br)}`);
    for (const [k, r] of Object.entries(out)) {
      if (r && r.composed !== true) bad.push(`${k} not composed=true: ${JSON.stringify(r)}`);
    }
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    compared += 8;
    if (bad.length)
      fail(`map event vocabulary broke (BY-22): ${bad.join(" | ")}`);
    else
      console.log("wc-contract: layer-panel/layer-switch/map-area/compass all emit their contour:* events with composed=true");
  }

  // ---- 17. form value events (BY-44) --------------------------------------
  //
  // The form family had 16 user-interaction listeners and 0 dispatchEvent, so
  // a consumer could not observe a change without polling (plan §7: "change a
  // contour-switch, assert contour:change with the composite's own state").
  // Each arm performs the one interaction a component offers and asserts the
  // matching contour:input / contour:change arrived with {name, value, checked}
  // drawn from the same state the entry list carries, composed=true.
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const mk = (name, attrs) => {
        const host = document.createElement(name);
        for (const [k, v] of Object.entries(attrs)) host.setAttribute(k, v);
        document.body.appendChild(host);
        return host;
      };
      const heard = (host, eventName) => {
        let detail = null;
        let composed = null;
        host.addEventListener(eventName, (e) => { detail = e.detail; composed = e.composed; });
        return () => ({ detail, composed });
      };
      const results = {};

      // switch: click flips checked -> contour:change {name, value:"on", checked}
      {
        const host = mk("contour-switch", { label: "WiFi", name: "sw" });
        const read = heard(host, "contour:change");
        host.querySelector("input").click();
        results.switch = read();
      }
      // check: click -> contour:change {name, value, checked}
      {
        const host = mk("contour-check", { label: "Agree", name: "agree", value: "yes" });
        const read = heard(host, "contour:change");
        host.querySelector("input").click();
        results.check = read();
      }
      // input: typing -> contour:input AND contour:change
      {
        const host = mk("contour-input", { name: "q", value: "default" });
        const readIn = heard(host, "contour:input");
        const readCh = heard(host, "contour:change");
        const inp = host.querySelector("input");
        inp.value = "typed";
        inp.dispatchEvent(new Event("input", { bubbles: true }));
        const gotInput = readIn();
        inp.dispatchEvent(new Event("change", { bubbles: true }));
        const gotChange = readCh();
        results.input = { gotInput, gotChange };
      }
      // radio: click -> contour:change {name, value, checked}
      {
        const host = mk("contour-radio", { name: "g", value: "a", label: "A" });
        const read = heard(host, "contour:change");
        host.querySelector("input").click();
        results.radio = read();
      }
      // radio-list: click x then ArrowDown -> change with x, then with z
      {
        const host = mk("contour-radio-list", { name: "opt", items: '[{"label":"X","value":"x"},{"label":"Y","value":"y"},{"label":"Z","value":"z","checked":true}]' });
        const read = heard(host, "contour:change");
        const radios = Array.from(host.querySelectorAll("input"));
        radios.find((r) => r.value === "x").click();
        const afterClick = read();
        const y = radios.find((r) => r.value === "y");
        y.focus();
        y.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
        const afterArrow = read();
        results.radioList = { afterClick, afterArrow };
      }

      return results;
    });
    const bad = [];
    const check = (label, r, wantDetail) => {
      if (!r || r.composed !== true || !r.detail) bad.push(`${label} ${JSON.stringify(r)}`);
      else if (wantDetail && Object.keys(wantDetail).some((k) => wantDetail[k] !== null && r.detail[k] !== wantDetail[k]))
        bad.push(`${label} detail ${JSON.stringify(r.detail)} != ${JSON.stringify(wantDetail)}`);
    };
    check("switch", out.switch, { name: "sw", value: "on", checked: true });
    check("check", out.check, { name: "agree", value: "yes", checked: true });
    check("input-input", out.input?.gotInput, { name: "q", value: "typed", checked: null });
    check("input-change", out.input?.gotChange, { name: "q", value: "typed", checked: null });
    check("radio", out.radio, { name: "g", value: "a", checked: true });
    check("radioList-click", out.radioList?.afterClick, { name: "opt", value: "x", checked: true });
    check("radioList-arrow", out.radioList?.afterArrow, { name: "opt", value: "z", checked: true });
    if (out.radioList?.afterArrow?.detail?.value === out.radioList?.afterClick?.detail?.value)
      bad.push("radio-list arrow onto the same radio fired contour:change (wrap-around is not a change)");
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    compared += 12;
    if (bad.length)
      fail(`form value events broke (BY-44): ${bad.join(" | ")}`);
    else
      console.log("wc-contract: the form family emits contour:input/contour:change with {name, value, checked} and composed=true");
  }

  // ---- 18. viewport visibility events (BY-42) ------------------------------
  //
  // watchViewport is a page-side ESM export: a dashboard that does its own
  // ink work imports it the way this arm does (never a window.* guess). The
  // loader's remoteVisible is one-shot and internal; enter+leave both halves
  // must fire, driven by a real boundary crossing.
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const { watchViewport } = await import("/wc-esm.js");
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const host = document.createElement("div");
      host.style.position = "absolute";
      host.style.inlineSize = "120px";
      host.style.blockSize = "120px";
      document.body.appendChild(host);
      const events = [];
      host.addEventListener("contour:view-enter", () => events.push("enter"));
      host.addEventListener("contour:view-leave", () => events.push("leave"));
      watchViewport(host);
      await wait(100);
      const afterMount = events.slice();
      host.style.top = "-5000px";
      await wait(100);
      const afterLeave = events.slice();
      host.style.top = "0px";
      await wait(100);
      const afterReenter = events.slice();
      return { hasExport: typeof watchViewport === "function", afterMount, afterLeave, afterReenter };
    });
    const bad = [];
    if (!out.hasExport) bad.push("watchViewport is not exported from the ESM bundle");
    if (out.afterMount.join() !== "enter") bad.push(`mount did not fire view-enter alone: ${JSON.stringify(out.afterMount)}`);
    if (out.afterLeave.join() !== "enter,leave") bad.push(`leaving the viewport did not fire view-leave: ${JSON.stringify(out.afterLeave)}`);
    if (out.afterReenter.join() !== "enter,leave,enter") bad.push(`re-entering did not fire view-enter again: ${JSON.stringify(out.afterReenter)}`);
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    compared += 8;
    if (bad.length)
      fail(`viewport visibility events broke (BY-42): ${bad.join(" | ")}`);
    else
      console.log("wc-contract: watchViewport exports and fires contour:view-enter/view-leave across a real boundary crossing");
  }

  // ---- 19. ARIA parity, loader cache policy, copy confirmation (BY-25/43/47) ----
  //
  // Three rows, one arm, each measured against the shipped bundle. The cache
  // half uses a counting route: a cached mount must not move the count, a
  // no-cache mount must, a fresh cache-key must open its own slot, the same
  // key must hit, and remoteInvalidate must make the next ask re-fetch. The
  // copy half clicks the real generated trigger, not a hand-built stub.
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const { loadRemote, remoteData, remoteInvalidate } = await import("/wc-esm.js");
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const results = {};
      // BY-25 alert: the variant decides the live-region pair. An information
      // alert speaks politely; warning/danger interrupts. Both are measured,
      // because asserting only one half lets "every alert is assertive" return.
      const infoAlert = document.createElement("contour-alert");
      infoAlert.setAttribute("variant", "info");
      infoAlert.setAttribute("title", "Heads up");
      infoAlert.setAttribute("body", "Message");
      document.body.appendChild(infoAlert);
      const urgentAlert = document.createElement("contour-alert");
      urgentAlert.setAttribute("variant", "danger");
      urgentAlert.setAttribute("title", "Failed");
      urgentAlert.setAttribute("body", "Message");
      document.body.appendChild(urgentAlert);
      await wait(30);
      results.alertInfoRole = infoAlert.getAttribute("role");
      results.alertInfoLive = infoAlert.getAttribute("aria-live");
      results.alertUrgentRole = urgentAlert.getAttribute("role");
      results.alertUrgentLive = urgentAlert.getAttribute("aria-live");
      // BY-25 field: input linked to both messages; required reflected.
      const field = document.createElement("contour-field");
      field.setAttribute("label", "Name");
      field.setAttribute("hint", "Full name");
      field.setAttribute("error", "Required");
      field.setAttribute("required", "");
      document.body.appendChild(field);
      await wait(30);
      const input = field.querySelector("input");
      results.describedBy = input ? input.getAttribute("aria-describedby") : null;
      results.hintErrLinked = (results.describedBy || "").split(" ").filter(Boolean).length >= 2;
      results.ariaRequired = input ? input.getAttribute("aria-required") : null;
      // BY-25 faq: generated disclosure is native details/summary and toggles.
      const faq = document.createElement("contour-faq");
      faq.setAttribute("question", "What is it?");
      faq.setAttribute("answer", "A design system.");
      document.body.appendChild(faq);
      await wait(30);
      const details = faq.querySelector(".c-faq__item");
      results.faqDetails = details ? details.tagName : null;
      results.faqSummary = details ? details.querySelector(":scope > .c-faq__question").tagName : null;
      results.faqOpenBefore = details ? details.hasAttribute("open") : null;
      if (details) { details.querySelector(":scope > .c-faq__question").click(); await wait(30); }
      results.faqOpenAfter = details ? details.hasAttribute("open") : null;
      // BY-43: cache policy on the counting route.
      const host = (src, extra) => {
        const h = document.createElement("div");
        // The loader settles with `host.requestRender()` (ContourBase's own
        // method); a harness host must provide the same surface or the settle
        // throws before the cache write the arm is measuring.
        h.requestRender = () => {};
        h.setAttribute("src", src);
        for (const [k, v] of Object.entries(extra || {})) h.setAttribute(k, v);
        document.body.appendChild(h);
        return h;
      };
      const waitData = async (h, ms = 500) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = remoteData(h, "value"); if (v !== null && v !== undefined) return v; await wait(20); } return null; };
      const a = host("/fx/count.json");
      loadRemote(a, "value");
      results.aValue = await waitData(a);
      const b = host("/fx/count.json");
      loadRemote(b, "value");
      results.bValue = await waitData(b);
      const c = host("/fx/count.json", { "no-cache": "" });
      loadRemote(c, "value");
      results.cValue = await waitData(c);
      const d = host("/fx/count.json", { "cache-key": "tenant-a" });
      loadRemote(d, "value");
      results.dValue = await waitData(d);
      const e = host("/fx/count.json", { "cache-key": "tenant-a" });
      loadRemote(e, "value");
      results.eValue = await waitData(e);
      remoteInvalidate("/fx/count.json");
      const f = host("/fx/count.json");
      loadRemote(f, "value");
      results.fValue = await waitData(f);
      // BY-30 carve-out: a unit-less value still gets a unit on the scale bar.
      const bar = document.createElement("contour-scale-bar");
      bar.setAttribute("label", "1 km");
      bar.setAttribute("value", "120");
      document.body.appendChild(bar);
      await wait(30);
      const line = bar.querySelector(".c-scale-bar__line");
      results.scaleInline = line ? line.style.inlineSize : null;
      // BY-47: the copy trigger confirms and still emits for the page to toast.
      const install = document.createElement("contour-install");
      install.setAttribute("command", "npm i contour-ds");
      install.setAttribute("copyable", "");
      document.body.appendChild(install);
      await wait(30);
      const btn = install.querySelector(".c-install__copy");
      const heard = [];
      install.addEventListener("contour:copy", (ev) => heard.push(ev.detail.text));
      if (btn) btn.click();
      await wait(120);
      results.copied = btn ? btn.dataset.copied : null;
      results.copyLabel = btn ? btn.getAttribute("aria-label") : null;
      results.copyEvent = heard;
      return results;
    });
    const bad = [];
    if (out.alertInfoRole !== "status") bad.push(`info alert role=${String(out.alertInfoRole)} (want status)`);
    if (out.alertInfoLive !== "polite") bad.push(`info alert aria-live=${String(out.alertInfoLive)} (want polite)`);
    if (out.alertUrgentRole !== "alert") bad.push(`danger alert role=${String(out.alertUrgentRole)} (want alert)`);
    if (out.alertUrgentLive !== "assertive") bad.push(`danger alert aria-live=${String(out.alertUrgentLive)} (want assertive)`);
    if (!out.hintErrLinked) bad.push(`field aria-describedby=${String(out.describedBy)} (want hint+error ids)`);
    if (out.ariaRequired !== "true") bad.push(`field aria-required=${String(out.ariaRequired)} (want true)`);
    if (out.faqDetails !== "DETAILS") bad.push(`faq item tag=${String(out.faqDetails)} (want DETAILS)`);
    if (out.faqSummary !== "SUMMARY") bad.push(`faq summary tag=${String(out.faqSummary)} (want SUMMARY)`);
    if (!(out.faqOpenBefore === true && out.faqOpenAfter === false)) bad.push(`faq open toggled ${out.faqOpenBefore}->${out.faqOpenAfter} (want true->false)`);
    if (!(out.bValue !== null && out.aValue === out.bValue)) bad.push(`cache: second mount re-fetched (${out.aValue} vs ${out.bValue}) — the shared cache must paint without a new request`);
    if (!(out.cValue !== null && out.cValue !== out.bValue)) bad.push(`cache: no-cache mount did not refetch (${out.bValue} vs ${out.cValue})`);
    if (!(out.dValue !== null && out.dValue !== out.cValue)) bad.push(`cache: cache-key did not open a fresh slot (${out.cValue} vs ${out.dValue})`);
    if (out.eValue !== out.dValue) bad.push(`cache: same cache-key re-fetched (${out.dValue} vs ${out.eValue})`);
    if (!(out.fValue !== null && out.fValue !== out.eValue)) bad.push(`cache: remoteInvalidate did not drop the entry (${out.eValue} vs ${out.fValue})`);
    if (out.scaleInline !== "120px") bad.push(`scale-bar inline-size=${String(out.scaleInline)} (want "120px" from a unit-less 120)`);
    if (out.copied !== "true" && out.copied !== "false") bad.push(`copy data-copied=${String(out.copied)} (want "true"/"false" after the write settles)`);
    if (out.copyLabel !== "Copied" && out.copyLabel !== "Copy failed") bad.push(`copy label=${String(out.copyLabel)}`);
    if (out.copyEvent.join() !== "npm i contour-ds") bad.push(`contour:copy detail=${JSON.stringify(out.copyEvent)} (want the copied command)`);
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    compared += 15;
    if (bad.length)
      fail(`ARIA parity, loader cache policy or copy confirmation broke (BY-25/43/47): ${bad.join(" | ")}`);
    else
      console.log("wc-contract: alert/field/faq ARIA, loader no-cache/cache-key/remoteInvalidate and copy confirmation all measured");
  }

  // ---- 20. streaming chart, legend selector, time-slider, resizable (BY-27/40/41) ----
  //
  // Four components, one pass — the rows share the event vocabulary and the
  // §23 table, so they land together. Every claim is measured on the shipped
  // bundle: the streaming chart must tick on its cadence and stop on pause,
  // a selectable legend must render buttons and toggle aria-pressed with an
  // event, the time-slider must advance the track while playing and announce
  // each move, and the resizable must honour direction and move a pane on a
  // drag.
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const results = {};
      // BY-40: streaming chart ticks on interval and pauses. The startup
      // stream-state fires synchronously during mount (the first render's
      // enhance), so a listener attached after appendChild would miss the
      // running:true it is trying to prove — attach first, as a consumer
      // who wants the startup event must.
      const chart = document.createElement("contour-streaming-chart");
      chart.setAttribute("interval", "0.5");
      const chartEvents = [];
      chart.addEventListener("contour:stream-state", (e) => chartEvents.push(["state", e.detail && e.detail.running]));
      chart.addEventListener("contour:tick", (e) => chartEvents.push(["tick", e.detail && e.detail.frame]));
      document.body.appendChild(chart);
      await wait(1250);
      const chartRunning = chartEvents.slice();
      chart.setAttribute("pause", "");
      await wait(1250);
      const chartPaused = chartEvents.slice();
      results.ticksWhileRunning = chartRunning.filter((e) => e[0] === "tick").length;
      results.stateStarted = chartRunning.some((e) => e[0] === "state" && e[1] === true);
      results.ticksAfterPause = chartPaused.filter((e) => e[0] === "tick").length - results.ticksWhileRunning;
      // BY-41: a selectable legend renders buttons and toggles with an event.
      const legend = document.createElement("contour-legend");
      legend.setAttribute("selectable", "");
      legend.setAttribute("items", JSON.stringify([{ label: "Routes", color: "#0af" }, { label: "Faces", key: "faces" }]));
      document.body.appendChild(legend);
      await wait(50);
      const buttons = Array.from(legend.querySelectorAll(".c-legend__item"));
      results.legendButtons = buttons.length;
      results.legendPressedBefore = buttons[0] ? buttons[0].getAttribute("aria-pressed") : null;
      const heard = [];
      legend.addEventListener("contour:legend-toggle", (e) => heard.push(e.detail));
      if (buttons[0]) buttons[0].click();
      await wait(20);
      results.legendPressedAfter = buttons[0] ? buttons[0].getAttribute("aria-pressed") : null;
      results.legendEvent = heard[0] || null;
      // BY-27: time-slider play advances the track and announces each move.
      const slider = document.createElement("contour-time-slider");
      slider.setAttribute("label", "Sim time");
      document.body.appendChild(slider);
      await wait(50);
      const track = slider.querySelector(".c-time-slider__track");
      const play = slider.querySelector(".c-time-slider__play");
      const starts = [];
      slider.addEventListener("contour:time-change", (e) => starts.push(e.detail && e.detail.value));
      results.sliderValueBefore = track ? track.value : null;
      if (play) play.click();
      await wait(1150);
      // Re-query: the playhead writes `value` back each tick, and a re-render
      // rebuilds generated nodes — the contract is about the LIVE track.
      results.sliderValueAfter = slider.querySelector(".c-time-slider__track")?.value ?? null;
      results.timeChanges = starts.length;
      slider.querySelector(".c-time-slider__play")?.click();
      // BY-27: resizable honours direction and moves a pane on a drag.
      const res = document.createElement("contour-resizable");
      res.setAttribute("direction", "vertical");
      document.body.appendChild(res);
      await wait(50);
      results.resVertical = res.classList.contains("c-resizable--vertical");
      const handle = res.querySelector(".c-resize-handle");
      const pane1 = res.querySelector(".c-resizable__pane");
      results.paneFlexBefore = pane1 ? pane1.style.flex : null;
      const rect = res.getBoundingClientRect();
      if (handle && pane1) {
        // The resizable listens on its host, so the drag sequence must bubble
        // from inside it — dispatching on `document` would never reach it.
        const opts = { bubbles: true, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 4, pointerId: 7 };
        handle.dispatchEvent(new PointerEvent("pointerdown", opts));
        handle.dispatchEvent(new PointerEvent("pointermove", { ...opts, clientY: rect.top + rect.height / 2 }));
        handle.dispatchEvent(new PointerEvent("pointerup", { ...opts, clientY: rect.top + rect.height / 2 }));
        results.paneFlexAfter = pane1.style.flex;
      }
      return results;
    });
    const bad = [];
    if (!(out.ticksWhileRunning >= 1)) bad.push(`streaming chart emitted ${out.ticksWhileRunning} tick(s) in 1.25 s (want >= 1)`);
    if (out.stateStarted !== true) bad.push(`streaming chart never emitted stream-state running:true`);
    if (out.ticksAfterPause !== 0) bad.push(`streaming chart kept ticking after pause (+${out.ticksAfterPause})`);
    if (out.legendButtons !== 2) bad.push(`selectable legend rendered ${out.legendButtons} items (want 2 buttons)`);
    if (out.legendPressedBefore !== "true" || out.legendPressedAfter !== "false") bad.push(`legend aria-pressed ${out.legendPressedBefore} -> ${out.legendPressedAfter} (want true -> false)`);
    if (!out.legendEvent || out.legendEvent.label !== "Routes" || out.legendEvent.pressed !== false) bad.push(`legend-toggle detail=${JSON.stringify(out.legendEvent)}`);
    if (!(Number(out.sliderValueAfter) > Number(out.sliderValueBefore))) bad.push(`time-slider value ${out.sliderValueBefore} -> ${out.sliderValueAfter} (want advance on play)`);
    if (out.timeChanges < 1) bad.push(`time-slider emitted ${out.timeChanges} contour:time-change (want >= 1)`);
    if (out.resVertical !== true) bad.push(`resizable direction=vertical did not set the vertical class`);
    if (out.paneFlexBefore !== null && out.paneFlexAfter === out.paneFlexBefore) bad.push(`resizable drag did not move the pane (${out.paneFlexBefore} unchanged)`);
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    compared += 11;
    if (bad.length)
      fail(`streaming chart, legend selector, time-slider or resizable broke (BY-27/40/41): ${bad.join(" | ")}`);
    else
      console.log("wc-contract: streaming chart ticks/pauses, selectable legend toggles, time-slider plays, resizable wires direction and drag");
  }

  // ---- 21. drag-and-drop: native DnD + keyboard move (BY-26) ----
  //
  // The drag family was four styled shells with zero wiring. This arm proves
  // the whole contract on the shipped bundle with constructed DragEvents and
  // a real DataTransfer (both constructible in this Chromium): a draggable
  // renders draggable="true" and its dragstart writes text/plain, marks
  // .c-draggable--dragging and announces contour:dragstart; a drop-zone
  // accepts a text/plain payload (--active), refuses a foreign one (--reject)
  // and announces contour:drop on the gesture's end; dragend clears the state;
  // and the keyboard path (HTML5 DnD has none) announces contour:move on
  // ArrowUp/ArrowDown without falling back into contour:activate.
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const results = {};
      const src = document.createElement("contour-draggable");
      src.textContent = "Drag me";
      document.body.appendChild(src);
      const zone = document.createElement("contour-drop-zone");
      zone.setAttribute("label", "Drop here");
      document.body.appendChild(zone);
      await wait(60);
      results.draggableAttr = src.getAttribute("draggable");
      // dragstart: the payload a drop partner reads, the visual state, the event.
      const dt = new DataTransfer();
      const starts = [];
      src.addEventListener("contour:dragstart", (e) => starts.push(e.detail));
      src.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: dt }));
      await wait(20);
      results.payload = dt.getData("text/plain");
      results.dragging = src.classList.contains("c-draggable--dragging");
      results.startDetail = starts[0] || null;
      // dragover accepts the payload; drop reads it and announces contour:drop.
      const drops = [];
      zone.addEventListener("contour:drop", (e) => drops.push(e.detail));
      zone.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt }));
      await wait(20);
      results.zoneActive = zone.classList.contains("c-drop-zone--active");
      results.zoneReject = zone.classList.contains("c-drop-zone--reject");
      zone.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }));
      await wait(20);
      results.dropDetail = drops[0] || null;
      results.activeAfterDrop = zone.classList.contains("c-drop-zone--active");
      // A foreign payload (text/html only) is refused, not accepted.
      const alien = new DataTransfer();
      alien.setData("text/html", "<p>x</p>");
      zone.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: alien }));
      await wait(20);
      results.rejectForeign = zone.classList.contains("c-drop-zone--reject");
      results.activeForeign = zone.classList.contains("c-drop-zone--active");
      // dragend: state cleared + event.
      const ends = [];
      src.addEventListener("contour:dragend", (e) => ends.push(e.detail));
      src.dispatchEvent(new DragEvent("dragend", { bubbles: true, cancelable: true, dataTransfer: dt }));
      await wait(20);
      results.draggingAfterEnd = src.classList.contains("c-draggable--dragging");
      results.endDetail = ends[0] || null;
      // Keyboard path + activate regression.
      const moves = [];
      const acts = [];
      src.addEventListener("contour:move", (e) => moves.push(e.detail));
      src.addEventListener("contour:activate", (e) => acts.push(e.detail));
      src.focus();
      src.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      await wait(20);
      src.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      await wait(20);
      results.moves = moves;
      results.activates = acts.length;
      return results;
    });
    const bad = [];
    if (out.draggableAttr !== "true") bad.push(`draggable attr=${String(out.draggableAttr)} (want "true")`);
    if (out.payload !== "Drag me") bad.push(`dragstart payload=${JSON.stringify(out.payload)} (want "Drag me")`);
    if (out.dragging !== true) bad.push(`dragstart did not add .c-draggable--dragging`);
    if (!out.startDetail || out.startDetail.value !== "Drag me") bad.push(`contour:dragstart detail=${JSON.stringify(out.startDetail)}`);
    if (out.zoneActive !== true || out.zoneReject !== false) bad.push(`dragover active/reject=${out.zoneActive}/${out.zoneReject} (want accepted)`);
    if (!out.dropDetail || out.dropDetail.value !== "Drag me" || out.dropDetail.label !== "Drop here") bad.push(`contour:drop detail=${JSON.stringify(out.dropDetail)}`);
    if (out.activeAfterDrop !== false) bad.push(`drop left the zone active`);
    if (out.rejectForeign !== true || out.activeForeign !== false) bad.push(`foreign payload reject/active=${out.rejectForeign}/${out.activeForeign} (want refused)`);
    if (out.draggingAfterEnd !== false) bad.push(`dragend left .c-draggable--dragging`);
    if (!out.endDetail || out.endDetail.value !== "Drag me") bad.push(`contour:dragend detail=${JSON.stringify(out.endDetail)}`);
    if (out.moves.length !== 1 || out.moves[0].direction !== "down") bad.push(`contour:move ${JSON.stringify(out.moves)} (want one down)`);
    if (out.activates !== 1) bad.push(`Enter activate count=${out.activates} (want 1 — no regression)`);
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    compared += 12;
    if (bad.length)
      fail(`drag-and-drop contract broke (BY-26): ${bad.join(" | ")}`);
    else
      console.log("wc-contract: draggable payload + state, drop-zone accept/reject/clear, keyboard move all measured");
  }

  // ---- 22. custom states: :state(data-invalid/checked/loading) (BY-32) ----
  //
  // The three custom states are published through ElementInternals.states so a
  // consumer's CSS (or accessibility tree) can select a host's state without an
  // attribute round trip: data-invalid on a required-but-empty control,
  // data-checked on a toggled switch/check/radio, data-loading on a host with
  // a request in flight. Measured on the shipped bundle with matches(":state")
  // — the loading half uses the 150 ms slow fixture so the in-flight window is
  // actually observed, not assumed.
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const results = {};
      // data-invalid: a required-empty input resolves, filled it clears.
      const input = document.createElement("contour-input");
      input.setAttribute("required", "");
      input.setAttribute("placeholder", "Required");
      document.body.appendChild(input);
      await wait(40);
      results.invalidEmpty = input.matches(":state(data-invalid)");
      const inner = input.querySelector("input");
      if (inner) { inner.value = "x"; inner.dispatchEvent(new Event("input", { bubbles: true })); inner.dispatchEvent(new Event("change", { bubbles: true })); }
      await wait(20);
      results.invalidFilled = input.matches(":state(data-invalid)");
      // data-checked: a switch resolves after its inner control is toggled.
      const sw = document.createElement("contour-switch");
      sw.setAttribute("label", "S");
      document.body.appendChild(sw);
      await wait(40);
      results.checkedBefore = sw.matches(":state(data-checked)");
      const si = sw.querySelector("input");
      if (si) { si.checked = true; si.dispatchEvent(new Event("change", { bubbles: true })); }
      await wait(20);
      results.checkedAfter = sw.matches(":state(data-checked)");
      // data-loading: a src readout matches during the slow fetch, clears after.
      const rd = document.createElement("contour-readout");
      rd.setAttribute("src", "/fx/slow.json");
      document.body.appendChild(rd);
      await wait(40);
      results.loadingDuring = rd.matches(":state(data-loading)");
      await wait(300);
      results.loadingAfter = rd.matches(":state(data-loading)");
      return results;
    });
    const bad = [];
    if (out.invalidEmpty !== true) bad.push(`required-empty input did not match :state(data-invalid)`);
    if (out.invalidFilled !== false) bad.push(`filled input still matches :state(data-invalid)`);
    if (out.checkedBefore !== false) bad.push(`unchecked switch matches :state(data-checked)`);
    if (out.checkedAfter !== true) bad.push(`checked switch does not match :state(data-checked)`);
    if (out.loadingDuring !== true) bad.push(`in-flight readout does not match :state(data-loading)`);
    if (out.loadingAfter !== false) bad.push(`settled readout still matches :state(data-loading)`);
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    compared += 6;
    if (bad.length)
      fail(`custom states broke (BY-32): ${bad.join(" | ")}`);
    else
      console.log("wc-contract: :state(data-invalid/checked/loading) all resolve on the shipped bundle");
  }

  // ---- 23. a11y semantics the review found with no row (R18-69…R18-80) ----
  //
  // Each assertion here stands for a finding the plan did not carry: an image
  // role that hid focusable marks, live regions on static labels, a radiogroup
  // with five tab stops, a grid of loose buttons, duplicate nav ids, a
  // separator with no range, a table with no caption, and a click path that
  // fired from any descendant. All of it is measured on the shipped bundle.
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const results = {};
      const mount = async (tag, attrs = {}) => {
        const el = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
        document.body.appendChild(el);
        await wait(40);
        return el;
      };

      // (1) Interactive chart/map hosts must not be role=img, and an authored
      // accessible name must survive. Both were measured as broken.
      results.imgRole = [];
      const fixtures = {
        "contour-time-series": { values: "[1,2,3]" },
        "contour-stacked-bar": { segments: '[{"label":"a","value":1}]', values: "[1,2]" },
        "contour-hexbin": { cells: '[{"label":"a"}]' },
        "contour-flow-map": { nodes: '[{"label":"a"}]' },
        "contour-isochrone": { rings: '[{"label":"a"}]' },
        "contour-donut": { items: '[{"label":"a","value":1}]' },
      };
      for (const [tag, attrs] of Object.entries(fixtures)) {
        const el = await mount(tag, { ...attrs, "aria-label": "Author name" });
        results.imgRole.push({ tag, role: el.getAttribute("role"), label: el.getAttribute("aria-label") });
        el.remove();
      }

      // (2) Static labels are not live regions; `live` is the opt-in.
      results.liveRegions = {};
      for (const tag of ["contour-chip", "contour-tag", "contour-pill"]) {
        const plain = await mount(tag, { label: "Static" });
        const live = await mount(tag, { label: "Live", live: "" });
        results.liveRegions[tag] = { plain: plain.getAttribute("role"), live: live.getAttribute("role") };
        plain.remove(); live.remove();
      }

      // (3) A radiogroup is one tab stop, and arrows move the checked state.
      const rt = await mount("contour-rating", { value: "2", max: "5" });
      const stars = Array.from(rt.querySelectorAll(".c-rating__star"));
      results.ratingTabStops = stars.filter((s) => s.getAttribute("tabindex") !== "-1").length;
      stars[1].focus();
      stars[1].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
      await wait(20);
      results.ratingChecked = stars.map((s) => s.getAttribute("aria-checked")).join(",");
      results.ratingLabel = rt.getAttribute("aria-label");
      rt.remove();

      // (4) The calendar is a grid of rows and cells with one tab stop.
      const dp = await mount("contour-date-picker", { value: "2026-11-12" });
      dp.querySelector(".c-date-picker__calendar-toggle").click();
      await wait(60);
      const cal = dp.querySelector(".c-date-picker__calendar");
      results.calendar = {
        rows: cal.querySelectorAll('[role="row"]').length,
        cells: cal.querySelectorAll('[role="gridcell"]').length,
        headers: cal.querySelectorAll('[role="columnheader"]').length,
        tabStops: Array.from(cal.querySelectorAll("button.c-date-picker__calendar-day")).filter((b) => b.getAttribute("tabindex") !== "-1").length,
      };
      dp.remove();

      // (5) Two headers own two ids; each toggle names its own nav.
      const h1 = await mount("contour-header", { brand: "A", links: '[{"label":"x","href":"#x"}]' });
      const h2 = await mount("contour-header", { brand: "B", links: '[{"label":"y","href":"#y"}]' });
      results.headers = [h1, h2].map((h) => {
        const nav = h.querySelector(".c-header__nav");
        const tgl = h.querySelector(".c-header__toggle");
        return { id: nav && nav.id, controls: tgl && tgl.getAttribute("aria-controls") };
      });
      h1.remove(); h2.remove();

      // (6) The separator publishes a finite range and a finite Home/End delta.
      const dh = await mount("contour-drag-handle", { label: "Split", "aria-valuenow": "30", max: "100" });
      let drag = null;
      dh.addEventListener("contour:drag", (e) => { drag = e.detail; });
      dh.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }));
      await wait(20);
      results.dragHandle = { min: dh.getAttribute("aria-valuemin"), max: dh.getAttribute("aria-valuemax"), delta: drag && drag.delta, value: drag && drag.value };
      dh.remove();

      // (7) A generated table carries a caption naming it.
      const tbl = await mount("contour-table", { title: "Routes by day", columns: '["Day","Count"]', rows: '[["Mon",3]]' });
      const cap = tbl.querySelector("table.c-table > caption");
      results.tableCaption = cap ? cap.textContent : null;
      tbl.remove();

      // (8) Only the title row toggles the advanced section.
      const adv = await mount("contour-advanced", { title: "More" });
      let toggles = 0;
      adv.addEventListener("contour:advanced-toggle", () => { toggles++; });
      const inner = document.createElement("button");
      adv.appendChild(inner);
      inner.click();
      await wait(20);
      results.advancedChild = toggles;
      adv.querySelector(".c-advanced__title").click();
      await wait(20);
      results.advancedTitle = toggles;
      adv.remove();

      // (9) The KPI row is a projection of the KPI API, not two attributes.
      const row = await mount("contour-dash-kpi-row", { items: '[{"value":"42","label":"Routes","delta":"+4","unit":"km"}]' });
      const kpi = row.querySelector("contour-kpi");
      results.kpi = { delta: kpi && kpi.getAttribute("delta"), unit: kpi && kpi.getAttribute("unit"), tabindex: kpi && kpi.getAttribute("tabindex") };
      row.remove();

      // (10) The inspector re-renders when `data` changes and renders actions.
      const fi = await mount("contour-feature-inspector", { title: "Parcel", data: '{"a":1}', actions: '["Zoom","Select"]' });
      const first = fi.querySelectorAll(".c-feature-inspector__field").length;
      fi.setAttribute("data", '{"a":1,"b":2}');
      await wait(40);
      results.inspector = { first, after: fi.querySelectorAll(".c-feature-inspector__field").length, actions: fi.querySelectorAll(".c-feature-inspector__action").length };
      fi.remove();

      // (11) One main landmark, and authored children live inside it.
      const app = document.createElement("contour-app");
      app.setAttribute("title", "App");
      const cell = document.createElement("span");
      cell.id = "cell";
      app.appendChild(cell);
      const body = document.createElement("contour-app-body");
      app.appendChild(body);
      document.body.appendChild(app);
      await wait(80);
      results.app = { mains: app.querySelectorAll("main").length, cellInMain: app.querySelector("main").contains(cell), bodyTag: body.querySelector(".c-app-body__main").tagName };
      app.remove();

      // (12) A closable tab does not nest a button inside a button.
      const tabs = await mount("contour-tabs", { tabs: '["One","Two"]', closable: "" });
      const tabEls = Array.from(tabs.querySelectorAll("[role='tab']"));
      results.tabs = {
        count: tabEls.length,
        tag: tabEls[0] ? tabEls[0].tagName : null,
        nestedButton: tabEls.some((t) => t.tagName === "BUTTON" && t.querySelector("button")),
        closeButtons: tabs.querySelectorAll(".c-tabs__close").length,
      };
      tabs.remove();

      return results;
    });
    const bad = [];
    for (const row of out.imgRole) {
      if (row.role === "img") bad.push(`${row.tag} is role=img with interactive content (focusable marks are hidden)`);
      if (row.label !== "Author name") bad.push(`${row.tag} overwrote an authored aria-label with "${row.label}"`);
    }
    for (const [tag, v] of Object.entries(out.liveRegions)) {
      if (v.plain !== null) bad.push(`${tag} is a live region without \`live\` (role=${v.plain})`);
      if (v.live !== "status") bad.push(`${tag}[live] role=${v.live} (want status)`);
    }
    if (out.ratingTabStops !== 1) bad.push(`rating exposes ${out.ratingTabStops} tab stops (want 1)`);
    if (out.ratingChecked !== "false,false,true,false,false") bad.push(`ArrowRight left aria-checked=${out.ratingChecked} (want the third star checked)`);
    if (out.ratingLabel !== "Rating") bad.push(`rating label=${out.ratingLabel} (want the fallback when none is authored)`);
    if (out.calendar.rows < 5 || out.calendar.cells < 28 || out.calendar.headers !== 7) bad.push(`calendar grid=${JSON.stringify(out.calendar)} (want rows, one gridcell per day, 7 columnheaders)`);
    if (out.calendar.tabStops !== 1) bad.push(`calendar exposes ${out.calendar.tabStops} day tab stops (want 1)`);
    if (out.headers[0].id === out.headers[1].id) bad.push(`two headers share the nav id ${out.headers[0].id}`);
    if (out.headers.some((h) => h.controls !== h.id)) bad.push(`header toggle does not control its own nav: ${JSON.stringify(out.headers)}`);
    if (out.dragHandle.min === null || out.dragHandle.max === null) bad.push(`separator range=${JSON.stringify(out.dragHandle)} (want aria-valuemin/max)`);
    if (!Number.isFinite(out.dragHandle.delta)) bad.push(`End delta=${out.dragHandle.delta} (want a finite distance)`);
    if (out.dragHandle.value !== 30) bad.push(`drag detail value=${out.dragHandle.value} (want the current aria-valuenow)`);
    if (out.tableCaption !== "Routes by day") bad.push(`table caption=${JSON.stringify(out.tableCaption)} (want the authored title)`);
    if (out.advancedChild !== 0 || out.advancedTitle !== 1) bad.push(`advanced toggled child=${out.advancedChild} title=${out.advancedTitle} (want 0/1)`);
    if (out.kpi.delta !== "+4" || out.kpi.unit !== "km") bad.push(`KPI row dropped attributes: ${JSON.stringify(out.kpi)}`);
    if (out.kpi.tabindex !== "0") bad.push(`first KPI tabindex=${out.kpi.tabindex} (want a tab stop so the arrow handler can run)`);
    if (out.inspector.after !== 2 || out.inspector.actions !== 2) bad.push(`inspector data/actions=${JSON.stringify(out.inspector)} (want 2 fields after the change, 2 action buttons)`);
    if (out.app.mains !== 1 || !out.app.cellInMain || out.app.bodyTag !== "DIV") bad.push(`app shell=${JSON.stringify(out.app)} (want one main, authored children inside it, and a div body)`);
    if (out.tabs.nestedButton || out.tabs.count !== 2 || out.tabs.closeButtons !== 2 || out.tabs.tag !== "DIV") bad.push(`closable tabs=${JSON.stringify(out.tabs)} (want two div tabs, two close buttons, no button inside a button)`);
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    compared += 8 + 3 + 3 + 4 + 2 + 3 + 1 + 2 + 2 + 2 + 3 + 1;
    if (bad.length)
      fail(`a11y semantics broke (R18-69…R18-84): ${bad.join(" | ")}`);
    else
      console.log("wc-contract: a11y semantics measured — no role=img over interactive content, live regions opt-in, one radiogroup/calendar tab stop, unique nav ids, finite separator range, table caption, scoped toggle, KPI passthrough, inspector actions, one main landmark, no button inside a button");
  }

  // ---- 24. form participation contract (R20 T-01…T-08) ---------------------
  //
  // Review 20 measured seven form defects the value-event arm (17) cannot see,
  // because events fire correctly while the entry list is wrong: a textarea
  // that never rendered its value, an input whose typed text died on any
  // unrelated attribute change, three hosts with no form association, a
  // multi-select that submitted only its first selected option, and a version
  // picker that ignored `value`. Each case below drives the control the way a
  // form does — FormData collection (which fires `formdata` and re-syncs every
  // host), reset, validity, and an unrelated attribute change mid-edit — and
  // asserts the entry list, not the markup. Every form-associated class is
  // covered except contour-shadow-* wrappers, which share these classes.
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const results = {};
      // One form per case so entries never collide across cases.
      const mount = async (tag, attrs = {}) => {
        const form = document.createElement("form");
        const el = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
        form.appendChild(el);
        document.body.appendChild(form);
        await wait(30);
        return { form, el };
      };
      const entries = (form, name) => new FormData(form).getAll(name).map(String);
      const type = (ctl, text) => {
        ctl.value = text;
        ctl.dispatchEvent(new Event("input", { bubbles: true }));
        ctl.dispatchEvent(new Event("change", { bubbles: true }));
      };

      // input: authored value submits; typed text survives an unrelated
      // attribute change; an explicit value change wins; reset restores the
      // authored default; required emptiness is invalid.
      {
        const { form, el } = await mount("contour-input", { name: "q", value: "start", required: "" });
        const r = { authored: entries(form, "q") };
        type(el.querySelector("input"), "typed");
        el.setAttribute("placeholder", "x");
        await wait(20);
        r.afterUnrelated = { shown: el.querySelector("input").value, submitted: entries(form, "q") };
        form.reset();
        await wait(20);
        r.afterReset = { shown: el.querySelector("input").value, submitted: entries(form, "q") };
        // An explicit author value change is a new default (native semantics)
        // and must win over the typed text.
        el.setAttribute("value", "override");
        await wait(20);
        r.afterValueChange = el.querySelector("input").value;
        type(el.querySelector("input"), "");
        r.invalidWhenEmpty = el.checkValidity() === false;
        results.input = r;
        form.remove();
      }
      // textarea: value and name reach the generated control and the form.
      {
        const { form, el } = await mount("contour-textarea", { name: "bio", value: "world", required: "" });
        const ta = el.querySelector("textarea");
        const r = { rendered: ta.value, named: ta.name, authored: entries(form, "bio") };
        type(ta, "typed");
        el.setAttribute("placeholder", "x");
        await wait(20);
        r.afterUnrelated = { shown: el.querySelector("textarea").value, submitted: entries(form, "bio") };
        form.reset();
        await wait(20);
        r.afterReset = entries(form, "bio");
        results.textarea = r;
        form.remove();
      }
      // field: the wrapper preserves typed text and resets to the default.
      {
        const { form, el } = await mount("contour-field", { label: "Name", name: "fn", value: "Ada" });
        const r = { authored: entries(form, "fn") };
        type(el.querySelector("input"), "Grace");
        el.setAttribute("hint", "full name");
        await wait(20);
        r.afterUnrelated = { shown: el.querySelector("input").value, submitted: entries(form, "fn") };
        form.reset();
        await wait(20);
        r.afterReset = entries(form, "fn");
        results.field = r;
        form.remove();
      }
      // select (single): the committed selection submits and reflects; reset
      // restores the authored value, not the first option.
      {
        const { form, el } = await mount("contour-select", { name: "pick", label: "Pick", options: '[{"label":"A","value":"a"},{"label":"B","value":"b"}]', value: "b" });
        const sel = el.querySelector("select");
        const r = { authored: entries(form, "pick") };
        sel.value = "a";
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        await wait(20);
        r.afterChange = { submitted: entries(form, "pick"), attr: el.getAttribute("value") };
        form.reset();
        await wait(20);
        r.afterReset = entries(form, "pick");
        results.selectSingle = r;
        form.remove();
      }
      // select (multiple): every selected option submits as its own entry.
      {
        const { form, el } = await mount("contour-select", { name: "multi", multiple: "", options: '[{"label":"A","value":"a"},{"label":"B","value":"b"},{"label":"C","value":"c"}]', value: "a,b" });
        const sel = el.querySelector("select");
        const r = { authored: entries(form, "multi"), multiple: sel.multiple };
        Array.from(sel.options).forEach((o) => { o.selected = o.value !== "a"; });
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        await wait(20);
        r.afterChange = { submitted: entries(form, "multi"), attr: el.getAttribute("value") };
        form.reset();
        await wait(20);
        r.afterReset = entries(form, "multi");
        results.selectMulti = r;
        form.remove();
      }
      // version: `value` selects the option; the commit reflects; reset restores.
      {
        const { form, el } = await mount("contour-version", { name: "ver", value: "2", options: '["1","2"]' });
        const sel = el.querySelector("select");
        const r = { authored: entries(form, "ver"), shown: sel.value };
        sel.value = "1";
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        await wait(20);
        r.afterChange = { submitted: entries(form, "ver"), attr: el.getAttribute("value") };
        form.reset();
        await wait(20);
        r.afterReset = entries(form, "ver");
        results.version = r;
        form.remove();
      }
      // checkbox-group: the host owns the group value — repeated entries,
      // reflection, reset to the authored default, required validity.
      {
        const { form, el } = await mount("contour-checkbox-group", { name: "tags", legend: "Tags", options: '["a","b","c"]', value: "a", required: "" });
        const boxes = () => Array.from(el.querySelectorAll("input[type=checkbox]"));
        const r = { authored: entries(form, "tags") };
        boxes().find((i) => i.value === "b").click();
        await wait(20);
        r.afterCheck = { submitted: entries(form, "tags"), attr: el.getAttribute("value"), checked: boxes().filter((i) => i.checked).map((i) => i.value) };
        r.validWhenChecked = el.checkValidity() === true;
        form.reset();
        await wait(20);
        r.afterReset = { submitted: entries(form, "tags"), attr: el.getAttribute("value") };
        boxes().forEach((i) => { if (i.checked) i.click(); });
        await wait(20);
        r.invalidWhenEmpty = el.checkValidity() === false;
        results.checkboxGroup = r;
        form.remove();
      }
      // search-field: host-level participation, preservation, reset.
      {
        const { form, el } = await mount("contour-search-field", { name: "s", value: "init", label: "Search" });
        const inp = el.querySelector("input");
        const r = { authored: entries(form, "s"), named: inp.name };
        type(inp, "typed");
        el.setAttribute("placeholder", "x");
        await wait(20);
        r.afterUnrelated = { shown: el.querySelector("input").value, submitted: entries(form, "s") };
        form.reset();
        await wait(20);
        r.afterReset = entries(form, "s");
        results.searchField = r;
        form.remove();
      }
      // input-group: value/name render, participation, clear, reset.
      {
        const { form, el } = await mount("contour-input-group", { name: "ig", value: "igval", label: "Search", clearable: "" });
        const inp = el.querySelector("input");
        const r = { authored: entries(form, "ig"), named: inp.name };
        type(inp, "typed");
        el.setAttribute("placeholder", "x");
        await wait(20);
        r.afterUnrelated = { shown: el.querySelector("input").value, submitted: entries(form, "ig") };
        el.querySelector(".c-input-group__clear").click();
        await wait(20);
        r.afterClear = entries(form, "ig");
        form.reset();
        await wait(20);
        r.afterReset = entries(form, "ig");
        results.inputGroup = r;
        form.remove();
      }
      // check / switch: the boolean entry appears and disappears; reset
      // restores the AUTHORED checked state, not the last reflected one.
      {
        const { form, el } = await mount("contour-check", { name: "agree", value: "yes", label: "Agree" });
        const r = { unchecked: entries(form, "agree") };
        el.querySelector("input").click();
        r.checked = entries(form, "agree");
        form.reset();
        r.afterReset = entries(form, "agree");
        results.check = r;
        form.remove();
      }
      {
        const { form, el } = await mount("contour-switch", { name: "sw", label: "WiFi", checked: "" });
        const r = { authored: entries(form, "sw") };
        el.querySelector("input").click();
        r.toggled = entries(form, "sw");
        form.reset();
        r.afterReset = entries(form, "sw");
        results.switch = r;
        form.remove();
      }
      // radio pair: one entry under the shared name; the deselected host
      // clears its stale value; reset restores the authored checked radio.
      {
        const form = document.createElement("form");
        const a = document.createElement("contour-radio");
        a.setAttribute("name", "g"); a.setAttribute("value", "a"); a.setAttribute("label", "A");
        const b = document.createElement("contour-radio");
        b.setAttribute("name", "g"); b.setAttribute("value", "b"); b.setAttribute("label", "B"); b.setAttribute("checked", "");
        form.appendChild(a); form.appendChild(b);
        document.body.appendChild(form);
        await wait(30);
        const r = { authored: entries(form, "g") };
        a.querySelector("input").click();
        r.afterClick = entries(form, "g");
        form.reset();
        r.afterReset = entries(form, "g");
        results.radioPair = r;
        form.remove();
      }
      // radio-list: the checked item submits; reset re-renders the payload.
      {
        const { form, el } = await mount("contour-radio-list", { name: "opt", items: '[{"label":"X","value":"x"},{"label":"Z","value":"z","checked":true}]' });
        const r = { authored: entries(form, "opt") };
        Array.from(el.querySelectorAll("input")).find((i) => i.value === "x").click();
        r.afterClick = entries(form, "opt");
        form.reset();
        await wait(30);
        r.afterReset = entries(form, "opt");
        results.radioList = r;
        form.remove();
      }
      // range: single submits one entry and resets; dual submits TWO entries
      // under the one host name (the hidden-mirror path was detached by the
      // same form="" rule that prevents double submission).
      {
        const { form, el } = await mount("contour-range", { name: "vol", value: "30", min: "0", max: "100", label: "Volume" });
        const r = { single: entries(form, "vol") };
        form.reset();
        r.singleReset = entries(form, "vol");
        results.rangeSingle = r;
        form.remove();
      }
      {
        const { form, el } = await mount("contour-range", { name: "band", range: "", low: "20", high: "80", min: "0", max: "100", label: "Band" });
        results.rangeDual = { dual: entries(form, "band") };
        form.remove();
      }
      // combobox: submits the committed VALUE, not the visible label, and
      // reset restores the authored default's label.
      {
        const { form, el } = await mount("contour-combobox", { name: "cb", label: "Country", options: '[{"label":"United States","value":"us"}]', value: "us" });
        const r = { authored: entries(form, "cb"), shown: el.querySelector("input").value };
        form.reset();
        await wait(20);
        r.afterReset = { submitted: entries(form, "cb"), shown: el.querySelector("input").value };
        results.combobox = r;
        form.remove();
      }
      // The ui.mjs form controls submit their authored value under the host name.
      for (const [tag, value, name] of [
        ["contour-date-picker", "2026-11-19", "d"],
        ["contour-time-picker", "12:30", "t"],
        ["contour-color-picker", "#ff0000", "c"],
        ["contour-number-field", "42", "n"],
      ]) {
        const { form, el } = await mount(tag, { value, name, label: "L" });
        results["picker-" + tag] = entries(form, name);
        form.remove();
      }
      // file-upload: the selected File submits as a File, not a path string.
      {
        const { form, el } = await mount("contour-file-upload", { name: "doc", label: "Doc" });
        const inp = el.querySelector("input[type=file]");
        const r = { hasFileInput: !!inp };
        if (inp) {
          const dt = new DataTransfer();
          dt.items.add(new File(["hello"], "hello.txt", { type: "text/plain" }));
          inp.files = dt.files;
          inp.dispatchEvent(new Event("change", { bubbles: true }));
          await wait(20);
          const v = new FormData(form).get("doc");
          r.submitted = v instanceof File ? v.name : String(v);
        }
        results.fileUpload = r;
        form.remove();
      }
      // tags-input: the declared value submits, and an added tag reaches it.
      {
        const { form, el } = await mount("contour-tags-input", { name: "tg", value: '["a","b"]' });
        const r = { matchesAttr: entries(form, "tg")[0] === el.getAttribute("value") };
        const inp = el.querySelector(".c-tags-input__input");
        inp.value = "c";
        inp.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
        await wait(20);
        r.afterAdd = (entries(form, "tg")[0] || "").includes("c");
        results.tagsInput = r;
        form.remove();
      }
      // A control with no authored value keeps typed text across a re-render
      // (the pre-existing empty-control path must not regress).
      {
        const { form, el } = await mount("contour-input", { name: "free" });
        type(el.querySelector("input"), "kept");
        el.setAttribute("placeholder", "x");
        await wait(20);
        results.noAttrPreserve = { shown: el.querySelector("input").value, submitted: entries(form, "free") };
        form.remove();
      }
      return results;
    });
    const bad = [];
    const eq = (label, got, want) => {
      const g = JSON.stringify(got), w = JSON.stringify(want);
      if (g !== w) bad.push(`${label}: ${g} != ${w}`);
    };
    eq("input authored", out.input?.authored, ["start"]);
    eq("input preserved shown", out.input?.afterUnrelated?.shown, "typed");
    eq("input preserved submitted", out.input?.afterUnrelated?.submitted, ["typed"]);
    eq("input value change wins", out.input?.afterValueChange, "override");
    eq("input reset shown", out.input?.afterReset?.shown, "start");
    eq("input reset submitted", out.input?.afterReset?.submitted, ["start"]);
    if (out.input?.invalidWhenEmpty !== true) bad.push(`required empty input checkValidity()=${out.input?.invalidWhenEmpty} (want false → invalid)`);
    eq("textarea rendered value", out.textarea?.rendered, "world");
    eq("textarea rendered name", out.textarea?.named, "bio");
    eq("textarea authored", out.textarea?.authored, ["world"]);
    eq("textarea preserved shown", out.textarea?.afterUnrelated?.shown, "typed");
    eq("textarea preserved submitted", out.textarea?.afterUnrelated?.submitted, ["typed"]);
    eq("textarea reset", out.textarea?.afterReset, ["world"]);
    eq("field authored", out.field?.authored, ["Ada"]);
    eq("field preserved shown", out.field?.afterUnrelated?.shown, "Grace");
    eq("field preserved submitted", out.field?.afterUnrelated?.submitted, ["Grace"]);
    eq("field reset", out.field?.afterReset, ["Ada"]);
    eq("select single authored", out.selectSingle?.authored, ["b"]);
    eq("select single change", out.selectSingle?.afterChange?.submitted, ["a"]);
    eq("select single reflects", out.selectSingle?.afterChange?.attr, "a");
    eq("select single reset", out.selectSingle?.afterReset, ["b"]);
    eq("select multi authored", out.selectMulti?.authored, ["a", "b"]);
    if (out.selectMulti?.multiple !== true) bad.push(`select[multiple] inner select multiple=${out.selectMulti?.multiple}`);
    eq("select multi change", out.selectMulti?.afterChange?.submitted, ["b", "c"]);
    eq("select multi reflects", out.selectMulti?.afterChange?.attr, "b,c");
    eq("select multi reset", out.selectMulti?.afterReset, ["a", "b"]);
    eq("version authored", out.version?.authored, ["2"]);
    eq("version shown", out.version?.shown, "2");
    eq("version change", out.version?.afterChange?.submitted, ["1"]);
    eq("version reflects", out.version?.afterChange?.attr, "1");
    eq("version reset", out.version?.afterReset, ["2"]);
    eq("checkbox-group authored", out.checkboxGroup?.authored, ["a"]);
    eq("checkbox-group check", out.checkboxGroup?.afterCheck?.submitted, ["a", "b"]);
    eq("checkbox-group reflects", out.checkboxGroup?.afterCheck?.attr, "a,b");
    eq("checkbox-group checked", out.checkboxGroup?.afterCheck?.checked, ["a", "b"]);
    if (out.checkboxGroup?.validWhenChecked !== true) bad.push(`checkbox-group with a checked box is invalid`);
    eq("checkbox-group reset", out.checkboxGroup?.afterReset?.submitted, ["a"]);
    eq("checkbox-group reset attr", out.checkboxGroup?.afterReset?.attr, "a");
    if (out.checkboxGroup?.invalidWhenEmpty !== true) bad.push(`required empty checkbox-group checkValidity() did not report invalid`);
    eq("search-field authored", out.searchField?.authored, ["init"]);
    eq("search-field name", out.searchField?.named, "s");
    eq("search-field preserved shown", out.searchField?.afterUnrelated?.shown, "typed");
    eq("search-field preserved submitted", out.searchField?.afterUnrelated?.submitted, ["typed"]);
    eq("search-field reset", out.searchField?.afterReset, ["init"]);
    eq("input-group authored", out.inputGroup?.authored, ["igval"]);
    eq("input-group name", out.inputGroup?.named, "ig");
    eq("input-group preserved shown", out.inputGroup?.afterUnrelated?.shown, "typed");
    eq("input-group preserved submitted", out.inputGroup?.afterUnrelated?.submitted, ["typed"]);
    eq("input-group clear", out.inputGroup?.afterClear, [""]);
    eq("input-group reset", out.inputGroup?.afterReset, ["igval"]);
    eq("check unchecked", out.check?.unchecked, []);
    eq("check checked", out.check?.checked, ["yes"]);
    eq("check reset", out.check?.afterReset, []);
    eq("switch authored", out.switch?.authored, ["on"]);
    eq("switch toggled", out.switch?.toggled, []);
    eq("switch reset", out.switch?.afterReset, ["on"]);
    eq("radio pair authored", out.radioPair?.authored, ["b"]);
    eq("radio pair click", out.radioPair?.afterClick, ["a"]);
    eq("radio pair reset", out.radioPair?.afterReset, ["b"]);
    eq("radio-list authored", out.radioList?.authored, ["z"]);
    eq("radio-list click", out.radioList?.afterClick, ["x"]);
    eq("radio-list reset", out.radioList?.afterReset, ["z"]);
    eq("range single", out.rangeSingle?.single, ["30"]);
    eq("range single reset", out.rangeSingle?.singleReset, ["30"]);
    eq("range dual", out.rangeDual?.dual, ["20", "80"]);
    eq("combobox authored", out.combobox?.authored, ["us"]);
    eq("combobox shows label", out.combobox?.shown, "United States");
    eq("combobox reset submitted", out.combobox?.afterReset?.submitted, ["us"]);
    eq("combobox reset label", out.combobox?.afterReset?.shown, "United States");
    eq("date-picker value", out["picker-contour-date-picker"], ["2026-11-19"]);
    eq("time-picker value", out["picker-contour-time-picker"], ["12:30"]);
    eq("color-picker value", out["picker-contour-color-picker"], ["#ff0000"]);
    eq("number-field value", out["picker-contour-number-field"], ["42"]);
    if (out.fileUpload?.hasFileInput !== true) bad.push("file-upload rendered no file input");
    eq("file-upload submits File", out.fileUpload?.submitted, "hello.txt");
    if (out.tagsInput?.matchesAttr !== true) bad.push("tags-input entry does not match its value attribute");
    if (out.tagsInput?.afterAdd !== true) bad.push("tags-input added tag did not reach the entry list");
    eq("no-attr preserve shown", out.noAttrPreserve?.shown, "kept");
    eq("no-attr preserve submitted", out.noAttrPreserve?.submitted, ["kept"]);
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    compared += 79;
    if (bad.length)
      fail(`form participation contract broke (R20 T-01…T-08): ${bad.join(" | ")}`);
    else
      console.log("wc-contract: form participation measured — every form-associated control submits its value(s), preserves typed text across unrelated re-renders, resets to the authored default, and reports required validity");
  }

  // ---- 25. time-slider value/playback contract (R20 T-30) ------------------
  //
  // The slider played, but the user's hand was silent: scrubbing emitted
  // nothing, `value` never wrote back, `is-playing` swapped only the icon,
  // min/max were factory constants, and a mid-play speed change kept the old
  // cadence. Each arm drives one of those paths and asserts the contract.
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const host = document.createElement("contour-time-slider");
      for (const [k, v] of Object.entries({ label: "Time", min: "0", max: "100", value: "3", speed: "10" })) host.setAttribute(k, v);
      document.body.appendChild(host);
      await wait(40);
      const track = host.querySelector(".c-time-slider__track");
      const r = { minMax: { min: track.min, max: track.max, value: track.value } };
      // Manual scrub emits time-change and writes the playhead back.
      const heard = [];
      host.addEventListener("contour:time-change", (e) => heard.push(e.detail.value));
      track.value = "7";
      track.dispatchEvent(new Event("input", { bubbles: true }));
      r.scrub = { attr: host.getAttribute("value"), heard: heard.slice(), readout: host.querySelector(".c-time-slider__time").textContent };
      // Attribute-driven playback: is-playing starts the timer, removal stops.
      const plays = [], pauses = [];
      host.addEventListener("contour:play", () => plays.push(1));
      host.addEventListener("contour:pause", () => pauses.push(1));
      host.setAttribute("is-playing", "");
      await wait(350);
      const midPlay = { value: Number(host.getAttribute("value")), playing: host.hasAttribute("is-playing") };
      host.removeAttribute("is-playing");
      const afterStop = { value: Number(host.getAttribute("value")), pauses: pauses.length };
      await wait(250);
      afterStop.frozen = Number(host.getAttribute("value")) === afterStop.value;
      r.playback = { plays: plays.length, midPlay, afterStop };
      // The play button toggles the attribute (both directions).
      host.querySelector(".c-time-slider__play").click();
      r.clickPlay = host.hasAttribute("is-playing");
      host.querySelector(".c-time-slider__play").click();
      r.clickPause = !host.hasAttribute("is-playing");
      // A speed change writes back and emits.
      let speedHeard = null;
      host.addEventListener("contour:speed-change", (e) => { speedHeard = e.detail.speed; });
      const sel = host.querySelector(".c-time-slider__speed");
      sel.value = "2";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      r.speed = { attr: host.getAttribute("speed"), heard: speedHeard };
      // Disconnect stops the timer: the playhead freezes.
      host.setAttribute("is-playing", "");
      await wait(150);
      const before = Number(host.getAttribute("value"));
      host.remove();
      await wait(300);
      r.afterDetach = Number(host.getAttribute("value")) === before;
      return r;
    });
    const bad = [];
    const eq = (label, got, want) => {
      const g = JSON.stringify(got), w = JSON.stringify(want);
      if (g !== w) bad.push(`${label}: ${g} != ${w}`);
    };
    eq("min/max/value", out.minMax, { min: "0", max: "100", value: "3" });
    eq("scrub writeback", out.scrub?.attr, "7");
    eq("scrub event", out.scrub?.heard, ["7"]);
    eq("scrub readout", out.scrub?.readout, "7");
    if (out.playback?.plays !== 1) bad.push(`is-playing did not emit exactly one contour:play (${out.playback?.plays})`);
    if (!(out.playback?.midPlay?.value > 3)) bad.push(`playback did not advance the value attribute: ${JSON.stringify(out.playback?.midPlay)}`);
    if (out.playback?.midPlay?.playing !== true) bad.push("is-playing dropped mid-play");
    if (!(out.playback?.afterStop?.pauses >= 1)) bad.push(`removing is-playing emitted no pause: ${JSON.stringify(out.playback?.afterStop)}`);
    if (out.playback?.afterStop?.frozen !== true) bad.push("playhead kept moving after is-playing was removed");
    if (out.clickPlay !== true) bad.push("play click did not set is-playing");
    if (out.clickPause !== true) bad.push("second play click did not clear is-playing");
    eq("speed writeback", out.speed?.attr, "2");
    eq("speed event", out.speed?.heard, 2);
    if (out.afterDetach !== true) bad.push("timer survived disconnect — the playhead moved after removal");
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    compared += 14;
    if (bad.length)
      fail(`time-slider contract broke (R20 T-30): ${bad.join(" | ")}`);
    else
      console.log("wc-contract: time-slider scrubs aloud, writes its playhead back, plays and pauses from the is-playing attribute, honours min/max and speed, and stops on disconnect");
  }

  // ---- 26. shell completions (R20 T-11/12/13/14/16) ------------------------
  //
  // Five components the review called shells, completed against their API
  // promise: responsive-content's breakpoint set, style-switcher's value
  // writeback and authored options, split-button's primary action and menu
  // keyboard, annotation's drag/nudge serialization, date-range's form
  // participation and cross-constraint. Each assertion drives the real path.
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      // Computed font-size must be the settled value, not a frame mid
      // theme/size transition.
      const noTrans = document.createElement("style");
      noTrans.textContent = "*, *::before, *::after { transition: none !important; }";
      document.head.appendChild(noTrans);
      const mk = async (tag, attrs = {}) => {
        const el = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
        document.body.appendChild(el);
        await wait(30);
        return el;
      };
      const results = {};

      // responsive-content: sm < 30rem, md < 40rem, lg < 64rem, measured
      // against a consumer-declared container at three widths.
      {
        const wrap = document.createElement("div");
        wrap.style.containerType = "inline-size";
        wrap.style.inlineSize = "35rem";
        document.body.appendChild(wrap);
        const hosts = {};
        for (const bp of ["sm", "md", "lg"]) {
          const el = document.createElement("contour-responsive-content");
          el.setAttribute("breakpoint", bp);
          el.textContent = "content";
          wrap.appendChild(el);
          hosts[bp] = el;
        }
        await wait(40);
        const read = () => Object.fromEntries(Object.entries(hosts).map(([bp, el]) => [bp, parseFloat(getComputedStyle(el).fontSize)]));
        results.rc35 = read();
        wrap.style.inlineSize = "25rem";
        await wait(40);
        results.rc25 = read();
        wrap.style.inlineSize = "70rem";
        await wait(40);
        results.rc70 = read();
        results.rcAttrs = Object.fromEntries(Object.entries(hosts).map(([bp, el]) => [bp, el.dataset.breakpoint]));
        wrap.remove();
      }

      // style-switcher: selection writes value back; authored options survive.
      {
        const el = await mk("contour-style-switcher", { items: '["Streets","Satellite"]', value: "Streets" });
        const opts = () => Array.from(el.querySelectorAll(".c-style-switcher__option"));
        const r = { initialPressed: opts().map((o) => o.getAttribute("aria-pressed")), tabStops: opts().filter((o) => o.getAttribute("tabindex") === "0").length };
        let heard = null;
        el.addEventListener("contour:change", (e) => { heard = e.detail.value; });
        opts()[1].click();
        await wait(20);
        r.afterClick = { attr: el.getAttribute("value"), heard, pressed: opts().map((o) => o.getAttribute("aria-pressed")), active: opts().filter((o) => o.classList.contains("c-style-switcher__option--active")).map((o) => o.dataset.value) };
        opts()[1].focus();
        opts()[1].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
        document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        await wait(20);
        r.afterKeys = el.getAttribute("value");
        results.styleSwitcher = r;
        el.remove();
        const a = document.createElement("contour-style-switcher");
        a.setAttribute("value", "b");
        a.innerHTML = '<button class="c-style-switcher__option" data-value="a">A</button><button class="c-style-switcher__option" data-value="b">B</button>';
        document.body.appendChild(a);
        await wait(30);
        results.authoredSwitcher = { count: a.querySelectorAll(".c-style-switcher__option").length, pressed: Array.from(a.querySelectorAll(".c-style-switcher__option")).map((o) => o.getAttribute("aria-pressed")) };
        a.remove();
      }

      // split-button: primary action, menu keyboard, focus return, anchoring.
      {
        const el = await mk("contour-split-button", { label: "Save", menu: '["Save as","Duplicate"]' });
        const r = {};
        let activated = null, selected = null;
        const toggles = [];
        el.addEventListener("contour:activate", (e) => { activated = e.detail.label; });
        el.addEventListener("contour:toggle", (e) => toggles.push(e.detail.open));
        el.addEventListener("contour:select", (e) => { selected = e.detail; });
        el.querySelector(".c-split-button__main").click();
        r.activated = activated;
        const toggle = el.querySelector(".c-split-button__toggle");
        toggle.click();
        await wait(20);
        const menu = el.querySelector(".c-split-button__menu");
        const items = Array.from(menu.querySelectorAll(".c-menu__item"));
        r.opened = { hidden: menu.hidden, expanded: toggle.getAttribute("aria-expanded"), focusIn: menu.contains(document.activeElement), toggles: toggles.slice() };
        document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
        r.roved = document.activeElement === items[1];
        document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        await wait(20);
        r.escaped = { hidden: menu.hidden, focusToggle: document.activeElement === toggle, toggles: toggles.slice() };
        toggle.focus();
        toggle.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
        await wait(20);
        r.keyOpen = { hidden: menu.hidden, toggles: toggles.slice() };
        items[1].click();
        await wait(20);
        r.selected = { detail: selected, hidden: menu.hidden, focusToggle: document.activeElement === toggle };
        r.positioned = getComputedStyle(el).position;
        results.splitButton = r;
        el.remove();
      }

      // annotation: arrow nudge and pointer drag write x/y back with events.
      {
        const parent = document.createElement("div");
        parent.style.position = "relative";
        parent.style.inlineSize = "200px";
        parent.style.blockSize = "200px";
        document.body.appendChild(parent);
        const el = document.createElement("contour-annotation");
        el.setAttribute("label", "Note"); el.setAttribute("x", "50%"); el.setAttribute("y", "50%");
        parent.appendChild(el);
        await wait(30);
        const r = { tabindex: el.getAttribute("tabindex") };
        let drags = 0, ends = 0;
        el.addEventListener("contour:drag", () => drags++);
        el.addEventListener("contour:dragend", () => ends++);
        el.focus();
        el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
        await wait(20);
        r.nudge = { x: el.getAttribute("x"), y: el.getAttribute("y"), drags, ends };
        el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", shiftKey: true, bubbles: true }));
        await wait(20);
        r.shiftNudge = el.getAttribute("x");
        const rect = parent.getBoundingClientRect();
        const opts = { bubbles: true, clientX: rect.left + 100, clientY: rect.top + 100, pointerId: 9, button: 0 };
        el.dispatchEvent(new PointerEvent("pointerdown", opts));
        el.dispatchEvent(new PointerEvent("pointermove", { ...opts, clientX: rect.left + 120 }));
        el.dispatchEvent(new PointerEvent("pointerup", { ...opts, clientX: rect.left + 120 }));
        await wait(20);
        r.drag = { x: el.getAttribute("x"), ends };
        results.annotation = r;
        parent.remove();
      }

      // date-range: distinct names, entries, cross-constraint, inverted
      // validity, writeback, reset to the authored defaults.
      {
        const form = document.createElement("form");
        const el = document.createElement("contour-date-range");
        for (const [k, v] of Object.entries({ name: "win", label: "Window", start: "2026-11-01", end: "2026-11-10", required: "" })) el.setAttribute(k, v);
        form.appendChild(el);
        document.body.appendChild(form);
        await wait(30);
        const s = el.querySelector(".c-date-range__start"), en = el.querySelector(".c-date-range__end");
        const r = { labels: [s.getAttribute("aria-label"), en.getAttribute("aria-label")], entries: new FormData(form).getAll("win").map(String), valid: el.checkValidity(), cross: { endMin: en.min, startMax: s.max } };
        s.value = "2026-11-15";
        s.dispatchEvent(new Event("change", { bubbles: true }));
        await wait(20);
        r.inverted = { valid: el.checkValidity(), attr: el.getAttribute("start"), ariaInvalid: el.querySelector(".c-date-range__start").getAttribute("aria-invalid") };
        el.querySelector(".c-date-range__start").value = "2026-11-05";
        el.querySelector(".c-date-range__start").dispatchEvent(new Event("change", { bubbles: true }));
        await wait(20);
        r.fixed = el.checkValidity();
        form.reset();
        await wait(20);
        r.reset = { start: el.getAttribute("start"), end: el.getAttribute("end"), entries: new FormData(form).getAll("win").map(String) };
        results.dateRange = r;
        form.remove();
      }
      return results;
    });
    const bad = [];
    const eq = (label, got, want) => {
      const g = JSON.stringify(got), w = JSON.stringify(want);
      if (g !== w) bad.push(`${label}: ${g} != ${w}`);
    };
    // responsive-content
    const { rc25, rc35, rc70 } = out;
    if (!(rc70.sm === rc70.md && rc70.md === rc70.lg)) bad.push(`at 70rem no breakpoint should step down: ${JSON.stringify(rc70)}`);
    if (!(rc35.md < rc35.sm)) bad.push(`md did not step down at 35rem: ${JSON.stringify(rc35)}`);
    if (!(rc35.lg === rc35.md)) bad.push(`lg should step with md at 35rem: ${JSON.stringify(rc35)}`);
    if (!(rc35.sm === rc70.sm)) bad.push(`sm stepped down above 30rem: ${JSON.stringify(rc35)}`);
    if (!(rc25.sm === rc25.md && rc25.md === rc25.lg)) bad.push(`at 25rem all breakpoints should step down: ${JSON.stringify(rc25)}`);
    if (!(rc25.sm < rc70.sm)) bad.push(`stepped font is not smaller: ${JSON.stringify({ rc25, rc70 })}`);
    eq("breakpoint mapping", out.rcAttrs, { sm: "sm", md: "md", lg: "lg" });
    // style-switcher
    eq("switcher initial pressed", out.styleSwitcher?.initialPressed, ["true", "false"]);
    if (out.styleSwitcher?.tabStops !== 1) bad.push(`switcher exposes ${out.styleSwitcher?.tabStops} tab stops (want 1)`);
    eq("switcher click attr", out.styleSwitcher?.afterClick?.attr, "Satellite");
    eq("switcher click event", out.styleSwitcher?.afterClick?.heard, "Satellite");
    eq("switcher click pressed", out.styleSwitcher?.afterClick?.pressed, ["false", "true"]);
    eq("switcher click active", out.styleSwitcher?.afterClick?.active, ["Satellite"]);
    eq("switcher keyboard select", out.styleSwitcher?.afterKeys, "Streets");
    eq("authored options survive", out.authoredSwitcher?.count, 2);
    eq("authored pressed projection", out.authoredSwitcher?.pressed, ["false", "true"]);
    // split-button
    eq("primary action", out.splitButton?.activated, "Save");
    eq("menu opened", out.splitButton?.opened, { hidden: false, expanded: "true", focusIn: true, toggles: [true] });
    if (out.splitButton?.roved !== true) bad.push("ArrowDown did not rove to the second menuitem");
    eq("escape closed", out.splitButton?.escaped, { hidden: true, focusToggle: true, toggles: [true, false] });
    eq("keyboard open emits", out.splitButton?.keyOpen, { hidden: false, toggles: [true, false, true] });
    eq("menu select", out.splitButton?.selected, { detail: { label: "Duplicate", index: 1 }, hidden: true, focusToggle: true });
    eq("split-button positioned", out.splitButton?.positioned, "relative");
    // annotation
    eq("annotation focusable", out.annotation?.tabindex, "0");
    eq("arrow nudge", out.annotation?.nudge, { x: "51%", y: "50%", drags: 1, ends: 1 });
    eq("shift nudge", out.annotation?.shiftNudge, "41%");
    eq("pointer drag", out.annotation?.drag, { x: "51%", ends: 3 });
    // date-range
    eq("distinct names", out.dateRange?.labels, ["Window — start", "Window — end"]);
    eq("range entries", out.dateRange?.entries, ["2026-11-01", "2026-11-10"]);
    if (out.dateRange?.valid !== true) bad.push("authored valid range reports invalid");
    eq("cross-constraint", out.dateRange?.cross, { endMin: "2026-11-01", startMax: "2026-11-10" });
    eq("inverted invalid", out.dateRange?.inverted, { valid: false, attr: "2026-11-15", ariaInvalid: "true" });
    if (out.dateRange?.fixed !== true) bad.push("restored order still invalid");
    eq("range reset", out.dateRange?.reset, { start: "2026-11-01", end: "2026-11-10", entries: ["2026-11-01", "2026-11-10"] });
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    compared += 34;
    if (bad.length)
      fail(`shell completions broke (R20 T-11/12/13/14/16): ${bad.join(" | ")}`);
    else
      console.log("wc-contract: responsive-content steps at its three breakpoints, style-switcher writes value back and keeps authored options, split-button's primary action and menu keyboard work, annotation drags and nudges into x/y, date-range submits, cross-constrains and resets");
  }

  // ---- 27. stateful widget completions (R20 T-10/21/22/23/24) --------------
  //
  // tags-input's paste/comma/limit/disabled paths, sortable-list's order
  // persistence, calendar's January reachability and grid keyboard,
  // carousel's pausable autoplay, animation-controls' dead markers and
  // one-way controls. Autoplay is measured under both motion preferences.
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const mk = async (tag, attrs = {}) => {
        const el = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
        document.body.appendChild(el);
        await wait(30);
        return el;
      };
      const results = {};

      // tags-input: Enter, duplicate feedback, comma commit, paste + max,
      // disabled remove guard, required-empty validity.
      {
        const el = await mk("contour-tags-input", { name: "tg", value: '["a"]', required: "", max: "4" });
        // Re-query per step: every commit re-renders and rebuilds the input.
        const input = () => el.querySelector(".c-tags-input__input");
        const live = () => el.querySelector(".c-tags-input__live")?.textContent || "";
        const r = {};
        input().value = "b";
        input().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
        await wait(20);
        r.enterAdd = el.getAttribute("value");
        input().value = "b";
        input().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
        await wait(20);
        r.dup = { value: el.getAttribute("value"), announced: live().includes("already added") };
        input().value = "c,";
        input().dispatchEvent(new Event("input", { bubbles: true }));
        await wait(20);
        r.comma = { value: el.getAttribute("value"), rest: input().value };
        const dt = new DataTransfer();
        dt.setData("text/plain", "d,e");
        el.querySelector(".c-tags-input__input").dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dt }));
        await wait(20);
        r.paste = { value: el.getAttribute("value"), limitAnnounced: live().includes("limit") };
        el.setAttribute("disabled", "");
        await wait(20);
        const before = el.getAttribute("value");
        el.querySelector(".c-tags-input__remove")?.click();
        await wait(20);
        r.disabledRemove = el.getAttribute("value") === before;
        el.removeAttribute("disabled");
        el.setAttribute("value", "[]");
        await wait(20);
        r.requiredEmpty = el.checkValidity() === false;
        results.tagsInput = r;
        el.remove();
      }

      // sortable-list: keyboard move writes order back; a data re-render
      // keeps the user's permutation; Home jumps to the top.
      {
        const el = await mk("contour-sortable-list", { items: '["A","B","C"]' });
        const labels = () => Array.from(el.querySelectorAll(".c-sortable-list__label")).map((n) => n.textContent);
        const handles = () => Array.from(el.querySelectorAll(".c-sortable-list__handle"));
        const r = {};
        let move = null;
        el.addEventListener("contour:move", (e) => { move = e.detail; });
        handles()[1].focus();
        handles()[1].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));
        await wait(20);
        r.arrowUp = { labels: labels(), order: el.getAttribute("order"), move };
        // A different items string with the same data forces a re-render.
        el.setAttribute("items", '["A", "B", "C"]');
        await wait(20);
        r.persisted = labels();
        const hs = handles();
        hs[2].focus();
        hs[2].dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }));
        await wait(20);
        r.home = { labels: labels(), order: el.getAttribute("order") };
        results.sortableList = r;
        el.remove();
      }

      // calendar: January is reachable (month=0), weekday headers, one tab
      // stop, cross-month arrows, PageUp/Down (+Shift year), year nav, range.
      {
        const el = await mk("contour-calendar", { month: "0", year: "2026", value: "2026-01-15" });
        const days = () => Array.from(el.querySelectorAll(".c-calendar__day:not(.c-calendar__day--empty)"));
        const r = { january: { count: days().length, first: days()[0]?.dataset.value }, weekdays: el.querySelectorAll('[role="columnheader"]').length, tabStops: days().filter((d) => d.getAttribute("tabindex") === "0").length };
        const focused = () => document.activeElement?.dataset?.value || null;
        days()[14].focus();
        days()[14].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
        r.arrow = focused();
        days()[30].focus();
        days()[30].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
        await wait(20);
        r.crossMonth = { month: el.getAttribute("month"), focused: focused() };
        document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "PageDown", bubbles: true, cancelable: true }));
        await wait(20);
        r.pageDown = { month: el.getAttribute("month"), focused: focused() };
        document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "PageUp", shiftKey: true, bubbles: true, cancelable: true }));
        await wait(20);
        r.shiftPageUp = { year: el.getAttribute("year"), focused: focused() };
        el.querySelector(".c-calendar__next-year").click();
        await wait(20);
        r.yearNav = el.getAttribute("year");
        el.remove();
        const rng = await mk("contour-calendar", { range: "", month: "0", year: "2026" });
        let sel = null;
        rng.addEventListener("contour:select", (e) => { sel = e.detail; });
        rng.querySelector('[data-value="2026-01-10"]').click();
        await wait(20);
        const firstClick = { start: rng.getAttribute("start"), end: rng.getAttribute("end") };
        rng.querySelector('[data-value="2026-01-05"]').click();
        await wait(20);
        r.range = { firstClick, ordered: { start: rng.getAttribute("start"), end: rng.getAttribute("end") }, event: sel, inRange: rng.querySelectorAll(".c-calendar__day.is-in-range").length };
        results.calendar = r;
        rng.remove();
      }

      // carousel: autoplay advances, the pause control freezes it, play
      // resumes, Home/End stay in the lifecycle.
      {
        const el = await mk("contour-carousel", { items: '["one","two","three"]', autoplay: "500" });
        const r = { pauseBtn: !!el.querySelector(".c-carousel__pause") };
        let pauses = 0, plays = 0;
        el.addEventListener("contour:pause", () => pauses++);
        el.addEventListener("contour:play", () => plays++);
        await wait(1200);
        r.advanced = Number(el.getAttribute("index") || "0") > 0;
        el.querySelector(".c-carousel__pause").click();
        await wait(20);
        const frozenAt = el.getAttribute("index");
        await wait(700);
        r.pause = { attr: el.hasAttribute("paused"), events: pauses, frozen: el.getAttribute("index") === frozenAt };
        el.querySelector(".c-carousel__pause").click();
        await wait(700);
        r.resume = { attr: el.hasAttribute("paused"), events: plays, advanced: el.getAttribute("index") !== frozenAt };
        el.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }));
        await wait(20);
        r.end = { index: el.getAttribute("index"), active: el.querySelector(".c-carousel__slide.is-active")?.dataset.index };
        el.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }));
        await wait(20);
        r.home = { index: el.getAttribute("index"), active: el.querySelector(".c-carousel__slide.is-active")?.dataset.index };
        results.carousel = r;
        el.remove();
      }

      // animation-controls: markers render as datalist ticks, loop and speed
      // are controls with events, play owns the attribute, progress writes
      // back, the toolbar roves one tab stop.
      {
        const el = await mk("contour-animation-controls", { min: "0", max: "10", progress: "2", speed: "1x", markers: '[{"value":5,"label":"Mid"}]' });
        const r = { markers: { options: el.querySelectorAll("datalist.c-animation-controls__markers option").length, listed: el.querySelector(".c-animation-controls__scrubber").hasAttribute("list") } };
        let loopEv = null, speedEv = null, toggleEv = null, seekEv = null;
        el.addEventListener("contour:loop-change", (e) => { loopEv = e.detail; });
        el.addEventListener("contour:speed-change", (e) => { speedEv = e.detail; });
        el.addEventListener("contour:toggle", (e) => { toggleEv = e.detail; });
        el.addEventListener("contour:seek", (e) => { seekEv = e.detail; });
        el.querySelector(".c-animation-controls__loop").click();
        await wait(20);
        r.loop = { attr: el.hasAttribute("loop"), ev: loopEv, pressed: el.querySelector(".c-animation-controls__loop").getAttribute("aria-pressed") };
        el.querySelector(".c-animation-controls__speed").click();
        await wait(20);
        r.speed = { attr: el.getAttribute("speed"), ev: speedEv };
        el.querySelector(".c-animation-controls__play").click();
        await wait(350);
        r.play = { attr: el.hasAttribute("playing"), ev: toggleEv, progress: Number(el.getAttribute("progress")) };
        el.querySelector(".c-animation-controls__play").click();
        await wait(20);
        r.paused = !el.hasAttribute("playing");
        const scrubber = el.querySelector(".c-animation-controls__scrubber");
        scrubber.value = "7";
        scrubber.dispatchEvent(new Event("input", { bubbles: true }));
        await wait(20);
        r.seek = { attr: el.getAttribute("progress"), ev: seekEv };
        const playBtn = el.querySelector(".c-animation-controls__play");
        r.roving = { playTab: playBtn.getAttribute("tabindex"), speedTab: el.querySelector(".c-animation-controls__speed").getAttribute("tabindex") };
        playBtn.focus();
        playBtn.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
        r.rovedTo = document.activeElement?.className || "";
        results.animControls = r;
        el.remove();
      }
      return results;
    });

    // Reduced motion: a second pass with the preference emulated — autoplay
    // must not start, and the pause control must reflect the paused state.
    await p.emulateMedia({ reducedMotion: "reduce" });
    const reduced = await p.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const el = document.createElement("contour-carousel");
      el.setAttribute("items", '["one","two","three"]');
      el.setAttribute("autoplay", "500");
      document.body.appendChild(el);
      await wait(40);
      const pressed = el.querySelector(".c-carousel__pause")?.getAttribute("aria-pressed");
      await wait(700);
      const index = el.getAttribute("index");
      el.remove();
      return { pressed, index };
    });
    await p.emulateMedia({ reducedMotion: "no-preference" });

    const bad = [];
    const eq = (label, got, want) => {
      const g = JSON.stringify(got), w = JSON.stringify(want);
      if (g !== w) bad.push(`${label}: ${g} != ${w}`);
    };
    // tags-input
    eq("tags Enter add", out.tagsInput?.enterAdd, '["a","b"]');
    eq("tags duplicate", out.tagsInput?.dup, { value: '["a","b"]', announced: true });
    eq("tags comma commit", out.tagsInput?.comma, { value: '["a","b","c"]', rest: "" });
    eq("tags paste + max", out.tagsInput?.paste, { value: '["a","b","c","d"]', limitAnnounced: true });
    if (out.tagsInput?.disabledRemove !== true) bad.push("remove button worked while disabled");
    if (out.tagsInput?.requiredEmpty !== true) bad.push("required tags-input with [] reports valid");
    // sortable-list
    eq("sortable arrowUp", out.sortableList?.arrowUp, { labels: ["B", "A", "C"], order: "[1,0,2]", move: { direction: "up", from: 1, to: 0 } });
    eq("sortable persisted", out.sortableList?.persisted, ["B", "A", "C"]);
    eq("sortable home", out.sortableList?.home, { labels: ["C", "B", "A"], order: "[2,1,0]" });
    // calendar
    eq("January reachable", out.calendar?.january, { count: 31, first: "2026-01-01" });
    if (out.calendar?.weekdays !== 7) bad.push(`calendar has ${out.calendar?.weekdays} columnheaders (want 7)`);
    if (out.calendar?.tabStops !== 1) bad.push(`calendar exposes ${out.calendar?.tabStops} day tab stops (want 1)`);
    eq("calendar arrow", out.calendar?.arrow, "2026-01-16");
    eq("calendar cross-month", out.calendar?.crossMonth, { month: "1", focused: "2026-02-01" });
    eq("calendar PageDown", out.calendar?.pageDown, { month: "2", focused: "2026-03-01" });
    eq("calendar Shift+PageUp", out.calendar?.shiftPageUp, { year: "2025", focused: "2025-03-01" });
    eq("calendar year nav", out.calendar?.yearNav, "2026");
    eq("range first click", out.calendar?.range?.firstClick, { start: "2026-01-10", end: null });
    eq("range ordered", out.calendar?.range?.ordered, { start: "2026-01-05", end: "2026-01-10" });
    eq("range event", out.calendar?.range?.event, { value: "2026-01-05", range: ["2026-01-05", "2026-01-10"] });
    if (out.calendar?.range?.inRange !== 4) bad.push(`range highlights ${out.calendar?.range?.inRange} interior days (want 4)`);
    // carousel
    if (out.carousel?.pauseBtn !== true) bad.push("autoplay carousel rendered no pause control");
    if (out.carousel?.advanced !== true) bad.push("autoplay did not advance");
    eq("carousel pause", out.carousel?.pause, { attr: true, events: 1, frozen: true });
    eq("carousel resume", out.carousel?.resume, { attr: false, events: 1, advanced: true });
    eq("carousel End", out.carousel?.end, { index: "2", active: "2" });
    eq("carousel Home", out.carousel?.home, { index: "0", active: "0" });
    eq("reduced motion static", reduced, { pressed: "true", index: null });
    // animation-controls
    eq("markers datalist", out.animControls?.markers, { options: 1, listed: true });
    eq("loop control", out.animControls?.loop, { attr: true, ev: { loop: true }, pressed: "true" });
    eq("speed cycle", out.animControls?.speed, { attr: "2x", ev: { speed: 2 } });
    if (out.animControls?.play?.attr !== true) bad.push("play click did not set playing");
    eq("play event", out.animControls?.play?.ev, { playing: true });
    if (!(out.animControls?.play?.progress > 2)) bad.push(`playhead did not advance the progress attribute: ${out.animControls?.play?.progress}`);
    if (out.animControls?.paused !== true) bad.push("second play click did not clear playing");
    eq("seek writeback", out.animControls?.seek, { attr: "7", ev: { progress: 7, value: 7 } });
    eq("toolbar tab stops", out.animControls?.roving, { playTab: "0", speedTab: "-1" });
    if (!String(out.animControls?.rovedTo).includes("c-animation-controls__speed")) bad.push(`ArrowRight did not rove to speed: ${out.animControls?.rovedTo}`);
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    compared += 38;
    if (bad.length)
      fail(`stateful widget completions broke (R20 T-10/21/22/23/24): ${bad.join(" | ")}`);
    else
      console.log("wc-contract: tags-input pastes/commits/limits and guards disabled, sortable-list persists order, calendar reaches January and roves across months, carousel autoplay is pausable and reduced-motion-safe, animation-controls' markers/loop/speed/progress all answer");
  }

  // ---- 28. overlay/widget trio (R20 T-17/19/20) ----------------------------
  //
  // side-sheet's mode/side/size contract, tour's self-advance and persistence,
  // notification-center's keyboard activation, live badge, archive and error
  // state. Each drives the real path on the shipped bundle.
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const mk = async (tag, attrs = {}) => {
        const el = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
        document.body.appendChild(el);
        await wait(30);
        return el;
      };
      const results = {};

      // side-sheet: non-modal keeps the background live; side/size project
      // without accumulating; showModal is the modal path.
      {
        const sibling = document.createElement("div");
        sibling.id = "sheet-sibling";
        document.body.appendChild(sibling);
        const el = await mk("contour-side-sheet", { title: "Sheet", side: "start", size: "sm", mode: "non-modal" });
        const r = { classes: { start: el.classList.contains("c-side-sheet--start"), sm: el.classList.contains("c-side-sheet--sm"), end: el.classList.contains("c-side-sheet--end") }, ariaModal: el.getAttribute("aria-modal") };
        let opens = 0, closes = 0;
        el.addEventListener("contour:open", () => opens++);
        el.addEventListener("contour:close", () => closes++);
        const trigger = document.createElement("button");
        document.body.appendChild(trigger);
        trigger.focus();
        el.show();
        await wait(40);
        r.opened = { attr: el.hasAttribute("open"), isOpen: el.classList.contains("is-open"), events: opens, siblingInert: sibling.hasAttribute("inert") };
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        await wait(40);
        r.closed = { attr: el.hasAttribute("open"), events: closes, focusBack: document.activeElement === trigger };
        el.setAttribute("side", "end");
        await wait(20);
        r.sideSwitch = { start: el.classList.contains("c-side-sheet--start"), end: el.classList.contains("c-side-sheet--end") };
        el.showModal();
        await wait(40);
        r.modal = { ariaModal: el.getAttribute("aria-modal"), open: el.hasAttribute("open") };
        el.close();
        await wait(20);
        results.sideSheet = r;
        el.remove(); sibling.remove(); trigger.remove();
      }

      // tour: opens with steps, advances itself, counts, spotlights, closes
      // on Done, and persistence skips a completed tour.
      {
        const target = document.createElement("div");
        target.id = "tour-t28";
        document.body.appendChild(target);
        const el = await mk("contour-tour", { id: "t28", steps: '[{"text":"One","target":"#tour-t28"},{"text":"Two"}]' });
        const r = { open: el.hasAttribute("open"), counter: el.querySelector(".c-tour__step")?.textContent, spotlight: target.classList.contains("c-tour__target") };
        let stepEv = null, closed = 0;
        el.addEventListener("contour:step-change", (e) => { stepEv = e.detail; });
        el.addEventListener("contour:close", () => closed++);
        el.querySelector(".c-tour__next").click();
        await wait(20);
        r.next = { current: el.getAttribute("current"), counter: el.querySelector(".c-tour__step")?.textContent, ev: stepEv, spotlightCleared: !target.classList.contains("c-tour__target") };
        el.querySelector(".c-tour__next").click();
        await wait(20);
        r.done = { open: el.hasAttribute("open"), hidden: el.hasAttribute("hidden"), closed };
        el.remove();
        try { localStorage.setItem("contour-tour:t28b", "done"); } catch (e) {}
        const el2 = await mk("contour-tour", { id: "t28b", persist: "", steps: '["Again"]' });
        r.persisted = { open: el2.hasAttribute("open"), hidden: el2.hasAttribute("hidden") };
        el2.remove(); target.remove();
        try { localStorage.removeItem("contour-tour:t28b"); } catch (e) {}
        results.tour = r;
      }

      // notification-center: badge seeds from count then follows live unread;
      // Enter activates; archive/dismiss remove; bad JSON is an error state;
      // show more keeps the panel open.
      {
        const el = await mk("contour-notification-center", { items: '[{"text":"N1"},{"text":"N2","read":true}]', count: "5" });
        const badge = () => el.querySelector(".c-notification-center__badge")?.textContent ?? null;
        const rows = () => Array.from(el.querySelectorAll(".c-notification-center__item"));
        const r = { seedBadge: badge() };
        el.querySelector(".c-notification-center__trigger").click();
        await wait(20);
        let readEv = null, selEv = null, removeEv = null, dismissEv = null;
        el.addEventListener("contour:read", (e) => { readEv = e.detail; });
        el.addEventListener("contour:select", (e) => { selEv = e.detail; });
        el.addEventListener("contour:remove", (e) => { removeEv = e.detail; });
        el.addEventListener("contour:dismiss", (e) => { dismissEv = e.detail; });
        rows()[0].focus();
        rows()[0].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
        await wait(20);
        r.enter = { read: rows()[0].classList.contains("is-read"), readEv, selEv, badge: badge(), selected: rows()[0].getAttribute("aria-selected") };
        rows()[1].querySelector(".c-notification-center__archive").click();
        await wait(20);
        r.archive = { rows: rows().length, ev: removeEv };
        rows()[0].querySelector(".c-notification-center__dismiss").click();
        await wait(20);
        r.dismiss = { rows: rows().length, ev: dismissEv };
        el.remove();
        const bad = await mk("contour-notification-center", { items: "{not json" });
        bad.querySelector(".c-notification-center__trigger").click();
        await wait(20);
        r.errorState = !!bad.querySelector('.c-notification-center__error[role="alert"]');
        bad.remove();
        const many = Array.from({ length: 60 }, (_, i) => ({ text: "N" + i }));
        const big = await mk("contour-notification-center", { items: JSON.stringify(many) });
        big.querySelector(".c-notification-center__trigger").click();
        await wait(20);
        const beforeMore = big.querySelectorAll(".c-notification-center__item").length;
        big.querySelector(".c-notification-center__more").click();
        await wait(40);
        r.more = { before: beforeMore, after: big.querySelectorAll(".c-notification-center__item").length, panelOpen: !big.querySelector(".c-notification-center__panel").hidden };
        big.remove();
        results.notif = r;
      }
      return results;
    });
    const bad = [];
    const eq = (label, got, want) => {
      const g = JSON.stringify(got), w = JSON.stringify(want);
      if (g !== w) bad.push(`${label}: ${g} != ${w}`);
    };
    // side-sheet
    eq("sheet classes", out.sideSheet?.classes, { start: true, sm: true, end: false });
    if (out.sideSheet?.ariaModal !== null) bad.push(`non-modal sheet carries aria-modal=${out.sideSheet?.ariaModal}`);
    eq("sheet opened", out.sideSheet?.opened, { attr: true, isOpen: true, events: 1, siblingInert: false });
    eq("sheet closed", out.sideSheet?.closed, { attr: false, events: 1, focusBack: true });
    eq("sheet side switch", out.sideSheet?.sideSwitch, { start: false, end: true });
    eq("sheet showModal", out.sideSheet?.modal, { ariaModal: "true", open: true });
    // tour
    if (out.tour?.open !== true) bad.push("tour with steps did not open");
    eq("tour counter", out.tour?.counter, "Step 1 / 2");
    if (out.tour?.spotlight !== true) bad.push("tour did not spotlight its target");
    eq("tour next", out.tour?.next, { current: "1", counter: "Step 2 / 2", ev: { direction: "next", index: 1 }, spotlightCleared: true });
    eq("tour done", out.tour?.done, { open: false, hidden: true, closed: 1 });
    eq("tour persisted", out.tour?.persisted, { open: false, hidden: true });
    // notification-center
    eq("badge seed", out.notif?.seedBadge, "5");
    eq("Enter activates", out.notif?.enter, { read: true, readEv: { label: "N1" }, selEv: { label: "N1" }, badge: null, selected: "true" });
    eq("archive", out.notif?.archive, { rows: 1, ev: { label: "N2" } });
    eq("dismiss", out.notif?.dismiss, { rows: 0, ev: { label: "N1" } });
    if (out.notif?.errorState !== true) bad.push("malformed items rendered no role=alert error state");
    eq("show more", out.notif?.more, { before: 50, after: 60, panelOpen: true });
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    compared += 18;
    if (bad.length)
      fail(`overlay/widget trio broke (R20 T-17/19/20): ${bad.join(" | ")}`);
    else
      console.log("wc-contract: side-sheet honours mode/side/size with focus return, tour advances itself and remembers completion, notification-center activates by keyboard, tracks unread, archives, errors aloud and pages its list");
  }

  // ---- 29. palette/tools quartet (R20 T-12 panel, T-15, T-18, T-25) --------
  //
  // command-palette's open attribute/groups/recents/return value, palette-
  // editor's edit/add/remove serialization and contrast readout, style-panel's
  // localized actions and real Revert, pull-to-refresh's visible gesture and
  // consumer-driven completion.
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    await p.waitForFunction(() => !!window.ContourElements, null, { timeout: 20000 });
    const out = await p.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const mk = async (tag, attrs = {}) => {
        const el = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
        document.body.appendChild(el);
        await wait(30);
        return el;
      };
      const results = {};

      // command-palette
      {
        const items = '[{"label":"Zoom in","group":"Map"},{"label":"Zoom out","group":"Map"},{"label":"Export","group":"Data"}]';
        const el = await mk("contour-command-palette", { id: "cmd29", items });
        const r = {};
        let opens = 0, sel = null;
        el.addEventListener("contour:open", () => opens++);
        el.addEventListener("contour:select", (e) => { sel = e.detail; });
        el.setAttribute("open", "");
        await wait(40);
        r.openAttr = { open: el.classList.contains("is-open") || el.matches(":popover-open"), events: opens, groups: el.querySelectorAll(".c-command-palette__group").length };
        const search = el.querySelector(".c-command-palette__search");
        const vis = () => Array.from(el.querySelectorAll(".c-command-palette__item")).filter((i) => !i.hidden);
        search.value = "zoom";
        search.dispatchEvent(new Event("input", { bubbles: true }));
        r.filter = { visible: vis().length, dataHeaderHidden: Array.from(el.querySelectorAll(".c-command-palette__group")).find((g) => g.textContent === "Data")?.hidden };
        search.value = "zzz";
        search.dispatchEvent(new Event("input", { bubbles: true }));
        r.noResults = !!el.querySelector('.c-command-palette__empty[role="status"]');
        search.value = "";
        search.dispatchEvent(new Event("input", { bubbles: true }));
        search.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
        search.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
        await wait(40);
        r.select = { ev: sel, value: el.value, closed: !(el.classList.contains("is-open") || el.matches(":popover-open")) };
        el.show();
        await wait(40);
        r.recents = Array.from(el.querySelectorAll('.c-command-palette__item[data-recent="true"]')).map((i) => i.dataset.label);
        // The typed query survives an items re-render.
        const s2 = el.querySelector(".c-command-palette__search");
        s2.value = "zo";
        s2.dispatchEvent(new Event("input", { bubbles: true }));
        el.setAttribute("items", '[{"label":"Zoom in","group":"Map"}, {"label":"Zoom out","group":"Map"}, {"label":"Export","group":"Data"}]');
        await wait(30);
        r.querySurvives = el.querySelector(".c-command-palette__search").value;
        el.removeAttribute("open");
        await wait(40);
        r.closeAttr = !(el.classList.contains("is-open") || el.matches(":popover-open"));
        results.cmd = r;
        el.remove();
        try { localStorage.removeItem("contour-command-palette:cmd29:recents"); } catch (e) {}
      }

      // palette-editor
      {
        const el = await mk("contour-palette-editor", { colors: '["#ff0000","#00ff00"]' });
        const r = { parts: { swatches: el.querySelectorAll(".c-palette-editor__swatch").length, edits: el.querySelectorAll(".c-palette-editor__edit").length, removes: el.querySelectorAll(".c-palette-editor__remove").length, add: !!el.querySelector(".c-palette-editor__add") } };
        let change = null, removed = null, added = null;
        el.addEventListener("contour:change", (e) => { change = e.detail; });
        el.addEventListener("contour:remove", (e) => { removed = e.detail; });
        el.addEventListener("contour:add", (e) => { added = e.detail; });
        el.querySelectorAll(".c-palette-editor__swatch")[0].click();
        await wait(30);
        r.select = { selected: el.querySelector(".c-palette-editor__swatch").classList.contains("is-selected"), contrast: /on white/.test(el.querySelector(".c-palette-editor__contrast")?.textContent || ""), ev: change };
        const edit = el.querySelectorAll(".c-palette-editor__edit")[0];
        edit.value = "#0000ff";
        edit.dispatchEvent(new Event("change", { bubbles: true }));
        await wait(30);
        r.edit = { colors: el.getAttribute("colors"), ev: change };
        el.querySelectorAll(".c-palette-editor__remove")[1].click();
        await wait(30);
        r.remove = { count: JSON.parse(el.getAttribute("colors")).length, ev: removed };
        el.querySelector(".c-palette-editor__add").click();
        await wait(30);
        r.add = { count: JSON.parse(el.getAttribute("colors")).length, ev: added };
        results.palette = r;
        el.remove();
      }

      // style-panel: localized Apply still applies; Revert restores defaults.
      {
        const el = await mk("contour-style-panel", { single: "", layer: "Roads", property: "speed", classification: "equal", palette: "viridis", n: "4", colors: '["#111111","#222222"]', labels: '{"apply":"Appliquer","revert":"Revenir"}' });
        const r = {};
        let resolved = null;
        el.addEventListener("contour:style-resolved", (e) => { resolved = e.detail; });
        const applyBtn = Array.from(el.querySelectorAll("button")).find((b) => b.textContent === "Appliquer");
        r.localized = !!applyBtn;
        applyBtn?.click();
        r.apply = resolved;
        const prop = el.querySelector(".c-style-panel__property");
        prop.value = "flow";
        prop.dispatchEvent(new Event("change", { bubbles: true }));
        const revertBtn = Array.from(el.querySelectorAll("button")).find((b) => b.textContent === "Revenir");
        revertBtn?.click();
        await wait(30);
        r.revert = { attr: el.getAttribute("property"), shown: el.querySelector(".c-style-panel__property")?.value, ev: resolved };
        results.stylePanel = r;
        el.remove();
      }

      // pull-to-refresh: the gesture is visible, completion is consumer-driven.
      {
        const el = await mk("contour-pull-to-refresh", { threshold: "50" });
        const content = document.createElement("div");
        content.textContent = "content";
        el.appendChild(content);
        const r = {};
        let refreshes = 0, errorEv = null;
        el.addEventListener("contour:refresh", () => refreshes++);
        el.addEventListener("contour:error", (e) => { errorEv = e.detail; });
        const ind = () => el.querySelector(".c-pull-to-refresh__indicator");
        const opts = { bubbles: true, clientY: 100, pointerId: 11 };
        el.dispatchEvent(new PointerEvent("pointerdown", opts));
        el.dispatchEvent(new PointerEvent("pointermove", { ...opts, clientY: 200 }));
        r.pullOffset = el.style.getPropertyValue("--ptr-offset");
        r.pullTransform = getComputedStyle(ind()).transform;
        el.dispatchEvent(new PointerEvent("pointerup", { ...opts, clientY: 200 }));
        await wait(40);
        r.pull = { refreshes, refreshing: el.classList.contains("is-refreshing"), busy: el.getAttribute("aria-busy"), text: ind().textContent.includes("Refreshing") };
        el.complete();
        await wait(40);
        r.complete = { refreshing: el.classList.contains("is-refreshing"), busy: el.getAttribute("aria-busy") };
        el.fail("Boom");
        await wait(40);
        r.fail = { hasError: el.classList.contains("has-error"), text: ind().textContent.includes("Boom"), ev: errorEv };
        el.querySelector(".c-pull-to-refresh__btn").click();
        await wait(40);
        r.btn = { refreshes, errorCleared: !el.classList.contains("has-error") };
        el.complete();
        await wait(40);
        r.idleText = ind().textContent.includes("Pull to refresh");
        results.ptr = r;
        el.remove();
      }
      return results;
    });
    const bad = [];
    const eq = (label, got, want) => {
      const g = JSON.stringify(got), w = JSON.stringify(want);
      if (g !== w) bad.push(`${label}: ${g} != ${w}`);
    };
    // command-palette
    eq("palette open attribute", out.cmd?.openAttr, { open: true, events: 1, groups: 2 });
    eq("palette filter", out.cmd?.filter, { visible: 2, dataHeaderHidden: true });
    if (out.cmd?.noResults !== true) bad.push("no-results state missing");
    eq("palette select", out.cmd?.select, { ev: { index: 1, label: "Zoom out" }, value: { index: 1, label: "Zoom out" }, closed: true });
    eq("palette recents", out.cmd?.recents, ["Zoom out"]);
    eq("palette query survives", out.cmd?.querySurvives, "zo");
    if (out.cmd?.closeAttr !== true) bad.push("removing open did not close the palette");
    // palette-editor
    eq("editor parts", out.palette?.parts, { swatches: 2, edits: 2, removes: 2, add: true });
    eq("editor select", out.palette?.select, { selected: true, contrast: true, ev: { color: "#ff0000" } });
    if (!String(out.palette?.edit?.colors).includes("#0000ff")) bad.push(`edit did not write colors back: ${out.palette?.edit?.colors}`);
    if (out.palette?.edit?.ev?.color !== "#0000ff" || !Array.isArray(out.palette?.edit?.ev?.values)) bad.push(`edit event: ${JSON.stringify(out.palette?.edit?.ev)}`);
    eq("editor remove", out.palette?.remove, { count: 1, ev: { value: "#00ff00" } });
    if (out.palette?.add?.count !== 2 || out.palette?.add?.ev?.value !== "#888888") bad.push(`editor add: ${JSON.stringify(out.palette?.add)}`);
    // style-panel
    if (out.stylePanel?.localized !== true) bad.push("localized Apply button not rendered");
    if (out.stylePanel?.apply?.applied !== true || out.stylePanel?.apply?.property !== "speed" || out.stylePanel?.apply?.n !== 4) bad.push(`localized Apply payload: ${JSON.stringify(out.stylePanel?.apply)}`);
    eq("panel revert", out.stylePanel?.revert, { attr: "speed", shown: "speed", ev: { applied: false } });
    // pull-to-refresh
    eq("ptr offset", out.ptr?.pullOffset, "60px");
    if (!out.ptr?.pullTransform || out.ptr?.pullTransform === "none") bad.push(`indicator transform ignores --ptr-offset: ${out.ptr?.pullTransform}`);
    eq("ptr pull", out.ptr?.pull, { refreshes: 1, refreshing: true, busy: "true", text: true });
    eq("ptr complete", out.ptr?.complete, { refreshing: false, busy: "false" });
    eq("ptr fail", out.ptr?.fail, { hasError: true, text: true, ev: { message: "Boom" } });
    eq("ptr button", out.ptr?.btn, { refreshes: 2, errorCleared: true });
    if (out.ptr?.idleText !== true) bad.push("idle label not restored after complete");
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    compared += 23;
    if (bad.length)
      fail(`palette/tools quartet broke (R20 T-12/15/18/25): ${bad.join(" | ")}`);
    else
      console.log("wc-contract: command-palette opens from its attribute with groups/recents/return value, palette-editor serializes edits with contrast feedback, style-panel's localized actions apply and revert for real, pull-to-refresh is visible and completes on the consumer's call");
  }
} finally {
  await browser.close();
  server.close();
}

// A run that compared nothing is not a pass.
if (!compared) fail("compared 0 elements and 0 render cases — the sweep matched nothing, so it proved nothing");

if (errors.length) {
  console.error("wc-contract: FAIL\n  " + errors.join("\n  "));
  process.exit(1);
}
console.log(`wc-contract: PASS — ${compared} measurements compared`);
