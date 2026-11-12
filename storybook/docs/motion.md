# Motion that decelerates, never bounces.

Section `motion` — marker `05`, position 6 of 27 in the guide.
Generated from `index.html`; prose quoted, counts from the inventory, no URL (the project is
private until v1.0). See `index.json` for the whole set and the shared statement.

## What the guide says

Exponential easing for entrances, tight linear curves for continuous motion, and a hard stop for anything the user did not ask for. Every animation respects prefers-reduced-motion.

Equivalent contour-* elements are catalogued in §23.

prefers-reduced-motion is an operating-system setting, so it is not the mechanism WCAG 2.2.2 asks for: a reader cannot reach it for one part of one page, and most have never opened it. [data-motion] is the page's own switch. paused holds every animation in its scope on the frame it is on — a spinner stays mid-rotation and still means working. running overrides the media query; leaving the attribute unset gives the choice back to the system.

The same attribute is the seam for content that updates on a timer: when a live region stops being live, the producer that polls it should set data-motion="paused" too, because 2.2.2 covers auto-updating information, not only motion.

Hover, focus and press. Anything that must feel instantaneous.

State changes on surfaces: border, background, transform.

Entrances, reveals and anything that moves the eye across a gap.

## Subsections

- Motion a reader can stop
- Web component counterpart

## Blocks documented here

13 block(s). Their facts live in `../contour.components.json`;
only the names are here, because the same figure in two files is how a document
starts disagreeing with itself.

- `.c-badge`
- `.c-btn`
- `.c-card`
- `.c-cluster`
- `.c-dot`
- `.c-icon-badge`
- `.c-kbd`
- `.c-pill`
- `.c-row`
- `.c-section-head`
- `.c-segmented`
- `.c-skeleton`
- `.c-spinner`

---

Source `index.html` @ `5e71aea0fac4b1ac` · last committed 2026-11-12T17:19:00+01:00 · no URL: the project is private until v1.0.
