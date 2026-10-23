#!/usr/bin/env node
/**
 * Token census gate (T-77).
 *
 * Fails the build on a custom property declared in src/css/tokens.css that
 * nothing reads. A token nothing reads is not a token, it is a wish.
 *
 * WHY THIS FILE WAS REWRITTEN
 *
 * The previous version exempted whole families by regex:
 *
 *   /^--(basalt|tidal|lumen|plasma|sol|clay|brand|color-heat|chart)-[0-9]+$/
 *   /^--(space-|z-|container-|shadow-|dur-|ease-|border-width)/
 *
 * Measured against the current tree, every unread token fell inside those two
 * patterns, so the gate printed "all tokens are referenced" while a fifth of
 * the layer had no reader at all. A probe showed the mechanism was sound — a
 * dead token *outside* those families was caught — so the gate was not broken,
 * it was aimed at the wrong thing: the exempted families are exactly the ones
 * the review counted as dead.
 *
 * The replacement is a ledger, not a pattern. Every exemption names one token,
 * one action and one task. The ledger can only shrink: a newly dead token fails
 * the build, and a ledger entry whose token has found a consumer must be
 * deleted.
 *
 *   node tools/check-tokens.mjs            gate
 *   node tools/check-tokens.mjs --report   print the census
 *   node tools/check-tokens.mjs --json     machine-readable
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const CSS = join(ROOT, "src/css");

/**
 * Unread tokens that are deliberately kept, each with the work that removes it.
 * One line, one token — never a family.
 *
 * `verified` marks the entries whose consumer (or absence of one) was checked
 * in the source during this change; the rest carry a reviewer's judgement and
 * should be re-checked before the token is deleted.
 */
// Sixteen of the eighteen entries that opened this session are gone: the
// basalt steps are rendered by the guide's neutral ramp, --border-width-thick
// is used by the eight real 2px borders, and the remaining nine had no consumer
// anywhere — including `assets/`, which was checked before deleting so nothing
// in the guide's own chrome would break. This list is what is genuinely left.
const LEDGER = {
  // Added with the composable-surface work and not yet referenced by an exit
  // transition. Not deleted on purpose: this is another hand's in-flight edit.
  "--ease-exit": { action: "yours", task: "T-44", verified: true, note: "awaiting its exit-transition consumer" },
  // A heat ramp is a legitimate vocabulary — density, hazard, continuous
  // surfaces — and it is not the same thing as a sequential ramp. It lost its
  // only consumer when the legend ramp was pointed at --chart-seq-* (the
  // ramp that actually orders): --gradient-heat's lightness is 71, 78, 78,
  // 70.4, 77, 62.36, non-monotonic by design, so it must never feed a ramp
  // that implies order. Kept rather than deleted so a heat-scale surface still
  // has a token to reach for. Consumer: the heat-scale specimen, T-161.
  "--gradient-heat": { action: "yours", task: "T-161", verified: true, note: "heat ramp, non-ordered — needs a specimen, not a ramp" },
};

// Referenced-but-undefined tokens that are deliberate author hooks (component-scoped
// custom properties with fallbacks). These are not declared in tokens.css on
// purpose; they are documented hooks, not dead tokens.
const HOOK_LEDGER = new Set([
  "--bleed-left", "--bleed-right",
  "--bv-cell", "--bv-cols", "--bv-rows",
  "--c", "--fill", "--h", "--w", "--x", "--value", "--progress", "--target",
  "--graticule-pitch", "--field-line",
  "--btn-border", "--btn-bg", "--btn-fg", "--btn-shadow",
  "--map-ctrl-gap", "--map-ctrl-size", "--map-ctrl-surface", "--map-ctrl-border", "--map-ctrl-radius", "--map-ctrl-icon",
  "--meter-size", "--meter-value",
  "--kbd-padding", "--kbd-font-size",
  "--flow-space",
  "--dot-color",
]);

const escapeRe = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

/** Comments are prose: a token named in one is not read by one. */
const withoutComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:"'\\])\/\/[^\n]*/g, "$1");

function readIf(path) {
  return existsSync(path) ? withoutComments(readFileSync(path, "utf8")) : "";
}

function haystack() {
  const css = readdirSync(CSS)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(join(CSS, f), "utf8"))
    .join("\n");
  const templates = readdirSync(join(ROOT, "templates"))
    .filter((f) => f.endsWith(".html"))
    .map((f) => readFileSync(join(ROOT, "templates", f), "utf8"))
    .join("\n");
  // `assets/` is deliberately NOT searched. It is the guide's own shell, and
  // the ownership rule is that a token a consumer cannot reach from `src/` is
  // not in use, however much the guide leans on it. Measured on the current
  // tree the exclusion costs nothing — zero tokens are read only by `assets/` —
  // but leaving it in is where future dead weight would hide.
  return [
    withoutComments(css),
    readIf(join(ROOT, "index.html")),
    withoutComments(templates),
    readIf(join(ROOT, "src/js/ds.js")),
  ].join("\n");
}

function census() {
  const tokensSource = withoutComments(readFileSync(join(CSS, "tokens.css"), "utf8"));
  const names = [...new Set([...tokensSource.matchAll(/(--[a-z0-9][a-z0-9-]*)\s*:/g)].map((m) => m[1]))];
  const text = haystack();
  const unread = names.filter((name) => !new RegExp(`var\\(\\s*${escapeRe(name)}\\s*[,)]`).test(text));
  return { names, unread };
}

function main() {
  const { names, unread } = census();
  const ledgerKeys = Object.keys(LEDGER);

  // An entry whose token now has a consumer is paid-off debt: delete the line,
  // or the ledger keeps an exemption nobody needs.
  const staleEntries = ledgerKeys.filter((k) => !unread.includes(k));
  const unledgered = unread.filter((k) => !ledgerKeys.includes(k));

  // Two-way: referenced-but-undefined must be in the hook ledger.
  const cssText = readdirSync(CSS).filter((f) => f.endsWith(".css")).map((f) => readFileSync(join(CSS, f), "utf8")).join("\n");
  const jsText = readIf(join(ROOT, "src/js/ds.js"));
  const htmlText = readIf(join(ROOT, "index.html"));
  const allSrc = cssText + "\n" + jsText + "\n" + htmlText;
  const referenced = new Set([...allSrc.matchAll(/var\(\s*(--[a-z0-9][a-z0-9-]*)/g)].map((m) => m[1]));
  const declaredSet = new Set(names);
  const orphanRefs = [...referenced].filter((t) => !declaredSet.has(t) && !HOOK_LEDGER.has(t));
  const widening = unledgered.length > 0 || staleEntries.length > 0 || orphanRefs.length > 0;

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ declaredUnique: names.length, unread: unread.length, ledger: ledgerKeys.length, unledgered, staleEntries, widening }, null, 2));
  } else if (process.argv.includes("--report")) {
    console.log(`census: ${names.length} declared, ${unread.length} unread, ${ledgerKeys.length} ledger entries`);
    for (const t of unread) {
      const e = LEDGER[t];
      console.log(`  ${t.padEnd(22)} ${e ? `${e.action}  ${e.task}${e.verified ? "" : "  (unverified)"}  ${e.note}` : "*** NOT IN THE LEDGER ***"}`);
    }
  }

  if (widening) {
    console.error(`check-tokens: ${unledgered.length + staleEntries.length + orphanRefs.length} ledger discrepancy(ies).`);
    for (const t of unledgered) console.error(`  dead token with no reader and no ledger entry: ${t}`);
    for (const t of staleEntries) console.error(`  ledger entry is paid off — delete the line: ${t}`);
    for (const t of orphanRefs) console.error(`  referenced-but-undefined token not in hook ledger: ${t}`);
    console.error("\nWire the token to a consumer, ledger it with a task, or remove it.");
    process.exit(1);
  }

  if (!process.argv.includes("--json")) {
    console.log(`check-tokens: ${names.length} declared; ${unread.length} unread, every one accounted for in the ledger. OK`);
  }
  process.exit(0);
}

main();
