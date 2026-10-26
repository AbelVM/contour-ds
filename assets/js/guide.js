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

  /* §23 reactivity demo. It sits before the disclosure guard below because the
     guard returns when a page has no snippets, and the demo is not a snippet.

     The render count is read off the element — `renderCount` is the base class's
     own tally — so this page never publishes a number the layer did not produce.
     And it waits for `contour:ready`: `guide.js` is a classic script that runs
     while the document is still being parsed, whereas the component layer is a
     module that upgrades afterwards, so wiring on load would find a
     `<contour-kpi>` that is still an unknown element with no `batch` to call. */
  const wcDemo = () => {
    const panel = $("[data-wc-demo]");
    if (!panel) return;
    const kpi = $("[data-wc-demo-kpi]", panel);
    const out = $("[data-wc-demo-count]", panel);
    const single = $("[data-wc-demo-single]", panel);
    const grouped = $("[data-wc-demo-batch]", panel);
    if (!kpi || !out || typeof kpi.batch !== "function") return;

    let step = 0;
    const write = () => {
      step += 1;
      kpi.setAttribute("value", String(128 + step));
      kpi.setAttribute("delta", `+${step}`);
      kpi.setAttribute("direction", step % 2 ? "down" : "up");
    };
    const show = () => { out.textContent = `render() has run ${kpi.renderCount} times`; };

    single?.addEventListener("click", () => { write(); show(); });
    grouped?.addEventListener("click", () => { kpi.batch(write); show(); });
    show();
  };

  if (window.customElements?.get("contour-kpi")) wcDemo();
  else window.addEventListener("contour:ready", wcDemo, { once: true });

  const wcPlayground = () => {
    const panel = $("[data-wc-playground]");
    if (!panel) return;
    const alert = $("[data-wc-pg-alert]", panel);
    const variantSel = $("[data-wc-pg-variant]", panel);
    const kpi = $("[data-wc-pg-kpi]", panel);
    const range = $("[data-wc-pg-value]", panel);
    const valueText = $("[data-wc-pg-valuetext]", panel);
    if (variantSel && alert) {
      variantSel.addEventListener("change", () => {
        alert.setAttribute("variant", variantSel.value);
      });
    }
    if (range && kpi) {
      range.addEventListener("input", () => {
        kpi.setAttribute("value", range.value);
        if (valueText) valueText.textContent = range.value;
      });
    }
    const closeAlert = $("[data-wc-pg-close]", panel);
    const resetBtn = $("[data-wc-pg-reset]", panel);
    if (resetBtn && closeAlert) {
      resetBtn.addEventListener("click", () => {
        if (!document.body.contains(closeAlert)) {
          const newAlert = document.createElement("contour-alert");
          newAlert.setAttribute("data-wc-pg-close", "");
          newAlert.setAttribute("variant", "info");
          newAlert.setAttribute("title", "Closable");
          newAlert.setAttribute("body", "Click the × to dismiss");
          newAlert.setAttribute("closable", "");
          resetBtn.parentNode.insertBefore(newAlert, resetBtn);
        }
      });
    }
  };

  if (window.customElements?.get("contour-alert")) wcPlayground();
  else window.addEventListener("contour:ready", wcPlayground, { once: true });

  const wcFormDemo = () => {
    const panel = $("[data-wc-formdemo]");
    if (!panel) return;
    const form = $("[data-wc-formdemo-form]", panel);
    const out = $("[data-wc-formdemo-out]", panel);
    if (!form || !out) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const entries = [];
      for (const [k, v] of data.entries()) entries.push(`${k} = ${v}`);
      out.textContent = entries.length ? entries.join("\\n") : "(empty)";
    });
    form.addEventListener("reset", () => { out.textContent = ""; });
  };

  if (window.customElements?.get("contour-input")) wcFormDemo();
  else window.addEventListener("contour:ready", wcFormDemo, { once: true });

  const wcEventDemo = () => {
    const panel = $("[data-wc-eventdemo]");
    if (!panel) return;
    const out = $("[data-wc-eventdemo-out]", panel);
    if (!out) return;
    const log = (msg) => { out.textContent = msg; };
    panel.addEventListener("contour:select", (e) => {
      log(`contour:select — ${JSON.stringify(e.detail)}`);
    });
    panel.addEventListener("contour:page", (e) => {
      log(`contour:page — ${JSON.stringify(e.detail)}`);
    });
  };

  if (window.customElements?.get("contour-menu")) wcEventDemo();
  else window.addEventListener("contour:ready", wcEventDemo, { once: true });

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
      if (!details.open) {
        if (!openDisclosure()) releaseModal();
        return;
      }
      disclosures.forEach((other) => {
        if (other !== details) other.open = false;
      });
      // WCAG 2.4.11 (Focus Not Obscured, Minimum) is Level AA and carries no
      // exception for author content that happens to be fixed or sticky: while
      // the scrim dims the whole page, every control still in the tab order is
      // a control the reader can focus and cannot see. `inert` is what removes a
      // subtree from the sequential focus ring, from hit-testing and from the
      // accessibility tree at once — a focus trap written by hand would do the
      // first of those three and forget the other two.
      modalise(details);
    });
  });

  let inerted = [];

  /* Modalise the page around `keep` without hiding it. An ancestor cannot be
     made inert, because inert reaches the whole subtree, so what gets inerted
     is the SIBLING of each ancestor — the rail beside the section, the header
     above it, the other sections — all the way out to the body. */
  function modalise(keep) {
    releaseModal();
    for (let el = keep; el && el !== document.body; el = el.parentElement) {
      for (const sib of el.parentElement.children) {
        if (sib === el || sib.inert) continue;
        sib.inert = true;
        inerted.push(sib);
      }
    }
  }

  function releaseModal() {
    inerted.forEach((el) => (el.inert = false));
    inerted = [];
  }

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
