# Per-family API contract template — Contour (R12-05)

> **Status: proposal, not a contract.** The tables below describe the intended
> shape of each family's API. They are not derived from the shipped inventory:
> some events and attributes named here (`contour:validity`, `contour:filter`,
> `contour:expand`, `contour:focus`, `contour:blur`, `contour:row-action`,
> `readonly`, `pattern`) are **not** implemented. `tools/check-api-contracts.mjs`
> compares the `contour:*` event names in this file against `CONTOUR_EVENTS` and
> fails when a row names an event the bundle does not emit, so the proposal
> cannot drift into a false claim. Treat a row here as intent; the shipped
> contract is `dist/contour.components.json` and the event manifest.

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

## Table family (c-table, c-data-grid, c-tree-grid, c-pivot, c-comparison)

| Field | Contract |
|---|---|
| Attributes | `src`, `columns`, `rows`, `loading`, `error`, `retry`, `empty`, `skeleton`, `selectable`, `sortable`, `filterable`, `virtual`, `sticky`, `compact`, `striped`, `bordered` |
| Reflected properties | `src`, `columns`, `rows`, `selectable`, `sortable`, `filterable`, `virtual`, `sticky`, `compact`, `striped`, `bordered` |
| Slots | default (caption), `toolbar`, `footer`, `empty` |
| Events | `contour:select`, `contour:sort`, `contour:filter`, `contour:page`, `contour:retry` |
| Keyboard | Arrow keys (roving), Space/Enter select, Home/End, PageUp/PageDown, Ctrl+A select all, sort via header Enter |
| States | loading, error, empty, skeleton, selected, sorted, filtered |
| CSS parts | `table`, `thead`, `tbody`, `tr`, `th`, `td`, `caption`, `toolbar`, `footer` |
| Custom properties (inputs) | `--table-row-height`, `--table-sticky-offset` |
| Controlled vs uncontrolled | selection/sort/filter can be controlled via attributes or internal |

## Form family (c-field, c-input, c-textarea, c-select, c-number-field, c-range, c-combobox, c-switch, c-check, c-radio, c-segmented, c-stepper, c-rating, c-tags-input, c-file-upload, c-date-picker, c-time-picker, c-color-picker, c-date-range, c-range-scale)

| Field | Contract |
|---|---|
| Attributes | `name`, `value`, `checked`, `disabled`, `required`, `readonly`, `placeholder`, `min`, `max`, `step`, `pattern`, `autocomplete`, `autofocus`, `size`, `variant`, `invalid`, `loading` |
| Reflected properties | `value`, `checked`, `disabled`, `required`, `readonly`, `placeholder`, `min`, `max`, `step`, `pattern`, `autocomplete`, `size`, `variant`, `invalid` |
| Slots | default (label/help), `prefix`, `suffix`, `error` |
| Events | `contour:input`, `contour:change` |
| Keyboard | Tab/Shift+Tab, Enter submit, Space toggle, arrows for range/stepper/rating, Escape clear (combobox/tags) |
| States | disabled, invalid, loading, required, readonly, checked, indeterminate |
| CSS parts | `control`, `label`, `help`, `error`, `prefix`, `suffix` |
| Custom properties (inputs) | `--field-gap`, `--control-height` |
| Controlled vs uncontrolled | value/checked controlled via attribute; internal state for uncontrolled |

## Chart family (c-chart, c-streaming-chart, c-sparkline, c-time-series, c-stacked-bar, c-category, c-donut, c-gauge, c-bivariate, c-heatmap, c-contour-plot, c-hexbin, c-flow-map, c-isochrone, c-catchment)

| Field | Contract |
|---|---|
| Attributes | `series`, `axis`, `empty`, `loading`, `error`, `retry`, `skeleton`, `zoomable`, `data-table`, `legend`, `title` |
| Reflected properties | `series`, `axis`, `zoomable`, `legend`, `title` |
| Slots | default (caption), `legend`, `tooltip` |
| Events | `contour:select`, `contour:hover`, `contour:zoom`, `contour:legend-toggle`, `contour:retry` |
| Keyboard | Tab to marks, arrows between points, Enter/Space select, Escape clear tooltip |
| States | loading, error, empty, skeleton, selected, hovered |
| CSS parts | `plot`, `axis`, `legend`, `tooltip`, `point`, `line`, `bar` |
| Custom properties (inputs) | `--chart-1`..`--chart-8`, `--chart-tip-*` |
| Controlled vs uncontrolled | selection/zoom controlled via attributes or internal |

## Overlay family (c-dialog, c-drawer, c-sheet, c-toast, c-tooltip, c-hover-card, c-popover, c-dropdown, c-context-menu, c-side-sheet, c-fab, c-split-button)

| Field | Contract |
|---|---|
| Attributes | `open`, `modal`, `placement`, `trigger`, `dismissible`, `size`, `variant` |
| Reflected properties | `open`, `modal`, `placement`, `dismissible`, `size`, `variant` |
| Slots | default (body), `title`, `foot`, `trigger` |
| Events | `contour:open`, `contour:close`, `contour:show`, `contour:hide`, `contour:toggle` |
| Keyboard | Escape close, Tab trap (modal), Enter/Space trigger, arrows (menu) |
| States | open, closed, loading, disabled |
| CSS parts | `dialog`, `head`, `body`, `foot`, `close`, `trigger`, `content` |
| Custom properties (inputs) | `--overlay-z`, `--overlay-backdrop` |
| Controlled vs uncontrolled | open controlled via attribute or internal |

## Navigation family (c-tabs, c-tree, c-menu, c-command, c-pagination, c-filter-bar, c-docs-nav, c-sidebar, c-toc, c-breadcrumb, c-stepper-nav)

| Field | Contract |
|---|---|
| Attributes | `items`, `value`, `selected`, `expanded`, `collapsed`, `orientation`, `size`, `variant` |
| Reflected properties | `value`, `selected`, `expanded`, `collapsed`, `orientation`, `size`, `variant` |
| Slots | default (items), `prefix`, `suffix` |
| Events | `contour:select`, `contour:change`, `contour:collapse`, `contour:page` |
| Keyboard | Arrow keys (roving), Home/End, Enter/Space select, typeahead |
| States | selected, expanded, collapsed, disabled, loading |
| CSS parts | `list`, `item`, `trigger`, `panel`, `indicator` |
| Custom properties (inputs) | `--nav-gap`, `--nav-indicator` |
| Controlled vs uncontrolled | value/selected/expanded controlled via attribute or internal |
