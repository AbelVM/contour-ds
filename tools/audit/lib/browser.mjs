/**
 * Find a browser driver — discovered, never assumed.
 *
 * The audit harnesses used to import playwright from an absolute path into a
 * *different* project's package store — a pinned version directory under that
 * project's own node_modules, quoted here deliberately not in full so a future
 * repo-wide guard for that pattern does not match this explanation of it.
 *
 * That is a guess about where someone else keeps their dependencies. It breaks
 * on a clean clone, on another machine, and in CI, and it breaks by throwing an
 * import error that looks like a missing feature rather than a missing path.
 *
 * So resolution is ordered from "this project declared it" down to "the
 * operator said where it is", and if nothing matches the harness says so and
 * exits — it does not quietly skip. A gate that skips is a gate that passed.
 *
 * Order:
 *   1. CONTOUR_PLAYWRIGHT — an explicit path (module entry, package dir, or a
 *      directory that contains it). The escape hatch for a non-standard store.
 *   2. `playwright`, then `playwright-core`, resolved normally from this
 *      project — i.e. `npm i -D playwright` in `tools/audit/` is enough.
 *   3. A search of the sibling checkouts' package stores for a
 *      `playwright-core` entry point, discovered by reading directories rather
 *      than by naming one.
 */

import { createRequire } from "node:module";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const require_ = createRequire(import.meta.url);

/** Candidate package roots to search in step 3, discovered not declared. */
function siblingStoreRoots() {
  // The repo root is two levels up from this file: tools/audit/lib → repo.
  const repo = new URL("../../..", import.meta.url).pathname.replace(/\/$/, "");
  const parents = [dirname(repo), repo];
  const found = [];
  for (const dir of parents) {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const e of entries) {
      const p = join(dir, e, "node_modules");
      if (statSyncSafely(p)?.isDirectory()) found.push(p);
      const pnpm = join(p, ".pnpm");
      if (statSyncSafely(pnpm)?.isDirectory()) found.push(pnpm);
    }
  }
  return found;
}

function statSyncSafely(p) {
  try {
    return statSync(p);
  } catch {
    return null;
  }
}

/** Every path a playwright-core entry point is plausibly reachable from. */
function candidatesFromEnv() {
  const raw = process.env.CONTOUR_PLAYWRIGHT;
  if (!raw) return [];
  const p = resolve(raw);
  if (statSyncSafely(p)?.isFile()) return [p];
  if (statSyncSafely(p)?.isDirectory()) {
    return [
      join(p, "index.mjs"),
      join(p, "index.js"),
      join(p, "playwright-core", "index.mjs"),
      // pnpm lays the real package one level deeper, hash in the directory name.
      ...globPlaywrightCore(p),
    ];
  }
  return [p];
}

/** Under a pnpm store, each package lives in a versioned directory whose name
 *  embeds the package spec; look for the nested playwright-core entry point. */
function globPlaywrightCore(store) {
  let entries;
  try {
    entries = readdirSync(store);
  } catch {
    return [];
  }
  return entries
    .filter((e) => /^playwright-core@/.test(e))
    .map((e) => join(store, e, "node_modules", "playwright-core", "index.mjs"))
    .filter((p) => statSyncSafely(p)?.isFile());
}

async function firstResolution() {
  for (const path of candidatesFromEnv()) {
    if (statSyncSafely(path)?.isFile()) return { source: "CONTOUR_PLAYWRIGHT", path };
  }

  for (const name of ["playwright", "playwright-core"]) {
    try {
      const mod = await import(name);
      if (mod?.chromium) return { source: `import("${name}")`, path: name };
    } catch {
      /* not installed here; keep looking */
    }
    try {
      const path = require_.resolve(`${name}/index.mjs`);
      const mod = await import(path);
      if (mod?.chromium) return { source: `require.resolve("${name}")`, path };
    } catch {
      /* keep looking */
    }
  }

  for (const store of siblingStoreRoots()) {
    for (const path of globPlaywrightCore(store)) {
      const mod = await import(path).catch(() => null);
      if (mod?.chromium) return { source: "sibling store (discovered)", path };
    }
    for (const name of ["playwright-core", "playwright"]) {
      const direct = join(store, name, "index.mjs");
      if (!statSyncSafely(direct)?.isFile()) continue;
      const mod = await import(direct).catch(() => null);
      if (mod?.chromium) return { source: "sibling store (discovered)", path: direct };
    }
  }

  return null;
}

const found = await firstResolution();

if (!found) {
  console.error(
    [
      "audit: no browser driver found — the contrast, ARIA and document-hygiene gates cannot run.",
      "",
      "  cd tools/audit && npm i -D playwright && npx playwright install chromium",
      "",
      "or point the harness at an existing install:",
      "",
      "  CONTOUR_PLAYWRIGHT=/path/to/playwright-core node tools/audit/contrast-and-aria.mjs",
      "",
      "This is a failure, not a skip: a gate that silently does not run is a",
      "gate that silently passes.",
    ].join("\n"),
  );
  process.exit(1);
}

// `found.path` is either a bare package name or an absolute entry path; both
// are valid specifiers for `import()`.
const { chromium } = await import(found.path);

export { chromium, found };
