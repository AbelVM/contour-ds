# Data component policy — Contour

Shared policy for all data components (table, grid, tree, chart, kpi, stat,
readout, metrics, instrument, timeline, survey, measure, contour-plot, hexbin,
flow-map, isochrone, catchment).

## Invalid / missing data

- `null`, `undefined`, `NaN`, empty arrays, and malformed JSON are treated as
  "no data", not as errors. Render the empty state (`empty` attribute or
  default "No data").
- A parse failure on a `data`/`series`/`src` attribute is logged to console
  in debug mode and renders the empty state; it never throws out of render().
- Numeric formatting returns the raw value when `Intl` fails (formatValue).

## Stale / offline / retry

- `loading` attribute → loading state with optional skeleton count.
- `error` attribute → error state with optional `retry` button emitting
  `contour:retry` with `{ src }`.
- `brownout` / `brownout-level` → degraded presentation, not an error.
- Async components use the shared loader (`states.mjs`: loadRemote, remoteData,
  renderStates, renderEmpty, wireStates) with timeout/abort/retry/disconnect
  cleanup. Cache policy and stale-while-refreshing are per-component but must
  use these primitives.

## Announcements

- Loading/error/empty states are not live regions themselves; the host's
  `aria-busy` reflects loading. Toasts for async failures go through
  `#toast-host`.
- Value changes announce via the component's existing role (progressbar,
  status, etc.), not via a new live region.

## Performance

- Virtualized components (virtual-list, data-grid, tree-grid) must preserve
  semantic completeness (row/item counts, focus) and document overscan policy.
- Rebuild lifecycle is acceptable for small wrappers; high-volume components
  should set `updateMode = "keyed"` and use `ensure()`.

## Testing

- Every data component must be tested with null/NaN/empty/malformed input,
  timeout, abort, retry, and disconnect (R12-08, R12-31).
