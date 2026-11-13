# Playground

Section `playground` — marker `20`, position 21 of 27 in the guide.
Generated from `index.html`; prose quoted, counts from the inventory, no URL (the project is
private until v1.0). See `index.json` for the whole set and the shared statement.

## What the guide says

Every decision in the system is a custom property. Change one and watch the component respond — this is the same mechanism a consumer would use to retheme. The playground writes into a .c-theme-scope, a subtree that re-derives the brand layer from its own knobs.

Equivalent contour-* elements are catalogued in §23.

The playground writes directly to the scoped container. Nothing here is a special case — it is the same custom-property contract the tokens expose.

An analytical dashboard is a workspace. Its grammar prioritises density, interpretation, cross-filtering, context preservation, comparison, rapid navigation, monitoring and freshness. The docked variant is .c-workspace-shell: header, sidebar, central stage, resize handle and inspector as one body grid. Below 64rem the body collapses to one column, the handle is removed and the inspector becomes a popover drawer opened by .c-workspace-shell__inspector-toggle. node tools/audit/workspace-shell.mjs measures both layouts.

The dashboard shell composes these 10 blocks into a spatial workspace:

Header, navigation, central stage, resize handle and docked inspector in one body grid. Below 64rem the body is one column, the handle is removed and the inspector becomes a drawer opened by its toggle.

Central stage

Dashboards use the compact density profile (--density-compact: 0.72) for maximum information density. Each component family consumes density independently.

Dashboard components synchronize through contour:* events. The host owns selection state; components emit intent and reflect host state.

## Subsections

- A component under test
- Web component counterpart
- Dashboard composition grammar
- Spatial workspace family
- Docked workspace shell
- Density & rhythm
- Cross-view interaction contract

## Blocks documented here

15 block(s). Their facts live in `../contour.components.json`;
only the names are here, because the same figure in two files is how a document
starts disagreeing with itself.

- `.c-badge`
- `.c-btn`
- `.c-card`
- `.c-chip`
- `.c-dot`
- `.c-field`
- `.c-icon-badge`
- `.c-kbd`
- `.c-panel`
- `.c-pill`
- `.c-range`
- `.c-resize-handle`
- `.c-section-head`
- `.c-theme-scope`
- `.c-workspace-shell`

---

Source `index.html` @ `eb38e4a5345472ef` · last committed 2026-11-13T09:07:47+01:00 · no URL: the project is private until v1.0.
