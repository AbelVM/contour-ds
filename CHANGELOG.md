# Changelog

All notable changes to Contour are documented here.

Every number below is computed from `src/` by `node tools/stamp.mjs --json`, not
counted by hand. Where a claim was previously overstated it is corrected here and
the measurement that corrected it is named, so the next reader can re-run it.

## [Unreleased]

### Added
- `--color-control-edge` token for control borders (WCAG 1.4.11)
- `--target-control`, `--target-option`, `--target-chart` and `--target-mark` tokens for target sizes by kind (a data mark is deliberately `0` — it is not a target)
- `--fill-hatch-1…5` and `--fill-dot` fill-pattern vocabulary for polygon marks
- `--dur-spin`, `--dur-spin-slow`, `--dur-copy-tick`, `--dur-ping`, `--dur-sweep` motion tokens
- `--shadow-color-*` tokens for button and range shadows
- `--ease-exit` for exit transitions (declared, not yet consumed by a rule — tracked in the census ledger, not deleted)
- `.c-map-slot` component for map chrome
- `.c-bivariate` component for bivariate legends
- `window.Contour` public API (`version`, `toast`, `setScheme`, `scrollTo`, `copy`)
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
- Specimens added for `c-menu`, `c-tag`, `c-expandable`, `c-pressable`, `c-scrim` and `c-resize-handle`. An earlier entry here claimed nine undocumented components had been documented; measured with `node tools/audit/component-inventory.mjs`, six of those nine now have a specimen and **<!-- ds:noSpecimen -->16<!-- /ds:noSpecimen --> of <!-- ds:components -->133<!-- /ds:components -->** blocks still have none
- The accessibility contract in `README.md`, `AGENTS.md` and `llms.txt` claimed the ratios were "verified across 210 text and icon pairs per theme". Nothing computes 210: `tools/audit/contrast-and-aria.mjs` measures 52 named colour pairs (76 numeric comparisons with series and ramp steps). The three lines now name the enforcing command and its exit condition instead of a count no tool recomputes, and `AGENTS.md` warns against putting a pair count back there. Its criterion was also corrected to 1.4.11 for adjacent contrast, with 2.4.13 governing focus appearance
- `tools/contour-gen.py` wrote its verification JSON into a machine-local temp directory outside the repository — a path that existed on one developer's machine and on no clean clone or CI runner. Nothing in the repository reads those files (checked by search), so they now land under the project's own gitignored `tmp/audit/`

### Corrections to this file's own claims
Three entries above were overstated when first written, and are corrected here rather than quietly deleted:
1. **"Nine unspecced components documented"** — six of nine, with 13 blocks still undocumented.
2. **"`llms.txt` corrected (component count…)"** — was false when written here, and is now actually done. Both files published 83 components / 260 tokens while `src/` held **<!-- ds:components -->133<!-- /ds:components --> components, <!-- ds:tokens -->269<!-- /ds:tokens --> tokens, <!-- ds:tokens-read -->267<!-- /ds:tokens-read --> read, <!-- ds:tokens-unread -->2<!-- /ds:tokens-unread --> unread**. The root cause was in the gate, not the prose: `stamp` only visited files carrying markers, and neither file had any — `llms.txt` is machine-facing and `DESIGN.md`'s figures live in YAML front matter, where an HTML comment is not legal syntax — so `stamp --check` passed by never reading them. `stamp` now owns both (anchored rewrites for `llms.txt`, a key-path setter for front matter) and treats a declared pattern that matches nothing as an error, so a skipped file fails the build instead of greening it
3. **"focus ring (3.55:1)"** — that was the best-case surface. The binding measurement was 2.94:1, i.e. the contract did not hold until the change recorded above.
