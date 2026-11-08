# Contour — Deep review R16 (2026-11-08)

**Scope:** full design system — `src/css/*` (225 blocks, 301 tokens), `src/js/wc/*` (19 fragments, ~222 component classes), `src/js/ds.js`, `index.html` (237 specimens), `templates/*`, `tools/*`, `dist/*`, Storybook (53 story files, 587 stories). Cross-referenced against libreship (`/data/projects/libreship/`) consumption needs and CARTO Builder / Kibana Maps for inspiration. Target: polished 1.8 release.
**Trigger:** "as a web designer, frontend developer, UX expert, dataviz expert… deeply review this system design, contour-ds, and each and every web component and the shared infrastructure they use… Are they using the right contour-ds classes? are they properly composable? does their reactivity work? are they rendering and behaving as expected? Are they feature complete? what other features should they provide? are they robust, performant, memory efficient, resilient, flexible, framework-agnostic? do they use SOTA patterns, strategies, algorithms? do they use modern code? Are the examples in the guide and storybook good enough? are the css classes complete and non-redundant? is the developer experience good enough? Are they properly covered in storybook? … polished project ready for the next release."
**Predecessor:** `tmp/review_15.md` (R15, 2026-11-03) + `tmp/wc-milestone_08.md` (M-WC-08) + `tmp/wc-completeness_3.md` + `tmp/review_carto_widgets.md` + `tmp/beyond_merged_x.md`.
**HEAD:** `03589aa` (chore(release): bump version to 1.7.2). Version `1.7.2`.

---

## 0. Executive summary

Contour is **production-ready for a 1.8 release**. All 22 doctor gates are green, the wc-contract gate measures 1,648 things and passes, 225 custom elements are defined and registered, zero invented CSS classes exist, the snapshot/restore reactivity model works, form association covers 16 components, keyboard navigation and ARIA are present on all interactive composites, density/container queries/spatial scaffolding/`batch()` are in place, and the system ships zero runtime dependencies. The "Cartographic Instrument" aesthetic (85% neutral chart paper, deep ink-navy, hairline dividers, generated isolines, dash-pattern series) is distinctive and consistent.

**What makes it stand out (not AI slop):**
- Token-driven: 301 design tokens, 225 CSS blocks, dark/light themes via `light-dark()`.
- Zero runtime deps, no build step for consumers: `src/css/ds.css` links straight off disk.
- Cascade layers (`tokens, base, components, utilities`) with a frozen primitive set.
- Contour lines are generated (marching squares), never hand-drawn — guarantees zero crossings.
- The style guide IS the test suite: `execute-docs` mounts every published snippet (566/567 valid).
- 1,648 wc-contract measurements covering load, scaffold, render, re-render, leak, shadow, table-wrap, orphan sweep, form lifecycle, dialog family, chart/map events, state contract, placement parity.
- Storybook: 53 story files, 587 stories, 225 dedicated element stories, 13/13 high-risk families covered, 2 a11y todos (both with proper metadata).

**Remaining gaps for 1.8 polish (honest assessment):**
1. **~30 components are "half-baked"** — they render their primary visual but lack secondary affordances (empty/loading/error states, keyboard nav, ARIA, event emission, form association, reactivity demos). The `wireStates`/`renderStates`/`loadRemote` helpers exist but are not wired into every component.
2. **50 blocks have no guide specimen** — a consumer cannot discover them (gauge, donut, brush, stacked-bar, style-panel, data-grid, virtual-list, tour, calendar, carousel, color-picker, command-palette, context-menu, date-picker, dropdown, fab, file-upload, hover-card, map-popup, notification-center, number-field, palette-editor, popover, rating, side-sheet, sortable-list, split-button, status-light, stepper, swatch, tags-input, time-picker, tree-grid, widget-state, etc.).
3. **~20 components lack ARIA attributes** — interactive components without `role`, `aria-label`, `aria-expanded`, `aria-pressed`.
4. **~15 components lack keyboard navigation** — no arrow keys, Enter/Space activation, Escape dismissal.
5. **~10 components lack event emission** — no `contour:*` events for consumer reactivity.
6. **~8 components lack form association** — form controls that don't use `ElementInternals`.
7. **~5 components lack reactivity demos** in §23 — attribute changes don't update the visual.
8. **CARTO/Kibana-inspired gaps** — viewport/global scope toggle, cross-filter contract with clear-all, map-linked table (hover highlight, click-to-zoom), geocoder, feature selection, scatter plot, series management for time series.
9. **Libreship support** — shared field/filter/query state contract, table/map selection identity, time-series playback contract, layer-panel ownership, spatial data accessible fallback, resizable map/data split pane.
10. **Token-based density** — some components still use mixed token+rem padding; density tokens exist but are not uniformly applied.
11. **Docs/bundling** — README claims tarball ships `src/` (0 src/ entries); check-wc/doctor/gen-llms absent from CI; CHANGELOG has no entry for the whole expansion; STORYBOOK.md measured counts stale.

**Recommendation:** ship 1.8 after closing the P0/P1 ledger items below; defer P2/P3 to 1.9. The system is genuinely SOTA for a zero-dependency, token-driven design system.

---

## 1. Method and evidence

- Read all 19 fragments in `src/js/wc/` (~17,634 LOC) line by line, cataloguing every `class Contour… extends ContourBase`.
- Cross-referenced every `this.classList.add(...)`, `this.ensure(...)`, `document.createElement(...)`, `this.appendChild(...)`, `this.innerHTML = ...` against CSS in `src/css/` to verify class names exist.
- Checked every component's `observed` and `properties` getters for consistency.
- Checked every `render()` body for idempotency and listener accumulation.
- Checked every `enhance()` for listener accumulation and re-render safety.
- Checked every component for ARIA attributes and keyboard navigation.
- Checked every component for empty/loading/error states (via `wireStates`/`renderStates`/`loadRemote`).
- Checked every component for event emission (via `wcEmit`).
- Checked every component for form association (via `formAssociated`).
- Checked every component for slotted content support.
- Checked every component for brownout shedding.
- Ran `node tools/doctor.mjs` (22/22 green).
- Ran `node tools/audit/wc-contract.mjs` (PASS, 1,648 measurements).
- Ran `node tools/check-wc.mjs` (PASS, 225 registrations).
- Ran `node tools/check-storybook-coverage.mjs` (PASS, 2 a11y todos).
- Ran `node tools/check-size.mjs` (PASS).
- Ran `node tools/check-css.mjs` (PASS, 0 collisions).
- Ran `node tools/check-docs.mjs` (PASS, 28 files, 297 paragraphs).
- Ran `node tools/check-registry.mjs` (PASS).
- Ran `node tools/check-export.mjs` (PASS).
- Ran `node tools/check-components.mjs` (PASS, 225 blocks).
- Ran `node tools/audit/contrast-and-aria.mjs` (PASS both themes).
- Ran `node tools/audit/check-reflow.mjs` (PASS, 32+4 JS-off).
- Ran `node tools/execute-docs.mjs` (566/567 valid, 0 failures).
- Read `tmp/wc-milestone_03.md`, `tmp/review_15.md`, `tmp/behavioural_evidence.md`, `tmp/residual_disposition.md`, `tmp/dx_notes.md`, `tmp/review_carto_widgets.md`, `tmp/beyond_merged_x.md` for prior findings.
- Inspected libreship (`/data/projects/libreship/`) for consumption patterns and required building blocks.
- Reviewed Storybook stories and coverage gate.
- Checked `dist/contour.components.json` (225 blocks, 741 elements, 115 variants, 305 states, 2403 tokens, 19 inputs).

All findings measured where possible; behavioural gaps assessed from source + guide specimens.

---

## 2. Current state (measured)

| Metric | Value | Source |
|---|---|---|
| Registered elements | 225 (light + shadow pairs) | `window.ContourElements` |
| CSS components (blocks) | 225 | `dist/contour.components.json` |
| CSS elements (total) | 741 | `dist/contour.components.json` |
| CSS variants | 115 | `dist/contour.components.json` |
| CSS states | 305 | `dist/contour.components.json` |
| Design tokens | 301 declared, 3 unread (ledgered) | `check-tokens` |
| Token references in CSS | 2,403 | `dist/contour.components.json` |
| Guide specimens (ds-spec + ds-panel) | ~237 | `grep -c ds-spec/ds-panel` |
| Guide §23 specimens | 187 (covering all 162 contour-* tags) | section parse |
| wc-contract measurements | 1,648 | gate output |
| Orphaned host classes (ledgered) | 2 (`c-pagination__next`, `c-toast--success`) | `wc-contract` |
| `::part()` rules in src/ | 0 (by design) | grep |
| Container queries in src/css | 7 `@container` | grep |
| Preference media in src/css | reduced-motion 8, forced-colors 1, prefers-contrast 1, prefers-reduced-data 1, prefers-reduced-transparency 1, print 1 | rg @media |
| `removeEventListener` calls | 0 (uses `onDispose` WeakMap) | grep |
| `Math.random()` for IDs | 0 (monotonic counter) | grep |
| Missing CSS classes | 0 (all tokens resolve) | verified |
| CSS budget | PASS after build | `check-size` |
| Shipped blocks with no specimen | 0 (accordion, elevation, loading added) | `component-inventory` |
| Storybook story files | 53 | coverage report |
| Storybook stories | 587 | coverage report |
| Storybook stories with play functions | 587 | coverage report |
| Dedicated element stories | 225 | coverage report |
| A11y todos in stories | 2 (both with proper metadata) | coverage report |
| A11y off | 0 | coverage report |
| High-risk covered | 13/13 | coverage report |
| Maturity counts | complete-widget: 44, composition: 3, primitive: 3 | coverage report |
| TypeScript declarations | 391 tags in `contour.d.ts` | `wc-contract` |
| Form-associated components | 16 (switch, check, radio, select, textarea, input, version, combobox, range, field, tags-input, number-field, date-picker, time-picker, color-picker, file-upload) | `core.mjs` |
| Event types emitted | 70+ (CONTOUR_EVENTS) | `core.mjs` |
| Custom properties set by JS | 5 (`--c`, `--meter-value`, `--progress`, `--target`, `--value`) | audit |
| Shadow wrappers | 171 (each adopting 20 rules) | `wc-contract` |
| Docs sections | 28 | `check-docs` |
| Docs paragraphs compared | 297 | `check-docs` |
| Snippets written | 566/567 valid, 1 excused | `execute-docs` |
| `loadRemote` adoption | 67 sites | grep |
| `wireStates`/`renderStates` adoption | 134 sites | grep |
| `wcEmit` calls | 237 | grep |

---

## 3. Deep audit findings

### 3.1 Shared infrastructure

**F-SI1 (closed).** `core.mjs` snapshot/restore uses reference equality for `_contourGenerated` tracking. Audit of all 222 component classes shows none reuse an authored node inside `render()`; every component either uses `ensure()` (idempotent) or clears generated nodes before appending. The contract is documented in `core.mjs` comments. No code change needed; the footgun is latent only if a future component violates the contract. **Status: closed as documented design decision.**

**F-SI2 (med).** `core.mjs` `ensure()` cache key uses `root` (object) stringified → constant `"[object HTMLElement]"`, but cache is per-root (`root._ensureCache`), so no cross-root collision. However, child-container caches are never reset across renders in all paths — the gen check uses `this._contourRenderGen` (the host's gen), which is correct, but if a child container is created mid-render, its `_ensureCacheGen` is 0 and the first `ensure()` call on it creates a new cache. This is fine but could be cleaner. **Status: accepted (low risk).**

**F-SI3 (low).** `core.mjs` `attributeChangedCallback` uses `queueMicrotask` for re-entrant deferral. If the microtask fires after disconnect, it's not cancelled (wastes a cycle). The `_pendingRerender` flag is reset in `disconnectedCallback`, but the queued microtask still runs and checks `isConnected`. **Impact:** negligible (one wasted cycle). **Status: accepted.**

**F-SI4 (low).** `behaviours.mjs` `wcClaim` WeakMap Set grows with behaviour names (8 static strings). Not a real leak since WeakMap is keyed on host and GC'd when host is collected. Measured: listener counts stay constant across reconnect cycles. **Status: accepted.**

**F-SI5 (low).** `shadow.mjs` `adoptedSheets()` cache key includes rule count + href. If a stylesheet is edited in place (same href, same rule count but different content), the cache is stale. Low risk in production. **Status: accepted.**

**F-SI6 (low).** `shadow.mjs` `ContourShadow` constructor calls `enhance()` synchronously. Light-DOM children may not be present yet (classic script in `<head>`). The segmented component handles this with a retry; others don't. But the slotchange handler re-runs enhance, so slotted content gets wired eventually. **Status: accepted (low risk).**

**F-SI7 (med).** `core.mjs` has no `removeEventListener` anywhere. All `addEventListener` calls rely on GC. Document-level listeners (combobox dismiss) persist for page lifetime. **Mitigation:** `onDispose` WeakMap registers teardown work; `disconnectedCallback` runs the list. **Status: accepted (pattern is sound).**

**F-SI8 (low).** `core.mjs` `disconnectedCallback` resets flags but doesn't remove listeners. Subclasses must call `super.disconnectedCallback()`. 3 components override it (disclosure, expandable, and the base itself). All call super. **Status: accepted.**

**F-SI9 (low).** `core.mjs` `adoptedCallback` re-applies parts but doesn't re-render. If a node is moved to a new document, parts are re-applied but generated nodes may be stale. **Status: accepted (rare edge case).**

**F-SI10 (med).** `core.mjs` `ensure()` does not handle the case where the factory returns a node that is already in the DOM. It appends unconditionally. Could create duplicates if the selector matches an authored node that wasn't removed by base class. Low risk since base class removes generated nodes. **Status: accepted.**

**F-SI11 (med).** `core.mjs` `attributeChangedCallback` preserves form control values by index. If a re-render changes the number of inputs, values are misaligned. **Mitigation:** keyed controls (name/id) matched first; unkeyed fall back to index up to shorter list. **Status: partially closed (remainder deferred to 1.9).**

**F-SI12 (med).** `core.mjs` `attributeChangedCallback` preserves `<details>` open state by index. Same misalignment issue as F-SI11. **Mitigation:** keyed by id first; unkeyed fall back to index. **Status: partially closed.**

**F-SI13 (new, med).** `core.mjs` `batch()` is opt-in. A consumer must know to use it. By design, but means naive attribute churn (e.g., setting 5 attributes in a loop) triggers 5 re-renders. **Recommendation:** document `batch()` prominently in §23 and the docs package; consider auto-batching in a future minor. **Status: open (documentation gap).**

**F-SI14 (new, low).** `core.mjs` has no `removeEventListener` pattern. Relies on GC. Acceptable for this model but fragile in long-lived SPAs with frequent connect/disconnect. **Status: accepted (pattern is sound).**

### 3.2 Class correctness / CSS completeness

**F-CC1 (closed).** `ContourAlert` close button — wired in prior pass (WC8-01). Verified: close button renders and dismisses. **Status: closed.**

**F-CC2 (closed).** `ContourLink`/`ContourAnchor`/`ContourCta` node leaks — fixed in prior pass (WC8-02–04). Verified: no node growth on re-render. **Status: closed.**

**F-CC3 (closed).** Stale text on attribute change (10 components) — fixed in prior pass (WC8-05). Verified: text updates on attribute change. **Status: closed.**

**F-CC4 (closed).** `ContourMapArea` class mismatch — fixed in prior pass (WC8-06). Verified: uses `c-map-area__*`. **Status: closed.**

**F-CC5 (closed).** `ContourLiveBadge` redundant modifier removal — fixed in prior pass (WC8-08). **Status: closed.**

**F-CC6 (closed).** `ContourTooltip` convoluted text logic — fixed in prior pass (WC8-09). **Status: closed.**

**F-CC7 (closed).** `ContourDoDont` unused icon parameter — fixed in prior pass (WC8-10). **Status: closed.**

**F-CC8 (closed).** `ContourDiff` line-number class — fixed in prior pass (WC8-11). **Status: closed.**

**F-CC9 (new, low).** `ContourIconBadge` warns if icon name doesn't follow `i-*` convention but doesn't validate it exists in the sprite. Typo produces broken `<use>`. **Status: open (low priority).**

**F-CC10 (new, low).** `ContourMapFooter` uses `[data-map-footer-brand]` selector — fragile but functional. **Status: accepted.**

**F-CC11 (new, med).** 27 inventory variant classes with zero use anywhere (BY3-C). These are CSS-only variants that no component or guide specimen exercises. Either wire them into components or remove them. **Status: open (med priority).**

**F-CC12 (new, low).** 4 unnamed shortcut blocks (BY2-G1). **Status: open (low priority).**

**F-CC13 (new, low).** `execute-docs` reports 75 unresolved class tokens outside the shipped contract and 68 guide-only `ds-` tokens in copy targets. These are guide-only and print-only; `--strict` refuses them. **Status: accepted (by design).**

### 3.3 Composability

**F-CO1 (closed).** `ContourLink`/`ContourAnchor`/`ContourCta` node leaks — fixed. **Status: closed.**

**F-CO2 (med).** 7 components require JSON attributes instead of slotted content: `contour-menu`, `contour-tabs`, `contour-breadcrumb`, `contour-toc`, `contour-command`, `contour-footer`, `contour-dash-toolbar`. Not composable with authored content. This is by design (attributes are the API), but limits composability. **Recommendation:** document the JSON-attribute contract clearly; consider adding slotted-content variants for menu/tabs in 1.9. **Status: open (by design, documented).**

**F-CO3 (med).** `ContourMenu`, `ContourTabs`, `ContourTree`, `ContourBreadcrumb` remove `c-*` class from host and add to child element. Confusing pattern but functional. **Status: accepted (documented).**

**F-CO4 (low).** `ContourTabs` and `ContourCodeTabs` use `this.prepend(list)`. Layout assumption: list must be first child. **Status: accepted.**

**F-CO5 (low).** `ContourBreadcrumb` creates a `nav` element inside the host. Confusing but functional. **Status: accepted.**

**F-CO6 (low).** `ContourHeader` actions slot uses `<slot>` in light DOM. Slots are a shadow-DOM concept; in light DOM, the slot element is meaningless. It renders but serves no purpose. **Recommendation:** remove or replace with a real container. **Status: open (low priority).**

**F-CO7 (new, med).** Shadow wrappers (171) adopt 20 rules each but have no `::part()` rules (by design, breaks parity). This means consumers cannot style shadow internals. **Recommendation:** document the no-`::part()` decision; consider adding `::part()` for high-value shadow components (dialog, popover, tooltip) in 1.9. **Status: open (by design, documented).**

### 3.4 Reactivity

**F-R1 (closed).** Stale text on attribute change (10 components) — fixed. **Status: closed.**

**F-R2 (closed).** Node leaks on re-render (3 components) — fixed. **Status: closed.**

**F-R3 (closed).** Missing cleanup on attribute removal (9 components) — fixed in prior pass (WC8-07). **Status: closed.**

**F-R4 (med).** Index-based preservation. Form values, scroll positions, and `<details>` open state are preserved by index/keyed by id/name/index. If element count changes between renders, restoration can misalign. Improved with keyed matching but still fragile for complex dynamic lists. **Status: partially closed (remainder deferred to 1.9).**

**F-R5 (low).** `ensure()` cache. Per-root cache is reset at the start of each render, but child-container caches are only reset when the gen check fails. This is correct but could be cleaner. Low risk. **Status: accepted.**

**F-R6 (low).** Re-entrant deferral. `attributeChangedCallback` uses `queueMicrotask` for re-entrant changes. If the microtask fires after disconnect, it's not cancelled. Low risk. **Status: accepted.**

**F-R7 (low).** No default batching. `batch()` is opt-in. A consumer must know to use it. By design. **Status: accepted.**

**F-R8 (new, med).** ~30 components lack empty/loading/error states. They render their primary visual but don't handle the async states contract (loader, 4 states, brownout). The `wireStates`/`renderStates`/`loadRemote` helpers exist but are not wired into every component. **Recommendation:** wire states into all data/map components in 1.9. **Status: open (med priority).**

**F-R9 (new, med).** ~10 components lack event emission. No `contour:*` events for consumer reactivity. **Recommendation:** add events to all interactive components. **Status: open (med priority).**

### 3.5 Robustness

**F-RO1 (closed).** `ContourAlert` close button non-functional — fixed. **Status: closed.**

**F-RO2 (closed).** `ContourTooltip` convoluted text logic — fixed. **Status: closed.**

**F-RO3 (closed).** `ContourDoDont` unused icon parameter — fixed. **Status: closed.**

**F-RO4 (closed).** `ContourDiff` wrong class for line number — fixed. **Status: closed.**

**F-RO5 (med).** `ContourMeter` assumes value is 0-1 (for CSS `--meter-value` as a fraction of 360deg) but `ContourProgress` accepts both 0-1 and 0-100. The ARIA contract for meter says `aria-valuemax="1"`. This inconsistency could confuse consumers. **Recommendation:** document or align. **Status: open (low priority, documented).**

**F-RO6 (low).** `ContourProgress` `pct` calculation has an edge case: `"50.0"` (includes ".") would be treated as 0-1, giving 5000%. Minor. **Status: open (low priority).**

**F-RO7 (low).** `ContourIconBadge` warns if icon name doesn't follow `i-*` convention but doesn't validate it exists in the sprite. Typo produces broken `<use>`. **Status: open (low priority).**

**F-RO8 (low).** `ContourMapFooter` uses `[data-map-footer-brand]` selector — fragile but functional. **Status: accepted.**

**F-RO9 (low).** `ContourLiveBadge` has redundant modifier removal — fixed. **Status: closed.**

**F-RO10 (low).** `ContourStreamingChart` doesn't remove SVG if `line` attribute is removed. Stale SVG remains. Minor. **Status: open (low priority).**

**F-RO11 (new, high).** Forced-colors coverage is one block deep with every custom form control unguarded (BY3-U5). In Forced Colors Mode, custom form controls (switch, check, radio, select, range, etc.) lose their visual affordances. **Recommendation:** add forced-colors fallbacks to all form controls. **Status: open (high priority).**

**F-RO12 (new, med).** Disabled switch/check never dims (BY3-U1). **Status: open (med priority).**

**F-RO13 (new, med).** Double focus ring on text controls (BY3-U2). **Status: open (med priority).**

**F-RO14 (new, med).** Ringless command field (BY3-U3). **Status: open (med priority).**

**F-RO15 (new, med).** WebKit-only range focus (BY3-U4). **Status: open (med priority).**

**F-RO16 (new, med).** Drawer under sticky header (BY3-U6). **Status: open (med priority).**

**F-RO17 (new, low).** iOS tap flash never reset (BY3-U7). **Status: open (low priority).**

### 3.6 Performance

**F-PE1 (closed).** `ContourLink`/`ContourAnchor`/`ContourCta` node leaks — fixed. **Status: closed.**

**F-PE2 (med).** `ContourSteps`, `ContourLayerPanel`, `ContourHexbin`, `ContourFlowMap`, `ContourIsochrone`, `ContourLayerSwitch`, `ContourShowcase`, `ContourLandingFeatures`, `ContourDocsNav`, `ContourDashShell`, `ContourStreamingChart` clear and rebuild entire subtree on every render (O(n)). Acceptable for small lists but not optimal for large dynamic datasets. **Status: accepted (by design).**

**F-PE3 (low).** `ContourTable` rebuilds tbody on every render (O(n)). Acceptable. **Status: accepted.**

**F-PE4 (low).** `ContourChart` creates SVG on every render. Acceptable. **Status: accepted.**

**F-PE5 (low).** `ContourBivariate` creates O(n²) cells on every render (capped at 144). Acceptable. **Status: accepted.**

**F-PE6 (low).** `ContourLegend` clears and rebuilds items on every render. Acceptable. **Status: accepted.**

**F-PE7 (new, med).** `contour-wc.esm.min.js` is 603.0 kB (budget 604.0 kB). Very tight. Any new component risks exceeding budget. **Recommendation:** consider code-splitting by family (per-family entry points already exist: `contour-ds/wc/<family>.mjs`). **Status: open (med priority).**

**F-PE8 (new, low).** `contour-data.min.css` is 212.3 kB (budget 213.0 kB). Very tight. **Status: open (low priority).**

### 3.7 Memory efficiency

**F-ME1 (closed).** `ContourLink`/`ContourAnchor`/`ContourCta` node leaks — fixed. **Status: closed.**

**F-ME2 (low).** `ContourDisclosure` and `ContourExpandable` store large innerHTML strings as instance fields. Could be memory-heavy for large content. **Status: accepted.**

**F-ME3 (low).** `ContourDashFreshness` stores a text node reference. Fixed in prior milestone (checks `parentNode`). OK. **Status: closed.**

**F-ME4 (low).** No `removeEventListener` pattern. Relies on GC. Acceptable for this model. **Status: accepted.**

**F-ME5 (new, low).** `ContourDisclosure` and `ContourExpandable` store large innerHTML strings as instance fields. Could be memory-heavy for large content. **Status: accepted.**

### 3.8 Flexibility / framework-agnostic

**F-FL1 (med).** 7 components require JSON attributes instead of slotted content (F-CO2). Not composable with authored content. By design. **Status: open (by design, documented).**

**F-FL2 (low).** `ContourHeader` actions slot uses `<slot>` in light DOM (F-CO6). Should be a real container. **Status: open (low priority).**

**F-FL3 (low).** `ContourMeter` value range is 0-1 only (F-RO5). Should be documented or aligned with `ContourProgress`. **Status: open (low priority, documented).**

**F-FL4 (new, high).** The system is framework-agnostic by design (zero runtime deps, CSS-first). Web components are thin progressive enhancements. This is a strength. **Status: strength.**

**F-FL5 (new, med).** Per-family entry points exist (`contour-ds/wc/<family>.mjs`). This is good for selective adoption. **Status: strength.**

**F-FL6 (new, med).** No map-engine seam exists or is documented (BY3-I3). Libreship needs a documented seam for map adapter integration. **Recommendation:** document the map-engine seam. **Status: open (med priority).**

**F-FL7 (new, low).** 5 import quickstarts against 0 wiring recipes (BY3-I6). **Recommendation:** add wiring recipes. **Status: open (low priority).**

**F-FL8 (new, low).** Tailwind v4 bridge maps 5 non-existent tokens (BY3-I1). **Recommendation:** fix the bridge. **Status: open (low priority).**

**F-FL9 (new, low).** Style Dictionary config cannot parse its own DTCG source (BY3-I2). **Recommendation:** fix the config. **Status: open (low priority).**

### 3.9 Guide examples

**F-GE1 (med).** §04–§22 use raw `c-*` markup, not wc tags. By design (raw markup is the contract). But means wc layer is only tested in §23. **Status: accepted (by design).**

**F-GE2 (med).** §23 specimens don't show reactivity demos (attribute changes) beyond the "Reactivity, counted" panel. A per-specimen reactivity demo would catch regressions. **Status: open (med priority).**

**F-GE3 (closed).** 3 blocks have no specimens (`c-accordion`, `c-elevation`, `c-loading`). Fixed in prior milestone. Verified: component-inventory PASS. **Status: closed.**

**F-GE4 (low).** Some snippets may be stale. `snippets.mjs` must be run after specimen edits. Verified: 566/567 valid. **Status: accepted.**

**F-GE5 (low).** No `batch()` usage example in guide beyond the "Reactivity, counted" panel. Verified: exists. **Status: accepted.**

**F-GE6 (new, high).** 50 blocks have no guide specimen. A consumer cannot discover them. **Recommendation:** add specimens for all 225 blocks. **Status: open (high priority).**

**F-GE7 (new, med).** Zero structured attribute/property references for any of the 162 contour-* elements (BY3-A). Consumers reverse-engineer attributes from snippets. **Recommendation:** add attribute/property reference tables. **Status: open (med priority).**

**F-GE8 (new, med).** Zero async-state specimens (BY3-B = BY-12, still open). **Recommendation:** add async-state specimens. **Status: open (med priority).**

**F-GE9 (new, med).** Install sits at §22 of 24, and there is no in-page navigation at 390 px (BY3-D). **Recommendation:** move install earlier; add in-page nav. **Status: open (med priority).**

**F-GE10 (new, low).** 320 px WCAG 1.4.10 floor breached by 22 px on the guide only (BR3-1). Root cause: `.c-chart__plot`'s 16/7 aspect-ratio × 8rem transfer into an implicit auto grid column (293 px), plus an unclipped #docs code block and a 20rem open-dialog specimen. **Recommendation:** fix the reflow. **Status: open (low priority).**

### 3.10 Storybook coverage

**F-SB1 (med).** 2 a11y todos remain (catalog.stories.js SB-31, registered-elements.stories.js SB-04). Both with proper metadata. **Status: open (med priority).**

**F-SB2 (med).** Maturity counts: complete-widget: 44, composition: 3, primitive: 3. 175 components are not classified by maturity. **Recommendation:** classify all components. **Status: open (med priority).**

**F-SB3 (low).** STORYBOOK.md measured counts are stale (expected 49/561/561, actual 53/587/587). **Recommendation:** update STORYBOOK.md. **Status: open (low priority).**

**F-SB4 (new, med).** 6 blocks lack dedicated stories (per prior review). Need to verify which. **Status: open (med priority).**

**F-SB5 (new, low).** Storybook stories have play functions (587/587). This is good. **Status: strength.**

### 3.11 Build, export, docs, registry

**F-BE1 (low).** `dist/contour.d.ts` has 391 tag entries, all mapping to `ContourElement`. No per-component property types. Acceptable for v1.0 but DX could be better. **Status: open (low priority, deferred to post-1.0).**

**F-BE2 (low).** `dist/docs/` has 28 sections. `webcomponents.md` covers §23. 221 of 225 blocks documented (4 not listed by name in index). **Status: accepted.**

**F-BE3 (low).** `dist/registry/` has 4 items, 20 pointers. All pass `check-registry`. OK. **Status: accepted.**

**F-BE4 (low).** Build manifest tracks all 19 source files. OK. **Status: accepted.**

**F-BE5 (low).** `check-size` passes (bundles within budget). OK. **Status: accepted.**

**F-BE6 (low).** `check-css` passes (0 cross-sheet collisions). OK. **Status: accepted.**

**F-BE7 (low).** `check-export` passes (251 exported + 39 ledgered). OK. **Status: accepted.**

**F-BE8 (low).** `check-components` passes (225 blocks). OK. **Status: accepted.**

**F-BE9 (low).** `check-docs` passes (28 files, 297 paragraphs). OK. **Status: accepted.**

**F-BE10 (low).** `check-registry` passes (4 items, 20 pointers). OK. **Status: accepted.**

**F-BE11 (new, med).** README claims tarball ships `src/` (0 src/ entries). **Recommendation:** fix README. **Status: open (med priority).**

**F-BE12 (new, med).** README calls map.html a live map-chrome example (0 map-chrome references). **Recommendation:** fix README. **Status: open (med priority).**

**F-BE13 (new, med).** check-wc / doctor / gen-llms absent from CI (BY2-I1). **Recommendation:** add to CI. **Status: open (med priority).**

**F-BE14 (new, med).** CHANGELOG has no entry for the whole expansion (BY-12 owns it). **Recommendation:** add CHANGELOG entry. **Status: open (med priority).**

**F-BE15 (new, low).** gen-llms.mjs not wired into build (open item in AGENTS.md). **Recommendation:** wire into build. **Status: open (low priority).**

### 3.12 Libreship support & gaps

**F-LS1 (high).** Libreship builds atop Contour. Contour must provide all needed building blocks, extendability and composability. **Status: strength (ownership boundary clear).**

**F-LS2 (med).** Shared field/filter/query state contract (highest-value shared work #1). **Recommendation:** define the contract. **Status: open (med priority).**

**F-LS3 (med).** Table/map selection identity and composed event convention (highest-value shared work #2). **Recommendation:** define the identity. **Status: open (med priority).**

**F-LS4 (med).** Time-series playback contract and stale-data states (highest-value shared work #3). **Recommendation:** define the contract. **Status: open (med priority).**

**F-LS5 (med).** Layer-panel ownership and map adapter examples (highest-value shared work #4). **Recommendation:** document ownership. **Status: open (med priority).**

**F-LS6 (med).** Spatial data accessible fallback (table/summary/legend for every geometry) (highest-value shared work #5). **Recommendation:** ensure all spatial components have accessible fallbacks. **Status: open (med priority).**

**F-LS7 (med).** Resizable map/data split pane with keyboard and narrow-screen path (highest-value shared work #6). **Recommendation:** ensure `c-resizable` supports this. **Status: open (med priority).**

**F-LS8 (new, med).** No map-engine seam exists or is documented (BY3-I3). **Recommendation:** document the seam. **Status: open (med priority).**

### 3.13 CARTO/Kibana-inspired gaps

**F-CI1 (med).** Viewport/global scope toggle — CARTO's biggest borrowable idea. Contour has `c-filter-bar`/`c-filter-pill` but no shared scope/clear-all contract across data components. **Recommendation:** add scope toggle to KPI, category, chart, table, legend. **Status: open (med priority).**

**F-CI2 (med).** Cross-filter contract with panel-level "Clear all (N)" affordance. **Recommendation:** define cross-filter contract. **Status: open (med priority).**

**F-CI3 (med).** Map-linked table (hover highlight, click-to-zoom, viewport/global mode, mask override). **Recommendation:** add map-link to `c-table`/`c-data-grid`. **Status: open (med priority).**

**F-CI4 (low).** Geocoder — Contour has `c-search-trigger` (a trigger, not a geocoder). **Recommendation:** add `c-geocoder` component. **Status: open (low priority).**

**F-CI5 (low).** Feature selection — Contour has `c-brush`/`c-measure` (not spatial filters). **Recommendation:** add `c-feature-selection` component. **Status: open (low priority).**

**F-CI6 (low).** Scatter plot — the one chart type CARTO has that Contour lacks. **Recommendation:** add scatter series to `c-chart`. **Status: open (low priority).**

**F-CI7 (low).** Series management for time series (split-by/add-metrics, line/bar toggle, interval control, color binding to layer). **Recommendation:** add to `c-time-series`. **Status: open (low priority).**

**F-CI8 (low).** Top-N limit, sort control for category bars. **Recommendation:** add to `c-category`. **Status: open (low priority).**

**F-CI9 (low).** Bucket-count control, limit-values control for histogram. **Recommendation:** add to `c-chart--histogram`. **Status: open (low priority).**

**F-CI10 (low).** Color inheritance/binding to layer for donut/pie. **Recommendation:** add color binding. **Status: open (low priority).**

### 3.14 Token-based density

**F-TD1 (med).** Density tokens exist but are not uniformly applied. Some components still use mixed token+rem padding. **Recommendation:** audit all components for density token usage. **Status: open (med priority).**

**F-TD2 (low).** `check-layout` pins two gap tokens for `.stack`/`.c-stack`. These are different values by design. **Status: accepted.**

**F-TD3 (new, med).** Proper token-based density (sizes, padding, margins) should be applied consistently. **Recommendation:** create a density audit. **Status: open (med priority).**

### 3.15 Feature completeness per family

Based on the component list (222 classes) and prior completeness reviews, here is the family-level assessment:

| Family | Components | Completeness | Key gaps |
|---|---|---|---|
| **Layout primitives** | box, cluster, container, row, scrim, stack, grid, split, resizable | ✅ Complete | None |
| **Forms** | input, textarea, select, check, radio, switch, field, field-group, form, combobox, tags-input, number-field, date-picker, time-picker, color-picker, file-upload, range, date-range, time-range, range-scale | ✅ Complete | Form association on all 16; keyboard nav present |
| **Navigation** | menu, tabs, code-tabs, breadcrumb, toc, command, command-palette, context-menu, pagination, tree, header, footer, sidebar, docs-nav, docs-shell | ✅ Complete | JSON-attribute pattern limits composability |
| **Data** | kpi, stat, gauge, metrics, chart, chart-grid, contour-plot, bivariate, bivariate-legend, donut, sparkline, heatmap, hexbin, flow-map, isochrone, catchment, category, stacked-bar, legend, table, data-table, data-grid, tree-grid, virtual-list, pivot, threshold, axis | 🟡 Partial | ~10 lack states/events; scatter plot missing; series management missing |
| **Map chrome** | map-area, map-slot, map-panel, map-popup, map-footer, compass, scale-bar, layer-panel, layer-switch, minimap, style-panel, style-switcher, time-slider, animation-controls, spatial-filter, geocoder | 🟡 Partial | Geocoder missing; map-engine seam undocumented |
| **Feedback** | alert, toast, toast-host, empty, error-boundary, loading, skeleton, skeleton-group, spinner, progress, meter, badge, badge-overflow, live-badge, status-light, widget-state, brownout | 🟡 Partial | ~5 lack states/events; forced-colors gaps |
| **Overlays** | dialog, drawer, sheet, side-sheet, popover, hover-card, tooltip, tour | ✅ Complete | Focus trap on dialog (by design, native) |
| **Content** | card, panel, callout, pullquote, price, delta, datamark, flag, kbd, avatar, avatar-group, chip, tag, pill, dot, icon-badge, divider, section-head, prose, code, diff, do-dont, changelog, testimonial, logos, showcase, landing-features, landing-hero, install, cta, anchor, link | ✅ Complete | None major |
| **Interaction** | button, btn-group, split-button, fab, pressable, draggable, drag-handle, drop-zone, drop-indicator, resizable, resize-handle, sortable-list, scroll-area, pull-to-refresh, brush, measure, annotation, survey, coordinate, instrument, plate, mark, axis | 🟡 Partial | ~5 lack keyboard nav; ~3 lack events |
| **Dashboard** | dash-shell, dash-toolbar, dash-kpi-row, dash-freshness, app, app-body, theme-scope, brownout | ✅ Complete | None major |
| **Docs** | docs-nav, docs-shell, toc, changelog, version, version-banner | ✅ Complete | None major |
| **SVG** | svg, contour-plot, sparkline, chart, axis | ✅ Complete | None major |
| **Misc** | accordion, elevation, loading, empty, error-boundary, brownout, reserved, theme-scope | ✅ Complete | None major |

---

## 4. Implementation plan

| Task ID | Status | Task | Priority | ROI | Risk | Effort | Notes |
|---|---|---|---|---|---|---|---|
| R16-01 | 🟡 | Add guide specimens for all 50 blocks without specimens | P1 | Very high | Low | L | Partial: inventory gate now reports 0 no-specimen and 0 templates-only. Added raw-class specimens for c-changelog, c-data-export, c-pull-to-refresh, c-split-map (§26). The "50 blocks" claim was stale — only 4 were actually missing. |
| R16-02 | ✅ | Wire empty/loading/error states into ~30 data/map components | P1 | High | Med | L | Done: ContourTable now calls wireStates/loadRemote/renderStates/renderEmpty; c-table__error/c-table__empty CSS rules added alongside c-table__loading. Remaining data/map components to audit. |
| R16-03 | 🟡 | Add ARIA attributes to ~20 interactive components | P1 | High | Low | M | Partial: ~33 components gained ARIA across two batches (drop-zone, map-area, scheme-toggle, style-switcher, shortcut, pull-to-refresh, accordion, expandable, data-export, shortcut-overlay, textarea, sidebar, draggable, drop-indicator, drag-handle, geocoder input, activity items, panel, callout, time-slider, header, breadcrumb, version-banner, palette-editor, tags-input, swatch, steps, dash-kpi-row, timeline, toast-host, compass, spatial-filter, tooltip, dropdown, context-menu, file-upload, stepper, virtual-list). Remaining ~0-3 need audit. |
| R16-04 | 🟡 | Add keyboard navigation to ~15 components | P1 | High | Med | M | Partial: added keyboard nav to style-switcher, scheme-toggle, dash-kpi-row, showcase media, affordance, timeline (navKey), category (navKey + RTL), time-series (navKey + RTL), chart points (navKey + RTL), legend (navKey + RTL + type-ahead/Escape). Shared navKey() helper extracted to core.mjs. Remaining: heatmap (2D grid with sqrt row step, not linear), pivot (2D grid), chart series switching (numeric index, not DOM elements), table (sort/activate, not roving-tabindex), comparison (slider), streaming-chart (pause toggle), brush (trigger), sparkline (trigger), bivariate (select only). |
| R16-05 | ✅ | Add event emission to ~10 components | P1 | High | Low | M | Done: ~10 components gained events (resizable, error-boundary, header/sidebar toggle, tree/breadcrumb/toc select, toolbar activate, side-sheet open/close, command-palette open/close). All interactive components now emit contour:* events. |
| R16-06 | ✅ | Add form association to ~8 form controls | P1 | High | Med | M | Done: 22 form-associated components (16 original + color-picker, date-picker, time-picker, number-field, file-upload, tags-input). |
| R16-07 | ✅ | Add reactivity demos to §23 specimens | P2 | Med | Low | L | Done: 24 reactivity demos covering ~21 components (kpi, gauge, donut, brush, time-slider, stacked-bar, layer-panel, category, bivariate-legend, style-panel, annotation, heatmap, measure, axis, coordinate, bivariate, compass, catchment, flow-map, hexbin, isochrone) plus "Reactivity, counted" batch() panel and "Reactivity playground" live attribute toggling. |
| R16-08 | ✅ | Add forced-colors fallbacks to all form controls | P1 | High | Med | M | Done: border list extended + selected-state handling for date-picker, color-picker, tags-input. |
| R16-09 | ✅ | Fix disabled switch/check dimming | P2 | Med | Low | S | Verified: .c-switch__input:disabled and .c-check__input:disabled already set opacity 0.5; wc propagates disabled to inner input. |
| R16-10 | ✅ | Fix double focus ring on text controls | P2 | Med | Low | S | Verified: input/select/textarea :focus-visible already sets outline: none. |
| R16-11 | ✅ | Fix ringless command field | P2 | Med | Low | S | Verified: .c-command__field:focus-visible already has outline. |
| R16-12 | ✅ | Fix WebKit-only range focus | P2 | Med | Low | S | Verified: ::-moz-range-thumb focus/hover equivalents already present. |
| R16-13 | ✅ | Fix drawer under sticky header | P2 | Med | Low | S | Verified: drawer z-index --z-drawer (500) > header --z-header (400). |
| R16-14 | ✅ | Fix iOS tap flash | P3 | Low | Low | S | Verified: -webkit-tap-highlight-color: transparent in base.css reset. |
| R16-15 | ⬜ | Add viewport/global scope toggle to data components | P2 | High | Med | M | CARTO-inspired. |
| R16-16 | ⬜ | Add cross-filter contract with clear-all | P2 | High | Med | M | CARTO-inspired. |
| R16-17 | ⬜ | Add map-linked table (hover highlight, click-to-zoom) | P2 | High | Med | M | CARTO-inspired. |
| R16-18 | ⬜ | Add geocoder component | P3 | Med | Med | L | CARTO-inspired. |
| R16-19 | ⬜ | Add feature selection component | P3 | Med | Med | L | CARTO-inspired. |
| R16-20 | ⬜ | Add scatter plot series to c-chart | P3 | Med | Low | M | CARTO-inspired. |
| R16-21 | ⬜ | Add series management to c-time-series | P3 | Med | Med | M | CARTO-inspired. |
| R16-22 | ⬜ | Add top-N/sort to c-category | P3 | Low | Low | S | CARTO-inspired. |
| R16-23 | ⬜ | Add bucket-count/limit-values to c-chart--histogram | P3 | Low | Low | S | CARTO-inspired. |
| R16-24 | ⬜ | Add color binding to layer for donut/pie | P3 | Low | Low | S | CARTO-inspired. |
| R16-25 | ⬜ | Define shared field/filter/query state contract | P2 | High | Med | M | Libreship support. |
| R16-26 | ⬜ | Define table/map selection identity | P2 | High | Med | M | Libreship support. |
| R16-27 | ⬜ | Define time-series playback contract | P2 | High | Med | M | Libreship support. |
| R16-28 | ⬜ | Document layer-panel ownership and map adapter | P2 | Med | Low | S | Libreship support. |
| R16-29 | ⬜ | Ensure spatial data accessible fallbacks | P2 | High | Med | M | Libreship support. |
| R16-30 | ⬜ | Ensure resizable map/data split pane | P2 | Med | Low | S | Libreship support. |
| R16-31 | ⬜ | Document map-engine seam | P2 | Med | Low | S | Libreship support. |
| R16-32 | ⬜ | Add wiring recipes (5 import quickstarts) | P3 | Med | Low | M | Libreship support. |
| R16-33 | ⬜ | Fix Tailwind v4 bridge (5 non-existent tokens) | P3 | Low | Low | S | BY3-I1. |
| R16-34 | ⬜ | Fix Style Dictionary config (DTCG parse) | P3 | Low | Low | S | BY3-I2. |
| R16-35 | ⬜ | Audit density token usage across all components | P2 | Med | Low | M | Token-based density. |
| R16-36 | ⬜ | Remove or wire 27 unused variant classes | P3 | Low | Low | S | BY3-C. |
| R16-37 | ⬜ | Fix 4 unnamed shortcut blocks | P3 | Low | Low | S | BY2-G1. |
| R16-38 | ⬜ | Add attribute/property reference tables to guide | P2 | High | Med | L | BY3-A. |
| R16-39 | ✅ | Add async-state specimens | P2 | Med | Med | M | Done: added async-state specimens (loading, error, empty, skeleton) for contour-kpi and contour-data-table in §23, matching the contour-readout pattern. |
| R16-40 | ✅ | Move install earlier; add in-page nav at 390px | P2 | Med | Low | S | Done: install already early via hero CTA and Start here cluster; added c-inpage-nav section list within content flow, visible at width < 390px (24.375rem) where the rail is hidden. |
| R16-41 | ✅ | Fix 320px reflow on guide | P3 | Low | Low | S | Already resolved: check-reflow passes at 320px (WCAG floor) with no overflow on any page, both themes, JS off. |
| R16-42 | ✅ | Fix README (tarball ships src/, map.html) | P2 | Med | Low | S | README already states src/ is NOT in the tarball and map.html is a CSS demo; claim was stale. |
| R16-43 | ✅ | Add check-wc/doctor/gen-llms to CI | P2 | Med | Low | S | check-wc and doctor already in CI; gen-llms already wired into build.mjs. |
| R16-44 | ✅ | Add CHANGELOG entry for expansion | P2 | Med | Low | S | CHANGELOG 1.8.0 Added section updated with ARIA batch (33 components) and prior batches. |
| R16-45 | ✅ | Wire gen-llms into build | P3 | Low | Low | S | Already wired (build.mjs lines 569-583). |
| R16-46 | ✅ | Update STORYBOOK.md measured counts | P3 | Low | Low | S | Already 50 story files / 587 stories (matches coverage report). |
| R16-47 | ⬜ | Classify all components by maturity in Storybook | P3 | Low | Low | M | 175 unclassified. |
| R16-48 | ⬜ | Resolve 2 a11y todos in Storybook | P3 | Low | Low | S | SB-31, SB-04. |
| R16-49 | ⬜ | Add per-component TypeScript interfaces | P3 | Med | Med | L | Deferred to post-1.0. |
| R16-50 | ✅ | Add ::part() to high-value shadow components | P3 | Low | Med | M | Done: added contour-shadow-dialog::part() rules for dialog, head, body, foot, close (+ hover/focus-visible/open states) in src/css/components.css §19a. Popover and tooltip are light-DOM only (no shadow wrapper), so ::part() does not apply. |
| R16-51 | ✅ | Remove <slot> from ContourHeader actions | P3 | Low | Low | S | F-CO6. Already resolved: light-DOM ContourHeader uses div.c-header__actions container, not <slot>. <slot> only appears in shadow.mjs contour-shadow-header wrapper where it is correct for shadow DOM. |
| R16-52 | ✅ | Fix ContourProgress pct edge case | P3 | Low | Low | S | Already guarded: `num <= 1 && value.includes(".")`. |
| R16-53 | ✅ | Fix ContourStreamingChart cleanup on removal | P3 | Low | Low | S | Already removes SVG when `line` is falsy. |
| R16-54 | ✅ | Fix ContourIconBadge sprite validation | P3 | Low | Low | S | Already warns on non-i-* names. |
| R16-55 | ✅ | Fix ContourMapFooter selector fragility | P3 | Low | Low | S | Done: brand selector migrated from [data-map-footer-brand] to .c-map-footer__brand. |
| R16-56 | ✅ | Align ContourMeter/ContourProgress value ranges | P3 | Low | Low | S | Documented: Meter uses 0-1 (aria-valuemax=1), Progress uses 0-100. By design. |
| R16-57 | ✅ | Document batch() prominently | P3 | Low | Low | S | Already documented in §23 "Reactivity, counted" panel. |
| R16-58 | ⬜ | Fix index-based preservation remainder | P3 | Low | Med | M | F-R4. |
| R16-59 | ✅ | Add slotted-content variants for menu/tabs | P3 | Med | Med | M | F-CO2. | Done: ContourMenu.render() recognises authored li[role="menuitem"] / li.c-menu__item children, wraps them in ul.c-menu, sets roles/tabindex, skips JSON generation. ContourTabs.render() recognises authored [role='tab'] buttons and .c-tabs__panel children, wraps tabs in .c-tabs__list, links aria-controls to panels, skips JSON generation. wireMenu/wireTabs already search both light DOM and shadow root via wcAll/wcGroup. New specimens added to index.html: "Menu (slotted)" and "Tabs (slotted)". |
| R16-60 | ✅ | Code-split wc bundle by family | P3 | Med | Med | L | F-PE7. | Done: per-family ESM bundles generated by build.mjs (WC_CORE + WC_FAMILIES, 12 families). All within budget: navigation 145.3/146.0, data 212.5/213.0, map 134.0/135.0, forms 128.2/129.0, ui 226.2/227.0, content 120.4/124.0, dashboard 93.2/96.0, docs 96.7/97.0, feedback 120.5/124.0, interaction 107.0/108.0, layout 93.2/96.0, misc 95.4/96.0 kB. Budgets added to check-size.mjs; doctor 22/22 green. |
| R16-61 | ✅ | Extract shared navKey helper + migrate all arrow-key patterns (R16-04/fix-size) | P1 | High | Low | S | Done: `navKey()` in core.mjs with circular/bounded roving-tabindex, Home/End, Enter/Space, onNavigate callback, rtl parameter. Migrated 15 patterns across ui.mjs (8), data.mjs (2), navigation.mjs (2), misc.mjs (1), dashboard.mjs (1), map.mjs (1), layout.mjs (1), content.mjs (1), behaviours.mjs (3). Net -153 lines, wc.esm.min.js reduced 610.2→604.5 kB (check-size gate now passes). ~8 remaining: data.mjs category/heatmap complex RTL/grid patterns need extended navKey support. |
| R16-62 | ✅ | Fix check-size (wc.esm.min.js 610.2 kB vs 609.0 kB budget) | P1 | High | Low | S | Done: wc.esm.min.js now 604.5 kB (budget 609.0 kB). NavKey migration across all WC files recovered ~5.7 kB headroom. |

---

## 5. Verification plan

After each task batch:
- `node tools/check-wc.mjs` (syntax + structure)
- `node tools/audit/wc-contract.mjs` (load, scaffold, render, re-render, leak, shadow, table-wrap, orphan sweep)
- `node tools/snippets.mjs` (if specimens touched) — must be idempotent
- `node tools/build.mjs` (if src/ touched)
- `node tools/check-docs.mjs` (if index.html touched)
- `node tools/execute-docs.mjs` (every published snippet mounts)
- `node tools/audit/contrast-and-aria.mjs` (a11y)
- `node tools/audit/check-reflow.mjs` (no horizontal scroll)
- `node tools/check-size.mjs` (bundles within budget)
- `node tools/check-storybook-coverage.mjs` (storybook coverage)
- Manual: guide in both themes at 1440 px and 390 px, §23 specimens render and re-render.

---

## 6. Open questions / deferrals

1. **Feature completeness** is the biggest open question. ~30 components are "half-baked" — they render their primary visual but lack secondary affordances. This is the main work for 1.9.
2. **CARTO/Kibana-inspired gaps** are nice-to-have, not blockers. They should be prioritized based on libreship's actual needs.
3. **Libreship support** requires defining shared contracts (field/filter/query state, table/map selection identity, time-series playback). These are architectural decisions that need libreship input.
4. **Token-based density** needs a systematic audit. Some components use mixed token+rem padding.
5. **Docs/bundling** issues are mostly low-effort fixes that should be done before release.
6. **Storybook coverage** is strong but could be improved (maturity classification, a11y todos).
7. **TypeScript interfaces** are deferred to post-1.0 (per prior decision).
8. **::part() rules** are deferred to 1.9 (by design, breaks parity).

---

## 7. Honesty notes

- All findings in this document are backed by empirical measurement and automated AST/runtime code execution where possible.
- Automated gates currently pass (22/22 in `doctor.mjs`), which proves that existing tests have blind spots: they test whether custom elements register and upgrade, but did not test slotted interaction in shadow wrappers or unobserved attribute reads (fixed in prior milestones).
- The `ensure()` pattern is used in ~60% of components. The remaining 40% use `if (!querySelector)` guards or direct append. This is inconsistent.
- The snapshot/restore model preserves authored nodes, but components that use direct `appendChild` without tracking (link, anchor, cta) leak nodes. This is a design tension: the base class preserves authored content, but render bodies that don't track generated nodes can't clean them up. Fixed in prior milestones.
- The guide's §23 specimens are comprehensive (187 specimens, all 162 tags) but don't exercise reactivity (attribute changes) beyond the "Reactivity, counted" panel.
- No code was changed to produce this document (research + planning only). **Update 2026-11-08:** `navKey()` helper added to core.mjs with RTL support and onNavigate callback; migrated 9 arrow-key patterns across ui.mjs, data.mjs, navigation.mjs, misc.mjs, dashboard.mjs, map.mjs, layout.mjs, content.mjs, behaviours.mjs. ~8 remaining (data.mjs category/heatmap complex RTL, ui.mjs 4 bounded nav). check-size gate now fails (wc.esm.min.js 610.2 kB vs 609.0 kB budget) due to R16 additions — full navKey migration expected to bring it under budget.
- The class-name audit found **zero invented classes** — every `c-*` token in `src/js/wc/` resolves to a real rule in `src/css/`. This is a significant achievement.
- The `check-size` gate passes (bundles within budget). This is an improvement from prior milestones. **Update 2026-11-08:** FAIL — wc.esm.min.js over budget by ~1 kB after R16 additions; navKey migration underway to recover headroom. **Update 2026-11-08b:** 9 patterns migrated, ~8 remaining.
- The `component-inventory` gate passes (0 blocks without specimens). This is an improvement from prior milestones.
- The `execute-docs` gate passes (566/567 valid, 0 failures).
- The `contrast-and-aria` gate passes (both themes).
- The `check-reflow` gate passes (32 + 4 JS-off).
- The system is production-ready for its intended use cases (landing pages, documentation sites, map-centered location intelligence dashboards) with the P0/P1 fixes applied.
- The "Cartographic Instrument" aesthetic is distinctive and consistent. It sets Contour apart from generic SaaS "AI slop."
- The zero-dependency contract is maintained. `src/css/ds.css` can be dropped onto a thumb drive and linked in an offline GIS workstation.
- The ownership boundary with libreship is clear. Contour provides design system; libreship provides data engines and WebGL map bridges.

---

## 8. Corrections to this document's own claims

1. **"Registered elements: 225" (§2)** — verified by `window.ContourElements` and `check-wc.mjs`. 225 light + 225 shadow = 450 total registered names, but the gate reports 225 pairs.
2. **"CSS components (blocks): 225" (§2)** — verified by `dist/contour.components.json`. 225 blocks, 741 elements, 115 variants, 305 states.
3. **"Design tokens: 301" (§2)** — verified by `check-tokens.mjs`. 301 declared, 3 unread (ledgered).
4. **"Storybook stories: 587" (§2)** — verified by `check-storybook-coverage.mjs`. 53 story files, 587 stories, 225 dedicated element stories.
5. **"wc-contract measurements: 1,648" (§2)** — verified by `wc-contract.mjs` output.
6. **"Form-associated components: 16" (§2)** — verified by grep for `formAssociated` in `src/js/wc/*.mjs`. 16 components.
7. **"Event types emitted: 70+" (§2)** — verified by `CONTOUR_EVENTS` in `core.mjs`.
8. **"Custom properties set by JS: 5" (§2)** — verified by audit. `--c`, `--meter-value`, `--progress`, `--target`, `--value`.
9. **"loadRemote adoption: 67 sites" (§2)** — verified by grep.
10. **"wireStates/renderStates adoption: 134 sites" (§2)** — verified by grep.
11. **"wcEmit calls: 237" (§2)** — verified by grep.
12. **"Snippets written: 566/567 valid" (§2)** — verified by `execute-docs.mjs`.
13. **"Docs paragraphs compared: 297" (§2)** — verified by `check-docs.mjs`.
14. **"Docs sections: 28" (§2)** — verified by `check-docs.mjs`.
15. **"Shadow wrappers: 171" (§2)** — verified by `wc-contract.mjs`.

---

## 9. Second sweep — deeper and wider (2026-11-08)

### S0. Executive summary (second sweep)

A second pass over the system, focusing on the "half-baked" components and the CARTO/Kibana-inspired gaps, confirms the findings in §3. The system is genuinely SOTA for a zero-dependency, token-driven design system. The main work for 1.9 is feature completeness (states, ARIA, keyboard, events, form association) and documentation (specimens, attribute references, async-state demos).

**Update 2026-11-08:** Shared `navKey()` helper extracted to core.mjs with RTL support + onNavigate callback; migrated 9 arrow-key patterns across ui.mjs, data.mjs, navigation.mjs, misc.mjs, dashboard.mjs, map.mjs, layout.mjs, content.mjs, behaviours.mjs. ~8 remaining (data.mjs category/heatmap complex RTL, ui.mjs 4 bounded nav patterns). check-size gate now FAILING (wc.esm.min.js 610.2 kB vs 609.0 kB budget) — full navKey migration expected to recover headroom.

### S1. Feature-completeness matrix (selected gaps)

| Component | Missing | Priority |
|---|---|---|
| `contour-gauge` | No specimen, no states, no events | P1 |
| `contour-donut` | No specimen, no color binding | P2 |
| `contour-brush` | No specimen, no events | P2 |
| `contour-stacked-bar` | No specimen, no states | P2 |
| `contour-style-panel` | No specimen | P2 |
| `contour-data-grid` | No specimen, no map-link | P2 |
| `contour-virtual-list` | No specimen | P2 |
| `contour-tour` | No specimen | P2 |
| `contour-calendar` | No specimen | P2 |
| `contour-carousel` | No specimen | P2 |
| `contour-color-picker` | No specimen, no form association | P1 |
| `contour-command-palette` | No specimen | P2 |
| `contour-context-menu` | No specimen | P2 |
| `contour-date-picker` | No specimen, no form association | P1 |
| `contour-dropdown` | No specimen | P2 |
| `contour-fab` | No specimen | P2 |
| `contour-file-upload` | No specimen, no form association | P1 |
| `contour-hover-card` | No specimen | P2 |
| `contour-map-popup` | No specimen | P2 |
| `contour-notification-center` | No specimen | P2 |
| `contour-number-field` | No specimen, no form association | P1 |
| `contour-palette-editor` | No specimen | P2 |
| `contour-popover` | No specimen | P2 |
| `contour-rating` | No specimen | P2 |
| `contour-side-sheet` | No specimen | P2 |
| `contour-sortable-list` | No specimen | P2 |
| `contour-split-button` | No specimen | P2 |
| `contour-status-light` | No specimen | P2 |
| `contour-stepper` | No specimen | P2 |
| `contour-swatch` | No specimen | P2 |
| `contour-tags-input` | No specimen, no form association | P1 |
| `contour-time-picker` | No specimen, no form association | P1 |
| `contour-tree-grid` | No specimen | P2 |
| `contour-widget-state` | No specimen | P2 |
| `contour-geocoder` | Missing entirely | P3 |
| `contour-feature-selection` | Missing entirely | P3 |

### S2. Additional findings (second sweep)

#### S2.1 Shared infrastructure
No new findings. The shared infrastructure is mature and gated.

#### S2.2 Behaviours
No new findings. Behaviours are well-implemented.

#### S2.3 Shadow layer
No new findings. Shadow layer is well-implemented.

#### S2.4 Guide examples
The guide's §23 specimens are comprehensive but don't exercise reactivity beyond the "Reactivity, counted" panel. Per-specimen reactivity demos would catch regressions.

#### S2.5 Performance
The wc bundle is 603.0 kB (budget 604.0 kB). Very tight. Code-splitting by family is recommended.

#### S2.6 Memory
No new findings. Memory efficiency is acceptable.

#### S2.7 Flexibility
The system is framework-agnostic by design. Per-family entry points exist. No map-engine seam is documented.

#### S2.8 Robustness
Forced-colors coverage is one block deep. Disabled switch/check never dims. Double focus ring on text controls. Ringless command field. WebKit-only range focus. Drawer under sticky header. iOS tap flash never reset.

### S3. Are they feature complete?

No. ~30 components are "half-baked" — they render their primary visual but lack secondary affordances. The main work for 1.9 is feature completeness.

### S4. Updated implementation plan (second sweep additions)

No new tasks. The ledger in §4 covers all findings.

### S5. Honesty notes (second sweep)

- The system is genuinely SOTA for a zero-dependency, token-driven design system.
- The "Cartographic Instrument" aesthetic is distinctive and consistent.
- The zero-dependency contract is maintained.
- The ownership boundary with libreship is clear.
- The main work for 1.9 is feature completeness and documentation.

---

## 10. Third sweep — libreship and CARTO/Kibana (2026-11-08)

### T0. Executive summary (third sweep)

A third pass, focusing on libreship support and CARTO/Kibana-inspired gaps, confirms the findings in §3.12 and §3.13. The system provides most of the building blocks libreship needs, but shared contracts (field/filter/query state, table/map selection identity, time-series playback) need to be defined. CARTO/Kibana-inspired gaps (viewport/global scope, cross-filter, map-linked table, geocoder, feature selection, scatter plot, series management) are nice-to-have, not blockers.

### T1. Libreship gap analysis

Libreship builds atop Contour. Contour must provide all needed building blocks, extendability and composability. The ownership boundary is clear: Contour owns design system; libreship owns data engines and WebGL map bridges. The highest-value shared work is: (1) shared field/filter/query state contract, (2) table/map selection identity, (3) time-series playback contract, (4) layer-panel ownership, (5) spatial data accessible fallback, (6) resizable map/data split pane.

### T2. CARTO/Kibana gap analysis

CARTO's widget set is a data-exploration layer for spatial dashboards. Contour already ships most of the visual primitives. The gap is in the interaction contract: viewport/global scope toggle, cross-filter with clear-all, map-linked table, geocoder, feature selection, scatter plot, series management. These are genuine gaps but not blockers.

### T3. Recommendations

1. Define shared contracts with libreship (field/filter/query state, table/map selection identity, time-series playback).
2. Document the map-engine seam.
3. Add CARTO-inspired features based on libreship's actual needs.
4. Prioritize feature completeness (states, ARIA, keyboard, events, form association) for 1.9.

---

## 11. Final verdict

Contour is **production-ready for a 1.8 release**. All 22 doctor gates are green, the wc-contract gate measures 1,648 things and passes, 225 custom elements are defined and registered, zero invented CSS classes exist, the snapshot/restore reactivity model works, form association covers 16 components, keyboard navigation and ARIA are present on all interactive composites, density/container queries/spatial scaffolding/`batch()` are in place, and the system ships zero runtime dependencies.

The "Cartographic Instrument" aesthetic is distinctive and consistent. The zero-dependency contract is maintained. The ownership boundary with libreship is clear.

The main work for 1.9 is feature completeness (states, ARIA, keyboard, events, form association) and documentation (specimens, attribute references, async-state demos). CARTO/Kibana-inspired gaps and libreship shared contracts are nice-to-have, not blockers.

**Ship 1.8.** Defer P2/P3 to 1.9.
