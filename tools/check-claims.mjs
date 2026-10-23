#!/usr/bin/env node
/**
 * The claims gate (C-06).
 *
 * The recurring failure in this repository is not a wrong fix — it is a
 * published sentence that no check owns. `README.md` claimed "every surface it
 * can be drawn on" while the guide, beside the chart, still said "against the
 * panel it is drawn on", and `--color-panel` is declared nowhere in `src/`. All
 * twelve gates were green while that was true, because a gate counts
 * declarations and a sentence is not a declaration.
 *
 * This gate makes sentences checkable. Three rules:
 *
 *   A NAME CLAIMED IS A NAME DECLARED — every `--token` cited in the prose must
 *     exist in `inventory()`. The prefix families that make a mention a *token*
 *     claim are derived from the declared names, never listed by hand: a
 *     hand-written list goes stale exactly like the number it guards, and it is
 *     also what made a first draft of this file flag `.c-btn--primary` (a BEM
 *     variant) and `--check` (a CLI flag) as undeclared tokens.
 *
 *   A RANGE PUBLISHED IS A RANGE COUNTED — `--chart-seq-1…7` must match the
 *     number of steps actually declared. The sequential specimen said "six
 *     stops" while the ramp it paints has seven.
 *
 *   EVERY CLAIM HAS AN OWNING CHECK — `tools/claims.json` maps a sentence to
 *     the command that enforces it. The gate fails a claim whose owner does not
 *     exist, or that is not wired into a CI lane, because a claim assigned to a
 *     gate nobody runs is still an unowned sentence.
 *
 * Self-discipline, learned the hard way in this repo: it prints how many claims
 * it matched, and a register that matches nothing is a failure, not a pass.
 *
 *   node tools/check-claims.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { inventory } from "./lib/inventory.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const read = (...p) => (existsSync(join(ROOT, ...p)) ? readFileSync(join(ROOT, ...p), "utf8") : null);

const errors = [];
const inv = inventory();
const declared = new Set(Object.keys(inv.tokens.census));

// Prose a reader acts on. CHANGELOG.md is excluded deliberately: it is a dated
// record of past states, so a name it cites may legitimately no longer exist —
// holding it to the current tree would force the history to be rewritten.
const DOCS = ["README.md", "DESIGN.md", "llms.txt", "index.html", "templates/landing.html"];

// ---- what makes a `--mention` a token claim ----------------------------
// Derived from the declared names: the two-segment prefix of every token is a
// family (`--color-`, `--chart-seq-`, `--dur-`). Anything not in a declared
// family is class grammar or a command flag, not a claim about the system.
const families = new Set();
for (const name of declared) {
  const parts = name.replace(/^--/, "").split("-");
  for (let i = 1; i < parts.length; i++) families.add("--" + parts.slice(0, i).join("-") + "-");
}

/** Wildcard and range spellings are families, not individual claims. */
const isEllipsis = (raw) => /[…]$/.test(raw) || /-\.\.\.$/.test(raw);

const claimedNames = [];
const rangeClaims = [];
for (const doc of DOCS) {
  const text = read(doc);
  if (text === null) {
    errors.push(`${doc}: listed as a claim-bearing document but it is missing`);
    continue;
  }
  for (const m of text.matchAll(/(--[a-z][a-z0-9-]*)/g)) {
    const raw = m[1];
    const fam = [...families].find((f) => raw.startsWith(f));
    if (!fam) continue; // BEM variant, CLI flag, or unrelated prose
    if (isEllipsis(raw) || raw === fam) continue; // `--chart-seq-…`
    // A family prefix that ends in `-` is a wildcard, e.g. `--basalt-` alone.
    if (raw.endsWith("-")) continue;
    // A range head is NOT a name claim: `--chart-seq-1…7` publishes a span, and
    // `--chart-seq-1` is not itself a token. Without this the range rule and the
    // name rule both fire on the same text, and the gate fails a document for
    // stating a range correctly.
    const isRangeHead = /^(--(?:color|chart|brand|fill|space|type|dur|ease|shadow|target|z)-[a-z0-9-]*?)(\d+)\s*(?:…|\.\.)\s*(\d+)/.test(
      text.slice(m.index).match(/^[^\s,;)]*/)[0],
    );
    if (isRangeHead) continue;
    if (!declared.has(raw)) claimedNames.push({ doc, raw });
  }
  // A range must live on ONE line: `--chart-seq-1…7`. Allowing `\s` here let a
  // trailing "and so on" ellipsis (`--basalt-900 …` at README:129) reach across
  // the newline and swallow the next item's list number, so the gate reported a
  // correctly written document as a drift.
  for (const m of text.matchAll(/(--[a-z][a-z0-9-]*?)(\d+)…(\d+)(?![\d-])/g)) {
    rangeClaims.push({ doc, prefix: m[1], from: Number(m[2]), to: Number(m[3]), raw: m[1] + m[2] + "…" + m[3] });
  }
}

// ---- rule A: a name claimed is a name declared -------------------------
const unknown = [...new Map(claimedNames.map((c) => [`${c.doc}|${c.raw}`, c])).values()];
for (const c of unknown) errors.push(`${c.doc}: cites ${c.raw}, which inventory() does not declare`);

// ---- rule B: a range published is a range counted ----------------------
const seenRanges = new Set();
let rangesChecked = 0;
for (const r of rangeClaims) {
  if (!r.prefix) continue;
  const key = `${r.doc}|${r.raw}`;
  if (seenRanges.has(key)) continue;
  seenRanges.add(key);
  rangesChecked++;
  const steps = [...declared].filter((n) => n.startsWith(r.prefix) && new RegExp(`^${r.prefix}\\d+$`).test(n));
  const count = steps.length;
  if (!count) {
    errors.push(`${r.doc}: publishes ${r.raw} but no token starts with ${r.prefix} — the family is undeclared`);
    continue;
  }
  const hi = Math.max(...steps.map((n) => Number(n.slice(r.prefix.length))));
  const lo = Math.min(...steps.map((n) => Number(n.slice(r.prefix.length))));
  if (hi !== r.to || lo !== r.from) {
    errors.push(
      `${r.doc}: publishes ${r.prefix}${lo}…${hi} as ${r.raw}; the declared range is ${lo}…${hi} (${count} steps)`,
    );
  }
}

// ---- rule C: every claim has an owning check that actually runs --------
const REGISTER_PATH = join(ROOT, "tools/claims.json");
if (!existsSync(REGISTER_PATH)) {
  errors.push("tools/claims.json is missing — no claim is owned, so no published sentence is enforced");
}
let ownedChecked = 0;
if (existsSync(REGISTER_PATH)) {
  const register = JSON.parse(readFileSync(REGISTER_PATH, "utf8"));
  const claims = register.claims || [];
  if (!claims.length) errors.push("tools/claims.json holds no claims — the register matched nothing");
  const ci = read(".github/workflows/ci.yml") || "";
  for (const claim of claims) {
    ownedChecked++;
    const missing = [];
    if (!claim.sentence) missing.push("sentence");
    if (!claim.doc) missing.push("doc");
    if (!claim.owner) missing.push("owner");
    if (missing.length) {
      errors.push(`claim ${claim.id ?? "?"}: missing ${missing.join(", ")}`);
      continue;
    }
    // The sentence must still be in the document it is registered against, or
    // the register is guarding a claim that has already been rewritten away.
    const text = read(claim.doc);
    if (text === null) errors.push(`claim ${claim.id}: document ${claim.doc} does not exist`);
    else if (!text.includes(claim.sentence)) {
      errors.push(
        `claim ${claim.id}: sentence is no longer in ${claim.doc} — either the claim was rewritten (update the register) or it was lost`,
      );
    }
    // The owner must be a real command in this repository…
    const script = claim.owner.replace(/^node\s+/, "").split(/\s+/)[0];
    if (!existsSync(join(ROOT, script))) errors.push(`claim ${claim.id}: owner ${claim.owner} is not a file in this repo`);
    // …and it must run in CI. A claim assigned to a gate nobody runs is unowned.
    else if (!ci.includes(script)) errors.push(`claim ${claim.id}: owner ${script} is not wired into .github/workflows/ci.yml`);
  }
}

// ---- rule E: a documented import list must equal the real one ----------
// README tells a bundler which sheets to import, in order. That list is a claim
// about src/css/ds.css, and it drifted the moment C-51 added a sheet: the list
// went stale, no gate noticed, and a consumer following the README would not get
// the light-dark() fallback at all. So the list is checked, and no count is
// written into the prose to rot a second time.
const dsCss = read("src/css/ds.css") || "";
const realImports = [...dsCss.matchAll(/@import\s+(?:url\()?"?\.\/([a-z0-9-]+\.css)"?\)?/g)].map((m) => m[1]);
// README carries TWO @import blocks: the canonical bundler list, and a three-line
// illustration under "tokens.css and base.css are not optional". Only the first
// states an order. A global regex over the file merges them into a 13-name list
// that exists nowhere and reports a false ordering failure — so the gate reads
// the fence the claim lives in, not the whole document.
const readme = read("README.md") || "";
const listFence = readme.match(/import them in this order[\s\S]*?```css\n([\s\S]*?)```/);
const documented = listFence
  ? [...listFence[1].matchAll(/@import\s+"src\/css\/([a-z0-9-]+\.css)"/g)].map((m) => m[1])
  : [];

if (!realImports.length) {
  errors.push("src/css/ds.css declares no @import — the list rule measured nothing");
} else if (!documented.length) {
  errors.push("README's bundler list was not found — the list rule measured nothing");
} else {
  const dupes = documented.filter((f, i) => documented.indexOf(f) !== i);
  const missing = realImports.filter((f) => !documented.includes(f));
  const extra = documented.filter((f) => !realImports.includes(f));
  if (dupes.length) errors.push(`README's bundler list names ${[...new Set(dupes)].join(", ")} twice`);
  if (missing.length)
    errors.push(`README's bundler list omits ${missing.join(", ")} — a consumer following it ships without them`);
  if (extra.length) errors.push(`README's bundler list names ${extra.join(", ")}, which ds.css does not import`);
  // Order is part of the claim: within one @layer the later sheet wins, which is
  // why the light-dark() fallback has to come last.
  if (!missing.length && !extra.length && !dupes.length && documented.join() !== realImports.join()) {
    errors.push("README's bundler list is out of order: within a layer the later sheet wins");
  }
}

// A stated length for that list is a number that rots the moment a sheet is
// added — which is precisely what happened: `ds.css` grew to ten imports while
// README and DESIGN.md still said "nine chained". The list above is the claim;
// no document may restate how long it is.
const COUNT_WORDS = "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dozen";
for (const doc of DOCS) {
  const text = read(doc) || "";
  for (const m of text.matchAll(new RegExp(`\\b(?:${COUNT_WORDS}|\\d+)\\s+(?:chained\\s+)?@import`, "gi"))) {
    const line = text.slice(0, m.index).split("\n").length;
    errors.push(`${doc}:${line} states how many @import statements there are — say which ones, or read them from ds.css`);
  }
}
const listChecked = realImports.length && documented.length ? realImports.length : 0;

if (!unknown.length && !rangesChecked && !ownedChecked && !listChecked) {
  console.error("check-claims: FAIL — matched no names, ranges, owned claims or import lists, so it proved nothing");
  process.exit(1);
}

if (errors.length) {
  console.error("check-claims: FAIL");
  [...new Set(errors)].forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log(
  `check-claims: OK — ${families.size} derived token families, ` +
    `${new Set(claimedNames.map((c) => c.raw)).size} cited name(s) all declared, ` +
    `${rangesChecked} published range(s) counted, ${ownedChecked} claim(s) owned by a CI-wired gate, ` +
    `README's ${documented.length}-sheet import list agrees with ds.css.`,
);
