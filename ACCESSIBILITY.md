# Accessibility statement — Contour

Contour targets **WCAG 2.2 Level AA** conformance for the design system itself
(the CSS, the optional JavaScript, and the web components). The style guide
(`index.html`) is the specification and the test suite; its own Lighthouse
accessibility score is 100 on desktop and mobile, in both themes.

## What is covered

- **Contrast.** Body text 4.5:1, borders / focus rings / control edges 3:1,
  in both themes, measured against every surface a control can sit on. Enforced
  by `tools/audit/contrast-and-aria.mjs`.
- **Focus.** Visible focus rings at 3:1 against the adjacent surface; focus
  appearance governed by WCAG 2.4.13. `scroll-padding-block-start` keeps an
  anchored or focused target clear of the sticky header.
- **Reflow.** No horizontal page scroll at 200% zoom or a 390 px viewport, in
  both themes, with JavaScript off. Enforced by
  `tools/audit/check-reflow.mjs`.
- **Reduced motion.** `prefers-reduced-motion: reduce` collapses every
  transition. Enforced by `tools/check-motion.mjs`.
- **Forced colours.** Forced Colors Mode removes the texture and ridgelines and
  falls back to a system `CanvasText` outline.
- **Target size.** Minimum 24 px (WCAG 2.5.8).
- **Charts.** Every series carries a dash pattern as well as a hue, so no
  chart asks the reader to tell two colours apart. Each chart exposes an
  accessible name and a data alternative beside the image.
- **Live regions.** `#toast-host` carries the role; the toast carries none, so
  a region that already holds text at load announces nothing.
- **Keyboard.** All interactive components (tabs, combobox, tree, menu,
  segmented, dialog, tag, filter-pill, pagination) are keyboard-navigable and
  dispatch `contour:*` events.
- **RTL.** Structural support via logical properties; not yet fully audited.

## Known limitations

- `light-dark()` is newly available (2024-05) and widely available from
  2026-11; older browsers use `src/css/light-dark-fallback.css`.
- Anchor positioning is behind `@supports` for tooltips/menus.
- RTL is structural only; a full audit is pending.

## How to report

Open an issue using the bug-report template with "accessibility" in the title.
Include the browser, theme, and assistive technology used.

## Conformance claim

This statement is based on self-assessment supported by automated gates
(`tools/audit/contrast-and-aria.mjs`, `tools/audit/check-reflow.mjs`,
`tools/check-motion.mjs`, `tools/audit/chart-names.mjs`). A third-party audit
is planned before v1.0.
