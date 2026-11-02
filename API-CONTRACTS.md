# Per-family API contract template — Contour (R12-05)

Each interactive family documents a compact API table with these columns:

## Template

| Field | Description |
|---|---|
| Attributes | HTML attributes read (must be in OBSERVED) |
| Reflected properties | JS properties that write attributes (properties map) |
| Slots | Named slots (light DOM or shadow) |
| Events | `contour:*` events emitted (must be in CONTOUR_EVENTS) |
| Keyboard | Key bindings and focus model |
| States | loading / error / empty / skeleton / disabled / invalid |
| CSS parts | `::part()` names (generated from `c-<block>__<element>`) |
| Custom properties | Host-set inputs (`inputs` in contour.components.json) |
| Controlled vs uncontrolled | Which state is author-controlled vs internal |

## Families requiring contracts (priority)

1. Table / data-grid / tree-grid / pivot / comparison
2. Chart family (chart, streaming-chart, sparkline, time-series, stacked-bar, category, donut, gauge, bivariate, heatmap, contour-plot, hexbin, flow-map, isochrone, catchment)
3. Form family (field, input, textarea, select, number-field, range, date/time/color pickers, combobox, switch, check, radio, segmented, stepper, rating, tags-input, file-upload)
4. Overlay family (dialog, drawer, sheet, toast, tooltip, hover-card, popover, dropdown, context-menu, side-sheet, fab, split-button)
5. Drag/resize/reorder (resizable, draggable, drag-handle, drop-zone, sortable-list)
6. Map chrome (map-slot, map-panel, layer-switch, layer-panel, style-switcher, time-slider, animation-controls, compass, coordinate, annotation, minimap, map-popup)
7. Navigation (tabs, tree, menu, command, pagination, filter-bar, docs-nav, sidebar, toc)
8. Dashboard (dash-shell, dash-toolbar, dash-kpi-row, dash-freshness, kpi, delta, stat, metrics, instrument, readout, widget-state, brownout)

## Status

Template defined. Per-family tables are not yet written; this is the open
work for R12-05.
