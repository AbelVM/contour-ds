# Affordances, made visible.

Section `affordances` — marker `18`, position 19 of 27 in the guide.
Generated from `index.html`; prose quoted, counts from the inventory, no URL (the project is
private until v1.0). See `index.json` for the whole set and the shared statement.

## What the guide says

An element should look like what it does before anyone touches it. Each interactive class in the system carries a signifier — a shape, a handle, an arrow — that announces its behaviour. Nothing is implied by position alone, and nothing is left to be guessed at.

Equivalent contour-* elements are catalogued in §23.

Button

Filled, raised, pill-shaped with a shadow that implies height. It lifts on hover and presses on activation.

Switch

A knob that slides. Position carries the state, so the meaning survives greyscale.

Slider

A track with a filled portion and a round thumb. The fill shows the value without a number.

Checkbox

A square that fills with a tick. Round for radio, square for multiple.

Filter pill

Names its key and value, and carries a visible remove control. Nothing is removable by guesswork.

Drag handle

Six dots. The near-universal signifier for reordering, and it changes the cursor on hover.

Sortable column

An arrow appears on hover and locks to a direction once sorted. The sort state is announced to assistive technology.

Disclosure

A chevron that rotates. A plus becomes a cross when open, so the control reads as reversible.

Copy

The icon becomes a tick for a moment. The result is visible without a toast and without reading a label.

Link

Underlined in prose and coloured outside it. A link never looks like a button.

Disabled

Dimmed, with a not-allowed cursor. Disabled is a state, never a silent dead end.

Cursor

Every clickable thing declares its cursor — pointer, grab, col-resize. The cheapest signifier there is.

Hidden content revealed on toggle.

This action cannot be undone.

RTL specimen — chevron flips to the inline-start side.

The spatial dashboard skeleton: an app shell, a map area with floating panels, a footer for charts, and the containers that fill them.

Grouping helpers: use .c-row for a non-wrapping horizontal line, .c-cluster when items may wrap, .c-stack for vertical rhythm, .c-btn-group / .c-btn-group--attached for button rows, .c-segmented for option sets, and .c-toolbar for icon toolbars. Components adopt these internally; prefer them over ad-hoc flex when composing.

.c-row — horizontal flex, items centered

.c-stack — vertical, gap scales with --space-md

.c-cluster — wrapping, for tags and chips

.c-box — padded container, size variants

Default box (md padding)

.c-map-slot — map chrome container

.c-map-panel — floating panel over the map

Top-right panel

Bottom-left panel

.c-map-footer — bottom bar for charts and tables

Cell 1

Cell 2

Cell 3

.c-container — fixed (fit content) + scrollable (fill space)

Fixed container

Fits its content, stays put.

Scrollable container

Fills remaining space

And scrolls if needed

More content here

Even more content

Main content area

.c-app / .c-app-body — application shell

Sidebar

Main content area

Two composition primitives for a dashboard shell. The grid lays its authored children out in a responsive set of columns; the stack is a vertical rhythm with a shared header. Both take their geometry from custom properties, so the consumer sets the column count and the gap rather than overriding the rule.

The first focusable element on the page. It is visually hidden until it takes focus, then slides into view at the top-left corner, so a keyboard user can jump past the navigation without a mouse. It is positioned against its containing block rather than the viewport, which is what keeps it inside a scrolling container.

A landing page is a persuasive argument. Its grammar prioritises storytelling, typography, large-scale composition, editorial rhythm, rich media, persuasive CTA and generous whitespace.

The landing shell composes these blocks in a narrative sequence:

Landing pages use the roomy density profile (--density-roomy: 1.28) with the display type scale for headings and generous section spacing.

Landing pages use the fluid display scale for headlines and the fixed UI scale for body text. The display scale responds to viewport width; the UI scale does not.

## Subsections

- Layout primitives
- Dashboard grid and analysis stack
- Skip link
- Tour
- Resize observer
- Style panel
- Style switcher
- Palette editor
- Widget state
- Web component counterpart
- Landing page composition grammar
- Anatomy
- Density & rhythm
- Type scale

## Blocks documented here

44 block(s). Their facts live in `../contour.components.json`;
only the names are here, because the same figure in two files is how a document
starts disagreeing with itself.

- `.c-affordance`
- `.c-affordances`
- `.c-analysis-stack`
- `.c-app`
- `.c-app-body`
- `.c-badge`
- `.c-box`
- `.c-btn`
- `.c-cluster`
- `.c-container`
- `.c-dashboard-grid`
- `.c-destructive-hint`
- `.c-disclosure`
- `.c-drag-handle`
- `.c-expandable`
- `.c-filter-pill`
- `.c-icon-badge`
- `.c-kbd`
- `.c-linkish`
- `.c-map-footer`
- `.c-map-panel`
- `.c-map-slot`
- `.c-menu`
- `.c-palette-editor`
- `.c-panel`
- `.c-pressable`
- `.c-range`
- `.c-reserved`
- `.c-resize-handle`
- `.c-resize-observer`
- `.c-row`
- `.c-row-action`
- `.c-scrim`
- `.c-section-head`
- `.c-select`
- `.c-sidebar`
- `.c-skip-link`
- `.c-stack`
- `.c-style-panel`
- `.c-style-switcher`
- `.c-switch`
- `.c-tag`
- `.c-tour`
- `.c-widget-state`

---

Source `index.html` @ `eb38e4a5345472ef` · last committed 2026-11-13T09:07:47+01:00 · no URL: the project is private until v1.0.
