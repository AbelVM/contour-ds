/**
 * The component contract (C-44): `dist/contour.components.json`.
 *
 * What it is for. The file used to be 134 bare class-name strings in 2,386
 * bytes — enough to answer "does this class exist" and nothing else. A consumer
 * or an agent could not ask the two questions that actually decide whether to
 * reuse a block: what does it look like in the markup (`c-btn--primary`,
 * `:hover`, `[aria-disabled="true"]`), and what moves if I retune a token?
 * Every field here answers one of those, from data the repository already
 * computes.
 *
 * Why it is built here rather than in the build script. `tools/build.mjs` used to
 * derive the block list with its own regex over the bundled stylesheet, which was
 * a third parser beside `tools/lib/inventory.mjs`'s CSS walk and the audit
 * harness's own scan. Three derivations of one list is how a published count and
 * a shipped artifact drift apart while every one of them looks self-consistent —
 * the 151-of-273 export bug in a different costume. So this module takes an
 * `inventory()` result and nothing else, and BOTH the build and the gate call
 * it: the gate cannot pass an artifact that the build did not produce from the
 * same source, and the build cannot emit a field the gate has not seen.
 *
 * What it deliberately does NOT contain: a guide section id per block. The
 * specimens' location in `index.html` would need a second read of the guide's
 * markup, and `renderedIn` below already says what a consumer needs — whether
 * the block is exercised anywhere, and on which shipped surface.
 */

/** The contract's own version, not the package's. */
export const CONTRACT_VERSION = "2.0";

/**
 * Sort a block's read properties into the three kinds they actually are.
 *
 * One flat `tokens` list is a lie of the comfortable kind: it tells a consumer
 * that `--c` and `--color-focus-ring` are the same sort of thing and both can be
 * re-pointed from `:root`. They cannot. `--color-focus-ring` is in the token
 * layer; `--btn-bg` has a default the system ships on the block; `--c` is read by
 * `.c-chart` with a fallback (`var(--c, var(--chart-1))`) and defined nowhere in
 * the system at all, so only the host that draws the mark can set it. That last
 * category was found by the check the repository's own measurement rule prescribes
 * — prove a property is declared before treating it as a token — and the phantom
 * census it yields is published here rather than quietly folded into `tokens`.
 *
 * @param {string[]} read custom property names the block reads
 * @param {Set<string>} census declared in the token layer
 * @param {Record<string, string[]>} props every property defined in src/css
 */
function bucket(read, census, props) {
  const tokens = [];
  const vars = [];
  const inputs = [];
  for (const name of read) {
    if (census.has(name)) tokens.push(name);
    else if (props[name]) vars.push(name);
    else inputs.push(name);
  }
  return { tokens, vars, inputs };
}

/**
 * @param {ReturnType<import('./inventory.mjs').inventory>} inv
 * @returns {Record<string, unknown>}
 */
export function buildComponentsDocument(inv) {
  const names = inv.components.names;
  const detail = inv.components.rules;
  const census = new Set(Object.keys(inv.tokens.census));

  const blocks = names.map((name) => {
    const d = detail[name];
    const where = inv.components.specimens[name] || { guide: false, templates: false, surfaces: {} };
    const { tokens, vars, inputs } = bucket(d.tokens, census, inv.props);
    return {
      name,
      sheets: d.files,
      rules: d.rules,
      elements: d.elements,
      variants: d.variants,
      states: d.states,
      // The system's own vocabulary: retune it in tokens.css and this moves.
      tokens,
      // A property the system defines a default for, on the block itself.
      vars,
      // Set by the host. The system reads it and never defines it.
      inputs,
      renderedIn: {
        guide: Boolean(where.guide),
        templates: Object.entries(where.surfaces || {})
          .filter(([, hit]) => hit)
          .map(([file]) => file),
      },
    };
  });

  // The reverse index covers `tokens` only — the vocabulary a consumer can
  // actually re-point. Indexing `--c` would advertise a global lever that does
  // not exist. Derived from the lists above and never recomputed, so the two
  // directions cannot disagree; tools/check-components.mjs asserts that in both
  // directions.
  const byToken = new Map();
  for (const b of blocks) {
    for (const t of b.tokens) {
      const owners = byToken.get(t);
      if (owners) owners.push(b.name);
      else byToken.set(t, [b.name]);
    }
  }
  const tokensIndex = Object.fromEntries(
    [...byToken.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([t, list]) => [t, [...new Set(list)].sort()]),
  );

  const total = (field) => blocks.reduce((a, b) => a + b[field].length, 0);

  // No `$schema` here. There is no published schema for this file, and a URL
  // that resolves to nothing in a machine-facing artifact is worse than no URL:
  // it reads like a promise that something checks the shape.
  return {
    version: CONTRACT_VERSION,
    source: "src/css",
    generatedBy: "tools/build.mjs, from tools/lib/inventory.mjs",
    statement:
      "Generated, never hand-edited. Every block, element, variant, state and token below is read from src/css by the same inventory that publishes every count in this repository, and tools/check-components.mjs fails if the shipped bytes are not that derivation. `tokens` lists the custom properties a block's rules read; a rule naming two blocks (`.c-alert, .c-callout`) is credited to both, because that is what a retune does.",
    counts: {
      blocks: blocks.length,
      elements: total("elements"),
      variants: total("variants"),
      states: total("states"),
      // The three buckets are a partition of every property a block reads. There
      // is deliberately no `read` total here: a number summed from the three
      // buckets could only ever agree with itself. The partition is checked
      // against something independent instead -- tools/check-components.mjs
      // compares each block's three buckets against the raw read list in the
      // inventory, which is a fact the sort could plausibly get wrong.
      tokens: total("tokens"),
      vars: total("vars"),
      inputs: total("inputs"),
      tokensIndexed: Object.keys(tokensIndex).length,
    },
    blocks,
    tokensIndex,
  };
}
