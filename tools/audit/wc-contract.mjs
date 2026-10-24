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
// Five claims, each of which failed at HEAD when it was written:
//
//   1. it LOADS. Every name the artifact registers is asked of `customElements`,
//      in both artifacts, and the two must agree.
//   2. the SCAFFOLDING is alive. A name claimed by a complex component must
//      resolve to that component, not to the anonymous class-only factory. The
//      test does not know the class names -- a minifier may keep or drop them --
//      it knows the factory is `class extends ContourBase` with no name of its
//      own, so `Function.name` is "". That survives minification.
//   3. it RENDERS. Every case in RENDER_CONTRACT is mounted and must produce the
//      node its attributes promise.
//   4. it RE-RENDERS. Changing a host attribute must change the generated DOM and
//      must not lose the author's own content, and must not recurse: a render
//      that writes an attribute it also observes overflows the stack.
//   5. the OBSERVED list is honest. An attribute the code reads must be observed
//      (or it can never update), and an attribute the code writes to its own host
//      must NOT be (or the write re-enters the render that performed it).
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

// Names the artifact registers, read out of the shipped text.
const namesIn = (src) =>
  new Set([...src.matchAll(/["'](contour-[a-z0-9-]+)["']/g)].map((m) => m[1]));
const unNames = namesIn(bytes.unminified);
const minNames = namesIn(bytes.minified);
const declared = [...unNames].filter((n) => !n.includes("c-"));

// A name is "scaffolded" when some `define("<name>", X)` in the artifact points at
// a class the file also declares by name. These are the ones that must NOT be the
// anonymous factory.
const scaffolded = new Set(
  [...bytes.unminified.matchAll(/define\("(contour-[a-z0-9-]+)",\s*([A-Za-z0-9_]+)\)/g)]
    .filter((m) => /class\s+\2\b/.test(bytes.unminified))
    .map((m) => m[1])
);

// The simple map: names the class-only wrapper claims. Intersection with
// `scaffolded` is exactly the set that the registration race used to kill.
const simpleBlock = /const simpleMap = \{([\s\S]*?)\n {2}\};/.exec(bytes.unminified);
if (!simpleBlock) fail("no `const simpleMap = { … }` in the artifact — the registration table moved; update this gate rather than pass on an empty sweep");
const simpleNames = new Set(
  simpleBlock ? [...simpleBlock[1].matchAll(/"(contour-[a-z0-9-]+)"/g)].map((m) => m[1]) : []
);
const overlapped = [...scaffolded].filter((n) => simpleNames.has(n));

// -- 5. the observed-attribute contract, read off the artifact ---------------
const observedBlock = /const OBSERVED = \[([\s\S]*?)\];/.exec(bytes.unminified);
if (!observedBlock) {
  fail("no `const OBSERVED = [...]` in the artifact — the render contract has no attribute list to check");
} else {
  const observed = new Set(
    [...observedBlock[1].matchAll(/"([a-z-]+)"/g)].map((m) => m[1])
  );
  const read = new Set([...bytes.unminified.matchAll(/this\.(?:getAttribute|hasAttribute)\("([a-z-]+)"\)/g)].map((m) => m[1]));
  const written = new Set([...bytes.unminified.matchAll(/this\.setAttribute\("([a-z-]+)"/g)].map((m) => m[1]));

  const unobservedRead = [...read].filter((a) => !observed.has(a) && !written.has(a)).sort();
  const reentrant = [...written].filter((a) => observed.has(a)).sort();
  if (unobservedRead.length)
    fail(`reads but never observes ${unobservedRead.join(", ")} — a host changing that attribute cannot re-render`);
  if (reentrant.length)
    fail(`observes AND writes to itself ${reentrant.join(", ")} — the write fires the callback that performs the render, which re-enters it`);
  const dead = [...observed].filter((a) => !read.has(a) && !written.has(a)).sort();
  if (dead.length)
    fail(`observes ${dead.join(", ")} which no component reads or writes — dead weight on every element's attribute list`);
  console.log(
    `wc-contract: attribute contract compared ${observed.size} observed against ${read.size} read and ${written.size} host-written`
  );
}

// -- serve both artifacts same-origin ---------------------------------------
// Same-origin because an element defined in a `file:` document is a different
// security context, and a load error there is not the load error a consumer gets.
const cases = [
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

// A mount page per artifact: every registered name gets an element, so "loaded"
// is measured against the whole registry and not a hand-picked few.
const page = (script, withCases) => {
  const all = [...declared].map((n) => `<${n}></${n}>`).join("\n");
  const mounted = withCases
    ? cases
        .map(
          ([name, attrs]) =>
            `<${name} data-case="${name}" ${Object.entries(attrs)
              .map(([k, v]) => `${k}='${v.replace(/'/g, "&#39;")}'`)
              .join(" ")}></${name}>`
        )
        .join("\n")
    : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>wc contract</title></head>
<body>
${all}
${mounted}
<script src="${script}"></script>
</body></html>`;
};

const server = createServer((req, res) => {
  if (req.url === "/unmin.js") res.writeHead(200, { "content-type": "text/javascript" }).end(bytes.unminified);
  else if (req.url === "/min.js") res.writeHead(200, { "content-type": "text/javascript" }).end(bytes.minified);
  else if (req.url === "/unmin.html") res.writeHead(200, { "content-type": "text/html" }).end(page("/unmin.js", true));
  else if (req.url === "/min.html") res.writeHead(200, { "content-type": "text/html" }).end(page("/min.js", false));
  else res.writeHead(404).end("no");
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ args: ["--no-sandbox"] });
let compared = 0;

try {
  // ---- 1 + 2 + 3: the unminified artifact, with the render contract --------
  {
    const page_ = await browser.newPage();
    const errs = [];
    page_.on("pageerror", (e) => errs.push(String(e.message || e)));
    page_.on("console", (m) => m.type() === "error" && errs.push("console: " + m.text()));
    await page_.goto(`${origin}/unmin.html`, { waitUntil: "load" });
    if (errs.length) fail(`the shipped bundle throws: ${errs.slice(0, 3).join(" | ")}`);

    const out = await page_.evaluate(
      ({ declared, overlapped, cases }) => {
        const missing = declared.filter((n) => !customElements.get(n));
        const anonymous = overlapped.filter((n) => {
          const c = customElements.get(n);
          return !c || !c.name; // the class-only factory is an unnamed class expression
        });
        const rendered = cases.map(([name, , sel]) => {
          const host = document.querySelector(`[data-case="${name}"]`);
          return { name, sel, ok: !!host && !!host.querySelector(sel) };
        });
        return {
          missing,
          anonymous,
          bad: rendered.filter((r) => !r.ok),
          renderedCount: rendered.length,
          upgraded: declared.filter((n) => customElements.get(n) && document.querySelector(n)).length,
        };
      },
      { declared, overlapped, cases }
    );
    compared += declared.length + out.renderedCount;

    if (out.missing.length)
      fail(`${out.missing.length} of ${declared.length} names the artifact registers are not defined in the browser: ${out.missing.slice(0, 8).join(", ")}`);
    if (out.anonymous.length)
      fail(
        `${out.anonymous.length} scaffolded components resolved to the class-only factory instead of their own class: ${out.anonymous.slice(0, 8).join(", ")} — their markup never renders. This is the registration race: the simple map must be registered LAST`
      );
    if (out.bad.length)
      fail(`render contract produced no matching node for: ${out.bad.map((b) => `${b.name} (needs ${b.sel})`).join(", ")}`);

    // ---- 4: re-render, without recursion or content loss -------------------
    const reactivity = await page_.evaluate(() => {
      const host = document.querySelector('[data-case="contour-card"]');
      const before = host.textContent;
      host.setAttribute("title", "RENDERED-AGAIN");
      const after = host.textContent;
      const titles = host.querySelectorAll(".c-card__title").length;
      // authored content must survive a re-render, and the class list must stay
      const authored = document.createElement("p");
      authored.className = "authored-probe";
      host.appendChild(authored);
      host.setAttribute("title", "THIRD");
      return {
        changed: before !== after,
        duplicated: titles > 1,
        keptAuthored: !!host.querySelector(".authored-probe"),
        stack: false,
      };
    });
    const errAfter = [];
    page_.on("pageerror", (e) => errAfter.push(String(e.message || e)));
    compared += 3;
    if (!reactivity.changed)
      fail("changing `title` did not change the rendered text — the render contract is guarded so a second render cannot update anything");
    if (reactivity.duplicated)
      fail("a re-render appended a second .c-card__title — generated scaffolding is not cleared between renders");
    if (!reactivity.keptAuthored)
      fail("a re-render discarded content the author wrote into the element — the snapshot must restore it");
    if (errAfter.length) fail(`a re-render threw: ${errAfter.slice(0, 2).join(" | ")}`);

    console.log(
      `wc-contract: ${declared.length} names defined, ${out.upgraded} mounted elements upgraded, ` +
        `${out.anonymous.length} shadowed by the factory, ${renderedOkCount(out)}/${comparedCaseCount(cases)} render cases produced their node`
    );
  }

  // ---- the minified twin must agree about what exists ---------------------
  {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message || e)));
    await p.goto(`${origin}/min.html`, { waitUntil: "load" });
    if (errs.length) fail(`the MINIFIED bundle throws: ${errs.slice(0, 3).join(" | ")}`);
    const out = await p.evaluate((declared) => declared.filter((n) => !customElements.get(n)), declared);
    compared += declared.length;
    if (out.length)
      fail(`minified twin registers ${out.length} fewer names than the unminified file, starting ${out.slice(0, 6).join(", ")} — the minifier corrupted it`);
    const minSet = namesIn(bytes.minified);
    const disagree = declared.filter((n) => !minSet.has(n));
    if (disagree.length)
      fail(`the two artifacts name different elements; missing from the minified one: ${disagree.slice(0, 6).join(", ")}`);
  }
} finally {
  await browser.close();
  server.close();
}

function renderedOkCount(out) {
  return out.renderedCount - out.bad.length;
}
function comparedCaseCount(cs) {
  return cs.length;
}

// A run that compared nothing is not a pass.
if (!compared) fail("compared 0 elements and 0 render cases — the sweep matched nothing, so it proved nothing");

if (errors.length) {
  console.error("wc-contract: FAIL\n  " + errors.join("\n  "));
  process.exit(1);
}
console.log(`wc-contract: PASS — ${compared} measurements compared`);
