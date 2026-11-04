# Map engine integration.

Section `mapengine` — marker `25`, position 26 of 27 in the guide.
Generated from `index.html`; prose quoted, counts from the inventory, no URL (the project is
private until v1.0). See `index.json` for the whole set and the shared statement.

## What the guide says

Contour ships the interface and deliberately stays out of the map engine's turf. It never imports MapLibre, Mapbox or Leaflet, never renders GeoJSON, and never projects coordinates. The engine owns the canvas; Contour owns the chrome around it.

The seam is duck-typed and event-driven: a consumer attaches a live engine instance to a Contour component, reads viewport bounds back through a neutral accessor, and forwards Contour's bubbling events to the engine's own API. No engine symbol leaks into the system, and a page can drop the engine without touching Contour.

The consumer owns this canvas; the system themes the chrome around it.

Map-engine seam: Contour never imports a map library. Attach a live engine via el.attachMap(map) (or set el.map = map); read viewport bounds via el.getViewport(). Events (contour:map-control, contour:map-attach, contour:map-detach) are composed and bubble through shadow hosts. See templates/map.html for a working MapLibre example.

## Subsections

- Map popup
- Web component counterpart

## Blocks documented here

5 block(s). Their facts live in `../contour.components.json`;
only the names are here, because the same figure in two files is how a document
starts disagreeing with itself.

- `.c-btn`
- `.c-icon-badge`
- `.c-map-area`
- `.c-map-popup`
- `.c-section-head`

---

Source `index.html` @ `10d181ea8e0eb659` · last committed 2026-11-04T18:12:14+01:00 · no URL: the project is private until v1.0.
