# Contour 1.5 release acceptance criteria

A component or family enters 1.5 as "complete" only when every item below is
evidenced for its declared scope. Registration count, CSS parity, and static
specimens are not evidence of completeness.

## Per-component (all families)

- [ ] Attributes, reflected properties, slots, events, keyboard, states, CSS
      parts/custom properties, and controlled/uncontrolled rules are documented
      in a compact API table (guide §23 or family doc).
- [ ] Accessible name, role, and state are present in both themes; measured by
      `tools/audit/contrast-and-aria.mjs`.
- [ ] Keyboard path exists for every interactive surface, including focus
      return after overlay close and roving tabindex where applicable.
- [ ] Live regions announce state changes; `#toast-host` carries the role.
- [ ] Reduced motion, forced colours, 200% zoom, and 320/390 px reflow pass
      (`tools/audit/check-reflow.mjs`).
- [ ] Invalid/null/NaN/empty/error states are defined and announced, not
      silently swallowed.
- [ ] No-JS / late-definition path is visible and usable.

## High-risk families (table, grid, tree, chart, form, overlay, drag, map chrome)

- [ ] Keyed/incremental update strategy documented; rebuild lifecycle only for
      small wrappers.
- [ ] Performance and memory budgets measured at 1k/10k rows, 100 series,
      1k tree nodes, repeated connect/disconnect.
- [ ] Virtualization preserves semantic completeness (row/item counts, focus).
- [ ] Form validity, reset, disabled, IME, autofill, locale/RTL covered.
- [ ] Drag/resize/reorder have keyboard and touch alternatives.
- [ ] Charts expose data-table/summary fallback and accessible names.

## Packaging and DX

- [ ] Selective ESM entry points per family; all-in bundle retained.
- [ ] `sideEffects` metadata revisited and import cost measured.
- [ ] SSR-safe import boundary documented and guarded.
- [ ] TypeScript declarations beyond `HTMLElement` for stable shared props/events.
- [ ] Published tarball, CSP/Trusted Types, and source-map acceptance tested.

## Resilience and quality

- [ ] Lifecycle state-machine tests (connect/upgrade/attribute/slot/async/disconnect).
- [ ] Adversarial authored-DOM tests (duplicate IDs, malformed slots, large strings).
- [ ] Mixed-page contention budgets (long tasks, input delay, layout shift, memory).
- [ ] AT/browser interoperability tests for composite patterns.
- [ ] Repeatability/flake budget and published-package consumer fixture.

## Process

- [ ] `node tools/doctor.mjs` green.
- [ ] All browser gates green on Chromium, Firefox, WebKit.
- [ ] Guide workflows (map+table selection, filter+query, time slider+chart, form
      validation, layer panel+map slot, docs page with URL state) present.
- [ ] Libreship compatibility page present.
