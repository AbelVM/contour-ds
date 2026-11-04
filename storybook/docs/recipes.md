# Three shells, one system.

Section `recipes` — marker `19`, position 20 of 26 in the guide.
Generated from `index.html`; prose quoted, counts from the inventory, no URL (the project is
private until v1.0). See `index.json` for the whole set and the shared statement.

## What the guide says

Contour covers landing pages, documentation sites and technical dashboards. The components are shared; the composition, density and type scale change. Below are all three, rendered live.

Equivalent contour-* elements are catalogued in §23.

A page whose only job is to earn a click. Generous type, one primary action, and a hero that shows the product rather than describing it. The contour field runs full-bleed behind everything.

Compute routes and isolines from OpenMapTiles entirely client-side. No routing server, no third-party API, no data leaving the device.

No routing infrastructure to size, monitor or pay for. The deployment footprint stays flat.

Millisecond-scale responses with no round trip, so the map feels like a surface rather than a request.

Routing, isolines, a MapLibre control and GeoJSON export in one package.

A reading surface where the URL is the state. A navigation tree on the left, a measured prose column in the middle, an on-this-page rail on the right. Every entry is a real link, so it all works without JavaScript.

Getting started

Install the package, point it at a tile source, and compute your first route. Four lines, no server.

The package ships ESM and type definitions. No peer dependencies beyond MapLibre, and none of them are required for the core API.

Call route() with a source, a destination and a tile URL. It returns the geometry, the cost and the engine that produced them.

Tile preparation dominates

The first call fetches and parses every tile in range. The search itself takes milliseconds — budget for the graph, not the query.

On this page

A scanning surface. Density is the feature: comfortable by default, one toggle for compact. Every panel reports its own state, and chart colours come from a dedicated token layer so series stay distinguishable.

Last 7 days · all profiles

By route volume

48 rows · sorted by latency

## Subsections

- Landing page
- Documentation site
- Technical dashboard
- Web component counterpart

## Blocks documented here

40 block(s). Their facts live in `../contour.components.json`;
only the names are here, because the same figure in two files is how a document
starts disagreeing with itself.

- `.c-anchor`
- `.c-badge`
- `.c-breadcrumb`
- `.c-btn`
- `.c-callout`
- `.c-chart`
- `.c-chart-grid`
- `.c-chip`
- `.c-code`
- `.c-code-tabs`
- `.c-dash-freshness`
- `.c-dash-kpi-row`
- `.c-dash-shell`
- `.c-dash-toolbar`
- `.c-delta`
- `.c-docs-nav`
- `.c-docs-shell`
- `.c-dot`
- `.c-filter-bar`
- `.c-filter-pill`
- `.c-icon-badge`
- `.c-install`
- `.c-kbd`
- `.c-kpi`
- `.c-landing-features`
- `.c-landing-hero`
- `.c-legend`
- `.c-metrics`
- `.c-pager`
- `.c-panel`
- `.c-prose`
- `.c-readout`
- `.c-recipe`
- `.c-section-head`
- `.c-segmented`
- `.c-sparkline`
- `.c-table`
- `.c-table-wrap`
- `.c-threshold`
- `.c-toc`

### Defined by the guide, not the system

These appear in the specimen markup and in no sheet under `src/css`, so they are not
part of the component contract and nothing in an installed package defines them:

- `.c-cursor-demo`

---

Source `index.html` @ `5cccf136c267c6ad` · last committed 2026-11-04T11:55:08+01:00 · no URL: the project is private until v1.0.
