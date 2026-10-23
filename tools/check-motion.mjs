#!/usr/bin/env node
/**
 * The motion contract (C-27).
 *
 * WCAG 2.2.2 is Level A: moving, blinking or auto-updating content that starts
 * on its own and lasts more than five seconds needs a mechanism to pause, stop
 * or hide it. `prefers-reduced-motion` is an operating-system setting, so it is
 * not that mechanism — a reader cannot use it for one thing on one page, and
 * most readers have never opened it.
 *
 * So this gate holds two things true at once, because either alone is the
 * failure this repository keeps measuring:
 *
 *   the MECHANISM exists in src/css    — a declaration no control drives paints
 *                                        nothing a reader can reach
 *   a CONTROL ships on a page          — a control whose attribute no rule
 *                                        reads is a button that does nothing
 *
 * The list of infinite animations comes from `tools/lib/inventory.mjs`, the same
 * parser the census and the stamp use. A gate that re-derives it with its own
 * regex publishes a second number for the same thing, and the two drift.
 *
 * Run: node tools/check-motion.mjs
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { inventory } from "./lib/inventory.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");

const errors = [];
const inv = inventory();
const infinite = inv.hygiene.infiniteAnimations;

// Finding nothing is not a pass. An animation renamed out of the parser's
// reach, or a refactor that moves motion into another file, would leave this
// gate green while the page still blinks at the reader.
if (!infinite.length) {
  console.error("check-motion: FAIL — inventory() reports no infinite animation, so the contract measured nothing");
  process.exit(1);
}

const cssSource = inv.cssBytes
  ? Object.keys(inv.cssBytes).map((f) => read("src/css", f)).join("\n")
  : "";

const hasPause = /\[data-motion=["']?paused["']?\][^{}]*\{[^{}]*animation-play-state:\s*paused/.test(cssSource);
const hasRunning = /\[data-motion=["']?running["']?\][^{}]*\{[^{}]*animation-play-state:\s*running/.test(cssSource);
// The infinite motion in this system lives on ::after — the live dot's pulse,
// the skeleton's sweep, a loading button's ring. A mechanism that selects only
// the element pauses nothing a reader can see.
const reachesPseudo = /\[data-motion=["']?paused["']?\][^{}]*::after/.test(cssSource);

if (!hasPause) errors.push('no `[data-motion="paused"]` rule setting animation-play-state in src/css');
if (!hasRunning) errors.push('no `[data-motion="running"]` rule setting animation-play-state in src/css');
if (!reachesPseudo) errors.push('[data-motion] does not reach ::before/::after, where the infinite motion actually lives');

// The producer on one side, the control on the other. `data-motion-scope` names
// the element the attribute is written to, so a page can pause one live region
// rather than the whole document.
const js = read("src/js/ds.js");
if (!/\[data-motion-toggle\]/.test(js)) errors.push("src/js/ds.js has no [data-motion-toggle] producer");

const pages = [
  ["index.html", read("index.html")],
  ["templates/dashboard.html", read("templates/dashboard.html")],
];
const withControl = pages.filter(([, html]) => /data-motion-toggle|data-freshness-control/.test(html)).map(([n]) => n);
if (!withControl.length) {
  errors.push("no shipped page carries a motion control — the mechanism exists but no reader can reach it");
}

// 2.2.2 speaks of content that lasts more than five seconds. An animation with
// no resolvable duration is a claim about the page that cannot be checked, so
// it fails rather than being skipped.
for (const a of infinite) {
  const dur = a.duration || "";
  const ms = dur.match(/^var\(--dur-([a-z-]+)\)$/);
  let seconds = null;
  if (ms) {
    const token = inv.tokens.census[`--dur-${ms[1]}`];
    if (!token) {
      errors.push(`${a.selector}: duration var(--dur-${ms[1]}) is not a declared token`);
      continue;
    }
    seconds = parseDuration(token.value);
  } else {
    seconds = parseDuration(dur);
  }
  if (seconds === null) {
    errors.push(`${a.selector} (${a.file}): infinite animation with no readable duration — cannot judge 2.2.2`);
    continue;
  }
  if (seconds > 5) {
    errors.push(`${a.selector} (${a.file}): one cycle is ${seconds}s; 2.2.2 covers content moving more than 5s`);
  }
}

function parseDuration(value) {
  const m = /^\s*([\d.]+)(ms|s)\s*$/.exec(value || "");
  if (!m) return null;
  return m[2] === "ms" ? Number(m[1]) / 1000 : Number(m[1]);
}

if (errors.length) {
  console.error("check-motion: FAIL");
  errors.forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log(
  `check-motion: OK — ${infinite.length} infinite animation(s) matched, all pausable by [data-motion]; ` +
    `control shipped on ${withControl.join(", ")}.`,
);
