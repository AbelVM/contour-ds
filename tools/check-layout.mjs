#!/usr/bin/env node
/**
 * Layout vocabulary (C-35).
 *
 * The system had three ways to arrange boxes, and the split was not cosmetic.
 * Measured, not assumed:
 *
 *   base.css (unprefixed)  .container .stack .cluster .section .grid .grid--2/3/4 .split
 *   utilities.css          .u-cols-2 .u-cols-3 .u-auto-grid
 *   components.css         .c-row .c-stack .c-stack--sm/--lg .c-cluster .c-sidebar
 *
 * What the numbers say:
 *   - the shipped templates use base vocabulary only (landing 29, dashboard 2,
 *     docs 3, and `.c-*` 0 in all three), while src/ internals use `.c-*` only
 *     (components.css 7, components-data.css 4, base vocabulary 0). So a
 *     consumer copying a starter learns one vocabulary and reading the system
 *     learns another;
 *   - `.u-cols-*` and `.u-auto-grid` have ZERO consumers anywhere in the
 *     repository, including the guide, the templates and the docs;
 *   - `.stack` gaps by `--space-stack` (1.25rem) and `.c-stack` by `--space-sm`
 *     (1rem); `.cluster` gaps `--space-2xs` (0.5rem) and `.c-cluster` `--space-sm`
 *     (1rem). They are the same SHAPE with different NUMBERS, which is why
 *     aliasing one onto the other is not a safe mechanical fix: it would restyle
 *     every use silently.
 *
 * So this gate does the two things that can be done without guessing at a
 * migration nobody has approved:
 *
 *   1. a RATCHET. The layout primitives are a frozen set. A fourth vocabulary
 *      appearing cannot pass review silently, and the set can only shrink.
 *   2. the DEPRECATION POLICY, enforced. AGENTS.md says an item is deprecated by
 *      adding `@deprecated` to its doc comment, and the name stays. Before this
 *      file, `@deprecated` appeared in zero files and no tool read it: a policy
 *      nobody checks is a policy nobody follows. Here every `@deprecated` block
 *      must be named in the ledger below, and every ledger entry must still be
 *      declared in src/css until it is actually removed at a major.
 *
 * Both halves assert the population they scanned; a run that matched nothing is
 * a failure, not a pass.
 *
 *   node tools/check-layout.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const CSS = join(ROOT, "src/css");

/**
 * The frozen vocabulary. Names may be REMOVED here at a major (the deprecation
 * ledger says when); adding a name here is the moment to argue for a fourth
 * layout vocabulary, which is the whole point of the ratchet.
 */
const LEDGER = {
  // page- and document-level layout, `@layer base`
  base: ["container", "container--narrow", "container--reading", "stack", "stack--tight", "stack--loose",
    "cluster", "section", "section--sunken", "section--raised", "grid", "grid--2", "grid--3", "grid--4", "split"],
  // component-level layout, `@layer components`
  components: ["c-row", "c-stack", "c-stack--sm", "c-stack--lg", "c-cluster", "c-sidebar", "c-container",
    "c-container--scrollable"],
  // utilities, `@layer utilities`
  utilities: ["u-cols-2", "u-cols-3", "u-auto-grid"],
};

/**
 * Deprecated and why, with the release that removes it. Kept as data so the
 * removal is scheduled rather than remembered.
 */
const DEPRECATED = {
  "u-cols-2": "no consumer anywhere; `.grid--2` is the same job and is what the guide and templates use",
  "u-cols-3": "no consumer anywhere; `.grid--3` is the same job",
  "u-auto-grid": "no consumer anywhere; `.grid` with a `--grid-min` override, or `.grid--4`, covers it",
};

// The pairs whose difference is a NUMBER, not a shape. An alias that ignores
// these is a silent restyle, so the gate pins the gap token each one uses.
const GAP_CONTRACT = [
  { a: "stack", ga: "--space-stack", b: "c-stack", gb: "--space-sm" },
  { a: "cluster", ga: "--space-2xs", b: "c-cluster", gb: "--space-sm" },
];

const uncomment = (t) => t.replace(/\/\*[\s\S]*?\*\//g, " ");
const errors = [];
const files = readdirSync(CSS).filter((f) => f.endsWith(".css"));
const declared = new Map(); // name -> Set(file)
const marked = new Map(); // deprecated layout name -> file
let markerTotal = 0;    // every @deprecated in src/css, attached or not

// The layout WORDS, and the spellings they take. A name is a layout primitive
// when it is [prefix-]word[--modifier | -digits]. Matching on a prefix alone
// sweeps in every component: a first version tested `c-*` and so collected
// `.c-table-wrap`, `.c-field__hint` and the rest, and the ratchet would have
// reported all 134 components as undeclared layout primitives — a gate that
// fails the build it was written to guard.
const WORDS = "container|stack|cluster|section|grid|split|sidebar|row|cols|auto-grid";
const SHAPE = new RegExp(`^(?:(?:u|c|l|m|o)-)?(?:${WORDS})(?:--[\\w-]+|-[\\d]+)?$`);
const isLayoutName = (name) => SHAPE.test(name);

for (const f of files) {
  const raw = readFileSync(join(CSS, f), "utf8");
  // Blanket each comment with SPACES so selector indices still line up with the
  // raw text. But the mask makes a comment indistinguishable from padding, so the
  // FIRST version of the walk below stepped backwards over an @deprecated note as
  // if it were whitespace and landed on the previous rule's `}` — positions were
  // preserved, and that is exactly why the walk may not use the mask. Comments are
  // matched against the raw text, by span, below.
  const flat = raw.replace(/\/\*[\s\S]*?\*\//g, (m) => " ".repeat(m.length));
  const comments = [...raw.matchAll(/\/\*[\s\S]*?\*\//g)].map((m) => ({
    start: m.index,
    end: m.index + m[0].length,
    text: m[0],
  }));
  const rules = [];
  for (const m of flat.matchAll(/\.([a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:--[\w-]+)?)(\s*[,{:])/g)) {
    const name = m[1];
    if (!isLayoutName(name)) continue;
    if (!declared.has(name)) declared.set(name, new Set());
    declared.get(name).add(f);
    rules.push({ name, at: m.index });
  }
  for (const rule of rules) {
    // The marker belongs to the rule that FOLLOWS it, so walk the comment spans
    // backwards from the selector, accepting a comment only when nothing but
    // whitespace lies between its end and the current cursor. A banner comment and
    // the @deprecated note beneath it are therefore both readable, while a rule
    // with no note of its own is never credited with its neighbour's.
    let cursor = rule.at;
    let attached = false;
    for (;;) {
      const preceding = comments
        .filter((c) => c.end <= cursor && /^\s*$/.test(raw.slice(c.end, cursor)))
        .pop();
      if (!preceding) break;
      if (/@deprecated/.test(preceding.text)) attached = true;
      cursor = preceding.start;
    }
    if (attached) marked.set(rule.name, f);
  }
  markerTotal += (raw.match(/@deprecated/g) || []).length;
}

// Both directions, because the two failure modes are different. A marker on a
// name nobody deprecated is drift; a deprecated name with no marker is the
// policy existing on paper only — which is what this file was written to end.
const unledgered = [...marked.keys()].filter((n) => !DEPRECATED[n]);
for (const n of unledgered) errors.push(`${marked.get(n)}: .${n} carries @deprecated but is not in this gate's ledger`);
const unmarked = Object.keys(DEPRECATED).filter((n) => !marked.has(n));
if (unmarked.length)
  errors.push(`the ledger deprecates ${unmarked.join(", ")}, but no @deprecated note sits on those rules`);
if (markerTotal !== marked.size)
  errors.push(
    `${markerTotal} @deprecated marker(s) in src/css but only ${marked.size} attach to a layout rule — a marker attached to nothing marks nothing`,
  );


// ---- 1. ratchet -------------------------------------------------------
const allowed = new Set([...LEDGER.base, ...LEDGER.components, ...LEDGER.utilities]);
const surprises = [...declared.keys()].filter((n) => !allowed.has(n));
if (surprises.length) {
  errors.push(
    `undeclared layout primitives: ${surprises.join(", ")} — add to the ledger only with a reason for a new ` +
      `vocabulary, otherwise migrate to the existing one`,
  );
}
const vanished = [...allowed].filter((n) => !declared.has(n));
if (vanished.length) {
  // Not an error: it means a removal happened. The ledger must shrink with it,
  // or the file claims primitives that no longer exist.
  errors.push(`the ledger lists ${vanished.join(", ")}, which src/css no longer declares — shrink the ledger`);
}
if (!declared.size) {
  errors.push("no layout primitives found in src/css — this gate scanned an empty population and proves nothing");
}

// ---- 2. the numeric difference must survive an alias attempt ----------
for (const { a, ga, b, gb } of GAP_CONTRACT) {
  for (const [name, tok] of [[a, ga], [b, gb]]) {
    let found = false;
    for (const f of files) {
      const css = uncomment(readFileSync(join(CSS, f), "utf8"));
      const rule = new RegExp(`\\.${name.replace(/[-]/g, "\\-")}\\s*\\{([^}]*)\\}`).exec(css);
      if (rule && rule[1].includes(`var(${tok}`)) found = true;
    }
    if (!found) errors.push(`.${name} no longer gaps by ${tok} — update the contract here, and re-check whether the ${a}/${b} pair is now aliasable`);
  }
}

// ---- 3. a deprecated name must still be shipped until its major -------
for (const name of Object.keys(DEPRECATED)) {
  if (!declared.has(name)) errors.push(`${name} is in the deprecation ledger but no longer declared — remove the ledger entry (the removal belongs in CHANGELOG under ### Removed)`);
}

if (errors.length) {
  console.error("check-layout: FAIL");
  errors.forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log(
  `check-layout: OK — ${declared.size} layout primitive(s) across ${LEDGER.base.length} base / ` +
    `${LEDGER.components.length} component / ${LEDGER.utilities.length} utility, both gap contracts intact, ` +
    `${Object.keys(DEPRECATED).length} deprecated name(s) still shipped, each carrying its @deprecated marker.`,
);
