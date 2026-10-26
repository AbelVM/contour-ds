# Contour

[![npm version](https://img.shields.io/npm/v/contour-ds?label=npm)](https://www.npmjs.com/package/contour-ds)
[![jsDelivr](https://img.shields.io/jsdelivr/npm/hm/contour-ds?label=jsDelivr)](https://cdn.jsdelivr.net/npm/contour-ds/dist/contour.min.css)

A token-driven design system for **spatial interfaces** — routing engines, pedestrian
simulators, map tooling and geospatial dashboards.

<!-- ds:components-line -->163 components, 290 design tokens<!-- /ds:components-line -->, dark and light themes, zero runtime dependencies, no build step.

The [style guide](index.html) is the specification and the test suite.

## Install

```bash
npm install contour-ds
```

The tarball ships `dist/` and `src/`: `prepack` runs `node tools/build.mjs`, so the
bundle beside the source is derived from it, never hand-copied.

### From the package

Import by specifier — the `exports` map in `package.json` is the published surface, and
`contour-ds/dist/contour.css` does **not** resolve, because no key under `./dist/` is
exposed:

```css
@import "contour-ds/contour.min.css";               /* every layer, in cascade order */
@import "contour-ds/surfaces/contour-data.min.css";  /* or -core, -docs, -landing */
@import "contour-ds/hljs.css";                      /* optional companion, not in the bundle */
@import "contour-ds/map-chrome/maplibre";           /* or /mapbox */
```

`main`, `style` and the bare `exports["."]` condition resolve to the **unminified**
`dist/contour.css`, so a consumer who cares about weight names `contour.min.css`
explicitly. The machine-readable documents ride that same map: `contour-ds/tokens.json`,
`contour-ds/themes.json`, `contour-ds/components.json`.

For progressive enhancement, the built web-component layer is a classic script rather
than a module, so it loads with a plain tag — `dist/contour-wc.js`, minified in
`dist/contour-wc.min.js`, published as `contour-ds/contour-wc.js`.

### From a checkout — no build step, no dependency

`src/css/ds.css` chains the sheets with relative `@import` statements, so a page can link
the source off a disk or copy the folder:

```html
<link rel="stylesheet" href="src/css/ds.css" />
<script src="src/js/ds.js" defer></script>  <!-- optional -->
```

### The bundle

That chain costs a request per sheet, a waterfall on the critical path, so ship one file.
A clone has no `dist/` — it is build output, and gitignored — so build it:

```bash
node tools/build.mjs
```

```html
<link rel="stylesheet" href="dist/contour.min.css" />
<script src="dist/contour.min.js" defer></script>  <!-- optional -->
```

`dist/contour.css` is the same bundle unminified, for reading a cascade in devtools.
`dist/surfaces/` carries one bundle per surface — `contour-core`, `contour-docs`,
`contour-data`, `contour-landing` — so a product that ships one surface stops downloading
the other three. `node tools/check-size.mjs` prints the weight of each against its
budget; the figures are not restated here, because a hand-copied number rots the moment a
sheet changes.

The CSS bundles — full and per-surface — pull the self-hosted fonts from `dist/fonts/`
beside them, so take the two together. `hljs.css` and `map-chrome.*.css` are the
exceptions: they reference no font. `node tools/build.mjs --single` additionally writes
`contour.single.min.css`, the minified CSS with those fonts inlined as data URIs, for a
consumer that must ship exactly one file.

### What ships

`node tools/build.mjs` writes `dist/`, and every file below is in the tarball. They are
listed here because `node tools/check-dist.mjs` fails when a shipped artifact is named by
no document — a bundle nobody names is a bundle nobody finds.

| File | What it is |
|---|---|
| `contour.css` / `contour.min.css` | every layer, in cascade order |
| `contour.js` / `contour.min.js` | the optional enhancement script |
| `contour-wc.js` / `contour-wc.min.js` | the web components, as a classic script |
| `contour.d.ts` | TypeScript definitions: element names, token names, the public API |
| `contour.single.min.css` | opt-in `--single`: the minified CSS with the fonts inlined |
| `surfaces/contour-core.min.css` | one bundle per surface, beside `-docs`, `-data`, `-landing` |
| `fonts/` | the self-hosted woff2 files the CSS references |
| `hljs.css` | the optional highlight.js companion, kept out of the bundle |
| `svg/contour-mark.svg` | the brand mark |
| `contour.tokens.json` | the token layer as a **DTCG 2025.10 Format** document |
| `contour.themes.json` | the dark half of every `light-dark()` pair, as a **Resolver** document |
| `contour.components.json` | the component contract: blocks, elements, variants, states, and the custom properties each one reads |
| `docs/index.json` | the guide's prose as a machine-readable package, one file per section, re-derived from `index.html` |
| `registry/registry.json` | a shadcn registry: one item per surface, pointing at the bundles rather than copying them |
| `agent-rules.json` | the constraints for a machine generating UI, each naming the gate that enforces it |
| `map-chrome.maplibre.css` / `map-chrome.mapbox.css` | the map control chrome, re-keyed per engine |
| `map-chrome-contract.json` | the tokens those controls are re-keyed onto |
| `build-manifest.json` | the sources and outputs of the build that wrote the directory |

`node tools/check-export.mjs`, `check-components.mjs`, `check-docs.mjs` and
`check-registry.mjs` each re-derive their artifact from `src/` and `index.html`, so a
stale `dist/` fails the build instead of shipping. That is also why `dist/` is never
committed: it is a derivation, and a committed copy is a second source of truth that the
gates above exist to catch.

## Bundler import order

If inlining layers with a bundler, import them in this order (`ds.css` declares the same order):

```css
@import "src/css/fonts.css";
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
```

The package does not expose this chain sheet by sheet — take one entry point from
`contour-ds/contour.min.css`, or one surface from `contour-ds/surfaces/…`, as shown in
Install. Re-ordering the layers is the build's job, owned by `src/css/ds.css` and checked
by `node tools/check-claims.mjs`.

## Quick start

```html
<button class="c-btn c-btn--primary">Compute route</button>

<div class="c-kpi">
  <div class="c-kpi__value">42</div>
  <div class="c-kpi__label">Routes matched</div>
</div>

<contour-card title="Hello">
  <p>Slotted content survives re-renders.</p>
</contour-card>
```

## Surfaces

| Surface | Guide |
|---|---|
| Landing | [§15](index.html#landing) |
| Documentation | [§14](index.html#docs) |
| Dashboard | [§13](index.html#data) |
| Recipes | [§18](index.html#recipes) |

## Key features

- **Zero runtime dependencies** — pure CSS + optional JS enhancement
- **Dark/light themes** via `light-dark()` and `color-scheme`
- **163 components** across 14 stylesheets (landing, docs, dashboard, data)
- **290 design tokens** — colours, typography, space, shape, motion, density
- **Web components** — 324 custom elements (`<contour-*>`, `<contour-shadow-*>`) with attribute reactivity
- **DTCG 2025.10** token export (Format + Resolver documents)
- **shadcn registry** — one item per surface bundle
- **WCAG 2.2 AA** — contrast, focus, reflow, reduced motion, forced colours
- **Self-hosted fonts** — IBM Plex (Sans, Mono, Condensed), subsetted, OFL 1.1

## Theming

```css
:root {
  --brand-hue: 182.5;   /* re-tints every primary surface */
  --radius-scale: 1;     /* scales every radius at once */
}
```

```html
<meta name="color-scheme" content="light dark" />
```

## Tokens

Four layers: primitives → semantic → component → utilities. Primitives never change between themes.

```css
@import "src/css/fonts.css";
@import "src/css/tokens.css" layer(tokens);
@import "src/css/base.css" layer(base);
@import "src/css/components.css" layer(components);
/* + components-shell, components-data, components-docs, components-landing, patterns, utilities */
```

## Components

Naming: `.c-<block>`, `.c-<block>__<element>`, `.c-<block>--<variant>`.

Groups: actions, forms, status, surfaces, navigation, feedback, overlays, data, documentation, landing, layout.

Full reference: [style guide](index.html).

## Web components

```html
<script type="module" src="src/js/wc/index.mjs"></script>
<contour-card title="Hello"><p>Slotted content</p></contour-card>
```

Light DOM (`<contour-*>`) and Shadow DOM (`<contour-shadow-*>`) wrappers. Attribute-reactive, form-associated, keyboard-navigable. See [§23](index.html#webcomponents).

## Performance

The guide itself loads every component and 4 external scripts (highlight.js from a CDN, `ds.js`, `wc/index.mjs`, `guide.js`); its Lighthouse score is not the system's score.

## Browser support

Sizes are in `rem`; the layout reflows to 200% zoom and to a 390 px viewport with no horizontal page scroll.

Baseline newly-available features with progressive enhancement. `light-dark()` is the most load-bearing (newly available 2024-05-13, widely available 2026-11-13). Fallback sheet: `src/css/light-dark-fallback.css`. Full details: [Browser support](index.html#browser-support).

## Commands

| Command | What it does |
|---|---|
| `node tools/build.mjs` | Bundle into `dist/`, export tokens |
| `node tools/build.mjs --single` | Single-file build with inlined fonts |
| `node tools/snippets.mjs` | Regenerate code snippets in `index.html` |
| `npx html-validate index.html templates/*.html` | Validate markup |
| `node tools/doctor.mjs` | Run all quality gates |

## Repository

```
src/       the design system (a consumer takes this and nothing else)
assets/    guide-only (never shipped)
tools/     build-time scripts (never shipped)
templates/ three starter pages (landing, docs, dashboard)
dist/      build output (gitignored)
```

## Licence

MIT. Fonts: SIL Open Font License 1.1 (see `src/css/fonts/OFL.txt`).

---

Full reference: [style guide](index.html) · [CHANGELOG](CHANGELOG.md) · [DESIGN.md](DESIGN.md)