# Guide workflows — Contour (R12-13)

Task-oriented specimens that prove components compose into real products.
Each workflow is a guide section (or subsection) with a rendered example and
snippet, exercising multiple families together.

## Required workflows

1. **Map + table selection** — selecting a row highlights the corresponding
   map feature and vice versa; shared selection identity via `contour:select`.
2. **Filter + query + empty/error** — filter-bar + table + empty/error states
   with retry; demonstrates stale-data and retry semantics.
3. **Time slider + chart + stale data** — time-slider drives a streaming-chart;
   stale-data badge and pause/play; reduced-motion path.
4. **Form validation** — multi-field form with validity, reset, disabled,
   IME, and submit; demonstrates form association and `contour:change`.
5. **Layer panel + map slot** — layer-switch/layer-panel controlling map-area
   slots; demonstrates slot composition and map chrome boundary.
6. **Documentation page with URL state** — docs-shell with URL-synced section
   state; demonstrates no-JS fallback and anchor navigation.

## Status

Workflow list defined. Rendered specimens in `index.html` are not yet added;
this is the open work for R12-13. Each workflow must include a no-JS path
and a late-definition (upgrade) path.
