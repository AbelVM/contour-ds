/**
 * The registry export (C-46): `dist/registry/registry.json`, one item per surface
 * bundle, plus one file per item so a host can serve each item on its own.
 *
 * The design question was measured, not argued. `tools/audit/schema/` holds pinned
 * copies of the two live shadcn schemas, and `grammar.mjs`-style inspection of those
 * bytes found three things the research notes had wrong: `registryDependencies` IS a
 * `registry-item.json` field (the ai-readiness thread retracted it as item-links-only
 * and the live schema contradicts that), `url` is NOT a field at all, and `cssVars`
 * sits at item level rather than under `tailwind`. There is no `registry:css` type —
 * a CSS-only distribution rides on `registry:style` with `registry:file` entries.
 *
 * Two decisions follow from that measurement and from the project's own state:
 *
 *  - **Pointers, not copies.** `files[].content` is legal and would make the registry
 *    consumable offline from `node_modules`; it would also duplicate the four surface
 *    bundles (466,887 B measured on the current build) inside a `dist/` that already
 *    ships them. `files[].path` costs 463 B. The cost difference is not the reason —
 *    the reason is that duplicating a generated artifact into a second artifact is how
 *    this repository keeps arriving at two sources of one truth.
 *  - **No `homepage`, therefore no install claim.** `homepage` is required when this
 *    file is used as the *root* registry, and the project is private until v1.0 with a
 *    Pages deployment that answers 404. Emitting a homepage would advertise a door that
 *    does not open. The document is schema-valid without it (the root's only hard
 *    constraint is `anyOf: [items, include]`), and what it may claim is that it is a
 *    valid registry *shape*, never that `shadcn add` works today. `tools/check-registry.mjs`
 *    enforces the shape and the honesty rules; `tools/audit/registry-contract.mjs`
 *    asks ajv whether the bytes conform to the schemas.
 *
 * `registryDependencies` is deliberately empty. Each surface bundle is self-contained
 * — `build.mjs` composes it as CORE plus the audience sheet — so declaring that
 * `contour-docs` depends on `contour-core` would ask a host to install the shared layer
 * twice. That is a checkable claim, not a preference, so `check-registry.mjs` proves it
 * by reading the shipped CSS: every surface bundle must contain core's rules.
 */
import { readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { inventory } from "./inventory.mjs";

export const REGISTRY_SCHEMA_URL = "https://ui.shadcn.com/schema/registry.json";
export const ITEM_SCHEMA_URL = "https://ui.shadcn.com/schema/registry-item.json";
export const REGISTRY_VERSION = "1.0";

/** Item type for a CSS-only distribution. Measured from the live enum. */
const ITEM_TYPE = "registry:style";
const FILE_TYPE = "registry:file";

const kB = (n) => `${(n / 1024).toFixed(1)} kB`;

/**
 * The surfaces present in a built package, read from the build rather than
 * re-enumerated here. A second list of the same thing — sheet, surface, or count — is
 * the failure this repository has paid for repeatedly, so the directory `build.mjs`
 * wrote IS the input.
 */
export function registrySurfaces(dist) {
  const dir = join(dist, "surfaces");
  if (!existsSync(dir)) throw new Error(`no ${dir} — run \`node tools/build.mjs\` before the registry export`);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".min.css"))
    .map((f) => {
      const surface = f.replace(/^contour-/, "").replace(/\.min\.css$/, "");
      return { surface, file: `surfaces/${f}`, bytes: statSync(join(dir, f)).size };
    })
    .sort((a, b) => (a.surface === "core" ? -1 : b.surface === "core" ? 1 : a.surface.localeCompare(b.surface)));
}

/**
 * The shared payloads every item points at. These exist in `dist/` already; the
 * registry references them, it does not restate them.
 *
 * Each entry carries a `target` because the live schema demands one: `.files[]` has a
 * conditional — `if type is registry:file|registry:page then required [path, type,
 * target]` — which an earlier probe of mine reported as "no required fields" because it
 * walked `required` and never descended into `if`/`then`. The conformance gate found it
 * on its first run. Shared files converge on ONE target across every item on purpose:
 * two items writing the same contract file to the same place is idempotent, while two
 * items inventing two different places for it is a host with two copies to keep straight.
 */
const SHARED = [
  { path: "contour.tokens.json", target: "contour/contour.tokens.json", why: "the token layer as a DTCG 2025.10 Format document" },
  { path: "contour.themes.json", target: "contour/contour.themes.json", why: "the dark branch of every light-dark() pair, as a Resolver document" },
  { path: "contour.components.json", target: "contour/contour.components.json", why: "the component contract: blocks, elements, variants, states, properties" },
  { path: "docs/recipes.md", target: "contour/docs/recipes.md", why: "the guide's own composition prose" },
];

/**
 * Build the registry document and its per-item files.
 *
 * @param {string} dist an absolute path to the built `dist/` directory
 */
export function buildRegistry(dist) {
  const surfaces = registrySurfaces(dist);
  const inv = inventory();
  const present = SHARED.filter((s) => existsSync(join(dist, s.path)));
  const missingShared = SHARED.filter((s) => !existsSync(join(dist, s.path))).map((s) => s.path);
  if (missingShared.length) {
    // Silent omission would make every item point at a file the package does not have.
    throw new Error(`dist/ is missing ${missingShared.join(", ")} — the registry cannot point at nothing`);
  }

  const description = (s) =>
    `Contour ${s.surface} surface: ${kB(s.bytes)} of layered CSS, self-contained (the core layer is ` +
    `already inside it), ${inv.components.names.length} blocks and ${inv.tokens.unique} custom properties declared under src/.`;

  const items = surfaces.map((s) => ({
    $schema: ITEM_SCHEMA_URL,
    name: `contour-${s.surface}`,
    type: ITEM_TYPE,
    title: `Contour ${s.surface}`,
    description: description(s),
    // Empty, and provably so: the bundle carries the shared layer, so a host installing
    // two surfaces must not be told to install the base twice.
    registryDependencies: [],
    files: [
      { path: s.file, target: `contour/contour-${s.surface}.min.css`, type: FILE_TYPE },
      ...present.map((p) => ({ path: p.path, target: p.target, type: FILE_TYPE })),
    ],
    meta: {
      distribution: "pointer",
      selfContained: true,
      bundleBytes: s.bytes,
      shared: present.map((p) => ({ path: p.path, target: p.target, purpose: p.why })),
    },
  }));

  const index = {
    $schema: REGISTRY_SCHEMA_URL,
    name: "contour",
    description:
      "Contour — a token-driven design system for spatial interfaces. One item per surface bundle. " +
      "Every item points into this package's own dist/ tree by path: the shape is a valid shadcn registry, " +
      "and it is not installable until the project is public, because a pointer needs a host and this " +
      "deployment answers 404 while the repository is private.",
    items,
  };

  const files = {};
  for (const item of items) files[`registry/items/${item.name}.json`] = item;
  return { index, files, surfaces, shared: present, missingShared };
}

/** Stable serialisation, shared by the build and the gate so "fresh derivation" means one thing. */
export const registryJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
