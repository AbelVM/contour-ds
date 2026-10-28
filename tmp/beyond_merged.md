# Contour — Consolidated audit volume (M-MERGED): beyond_01 + beyond_02 + beyond_03

**Date:** 2026-10-28 · **Snapshot:** HEAD `d4289da`, clean working tree, gates re-run ~15:20 (doctor 19 OK / 1 FAIL check-size; wc-contract PASS 1348; check-wc PASS 19 fragments / 157 registrations; check-tokens 290 / 0; reflow contract green with 2 WCAG-floor NOTED on the guide).
**Scope:** the whole system — CSS layer, token layer, web components, the guide, the templates, the deliverables, the gates, the interop/wiring surface, the SOTA posture.
**Merged from:**
- `tmp/beyond_01.md` (2026-10-27) — wc layer: states machine, events, forms, dialogs, safety, deliverables; plan BY-01…BY-55.
- `tmp/beyond_02.md` (2026-10-28) — CSS layer, guide examples, documentation package, templates, accessibility and motion, SOTA surface, tokens, size, CI, rules, feature/component gaps; findings BY2-*.
- `tmp/beyond_03.md` (2026-10-28) — deeper pass: wc behavioural correctness (B3-*), interaction-state CSS (BY3-U*), responsive pixel level (BR3-*), interop/wiring (BY3-I*), guide DX (BY3-A…K), SOTA verification (BY3-X*).
**Ownership rule:** this volume is the single owning plan. Statuses shown here are current (measured at the HEAD above); where a row's status changed since its source document was written, the override is recorded in §4. The three source documents remain as evidence archives — every file:line citation lives there, this volume does not restate them. Full sub-agent evidence: `tmp/audit/beyond03-{responsive,uiux-css,wc-behaviour,interop,guide}.md`.

## 0. Executive summary (consolidated, current truth)

1. **The only failing gate is check-size** — measured twice this pass: doctor 19 OK / 1 FAIL. The same 7 bundles, and the wc ESM grew 267.3 → 269.4 kB as BY-45/47 landed, so the port's savings (BY-10) are consumed. The resolution is BY3-X2 (trim or re-budget with measured reasons); BY-36's refusal to raise the line without reason stands.
2. **The web-component layer is structurally sound and gated** — wc-contract measured **1348** assertions this pass; the states machine (beyond_01's central truth) is landed, adopted at 44 loadRemote sites, and now carries the async contract, the vocabulary (30 entries, all emitted), and the overlay/form lifecycle. The remaining layer work is the five P1 lifecycle defects (below) plus the ported surface's polish rows.
3. **Five P1 behavioural defects are verified open in the re-render lifecycle** (beyond_03, source-confirmed with file:line): authored light-DOM content destroyed on the first attribute re-render (B3-05), table pagination dead because the page attribute is never written (B3-01), modal lock leaks when an open overlay is removed (B3-02), chart double-keydown with conflicting contour:select payloads (B3-03), and form state (checked, drag position) wiped by any re-render (B3-06). These top the queue.
4. **The 320 px WCAG 1.4.10 floor is breached by 22 px — on the guide only; the templates are now clean** (measured this pass; the 2026-10-24 template carriers are gone). Root cause: .c-chart__plot's 16/7 aspect-ratio × 8rem transfer into an implicit auto grid column (293 px), plus an unclipped #docs code block and a 20rem open-dialog specimen. Fix: BR3-1.
5. **Interaction-state CSS**: the token layer and dark parity are verified clean; the gaps are the interaction vocabulary — forced-colors coverage one block deep with every custom form control unguarded (BY3-U5, P1), disabled switch/check never dims (BY3-U1), double focus ring on text controls (BY3-U2), a ringless command field (BY3-U3), WebKit-only range focus (BY3-U4), drawer under the sticky header (BY3-U6), iOS tap flash never reset (BY3-U7).
6. **The guide's biggest DX gap**: zero structured attribute/property references for any of the 159 contour-* elements (BY3-A) and zero async-state specimens (BY3-B = BY-12, still open after F-27). Consumers reverse-engineer attributes from snippets. Install sits at §22 of 24, and there is no in-page navigation at 390 px (BY3-D).
7. **Interop holds the boundary, lacks the seams**: zero engine-scope creep (no maplibre/mapbox/leaflet imports, no GeoJSON) — but no map-engine seam exists or is documented (BY3-I3), 5 import quickstarts against 0 wiring recipes (BY3-I6), the Tailwind v4 bridge maps 5 non-existent tokens (BY3-I1), and the Style Dictionary config cannot parse its own DTCG source (BY3-I2).
8. **SOTA dates verified** (primary sources, this pass): @starting-style + allow-discrete Baseline-Newly 2024-08, widely available Feb 2027 → BY-50 shippable now; same-document view transitions Baseline 2025-10-14 → BY-33 revisitable; scroll-driven animations not widely available → keep deferred; light-dark() widely available 2026-11-13 → the repo's OWN date is correct, do not fix.
9. **Deliverables still contradict the tree** (beyond_02, re-verified): README claims the tarball ships src/ (0 src/ entries), calls map.html a live map-chrome example (0 map-chrome references), and check-wc / doctor / gen-llms are absent from CI (BY2-I1). CHANGELOG has no entry for the whole expansion (BY-12 owns it).
10. **Dead surface measured**: 27 inventory variant classes with zero use anywhere (BY3-C, extends BY2-C9), 4 unnamed shortcut blocks (BY2-G1), execute-docs keeps one red mark (BY2-G8).

## 1. Method and evidence

- The three sources were re-read for this merge; every status override in §5 is backed by a measurement taken at HEAD d4289ba or d4289da on 2026-10-28 (gate runs, source reads, greps — named in the Notes cells).
- Sub-agent claims from beyond_03 were verified by the author before this volume was written; the four divergences found are recorded in §4.
- This volume was assembled programmatically from the three source files (findings embedded verbatim, byte-faithful; plan rows re-keyed). A self-check asserts every rendered table's per-row cell counts and plan-ID uniqueness; it ran clean before this document was reported.

## 2. Current state (measured, 2026-10-28)

Measured at HEAD `d4289da`, dist built 2026-10-28T12:50:08Z. Full pattern-qualified table in `tmp/beyond_03.md` §2; headline rows:

| Metric | Value |
|---|---|
| doctor sweep | 19 OK / 1 FAIL (check-size) |
| wc-contract | PASS — 1348 measurements |
| check-wc | PASS (19 fragments, 157 registrations) — previously FAIL (4 dead manifest names at 14:08, healed by BY-27/40/41) |
| check-size | 7 bundles over (contour.min.css 176.3/174.0, components.json 160.7/157.0, core 117.7/117.0, docs 130.8/130.0, data 155.2/153.0, landing 125.4/124.0, wc esm 269.4/265.0) |
| Tokens | 290 declared, 0 unread |
| Reflow | contract widths green, both themes, JS off; 320 px floor breached 22 px on the guide (342 vs 320) |
| Event vocabulary | 30 entries, all emitted (4 landed mid-pass) |
| Guide API surface | 0 dl, 0 th-Attribute, 2 ds-spec__desc, 1 table in §23 |
| Async specimens | 0 (F-27 / BY-12 / BY3-B) |
| Templates | all 5 at exactly 320 px; map.html still 0 map-chrome / 0 contour-* |
| Tailwind bridge | 5 phantom tokens; @theme API v4-correct |
| CI | check-wc, doctor, gen-llms absent (0 lanes) |

## 3. Findings registry (embedded verbatim)

The three source findings sections are embedded below byte-faithfully. Status columns inside these registry tables are the sources' own point-in-time statuses; where this volume changes a status, §4 records it and §5 carries the current one. Row IDs stay unique across the whole volume (BY-*, BY2-*, BR3-*, BY3-*, B3-*, BY2-B1..B3).

### 3.1 Part 1 — beyond_01 (wc layer findings; source snapshot HEAD 3b7afaf)

Legend for the Status column: **VERIFIED** = re-checked against the current tree this pass with file:line evidence; **PARTIAL** = the mechanism is real but the stated consequence or count drifted; **CONTRADICTED** = the claim no longer holds (usually because the concurrent session landed the fix); **RESOLVED** = fixed by the committed loader; **OPEN** = verified present, work outstanding.

### 3.1 The async `src` + data-state machine (F-1…F-6, E1…E7)

| ID | Claim (source) | Status | Evidence |
|---|---|---|---|
| F-1 | 36 identical copy-paste fetch blocks with per-copy drift | PARTIAL | Count fell live: from 76 (beyond_00, stale) → 34 at final snapshot; 15 new-API call sites in 3 components. The *pattern* is still the dominant shape (10 sites each in data.mjs/map.mjs) |
| F-2 | Fetch failure lands on `empty`, never `error` | RESOLVED in loader; **OPEN in the 34 legacy copies** | states.mjs `startFetch` throws `HttpError`/`ParseError` and the catch lands on the error state; legacy `.catch(() => { this._loading = false; })` blocks (e.g. data.mjs:63-73) still swallow |
| F-3 | No abort, no token, no cache; `_srcFetched` set before settle → failed URL never retried | RESOLVED in loader; OPEN in legacy | loader has per-URL WeakRef host set + result cache + `onDispose` abort; legacy sites set `_srcFetched = src` at 63-66 before `fetch` at 66 and never clear on failure (agent 1) |
| F-4 | `retry` rendered with no load path to re-run; map family ignores it | RESOLVED for adopted components; OPEN elsewhere | `wireStates` (states.mjs:413) is host-delegated, clears the URL cache and re-asks; components must call it to participate |
| F-5 | ~80 inline `style.color` state styles fight the shipped CSS | PARTIAL | Loader emits no inline styles (per-block classes); **78 inline sites remain** in legacy renders — the state CSS is still dead wherever a legacy block paints |
| F-6 | State contract not uniform: catchment/compass observe `empty` but render none; toc removes list only; docs-nav default fallback makes empty unreachable; filter-bar reads none of placeholder/items/empty | VERIFIED | map.mjs:626 (catchment), map.mjs:721 (compass); nav.mjs:736 (toc); docs.mjs:8 (docs-nav); nav.mjs:813 (filter-bar) |
| E1 | Double loading node on `src` connect (nested re-render) | RESOLVED by design | `requestRender()` (core.mjs:437) defers to a microtask with a coalescing flag; comment documents the measured E1 root cause in-tree |
| E2 | 404 / malformed JSON lands on empty | RESOLVED in loader | `!res.ok` → throw; parse failure → `ParseError`; `name`/`status` ride the event detail |
| E3 | In-flight fetch mutates a detached host | RESOLVED in loader | `onDispose` runs on `disconnectedCallback` and aborts; WeakRef host set skips disconnected hosts |
| E4 | Inline style shadows the state rule | RESOLVED in loader | no `style` attribute in states.mjs; per-block classes + `data-contour-state` hook |
| E5 | Skeletons had no rule | RESOLVED | `c-skeleton--title/--text` exist in the sheet and are the only classes the loader emits |
| E6 | Error silent and un-actionable | PARTIAL — deliberate divergence | Loader: `aria-busy` on host + retry button (`c-btn c-btn--ghost c-btn--sm`, `data-action="retry"`) + `contour:retry`. `role="alert"` was **dropped deliberately** (would be refused by the contrast gate); host-level busy is the design. beyond.md BY-06 asked for `role="alert"` — this must be recorded as a decision, not a miss |
| E7 | 35 generated state classes nobody styles | RESOLVED | committed loader emits only per-block classes that resolve + `c-skeleton` + `c-btn`; zero orphan class names |
| NEW | The orphan sweep **cannot see the loader** | VERIFIED | `wc-contract.mjs:715-751` scans only nodes rendered by the harness's own mounts (bare registry elements + 44 RENDER_CONTRACT cases :405-449); **none carries a state attribute**, so a class emitted only under `loading/error/empty/skeleton/src/retry` is invisible to both gates. `check-wc.mjs` has **no class-token scan at all** (7 structural checks only) | 
| NEW | `requestRender` + `onDispose` are committed | VERIFIED | core.mjs:437 (`requestRender`), :42 (`onDispose` WeakMap, run in `disconnectedCallback` :385-390); the earlier "uncommitted" state quickly became `8cde6ba` refactor commits |
| NEW | Loader state-vocabulary resolves in CSS — but the legacy half still doesn't | VERIFIED | all **12 emittable per-block pairs** for the four migrated blocks have rules (agent 5, measured both directions: 126 CSS state names vs 125 wc emitters). The gaps are on the legacy side: `c-toc__loading`/`c-toc__error` emitted at navigation.mjs:758/767 with **no rule and inline styles**, **3 orphan rules with no emitter** (`c-catchment__empty`, `c-compass__empty`, `c-table__loading`), and **37 hand-rolled `c-<block>__skeleton` emissions with zero `__skeleton` rules** (each rides the styled base `c-skeleton`) — the exact defect states.mjs removes, still live wherever a component hasn't migrated (BY-10) |
| NEW | `c-skeleton` infinite sweep honours reduced-motion globally | VERIFIED | `c-sweep` is `infinite` (components.css:2666-2669); `base.css:421-437` collapses every animation to 0.01 ms / 1 iteration under `prefers-reduced-motion`; utilities.css:362-395 documents the 2.2.2 page-control stance. WCAG 2.2.2 is satisfied at the sheet, not per-component |

### 3.2 The event layer (F-7, F-8)

| ID | Claim | Status | Evidence |
|---|---|---|---|
| F-7 | Two dispatch conventions: behaviours `wcEmit` is `{bubbles, composed}`, data.mjs's 16 events are `bubbles` only | VERIFIED | data.mjs: 16 `dispatchEvent`, 16 `bubbles: true`, **0 composed**; agent 1 re-grepped. The new `states.mjs` events are `{bubbles, composed}` — the loader is on the correct side; the 16 data-family sites are not |
| F-8 | The map layer emits nothing | VERIFIED | map.mjs: 0/0/0 (`dispatchEvent` / `CustomEvent` / helper); layer-panel toggles, layer-switch, map-area buttons and the compass are generated but unwired (agent 1: tooltips only) |

### 3.3 Re-render survival (F-9…F-12)

| ID | Claim | Status | Evidence |
|---|---|---|---|
| F-9 | Chart tooltip/selection handlers captured on generated nodes behind one-shot flags; die on the next render | VERIFIED (structural read) | data.mjs:749-750 guard is a one-shot boolean; tooltip/click/keydown bound to the captured `plot`/`plot2` (:753-754, 770-771, 776, 791); `enhance()` re-invoked after re-render (core.mjs:194, 379) but absorbed by the flag; generated nodes dropped per render (core.mjs ~253-257). **Nuance:** retry click (:823) and series keydown (:830) are host-delegated and survive — rule 12 applies to the tooltip/selection group only. Same shape in sparkline/heatmap/hexbin/flow-map/isochrone/catchment tooltips (agent 1 lists map tooltip divs at 356/468/587/703, mouse-only listeners :387/498/617/714-715) |
| F-10 | `polylinePoints` used but never imported → structured line series render nothing | VERIFIED, **one-line fix narrows** | call at data.mjs:697 (drifted from 744), import list at data.mjs:3 lacks it, no local def; svg.mjs:114 **does export it** (agent 1 correction — beyond_00 implied a missing export). Path appended at 695, throw at 697 aborts `pts.forEach` and `plot.appendChild(svg)` at 712 |
| F-11 | `contour-flow-map` deletes a `.c-flow-map__flow` it never generates | VERIFIED | map.mjs:459/472 delete it; only label/loading/error/skeleton/node/tooltip/empty are ever created; components-data.css:1608/1617 style it — an authored element is destroyed on re-render |
| F-12 | Three placeholder bodies ship as features | VERIFIED | chart-grid (data.mjs:2222): strips TEXT/SPAN at :2227, observes `title` it never reads; metrics (:1463): hard-coded `"42"` (:1471) / `"Metric"` (:1474); contour-plot (:2237): `<line>` :2253 with no x1/y1/x2/y2, `<text>` :2269 with no x/y (label text now set) |

### 3.4 Forms (F-13…F-17)

| ID | Claim | Status | Evidence |
|---|---|---|---|
| F-13 | No validity reporting | VERIFIED | 0 `reportValidity` / `checkValidity`; combobox/field/range/version have no validity path at all |
| F-14 | Radio never clears on uncheck → stale FormData | VERIFIED | `setFormValue` only inside `if (checked)` (forms.mjs:329, 341); no else-branch |
| F-15 | No `formResetCallback` / `formDisabledCallback` / `formStateRestoreCallback`; disabled ignored | VERIFIED | 0 repo-wide (all 19 files) |
| F-16 | check never applies name/value (always submits "on"); switch is a checkbox; radio-list + input-group not form-associated | VERIFIED | check: observed/properties carry name/value, render never reads them, `setFormValue((input.value \|\| "on"))`; switch renders `input type=checkbox` (forms.mjs:219); radio-list: no `formAssociated`, no `radiogroup`, no roving tabindex, first item forced checked (:618); input-group nuance: holds a native light-DOM input (agent 2) |
| F-17 | `required` forwarded only by textarea/input | PARTIAL — agent 2 notes `field` observes required and ignores it; others handle requiredness through internals only | grep |
| NEW | The form family emits **no events** (16 `addEventListener` in forms.mjs, 0 `dispatchEvent`) | VERIFIED (sweep-2) | forms.mjs: 16 listeners, 0 `CustomEvent`; §23 prose promises "interactive components emit bubbling contour:* CustomEvents" (index.html:11480-11482) — the form blocks are the exception, so `contour-field`/`check`/`switch`/`range`/`radio-list`/`combobox` values are unobservable without polling. New plan row BY-44 |

### 3.5 Dialogs, pressables, tooltips, drag (F-18…F-21)

| ID | Claim | Status | Evidence |
|---|---|---|---|
| F-18 | Light dialog lacks the shadow contract; drawer/sheet title dead | PARTIAL — agent 2 correction: **light dialog DOES set `role="dialog"` and renders a head/close button**; the verified defects are the **unconditional `contour:close`** (feedback.mjs:46-58, fires when nothing is open) and the missing open/focus methods (no `showModal`, no trap, no restore — shadow shadow.mjs:297-343 has the full contract). Drawer/sheet `title` observed but never rendered; no head, no close affordance, no enhance | feedback.mjs:491-526 |
| F-19 | Button-like hosts focusable but unpressable | VERIFIED | 4 classes (`btn`, `pressable`, `row-action`, `draggable`) get `role="button"` + `tabindex="0"` with no `enhance()`; **0 `addEventListener` in interaction.mjs**; light search-trigger has no role/tabindex vs a real `<button>` shadow twin |
| F-20 | Tooltip never sets `popover`; `showPopover()` in silent try/catch | VERIFIED | show/hide at ui.mjs:190-191; the **only** `setAttribute("popover")` in the layer is navigation.mjs:839 (ContourCommand); the guide's own specimens are inert without author plumbing |
| F-21 | Drag family scaffolds roles with zero drag events; resizable dead attrs | VERIFIED | `dragstart` / `dataTransfer` = 0; resizable reads neither `title` nor `direction` (interaction.mjs:169-187) |

### 3.6 A11y and dead API surface (F-22…F-25)

| ID | Claim | Status | Evidence |
|---|---|---|---|
| F-22 | Light layer misses the ARIA pass the shadow layer gets free; faq inert | VERIFIED | light alert: no role/live (shadow adds `role="alert"`+`aria-live`, shadow.mjs:119-121); `wireFaq` = 0, faq has no enhance, the plus sign is inert (feedback.mjs:360-363) |
| F-23 | Map/chart tooltips mouse-only, unlabelled | VERIFIED | divs at map.mjs 356/468/587/703: `role=` 0, `aria-describedby` 0, `focusin` 0; listeners are `mouseover` (387/498/617) and `mouseenter/leave` (714-715) only |
| F-24 | Dead observed attributes (observed+reflected, never read) | VERIFIED for all ten | filter-bar placeholder/items/empty; tree loading; toc empty; pullquote by (content.mjs:772); datamark text (ui.mjs:341); resizable title/direction; table-wrap title (interaction.mjs:192); drawer/sheet title (feedback); check name/value (forms); chart-grid title (data.mjs:2222) |
| F-25 | Components inherit the full shared list and re-render on anything | PARTIAL | shared OBSERVED measured at **110** entries (not ~90); only 2 classes in misc/dashboard/layout lack an override (reserved, dash-kpi-row); most of the named suspects live in other fragments and also lack an override |
| NEW | State-contract divergence that gates miss | VERIFIED | tree reads `this._loading && !items` (nav.mjs:302) where every other component reads `hasAttribute("loading")` — the tree's `loading` attribute is inert; pagination serialises `String(this._remotePages)` (nav.mjs:617) — agent 3 **corrected** beyond_00's consequence: `parseInt("1,2,3")` = 1, so a numeric array yields **one** button, not zero (NaN→0 only for non-numeric-leading shapes) |

### 3.7 Safety (F-26)

| ID | Claim | Status | Evidence |
|---|---|---|---|
| F-26 | Attribute-as-HTML sinks and data-into-CSS | VERIFIED | recipe canvas `innerHTML` (content.mjs:465), landing-hero actions (:598), docs-shell article (docs.mjs:152); showcase media sanitizer is a blacklist regex `<(script\|iframe\|object\|embed)[\s\S]*?(<\/\1>\|\/>)` (content.mjs:381) that leaves `onerror`-style attributes; isochrone builds a class from data `"c-isochrone__ring--" + (r.label \|\| r)` (map.mjs:582; CSS styles only 3 modifiers); legend pours raw `ramp` into `style.background` (data.mjs:1590) |

### 3.8 Guide and documentation (F-27 + this pass's findings)

| ID | Claim | Status | Evidence |
|---|---|---|---|
| F-27 | §23 documents the layer, none of the states contract | VERIFIED | zero specimens with a state attribute; zero `contour:retry/load/error` text in index.html; §23 head prose (index.html:11432-11476) never mentions loading/error/empty/skeleton/src/retry; llms files and `dist/docs/webcomponents.md` likewise silent on the async contract |
| NEW | CHANGELOG missing the states expansion | VERIFIED | no feature entry anywhere (the feature is in commits `90d7d83…3b7afaf`, not in CHANGELOG) — beyond.md's "in CHANGELOG.md" is falsified; 1.0 requires the entry |
| NEW | Guide coverage of wc elements is otherwise complete | VERIFIED | 159 distinct tags in the guide vs 157 `define()` literals; the 2-name delta (`contour-shadow-card`, `contour-shadow-tabs`) is registered via the `shadow()` helper — extraction artifact, no real gap |

### 3.9 Deliverables, bundling, publishing (this pass; the 1.0 lens)

1. **Size lane is red with a dateless excuse.** `contour-wc.esm.min.js` measured 309,636 B here (312,468 B in the parallel pass — the artifact churned with the migration) against a 271,360 B budget: **over by ~14–15 %**. The budget comment is the only one in the file without a date/measured size ("raised: ... + skeleton/empty/error states"). Per the repo's own rule (a generated artifact over budget with duplicated content is duplication, not a tight limit — the legacy copy-paste blocks are still in the source), the fix is the port, **not** another raise; but the port's byte savings must be measured against the artifact, not assumed.
2. **The staleness manifest is blind to wc sources.** `manifestSources` (build.mjs:500-516) omits `src/js/wc/*`, so a wc-only change cannot trip the "stale dist" guard. The wc fragment list (`wcFragNames`, build.mjs:276-280) is likewise not asserted against `readdir(src/js/wc)` — a new fragment could land in `contour-wc.js` and miss every surface bundle without a check.
3. **`check-wc` / `doctor` / `gen-llms` are not in CI.** `check-wc` (19 fragments, 157 registrations, structural only) and `doctor` (the node-gate sweep) never run on push; `gen-llms` is **now inside build.mjs** (542-561) but nothing asserts `llms-full.txt`/`.well-known/llms.txt` are current — AGENTS.md's "the build does not emit those files" is stale text.
4. **README claims that are false or misleading at 1.0:** "The tarball ships `dist/` and `src/`" — `npm pack` shows 0 `src/` entries (`files = [dist/, integrations/]`); `templates/map.html` is held up as a live map-chrome example but contains zero map-chrome references (styling nothing; plain MapLibre from unpkg).
5. **Templates never exercise the wc layer.** landing/documentation/dashboard carry no `contour-*` element and no wc script; only `smoke.html` does. For a 1.0 whose headline is 324 custom elements, the starter pages are CSS-only.
6. **`package.json` is release-shaped but gap-toothed**: v1.0.0, prepack builds, 28 exports keys, no `module` field (the ESM twin still imports via `exports["./contour-wc.esm.js"]`), and the README instruction "import by specifier — `contour-ds/dist/contour.css` does not resolve" is **confirmed true** (no `./dist/*` key).
7. **No browser-arm re-run this pass** — `dist/` is mid-migration; every behavioural claim in §3 is a source read. The gates that would certify the loader (`wc-contract` with a state arm, `execute-docs`, `contrast-and-aria`, `check-reflow`) must run on a commit-consistent build before 1.0.
8. **`check-css` scans only 5 sheets** — its glob is `^components.*\.css$` (tools/check-css.mjs:32-33), so **patterns.css is outside the gate**; a collision or leak that only lives there is invisible to the one lane that exists to catch collisions. The sweep-2 CSS audit found zero true cross-sheet dups (the `c-activity__error`/`c-field__error` "double hits" are a comment artifact and a rule + descendant), so this is a gate-shape gap, not a live defect — fix the glob, not the sheets.
9. **Verified non-gaps (sweep-2, proposed then killed by measurement — do not re-propose):** table sort is **landed** (`aria-sort` data.mjs:390/411/427, click :522, keydown :544, `contour:sort` :512); skeleton shimmer under reduced-motion is **covered** by the global kill-switch (base.css:421-437); tooltip focus-trigger is **landed** (ui.mjs:199-200 + popovertarget/aria-describedby :185-186) — only the popover-setting half is open (BY-21); `AbortSignal.any` / `content-visibility` are **in the tree** (states.mjs:212; components.css:967/1109/2438/2733, components-data.css:252, data.mjs:457). All four falsified by measurement, recorded here so the SOTA-claims trap does not re-open them.

---

### 3.2 Part 2 — beyond_02 (CSS, deliverables, templates, a11y, SOTA, size, CI, gaps; source snapshot HEAD 96eb15d)

Legend for the Status column: **VERIFIED** = re-checked this pass with file:line or gate evidence; **PARTIAL** = real but incomplete; **OPEN** = verified present, work outstanding; **RESOLVED** = fixed since the predecessor; **REJECTED** = proposed and refused with reason.

### 3.1 CSS layer — completeness, redundancy, gate coverage

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY2-C1 | `check-css` scans only 5 of 14 sheets (`^components.*\.css$` at tools/check-css.mjs:32-33). `patterns.css`, `utilities.css`, `base.css`, `map-chrome.css`, `tokens.css`, `fonts.css`, `hljs.css`, `light-dark-fallback.css` are never scanned. A collision or leak that lives only in an unscanned sheet is invisible to the one lane that exists to catch collisions | VERIFIED | gate source + `ls src/css` |
| BY2-C2 | `utilities.css` overrides component classes from outside the gate: forced-colors block (utilities.css:266-290) re-borders `.c-card/.c-chip/.c-pill/.c-btn/.c-input/.c-select/.c-textarea/.c-alert/.c-badge/.c-table/.c-panel/.c-chart/.c-legend/.c-kpi/.c-meter`; prefers-contrast block (utilities.css:402-421) re-borders and re-backgrounds `.c-card/.c-panel/.c-input/.c-select/.c-textarea`; prefers-reduced-data (utilities.css:429-433) hides `.c-field::before/.c-panel::before`; prefers-reduced-transparency (utilities.css:438-442) strips `.c-header` backdrop-filter. These are legitimate accessibility overrides, but they are cross-sheet modifications of component selectors that the collision gate cannot see | VERIFIED | grep + read |
| BY2-C3 | `patterns.css` defines 10 `c-*` classes (`.c-affordance`, `.c-affordances`, `.c-dash-freshness`, `.c-dash-kpi-row`, `.c-dash-shell`, `.c-dash-toolbar`, `.c-docs-shell`, `.c-landing-features`, `.c-landing-hero`, `.c-recipe`) that are never scanned for collision against the component sheets. The sweep-2 CSS audit found 0 true cross-sheet dups in the 5 scanned sheets, but that audit did not cover patterns.css either | VERIFIED | grep |
| BY2-C4 | `base.css` defines 10 `c-*` classes (`.c-card`, `.c-command`, `.c-footer`, `.c-header`, `.c-kpi`, `.c-panel`, `.c-scrim`, `.c-sidebar`, `.c-table`, `.c-toast-host`) — the document-frame furniture that the layout ratchet keeps unprefixed-adjacent. These are the same names the component sheets define, so a base-level rule and a component-level rule for `.c-card` can silently disagree; the gate cannot see it | VERIFIED | grep |
| BY2-C5 | `map-chrome.css` defines `.c-map-slot` (1 class) and is the only sheet that re-keys map controls onto Contour tokens per engine. It is outside the gate and outside the component inventory's sheet list for most blocks. A new map-chrome token that drifts from `map-chrome-contract.json` is caught by `check-export` (token side) but not by `check-css` (selector side) | VERIFIED | grep + check-export PASS |
| BY2-C6 | The ownership rule (`rg 'ridgeline\|chart-paper\|contour-field\|contour-opacity\|ds-' src/`) is clean — no guide-only classes leak into `src/`. Verified this pass | VERIFIED | grep (0 matches) |
| BY2-C7 | `light-dark-fallback.css` is generated (`gen-light-dark.mjs --check` passes) and is the only generated CSS artifact. It is 582 lines and is not in the collision gate's scope, but it is a 1:1 derivation, so a collision there would be a derivation bug, not a hand-edit | VERIFIED | gate PASS |
| BY2-C9 | ~20 CSS variant classes are defined and inventoried in `contour.components.json` but never used in the guide, templates, or JS. They are dead CSS (or at best undocumented/untested). Examples: `c-box--s/m/l/xl`, `c-card--accent/flat/interactive/raised`, `c-mark--lg/solid`, `c-stack--sm/lg`, `c-toast--danger/success`, `c-stat--inline`, `c-row--wrap`, `c-container--border`, `c-map-panel--center/vertical`, `c-resizable--vertical`, `c-resize-handle--snapping`, `c-sparkline--accent`. Only `c-chart--donut` is referenced (in a comment in svg.mjs). For a 1.0, these should either be demonstrated in the guide or removed to reduce bundle size | VERIFIED | grep over src/, index.html, templates/ |
| BY2-C10 | The XSS sanitizer in `content.mjs` (lines 338, 411, 498) and `docs.mjs` (line 102) is still a blacklist regex: `/\son\w+\s*=\s*"[^"]*"/gi` only strips double-quoted event handlers. Single-quoted (`onerror='...'`) and unquoted (`onerror=...`) handlers are not stripped. Only `script/iframe/object/embed` tags are removed, not `img` with `onerror`. beyond_01 BY-23 landed the blacklist but not a whitelist. This is a security finding for a 1.0 | VERIFIED | grep over src/js/wc/content.mjs, docs.mjs |
| BY2-C11 | `c-flow-map` still queries for `.c-flow-map__flow` (map.mjs:261, 274) which is never generated. The CSS styles it (components-data.css:1608/1617) but no JS creates it. Dead query + dead CSS. beyond_01 BY-11 still open | VERIFIED | grep over src/js/wc/map.mjs |
| BY2-C12 | Three placeholder components remain: `contour-metrics` hardcodes "42"/"Metric" (data.mjs:1165/1168), `contour-chart-grid` strips text/span and observes `title` it never reads (data.mjs:1638), `contour-contour-plot` creates `<line>` with no coordinates and `<text>` with no position (data.mjs:1655). beyond_01 F-12 verified these; they are still placeholders at HEAD `96eb15d` | VERIFIED | grep over src/js/wc/data.mjs |
### 3.2 Guide examples — quality and coverage

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY2-G1 | 4 contract blocks are unnamed by any guide section: `c-shortcut-list`, `c-shortcut-overlay`, `c-shortcut-panel`, `c-shortcut-row`. They have specimens (index.html:14563-14885) but no section heading names them, so `dist/docs/index.json` reports them in `notNamedByAnySection`. The docs package is otherwise byte-perfect (25 files, 253 paragraphs, 159/163 named) | VERIFIED | dist/docs/index.json |
| BY2-G2 | §23 documents the layer (reactivity, composition, event vocabulary) but **none** of the async contract: zero specimens carry a `loading=/error=/empty=/skeleton=/src=/retry=` attribute, and `contour:retry`/`contour:load`/`contour:error` appear in no specimen text. beyond_01 F-27 is still open at HEAD `96eb15d` | VERIFIED | grep over index.html |
| BY2-G3 | The guide's §04–§22 use raw `c-*` markup by design (the contract a consumer copies). The wc layer is exercised only in §23. This is a deliberate division, not a migration left half-done (beyond_01 BY-17 rejected with reason). But it means the wc layer's reactivity is demonstrated in exactly one place — the "Reactivity, counted" panel — and a consumer reading §04–§22 never sees a `contour-*` tag | VERIFIED | index.html structure |
| BY2-G4 | Snippet disclosure is generated (`data-generated="wrap"`) and `snippets.mjs` is idempotent. The spacing guard (inline `margin-block-start` on a component ends up in its snippet) is enforced. No hand-edited snippets detected this pass | VERIFIED | tools/snippets.mjs |
| BY2-G5 | The guide's own spacing rule (AGENTS.md §7) is enforced by the tool, not by review. A new specimen that leads with guide spacing fails the build. This is the correct SOTA placement (tool, not convention) | VERIFIED | tools/snippets.mjs |
| BY2-G6 | `data-snippet` is required for non-panel/non-spec specimens. A new specimen without it is invisible to the tool. This is a documentation gap risk, not a current defect | VERIFIED | AGENTS.md §7 |
| BY2-G8 | `execute-docs` reports 1 failure (snippet 160). The snippet is a `.ds-install` block containing a `<code>` element whose text includes the literal `<dialog>` tag name; html-validate decodes the escaped entity and flags `element-permitted-content`. This is a false positive from a code example containing a tag name, not a markup defect, but it is a red mark in the gate output and must be resolved (restructure the example) or excused before 1.0 | VERIFIED | execute-docs output |
| BY2-G9 | `snippets.mjs` is idempotent: 353 snippets written, 245 nested, 0 spacing leaks, and a second run produces no diff. The spacing guard (inline `margin-block-start` on a component ends up in its snippet) is enforced by the tool, not by review | VERIFIED | snippets.mjs run this pass |
| BY2-G10 | Guide section coverage is complete and sequential: 24 sections (00–23), each with a matching `<!-- ====== NN · NAME ====== -->` comment and `<span class="ds-rail__num">NN</span>` rail link. The footer links to all 24 sections. The header nav is a 13-link subset (quick nav, not full) | VERIFIED | grep over index.html |
### 3.3 Documentation package and deliverables

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY2-D1 | `npm pack --dry-run` shows 102 entries, 0 under `src/`. `package.json` `files = [dist/, integrations/]`. README says "The tarball ships `dist/` and `src/`". The claim is false; either the README or the `files` array must change before 1.0 | VERIFIED | pack run + package.json |
| BY2-D2 | README calls `templates/map.html` "a live example" of map-chrome (README.md:383). `templates/map.html` contains 0 map-chrome references and 0 `contour-*` elements. The claim is false | VERIFIED | grep |
| BY2-D3 | `package.json` has no `module` field. The ESM twin is reachable only via `exports["./contour-wc.esm.js"]` etc. A consumer doing `import "contour-ds"` gets the CSS default, not the ESM entry. This is a DX gap for a 1.0 that ships ESM | VERIFIED | package.json |
| BY2-D4 | `package.json` has no `./dist/*` export key. README's "import by specifier — `contour-ds/dist/contour.css` does not resolve" is confirmed true. This is a deliberate choice (exports map is the API) but it is undocumented as a choice, and consumers migrating from other systems expect the path | VERIFIED | package.json + README |
| BY2-D5 | `CHANGELOG.md` has no entry for the states expansion, the loader, the migration, or any of the BY-01…BY-46 work. beyond_01 falsified this and it is still true at HEAD `96eb15d`. 1.0 requires the entry | VERIFIED | grep |
| BY2-D6 | `llms.txt` and `.well-known/llms.txt` are identical and are now emitted by `build.mjs` (542-561). AGENTS.md's "the build does not emit those files" is stale text. The files describe the wc layer but never the async contract (consistent with BY2-G2) | VERIFIED | diff + build.mjs |
| BY2-D7 | `dist/docs/` is byte-perfect (25 files, 253 paragraphs, all the guide's own prose). `check-docs` passes. The docs package is the strongest deliverable in the repo | VERIFIED | check-docs PASS |
| BY2-D8 | `dist/registry/` points at files that exist, carries no inline content, no homepage/url, and re-derives byte-for-byte. `check-registry` passes. The registry is release-shaped | VERIFIED | check-registry PASS |
| BY2-D9 | `dist/contour.components.json` is 160.7 kB, over its 157.0 kB budget. It is the largest single JSON artifact and the one most likely to grow with each new block. The budget is tight relative to 163 blocks × 505 elements | VERIFIED | check-size |
| BY2-D10 | `dist/contour.tokens.json` and `contour.themes.json` are DTCG 2025.10 documents validated by an independent implementation (dembrandt). `dtcg-contract` passes. The token export is the most defensible deliverable | VERIFIED | dtcg-contract |
| BY2-D11 | The integrations ship in the npm tarball under `integrations/` (tailwind theme bridge, Style Dictionary config for native tokens, AI rules/prompts). They are optional and non-core, and `check-registry` does not cover them. They are the consumer-facing entry point for Tailwind v4 and native (Swift/Android/Flutter) projects | VERIFIED | integrations/README.md + package.json `files` |
| BY2-D12 | `dist/wc/` ships all 19 fragments verbatim (ESM, tree-shakeable) plus `index.mjs`. `dist/svg/` ships only `contour-mark.svg`. `dist/map-chrome-contract.json` defines the vendor-neutralisation contract (Contour tokens → vendor control clusters). These are the secondary deliverables and are not covered by `check-size`'s per-file budgets (only the aggregate `registry/` and `docs/` directories are) | VERIFIED | ls dist/wc, dist/svg, dist/map-chrome-contract.json |
| BY2-D13 | `execute-docs` reports 73 unresolved class tokens outside the shipped contract and 68 guide-only `ds-` tokens in copy targets (print-only). These are expected (guide-only classes are not shipped) but the `--strict` flag refuses them. The gate passes in non-strict mode. This is a documentation-quality signal, not a defect | VERIFIED | execute-docs output |
| BY2-D14 | `integrations/ai/v0-prompt.md` references a CDN URL (`https://cdn.jsdelivr.net/npm/contour-ds/dist/contour-wc.min.js`) for a package that is private until v1.0 (README: "Not yet hosted; the project is private until v1.0"). The URL is premature and will 404 until publication. The prompt should either remove the CDN reference or gate it behind a "once published" note | VERIFIED | v0-prompt.md + README |
| BY2-D15 | README's "What ships" table omits the `wc/` directory (19 ESM fragments) and `contour-wc.esm.min.js`. A consumer looking for tree-shakeable fragments in the table will not find them, though they are documented in the ESM section above. Minor documentation gap | VERIFIED | README "What ships" table |
| BY2-D16 | `src/css/ds.css` chains 9 sheets via `@import` (request waterfall). This is the documented development-time tradeoff (README: "That chain costs a request per sheet, a waterfall on the critical path, so ship one file"). The build produces single-file bundles. This is the correct SOTA (documented tradeoff, not a defect) | RESOLVED | ds.css + README |

### 3.4 Templates and starter pages

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY2-T1 | `landing.html`, `documentation.html`, `dashboard.html` carry 0 `contour-*` elements and no wc script. Only `smoke.html` exercises the layer. A consumer copying a starter page gets none of the reactivity the layer sells | VERIFIED | grep |
| BY2-T2 | `templates/map.html` uses raw MapLibre from unpkg and raw `c-*` classes. It does not use `map-chrome/*` CSS, `contour-map-*` elements, or any Contour map component. It is a CSS demo, not a map-chrome demo, despite README's claim | VERIFIED | grep (0 map-chrome, 0 contour-) |
| BY2-T3 | `templates/dashboard.html` uses bare `c-table` elements that are `.visually-hidden` data alternatives (reflow gate exempts them, check-reflow.mjs:88). This is correct for the reflow contract but means the dashboard template's primary data surface is a hidden table, not a visible one | VERIFIED | check-reflow exemption |
| BY2-T4 | The templates link `../src/css/ds.css` (source, not dist). They are development-time pages, not consumer-facing starters. This is fine for a repo that ships `src/` is not in the tarball (BY2-D1) — but it means the templates cannot be used as-is by a consumer who installed the package | VERIFIED | template head |
| BY2-T6 | The spatial workspace family (10 blocks: `c-map-slot`, `c-map-panel`, `c-segmented`, `c-layer-switch`, `c-readout`, `c-scale-bar`, `c-map-footer`, `c-survey`, `c-instrument`, `c-legend`) is used at 10/10 in the dashboard template and 0/10 in the map template. The map template is a CSS demo, not a map-chrome demo, and does not exercise the components the system ships for map dashboards. This is the same gap as BY2-T2, measured from the component-inventory side | VERIFIED | component-inventory output |
| BY2-T8 | Astro and Vite templates import `contour-ds/css/ds.css`, which is **not** in the `exports` map (the map has `./contour.css`, not `./css/*`). The Astro config aliases `contour-ds` to `../../src` so it resolves locally, but the Vite template has no alias and no `contour-ds` dependency, so it is broken out of the box for a consumer | VERIFIED | templates/astro/astro.config.mjs + templates/vite/ |
| BY2-T9 | Vite template's `package.json` has no `contour-ds` dependency. `npm install` will not install it, so the import `contour-ds/css/ds.css` fails even after install. The template is not runnable as shipped | VERIFIED | templates/vite/package.json |
| BY2-T10 | Both Astro and Vite templates use inline styles (`style="margin-block-start: var(--space-cluster)"` / `style={{ marginBlockStart: "var(--space-cluster)" }}`). This contradicts the system's own spacing rule (guide spacing in specimen markup ends up in snippets). Templates are not guide specimens, so the guard does not apply, but the pattern is inconsistent with the system's stated convention | VERIFIED | templates/astro/src/pages/index.astro + templates/vite/src/App.jsx |

### 3.5 Accessibility and motion

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY2-A1 | `contrast-and-aria` passes (control edge + focus ring vs every surface, both themes, ≥3:1). The accessibility contract is enforced, not asserted | VERIFIED | gate PASS |
| BY2-A2 | `check-reflow` passes (no horizontal page scroll at asserted widths, both themes, JS off; bare `table.c-table` requires `.c-table-wrap`). The reflow contract is enforced | VERIFIED | gate PASS |
| BY2-A3 | `check-motion` passes (7 infinite animations, all pausable by `[data-motion]` control on index.html and templates/dashboard.html). WCAG 2.2.2 is enforced | VERIFIED | gate PASS |
| BY2-A4 | Forced Colors Mode removes texture and ridgelines and falls back to `CanvasText` outline (utilities.css forced-colors block). This is in place and is the correct SOTA placement | VERIFIED | utilities.css:266-290 |
| BY2-A5 | `prefers-reduced-data` and `prefers-reduced-transparency` are handled (utilities.css:423-442). These are rarely implemented in design systems; their presence is a SOTA marker | VERIFIED | utilities.css |
| BY2-A7 | `ACCESSIBILITY.md` documents the known limitations: RTL is structural only (full audit pending); `light-dark()` is newly available (2024-05, widely available 2026-11); anchor positioning is behind `@supports`. These are honest and accurate. The RTL limitation is the one that most affects the map-dashboard audience (spatial tools are often used in RTL locales) | VERIFIED | ACCESSIBILITY.md |
| BY2-A8 | `component-inventory` reports 15 link targets under the 24 px AA floor (advisory, WCAG 2.5.8 inline exception). All visible pointer targets meet the 24 px floor. No gate failure | VERIFIED | component-inventory output |
### 3.6 SOTA patterns and modern code

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY2-S1 | `content-visibility: auto` is used in 4 CSS sites (components.css:967/1109/2438/2733, components-data.css:252) plus table windowing in data.mjs:457. This is the correct SOTA for long lists and is already in the tree (beyond_01 verified it as a non-gap) | RESOLVED | grep |
| BY2-S2 | Container queries are used in 7 sites (`@container`). This is the correct SOTA for component-level responsiveness | VERIFIED | grep |
| BY2-S3 | `@starting-style`, `transition-behavior: allow-discrete`, `hidden="until-found"`, `inert` are all at 0 hits in `src/`. The beyond_01 SOTA rows (BY-50/51/52) are still open and still P3. These are enhancement-only and should not block 1.0, but they are the difference between "good" and "SOTA" for open/close transitions and in-page find | OPEN | grep |
| BY2-S4 | `AbortSignal.timeout` with a timer fallback is in the loader (states.mjs:212). `AbortSignal.any` is used. This is the correct SOTA for fetch timeouts | RESOLVED | beyond_01 |
| BY2-S5 | The snapshot/restore reactivity model (core.mjs) is the system's identity and is not a framework. beyond_01 BY-38 rejected signals/DOM-diffing and that refusal stands. No change proposed | REJECTED | beyond_01 BY-38 |
| BY2-S6 | `Math.random()` for IDs is 0 (uses a monotonic counter). No ID-collision risk. This is already correct | RESOLVED | wc-milestone_03 |
| BY2-S10 | `src/svg/cvd-filters.svg` ships color-vision-deficiency filters (deuteranopia, protanopia, tritanopia). This is a SOTA accessibility feature for a design system that claims "no chart asks you to tell two colours apart" — the filters let a designer preview how a chart reads under CVD. It is shipped but not referenced in any guide specimen or documentation | VERIFIED | src/svg/cvd-filters.svg |
| BY2-S11 | `src/svg/chart-patterns.svg` ships chart pattern fills (hatch, dots, lines). These complement the dash-pattern contract for series differentiation. Shipped but not referenced in any guide specimen | VERIFIED | src/svg/chart-patterns.svg |
| BY2-S12 | `src/css/fonts/` ships 7 woff2 files (IBM Plex Sans, Condensed, Mono — variable + italic) plus `OFL.txt` (SIL Open Font License). Self-hosted, no Google Fonts origin. `check-markup` confirms 4 shipped pages use self-hosted fonts. This is the correct SOTA (no third-party font load) | VERIFIED | src/css/fonts/ + check-markup |
### 3.7 Tokens and theming

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY2-K1 | 290 tokens declared, 0 unread, every one accounted for in the ledger. `check-tokens` passes. The token layer is the cleanest part of the system | VERIFIED | check-tokens |
| BY2-K2 | 100 theme pairs published on both sides (light + dark). `check-export` passes. No theme asymmetry | VERIFIED | check-export |
| BY2-K3 | The two override knobs (`--brand-hue`, `--radius-scale`) are the only theming entry points per DESIGN.md. `.c-theme-scope` re-derives the whole brand layer (AGENTS.md rule 3). This is the correct SOTA for `var()` eager resolution | VERIFIED | DESIGN.md |
| BY2-K4 | The DTCG export (`contour.tokens.json` Format, `contour.themes.json` Resolver) is validated by an independent implementation (dembrandt). `dtcg-contract` passes. The token export is defensible | VERIFIED | dtcg-contract |
| BY2-K6 | `DESIGN.md` documents 4 token layers (primitives, semantic, component, utility), 3 surfaces, 163 components, WCAG 2.2 AA, and a browser support matrix (`light-dark()` newly available 2024-05, widely available 2026-11; `light-dark()` for images must not be used until 2029-03; anchor positioning behind `@supports`). The browser support matrix is the most useful part of DESIGN.md for a consumer deciding whether to use the fallback stylesheet | VERIFIED | DESIGN.md |
| BY2-K7 | `gen-types.mjs` generates `contour.d.ts` (26.2 kB, under its 27.0 kB budget). The type declarations are derived from the component inventory, not hand-written. `check-size` passes on this file | VERIFIED | check-size + gen-types.mjs |
### 3.8 Size and performance

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY2-P1 | `check-size` fails on 7 bundles (see §0 item 1). The wc ESM bundle is 267.3/265.0 kB. The overrun is small but it is the only failing gate and it blocks `doctor` | VERIFIED | check-size |
| BY2-P2 | The wc bundle grew from ~310 kB (beyond_01 measurement) to 267 kB minified. The migration port (beyond_01 BY-10) landed and the bundle shrank, but it is still 2.3 kB over budget. The budget comment is dateless ("raised: ... + skeleton/empty/error states") — the only one in the file without a date/measured size | VERIFIED | check-size.mjs:124 |
| BY2-P3 | `contour.components.json` (160.7/157.0 kB) is the second-largest overrun and the one most likely to grow. It carries 163 blocks × 505 elements × 1684 tokens. The budget is tight relative to the inventory's growth rate | VERIFIED | check-size |
| BY2-P4 | The CSS bundles (`contour.min.css` 176.3/174.0, `contour-core.min.css` 117.7/117.0, `contour-docs.min.css` 130.8/130.0, `contour-data.min.css` 155.2/153.0, `contour-landing.min.css` 125.4/124.0) are all 1–3 % over. The total CSS surface is ~10.6 kB of source; the minified output is ~176 kB. The gap is minification overhead + the 4 surface-specific sheets, not source bloat | VERIFIED | check-size |
| BY2-P5 | `contour.single.min.css` (~260 kB larger, fonts inlined) is off by default. This is the correct SOTA (font caching wins) and is already the documented choice | RESOLVED | AGENTS.md |

### 3.9 CI and gate coverage

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY2-I1 | `check-wc`, `doctor`, `gen-llms` are not in CI. `check-wc` (19 fragments, 157 registrations) and `doctor` (the node-gate sweep) never run on push. `gen-llms` is now inside `build.mjs` but nothing asserts `llms-full.txt`/`.well-known/llms.txt` are current | VERIFIED | `.github/workflows/ci.yml` grep |
| BY2-I2 | `check-size` IS in CI (it is the failing gate). The CI is correctly wired to catch the overrun; the overrun itself is the problem | VERIFIED | ci.yml |
| BY2-I3 | `wc-contract` IS in CI and passes (1318 measurements). The component layer is gated | VERIFIED | ci.yml |
| BY2-I4 | `contrast-and-aria`, `check-reflow`, `chart-geometry`, `chart-names`, `theme-render-probe` are in CI. The accessibility and chart gates are wired | VERIFIED | ci.yml |
| BY2-I5 | `dtcg-contract` and `registry-contract` are in CI. The export and registry gates are wired | VERIFIED | ci.yml |
| BY2-I6 | The `build.mjs` manifest staleness guard (`manifestSources`, build.mjs:500-516) omits `src/js/wc/*`. A wc-only change cannot trip the "stale dist" guard. beyond_01 flagged this and it is still true | VERIFIED | build.mjs |
| BY2-I7 | The wc fragment list (`wcFragNames`, build.mjs:276-280) is not asserted against `readdir(src/js/wc)`. A new fragment could land in `contour-wc.js` and miss every surface bundle without a check | VERIFIED | build.mjs |
| BY2-I8 | `chart-geometry`, `chart-names`, `theme-render-probe` all pass. The chart gridline band is derived from `--chart-ticks` (5/5 counts), every chart carries an accessible name + surfaced description, and the theme render probe confirms `--brand-hue` re-points a freshly mounted `.c-btn--primary`. These are the SOTA verification gates and they are green | VERIFIED | gate runs |
| BY2-I9 | `family-gate` passes. The family gate is the token-usage gate (raw values in `src/` fail). No raw hex/px in components | VERIFIED | gate run |
| BY2-I10 | `execute-docs` reports 73 unresolved class tokens outside the shipped contract and 68 guide-only `ds-` tokens in copy targets. These are expected (guide-only classes are not shipped) but `--strict` refuses them. The gate passes in non-strict mode. This is a documentation-quality signal | VERIFIED | execute-docs output |
| BY2-I11 | `tools/audit/schema/` pins the shadcn schemas with hashes and fetch date in `sources.json`. `registry-contract` is deterministic and needs no network. This is the correct SOTA for a gate that asks an external implementation (ajv) rather than the repo's own code | VERIFIED | tools/audit/schema/sources.json |
| BY2-I12 | `tools/audit/lib/browser.mjs` discovers a browser driver; gates exit rather than skip when none is found. `dtcg-contract` needs no browser but resolves dembrandt through the same manifest. This is the correct SOTA (a gate that silently does not run is a gate that silently passes) | VERIFIED | tools/audit/lib/browser.mjs |
| BY2-I13 | `tools/lib/html.mjs` parses and serialises HTML with entity decode/encode as inverses. `snippets.mjs` idempotency (verified this pass) is the round-trip test. AGENTS.md rule 8 documents the three details that keep it a fixed point | VERIFIED | AGENTS.md §8 + snippets.mjs idempotency |

### 3.10 Rules and enforcement gaps

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY2-R1 | No rule or gate covers `contain` property usage. It is used in 7 sites (components.css:392/444/485/967/973/2792, components-shell.css:363) but there is no documented convention for when to use `contain: layout` vs `contain: strict` vs `contain: content`. A consumer or contributor adding a new component has no guidance | OPEN | grep over src/css/ |
| BY2-R2 | No rule or gate covers `content-visibility: auto`. It is used in 4 CSS sites + 1 JS site (table windowing) but there is no documented convention for which components should use it. A long list without `content-visibility` is a performance regression waiting to happen | OPEN | grep over src/ |
| BY2-R3 | No rule covers `font-display` strategy. All `@font-face` rules use `font-display: swap` (correct SOTA), but there is no documented rule or gate enforcing it. A new font added without `swap` would cause FOIT (flash of invisible text) | OPEN | src/css/fonts.css |
| BY2-R4 | No rule covers image optimization. No `loading="lazy"`, `decoding="async"`, or `fetchpriority` attributes are used anywhere in `src/`, `index.html`, or `templates/`. For a design system that ships a style guide with 237 specimens, lazy-loading images would reduce initial load time | OPEN | grep over src/, index.html, templates/ |
| BY2-R5 | No rule covers `will-change`. It is not used anywhere in `src/`. For animated components (dialogs, command palette, tooltips), `will-change: transform, opacity` on the animating element would promote it to a compositor layer and reduce jank. This is a performance gap, not a correctness issue | OPEN | grep over src/ |
| BY2-R6 | No rule covers CSS nesting. It is not used anywhere in `src/css/`. CSS nesting is now widely available (Baseline 2023) and would reduce selector repetition and improve readability. The system's flat selectors are verbose but functional | OPEN | grep over src/css/ |
| BY2-R7 | No rule covers `@scope`. It is not used anywhere in `src/css/`. `@scope` would provide component-level style encapsulation without shadow DOM, complementing the light-DOM approach. This is a future-proofing opportunity | OPEN | grep over src/css/ |
| BY2-R8 | No rule covers service worker / offline support. There is no service worker, no PWA manifest, no offline fallback. For a design system whose audience includes field workers (spatial interfaces, routing engines), offline support is a significant gap | OPEN | ls src/, templates/ |
| BY2-R9 | No rule covers source maps. The build does not emit `.map` files. A consumer debugging minified CSS/JS in production has no source map. This is a DX gap for a 1.0 | OPEN | tools/build.mjs |
| BY2-R10 | No rule covers critical CSS extraction. The build produces full and per-surface bundles but no critical (above-the-fold) CSS. A consumer must download the entire bundle before first paint. This is a performance gap | OPEN | tools/build.mjs |

### 3.11 Feature gaps (beyond current)

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY2-F1 | No data export capability. Charts, tables, and maps have no CSV/JSON/GeoJSON export. A dashboard user who wants to take data out of the system has no path. This is a feature gap for a data-driven design system | OPEN | grep over src/js/wc/ |
| BY2-F2 | No data filtering UI beyond the filter bar. The system has `c-filter-bar` and `c-filter-pill` but no spatial filter (draw on map to filter), no text filter (search within data), no category filter (multi-select facets). beyond_01 BY-30 (spatial filter) is deferred | OPEN | beyond_01 BY-30 |
| BY2-F3 | No data aggregation or grouping. Tables and charts have no group-by, pivot, or summary row. A dashboard user who wants to aggregate data has no component for it | OPEN | grep over src/js/wc/ |
| BY2-F4 | No data comparison (diff/before-after). There is no component for comparing two datasets, two time periods, or two map states. `c-compare` exists but is a simple side-by-side, not a diff | OPEN | grep over src/js/wc/ |
| BY2-F5 | No data annotation. Charts and maps have no annotation layer (labels, pins, callouts, reference lines). A user who wants to mark a point of interest has no component for it. beyond_01 BY-20 (annotation) is deferred | OPEN | beyond_01 BY-20 |
| BY2-F6 | No real-time streaming. `contour-streaming-chart` exists but cannot stream (no `interval`, no `pause`, no `contour:tick`). beyond_01 BY-40 is open | OPEN | beyond_01 BY-40 |
| BY2-F7 | No high-contrast theme. Forced Colors Mode is supported (utilities.css forced-colors block) but there is no dedicated high-contrast theme with increased contrast ratios. A user who needs more than 3:1 has no option | OPEN | grep over src/css/ |
| BY2-F8 | No offline support. No service worker, no PWA manifest, no offline fallback. For a design system whose audience includes field workers (spatial interfaces, routing engines), this is a significant gap | OPEN | ls src/, templates/ |
| BY2-F9 | No print stylesheet beyond basic. The print media query in base.css strips navigation and flattens surfaces, but there is no dedicated print layout, no page-break control for charts/maps, and no print-specific typography | OPEN | base.css:437-489 |
| BY2-F10 | No internationalization beyond structural RTL. `ACCESSIBILITY.md` says "RTL is structural only; a full audit is pending." There is no i18n for component text, no locale-aware number/date formatting (BY-31 in beyond_01 is P3), and no `lang` attribute management | OPEN | ACCESSIBILITY.md + beyond_01 BY-31 |

### 3.12 Component gaps (beyond current)

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY2-X1 | No data grid component. `contour-table` is a basic table; there is no virtualized, sortable, filterable, groupable data grid. beyond_01 BY-34 rejected this as "data-engine territory" but a design system for dashboards needs at least a styled data grid pattern | OPEN | beyond_01 BY-34 (rejected) |
| BY2-X2 | No histogram component. beyond_01 BY-26 is deferred ("needs new CSS block first"). A dashboard without histograms is incomplete for data analysis | OPEN | beyond_01 BY-26 |
| BY2-X3 | No donut chart. beyond_01 BY-23 is deferred. Donut charts are a standard dashboard component | OPEN | beyond_01 BY-23 |
| BY2-X4 | No gauge/dial. `c-meter` exists but is a progress ring, not a full gauge with needle, scale, and zones. beyond_01 BY-25 is deferred | OPEN | beyond_01 BY-25 |
| BY2-X5 | No spatial filter. beyond_01 BY-30 is deferred. Drawing geometries on a map to filter data is a core spatial-dashboard feature | OPEN | beyond_01 BY-30 |
| BY2-X6 | No split map. beyond_01 BY-31 is deferred. Side-by-side map comparison is a standard spatial-analysis feature | OPEN | beyond_01 BY-31 |
| BY2-X7 | No style panel. beyond_01 BY-33 is deferred. Layer styling UI is a core map-dashboard feature | OPEN | beyond_01 BY-33 |
| BY2-X8 | No palette editor. beyond_01 BY-28 is deferred. Color palette editing is a core map-dashboard feature | OPEN | beyond_01 BY-28 |
| BY2-X9 | No annotation component. beyond_01 BY-20 is deferred. Labelled pins on maps are a core spatial feature | OPEN | beyond_01 BY-20 |
| BY2-X10 | No API reference component. The guide has no auto-generated API reference from JSDoc or TypeScript definitions. A consumer looking for method signatures has no in-guide reference | OPEN | grep over index.html |
| BY2-X11 | No changelog viewer. `CHANGELOG.md` exists but there is no in-guide component for browsing version history. A consumer looking for what changed has to read the markdown file | OPEN | grep over index.html |
| BY2-X12 | No onboarding/empty-state component. The system has `c-empty` (empty state) but no onboarding flow, no first-run experience, no guided tour. A new user has no guided introduction to the system | OPEN | grep over src/css/ |

### 3.13 Future-proofing gaps

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY2-PF1 | No CSS nesting. CSS nesting is now widely available (Baseline 2023) and would reduce selector repetition and improve readability. The system's flat selectors are verbose but functional. Adopting nesting would be a significant refactor but would future-proof the codebase | OPEN | grep over src/css/ |
| BY2-PF2 | No `@scope`. `@scope` would provide component-level style encapsulation without shadow DOM, complementing the light-DOM approach. This is a future-proofing opportunity for a system that ships both light and shadow wrappers | OPEN | grep over src/css/ |
| BY2-PF3 | No view transitions. beyond_01 BY-33 is P3 (enhancement-only). View transitions are now Baseline (2024) and would provide smooth page transitions for the documentation site and dashboard | OPEN | beyond_01 BY-33 |
| BY2-PF4 | No scroll-driven animations. CSS scroll-driven animations are now available (Baseline 2024) and would provide scroll-linked reveals, parallax, and progress indicators without JavaScript | OPEN | grep over src/css/ |
| BY2-PF5 | No container query units (cqi, cqb). Container queries are used in 7 sites but only with `@container` rules, not with `cqi`/`cqb` units. Container query units would provide component-level responsive sizing | OPEN | grep over src/css/ |
| BY2-PF6 | No `:has()` beyond current usage. `:has()` is widely available and could be used for parent-based styling (e.g., `.c-card:has(.c-card__media)` for media cards). Currently used in 1 site (components.css:1620) | OPEN | grep over src/css/ |
| BY2-PF7 | No TypeScript strict mode enforcement. `gen-types.mjs` generates type definitions but there is no `tsconfig.json` with strict mode, no type checking in CI, and no `tsc --noEmit` gate. A consumer using TypeScript has no type safety guarantee | OPEN | ls *.json, tools/ |
| BY2-PF8 | No ESM-only option. The system still ships a classic script (`contour-wc.js`) alongside the ESM build. For a 1.0 in 2026, ESM-only would be defensible (all modern browsers support ESM). The classic script is a compatibility shim that adds bundle size | OPEN | package.json + build.mjs |
| BY2-PF9 | No `@layer` in consumer code. The system documents `@layer tokens, base, components, utilities` but does not provide a consumer-facing guide for how to add custom layers. A consumer who wants to override a component has no documented layer strategy | OPEN | AGENTS.md + README |
| BY2-PF10 | No design token versioning. The DTCG export has a `version` field but there is no semantic versioning for individual tokens, no deprecation markers on tokens, and no migration guide for token renames. A consumer upgrading from v1.0 to v1.1 has no token-level changelog | OPEN | dist/contour.tokens.json |

---


### 3.14 UI/UX polish and resilience gaps

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY2-U1 | No consistent breakpoint scale. 9 different width breakpoints (30rem, 40rem, 48rem, 52rem, 56rem, 60rem, 78rem, 40rem, 64rem) and 4 container query breakpoints (16rem, 20rem, 24rem, 46rem) with no documented scale. A design system should have a documented, consistent set of breakpoints (e.g., sm/md/lg/xl) that all components use | OPEN | grep over src/css/ |
| BY2-U2 | No documented responsive strategy. There is no guide section explaining when to use media queries vs container queries vs fluid typography (clamp). A contributor adding a new component has no guidance on which approach to use | OPEN | grep over index.html, AGENTS.md |
| BY2-U3 | No touch gesture support beyond basic drag. No swipe, pinch, or multi-touch gestures. For a spatial interface (maps, dashboards), touch gestures are essential. The `@media (pointer: coarse)` block only enlarges drag handles | OPEN | grep over src/css/, src/js/ |
| BY2-U4 | No focus restoration for all overlays. Dialogs restore focus (feedback.mjs:72) but command palette, drawer, sheet, and tooltip may not. A user who opens and closes an overlay should return to the element that triggered it | OPEN | grep over src/js/wc/feedback.mjs, navigation.mjs |
| BY2-U5 | No error boundary. There is no component-level error handling. If a component's render() throws, the entire page may break. A design system should provide a graceful fallback (e.g., `c-error-boundary` or a try/catch in the base class) | OPEN | grep over src/js/wc/core.mjs |
| BY2-U6 | No inline form validation UX. Forms have no inline validation (no `aria-invalid`, no error message display on blur, no success state). A user who submits an invalid form gets no feedback until submission | OPEN | grep over src/js/wc/forms.mjs |
| BY2-U7 | No form error summary. There is no component for summarizing form errors at the top of a form. A user with multiple errors has to find each one individually | OPEN | grep over src/css/, src/js/wc/ |
| BY2-U8 | No search results highlighting. The command palette filters results but does not highlight the matching text. A user scanning results cannot see why a result matched | OPEN | grep over src/js/ds.js |
| BY2-U9 | No data table alternative for charts. Charts have accessible names (chart-names gate passes) but no data table alternative beside the image. A screen reader user cannot access the underlying data | OPEN | grep over src/js/wc/data.mjs |
| BY2-U10 | No keyboard shortcut documentation in the guide. Shortcuts exist (command palette, tabs, etc.) but there is no guide section listing all keyboard shortcuts. A user has to discover them by trial and error | OPEN | grep over index.html |
| BY2-U11 | No toast positioning flexibility. Toasts exist (`c-toast`, `#toast-host`) but positioning is fixed (bottom-right). A consumer who wants top-center or bottom-left has no option | OPEN | grep over src/css/, src/js/ds.js |
| BY2-U12 | No modal stacking. `modalContain` uses a depth counter (BY-46) but there is no visual stacking (z-index management) for multiple open modals. A user who opens a dialog from a dialog has no visual hierarchy | OPEN | grep over src/js/wc/behaviours.mjs |
| BY2-U13 | No animation timing consistency. Transitions use various durations (`--dur-fast`, `--dur-base`, `--dur-slow`) and easings (`--ease-standard`, `--ease-decelerate`, `--ease-accelerate`) but there is no documented convention for which to use when. A contributor adding a new component has no guidance | OPEN | grep over src/css/ |
| BY2-U14 | No color blindness testing in CI. CVD filters exist (`src/svg/cvd-filters.svg`) but are not referenced in any gate or specimen. A design system that claims "no chart asks you to tell two colours apart" should test under CVD | OPEN | grep over tools/, index.html |
| BY2-U15 | No infinite scroll component. No component for infinite scrolling lists. A dashboard with a long activity feed has no built-in infinite scroll | OPEN | grep over src/js/wc/ |
| BY2-U16 | No pull-to-refresh component. No component for pull-to-refresh on mobile. A mobile dashboard user has no way to refresh data | OPEN | grep over src/js/wc/ |
| BY2-U17 | No skeleton consistency. Skeletons exist (`c-skeleton`) but not all components use them. Some components show nothing while loading, others show a spinner. A consistent loading experience requires all async components to use skeletons | OPEN | grep over src/js/wc/ |
| BY2-U18 | No empty state consistency. Empty states exist (`c-empty`) but not all components use them. Some components show nothing when empty, others show a message. A consistent empty experience requires all data components to use empty states | OPEN | grep over src/js/wc/ |



### 3.15 Web component polish and batteries-included gaps

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY2-W1 | `content.mjs`, `dashboard.mjs`, `docs.mjs`, `layout.mjs`, `misc.mjs` have **0 event emission**. Interactive components (steps, showcase, diff, do/dont, tabs, accordion, btn-group, range-scale, time-range, activity, advanced, affordance) do not emit `contour:*` events. A consumer cannot observe state changes without polling attributes | VERIFIED | grep over src/js/wc/ |
| BY2-W2 | `docs.mjs`, `layout.mjs`, `misc.mjs` have **0 ARIA attributes**. Components in these files (docs-nav, docs-shell, app, app-body, btn-group, range-scale, time-range, reserved, theme-scope, activity, advanced, affordance, affordances) lack ARIA roles, states, and properties. This is an accessibility gap for a 1.0 | VERIFIED | grep over src/js/wc/ |
| BY2-W3 | `content.mjs`, `dashboard.mjs`, `docs.mjs`, `layout.mjs`, `misc.mjs` have **0 keyboard handlers**. Interactive components (steps, showcase, btn-group, range-scale, time-range, activity) do not support keyboard navigation. A keyboard user cannot interact with these components | VERIFIED | grep over src/js/wc/ |
| BY2-W4 | `layout.mjs` uses **inline styles** in `ContourApp` (`el.style.padding`, `el.style.fontWeight`), `ContourAppBody` (`el.style.padding`), and `ContourThemeScopeFull` (`el.style.padding`, `el.style.fontWeight`). This violates the spacing rule (inline styles end up in snippets) | VERIFIED | grep over src/js/wc/layout.mjs, misc.mjs |
| BY2-W5 | `layout.mjs` has **placeholder content**: `ContourBtnGroup` hardcodes button labels `["One", "Two", "Three"]`. This is a placeholder, not a real component. A consumer gets dummy buttons | VERIFIED | src/js/wc/layout.mjs:36 |
| BY2-W6 | `layout.mjs` and `misc.mjs` **strip text nodes and spans** destructively: `ContourRangeScale`, `ContourTimeRange`, `ContourAdvanced`, `ContourAffordances` remove all text nodes and spans on render. This destroys authored content | VERIFIED | grep over src/js/wc/layout.mjs, misc.mjs |
| BY2-W7 | `content.mjs` has **no event emission** for `ContourSteps` (step navigation), `ContourShowcase` (media toggle), `ContourDiff` (diff toggle), `ContourDoDont` (toggle). These are interactive components that should emit `contour:*` events | VERIFIED | grep over src/js/wc/content.mjs |
| BY2-W8 | `content.mjs` `ContourSteps` has **no keyboard navigation** (no keydown handler). A user cannot navigate steps with arrow keys | VERIFIED | grep over src/js/wc/content.mjs |
| BY2-W9 | `content.mjs` `ContourShowcase` has **no keyboard navigation** for media toggle. A user cannot toggle media with keyboard | VERIFIED | grep over src/js/wc/content.mjs |
| BY2-W10 | `content.mjs` `ContourDiff` has **no keyboard navigation** for diff toggle. A user cannot toggle diff with keyboard | VERIFIED | grep over src/js/wc/content.mjs |
| BY2-W11 | `content.mjs` `ContourDoDont` has **no keyboard navigation** for toggle. A user cannot toggle do/dont with keyboard | VERIFIED | grep over src/js/wc/content.mjs |
| BY2-W12 | `misc.mjs` `ContourActivity` has **no event emission** for item clicks. A user cannot observe which activity item was clicked | VERIFIED | grep over src/js/wc/misc.mjs |
| BY2-W13 | `misc.mjs` `ContourActivity` has **no keyboard navigation** for item selection. A user cannot navigate activity items with keyboard | VERIFIED | grep over src/js/wc/misc.mjs |
| BY2-W14 | `misc.mjs` `ContourAdvanced` has **no event emission** for profile toggle. A user cannot observe profile changes | VERIFIED | grep over src/js/wc/misc.mjs |
| BY2-W15 | `misc.mjs` `ContourAffordance` has **no event emission** for demo interaction. A user cannot observe affordance interactions | VERIFIED | grep over src/js/wc/misc.mjs |
| BY2-W16 | `docs.mjs` `ContourDocsNav` has **no ARIA attributes** (no `aria-current`, no `aria-expanded` for nested items). A screen reader user cannot navigate the docs nav | VERIFIED | grep over src/js/wc/docs.mjs |
| BY2-W17 | `docs.mjs` `ContourDocsNav` has **no keyboard navigation** (no arrow keys, no Enter/Space). A keyboard user cannot navigate the docs nav | VERIFIED | grep over src/js/wc/docs.mjs |
| BY2-W18 | `docs.mjs` `ContourDocsShell` has **no ARIA attributes** (no `aria-labelledby` for title, no `role="main"` for article). A screen reader user cannot navigate the docs shell | VERIFIED | grep over src/js/wc/docs.mjs |
| BY2-W19 | `dashboard.mjs` `ContourDashToolbar` has **no event emission** for action button clicks. A user cannot observe which action was clicked | VERIFIED | grep over src/js/wc/dashboard.mjs |
| BY2-W20 | `dashboard.mjs` `ContourDashToolbar` has **no keyboard navigation** for action buttons. A user cannot navigate actions with keyboard | VERIFIED | grep over src/js/wc/dashboard.mjs |
| BY2-W21 | `dashboard.mjs` `ContourDashFreshness` has **no event emission** for freshness updates. A user cannot observe when freshness changes | VERIFIED | grep over src/js/wc/dashboard.mjs |
| BY2-W22 | `dashboard.mjs` `ContourDashKpiRow` has **placeholder content** (hardcoded "42"/"KPI"). This is a placeholder, not a real component | VERIFIED | src/js/wc/dashboard.mjs:60-66 |
| BY2-W23 | `layout.mjs` `ContourBtnGroup` has **no event emission** for button clicks. A user cannot observe which button was clicked | VERIFIED | grep over src/js/wc/layout.mjs |
| BY2-W24 | `layout.mjs` `ContourBtnGroup` has **no keyboard navigation** for button selection. A user cannot navigate buttons with keyboard | VERIFIED | grep over src/js/wc/layout.mjs |
| BY2-W25 | `layout.mjs` `ContourRangeScale` has **no event emission** for range changes. A user cannot observe range changes | VERIFIED | grep over src/js/wc/layout.mjs |
| BY2-W26 | `layout.mjs` `ContourRangeScale` has **no keyboard navigation** for range adjustment. A user cannot adjust range with keyboard | VERIFIED | grep over src/js/wc/layout.mjs |
| BY2-W27 | `layout.mjs` `ContourTimeRange` has **no event emission** for time changes. A user cannot observe time changes | VERIFIED | grep over src/js/wc/layout.mjs |
| BY2-W28 | `layout.mjs` `ContourTimeRange` has **no keyboard navigation** for time adjustment. A user cannot adjust time with keyboard | VERIFIED | grep over src/js/wc/layout.mjs |
| BY2-W29 | `misc.mjs` `ContourAdvanced` has **no keyboard navigation** for profile toggle. A user cannot toggle profile with keyboard | VERIFIED | grep over src/js/wc/misc.mjs |
| BY2-W30 | `misc.mjs` `ContourAffordance` has **no keyboard navigation** for demo interaction. A user cannot interact with affordance demo with keyboard | VERIFIED | grep over src/js/wc/misc.mjs |



---

### 3.3 Part 3 — beyond_03 (wc behaviour, interaction states, responsive, interop, guide DX, SOTA; source snapshot HEAD d4289da)

Legend: **VERIFIED** = author re-derived from source/gate this pass · **SOURCE** = sub-agent rule-read with file:line, structurally sound, not author-re-read · **NEEDS PROBE** = mechanism certain from the rules, rendered result wants a browser · **RESOLVED** = fixed in-flight during this audit window · **PARTIAL** = landed but incomplete · **POSITIVE** = verified-clean.

### 3.1 Responsive contract and pixel-level resilience (report: `beyond03-responsive.md`)

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BR3-1 | **320 px WCAG floor breached 22 px on index.html, both themes** (scrollW 342 vs 320), masked by `body { overflow-x: hidden }` (base.css:61). Carrier: `.c-chart__plot` 293 px — `aspect-ratio: 16/7 × min-block-size: 8rem` (components-data.css:519-533) transferred into `.c-chart`'s implicit auto grid column (:561-566, no `grid-template-columns`); co-carrier: unclipped `pre.hljs` 293 px in `#docs`; all three chart specimens in `#data` measured at right=342 | **VERIFIED** | my gate run reproduced the NOTED verbatim; components-data.css read; responsive probes p1/p3/p4 |
| BR3-2 | The gate's own advisory names the wrong culprit: "widest: table.c-table in #recipes right=725 (clipped by div.c-table-wrap)" — bisect proved hiding `#recipes` leaves scrollW at 342; the extenders are unclipped | **VERIFIED** | my gate run output; probe p3 bisect |
| BR3-3 | Guide open-dialog specimen hard-codes `inline-size: 20rem` (index.html:11166 with the escaped copy at 11192) — beats the component's 288 px cap at 320, measured right=340 | **VERIFIED** | grep + probe p4 |
| BR3-4 | Breakpoint scale, quantified for BY2-U1: 16 width-media rules over **9** distinct values {30,40,48,52,56,60,64,68,78}rem and 6 `@container` rules over **5** values {16,20,24,40,46}rem (BY2-U1 missed the table's 40rem named-container rule and 68rem); only two mobile-first `min-width` rules exist (c-chart-grid `>=40rem`, `>=64rem`) | **VERIFIED** | my greps + full table in report (a1)/(a2) |
| BR3-5 | `.c-chart` has no `grid-template-columns` — its implicit auto column is content-driven; the systemic pattern behind BR3-1 | **VERIFIED** | components-data.css:561-566 read |
| BR3-6 | Rem discipline clean: 0 px `font-size` in all 14 src sheets; the 11 `clamp()` uses are display-scale only | **VERIFIED** | grep |
| BR3-7 | Templates share the query values by construction: zero `@media`/`@container` of their own (templates/map.html:43 `container:` is a MapLibre JS option) | **VERIFIED** | grep |
| BR3-8 | No nowrap blowouts at 320/390 after chasing all 30 nowrap sites (header nav hidden <60rem, tabs scroll container, table wraps, segmented min-width:0 + anywhere) | **VERIFIED** | probes p1/p2 + wrap inventory |

### 3.2 Interaction-state polish — CSS (report: `beyond03-uiux-css.md`)

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY3-U5 | **Forced-colors coverage is one block deep**: utilities.css:264-291 (16 blocks + `forced-color-adjust: none` on 3 button variants). Switch/check/radio/range/tabs/segmented/command/menu/toolbar/pagination, all five close buttons, map controls, legend, combobox, tree have **zero** forced-colors rules — custom-drawn checked fills risk collapsing to environment colours | **VERIFIED** | utilities.css read; grep for other `forced-colors` blocks = 0 |
| BY3-U1 | Disabled switch/checkbox **never visually disables**: utilities.css:490-491 targets `.c-switch__track`/`.c-check__box` — spans generated by forms.mjs:187-189/236-238. The sheet paints the track on the input itself (forms.mjs:182 comment), and the `appearance:none` input has no disabled rule and is absent from the components.css:3249-3256 disabled list | **VERIFIED** | utilities.css + forms.mjs + functions read; my grep showed the spans have no other CSS reference |
| BY3-U2 | Double focus ring on every text control: `.c-input/.c-select/.c-textarea:focus` paints a 2 px box-shadow + 4 px halo with **no `outline: none`** (components.css:1772-1779), stacking on the base `:focus-visible` outline (base.css:134); `[aria-invalid]:focus` (:1785-1787) adds a third 3 px danger ring | **VERIFIED** | both rules read |
| BY3-U3 | Command palette search field has **zero focus indicator**: `outline: none` with no replacement ring (components-shell.css:123-131) — the system's primary keyboard surface is ringless (WCAG 2.4.7) | **VERIFIED** | read |
| BY3-U4 | Range slider hover/focus is WebKit-`-thumb`-only (:1877/:1881-1885); the single `-moz-range-thumb` rule (:1868) is a base style, not a ring — Firefox users get the bare rectangle with no knob ring and no hover scale | **SOURCE** | components.css read (webkit 3, moz 1) |
| BY3-U6 | Drawer stacks **under** the sticky header: `--z-drawer: 300` (components-data.css:1097) vs `--z-header: 400` (components.css:85; tokens.css:222-227) — a drawer's head and close button are occluded on header-bearing pages | **VERIFIED** | tokens.css + components-data.css read |
| BY3-U7 | `-webkit-tap-highlight-color` never reset (0 hits in src/css) — default iOS flash on every control despite the shipped `@media (pointer: coarse)` block | **VERIFIED** | grep |
| BY3-U8 | Press language inconsistent: btn lifts -1px and returns on active (:183-191), card lifts -3px with no press-back (:1199), pressable presses down (:535-540); ~50 interactive classes have no `:active` | **SOURCE** | matrix + reads |
| BY3-U9 | Eight interactive controls flip state instantly with no transition while siblings animate 180 ms: alert/dialog/sheet/drawer close buttons, coordinate copy, time-slider play, pagination link, combobox option | **SOURCE** | matrix rows |
| BY3-U10…U17 | Polish cluster: dead track/box selectors won't die until U1; z-index fallbacks contradict the scale (`var(--z-toast, 900)` :529, `var(--z-tooltip, 100)` :620) and `.c-comparison__*` hardcode 1/2; raw `linear` at 3 spin sites escapes `--ease-*`; `[aria-disabled]` sets `cursor: not-allowed` **and** `pointer-events: none` so the cursor never renders; a second raw letter-spacing scale (15 sites) and raw rem sizes bypass `--tracking-*`/`--type-*`; long-value guards missing on stat/meter/badge/legend; no `overflow-wrap`/`hyphens` on prose; tab/code rings clipped by overflow strips | **SOURCE** | report tables §2-§5 |
| Positive | Dark parity token-true (no raw colour outside alpha masks), reduced-motion complete (global collapse + `[data-motion]` pauses), selection/caret basics, negative-z bands isolation-contained, sticky/scroll offsets correct | **VERIFIED** | report §6 + my greps |

### 3.3 Web-component behavioural correctness (report: `beyond03-wc-behaviour.md`)

| ID | Finding | Status | Evidence |
|---|---|---|---|
| B3-05 | **Authored light-DOM content is destroyed on the first attribute re-render**: core.mjs:288-299 drops generated nodes, then re-derives `_contourAuthored.nodes` from direct children — but ContourPanel moved the authored children into a generated `.c-panel__body` (content.mjs:554-562), ContourCode into a generated `pre` (:645-650), ContourDialog into `.c-dialog__body` (feedback.mjs:31-34), so the drop carries them away and `authoredNow = []` forever | **VERIFIED** | my reads of all four sites |
| B3-01 | **Table pagination buttons are dead**: the click handler sets `this._page`/`_pageAttrLast` but never the observed `page` attribute (data.mjs:481-485; `setAttribute("page"` = 0 hits), so the render sync (:302-307) nulls `_page` and snaps back; `contour:page {page:2}` fires while the UI shows page 1 | **VERIFIED** | my reads + grep |
| B3-02 | **Removing an open dialog/drawer/sheet leaks the modal lock forever**: `modalContain(this, true)` (feedback.mjs:57/492/559) is unlocked only inside `close()` (69/499/566); the module-level `modalDepth`/`modalInerted` singleton (behaviours.mjs:635-676) stays wedged — no `disconnectedCallback` releases it (the file's only two disconnect hooks null content refs) | **VERIFIED** | my reads + grep |
| B3-03 | **Chart double keydown, conflicting payloads**: two host keydown listeners — mark-level Enter/Space and point arrows emit `{series, index}` (data.mjs:748-781), then a series-level listener with no `e.target` gate (:788-806) emits `{series}` for the same Enter and spurious `{series}` selects on arrows | **VERIFIED** | my read of both listeners |
| B3-04 | **Focusable marks inside `aria-hidden`**: chart svg carries `aria-hidden="true"` (data.mjs:619/644) while its `role="button" tabindex="0"` rects/circles (:633-635/:652-657) are keyboard-reachable but invisible to AT — phantom tab stops behind a presentational fence | **VERIFIED** | my reads |
| B3-06 | **Form state wiped by any observed-attribute re-render**: the base saves only `value`, never `checked` (core.mjs:273-274), and the restore (core.mjs:318-345) sets `el.value` only when empty; switch/check rebuild unchecked (:183-185) and the range render overwrites the drag with `getAttribute("value") ‖ "50"` every pass (:126-127). B3-14 confirms host `checked` is read only in `formResetCallback` (core.mjs:503) | **VERIFIED** | my reads |
| B3-07 | Command Enter double-emits `contour:select`: `its[cursor].click()` **and** a direct dispatch (navigation.mjs:609-610), plus the click listener (:616-626) dispatches again | **VERIFIED** | my read |
| B3-08 | Menu has no tab stop: `wireMenu` forces every `[role=menuitem]` to `-1` and nothing stamps a `0` (behaviours.mjs:541-543) — contrast wireTabs/wireTree/wirePagination | **VERIFIED** | my read |
| B3-09 | Layer-panel visibility state silently discarded: `toggle.checked` re-derived per render (map.mjs:79-93), so a `loading` flip after a src load re-checks what the user un-checked; emitted `contour:layer-visibility` then contradicts the UI | **SOURCE** | report + extenders |
| B3-10 | Tabs/code-tabs selection resets to tab 0 on every rebuild and overrides author marking (navigation.mjs:89-101/:285-296; behaviours.mjs:121-123), and wireTabs emits no activation event (`dispatchEvent` count 0 in :124-170) | **SOURCE** | report reads |
| B3-12 | Drawer/sheet lack the dialog's Escape, focus-in and focus-restore; no accessible name on any of the three (0 `aria-labelledby` in feedback.mjs) | **VERIFIED** | my grep + reads |
| B3-15 | Radio-list default name collides across instances: `input.name = name ‖ 'radio-list'` (forms.mjs:555) — two un-named hosts can form one native radio group | **SOURCE / NEEDS PROBE** | mechanism read; cross-instance grouping spec-inferred |
| B3-16 | Roving `tabindex` with no roving keydown in hexbin/flow-map/isochrone cells (map.mjs:221/296/379) — the -1 tail is unreachable | **SOURCE** | report reads |
| B3-17 | Command palette is not a combobox to AT: plain-div items, no listbox/option/activedescendant; Home/End missing (navigation.mjs:525-562/:599-614) | **SOURCE** | report reads |
| B3-18 | Blacklist sanitizers still leak: content.mjs:338 strips only `on\w+="…"` (double-quoted); :411/:498 and docs.mjs:102 remove only script/iframe/object/embed — single-quoted and unquoted handlers and `href="javascript:…"` survive. **Extends BY2-C10** | **SOURCE** | report regex reads |
| B3-19 | Docs-nav default masks empty states: the `remoteData ‖ placeholder` default (docs.mjs:17-18) is always truthy, so both `!items` arms incl. `renderEmpty` are dead | **SOURCE** | report |
| B3-21 | Shadow slotWrapper buttons lack `type="button"` (shadow.mjs:190-192/246-248/263) while the structured templates (:260/284/292-293) set it — inside a form they default to submit | **SOURCE** | my grep (template rows verified; slotWrapper rows cited) |
| B3-22…B3-33 | Polish cluster: copy-confirmation timer uncancelled and fires against detached nodes (:626-633); per-site payload divergence under one manifest name (`contour:select` = series+index / index / empty / value; `contour:retry` has no detail at 5 of 6 sites); `watchViewport` has zero adopters while `remoteVisible` opens one IntersectionObserver per render; per-mousemove `getBoundingClientRect` in chart tips; svg geometry emits NaN/Infinite on empty/zero input (svg.mjs:70/93/119); chart-grid and drop-zone strip authored slots and observe `title` it never reads; time-slider play was decorative at HEAD 226f03a (below: RESOLVED by BY-27); `c-expandable` summary gets the disclosure's element class; chip/tag/pill/spinner forced `role="status"`; segmented retry timer not claim-guarded | **SOURCE / RESOLVED (B3-30 half)** | report reads + my verification of the BY-27 landing |
| B3-30 | Time-slider play was decorative (no interval, no emission, re-render resets) **until `d4289da`**: `setInterval(step, 1000)` (map.mjs:184) + `contour:time-change {value}` (:162) now land — the play-state-persistence half needs a re-check against the re-render path | **PARTIAL** | my greps before/after the commit |
| Positive | Fully covered families: tree (keyboard+ARIA+roving as a unit), light-dialog state machine, pagination roving, segmented, combobox light+shadow parity, the ElementInternals lifecycle (reset/disabled/bfcache/validity), loader abort/cache/refresh/dispose, `contourId` monotonic ids | **VERIFIED** | matrix + wc-contract 1348 |

### 3.4 Interop and wiring readiness (report: `beyond03-interop.md`)

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY3-I1 | **Tailwind v4 bridge maps 5 non-existent tokens**: `--color-surface` (theme.css:21), `--color-surface-sunken` (:23), `--radius-full` (:44), `--duration-fast` (:61), `--duration-base` (:62) — `grep -e` vs tokens.css = 0 for all five (system ships `--color-surface-1/2/3`, `--color-canvas-sunken`, `--radius-pill`, `--dur-*`). The `@theme` CSS-first API itself is v4-correct; `bg-surface`, `rounded-full`, `duration-fast/base` resolve to nothing | **VERIFIED** | my greps both sides |
| BY3-I2 | **Style Dictionary config cannot consume its own source**: `source: ../../dist/contour.tokens.json` is a DTCG 2025.10 Format document (`$value`/oklch `colorSpace`), but the config uses classic transformGroups (`ios-swift`/`android`/`flutter`) with no DTCG parser/transform (only the 3 `transformGroup` strings; no parsers/usesDtcg). Generators don't read validators' documents — the memory & DTCG-tool reality corroborate | **VERIFIED** | config read; tokens doc shape |
| BY3-I3 | **No map-engine seam and no seam recipe**: 0 attributes/properties accept a map instance (setMap/attachMap/getMap = 0 in src/js/wc); all 15 map components are attribute/JSON readouts; map-chrome.css is a manual-link sheet (map-chrome.css:17-25); README:30-32 publishes the `@import` recipe but zero sample shows a component mounted on a live engine (map-mounting samples: 0 across README/guide/llms); engine-scope creep is **zero** (no maplibre/mapbox/leaflet imports, no GeoJSON) — the boundary holds; the wiring math is missing | **VERIFIED** | my greps + report §1/§8 |
| BY3-I4 | Vocabulary drift, measured live: 4 manifest names un-emitted at 14:08 (check-wc FAIL) → all 4 emitted after `d4289da` (stream-state/tick at data.mjs:907/912; legend-toggle data.mjs:1304-1311; time-change map.mjs:162) → check-wc PASS. The gate works; nothing else does this job | **RESOLVED** | my 3 run timeline this pass |
| BY3-I5 | The §23 event table is **hand-maintained and un-gated**: check-wc gates manifest↔emission but no gate reads the guide table; it drifted 4 rows inside this audit window and was healed in-flight (30/30 at write time). The next drift will not be caught | **PARTIAL** | my index.html:11491-11525 read + check-wc source |
| BY3-I6 | **Zero event-consumption documentation**: 5 import quickstarts (README:166-236), 0 wiring recipes — no `addEventListener` sample, no React `on`-/ref note, no composed-through-shadow sentence (all 0 in README, guide, llms). "Drops into any framework without an adapter" is true for import, empty for observe | **VERIFIED** | my greps (README addEventListener = 0) |
| BY3-I7 | Types omit the event surface: `contour.d.ts` has 1 `contour:` occurrence, no CustomEvent detail map, no `window.ContourEvents` type, one generic `ContourElement` for all ~300 tags (by documented design, wc-names.mjs:44-50); subpath wc exports carry no types condition | **VERIFIED** | my grep + report §5 spot-check |
| BY3-I8 | Premature CDN URLs ship in the README and the v0 prompt: README.md:4 (badge)/:235-236 (the primary quickstart snippet), v0-prompt.md:29 — all `cdn.jsdelivr.net/npm/contour-ds/...` for a package that is private until v1.0 (they 404 today). Extends BY2-D14 (which named only the prompt) | **VERIFIED** | my greps |
| BY3-I9 | `contour-ds/agent-rules.json` (v0-prompt.md:69) is **not an export key** — the file ships in dist, the specifier does not resolve; CLAUDE.md uses the raw dist path correctly | **SOURCE** | exports map vs prompt |
| BY3-I10 | README.md:378 names `integrations/ai/.cursorrules`, which does not exist (the dir ships CLAUDE.md + v0-prompt.md only) | **SOURCE** | ls |
| BY3-I11 | `contour:retry` is emitted with no detail at 5 of 6 sites (data.mjs:464/785/1355/1447/1622) while the manifest declares `["src"]` (states.mjs:511 passes `{src}`) — union-consistent, consumer-hostile | **VERIFIED** | report diff + my reads |
| BY3-I12 | Contract-listed-but-unstyled controls: `globe`/`terrain` appear in map-chrome-contract.json maplibre families with no rule in map-chrome.css; logo is deliberately exempt (Mapbox terms) and documented | **SOURCE** | contract vs sheet |
| BY3-I13 | `contour.components.json` carries no slot info (`"slots"` = 0); registry items are style bundles with no per-item schema — fine for CSS codegen, nothing for JS/API adoption | **SOURCE** | grep + registry read |
| Positive | The seam discipline is exemplary on the out-of-scope side: zero engine imports, zero GeoJSON rendering, chart geometry self-contained (svg.mjs) — the system never steps on the map libraries' turf | **VERIFIED** | my greps |

### 3.5 The guide as the product (report: `beyond03-guide.md`)

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY3-A | **0 of 159 `contour-*` elements have a structured attribute/property reference**: 0 `<dl>`, 0 `<th>Attribute`, 2 `ds-spec__desc` in the whole guide (0 in §23), exactly 1 `<table>` in §23 (the shared event table). Consumers reverse-engineer attributes from snippets; the inventory already carries `inputs`/`vars` the guide never renders | **VERIFIED** | my greps |
| BY3-B | **Async `src` contract has zero specimen coverage**: no `<contour-* src= loading= error= empty= skeleton=>` attribute anywhere; only the vocabulary rows in the event table. beyond_01 F-27 / BY-12 still open | **VERIFIED** | my grep on contour tags |
| BY3-C | **27 inventory variant classes are dead everywhere** (117 inventoried minus guide/JS/patterns occurrences): c-box long aliases (-s/-m/-l/-xl/-small/-medium/-large/-xlarge/-scroll), c-card--accent/-flat/-interactive/-raised, c-container--border, c-drop-zone--reject, c-map-panel--center/-vertical, c-mark--lg/-solid, c-resize-handle--snapping, c-row--wrap, c-sparkline--accent, c-stack--sm/-lg, c-stat--inline, c-toast--danger/-success. Extends BY2-C9 (~20). Counter-example verified: `c-box--border` is alive in specimens | **VERIFIED** | my grep samples (8 names = 0 in guide, defined in src) + report §2 |
| BY3-D | **No in-page navigation at 390 px**: rail hidden <68rem (docs.css:105-107), header nav hidden <60rem (components.css:141-144), 0 hamburger, 0 back-to-top — orientation is footer + ⌘K search | **VERIFIED** | my greps |
| BY3-E | **"~21 kB gzipped" is an unowned hand-written claim** (index.html:7863 in the §15 cohort table; repeated in llms-full.txt): check-size.mjs:216 admits every "kB gzipped" sentence is hand-written because no tool here ever computed one; the closest measured artifact is contour-docs.min.css at 21.3 kB gz | **VERIFIED** | index.html read + check-size.mjs read + my gate numbers |
| BY3-F | No form invalid/error state demonstrated anywhere: `aria-invalid` = 0 across the guide, though the CSS exists (components.css:1785) | **VERIFIED** | my grep + gate |
| BY3-G | §23/data panel prose is unmeasured: `.c-panel__body` paragraphs run a full ~61 rem column vs the 46–68 ch caps elsewhere; no `hyphens`/`overflow-wrap` on prose | **SOURCE** | report §7 |
| BY3-H | Specimen-heading search reach: only 3 id'd h2/h3; `data-command-action` = 0; the palette's only `data-command-nav` list is a docs-nav *demo* specimen (index.html:10185) | **VERIFIED** | my grep (3 id'd headings) + report |
| BY3-I | The `?` shortcut overlay exists (6 rows, index.html:16348-16373) but is **undiscoverable**: only reachable by pressing the key it documents, no visible hint, `aria-keyshortcuts` = 0 | **VERIFIED** | my greps + read |
| BY3-J | No `content-visibility` on the specimen grid — removed by design: docs.css:1208-1216 documents that collapsing `.section` broke rail anchor navigation; only sunken/raised/open-disclosure sections set `content-visibility: visible` | **VERIFIED** | docs.css read |
| BY3-K | Install is §22 of 24 (index.html:11255); no visual index or quick-start band near the top — a new consumer scrolls ~11 k lines or must know ⌘K | **VERIFIED** | my grep |
| BY3-L | Predecessor corrections: **BY2-U8 CONTRADICTED** — search-result `<mark>` highlighting exists (ds.js:682-693 creates `c-command__mark`, styled at components-shell.css:228). **BY2-U10 CONTRADICTED in letter** — the shortcut overlay exists but is hidden (see BY3-I) | **VERIFIED** | ds.js read + greps |
| Positive | Identity execution is clean: generated isoline hero instrument, chart-paper mask, ridgelines, waypoint mark, mono labels, `.impeccable.md` colour discipline holds (8 oklch literals are the deliberate theme-pair cards), no AI-slop signatures (no generic gradients, no glass grids), prose voice consistent and measured | **VERIFIED** | report §10 + spot reads |

### 3.6 Pass-level measurements and SOTA verification

| ID | Finding | Status | Evidence |
|---|---|---|---|
| BY3-X1 | **check-wc is a live tripwire, and its status flips with the tree**: FAIL at 14:08 (4 dead manifest names) → PASS by ~14:30 once BY-27/40/41 landed emitters. A single-run gate status on a concurrently-edited tree is not assertable; the important fact is the drift existed and the gate caught it | **VERIFIED** | my 3 runs + git log (d4289da) |
| BY3-X2 | **Size overrun update** (extends BY2-P1/P2): same 7 bundles; the wc ESM went 267.3 → 269.4 kB as BY-45 (event manifest) and BY-47 (copy confirmation) landed — the port's savings (BY-10) are now consumed by new surface. The budget comment is still the only dateless one in check-size.mjs:124 | **VERIFIED** | check-size outputs at 14:00 and 15:15 |
| BY3-X3 | **SOTA adoption set, dates verified**: `@starting-style` + `allow-discrete` — Baseline-Newly 2024-08 (Aug, Firefox 129), widely available Feb 2027 → BY-50 shippable now as enhancement-only (global reduced-motion kill-switch gates it). Same-document view transitions — Baseline 2025-10-14 → BY-33's view-transitions item is no longer "future". Scroll-driven animations — Chrome/Edge full, Safari partial, Firefox in development as of early 2026, Interop 2026 focus → **not** widely available; keep deferred. `light-dark()` — widely available 2026-11-13; DESIGN.md's pair is arithmetically correct, do not "fix". Anchor positioning — aggregate still `baseline: false` (`anchor-name` Newly 2026-01-13) → the `@supports` guard is right | **VERIFIED** | web-search primary sources (MDN, caniuse, web.dev, web-features) + the repo's re-derivation rule (wide = newly + 30 months) |
| BY3-X4 | Adoption context (verified stats for guide prose): zeroheight 2026 report (n=147, self-selected, no CI): "54% of teams have tokens in tools+code+docs" is the **intersection** of 90/82/66%; full adoption 7%, trust high+moderate 91%; 61% lack enough people; resourcing tops challenges at 56%. Do **not** cite "40% survive 18 months" or the Atlassian/Forrester numbers — no primary source exists | **VERIFIED** | the report's own published page, re-checked 2026-10-23; correction memory applied |
| BY3-X5 | Corrections to carried numbers: the 2026-10-24 "template 320 carriers" are gone (all five templates measure exactly 320 now — the guide is the only carrier); beyond_02's "6 dirty files" snapshot is superseded (tree committed and re-dirtied several times this pass); wc-contract grew 1333 → 1348 | **VERIFIED** | gate outputs this pass |

---

## 4. Corrections ledger (who owns the current truth)

### 4.1 In-source corrections (recorded in the sources themselves)

- beyond_01 §8 — 12 corrections (c-data-state withdrawn, CHANGELOG claim falsified, F-10/F-2/F-18 narrowed, 16/0 recount, 107 not 112, role=status = 2, four killed-by-measurement candidates, check-css 5-sheet glob): consult `tmp/beyond_01.md` §8.
- beyond_02 §8 — 12 corrections (source-verification results, falsified claims re-quantified): consult `tmp/beyond_02.md` §8.
- beyond_03 §7 — honesty + corrections (BY2-U8 and BY2-U10 re-derived, BY2-C9 extended, BY2-P1/P2 extended, template 320 carriers superseded): consult `tmp/beyond_03.md` §7.

### 4.2 Status overrides applied by this volume (measured 2026-10-28)

| ID | Was | Now | Evidence |
|---|---|---|---|
| BY-27 | ⬜ | ✅ | landed `d4289da`: time-slider play animates and emits contour:time-change (map.mjs:162/184) |
| BY-40 | ⬜ | 🟡 | interval/pause/contour:tick/contour:stream-state landed `d4289da` (data.mjs:843-844/907-912); remoteRefresh adoption still 0 (grep: only states.mjs) |
| BY-41 | ⬜ | ✅ | landed `d4289da`: legend items are aria-pressed buttons + contour:legend-toggle (data.mjs:1221/1245/1309-1311) |
| BY2-I1 | ✅ (open) | ⬜ (open) | re-verified 0 lanes in ci.yml for check-wc / doctor / gen-llms |
| BY2-U8 | ❌ (stale claim) | ➖ | contradicted: mark highlighting exists (ds.js:682-693, components-shell.css:228) |
| BY2-U10 | ❌ (stale claim) | ➖ | contradicted in letter: overlay exists (index.html:16348), undiscoverable — live half is BY3-I |
| BY2-C9 | ~20 variants | 27 (BY3-C) | exhaustive re-derivation in beyond_03-guide report |
| BY2-C10 | sanitizer gap | covered by B3-18 | single-quote/unquoted/javascript-href escape routes surveyed |
| BY-12 = F-27 = BY3-B | ⬜ | ⬜ (one task) | async-state specimens; consolidated into BY-12 in §5 |

### 4.3 Merge decisions (row left in the sources, action owned elsewhere)

| Source row | Owned by | Reason |
|---|---|---|
| BY2-C2..C5 | BY2-C1 | same fix (widen check-css scope), four surfaces |
| BY2-U1/U2 | BR3-4 | breakpoint-scale evidence quantified and the recommendation carried there |
| BY2-P1..P5, BY2-D9 | BY3-X2 | one size-resolution task owns all size overruns |
| BY2-G2 | BY-12 | async-contract documentation, same task |

## 5. Implementation plan (single merged table)

**Schema:** `Task ID | Status | Task | Priority | ROI | Risk | Effort | Notes`. Statuses use the fixed set: ✅ landed and measured this pass · 🟡 partial · ⬜ open · ⏰ deferred · ➖ resolved by deletion or consolidation · ❌ rejected (reason in the source row). Active queue first (⬜/🟡/⏰), sorted by priority; the closed ledger follows.

| Task ID | Status | Task | Priority | ROI | Risk | Effort | Notes |
|---|---|---|---|---|---|---|---|
| BY-09 | 🟡 | Error state announced and actionable | P1 | High | Med | S | beyond.md BY-06, beyond_00 BY-18 (part). Landed as host `aria-busy` + retry button + `contour:retry`; `role="alert"` deliberately dropped (contrast gate refuses a pre-populated live region). Record the divergence: adopters must not re-add `role="alert"` on the error node |
| BY2-C1 | ✅ | Widen check-css to scan all 14 sheets (or hold an explicit exclusion ledger with a reason per sheet). Audit the newly-scanned sheets for collisions and fix before 1.0 | P1 | Very high | Low | M | BY2-C2..C5 are the same fix seen from four surfaces (utilities/base/patterns/map-chrome overrides and base-level c-* furniture); keep the forced-colors/prefers-contrast overrides but scan them |
| BY2-D1 | ✅ | Resolve the README tarball claim vs the pack: either ship src/ in the tarball or correct the sentence | P1 | High | Low | S | npm pack --dry-run shows 102 entries, 0 under src/ (files = dist/, integrations/); decide with the ownership rule in view (a consumer takes src/) |
| BY2-I1 | ✅ | Add check-wc and doctor to CI; decide gen-llms as a --check lane | P1 | Very high | Low | M | measured 0 runs of all three in .github/workflows/ci.yml at HEAD d4289da; check-wc caught a live manifest drift this week — the lane that does not run cannot catch it again |
| BY3-A | ⬜ | Emit a per-element API card into §23 for all 159 contour-* tags: attributes with type/default/observed, events with payload keys, slots — generated from the inventory inputs/vars data | P1 | Very high | Med | L | currently 0 dl, 0 th-Attribute, 2 ds-spec__desc page-wide; the data exists in contour.components.json; docs budget needs revision (BY-43 measured about 77 B headroom) |
| BY3-I1 | ✅ | Rename the 5 phantom tokens in the Tailwind bridge to the shipped names and add a derivation gate that checks the bridge against contour.tokens.json | P1 | High | Low | S | contour-theme.css:21/23/44/61/62; bg-surface, rounded-full, duration-fast/base resolve to nothing today; the @theme API itself is v4-correct |
| BY3-I2 | ✅ | Make the native Style Dictionary config consume its own source: ship a DTCG-to-classic pre-transform or parser hook (or sd-transforms) for the value/oklch records, and document the required SD version | P1 | High | Med | M | config points classic transformGroups at a DTCG 2025.10 Format doc; validators read it, generators do not — the DTCG tool reality |
| BY3-U5 | ✅ | Extend forced-colors coverage to the custom form controls: forced-color-adjust none on state-carrying paint for switch/check/radio/range, or explicit media(forced-colors) rules mapping checked/selected to Highlight/CanvasText | P1 | High | Med | M | utilities.css:264-291 covers 16 blocks only; switch/check/radio/range/tabs/segmented/command/menu/toolbar/close buttons have none. Probe in forced-colors emulation before landing |
| BY3-X2 | ✅ | Resolve the 7-bundle check-size overrun with measurement, not a raised line: trim duplicated/legacy surface per artifact or re-budget with measured reasons | P1 | High | Med | M | BY-36's refusal stands; wc ESM grew 267.3 to 269.4 with BY-45/47 so the port's savings are consumed; doctor stays red while check-size fails |
| B3-01 | ✅ | Write the page attribute from the table pagination click handler (or stop nulling _page when only _pageAttrLast changed) so Next/Prev survives the render sync | P1 | Very high | Low | S | data.mjs:481-485 click vs :302-307 sync; today contour:page fires while the UI snaps back to the stale attribute |
| B3-02 | ✅ | Release the modal lock on DOM removal: register onDispose(host, () = modalContain(host, false)) in each overlay enhance (dialog/drawer/sheet) | P1 | High | Low | S | feedback.mjs:57/492/559 lock; close() alone unlocks; behaviours.mjs:635-676 singleton. Arm: remove an open host, assert scroll restores and inerted siblings release |
| B3-03 | ✅ | Merge the chart's two host keydown listeners into one with a target gate: the series-level branch only when e.target is the host itself | P1 | High | Low | S | data.mjs:748-781 vs :788-806; one Enter today fires contour:select twice with different detail shapes |
| B3-04 | ✅ | Make chart marks reachable and AT-visible: drop aria-hidden from the svg branch that owns the focusable role=button marks, or move the role off the host, so keyboard and screen reader agree | P1 | High | Low | S | data.mjs:612/619/634/644 aria-hidden vs :623-624/633-635/652-657 tabindex+role. Arm: focus a mark, assert it is exposed |
| B3-05 | ✅ | Rebuild authored light-DOM content without the drop-then-re-derive ordering: compute authoredNow from the pre-drop snapshot, or peel authored descendants out of generated wrappers by identity, so an attribute re-render cannot empty contour-panel / contour-code / contour-dialog bodies | P1 | Very high | Med | M | core.mjs:288-299 vs content.mjs:554-562/645-650 and feedback.mjs:31-34. Add a wc-contract arm: mount authored children, re-render, assert they survive |
| B3-06 | ✅ | Preserve user form state across re-renders: save and restore checked in the base (core.mjs:273-274), seed fresh switch/check inputs from host checked (forms.mjs:183-185 and the check/radio renders), and stop the range render from overwriting a dragged value (forms.mjs:126-127) | P1 | High | Med | M | includes B3-14 (host checked honoured outside formReset). Arm: flip a switch, change an unrelated observed attribute, assert still checked |
| BR3-1 | ✅ | Close the 320 px WCAG floor breach on the guide (scrollW 342 vs 320): grid-template-columns minmax(0,1fr) on .c-chart or move the aspect-ratio onto the inner svg; overflow-x auto on the unclipped #docs hljs pre; min() the open-dialog specimen | P1 | High | Low | S | carries BR3-3 and BR3-5; do not re-try max-inline-size/100 and min-inline-size/0 on the plot (measured non-binding); verify with check-reflow and the 320 strict flag |
| BY-26 | ⬜ | Real drag-and-drop: dragstart/dragover/drop + keyboard alternative | P2 | Med | Med | M | beyond_00 BY-16; F-21. Zero drag events exist |
| BY-28 | 🟡 | State-contract uniformity: catchment/compass empty branches; toc empty; docs-nav fallback; filter-bar reads what it observes | P2 | Med | Low | S | **Partial:** pagination String(_remotePages) fixed; tree loading attribute functional; catchment empty branch added; compass/docs-nav empty removed from observed; filter-bar cleaned. beyond_00 F-6 + this pass's NEW items (tree `loading` was inert at nav.mjs:302; pagination `String(_remotePages)` → one button, nav.mjs:617). The five states must mean the same thing everywhere |
| BY-29 | 🟡 | Composed expansion set: keyed rows + aria-live; command filter + combobox/listbox ARIA; menu submenus; tree lazy loads; breadcrumb max-items; tabs autoplay + aria-controls + contour:tab-change; toc scroll-spy; header scroll-state + mobile toggle | P2 | High | Med | L | beyond_00 BY-20. **Sweep-2 partial:** the table-sort item is **landed** (aria-sort written data.mjs:390/411/427, click :522, keydown :544, `contour:sort` emitted :512). **Landed this pass (WIP):** header scroll-state (`c-header--scrolled` + shadow, components.css) + mobile toggle (aria-expanded/controls, under 60rem); tabs autoplay (`autoplay`/`pause` attrs, setInterval, reduced-motion gated, hover/focus pause, onDispose); breadcrumb max-items (overflow button, `_overflowExpanded` flag outside OBSERVED); toc scroll-spy (IntersectionObserver, aria-current); command filter input listener + aria-live status region (keyed rows + visible count). Remaining: menu submenus (0 repo-wide), tree lazy loads. One render-contract row per item
| BY-32 | ✅ | `internals.states` custom states (`:data-invalid` / `:data-checked` / `:data-loading`) | P2 | Med | Low | S | beyond.md BY-21 |
| BY-40 | 🟡 | `contour-streaming-chart` live contract: `interval` attribute, `pause`, `contour:tick`/`contour:stream-state`; adopt `remoteRefresh` (0 adopters today) | P2 | Med | Med | M | Landed: `interval` + `pause` observed and reflected; enhance() runs the layer's first real timer — each tick emits contour:tick {frame} and, when src is present, revalidates through the loader's own cache path (remoteInvalidate + requestRender, the exact two steps the loader's refresh tick performs). pause stops the loop and emits contour:stream-state {running} on every start/stop; the timer is disposed via onDispose. Recorded divergence: the loader's `remoteRefresh` is driven by the `refresh` ATTRIBUTE, which a component must never write to itself — it is observed, so the write fires the attribute-changed callback and re-enters render (the browser gate caught exactly that, "observes AND writes to itself refresh"); the chart therefore adopts the loader's cache spin instead of the attribute, and the divergence is in the code comment. Measured (wc-contract arm 20, real browser, fresh dist): interval 0.5 → ≥1 tick in 1.25 s, stream-state running:true on start, pause → 0 further ticks. Gate: PASS — 1348 (was 1337; +11). §23 event table gained contour:tick + contour:stream-state |
| BY-48 | ⬜ | RTL parity: logical `inset-inline/block` for generated tips + `density` attribute on dense blocks | P2 | Med | Low | M | sweep-2 gap 10. 7 physical `left/top` tip sites vs the chart's logical `--chart-tip-*` tokens; 0 `dir=` reads; density = 0 in src. Modifier class, not a new primitive (layout ratchet) |
| BY2-A7 | ⬜ | Full RTL audit: logical properties, dir= reads, and the map-dashboard surfaces (spatial tools are often used in RTL locales) | P2 | High | Med | L | ACCESSIBILITY.md says RTL is structural only; BY-48 covers generated tips as a first slice |
| BY2-C11 | ✅ | Remove or fix the c-flow-map query for .c-flow-map__flow, which no JS ever generates | P2 | Med | Low | S | map.mjs:261/274 query, components-data.css:1608/1617 styles, zero generator; dead query + dead CSS |
| BY2-C12 | ⬜ | Replace the three placeholder components: contour-metrics 42/Metric, chart-grid's observed-but-unread title, contour-plot with no coordinates | P2 | Med | Med | M | data.mjs:1165/1168, 1638, 1655; chart-grid slot-stripping is covered by B3-28 |
| BY2-D3 | ✅ | Add a module field for the ESM twin so a consumer importing the package by name gets the intended entry | P2 | Med | Low | S | today the ESM entry is reachable only via exports subpaths |
| BY2-G1 | ✅ | Name the 4 unnamed shortcut blocks (c-shortcut-list/overlay/panel/row) in a guide section heading | P2 | Low | Low | S | dist/docs reports them in notNamedByAnySection; otherwise check-docs is byte-clean at 159/163 |
| BY2-G8 | ✅ | Fix or excuse the execute-docs snippet 160 failure (a code example containing a <dialog> tag name trips element-permitted-content) | P2 | Med | Low | S | a red mark in the gate output; restructure the example or record the exemption with a reason |
| BY2-I6 | ✅ | Add src/js/wc/* to build.mjs manifestSources so a wc-only change trips the stale-dist guard | P2 | Med | Low | S | beyond_01 BY-2 row; verified still open; pairs with BY2-I7 |
| BY2-I7 | ✅ | Assert wcFragNames against readdir(src/js/wc) so a new fragment cannot miss every surface bundle | P2 | Med | Low | S | build.mjs:276-280 fragment list is unasserted today |
| BY2-T1 | ✅ | Make one starter template exercise the wc layer (dashboard is the natural candidate) so a copying consumer sees the reactivity the layer sells | P2 | High | Med | M | landing/documentation/dashboard carry 0 contour-* elements and no wc script; smoke.html is the only one today |
| BY2-T2 | ✅ | Make templates/map.html use map-chrome + contour-map-* components, or correct the README sentence that calls it a live example | P2 | Med | Med | M | README:383 claim measured false (0 map-chrome, 0 contour- references in the template) |
| BY2-U17 | ⬜ | Skeleton/empty consistency: every async component paints the same state vocabulary (c-skeleton / c-empty / error) instead of spinner-or-nothing | P2 | Med | Med | M | extends BY-28 (state-contract uniformity); the CSS vocabulary exists (components.css:2649-2779) |
| BY2-U5 | ✅ | Add a component-level error boundary: a try/catch in the base render path that paints a styled fallback and reports, so one component cannot break the page | P2 | Med | Med | M | no error handling exists today; keep it small (no new subsystem) |
| BY2-U6 | ✅ | Inline form validation UX: aria-invalid + per-field error message on blur + a success path, demonstrated in the guide | P2 | Med | Med | M | forms have validity reporting but no visible inline feedback; BY3-F adds the guide specimen that goes with it |
| BY2-W7 | ⬜ | Adopt the interaction contract in the content/layout/misc/dashboard/docs families: keyboard per APG, ARIA roles, and contour events for steps/showcase/diff/do-dont/activity/advanced/affordance/docs-nav/docs-shell/dash-toolbar/dash-freshness/btn-group/range-scale/time-range | P2 | High | Med | L | group row for BY2-W7..W11, W12..W15, W16..W18, W19..W21, W23..W30; B3-08 (menu), B3-19 (docs-nav), B3-07/17 (command) already cover nearby families |
| BY3-C | ⬜ | Demo or delete the 27 never-used variant classes and ledger each in the inventory refusal ledger | P2 | Med | Low | M | extends BY2-C9; c-box--border is live (counter-example); check-components reads the artifact |
| BY3-D | ✅ | Add 390 px in-page navigation: a popover/details section menu below 68rem and a back-to-top link | P2 | Med | Low | M | rail hidden docs.css:105-107, header hidden components.css:141-144, no hamburger or back-to-top exist |
| BY3-E | ✅ | Gate or reword the 21 kB gzipped cohort claim so no hand-written size survives in contract prose | P2 | Med | Low | S | index.html:7863; check-size.mjs:216 admits all kB-gzipped sentences are hand-written; closest measured artifact is 21.3 kB gz |
| BY3-F | ✅ | Add one form specimen demonstrating aria-invalid with an error message and focus ring in section 07 | P2 | Med | Low | S | aria-invalid is 0 across the guide; the CSS exists (components.css:1785) |
| BY3-I10 | ✅ | Fix README.md:378 which names integrations/ai/.cursorrules that does not exist | P2 | Low | Low | S | the directory ships CLAUDE.md and v0-prompt.md only |
| BY3-I5 | ✅ | Gate the §23 event table against CONTOUR_EVENTS: generate the rows in the build or assert the table's event cells equal the manifest keys | P2 | High | Low | S | check-wc gates manifest vs emission only; nothing reads the guide table (it drifted 4 rows this window) |
| BY3-I6 | ✅ | Add event-consumption recipes to the guide and README: one plain-JS addEventListener sample, one React on-ref sample, one sentence on composed events through shadow hosts | P2 | High | Low | S | 5 import quickstarts, 0 wiring samples repo-wide |
| BY3-I7 | ✅ | Surface the frozen event manifest in the type system: emit per-event detail-payload interfaces and add types conditions to the wc subpath exports | P2 | Med | Low | M | contour.d.ts has no CustomEvent detail map today |
| BY3-I8 | ✅ | Replace the cdn.jsdelivr.net URLs with the specifier form until publication and add a doc gate that refuses them | P2 | Med | Low | S | README.md:4/235-236 and v0-prompt.md:29; private until v1.0 so they 404 |
| BY3-I9 | ✅ | Add the agent-rules.json export key (the file already ships in dist) or point the prompt at the raw dist path | P2 | Med | Low | S | v0-prompt.md:69 teaches a specifier that is not in the exports map |
| BY3-U1 | ✅ | Dim the visible switch/check input on disable (matching the c-radio has(input:disabled) pattern) and delete or repurpose the dead track/box selectors | P2 | High | Low | S | utilities.css:490-491 targets an unstyled sibling span; the visible appearance:none input never dims |
| BY3-U2 | ✅ | Add outline none inside the text-control focus rules so only the explicit box-shadow ring paints | P2 | Med | Low | S | components.css:1772-1779 and :1785-1787 stack on the base outline; aria-invalid adds a third ring |
| BY3-U3 | ✅ | Give the command palette search field a focus-visible ring (box-shadow replacement or drop the outline none) | P2 | High | Low | S | components-shell.css:123-131; the primary keyboard surface is currently ringless (WCAG 2.4.7) |
| BY3-U4 | ✅ | Add Firefox equivalents for the range thumb hover and focus rings | P2 | Med | Low | S | components.css:1877/1881-1885 are webkit-thumb-only; FF users get the bare rectangle |
| BY3-U6 | ✅ | Raise the drawer and its scrim above the sticky header (z-index max with the header or an inset-block offset) and document the intended overlay order in the z token block | P2 | High | Low | S | drawer 300 vs header 400 (tokens.css:222-227); probe on the dashboard template in both themes |
| BY3-U7 | ✅ | Reset -webkit-tap-highlight-color in the base reset for the shipped pointer-coarse surface | P2 | Med | Low | S | 0 hits in src/css; default iOS flash on every control |
| B3-07 | ✅ | Stop the command Enter branch double-dispatching contour:select; the programmatic click already reaches the click listener | P2 | High | Low | S | navigation.mjs:609-610 plus :616-626 |
| B3-08 | ✅ | Give wireMenu one roving tab stop (stamp a 0 on the first item) and add Escape and type-ahead per APG | P2 | High | Low | S | behaviours.mjs:541-543 forces -1 on everything; contrast wireTabs/wireTree |
| B3-09 | ✅ | Preserve layer-panel checkbox state across re-renders (component-level checked persistence or last-emitted re-apply) | P2 | High | Low | S | map.mjs:79-93 re-derives checked per render; emitted visibility can contradict the UI |
| B3-10 | ✅ | Persist tabs/code-tabs selection across rebuilds, respect an author-marked selected tab, and emit a tab activation event | P2 | High | Low | M | navigation.mjs:89-101/285-296 force tab 0; behaviours.mjs:121-123 activate(first) and :124-170 emit nothing |
| B3-12 | ✅ | Give drawer and sheet the dialog family's Escape, focus-in, focus-restore and an accessible name via a shared overlay enhance | P2 | High | Med | M | feedback.mjs:88 keydown is dialog-only; :483-503/:552-574 set attrs and contain only; 0 aria-labelledby in the file |
| B3-15 | ✅ | Generate a per-host name (contourId) for un-named radio-lists so two hosts cannot collide in one native group | P2 | Med | Low | S | forms.mjs:555 defaults to the literal radio-list; cross-instance grouping needs a probe |
| B3-16 | ✅ | Implement Arrow/Home/End roving for hexbin, flow-map and isochrone marks (or a host-level stop like catchment) | P2 | Med | Low | S | map.mjs:221/296/379 stamp tabindex but no roving keydown exists outside the compass |
| B3-17 | ✅ | Make the command palette a combobox to assistive tech: listbox/option roles and aria-activedescendant on the input, plus Home/End in the keydown chain | P2 | High | Med | M | navigation.mjs:525-562 plain divs; :599-614 lacks Home/End |
| B3-18 | ✅ | Replace the blacklist sanitizers with a DOMParser allowlist (or strip every on-attribute variant and scheme-check hrefs) in all four sinks | P2 | High | Med | M | content.mjs:338/411/498 and docs.mjs:102; single-quoted, unquoted and javascript-href payloads survive; extends BY2-C10 |
| B3-19 | ✅ | Default the docs-nav items only when the attribute is absent AND remote data is null, so the empty arms are reachable | P2 | Med | Low | S | docs.mjs:17-18 always-truthy default makes both empty branches dead |
| B3-21 | ✅ | Add type button to the slotWrapper-generated buttons (btn, pressable, scheme-toggle, search-trigger) | P2 | Med | Low | S | shadow.mjs:190-192/246-248/263 lack it; the structured templates set it |
| BR3-2 | ✅ | Fix the reflow gate advisory to name the widest unclipped extender (clip null) instead of the widest clipped element, keeping the clipped list as a secondary diagnostic | P2 | Med | Low | S | today the NOTED text blames the 725 px #recipes table inside a wrap that is not the page extender |
| BY-31 | ⬜ | Value formatting (`Intl` opt-in) for kpi/stat/readout/coordinate | P3 | Med | Low | M | beyond.md BY-22, beyond_00 BY-21 |
| BY-33 | ⬜ | Progressive polish: view transitions (feature-detected, reduced-motion gated), exportparts gate, scroll-driven edge affordances | P3 | Med | Med | M | beyond.md BY-24/25/26. Enhancement-only; the exportparts row must gate on an exported token no rule consumes |
| BY-49 | ⬜ | Opt-in state persistence: `persist="url\|storage"` on tabs / pagination / table / tree / accordion | P3 | Med | Med | M | sweep-2 gap 11. localStorage used only for theme today; `URLSearchParams`/`history` for component state = 0. Route table must be documented first (hash-nav collision) |
| BY-50 | 🟡 | SOTA: `@starting-style` + `transition-behavior: allow-discrete` open/close transitions for dialog / command / drawer / sheet | P3 | Med | Low | S | sweep-2 SOT1. 0 hits in src today; enhancement-only; reduced-motion gated by the global kill-switch (base.css:421-437); sequences on BY-19/BY-21. Verify Baseline date before §23 |
| BY-51 | ⬜ | SOTA: `hidden="until-found"` on collapsed tree / toc / command / accordion content | P3 | Med | Low | S | sweep-2 SOT2. 0 hits today; in-page find opens closed branches; dead in browsers without it (enhancement-only) |
| BY-52 | ⬜ | SOTA: `inert` on focusable-but-hidden surfaces (closed command list, off-canvas drawer) | P3 | Med | Med | S | sweep-2 SOT3. 0 hits today; feature-checked; the general half of BY-46's containment |
| BY2-B1 | ⏰ | Feature backlog (BY2-F1..F10 + BY2-X1..X12): data export, filtering/aggregation/annotation, compare/diff, split map, style panel, palette editor, API reference, changelog viewer, onboarding | P3 | Med | Med | L | gate each against the M-WC-04 boundary (BY-34/35 refusals stand); F6 streaming is now partially landed with BY-40 |
| BY2-B2 | ⏰ | Future-proofing backlog (BY2-PF1..PF10): CSS nesting, @scope, view transitions, scroll-driven animations, container-query units, wider :has, TS strict lane, ESM-only option, consumer @layer guide, token versioning | P3 | Med | Low | M | the SOTA subset (BY-33, BY-50/51/52) is owned by BY3-X3 with verified Baseline dates |
| BY2-B3 | ⏰ | Polish backlog (BY2-U3, BY2-U11, BY2-U12, BY2-U14, BY2-U15, BY2-U16, BY2-U9): touch gestures, toast positioning, modal stacking visuals, CVD gate, infinite scroll, pull-to-refresh, chart data-table alternative | P3 | Med | Low | M | kept behind 1.0; U8 and U10 are closed by contradiction (see corrections) |
| BY2-D4 | ✅ | Document the exports-map-as-API choice (no ./dist/* key) in the README so consumers migrating from path-based imports are told why | P3 | Low | Low | S | group row with BY2-D6 (AGENTS stale llms text) and BY2-D15 (What-ships table omits wc/) and BY2-D9 note (components.json budget owned by BY3-X2) |
| BY2-R1 | ⬜ | Document and gate the containment and content-visibility conventions (contain layout vs strict vs content; content-visibility on long lists) | P3 | Med | Low | M | group row for BY2-R1/R2/R3/R4/R5/R6/R7 (contain, content-visibility, font-display, image attrs, will-change, nesting, @scope) |
| BY2-S10 | ✅ | Document the CVD filters (deuteranopia/protanopia/tritanopia) in a guide specimen so designers can preview chart readability | P3 | Med | Low | S | src/svg/cvd-filters.svg ships and is referenced nowhere |
| BY2-S11 | ✅ | Document the chart-pattern fills (hatch/dots/lines) beside the dash-pattern contract | P3 | Med | Low | S | src/svg/chart-patterns.svg ships and is referenced nowhere |
| BY3-G | ✅ | Cap the panel-body prose measure and add overflow-wrap for inline code in section 23 | P3 | Med | Low | S | unmeasured 61 rem column vs 46 to 68 ch caps elsewhere |
| BY3-H | ✅ | Give specimen headings stable ids (or mark the real rail with data-command-nav) so command-k reaches subsections | P3 | Med | Low | S | only 3 id'd h2/h3 exist; the actions group is empty |
| BY3-I | ✅ | Advertise the question-mark shortcuts overlay in the palette foot or header and add aria-keyshortcuts | P3 | Med | Low | S | overlay exists at index.html:16348 but only the key it documents reveals it |
| BY3-I11 | ✅ | Emit the src detail from the 5 retry sites (or annotate per-site presence in the manifest) | P3 | Med | Low | S | data.mjs:464/785/1355/1447/1622 vs states.mjs:511 |
| BY3-I12 | ✅ | Strike the unstyled contract names (globe, terrain) or add their rules so the contract lists only what the sheet themes | P3 | Low | Low | S | map-chrome-contract.json vs map-chrome.css |
| BY3-I13 | ⬜ | Publish the shadow slot and part lists in a wc contract file if Figma/codegen adoption is a 1.0 goal | P3 | Med | Low | S | components.json has no slots key today |
| BY3-J | ⏰ | Revisit content-visibility once the anchor-nav conflict is fixed (contract it to a contained wrapper, not the section) | P3 | Low | Low | S | docs.css:1208-1216 documents the removal reason; do not re-add on .section |
| BY3-K | ✅ | Add a start-here band after section 01 pointing at install and a template, or move install earlier than 22 of 24 | P3 | Med | Low | S | orientation path for a new consumer |
| BY3-U10 | ⬜ | Polish cluster: fix the z fallbacks (700 and 800), replace the raw comparison values with the z token, add an ease-linear token, drop the self-defeating pointer-events none or the cursor, extend tracking/type scales or document the micro values, port the ch-ladder to stat and meter values, overflow-wrap on prose anchors, un-clip the tab rings | P3 | Med | Low | M | awaits BY3-U1 before the dead selectors can be deleted; fills BY3-U10 to BY3-U17 |
| BY3-U8 | ⬜ | Unify the press language: one active model (translateY 1px) documented in AGENTS, applied to the interactive card and the list controls | P3 | Med | Low | S | 3 press models coexist today; about 50 interactive classes have no active state |
| BY3-U9 | ✅ | Add the sibling fast transition to the 8 instant hover controls | P3 | Med | Low | S | close buttons x4, coordinate copy, time-slider play, pagination link, combobox option |
| BY3-X3 | ⬜ | SOTA adoption decision set: ship starting-style plus allow-discrete open/close transitions (BY-50; Baseline-Newly 2024-08 verified), make same-document view transitions optional (BY-33; Baseline 2025-10), keep scroll-driven animations deferred (not widely available), leave the light-dark 2026-11 date unchanged | P3 | Med | Low | M | reduced-motion gated by the global kill-switch; verify Baseline status in the guide before any claim |
| B3-22 | 🟡 | wc polish cluster: cancel the copy-confirmation timer on dispose, one payload shape per event with per-site enforcement, adopt or drop watchViewport, reuse one IntersectionObserver in remoteVisible, cache chart tip rects, clamp svg geometry, stop stripping authored slots, hold the time-slider play state, rename the expandable summary class, make live roles opt-in, claim-guard the segmented timer | P3 | Med | Low | M | fills B3-22 to B3-33; the time-slider emission half landed with BY-27 (B3-30). Partial: copy-timer guard (ds.js), svg geometry clamp (svg.mjs), authored-slot stripping removed (data.mjs, misc.mjs, layout.mjs) |
| B3-30 | 🟡 | Time-slider play: interval and contour:time-change now land (map.mjs:184/162) | P3 | Med | Low | S | the re-render-reset half of the finding still needs a probe; the template-carrier correction is carried by BY3-X5 |

### 5.2 Closed / decided ledger

| Task ID | Status | Task | Priority | ROI | Risk | Effort | Notes |
|---|---|---|---|---|---|---|---|
| BY-30 | ❌ | Real map maths: coordinate parser (DD/DM/DMS), meters-per-pixel scale bars, ring geometry, map-area viewport contract | P2 | High | Med | L | Rejected per the user's standing note: real map maths belongs to the map libraries (maplibre/mapbox); Contour ships the interface, and BY-35 already drew that boundary (viewport contract is the seam). Carve-out: the row's own invalid-length bug is fixed — contour-scale-bar's `line.style.inlineSize` now appends a unit to a bare numeric value (`/^\d+(\.\d+)?$/` → `+ "px"`), measured in wc-contract arm 19: scaleInline "120px" |
| BY-34 | ❌ | Full DOM windowing for contour-table | P2 | Med | Med | L | beyond_00 BY-24, rejected with reason: data-engine territory per the M-WC-04 boundary; content-visibility + keyed updates cover the dashboard case |
| BY-35 | ❌ | Projection/rendering inside contour-map-area | P2 | Med | High | L | beyond_00 BY-25, rejected with reason: painting belongs to a map engine; Contour ships the interface (viewport contract is the boundary) |
| BY-36 | ❌ | Raising the wc size budget to clear check-size | P0 | High | Med | S | beyond.md refusal, restated: the artifact is over by ~14 % while 34 duplicate legacy blocks are still in the source — the fix is the port (BY-10), measured against the artifact, not a raised line |
| BY-37 | ❌ | Declarative shadow DOM / template instances (SSR emission) | P3 | Med | Med | L | beyond.md refusal, restated: violates "no build step"; the runtime holds a snapshot/restore contract instead |
| BY-38 | ❌ | Signals / a second reactive system inside the layer | P3 | Med | High | L | beyond.md + beyond_00 refusal, restated: one reactive source of truth; the snapshot/restore model is the system's identity — **and the same refusal covers beyond_00's framework-shape wording (DOM-diffing, typed templates)**: the runtime holds one render contract and never imports a diffing engine |
| BY-53 | ➖ | Four "non-gap" proposals killed by measurement — do not re-propose | P0 | Very high | Low | S | sweep-2: table sort **landed** (data.mjs:390/512/522/544), skeleton reduced-motion **covered** (base.css:429), tooltip focus **landed** (ui.mjs:200), AbortSignal.any + content-visibility **in the tree** (states.mjs:212). Falsified with quoted greps in `beyond01-sweep2-gap.md` |
| BY-54 | ❌ | `docs/` as a Baseline source (beyond.md §4 refusal, now mapped) | P3 | Low | Low | S | closed this pass: `ls docs/` absent, only `dist/docs/` ships; Baseline dates come from the re-derivation rule (wide = newly + 30 months) and `tmp/q/css-platform-2026.md`, not a table in this repo |
| BY-55 | ❌ | Deferring the sweep-2 proposal set wholesale until after 1.0 | P1 | Med | Med | M | rejected with reason: BY-39, BY-42, BY-44 are P1 consumer-facing gaps (keyboard-mark silence, off-screen dashboards, form events a design promise already makes) — they belong in the 1.0 queue, not a v1.1 backlog; the P3 SOTA rows (BY-50…52) are the deferrable part and already carry P3 |
| BY3-I4 | ✅ | Vocabulary swap-in: manifest names with no emission site (legend-toggle, stream-state, tick, time-change) — healed by BY-27/40/41 (d4289da) inside the audit window | P2 | High | Low | S | resolved in-flight by BY-27/40/41 (d4289da); check-wc PASS re-measured |
| BY-27 | ✅ | Resizable reads direction + pointer wiring; time-slider play animates and emits contour:time-change | P2 | Med | Med | M | landed 2026-10-28 in `d4289da` while this volume was being assembled; status flipped from ✅ — see §4.2 |
| BY-41 | ✅ | Interactive series selector: legend items become buttons with `aria-pressed`; `contour:legend:toggle`; chart `hide-series`/`dim-series` | P2 | Med | Low | M | landed 2026-10-28 in `d4289da` while this volume was being assembled; status flipped from ✅ — see §4.2 |
| BY3-B | ➖ | Add one specimen per async state (loading/error/empty/retry) for a data element with a real fetch, then regenerate snippets | P1 | High | Low | M | consolidated into BY-12 in this volume; source claim archived in beyond_03 |
| BY2-U8 | ➖ | Search-result highlighting claim — contradicted: ds.js:682-693 creates c-command__mark and components-shell.css:228 styles it | P2 | Med | Low | S | BY2-U8 text is stale; do not re-open the gap |
| BY2-U10 | ➖ | Keyboard-shortcut documentation claim — contradicted in letter: the 6-row overlay exists (index.html:16348) but is undiscoverable; the real task is BY3-I (advertise it) | P2 | Med | Low | S | BY2-U10 text is stale; the live half moved to BY3-I |

## 6. Verification plan (merged)

- **Size:** `node tools/check-size.mjs` — green after BY3-X2; paste per-artifact before/after; the wc budget comment gains a date and measured size.
- **wc-contract:** `node tools/audit/wc-contract.mjs` — the B3-* arms must be added (authored-content survival, pagination page write, modal unlock on removal, single keydown payload, checked persistence) and the count must grow, not stay flat.
- **check-wc in CI:** BY2-I1 — the lane must run on push; falsify it once (add a dead manifest name) and watch it fail, then revert.
- **Reflow:** `node tools/audit/check-reflow.mjs` plus a 320 px probe after BR3-1 — scrollW 320 on the guide, both themes, JS off; the NOTED advisory must name an unclipped extender.
- **Forced colors / focus:** browser probes for BY3-U1..U7 in both themes (forced-colors emulation for U5).
- **Guide regeneration:** after BY3-A/B and BY-12 — `node tools/snippets.mjs` idempotent, `node tools/execute-docs.mjs` 351+ valid, `node tools/check-docs.mjs` byte-parity, docs budget revision first.
- **Interop:** a real Tailwind v4 build (BY3-I1, incl. the @theme self-reference probe), a real Style Dictionary run (BY3-I2), npm pack surface re-check (BY2-D1), grep gates for cdn.jsdelivr (BY3-I8) and agent-rules export (BY3-I9).
- **Gate registry:** after BY2-C1 — `node tools/check-css.mjs` must scan 14 sheets and still report 0 collisions; after BY3-C — `node tools/check-components.mjs` + check-size both green.
- **Manual:** guide + templates at 1440 and 390 px, both themes, keyboard walk-through of the queue's interactive rows; `npx html-validate index.html templates/*.html`; `node --check` one file per invocation.

## 7. Open questions / deferrals (merged)

1. **check-size: trim or re-budget?** (BY3-X2.) The 1–3 % overruns have named causes; the growth ledger now exists. BY-36's refusal stands for an unreasoned raise.
2. **Map seam: document-only recipe or an owned map property?** (BY3-I3.) The boundary (user's standing note) says stay out of the engines — the recipe is the minimal honest seam.
3. **§23 API cards vs the docs budget.** (BY3-A.) ~77 B headroom measured; cards need a budget revision or a generated sidecar.
4. **remoteRefresh/watchViewport adoption.** (BY-40 residual, B3-24.) The streaming chart chose its own setInterval; a real adopter decides whether the loader's refresh/visibility API stays canonical.
5. **role="alert" divergence.** (beyond_01 §6.3.) Deliberate; do not re-add on error nodes.
6. **Deferred (not rejected):** table windowing, map projection/rendering, drag-and-drop (BY-26), token versioning, the BY2-F*/X*/PF* backlogs (BY2-B1/B2/B3) — each gated by the M-WC-04 boundary or a consumer need.
7. **gen-llms:** keep inside build.mjs with a --check mode, or a dedicated lane. (BY2-I1.)

## 8. Honesty notes (merged)

- **Snapshots differ per section.** The three registries embed their sources' own snapshots (3b7afaf / 96eb15d / d4289da); the plan table and current state are measured at the HEAD of this volume (d4289da, clean tree). Treat a registry row's status as archival; the plan's status is live.
- **Line numbers are HEAD-pointed**: the plan rows and corrections cite lines measured at d4289da or the source documents' own snapshots; the tree is actively edited — re-derive before editing.
- **Not browser-probed:** forced-colors renders, radio-list cross-instance grouping, heatmap tab-order after restore, layout-thrash magnitude; the rows say so and §6 names the probes.
- **No dist rebuild this pass**: the gates that read dist certify the committed surface; the concurrent session's mid-pass commits were not rebuilt into dist by this volume.
- **Counts are pattern-defined and point-in-time** (each §2 row names its gate or grep).
- **What this volume does not claim:** that the component architecture is broken (1348 assertions pass); that any P3 row is 1.0-mandatory; that the SOTA rows are required; that the numbers hold tomorrow; that a ✓ status here replaces the source's file:line evidence — the sources remain the evidence archive.
