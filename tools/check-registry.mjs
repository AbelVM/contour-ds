#!/usr/bin/env node
/**
 * The registry's structural guard (C-46). Dependency-free, so it runs in the
 * validate lane.
 *
 *     node tools/check-registry.mjs
 *
 * It reads `dist/registry/` — the bytes a host would serve — and asks the questions
 * a pointer-only registry can get wrong without any other gate noticing:
 *
 *  1. POPULATION, both directions. Every bundle in `dist/surfaces/` has an item, and
 *     every item has a bundle. A fifth surface added to the build would otherwise
 *     ship unannounced, and an item whose bundle vanished would point at nothing.
 *     An empty registry is an error here, not a pass: a loop over nothing is green.
 *  2. RESOLUTION. Every `files[].path` exists inside `dist/`, is relative, and never
 *     escapes the package with `..` or an absolute path. A pointer is a promise about
 *     a location; this is the only thing that checks it.
 *  3. THE POINTER SHAPE ITSELF. No `content` key anywhere. Inlining the four bundles
 *     would add 466,887 bytes of CSS beside the files it already ships — a silent
 *     doubling of `dist/` that a size budget alone would absorb by being raised.
 *  4. THE HONESTY RULES. No `homepage` and no `url`: the project is private until
 *     v1.0 and its Pages deployment answers 404, so the artifact may carry schema
 *     identifiers and nothing that reads as a place to fetch. The only URLs allowed
 *     are the two `$schema` values, and they are named exactly.
 *  5. OWN NUMBERS. Each item's description publishes a block count and a token count;
 *     those must equal what `tools/lib/inventory.mjs` reports TODAY, and `meta
 *     .bundleBytes` must equal the real file size. A generated document that keeps an
 *     old number is the failure this repository has been bitten by repeatedly.
 *  6. SELF-CONTAINMENT, PROVEN. `registryDependencies` is empty, and the claim behind
 *     it — each surface bundle already carries the core layer — is checked against the
 *     shipped CSS, not asserted. If a future build stopped including core, the empty
 *     dependency list would be a lie and this is what says so.
 *  7. NO DRIFT between `registry.json` and `registry/items/*.json`.
 *
 * Conformance to the schema is NOT claimed here — that is
 * `tools/audit/registry-contract.mjs`, which asks ajv. This file owns structure.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, posix } from "node:path";
import { inventory } from "./lib/inventory.mjs";
import { REGISTRY_SCHEMA_URL, ITEM_SCHEMA_URL, buildRegistry, registryJson } from "./lib/registry.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const DIST = join(ROOT, "dist");
const REG = join(DIST, "registry");
const errors = [];
const ALLOWED_URLS = new Set([REGISTRY_SCHEMA_URL, ITEM_SCHEMA_URL]);

for (const need of ["registry/registry.json"]) {
  if (!existsSync(join(DIST, need))) errors.push(`missing dist/${need} — run \`node tools/build.mjs\``);
}
if (!existsSync(REG)) {
  console.error(`check-registry: dist/registry is missing — run \`node tools/build.mjs\``);
  process.exit(1);
}
if (errors.length) {
  for (const e of errors) console.error("check-registry: " + e);
  process.exit(1);
}

const indexRaw = readFileSync(join(REG, "registry.json"), "utf8");
const index = JSON.parse(indexRaw);
const items = Array.isArray(index.items) ? index.items : [];
const itemFiles = readdirSync(join(REG, "items")).filter((f) => f.endsWith(".json")).sort();

// -- 1. population, both directions -------------------------------------------
if (!items.length) errors.push("dist/registry/registry.json holds no items: a registry of nothing passes every loop below by running zero times");
if (!itemFiles.length) errors.push("dist/registry/items/ holds no files");

const bundles = readdirSync(join(DIST, "surfaces")).filter((f) => f.endsWith(".min.css")).map((f) => f.replace(/^contour-/, "").replace(/\.min\.css$/, "")).sort();
const itemSurfaces = items.map((i) => String(i.name).replace(/^contour-/, "")).sort();
for (const s of bundles) if (!itemSurfaces.includes(s)) errors.push(`dist/surfaces/contour-${s}.min.css exists but no registry item names the ${s} surface`);
for (const s of itemSurfaces) if (!bundles.includes(s)) errors.push(`registry item contour-${s} names a surface with no bundle in dist/surfaces`);
if (new Set(itemSurfaces).size !== itemSurfaces.length) errors.push("two registry items name the same surface");

// -- 2 + 3 + 4, per item, and on the whole document ---------------------------
let pointers = 0;
for (const it of items) {
  const where = `item ${it.name}`;
  if (!Array.isArray(it.files) || !it.files.length) errors.push(`${where} has no files`);
  if ("content" in it) errors.push(`${where} carries inline content — the pointer shape was chosen deliberately`);
  for (const file of it.files ?? []) {
    pointers += 1;
    if (typeof file.path !== "string" || !file.path) { errors.push(`${where} has a file entry with no path`); continue; }
    if ("content" in file) errors.push(`${where}: ${file.path} carries inline content, duplicating a file that already ships in dist/`);
    if (file.path.startsWith("/") || file.path.includes("..")) errors.push(`${where}: path "${file.path}" escapes the package (absolute or "..")`);
    if (file.path.includes("://")) errors.push(`${where}: path "${file.path}" is a URL, not a path inside dist/`);
    const resolved = join(DIST, posix.normalize(file.path));
    if (!existsSync(resolved)) errors.push(`${where}: ${file.path} does not exist in the built package`);
  }
  // 5. its own published numbers
  const inv = inventory();
  const desc = String(it.description ?? "");
  const nums = [...desc.matchAll(/(\d+) blocks and (\d+) custom properties/g)];
  if (nums.length !== 1) errors.push(`${where}: description must state block and token counts exactly once, found ${nums.length}`);
  else if (Number(nums[0][1]) !== inv.components.count || Number(nums[0][2]) !== inv.tokens.unique) {
    errors.push(`${where}: description says ${nums[0][1]} blocks / ${nums[0][2]} properties; the inventory reports ${inv.components.count} / ${inv.tokens.unique}`);
  }
  const own = (it.files ?? []).find((f) => String(f.path).startsWith("surfaces/"));
  // Guarded on existence, not on faith in the artifact. `own.path` is a claim the
  // document makes, and rule 2 above already records it when the claim is false;
  // statSync-ing it anyway threw ENOENT out of the middle of the sweep, which lost the
  // message AND skipped every rule after this one. A gate that crashes has not checked
  // anything — it has only stopped.
  const ownPath = own ? join(DIST, posix.normalize(own.path)) : null;
  if (own && ownPath && existsSync(ownPath) && it.meta?.bundleBytes !== statSync(ownPath).size) {
    errors.push(`${where}: meta.bundleBytes ${it.meta?.bundleBytes} != the real size of ${own.path} (${statSync(ownPath).size})`);
  }
  // 6. the dependency claim
  if (!Array.isArray(it.registryDependencies) || it.registryDependencies.length) {
    errors.push(`${where}: registryDependencies is ${JSON.stringify(it.registryDependencies)} — the bundles are self-contained, so a dependency would install the shared layer twice`);
  }
}

// 4 on the document as a whole.
if ("homepage" in index) errors.push("registry.json carries a homepage: the deployment answers 404 while the project is private until v1.0");
if ("url" in index) errors.push("registry.json carries a url field, which the live registry schema does not define at all");
const urls = [...indexRaw.matchAll(/https?:\/\/[^\s"'"]+/g)].map((m) => m[0]);
for (const u of new Set(urls)) if (!ALLOWED_URLS.has(u)) errors.push(`registry.json contains a URL nothing authorises: ${u}`);

// -- 6. self-containment proven against the shipped CSS -----------------------
// At the level the claim is actually made. A first version of this test asked whether
// the core bundle's BYTES appear inside each surface bundle; it returned false for all
// three and looked like a refutation of `selfContained`. It was not: minifying
// `core + sheet` as one document does not preserve the minification of `core` as a
// substring — `@layer` wrappers and whitespace differ. The claim is about RULES, so the
// test compares selector sets parsed out of the shipped CSS. Both numbers are printed,
// because "0 missing" only means something if the sweep had a population to compare.
const corePath = join(DIST, "surfaces", "contour-core.min.css");
const selectorsOf = (css) => {
  const out = new Set();
  for (const m of css.matchAll(/([^{}@;]+)\{/g)) {
    for (const s of m[1].split(",")) {
      const sel = s.trim();
      if (sel) out.add(sel);
    }
  }
  return out;
};
let coreSelectorCount = 0;
let surfaceSelectorHits = 0;
let surfacesChecked = 0;
if (!existsSync(corePath)) errors.push("dist/surfaces/contour-core.min.css is missing, so self-containment cannot be proven");
else {
  const coreSels = selectorsOf(readFileSync(corePath, "utf8"));
  coreSelectorCount = coreSels.size;
  if (!coreSels.size) errors.push("the core bundle yielded no selectors, so the containment sweep compared nothing");
  for (const s of bundles.filter((b) => b !== "core")) {
    if (!coreSels.size) break;
    const body = readFileSync(join(DIST, "surfaces", `contour-${s}.min.css`), "utf8");
    const surfSels = selectorsOf(body);
    surfacesChecked += 1;
    surfaceSelectorHits += surfSels.size;
    const missing = [...coreSels].filter((x) => !surfSels.has(x));
    if (!surfSels.size) errors.push(`contour-${s} yielded no selectors — the containment check cannot run`);
    if (missing.length) {
      errors.push(`contour-${s} is missing ${missing.length} of ${coreSels.size} core selectors (${missing.slice(0, 3).join(", ")}), yet its item declares no registryDependencies — one of the two is wrong`);
    }
  }
}

// -- 7. the per-item files agree with the index -------------------------------
for (const it of items) {
  const rel = `items/${it.name}.json`;
  if (!itemFiles.includes(`${it.name}.json`)) errors.push(`registry.json lists ${it.name} but dist/registry/${rel} is absent`);
  else {
    const solo = readFileSync(join(REG, rel), "utf8");
    if (solo !== `${JSON.stringify(it, null, 2)}\n`) errors.push(`dist/registry/${rel} differs from the same item inside registry.json`);
  }
}
for (const f of itemFiles) {
  if (!items.some((i) => `${i.name}.json` === f)) errors.push(`dist/registry/items/${f} is listed by no item in registry.json`);
}

// -- 8. the shipped bytes are a derivation of the built package ---------------
// Without this, a hand-edit that stays internally consistent passes: change an item's
// `title` in registry.json AND in its item file and every rule above still holds,
// because none of them asks what the emitter would produce today. Same reason
// check-docs and check-components re-derive — a guard that reads only the artifact's
// own consistency certifies the artifact's self-belief.
const fresh = buildRegistry(DIST);
const wantIndex = registryJson(fresh.index);
if (indexRaw !== wantIndex) errors.push("dist/registry/registry.json is not what the current dist/ produces — hand-edited, or dist/ is stale. Run: node tools/build.mjs");
let rederived = 1;
for (const [rel, body] of Object.entries(fresh.files)) {
  rederived += 1;
  const path = join(DIST, rel);
  if (!existsSync(path)) errors.push(`${rel} is produced by the emitter but is not on disk`);
  else if (readFileSync(path, "utf8") !== registryJson(body)) errors.push(`${rel} differs from a fresh derivation`);
}

const totalBytes = itemFiles.reduce((a, f) => a + statSync(join(REG, "items", f)).size, 0) + statSync(join(REG, "registry.json")).size;
if (errors.length) {
  console.error(`check-registry: ${errors.length} problem(s) in dist/registry/`);
  for (const e of errors.slice(0, 20)) console.error("  - " + e);
  if (errors.length > 20) console.error(`  ... and ${errors.length - 20} more`);
  process.exit(1);
}
console.log(
  `check-registry: ${items.length} items for the ${bundles.length} built surfaces (${bundles.join(", ")}); ` +
    `${pointers} pointers all resolve inside dist/ and none carries inline content; ` +
    `${new Set(urls).size} URL(s) present, both of them a $schema identifier, no homepage and no url field; ` +
    `every item's block/token counts match the inventory today and its byte count matches the file; ` +
    `${coreSelectorCount} core selectors appear inside each of the ${surfacesChecked} non-core bundles (${surfaceSelectorHits} surface selectors compared), which is why registryDependencies is empty; ` +
    `the ${itemFiles.length} per-item files equal the index byte for byte; ` +
    `${rederived} shipped files re-derived from the current dist/ and matched. ${totalBytes} bytes total. OK`,
);
