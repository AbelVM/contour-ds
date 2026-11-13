# Field

Section `field` — marker `14`, position 15 of 27 in the guide.
Generated from `index.html`; prose quoted, counts from the inventory, no URL (the project is
private until v1.0). See `index.json` for the whole set and the shared statement.

## What the guide says

The cartographic half of the system, rendered. These are the parts a routing or survey surface is built from — a mark is not a target, a number carries its provenance, and a map slot themes an engine the system does not ship.

The same blocks as contour-* elements live in §23.

The consumer owns this canvas; the system themes the chrome around it.

Map-engine seam: Contour never imports a map library. Attach a live engine via el.attachMap(map) (or set el.map = map); read viewport bounds via el.getViewport(). Events (contour:map-control, contour:map-attach, contour:map-detach) are composed and bubble through shadow hosts. See templates/map.html for a working MapLibre example.

Hidden — the block is not rendered.

Shown — same markup, wider profile.

## Subsections

- Web component counterpart
- Web component counterpart

## Blocks documented here

30 block(s). Their facts live in `../contour.components.json`;
only the names are here, because the same figure in two files is how a document
starts disagreeing with itself.

- `.c-advanced`
- `.c-bivariate`
- `.c-btn`
- `.c-comparison`
- `.c-compass`
- `.c-drag-handle`
- `.c-flag`
- `.c-hexbin`
- `.c-icon-badge`
- `.c-instrument`
- `.c-kbd`
- `.c-layer-panel`
- `.c-layer-switch`
- `.c-legend`
- `.c-map-area`
- `.c-map-footer`
- `.c-map-panel`
- `.c-map-slot`
- `.c-measure`
- `.c-minimap`
- `.c-radio`
- `.c-radio-list`
- `.c-readout`
- `.c-scale-bar`
- `.c-section-head`
- `.c-segmented`
- `.c-survey`
- `.c-table`
- `.c-table-wrap`
- `.c-time-slider`

---

Source `index.html` @ `eb38e4a5345472ef` · last committed 2026-11-13T09:07:47+01:00 · no URL: the project is private until v1.0.
