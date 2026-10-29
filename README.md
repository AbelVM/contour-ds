# Contour

[![npm version](https://img.shields.io/npm/v/contour-ds?label=npm)](https://www.npmjs.com/package/contour-ds)
[![jsDelivr](https://img.shields.io/jsdelivr/npm/hm/contour-ds?label=jsDelivr)](https://cdn.jsdelivr.net/npm/contour-ds/dist/contour.min.css)

A token-driven design system for **spatial interfaces** — routing engines, pedestrian
simulators, map tooling and geospatial dashboards.

<!-- ds:components-line -->203 components, 294 design tokens<!-- /ds:components-line -->, dark and light themes, zero runtime dependencies, no build step.

The [style guide](index.html) is the specification and the test suite.

## Install

```bash
npm install contour-ds
```

The tarball ships `dist/` and `integrations/`: `prepack` runs `node tools/build.mjs`, so the
bundle beside the source is derived from it, never hand-copied. (`src/` is not in the
tarball — a consumer takes `src/` from the repository, not the package.)

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

### ESM (tree-shakeable)

For bundler consumers, ESM builds are available so unused exports can be dropped:

```js
import "contour-ds/contour-wc.esm.js";          // registers every custom element
// or, for tree-shaking of individual modules:
import "contour-ds/wc/forms.mjs";
```

The classic `contour-wc.js` remains the recommended entry for a plain `<script>` tag
off disk; the ESM build is for bundlers. Both register the same custom elements as a
side effect on import.

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

## Framework quickstarts

Contour is plain CSS plus an optional script, so it drops into any bundler or
framework without an adapter. Import the stylesheet once at your app entry and
use the classes (or the `<contour-*>` web components) anywhere.

### React / Next.js

```jsx
// app/layout.jsx (Next.js) or main.jsx (Vite + React)
import "contour-ds/contour.min.css";
import "contour-ds/contour-wc.esm.js"; // optional web components

export default function Root({ children }) {
  return <html data-theme="dark"><body>{children}</body></html>;
}
```

```jsx
// Component.jsx
export function RouteButton() {
  return <button className="c-btn c-btn--primary">Compute route</button>;
}
```

### Vue / Nuxt

```js
// main.js
import "contour-ds/contour.min.css";
import "contour-ds/contour-wc.esm.js";
```

```vue
<!-- Component.vue -->
<template>
  <button class="c-btn c-btn--primary">Compute route</button>
  <contour-card title="Hello"><p>Slotted content</p></contour-card>
</template>
```

### Svelte / SvelteKit

```js
// +layout.svelte
import "contour-ds/contour.min.css";
import "contour-ds/contour-wc.esm.js";
```

```svelte
<button class="c-btn c-btn--primary">Compute route</button>
```

### Astro

```astro
---
// src/layouts/Base.astro
import "contour-ds/contour.min.css";
---
<html data-theme="dark">
  <head><title>Contour</title></head>
  <body><slot /></body>
</html>
```

### Plain HTML (no build)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/contour-ds@1.0.0/dist/contour.min.css">
```

Web components are optional: every interactive block (tabs, combobox, tree,
menu, segmented, dialog) works as plain markup with `ds.css` alone, and the
`<contour-*>` elements only add scaffolding and keyboard behaviour.

## Observing component events

Every interactive `<contour-*>` element emits bubbling, composed `contour:*`
CustomEvents, so a host (including one inside a shadow tree) can listen with
plain `addEventListener`. Events carry a `detail` payload; see the §23 event
table in the style guide for the full list.

```js
// Plain JavaScript
const table = document.querySelector("contour-table");
table.addEventListener("contour:page", (e) => {
  console.log("page", e.detail.page);
});
table.addEventListener("contour:sort", (e) => {
  console.log(e.detail.column, e.detail.direction);
});
```

```jsx
// React — attach via a ref (events are not props)
import { useEffect, useRef } from "react";
export function Table() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const handler = (e) => console.log("page", e.detail.page);
    el?.addEventListener("contour:page", handler);
    return () => el?.removeEventListener("contour:page", handler);
  }, []);
  return <contour-table ref={ref} page-size="10" />;
}
```

Because the events are `composed: true`, they cross shadow boundaries: a
`contour-table` nested inside another component's shadow tree still reaches a
listener on `document`.

## Map engine integration

Contour ships the **interface** (controls, panels, readouts, legends) and
deliberately stays out of the map engine's turf: it never imports MapLibre,
Mapbox or Leaflet, never renders GeoJSON, and never projects coordinates.
The engine owns the canvas; Contour owns the chrome around it.

### Wiring recipe

1. Import the engine's stylesheet and Contour's map-chrome sheet for that
   engine:

   ```js
   import "maplibre-gl/dist/maplibre-gl.css";
   import "contour-ds/map-chrome/maplibre";   // re-keys vendor controls onto Contour tokens
   import "contour-ds/contour.min.css";
   ```

2. Create the map in your own code and mount Contour's chrome as siblings of
   the map container (not inside it):

   ```html
   <div class="c-map-slot">
     <div id="map" class="c-map-area"></div>
     <contour-layer-panel items='[{"name":"Roads","visible":true}]'></contour-layer-panel>
     <contour-scale-bar value="1000"></contour-scale-bar>
     <contour-compass bearing="0"></contour-compass>
   </div>
   ```

3. Listen for Contour's `contour:*` events (`contour:layer-visibility`,
   `contour:layer-opacity`, `contour:bearing`, …) and forward them to the
   engine's API (`map.setLayoutProperty`, `map.setBearing`, …). Contour never
   calls the engine; the seam is the event.

The full token-to-vendor mapping lives in `dist/map-chrome-contract.json`.

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
- **203 components** across 14 stylesheets (landing, docs, dashboard, data)
- **294 design tokens** — colours, typography, space, shape, motion, density
- **Web components** — 365 custom elements (`<contour-*>`, `<contour-shadow-*>`) with attribute reactivity
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

## Starter templates

Three complete pages ship in `templates/`, one per surface. They run straight
off a checkout (no build) and are the fastest way to start:

| Template | Surface | What it shows |
|---|---|---|
| `templates/landing.html` | Marketing | Hero split, install block, metrics band, features, pricing, testimonial, FAQ, CTA band |
| `templates/documentation.html` | Docs | Nav tree, breadcrumb, prose, code tabs, install, code block, callout, options table, pager, on-this-page |
| `templates/dashboard.html` | Dashboard | Toolbar, filter pills, KPI row, chart panels with a dash-pattern series, dense sortable table |
| `templates/vite/` | Vite + React | Minimal Vite app importing `contour-ds` from a local checkout |
| `templates/astro/` | Astro | Minimal Astro site with the stylesheet wired into the base layout |

Run any of them:

```bash
python3 -m http.server 8899 --directory /data/projects/DS
# open http://localhost:8899/templates/landing.html
```

Copy the file, delete what you do not need, and point the stylesheet at your
own build:

```html
<link rel="stylesheet" href="/css/contour.css" />
```

## Figma & design tokens

The token layer exports as two DTCG 2025.10 documents, so it round-trips into
design tools:

- `contour-ds/tokens.json` — the **Format** document (primitives, semantic,
  component and utility tokens, with `light-dark()` resolved per theme).
- `contour-ds/themes.json` — the **Resolver** document (the dark half of every
  `light-dark()` pair).

### Tokens Studio (Figma)

1. Install the [Tokens Studio](https://tokens.studio/) plugin in Figma.
2. Create a new token set and choose **Import → DTCG**.
3. Point it at `node_modules/contour-ds/dist/contour.tokens.json` (or the
   published URL).
4. Map the `tidal` / `plasma` / `basalt` families to your Figma variables;
   the semantic layer (`color-primary`, `color-text-muted`, …) is what
   components should reference, not the primitives.

Because the tokens are the source of truth, re-running `node tools/build.mjs`
regenerates both documents and the Figma variables stay in sync.

## shadcn registry

Contour ships a [shadcn](https://ui.shadcn.com/)-compatible registry: one item
per surface bundle, pointing at the shipped CSS rather than inlining it.

```bash
# once the registry is hosted
npx shadcn@latest add https://<host>/r/contour-core.json
```

The registry lives at `dist/registry/registry.json` after a build and is
validated against the vendored shadcn schemas by
`node tools/audit/registry-contract.mjs`. It declares no `homepage` or `url`
while the project is private; those are added at v1.0.

## Integrations

Optional bridges into other toolchains. None are required to use the system.

- **Tailwind v4** — `integrations/tailwind/contour-theme.css` exposes Contour
  tokens as Tailwind utilities (`bg-primary`, `text-muted`, `rounded-md`,
  `font-sans`, …). See `integrations/README.md`.
- **AI assistants** — `integrations/ai/CLAUDE.md`, `integrations/ai/v0-prompt.md`
  and `integrations/ai/v0-prompt.md` teach Cursor / Claude Code / v0 / Bolt /
  Lovable to use Contour correctly. The machine-readable contract they point at
  is `dist/agent-rules.json`.
- **MapLibre / Mapbox** — `contour-ds/map-chrome/maplibre` (or `/mapbox`)
  re-keys the map controls onto Contour tokens. `templates/map.html` is a CSS
  demo of the map chrome; it does not exercise the `contour-map-*` components.
- **Native (iOS / Android / Flutter)** — `integrations/native/` feeds Style
  Dictionary from `contour.tokens.json` so native companions stay in sync.

## Performance

The guide itself loads every component and 4 external scripts (highlight.js from a CDN, `ds.js`, `wc/index.mjs`, `guide.js`); its Lighthouse score is not the system's score.

## Browser support

Sizes are in `rem`; the layout reflows to 200% zoom and to a 390 px viewport
with no horizontal page scroll.

Baseline newly-available features with progressive enhancement. `light-dark()`
is the most load-bearing (newly available 2024-05-13, widely available
2026-11-13). Fallback sheet: `src/css/light-dark-fallback.css`, regenerated
by `node tools/gen-light-dark.mjs --check`.

### What is supported

| Feature | Status | Notes |
|---|---|---|
| `light-dark()` (colour) | Newly available (2024-05) | Fallback sheet ships for older browsers |
| `light-dark()` (images) | Not used | Do not use; widely available only 2029 |
| `oklch()` | Widely available | All colour tokens |
| `:has()` | Widely available | Used for stateful components |
| Container queries | Widely available | Dense tables drop optional columns |
| Anchor positioning | Newly available (2026-01) | Behind `@supports` for tooltips/menus |
| Web components | Widely available | Progressive enhancement only |

### Single-file drop

For environments that must ship exactly one file (email, embedded widget,
offline bundle), build with `node tools/build.mjs --single` to get
`dist/contour.single.min.css` with the self-hosted fonts inlined as data URIs
(~260 kB larger; defeats font caching, so prefer the two-file drop otherwise).

### Reduced motion & forced colours

`prefers-reduced-motion: reduce` collapses every transition, and Forced
Colors Mode removes the texture and ridgelines and falls back to a system
`CanvasText` outline. Both are on by default; no opt-in required.

Full details: [Browser support](index.html#browser-support).

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

MIT for the design system. Fonts (IBM Plex Sans, Mono, Condensed) are licensed
under the SIL Open Font License 1.1 — see `src/css/fonts/OFL.txt`.

### Font attribution

IBM Plex is copyright © 2017 IBM Corp., released under the SIL Open Font
License, Version 1.1, with the Reserved Font Name "Plex". The binaries shipped
in `src/css/fonts/` (and `dist/fonts/` after a build) are unmodified upstream
releases; the OFL text ships beside them as `OFL.txt`. The CSS `font-family`
names (`Contour Plex Sans`, `Contour Plex Mono`, `Contour Plex Sans Condensed`)
are aliases only and do not rename the font software.

---

Full reference: [style guide](index.html) · [CHANGELOG](CHANGELOG.md) · [DESIGN.md](DESIGN.md)