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
