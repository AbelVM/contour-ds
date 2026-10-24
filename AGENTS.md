# AGENTS.md

Working notes for anyone — human or agent — changing this repository.

Read this before you touch a file. Most of the rules below exist because
something went wrong once and cost an hour to find.

---

## What this is

**Contour** — a token-driven design system for spatial interfaces (routing
engines, pedestrian simulators, geospatial dashboards). It ships three
surfaces: a **landing page**, a **documentation site** and a **technical
dashboard**.

- Dark and light themes, <!-- ds:components -->134<!-- /ds:components --> components, <!-- ds:tokens -->282<!-- /ds:tokens --> design tokens.
- **Zero runtime dependencies, no build step.** `src/css/ds.css` is the whole
  system and can be linked straight off a disk.
- The style guide (`index.html`) is the documentation *and* the test suite.

Design context — audience, use cases, tone, colour strategy and anti-goals —
lives in `.impeccable.md`. Read it before changing anything visual.

---

## Layout

```
src/          the design system — this is what a consumer takes
  css/           the stylesheets, ds.css is the entry point
  js/ds.js       optional progressive enhancement
  svg/           the brand mark
assets/       guide-only — never shipped
  css/docs.css   the style guide's own shell — NOT part of the system
  js/guide.js    the guide's own behaviour (snippet disclosure), also not
                 part of the system
  svg/           the contour field behind the chart-paper texture
tools/        build-time scripts, never shipped
templates/    three starter pages
```

### The ownership rule

> Anything that only makes sense inside this guide belongs in `assets/`,
> not in `src/`.

A consumer takes `src/` and nothing else, so a rule in `src/` must work
without the guide. The rules that broke that rule and were moved:

| Rule | Why it cannot live in the system |
|---|---|
| `.chart-paper` | Masked with `assets/svg/contour-field.svg` — a guide asset outside the system |
| `.ridgeline` | A divider the guide puts between its own sections, not a component the system ships |
| `--contour-field`, `--contour-opacity` | Tokens that exist only for the two rules above |

**Check for leftovers before you finish:**

```bash
rg 'ridgeline|chart-paper|contour-field|contour-opacity|ds-' src/
```

Anything that matches is either a leak or a false positive you must justify.

---

## Commands

| Command | What it does |
|---|---|
| `node tools/check-layout.mjs` | The layout ratchet: frozen primitive set, the `@deprecated` ledger, and the two gap tokens that make `.stack`/`.c-stack` different values | 
| `node tools/snippets.mjs` | Regenerates the code snippets in `index.html` — **run after editing any specimen**. Also the spacing guard: it reads the **emitted** snippets and fails the build when one leads with guide spacing, so a warning is not a pass |
| `node tools/build.mjs` | Bundles and minifies the **design system only** into `dist/` (no guide markup, no templates), and exports the token layer as two DTCG 2025.10 documents: `contour.tokens.json` (Format) and `contour.themes.json` (Resolver). Its per-surface file list is **derived from `ds.css`** and asserted, so a new sheet cannot land in `contour.css` and miss every surface bundle. The one guide-derived thing that ships is `dist/docs/` — prose and pointers, never specimen markup, and `check-docs.mjs` asserts that rather than asserting the sentence |
| `node tools/build.mjs --single` | Additionally emits `dist/contour.single.min.css`: the minified CSS with the self-hosted fonts inlined as data URIs, so a consumer can ship one file. Off by default (~260 kB larger, defeats font caching) |
| `node tools/check-export.mjs` | The export's completeness contract: every declared token must be exported **or** named in the document's refusal ledger with a reason, the shipped bytes must equal a fresh derivation from `src/css`, and every theme pair must be published on both sides. Reads the artifact, not the source |
| `node tools/audit/dtcg-contract.mjs` | Asks an independent implementation of DTCG 2025.10 (dembrandt) whether the two shipped documents conform, and confirms every published colour against the declaration it came from. **Exports the spec is all it claims** — never that a design tool reads it back. Exits rather than skipping when `npm --prefix tools/audit install` has not run |
| `node tools/check-components.mjs` | The component contract's guard: reads `dist/contour.components.json` and fails unless its blocks, elements, variants and states all resolve in `src/css`, the three kinds of custom property a block reads (declared token / sheet-defaulted var / host-set input) reconstruct the inventory's raw read list, no host input is indexed as a retunable token, and the shipped bytes equal a fresh derivation. Reads the artifact, not the source |
| `node tools/check-docs.mjs` | The docs package's guard: reads `dist/docs/` and re-derives **every shipped byte** from the current `index.html`, so a hand-edit, a stale `dist/` and an emitter that drifted from its own recorded hash all fail. Fails when a paragraph is not the guide's own sentence, when a block a doc names is absent from `contour.components.json` or a class filed as guide-only turns out to be defined, when `counts`/`coverage` disagree with the arrays they summarize (and the two coverage halves must sum to the whole contract), when a section outside the rail fails to say so in its own file, when the census table's rows do not sum to its own Total or the Total disagrees with the token census, when `lastUpdated` is not what git records for `index.html`, or when the package grew a URL, a tag or a CSS declaration. Prints how many paragraphs and files it compared: a sweep that matched nothing is a failure here, not a clean report |
| `node tools/check-registry.mjs` | The registry's structural guard: reads `dist/registry/` and requires items and built surface bundles to agree **in both directions**, every `files[].path` to resolve inside `dist/` without escaping it, no `content` on any entry (the registry points at the shipped bundles; inlining them would copy, inside JSON, the bytes that already ship beside them), the only URLs to be the two `$schema` identifiers, and neither `homepage` nor `url` to appear — the project is private until v1.0, so a pointer with no host must not read as an install instruction. It also reconciles each item's published block and token counts with the inventory, proves the core bundle's selectors really are inside every surface bundle (which is why `registryDependencies` is empty), and re-derives the shipped bytes, because an internally consistent hand-edit passes every rule that only asks the artifact whether it agrees with itself |
| `node tools/audit/registry-contract.mjs` | Asks **ajv** — not this repository — whether `dist/registry/` conforms to the shadcn schemas, pinned under `tools/audit/schema/` with their hashes and fetch date in `sources.json` so the run is deterministic and needs no network. Claims the **shape only**, never that a host can reach it. Because `strictRequired` had to be relaxed — the root schema states its requirement as `anyOf: [{required:[items]},{required:[include]}]`, which strict mode rejects on a branch that declares no `properties` — the gate first feeds its own validator four documents that must be refused: an unknown type, a root with neither list, a `registry:file` entry with no `target`, and a `style` key on an item that is not `registry:base`. It fails the run if any is accepted, because a relaxation that is not tested is a disabled gate with a comment on it. Exits rather than skipping when `npm --prefix tools/audit install` has not run |
| `node tools/gen-light-dark.mjs` | Writes `src/css/light-dark-fallback.css` from the token layer; `--check` (CI) fails when the committed file is stale against `src/css` |
| `python3 tools/contour-gen.py` | Regenerates the contour artwork |
| `npx html-validate index.html templates/*.html` | Markup validation |
| `node --check src/js/ds.js && node --check assets/js/guide.js` | Script syntax — **one file per invocation**: this tool reads only its first argument, so passing two files silently checks one |

The audit harnesses live in the repository, in `tools/audit/`, with a dev-only
manifest of their own (`tools/audit/package.json`): contrast and the document
contract (`contrast-and-aria.mjs`, which exits non-zero), the component inventory
and target sizes (`component-inventory.mjs`), the token census report
(`token-census.mjs`), the family gate (`family-gate.mjs`), the theme render probe
(`theme-render-probe.mjs`), the chart geometry seam (`chart-geometry.mjs`),
the chart accessible names (`chart-names.mjs`) and the DTCG conformance contract
(`dtcg-contract.mjs`). Their JSON output
lands in the project's gitignored `tmp/audit/`. The browser harnesses discover a
driver via `tools/audit/lib/browser.mjs` and **exit rather than skip** when none
is found; `dtcg-contract.mjs` needs no browser but resolves `dembrandt` through
that same manifest, and **exits rather than skips** when it is not installed —
a gate that silently does not run is a gate that silently passes.

---

## Rules that will bite you

### 1. The reset kills `margin: auto`

`src/css/base.css` sets `* { margin: 0 }`. That also removes the `margin: auto`
the platform uses to centre a modal `<dialog>`. `.c-dialog` puts it back — and
if you add a component that centres itself, you must too.

### 2. A popover's `display` must not be set unconditionally

An author `display` on a `popover` element overrides the UA's `display: none`,
so a closed popover becomes visible. Set `display` only when it is open:

```css
.c-command:popover-open,
.c-command.is-open { display: flex; }
```

### 3. `var()` inside a custom property resolves eagerly

A descendant that changes `--brand-hue` has no effect: `--brand-600` was
already substituted on `:root`. That is why `.c-theme-scope` re-derives the
whole brand layer instead of overriding one value.

### 4. Hidden labels must be anchored, not static

`position: absolute` with no `inset` uses the **static position**. Inside a
horizontally scrolling table that put the label past the edge of the
scroller, and because its containing block was above the scroller it escaped
the clip and stretched the whole page by 14 px. `.visually-hidden` is
anchored to its containing block for exactly this reason.

### 5. Contour lines are generated, never drawn

Iso-lines of different levels of the same continuous field **cannot cross**.
Hand-drawn curves have no such relationship, which is why they intersect and
form shelves. Every contour line in this repository comes from
`tools/contour-gen.py` (marching squares over a real field, with the
asymptotic saddle decider and a level-nudge pass that guarantees zero
crossings).

If you need a new contour shape: **add a field to the generator**, do not
draw a path. The generator verifies its own output.

### 6. The command palette index is built from the page

`buildIndex()` reads the DOM, so renaming a section can never leave a stale
search result. If you add a nav list, mark it `data-command-nav`.

### 7. The snippet disclosure belongs to the tool

A rendered example is either a `.ds-panel` / `.ds-spec` container, or any
element marked `data-snippet`. `tools/snippets.mjs` wraps each example and
its disclosure in a generated `.ds-example`, so the pair travels together and
the disclosure can never land beside its example in a grid.

Three things follow from that:

- **Never hand-edit a snippet.** Run the tool; it extracts the markup from
  the example itself.
- **Never hand-edit a `.ds-example`.** It is generated (`data-generated="wrap"`),
  and the tool removes and rebuilds it on every run.
- **A new specimen needs `data-snippet`.** A `.ds-panel` / `.ds-spec` is
  found by class; anything else has to say so.

`data-snippet` means *this element is the example*: the snippet then shows
the element itself, tag, classes and attributes included, because that is
what a reader copies. A guide frame — anything with a `ds-` class — is only
a frame, and its snippet shows what it holds. The marker itself never
appears in a snippet.

Keep the guide's own spacing out of the specimen markup: an inline
`margin-block-start` on a component ends up in its snippet, where it means
nothing to a consumer. The guide's stylesheet can space the specimens
instead.

The open disclosure floats: `.ds-code__body` is taken out of the flow, so
opening a snippet never reflows the page. The section that holds it draws a
scrim (`::after`, `position: fixed`) and the open example is raised above
that scrim, so the example and its markup stay sharp while the page falls
away. A section creates a stacking context (`isolation: isolate`), which is
why the *section* is what gets raised — a descendant cannot escape it.

The example cell is as tall as the tallest example beside it
(`align-self: stretch`), the example takes that height
(`grid-template-rows: 1fr auto`) and the disclosure sits on the cell's
baseline (`align-self: end`). Without this, a row of specimens of different
heights leaves the disclosures staggered — the bar stretched to fill the
cell instead of sitting on one line.

The copy action lives in the **summary row**, not over the code, and it is
visible only while the disclosure is open — the space is reserved so opening
one never shifts a pixel. A copy button inside a `<summary>` must not toggle
the disclosure, so the handler in `src/js/ds.js` cancels the default action
when the trigger is inside a `summary`.

### 8. The HTML round trip must be a fixed point

`tools/lib/html.mjs` parses a document and writes it back. If the parser
keeps values raw while the serialiser escapes them, every run of a tool adds
one level of escaping: `&amp;` becomes `&amp;amp;`, and the Google Fonts URL
grows until the fonts stop loading.

So the parser **decodes** entities and the serialiser **escapes** them, and
the two must stay inverses. Three details keep it that way:

- `decodeEntities()` decodes in a single pass, so `&amp;lt;` becomes `&lt;`
  and not `<`.
- Comments, the doctype and `script` / `style` text are written back
  verbatim — they are not markup, and escaping them breaks them.
- `format()` emits raw markup and the caller escapes once, for the place the
  string goes into. Escaping in both places doubles every `&`.

**Check it after touching the parser:**

```bash
node tools/snippets.mjs && git diff --stat index.html   # or: diff against a copy
```

The file must not change on a second run.

### 9. A shadow of one strength cannot serve both themes

The elevation tokens are `light-dark()` values. On a white surface a soft
black shadow reads as depth; on a dark surface the same shadow disappears
into the surface it falls on — the elevation specimen looked broken in dark
mode until the dark values became near-black and opaque.

Depth is carried by **surface lightness** first; the shadow only marks what
genuinely floats. A card on a card of the same lightness has no elevation to
show in either theme, so give it a raised surface (`--color-surface-raised`)
rather than a bigger shadow.

### 10. A component must not own its heading level

A component that renders an `<h5>` (or any fixed level) inside a page
whose outline is at `<h3>` produces a level jump. The type scale is the
system's; the document outline is the author's. Ship the heading as a
class (`.c-panel__title`) applied to whatever heading element the author
chooses, and never hard-code the tag.

### 11. The option list of a native select cannot be styled

The list that opens under a `<select>` is drawn by the platform, in the
platform's own colours. No rule in this repository reaches it, and the
platform follows the operating system's theme rather than the page's — a
dark page on a light machine opens a light list.

So the design lives in the **closed** control: the surface, the border, the
chevron, the focus ring. Style that, keep the native select, and do not
reach for JavaScript to replace the list — a custom listbox is a widget
with its own keyboard and focus rules, and the platform already ships one
that works.

The select inherits the page's `color-scheme`, so a browser that honours it
draws the list in the page's theme. That is the most the platform gives.

---

## Conventions

### CSS

- Cascade layers, in this order: `tokens, base, components, utilities`. (The reset lives inside `base.css`; there is no separate `reset` layer.)
  `src/css/ds.css` declares the order; a file may only add to a layer.
- Naming: `.c-<block>` for the block, `.c-<block>__<element>` for parts,
  `.c-<block>--<variant>` for variants. Guide-only classes are `ds-`.
- Layout primitives are a closed set held by `node tools/check-layout.mjs`: the
  composition primitives carry the `c-` prefix like every other block, the
  document frame (`.container`, `.section`) stays unprefixed because it is page
  furniture rather than a block a consumer composes, and a fifth name cannot
  appear without editing that gate's ledger and giving a reason. `.stack` and
  `.c-stack` are NOT the same rule — they gap by different tokens — so never
  alias one onto the other; the gate pins both tokens for that reason.
- Never rely on a descendant selector to reach into another component.
- Tokens are defined in `src/css/tokens.css` and consumed as
  `var(--color-…)`. A raw hex value in a component is a bug.
- `light-dark()` for anything that changes between themes.

### HTML

- One `main`, one `h1`, headings in order.
- Every control has an accessible name. Icon-only buttons get `aria-label`.
- State is never carried by colour alone — a hue always comes with a shape,
  an icon or a word.
- Nothing is hidden behind JavaScript. The guide works with JS off, and so
  must your component.

### JavaScript (`src/js/ds.js`)

- Progressive enhancement only. The page is fully usable without it.
- Native elements first: `<dialog>`, `<details>`, popover, `<input type=range>`.
  Add JavaScript only to add behaviour the platform cannot.

---

## The accessibility contract

- Body text **4.5:1**, borders / focus rings / control edges **3:1**, in both
  themes. Enforced by `tools/audit/contrast-and-aria.mjs`, which measures the
  control edge and the focus ring against every surface a control can sit on, in
  both themes, and exits non-zero below 3:1 — WCAG 1.4.11 for adjacent contrast,
  with 2.4.13 governing focus appearance. Keep pair counts out of this line: a
  number no tool recomputes goes stale silently, which is what an earlier
  revision of it did.
- Every series in a chart carries a **dash pattern** as well as a hue, so no
  chart asks the reader to tell two colours apart.
- `prefers-reduced-motion: reduce` collapses every transition.
- A status message is announced from a live region that exists, empty, before
  anything is said: `#toast-host` carries the role, the toast carries none, and
  a region that already holds text at load announces nothing. Enforced by
  `tools/audit/contrast-and-aria.mjs`.
- While a snippet disclosure is open the rest of the page leaves the tab order,
  and closing it releases every inert subtree; `scroll-padding-block-start`
  keeps an anchored or focused target clear of the sticky header. Same gate.
- Forced Colors Mode removes the texture and the ridgelines and falls back to
  a system `CanvasText` outline.
- Sizes in `rem`; the layout reflows to 200 % zoom and to a 390 px viewport
  with no horizontal page scroll.

---

## Working on the style guide

- The guide is the specification. A component that is not shown is not
  documented.
- Every rendered example is followed by a `<details>` disclosure with the
  markup behind it. **The snippet is extracted from the example**, so after
  editing a specimen run `node tools/snippets.mjs` — never hand-edit a
  snippet.
- A specimen that is neither a `.ds-panel` nor a `.ds-spec` needs
  `data-snippet`, or the tool will not find it.
- The guide's own behaviour lives in `assets/js/guide.js`: one snippet open
  at a time, click outside to close, Escape to close. The system script
  (`src/js/ds.js`) must not know a guide class.
- Section numbers are sequential (`00` … `21`). Adding a section means
  renumbering the rail, the comment marker and the `label` in the head.
- The rail, the header nav and the footer all link to section ids. A new
  section goes in the rail and the footer.

---

## Deprecation policy

- A component, token or utility is deprecated by adding `@deprecated` to its
  doc comment and a `--deprecated` suffix is never used; the name stays.
- Deprecated items ship for at least one minor release with a console warning
  in the guide's specimen, then are removed in the next major.
- Removals are listed in `CHANGELOG.md` under a `### Removed` heading.
- Consumers are pointed at the replacement in the same changelog entry.

## Before you finish

```bash
npx html-validate index.html templates/*.html
node --check src/js/ds.js
node --check assets/js/guide.js
node tools/check-tokens.mjs    # the census: an unread token must be ledgered or gone
node tools/check-motion.mjs    # WCAG 2.2.2: every infinite animation pausable by a control on a page
node tools/check-defs.mjs      # every url(#id) in src/css reaches a def inside src/
node tools/check-markup.mjs    # font preconnects + share metadata on every shipped page
node tools/snippets.mjs        # if you touched a specimen; also the snippet spacing guard
node tools/build.mjs           # if you touched src/
node tools/check-size.mjs      # refuses a stale dist/, not only a big one
node tools/check-dist.mjs      # the shipped bundle loads cleanly and is free of minifier corruption
node tools/check-export.mjs    # every declared token is exported or ledgered with a reason; dist equals a fresh derivation
node tools/check-components.mjs # the component contract resolves against src/css; no host-set input indexed as a token
node tools/check-docs.mjs      # dist/docs/ is the guide's own prose re-derived byte for byte: no URL, no markup, census rows reconcile
node tools/check-registry.mjs  # dist/registry/ points at files that exist, says nothing about a host it does not have, and equals a fresh derivation
node tools/check-ownership.mjs # no guide-only identifiers (ds-, ridgeline, …) leaked into src/
node tools/check-agent-rules.mjs # the agent-rules artifact cites only gates that exist and run in CI
node tools/check-layout.mjs     # layout primitives are a ratchet; @deprecated must match the ledger
node tools/gen-light-dark.mjs --check  # the light-dark() fallback matches src/css
node tools/stamp.mjs --check   # published numbers match src/
node tools/check-claims.mjs    # every published sentence names the gate that owns it
```

The browser gates need a driver and **exit rather than skip** without one:

```bash
node tools/audit/contrast-and-aria.mjs  # contrast, focus, chart, palette, document contract
node tools/audit/component-inventory.mjs
node tools/audit/theme-render-probe.mjs # does a theme set move a real control, and does --brand-hue hold the contract
node tools/audit/chart-geometry.mjs     # is the gridline band derived from --chart-ticks
node tools/audit/chart-names.mjs        # does every chart name what it plots, and does its data surface
```

`dtcg-contract.mjs` belongs to the same `contract` lane because that is the lane
that installs `tools/audit`, but it needs no browser — it asks an independent
implementation of DTCG 2025.10 whether the two shipped token documents conform,
and confirms every published colour against the declaration it came from. It also
builds first, since `dist/` is gitignored and the gate reads the shipped bytes:

```bash
node tools/build.mjs
node tools/audit/dtcg-contract.mjs  # exports 2025.10 — validated, never asserted
```

Then check the guide in both themes, at 1440 px and 390 px, and look for
horizontal scroll.
