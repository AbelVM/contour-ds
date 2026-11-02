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
| `npm run build-storybook` | Build the static Storybook site into `storybook-static/` (gitignored). |
| `npm run test:storybook` | Run Storybook interaction/a11y tests via Vitest + Playwright. |
| `npm run check:storybook-coverage` | Coverage report; fails on zero stories or invented elements. |
| `npm run check:storybook` | Compose the three above. |
| `npm run screenshot:baseline` | Capture deterministic screenshots (requires a running Storybook server). |

## Ownership

- **Maintainer:** Contour core maintainers.
- **Story changes** require review when a WC API changes; stories must not
  invent classes, tokens, attributes, events, slots, parts, or states absent
  from `contour.components.json`, `API-CONTRACTS.md`, or `src/js/wc/`.
- **A11y exceptions:** a story may set `a11y: { test: "todo" }` only with a
  linked task/issue ID in a comment (e.g. `SB-A11Y-01`). Disabling a11y
  (`test: "off"`) is never allowed.

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

- Story files: 15; stories: 43; stories with play functions: 43.
- High-risk families covered: 13/13.
- A11y status (files): error 0, todo 1 (SB-A11Y-01), off 0, unset 14.
- Maturity counts: complete-widget 11, composition 1, primitive 2, scaffold 1.
- Defined custom elements: 209; inventory blocks: 214.
- Screenshot baseline: 8 stories × 2 themes × 2 widths = 32 PNGs in `tmp/screenshots/`.
- All gates pass: `npm run test:storybook`, `npm run build-storybook`, `npm run check:storybook-coverage`, `npm run check:storybook`, `node tools/doctor.mjs`.
