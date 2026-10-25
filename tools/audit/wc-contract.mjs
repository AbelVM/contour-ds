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
  const read = new Set([...bytes.unminified.matchAll(/this\.(?:getAttribute|hasAttribute)\("([a-z-]+)"\)/g)].map((m) => m[1]));
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
  ["contour-alert", { title: "Heads up", body: "text", variant: "warn" }, ".c-alert__title"],
  ["contour-pagination", { pages: "5", current: "2" }, ".c-pagination__link"],
  ["contour-accordion", { items: '[{"q":"A","a":"B"}]' }, ".c-disclosure"],
  ["contour-readout", { rows: '[{"key":"K","value":"V"}]' }, ".c-readout__row"],
  ["contour-steps", { steps: '["One","Two"]' }, ".c-steps__item"],
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

// The self-test page for the leak probe. A global lexical binding is created by
// a classic script, not by `eval` -- a declaration inside an eval is scoped to
// that call -- so the canary is two script files that declare the same name. If
// the probe cannot see the first one, claim 6 is blind; if the second one is not
// fatal to its own script, the consumer failure this claim exists for is fiction.
const CANARY = "__wcContractCanary";

const server = createServer((req, res) => {
  if (req.url === "/unmin.js") res.writeHead(200, { "content-type": "text/javascript" }).end(bytes.unminified);
  else if (req.url === "/min.js") res.writeHead(200, { "content-type": "text/javascript" }).end(bytes.minified);
  else if (req.url === "/contour.css") res.writeHead(200, { "content-type": "text/css" }).end(readFileSync(join(ROOT, "dist/contour.css"), "utf-8"));
  else if (req.url === "/unmin.html") res.writeHead(200, { "content-type": "text/html" }).end(shell("/unmin.js"));
  else if (req.url === "/min.html") res.writeHead(200, { "content-type": "text/html" }).end(shell("/min.js"));
  else if (req.url === "/control.html") res.writeHead(200, { "content-type": "text/html" }).end(shell(""));
  else if (req.url === "/canary1.js") res.writeHead(200, { "content-type": "text/javascript" }).end(`let ${CANARY} = 1;`);
  else if (req.url === "/canary2.js") res.writeHead(200, { "content-type": "text/javascript" }).end(`let ${CANARY} = 2; window.__dupRan = true;`);
  else if (req.url === "/canary.html") res.writeHead(200, { "content-type": "text/html" }).end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>canary</title></head><body>
<script src="/canary1.js"></script>
<script>window.__seen = (function () { try { window.eval("void ${CANARY};"); return true; } catch (e) { return false; } })();</script>
<script src="/canary2.js"></script>
<script>window.__ranAfter = true;</script>
</body></html>`);
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
  "c-accordion": "contour-accordion renders .c-disclosure children; its own host class has no rule, and the block is a naming alias for disclosure rather than a component",
  "c-loading": "contour-loading renders .c-spinner; the host class is a label with no rule, and spinner is the block that carries the visual",
  "c-elevation": "contour-elevation is the element form of the elevation specimen, which is carried by --shadow-* tokens and no .c-elevation rule",
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

        const rendered = RENDER_CONTRACT.map(([name, attrs, sel]) => {
          const host = document.createElement(name);
          for (const [k, v] of Object.entries(attrs)) host.setAttribute(k, v);
          document.body.appendChild(host);
          host.dataset.case = name;
          return { name, sel, ok: !!host.querySelector(sel) };
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
        for (const n of registry) {
          const el = document.querySelector(n);
          if (!el) continue;
          // the host carries a class too, and a class the system never defines is
          // orphaned wherever it lands
          const nodes = [el];
          if (el.shadowRoot) nodes.push(...Array.from(el.shadowRoot.querySelectorAll("[class]")));
          else nodes.push(...Array.from(el.querySelectorAll("[class]")));
          const where = el.shadowRoot ? "shadow" : "host";
          for (const node of nodes) {
            if (typeof node.className !== "string") continue;
            for (const c of node.className.split(/\s+/))
              if (/^c-[a-z0-9-]+$/.test(c) && !definedClasses.has(c)) orphan.push(`${n} ${where} > .${c}`);
          }
        }

        return {
          missing, anonymous, mounted, registry: registry.length,
          bad: rendered.filter((r) => !r.ok), renderedCount: rendered.length,
          thin, unshared, parity, wrappers: wrappers.length, docRules,
          bareTable, reactivity: { changed: before !== after, duplicated: titles > 1, keptAuthored },
          mod, orphan: [...new Set(orphan)],
        };
      },
      { registry: load.registry, overlapped, RENDER_CONTRACT }
    );
    compared += out.renderedCount + out.wrappers + out.orphan.length + 5;

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

    console.log(
      `wc-contract: ${out.registry} names registered, ${out.mounted} mounted and upgraded, ${out.wrappers} shadow wrappers each adopting ${out.docRules} rules, ` +
        `${out.anonymous.length} shadowed by the factory, ${out.renderedCount - out.bad.length}/${out.renderedCount} render cases produced their node`
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
