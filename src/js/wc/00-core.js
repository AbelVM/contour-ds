/* ============================================================================
   CONTOUR — Web Components (progressive enhancement)
   ----------------------------------------------------------------------------
   Two layers over the same blocks. The light-DOM wrappers add the CSS classes
   the block already has and, where a block needs scaffolding, generate it from
   attributes; styles come straight from ds.css. The contour-shadow-* wrappers
   are an opt-in alternative for consumers who want an isolated root with named
   parts to style through ::part(); they hold a template and slots and share the
   document's sheets. Neither layer replaces a native element, and nothing here
   is required for a page to work.

   What this file registers is published as the frozen array
   `window.ContourElements`, because `customElements` cannot be enumerated and a
   reader should not have to infer the registry by scraping quoted strings out of
   the source. A scrape counts whatever shape the prose happens to be in: it is
   how a gate came to certify a fraction of this file's elements as the whole of
   them, and call the difference a pass. No number is written down here for that
   reason — the array is the count, and the contract gate reads it.
   ========================================================================= */
(function () {
  "use strict";

  // Every name this file actually registers, in registration order. define() is
  // the only door to the registry, so the list cannot drift from what the
  // browser was handed.
  const REGISTERED = [];

  const define = (name, cls) => {
    if (customElements.get(name)) return;
    customElements.define(name, cls);
    REGISTERED.push(name);
  };

  // The attributes a consumer may set to ask for a modifier class. Both layers
  // read this one list: a wrapper that added a modifier from a different list is
  // how the light and shadow halves drifted apart over "color".
  const MODS = ["variant", "size", "color"];

  // The attributes a component may READ from its host. This list is the render
  // contract: an attribute that is not here cannot ask an element to re-render,
  // and an attribute a component WRITES to itself must never be here, because
  // that write would fire the callback that performs the render.
  //
  // Excluded because the render bodies below set them on the host:
  //   role, open, aria-label, aria-valuenow, aria-valuemin, aria-valuemax, tabindex
  // Adding one of those back to this list makes that component recurse.
  const OBSERVED = [
    "action", "actions", "after", "answer", "attribution", "attribution-mark", "before", "body", "brand", "columns", "color", "command",
    "cells", "controls", "copyable", "count", "current", "date", "delta", "desc", "direction", "divider", "do", "dont",
    "empty", "error", "features", "hint", "href", "icon", "instrument", "items", "key",
    "label", "lede", "legend", "links", "live", "max", "media", "message", "method", "min", "name", "next", "no", "note", "norm",
    "options", "pages", "placeholder", "prev", "price", "prompt", "question",
    "quote", "removable", "reverse", "rows", "scale", "series", "shortcut", "size", "status",
    "state", "steps", "subtitle", "summary", "tabs", "tag", "text", "title", "type", "value",
    "variant", "yes",
  ];

  /**
   * Base class for all Contour web components.
   *
   * Lifecycle: the first `connectedCallback` snapshots the author's nodes and
   * class attribute, then calls `render()`. On attribute change, the snapshot
   * is restored and `render()` runs again, so subclasses stay reactive.
   *
   * All components use light DOM so that `ds.css` styles apply directly.
   */
  // Base class: the lifecycle belongs here, the markup belongs to the subclass.
  //
  // A render body is written to run more than once, and it is idempotent because
  // of this snapshot rather than because of its own guards. The first
  // connectedCallback records the nodes and the class attribute the AUTHOR
  // wrote; every later render drops everything, re-appends exactly those nodes,
  // and runs again. So a body may keep the natural
  // `if (!this.querySelector(".c-card__title"))` shape: after the reset the
  // generated node is gone, the guard passes, and the changed attribute reaches
  // the page. Without the reset the guard is permanent and reactivity is a lie.
  //
  // The snapshot holds node references, not a re-parsed string, so listeners a
  // consumer put on authored children survive a re-render. The cost is honest:
  // nodes a component generated are rebuilt, so state inside them (a typed
  // value, a focus ring) is lost when a host attribute changes.
  class ContourBase extends HTMLElement {
    static get observedAttributes() {
      return OBSERVED;
    }

    connectedCallback() {
      if (this._contourAuthored) return; // reconnected, not re-specified
      this._contourAuthored = {
        nodes: Array.from(this.childNodes),
        cls: this.getAttribute("class"),
      };
         const before = Array.from(this.childNodes);
         this.render();
         this._contourGenerated = Array.from(this.childNodes).filter((n) => !before.includes(n));
         this.enhance();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      // Fires before connectedCallback during an upgrade: nothing to reset to
      // yet, and connectedCallback will render with the final attributes.
      if (!this.isConnected || !this._contourAuthored || this._contourRendering) return;
       this._contourRendering = true;
       try {
         // Preserve form control values across a re-render: generated inputs are
         // dropped and rebuilt, so without this a host attribute change wipes
         // whatever the user typed.
         const savedValues = Array.from(this.querySelectorAll("input, textarea, select")).map((el) => el.value);
         // Drop generated nodes from the previous render.
         for (const g of (this._contourGenerated || [])) {
           if (g.parentNode === this) this.removeChild(g);
         }
        // Refresh the authored snapshot so content added after connect survives.
        const generated = new Set(this._contourGenerated || []);
        const authoredNow = Array.from(this.childNodes).filter((n) => !generated.has(n));
        this._contourAuthored.nodes = authoredNow;
        // Clear and restore authored nodes.
        while (this.firstChild) this.removeChild(this.firstChild);
        for (const node of this._contourAuthored.nodes) this.appendChild(node);
        if (this._contourAuthored.cls === null) this.removeAttribute("class");
        else this.setAttribute("class", this._contourAuthored.cls);
        const before = Array.from(this.childNodes);
        this.render();
        this._contourGenerated = Array.from(this.childNodes).filter((n) => !before.includes(n));
        // Restore preserved form control values.
        const newControls = Array.from(this.querySelectorAll("input, textarea, select"));
        newControls.forEach((el, i) => {
          if (savedValues[i] !== undefined && el.value === "" && el.getAttribute("value") === null) {
            el.value = savedValues[i];
          }
        });
        this.enhance();
      } finally {
        this._contourRendering = false;
      }
    }

    disconnectedCallback() {
      // Override in subclasses that attach event listeners or timers.
    }

    // Default no-op: subclasses with behaviour override this.
    enhance() {}

    // Helper for update-or-create reactivity: returns the first node matching
    // `selector`, creating it via `factory()` and appending it if absent. Render
    // bodies use this so an attribute change updates the existing node instead
    // of being blocked by a `!querySelector` guard.
    ensure(selector, factory, parent) {
      const root = parent || this;
      let node = root.querySelector(selector);
      if (!node) {
        node = factory();
        root.appendChild(node);
      }
      return node;
    }
  }

  // Simple component: just adds CSS classes.
  const simple = (classes) => class extends ContourBase {
    render() {
      classes.forEach((c) => this.classList.add(c));
      MODS.forEach((attr) => {
        if (this.hasAttribute(attr)) {
          const val = this.getAttribute(attr);
          classes.forEach((c) => {
            const prefix = c.replace("c-", "");
            this.classList.add(`c-${prefix}--${val}`);
          });
        }
      });
    }
  };

  // ---- Class-only blocks ----
  //
  // A block in this list needs nothing but its own class: the element name is
  // \`contour-<block>\` and the class is \`c-<block>\`, which is why the table holds
  // the block and not two spellings of it. Blocks that need scaffolding are not
  // here — they declare a class above, and their presence in this list would be
  // a fallback that only runs when the real component is broken, so the
  // registration loop skips a name an explicit component already claimed.
  const CLASS_ONLY = [
    "box", "cluster", "container", "row", "scrim", "stack"
  ];


