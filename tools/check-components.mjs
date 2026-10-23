#!/usr/bin/env node
/**
 * The component-contract gate (C-44): does `dist/contour.components.json` say
 * only things that are true about src/css?
 *
 * The artifact used to be 134 bare class names, and it had a second problem
 * beyond being thin: `tools/build.mjs` derived that list with its own regex over
 * the bundled stylesheet, a third parser alongside the inventory's CSS walk and
 * the audit harness's scan. The three agreed by luck. So this gate reads the
 * shipped file and holds it against the inventory — one derivation, checked
 * against itself from the outside, which is the only way a generated artifact
 * can be caught being hand-edited, stale, or invented.
 *
 * Four kinds of assertion, each able to fail on its own:
 *
 *   1. Population. Every block the inventory knows is present exactly once, and
 *      nothing else is. A run that matched no blocks is a failure, not a pass —
 *      this file prints what it checked because a gate that measured nothing has
 *      already been wrong in this repository twice.
 *   2. The property partition. `tokens`, `vars` and `inputs` must be exactly the
 *      raw read list, and each name must sit in the bucket its provenance puts it
 *      in. A flat list would call `--c` (read with a fallback, defined nowhere)
 *      the same kind of thing as `--color-focus-ring`; the reverse index must
 *      contain no host input, or the contract advertises a global lever that
 *      does not exist.
 *   3. Names that resolve. Every element and variant must fold back to the block
 *      that lists it, every sheet must be a real file, and every state must
 *      appear in the CSS. `:hover` invented by a bad merge would otherwise ship.
 *   4. Reach. `renderedIn` must equal what the inventory observed, so the
 *      contract cannot keep claiming a template renders a block after the
 *      template stops using it. That is C-12's rule, pointed at the artifact.
 *
 *   node tools/check-components.mjs
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { inventory, blockOf } from "./lib/inventory.mjs";
import { CONTRACT_VERSION, buildComponentsDocument } from "./lib/components.mjs";

// ".." like every sibling gate: this file sits in tools/, so "." resolves to
// tools/ and the gate reports a shipped artifact as missing while `build` exits
// 0. A message that blames the build for a path bug is the reason to read what a
// failing exit actually came from before believing it.
const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const ARTIFACT = join(ROOT, "dist/contour.components.json");

function main() {
  if (!existsSync(ARTIFACT)) {
    console.error("check-components: dist/contour.components.json is missing — run `node tools/build.mjs`.");
    return 1;
  }

  const doc = JSON.parse(readFileSync(ARTIFACT, "utf8"));
  const inv = inventory();
  const raw = inv.components;
  const census = new Set(Object.keys(inv.tokens.census));
  const sheets = new Set(readdirSync(join(ROOT, "src/css")).filter((f) => f.endsWith(".css")));
  // Comments stripped, exactly as the inventory strips them. Against the raw
  // text, a state that appears only inside a sentence of prose — "supports
  // :hover" — would satisfy the substring test, and the gate would certify an
  // invention. The two readers must see the same bytes.
  const cssText = [...sheets]
    .map((f) => readFileSync(join(ROOT, "src/css", f), "utf8"))
    .join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, " ");

  const failures = [];
  const fail = (m) => failures.push(m);

  // -- 1. The envelope and the population ------------------------------------
  if (doc.version !== CONTRACT_VERSION) fail(`version is ${JSON.stringify(doc.version)}, expected ${CONTRACT_VERSION}`);
  if (doc.source !== "src/css") fail(`source is ${JSON.stringify(doc.source)}, expected "src/css" — the contract describes the system, not the guide`);

  const listed = doc.blocks ?? [];
  if (!listed.length) {
    // Reported here rather than through report(): that helper's coverage check
    // divides by the block count, so handing it an empty contract would compare
    // NaN, fail to fire, and print "OK" for an artifact asserting nothing.
    console.error("check-components: the contract lists no blocks, so nothing below could be verified");
    return 1;
  }
  const listedNames = listed.map((b) => b.name);
  const setListed = new Set(listedNames);
  const setInventory = new Set(raw.names);
  if (setListed.size !== listedNames.length) {
    const dupes = listedNames.filter((n, i) => listedNames.indexOf(n) !== i);
    fail(`a block is listed twice: ${[...new Set(dupes)].join(", ")}`);
  }
  const missing = raw.names.filter((n) => !setListed.has(n));
  const invented = listedNames.filter((n) => !setInventory.has(n));
  if (missing.length) fail(`${missing.length} block(s) the inventory sees are absent from the contract: ${missing.slice(0, 8).join(", ")}`);
  if (invented.length) fail(`${invented.length} block(s) in the contract are not defined in src/css: ${invented.slice(0, 8).join(", ")}`);
  for (const [field, want] of [
    ["blocks", listed.length],
    ["elements", listed.reduce((a, b) => a + b.elements.length, 0)],
    ["variants", listed.reduce((a, b) => a + b.variants.length, 0)],
    ["states", listed.reduce((a, b) => a + b.states.length, 0)],
    ["tokens", listed.reduce((a, b) => a + b.tokens.length, 0)],
    ["vars", listed.reduce((a, b) => a + b.vars.length, 0)],
    ["inputs", listed.reduce((a, b) => a + b.inputs.length, 0)],
    ["tokensIndexed", Object.keys(doc.tokensIndex ?? {}).length],
  ]) {
    const stated = doc.counts?.[field];
    if (stated !== want) fail(`counts.${field} states ${stated} and the arrays hold ${want}`);
  }

  // -- 2. The partition of what each block reads ------------------------------
  let partitioned = 0;
  for (const b of listed) {
    const read = raw.rules[b.name]?.tokens ?? [];
    const buckets = [...b.tokens, ...b.vars, ...b.inputs].sort();
    const joined = JSON.stringify(buckets) === JSON.stringify([...read].sort());
    if (!joined) {
      const lost = read.filter((t) => !buckets.includes(t));
      const gained = buckets.filter((t) => !read.includes(t));
      fail(
        `${b.name}: the three buckets are not the raw read list (lost ${lost.slice(0, 4).join(",") || "-"}; gained ${gained.slice(0, 4).join(",") || "-"})`,
      );
    } else partitioned++;
    for (const t of b.tokens) if (!census.has(t)) fail(`${b.name} lists ${t} as a token, but it is not declared in tokens.css`);
    for (const t of b.vars) {
      if (census.has(t)) fail(`${b.name} lists ${t} as a component var when it is a token`);
      if (!inv.props[t]) fail(`${b.name} lists ${t} as a var, but nothing in src/css defines it`);
    }
    for (const t of b.inputs) {
      if (census.has(t)) fail(`${b.name} calls ${t} a host input when the token layer declares it`);
      if (inv.props[t]) fail(`${b.name} calls ${t} a host input, but src/css defines it in ${inv.props[t].join(",")}`);
    }
  }

  // -- 3. Names that must resolve ---------------------------------------------
  let resolved = 0;
  for (const b of listed) {
    for (const [field, classes] of [
      ["elements", b.elements],
      ["variants", b.variants],
    ]) {
      for (const cls of classes) {
        if (blockOf(cls) !== b.name) fail(`${b.name} lists .${cls} under ${field}; it folds to .${blockOf(cls)}`);
        // A plain substring test, not a constructed RegExp: the class name is
        // already CSS-safe, and the escaped-dot pattern I first wrote here
        // matched the same text `includes` matches, for more code and a regex
        // whose `$`-heavy source invites shell quoting bugs in anyone piping it.
        if (!cssText.includes(`.${cls}`)) {
          fail(`.${cls} is listed as a ${field.slice(0, -1)} of ${b.name} but appears in no src/css selector`);
        }
      }
    }
    for (const s of b.states) if (!cssText.includes(s)) fail(`${b.name} claims state ${s}, which no src/css selector contains`);
    for (const f of b.sheets) if (!sheets.has(f)) fail(`${b.name} names sheet ${f}, which is not a file in src/css`);
    if (!(raw.rules[b.name]?.rules > 0)) fail(`${b.name} is published with ${raw.rules[b.name]?.rules} rules — a block with no rule is not a block`);
    resolved++;
  }

  // -- 4. The reverse index, in both directions --------------------------------
  const rebuilt = new Map();
  for (const b of listed) for (const t of b.tokens) (rebuilt.get(t) ?? rebuilt.set(t, []).get(t)).push(b.name);
  for (const [t, owners] of rebuilt) {
    const stated = doc.tokensIndex?.[t];
    if (!stated) fail(`${t} is read by ${owners[0]} but is missing from tokensIndex`);
    else if (JSON.stringify([...new Set(owners)].sort()) !== JSON.stringify(stated)) {
      fail(`tokensIndex["${t}"] is [${stated}] and the blocks say [${[...new Set(owners)].sort()}]`);
    }
  }
  for (const t of Object.keys(doc.tokensIndex ?? {})) {
    if (!rebuilt.has(t)) fail(`tokensIndex holds ${t}, which no block lists in its tokens`);
    if (t && !census.has(t)) fail(`tokensIndex holds ${t}, which is not a declared token — a host input cannot be re-pointed globally`);
  }

  // -- 5. Reach the inventory actually observed -------------------------------
  let reach = 0;
  for (const b of listed) {
    const seen = raw.specimens[b.name] ?? {};
    const surfaces = Object.entries(seen.surfaces ?? {})
      .filter(([, hit]) => hit)
      .map(([f]) => f)
      .sort();
    if (Boolean(b.renderedIn?.guide) !== Boolean(seen.guide)) fail(`${b.name} says guide=${b.renderedIn?.guide}; the inventory observed ${Boolean(seen.guide)}`);
    if (JSON.stringify([...(b.renderedIn?.templates ?? [])].sort()) !== JSON.stringify(surfaces)) {
      fail(`${b.name} says templates [${b.renderedIn?.templates ?? ""}]; the inventory observed [${surfaces}]`);
    }
    reach++;
  }

  // -- 6. The shipped bytes are what src/css produces -------------------------
  if (JSON.stringify(buildComponentsDocument(inv)) !== JSON.stringify(doc)) {
    fail("dist/contour.components.json is not what src/css produces — it is generated; run `node tools/build.mjs`");
  }

  return report(failures, partitioned, resolved, reach, listed.length);
}

function report(failures, partitioned, resolved, reach, blocks) {
  if (failures.length) {
    console.error(`check-components: ${failures.length} problem(s) with the component contract`);
    for (const f of failures) console.error("  " + f);
    console.error("\nFix tools/lib/inventory.mjs, tools/lib/components.mjs or tools/build.mjs — the contract is generated, never hand-edited.");
    return 1;
  }
  const c = partitioned + resolved + reach;
  if (c < blocks * 3) {
    console.error(`check-components: only ${c} assertions over ${blocks} blocks — the sweep did not cover the contract`);
    return 1;
  }
  console.log(
    `check-components: ${blocks} blocks asserted present and unique; ${partitioned} property partitions closed against the raw read list; ` +
      `${resolved} blocks' elements, variants, states and sheets resolve in src/css; ${reach} reach records match the inventory. OK`,
  );
  return 0;
}

process.exit(main());
