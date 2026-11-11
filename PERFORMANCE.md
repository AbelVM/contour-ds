# Performance and memory policy — Contour

## Budgets (lab, deterministic)

- 1k rows: table render < 100 ms; 10k rows: < 500 ms (virtualized).
- 100 series chart: < 200 ms.
- 1k tree nodes: < 200 ms.
- Repeated connect/disconnect (100 cycles): no leaked timers, observers,
  requests, document listeners, or generated nodes.
- Mixed page (3+ families): long tasks < 50 ms, input delay < 100 ms,
  CLS < 0.1, DOM growth bounded.

## Measurement

- `tools/audit/perf-budget.mjs` enforces the budgets above in a real Chromium
  page that links the shipped `dist/contour.min.css` and runs the shipped
  `dist/contour-wc.min.js`. Each workload is mounted five times after one
  warm-up pass; the gate compares the p75 of **mount → style + layout** (the
  component's own main-thread cost) and prints the p75 of **mount → painted
  frame** beside it. The painted number includes the fixed vsync wait and is
  reported, not budgeted, so a slow compositor cannot be mistaken for a slow
  component. A deliberate 60 ms task proves the long-task observer reported
  before a zero is read as evidence.
- `tools/check-large-data.mjs` keeps the jsdom shape checks (markup volume,
  lifecycle cycles) where a browser is not required, and attributes its own
  1k-row overage to jsdom rather than publishing it as a budget.
- `tools/audit/glass-budget.mjs` measures the translucent surfaces over a
  moving canvas at 6× CPU with software rasterisation — a low-power lab proxy,
  not a physical phone. The shipped `.c-header` (16 px), `.c-toolbar` (12 px)
  and `.c-dash-toolbar` (14 px) hold p75 16.7 ms with 0 % slow frames; a
  full-screen blur control shows 4.4–6.7 % slow frames, so the zero is not a
  blind instrument. Every blur surface resolves to `backdrop-filter: none`
  under `prefers-reduced-transparency: reduce`.
- `tools/audit/wc-contract.mjs` covers load/render/rerender/leak for a slice.
- Endurance and contention budgets (R12-07, R12-32) are not yet automated.
- Field measurement: opt-in hook for INP-shaped interaction timing with
  component-family attribution, no user content collected, no mandatory
  runtime dependency (R12-34).

## Rules

- Avoid rebuilding large generated trees for small attribute changes; use
  `updateMode = "keyed"` and `ensure()`.
- `content-visibility: auto` only on long off-screen lists with
  `contain-intrinsic-size`; never on anchor targets or map-layout containers.
- `contain: layout` on self-contained component roots.
- No PurgeCSS in shipped pipeline (R12-21 rejected).
