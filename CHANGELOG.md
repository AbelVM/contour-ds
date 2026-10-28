## [Unreleased]

### Added
- The async states contract: a shared loader and four data states, documented in §23. Every
  component that reads `src` now asks through one loader (`loadRemote`/`remoteData`/
  `remoteRefresh`/`remoteVisible`/`renderStates`/`renderEmpty`/`wireStates` in `states.mjs`),
  which deduplicates one request per URL, caches the last result per URL (FIFO-64, with
  `no-cache`, `cache-key` and the exported `remoteInvalidate` as the policy handles), aborts
  on disconnect, and treats a failed fetch as an error rather than an empty dataset
  (`HttpError`/`ParseError`, reported as `contour:error {src, message, name, status}`).
  The four states are authored attributes (`loading`, `error` + `retry`, `empty`, `skeleton`)
  painted as per-block `c-<block>__<kind>` nodes with the single `data-contour-state` hook,
  so a host with no data and no authored content says so instead of painting nothing.
  `refresh` (visibility-paused polling), `lazy` (IntersectionObserver with an honest
  fallback) and `timeout` (AbortSignal.timeout with a timer fallback) are the fetching
  attributes. The §23 "Async states" specimen shows all four states on one component, and
  the §23 event table documents the vocabulary. Gates: the state-contract arm in
  `wc-contract` (mounts loading/error/empty/skeleton and src success/404/malformed
  fixtures, asserts one state node, failure ≠ empty, abort on disconnect) and arm 19's
  cache-policy measurements — this is the contract F-27 found the guide silent on.
- The published event vocabulary: a frozen `CONTOUR_EVENTS` manifest in `core.mjs`,
  published as frozen `window.ContourEvents`, gated in BOTH directions by `check-wc` (a
  dispatch name with no manifest entry fails, and so does an entry nothing dispatches) and
  read off the shipped bundle by `wc-contract`. 30 events, each with the payload keys its
  emission sites pass and the composed flag.
- `contour-streaming-chart` live contract: `interval` and `pause` attributes drive a tick
  loop that emits `contour:tick {frame}` and `contour:stream-state {running}`, revalidating
  through the loader's cache path; a `selectable` legend renders items as toggle buttons
  with `aria-pressed` and emits `contour:legend-toggle {label, key, pressed}`; the
  time-slider's play button advances the track and emits `contour:time-change {value}` per
  step; the resizable reads `direction` and wires pointer drags. Arm 20 of `wc-contract`
  measures each: PASS.
- Light-layer ARIA parity with the shadow bootstrap: `contour-alert` carries
  `role="alert"` + `aria-live="assertive"`, `contour-field` links the inner input to its
  hint and error via `aria-describedby` and reflects `required` as `aria-required`,
  `contour-faq` emits native `details`/`summary` items, and the copy trigger paints the
  system script's own confirmation (`data-copied`, label swap, 1600 ms revert).
- Custom states for the form family and the loader: hosts publish
  `:state(data-invalid)`, `:state(data-checked)` and `:state(data-loading)` through
  `ElementInternals.states`, so a consumer's CSS can select a host's own state without
  an attribute round trip. The duplicate validity writes scattered across the form
  family now route through one shared `_syncValidity`, which keeps the
  `:state(data-invalid)` mirror in step with the internals it announces; switch, check
  and radio mirror `data-checked`; the loader mirrors `data-loading` while a request is
  in flight. Loader hosts are not form-associated, so the base lazily attaches a
  states-only internals object that no form path reads. Gated by wc-contract arm 22,
  which measures all three states against the shipped bundle.

### Fixed (M-WC-08)
- `check-reflow` (R4-02/R4-03) was failing on `index.html` at the published 390 px
  contract width, in both themes and with JavaScript off. The page's `scrollWidth`
  measured 506 px against a 390 px viewport. The cause was not the wrapped tables
  the gate named — both `.c-table` specimens sit inside a `.c-table-wrap` that
  scrolls internally and stays inside the viewport — but the colour-vision toggle
  in §04: five bare `<button>s` in a `display: inline-flex` group, whose
  min-content width is set by the longest word ("Achromatopsia", 121 px). Added
  `min-inline-size: 0` to `.c-segmented` and `min-width: 0; overflow-wrap: anywhere;`
  to its direct `button`/`label` children (the element rule reaches the bare
  buttons the `.c-segmented__option` class misses). `scrollWidth` is now exactly
  390 px at the contract width; the 320 px WCAG floor is reported, not asserted.
- `ContourAlert` close button was non-functional: the component scaffolded `.c-alert__close`
  via `ensure()` but never wired a click handler. Added `enhance()` with host-delegated
  click listener that dispatches `contour:close` and removes the alert.
- `ContourLink`, `ContourAnchor`, and `ContourCta` leaked DOM nodes on re-render:
  they used direct `appendChild` without clearing previous nodes. Added clear-before-append.
- 14 components used `if (!this.textContent.trim())` guards that prevented attribute
  changes from updating displayed text after re-render. Replaced with `!this.hasChildNodes()`.
- `ContourLiveBadge` had redundant modifier-removal loop (deduplicated).
- `ContourTooltip` had convoluted dead-branch text logic (simplified).
- `ContourDoDont` accepted unused `icon` parameter (removed).
- `ContourDiff` created an empty line-number span with no content (removed).
- `ContourHeader` actions container used meaningless `<slot>` in light DOM (removed).
- `ContourStreamingChart` did not remove SVG when `line` attribute was removed (added cleanup).
- Toolbar compact variant (`@container (inline-size < 16rem)`) was half-dead: the
  `.c-toolbar__btn` 2rem rule was overridden by the base 2.25rem rule at equal
  specificity. Reordered so the container query wins in narrow containers.

### Changed (M-WC-08)
- `ContourProps` TypeScript interface expanded from 8 to 99 observed attributes.
- `wc-contract` gate extended with close-button probe (1,205 measurements, up from 1,204).
- `contour.d.ts` budget raised from 26 kB to 27 kB for expanded ContourProps.
- `contour.min.css` size budget raised from 169 kB to 170 kB: measured 173,081 B after the
  §04 segmented shrink fix added `.c-segmented > button, > label { min-width: 0; overflow-wrap: anywhere }`.
- `contour.components.json` size budget raised from 152 kB to 153 kB: measured 151.4 kB
  (155,662 B), so the line was set below its own measured size.
- `surfaces/contour-docs.min.css` size budget raised from 128 kB to 129 kB: measured
  128.1 kB (131,133 B) after the M-WC-08 accessibility pass added `.c-diff__line--add/--del`
  tints and `--live-text` to `.c-live-badge`. The previous line's own comment claimed a
  "0.0 kB overrun, pre-existing" raise in 2026-10-25, which was already false.

- `surfaces/contour-data.min.css` size budget raised from 149 kB to 150 kB: measured
  149.2 kB (152,792 B) after the time-slider addition (16 lines) to components-data.css
  in 8596094.
- `surfaces/contour-landing.min.css` size budget raised from 123 kB to 124 kB: measured
  123.2 kB (126,145 B).

### Added (M-WC-08)
- Close-button demo added to reactivity playground in §23 (ContourAlert closable + reset button).
- `ContourMeter` value range documented (0-1 fraction, not 0-100).

### Fixed (M-WC-07)
- Performance: added `content-visibility: auto` to card, panel, alert, empty components.
- P0/P1 fixes: observed attributes, property reflection, shadow slotted behaviour,
  tabindex, form input preservation, redundant role removal.
- R10: Added `ContourProps` interface with common attributes.
- R12: Added batch() demo, reactivity playground, form-association demo, event-emission demo in §23.
- R13: Full scaffolding pass — all listed gaps already scaffolded.
- R14: Added `contain: layout` to leaf components (badge, chip, pill, dot, kbd, tag, avatar).

### Fixed (M-WC-06)
- Focus restoration fallback for unkeyed active elements (keyed by id → name → index).
- Authored select child detection refined in ContourSelect and ContourVersion.
- Cartographic SVG geometry generators added (compassNeedle, scaleBarTicks).
- Slot composition extended to timeline, steps, layer-switch.
- Dual-syntax cross-reference badges added in Guide sections §04, §06, §14, §16.


### Fixed (M-WC-04)
- 17 web components read attributes in `render()` that were missing from their own
  `static get observed()`, so changing those attributes never re-rendered: `contour-kpi`
  and `contour-stat` (`unit`), `contour-legend` (`items`, `method`, `norm`),
  `contour-panel` (`subtitle`, `status`), `contour-tag` and `contour-pill` (`variant`),
  `contour-heatmap` (`legend`), `contour-filter-bar` (`divider`, `placeholder`, `items`,
  `empty`), `contour-feature` (`body`), `contour-flag` (`label`), `contour-install`
  (`prompt`, `copyable`), `contour-showcase` (`reverse`, `items`), `contour-cta`
  (`actions`), `contour-pullquote` (`name`), `contour-filter-pill` (`removable`),
  `contour-datamark` (`unit`, `label`), `contour-btn` (`label`). All added to both
  `observed()` and `properties()`.
- `contour-shadow-*` wrappers called `enhance()` in the constructor before slotted
  children existed, spending the `wcClaim` guard so slotted tabs/menus/segmented
  controls were dead. `enhance()` now runs in `connectedCallback` and the wired set
  resets on `slotchange`.
- `wireMenu` and `wirePagination` normalised `tabindex` after the `wcClaim` guard,
  so re-rendered items lost their tab stops; normalisation now runs before the guard.
- `ContourBase.attributeChangedCallback` restored form values by index; it now keys
  by `name`/`id` with index fallback.
- `shadow.mjs` injected a redundant `role="button"` on native `<button>` elements
  (WAI-ARIA Rule 1); removed.
- `tools/check-wc.mjs` now verifies per-component observed-attribute honesty and
  property-reflection completeness.

### Fixed (M-WC-05)
- Form control value restoration in `ContourBase.attributeChangedCallback` was gated on
  `newControls.length === savedValues.length`, so any attribute change that added or removed an
  input — an optional coordinate field, an advanced filter in `contour-filter-bar`, a date-range
  mode switch — wiped every value the user had typed. The keyed match existed precisely so that
  length mismatch could be tolerated; the guard defeated it. Keyed controls (those with a `name`
  or `id`) are now matched by key first with a `used` set preventing double-matching, and unkeyed
  controls fall back to index matching up to the shorter list.
- The same length guard blocked `<details>` open-state and scroll-position restoration, so a
  re-render that inserted a disclosure or a scroller above an open one collapsed it and reset the
  offset. Both now key on `id` when the element carries one, falling back to index matching for
  the unkeyed tail.
- `.c-tree` was defined in both `components.css` (interactive treeview, `cursor: pointer`,
  sans-serif) and `components-docs.css` (static file tree, `cursor: default`, monospace). The
  documentation block is renamed to `.c-file-tree` (and its `__row`, `--dir`, `--active`,
  `__indent` elements), so `.c-tree` belongs to the interactive treeview alone and the cascade no
  longer decides which cursor and typography win.
- `.c-drag-handle` carried two incompatible layout expectations: `components.css` styled it as an
  `inline-flex` centre for an SVG icon, `components-shell.css` styled it as an `inline-grid` of six
  CSS-drawn dots. The grid rule is now the scoped variant `.c-drag-handle--dots`, so the base
  carries the SVG form and the dots carry their own name; markup that wants the six-dot grid
  classes it explicitly.
- Table sort rules for `.c-table th[aria-sort]` (the `position: relative` base, the `:hover`
  colour, and the `:hover .c-table__sort svg` opacity) lived in `components-shell.css`, where a
  shell surface has no business holding data-table behaviour. They move to `components-data.css`
  beside the rules that define `.c-table__sort`, and the shell sheet drops them.
- `ContourShadow.connectedCallback` attached a `slotchange` listener on every call, so moving a
  shadow component in the DOM (reordering it inside a tab panel or list) accumulated one listener
  per move and re-wired on events it had already handled. The listener is now attached once,
  guarded by `this._wiredSlotchange`.

### Changed (M-WC-05)
- `surfaces/contour-data.min.css` budget raised from 148.0 kB to 149.0 kB: the `.c-chart--donut`
  and `.c-chart--histogram` variants added 18 lines of CSS in M-WC-04, and the figure is now the
  measured size with headroom rather than the size it was before the variants landed. The budget
  moves only with a line in this file saying why, which this is.

### Added (M-WC-04)
- Chart variant CSS classes `.c-chart--donut` and `.c-chart--histogram`.
- Reactivity playground specimen in §23 (variant select + value slider driving
  `contour-alert` and `contour-kpi`).


### Changed
- Bundling and delivering strategy rethought now that fonts are self-hosted (C-52).
  `src/css/fonts/*` (the seven woff2 faces plus `OFL.txt`) are now declared build
  inputs in `tools/build.mjs`'s manifest, so a font swap that nobody rebuilds can no
  longer certify `dist/` as current. `README.md`'s bundler `@import` list gains
  `fonts.css` as its first entry, matching `src/css/ds.css`, and documents that the
  faces ship beside the stylesheet (not base64-inlined) so they stay cacheable, with
  the consumer responsible for copying `fonts/` when inlining. Every shipped page
  (`index.html` and the three templates) now preloads the critical body variable
  font (`ibm-plex-sans-var.woff2`, `as="font"`, `crossorigin`), and
  `tools/check-markup.mjs` asserts that preload plus the absence of any Google Fonts
  origin reference. `README.md`, `index.html` and `templates/README.md` no longer
  describe IBM Plex as loaded from Google Fonts.

### Fixed
- Several web components answered to their own class and not to their block's contract, and one
  died on its first attribute change. All were found by measuring the shipped guide page rather
  than reading the source, which is how they survived a line-by-line review.
  `contour-combobox` bound its `input`, `focus` and `keydown` listeners to the **generated**
  field while its claim guard was keyed on the host, so changing any attribute rebuilt the field,
  spent the claim, and left a dead control: measured opening on focus and cursorring an option
  when fresh, doing neither after a placeholder change. Every listener is now delegated on the
  host and looks its nodes up again per event, and the listbox, option, `aria-expanded`,
  `aria-controls` and `aria-activedescendant` attributes are re-applied on each pass because a
  claim cannot guard an attribute. `contour-tree` generated `role="tree"` with no `role="treeitem"`
  anywhere and stamped every toggle and leaf `tabindex="-1"` while setting none to `0` — a tree
  with no tab stop, so the keyboard could not reach it at all; items now carry `role="treeitem"`
  with `aria-level`, children lists carry `role="group"`, and exactly one tab stop roves with
  focus, held among the *visible* items only, since a stop on a `hidden` node is a stop nobody
  can reach. Arrow keys open and close a branch. `contour-segmented` added its block class to the
  host and left the author's buttons bare: no `c-segmented__option`, so the sheet's
  `[aria-pressed="true"]` rule never matched and the options rendered as unstyled browser
  buttons, and no pressed state at rest meant a screen reader heard three plain buttons instead
  of a group with one choice. It now normalises the class, an explicit `aria-pressed`, the group
  role and label, and a single roving tab stop — the author's `value` wins when it changes, the
  reader's click wins in between, so a re-render cannot move a pressed option back.
  And `wireSegmented` was the one pass that read *authored* children at wire time, which exist
  only once the parser has left the host: the same bundle loaded with `defer` styled the options,
  the same bytes in a `<head>` tag did not, so the guide (which loads the deferred ESM entry)
  could not see it. A classic artifact and a module are not the same moment.
  `node tools/audit/wc-contract.mjs` now refuses any divergence between the two (placement
  parity), it was falsified by removing the retry and rebuilding, and `.github/workflows/ci.yml`
  invokes that gate, so the arm runs.
- `contour-progress` built its bar, set its role, and then threw before saying what it held.
  `const pct` was declared inside the `else` branch of the value test while the ARIA block that
  reads it runs after that branch, so every determinate bar raised `ReferenceError: pct is not
  defined` on each render and reached a screen reader with `aria-valuenow` unset while the fill
  painted on screen. The indeterminate case was wrong in the other direction: with no `value` it
  left a stale `--progress` fill and announced a number the element never had. Both are fixed —
  `pct` is normalised at function scope, and a valueless bar removes `--progress` **and**
  `aria-valuenow` rather than inventing either, keeping an author's own `aria-valuenow` that the
  element did not set. `node tools/audit/wc-contract.mjs` now refuses either half regressing: it
  mounts a bar with a value and requires the announced number beside `role=progressbar`, min, max
  and a fill, then mounts one with no `value` and requires `aria-valuenow` absent and `--progress`
  empty. The second arm was added because a rewrite that kept the hoist and moved the ARIA block
  back outside the branch passed every assertion the gate already held — a green gate that cannot
  see the indeterminate case is the case that ships.
- `contour-elevation` rendered an empty box that raised nothing. Its `render()` body was a comment
  stating that no `.c-elevation` rule exists and that the class was therefore dropped rather than
  invented. That was false: the rule shipped in `00e0494` and is still in the sheet, so it had no
  emitter in the light-DOM layer while the shadow wrapper already applied the same class to its
  host. The §23 specimen compounded it by publishing `level="2"` — an attribute no rule and no
  script reads, absent from `observed` — so markup the guide told authors to copy could not do
  anything. The element now adds the block class, and the specimen says what the element actually
  contracts: it raises the surface it is given, so the surface arrives as a `c-card` beside it.
  The §05 card's duplicate inline `box-shadow: var(--shadow-md)` was deleted only after the two
  computed the same shadow in both themes with the inline gone and neither computed one with the
  class removed too, so the class is what carries the elevation rather than the declaration beside
  it.
- A toolbar crushed its own buttons below the WCAG 2.5.8 target floor. `.c-toolbar` declared
  `container-type: inline-size` on a shrink-to-fit `inline-flex` box, and inline-size
  containment sizes that axis *as if the element had no children*: the toolbar collapsed to its
  own padding and border, measured at 13px against 174px with the declaration removed. Its four
  buttons ask for `2.25rem`; as flex items with the default `flex-shrink: 1` inside a 13px box
  they were squeezed to 12px wide — under the 24px floor the build refuses, and visible only as
  an asymmetric box where the height kept its 36px and the width did not. The containment was
  doing nothing: a `@container` rule reads an element's ancestor container and never the element
  itself, so the toolbar could not query the containment it set on itself. It is gone, which
  restores the size the rule already asked for rather than growing any target. Proven causally,
  not inferred — `width: max-content` left the box at 13px, so no explanation short of
  containment fits, and `node tools/audit/component-inventory.mjs` (CI-wired) now prints
  `every visible pointer target meets the 24px AA floor`.
- `ensure()` reached through a nested host and handed the outer render the inner host's own node.
  Its scope was `root.querySelector(selector)`, which descends into a custom element mounted
  inside this one, so two blocks of the same kind sharing a part name collided. Measured with an
  outer `contour-panel` that had no title of its own, asking for one while an inner panel already
  owned `.c-panel__title`: before the fix the outer render wrote its own title text **into the
  inner host's element** — one title in the page, reading "Outer", and the outer panel left with
  no title at all, so the author's own text inside the child was silently replaced. After it,
  each host owns its own title and both read correctly. `ensure()` now takes the first match
  whose path to the scope crosses no other host, and its per-render cache is keyed by the scope it
  was read from as well as the selector, because a `parent` that is not the host survives the next
  render's node reset while its cached match does not. The cache-key framing this fix replaces was
  itself a wrong diagnosis: no call site passes a `parent`, so the key could not have collided —
  the bug was scope, not naming.
- A shadow wrapper could adopt a stylesheet that no longer exists. `adoptedSheets()` cached on
  sheet count plus hrefs, which cannot see an edit to a sheet already on the page, so a second
  element adopted the first element's stale parse; the key now counts each sheet's rules too.
  Measured across two arms on different served bytes: a rule inserted into the shipped sheet after
  the first element reached the second one only with the new key.
- `node tools/execute-docs.mjs` mounted a published snippet as markup no browser would read.
  Two functions turn a parsed tree back into text: `serialize()` escapes attribute values with
  `escapeAttr`, and `format()` — the one that builds the snippets the guide publishes —
  interpolated them raw. A specimen authored `tabs="[&quot;One&quot;]"` therefore decoded on
  parse and re-emitted with bare quotes inside a double-quoted attribute, so every JSON
  attribute in the element layer reached the reader as markup that cannot be pasted, and the
  gate counted those failures against the specimens. `format()` escapes like `serialize()` now.
  The same chained-replace bug lived twice on the reading side, in `tools/execute-docs.mjs` and
  in `tools/snippets.mjs`'s spacing guard: unescaping `&amp;` before `&quot;` decodes once too
  often and would have undone the fix by re-breaking the mount, so both read through the
  parser's single-pass `decodeEntities` (AGENTS.md rule 8's inverse) instead. Proven as a pair:
  `node tools/execute-docs.mjs` reports zero snippet failures — the only two it does not call
  valid are the unclosed fragments it has always excused as markup that is not a syntax error —
  `node tools/snippets.mjs` twice leaves `index.html` byte-identical, so the round trip is still
  a fixed point, and `npx html-validate` is clean on the shipped pages.
- `family-gate.mjs` could not see a **named colour at all**, and it is the only check that
  enforces "read a token", so the rule the agent-rules artifact publishes as
  machine-checkable was unenforced for the commonest way to write a raw colour. Every branch
  of its vocabulary is a hash or a function name (`#hex`, `rgb(`, `oklch(`, `oklab(`, `hsl(`),
  and a CSS colour keyword is a bare identifier. Measured in a scratch copy: a tree holding
  `color: red; background: white; border-color: black; outline-color: green` was certified
  `7 violation(s) ... every one excused`, while `color: #ff0000` added in the same run was
  caught at its line. The escape was already documented in this repository --
  `src/css/utilities.css` still carries a comment saying its old `background: white;
  color: black` sat where "no colour gate could see" it.
  The rule is **property-scoped, not a wider regex**: only declarations that can hold a paint
  are read, and inside them custom-property names, `url(...)` and function names are masked,
  because `white-space`, `print-color-adjust: exact`, `color-scheme: light`, `fill: none`,
  `color: CanvasText` and `--color-gray-600` are correct CSS that a keyword-only regex would
  refuse -- and `tan()` is a function while `tan` is a colour. The vocabulary is the CSS
  Color 4 set (147 keywords + rebeccapurple) spliced from the pinned independent
  implementation that `dtcg-contract.mjs` already asks, not typed by hand: the hand-typed
  draft dropped `white` and invented `limeyellow` and `midnightwheat`, so the list's size and
  four canaries are now asserted at startup and a dropped name fails the run instead of
  quietly certifying `color: white`. Falsified 45/45 in a sandbox copy -- 14 raw shapes
  caught, 16 look-alike declarations left clean, and every newly-caught shape re-run against
  `HEAD`'s gate to prove the gap was real. Parity holds as an A/B of the two gates on one
  untouched tree (byte-identical output, `5 violation(s) across 13 stylesheets`), so the
  change refuses nothing in the system today; the live tree measures 7 across 14.
  NOT fixed here, because the number is published: `tools/lib/inventory.mjs` keeps its own
  colour vocabulary that still matches only `oklch(` and `#hex`, so the census under-reports
  what enforcement now covers -- measured on the same four-colour tree, the inventory returned
  1 `colourLiterals` entry and it was an unrelated `oklch()` fallback. Widening the census is a
  row of its own, and `check-tokens.mjs`'s output feeds `stamp`, the docs and the token report.
- `check-size.mjs` measured every budget key with `statSync(path).size`, which for a
  directory returns the size of its *inode* -- 4 kB here. The docs package's new `docs/`
  budget would therefore have passed at 4 kB while the package held 43.6 kB: a limit
  measuring nothing, and the same class of green lie as a gate that skips. Directory keys
  now sum the files beneath them, an empty directory is reported as `EMPTY` rather than
  within budget, and the row prints the count it summed (`43.6 kB (24 files)`) so a pass
  states what it compared. Found by noticing that the comment justifying the budget
  described a 42 kB package while the gate that would enforce it could not see one.
- `dist/docs/` is derived from `index.html`, but `build.mjs`'s manifest listed only files
  under `src/` as its sources -- so the guide could change and `check-size` would still
  certify `dist/` as current. The staleness guard had a hole exactly as wide as the newest
  output. `index.html` is a declared source now, which also means editing the guide
  without rebuilding fails the build's own freshness check, as editing any sheet always has.
- The docs' boundary scan demanded a leading `{` or `;` before a CSS declaration, so a bare
  `color: var(--x);` line -- the commonest thing to fall out of a stylesheet -- walked past
  it. Caught by the falsification harness, not by review: the mutation reported the wrong
  rule, which is how a backstop firing hides the rule that was supposed to catch it. The
  adopted shapes (a line-anchored declaration, and a rule block) were measured at zero
  occurrences on the shipped bytes before being trusted, so this is a tightening that stays
  exact rather than a rule loosened until the build went green.
- The published description of the token export was falsified by measurement, and
  the gate that certified it was part of the cause. `README.md` promised "the
  semantic token layer for Figma or Style Dictionary" with `light-dark()` values
  split into `{ light, dark }`; run against an independent DTCG 2025.10 validator,
  the artifact it shipped produced **241 errors**. A colour's `$value` must be
  `{colorSpace, components}` or a reference, so the `{light, dark}` object that
  `check-export.mjs` explicitly *required* was not a legal value form at all, and
  `var(--brand-600)` is not a reference form. The lane was enforcing a non-conformant
  shape -- green, and wrong. Both documents are replaced by the pair described under
  Added, the gate's contract is rewritten around the exported-plus-ledgered sum, and
  the README row now claims export conformance only and names the gate that owns it
  (C-41, C-42, C-43). Style Dictionary's own docs state that 2025.10 support is still
  work in progress in v5, which is why the claim stops at "exports".
- --chart-label in the dark theme measured 4.23:1 against --color-surface-3,
  under the 4.5:1 this file and the README publish for body text, and no gate
  measured it at all -- so the number was unowned rather than visibly wrong
  (C-23). Axis labels are --type-micro text, so the large-text exemption does
  not reach them; the dark value is 70% now and the harness measures the label
  and the no-data mark on every surface in both themes, asserting how many
  pairs it checked. The review aimed this row at --chart-axis, which draws a
  frame hairline -- the same decorative class as --color-border, which the
  contract deliberately does not gate so a separator is never asked to be a
  signal.
- The reason the component contract was thin was a bug in the parser every count
  depends on, not a missing feature. The shared class pattern was
  `\.(c-[a-z0-9-]+)`, which stops at the first underscore, so
  `.c-map-slot__attribution` was read as `.c-map-slot` and `blockOf()`'s `__`
  folding was unreachable code: the inventory reported no elements anywhere while
  `src/css` contains 292 element classes across 73 blocks. The published count of
  134 was never wrong — folding produced the same block name either way — so
  nothing red caught it; what was invisible was the structure, and it stayed
  invisible because no assertion read it. `CLASS_RE` and `blockOf` are now
  exported from the inventory and shared by `tools/audit/component-inventory.mjs`
  and `tools/audit/token-census.mjs`, each of which carried its own copy; the
  `blockOf` inside `page.evaluate()` stays a deliberate copy, because that code
  runs in the browser where there is no module resolution to import from.
- `contour.components.json` shipped with no consumer and no namer: nothing in
  `tools/`, `README.md`, `llms.txt`, `check-dist.mjs` or CI named it, which is the
  C-16 orphan shape for the third time (map chrome, then the token export, then
  this). `check-dist`'s naming contract now covers it, and README names it.

### Added
- C-47: `dist/agent-rules.json` states the constraints an agent must obey when
  generating UI with Contour, and every rule names the gate that enforces it. The
  emitter (`tools/lib/agent-rules.mjs`) throws instead of writing the file if a cited
  gate is missing or runs in no CI lane, so the artifact cannot ship a dangling
  enforcement; `node tools/check-agent-rules.mjs` re-reads `ci.yml` independently and
  compares the **set** of jobs per gate, because build and guard share one library and a
  wrong job label survives byte-equality — only an independent recompute catches it. It
  publishes no counts and no URL: totals belong to `contour.components.json` and
  `contour.tokens.json`, and the project is private until v1.0, so a rulebook naming a
  host it cannot reach would teach the reader to distrust the rulebook. Falsified 10/10:
  two emitter refusals, six guard rejections, one isolation case proving the job rule is
  not the byte rule restated, and one regression guard that `WCAG 2.2.2` and `404` stay
  green because they are identifiers, not tallies.
- `tools/audit/family-gate.mjs`, the only check that enforces "no raw colour literal,
  read a token", now runs in CI. It had been hard-coded to one absolute path, so run
  anywhere else it read that other repo and reported *its* verdict: a scratch copy
  containing `color: #ff0000` exited 0 naming nothing, and exits 1 naming the file after
  the fix. Its exemptions were one substring test that excused any finding containing
  `#000` — including a raw paint colour — and are now named entries matched on the
  enclosing declaration, each of which must excuse at least one real finding or the run
  fails. Verdict on this tree is unchanged by design: 5 violations across 13 stylesheets,
  all ledgered.
- `node tools/build.mjs --single` produces `dist/contour.single.min.css`, the minified
  CSS with the self-hosted fonts inlined as data URIs, so a consumer can ship one file.
  Off by default: it is ~260 kB larger and defeats font caching.
- C-46: `dist/registry/` ships a shadcn registry — `registry.json` plus one item per
  surface bundle, each pointing at its bundle and the shared contract files through
  `files[].path`. **Pointers, not copies**: the live schema also allows
  `files[].content`, and inlining the four stylesheets measured 466,887 bytes of CSS
  copied into JSON beside the files that already ship in `dist/surfaces/` — a 70% jump
  on all of `dist/` for the second copy of one truth. The pointer shape costs 16,443
  bytes.
  The row said verify the field list against the live schema before building, and the
  fetched bytes disagree with the review in four places. `registryDependencies` **is**
  a `registry-item.json` field, though the source thread retracted it as item-links-only;
  we ship it empty anyway, for a measured reason — every surface bundle already contains
  core's 704 selectors, so declaring a dependency would tell a host to install the shared
  layer twice, and `check-registry.mjs` proves the containment against the shipped CSS
  rather than asserting it. `url` is not a field at all. `cssVars` sits at item level, not
  under `tailwind`. There is no `registry:css` type — CSS-only distribution rides on
  `registry:style` with `registry:file` entries. And `files[]` carries a **conditional**
  requirement (a `registry:file` entry needs `path`, `type` and `target`), which a reading
  of `required` alone reports as "no required fields": my first grammar walk made exactly
  that mistake and the conformance gate found it on its first run.
- Nothing in the registry claims it is installable. The project is private until v1.0 and
  the Pages deployment answers 404, so `homepage` and `url` are absent by rule and
  `check-registry.mjs` enforces that absence — a pointer needs a host, and shipping a
  pointer at a 404 would advertise a door that does not open. The claim is the shape, not
  the reach.
- `node tools/audit/registry-contract.mjs` answers conformance with **ajv**, not with a
  hand-written loop, the same way the token export asks dembrandt: the schemas are pinned
  copies under `tools/audit/schema/` (hashes and fetch date in `sources.json`), the root's
  `$ref` to the item schema resolves from the vendored copy so the run needs no network,
  and the vendored bytes must still match the recorded hash — because a silent edit to a
  schema would redefine "conformant" underneath every artifact checked against it. Two
  ajv configuration facts were found by measurement, not guessed: the schemas declare
  `$schema` as `https://json-schema.org/draft-07/schema#` while ajv knows the draft-07
  meta-schema only under its canonical `http://` URI, and ajv's `strictRequired` rejects
  shadcn's own root schema, which states its requirement as
  `anyOf: [{required:[items]}, {required:[include]}]`. `ajv` is now a declared dev
  dependency of `tools/audit` — it had been reaching the repo only as a transitive
  install, which any `npm install` could have removed.
- **A relaxation that is not tested is a disabled gate with a comment on it.** Because
  `strictRequired: false` was necessary, the contract gate runs four negative controls
  before it reports anything about the shipped files — an unknown type, a root with
  neither `items` nor `include`, a `registry:file` entry with no `target`, and a `style`
  key on an item that is not `registry:base` — and fails the run if its validator accepts
  any of them. The last one caught a second conditional the same way the first caught
  `target`: `style`, `iconLibrary`, `baseColor` and `theme` are forbidden unless the item
  is `registry:base`.
- `node tools/check-registry.mjs` owns structure in the dependency-free validate lane:
  items and bundles must agree in both directions, every `files[].path` must resolve
  inside `dist/` and never escape it, no entry may carry `content`, the only permitted
  URLs are the two `$schema` identifiers, each item's published block and token counts
  must equal the inventory today and its byte count must equal the real file, and the
  shipped bytes must equal a fresh derivation. That last rule was added after writing the
  falsification set: without it, changing an item's `title` in `registry.json` and in its
  item file — an internally consistent hand-edit — passes every other rule, because each
  one only asks the artifact whether it agrees with itself.
- The registry is wired into the seams that have orphaned artifacts three times before:
  `check-dist.mjs` names `registry/registry.json`, `check-size.mjs` budgets the directory,
  `build.mjs` records it in the manifest, both CI lanes run their gate, and `README.md`
  says what it is and what it is not.
- C-45: `dist/docs/` ships the documentation of the version a consumer installed.
  `index.html` is a good human artifact and a poor machine one -- 587,639 bytes
  (573.9 kB; `wc -m` says 587,188 characters, and the two differ because the guide
  carries non-ASCII prose, a distinction a first draft of this entry got wrong by
  quoting the character count as bytes) of specimens, CSS and script around prose an
  agent has to dig out --
  so the build now emits one markdown file per guide section (23) plus
  `docs/index.json`, 43.6 kB for the package. Three rules, each kept because a
  version of this failed without it: **nothing is authored** -- every paragraph is
  the guide's own sentence lifted from its DOM, 187 of 187 measured verbatim against
  the one tag-strip reduction that reproduces what the DOM reports (raw bytes left 24
  paragraphs unexplained, stripping tags with a space left 8); **no URL appears** --
  the project is private until v1.0, so a link inside an installed package would
  instruct a reader to fetch a page that answers 404; and **a doc points at the
  contracts instead of restating them** -- the per-element, variant and state figures
  came out of the section files once `contour.components.json` published them, and the
  four-bullet provenance block became one line naming the source hash, which took the
  package from 52.3 kB to 43.6 kB by removing content rather than raising a limit.
  The index carries the row's two remaining deliverables: `lastUpdated` from
  `git log -1 --format=%cI -- index.html` (not a build timestamp -- that would move
  every shipped byte on every rebuild and claim a freshness the file cannot show), and
  `tables["taxonomy-table"]` taken from `tools/stamp.mjs --json` rather than computed
  again here; stamp cannot be imported, because its module body ends in
  `process.exit(main())` and an import would run the document-rewriting pass inside
  the build. Where the docs are thin they say so: `coverage.notNamedByAnySection`
  lists the 9 contract blocks no section documents (`c-app`, `c-app-body`, `c-box`,
  `c-command`, `c-container`, `c-dialog`, `c-sidebar`, `c-toast-host`, `c-tooltip` --
  measured cause: eight are the guide's own furniture and sit outside every
  `<section id>` subtree the index scans, and `.c-dialog` reaches a section only as
  escaped snippet text, so no live specimen carries the class), and `missingRail`
  names `#field` -- the section holding this system's differentiator, which the
  contents rail never links.
- `node tools/check-docs.mjs` reads that shipped package and re-derives every byte of
  it from the current guide, so a hand-edit, a stale `dist/` and an emitter that
  drifted from its own recorded hash all fail. It sweeps every paragraph against the
  guide's text, resolves each block a doc names in `contour.components.json` (and
  requires a class filed as "not the system" to be genuinely absent from it),
  reconciles the census table's rows against its own Total and against the inventory,
  checks that `counts` and `coverage` agree with the arrays they summarize and that
  the two coverage halves sum to the whole contract, requires a section outside the
  rail to say so in its own file, and scans the package for a URL, markup, a CSS
  declaration or rule block, an `assets/` path and an SVG reference. It prints how
  many files, paragraphs and shapes it compared, because a sweep that silently matched
  nothing would otherwise report a clean package forever. Falsified with 16 mutations:
  13 against the shipped package, 3 against the generator. The generator mutations are
  the load-bearing ones -- build and gate call the same library, so byte-equality is
  silent by construction there, and only the prose and arithmetic rules can fire; the
  harness asserts the byte rule stayed quiet for exactly those three.
- `dist/docs/` is the one guide-derived thing in the package, so the build's contract
  is now a checked property instead of a sentence: `index.html` joined
  `build.mjs`'s manifest sources, `check-dist.mjs` names `docs/index.json` (its 23
  files are named by the index, and `check-docs` fails if a file and an index row
  disagree in either direction), and `check-size.mjs` budgets the package at 45 kB with
  the index at 7 kB. The index's line moved from 5 kB for one reason: the census table,
  1,284 bytes, which appears exactly once in the shipped package -- no other artifact
  in `dist/` carries a `**Total**` row and no section file repeats it. Had it been
  restated per section, the fix would have been to delete the copies, not to raise
  the budget.
- C-44: `dist/contour.components.json` is a contract now, not a list of names.
  Each of the 134 blocks carries its elements (292 across 73 blocks), variants
  (101 across 34), the states its selectors actually carry (213 across 71), the
  sheets that define it, where it is exercised among the shipped templates, and
  the custom properties it reads split into three kinds that behave differently:
  1,348 attributions of `tokens` the token layer declares, 15 `vars` some other
  sheet defaults on the block itself, and 12 attributions of 11 distinct `inputs`
  the system reads and never defines at all (`--c`, `--w`, `--h`, `--x`, `--fill`,
  `--value`, `--progress`, `--target`, `--bv-cell/cols/rows`) -- which is why
  `--c` is listed per block but kept out of the token→block index: it reaches
  `.c-chart` through the markup, and indexing it would advertise a global lever
  the stylesheet never built. The file went from 2,386 B to 128.4 kB; no browser
  loads it, so it cannot regress the payload a consumer ships.
- `node tools/check-components.mjs` reads that shipped file and holds it against
  `src/css`: the block set must equal the inventory's in both directions, every
  published count must equal the arrays it summarizes, every element and variant
  must fold back to the block listing it, every claimed state must survive in a
  selector with comments stripped as the inventory strips them, and the shipped
  bytes must equal a fresh derivation -- so a hand-edited or stale contract fails
  rather than shipping. It reports the population it swept (`134 blocks asserted
  present and unique`), because an artifact listing nothing must not be able to
  report success, and it is wired into the same CI lane as the export gate. Six
  sabotages were caught -- an invented block, `--c` promoted to a token, a state
  no selector contains, reach claimed for a template that stopped using a block,
  a reverse index missing a real owner, and the contract emptied of blocks -- each
  after the mutation's hash was proven to have landed, and regeneration restored
  byte-identical bytes.
- M7 begins: the token export is now two DTCG 2025.10 documents that an
  independent implementation of the spec accepts. `dist/contour.tokens.json` is a
  Format document — colours as `{colorSpace, components, alpha}` read out of the
  authored literal, aliases published as `{references}` so the lineage survives
  serialisation (C-41), and `$description` harvested from the stylesheet's own
  prose rather than written by the exporter. `dist/contour.themes.json` is a
  Resolver document carrying the dark branch of every `light-dark()` pair (C-43),
  because a Format token has exactly one value and the theme axis therefore cannot
  live in it. The export is generated by `tools/lib/dtcg.mjs` from the census in
  `tools/lib/inventory.mjs`, never from a second parser of `tokens.css`.
- Nothing is dropped silently any more. `node tools/check-export.mjs` requires
  every declared token to land on exactly one side of a public sum, and the build
  prints it: `243 exported + 39 ledgered = 282 declared`, with `92` of those
  published as theme pairs on both sides. The 39 are the values the Format Module
  cannot express — gradients, `clamp()`, dash lists, `em`/`ch` units, a shadow list
  whose colour is theme-sensitive — each named in the document with a reason, which
  is this project's own 151-of-273 failure refused rather than repeated. Hue-knob
  colours resolve to the hue the stylesheet declares and are annotated as having
  done so, because a silent fixed value would misrepresent the system's brand
  mechanism.
- `node tools/audit/dtcg-contract.mjs` (C-42) asks an implementation instead of
  asserting from a summary: dembrandt's validator over both shipped artifacts, with
  zero errors, no `$type` outside the spec's vocabulary, the Resolver set recognized
  as `documentType: "resolver"`, and the validator's own token count reconciled
  against the artifact. It then confirms every published colour against the
  declaration it came from through that same library — the gate reports `180 of 180`.
  dembrandt is dev-only in `tools/audit`, pinned exactly like `playwright-core`, and
  the gate exits rather than skipping when it is absent, so it runs in the `contract`
  lane, which builds first because `dist/` is gitignored. The published claim stops
  at "exports 2025.10, validated in CI" — Style Dictionary's own docs say 2025.10
  support is still work in progress in v5, so no design tool is promised.
- The new gates were sabotage-tested before being trusted, each mutation confirmed
  by a changed hash before any verdict was read. A tampered colour component, an
  out-of-vocabulary `$type` and a deleted `resolutionOrder` each turned both gates
  red. The instructive case is the fourth: a token removed from the refusal ledger
  leaves a document that is still perfectly **conformant**, so the validator stays
  green while the completeness gate fails it — the two gates check different halves
  rather than one gate wearing two names. Restoring by regenerating produced
  hash-identical bytes, so the export is deterministic.
- The chart's colour contract, measured on the harness's own estimator (C-18,
  C-22). A threshold invented by a private script is a number CI can never
  reproduce, and a hand-rolled CIEDE2000 has already shipped broken in this
  repository once (ΔE00 = 737), so the contract is stated in the two quantities
  this estimator can actually prove: contrast ratio, and luminance distance. It
  gates `--chart-missing` at 3:1 (measured 4.09–6.44, which falsifies the
  review's inherited "currently 1.03–1.43:1" — and the real pattern fill plus
  the no-data / zero-data split had already landed with C-31), and reports
  series separation without gating it: dark series 1 and 5 differ by ΔL 0.0001,
  and light 2↔8 and 5↔7 collide, which is precisely why the dash pattern and
  not lightness is what discharges WCAG 1.4.1. No ΔE floor is asserted, because
  no WCAG criterion requires a distance between two data series.
  Two defects the falsification pass found were in this round's own gate: a
  `const` used by `chartContract()` sat in its temporal dead zone (a crash, not
  a result), and the greyscale-collision filter tested `dL === 0` after rounding,
  so a pair at ratio 1.00 reported as "no collisions" while the same number sat
  one line above in `closest`.
- M3 — the spatial family now renders as one surface, and a gate proves it
  reaches a shipped page. The guide's Field section composes a
  `[data-spatial-workspace]`: map area, slot chrome with its controls and scale,
  an over-map panel carrying a coordinate readout and the theme set, a footer
  with survey, instrument and a classified legend, and the attribution band. The
  same composition is what `templates/dashboard.html` ships, so a consumer
  copying a starter gets the differentiator working rather than merely
  documented. `node tools/audit/component-inventory.mjs` discovers that family
  from the specimen's own DOM — never from a list repeated in the gate — and
  refuses any block that reaches no template, asserting the population it
  scanned. `--surface` reports coverage per template file without gating it,
  because the contract is "at least one", and `tools/lib/inventory.mjs` gained
  the per-file hits so that count lives in the one place every other count comes
  from. The rule fired on its first real run: `.c-layer-switch` was composed in
  the guide and shipped nowhere, which is why the dashboard's map panel has a
  layer switch today.
- `.c-legend__method` and `.c-legend__norm` (C-13): a classified ramp states its
  breaks and its denominator. The gate refuses a `.c-legend[data-classification]`
  specimen missing either, or naming a class count outside 3–7. The review cited
  a GeoLinter `NUM_CLASSES` rule and an EU data-visualisation guide for that
  ceiling; `mapbox/geo-linter` answers the GitHub API with **Not Found** and both
  EU URLs return **404**, so the bound ships as Contour's own stated rule with no
  external attribution rather than a citation nobody can check.
- The coordinate precision contract (C-14): `data-precision` on `.c-readout`
  reserves the value column so a moving fix cannot reflow the panel, and
  `.c-readout__order` names the axis order, which RFC 7946 §3.1.1 makes
  normative. The guide's ladder table is derived, and the gate recomputes every
  row from 111.32 km per degree divided by the decimal place, so a row that
  disagrees with its own formula fails the build instead of shipping a confident
  wrong number. The three RFC sentences this rests on were read from the RFC
  itself, including §3.1.10's "MUST NOT be interpreted as an indication to the
  level of uncertainty" and §11.2's "6 decimal places … amounts to about 10
  centimeters".
- The attribution band (C-15) is a token-owned layout zone: `--map-attribution-*`
  carries its corner, its gaps, its surface and the vendor mark's shipped box,
  which the band reserves and never restyles. The numbers came from the vendor's
  own attribution page, fetched and read — the mark's `20px`/`65px`, "the text
  attribution contains at least three links", and "you can adjust the font color
  and size … but attribution must be legible" — which is why the band sets
  `--color-text` on `--color-surface-1` where it previously used
  `--color-text-subtle`. The gate measures the band's computed inset, gap and
  mark box against the tokens, and its `filter` against the logo rule.
  Falsified before merging, and the falsification found two defects in the new
  gate rather than in the stylesheet: `parseFloat` on a token serialised as
  `0.1875rem` returns a unitless number, which failed two checks loudly and — far
  worse — let the two mark-box assertions pass quietly forever. Custom properties
  are now measured through a real property on a probe, the same discipline the
  `ch` width already used.
- `tools/audit/contrast-and-aria.mjs` now holds the C-28 and C-29 assertions.
  The behaviours landed two commits earlier and every one of them was proved by
  a probe in `tmp/`, which is gitignored: a reader could not re-run the evidence,
  and the next refactor could undo all of it with the suite green. The
  measurements — the live host present and empty at load, a fired toast landing
  inside it without a nested role, the whole page leaving the tab order while a
  snippet is open and returning on close, scroll padding clearing the sticky
  header — are now failures in the lane CI already runs.
  `scroll-padding-block-start` was already in `base.css`, so this asserts that it
  lands rather than adding a second rule for the same job.
  Four sabotages produced nine failures, and one of them found a hole in the new
  gate rather than in the code: a host pre-filled with a **text node** passed the
  element-count check and was excluded from the pre-filled sweep by its own id,
  which is the exact defect C-28 exists to catch. Both checks were rewritten and
  the same sabotage then failed twice over.
- `README.md` and the accessibility contract in `AGENTS.md` both publish the two
  contracts, and `tools/claims.json` registers each sentence against that gate
  (C-28-a/b, C-29-a/b), so the prose cannot outlive the check that owns it.
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

- Package exports in `package.json`: subpaths for `contour.css`, `contour.min.css`,
  `surfaces/*`, `fonts/*`, `tokens`, `themes`, `components`, `contour.js` and
  `map-chrome/*`, so a bundler can import exactly what it needs without guessing
  paths. `sideEffects` and `engines` (node >= 18) are declared for the same reason.

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
- Specimens added for `c-menu`, `c-tag`, `c-expandable`, `c-pressable`, `c-scrim` and `c-resize-handle`. An earlier entry here claimed nine undocumented components had been documented; measured with `node tools/audit/component-inventory.mjs`, six of those nine now have a specimen and **<!-- ds:noSpecimen -->0<!-- /ds:noSpecimen --> of <!-- ds:components -->163<!-- /ds:components -->** blocks still have none
- The accessibility contract in `README.md`, `AGENTS.md` and `llms.txt` claimed the ratios were "verified across 210 text and icon pairs per theme". Nothing computes 210: `tools/audit/contrast-and-aria.mjs` measures 52 named colour pairs (76 numeric comparisons with series and ramp steps). The three lines now name the enforcing command and its exit condition instead of a count no tool recomputes, and `AGENTS.md` warns against putting a pair count back there. Its criterion was also corrected to 1.4.11 for adjacent contrast, with 2.4.13 governing focus appearance
- `tools/contour-gen.py` wrote its verification JSON into a machine-local temp directory outside the repository — a path that existed on one developer's machine and on no clean clone or CI runner. Nothing in the repository reads those files (checked by search), so they now land under the project's own gitignored `tmp/audit/`

### Removed
- The four `[data-theme]` sets in `src/css/tokens.css` — positron, dark-matter, voyager, high-contrast. They are ad-hoc rules belonging to airship/libreship, which already declares all four in `packages/styles/src/tokens/index.css`; a named theme is a product decision, so `src/` keeps the `[data-theme]` extension point and ships only the two system themes. Measured with `tools/lib/inventory.mjs`: the twelve tokens those blocks wrote are each also declared in `:root`, so the unique token count is unchanged at 272 and only declaration lines moved (348 → 312). The guide keeps one set of its own, `daylight`, declared as a consumer in `assets/css/docs.css`. `tools/audit/contrast-and-aria.mjs` now reads the set names from the guide's switcher instead of repeating them, so the sweep cannot silently measure nothing.

### Corrections to this file's own claims
Three entries above were overstated when first written, and are corrected here rather than quietly deleted:
1. **"Nine unspecced components documented"** — six of nine, with 13 blocks still undocumented.
2. **"`llms.txt` corrected (component count…)"** — was false when written here, and is now actually done. Both files published 83 components / 260 tokens while `src/` held **<!-- ds:components -->163<!-- /ds:components --> components, <!-- ds:tokens -->290<!-- /ds:tokens --> tokens, <!-- ds:tokens-read -->290<!-- /ds:tokens-read --> read, <!-- ds:tokens-unread -->0<!-- /ds:tokens-unread --> unread**. The root cause was in the gate, not the prose: `stamp` only visited files carrying markers, and neither file had any — `llms.txt` is machine-facing and `DESIGN.md`'s figures live in YAML front matter, where an HTML comment is not legal syntax — so `stamp --check` passed by never reading them. `stamp` now owns both (anchored rewrites for `llms.txt`, a key-path setter for front matter) and treats a declared pattern that matches nothing as an error, so a skipped file fails the build instead of greening it
3. **"focus ring (3.55:1)"** — that was the best-case surface. The binding measurement was 2.94:1, i.e. the contract did not hold until the change recorded above.
