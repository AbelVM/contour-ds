/**
 * API compatibility check (CDS-032): compares the current component contract
 * against a committed baseline and reports breaking changes.
 *
 * Breaking changes (gate fails):
 *   - Removed attribute, boolean attribute, slot, part, token, variant, state,
 *     element, or sheet from a block
 *   - Maturity downgrade (e.g. complete-widget -> primitive)
 *   - Block removed entirely
 *
 * Non-breaking changes (reported, not failed):
 *   - Added attribute, boolean attribute, slot, part, token, variant, state,
 *     element, or sheet
 *   - Maturity upgrade
 *   - Block added
 *
 * The baseline lives at tools/lib/contour.components.baseline.json and is
 * regenerated intentionally by the maintainer when a breaking change is
 * approved. The current contract is derived from src/css by the same
 * inventory that builds dist/contour.components.json, so the two always
 * share one derivation.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { inventory } from "./inventory.mjs";
import { CONTRACT_VERSION, buildComponentsDocument } from "./components.mjs";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const BASELINE = join(ROOT, "tools/lib/contour.components.baseline.json");

/** Diff two sorted string arrays: removed and added. */
function diffArrays(before, after) {
  const b = new Set(before);
  const a = new Set(after);
  const removed = [...b].filter((x) => !a.has(x)).sort();
  const added = [...a].filter((x) => !b.has(x)).sort();
  return { removed, added };
}

/** Diff a single block's contract fields. Returns { breaking, info }. */
function diffBlock(before, after) {
  const breaking = [];
  const info = [];

  const fields = [
    "attributes",
    "booleanAttributes",
    "slots",
    "parts",
    "tokens",
    "variants",
    "states",
    "elements",
    "sheets",
  ];
  for (const field of fields) {
    const { removed, added } = diffArrays(before[field] ?? [], after[field] ?? []);
    if (removed.length) breaking.push(`  removed ${field}: ${removed.join(", ")}`);
    if (added.length) info.push(`  added ${field}: ${added.join(", ")}`);
  }

  if (before.maturity !== after.maturity) {
    const order = { primitive: 0, composition: 1, scaffold: 2, "complete-widget": 3 };
    const downgrade =
      (order[before.maturity] ?? 9) > (order[after.maturity] ?? 9);
    if (downgrade) breaking.push(`  maturity downgraded: ${before.maturity} -> ${after.maturity}`);
    else info.push(`  maturity upgraded: ${before.maturity} -> ${after.maturity}`);
  }

  return { breaking, info };
}

/** Compare baseline vs current contract. Returns { breaking, info, blocksCompared }. */
function compareContracts(baseline, current) {
  const breaking = [];
  const info = [];
  let blocksCompared = 0;

  const beforeByName = new Map(baseline.blocks.map((b) => [b.name, b]));
  const afterByName = new Map(current.blocks.map((b) => [b.name, b]));

  // Blocks removed entirely.
  for (const name of [...beforeByName.keys()].sort()) {
    if (!afterByName.has(name)) {
      breaking.push(`block removed: ${name}`);
      continue;
    }
  }

  // Blocks added entirely.
  for (const name of [...afterByName.keys()].sort()) {
    if (!beforeByName.has(name)) {
      info.push(`block added: ${name}`);
      continue;
    }
  }

  // Blocks present in both: field-level diff.
  for (const name of [...beforeByName.keys()].sort()) {
    if (!afterByName.has(name)) continue;
    blocksCompared++;
    const { breaking: b, info: i } = diffBlock(beforeByName.get(name), afterByName.get(name));
    if (b.length) {
      breaking.push(`block ${name}:`);
      breaking.push(...b);
    }
    if (i.length) {
      info.push(`block ${name}:`);
      info.push(...i);
    }
  }

  return { breaking, info, blocksCompared };
}

export function checkApiCompat() {
  if (!existsSync(BASELINE)) {
    console.error(
      "check-api-compat: baseline missing at tools/lib/contour.components.baseline.json — " +
        "generate it from the current contract with `node tools/gen-api-baseline.mjs`.",
    );
    return 1;
  }

  const baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
  const inv = inventory();
  const current = buildComponentsDocument(inv);

  const { breaking, info, blocksCompared } = compareContracts(baseline, current);

  if (breaking.length) {
    console.error(`check-api-compat: ${breaking.length} breaking change(s) across ${blocksCompared} block(s) compared`);
    for (const b of breaking) console.error("  " + b);
    console.error(
      "\nTo approve these changes, regenerate the baseline: node tools/gen-api-baseline.mjs",
    );
    return 1;
  }

  let infoCount = 0;
  for (const i of info) if (i.startsWith("block ")) infoCount++;
  console.log(
    `check-api-compat: ${blocksCompared} block(s) compared against baseline; ` +
      `0 breaking change(s); ${infoCount} non-breaking change(s) reported. OK`,
  );
  for (const i of info) console.log("  " + i);
  return 0;
}
