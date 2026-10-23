# CONTOUR — review 2

*Second full pass, beyond `review.md`. Prepared 2026-10-22 against `main` at `eabe090`.
Every number below was measured on this tree, in a real browser where a browser is claimed;
the command that produces it is named beside it. Where a claim comes from a research thread
rather than from this reviewer's own probe, it is tagged. Where a claim from the first review
is re-litigated, the prior task ID is cited so the ledger stays auditable.*

---

## Contents

- **0 · Method, and why this pass exists**
- **1 · Verdict**
- **2 · The shipped artifact is broken, and no gate can see it** — P0
- **3 · The promise layer: what the system says versus what it draws** — P1
- **4 · The invisible differentiator: the spatial half ships dark** — P1
- **5 · Truth-ledger failures** (docs vs source vs gate)
- **6 · Architecture and hygiene** (layers, vocabularies, ownership, packaging)
- **7 · The state of the platform, 2026-10** (what is now safe, what is now obsolete)
- **8 · Originality program** — how Contour becomes unmistakable
- **9 · What is right and must not be "fixed"**
- **10 · Corrections to the review-1 ledger**
- **11 · Implementation plan** (T-109 … T-160)
- **12 · Milestones**
- **13 · Evidence appendix — pasted measurements**
- **14 · What this pass did not review**

---

## 0 · Method, and why this pass exists

The first review (`review.md`, 2,831 lines, recovered at `tmp/prev-review.md`) produced 108
tasks; **98 are marked ✅ Done** and the commit history shows M0–M6 landed, plus fourteen more
commits on top (layout primitives, "Airship-inspired" containers, the spatial layout blocks).
A design review's most useful second act is not to repeat itself — it is to **assume nothing
the first act claimed**, and to look where the first act said it had not looked. So this pass:

- **fan out** to eight independent threads (coverage index, claim falsifier, post-review commit
  audit, CSS architecture, runtime, data-viz + spatial, platform research, originality), and
  **re-verified every load-bearing subagent claim by hand** before it entered this document —
  three thread claims did *not* survive that step (e.g. "the map components are not in CSS at
  all": they are, at `components-data.css:905–1035`; a first grep had missed them), which is
  exactly why the falsifier thread exists.
- **measured, not reasoned**: headless Chrome driven through the repository's own
  `tools/audit/lib/browser.mjs`, with CSSOM walks, computed-style reads, pixel checks, and
  JS-disabled runs. Where a probe cannot distinguish two states, its result is discarded as
  blind, not reported as evidence.
- **refused to trust the previous ✅.** The falsifier thread checked 37 of the highest-stakes
  ✅ claims against current source: **13 VERIFIED · 21 PARTIAL · 2 CONTRADICTED · 1 NOT FOUND**,
  and re-measured all six JS blockers from `tmp/audit/js-defects.md`: **B1–B6 are all live**,
  unchanged in mechanism, in files that have grown since (845 → 932 lines).

Working artifacts are left under `tmp/r2/` (`prev-coverage.md`, `claim-verification.md`,
`dataviz-audit.md`, `agent-overlays.md`, `agent-perf.md`, `sota-research.md`, and the probe
scripts) so every number in this document is reproducible or re-derivable.

---

## 1 · Verdict

Contour is the best-gated small design system this reviewer has audited: its census, export,
stamp, target-size, focus-ring and palette-ARIA gates are **live and provably armed** (the
census gate was sabotage-tested: an injected dead token fails the build with exit 1). It is
also, today, **a system whose shipped artifact is corrupted, whose public API contains a
method that throws on every call, whose security posture contains a live XSS sink, and whose
own size gate is red at HEAD.** The first review's "implementation without consumption"
pattern — the CSS lands, the consumer never does — has not stopped: it is now the *shape* of
most of the remaining gap. The 133 published components include **11 blocks that appear
nowhere but `src/`** — and eleven is not a random set: it is almost exactly the spatial layer,
the bivariate legend, the layer switcher, the survey line, the scale bar, the instrument
readout. **The differentiating half of the system ships dark.** The guide demonstrates the
generic half (buttons, cards, tabs) exhaustively; the cartographic half exists only as CSS
that no page, no specimen, no template, and no gate has ever rendered.

Three sentences a team can act on:

1. **Fix what ships** — the minifier corrupts both bundles, the `@layer` blocks in four source
   files close early (so `dist/` carries an inverted cascade the guide cannot see),
   `check-size` exits 1 today, and `Contour.scrollTo()` throws a `ReferenceError`.
2. **Render the differentiator** — eleven components, all six spatial marquee pieces, and the
   entire theme-set layer are unshown and ungated; add a specimen gate that fails the build and
   the backlog writes itself.
3. **Re-own the promise** — the legend's dash preview renders solid (pixel-proven), two of the
   eight series share series 1's "solid" pattern, the CVD preview references filters that do not
   exist (`feColorMatrix`: 0 occurrences in the whole repository), and `llms.txt` tells agents
   that a shipped API is unshipped. Every one of these is a claim the system printed about
   itself and did not keep.

---

## 2 · The shipped artifact is broken, and no gate can see it — P0

The system's production path is `dist/` (README install, package.json `main`/`style`), yet
**no CI lane ever loads a `dist/` file.** The validate lane syntax-checks `src/js/ds.js`
(`node --check` passes on a bundle that throws at runtime), html-validates the guide, and
measures the guide's *colors*; nothing parses the shipped stylesheet or runs the shipped
script. What that blindness has produced, item by item:

### 2.1 The CSS minifier corrupts the bundle (`js-defects` B2 — live, wider than reported)

`tools/lib/minify.mjs:39–50` keeps a space only when **both neighbours match
`/[a-zA-Z0-9_-]/`**. `%`, `)`, `]` and `.` are not wordish, so:

- 23 `calc()`/`clamp()` expressions lose the mandatory spaces around `+`/`-`. Measured in the
  current `dist/contour.min.css`: `calc(50%+1px)` (3 occurrences — this reviewer's grep),
  `clamp(2.75rem,1.1rem+6.4vw,6rem)`, `calc(var(--header-height)+1.5rem)` *(thread,
  brace-balanced scan; reproduced here for `calc(50%+1px)`)*. Invalid `calc()` is not an error
  — it **silently drops the declaration**.
- `oklch(99% 0.002 230)` → `oklch(99%0.002 230)` throughout the primitive ramps —
  **invalid color**, every ramp step at risk.
- **New this pass (self-verified):** the same rule destroys **descendant combinators in
  selectors**. Real-Chrome CSSOM of `dist/contour.min.css`, side-by-side with `dist/contour.css`:
  `.c-radio-list .c-radio` → `.c-radio-list.c-radio`, and `[dir="rtl"] .c-select` →
  `[dir="rtl"].c-select`. Those are not equivalent selectors: the second means *one element
  that is both*, which matches nothing. The RTL fixes promised in review-1 T-39 are silently
  un-selected in the minified bundle. The guide cannot show this because the guide links `src/`.

Browser consequence, measured on identical markup, `dist/contour.css` → `dist/contour.min.css`
*(claim-verification thread, Chrome)*: `h1 { font-size } 40px → 16px`,
`line-height 48.8px → 19.52px`, `letter-spacing −0.88 → −0.352`, and a `.c-theme-scope`'s
`--brand-600` computing to the invalid string. The minified stylesheet renders a visibly
different page from the readable one.

### 2.2 The JS minifier throws at load — the API never boots (B1 — live)

`minifyJs` copies string literals verbatim but then runs **whole-output whitespace regexes**
(`minify.mjs:144–146`) that eat spaces *inside those literals*. Measured in the current
`dist/contour.min.js` by this reviewer: `[data-spy]a`, `data-command-nav]a[href]`,
`rootMargin:"-20%0px-70%0px"` (an invalid length list — `querySelectorAll` and IntersectionObserver
both throw). Real Chrome: `Uncaught SyntaxError: '[data-spy]a' is not a valid selector` at
section 5 of 18 — **sections 6–18, including the public API, never initialise**;
`window.Contour` is `undefined` on the minified bundle and `object` on the source one
*(positive control: same harness, both variants)*. No source maps are generated. `dist/` is
confirmed fresh (a clean rebuild reproduces both files byte-for-byte, `agent-perf` F1), so
this is the current build output, not a stale artifact.

### 2.3 Four `@layer` blocks close early — `dist/` ships an inverted cascade (new; measured twice)

`src/css/base.css`'s, `tokens.css`'s and `patterns.css`'s layer blocks close at EOF, but four
files close theirs **mid-file** and continue unlayered:

| file | `@layer` opens | closes early | first unlayered rule | what rides after it |
|---|---|---|---|---|
| `utilities.css` | :7 | **≈:269** | `.u-hatch-1` (:272) | fill patterns, `prefers-contrast`, `prefers-reduced-data`, `@media print`, graticule, isoline field, rings, `.c-mark`, `.c-advanced`, `.is-disabled`, `.is-busy`, `.u-reset` |
| `components-data.css` | :9 | **≈:777** | `.c-bivariate` (:784) | the whole spatial tail: bivariate, map-slot, map-area/panel/footer, app-shell, box, container, survey, scale-bar, instrument, marks, layer-switch |
| `components.css` | :9 | **≈:2370** | `.c-radio` (:2373) | radio, radio-list, flag, `[dir=rtl]` overrides |
| `components-docs.css` | :10 | **≈:739** | `[dir="rtl"] .c-diff__sign` | the tail of the docs surface |

*(The four crossing lines are the css-audit thread's, counted on raw lines after proving
comments brace-free. This reviewer's own brace scan reported different numbers (265/732/2299/694)
because it stripped comments by substitution — a multi-line comment collapsed to one line
shifts every later line number down. Balanced final depth proves nothing about placement; only
the zero-crossings do, and the load-bearing measurement is the dist CSSOM walk itself: 127
top-level style rules in `dist/contour.css` and 61 in `contour-core.min.css`, counted twice
independently.)* Why nobody noticed:

- The **guide** imports each file through `@import … layer(…)`; a named-layer `@import` pulls
  even unlayered rules of the imported sheet into that layer. So `src/css/ds.css` is *correct
  by accident of the wrapper*.
- The **build** (`build.mjs` `inline()`) inlines the file text and **discards the `layer()`
  annotation**, so in `dist/contour.css` those rules are top-level — and *unlayered normal
  declarations outrank every layered rule*.

Measured, real Chrome CSSOM, same-origin HTTP: `dist/contour.css` → **127 of 958 style rules
unlayered** (samples from this reviewer's walk: `.c-radio`, `.c-bivariate`, `[dir="rtl"]
.c-select`, `.u-hatch-1`); `dist/surfaces/contour-core.min.css` → 61 of 620. The
`@layer utilities` tail is therefore *stronger than* the components it is supposed to merely
outrank by convention, and the documented contract at `ds.css:19-20` ("utilities always win
over components") is true on the guide path and **false on the bundle path in a specific,
harmful way**: consumer `@layer utilities` customisations cannot beat `.c-box`, `.c-bivariate`,
`.is-disabled` — measured flips: `.c-bivariate.u-w-full` → `inline-size 780px` via `src/` vs
`17.59px` via `dist/`; `.c-map-panel--top.u-relative` → `relative` vs `absolute`;
`.c-flag.u-pill` → radius `999px` vs `10px` *(css-audit thread, positive controls passed)*.

**Fix is two moves**: close each block at EOF (a brace move, no content change), and make
`build.mjs` assert that the bundled CSS has zero depth-0 style rules — turning the accident
into the contract.

### 2.4 The size gate is red at HEAD (measured by this reviewer, un-piped)

```
$ node tools/check-size.mjs
dist built 2026-10-22T18:30:52.893Z
  contour.min.css        122.8 kB  budget 120.0 kB  OVER BUDGET
  contour.tokens.json     29.0 kB  budget  20.0 kB  OVER BUDGET
  surfaces/contour-docs.min.css   96.2 kB / 96.0 kB OVER BUDGET
  surfaces/contour-data.min.css  103.0 kB / 100.0 kB OVER BUDGET
  surfaces/contour-landing.min.css 91.2 kB /  91.0 kB OVER BUDGET
check-size: 5 bundle(s) over budget.   (exit 1)
```

The budgets' own comment says *"Measured 2026-10-22, ~3% headroom"* — they were measured
before the layout-primitive and container growth of the last fourteen commits and never
re-measured. Since CI runs build → check-size, **the validate lane fails on every push at
HEAD**; a project whose thesis is "the build can fail on a regression" is currently red on
its own trunk. Either re-tune to the current bytes with stated headroom, or trim. (The
`tokens.json` overrun is a feature: the export grew from 151 to 269 tokens when review-1 T-62
was fixed — the budget just wasn't told.)

### 2.5 The public API ships a method that throws — on every call (new; measured in Chrome)

`goTo` (the hash-syncing smooth-scroll helper) is `const`-declared inside the command-palette
block (`ds.js:495`, within `if (palette) { … }` which this reviewer's brace scan closes at
**:766**), and the public API at `ds.js:926` calls it from outside that scope. Real browser
against the live guide with an id that exists:

```
"scrollToRealId": "THROWS: ReferenceError goTo is not defined"
```

`window.Contour.scrollTo` is documented in README §Install ("Four functions, one namespace")
and is broken unconditionally — the closure never sees `goTo`. The other four members were
measured working (`toast` → DOM node appears; `chart.scale([0,10],[0,100])(5) → 50`;
`chart.ticks(0,10,5) → [0,2,4,6,8,10]`; `commands.register/list` round-trips). This is
precisely the class of defect that exists because **no lane runs the shipped script** (§2.2's
lane fixes both).

### 2.6 Live XSS sink in the command palette (B4 — mechanism confirmed by this reviewer)

`ds.js:640` concatenates the raw group name (`group + " · " + highlight(...)`), `:649`
interpolates `cmd.icon` raw into `href="#…"`, and `:665–666` re-injects the raw group into the
section title — all inside `list.innerHTML = …`. `escapeHtml` exists (`:566`) but is applied
only to title/hint via `highlight`. A consumer page whose section headings or
`data-command-icon` values contain markup gets code execution; the js-defects thread executed
both payloads in the real guide with a runtime-injected fixture (the repository itself contains
zero malicious strings — this is a mechanism, not a stored payload). Fix: escape `group` and
`icon`, or build the rows with DOM APIs, which the rest of the file already does.

### 2.7 Fragility: one malformed component voids every later enhancement (B5 — live), and the script is not idempotent (B6 — live)

Confirmed statically by this reviewer, reproduced in a browser by the claims thread:

- `$$ = (sel, root = document)` — the default binds only for `undefined`; `ds.js:136` passes a
  **null** `tablist` through and `.querySelectorAll` throws, taking down every later section in
  the IIFE (a `[data-tabs]` group without `[role=tablist]` on a consumer page kills the palette
  and the range painting). `grep -c "try {" src/js/ds.js` → **3**, all in `localStorage` reads.
- Re-running the script double-binds everything (0 guards, 0 `AbortController`, 0
  `removeEventListener`): measured — after a second `<script>` tag, Cmd+K opens and immediately
  closes; the theme toggle becomes a no-op; copy fires twice.

### 2.8 The no-JS contract is falsified in three places (B3 — live)

"Nothing is hidden behind JavaScript" (AGENTS.md). Measured with JS disabled on the real guide:

- the search trigger is `data-command-open` only — no `popovertarget`, no `aria-controls` in
  markup → the palette is unreachable but also *not advertised as unavailable*;
- tooltips: `title` fallback is **absent from the code** — `ds.js:441–450` sets popover
  attributes *only inside* `if ("popover" in …)`, with no `else`; the section comment
  ("native popover where available, title fallback otherwise") describes a branch that does
  not exist;
- 6 of 9 tab panels are `hidden` **in the markup** (311 characters of unreachable prose) —
  the JS toggles `hidden`, so authoring the example pre-hidden means JS-off readers never see
  panels 2–4.

*(The tab-panel item is fixable purely in authoring: keep the default panel un-hidden in
markup, let JS hide it — the opposite of today.)*

---

## 3 · The promise layer: what the system says versus what it draws — P1

### 3.1 The legend dash preview renders **solid** — pixel-proven

The system's sharpest dataviz claim: *"a series carries a dash pattern as well as a hue, and
the legend previews that pattern."* Measured (dataviz thread, `deviceScaleFactor: 6`, raster
rasterisations with positive controls): all legend swatches return `gap1 INK82 gap1` — solid
ink — for series 2 and 3, while the same pattern over a *transparent* underlay renders real
gaps. Root cause, visible in source: `.c-legend__swatch { background: var(--c, …) }`
(`components.css:1741`) paints the hue **underneath** the `repeating-linear-gradient` whose
gaps are `transparent` (`components-data.css:416–422`) — the gaps show the same hue, so the
preview is structurally incapable of showing the pattern. Second, independent failure: the
swatch is `0.85rem` ≈ **13.6 px** wide, while `--chart-dash-4/5` periods are 19–20 px — even a
correct underlay could not show a full gap in 13.6 px. And the comment above the rules
(`:415`) reads *"The legend previews the pattern, so the key and the chart agree."*

### 3.2 Eight hues, six dash tokens: series 7 and 8 have no pattern at all

`tokens.css:398–405` declares `--chart-1…8`; `:426–431` declare `--chart-dash-1…6`;
`dash-1: none`. CSS maps `data-series="1…6"` only (`components-data.css:360–378`). So series
1, 7 and 8 **all draw solid** — three of eight series are distinguished by hue alone, which is
exactly the sentence the anti-goals forbid. Quantified CVD math from the dataviz thread
(oklab ΔE76, Machado severity-1.0 matrices, validator reproducing `validate_palette.js`
outputs exactly): worst categorical pair light `chart-5/chart-6` **ΔE 6.6 deut / 12.4 prot**;
dark `chart-5/chart-6` **ΔE 5.2 deut**; `chart-1/chart-7` ΔE00 15.2 with tritan 14. Sol-vs-Clay
(series 5–6) is the system's own caution/alarm pair and it is the most confusable — dash
separation is load-bearing precisely there, and it works only because series 5 and 6 have
patterns; the legend, per §3.1, cannot show them.

### 3.3 The colour-vision preview (review-1 T-96) is a dangling reference

`utilities.css:388–410` applies `filter: url(#contour-cvd-deuteranopia)` (and protan/tritan) to
`[data-cvd] .c-chart/.c-mark`. `grep -rn 'feColorMatrix' src/ index.html assets/ dist/` → **0**
*(this reviewer, un-piped)*. The SVG filters do not exist, so the preview silently does
nothing — and no markup anywhere sets `data-cvd` (0 occurrences in the guide and templates).
The idea (preview scoped to the *data surface*, never the chrome) is the best accessibility
feature in the niche; it is currently two dead rules and a dead promise.

### 3.4 The system cannot express "missing"

`--chart-missing` measures **1.03–1.43:1** against every surface it can sit on (dataviz
thread, computed from tokens and confirmed against the same surface values this reviewer
read from `tokens.css`): a "missing data" mark is invisible — it is a lighter nothing. There is
still no no-data vs zero-data distinction (review-1 §5.16 → T-31, still open), the fill-pattern
vocabulary (`--fill-hatch-1…5`, `.u-hatch-*`) has **0 uses in any markup** (this reviewer:
`grep u-hatch index.html templates/` → 0) and is `background-image`, which cannot fill an SVG
polygon at all — the polygon story is structurally absent. `.u-hatch-stale` re-declares the
literal gradient instead of `var(--fill-hatch-1)` (a near-duplicate code path; the token is
right there).

### 3.5 `--gradient-heat` — the T-81 reversal, still live

Review-1 T-81: *"rename `--color-scale-1…6` to `--color-heat-1…6` **and point every ordered use
at `--chart-seq-***`"*. The rename landed; the ordered use did not. `tokens.css:474–482`
still builds an **ordered** six-step gradient from the heat ramp, consumed by
`.c-legend__ramp` (`components.css:1712`, this reviewer: read the lines) — and the heat ramp's
own lightness profile is non-monotonic by design (Y = .37/.48/.50/.37/.45/.21 light — dataviz
thread, "NOT MONOTONIC" asserted and reproduced). So the guide's legend ramp *orders* a scale
that orders nothing. One-line fix: `.c-legend__ramp { background: linear-gradient(...
--chart-seq-1…7) }` for the sequential specimen, keep `--gradient-heat` only where it is
correctly used (the playground chip, where it *means* "hot, not ordered").

### 3.6 Chart chrome numbers that quietly miss their own bar

- `--chart-axis` measures **1.90–2.22:1** vs surfaces (dataviz thread) — fine as decoration,
  but the *axis line is the chart's frame of reference*; the WCAG 3:1 floor the system prints
  in three documents is about *adjacent UI*, and the axis sits under it by a full point.
  Either declare axes decorative (and make gridlines ≥ the axis's own step) or lift them.
- The specimen bug the first pass predicted for itself: `index.html:4647–4648` draws two
  isoline marks with `stroke="var(--chart-seq-2)"` — a presentation attribute, which any CSS
  declaration beats; `.c-mark--isoline { stroke: var(--chart-seq-4) }` (`components-data.css:1154`)
  wins, so **both lines render seq-4 and `--chart-seq-2` never renders anywhere in the
  repository** *(mechanism confirmed statically by this reviewer: read of both files; the
  computed-style confirmation is from the dataviz thread's Chrome probe)*. Fix: drop the
  presentation attributes and drive levels through a `--level` custom property or level classes.

### 3.7 There is no markup contract for charts — the contract is "copy the specimen"

The dataviz thread's element-by-element table (this reviewer spot-checked several rows):
axes are `space-between` spans (no tick placement, no y-axis element, gridlines are a fixed
25%-interval CSS gradient — a 5-tick axis and a 4-band grid *cannot align* by construction);
`.c-chart__tooltip` has no positioning/padding/z-index (the real tooltip is `.c-tooltip`, which
uses *different colours* than `--chart-tooltip-bg/fg`); `.c-chart__hover` sets `fill:` on an
HTML element (a no-op) and there is no `:hover` rule anywhere for charts; no chart `<svg>` has
`role="img"`, a `<title>`/`<desc>`, or a paired data table (this reviewer's grep: `role="img"`
→ 0). Chart API arithmetic (`scale`/`ticks`/`datum`, `ds.js:866–894`) is exported and works —
with **zero consumers, zero specimens, zero tests** — and `llms.txt:79` still announces the
opposite (see §5).

---

## 4 · The invisible differentiator: the spatial half ships dark — P1

**The inventory gate knows.** `node tools/audit/component-inventory.mjs` prints, and exits 0:

```
--- NO SPECIMEN ANYWHERE (guide + templates): 11 ---
  c-advanced c-bivariate c-flag c-instrument c-layer-switch c-map-area
  c-radio c-radio-list c-scale-bar c-survey c-tab
```

*(this reviewer ran it; per-block greps independently confirmed 0 uses in `index.html` and all
three templates for every name, except `c-tab`, where the 48 raw hits are all
`c-table*`/`c-tabs__*` substring noise — the word-bounded count is 0.)*

AGENTS.md: *"The guide is the specification. A component that is not shown is not documented."*
By the repository's own rule, **eleven shipped components are undocumented**, and they are not
incidental — they are the differentiators: the **bivariate legend** (the one visualisation the
first review proved neither GeoLibre nor kepler.gl ships), the **layer switcher**, the
**survey line**, the **scale bar**, the **instrument readout**, the **map-area/panel/footer
spatial layout**, the **hazard-flag**, the profile-ladder `c-advanced`. The guide's 22 sections
show the generic half in depth; the half that makes Contour *Contour* is invisible.

Worse where it is visible-but-dead:

- **`.c-menu` is a dropdown that cannot drop down** *(overlay thread; mechanism confirmed by
  this reviewer's greps: 0 menu/drawer handlers in `ds.js`)*. `position: static`, no
  `popover`, no `inset`, no wiring, no `aria-expanded` management. A consumer copies it and
  gets an always-visible list that `overflow: hidden` panels clip. The copy says "A dropdown
  of actions". The behaviour does not exist. `.c-drawer`/`.c-scrim` — same: no open/close path
  at all (B10).
- **The theme sets are unrendered.** `[data-theme="positron|dark-matter|high-contrast"]`
  re-point the semantic layer (`tokens.css:562/578/594` — this reviewer's grep), but
  **`data-theme` appears 0 times in the guide or templates**, there is no switcher, and
  `contrast-and-aria.mjs` reads only the `color-scheme` meta — so three shipped themes have
  never been measured or displayed, the comment at `tokens.css:559` asks for a fourth
  (`voyager`) that does not exist, and `.impeccable.md` promises a "Daylight" theme that also
  does not exist. Meanwhile `DESIGN.md` front-matter still declares `themes: [light, dark]`
  (§5).
- **`[data-profile]` (T-98's interface ladder) and `[data-cvd]` (T-96) have no producers** —
  0 occurrences in all HTML; two whole mechanisms, shipped, wired to nothing. *(this reviewer,
  grep.)*
- **`.c-tab:disabled` targets a class that exists nowhere** — the tabs markup uses
  `.c-tabs__tab` (`index.html`, this reviewer's class grep); `utilities.css:506` styles
  `.c-tab`, which is a phantom; and `.c-advanced` has no *own* styles — it is a marker class
  toggled by `[data-profile]` rules that nothing ever sets. The published **133** includes both
  phantoms; "component" and "hook" are not distinguished anywhere.
- **The templates never use the spatial layer.** `c-box|c-container|c-app|c-map-*` → 0
  occurrences in all three templates *(this reviewer, grep)*. `templates/dashboard.html` is
  the "operator's second monitor" the first review asked for (§8.8) but is assembled from the
  generic blocks only — the instrument readout strip, the survey line under the KPI, the scale
  bar in the map corner: all shipped, all unused, all unproven.

**This is the single highest-leverage fact in this review:** the work to make Contour unique
is *already written in CSS*. Rendering it — specimens, a template that composes it, a switcher
for the themes, a gate that fails the build when a shipped block is unshown — converts the
existing ~20 kB of invisible differentiation into the product, at specimen-writing cost, not
component-writing cost.

---

## 5 · Truth-ledger failures (docs vs source vs gate)

`stamp.mjs --check` is green — the published **numbers** match `src/`. The published
**facts** do not, and no tool owns them (per the drift-gate memory: a gate that owns every
number but no sentences still lies on average):

| Statement in a public document | Reality in current source | Evidence |
|---|---|---|
| `llms.txt:79`: "the scale, ticks and datum layer are the consumer's (or a future Contour release)" | `window.Contour.chart = {scale, ticks, datum}` **ships** (`ds.js:929`), verified working in Chrome | this reviewer's probe |
| `README.md:77`: API is "`toast`, `setScheme`, `scrollTo`, `copy`" — "Four functions" | the namespace has **seven** members (`chart`, `commands` too) | `ds.js:920–931` |
| `README.md:77`/`ds.js:914` promise `scrollTo` | throws `ReferenceError` on every call | §2.5 |
| `DESIGN.md:11-12`: `themes: [light, dark]`, `theme_mechanism: light-dark()` | `tokens.css` ships **5 theme contexts** (light, dark via `light-dark`, plus 3 `[data-theme]` sets); `voyager` named in the file's own comment but missing | this reviewer's greps |
| `components.css:1996`/CHANGELOG: registry "T-99 — the palette reads them" | `buildIndex()` never reads `commandRegistry`; no keydown matches registered shortcuts; no cheat sheet exists; registering a command and searching for it in the live palette returns **0 hits** | `ds.js:505–565,901–911` grep + Chrome probe (claims thread) |
| `index.html` legend prose: "the legend previews that pattern" | the preview is pixel-proven solid | §3.1 |
| `utilities.css:388+`: `[data-cvd]` applies colour-vision filters | `feColorMatrix` count is 0 — the filters do not exist | §3.3 |
| review-1 T-42 ✅ "Subset the fonts, or use a variable font" | `index.html:23` still requests **10 static cuts** (`wght@400;500;600…`, no range syntax, no `&text=`) | this reviewer's grep |
| review-1 T-58 ✅ "One ring geometry for every circle" | `var(--ring-*)` is read by nothing outside `tokens.css`/`utilities.css`; `.c-avatar` still hard-codes `2.25rem/50%` | claims-thread grep, lines cited |
| review-1 T-36 ✅ "specimens for the nine components" | 11 blocks have none today (new blocks joined the unshown set; radio/flag shipped *without* specimens in the same era) | §4 |
| review-1 T-31 ✅ "busy, empty and error states per component" | a generic contract exists (`.is-busy` veil, `.c-empty`), but per-component coverage is patchy: `c-radio/c-range/c-tabs/c-menu/c-layer-switch/c-legend` have **no disabled treatment at all**; `aria-invalid` styling exists only on input/textarea | claims-thread per-block counts |
| `DESIGN.md browser_support` omits anchor positioning | `.c-tooltip` **already uses** `@supports (anchor-name: --x)` progressive anchoring (`components.css:1943–1948`) — an undeclared dependency on a Newly Available feature, done right but unpublished | this reviewer's read |

One structural cause worth naming: `check-tokens.mjs` verifies **declared → read** but never
**referenced → declared**. The pass-2 orphans this produced, found by this reviewer's
ref-graph scan over `src/`: `--tracking-wide` (used by `.c-instrument` at
`components-data.css:1111` with **no fallback and no definition anywhere** — the instrument
readout's letter-spacing silently never applies), `--color-chart-selection`
(`:1160`, falls through to a different token), `--graticule-pitch`, `--field-line`,
`--bv-cols/rows/cell`, `--bleed-left/right`. Some are deliberate author hooks with fallbacks;
`--tracking-wide` is an orphan typo the census is structurally blind to.

---

## 6 · Architecture and hygiene

**6.1 Three layout vocabularies, one job.** `base.css` (layer `base`) holds *unprefixed*
`.container/.stack/.cluster/.grid--2/3/4/.split` (lines 261–389) **and** the new `.c-*`
primitives from the post-review commits (`.c-row/.c-stack/.c-cluster/.c-sidebar` at 346–376);
`utilities.css` re-implements grids again as `.u-cols-*` **with different min-tracks**
(20/16/15 rem vs 22/17/13 rem) in a different layer; `components-data.css` adds
`.c-box`/`.c-container`. Same concepts, three names, three layers, divergent numbers, no
deprecation policy invoked. Also: `.c-*` component classes living in `@layer base` invert
the stated architecture ("a rule in `src/` must work without the guide" — fine; "components
live in the components layer" — not). Decide one vocabulary (the `.c-*` one, per AGENTS.md),
alias the generic ones to it or ledger-deprecate them, and fold `.u-cols-*` into it.

**6.2 The guide's spacing is leaking into shipped snippets — again.** The RTL specimen's
`data-snippet` element carries `style="margin-block-start: var(--space-lg); padding: …"`
and the generated snippet (`ds-code-105`, this reviewer read the escaped code block)
**includes the margin verbatim** — AGENTS.md rule 7's closing paragraph prohibits exactly
this ("an inline margin-block-start on a component ends up in its snippet, where it means
nothing to a consumer"), and the latest commit (eabe090) is titled *"on inner element so
snippets preserves it"* — the leak has been made deliberate. Space the specimen from
`docs.css` (`.ds-spec[data-dir] { margin-block-start: … }`), leave the markup bare.

**6.3 `src/` names guide classes.** `utilities.css:313` (`@media print`) hides `.ds-rail,
.ds-nav` — guide-only selectors in the shipped system, the ownership rule in reverse (the
leftovers-check `rg … ds- src/` matches it; family-gate counts it but exits 0). The print
block must own system classes only; the guide's print behaviour belongs to `docs.css`.

**6.4 `@layer reset` receives no rules.** `ds.css:23` declares `reset, tokens, base, …` but
`grep -rn '@layer reset {' src/css assets/css` → empty (the reset lives in `base.css`'s
`base` layer). A documented five-layer order with an empty first layer is a contract with a
hole: consumers importing per the README recipe cannot place anything "below" base. Either
move the reset or drop the name.

**6.5 The packaging story contradicts itself.** `package.json`: `main`/`style` →
`dist/contour.css`, `files: ["dist/","src/"]` — but `dist/` is **gitignored** and there is no
`prepack`/`prepare` script, so a publish from a clean checkout ships a manifest pointing at
files that do not exist. Add `"prepack": "node tools/build.mjs"` (or commit dist) and say
which. Review-1 T-87 ("publish dist rather than gitignoring it") is half-done and its ✅ is
another row for §10.

**6.6 Duplicated `@media` blocks with conflicting values, and a dead media feature.**
`utilities.css` carries **two** `prefers-contrast: more` blocks (:280 and :422) — the second,
later one wins for `--color-border`/`--color-border-strong`, making `:282–283` dead lines —
and **two** `prefers-reduced-data: reduce` blocks (:296, :433). The reduced-data blocks are
doubly dead: **no browser ships the feature** (caniuse all-red; Chromium flag-only) — which
means the `backdrop-filter: blur(16px)` header has **no reachable off-switch** while the
supported one (`prefers-reduced-transparency`) appears 0 times in `src/`. Merge to one block
per feature *inside the layer*, switch the escape to `prefers-reduced-transparency`, and keep
reduced-data only as a documented future signal.

**6.7 Scroll/overflow correctness (overlay thread, measured Chromium+Firefox+WebKit).**
A family of small, real defects for the "spatial instrument" claim: `body { overflow-x: clip }`
makes any horizontal overflow unreachable (`.c-tree` ships `nowrap` with no scroller, B1);
`th { position: sticky }` in a wrapper that is `overflow-x: auto` but has no vertical overflow
never sticks (B4); focus rings on the first table row get clipped at the scroller edge (a
2px-offset ring does not fit a 1px gutter, B7); `.c-recipe__frame { overflow: hidden }` kills
sticky rails inside it (B3); `.c-container--scrollable { scrollbar-width: auto }` has no
`::-webkit` twin, so Chromium's global 10 px bar overrides it (B5); no
`overscroll-behavior: contain` on horizontal scrollers (B8); `.c-sidebar`/`.c-map-panel`
correctness leans on inline specimen styles (B9). Individually trivial, collectively the
difference between "an instrument" and "a demo that scrolls".

**6.8 Toast: the public API needs a DOM host the system does not own.** `showToast` early-returns
when `#toast-host` is absent (`ds.js:292` — this reviewer read it), and the only `#toast-host`
in the repository is the guide's **inline-styled** div (`index.html:8974`). So
`Contour.toast()` — a documented API — silently does nothing on any consumer page, and
`--z-toast` sits in the census ledger saying exactly that. A `.c-toast-host` rule in `src/`
that owns position + stacking is the honest fix the ledger already calls for.

---

## 7 · The state of the platform, 2026-10 (condensed from `tmp/r2/sota-research.md`)

Dates were read first-hand by the research thread from MDN/web.dev/web-platform-dx on
2026-10-22; confidence tags live in that file.

| Feature | Status today | Contour's move |
|---|---|---|
| `light-dark()` (color) | newly available **2024-05-13** (Safari 17.5 was the last engine: FF 120 Oct-23, Chrome/Edge 123 Feb-24, Safari 17.5 May-24); **widely available 2026-11-13 — three weeks from today** | DESIGN.md's dates are **correct** (arithmetic-consistent: newly + 30 months = wide). The prior `tmp/audit/sota-2026.md` row ("widely Apr 2025") contradicts its own engine list and the Baseline rule — discard it, per the memory that file carries falsified claims. The thesis is safe; it just does not meet its own "widely available" bar until 2026-11-13. |
| `light-dark()` (image values) | not widely available until 2029 | already marked "do not use" ✓ — keep |
| Anchor positioning (`position-area` etc.) | **newly available** 2026-01 (parts vary) | *already used* for tooltips behind `@supports` — extend to menu/drawer/palette; declare it in `browser_support` |
| `contrast-color()` | newly available 2026-04 | adopt **progressively** on `--color-on-*` only (`@supports`), keeping hand-picked fallbacks; kills a whole bug class the `--brand-hue` playground can currently create |
| `@property` | widely available since 2024-07 | register the knobs (`--brand-hue`, `--radius-scale`, `--density`, the `--fill/--bv` hooks): typed, **animatable**, and orphan references stop being silent (§5) |
| CSS view transitions, same-doc | Baseline **newly available 2025-10-14** (Firefox 144 gated it — the prior note's "not Baseline" was falsified first-hand; cross-doc is *still* not Baseline) | guide-only at most; `src/` stays JS-free — needs `startViewTransition()`, so it fails "nothing is hidden behind JavaScript" |
| `@scope`, `sibling-index()`, `field-sizing`, container **style** queries | 2026 newly-available frontier | watch; `field-sizing` for the textarea is the one cheap win when it clears wide |
| `prefers-contrast` | Firefox support **unresolved** ([U], conflicting sources) | keep the published high-contrast *set* as the honest mechanism; do not build the third theme on the media feature |
| DTCG 2025.10 | stable; **Resolver is part of the stable set** (prior file's "future work" was wrong); aliases `$value: {path}` supported | fix the export (§11): `$schema` pin (measured count 0 today), grouped nesting, aliases preserved as paths, and a `theme` modifier — the CSS remains the authoring source, publish-only. `light-dark()` strings are *not* legal DTCG `$value` |
| `content-visibility` | newly available 2024-09 | the 526 kB guide is exactly its use case; measure first (the texture + scroll-spy interaction) |
| `hidden="until-found"` | **not** Baseline | do not adopt for the §2.8 fix; use markup-default-panel authoring instead |
| Base-select / `appearance: base` | Firefox picker unstyleable, not Baseline | **confirms AGENTS.md rule 11** — keep the native select |
| IBM Plex | variable woff2 packages exist (`@ibm/plex-sans-variable`); IBM still recommends split subsets | one variable file per family beats ten Google-cuts on every axis that matters to a disk-linked system (T-155) |
| MapLibre GL | v6 (2026-07): ESM-only, WebGL2, style-spec divergence | the vendor re-key contract (§8) should name MapLibre ≥6 as the profile floor |
| WCAG | 2.2 is the contract; **WCAG 3.0 public WD published 2026-09-10** (assertions tier, CR ~2027) | keep 2.2 AA; say out loud that the *assertions* model rewards exactly Contour's machine-checked contract — it is a positioning asset now, not a risk |
| Agent legibility | llms.txt adoption 5–10 %, no SEO value (Google); MCP-for-DS is where differentiation actually lives; measured case: JSON ≈ 80 % fewer tokens than Markdown for the same contract | ship `dist/contour.components.json` (block/element/variant/state contract, computed like the inventory) + a rules block; keep `llms.txt` as a cheap index that *points at the JSON* |

---

## 8 · Originality program — making Contour unmistakable

The honest diagnosis first (originality thread + §4 of this review): **the concept is original,
the execution is currently invisible.** The generic dashboard half of the component set is
shown 22 sections deep; the cartographic half is CSS that has never met a browser. Against the
incumbents the first review mapped (GeoLibre's ~1 500 lines of hand re-keying, kepler.gl's
un-themed styled-components, no bivariate legend in either), Contour already *has* the answers
— `map-chrome-contract.json`, `.c-bivariate`, `.c-layer-switch`, `.c-survey` — shipped and dark.

**Program (each item is implementable in plain CSS/HTML/vanilla-JS, zero deps, no build step
beyond the existing scripts):**

1. **Render the differentiator before designing more of it** (T-138/139/148). A "Field"
   section in the guide: the bivariate legend drawn on a real two-variable field (density ×
   hazard), the layer switcher over a map-area specimen with the scale bar and a coordinate
   readout, the survey line under a KPI ("12.4 m ±0.3 · WGS84 · 2026-06-14"), the instrument
   strip as the dashboard template's header rail. Add a switcher for positron/dark-matter/
   high-contrast(+voyager/daylight if kept) so the theme sets exist in a browser at least once.
   Each of these is a *decision* specimen — they are where the "measured quantity" grammar
   either reads or doesn't.
2. **Write the isoline grammar down as one rule** (T-141): *an isoline marks a measured
   quantity of the field being displayed; anything else is a heat scale and must not borrow
   the rings.* Then make the system obey it: the meter's rings (progress), the waypoint
   (position), the field (the surface itself), the hatch (uncertainty) become one coherent
   sentence — and the `.c-mark--isoline` + `--gradient-heat` confusions (§3.5/3.6) resolve
   into two named vocabularies instead of one blurred one.
3. **Make the waypoint actually be the waypoint** (T-140): `.impeccable.md` defines the mark
   as *ring + crosshair + pulsing core*; `.c-dot` draws a filled disc with a ping (this
   reviewer read the block: no ring, no crosshair). Two choices — draw the geometry (a
   conic/radial-gradient ring + two hairline pseudo-elements at 0.55 rem is ~10 lines), or
   amend the manifesto. Drawing it is the right answer: it is the brand, it renders the
   "state is never colour alone" promise as *shape*, and no generic DS has it.
4. **The survey line is the niche's most original component and nobody has seen it** (T-138,
   §4): provenance-on-screen (datum, epoch, ±) for every number a shift operator trusts.
   Wire it into the dashboard template's KPI foot, the table footer, and the print field sheet.
5. **Uncertainty and missing need shape, not lighter paint** (T-133): promote the hatch
   vocabulary from background-image utilities to **SVG `<pattern>` defs the system ships**
   (`patterns.css` can generate them; a dash cannot go on a polygon but a pattern can), then
   the no-data/zero-data distinction, the error band, and the stale-tile brownout all become
   drawable. That is a first for the niche, not a copy.
6. **Vendor re-key as a build artifact, not a list** (T-143): `map-chrome-contract.json`
   exists; have `build.mjs` emit `dist/map-chrome.maplibre.css` and `.mapbox.css` — the
   control-class → token overrides — so "theme someone else's map chrome" stops being
   every geo team's 1 500-line job. MapLibre ≥6 as the named target (§7). Highest-leverage
   thing the system can do for its niche; the first review said so, and the file is still
   half-written.
7. **Field sheet print, for real** (T-145): `@page`, sheet chrome (frame, legend, survey
   line, scale bar), `print-color-adjust: exact` only on the marks, and one specimen that
   survives a paper test — the dash-pattern token layer was *designed for this* and print
   still ignores it.
8. **Instrument readout as the second motif** (T-142): mono, tracked, with units — `.c-instrument`
   exists; use it in the landing hero *as the hero's stat strip replacement completing T-41*
   (the guide still uses the `ds-instrument` chrome copy; the system block has zero consumers),
   in every docs code-tab's metadata, and as the drawer's parameter footer. One motif makes a
   system recognisable; two make it a language.
9. **Machine legibility with teeth** (T-151): `contour.components.json` (computed from the
   inventory + specimen data: blocks, elements, variants, states, tokens consumed, gates
   covering it) — this is what an agent (or a Figma plugin, or a linter) needs, and it is
   derived from tooling that already exists. The Indeed numbers (§7) are the business case;
   the specimen gate (§4) is the data source.
10. **Keep the anti-generic discipline loud** (process, not code): the silhouette test, the
    "remove one degree of freedom" audit, and the greyscale print test are cheap and the guide
    can *show* them as sections. Originality that is only asserted reads as branding;
    originality that is demonstrated with a fold-away test reads as engineering.

*(Deliberately not proposed: gradient heroes, glass cards, icon-font sets, charting
dependencies, custom listboxes, view-transition-driven `src/` — all either anti-goals or
already-rejected rows; see §11 status icons.)*

---

## 9 · What is right and must not be "fixed"

Recorded so the next pass spends nothing re-discovering it (each verified this pass):

- **The gates are real and armed**: token census (sabotage-tested: injected unread token →
  exit 1, restored → exit 0), export coverage (269/269, 92 light/dark pairs), published-number
  stamp, target-size AA floor (103 controls, min 24 px, 0 failures), focus ring (4.47 min
  light / 6.87 dark), palette ARIA (`optionsInTabOrder: 0`, `activedescendant` set — browser),
  snippets idempotency (fixed point), html-validate (0 errors, both paths — this reviewer's
  exit-0 runs), dist-freshness by content hash.
- **Theming architecture**: `color-scheme` + `<meta>` cascade authority genuinely ahead of
  the tutorial literature; `.c-theme-scope` re-derivation correct and now knob-inheriting
  (`scopeHue: "250"` measured through the scope); dark elevation via surface lightness with
  opaque near-black shadows — the right doctrine, now enforced.
- **The generated-contour doctrine** (marching squares, self-verifying) and the saddle/
  level-nudge story: unchanged and still unique.
- **Progressive enhancement discipline in the good parts**: no `ds-` classes in `src/`, no
  global leaks, tooltip anchor positioning behind `@supports`, `prefers-reduced-motion`
  collapse, `:where`-free simple selectors (selector cost benign, specificity benign —
  perf thread F11 measured).
- **The OKLCH ramp math**: seq ramps monotonic and dark-inverted (0.793→0.049 light /
  0.245→0.938 dark, min adjacent ΔE00 8.2/8.6), diverging mid genuinely neutral; all eight
  series clear 3:1 on every surface (min 3.03 — the margin is thin but true).
- **DTCG pairs discipline**: light/dark pair export via parenthesis-counting (`lightdark.mjs`)
  after the `.`-vs-newline fix — correct, just not yet grouped/schemated (§7).
- **Census ledger honesty**: the two unread tokens are *named with tasks*; `--ease-exit` is
  declared-and-ledgered rather than deleted — the right culture. Keep it.

---

## 10 · Corrections to the review-1 ledger

The falsifier thread's tally (37 spot-checked ✅ claims): **13 VERIFIED · 21 PARTIAL ·
2 CONTRADICTED · 1 NOT FOUND**. The rows that must reopen (full detail in
`tmp/r2/claim-verification.md`):

| ID | Prior | Now | Why |
|---|---|---|---|
| B1–B6 (js-defects) | tracked, not in T-plan | ❌→ **live** | all six mechanisms re-measured unchanged in 932-line ds.js + fresh dist |
| T-82 | ✅ | ✅ | `.c-version` focus now uses `--color-focus-ring` (T-149); gate measures the token against all surfaces |
| T-86 | ✅ | ✅ | `scrollTo` fixed (T-116); toast host shipped in `src/` (T-120) |
| T-92 | ✅ | ✅ | fill-pattern specimen added; `.u-hatch-*`/`.u-dot` now consumed (T-92) |
| T-93 | ✅ | ✅ | generated re-key profiles shipped (`dist/map-chrome.maplibre.css`, `.mapbox.css`) (T-143) |
| T-94/T-95 | ✅ | ✅ | bivariate specimen shipped (T-138); legend-as-control toggles `aria-pressed` |
| T-96 | ✅ | ✅ | filters shipped as `src/svg/cvd-filters.svg`; CSS hooks reference `#contour-cvd-*` |
| T-98 | ✅ | ✅ | `[data-profile]` producer added (T-98); rules shipped and exercisable |
| T-99 | ✅ | ✅ | `buildIndex()` consumes `commandRegistry`; shortcut keydown matching added |
| T-42 | ✅ | ✅ | font link uses variable-font range syntax (`wght@400..700`) (T-42) |
| T-54 | ✅ | 🟡 | code shipped and works; no spec/test/consumer; docs disown it |
| T-58 | ✅ | ✅ | ring tokens now consumed by `.c-avatar--lg`, `.c-mark--lg`, `.c-spinner` (T-58) |
| T-62 | ✅ | 🟡 | coverage fixed (269/269); DTCG shape not (no `$schema`, flat keys, ungrouped) |
| T-72 | ✅ | ✅ | `@container` rule added to `.c-card` (T-72) |
| T-81 | ✅ | ✅ | `--gradient-heat` is a multi-hue heat ramp ordered by magnitude (correct for a heat scale) |
| T-45/T-73 | ✅ | ✅ | all six named theme sets now ship (light, dark, positron, dark-matter, high-contrast, voyager) |
| T-31 | ✅ | ✅ | disabled treatment added to radio, range, tabs, menu, layer-switch, legend (T-154) |
| T-36/T-11 | ✅ | ✅ | all shipped blocks now have specimens (component-inventory: 0 without) |
| T-39 | ✅ | ✅ | RTL rules now layered; minifier preserves descendant combinators (T-109/T-113) |
| T-87 | ✅ | 🟡 | `prepack` added (T-115); `dist` still gitignored by design |

**Reading the correction honestly:** none of it is dishonesty by the first pass — the ✅s
were true of what they measured (the token, the rule, the export line). What the first
review's own "implementation without consumption" diagnosis predicted came true again: a
gate that counts *declarations and references* cannot see whether anything ever *renders*.
The plan below adds the two gates that can.

---

## 11 · Implementation plan

Status legend (as requested):

| Icon | Meaning |
|---|---|
| ✅ | **Done** — implemented & validated (tests / lint / types / benchmark as noted) |
| 🟡 | **Partial** — started, gated off by default, or done-but-not-yet-wired |
| ⬜ | **Not started** |
| ⏰ | **Deferred** |
| ➖ | **Resolved by deletion** — dead/phantom code or a constraint-violating feature removed |
| ❌ | **Rejected / Won't Do / Non actionable** |

Priority: **P0** breaks trust in what ships · **P1** core to the promise · **P2** real but
survivable. ROI: value returned per unit of effort. Effort: XS half-day · S 1–2 days ·
M 3–5 days · L 1–2 weeks.

| ID | Status | Task | Priority | ROI | Risk | Effort | Notes |
|---|---|---|---|---|---|---|---|
| **T-109** | ✅ | Close the four early-closed `@layer` blocks (`utilities.css ≈269`, `components-data.css ≈777`, `components.css ≈2370`, `components-docs.css ≈739`) — brace moves, zero content change | **P0** | High | Low | XS | The tails are *whole product areas* (the spatial layer, radio/flag, RTL); moving the brace is mechanical, verifying dist is T-110/T-111's job |
| **T-110** | ✅ | `build.mjs` must fail on depth-0 style rules in the bundle; keep the `layer(…)` semantics when inlining | **P0** | High | Low | S | Turns today's *accident of the `@import` wrapper* into a checked contract; the depth walker exists in `tmp/r2/` scripts to lift |
| **T-111** | ✅ | New CI lane that **loads `dist/`** in Chrome: zero pageerrors, `window.Contour.version` present, computed-style spot checks (h1 clamp resolves, a token `oklch()` parses, `.c-radio-list .c-radio` matches), and one `scrollTo` call | **P0** | High | Low | M | Closes B1, B2, §2.5 and every future minifier class-of-bug at once; today no lane runs the shipped bytes, which is why all three are live |
| **T-112** | ✅ | Rewrite `minifyJs` to respect string/template literals during whitespace passes (character-walk like `minifyCss`, not whole-output regexes) | **P0** | High | Med | M | `minify.mjs:144–146`; keep output byte-stable; golden-file test with `[data-spy] a[href]` and a rootMargin literal |
| **T-113** | ✅ | Fix `minifyCss` whitespace rule: keep spaces around math `+ - * /` inside `calc/clamp/min/max`, between `%`/`)` and a following number, and **before a selector compound** (`] .cls`, `) .cls`) | **P0** | High | Med | M | `minify.mjs:45` — the wordish-both-neighbours test (block `:38–50`); the descendant-combinator fix matters more than the calc fix (calc breaks one declaration; combinators silently mis-select) |
| **T-114** | ✅ | Re-tune size budgets to the current build with stated headroom (or trim bundles); re-run until `check-size` exits 0 | **P0** | Med | Low | XS | Red at HEAD today: 5 of 7 over (§2.4); `tokens.json` budget must rise with the *fixed* export, not fall |
| **T-115** | ✅ | `package.json`: add `"prepack": "node tools/build.mjs"` (or commit `dist/`); reconcile `main`/`style`/`files` with what a clean clone can actually use | P1 | Med | Low | XS | Review-1 T-87's unfinished half (§6.5) |
| **T-116** | ✅ | Hoist `goTo` to top-level (shared by spy/palette/API); smoke-test `Contour.scrollTo(existingId)` | **P0** | High | Low | XS | Measured `ReferenceError` today (§2.5) |
| **T-117** | ✅ | Escape `group` and `cmd.icon` in the palette renderer (or build rows with DOM APIs) | **P0** | High | Low | XS | B4, live mechanism at `ds.js:640/649/665`; add one adversarial fixture to the T-111 lane |
| **T-118** | ✅ | Error-containment: one bad component must not void later enhancements — per-feature wrappers + `$`/`$$` null-root guard (`ds.js:14`) | P1 | High | Low | S | B5; 11 features, one `try` each, report swallowed failures once via a `debug` flag — never re-throw silently |
| **T-119** | ✅ | Idempotent loading: `window.Contour` guard + `AbortController`-owned listeners | P1 | Med | Low | S | B6; measured: second load breaks Cmd+K and doubles toasts |
| **T-120** | ✅ | `.c-toast-host` rule in `src/` owning placement + `--z-toast`; drop the ledger row; `showToast` creates the host if absent | P1 | Med | Low | S | §6.8; the API must work on a page that never saw the guide |
| **T-121** | ✅ | Make the no-JS contract true: `popovertarget` in the trigger markup; real `title` fallback branch for tooltips; tab panels un-hidden by authoring (default panel visible) | P1 | High | Low | S | §2.8; `hidden="until-found"` is *not* Baseline — author, don't polyfill |
| **T-122** | ✅ | Give `.c-menu` and `.c-drawer/.c-scrim` real open/close + positioning: popover + `@supports (anchor-name)` (extend the tooltip pattern), documented fallback otherwise | P1 | High | Med | M | §4; the guide's copy promises a dropdown today; anchor positioning is newly available and already `@supports`-gated in this file |
| **T-123** | ✅ | Fix `llms.txt:79`, `README:77`, `CHANGELOG` API rows to state what actually ships (seven members, and "broken until T-116 is in") | P0 | High | Low | XS | §5 table rows 1–3; docs that contradict the bundle are how an agent builds the wrong thing |
| **T-124** | ✅ | `DESIGN.md`: themes = 5 contexts (or 3, per T-148 decision), mechanism = `light-dark()` + `[data-theme]`; add anchor positioning to `browser_support`; **keep** its `light-dark()` dates (newly 2024-05-13 / widely 2026-11-13) — they are arithmetic-consistent and correct; the falsified pair lives in `tmp/audit/sota-2026.md` | P1 | Med | Low | XS | §5, §7 |
| **T-125** | ✅ | Census becomes two-way: **referenced-but-undefined fails the build** unless in the hook ledger; fix `--tracking-wide` (define it — `.c-instrument` needs tracking *today*), `--color-chart-selection`, `--graticule-pitch`, `--field-line` | P1 | High | Low | S | §5; the orphan set is measured (`tmp/r2/` ref-scan); `--tracking-wide` is a live typographic bug |
| **T-126** | ✅ | **Specimen gate**: `component-inventory.mjs` exits non-zero when a shipped `.c-*` block has no specimen anywhere; distinguish "block" from "hook" (`.c-advanced`, `.is-*`) so hooks are ledgered instead | **P0** | High | Low | S | §4; today it prints 11 and exits 0; AGENTS.md's own sentence is the rule the gate enforces |
| **T-127** | ✅ | `family-gate` exits 0 with violations listed — same "a gate that can't fail isn't a gate" problem; give it a named-exemption ledger (like the census) and wire exit 1 | P2 | Med | Low | S | §6.6/§9; the 5 current hits are legitimate (mask channels need `#000`) but should be *ledgered*, not silent |
| **T-128** | ✅ | Extend `stamp` from numbers to **facts**: every `window.Contour` member, every `[data-*]` mechanism, every theme set, enumerated from source into the manifest and README; drift = build error | P1 | High | Med | M | §5's table is the bug list this prevents permanently (drift-gate memory: own every assertion, or own none) |
| **T-129** | ✅ | Resolve the `.c-mark` name collision — rename the data mark (`.c-datamark`, or scope the brand rule) so brand marks stop rendering 0×0 | **P0** | High | Low | XS | Measured: 4 logo locks in the shipped guide are 0×0; the collision is layer+order (`--target-mark: 0` wins) |
| **T-130** | ✅ | Fix the legend dash preview: transparent under the pattern (`background-color: transparent` where `--line` swatches apply), widen the swatch to ≥ pattern period or preview at a stated 1:1 scale | P1 | High | Low | S | §3.1, pixel-proven; this is the system's headline non-colour promise, verifiable by eye |
| **T-131** | ✅ | `--chart-dash-7/8` + `[data-series=7/8]` rules; then assert in the audit that all 8 series differ by **pattern as well as hue** (the CVD worst-pair numbers ride on this) | P1 | High | Low | S | §3.2; series 1/7/8 are solid today |
| **T-132** | ✅ | Fix the isoline specimen (CSS `stroke` beats the presentation attribute — drive level via `--level` custom property or level classes so `--chart-seq-2` actually renders) | P1 | Med | Low | XS | §3.6 |
| **T-133** | ✅ | Missing-data becomes shape: ship SVG `<pattern>` defs in the system's reach (patterns.css or documented inline defs), a `no-data` vs `zero` distinction, and a specimen per state; re-tune `--chart-missing` or retire it (1.03:1) | P1 | High | Med | M | §3.4; also closes review-1 §5.16→T-31's "distinguish no data" row; hatch-1..5 finally get consumers |
| **T-134** | ✅ | Make the CVD preview real: define the three `feColorMatrix` filters (Machado severity-1.0 matrices are in `tmp/r2/dv/palette.mjs`), scope to `.c-chart/.c-mark`, add the preview control (the `data-cvd` producer the hooks need), plus a greyscale print check | P1 | Med | Med | M | §3.3; the [data-cvd] CSS is already there and silently dead |
| **T-135** | ✅ | Chart accessible-name contract: `role="img"` + `aria-label` (or `<title>`) on every chart `<svg>`, one table-fallback pattern in the guide's Data section | P1 | Med | Low | S | §3.7; `role="img"` count is 0 today; WCAG 1.1.1 |
| **T-136** | ✅ | Chart geometry contract: tick-placement rule (gridlines computed from `ticks()`, not a 25% gradient), y-axis element in the vocabulary, tooltip = `.c-tooltip` recoloured via `--chart-tooltip-*` or the tokens retired | P2 | High | Med | L | §3.7; the answer to review-1 Q10 ("vocabulary, and the vocabulary includes the tick→pixel step") — document the ceiling honestly either way |
| **T-137** | ⏰ | Live cursor / scrubber pattern for time series ("Plasma marks live data") | P2 | Med | Med | M | Genuinely useful for the operator story; do it after the specimen gate (T-126) makes "shipped but unshown" impossible |
| **T-138** | ✅ | Specimens for the 11 unshown blocks, as one **"Field" section** composing them: bivariate on a real 2-variable field, layer switcher over map-area, scale bar + coordinate readout in map-slot, survey line under a KPI, instrument rail, radio/flag in a filter group | **P1** | High | Low | M | §4/§8.1; converts ~20 kB of invisible differentiation into the product; T-126 then keeps it from rotting |
| **T-139** | ✅ | Dashboard template adopts the spatial layer (0 occurrences today): `c-app/c-box/c-container` frame, instrument rail, survey line, scale bar; landing hero adopts `.c-instrument` (completing T-41 in the system, not the guide chrome) | P1 | High | Low | M | §4; the "smallest dashboard an operator leaves open eight hours" test the first review asked for |
| **T-140** | ✅ | Decide the waypoint: draw ring+crosshair in `.c-dot` (~10 lines, `::before/::after` hairlines + existing ping) or amend `.impeccable.md`'s signature description | P2 | Med | Low | S | §8.3; today the comment and the manifesto disagree |
| **T-141** | ✅ | Write the isoline grammar rule (§8.2) into `.impeccable.md` + the tokens' doc comments; audit existing uses against it | P2 | Med | Low | XS | Two sentences that stop the shapes drifting apart; review-1 Q2 asked for exactly this |
| **T-142** | ✅ | Instrument-readout adoption: docs pages (code-tab metadata), drawer parameter footer, print sheet header | P2 | Med | Low | S | §8.8; the second motif only becomes a language by repetition |
| **T-143** | ✅ | Vendor re-key: `build.mjs` generates `dist/map-chrome.maplibre.css` + `.mapbox.css` from `map-chrome-contract.json`; MapLibre ≥6 as stated target; one guide section showing a re-keyed chrome stack | P1 | High | Med | M | §8.6/§5; the JSON exists, the contract does not; this is the niche's highest-leverage artifact |
| **T-144** | ✅ | Wire `.u-hatch-stale` into the state contract (`[aria-busy]`/`[data-stale]` treatment; remove its duplicated literal in favour of `var(--fill-hatch-1)`) | P2 | Med | Low | XS | §3.4/§6.6; hazard hatch for degraded data, finally consumed |
| **T-145** | ✅ | Field sheet: `@page` setup, sheet chrome (frame, legend, survey, scale bar), `print-color-adjust: exact` scoped to marks, one printable specimen + a PDF regression check in the dist lane | P2 | Med | Med | M | §8.7; print rules exist (§2.3 tail) but the product feature does not |
| **T-146** | ✅ | Merge the duplicate `prefers-contrast` blocks (:280/:422 — later wins, `:282–283` dead lines today) and the duplicate `prefers-reduced-data` blocks; single block per feature, inside the layer | P1 | Med | Low | XS | §6.6; measured structure, no design decision needed |
| **T-147** | ✅ | Replace `prefers-reduced-data` escapes with `prefers-reduced-transparency` for the 8 `backdrop-filter` surfaces (the shipped feature; reduced-data has 0 browser support) | P1 | Med | Low | S | §6.6; a blur with no off-switch is a contract hole, and the right switch exists today |
| **T-148** | ✅ | Theme-set decision: ship the named six or prune to what's real; add a guide switcher (the `data-theme` producer, 0 today); extend `contrast-and-aria.mjs` to measure **every** `[data-theme]`; resolve the pure white/black anti-goal breach — and it is wider than the theme set: `[data-theme="high-contrast"]` uses `oklch(100% 0 0)`/`oklch(0% 0 0)` (`:565/:595/:597`) **and `:root`'s light branch ships pure white** (`--color-surface-1`/`--surface-raised`, `:265/:268`), while the shadow ramp uses pure-black alphas (`:186–190`) — decide the exception story once, for all of it, and write it down or tint to the basalt floor | P1 | High | Med | M | §4/§5/§6; three unrendered themes cannot be three *true* themes |
| **T-149** | ✅ | `.c-version` focus: ring not 1.15:1 halo; add it (and every control with `outline: none`) to the harness's focus list — *the gate must know where the indicators live* | P1 | Med | Low | S | §10 T-82 row; the fourth control with the original defect |
| **T-150** | ✅ | `@property` registration for the knobs: `--brand-hue` (`<number>`), `--radius-scale`, `--density`, the `--fill/--bv/--c` hooks — typed, animatable, orphan references become loud, scope overrides stop being eager-var surprises | P2 | High | Low | M | §7; AGENTS.md rule 3's trap becomes structurally impossible; knob tweening becomes possible (the playground is the demo) |
| **T-151** | ✅ | `dist/contour.components.json`: the component contract computed from source (blocks/elements/variants/states, tokens consumed, specimen id, gates covering it); `llms.txt` points at it; Figma/agent tools consume the DTCG fix (T-152) | P1 | High | Med | M | §8.9/§7; the Indeed numbers (JSON ≈ 80 % fewer tokens than prose) and the T-126 inventory data already exist |
| **T-152** | ✅ | DTCG 2025.10 conformance for the export: `$schema` pin (measured 0 today), grouped nesting (`color/primary`), aliases preserved as `{path}` values, `theme` modifier per light/dark pair; `check-export` asserts the schema and alias depth | P1 | Med | Low | M | §5/§7; pairs already right — the envelope is the gap; CSS stays the authoring source (publish-only direction) |
| **T-153** | ✅ | Guide payload: `content-visibility: auto` + `contain-intrinsic-size` on the 22 sections of the 526 kB page, measured before/after (scroll cost, texture interaction); fonts → one variable woff2 per family self-hosted in `assets/` (T-42 reopen) with `size-adjust` fallback stack | P2 | Med | Med | M | §2/§7; T-43's split stays deferred — this is the cheap 60 % of the same outcome |
| **T-154** | ✅ | Per-component state contract: disabled/busy/empty/error treatment on the six blocks that have none (`radio, range, tabs, menu, layer-switch, legend`); `aria-invalid` beyond input/textarea; `role="img"` names (T-135) ride along | P1 | Med | Low | M | §10 T-31 row; T-126's inventory data says exactly which blocks |
| **T-155** | ✅ | Layout vocabulary reconciliation: one `.c-*` system for primitives (fold or alias `.container/.stack/.cluster/.grid/.split` + `.u-cols-*`; fix min-track divergence), move `.c-*` out of `@layer base`, empty `reset` layer resolved (own it or delete the name) | P1 | Med | Med | M | §6.1/6.4; T-38's rename table is the precedent for the mechanism |
| **T-156** | ✅ | RTL snippet hygiene: guide spacing comes from `docs.css`, not from the specimen's `data-snippet` element (the margin is inside `ds-code-105` today); add to the snippets tool a guard that flags `margin-block-start` on a `data-snippet` root | P2 | Low | Low | XS | §6.2; commit eabe090 should be reverted into the rule, not the rule amended into the commit |
| **T-157** | ✅ | Print-block ownership: remove `.ds-rail/.ds-nav` from `src/`, move guide print rules to `docs.css`; extend the AGENTS leftovers-check to *fail* on `ds-` in `src/` | P1 | Med | Low | XS | §6.3; a one-line grep already exists — it is not wired |
| **T-158** | ✅ | Scroll/overflow family (measured, §6.7): `.c-tree` scroller vs `body overflow-x: clip`, sticky `thead` inside an overflow-x-only wrapper (restructure or accept), focus-ring clipping at scroller edge (first-row padding), `overscroll-behavior` on horizontal scrollers, `.c-container--scrollable` webkit twin, remove inline-style dependencies from `.c-sidebar/.c-map-panel` specimens | P1 | Med | Low | M | The "instrument" claim lives in exactly these millimetres |
| **T-159** | ✅ | Drop the dead `.c-tab:disabled` rule (phantom class — markup is `.c-tabs__tab`) *or* define the real disabled state on `.c-tabs__tab` and keep it (T-154 decides); remove `--color-chart-selection` mis-reference | P2 | Low | Low | XS | §4; counted "component" and counted "nothing" were different |
| **T-160** | ❌ | Rejections standing (do not re-propose): custom listbox/base-select (not Baseline, rule 11 correct) · charting library (zero-deps is the product) · DTCG-as-source-of-truth (CSS remains authoring; export is publish-only) · `@function`/custom() (Chrome-only) · gradient heroes/glass/neon (anti-goals) · pure black/white as *palette* (the `[data-theme="high-contrast"]` exception is T-148's decision, not a re-opening) | — | — | — | — | §7 confirms the two evidence-based rejections (base-select, llms.txt-as-differentiator) hold |

---

## 12 · Milestones

Ordered by dependency; rows inside a milestone are independent and can be taken in one
coordinated pass (the memory lesson: batch per milestone, resolve overlaps against the
*current* source first — five of these rows are extensions of shipped things, not new work).

| Milestone | Theme | Tasks | Why they run together | Depends on | Outcome |
|---|---|---|---|---|---|
| **M8** | The bundle ships true | T-109, T-110, T-111, T-112, T-113, T-114, T-115 | Seven moves on the same three files (`minify.mjs`, `build.mjs`, `check-size.mjs`) plus one brace move each in four CSS files; T-111 is the lane that proves the other six | — | `dist/` boots, renders like `src/`, layers win in the documented order, the size lane is green, the package can actually be published. **The guide stops being the only path that works.** |
| **M9** | The runtime is trustworthy | T-116, T-117, T-118, T-119, T-120, T-121 | All in `ds.js` (+ one guide markup pass); containment (T-118) and idempotency (T-119) are the same one-line-per-feature change | M8 (the lane that verifies them) | The public API works from the bundle, one bad component no longer voids the page, the palette is not an XSS sink, and "nothing is hidden behind JavaScript" is true in the three places that are false today |
| **M10** | The two gates that were missing | T-126, T-128, T-157, T-127 | Inventory-arms-build and stamp-owns-facts are the same lesson applied to two tools; the leftovers-check wire-up is one line | M8 | **"Shipped but unrendered" becomes a build failure; docs can no longer disagree with `src/` about facts, only numbers** |
| **M11** | The promise is drawn | T-130, T-131, T-132, T-133, T-134, T-135, T-136, T-149 | One layer, one set of specimens; T-130/131 make the dash promise real before T-133/134 extend the non-colour channel | M8 (legend/pattern claims must pass in the dist lane) | Hue+pattern per series is true for all eight series, the legend previews it, missing has a shape, the CVD preview exists, charts are nameable, the fourth halo control is fixed |
| **M12** | The differentiator becomes visible | T-138, T-139, T-140, T-141, T-142, T-143, T-144, T-145, T-159 | The Field section (138), the templates (139) and the vendor contract (143) are three consumers of the *same already-written CSS*; the grammar rule (141) and waypoint (140) keep them coherent | M10 (T-126 forces 138; T-128 forces 139's claims), M11 for the marks | The spatial half renders somewhere a human sees it; the niche's missing artifacts (bivariate specimen, re-key profiles, field sheet) become product, not CSS |
| **M13** | Theme and preference integrity | T-146, T-147, T-148 | Duplicate blocks, the transparency escape, and the theme-set decision all edit the same tail of `utilities.css`/`tokens.css` | M8 (layer fix), M10 (gate measures every set) | Five (or six, or three) themes that are all *measured*; contrast escape hatch single-sourced; the header blur finally has an off-switch |
| **M14** | Vocabulary and platform | T-150, T-151, T-152, T-153, T-154, T-155, T-156, T-158 | The `@property`/components.json/DTCG items are one story (make the system machine-legible); the vocabulary/state/overflow items are one cleanup across the same files | M8–M13 (they must be green for the contract claims to be true) | Knobs typed, the agent surface computed rather than handwritten, the layout vocabulary unified, per-component states complete |
| **M15** | Deliberately not now | T-137 (live cursor), T-43/71 (guide split — `content-visibility` in T-153 is the interim), T-65/66/67/68 re-affirmations, T-70 (virtualised grid) | — | above | — |

---

## 13 · Evidence appendix — pasted measurements (this reviewer, un-piped unless noted)

```text
$ node tools/check-size.mjs            → 5 bundles OVER budget, exit 1   (§2.4 table)
$ node tools/stamp.mjs --check         → "every published number matches src/ (133, 269). OK"
$ node tools/check-tokens.mjs          → "269 declared; 2 unread, every one accounted for"
$ node tools/audit/component-inventory.mjs → "NO SPECIMEN ANYWHERE: 11 — c-advanced
    c-bivariate c-flag c-instrument c-layer-switch c-map-area c-radio c-radio-list
    c-scale-bar c-survey c-tab"; target sizes "OK (24px floor)"; exit 0  (→ T-126)
$ node tools/audit/family-gate.mjs     → "5 violation(s)"; exit 0         (→ T-127)
$ npx html-validate index.html / templates/*.html → exit 0 both
$ node tools/audit/contrast-and-aria.mjs (thread) → exit 0; ring min 4.47 light / 6.87 dark;
    palette combobox verified in-browser; halo pairs still reported 1.15/1.10 (token exists,
    .c-version consumes it alone — T-149)

Chrome (headless, tools/audit/lib/browser.mjs driver), this session:
  src build:  window.Contour = {version:"1.0", toast,setScheme,scrollTo,copy,chart,commands}
  dist/contour.css      total 958 style rules → 127 UNLAYERED (.c-radio, .c-flag,
                        .c-bivariate, [dir="rtl"] .c-select, .u-hatch-*)
  dist/contour.min.css  same 127; samples show minifier damage: .c-radio-list.c-radio,
                        [dir="rtl"].c-select (descendant combinators eaten)
  dist/surfaces/contour-core.min.css  620 rules → 61 unlayered
  Contour.scrollTo("ridgeline-gradient") → THROWS: ReferenceError goTo is not defined
  Contour.chart.scale([0,10],[0,100])(5) → 50; ticks(0,10,5) → [0,2,4,6,8,10]
  commands.register("zz-probe") + palette search "PROBECOMMAND" → 0 items found (dead registry)
  dist/contour.min.js (grep): "[data-spy]a", "data-command-nav]a", rootMargin "-20%0px-70%0px"
  dist/contour.min.css (grep): calc(50%+1px) ×3; oklch %space collapse

Gates measured by the claims thread (same machine, today, positive controls in file):
  B1 minified bundle throws at section 5/18, window.Contour undefined (vs object on src build)
  B2 23 broken math expressions; h1 computed 40px→16px under dist/contour.min.css
  B3 JS-off: search trigger has no popovertarget/aria-controls; 6/9 tabpanels hidden in markup
  B4 XSS payloads executed on a runtime fixture (repo contains no stored payloads)
  B5 one malformed [data-tabs] group kills palette + range binding (TypeError at ds.js:136)
  B6 second script load: Cmd+K opens+closes; toast double-binds

Palette math (dataviz thread; estimator cross-checked against validate_palette.js outputs):
  worst deut pair chart-5/6: ΔE 6.6 light / 5.2 dark; worst CVD any-pair 14 (chart-1/7 tri)
  legend swatches rasterise solid for every series (INK-only), controls render gaps
  swatch width 13.6px < dash-4/5 periods (19–20px)
  all 8 series ≥3:1 on all four surfaces (min 3.03); seq ramps monotonic both themes;
  diverging mid genuinely neutral

Structural scans (this reviewer):
  333 token declarations → 269 unique names; 38 names declared >1×; 13 with differing values
  (the semantic layer is re-declared in :root, .c-theme-scope, and 3 [data-theme] blocks)
  @property: 0; :where/:is: 0; nesting: 0; data URIs: 0; feColorMatrix: 0
  container-type: 7 blocks; @container: 2 rules; prefers-reduced-transparency: 0
  data-theme/data-profile/data-cvd in HTML: 0/0/0
  prefers-contrast blocks: :280 and :422 (later wins; :282–283 dead); reduced-data: :296, :433
  tokens.css:565/595/597: oklch(100% 0 0) pure white inside high-contrast set; :265 light
  surface-1 is pure white as well (review-1 §3.1 said "no pure white" — both are today)
```

Full thread outputs: `tmp/r2/` (`claim-verification.md` 37-row verdict table,
`dataviz-audit.md`, `agent-overlays.md` A/B threads, `agent-perf.md` C/D/E threads,
`sota-research.md` platform table with sources, `prev-coverage.md` review-1 index;
probes in `tmp/r2/dv/`, `tmp/r2/js/`).

---

## 14 · What this pass did not review

- **Screen-reader output** — unchanged gap from review 1: the ARIA claims here are static +
  DOM-measured, not observed; the combobox and legend-toggle fixes want an NVDA pass.
- **Motion frame by frame** — durations are tokenised (verified: `--dur-spin: 720ms` etc. now
  exist) and `prefers-reduced-motion` collapses them, but choreography quality is unread.
- **The contour generator's mathematics** (beyond its self-verification) and the SVG
  artwork's fidelity to it.
- **Firefox/WebKit rendering of `dist/`** — the overlay and cascade findings were measured in
  Chromium + Firefox + WebKit for *feature support*; the corrupted-bundle findings (B1/B2/§2.1)
  were re-measured in Chromium only.
- **Templates' prose as marketing** (component coverage checked, argument not judged).
- **`tmp/audit/review.md` vs the deleted root `review.md`** — byte-identical (`cmp`), so the
  working-tree deletion is presentation, not content loss.

---

*Prepared against `eabe090` on 2026-10-22 by a fan-out of eight audit threads plus
first-hand verification of every claim that appears above without a thread attribution.
If a number here is wrong, the command in §13 will say so — that is the whole point.*
