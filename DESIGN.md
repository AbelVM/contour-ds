---
name: Contour
version: "1.0"
description: A token-driven design system for spatial interfaces — routing engines, pedestrian simulators, map tooling and geospatial dashboards.
license: MIT
repository: https://github.com/abelvm/contour-ds

tokens:
  count: 290
  layers: [primitives, semantic, component, utility]
  themes: [light, dark]
  theme_mechanism: light-dark() + [data-theme]
  theme_sets: declared by the product, not the system
  override_knobs: [brand-hue, radius-scale]
  theme_scope: .c-theme-scope

surfaces: [landing, documentation, dashboard]

components: 162

accessibility:
  conformance: "WCAG 2.2 AA"
  text_contrast: "4.5:1"
  non_text_contrast: "3:1"
  reduced_motion: true
  forced_colors: true
  target_size_minimum: "24px (WCAG 2.5.8)"
  rtl: structural

principles:
  - "Colour is a signal, never the message"
  - "State is never colour alone"
  - "No chart asks you to tell two colours apart"
  - "Affordable means obvious"
  - "Depth is lightness, not shadow"
  - "Mono means machine"
  - "Space carries the hierarchy"

anti_goals:
  - "Purple-to-blue gradient heroes"
  - "Glassmorphism as decoration"
  - "Neon-on-black saturation"
  - "Mono type for body copy"
  - "Charts that rely on hue alone"
  - "Icon-only controls whose meaning is not guessable"
  - "Pure black or pure white in the palette"

browser_support:
  light_dark_colour: "Newly available 2024-05-13, widely available 2026-11-13"
  light_dark_image: "Newly available 2026-09-14, widely available 2029-03-14 (do not use)"
  oklch: "Widely available"
  has: "Widely available"
  container_queries: "Widely available"
  anchor_positioning: "Newly available 2026-01 (parts vary); used behind @supports for tooltips/menus"

install:
  production: "dist/contour.css"
  development: "src/css/ds.css (a chained @import per sheet — a request waterfall)"
  mandatory: ["src/css/tokens.css", "src/css/base.css"]
  optional_components: ["components-docs.css", "components-data.css", "components-landing.css", "patterns.css", "utilities.css"]
  behaviour: "src/js/ds.js (optional, exposes window.Contour); src/js/wc/index.mjs (optional, 320+ custom elements: light DOM <contour-*> and shadow DOM <contour-shadow-*>)"
---

# Contour — Design System

## What this is

Contour is a token-driven design system for spatial interfaces: routing
engines, pedestrian simulators, map tooling and geospatial dashboards. It
ships three surfaces (landing page, documentation site, technical dashboard)
that share one token layer, one type scale and one set of affordance rules.

## Token architecture

Four layers, resolved in this order:

1. **Primitives** — `--tidal-500`, `--plasma-500`, `--basalt-900` … (never change between themes)
2. **Semantic** — `--color-primary`, `--color-text-muted`, `--color-canvas-sunken` … (all `light-dark()`)
3. **Component** — local custom properties inside each component rule
4. **Utilities** — `.u-*`

Two knobs retheme and reshape everything: `--brand-hue` (default 182.5) and
`--radius-scale` (default 1). `.c-theme-scope` re-derives the whole brand
layer for a subtree. A third knob, `--density`, drives row height, cell
padding and label size together (compact mode via `data-density="compact"`).

## Theming

`color-scheme` on `:root` is the only switch. Every theme-sensitive colour
resolves through `light-dark()`. The page follows the OS until a choice is
stored in `<meta name="color-scheme">`.

`data-theme` is an extension point, not a list of themes. The system ships two —
`light` and `dark` — and declares no named set of its own: a set is a product
decision, so a product writes one on the semantic layer in its own stylesheet
(airship/libreship declares positron, dark-matter, voyager and high-contrast in
`packages/styles/src/tokens/index.css`). A set re-points the semantic tokens it
changes and sets `color-scheme` in the same block. The guide carries one worked
example, `daylight`, in `assets/css/docs.css` — as a consumer, not as the system.

## Colour

Five OKLCH families plus a tinted neutral ramp (Basalt, h≈230):

| Family | Role | Anchor |
|---|---|---|
| Tidal | Brand, primary action, success | `--tidal-500` = `#14b8a6` |
| Plasma | Accent, live data, editorial highlight | `--plasma-500` = `#f20084` |
| Lumen | Secondary series, info | azure h≈236 |
| Sol | Warnings, degraded states | amber h≈75 |
| Clay | Errors, destructive actions | red-orange h≈27 |

Tidal and Plasma are anchored on the reference brand colours. Neutrals are
tinted, never pure grey. No pure black, no pure white.

## Typography

| Role | Family | Notes |
|---|---|---|
| Display | IBM Plex Sans Condensed | Fluid `clamp()` scale |
| Body / UI | IBM Plex Sans | Fixed `rem` sizes |
| Data / labels | IBM Plex Mono | Coordinates, labels, code, tabular numerals |

## Chart tokens

Separate from the UI palette. A chart colour answers a different question
from a button colour.

- `--chart-1…8` — categorical series, ordered so neighbours stay apart
- `--chart-seq-1…7` — one hue, rising lightness (sequential)
- `--chart-div-neg/mid/pos` — diverging, for a real midpoint
- `--chart-dash-1…8` — one dash pattern per series
- `--color-heat-1…6` — multi-hue heat ramp (NOT sequential)

### Chart geometry contract (T-136, amended by C-24)

The chart vocabulary is CSS-only: the category axis is a `space-between` span,
and the gridline band is **derived** from `--chart-ticks` — one band per value
interval, `100% / (ticks - 1)` — so a gridline falls on every value tick by
construction instead of agreeing with one tick count by luck. An earlier
revision of this file called the fixed 25% gradient a permanent ceiling; it was
not permanent, only un-parameterised.

The real limit is elsewhere and is still true: the frame ships the vocabulary
(plot, axis, line, bar, point, band, missing, hover, tooltip) and the *values*
are the consumer's — `Contour.chart.ticks()` returns them, the author sets
`--chart-ticks` to how many there are and maps data to pixels. There is no
y-axis element to render those values and no scrubber (T-137, deferred), so the
number is declared, not displayed. The bands measure the value axis; the
category axis is a different axis and nothing aligns them. The tooltip is
positioned by its plot through `--chart-tip-block-start` /
`--chart-tip-inline-start`, both declared in the token layer rather than invented at
the point of use, and hover is a `:hover` state on the marks rather than a class no
author can reach. `node tools/check-chart-geometry.mjs` asserts the derivation and
the tooltip geometry in a real browser.

The accessible name says what is plotted, and the data alternative sits beside the
named image, not inside it: `role="img"` is a leaf role, so a description nested in
the image may be pruned by a reader even where one engine lists it. Measured, then
gated by `node tools/audit/chart-names.mjs`.

This is the honest ceiling: the system ships the *tokens, the dash patterns, the
geometry seam and the text alternative*, not a charting engine.

## Layout vocabulary

Three prefixes once did the same job, and the split was inherited rather than
chosen: page furniture in `@layer base`, composition helpers in
`@layer components`, and a grid set in `@layer utilities` that no page, template
or rule ever used.

The contract now, enforced by `node tools/check-layout.mjs`:

| Family | Names | Status |
|---|---|---|
| Composition | `.c-row` `.c-stack` `.c-cluster` `.c-sidebar` | canonical — the `c-` prefix like every other block |
| Page frame | `.container` `.section` `.grid` `.split` | unprefixed on purpose: document furniture, not a block a consumer composes |
| Utility grid | `.u-cols-*` `.u-auto-grid` | `@deprecated`; zero consumers, removal is a v1.0 act, not a v2 one |

Two rules that are easy to get wrong. `.stack` and `.c-stack` (and
`.cluster`/`.c-cluster`) are **not** the same shape: they gap by different
tokens, so an alias between them would silently restyle every use — the gate
pins each token so the drift is visible. And a `@deprecated` note is a claim
about a rule, so the gate requires the marker and the ledger to agree in both
directions, which is what the policy in `AGENTS.md` always said and nothing ever
checked.

## Web components

Optional progressive-enhancement layer under `src/js/wc/` (entry `src/js/wc/index.mjs`;
also `dist/contour-wc.js` / `dist/contour-wc.min.js`). Defines 320+ custom elements
(`<contour-btn>`, `<contour-card>`, `<contour-shadow-card>`, …) that generate their
scaffolding from attributes and slotted content. No runtime dependencies; the page works
without it.

- **Light DOM** (`<contour-*>`) adds CSS classes and generates structure from attributes,
  so `ds.css` styles apply directly. Interactive blocks (tabs, code-tabs, combobox, tree,
  segmented) wire their own keyboard and activation behaviour and work standalone.
- **Shadow DOM** (`<contour-shadow-*>`) uses Shadow DOM with named slots and adopted
  stylesheets, for encapsulation where desired. Reflects `variant`, `size` and `color`
  attributes onto its root and re-renders on change.
- All components are attribute-reactive: changing an attribute re-renders the component.

### Reactivity

Every component extends `ContourBase`. On first connect it snapshots the author's nodes
and `class` attribute; on an attribute change it restores that snapshot, re-runs
`render()`, and re-wires behaviour via `enhance()`. Authored content and listeners
survive re-renders; generated nodes are rebuilt. Form control values are preserved.
Render bodies use `ensure(selector, factory)` for update-or-create reactivity.
`observedAttributes` is derived from the attributes a component reads; attributes it
writes to itself (`role`, `open`, `aria-*`, `tabindex`) are excluded to prevent
re-entrant renders.

### Behaviour composition

Composition happens through the DOM and through events, not through component internals:

- A host composes by nesting/slotted content; authored children survive re-renders.
- Interactive components emit bubbling `contour:*` CustomEvents (`contour:change`,
  `contour:select`, `contour:copy`, `contour:remove`, `contour:page`,
  `contour:open`/`contour:close`, `contour:empty-action`).
- Shadow wrappers adopt the document's same-origin stylesheets once and share a single
  parsed `CSSStyleSheet` across instances.
- `window.ContourElements` (frozen array) lists every registered name in registration
  order; `customElements.get(name)` is the runtime check.

## Rules

1. Colour is a signal. ~85% of the interface is neutral.
2. State is never colour alone. Every status pairs a hue with a shape, icon or word.
3. No chart asks you to tell two colours apart. Hue, then dash pattern, then legend.
4. Affordable means obvious. Every control looks like what it does.
5. Depth is lightness, not shadow. Shadows are reserved for things that float.
6. Mono means "machine". Data, coordinates, labels, code — never prose.
7. The URL is the state. On a documentation site every link is a real link.

## Anti-goals

- Purple-to-blue gradient heroes, glass cards, gradient text on metrics
- Identical icon+heading+text card grids
- Neon-on-black saturation
- Mono type as lazy "developer" shorthand
- Floating glass panels without functional reason
- Charts that rely on hue alone
- Icon-only controls whose meaning only a regular user would guess
- Landing pages that reuse dashboard density, or dashboards that reuse landing air

## For agents

- `AGENTS.md` contains 11 rules, each the scar tissue of a real mistake.
- `src/` is the system. `assets/` is guide-only and never ships.
- Every contour line is an iso-line of a real field, generated by marching squares.
- The style guide (`index.html`) is the specification and the test suite.
- `node tools/snippets.mjs` regenerates code snippets after editing a specimen.
- `node tools/build.mjs` bundles and minifies into `dist/`.
- `node tools/check-wc.mjs` validates the web component base class, IIFE closure, registry and duplicate defines.
- `node tools/audit/wc-contract.mjs` validates load, define, scaffold, render, re-render, leak, shadow and table wrap in a browser.
- `node tools/check-tokens.mjs` fails unless every declared token is read, or is named in its ledger with the task that will resolve it. The ledger can only shrink.
