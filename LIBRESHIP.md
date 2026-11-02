# Contour ↔ Libreship compatibility

## Ownership boundary

- **Contour owns:** tokens, typography, surfaces, focus/target rules, generic
  controls/forms/tables/overlays/layout, chart grammar, optional WC wrappers.
- **Libreship owns:** MapLibre/Mapbox lifecycle, layers, viewport/projection,
  workers, spatial algorithms, domain data, product-specific map widgets.
- **Contour stops at map chrome:** slots, legends, controls, data presentation.
  No map engine, projection, tile lifecycle, worker protocol, or spatial
  analysis belongs in Contour (R12-19 rejected).

## Bridge: tokens and CSS

- Cascade layers: `tokens, base, components, utilities`. Libreship should layer
  its own styles above `components` or in a separate layer, never inside Contour's.
- Theme scope: `.c-theme-scope` re-derives the brand layer; Libreship can scope
  themes per subtree.
- Token aliases: Contour publishes `contour.tokens.json` (Format) and
  `contour.themes.json` (Resolver) as DTCG 2025.10. Libreship should consume
  these rather than redefining tokens.
- Map chrome CSS: `dist/map-chrome.mapbox.css` / `map-chrome.maplibre.css`.

## Bridge: events

- All Contour events are `contour:*`, bubbling and composed, with payloads
  listed in `CONTOUR_EVENTS` (src/js/wc/core.mjs) and §23.
- Libreship should namespace its own events (`libreship:*`) and translate
  Contour selection events into its domain model at the boundary.

## Bridge: data and selection

- Shared grammar: table/map selection identity, composed event convention,
  time-series playback contract, stale-data states.
- Contour provides generic table/filter/overlay/form primitives; Libreship
  provides spatial data and projections.
- Spatial visualizations (hexbin, flow-map, isochrone, catchment, contour-plot)
  accept host-owned geometry and render accessible table/summary/legend fallbacks.

## Selective adoption

- Libreship should not import the entire WC catalogue by default. Consume
  Contour CSS/tokens and adopt WCs where the interaction contract is genuinely
  shared.
- Per-family entry points: `contour-ds/wc/<family>.mjs`.

## Highest-value shared work (priority order)

1. Shared field/filter/query state contract.
2. Table/map selection identity and composed event convention.
3. Time-series playback contract and stale-data states.
4. Layer-panel ownership and map adapter examples.
5. Spatial data accessible fallback (table/summary/legend for every geometry).
6. Resizable map/data split pane with keyboard and narrow-screen path.
