# Changelog

All notable changes to Contour are documented here.

## [Unreleased]

### Added
- `--color-control-edge` token for control borders (WCAG 1.4.11)
- `--target-control`, `--target-option`, `--target-chart` tokens for target sizes by kind
- `--fill-hatch-1…5` and `--fill-dot` fill-pattern vocabulary for polygon marks
- `--dur-spin`, `--dur-spin-slow`, `--dur-copy-tick` motion tokens
- `--shadow-color-*` tokens for button and range shadows
- `.c-map-slot` component for map chrome
- `.c-bivariate` component for bivariate legends
- `window.Contour` public API (`toast`, `setScheme`, `scrollTo`, `copy`)
- `tools/check-tokens.mjs` token census gate
- `DESIGN.md` agent-readable manifest
- `LICENSE` and `CHANGELOG.md`

### Changed
- `--color-scale-1…6` renamed to `--color-heat-1…6` (it is a heat ramp, not sequential)
- `--color-on-primary` now follows `--brand-hue`
- `.c-theme-scope` now inherits `--brand-hue` and `--radius-scale` from `:root`
- `.c-range` cursor changed from `grab` to `pointer`
- Focus indicator on checkbox, switch and range thumb now uses the focus ring (3.55:1) instead of the halo (1.15:1)
- Command palette now sets `aria-activedescendant` and removes options from tab order
- `⌘K` shortcut no longer fires while typing
- `--color-text-subtle` lifted to clear 4.5:1 on `--color-surface-3`
- Input/select/textarea borders now use `--color-control-edge`
- Density now moves the type scale as well as spacing
- Browser support table now names Baseline dates
- `llms.txt` corrected (component count, chart layer honesty, added component list, a11y contract, platform requirements)

### Fixed
- Heading level jump (h3 → h5) in guide corrected to h3 → h4
- Four unlabelled range inputs in guide now have associated labels
- Drag handle converted from `aria-hidden` span to focusable button
- Nine unspecced components documented (count corrected from six to nine)
