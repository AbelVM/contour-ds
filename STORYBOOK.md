# Storybook for Contour

Storybook is an **optional development and review workshop** for the Contour
web-component layer. It is not a consumer deliverable and does not replace
`index.html`, the generated snippet pipeline, or the contract gates.

## Prerequisites

- Node.js >= 18 (CI uses 24).
- npm (lockfile committed).
- Chromium (installed via `npx playwright install --with-deps chromium`).
- A built design system: `node tools/build.mjs` (Storybook imports `dist/`).

## Commands

| Command | What it does |
|---|---|
| `npm run storybook` | Start the dev server on port 6006. |
| `npm run build-storybook` | Build the static Storybook site into `storybook/` (gitignored). |
| `npm run test:storybook` | Builds, serves the static site on loopback and runs the interaction/a11y suite via Vitest + Playwright. |
| `node tools/storybook-tests.mjs` | Run the suite against the existing `storybook/` build (no rebuild); the server is started and stopped by the script. |
| `npm run check:storybook-coverage` | Coverage report; fails on zero stories or invented elements. |
| `npm run check:storybook` | Compose the three above. |
| `npm run screenshot:baseline` | Capture deterministic screenshots (requires a running Storybook server). |

The MCP addon exposes the local Storybook MCP server at `/mcp` during development.
It is intended for local agent-assisted story authoring and testing; do not expose
the development server publicly.

## Ownership

- **Maintainer:** Contour core maintainers.
- **Story changes** require review when a WC API changes; stories must not
  invent classes, tokens, attributes, events, slots, parts, or states absent
  from `contour.components.json`, `API-CONTRACTS.md`, or `src/js/wc/`.
- **A11y exceptions:** a story may set `a11y: { test: "todo" }` only with a
  linked task/issue ID and `a11yTodo` metadata containing `owner`, `rootCause`,
  `mitigation`, and `review`. Disabling a11y (`test: "off"`) is never allowed.

## CI integration

A dedicated `storybook` job runs in `.github/workflows/ci.yml`:
`build` → `build-storybook` → `test:storybook` → `check:storybook-coverage`.
It is independent of the `validate`, `contract`, and `test` jobs and does not
weaken them.

## Rollback criteria (SB-28)

If the pilot misses any of these thresholds, remove the Storybook tooling and
retain the compact §23 contract without weakening existing gates:

- `npm run storybook` fails to start from a clean checkout.
- `npm run build-storybook` fails or imports guide-only assets.
- Storybook test flake rate exceeds 5% across 10 consecutive runs.
- Clean-install size or build time exceeds the recorded baseline by 25%.
- Maintenance burden (story updates per WC API change) exceeds 2 hours per change.

## Evidence report (SB-29)

Record for each release review:
- Changed files (storybook config, stories, tools, CI).
- Commands run and versions (Node, npm, Storybook, Vite, Playwright).
- Timings (clean install, startup, build, test).
- Coverage output (`tmp/audit/storybook-coverage.json`).
- Screenshot baseline result.
- A11y `todo` IDs and remaining risks.
- A11y todo metadata is reported in `tmp/audit/storybook-coverage.json` and is
  rejected when any owner, root cause, mitigation, or review date is missing.

## Storybook manifests (SB-18)

Storybook 10 supports Custom Elements Manifests (CEM) for automatic argTypes
extraction via the `manifest` option in `.storybook/main.js`. The
`@custom-elements-manifest/analyzer` package is not currently installed, and
the WC layer's observed attributes are already published in
`dist/contour.components.json` (SB-04b). Enabling CEM would add a dependency
and a generation step for marginal benefit. Decision: keep disabled; revisit
when the analyzer is added to the dev dependencies or when Storybook's manifest
API stabilizes. `agent-rules.json` and `llms*.txt` remain authoritative.

## Measured evidence (SB-29)

- Story files: 60; stories: 647; stories with play functions: 647.
- A11y status (files): error 0, todo 2, off 0, unset 58.
- Maturity counts (from `tmp/audit/storybook-coverage.json`): complete-widget 549, composition 57, primitive 25, scaffold 16.
- Defined custom elements: 240; inventory blocks: 246.
- Composition titles covered: `Contour/Compositions/ChartLegend`, `Contour/Compositions/ChartTable`, `Contour/Compositions/ComboboxField`, `Contour/Compositions/RealWorldDemos`, `Contour/Compositions/DialogForm`, `Contour/Compositions/DocsBehaviors`, `Contour/Compositions/LayerPanelMap`, `Contour/Compositions/SplitPaneOverlays`, `Contour/Compositions/TableFilters`, `Contour/Compositions/WorkspaceShell`.
- Additional interaction/composition coverage added in existing families: toast-host async action (`Contour/Feedback/Toast`), sidebar + responsive shell (`Contour/Layout/Primitives`), dialog+form validation flow, and table+pagination state interaction.
- New composition stories in this pass: `stories/composition-workspace-shell.stories.js` (header + sidebar nav + central stage + resize handle + docked collapsible inspector) and `stories/composition-docs-behaviors.stories.js` (docs-nav selection event, TOC current-heading marker, code copy control presence, docs-nav route matching via `current`, and `contour-code` `numbered` gutter) with `play` assertions.
- Protected visual contracts (baseline/configured): `contour-forms-input--default` (form validation), `contour-overlays-dialog--default` (overlay framing), `contour-data-table--default` (narrow-table reflow), `contour-data-chart--default` (chart rendering), `contour-map-panel--default` (map chrome), `contour-workflows-dashboard--default` (dashboard composition), plus select/textarea overflow and layer/style control layout stories at 390px and 1440px in light and dark themes with reduced motion.
- Executed 2026-11-12: `node tools/storybook-tests.mjs` → **120/120 files, 1294/1294 tests, exit 0, 37 s**, against the static build served on loopback by the script. The 120 files are the 60 story files run twice — `vitest.config.js` gives the `storybook` project two browser instances, chromium and webkit, so the Safari lane (R18-43) is the same suite rather than a separate one. `node tools/check-storybook-coverage.mjs` → PASS (60 files, 647 stories, 647 with play, 240/240 defined elements covered, high-risk families 13/13). `node tools/check-visual.mjs --compare` → **264 compared, 0 differ** (44 story ids × 3 axes: default, forced-colors, compact).
- The run is self-contained: `npm run test:storybook` builds, serves `storybook/` on 127.0.0.1:6006, runs Vitest against it and stops the server. Previously the script assumed a server on 6006 that no step started, so CI could not execute it.
- Two story-level lessons from the first green run: a hash link in a story navigates the test iframe away unless the host calls `preventDefault` (the docs shell now owns routing), and Storybook's patched `focus` accessor makes focus-dependent assertions measure the harness — drive a field through its `input` event and keep focus-return checks in a real-browser probe.
