# Changelog

All notable changes to Contour are documented here.

Every number below is computed from `src/` by `node tools/stamp.mjs --json`, not
counted by hand. Where a claim was previously overstated it is corrected here and
the measurement that corrected it is named, so the next reader can re-run it.

## [Unreleased]

### Added
- `tools/check-layout.mjs` — the layout vocabulary ratchet and, for the first
  time, an executable deprecation. The repository carried three prefixes doing
  the same job: page furniture in `@layer base` (`.container` `.stack`
  `.cluster` `.section` `.grid` `.split`), component primitives in
  `@layer components` (`.c-row` `.c-stack` `.c-cluster` `.c-sidebar`
  `.c-container`), and a grid set in `@layer utilities` that
  `git grep` over the whole repository proved had **zero** consumers — not in
  `src/`, not in the guide, not in any template, not in any document. AGENTS.md
  had a deprecation policy since well before this commit and `@deprecated`
  appeared in **zero** files, so the policy described a mechanism that did not
  exist. Both the three dead names and their markers are now checked in both
  directions: a marker with no ledger entry fails, a ledger entry whose marker
  went missing fails, and a marker attached to no selector fails.
  Three assertions sabotage-tested (a fourth-vocabulary name, a changed gap
  token, a stripped marker); each went red on its predicted symptom.
- `.u-cols-2`, `.u-cols-3` and `.u-auto-grid` are marked `@deprecated`, kept by
  name as the policy requires, and scheduled for removal at v1.0 rather than v2
  — pre-release is the only moment a rename is free, which is the argument this
  row had never made before.

### Changed
- Canonical names for composition layout are the `.c-*` set; `.container` and
  `.section` stay unprefixed deliberately, as document furniture rather than a
  block a consumer composes. `DESIGN.md` gains a Layout vocabulary section and
  `AGENTS.md` a naming rule, both with no hand-typed counts — the gate prints
  what it measured.
- The `stack`/`c-stack` and `cluster`/`c-cluster` pairs are **not** merged.
  They differ by value, not by shape: `--space-stack` is 1.25rem against
  `--space-sm` at 1rem, and `--space-2xs` is 0.5rem against that same 1rem. An
  alias would have silently restyled 118 uses, so the plan's
  "pick `.c-*`, alias the rest" was rejected on measurement and the two gap
  tokens are instead pinned by the gate, which fails if either drifts.
- `tools/check-claims.mjs` matches a registered sentence with whitespace
  collapsed. It previously compared raw substrings, so re-wrapping a paragraph
  failed the build for moving a line break — a register that breaks on
  formatting is a register people delete rather than maintain. Verified both
  ways: a re-wrapped sentence passes, an invented one still fails.

- Chart accessible names and data alternatives (C-25), with
  `tools/audit/chart-names.mjs` to hold them. Before: the guide had 3 charts, 2 of
  them named with the single word "Chart", and no chart anywhere carried a data
  alternative; the dashboard template's 2 charts had no `role` and no name at all.
  Now all 5 name what they plot and each points `aria-describedby` at a sibling
  text alternative, and the values in those tables were derived from the marks:
  reading the paths, every series is lowest on Mon and highest on **Sat** — an
  earlier hand-typed table said Sun, which is the exact defect this row is about,
  committed by the person fixing it.
- `tools/audit/chart-names.mjs` reads Chromium's accessibility tree, because a
  grep cannot tell `aria-label="Chart"` from a name that means something. It
  asserts the population it scanned (5 charts across 4 shipped pages) and fails on
  a sweep that found none, and it checks the node itself carries a description —
  not that an attribute is set. Sabotage-tested twice: deleting a template chart's
  `aria-describedby` and re-nesting the data inside the image both turn it red on
  the predicted symptom.

### Changed
- A chart's data alternative is a SIBLING of the named image, never a descendant.
  Measured, because the obvious pattern is wrong: with the table nested inside
  `role="img"` the image node had NO description even though Chromium still listed
  the table; as an `aria-describedby` sibling it surfaced one. Chromium listing it
  is not a thing to build on — `img` is a leaf role, so another reader may prune
  it — and the sibling works either way. The probe's own validity rests on a
  control: an `aria-hidden` subtree correctly surfaced nothing, which is what
  proves the readout can see hiding at all.

- Chart geometry seam (C-24). The gridline band is now derived from
  `--chart-ticks` — one band per value interval, `100% / (ticks - 1)` — instead of a
  literal 25%, so the grid aligns with any tick count by construction. T-136 had
  recorded the fixed 25% as a permanent ceiling ("a 5-tick axis and a 4-band grid
  cannot align"); it was not permanent, only un-parameterised, and DESIGN.md's
  contract paragraph is amended rather than left publishing a claim the CSS no longer
  makes. The real limit is elsewhere and still true: there is no y-axis element, so
  the value ticks are declared in `--chart-ticks` and rendered by nobody — and the
  bands measure the *value* axis, while the `space-between` category axis (Mon…Sun) is
  a different axis that nothing aligns to them. That distinction is written down
  because the first draft of this row conflated the two.
- `.c-chart__tooltip` had only a colour pair, so it had no offset, no padding and no
  stacking — it could not float above the mark it describes — and nothing in the
  repository used it. It is now positioned by its plot through
  `--chart-tip-block-start` / `--chart-tip-inline-start` — declared in `tokens.css`
  rather than invented at the point of use, because a `var()` to a token that exists
  nowhere is the discrepancy `check-tokens` fails the build on — with
  `z-index: var(--z-tooltip)` and
  `pointer-events: none` (a tip that takes the pointer sits over its own mark,
  cancels the `:hover` that opened it and flickers), and the guide's chart specimen
  consumes it.
- `.c-chart__hover` deleted: a class with zero consumers in the guide, the templates
  and `ds.js` is a state no author can reach. Hover is now `:hover` on
  `.c-chart__bar`, `__point` and `__band`, which works with no script at all.
- `tools/audit/chart-geometry.mjs` — guards the construction, not the string: it
  re-points `--chart-ticks` to five counts in a real browser and requires the rendered
  band to follow each, then asserts the tooltip geometry and the hover state.
  Measured 4 → 33.3333%, 5 → 25%, 6 → 20%, 9 → 12.5%, 11 → 10%. Two drafts of this
  file were blind before that: one matched the literal word `transparent`, which never
  survives serialisation, and one read only px lengths, so it took the 1px hairline for
  the band and reported a working seam as "DOES NOT FOLLOW". Both failures were in the
  ruler, not the CSS.
- `[data-motion]` — the WCAG 2.2.2 pause mechanism. `paused` holds every
  animation in its scope on the frame it is on, `running` overrides the media
  query, and leaving it unset gives the choice back to the operating system.
  `prefers-reduced-motion` does not discharge 2.2.2, because that is an OS
  setting and the criterion asks for a mechanism on the page. The selector
  reaches `::before`/`::after` deliberately: the infinite motion lives there.
- `tools/check-motion.mjs` — the motion contract. Reads the infinite animations
  from `tools/lib/inventory.mjs` rather than re-deriving them, and requires both
  halves: a mechanism in `src/css` *and* a control on a shipped page. Either one
  alone is the failure this repository keeps measuring.
- `tools/audit/theme-render-probe.mjs` — the render probe. Mounts a freshly
  created `.c-btn--primary` per declared theme set, decodes colours instead of
  comparing their serialisations, and sweeps `--brand-hue` 0..360 in both themes
  against the control-edge, focus-ring and button-label contracts. Sabotage
  tested: deleting `daylight`'s hue turns it red on the predicted symptom.
- `src/svg/chart-patterns.svg` + `tools/check-defs.mjs` — def reachability (C-31).
  `.c-chart__missing` painted `fill: url(#contour-hatch-missing)` while the only
  definition of that id lived at `index.html:326`, inside the style guide: a
  consumer who took `src/` and nothing else got initial black, not a missing
  texture. The pattern now ships in the system and the sprite says INLINE, not
  include, because `url(#id)` resolves only in the current document and `<use
  href>` is blocked on a `file://` origin — which is how this guide is opened.
  The gate requires a definition *and*, on a paint property, a fallback colour;
  those are different rules, and collapsing them let a renamed id pass. It also
  checks the shipped SVGs for HTML-repaired element casing: the HTML parser
  silently corrects `fecolormatrix`, an XML parser sees an unknown element and
  the filter is inert — and `src/svg/cvd-filters.svg` carried that spelling while
  the guide printed it as the snippet a consumer copies.
- `tools/check-claims.mjs` + `tools/claims.json` — the claims gate (C-06). Every
  published sentence that makes a checkable promise now names the command that
  enforces it, and the gate fails if the sentence is gone, if its owner is not a
  real file, or if the owner runs in no CI lane. It also fails on any `--token`
  cited in README/DESIGN/llms/the guide that `inventory()` does not declare, and
  on any published range whose `1…N` disagrees with the steps that exist.
  Token families are derived from the declared names, never listed by hand — a
  hand-written list goes stale exactly like the number it guards, and the first
  draft's hand-written list flagged `.c-btn--primary` and `--check` as undeclared
  tokens. Ownership lives here rather than in `stamp`: stamp owns numbers, this
  owns sentences. `CHANGELOG.md` is deliberately not a claim-bearing document —
  it is a dated record of past states, and holding it to the current tree would
  force history to be rewritten.
- The motion gate also owns the calm half of the contract (the reduced-motion
  block must cap `animation-iteration-count` and collapse `transition-duration`),
  and `check-ownership` now owns "zero runtime dependencies": the manifest must
  declare none and the shipped scripts must import nothing off a relative path.
  A claim registered against a gate that does not check it is the same unowned
  sentence in a smarter costume.
- `src/css/light-dark-fallback.css` + `tools/gen-light-dark.mjs` — the
  `light-dark()` fallback layer (C-51). `light-dark()` is Baseline newly-available
  2024-05-13 and becomes widely available 2026-11-13; until then an engine without
  it does not degrade, it loses every theme-sensitive colour, because an
  unregistered custom property happily stores the raw `light-dark(a, b)` text and
  the break surfaces one step later, when `var()` substitutes it into a real
  property and the declaration becomes invalid at computed-value time. The sheet
  is generated from the token layer by `tools/lib/lightdark.mjs` — the repo's one
  parser, so there is no second opinion to disagree with — guarded on the value
  (`@supports not (color: light-dark(white, black))`; `@supports (color: var(--x))`
  is always true and would freeze modern engines at light), and it covers the OS
  preference and the manual `<meta name="color-scheme">` flip. Measured in
  Chromium: 97 generated declarations reproduce the colour `light-dark()` paints in
  each scheme with zero sRGB drift, and the guard is inert there, so modern engines
  see no change. Composition values are substituted, not split:
  `0 1px 2px light-dark(A, B)` is not a colour anyone can publish as two themes, but
  replacing the call with one branch is well-defined and is what keeps the shadow
  painted at all. Costs ~17 kB minified, which is why the size budgets moved.
- `tools/build.mjs` now DERIVES the surface-bundle file list from `ds.css`'s own
  imports and asserts the split: a shared sheet must reach all four bundles, an
  audience sheet only its own. It was a hand-maintained array beside `ds.css`, so
  adding a sheet — exactly what C-51 did — landed it in `contour.css` and in no
  surface bundle, silently, with every gate green.
- `inline()` in `tools/build.mjs` resolves plain `@import url(…)` as well as the
  `layer(…)` form, so a sheet that declares its own layers is inlined instead of
  being left in the bundle as an unresolved import.
- `src/css/map-chrome.css` is now the single source of truth for the vendor
  re-key profile (C-16); `tools/build.mjs` copies it to
  `dist/map-chrome.{maplibre,mapbox}.css` instead of generating the rules as a
  string, and `tools/check-dist.mjs` refuses a shipped artifact that nothing in
  the repository references. The three files were built, published by
  `files: ["dist/"]`, and reached by no document, link, specimen or gate.
- Markup hygiene (C-53) — `tools/check-markup.mjs`, plus the fixes it guards.
  Every shipped page linked Google Fonts and only the guide carried the
  `preconnect` pair, so the shipped template was slower than the documentation
  that recommends it; and no page carried any `og:`/`twitter:` metadata, so a
  landing surface whose whole pitch is a visual identity shared into Slack, X and
  GitHub with no card at all. All four pages now carry both hints (the `gstatic`
  one with `crossorigin`, because the font fetch is CORS-mode) and
  `og:title`/`og:description`/`og:type`/`twitter:card`. `stamp.mjs` generates the
  guide's `meta description` **and** its `og:description` from one computed
  string, so the crawler copy can never fall a component count behind the search
  copy. The gate deliberately does not require `og:image`: the system ships no
  raster, only the SVG mark, and crawlers will not render an SVG as a card image
  — requiring the tag would be answered by a URL that renders nothing. What it
  does require is that an `og:image`, if added, be absolute `https` and resolve to
  a path that exists here.
- The toast live region is declared before it has anything to say (C-28, WCAG
  4.1.3). Each toast carried its own `role="status"` and arrived already
  containing its message — the one case assistive tech is documented not to
  announce, since a live region is watched for changes *inside a region that
  already exists*. `#toast-host` is now the region (`role=status`,
  `aria-live=polite`), created at load, and the toast inside it carries no role:
  a nested region is how one message gets announced twice.
- An open snippet now takes the rest of the page out of the tab order (C-29,
  WCAG 2.4.11, Level AA). The scrim is `position: fixed` over the viewport while
  every control behind it stayed focusable; 2.4.11 carries no exception for
  author content that happens to be fixed or sticky, so `assets/js/guide.js`
  modalises with `inert` on the *siblings of each ancestor* of the open example —
  an ancestor cannot be inerted without hiding the snippet itself. With JS off the
  disclosure is still a native `<details>`.
- Verified in Chromium, not asserted: the host exists at load with
  `role=status aria-live=polite` and no children; a fired toast lands inside it
  with `role=null`; a second toast reuses the same host instead of building one.
  Opening a snippet marks 42 elements inert, leaves the open example focusable,
  inertates the rail, releases everything on close, and a header link behind the
  scrim no longer accepts focus.
- Snippet spacing guard promoted from a warning to a build failure (C-32), and
  moved to the right artifact. It had inspected each example's **root attributes**;
  the root is not what a reader pastes. Measured against the emitted snippets it
  found 28 of 130 blocks carrying guide spacing while the guard reported 2.
  Ten of those were the real defect — a system component leading an example with a
  margin whose only job was separating it from the guide's heading — and are now
  spaced by `assets/css/docs.css` instead. The rest are interior spacing inside an
  example, which is the example's own layout and stays.
- Exemptions in the guard are deliberate, not convenient: `0` and `auto` are a
  reset and a flex fill (the author's intent, not scaffolding), and a margin on an
  element *inside* the example is the example's layout. The guard prints how many
  snippets it read and fails on zero, so a refactor that stops emitting snippets
  cannot pass by inspecting nothing.
- Every moved gap was measured to be identical to its previous value, not merely
  non-zero: 20px where the inline style said `1.25rem`, 16px where it said `1rem`,
  28px on the RTL stage where it said `var(--space-lg)` — the tokens happen to
  equal those literals, so the move is invisible. Two earlier drafts of the rule
  were caught by measuring rather than by reading the CSS: one targeted
  `.ds-panel` alone and so left the readout specimen at 0 (`.ds-panel--grid` is a
  separate class token), and one hung the RTL stage on a `:not(:first-child)`
  selector that can never match it, because that example is the only child of its
  generated `.ds-example` frame.
- **C-33, recorded as not-a-task.** The row asked to merge duplicated
  `prefers-contrast` (×2), `prefers-reduced-data` (×2) and
  `prefers-reduced-transparency` (×2) media blocks. With comments stripped, each
  occurs exactly **once** in `src/css/utilities.css`. The ×2 counted a comment line
  beside its at-rule — a metric read as an assertion, the same failure mode the
  `--brand-hue` sweep and the `--chart-axis` row both had. No merge was done.

- `--color-control-edge` token for control borders (WCAG 1.4.11)
- `--target-control`, `--target-option`, `--target-chart` and `--target-mark` tokens for target sizes by kind (a data mark is deliberately `0` — it is not a target)
- `--fill-hatch-1…5` and `--fill-dot` fill-pattern vocabulary for polygon marks
- `--dur-spin`, `--dur-spin-slow`, `--dur-copy-tick`, `--dur-ping`, `--dur-sweep` motion tokens
- `--shadow-color-*` tokens for button and range shadows
- `--ease-exit` for exit transitions (declared, not yet consumed by a rule — tracked in the census ledger, not deleted)
- `.c-map-slot` component for map chrome
- `.c-bivariate` component for bivariate legends
- `window.Contour` public API (`version`, `toast`, `setScheme`, `scrollTo`, `copy`)
- Layout primitives (`.c-row`, `.c-stack`, `.c-cluster`, `.c-sidebar`) moved from `@layer base` to `@layer components` (T-155)
- `contour.min.js` size budget raised to 22 kB (T-99 command registry now consumed by `buildIndex`)
- Per-surface distribution bundles: `dist/surfaces/contour-{core,docs,data,landing}.min.css`, so a product shipping one surface stops downloading the other two. Measured: full 117.3 kB, core 81.0, docs 93.4, data 97.5, landing 88.4 kB
- `dist/build-manifest.json`, recording each source's content hash at build time, so a gate can tell a large bundle apart from a stale one
- `tools/stamp.mjs` and `tools/lib/inventory.mjs` — every published count is computed from the source; `--check` fails the build when a document drifts. It owns a number by one of three means, because documents differ in what they may carry: a `<!-- ds:key -->` marker in prose, an anchored rewrite for machine-facing files that must not hold comments (`llms.txt`), or a YAML key path for front matter (`DESIGN.md`), where an HTML comment is not legal syntax
- `AGENTS.md`'s numbered-rule count is now computed and quoted in `DESIGN.md` rather than retyped, and a gap in the numbering (`### 1` … `### 11` with only ten headings) is an error rather than a silently chosen number
- `tools/check-export.mjs` — the token export must cover every declared token, carry the semantic layer by name, and publish both themes
- `tools/check-tokens.mjs` rewritten: the census is strict, and exempted families are replaced by a named ledger where each unread token carries one action and one task. The ledger can only shrink
- `tools/audit/lib/browser.mjs` — the audit harnesses discover a browser driver instead of importing a path from another project's package store, and exit rather than skip when none is found
- `tools/audit/package.json` — dev-only manifest for the harnesses. Nothing here ships; `src/` still has zero runtime dependencies
- CI now gates on the size budget, the census, the token export, the published numbers, and the browser-measured contrast contract (`tools/audit/contrast-and-aria.mjs`), in a separate job so a missing driver cannot take the static checks down with it
- `DESIGN.md` agent-readable manifest
- `LICENSE` and `CHANGELOG.md`

### Changed
- `--color-scale-1…6` renamed to `--color-heat-1…6` (it is a heat ramp, not sequential)
- `--gradient-heat` now draws all six stops. It listed 1, 3, 4, 5, 6 and skipped `--color-heat-2`, while both the token comment and the guide's own copy said six stops
- `--color-control-edge` retuned to 61%/58%. Measured against every surface a control can sit on, the dark step reached only 2.84:1 on `--color-surface-3` — below the 3:1 this file had already claimed. It now measures 3.09, and the light step 3.14
- `--color-focus-ring` light step moved from `--brand-600` to `--brand-700`. The ring measured **2.94:1** on `--color-surface-3` in light, which fails the contract; it now measures 4.47 (dark unchanged at 6.87). The previous entry in this file quoted 3.55:1, which is the best case — the ring against `--color-surface-1` — not the binding surface
- `.c-btn--secondary`, `.c-btn--secondary:hover` and `.c-btn--outline` borders now use `--color-control-edge`. The token's own comment names the secondary and outline buttons as its consumers, but they were drawing `--color-border` (1.50:1) and `--color-border-strong` (2.06:1). Input, select and textarea already used the token; the buttons had not been converted
- `.c-tag__remove` hit area raised from `0.9rem` (14.4×14.4 px) to `--target-option` (24 px). It was the only visibly sub-floor discrete control in the guide; eight 21.4 px text links are inline content that WCAG 2.5.8 exempts, and are reported as advisory rather than gated
- Focus indicator on checkbox, switch and range thumb now uses the focus ring instead of the halo
- Command palette now sets `aria-activedescendant` and removes options from tab order (verified: 0 options in tab order, `command-item-0` active on open)
- `⌘K` no longer fires while typing — the `isTyping()` test sits inside the `if` condition, before `preventDefault()`
- The legend now previews every series it claims to. `.c-legend__swatch--line` sets `background-color: transparent` so a dashed key shows the surface through its gaps — which left the solid series with nothing to paint: `data-series="1"`, whose `--chart-dash-1` is `none`, rendered a 32×3 transparent gap in the guide's own specimen. It now paints a solid bar, and all seven dash rules read `var(--c, var(--chart-N))` instead of a bare `var(--c)`, matching the discipline `.c-chart__point` already used — so a consumer who omits `--c` gets a wrong-coloured key rather than an invisible one. Measured before/after in the guide's live cascade: keys painting nothing went `[1]` → `[]`, and the eight now split correctly into one colour-painted solid and seven image-painted patterns.
- `tools/audit/contrast-and-aria.mjs` gained the two gates that make the above permanent. **Series contrast** sweeps all eight `--chart-N` against all six `SURFACES` in both themes (48 + 48 pairs) instead of measuring two surfaces and asserting one — the discarded `vsSurface2` is gone — and fails if the sweep returns fewer pairs than `SURFACES` implies, so a narrowed enumeration cannot pass quietly. **Legend parity** builds one key per series from the live cascade and fails if a solid series paints no colour, a dashed series shows no pattern, any key paints nothing, or the sweep found fewer than eight keys. Measured binding margins, the first time these pairs were ever asserted: light `--chart-6` on `--color-surface-3` at **3.05:1**, dark `--chart-8` on the same surface at **3.63:1**. `--color-surface-raised` resolves identically to `surface-1` (light) and `surface-2` (dark), verified 8/8 rather than assumed.
- `README.md`, `DESIGN.md` and `llms.txt` published `--chart-dash-1…6` while `tokens.css` declares eight and all eight are consumed. Corrected to `1…8`; the contract sentences now name the enforcing command and its exit condition instead of a pair count.
- `--color-text-subtle` lifted to clear 4.5:1 on `--color-surface-3` (measured 6.37 light, 4.97 dark)
- Density now moves the type scale as well as spacing (`--density-type`, applied at `components-data.css:593`)
- `.c-theme-scope` now inherits `--brand-hue` and `--radius-scale` from `:root`
- `--color-on-primary` now follows `--brand-hue`
- `.c-range` cursor changed from `grab` to `pointer`
- Browser support table now names Baseline dates
- `node --check` is now invoked once per file in CI, in `AGENTS.md` and in `README.md`. Passing both scripts to a single invocation checks only the first and silently ignores the rest, so `assets/js/guide.js` was in no lane's path despite a green build. The command table in each document carried that same single-invocation form, and both have been corrected
- `AGENTS.md` no longer tells contributors that the audit harnesses live outside the repository in a temp directory. They are in `tools/audit/`, gated in CI, and write their JSON to the project's own gitignored `tmp/audit/`; the contributor checklist there now runs the census, the size budget and the published-number check

### Fixed
- Heading level jump (h3 → h5) in guide corrected to h3 → h4 (verified: 0 heading jumps in the rendered guide)
- Unlabelled range inputs in the guide now have associated labels (verified: 0 unlabelled inputs, 0 duplicate ids, 0 nameless buttons across 204 buttons)
- Drag handle converted from `aria-hidden` span to focusable button with an accessible name
- The token export published 151 of the 273 declared tokens. `tools/build.mjs` matched a single `:root` block, and `tokens.css` declares in three, so the entire semantic layer — the half a consumer overrides — was missing from `dist/contour.tokens.json`. It now exports 277/277, 92 of them as light/dark pairs
- Multi-line `light-dark()` declarations were never split into two themes: the exporter tested the value with `.+`, and `.` does not match a newline, so `--color-focus-halo`, `--color-primary-soft` and `--color-on-primary-solid` shipped as one opaque string. Splitting now goes through `tools/lib/lightdark.mjs`, which counts parentheses instead of pattern-matching them
- `tools/check-size.mjs` failed on a 113.1 kB bundle against a 110 kB budget and was not wired into CI at all. Budgets are now measured per bundle with ~3% headroom, the gate also refuses a stale `dist/`, and CI runs it after the build
- Specimens added for `c-menu`, `c-tag`, `c-expandable`, `c-pressable`, `c-scrim` and `c-resize-handle`. An earlier entry here claimed nine undocumented components had been documented; measured with `node tools/audit/component-inventory.mjs`, six of those nine now have a specimen and **<!-- ds:noSpecimen -->0<!-- /ds:noSpecimen --> of <!-- ds:components -->134<!-- /ds:components -->** blocks still have none
- The accessibility contract in `README.md`, `AGENTS.md` and `llms.txt` claimed the ratios were "verified across 210 text and icon pairs per theme". Nothing computes 210: `tools/audit/contrast-and-aria.mjs` measures 52 named colour pairs (76 numeric comparisons with series and ramp steps). The three lines now name the enforcing command and its exit condition instead of a count no tool recomputes, and `AGENTS.md` warns against putting a pair count back there. Its criterion was also corrected to 1.4.11 for adjacent contrast, with 2.4.13 governing focus appearance
- `tools/contour-gen.py` wrote its verification JSON into a machine-local temp directory outside the repository — a path that existed on one developer's machine and on no clean clone or CI runner. Nothing in the repository reads those files (checked by search), so they now land under the project's own gitignored `tmp/audit/`

### Removed
- The four `[data-theme]` sets in `src/css/tokens.css` — positron, dark-matter, voyager, high-contrast. They are ad-hoc rules belonging to airship/libreship, which already declares all four in `packages/styles/src/tokens/index.css`; a named theme is a product decision, so `src/` keeps the `[data-theme]` extension point and ships only the two system themes. Measured with `tools/lib/inventory.mjs`: the twelve tokens those blocks wrote are each also declared in `:root`, so the unique token count is unchanged at 272 and only declaration lines moved (348 → 312). The guide keeps one set of its own, `daylight`, declared as a consumer in `assets/css/docs.css`. `tools/audit/contrast-and-aria.mjs` now reads the set names from the guide's switcher instead of repeating them, so the sweep cannot silently measure nothing.

### Corrections to this file's own claims
Three entries above were overstated when first written, and are corrected here rather than quietly deleted:
1. **"Nine unspecced components documented"** — six of nine, with 13 blocks still undocumented.
2. **"`llms.txt` corrected (component count…)"** — was false when written here, and is now actually done. Both files published 83 components / 260 tokens while `src/` held **<!-- ds:components -->134<!-- /ds:components --> components, <!-- ds:tokens -->275<!-- /ds:tokens --> tokens, <!-- ds:tokens-read -->273<!-- /ds:tokens-read --> read, <!-- ds:tokens-unread -->2<!-- /ds:tokens-unread --> unread**. The root cause was in the gate, not the prose: `stamp` only visited files carrying markers, and neither file had any — `llms.txt` is machine-facing and `DESIGN.md`'s figures live in YAML front matter, where an HTML comment is not legal syntax — so `stamp --check` passed by never reading them. `stamp` now owns both (anchored rewrites for `llms.txt`, a key-path setter for front matter) and treats a declared pattern that matches nothing as an error, so a skipped file fails the build instead of greening it
3. **"focus ring (3.55:1)"** — that was the best-case surface. The binding measurement was 2.94:1, i.e. the contract did not hold until the change recorded above.
