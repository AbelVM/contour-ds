---
name: Contour
version: "1.0"
description: A token-driven design system for spatial interfaces — routing engines, pedestrian simulators, map tooling and geospatial dashboards.
license: MIT
repository: https://github.com/abelvm/contour-ds

tokens:
  count: 272
  layers: [primitives, semantic, component, utility]
  themes: [light, dark, positron, dark-matter, high-contrast]
  theme_mechanism: light-dark() + [data-theme]
  override_knobs: [brand-hue, radius-scale]
  theme_scope: .c-theme-scope

surfaces: [landing, documentation, dashboard]

components: 134

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
  development: "src/css/ds.css (nine chained @import — waterfall)"
  mandatory: ["src/css/tokens.css", "src/css/base.css"]
  optional_components: ["components-docs.css", "components-data.css", "components-landing.css", "patterns.css", "utilities.css"]
  behaviour: "src/js/ds.js (optional, exposes window.Contour)"
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

An opt-in theme set sits on top of the two system themes — positron,
dark-matter, high-contrast — applied via `data-theme` on a subtree. The
two system themes keep working unchanged; a product that needs more
overrides the semantic layer there.

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
- `--chart-dash-1…6` — one dash pattern per series
- `--color-heat-1…6` — multi-hue heat ramp (NOT sequential)

### Chart geometry contract (T-136)

The chart vocabulary is CSS-only: axes are `space-between` spans, gridlines are a
fixed 25%-interval CSS gradient, and the tooltip reuses `.c-tooltip` recoloured
via `--chart-tooltip-*`. Tick placement is the consumer's responsibility —
`Contour.chart.ticks()` returns the values, the author maps them to pixels.
There is no y-axis element in the vocabulary and no scrubber (T-137, deferred).
This is the honest ceiling: the system ships the *tokens and the dash patterns*,
not a charting engine.

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
- `node tools/check-tokens.mjs` fails unless every declared token is read, or is named in its ledger with the task that will resolve it. The ledger can only shrink.
