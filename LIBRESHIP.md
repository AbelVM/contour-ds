# Contour ↔ Libreship Integration Guide

This guide defines the integration contract between Contour (the design system) and Libreship (the spatial geospatial platform and routing engine).

---

## 1. Ownership boundary

| Concern | Owner | Details |
|---|---|---|
| **Design system** | Contour | Tokens, typography, surfaces, focus/target rules, generic controls/forms/tables/overlays/layout, chart grammar, WC wrappers. |
| **Map engine & lifecycle** | Libreship | MapLibre/Mapbox instance lifecycle, layers, viewport/projection, WebGL render pipelines, workers, spatial algorithms, domain data, product-specific map widgets. |
| **Map chrome** | Shared Seam | Contour provides HTML/CSS map chrome (toolbars, controls, coordinate readout, compass, scale bar, legend, panels). Libreship wires engine events via `attachMap()`. |

Contour stops at map chrome. No map engine, tile pipeline, projection math, or spatial analysis runtime belongs in Contour.

---

## 2. Recommended imports and bundles

Libreship should **not** import the all-in `contour-wc.esm.js` convenience bundle in production. Instead, consume per-family bundles and the data surface CSS:

### Stylesheets

```css
/* 1. Core + Data surface styles (tables, charts, KPIs, dashboard layouts) */
@import "contour-ds/surfaces/contour-data.min.css";

/* 2. MapLibre chrome reset and control theming */
@import "contour-ds/map-chrome/maplibre";
```

### Web Components (Per-Family)

Import only the families required for the active view:

```js
// Spatial dashboards, charts, tables, KPIs:
import "contour-ds/wc/data";

// Map chrome controls, scale bar, time slider, layer panel:
import "contour-ds/wc/map";

// Filter controls, range sliders, comboboxes, selects:
import "contour-ds/wc/forms";

// Split views, resizable containers, buttons:
import "contour-ds/wc/interaction";

// Dialogs, drawers, toasts, tooltips:
import "contour-ds/wc/feedback";
```

*(Note: extension mapping allows bare family imports like `contour-ds/wc/data` or explicit `.mjs` like `contour-ds/wc/data.mjs`).*

---

## 3. Component maturity and stability for Libreship

| Component | Status | Role in Libreship |
|---|---|---|
| `contour-table` / `c-table` | **Stable** | Spatial feature tables, sorting, column filtering, row selection, pagination. |
| `contour-chart` / `c-chart` | **Stable** | Time series, histograms, bivariate matrix, chart grammar with dash patterns. |
| `contour-kpi` | **Stable** | Metric summary cards with sparklines and delta indicators. |
| `contour-time-slider` | **Stable** | Temporal playback control with scrub, play/pause attributes, and speed cycle. |
| `contour-scale-bar` | **Stable** | Viewport-responsive scale bar. |
| `contour-coordinate` | **Stable** | Latitude/longitude/zoom readout. |
| `contour-compass` | **Stable** | Bearing indicator and North reset button. |
| `contour-split-view` | **Stable** | Resizable map vs. data table workspace splits. |
| `contour-combobox` / `contour-select` | **Stable** | Form-associated layer and filter selectors with multi-value support. |
| `contour-dialog` / `contour-drawer` | **Stable** | Native dialog modal containment with `showModal()`, `open`, `returnValue`. |
| `contour-layer-panel` | **Active** | Flat layer visibility and reorder panel; emits `contour:layer-*` events. |
| `contour-dash-shell` / `contour-dashboard-grid` | **Scaffold** | Visual scaffolds. Libreship should provide its own workspace docking/persistence engine if multi-window docking is needed. |
| `contour-hexbin` / `contour-flow-map` / `contour-isochrone` | **Composite** | Spatial presentation hosts that render accessible table/summary fallbacks. WebGL rendering stays in Libreship/Deck.gl. |

---

## 4. Bridge: tokens and CSS

- **Cascade Layers:** Contour declares `@layer tokens, base, components, utilities;`. Libreship styles should reside in product-specific layers or sit after `components`.
- **Token Aliasing:** Consumers migrating legacy `--ls-*` properties can alias them in `:root`:
  ```css
  :root {
    --ls-color-brand: var(--color-brand);
    --ls-color-bg: var(--color-canvas);
    --ls-color-surface: var(--color-surface-1);
    --ls-chart-1: var(--chart-cyc-1);
  }
  ```
- **Themes & Scoping:** Use `[data-theme="dark"]` / `[data-theme="light"]`. For sub-tree theming (e.g. dark map overlay inside light dashboard), wrap in `.c-theme-scope`.

---

## 5. Bridge: events and state

Contour components communicate upwards via standard, bubbling, composed `contour:*` events:

- `contour:filter-change` — Filter bar, combobox, or table filter committed. Detail: `{ source, filter, value }`.
- `contour:time-change` — Time slider scrubbed or playhead moved. Detail: `{ value, currentTime }`.
- `contour:layer-visibility` — Layer visibility toggled. Detail: `{ layerId, visible }`.
- `contour:layer-reorder` — Layer order changed. Detail: `{ fromIndex, toIndex, order }`.
- `contour:select` — Table row or mark selected. Detail: `{ id, item, selected }`.

Libreship listens for `contour:*` events on container roots and maps them into its state store (e.g. Zustand, Redux, or Signals). In reverse, Libreship drives Contour components by setting DOM attributes (`value`, `filter`, `is-playing`, `current-time`, `open`).

---

## 6. Map engine seam

`contour-map-area` acts as a composition host for map chrome:

```html
<contour-map-area id="main-map">
  <div id="maplibre-container"></div>
  <contour-compass slot="top-right"></contour-compass>
  <contour-time-slider slot="bottom"></contour-time-slider>
  <contour-scale-bar slot="bottom-left"></contour-scale-bar>
</contour-map-area>
```

The adapter seam:
```js
const mapArea = document.querySelector("#main-map");
mapArea.attachMap(maplibreMapInstance);
```
Contour chrome listens to map area attachment to query `getViewport()` or forward zoom/bearing requests through duck-typed events without taking a hard dependency on MapLibre GL.
