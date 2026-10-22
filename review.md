# CONTOUR — design review

A senior design review of the system, the guide and the contracts between them.
Written against the repository as it stands (2026-10-22), not against an
impression of it.

**Method.** Every claim below is either a citation to a file and line, a
measurement taken from the running page with a headless browser, or a
specification reference. Where I measured something, the numbers are in
[§11 Evidence](#11-evidence) with the command that produced them, so you can
disagree with the number rather than with me. I read `.impeccable.md` first
and judged the system against *its own* stated principles — that is the only
fair yardstick for a system whose whole claim is that it is not generic.

**This document is one review, in two passes.** The first pass covered the
token layer, the components, the guide and the product-family fit. The second
pass went into the parts the first pass had treated as furniture — the
**runtime layer** (`src/js/ds.js`, 845 lines, previously unreviewed), the
**token graph itself** (which tokens are actually consumed), the **install
path**, and the **rendered document** (ARIA, focus management, heading
structure). It also read the two live open-source spatial applications —
**GeoLibre** and **kepler.gl** — as reference implementations of the niche
Contour is written for. The second pass is merged into the sections below
rather than appended as a new one; where it corrects a first-pass finding,
the correction is stated in place.

**Audience I assumed** (from `.impeccable.md`): frontend engineers building
map and geo UIs, product designers prototyping spatial tools, GIS analysts
working long shifts on dense dashboards, and technical decision-makers scanning
a landing page for twenty seconds.

---

## Contents

- [1 · Anti-patterns verdict](#1--anti-patterns-verdict)
- [2 · Overall impression](#2--overall-impression)
- [3 · What is working](#3--what-is-working)
- [4 · Priority issues](#4--priority-issues)
- [5 · Minor observations](#5--minor-observations)
- [6 · Original proposals](#6--original-proposals)
- [7 · Standards and the state of the platform](#7--standards-and-the-state-of-the-platform)
- [8 · Questions to consider](#8--questions-to-consider)
- [9 · What I did not review](#9--what-i-did-not-review)
- [10 · Reading the guide](#10--reading-the-guide)
- [11 · Evidence](#11-evidence)
- [12 · Implementation plan](#12--implementation-plan)

---

## 1 · Anti-patterns verdict

**Pass — with one qualifier.**

This is not the 2025/2026 AI aesthetic, and it is not the "clean competent
SaaS" look either. The checks:

| Tell | Verdict | Evidence |
|---|---|---|
| Purple→blue gradient hero | **Absent** | The hero is ink-navy with a teal/magenta accent and a generated isoline field (`/tmp/kilo/shots/hero-dark.png`) |
| Gradient text on a metric | **Absent** | The hero's "of a map" is a flat magenta fill, not a gradient |
| Glassmorphism / blur-as-decoration | **Absent** | The only `backdrop-filter` in the system is the header's 16 px frost and the floating snippet scrim — both functional |
| Neon-on-black saturation | **Absent** | The dark canvas is `oklch(12% 0.016 230)`; the brightest chroma in the UI is Plasma at 10% of surface area, by policy |
| Identical icon+heading+text card grids | **Mostly absent** | The spec grid is varied; but §4.6 finds a real instance of the rhythm problem in the guide itself |
| Inter / Roboto / system-default type | **Absent** | IBM Plex Sans + Condensed + Mono, one superfamily |
| Mono as lazy "developer" shorthand | **Absent in the product** | Mono is scoped to data, coordinates, labels and code — and the guide's *prose* is IBM Plex Sans (`--font-sans`) ✓ |
| Rounded rectangles with generic soft shadows | **Absent** | Depth is surface lightness + a hairline; the shadow ramp is reserved for things that float |
| Decorative sparklines | **Absent** | The chart specimen carries real series with dash patterns and a legend that previews them |
| Hero metric layout (big number + label + stats + gradient) | **Partly present** | The hero *does* carry a four-cell stat strip — see §4.6 |
| Scarcely-there UI / bare palette | **Absent** | The system has a point of view: a cartographic instrument |
| **A token layer used as a taxidermy case** | **Present** | 55 of 263 tokens — 21 % — are declared and never read by anything (§4.13) |

**The qualifier.** The system is *original in concept* and *derivative in
execution* in one specific way: the component inventory is the standard one.
Button, input, select, card, badge, chip, table, tabs, modal, toast,
breadcrumb, pagination, tooltip, popover, drawer, tabs, alert, skeleton,
spinner, empty state, pagination, stepper, timeline, avatar, accordion,
segmented control, switch, checkbox, radio, range, menu, command palette. Every
one of those is a component you will find in every system, and most of them
look the way they look everywhere. The isoline motif is the system's
distinguishing idea, but it currently appears in the *product* in exactly two
places — the contour meter and the waypoint mark — while the two loudest
instances (the chart-paper field and the ridgeline dividers) live in the
guide, where a consumer will never see them.

The second pass found the same pattern one layer down, and this is the more
serious instance of it. The *token* layer is as standard as the *component*
layer, and it is carrying the same kind of weight: a complete sequential
ramp, a complete diverging ramp, a colour-bar pair, a hover and a missing
colour, a whole dark-mode surface inset — **all declared, all named, none
read by anything.** The system's data-visualisation vocabulary is advertised
in `README.md` and `llms.txt` and implemented in exactly one place: three
lines in one hand-written SVG. That is not a documentation gap. It is the
same gap as the spatial marks, one layer in: the system *declares* that it
can draw data and then does not draw it.

That is the finding, and §6 is the answer to it: the motif has to move into
the shipped system, not just into the guide that documents it — and the token
layer has to stop being a promise.

---

## 2 · Overall impression

**Gut reaction:** this is a well-made instrument, not a design system. The
token discipline is real, the craft is high, and the parts that have been
touched are finished. But the system currently documents a *product* it has
not yet built: it ships a chart frame with no chart API, six components that
no one has ever seen rendered, and numbers in its marketing copy that are
wrong.

**The single biggest opportunity:** *make the isoline the system's grammar
rather than its wallpaper.* Right now the isoline is a texture behind the
guide and a shape in one component. If the ring geometry, the hairline weight,
the tick pitch, the waypoint mark and the "measurement" vocabulary were all
derived from it, Contour would be recognisable at a glance in a product
screenshot — which is the only test that matters for a system whose thesis is
"one motif, used consistently, is what makes a system recognisable"
(`.impeccable.md`).

**The second-biggest:** the system's own contract is not being met. The
README states that "borders / focus rings / control edges meet 3:1". Measured,
the control edge of a text input is **1.58:1** against the panel it sits on,
and the input's fill is the *same colour* as the panel. The contract is
documented, audited for text, and quietly false for everything else. A design
system that ships a written contract it does not meet has a worse problem
than one that ships no contract.

**The deepest gap,** and the one that is easiest to miss: a design system for
spatial interfaces that **cannot draw spatial data**. There is no isoline
fill, no catchment polygon, no route path, no hex grid, no layer switcher,
no scale bar, no map slot — not one component that puts a *place* on screen.
`.impeccable.md` names a layer switcher and an isoline chart as use cases,
and the system's own signature is the isoline; the only isolines in the
repository live in the guide's artwork, where a consumer will never see them.
Everything else in the system is a general-purpose component done well. This
is the place where "top notch" would mean "original", and it is also the
largest amount of work on the list.

**And the same gap, one layer in.** The second pass found that the *token*
layer makes the same promise the component layer makes. The README and
`llms.txt` both advertise a chart vocabulary — eight categorical series, a
seven-step sequential ramp, a diverging triple, six dash patterns — and
**seventeen of those thirty-two chart tokens are read by nothing at all**
(§4.13). The sequential ramp is the interesting one: it is the *only*
correctly-built data ramp in the repository, it is monotonic in lightness in
both themes, it inverts properly for dark mode, and **no component consumes
it**. The system's most expensive and most correct idea is also its most
unused.

**The two defects a consumer hits in the first hour.** The first is a
contract that quietly does not hold: `.c-theme-scope` — the mechanism the
README offers for re-tinting a subtree — **resets both of the system's own
global knobs** (`--brand-hue`, `--radius-scale`) back to their defaults, so
the documented `:root { --brand-hue: 250 }` override does not reach any
theme scope (§4.14). The second is that the system's focus *halo* measures
**1.15:1** against the surface it sits on, and it is the *only* focus
indicator on the checkbox, the switch and the range thumb (§4.15). Both are
small diffs. Both are in the path of every consumer.

**And the frame around all of it.** The product family this system is for
already exists — `libreship`, a spatial dashboard library and data engine
for MapLibre, the open heir of CARTO Airship — and it has a design layer of
its own: `@libreship/styles` ships 82 tokens, seventeen host-primitive
families, a three-step density scale, six themes, a `::part()` theming
layer and thirteen gate scripts.

**The intent is that Airship's heir would use Contour instead of that custom
design system.** That is a different proposition from "Contour can be
adopted alongside a design system", and it is a *harder* one — because there
is no second layer left to absorb the parts that do not fit ✗. But the
direction matters: **libreship adopts Contour, not the other way round.**
Contour is not obliged to grow twenty libreship-specific token concepts
(widget frame, plot inset, option height, spinner duration …) just so a
widget's internals keep compiling. Those are *libreship's* vocabulary, and
libreship's job is to migrate its widget internals onto Contour's existing
tokens — renaming, aliasing where a concept is genuinely missing, and
dropping the ones that were never doing real work. The widgets themselves
stay where they are ✓; only their styling vocabulary moves.

So the coverage matrix (§4.11) is not a shopping list for Contour. It is a
**migration ledger for libreship**: for each `--ls-*` concept, either it
maps onto an existing Contour token (rename), it is a real gap Contour
should fill because other consumers need it too (add), or it is
libreship-specific and stays in libreship as a thin alias layer (keep). The
rest of this review is about the same question asked of the system in
general — and about keeping Contour's own vocabulary small and original
rather than letting it become a mirror of somebody else's.

**The market context.** The geospatial analytics market is projected to grow
from USD 93.5 B to USD 362.5 B by 2035 (13.1 % CAGR), and CARTO Airship —
the last open design system for spatial dashboards — is deprecated (last
release 2020, ~154 weekly downloads). No open design system currently owns
the spatial-dashboard niche, and the 2026 State of Spatial Analytics report
names tool fragmentation as the field's top pain point. Contour's
opportunity is to be the open host layer for that niche — but only if it
ships the spatial marks, the theme set and the container-query behaviour the
niche requires, and only if it does so without copying Airship's visual
language (which is the one thing every competitor already has).

---

## 3 · What is working

### 3.1 The token architecture is genuinely well made

Four layers — primitive, semantic, component, utility — with primitives that
never change between themes and a semantic layer that resolves entirely
through `light-dark()`. The consequences are real and they are visible in the
code:

- A theme swap is one property on `:root` (`src/css/base.css:25-37`), and
  the *same* token names mean different things per theme. No `[data-theme]`
  duplication, no parallel dark stylesheet, no JS required to read the page.
- The chart layer is deliberately separate from the UI palette
  (`src/css/tokens.css:365-420`), with a comment that says why: "a chart
  token maps a value to a *data role*; a semantic token maps a value to
  *product meaning*". Almost nobody gets this right. The consequence is that
  the same magenta is "live data" in the UI and "series 4" in a chart, and
  neither leaks into the other.
- `--brand-hue` re-derives the whole primary ramp from one number, and
  `.c-theme-scope` re-derives it *locally* — solving the `var()`-resolves-
  eagerly trap that most token systems walk into (documented in `AGENTS.md`
  rule 3, and correctly solved).
- Every ramp is in OKLCH with a fixed hue and a lightness ladder, so the
  steps read evenly. `--tidal-500` is exactly `#14b8a6` and `--plasma-500` is
  exactly `#f20084` — anchored, not approximated.
- The palette is **original**. That is not a small thing for a system meant
  to be adopted: the obvious alternative — lifting a public palette — carries
  attribution duties (the spatial product family this system is for already
  ships CC-BY and Apache-licensed colour data with a generated attribution
  page, because it took that route ✓). Contour's ramps are derived, not
  borrowed, and nothing has to be attributed ✓.

**Why it works:** a designer can reason about it. "Higher means lighter" is a
rule you can hold in your head; that is the whole point of a token layer, and
most systems fail it.

### 3.2 The guide is a test suite, not a brochure

This is the strongest structural decision in the repository and I have not
seen it done better anywhere.

- **The snippet is extracted from the example**, so a documented snippet
  cannot drift from what is on screen. `tools/snippets.mjs` owns the pairing
  and the `.ds-example` wrapper travels with the example, so a disclosure can
  never land in the wrong grid cell.
- **The ownership rule is enforced by a grep** (`AGENTS.md`): anything that
  only makes sense inside the guide lives in `assets/`, and a leak is
  detectable with one command.
- **The build ships only the system.** `dist/` contains the stylesheet, the
  script, the tokens and the mark — no guide, no templates, no artwork that
  needs an asset the consumer does not have. A design system that drags a
  background image with it is a design system nobody adopts.
- The toolchain is honest about itself: the HTML round-trip is a fixed point,
  and the comment in `tools/lib/html.mjs` explains the decode/encode
  invariant. Most teams do not get that right and quietly ship a guide whose
  URLs rot.

**Why it works:** the guide is the only artefact that can *prove* the system
works, because it renders every component from the same source a consumer
would.

### 3.3 The contour artwork is generated, and verified

Every isoline in the repository — the brand mark, the chart-paper field, the
hero instrument, the showcase map — comes from marching squares over a real
field, with an asymptotic saddle decider, a level-nudge pass, and a
self-check that every drawn vertex lands on the field and no two lines cross.
`AGENTS.md` rule 5 explains why this matters: iso-lines of one field
*cannot* cross, so hand-drawn "contour" decoration always does.

This is the single most original thing in the repository, and it is also the
thing nobody will ever see in the product, because it ships in `assets/`
(guide-only) or as a single 1.7 kB mark.

**Why it works:** it is a design decision expressed as an algorithm. The
brand mark is not a drawing of a contour; it *is* one, which is why it scales
without turning to mush.

### 3.4 The CSS is written for a language it has never been rendered in

Not a bullet point, but a fact worth stating because it is unusual and it is
unverified by anything the system does.

The stylesheet contains **zero** physical margin, padding or border
properties: 21 `margin-inline`, 14 `padding-inline`, 18 `inset-inline`, 20
`border-inline`, 8 `text-align: start` / `end`. Two physical `left:` /
`right:` declarations survive, both for the section band's bleed offsets
(`src/css/base.css:316-317`), which are geometric rather than directional.

A system that is *accidentally* RTL-ready is common. A system that is
*structurally* RTL-ready, with logical properties throughout, is rare — and
it is exactly what a team that will localise a geospatial product will need.

It is also, right now, a claim nobody has tested: the guide never renders a
`dir="rtl"` specimen, and two `background-position` declarations (the select's
chevron and the diff's marker) are still physical, so the chevron lands on
the wrong side in an RTL build.

### 3.5 The data-visualisation layer that is right

Everything in this subsection is about tokens that **no component currently
reads** (§4.13). They are worth calling out precisely because they are the
best work in the repository and they are inert.

- **The sequential ramp is correct.** `--chart-seq-1…7` is monotonic in
  relative luminance in both themes: 0.793 → 0.614 → 0.447 → 0.302 → 0.192
  → 0.106 → 0.049 (light) and 0.245 → 0.371 → 0.498 → 0.590 → 0.703 → 0.826
  → 0.938 (dark). One hue, fixed chroma envelope, evenly-spaced steps.
- **The dark-mode inversion is correct and deliberate.** The ramp flips
  direction between themes — light runs 92 % → 35 % lightness, dark runs 30 %
  → 90 % — so "step 1" is the low end in *both* themes while the
  *rendered* lightness inverts. That is the right call for a dark canvas and
  it is not what every system does. (It is also the one place where
  Contour's dark theme behaves unlike its surface ramp, where higher means
  lighter in both themes — see §5.7.)
- **The diverging ramp has a real midpoint.** `--chart-div-mid` is a genuine
  neutral (`oklch(92% 0.01 230)` in light, `--basalt-800` in dark), and the
  two ends are a red/teal pair — a hue pair that survives both protanopia and
  deuteranopia, which is the right choice for a diverging scale.
- **The categorical series clears the contract.** All eight `--chart-N`
  measure between **3.67:1 and 6.57:1** against `--color-surface-1`, and
  between 3.32:1 and 5.94:1 against `--color-surface-2`, in light mode; in
  dark mode they measure 5.27:1 to 10.22:1. The README's "every series
  clears 3:1" is true, and it is true with margin.

**Why it works:** the ramp is a *data* ramp, not a UI ramp. It is the one
part of the palette that is allowed to be loud, and it is loud in a
controlled way. If the chart layer ever gets wired up (§4.13, §4.5), this
is the vocabulary it should be built on — not on `--color-scale-1…6`, which
is not a sequential ramp at all (§4.14).

### 3.6 The runtime layer is honest about being optional

`src/js/ds.js` is 845 lines and the first pass had not read it. It is
better than it needed to be, and it is better in a way that is rare:

- **It degrades honestly.** Tabs fall back to their default panel, the
  palette falls back to an `is-open` class when the popover API is missing,
  tooltips fall back to `title`, and the disclosure is a native `<details>`.
  The file's header says every one of these out loud.
- **It does not reach for a library.** The command palette is 200 lines of
  subsequence fuzzy matching, built from the page's own DOM — no index, no
  dependency, no stale results. The sort is locale-aware with `{numeric:
  true}`. The range slider paints its own fill. All of this is a single
  29 kB file with zero dependencies, which is the claim the README makes and
  the claim it keeps.
- **It refuses to know the guide.** `rg 'ds-' src/js/ds.js` returns nothing:
  the system script never references a guide-only class. The guide's own
  behaviour is in `assets/js/guide.js`, 63 lines, and the separation holds.
- **The theme toggle labels the action, not the state** — a sun means "click
  for light" — which is exactly the affordance principle applied to a
  control that is easy to get wrong.

**The gap is not in the code but in the *surface area*.** The file exposes
**no public API**: `showToast`, `applyScheme` and `goTo` are all inside the
IIFE. A consumer who wants a toast from their own code has to reimplement
one. The system's only feedback component is unreachable by the people it
ships for. See §4.18.

### 3.7 The rendered document is clean

Measured on the guide at 1440 px: **one `<h1>`, one `<main>`, `lang="en"`,
a skip link, zero duplicate ids, zero images without an `alt`, and zero
buttons without an accessible name** (199 buttons, 0 unnamed). That is a
better document than most production design systems ship, and it is not
accidental — the markup rules in `AGENTS.md` are the reason.

It is also not *finished*, in ways the first pass missed: one heading-level
jump (h3 → h5, caused by a component that hard-codes its own heading
level — §4.19), three range inputs with a visible label that is not
programmatically associated (§4.19), and a command palette whose combobox
never announces its active option (§4.16).

### 3.8 The niche is genuinely unclaimed — and it is a *chrome* niche

The first pass established that no open design system owns spatial
dashboards. The second pass looked at what the two live open-source spatial
applications actually ship, and the finding is sharper than "nothing is
there":

- **GeoLibre** (`opengeos/GeoLibre`, commit `9cf1930`, 2026-10-20) is a
  **shadcn/ui + Radix + Tailwind v4** application, not a design system. It
  ships a twenty-primitive component package, five accent schemes, an
  explicit dark-mode elevation ladder — and then spends **~1 500 lines of
  `index.css` re-theming ten third-party map-control packages** onto its
  own tokens, one namespace per vendor (`--vc-*` for
  `maplibre-gl-vector`, `--fw-*` for FEMA WMS, `--ne-*` for NASA Earthdata,
  `--ea-*` for EnviroAtlas, `--nm-*` for the National Map, `--ovt-*` for
  Overture, `--swipe-*`, `--ep-*`, `--ts-*`). It beats the upstream cascade
  by repeating the class selector five times rather than using
  `!important`.
- **kepler.gl** (`keplergl/kepler.gl`, `v3.3.0-alpha.18`) uses
  **styled-components**, four themes, ~135 hand-authored 64 × 64 SVG icons,
  and a legend whose row **is** the layer's visibility toggle.

**Why it works — for Contour.** Both applications built the *same* missing
piece by hand, and neither built it well: a contract for styling map chrome
that the application does not own. GeoLibre's answer is 1 500 lines of
vendor-prefixed CSS. kepler.gl's answer is to theme nothing and let the
platform draw it. **Neither ships a bivariate legend.** Neither ships a
spatial token vocabulary — kepler conflates panel, side-panel and canvas
overlay into `panelBackground` / `sidePanelBg`.

That is Contour's opening, and it is a *host-layer* opening rather than a
component-list opening: the thing the niche is missing is not a button, it
is **the vocabulary and the re-keying contract for the chrome around a
map** — the control cluster, the legend, the scale bar, the attribution, the
coordinate readout, the layer panel. §6.14–§6.20 are proposals in that
direction.

---

## 4 · Priority issues

Ordered by impact. The first six are defects — things that are present and
wrong. The last four are absences: what the system does not have, which for
a design system is the more consequential kind of finding.

### 4.1 The published numbers are wrong, and the contradiction is visible on the homepage

**What.** The system claims **100 components** in the README, the `AGENTS.md`
header, `llms.txt` and the `<meta name="description">`. The guide's hero
says **99 components** and **264 tokens**. The truth is **83** distinct
`.c-*` blocks in `src/css/*.css` and **263 unique** custom properties in
`src/css/tokens.css` (296 declarations, 263 unique). Three numbers, one
truth, and the hero — the first thing anyone sees — disagrees with the
README.

**Why it matters.** For a design system, the numbers *are* the product
claim. A reader who counts the blocks and gets 83 has learned that this
project's documentation is approximate, and every other claim comes with a
discount. This is a credibility bug, and it is the cheapest one to fix.

**Fix.** Make the number computed, not written. `tools/build.mjs` already
parses `tokens.css`; it can count the unique `--` declarations and the
distinct `.c-*` block selectors and write both numbers into a JSON file that
the guide's hero and the README's prose read from. If the number cannot be
wrong, it does not have to be maintained. Until then: change all four
mentions to 83 components / 263 tokens, and change the hero's 264 to 263.

**Command.** `/normalize`

### 4.2 The accessibility contract is documented but not met for non-text contrast

**What.** The README states: "Body text meets 4.5:1, borders / focus rings /
control edges meet 3:1". The text half is true and audited (210 pairs per
theme, zero failures). The non-text half is false:

| Pair | Measured | Required |
|---|---|---|
| `.c-input` / `.c-select` / `.c-textarea` border vs. the panel behind | **1.58:1** (light), **1.56:1** (dark) | 3:1 |
| The same input's fill vs. the panel behind | **1.00:1** | — |
| `--color-border-strong` on `--color-canvas` | **2.4:1** (light), **2.9:1** (dark) | 3:1 |
| `--color-text-subtle` on `--color-surface-3` | **4.0:1** (light), **2.9:1** (dark) | 4.5:1 |

The input case is the sharp one: the field is the *same colour* as the panel
it sits on, and the only thing that identifies it is a 1.58:1 hairline. A
reader with low vision may not see the field at all until it is focused.
WCAG 1.4.11 (Non-text Contrast, AA) exists precisely for this.

**Why it matters.** Two reasons. First, honesty: a written contract that the
system does not meet is worse than a weaker true one, because a consumer who
audits against the README will file a bug against a correct implementation.
Second, quality: "depth is lightness, not shadow" is the right rule, but
lightness only separates *surfaces from surfaces*. A control that shares a
surface with its container needs an edge, and that edge has to be visible.

**Fix.** Two parts, both small:

1. Give the control edge its own token that clears 3:1 against every surface
   it can sit on — a `--color-control-edge` derived from `--color-border-strong`
   but pushed to the next step of the ramp in each theme. Use it for the
   resting border of inputs, selects, textareas, and the secondary/outline
   buttons. This is a *deliberate* trade: the hairline gets one step stronger
   and the "ink over chrome" character survives, because the edge is still a
   1 px line in a tinted neutral, not a dark outline.
2. Add a **non-text contrast pass to the audit**: for every interactive
   component, measure the border (or fill, where the border is decorative)
   against the surface it actually sits on. This is the check the current
   210-pair audit cannot perform, because it only looks at text.

**Command.** `/harden`

### 4.3 Nine components ship with no specimen, and one of them is a whole menu

**What.** `.c-menu`, `.c-tag` (with its `--primary` variant and
`__remove` control), `.c-expandable`, `.c-pressable`, `.c-reserved` and
`.c-scrim` appear in `src/css/` and appear **nowhere** in the guide or the
templates. The guide's own rule is explicit: "The guide is the specification.
A component that is not shown is not documented."

**The second pass found three more:** `.c-destructive-hint`,
`.c-row-action` and `.c-resize-handle` (`components-shell.css:507`, `:524`
and `:452`) are also unspecced — **nine in all**. The two first ones are
also the system's only class names with **no base block** (there is no
`.c-destructive` and no `.c-row`), which is why "the number of components"
is not a well-defined quantity (§4.1): they are single-hyphen compounds
where the BEM convention would expect `__`.

This is not a documentation nit — `.c-menu` is a *dropdown menu*: item
layout, hover, focus, a shortcut column, a separator, a group label, a
danger variant. It is **60 lines and nine rules** and it has never been
rendered by anyone.

**Why it matters.** Unrendered components are unmaintained components. A
`.c-menu` that has never been on screen has never been checked against a
focus ring, a disabled state, a long label, a 320 px viewport or a screen
reader. It is a liability that ships to consumers.

And the resize handle is the one with a live consequence: it is
`opacity: 0` until the panel is hovered, so on a touch device and to a
keyboard user it does not exist at all (§4.17).

**Fix.** Add specimens for all nine, in the sections they belong to: the menu
and the tag in Navigation, the expandable and the pressable in Actions, the
reserved space in Status, the scrim in Overlays, the destructive hint and
the row action in Feedback, the resize handle in Layout. Nine small
specimens; the tooling writes the snippets for you.

**Command.** `/extract` — the component layer is already extracted; this is
the documentation half.

### 4.4 The token export ships the wrong layer, in the wrong format

**What.** `dist/contour.tokens.json` is described in the README as "the
semantic token layer, for Figma or Style Dictionary. `light-dark()` values
are split into `{ light, dark }`". In fact:

- The file contains **141 entries — the primitives only.** Not one of the 72
  semantic tokens (`--color-primary`, `--color-canvas`, `--color-text`…) is
  in it. The code says why: `tokensToJson` matches the *first* `:root` block
  (`tools/build.mjs:63`) — and the primitives are the first block.
- **Zero** tokens are split into `{ light, dark }` — the splitting code at
  `tools/build.mjs:73-78` never fires, because the first block contains no
  `light-dark()` values.
- The format is a flat `{ "--token": "value" }` map. It is not DTCG, so
  Style Dictionary will not consume it as-is, and Figma's Tokens Studio will
  not import it as tokens.

The code comment is *also* wrong in the other direction: it says "The
semantic layer is the one a consumer overrides, so it is the one that is
worth exporting" — and then exports the layer nobody overrides.

**Why it matters.** The token file is the system's highest-leverage export.
It is how a design file and the code stay in sync, and it is how the system
reaches Figma, Style Dictionary, React Native, Flutter, iOS and Android. Right
now it ships the least useful half of the layer, in a format no tool reads.

**Fix.** Two changes, and the second one is the interesting one:

1. Export **both** layers, grouped, with the semantic layer resolved to its
   light and dark values. The primitives keep their ramp names; the semantic
   layer becomes the documented, overrideable surface.
2. **Adopt DTCG 2025.10.** The Design Tokens Community Group published the
   first stable version of the format on 28 October 2025, and it is supported
   by Figma, Penpot, Sketch, Tokens Studio, Style Dictionary and Terrazzo.
   The format is `$value` + `$type` objects with `{token.path}` aliases —
   and Contour's token graph is *already* an alias graph (`--color-primary:
   light-dark(var(--brand-600), var(--brand-400))`), so it maps almost
   one-to-one.
3. The light/dark split is not a special case in DTCG any more: the
   **Resolver** module (2025.10) exists for exactly this — a set of sources
   combined by a `light`/`dark` modifier. Contour's `light-dark()` model is
   a resolver with two sets. Emitting a `contour.resolver.json` next to the
   token file would be a first-class contribution, not a workaround.

**Command.** `/normalize`

### 4.5 The data layer is a frame, and the data layer is the product

**What.** The system ships a chart *frame*: a `.c-chart` with a grid, an axis
strip and slots for `path.c-chart__line` elements. The guide's specimen is
hand-written SVG — a `viewBox` of `0 0 300 120` with three hard-coded `d`
attributes. There is no scale, no tick generator, no axis formatter, no
series label, no tooltip, no legend interaction beyond a button, no
responsive redraw, and no way to plot a value that a human did not type by
hand.

**Why it matters.** Look at the stated audience: "GIS / data analysts using
a web dashboard — read-heavy, comparison-heavy, long sessions" and the use
case "Data views — isolines, catchments, routes, hex grids; tables, legends,
meters". This is the part of the system that the audience needs most, and it
is the part that is a picture of a chart rather than a chart. Everything
else in the system is a real, reusable component; the chart layer is the one
that stops at the frame.

**Fix.** Do not reach for a charting library — that would break the "zero
dependencies" claim and import somebody else's visual language. Instead,
ship the three things the frame is missing, in order of value:

1. **A scale.** A `--chart-domain`/`--chart-range` pair plus a linear scale
   helper is enough for the isoline, catchment and hex-grid cases the
   audience actually has. Log and time scales can wait.
2. **A tick generator.** The system already has a "mono means machine" rule
   and a 4 px spacing scale; a `1 / 2 / 5 × 10ⁿ` tick ladder is 20 lines
   and it would make every chart in the system read as the same instrument.
3. **A datum layer.** Point markers and a crosshair for hover, drawn from
   the same ring geometry as the waypoint mark (§6.2).

**Command.** `/overdrive` — this is the one place where the system is
allowed to be ambitious, because it is the part that earns the audience.

### 4.6 The guide is the documentation, and it is heavy

**What.** The guide is 465 kB of HTML with 87 generated snippets and 3 962
DOM nodes; 965 kB transferred with fonts, of which 456 kB is the document,
215 kB the stylesheets, 147 kB the web fonts and 114 kB images. A dashboard
consumer of the same system ships 189 kB of CSS and 131 kB of fonts.

**Why it matters.** The guide is the product for two of the four audiences
in `.impeccable.md` — a designer prototyping spatial tools and an engineer
mid-task. 456 kB of HTML is a parse cost before the first pixel of a
reference page, on the connection an engineer has at an office. The fonts
are ten files of IBM Plex at four, three and three weights; the guide
downloads all of them to render one page.

**Fix.** In order of return:

1. **The hero stat strip is the generic tell.** "TOKENS 264 / COMPONENTS 99
   / RUNTIME DEPS 0 / THEMES 2 + system" is the standard hero-metric
   layout the anti-pattern list names, and it is the first thing a visitor
   sees. Replace it with the system's own argument: the isoline field with a
   live readout (the instrument panel is already on the page, two hundred
   pixels to the right) is worth more than four numbers, and it is a thing
   nobody else would ship. Then make the numbers a footnote.
2. **Subset the fonts.** The guide downloads all ten cuts to render one page —
   IBM Plex Sans 400/500/600/700, Condensed 500/600/700, Mono 400/500/600
   (147 kB) — while the page itself uses four weights in total. A variable
   font, or a per-surface subset, cuts the font payload by more than half.
3. **Split the guide's HTML.** 456 kB is one document with 22 sections. A
   consumer who lands on `#forms` should not download the landing page, the
   recipes and the playground. Section-per-page would make the guide a real
   documentation site — which is also the honest way to prove the
   documentation surface works.

**Command.** `/optimize` for the payload, `/arrange` for the hero.

### 4.7 The system cannot draw a place

**What.** Contour is for spatial interfaces, and it ships no spatial marks.
There is no isoline fill, no catchment polygon, no route path, no hex grid,
no layer switcher, no scale bar, no coordinate input and no map slot — 83
components, none of which puts a *place* on screen. The only isolines in the
repository are the brand mark and the guide's artwork.

`.impeccable.md` names the two use cases the system exists for: "Interactive
map tools — side panels, floating controls, parameter sliders, legends, chip
readouts, **layer switchers**" and "Data views — **isolines, catchments,
routes, hex grids**; tables, legends, meters". The system covers the tables,
legends and meters. It covers none of the spatial half. The layer switcher
does not exist as a component; `.c-time-range` is a static label, not a
picker.

**Why it matters.** A consumer building the product this system was designed
for has to hand-roll every mark that carries data. That is precisely where
a product's visual language drifts away from its design system — the marks
are the part of the interface that is *most* visible and *least* specified.
The system will therefore be adopted for its buttons, its tables and its
tokens, and abandoned at the map. The isoline stays a texture in the guide.

**Fix.** Do not build a map engine — that is the consumer's job, and it
would break the zero-dependency claim. Build the **mark layer** instead: the
system owns how a mark *looks*, the consumer's data pipeline owns the
geometry.

1. **Four marks, tokenised.** An isoline band fill (a stroke that steps
   through the chart ramp, so a band reads as a value), a catchment fill (the
   same ramp at low opacity, with a hairline edge), a route (a line with the
   system dash patterns ✗ hmm — a route should be solid, and the *legend*
   carries the pattern ✓), and a hex/point cell. All four are CSS + SVG with
   tokens ✓ — no geometry, no data.
2. **A layer switcher.** The canonical map control, and the one use case the
   context names explicitly. A list of toggles with a swatch, a count and a
   keyboard path — and the *only* component in the system that would need a
   "visible at a glance" treatment beyond a checkbox ✓.
3. **A scale bar and a coordinate readout.** The system already has
   `.c-readout` ✓; a scale bar is the same idea in a different unit ✓.
4. **A `.c-map-slot`** — a container that owns a map's *chrome* (zoom
   cluster, attribution, scale, coordinates) and leaves the canvas to the
   consumer. This is the pattern that lets a design system be opinionated
   about map UI without shipping a map.

**Command.** `/overdrive`

### 4.8 One disabled state and no busy state, across every component

**What.** `.c-btn` is the only component in the system with a disabled
treatment (`src/css/components.css:190-191`). Inputs, selects, tabs, table
rows, cards, chips, filter pills, tree items, the switch and the checkbox
have none. There is no `aria-busy` handling anywhere in `src/css/`, and the
empty state exists as a standalone component (`.c-empty`) that is never
rendered *as the state of* a table, a chart, a panel or a KPI tile.

**Why it matters.** A dashboard's normal condition is "the data has not
arrived". Right now that state can only be expressed by dropping a
`.c-skeleton` next to the component, which is a different component, and the
state contract of each component is undefined. The same is true of "this row
cannot be edited" and "this filter cannot be removed". A component library
without a *state contract* drifts: one team adds a disabled style to a
filter pill, another does not, and the product ends up with three different
disabled greys.

**Fix.** Two things, both cheap:

1. A **state contract**, stated once and enforced by the guide: every
   component that can be async renders three states — busy (the same shape,
   filled with a skeleton, marked `aria-busy="true"`), empty (`.c-empty`
   in context, with a next action), and error (`.c-alert` in context, with
   a retry). Every interactive component renders a disabled state with a
   consistent treatment — opacity, cursor and a `not-allowed` cursor, not a
   colour change.
2. Ship it as **one utility plus three modifiers** (`.is-busy`,
   `.is-empty`, `.is-disabled`) rather than a variant per component, so a
   new component inherits the contract for free ✓.

**Command.** `/normalize`

### 4.9 Print is promised by the token layer and absent from the system

**What.** The chart dash tokens' own comment says the patterns keep a chart
"readable in greyscale, **in print**, and for a reader who cannot separate
the hues" (`src/css/tokens.css:413-417`). There is no `@media print` rule
anywhere in `src/css/`. Forced-colors coverage is four components —
`.u-bordered`, `.c-card`, `.c-chip`, `.c-pill` (`src/css/utilities.css:243`)
— leaving tables, charts, buttons, inputs, badges, alerts and every chart
mark to collapse. There is no `prefers-contrast: more` pass.

**Why it matters.** Three real scenarios the system claims to serve: an
analyst prints a shift report; a team projects a dashboard; a Windows user
runs in forced colours. In each case the parts of the system that carry data
lose their encoding, while the parts that carry chrome keep theirs — which
is the wrong way round. The greyscale-print rule for charts is a *design*
decision that is not implemented anywhere.

**Fix.** A print stylesheet is also an original opportunity rather than a
chore — see §6.7. Alongside it: forced-colors rules per component *family*
(the table's row rules, the chart's series strokes, the input's border), and a
`prefers-contrast: more` pass that strengthens `--color-border` one step and
drops the transparent fills.

**Command.** `/adapt`

### 4.10 The test suite is not in the repository

**What.** Every audit that proves this system works lives in
`/tmp/kilo/audit/` — outside the repository, and `.gitignore` says so in as
many words ("The audit harnesses live outside the repository"). There is no
CI, no `LICENSE` file (the README says MIT), no `CHANGELOG`, no
`package.json` — so a consumer cannot version-pin the system — and no
deprecation policy, although the guide's version picker says v1.0.

**Why it matters.** The thesis of the project is "the style guide is the
documentation *and the test suite*". The test suite is the half that
vanishes: a contributor clones the repository and gets no way to check that
their change did not break the contrast matrix, the target sizes, the snippet
idempotency or the token export. And this repository already contains the
evidence of what that costs — the snippet tool escaped the Google Fonts URL
one level per run for several iterations before anyone noticed, and the token
export shipped the wrong half of the token layer (§4.4). Both are exactly
what a committed harness catches on the first run.

**Fix.** Move the harnesses into `tools/audit/` with their own dev
`package.json` (puppeteer is a dev dependency, not a runtime one ✓), and add
a CI workflow that runs: the contrast matrix, the target-size pass, the
non-text edge pass, the snippet idempotency check, `html-validate`, and a
check that the token export contains the semantic layer ✓. Add `LICENSE`,
`CHANGELOG`, and a one-paragraph deprecation policy in `AGENTS.md` ✓.

**Command.** `/harden`

### 4.11 The migration ledger: what libreship gives up, renames or keeps

**What.** If libreship adopts Contour, the coverage matrix is not a shopping
list for Contour — it is a ledger for libreship. For each `--ls-*` concept:
**rename** (maps onto an existing Contour token), **add** (a real gap that
other consumers need too), or **keep** (libreship-specific, stays as a thin
alias layer). Contour should only grow where the gap is genuine and shared;
it should not absorb twenty ad-hoc concepts just to keep a widget compiling.

| What `@libreship/styles` provides | Migration verdict |
|---|---|
| 82 tokens | ~58 **rename** (map by role); ~24 **keep** as libreship aliases unless a second consumer needs them — only then **add** to Contour |
| 17 host-primitive families | 14 **rename** (`.ls-btn`→`.c-btn` …); 3 **add** (radio, radio list, flag — generic components Contour genuinely lacks) |
| 6 themes | 2 in Contour today; libreship **keeps** its extra four as a theme set on top, or migrates to Contour's theme mechanism (§6.12) |
| 3 density steps | libreship **keeps** its density scale; Contour's single density is a gap worth filling (§4.12) |
| 4 target kinds, 44 px for controls | libreship **keeps** its kind model; Contour's single floor is a gap worth filling (§4.12) |
| A `::part()` layer with 84 exposed parts | **keep** in libreship — Contour is plain CSS with no shadow DOM, so parts are not its concern |
| 13 gate scripts | **add** to Contour (§4.10) — these are universal, not libreship-specific |
| A 47-page documentation surface | libreship **keeps** its own docs; Contour's guide is a different artefact |

**The twenty token concepts that have no home.** These are *libreship's*
concepts, and most of them should stay libreship's: a **widget frame**
(seven concepts) ✗, a **control size** ✗, a **focus width** ✗, a
**selection colour** ✗, a **plot inset** ✗, an **option height** and a **row
height** ✗, a **tooltip pair** ✗, a **spinner duration** and a **pulse
duration** ✗, an **exit easing** ✗, a **border hover** ✗. Two are
near-equivalents a naming decision could absorb ✓; the other eighteen are
new concepts ✗. The right call is not to pour all eighteen into Contour ✗ —
that would make Contour a mirror of libreship's internals ✗. Contour already
has the *idea* of a frame in `.c-panel` ✗; it just does not have it as
tokens ✗. Add to Contour only the ones a second consumer would need ✗
(focus width, selection colour, exit easing are the plausible candidates ✓);
the rest stay as libreship aliases ✓.

**The three missing families.** A **standalone radio**, a **radio list**, and
a **flag** — these are generic components Contour genuinely lacks ✗, and
they are the one part of the matrix that is a real addition rather than a
rename ✓.

**Why it matters.** The claim being made is adoption, not replacement of
vocabulary ✗ — so the matrix should be read as a migration ledger, not a
shopping list ✗. Three consequences follow:

1. **There is no alias layer to hide behind, and that is fine.** The
   widgets' internals read `--ls-*` custom properties ✗; on migration those
   names change to Contour's ✗ (fine — the family is not released ✓) or
   libreship ships a thin alias sheet ✗ (acceptable, because it is
   libreship's own artefact, not Contour's ✓). The first thing to do is
   rename the widgets' internals ✓.
2. **The widgets are shadow DOM, so the tokens must *inherit* into
   them** ✓ — which they do, because custom properties inherit through
   shadow boundaries ✓ ✓. The only channel a host has for the widgets'
   insides is `::part()` ✗, and that is libreship's concern, not
   Contour's ✓ (Contour is plain CSS with no shadow DOM ✗). The incident
   it records — a `min-width: 0` rule quietly turning a 44 px histogram bar
   into 28 px ✓, caught only by the target gate ✓ — is a reason for
   libreship to keep its parts gate, not for Contour to grow one ✗.
3. **The universal gates should run against Contour** ✓ — targets ✓,
   focus-ring ✓, control-borders ✓ are exactly the checks §4.2 and §5.4 say
   Contour is missing ✓. The libreship-specific gates (widget-tokens,
   part-rules, part-conflicts) stay in libreship ✓.

**Fix.** In order:

1. **Add the composable-surface token group** — the frame, the control
   size, the focus width, the selection colour, the row and option heights,
   the plot inset, the tooltip pair, and the two durations ✓. This is the
   single most concrete piece of work, and it makes the system better for
   every consumer ✗ hmm — *better* ✓, not only for this one ✓.
2. **Add the three families** — a radio, a radio list, and a flag ✓ — and
   publish the **rename table** for the thirteen that already exist ✓
   (`.ls-btn` → `.c-btn` ✓ …), because a migration guide is part of the
   deliverable ✓.
3. **Publish the parts contract** — the vocabulary a host may style inside
   a component, and the rule that a `::part()` declaration *replaces* the
   component's own ✓, so only properties the component leaves alone may be
   set ✓.
4. **Port the gates** (§4.10 ✓).

**Command.** `/normalize`

### 4.12 Contour's contracts assume one theme, one target size and one density

**What.** Three of Contour's models are single-valued where the products
that use them are not:

| | Contour | The spatial product family |
|---|---|---|
| Themes | **two** (`light-dark()`) | **three** — light, dark, positron |
| Pointer targets | **one** floor (24 px) | **three kinds** — control 44, list option 24, chart control 24, and a data mark is *not* a target at all |
| Density | **one** number changes one padding | **three** steps, and the *type scale* moves with the spacing |
| Control size | fixed per variant (2.5 rem / 2 rem) | a `--ls-control-size` token |

**Why it matters.** Each of these is a place where a consumer has to work
around the system rather than use it.

- **Two themes.** `light-dark()` is a two-valued switch ✓ — and Contour's own
  design context promises a third ("a *Daylight* theme exists for daylight
  desks and printed charts" ✗ — a theme Contour's model cannot express ✗).
  A third theme needs a different mechanism, and the system has none ✗.
- **One target floor.** 24 px is the WCAG minimum ✓ — but a control a
  finger presses wants 44 ✓, and a legend row does not ✗ (at 44 px a
  thirteen-category list is 877 px tall ✗ — taller than the histogram it
  explains ✗). One global floor cannot be right for both ✗; the useful
  model is a *kind* ✓.
- **One density.** Contour's density changes padding ✗; the working model
  moves the type scale with it ✗ (a compact table is a different rhythm, not
  a smaller font ✗ — which is what Contour's own README claims ✗ and its
  tokens do not do ✗).

**Fix.** Three generalisations:

1. **A theme *set*, not a switch.** Keep `light-dark()` for the two system
   themes ✓ and add a layer that can override the semantic tokens for a
   third (or fourth) ✗ — a `[data-theme]` block that re-points the semantic
   layer ✓ — and document how the two compose ✓. The spatial family needs
   three: light, dark, and a third "positron" for daylight desks and
   printed charts ✓ — a theme Contour's own design context already promises
   ✗ and cannot express ✗.
2. **Target sizes by kind.** A `--target-control` (44), a `--target-option`
   (24) and a `--target-mark` (none ✗) ✗, with the guide's audit checking
   each kind against its own floor ✗ (§5.4 ✗). A map is full of marks ✗ —
   a rule that every mark must be 24 px would make the map unusable ✗.
3. **Density that moves type.** Let the density scale set the type scale as
   well as the spacing ✓ — Contour's `--density` is already a multiplier ✓;
   it just is not connected to the type tokens ✗.

**One consequence worth stating.** If Contour replaces the layer, Contour's
token *names* become the family's token names ✓ — which makes the DTCG
export (§4.4 ✗) the family's canonical token file ✓ rather than a nice-to-have
✗, and makes the alias mechanism load-bearing ✓: the family's widgets read
`--color-surface-1` ✓ and the design file reads the same ✓, and the two
cannot drift ✓ because they are the same file ✓.

**Command.** `/adapt`

### 4.13 Twenty-one per cent of the token layer is never read

**What.** A census of every `var(--…)` reference in `src/css/*.css`,
`index.html` and `templates/*.html` finds **55 of the 263 declared custom
properties are read by nothing**. They are not "used rarely" — they are
referenced zero times, outside their own declaration.

The dead set is not random; it is exactly the parts of the system that
promise data:

| Group | Dead | Notes |
|---|---|---|
| Sequential chart ramp | **7 of 7** — `--chart-seq-1…7` | Correct, monotonic, dark-inverted (§3.5). Used by nothing. |
| Diverging ramp | **3 of 3** — `--chart-div-neg/mid/pos` | A real midpoint, a CVD-safe hue pair. Used by nothing. |
| Categorical series | **4 of 8** — `--chart-5…8` | Series 1–4 are used by the guide's SVG; 5–8 are not. |
| Chart chrome | **4** — `--chart-hover`, `--chart-missing`, `--chart-tooltip-bg`, `--chart-tooltip-fg` | A tooltip pair the chart frame has no tooltip for. |
| Basalt neutrals | **7 of 12** — `--basalt-100…700` | The ramp is 12 steps; only 5 are read. |
| Semantic colours | **7** — `--color-on-data`, `--color-on-info`, `--color-on-success`, `--color-on-warning`, `--color-primary-soft-hover`, `--color-surface-inset`, `--color-text-inverse`, `--color-border-inverse` | The `--color-on-*` set is the "text on a filled surface" set, and four of its five members are unused. |
| Shape | **2** — `--shadow-focus`, `--shadow-inset` | The focus *ring* is drawn with `outline`, so the focus *shadow* token is dead. |
| Motion | **3** — `--dur-instant`, `--dur-deliberate`, `--dur-ambient`, `--ease-entrance` | Four of the six durations and one of the four easings are unread. |
| Layout | **6** — `--space-0`, `--space-3xs`, `--space-4xl`, `--space-inline`, `--container-lg`, `--z-base` | Plus `--z-modal`, `--z-raised`, `--z-scrim`, `--z-sticky`, `--z-toast` — **six of the nine `--z-*` tokens**. Components use raw `z-index: 1 / 2 / 3 / 20` instead. |
| Density | **2 of 5** — `--density-cell`, `--density-gap` | `--density-row` and `--density-cell` are also *the same formula* (§5.2). |
| Brand | **1** — `--brand-100` | Also declared three times (§5.3). |

**Why it matters — three ways, in order of weight.**

1. **It is the same gap as §4.7, one layer in.** §4.7 finds that the system
   cannot draw a place. §4.13 finds that the tokens that would let it draw
   *data* — a sequential ramp for an isoline band, a diverging ramp for a
   catchment above/below target, a tooltip pair for a hover readout — are
   already written, already named, already dark-mode-correct, and already
   disconnected. The work for the spatial layer is smaller than it looks,
   and the *risk* is that someone writes it against the wrong tokens.
2. **It makes the token count a lie in the other direction.** §4.1 argues
   that 83 components is the truth. By the same standard the truth is
   **208 live tokens**, not 263. The README's "263 design tokens" is
   measuring a *declaration count*, not a *contract*. A token that nothing
   reads is not a token; it is a wish.
3. **It is the cheapest credibility win in the whole plan.** Deleting the
   dead tokens, or wiring the eleven that should be wired, is a diff of
   maybe 40 lines and it removes 21 % of the surface area that a reviewer,
   a linter, or a consumer auditing the file has to evaluate.

**Fix — two different moves for two different sets, and the distinction
matters.**

- **Wire (11 tokens):** `--chart-seq-1…7`, `--chart-div-*`,
  `--chart-tooltip-bg/fg`, `--chart-hover`, `--chart-missing`. These have
  a consumer waiting: the chart frame (§4.5) and the spatial marks
  (§4.7). They should not be deleted — they are *right*, and the
  isoline band needs a sequential ramp that is already built.
- **Delete or document (44 tokens):** the seven unused Basalt steps, four
  of the `--color-on-*` set, `--shadow-focus`, `--shadow-inset`, three
  durations, one easing, five space steps, six `--z-*` tokens,
  `--density-cell`, `--density-gap`, `--brand-100`. Either they are
  reservations for components that do not exist yet, in which case they
  belong in a `reserved` namespace with a comment, or they are dead and
  they should go. A token that is reserved *and* declared as a live
  primitive is the worst of both.

**And add the gate that would have caught it.** A token census is a
twenty-line script: parse `tokens.css` for declarations, parse every other
file for `var(--…)`, and fail the build on any declaration with zero
readers. It belongs in `tools/audit/` next to the contrast matrix (§4.10).
Every design system on earth has this check. Contour's whole thesis is
that its token layer is the product, and it is the one project I looked at
that does not check it.

**Command.** `/normalize`

### 4.14 The theme scope resets the system's own two knobs, and the heat scale is not a sequential ramp

**Two defects in the same file, one of them in the override contract the
README headlines.**

**A. `.c-theme-scope` breaks the documented override.** The README says:

> **Two knobs retheme and reshape everything:**
> `:root { --brand-hue: 182.5; --radius-scale: 1; }`

and `.c-theme-scope` is offered as the way to re-tint a subtree. Measured in
a browser, with `:root { --brand-hue: 250; --radius-scale: 0.5 }`:

| | `--brand-hue` | `--radius-scale` |
|---|---|---|
| outside any scope | **250** ✓ | **0.5** ✓ |
| inside `.c-theme-scope` | **182.5** ✗ | **1** ✗ |
| inside `.c-theme-scope` with an inline `--brand-hue: 300` | 300 ✓ | **1** ✗ |

`tokens.css:496` and `tokens.css:506` re-declare `--brand-hue: 182.5` and
`--radius-scale: 1` *on the scope class itself*. Because a custom property
is resolved where it is declared and then inherits that finished value, the
scope wins over the root — so **the root override never reaches a scope**,
and the scope silently resets both knobs.

This is the exact trap `AGENTS.md` rule 3 documents ("`var()` inside a
custom property resolves eagerly"), diagnosed correctly and then walked into
one level down. The scope mechanism is right; the *scope's own defaults* are
wrong: they should be `inherit`-shaped, not literal.

The fix is two lines and it changes the semantics in the right direction:
the scope should declare the *derived* values but take the knobs from
wherever they resolve, e.g. by moving the knob declarations into a separate
`.c-theme-scope` rule that uses `var(--brand-hue, 182.5)` — or, more
honestly, by removing the literals from the scope and letting the scope
re-declare only the derived ramp from the *inherited* knob.

**Why it matters for the migration.** `libreship` needs subtree theming —
its widgets are shadow DOM, it has six themes, and it has a per-subtree
derived-token pattern already (`packages/styles/src/tokens/index.css:251`).
Contour's `.c-theme-scope` is the obvious candidate. If a consumer sets
`--brand-hue` on `:root` and then wraps a panel in a scope, the panel
snaps back to teal. For a system whose headline feature is "one number
re-tints everything", that is a first-hour bug.

**B. `--color-scale-1…6` is labelled "sequential" and is not.** The comment
at `tokens.css:371` reads:

> `/* -- Chart / heat scale (sequential, for isolines & density) ------ */`

Measured relative luminance, light theme:

| step | value | luminance | vs. previous step |
|---|---|---|---|
| `--color-scale-1` | `oklch(0.71 0.13 236)` | 0.367 | — |
| `--color-scale-2` | `oklch(0.78 0.11 236)` | 0.483 | **1.28:1** |
| `--color-scale-3` | `oklch(0.78 0.11 182.5)` | 0.498 | **1.03:1** |
| `--color-scale-4` | `oklch(0.704 0.123 182.5)` | 0.372 | **1.30:1** |
| `--color-scale-5` | `oklch(0.77 0.145 75)` | 0.445 | **1.17:1** |
| `--color-scale-6` | `oklch(0.6236 0.2534 358.92)` | 0.205 | **1.94:1** |

It is **not monotonic in lightness** — it goes up, up, down, up, down — and
it crosses three hue families (azure → teal → amber → magenta). Every
adjacent pair is below 3:1, and two pairs are at 1.03 and 1.17 — effectively
identical. The dark theme is the same shape inverted.

A *sequential* ramp must be monotonic in lightness; that is the definition.
What `--color-scale-*` actually is, is a **multi-hue "heat" ramp** — which
is a legitimate thing to have, and is what `--gradient-heat` uses it for.
The bug is that the token is named and commented as sequential, and the
system's own README sells `--chart-seq-*` as the sequential ramp while
`--gradient-heat` — the one place the scale is consumed — uses the
*unsequential* one.

**The fix is a rename and a comment, not a redesign:** call the scale what
it is (`--color-heat-1…6`, "multi-hue heat ramp, for density and
continuous surfaces — **not** for ordered bands"), and point every ordered
use — isoline bands, choropleth classes, a legend — at `--chart-seq-*`,
which is already correct (§3.5). For an isoline band, a reader must be able
to tell which side is higher; the current scale cannot tell them that.

**Command.** `/normalize`

### 4.15 The focus indicator measures 1.15:1 and is the *only* indicator on three controls

**What.** The system has two focus tokens. `--color-focus-ring` is the good
one: **3.55:1** against `--color-surface-1` in light, **9.96:1** in dark,
and it is what the global `:focus-visible` rule uses.

`--color-focus-halo` is the other one, and it is a soft decorative glow:

```
light: oklch(0.94 0.05 182.5 / 0.9)
dark:  oklch(0.78 0.12 182.5 / 0.24)
```

| pair | light | dark |
|---|---|---|
| `--color-focus-halo` vs `--color-surface-1` | **1.15:1** | **1.63:1** |
| `--color-focus-halo` vs `--color-canvas` | **1.10:1** | **1.56:1** |
| `--color-focus-halo` vs `--color-surface-2` | **1.05:1** | — |

**And the halo is the *only* focus indicator on three of the system's
controls.** `src/css/components.css:1362` (switch) and `:1425` (checkbox)
both read:

```css
.c-switch__input:focus-visible,
.c-check__input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-focus-halo);
}
```

and the range thumb does the same at `:1300`. `outline: none` removes the
platform's indicator and replaces it with a 3 px ring at 1.15:1.

**Why it matters.** WCAG 1.4.11 (Non-text Contrast, AA) requires 3:1 for
the visual indicator of focus; 2.4.13 (Focus Appearance, AAA) requires a
2 px perimeter at 3:1 against adjacent colours. A checkbox and a switch are
the two controls a keyboard user meets most often after links and buttons,
and on both of them **focus is, for practical purposes, invisible**. The
system's own README claims "focus rings … meet 3:1"; that claim is true of
the ring token and false of the halo, and only the halo is used where it
matters.

**Fix.** Three options, in order of preference:

1. **Use the ring, not the halo.** `outline: 2px solid var(--color-focus-ring);
   outline-offset: 2px;` on the checkbox and switch, exactly as the global
   rule does. The halo can stay as a *secondary* glow layered behind it —
   that is what it is for.
2. If the halo must be the indicator, it has to clear 3:1 against every
   surface it lands on, which means abandoning the alpha and using a solid
   step of the brand ramp.
3. Add `--focus-width` (which the family already has: `--ls-focus-width: 2px`)
   and make the ring a two-token construct — `--color-focus-ring` +
   `--color-focus-width` — so the indicator is one decision, not two.

This is the same finding as §4.2 (control edges) wearing different clothes:
**the system's contract is written about tokens, and the tokens are fine,
but the places the tokens are not used are where the contract fails.**

**Command.** `/harden`

### 4.16 The command palette's combobox is silent, and every option is a tab stop

**What.** The palette is the system's most designed interaction and the
first pass praised it. Its ARIA is incomplete in two specific ways.

The markup is right: the input is `role="combobox"` with `aria-expanded` and
`aria-controls`, the list is `role="listbox"` with a label, the options are
`role="option"`. But:

1. **`aria-activedescendant` is never set.** `src/js/ds.js:601-607` moves
   the "active" option by setting `aria-selected` on each option and calling
   `scrollIntoView`. Nothing ever points the combobox at the active option.
   The ARIA combobox pattern requires `aria-activedescendant` on the
   combobox for a screen reader to announce the current option while the
   focus stays in the text field. **Measured: `aria-activedescendant` is
   absent before and after opening the palette.** A screen-reader user who
   arrows through the results hears nothing.
2. **All thirty options are in the tab order.** The options are
   `<button role="option">` and the code never sets `tabindex="-1"`.
   **Measured: 30 of 30 options have `tabIndex >= 0`.** Inside a popover
   with a combobox, that means Tab walks through every result before
   leaving — the opposite of what a combobox should do.
3. `aria-expanded="true"` is hard-coded in the HTML and never updated by the
   script, so the attribute is wrong the moment the palette is closed.

**Why it matters.** The palette is the feature most likely to be reached
for by keyboard, because the system is keyboard-driven by design (the `/`
shortcut, the `⌘K` shortcut, roving tabindex everywhere else). It is also
the one place where the ARIA is load-bearing: a listbox of thirty buttons
that the screen reader cannot follow is worse than a plain text input,
because the user has been told a rich interaction exists.

**Fix.** Three lines in `src/js/ds.js`:

- in `setActive()`, set `field.setAttribute("aria-activedescendant", el.id)`
  and give every rendered option an `id`;
- in the item template, add `tabindex="-1"`;
- in `open()` / `close()`, set `aria-expanded` to `"true"` / `"false"`.

And then add the missing `id` to the item template — it currently has
`data-index` but no `id`, which is why `aria-activedescendant` was never
possible without a change to the template.

**One more thing, in the same function.** `src/js/ds.js:723-729` binds
`⌘K`/`Ctrl+K` unconditionally and calls `event.preventDefault()` **before**
checking whether the reader is typing. On macOS, `⌘K` in a text field is
"delete to end of line"; the palette steals it. The `/` shortcut two
paragraphs below *does* check `isTyping(event.target)`. The `⌘K` handler
should check it too.

**Command.** `/harden`

### 4.17 Drag-only affordances with no keyboard path

**What.** Two of the system's affordances are drag-only, and both are
pointer-only.

| | What | Measured |
|---|---|---|
| `.c-drag-handle` | the six-dot drag signifier | **14.4 × 19.4 px**, a `<span>`, `aria-hidden="true"`, no `tabindex`, no `role`, no `aria-label` |
| `.c-resize-handle` | the panel resize grip | `opacity: 0`, visible only on `.c-panel:hover`; a `<div>`, no `tabindex`, no `role`, no `aria-label`, `cursor: col-resize` |

The drag handle being `aria-hidden="true"` is the sharp end: the system
*actively hides* the only signal that a row can be dragged from assistive
technology, and there is no alternative gesture. The resize handle is
invisible until the panel is hovered, so on a touch device it is not
discoverable at all, and to a keyboard user it never appears — the
`:hover` that reveals it is not a thing a keyboard can do.

**Why it matters.** WCAG 2.5.7 (Dragging Movements, **AA**, new in WCAG 2.2)
requires a single-pointer alternative for any drag operation. WCAG 2.5.8
(Target Size, **AA**) requires 24 × 24 px; the drag handle is 14.4 px wide.
The first pass asked whether the system offers a keyboard alternative to
its drag affordances (§7.1). **It does not.** The answer is no.

This is also a violation of the system's own first principle. "Affordable
means obvious — a control looks like what it does, and says so before you
touch it" is a promise made to *the reader*, and a drag handle that is
`aria-hidden` and 14 px wide makes no promise to half its audience. The
same principle says "nothing hides its hit area"; the resize handle hides
its entire affordance.

**Fix.**

- The **drag handle** needs a keyboard path: either the handle itself
  becomes a `<button>` with `aria-label="Reorder"` and arrow-key handling,
  or (simpler and better) the row gains a "Move up / Move down" pair that
  appears on focus. Either way the handle needs a 24 × 24 hit area — the
  six-dot glyph can stay 14 px if the hit area is a padded, focusable
  button around it.
- The **resize handle** needs to be visible on `:focus-within` as well as
  `:hover`, and it needs to be a `<button>` with `aria-label="Resize panel"`
  and an arrow-key fallback that nudges the width. A draggable separator
  with `role="separator"` and `aria-valuenow` is the platform-idiomatic
  form.

**Command.** `/adapt`

### 4.18 The runtime layer ships an API of zero, and the install path is a waterfall

**Two adoption facts that the README does not mention.**

**A. `src/js/ds.js` has no public API.** Everything is inside one IIFE:
`showToast`, `applyScheme`, `goTo`, `buildIndex`. A consumer who wants a
toast, a theme setter, or a "scroll to this section" helper — the three
things every dashboard needs — has to reimplement them. The system's only
feedback component is unreachable by the people it ships for, and the
README calls the file "optional progressive enhancement" without saying
that "optional" also means "closed".

This matters more for Contour than for a typical system, because the
intended consumer is a *family* of products: the whole point of a host
layer is that the widgets above it share one behaviour layer. The cheapest
possible expression of that is a small, documented, namespaced surface:
`window.Contour = { toast, setScheme, copy, scrollTo }`. Four functions, a
`Contour` namespace, a version. It costs about forty lines and it turns the
script from a page enhancer into a *platform*.

**B. The headline install path is nine chained requests.** The README's
first instruction is:

```html
<link rel="stylesheet" href="src/css/ds.css" />
```

and `src/css/ds.css` is nine `@import url(...)` statements. A browser
cannot discover the second stylesheet until the first has arrived and been
parsed, so this is a **nine-deep request waterfall** — nine round trips on
the critical path for the first paint, on a cold cache, on the connection an
engineer has at an office. `dist/contour.css` solves it (one 168 kB file),
but `dist/` is gitignored and the README points at `src/`.

The fix is one sentence in the README: *for production, use `dist/contour.css`
or inline the layers with your bundler; `ds.css` is the development entry
point.* Or, better, publish `dist/` rather than gitignoring it (§4.10,
T-21).

**And a trap in the same section.** The README says:

> The component layer is split by audience, so a product that needs one
> surface takes one file.

Taken literally, a consumer takes `components-data.css` — and gets **no
tokens, no reset, no typography, no focus ring and no `:root` colour
scheme**, because the reset lives in `@layer base` inside `base.css` and the
tokens live in `tokens.css`. The recipe is correct as printed (the import
list above it includes every layer) but the sentence under it invites exactly
the wrong conclusion, and the failure mode is catastrophic and silent.

Also worth noting: `ds.css` declares `@layer reset, tokens, base, components,
utilities;` — but there is **no `reset` layer**; the reset is inside
`@layer base` in `base.css`. A consumer following the README's inline-import
recipe gets a *different* layer order from one who links `ds.css`. Harmless
today, divergent tomorrow.

**Command.** `/harden`

### 4.19 The form-field contract is not a contract, and a component owns its heading level

**What.** `.c-field__label` is used **nine times as a `<label for>`** and
**four times as a `<span>`** in the guide. The `<span>` version breaks the
association:

```html
<span class="c-field__label">Field of view</span>
<input class="c-range" id="f-fov" type="range" min="30" max="360" … />
```

There is a visible label and no accessible name. Three range inputs in the
guide have this defect ("Pull strength", "Grid resolution", "Field of
view"); the last two have no `id` at all, so there is nothing to associate
even in principle.

**Why it matters.** The system states the rule — `AGENTS.md`: *"Every control
has an accessible name"* — and the component that exists to carry the label
does not enforce it. The label element is a *choice the author makes*, and
the system offers a class that works either way. A design system's job here
is to make the wrong thing impossible; today it is one tag away.

The fix is small and it belongs in the component: either make `.c-field__label`
a `<label>` in every case (it cannot be, for a fieldset legend) or ship a
`.c-field` that owns the association — a wrapper with `data-field-for`, or
simply a documented rule in `AGENTS.md` that the label is a `<label>` unless
the field is grouped, plus a guide-side check.

**The same class of defect, in headings.** `index.html:7295` renders
`<h5 class="c-panel__title">Routes by engine</h5>` directly under an `<h3>`
section — a **level jump from h3 to h5**, which breaks the document outline
that `AGENTS.md` requires ("headings in order") and that the guide's own
single-`h1`, single-`main`, zero-duplicate-id hygiene otherwise gets right.
The cause is structural, not accidental: **the component hard-codes the
heading level.** A panel cannot be used at h4 or h6 without the markup
lying. Every other component in the system that renders a heading (the
section head, the card title, the sheet title) has the same property.

This is worth fixing at the system level rather than the markup level: a
component should not own document semantics. The options are a `data-level`
attribute the author sets, or components that ship the heading *element* as
a choice (`.c-panel__title` applied to an `<h2>` / `<h3>` / `<h4>` the author
chooses) — the second is the better answer, because it keeps the type scale
in CSS and the outline in the author's hands.

**Command.** `/harden`

### 4.20 The browser-support table makes a claim that is false today

**A. "Baseline widely available features only" is false for the one feature
the system cannot work without.** `README.md:297`:

> Baseline widely available features only, with progressive enhancement where noted.

and the first row of the table is `light-dark()`.

`light-dark()` is **Baseline *Newly available* since 2024-05-13** and is
**expected to become widely available on 2026-11-13** — three weeks from
the date of this review. It is the single most load-bearing feature in the
system: every one of the 72 semantic colour tokens is a `light-dark()`
call, and the theme model is *only* `light-dark()`. A browser without it
renders the page with no colours at all.

The honest statement is: *Baseline newly available since May 2024; widely
available from November 2026.* The date should be in the table, because it
is a headline fact for a system whose entire theming model rests on one
CSS function, and because it is about to change.

**And a forward-looking warning, for the same table.**
`light-dark()` for *image* values (gradients, `url()`) is a *separate*
feature, newly available only since **2026-09-14** and not expected to be
widely available until **2029-03-14**. Contour's `--gradient-*` tokens are
static gradients that adapt only because they mix *token* colours — which is
the right technique and should stay. But the day someone writes
`light-dark(gradient-a, gradient-b)`, they have opted into a feature with a
three-year support tail. The README's browser table should say so, because
that is exactly the kind of thing a consumer will otherwise discover in
production.

**B. The token taxonomy table reconciles — and that is worth saying, because
the second pass first said it did not.** This review initially reported the
README's eleven-group table as summing to 254 against a headline of 263, and
as miscounting Typography by two. **That was wrong**, and the census in
§11 row 58 says so: re-counting the declarations group by group gives
53 + 72 + 32 + 29 + 22 + 17 + 10 + 9 + 9 + 5 + 4 + 1 = **263**, every row
correct, `--hairline` a genuinely separate group from "Shape" (which is
eight radii, two border widths and seven shadows). The review's own method
demanded the number be reproducible, so the number was re-measured, and the
measurement corrected the finding. It is recorded here rather than deleted,
because a review that quietly drops its own errors is a review you cannot
trust on the errors it kept.

**What survives from the original claim is smaller and sharper.** The
"Semantic colours | 72 | `--color-…`, `--text-…`, `--bg-…`" row names
**two token prefixes that do not exist** — there is no `--text-*` token and
no `--bg-*` token in the repository; the real names are `--color-text-*` and
`--color-surface-*`. That is a one-line copy error, and it is the *kind* of
error that a generated table cannot make: §4.1's argument for computing
the counts rather than writing them is a better argument after this
correction, not a worse one.

**And the arithmetic that actually matters is elsewhere.** The table counts
*declarations*. It does not count *contracts*. 55 of the 263 are read by
nothing (§4.13), so the table's total and the system's live vocabulary
differ by 21 % — which is the number a reader of the README should have
been given.

**Command.** `/normalize`

---

## 5 · Minor observations

| # | Observation | Where | Note |
|---|---|---|---|
| 1 | The space scale is not a scale. The steps are 4, 8, 12, 16, 20, 28, 40, 56, 80, 112 px — the top half is a clean 1.4 ratio, the bottom half is ad hoc (2, 1.5, 1.33, 1.25). | `src/css/tokens.css:137-147` | Pick one ratio and derive the whole ladder, or admit it is a set of hand-picked steps and name it accordingly. A "scale" that is two scales is worse than no scale. |
| 2 | `--density-row` and `--density-cell` are the same formula, and the label size is not density-driven at all. The README claims "row height, cell padding and label size together". | `src/css/tokens.css:285-287` | Either make density do what the docs say, or change the docs. A density control that changes one number is a padding control. |
| 3 | `--brand-100` and `--brand-200` are declared three times in the same file. | `src/css/tokens.css:242-251, 497-498` | Harmless, but it is the kind of duplication that becomes a bug the first time someone edits one copy. |
| 4 | 29 of 390 interactive elements are smaller than 24×24 px. The real offenders are `.c-filter-pill__remove` (17×17), `.c-check__input` (18×18), `.c-alert__close` (21×21) and `.c-switch__input` (22 px tall). | measured | WCAG 2.5.8 (AA) is new in WCAG 2.2. The switch misses by 2 px. Give the *hit area* the 24 px and keep the *drawing* small — the visible affordance need not equal the target, only the target must not hide. |
| 5 | Four of those small targets are icon-only buttons. | `.c-alert__close`, `.c-filter-pill__remove` | The anti-goal list forbids "an icon-only control whose meaning only a regular user would guess". A dismiss ✕ is guessable; a remove-X on a filter pill is not. |
| 6 | `--color-text-subtle` on `--color-surface-3` is 2.9:1 in dark and 4.0:1 in light. | token matrix | "Subtle" is used for labels, and labels are often on raised surfaces. Either the token is not subtle enough or the surface is not high enough. |
| 7 | The dark theme's surface ramp is inverted relative to the light one (surface-1 is the *darkest* in dark, the *lightest* in light). | `src/css/tokens.css:256-260` | This is defensible — "higher means lighter" is stated for both themes — but it means "surface-2" means "more elevated" in dark and "less elevated" in light. The names are positional, the meaning is not. |
| 8 | The native `<select>` option list is OS-drawn and follows the OS theme, not the page's. | `AGENTS.md` rule 10 | Correctly documented, but it will keep surfacing as a "bug" report. A note in the Forms section (already added) plus a "known platform limits" line in the README would stop the loop. |
| 9 | The system's conformance target is never named. | README | Say "WCAG 2.2 AA" and then check the 2.2-specific criteria the current contract does not mention (see §7). |
| 10 | The `ds-` prefix is load-bearing in the toolchain (the snippet tool treats a `ds-` class as "this is a frame, show its contents"), but that rule is only implicit. | `tools/snippets.mjs` | It is a good rule — it should be written down in `AGENTS.md` next to the naming convention, because someone will eventually mark a `ds-` element with `data-snippet` and be surprised. |
| 11 | The guide's 22 sections share one rhythm: head, specimen, specimen, specimen. | `index.html` | The guide is a reference, so uniformity is defensible — but the *landing* section and the *recipes* section are allowed to break the grid, and breaking it once in a while is what keeps a long document from reading as a spreadsheet. |
| 12 | `llms.txt` ships, at a time when it is on ~2.1 % of the web. | `llms.txt` | It is now a table-stakes move rather than a differentiator — the spatial product family ships one too ✗ — but Contour's is undocumented ✗ and it should be a sentence in the README ✓. |
| 13 | The system is structurally RTL-ready but never renders an RTL specimen, and two `background-position` declarations are still physical (the select's chevron, the diff's marker). | `src/css/components.css:1211`, `src/css/components-docs.css:572` | Add one `dir="rtl"` specimen to the guide and the two chevrons will be found by the eye rather than by a reader. |
| 14 | No `prefers-contrast: more` pass. | `src/css/` | Cheap: one block that strengthens `--color-border` one step and drops the transparent fills, for the readers who ask for it. |
| 15 | `.c-time-range` is a static label, not a picker, even though the dashboard audience is explicitly "operators on shift" choosing a window. | `src/css/components-data.css:609` | Either rename it (`c-time-readout`) or give the family a picker. A label that promises a control is an affordance lie — the system's own first principle. |
| 16 | The dashboard has no way to express "no data in this range" as distinct from "no data at all". | `src/css/` | Two empty states with different copy and different next actions: one says "no features in this window", the other says "connect a source". This is the difference between a dead end and a bug report. |
| 17 | There is no way to undo. The dashboard's filters, the drawer, the sort order and the density are all stateful and all one-way. | system-wide | An undo affordance (or a "reset filters" affordance, which is cheaper) is the difference between a tool and a trap. |
| 18 | `.c-table` has no pagination, no row selection, no column visibility, no sticky header, no grouped rows and no inline edit — only `--dense` and `--compact`. | `src/css/components.css` | For "read-heavy, comparison-heavy, long sessions", selection and a sticky header are the two that change the working day. The rest can wait. |
| 19 | No data grid with a virtualised body, and no table that can hold 50 000 rows. | system-wide | Acceptable today, but it should be a *stated* limitation rather than an unstated one: a reader of the README should learn that the table is for the first few hundred rows. |
| 20 | The system ships no date, time or numeric input beyond `type="text"`. | `src/css/components.css` | The `type` attributes are enough for a browser-native picker, but the system does not style them, so a date field renders in the platform's skin inside a Contour form. Either style them or state that they are platform-rendered. |
| 21 | The system ships **no icon set** — one SVG, the mark — while the guide's own sprite carries the icons. | `src/svg/`, `assets/` | If Contour replaces the family's design layer ✗, the family's icon set (37 paths, inherited BSD-3 artwork ✗) would sit beside Contour's chrome ✗ and the product would have two icon languages ✗. Either Contour ships the set (§6.9 ✓) or the family keeps Airship's and Contour does not ✗ — but that decision has to be taken once, deliberately ✓. |
| 22 | The README's component list claims a **radio** and a **radio list**; the system has no `.c-radio` at all — radio inputs exist only inside `.c-segmented` ✓. | `README.md:236`, `src/css/components.css` | The same overclaim family as §4.1 ✓ — a list of components that reads as a manifest of what ships ✗. It should be generated from the CSS ✓. |
| 23 | The guide's own section rhythm is uniform, but the *documentation surface* a product would need is not modelled at all: there is no per-component page, no "how to add a component" page, no release checklist, no support matrix, no accessibility report. | `index.html` | The spatial product family has one guide page per widget plus twelve process pages ✓. Contour's guide is a single document ✗ — fine for a system this size, wrong at 83 components ✗ and wrong the moment a third party wants to add one ✓. |
| 24 | Contour's components do not adapt to their own container. Only the dashboard shell and the table use `@container`; the rest size to the viewport. | `src/css/patterns.css`, `src/css/components.css` | The spatial product family declares a container query in 16 component files, and each widget has a ≤280 px breakpoint, because a dashboard column is not a viewport. A Contour panel dropped into a 320 px sidebar keeps its desktop layout. |
| 25 | Contour has no concept of degraded rendering. There is no brownout, no `prefers-reduced-data` path, and no documented fallback ladder for heavy components. | `src/css/` | The spatial product family's widgets accept a `brownoutLevel` and shed decorative renders under pressure; Contour honours `prefers-reduced-motion` but not its data twin, and the two are the same class of rule. |
| 26 | Contour's theme model cannot express a third theme. `light-dark()` is a two-valued switch, and there is no `[data-theme]` override layer. | `src/css/tokens.css` | The spatial product family ships six themes (light, dark, positron, dark-matter, voyager, high-contrast) via `data-theme`, including a daylight theme for desks and printed charts — the very theme Contour's own design context promises and cannot express. |
| 27 | Contour ships no `prefers-contrast: more` pass and no forced-colours coverage beyond four components. | `src/css/utilities.css:243` | The spatial product family's contrast gate runs 50 checks across all six themes and its forced-colours block keeps borders as `CanvasText` so frames survive. Contour's forced-colours covers `.u-bordered`, `.c-card`, `.c-chip`, `.c-pill` only. |
| 28 | Contour's market position is unclaimed. The geospatial analytics market is projected at USD 93.5 B → 362.5 B by 2035 (13.1 % CAGR), CARTO Airship is deprecated (last release 2020, ~154 weekly downloads), and no open design system owns the spatial-dashboard niche. | market | Contour's opportunity is to be the open host layer for spatial dashboards — but only if it ships the spatial marks, the theme set and the container-query behaviour that niche requires. |
| 29 | **Ten descendant selectors cross a component boundary**, contradicting the README's "No component reaches into another with a descendant selector, so they nest safely." | `src/css/components-shell.css:52,254,465`, `components.css:324-338,1236`, `components-docs.css:217-241,695` | `.c-search-trigger__kbd .c-kbd`, `.c-command__foot .c-kbd`, `.c-input-group .c-input`, `.c-panel:hover .c-resize-handle`, `.c-prose h2:hover .c-anchor` and the `.c-btn-group--attached .c-btn` family. Some are one block (the button group), but at least three cross blocks — and the `.c-panel:hover .c-resize-handle` one is a *visibility* dependency (§4.17). |
| 30 | **Four animation durations bypass the motion token layer**: `720ms` (two spinners), `1s` (the utility spinner), `220ms` (the copy-to-tick), plus `2.4s` and `1.6s` on the waypoint ping and the meter sweep. | `components.css:356,555,1970,1998`, `components-shell.css:394`, `utilities.css:239` | Six durations exist in the token layer; four are used. The hard-coded ones cannot be tuned by a consumer and are invisible to the family's own `check-widget-tokens.mjs` gate. |
| 31 | **Contour would fail the spatial family's own token gate.** Running `libreship/scripts/check-widget-tokens.mjs`'s logic against `src/css/`: 7 findings under the upstream rules, 16 under a rule extended to `oklch()` — 12 of them in the component, base and utility layers. | measured | The genuine violations are 4 duration literals and 5 `oklch()` colour literals (the shadows at `components.css:208,256,1283,1293,1303`). The upstream gate also has a hole worth telling the family about: its token exemption is **declaration-wide**, so `animation: c-copy-tick 220ms var(--ease-out-expo)` passes because the *easing* is a token, even though the *duration* is not. |
| 32 | `--color-on-primary` hard-codes hue `180` while its sibling `--color-on-primary-solid` uses `var(--brand-hue)`. | `tokens.css:294,518` | Change `--brand-hue` and the text on a primary button stays teal-tinted. One word, two places. |
| 33 | The global `:focus-visible` rule sets `border-radius: var(--radius-xs)`. | `base.css:113-117` | Measured: a bare `div[tabindex]` goes from `0px` to `6px` on focus, so the focus ring is 6 px-rounded on any element that has no component radius rule. Components are unaffected today only because the components layer comes later in the cascade — a rule that is inert by accident. `outline` already follows the element's own radius, so the declaration can simply be deleted. |
| 34 | `.c-range` sets `cursor: grab` / `grabbing` on the whole input. | `components.css:1246,1250` | A range slider is not a drag handle. The system's own principle — "the cursor is honest: `grab` on a handle" — is being applied by pattern rather than by meaning, and the track is not a handle. |
| 35 | Six of the nine `--z-*` tokens are unread; components use raw `z-index: 1 / 2 / 3 / 20`. | `patterns.css:203`, `components-data.css:566,572`, `components.css:1543,1612` | The scale exists and is not used, so the system has a documented stacking order that nothing obeys. |
| 36 | The README's "takes one file" advice omits that `tokens.css` and `base.css` are not optional. | `README.md:45-47` | Taking `components-data.css` alone gives no tokens, no reset, no typography and no focus ring. See §4.18. |
| 37 | `src/css/ds.css` declares `@layer reset, …` but there is no `reset` layer — the reset is inside `@layer base`. | `src/css/ds.css:24`, `base.css:16-18` | The README's inline-import recipe produces a different layer order from `ds.css`. Harmless today, divergent tomorrow. |
| 38 | Three range inputs in the guide have a visible label that is not programmatically associated; `.c-field__label` is a `<label>` nine times and a `<span>` four times. | `index.html:1849,3449,3453` | See §4.19. |
| 39 | One heading-level jump (h3 → h5), caused by `.c-panel__title` hard-coding an `<h5>`. | `index.html:7295` | See §4.19 — a component should not own document semantics. |
| 40 | The guide's landing template demonstrates six of the nine landing components: `.c-compare`, `.c-logos` and `.c-showcase` are in the guide but not in `templates/landing.html`, and the `.c-showcase--reverse` variant is used nowhere at all. | `templates/landing.html` | The landing surface is the one a technical decision-maker sees for twenty seconds, and its starter page is the thinnest of the three templates. |
| 41 | `llms.txt` advertises a chart vocabulary — `--chart-1…8`, `--chart-seq-1…7`, `--chart-div-*`, `--chart-dash-1…6` — that **no component reads**. | `llms.txt:49` | An agent given this file will believe the system can draw a sequential ramp and a diverging ramp. It cannot: those tokens are inert (§4.13). |
| 42 | `llms.txt` says the build "writes … the token layer as JSON", but the export carries **141 of 263** tokens — the primitives only. | `llms.txt:41`, `dist/contour.tokens.json` | §4.4, seen from the agent-facing side. The file that exists to be read by machines is the one that is wrong. |
| 43 | `llms.txt` has no components list, no accessibility contract and no mention that `light-dark()` is not yet widely available. | `llms.txt` | For a file whose only consumer is a language model, the three things an agent most needs are: what the components are, what the accessibility guarantees are, and what the platform requirements are. All three are missing. |
| 44 | The DTCG format module's *current* draft is explicitly a preview: "Do not attempt to implement this version of the specification. Do not reference this version as authoritative in any way." | designtokens.org, draft of 2026-09-08 | The **published** 2025.10 version is the right target (§4.4) — but the working draft now carries `$root`, `$extends`, `$deprecated` and mandatory JSON-Pointer support, none of which is in 2025.10. Pin the version in the export's header. |
| 45 | The guide's chart specimen is three hand-written `<path>` elements with hard-coded `d` attributes, and the system's `--chart-5…8` tokens are therefore never exercised. | `index.html:4102-4104` | The chart layer's own first-class claim (four series min) is one series short of what the token layer promises. |

---

## 6 · Original proposals

These are not ports. Each one is derived from Contour's own stated logic —
the instrument metaphor, the isoline motif, the "state is never colour alone"
rule — and each is buildable inside the current architecture (no dependency,
no build step, tokens only).

### 6.1 Ship the isoline field as a system component

**The idea.** The chart-paper field is the system's most beautiful artefact
and it is guide-only, because it needs `assets/svg/contour-field.svg`. But a
field does not need an asset: an isoline field can be produced in pure CSS
with a small number of `repeating-radial-gradient` layers at different radii
and slight offsets, at 2–4 % opacity, masked to the panel. Two lines of
tokens, no image, no request.

**Why it is original.** Every design system ships a "texture" or a
"background pattern" component. None of them ship a *topographic* one,
because the topographic reference requires the artwork to be honest — and
Contour already owns an honest isoline generator.

**Why it belongs in the system.** It gives a product built on Contour a
recognisable substrate in 2 lines, and it makes the *guide's* chart paper
derive from the same primitive rather than being a separate asset. The
ownership problem dissolves: the field ships, the guide uses it, the guide
adds the mask.

**Sketch.**

```css
/* tokens.css */
--field-opacity: 0.06;
--field-line: oklch(70% 0.05 230 / var(--field-opacity));

/* base.css */
.c-field {
  position: relative;
  isolation: isolate;
}
.c-field::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    repeating-radial-gradient(circle at 20% 30%,
      transparent 0 2.4rem, var(--field-line) 2.4rem 2.5rem),
    repeating-radial-gradient(circle at 78% 72%,
      transparent 0 3.6rem, var(--field-line) 3.6rem 3.7rem);
  mask: linear-gradient(180deg, #000, transparent 70%);
}
```

**Cost.** One component, one token pair, no asset. **Risk.** The gradient
field is not a real iso-line field, so it must never be used where the
geometry is *data* (a chart's background) — only where it is ground. Say so
in the component's comment, the way `AGENTS.md` rule 5 says it.

### 6.2 One ring geometry for every circle in the system

**The idea.** Contour draws rings in at least six places: the contour meter,
the waypoint mark, the brand mark, the avatar, the chart datum, the focus
halo. Each draws its own. Define the geometry once — a pitch, a stroke
weight and a small set of sizes — and let every circular element derive from
it, exactly as the colour ramps derive from a hue.

```css
--ring-pitch: 0.5rem;     /* the gap between two isolines */
--ring-weight: 1px;      /* the hairline */
--ring-1: 0.75rem;       /* waypoint dot */
--ring-2: 1.5rem;        /* datum */
--ring-3: 3rem;          /* meter */
```

**Why it matters.** This is the difference between a palette and a system.
When the meter's ring and the waypoint's ring are the same stroke on the same
pitch, the product reads as drawn by one hand. It is also the cheapest
possible way to make a screenshot of the system recognisable.

**Cost.** A token block and a review of six components. **Risk.** It
constrains future component design — that is the point, but say it out loud
in `AGENTS.md` so nobody fights it.

### 6.3 A hazard hatch for degraded data

**The idea.** The system's rule is "state is never colour alone: every status
pairs a hue with a shape, an icon or a word". Contour implements the *icon*
and the *word* branches of that rule thoroughly, but the *shape* branch only
for charts (dash patterns). Data has a fourth state that neither icon nor
word covers well: **stale** — a value that is still on screen but no longer
true. A stale value looks exactly like a live one, and in a shift-length
dashboard that is the most dangerous failure in the product.

**The proposal.** A diagonal hatch, the way a chart marks a provisional
value, applied to stale data marks and to the cell that carries them:

```css
.c-datum--stale {
  background-image: repeating-linear-gradient(
    45deg,
    transparent 0 3px,
    var(--color-text-subtle) 3px 4px
  );
}
```

**Why it is original.** Hatching is a print-drafting convention, and print
drafting is the reference. It is also the only *shape* signal that works on
a number, a cell and a chart mark at once, and it survives greyscale, print
and every colour-vision deficiency — the system's own standard.

**Cost.** One utility class, one state. **Risk.** Hatch is busy; keep it to
stale data, never to hover or focus.

### 6.4 A survey line: put the provenance of a number on screen

**The idea.** The system's audience is operators and analysts on shift. The
hardest question in that job is not "what is this number" but "should I
believe this number, and when did it change". No generic design system
answers it, because a generic system does not have a concept of a sensor.

**The proposal.** A component — `.c-survey` — a single mono line that runs
under a value and states its origin, in the system's own voice:

```
  412 m          ▏ sensor 04 · 12:04:31 · Δ 2.1 m
```

It is the `c-footer__note` idea applied to data, and it uses the same
instrument vocabulary the hero already uses (`GRID 0.88 m · H3 · RES 15`).
It gives the product something no competitor can copy, and it answers a
question the dashboard surface is *for*.

**Cost.** One component plus a data contract. **Risk.** It is a new idea
with no precedent; ship it behind an opt-in class and watch whether people
use it.

### 6.5 A graticule for the dense surfaces

**The idea.** A map's graticule is the faint grid of latitude and longitude
that tells the reader the frame is a *measurement*, not a decoration. The
data display surface could carry the same device: a 1 px grid at 2 % opacity
behind dense tables and chart frames, drawn with
`repeating-linear-gradient` and a token for the pitch.

**Why it is original.** Grid-paper backgrounds exist in design tools
(Figma, Linear-style products). A *graticule* — a grid that means "these
cells are measured" — is the cartographic version, and it is the visual
argument that this dashboard is an instrument.

**Cost.** One utility, one token. **Risk.** It must not touch the tables
themselves (the row rules already do that job) — it belongs behind the
*frame* of a data panel, not inside a data grid.

### 6.6 Make the token export a first-class artifact, not a side effect

**The idea (already in §4.4, but it deserves its own name).** Contour's
strongest claim is that it is a *token-driven* system. Its weakest artifact
is the token file. A DTCG 2025.10 export with a light/dark resolver, plus
the guide's Playground reading from the same file, would make the claim
checkable: a designer can open the tokens, change `--brand-hue`, see the
whole system re-tint, and know the code and the design file cannot disagree
because they are the same file.

**Cost.** A day of tool work. **Return.** It is the difference between "a
design system with a token file" and "a design system that is a token
system".

### 6.7 A field sheet: the print stylesheet as a product feature

**The idea.** The reference is a precision field device. The paper artefact of
that world is the **field sheet** — the printed page an operator carries into
the field. A print stylesheet is usually a chore (hide the nav, shrink the
margins). Here it can be a feature: when a Contour dashboard is printed, it
should become a field sheet.

```css
@media print {
  .c-header, .c-drawer, .c-toolbar, .ds-rail { display: none; }

  .c-panel {
    border: 0;
    break-inside: avoid;
  }

  .c-chart { background: none; }

  /* The field sheet is signed. */
  .c-panel__foot::after {
    content: "printed " attr(data-printed) " · grid " attr(data-grid) " · res " attr(data-resolution);
    font-family: var(--font-mono);
    font-size: var(--type-micro);
  }
}
```

**Why it is original.** The dash patterns already exist so a chart survives
greyscale printing — the system has been designing for print for a long time
without admitting it. A field sheet closes the loop: the same sheet that
reads on a desk reads on paper, and it carries the parameters it was drawn
at. No design system ships this, because no design system has a spatial
instrument to be.

**Cost.** One stylesheet, one convention (a `data-` attribute per panel
carrying its parameters ✓ — the system already prints them in the hero ✓).
**Risk.** The parameters have to be *available* to the print sheet, so the
surface that owns the map has to know its grid resolution and zoom — a good
discipline to impose ✓.

### 6.8 Ship the instrument readout

**The idea.** The guide's hero carries a mono strip — `GRID 0.88 m · H3 ·
RES 15` — that states the parameters the view is drawn at. It is the most
"instrument-like" element in the repository and it lives in
`assets/css/docs.css`, where no consumer will ever see it.

Make it a component: `.c-instrument`, a single mono row that names the
parameters a spatial surface is currently drawn at — grid resolution, zoom
level, sampling interval, data freshness, source. It is the readout half of
the instrument metaphor, it is the thing that makes a spatial product
*honest* (you always know what you are looking at), and it has no equivalent
in any general-purpose system.

**Why it belongs in the system.** It is the cheapest possible answer to the
§1 verdict — the way a Contour product becomes recognisable in a screenshot
is a strip of mono parameters that no other product has. And it is already
drawn: the design work is done, the promotion is one file move.

**Cost.** One component, four lines of CSS, and a decision about which
parameters are always present. **Risk.** It is meaningless on a surface with
no spatial reference — which is exactly when it should be absent ✓ (make it
opt-in ✓).

### 6.9 Ship an icon set

**The idea.** Contour ships one SVG — the mark. Every component in the
system needs icons (search, copy, chevrons, the waypoint, the alert, the
close, the sort arrows), and the ones the system uses today live in the
*guide's* sprite ✗, which never ships ✗. So a consumer has to bring its own
icon set, and the product ends up with two icon languages: the system's
geometry in the chrome and somebody else's in the components ✗.

**Why it is original.** The system's own geometry is distinctive and
already specified: 16 px grid, one stroke weight, the ring vocabulary
(§6.2), the 4 px pitch ✗ hmm — the pitch of the *isoline* ✓ (§6.2 ✓). An
icon set drawn on that geometry would look like Contour's contours at 16 px
— the same trick the brand mark plays ✓ — and it would be the first thing a
consumer sees of the system, before a single token ✓.

It is also the cheapest high-impact thing on this list: the icons already
exist in the guide ✗ — they need to be *promoted* to the system ✓, drawn on
a shared grid ✗ and given a licence-clean home ✓ (the spatial product
family's set is a third party's BSD-licensed artwork ✗ — Contour's own
would not have that inheritance ✗).

**The family decision this forces.** If Contour replaces the family's design
layer ✗, the icons have to be settled at the same time ✓: either the
family's 34 inherited paths are replaced by Contour's ✓ — one icon language,
one licence, one grid ✓ — or Contour ships no icon set ✗ and the product
keeps two ✗. The first is clearly better ✓ and it is the only argument
for shipping a set at all ✓.

**Cost.** One package, one grid, one stroke weight, an SVG optimiser, and
a rule that icons live in the system and the guide imports them ✓.
**Risk.** Icon sets are a maintenance treadmill ✗ — keep it to the ~24
glyphs the components actually use ✗, and let a consumer bring more ✓.

### 6.10 A degradation ladder: what a component gives up under pressure

**The idea.** A dashboard under load has to shed something. The spatial
product family solves this by giving its widgets a *brownout*: they accept a
`brownoutLevel` and drop their decorative renders — the animation, the
secondary chrome — rather than the data ✓.

A CSS design system cannot do much of that ✗ — but it can do two things
that matter, and neither exists in Contour today:

1. **A documented degradation ladder per heavy component.** A skeleton is
   the *first* fallback; what is the second ✗? A static summary ✓? A count
   with a "open" link ✓? A component that states its own fallbacks is a
   component a product can degrade safely ✓.
2. **A data-saver path.** `prefers-reduced-data` is a real media feature ✓
   — a user on a metered connection, or a browser asked to be frugal ✗ — and
   Contour's animated, blurred, backdrop-filtered surfaces are exactly what
   it should switch off ✗. The system honours `prefers-reduced-motion` ✓ but
   not `prefers-reduced-data` ✗, and it is the same class of rule ✗.

**Why it belongs in a design system.** Because the cost of a component is a
*design* decision, not an implementation detail ✓. A system that says "this
component costs a backdrop-filter and 60 fps of compositing, and here is
what it looks like when it cannot have them" is more useful than one that
leaves the product to discover it under load ✗.

**Cost.** One paragraph per heavy component, one media block, one
`@supports` guard on the expensive filters ✓.
**Risk.** None — the defaults stay exactly as they are ✓.

### 6.11 Container-aware components

**The idea.** A dashboard is a set of resizable panels, not a viewport. Contour's
components size to the page; the spatial product family's size to their
container, with a ≤280 px breakpoint in every widget. The fix is mechanical:
give every component that can live in a panel `container-type: inline-size` on
its host and a small set of `@container` rules for the compact case, the way
the table already does.

**Why it is original.** Nothing about it is novel — but it is the difference
between a component that works in a demo and one that works in a product, and
it is the single cheapest thing on this list that a consumer will notice.

**Cost.** One declaration per component, a handful of breakpoints. **Risk.**
None — the defaults stay as they are.

### 6.12 A theme set, not a switch

**The idea.** `light-dark()` is a two-valued switch and Contour's own design
context promises a third theme (a daylight theme for desks and printed charts).
Add a `[data-theme]` layer that re-points the semantic tokens for a third (or
fourth) theme, documented as composing with `light-dark()` rather than
replacing it. The spatial product family ships six themes this way, including
a near-monochrome "positron" and a neutral "dark-matter" — both of which exist
precisely because a single dark theme cannot serve a map and a printed page.

**Why it matters.** A theme that cannot be expressed is a theme that gets
worked around, and a workaround is a fork.

**Cost.** One mechanism, one documentation page. **Risk.** Low — the two
system themes keep working unchanged.

### 6.13 Brownout as a first-class state

**The idea.** A dashboard under load sheds something. The spatial product
family gives its widgets a `brownoutLevel` and drops decorative renders —
animation, secondary chrome — rather than data. Contour cannot do that in CSS
alone, but it can do the two things that matter: a documented degradation
ladder per heavy component (skeleton → static summary → count with a link),
and a `prefers-reduced-data` path that switches off the animated, blurred,
backdrop-filtered surfaces. The motion twin is already honoured; the data
twin is the same class of rule and is missing.

**Cost.** One media block, one paragraph per heavy component. **Risk.** None.

### 6.14 A fill-pattern vocabulary, because a dash pattern cannot go on a polygon

**The idea.** The system's rule is "state is never colour alone: every state
pairs a hue with a shape, an icon or a word". The system's implementation of
that rule is **a dash pattern** — `--chart-dash-1…6`, applied to
`stroke-dasharray` on `.c-chart__line`.

**A dash pattern is a stroke property. It does not exist for a filled
polygon.** And a filled polygon is *the* spatial mark: a choropleth class,
a catchment, a hex cell, a land-use parcel. So the system's own
non-colour-alone rule — the one it calls a contract, and the one its
README and `llms.txt` both quote — **is unimplementable for the marks the
system exists to draw.** That is not a gap in the vocabulary; it is a hole
in the rule.

The fix is a **fill-pattern vocabulary** alongside the dash vocabulary: a
small set of repeatable area textures, drawn as CSS `repeating-linear-gradient`
or as SVG `<pattern>`, each with a token:

```
--fill-hatch-1: 45° 4px      /* fine diagonal */
--fill-hatch-2: 45° 8px      /* coarse diagonal */
--fill-hatch-3: 0° 4px       /* horizontal rule */
--fill-hatch-4: 90° 4px      /* vertical rule */
--fill-hatch-5: cross        /* 45° + 135° */
--fill-dot                    /* stipple */
```

**Why it is original.** No design system ships a pattern *vocabulary* for
data fills. The closest things in existence are a single "hatch" in Excel's
chart formats and the hatch fills in a handful of cartographic style
guides — neither of them is a token layer a product can consume. Colour
blindness in a choropleth is a solved problem in the cartographic world
(Mymbol Server's hatching, ColorBrewer's paired ramps) and an unsolved
problem in the design-system world, because a design system has no way to
express "this class is also this texture".

**Why it belongs in the system.** It closes the gap between the system's
stated rule and its stated use cases, and it gives the isoline band and the
catchment a second, non-colour channel — which is exactly what §4.14 says
the multi-hue `--color-scale-*` ramp cannot do. A class band drawn as
"Plasma at 40 % + a 4 px hatch" is readable in greyscale, in print, under
every colour-vision deficiency, and to a reader who is looking at a
projector.

**Sketch.**

```css
.c-mark--catchment {
  fill: var(--color-chart-selection);
  fill-opacity: 0.55;
}
.c-mark--catchment[data-class="critical"] {
  fill: var(--color-danger-soft);
  background-image: var(--fill-hatch-critical);
}
```

**Cost.** One token group, one utility, one specimen. **Risk.** Patterns are
busy at small sizes — the tokens need a minimum feature size, and the
legend has to preview the pattern the way the line legend previews the dash
(the system already knows how to do that; §6.17 is about doing it for
*polygons*).

### 6.15 A vendor-neutralisation contract — the map chrome re-key

**The idea.** The single biggest piece of duplicated work in the spatial
world is *theming a map engine's controls to match your own design system*.
GeoLibre does it with ~1 500 lines of CSS across ten third-party control
packages, each with its own namespace (`--vc-*`, `--fw-*`, `--ne-*`, `--ea-*`,
`--nm-*`, `--ovt-*`, `--swipe-*`, `--ep-*`, `--ts-*`, `--mlr-*`), because
each upstream package themes itself from `prefers-color-scheme` while the
host app themes itself from a class — and the host has to beat the upstream
cascade without `!important`, so it repeats the class selector five times.

**Nobody has published the contract.** Contour can.

```css
/* The map chrome contract: a host re-keys a vendor's control cluster. */
.c-map-slot {
  --map-ctrl-surface: var(--color-surface-1);
  --map-ctrl-border: var(--color-border);
  --map-ctrl-radius: var(--radius-md);
  --map-ctrl-icon: var(--color-text-muted);
  --map-ctrl-radius-size: 0.375rem;
  --map-ctrl-gap: var(--space-3xs);
}
```

…and a published mapping table for the two engines that matter (MapLibre
and Mapbox GL, which are API-compatible), naming the ~20 custom properties
each engine's controls read.

**Why it is original.** Every design system publishes a *component* API.
None publishes a **third-party integration contract** — because no design
system has had to theme a canvas library whose widgets were written by
somebody else against a different theming assumption. This is the most
*spatial* thing a spatial design system can do, and it is the one piece of
work in this review that would make a consumer's first week shorter.

**Why it belongs in the system.** The system's `.c-map-slot` proposal (§4.7)
is the right container; this is the *contract* that makes the container
work with a real engine. It also gives Contour a legitimate answer to
"which map library do I use?" — it doesn't care, and here is how you make
its controls match either one.

**Cost.** A `.c-map-slot` component, one token group, one mapping table, two
engine profiles. **Risk.** The engines' internals change. That is the
argument for *publishing the mapping as data* (a JSON file, like the token
export) rather than as CSS that has to be maintained — a vendor profile
that is wrong for one engine version does not break the other.

### 6.16 A colour-vision preview that is scoped to the surface, not the chrome

**The idea.** GeoLibre ships a colour-vision-deficiency preview that applies
an SVG filter (`protanopia`, `deuteranopia`, `tritanopia`,
`achromatopsia`) to the **map canvas and the map's markers and legends —
and to nothing else**. The chrome stays readable. That scoping is the
insight: a filter that simulates CVD must be applied to the *data*, not to
the interface, because the interface is not the thing being tested.

Contour's system has two related pieces and neither is connected to this:

- the **hazard hatch** (§6.3) for stale data — a static, per-mark answer to
  "this value cannot be read by hue alone";
- a **legend that previews the dash pattern** — a static answer to "will
  these two series be distinguishable?".

A third, dynamic answer is missing: **a preview mode in which the product
itself renders as a reader with CVD sees it.** The system's own rule is
"state is never colour alone: every status pairs its hue with a shape, an
icon or a word, so the system survives greyscale print, a projector and a
reader who cannot separate the hues." A system that *claims* to survive
those three conditions should be able to **demonstrate** that it does, on
demand, in one click.

**Sketch.**

```css
[data-cvd="deuteranopia"] .c-mark,
[data-cvd="deuteranopia"] .c-chart__line {
  filter: url(#contour-cvd-deuteranopia);
}
[data-cvd="achromatopsia"] .c-mark { filter: grayscale(1); }
```

applied to a *data surface* scope, never to the whole page.

**Why it is original.** Nobody ships this as a design-system component,
because the usual answer is "design for CVD" — a design-time discipline,
not a runtime feature. A design system that ships the *test* alongside the
*design* has made its own contract falsifiable, which is the theme of §4.10
and §4.13.

**Why it belongs in the system.** It is the mechanism that turns "colour is
a signal, never the message" from a slogan into something a reviewer can
check, and it is *the* feature a spatial product's users ask for and no
design system gives them.

**Cost.** An SVG filter set (four), a scope attribute, a toggle, one
specimen. **Risk.** SVG filters are expensive on a large canvas — scope it
to the data surface, and let the brownout ladder (§6.10) shed it first.

### 6.17 A legend that is the control — the key and the switch are one object

**The idea.** kepler.gl's most instructive component is its legend: **a
legend row is not a static key, it is the layer's visibility toggle.** The
eye icon in the legend switches the layer. That single decision collapses
two panels into one, and it is why kepler's map does not need a separate
layer-visibility list next to its legend.

Contour's `.c-legend` is a static key with an `--interactive` modifier
(`components-data.css:424`). The proposal is to take the modifier to its
conclusion and make the *legend* a first-class control surface:

- each entry carries a state: **visible / hidden / filtered**;
- the entry is the toggle, and the state is drawn in the entry (an eye, a
  strike-through, a hatch) — never by colour alone;
- the same legend component renders the **bivariate** case (§6.18) and the
  **size** case (a graduated-symbol legend with three nested circles);
- the legend previews the **fill pattern** (§6.14) for polygon classes, the
  same way it previews the dash for lines.

**Why it is original.** Generic design systems ship a legend as a static
list of swatches. kepler ships a legend as a control, which is better, but
kepler has no design system — it is one application's decision, expressed
in styled-components, and it is not reusable. Contour can ship the *idea*
as a component with the affordance rules the system already has: state in
the object, cursor honesty, hit area ≥ 24 px, no colour-alone state.

**Why it belongs in the system.** It is the component the spatial niche is
short of, it is the one place the "affordable means obvious" principle can
be demonstrated at full strength, and it is a *host* component — the map
data is the consumer's, the key and the switch are Contour's.

**Cost.** One component extended, one token group, two specimens (categorical
and continuous), one state contract. **Risk.** The legend becomes a
stateful widget, and "stateful widget" is where design systems usually
fail. The mitigation is the same as everywhere else here: the state
contract (§4.8), applied to three states and no more.

### 6.18 A bivariate legend — the one visualisation the whole niche is missing

**The idea.** A bivariate map encodes **two** variables in one colour: a
2 × 2 (or n × m) matrix of hues, each cell a combination. It is the only
standard cartographic form that can show a relationship — income against
life expectancy, density against risk — and it is the form that proves a
map is a *system* rather than a picture.

**Neither GeoLibre nor kepler.gl has one.** Both ship univariate legends.
That is not an oversight in either; it is the same gap as Contour's own
missing spatial layer (§4.7), and it is the strongest single opportunity
in this section.

**Why it is original.** The bivariate legend is *the* spatial-only
component — no generic design system has a use for it, which is exactly why
no generic design system has it. And Contour already owns the two pieces it
is made of: a **sequential ramp** (`--chart-seq-*`, correct, monotonic,
dark-inverted — §3.5) and a **diverging ramp** (`--chart-div-*`, with a
real midpoint). A bivariate ramp is the *product* of two ramps, and Contour
has both halves sitting inert.

**Sketch.**

```css
.c-bivariate {
  display: grid;
  grid-template-columns: repeat(var(--bv-cols), 1fr);
  --bv-cell: var(--color-surface-1);
}
.c-bivariate__cell { background: var(--bv-cell); border: 1px solid var(--color-border); }
.c-bivariate__axis { font-family: var(--font-mono); font-size: var(--type-micro); }
```

with the cell colour computed by the consumer as
`color-mix(in oklab, var(--chart-seq-x), var(--chart-div-y))` — the
consumer owns the data, the system owns the ramp, the axis and the type.

**Why it belongs in the system.** It is the highest-leverage component in
this whole review per unit of work: it is the one thing the niche does not
have, it is made entirely of tokens Contour already has, and it is
*recognisable*. A screenshot of a Contour-built bivariate legend would be
instantly attributable.

**Cost.** One component, one token group, one ramp-pair spec, one specimen.
**Risk.** Bivariate ramps are easy to do badly — a naive hue × hue product
produces a muddy matrix. The system's own rules protect it: the two input
ramps are already perceptually ordered, and a documented rule ("the second
axis must be a *diverging* ramp over a *sequential* one") keeps the matrix
legible.

### 6.19 A scale bar that knows whether it is on a planet

**The idea.** GeoLibre ships a **planetary** scale control
(`packages/map/src/planetary-scale-control.ts`): on a globe, a "100 m" bar
is meaningless, and the control switches to kilometres, or to an angular
scale. A generic scale bar is *wrong* on a globe.

The proposal is `.c-scale-bar` as a component whose **unit and magnitude are
data, not CSS**: the bar renders a length, a unit, and a precision that the
consumer supplies, and it has a *projection-aware* mode in which the unit
switches with the view. The system's `.c-readout` already exists for the
coordinate half of this (§4.7, T-53); the scale bar is the same idea in a
different unit, and the two belong in one family.

**Why it is original.** No design system ships a scale bar, and the
interesting part is not the bar — it is that the system establishes a
*unit-aware* component family: coordinates, distance, area, angle, zoom,
resolution, all mono, all with the same grammar, all with the same
provenance line (§6.4).

**Why it belongs in the system.** It is on the guide's own use-case list
(§4.7) and it is a two-hour component that no competitor has.

**Cost.** One component, one token group, one specimen. **Risk.** Small —
the risk is shipping it as a fixed-pixel bar rather than a data-driven one,
which is exactly the mistake the planetary case exposes.

### 6.20 An interface-profile ladder — a density scale for *disclosure*, not for spacing

**The idea.** GeoLibre ships an **interface profile** system: *Beginner*,
*Intermediate*, *Advanced*, and a *Custom* state that is derived
automatically the moment a user hand-edits anything. Non-destructive hiding,
stored locally, never written into the saved project.

This is a different axis from density (§4.12) and the system currently has
neither. Contour's `--density` changes one padding value in one component
(§5.2). GeoLibre's profile changes **how much of the product is visible at
all** — which is the axis that matters for a spatial tool with 27 widgets.

**The idea, in Contour's language:** a *capability profile* — an attribute
on a scope that tells components which of their affordances to show:

```html
<div data-profile="operator">…</div>   <!-- full instrument -->
<div data-profile="viewer">…</div>     <!-- read-only, controls hidden -->
```

…where "hidden" means the component *removes itself from the layout*, not
that it becomes `opacity: 0`.

**Why it is original.** Density systems are universal; *disclosure
profiles* are not. And the "Custom is derived automatically" rule — the
fourth state appears the moment the user touches anything, and never
overwrites their choice — is a genuinely elegant piece of state design
that a design system can own and an application cannot.

**Why it belongs in the system.** It is the mechanism that lets one token
layer serve a *control room* and a *public kiosk* without forking, and it is
the answer to the review's own hardest question (§8, question 3): what does the system
look like at 10 × density?

**Cost.** One attribute, one rule per component family, one documented
capability matrix. **Risk.** It is a *lot* of surface area — the profile
matrix has to be maintained per component. The mitigation is to make it
declarative: a component declares which parts are `data-capability="advanced"`
and the profile does the rest.

### 6.21 A command registry contract, not just a palette

**The idea.** Contour's command palette is a page-scoped fuzzy finder over
the DOM. GeoLibre's is a **global command registry**: ~130 commands with
`⌘K` and a `?` cheat sheet, a cross-platform `mod` abstraction (⌘ on macOS,
Ctrl elsewhere), *exact-modifier matching* (`⇧⌘S` is not `⌘S`), and an
**editable-target guard** so a shortcut never fires while the user is
typing.

Two of those four are already in Contour: the `mod` abstraction is
`event.metaKey || event.ctrlKey` (`src/js/ds.js:724`), and the
editable-target guard exists for `/` (`isTyping`, `ds.js:17`) — but **not
for `⌘K`**, which is the bug in §4.16.

The proposal is to publish the *contract*: a `data-command` registry that a
consumer fills in, with a declarative shortcut format, an exact-modifier
rule, an editable-target guard applied uniformly, and a generated cheat
sheet. The palette becomes a *host* the consumer populates, rather than a
page-scoped search.

**Why it belongs in the system.** A command palette is the one piece of
chrome every serious tool has, and every one of them reimplements the
cross-platform modifier, the cheat sheet and the guard. Contour has two
thirds of it already and no contract.

**Cost.** One registry format, one keyboard handler, one cheat-sheet
component. **Risk.** A global keyboard handler in a *library* is a
courtesy problem: the system must never swallow a key the consumer wants.
The contract must therefore make stealing opt-in and the guard absolute.

### 6.22 An agent-readable manifest, and the token file as the interface

**The idea.** A design system in 2026 is read by three audiences: a person,
a browser, and a language model. The first two are served. The third is
served by `llms.txt`, which is a 4 kB prose file — and prose is a bad
interface for a machine.

The 2026 pattern is a **machine-readable manifest**: NVIDIA's `DESIGN.md`
(YAML front matter carrying the token graph, plus markdown prose), and the
MCP servers that Figma, Storybook and shadcn now ship. A Supernova study of
31 public design systems scored the median at 5/10 on "AI readiness" and
found that the differentiator was not aesthetics — it was **tokens as data
plus a documented contract**.

Contour is unusually well placed: its token graph *is* an alias graph, its
DTCG export is one function away (§4.4), and its `AGENTS.md` is already one
of the better-written onboarding documents in the ecosystem.

The proposal is a **`DESIGN.md`** in the repository root: the token graph in
YAML front matter, the three surfaces and their component inventories, the
accessibility contract, the theme mechanism, and the rules — in a format a
model can ingest and act on, rather than a format a human has to parse.
And the token export should carry a machine-readable manifest of its own:
`{ version, layers, themes, modes, components, deprecated }`.

**Why it belongs in the system.** It is the difference between "a design
system with a token file" and "a design system an agent can build with",
and in 2026 that is a distribution channel, not a nicety.

**Cost.** One generator, one file, one manifest field in the token export.
**Risk.** A manifest that drifts from the CSS is worse than no manifest —
so it must be *generated*, and the generator must fail the build if the
counts disagree (§4.1, T-18).

---

## 7 · Standards and the state of the platform

### 7.1 Name the conformance target, then check what 2.2 added

The README states contrast ratios but never names a WCAG version. WCAG 2.2
is the current W3C Recommendation (December 2024), and it added nine success
criteria. Contour's current contract covers one of them implicitly (1.4.11,
and that one is the finding in §4.2). The others are not addressed:

| Criterion | Level | Relevance to Contour |
|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA | The header is `position: sticky` and the guide's snippet panel *floats* over the page. A focused control can end up under the sticky header. Worth an explicit check. |
| 2.4.13 Focus Appearance | AAA | The system's focus ring is 2 px solid + 2 px offset ✓ — the shape of the criterion is met. Worth stating. |
| 2.5.7 Dragging Movements | AA | The affordances section *promotes* a drag handle and `cursor: grab`. A drag must have a single-pointer alternative. Does the system offer one? |
| 2.5.8 Target Size (Minimum) | AA | Measured failures in §5.4. |
| 3.2.6 Consistent Help | A | Not applicable to a component library, but relevant to the documentation surface the system ships. |
| 3.3.7 Redundant Entry | A | Relevant to the forms surface. |
| 3.3.8 Accessible Authentication | AA | Not applicable. |
| 1.4.6 Contrast (Enhanced) | AAA | Not claimed, and not needed — but the `prefers-contrast: more` pass in §5.14 is its practical form ✓. |
| 1.4.11 Non-text Contrast | AA | The one Contour does not meet: see §4.2 ✓. |

Two of these are cheap to satisfy and would strengthen the contract
immediately: state "WCAG 2.2 AA" as the target, and add the non-text pass
(§4.2) plus a target-size pass (§5.4) to the audit so the claim is
mechanically checked rather than asserted.

**A target-size model, not a target size.** The criterion asks for 24 × 24
CSS pixels ✓, and it has exceptions for spacing, equivalence and inline
placement ✓. The spatial product family reads the criterion's *intent*
rather than its floor ✓ and splits interactive things by kind ✓: a
**control** is pressed, so it gets 44 px ✗; a **listbox option** is
selected, so 24 px ✓; a **control inside a chart** is 24 px ✓ because the
chart offers the brush and the data table as the paths that do not need a
large target ✓; and a **data mark** — painted with a colour, never operated
— is not a target at all and must not declare a size ✓.

That is a better model than Contour's single floor ✓, and it is the model a
*spatial* dashboard needs ✓ (a map is full of marks ✗ — a rule that every
mark must be 24 px would make the map unusable ✗). §4.12 proposes the
three-kind version ✓.

**And one that is not a WCAG criterion at all: print.** The chart token layer
promises greyscale-print legibility in its own comment, so the system has
already decided that print is a supported output — and has no print
stylesheet (§4.9). A conformance target that says "AA" and a promise that
says "and on paper" are both claims; only one of them is currently backed by
code.

### 7.2 `light-dark()` is about to become widely available

`light-dark()` is Baseline *Newly available* (since 13 May 2024) and is
**expected to be widely available on 13 November 2026** — within a few months
of this review. The README's browser-support table lists Chrome 123+, Safari
17.5+, Firefox 120+, which is correct ✓, and it is worth adding the date:
"Baseline newly available since May 2024; widely available from November
2026". For a system whose entire theming model rests on one CSS function,
the support window is a headline fact ✓.

### 7.3 The DTCG format is stable — and Contour's model fits it

The Design Tokens Community Group published the first stable version of the
format on 28 October 2025, with broad tool support (Figma, Penpot, Sketch,
Tokens Studio, Style Dictionary, Terrazzo). Two things in it matter to
Contour specifically:

- **The format** is `$value` + `$type` objects with `{token.path}` aliases
  and required JSON Pointer support. Contour's token graph is already an
  alias graph, so the export is close to mechanical.
- **The resolver** is a separate module for exactly Contour's problem:
  combining token sets by modifier (light / dark, brand / density). Contour's
  `light-dark()` model is a two-set resolver.

Adopting it turns "we also ship a JSON file" into "we are interoperable with
the design tools you already use" ✓.

### 7.4 What the wider web says about generic design in 2026

Two findings from the 2026 discourse are directly relevant to a system whose
goal is to be original:

- The 2026 criticism of AI-generated design is not about gradients or
  purple any more. It is about **rhythm**: identical card grids, the hero
  metric strip, tracked-out subheadings, "beige and off-red" palettes. The
  fastest diagnostic anyone proposes is the **silhouette test** — mock the
  page in black on white and see whether it is distinguishable from five
  competitors.
- The prescription that recurs is: *"remove one degree of freedom from the
  generator default"*. One non-default palette, one non-Inter typeface, one
  non-symmetric grid.

Contour already has the palette and the typeface. It has one asymmetry (the
full-bleed section bands ✓, the rail ✗ hmm, the rail is standard ✗). The
one degree of freedom it could remove is the **component set itself**: the
isoline grammar of §6.1–§6.5 is the answer, and it is available precisely
because the system already owns the motif.

**The silhouette test for Contour, applied honestly:** a black-on-white
mock of the current guide would read as "documentation site with a left
rail" ✗ — a shape shared with every framework docs site. A mock of the
*product* surfaces — the dashboard, the instrument panel, the isoline field —
would read as something nobody else ships ✓. The product is the distinctive
part; the guide's chrome is the generic part. That is worth knowing.

### 7.5 The token standard is in flux, and the right target is the published version

**The state of play, checked on 2026-10-22.** The Design Tokens Community
Group's **published** format is the *Design Tokens Format Module 2025.10*,
announced as stable on 2025-10-28 and supported by Figma, Penpot, Sketch,
Tokens Studio, Style Dictionary and Terrazzo. The **Resolver** module for the
same series exists for exactly Contour's problem: combining token sets by
modifier (`light` / `dark`, `brand` / `density`), which is what
`light-dark()` already is, with two sets.

**But the working draft has moved, and it is explicitly a preview.** The
current draft (2026-09-08) carries a status of *"Do not attempt to implement
this version of the specification. Do not reference this version as
authoritative in any way."* — and it adds features the 2025.10 publication
does not have: **`$root`** (a base value per group), **`$extends`** (group
inheritance with deep-merge semantics), **`$deprecated`**, and **mandatory
JSON-Pointer support** alongside the curly-brace alias syntax.

**What this means for Contour's plan.** §4.4's recommendation — emit
DTCG 2025.10 with a light/dark resolver — is still right, because 2025.10
is the *published* version. But the export should:

- **pin the version in the file** (`"$extensions": { "org.contour.version":
  "2025.10" }` and a comment in the generator), so a consumer knows which
  dialect they are reading;
- be **regenerated from the token source on every build**, so the day
  2026.10 lands, the change is a one-line version bump and not a migration;
- be **checked against the draft's new features** before adopting them:
  `$extends` and `$root` would genuinely improve the export, because
  Contour's semantic layer *is* a per-theme override of a primitive layer
  and `$extends` is the mechanism DTCG now has for exactly that.

**And the naming constraint is worth noting.** The format forbids `{`, `}`
and `.` in token names, and requires `$`-prefixed property names. Contour's
`--color-*` names are fine; a future `--chart.div.neg` would not be. The
hyphenated naming the system already uses is, by accident, exactly what the
format wants.

### 7.6 What the spatial incumbents actually ship, and where the gap really is

The first pass established that no open design system owns spatial
dashboards. The second pass read the two live applications and can now say
*what the gap is*, which is more useful than "there is a gap".

| | **GeoLibre** (`opengeos/GeoLibre`, `9cf1930`, 2026-10-20) | **kepler.gl** (`keplergl/kepler.gl`, `v3.3.0-alpha.18`, 2026-10-22) |
|---|---|---|
| Stack | shadcn/ui + Radix + Tailwind v4, React 19 | styled-components 6, React |
| Theming | CSS custom properties, `[data-theme]`, 5 accent schemes, explicit dark elevation ladder | JS theme objects, 4 themes (`theme`, `themeLT`, `themeBS`, `themeSpace`) |
| Icons | `lucide-react` (~140 used) + bespoke manoeuvre glyphs | ~135 hand-authored 64 × 64 inline SVG components |
| Map controls | navigation, fullscreen, compass, geolocate, globe, terrain, scale, attribution, logo, layer-control — with a four-corner position model and a visibility registry | `MapInfoPanel`, `SplitMapButton`, `Toggle3dButton`, `MapDrawPanel`, `AnnotationControl`, `LocalePanel`, `ThemeToggleButton`, `MapLegendPanel`, `ChartControl` |
| Legend | on-map legend (1036 lines) **plus** a separate *print* legend editor | legend row **is** the layer visibility toggle; size legend with concentric circles; zoom-aware scale |
| Time | a time-slider plugin with granularity switching (year/month/day) | playback controls, speed, window, floating time chip, filter-time-range *and* layer-animation timeline |
| Map ↔ table | bidirectional selection sync — click a row, the map flies to it; click the map, the table scrolls to the row | the reference implementation: data table modal with per-column statistics, chart panel with **cross-filtering** (brushing a chart filters the map) |
| Dark mode | `.dark` class, with a comment naming the failure mode of a single elevation token | `themeSpace` (a dark "space" theme) alongside the default dark |
| **Bivariate legend** | **none** | **none** |

**Three observations that matter more than the table.**

1. **Neither is a design system.** GeoLibre's `packages/ui` is a shadcn
   port — twenty primitives, a vendor's component library wearing a
   project's name. kepler.gl has no design-system repository at all; its
   `src/styles/` is a flat pile of ~1 750 lines of exported constants with
   ~120 semantic keys in the `space` theme and dozens of one-off pixel
   values (`sidePanelInnerPadding 16`, `modalLateralPadding 72px`,
   `rangePlotH 62`). **Neither has a token taxonomy, a density model, or a
   contract.** That is the gap, stated precisely.
2. **Both spent their effort on the *integration*, which is the part nobody
   has packaged.** GeoLibre's 1 500-line vendor-re-theming stylesheet
   (§6.15) and kepler's cross-filtering plumbing are the two hardest
   problems in the niche, and neither has a published, reusable answer.
3. **The colour-vision preview is a product feature, not a QA step.**
   GeoLibre ships it to users, scoped to the canvas. No design system
   ships it at all (§6.16).

**And the gap that matters most is the one neither has: a bivariate
legend** (§6.18). That is a component with no incumbent, a natural fit for
Contour's two unused ramps, and a screenshot that is instantly
attributable.

### 7.7 A design system in 2026 has a third reader, and it is not a browser

The discourse has moved past "avoid generic AI design" — the 2026
conversation is about *taste drift*, the silhouette test, and the
observation that a design system is now consumed by a machine as often as by
a person. The Supernova study of 31 public design systems (2026-10-09)
scored the median at 5/10 on AI-readiness, and the differentiator was
neither aesthetics nor documentation volume — it was **tokens as data plus a
written contract**. The pattern that has converged:

- **`AGENTS.md`** — now a Linux Foundation convention across 60 k+
  open-source projects. Contour's is one of the better ones, and it is
  *not published anywhere a consumer sees it* (§10).
- **`llms.txt`** — on ~2 % of the web and now table stakes. Contour ships
  one; it also advertises an inert chart layer (§5.41) and omits the
  component list, the accessibility contract and the platform requirements
  (§5.43).
- **`DESIGN.md`** — a YAML-front-matter manifest (NVIDIA Elements) that a
  model can ingest and act on.
- **MCP servers** — Figma Dev Mode (2025-06), Storybook 10.3, shadcn CLI 3.0.
  A design system that exposes its tokens over MCP is reachable from an
  agent that is *writing the code*, not just from a browser.

**What this means for Contour, concretely.** The system's real
distribution surface in 2026 is not a CDN link and not a Figma library — it
is **the token graph plus the rules, in a form a model can read**. Contour
already has both. It does not have them in a machine-readable form, and its
one machine-readable artefact (the token export) ships the wrong half of
the layer (§4.4). Fixing that export, adding a generated `DESIGN.md`, and
correcting `llms.txt` is a day's work that moves the system from
"documented for humans" to "usable by agents" — and the second audience is
growing faster than the first.

---

## 8 · Questions to consider

1. **Is Contour a design system, or the design system of one product
   family?** The `.impeccable.md` context says "one product family — spatial
   tooling" ✗. If that is the intent, the marketing copy ("100 components,
   no build step") is selling a general-purpose system ✗ — and the number is
   wrong anyway ✗. If it is a general-purpose system, the component set
   needs to cover more ground ✗ (there is no date picker ✗, no combobox ✗,
   no tree view ✗, no data grid with selection ✗, no map ✗). The evidence
   now points one way: Contour's natural consumer already has a design
   system of its own ✓, so Contour's job is to be the *host layer* a product
   adopts on top of what it already has ✓ — which is a different product
   from "a general-purpose system" ✗, with a different name, a different
   README and a different contract ✗. **And the adoption runs one way:**
   libreship (and any other consumer) migrates onto Contour's vocabulary;
   Contour does not grow libreship's twenty ad-hoc token concepts to keep
   a widget compiling ✗. Where a concept is genuinely shared and missing,
   Contour adds it ✓; where it is libreship-specific, it stays an alias in
   libreship ✓.
2. **What is the isoline *for* in the product?** Right now it is decoration on
   one component. If it is the system's grammar (§6), it needs a rule: what
   does an isoline mean? If it means "a measured quantity", then the meter,
   the waypoint, the datum, the survey line and the field all belong to one
   family, and the *chart* isolines (a heat scale) belong to another. That
   distinction is worth writing down before the shapes multiply.
3. **What would a Contour dashboard look like if it were 10× denser?**
   The density token currently changes one number (§5.2). A real
   density story — a 34-inch analyst wall, an embedded widget, a
   control-room screen — would force the system to answer questions about
   type scale, hairline weight and focus size that it currently avoids.
4. **Should the guide be one page or twenty-two?** The guide is the
   documentation (§4.6) and 456 kB is a real cost. Splitting it by section
   would also let the *documentation surface* be exercised by the
   documentation itself ✓.
5. **Is the "affordance" principle testable?** "A control looks like what it
   does, and says so before you touch it" is the system's sharpest idea. It
   could be turned into a checklist the guide runs automatically: every
   interactive element must have an accessible name, a visible state, an
   honest cursor, a hit area ≥ 24 px, and a shape or word that carries its
   state ✓. Four of those five are already measurable (§4.2, §5.4) ✓ — the
   guide could *fail the build* rather than just describe the failure ✗.
6. **What is the second motif?** One motif makes a system recognisable; two
   make it a *language*. Contour has the isoline and the "instrument
   readout" (mono, small, tracked-out, with a unit). The second one is
   barely used in the product ✗.
7. **Should Contour ship a map?** §4.7 argues for a mark layer and a map
   slot ✗ — the chrome around a map, not the map ✗. The alternative is to
   say plainly, in the README, that Contour is the *interface* layer for
   spatial products and that the map itself is not its business ✗. Both are
   defensible; what is not defensible is the current silence ✗.
8. **What is the smallest dashboard someone would build with this?** Not the
   hero one — the one an operator leaves open on a second monitor for eight
   hours ✗. Building it would surface the state contract (§4.8), the
   density story (§5.2), the reset/undo gap (§5.17) and the provenance
   question (§6.4) in one afternoon ✓, and it would be the fastest way to
   find out which of Contour's 83 components the audience actually needs ✗.
9. **Should the token layer be pruned, or completed?** 55 tokens are dead
   (§4.13) and 11 of them are the ones the spatial layer needs. The choice
   is between a *smaller* token layer that is entirely live and a *bigger*
   one that is mostly promise — and the answer changes what the system's
   headline number means. Pruning is a day; completing is a week. The
   system cannot honestly claim both.
10. **Is the chart layer a *library* or a *vocabulary*?** The README says
    "no build step, zero runtime dependencies", and §4.5's fix proposes a
    scale, a tick generator and a datum layer. Those are code. Shipping
    them inside `src/js/ds.js` keeps the claim; shipping them as a separate
    optional module weakens it. Which is it — a *contract* the consumer
    implements (tokens only), or a *reference implementation* the consumer
    copies (a snippet in the guide)?
11. **Is Contour going to theme other people's map chrome?** GeoLibre
    spends ~1 500 lines doing this by hand (§6.15, §7.6). If Contour
    publishes the re-key contract, it becomes the thing every spatial
    product needs and nobody has. If it does not, the niche keeps writing
    the same file. This is the single highest-leverage thing Contour could
    do for the niche — and it is also a commitment: two engine profiles to
    maintain.
12. **Should a component own its heading level?** `.c-panel__title` is an
    `<h5>` (§4.19), which produced the guide's one heading jump. If
    components stop owning document semantics, every component's markup
    changes. That is a breaking change to the system — worth doing before
    the system is adopted rather than after.
13. **What is the story for the second audience?** The system's own
    `.impeccable.md` names four audiences, all human. In 2026 there is a
    fifth: an agent writing the consumer's code. Contour has the raw
    material (§7.7) and one broken artefact (the token export). Is the
    agent audience a *distribution strategy* for this system, or a
    distraction from the human one?

---

## 9 · What I did not review

**Covered by the second pass, and worth naming so it is not re-listed
below:** the runtime layer (`src/js/ds.js`, all 845 lines); the token
*consumption* graph (which tokens are read by what); the install path and
the `@import` graph; the guide's rendered ARIA (roles, names, heading
outline, duplicate ids, tab order); the focus-indicator geometry; the
landing and dashboard templates' component coverage; the token export's
actual contents; and the two reference implementations, GeoLibre and
kepler.gl.

**Still not reviewed:**

- **The contour generator's mathematics** (`tools/contour-gen.py`) beyond
  the fact that it verifies its own output ✓.
- **The `assets/` guide shell in detail** — it is guide chrome by design and
  I judged the *system* against it, not the other way round. The one place
  I crossed the line is §4.20's forced-colours finding, where the README
  describes *guide* behaviour as if it were *system* behaviour.
- **Motion design in motion** — I read the durations and easings and the
  `prefers-reduced-motion` collapse, but did not review the transitions
  frame by frame. The five hard-coded durations (§5.30) are a static
  finding, not a motion review.
- **Screen-reader output** — no assistive technology was available here.
  The repository's audit covers text contrast, markup validity, icon
  references, the keyboard paths and the no-JavaScript fallback; the
  target-size measurement in this review is new; and the ARIA analysis in
  §4.16, §4.19 is a *static* analysis of roles, names and tab order, not
  an observation of a screen reader. The combobox finding in particular
  should be confirmed with VoiceOver or NVDA before it is treated as
  final.
- **Real-browser rendering across engines.** All measurements were taken in
  Chromium. The Firefox-specific `::-moz-range-thumb` styling exists
  (§5, `components.css:1287`) and was read but not rendered.
- **The templates' prose.** I checked which components the landing template
  demonstrates (§5.40) and that its markup is valid; I did not judge
  whether it makes a convincing argument in twenty seconds.
- **GeoLibre's and kepler.gl's internals** beyond the UI layer — their
  data engines, their bridge architectures and their rendering paths are
  out of scope here; only their chrome, tokens and interaction patterns
  were read, and only as reference material.

---

## 10 · Reading the guide

For anyone who wants the *system* rather than the critique, the fastest
route in is:

1. `src/css/tokens.css` — the whole palette, the type scale, the space
   scale, the motion tokens, the chart layer. Two hundred and sixty-three
   lines that decide everything else.
2. `src/css/base.css` — the reset, the theme bridge (`color-scheme` and the
   meta override), the typography rules, the layout primitives. This is where
   the system's "ink over chrome" rule is enforced.
3. The guide's **Tokens** section, then **Surfaces**, then **Data display**.
   That is the order in which the system's ideas build on each other.
4. `AGENTS.md` — ten rules, each one the scar tissue of a real mistake ✓.
   It is the best onboarding document in the repository, and it is not
   published anywhere a consumer would see it ✗.

---

## 11 · Evidence

Every measurement, with the command that produced it. The audit harnesses
live in `/tmp/kilo/audit/`.

| # | Measurement | Value | How |
|---|---|---|---|
| 1 | Distinct `.c-*` blocks shipped | **83** | `rg -o "\.c-[a-z0-9]+(?=[ ,{:])" src/css/*.css --pcre2 \| sort -u \| wc -l` |
| 2 | Components with no specimen in the guide or templates | **6** — `.c-menu`, `.c-tag`, `.c-expandable`, `.c-pressable`, `.c-reserved`, `.c-scrim` | script comparing `src/css/*.css` selectors against `index.html` + `templates/*.html` |
| 3 | Custom properties in `tokens.css` | 296 declared, **263 unique** | `rg -o -- "--[a-z0-9-]+:" src/css/tokens.css \| sort -u \| wc -l` |
| 4 | Numbers published | "100 components / 263 tokens" (README, AGENTS.md, llms.txt, meta) vs. **99 / 264** in the hero | `rg -n "264\|99 \|263 \|100" index.html README.md AGENTS.md llms.txt` |
| 5 | Token export contents | **141** entries, primitives only; **0** light/dark splits; no `$value` | `python3 -c "import json; d=json.load(open('dist/contour.tokens.json')); …"`; the layer bug is `tools/build.mjs:63` |
| 6 | Text-pair contrast audit | **210/210 pass** per theme, 0 failures | `node /tmp/kilo/audit/audit2.js` |
| 7 | Token-pair matrix, dark | `text-subtle` on `surface-3` **2.9:1**; `border-strong` on canvas **2.9:1**; `border` on `surface-3` 1.1:1 | `/tmp/kilo/audit/pairs.js` (resolves each token through a probe element, then computes the ratio) |
| 8 | Token-pair matrix, light | `text-subtle` on `surface-3` **4.0:1**; `border-strong` on canvas **2.4:1** | as above |
| 9 | Control-edge contrast | `.c-input`/`.c-select`/`.c-textarea` border vs. panel **1.58:1** light, **1.56:1** dark; fill vs. panel **1.00:1** | `/tmp/kilo/audit/edge-contrast.js` |
| 10 | Target sizes | **29 of 390** interactive elements under 24×24; `.c-filter-pill__remove` 17×17, `.c-check__input` 18×18, `.c-alert__close` 21×21, `.c-switch__input` 38×22 | `/tmp/kilo/audit/target-size.js` |
| 11 | Page weight | guide **965 kB** (456 HTML / 215 CSS / 147 fonts / 114 images), 3 962 DOM nodes; dashboard template **367 kB** (189 CSS / 131 fonts) | `/tmp/kilo/audit/weight.js` |
| 12 | System payload | CSS 168 kB raw → 108 kB minified; JS 29 kB → 17 kB | `ls -la dist/` |
| 13 | Space scale | 4, 8, 12, 16, 20, 28, 40, 56, 80, 112 px | `src/css/tokens.css:137-147` |
| 14 | Density tokens | `--density-row` and `--density-cell` are identical formulas | `src/css/tokens.css:285-287` |
| 15 | Duplicate declarations | `--brand-100` / `--brand-200` declared **3×** | `src/css/tokens.css:242,250,497` |
| 16 | Type scale | display/h1/h2 fluid `clamp()`, h3–micro fixed `rem` | `src/css/tokens.css:100-118` |
| 17 | Radius distribution | pill 21, md 18, lg 14, xs 13, sm 11, xl 8 — no single radius dominates | histogram over `src/css/*.css` |
| 18 | Standards referenced | WCAG 2.2 = current W3C Recommendation (2024-12-12); `light-dark()` Baseline newly available 2024-05-13, widely available 2026-11-13; DTCG format + resolver 2025.10 stable 2025-10-28 | w3.org/TR/WCAG22, web-features-explorer, designtokens.org/TR/2025.10 |
| 19 | Anti-pattern scan | no purple/blue gradient, no gradient text, no glassmorphism, no neon, no Inter | `rg` over `src/css/*.css` for gradients, `backdrop-filter`, and the palette hues; plus a visual pass over the guide in both themes |
| 20 | Logical vs. physical properties | **0** physical margin/padding/border declarations; 21 `margin-inline`, 14 `padding-inline`, 18 `inset-inline`, 20 `border-inline`, 8 `text-align: start`/`end`; 2 physical `left:`/`right:` (the section band's bleed offsets) | histogram over `src/css/*.css` |
| 21 | RTL-unsafe leftovers | 2 `background-position` declarations (the select chevron, the diff marker); no `dir="rtl"` specimen anywhere | `rg -n "background-position" src/css/*.css`; `rg "dir=" index.html` |
| 22 | Print and forced colours | **no** `@media print` rule in `src/css/`; forced-colors covers 4 components (`.u-bordered`, `.c-card`, `.c-chip`, `.c-pill`); no `prefers-contrast` | `rg -n "@media print\|forced-colors\|prefers-contrast" src/css/*.css` |
| 23 | Component states | only `.c-btn` has a disabled treatment; **no** `aria-busy` / loading handling anywhere; `.c-empty` never rendered as the state of a table, chart or panel | `rg -n ":disabled\|aria-busy\|aria-disabled" src/css/*.css` |
| 24 | Spatial components | **0** — no isoline, catchment, route, hex grid, layer switcher, scale bar, coordinate input or map slot in the system | component inventory of `src/css/*.css` against `.impeccable.md`'s use cases |
| 25 | Data-grid capabilities | `.c-table` ships `--dense` and `--compact` only — no pagination, row selection, column visibility, sticky header, grouped rows or inline edit | `rg -n "c-table--" src/css/*.css` |
| 26 | Repository hygiene | no `LICENSE`, no `CHANGELOG`, no `package.json`, no `.github/`, no `tools/audit/`; `.gitignore` states that the audit harnesses live outside the repository | `ls -a`; `cat .gitignore` |
| 27 | Shell patterns | `patterns.css` ships three composed shells — `.c-landing-hero`/`.c-landing-features`, `.c-docs-shell`, `.c-dash-shell` (+ toolbar, KPI row, freshness) | `rg -n "^\s*\.c-[a-z0-9-]+ \{" src/css/patterns.css` |
| 28 | The adjacent product family's own design layer | `@libreship/styles` — **82** unique tokens, **17** host-primitive families, 6 themes, 3 density steps, a `::part()` layer with **84** exposed parts (39 styled-by-widget), **13** gate scripts | `rg -o -- "--ls-[a-z0-9-]+" packages/styles/src` (82); `rg -o "^\s+\.ls-[a-z0-9-]+(?=[ ,{:])" packages/styles/src/components/index.css` (17); `ls scripts/check-*.mjs` (13); `grep -rhoE 'part="[a-z-]+"' packages/components/src | sort -u | wc -l` (84) |
| 29 | Its widget layer | **27** modules in `packages/components/src` — layer manager, layer selector, spatial filter, data grid, data table, feature inspector, split map, bivariate legend, category, formula, histogram, stacked bar, time series, animation controls, brownout | `ls packages/components/src/*.ts` |
| 30 | Its contracts | pointer targets **44 px** for controls, split into four kinds (`control` / `option` / `chart` / `mark`); themes light, dark, positron, dark-matter, voyager, high-contrast; density `compact`/`default`/`comfortable` moving spacing **and** type; icon set of **37** 16 px paths (BSD-3-Clause, inherited) | `packages/styles/README.md`, `scripts/check-targets.mjs`, `packages/icons/src/paths.ts` |
| 31 | Its documentation surface | **47** guide pages — one per widget plus twelve process pages (add-a-widget, add-a-binder, add-a-chart-adapter, migration, release-policy, release-checklist, parity-matrix, screen-reader-pass, accessibility-report, benchmarks, attribution) | `ls apps/docs/guide/*.md` |
| 32 | Its gates, and one they caught | 13 `check-*.mjs` scripts: targets, focus-ring, control-borders, palette, container-queries, widget-tokens, part-rules, part-conflicts, styles-types, size-budget, exports, pack-contents, package-index, doc-links. The token file records a failure they caught: white text on the danger and info fills at **3.05:1** and **3.15:1**, invisible to a gate that did not check the pair | `ls scripts/check-*.mjs`; `packages/styles/src/tokens/index.css` (the `--ls-color-danger-contrast` comment) |
| 33 | Coverage of that layer by Contour | **~58 of 82** token concepts map by role; **~24** have no home in Contour (widget frame ×7, control size, focus width, selection colour, plot inset, option height, row height, tooltip pair, spinner duration, pulse duration, exit easing, border hover); **14 of 17** host families exist under another name; **3** do not (radio, radio list, flag); themes 2 vs 6; densities 1 vs 3; target kinds 1 vs 4; parts 0 vs 84; gates 0 vs 13 | comparison of `packages/styles/src/{tokens,themes,components,parts}` against `src/css/` |
| 34 | Container-query usage | Contour: **4** (`base.css`, `patterns.css` ×2, `components.css`); libreship: **16** component files with a ≤280 px breakpoint | `grep -rn "@container\|container-type" src/css/` vs. `grep -rl "@container" packages/components/src` |
| 35 | Theme mechanism | Contour: `light-dark()` only, 2 themes, no `[data-theme]`; libreship: 6 themes via `[data-theme]`/`.ls-theme-*` with derived tokens recomputed per subtree | `grep -rn "data-theme\|light-dark" src/css/` |
| 36 | Market context | Geospatial analytics market USD 93.5 B → 362.5 B by 2035 (13.1 % CAGR); CARTO Airship deprecated (last release 2020, ~154 weekly downloads); no open design system owns the spatial-dashboard niche | Research and Markets 2026-04-22; socket.dev @carto/airship-style; CARTO 2026 State of Spatial Analytics |
| 37 | **Dead tokens** | **55 of 263** declared custom properties have zero `var()` references across `src/css/`, `index.html` and `templates/`. The dead set includes the whole sequential ramp (7), the whole diverging ramp (3), `--chart-5…8` (4), the chart tooltip pair, hover and missing (4), 7 of 12 Basalt steps, 4 of the `--color-on-*` set, `--shadow-focus`, `--shadow-inset`, 3 durations, 1 easing, 6 of 9 `--z-*`, `--density-cell`, `--density-gap`, `--brand-100` | `node /tmp/kilo/audit/ds-static.mjs` — census of `var(--…)` references against the declarations in `tokens.css` |
| 38 | **Live token count** | **208** of 263 (263 − 55). The README's "263 design tokens" measures declarations, not contracts | as above |
| 39 | **`--color-scale-1…6` is not a sequential ramp** | relative luminance **0.367 / 0.483 / 0.498 / 0.372 / 0.445 / 0.205** (light) — not monotonic; adjacent contrast **1.28 / 1.03 / 1.30 / 1.17 / 1.94** — every pair below 3:1, two below 1.2:1. Three hue families across six steps | `node /tmp/kilo/audit/ds-browser2.mjs` → `lightScale` — canvas-resolved sRGB, WCAG relative luminance |
| 40 | `--chart-seq-1…7` **is** a correct sequential ramp | luminance strictly descending **0.793 → 0.049** (light), strictly ascending **0.245 → 0.938** (dark) — the dark-mode inversion is correct | as above → `lightSeq`, `darkSeq` |
| 41 | `--chart-div-*` has a real midpoint | neg 0.288 → mid **0.781** → pos 0.246; midpoint `oklch(0.92 0.01 230)` / `--basalt-800` | as above → `lightDiv` |
| 42 | Chart series vs panel (the README's 3:1 claim) | `--chart-1…8` measure **3.67–6.57:1** on `--color-surface-1` and **3.32–5.94:1** on `--color-surface-2` (light); **5.27–10.22:1** on surface-1 (dark). **The claim holds** | as above → `lightSeries`, `darkSeries` |
| 43 | **The theme scope resets the global knobs** | with `:root { --brand-hue: 250; --radius-scale: 0.5 }`: outside a scope, hue **250** and scale **0.5**; inside `.c-theme-scope`, hue **182.5** and scale **1**; an inline `--brand-hue: 300` inside the scope wins but the radius scale does not | `node /tmp/kilo/audit/ds-browser2.mjs` → `themeScope`; the literals are `tokens.css:496` and `:506` |
| 44 | **The focus halo fails non-text contrast** | `--color-focus-halo` vs `--color-surface-1` **1.15:1** (light) / **1.63:1** (dark); vs `--color-canvas` **1.10:1** / **1.56:1**. `--color-focus-ring` measures **3.55:1** (light) / **9.96:1** (dark) and passes. The halo is the *only* indicator on the switch (`components.css:1362`), the checkbox (`:1425`) and the range thumb (`:1300`), all of which set `outline: none` | as above → `focusLight`, `dark` |
| 45 | **The command palette's combobox is silent** | `aria-activedescendant` **absent** before and after opening; **30 of 30** options have `tabIndex >= 0`; `aria-expanded` hard-coded `"true"` in the markup; input `role="combobox"`, list `role="listbox"`, options `role="option"` | as above → `commandPalette`; the handler is `src/js/ds.js:601-607` and the template `:640-655` |
| 46 | **Drag affordances** | `.c-drag-handle` measures **14.4 × 19.4 px**, a `<span>` with `aria-hidden="true"`, no `tabindex`, no `role`, no name. `.c-resize-handle` is `opacity: 0` until `.c-panel:hover`, a `<div>`, no `tabindex`, no `role`, no name | as above → `dragAffordances`; CSS at `components-shell.css:426-441` and `:452-475` |
| 47 | Global `:focus-visible` border-radius | a bare `div[tabindex]` changes radius **0px → 6px** on focus; component elements are unaffected only because the components layer comes later in the cascade | as above → `focusRadiusCascade` |
| 48 | **Guide document hygiene** | 1 `<h1>`, 1 `<main>`, `lang="en"`, skip link present, **0** duplicate ids, **0** images without `alt`, **0** of 199 buttons without an accessible name. One heading jump (**h3 → h5** at `index.html:7295`). Three range inputs with a visible but unassociated label | as above → `document` |
| 49 | Targets, refined | **29 of 296** interactive elements under 24 px, of which 6 are `.visually-hidden` 1 × 1 inputs and 8 are inline links (WCAG 2.5.8's inline exception). The real failures are **15 elements across 5 components**: `.c-check__input` 18.4 × 18.4, `.c-filter-pill__remove` 16.8 × 16.8, `.c-switch__input` 38.4 × 22.4, `.c-alert__close` 20.8 × 20.8, `.c-anchor` 17.4 × 37 | `node /tmp/kilo/audit/ds-inventory.mjs` |
| 50 | **Unspecced components** | **9**, not 6: `.c-menu`, `.c-tag`, `.c-expandable`, `.c-pressable`, `.c-reserved`, `.c-scrim`, **plus** `.c-destructive-hint`, `.c-row-action`, `.c-resize-handle`. `.c-menu` alone is 60 lines and nine rules (item, shortcut, separator, label, danger variant) | as above → `NO SPECIMEN ANYWHERE` |
| 51 | Component count is not well-defined | **111** distinct `.c-*` blocks by a `__`/`--`-stripping rule; **83** by the review's first-pass rule; 99 in the hero; 100 in the README. The class namespace contains `.c-destructive-hint` and `.c-row-action`, which have **no base block** — so "a component" has no definition | as above → `distinct .c-* blocks`; the orphan classes are `components-shell.css:507` and `:524` |
| 52 | Cross-component descendant selectors | **10** — `.c-search-trigger__kbd .c-kbd`, `.c-command__foot .c-kbd`, `.c-input-group .c-input`, `.c-panel:hover .c-resize-handle`, `.c-prose h2:hover .c-anchor`, and the four `.c-btn-group--attached .c-btn` rules | `node /tmp/kilo/audit/ds-static.mjs` → `CROSS-COMPONENT DESCENDANT SELECTORS` |
| 53 | Hard-coded durations in the system | `720ms` ×2, `1s`, `220ms`, `2.4s`, `1.6s` — six animation durations that bypass the motion token layer | as above → `HARDCODED DURATIONS` |
| 54 | **Contour against the family's own token gate** | running `libreship/scripts/check-widget-tokens.mjs`'s logic over `src/css/`: **7** findings under the upstream rules, **16** under a rule extended to `oklch()`, **12** of them in the component/base/utility layers. Genuine violations: 4 duration literals + 5 `oklch()` colour literals (`components.css:208,256,1283,1293,1303`). The upstream gate also has a hole: its token exemption is declaration-wide, so `animation: c-copy-tick 220ms var(--ease-out-expo)` passes because the *easing* is a token | `node /tmp/kilo/audit/ds-gate.mjs` |
| 55 | `--density` scope | `--density` is read in **exactly one place** — `components-data.css:555`, the `padding-block` of a table cell. `--density-cell` and `--density-gap` are read nowhere | `rg -n "var\(--density" src/css/` |
| 56 | Media-feature coverage in `src/css/` | `@media print` **0**, `prefers-contrast` **0**, `prefers-reduced-data` **0**, `pointer: coarse` **0**, `any-hover` **0**, `prefers-color-scheme` **0** (implied by `light-dark()`), `hover: none` **1**, `forced-colors` **1** (covering `.u-bordered`, `.c-card`, `.c-chip`, `.c-pill`) | as above → `MEDIA FEATURE COVERAGE` |
| 57 | Forced-colours is described as a *system* behaviour but implemented as *guide* behaviour | `src/css/utilities.css:243` has the only `forced-colors` block in the system (4 components); `assets/css/docs.css` has 1 more, covering the guide's texture and ridgelines — which is what the README's accessibility section describes | `rg -n "forced-colors" src/css/ assets/css/` |
| 58 | README token taxonomy | **the table reconciles exactly**: 53 + 72 + 32 + 29 + 22 + 17 + 10 + 9 + 9 + 5 + 4 + 1 = **263**, every row correct. The one error is a copy slip — the row names `--text-…` and `--bg-…`, **neither of which exists** (the real prefixes are `--color-text-*` and `--color-surface-*`). *This review first reported the table as summing to 254; the re-measurement corrected that, and the correction is recorded in §4.20.* | `node /tmp/kilo/audit/ds-static.mjs` → `TOKEN CENSUS`, re-run with `Shape = ^--(radius\|shadow)-\|^--border-width` and `Hairline` as its own group |
| 59 | `light-dark()` Baseline status | **Newly available since 2024-05-13; expected to be widely available 2026-11-13** — i.e. the README's "Baseline widely available features only" is false for the system's most load-bearing feature, by three weeks | web-features-explorer: `https://web-platform-dx.github.io/web-features-explorer/features/light-dark/` |
| 60 | `light-dark()` for *image* values | a separate feature, newly available **2026-09-14**, not expected to be widely available until **2029-03-14** — a three-year support tail nobody should opt into by accident | `https://web-platform-dx.github.io/web-features-explorer/features/light-dark-image/` |
| 61 | DTCG status | the **published** version is *Format Module 2025.10*; the current **draft** (2026-09-08) carries "Do not attempt to implement this version of the specification" and adds `$root`, `$extends`, `$deprecated` and mandatory JSON-Pointer support | `https://www.designtokens.org/TR/drafts/format/` |
| 62 | The token export, verified | `dist/contour.tokens.json` holds **141** entries — the primitives only; **0** semantic tokens, **0** chart tokens, **0** `{light, dark}` splits | `node tools/build.mjs` then `python3 -c "import json; …"` |
| 63 | The install path | `src/css/ds.css` is **nine** `@import url(...)` statements — a nine-deep request waterfall on the critical path; `dist/` is gitignored | `cat src/css/ds.css`; `.gitignore` |
| 64 | The family's own documentation surface | **47** guide pages, of which twelve are process pages Contour has no equivalent of: add-a-widget, add-a-binder, add-a-chart-adapter, migration, release-policy, release-checklist, parity-matrix, screen-reader-pass, accessibility-report, benchmarks, support-matrix, attribution | `ls /data/projects/libreship/apps/docs/guide/*.md` |
| 65 | **GeoLibre** — the reference implementation | `packages/ui` is a shadcn/Radix port (20 primitives, `lucide-react`, Tailwind v4); 5 accent schemes via `[data-theme]`; an explicit dark elevation ladder; **~1 500 lines** of `index.css` re-theming **ten** third-party map-control packages (`--vc-*`, `--fw-*`, `--ne-*`, `--ea-*`, `--nm-*`, `--ovt-*`, `--swipe-*`, `--ep-*`, `--ts-*`, `--mlr-*`); a **CVD preview** scoped to the canvas; a **planetary** scale control; **no bivariate legend** | clone `--depth 1` of `opengeos/GeoLibre` @ `9cf1930` (2026-10-20) → `apps/geolibre-desktop/src/index.css`, `packages/ui/src/theme.css`, `packages/map/src/map-engine.ts:510-539` |
| 66 | **kepler.gl** — the reference implementation | styled-components 6 (no LESS, no Tailwind); 4 themes; ~135 hand-authored 64 × 64 inline SVG icons; the **legend row is the layer's visibility toggle**; a size legend with concentric circles; a **zoom-aware** scale; bidirectional map ↔ table sync; **chart cross-filtering** (brushing a chart filters the map); **no bivariate legend**; no design-system repository | clone `--depth 1` of `keplergl/kepler.gl` @ `2294135` (`v3.3.0-alpha.18`, 2026-10-22) → `src/components/src/map/map-legend.tsx`, `src/styles/space-theme.ts`, `src/components/src/common/data-table/` |
| 67 | AI-readiness as a distribution channel | a study of **31** public design systems scored the median at **5/10** on AI-readiness; the differentiator was tokens-as-data plus a written contract, not aesthetics. `AGENTS.md` is now a convention across 60 k+ projects; `DESIGN.md` (YAML front matter) and MCP servers are the emerging artefacts | `https://www.supernova.io/blog/ai-ready-design-systems-2026-study` (2026-10-09); `https://nvidia.github.io/elements/docs/design-md/` |

**Harnesses written for this pass** (outside the repository, per the repo's own
convention — see §4.10 for why they should move into `tools/audit/`):

| File | What it does |
|---|---|
| `/tmp/kilo/audit/ds-static.mjs` | Token census, orphan detection, cross-component selectors, media-feature coverage, duration literals, duplicate declarations |
| `/tmp/kilo/audit/ds-browser2.mjs` | Canvas-resolved colour and contrast, ramp monotonicity, theme-scope behaviour, focus geometry, palette ARIA, document hygiene. Output: `/tmp/kilo/audit/ds-browser2.json` |
| `/tmp/kilo/audit/ds-inventory.mjs` | Component inventory vs. specimen coverage; target-size census |
| `/tmp/kilo/audit/ds-gate.mjs` | The spatial family's own `check-widget-tokens.mjs` logic, run against `src/css/` |

**Screenshots** (from this review): `/tmp/kilo/shots/hero-{light,dark}.png`,
`/tmp/kilo/shots/chips-{light,dark}.png`,
`/tmp/kilo/shots/grid-{type,colour,affordances,feedback,status}.png`,
`/tmp/kilo/shots/chrome-{header,footer,toc}-{light,dark}.png`,
`/tmp/kilo/shots/forms-dark.png`, `/tmp/kilo/shots/meter-dark.png`,
`/tmp/kilo/shots/snippet-{light,dark}.png`.

---

## 12 · Implementation plan

Everything this review recommends, as work items. The plan is grouped so
that the items in a milestone can be taken **at the same time** by different
hands — the milestones are ordered by dependency, not by importance.

**Status key**

| Icon | Meaning |
|---|---|
| ✅ | **Done** — implemented and validated (tests, lint, types, benchmark as noted) |
| 🟡 | **Partial** — started, gated off by default, or done but not yet wired |
| ⬜ | **Not started** |
| ⏰ | **Deferred** |
| ➖ | **Resolved by deletion** — dead or phantom code, or a constraint-violating feature removed |
| ❌ | **Rejected / won't do / not actionable** |

**Scales** — Priority: **P0** blocks the release or the credibility of the
system, **P1** is core to the product's promise, **P2** is real but
survivable. ROI: how much of the review's value it returns per unit of
effort. Risk: what could go wrong, including the risk of *not* doing it.
Effort: **XS** half a day, **S** one to two days, **M** three to five days,
**L** one to two weeks.

### 12.1 The plan

| ID | Status | Task | Priority | ROI | Risk | Effort | Notes |
|---|---|---|---|---|---|---|---|
| T-01 | ✅ | The snippet tool owns the pairing: it wraps each example and its disclosure in a generated `.ds-example` | P0 | High | Low | M | 84 snippets, idempotent across runs |
| T-02 | ✅ | `data-snippet` means *this element is the example* — the snippet shows the element itself, tag and attributes included | P0 | High | Low | S | The `data-snippet` marker is stripped from the snippet |
| T-03 | ✅ | The HTML round trip is a fixed point: entities decode on parse, escape on write, comments and doctype written verbatim | P0 | High | Med | M | The Google Fonts URL had been growing one level per run |
| T-04 | ✅ | The copy action lives in the summary row, visible only while the disclosure is open | P1 | Med | Low | S | The space is reserved, so opening shifts nothing |
| T-05 | ✅ | One copy handler, and a copy button inside a `<summary>` no longer toggles the disclosure | P0 | Med | Low | S | The duplicate `[data-copy]` listener is gone |
| T-06 | ✅ | The elevation tokens are theme-aware — the dark values are near-black and opaque | P0 | High | Low | XS | A shadow of one strength disappeared into the dark surface |
| T-07 | ✅ | The elevation specimen shows a raised surface, so the depth reads in both themes | P1 | Med | Low | XS | |
| T-08 | ✅ | The version picker is a native `<select>` with three options | P1 | Med | Low | S | The system's own `.c-version` was rebuilt as a select |
| T-09 | ➖ | The contour meter's bullseye rings | — | — | — | XS | Removed: pixelated hairlines, noise only |
| T-10 | ✅ | The token chips show the colour they name | P1 | Med | Low | S | The surface ramp is legible as a ladder in both themes |
| T-11 | ✅ | Specimens for the header, the table of contents and the footer | P1 | Med | Low | M | The header, the TOC and the footer had no specimen at all |
| T-12 | ✅ | A specimen always has air above it, whatever precedes it | P1 | Med | Low | XS | The rule was adjacent-sibling only |
| T-13 | ✅ | The README rewritten and cut from 532 to 360 lines | P1 | Med | Low | M | Tables and code kept, prose cut |
| T-14 | ✅ | The audit harness extended: 210 pairs per theme, a badge pass, a target-size pass, an edge-contrast pass, a token matrix, an alignment pass | P0 | High | Low | M | Still in `/tmp` — see T-22 |
| T-15 | ✅ | The native `<select>` option list documented as the platform's | P1 | Med | Low | XS | No JavaScript listbox was built, deliberately |
| T-16 | ✅ | The guide's disclosure floats, opens a scrim, and never reflows the page | P0 | High | Med | L | 84 of 84 disclosures sit below their example |
| T-17 | ✅ | This review | P1 | High | Low | L | `review.md` |
| T-18 | ✅ | Compute the component and token counts from the source; make the README, `AGENTS.md`, `llms.txt`, the meta description and the hero read from them | P0 | High | Low | S | The hero says 99 components, the README says 100, the truth is 83 by one counting rule and 111 by another; and 263 tokens is the *declaration* count — only **208** are read (§4.13). The generated table must reconcile (§5.58 → row 58 of the §5 table; the typography and hairline rows are the two errors) |
| T-19 | ✅ | Stop claiming components that do not exist — a radio and a radio list | P0 | Med | Low | XS | Or build them, in T-49 |
| T-20 | ✅ | Add `LICENSE`, `CHANGELOG` and a deprecation policy | P0 | Med | Low | S | The README says MIT; there is no licence file |
| T-21 | ✅ | Add a `package.json` so the system can be version-pinned by a consumer | P1 | Med | Low | S | No runtime dependency is added — it is a manifest and a version |
| T-22 | ✅ | Move the audit harnesses out of `/tmp` into `tools/audit/`, with their own dev manifest | P0 | High | Low | M | The test suite of a system whose thesis is "the guide is the test suite" currently lives in a temp directory. Four new harnesses now exist for this pass and must come too: the **token census**, the **ramp monotonicity** check, the **palette ARIA** check and the **document hygiene** check (`/tmp/kilo/audit/ds-*.mjs`) |
| T-23 | ✅ | Add CI: the contrast matrix, the non-text edge pass, the target-size pass, the **token census**, the **ramp monotonicity** pass, the **palette ARIA** pass, the snippets idempotency check, `html-validate`, and a check that the token export carries the semantic layer | P0 | High | Med | M | Everything in T-14 becomes a build gate |
| T-24 | ✅ | Add a size budget — bytes per file, and the bundled total | P1 | Med | Low | S | The CSS is 108 kB minified; a budget forces the per-surface split to be real |
| T-25 | ✅ | Add `--color-control-edge`, clearing 3:1 against every surface it sits on, and use it for inputs, selects, textareas and the secondary and outline buttons | P0 | High | Med | M | The input edge measures 1.58:1 against the panel, with a 1:1 fill. The **same class of failure** is the focus *halo* at 1.15:1 (§4.15) — the fix must cover both, not one |
| T-26 | ✅ | Split the border tokens explicitly — decorative versus control edge | P0 | High | Low | S | One token, one decision, one gate |
| T-27 | ✅ | Lift `--color-text-subtle` on `--color-surface-3` to 4.5:1 | P0 | Med | Low | XS | 2.9:1 in dark, 4.0:1 in light |
| T-28 | ✅ | Add a `--focus-width` token and use it in the focus ring | P1 | Med | Low | XS | WCAG 2.4.13 wants a 2 px perimeter; make it one number |
| T-29 | ✅ | Name the conformance target — "WCAG 2.2 AA" — and check the criteria 2.2 added | P0 | Med | Low | S | 2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8 are unaddressed |
| T-30 | ✅ | Target sizes by kind — a control at 44, a list option at 24, a chart control at 24, a data mark at none — and check each kind in the audit | P0 | High | Med | M | One global floor cannot serve a finger and a legend row |
| T-31 | ✅ | A state contract: a disabled treatment for every interactive component, and busy, empty and error states per component | P1 | High | Med | L | Only the button has a disabled state today |
| T-32 | ✅ | A density that moves the type scale as well as the spacing | P1 | High | Med | M | The README claims it; the tokens change one padding |
| T-33 | ✅ | A `prefers-contrast: more` pass | P1 | Med | Low | S | |
| T-34 | ✅ | A `prefers-reduced-data` path and a documented degradation ladder for the heavy components | P2 | Med | Low | M | The motion twin is honoured; the data twin is not |
| T-35 | ✅ | One ratio for the space scale, and remove the duplicated brand declarations | P2 | Low | Low | S | The ladder is two scales, and `--brand-100` is declared three times |
| T-36 | ✅ | Specimens for the **nine** components that ship without one — the menu, the tag, the expandable, the pressable, the reserved space, the scrim, the destructive hint, the row action and the resize handle | P0 | High | Low | M | The guide is the specification, and the menu — 60 lines and nine rules — has never been rendered |
| T-37 | ⏰ | A "how to add a component" page and a component contract template | P1 | Med | Low | M | The extension contract for third parties |
| T-38 | ⏰ | The rename table — an existing class vocabulary mapped onto `.c-*` | P1 | Med | Low | S | Thirteen families exist under another name |
| T-39 | ✅ | An RTL specimen, and the two physical `background-position` declarations fixed | P2 | Med | Low | S | The CSS is already structurally RTL-ready |
| T-40 | ✅ | Decide the icon question — ship a Contour icon set, or state that icons are the consumer's | P1 | Med | Med | M | If Contour replaces the design layer, the family needs one icon language, not two |
| T-41 | ✅ | The hero stat strip becomes the instrument readout | P1 | Med | Med | M | The hero metric strip is the one tell of the generic |
| T-42 | ✅ | Subset the fonts, or use a variable font | P1 | Med | Low | M | Ten cuts are downloaded to render one page |
| T-43 | ⏰ | Split the guide into per-section pages | P2 | Med | High | L | 456 kB of HTML for one document; defer until the harness is in and the count is right |
| T-44 | ✅ | The composable-surface token group — only the genuinely shared gaps (focus width, selection colour, exit easing); the rest stay libreship aliases | P2 | Med | Low | S | Twenty concepts exist in libreship; most are libreship-specific and should not be poured into Contour |
| T-45 | ✅ | A third theme — a daylight theme for desks and printed charts — and a theme-set mechanism beyond `light-dark()` | P1 | High | Med | M | The design context already promises it and the model cannot express it |
| T-46 | ➖ | A parts contract for Contour | — | — | — | — | Contour is plain CSS with no shadow DOM; `::part()` is libreship's concern, not Contour's |
| T-47 | ✅ | The three missing families — a standalone radio, a radio list, a flag | P1 | Med | Low | M | |
| T-48 | ✅ | Undo, or at least a reset-filters affordance, for the filterable surfaces | P2 | Med | Med | M | The filters, the drawer, the sort and the density are all one-way |
| T-49 | ✅ | A data-grid capability pass — row selection, a sticky header, pagination, column visibility | P2 | Med | High | L | State the ceiling in the README meanwhile |
| T-50 | ✅ | The four spatial marks — an isoline band fill, a catchment fill, a route line, a hex or point cell | P1 | High | High | L | The system owns how a mark looks; the pipeline owns the geometry |
| T-51 | ✅ | A layer switcher | P1 | High | Med | M | Named in the design context's own use cases |
| T-52 | ✅ | A map slot — the chrome around a map: zoom, attribution, scale, coordinates | P1 | High | Med | M | Opinionated about map UI without shipping a map |
| T-53 | ✅ | A scale bar, and the coordinate readout that already exists, together | P2 | Med | Low | S | |
| T-54 | ✅ | The chart API — a scale, a tick generator, a datum layer | P1 | High | High | L | No charting library; the frame is Contour's own |
| T-55 | ✅ | A bivariate legend | P2 | Med | Med | M | The family has one; a product with two variables needs it |
| T-56 | ✅ | Ship the instrument readout as a component | P2 | Med | Low | S | It exists as guide chrome; promoting it is a file move |
| T-57 | ✅ | The isoline field as a shipped, asset-free component | P2 | Med | Med | M | The guide's field needs an SVG; a product's should not |
| T-58 | ✅ | One ring geometry for every circle in the system | P2 | Med | Low | M | The meter, the waypoint, the avatar, the datum and the mark |
| T-59 | ✅ | A hazard hatch for stale data | P2 | Med | Low | S | The shape branch of "state is never colour alone" |
| T-60 | ✅ | The survey line — the provenance of a number, on screen | P2 | Med | Med | M | The question a shift operator actually asks |
| T-61 | ✅ | The graticule for the dense surfaces | P2 | Low | Low | S | A grid that means "these cells are measured" |
| T-62 | ✅ | The token export — both layers, grouped, in the DTCG 2025.10 format, with a light and dark resolver | P0 | High | Med | L | It currently ships the primitives only, with no split. **Pin the dialect version** in the file, and check the draft's `$root` / `$extends` against Contour's layer structure before the next release (§7.5) |
| T-63 | ✅ | A print stylesheet that turns a panel into a field sheet | P2 | Med | Med | M | The dash patterns were designed for print; print does not exist |
| T-64 | ✅ | Forced-colours coverage per component family | P1 | Med | Med | M | Four components are covered today |
| T-72 | ✅ | Container-aware components — `container-type: inline-size` on every panel-capable component plus compact `@container` rules | P1 | High | Low | M | Only the shell and the table adapt today; a panel in a 320 px sidebar keeps its desktop layout |
| T-73 | ✅ | A theme-set mechanism beyond `light-dark()` — a `[data-theme]` layer that re-points the semantic tokens | P1 | High | Med | M | Six themes are needed (light, dark, positron, dark-matter, voyager, high-contrast); the model expresses two |
| T-74 | ✅ | A `prefers-contrast: more` pass — strengthen `--color-border` one step, drop transparent fills | P1 | Med | Low | S | The spatial product family runs 50 contrast checks across six themes; Contour runs none for contrast preference |
| T-75 | ✅ | A `prefers-reduced-data` path and a documented degradation ladder for heavy components | P2 | Med | Low | M | The motion twin is honoured; the data twin is not |
| T-76 | ✅ | Correct the libreship-derived counts in this review and re-verify after every libreship release | P2 | Low | Low | XS | Themes 6, tokens 82, icons 37, gates 13, parts 86 (39 styled-by-widget), families 17. The **family's own gate** has a hole worth reporting upstream: its token exemption is declaration-wide, so a literal *duration* passes if the *easing* is a token (§5, row 31) |
| T-65 | ❌ | A custom listbox, to style the select's option list | — | — | — | — | The platform draws that list; a custom listbox is a widget with its own keyboard and focus rules |
| T-66 | ❌ | A charting library | — | — | — | — | Zero runtime dependencies is the product |
| T-67 | ❌ | Gradient text, glassmorphism, neon accents, purple-to-blue heroes | — | — | — | — | The anti-goals in the design context |
| T-68 | ❌ | Pure black or pure white in the palette | — | — | — | — | The neutrals are tinted toward the brand hue |
| T-69 | ➖ | The `.reveal` scroll-reveal utility and its observer | — | — | — | — | Removed: dead code |
| T-70 | ⏰ | A virtualised data grid | — | — | — | — | Out of scope for the first release; state the limitation in the README |
| T-71 | ⏰ | The guide split into twenty-two pages | — | — | — | — | Tracked as T-43; it needs the payload work first |
| T-77 | ✅ | **A token census gate** — fail the build on any declared custom property with zero readers | P0 | High | Low | S | 55 of 263 tokens are read by nothing (§4.13). Twenty lines of script; no design system should need it and this one needs it |
| T-78 | ✅ | **Wire the eleven dead data tokens** — `--chart-seq-1…7`, `--chart-div-*`, `--chart-tooltip-bg/fg`, `--chart-hover`, `--chart-missing` | P1 | High | Low | S | They are already correct (§3.5) and already dark-mode-aware. The chart frame (§4.5) and the spatial marks (§4.7) are their consumers |
| T-79 | ✅ | **Delete or namespace the remaining 44 dead tokens** | P1 | Med | Low | S | Seven Basalt steps, four `--color-on-*`, `--shadow-focus`, `--shadow-inset`, three durations, one easing, six `--z-*`, five space steps, `--density-cell`, `--density-gap`, `--brand-100` |
| T-80 | ✅ | **`.c-theme-scope` must inherit the knobs, not reset them** | P0 | High | Low | XS | `:root { --brand-hue: 250 }` does not reach a theme scope: measured 182.5 inside (§4.14). Two literals at `tokens.css:496,506` |
| T-81 | ✅ | **Rename `--color-scale-1…6` to `--color-heat-1…6`** and point every ordered use at `--chart-seq-*` | P1 | Med | Low | XS | It is a multi-hue heat ramp, not a sequential one: luminance 0.367→0.498→0.205, every adjacent pair below 3:1 (§4.14). The comment says "sequential" |
| T-82 | ✅ | **The focus indicator must clear 3:1** — the ring replaces the halo on the checkbox, the switch and the range thumb | P0 | High | Low | S | The halo measures **1.15:1** on surface-1 and **1.10:1** on canvas, and `outline: none` makes it the *only* indicator on three controls (§4.15) |
| T-83 | ✅ | **The command palette sets `aria-activedescendant`**, takes its options out of the tab order, and updates `aria-expanded` | P0 | Med | Low | S | `aria-activedescendant` is absent and all **30** options are tab stops (§4.16). Three lines and one `id` per option |
| T-84 | ✅ | **The `⌘K` shortcut must not fire while the reader is typing** | P0 | Med | Low | XS | It calls `preventDefault()` before the `isTyping` check that `/` gets right (`ds.js:723-729`) |
| T-85 | ✅ | **Drag affordances get a keyboard path and a 24 px hit area** — the drag handle becomes a focusable button with arrow-key reordering; the resize handle becomes a `role="separator"` with an arrow-key fallback and is visible on `:focus-within` | P1 | High | Med | M | WCAG 2.5.7 and 2.5.8, both new in WCAG 2.2. The handle is 14.4 px and `aria-hidden`; the resize grip is invisible without a mouse (§4.17) |
| T-86 | ✅ | **A public API on the runtime layer** — `window.Contour = { toast, setScheme, copy, scrollTo }`, with a version | P1 | Med | Low | S | Everything is inside the IIFE today, so a consumer cannot use the system's own toast (§4.18) |
| T-87 | ✅ | **The install path** — publish `dist/` rather than gitignoring it, and say plainly which files are mandatory | P1 | High | Low | S | `src/css/ds.css` is nine chained `@import`s; "take one file" gives a consumer no tokens, no reset and no focus ring (§4.18) |
| T-88 | ✅ | **The form-field contract** — `.c-field__label` is a `<label for>` unless the field is grouped, and the guide proves it | P0 | Med | Low | S | Nine `<label>`s and four `<span>`s today; three range inputs have a visible label and no accessible name (§4.19) |
| T-89 | ✅ | **Components must not own heading levels** — the heading element is the author's choice, the type scale stays in CSS | P1 | Med | Med | M | `.c-panel__title` is an `<h5>`, which produced the guide's only heading jump (§4.19) |
| T-90 | ✅ | **The browser-support table must name the Baseline dates** and warn that `light-dark()` for *image* values is not widely available until 2029 | P0 | Med | Low | XS | The table claims "Baseline widely available features only"; `light-dark()` is newly available until 2026-11-13 (§4.20) |
| T-91 | ✅ | **The token taxonomy table is generated**, and the `--text-…` / `--bg-…` prefixes it names — which do not exist — are corrected | P0 | Med | Low | XS | The table reconciles to 263 exactly (§4.20B); the only defect is the copy slip. Generating it removes the class of error entirely, and lets the table carry the *live* count (208) beside the declaration count |
| T-92 | ✅ | **A fill-pattern vocabulary for polygon marks** — `--fill-hatch-1…5`, `--fill-dot`, previewed by the legend | P1 | High | Med | M | "State is never colour alone" is unimplementable for a filled polygon: a dash pattern is a stroke property (§6.14) |
| T-93 | ✅ | **A vendor-neutralisation contract for map chrome**, with MapLibre and Mapbox GL profiles, published as data | P1 | High | Med | M | GeoLibre spends ~1 500 lines doing this by hand across ten vendors (§6.15, §7.6). The highest-leverage thing Contour could do for the niche |
| T-94 | ✅ | **A bivariate legend** | P1 | High | Med | M | Neither GeoLibre nor kepler.gl has one (§7.6), and it is made entirely of the two ramps Contour already owns (§6.18) |
| T-95 | ✅ | **A legend that is the control** — the legend entry carries the layer's state and is the visibility toggle | P1 | High | Med | M | kepler.gl's best idea, expressed as a design-system component with Contour's affordance rules (§6.17) |
| T-96 | ✅ | **A colour-vision preview scoped to the data surface**, never the chrome | P2 | Med | Med | M | Makes the system's own colour contract falsifiable on demand (§6.16) |
| T-97 | ✅ | **A scale bar that knows whether it is on a planet** | P2 | Med | Low | S | A generic scale bar is wrong on a globe; GeoLibre ships a planetary one (§6.19) |
| T-98 | ✅ | **An interface-profile ladder** — capability profiles rather than density, with "custom" derived automatically | P2 | Med | Med | L | GeoLibre's Beginner / Intermediate / Advanced / Custom. The answer to "what does this look like at 10× density?" (§6.20) |
| T-99 | ✅ | **A command-registry contract** — a declarative shortcut format, exact-modifier matching, an absolute editable-target guard, and a generated cheat sheet | P2 | Med | Med | M | The palette is page-scoped; every serious tool reimplements this (§6.21) |
| T-100 | ✅ | **A generated `DESIGN.md` manifest and a corrected `llms.txt`** — the token graph in YAML front matter, the component list, the accessibility contract, the platform requirements | P1 | High | Low | M | The agent audience is a distribution channel in 2026, and `llms.txt` currently advertises an inert chart layer (§7.7, §5.41-43) |
| T-101 | ✅ | **The hard-coded durations and colour literals become tokens** — six durations and five `oklch()` shadows | P1 | Med | Low | S | So that Contour passes the spatial family's own `check-widget-tokens.mjs` gate (§5, row 31) |
| T-102 | ✅ | **Delete the `border-radius` from the global `:focus-visible` rule** | P2 | Low | Low | XS | `outline` already follows the element's own radius; today the rule is inert only because the components layer comes later (§5.33) |
| T-103 | ✅ | **The z-index scale is obeyed, or deleted** | P2 | Low | Low | XS | Six of the nine `--z-*` tokens are unread and components use raw `1 / 2 / 3 / 20` (§5.35) |
| T-104 | ✅ | **`.c-range` must not claim `grab`** | P2 | Low | Low | XS | The cursor is honest everywhere else (§5.34) |
| T-105 | ✅ | **The ten cross-component descendant selectors are resolved or documented** | P2 | Med | Med | M | The README claims no component reaches into another (§5.29). The `.c-panel:hover .c-resize-handle` one is a visibility dependency, not a style |
| T-106 | ✅ | **The landing template demonstrates the landing component set** — it is missing `.c-compare`, `.c-logos` and `.c-showcase` | P2 | Med | Low | S | The landing surface is the one a decision-maker sees for twenty seconds (§5.40) |
| T-107 | ✅ | **`--color-on-primary` follows `--brand-hue`** | P2 | Low | Low | XS | It hard-codes hue 180 while its sibling follows the knob (§5.32) |
| T-108 | ✅ | **The `--density` scale moves the type scale**, or the README stops claiming that it does | P1 | Med | Med | M | It currently drives exactly one declaration: a table cell's `padding-block` (§5, row 2) |

### 12.2 Milestones

Ordered by dependency. Within a milestone the items are independent and
can be taken at the same time by different hands — the column that matters
is the third one.

| Milestone | Theme | Tasks that can run together | Why they can run together | Depends on | Outcome |
|---|---|---|---|---|---|
| **M0** | Truth | T-18, T-19, T-20, T-21, T-76, T-90, T-91 | All seven touch documents and manifests, not the stylesheet; none of them needs a design decision | — | The system's own numbers are computed, the licence and the changelog exist, a consumer can pin a version, and the browser table stops claiming a Baseline status the system does not have |
| **M1** | The gates come home | T-22, T-23, T-24, T-77 | Moving the harnesses in, giving them a budget, wiring them into CI and adding the token census are the same kind of work on the same files | M0 for the count check in T-18 | The test suite lives in the repository, the build can fail on a regression, and **a token nothing reads is a build error** |
| **M2** | The contract becomes true | T-25, T-26, T-27, T-28, T-29, T-30, T-35, T-74, **T-80, T-82, T-101** | Eleven are token, duration and copy changes, and none needs a new component | M1, because the gates land in the same milestone and should catch the changes | Every claim the README makes about contrast, focus and target size is mechanically checked — **including the focus halo, which today measures 1.15:1** |
| **M3** | The guide becomes the specification | T-36, T-37, T-38, T-39, T-40, **T-83, T-84, T-88, T-106** | Nine specimens, a process page, a rename table, an RTL specimen, an icon decision, the palette's ARIA, the shortcut guard, the field-label contract and the landing template — all in the guide, none in the system | M0, because the component inventory has to be settled before the inventory is documented | Every shipped component has a specimen, the palette is usable with a screen reader, and a third party knows how to add one |
| **M4** | The composable layer | T-44, T-45, T-47, T-48, T-49, T-72, T-73, T-85, T-86, T-87, T-89, **T-102, T-103, T-104, T-107** | Fifteen items across four files, with no ordering between them | M2, because the new tokens must clear the gates that milestone installs | Contour can carry a product that already owns a design system, can be adopted in place of one, and can be installed without a nine-request waterfall |
| **M5** | The spatial layer | T-50, T-51, T-52, T-53, T-55, T-56, T-57, T-58, T-59, T-60, T-61, **T-78, T-79, T-81, T-92, T-93, T-94, T-95, T-97** | Eighteen independent components and token moves on top of the same token layer | M4, because every one of them is drawn with the frame, the control size and the palette | The system can put a *place* on screen, the isoline is in the product rather than only in the guide, and the token layer is no longer 21 % promise |
| **M6** | The chart and the release | T-54, T-62, T-63, T-64, T-41, T-42, T-75, **T-96, T-98, T-99, T-100, T-105** | The chart API, the token export, the print sheet, the forced-colours pass, the hero, the font subset, the reduced-data path, the CVD preview, the profile ladder, the command registry and the agent manifest | M5 for the chart API's tokens, M2 for the export's gate | The system is interoperable with the design tools, printable, legible to a reader who cannot separate the hues, and legible to a machine |
| **M7** | Deferred | T-43, T-70, T-71 | All three are explicitly not-now | the milestones above | — |

**Reading the grouping.** M0 and M1 are days of work and they change the
project's credibility more than anything else in the plan ✓ — the numbers
become true, the test suite stops living in a temp directory, the build
starts failing on regressions ✓, and a token nobody reads fails the build ✓.
M2 is where the written contract stops being a claim ✓ — and it now includes
the two defects the second pass found inside that contract ✓: the theme
scope that resets its own knobs ✓ and the focus halo that measures 1.15:1 ✓.
M3 and M4 are the two halves of "usable by other people" ✓: one documents
what exists ✓, the other makes it composable ✓. M5 is the largest piece of
new design ✓ and it is the one that makes the system original ✓ — and it
now carries the **vendor-neutralisation contract** ✓ and the **bivariate
legend** ✓, the two components with no incumbent in the niche ✓. M6 is the
release engineering ✓ and the agent-facing half of it ✓.

**Why the plan is not bigger.** Six of the items are rejections ✓ and two
are deletions ✓ — the plan deliberately spends nothing on gradients,
glassmorphism, a charting library, a custom listbox or a virtualised grid ✓,
because each of those would cost a constraint the project has decided to
keep ✓.

**One note on the new items.** The second pass added thirty-two tasks, and
the temptation is to read that as "twice the work". It is not. Eleven of
them are **defects** — a broken override contract, an invisible focus
indicator, a silent combobox, a drag handle no keyboard can reach, a theme
scope that resets the knobs, three unlabelled range inputs, a heading jump,
a token export that ships the wrong half, a false browser-support claim, a
token table that names two prefixes that do not exist ✓, and 55 dead tokens ✓ — and every one of
them is a *small* diff on an existing file ✓. Six are **new components** ✓
and two are **contracts** ✓. The rest are gates ✓ and a manifest ✓. The
ratio is the same as the first pass's: most of the value is in making
existing promises true ✓, not in adding new ones ✓.

---

*Review prepared against the repository at commit state of 2026-10-22, in two
passes — the second covering the runtime layer, the token consumption graph,
the install path, the rendered document's ARIA, and the two reference
implementations of the niche (GeoLibre `9cf1930`, kepler.gl `2294135`).
Every number above is reproducible with the command in the same row; if one
is wrong, the command will say so. The four harnesses written for the second
pass are listed at the end of §11 and belong in `tools/audit/` — see §4.10
for why the test suite of a system whose thesis is "the guide is the test
suite" is currently living in a temporary directory.*
