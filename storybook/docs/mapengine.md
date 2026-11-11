# Map engine integration.

Section `mapengine` — marker `25`, position 26 of 27 in the guide.
Generated from `index.html`; prose quoted, counts from the inventory, no URL (the project is
private until v1.0). See `index.json` for the whole set and the shared statement.

## What the guide says

Contour ships the interface and deliberately stays out of the map engine's turf. It never imports MapLibre, Mapbox or Leaflet, never renders GeoJSON, and never projects coordinates. The engine owns the canvas; Contour owns the chrome around it.

The seam is duck-typed and event-driven: a consumer attaches a live engine instance to a Contour component, reads viewport bounds back through a neutral accessor, and forwards Contour's bubbling events to the engine's own API. No engine symbol leaks into the system, and a page can drop the engine without touching Contour.

The consumer owns this canvas; the system themes the chrome around it.

Map-engine seam: Contour never imports a map library. Attach a live engine via el.attachMap(map) (or set el.map = map); read viewport bounds via el.getViewport(). Events (contour:map-control, contour:map-attach, contour:map-detach) are composed and bubble through shadow hosts. See templates/map.html for a working MapLibre example.

Contract (R16-25): data components announce filter changes via contour:filter-change (bubbling, composed) with { source, filter } detail. A global contour:clear-all resets every filterable component to its default state. Contour owns the event contract; libreship owns the state store and re-applies filters by setting attributes.

Contract (R16-26): a table row carries its identity in data-row (JSON row data) and emits contour:zoom with { row, index, data } on click. A map consumer listens for contour:zoom and zooms to the corresponding feature. Contour stays engine-agnostic: it announces the row and data, never touches the map canvas.

Contract (R16-27): time-series components expose playback state (current-time, is-playing, speeds) and emit contour:step-change / contour:step-activate on navigation. libreship drives playback by setting attributes; Contour announces state changes.

Contract (R16-28): the layer panel owns layer visibility, order, and styling; the map adapter (Contour's contour-map-area) owns the engine bridge. The panel never touches the engine directly — it sets attributes on contour-map-area, which forwards to the live engine instance via attachMap().

Contract (R16-29): every chart and map component offers an opt-in accessible data table via data-table. The graphic remains the primary presentation (role="img"); the visually-hidden table carries the same data for screen readers and no-JS consumers.

Contract (R16-30): a resizable split pane between map and data panels uses contour-resizable on the divider. It emits contour:resize with the new split ratio so both panels can reflow. Consumers wire the resize to their map's resize() and their table's virtual scroll.

Recipes (R16-32): import only the family you need. Each per-family bundle includes the shared core plus that family's components.

## Subsections

- Map popup
- Web component counterpart

## Blocks documented here

8 block(s). Their facts live in `../contour.components.json`;
only the names are here, because the same figure in two files is how a document
starts disagreeing with itself.

- `.c-btn`
- `.c-icon-badge`
- `.c-map-area`
- `.c-map-popup`
- `.c-section-head`
- `.c-split-pane`
- `.c-table`
- `.c-table-wrap`

---

Source `index.html` @ `0d7cf97ba136a27a` · last committed 2026-11-11T17:17:27+01:00 · no URL: the project is private until v1.0.
