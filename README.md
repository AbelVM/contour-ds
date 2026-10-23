# Contour

A token-driven design system for **spatial interfaces** — routing engines, pedestrian
simulators, map tooling and geospatial dashboards.

<!-- ds:components-line -->134 components, 282 design tokens<!-- /ds:components-line -->, dark and light themes, zero runtime dependencies, no build
step. Three surfaces share one token layer, one type scale and one set of affordance rules: a
landing page that has to persuade, a documentation site that has to explain, and a dashboard that
has to be read at speed.

The [style guide](index.html) is the specification and the test suite. This file is the
reference.

## Contents

- [Install](#install) · [Surfaces](#surfaces) · [Principles](#principles) · [Tokens](#tokens)
- [Theming](#theming) · [Colour](#colour) · [Typography](#typography)
- [Components](#components) · [Data](#data) · [Accessibility](#accessibility)
- [Browser support](#browser-support) · [Repository](#repository) · [Commands](#commands)

---

## Install

**For production, use the bundle.** `src/css/ds.css` is a chain of
`@import` statements — one extra request per sheet, a waterfall on the critical
path. Which sheets, and in what order, is not typed here:
`node tools/check-claims.mjs` reads that list from `ds.css` and fails if the
list below drifts from it. The bundle is one file:

```html
<link rel="stylesheet" href="dist/contour.css" />
```

Or, if you are inlining layers with a bundler, import them in this order
(`ds.css` declares the same order):

```css
@import "src/css/tokens.css" layer(tokens);
@import "src/css/base.css" layer(base);
@import "src/css/components.css" layer(components);
@import "src/css/components-shell.css" layer(components);
@import "src/css/components-data.css" layer(components);
@import "src/css/components-docs.css" layer(components);
@import "src/css/components-landing.css" layer(components);
@import "src/css/patterns.css" layer(components);
@import "src/css/utilities.css" layer(utilities);
@import "src/css/light-dark-fallback.css";

/* Last, and with no layer() clause: it declares its own layers, because it
   writes into two of them. An engine without light-dark() needs it — see
   Browser support. It must be listed after the sheets whose values it re-points,
   because within a layer the later declaration wins. */
```

**`tokens.css` and `base.css` are not optional.** A product that takes only
`components-data.css` gets no tokens, no reset, no typography and no focus
ring. The component layer is split by audience, so a product that needs one
surface takes one *component* file — but it still needs the two foundation
files above it:

```css
@import "src/css/tokens.css" layer(tokens);
@import "src/css/base.css" layer(base);
@import "src/css/components-data.css" layer(components);  /* or -docs, or -landing */
```

`patterns.css` holds the composed shells (landing hero, docs shell, dash
shell). `utilities.css` is the single-purpose helpers.

```html
<button class="c-btn c-btn--primary">Compute route</button>
```

**Fonts** — IBM Plex Sans, IBM Plex Sans Condensed and IBM Plex Mono from Google Fonts
(`display=swap`). The system degrades to system UI fonts without them. For a smaller payload,
subset the request with `&text=` or switch to a variable font (T-42).

**Icons** — Contour ships no icon set. Icons are the consumer's; the system's components use
inline SVG with a 16 px grid and one stroke weight, so any icon set drawn on that grid will
match. The guide's own sprite is guide-only and does not ship (T-40).

**Behaviour** — optional. `src/js/ds.js` adds a command palette, a theme toggle, sortable
tables, tabs and range output. Every page works without it. It also exposes a small public
API on `window.Contour` (`version`, `toast`, `setScheme`, `scrollTo`, `copy`, `chart`, `commands`) for consumers who want
to drive the system's own feedback and navigation from their own code.

```html
<script src="src/js/ds.js" defer></script>
```

**Bundle** — `node tools/build.mjs` writes `dist/`:

| File | Contents |
|---|---|
| `contour.css` / `contour.min.css` | Every layer, in cascade order |
| `contour.js` / `contour.min.js` | The optional enhancement |
| `contour.tokens.json` | The semantic token layer for Figma or Style Dictionary; `light-dark()` values are split into `{ light, dark }` |
| `map-chrome.maplibre.css` / `map-chrome.mapbox.css` | The vendor re-key profile, published under both engine names |
| `map-chrome-contract.json` | The tokens a map control cluster is re-keyed onto, and the controls each engine ships |
| `svg/contour-mark.svg` | The brand mark |

Only the system is bundled — the guide, the templates and the guide-only artwork stay out.

**Map chrome** — a map engine paints its own control cluster over its canvas, and that
markup belongs to the engine, so `.c-map-slot` cannot reach it. `src/css/map-chrome.css`
re-keys the cluster onto the tokens the system already uses for its own controls — surface,
edge, radius, glyph colour — and touches nothing else: the engine keeps the geometry. It is
the one file in `src/css/` that `ds.css` does not import and the one that sits outside the
cascade layers, and both are deliberate: a vendor sheet is unlayered, so a layered rule
could not out-rule it whatever the link order, and a page with no map has no reason to load
it. Link it *after* the engine's own stylesheet. `node tools/build.mjs` publishes the single
source under both engine names (`dist/map-chrome.maplibre.css`, `dist/map-chrome.mapbox.css`)
and writes `dist/map-chrome-contract.json` beside them, which names the tokens the re-key is
made of and the control list each engine answers to. The Mapbox logo is out of reach by
construction — `a.mapboxgl-ctrl-logo` carries no `.mapboxgl-ctrl` class — which is as well,
since Mapbox's terms forbid styling it. `node tools/check-dist.mjs` fails if any of these
files ships without something in the repository naming it and linking it.

---

## Surfaces

| Surface | What it needs | Components | Guide |
|---|---|---|---|
| **Landing** | An argument, read in 20 seconds | logo wall, showcase, metrics, testimonial, pricing, comparison, FAQ, CTA | [§15](index.html#landing) |
| **Documentation** | A reference people can follow | callouts, do/don't, steps, code tabs, install block, diff, version picker, file tree, pager | [§14](index.html#docs) |
| **Dashboard** | A lot of numbers, scanned fast | KPI tiles, panels, filter bar, dense table, chart frame, legend, activity feed, drawer | [§13](index.html#data) |

All three are composed side by side in [§18 · Recipes](index.html#recipes).

---

## Principles

- **Colour is a signal.** ~85% of the interface is neutral. Tidal marks action and success,
  Plasma marks live data, Clay marks failure.
- **State is never colour alone.** Every status pairs a hue with a shape, an icon or a word.
- **No chart asks you to tell two colours apart.** Hue, then dash pattern, then the legend.
- **Affordable means obvious.** Every control looks like what it does, and says so before you
  touch it.
- **Depth is lightness, not shadow.** Shadows are reserved for things that genuinely float.
- **Mono means "machine".** IBM Plex Mono is for data, coordinates, labels and code — never prose.
- **Space carries the hierarchy.** Air around the thing that matters beats another colour or
  border.

---

## Tokens

Four layers, resolved in this order:

```
1. Primitives   --tidal-500, --plasma-500, --basalt-900 …
2. Semantic     --color-primary, --color-text-muted, --color-canvas-sunken …
3. Component    local custom properties inside each component rule
4. Utilities    .u-*
```

Primitives never change between themes; only the semantic layer does — so a theme swap is one
line, and a fourth theme needs no component changes.

`src/css/tokens.css` holds <!-- ds:tokens -->282<!-- /ds:tokens --> custom properties, of which <!-- ds:tokens-read -->280<!-- /ds:tokens-read --> are read by the system or the guide and <!-- ds:tokens-unread -->2<!-- /ds:tokens-unread --> are not. The table is generated by `node tools/stamp.mjs` from `src/css/tokens.css`, so its rows cannot disagree with the file:

<!-- ds:taxonomy-table -->| Group | Count | Read | Unread | Covers |
|---|---|---|---|---|
| Colour ramps | 53 | 53 | — | `--basalt-…`, `--tidal-…`, `--lumen-…`, `--plasma-…`, `--sol-…`, `--clay-…` |
| Brand ramp | 8 | 8 | — | `--brand-hue` and the ramp derived from it |
| Semantic colours | 66 | 66 | — | `--color-…` — text, surface, border, primary; every one `light-dark()` |
| Chart | 37 | 37 | — | categorical, sequential, diverging, dash patterns, chart chrome |
| Fill patterns | 6 | 6 | — | `--fill-hatch-…`, `--fill-dot` — the shape branch of a filled mark |
| Gradients | 4 | 3 | 1 | canvas, plate, heat, rule |
| Typography | 30 | 30 | — | families, sizes, weights, leading, tracking, measures |
| Space and layout | 22 | 22 | — | the 4 px scale, containers, gutter, header height, target sizes |
| Shape | 20 | 20 | — | radii, borders, hairline, shadows, elevation |
| Motion | 12 | 11 | 1 | durations and easings |
| Z-index | 6 | 6 | — | `--z-raised` … `--z-tooltip` |
| Density | 5 | 5 | — | row height, cell padding, label size |
| Focus | 1 | 1 | — | the focus ring perimeter |
| Miscellaneous | 12 | 12 | — | no documented prefix — fix the taxonomy |
| **Total** | **282** | **280** | **2** | unique custom properties in `src/css/tokens.css` |<!-- /ds:taxonomy-table -->

**Two knobs retheme and reshape everything:**

```css
:root {
  --brand-hue: 182.5;  /* re-tints every primary surface */
  --radius-scale: 1;   /* scales every radius at once */
}
```

**Theme scope** — a custom property containing `var()` is resolved where it is declared, so a
descendant that only changes `--brand-hue` has no effect. `.c-theme-scope` re-derives the whole
brand layer from local knobs and re-tints a subtree without touching the root
([Playground](index.html#playground)):

```html
<div class="c-theme-scope" style="--brand-hue: 250">…</div>
```

---

## Theming

`color-scheme` on `:root` is the only switch; every theme-sensitive colour resolves through
`light-dark()`, so the page follows the OS until a choice is stored.

```html
<meta name="color-scheme" content="light dark" />
```

```css
:root { color-scheme: light dark; }
:root:has(> head > meta[name="color-scheme"][content="dark"]) { color-scheme: dark; }
:root:has(> head > meta[name="color-scheme"][content="light"]) { color-scheme: light; }
```

`src/js/ds.js` ships a two-state header toggle and a three-state settings control; both write
that meta element. The toggle's icon labels the **action**, not the state — a sun means "click
for light".

---

## Colour

Every value is OKLCH, so lightness steps read evenly, and the neutrals are tinted toward the
brand hue rather than left as grey.

| Family | Role | Anchor |
|---|---|---|
| **Tidal** | Brand, primary action, success | `--tidal-500` = `#14b8a6` |
| **Plasma** | Accent, live data, editorial highlight | `--plasma-500` = `#f20084` |
| **Lumen** | Secondary series, info | azure `h ≈ 236` |
| **Sol** | Warnings, degraded states | amber `h ≈ 75` |
| **Clay** | Errors, destructive actions | red-orange `h ≈ 27` |
| **Basalt** | Neutrals — surfaces, text, borders | `h ≈ 230` |

Tidal and Plasma are **anchored on the reference brand colours**; every other step is derived
from them in OKLCH. The two chromatic families have separate jobs and are not interchangeable:

| | Tidal (teal) | Plasma (magenta) |
|---|---|---|
| Role | **Action and state** | **Highlight** |
| Used for | Primary buttons, active tabs, focus rings, eyebrows, status labels, links | The emphasised phrase in a headline, code strings, live data, hot values |
| Never for | Editorial emphasis | Primary buttons |

**Surfaces** — five steps. In dark mode, higher means lighter:

```
--color-canvas          page
--color-canvas-sunken   recessed section band
--color-surface-1       cards
--color-surface-2       raised
--color-surface-3       hover
```

Section bands are painted on a pseudo-element, so they can bleed past the content frame to the
viewport edges; the layout supplies the offsets.

**Shadows** — `--shadow-xs` … `--shadow-xl` are `light-dark()` values: a shadow of one strength
disappears into a dark surface, so the dark values are near-black and opaque. Depth is carried by
surface lightness first; the shadow only marks what genuinely floats.

---

## Typography

| Role | Family | Notes |
|---|---|---|
| Display | IBM Plex Sans Condensed | Fluid `clamp()` scale, tight tracking |
| Body / UI | IBM Plex Sans | Fixed `rem` sizes — product UIs need spatial predictability |
| Data / labels | IBM Plex Mono | Coordinates, labels, code, tabular numerals |

Two families, one superfamily. Body copy is capped at `68ch` and set at `1.65` leading — looser
than the default, because light-on-dark text needs more air.

---

## Components

| Group | Components |
|---|---|
| **Actions** | button (primary, secondary, outline, ghost, accent, danger, quiet-danger), sizes, icon, block, groups, loading, text link |
| **Forms** | field, input, select, textarea, search group, range, switch, checkbox |
| **Status** | badge, chip, status pill, waypoint dot, avatar |
| **Surfaces** | card, plate, feature block, icon badge, section head, stat, footer |
| **Navigation** | header, table of contents, tabs, segmented control, disclosure, breadcrumb, pagination, toolbar, sheet |
| **Feedback** | alert, toast, progress, contour meter, skeleton, spinner, empty state |
| **Overlays** | dialog, tooltip, popover, command palette, drawer |
| **Data** | table (a container query drops the optional columns), legend, readout, timeline, code block, pull quote, KPI tile, panel, filter bar, activity feed |
| **Documentation** | nav tree, callout, do/don't, steps, code tabs, install block, diff, pager, version picker, file tree, prose |
| **Landing** | logo wall, feature showcase, metrics band, testimonial, pricing, comparison matrix, FAQ, CTA band |
| **Layout** | grid (2/3/4), row, stack (sm/lg), cluster, sidebar, box (s/m/l/xl, border, scroll), container (scrollable), map area, map panel (top/bottom/left/right/center), map footer, app shell, app body |

Naming is `.c-<block>`, `.c-<block>__<element>`, `.c-<block>--<variant>`. Components do not reach
into one another with descendant selectors, with three documented exceptions: the button group
(`.c-btn-group--attached .c-btn`), the input group (`.c-input-group .c-input`), and the panel's
resize handle (`.c-panel:hover .c-resize-handle`, a visibility dependency, not a style). The
<!-- ds:components -->134<!-- /ds:components --> count is the number of
`.c-*` blocks in the component layer; the composed shells in `patterns.css` and the guide's own
shell are not counted.

---

## Data

Chart tokens are separate from the UI palette — a chart colour answers a different question from
a button colour.

```css
--chart-1 … --chart-8      categorical series, ordered so neighbours stay apart
--chart-seq-1 … -7         one hue, rising lightness
--chart-div-neg/mid/pos    diverging, for a real midpoint
--chart-dash-1 … -8        one dash pattern per series
```

Eight hues cannot all be separated by lightness, so every series also carries a dash pattern and
the legend previews it. Every series clears **3:1** against every surface it can be drawn on, in
both themes, and each legend key is checked against the dash token of its own series — enforced by
`node tools/audit/contrast-and-aria.mjs`, which exits non-zero on either.

**Density** — one token drives row height, cell padding and label size together, so a compact
table is a different rhythm rather than a smaller font:

```html
<div data-density="compact"> … </div>
```

**Data grid ceiling** — `.c-table` is for the first few hundred rows. It ships row selection,
a sticky header, pagination and column visibility, but no virtualised body; a 50 000-row grid
is out of scope for this release (T-70).

---

## Accessibility

Conformance target: **WCAG 2.2 AA**.

- Body text meets **4.5:1**, borders / focus rings / control edges **3:1**, in both themes —
  enforced by `node tools/audit/contrast-and-aria.mjs`, which measures the control edge and the focus ring against every surface a control can sit on, in both themes, and fails the build below 3:1.
- Every chart carries an accessible name that says what it plots, and a text alternative held in a **sibling** of the named image, never a descendant of it — enforced by `node tools/audit/chart-names.mjs`, which reads the accessibility tree and fails when a name is generic or the data never surfaces.
- A status message is announced from a live region that exists, empty, before anything is said: the toast host carries `role="status"` and the toast carries no nested role of its own — enforced by `node tools/audit/contrast-and-aria.mjs`, which fails a region that is already filled at load, since a region watches for changes and a pre-filled one has none left to announce.
- While a snippet disclosure is open the rest of the page leaves the tab order, and closing it releases every inert subtree — enforced by `node tools/audit/contrast-and-aria.mjs`, which fails a focusable that is still reachable behind the scrim and any `inert` left hanging after the disclosure closes.
- A map's chrome is themed by the system and its canvas is owned by the consumer. On a map surface the attribution band owns its corner through tokens, reserves the mark's shipped box and never restyles it — enforced by `node tools/audit/component-inventory.mjs`, which measures the band's own computed geometry against `--map-attribution-*`, so a hard-coded offset shows up as a disagreement rather than as a credit line that quietly stops matching the theme.
- A classified ramp names its breaks and its denominator, so a count is never presented as a density — enforced by `node tools/audit/component-inventory.mjs`, which refuses a `.c-legend[data-classification]` specimen with no method or no normalisation.
- State is never colour alone; every chart series carries a dash pattern as well as a hue.
- `prefers-reduced-motion: reduce` collapses every transition; Forced Colors Mode drops the
  texture and the ridgelines and falls back to a system `CanvasText` outline.
- Tabs and segmented groups use roving tabindex and arrow keys, exclusive choices use native radio
  inputs, dialogs use the native `<dialog>`, the palette uses the popover API.
- Single-key shortcuts stay out of the way: `/` opens the palette only when the focus is not in a
  field, a `<select>` or a `contenteditable`.
- Sizes are in `rem`; the layout reflows to 200% zoom and to a 390 px viewport with no horizontal
  page scroll.
- The reset zeroes every margin, including the `margin: auto` that centres a modal dialog —
  `.c-dialog` puts it back, and so must any reset you write.

---

## Browser support

Baseline *newly available* features, with progressive enhancement where noted.
`light-dark()` is the system's most load-bearing feature — every theme-sensitive
colour token is a `light-dark()` call — and it is **newly available since
2024-05-13**, expected to be **widely available on 2026-11-13**.

A browser without it does not fail gracefully, and the reason is worth stating
because it is not obvious: an unregistered custom property accepts any token
sequence, so `--x: light-dark(a, b)` parses and stores the TEXT; the break comes
one step later, when `var(--x)` substitutes it into a real property, which makes
that declaration invalid at computed-value time and drops it to its initial
value. Hence `src/css/light-dark-fallback.css`, generated from the token layer by
`node tools/gen-light-dark.mjs` and guarded on the value —
`@supports not (color: light-dark(white, black))`, never
`@supports (color: var(--x))`, which is always true and would freeze a modern
engine at the light branch. It re-points the tokens to the branch each engine can
parse, covering the OS preference and the manual `<meta name="color-scheme">`
flip. `color-scheme` is years older than `light-dark()`, so the population that
needs this file is exactly the one that knows the scheme but not the function —
which is why the dark branch is emitted twice, once for the media query and once
for the flip. (No Baseline dates are claimed for `color-scheme` here: they were
not recomputed from `web-features`/BCD in this pass, and a reused date note is how
this file has previously published a wrong one.)

The committed file is checked, not trusted: `node tools/gen-light-dark.mjs
--check` regenerates it in memory and fails if the bytes differ, and
`node tools/audit/contrast-and-aria.mjs` keeps measuring the real
`light-dark()` path in both themes.

| Feature | Status | Fallback |
|---|---|---|
| `light-dark()` (colour values) | Newly available since 2024-05-13; widely available from 2026-11-13 | `src/css/light-dark-fallback.css`, generated from the token layer and guarded on the value |
| `light-dark()` (image values) | Newly available since 2026-09-14; widely available from 2029-03-14 | **Do not use** — a three-year support tail. The system's gradients adapt by mixing token colours instead |
| `oklch()` | Widely available | Chrome 111+, Safari 15.4+, Firefox 113+ |
| `:has()` | Widely available | Chrome 105+, Safari 15.4+, Firefox 121+ |
| Container queries | Widely available | Chrome 105+, Safari 16+, Firefox 110+ |
| `color-mix()` | Widely available | Chrome 111+, Safari 16.2+, Firefox 113+ |
| Popover API | Widely available | `ds.js` falls back to `title`; the palette to an `is-open` class |
| Native `<select>` option list | Platform-drawn | Drawn by the platform, in the platform's colours — it follows the OS theme, not the page's. The closed control is the system's; the list is not |

The page is fully usable with JavaScript disabled.

---

## Repository

```
.
├── index.html            the living style guide
├── src/                  the design system — a consumer takes this and nothing else
│   ├── css/              ds.css (entry point), tokens, base, components*, patterns, utilities
│   ├── js/ds.js          optional progressive enhancement
│   └── svg/              the brand mark
├── assets/               guide-only — never shipped
│   ├── css/docs.css      the style guide's own shell
│   ├── js/guide.js       the guide's own behaviour
│   └── svg/              the contour field behind the chart-paper texture
├── tools/                build-time scripts — never shipped
├── templates/            three starter pages — one per surface
└── dist/                 build output — gitignored
```

A rule in `src/` has to work without the guide, so anything that only makes sense inside it lives
in `assets/`.

`tools/snippets.mjs` extracts the markup behind every rendered example and writes it back into the
matching disclosure, so a snippet cannot drift from what is on screen. The example and its
disclosure travel together in a generated `.ds-example`; a specimen that is neither a `.ds-panel`
nor a `.ds-spec` is found by the `data-snippet` attribute — and then the snippet shows that element
itself, tag and attributes included, because that is what a reader copies.

Every contour line in the repository — the brand mark, the chart-paper texture, the hero
instrument, the showcase map — is an **iso-line of a real field**, extracted with marching squares
by `tools/contour-gen.py`. Iso-lines of one field can never cross, so the artwork is generated,
never drawn.

---

## Commands

| Command | What it does |
|---|---|
| `node tools/build.mjs` | Bundle and minify the system into `dist/`, export the tokens |
| `node tools/snippets.mjs` | Regenerate the snippets in `index.html` — run after editing a specimen |
| `python3 tools/contour-gen.py` | Regenerate the contour artwork |
| `npx html-validate index.html templates/*.html` | Validate the markup |
| `node --check src/js/ds.js && node --check assets/js/guide.js` | Script syntax — one file per invocation; this tool reads only its first argument |

---

## Licence

MIT.
