/* ============================================================================
   CONTOUR — style guide behaviour
   ----------------------------------------------------------------------------
   The guide's own chrome, kept out of the design system: `src/js/ds.js` must
   not know about a guide-only class.

   Everything here is progressive enhancement. With JavaScript off, a snippet
   disclosure is still a native <details>: it still opens, and it still shows
   the markup under a scrim. The script only adds what the platform cannot —
   one snippet at a time, clicking outside to close, and Escape to close.
   ========================================================================= */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const disclosures = $$("details.ds-code");
  if (!disclosures.length) return;

  const openDisclosure = () => disclosures.find((details) => details.open);

  const close = (details) => {
    if (!details) return;
    details.open = false;
    details.querySelector("summary")?.focus();
  };

  /* One snippet at a time: two floating panels would overlap, and the scrim
     only works for a single focus. */
  disclosures.forEach((details) => {
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      disclosures.forEach((other) => {
        if (other !== details) other.open = false;
      });
    });
  });

  /* Clicking outside the open example closes it, the way clicking outside a
     dialog does. The scrim is the section's own pseudo-element, so every
     click outside the example lands on the section. */
  document.addEventListener("click", (event) => {
    const current = openDisclosure();
    if (!current) return;
    const example = current.closest(".ds-example");
    if (example && example.contains(event.target)) return;
    close(current);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const current = openDisclosure();
    if (!current) return;
    // The command palette owns Escape while it is open.
    const palette = $("[data-command-palette]");
    if (palette && (palette.matches(":popover-open") || palette.classList.contains("is-open"))) {
      return;
    }
    close(current);
  });
})();
