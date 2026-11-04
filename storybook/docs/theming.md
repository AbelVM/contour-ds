# Two themes, one cascade.

Section `theming` — marker `21`, position 22 of 27 in the guide.
Generated from `index.html`; prose quoted, counts from the inventory, no URL (the project is
private until v1.0). See `index.json` for the whole set and the shared statement.

## What the guide says

The color-scheme property on :root is the only switch. Every semantic token resolves through light-dark(), so the palette follows the OS by default — and CSS never depends on JavaScript to be readable.

Equivalent contour-* elements are catalogued in §23.

Deeper surfaces, one hairline, no shadows. Designed for long sessions in a dim room and for maps that need to glow against the page.

A paper-white chart with ink text. The same five families, re-stepped for contrast on light surfaces — not an inversion of the dark palette.

Stored in localStorage, applied before first paint.

Page-level morphing via the View Transitions API. Add data-view-transition with a --view-transition-name to morph elements across navigations. Falls back gracefully in browsers without support.

Morph a card between two states using the View Transitions API. The card's view-transition-name links the before and after states.

Compact state

Expanded state with more content and a wider layout.

A card and a dialog share one view-transition-name, so the card morphs into the dialog (and back) instead of cross-fading. The name is the only link between the two surfaces.

Compact surface that expands into a dialog.

Expanded surface reached by morphing the card.

A small preview surface morphs into its full detail surface. Both carry the same view-transition-name; the browser interpolates size, position and content between them.

Thumbnail

Full surface with the complete content and a wider layout.

## Subsections

- Default
- Daylight
- Scheme preference
- Accessibility contract
- Before
- After
- Card
- Preview
- Detail
- Web component counterpart

## Blocks documented here

10 block(s). Their facts live in `../contour.components.json`;
only the names are here, because the same figure in two files is how a document
starts disagreeing with itself.

- `.c-badge`
- `.c-btn`
- `.c-card`
- `.c-dialog`
- `.c-dot`
- `.c-icon-badge`
- `.c-kbd`
- `.c-panel`
- `.c-section-head`
- `.c-segmented`

---

Source `index.html` @ `10d181ea8e0eb659` · last committed 2026-11-04T18:12:14+01:00 · no URL: the project is private until v1.0.
