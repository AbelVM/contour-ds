# Qwen — What makes a design system stand out in 2026, and what Contour should do about it

Deep-research pass, **2026-10-23**, for `contour-ds`. Companion to `gemini_prompt.md` and
`gpt_prompt.md`; it supersedes both wherever they disagree, and says so explicitly (§2).

Method: 8 parallel web-research threads (benchmarks, adoption evidence, landing, dashboard/data-viz,
docs DX, CSS platform, AI-readiness, brand + geo landscape) writing to `tmp/q/*.md`, plus a
first-hand measurement campaign against this repository in Chromium (`tmp/q/local-measurements.md`,
probes `tmp/q/probe*.mjs`). Deliverables from those threads: `benchmarks-2026.md` (762 ln),
`adoption-evidence.md` (881 ln), `ai-readiness-2026.md` (982 ln), `docs-dx-2026.md` (768 ln),
`dashboard-dataviz-2026.md` (~800 ln), `landing-2026.md` (~250 ln), `css-platform-2026.md` +
`table.md`, `brand-and-geo-landscape.md` (725 ln).

**Evidence labels are load-bearing, not decoration.** `[V]` = someone opened the primary page and
read it. `[S]` = search summary only. `[U]` = unverified. `[M]` = measured by me in this repo today,
command named. A claim with no label is a claim I could not support, and there are several — they are
marked, not hidden.

### Read this first: the tree moved while I measured it

At session start HEAD was `13936da` with a clean tree. By the time I finished, `index.html`,
`src/css/components.css`, `src/css/components-data.css`, `src/svg/cvd-filters.svg`,
`tools/check-export.mjs`, `tools/check-tokens.mjs`, `README.md`, `llms.txt` and `CHANGELOG.md` were
modified by a **concurrent editor** (a sibling headless session `DS-2b` is running in this same
directory). I did not touch or revert any of it. Where a defect I found was fixed mid-session I say
so, because it tells you something about the repo (§0.3). Two gates were red at the last check:
`node tools/check-size.mjs` (dist/ stale against current src) and, transiently,
`node tools/check-tokens.mjs`. Re-run before acting on any number here.

---

## 0. Verdict

**0.1 Contour is not behind on the things the market says matter. It is behind on the things it
cannot see.** Both prompt docs treat "standout" as an aesthetic ambition. The 2026 evidence treats it
as three engineering properties: a token layer a machine can read, a visual identity that survives
removal of the logo, and a claim surface where every published sentence is enforced by a gate. On the
first two Contour is genuinely unusual; on the third it leaks, and the leaks are in its
differentiator sentences.

**0.2 The one real finding — plus a correction to this paragraph, kept visible.** Contour's published
chart contract says *"Every series clears 3:1 against the panel it is drawn on, in both themes"*
`[M: README.md:307]`, and there is no `--color-panel` token in `src/` at all. I measured all eight
series against every surface that does exist and **the claim is true**. My first draft then asserted
the promise was *unowned* — **that was wrong**: `tools/audit/contrast-and-aria.mjs:411` asserts every
`--chart-N` at `SERIES_MIN = 3.0`, in both themes, under a "chart contract" label. The real finding is
narrower and more useful: **the gate covers one of the six surfaces the same file enumerates.**

- `SURFACES` (line 141) lists `canvas`, `canvas-sunken`, `surface-1`, `surface-2`, `surface-3`,
  `surface-raised`, and `overSurfaces()` applies all six to control edge, focus ring and every
  `data-theme` sweep. Series contrast is asserted against **`surface-1` alone**.
- The harness **computes** `vsSurface2` for all eight light-theme series (line 116) and never
  asserts it — measured, then discarded.
- The binding case is off-gate: worst measured is **3.03:1** (light series 6 on `surface-3`) while
  the gated `surface-1` worst is 3.66:1 `[M: probe11.out.txt]`. The contract therefore passes today
  with ~0.03 of headroom on a surface the assertion cannot see: retune `surface-3` or `chart-6` and
  CI stays green.
- Coverage caveat on my own number: I measured five surfaces, the harness enumerates six, so
  **series-vs-`surface-raised` is measured by neither**.

That is the repo's documented failure shape one notch subtler than I first claimed — not a missing
gate, a gate whose *scope* is narrower than the sentence it certifies. Same shape elsewhere: `--chart-dash-1…6` is published in three files while eight dash tokens are declared
`[M]`, and the legend previews only six of them — series 1's key paints literally nothing, measured
with a liveness control. **Fix the ownership, not the prose.**

**0.3 What still differentiates, with the receipts.** Not component count — Esri Calcite shipped a
breaking major in Feb 2026 that **removed components and added none** `[V]`, and IBM's
`@carbon/charts` released v1.27.14→1.27.23 between June and October 2026 with every note reading
"Version bump only" `[V]`: shipping charts is maintenance, not differentiation. What still
differentiates is exactly what Contour already has and under-sells: a deliverable that is a
stylesheet, not a runtime (no surveyed system ships a no-JS stylesheet as the artefact `[V]`, while
Calcite, Polaris, Material Web and shadcn all resolve to JS); a signature motif that is *computed*
rather than drawn (marching squares with a zero-crossing guarantee — nobody in the ten-system set
publishes anything equivalent `[V]`); and a documentation pipeline where the snippet is extracted from
the rendered example (`tools/snippets.mjs`), which the benchmarks thread could not find matched
anywhere.

**0.4 What the two prompt docs get wrong that matters most.** Both propose theming the map itself
from design tokens ("map features dynamically adapt to your theme tokens" `gemini_prompt.md`;
"Native map tokens, glass-cartography" `gpt_prompt.md`). That is not implementable the way it is
phrased: Mapbox Standard's custom theming is a **base64-encoded LUT image** (`theme-data`) plus a
`lightPreset`, and there is **no light/dark operator in the style-spec expression grammar** `[V]`.
You cannot theme a basemap with `light-dark()`. What Contour can legitimately ship is the seam — a
named app-token → style-id/LUT mapping, switched by the same state that sets `data-theme` — which is
a token-layer feature nobody in the niche has published. See §3.D.

---

## 1. The measured baseline (this is the number set to argue with)

| | measured | how |
|---|---|---|
| `dist/contour.min.css` | 129,490 B raw · **21,032 B gzip** | `gzip -9` |
| `dist/contour.css` | 209,846 B raw · 36,309 B gzip | `gzip -9` |
| `dist/contour.min.js` | 22,553 B raw · 6,989 B gzip | `gzip -9` |
| Guide `index.html` | 557,217 B raw · 77,463 B gzip · 9,553 lines | `stat`, `gzip -9` |
| Guide real load | **402,219 B transfer · 11 CSS requests · 5 font files 90,928 B · 4,926 DOM nodes** | `tmp/q/probe4.mjs`, own server |
| Each template load | 252,780 B transfer · 10 CSS requests · 7–8 font files (134–150 kB) | `tmp/q/probe4.mjs` |
| `src/css/ds.css` | **10 CSS requests** (entry + 9 imports) | `tmp/q/probe.mjs` |
| Cascade layers in `dist` | **layered** — correct | `tmp/q/probe3.mjs`, controls gave opposite answers |
| Components | 134 blocks, **0 without a specimen** | `tools/lib/inventory.mjs` |
| Components in a template | **49 of 134**; 85 are specimen-only | `inventory.mjs` |
| Map furniture in templates | **0** (`c-map-*`, `c-layer-switch`, `c-scale-bar`, `c-bivariate`, `c-time-range`) | `tmp/q/consumption2.mjs` + inventory |
| Tokens | 272 declared, 2 unread (`--ease-exit`, `--gradient-heat`), **15 read with no declaration anywhere** | `check-tokens.mjs`, `probe11.mjs` |
| Series vs every real surface | all 8 ≥ 3:1, both themes; min **3.03:1** | `probe11.mjs` |
| Weakest series pair | **1↔7: ΔE(OKLab×100) = 7.4 light / 7.9 dark**; 2↔8 = 9.1 light | `probe10/11.mjs`, validated on published OKLab vectors |
| `--color-heat-1…6` lightness | **non-monotonic both themes** (light .71 .78 .78 .704 .77 .6236) | `probe10.mjs` |
| Legend keys | **series 1 paints nothing** (series 7, 8 fixed mid-session) | `probe19.mjs`, liveness control moved |
| Infinite animations | 5; **0 pause/stop mechanisms anywhere** | grep `src/`, `index.html` |
| `--brand-hue` risk to contrast | **none** — 0..360 sweep, both themes, zero violations | `probe21/22.mjs` |
| Shipped sprite as XML | `fecolormatrix` → **unknown element, filter inert**; works only when inlined as HTML | `probe24.mjs` |
| Modern CSS actually used | `@property` 3, `@container` 4, `anchor()` **0**, `contrast-color()` **0**, `@starting-style` **0**, `field-sizing` **0**, `animation-timeline` **0**, `text-box` **0**, `::picker` **0**, `content-visibility` **0**, `pointer:coarse` **0**, `any-hover` **0**, `aria-live` in src **0** | grep census |
| Reflow / errors | no page-level h-scroll at 1440 or 390 in guide + 3 templates; **0 console/page errors**, incl. JS-off | `probe.mjs` |

Every colour number above went through a validator before it was believed: my sRGB→OKLab matches
Charbonnier's published primary vectors to 0.0000 and round-trips to ±0/255, and at the shipped hue it
reproduces this repo's own harness (ring 4.45 vs the harness's 4.47; edge 3.12 vs 3.14). Two earlier
runs of mine printed confident garbage — one parsed `oklch()` with an rgb-only parser, one compared
OKLCH against clipped `srgb`, which is not a cross-check — and both were withdrawn rather than
published. Details in `tmp/q/local-measurements.md`.

---

## 2. Where the two prompt docs are wrong, incomplete, or unverifiable

They are not useless. `gpt_prompt.md`'s "one identity, three modes" is the right frame and its
"cartographic editorial + field instrument" reading of this repo is better than most internal
writing. But they were written without the measurements, so they contain claims that are false, and
omissions that matter.

| claim in the prompt docs | verdict |
|---|---|
| "Map features dynamically adapt to your design system's theme tokens" (`gemini`) | **Not as stated.** Basemap theming is a LUT + `lightPreset`; no `light-dark()` in the style-spec grammar `[V]`. Restate as the seam (§3.D1). |
| "Contextual cursor states: `cursor-inspect` on charts, `cursor-copy` on code" (`gemini`) | `cursor: help` and `cursor: copy` exist; but Contour's own principle is *the cursor is honest*, and `.c-range` was deliberately changed grab→pointer. Do not invent cursor semantics to satisfy a trend list. |
| "Haptic & reactive feedback" (`gemini`) | Needs JS + a device API; contradicts "nothing is hidden behind JavaScript". Drop. |
| "Interactive Live Sandboxes… across frameworks (React, Vue, Web Components)" (`gemini`) | Out of the system's contract (zero deps, no build). The evidence-backed version is *executable examples of this system's own markup* (§3.C4), which Rust and Deno do and no design-system guide does `[V]`. |
| "Generative skeleton states / content-aware skeletons" (`gemini`) | No evidence found that skeletons feel faster is established; one head-to-head found the opposite `[V]`. Keep skeletons, cite the timing bands, drop the adjective. |
| "AI-native/adaptive widget slots, role-reordered dashboards" (`gemini`) | Unsupported `[U]`; and role-based reordering collides with WCAG 2.4.x consistency claims. Skip. |
| "Semantic token inspector showing token lineages" (`gemini`) | **Blocked by a real bug you have**: your export aliases with `var(--x)`, so the lineage graph is destroyed at serialisation `[V, first-hand]`. Fix §3.B1 first. |
| Palette `#F3F0E7` paper, chartreuse signal, Fraunces + Terracotta (`gpt`) | Directly contradicts `.impeccable.md` anti-goals and the Tidal/Plasma anchors. It is a *competing identity*, not an improvement. Treat as a discarded fork. |
| "Noise, micro-grain, translucent glass layers, glass-cartography" (`gpt`, `gemini`) | **Measured cost**: `backdrop-filter` ≈10–20 ms/tile; animating inside a blurred element ≈20% CPU + 17% GPU while DevTools paint reads 0 ms; live `feTurbulence` re-rasterises every frame `[V/S]`. And NN/g + Infinum on iOS 26 Liquid Glass measured down to **1.5:1** `[V]`. You already refuse glass — hold the line, and put the numbers in the rationale. |
| "Built-in toggle for compact / comfortable / spacious density" (`gemini`) | Right direction, wrong shape: 2026 ships density as a **named selectable preset** (shadcn/create's *Nova* and *Mira* are literally density presets `[V]`). You have 2 levels and no names (§3.D5). |
| "only 54% of teams had tokens in design tools, code and documentation" (`gpt`) | **Verified real** `[V]`, but it is the *intersection* of 90%/82%/66% at **n=147**, from a self-selected vendor audience with no published methodology. Cite it with all three caveats or not at all. |
| anything citing "40% of design systems die within 18 months", "Design Systems International conference", "NN/g 2025 adoption research", "Colour increases recognition by 80%", "92% of devs prefer dark mode" | **Do not import any of these.** Each was traced to nothing: the 40% figure has no primary document `[V-negative]`; there is no such conference (it's an agency); NN/g's DS piece is from **2021**; the 80% colour claim terminates in a **Xerox sales leaflet**; the SO Developer Survey has **no dark-mode question** `[V]`. These are the exact citations that would have made Contour's docs look amateur. |
| "Spatial transitions: clicking a telemetry card pans the map" (`gpt`) | Same-document View Transitions became Baseline newly available **2025-10-14** (one year ago today), cross-document is still Limited `[V]` — and both need JS. Document it as a *consumer recipe*, never as a system feature. |

What both docs missed entirely, and what the evidence says is the actual differentiator set: the
no-runtime deliverable, the computed motif, snippet-from-specimen generation, the gate discipline —
and the fact that **adoption, not aesthetics, is where 2026 systems die** (fully adopted: **7%**;
widely: 31%; *trust* in the system: 91%, n=147 `[V]`).

---

## 3. The program

Ordered by (evidence strength × fit to a zero-dependency, no-build CSS system). Cost is rough;
`gate` is the check that makes the fix permanent — a fix without a gate is a fix that regresses,
which is this repo's documented failure shape.

### A. Truth ledger — cheap, and it is the thing reviewers actually catch

| # | action | why | cost | gate |
|---|---|---|---|---|
| A1 | Publish `--chart-dash-1…8`, not `1…6`, in README/DESIGN/llms | 8 declared and 8 consumed `[M]`; 3 docs say 6 | S | `stamp` owns a range token, or a check that fails when `grep -c -- '--chart-dash-'` ≠ the published upper bound |
| A2 | Retire the phrase "against the panel it is drawn on" → name the surfaces | `--color-panel` does not exist `[M]`; the claim holds against the five surfaces I measured, and against neither of us for `surface-raised`, which the harness enumerates as a sixth | S | `tools/check-claims.mjs`: fail on any `--token` named in prose that `inventory()` does not declare |
| A3 | **Widen** the series-contrast gate to the surfaces the prose promises | it is *not* missing: `contrast-and-aria.mjs:411` asserts all 8 vs `surface-1` only, while `SURFACES` (line 141) enumerates six for edges and rings; `vsSurface2` is computed at line 116 and **never asserted**; the binding 3.03:1 (series 6, `surface-3`) is off-gate `[M]` | S | loop `lightSeries`/`darkSeries` over `SURFACES`, add `surface-raised` (measured by neither the gate nor my probe), assert the already-computed `vsSurface2`, and reuse `overSurfaces()` rather than writing a second resolver |
| A4 | Delete the duplicated install block in README (lines 64–97) | Fonts/Behaviour/quickstart appear twice `[M]` | S | a duplicate-paragraph check; README is a `stamp` target |
| A5 | Name what `contrast-and-aria.mjs` *cannot* decide | ~16 of 50 WCAG 2 SCs are automatable; **57% is a 2021 vendor figure, and it is % of issues, not criteria**; W3C publishes no percentage and warns that passing ACT rules ≠ conformance `[V]` | S | the harness prints its own coverage list; docs quote the harness, not Deque |
| A6 | Correct "the guide is the test suite" or make it true | see C4 | M | C4 |

### B. Token interop — the export is a real bug, and it is your stated capability

`tools/build.mjs` emits `$schema: "https://tr.designtokens.org/format/"` and
`"$value": "oklch(99% 0.002 230)", "$type": "color"`. I fetched the Color module myself `[V]`:

> "The `$value` object contains the following properties: `colorSpace` (required) …
> `components` (required): An array … `alpha` (optional) … `hex` (optional): … a fallback value"

and `oklch` **is** a permitted `colorSpace`. So the fix is mechanical and lossless:

| # | action | why | cost |
|---|---|---|---|
| B1 | Emit 2025.10 shape: `{"$type":"color","$value":{"colorSpace":"oklch","components":[.99,.002,230]}}`, aliases as `{brand.600}` not `var(--brand-600)`, one `$description` per semantic token, `$schema` pointed at the stable `/TR/2025.10/` text | today: CSS strings where an object is required, aliases destroyed (breaks any lineage inspector — incl. the one `gemini` proposes), `{light,dark}` objects are invented (no `mode`/`modes`/`$themes` exists in Format — grep of the full text returns zero `[V]`), **0 `$description`s** `[V, first-hand]` | S-M |
| B2 | Ship the themes as **Resolver-shaped sets**, not as a bespoke object | Resolver is genuinely part of stable 2025.10 (Format · Color · Resolver) `[V]`; this is how a theme set becomes describable — the system's (`light`, `dark`, `high-contrast`) in its own terms, a product's own sets declared by that product (J1) | M |
| B3 | Validate, don't assert | run the DTCG validator in CI; **never claim "DTCG-compatible" without a passing run** — Style Dictionary, named as a reference implementation, states in its own issue tracker it cannot fully read 2025.10 `[V]`, and its README still narrates v5 as in-flight while npm is at 5.7.0 `[V]` | S |
| B4 | Keep CSS as the source of truth | a DTCG file cannot express `oklch(70.4% 0.123 var(--brand-hue))`, the hue knob, or `.c-theme-scope` re-derivation. Direction of travel is **CSS → DTCG (publish only)** | — |
| B5 | Avoid `{ } . $` in any derived token name | names beginning with `$` or containing `{ } .` are disallowed by Format; `--x` translated naively breaks round-trip in Tokens Studio, which blocks them `[V]` | S |
| B6 | Turn `dist/contour.components.json` into a contract | it is 134 bare class-name strings in 2,386 B `[M]` — an inventory, scoring 0 on "component APIs as data" in the two 2026 audits `[V]`. Emit block/elements/variants/states/tokens-consumed/specimen-anchor from `inventory()` + the specimen data you already have | M |

### C. Documentation as a product — where the cheapest 2026 wins are

| # | action | why | cost | gate |
|---|---|---|---|---|
| C1 | **Do not** add `hidden="until-found"` | Not Baseline: Chrome 102, Edge 102, Firefox 148 (2026-02-24), **Safari unsupported, blocked since Feb 2026**; even if Safari shipped today, widely = 2029-04-23 `[V]`. Your closed `<details>` already auto-expand on find-in-page in Chrome/Edge `[V]` — measure Firefox/Safari rather than cite | S | grep guard rejecting `content-visibility: hidden` and `display:none` on a disclosure body (MDN names exactly those as what defeats reveal `[V]`) |
| C2 | Say the search story out loud | DocSearch needs a hosted crawlable site + 7-day domain verify + Algolia attribution; Pagefind is a build step emitting `/pagefind/` + wasm — both disqualified *by your constraints, not by omission* `[V]`. MiniSearch (v7.2.0, zero deps, in-browser) is the only fitting option | S | none — prose |
| C3 | Generate `llms-full.txt` + per-section `.md` twins + `/.well-known/llms.txt`; keep `llms.txt` as an **index to the JSON**, never as AI-SEO | Google, verbatim: "Google Search itself doesn't use them… neither harm nor help" `[V]`. Ahrefs, 137,210 domains: **97% of published llms.txt got zero requests; 77% of readers weren't AI; no bot ever fetches a file that doesn't exist** `[V]`. `llms-full.txt` is not in the spec (a Mintlify convention) `[V]`. So: cheap, keep it, and stop calling it AI-readiness — the real agent channel is C4/B6 + the registry (§E) | S | `stamp --check` covers both files |
| C4 | **Execute the docs, not just extract them** | Rust runs every example (`no_run`/`compile_fail` as graded escape hatches) and Deno runs markdown fences (`deno test --doc`) `[V]`; no design-system guide opened does the equivalent. You already extract exact markup from each specimen — mount each extracted snippet standalone and run contrast/ownership/token/dist over it. This is what makes "the guide *is* the test suite" true | M | CI job; failures list the specimen id |
| C5 | Publish the code-presentation class contract | Shiki transformers only *add classes* — `line focused`, `line highlighted`, `has-diff`, `highlighted-word` — and "You must provide custom CSS rules" `[V]`. Name those as the hooks your `.c-code`/`.c-diff` style, and give the light/dark pair a `--shiki-dark`-style variable convention | S | a fixture page with each class, asserted by C4 |
| C6 | Fix the open-snippet WCAG 2.4.11 hole | 2.4.11 has **no blanket exception for sticky/fixed author content**; sanctioned fixes are `scroll-padding` or modal behaviour `[V]`. Your scrim is `position: fixed` and the focused example is raised above it — that is the modal argument, and it needs `inert` on the rest plus `scroll-padding-block-start` for header+rail | S | harness assertion: element behind an open snippet is `inert` |
| C7 | Move `role="status"`/`role="alert"` off static callouts | MDN: `role="alert"` is for *dynamically displayed* content, "not… on HTML that the user hasn't interacted with" `[V]`. `src/` has 0 live regions `[M]` and the guide has 4 `role="status"` on static specimens — the announcement you think callouts give is not happening | S | role assertion in `contrast-and-aria.mjs` |
| C8 | Test the copy button on four origins | `navigator.clipboard.writeText` is secure-context-only and throws `NotAllowedError`; the spec says a UA **SHOULD** treat `file:` as trustworthy but **MAY** refuse `[V]`. Matrix: `file://`, `http://localhost`, `http://127.0.0.1:<port>`, plain `http://` LAN — paste measured results. Fallback = select + show shortcut | S | paste output into the guide, dated |
| C9 | Stop selling TOC / pager / version-picker as differentiators | Tailwind v4's page has none of the three `[V]`; Docusaurus/Starlight ship all three as generator defaults `[V]` | — | prose |
| C10 | State the measure with its real source | cap prose at **80 characters** citing WCAG 1.4.8 (AAA) `[V]`; if you quote a target, cite **45–90 average** to Butterick `[V]`. "45–75 is required" is Bringhurst *print* guidance and a screen study found 95 cpl faster `[S]` | S | prose |

### D. The three surfaces

#### D-landing — your kit is organised around artefacts the market does not put on a homepage

Anatomy read first-hand from nine dev-tool pages (Vercel, Linear, Stripe, Cursor, Mapbox, Felt,
Raycast, Supabase, Resend) `[V]`, 2026-10-23: **pricing table on the homepage: 0/9. Comparison
matrix: 0/9. FAQ: 1/9.** Medians: 4 feature blocks, 3 named testimonials, 5–7 metric numbers, 8–17
logos, 4 changelog entries. Contour ships all three of the absent artefacts as headline components.

That is not an error — a *design system* legitimately ships a pricing block — but it is why the
landing surface reads as a parts catalogue rather than a page. The eight moves:

| # | action | why (evidence) |
|---|---|---|
| L1 | Add a **velocity proof** pattern (`c-changelog` / dated "recently shipped") | 4/9 homepages carry it; in 2026 cadence *is* the claim `[V]`. You already ship `CHANGELOG.md` and `stamp` |
| L2 | Add an **interoperability wall** beside the logo wall | Felt's wall is *data sources*, not customers (S3, BigQuery, Databricks, ESRI, STAC, WFS, WMTS) — it answers "does it speak my stack" instead of "who pays for it" `[V]`. For Contour: MapLibre ≥6, Mapbox GL, deck.gl, d3-contour, Postgres/PostGIS, GeoJSON, STAC, OGC. This is the single most transferable idea found on the landing pass, and it is on-brand for an instrument |
| L3 | Split **scale metrics** from **in-task metrics** | Stripe/Supabase show scale; **Felt's numbers live inside the demo widgets** (412,000 sq ft, 86 MW, 142 ac, 18% soil moisture, Score 91) `[V]` — in-task numbers cannot be faked, and they are exactly what `.c-instrument`/`.c-readout` are for. You have the components; you lack a recipe that puts numbers *in* the specimen |
| L4 | Add a live gallery section (`c-showcase` over a real field) | "Explore Mapbox live" / Felt's six named maps `[V]`. For Contour the surfaces are already static CSS, so this costs no JS and no runtime — the one place your constraint is an advantage |
| L5 | Reclassify pricing/comparison/FAQ as **pricing-page** patterns, and say so in the guide | 0/9 and 0/9 `[V]`; plus the behavioural-science caveats: **decoy effect replicated 11 times in 91 attempts; choice overload is d = 0.02 (a myth at the cited effect size); anchoring does hold up** `[S]`. Your `c-compare`/`c-pricing` should ship with that guidance attached, because the usual advice behind them is unsupported |
| L6 | Message the fold like 2026, not like 2020 | Hero = **category claim**, not benefit claim ("Location infrastructure for AI", "The spatial infrastructure your business runs on") `[V]`; **never a single CTA** (every one of the nine pairs a self-serve verb with a human one); one artifact inside the fold (4/9 ship zero). Measured levers `[S, 2,000-page A/B corpus Oct 2025–Mar 2026, agency's own portfolio — direction credible, magnitude soft]`: single-stat hero **+18%**, autoplay-video hero **−7%**, "no hero" **+4%** over image hero on B2B; social-proof lift ranks **+22%** named-customer count > **+14%** testimonial > **+8%** logo strip. **CSS-only corollary you should state in the rationale:** the video-hero tax is real — a documented field fix took a video hero from **LCP 3.7 s / CLS 0.14 → 1.9 s / CLS 0.00** with a poster + `fetchpriority=high`; a CSS surface never pays it. And the "+86% with video" number that circulates has no study behind it — refuse it |
| L7 | **Quote the cohort weight table instead of adjectivising "lightweight"** | 20 marketing homepages fetched first-byte and counted directly `[V]`: the median document is **~600 KB of HTML carrying ~20 external `<script src>`** (Stripe 83, ElevenLabs 74, Cursor 128 `<script>` tags). Contour's guide is **544 KB HTML with 2 external scripts** — median weight, **bottom of the script distribution** — and **the entire shipped system is 21,113 B gzipped, roughly a quarter of the cohort's median CSS weight (77–82 KB)** `[V]`. This is the one claim in the document that a competitor cannot make, it is computed by the repo's own tools, and it belongs on the landing surface as the hero number (see L6's +18% single-stat finding). Pair it with: **6/6 of the probed cohort ship `prefers-reduced-motion`** (so it is table stakes, not a selling point), while **`light-dark()` appears in only 1 of 20 competitor documents** (Framer — the landing thread corrected its own earlier "2 of 20" in the final pass) **and 3 of 20 need a `<head>` script to dodge a flash** `[V]` — Contour's bet is ~2 months ahead of the field, not 2 years, and the anchor-positioning `@supports` guard is *cleaner than the cohort's* (only Mapbox, Framer and Stripe ship any anchor string; Vercel none) `[V]` |
| L8 | Two markup gaps, both one line, both on the artifact a consumer ships | `templates/landing.html` loads `fonts.googleapis.com/css2` with **0 `rel=preconnect`**, while the guide that documents it has **2** — the shipped template is slower than its own documentation `[M]`. And **`og:image` and `twitter:card` are 0 occurrences in both `index.html` and the landing template** `[M]`: the landing surface shared into Slack, X or GitHub **renders with no card at all**, which for a system whose pitch is a visual identity is the cheapest gap in this entire study to close. Gate both (K7) |
| L9 | **Publish the two numbers that only a CSS-first page can claim**, and adopt the opt-in motion guard | (1) web.dev's own definition makes an LCP a *largest image, text block, or video* `[V]`, and field data says images are the LCP element on **85.3% desktop / 76.0% mobile** pages `[V]` — so a hero of text + inline SVG is in the **~14–24% minority whose LCP is a text paint**, with no image request to schedule. That is a measurable performance identity, not an adjective, and it is the sentence to put beside L7's 21 KB. (2) **`prefers-reduced-motion` cannot be enforced on a JS-animated page**: web.dev states the blunt universal override cannot stop Web Animations API motion, so *"a CSS-only page is"* protected `[V]` — for a system whose whole contract is "works with JS off", that is a compliance guarantee competitors with a runtime cannot make. Ship motion in the **opt-in** shape web.dev recommends and NRK ships in production (`@media (prefers-reduced-motion: no-preference) { … }`), so a browser without the query gets the calm version rather than the show. Then respect the trap that joins them: under SC 2.2.2 content still "starts automatically" when it begins from an **indirect** interaction — **scrolling an element into view counts** — so a scroll reveal running >5 s with no pause control is a **Level A** failure, not the AAA 2.3.3 issue everyone quotes `[S: the W3C page returned a JS shell to the fetcher; re-open it before publishing the wording]`. NRK's other warning applies to any theme crossfade here: users who scroll in steps (Space, arrows, a screen reader's landmark jump) **skip intermediate animation states**, and abrupt luminance shifts are a seizure risk `[S]`. Budget to publish: **LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at the 75th percentile**, mobile and desktop separately; **INP cannot be measured in a lab**, so TBT is the proxy `[V]` |

#### D-data — the niche is defined by rules nobody lints

The strongest material of the whole pass: Lei, Fan, MacEachren & Maciejewski, **"GeoLinter: A
Linting Framework for Choropleth Maps"**, IEEE TVCG / arXiv:2310.13707 `[V]` — a published **linter
for thematic maps**, with machine-checkable thresholds, validated with novice designers and a
cartography expert. Nobody in the design-system space has this; you have the gates to build it.

| # | action | evidence |
|---|---|---|
| D1 | Add a **ramp gate** to `tools/` | C1: matplotlib requires monotone lightness, verbatim "colormaps which have monotonically increasing lightness… will be better interpreted" `[V]`. Measured today: `--chart-seq` **passes** (light .92→.35 descending, dark .30→.90 ascending); `--color-heat-*` **fails by design** and its own comment says so — which is exactly why the gate should *refuse heat in an ordinal role* rather than merely note it. And the guide still labels the heat specimen "Sequential scale … Six stops, **perceptually even**" `[M]` while the rule under it was changed mid-session to paint `--chart-seq-*`: relabel it, or the specimen and its badge disagree |
| D2 | Publish a **ΔE contract with a validated estimator** | Petroff (arXiv:2107.02270v3) `[V]`: CVD-robust `ΔE_cvd` = min over normal/prot/deut/trit at several severities — the formal version of your "never asks you to tell two colours apart" rule — floors **≥20 for 6 colours, ≥18 for 8, ≥16 for 10, ≤12 flagged**. Do **not** hand-write CIEDE2000: this repo has already published a broken one (`Math.hypot` squaring the signed rotation term; ΔE00 = 737). Gate on the two things that are trivial and *are* required by WCAG 1.4.1: **adjacent-series contrast ≥3:1** and **ΔL**, and state which metric the gate computes |
| D3 | Say what greyscale separation actually rests on | measured lightness of the eight series: **light L = .55 .52 .50 .52 .56 .62 .54 .52 → series 2, 4, 8 are the same lightness**; dark .72 .70 .70 .72 .75 .80 .74 .62 → 1 and 4 identical `[M]`. Petroff's greyscale floor is ΔJ′ ≥ 4.2 for 8 colours; measured ΔL here is 0 for those pairs. So the comment "the chart stays readable in greyscale" is true **only because of the dash pattern** — reword it, or measure it |
| D4 | Close the **series↔pattern** seam | your rule is hue *and* pattern; measured, **series 1's legend key paints nothing** (`background-color: transparent`, dash rules only for `data-series` 2–6…8 after the mid-session fix), and the legend reads `var(--c)` **without a fallback** where the chart reads `var(--c, var(--chart-1))` `[M]`. A consumer who omits `--c` gets an invisible key. Also **1↔7 are your closest pair at ΔE 7.4–7.9 in both themes** — reorder the assignment, or add a 9th hue and re-pick, since the two series that collide are 1 and 7 and series 1 is the default |
| D5 | Add the **cyclic ramp** | `grep cyclic src/` → 0 `[M]`. matplotlib's four families include **cyclic** "for values that wrap around at the endpoints, such as phase angle, **wind direction**, or time of day" `[V]`. A routing/geo product runs on **bearing 0–360°, aspect, time-of-day, phase**; encoding those on a sequential ramp puts the discontinuity where the data is continuous — the two most similar values get the two most different colours. This is a token-layer addition (`--chart-cyc-1…n`, equal lightness, hue carries the encoding, ends meeting at a neutral) and it is a *first* in the niche |
| D6 | Ship a **classification disclosure** component | GeoLinter `NUM_CLASSES` **3–7**, `LOW_GVF` knee at >0.5, `DATA_NORM` requires per-capita/density normalisation ("absolute values are a violation"), `TITLE_LEGEND` requires units + a title template **"[variable] in [region] over [time]"**, `PROJ` must be equal-area (**Mercator is flagged** for choropleths) `[V]`. The EU data-viz guide independently states that the same data looks "very different" per method `[V]`. Two of these — normalisation and units-in-the-legend — are the ones dashboards always miss, and neither is a colour problem. Add `.c-legend__method` + `.c-legend__norm` and make the guide refuse a choropleth specimen that lacks them. Three independent sources put the honest ceiling at ~5–7 (also EuroVis 2024: accuracy drops **between 5 and 6 categories**, N=100 `[V]`) — so **default to 6 series, allow 8, and document what happens past 8** |
| D7 | Make **precision a token, not a habit** | RFC 7946 §3.1.1 makes **lon,lat order normative** ("precisely in that order"), §11.2 fixes **6 decimals ≈ 10 cm** and warns 15 decimals roughly *doubles* payload, §3.1.10 says digits **MUST NOT** be read as uncertainty `[V]`. Publish the digits→metres ladder as a table, a `data-precision` contract on `.c-readout`, and an order badge (`LON/LAT` labels when you show lat first). GeoJSON-parsing demos currently print 15 decimals: that is a false-precision bug, and you can name it in the docs |
| D8 | Reserve an **attribution band** in the map layout | Mapbox: logo may not be styled or altered, ≥3 text links, must stay visible on the map view, container sized 20×65 px, satellite adds `© Maxar` `[V]`. That collides with every bottom-corner thing a dashboard wants (legend, scale bar, readout, zoom). A **legal** constraint expressed in tokens is precisely what a design system is for, and no competitor has it |
| D9 | Build the **basemap seam** | `light-dark()` cannot reach a basemap (no light/dark expression operator; Mapbox Standard = `theme` + `default/faded/monochrome/custom` where custom = **base64 LUT** `theme-data`, plus `lightPreset` dawn/day/dusk/night) `[V]`. So ship a named mapping — `--map-style-light`, `--map-style-dark`, `--map-theme-data-*` per set — switched by the same state as `data-theme`, and document that the app owns the `setStyle` swap. Reframe the prompt docs' promise honestly: Contour themes the **chrome** and supplies the **LUT/style pairs**; it does not theme vector tiles through CSS |
| D10 | Live indicators: add the pause | **WCAG 2.2.2 is Level A**: anything moving/blinking that starts automatically, lasts >5 s and is parallel to other content needs a user mechanism to pause/stop/hide; auto-updating needs pause **or frequency control**; Note 3 says pausing does *not* oblige replaying data received during the pause, and the Understanding page's own examples are weather radar, a stock ticker, a **traffic camera** `[V]`. Measured: 5 infinite animations, the pulsing dot rendered 4× in the guide, **zero pause mechanisms anywhere**; `prefers-reduced-motion` is an OS setting, not a page mechanism, and does not discharge 2.2.2 `[M]`. Cheapest compliant shape: reuse `[data-profile]` or add `[data-motion="paused"]` setting `animation-play-state: paused`, plus a frequency `<select>` on `.c-dash-freshness`. Also note US public-sector context for a geo dashboard: DOJ Title II adopted WCAG 2.1 AA, dates extended by an Interim Final Rule to **2027-04-26 / 2028-04-26**, challenged in *NFB v. DOJ/HHS* `[S]` — **re-check before publishing any of it** |
| D11 | Delta must be a structure; freshness must be text | `.c-delta` needs sign + value + unit + **% vs pp** + a `data-polarity` hook taking `good-up` or `bad-up` + a **no-change** state; percent change on `ABS(prior)`. And `.c-kpi__asof` (as-of + source, stale treatment textual, not just a hue) `[S]` |
| D12 | Do **not** claim dark is better for dashboards | the best 2024 experiment on data graphics (n=134, 24 trials, bar/line/scatter) found polarity affects completion time about as much as **chart type** (~36% average difference), **no polarity won across participants**, and **preference did not predict best polarity**; their recommendation is to ship both `[V/S]`. So the defensible sentence is: *"the polarity that performs best varies per person and does not correlate with the one they pick — so both themes are first-class and measured."* That is already your architecture. Also: **`backdrop-filter` on `.c-header` (blur 16 + saturate) is a per-frame GPU line item** `[S estimates: 10–20 ms/tile; animating inside a blurred element ≈20% CPU/17% GPU with 0 ms painted]`; you already have 6 uses. Keep the count from growing, and note the cost where you keep it |

#### D-docs — see C. The one structural idea worth stealing

Next.js ships its documentation **inside the npm package** (`node_modules/next/dist/docs/`) so an
agent reads the version you actually installed, scaffolds an `AGENTS.md`, prints a copy-paste agent
prompt citing a **fragment URL**, and puts `url`/`lastUpdated`/`prerequisites` in machine frontmatter
`[V]`. That is exactly the shape a CSS system can copy with no runtime: emit `dist/docs/<section>.md`
with a git-derived `lastUpdated`, a `docs_index`, and the token/contract tables `stamp` already
computes. A single 557 kB page is a good *human* artifact and a bad *machine* one: it is 77 kB gzipped
of prose+markup an agent must fetch whole, and `git log` is authoritative for freshness while your
docs are silent about it.

### E. Machine legibility — the one number that should change your plan

**CHI 2026** (DOI 10.1145/3772363.3798616): registry-based component assembly reached **95.08%
design-system compliance**, beating both full-style-guide-in-prompt and retrieved-doc-context `[V]`.
Two independent 2026 audits of real systems (Supernova, 31 systems; DesignSystems.one, 37) score the
same five axes — tokens as data, component APIs as data, agent access, agent-readable docs, agent
guidance — with the **top score 9/10 and 4/5 and a median of 5: nobody is fully agent-ready** `[V]`.

The cheap path for a CSS-first system is not an MCP server. **shadcn's `registry-item.json`
explicitly supports CSS-only distribution** (`registry:style|theme|file`, `css`,
`registryDependencies`, and `tailwind.cssVars.light/dark`), the registry is documented as
"not limited to React", and **hosting a `registry.json` index yields an MCP server with zero server
code** `[V]`. Your `data-snippet` specimens are already the exact markup a registry item needs.

| # | action |
|---|---|
| E1 | Emit `dist/registry/registry.json` + one item per surface bundle (stylesheet + tokens + recipes), built by `tools/build.mjs`. **Verify against the registry schema before writing code** — the ai-readiness thread's own `registryDependencies` claim was corrected mid-pass, so check the field list at `ui.shadcn.com/docs/registry-item.json` first |
| E2 | Emit an agent-rules artifact (the Figma "MCP Integration Rules" shape: force the tool-call order, **demote generated output to reference status**, mandate token/class reuse, forbid raw hex). This is a file, not a runtime — and it is the highest-value AI artifact for a CSS system because your rules are already machine-checkable (`check-ownership`, `family-gate`, `check-tokens`) |
| E3 | If you ever build the server, target **MCP revision 2026-07-28**: the protocol is now **stateless** (`initialize`/`Mcp-Session-Id` removed), `server/discover` is MUST, and **Roots/Sampling/Logging are deprecated** `[V]`. Most 2025 tutorials describe a superseded protocol |
| E4 | A `ds doctor` CLI that dispatches the gates you already own and prints machine-readable results. Cheap, and it is the deterministic gate the registry literature points at |
| E5 | **Be honest about what has no evidence**: no published measurement shows that a design-system *MCP server* improves generated-UI conformance (the CHI study measures *registries*; the audits count artifact *existence*) `[V-negative]`. Say that in the docs. Publishing `llms.txt` is not AI-readiness — see C3 |

### F. Identity — keep it, and stop apologising for it

| # | finding | action |
|---|---|---|
| F1 | **Homogenisation is real and measured, but not in the way the discourse says.** The one large-N study (Ganci & Ribeiro, ACM IUI 2021: 227,000+ screenshots, 10,000+ sites, 17 years) finds layout-similarity distance fell **~44% between 2010 and 2019**, and framework use correlates with similarity `[V]`; **no 2024–2026 re-measurement exists** `[V-negative]`. And at crawl scale **Inter is ~1.5% of pages (Roboto ~10%, Poppins ~6%)** — "Inter is the most popular font on the web" is false, though it *is* the most common body font among top sites `[V]` | Stop treating "we look like everyone" as inevitable. IBM Plex is not in the top-5 crowd. State the IUI numbers if you want to make the argument with data |
| F2 | The distinctiveness literature is **FMCG, not interfaces** — System1's method is proprietary and unpeer-reviewed, and the direct counter-claim is a Google/YouTube study of thousands of ads where **distinctiveness of assets did not break the top 10 drivers of performance** `[V/S]` | Keep the motif because it makes a screenshot attributable and it is nearly free. Do **not** write a growth story on it |
| F3 | The good generative-brand cases share your exact move: **derive the ornament from the data model** (Boundary Analytics: cell width = the number; BRUTE winery: label generated from that vintage's weather; Hübner's "Data Design" bucket) `[V]`, and your technique is the published geo one — `d3.contours()` is marching squares with Sturges-default thresholds `[V]` | Say it in the guide as a *method*, with the d3 analogue, and show the generator's self-verification output. No competitor can claim non-crossing iso-lines by drawing paths |
| F4 | **IBM Plex is actively maintained** (`@ibm/plex-mono-variable@1.0.0` 2026-07-30; Mono V2.5 2026-04-21; Sans Condensed V3.0 2025-09-23) `[V]`. The **"metric compatible with Helvetica" claim is not supported** — Plex replaced Helvetica at IBM for licensing reasons; don't let that claim enter your docs | Adopt the **variable** packages: one woff2 per family, one `@font-face`, a real weight axis |
| F5 | **Legal, not aesthetic, is the reason to stop linking Google Fonts.** LG München I, 3 O 17493/20 (2022-01-20) awarded €100 for an IP-address transfer; the Austrian DSB (2023-10-26) found a GDPR violation and stated the operative point: **no data transfers if you serve the fonts yourself** `[V/S]`. Measured: **all three templates and the guide link `fonts.googleapis.com`** `[M]`, in a system whose pitch is "zero runtime dependencies, ships off disk" | Self-host 3 variable woff2 + the OFL text. Budget with measured numbers: **Inter full 165 kB → latin subset 33 kB (~80%)**; end-to-end **315 → 33 kB (89%)**; loveholidays cut Inter 32% and gained **~6 s on a throttled link (17 s → 11 s)** `[V]`. Target 30–60 kB total. **OFL trap:** subsetting modifies the font, so ship subsets under a new family name with the licence file |
| F6 | **Correction to what this guide said a moment earlier**: `size-adjust` is **not** the blocked one. Measured against the primary data `[V]`: the `@font-face` **descriptor** `size-adjust` is C92·E92·F92·**S17** → newly 2023-09-18, **widely available 2026-03-18 — already true**, so it *is* load-bearing. What Safari lacks is the three `-override` descriptors (`ascent-`/`descent-`/`line-gap-override`: C87·E87·F89·**preview**, `font-metric-overrides` = false in web-features), and the `font-size-adjust` **property** is newly 2024-07-25 → wide 2027-01-25, so the property is enhancement and the descriptor is not | Use `size-adjust` freely — it is the portable half, and it is what fixes the x-height/advance-width jump when `Segoe UI Variable Display` or a system face stands in for Plex. **Do not build the fallback on the `-override` trio** (no Safari) or on the `font-size-adjust` property (not wide until 2027-01-25). Your `--font-stack-ui` instinct to lead with a local face is good 2026-local practice — keep it, and note that `Segoe UI Variable` is variable-*width*, so the reflow it causes differs from Arial's, which is exactly the case `size-adjust` exists to fix |
| F7 | **`light-dark()` is Baseline *newly available*, not widely**: MDN says "Baseline 2024 · Newly available · Since May 2024" `[V]`, i.e. widely = **2026-11-13, three weeks from now**. Your own `DESIGN.md` already ships exactly that pair, and the note that tried to "correct" it to Apr 2025 was arithmetically impossible (wide = newly + 30 months; FF 120 Oct-2023, Chrome/Edge 123 Feb-2024, Safari 17.5 **2024-05-13**) `[V]`. Meanwhile **shadcn still documents `.dark`-selector overriding** `[V]` — the mainstream mechanism is the class | Do **not** let a plan row "fix" `DESIGN.md` — it is right. Add a `@supports not (color: light-dark(white, black))` fallback layer for the ~3-week tail (test the **value**, never a variable: `@supports (color: var(--x))` is *always* true — a known bug shape), and publish the class-based scheme flip as the compatible path so a pre-November consumer isn't stranded. This is your single most load-bearing dependency and it currently has **no fallback** |
| F8 | Adopt the two published-identity moves that cost nothing | (1) **Published refusals** — Vercel's spec verbatim: "Reject decorative gradients, glows, blobs, glass effects, ornamental shadows, and fake depth", "Earn surfaces/boundaries only when necessary", "Default to stillness", "Design in monochrome; use color only for significant meaning" `[V]`. You already believe all four; `gpt_prompt.md` proposed two of the refusals as features. Publish the veto list — a *named refusal* is the most copyable and least-costly identity move available. (2) **A font split by data class** — Vercel assigns mono "exclusively for code, commands, paths, raw tokens, timestamps, and short operational identifiers (region, plan, SKU, account, environment IDs)" and the sans for "dates, counts, percentages, durations, financial figures" `[V]`, and no other surveyed system documents a figure-vs-identifier rule. Your "Mono means machine" principle is 80% there: write the exception list explicitly (**coordinates and bearings are machine-read → mono; measured quantities with units are human-read → sans + tabular-nums**), then gate it |

### G. Platform frontier — adopt / ignore, with dates I re-derived rather than reused

The css-platform thread re-derived the whole table from `web-platform-dx/web-features` data and
`mdn/browser-compat-data` rather than from the two notes in this repo, and in doing so found the trap
that probably produced the earlier wrong dates: the `.yml.dist` files carry **commented
per-compat-feature dates** that a naive regex reads as the feature's own status (that alone produced
16 of 18 false "violations" of the 30-month rule in its first run). It also verified the rule from the
implementation (`compute-baseline/…/baseline/index.ts:40` `months: 30`, with pinned tests) rather
than from prose `[V]`.

| verdict | the dates that decide it, and the reason |
|---|---|
| **Adopt, already load-bearing** | `@layer` (2022-03-14→2024-09-14), `:has()` (2023-12-19→**2026-06-19**), size container queries (2023-02-14→2025-08-14), `color-mix()` 2-arg (→2025-11-09), nesting (→2026-06-11), `scroll-snap`, `prefers-reduced-motion`, `forced-colors` (→2025-03-12) `[V]`. You use `@layer` and `:has()`; you use **4 `@container` rules total** and **0 named containers** while `.c-table` carries 45 rules — container-query-driven density is the documented answer to `gemini`'s "adaptive density tokens", at zero JS cost |
| **Adopt progressively** | `@property` (widely 2024-07-09) — you register only `--brand-hue`, `--radius-scale`, `--density`; register the theme/scheme bridge and the chart series so they animate and inherit predictably. **Anchor positioning** (core newly 2026-01-13) — your tooltip is already `@supports`-gated; `anchor()` appears **0 times** and `position-area` once, so finish it *and* declare the static-position fallback, because the aggregate is still Limited (`position-visibility` shipped only in Safari 27). **`contrast-color()`** (newly 2026-04-10) — put it *after* a hand-picked `color:` that already passes 4.5:1, on the eight `--color-on-*` tokens only; MDN warns AA is not enough for mid-tones and engines may differ `[S]`. **`field-sizing`** (newly 2026-06-16) on textarea/search, with `rows` still present. **`@starting-style`+`allow-discrete`** for popover fade. **`text-box`/`text-box-trim`** as polish only (key newly 2026-08-18; unsupported = your optical grid is off by half a leading) |
| **Watch, do not build on** | Scroll-driven animations — **upgraded from `[U]` to `[V]` by the landing thread's final pass**: `web-features` data.json still records Firefox absent from `animation-timeline` **and that is correct only until 2026-10-27**, four days from now, when Firefox 159 ships it by default → Baseline **newly available 2026-10-27**, widely **2029-04-27** `[V]`. So the plan conclusion is unchanged but now *dated*: after the 27th it becomes a legitimate decoration behind `no-preference`, and still not anything load-bearing for two and a half years. Same-document View Transitions (newly 2025-10-14, widely 2028-04-14) — needs JS, so guide-only at most. `sibling-index()` (newly 2026-08-18). `@scope` (newly 2026-03-24) — the honest use is keeping the *guide's* frame out of a specimen's cascade, which is an `assets/` problem, not a `src/` one |
| **Refuse** | `@function`/`@apply` — Chrome/Edge only, MDN "not Baseline", and **`@apply` has no compat key at all** in data.json, i.e. unimplemented everywhere `[V]`. CSS **Paint Worklet** — Chromium-only, MDN not-Baseline `[V]`, so a paint-worklet contour texture is off the table. `interpolate-size`/`calc-size` (F✗ S✗). Variadic `color-mix()`. `hidden="until-found"` (C1). **`@media (contrast)`** — no BCD key at all `[V]` — which is *not* the same feature as `prefers-contrast`, now moved out of this row: `[U]` in my earlier draft, **resolved** by the platform thread from BCD — `prefers-contrast` is C96·E96·**F101**·S14.1, newly 2022-05-31, **widely available 2024-11-30** → **load-bearing** `[V]`. That retires the `sota-2026.md` "[U] Firefox does not support it" note, and it means your `@media (prefers-contrast: more)` rule at `utilities.css:395` (2 occurrences, `[M]`) is *not* riding on a two-engine feature — it is a legitimate shipped mechanism. It does **not** oblige a fourth *named* set (J1 moved all four out); it does mean a product can key one to a query that actually reaches Firefox |
| **Perf** | `content-visibility` is usable (feature newly 2025-09-15) but **note the level you quote** — the *feature* and the *key* differ by a year, and quoting the wrong level makes a claim unfalsifiable. The 9,553-line guide is the right page for it; skip-paragraphs without `contain-intrinsic-size` = CLS, so measure first `[V]`. `light-dark()` in **image** values: newly 2026-09-14, widely 2029-03-14 — do not use, exactly as `DESIGN.md` already says |

### H. Adoption economics — reframe the pitch, because the evidence does

| finding | number | so what |
|---|---|---|
| Adoption is a distribution, not a binary | fully **7%** · widely 31% · moderately 38% · minimally 22% · not at all 1% (n=147) `[V]` | while **trust is 91%**. The gap is the *usability of deviation*, not belief |
| Teams are small and understaffed | 61% don't have enough people; understaffing rises with federation (centralized 53% → **federated 74%**); 61% of teams are ≤5 people; org designer:dev ratios **1:11 → 1:53** `[V]` | Sell **headcount substitution**, not polish: "what a four-person team can ship". A zero-dependency, no-build-step system *is* a staffing answer, and that is a measurable claim rather than an aesthetic one |
| The stack is 94% web, 72% React, 36% web components | `[V]` | A CSS-first system targets the whole web slice, not one framework's 72% |
| **Restrictiveness kills adoption** — first person, with the mechanism | "there were almost no escape hatches… That was entirely on purpose. It solved our original problems, but it meant many devs struggled to adapt. No amount of training or documentation seemed to be helping" `[V]` | **This argues against Contour's own instinct.** "A raw hex value in a component is a bug", a census that must pass, `light-dark()` everywhere, the ownership boundary — that is a maximal-restriction system. Keep the restriction **inside `src/`** and make deviation *legible and first-class* (`.c-theme-scope`, a documented per-component escape-hatch recipe, the hue knob). Adoption is 7%; the escape hatch is the product |
| Density is where expressive differentiation fails | M3 Expressive backlash, verbatim: **"five lines of text instead of ten"**, "optimises for first-run discovery over thousands of uses", "RIP small phones" `[S]` | Never ship a default variant that costs the operator rows of data. Expressive sets belong to the consumer (J1); the system ships `light`, `dark` and `high-contrast`. This is measurable on your own dashboard surface with `component-inventory.mjs` |
| Playwright Component Testing is now **stable and framework-agnostic** | `experimental-ct-*` packages removed; "if your dev server can render it, Playwright can test it" `[V]` | **The one 2026 shift that makes a no-runtime system cheaper to test than a React one** — no JSX boundary, no `ctViteConfig`. Your specimens are renderable markup; Storybook (61% of systems `[V]`) is not required for a state sweep |
| Visual regression: the OSS middle shrank | **Lost Pixel archived 2026-04-22** (team joined Figma); Percy's pricing no longer public; Chromatic's pixel layer proprietary `[V/S]` | Playwright's own `toHaveScreenshot` (free, Apache-2.0, active) is the consistent choice for a system that refuses a build step. Adding a vendor is not |
| Nobody measures adoption honestly | Mews: build-time `data-ds-element` stamping, production ratio 53%/60%, **+0.5%/month, reported with deliberately no pass/fail threshold** `[V]`; the circulating "85% reuse"/"70–80%"/ROI numbers (Atlassian 40%, Forrester 8.2%, "~37% faster") are **unciteable** `[U]` | Your equivalent needs no Babel: `document.querySelectorAll('[class*="c-"]')` over the guide is nearly the whole numerator. **Copy the shape; never invent the target.** Two defensible ROI numbers exist and only with their caveats: Sparkbox's 47% (n=8, self-caveated), Figma's 34% (n unstated, self-labelled "maximum savings") |

### I. Composition — the actual gap in your own product

`inventory()` says **0 of 134 blocks lack a specimen** and every gate is green, and yet **no template
uses `c-map-area`, `c-map-panel`, `c-map-slot`, `c-map-footer`, `c-layer-switch`, `c-scale-bar`,
`c-bivariate` or `c-time-range`** `[M]`. 49 of 134 blocks appear in a template; **85 are
specimen-only**. `templates/dashboard.html` is a chart-and-table dashboard with no map.

So: the differentiator is documented and undeployed. The system proves the parts render; the pages a
consumer copies never assemble them. This is the same failure shape as §0.2 — implementation without
consumption, invisible to a gate that counts specimens rather than compositions.

| # | action | cost |
|---|---|---|
| I1 | Give `templates/dashboard.html` a **map workspace**: `c-map-area` + `c-map-panel` + `c-layer-switch` + `c-scale-bar` + `c-time-range` + `c-readout` with a real lon/lat/precision contract + attribution band | M |
| I2 | Add a gate: every spatial-family block must appear in **at least one template**, not just the guide. Extend `component-inventory.mjs` with a `--surface` mode that reports blocks specimen-only per surface | S |
| I3 | Add the **"recipes" that the prompt docs keep proposing but you don't ship**: a bivariate legend over a two-variable field; a survey line under a KPI (`12.4 m ±0.3 · WGS84 · 2026-06-14`); the instrument strip as a dashboard header rail. Each is a *decision* specimen — the place where the "measured quantity" grammar either reads or doesn't | M |
| I4 | Fix the double-load: `templates/{dashboard,documentation}.html` link `patterns.css` **and** `ds.css`, which already imports it — measured 1,019 rules vs 971 on landing, i.e. **48 duplicate rules** (10,292 B, ~5% of `contour.css`) `[M]` | S |

### J. The niche gap — stated in the competitors' own words, and one naming problem

The claim in §0.3 ("nobody has shipped the token layer for map chrome") is not my inference; it is
what the neighbouring projects ask for, verbatim `[V]`:

- **`github.com/maplibre/maplibre-gl-js` issue #4964** and **`github.com/maplibre/maputnik` #909**
  both ask, in their own words, for a **token/theme layer for map styles** — the thing Contour's
  token architecture is structurally suited to provide and nobody in the niche has built.
- **Calcite — the closest neighbour, and the strongest evidence — ships 59 components and not one of
  them is map-specific** `[V, counted on the components index today]`: no zoom control, no legend, no
  scale bar, no coordinate readout, no layer switcher. Those exist as *SDK widgets outside the design
  system*. Contour ships `c-map-slot`, `c-map-panel`, `c-map-area`, `c-layer-switch`, `c-scale-bar`,
  `c-readout`, `c-bivariate`, `c-time-range` — **and puts none of them in a template** `[M]`. The gap
  argument is won; the delivery is not.
- **Mapbox's answer to the same request is a base64 LUT** (`theme-data`) `[V]` — un-diffable, not a
  token, cannot appear in a docs table. That is the counterfactual worth publishing: the alternative
  to a token seam is an opaque image.
- **MapLibre is at v6.15.0 (2026-10-18) and v6 is ESM-only and throws without WebGL2** `[V]`. That is
  in direct tension with "link it off a disk". Name the target explicitly (`MapLibre ≥6`) and state
  which chrome contract applies, or a reader will assume the templates run on their map and find
  they do not.
- deck.gl v9.0.0 shipped **2024-03-21**, Mapbox GL JS v3.0.0 **2023-11-29** `[V, primary APIs]` —
  both dates in circulation (and in `tmp/r2/sota-research.md`) are wrong by a year in places. Use
  these.

**J1 — these four sets are not Contour's to keep.** Ruling from the maintainer (2026-10-23):
`positron`, `dark-matter`, `voyager` and (asked directly) `high-contrast` are **ad-hoc rules that
belong to airship/libreship, and must be declared there to extend Contour**. So the action is not a
rename — it is a **move**, and it has been executed. Measured state of that move `[M]`:

- **The consumer already declares all four** — `libreship/packages/styles/src/tokens/index.css`
  lines **457 / 485 / 515** plus its own `high-contrast`, each with a class alias
  (`.ls-theme-positron`). A cross-repo scan of both stylesheets returned Contour themes
  `[dark-matter, high-contrast, positron, voyager]` against libreship's
  `[dark, dark-matter, high-contrast, positron, voyager]` — the product was already a superset, so
  `src/css/tokens.css` was the duplicate, not the original
  (reproduce: `python3 tmp/q/theme-namespace-compare.py`).
- **The two declarations are disjoint in token names, and that is the real defect.** Contour's
  `positron` block writes twelve `--color-*` tokens; libreship's writes `--ls-*` tokens; **the shared
  set is empty**, and both are reached by the *same* `[data-theme='positron']` selector. One intent,
  two unrelated namespaces, resolved by whichever stylesheet parses later. The system is silently
  participating in a decision that is not its own.
- **Deleting the four blocks cost 0 unique tokens** — verified after the fact: each of the twelve
  they wrote is also declared in `:root` (`--color-canvas` and its eleven siblings were declared **5×**
  each, `--color-primary` **6×**), so the stamped `tokens: 272` and `components: 134` did not move;
  only declaration lines did, **348 → 312**. Reproduce with `node tools/lib/inventory.mjs` via
  `node -e "import('./tools/lib/inventory.mjs').then(({inventory})=>console.log(inventory().tokens))"`.
- **What stays is the mechanism, not the sets:** the `[data-theme]` extension point and the
  `.c-theme-scope` re-derivation. `high-contrast` went too once asked — a named set is a product
  decision even when the motive is accessibility, and a product that wants a conformance tier can
  declare one against the same contract.
- **All seven places were updated — six by this pass, one by the sibling session** `[M]`: the
  `17. THEME SET` comment in `tokens.css` now describes the contract and names no set; `index.html`'s
  switcher offers Default + `daylight`; `DESIGN.md` front matter is `themes: [light, dark]` with the
  prose rewritten; `llms.txt` states the extension point; `CHANGELOG.md` carries a `### Removed` entry
  with the measurements. `AGENTS.md:17` is protected from my edit tool, so it was flagged rather than
  worked around, and it has since been corrected in this same tree to *"Dark and light themes, 134
  components, 272 design tokens"*. A repo-wide grep for the product names now returns **0** hits in
  `AGENTS.md`; the only surviving mentions anywhere are three prose lines that *attribute* them to
  libreship (`index.html:9129`, `assets/css/docs.css:1083–1084`) — one naming point, grep-able.
- **The harness improved beyond a rename.** `contrast-and-aria.mjs` now **reads the set names out of
  the guide's switcher** and fails if it finds none, so the class of bug where a gate sweeps a literal
  list that no longer matches the CSS is structurally gone — the same lesson §K exists to teach.
- **Replaced with a recipe, not a void.** The guide now *is* the worked example: it declares one set
  of its own, `daylight`, in `assets/css/docs.css` under `@layer tokens` (same layer as the deleted
  blocks, so cascade position is unchanged), carrying the `color-scheme` line that must travel with
  it. That answers `gemini_prompt.md`'s "Contextual Token Sets" and `gpt_prompt.md`'s
  "Editorial / Reference / Analytical modes" honestly: a mechanism plus a recipe, not four built-in
  themes. Verified in Chromium with a liveness control and a bogus-name control
  (`tmp/q/verify-move.mjs`): on a consumer page loading only `dist/contour.min.css`, all five names
  are **inert**; in the guide, `daylight` repaints five semantic tokens and the product names stay
  inert. A `data-theme="__no_such_set_zzz__"` read as inert on both, which is what licenses the
  "inert" results above.

**The naming problem is a consequence, not the issue** — and one line is still worth it wherever the
sets land. **Positron, Dark Matter and Voyager are CARTO's three basemap styles** ("Positron: a light
gray basemap with dark-colored text", "Voyager: the default basemap in CARTO Builder";
`carto.com/basemaps`, `github.com/cartodb/basemap-styles`, and the Stamen post that introduced the
first two) `[V]`. A "positron theme" therefore reads to every GIS reader as *a quiet light basemap* —
and per D9 a CSS custom property cannot reach a basemap at all, so the name advertises precisely the
capability §2 shows is unbuildable. Renaming fixes neither half; moving them to the product that
chose the names does.

### K. Make the claims keep themselves true — the gate program

Every defect in §0.2 and §3.A is a *claim outrunning a check*. The fix is not more prose; it is the
seven gates below, all of them in the shape the repo already uses (a script that exits non-zero, in a
CI lane that must run or must fail — a gate that silently does not run is a gate that passes).

| gate | asserts | catches |
|---|---|---|
| `check-claims.mjs` | every `--token` named in README/DESIGN/llms/guide prose is declared in `tokens.css`; every published range (`1…N`) matches the declared count | `--color-panel` (does not exist), `--chart-dash-1…6` (8 declared) `[M]` |
| `series-contrast` (**widen the existing check, don't rewrite it**) | all 8 series ≥3:1 vs **all six** `SURFACES` (including `surface-raised`, measured by neither the gate nor my probe), both themes, plus **adjacent-series** separation | the gate asserts `surface-1` alone and discards its own `vsSurface2`; measured margin on `surface-3` is **3.03:1** against 3.66:1 on the gated surface; the 1↔7 pair sits at ΔE 7.4–7.9 `[M]` |
| `ramp-shape` | `--chart-seq-*` monotone in L with a stated ε; **heat refused in any ordinal role** | heat's non-monotonic L (.71 .78 .78 .704 .77 .6236 light) `[M]` |
| `legend-parity` | for every `data-series` 1…8, the legend key **paints** (computed `background-image ≠ none` or a non-transparent colour) and its pattern equals `--chart-dash-N` | series 1's invisible key `[M, liveness-controlled]` |
| `def-reachability` | every `url(#id)` in `src/css` resolves to an id defined **inside `src/`**, and any def a consumer must inline is documented as *inline*, not *include* | `#contour-hatch-missing` defined only in `index.html`; the sprite whose `fecolormatrix` is an unknown element when parsed as XML `[M]` |
| `motion-contract` | every `animation: … infinite` is either ≤5 s of blinking, or paired with an on-page pause/stop/hide mechanism, and the guide ships that control | WCAG 2.2.2 (Level A) on `.c-dot--live` `[M]` |
| `markup-hygiene` (K7) | every `templates/*.html` carries `og:image` + `twitter:card`, and every font-CDN link it retains carries a matching `rel=preconnect`; the guide's own document is checked too | 0 `og:image`/`twitter:card` in `index.html` **and** the landing template; `templates/landing.html` has 0 `preconnect` while the guide has 2 `[M]` — the shipped template is slower than its own documentation |

Add one **claim register** (`tools/claims.json`: sentence → owning command → threshold → last run) and
have `stamp --check` fail on an unowned claim. That is the structural answer to this repo's dominant
failure mode; the individual fixes above are small, and the reason they recurred is that nothing
owned the sentence.

## 3.9 Executed after this guide was first saved (2026-10-23)

Three rows above are now done, so they read as history rather than to-do. Measurements below are
from the repo's own gates and the regenerated `tmp/audit/contrast-and-aria.json`; re-run them
rather than trusting this text.

- **A3 — done, and it found the claim was narrower than the prose.** `contrast-and-aria.mjs` now
  sweeps all eight `--chart-N` against all six `SURFACES` in both themes and asserts every pair at
  `SERIES_MIN = 3.0`; the discarded `vsSurface2` is gone. It also fails if the sweep returns fewer
  than `8 × SURFACES.length` pairs, so a narrowed enumeration cannot pass quietly — the same rule
  that owns a published number must own its own coverage.
  ```
  pairs: light 48 dark 48        harness exit=0
  binding light: --chart-6 on --color-surface-3 = 3.05:1
  binding dark : --chart-8 on --color-surface-3 = 3.63:1
  ```
  Two corrections to what I asserted earlier in this document. `--color-surface-raised` is **not**
  a sixth distinct surface: it resolves byte-identically to `surface-1` in light and `surface-2`
  in dark (verified 8/8 per theme), so the widening bought four new *distinct* surfaces, not one.
  And the "0.03 headroom" figure in §0.2 was my own estimator, not the gate's — the gate's canvas
  path puts the binding pair at 3.05, so the honest margin is **0.05**, on a pair that had never
  been asserted before. My earlier probe reporting `1.07:1` everywhere was a bug of mine
  (`getComputedStyle().color` returns `oklch(…)`, and I parsed the hue as a blue channel) and is
  withdrawn, not reconciled.
- **D4 / `legend-parity` — done, and now gated.** `.c-legend__swatch--line[data-series="1"]` paints
  a solid bar (`background-color: var(--c, var(--chart-1))`) instead of a 32×3 transparent gap, and
  all seven dash rules read `var(--c, var(--chart-N))` — matching `.c-chart__point`'s existing
  discipline, so a consumer omitting `--c` gets a wrong-coloured key rather than an invisible one.
  `grep -oE 'var\(--c\)'  src/css` → **0 hits** (the fallback was added on every path, not one).
  A new parity gate builds one key per series from the live cascade and fails if a solid series
  paints no colour, a dashed series shows no pattern, any key paints nothing, or the sweep came up
  short. It is discriminating, not vacuous: series 1 → `color=true, image=false`; series 2–8 →
  `image=true`. Before/after in the same cascade: `[1] → []` keys painting nothing.
- **A1 — done.** `--chart-dash-1…6` → `1…8` in `README.md`, `DESIGN.md` and `llms.txt`; the
  contract sentences now name the enforcing command and its exit condition instead of a pair count.

Full suite after the change, exit codes read unpiped: `build`, `check-size`, `check-dist`,
`check-export`, `check-tokens`, `check-ownership`, `stamp --check`, `snippets`,
`contrast-and-aria`, `component-inventory`, `family-gate`, `html-validate` → **all 0**, and
`index.html` is still a snippets fixed point.

**Still open from this guide, unchanged:** the dangling `#contour-hatch-missing` (§I/`def-reachability`),
the WCAG 2.2.2 pause mechanism (`motion-contract`), the un-composed spatial family in the templates
(I1), and the self-hosted variable fonts (F5). `AGENTS.md:17` is confirmed clean — a repo-wide grep
for the product names returns **0** hits there.

## 4. Sequence

The order below is by (does it make a published claim true) × (cost) × (does it unblock something).

**Now, this week — cheap, each one closes a claim that is currently unowned**
1. A1 `--chart-dash-1…8`, A2 kill `--color-panel` phrasing, A4 README duplicate. (Minutes.)
2. D-legend: paint series 1's key, add `--c` fallbacks. (≈5 lines; the marquee rule is visibly broken in the guide today.)
3. **F7 `light-dark()` fallback layer.** Widely available **2026-11-13 — 3 weeks out**, and there is currently none. This is the only item on the list that can render a consumer's page *colourless*, and it is a `@supports` block.
4. D10 live-indicator pause (Level A, and the fix is one attribute the system already has the shape for).
5. I4 templates double-loading `patterns.css` (48 duplicate rules); I1 give the dashboard template a map.

**Next — the identity and the interop, both bounded**
6. B1–B6 the DTCG-shaped export + validator, and `components.json` as a contract instead of 134 strings.
7. F5 self-hosted variable fonts (one `@font-face` per family, latin subsets, OFL text) — legal *and* payload.
8. J1 move `positron`/`dark-matter`/`voyager` out of `src/` into airship-libreship, which already declares them (`packages/styles/src/tokens/index.css:457/485/515`). Keep the `[data-theme]` mechanism and `high-contrast`; update the seven places that hard-code the names, **including the contrast harness's theme sweep at `contrast-and-aria.mjs:343`**, or the gate silently measures nothing. Measured: 0 unique tokens lost, 348 → 312 declaration lines.
9. D1–D5 the colour gates + cyclic ramp (the gate program in §K is what makes the palette claims sayable).
10. C6/C7 the two a11y contract fixes (scrim `inert` + `scroll-padding`; live-region roles off static callouts).

**Then — the differentiation, which needs the above to be quiet first**
11. D9 the basemap seam, D6 classification/units/normalisation disclosure, D7 precision contract, D8 attribution band. Together these are the "token layer for map chrome" the niche asks for and nobody ships.
12. E1–E2 registry distribution + an agent-rules artifact (both are files, not runtimes).
13. L1–L6 landing re-organisation; C4 executed examples; C3 machine-facing docs twins.
14. F8 publish the veto list and the data-class font rule — the two cheapest identity moves available, both already believed.

## 5. What to refuse (each refusal is evidenced, not stylistic)

- **`@function`/`@apply`, Paint Worklet, `interpolate-size`/`calc-size`, `hidden="until-found"`,
  variadic `color-mix()`, `::picker`/`appearance: base-select`, `@media (contrast)`** — not Baseline,
  or Safari/Firefox-blocking `[V]`. `@apply` has **no compat key at all** in web-features data: it is
  unimplemented everywhere. `prefers-contrast` is **removed from this list** — the landing/platform
  threads settled the repo's old `[U]`: Firefox has had it since **101**, and the feature is widely
  available since **2024-11-30** `[V]`. What is *still* refused is a fourth **named** set (J1 cleared
  all four out) and the distinct `@media (contrast)`, which has no BCD key. Rule 11 in `AGENTS.md`
  (the native select list) is *confirmed*, not legacy.
- **A charting dependency, or "we render charts for you".** `@carbon/charts` shipped ten releases in
  five months, all of them "Version bump only" `[V]` — that is what a chart library looks like when it
  is finished being interesting. Your `Chart geometry contract (T-136)` already states this ceiling
  honestly; keep it.
- **View Transitions as a feature** — one year newly-available, cross-document Limited, and needs JS `[V]`.
- **An expressive default theme, or any default that reduces data density.** The M3 Expressive
  backlash measured in users' own words: *"five lines of text instead of ten"*, *"optimises for
  first-run discovery over thousands of uses"* `[S]`.
- **Live `feTurbulence` grain, `backdrop-filter` growth, glass.** 10–20 ms/tile; animating inside a
  blurred element ≈20% CPU + 17% GPU while DevTools paints 0 ms; live turbulence re-rasterises every
  frame; a WebKit bug makes large-radius blur paint in **10 s+** `[V/S]]. Bake a 256×256 tile if you
  want grain at all.
- **Dark-mode-first as a product bet, and the "92% of developers prefer dark mode" line.** That
  statistic does not exist — the Stack Overflow survey has no dark-mode question in any year
  2022–2026 `[V]`; the real experiment (n=134) found **no polarity wins and preference does not
  predict best polarity** `[V/S]`. Ship both, measured — which you already do — and say *that* instead.
- **Importing the citations in §2's last row** (40%/18 months, Design Systems International, NN/g 2025
  adoption research, colour +80%, Inter-is-#1-at-crawl-scale, "The Brand Growth Bible" by John Philip
  Jones — which is not that book's title). Each was searched for and not found `[V-negative]`.
- **A "state completeness" claim borrowed from `gemini_prompt.md`'s table.** The phrase is not used by
  Atlassian or Polaris in any source opened `[V-negative]`; ship the states (you have them) and cite
  WCAG 4.1.3 for the announcement half, which is real.

## 6. Confidence, and what I could not check

**Strong** (first-hand, reproducible, this repo): every number in §1; the legend, CVD, hatch-ownership,
2.2.2, cyclic-ramp, dash-count, composition and double-load findings; the Baseline dates and the 30-month
arithmetic (re-derived from `web-features`/`BCD` data, not from the two notes in `tmp/`).

**Medium** (primary page opened, one step removed or `[S]`-flagged by the thread): Calcite 5.0/5.1
details, Vercel's `vercel-brand.css` token surface, shadcn registry/`create` styles, all adoption
figures (n=147, self-selected vendor audience, **no published methodology**), the landing anatomy
(copy/section order solid, *visual* claims weak — the fetcher cannot see CSS; Resend and Supabase
returned **agent-manifest markdown**, not their human homepages, so "no hero visual" is a claim about
their machine surfaces), colour-map papers, the GeoLinter thresholds, font-subset byte figures, DOJ
Title II dates (**fast-moving — re-check before publishing**).

**Could not verify, and therefore not asserted here**: Material 3 Expressive's "35 shapes / Motion
Physics System" (Google's blog is JS-rendered; body never fetched), the widely-repeated "46 studies /
18,000 participants / 4× faster" (not on Google's page), whether `@primer/brand-css` really generates
CSS *from* React source (npm 403'd — the single highest-value unverified item, since it is the inverse
of Contour's architecture), Style Dictionary's exact 2025.10 coverage, `custom-elements.json` as a
component-manifest target (404), the `hidden="until-found"` Firefox/Safari behaviour contradiction
between two sources, and Safari's recorded JPEG XL version, which the landing thread called
"implausible enough to re-verify in a browser before repeating" `[U]`.

**Two items that were open earlier in this draft are now closed.** The Firefox-159 date is
**verified**, not forecast: MDN's Firefox 159 page was fetched, so scroll-driven animations become
Baseline newly available **2026-10-27** and widely **2029-04-27** — the conclusion in §G stands, but
it is now dated rather than provisional. And JPEG XL is **not dead**: `web-features` records a
`jpegxl` feature with Chrome 155 (2026-10-06) and Firefox 158 (2026-10-13), i.e. support returned in
the last three weeks while Edge is recorded absent — so "do not budget for it, it is not Baseline" is
right and "Chrome removed it in 111, it is dead" is stale `[V]`.

**All eight research threads have landed** and are cited above (`tmp/q/`: `benchmarks-2026.md`
763 ln, `adoption-evidence.md` 881, `ai-readiness-2026.md` 982, `docs-dx-2026.md` 768,
`dashboard-dataviz-2026.md` 1349, `css-platform-2026.md` 676, `brand-and-geo-landscape.md` 935,
`landing-2026.md` 1037 — **7,391 lines** of sourced notes total). §3.L and §F6 use the landing
thread's final text; where its last pass disagreed with my draft, the draft was corrected rather than
the disagreement left implicit (the `2 of 20` → `1 of 20` cohort count in L7, and the
`prefers-contrast` refusal in §5/§G).

Two threads carry a self-correction that matters to §2 and §G, recorded in the files rather than
hidden. The ai-readiness thread initially asserted "`registryDependencies` is a
`registry-item.json` field" and then **retracted it** against the live schema (only `item-links`
documents that key today). The css-platform thread found that **`.yml.dist` files embed per-key
Baseline dates as YAML comments**, which is almost certainly the source of the wrong dates in this
repo's two earlier research notes — 16 of its first 18 apparent 30-month "violations" were that
artifact — and that **BCD now writes `"edge": "mirror"`** for Edge, which a naive reader treats as
"unsupported" (agreement 4/25 → 21/25 once fixed). The landing thread falsified one of **this
guide's own** claims in the time it took to write it; that correction is in §F6 rather than edited
out, because it is the same failure mode §K exists to catch.

## 7. Sources

Full bare-URL lists live at the end of each `tmp/q/*.md`. The load-bearing ones for the claims above:

Platform: https://cdn.jsdelivr.net/npm/web-features/data.json ·
https://web.dev/baseline · https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark ·
https://github.com/mdn/browser-compat-data

Benchmarks: https://developers.arcgis.com/calcite-design-system/releases/summaries/2026-02/ ·
https://developers.arcgis.com/calcite-design-system/components/ ·
https://github.com/carbon-design-system/carbon/releases ·
https://github.com/carbon-design-system/carbon-charts/releases · https://vercel.com/design ·
https://ui.shadcn.com/docs/changelog · https://ui.shadcn.com/docs/registry ·
https://ui.shadcn.com/docs/theming · https://github.com/primer/brand ·
https://primer.github.io/brand/introduction/mcp/ · https://github.com/material-components/material-web/releases ·
https://github.com/adobe/react-spectrum/releases · https://blog.google/technology/google-developers/google-io-material-3-expressive/

Adoption: https://report.zeroheight.com/2026 · https://playwright.dev/docs/test-components ·
https://dl.acm.org/doi/full/10.1145/3706599.3706705 · https://www.nngroup.com/articles/design-systems-101/ ·
https://almanac.httparchive.org/en/2025/fonts · https://2025.stateofcss.com/en-US/features/

Data: https://matplotlib.org/stable/users/explain/colors/colormaps.html ·
https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0199239 ·
https://arxiv.org/html/2107.02270v3 · https://arxiv.org/html/2310.13707 ·
https://www.chintseng.com/papers/EuroVIS24_Sequential.pdf · https://arxiv.org/abs/2409.10841 ·
https://datatracker.ietf.org/doc/html/rfc7946 · https://docs.mapbox.com/help/dive-deeper/attribution/ ·
https://docs.mapbox.com/map-styles/guides/standard-styles/ ·
https://data.europa.eu/apps/data-visualisation-guide/choropleth-classification-methods ·
https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html ·
https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html

Docs/AI: https://llmstxt.org/ · https://ahrefs.com/blog/llms.txt-study/ ·
https://developers.google.com/search/docs/fundamentals/ai-optimization-guide · https://pagefind.app/docs/ ·
https://docsearch.algolia.com/docs/who-can-apply/ · https://nextjs.org/docs/app/getting-started/installation ·
https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html ·
https://docs.deno.com/runtime/test/doc_tests/ · https://shiki.style/packages/transformers ·
https://www.designtokens.org/tr/2025.10/ · https://modelcontextprotocol.io ·
https://web-platform-dx.github.io/web-features-explorer/features/hidden-until-found/ ·
https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role ·
https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured.html

Brand/geo: https://carto.com/basemaps/ · https://github.com/cartodb/basemap-styles ·
https://developers.arcgis.com/calcite-design-system/foundations/accessibility/ ·
https://github.com/maplibre/maplibre-gl-js/issues/4964 · https://github.com/maplibre/maputnik/issues/909 ·
https://maplibre.org/maplibre-gljs/CHANGELOG.md · https://github.com/IBM/plex/releases ·
https://www.theregister.com/offbeat/2022-01-31/google-fonts-lands-website-privacy-fine-by-german-court/1494285 ·
https://www.vitlaw.com/ · https://machs.space/posts/web-font-optimization-subsetting-fonts/ ·
https://tech.loveholidays.com/optimising-web-performance-reducing-font-loading-impact-with-font-subsetting-d8444b6cddba ·
https://developer.chrome.com/blog/framework-tools-font-fallback · https://bugs.webkit.org/show_bug.cgi?id=316769 ·
https://www.nngroup.com/articles/liquid-glass/ · https://infinum.com/blog/apples-ios-26-liquid-glass-sleek-shiny-and-questionably-accessible/ ·
https://www.jonkolko.com/phd/writing/25-07-12-homogenization-of-web-design ·
https://cotton.design/work/boundary-analytics · https://d3js.org/d3-contour/contour ·
https://survey.stackoverflow.co/2025/developer-profile/ ·
https://www.contagious.com/en/article/news-and-views/byron-sharp-how-brands-grow-ignores-60-years-of-published-work-felipe-thomaz ·
https://www.insights4print.ceo/2019/02/color-increases-brand-recognition-by-80-the-real-contents-of-the-loyola-study-revealed/

## 8. Appendix — reproduce

Every measured number: `tmp/q/local-measurements.md` (findings, withdrawn results and all), with the
probes alongside. Each server binds an ephemeral port and prints its own pid, so nothing here reuses a
stray listener.

```bash
node tools/stamp.mjs --json          # published numbers, computed from src/
node tools/check-tokens.mjs          # census + ledger
node tools/audit/contrast-and-aria.mjs   # browser-measured contract
node tmp/q/probe3.mjs                # layer membership, with opposite-answer controls
node tmp/q/probe10.mjs && node tmp/q/probe11.mjs   # colour: validated math + phantom census
node tmp/q/probe19.mjs               # legend keys paint / do not paint, liveness-controlled
node tmp/q/probe21.mjs && node tmp/q/probe22.mjs   # --brand-hue self-test, then 0..360 sweep
node tmp/q/probe23.mjs && node tmp/q/probe24.mjs   # SVG defs: casing, XML vs HTML parse, reachability
node tmp/q/consumption2.mjs          # specimen vs composition (or: import tools/lib/inventory.mjs)
```
