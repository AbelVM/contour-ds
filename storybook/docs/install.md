# Install

Section `install` — marker `22`, position 23 of 27 in the guide.
Generated from `index.html`; prose quoted, counts from the inventory, no URL (the project is
private until v1.0). See `index.json` for the whole set and the shared statement.

## What the guide says

One entry point, no runtime. Install from npm for the bundled dist/ deliverables, or link src/css/ds.css straight off a disk.

Equivalent contour-* elements are catalogued in §23.

Optional progressive enhancement. Load contour-wc.js after ds.css to use contour-btn, contour-card, and 320+ other custom elements that generate their scaffolding from attributes. Light-DOM elements (contour-*) use the cascade directly; shadow-DOM elements (contour-shadow-*) ship slots and adopted stylesheets for encapsulation. Interactive blocks (tabs, combobox, tree, menu, segmented, dialog, tag, filter-pill, install, code, pagination) wire their own keyboard behaviour and dispatch contour:* CustomEvents (contour:select, contour:change, contour:remove, contour:copy, contour:page, contour:close, contour:theme-change), so they work standalone. Modifier attributes (variant, size, color) apply to both layers from one list, and attribute changes re-render without losing authored content.

Slotted content in the shadow root.

## Blocks documented here

6 block(s). Their facts live in `../contour.components.json`;
only the names are here, because the same figure in two files is how a document
starts disagreeing with itself.

- `.c-badge`
- `.c-btn`
- `.c-code`
- `.c-icon-badge`
- `.c-kbd`
- `.c-section-head`

---

Source `index.html` @ `eb38e4a5345472ef` · last committed 2026-11-12T21:56:32+01:00 · no URL: the project is private until v1.0.
