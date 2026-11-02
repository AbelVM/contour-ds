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

## Pinned ARIA/APG patterns (R12-35)

The following APG patterns are the compatibility contract for Contour's composite
components. A change to any of them is treated as a behavioral breaking change
and reviewed like a dependency update.

| Component family | APG pattern | Key contract |
|---|---|---|
| tabs | Tabs | roving tabindex, arrow keys, Home/End |
| menu / context-menu / dropdown | Menu / Menu Button | arrow nav, Enter/Space, Escape, typeahead |
| combobox | Combobox | aria-activedescendant or roving, Enter to commit, Escape to close |
| tree | Tree View | arrow expand/collapse, Home/End, typeahead |
| dialog / drawer / sheet | Dialog (Modal) | focus trap, Escape, focus return |
| accordion / disclosure | Disclosure | Enter/Space toggle, aria-expanded |
| segmented | (button group) | arrow selection, single/multi cardinality |
| grid / data-grid / tree-grid | Grid | 2D arrow nav, Home/End, PageUp/PageDown |
| carousel | Carousel | prev/next, pause, reduced motion |
| tooltip / hover-card | Tooltip | hover + focus, Escape, no essential info |
| toast / notification | (live region) | polite/assertive, no focus steal |

APG version pinned: WAI-ARIA Authoring Practices Guide 1.2 (2024). Review on
any APG update before adopting.

## Component-level contracts (R12-17)

Global gates (contrast, reflow, motion, forced colours) do not prove every
interactive surface. Each interactive component must additionally document:

- **Target size:** minimum 24 px (WCAG 2.5.8) for every pointer target,
  including icon-only buttons and drag handles.
- **Forced colours:** component must remain usable in Forced Colors Mode;
  texture/ridgelines removed, system `CanvasText` outline retained.
- **Reduced motion:** all transitions collapse under
  `prefers-reduced-motion: reduce`; infinite animations pausable by a control
  (`tools/check-motion.mjs`).
- **Responsive:** no horizontal page scroll at 320/390 px and 200% zoom in both
  themes (`tools/audit/check-reflow.mjs`); component-specific overflow handled
  by `.c-table-wrap` or equivalent scroller, never `overflow-x: hidden` on body.
- **Touch:** pointer targets sized for coarse pointers; no hover-only
  essential information.
