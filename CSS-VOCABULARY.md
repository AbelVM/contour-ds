# CSS vocabulary classification — Contour

Machine-readable distinction between the kinds of class the system ships.
`dist/contour.components.json` is the authority for blocks/elements/variants/states;
this document classifies the *role* of a class.

## Kinds

| Kind | Prefix / shape | Example | Public API? |
|---|---|---|---|
| Block | `.c-<block>` | `.c-card` | yes |
| Element | `.c-<block>__<element>` | `.c-card__title` | yes (via ::part) |
| Variant | `.c-<block>--<variant>` | `.c-card--raised` | yes |
| State hook | `.is-*` / `[data-*]` / `:state()` | `.is-loading`, `:state(data-invalid)` | yes |
| Modifier (global) | `variant`/`size`/`color` attrs | `variant="primary"` | yes (closed vocab per block) |
| Composition primitive | unprefixed layout | `.container`, `.section`, `.stack` | yes |
| Guide-only | `ds-` | `.ds-panel`, `.ds-rail` | no (never shipped in src/) |
| Deprecated | `@deprecated` marker | (listed in check-layout ledger) | shipped, removal pending |

## Rules

- A class resolving in CSS is not automatically a good public API. Public
  modifiers must be closed per block (R12 gap: global `variant`/`size`/`color`
  can imply support a block does not implement).
- State hooks (loading/error/empty/skeleton) should be standardized across all
  data components, including announcement and retry semantics.
- Guide-only classes (`ds-`) never appear in `src/`.
- Deprecated items ship for at least one minor release with a console warning,
  then are removed in the next major (see AGENTS.md deprecation policy).

## Inventory

- Blocks: 214 (dist/contour.components.json)
- Composition primitives: 24 (check-layout.mjs)
- Guide-only classes: 1 (chart-paper is guide-only; ridgeline removed)
- Deprecated: 3 (check-layout.mjs ledger)
