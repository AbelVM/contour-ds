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
const FX_ROWS = JSON.stringify([{ key: "A", value: "1" }, { key: "B", value: "2" }]);

const server = createServer((req, res) => {
  if (req.url === "/unmin.js") res.writeHead(200, { "content-type": "text/javascript" }).end(bytes.unminified);
  else if (req.url === "/min.js") res.writeHead(200, { "content-type": "text/javascript" }).end(bytes.minified);
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
  // All previously ledgered orphans have been resolved: c-accordion and
  // c-elevation dropped their host class (no rule existed and none was needed),
  // c-loading and c-expandable__body gained minimal CSS rules.
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

    // ---- 7. every registration attempt succeeded --------------------------
    if (load.rejected.length)
      fail(`${load.rejected.length} registrations threw: ${load.rejected.slice(0, 8).join(", ")} — a caught error here is a component that silently does not exist; the bundle must register each name once`);
    const attemptedUnique = new Set(load.attemptedNames).size;
    if (load.attempted !== attemptedUnique)
      fail(`${load.attempted - attemptedUnique} names were handed to customElements.define more than once (${load.attempted} attempts, ${attemptedUnique} names) — the second attempt throws, and a catch makes it invisible`);
    if (load.registry.length !== attemptedUnique)
      fail(`the registry holds ${load.registry.length} names but ${attemptedUnique} were registered — the list does not describe what the browser was handed`);

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
      ({ registry, overlapped, RENDER_CONTRACT }) => {
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
        // when the node is rebuilt. Host-level delegation survives. Mount a
        // form-associated component, listen on the host, re-render, dispatch.
        const lf = document.createElement("contour-field");
        lf.setAttribute("label", "Probe");
        lf.setAttribute("placeholder", "q");
        document.body.appendChild(lf);
        let fired = false;
        lf.addEventListener("input", () => { fired = true; });
        lf.setAttribute("placeholder", "changed");
        const inp = lf.querySelector("input, textarea, select");
        if (inp) {
          inp.value = "x";
          inp.dispatchEvent(new Event("input", { bubbles: true }));
        }
        const listenerSurvived = fired;

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
        for (const s of document.styleSheets) {
          try {
            for (const r of s.cssRules) for (const m of (r.selectorText || "").matchAll(/\.c-[a-z0-9_-]+/g)) definedClasses.add(m[0].slice(1));
            const walk = (rule) => { for (const inner of (rule.cssRules || [])) { for (const m of (inner.selectorText || "").matchAll(/\.c-[a-z0-9_-]+/g)) definedClasses.add(m[0].slice(1)); if (inner.cssRules) walk(inner); } };
            for (const r of s.cssRules) walk(r);
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
  //     and a flaky fixture proves the retry click really asked again).
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
      };

      // src success: rows render, no state node survives.
      const okHost = mk({ src: "/fx/ok.json" });
      await wait(120);
      const ok = readState(okHost);

      // 404 and malformed: an error node, never the empty state.
      const missHost = mk({ src: "/fx/missing" });
      await wait(120);
      const missing = readState(missHost);
      const badHost = mk({ src: "/fx/bad.json" });
      await wait(120);
      const malformed = readState(badHost);

      // Abort on disconnect: a slow source removed mid-flight stops being
      // written to. A re-mount of the same URL must re-fetch (the aborted
      // request cannot have fulfilled a cache), so after the wait the fresh
      // mount shows rows while the detached host shows nothing new.
      const detachHost = mk({ src: "/fx/slow.json" });
      const loadingWhileConnected = readState(detachHost).loading;
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

      return { byAttr, ok, missing, malformed, loadingWhileConnected, afterDetach, reMounted, flakyFirst, flakyAfter, retried };
    });
    compared += 14;
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
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    if (bad.length)
      fail(`state contract broke: ${bad.join(" | ")}`);
    else
      console.log(`wc-contract: state contract holds — one node per state, 404/malformed are errors not empties, no inline style on a state node, disconnect aborts, retry re-fetches (${out.ok.rows} ok rows, ${out.flakyAfter.rows} re-fetched rows)`);
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
    if (errs.length) bad.push(`page errors: ${errs.slice(0, 2).join(" | ")}`);
    compared += 21;
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
