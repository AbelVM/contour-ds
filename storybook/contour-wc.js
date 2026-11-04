(function () {
  "use strict";
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
"use strict";

  // Every name this file actually registers, in registration order. define() is
  // the only door to the registry, so the list cannot drift from what the
  // browser was handed.
  /** Names registered by this module, in registration order. */
const REGISTERED = [];

  // Per-host teardown, run when a host leaves the page.
  //
  // The layer had no way to stop anything: `grep -c removeEventListener src/js/wc`
  // returned 0, and each component relied on GC. That is sound for a listener on a
  // node the host owns, because the node and its listeners die together — but a
  // fetch, a timer, or an IntersectionObserver is not owned by a node. It is owned
  // by the document, and it outlives the host that asked for it. Measured
  // (tmp/wc9/probe.mjs, 2026-10-27): a `contour-readout src=…` removed from the page
  // mid-request kept `loadingAfterDetach: 2` stale nodes and was still written to
  // after `isConnected` went false.
  //
  // So anything a host starts against the document registers its cleanup here, and
  // `disconnectedCallback` runs the list. A reconnect re-renders and re-registers,
  // which is why the list is dropped rather than kept: one disposal per mount.
  const DISPOSERS = new WeakMap();
  /** Register teardown work for the host's current connection. */
const onDispose = (host, fn) => {
    let list = DISPOSERS.get(host);
    if (!list) { list = []; DISPOSERS.set(host, list); }
    list.push(fn);
  };
  function contourDebugEnabled() {
    try {
      if (typeof window !== "undefined" && (window.ContourDebug || window.__CONTOUR_DEBUG__)) return true;
    } catch (e) {}
    try {
      if (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" && process.env.CONTOUR_DEBUG) return true;
    } catch (e) {}
    return false;
  }
  const runDisposers = (host) => {
    const list = DISPOSERS.get(host);
    if (!list) return;
    DISPOSERS.delete(host);
    for (const fn of list) {
      try { fn(); }
      catch (e) {
        // One bad cleanup cannot strand the rest. Surface the failure in
        // development/debug mode so a leaking disposer is not invisible.
        if (contourDebugEnabled()) {
          try { console.warn("Contour disposer failed for", host && host.tagName, e); } catch (err) {}
        }
      }
    }
  };

  // Monotonic counter for unique IDs (avoids Math.random() collision risk).
  let _contourIdCounter = 0;
  /** Return a unique, document-safe id with the supplied prefix. */
const contourId = (prefix) => prefix + "-" + (++_contourIdCounter).toString(36);

  /** Define a custom element once, while remaining safe in SSR runtimes. */
const define = (name, cls) => {
    // SSR-safe / constrained-runtime boundary: if the Custom Elements registry
    // is unavailable, do not throw on import; registration is a no-op and the
    // element remains an unknown (upgradable) tag until a browser defines it.
    if (typeof customElements === "undefined" || !customElements || typeof customElements.define !== "function") return;
    if (customElements.get(name)) return;
    customElements.define(name, cls);
    REGISTERED.push(name);
  };

  // The attributes a consumer may set to ask for a modifier class. Both layers
  // read this one list: a wrapper that added a modifier from a different list is
  // how the light and shadow halves drifted apart over "color".
  /** Attribute names that map to component modifier classes. */
const MODS = ["variant", "size", "color"];

  // Every event this layer emits, with the payload keys each one carries and
  // its composed flag. This is the count — a number written anywhere would go
  // stale silently, so the gate compares the emitted names in the source
  // against THIS object, and the publish freezes it exactly like ContourElements.
  // Payload keys are the union of keys every emission site passes, read from
  // the source rather than invented: contour:select carries {series, index},
  // {index, label} and {value} across its sites, so all three are listed.
  /** Frozen event vocabulary with the public detail keys for each event. */
const CONTOUR_EVENTS = Object.freeze({
    "contour:activate": { payload: ["row"], composed: true },
    "contour:add": { payload: ["value"], composed: true },
    "contour:activity-select": { payload: ["index", "text"], composed: true },
    "contour:break-change": { payload: ["layer", "value"], composed: true },
    "contour:style-resolved": { payload: ["applied", "items", "layer", "property", "value"], composed: true },
    "contour:advanced-toggle": { payload: ["title"], composed: true },
    "contour:affordance-activate": { payload: ["name"], composed: true },
    "contour:aggregate": { payload: ["aggregate"], composed: true },
    "contour:bearing": { payload: ["direction", "degrees"], composed: true },
    "contour:btn-group-change": { payload: ["index", "label"], composed: true },
    "contour:brush-start": { payload: ["end", "start", "value"], composed: true },
    "contour:brush-end": { payload: ["end", "start", "value"], composed: true },
    "contour:brush": { payload: ["end", "start", "value"], composed: true },
    "contour:change": { payload: ["checked", "color", "direction", "end", "files", "high", "index", "low", "month", "name", "speed", "start", "unit", "value", "year"], composed: true },
    "contour:collapse": { payload: ["collapsed"], composed: true },
      "contour:cluster-toggle": { payload: ["count", "expanded"], composed: true },
    "contour:clear": { payload: [], composed: true },
    "contour:clear-all": { payload: [], composed: true },
    "contour:close": { payload: ["index", "label"], composed: true },
    "contour:copy": { payload: ["text"], composed: true },
    "contour:dash-action": { payload: ["label"], composed: true },
    "contour:diff-activate": { payload: ["kind", "text"], composed: true },
    "contour:draw-start": { payload: ["mode"], composed: true },
    "contour:drag": { payload: ["delta", "key", "value"], composed: true },
    "contour:do-dont-activate": { payload: ["kind", "text"], composed: true },
    "contour:docs-nav-select": { payload: ["label", "href"], composed: true },
    "contour:dragend": { payload: ["value"], composed: true },
    "contour:dragstart": { payload: ["value"], composed: true },
    "contour:drop": { payload: ["value", "label"], composed: true },
    "contour:empty-action": { payload: ["state"], composed: true },
    "contour:filter": { payload: ["query"], composed: true },
    "contour:error": { payload: ["src", "message", "name", "status"], composed: true },
    "contour:hide": { payload: [], composed: true },
    "contour:hover": { payload: ["row"], composed: true },
    "contour:input": { payload: ["name", "value", "checked"], composed: true },
    "contour:layer-opacity": { payload: ["name", "opacity"], composed: true },
    "contour:layer-rename": { payload: ["name", "newName"], composed: true },
    "contour:layer-duplicate": { payload: ["name"], composed: true },
    "contour:layer-zoom": { payload: ["name"], composed: true },
    "contour:layer-projection": { payload: ["name", "projection"], composed: true },
    "contour:layer-remove": { payload: ["name"], composed: true },
    "contour:layer-reorder": { payload: ["layerIds"], composed: true },
    "contour:layer-toggle": { payload: ["name", "visible"], composed: true },
    "contour:layer-visibility": { payload: ["name", "visible"], composed: true },
    "contour:legend-toggle": { payload: ["key", "label", "pressed"], composed: true },
    "contour:leave": { payload: [], composed: true },
    "contour:load": { payload: ["src", "count"], composed: true },
    "contour:map-control": { payload: ["control"], composed: true },
    "contour:map-attach": { payload: [], composed: true },
    "contour:map-detach": { payload: [], composed: true },
    "contour:mode-change": { payload: ["mode"], composed: true },
    "contour:move": { payload: ["direction", "from", "to"], composed: true },
    "contour:open": { payload: [], composed: true },
    "contour:page": { payload: ["page"], composed: true },
    "contour:ready": { payload: ["version", "count"], composed: true },
    "contour:remove": { payload: ["key", "label", "value"], composed: true },
    "contour:reorder": { payload: ["from", "to"], composed: true },
    "contour:range-change": { payload: ["value"], composed: true },
    "contour:resize": { payload: ["height", "width"], composed: true },
    "contour:retry": { payload: ["src"], composed: true },
    "contour:loop-change": { payload: ["loop"], composed: true },
    "contour:pause": { payload: [], composed: true },
    "contour:play": { payload: [], composed: true },
    "contour:seek": { payload: ["progress", "value"], composed: true },
    "contour:select": { payload: ["area", "col", "index", "key", "label", "labels", "path", "row", "rows", "series", "value"], composed: true },
    "contour:search": { payload: ["query"], composed: true },
    "contour:speed-change": { payload: ["speed"], composed: true },
    "contour:showcase-activate": { payload: ["title"], composed: true },
    "contour:step-activate": { payload: ["index", "title"], composed: true },
    "contour:step-change": { payload: ["direction", "index", "title"], composed: true },
    "contour:show": { payload: [], composed: true },
    "contour:sort": { payload: ["column", "direction"], composed: true },
    "contour:submit": { payload: ["submitting"], composed: true },
    "contour:stream-state": { payload: ["running"], composed: true },
    "contour:tab-change": { payload: ["index", "label"], composed: true },
    "contour:theme-change": { payload: ["theme"], composed: true },
    "contour:tick": { payload: ["frame"], composed: true },
    "contour:time-change": { payload: ["progress", "value"], composed: true },
    "contour:time-range-change": { payload: ["value"], composed: true },
    "contour:toggle": { payload: ["expanded", "label", "open", "path", "playing"], composed: true },
    "contour:view-enter": { payload: [], composed: true },
    "contour:view-leave": { payload: [], composed: true },
  });

  // Shared HTML sanitizer (B3-18): allowlist via DOMParser instead of a
  // blacklist regex, so single-quoted, unquoted and javascript: payloads
  // cannot slip through.
  /** Sanitize consumer-provided HTML using a DOM allowlist. */
function sanitizeHtml(input) {
    const str = String(input == null ? "" : input);
    // Fail closed when no parser is available (SSR, constrained runtimes):
    // never treat "no parser" as "trusted markup". Return the input as inert
    // text so no tag is interpreted by an innerHTML assignment.
    if (typeof DOMParser === "undefined") {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    const doc = new DOMParser().parseFromString(str, "text/html");
    const drop = new Set(["script", "iframe", "object", "embed", "style", "link", "meta", "base", "form", "input", "button"]);
    const walk = (node) => {
      const children = Array.from(node.childNodes);
      for (const c of children) {
        if (c.nodeType === 1) {
          const tag = c.tagName.toLowerCase();
          if (drop.has(tag)) { c.remove(); continue; }
          // Strip every on-* attribute and javascript: URLs.
          for (const attr of Array.from(c.attributes)) {
            const name = attr.name.toLowerCase();
            if (name.startsWith("on")) { c.removeAttribute(attr.name); continue; }
            const val = String(attr.value || "").trim().toLowerCase();
            if ((name === "href" || name === "src" || name === "xlink:href") && (val.startsWith("javascript:") || val.startsWith("data:text/html"))) {
              c.removeAttribute(attr.name);
            }
          }
          walk(c);
        }
      }
    };
    walk(doc.body);
    return doc.body.innerHTML;
  }
  // contract: an attribute that is not here cannot ask an element to re-render,
  // and an attribute a component WRITES to itself must never be here, because
  // that write would fire the callback that performs the render.
  //
  // Excluded because the render bodies below set them on the host:
  //   role, open, aria-label, aria-valuenow, aria-valuemin, aria-valuemax, tabindex
  // Adding one of those back to this list makes that component recurse.
  /** Shared attribute vocabulary used by components that opt into defaults. */
const OBSERVED = [
    "accept", "action", "actions", "active", "after", "allow-duplicate", "allow-remove", "allow-rename", "allow-zoom", "alpha", "anchor", "answer", "area", "article", "attribution", "attribution-mark", "audit", "autoplay", "axis", "axis-x", "axis-y", "brownout", "brownout-level", "before", "body", "brand", "breakpoint", "breaks", "brush", "brush-end", "brush-max", "brush-min", "brush-start", "cache-key", "canvas", "center", "clearable", "cols", "columns", "color", "command",
    "cells", "checked", "chrome", "debounce", "closable", "collapsed", "collapsible", "classification", "colors", "continuous", "content", "controls", "copyable", "count", "data", "data-table", "date", "delta", "description", "glyphs", "demo", "density", "desc", "dir", "direction", "disabled", "distance", "dismissible", "divider", "do", "dont", "dot", "ends", "high", "input", "layer", "low", "mode", "modes", "n", "opacity", "palette", "polarity", "precision", "range", "single",
    "empty", "exclusive", "fallback", "format", "heading", "help", "hint", "href", "icon", "illustration", "instrument", "interval", "items", "key", "layers", "level", "range-end", "range-start",
    "label", "lazy", "lede", "legend", "line", "limit", "link", "links", "live", "loading", "locale", "loop", "max", "media", "message", "method", "menu", "min", "multiple", "name", "needle", "next", "no", "no-cache", "no-data-message", "nodes", "note", "norm", "normalize",
    "options", "orientation", "page-size", "pages", "pause", "paused", "pausable", "persist", "placeholder", "playing", "point", "points", "prev", "presets", "progress", "prompt", "question", "recent", "required",
    "quote", "ramp", "refresh", "removable", "resolution", "reverse", "rings", "retry", "results", "rows", "scale", "selectable", "segments", "show-header", "sparkline", "threshold", "thresholds", "selected", "separator", "series", "shortcut", "side", "size", "skeleton", "sort", "sort-dir", "speed", "status", "step", "submit", "submitting", "timeout", "trigger", "virtual", "sticky", "cluster-count", "cluster-expanded", "time", "resizable",
    "state", "steps", "style", "subtitle", "summary", "src", "table", "tabs", "tag", "text", "ticks", "title", "type", "unit", "cluster-items", "row-height",
    "variant", "values", "viewport", "yes", "zoomable", "x", "y",
    "caption", "current-time", "is-playing", "loop-label", "no-data-color", "property", "show-loop", "show-thumb", "show-thumb-caption", "speeds", "item-height", "pause-label", "play-label", "speed-label", "time-label", "shimmer",
  ];

  /** Resolve an authored heading level while keeping the fallback valid. */
function headingTag(host, fallback = "h3") {
    const v = host && host.getAttribute ? host.getAttribute("heading") : null;
    return /^h[1-6]$/.test(v || "") ? v : fallback;
  }

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
  // SSR-safe base (R12-25): in a non-DOM runtime (Node, type-only tooling)
  // HTMLElement is undefined. Fall back to Object so the module can be imported
  // for metadata/type inspection without a DOM shim; components cannot be
  // instantiated there, which is the correct boundary.
  const _ContourBaseParent = (typeof HTMLElement !== "undefined") ? HTMLElement : Object;
class ContourBase extends _ContourBaseParent {
    static formAssociated = false;
    constructor() {
      super();
      if (this.constructor.formAssociated && typeof this.attachInternals === "function") {
        this._internals = this.attachInternals();
      }
    }
    // Per-component observed attributes. Subclasses override `static get observed()`
    // with only the attributes they read; the default is the full shared list so
    // a component that does not opt in keeps working.
    static get observed() {
      return OBSERVED;
    }
    static get observedAttributes() {
      return this.observed;
    }

    // Subclasses override to declare reflected properties:
    //   static get properties() { return { value: { attribute: "value", type: String } }; }
    // A property with no entry is not reflected. Types: String (default), Number, Boolean.
    static get properties() {
      return {};
    }

    // Update policy (R12-06): "scaffold" components may rebuild their generated
    // DOM on attribute change (the default lifecycle). High-volume components
    // (table, grid, tree, virtual-list, chart) should override to "keyed" and
    // use ensure()/keyed patching, or expose an imperative update method.
    // Documented here so consumers know which components guarantee identity
    // stability across renders.
    static get updateMode() {
      return "scaffold";
    }

    // Brownout helpers (G-16): components read their degraded level from the
    // `brownout` / `brownout-level` attribute and shed non-essential chrome
    // above a threshold. Centralised here so a new component does not
    // re-implement the attribute lookup.
    brownoutLevel() {
      const raw = this.getAttribute("brownout-level") || this.getAttribute("brownout") || "0";
      const n = parseInt(raw, 10);
      return Number.isFinite(n) ? n : 0;
    }
    shed(kind, threshold) {
      return this.brownoutLevel() >= (threshold || 1);
    }
    // Read-only and diagnostic: it exists so a page can show that `batch()` did
    // what it claims instead of asking the reader to believe it, and so a test can
    // assert a re-render happened without watching for a specific node. A consumer
    // that never calls `batch()` never needs it, and nothing here reads it.
    get renderCount() {
      return this._contourRenderCount || 0;
    }

    _countRender() {
      this._contourRenderCount = (this._contourRenderCount || 0) + 1;
    }

    // Install accessors once per class, so `el.value = 42` writes the attribute
    // and triggers the normal re-render path instead of being a silent no-op.
    static _propsInstalled = false;
    _installProperties() {
      const ctor = this.constructor;
      if (ctor._propsInstalled) return;
      ctor._propsInstalled = true;
      const props = ctor.properties || {};
      for (const [name, spec] of Object.entries(props)) {
        const attr = (spec && spec.attribute) || name;
        const type = (spec && spec.type) || String;
        Object.defineProperty(ctor.prototype, name, {
          get() {
            const raw = this.getAttribute(attr);
            if (type === Boolean) return raw !== null;
            if (raw === null) return spec && spec.default !== undefined ? spec.default : null;
            if (type === Number) { const n = Number(raw); return Number.isNaN(n) ? null : n; }
            return raw;
          },
          set(v) {
            if (v === null || v === undefined || v === false) this.removeAttribute(attr);
            else if (type === Boolean) { if (v) this.setAttribute(attr, ""); else this.removeAttribute(attr); }
            else this.setAttribute(attr, String(v));
          },
          configurable: true,
        });
      }
    }

    connectedCallback() {
      if (this._contourAuthored) { this._wireFormData(); return; } // reconnected, not re-specified
      this._installProperties();
       this._contourAuthored = {
         nodes: Array.from(this.childNodes),
         cls: this.getAttribute("class"),
       };
          const before = Array.from(this.childNodes);
          this._contourRenderGen = (this._contourRenderGen || 0) + 1;
          this._ensureCache = new Map();
          this._ensureCacheGen = this._contourRenderGen;
          this._countRender();
          try { this.render(); }
          catch (e) { console.error("Contour render error:", e); this.textContent = "Component failed to render."; }
         this._contourGenerated = Array.from(this.childNodes).filter((n) => !before.includes(n));
         this._applyParts(this);
         this._applyDensity();
         this.enhance();
         this._detachInnerFormControls();
         this._wireFormData();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      // Fires before connectedCallback during an upgrade: nothing to reset to
      // yet, and connectedCallback will render with the final attributes.
      if (!this.isConnected || !this._contourAuthored) return;
      // Opt-in batching: when inside batch(), attribute changes are coalesced
      // into a single render that fires when the batch ends. This lets a
      // dashboard update value + delta + direction without three rebuilds,
      // without changing the default synchronous contract the gate enforces.
      if (this._batchDepth > 0) {
        this._batchDirty = true;
        return;
      }
      // Re-entrant change (an attribute set while a render is in flight): do
      // not drop it, defer a single re-render to the next microtask so the
      // in-flight render can finish first. Coalesces several such changes.
      if (this._contourRendering) {
        if (!this._pendingRerender) {
          this._pendingRerender = true;
          queueMicrotask(() => {
            this._pendingRerender = false;
            if (!this.isConnected || !this._contourAuthored) return;
            // Re-run with a sentinel old value so the equality guard does not
            // short-circuit; the render reads current attribute values.
            this.attributeChangedCallback("__rerender__", null, "");
          });
        }
        return;
      }
       if (name === "checked") this._checkedAttrChanged = true;
        this._contourRendering = true;
       try {
         // Preserve form control values across a re-render: generated inputs are
         // dropped and rebuilt, so without this a host attribute change wipes
         // whatever the user typed.
         const savedControls = Array.from(this.querySelectorAll("input, textarea, select"));
         const savedValues = savedControls.map((el) => ({ key: el.name || el.id || null, value: el.value, checked: el.checked, type: el.type }));
         // Preserve focus, scroll position and <details> open state across the
         // rebuild, so a host attribute change does not yank focus to <body>
         // or collapse an open disclosure.
          const hadFocus = this.contains(document.activeElement) ? document.activeElement : null;
          // Capture a recovery key for unkeyed active elements: an id is the
          // strongest key, then a `name`, then the relative index among all
          // focusable controls inside the host. Without these, an attribute
          // update that rebuilds an unkeyed input drops focus to <body>.
          const _focusableSelector = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
          const _focusablesBefore = Array.from(this.querySelectorAll(_focusableSelector));
          const hadFocusIndex = hadFocus ? _focusablesBefore.indexOf(hadFocus) : -1;
          const hadFocusName = hadFocus ? (hadFocus.getAttribute("name") || null) : null;
         const savedScrolls = Array.from(this.querySelectorAll("*")).filter((el) => el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth).map((el) => ({ el, top: el.scrollTop, left: el.scrollLeft }));
         const savedDetails = Array.from(this.querySelectorAll("details")).map((d) => ({ id: d.id || null, open: d.open }));
         // Unwrap authored content from generated wrappers before dropping them,
         // so an attribute re-render cannot destroy authored light-DOM children
         // that render() moved into a body/pre wrapper (B3-05).
         for (const g of (this._contourGenerated || [])) {
           if (!g || g.parentNode !== this) continue;
           let wrapper = null;
           if (g.classList && (g.classList.contains("c-panel__body") || g.classList.contains("c-dialog__body"))) wrapper = g;
           else if (g.tagName === "PRE") wrapper = g.querySelector("code") || g;
           if (wrapper) {
             while (wrapper.firstChild) this.insertBefore(wrapper.firstChild, g);
           }
         }
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
         this._contourRenderGen = (this._contourRenderGen || 0) + 1;
         this._ensureCache = new Map();
         this._ensureCacheGen = this._contourRenderGen;
         this._countRender();
         try { this.render(); }
         catch (e) { console.error("Contour render error:", e); this.textContent = "Component failed to render."; }
        this._contourGenerated = Array.from(this.childNodes).filter((n) => !before.includes(n));
        this._applyParts(this);
        this._applyDensity();
        // Restore preserved form control values. A re-render that adds or
        // removes a control must not wipe the rest: keyed controls (those with
        // a `name` or `id`) are matched by key first, so a new field inserted
        // between two existing ones leaves both neighbours' values intact.
        // Unkeyed controls fall back to index matching up to the shorter of
        // the two lists, so a field removed at the end does not shift values
        // onto the wrong input.
        const newControls = Array.from(this.querySelectorAll("input, textarea, select"));
        const keyed = savedValues.filter((sv) => sv.key);
        const unkeyed = savedValues.filter((sv) => !sv.key);
        const used = new Set();
        for (const el of newControls) {
          const key = el.name || el.id || null;
          if (!key) continue;
          const match = keyed.find((sv) => sv.key === key && !used.has(sv));
          if (!match) continue;
          used.add(match);
          if (el.value === "" && el.getAttribute("value") === null) {
            el.value = match.value;
          }
           if ((el.type === "checkbox" || el.type === "radio") && typeof match.checked === "boolean" && !this._checkedAttrChanged) {
             el.checked = match.checked;
           }
        }
        let u = 0;
        for (const el of newControls) {
          if (el.name || el.id) continue;
          const saved = unkeyed[u];
          u += 1;
          if (!saved) continue;
          if (el.value === "" && el.getAttribute("value") === null) {
            el.value = saved.value;
          }
           if ((el.type === "checkbox" || el.type === "radio") && typeof saved.checked === "boolean" && !this._checkedAttrChanged) {
             el.checked = saved.checked;
           }
        }
        // Restore <details> open state. A disclosure carries an `id` when it is
        // stable across renders (a faq item, a doc section); match those by id
        // so inserting a new disclosure above them does not collapse the ones
        // below. Disclosures without an id fall back to index matching up to
        // the shorter list, which is the behaviour the length guard existed
        // to protect and still protects for the tail of either list.
        const newDetails = Array.from(this.querySelectorAll("details"));
        const keyedDetails = savedDetails.filter((sd) => sd.id);
        const usedIds = new Set();
        for (const d of newDetails) {
          const id = d.id || null;
          if (!id) continue;
          const match = keyedDetails.find((sd) => sd.id === id && !usedIds.has(sd.id));
          if (!match) continue;
          usedIds.add(match.id);
          d.open = match.open;
        }
        let di = 0;
        const plainSaved = savedDetails.filter((sd) => !sd.id);
        for (const d of newDetails) {
          if (d.id) continue;
          const sd = plainSaved[di];
          di += 1;
          if (!sd) break;
          d.open = sd.open;
        }
        // Restore scroll positions. A scroller that carries an `id` is matched by
        // id so inserting another scroller above it does not hand its offset to
        // the wrong container; the rest fall back to index matching up to the
        // shorter list, which is what the old length guard protected.
        const newScrolls = Array.from(this.querySelectorAll("*")).filter((el) => el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth);
        const keyedScrolls = savedScrolls.filter((s) => s.el.id);
        const usedScrolls = new Set();
        for (const el of newScrolls) {
          const id = el.id || null;
          if (!id) continue;
          const match = keyedScrolls.find((s) => s.el.id === id && !usedScrolls.has(s.el));
          if (!match) continue;
          usedScrolls.add(match.el);
          el.scrollTop = match.top;
          el.scrollLeft = match.left;
        }
        let si = 0;
        const plainScrolls = savedScrolls.filter((s) => !s.el.id);
        for (const el of newScrolls) {
          if (el.id) continue;
          const s = plainScrolls[si];
          si += 1;
          if (!s) break;
          el.scrollTop = s.top;
          el.scrollLeft = s.left;
        }
         // Restore focus if it was inside the host. Keyed elements (id) are
         // matched first; unkeyed ones fall back to a `name` attribute, then to
         // their relative index among focusable controls, so an attribute update
         // that rebuilds an unkeyed input no longer drops focus to <body>.
         if (hadFocus) {
           let target = null;
           if (hadFocus.id) {
             try { target = this.querySelector("#" + CSS.escape(hadFocus.id)); } catch (e) { target = null; }
           }
           if (!target && hadFocusName) {
             try { target = this.querySelector('[name="' + CSS.escape(hadFocusName) + '"]'); } catch (e) { target = null; }
           }
           if (!target && hadFocusIndex >= 0) {
             const after = Array.from(this.querySelectorAll(_focusableSelector));
             if (after.length) {
               target = after[Math.min(hadFocusIndex, after.length - 1)];
             }
           }
           if (target && typeof target.focus === "function") {
             try { target.focus(); } catch (e) {}
           } else if (document.contains(hadFocus)) {
             try { hadFocus.focus(); } catch (e) {}
           } else {
             const first = this.querySelector(_focusableSelector);
             if (first) try { first.focus(); } catch (e) {}
             else try { this.focus(); } catch (e) {}
           }
         }
         this.enhance();
         this._detachInnerFormControls();
         this._checkedAttrChanged = false;
       } finally {
        this._contourRendering = false;
      }
    }

    disconnectedCallback() {
      this._pendingRerender = false;
      this._ensureCache = null;
      this._batchDepth = 0;
      this._batchDirty = false;
      // Form listeners were removed by runDisposers below; clear the guard so
      // a reconnected host re-attaches them (connectedCallback re-wires).
      this._wiredFormData = false;
      runDisposers(this);
      // Override in subclasses that attach event listeners or timers.
    }

    adoptedCallback() {
      // Re-apply parts and the density mirror when the node is moved to a new
      // document.
      if (this._contourAuthored) { this._applyParts(this); this._applyDensity(); }
    }

    // Default no-op: subclasses with behaviour override this.
    enhance() {}

    // Form lifecycle (form-associated components only). The platform calls
    // these on <form>.reset(), on disable by a fieldset/form, and on bfcache
    // restore; before this, a reset left the generated control showing its old
    // value and a disabled fieldset reached nothing. The implementations are
    // generic over the host's inner control(s), so a subclass overrides only
    // when its control is not a plain input/textarea/select.
    //
    // The inner-value contract mirrors what each form class's enhance() sync
    // already writes: a boolean control submits its `checked` value (or null),
    // a text-like control submits its raw value, and `required` sets validity.
    _syncFormValue() {
      if (!this._internals) return;
      // A boolean group (a contour-radio-list) submits the *checked* item's
      // value, so prefer the checked control over the first one found.
      const ctl = this.querySelector("input:checked, textarea, select") || this.querySelector("input, textarea, select");
      if (!ctl) return;
      const boolean = ctl.type === "checkbox" || ctl.type === "radio";
      const value = boolean ? (ctl.checked ? (ctl.value || "on") : null) : ctl.value;
      this._internals.setFormValue(value);
      this._syncValidity(this.hasAttribute("required") && !value);
    }

    // The single validity writer (BY-32). Every form class used to repeat the
    // required-check + setValidity pair; the copies in forms.mjs now call here,
    // and the call ALSO mirrors the host's `data-invalid` custom state
    // (ElementInternals.states → `:state(data-invalid)`), so validity and the
    // state a consumer's CSS can select can never drift apart.
    _syncValidity(valueMissing) {
      if (!this._internals) return;
      if (valueMissing) this._internals.setValidity({ valueMissing: true }, "This field is required.");
      else this._internals.setValidity({});
      this._setCustomState("data-invalid", !!valueMissing);
    }

    // Custom-state mirror (BY-32). `ElementInternals.states` exposes a host's
    // own boolean to CSS as `:state(name)` — a consumer writes
    // `contour-switch:state(data-checked)` without the layer inventing a data-*
    // attribute. Loader hosts are NOT formAssociated, so the states-only
    // internals are attached lazily into `_stateInternals` — never `_internals`,
    // which every form path uses as its "form-associated" guard (`_wireFormData`
    // reads .form on it, which throws on a non-form host; probing lazy attach
    // into `_internals` broke every src-mounting arm with exactly that error).
    // Where CustomStateSet is absent the mirror is a silent no-op and the
    // ARIA/attribute path remains the announcement. Not a write to OBSERVED,
    // so it can never re-enter render.
    _setCustomState(name, on) {
      let internals = this._internals;
      if (!internals) {
        if (this._stateInternals) internals = this._stateInternals;
        else if (typeof this.attachInternals === "function") {
          try { internals = this._stateInternals = this.attachInternals(); } catch (e) { return; }
        }
      }
      const states = internals && internals.states;
      if (!states) return;
      if (on) { if (!states.has(name)) states.add(name); }
      else if (states.has(name)) states.delete(name);
    }

    // The form value events (BY-44). §23 promises interactive components emit
    // bubbling contour:* events; the form family had 16 user-interaction
    // listeners and emitted none, so a consumer could not observe a change
    // without polling. This is the ONE value-shape both `contour:input` and
    // `contour:change` carry, derived from the same control state _syncFormValue
    // submits, so the event can never disagree with the entry list.
    _emitForm(type) {
      if (!this._internals) return;
      const ctl = this.querySelector("input:checked, textarea, select") || this.querySelector("input, textarea, select");
      if (!ctl) return;
      const boolean = ctl.type === "checkbox" || ctl.type === "radio";
      this.dispatchEvent(new CustomEvent(type, {
        bubbles: true,
        composed: true,
        detail: {
          name: this.getAttribute("name"),
          value: boolean ? (ctl.checked ? (ctl.value || "on") : null) : ctl.value,
          checked: boolean ? ctl.checked : null,
        },
      }));
    }
    formResetCallback() {
      // Reset synchronously: re-rendering would restore the base class's
      // *preserved* typed value, not the authored default. The authored
      // default is the host's own value/checked attributes, so restore the
      // inner control from them, then re-sync internals.
      for (const ctl of this.querySelectorAll("input, textarea, select")) {
        if (ctl.type === "checkbox" || ctl.type === "radio") {
          ctl.checked = this.hasAttribute("checked");
        } else if (ctl.tagName === "SELECT") {
          const chosen = ctl.querySelector("option[selected], option:first-of-type");
          ctl.value = chosen ? chosen.value : "";
        } else {
          // The authored default lives on the host (`value` attribute), not
          // necessarily on the generated inner control.
          ctl.value = this.hasAttribute("value") ? this.getAttribute("value") : (ctl.getAttribute("value") || "");
        }
      }
      this._syncFormValue();
    }
    formDisabledCallback(disabled) {
      for (const ctl of this.querySelectorAll("input, textarea, select, button")) {
        if (disabled) ctl.setAttribute("disabled", "");
        else ctl.removeAttribute("disabled");
      }
    }
    formStateRestoreCallback(state) {
      if (!this._internals || state === null || state === undefined) return;
      const controls = Array.from(this.querySelectorAll("input, textarea, select"));
      const str = String(state);
      // The restore state is the value the host last submitted; for a boolean
      // group it names which inner control to check.
      const match = controls.find((c) => (c.type === "checkbox" || c.type === "radio") && c.value === str);
      if (match) {
        match.checked = true;
        for (const other of controls) {
          if (other !== match && other.type === "radio" && other.name === match.name) other.checked = false;
        }
      } else if (controls.length) {
        controls[0].value = str;
      }
      this._syncFormValue();
    }
    checkValidity() {
      return this._internals ? this._internals.checkValidity() : true;
    }
    reportValidity() {
      return this._internals ? this._internals.reportValidity() : true;
    }

    // Keep internals in step with the group. Checking radio B fires `change` on
    // B only — the deselected host A hears nothing, so its internals keep the
    // stale "a" and the entry list collects both ("g=a","g=b"; measured by the
    // form-lifecycle probe, 2026-10-28). Re-syncing in the `formdata` handler
    // is too late: the entry list has already copied each host's internals
    // before that event fires. `change` bubbles through the shared form, so a
    // same-name host re-derives its value the moment B is checked — before any
    // collection can read it.
    _wireFormData() {
      if (!this._internals || this._wiredFormData) return;
      const form = this._internals.form;
      if (!form) return;
      this._wiredFormData = true;
      const myName = this.getAttribute("name");
      const onFormChange = (e) => {
        const t = e.target;
        if (t && t.type === "radio" && t.name && t.name === myName) this._syncFormValue();
      };
      form.addEventListener("change", onFormChange);
      const onFormData = () => this._syncFormValue();
      form.addEventListener("formdata", onFormData);
      onDispose(this, () => {
        form.removeEventListener("change", onFormChange);
        form.removeEventListener("formdata", onFormData);
      });
    }

    // The inner native control(s) are scaffolding; the host reports through
    // ElementInternals. A same-name native control inside a <form> would submit
    // a second entry with the same name — double submission, measured as
    // ["g=a","g=a"] in a two-entry FormData (2026-10-27, form-lifecycle probe).
    // form="" (no matching form element) detaches it from the form owner while
    // keeping native radio-group semantics: same name, same tree, both
    // form-ownerless → they still share one checked state.
    _detachInnerFormControls() {
      if (!this._internals) return;
      for (const ctl of this.querySelectorAll("input, textarea, select")) {
        if (ctl.hasAttribute("name") && ctl.getAttribute("form") !== "") ctl.setAttribute("form", "");
      }
    }

    // Opt-in batching: coalesce multiple attribute changes into a single
    // render. Usage: el.batch(() => { el.value = 42; el.delta = "+3"; });
    // The render fires once when the callback returns, reading all final
    // attribute values. Nested calls are supported.
    /** Coalesce synchronous property changes into one render. */
    batch(fn) {
      if (typeof fn !== "function") return;
      this._batchDepth = (this._batchDepth || 0) + 1;
      this._batchDirty = this._batchDirty || false;
      try {
        fn();
      } finally {
        this._batchDepth -= 1;
        if (this._batchDepth === 0 && this._batchDirty) {
          this._batchDirty = false;
          // Trigger a single re-render with current attribute values.
          if (this.isConnected && this._contourAuthored) {
            this.attributeChangedCallback("__rerender__", null, "");
          }
        }
      }
    }

    // Ask for a re-render without naming the attribute that changed, for work the
    // host started itself — a `src` fetch that resolved, a timer, an observer. A
    // render body must never reach for `attributeChangedCallback` directly: on the
    // connect path `_contourRendering` is still false, so that call performs a
    // synchronous nested re-render and the outer body then carries on painting the
    // node the nested pass already painted. Measured in Chromium (tmp/wc9/probe.mjs,
    // 2026-10-27): a host with `src` rendered "Loading…Loading…" — two nodes — while
    // the identical host with an authored `loading` attribute rendered one.
    //
    // Deferring to a microtask lets the in-flight render finish before the next one
    // starts, and the flag coalesces N asks in one pass into one render. It runs
    // through the same reset/restore path as an attribute change, so a consumer's
    // authored nodes and focus survive it exactly as they survive a real change.
    requestRender() {
      if (this._contourRerenderQueued) return;
      this._contourRerenderQueued = true;
      queueMicrotask(() => {
        this._contourRerenderQueued = false;
        if (!this.isConnected || !this._contourAuthored) return;
        this.attributeChangedCallback("__rerender__", null, "");
      });
    }

    // Expose ::part() hooks on every generated node whose class follows the
    // `c-<block>__<element>` convention, so a consumer can theme internals
    // without shadow DOM. Runs after render() in both connect and re-render.
    _applyParts(root) {
      const scope = root || this;
      const nodes = scope.querySelectorAll ? Array.from(scope.querySelectorAll("[class]")) : [];
      for (const node of nodes) {
        if (node.hasAttribute("part")) continue;
        if (typeof node.className !== "string") continue;
        for (const c of node.className.split(/\s+/)) {
          const m = c.match(/^c-[a-z0-9-]+__([a-z0-9-]+)$/);
          if (m) { node.setAttribute("part", m[1]); break; }
        }
      }
    }

    // Density modifier (BY-48). The sheet hooks on `[data-density]` — the
    // attribute the token layer ships with (`--density`, `--density-compact`
    // in tokens.css) — so the wc layer exposes a `density` attribute and
    // mirrors it to `data-density` on the host. `data-density` is not in
    // OBSERVED, so the write cannot re-enter the render this runs from.
    _applyDensity() {
      const density = this.getAttribute("density");
      if (density !== null) this.setAttribute("data-density", density);
      else if (this.hasAttribute("data-density")) this.removeAttribute("data-density");
    }

    // The closest host above `node` on the way up to `root`, or null when the
    // path never crosses another host. `ensure()` may only reuse a node its own
    // host owns: querySelector reaches straight through a nested host's
    // boundary, so two blocks that both carry a `__title` would share one
    // element and the outer render would write the inner one's text.
    _ownerBetween(node, root) {
      for (let p = node.parentElement; p && p !== root; p = p.parentElement) {
        if (p instanceof ContourBase) return p;
      }
      return null;
    }

    // Helper for update-or-create reactivity: returns the first node matching
    // `selector`, creating it via `factory()` and appending it if absent. Render
    // bodies use this so an attribute change updates the existing node instead
    // of being blocked by a `!querySelector` guard.
    //
    // A per-render cache avoids re-querying the subtree for every ensure() call
    // in the same render pass (O(k*n) -> O(n+k)). The cache is keyed by the
    // scope it was read from as well as the selector, because a `parent` that is
    // not the host survives the next render's node reset while its cached match
    // does not — a detached element handed back instead of a fresh one appended.
    ensure(selector, factory, parent) {
      const root = parent || this;
      if (!root._ensureCache || root._ensureCacheGen !== this._contourRenderGen) {
        root._ensureCache = new Map();
        root._ensureCacheGen = this._contourRenderGen;
      }
      const cache = root._ensureCache;
      const key = root === this ? selector : "\u0000" + root + "\u0000" + selector;
      let node = cache.get(key);
      if (node === undefined) {
        // First match this host owns, skipping anything inside a nested host.
        node = null;
        for (const candidate of root.querySelectorAll(selector)) {
          if (!this._ownerBetween(candidate, root)) { node = candidate; break; }
        }
        cache.set(key, node);
      }
      if (!node) {
        node = factory();
        // Expose a ::part() hook for every generated element, so a consumer
        // can theme internals without shadow DOM. The part name is the element
        // name after the block's `__` separator (e.g. .c-card__title -> "title").
        if (node && node.setAttribute && !node.hasAttribute("part")) {
          const m = String(selector).match(/\.c-[a-z0-9-]+__([a-z0-9-]+)/);
          if (m) node.setAttribute("part", m[1]);
        }
        root.appendChild(node);
        cache.set(key, node);
      }
      return node;
    }
  }

  // Brownout mixin (G-16): opt-in base for components that shed non-essential
  // chrome under degraded conditions. Merges `brownout` / `brownout-level`
  // into the subclass observed list and exposes the helpers already on
  // ContourBase. Usage: `class Foo extends withBrownout(ContourBase) { ... }`.
function withBrownout(Base) {
    return class extends Base {
      static get observed() {
        const base = (super.observed && Array.isArray(super.observed)) ? super.observed : [];
        const extra = ["brownout", "brownout-level"];
        return Array.from(new Set(base.concat(extra)));
      }
      brownoutLevel() { return super.brownoutLevel ? super.brownoutLevel() : (parseInt(this.getAttribute("brownout-level") || this.getAttribute("brownout") || "0", 10) || 0); }
      shed(kind, threshold) { return this.brownoutLevel() >= (threshold || 1); }
    };
  }

  // Simple component: just adds CSS classes.
  /** Create a light-DOM component that only applies block and modifier classes. */
const simple = (classes) => class extends ContourBase {
    render() {
      classes.forEach((c) => this.classList.add(c));
      // Remove stale modifier classes first so attribute removal is reflected.
      for (const c of Array.from(this.classList)) {
        if (classes.some((base) => c.startsWith(base + "--"))) this.classList.remove(c);
      }
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
  /** Blocks whose custom elements need no generated markup. */
const CLASS_ONLY = [
    "box", "cluster", "container", "row", "scrim", "stack"
  ];

  // Feature detection for `hidden="until-found"` (BY-51). Browsers that do not
  // support it treat the value as the boolean hidden attribute, which would
  // hide the content permanently — so we only upgrade where supported.
  /** Detect support for the non-destructive `hidden="until-found"` value. */
function supportsUntilFound() {
    try {
      const t = document.createElement("div");
      t.setAttribute("hidden", "until-found");
      return t.getAttribute("hidden") === "until-found";
    } catch (e) { return false; }
  }

  // Value formatting (BY-31/BY-22): opt-in Intl formatting for kpi/stat/readout/coordinate.
  // `format` is a preset ("number","currency","percent","compact","date","time",
  // "unit","relative") or a JSON string of Intl.NumberFormat/DateTimeFormat/
  // RelativeTimeFormat options. `locale` defaults to the runtime locale.
  // Returns the raw value when formatting fails.
  /** Format a value with the component's supported Intl presets. */
function formatValue(value, format, locale, unit) {
    if (!format) return value;
    const loc = locale || (typeof navigator !== "undefined" && navigator.language) || "en";
    if (format === "date" || format === "time") {
      try {
        const opts = format === "time" ? { timeStyle: "short" } : undefined;
        return new Intl.DateTimeFormat(loc, opts).format(new Date(value));
      } catch (e) { return value; }
    }
    if (format === "relative") {
      try {
        const num = Number(value);
        // Interpret the value as seconds from now unless it is an ISO date.
        let seconds = num;
        if (Number.isNaN(num)) {
          const then = new Date(value).getTime();
          if (Number.isFinite(then)) seconds = (then - Date.now()) / 1000;
        }
        const rtf = new Intl.RelativeTimeFormat(loc, { numeric: "auto" });
        if (Math.abs(seconds) < 60) return rtf.format(Math.round(seconds), "second");
        if (Math.abs(seconds) < 3600) return rtf.format(Math.round(seconds / 60), "minute");
        if (Math.abs(seconds) < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
        return rtf.format(Math.round(seconds / 86400), "day");
      } catch (e) { return value; }
    }
    let opts = {};
    if (format === "currency") opts = { style: "currency", currency: "USD" };
    else if (format === "percent") opts = { style: "percent" };
    else if (format === "compact") opts = { notation: "compact" };
    else if (format === "unit") opts = { style: "unit", unit: unit || "meter" };
    else if (format !== "number") {
      try { opts = JSON.parse(format); } catch (e) { return value; }
    }
    try { return new Intl.NumberFormat(loc, opts).format(Number(value)); }
    catch (e) { return value; }
  }

  // Spatial maths (BY-23): pure functions on the host's own attributes.
  // Haversine distance in meters between two lat/lon points.
  /** Return the great-circle distance between two latitude/longitude points. */
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (d) => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }
  // Bearing in degrees (clockwise from north) from point 1 to point 2.
  /** Return the initial bearing from one latitude/longitude point to another. */
function bearing(lat1, lon1, lat2, lon2) {
    const toRad = (d) => d * Math.PI / 180;
    const toDeg = (r) => r * 180 / Math.PI;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }
  // Mercator resolution (meters per pixel) at a given latitude and zoom.
  /** Return meters per pixel for Web Mercator at a latitude and zoom level. */
function mercatorResolution(lat, zoom) {
    return 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
  }

/* ============================================================================
   CONTOUR — SVG geometry helpers (pure functions, zero dependencies)
   ----------------------------------------------------------------------------
   Lightweight path generators for the spatial chart variants that Contour's
   CSS already styles (.c-chart--donut, .c-chart--histogram, .c-sparkline).
   They return strings suitable for an SVG `d` attribute or a list of
   {x, y, width, height} rectangles, so a consumer never has to hand-compute
   arc math or bar widths for a basic cartographic control.

   Every function is pure: no DOM, no state, no side effects. They are
   exported so a consumer can import them directly, and the chart component
   uses them when its `series` attribute carries structured data rather than
   a pre-computed path string.
   ========================================================================= */
"use strict";

/**
 * Build an SVG arc path for a single donut slice.
 *
 * @param {number} cx centre x
 * @param {number} cy centre y
 * @param {number} r  outer radius
 * @param {number} inner inner radius (0 for a pie)
 * @param {number} startAngle start angle in radians
 * @param {number} endAngle   end angle in radians
 * @returns {string} SVG path `d` attribute
 */
/** Build an SVG arc path string. */
function arcPath(cx, cy, r, inner, startAngle, endAngle) {
  // Clamp non-finite inputs so a bad value cannot emit NaN/Infinity into the
  // path string (B3-22). A degenerate slice collapses to a point.
  cx = Number.isFinite(cx) ? cx : 0;
  cy = Number.isFinite(cy) ? cy : 0;
  r = Number.isFinite(r) && r > 0 ? r : 0;
  inner = Number.isFinite(inner) && inner >= 0 ? inner : 0;
  startAngle = Number.isFinite(startAngle) ? startAngle : 0;
  endAngle = Number.isFinite(endAngle) ? endAngle : 0;
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  if (inner <= 0) {
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }
  const ix1 = cx + inner * Math.cos(endAngle);
  const iy1 = cy + inner * Math.sin(endAngle);
  const ix2 = cx + inner * Math.cos(startAngle);
  const iy2 = cy + inner * Math.sin(startAngle);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${inner} ${inner} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
}

/**
 * Convert a list of values into donut slice paths.
 *
 * @param {number[]} values
 * @param {object} [opts]
 * @param {number} [opts.cx=100]
 * @param {number} [opts.cy=100]
 * @param {number} [opts.r=90]
 * @param {number} [opts.inner=55]
 * @param {number} [opts.gap=0.02] angular gap between slices in radians
 * @returns {{path: string, value: number, index: number}[]}
 */
/** Compute donut slice geometry. */
function donutSlices(values, opts) {
  opts = opts || {};
  const cx = opts.cx != null ? opts.cx : 100;
  const cy = opts.cy != null ? opts.cy : 100;
  const r = opts.r != null ? opts.r : 90;
  const inner = opts.inner != null ? opts.inner : 55;
  const gap = opts.gap != null ? opts.gap : 0.02;
  const total = values.reduce((a, b) => a + (Number(b) || 0), 0) || 1;
  let angle = -Math.PI / 2;
  const out = [];
   values.forEach((v, i) => {
     const num = Number(v) || 0;
     const frac = num / total;
     if (!(num > 0)) { angle += frac * Math.PI * 2; return; }
     const sweep = frac * Math.PI * 2 - gap;
     const start = angle + gap / 2;
     const end = start + Math.max(0, sweep);
     out.push({ path: arcPath(cx, cy, r, inner, start, end), value: num, index: i });
     angle += frac * Math.PI * 2;
   });
  return out;
}

/**
 * Compute bar rectangles for a histogram.
 *
 * @param {number[]} values
 * @param {object} [opts]
 * @param {number} [opts.width=300]
 * @param {number} [opts.height=120]
 * @param {number} [opts.gap=2]
 * @param {number} [opts.max] override max value (defaults to max of values)
 * @returns {{x:number,y:number,width:number,height:number}[]}
 */
/** Compute bar rectangle geometry. */
function barRects(values, opts) {
  opts = opts || {};
  const width = opts.width != null ? opts.width : 300;
  const height = opts.height != null ? opts.height : 120;
  const gap = opts.gap != null ? opts.gap : 2;
  const max = opts.max != null ? opts.max : (Math.max.apply(null, values.map((v) => Number(v) || 0)) || 1);
  if (!Number.isFinite(max) || max <= 0) return values.map(() => ({ x: 0, y: height, width: 0, height: 0 }));
  const n = values.length || 1;
  const slot = width / n;
  const barW = Math.max(1, slot - gap);
  return values.map((v, i) => {
    const h = ((Number(v) || 0) / max) * height;
    return { x: i * slot + gap / 2, y: height - h, width: barW, height: h };
  });
}

/**
 * Build an SVG polyline `points` attribute from a list of numbers.
 *
 * @param {number[]} values
 * @param {object} [opts]
 * @param {number} [opts.width=300]
 * @param {number} [opts.height=120]
 * @param {number} [opts.max] override max
 * @param {number} [opts.min] override min
 * @returns {string} "x,y x,y ..."
 */
/** Compute polyline point string. */
function polylinePoints(values, opts) {
  opts = opts || {};
  const width = opts.width != null ? opts.width : 300;
  const height = opts.height != null ? opts.height : 120;
  const nums = values.map((v) => Number(v) || 0);
  if (!nums.length) return "";
  const max = opts.max != null ? opts.max : Math.max.apply(null, nums);
  const min = opts.min != null ? opts.min : Math.min.apply(null, nums);
  const range = (Number.isFinite(max - min) && (max - min) !== 0) ? (max - min) : 1;
  const n = nums.length || 1;
  return nums.map((v, i) => {
    const x = (i / Math.max(1, n - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return x.toFixed(2) + "," + y.toFixed(2);
  }).join(" ");
}

/**
 * Build a smooth (monotone) SVG path through a list of numbers.
 *
 * @param {number[]} values
 * @param {object} [opts] same as polylinePoints
 * @returns {string} SVG path `d` attribute
 */
/** Compute a smoothed SVG path. */
function smoothPath(values, opts) {
  const pts = polylinePoints(values, opts).split(" ").map((p) => p.split(",").map(Number));
  if (!pts.length) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const cpx = (prev[0] + cur[0]) / 2;
    d += ` C ${cpx} ${prev[1]}, ${cpx} ${cur[1]}, ${cur[0]} ${cur[1]}`;
  }
  return d;
}

/**
 * Build an SVG path for a compass needle pointing at `angleDeg` (clockwise
 * from north/up). The needle is a thin triangle from the centre to the tip,
 * with a short tail in the opposite direction.
 *
 * @param {number} cx centre x
 * @param {number} cy centre y
 * @param {number} length needle length (tip distance from centre)
 * @param {number} [angleDeg=0] bearing in degrees, clockwise from up
 * @param {number} [width=3] half-width of the needle at the base
 * @returns {string} SVG path `d` attribute
 */
/** Compute compass needle geometry. */
function compassNeedle(cx, cy, length, angleDeg, width) {
  angleDeg = angleDeg == null ? 0 : angleDeg;
  width = width == null ? 3 : width;
  const a = (angleDeg - 90) * Math.PI / 180; // 0deg = up
  const tipX = cx + length * Math.cos(a);
  const tipY = cy + length * Math.sin(a);
  const tail = length * 0.25;
  const tailX = cx - tail * Math.cos(a);
  const tailY = cy - tail * Math.sin(a);
  const perpX = Math.cos(a + Math.PI / 2);
  const perpY = Math.sin(a + Math.PI / 2);
  const b1x = cx + width * perpX;
  const b1y = cy + width * perpY;
  const b2x = cx - width * perpX;
  const b2y = cy - width * perpY;
  return `M ${tipX.toFixed(2)} ${tipY.toFixed(2)} L ${b1x.toFixed(2)} ${b1y.toFixed(2)} L ${tailX.toFixed(2)} ${tailY.toFixed(2)} L ${b2x.toFixed(2)} ${b2y.toFixed(2)} Z`;
}

/**
 * Compute tick values for a scale bar.
 *
 * @param {number} value total value (max)
 * @param {number} [segments=4] number of segments
 * @returns {number[]} tick values from 0 to value inclusive
 */
/** Compute scale bar tick positions. */
function scaleBarTicks(value, segments) {
  value = Number(value) || 0;
  segments = Math.max(1, Math.round(segments || 4));
  const out = [];
  for (let i = 0; i <= segments; i++) {
    out.push((value / segments) * i);
  }
  return out;
}
// Marker shape encoding utility (G-13)
/** Supported marker shapes for chart series. */
const MARKER_SHAPES = ["circle", "square", "triangle", "diamond", "star"];
/** Return CSS styles for a marker shape. */
function markerStyles(shape) {
  const map = {
    circle: "border-radius:50%",
    square: "border-radius:0",
    triangle: "clip-path:polygon(50% 0%,0% 100%,100% 100%)",
    diamond: "transform:rotate(45deg)",
    star: "clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)",
  };
  return map[shape] || "";
}
/** Assign marker shapes to chart items. */
function assignMarkers(items) {
  return (items || []).map((it, i) => ({ ...it, marker: MARKER_SHAPES[i % MARKER_SHAPES.length] }));
}

/* ============================================================================
   CONTOUR — shared behaviour
   ----------------------------------------------------------------------------
   One implementation of each interaction, called by both layers: the light-DOM
   wrappers and the `contour-shadow-*` wrappers.

   Before this file the two layers each carried a copy, and the copies had
   already drifted in the one direction source review cannot see: the shadow copy
   queried its own root for nodes the author slots into the light DOM, so it
   found nothing and wired nothing. Measured against the shipped artifact
   (tmp/r3/behaviour-baseline.mjs):

     PASS  light contour-tabs renders 2 tabs, ArrowRight moves selection
     PASS  light segmented emits contour:change
     PASS  light pagination emits contour:page
     FAIL  shadow tabs: inner query sees slotted tabs   [inside shadow root: 0; slotted: 2]
     FAIL  shadow segmented / shadow menu: event reaches the document

   Two rules fall out of that, and they are the whole design of this file:
   a behaviour looks in BOTH trees, because slotted content lives in the light
   DOM; and it dispatches on the HOST, because a bubbling event from a node
   inside a shadow root reaches neither the host nor the document:

     bubbles-only -> reachedHost:false  reachedDoc:false

   Names are prefixed where they could collide: `stripWc` concatenates every
   fragment into one IIFE scope, so `emit`, `on` or `once` as bare top-level
   consts would silently shadow another module's. Nothing here owns markup or
   styling; a component decides what to render, this file only what happens when
   the reader acts on it.
   ========================================================================= */

// `contourId` is the shared counter: a generated node that needs an id (a
// listbox's options, an aria-controls target) takes it from here rather than
// calling Math.random(), which can hand two instances the same id and then point
// one control at another's list.

// A host is wired once per behaviour. Re-entering is normal — the base class
// calls enhance() after every render — so the guard lives in a WeakMap keyed on
// the node, where a re-render cannot drop it.
const WIRED_HOSTS = new WeakMap();
/** Reset the wired-host claim for a host, allowing re-wiring after disconnect. */
const wcReset = (host) => { WIRED_HOSTS.delete(host); };
const wcClaim = (host, name) => {
  let set = WIRED_HOSTS.get(host);
  if (!set) { set = new Set(); WIRED_HOSTS.set(host, set); }
  if (set.has(name)) return false;
  set.add(name);
  return true;
};

// Authored content sits in the light DOM even when a shadow template slots it,
// and a template's own parts sit in the root: a behaviour owns both.
const wcScopes = (host) => (host.shadowRoot ? [host, host.shadowRoot] : [host]);
const wcAll = (host, sel) => {
  const found = [];
  for (const scope of wcScopes(host)) {
    for (const el of scope.querySelectorAll(sel)) if (!found.includes(el)) found.push(el);
  }
  return found;
};
const wcOne = (host, sel) => wcAll(host, sel)[0] || null;
// A custom element carries its own block class, and `querySelectorAll` never
// returns the node it was called on, so a group element that IS the host has to
// be added explicitly or the light wrappers find no group at all.
const wcSelfOrAll = (host, sel) => {
  const found = typeof host.matches === "function" && host.matches(sel) ? [host] : [];
  for (const el of wcAll(host, sel)) if (!found.includes(el)) found.push(el);
  return found;
};
// The flat tree is not the node tree. A group element inside a shadow root and
// the nodes slotted into it are in different trees, so `group.contains(node)` is
// false for exactly the authored content the group exists to hold. A group's
// nodes are therefore its own subtree plus, when the group is template-owned,
// the host's light DOM — which is what a reader actually slotted into it.
const wcShadowOf = (node) => {
  const root = node && node.getRootNode ? node.getRootNode() : null;
  return root && root.host ? root : null;
};
const wcGroup = (host, group, sel) => {
  const found = Array.from(group.querySelectorAll(sel));
  if (wcShadowOf(group) && wcShadowOf(group).host === host) {
    for (const el of host.querySelectorAll(sel)) if (!found.includes(el)) found.push(el);
  }
  return found;
};
// Both scopes are listened to because retargeting is the asymmetry that decides
// where a node is visible from: a listener on the host sees the author's slotted
// nodes with their real target, but an event that started inside a shadow tree
// arrives there retargeted to the host, so `closest` finds nothing. The root
// listener sees those inner nodes unretargeted.
//
// A composed event is therefore heard twice on its way out, so each handler runs
// once per event — but keyed on the handler too. A set of events alone would let
// one component swallow the click of a component nested inside it, and each host
// owns its own interaction.
const HEARD = new WeakMap();
const wcListen = (host, type, handler) => {
  const scoped = (e) => {
    let seen = HEARD.get(e);
    if (!seen) { seen = new Set(); HEARD.set(e, seen); }
    if (seen.has(scoped)) return;
    seen.add(scoped);
    handler(e);
  };
  for (const scope of wcScopes(host)) scope.addEventListener(type, scoped);
};
const wcOwned = (host, node) =>
  !!node && wcScopes(host).some((scope) => scope.contains(node));
// `closest` is asked of the event's own target, which is unretargeted inside the
// tree that heard it; `wcOwned` then rejects a match outside this host.
const wcClosest = (host, target, sel) =>
  (typeof target?.closest === "function" && wcOwned(host, target)) ? target.closest(sel) : null;
// Dispatched on the HOST, so a listener outside this layer hears it whatever the flag
// says — which is why an event reaching the document proves nothing about `composed`.
// The flag is for a boundary this layer does not own: A/B on a wrapper mounted inside a
// foreign component's shadow root, the option pressed in both runs, and the document
// heard the event in one of them — `composed: false` arrived 0 times, `composed: true`
// once. Consumers that wrap contour inside their own shadow tree are who it serves.
const wcEmit = (host, name, detail) => {
  host.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
};

/**
 * Tabs and code-tabs: roving tabindex, Arrow/Home/End, panel show-hide.
 * The active tab is `[aria-selected="true"]`, which is the rule the sheet
 * paints, so no state class is ever written — and none is invented either.
 */
// RTL awareness (BY2-A7): a horizontal control reverses its arrow keys in a
// right-to-left context, so ArrowRight moves to the previous item and
// ArrowLeft to the next. The direction is read from the host, then its
// nearest ancestor, then the document — the same cascade the platform uses.
function isRtl(host) {
  let el = host;
  while (el && el.nodeType === 1) {
    const d = el.getAttribute && el.getAttribute("dir");
    if (d) return d.toLowerCase() === "rtl";
    el = el.parentElement;
  }
  try { return (document.documentElement.getAttribute("dir") || "").toLowerCase() === "rtl"; }
  catch (e) { return false; }
}

/** Wire tab keyboard navigation and selection for a host. */
function wireTabs(host) {
  if (!wcClaim(host, "tabs")) return;
  for (const list of wcSelfOrAll(host, ".c-tabs__list, .c-code-tabs__list")) {
    const isCode = list.classList.contains("c-code-tabs__list");
    const panelSel = isCode ? ".c-code-tabs__panel" : ".c-tabs__panel";
    // `list.contains(tab)` is the test that fails on a shadow wrapper: the list
    // is in the root and the tabs the author wrote are slotted light DOM, so the
    // node tree says they are unrelated even though the flat tree does not.
    const tabsOf = () => wcGroup(host, list, "[role='tab']");
    const activate = (tab, focus) => {
      const tabs = tabsOf();
      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.tabIndex = selected ? 0 : -1;
        const ctrl = t.getAttribute("aria-controls");
        if (!ctrl) return;
        const panel = wcOne(host, "#" + CSS.escape(ctrl)) || document.getElementById(ctrl);
        if (panel) panel.hidden = !selected;
      });
      const panels = wcAll(host, panelSel);
      if (panels.length) {
        const index = tabs.indexOf(tab);
        panels.forEach((p, i) => { p.hidden = i !== index; });
      }
      if (focus) try { tab.focus(); } catch (e) { /* detached mid-key */ }
      // Emit activation so consumers can observe tab changes (B3-10).
      const name = tab.getAttribute("aria-controls") || tab.textContent || "";
      host.dispatchEvent(new CustomEvent("contour:tab-change", { bubbles: true, composed: true, detail: { index: tabs.indexOf(tab), label: name } }));
    };
    // Same-document View Transitions (BY-24). A consumer who names elements via
    // `data-view-transition` / `--view-transition-name` gets a cross-fade on a
    // tab swap; the morph must run inside startViewTransition so the browser
    // has an old and a new state to interpolate. The initial mount activation
    // below stays direct — a transition on load is a page fade nobody asked
    // for — and the plain swap is the entire fallback, because the CSS harness
    // (components.css) is enhancement-only too.
    const runActivation = (tab, focus) => {
      // Keyboard activation must update aria-selected synchronously so assistive
      // tech and keyboard users see the new state immediately; view transitions
      // are a visual enhancement and must not defer the state change (a deferred
      // activation leaves the previous tab marked selected until the transition
      // callback runs, which breaks keyboard roving and any synchronous test).
      const can = !focus && typeof document.startViewTransition === "function"
        && !(typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
      if (can) {
        try { document.startViewTransition(() => activate(tab, focus)); return; }
        catch (e) { /* an in-flight transition or a private context: plain swap */ }
      }
      activate(tab, focus);
    };
    wcListen(host, "click", (e) => {
      const tab = wcClosest(host, e.target, "[role='tab']");
      if (tab && tabsOf().includes(tab)) runActivation(tab, false);
    });
    wcListen(host, "keydown", (e) => {
      let tab = wcClosest(host, e.target, "[role='tab']");
      if (!tab && e.target && e.target.getAttribute && e.target.getAttribute("role") === "tab" && wcOwned(host, e.target)) tab = e.target;
      const tabs = tabsOf();
      const index = tabs.indexOf(tab);
      if (index < 0) return;
      const vertical = host.getAttribute("orientation") === "vertical";
      const rtl = isRtl(host);
      const move = vertical
        ? (rtl
            ? { ArrowDown: index - 1, ArrowUp: index + 1, Home: tabs.length - 1, End: 0 }
            : { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: tabs.length - 1 })
        : (rtl
            ? { ArrowRight: index - 1, ArrowLeft: index + 1, Home: tabs.length - 1, End: 0 }
            : { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 });
      if (!(e.key in move)) return;
      e.preventDefault();
      const next = tabs[(move[e.key] + tabs.length) % tabs.length];
      if (next) runActivation(next, true);
    });
    // Respect an author-marked selected tab; fall back to the first. With
    // `persist="storage"` (BY-49) the last user choice wins over both, so a
    // reload lands on the tab the reader left. The key is the host id (a
    // stable identity the author provides); without one persistence is a
    // no-op rather than a collision across every unnamed tabs instance.
    const tabs = tabsOf();
    const persist = host.getAttribute("persist");
    let restored = null;
    if (persist === "storage" && host.id) {
      try { restored = localStorage.getItem("contour-tabs:" + host.id); } catch (e) { restored = null; }
    } else if (persist === "url") {
      try {
        const params = new URLSearchParams(window.location.search);
        const v = params.get("c-tabs");
        if (v !== null) restored = v;
      } catch (e) { restored = null; }
    }
    const marked = tabs.find((t) => t.getAttribute("aria-selected") === "true");
    let first = marked || tabs[0];
    if (restored !== null) {
      const idx = parseInt(restored, 10);
      if (Number.isFinite(idx) && tabs[idx]) first = tabs[idx];
    }
    if (first) activate(first, false);
    // Persist on every subsequent activation.
    if (persist === "storage" && host.id) {
      host.addEventListener("contour:tab-change", (e) => {
        try { localStorage.setItem("contour-tabs:" + host.id, String(e.detail && e.detail.index)); } catch (err) { /* quota/private mode */ }
      });
    } else if (persist === "url") {
      host.addEventListener("contour:tab-change", (e) => {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set("c-tabs", String(e.detail && e.detail.index));
          window.history.replaceState(null, "", url.toString());
        } catch (err) { /* no history API */ }
      });
    }
  }
}

/**
 * Segmented control: one pressed option, and `contour:change`. The guide's own
 * markup carries the option value in a `data-*-value` hook, so the event reads
 * the hook it can see and falls back to the label the reader sees.
 */
/** Wire segmented-control selection for a host. */
function wireSegmented(host) {
  const groups = wcSelfOrAll(host, ".c-segmented");
  // The block's contract is the option class, a group role and an explicit
  // pressed state — that is what the sheet styles (`.c-segmented__option
  // [aria-pressed="true"]`) and what the guide's raw specimens write by hand. A
  // wrapper that only classes the host leaves the author's buttons unstyled:
  // measured in §23, three buttons with no class and no `aria-pressed` at all.
  // Normalised here, on every pass, so both layers and slotted markup agree.
  const normalize = () => {
    // Who owns the pressed state. The author's `value` wins when it CHANGES — an
    // attribute the author writes again is a new instruction — and the reader's own
    // click wins in between, because the pressed attribute on the option is that
    // choice and these buttons are the author's nodes, which survive a re-render.
    // The one remembered value is what makes both halves hold: without it a click
    // would move the state and the next re-render would move it back to `value`;
    // with a bare "reader has picked" flag, an author writing `value` later would
    // be ignored forever.
    const authored = host.getAttribute("value");
    const chosen = authored !== host._segAuthorValue ? authored : null;
    if (chosen !== null) host._segAuthorValue = authored;
    let seen = 0;
    for (const g of groups) {
      if (!g.hasAttribute("role")) g.setAttribute("role", "group");
      const label = host.getAttribute("label");
      if (label && !g.hasAttribute("aria-label")) g.setAttribute("aria-label", label);
      const opts = wcGroup(host, g, "button");
      seen += opts.length;
      opts.forEach((b) => {
        b.classList.add("c-segmented__option");
        b.setAttribute("aria-pressed", chosen !== null && chosen !== undefined ? String(b.dataset.value === chosen) : (b.getAttribute("aria-pressed") === "true" ? "true" : "false"));
      });
      // One tab stop for the group, on the pressed option — or the first when the
      // author chose none. Arrow keys then move it along with focus.
      const chosenOpt = opts.find((b) => b.getAttribute("aria-pressed") === "true") || opts[0];
      opts.forEach((b) => { b.tabIndex = b === chosenOpt ? 0 : -1; });
    }
    return seen;
  };
  // A classic `<script src="dist/contour-wc.js">` in `<head>` upgrades the host
  // while the parser is still inside it, so the author's buttons do not exist yet
  // and this pass normalises nothing — measured across three arms: head gave 0
  // option classes, 0 pressed states and 2 tab stops, where the same bundle with
  // `defer` and the ESM entry (deferred by spec) both gave 2, 2, 1. The listeners
  // below are unaffected because they delegate on the host, which outlives the
  // parse. One retry on a later task is all the missing children need; a group
  // that is genuinely empty just re-runs an idempotent pass once.
  if (!normalize()) {
    if (!host._segRetryScheduled) {
      host._segRetryScheduled = true;
      setTimeout(() => { host._segRetryScheduled = false; normalize(); }, 0);
    }
  }
  if (!wcClaim(host, "segmented")) return;
  const activate = (btn) => {
    const seg = groups.find((g) => wcGroup(host, g, "button").includes(btn));
    if (!seg) return;
    // `value` is deliberately not written back to the host here: it sits in the
    // shared OBSERVED list, so writing it would spend a full re-render on every
    // click. The pressed attribute on the option is the state, and it survives a
    // re-render because these buttons are the author's nodes, not generated ones.
    wcGroup(host, seg, "button").forEach((o) => {
      const on = o === btn;
      o.setAttribute("aria-pressed", String(on));
      o.tabIndex = on ? 0 : -1;
    });
    wcEmit(host, "contour:change", { value: btn.dataset.value || btn.textContent.trim() });
  };
  wcListen(host, "click", (e) => {
    const btn = wcClosest(host, e.target, "button");
    if (!btn) return;
    activate(btn);
  });
  wcListen(host, "keydown", (e) => {
    const btn = wcClosest(host, e.target, "button");
    if (!btn) return;
    const seg = groups.find((g) => wcGroup(host, g, "button").includes(btn));
    if (!seg) return;
    const opts = wcGroup(host, seg, "button");
    const idx = opts.indexOf(btn);
    let next = -1;
    const rtl = isRtl(host);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = rtl ? Math.max(idx - 1, 0) : Math.min(idx + 1, opts.length - 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = rtl ? Math.min(idx + 1, opts.length - 1) : Math.max(idx - 1, 0);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = opts.length - 1;
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(btn); return; }
    if (next >= 0 && next !== idx) { e.preventDefault(); opts[next].focus(); }
  });
}

/**
 * Combobox: filter, arrow-cursor the visible options, commit, dismiss outside.
 * Native `<select>` stays native elsewhere — its popup cannot be styled — so the
 * one list this file drives is the one the system does draw.
 */
/** Wire combobox filtering, keyboard nav and selection for a host. */
function wireCombobox(host) {
  wireComboboxDocDismiss();
  const input = wcOne(host, ".c-combobox__input");
  const list = wcOne(host, ".c-combobox__list");
  if (!input || !list) return;
  const optionList = () => wcAll(host, ".c-combobox__option");

  // Roles are re-applied on every pass, not claimed once. A re-render drops the
  // generated input and list and rebuilds them, so an attribute set on the first
  // pass is simply gone; the roles also belong to the markup, which the shared
  // implementation is what both layers have in common. Idempotent, so re-running
  // it cannot stack anything.
  if (!list.id) list.id = contourId("c-combobox-list");
  list.setAttribute("role", "listbox");
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-haspopup", "listbox");
  input.setAttribute("aria-controls", list.id);
  input.setAttribute("aria-expanded", list.hasAttribute("hidden") ? "false" : "true");
  if (!input.hasAttribute("aria-autocomplete")) input.setAttribute("aria-autocomplete", "list");
  optionList().forEach((opt, i) => {
    if (!opt.id) opt.id = contourId("c-combobox-option");
    opt.setAttribute("role", "option");
    if (!opt.hasAttribute("aria-selected")) opt.setAttribute("aria-selected", "false");
  });

  // Listeners are claimed once, and they are delegated on the HOST for the same
  // reason the other behaviours are: a listener bound to the generated input died
  // with it on the next render while the per-host claim was already spent, so a
  // combobox that changed any attribute stopped opening and stopped answering the
  // arrow keys. Measured: fresh -> openedOnFocus true, activeOptionCount 1; after
  // a placeholder change -> false and 0. The host outlives every rebuild, so the
  // nodes are looked up again per event instead of captured.
  if (!wcClaim(host, "combobox")) return;
  const liveInput = () => wcOne(host, ".c-combobox__input");
  const liveList = () => wcOne(host, ".c-combobox__list");
  let cursor = -1;
  const mark = (visible) => {
    const field = liveInput();
    visible.forEach((o, i) => {
      const on = i === cursor;
      o.classList.toggle("c-combobox__option--active", on);
      o.setAttribute("aria-selected", String(on));
    });
    if (field) {
      const active = cursor >= 0 ? visible[cursor] : null;
      if (active) field.setAttribute("aria-activedescendant", active.id);
      else field.removeAttribute("aria-activedescendant");
    }
  };
  const filter = (query) => {
    const q = (query || "").toLowerCase();
    if (host._comboboxVirtual && typeof host._renderComboboxWindow === "function") {
      host._renderComboboxWindow(q, true);
      cursor = -1;
      return;
    }
    optionList().forEach((o) => { o.hidden = !!(q && !o.textContent.toLowerCase().includes(q)); });
    cursor = -1;
  };
  const open = () => {
    const l = liveList();
    if (!l) return;
    l.removeAttribute("hidden");
    const field = liveInput();
    if (field) field.setAttribute("aria-expanded", "true");
  };
  const close = () => {
    const l = liveList();
    if (l) l.setAttribute("hidden", "");
    const field = liveInput();
    if (field) {
      field.setAttribute("aria-expanded", "false");
      field.removeAttribute("aria-activedescendant");
    }
    cursor = -1;
    // Cleared across every option, not the visible subset: an option that was
    // cursorred and then filtered out would otherwise keep `aria-selected="true"`
    // into the next open, and a listbox may report only one selected option.
    optionList().forEach((o) => {
      o.classList.remove("c-combobox__option--active");
      o.setAttribute("aria-selected", "false");
    });
  };
  if (host._comboboxVirtual && list && !list._contourVirtualScroll) {
    list._contourVirtualScroll = true;
    list.addEventListener("scroll", () => {
      if (typeof host._renderComboboxWindow === "function") host._renderComboboxWindow(host._comboboxQuery || "");
    }, { passive: true });
  }
  const commit = (opt) => {
    const field = liveInput();
    if (!field) return;
    if (host.hasAttribute("multiple")) {
      const now = opt.getAttribute("aria-selected") === "true";
      opt.setAttribute("aria-selected", String(!now));
      opt.classList.toggle("c-combobox__option--selected", !now);
      const selected = (host.getAttribute("value") || "").split(",").map((v) => v.trim()).filter(Boolean);
      const value = host._comboboxVirtual && host._comboboxFiltered
        ? host._comboboxFiltered.find((item) => item.index === Number(opt.dataset.optionIndex))?.value
        : opt.textContent.trim();
      const position = selected.indexOf(String(value));
      if (now && position >= 0) selected.splice(position, 1);
      if (!now && position < 0) selected.push(String(value));
      host.setAttribute("value", selected.join(","));
      if (typeof host._syncFormValue === "function") host._syncFormValue();
      wcEmit(host, "contour:select", { value: selected });
      field.focus();
      return;
    }
    field.value = opt.textContent;
    wcEmit(host, "contour:select", { value: field.value });
    close();
    field.focus();
  };

  // `input` and `focus` do not both bubble out of a shadow root in the same way,
  // so `focusin` is what the focus-driven open listens to, and every handler
  // checks the event actually came from this host's field.
  const isField = (target) => wcClosest(host, target, ".c-combobox__input") !== null;
  wcListen(host, "input", (e) => {
    if (!isField(e.target)) return;
    host._comboboxQuery = e.target.value;
    filter(e.target.value);
    open();
    // The form-value event (BY-44) rides on the same interaction; the shadow
    // wrappers share this behaviour but have no `_emitForm`, so guard it.
    if (typeof host._emitForm === "function") host._emitForm("contour:input");
  });
  wcListen(host, "focusin", (e) => {
    if (!isField(e.target)) return;
    filter(e.target.value);
    open();
  });
  wcListen(host, "keydown", (e) => {
    if (!isField(e.target)) return;
    const visible = optionList().filter((o) => !o.hidden);
    if (e.key === "ArrowDown") { e.preventDefault(); cursor = Math.min(cursor + 1, visible.length - 1); mark(visible); }
    else if (e.key === "ArrowUp") { e.preventDefault(); cursor = Math.max(cursor - 1, 0); mark(visible); }
    else if (e.key === "Home") { e.preventDefault(); cursor = 0; mark(visible); }
    else if (e.key === "End") { e.preventDefault(); cursor = Math.max(0, visible.length - 1); mark(visible); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (cursor >= 0 && visible[cursor]) commit(visible[cursor]); }
    else if (e.key === "Escape") close();
  });
  wcListen(host, "click", (e) => {
    const opt = wcClosest(host, e.target, ".c-combobox__option");
    if (opt) { commit(opt); return; }
    if (!wcOwned(host, e.target) || !host.contains(e.target)) close();
  });
}

// Outside-click dismissal for comboboxes. A single document listener is cheaper and
// leak-free compared to one per instance; it closes every open list whose host
// does not contain the click target.
let _comboboxDocWired = false;
function wireComboboxDocDismiss() {
  if (_comboboxDocWired) return;
  _comboboxDocWired = true;
  document.addEventListener("click", (e) => {
    for (const host of document.querySelectorAll("contour-combobox, contour-shadow-combobox")) {
      const list = host.shadowRoot ? host.shadowRoot.querySelector(".c-combobox__list") : host.querySelector(".c-combobox__list");
      const input = host.shadowRoot ? host.shadowRoot.querySelector(".c-combobox__input") : host.querySelector(".c-combobox__input");
      if (!list || list.hasAttribute("hidden")) continue;
      const root = host.shadowRoot || host;
      if (root.contains(e.target)) continue;
      list.setAttribute("hidden", "");
    }
  });
}

/**
 * The tree items a keyboard reader can actually reach. A collapsed branch carries
 * `hidden`, and a hidden element is not focusable, so a tab stop placed on one is
 * a stop the reader never arrives at — measured when this was missed: ArrowDown
 * left focus where it was and moved the only stop onto a hidden child.
 */
const visibleStops = (host) => wcAll(host, ".c-tree__toggle, .c-tree__leaf").filter((el) => !el.closest(".c-tree__children[hidden]"));

/** Tree: one toggle per branch, and `contour:toggle` so a page can persist it. */
/** Wire tree toggle and keyboard navigation for a host. */
function wireTree(host) {
  // The ARIA shape and the tab stop are re-applied on every pass, before the
  // claim. Two reasons, both measured on the shipped guide: the generated items
  // carried `role="tree"` on the list and NO `role="treeitem"` anywhere, so the
  // structure announced nothing to a screen reader; and every toggle and leaf was
  // stamped `tabindex="-1"` with nothing ever set to 0, so the tree had no tab
  // stop and a keyboard reader could not reach it at all. Roles cannot be guarded
  // by a one-shot claim, because a re-render rebuilds the nodes that carry them.
  const nodes = () => wcAll(host, ".c-tree__node");
  const rootList = wcSelfOrAll(host, "ul.c-tree")[0];
  if (rootList && !rootList.hasAttribute("role")) rootList.setAttribute("role", "tree");
  wcAll(host, ".c-tree__children").forEach((ul) => {
    if (!ul.hasAttribute("role")) ul.setAttribute("role", "group");
  });
  const levelOf = (node) => {
    let level = 1;
    for (let p = node.parentElement; p; p = p.parentElement) if (p.classList && p.classList.contains("c-tree__children")) level++;
    return level;
  };
  nodes().forEach((node) => {
    if (node.getAttribute("role") !== "treeitem") node.setAttribute("role", "treeitem");
    node.setAttribute("aria-level", String(levelOf(node)));
    const row = node.querySelector(":scope > .c-tree__row");
    if (row) node.setAttribute("aria-expanded", row.querySelector(":scope > .c-tree__toggle")?.getAttribute("aria-expanded") || "false");
    else if (node.hasAttribute("aria-expanded")) node.removeAttribute("aria-expanded");
  });
  // Exactly one tab stop. The author's own `tabindex="0"` is the choice, then the
  // element that already holds focus, then the first item — in that order, so the
  // invariant (one stop, never none, never N) holds without overriding intent.
  // Only the VISIBLE items count: a collapsed branch is `hidden`, and a stop on a
  // node the browser will not focus is a stop the reader never reaches. Measured
  // when this was missed — ArrowDown left focus on item 0 and moved the stop onto
  // a hidden child, so the tree reported one tab stop that nothing could hold.
  const stops = visibleStops(host);
  const authored = stops.find((el) => el.getAttribute("tabindex") === "0");
  const active = authored || stops.find((el) => el === document.activeElement) || stops[0];
  stops.forEach((el) => el.setAttribute("tabindex", el === active ? "0" : "-1"));
  // Hidden items are taken out of the sequence entirely, not left at whatever
  // value a previous pass gave them.
  wcAll(host, ".c-tree__toggle, .c-tree__leaf").forEach((el) => {
    if (!stops.includes(el)) el.setAttribute("tabindex", "-1");
  });

  if (!wcClaim(host, "tree")) return;
  // Checkbox selection (F-08): track checked nodes and emit contour:select.
  host._selectedTree = host._selectedTree || new Set();
  let lastTreeIndex = -1;
  wcListen(host, "change", (e) => {
    const cb = e.target && e.target.closest ? e.target.closest(".c-tree__select") : null;
    if (!cb || !host.contains(cb)) return;
    const cbs = Array.from(host.querySelectorAll(".c-tree__select"));
    const idx = cbs.indexOf(cb);
    const label = (cb.parentElement && cb.parentElement.textContent || "").trim().slice(0, 120);
    if (e.shiftKey && lastTreeIndex >= 0) {
      const from = Math.min(lastTreeIndex, idx);
      const to = Math.max(lastTreeIndex, idx);
      for (let i = from; i <= to; i++) {
        cbs[i].checked = cb.checked;
        const lbl = (cbs[i].parentElement && cbs[i].parentElement.textContent || "").trim().slice(0, 120);
        if (cb.checked) host._selectedTree.add(lbl); else host._selectedTree.delete(lbl);
      }
    } else if (!e.ctrlKey && !e.metaKey) {
      // single select: clear others unless ctrl
      if (cb.checked) {
        cbs.forEach((c, i) => {
          if (i !== idx && c.checked) {
            c.checked = false;
            const lbl = (c.parentElement && c.parentElement.textContent || "").trim().slice(0, 120);
            host._selectedTree.delete(lbl);
          }
        });
      }
      if (cb.checked) host._selectedTree.add(label); else host._selectedTree.delete(label);
    } else {
      if (cb.checked) host._selectedTree.add(label); else host._selectedTree.delete(label);
    }
    lastTreeIndex = idx;
    wcEmit(host, "contour:select", { labels: Array.from(host._selectedTree) });
  });
  // Drag-and-drop (F-08): nodes are draggable; drop emits contour:move.
  wcAll(host, ".c-tree__node, .c-tree__leaf").forEach((n) => { if (!n.hasAttribute("draggable")) n.setAttribute("draggable", "true"); });
  let dragLabel = null;
  wcListen(host, "dragstart", (e) => {
    const node = wcClosest(host, e.target, ".c-tree__node, .c-tree__leaf");
    if (!node) return;
    dragLabel = (node.textContent || "").trim().slice(0, 120);
    if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", dragLabel); } catch (err) {} }
  });
  wcListen(host, "dragover", (e) => {
    const node = wcClosest(host, e.target, ".c-tree__node, .c-tree__leaf");
    if (!node) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  });
  wcListen(host, "drop", (e) => {
    const node = wcClosest(host, e.target, ".c-tree__node, .c-tree__leaf");
    if (!node || !dragLabel) return;
    e.preventDefault();
    const toLabel = (node.textContent || "").trim().slice(0, 120);
    if (toLabel && toLabel !== dragLabel) {
      wcEmit(host, "contour:move", { from: dragLabel, to: toLabel });
    }
    dragLabel = null;
  });
  // Expanded-state persistence (BY-49), one path per component like tabs:
  // restore runs once at connect, the write fires from the same handler that
  // emits contour:toggle. Identity is the emitted label — the row's text
  // trimmed and sliced to 120 chars — because the generated DOM stamps no node
  // ids (route table tmp/persist-route-table.md). Storage requires a host id;
  // url mode is the single `c-tree` search param, never a hash write.
  const persist = host.getAttribute("persist");
  if (persist === "storage" && host.id) {
    try {
      const saved = localStorage.getItem("contour-tree:" + host.id);
      if (saved !== null) {
        const labels = JSON.parse(saved);
        if (Array.isArray(labels)) {
          const want = new Set(labels.map((l) => String(l)));
          wcAll(host, ".c-tree__row").forEach((row) => {
            const currentToggle = row.querySelector(":scope > .c-tree__toggle");
            if (currentToggle?.getAttribute("aria-expanded") === "true") return;
            const label = (row.textContent || "").trim().slice(0, 120);
            if (!want.has(label)) return;
            const toggle = row.querySelector(":scope > .c-tree__toggle");
            if (!toggle) return;
            const node = row.closest(".c-tree__node");
            const children = node ? node.querySelector(":scope > .c-tree__children") : null;
            toggle.setAttribute("aria-expanded", "true");
            if (node) node.setAttribute("aria-expanded", "true");
            if (children) children.removeAttribute("hidden");
          });
        }
      }
    } catch (e) { /* private mode / malformed: keep the authored state */ }
  } else if (persist === "url") {
    try {
      const v = new URLSearchParams(window.location.search).get("c-tree");
      if (v !== null) {
        const labels = JSON.parse(v);
        if (Array.isArray(labels)) {
          const want = new Set(labels.map((l) => String(l)));
          wcAll(host, ".c-tree__row").forEach((row) => {
            const currentToggle = row.querySelector(":scope > .c-tree__toggle");
            if (currentToggle?.getAttribute("aria-expanded") === "true") return;
            const label = (row.textContent || "").trim().slice(0, 120);
            if (!want.has(label)) return;
            const toggle = row.querySelector(":scope > .c-tree__toggle");
            if (!toggle) return;
            const node = row.closest(".c-tree__node");
            const children = node ? node.querySelector(":scope > .c-tree__children") : null;
            toggle.setAttribute("aria-expanded", "true");
            if (node) node.setAttribute("aria-expanded", "true");
            if (children) children.removeAttribute("hidden");
          });
        }
      }
    } catch (e) { /* malformed param: keep the authored state */ }
  }
  const toggleNode = (toggle) => {
    const wasOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!wasOpen));
    const row = toggle.closest(".c-tree__row") || toggle.parentElement;
    const node = toggle.closest(".c-tree__node");
    const children = node ? node.querySelector(":scope > .c-tree__children") : null;
    if (children) {
      if (wasOpen) {
        if (supportsUntilFound()) children.setAttribute("hidden", "until-found");
        else children.hidden = true;
      } else {
        children.removeAttribute("hidden");
      }
    }
    if (node) node.setAttribute("aria-expanded", String(!wasOpen));
    wcEmit(host, "contour:toggle", { open: !wasOpen, label: (row ? row.textContent : "").trim().slice(0, 120) });
    // Persist expanded state (BY-49): collect all currently-open rows.
    if (persist === "storage" && host.id) {
      try {
        const open = [];
        wcAll(host, ".c-tree__row").forEach((r) => {
          const toggle = r.querySelector(":scope > .c-tree__toggle");
          if (toggle?.getAttribute("aria-expanded") === "true") open.push((r.textContent || "").trim().slice(0, 120));
        });
        localStorage.setItem("contour-tree:" + host.id, JSON.stringify(open));
      } catch (e) {}
    } else if (persist === "url") {
      try {
        const open = [];
        wcAll(host, ".c-tree__row").forEach((r) => {
          const toggle = r.querySelector(":scope > .c-tree__toggle");
          if (toggle?.getAttribute("aria-expanded") === "true") open.push((r.textContent || "").trim().slice(0, 120));
        });
        const url = new URL(window.location.href);
        url.searchParams.set("c-tree", JSON.stringify(open));
        window.history.replaceState(null, "", url.toString());
      } catch (e) {}
    }
  };
  const branchOf = (el) => (el.classList && el.classList.contains("c-tree__toggle") ? el : null);
  const stopsOf = () => visibleStops(host);
  // The kept element takes the single stop; every other item — visible or hidden —
  // is dropped to -1, so opening a branch cannot leave two stops behind.
  const rove = (keep) => {
    wcAll(host, ".c-tree__toggle, .c-tree__leaf").forEach((el) => el.setAttribute("tabindex", el === keep ? "0" : "-1"));
  };
  wcListen(host, "click", (e) => {
    let toggle = wcClosest(host, e.target, ".c-tree__toggle");
    if (!toggle) {
      const row = wcClosest(host, e.target, ".c-tree__row");
      if (row) toggle = row.querySelector(":scope > .c-tree__toggle");
    }
    if (!toggle) return;
    e.preventDefault();
    e.stopPropagation();
    toggleNode(toggle);
  });
  wcListen(host, "focusin", (e) => {
    // Roving the tab stop with focus, so the tree is one Tab and not N.
    if (!wcClosest(host, e.target, ".c-tree__toggle, .c-tree__leaf")) return;
    rove(e.target);
  });
  wcListen(host, "keydown", (e) => {
    const toggle = wcClosest(host, e.target, ".c-tree__toggle, .c-tree__leaf");
    if (!toggle) return;
    const items = stopsOf();
    const idx = items.indexOf(toggle);
    if (e.key === "Enter" || e.key === " ") {
      if (branchOf(toggle)) { e.preventDefault(); toggleNode(toggle); }
      return;
    }
    // Right opens a branch, Left closes it — the pair a tree reader expects, and
    // the only way to reach a collapsed branch's children without a mouse.
    if (e.key === "ArrowRight") {
      const branch = branchOf(toggle);
      const closed = branch && branch.getAttribute("aria-expanded") === "false";
      e.preventDefault();
      if (closed) { toggleNode(branch); rove(toggle); }
      else { const next = items[idx + 1]; if (next) { next.focus(); rove(next); } }
      return;
    }
    if (e.key === "ArrowLeft") {
      const branch = branchOf(toggle);
      if (branch && branch.getAttribute("aria-expanded") === "true") {
        e.preventDefault();
        toggleNode(branch);
        rove(toggle);
      } else {
        const parent = toggle.closest(".c-tree__children");
        const owner = parent ? parent.closest(".c-tree__node") : null;
        const up = owner ? owner.querySelector(":scope > .c-tree__row > .c-tree__toggle") : null;
        if (up) { e.preventDefault(); up.focus(); rove(up); }
      }
      return;
    }
    let next = -1;
    if (e.key === "ArrowDown") next = Math.min(idx + 1, items.length - 1);
    else if (e.key === "ArrowUp") next = Math.max(idx - 1, 0);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next >= 0 && next !== idx) {
      e.preventDefault();
      items[next].focus();
      rove(items[next]);
    }
  });
}

/** Menu: roving focus over items, `contour:select` from key or pointer. */
/** Wire menu keyboard navigation and selection for a host. */
function wireMenu(host) {
  wcAll(host, "[role='menuitem']").forEach((it) => { if (!it.hasAttribute("tabindex")) it.setAttribute("tabindex", it.getAttribute("aria-disabled") === "true" ? "-1" : "-1"); });
  const all = () => wcAll(host, "[role='menuitem']");
  if (!all().some((it) => it.getAttribute("tabindex") === "0") && all().length) {
    const first = all().find((it) => it.getAttribute("aria-disabled") !== "true");
    if (first) first.setAttribute("tabindex", "0");
  }
  if (!wcClaim(host, "menu")) return;

  const submenusOf = (item) => item.querySelector(":scope > ul.c-menu, :scope > .c-menu");
  const closeAllSubmenus = () => {
    wcAll(host, "[aria-haspopup='menu']").forEach((it) => it.setAttribute("aria-expanded", "false"));
  };

  wcListen(host, "keydown", (e) => {
    const its = all().filter((it) => it.getAttribute("aria-disabled") !== "true");
    if (!its.length) return;
    const index = its.indexOf(e.target);
    const target = index >= 0 ? its[index] : null;
    const sub = target ? submenusOf(target) : null;

    // Submenu open (F-02): ArrowRight / Enter on a haspopup item opens it.
    if (target && target.getAttribute("aria-haspopup") === "menu" && (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ")) {
      if (sub) {
        e.preventDefault();
        closeAllSubmenus();
        target.setAttribute("aria-expanded", "true");
        const firstSub = sub.querySelector("[role='menuitem']");
        if (firstSub) { firstSub.setAttribute("tabindex", "0"); try { firstSub.focus(); } catch (err) {} }
        return;
      }
    }
    // Submenu close: ArrowLeft / Escape.
    if (e.key === "ArrowLeft" || e.key === "Escape") {
      const parent = target ? target.closest("ul.c-menu") : null;
      // find the haspopup ancestor item
      let ancestor = null;
      if (target) {
        const ul = target.parentElement && target.parentElement.tagName === "UL" ? target.parentElement : null;
        // walk up to find a li with aria-haspopup whose submenu contains target
        let node = target.parentElement;
        while (node && node !== host) {
          if (node.getAttribute && node.getAttribute("aria-haspopup") === "menu" && node.contains(target) && node !== target) { ancestor = node; break; }
          node = node.parentElement;
        }
      }
      if (ancestor) {
        e.preventDefault();
        ancestor.setAttribute("aria-expanded", "false");
        try { ancestor.focus(); } catch (err) {}
        return;
      }
      if (e.key === "Escape") {
        closeAllSubmenus();
      }
    }

    let next = -1;
    if (e.key === "ArrowDown") next = index < 0 ? 0 : Math.min(index + 1, its.length - 1);
    else if (e.key === "ArrowUp") next = index < 0 ? its.length - 1 : Math.max(index - 1, 0);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = its.length - 1;
    if (next >= 0) { e.preventDefault(); its[next].focus(); return; }
    if ((e.key === "Enter" || e.key === " ") && index >= 0 && !(target && target.getAttribute("aria-haspopup") === "menu")) {
      e.preventDefault();
      wcEmit(host, "contour:select", { index, label: its[index].textContent.trim() });
      closeAllSubmenus();
    }
    // Typeahead (F-21): printable char jumps to the first item whose label
    // starts with the typed character.
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const ch = e.key.toLowerCase();
      const match = its.findIndex((it) => (it.textContent || "").trim().toLowerCase().startsWith(ch));
      if (match >= 0) { e.preventDefault(); its[match].focus(); }
    }
  });
  wcListen(host, "click", (e) => {
    const item = wcClosest(host, e.target, "[role='menuitem']");
    if (!item) return;
    if (item.getAttribute("aria-disabled") === "true") return;
    // Toggle submenu on click for haspopup items.
    if (item.getAttribute("aria-haspopup") === "menu") {
      const sub = submenusOf(item);
      if (sub) {
        const open = item.getAttribute("aria-expanded") === "true";
        closeAllSubmenus();
        item.setAttribute("aria-expanded", open ? "false" : "true");
        return;
      }
    }
    const index = all().indexOf(item);
    if (index >= 0) {
      wcEmit(host, "contour:select", { index, label: item.textContent.trim() });
      closeAllSubmenus();
      // close-on-select: if the menu is a popover, hide it.
      if (typeof host.hidePopover === "function") { try { host.hidePopover(); } catch (e) {} }
    }
  });
}

/** Pagination: `[aria-current="page"]` is the state the sheet paints. */
/** Wire pagination controls for a host. */
function wirePagination(host) {
  wcAll(host, ".c-pagination__link").forEach((b) => { if (!b.hasAttribute("tabindex")) b.setAttribute("tabindex", "0"); });
  if (!wcClaim(host, "pagination")) return;
  const activate = (btn) => {
    const page = parseInt(btn.textContent, 10);
    if (!Number.isFinite(page)) return;
     wcAll(host, ".c-pagination__link").forEach((b) => {
       if (parseInt(b.textContent, 10) === page) b.setAttribute("aria-current", "page");
       else b.removeAttribute("aria-current");
     });
     host.setAttribute("page", String(page));
     wcEmit(host, "contour:page", { page });
    if (host.getAttribute("persist") === "storage" && host.id) {
      try { localStorage.setItem("contour-pagination:" + host.id, String(page)); } catch (e) {}
    } else if (host.getAttribute("persist") === "url") {
      try { const url = new URL(window.location.href); url.searchParams.set("c-pagination", String(page)); window.history.replaceState(null, "", url.toString()); } catch (e) {}
    }
  };
   wcListen(host, "click", (e) => {
     const btn = wcClosest(host, e.target, ".c-pagination__link");
     if (!btn) return;
     e.preventDefault();
     const action = btn.getAttribute("data-action");
     if (action === "prev" || action === "next") {
       const links = wcAll(host, ".c-pagination__link").filter((b) => !b.getAttribute("data-action"));
       const cur = links.find((b) => b.getAttribute("aria-current") === "page");
       const curPage = cur ? (parseInt(cur.textContent, 10) || 1) : 1;
       const page = action === "prev" ? Math.max(1, curPage - 1) : Math.min(links.length, curPage + 1);
       const target = links.find((b) => parseInt(b.textContent, 10) === page);
       if (target) { activate(target); return; }
     }
      activate(btn);
    });
  wcListen(host, "keydown", (e) => {
    const btn = wcClosest(host, e.target, ".c-pagination__link");
    if (!btn) return;
    const links = wcAll(host, ".c-pagination__link");
    const idx = links.indexOf(btn);
    let next = -1;
    const rtl = isRtl(host);
    if (e.key === "ArrowRight") next = rtl ? Math.max(idx - 1, 0) : Math.min(idx + 1, links.length - 1);
    else if (e.key === "ArrowLeft") next = rtl ? Math.min(idx + 1, links.length - 1) : Math.max(idx - 1, 0);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = links.length - 1;
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(btn); return; }
     if (next >= 0 && next !== idx) { e.preventDefault(); links[next].focus(); }
   });
 }
 
 /**
 * Copy. `.c-code__copy` copies its block, `.c-install__copy` its command — one
 * handler because both need the same three things: the text, the clipboard, and
 * a `contour:copy` a page can toast from when the clipboard is denied.
 */
/** Wire copy-to-clipboard behaviour for a host. */
function wireCopy(host) {
  if (!wcClaim(host, "copy")) return;
  wcListen(host, "click", (e) => {
    const btn = wcClosest(host, e.target, ".c-code__copy, .c-install__copy");
    if (!btn) return;
    const owner = wcClosest(host, btn, ".c-code") || wcClosest(host, btn, ".c-install") || host;
    const src = owner.querySelector("code, .c-install__command");
    const text = (src ? src.textContent : owner.textContent) || "";
    // The confirmation is the one the system script paints for the guide's own
    // copy buttons: a label swap, `data-copied` (which the shipped CSS styles)
    // and an icon check on the trigger, reverted after the same beat. The
    // trigger keeps focus, so the label change is what a screen reader hears.
    const confirm = (ok) => {
      const icon = btn.querySelector("use");
      const originalHref = icon && icon.getAttribute("href");
      const originalLabel = btn.getAttribute("aria-label") || btn.title || "";
      if (ok && icon) icon.setAttribute("href", "#i-check");
      btn.setAttribute("aria-label", ok ? "Copied" : "Copy failed");
      btn.dataset.copied = String(ok);
      const timer = setTimeout(() => {
        if (!btn.isConnected) return;
        if (icon && originalHref) icon.setAttribute("href", originalHref);
        btn.setAttribute("aria-label", originalLabel);
        delete btn.dataset.copied;
      }, 1600);
      onDispose(host, () => clearTimeout(timer));
    };
    const doCopy = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch (e) { /* fall through */ }
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-9999px";
        ta.style.opacity = "0";
        document.body.append(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        return ok;
      } catch (e) {
        return false;
      }
    };
    doCopy().then((ok) => confirm(ok));
    wcEmit(host, "contour:copy", { text });
  });
}

/**
 * Removable things: a tag, a filter pill, and the empty state's retry. The
 * affordance is the control's job to remove and to say so; keeping the node in
 * sync with the event is what makes the two copies of this rule agree.
 */
/** Wire removable-item (chip/tag) dismissal for a host. */
function wireRemovable(host) {
  if (!wcClaim(host, "removable")) return;
  wcListen(host, "click", (e) => {
    const drop = (node) => { if (node && node.parentNode) node.parentNode.removeChild(node); };
    const tagBtn = wcClosest(host, e.target, ".c-tag__remove");
    if (tagBtn) {
      e.preventDefault();
      const tag = wcClosest(host, tagBtn, ".c-tag");
      wcEmit(host, "contour:remove", { label: (tag && tag.getAttribute("label")) || (tag ? tag.textContent.trim() : "") });
      drop(tag);
      return;
    }
    const pillBtn = wcClosest(host, e.target, ".c-filter-pill__remove");
    if (pillBtn) {
      e.preventDefault();
      const pill = wcClosest(host, pillBtn, ".c-filter-pill");
      wcEmit(host, "contour:remove", { key: pill && pill.getAttribute("key"), value: pill && pill.getAttribute("value") });
      drop(pill);
      return;
    }
    if (wcClosest(host, e.target, "[data-empty-action]")) {
      wcEmit(host, "contour:empty-action", { state: host.getAttribute("state") || "empty" });
    }
    const alertClose = wcClosest(host, e.target, ".c-alert__close");
    if (alertClose) {
      e.preventDefault();
      wcEmit(host, "contour:close", {});
      if (host.shadowRoot ? host.shadowRoot.contains(alertClose) : true) {
        try { host.remove(); } catch (err) {}
      }
      return;
    }
    const calloutClose = wcClosest(host, e.target, ".c-callout__close");
    if (calloutClose) {
      e.preventDefault();
      wcEmit(host, "contour:close", {});
      try { host.remove(); } catch (err) {}
      return;
    }
  });
}

// Modal containment for the light dialog family (BY-46). A native <dialog> in
// showModal() modalises the page for free — top layer, backdrop, background
// inert — but the light contour-dialog/drawer/sheet have no platform modal, so
// opening one must lock the document scroll and inert the background or the
// page behind it stays reachable. Stacked: two open surfaces must not unlock
// the page on the first close. The guide's own modalise() is the pattern; this
// is the system's copy, since a rule that only works inside the guide does not
// ship.
const modalDepth = { n: 0 };
let modalSavedOverflow = null;
let modalSavedX = 0;
let modalSavedY = 0;
const modalInerted = new Set();
const modalStack = [];
let modalTrapWired = false;

function modalFocusables(host) {
  return Array.from(host.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"))
    .filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");
}

function modalTrapHandler(e) {
  if (e.key !== "Tab") return;
  const host = modalStack[modalStack.length - 1];
  if (!host) return;
  const f = modalFocusables(host);
  if (!f.length) { e.preventDefault(); return; }
  const first = f[0];
  const last = f[f.length - 1];
  const active = document.activeElement;
  if (e.shiftKey) {
    if (active === first || !host.contains(active)) { e.preventDefault(); last.focus(); }
  } else {
    if (active === last) { e.preventDefault(); first.focus(); }
  }
}

/** Contain focus within a modal host while open. */
function modalContain(host, open) {
  if (open) {
    if (modalDepth.n === 0) {
      // The lock itself clamps the scroll (overflow:hidden on the scroller),
      // so the position must be captured BEFORE it is applied or the restore
      // puts a clamped 0 back (measured: open-after-scrollTo read scrollY 0).
      modalSavedX = window.scrollX;
      modalSavedY = window.scrollY;
      modalSavedOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
    }
    modalDepth.n += 1;
    modalStack.push(host);
    if (modalDepth.n === 1 && !modalTrapWired) {
      modalTrapWired = true;
      document.addEventListener("keydown", modalTrapHandler);
    }
    // An ancestor cannot be inert (it would inert the whole subtree); the
    // background is therefore each ancestor's SIBLINGS, walked out to the body.
    for (let el = host; el && el !== document.body; el = el.parentElement) {
      for (const sib of el.parentElement.children) {
        if (sib === el || sib.inert || modalInerted.has(sib)) continue;
        sib.inert = true;
        modalInerted.add(sib);
      }
    }
  } else {
    const idx = modalStack.lastIndexOf(host);
    if (idx >= 0) modalStack.splice(idx, 1);
    modalDepth.n = Math.max(0, modalDepth.n - 1);
    if (modalDepth.n === 0) {
      for (const el of modalInerted) el.inert = false;
      modalInerted.clear();
      document.documentElement.style.overflow = modalSavedOverflow || "";
      window.scrollTo(modalSavedX, modalSavedY);
      if (modalTrapWired) {
        document.removeEventListener("keydown", modalTrapHandler);
        modalTrapWired = false;
      }
    }
  }
}

/* ============================================================================
   CONTOUR — data state and remote loading
   ----------------------------------------------------------------------------
   One implementation of the four data states (`empty`, `loading`, `error`,
   `skeleton`) and of the remote source (`src`, plus `lazy`, `refresh`,
   `timeout`).

   Before this file the same forty-line block was written into eight fragments by
   hand — 6 copies in `content.mjs`, 8 in `data.mjs`, 20 in `map.mjs`, 14 in
   `navigation.mjs` — and every copy carried the same defects, measured in
   Chromium against `dist/contour-wc.js` built at 7d75b3d (probe
   `tmp/wc9/probe.mjs`, 2026-10-27):

     1. a host with `src` painted `"Loading…Loading…"` — two nodes — because the
        copy re-rendered by calling `attributeChangedCallback` from inside
        `render()`, which on the connect path is a synchronous nested render;
     2. a 404 and a malformed body both landed on the EMPTY state
        (`{"empty":1,"error":0,"text":"No data"}`), so the component claimed it had
        no data when in fact it had failed to fetch it;
     3. nothing aborted the request: a host removed mid-flight kept
        `loadingAfterDetach: 2` stale nodes and was still written to;
     4. the state was styled by an inline `style.color`, which beat the CSS rule
        written beside it in the same commit, so the rule was dead — and 33
        generated `c-*__skeleton` names had no rule anywhere.

   Three rules fall out of that, and they are the whole design here.

   Presentation belongs to the sheet. Nothing in this file writes a `style`
   attribute; a state node carries the block-scoped element class the system
   already defines (`c-readout__loading` — 102 of those exist in `src/css/`), so a
   generated class is never one the system cannot style.

   A state is not a live region. `role="alert"` on a node that is inserted already
   carrying text is exactly what `tools/audit/contrast-and-aria.mjs` refuses: it
   scans every `[role="status"],[role="alert"],[aria-live]` whose text is non-empty
   at load, because such a region has no change left to announce. So the widget
   says `aria-busy` while it works and nothing at all when it has failed. A
   consumer that wants the failure spoken routes `contour:error` to the page's own
   `#toast-host`, which is present and empty for that purpose.

   The loader is shared per URL, not per host: a dashboard that mounts forty
   chrome widgets against one endpoint should ask it once. That is also why the
   abort belongs to the last host out, not the first — see `leaveRequest`.
   ========================================================================= */

// Copy. A component overrides any of these through its own attribute, because a
// legend and a table should not both say "No data" — but a default must exist,
// because a state with no text is a state the reader cannot see.
/** Fallback state copy used when remote data is unavailable. */
const STATE_FALLBACK = {
  empty: "No data",
  loading: "Loading…",
  error: "Could not load.",
};

// One in-flight request per URL, shared by every host that asked for it.
const remoteInflight = new Map();
// The last result per URL, so a re-mounted host paints instead of re-asking. A
// refused URL is never cached: one blip must not black out a widget until reload.
// Bounded, because a page that routes through a hundred tile URLs is not going to
// re-ask the first ten, and an unbounded Map is a leak with a cache's vocabulary.
const REMOTE_CACHE_MAX = 64;
const remoteCache = new Map();

function cacheResult(src, data) {
  if (remoteCache.size >= REMOTE_CACHE_MAX) remoteCache.delete(remoteCache.keys().next().value);
  remoteCache.set(src, data);
}

function setStatus(host, status) {
  host._remoteStatus = status;
  if (status !== "error") host._remoteError = null;
  // `aria-busy` is the platform's own word for "this region is mid-update", it is
  // not in OBSERVED, so writing it cannot re-enter this render, and it is cleared
  // the moment a request is not open.
  if (status === "loading") host.setAttribute("aria-busy", "true");
  else host.removeAttribute("aria-busy");
  // The same status drives the `:state(data-loading)` custom state (BY-32): a
  // consumer's CSS can select a mid-request host without an attribute round
  // trip. Loader hosts are not formAssociated, so the base mirrors internals
  // lazily (probed legal in the gate's Chromium); a host without internals or
  // without CustomStateSet simply keeps the attribute path.
  if (typeof host._setCustomState === "function") host._setCustomState("data-loading", status === "loading");
}

function emitState(host, name, detail) {
  host.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
}

function countOf(data) {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === "object") return Object.keys(data).length;
  return data === null || data === undefined ? 0 : 1;
}

/**
 * Leave a shared request. The host stops listening, and if it was the last host
 * that cared, the request itself is cancelled.
 *
 * This is why the abort is not simply `onDispose(host, () => controller.abort())`:
 * with a shared URL, the first widget to be removed from the page would cancel the
 * request its nine siblings are still waiting on, and the defect would look like a
 * network failure that only happens on a dashboard.
 */
function leaveRequest(host) {
  const entry = host._remoteEntry;
  host._remoteEntry = null;
  if (!entry) return;
  entry.hosts.delete(host);
  if (entry.hosts.size === 0 && entry.controller) entry.controller.abort();
}

/**
 * Ask for `src`, and report whether the host is waiting on it.
 *
 * `fields` are the attributes the payload may feed, in the order the component
 * prefers them. Reads nothing and writes nothing the component paints — the
 * values come back through `remoteData`.
 */
/** Load remote data for the given fields on a host. */
function loadRemote(host, fields) {
  const src = host.getAttribute("src");
  if (!src) {
    leaveRequest(host);
    setStatus(host, host._remoteData !== undefined ? "ready" : "idle");
    return;
  }
  remoteRefresh(host);
  const wanted = typeof fields === "string" ? [fields] : fields;
  // An authored attribute wins outright: the component must not fetch over the top
  // of markup the author wrote.
  if (wanted.every((f) => host.getAttribute(f) !== null)) {
    leaveRequest(host);
    setStatus(host, "ready");
    return;
  }
  // A host below the fold must not compete with the forty above it for the same
  // connection. It reports `loading` while it waits, because that is what it is —
  // painting "No data" here would claim an empty dataset for data that has not
  // been asked for yet.
  if (!remoteVisible(host)) {
    setStatus(host, "loading");
    return;
  }
  // The shared cache is keyed by `cache-key` when the author names one,
  // otherwise by the URL itself. `no-cache` opts a host OUT of the shared
  // read: it always asks the network fresh, and the fresh bytes it received
  // are its own for this mount (the guard below re-reads `_remoteData`, so a
  // re-render must not fire a second request). The settle still writes the
  // fresh result to the shared cache — "don't reuse" and "don't store" are
  // different policies, and this is the former; `remoteInvalidate` gives the
  // page the latter.
  const noCache = host.hasAttribute("no-cache");
  const cacheKey = host.getAttribute("cache-key") || src;
  if (noCache) {
    if (host._remoteSrc === src && host._remoteData !== undefined) {
      setStatus(host, "ready");
      return;
    }
  } else {
    const cached = remoteCache.get(cacheKey);
    if (cached !== undefined) {
      host._remoteSrc = src;
      host._remoteData = cached;
      setStatus(host, "ready");
      return;
    }
  }
  // Already asked: a host still waiting, or one whose last ask settled in
  // error, must not re-ask on its own. The retry button (wireStates) and the
  // refresh timer are the only re-askers, and both clear `_remoteSrc` first —
  // without this guard, an errored host re-fetched on every settle's re-render,
  // so a permanent 404 looped forever painting `loading`, and a flaky endpoint
  // "recovered" to rows without the user ever clicking retry (both measured by
  // the state-contract arm in wc-contract, which is the first lane to mount src).
  if (host._remoteSrc === src && (host._remoteStatus === "loading" || host._remoteStatus === "error")) return; // already asked

  leaveRequest(host);
  host._remoteSrc = src;
  setStatus(host, "loading");

  let entry = remoteInflight.get(src);
  if (!entry) {
    entry = { hosts: new Set(), controller: new AbortController(), cacheKey };
    remoteInflight.set(src, entry);
    // All three arguments: `host` carries the timeout attribute and owns the
    // disposer, `src` is the URL to ask, `entry` holds the shared controller.
    // Dropping `host` (as the call did between 8cde6ba and 566b85a) shifts
    // `entry` into its slot, so `host.getAttribute` runs against the URL
    // string and every fetch throws before it starts — caught by the
    // state-contract arm in wc-contract, which is the first lane to mount src.
    entry.promise = startFetch(host, src, entry).then(
      (data) => {
        if (remoteInflight.get(src) === entry) remoteInflight.delete(src);
        // The entry is keyed by URL, but a host that named a cache-key must be
        // able to paint from cache on a re-mount: the fresh result is filed
        // under both the URL and its named key, so the key is not a private
        // lane that only ever misses.
        cacheResult(src, data);
        const namedKey = entry.cacheKey;
        if (namedKey && namedKey !== src) cacheResult(namedKey, data);
        for (const h of entry.hosts) {
          h._remoteData = data;
          h._remoteEntry = null;
          setStatus(h, "ready");
          emitState(h, "contour:load", { src, count: countOf(data) });
        }
      },
      (err) => {
        if (remoteInflight.get(src) === entry) remoteInflight.delete(src);
        for (const h of entry.hosts) {
          h._remoteEntry = null;
          setStatus(h, "error");
          h._remoteError = err && err.name === "HttpError" ? `Could not load (${err.status})` : STATE_FALLBACK.error;
          emitState(h, "contour:error", {
            src,
            message: h._remoteError,
            name: err && err.name,
            status: err && err.status,
          });
        }
      }
    ).finally(() => {
      for (const h of entry.hosts) if (h.isConnected) h.requestRender();
      entry.hosts.clear();
    });
  }
  entry.hosts.add(host);
  host._remoteEntry = entry;
  // Leaving the page is not failing the request; the host simply stops caring.
  // Registered once per mount, because `loadRemote` runs from `render()` and a
  // disposers list that grows with the render count is the leak this file exists
  // to stop. The flag is cleared inside the disposer, so a reconnect re-registers.
  if (!host._remoteDisposeRegistered) {
    host._remoteDisposeRegistered = true;
    onDispose(host, () => {
      host._remoteDisposeRegistered = false;
      leaveRequest(host);
    });
  }
}

/**
 * Drop a URL's cached result so the next host that asks for it re-fetches.
 * The refresh timer and the retry button already clear the entry themselves;
 * this is the page-side handle for the same job (an admin action, a
 * websocket that says the tiles changed) without forcing a remount.
 * @param {string} srcOrKey the URL — or the cache-key a host asked under
 */
/** Invalidate cached remote data by source or key. */
function remoteInvalidate(srcOrKey) {
  remoteCache.delete(srcOrKey);
}

// `AbortSignal.timeout` is the platform's own deadline; where it is missing, the
// same thing is a timer and an abort. Either way an unreachable internal tile
// server cannot leave a widget in `loading` for the life of the page.
function startFetch(host, src, entry) {
  const ms = parseInt(host.getAttribute("timeout") || "", 10);
  let timer = null;
  let signal = entry.controller.signal;
  if (Number.isFinite(ms) && ms > 0) {
    if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
      // `AbortSignal.any` needs no guard: it ships with `AbortSignal.timeout`, and
      // a host on an engine without the former has no use for the latter either.
      signal = AbortSignal.any([signal, AbortSignal.timeout(ms)]);
    } else {
      timer = setTimeout(() => entry.controller.abort(), ms);
    }
  }
  // The deadline belongs to the request, so the last host out already aborts it;
  // the timer is cleared on any settle so a cached answer costs nothing later.
  onDispose(host, () => { if (timer) clearTimeout(timer); });

  return fetch(src, { signal })
    .then((res) => {
      if (timer) clearTimeout(timer);
      // The status line is the boundary. `fetch` resolves on 404 and on 500, so
      // without this test a failed request became an empty dataset and the
      // component told the reader there was nothing to show.
      if (!res.ok) {
        const e = new Error(`Could not load (${res.status})`);
        e.name = "HttpError";
        e.status = res.status;
        throw e;
      }
      return res.text();
    })
    .then((text) => {
      try { return JSON.parse(text); }
      catch (err) {
        const e = new Error(STATE_FALLBACK.error);
        e.name = "ParseError";
        e.cause = err;
        throw e;
      }
    });
}

/**
 * The value a component should render for one field: the attribute the author
 * wrote, else the matching key of the remote payload, else nothing.
 *
 * An array payload feeds the field the component asked for, so
 * `<contour-readout src="/rows.json">` works with a bare list; an object payload
 * is matched by key, so one endpoint can serve several fields of one component.
 * The return is always the string the render body already parses, so adopting this
 * changes no component's parsing.
 */
/** Read the cached remote data for a field. */
function remoteData(host, field) {
  const authored = host.getAttribute(field);
  if (authored !== null) return authored;
  const data = host._remoteData;
  if (data === undefined || data === null) return null;
  if (Array.isArray(data)) return JSON.stringify(data);
  if (typeof data === "object") {
    const keys = typeof field === "string" ? [field] : field;
    for (const k of keys) {
      if (data[k] === undefined) continue;
      return typeof data[k] === "string" ? data[k] : JSON.stringify(data[k]);
    }
    return null;
  }
  return String(data);
}

/**
 * `refresh="<seconds>"`: revalidate the source on a timer. The loop pauses while
 * the tab is hidden and stops when the host leaves the page, because a dashboard
 * left open in a background tab is the common way a design system becomes the
 * reason a laptop is warm.
 *
 * Registered once per mount: `remoteRefresh` is called from `render()`, and a
 * timer scheduled here fires and clears `_remoteTimer`, so the guard has to be a
 * flag that survives the tick or every re-render adds another loop.
 */
/** Refresh remote data for a host. */
function remoteRefresh(host) {
  const seconds = parseFloat(host.getAttribute("refresh") || "");
  const want = host.hasAttribute("src") && Number.isFinite(seconds) && seconds > 0;
  if (!want) {
    if (host._remoteTimer !== undefined) { clearTimeout(host._remoteTimer); host._remoteTimer = undefined; }
    host._remoteLoop = false;
    return;
  }
  if (host._remoteLoop) return;
  host._remoteLoop = true;
  const tick = () => {
    host._remoteTimer = undefined;
    if (!host.isConnected || !host.hasAttribute("refresh")) { host._remoteLoop = false; return; }
    if (document.hidden) { host._remoteTimer = setTimeout(tick, 1000); return; }
    const src = host.getAttribute("src");
    const namedKey = host.getAttribute("cache-key");
    if (namedKey) remoteCache.delete(namedKey);
    remoteCache.delete(src);
    host._remoteSrc = null;
    host._remoteLoop = false;
    host.requestRender();
  };
  host._remoteTimer = setTimeout(tick, Math.max(1000, seconds * 1000));
  onDispose(host, () => {
    clearTimeout(host._remoteTimer);
    host._remoteTimer = undefined;
    host._remoteLoop = false;
  });
}

// `loading="lazy"` belongs to the markup, not to the platform: an element below
// the fold must not compete with the forty above it. Where IntersectionObserver
// is missing the host simply asks, which is the honest fallback rather than never
// asking at all.
// One shared IntersectionObserver for every lazy host (B3-22): the previous
// shape opened a fresh observer per host, so a dashboard with N lazy blocks
// paid N observers for a single viewport. The shared observer fans entries out
// to the host that owns each target; a host is unobserved (not the whole
// observer disconnected) once it enters, so siblings keep watching.
let _sharedLazyIO = null;
const _sharedLazyTargets = new Map();
/** Whether remote data is currently visible. */
function remoteVisible(host) {
  if (!host.hasAttribute("lazy")) return true;
  if (typeof IntersectionObserver !== "function") return true;
  if (host._remoteVisible) return true;
  if (host._lazyRegistered) return false;
  if (!_sharedLazyIO) {
    _sharedLazyIO = new IntersectionObserver((records) => {
      for (const r of records) {
        const activate = _sharedLazyTargets.get(r.target);
        if (!activate || !r.isIntersecting) continue;
        _sharedLazyTargets.delete(r.target);
        _sharedLazyIO.unobserve(r.target);
        activate();
      }
    }, { rootMargin: "200px" });
  }
  const activate = () => {
    host._remoteVisible = true;
    host._lazyRegistered = false;
    host.requestRender();
  };
  host._lazyRegistered = true;
  _sharedLazyTargets.set(host, activate);
  _sharedLazyIO.observe(host);
  onDispose(host, () => {
    _sharedLazyIO.unobserve(host);
    _sharedLazyTargets.delete(host);
    host._lazyRegistered = false;
  });
  return false;
}

/**
 * Page-side visibility events (BY-42). The loader's `remoteVisible` is one-shot
 * and loader-internal: it exists to gate a single fetch. A dashboard that does
 * its own ink work (a non-loader animation, a slow layout) needs the same
 * signal exported, with both halves — enter AND leave — because "paused until
 * it enters" is only useful if the pause lifts. Events are the loader's own
 * convention: bubbles + composed, on the host.
 *
 * The returned disposer stops the observer; it is also wired to onDispose so a
 * host removed from the DOM stops observing without the caller tracking it.
 * Where IntersectionObserver is missing the honest fallback is to report the
 * element as entered once and stop: an unobserved element is not "never seen",
 * and a dashboard that waits for leave that can never come is a dashboard that
 * never resumes.
 */
/** Watch viewport intersection for lazy loading. */
function watchViewport(host) {
  if (host._contourViewWired) return () => {};
  host._contourViewWired = true;
  const emit = (type) => host.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true }));
  if (typeof IntersectionObserver !== "function") {
    emit("contour:view-enter");
    return () => {};
  }
  const io = new IntersectionObserver((records) => {
    for (const r of records) {
      if (r.isIntersecting) emit("contour:view-enter");
      else emit("contour:view-leave");
    }
  });
  io.observe(host);
  onDispose(host, () => io.disconnect());
  return () => io.disconnect();
}

// ---------------------------------------------------------------------------
// The states themselves
// ---------------------------------------------------------------------------

// A state node carries the block-scoped element class the sheet already defines
// (`c-readout__loading`, `c-tree__empty`, …) so an author can theme one block's
// state without reaching for the whole system, and never carries a `style`
// attribute — which is the defect that made the matching CSS rule dead.
//
// It also carries `data-contour-state`, the only new hook here. The error state has
// to read as a failure, but the per-block rules group `__error` with `__empty` and
// `__loading` as muted text, so a failure looks exactly like a placeholder that
// simply has not arrived yet. Colouring it by name would mean editing 34 rules in
// the four sheets another writer is landing changes into; one rule on this
// attribute does it, and an attribute is a host-set input rather than a published
// class — no specimen, no inventory entry, nothing to deprecate.
function stateNode(block, kind, text) {
  const node = document.createElement("div");
  node.className = "c-" + block + "__" + kind;
  node.dataset.contourState = kind;
  node.textContent = text;
  return node;
}

function skeletonRow(i, total) {
  // The system's own skeleton block and its own modifiers: `--title` for the first
  // line so a placeholder has a shape instead of a uniform stack of bars, `--text`
  // for the rest. No per-block name is invented here, which is how the 33
  // undefined `c-*__skeleton` classes stop being generated at all.
  const node = document.createElement("div");
  node.className = "c-skeleton " + (i === 0 && total > 1 ? "c-skeleton--title" : "c-skeleton--text");
  node.dataset.contourState = "skeleton";
  return node;
}

/**
 * Paint the host's data state, if it has one. Returns true when a state took over
 * the render, so the caller returns before building content it would discard.
 *
 * The order is deliberate: `loading` (attribute or open request) wins over `error`,
 * because a retry in flight is not a failure, and either wins over `skeleton`,
 * which is a placeholder for a state the host may already be in.
 */
/** Render loading/empty/error states for a block. */
function renderStates(host, block, opts) {
  const options = opts || {};
  const loading = host.getAttribute("loading");
  if (loading !== null || host._remoteStatus === "loading") {
    host.appendChild(stateNode(block, "loading", loading || STATE_FALLBACK.loading));
    return true;
  }
  const error = host.getAttribute("error");
  if (error !== null || host._remoteStatus === "error") {
    const message = (error !== null && error !== "") ? error : (host._remoteError || STATE_FALLBACK.error);
    const node = stateNode(block, "error", message);
    // `retry` is the actionable half of an error. It reuses the button the system
    // already ships and the `contour:retry` event three components already emit,
    // rather than inventing a control for the same job.
    if (host.hasAttribute("retry")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "c-btn c-btn--ghost c-btn--sm";
      btn.textContent = host.getAttribute("retry") || "Retry";
      btn.dataset.action = "retry";
      node.appendChild(btn);
    }
    host.appendChild(node);
    return true;
  }
  if (host.hasAttribute("skeleton")) {
    const asked = parseInt(host.getAttribute("skeleton") || "3", 10);
    const count = Math.min(options.max || 6, Math.max(1, Number.isFinite(asked) ? asked : 3));
    for (let i = 0; i < count; i++) host.appendChild(skeletonRow(i, count));
    return true;
  }
  return false;
}

/** Paint the empty state — for a host with no data and no authored content. */
/** Render the empty state for a block. */
function renderEmpty(host, block) {
  host.appendChild(stateNode(block, "empty", host.getAttribute("empty") || STATE_FALLBACK.empty));
}

// Delegated on the host (AGENTS.md rule 12): the retry button is regenerated on
// every render, so a listener bound to the node would be dropped by the next pass.
/** Wire state (loading/empty/error) interactions for a host. */
function wireStates(host) {
  if (host._contourStatesWired) return;
  host._contourStatesWired = true;
  host.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-action="retry"]') : null;
    if (!btn || !host.contains(btn)) return;
    e.preventDefault();
    const src = host.getAttribute("src");
    const namedKey = host.getAttribute("cache-key");
    if (namedKey) remoteCache.delete(namedKey);
    if (src) remoteCache.delete(src);
    leaveRequest(host);
    host._remoteSrc = null;
    host._remoteData = undefined;
    setStatus(host, "idle");
    emitState(host, "contour:retry", { src });
    host.requestRender();
  });
}




class ContourCard extends ContourBase {
    static get observed() { return ["title", "variant", "heading"]; }
    static get properties() { return { title: { attribute: "title" }, variant: { attribute: "variant" } }; }
    render() {
      this.classList.add("c-card");
      const variant = this.getAttribute("variant");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-card--")) this.classList.remove(c); });
      if (variant) this.classList.add("c-card--" + variant);
      const title = this.getAttribute("title");
      if (title) {
        const h = this.ensure(".c-card__title", () => { const el = document.createElement(headingTag(this, "h3")); el.className = "c-card__title"; return el; });
        if (h.parentNode === this && this.firstChild !== h) this.prepend(h);
        h.textContent = title;
      } else {
        const h = this.querySelector(".c-card__title");
        if (h) h.remove();
      }
    }
  }
  define("contour-card", ContourCard);
class ContourFeature extends ContourBase {
    static get observed() { return ["index", "title", "body", "heading"]; }
    static get properties() { return { index: { attribute: "index" }, title: { attribute: "title" }, body: { attribute: "body" } }; }
    render() {
      this.classList.add("c-feature");
      // `.c-feature` defines three parts: `__index`, `__title`, `__body`. It has
      // no icon slot, so the index line is the label this block actually carries.
      const index = this.getAttribute("index");
      const title = this.getAttribute("title");
      const body = this.getAttribute("body");
      if (index) {
        const x = this.ensure(".c-feature__index", () => { const el = document.createElement("span"); el.className = "c-feature__index"; return el; });
        x.textContent = index;
      } else {
        const x = this.querySelector(".c-feature__index");
        if (x) x.remove();
      }
      if (title) {
        const t = this.ensure(".c-feature__title", () => { const el = document.createElement(headingTag(this, "h3")); el.className = "c-feature__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-feature__title");
        if (t) t.remove();
      }
      if (body) {
        const b = this.ensure(".c-feature__body", () => { const el = document.createElement("p"); el.className = "c-feature__body"; return el; });
        b.textContent = body;
      } else {
        const b = this.querySelector(".c-feature__body");
        if (b) b.remove();
      }
    }
  }
  define("contour-feature", ContourFeature);
class ContourSteps extends ContourBase {
    static get observed() { return ["steps", "current", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "heading"]; }
    static get properties() { return { steps: { attribute: "steps" }, current: { attribute: "current", type: Number }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-steps");
      this.setAttribute("role", "list");
      wireStates(this);
      loadRemote(this, "steps");
      if (renderStates(this, "steps")) return;
      const steps = remoteData(this, "steps");
      const authored = Array.from(this.children).filter((n) => n.classList && n.classList.contains("c-steps__item"));
      if (steps && !authored.length) {
        // Drop previously generated items so a re-render cannot stack a second set.
        Array.from(this.querySelectorAll(".c-steps__item")).forEach((n) => n.remove());
        try {
          const parsed = JSON.parse(steps);
          parsed.forEach((st, i) => {
            const item = document.createElement("div");
            item.className = "c-steps__item";
            item.setAttribute("role", "listitem");
            item.tabIndex = -1;
            const title = typeof st === "string" ? st : st.title;
            const body = typeof st === "string" ? "" : st.body;
            if (title) {
              const h = document.createElement(headingTag(this, "h3"));
              h.className = "c-steps__title";
              h.textContent = title;
              item.appendChild(h);
            }
            if (body) {
              const p = document.createElement("p");
              p.className = "c-steps__body";
              p.textContent = body;
              item.appendChild(p);
            }
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      } else if (!steps && !authored.length) {
        renderEmpty(this, "steps");
      }
      // Reflect the current step onto the items (aria-current) without clobbering
      // a re-render's generated nodes.
      const attrCurrent = this.getAttribute("current");
      const current = (this._current != null) ? this._current : (attrCurrent != null ? parseInt(attrCurrent, 10) : NaN);
      const items = Array.from(this.querySelectorAll(".c-steps__item"));
      items.forEach((it, i) => {
        if (Number.isFinite(current) && i === current) it.setAttribute("aria-current", "step");
        else it.removeAttribute("aria-current");
        it.tabIndex = (Number.isFinite(current) && i === current) ? 0 : -1;
      });
      if (items.length && !Number.isFinite(current)) {
        items[0].tabIndex = 0;
      }
    }
    enhance() {
      if (!this._wiredSteps) {
        this._wiredSteps = true;
        this.addEventListener("keydown", (e) => {
          const items = Array.from(this.querySelectorAll(".c-steps__item"));
          if (!items.length) return;
          const active = document.activeElement;
          const idx = items.indexOf(active);
          let next = -1;
          const rtl = (this.getAttribute("dir") || document.documentElement.getAttribute("dir") || "").toLowerCase() === "rtl";
          if (e.key === "ArrowDown") next = idx < 0 ? 0 : Math.min(items.length - 1, idx + 1);
          else if (e.key === "ArrowUp") next = idx < 0 ? 0 : Math.max(0, idx - 1);
          else if (e.key === "ArrowRight") next = rtl ? (idx < 0 ? 0 : Math.max(0, idx - 1)) : (idx < 0 ? 0 : Math.min(items.length - 1, idx + 1));
          else if (e.key === "ArrowLeft") next = rtl ? (idx < 0 ? 0 : Math.min(items.length - 1, idx + 1)) : (idx < 0 ? 0 : Math.max(0, idx - 1));
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = items.length - 1;
          if (next >= 0 && next !== idx) {
            e.preventDefault();
            items[next].focus();
            this._current = next;
            items.forEach((it, i) => {
              if (i === next) it.setAttribute("aria-current", "step");
              else it.removeAttribute("aria-current");
              it.tabIndex = i === next ? 0 : -1;
            });
            if (idx >= 0) items[idx].tabIndex = -1;
            const title = items[next].querySelector(".c-steps__title")?.textContent || "";
            this.dispatchEvent(new CustomEvent("contour:step-change", { bubbles: true, composed: true, detail: { index: next, title } }));
          }
          if ((e.key === "Enter" || e.key === " ") && idx >= 0) {
            e.preventDefault();
            const title = items[idx].querySelector(".c-steps__title")?.textContent || "";
            this.dispatchEvent(new CustomEvent("contour:step-activate", { bubbles: true, composed: true, detail: { index: idx, title } }));
          }
        });
        this.addEventListener("click", (e) => {
          const item = e.target && e.target.closest ? e.target.closest(".c-steps__item") : null;
          if (!item || !this.contains(item)) return;
          const items = Array.from(this.querySelectorAll(".c-steps__item"));
          const idx = items.indexOf(item);
          if (idx < 0) return;
          this._current = idx;
          items.forEach((it, i) => {
            if (i === idx) it.setAttribute("aria-current", "step");
            else it.removeAttribute("aria-current");
            it.tabIndex = i === idx ? 0 : -1;
          });
          const title = item.querySelector(".c-steps__title")?.textContent || "";
          this.dispatchEvent(new CustomEvent("contour:step-activate", { bubbles: true, composed: true, detail: { index: idx, title } }));
        });
      }
    }
  }
define("contour-steps", ContourSteps);
class ContourLink extends ContourBase {
    static get observed() { return ["href", "label"]; }
    static get properties() { return { href: { attribute: "href" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-link");
      const href = this.getAttribute("href");
      const label = this.getAttribute("label");
      // Clear previously generated link so a re-render cannot stack a second one.
      const prevLink = this.querySelector("a");
      if (prevLink) prevLink.remove();
      if (href && label) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = label;
        const ariaLabel = this.getAttribute("aria-label");
        if (ariaLabel) a.setAttribute("aria-label", ariaLabel);
        this.appendChild(a);
      }
    }
  }
  define("contour-link", ContourLink);
class ContourBrand extends ContourBase {
    static get observed() { return ["name", "tag"]; }
    static get properties() { return { name: { attribute: "name" }, tag: { attribute: "tag" } }; }
    render() {
      this.classList.add("c-brand");
      const name = this.getAttribute("name");
      const tag = this.getAttribute("tag");
      if (name) {
        const n = this.ensure(".c-brand__name", () => { const el = document.createElement("span"); el.className = "c-brand__name"; return el; });
        n.textContent = name;
      } else {
        const n = this.querySelector(".c-brand__name");
        if (n) n.remove();
      }
      if (tag) {
        const t = this.ensure(".c-brand__tag", () => { const el = document.createElement("span"); el.className = "c-brand__tag"; return el; });
        t.textContent = tag;
      } else {
        const t = this.querySelector(".c-brand__tag");
        if (t) t.remove();
      }
    }
  }
  define("contour-brand", ContourBrand);
class ContourSectionHead extends ContourBase {
    static get observed() { return ["title", "desc", "heading"]; }
    static get properties() { return { title: { attribute: "title" }, desc: { attribute: "desc" } }; }
    render() {
      this.classList.add("c-section-head");
      const title = this.getAttribute("title");
      const desc = this.getAttribute("desc");
      // icon badge
      if (!this.querySelector(".c-icon-badge")) {
        const badge = document.createElement("div");
        badge.className = "c-icon-badge";
        badge.innerHTML = '<svg aria-hidden="true"><use href="#i-crosshair" /></svg>';
        this.prepend(badge);
      }
      // content wrapper
      let content = this.querySelector(":scope > div:not(.c-icon-badge)");
      if (!content) {
        content = document.createElement("div");
        this.appendChild(content);
      }
      if (title) {
        const t = this.ensure(".c-section-head__title", () => { const el = document.createElement(headingTag(this, "h2")); el.className = "c-section-head__title"; return el; });
        t.textContent = title;
        if (t.parentNode !== content) content.appendChild(t);
      } else {
        const t = this.querySelector(".c-section-head__title");
        if (t) t.remove();
      }
      if (desc) {
        const d = this.ensure(".c-section-head__desc", () => { const el = document.createElement("p"); el.className = "c-section-head__desc"; return el; });
        d.textContent = desc;
        if (d.parentNode !== content) content.appendChild(d);
      } else {
        const d = this.querySelector(".c-section-head__desc");
        if (d) d.remove();
      }
    }
  }
  define("contour-section-head", ContourSectionHead);
class ContourDiff extends ContourBase {
    static get observed() { return ["before", "after"]; }
    static get properties() { return { before: { attribute: "before" }, after: { attribute: "after" } }; }
    render() {
      this.classList.add("c-diff");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Diff");
      // The block is a list of lines, not two panes: `.c-diff__line` carries the
      // +/- sign, the line number, and the text, and `--add`/`--del` are the only
      // two states it defines. A removed line and an added line are what a
      // before/after pair actually becomes in a diff.
      Array.from(this.querySelectorAll(".c-diff__line")).forEach((n) => n.remove());
      const line = (kind, sign, text) => {
        const el = document.createElement("div");
        el.className = kind ? `c-diff__line c-diff__line--${kind}` : "c-diff__line";
        el.setAttribute("role", "listitem");
        el.setAttribute("tabindex", "0");
        const s = document.createElement("span");
        s.className = "c-diff__sign";
        s.textContent = sign;
        const code = document.createElement("span");
        code.textContent = text;
        el.append(s, code);
        return el;
      };
      const before = this.getAttribute("before");
      const after = this.getAttribute("after");
      if (before) this.appendChild(line("del", "−", before));
      if (after) this.appendChild(line("add", "+", after));
    }
    enhance() {
      if (this._wiredDiff) return;
      this._wiredDiff = true;
      this.addEventListener("click", (e) => {
        const line = e.target && e.target.closest ? e.target.closest(".c-diff__line") : null;
        if (line && this.contains(line)) {
          const kind = line.classList.contains("c-diff__line--add") ? "add" : line.classList.contains("c-diff__line--del") ? "del" : "context";
          const text = line.querySelector("span:last-child")?.textContent || "";
          this.dispatchEvent(new CustomEvent("contour:diff-activate", { bubbles: true, composed: true, detail: { kind, text } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const line = e.target && e.target.closest ? e.target.closest(".c-diff__line") : null;
        if (!line || !this.contains(line)) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          line.click();
        }
      });
    }
  }
  define("contour-diff", ContourDiff);
class ContourDoDont extends ContourBase {
    static get observed() { return ["do", "dont"]; }
    static get properties() { return { do: { attribute: "do" }, dont: { attribute: "dont" } }; }
    render() {
      this.classList.add("c-do-dont");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Do and don't");
      // An item is one element with one state modifier — `__item--do`,
      // `__item--dont` — and the word on top of it is `__label`. There is no
      // `__do` or `__dont` element in the system.
      Array.from(this.querySelectorAll(".c-do-dont__item")).forEach((n) => n.remove());
      const item = (kind, word, text) => {
        const el = document.createElement("div");
        el.className = `c-do-dont__item c-do-dont__item--${kind}`;
        el.setAttribute("role", "listitem");
        const label = document.createElement("p");
        label.className = "c-do-dont__label";
        label.textContent = word;
        const body = document.createElement("p");
        body.className = "u-muted";
        body.textContent = text;
        el.append(label, body);
        return el;
      };
      const doText = this.getAttribute("do");
      const dontText = this.getAttribute("dont");
      if (doText) this.appendChild(item("do", "Do", doText));
      if (dontText) this.appendChild(item("dont", "Don't", dontText));
    }
    enhance() {
      if (this._wiredDoDont) return;
      this._wiredDoDont = true;
      this.addEventListener("click", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".c-do-dont__item") : null;
        if (item && this.contains(item)) {
          const kind = item.classList.contains("c-do-dont__item--do") ? "do" : "dont";
          const text = item.querySelector(".u-muted")?.textContent || "";
          this.dispatchEvent(new CustomEvent("contour:do-dont-activate", { bubbles: true, composed: true, detail: { kind, text } }));
        }
      });
      // Make items focusable and keyboard-activatable.
      Array.from(this.querySelectorAll(".c-do-dont__item")).forEach((it) => {
        if (!it.hasAttribute("tabindex")) it.setAttribute("tabindex", "0");
        if (!it.hasAttribute("role")) it.setAttribute("role", "button");
      });
      this.addEventListener("keydown", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".c-do-dont__item") : null;
        if (!item || !this.contains(item)) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          item.click();
        }
      });
    }
  }
  define("contour-do-dont", ContourDoDont);
class ContourFlag extends ContourBase {
    static get observed() { return ["variant", "label"]; }
    static get properties() { return { variant: { attribute: "variant" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-flag");
      const variant = this.getAttribute("variant");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-flag--")) this.classList.remove(c); });
      if (variant) this.classList.add("c-flag--" + variant);
      const label = this.getAttribute("label");
      if (label) {
        this.textContent = label;
      }
    }
  }
  define("contour-flag", ContourFlag);
class ContourInstallFull extends ContourBase {
    static get observed() { return ["command", "prompt", "copyable"]; }
    static get properties() { return { command: { attribute: "command" }, prompt: { attribute: "prompt" }, copyable: { attribute: "copyable" } }; }
    render() {
      this.classList.add("c-install");
      const prompt = this.getAttribute("prompt") || "$";
      const command = this.getAttribute("command") || "";
      if (command) {
        const p = this.ensure(".c-install__prompt", () => { const el = document.createElement("span"); el.className = "c-install__prompt"; return el; });
        p.textContent = prompt;
        const c = this.ensure(".c-install__command", () => { const el = document.createElement("span"); el.className = "c-install__command"; return el; });
        c.textContent = command;
        if (this.hasAttribute("copyable")) {
          this.ensure(".c-install__copy", () => {
            const btn = document.createElement("button");
            btn.className = "c-btn c-btn--ghost c-btn--sm c-install__copy";
            btn.type = "button";
            btn.setAttribute("aria-label", "Copy command");
            btn.textContent = "Copy";
            return btn;
          });
        } else {
          const btn = this.querySelector(".c-install__copy");
          if (btn) btn.remove();
        }
      }
    }
    enhance() {
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
      wireCopy(this);
    }
  }
  define("contour-install", ContourInstallFull);
class ContourTestimonialFull extends ContourBase {
    static get observed() { return ["quote", "name", "role"]; }
    static get properties() { return { quote: { attribute: "quote" }, name: { attribute: "name" }, role: { attribute: "role" } }; }
    render() {
      this.classList.add("c-testimonial");
      const quote = this.getAttribute("quote");
      if (quote) {
        const q = this.ensure(".c-testimonial__quote", () => { const el = document.createElement("blockquote"); el.className = "c-testimonial__quote"; return el; });
        q.textContent = quote;
      } else {
        const q = this.querySelector(".c-testimonial__quote");
        if (q) q.remove();
      }
      const name = this.getAttribute("name");
      const role = this.getAttribute("role");
      if (name) {
        const by = this.ensure(".c-testimonial__byline", () => { const el = document.createElement("div"); el.className = "c-testimonial__byline"; return el; });
        const n = by.querySelector(".c-testimonial__name") || (() => { const el = document.createElement("span"); el.className = "c-testimonial__name"; by.appendChild(el); return el; })();
        n.className = "c-testimonial__name";
        n.textContent = name;
        if (role) {
          const r = by.querySelector(".c-testimonial__role") || (() => { const el = document.createElement("span"); el.className = "c-testimonial__role"; by.appendChild(el); return el; })();
          r.className = "c-testimonial__role";
          r.textContent = role;
        } else {
          const r = by.querySelector(".c-testimonial__role");
          if (r) r.remove();
        }
      } else {
        const by = this.querySelector(".c-testimonial__byline");
        if (by) by.remove();
      }
    }
  }
  define("contour-testimonial", ContourTestimonialFull);
class ContourShowcaseFull extends ContourBase {
    static get observed() { return ["title", "text", "media", "reverse", "items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "heading"]; }
    static get properties() { return { title: { attribute: "title" }, text: { attribute: "text" }, media: { attribute: "media" }, reverse: { attribute: "reverse" }, items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-showcase");
      if (this.hasAttribute("reverse")) this.classList.add("c-showcase--reverse"); else this.classList.remove("c-showcase--reverse");
      const title = this.getAttribute("title");
      if (title) this.setAttribute("aria-label", title);
      else this.removeAttribute("aria-label");
      this.setAttribute("role", "region");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "showcase")) return;
      const items = remoteData(this, "items");
      const text = this.getAttribute("text");
      const media = this.getAttribute("media");
      if (media) {
        const m = this.ensure(".c-showcase__media", () => { const el = document.createElement("div"); el.className = "c-showcase__media"; el.setAttribute("role", "img"); return el; });
        m.innerHTML = sanitizeHtml(media);
        if (title) m.setAttribute("aria-label", title);
      } else {
        const m = this.querySelector(".c-showcase__media");
        if (m) m.remove();
      }
      if (title) {
        const t = this.ensure(".c-showcase__title", () => { const el = document.createElement(headingTag(this, "h3")); el.className = "c-showcase__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-showcase__title");
        if (t) t.remove();
      }
      if (text) {
        const p = this.ensure(".c-showcase__text", () => { const el = document.createElement("p"); el.className = "c-showcase__text"; return el; });
        p.textContent = text;
      } else {
        const p = this.querySelector(".c-showcase__text");
        if (p) p.remove();
      }
      const ul = this.querySelector(".c-showcase__list");
      const authored = ul ? Array.from(ul.children).filter((n) => n.tagName === "LI") : [];
      if (items && !authored.length) {
        try {
          const parsed = JSON.parse(items);
          const l = this.ensure(".c-showcase__list", () => { const el = document.createElement("ul"); el.className = "c-showcase__list"; return el; });
          l.innerHTML = "";
          parsed.forEach((it) => {
            const li = document.createElement("li");
            li.textContent = typeof it === "string" ? it : it.label;
            l.appendChild(li);
          });
        } catch (e) { /* keep existing */ }
      } else if (!items && !authored.length && !title && !text && !media) {
        renderEmpty(this, "showcase");
      } else if (!items && ul) {
        ul.remove();
      }
    }
    enhance() {
      if (this._wiredShowcase) return;
      this._wiredShowcase = true;
      this.addEventListener("click", (e) => {
        const media = e.target && e.target.closest ? e.target.closest(".c-showcase__media") : null;
        if (media && this.contains(media)) {
          const title = this.getAttribute("title") || "";
          this.dispatchEvent(new CustomEvent("contour:showcase-activate", { bubbles: true, composed: true, detail: { title } }));
        }
      });
    }
  }
define("contour-showcase", ContourShowcaseFull);
class ContourPricingFull extends ContourBase {
    static get observed() { return []; }
    render() {
      // `.c-pricing` is the grid; every part the guide shows lives on `.c-price`.
      // A pricing element that scaffolded its own label invented a name no rule
      // defines, so the grid holds its children and stays a container.
      this.classList.add("c-pricing");
    }
  }
  define("contour-pricing", ContourPricingFull);
class ContourRecipeFull extends ContourBase {
    static get observed() { return ["title", "body", "canvas", "heading"]; }
    static get properties() { return { title: { attribute: "title" }, body: { attribute: "body" }, canvas: { attribute: "canvas" } }; }
    render() {
      this.classList.add("c-recipe");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-recipe__title", () => { const el = document.createElement(headingTag(this, "h3")); el.className = "c-recipe__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-recipe__title");
        if (t) t.remove();
      }
      const body = this.getAttribute("body");
      if (body) {
        const b = this.ensure(".c-recipe__desc", () => { const el = document.createElement("p"); el.className = "c-recipe__desc"; return el; });
        b.textContent = body;
      } else {
        const b = this.querySelector(".c-recipe__desc");
        if (b) b.remove();
      }
      const canvas = this.getAttribute("canvas");
      if (canvas) {
        const c = this.ensure(".c-recipe__canvas", () => { const el = document.createElement("div"); el.className = "c-recipe__canvas"; return el; });
        c.innerHTML = sanitizeHtml(canvas);
      } else {
        const c = this.querySelector(".c-recipe__canvas");
        if (c) c.remove();
      }
    }
  }
  define("contour-recipe", ContourRecipeFull);
class ContourLogosFull extends ContourBase {
    static get observed() { return []; }
    render() {
      this.classList.add("c-logos");
      if (!this.querySelector(".c-logos__item")) {
        for (const name of ["Cartolab", "Nordwand"]) {
          const span = document.createElement("span");
          span.className = "c-logos__item";
          span.textContent = name;
          this.appendChild(span);
        }
      }
    }
  }
  define("contour-logos", ContourLogosFull);
class ContourLandingFeaturesFull extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-landing-features");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "landing-features")) return;
      const items = remoteData(this, "items");
      const authored = Array.from(this.children).filter((n) => n.classList && n.classList.contains("c-landing-features__item"));
      if (items && !authored.length) {
        try {
          const parsed = JSON.parse(items);
          this.querySelectorAll(".c-landing-features__item").forEach((el) => el.remove());
          parsed.forEach((it) => {
            const item = document.createElement("div");
            item.className = "c-landing-features__item";
            if (it.icon) {
              const ic = document.createElement("span");
              ic.className = "c-landing-features__icon";
              ic.innerHTML = '<svg aria-hidden="true"><use href="#' + String(it.icon).replace(/[^a-zA-Z0-9_-]/g, "") + '" /></svg>';
              item.appendChild(ic);
            }
             if (it.title) {
               const t = document.createElement("span");
               t.className = "c-landing-features__title";
               t.textContent = it.title;
               item.appendChild(t);
             }
            if (it.text) {
              const tx = document.createElement("p");
              tx.className = "c-landing-features__text";
              tx.textContent = it.text;
              item.appendChild(tx);
            }
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      } else if (!items && !authored.length) {
        this.querySelectorAll(".c-landing-features__item").forEach((el) => el.remove());
        renderEmpty(this, "landing-features");
      }
    }
  }
define("contour-landing-features", ContourLandingFeaturesFull);
class ContourLandingHeroFull extends ContourBase {
    static get observed() { return ["actions", "title", "text", "heading"]; }
    static get properties() { return { actions: { attribute: "actions" }, title: { attribute: "title" }, text: { attribute: "text" } }; }
    render() {
      this.classList.add("c-landing-hero");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-landing-hero__title", () => { const el = document.createElement(headingTag(this, "h1")); el.className = "c-landing-hero__title"; return el; });
        t.textContent = title;
      }
      const text = this.getAttribute("text");
      if (text) {
        const t = this.ensure(".c-landing-hero__text", () => { const el = document.createElement("p"); el.className = "c-landing-hero__text"; return el; });
        t.textContent = text;
      }
      const actions = this.getAttribute("actions");
      const a = this.querySelector(".c-landing-hero__actions");
      const authored = a ? Array.from(a.children) : [];
      if (actions && !authored.length) {
        const el = this.ensure(".c-landing-hero__actions", () => { const e = document.createElement("div"); e.className = "c-landing-hero__actions"; return e; });
        el.innerHTML = sanitizeHtml(actions);
      } else if (!actions && a && !authored.length) {
        a.remove();
      }
    }
  }
  define("contour-landing-hero", ContourLandingHeroFull);
class ContourLinkishFull extends ContourBase {
    static get observed() { return []; }
    render() { this.classList.add("c-linkish"); }
  }
  define("contour-linkish", ContourLinkishFull);
class ContourPriceFull extends ContourBase {
    static get observed() { return ["value", "format", "locale"]; }
    static get properties() { return { value: { attribute: "value" }, format: { attribute: "format" }, locale: { attribute: "locale" } }; }
    render() {
      this.classList.add("c-price");
      const value = this.getAttribute("value");
      if (value) this.textContent = formatValue(value, this.getAttribute("format"), this.getAttribute("locale"));
    }
  }
  define("contour-price", ContourPriceFull);
class ContourProseFull extends ContourBase {
    static get observed() { return []; }
    render() { this.classList.add("c-prose"); }
  }
  define("contour-prose", ContourProseFull);
class ContourPanel extends ContourBase {
    static get observed() { return ["title", "subtitle", "status", "heading", "collapsible", "collapsed"]; }
    static get properties() { return { title: { attribute: "title" }, subtitle: { attribute: "subtitle" }, status: { attribute: "status" }, collapsible: { attribute: "collapsible", type: Boolean }, collapsed: { attribute: "collapsed", type: Boolean } }; }
    render() {
      this.classList.add("c-panel");
      const title = this.getAttribute("title");
      const subtitle = this.getAttribute("subtitle");
      const status = this.getAttribute("status");
      if (title) {
        const h = this.ensure(".c-panel__title", () => { const el = document.createElement(headingTag(this, "h3")); el.className = "c-panel__title"; return el; });
        if (h.parentNode === this && this.firstChild !== h) this.prepend(h);
        h.textContent = title;
      } else {
        const h = this.querySelector(".c-panel__title");
        if (h) h.remove();
      }
      if (subtitle) {
        const sub = this.ensure(".c-panel__subtitle", () => { const el = document.createElement("p"); el.className = "c-panel__subtitle"; return el; });
        sub.textContent = subtitle;
      } else {
        const sub = this.querySelector(".c-panel__subtitle");
        if (sub) sub.remove();
      }
      if (status) {
        const st = this.ensure(".c-panel__status", () => { const el = document.createElement("span"); el.className = "c-panel__status"; return el; });
        st.textContent = status;
      } else {
        const st = this.querySelector(".c-panel__status");
        if (st) st.remove();
      }
      // Collapsible widget chrome (CARTO-inspired): opt-in via `collapsible`.
      if (this.hasAttribute("collapsible")) {
        let btn = this.querySelector(".c-panel__collapse");
        if (!btn) {
          btn = document.createElement("button");
          btn.type = "button";
          btn.className = "c-panel__collapse c-btn c-btn--ghost c-btn--sm";
          btn.setAttribute("aria-label", "Toggle panel");
          btn.textContent = "▾";
          this.appendChild(btn);
        }
        if (this.hasAttribute("collapsed")) {
          this.classList.add("c-panel--collapsed");
          btn.setAttribute("aria-expanded", "false");
          btn.textContent = "▸";
        } else {
          this.classList.remove("c-panel--collapsed");
          btn.setAttribute("aria-expanded", "true");
          btn.textContent = "▾";
        }
      } else {
        const btn = this.querySelector(".c-panel__collapse");
        if (btn) btn.remove();
        this.classList.remove("c-panel--collapsed");
      }
      // Wrap authored content in a body so it picks up the panel's padding.
      const body = this.ensure(".c-panel__body", () => { const el = document.createElement("div"); el.className = "c-panel__body"; return el; });
      const head = this.querySelector(".c-panel__head");
      Array.from(this.childNodes).forEach((n) => {
        if (n === body || n === head) return;
        if (n.nodeType === 1 && (n.classList.contains("c-panel__title") || n.classList.contains("c-panel__subtitle") || n.classList.contains("c-panel__status"))) return;
        body.appendChild(n);
      });
      if (!body.parentNode) this.appendChild(body);
      // keep head before body
      if (head && head.parentNode === this && body.parentNode === this && head.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_PRECEDING) {
        this.insertBefore(body, head.nextSibling);
      }
    }
    enhance() {
      if (this._wiredPanel) return;
      this._wiredPanel = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-panel__collapse") : null;
        if (!btn || !this.contains(btn)) return;
        e.preventDefault();
        this.toggleAttribute("collapsed");
        this.dispatchEvent(new CustomEvent("contour:collapse", { bubbles: true, composed: true, detail: { collapsed: this.hasAttribute("collapsed") } }));
      });
    }
  }
  define("contour-panel", ContourPanel);
class ContourCta extends ContourBase {
    static get observed() { return ["title", "text", "actions", "heading"]; }
    static get properties() { return { title: { attribute: "title" }, text: { attribute: "text" }, actions: { attribute: "actions" } }; }
    render() {
      this.classList.add("c-cta");
      const title = this.getAttribute("title");
      const text = this.getAttribute("text");
      if (title) {
        const t = this.ensure(".c-cta__title", () => { const el = document.createElement(headingTag(this, "h3")); el.className = "c-cta__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-cta__title");
        if (t) t.remove();
      }
      if (text) {
        const p = this.ensure(".c-cta__text", () => { const el = document.createElement("p"); el.className = "c-cta__text"; return el; });
        p.textContent = text;
      } else {
        const p = this.querySelector(".c-cta__text");
        if (p) p.remove();
      }
      const actions = this.getAttribute("actions");
      // Clear previously generated actions wrap so a re-render cannot stack.
      const prevWrap = this.querySelector(".c-cta__actions");
      if (prevWrap) prevWrap.remove();
      if (actions) {
        try {
          const parsed = JSON.parse(actions);
          const wrap = document.createElement("div");
          wrap.className = "c-cta__actions";
          parsed.forEach((a) => {
            const btn = document.createElement("button");
            btn.className = "c-btn c-btn--primary";
            btn.type = "button";
            btn.textContent = typeof a === "string" ? a : (a.label || a);
            wrap.appendChild(btn);
          });
          this.appendChild(wrap);
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-cta", ContourCta);
class ContourCode extends ContourBase {
    static get observed() { return ["title", "copyable"]; }
    static get properties() { return { title: { attribute: "title" }, copyable: { attribute: "copyable", type: Boolean } }; }
    render() {
      this.classList.add("c-code");
      const title = this.getAttribute("title");
      if (title) {
        const head = this.ensure(".c-code__head", () => { const el = document.createElement("div"); el.className = "c-code__head"; return el; });
        if (head.parentNode === this && this.firstChild !== head) this.prepend(head);
        const t = head.querySelector(".c-code__title") || (() => { const el = document.createElement("div"); el.className = "c-code__title"; head.appendChild(el); return el; })();
        t.textContent = title;
      } else {
        const head = this.querySelector(".c-code__head");
        if (head) head.remove();
        const t = this.querySelector(".c-code__title");
        if (t) t.remove();
      }
      if (this.hasAttribute("copyable")) {
        this.ensure(".c-code__copy", () => {
          const btn = document.createElement("button");
          btn.className = "c-code__copy";
          btn.type = "button";
          btn.textContent = "Copy";
          return btn;
        });
      } else {
        const btn = this.querySelector(".c-code__copy");
        if (btn) btn.remove();
      }
      // Wrap authored code text in a pre so it picks up padding.
      const pre = this.ensure("pre", () => { const el = document.createElement("pre"); return el; });
      Array.from(this.childNodes).forEach((n) => {
        if (n === pre || (n.nodeType === 1 && (n.classList.contains("c-code__head") || n.classList.contains("c-code__copy")))) return;
        pre.appendChild(n);
      });
      if (!pre.querySelector("code")) {
        const code = document.createElement("code");
        while (pre.firstChild) code.appendChild(pre.firstChild);
        pre.appendChild(code);
      }
      if (pre.parentNode !== this) this.appendChild(pre);
      // keep head before pre
      const head = this.querySelector(".c-code__head");
      if (head && head.parentNode === this && pre.parentNode === this && head.compareDocumentPosition(pre) & Node.DOCUMENT_POSITION_PRECEDING) {
        this.insertBefore(pre, head.nextSibling);
      }
    }
    enhance() {
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
      wireCopy(this);
    }
  }
  define("contour-code", ContourCode);
class ContourPlate extends ContourBase {
    static get observed() { return []; }
    render() { this.classList.add("c-plate"); }
  }
  define("contour-plate", ContourPlate);
class ContourPullquote extends ContourBase {
    static get observed() { return ["quote", "name"]; }
    static get properties() { return { quote: { attribute: "quote" }, name: { attribute: "name" } }; }
    render() {
      this.classList.add("c-pullquote");
      const quote = this.getAttribute("quote");
      // `.c-pullquote` defines no `__quote` or `__byline`: the guide's specimen is
      // the paragraph itself, and the one element the sheet styles inside it is
      // `cite`, which is what an attribution is.
      if (quote) {
        // Preserve a generated <cite> (attribution) while updating the quote text.
        Array.from(this.childNodes).forEach((n) => { if (n.nodeType === 3) n.remove(); });
        const cite = this.querySelector("cite");
        this.insertBefore(document.createTextNode(quote), cite);
      }
      const name = this.getAttribute("name");
      if (name) {
        const by = this.ensure("cite", () => { const el = document.createElement("cite"); this.appendChild(el); return el; });
        by.textContent = name;
      } else {
        const by = this.querySelector("cite");
        if (by) by.remove();
      }
    }
  }
  define("contour-pullquote", ContourPullquote);
class ContourAnchor extends ContourBase {
    static get observed() { return ["href", "label"]; }
    static get properties() { return { href: { attribute: "href" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-anchor");
      const href = this.getAttribute("href");
      const label = this.getAttribute("label");
      // Clear previously generated link so a re-render cannot stack a second one.
      const prevAnchor = this.querySelector("a");
      if (prevAnchor) prevAnchor.remove();
      if (href && label) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = label;
        const ariaLabel = this.getAttribute("aria-label");
        if (ariaLabel) a.setAttribute("aria-label", ariaLabel);
        this.appendChild(a);
      }
    }
  }
  define("contour-anchor", ContourAnchor);

/**
 * Geocoder (CARTO-inspired): engine-agnostic search input + result list.
 * The consumer runs the geocoding service and passes results via `results`
 * (JSON array of {label, lat, lon}) or `src`. Contour renders the input and
 * list and emits `contour:search` (query) and `contour:select` (result).
 * Attributes: `placeholder`, `value`, `results`, `empty`, `loading`, `error`,
 * `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourGeocoder extends ContourBase {
    static get observed() { return ["placeholder", "value", "results", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { placeholder: { attribute: "placeholder" }, value: { attribute: "value" }, results: { attribute: "results" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-geocoder");
      wireStates(this);
      loadRemote(this, ["results"]);
      if (renderStates(this, "geocoder")) return;
      // Input
      let inp = this.querySelector(".c-geocoder__input");
      if (!inp) {
        inp = document.createElement("input");
        inp.type = "search";
        inp.className = "c-geocoder__input";
        this.appendChild(inp);
      }
      const ph = this.getAttribute("placeholder");
      if (ph) inp.setAttribute("placeholder", ph);
      const val = this.getAttribute("value");
      if (val !== null && inp.value !== val) inp.value = val;
      // Results
      Array.from(this.querySelectorAll(".c-geocoder__result")).forEach((n) => n.remove());
      let results = [];
      const rAttr = this.getAttribute("results");
      if (rAttr) { try { results = JSON.parse(rAttr); } catch (e) { results = []; } }
      const remote = remoteData(this, "results");
      if (Array.isArray(remote)) results = remote;
      if (Array.isArray(results) && results.length) {
        const list = document.createElement("ul");
        list.className = "c-geocoder__list";
        list.setAttribute("role", "listbox");
        results.forEach((r, idx) => {
          const li = document.createElement("li");
          li.className = "c-geocoder__result";
          li.setAttribute("role", "option");
          li.setAttribute("tabindex", idx === 0 ? "0" : "-1");
          li.textContent = (typeof r === "object") ? (r.label || r.name || "") : String(r);
          if (typeof r === "object") {
            if (r.lat != null) li.dataset.lat = String(r.lat);
            if (r.lon != null) li.dataset.lon = String(r.lon);
          }
          list.appendChild(li);
        });
        this.appendChild(list);
      } else if (!this.hasAttribute("loading") && !this.hasAttribute("error")) {
        renderEmpty(this, "geocoder");
      }
    }
    enhance() {
      if (this._wiredGeocoder) return;
      this._wiredGeocoder = true;
      const inp = this.querySelector(".c-geocoder__input");
      if (inp) {
        let timer = null;
        inp.addEventListener("input", () => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            this.dispatchEvent(new CustomEvent("contour:search", { bubbles: true, composed: true, detail: { query: inp.value } }));
          }, 200);
        });
        inp.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            this.dispatchEvent(new CustomEvent("contour:search", { bubbles: true, composed: true, detail: { query: inp.value } }));
          }
        });
      }
      this.addEventListener("click", (e) => {
        const li = e.target && e.target.closest ? e.target.closest(".c-geocoder__result") : null;
        if (!li || !this.contains(li)) return;
        const result = { label: li.textContent.trim(), lat: li.dataset.lat, lon: li.dataset.lon };
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { result } }));
      });
      this.addEventListener("keydown", (e) => {
        const li = e.target && e.target.closest ? e.target.closest(".c-geocoder__result") : null;
        if (!li || !this.contains(li)) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const result = { label: li.textContent.trim(), lat: li.dataset.lat, lon: li.dataset.lon };
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { result } }));
        }
      });
    }
  }
  define("contour-geocoder", ContourGeocoder);


/**
 * Dashboard state machine (R13-06).
 *
 * A dashboard widget moves through a small, well-defined set of states:
 *   loading  -> data is being fetched/rendered (show skeleton/spinner)
 *   empty    -> fetch resolved but no rows/points (show empty state)
 *   error    -> fetch failed (show error + retry affordance)
 *   stale    -> data present but older than the freshness threshold
 *   ready    -> data present and current (default)
 *
 * Components that participate:
 *   - contour-widget-state  : renders the state chrome (loading/empty/error)
 *     via its `state` attribute; emits `contour:retry` on retry click.
 *   - contour-brownout      : sheds non-essential chrome at levels 1-3
 *     (level 3 drops the dial/ring entirely).
 *   - contour-dash-freshness : live region announcing the last-updated value;
 *     consumers set `value` to an ISO timestamp and `format`/`locale`.
 *   - contour-dash-kpi-row  : renders one contour-kpi per item; emits
 *     `contour:select` with { index } on click.
 *
 * Retry/offline handling lives in the consumer (libreship): contour-ds only
 * provides the affordances (retry button in widget-state, brownout levels,
 * freshness live region). No data fetching or state management is shipped.
 *
 * Slot contracts (R13-17):
 *   - contour-dash-shell    : light-DOM children become the grid cells; the
 *     optional `title` attribute generates a contour-dash-toolbar with a
 *     `.c-dash-toolbar__title`. No shadow slots.
 *   - contour-dash-toolbar  : light-DOM children are appended after the
 *     generated title/actions; `.c-dash-toolbar__actions` is generated from
 *     the `actions` JSON attribute.
 *   - contour-dash-kpi-row  : light-DOM children are replaced by generated
 *     contour-kpi elements from the `items` attribute; authored children are
 *     only kept when no items are provided.
 *   - contour-dash-freshness : no slots; renders a `.c-dot` + text node.
 *   - contour-widget-state   : light-DOM children are the fallback content
 *     shown in the ready state.
 *   - contour-brownout       : light-DOM children are the content that may be
 *     shed at higher brownout levels.
 */
class ContourDashShell extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-dash-shell");
      this.setAttribute("role", "region");
      const title = this.getAttribute("title");
      if (title) {
        // `.c-dash-shell` is the grid and owns no title; the guide's title lives
        // on the toolbar as `.c-dash-toolbar__title`, so the shell composes that
        // block instead of inventing a part of its own.
        const bar = this.ensure(".c-dash-toolbar", () => { const el = document.createElement("div"); el.className = "c-dash-toolbar"; return el; });
        const h = bar.querySelector(".c-dash-toolbar__title") || (() => { const el = document.createElement("span"); el.className = "c-dash-toolbar__title"; bar.appendChild(el); return el; })();
        h.textContent = title;
        this.setAttribute("aria-label", title);
      }
    }
  }
  define("contour-dash-shell", ContourDashShell);
class ContourDashToolbar extends ContourBase {
    static get observed() { return ["title", "actions"]; }
    static get properties() { return { title: { attribute: "title" }, actions: { attribute: "actions" } }; }
    render() {
      this.classList.add("c-dash-toolbar");
      this.setAttribute("role", "toolbar");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-dash-toolbar__title", () => { const el = document.createElement("span"); el.className = "c-dash-toolbar__title"; return el; });
        t.textContent = title;
        this.setAttribute("aria-label", title);
      } else {
        const t = this.querySelector(".c-dash-toolbar__title");
        if (t) t.remove();
      }
      const actions = this.getAttribute("actions");
      if (actions) {
        try {
          const parsed = JSON.parse(actions);
          const wrap = this.ensure(".c-dash-toolbar__actions", () => { const el = document.createElement("div"); el.className = "c-dash-toolbar__actions"; return el; });
          wrap.innerHTML = "";
          parsed.forEach((a) => {
            const btn = document.createElement("button");
            btn.className = "c-btn c-btn--ghost c-btn--sm";
            btn.type = "button";
            btn.textContent = typeof a === "string" ? a : (a.label || a);
            wrap.appendChild(btn);
          });
        } catch (e) { /* keep existing */ }
      } else {
        const w = this.querySelector(".c-dash-toolbar__actions");
        if (w) w.remove();
      }
    }
    enhance() {
      if (this._wiredDashToolbar) return;
      this._wiredDashToolbar = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-btn") : null;
        if (btn && this.contains(btn)) {
          const label = btn.textContent || "";
          this.dispatchEvent(new CustomEvent("contour:dash-action", { bubbles: true, composed: true, detail: { label } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-btn") : null;
        if (!btn || !this.contains(btn)) return;
        const btns = Array.from(this.querySelectorAll(".c-btn"));
        const idx = btns.indexOf(btn);
        let next = -1;
        if (e.key === "ArrowRight") next = Math.min(btns.length - 1, idx + 1);
        else if (e.key === "ArrowLeft") next = Math.max(0, idx - 1);
        if (next >= 0) { e.preventDefault(); try { btns[next].focus(); } catch (err) {} }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); btn.click(); }
      });
    }
  }
  define("contour-dash-toolbar", ContourDashToolbar);
class ContourDashKpiRow extends ContourBase {
    static get observed() { return ["items"]; }
    static get properties() { return { items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-dash-kpi-row");
      this.setAttribute("role", "group");
      // Drop previously generated kpis so re-render doesn't stack.
      Array.from(this.querySelectorAll("contour-kpi")).forEach((n) => n.remove());
      const items = this.getAttribute("items");
      let parsed = null;
      if (items) { try { parsed = JSON.parse(items); } catch (e) { parsed = null; } }
      if (Array.isArray(parsed) && parsed.length) {
        parsed.forEach((it) => {
          const k = document.createElement("contour-kpi");
          if (typeof it === "object" && it !== null) {
            if (it.value !== undefined) k.setAttribute("value", String(it.value));
            if (it.label !== undefined) k.setAttribute("label", String(it.label));
          } else {
            k.setAttribute("value", String(it));
          }
          this.appendChild(k);
        });
      } else if (!this.querySelector("contour-kpi")) {
        // Fallback: keep a single placeholder kpi only when no items provided.
        const k = document.createElement("contour-kpi");
        k.setAttribute("value", "0");
        k.setAttribute("label", "KPI");
        this.appendChild(k);
      }
    }
    enhance() {
      if (this._wiredDashKpiRow) return;
      this._wiredDashKpiRow = true;
      this.addEventListener("click", (e) => {
        const kpi = e.target && e.target.closest ? e.target.closest("contour-kpi") : null;
        if (kpi && this.contains(kpi)) {
          const kpis = Array.from(this.querySelectorAll("contour-kpi"));
          const idx = kpis.indexOf(kpi);
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: idx } }));
        }
      });
    }
  }
  define("contour-dash-kpi-row", ContourDashKpiRow);
class ContourDashFreshness extends ContourBase {
    static get observed() { return ["label", "value", "format", "locale"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" }, format: { attribute: "format" }, locale: { attribute: "locale" } }; }
    render() {
      this.classList.add("c-dash-freshness");
      this.setAttribute("role", "status");
      this.setAttribute("aria-live", "polite");
      const label = this.getAttribute("label");
      const value = this.getAttribute("value");
      // The block defines no elements of its own: the guide's chip is a live dot
      // followed by its text, so the dot is the real `.c-dot` and the words are a
      // text node rather than two invented parts.
      const dot = this.ensure(".c-dot", () => { const el = document.createElement("span"); el.className = "c-dot c-dot--live c-dot--accent"; el.setAttribute("aria-hidden", "true"); return el; });
      if (dot.parentNode !== this) this.appendChild(dot);
      // Reset stale text node reference after base-class cleanup.
      if (!this._freshnessText || !this._freshnessText.parentNode) {
        this._freshnessText = document.createTextNode("");
        this.appendChild(this._freshnessText);
      }
      const formattedValue = value ? formatValue(value, this.getAttribute("format"), this.getAttribute("locale")) : value;
      this._freshnessText.nodeValue = [label, formattedValue].filter(Boolean).join(" ");
    }
  }
  define("contour-dash-freshness", ContourDashFreshness);




/**
 * Readout: web component wrapper.
 * Attributes: `rows`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`, `format`, `locale`.
 */
class ContourReadout extends ContourBase {
    static get observed() { return ["rows", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "format", "locale"]; }
    static get properties() { return { rows: { attribute: "rows" }, format: { attribute: "format" }, locale: { attribute: "locale" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-readout");
      wireStates(this);
      loadRemote(this, "rows");
      if (renderStates(this, "readout")) return;
      const rows = remoteData(this, "rows");
      // Drop previously generated rows so a re-render cannot stack a second set.
      Array.from(this.querySelectorAll(".c-readout__row")).forEach((n) => n.remove());
      const authored = Array.from(this.children).filter((n) => !n.classList || !n.classList.contains("c-readout__row"));
      if (rows && !authored.length) {
        try {
          const parsed = JSON.parse(rows);
          parsed.forEach((r) => {
            const row = document.createElement("div");
            row.className = "c-readout__row";
            const key = document.createElement("span");
            key.className = "c-readout__key";
            key.textContent = r.key || r[0];
            const val = document.createElement("span");
             val.className = "c-readout__value" + (r.primary ? " c-readout__value--primary" : "") + (r.accent ? " c-readout__value--accent" : "") + (r.coord ? " c-readout__value--coord" : "");
             val.setAttribute("aria-live", "polite");
            val.textContent = formatValue(r.value || r[1], this.getAttribute("format"), this.getAttribute("locale"), (r.unit !== undefined ? r.unit : this.getAttribute("unit")));
            row.appendChild(key);
            row.appendChild(val);
            if (r.order) {
              const ord = document.createElement("span");
              ord.className = "c-readout__order";
              ord.textContent = r.order;
              row.appendChild(ord);
            }
            this.appendChild(row);
          });
        } catch (e) { /* keep existing */ }
      } else if (!rows && !authored.length) {
        renderEmpty(this, "readout");
      }
    }
  }
define("contour-readout", ContourReadout);
/**
 * Kpi: web component wrapper.
 * Attributes: `value`, `label`, `delta`, `direction`, `note`, `variant`, `unit`, `format`, `locale`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`, `thresholds`, `threshold`, `sparkline`, `polarity`.
 */
class ContourKpi extends ContourBase {
    static get observed() { return ["value", "label", "delta", "direction", "note", "variant", "unit", "format", "locale", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "thresholds", "threshold", "sparkline", "polarity"]; }
    static get properties() {
      return { value: { attribute: "value" }, label: { attribute: "label" }, delta: { attribute: "delta" }, direction: { attribute: "direction" }, note: { attribute: "note" }, variant: { attribute: "variant" }, unit: { attribute: "unit" }, format: { attribute: "format" }, locale: { attribute: "locale" }, thresholds: { attribute: "thresholds" }, threshold: { attribute: "threshold" }, sparkline: { attribute: "sparkline" }, polarity: { attribute: "polarity" } };
    }
    render() {
      this.classList.add("c-kpi");
      wireStates(this);
      loadRemote(this, ["value", "label"]);
      if (renderStates(this, "kpi")) return;
      const value = remoteData(this, "value");
      const label = remoteData(this, "label");
      const delta = this.getAttribute("delta");
      const variant = this.getAttribute("variant");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-kpi--")) this.classList.remove(c); });
      if (variant) this.classList.add("c-kpi--" + variant);
      if (value) {
        const v = this.ensure(".c-kpi__value", () => { const el = document.createElement("div"); el.className = "c-kpi__value"; el.setAttribute("aria-live", "polite"); return el; });
        v.textContent = formatValue(value, this.getAttribute("format"), this.getAttribute("locale"), this.getAttribute("unit"));
      } else {
        const v = this.querySelector(".c-kpi__value");
        if (v) v.remove();
      }
      if (label) {
        const h = this.ensure(".c-kpi__head", () => { const el = document.createElement("div"); el.className = "c-kpi__head"; return el; });
        let l = h.querySelector(".c-kpi__label");
        if (!l) { l = document.createElement("div"); l.className = "c-kpi__label"; h.appendChild(l); }
        l.textContent = label;
        if (h.parentNode !== this) this.insertBefore(h, this.firstChild);
      } else {
        const h = this.querySelector(".c-kpi__head");
        if (h) h.remove();
      }
       if (delta) {
         const f = this.ensure(".c-kpi__foot", () => { const el = document.createElement("div"); el.className = "c-kpi__foot"; return el; });
         const d = f.querySelector(".c-delta") || document.createElement("span");
         if (!d.parentNode) f.insertBefore(d, f.firstChild);
         const dir = this.getAttribute("direction") || "up";
         const polarity = this.getAttribute("polarity") || "neutral";
         let tone = "neutral";
         if (polarity === "good") tone = (dir === "up") ? "good" : "bad";
         else if (polarity === "bad") tone = (dir === "up") ? "bad" : "good";
         d.className = "c-delta c-delta--" + dir + " c-delta--" + tone;
         d.textContent = delta;
       } else {
        const d = this.querySelector(".c-kpi__foot .c-delta");
        if (d) d.remove();
      }
      const note = this.getAttribute("note");
      if (note) {
        const f = this.ensure(".c-kpi__foot", () => { const el = document.createElement("div"); el.className = "c-kpi__foot"; return el; });
        const n = f.querySelector(".c-kpi__note") || (() => { const el = document.createElement("span"); el.className = "c-kpi__note"; f.appendChild(el); return el; })();
        n.textContent = note;
      } else {
        const n = this.querySelector(".c-kpi__note");
        if (n) n.remove();
      }
      const unit = this.getAttribute("unit");
      const v = this.querySelector(".c-kpi__value");
      if (v) {
        if (unit) {
          let u = v.querySelector(".c-kpi__unit");
          if (!u) { u = document.createElement("span"); u.className = "c-kpi__unit"; v.appendChild(u); }
          u.textContent = unit;
        } else {
          const u = v.querySelector(".c-kpi__unit");
          if (u) u.remove();
        }
      }
      // threshold badge
      const threshold = this.getAttribute("threshold") || this.getAttribute("thresholds");
      if (threshold) {
        const f = this.ensure(".c-kpi__foot", () => { const el = document.createElement("div"); el.className = "c-kpi__foot"; return el; });
        let badge = f.querySelector(".c-kpi__threshold-badge");
        if (!badge) { badge = document.createElement("span"); badge.className = "c-kpi__threshold-badge"; f.appendChild(badge); }
        badge.textContent = threshold;
        badge.setAttribute("part", "threshold-badge");
      } else {
        const b = this.querySelector(".c-kpi__threshold-badge");
        if (b) b.remove();
      }
      // remove orphaned foot container when no children remain
      const foot = this.querySelector(".c-kpi__foot");
      if (foot && !foot.querySelector(".c-delta, .c-kpi__note, .c-kpi__threshold-badge")) foot.remove();
      // sparkline canvas
      const spark = this.getAttribute("sparkline");
      if (spark) {
        let canvas = this.querySelector(".c-kpi__sparkline-canvas");
        if (!canvas) { canvas = document.createElement("canvas"); canvas.className = "c-kpi__sparkline-canvas"; canvas.setAttribute("part", "sparkline-canvas"); this.appendChild(canvas); }
      } else {
        const c = this.querySelector(".c-kpi__sparkline-canvas");
        if (c) c.remove();
      }
      if (!value && !label) {
        renderEmpty(this, "kpi");
      }
    }
  }
define("contour-kpi", ContourKpi);
/**
 * Table: web component wrapper.
 * Attributes: `columns`, `rows`, `page`, `page-size`, `sort`, `sort-dir`, `virtual`, `empty`, `loading`, `error`, `retry`, `skeleton`, `persist`.
 */
class ContourTable extends ContourBase {
    static get updateMode() { return "keyed"; }
    static get observed() { return ["columns", "rows", "page", "page-size", "sort", "sort-dir", "virtual", "empty", "loading", "error", "retry", "skeleton", "persist"]; }
    static get properties() { return { columns: { attribute: "columns" }, rows: { attribute: "rows" }, page: { attribute: "page", type: Number }, pageSize: { attribute: "page-size", type: Number } }; }
    _cellValue(cell) {
      if (cell === null || cell === undefined) return "";
      if (typeof cell === "object") return cell.value !== undefined ? cell.value : (cell.label !== undefined ? cell.label : JSON.stringify(cell));
      return cell;
    }
    _compare(a, b, type) {
      const av = this._cellValue(a);
      const bv = this._cellValue(b);
      if (type === "number" || type === "numeric") {
        return (parseFloat(av) || 0) - (parseFloat(bv) || 0);
      }
      return String(av).localeCompare(String(bv), undefined, { numeric: true });
    }
    render() {
      this.setAttribute("role", "region");
      this.setAttribute("aria-label", "Table");
      // The host is not a <table>, so it carries no table rule. The scroller the
      // reflow contract requires is a real block element inside it.
      const columns = this.getAttribute("columns");
      const rows = this.getAttribute("rows");
      // Slot composition: an authored table wins over the JSON attributes.
      const authored = Array.from(this.children).filter((n) => !n.classList || !n.classList.contains("c-table-wrap"));
      if (columns && rows && !authored.length) {
        try {
          const cols = JSON.parse(columns);
          const data = JSON.parse(rows);
          // Loading state: show a spinner row instead of data.
          if (this.hasAttribute("loading")) {
            const wrap = this.ensure(".c-table-wrap", () => { const el = document.createElement("div"); el.className = "c-table-wrap"; return el; });
            const colsKey = JSON.stringify(cols);
            const table = (wrap.querySelector("table.c-table") && this._tableCols === colsKey)
              ? wrap.querySelector("table.c-table")
              : (() => {
                  const t = document.createElement("table");
                  t.className = "c-table";
                  const thead = document.createElement("thead");
                  const tr = document.createElement("tr");
                  cols.forEach((c) => {
                    const colLabel = typeof c === "string" ? c : (c.label || c.title || c);
                    const th = document.createElement("th");
                    th.textContent = colLabel;
                    tr.appendChild(th);
                  });
                  thead.appendChild(tr);
                  t.appendChild(thead);
                  t.appendChild(document.createElement("tbody"));
                  return t;
                })();
            this._tableCols = colsKey;
            const tbody = table.querySelector("tbody");
            tbody.innerHTML = "";
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = cols.length;
            td.style.textAlign = "center";
            td.style.color = "var(--color-text-muted)";
            td.textContent = this.getAttribute("loading") || "Loading…";
            tr.appendChild(td);
            tbody.appendChild(tr);
            if (table.parentNode !== wrap) { wrap.innerHTML = ""; wrap.appendChild(table); }
            if (wrap.parentNode !== this) this.appendChild(wrap);
            const footer = this.querySelector(".c-table__pagination");
            if (footer) footer.remove();
            return;
          }
          if (this.hasAttribute("error")) {
            const wrap = this.ensure(".c-table-wrap", () => { const el = document.createElement("div"); el.className = "c-table-wrap"; return el; });
            const colsKey = JSON.stringify(cols);
            const table = (wrap.querySelector("table.c-table") && this._tableCols === colsKey)
              ? wrap.querySelector("table.c-table")
              : (() => {
                  const t = document.createElement("table");
                  t.className = "c-table";
                  const thead = document.createElement("thead");
                  const tr = document.createElement("tr");
                  cols.forEach((c) => {
                    const colLabel = typeof c === "string" ? c : (c.label || c.title || c);
                    const th = document.createElement("th");
                    th.textContent = colLabel;
                    tr.appendChild(th);
                  });
                  thead.appendChild(tr);
                  t.appendChild(thead);
                  t.appendChild(document.createElement("tbody"));
                  return t;
                })();
            this._tableCols = colsKey;
            const tbody = table.querySelector("tbody");
            tbody.innerHTML = "";
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = cols.length;
            td.textContent = this.getAttribute("error") || "Error";
            td.style.textAlign = "center";
            td.style.color = "var(--color-danger, var(--color-text))";
            if (this.hasAttribute("retry")) {
              const btn = document.createElement("button");
              btn.className = "c-btn c-btn--ghost c-btn--sm";
              btn.type = "button";
              btn.textContent = this.getAttribute("retry") || "Retry";
              btn.style.marginInlineStart = "var(--space-sm)";
              btn.dataset.action = "retry";
              td.appendChild(btn);
            }
            tr.appendChild(td);
            tbody.appendChild(tr);
            if (table.parentNode !== wrap) { wrap.innerHTML = ""; wrap.appendChild(table); }
            if (wrap.parentNode !== this) this.appendChild(wrap);
            const footer = this.querySelector(".c-table__pagination");
            if (footer) footer.remove();
            return;
          }
          if (this.hasAttribute("skeleton")) {
            const wrap = this.ensure(".c-table-wrap", () => { const el = document.createElement("div"); el.className = "c-table-wrap"; return el; });
            const colsKey = JSON.stringify(cols);
            const table = (wrap.querySelector("table.c-table") && this._tableCols === colsKey)
              ? wrap.querySelector("table.c-table")
              : (() => {
                  const t = document.createElement("table");
                  t.className = "c-table";
                  const thead = document.createElement("thead");
                  const tr = document.createElement("tr");
                  cols.forEach((c) => {
                    const colLabel = typeof c === "string" ? c : (c.label || c.title || c);
                    const th = document.createElement("th");
                    th.textContent = colLabel;
                    tr.appendChild(th);
                  });
                  thead.appendChild(tr);
                  t.appendChild(thead);
                  t.appendChild(document.createElement("tbody"));
                  return t;
                })();
            this._tableCols = colsKey;
            const tbody = table.querySelector("tbody");
            tbody.innerHTML = "";
            const count = Math.min(5, Math.max(1, parseInt(this.getAttribute("skeleton") || "3", 10) || 3));
            for (let i = 0; i < count; i++) {
              const tr = document.createElement("tr");
              cols.forEach(() => {
                const td = document.createElement("td");
                const sk = document.createElement("span");
                sk.className = "c-skeleton";
                sk.style.display = "inline-block";
                sk.style.inlineSize = "60%";
                sk.style.blockSize = "0.8rem";
                td.appendChild(sk);
                tr.appendChild(td);
              });
              tbody.appendChild(tr);
            }
            if (table.parentNode !== wrap) { wrap.innerHTML = ""; wrap.appendChild(table); }
            if (wrap.parentNode !== this) this.appendChild(wrap);
            const footer = this.querySelector(".c-table__pagination");
            if (footer) footer.remove();
            return;
          }
          // Initialise sort state from attributes on first render.
          if (this._sortCol === undefined) {
            const sortAttr = this.getAttribute("sort");
            if (sortAttr !== null) {
              const idx = Number(sortAttr);
              this._sortCol = Number.isFinite(idx) ? idx : cols.findIndex((c) => (typeof c === "object" && c && (c.label || c.title || c) === sortAttr));
              if (this._sortCol < 0) this._sortCol = null;
            } else {
              this._sortCol = null;
            }
            const dirAttr = this.getAttribute("sort-dir");
            this._sortDir = dirAttr === "descending" || dirAttr === "desc" ? -1 : 1;
          }
          // Apply sort.
          let working = Array.isArray(data) ? data.slice() : [];
          if (this._sortCol !== null && this._sortCol !== undefined && this._sortCol >= 0 && this._sortCol < cols.length) {
            const col = this._sortCol;
            const dir = this._sortDir || 1;
            const colSpec = cols[col];
            const type = (typeof colSpec === "object" && colSpec && colSpec.sortType) ? colSpec.sortType : "text";
            working.sort((a, b) => this._compare(a && a[col], b && b[col], type) * dir);
          }
          // Column filters (F-09): narrow `working` by each active filter.
          if (!this._filters) this._filters = {};
          const activeFilters = Object.keys(this._filters).filter((k) => this._filters[k]);
          if (activeFilters.length) {
            working = working.filter((row) => activeFilters.every((k) => {
              const ci = Number(k);
              const q = String(this._filters[ci] || "").toLowerCase();
              if (!q) return true;
              return String(this._cellValue(row[ci])).toLowerCase().includes(q);
            }));
          }
          // Pagination.
          const pageSizeRaw = this.getAttribute("page-size");
          const pageSize = pageSizeRaw !== null ? parseInt(pageSizeRaw, 10) : NaN;
          const usePaging = Number.isFinite(pageSize) && pageSize > 0;
          // Sync internal page state with external attribute changes.
          let pageAttr = this.getAttribute("page");
          if (this.getAttribute("persist") && this.id) {
            const mode = this.getAttribute("persist");
            let stored = null;
            if (mode === "storage") { try { stored = localStorage.getItem("contour-table:" + this.id); } catch (e) {} }
            else if (mode === "url") { try { stored = new URLSearchParams(window.location.search).get("c-table"); } catch (e) {} }
            if (stored !== null) pageAttr = stored;
          }
          if (this._pageInternal) {
            this._pageInternal = false;
            this._pageAttrLast = pageAttr;
          } else if (pageAttr !== this._pageAttrLast) {
            this._page = null;
            this._pageAttrLast = pageAttr;
          }
          let page = this._page !== null ? this._page : (parseInt(pageAttr || "1", 10));
          if (!Number.isFinite(page) || page < 1) page = 1;
          let totalPages = 1;
          let pageData = working;
          if (usePaging) {
            totalPages = Math.max(1, Math.ceil(working.length / pageSize));
            if (page > totalPages) page = totalPages;
            const start = (page - 1) * pageSize;
            pageData = working.slice(start, start + pageSize);
          }
          this._page = page;
          this._totalPages = totalPages;
          this._pageSize = pageSize;

          const wrap = this.ensure(".c-table-wrap", () => { const el = document.createElement("div"); el.className = "c-table-wrap"; return el; });
          // Reuse the existing table when columns are unchanged, rebuilding
          // only the body. This avoids O(n) DOM churn on row-only updates.
          const colsKey = JSON.stringify(cols);
          const table = (wrap.querySelector("table.c-table") && this._tableCols === colsKey)
            ? wrap.querySelector("table.c-table")
            : (() => {
                const t = document.createElement("table");
                t.className = "c-table";
                const thead = document.createElement("thead");
                const tr = document.createElement("tr");
                cols.forEach((c, i) => {
                  const colLabel = typeof c === "string" ? c : (c.label || c.title || c);
                  const th = document.createElement("th");
                  const sortable = (typeof c === "object" && c !== null && c.sort);
                  const isSelect = (typeof c === "object" && c !== null && c.select);
                  const isFilter = (typeof c === "object" && c !== null && c.filter);
                  if (isFilter) {
                    th.className = (th.className + " c-table__filter").trim();
                    const inp = document.createElement("input");
                    inp.type = "search";
                    inp.className = "c-table__filter-input";
                    inp.placeholder = colLabel;
                    inp.dataset.filterIndex = String(i);
                    if (this._filters && this._filters[i]) inp.value = this._filters[i];
                    th.appendChild(inp);
                  } else if (isSelect) {
                    th.className = (th.className + " c-table__select").trim();
                    const cb = document.createElement("input");
                    cb.type = "checkbox";
                    cb.className = "c-table__select-all";
                    cb.setAttribute("aria-label", "Select all rows");
                    th.appendChild(cb);
                  } else if (sortable) {
                    th.setAttribute("aria-sort", (this._sortCol === i)
                      ? (this._sortDir === -1 ? "descending" : "ascending")
                      : "none");
                    const wrapEl = document.createElement("span");
                    wrapEl.className = "c-table__sort";
                    wrapEl.textContent = colLabel;
                    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    svg.setAttribute("aria-hidden", "true");
                    svg.innerHTML = '<use href="#i-chevron-down" />';
                    wrapEl.appendChild(svg);
                    th.appendChild(wrapEl);
                  } else if (typeof c === "object" && c !== null && c.pinned) {
                    th.className = "c-table__pinned";
                    th.textContent = colLabel;
                  } else {
                    th.textContent = colLabel;
                  }
                  if (sortable) {
                    th.setAttribute("tabindex", "0");
                    th.setAttribute("role", "columnheader");
                    th.dataset.sortIndex = String(i);
                  }
                  tr.appendChild(th);
                });
                thead.appendChild(tr);
                t.appendChild(thead);
                t.appendChild(document.createElement("tbody"));
                return t;
              })();
          this._tableCols = colsKey;
          // Keep sort indicators in sync even when the table element is reused.
          cols.forEach((c, i) => {
            if (typeof c === "object" && c !== null && c.sort) {
              const th = table.querySelector("thead tr th:nth-child(" + (i + 1) + ")");
              if (th) th.setAttribute("aria-sort", (this._sortCol === i) ? (this._sortDir === -1 ? "descending" : "ascending") : "none");
            }
          });
          const tbody = table.querySelector("tbody");
          tbody.innerHTML = "";
          const useVirtual = this.hasAttribute("virtual") && !usePaging && pageData.length > 100;
          const rowHeight = 36;
          const windowSize = 30;
          const overscan = 10;
          let windowStart = 0;
          let visibleData = pageData;
          if (useVirtual) {
            const maxStart = Math.max(0, pageData.length - windowSize);
            windowStart = Math.min(maxStart, Math.max(0, Math.floor(wrap.scrollTop / rowHeight) - overscan));
            visibleData = pageData.slice(windowStart, windowStart + windowSize + overscan * 2);
            table.setAttribute("aria-rowcount", String(pageData.length + 1));
          } else {
            table.removeAttribute("aria-rowcount");
          }
          const addSpacer = (height) => {
            const tr = document.createElement("tr");
            tr.setAttribute("aria-hidden", "true");
            const td = document.createElement("td");
            td.colSpan = cols.length;
            td.style.blockSize = `${height}px`;
            td.style.padding = "0";
            tr.appendChild(td);
            tbody.appendChild(tr);
          };
          if (useVirtual) addSpacer(windowStart * rowHeight);
          if (visibleData.length === 0) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = cols.length;
            td.textContent = this.getAttribute("empty") || "No data";
            td.style.textAlign = "center";
            td.style.color = "var(--color-text-muted)";
            tr.appendChild(td);
            tbody.appendChild(tr);
          } else {
            visibleData.forEach((row, ri) => {
              const tr = document.createElement("tr");
              tr.dataset.rowIndex = String(windowStart + ri);
              tr.setAttribute("tabindex", "0");
              cols.forEach((c, ci) => {
                const isSelect = (typeof c === "object" && c !== null && c.select);
                const td = document.createElement("td");
                if (isSelect) {
                  const cb = document.createElement("input");
                  cb.type = "checkbox";
                  cb.className = "c-table__row-select";
                  cb.dataset.rowIndex = String(windowStart + ri);
                  if (this._selectedRows && this._selectedRows.has(windowStart + ri)) cb.checked = true;
                  td.appendChild(cb);
                } else {
                  td.textContent = this._cellValue(row[ci]);
                }
                tr.appendChild(td);
              });
              tbody.appendChild(tr);
            });
          }
          if (useVirtual) addSpacer(Math.max(0, pageData.length - windowStart - visibleData.length) * rowHeight);
          if (table.parentNode !== wrap) {
            wrap.innerHTML = "";
            wrap.appendChild(table);
          }
          if (wrap.parentNode !== this) this.appendChild(wrap);
          // Optional fixed-row DOM windowing for large datasets. Opt-in via `virtual`.
          if (this.hasAttribute("virtual")) {
            wrap.style.maxHeight = wrap.style.maxHeight || "24rem";
            wrap.style.overflow = "auto";
            table.classList.add("c-table--virtual");
          } else {
            wrap.style.maxHeight = "";
            wrap.style.overflow = "";
            table.classList.remove("c-table--virtual");
          }
          // Pagination footer.
          if (usePaging) {
            const footer = this.ensure(".c-table__pagination", () => { const el = document.createElement("div"); el.className = "c-table__pagination"; return el; });
            footer.innerHTML = "";
            const prev = document.createElement("button");
            prev.className = "c-btn c-btn--ghost c-btn--sm";
            prev.type = "button";
            prev.textContent = "Previous";
            prev.disabled = page <= 1;
            prev.dataset.action = "prev";
            const info = document.createElement("span");
            info.textContent = `Page ${page} of ${totalPages}`;
            const next = document.createElement("button");
            next.className = "c-btn c-btn--ghost c-btn--sm";
            next.type = "button";
            next.textContent = "Next";
            next.disabled = page >= totalPages;
            next.dataset.action = "next";
            footer.appendChild(prev);
            footer.appendChild(info);
            footer.appendChild(next);
          } else {
            const footer = this.querySelector(".c-table__pagination");
            if (footer) footer.remove();
          }
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredTable) return;
      this._wiredTable = true;
      const handleSort = (th) => {
        const idx = Number(th.dataset.sortIndex);
        if (!Number.isFinite(idx)) return;
        if (this._sortCol === idx) {
          this._sortDir = (this._sortDir === 1) ? -1 : 1;
        } else {
          this._sortCol = idx;
          this._sortDir = 1;
        }
        this.dispatchEvent(new CustomEvent("contour:sort", { bubbles: true, composed: true, detail: { column: idx, direction: this._sortDir === 1 ? "ascending" : "descending" } }));
        this.requestRender();
      };
      this.addEventListener("click", (e) => {
        const retryBtn = e.target && e.target.closest ? e.target.closest('button[data-action="retry"]') : null;
        if (retryBtn && this.contains(retryBtn)) {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:retry", { detail: { src: this.getAttribute("src") }, bubbles: true, composed: true }));
          return;
        }
        const th = e.target && e.target.closest ? e.target.closest("th[aria-sort]") : null;
        if (th && this.contains(th)) {
          e.preventDefault();
          handleSort(th);
          return;
        }
          const btn = e.target && e.target.closest ? e.target.closest(".c-table__pagination button") : null;
        if (btn && this.contains(btn)) {
          e.preventDefault();
          const action = btn.dataset.action;
          let page = this._page !== null ? this._page : (parseInt(this.getAttribute("page") || "1", 10));
          if (!Number.isFinite(page) || page < 1) page = 1;
          if (action === "prev" && page > 1) page -= 1;
          if (action === "next") page += 1;
           this._page = page;
           this._pageAttrLast = String(page);
           // Reflect the page on the host so consumers can key off the attribute
           // (D-04). Marked internal so the resulting render preserves _page
           // instead of nulling it (B3-01).
           this._pageInternal = true;
           this.setAttribute("page", String(page));
           this.dispatchEvent(new CustomEvent("contour:page", { bubbles: true, composed: true, detail: { page } }));
          const persist = this.getAttribute("persist");
          if (persist === "storage" && this.id) { try { localStorage.setItem("contour-table:" + this.id, String(page)); } catch (e) {} }
          else if (persist === "url") { try { const url = new URL(window.location.href); url.searchParams.set("c-table", String(page)); window.history.replaceState(null, "", url.toString()); } catch (e) {} }
       }
       });
       this.addEventListener("keydown", (e) => {
         if (e.key !== "Enter" && e.key !== " ") return;
        const th = e.target && e.target.closest ? e.target.closest("th[aria-sort]") : null;
        if (th && this.contains(th)) {
          e.preventDefault();
          handleSort(th);
        }
      });
      // Column filter (F-09): re-render on filter input change.
      this.addEventListener("input", (e) => {
        const inp = e.target && e.target.closest ? e.target.closest(".c-table__filter-input") : null;
        if (!inp || !this.contains(inp)) return;
        const idx = Number(inp.dataset.filterIndex);
        if (!Number.isFinite(idx)) return;
        if (!this._filters) this._filters = {};
        this._filters[idx] = inp.value;
        this.requestRender();
      });
      this.addEventListener("scroll", (e) => {
        if (!this.hasAttribute("virtual") || !e.target || !e.target.classList || !e.target.classList.contains("c-table-wrap")) return;
        if (this._tableVirtualRaf) return;
        const run = () => { this._tableVirtualRaf = 0; this.requestRender(); };
        this._tableVirtualRaf = typeof requestAnimationFrame === "function" ? requestAnimationFrame(run) : setTimeout(run, 16);
      }, true);
      // Row selection (F-09): track checked rows and emit contour:select.
      this._selectedRows = this._selectedRows || new Set();
      this.addEventListener("change", (e) => {
        const cb = e.target && e.target.closest ? e.target.closest(".c-table__row-select") : null;
        if (cb && this.contains(cb)) {
          const idx = Number(cb.dataset.rowIndex);
          if (!Number.isFinite(idx)) return;
          if (cb.checked) this._selectedRows.add(idx); else this._selectedRows.delete(idx);
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { rows: Array.from(this._selectedRows) } }));
          return;
        }
        const all = e.target && e.target.closest ? e.target.closest(".c-table__select-all") : null;
        if (all && this.contains(all)) {
          const cbs = Array.from(this.querySelectorAll(".c-table__row-select"));
          cbs.forEach((c) => { c.checked = all.checked; });
          this._selectedRows = new Set(all.checked ? cbs.map((c) => Number(c.dataset.rowIndex)) : []);
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { rows: Array.from(this._selectedRows) } }));
        }
      });
      // Map-linked table (CARTO-inspired): emit contour:hover on row hover so a
      // consumer can highlight/zoom the corresponding feature on the map.
      // Contour stays engine-agnostic: it only announces the row.
      this.addEventListener("mouseover", (e) => {
        const tr = e.target && e.target.closest ? e.target.closest("tbody tr") : null;
        if (!tr || !this.contains(tr)) return;
        const idx = Number(tr.dataset.rowIndex);
        if (!Number.isFinite(idx)) return;
        if (this._hoveredRow === idx) return;
        this._hoveredRow = idx;
        this.dispatchEvent(new CustomEvent("contour:hover", { bubbles: true, composed: true, detail: { row: idx } }));
      });
      this.addEventListener("mouseout", (e) => {
        const tr = e.target && e.target.closest ? e.target.closest("tbody tr") : null;
        if (!tr || !this.contains(tr)) return;
        const related = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest("tbody tr") : null;
        if (related === tr) return;
        this._hoveredRow = null;
        this.dispatchEvent(new CustomEvent("contour:leave", { bubbles: true, composed: true, detail: {} }));
      });
      this.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const tr = e.target && e.target.closest ? e.target.closest("tbody tr") : null;
        if (!tr || !this.contains(tr)) return;
        e.preventDefault();
        const idx = Number(tr.dataset.rowIndex);
        if (!Number.isFinite(idx)) return;
        this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true, detail: { row: idx } }));
      });
    }
  }
  define("contour-table", ContourTable);
class ContourDataTable extends ContourTable {
    render() {
      super.render();
      this.classList.add("c-data-table");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Data table");
    }
  }
  define("contour-data-table", ContourDataTable);
/**
 * Chart: web component wrapper.
 * Attributes: `series`, `axis`, `empty`, `loading`, `error`, `retry`, `skeleton`, `zoomable`, `data-table`, `brush`, `brush-min`, `brush-max`, `brush-start`, `brush-end`.
 */
class ContourChart extends ContourBase {
    static get updateMode() { return "keyed"; }
  static get observed() { return ["series", "axis", "empty", "loading", "error", "retry", "skeleton", "zoomable", "data-table", "brush", "brush-min", "brush-max", "brush-start", "brush-end", "note"]; }
  static get properties() { return { series: { attribute: "series" }, axis: { attribute: "axis" }, zoomable: { attribute: "zoomable", type: Boolean }, brush: { attribute: "brush", type: Boolean }, note: { attribute: "note" } }; }
    render() {
      this.classList.add("c-chart");
      if (!this.hasAttribute("role")) this.setAttribute("role", "img");
      if (this.getAttribute("axis") && !this.hasAttribute("aria-label")) this.setAttribute("aria-label", this.getAttribute("axis"));
      if (this.hasAttribute("loading")) {
        const plot = this.ensure(".c-chart__plot", () => { const el = document.createElement("div"); el.className = "c-chart__plot"; return el; });
        plot.innerHTML = "";
        const loading = document.createElement("div");
        loading.className = "c-chart__loading";
        loading.textContent = this.getAttribute("loading") || "Loading…";
        loading.style.display = "grid";
        loading.style.placeItems = "center";
        loading.style.height = "100%";
        loading.style.color = "var(--color-text-muted)";
        plot.appendChild(loading);
        const axis = this.getAttribute("axis");
        if (axis) {
          const ax = this.ensure(".c-chart__axis", () => { const el = document.createElement("div"); el.className = "c-chart__axis"; return el; });
          ax.textContent = axis;
        }
        return;
      }
      if (this.hasAttribute("error")) {
        const plot = this.ensure(".c-chart__plot", () => { const el = document.createElement("div"); el.className = "c-chart__plot"; return el; });
        plot.innerHTML = "";
        const err = document.createElement("div");
        err.className = "c-chart__error";
        err.textContent = this.getAttribute("error") || "Error";
        err.style.display = "grid";
        err.style.placeItems = "center";
        err.style.height = "100%";
        err.style.color = "var(--color-danger, var(--color-text))";
        if (this.hasAttribute("retry")) {
          const btn = document.createElement("button");
          btn.className = "c-btn c-btn--ghost c-btn--sm";
          btn.type = "button";
          btn.textContent = this.getAttribute("retry") || "Retry";
          btn.dataset.action = "retry";
          btn.style.marginBlockStart = "var(--space-sm)";
          err.appendChild(btn);
        }
        plot.appendChild(err);
        const axis = this.getAttribute("axis");
        if (axis) {
          const ax = this.ensure(".c-chart__axis", () => { const el = document.createElement("div"); el.className = "c-chart__axis"; return el; });
          ax.textContent = axis;
        }
        return;
      }
      if (this.hasAttribute("skeleton")) {
        const plot = this.ensure(".c-chart__plot", () => { const el = document.createElement("div"); el.className = "c-chart__plot"; return el; });
        plot.innerHTML = "";
        const count = Math.min(5, Math.max(1, parseInt(this.getAttribute("skeleton") || "3", 10) || 3));
        for (let i = 0; i < count; i++) {
          const sk = document.createElement("div");
          sk.className = "c-skeleton";
          sk.style.display = "block";
          sk.style.inlineSize = "100%";
          sk.style.blockSize = "0.6rem";
          sk.style.marginBlockEnd = "var(--space-2xs)";
          plot.appendChild(sk);
        }
        const axis = this.getAttribute("axis");
        if (axis) {
          const ax = this.ensure(".c-chart__axis", () => { const el = document.createElement("div"); el.className = "c-chart__axis"; return el; });
          ax.textContent = axis;
        }
        return;
      }
      const axis = this.getAttribute("axis");
      if (axis) {
        const ax = this.ensure(".c-chart__axis", () => { const el = document.createElement("div"); el.className = "c-chart__axis"; return el; });
        ax.textContent = axis;
      } else {
        const ax = this.querySelector(".c-chart__axis");
        if (ax) ax.remove();
      }
const series = this.getAttribute("series");
       if (series) {
         let parsed = null;
         try {
           parsed = JSON.parse(series);
           const plot = this.ensure(".c-chart__plot", () => { const el = document.createElement("div"); el.className = "c-chart__plot"; return el; });
           plot.innerHTML = "";
           // Structured series: an item may carry `values` plus a `type`
           // ("donut" | "histogram" | "line") instead of a pre-computed `d`
           // path. The helpers in svg.mjs turn those into geometry so a
           // consumer does not have to hand-compute arc or bar math.
           const hasStructured = parsed.some((s) => s && Array.isArray(s.values));
           if (hasStructured) {
             parsed.forEach((s, i) => {
               const color = `var(--chart-${i + 1})`;
               if (s.type === "donut") {
                 const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                 svg.setAttribute("viewBox", "0 0 200 200");
                 svg.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%";
                 svg.setAttribute("aria-hidden", "true");
                  donutSlices(s.values).forEach((sl, si) => {
                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute("class", "c-chart__line");
                    path.setAttribute("data-series", String(i + 1));
                    path.style.setProperty("--c", color);
                    path.setAttribute("d", sl.path);
                    path.setAttribute("title", String(s.values[si]));
                    path.setAttribute("aria-label", "Series " + (i + 1) + ": " + String(s.values[si]));
                    path.setAttribute("role", "img");
                    svg.appendChild(path);
                  });
                 plot.appendChild(svg);
               } else if (s.type === "histogram") {
                 const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                 svg.setAttribute("viewBox", "0 0 300 120");
                 svg.setAttribute("preserveAspectRatio", "none");
                 svg.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%";
                  barRects(s.values).forEach((r, ri) => {
                    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    rect.setAttribute("class", "c-chart__bar");
                    rect.setAttribute("data-series", String(i + 1));
                    rect.style.setProperty("--c", color);
                    rect.setAttribute("x", r.x);
                    rect.setAttribute("y", r.y);
                    rect.setAttribute("width", r.width);
                     rect.setAttribute("height", r.height);
                      rect.setAttribute("title", String(s.values[ri]));
                      rect.setAttribute("aria-label", "Series " + (i + 1) + ": " + String(s.values[ri]));
                      rect.setAttribute("tabindex", "0");
                     rect.setAttribute("role", "button");
                     rect.dataset.index = String(ri);
                     svg.appendChild(rect);
                  });
                 plot.appendChild(svg);
               } else if (s.type === "scatter") {
                 const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                 svg.setAttribute("viewBox", "0 0 300 120");
                 svg.setAttribute("preserveAspectRatio", "none");
                 svg.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%";
                 const pts = (Array.isArray(s.values) ? s.values : []).map((v) => {
                   if (Array.isArray(v)) return { x: Number(v[0]) || 0, y: Number(v[1]) || 0 };
                   return { x: Number(v && v.x) || 0, y: Number(v && v.y) || 0 };
                 });
                 const xs = pts.map((p) => p.x);
                 const ys = pts.map((p) => p.y);
                 const minX = xs.length ? Math.min.apply(null, xs) : 0;
                 const maxX = xs.length ? Math.max.apply(null, xs) : 1;
                 const minY = ys.length ? Math.min.apply(null, ys) : 0;
                 const maxY = ys.length ? Math.max.apply(null, ys) : 1;
                 const xRange = (maxX - minX) || 1;
                 const yRange = (maxY - minY) || 1;
                 pts.forEach((p, pi) => {
                   const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                   circle.setAttribute("class", "c-chart__point");
                   circle.setAttribute("data-series", String(i + 1));
                   circle.setAttribute("data-index", String(pi));
                   circle.style.setProperty("--c", color);
                   const cx = ((p.x - minX) / xRange) * 300;
                   const cy = 120 - ((p.y - minY) / yRange) * 120;
                   circle.setAttribute("cx", cx.toFixed(2));
                   circle.setAttribute("cy", cy.toFixed(2));
                   circle.setAttribute("r", "3");
                   circle.setAttribute("tabindex", pi === 0 ? "0" : "-1");
                   circle.setAttribute("role", "button");
                   circle.setAttribute("title", p.x + ", " + p.y);
                   circle.setAttribute("aria-label", "Series " + (i + 1) + ": " + p.x + ", " + p.y);
                   svg.appendChild(circle);
                 });
                 plot.appendChild(svg);
               } else {
                 const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                 svg.setAttribute("viewBox", "0 0 300 120");
                 svg.setAttribute("preserveAspectRatio", "none");
                 svg.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%";
                 const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                 path.setAttribute("class", "c-chart__line");
                 path.setAttribute("data-series", String(i + 1));
                 path.style.setProperty("--c", color);
                 path.setAttribute("d", smoothPath(s.values));
                 svg.appendChild(path);
                 // Point markers for keyboard/click access.
                 const pts = polylinePoints(s.values).split(" ").map((p) => p.split(",").map(Number));
                 pts.forEach((pt, pi) => {
                   const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                   circle.setAttribute("class", "c-chart__point");
                   circle.setAttribute("data-series", String(i + 1));
                   circle.setAttribute("data-index", String(pi));
                   circle.style.setProperty("--c", color);
                   circle.setAttribute("cx", String(pt[0]));
                   circle.setAttribute("cy", String(pt[1]));
                   circle.setAttribute("r", "3");
                   circle.setAttribute("tabindex", pi === 0 ? "0" : "-1");
                   circle.setAttribute("role", "button");
                    circle.setAttribute("title", String(s.values[pi]));
                    circle.setAttribute("aria-label", "Series " + (i + 1) + ": " + String(s.values[pi]));
                   svg.appendChild(circle);
                 });
                 plot.appendChild(svg);
               }
             });
           } else {
             const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
             svg.setAttribute("viewBox", "0 0 300 120");
             svg.setAttribute("preserveAspectRatio", "none");
             svg.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%";
             svg.setAttribute("aria-hidden", "true");
             parsed.forEach((s, i) => {
               const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
               path.setAttribute("class", "c-chart__line");
               path.setAttribute("data-series", String(i + 1));
               path.style.setProperty("--c", `var(--chart-${i + 1})`);
               path.setAttribute("d", s.d || s);
               svg.appendChild(path);
             });
             plot.appendChild(svg);
           }
          } catch (e) { /* keep existing */ }
          // Styled tooltip element (positioned via --chart-tip-*).
          const tip = this.ensure(".c-chart__tooltip", () => { const el = document.createElement("div"); el.className = "c-chart__tooltip"; el.setAttribute("role", "tooltip"); el.setAttribute("hidden", ""); return el; });
          tip.setAttribute("hidden", "");
          // Accessible data-table fallback (R12-18): opt-in via `data-table`
          // attribute. Renders a visually-hidden table of the series values so
          // screen readers and no-JS consumers can read the data behind the
          // graphic. The graphic remains the primary presentation.
          if (this.hasAttribute("data-table")) {
            let table = this.querySelector(".c-chart__data-table");
            if (!table) {
              table = document.createElement("table");
              table.className = "c-chart__data-table visually-hidden";
              this.appendChild(table);
            }
            table.innerHTML = "";
            const thead = document.createElement("thead");
            const hr = document.createElement("tr");
            const h = document.createElement("th");
            h.textContent = "Series";
            hr.appendChild(h);
            const maxLen = parsed.reduce((m, s) => Math.max(m, Array.isArray(s.values) ? s.values.length : (Array.isArray(s) ? s.length : 0)), 0);
            for (let i = 0; i < maxLen; i++) {
              const th = document.createElement("th");
              th.textContent = "Value " + (i + 1);
              hr.appendChild(th);
            }
            thead.appendChild(hr);
            table.appendChild(thead);
            const tbody = document.createElement("tbody");
            parsed.forEach((s, si) => {
              const vals = Array.isArray(s.values) ? s.values : (Array.isArray(s) ? s : []);
              const tr = document.createElement("tr");
              const td0 = document.createElement("td");
              td0.textContent = s.label || ("Series " + (si + 1));
              tr.appendChild(td0);
              for (let i = 0; i < maxLen; i++) {
                const td = document.createElement("td");
                td.textContent = vals[i] != null ? String(vals[i]) : "";
                tr.appendChild(td);
              }
              tbody.appendChild(tr);
            });
            table.appendChild(tbody);
          } else {
            const old = this.querySelector(".c-chart__data-table");
            if (old) old.remove();
          }
            if (this.hasAttribute("brush")) {
              const brush = this.ensure("contour-brush", () => document.createElement("contour-brush"));
              brush.setAttribute("min", this.getAttribute("brush-min") || "0");
              brush.setAttribute("max", this.getAttribute("brush-max") || "100");
              brush.setAttribute("start", this.getAttribute("brush-start") || this.getAttribute("brush-min") || "0");
              brush.setAttribute("end", this.getAttribute("brush-end") || this.getAttribute("brush-max") || "100");
              if (brush.previousElementSibling !== plot) this.appendChild(brush);
            } else {
              const brush = this.querySelector("contour-brush");
              if (brush) brush.remove();
            }
            const note = this.getAttribute("note");
            let noteEl = this.querySelector(".c-chart__note");
            if (note) {
              if (!noteEl) { noteEl = document.createElement("div"); noteEl.className = "c-chart__note"; this.appendChild(noteEl); }
              noteEl.textContent = note;
            } else if (noteEl) {
              noteEl.remove();
            }
         } else {
         const plot = this.ensure(".c-chart__plot", () => { const el = document.createElement("div"); el.className = "c-chart__plot"; return el; });
         plot.innerHTML = "";
         const empty = document.createElement("div");
         empty.className = "c-chart__empty";
         empty.textContent = this.getAttribute("empty") || "No data";
         empty.style.display = "grid";
         empty.style.placeItems = "center";
         empty.style.height = "100%";
         empty.style.color = "var(--color-text-muted)";
         plot.appendChild(empty);
         const note = this.getAttribute("note");
         let noteEl2 = this.querySelector(".c-chart__note");
         if (note) {
           if (!noteEl2) { noteEl2 = document.createElement("div"); noteEl2.className = "c-chart__note"; this.appendChild(noteEl2); }
           noteEl2.textContent = note;
         } else if (noteEl2) {
           noteEl2.remove();
         }
       }
     }
    enhance() {
      if (this._wiredChart) return;
      this._wiredChart = true;
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      // Series toggle responding to legend (F-10): hide/show series when a
      // legend item is toggled.
      this.addEventListener("contour:legend-toggle", (e) => {
        const key = e && e.detail && (e.detail.key || e.detail.label);
        const pressed = e && e.detail && e.detail.pressed;
        if (key == null) return;
        const nodes = this.querySelectorAll("[data-series]");
        nodes.forEach((n) => {
          const s = n.getAttribute("data-series");
          if (String(s) === String(key) || n.getAttribute("data-key") === String(key)) {
            n.style.display = pressed === false ? "none" : "";
          }
        });
      });
      this.addEventListener("contour:brush-end", (e) => {
        if (!this.hasAttribute("brush") || !e.target || !e.target.matches("contour-brush")) return;
        this.dispatchEvent(new CustomEvent("contour:select", {
          bubbles: true,
          composed: true,
          detail: e.detail,
        }));
      });
      // Zoom/pan (F-10 deferred): wheel to zoom, drag to pan, double-click to reset.
      if (this.hasAttribute("zoomable")) {
        let zoom = 1, panX = 0, panY = 0;
        const plot = this.querySelector(".c-chart__plot");
        const apply = () => {
          if (!plot) return;
          plot.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
          plot.style.transformOrigin = "center center";
        };
        this.addEventListener("wheel", (e) => {
          e.preventDefault();
          const factor = e.deltaY < 0 ? 1.1 : 0.9;
          zoom = Math.min(5, Math.max(0.5, zoom * factor));
          apply();
        }, { passive: false });
        let dragging = false, startX = 0, startY = 0, startPanX = 0, startPanY = 0;
        this.addEventListener("mousedown", (e) => {
          if (e.button !== 0) return;
          dragging = true; startX = e.clientX; startY = e.clientY; startPanX = panX; startPanY = panY;
          this.style.cursor = "grabbing";
        });
        const onMove = (e) => {
          if (!dragging) return;
          panX = startPanX + (e.clientX - startX);
          panY = startPanY + (e.clientY - startY);
          apply();
        };
        const onUp = () => { if (dragging) { dragging = false; this.style.cursor = ""; } };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        onDispose(this, () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); });
        this.addEventListener("dblclick", () => { zoom = 1; panX = 0; panY = 0; apply(); });
      }
      // Tooltip: show on hover of a mark.
      // Cache the plot rect across mousemove events: it only changes on
      // resize/scroll, so re-measuring it on every pixel of movement is
      // wasted layout work (B3-22). A ResizeObserver invalidates the cache;
      // scroll invalidates via the same observer-less fallback (recompute).
      let plotRectCache = null;
      let plotRectObserver = null;
      const invalidatePlotRect = () => { plotRectCache = null; };
      const showTip = (e) => {
        const plot = this.querySelector(".c-chart__plot");
        const tip = this.querySelector(".c-chart__tooltip");
        if (!plot || !tip) return;
        const mark = e.target && e.target.closest ? e.target.closest(".c-chart__bar, .c-chart__point, .c-chart__line") : null;
        if (!mark || !plot.contains(mark)) { tip.setAttribute("hidden", ""); return; }
        const title = mark.getAttribute("title");
        if (title) tip.textContent = title;
        if (!plotRectCache) {
          plotRectCache = plot.getBoundingClientRect();
          if (!plotRectObserver && typeof ResizeObserver === "function") {
            plotRectObserver = new ResizeObserver(invalidatePlotRect);
            plotRectObserver.observe(plot);
          }
        }
        const rect = plotRectCache;
        const mr = mark.getBoundingClientRect();
        const x = mr.left - rect.left + mr.width / 2;
        const y = mr.top - rect.top;
        plot.style.setProperty("--chart-tip-inline-start", x + "px");
        plot.style.setProperty("--chart-tip-block-start", y + "px");
        tip.removeAttribute("hidden");
      };
      const hideTip = () => {
        const tip = this.querySelector(".c-chart__tooltip");
        if (tip) tip.setAttribute("hidden", "");
      };
      // Host-delegated so the handlers survive re-renders (rule 12).
      this.addEventListener("mousemove", showTip);
      this.addEventListener("mouseleave", hideTip);
      onDispose(this, () => { if (plotRectObserver) { plotRectObserver.disconnect(); plotRectObserver = null; } });
      // Keyboard path (BY-39): the marks already carry roving tabindex, so a
      // focused mark shows the same tooltip as a hovered one.
      this.addEventListener("focusin", (e) => {
        const mark = e.target && e.target.closest ? e.target.closest(".c-chart__bar, .c-chart__point, .c-chart__line") : null;
        if (mark && this.contains(mark)) showTip({ target: mark });
      });
      this.addEventListener("focusout", (e) => {
        if (!this.contains(e.relatedTarget)) hideTip();
      });
      // Per-bar keyboard/click handling for histogram bars (host-delegated).
      this.addEventListener("click", (e) => {
        const plot2 = this.querySelector(".c-chart__plot");
        if (!plot2) return;
        const bar = e.target && e.target.closest ? e.target.closest(".c-chart__bar") : null;
        if (bar && plot2.contains(bar)) {
            const series = parseInt(bar.getAttribute("data-series") || "1", 10);
            const index = parseInt(bar.dataset.index || "0", 10);
            this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series, index } }));
            return;
          }
          const point = e.target && e.target.closest ? e.target.closest(".c-chart__point") : null;
          if (point && plot2.contains(point)) {
            const series = parseInt(point.getAttribute("data-series") || "1", 10);
            const index = parseInt(point.dataset.index || "0", 10);
            this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series, index } }));
          }
        });
        this.addEventListener("keydown", (e) => {
          const plot2 = this.querySelector(".c-chart__plot");
          if (!plot2) return;
          const bar = e.target && e.target.closest ? e.target.closest(".c-chart__bar") : null;
          if (bar && plot2.contains(bar)) {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              const series = parseInt(bar.getAttribute("data-series") || "1", 10);
              const index = parseInt(bar.dataset.index || "0", 10);
              this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series, index } }));
            }
            return;
          }
          const point = e.target && e.target.closest ? e.target.closest(".c-chart__point") : null;
          if (point && plot2.contains(point)) {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              const series = parseInt(point.getAttribute("data-series") || "1", 10);
              const index = parseInt(point.dataset.index || "0", 10);
              this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series, index } }));
            } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              const points = Array.from(plot2.querySelectorAll('.c-chart__point[data-series="' + point.getAttribute("data-series") + '"]'));
              const idx = points.indexOf(point);
              const next = e.key === "ArrowRight" ? Math.min(idx + 1, points.length - 1) : Math.max(idx - 1, 0);
              if (next !== idx && points[next]) {
                points.forEach((p, i) => p.setAttribute("tabindex", i === next ? "0" : "-1"));
                try { points[next].focus(); } catch (err) {}
              }
            }
          }
       });
      this.addEventListener("keydown", (e) => {
        // Only the host itself drives series switching; marks handle their own
        // keys (B3-03). Without this gate one Enter fires contour:select twice.
        if (e.target !== this) return;
        let seriesCount = 0;
        try { seriesCount = JSON.parse(this.getAttribute("series") || "[]").length; } catch (e) { seriesCount = 0; }
        if (seriesCount === 0) return;
        if (this._activeSeries === undefined) this._activeSeries = 0;
        let next = this._activeSeries;
        const rtl = (this.getAttribute("dir") || document.documentElement.getAttribute("dir") || "").toLowerCase() === "rtl";
        if (e.key === "ArrowRight") next = rtl ? Math.max(this._activeSeries - 1, 0) : Math.min(this._activeSeries + 1, seriesCount - 1);
        else if (e.key === "ArrowLeft") next = rtl ? Math.min(this._activeSeries + 1, seriesCount - 1) : Math.max(this._activeSeries - 1, 0);
        else if (e.key === "ArrowDown") next = Math.min(this._activeSeries + 1, seriesCount - 1);
        else if (e.key === "ArrowUp") next = Math.max(this._activeSeries - 1, 0);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = seriesCount - 1;
        else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series: this._activeSeries } }));
          return;
        } else return;
        if (next !== this._activeSeries) {
          e.preventDefault();
          this._activeSeries = next;
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series: next } }));
        }
      });
    }
  }
  define("contour-chart", ContourChart);
/**
 * Comparison: web component wrapper.
 * Attributes: `divider`, `value`, `before`, `after`.
 */
class ContourComparison extends ContourBase {
    static get observed() { return ["divider", "value", "before", "after"]; }
    static get properties() { return { divider: { attribute: "divider" }, value: { attribute: "value" }, before: { attribute: "before" }, after: { attribute: "after" } }; }
    render() {
      this.classList.add("c-comparison");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Comparison");
      if (!this.style.blockSize) this.style.blockSize = "12rem";
      this.style.setProperty("--comparison-pos", (this.getAttribute("value") || "50") + "%");
      // Ensure two panes exist.
      const beforeLabel = this.getAttribute("before") || "Before";
      const afterLabel = this.getAttribute("after") || "After";
      if (!this.querySelector(".c-comparison__pane--before")) {
        const p = document.createElement("div");
        p.className = "c-comparison__pane c-comparison__pane--before";
        p.textContent = beforeLabel;
        this.appendChild(p);
      } else {
        const p = this.querySelector(".c-comparison__pane--before");
        if (p) p.textContent = beforeLabel;
      }
      if (!this.querySelector(".c-comparison__pane:not(.c-comparison__pane--before)")) {
        const p = document.createElement("div");
        p.className = "c-comparison__pane";
        p.textContent = afterLabel;
        this.appendChild(p);
      } else {
        const p = this.querySelector(".c-comparison__pane:not(.c-comparison__pane--before)");
        if (p) p.textContent = afterLabel;
      }
      const divider = this.getAttribute("divider");
      if (divider !== null) {
        const d = this.ensure(".c-comparison__divider", () => { const el = document.createElement("div"); el.className = "c-comparison__divider"; el.setAttribute("role", "separator"); el.setAttribute("aria-orientation", "vertical"); el.setAttribute("tabindex", "0"); return el; });
        if (divider) d.textContent = divider;
      } else {
        const d = this.querySelector(".c-comparison__divider");
        if (d) d.remove();
      }
    }
    enhance() {
      if (this._wiredComparison) return;
      this._wiredComparison = true;
      const divider = () => this.querySelector(".c-comparison__divider");
      const setPos = (pct) => {
        const clamped = Math.max(0, Math.min(100, pct));
        this.style.setProperty("--comparison-pos", clamped + "%");
        this.setAttribute("value", String(Math.round(clamped)));
        this.dispatchEvent(new CustomEvent("contour:drag", { bubbles: true, composed: true, detail: { value: clamped } }));
      };
      let dragging = false;
      const onMove = (e) => {
        if (!dragging) return;
        const rect = this.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        setPos(pct);
      };
      const onUp = () => { dragging = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
      onDispose(this, () => { dragging = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); });
      this.addEventListener("mousedown", (e) => {
        const d = divider();
        if (!d || !d.contains(e.target)) return;
        dragging = true;
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        e.preventDefault();
      });
      this.addEventListener("keydown", (e) => {
        const d = divider();
        if (!d || document.activeElement !== d) return;
        const cur = parseFloat(this.style.getPropertyValue("--comparison-pos")) || 50;
        if (e.key === "ArrowLeft") { e.preventDefault(); setPos(cur - 5); }
        else if (e.key === "ArrowRight") { e.preventDefault(); setPos(cur + 5); }
      });
    }
  }
  define("contour-comparison", ContourComparison);
/**
 * Streaming Chart: web component wrapper.
 * Attributes: `line`, `dot`, `interval`, `pause`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourStreamingChart extends ContourBase {
    static get updateMode() { return "keyed"; }
    static get observed() { return ["line", "dot", "interval", "pause", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { line: { attribute: "line" }, dot: { attribute: "dot" }, interval: { attribute: "interval", type: Number }, pause: { attribute: "pause", type: Boolean }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-streaming-chart");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Streaming chart");
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      wireStates(this);
      loadRemote(this, "line");
      if (renderStates(this, "streaming-chart")) return;
      const line = remoteData(this, "line");
      const dot = remoteData(this, "dot");
      if (!line) {
        const svg = this.querySelector("svg");
        if (svg) svg.remove();
        renderEmpty(this, "streaming-chart");
        return;
      }
      if (line) {
        let svg = this.querySelector("svg");
        if (!svg) {
          svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("viewBox", "0 0 300 192");
          svg.setAttribute("aria-hidden", "true");
          this.appendChild(svg);
        }
        let path = svg.querySelector(".c-streaming-chart__line");
        if (!path) {
          path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("class", "c-streaming-chart__line");
          svg.appendChild(path);
        }
        path.setAttribute("d", line);
        if (dot) {
          let circle = svg.querySelector(".c-streaming-chart__live-dot");
          if (!circle) {
            circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("class", "c-streaming-chart__live-dot");
            circle.setAttribute("r", "4");
            svg.appendChild(circle);
          }
          const parts = dot.split(/[ ,]+/);
          if (parts.length >= 2) {
            circle.setAttribute("cx", parts[0]);
            circle.setAttribute("cy", parts[1]);
          }
        }
      }
    }
    enhance() {
      // Stream cadence (BY-40). The layer had no timer at all — the literal
      // gap the row names — so the chart gets its own `interval` loop rather
      // than a second clock inside the loader. Each tick emits contour:tick
      // and, when a src is present, re-validates through the loader's own
      // cache path (remoteInvalidate + requestRender — the two steps the
      // loader's refresh tick performs), so the shared cache and abort
      // semantics stay the loader's. The loader's `refresh` attribute is NOT
      // written here: an attribute a component writes to itself must never be
      // observed, or the write re-enters render (measured by the gate).
      // `pause` stops the loop; `interval` growth is clamped to the loader's
      // own 1 s floor so the two cannot disagree.
      const sync = () => {
        const seconds = parseFloat(this.getAttribute("interval") || "");
        const want = Number.isFinite(seconds) && seconds > 0 && !this.hasAttribute("pause") && !this._streamPausedByUser && this._viewVisible !== false;
        if (want === this._streamRunning) return;
        this._streamRunning = want;
        if (this._streamTimer !== undefined) { clearInterval(this._streamTimer); this._streamTimer = undefined; }
        this.dispatchEvent(new CustomEvent("contour:stream-state", { detail: { running: want }, bubbles: true, composed: true }));
        if (!want) return;
        this._streamTimer = setInterval(() => {
          if (!this.isConnected || this.hasAttribute("pause")) return;
          this._streamFrame += 1;
          this.dispatchEvent(new CustomEvent("contour:tick", { detail: { frame: this._streamFrame }, bubbles: true, composed: true }));
          const src = this.getAttribute("src");
          if (src) { remoteInvalidate(src); this.requestRender(); }
        }, Math.max(1000, seconds * 1000));
      };
      sync();
      // Pause the stream while the chart is off-screen (B3-22): watchViewport
      // is the loader's own visibility seam, so the stream reuses it instead of
      // a second observer. A user-set `pause` still wins; this only adds an
      // off-screen pause on top.
      if (!this._wiredStreamView) {
        this._wiredStreamView = true;
        this._viewVisible = true;
        watchViewport(this);
        this.addEventListener("contour:view-enter", () => { this._viewVisible = true; sync(); });
        this.addEventListener("contour:view-leave", () => { this._viewVisible = false; sync(); });
      }
      // The base re-runs enhance after every render, so interval/pause changes
      // are picked up by sync() above; the timer itself is owned exactly once.
      if (this._wiredStream) return;
      this._wiredStream = true;
      this._streamFrame = 0;
      onDispose(this, () => { if (this._streamTimer !== undefined) { clearInterval(this._streamTimer); this._streamTimer = undefined; } });
      // Keyboard: Space/Enter toggles pause (BY-08 keyboard contract).
      // Uses an internal flag so the toggle does not re-enter render.
      this._streamPausedByUser = false;
      this.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          this._streamPausedByUser = !this._streamPausedByUser;
          if (this._streamPausedByUser) this.setAttribute("data-user-paused", "");
          else this.removeAttribute("data-user-paused");
          sync();
        }
      });
    }
  }
define("contour-streaming-chart", ContourStreamingChart);
/**
 * Meter: web component wrapper.
 * Attributes: `value`, `label`, `variant`, `min`, `max`, `low`, `high`, `optimum`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourMeter extends ContourBase {
    static get observed() { return ["value", "label", "variant", "min", "max", "low", "high", "optimum", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { value: { attribute: "value" }, label: { attribute: "label" }, variant: { attribute: "variant" }, min: { attribute: "min" }, max: { attribute: "max" }, low: { attribute: "low" }, high: { attribute: "high" }, optimum: { attribute: "optimum" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-meter");
      wireStates(this);
      loadRemote(this, ["value", "label"]);
      if (renderStates(this, "meter")) return;
      const rValue = remoteData(this, "value") || (this._remoteData && this._remoteData.value);
      const label = remoteData(this, "label") || (this._remoteData && this._remoteData.label) || "";
      const variant = this.getAttribute("variant");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-meter--")) this.classList.remove(c); });
      if (variant) this.classList.add("c-meter--" + variant);
      if (!rValue && !label) {
        renderEmpty(this, "meter");
        return;
      }
       if (rValue === null) {
         this.style.removeProperty("--meter-value");
       } else {
         const num = parseFloat(rValue);
         if (Number.isFinite(num)) this.style.setProperty("--meter-value", rValue);
         else this.style.removeProperty("--meter-value");
       }
      const core = this.ensure(".c-meter__core", () => { const el = document.createElement("span"); el.className = "c-meter__core"; return el; });
      let val = core.querySelector(".c-meter__value");
      if (!val) { val = document.createElement("span"); val.className = "c-meter__value"; core.appendChild(val); }
      const num = parseFloat(rValue);
      val.textContent = (Number.isFinite(num) ? Math.round(num * 100) : 0) + "%";
      if (label) {
        const lbl = core.querySelector(".c-meter__label") || (() => { const el = document.createElement("span"); el.className = "c-meter__label"; core.appendChild(el); return el; })();
        lbl.textContent = label;
      }
       if (!this.hasAttribute("role")) this.setAttribute("role", "meter");
       if (label && !this.hasAttribute("aria-label")) this.setAttribute("aria-label", label);
      const ariaValue = rValue === null ? "0" : rValue;
      const prevVal = this._meterAriaValue;
      if (!this.hasAttribute("aria-valuenow") || this.getAttribute("aria-valuenow") === prevVal) {
        this.setAttribute("aria-valuenow", ariaValue);
        this._meterAriaValue = ariaValue;
      }
      const min = this.getAttribute("min");
      const max = this.getAttribute("max");
      if (min !== null) this.setAttribute("aria-valuemin", min);
      else if (!this.hasAttribute("aria-valuemin")) this.setAttribute("aria-valuemin", "0");
      if (max !== null) this.setAttribute("aria-valuemax", max);
      else if (!this.hasAttribute("aria-valuemax")) this.setAttribute("aria-valuemax", "1");
      for (const a of ["low", "high", "optimum"]) {
        const v = this.getAttribute(a);
        if (v !== null) this.setAttribute("data-" + a, v);
        else this.removeAttribute("data-" + a);
      }
    }
  }
define("contour-meter", ContourMeter);
/**
 * Delta: web component wrapper.
 * Attributes: `value`, `direction`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourDelta extends ContourBase {
    static get observed() { return ["value", "direction", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { value: { attribute: "value" }, direction: { attribute: "direction" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-delta");
      wireStates(this);
      loadRemote(this, "value");
      if (renderStates(this, "delta")) return;
      const value = remoteData(this, "value") || "";
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-delta--")) this.classList.remove(c); });
      const direction = this.getAttribute("direction") || (this._remoteData && this._remoteData.direction) || "up";
      if (!value) {
        renderEmpty(this, "delta");
        return;
      }
      this.classList.add("c-delta--" + direction);
      const icon = { up: "#i-arrow-up", down: "#i-arrow-down", flat: "#i-minus" }[direction] || "#i-arrow-up";
      this.querySelectorAll("svg").forEach((s) => s.remove());
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("aria-hidden", "true");
      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute("href", icon);
      svg.appendChild(use);
      this.appendChild(svg);
      this.appendChild(document.createTextNode(" " + value));
    }
  }
define("contour-delta", ContourDelta);
/**
 * Stat: web component wrapper.
 * Attributes: `value`, `label`, `delta`, `unit`, `format`, `locale`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourStat extends ContourBase {
    static get observed() { return ["value", "label", "delta", "unit", "format", "locale", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { value: { attribute: "value" }, label: { attribute: "label" }, delta: { attribute: "delta" }, unit: { attribute: "unit" }, format: { attribute: "format" }, locale: { attribute: "locale" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-stat");
      wireStates(this);
      loadRemote(this, ["value", "label"]);
      if (renderStates(this, "stat")) return;
      const value = remoteData(this, "value");
      const label = remoteData(this, "label");
      const delta = this.getAttribute("delta");
      if (value) {
        const v = this.ensure(".c-stat__value", () => { const el = document.createElement("div"); el.className = "c-stat__value"; el.setAttribute("aria-live", "polite"); return el; });
        v.textContent = formatValue(value, this.getAttribute("format"), this.getAttribute("locale"), this.getAttribute("unit"));
      } else {
        const v = this.querySelector(".c-stat__value");
        if (v) v.remove();
      }
      if (label) {
        const l = this.ensure(".c-stat__label", () => { const el = document.createElement("div"); el.className = "c-stat__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-stat__label");
        if (l) l.remove();
      }
      if (delta) {
        const d = this.ensure(".c-stat__delta", () => { const el = document.createElement("div"); el.className = "c-stat__delta"; return el; });
        d.textContent = delta;
      } else {
        const d = this.querySelector(".c-stat__delta");
        if (d) d.remove();
      }
      const unit = this.getAttribute("unit");
      const v = this.querySelector(".c-stat__value");
      if (v) {
        if (unit) {
          let u = v.querySelector(".c-stat__unit");
          if (!u) { u = document.createElement("span"); u.className = "c-stat__unit"; v.appendChild(u); }
          u.textContent = unit;
        } else {
          const u = v.querySelector(".c-stat__unit");
          if (u) u.remove();
        }
      }
      if (!value && !label) {
        renderEmpty(this, "stat");
      }
    }
  }
define("contour-stat", ContourStat);
/**
 * Gauge: web component wrapper.
 * Attributes: `value`, `min`, `max`, `heading`, `thresholds`, `format`, `locale`, `unit`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`, `brownout`, `brownout-level`, `no-data-message`, `show-header`, `description`.
 */
class ContourGauge extends ContourBase {
    static get observed() { return ["value", "min", "max", "heading", "thresholds", "format", "locale", "unit", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "brownout", "brownout-level", "no-data-message", "show-header", "description"]; }
    static get properties() { return { value: { attribute: "value" }, min: { attribute: "min" }, max: { attribute: "max" }, heading: { attribute: "heading" }, thresholds: { attribute: "thresholds" }, format: { attribute: "format" }, locale: { attribute: "locale" }, unit: { attribute: "unit" }, src: { attribute: "src" }, brownout: { attribute: "brownout" } }; }
    render() {
      this.classList.add("c-gauge");
      wireStates(this);
      loadRemote(this, ["value"]);
      if (renderStates(this, "gauge")) return;
      const rawValue = this.getAttribute("value");
      const num = parseFloat(rawValue);
      const hasValue = rawValue !== null && rawValue !== "" && Number.isFinite(num);
      const min = parseFloat(this.getAttribute("min") || "0");
      const max = parseFloat(this.getAttribute("max") || "100");
      const heading = this.getAttribute("heading");
      const showHeader = this.getAttribute("show-header") !== "false";
      const description = this.getAttribute("description");
      const noDataMessage = this.getAttribute("no-data-message") || "No readings in view";
      const brownoutLevel = this.brownoutLevel();
      // empty state
      if (!hasValue) {
        if (heading && showHeader) {
          const t = this.ensure(".c-gauge__title", () => { const el = document.createElement("div"); el.className = "c-gauge__title"; return el; });
          t.textContent = heading;
        }
        const empty = this.ensure(".c-gauge__empty", () => { const el = document.createElement("div"); el.className = "c-gauge__empty"; el.setAttribute("part", "empty"); return el; });
        empty.textContent = noDataMessage;
        // remove dial/value/band if present
        [".c-gauge__dial", ".c-gauge__value", ".c-gauge__band"].forEach((sel) => { const n = this.querySelector(sel); if (n) n.remove(); });
        return;
      }
      // heading
      if (heading && showHeader) {
        const t = this.ensure(".c-gauge__title", () => { const el = document.createElement("div"); el.className = "c-gauge__title"; el.setAttribute("part", "title"); return el; });
        t.textContent = heading;
      } else {
        const t = this.querySelector(".c-gauge__title"); if (t) t.remove();
      }
      // thresholds
      let thresholds = [];
      const tAttr = this.getAttribute("thresholds");
      if (tAttr) { try { thresholds = JSON.parse(tAttr); } catch (e) { thresholds = []; } }
      // band determination
      let band = null;
      if (thresholds && thresholds.length) {
        // thresholds sorted ascending by value
        const sorted = [...thresholds].sort((a, b) => (a.value || 0) - (b.value || 0));
        for (let i = sorted.length - 1; i >= 0; i--) {
          if (num >= (sorted[i].value || 0)) { band = sorted[i]; break; }
        }
      }
      // dial (unless brownout >= 3)
      const shedDial = this.shed("dial", 3);
      let dial = this.querySelector(".c-gauge__dial");
      if (shedDial) {
        if (dial) dial.remove();
      } else {
        if (!dial) {
          dial = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          dial.setAttribute("class", "c-gauge__dial");
          dial.setAttribute("part", "dial");
          dial.setAttribute("aria-hidden", "true");
          dial.setAttribute("viewBox", "0 0 100 100");
          this.appendChild(dial);
        }
        // rebuild dial content
        dial.innerHTML = "";
        // track arc (semicircle)
        const track = document.createElementNS("http://www.w3.org/2000/svg", "path");
        track.setAttribute("class", "c-gauge__track");
        track.setAttribute("d", "M 10 90 A 40 40 0 0 1 90 90");
        dial.appendChild(track);
        // zones: each threshold defines a band from its value to the next
        // threshold's value (or max), drawn as an arc along the track so the
        // bands no longer stack on top of one another.
        if (thresholds && thresholds.length) {
          const sorted = [...thresholds].sort((a, b) => (a.value || 0) - (b.value || 0));
          const toPoint = (v) => {
            const pos = (1 - (v - min) / (max - min || 1)) * Math.PI;
            return { x: 50 + 40 * Math.cos(pos), y: 90 - 40 * Math.sin(pos) };
          };
          for (let i = 0; i < sorted.length; i++) {
            const v1 = sorted[i].value || 0;
            const v2 = (i + 1 < sorted.length) ? (sorted[i + 1].value || max) : max;
            const p1 = toPoint(v1);
            const p2 = toPoint(v2);
            const z = document.createElementNS("http://www.w3.org/2000/svg", "path");
            z.setAttribute("class", "c-gauge__zone");
            z.setAttribute("stroke", sorted[i].color || "var(--color-primary)");
            z.setAttribute("d", "M " + p1.x.toFixed(2) + " " + p1.y.toFixed(2) + " A 40 40 0 0 1 " + p2.x.toFixed(2) + " " + p2.y.toFixed(2));
            dial.appendChild(z);
          }
        }
        // needle (pivot at dial centre 50,90; 0 -> left, 100 -> right)
        const ratio = (num - min) / (max - min || 1);
        const angle = Math.PI * (1 - ratio);
        const needle = document.createElementNS("http://www.w3.org/2000/svg", "line");
        needle.setAttribute("class", "c-gauge__needle needle");
        needle.setAttribute("x1", "50"); needle.setAttribute("y1", "90");
        needle.setAttribute("x2", String(50 + 35 * Math.cos(angle)));
        needle.setAttribute("y2", String(90 - 35 * Math.sin(angle)));
        dial.appendChild(needle);
        const hub = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        hub.setAttribute("class", "c-gauge__hub hub");
        hub.setAttribute("cx", "50"); hub.setAttribute("cy", "90"); hub.setAttribute("r", "4");
        dial.appendChild(hub);
      }
      // value element (meter)
      const valueEl = this.ensure(".c-gauge__value", () => { const el = document.createElement("div"); el.className = "c-gauge__value"; el.setAttribute("part", "value"); return el; });
      valueEl.textContent = formatValue(String(num), this.getAttribute("format"), this.getAttribute("locale")) + (this.getAttribute("unit") ? " " + this.getAttribute("unit") : "");
      valueEl.setAttribute("role", "meter");
      valueEl.setAttribute("aria-valuenow", String(num));
      valueEl.setAttribute("aria-valuemin", String(min));
      valueEl.setAttribute("aria-valuemax", String(max));
      if (heading) {
        // labelledby
        if (!valueEl.id) valueEl.id = contourId("gauge-value");
      }
      if (band) {
        valueEl.setAttribute("aria-valuetext", num + ", " + (band.label || (">= " + band.value)));
      } else {
        valueEl.setAttribute("aria-valuetext", String(num));
      }
      // aria-labelledby / aria-label
      const titleEl = this.querySelector(".c-gauge__title");
      if (titleEl) {
        if (!titleEl.id) titleEl.id = contourId("gauge-title");
        valueEl.setAttribute("aria-labelledby", titleEl.id);
        valueEl.removeAttribute("aria-label");
      } else {
        valueEl.removeAttribute("aria-labelledby");
        if (heading) valueEl.setAttribute("aria-label", heading);
      }
      // band word
      const bandEl = this.querySelector(".c-gauge__band");
      if (band) {
        const b = this.ensure(".c-gauge__band", () => { const el = document.createElement("div"); el.className = "c-gauge__band"; el.setAttribute("part", "band"); return el; });
        b.textContent = band.label || (">= " + band.value);
      } else {
        if (bandEl) bandEl.remove();
      }
      // description
      if (description) {
        let d = this.querySelector(".c-gauge__desc");
        if (!d) { d = document.createElement("div"); d.className = "c-gauge__desc"; this.appendChild(d); }
        d.textContent = description;
      }
    }
    enhance() {}
  }
define("contour-gauge", ContourGauge);
/**
 * Axis: web component wrapper.
 * Attributes: `orientation`, `values`, `ticks`, `format`, `locale`, `padding`, `min`, `max`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourAxis extends ContourBase {
    static get observed() { return ["orientation", "values", "ticks", "format", "locale", "padding", "min", "max", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { orientation: { attribute: "orientation" }, values: { attribute: "values" }, ticks: { attribute: "ticks" }, format: { attribute: "format" }, locale: { attribute: "locale" }, padding: { attribute: "padding" }, min: { attribute: "min" }, max: { attribute: "max" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-axis");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Axis");
      const orientation = this.getAttribute("orientation") || "horizontal";
      this.classList.toggle("c-axis--horizontal", orientation === "horizontal");
      this.classList.toggle("c-axis--vertical", orientation === "vertical");
      if (orientation === "horizontal") this.setAttribute("part", "axis-x");
      else this.setAttribute("part", "axis-y");
      wireStates(this);
      loadRemote(this, ["values"]);
      if (renderStates(this, "axis")) return;
      // parse values
      let values = [];
      const vAttr = this.getAttribute("values");
      if (vAttr) { try { values = JSON.parse(vAttr); } catch (e) { values = vAttr.split(",").map((x) => x.trim()); } }
      const ticks = parseInt(this.getAttribute("ticks") || "0", 10) || values.length;
      // Slotted content support: authored .c-axis__tick children take
      // precedence over the JSON `values` attribute.
      const authoredTicks = Array.from(this.querySelectorAll(":scope > .c-axis__tick"));
      if (authoredTicks.length) {
        // keep authored ticks, just ensure labels are formatted
        authoredTicks.forEach((tick) => {
          const label = tick.querySelector(".c-axis__label");
          if (label && !label.textContent) label.textContent = tick.textContent;
        });
      } else {
        // clear
        Array.from(this.querySelectorAll(".c-axis__tick")).forEach((n) => n.remove());
        const list = values.length ? values : Array.from({ length: ticks }, (_, i) => i);
        list.forEach((v) => {
          const tick = document.createElement("span");
          tick.className = "c-axis__tick";
          const label = document.createElement("span");
          label.className = "c-axis__label";
          label.textContent = formatValue(String(v), this.getAttribute("format"), this.getAttribute("locale"));
          tick.appendChild(label);
          this.appendChild(tick);
        });
      }
    }
    enhance() {}
  }
define("contour-axis", ContourAxis);
/**
 * Brush: web component wrapper.
 * Attributes: `start`, `end`, `min`, `max`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourBrush extends ContourBase {
    static get observed() { return ["start", "end", "min", "max", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { start: { attribute: "start" }, end: { attribute: "end" }, min: { attribute: "min" }, max: { attribute: "max" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-brush");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Brush selection");
      wireStates(this);
      loadRemote(this, []);
      if (renderStates(this, "brush")) return;
      let sel = this.querySelector(".c-brush__selection");
      if (!sel) { sel = document.createElement("div"); sel.className = "c-brush__selection"; this.appendChild(sel); }
      const start = parseFloat(this.getAttribute("start") || "0");
      const end = parseFloat(this.getAttribute("end") || "100");
      const min = parseFloat(this.getAttribute("min") || "0");
      const max = parseFloat(this.getAttribute("max") || "100");
      const range = max - min || 1;
      const left = ((start - min) / range) * 100;
      const width = ((end - start) / range) * 100;
      sel.style.insetInlineStart = left + "%";
      sel.style.inlineSize = width + "%";
      // handles
      ["start","end"].forEach((h) => {
        let handle = this.querySelector(".c-brush__handle--" + h);
        if (!handle) { handle = document.createElement("div"); handle.className = "c-brush__handle c-brush__handle--" + h; this.appendChild(handle); }
        const val = h === "start" ? start : end;
        handle.style.insetInlineStart = (((val - min) / range) * 100) + "%";
      });
    }
    enhance() {
      if (this._wiredBrush) return;
      this._wiredBrush = true;
      let dragging = null;
      const min = () => parseFloat(this.getAttribute("min") || "0");
      const max = () => parseFloat(this.getAttribute("max") || "100");
      const toValue = (clientX) => {
        const r = this.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - r.left) / (r.width || 1)));
        return min() + ratio * (max() - min());
      };
      this.addEventListener("pointerdown", (e) => {
        const handle = e.target && e.target.classList && e.target.classList.contains("c-brush__handle") ? e.target : null;
        dragging = handle ? (handle.classList.contains("c-brush__handle--start") ? "start" : "end") : "move";
        try { this.setPointerCapture(e.pointerId); } catch (err) {}
        this.dispatchEvent(new CustomEvent("contour:brush-start", { bubbles: true, composed: true, detail: { value: this.getAttribute("start"), start: this.getAttribute("start"), end: this.getAttribute("end") } }));
      });
      this.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const v = toValue(e.clientX);
        const mn = min(), mx = max(), range = mx - mn || 1;
        const sel = this.querySelector(".c-brush__selection");
        let ns = parseFloat(this.getAttribute("start") || "0");
        let ne = parseFloat(this.getAttribute("end") || "100");
        if (dragging === "start") {
          ns = Math.min(v, ne);
        } else if (dragging === "end") {
          ne = Math.max(v, ns);
        } else {
          const width = ne - ns;
          ns = v - width / 2;
          ne = v + width / 2;
          if (ns < mn) { ne += mn - ns; ns = mn; }
          if (ne > mx) { ns -= ne - mx; ne = mx; }
        }
        ns = Math.max(mn, Math.min(mx, ns));
        ne = Math.max(mn, Math.min(mx, ne));
        // update DOM directly to avoid re-render during drag
        if (sel) {
          sel.style.insetInlineStart = (((ns - mn) / range) * 100) + "%";
          sel.style.inlineSize = (((ne - ns) / range) * 100) + "%";
        }
        const sh = this.querySelector(".c-brush__handle--start");
        const eh = this.querySelector(".c-brush__handle--end");
        if (sh) sh.style.insetInlineStart = (((ns - mn) / range) * 100) + "%";
        if (eh) eh.style.insetInlineStart = (((ne - mn) / range) * 100) + "%";
        // stash pending values
        this._brushPending = { start: ns, end: ne };
        this.dispatchEvent(new CustomEvent("contour:brush", { bubbles: true, composed: true, detail: { start: ns, end: ne, value: ns } }));
      });
      this.addEventListener("pointerup", (e) => {
        if (!dragging) return;
        dragging = null;
        const p = this._brushPending;
        if (p) {
          this.setAttribute("start", String(p.start));
          this.setAttribute("end", String(p.end));
          this._brushPending = null;
        }
        this.dispatchEvent(new CustomEvent("contour:brush-end", { bubbles: true, composed: true, detail: { value: this.getAttribute("end"), start: this.getAttribute("start"), end: this.getAttribute("end") } }));
        this.dispatchEvent(new CustomEvent("contour:brush", { bubbles: true, composed: true, detail: { start: this.getAttribute("start"), end: this.getAttribute("end"), value: this.getAttribute("end") } }));
      });
      // Keyboard: Enter/Space emits brush-start/brush-end (WC-P1-08).
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:brush-start", { bubbles: true, composed: true, detail: { value: this.getAttribute("start"), start: this.getAttribute("start"), end: this.getAttribute("end") } }));
        }
      });
    }
  }
define("contour-brush", ContourBrush);
/**
 * Stacked Bar: web component wrapper.
 * Attributes: `segments`, `values`, `colors`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`, `normalize`.
 */
class ContourStackedBar extends ContourBase {
    static get observed() { return ["segments", "values", "colors", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "normalize"]; }
    static get properties() { return { segments: { attribute: "segments" }, values: { attribute: "values" }, colors: { attribute: "colors" }, src: { attribute: "src" }, normalize: { attribute: "normalize" } }; }
    render() {
      this.classList.add("c-stacked-bar");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Stacked bar");
      wireStates(this);
      loadRemote(this, ["segments", "values"]);
      if (renderStates(this, "stacked-bar")) return;
      Array.from(this.querySelectorAll(".c-stacked-bar__segment")).forEach((n) => n.remove());
      // Slotted content support: authored .c-stacked-bar__segment children take
      // precedence over the JSON `segments` attribute.
      const authoredSegments = Array.from(this.querySelectorAll(":scope > .c-stacked-bar__segment"));
      let segments = [];
      if (authoredSegments.length) {
        segments = authoredSegments.map((el) => ({
          label: el.getAttribute("title") || el.textContent || "",
          value: parseFloat(el.style.inlineSize) || 0,
          color: (el.dataset && el.dataset.color) || el.style.background || undefined,
        }));
        authoredSegments.forEach((el) => el.remove());
      } else {
        const sAttr = this.getAttribute("segments");
        if (sAttr) { try { segments = JSON.parse(sAttr); } catch (e) { segments = []; } }
      }
      const values = segments.map((seg) => (typeof seg === "object" ? (seg.value || 0) : Number(seg) || 0));
      const total = values.reduce((a, b) => a + b, 0) || 1;
      const normalize = this.hasAttribute("normalize");
      const denom = normalize ? total : (parseFloat(this.getAttribute("max") || String(total)) || total);
      segments.forEach((seg, i) => {
        const v = values[i];
        const el = document.createElement("div");
        el.className = "c-stacked-bar__segment";
        el.style.inlineSize = ((v / denom) * 100) + "%";
        el.style.background = (typeof seg === "object" && seg.color) ? seg.color : "var(--chart-" + ((i % 8) + 1) + ")";
        el.dataset.color = (typeof seg === "object" && seg.color) ? seg.color : el.style.background;
        el.setAttribute("title", (typeof seg === "object" ? (seg.label || "") : "") + " " + v);
        this.appendChild(el);
      });
      if (!segments.length) renderEmpty(this, "stacked-bar");
    }
    enhance() {}
  }
define("contour-stacked-bar", ContourStackedBar);
/**
 * Category: web component wrapper.
 * Attributes: `items`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`, `search`.
 */
class ContourCategory extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "search", "note", "limit", "sort"]; }
    static get properties() { return { items: { attribute: "items" }, src: { attribute: "src" }, search: { attribute: "search" }, note: { attribute: "note" }, limit: { attribute: "limit" }, sort: { attribute: "sort" } }; }
    render() {
      this.classList.add("c-category");
      this.setAttribute("role", "listbox");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Category");
      wireStates(this);
      loadRemote(this, ["items"]);
      if (renderStates(this, "category")) return;
      Array.from(this.querySelectorAll(".c-category__item")).forEach((n) => n.remove());
      // Slotted content support: authored .c-category__item children take
      // precedence over the JSON `items` attribute.
      const authoredItems = Array.from(this.querySelectorAll(":scope > .c-category__item"));
      let items = [];
      if (authoredItems.length) {
        authoredItems.forEach((el) => {
          const lbl = el.querySelector(".c-category__label");
          items.push({ label: lbl ? lbl.textContent : el.textContent, value: 0 });
        });
        authoredItems.forEach((el) => el.remove());
      } else {
        const iAttr = this.getAttribute("items");
        if (iAttr) { try { items = JSON.parse(iAttr); } catch (e) { items = []; } }
      }
      // Top-N + sort (CARTO-inspired): optional `limit` and `sort` attributes.
      const sort = this.getAttribute("sort") || "value-desc";
      items.sort((a, b) => {
        const va = (typeof a === "object") ? (a.value || 0) : (Number(a) || 0);
        const vb = (typeof b === "object") ? (b.value || 0) : (Number(b) || 0);
        const la = (typeof a === "object") ? (a.label || a.name || "") : String(a);
        const lb = (typeof b === "object") ? (b.label || b.name || "") : String(b);
        if (sort === "value-asc") return va - vb;
        if (sort === "alpha-asc") return String(la).localeCompare(String(lb));
        if (sort === "alpha-desc") return String(lb).localeCompare(String(la));
        return vb - va; // value-desc (default)
      });
      const limit = parseInt(this.getAttribute("limit") || "0", 10);
      if (limit > 0) items = items.slice(0, limit);
      const max = items.reduce((m, it) => Math.max(m, (typeof it === "object" ? (it.value || 0) : Number(it) || 0)), 0) || 1;
      items.forEach((it, idx) => {
        const value = (typeof it === "object") ? (it.value || 0) : (Number(it) || 0);
        const label = (typeof it === "object") ? (it.label || it.name || "") : String(it);
        const item = document.createElement("div");
        item.className = "c-category__item";
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", "false");
        item.setAttribute("tabindex", idx === 0 ? "0" : "-1");
        const lbl = document.createElement("span");
        lbl.className = "c-category__label";
        lbl.textContent = label;
        const barWrap = document.createElement("div");
        barWrap.style.flex = "1";
        const bar = document.createElement("div");
        bar.className = "c-category__bar";
        bar.style.inlineSize = ((value / max) * 100) + "%";
        barWrap.appendChild(bar);
        const val = document.createElement("span");
        val.className = "c-category__value";
        val.textContent = String(value);
        item.appendChild(lbl);
        item.appendChild(barWrap);
        item.appendChild(val);
        this.appendChild(item);
      });
      if (!items.length) renderEmpty(this, "category");
      const note = this.getAttribute("note");
      let noteEl = this.querySelector(".c-category__note");
      if (note) {
        if (!noteEl) { noteEl = document.createElement("div"); noteEl.className = "c-category__note"; this.appendChild(noteEl); }
        noteEl.textContent = note;
      } else if (noteEl) {
        noteEl.remove();
      }
    }
    enhance() {
      if (this._wiredCategory) return;
      this._wiredCategory = true;
      const items = () => Array.from(this.querySelectorAll(".c-category__item"));
      const showTip = (e) => {};
      this.addEventListener("click", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".c-category__item") : null;
        if (!item || !this.contains(item)) return;
        const all = items();
        const idx = all.indexOf(item);
        all.forEach((o, i) => o.setAttribute("aria-selected", i === idx ? "true" : "false"));
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: idx, label: item.querySelector(".c-category__label") ? item.querySelector(".c-category__label").textContent : item.textContent.trim() } }));
      });
      this.addEventListener("keydown", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".c-category__item") : null;
        if (!item || !this.contains(item)) return;
        const all = items();
        const idx = all.indexOf(item);
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          all.forEach((o, i) => o.setAttribute("aria-selected", i === idx ? "true" : "false"));
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: idx, label: item.querySelector(".c-category__label") ? item.querySelector(".c-category__label").textContent : item.textContent.trim() } }));
          return;
        }
        let next = -1;
        const rtl = (this.getAttribute("dir") || document.documentElement.getAttribute("dir") || "").toLowerCase() === "rtl";
        if (e.key === "ArrowDown") next = Math.min(idx + 1, all.length - 1);
        else if (e.key === "ArrowUp") next = Math.max(idx - 1, 0);
        else if (e.key === "ArrowRight") next = rtl ? Math.max(idx - 1, 0) : Math.min(idx + 1, all.length - 1);
        else if (e.key === "ArrowLeft") next = rtl ? Math.min(idx + 1, all.length - 1) : Math.max(idx - 1, 0);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = all.length - 1;
        if (next < 0 || next === idx) return;
        e.preventDefault();
        all.forEach((c, i) => c.setAttribute("tabindex", i === next ? "0" : "-1"));
        try { all[next].focus(); } catch (err) {}
      });
    }
  }
define("contour-category", ContourCategory);
/**
 * Donut: web component wrapper.
 * Attributes: `value`, `values`, `items`, `label`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`, `brownout`, `brownout-level`.
 */
class ContourDonut extends ContourBase {
    static get observed() { return ["value", "values", "items", "label", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "brownout", "brownout-level", "note"]; }
    static get properties() { return { value: { attribute: "value" }, values: { attribute: "values" }, items: { attribute: "items" }, label: { attribute: "label" }, src: { attribute: "src" }, note: { attribute: "note" } }; }
    render() {
      this.classList.add("c-donut");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Donut chart");
      wireStates(this);
      loadRemote(this, ["items", "values"]);
      if (renderStates(this, "donut")) return;
      Array.from(this.querySelectorAll(".c-donut__ring, .c-donut__center, .c-donut__list, .c-donut__empty")).forEach((n) => n.remove());
      // Slotted content support: authored .c-donut__item children take precedence
      // over the JSON `items` attribute, so consumers can compose legend rows
      // by hand instead of serialising them into an attribute.
      const authoredItems = Array.from(this.querySelectorAll(":scope > .c-donut__item"));
      let items = [];
      if (authoredItems.length) {
        authoredItems.forEach((el) => {
          const sw = el.querySelector(".c-donut__swatch");
          const lbl = el.querySelector("span:last-child");
          const text = lbl ? lbl.textContent : el.textContent;
          const match = text.match(/—\s*(\d+(?:\.\d+)?)$/);
          items.push({ label: text.replace(/—\s*\d+(?:\.\d+)?$/, "").trim(), value: match ? Number(match[1]) : 0, color: sw ? (sw.dataset && sw.dataset.color) || sw.style.background : undefined });
        });
        // remove authored items from DOM (they will be regenerated below)
        authoredItems.forEach((el) => el.remove());
      } else {
        const iAttr = this.getAttribute("items");
        if (iAttr) { try { items = JSON.parse(iAttr); } catch (e) { items = []; } }
      }
      const values = items.map((it) => (typeof it === "object" ? (it.value || 0) : Number(it) || 0));
      const total = values.reduce((a, b) => a + b, 0) || 1;
      const brownoutLevel = this.brownoutLevel();
      const shedRing = this.shed("ring", 3);
      if (!shedRing) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "c-donut__ring");
        svg.setAttribute("viewBox", "0 0 32 32");
        let offset = 0;
        items.forEach((it, i) => {
          const v = values[i];
          const pct = v / total;
          const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          circle.setAttribute("cx", "16"); circle.setAttribute("cy", "16"); circle.setAttribute("r", "12");
          circle.setAttribute("fill", "none");
          circle.setAttribute("stroke", (typeof it === "object" && it.color) ? it.color : "var(--chart-" + ((i % 8) + 1) + ")");
          circle.setAttribute("stroke-width", "6");
          const circ = 2 * Math.PI * 12;
          circle.setAttribute("stroke-dasharray", (pct * circ) + " " + (circ - pct * circ));
          circle.setAttribute("stroke-dashoffset", String(-offset * circ));
          circle.setAttribute("transform", "rotate(-90 16 16)");
          svg.appendChild(circle);
          offset += pct;
        });
        // center hole
        const hole = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        hole.setAttribute("cx", "16"); hole.setAttribute("cy", "16"); hole.setAttribute("r", "9");
        hole.setAttribute("fill", "var(--color-surface-0)");
        svg.appendChild(hole);
        this.appendChild(svg);
      }
      const center = document.createElement("div");
      center.className = "c-donut__center";
      center.textContent = this.getAttribute("value") || String(total);
      this.appendChild(center);
      // text list
      const list = document.createElement("div");
      list.className = "c-donut__list";
      items.forEach((it, i) => {
        const row = document.createElement("div");
        row.className = "c-donut__item";
        const sw = document.createElement("span");
        sw.className = "c-donut__swatch";
        sw.style.background = (typeof it === "object" && it.color) ? it.color : "var(--chart-" + ((i % 8) + 1) + ")";
            if (sw.style.background) sw.dataset.color = (typeof it === "object" && it.color) ? it.color : sw.style.background;
        row.appendChild(sw);
        const lbl = document.createElement("span");
        lbl.textContent = (typeof it === "object" ? (it.label || "") : String(it)) + " — " + values[i];
        row.appendChild(lbl);
        list.appendChild(row);
      });
      this.appendChild(list);
      if (!items.length) renderEmpty(this, "donut");
      const note = this.getAttribute("note");
      let noteEl = this.querySelector(".c-donut__note");
      if (note) {
        if (!noteEl) { noteEl = document.createElement("div"); noteEl.className = "c-donut__note"; this.appendChild(noteEl); }
        noteEl.textContent = note;
      } else if (noteEl) {
        noteEl.remove();
      }
    }
    enhance() {}
  }
define("contour-donut", ContourDonut);
/**
 * Time Series: web component wrapper.
 * Attributes: `values`, `points`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`, `annotations`.
 */
class ContourTimeSeries extends ContourBase {
    static get observed() { return ["values", "points", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "annotations", "note", "style"]; }
    static get properties() { return { values: { attribute: "values" }, points: { attribute: "points" }, src: { attribute: "src" }, annotations: { attribute: "annotations" }, note: { attribute: "note" }, style: { attribute: "style" } }; }
    render() {
      this.classList.add("c-time-series");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Time series");
      wireStates(this);
      loadRemote(this, ["values", "points"]);
      if (renderStates(this, "time-series")) return;
      Array.from(this.querySelectorAll(".c-time-series__plot, .c-time-series__axis")).forEach((n) => n.remove());
      let values = [];
      const vAttr = this.getAttribute("values");
      if (vAttr) { try { values = JSON.parse(vAttr); } catch (e) { values = vAttr.split(",").map(Number); } }
      const max = Math.max(...values, 1);
      const min = Math.min(...values, 0);
      const style = this.getAttribute("style") || "bar";
      const plot = document.createElement("div");
      plot.className = "c-time-series__plot";
      plot.setAttribute("part", "plot");
      if (style === "line") {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 300 120");
        svg.setAttribute("preserveAspectRatio", "none");
        svg.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%";
        const range = (max - min) || 1;
        const n = values.length || 1;
        const pts = values.map((v, i) => {
          const x = (i / Math.max(1, n - 1)) * 300;
          const y = 120 - ((v - min) / range) * 120;
          return x.toFixed(2) + "," + y.toFixed(2);
        }).join(" ");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", "c-time-series__line");
        path.setAttribute("d", "M " + pts.replace(/ /g, " L "));
        path.style.stroke = "var(--chart-1)";
        path.style.fill = "none";
        path.style.strokeWidth = "2";
        svg.appendChild(path);
        // point markers
        values.forEach((v, i) => {
          const x = (i / Math.max(1, n - 1)) * 300;
          const y = 120 - ((v - min) / range) * 120;
          const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          c.setAttribute("class", "c-time-series__point");
          c.setAttribute("cx", x.toFixed(2));
          c.setAttribute("cy", y.toFixed(2));
          c.setAttribute("r", "3");
          c.setAttribute("tabindex", i === 0 ? "0" : "-1");
          c.setAttribute("role", "button");
          c.setAttribute("title", String(v));
          c.setAttribute("aria-label", "Value " + v);
          svg.appendChild(c);
        });
        plot.appendChild(svg);
      } else {
        values.forEach((v, i) => {
          const bar = document.createElement("div");
          bar.className = "c-time-series__bar";
          bar.style.blockSize = ((v / max) * 100) + "%";
          bar.setAttribute("title", String(v));
          bar.setAttribute("role", "img");
          bar.setAttribute("aria-label", "Value " + v);
          bar.setAttribute("tabindex", i === 0 ? "0" : "-1");
          plot.appendChild(bar);
        });
      }
      this.appendChild(plot);
      if (!values.length) renderEmpty(this, "time-series");
      const note = this.getAttribute("note");
      let noteEl = this.querySelector(".c-time-series__note");
      if (note) {
        if (!noteEl) { noteEl = document.createElement("div"); noteEl.className = "c-time-series__note"; this.appendChild(noteEl); }
        noteEl.textContent = note;
      } else if (noteEl) {
        noteEl.remove();
      }
    }
    enhance() {
      if (this._wiredTimeSeries) return;
      this._wiredTimeSeries = true;
      const bars = () => Array.from(this.querySelectorAll(".c-time-series__bar"));
      this.addEventListener("click", (e) => {
        const bar = e.target && e.target.closest ? e.target.closest(".c-time-series__bar") : null;
        if (!bar || !this.contains(bar)) return;
        const idx = bars().indexOf(bar);
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: idx, value: bar.getAttribute("title") } }));
      });
      this.addEventListener("keydown", (e) => {
        const bar = e.target && e.target.closest ? e.target.closest(".c-time-series__bar") : null;
        if (!bar || !this.contains(bar)) return;
        const all = bars();
        const idx = all.indexOf(bar);
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: idx, value: bar.getAttribute("title") } }));
          return;
        }
        let next = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.min(idx + 1, all.length - 1);
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.max(idx - 1, 0);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = all.length - 1;
        if (next < 0 || next === idx) return;
        e.preventDefault();
        all.forEach((b, i) => b.setAttribute("tabindex", i === next ? "0" : "-1"));
        try { all[next].focus(); } catch (err) {}
      });
      // focus tooltip
      this.addEventListener("focusin", (e) => {
        const bar = e.target && e.target.closest ? e.target.closest(".c-time-series__bar") : null;
        if (bar && this.contains(bar)) {
          const tip = this.querySelector(".c-time-series__tooltip");
          if (tip) { tip.textContent = bar.getAttribute("title"); tip.removeAttribute("hidden"); }
        }
      });
      this.addEventListener("focusout", (e) => {
        const tip = this.querySelector(".c-time-series__tooltip");
        if (tip && !this.contains(e.relatedTarget)) tip.setAttribute("hidden", "");
      });
    }
  }
define("contour-time-series", ContourTimeSeries);
/**
 * Pivot: web component wrapper.
 * Attributes: `rows`, `columns`, `values`, `data`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourPivot extends ContourBase {
    static get observed() { return ["rows", "columns", "values", "data", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { rows: { attribute: "rows" }, columns: { attribute: "columns" }, values: { attribute: "values" }, data: { attribute: "data" }, src: { attribute: "src" }, filter: { attribute: "filter" }, aggregate: { attribute: "aggregate" } }; }
    _aggregateFn(name) {
      const n = (name || "sum").toLowerCase();
      if (n === "avg" || n === "average" || n === "mean") return (vals) => vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
      if (n === "count") return (vals) => vals.length;
      if (n === "min") return (vals) => vals.length ? Math.min(...vals) : 0;
      if (n === "max") return (vals) => vals.length ? Math.max(...vals) : 0;
      return (vals) => vals.reduce((a,b)=>a+b,0);
    }
    render() {
      this.classList.add("c-pivot");
      wireStates(this);
      loadRemote(this, ["data"]);
      if (renderStates(this, "pivot")) return;
      Array.from(this.querySelectorAll("table, .c-pivot__toolbar")).forEach((n) => n.remove());
      let data = [];
      const dAttr = this.getAttribute("data");
      if (dAttr) { try { data = JSON.parse(dAttr); } catch (e) { data = []; } }
      const rows = this.getAttribute("rows") ? this.getAttribute("rows").split(",").map((s)=>s.trim()).filter(Boolean) : [];
      const cols = this.getAttribute("columns") ? this.getAttribute("columns").split(",").map((s)=>s.trim()).filter(Boolean) : [];
      const aggName = this.getAttribute("aggregate") || "sum";
      const aggFn = this._aggregateFn(aggName);
      const filterQ = (this.getAttribute("filter") || "").toLowerCase().trim();
      // Toolbar: filter input + aggregate selector.
      const toolbar = document.createElement("div");
      toolbar.className = "c-pivot__toolbar";
      toolbar.style.display = "flex";
      toolbar.style.gap = "0.5rem";
      toolbar.style.marginBlockEnd = "0.5rem";
      const filterInput = document.createElement("input");
      filterInput.type = "search";
      filterInput.className = "c-input c-pivot__filter";
      filterInput.placeholder = "Filter…";
      filterInput.value = this.getAttribute("filter") || "";
      filterInput.setAttribute("aria-label", "Filter pivot");
      const aggSelect = document.createElement("select");
      aggSelect.className = "c-select c-pivot__aggregate";
      aggSelect.setAttribute("aria-label", "Aggregation");
      ["sum","avg","count","min","max"].forEach((a) => {
        const opt = document.createElement("option");
        opt.value = a; opt.textContent = a;
        if (a === aggName) opt.selected = true;
        aggSelect.appendChild(opt);
      });
      toolbar.appendChild(filterInput);
      toolbar.appendChild(aggSelect);
      this.appendChild(toolbar);
      // Filter rows/cols.
      let visibleRows = rows;
      let visibleCols = cols;
      if (filterQ) {
        visibleRows = rows.filter((r) => r.toLowerCase().includes(filterQ) || data.some((d) => d.row === r && String(d.value).toLowerCase().includes(filterQ)));
        visibleCols = cols.filter((c) => c.toLowerCase().includes(filterQ) || data.some((d) => d.col === c && String(d.value).toLowerCase().includes(filterQ)));
        if (!visibleRows.length) visibleRows = rows;
        if (!visibleCols.length) visibleCols = cols;
      }
      const table = document.createElement("table");
      table.setAttribute("role", "grid");
      table.setAttribute("aria-rowcount", String(visibleRows.length + 1));
      table.setAttribute("aria-colcount", String(visibleCols.length + 1));
      const thead = document.createElement("thead");
      const hr = document.createElement("tr");
      const corner = document.createElement("th");
      corner.textContent = "";
      corner.setAttribute("role", "columnheader");
      corner.setAttribute("aria-label", "Row");
      hr.appendChild(corner);
      visibleCols.forEach((c) => { const th = document.createElement("th"); th.textContent = c; th.setAttribute("role", "columnheader"); th.setAttribute("tabindex", "0"); hr.appendChild(th); });
      thead.appendChild(hr);
      table.appendChild(thead);
      const tbody = document.createElement("tbody");
      visibleRows.forEach((r) => {
        const tr = document.createElement("tr");
        tr.setAttribute("role", "row");
        const th = document.createElement("th");
        th.textContent = r;
        th.setAttribute("role", "rowheader");
        th.setAttribute("tabindex", "0");
        tr.appendChild(th);
        visibleCols.forEach((c) => {
          const td = document.createElement("td");
          td.setAttribute("role", "gridcell");
          td.setAttribute("tabindex", "0");
          const cellData = data.filter((d) => d.row === r && d.col === c);
          const vals = cellData.map((d) => Number(d.value)).filter((n) => Number.isFinite(n));
          if (cellData.length && vals.length === cellData.length && vals.length) {
            const v = aggFn(vals);
            td.textContent = Number.isInteger(v) ? String(v) : v.toFixed(2);
          } else if (cellData.length) {
            td.textContent = cellData.map((d) => d.value).join(", ");
          } else {
            td.textContent = "";
          }
          if (!td.textContent.trim()) td.setAttribute("aria-label", "Empty");
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      this.appendChild(table);
      if (!data.length && !rows.length && !cols.length) renderEmpty(this, "pivot");
    }
    enhance() {
      if (this._wiredPivot) return;
      this._wiredPivot = true;
      this.addEventListener("click", (e) => {
        const th = e.target && e.target.closest ? e.target.closest("th") : null;
        const td = e.target && e.target.closest ? e.target.closest("td") : null;
        const filterInput = e.target && e.target.closest ? e.target.closest(".c-pivot__filter") : null;
        const aggSelect = e.target && e.target.closest ? e.target.closest(".c-pivot__aggregate") : null;
        if (filterInput) return;
        if (aggSelect) return;
        if (th && this.contains(th) && th.parentElement && th.parentElement.parentElement && th.parentElement.parentElement.tagName === "THEAD") {
          this.dispatchEvent(new CustomEvent("contour:sort", { bubbles: true, composed: true, detail: { column: th.textContent.trim() } }));
          return;
        }
        if (td && this.contains(td)) {
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { value: td.textContent } }));
        }
      });
      this.addEventListener("input", (e) => {
        const fi = e.target && e.target.closest ? e.target.closest(".c-pivot__filter") : null;
        if (fi && this.contains(fi)) {
          this.setAttribute("filter", fi.value);
          this.render();
          this.dispatchEvent(new CustomEvent("contour:filter", { bubbles: true, composed: true, detail: { query: fi.value } }));
        }
      });
      this.addEventListener("change", (e) => {
        const as = e.target && e.target.closest ? e.target.closest(".c-pivot__aggregate") : null;
        if (as && this.contains(as)) {
          this.setAttribute("aggregate", as.value);
          this.render();
          this.dispatchEvent(new CustomEvent("contour:aggregate", { bubbles: true, composed: true, detail: { aggregate: as.value } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest("th, td") : null;
        if (!cell || !this.contains(cell)) return;
        const table = this.querySelector("table");
        if (!table) return;
        const rows = Array.from(table.querySelectorAll("tr"));
        const ri = rows.indexOf(cell.parentElement);
        const ci = Array.from(cell.parentElement.children).indexOf(cell);
        let target = null;
        if (e.key === "ArrowRight") target = cell.parentElement.children[ci + 1];
        else if (e.key === "ArrowLeft") target = cell.parentElement.children[ci - 1];
        else if (e.key === "ArrowDown") target = rows[ri + 1] && rows[ri + 1].children[ci];
        else if (e.key === "ArrowUp") target = rows[ri - 1] && rows[ri - 1].children[ci];
        else if (e.key === "Home") target = cell.parentElement.children[0];
        else if (e.key === "End") target = cell.parentElement.children[cell.parentElement.children.length - 1];
        if (target) { e.preventDefault(); try { target.focus(); } catch (err) {} }
      });
    }
  }
define("contour-pivot", ContourPivot);
/**
 * Widget State: web component wrapper.
 * Attributes: `loading`, `error`, `empty`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourWidgetState extends ContourBase {
    static get observed() { return ["loading", "error", "empty", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { loading: { attribute: "loading" }, error: { attribute: "error" }, empty: { attribute: "empty" }, retry: { attribute: "retry" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-widget-state");
      wireStates(this);
      loadRemote(this, []);
      if (renderStates(this, "widget-state")) return;
      // if no state, render slotted content (already in DOM)
    }
    enhance() {}
  }
define("contour-widget-state", ContourWidgetState);
/**
 * Brownout: web component wrapper.
 * Attributes: `level`.
 */
class ContourBrownout extends ContourBase {
    static get observed() { return ["level"]; }
    static get properties() { return { level: { attribute: "level" } }; }
    render() {
      this.classList.add("c-brownout");
      const level = this.getAttribute("level") || "0";
      this.dataset.level = level;
      this.setAttribute("data-level", level);
    }
    enhance() {}
  }
define("contour-brownout", ContourBrownout);
/**
 * Instrument: web component wrapper.
 * Attributes: `rows`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourInstrument extends ContourBase {
    static get observed() { return ["rows", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { rows: { attribute: "rows" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-instrument");
      wireStates(this);
      loadRemote(this, "rows");
      if (renderStates(this, "instrument")) return;
      const rows = remoteData(this, "rows");
      // The block's two parts are `__item` and `__value`: the label is the text
      // the item opens with, and the value is the span inside it. There is no
      // `__row` and no `__key` — the separators between items are CSS `::before`.
      Array.from(this.querySelectorAll(".c-instrument__item")).forEach((n) => n.remove());
      if (rows) {
        try {
          const parsed = JSON.parse(rows);
          parsed.forEach((r) => {
            const item = document.createElement("span");
            item.className = "c-instrument__item";
            item.appendChild(document.createTextNode(String(r.key || r[0] || "")));
            const val = document.createElement("span");
            val.className = "c-instrument__value";
            val.textContent = r.value || r[1] || "";
            item.appendChild(val);
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      } else {
        renderEmpty(this, "instrument");
      }
    }
  }
define("contour-instrument", ContourInstrument);
/**
 * Bivariate: web component wrapper.
 * Attributes: `size`, `axis-x`, `axis-y`, `colors`, `selected`.
 */
class ContourBivariate extends ContourBase {
    static get observed() { return ["size", "axis-x", "axis-y", "colors", "selected"]; }
    static get properties() { return { size: { attribute: "size" }, axisX: { attribute: "axis-x" }, axisY: { attribute: "axis-y" }, colors: { attribute: "colors" }, selected: { attribute: "selected" } }; }
    render() {
      this.classList.add("c-bivariate");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Bivariate legend");
      const size = Math.min(12, Math.max(1, parseInt(this.getAttribute("size") || "3", 10) || 3));
      const matrix = this.ensure(".c-bivariate__matrix", () => { const el = document.createElement("div"); el.className = "c-bivariate__matrix"; return el; });
      matrix.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      matrix.style.gridTemplateRows = `repeat(${size}, 1fr)`;
      // Slot composition: authored cells win over the generated grid.
      const authored = Array.from(matrix.children).filter((n) => n.classList && n.classList.contains("c-bivariate__cell"));
      if (!authored.length) {
        matrix.innerHTML = "";
        let colors = [];
        const cAttr = this.getAttribute("colors");
        if (cAttr) { try { colors = JSON.parse(cAttr); } catch (e) { colors = []; } }
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const cell = document.createElement("div");
            cell.className = "c-bivariate__cell";
            cell.setAttribute("role", "button");
            cell.setAttribute("tabindex", "0");
            cell.setAttribute("aria-label", "Cell " + c + "," + r);
            // Palette runs from bottom-left (low/low) to top-right (high/high):
            // reverse the row order so the first palette row sits at the bottom.
            const srcIndex = (size - 1 - r) * size + c;
            if (colors[srcIndex]) { cell.style.background = colors[srcIndex]; cell.dataset.color = colors[srcIndex]; }
            matrix.appendChild(cell);
          }
        }
        // selected highlight
        const sel = this.getAttribute("selected");
        if (sel) {
          const parts = sel.split(",");
          const sr = parseInt(parts[0], 10);
          const sc = parseInt(parts[1], 10);
          const cells = Array.from(matrix.querySelectorAll(".c-bivariate__cell"));
          cells.forEach((cell, i) => {
            const rr = Math.floor(i / size);
            const cc = i % size;
            // matrix is row-major in DOM? cells appended row by row r then c, so index = r*size+c
            if (rr === sr && cc === sc) cell.setAttribute("data-selected", "");
            else cell.removeAttribute("data-selected");
          });
        }
        // aria-live region
        let live = this.querySelector(".c-bivariate__live");
        if (!live) { live = document.createElement("div"); live.className = "c-bivariate__live"; live.setAttribute("aria-live", "polite"); live.style.position = "absolute"; live.style.width = "1px"; live.style.height = "1px"; live.style.overflow = "hidden"; live.style.clip = "rect(0,0,0,0)"; this.appendChild(live); }
      }
      const axisX = this.getAttribute("axis-x");
      if (axisX) {
        const ax = this.ensure(".c-bivariate__axis--x", () => { const el = document.createElement("div"); el.className = "c-bivariate__axis c-bivariate__axis--x"; return el; });
        ax.textContent = axisX;
      } else {
        const ax = this.querySelector(".c-bivariate__axis--x");
        if (ax) ax.remove();
      }
      const axisY = this.getAttribute("axis-y");
      if (axisY) {
        const ay = this.ensure(".c-bivariate__axis--y", () => { const el = document.createElement("div"); el.className = "c-bivariate__axis c-bivariate__axis--y"; return el; });
        ay.textContent = axisY;
      } else {
        const ay = this.querySelector(".c-bivariate__axis--y");
        if (ay) ay.remove();
      }
    }
    enhance() {
      if (this._wiredBivariate) return;
      this._wiredBivariate = true;
      const selectCell = (cell) => {
        const matrix = this.querySelector(".c-bivariate__matrix");
        const cells = Array.from(matrix ? matrix.querySelectorAll(".c-bivariate__cell") : []);
        const idx = cells.indexOf(cell);
        if (idx < 0) return;
        const size = Math.min(12, Math.max(1, parseInt(this.getAttribute("size") || "3", 10) || 3));
        const row = Math.floor(idx / size);
        const col = idx % size;
        cells.forEach((cell, i) => {
          const rr = Math.floor(i / size);
          const cc = i % size;
          if (rr === row && cc === col) cell.setAttribute("data-selected", "");
          else cell.removeAttribute("data-selected");
        });
        this.dispatchEvent(new CustomEvent("contour:select", { detail: { row, col }, bubbles: true, composed: true }));
      };
      this.addEventListener("click", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-bivariate__cell") : null;
        if (cell && this.contains(cell)) selectCell(cell);
      });
      this.addEventListener("keydown", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-bivariate__cell") : null;
        if (!cell || !this.contains(cell)) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectCell(cell);
        }
      });
    }
    clear() {
      this.removeAttribute("selected");
      this.dispatchEvent(new CustomEvent("contour:clear", { bubbles: true, composed: true }));
    }
  }
  define("contour-bivariate", ContourBivariate);
class ContourBivariateLegend extends ContourBivariate {
    static get observed() { return ["size", "axis-x", "axis-y", "colors", "selected"]; }
    static get properties() { return { size: { attribute: "size" }, axisX: { attribute: "axis-x" }, axisY: { attribute: "axis-y" }, colors: { attribute: "colors" }, selected: { attribute: "selected" } }; }
    render() {
      super.render();
      this.classList.add("c-bivariate-legend");
    }
    enhance() {
      if (this._wiredBivLegend) return;
      this._wiredBivLegend = true;
      const selectCell = (cell) => {
        const matrix = this.querySelector(".c-bivariate__matrix");
        const cells = Array.from(matrix ? matrix.querySelectorAll(".c-bivariate__cell") : []);
        const idx = cells.indexOf(cell);
        if (idx < 0) return;
        const size = Math.min(8, Math.max(1, parseInt(this.getAttribute("size") || "3", 10) || 3));
        const row = Math.floor(idx / size);
        const col = idx % size;
        cells.forEach((cell, i) => {
          const rr = Math.floor(i / size);
          const cc = i % size;
          if (rr === row && cc === col) cell.setAttribute("data-selected", "");
          else cell.removeAttribute("data-selected");
        });
        this.dispatchEvent(new CustomEvent("contour:select", { detail: { row, col }, bubbles: true, composed: true }));
      };
      this.addEventListener("click", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-bivariate__cell") : null;
        if (cell && this.contains(cell)) selectCell(cell);
      });
      this.addEventListener("keydown", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-bivariate__cell") : null;
        if (!cell || !this.contains(cell)) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectCell(cell); }
      });
    }
    clear() { this.removeAttribute("selected"); this.dispatchEvent(new CustomEvent("contour:clear", { bubbles: true, composed: true })); }
  }
define("contour-bivariate-legend", ContourBivariateLegend);
/**
 * Survey: web component wrapper.
 * Attributes: `date`, `instrument`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourSurvey extends ContourBase {
    static get observed() { return ["date", "instrument", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { date: { attribute: "date" }, instrument: { attribute: "instrument" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-survey");
      wireStates(this);
      loadRemote(this, "date");
      if (renderStates(this, "survey")) return;
      const date = remoteData(this, "date");
      Array.from(this.childNodes).forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) { if (n.textContent.trim() === "Surveyed" || n.textContent.trim() === "·") n.remove(); }
        else if (n.classList && (n.classList.contains("c-survey__value") || n.classList.contains("c-survey__sep"))) n.remove();
      });
      const rDate = date || (this._remoteData && this._remoteData.date);
      const instrument = this.getAttribute("instrument") || (this._remoteData && this._remoteData.instrument);
      if (!rDate) {
        renderEmpty(this, "survey");
        return;
      }
      const v = document.createElement("span");
      v.className = "c-survey__value";
      v.textContent = rDate;
      this.appendChild(document.createTextNode("Surveyed "));
      this.appendChild(v);
      if (instrument) {
        const sep = document.createElement("span");
        sep.className = "c-survey__sep";
        sep.textContent = "·";
        this.appendChild(sep);
        const v2 = document.createElement("span");
        v2.className = "c-survey__value";
        v2.textContent = instrument;
        this.appendChild(v2);
      }
    }
  }
define("contour-survey", ContourSurvey);
/**
 * Threshold: web component wrapper.
 * Attributes: `label`, `norm`, `state`, `value`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourThreshold extends ContourBase {
    static get observed() { return ["label", "norm", "state", "value", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, norm: { attribute: "norm" }, state: { attribute: "state" }, value: { attribute: "value" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-threshold");
      wireStates(this);
      loadRemote(this, "value");
      if (renderStates(this, "threshold")) return;
      const pct = (v) => { const n = Number(v); if (!Number.isFinite(n)) return String(v); return (n <= 1 ? n * 100 : n) + "%"; };
      const rValue = remoteData(this, "value") || (this._remoteData && this._remoteData.value);
      const target = this.getAttribute("norm") || (this._remoteData && this._remoteData.norm);
      const state = this.getAttribute("state") || (this._remoteData && this._remoteData.state);
      const label = this.getAttribute("label") || (this._remoteData && this._remoteData.label);
      if (!rValue && !target && !label) {
        renderEmpty(this, "threshold");
        return;
      }
      if (rValue) {
        const v = this.ensure(".c-threshold__fill", () => { const el = document.createElement("span"); el.className = "c-threshold__fill"; return el; });
        v.style.setProperty("--value", pct(rValue));
      } else {
        const v = this.querySelector(".c-threshold__fill");
        if (v) v.remove();
      }
      if (target) {
        const t = this.ensure(".c-threshold__target", () => { const el = document.createElement("span"); el.className = "c-threshold__target"; return el; });
        t.style.setProperty("--target", pct(target));
      } else {
        const t = this.querySelector(".c-threshold__target");
        if (t) t.remove();
      }
      if (state) this.setAttribute("data-state", state);
      else this.removeAttribute("data-state");
      if (label) this.setAttribute("aria-label", label);
    }
  }
define("contour-threshold", ContourThreshold);
/**
 * Metrics Full: web component wrapper.
 * Attributes: `items`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourMetricsFull extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-metrics");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "metrics")) return;
      const items = remoteData(this, "items");
      // Drop previously generated items so re-render doesn't stack.
      Array.from(this.querySelectorAll(".c-metrics__item")).forEach((n) => n.remove());
      let parsed = null;
      if (items) { try { parsed = JSON.parse(items); } catch (e) { parsed = null; } }
      if (Array.isArray(parsed) && parsed.length) {
        parsed.forEach((it) => {
          const item = document.createElement("div");
          item.className = "c-metrics__item";
          const v = document.createElement("div");
          v.className = "c-metrics__value";
          v.textContent = (typeof it === "object" && it !== null) ? (it.value ?? it.v ?? "") : String(it);
          const l = document.createElement("div");
          l.className = "c-metrics__label";
          l.textContent = (typeof it === "object" && it !== null) ? (it.label ?? it.l ?? "") : "";
          item.appendChild(v);
          item.appendChild(l);
          this.appendChild(item);
        });
      } else if (!items) {
        renderEmpty(this, "metrics");
      }
    }
    enhance() { wireStates(this); }
  }
  define("contour-metrics", ContourMetricsFull);
/**
 * Legend: web component wrapper.
 * Attributes: `title`, `ramp`, `scale`, `items`, `method`, `norm`, `selectable`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`, `glyphs`, `thresholds`, `breaks`, `no-data-color`, `size`, `table`, `classification`, `audit`, `continuous`, `ends`, `caption`.
 */
class ContourLegend extends ContourBase {
    static get observed() { return ["title", "ramp", "scale", "items", "method", "norm", "selectable", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "glyphs", "thresholds", "breaks", "no-data-color", "size", "table", "classification", "audit", "continuous", "ends", "caption"]; }
    static get properties() { return { title: { attribute: "title" }, ramp: { attribute: "ramp" }, scale: { attribute: "scale" }, items: { attribute: "items" }, method: { attribute: "method" }, norm: { attribute: "norm" }, selectable: { attribute: "selectable", type: Boolean }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-legend");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "legend")) return;
      // Selectable legends (BY-41): items become toggle buttons with
      // aria-pressed, and the sheet's existing `.c-legend--interactive` rules
      // (hover, dim when pressed=false) apply.
      const selectable = this.hasAttribute("selectable");
      // Slotted content support: authored .c-legend__item children take
      // precedence over the JSON `items` attribute.
      const authoredLegendItems = Array.from(this.querySelectorAll(":scope > .c-legend__item"));
      let items = remoteData(this, "items");
      if (authoredLegendItems.length) {
        items = JSON.stringify(authoredLegendItems.map((el) => {
          const sw = el.querySelector(".c-legend__swatch");
          const lbl = el.querySelector(".c-legend__label") || el;
          return { label: lbl ? lbl.textContent.trim() : el.textContent.trim(), color: sw ? (sw.dataset && sw.dataset.color) || sw.style.background || undefined : undefined };
        }));
        authoredLegendItems.forEach((el) => el.remove());
      }
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-legend__title", () => { const el = document.createElement("div"); el.className = "c-legend__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-legend__title");
        if (t) t.remove();
      }
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const list = this.ensure(".c-legend__items", () => { const el = document.createElement("div"); el.className = "c-legend__items"; return el; });
          list.setAttribute("role", "listbox");
          if (title) list.setAttribute("aria-label", title);
          list.innerHTML = "";
          parsed.forEach((it) => {
            const label = typeof it === "string" ? it : (it.label || String(it));
            const key = typeof it === "string" ? it : (it.key || it.label || String(it));
            const item = document.createElement("div");
            item.className = "c-legend__item";
            item.setAttribute("tabindex", "-1");
            if (selectable) {
              item.setAttribute("role", "option");
              item.setAttribute("aria-selected", "true");
              item.dataset.key = key;
            } else {
              item.setAttribute("role", "option");
              item.setAttribute("aria-selected", "false");
            }
            const sw = document.createElement("span");
            sw.className = "c-legend__swatch";
            if (it && it.color) { sw.style.background = it.color; sw.dataset.color = it.color; }
            item.appendChild(sw);
            // geometry glyph
             const glyphShape = (it && (it.shape || it.marker || it.glyph)) || this.getAttribute("glyphs");
             if (glyphShape) {
               const g = document.createElement("span");
               g.className = "c-legend__glyph";
               g.setAttribute("part", "glyph");
               g.textContent = glyphShape === "circle" ? "●" : glyphShape === "square" ? "■" : glyphShape === "triangle" ? "▲" : glyphShape === "diamond" ? "◆" : glyphShape === "star" ? "★" : String(glyphShape);
               if (it && it.size != null) g.style.fontSize = (typeof it.size === "number" ? it.size + "px" : String(it.size));
               item.appendChild(g);
             }
            // threshold break marker
            if (it && it.break != null) {
              const b = document.createElement("span");
              b.className = "c-legend__break";
              b.textContent = String(it.break);
              item.appendChild(b);
            }
             const lbl = document.createElement("span");
             lbl.textContent = label;
             item.appendChild(lbl);
             // caption (source-and-method line)
             const caption = (typeof it === "object" && it) ? (it.caption || it.note || "") : "";
             if (caption) {
               const cap = document.createElement("span");
               cap.className = "c-legend__caption";
               cap.textContent = caption;
               item.appendChild(cap);
             }
             // threshold mark: outline on swatches that begin at a threshold
             if (it && (it.threshold || it.break != null)) {
               sw.style.outline = "2px solid var(--color-border-strong)";
             }
            list.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      } else {
        const list = this.querySelector(".c-legend__items");
        if (list) list.remove();
        const hasOther = this.getAttribute("title") || this.getAttribute("ramp") || this.getAttribute("scale") || this.getAttribute("method") || this.getAttribute("norm");
        if (!hasOther) {
          renderEmpty(this, "legend");
        }
      }
       // caption as option description (aria-describedby), not part of name
       const caption = this.getAttribute("caption");
       let captionEl = this.querySelector(".c-legend__caption");
       if (caption) {
         if (!captionEl) { captionEl = document.createElement("span"); captionEl.className = "c-legend__caption"; this.appendChild(captionEl); }
         captionEl.id = captionEl.id || ("legend-caption-" + Math.random().toString(36).slice(2));
         captionEl.textContent = caption;
         captionEl.style.position = "absolute"; captionEl.style.width = "1px"; captionEl.style.height = "1px"; captionEl.style.overflow = "hidden"; captionEl.style.clip = "rect(0,0,0,0)";
       } else if (captionEl) {
         captionEl.remove();
       }
       // single tab stop: first option
       const _items = this.querySelector(".c-legend__items");
       if (_items) {
         const opts = Array.from(_items.querySelectorAll(".c-legend__item"));
         opts.forEach((o, i) => o.setAttribute("tabindex", i === 0 ? "0" : "-1"));
         if (captionEl) opts.forEach((o) => o.setAttribute("aria-describedby", captionEl.id));
       }
       // no-data entry from palette / no-data-color
       const ndColor = this.getAttribute("no-data-color");
       if (ndColor) {
         let nd = this.querySelector(".c-legend__no-data");
         if (!nd) { nd = document.createElement("div"); nd.className = "c-legend__no-data"; this.appendChild(nd); }
         nd.setAttribute("part", "no-data");
         nd.textContent = "No data";
         const glyph = document.createElement("span");
         glyph.className = "glyph";
         glyph.style.background = ndColor;
         glyph.dataset.color = ndColor;
         nd.prepend(glyph);
       } else {
         const nd = this.querySelector(".c-legend__no-data");
         if (nd) nd.remove();
       }
       // audit notice
       const audit = this.getAttribute("audit");
       if (audit) {
         const a = this.ensure(".c-legend__audit", () => { const el = document.createElement("div"); el.className = "c-legend__audit"; return el; });
         a.textContent = audit;
       } else {
         const a = this.querySelector(".c-legend__audit");
         if (a) a.remove();
       }
       // continuous variant: ramp with two ends labelled
       if (this.hasAttribute("continuous")) {
         const ends = this.getAttribute("ends");
         let parsedEnds = null;
         if (ends) { try { parsedEnds = JSON.parse(ends); } catch (e) { parsedEnds = ends.split(","); } }
         if (Array.isArray(parsedEnds) && parsedEnds.length >= 2) {
           const r = this.ensure(".c-legend__ramp", () => { const el = document.createElement("div"); el.className = "c-legend__ramp"; return el; });
           // labels
           let left = this.querySelector(".c-legend__ramp-label--start");
           if (!left) { left = document.createElement("span"); left.className = "c-legend__ramp-label c-legend__ramp-label--start"; r.appendChild(left); }
           left.textContent = parsedEnds[0];
           let right = this.querySelector(".c-legend__ramp-label--end");
           if (!right) { right = document.createElement("span"); right.className = "c-legend__ramp-label c-legend__ramp-label--end"; r.appendChild(right); }
           right.textContent = parsedEnds[parsedEnds.length - 1];
         }
       }
       // size variant: differently-sized glyphs
       const sizeAttr = this.getAttribute("size");
       if (sizeAttr) {
         const sc = this.ensure(".c-legend__size", () => { const el = document.createElement("div"); el.className = "c-legend__size"; return el; });
         sc.textContent = sizeAttr;
       } else {
         const sc = this.querySelector(".c-legend__size");
         if (sc) sc.remove();
       }
       // classification line
       const classification = this.getAttribute("classification");
       if (classification) {
         const c = this.ensure(".c-legend__classification", () => { const el = document.createElement("div"); el.className = "c-legend__classification"; return el; });
         c.textContent = classification;
       } else {
         const c = this.querySelector(".c-legend__classification");
         if (c) c.remove();
       }
       // data table (collapsible)
       const tableAttr = this.getAttribute("table");
       if (tableAttr) {
         let parsed = null;
         try { parsed = JSON.parse(tableAttr); } catch (e) { parsed = null; }
         if (Array.isArray(parsed)) {
           let det = this.querySelector(".c-legend__table-wrap");
           if (!det) { det = document.createElement("details"); det.className = "c-legend__table-wrap"; this.appendChild(det); }
           det.innerHTML = "";
           const sum = document.createElement("summary"); sum.textContent = "Data table"; det.appendChild(sum);
           const tbl = document.createElement("table"); tbl.className = "c-legend__table";
           const tbody = document.createElement("tbody");
           parsed.forEach((row) => {
             const tr = document.createElement("tr");
             const cells = Array.isArray(row) ? row : [row.label ?? row.key ?? "", row.value ?? ""];
             cells.forEach((cell) => { const td = document.createElement("td"); td.textContent = cell; tr.appendChild(td); });
             tbody.appendChild(tr);
           });
           tbl.appendChild(tbody);
           det.appendChild(tbl);
         }
       } else {
         const det = this.querySelector(".c-legend__table-wrap");
         if (det) det.remove();
       }
       // size variant on glyphs
       if (items) {
         // apply size to glyphs already rendered? handled below via re-render not needed
       }
       const method = this.getAttribute("method");
      if (method) {
        const m = this.ensure(".c-legend__method", () => { const el = document.createElement("div"); el.className = "c-legend__method"; return el; });
        m.textContent = method;
      } else {
        const m = this.querySelector(".c-legend__method");
        if (m) m.remove();
      }
      const norm = this.getAttribute("norm");
      if (norm) {
        const n = this.ensure(".c-legend__norm", () => { const el = document.createElement("span"); el.className = "c-legend__norm"; return el; });
        n.textContent = norm;
      } else {
        const n = this.querySelector(".c-legend__norm");
        if (n) n.remove();
      }
       const ramp = this.getAttribute("ramp");
       if (ramp) {
         const r = this.ensure(".c-legend__ramp", () => { const el = document.createElement("div"); el.className = "c-legend__ramp"; return el; });
         r.style.background = ramp;
         // ramp routing: equal-width segments with break labels
         const breaksAttr = this.getAttribute("breaks");
         if (breaksAttr) {
           let breaks = null;
           try { breaks = JSON.parse(breaksAttr); } catch (e) { breaks = breaksAttr.split(",").map((s) => s.trim()); }
           if (Array.isArray(breaks)) {
             // remove old segments
             Array.from(r.querySelectorAll(".c-legend__ramp-segment")).forEach((n) => n.remove());
             breaks.forEach((b, i) => {
               const seg = document.createElement("span");
               seg.className = "c-legend__ramp-segment";
               seg.style.flex = "1";
               const lbl = document.createElement("span");
               lbl.className = "c-legend__ramp-break";
               lbl.textContent = String(b);
               seg.appendChild(lbl);
               r.appendChild(seg);
             });
           }
         }
       } else {
         const r = this.querySelector(".c-legend__ramp");
         if (r) r.remove();
       }
      const scale = this.getAttribute("scale");
      if (scale) {
        const sc = this.ensure(".c-legend__scale", () => { const el = document.createElement("div"); el.className = "c-legend__scale"; return el; });
        sc.textContent = scale;
      } else {
        const sc = this.querySelector(".c-legend__scale");
        if (sc) sc.remove();
      }
    }
    enhance() {
      if (this._wiredLegend) return;
      this._wiredLegend = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-legend__item") : null;
        if (!btn || !this.contains(btn)) return;
        const selected = btn.getAttribute("aria-selected") !== "true";
        btn.setAttribute("aria-selected", String(selected));
        this.dispatchEvent(new CustomEvent("contour:legend-toggle", {
          detail: { label: btn.textContent.trim(), key: btn.dataset.key || btn.textContent.trim(), pressed: selected },
          bubbles: true,
          composed: true,
        }));
        this.dispatchEvent(new CustomEvent("contour:select", {
          detail: { label: btn.textContent.trim(), key: btn.dataset.key || btn.textContent.trim(), value: btn.dataset.key || btn.textContent.trim() },
          bubbles: true,
          composed: true,
        }));
      });
      // emit style-resolved once on enhance
      try {
        let parsed = null;
        try { parsed = JSON.parse(this.getAttribute("items") || "null"); } catch (e) { parsed = this.getAttribute("items"); }
        this.dispatchEvent(new CustomEvent("contour:style-resolved", { detail: { value: this.getAttribute("items"), items: parsed }, bubbles: true, composed: true }));
      } catch (e) {}
      // break-change delegated
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && t.classList && t.classList.contains("c-legend__break-input")) {
          this.dispatchEvent(new CustomEvent("contour:break-change", { detail: { value: t.value }, bubbles: true, composed: true }));
        }
      });
      // keyboard nav (listbox)
      this.addEventListener("keydown", (e) => {
        const items = Array.from(this.querySelectorAll(".c-legend__item"));
        if (!items.length) return;
        const idx = items.indexOf(document.activeElement);
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          const next = items[(idx + 1) % items.length];
          if (next) { next.focus(); items.forEach((o,i)=>o.setAttribute("tabindex", o===next?"0":"-1")); }
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          const prev = items[(idx - 1 + items.length) % items.length];
          if (prev) { prev.focus(); items.forEach((o)=>o.setAttribute("tabindex", o===prev?"0":"-1")); }
        } else if (e.key === "Home") {
          if (items.length > 4) { e.preventDefault(); items[0].focus(); items.forEach((o,i)=>o.setAttribute("tabindex", i===0?"0":"-1")); }
        } else if (e.key === "End") {
          if (items.length > 4) { e.preventDefault(); const last = items[items.length-1]; last.focus(); items.forEach((o)=>o.setAttribute("tabindex", o===last?"0":"-1")); }
        } else if (e.key === "Escape") {
          // clear selection
          items.forEach((o) => { if (o.getAttribute("role") === "option") o.setAttribute("aria-selected", "false"); else o.setAttribute("aria-pressed", "false"); });
          this.dispatchEvent(new CustomEvent("contour:clear", { bubbles: true, composed: true }));
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          // type-ahead
          if (items.length > 7) {
            const start = idx >= 0 ? idx + 1 : 0;
            for (let i = 0; i < items.length; i++) {
              const ii = (start + i) % items.length;
              const txt = (items[ii].textContent || "").trim().toLowerCase();
              if (txt.startsWith(e.key.toLowerCase())) {
                e.preventDefault();
                items[ii].focus();
                items.forEach((o,j)=>o.setAttribute("tabindex", j===ii?"0":"-1"));
                break;
              }
            }
          }
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (document.activeElement && document.activeElement.classList.contains("c-legend__item")) {
            document.activeElement.click();
          }
        }
      });
    }
  }
define("contour-legend", ContourLegend);
/**
 * Measure: web component wrapper.
 * Attributes: `label`, `value`, `point`, `line`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourMeasure extends ContourBase {
    static get observed() { return ["label", "value", "point", "line", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" }, point: { attribute: "point" }, line: { attribute: "line" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-measure");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Measure");
      wireStates(this);
      loadRemote(this, ["label", "value", "point", "line"]);
      if (renderStates(this, "measure")) return;
      const rLabel = remoteData(this, "label");
      const rValue = remoteData(this, "value");
      const rPoint = remoteData(this, "point");
      const rLine = remoteData(this, "line");
      if (!rLabel && !rValue && !rPoint && !rLine) {
        renderEmpty(this, "measure");
        return;
      }
      if (rLabel) {
        const l = this.ensure(".c-measure__label", () => { const el = document.createElement("span"); el.className = "c-measure__label"; return el; });
        l.textContent = rLabel;
      } else {
        const l = this.querySelector(".c-measure__label");
        if (l) l.remove();
      }
      if (rValue) {
        const r = this.ensure(".c-measure__readout", () => { const el = document.createElement("span"); el.className = "c-measure__readout"; return el; });
        r.textContent = rValue;
      } else {
        const r = this.querySelector(".c-measure__readout");
        if (r) r.remove();
      }
      // unit selector
      let sel = this.querySelector(".c-measure__unit-select");
      if (!sel) { sel = document.createElement("select"); sel.className = "c-measure__unit-select"; this.appendChild(sel); }
      ["m","km","mi","ft"].forEach((u) => {
        if (!sel.querySelector('option[value="' + u + '"]')) { const o = document.createElement("option"); o.value = u; o.textContent = u; sel.appendChild(o); }
      });
      if (rPoint) {
        const p = this.ensure(".c-measure__point", () => { const el = document.createElement("span"); el.className = "c-measure__point"; return el; });
        p.textContent = rPoint;
      } else {
        const p = this.querySelector(".c-measure__point");
        if (p) p.remove();
      }
      if (!rLine) {
        const svg = this.querySelector("svg");
        if (svg) svg.remove();
        return;
      }
      if (rLine) {
        const ln = this.ensure(".c-measure__line", () => { const el = document.createElement("span"); el.className = "c-measure__line"; return el; });
        ln.style.inlineSize = rLine;
      } else {
        const ln = this.querySelector(".c-measure__line");
        if (ln) ln.remove();
      }
    }
    enhance() {
      if (this._wiredMeasure) return;
      this._wiredMeasure = true;
      this.addEventListener("change", (e) => {
        const sel = e.target && e.target.closest ? e.target.closest(".c-measure__unit-select") : null;
        if (sel && this.contains(sel)) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { unit: sel.value } }));
        }
      });
    }
  }
define("contour-measure", ContourMeasure);
/**
 * Timeline: web component wrapper.
 * Attributes: `items`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourTimeline extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-timeline");
      this.setAttribute("role", "list");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "timeline")) return;
      const authored = Array.from(this.children).filter((n) => n.classList && n.classList.contains("c-timeline__item"));
      const items = remoteData(this, "items");
      if (items && !authored.length) {
        Array.from(this.querySelectorAll(".c-timeline__item")).forEach((n) => n.remove());
        try {
          const parsed = JSON.parse(items);
          parsed.forEach((it) => {
            const item = document.createElement("div");
            item.className = "c-timeline__item";
            item.setAttribute("role", "listitem");
            item.setAttribute("tabindex", "-1");
            if (it.time) {
              const t = document.createElement("time");
              t.className = "c-timeline__time";
              t.textContent = it.time;
              item.appendChild(t);
            }
            if (it.title) {
              const ti = document.createElement("div");
              ti.className = "c-timeline__title";
              ti.textContent = it.title;
              item.appendChild(ti);
            }
            if (it.text) {
              const tx = document.createElement("div");
              tx.className = "c-timeline__text";
              tx.textContent = it.text;
              item.appendChild(tx);
            }
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      } else if (!authored.length) {
        renderEmpty(this, "timeline");
      }
     }
     enhance() {
       if (this._wiredTimeline) return;
       this._wiredTimeline = true;
       const items = Array.from(this.querySelectorAll(".c-timeline__item"));
       items.forEach((it, i) => it.setAttribute("tabindex", i === 0 ? "0" : "-1"));
       this.addEventListener("click", (e) => {
         const item = e.target && e.target.closest ? e.target.closest(".c-timeline__item") : null;
         if (!item || !this.contains(item)) return;
         const items = Array.from(this.querySelectorAll(".c-timeline__item"));
         const idx = items.indexOf(item);
         this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: idx } }));
       });
       this.addEventListener("keydown", (e) => {
         const items = Array.from(this.querySelectorAll(".c-timeline__item"));
         if (!items.length) return;
         const active = this.querySelector(".c-timeline__item:focus") || items[0];
         const idx = items.indexOf(active);
         let next = -1;
         if (e.key === "ArrowDown") next = Math.min(idx + 1, items.length - 1);
         else if (e.key === "ArrowUp") next = Math.max(idx - 1, 0);
         else if (e.key === "Home") next = 0;
         else if (e.key === "End") next = items.length - 1;
         else if (e.key === "Enter" || e.key === " ") {
           e.preventDefault();
           this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: idx } }));
           return;
         }
         if (next < 0 || next === idx) return;
         e.preventDefault();
         items.forEach((it, i) => it.setAttribute("tabindex", i === next ? "0" : "-1"));
         try { items[next].focus(); } catch (err) {}
       });
     }
  }
define("contour-timeline", ContourTimeline);
/**
 * Heatmap: web component wrapper.
 * Attributes: `cells`, `count`, `legend`, `empty`, `loading`, `values`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourHeatmap extends ContourBase {
    static get observed() { return ["cells", "count", "legend", "empty", "loading", "values", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { cells: { attribute: "cells" }, count: { attribute: "count" }, legend: { attribute: "legend" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-heatmap");
      if (!this.hasAttribute("role")) this.setAttribute("role", "grid");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Heatmap");
      wireStates(this);
      loadRemote(this, "cells");
      if (renderStates(this, "heatmap")) return;
      // Slotted content support: authored .c-heatmap__cell children take
      // precedence over the generated grid.
      const authoredCells = Array.from(this.querySelectorAll(":scope > .c-heatmap__cell"));
      if (authoredCells.length) {
        const cols = Math.ceil(Math.sqrt(authoredCells.length));
        this.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
        this.style.inlineSize = "16rem";
      } else {
        Array.from(this.querySelectorAll(".c-heatmap__cell")).forEach((n) => n.remove());
        const count = Math.min(200, Math.max(0, parseInt(this.getAttribute("cells") || this.getAttribute("count") || "0", 10) || 0));
        const cols = count > 0 ? Math.ceil(Math.sqrt(count)) : 1;
        this.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
        this.style.inlineSize = "16rem";
        if (count > 0) {
         let values = [];
         try { values = JSON.parse(this.getAttribute("values") || "[]"); } catch (e) { values = []; }
         for (let i = 0; i < count; i++) {
           const cell = document.createElement("div");
           cell.className = "c-heatmap__cell";
           cell.setAttribute("role", "gridcell");
           cell.setAttribute("tabindex", i === 0 ? "0" : "-1");
           cell.dataset.index = String(i);
           if (values[i] !== undefined) cell.setAttribute("title", String(values[i]));
           this.appendChild(cell);
         }
         const tip = this.ensure(".c-heatmap__tooltip", () => { const el = document.createElement("div"); el.className = "c-heatmap__tooltip"; el.setAttribute("role", "tooltip"); el.setAttribute("hidden", ""); return el; });
         tip.setAttribute("hidden", "");
       } else if (!authoredCells.length) {
         renderEmpty(this, "heatmap");
       }
      }
       if (this.hasAttribute("legend")) {
        const leg = this.ensure(".c-heatmap__legend", () => {
          const el = document.createElement("div");
          el.className = "c-heatmap__legend";
          const bar = document.createElement("div");
          bar.className = "c-heatmap__legend-bar";
          el.appendChild(bar);
          return el;
        });
      } else {
        const leg = this.querySelector(".c-heatmap__legend");
        if (leg) leg.remove();
      }
     }
    enhance() {
      if (this._wiredHeatmap) return;
      this._wiredHeatmap = true;
      const cells = () => Array.from(this.querySelectorAll(".c-heatmap__cell"));
      // The tip is rebuilt on every render (the base wipes generated children),
      // so handlers re-query it per event (rule 12) — a captured node would be
      // detached after the first re-render and the tooltip would silently die.
      const showTip = (e) => {
        const tip = this.querySelector(".c-heatmap__tooltip");
        if (!tip) return;
        const cell = e.target && e.target.closest ? e.target.closest(".c-heatmap__cell") : null;
        if (!cell || !this.contains(cell)) { tip.setAttribute("hidden", ""); return; }
        const title = cell.getAttribute("title");
        if (title) tip.textContent = title;
        else tip.textContent = "Cell " + (cell.dataset.index || "");
        const rect = this.getBoundingClientRect();
        const cr = cell.getBoundingClientRect();
        this.style.position = this.style.position || "relative";
        // Logical positioning (BY-48): the CSS positions the tip through the
        // --chart-tip-* tokens, the same contract the chart tooltip uses, so
        // the block flips with dir="rtl" instead of staying pinned to the
        // physical left edge of an RTL host.
        tip.style.setProperty("--chart-tip-inline-start", (cr.left - rect.left + cr.width / 2) + "px");
        tip.style.setProperty("--chart-tip-block-start", (cr.top - rect.top) + "px");
        tip.removeAttribute("hidden");
      };
      const hideTip = () => {
        const tip = this.querySelector(".c-heatmap__tooltip");
        if (tip) tip.setAttribute("hidden", "");
      };
      this.addEventListener("mouseover", showTip);
      this.addEventListener("mouseout", (e) => {
        if (!e.relatedTarget || !this.contains(e.relatedTarget)) hideTip();
       });
      this.addEventListener("focusin", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-heatmap__cell") : null;
        if (cell && this.contains(cell)) showTip({ target: cell });
      });
       this.addEventListener("focusout", (e) => {
         if (!this.contains(e.relatedTarget)) hideTip();
        });
       this.addEventListener("keydown", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-heatmap__cell") : null;
        if (!cell || !this.contains(cell)) return;
        const list = cells();
        const idx = list.indexOf(cell);
        let next = -1;
        const rtl = (this.getAttribute("dir") || document.documentElement.getAttribute("dir") || "").toLowerCase() === "rtl";
        if (e.key === "ArrowRight") next = rtl ? Math.max(idx - 1, 0) : Math.min(idx + 1, list.length - 1);
        else if (e.key === "ArrowLeft") next = rtl ? Math.min(idx + 1, list.length - 1) : Math.max(idx - 1, 0);
        else if (e.key === "ArrowDown") next = Math.min(idx + Math.ceil(Math.sqrt(list.length)), list.length - 1);
        else if (e.key === "ArrowUp") next = Math.max(idx - Math.ceil(Math.sqrt(list.length)), 0);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = list.length - 1;
        else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series: 1, index: idx } }));
          return;
        }
        if (next >= 0 && next !== idx) {
          e.preventDefault();
          list.forEach((c, i) => c.setAttribute("tabindex", i === next ? "0" : "-1"));
          try { list[next].focus(); } catch (e) {}
        }
      });
      this.addEventListener("click", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-heatmap__cell") : null;
        if (!cell || !this.contains(cell)) return;
        const idx = cells().indexOf(cell);
        if (idx >= 0) this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series: 1, index: idx } }));
      });
    }
  }
define("contour-heatmap", ContourHeatmap);
/**
 * Compare: web component wrapper.
 * Attributes: `no`, `text`, `yes`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourCompare extends ContourBase {
    static get observed() { return ["no", "text", "yes", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { no: { attribute: "no" }, text: { attribute: "text" }, yes: { attribute: "yes" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-compare");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Comparison");
      this.style.padding = "var(--space-md)";
      wireStates(this);
      loadRemote(this, ["no", "text", "yes"]);
      if (renderStates(this, "compare")) return;
      const rYes = remoteData(this, "yes") || (this._remoteData && this._remoteData.yes);
      const rNo = remoteData(this, "no") || (this._remoteData && this._remoteData.no);
      const rText = remoteData(this, "text") || (this._remoteData && this._remoteData.text);
      Array.from(this.querySelectorAll(".c-compare__yes, .c-compare__no, .c-compare__text")).forEach((n) => n.remove());
      if (rYes) {
        const y = document.createElement("span");
        y.className = "c-compare__yes";
        y.innerHTML = '<svg aria-hidden="true"><use href="#i-check" /></svg>';
        this.appendChild(y);
      }
      if (rNo) {
        const n = document.createElement("div");
        n.className = "c-compare__no";
        n.textContent = rNo;
        this.appendChild(n);
      }
      if (rText) {
        const t = document.createElement("p");
        t.className = "c-compare__text";
        t.textContent = rText;
        this.appendChild(t);
      }
      if (!rYes && !rNo && !rText) {
        renderEmpty(this, "compare");
      }
    }
  }
define("contour-compare", ContourCompare);
/**
 * Sparkline: web component wrapper.
 * Attributes: `points`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourSparkline extends ContourBase {
    static get observed() { return ["points", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { points: { attribute: "points" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-sparkline");
      if (!this.hasAttribute("role")) this.setAttribute("role", "img");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Sparkline");
      wireStates(this);
      loadRemote(this, "points");
      if (renderStates(this, "sparkline")) return;
      const points = remoteData(this, "points");
      if (points) {
        try {
          const parsed = JSON.parse(points);
          if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("empty");
          Array.from(this.querySelectorAll(".c-sparkline__dot, .c-sparkline__line, .c-sparkline__area")).forEach((n) => n.remove());
          const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("class", "c-sparkline__line");
          svg.setAttribute("viewBox", "0 0 100 30");
          svg.setAttribute("preserveAspectRatio", "none");
          svg.style.inlineSize = "100%";
          svg.style.blockSize = "100%";
          svg.setAttribute("width", "100%");
          svg.setAttribute("height", "100%");
          svg.setAttribute("title", this.getAttribute("aria-label") || "Sparkline");
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", parsed.map((p, i) => (i === 0 ? "M" : "L") + " " + (i * 100 / (parsed.length - 1)) + " " + (30 - p * 30)).join(" "));
           svg.appendChild(path);
           const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
           dot.setAttribute("class", "c-sparkline__dot");
           dot.setAttribute("r", "2");
           dot.setAttribute("cx", "0");
           dot.setAttribute("cy", "15");
           dot.setAttribute("hidden", "");
           svg.appendChild(dot);
           this.appendChild(svg);
           this._sparkPoints = parsed;
           const tip = this.ensure(".c-sparkline__tooltip", () => { const el = document.createElement("div"); el.className = "c-sparkline__tooltip"; el.setAttribute("role", "tooltip"); el.setAttribute("hidden", ""); return el; });
           tip.setAttribute("hidden", "");
        } catch (e) {
           Array.from(this.querySelectorAll("svg")).forEach((n) => n.remove());
           renderEmpty(this, "sparkline");
        }
      } else {
        renderEmpty(this, "sparkline");
      }
    }
    enhance() {
      if (this._wiredSparkline) return;
      this._wiredSparkline = true;
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      // The svg, dot and tip are rebuilt on every render (the base wipes
      // generated children), so the handlers re-query them per event (rule 12);
      // a capture made at wiring time is a detached node the moment the first
      // attribute changes, and every tooltip after that writes into limbo.
      const showTip = (e) => {
        const svg = this.querySelector("svg");
        const tip = this.querySelector(".c-sparkline__tooltip");
        const dot = this.querySelector(".c-sparkline__dot");
        if (!tip || !svg) return;
        const rect = svg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        const pts = this._sparkPoints || [];
        if (pts.length === 0) return;
        const idx = Math.round(pct * (pts.length - 1));
        const val = pts[idx];
        const cx = (idx * 100 / (pts.length - 1));
        const cy = 30 - val * 30;
        if (dot) {
          dot.setAttribute("cx", String(cx));
          dot.setAttribute("cy", String(cy));
          dot.removeAttribute("hidden");
        }
        tip.textContent = String(val);
        const tipX = (cx / 100) * rect.width;
        // Logical positioning (BY-48): same token contract as the heatmap and
        // the chart tooltip, so the pointer-tracking tip stays inside the
        // block in an RTL layout rather than being measured from the left.
        tip.style.setProperty("--chart-tip-inline-start", tipX + "px");
        tip.style.setProperty("--chart-tip-block-start", "0px");
        tip.removeAttribute("hidden");
      };
      const hideTip = () => {
        const tip = this.querySelector(".c-sparkline__tooltip");
        const dot = this.querySelector(".c-sparkline__dot");
        if (tip) tip.setAttribute("hidden", "");
        if (dot) dot.setAttribute("hidden", "");
      };
      this.addEventListener("mousemove", showTip);
       this.addEventListener("mouseleave", hideTip);
       // Keyboard path (BY-39): the host carries tabindex; a focused sparkline
      // shows its last value, which is the point a keyboard reader can reach.
      this.addEventListener("focusin", () => {
        const pts = this._sparkPoints || [];
        if (!pts.length) return;
        const svg = this.querySelector("svg");
        if (!svg) return;
        const r = svg.getBoundingClientRect();
        showTip({ clientX: r.left + r.width - 1 });
      });
        this.addEventListener("focusout", hideTip);
       this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series: 1 } }));
        }
      });
    }
  }
define("contour-sparkline", ContourSparkline);
/**
 * Chart Grid: web component wrapper.
 * Attributes: `title`, `series`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourChartGrid extends ContourBase {
    static get updateMode() { return "keyed"; }
    static get observed() { return ["title", "series", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { title: { attribute: "title" }, series: { attribute: "series" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-chart-grid");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Chart grid");
      wireStates(this);
      loadRemote(this, "series");
      if (renderStates(this, "chart-grid")) return;
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-chart-grid__title", () => { const el = document.createElement("div"); el.className = "c-chart-grid__title"; return el; });
        t.textContent = title;
      }
      const series = remoteData(this, "series");
      if (!series && !title) renderEmpty(this, "chart-grid");
    }
  }
  define("contour-chart-grid", ContourChartGrid);
/**
 * Contour Plot: web component wrapper.
 * Attributes: `axis`, `label`.
 */
class ContourContourPlot extends ContourBase {
    static get observed() { return ["axis", "label"]; }
    static get properties() { return { axis: { attribute: "axis" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-contour-plot");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Contour plot");
      const axis = this.getAttribute("axis");
      if (axis) {
        let svg = this.querySelector("svg");
        if (!svg) {
          svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("viewBox", "0 0 100 100");
          svg.setAttribute("aria-hidden", "true");
          this.appendChild(svg);
        }
        let ax = svg.querySelector(".c-contour-plot__axis");
        if (!ax) {
          ax = document.createElementNS("http://www.w3.org/2000/svg", "line");
          ax.setAttribute("class", "c-contour-plot__axis");
          svg.appendChild(ax);
        }
      }
      const label = this.getAttribute("label");
      if (label) {
        let svg = this.querySelector("svg");
        if (!svg) {
          svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("viewBox", "0 0 100 100");
          svg.setAttribute("aria-hidden", "true");
          this.appendChild(svg);
        }
        let lbl = svg.querySelector(".c-contour-plot__label");
        if (!lbl) {
          lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
          lbl.setAttribute("class", "c-contour-plot__label");
          svg.appendChild(lbl);
        }
        lbl.textContent = label;
      }
    }
  }
/**
 * Error Boundary: web component wrapper.
 * Attributes: `fallback`, `error`.
 */
class ContourErrorBoundary extends ContourBase {
    static get observed() { return ["fallback", "error"]; }
    static get properties() { return { fallback: { attribute: "fallback" }, error: { attribute: "error" } }; }
    render() {
      this.classList.add("c-error-boundary");
      this.setAttribute("role", "region");
      this.setAttribute("aria-live", "polite");
      const err = this.getAttribute("error");
      if (err) {
        this.dataset.state = "error";
        // Hide authored children, show fallback.
        Array.from(this.children).forEach((c) => { if (!c.hasAttribute("data-fallback")) c.style.display = "none"; });
        let fb = this.querySelector("[data-fallback]");
        if (!fb) {
          fb = document.createElement("div");
          fb.className = "c-error-boundary__fallback";
          fb.dataset.fallback = "";
          fb.textContent = this.getAttribute("fallback") || "Something went wrong.";
          this.appendChild(fb);
        } else {
          fb.textContent = this.getAttribute("fallback") || fb.textContent || "Something went wrong.";
        }
      } else {
        this.dataset.state = "ready";
        Array.from(this.children).forEach((c) => { c.style.display = ""; });
        const fb = this.querySelector("[data-fallback]");
        if (fb) fb.remove();
      }
    }
    enhance() {
      if (this._wiredErrorBoundary) return;
      this._wiredErrorBoundary = true;
      // Catch errors thrown by descendants during render/event handling.
      this.addEventListener("error", (e) => {
        e.stopPropagation();
        const msg = (e && e.error && e.error.message) ? e.error.message : (e && e.message) ? e.message : "Unknown error";
        this.setAttribute("error", msg);
      }, true);
    }
  }
  define("contour-error-boundary", ContourErrorBoundary);



class ContourDocsNav extends ContourBase {
    static get observed() { return ["items", "title", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, title: { attribute: "title" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-docs-nav");
      this.setAttribute("role", "navigation");
      const title = this.getAttribute("title");
      if (title) this.setAttribute("aria-label", title);
      else this.setAttribute("aria-label", "Documentation navigation");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "docs-nav")) return;
      const _remote = remoteData(this, "items");
      const items = this.hasAttribute("src") ? _remote : (_remote || (this.hasAttribute("items") ? this.getAttribute("items") : null));
      const list = this.querySelector(".c-docs-nav__list");
      const authored = list ? Array.from(list.children).filter((n) => n.classList && n.classList.contains("c-docs-nav__group")) : [];
      if (items && !authored.length) {
        try {
          const parsed = JSON.parse(items);
          const list = this.ensure(".c-docs-nav__list", () => { const el = document.createElement("div"); el.className = "c-docs-nav__list"; return el; });
          list.innerHTML = "";
          parsed.forEach((g) => {
            const group = document.createElement("div");
            group.className = "c-docs-nav__group";
            if (g.title) {
              const gt = document.createElement("div");
              gt.className = "c-docs-nav__group-title";
              gt.textContent = g.title;
              group.appendChild(gt);
            }
            const ul = document.createElement("div");
            ul.className = "c-docs-nav__list";
            (g.links || g.items || []).forEach((l) => {
              const a = document.createElement("a");
              a.className = "c-docs-nav__link";
              a.href = (typeof l === "string" ? "#" : (l.href || "#"));
              const label = typeof l === "string" ? l : (l.label || l);
              if (typeof l === "object" && l !== null && l.badge) {
                const b = document.createElement("span");
                b.className = "c-docs-nav__badge";
                b.textContent = l.badge;
                a.appendChild(b);
              }
              a.appendChild(document.createTextNode(label));
              if (typeof l === "object" && l !== null && l.chevron) {
                const ch = document.createElement("span");
                ch.className = "c-docs-nav__chevron";
                ch.textContent = l.chevron;
                a.appendChild(ch);
              }
              if (typeof l === "object" && l !== null && Array.isArray(l.items)) {
                a.classList.add("c-docs-nav__link--nested");
                const nested = document.createElement("div");
                nested.className = "c-docs-nav__list c-docs-nav__list--nested";
                l.items.forEach((nl) => {
                  const na = document.createElement("a");
                  na.className = "c-docs-nav__link";
                  na.href = (typeof nl === "string" ? "#" : (nl.href || "#"));
                  na.textContent = typeof nl === "string" ? nl : (nl.label || nl);
                  nested.appendChild(na);
                });
                ul.appendChild(a);
                ul.appendChild(nested);
              } else {
                ul.appendChild(a);
              }
            });
            group.appendChild(ul);
            list.appendChild(group);
          });
        } catch (e) { /* keep existing */ }
      } else if (!items && list) {
        list.remove();
        renderEmpty(this, "docs-nav");
      } else if (!items && !list) {
        renderEmpty(this, "docs-nav");
      }
    }
    enhance() {
      if (this._wiredDocsNav) return;
      this._wiredDocsNav = true;
      this.addEventListener("click", (e) => {
        const link = e.target && e.target.closest ? e.target.closest(".c-docs-nav__link") : null;
        if (link && this.contains(link)) {
          const label = link.textContent || "";
          this.dispatchEvent(new CustomEvent("contour:docs-nav-select", { bubbles: true, composed: true, detail: { label, href: link.getAttribute("href") } }));
        }
      });
    }
  }
  define("contour-docs-nav", ContourDocsNav);
class ContourDocsShell extends ContourBase {
    static get observed() { return ["title", "lede", "article", "heading"]; }
    static get properties() { return { title: { attribute: "title" }, lede: { attribute: "lede" }, article: { attribute: "article" } }; }
    render() {
      this.classList.add("c-docs-shell");
      this.setAttribute("role", "region");
      const title = this.getAttribute("title");
      if (title) {
        const h = this.ensure(".c-docs-shell__title", () => { const el = document.createElement(headingTag(this, "h1")); el.className = "c-docs-shell__title"; return el; });
        h.textContent = title;
        this.setAttribute("aria-label", title);
      } else {
        const h = this.querySelector(".c-docs-shell__title");
        if (h) h.remove();
      }
      const lede = this.getAttribute("lede");
      if (lede) {
        const p = this.ensure(".c-docs-shell__lede", () => { const el = document.createElement("p"); el.className = "c-docs-shell__lede"; return el; });
        p.textContent = lede;
      } else {
        const p = this.querySelector(".c-docs-shell__lede");
        if (p) p.remove();
      }
      const article = this.getAttribute("article");
      if (article) {
        const a = this.ensure(".c-docs-shell__article", () => { const el = document.createElement("article"); el.className = "c-docs-shell__article"; return el; });
        a.innerHTML = sanitizeHtml(article);
      } else {
        const a = this.querySelector(".c-docs-shell__article");
        if (a) a.remove();
      }
    }
  }
  define("contour-docs-shell", ContourDocsShell);


class ContourFileTree extends ContourBase {
    static get updateMode() { return "keyed"; }
    static get observed() { return ["items"]; }
    static get properties() { return { items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-file-tree");
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const renderNode = (node, depth) => {
            const row = document.createElement("div");
            row.className = "c-file-tree__row" + (node.dir ? " c-file-tree__row--dir" : "") + (node.active ? " c-file-tree__row--active" : "");
            row.style.paddingInlineStart = (depth * 1) + "rem";
            const label = document.createElement("span");
            label.textContent = node.label || node.name || "";
            row.appendChild(label);
            this.appendChild(row);
            if (Array.isArray(node.children)) {
              node.children.forEach((c) => renderNode(c, depth + 1));
            }
          };
          // clear generated
          Array.from(this.querySelectorAll(".c-file-tree__row")).forEach((n) => n.remove());
          parsed.forEach((n) => renderNode(n, 0));
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-file-tree", ContourFileTree);




class ContourDialog extends ContourBase {
    static get observed() { return ["title", "size", "heading"]; }
    static get properties() { return { title: { attribute: "title" }, size: { attribute: "size" } }; }
    render() {
      this.classList.add("c-dialog");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-dialog--")) this.classList.remove(c); });
      const size = this.getAttribute("size");
      if (size) this.classList.add("c-dialog--" + size);
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
      const title = this.getAttribute("title");
      let head = this.querySelector(".c-dialog__head");
      if (title) {
        if (!head) {
          head = document.createElement("div");
          head.className = "c-dialog__head";
          const h = document.createElement(headingTag(this, "h2"));
          h.className = "c-dialog__title";
          head.appendChild(h);
          const closeBtn = document.createElement("button");
          closeBtn.className = "c-btn c-btn--icon c-btn--ghost c-dialog__close";
          closeBtn.setAttribute("type", "button");
          closeBtn.setAttribute("aria-label", "Close");
          closeBtn.innerHTML = '<svg aria-hidden="true"><use href="#i-close" /></svg>';
          head.appendChild(closeBtn);
        }
        const h = head.querySelector(".c-dialog__title");
        if (h) { h.textContent = title; if (!h.id) h.id = "contour-dialog-title-" + (this._dialogTitleId = (this._dialogTitleId || 0) + 1); this.setAttribute("aria-labelledby", h.id); }
      }
      if (head && head.parentNode !== this) this.prepend(head);
      // Wrap authored content in a body so it picks up the dialog's padding.
      const body = this.ensure(".c-dialog__body", () => { const el = document.createElement("div"); el.className = "c-dialog__body"; return el; });
      Array.from(this.childNodes).forEach((n) => {
        if (n === body || n === head) return;
        if (n.nodeType === 1 && n.classList && n.classList.contains("c-dialog__head")) return;
        body.appendChild(n);
      });
      if (head && head.parentNode === this) {
        if (body.parentNode !== this) this.insertBefore(body, head.nextSibling);
        else if (head.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_PRECEDING) this.insertBefore(body, head.nextSibling);
      } else {
        if (body.parentNode !== this) this.appendChild(body);
      }
    }
    enhance() {
      if (this._wiredDialog) return;
      this._wiredDialog = true;
      onDispose(this, () => { if (this.hasAttribute("open")) modalContain(this, false); });
      // The open state is carried by the `open` attribute so CSS can target it
      // and a caller can read host.open; it is written here and never observed,
      // so changing it cannot re-enter the render (the shared list excludes it
      // for exactly this reason).
      this.show = () => {
        if (this.hasAttribute("open")) return;
        this._dialogLastFocus = document.activeElement;
        this.setAttribute("open", "");
        this.setAttribute("aria-modal", "true");
        const dlg = this.querySelector("dialog") || (this.tagName === "DIALOG" ? this : null);
        if (dlg && typeof dlg.showModal === "function") { try { dlg.showModal(); } catch (e) {} }
        modalContain(this, true);
        // Focus the close button or the first focusable, like the shadow twin.
        const focusable = this.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
        if (focusable) { try { focusable.focus(); } catch (e) {} }
        this.dispatchEvent(new CustomEvent("contour:open", { bubbles: true, composed: true }));
      };
      this.close = () => {
        const wasOpen = this.hasAttribute("open");
        const dlg = this.querySelector("dialog") || (this.tagName === "DIALOG" ? this : null);
        if (dlg && typeof dlg.close === "function") dlg.close();
        if (this.hasAttribute("open")) this.removeAttribute("open");
        this.removeAttribute("aria-modal");
        if (wasOpen) {
          modalContain(this, false);
          this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
          const last = this._dialogLastFocus;
          if (last && typeof last.focus === "function") {
            try { last.focus(); } catch (e) {}
          }
        }
      };
      this.focus = () => {
        const focusable = this.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
        if (focusable) { try { focusable.focus(); } catch (e) {} }
        else { try { HTMLElement.prototype.focus.call(this); } catch (e) {} }
      };
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-dialog__close") : null;
        if (btn && this.contains(btn)) { this.close(); return; }
        // Backdrop click: clicking the host surface (not its content) closes.
        if (e.target === this) this.close();
      });
      // Close on Escape, only while open: a dialog that is not open has no
      // close to report, and an unconditional event is a claim the component
      // cannot back (F-18).
      this.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.hasAttribute("open")) this.close();
      });
    }
  }
  define("contour-dialog", ContourDialog);
class ContourAlert extends ContourBase {
    static get observed() { return ["title", "body", "variant", "icon", "closable", "action", "actions", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() {
      return { title: { attribute: "title" }, body: { attribute: "body" }, variant: { attribute: "variant" }, icon: { attribute: "icon" }, closable: { attribute: "closable", type: Boolean }, action: { attribute: "action" }, actions: { attribute: "actions" } };
    }
    render() {
      this.classList.add("c-alert");
      // ARIA: an alert is a live region (parity with the shadow layer, which sets
      // the same pair on every .c-alert). Written on the host, so the authored
      // attributes win and the loader's state nodes announce inside the region.
      if (!this.hasAttribute("role")) this.setAttribute("role", "alert");
      if (!this.hasAttribute("aria-live")) this.setAttribute("aria-live", "assertive");
      wireStates(this);
      loadRemote(this, "title");
      if (renderStates(this, "alert")) return;
      const variant = this.getAttribute("variant");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-alert--")) this.classList.remove(c); });
      if (variant) this.classList.add("c-alert--" + variant);
      const icon = this.getAttribute("icon");
      if (icon) {
        const ic = this.ensure(".c-alert__icon", () => { const el = document.createElement("span"); el.className = "c-alert__icon"; return el; });
        if (ic.parentNode === this && this.firstChild !== ic) this.prepend(ic);
        ic.innerHTML = '<svg aria-hidden="true"><use href="#' + String(icon).replace(/[^a-zA-Z0-9_-]/g, "") + '" /></svg>';
      } else {
        const ic = this.querySelector(".c-alert__icon");
        if (ic) ic.remove();
      }
      const title = this.getAttribute("title") || (this._remoteData && this._remoteData.title);
      if (title) {
        const t = this.ensure(".c-alert__title", () => { const el = document.createElement("div"); el.className = "c-alert__title"; return el; });
        if (t.parentNode === this && this.firstChild !== t) this.prepend(t);
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-alert__title");
        if (t) t.remove();
      }
      const body = this.getAttribute("body");
      if (body) {
        const b = this.ensure(".c-alert__body", () => { const el = document.createElement("div"); el.className = "c-alert__body"; return el; });
        b.textContent = body;
      } else {
        const b = this.querySelector(".c-alert__body");
        if (b) b.remove();
      }
      // Remove any previously rendered action buttons so a re-render with a
      // different `action`/`actions` value does not leave stale buttons behind.
      Array.from(this.querySelectorAll(".c-alert__action")).forEach((n) => n.remove());
      const actionsAttr = this.getAttribute("actions");
      let actionList = [];
      if (actionsAttr) {
        try { const parsed = JSON.parse(actionsAttr); if (Array.isArray(parsed)) actionList = parsed.map((x) => String(x)); } catch (e) { actionList = [actionsAttr]; }
      } else {
        const single = this.getAttribute("action");
        if (single) actionList = [single];
      }
      actionList.forEach((label) => {
        const a = document.createElement("button");
        a.className = "c-btn c-btn--sm c-alert__action";
        a.type = "button";
        a.setAttribute("data-alert-action", "");
        a.textContent = label;
        this.appendChild(a);
      });
      if (this.hasAttribute("closable")) {
        this.ensure(".c-alert__close", () => {
          const btn = document.createElement("button");
          btn.className = "c-alert__close";
          btn.type = "button";
          btn.setAttribute("aria-label", "Close");
          btn.textContent = "×";
          return btn;
        });
      } else {
        const btn = this.querySelector(".c-alert__close");
        if (btn) btn.remove();
      }
      if (!title && !body && !icon) {
        renderEmpty(this, "alert");
      }
    }
  }
  ContourAlert.prototype.enhance = function() {
    if (this._wiredAlert) return;
    this._wiredAlert = true;
    this.addEventListener("click", (e) => {
      const actionBtn = e.target && e.target.closest ? e.target.closest(".c-alert__action") : null;
      if (actionBtn && this.contains(actionBtn)) {
        e.preventDefault();
        this.dispatchEvent(new CustomEvent("contour:empty-action", { bubbles: true, composed: true, detail: { state: actionBtn.textContent.trim() } }));
        return;
      }
      const btn = e.target && e.target.closest ? e.target.closest(".c-alert__close") : null;
      if (!btn || !this.contains(btn)) return;
      e.preventDefault();
      this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
      this.remove();
    });
  };
define("contour-alert", ContourAlert);
class ContourDisclosure extends ContourBase {
    static get observed() { return ["summary", "icon"]; }
    static get properties() { return { summary: { attribute: "summary" }, icon: { attribute: "icon" } }; }
    disconnectedCallback() { this._disclosureContent = null; super.disconnectedCallback(); }
    connectedCallback() {
      if (this.innerHTML.trim() && !this._disclosureContent) {
        this._disclosureContent = this.innerHTML;
      }
      super.connectedCallback();
    }
    attributeChangedCallback(name, oldValue, newValue) {
      // Preserve authored content before the base reset removes the generated
      // container that holds it.
      const details = this.querySelector("details");
      if (details) {
        const body = details.querySelector(".c-disclosure__body");
        if (body) this._disclosureContent = body.innerHTML;
      } else if (this.innerHTML.trim()) {
        this._disclosureContent = this.innerHTML;
      }
      super.attributeChangedCallback(name, oldValue, newValue);
    }
    render() {
      this.classList.add("c-disclosure");
      const summary = this.getAttribute("summary");
      const icon = this.getAttribute("icon");
      if (summary) {
        let captured = this.innerHTML.trim() ? this.innerHTML : (this._disclosureContent || "");
        if (captured.trim()) this._disclosureContent = captured;
        const details = this.ensure("details", () => {
          const d = document.createElement("details");
           const summ = document.createElement("summary");
           summ.className = "c-disclosure__summary";
           if (icon) {
            const ic = document.createElement("span");
            ic.className = "c-disclosure__icon";
            ic.innerHTML = '<svg aria-hidden="true"><use href="#' + String(icon).replace(/[^a-zA-Z0-9_-]/g, "") + '" /></svg>';
            summ.appendChild(ic);
          }
          summ.appendChild(document.createTextNode(summary));
          d.appendChild(summ);
          const content = document.createElement("div");
          content.className = "c-disclosure__body";
          content.innerHTML = captured;
          d.appendChild(content);
          return d;
        });
        // update summary if already existed
        const summ = details.querySelector("summary");
        if (summ) {
          const ic = summ.querySelector(".c-disclosure__icon");
          if (icon && !ic) {
            const newIc = document.createElement("span");
            newIc.className = "c-disclosure__icon";
            newIc.innerHTML = '<svg aria-hidden="true"><use href="#' + String(icon).replace(/[^a-zA-Z0-9_-]/g, "") + '" /></svg>';
            summ.insertBefore(newIc, summ.firstChild);
          } else if (!icon && ic) {
            ic.remove();
          }
          // Update text content (remove icon text, set summary)
          const textNodes = Array.from(summ.childNodes).filter(n => n.nodeType === 3);
          textNodes.forEach(n => n.remove());
          summ.appendChild(document.createTextNode(summary));
        }
        const body = details.querySelector(".c-disclosure__body");
        if (body) body.innerHTML = captured;
        if (details.parentNode !== this) { this.innerHTML = ""; this.appendChild(details); }
      } else {
        const details = this.querySelector("details");
        if (details) details.remove();
      }
    }
    enhance() {
      if (this._wiredDisclosure) return;
      this._wiredDisclosure = true;
      this.addEventListener("toggle", (e) => {
        const t = e.target;
        if (t && t.tagName === "DETAILS") {
          this.dispatchEvent(new CustomEvent("contour:toggle", { detail: { open: t.open }, bubbles: true, composed: true }));
        }
      }, true);
    }
  }
  define("contour-disclosure", ContourDisclosure);
class ContourCallout extends ContourBase {
    static get observed() { return ["variant", "title", "icon", "closable"]; }
    static get properties() { return { variant: { attribute: "variant" }, title: { attribute: "title" }, icon: { attribute: "icon" }, closable: { attribute: "closable", type: Boolean } }; }
    render() {
      this.classList.add("c-callout");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-callout--")) this.classList.remove(c); });
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-callout--" + variant);
      const icon = this.getAttribute("icon");
      if (icon) {
        const ic = this.ensure(".c-callout__icon", () => { const el = document.createElement("span"); el.className = "c-callout__icon"; return el; });
        if (ic.parentNode === this && this.firstChild !== ic) this.prepend(ic);
        ic.innerHTML = '<svg aria-hidden="true"><use href="#' + String(icon).replace(/[^a-zA-Z0-9_-]/g, "") + '" /></svg>';
      } else {
        const ic = this.querySelector(".c-callout__icon");
        if (ic) ic.remove();
      }
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-callout__title", () => { const el = document.createElement("div"); el.className = "c-callout__title"; return el; });
        if (t.parentNode === this && this.firstChild !== t) this.prepend(t);
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-callout__title");
        if (t) t.remove();
      }
      if (this.hasAttribute("closable")) {
        this.ensure(".c-callout__close", () => {
          const btn = document.createElement("button");
          btn.className = "c-callout__close";
          btn.type = "button";
          btn.setAttribute("aria-label", "Close");
          btn.textContent = "×";
          return btn;
        });
      } else {
        const btn = this.querySelector(".c-callout__close");
        if (btn) btn.remove();
      }
    }
  }
  ContourCallout.prototype.enhance = function() {
    if (this._wiredCallout) return;
    this._wiredCallout = true;
    this.addEventListener("click", (e) => {
      const btn = e.target && e.target.closest ? e.target.closest(".c-callout__close") : null;
      if (!btn || !this.contains(btn)) return;
      e.preventDefault();
      this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
      this.remove();
    });
  };
  define("contour-callout", ContourCallout);
class ContourEmpty extends ContourBase {
    static get observed() { return ["state", "title", "body", "action", "icon", "illustration", "heading"]; }
    static get properties() { return { state: { attribute: "state" }, title: { attribute: "title" }, body: { attribute: "body" }, action: { attribute: "action" }, icon: { attribute: "icon" }, illustration: { attribute: "illustration" } }; }
    render() {
      this.classList.add("c-empty");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      const state = this.getAttribute("state") || "empty";
      const title = this.getAttribute("title") || (state === "filtered" ? "Nothing matches" : state === "error" ? "Could not load" : "No data yet");
      const body = this.getAttribute("body") || (state === "filtered" ? "Try clearing some filters." : state === "error" ? "Check your connection and try again." : "There is nothing to show here yet.");
      const action = this.getAttribute("action") || (state === "filtered" ? "Clear filters" : state === "error" ? "Retry" : "");
      const icon = this.getAttribute("icon");
      if (icon) {
        const ic = this.ensure(".c-empty__icon", () => { const el = document.createElement("span"); el.className = "c-empty__icon"; return el; });
        ic.innerHTML = '<svg aria-hidden="true"><use href="#' + String(icon).replace(/[^a-zA-Z0-9_-]/g, "") + '" /></svg>';
      } else {
        const ic = this.querySelector(".c-empty__icon");
        if (ic) ic.remove();
      }
      const illustration = this.getAttribute("illustration");
      if (illustration) {
        const il = this.ensure(".c-empty__illustration", () => { const el = document.createElement("div"); el.className = "c-empty__illustration"; return el; });
        il.innerHTML = sanitizeHtml(illustration);
      } else {
        const il = this.querySelector(".c-empty__illustration");
        if (il) il.remove();
      }
      if (title) {
        const t = this.ensure(".c-empty__title", () => { const el = document.createElement(headingTag(this, "h3")); el.className = "c-empty__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-empty__title");
        if (t) t.remove();
      }
      if (body) {
        const b = this.ensure(".c-empty__text", () => { const el = document.createElement("p"); el.className = "c-empty__text"; return el; });
        b.textContent = body;
      } else {
        const b = this.querySelector(".c-empty__text");
        if (b) b.remove();
      }
      if (action) {
        // `.c-empty` defines `__icon`, `__title` and `__text`, and no action
        // element: the action is a real `.c-btn`. The invented action class
        // matched no rule, so it styled nothing yet was the click hook in both
        // layers — `data-empty-action` is the same hook without the invented name.
        const a = this.ensure("button.c-btn[data-empty-action]", () => {
          const el = document.createElement("button");
          el.className = "c-btn c-btn--primary";
          el.type = "button";
          el.setAttribute("data-empty-action", "");
          return el;
        });
        a.textContent = action;
      } else {
        const a = this.querySelector("[data-empty-action]");
        if (a) a.remove();
      }
    }
    enhance() {
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
      wireRemovable(this);
    }
  }
  define("contour-empty", ContourEmpty);
class ContourFaq extends ContourBase {
    static get observed() { return ["question", "answer", "items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { question: { attribute: "question" }, answer: { attribute: "answer" }, items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-faq");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "faq")) return;
      const items = remoteData(this, "items");
      const question = this.getAttribute("question");
      const answer = this.getAttribute("answer");
      const authored = Array.from(this.children).filter((n) => n.classList && n.classList.contains("c-faq__item"));
      if (items && !authored.length) {
        try {
          const parsed = JSON.parse(items);
          Array.from(this.querySelectorAll(".c-faq__item")).forEach((n) => n.remove());
          parsed.forEach((it, i) => {
            // Native disclosure, the same shape the guide authors: details +
            // summary, so the [open] styling and the marker hiding apply. The
            // first item opens like the guide's own FAQ section does.
            const item = document.createElement("details");
            item.className = "c-faq__item";
            if (i === 0) item.setAttribute("open", "");
            const q = document.createElement("summary");
            q.className = "c-faq__question";
            q.textContent = typeof it === "string" ? it : (it.question || it.q || "");
            const sign = document.createElement("span");
            sign.className = "c-faq__sign";
            sign.setAttribute("aria-hidden", "true");
            sign.innerHTML = '<svg aria-hidden="true"><use href="#i-plus" /></svg>';
            q.appendChild(sign);
            item.appendChild(q);
            const a = document.createElement("div");
            a.className = "c-faq__answer";
            a.textContent = typeof it === "string" ? "" : (it.answer || it.a || "");
            item.appendChild(a);
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
       } else if (!items) {
         if (!question && !answer) {
           renderEmpty(this, "faq");
         } else {
           const item = this.ensure("details.c-faq__item", () => { const el = document.createElement("details"); el.className = "c-faq__item"; return el; });
           if (!item.hasAttribute("open")) item.setAttribute("open", "");
           const q = this.ensure("summary.c-faq__question", () => { const el = document.createElement("summary"); el.className = "c-faq__question"; return el; }, item);
           q.textContent = question || "";
           const sign = this.ensure(".c-faq__sign", () => { const el = document.createElement("span"); el.className = "c-faq__sign"; return el; }, q);
           sign.setAttribute("aria-hidden", "true");
           sign.innerHTML = '<svg aria-hidden="true"><use href="#i-plus" /></svg>';
           const a = this.ensure(".c-faq__answer", () => { const el = document.createElement("div"); el.className = "c-faq__answer"; return el; }, item);
           a.textContent = answer || "";
         }
       }
    }
  }
define("contour-faq", ContourFaq);
class ContourAccordion extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "persist", "exclusive"]; }
    static get properties() { return { items: { attribute: "items" }, exclusive: { attribute: "exclusive", type: Boolean }, src: { attribute: "src" } }; }
    render() {
      // The host is a plain container; the children carry .c-disclosure, which
      // is the block that owns the styling. No .c-accordion rule exists, so the
      // host class is dropped rather than invented.
      const authored = Array.from(this.children).filter((n) => n.tagName === "DETAILS");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "accordion")) return;
      const items = remoteData(this, "items");
      if (items && !authored.length) {
        Array.from(this.querySelectorAll("details.c-disclosure")).forEach((d) => d.remove());
        try {
          const parsed = JSON.parse(items);
          parsed.forEach((item) => {
            const details = document.createElement("details");
            details.className = "c-disclosure";
            const summary = document.createElement("summary");
            summary.className = "c-disclosure__summary";
            summary.textContent = item.title || item.question || item.q || item.label || "";
            details.appendChild(summary);
            const body = document.createElement("div");
            body.className = "c-disclosure__body";
            body.textContent = item.body || item.answer || item.a || item.content || "";
            details.appendChild(body);
            this.appendChild(details);
          });
         } catch (e) { /* keep existing */ }
       } else if (!items && !authored.length) {
         renderEmpty(this, "accordion");
       }
      // Restore persisted open state (BY-49).
      const persist = this.getAttribute("persist");
      if (persist) {
        let saved = null;
        if (persist === "storage" && this.id) { try { saved = localStorage.getItem("contour-accordion:" + this.id); } catch (e) {} }
        else if (persist === "url") { try { saved = new URLSearchParams(window.location.search).get("c-accordion"); } catch (e) {} }
        if (saved !== null) {
          try {
            const labels = JSON.parse(saved);
            if (Array.isArray(labels)) {
              const want = new Set(labels.map((l) => String(l)));
              Array.from(this.querySelectorAll("details.c-disclosure")).forEach((d) => {
                const summary = d.querySelector("summary");
                const label = (summary ? summary.textContent : "").trim().slice(0, 120);
                if (want.has(label)) d.open = true;
              });
            }
          } catch (e) {}
        }
      }
    }
    enhance() {
      if (this._wiredAccordion) return;
      this._wiredAccordion = true;
       this.addEventListener("toggle", (e) => {
         const t = e.target;
         if (t && t.tagName === "DETAILS") {
           if (t.open && this.hasAttribute("exclusive")) {
             Array.from(this.querySelectorAll("details.c-disclosure")).forEach((d) => {
               if (d !== t) d.open = false;
             });
           }
           this.dispatchEvent(new CustomEvent("contour:toggle", { detail: { open: t.open }, bubbles: true, composed: true }));
           const persist = this.getAttribute("persist");
          if (persist === "storage" && this.id) {
            try {
              const open = [];
              Array.from(this.querySelectorAll("details.c-disclosure")).forEach((d) => { if (d.open) { const s = d.querySelector("summary"); open.push((s ? s.textContent : "").trim().slice(0, 120)); } });
              localStorage.setItem("contour-accordion:" + this.id, JSON.stringify(open));
            } catch (e) {}
          } else if (persist === "url") {
            try {
              const open = [];
              Array.from(this.querySelectorAll("details.c-disclosure")).forEach((d) => { if (d.open) { const s = d.querySelector("summary"); open.push((s ? s.textContent : "").trim().slice(0, 120)); } });
              const url = new URL(window.location.href);
              url.searchParams.set("c-accordion", JSON.stringify(open));
              window.history.replaceState(null, "", url.toString());
            } catch (e) {}
          }
        }
      }, true);
    }
  }
define("contour-accordion", ContourAccordion);
class ContourDrawer extends ContourBase {
    static get observed() { return ["title", "body", "size"]; }
    static get properties() { return { title: { attribute: "title" }, body: { attribute: "body" }, size: { attribute: "size" } }; }
    render() {
      this.classList.add("c-drawer");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-drawer--")) this.classList.remove(c); });
      const size = this.getAttribute("size");
      if (size) this.classList.add("c-drawer--" + size);
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
      const title = this.getAttribute("title");
      let head = this.querySelector(".c-drawer__head");
      if (title) {
        if (!head) {
          head = document.createElement("div");
          head.className = "c-drawer__head";
          const t = document.createElement("div");
          t.className = "c-drawer__title";
          head.appendChild(t);
          const closeBtn = document.createElement("button");
          closeBtn.className = "c-btn c-btn--icon c-btn--ghost c-drawer__close";
          closeBtn.setAttribute("type", "button");
          closeBtn.setAttribute("aria-label", "Close");
          closeBtn.innerHTML = '<svg aria-hidden="true"><use href="#i-close" /></svg>';
          head.appendChild(closeBtn);
        }
        const t = head.querySelector(".c-drawer__title");
        if (t) { t.textContent = title; if (!t.id) t.id = "contour-drawer-title-" + (this._drawerTitleId = (this._drawerTitleId || 0) + 1); this.setAttribute("aria-labelledby", t.id); }
        if (head.parentNode !== this) this.prepend(head);
      } else if (head) {
        head.remove();
      }
      // Open state is the `open` attribute (written, never observed, so it
      // cannot re-enter the render — see the dialog); the `.is-open` class the
      // CSS keys off is re-derived here because the base restores the authored
      // class on every render and would otherwise drop it mid-lock.
      if (this.hasAttribute("open")) this.classList.add("is-open"); else this.classList.remove("is-open");
      const body = this.getAttribute("body");
      const b = this.querySelector(".c-drawer__body");
      const authored = b ? Array.from(b.children) : [];
      if (body && !authored.length) {
        const el = this.ensure(".c-drawer__body", () => { const e = document.createElement("div"); e.className = "c-drawer__body"; return e; });
        el.innerHTML = sanitizeHtml(body);
      } else if (!body && b && !authored.length) {
        b.remove();
      }
    }
    enhance() {
      if (this._wiredDrawer) return;
      this._wiredDrawer = true;
      onDispose(this, () => { if (this.hasAttribute("open")) modalContain(this, false); });
      this._drawerLastFocus = null;
      this.show = () => {
        if (this.hasAttribute("open")) return;
        this._drawerLastFocus = document.activeElement;
        this.setAttribute("open", "");
        this.setAttribute("aria-modal", "true");
        this.classList.add("is-open");
        modalContain(this, true);
        const focusable = this.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
        if (focusable) { try { focusable.focus(); } catch (e) {} }
        this.dispatchEvent(new CustomEvent("contour:open", { bubbles: true, composed: true }));
      };
      this.close = () => {
        if (!this.hasAttribute("open")) return;
        this.removeAttribute("open");
        this.removeAttribute("aria-modal");
        this.classList.remove("is-open");
        modalContain(this, false);
        this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
        const last = this._drawerLastFocus;
        if (last && typeof last.focus === "function") { try { last.focus(); } catch (e) {} }
      };
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-drawer__close") : null;
        if (btn && this.contains(btn)) { this.close(); return; }
        if (e.target === this) this.close();
      });
      this.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.hasAttribute("open")) this.close();
      });
      // Swipe-to-close (deferred P3): horizontal swipe past threshold closes.
      let touchStartX = 0, touchStartY = 0;
      this.addEventListener("touchstart", (e) => {
        if (!this.hasAttribute("open")) return;
        const t = e.touches && e.touches[0];
        if (t) { touchStartX = t.clientX; touchStartY = t.clientY; }
      }, { passive: true });
      this.addEventListener("touchend", (e) => {
        if (!this.hasAttribute("open")) return;
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) this.close();
      }, { passive: true });
    }
  }
  define("contour-drawer", ContourDrawer);
class ContourSheet extends ContourBase {
    static get observed() { return ["title", "body", "size"]; }
    static get properties() { return { title: { attribute: "title" }, body: { attribute: "body" }, size: { attribute: "size" } }; }
    render() {
      this.classList.add("c-sheet");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-sheet--")) this.classList.remove(c); });
      const size = this.getAttribute("size");
      if (size) this.classList.add("c-sheet--" + size);
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
      const title = this.getAttribute("title");
      let head = this.querySelector(".c-sheet__head");
      if (title) {
        if (!head) {
          head = document.createElement("div");
          head.className = "c-sheet__head";
          const t = document.createElement("div");
          t.className = "c-sheet__title";
          head.appendChild(t);
          const closeBtn = document.createElement("button");
          closeBtn.className = "c-btn c-btn--icon c-btn--ghost c-sheet__close";
          closeBtn.setAttribute("type", "button");
          closeBtn.setAttribute("aria-label", "Close");
          closeBtn.innerHTML = '<svg aria-hidden="true"><use href="#i-close" /></svg>';
          head.appendChild(closeBtn);
        }
        const t = head.querySelector(".c-sheet__title");
        if (t) { t.textContent = title; if (!t.id) t.id = "contour-sheet-title-" + (this._sheetTitleId = (this._sheetTitleId || 0) + 1); this.setAttribute("aria-labelledby", t.id); }
        if (head.parentNode !== this) this.prepend(head);
      } else if (head) {
        head.remove();
      }
      // Open state is the `open` attribute (written, never observed, so it
      // cannot re-enter the render); the `.is-open` class is re-derived because
      // the base restores the authored class on every render (see the drawer).
      if (this.hasAttribute("open")) this.classList.add("is-open"); else this.classList.remove("is-open");
      const body = this.getAttribute("body");
      const b = this.querySelector(".c-sheet__body");
      const authored = b ? Array.from(b.children) : [];
      if (body && !authored.length) {
        const el = this.ensure(".c-sheet__body", () => { const e = document.createElement("div"); e.className = "c-sheet__body"; return e; });
        el.innerHTML = sanitizeHtml(body);
      } else if (!body && b && !authored.length) {
        b.remove();
      }
    }
    enhance() {
      if (this._wiredSheet) return;
      this._wiredSheet = true;
      onDispose(this, () => { if (this.hasAttribute("open")) modalContain(this, false); });
      this._sheetLastFocus = null;
      this.show = () => {
        if (this.hasAttribute("open")) return;
        this._sheetLastFocus = document.activeElement;
        this.setAttribute("open", "");
        this.setAttribute("aria-modal", "true");
        this.classList.add("is-open");
        modalContain(this, true);
        const focusable = this.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
        if (focusable) { try { focusable.focus(); } catch (e) {} }
        this.dispatchEvent(new CustomEvent("contour:open", { bubbles: true, composed: true }));
      };
      this.close = () => {
        if (!this.hasAttribute("open")) return;
        this.removeAttribute("open");
        this.removeAttribute("aria-modal");
        this.classList.remove("is-open");
        modalContain(this, false);
        this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
        const last = this._sheetLastFocus;
        if (last && typeof last.focus === "function") { try { last.focus(); } catch (e) {} }
      };
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-sheet__close") : null;
        if (btn && this.contains(btn)) { this.close(); return; }
        if (e.target === this) this.close();
      });
      this.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.hasAttribute("open")) this.close();
      });
      // Swipe-to-close (deferred P3): vertical swipe down past threshold closes.
      let touchStartY = 0, touchStartX = 0;
      this.addEventListener("touchstart", (e) => {
        if (!this.hasAttribute("open")) return;
        const t = e.touches && e.touches[0];
        if (t) { touchStartX = t.clientX; touchStartY = t.clientY; }
      }, { passive: true });
      this.addEventListener("touchend", (e) => {
        if (!this.hasAttribute("open")) return;
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        const dy = t.clientY - touchStartY;
        const dx = t.clientX - touchStartX;
        if (dy > 60 && Math.abs(dy) > Math.abs(dx) * 1.5) this.close();
      }, { passive: true });
    }
  }
  define("contour-sheet", ContourSheet);
class ContourToast extends ContourBase {
    static get observed() { return ["message", "variant", "duration"]; }
    static get properties() { return { message: { attribute: "message" }, variant: { attribute: "variant" }, duration: { attribute: "duration", type: Number } }; }
    render() {
      this.classList.add("c-toast");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-live")) this.setAttribute("aria-live", "polite");
      if (!this.hasAttribute("aria-atomic")) this.setAttribute("aria-atomic", "true");
      const message = this.getAttribute("message");
      if (message && !this.hasChildNodes()) {
        this.textContent = message;
      }
      const variant = this.getAttribute("variant");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-toast--")) this.classList.remove(c); });
      if (variant) this.classList.add("c-toast--" + variant);
    }
    enhance() {
      if (this._wiredToast) return;
      this._wiredToast = true;
      const ms = (this.duration && this.duration > 0) ? this.duration : 1500;
      const timer = setTimeout(() => {
        if (!this.isConnected) return;
        this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
        this.remove();
      }, ms);
      onDispose(this, () => clearTimeout(timer));
    }
  }
  define("contour-toast", ContourToast);
class ContourExpandable extends ContourBase {
    static get observed() { return ["summary"]; }
    static get properties() { return { summary: { attribute: "summary" } }; }
    disconnectedCallback() { this._expandableContent = null; super.disconnectedCallback(); }
    connectedCallback() {
      if (this.innerHTML.trim() && !this._expandableContent) {
        this._expandableContent = this.innerHTML;
      }
      super.connectedCallback();
    }
    attributeChangedCallback(name, oldValue, newValue) {
      const details = this.querySelector("details");
      if (details) {
        const body = details.querySelector(".c-expandable__body");
        if (body) this._expandableContent = body.innerHTML;
      } else if (this.innerHTML.trim()) {
        this._expandableContent = this.innerHTML;
      }
      super.attributeChangedCallback(name, oldValue, newValue);
    }
    render() {
      this.classList.add("c-expandable");
      const summary = this.getAttribute("summary");
      if (summary) {
        let captured = this.innerHTML.trim() ? this.innerHTML : (this._expandableContent || "");
        if (captured.trim()) this._expandableContent = captured;
        const details = this.ensure("details", () => {
          const d = document.createElement("details");
          const summ = document.createElement("summary");
          summ.className = "c-expandable__summary";
          summ.textContent = summary;
          d.appendChild(summ);
          const content = document.createElement("div");
          content.className = "c-expandable__body";
          content.innerHTML = captured;
          d.appendChild(content);
          return d;
        });
        const summ = details.querySelector("summary");
        if (summ) summ.textContent = summary;
        const body = details.querySelector(".c-expandable__body");
        if (body) body.innerHTML = captured;
        if (details.parentNode !== this) { this.innerHTML = ""; this.appendChild(details); }
      } else {
        const details = this.querySelector("details");
        if (details) details.remove();
      }
    }
    enhance() {
      if (this._wiredExpandable) return;
      this._wiredExpandable = true;
      this.addEventListener("toggle", (e) => {
        const t = e.target;
        if (t && t.tagName === "DETAILS") {
          this.dispatchEvent(new CustomEvent("contour:toggle", { detail: { open: t.open }, bubbles: true, composed: true }));
        }
      }, true);
    }
  }
  define("contour-expandable", ContourExpandable);
class ContourToastHost extends ContourBase {
    static get observed() { return []; }
    render() {
      this.classList.add("c-toast-host");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-live")) this.setAttribute("aria-live", "polite");
      if (!this.hasAttribute("aria-atomic")) this.setAttribute("aria-atomic", "true");
    }
    enhance() {
      if (this._wiredToastHost) return;
      this._wiredToastHost = true;
      this._toastQueue = [];
      this._toastActive = null;
      const buildToast = (message, opts) => {
        opts = opts || {};
        const toast = document.createElement("div");
        toast.className = "c-toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        toast.setAttribute("aria-atomic", "true");
        if (opts.variant) toast.classList.add("c-toast--" + opts.variant);
        toast.dataset.message = message == null ? "" : String(message);
        const text = document.createElement("span");
        text.className = "c-toast__text";
        text.textContent = message == null ? "" : String(message);
        toast.appendChild(text);
        if (opts.action && (typeof opts.action === "string" || (opts.action.label))) {
          const label = (typeof opts.action === "string") ? opts.action : opts.action.label;
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "c-btn c-btn--ghost c-toast__action";
          btn.textContent = label;
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (typeof opts.action === "object" && typeof opts.action.onClick === "function") {
              try { opts.action.onClick(); } catch (err) {}
            }
            dismiss(toast);
          });
          toast.appendChild(btn);
        }
        return toast;
      };
      const dismiss = (toast) => {
        if (!toast || !toast.parentNode) return;
        if (toast._timer) { clearTimeout(toast._timer); toast._timer = null; }
        toast.parentNode.removeChild(toast);
        if (this._toastActive === toast) this._toastActive = null;
        this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true, detail: { message: toast.textContent } }));
        pump();
      };
      const pump = () => {
        if (this._toastActive && this._toastActive.parentNode) return;
        // dedup: skip queued items whose message matches the one just shown
        while (this._toastQueue.length) {
          const next = this._toastQueue.shift();
          if (next._deduped) continue;
          const toast = buildToast(next.message, next.opts);
          this._toastActive = toast;
          this.appendChild(toast);
          const ms = (next.opts && next.opts.duration && next.opts.duration > 0) ? next.opts.duration : 3000;
          toast._timer = setTimeout(() => dismiss(toast), ms);
          return;
        }
        this._toastActive = null;
      };
      this.show = (message, opts) => {
        opts = opts || {};
        const key = String(message == null ? "" : message);
        // dedup: if an identical message is already queued or active, reset its timer instead of stacking
        const active = this._toastActive;
        if (active && active.dataset && active.dataset.message === key && key !== "") {
          if (active._timer) { clearTimeout(active._timer); }
          const ms = (opts.duration && opts.duration > 0) ? opts.duration : 3000;
          active._timer = setTimeout(() => dismiss(active), ms);
          return active;
        }
        const queuedDup = this._toastQueue.find((q) => String(q.message) === key && key !== "");
        if (queuedDup) {
          queuedDup.opts = Object.assign({}, queuedDup.opts, opts);
          return null;
        }
        const entry = { message, opts, _deduped: false };
        this._toastQueue.push(entry);
        pump();
        return this._toastActive;
      };
      this.hide = () => {
        if (this._toastActive) dismiss(this._toastActive);
        this._toastQueue.length = 0;
        Array.from(this.querySelectorAll(".c-toast")).forEach((t) => {
          if (t._timer) clearTimeout(t._timer);
          if (t.parentNode) t.parentNode.removeChild(t);
        });
        this._toastActive = null;
      };
    }
  }
  define("contour-toast-host", ContourToastHost);

/**
 * Form controls: field, field-group, form, combobox, select, check, radio,
 * switch, textarea, input, input-group, range, radio-list, version.
 *
 * All form controls are `ContourBase` subclasses. They render light-DOM markup
 * from observed attributes, reflect properties back to attributes, take part in
 * form association (`formAssociated`, `_internals.setFormValue`) where the
 * platform allows it, and emit `contour:input` / `contour:change` / `contour:submit`
 * events. Inline validation (blur-driven `aria-invalid`) is handled by
 * `ContourField`; `ContourForm` owns submission state and a live-region summary.
 * @module contour-wc/forms
 */



/**
 * Combobox: a filterable, keyboard-navigable listbox backed by a JSON `options`
 * attribute or authored `<li>` options. Supports single and multi-select
 * (`multiple`), fixed-row virtualization (`virtual`), async/remote options
 * (`src`, `loading`, `error`, `retry`, `empty`, `skeleton`), a clear button and
 * form association. Emits `contour:select` on commit and `contour:input` on
 * filter. ArrowUp/Down/Home/End rove the cursor; Enter commits; Escape closes.
 */
class ContourCombobox extends ContourBase {
  static get observed() { return ["options", "placeholder", "label", "value", "multiple", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "empty", "skeleton", "virtual"]; }
    static get formAssociated() { return true; }
    static get properties() { return { options: { attribute: "options" }, placeholder: { attribute: "placeholder" }, label: { attribute: "label" }, value: { attribute: "value" }, multiple: { attribute: "multiple", type: Boolean }, virtual: { attribute: "virtual", type: Boolean }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-combobox");
      wireStates(this);
      loadRemote(this, "options");
      if (renderStates(this, "combobox")) return;
      const options = remoteData(this, "options");
      // Slot composition: authored <li> options win over the JSON attribute.
      const authored = Array.from(this.children).filter((n) => !n.classList || (!n.classList.contains("c-combobox__input") && !n.classList.contains("c-combobox__list")));
      if ((options) && !authored.length) {
        try {
          const parsed = options ? JSON.parse(options) : [];
          const input = this.ensure(".c-combobox__input", () => { const el = document.createElement("input"); el.className = "c-combobox__input"; el.type = "text"; return el; });
          input.type = "text";
          input.placeholder = this.getAttribute("placeholder") || "Search…";
          input.setAttribute("aria-label", this.getAttribute("label") || "Search");
          const val = this.getAttribute("value");
          if (val !== null) input.value = val;
          const list = this.ensure(".c-combobox__list", () => { const el = document.createElement("ul"); el.className = "c-combobox__list"; el.setAttribute("hidden", ""); return el; });
          list.innerHTML = "";
          list.setAttribute("hidden", "");
          this._comboboxOptions = parsed;
          this._comboboxVirtual = this.hasAttribute("virtual") && parsed.length > 100;
          if (this._comboboxVirtual) {
            list.classList.add("c-combobox__list--virtual");
            list.style.maxBlockSize = "20rem";
            list.style.overflow = "auto";
            this._renderComboboxWindow("", true);
          } else {
            list.classList.remove("c-combobox__list--virtual");
            list.style.maxBlockSize = "";
            list.style.overflow = "";
            this._renderComboboxWindow("", true);
          }
        } catch (e) { /* keep existing */ }
      } else if (!authored.length && !options) {
        renderEmpty(this, "combobox");
      }
      // Clear button (F-11).
      if (this.getAttribute("value")) {
        this.ensure(".c-combobox__clear", () => {
          const btn = document.createElement("button");
          btn.className = "c-combobox__clear";
          btn.type = "button";
          btn.setAttribute("aria-label", "Clear");
          btn.textContent = "×";
          return btn;
        });
      } else {
        const btn = this.querySelector(".c-combobox__clear");
        if (btn) btn.remove();
      }
    }
    _renderComboboxWindow(query = "", reset = false) {
      const list = this.querySelector(".c-combobox__list");
      const options = this._comboboxOptions || [];
      if (!list) return;
      const q = String(query || "").toLowerCase();
      const filtered = options.map((opt, index) => ({
        opt,
        index,
        label: typeof opt === "string" ? opt : opt.label,
        value: typeof opt === "string" ? opt : opt.value,
      })).filter((item) => !q || String(item.label).toLowerCase().includes(q));
      this._comboboxFiltered = filtered;
      const rowHeight = 32;
      const windowSize = 20;
      const overscan = 6;
      const oldScrollTop = list.scrollTop;
      const start = this._comboboxVirtual && !reset
        ? Math.min(Math.max(0, filtered.length - windowSize), Math.max(0, Math.floor(oldScrollTop / rowHeight) - overscan))
        : 0;
      this._comboboxWindowStart = start;
      const end = this._comboboxVirtual ? Math.min(filtered.length, start + windowSize + overscan * 2) : filtered.length;
      const selectedVals = (this.getAttribute("value") || "").split(",").map((v) => v.trim()).filter(Boolean);
      list.innerHTML = "";
      const addSpacer = (height) => {
        const spacer = document.createElement("li");
        spacer.setAttribute("aria-hidden", "true");
        spacer.style.blockSize = `${height}px`;
        list.appendChild(spacer);
      };
      if (this._comboboxVirtual) addSpacer(start * rowHeight);
      if (!filtered.length) {
        const empty = document.createElement("li");
        empty.className = "c-combobox__empty";
        empty.setAttribute("role", "status");
        empty.textContent = this.getAttribute("empty") || "No matches";
        list.appendChild(empty);
      }
      if (this.hasAttribute("multiple")) list.setAttribute("aria-multiselectable", "true");
      else list.removeAttribute("aria-multiselectable");
      filtered.slice(start, end).forEach((item) => {
        const li = document.createElement("li");
        li.className = "c-combobox__option";
        li.dataset.optionIndex = String(item.index);
        li.setAttribute("role", "option");
        const label = String(item.label);
        const q = String(query || "").toLowerCase();
        if (q && label.toLowerCase().includes(q)) {
          const idx = label.toLowerCase().indexOf(q);
          const before = label.slice(0, idx);
          const match = label.slice(idx, idx + q.length);
          const after = label.slice(idx + q.length);
          li.innerHTML = "";
          if (before) li.appendChild(document.createTextNode(before));
          const mark = document.createElement("mark");
          mark.className = "c-combobox__match";
          mark.textContent = match;
          li.appendChild(mark);
          if (after) li.appendChild(document.createTextNode(after));
        } else {
          li.textContent = label;
        }
        const isSelected = this.hasAttribute("multiple") && selectedVals.includes(String(item.value));
        li.setAttribute("aria-selected", String(isSelected));
        if (isSelected) li.classList.add("c-combobox__option--selected");
        list.appendChild(li);
      });
      if (this._comboboxVirtual) addSpacer(Math.max(0, filtered.length - end) * rowHeight);
      if (this._comboboxVirtual && !reset) list.scrollTop = oldScrollTop;
    }
     enhance() {
       wireCombobox(this);
       // Form sync (D-02): commit writes the input value; mirror it into the
       // form association so the host actually submits.
       if (this._internals && !this._wiredComboboxForm) {
         this._wiredComboboxForm = true;
         this._syncFormValue();
         this.addEventListener("contour:select", (e) => {
           const v = e && e.detail && (e.detail.value || e.detail.label);
           if (v != null) this.setAttribute("value", String(v));
           this._syncFormValue();
         });
       }
       if (!this._wiredComboboxClear) {
         this._wiredComboboxClear = true;
         this.addEventListener("click", (e) => {
           const btn = e.target && e.target.closest ? e.target.closest(".c-combobox__clear") : null;
           if (!btn || !this.contains(btn)) return;
           e.preventDefault();
           this.removeAttribute("value");
           const input = this.querySelector(".c-combobox__input");
           if (input) input.value = "";
           this._syncFormValue();
           this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { name: this.getAttribute("name"), value: null, checked: null } }));
         });
       }
     }
  }
define("contour-combobox", ContourCombobox);
/**
 * Field: a labelled form control wrapper. Renders an `<input>`/`<textarea>`/
 * `<select>` (or adopts an authored one), associates a label via `for`/`id`,
 * and attaches hint and error text with `aria-describedby`. Drives inline
 * validation on blur (`aria-invalid`, `is-invalid`) and keeps the form value in
 * sync via `_internals.setFormValue`. Emits `contour:input` / `contour:change`.
 */
class ContourField extends ContourBase {
    static get observed() { return ["label", "hint", "error", "placeholder", "type", "required"]; }
    static get formAssociated() { return true; }
    static get properties() { return { label: { attribute: "label" }, hint: { attribute: "hint" }, error: { attribute: "error" }, placeholder: { attribute: "placeholder" }, type: { attribute: "type" }, required: { attribute: "required", type: Boolean } }; }
    render() {
      this.classList.add("c-field");
      const label = this.getAttribute("label");
      const hint = this.getAttribute("hint");
      const error = this.getAttribute("error");
      const placeholder = this.getAttribute("placeholder") || "";
      if (label) {
        const lbl = this.ensure(".c-field__label", () => { const el = document.createElement("label"); el.className = "c-field__label"; return el; });
        lbl.textContent = label;
      } else {
        const lbl = this.querySelector(".c-field__label");
        if (lbl) lbl.remove();
      }
      const input = this.ensure("input.c-input, textarea, select", () => {
        const el = document.createElement("input");
        el.className = "c-input";
        return el;
      });
      input.type = this.getAttribute("type") || "text";
      input.placeholder = placeholder;
      if (!input.id) input.id = contourId("contour-field");
      // Associate the label with the input so the control is labelled.
      const lbl = this.querySelector(".c-field__label");
      if (lbl) { if (!input.id) input.id = contourId("contour-field"); lbl.setAttribute("for", input.id); input.setAttribute("aria-label", lbl.textContent); }
      if (hint) {
        const h = this.ensure(".c-field__hint", () => { const el = document.createElement("span"); el.className = "c-field__hint"; return el; });
        h.textContent = hint;
      } else {
        const h = this.querySelector(".c-field__hint");
        if (h) h.remove();
      }
      if (error) {
        const e = this.ensure(".c-field__error", () => { const el = document.createElement("span"); el.className = "c-field__error"; return el; });
        e.textContent = error;
      } else {
        const e = this.querySelector(".c-field__error");
        if (e) e.remove();
      }
      // ARIA: link the input to its hint and its error message (parity with the
      // shadow layer's bootstrap). The ids are generated so a screen reader does
      // not hear one message without the other.
      const hintEl = this.querySelector(".c-field__hint");
      const errEl = this.querySelector(".c-field__error");
      const describedBy = [];
      if (hintEl) { if (!hintEl.id) hintEl.id = contourId("hint"); describedBy.push(hintEl.id); }
      if (errEl) { if (!errEl.id) errEl.id = contourId("err"); describedBy.push(errEl.id); }
      if (describedBy.length) input.setAttribute("aria-describedby", describedBy.join(" "));
      if (this.hasAttribute("required")) input.setAttribute("aria-required", "true");
    }
  }
  ContourField.prototype.enhance = function() {
    if (this._wiredField) return;
    this._wiredField = true;
    const sync = () => {
      const input = this.querySelector("input, textarea, select");
      if (!input || !this._internals) return;
      this._internals.setFormValue(input.value);
    };
    this.addEventListener("input", (e) => {
      const input = this.querySelector("input, textarea, select");
      if (!input || e.target !== input) return;
      sync();
      this._emitForm("contour:input");
    });
    this.addEventListener("change", (e) => {
      const input = this.querySelector("input, textarea, select");
      if (!input || e.target !== input) return;
      sync();
      this._emitForm("contour:change");
    });
    // Inline validation (BY2-U6): on blur, reflect validity on the input via
    // aria-invalid and toggle the error/success state. The CSS already paints
    // the invalid ring (components.css aria-invalid rules); this just drives it.
    this.addEventListener("blur", (e) => {
      const input = this.querySelector("input, textarea, select");
      if (!input || e.target !== input) return;
      const valid = input.checkValidity();
      if (valid) {
        input.setAttribute("aria-invalid", "false");
        this.classList.remove("is-invalid");
        this.removeAttribute("data-invalid");
      } else {
        input.setAttribute("aria-invalid", "true");
        this.classList.add("is-invalid");
        this.setAttribute("data-invalid", "");
        // Surface the browser's validation message when no explicit error attr.
        if (!this.getAttribute("error")) {
          const msg = input.validationMessage || "Invalid value";
          let errEl = this.querySelector(".c-field__error");
          if (!errEl) {
            errEl = document.createElement("span");
            errEl.className = "c-field__error";
            this.appendChild(errEl);
          }
          errEl.textContent = msg;
          if (!errEl.id) errEl.id = contourId("err");
          input.setAttribute("aria-describedby", (input.getAttribute("aria-describedby") || "").split(" ").filter((x) => x && x !== errEl.id).concat(errEl.id).join(" "));
        }
      }
      sync();
    }, true);
    sync();
  };
  define("contour-field", ContourField);

  /**
 * Field-group: a grouped field with a shared label, optional hint and error
 * text. Sets `role="group"` and `aria-required` when required; toggles
 * `is-error` when an error is present. Child fields are labelled by the group.
 */
class ContourFieldGroup extends ContourBase {
    static get observed() { return ["label", "hint", "error", "required"]; }
    static get properties() { return { label: { attribute: "label" }, hint: { attribute: "hint" }, error: { attribute: "error" }, required: { attribute: "required", type: Boolean } }; }
    render() {
      this.classList.add("c-field-group");
      this.setAttribute("role", "group");
      const label = this.getAttribute("label");
      if (label) {
        const lbl = this.ensure(".c-field-group__label", () => { const el = document.createElement("div"); el.className = "c-field-group__label"; return el; });
        lbl.textContent = label;
      } else {
        const lbl = this.querySelector(".c-field-group__label");
        if (lbl) lbl.remove();
      }
      const hint = this.getAttribute("hint");
      if (hint) {
        const h = this.ensure(".c-field-group__hint", () => { const el = document.createElement("span"); el.className = "c-field-group__hint"; return el; });
        h.textContent = hint;
      } else {
        const h = this.querySelector(".c-field-group__hint");
        if (h) h.remove();
      }
      const error = this.getAttribute("error");
      if (error) {
        const e = this.ensure(".c-field-group__error", () => { const el = document.createElement("span"); el.className = "c-field-group__error"; return el; });
        e.textContent = error;
      } else {
        const e = this.querySelector(".c-field-group__error");
        if (e) e.remove();
      }
      if (error) this.classList.add("is-error"); else this.classList.remove("is-error");
      if (this.hasAttribute("required")) this.setAttribute("aria-required", "true");
      else this.removeAttribute("aria-required");
    }
    enhance() {
      if (this._wiredFieldGroup) return;
      this._wiredFieldGroup = true;
    }
  }
  define("contour-field-group", ContourFieldGroup);

  /**
 * Form: a form wrapper with submission state and a validation summary. Adds
 * `is-submitting` and disables the submit button while `submitting` is set.
 * On invalid submit, prevents default and renders a `role="alert"` summary
 * listing the invalid fields. Emits `contour:submit` on valid submit.
 */
class ContourForm extends ContourBase {
    static get observed() { return ["submitting", "error", "summary"]; }
    static get properties() { return { submitting: { attribute: "submitting", type: Boolean }, error: { attribute: "error" }, summary: { attribute: "summary" } }; }
    render() {
      this.classList.add("c-form");
      if (this.hasAttribute("submitting")) this.classList.add("is-submitting"); else this.classList.remove("is-submitting");
      const summaryText = this.getAttribute("summary") || this.getAttribute("error");
      let summary = this.querySelector(".c-form__summary");
      if (summaryText) {
        if (!summary) { summary = document.createElement("div"); summary.className = "c-form__summary"; summary.setAttribute("role", "alert"); this.prepend(summary); }
        summary.textContent = summaryText;
        summary.removeAttribute("hidden");
      } else if (summary) {
        summary.setAttribute("hidden", "");
      }
      const submit = this.querySelector("[type='submit'], .c-form__submit");
      if (submit) {
        if (this.hasAttribute("submitting")) submit.setAttribute("disabled", "");
        else submit.removeAttribute("disabled");
      }
    }
    enhance() {
      if (this._wiredForm) return;
      this._wiredForm = true;
      this.addEventListener("submit", (e) => {
        const form = e.target;
        if (form && typeof form.checkValidity === "function" && !form.checkValidity()) {
          e.preventDefault();
          const invalid = Array.from(form.querySelectorAll(":invalid"));
          const names = invalid.map((el) => el.getAttribute("aria-label") || el.name || el.id || "field").join(", ");
          // Update DOM directly (avoid setAttribute on observed attr -> re-entrancy).
          let summary = this.querySelector(".c-form__summary");
          if (!summary) { summary = document.createElement("div"); summary.className = "c-form__summary"; summary.setAttribute("role", "alert"); this.prepend(summary); }
          summary.textContent = "Please fix: " + (names || "invalid fields");
          summary.removeAttribute("hidden");
          return;
        }
        // submitting state via class + button, not attribute.
        this.classList.add("is-submitting");
        const submit = this.querySelector("[type='submit'], .c-form__submit");
        if (submit) submit.setAttribute("disabled", "");
        this.dispatchEvent(new CustomEvent("contour:submit", { bubbles: true, composed: true, detail: { submitting: true } }));
      });
    }
  }
  define("contour-form", ContourForm);

  /**
 * Range: a native `<input type=range>` wrapper with optional dual-handle range
 * mode (`range`, `low`, `high`) and a sparkline canvas (`sparkline`). Form
 * associated; emits `contour:input` / `contour:change` with the current value
 * (or `{low, high}` in range mode). Renders a `--fill` custom property for the
 * filled track.
 */
class ContourRange extends ContourBase {
    static get observed() { return ["min", "max", "value", "low", "high", "range", "sparkline", "label", "disabled", "error", "help"]; }
    static get formAssociated() { return true; }
    static get properties() { return { min: { attribute: "min" }, max: { attribute: "max" }, value: { attribute: "value" }, label: { attribute: "label" }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
     render() {
       this.classList.add("c-range");
       const min = this.getAttribute("min") || "0";
       const max = this.getAttribute("max") || "100";
       const rangeMode = this.hasAttribute("range") || this.hasAttribute("low") || this.hasAttribute("high");
       // sparkline canvas
       const spark = this.getAttribute("sparkline");
       if (spark) {
         let canvas = this.querySelector(".c-range__sparkline");
         if (!canvas) { canvas = document.createElement("canvas"); canvas.className = "c-range__sparkline"; canvas.setAttribute("part", "sparkline-canvas"); this.insertBefore(canvas, this.firstChild); }
       } else {
         const c = this.querySelector(".c-range__sparkline");
         if (c) c.remove();
       }
       if (rangeMode) {
         // remove single input if present
         const single = this.querySelector("input.c-range:not(.c-range__low):not(.c-range__high)");
         // keep generic input? We'll use two named inputs
         let lowInput = this.querySelector("input.c-range__low");
         if (!lowInput) { lowInput = document.createElement("input"); lowInput.type = "range"; lowInput.className = "c-range c-range__low"; this.appendChild(lowInput); }
         let highInput = this.querySelector("input.c-range__high");
         if (!highInput) { highInput = document.createElement("input"); highInput.type = "range"; highInput.className = "c-range c-range__high"; this.appendChild(highInput); }
         lowInput.min = min; lowInput.max = max;
         highInput.min = min; highInput.max = max;
         const lowVal = this.getAttribute("low") || min;
         const highVal = this.getAttribute("high") || max;
         if (this._rangeUserLow !== null && this._rangeAttrLowAtDirty === (this.getAttribute("low") || min)) lowInput.value = this._rangeUserLow;
         else { lowInput.value = lowVal; this._rangeUserLow = null; this._rangeAttrLowAtDirty = null; }
         if (this._rangeUserHigh !== null && this._rangeAttrHighAtDirty === (this.getAttribute("high") || max)) highInput.value = this._rangeUserHigh;
         else { highInput.value = highVal; this._rangeUserHigh = null; this._rangeAttrHighAtDirty = null; }
         const label = this.getAttribute("label");
         if (label) { lowInput.setAttribute("aria-label", label + " low"); highInput.setAttribute("aria-label", label + " high"); }
       } else {
         // remove dual inputs
         Array.from(this.querySelectorAll("input.c-range__low, input.c-range__high")).forEach((n) => n.remove());
         const input = this.ensure("input.c-range", () => { const el = document.createElement("input"); el.type = "range"; return el; });
         // ensure class
         input.className = "c-range";
         input.type = "range";
         input.min = min;
         input.max = max;
         const attrVal = this.getAttribute("value") || "50";
         if (this._rangeUserValue !== null && this._rangeAttrAtDirty === (this.getAttribute("value") || "50")) {
           input.value = this._rangeUserValue;
         } else {
           input.value = attrVal;
           this._rangeUserValue = null;
           this._rangeAttrAtDirty = null;
         }
         const label = this.getAttribute("label");
         if (label) input.setAttribute("aria-label", label);
         else if (!input.hasAttribute("aria-label")) input.setAttribute("aria-label", "Range");
         const updateFill = () => {
           const mn = Number(input.min) || 0;
           const mx = Number(input.max) || 100;
           const val = Number(input.value) || 0;
           const pct = mx > mn ? ((val - mn) / (mx - mn)) * 100 : 0;
           input.style.setProperty("--fill", pct + "%");
         };
         updateFill();
         if (!input._fillWired) {
           input._fillWired = true;
           input.addEventListener("input", updateFill);
         }
       }
     }
  }
  // patch enhance onto ContourRange
  const _origRangeRender = ContourRange.prototype.render;
   ContourRange.prototype.attributeChangedCallback = function(name, oldValue, newValue) {
     if (name === "value") { this._rangeUserValue = null; this._rangeAttrAtDirty = null; }
     if (name === "low") { this._rangeUserLow = null; this._rangeAttrLowAtDirty = null; }
     if (name === "high") { this._rangeUserHigh = null; this._rangeAttrHighAtDirty = null; }
     return ContourBase.prototype.attributeChangedCallback.call(this, name, oldValue, newValue);
   };
   ContourRange.prototype.enhance = function() {
     if (this._wiredRange) return;
     this._wiredRange = true;
     const sync = () => {
       const low = this.querySelector("input.c-range__low");
       const high = this.querySelector("input.c-range__high");
       const single = this.querySelector("input.c-range:not(.c-range__low):not(.c-range__high)");
       if (this._internals) {
         if (low && high) this._internals.setFormValue(low.value + "," + high.value);
         else if (single) this._internals.setFormValue(single.value);
       }
     };
     this.addEventListener("input", (e) => {
       const low = this.querySelector("input.c-range__low");
       const high = this.querySelector("input.c-range__high");
       const single = this.querySelector("input.c-range:not(.c-range__low):not(.c-range__high)");
       if (low && high && (e.target === low || e.target === high)) {
         this._rangeUserLow = low.value;
         this._rangeUserHigh = high.value;
         this._rangeAttrLowAtDirty = this.getAttribute("low") || (this.getAttribute("min") || "0");
         this._rangeAttrHighAtDirty = this.getAttribute("high") || (this.getAttribute("max") || "100");
         sync();
         this._emitForm("contour:input", { low: Number(low.value), high: Number(high.value) });
         this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { low: Number(low.value), high: Number(high.value) } }));
       } else if (single && e.target === single) {
         this._rangeUserValue = single.value;
         this._rangeAttrAtDirty = this.getAttribute("value") || "50";
         sync();
         this._emitForm("contour:input");
       }
     });
     this.addEventListener("change", (e) => {
       const low = this.querySelector("input.c-range__low");
       const high = this.querySelector("input.c-range__high");
       const single = this.querySelector("input.c-range:not(.c-range__low):not(.c-range__high)");
       if (low && high && (e.target === low || e.target === high)) {
         sync();
         this._emitForm("contour:change", { low: Number(low.value), high: Number(high.value) });
         this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { low: Number(low.value), high: Number(high.value) } }));
       } else if (single && e.target === single) {
         sync();
         this._emitForm("contour:change");
       }
     });
     sync();
   };
  define("contour-range", ContourRange);
/**
 * Switch: a `role="switch"` checkbox control with label, required, disabled,
 * error and help states. Form associated; emits `contour:change` on toggle.
 * Renders a `c-switch__track` element after the input for the sheet's track
 * styling.
 */
class ContourSwitch extends ContourBase {
    static get observed() { return ["label", "required", "checked", "disabled", "error", "help"]; }
    static get properties() { return { label: { attribute: "label" }, required: { attribute: "required", type: Boolean }, checked: { attribute: "checked", type: Boolean }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
    static get formAssociated() { return true; }
    render() {
      this.classList.add("c-switch");
      const label = this.getAttribute("label");
      // The guide's control is `label.c-switch` wrapping `input.c-switch__input`
      // and a bare span of text; the sheet paints the track on the input itself.
       const input = this.ensure("input.c-switch__input", () => { const el = document.createElement("input"); el.className = "c-switch__input"; el.type = "checkbox"; return el; });
       input.checked = this.hasAttribute("checked");
       input.setAttribute("role", "switch");
      input.setAttribute("aria-checked", String(input.checked));
      this._setCustomState("data-checked", input.checked);
      if (this.hasAttribute("disabled")) { input.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
      else { input.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-switch__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-switch__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-switch__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
      // Ensure track element follows the input (CSS: input + track).
      if (!input.nextElementSibling || !input.nextElementSibling.classList.contains("c-switch__track")) {
        const track = document.createElement("span");
        track.className = "c-switch__track";
        track.setAttribute("aria-hidden", "true");
        if (input.nextSibling) this.insertBefore(track, input.nextSibling);
        else this.appendChild(track);
      }
      if (label) {
        input.setAttribute("aria-label", label);
        const txt = this.querySelector(":scope > span:not([class]):not(.c-switch__track)") || (() => { const el = document.createElement("span"); this.appendChild(el); return el; })();
        txt.textContent = label;
      }
    }
    enhance() {
      const input = this.querySelector("input");
      if (input && this._internals) {
        input.setAttribute("aria-checked", String(input.checked));
        this._setCustomState("data-checked", input.checked);
        this._internals.setFormValue(input.checked ? (input.value || "on") : null);
        this._syncValidity(this.hasAttribute("required") && !input.checked);
      }
      if (this._wiredSwitch) return;
      this._wiredSwitch = true;
      this.addEventListener("change", (e) => {
        const inp = this.querySelector("input");
        if (!inp || e.target !== inp || !this._internals) return;
        inp.setAttribute("aria-checked", String(inp.checked));
        this._setCustomState("data-checked", inp.checked);
        this._internals.setFormValue(inp.checked ? (inp.value || "on") : null);
        this._emitForm("contour:change");
        this._syncValidity(this.hasAttribute("required") && !inp.checked);
      });
    }
  }
  define("contour-switch", ContourSwitch);
/**
 * Check: a checkbox (or `type="radio"` when `type` is set) with label, name,
 * value, required, checked, disabled, error and help states. Renders a
 * `c-check__box` element after the input. Form associated; emits
 * `contour:change` on toggle.
 */
class ContourCheck extends ContourBase {
    static get observed() { return ["label", "name", "value", "required", "type", "checked", "disabled", "error", "help"]; }
    static get properties() { return { label: { attribute: "label" }, name: { attribute: "name" }, value: { attribute: "value" }, required: { attribute: "required", type: Boolean }, type: { attribute: "type" }, checked: { attribute: "checked", type: Boolean }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
    static get formAssociated() { return true; }
    render() {
      this.classList.add("c-check");
      const label = this.getAttribute("label");
       const input = this.ensure("input.c-check__input", () => { const el = document.createElement("input"); el.className = "c-check__input"; el.type = this.getAttribute("type") === "radio" ? "radio" : "checkbox"; return el; });
       input.checked = this.hasAttribute("checked");
      // Ensure box element follows the input (CSS: input + box).
      if (!input.nextElementSibling || !input.nextElementSibling.classList.contains("c-check__box")) {
        const box = document.createElement("span");
        box.className = "c-check__box";
        box.setAttribute("aria-hidden", "true");
        if (input.nextSibling) this.insertBefore(box, input.nextSibling);
        else this.appendChild(box);
      }
      if (label) {
        input.setAttribute("aria-label", label);
        const txt = this.querySelector(":scope > span:not([class]):not(.c-check__box)") || (() => { const el = document.createElement("span"); this.appendChild(el); return el; })();
        txt.textContent = label;
      }
      if (this.hasAttribute("name")) input.name = this.getAttribute("name");
      if (this.hasAttribute("value")) input.value = this.getAttribute("value");
      if (this.hasAttribute("disabled")) { input.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
      else { input.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-check__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-check__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-check__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
    }
    enhance() {
      const input = this.querySelector("input");
      if (input && this._internals) {
        this._setCustomState("data-checked", input.checked);
        this._internals.setFormValue(input.checked ? (input.value || "on") : null);
        this._syncValidity(this.hasAttribute("required") && !input.checked);
      }
      if (this._wiredCheck) return;
      this._wiredCheck = true;
      this.addEventListener("change", (e) => {
        const inp = this.querySelector("input");
        if (!inp || e.target !== inp || !this._internals) return;
        this._setCustomState("data-checked", inp.checked);
        this._internals.setFormValue(inp.checked ? (inp.value || "on") : null);
        this._emitForm("contour:change");
        this._syncValidity(this.hasAttribute("required") && !inp.checked);
      });
    }
  }
  define("contour-check", ContourCheck);
/**
 * Radio: a radio button with label, name, value, required, checked, disabled,
 * error and help states. Form associated; unchecking clears the stale FormData
 * entry. Emits `contour:change` on toggle.
 */
class ContourRadio extends ContourBase {
    static get observed() { return ["label", "name", "value", "required", "checked", "disabled", "error", "help"]; }
    static get properties() { return { label: { attribute: "label" }, name: { attribute: "name" }, value: { attribute: "value" }, required: { attribute: "required", type: Boolean }, checked: { attribute: "checked", type: Boolean }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
    static get formAssociated() { return true; }
    render() {
      this.classList.add("c-radio");
      const label = this.getAttribute("label");
       const input = this.ensure("input.c-radio__input", () => { const el = document.createElement("input"); el.className = "c-radio__input"; el.type = "radio"; return el; });
       input.checked = this.hasAttribute("checked");
      if (this.hasAttribute("name")) input.name = this.getAttribute("name");
      if (this.hasAttribute("value")) input.value = this.getAttribute("value");
      if (this.hasAttribute("disabled")) { input.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
      else { input.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-radio__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-radio__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-radio__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
      if (label) {
        input.setAttribute("aria-label", label);
        const txt = this.querySelector(":scope > span:not([class])") || (() => { const el = document.createElement("span"); this.appendChild(el); return el; })();
        txt.textContent = label;
      }
    }
    enhance() {
      const input = this.querySelector("input");
      if (input && this._internals) {
        this._setCustomState("data-checked", input.checked);
        this._internals.setFormValue(input.checked ? (input.value || "on") : null);
        this._syncValidity(this.hasAttribute("required") && !input.checked);
      }
      if (this._wiredRadio) return;
      this._wiredRadio = true;
      this.addEventListener("change", (e) => {
        const inp = this.querySelector("input");
        if (!inp || e.target !== inp || !this._internals) return;
        // Unchecking (group movement) must clear the stale FormData entry,
        // not leave it behind beside the new selection.
        this._setCustomState("data-checked", inp.checked);
        this._internals.setFormValue(inp.checked ? (inp.value || "on") : null);
        this._emitForm("contour:change");
        this._syncValidity(this.hasAttribute("required") && !inp.checked);
      });
    }
  }
  define("contour-radio", ContourRadio);
  /**
 * Select: a native `<select>` wrapper populated from a JSON `options` attribute
 * (with optgroup support) or an authored `<select>`. Supports label, placeholder,
 * required, disabled, error and help. Form associated; emits `contour:change`.
 */
class ContourSelect extends ContourBase {
    static get observed() { return ["options", "required", "label", "placeholder", "disabled", "error", "help"]; }
    static get properties() { return { options: { attribute: "options" }, required: { attribute: "required", type: Boolean }, label: { attribute: "label" }, placeholder: { attribute: "placeholder" }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
    static get formAssociated() { return true; }
    render() {
      this.classList.add("c-select");
      const options = this.getAttribute("options");
      // Slot composition: an authored <select> wins over the JSON attribute.
      const generated = new Set(this._contourGenerated || []);
      const authored = Array.from(this.children).filter((n) => !generated.has(n));
      if (options && !authored.length) {
        try {
          const parsed = JSON.parse(options);
           const select = this.ensure("select.c-select", () => { const el = document.createElement("select"); el.className = "c-select"; return el; });
           select.innerHTML = "";
           const label = this.getAttribute("label");
           if (label) {
             select.setAttribute("aria-label", label);
           }
           const placeholder = this.getAttribute("placeholder");
           if (placeholder) {
             const ph = document.createElement("option");
             ph.value = "";
             ph.textContent = placeholder;
             ph.disabled = true;
             ph.selected = true;
             select.appendChild(ph);
           }
           // Group support.
           const groups = {};
           parsed.forEach((opt) => {
             const g = (typeof opt === "object" && opt !== null) ? opt.group : null;
             if (g) {
               if (!groups[g]) { groups[g] = document.createElement("optgroup"); groups[g].label = g; select.appendChild(groups[g]); }
               const option = document.createElement("option");
               option.value = typeof opt === "string" ? opt : opt.value;
               option.textContent = typeof opt === "string" ? opt : opt.label;
               groups[g].appendChild(option);
             } else {
               const option = document.createElement("option");
               option.value = typeof opt === "string" ? opt : opt.value;
               option.textContent = typeof opt === "string" ? opt : opt.label;
               select.appendChild(option);
             }
           });
          if (select.parentNode !== this) this.appendChild(select);
          this.classList.remove("c-select");
          select.classList.add("c-select");
        } catch (e) { /* keep existing */ }
      }
      // Ensure authored select gets c-select styling.
      const authoredSel = this.querySelector("select");
      if (authoredSel && !authoredSel.classList.contains("c-select")) {
        authoredSel.classList.add("c-select");
        this.classList.remove("c-select");
      }
      // Disabled / error / help contract (applies to authored or generated select).
      const sel = this.querySelector("select");
      if (sel) {
        if (this.hasAttribute("disabled")) { sel.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
        else { sel.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      }
      // Label (applies to both JSON and authored options).
      const label = this.getAttribute("label");
      if (label) {
        let lbl = this.querySelector("label.c-select__label");
        if (!lbl) { lbl = document.createElement("label"); lbl.className = "c-select__label"; this.insertBefore(lbl, sel || this.firstChild); }
        lbl.textContent = label;
        if (sel) sel.setAttribute("aria-label", label);
      }
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-select__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-select__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-select__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
    }
    enhance() {
      const select = this.querySelector("select");
      if (select && this._internals) {
        this._internals.setFormValue(select.value);
        this._syncValidity(this.hasAttribute("required") && !select.value);
      }
      if (this._wiredSelect) return;
      this._wiredSelect = true;
      this.addEventListener("change", (e) => {
        const sel = this.querySelector("select");
        if (!sel || e.target !== sel || !this._internals) return;
        this._internals.setFormValue(sel.value);
        this._emitForm("contour:change");
        this._syncValidity(this.hasAttribute("required") && !sel.value);
      });
    }
  }
  define("contour-select", ContourSelect);
/**
 * Version: a `<select>` of version options from a JSON `options` attribute,
 * with `selected` support per option. Form associated; emits `contour:change`.
 */
class ContourVersion extends ContourBase {
    static get observed() { return ["options"]; }
    static get formAssociated() { return true; }
    static get properties() { return { options: { attribute: "options" } }; }
    render() {
      this.classList.add("c-version");
      const options = this.getAttribute("options");
      const generated = new Set(this._contourGenerated || []);
      const authored = Array.from(this.children).filter((n) => !generated.has(n));
      if (options && !authored.length) {
        try {
          const parsed = JSON.parse(options);
           const select = this.ensure("select.c-version", () => { const el = document.createElement("select"); el.className = "c-version"; return el; });
           select.innerHTML = "";
           if (!select.hasAttribute("aria-label")) select.setAttribute("aria-label", "Version");
          parsed.forEach((opt) => {
            const option = document.createElement("option");
            if (typeof opt === "string") { option.value = opt; option.textContent = opt; }
            else { option.value = opt.value || opt.label; option.textContent = opt.label || opt.value; if (opt.selected) option.selected = true; }
            select.appendChild(option);
          });
          if (select.parentNode !== this) this.appendChild(select);
          this.classList.remove("c-version");
          select.classList.add("c-version");
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredVersion) return;
      this._wiredVersion = true;
      const sync = () => {
        const select = this.querySelector("select");
        if (!select || !this._internals) return;
        this._internals.setFormValue(select.value);
      };
      this.addEventListener("change", (e) => {
        const select = this.querySelector("select");
        if (!select || e.target !== select) return;
        sync();
        this._emitForm("contour:change");
      });
      sync();
    }
  }
  define("contour-version", ContourVersion);
/**
 * Textarea: a `<textarea>` wrapper with placeholder, required, disabled, error
 * and help states. Form associated; emits `contour:input` / `contour:change`.
 */
class ContourTextarea extends ContourBase {
    static get observed() { return ["placeholder", "required", "disabled", "error", "help"]; }
    static get properties() { return { placeholder: { attribute: "placeholder" }, required: { attribute: "required", type: Boolean }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
    static get formAssociated() { return true; }
    render() {
      const ta = this.ensure("textarea", () => { const el = document.createElement("textarea"); el.className = "c-textarea"; return el; });
      ta.className = "c-textarea";
      ta.placeholder = this.getAttribute("placeholder") || "";
      if (this.hasAttribute("required")) ta.setAttribute("required", "");
      else ta.removeAttribute("required");
      if (this.hasAttribute("disabled")) { ta.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
      else { ta.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-textarea__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-textarea__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-textarea__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
    }
    enhance() {
      const ta = this.querySelector("textarea");
      if (ta && this._internals) {
        this._internals.setFormValue(ta.value);
        this._syncValidity(this.hasAttribute("required") && !ta.value.trim());
      }
      if (this._wiredTextarea) return;
      this._wiredTextarea = true;
      this.addEventListener("input", (e) => {
        const t = this.querySelector("textarea");
        if (!t || e.target !== t || !this._internals) return;
        this._internals.setFormValue(t.value);
        this._emitForm("contour:input");
        this._syncValidity(this.hasAttribute("required") && !t.value.trim());
      });
      this.addEventListener("change", (e) => {
        const t = this.querySelector("textarea");
        if (!t || e.target !== t || !this._internals) return;
        this._internals.setFormValue(t.value);
        this._emitForm("contour:change");
        this._syncValidity(this.hasAttribute("required") && !t.value.trim());
      });
    }
  }
  define("contour-textarea", ContourTextarea);
/**
 * Input: an `<input>` wrapper with type, placeholder, required, value, disabled,
 * error and help states. Form associated; emits `contour:input` / `contour:change`.
 */
class ContourInputFull extends ContourBase {
    static get observed() { return ["type", "placeholder", "required", "value", "disabled", "error", "help", "label"]; }
    static get properties() { return { type: { attribute: "type" }, placeholder: { attribute: "placeholder" }, required: { attribute: "required", type: Boolean }, value: { attribute: "value" }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" }, label: { attribute: "label" } }; }
    static get formAssociated() { return true; }
    render() {
      this.classList.add("c-input");
      const input = this.ensure("input", () => { const el = document.createElement("input"); el.className = "c-input"; return el; });
      input.className = "c-input";
      input.type = this.getAttribute("type") || "text";
       input.placeholder = this.getAttribute("placeholder") || "";
       const label = this.getAttribute("label");
       if (label) input.setAttribute("aria-label", label);
       // else: keep any aria-label set by an ancestor (e.g. contour-field).
      if (this.hasAttribute("value")) input.value = this.getAttribute("value");
      if (this.hasAttribute("required")) input.setAttribute("required", "");
      else input.removeAttribute("required");
      if (this.hasAttribute("disabled")) { input.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
      else { input.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      // Error/help text
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-input__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-input__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-input__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
    }
    enhance() {
      const input = this.querySelector("input");
      if (input && this._internals) {
        this._internals.setFormValue(input.value);
        this._syncValidity(this.hasAttribute("required") && !input.value.trim());
      }
      if (this._wiredInput) return;
      this._wiredInput = true;
      this.addEventListener("input", (e) => {
        const inp = this.querySelector("input");
        if (!inp || e.target !== inp || !this._internals) return;
        this._internals.setFormValue(inp.value);
        this._emitForm("contour:input");
        this._syncValidity(this.hasAttribute("required") && !inp.value.trim());
      });
      this.addEventListener("change", (e) => {
        const inp = this.querySelector("input");
        if (!inp || e.target !== inp || !this._internals) return;
        this._internals.setFormValue(inp.value);
        this._emitForm("contour:change");
        this._syncValidity(this.hasAttribute("required") && !inp.value.trim());
      });
    }
  }
  define("contour-input", ContourInputFull);
/**
 * InputGroup: a text input with an optional search icon, a clear (×) affordance
 * and a submit (→) affordance. Attributes: `label`, `placeholder`, `clearable`,
 * `submit`. Emits `contour:change` (bubbles, composed) with `{ value: "" }` on
 * clear.
 */
class ContourInputGroup extends ContourBase {
    static get observed() { return ["label", "placeholder", "clearable", "submit"]; }
    static get properties() { return { label: { attribute: "label" }, placeholder: { attribute: "placeholder" }, clearable: { attribute: "clearable", type: Boolean }, submit: { attribute: "submit", type: Boolean } }; }
    render() {
      this.classList.add("c-input-group");
      const icon = this.ensure("svg", () => { const el = document.createElementNS("http://www.w3.org/2000/svg", "svg"); el.setAttribute("aria-hidden", "true"); const use = document.createElementNS("http://www.w3.org/2000/svg", "use"); use.setAttribute("href", "#i-search"); el.appendChild(use); return el; });
      const input = this.ensure("input.c-input", () => { const el = document.createElement("input"); el.className = "c-input"; el.type = "text"; return el; });
      input.placeholder = this.getAttribute("placeholder") || this.getAttribute("label") || "";
      // Clear affordance.
      const oldClear = this.querySelector(".c-input-group__clear");
      if (oldClear) oldClear.remove();
      if (this.hasAttribute("clearable")) {
        const btn = document.createElement("button");
        btn.className = "c-input-group__clear";
        btn.type = "button";
        btn.setAttribute("aria-label", "Clear");
        btn.textContent = "×";
        this.appendChild(btn);
      }
      // Submit affordance.
      const oldSubmit = this.querySelector(".c-input-group__submit");
      if (oldSubmit) oldSubmit.remove();
      if (this.hasAttribute("submit")) {
        const btn = document.createElement("button");
        btn.className = "c-input-group__submit";
        btn.type = "submit";
        btn.setAttribute("aria-label", "Submit");
        btn.textContent = "→";
        this.appendChild(btn);
      }
    }
    enhance() {
      if (this._wiredInputGroup) return;
      this._wiredInputGroup = true;
      this.addEventListener("click", (e) => {
        const clear = e.target && e.target.closest ? e.target.closest(".c-input-group__clear") : null;
        if (clear && this.contains(clear)) {
          e.preventDefault();
          const input = this.querySelector("input.c-input");
          if (input) { input.value = ""; input.focus(); }
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: "" } }));
        }
      });
    }
  }
  define("contour-input-group", ContourInputGroup);
/**
 * RadioList: a `role="radiogroup"` of radio options from a JSON `items`
 * attribute (or remote `src`). Supports roving tabindex, Home/End navigation,
 * RTL, empty/loading/error states, and `formResetCallback` that re-renders from
 * the authored `items` payload. Form associated; emits `contour:change`.
 */
class ContourRadioList extends ContourBase {
    static get observed() { return ["items", "name", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, name: { attribute: "name" }, src: { attribute: "src" } }; }
    static get formAssociated() { return true; }
    render() {
      this.classList.add("c-radio-list");
      this.setAttribute("role", "radiogroup");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", this.getAttribute("name") || "Options");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "radio-list")) return;
       const items = remoteData(this, "items");
       Array.from(this.querySelectorAll("label.c-radio")).forEach((l) => l.remove());
       if (items) {
         try {
           const parsed = JSON.parse(items);
           const groupName = this.getAttribute("name") || contourId("radio-list");
           parsed.forEach((it) => {
             const lbl = document.createElement("label");
             lbl.className = "c-radio";
             const input = document.createElement("input");
             input.type = "radio";
             input.className = "c-radio__input";
             input.name = groupName;
            input.tabIndex = -1;
            if (typeof it === "string") { input.value = it; lbl.appendChild(input); lbl.appendChild(document.createTextNode(" " + it)); }
            else { input.value = it.value || it.label; if (it.checked) input.checked = true; lbl.appendChild(input); const span = document.createElement("span"); span.textContent = it.label || it.value; lbl.appendChild(span); }
            this.appendChild(lbl);
          });
          // Roving tabindex: only the checked item (or the first) is in the tab
          // order, exactly like a native radiogroup.
          const radios = Array.from(this.querySelectorAll("input.c-radio__input"));
          const checked = radios.find((r) => r.checked) || radios[0];
          if (checked) checked.tabIndex = 0;
        } catch (e) { /* keep existing */ }
      } else {
        renderEmpty(this, "radio-list");
      }
    }
    enhance() {
      const sync = () => {
        if (!this._internals) return;
        const checked = this.querySelector("input.c-radio__input:checked");
        this._internals.setFormValue(checked ? checked.value : null);
      };
      sync();
      if (this._wiredRadioList) return;
      this._wiredRadioList = true;
      // Form life + group semantics, delegated on the host (rule 12): the
      // inputs are rebuilt on every render, so node-bound listeners would die.
      this.addEventListener("change", (e) => {
        const input = e.target && e.target.closest ? e.target.closest("input.c-radio__input") : null;
        if (!input || !this.contains(input)) return;
        sync();
        this._emitForm("contour:change");
      });
      this.addEventListener("keydown", (e) => {
        const radios = Array.from(this.querySelectorAll("input.c-radio__input"));
        if (!radios.length) return;
        const idx = radios.indexOf(e.target);
        if (idx === -1) return;
        const rtl = (this.getAttribute("dir") || document.documentElement.getAttribute("dir") || "").toLowerCase() === "rtl";
        let next = -1;
        if (e.key === "ArrowDown") next = (idx + 1) % radios.length;
        else if (e.key === "ArrowUp") next = (idx - 1 + radios.length) % radios.length;
        else if (e.key === "ArrowRight") next = rtl ? (idx - 1 + radios.length) % radios.length : (idx + 1) % radios.length;
        else if (e.key === "ArrowLeft") next = rtl ? (idx + 1) % radios.length : (idx - 1 + radios.length) % radios.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = radios.length - 1;
        else return;
        e.preventDefault();
        const before = radios.find((r) => r.checked);
        for (const r of radios) r.tabIndex = -1;
        radios[next].tabIndex = 0;
        radios[next].checked = true;
        radios[next].focus();
        sync();
        // Native radio groups fire change when an arrow moves the selection;
        // wrap-around onto the same radio is not a change.
        if (before !== radios[next]) this._emitForm("contour:change");
      });
    }
    formResetCallback() {
      // The authored default lives in the `items` payload (`it.checked`), not
      // in checked attributes on generated radios, so re-render from the data
      // rather than blanking every selection like the generic base reset.
      if (this._contourAuthored) this.requestRender();
    }
  }
define("contour-radio-list", ContourRadioList);



class ContourPressableFull extends ContourBase {
    static get observed() { return ["disabled"]; }
    static get properties() { return { disabled: { attribute: "disabled", type: Boolean } }; }
    render() {
      this.classList.add("c-pressable");
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      if (this.hasAttribute("disabled")) {
        this.setAttribute("aria-disabled", "true");
        this.setAttribute("tabindex", "-1");
      } else {
        this.removeAttribute("aria-disabled");
        if (!this.hasAttribute("tabindex") || this.getAttribute("tabindex") === "-1") this.setAttribute("tabindex", "0");
      }
    }
    enhance() {
      if (this._wiredPressable) return;
      this._wiredPressable = true;
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.click(); this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true })); }
      });
    }
  }
  define("contour-pressable", ContourPressableFull);
class ContourResizeHandleFull extends ContourBase {
    render() {
      this.classList.add("c-resize-handle");
      if (!this.hasAttribute("role")) this.setAttribute("role", "separator");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Resize handle");
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      if (!this.hasAttribute("aria-orientation")) this.setAttribute("aria-orientation", "horizontal");
    }
  }
  define("contour-resize-handle", ContourResizeHandleFull);
class ContourSearchTriggerFull extends ContourBase {
    static get observed() { return ["label", "shortcut"]; }
    static get properties() { return { label: { attribute: "label" }, shortcut: { attribute: "shortcut" } }; }
    render() {
      this.classList.add("c-search-trigger");
      const label = this.getAttribute("label") || "Search";
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", label);
      const span = this.ensure(".c-search-trigger__text", () => { const el = document.createElement("span"); el.className = "c-search-trigger__text"; return el; });
      span.className = "c-search-trigger__text";
      if (!span.textContent.trim() || span.textContent.trim() !== label) span.textContent = label;
      const kbd = this.ensure("kbd.c-search-trigger__kbd", () => { const el = document.createElement("kbd"); el.className = "c-search-trigger__kbd"; return el; });
      kbd.className = "c-search-trigger__kbd";
      kbd.textContent = this.getAttribute("shortcut") || "⌘K";
    }
  }
  define("contour-search-trigger", ContourSearchTriggerFull);
class ContourShortcutListFull extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-shortcut-list");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-shortcut-list__title", () => { const el = document.createElement("div"); el.className = "c-shortcut-list__title"; el.style.padding = "var(--space-sm)"; el.style.fontWeight = "var(--weight-semibold)"; return el; });
        t.textContent = title;
      }
    }
  }
  define("contour-shortcut-list", ContourShortcutListFull);
class ContourShortcutRowFull extends ContourBase {
    static get observed() { return ["desc", "key"]; }
    static get properties() { return { desc: { attribute: "desc" }, key: { attribute: "key" } }; }
    render() {
      this.classList.add("c-shortcut-row");
      const key = this.getAttribute("key");
      const desc = this.getAttribute("desc");
      if (key) {
        const k = this.ensure(".c-shortcut-row__keys", () => { const el = document.createElement("kbd"); el.className = "c-shortcut-row__keys"; return el; });
        k.className = "c-shortcut-row__keys";
        k.textContent = key;
      } else {
        const k = this.querySelector(".c-shortcut-row__keys");
        if (k) k.remove();
      }
      if (desc) {
        const s = this.ensure(".c-shortcut-row__label", () => { const el = document.createElement("span"); el.className = "c-shortcut-row__label"; return el; });
        s.className = "c-shortcut-row__label";
        s.textContent = desc;
      } else {
        const s = this.querySelector(".c-shortcut-row__label");
        if (s) s.remove();
      }
    }
  }
  define("contour-shortcut-row", ContourShortcutRowFull);
class ContourShortcutPanelFull extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-shortcut-panel");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-shortcut-panel__title", () => { const el = document.createElement("div"); el.className = "c-shortcut-panel__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-shortcut-panel__title");
        if (t) t.remove();
      }
    }
  }
  define("contour-shortcut-panel", ContourShortcutPanelFull);
  class ContourShortcutOverlayFull extends ContourBase {
    static get observed() { return ["title", "open"]; }
    static get properties() { return { title: { attribute: "title" }, open: { attribute: "open", type: Boolean } }; }
    render() {
      this.classList.add("c-shortcut-overlay");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-shortcut-overlay__title", () => { const el = document.createElement("div"); el.className = "c-shortcut-overlay__title"; el.style.padding = "var(--space-sm)"; return el; });
        t.textContent = title;
      }
      if (this.hasAttribute("open")) this.removeAttribute("hidden");
      else if (!this.hasAttribute("hidden")) this.setAttribute("hidden", "");
    }
    show() { this.setAttribute("open", ""); this.removeAttribute("hidden"); this.dispatchEvent(new CustomEvent("contour:open", { bubbles: true, composed: true })); }
    hide() { this.removeAttribute("open"); this.setAttribute("hidden", ""); this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true })); }
    toggle() { if (this.hasAttribute("open")) this.hide(); else this.show(); }
    enhance() {
      if (this._wiredShortcutOverlay) return;
      this._wiredShortcutOverlay = true;
      // Global registry: "?" (Shift+/) toggles the overlay; Escape closes.
      const keyHandler = (e) => {
        if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
          const tag = (e.target && e.target.tagName) || "";
          if (tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable)) return;
          e.preventDefault();
          this.toggle();
        } else if (e.key === "Escape" && this.hasAttribute("open")) {
          this.hide();
        }
      };
      document.addEventListener("keydown", keyHandler);
      onDispose(this, () => document.removeEventListener("keydown", keyHandler));
      this.addEventListener("click", (e) => {
        if (e.target === this) this.hide();
      });
    }
  }
  define("contour-shortcut-overlay", ContourShortcutOverlayFull);
class ContourRowActionFull extends ContourBase {
    static get observed() { return ["label", "disabled"]; }
    static get properties() { return { label: { attribute: "label" }, disabled: { attribute: "disabled", type: Boolean } }; }
    render() {
      this.classList.add("c-row-action");
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      if (this.hasAttribute("disabled")) {
        this.setAttribute("aria-disabled", "true");
        this.setAttribute("tabindex", "-1");
      } else {
        this.removeAttribute("aria-disabled");
        if (!this.hasAttribute("tabindex") || this.getAttribute("tabindex") === "-1") this.setAttribute("tabindex", "0");
      }
      const label = this.getAttribute("label");
      if (label && !this.hasChildNodes()) this.textContent = label;
    }
    enhance() {
      if (this._wiredRowAction) return;
      this._wiredRowAction = true;
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.click(); this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true })); }
      });
    }
  }
  define("contour-row-action", ContourRowActionFull);
class ContourSegmented extends ContourBase {
    static get observed() { return ["options", "selected", "label", "value"]; }
    static get properties() { return { options: { attribute: "options" }, selected: { attribute: "selected" }, label: { attribute: "label" }, value: { attribute: "value" } }; }
    render() {
      this.classList.add("c-segmented");
      const options = this.getAttribute("options");
      if (options) {
        let parsed = null;
        try { parsed = JSON.parse(options); } catch (e) { parsed = null; }
        if (Array.isArray(parsed)) {
          // Drop previously generated buttons.
          Array.from(this.querySelectorAll("button.c-segmented__option")).forEach((n) => n.remove());
          const selected = this.getAttribute("selected") || this.getAttribute("value");
          parsed.forEach((opt, i) => {
            const label = typeof opt === "string" ? opt : (opt.label || opt.value || "");
            const val = typeof opt === "string" ? opt : (opt.value || opt.label || "");
            const btn = document.createElement("button");
            btn.className = "c-segmented__option";
            btn.type = "button";
            btn.textContent = label;
            btn.dataset.value = val;
            if (selected !== null && String(val) === String(selected)) btn.setAttribute("aria-pressed", "true");
            else if (selected === null && i === 0) btn.setAttribute("aria-pressed", "true");
            else btn.setAttribute("aria-pressed", "false");
            this.appendChild(btn);
          });
        }
      }
    }
    enhance() {
      wireSegmented(this);
    }
  }
  define("contour-segmented", ContourSegmented);
class ContourDraggable extends ContourBase {
    render() {
      this.classList.add("c-draggable");
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      if (!this.hasAttribute("draggable")) this.setAttribute("draggable", "true");
    }
    // The value a drop partner receives: the authored `value` attribute, else
    // the `label`, else the element's own text. One shape, so a consumer's
    // contour:drop handler sees the same detail a contour:dragstart carried.
    // `label` and `value` are shared-list attributes (they are not overridden
    // here), so the inherited full shared list stays the observed contract.
    _dragValue() {
      return this.getAttribute("value") || this.getAttribute("label") || (this.textContent || "").trim() || "draggable";
    }
    enhance() {
      if (this._wiredDraggable) return;
      this._wiredDraggable = true;
      // Native drag-and-drop (BY-26). The platform owns the drag gesture; the
      // component owns the payload and the visual state. dragstart writes
      // text/plain (the portable payload nearly every drop partner can read),
      // marks the item with the shipped .c-draggable--dragging state, and
      // announces contour:dragstart so a dashboard can react before the drop.
      this.addEventListener("dragstart", (e) => {
        if (!e.dataTransfer) return;
        const value = this._dragValue();
        try { e.dataTransfer.effectAllowed = "move"; } catch (err) { /* synthetic drag: read-only */ }
        e.dataTransfer.setData("text/plain", value);
        this.classList.add("c-draggable--dragging");
        this.dispatchEvent(new CustomEvent("contour:dragstart", { bubbles: true, composed: true, detail: { value } }));
      });
      this.addEventListener("dragend", () => {
        this.classList.remove("c-draggable--dragging");
        this.dispatchEvent(new CustomEvent("contour:dragend", { bubbles: true, composed: true, detail: { value: this._dragValue() } }));
      });
      // Keyboard alternative: HTML5 DnD has no keyboard story, so the focused
      // draggable offers ArrowUp/ArrowDown as a move action the consumer
      // handles exactly like a drop (the accessible reorder pattern). It rides
      // the same event vocabulary — contour:move {direction} — and never fakes
      // a drag it cannot perform.
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true })); return; }
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:move", { bubbles: true, composed: true, detail: { direction: e.key === "ArrowUp" ? "up" : "down" } }));
        }
      });
    }
  }
  define("contour-draggable", ContourDraggable);
class ContourDragHandle extends ContourBase {
    render() {
      this.classList.add("c-drag-handle");
      if (!this.hasAttribute("role")) this.setAttribute("role", "separator");
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      if (!this.hasAttribute("aria-orientation")) this.setAttribute("aria-orientation", "horizontal");
    }
    enhance() {
      if (this._wiredDragHandle) return;
      this._wiredDragHandle = true;
      this.addEventListener("keydown", (e) => {
        let delta = 0;
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -1;
        else if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = 1;
        else if (e.key === "Home") delta = -Infinity;
        else if (e.key === "End") delta = Infinity;
        else return;
        e.preventDefault();
        this.dispatchEvent(new CustomEvent("contour:drag", { bubbles: true, composed: true, detail: { key: e.key, delta } }));
      });
    }
  }
  define("contour-drag-handle", ContourDragHandle);
class ContourDropIndicator extends ContourBase {
    static get observed() { return ["label"]; }
    static get properties() { return { label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-drop-indicator");
      this.classList.add("c-drop-indicator--visible");
      Array.from(this.childNodes).forEach((n) => { if (n.nodeType === Node.TEXT_NODE) n.remove(); else if (n.nodeType === Node.ELEMENT_NODE && n.tagName === "SPAN") n.remove(); });
      const label = this.getAttribute("label");
      if (label) {
        const t = this.ensure(".c-drop-indicator__label", () => { const el = document.createElement("span"); el.className = "c-drop-indicator__label"; return el; });
        t.textContent = label;
      }
    }
  }
  define("contour-drop-indicator", ContourDropIndicator);
class ContourDropZone extends ContourBase {
    static get observed() { return ["label"]; }
    static get properties() { return { label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-drop-zone");
      Array.from(this.childNodes).forEach((n) => { if (n.nodeType === Node.TEXT_NODE) n.remove(); else if (n.nodeType === Node.ELEMENT_NODE && n.tagName === "SPAN") n.remove(); });
      const label = this.getAttribute("label");
      if (label) {
        const t = this.ensure(".c-drop-zone__label", () => { const el = document.createElement("p"); el.className = "c-drop-zone__label"; return el; });
        t.textContent = label;
      }
    }
    enhance() {
      if (this._wiredDropZone) return;
      this._wiredDropZone = true;
      // Native drop target (BY-26), delegated on the host (rule 12). dragover
      // is where the platform asks "may it land here?": a text/plain payload
      // is allowed (preventDefault + the shipped --active state), anything
      // else is refused (--reject, no preventDefault so the drop never lands).
      const accepts = (e) => e.dataTransfer && Array.from(e.dataTransfer.types).includes("text/plain");
      const clear = () => { this.classList.remove("c-drop-zone--active", "c-drop-zone--reject"); };
      this.addEventListener("dragenter", (e) => {
        if (!e.dataTransfer) return;
        this.classList.toggle("c-drop-zone--reject", !accepts(e));
        if (accepts(e)) { e.preventDefault(); this.classList.add("c-drop-zone--active"); }
      });
      this.addEventListener("dragover", (e) => {
        if (!e.dataTransfer) return;
        this.classList.toggle("c-drop-zone--reject", !accepts(e));
        if (accepts(e)) { e.preventDefault(); this.classList.add("c-drop-zone--active"); }
      });
      this.addEventListener("dragleave", clear);
      this.addEventListener("drop", (e) => {
        if (!accepts(e)) return;
        e.preventDefault();
        clear();
        const value = e.dataTransfer.getData("text/plain") || "";
        this.dispatchEvent(new CustomEvent("contour:drop", { bubbles: true, composed: true, detail: { value, label: this.getAttribute("label") } }));
      });
      // The keyboard path lives on the draggable (contour:move, BY-26):
      // HTML5 DnD has no keyboard story, and a target that only receives a
      // pointer gesture does not get a focus role it cannot act on alone.
    }
  }
  define("contour-drop-zone", ContourDropZone);
class ContourResizable extends ContourBase {
    static get observed() { return ["direction", "value"]; }
    static get properties() { return { direction: { attribute: "direction" }, value: { attribute: "value" } }; }
    render() {
      this.classList.add("c-resizable");
      this.classList.remove("c-resizable--vertical", "c-resizable--horizontal");
      const vertical = this.getAttribute("direction") === "vertical";
      this.classList.add(vertical ? "c-resizable--vertical" : "c-resizable--horizontal");
      if (!this.querySelector(".c-resizable__pane")) {
        const p1 = document.createElement("div");
        p1.className = "c-resizable__pane";
        p1.textContent = "Pane A";
        const handle = document.createElement("div");
        handle.className = "c-resize-handle";
        handle.setAttribute("tabindex", "0");
        handle.setAttribute("role", "separator");
        const p2 = document.createElement("div");
        p2.className = "c-resizable__pane";
        p2.textContent = "Pane B";
        this.appendChild(p1);
        this.appendChild(handle);
        this.appendChild(p2);
      }
      const v = this._splitValue || this.getAttribute("value");
      if (v) {
        const p1 = this.querySelector(".c-resizable__pane");
        if (p1) p1.style.flex = `0 0 ${v}%`;
      }
    }
    enhance() {
      if (this._wiredResizable) return;
      this._wiredResizable = true;
      // Pointer resize (BY-27): the handle is generated on every render, so
      // the listeners are delegated on the host and re-query per event (rule
      // 12). Dragging sets the first pane's flex-basis; the second pane's
      // `flex: 1 1 0` takes the rest, so the split is the drag's own number.
      const setSplit = (clientX, clientY) => {
        const rect = this.getBoundingClientRect();
        const vertical = this.classList.contains("c-resizable--vertical");
        const span = vertical ? rect.height : rect.width;
        const pos = vertical ? clientY - rect.top : clientX - rect.left;
        const frac = span > 0 ? Math.min(0.9, Math.max(0.1, pos / span)) : 0.5;
        const p1 = this.querySelector(".c-resizable__pane");
        if (p1) p1.style.flex = `0 0 ${Math.round(frac * 100)}%`;
        this._splitValue = String(Math.round(frac * 100));
      };
      this.addEventListener("pointerdown", (e) => {
        const handle = this.querySelector(".c-resize-handle");
        if (!handle || e.target !== handle) return;
        this._resizing = true;
        handle.classList.add("c-resize-handle--dragging");
        if (handle.setPointerCapture) { try { handle.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer: ignore */ } }
        e.preventDefault();
      });
      this.addEventListener("pointermove", (e) => {
        if (!this._resizing) return;
        setSplit(e.clientX, e.clientY);
      });
      const stopResize = (e) => {
        if (!this._resizing) return;
        this._resizing = false;
        if (this._splitValue) { this.setAttribute("value", this._splitValue); this._splitValue = null; }
        const handle = this.querySelector(".c-resize-handle");
        if (handle) {
          handle.classList.remove("c-resize-handle--dragging");
          if (handle.hasPointerCapture && handle.hasPointerCapture(e.pointerId)) {
            try { handle.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
          }
        }
      };
      this.addEventListener("pointerup", stopResize);
      this.addEventListener("pointercancel", stopResize);
      this.addEventListener("keydown", (e) => {
        const handle = this.querySelector(".c-resize-handle");
        if (!handle || document.activeElement !== handle) return;
        const vertical = this.classList.contains("c-resizable--vertical");
        const cur = parseFloat(this.getAttribute("value")) || 50;
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); setSplit && setSplit; const p1 = this.querySelector(".c-resizable__pane"); if (p1) { const nv = Math.max(10, cur - 5); p1.style.flex = `0 0 ${nv}%`; this.setAttribute("value", String(nv)); } }
        else if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); const p1 = this.querySelector(".c-resizable__pane"); if (p1) { const nv = Math.min(90, cur + 5); p1.style.flex = `0 0 ${nv}%`; this.setAttribute("value", String(nv)); } }
      });
    }
  }
  define("contour-resizable", ContourResizable);
class ContourTableWrap extends ContourBase {
    static get observed() { return []; }
    static get properties() { return {}; }
    render() {
      this.classList.add("c-table-wrap");
      Array.from(this.childNodes).forEach((n) => { if (n.nodeType === Node.TEXT_NODE) n.remove(); else if (n.nodeType === Node.ELEMENT_NODE && n.tagName === "SPAN") n.remove(); });
      if (!this.querySelector("table")) {
        const t = document.createElement("table");
        t.className = "c-table";
        const thead = document.createElement("thead");
        const tr = document.createElement("tr");
        for (const h of ["A", "B"]) { const th = document.createElement("th"); th.textContent = h; tr.appendChild(th); }
        thead.appendChild(tr);
        t.appendChild(thead);
        const tbody = document.createElement("tbody");
        const tr2 = document.createElement("tr");
        for (const v of ["1", "2"]) { const td = document.createElement("td"); td.textContent = v; tr2.appendChild(td); }
        tbody.appendChild(tr2);
        t.appendChild(tbody);
        this.appendChild(t);
      }
    }
  }
  define("contour-table-wrap", ContourTableWrap);
class ContourScrollArea extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-scroll-area");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-scroll-area__title", () => { const el = document.createElement("div"); el.className = "c-scroll-area__title"; el.style.padding = "var(--space-sm)"; el.style.fontWeight = "var(--weight-semibold)"; return el; });
        t.textContent = title;
      }
    }
  }
  define("contour-scroll-area", ContourScrollArea);
class ContourBtn extends ContourBase {
    static get observed() { return ["variant", "size", "color", "label", "disabled"]; }
    static get properties() { return { variant: { attribute: "variant" }, size: { attribute: "size" }, color: { attribute: "color" }, label: { attribute: "label" }, disabled: { attribute: "disabled", type: Boolean } }; }
    render() {
      this.classList.add("c-btn");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-btn--")) this.classList.remove(c); });
      for (const attr of ["variant", "size", "color"]) {
        const val = this.getAttribute(attr);
        if (val) this.classList.add("c-btn--" + val);
      }
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      if (this.hasAttribute("disabled")) {
        this.setAttribute("aria-disabled", "true");
        this.setAttribute("tabindex", "-1");
      } else {
        this.removeAttribute("aria-disabled");
        if (!this.hasAttribute("tabindex") || this.getAttribute("tabindex") === "-1") this.setAttribute("tabindex", "0");
      }
      const label = this.getAttribute("label");
      if (label && !this.hasChildNodes()) this.textContent = label;
      if (label && !this.hasAttribute("aria-label")) this.setAttribute("aria-label", label);
    }
    enhance() {
      if (this._wiredBtn) return;
      this._wiredBtn = true;
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.click(); this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true })); }
      });
    }
  }
  define("contour-btn", ContourBtn);


  class ContourApp extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-app");
      const header = this.ensure(".c-app__header", () => { const el = document.createElement("header"); el.className = "c-app__header"; return el; });
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-app__title", () => { const el = document.createElement("div"); el.className = "c-app__title"; el.style.padding = "var(--space-md)"; el.style.fontWeight = "var(--weight-semibold)"; return el; });
        t.textContent = title;
        if (t.parentNode !== header) header.appendChild(t);
      }
      const main = this.ensure(".c-app__main", () => { const el = document.createElement("main"); el.className = "c-app__main"; return el; });
      if (main.parentNode !== this) this.appendChild(main);
      if (header.parentNode !== this) this.insertBefore(header, main);
    }
  }
  define("contour-app", ContourApp);
  class ContourAppBody extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-app-body");
      const main = this.ensure(".c-app-body__main", () => { const el = document.createElement("main"); el.className = "c-app-body__main"; return el; });
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-app-body__title", () => { const el = document.createElement("div"); el.className = "c-app-body__title"; el.style.padding = "var(--space-md)"; return el; });
        t.textContent = title;
        if (t.parentNode !== main) main.appendChild(t);
      }
      if (main.parentNode !== this) this.appendChild(main);
    }
  }
  define("contour-app-body", ContourAppBody);
class ContourBtnGroup extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-btn-group");
      this.setAttribute("role", "group");
      if (this.getAttribute("title")) this.setAttribute("aria-label", this.getAttribute("title"));
      if (!this.querySelector(".c-btn")) {
        for (const lbl of ["One", "Two", "Three"]) {
          const b = document.createElement("button");
          b.className = "c-btn c-btn--sm";
          b.type = "button";
          b.textContent = lbl;
          this.appendChild(b);
        }
      }
    }
    enhance() {
      if (this._wiredBtnGroup) return;
      this._wiredBtnGroup = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-btn") : null;
        if (btn && this.contains(btn)) {
          const buttons = Array.from(this.querySelectorAll(".c-btn"));
          const index = buttons.indexOf(btn);
          this.dispatchEvent(new CustomEvent("contour:btn-group-change", { bubbles: true, composed: true, detail: { index, label: btn.textContent } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const buttons = Array.from(this.querySelectorAll(".c-btn"));
        if (!buttons.length) return;
        const active = document.activeElement;
        const idx = buttons.indexOf(active);
        let next = -1;
        const rtl = (this.getAttribute("dir") || document.documentElement.getAttribute("dir") || "").toLowerCase() === "rtl";
        if (e.key === "ArrowDown") next = idx < 0 ? 0 : Math.min(buttons.length - 1, idx + 1);
        else if (e.key === "ArrowUp") next = idx < 0 ? 0 : Math.max(0, idx - 1);
        else if (e.key === "ArrowRight") next = rtl ? (idx < 0 ? 0 : Math.max(0, idx - 1)) : (idx < 0 ? 0 : Math.min(buttons.length - 1, idx + 1));
        else if (e.key === "ArrowLeft") next = rtl ? (idx < 0 ? 0 : Math.min(buttons.length - 1, idx + 1)) : (idx < 0 ? 0 : Math.max(0, idx - 1));
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = buttons.length - 1;
        if (next >= 0 && next !== idx) {
          e.preventDefault();
          buttons[next].focus();
        }
      });
    }
  }
  define("contour-btn-group", ContourBtnGroup);
  class ContourRangeScale extends ContourBase {
    static get observed() { return ["label", "value", "ticks"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" }, ticks: { attribute: "ticks" } }; }
    render() {
      this.classList.add("c-range-scale");
      this.setAttribute("role", "group");
      if (this.getAttribute("label")) this.setAttribute("aria-label", this.getAttribute("label"));
      const label = this.getAttribute("label");
      if (label) {
        const t = this.ensure(".c-range-scale__label", () => { const el = document.createElement("span"); el.className = "c-range-scale__label"; return el; });
        t.textContent = label;
      }
      // Tick marks (G-10): render a tick for each comma-separated value.
      const ticksAttr = this.getAttribute("ticks");
      Array.from(this.querySelectorAll(".c-range-scale__tick")).forEach((n) => n.remove());
      if (ticksAttr) {
        ticksAttr.split(",").map((s) => s.trim()).filter(Boolean).forEach((tk) => {
          const t = document.createElement("span");
          t.className = "c-range-scale__tick";
          t.textContent = tk;
          this.appendChild(t);
        });
      }
    }
    enhance() {
      if (this._wiredRangeScale) return;
      this._wiredRangeScale = true;
      this.addEventListener("input", (e) => {
        const t = e.target;
        if (t && t.matches && t.matches("input")) {
          this.dispatchEvent(new CustomEvent("contour:range-change", { bubbles: true, composed: true, detail: { value: t.value } }));
        }
      });
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && t.matches && t.matches("input")) {
          this.dispatchEvent(new CustomEvent("contour:range-change", { bubbles: true, composed: true, detail: { value: t.value } }));
        }
      });
    }
  }
  define("contour-range-scale", ContourRangeScale);
  class ContourTimeRange extends ContourBase {
    static get observed() { return ["label", "value", "ticks"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" }, ticks: { attribute: "ticks" } }; }
    render() {
      this.classList.add("c-time-range");
      this.setAttribute("role", "group");
      if (this.getAttribute("label")) this.setAttribute("aria-label", this.getAttribute("label"));
      const label = this.getAttribute("label");
      if (label) {
        const t = this.ensure(".c-time-range__label", () => { const el = document.createElement("span"); el.className = "c-time-range__label"; return el; });
        t.textContent = label;
      }
      const ticksAttr = this.getAttribute("ticks");
      Array.from(this.querySelectorAll(".c-time-range__tick")).forEach((n) => n.remove());
      if (ticksAttr) {
        ticksAttr.split(",").map((s) => s.trim()).filter(Boolean).forEach((tk) => {
          const t = document.createElement("span");
          t.className = "c-time-range__tick";
          t.textContent = tk;
          this.appendChild(t);
        });
      }
    }
    enhance() {
      if (this._wiredTimeRange) return;
      this._wiredTimeRange = true;
      this.addEventListener("input", (e) => {
        const t = e.target;
        if (t && t.matches && t.matches("input")) {
          this.dispatchEvent(new CustomEvent("contour:time-range-change", { bubbles: true, composed: true, detail: { value: t.value } }));
        }
      });
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && t.matches && t.matches("input")) {
          this.dispatchEvent(new CustomEvent("contour:time-range-change", { bubbles: true, composed: true, detail: { value: t.value } }));
        }
      });
    }
  }
  define("contour-time-range", ContourTimeRange);




// Shared tooltip + roving + select wiring for the map components that render a
// grid of items (hexbin cells, flow-map nodes, isochrone rings). Extracted from
// three near-identical copies (D-13) so the behaviour cannot drift apart again.
function wireMapItems(host, itemSelector, tooltipClass) {
  if (host._wiredMapItems) return;
  host._wiredMapItems = true;
  const items = () => Array.from(host.querySelectorAll(itemSelector));
  const showTip = (e) => {
    const tip = host.querySelector(tooltipClass);
    if (!tip) return;
    const item = e && e.target && typeof e.target.closest === "function" ? e.target.closest(itemSelector) : null;
    if (!item || !host.contains(item)) { tip.setAttribute("hidden", ""); return; }
    const title = item.getAttribute("title");
    if (title) tip.textContent = title;
    const rect = host.getBoundingClientRect();
    const ir = item.getBoundingClientRect();
    tip.style.setProperty("--chart-tip-inline-start", (ir.left - rect.left + ir.width / 2) + "px");
    tip.style.setProperty("--chart-tip-block-start", (ir.top - rect.top) + "px");
    tip.removeAttribute("hidden");
  };
  const hideTip = () => {
    const tip = host.querySelector(tooltipClass);
    if (tip) tip.setAttribute("hidden", "");
  };
  host.addEventListener("mouseover", showTip);
  host.addEventListener("mouseout", (e) => { if (!e.relatedTarget || !host.contains(e.relatedTarget)) hideTip(); });
  host.addEventListener("focusin", (e) => {
    const item = e && e.target && typeof e.target.closest === "function" ? e.target.closest(itemSelector) : null;
    if (item && host.contains(item)) showTip({ target: item });
  });
  host.addEventListener("focusout", (e) => { if (!host.contains(e.relatedTarget)) hideTip(); });
  host.addEventListener("click", (e) => {
    const item = e && e.target && typeof e.target.closest === "function" ? e.target.closest(itemSelector) : null;
    if (!item || !host.contains(item)) return;
    const all = items();
    const index = all.indexOf(item);
    if (index < 0) return;
    host.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index, label: item.getAttribute("title") || item.textContent.trim() } }));
  });
  host.addEventListener("keydown", (e) => {
    const item = e && e.target && typeof e.target.closest === "function" ? e.target.closest(itemSelector) : null;
    if (!item || !host.contains(item)) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const all = items();
      const index = all.indexOf(item);
      if (index < 0) return;
      host.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index, label: item.getAttribute("title") || item.textContent.trim() } }));
    }
    // Roving tabindex keyboard nav.
    const all = items();
    const idx = all.indexOf(item);
    if (idx < 0) return;
    let next = -1;
    const rtl = (host.getAttribute("dir") || document.documentElement.getAttribute("dir") || "").toLowerCase() === "rtl";
    if (e.key === "ArrowDown") next = Math.min(idx + 1, all.length - 1);
    else if (e.key === "ArrowUp") next = Math.max(idx - 1, 0);
    else if (e.key === "ArrowRight") next = rtl ? Math.max(idx - 1, 0) : Math.min(idx + 1, all.length - 1);
    else if (e.key === "ArrowLeft") next = rtl ? Math.min(idx + 1, all.length - 1) : Math.max(idx - 1, 0);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = all.length - 1;
    if (next < 0 || next === idx) return;
    e.preventDefault();
    all.forEach((c, i) => c.setAttribute("tabindex", i === next ? "0" : "-1"));
    try { all[next].focus(); } catch (err) {}
  });
}

class ContourMinimap extends ContourBase {
    static get observed() { return ["label", "viewport", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, viewport: { attribute: "viewport" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-minimap");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Minimap");
      wireStates(this);
      loadRemote(this, ["label", "viewport"]);
      if (renderStates(this, "minimap")) return;
      const label = remoteData(this, "label") || (this._remoteData && this._remoteData.label);
      const viewport = remoteData(this, "viewport") || (this._remoteData && (this._remoteData.viewport || this._remoteData.value));
      if (!label && !viewport) {
        renderEmpty(this, "minimap");
        return;
      }
      if (label) {
        const l = this.ensure(".c-minimap__label", () => { const el = document.createElement("span"); el.className = "c-minimap__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-minimap__label");
        if (l) l.remove();
      }
      if (viewport) {
        const v = this.ensure(".c-minimap__viewport", () => { const el = document.createElement("div"); el.className = "c-minimap__viewport"; return el; });
        v.textContent = viewport;
      } else {
        const v = this.querySelector(".c-minimap__viewport");
        if (v) v.remove();
      }
    }
    enhance() {
      if (this._wiredMinimap) return;
      this._wiredMinimap = true;
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      let dragging = false;
      this.addEventListener("pointerdown", (e) => {
        const vp = this.querySelector(".c-minimap__viewport");
        if (!vp || !vp.contains(e.target)) return;
        dragging = true;
        try { vp.setPointerCapture(e.pointerId); } catch (err) {}
      });
      this.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        this.dispatchEvent(new CustomEvent("contour:move", { detail: { direction: "drag" }, bubbles: true, composed: true }));
      });
      this.addEventListener("pointerup", () => { dragging = false; });
      this.addEventListener("keydown", (e) => {
        let dir = null;
        if (e.key === "ArrowUp") dir = "up";
        else if (e.key === "ArrowDown") dir = "down";
        else if (e.key === "ArrowLeft") dir = "left";
        else if (e.key === "ArrowRight") dir = "right";
        else if (e.key === "Home") dir = "home";
        else if (e.key === "End") dir = "end";
        if (!dir) return;
        e.preventDefault();
        this.dispatchEvent(new CustomEvent("contour:move", { detail: { direction: dir }, bubbles: true, composed: true }));
      });
    }
  }
define("contour-minimap", ContourMinimap);
class ContourCoordinate extends ContourBase {
    static get observed() { return ["value", "format", "locale", "precision", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { value: { attribute: "value" }, format: { attribute: "format" }, locale: { attribute: "locale" }, precision: { attribute: "precision" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-coordinate");
      wireStates(this);
      loadRemote(this, "value");
      if (renderStates(this, "coordinate")) return;
      const value = remoteData(this, "value") || (this._remoteData && (this._remoteData.value || this._remoteData.coordinate));
      if (!value) {
        renderEmpty(this, "coordinate");
        return;
      }
      const format = this.getAttribute("format") || "decimal";
      let text = String(value);
      if (format === "dms") {
        // simple DMS conversion assuming decimal degrees "lat,lon"
        const parts = String(value).split(/[,\s]+/).map(Number);
        if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
          const prec = parseInt(this.getAttribute("precision") || "1", 10);
          const secDigits = Number.isFinite(prec) && prec >= 0 ? prec : 1;
          const toDMS = (d, axis) => {
            const deg = Math.floor(Math.abs(d));
            const min = Math.floor((Math.abs(d) - deg) * 60);
            const sec = (((Math.abs(d) - deg) * 60) - min) * 60;
            const hemi = axis === "lat" ? (d < 0 ? "S" : "N") : (d < 0 ? "W" : "E");
            return deg + "°" + min + "'" + sec.toFixed(secDigits) + '"' + hemi;
          };
          text = toDMS(parts[0], "lat") + " " + toDMS(parts[1], "lon");
        }
      } else if (format === "web-mercator") {
        const parts = String(value).split(/[,\s]+/).map(Number);
        if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
          const x = parts[1] * 20037508.34 / 180;
          const y = Math.log(Math.tan((90 + parts[0]) * Math.PI / 360)) / (Math.PI / 180) * 20037508.34 / 180;
          text = x.toFixed(2) + ", " + y.toFixed(2);
        }
      } else {
        text = formatValue(value, this.getAttribute("format"), this.getAttribute("locale"));
      }
      const span = this.ensure(".c-coordinate__value", () => { const el = document.createElement("span"); el.className = "c-coordinate__value"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); return el; });
      span.textContent = text;
      // copy button
      let btn = this.querySelector(".c-coordinate__copy");
      if (!btn) { btn = document.createElement("button"); btn.type = "button"; btn.className = "c-coordinate__copy"; btn.textContent = "Copy"; btn.setAttribute("aria-label", "Copy coordinate"); this.appendChild(btn); }
      btn.onclick = () => {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(() => { fallbackCopy(text); });
          } else {
            fallbackCopy(text);
          }
        } catch (e) { fallbackCopy(text); }
        this.dispatchEvent(new CustomEvent("contour:copy", { detail: { text }, bubbles: true, composed: true }));
      };
      function fallbackCopy(t) {
        try {
          const ta = document.createElement("textarea");
          ta.value = t;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        } catch (e) {}
      }
    }
  }
define("contour-coordinate", ContourCoordinate);
class ContourLayerPanel extends ContourBase {
    static get observed() { return ["label", "items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "allow-rename", "allow-remove", "allow-duplicate", "allow-zoom"]; }
    static get properties() { return { label: { attribute: "label" }, items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-layer-panel");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Layer panel");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "layer-panel")) return;
      const items = remoteData(this, "items");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-layer-panel__label", () => { const el = document.createElement("span"); el.className = "c-layer-panel__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-layer-panel__label");
        if (l) l.remove();
      }
      // Slotted content support: authored .c-layer-panel__item children take
      // precedence over the JSON `items` attribute.
      const authoredLayerItems = Array.from(this.querySelectorAll(":scope > .c-layer-panel__item"));
      // Preserve user-toggled visibility across re-renders (B3-09): a src
      // reload must not re-check a layer the user un-checked.
       const savedVisibility = new Map();
       this.querySelectorAll(".c-layer-panel__item").forEach((el) => {
         const nm = el.querySelector(".c-layer-panel__name");
         const tg = el.querySelector(".c-layer-panel__toggle");
         if (nm && tg) {
           const v = tg.hasAttribute("aria-pressed") ? tg.getAttribute("aria-pressed") === "true" : !!tg.checked;
           savedVisibility.set(nm.textContent, v);
         }
       });
      let parsed = null;
      if (authoredLayerItems.length) {
         parsed = authoredLayerItems.map((el) => {
           const nm = el.querySelector(".c-layer-panel__name");
           const tg = el.querySelector(".c-layer-panel__toggle");
           const visible = tg ? (tg.hasAttribute("aria-pressed") ? tg.getAttribute("aria-pressed") === "true" : !!tg.checked) : true;
           const cap = el.querySelector(".c-layer-panel__caption");
           return { name: nm ? nm.textContent : "", visible, caption: cap ? cap.textContent : (el.dataset.caption || undefined) };
         });
        authoredLayerItems.forEach((el) => el.remove());
      } else if (items) {
        try {
          parsed = JSON.parse(items);
          Array.from(this.querySelectorAll(".c-layer-panel__item")).forEach((el) => el.remove());
        } catch (e) { /* keep existing */ }
      }
      if (parsed) { parsed.forEach((it) => {
           const name = typeof it === "string" ? it : (it.name || it.label || "");
           const caption = (typeof it === "object" && it) ? (it.caption || it.subtitle || "") : "";
           const item = document.createElement("div");
           item.className = "c-layer-panel__item" + (it.dragging ? " c-layer-panel__item--dragging" : "");
            const toggle = document.createElement("button");
            toggle.type = "button";
            toggle.className = "c-layer-panel__toggle";
            toggle.setAttribute("part", "visibility-toggle");
            toggle.setAttribute("aria-label", "Toggle " + (name || "layer"));
            const isVisible = savedVisibility.has(name) ? savedVisibility.get(name) : (typeof it === "object" && it.visible !== false);
            toggle.setAttribute("aria-pressed", String(!!isVisible));
            toggle.checked = !!isVisible;
            toggle.innerHTML = isVisible ? '<svg aria-hidden="true"><use href="#i-check" /></svg>' : '<svg aria-hidden="true"><use href="#i-minus" /></svg>';
            item.appendChild(toggle);
            const nm = document.createElement("span");
            nm.className = "c-layer-panel__name";
            nm.textContent = name;
            item.appendChild(nm);
            if (caption) {
              const cap = document.createElement("span");
              cap.className = "c-layer-panel__caption";
              cap.textContent = caption;
              item.appendChild(cap);
            }
            const opacity = document.createElement("input");
             opacity.type = "range";
             opacity.className = "c-layer-panel__opacity";
             opacity.min = "0";
             opacity.max = "100";
              opacity.setAttribute("aria-label", "Opacity of " + (name || "layer"));
             opacity.value = (typeof it === "object" && it.opacity != null) ? it.opacity : "100";
            item.appendChild(opacity);
            // rename input (hidden by default, toggled via button)
            if (this.getAttribute("allow-rename") !== "false") {
            const renameBtn = document.createElement("button");
            renameBtn.type = "button";
            renameBtn.className = "c-layer-panel__rename";
            renameBtn.textContent = "Rename";
            renameBtn.setAttribute("aria-label", "Rename " + (name || "layer"));
            item.appendChild(renameBtn);
            }
            if (this.getAttribute("allow-duplicate") !== "false") {
            const dupBtn = document.createElement("button");
            dupBtn.type = "button";
            dupBtn.className = "c-layer-panel__duplicate";
            dupBtn.textContent = "Duplicate";
            dupBtn.setAttribute("aria-label", "Duplicate " + (name || "layer"));
            item.appendChild(dupBtn);
            }
            if (this.getAttribute("allow-zoom") !== "false") {
            const zoomBtn = document.createElement("button");
            zoomBtn.type = "button";
            zoomBtn.className = "c-layer-panel__zoom";
            zoomBtn.textContent = "Zoom";
            zoomBtn.setAttribute("aria-label", "Zoom to " + (name || "layer"));
            item.appendChild(zoomBtn);
            }
            if (this.getAttribute("allow-remove") !== "false") {
            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "c-layer-panel__remove";
            removeBtn.innerHTML = '<svg aria-hidden="true"><use href="#i-minus" /></svg>';
            removeBtn.setAttribute("aria-label", "Remove " + (name || "layer"));
            item.appendChild(removeBtn);
            }
            const projSel = document.createElement("select");
            projSel.className = "c-select c-layer-panel__projection";
            projSel.setAttribute("aria-label", "Projection of " + (name || "layer"));
            ["EPSG:4326","EPSG:3857"].forEach((p) => { const o = document.createElement("option"); o.value = p; o.textContent = p; projSel.appendChild(o); });
            item.appendChild(projSel);
            this.appendChild(item);
          });
      }
      if (!parsed && !authoredLayerItems.length && !items) {
        Array.from(this.querySelectorAll(".c-layer-panel__item")).forEach((el) => el.remove());
        renderEmpty(this, "layer-panel");
      }
    }
    enhance() {
      if (this._wiredLayerPanel) return;
      this._wiredLayerPanel = true;
      // The panel's two controls (visibility toggle, opacity range) are rebuilt
      // on every render, so both keep the host-delegated pattern (rule 12).
       this.addEventListener("change", (e) => {
         const item = e.target && e.target.closest ? e.target.closest(".c-layer-panel__item") : null;
         if (!item || !this.contains(item)) return;
         const name = item.querySelector(".c-layer-panel__name")?.textContent || "";
         if (e.target.classList.contains("c-layer-panel__toggle")) {
           const now = (typeof e.target.checked === "boolean") ? e.target.checked : (e.target.getAttribute("aria-pressed") !== "true");
           e.target.checked = now;
           e.target.setAttribute("aria-pressed", String(now));
           e.target.innerHTML = now ? '<svg aria-hidden="true"><use href="#i-check" /></svg>' : '<svg aria-hidden="true"><use href="#i-minus" /></svg>';
           this.dispatchEvent(new CustomEvent("contour:layer-visibility", { bubbles: true, composed: true, detail: { name, visible: now } }));
         } else if (e.target.classList.contains("c-layer-panel__opacity")) {
           this.dispatchEvent(new CustomEvent("contour:layer-opacity", { bubbles: true, composed: true, detail: { name, opacity: Number(e.target.value) } }));
         } else if (e.target.classList.contains("c-layer-panel__projection")) {
           this.dispatchEvent(new CustomEvent("contour:layer-projection", { bubbles: true, composed: true, detail: { name, projection: e.target.value } }));
         }
       });
       this.addEventListener("click", (e) => {
         const btn = e.target && e.target.closest ? e.target.closest("button") : null;
         if (!btn || !this.contains(btn)) return;
         const item = btn.closest(".c-layer-panel__item");
         if (btn.classList.contains("c-layer-panel__toggle")) {
           if (!item) return;
           const name = item.querySelector(".c-layer-panel__name")?.textContent || "";
           const now = btn.getAttribute("aria-pressed") !== "true";
           btn.setAttribute("aria-pressed", String(now));
           btn.checked = now;
           btn.innerHTML = now ? '<svg aria-hidden="true"><use href="#i-check" /></svg>' : '<svg aria-hidden="true"><use href="#i-minus" /></svg>';
           this.dispatchEvent(new CustomEvent("contour:layer-visibility", { bubbles: true, composed: true, detail: { name, visible: now } }));
           return;
         }
         if (!item) return;
         const name = item.querySelector(".c-layer-panel__name")?.textContent || "";
         if (btn.classList.contains("c-layer-panel__rename")) {
           const nm = item.querySelector(".c-layer-panel__name");
           if (nm) {
             const input = document.createElement("input");
             input.type = "text";
             input.className = "c-input c-layer-panel__rename-input";
             input.value = name;
             input.setAttribute("aria-label", "Rename layer");
             nm.replaceWith(input);
             input.focus();
             input.select();
             const commit = () => {
               const trimmed = (input.value || "").trim();
               const span = document.createElement("span");
               span.className = "c-layer-panel__name";
               span.textContent = trimmed || name;
               input.replaceWith(span);
               if (trimmed && trimmed !== name) {
                 this.dispatchEvent(new CustomEvent("contour:layer-rename", { bubbles: true, composed: true, detail: { name, newName: trimmed } }));
               }
             };
             input.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); commit(); } else if (ev.key === "Escape") { ev.preventDefault(); input.value = name; commit(); } });
             input.addEventListener("blur", commit, { once: true });
           }
         } else if (btn.classList.contains("c-layer-panel__duplicate")) {
           this.dispatchEvent(new CustomEvent("contour:layer-duplicate", { bubbles: true, composed: true, detail: { name } }));
         } else if (btn.classList.contains("c-layer-panel__zoom")) {
           this.dispatchEvent(new CustomEvent("contour:layer-zoom", { bubbles: true, composed: true, detail: { name } }));
         } else if (btn.classList.contains("c-layer-panel__remove")) {
           this.dispatchEvent(new CustomEvent("contour:layer-remove", { bubbles: true, composed: true, detail: { name } }));
         }
       });
        this.addEventListener("keydown", (e) => {
          if (e.target && e.target.classList && e.target.classList.contains("c-layer-panel__toggle") && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            e.target.click();
            return;
          }
          const item = e.target && e.target.closest ? e.target.closest(".c-layer-panel__item") : null;
          if (!item || !this.contains(item)) return;
         if (!(e.altKey) || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
         e.preventDefault();
         const items = Array.from(this.querySelectorAll(".c-layer-panel__item"));
         const idx = items.indexOf(item);
         if (idx < 0) return;
         const dir = e.key === "ArrowUp" ? -1 : 1;
         const newIdx = idx + dir;
         if (newIdx < 0 || newIdx >= items.length) return;
         item.classList.add("c-layer-panel__item--dragging");
         if (dir < 0) this.insertBefore(item, items[newIdx]);
         else this.insertBefore(items[newIdx], item);
         item.focus();
         setTimeout(() => item.classList.remove("c-layer-panel__item--dragging"), 200);
         const layerIds = Array.from(this.querySelectorAll(".c-layer-panel__item")).map((el) => el.querySelector(".c-layer-panel__name")?.textContent || "");
         this.dispatchEvent(new CustomEvent("contour:layer-reorder", { bubbles: true, composed: true, detail: { layerIds } }));
       });
     }
  }
define("contour-layer-panel", ContourLayerPanel);
class ContourTimeSlider extends ContourBase {
    static get observed() { return ["label", "value", "loop", "speed", "speeds", "show-loop", "loop-label", "current-time", "time-format", "is-playing", "play-label", "pause-label", "time-label", "speed-label"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" }, distance: { attribute: "distance" }, resolution: { attribute: "resolution" }, latitude: { attribute: "latitude" }, src: { attribute: "src" }, loop: { attribute: "loop", type: Boolean }, speed: { attribute: "speed" }, speeds: { attribute: "speeds" }, showLoop: { attribute: "show-loop", type: Boolean }, loopLabel: { attribute: "loop-label" }, currentTime: { attribute: "current-time" }, timeFormat: { attribute: "time-format" }, isPlaying: { attribute: "is-playing", type: Boolean }, playLabel: { attribute: "play-label" }, pauseLabel: { attribute: "pause-label" }, timeLabel: { attribute: "time-label" }, speedLabel: { attribute: "speed-label" } }; }
    render() {
      this.classList.add("c-time-slider");
      const play = this.ensure(".c-time-slider__play", () => {
        const el = document.createElement("button");
        el.className = "c-time-slider__play";
        el.type = "button";
        el.setAttribute("aria-label", this.getAttribute("play-label") || "Play");
        el.setAttribute("data-state", "play");
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("aria-hidden", "true");
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttribute("href", "#i-play");
        svg.appendChild(use);
        el.appendChild(svg);
        return el;
      });
      const track = this.ensure(".c-time-slider__track", () => { const el = document.createElement("input"); el.className = "c-time-slider__track"; el.type = "range"; el.min = "0"; el.max = "100"; el.setAttribute("aria-label", this.getAttribute("time-label") || "Time"); return el; });
      const _attrVal = this.getAttribute("value") || "0";
      if (this._timeSliderAttrLast !== _attrVal) {
        track.value = _attrVal;
        this._timeSliderAttrLast = _attrVal;
      }
      track.setAttribute("aria-label", this.getAttribute("label") || this.getAttribute("time-label") || "Time");
      const time = this.ensure(".c-time-slider__time", () => { const el = document.createElement("span"); el.className = "c-time-slider__time"; return el; });
      const ct = this.getAttribute("current-time");
      time.textContent = ct ? ct : (this.getAttribute("label") || "");
      // speed selector
      let speeds = null;
      const speedsAttr = this.getAttribute("speeds");
      if (speedsAttr) { try { speeds = JSON.parse(speedsAttr); } catch (e) { speeds = null; } }
      const speedSel = this.ensure(".c-time-slider__speed", () => { const el = document.createElement("select"); el.className = "c-select c-time-slider__speed"; el.setAttribute("aria-label", this.getAttribute("speed-label") || "Speed"); return el; });
      speedSel.innerHTML = "";
      const speedList = Array.isArray(speeds) ? speeds : [0.5, 1, 2, 5, 10];
      speedList.forEach((sp) => {
        const opt = document.createElement("option");
        opt.value = String(sp);
        opt.textContent = String(sp);
        if (String(sp) === (this.getAttribute("speed") || "")) opt.selected = true;
        speedSel.appendChild(opt);
      });
      const speedAttr = this.getAttribute("speed");
      if (speedAttr) speedSel.value = speedAttr;
      // loop toggle
      const showLoop = this.hasAttribute("show-loop");
      if (showLoop) {
        const loopBtn = this.ensure(".c-time-slider__loop", () => { const el = document.createElement("button"); el.className = "c-time-slider__loop"; el.type = "button"; el.setAttribute("aria-label", this.getAttribute("loop-label") || "Loop"); return el; });
        loopBtn.setAttribute("aria-pressed", this.hasAttribute("loop") ? "true" : "false");
        loopBtn.textContent = this.getAttribute("loop-label") || "Loop";
      } else {
        const lb = this.querySelector(".c-time-slider__loop");
        if (lb) lb.remove();
      }
      // is-playing reflects on play button
      if (this.hasAttribute("is-playing")) {
        play.setAttribute("data-state", "pause");
        play.setAttribute("aria-label", this.getAttribute("pause-label") || "Pause");
        const use = play.querySelector("use");
        if (use) use.setAttribute("href", "#i-pause");
      }
    }
    enhance() {
      if (this._wiredTimeSlider) return;
      this._wiredTimeSlider = true;
      // Play advances the track one step per second and announces each move as
      // contour:time-change, so a dashboard can animate a chart in lockstep.
      // The loop stops at max, or on a second click, or when the host leaves
      // the page (the disposer is registered once, like the loader's).
      let timer = undefined;
      const stop = () => { if (timer !== undefined) { clearInterval(timer); timer = undefined; } };
      const step = () => {
        const track = this.querySelector(".c-time-slider__track");
        if (!track) { stop(); return; }
        const max = Number(track.max) || 100;
        const loop = this.hasAttribute("loop");
        let next = (Number(track.value) || 0) + 1;
        if (next > max) {
          if (loop) next = 0;
          else next = max;
        }
        track.value = String(next);
        this.dispatchEvent(new CustomEvent("contour:time-change", { detail: { value: String(next) }, bubbles: true, composed: true }));
        if (!loop && next >= max) {
          stop();
          const btn = this.querySelector(".c-time-slider__play");
          if (btn) {
            btn.setAttribute("data-state", "play");
            btn.setAttribute("aria-label", this.getAttribute("play-label") || "Play");
            const use = btn.querySelector("use");
            if (use) use.setAttribute("href", "#i-play");
          }
        }
      };
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-time-slider__play") : null;
        if (btn) {
          const playing = btn.getAttribute("data-state") === "play";
          btn.setAttribute("data-state", playing ? "pause" : "play");
          btn.setAttribute("aria-label", playing ? (this.getAttribute("pause-label") || "Pause") : (this.getAttribute("play-label") || "Play"));
          const use = btn.querySelector("use");
          if (use) use.setAttribute("href", playing ? "#i-pause" : "#i-play");
          if (playing) {
            stop();
            const speed = parseFloat(this.getAttribute("speed") || "1") || 1;
            const delay = Math.max(100, 1000 / speed);
            timer = setInterval(step, delay);
            this.dispatchEvent(new CustomEvent("contour:play", { bubbles: true, composed: true }));
          } else {
            stop();
            this.dispatchEvent(new CustomEvent("contour:pause", { bubbles: true, composed: true }));
          }
          return;
        }
        const loopBtn = e.target && e.target.closest ? e.target.closest(".c-time-slider__loop") : null;
        if (loopBtn) {
          const next = loopBtn.getAttribute("aria-pressed") !== "true";
          loopBtn.setAttribute("aria-pressed", String(next));
          this.toggleAttribute("loop", next);
          this.dispatchEvent(new CustomEvent("contour:loop-change", { detail: { loop: next }, bubbles: true, composed: true }));
        }
      });
      // speed select change (delegated)
      this.addEventListener("change", (e) => {
        const sel = e.target && e.target.closest ? e.target.closest(".c-time-slider__speed") : null;
        if (!sel) return;
        const speed = Number(sel.value);
        this.dispatchEvent(new CustomEvent("contour:speed-change", { detail: { speed }, bubbles: true, composed: true }));
      });
      onDispose(this, stop);
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._wiredTimeSlider = false;
    }
  }
  define("contour-time-slider", ContourTimeSlider);
class ContourHexbin extends ContourBase {
    static get observed() { return ["label", "cells", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, cells: { attribute: "cells" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-hexbin");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Hexbin");
      const label = this.getAttribute("label") || (this._remoteData && this._remoteData.label);
      if (label) {
        const l = this.ensure(".c-hexbin__label", () => { const el = document.createElement("span"); el.className = "c-hexbin__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-hexbin__label");
        if (l) l.remove();
      }
      wireStates(this);
      loadRemote(this, "cells");
      if (renderStates(this, "hexbin")) return;
      const cells = remoteData(this, "cells");
      const effectiveCells = cells || (this._remoteData && this._remoteData.cells ? JSON.stringify(this._remoteData.cells) : null);
      // Slotted content support: authored .c-hexbin__cell children take
      // precedence over the JSON `cells` attribute.
      const authoredCells = Array.from(this.querySelectorAll(":scope > .c-hexbin__cell"));
      let parsed = null;
      if (authoredCells.length) {
        parsed = authoredCells.map((el) => el.textContent || el.getAttribute("title") || "");
        authoredCells.forEach((el) => el.remove());
      } else if (effectiveCells) {
        try { parsed = JSON.parse(effectiveCells); } catch (e) { parsed = null; }
      }
      if (parsed) {
       try {
         Array.from(this.querySelectorAll(".c-hexbin__cell")).forEach((n) => n.remove());
         const cols = Math.ceil(Math.sqrt(parsed.length || 1));
         this.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
         this.style.inlineSize = "16rem";
           parsed.forEach((c, i) => {
             const cell = document.createElement("div");
             cell.className = "c-hexbin__cell";
             cell.setAttribute("tabindex", i === 0 ? "0" : "-1");
             if (typeof c === "object" && c.value != null) { cell.textContent = c.value; cell.setAttribute("title", String(c.value)); }
             else if (typeof c !== "object") { cell.textContent = c; cell.setAttribute("title", String(c)); }
             this.appendChild(cell);
           });
           const tip = this.ensure(".c-hexbin__tooltip", () => { const el = document.createElement("div"); el.className = "c-hexbin__tooltip"; el.setAttribute("role", "tooltip"); el.setAttribute("hidden", ""); return el; });
           tip.setAttribute("hidden", "");
       } catch (e) { /* keep existing */ }
      } else if (!parsed) {
        Array.from(this.querySelectorAll(".c-hexbin__cell")).forEach((n) => n.remove());
        renderEmpty(this, "hexbin");
      }
     }
     enhance() {
       if (this._wiredHexbin) return;
       this._wiredHexbin = true;
       wireMapItems(this, ".c-hexbin__cell", ".c-hexbin__tooltip");
     }
  }
define("contour-hexbin", ContourHexbin);
class ContourFlowMap extends ContourBase {
    static get observed() { return ["label", "nodes", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, nodes: { attribute: "nodes" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-flow-map");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Flow map");
      const label = this.getAttribute("label") || (this._remoteData && this._remoteData.label);
      if (label) {
        const l = this.ensure(".c-flow-map__label", () => { const el = document.createElement("span"); el.className = "c-flow-map__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-flow-map__label");
        if (l) l.remove();
      }
      wireStates(this);
      loadRemote(this, "nodes");
      if (renderStates(this, "flow-map")) return;
      const nodes = remoteData(this, "nodes");
      const effectiveNodes = nodes || (this._remoteData && this._remoteData.nodes ? JSON.stringify(this._remoteData.nodes) : null);
      // Slotted content support: authored .c-flow-map__node children take
      // precedence over the JSON `nodes` attribute.
      const authoredNodes = Array.from(this.querySelectorAll(":scope > .c-flow-map__node"));
      let parsed = null;
      if (authoredNodes.length) {
        parsed = authoredNodes.map((el) => el.textContent || el.getAttribute("title") || "");
        authoredNodes.forEach((el) => el.remove());
      } else if (effectiveNodes) {
        try { parsed = JSON.parse(effectiveNodes); } catch (e) { parsed = null; }
      }
      if (parsed) {
       try {
         Array.from(this.querySelectorAll(".c-flow-map__node")).forEach((n) => n.remove());
           parsed.forEach((n, i) => {
            const node = document.createElement("span");
            node.className = "c-flow-map__node" + (n.source ? " c-flow-map__node--source" : "") + (n.target ? " c-flow-map__node--target" : "");
            node.setAttribute("tabindex", i === 0 ? "0" : "-1");
            node.textContent = typeof n === "string" ? n : (n.label || n.name || "");
            if (typeof n === "object" && (n.label || n.name)) node.setAttribute("title", n.label || n.name);
            this.appendChild(node);
          });
          const tip = this.ensure(".c-flow-map__tooltip", () => { const el = document.createElement("div"); el.className = "c-flow-map__tooltip"; el.setAttribute("role", "tooltip"); el.setAttribute("hidden", ""); return el; });
          tip.setAttribute("hidden", "");
       } catch (e) { /* keep existing */ }
      } else if (!parsed) {
        Array.from(this.querySelectorAll(".c-flow-map__node")).forEach((n) => n.remove());
        renderEmpty(this, "flow-map");
      }
     }
     enhance() {
       if (this._wiredFlowMap) return;
       this._wiredFlowMap = true;
       wireMapItems(this, ".c-flow-map__node", ".c-flow-map__tooltip");
     }
   }
define("contour-flow-map", ContourFlowMap);
class ContourIsochrone extends ContourBase {
    static get observed() { return ["label", "center", "rings", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, center: { attribute: "center" }, rings: { attribute: "rings" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-isochrone");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Isochrone");
      const label = this.getAttribute("label") || (this._remoteData && this._remoteData.label);
      if (label) {
        const l = this.ensure(".c-isochrone__label", () => { const el = document.createElement("span"); el.className = "c-isochrone__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-isochrone__label");
        if (l) l.remove();
      }
      const center = this.getAttribute("center") || (this._remoteData && this._remoteData.center);
      if (center) {
        const c = this.ensure(".c-isochrone__center", () => { const el = document.createElement("span"); el.className = "c-isochrone__center"; return el; });
        c.textContent = center;
      } else {
        const c = this.querySelector(".c-isochrone__center");
        if (c) c.remove();
      }
      wireStates(this);
      loadRemote(this, "rings");
      if (renderStates(this, "isochrone")) return;
      const rings = remoteData(this, "rings");
      const effectiveRings = rings || (this._remoteData && this._remoteData.rings ? JSON.stringify(this._remoteData.rings) : null);
      // Slotted content support: authored .c-isochrone__ring children take
      // precedence over the JSON `rings` attribute.
      const authoredRings = Array.from(this.querySelectorAll(":scope > .c-isochrone__ring"));
      let parsed = null;
      if (authoredRings.length) {
        parsed = authoredRings.map((el) => el.textContent || el.getAttribute("title") || "");
        authoredRings.forEach((el) => el.remove());
      } else if (effectiveRings) {
        try { parsed = JSON.parse(effectiveRings); } catch (e) { parsed = null; }
      }
      if (parsed) {
         try {
           Array.from(this.querySelectorAll(".c-isochrone__ring")).forEach((n) => n.remove());
           parsed.forEach((r, i) => {
             const ring = document.createElement("span");
             ring.className = "c-isochrone__ring c-isochrone__ring--" + (r.label || r);
             ring.setAttribute("tabindex", i === 0 ? "0" : "-1");
             if (r.label) ring.setAttribute("title", r.label || r);
             this.appendChild(ring);
           });
           const tip = this.ensure(".c-isochrone__tooltip", () => { const el = document.createElement("div"); el.className = "c-isochrone__tooltip"; el.setAttribute("role", "tooltip"); el.setAttribute("hidden", ""); return el; });
           tip.setAttribute("hidden", "");
         } catch (e) { /* keep existing */ }
       } else if (!parsed) {
         Array.from(this.querySelectorAll(".c-isochrone__ring")).forEach((n) => n.remove());
         renderEmpty(this, "isochrone");
       }
     }
     enhance() {
       if (this._wiredIsochrone) return;
       this._wiredIsochrone = true;
       wireMapItems(this, ".c-isochrone__ring", ".c-isochrone__tooltip");
     }
   }
define("contour-isochrone", ContourIsochrone);
class ContourCatchment extends ContourBase {
    static get observed() { return ["label", "area", "center", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, area: { attribute: "area" }, center: { attribute: "center" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-catchment");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Catchment");
      const label = this.getAttribute("label") || (this._remoteData && this._remoteData.label);
      if (label) {
        const l = this.ensure(".c-catchment__label", () => { const el = document.createElement("span"); el.className = "c-catchment__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-catchment__label");
        if (l) l.remove();
      }
      const area = this.getAttribute("area") || (this._remoteData && this._remoteData.area);
      if (area) {
        const a = this.ensure(".c-catchment__area", () => { const el = document.createElement("span"); el.className = "c-catchment__area"; return el; });
        a.textContent = area;
      } else {
        const a = this.querySelector(".c-catchment__area");
        if (a) a.remove();
      }
      const center = this.getAttribute("center") || (this._remoteData && this._remoteData.center);
       if (center) {
         const c = this.ensure(".c-catchment__center", () => { const el = document.createElement("span"); el.className = "c-catchment__center"; return el; });
         c.textContent = center;
       } else {
         const c = this.querySelector(".c-catchment__center");
         if (c) c.remove();
       }
      wireStates(this);
      loadRemote(this, ["label", "area", "center"]);
      if (renderStates(this, "catchment")) return;
      const rLabel = remoteData(this, "label") || (this._remoteData && this._remoteData.label);
      const rArea = remoteData(this, "area") || (this._remoteData && this._remoteData.area);
      const rCenter = remoteData(this, "center") || (this._remoteData && this._remoteData.center);
      if (!rLabel && !rArea && !rCenter) {
        renderEmpty(this, "catchment");
        return;
      }
       const tip = this.ensure(".c-catchment__tooltip", () => { const el = document.createElement("div"); el.className = "c-catchment__tooltip"; el.setAttribute("role", "tooltip"); el.setAttribute("hidden", ""); return el; });
       tip.setAttribute("hidden", "");
       if (rArea) tip.textContent = rArea;
     }
    enhance() {
      if (this._wiredCatchment) return;
      this._wiredCatchment = true;
      // Per-event re-query (rule 12): the tip is rebuilt on every render, so a
      // capture at wiring time is a detached node after the first change.
      const showTip = () => {
        const tip = this.querySelector(".c-catchment__tooltip");
        if (tip) tip.removeAttribute("hidden");
      };
      const hideTip = () => {
        const tip = this.querySelector(".c-catchment__tooltip");
        if (tip) tip.setAttribute("hidden", "");
      };
      this.addEventListener("mouseenter", showTip);
      this.addEventListener("mouseleave", hideTip);
      // Keyboard path (BY-39): catchment has no per-cell marks to rove, so the
      // host itself is the focusable surface, exactly like the sparkline.
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      this.addEventListener("focusin", showTip);
      this.addEventListener("focusout", hideTip);
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { area: this.getAttribute("area") } }));
        }
      });
    }
  }
define("contour-catchment", ContourCatchment);
class ContourCompassFull extends ContourBase {
    static get observed() { return ["label", "needle", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, needle: { attribute: "needle" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-compass");
      const label = this.getAttribute("label") || (this._remoteData && this._remoteData.label);
      wireStates(this);
      loadRemote(this, "needle");
      if (renderStates(this, "compass")) return;
      const needle = remoteData(this, "needle") || (this._remoteData && (this._remoteData.needle || this._remoteData.value));
      // Cardinal directions.
      for (const dir of ["n", "s", "e", "w"]) {
        const cls = ".c-compass__label--" + dir;
        let l = this.querySelector(cls);
        if (!l) {
          l = document.createElement("span");
          l.className = "c-compass__label " + cls.slice(1);
          l.textContent = dir.toUpperCase();
          // The cardinals are the compass's input: each one is a button-like
          // target that sets the bearing (BY-22 `contour:bearing`).
          l.setAttribute("role", "button");
          l.setAttribute("tabindex", "0");
          this.appendChild(l);
        }
      }
      if (label && label.toLowerCase() !== "compass") {
        const l = this.ensure(".c-compass__label:not([class*='--'])", () => { const el = document.createElement("span"); el.className = "c-compass__label"; return el; });
        l.textContent = label;
      }
      if (needle) {
        const deg = Number(needle) || 0;
        const n = this.ensure("svg.c-compass__needle", () => {
          const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          el.setAttribute("class", "c-compass__needle");
          el.setAttribute("viewBox", "0 0 40 40");
          el.setAttribute("aria-hidden", "true");
          const pathN = document.createElementNS("http://www.w3.org/2000/svg", "path");
          pathN.setAttribute("class", "c-compass__needle--n");
          pathN.setAttribute("d", compassNeedle(20, 20, 16, deg));
          el.appendChild(pathN);
          const pathS = document.createElementNS("http://www.w3.org/2000/svg", "path");
          pathS.setAttribute("class", "c-compass__needle--s");
          pathS.setAttribute("d", compassNeedle(20, 20, 16, deg + 180));
          el.appendChild(pathS);
          return el;
        });
        const pathN = n.querySelector(".c-compass__needle--n");
        if (pathN) pathN.setAttribute("d", compassNeedle(20, 20, 16, deg));
        const pathS = n.querySelector(".c-compass__needle--s");
        if (pathS) pathS.setAttribute("d", compassNeedle(20, 20, 16, deg + 180));
      } else {
        const n = this.querySelector("svg.c-compass__needle, .c-compass__needle");
        if (n) n.remove();
      }
      if (!needle && !label) {
        renderEmpty(this, "compass");
      }
    }
    enhance() {
      if (this._wiredCompass) return;
      this._wiredCompass = true;
      // A cardinal is the compass's input: activate one to set the bearing and
      // report it. The labels are rebuilt by render, so the handler is delegated
      // on the host (rule 12) and resolves the degrees from the label itself.
      const DEGREES = { n: 0, e: 90, s: 180, w: 270 };
      const setBearing = (dir) => {
        const deg = DEGREES[dir];
        if (deg === undefined) return;
        const n = this.querySelector(".c-compass__needle");
        if (n) {
          const pathN = n.querySelector(".c-compass__needle--n");
          if (pathN) pathN.setAttribute("d", compassNeedle(20, 20, 16, deg));
          const pathS = n.querySelector(".c-compass__needle--s");
          if (pathS) pathS.setAttribute("d", compassNeedle(20, 20, 16, deg + 180));
        }
        this.dispatchEvent(new CustomEvent("contour:bearing", { bubbles: true, composed: true, detail: { direction: dir, degrees: deg } }));
      };
      this.addEventListener("click", (e) => {
        const label = e.target && e.target.closest ? e.target.closest(".c-compass__label--n, .c-compass__label--e, .c-compass__label--s, .c-compass__label--w") : null;
        if (!label || !this.contains(label)) return;
        const m = label.className.match(/c-compass__label--([nsew])/);
        if (m) setBearing(m[1]);
      });
      this.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const label = e.target && e.target.closest ? e.target.closest(".c-compass__label--n, .c-compass__label--e, .c-compass__label--s, .c-compass__label--w") : null;
        if (!label || !this.contains(label)) return;
        e.preventDefault();
        const m = label.className.match(/c-compass__label--([nsew])/);
        if (m) setBearing(m[1]);
      });
    }
  }
define("contour-compass", ContourCompassFull);
class ContourLayerSwitch extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-layer-switch");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "layer-switch")) return;
      const items = remoteData(this, "items");
      const authored = Array.from(this.children).filter((n) => n.classList && n.classList.contains("c-layer-switch__item"));
      if (items && !authored.length) {
        Array.from(this.querySelectorAll(".c-layer-switch__item")).forEach((n) => n.remove());
        try {
          const parsed = JSON.parse(items);
          const capped = Array.isArray(parsed) ? parsed.slice(0, 50) : parsed;
          capped.forEach((it) => {
            const item = document.createElement("div");
            item.className = "c-layer-switch__item";
            item.setAttribute("role", "group");
            const sw = document.createElement("span");
            sw.className = "c-layer-switch__swatch";
            if (it.color) sw.style.background = it.color;
            sw.setAttribute("aria-hidden", "true");
            item.appendChild(sw);
            const name = document.createElement("span");
            name.className = "c-layer-switch__name";
            name.textContent = typeof it === "string" ? it : (it.name || it.label || "");
            item.appendChild(name);
            if (it.count != null) {
              const c = document.createElement("span");
              c.className = "c-layer-switch__count";
              c.textContent = it.count;
              item.appendChild(c);
            }
            const toggle = document.createElement("button");
            toggle.className = "c-layer-switch__toggle";
            toggle.type = "button";
             toggle.setAttribute("aria-label", "Toggle " + (typeof it === "string" ? it : (it.name || it.label || "layer")));
             toggle.setAttribute("aria-pressed", "true");
            toggle.innerHTML = '<svg aria-hidden="true"><use href="#i-check" /></svg>';
            item.appendChild(toggle);
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      } else if (!items && !authored.length) {
        Array.from(this.querySelectorAll(".c-layer-switch__item")).forEach((n) => n.remove());
        renderEmpty(this, "layer-switch");
      }
    }
    enhance() {
      if (this._wiredLayerSwitch) return;
      this._wiredLayerSwitch = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-layer-switch__toggle") : null;
        if (!btn || !this.contains(btn)) return;
        const item = btn.closest(".c-layer-switch__item");
        const name = item ? (item.querySelector(".c-layer-switch__name")?.textContent || "") : "";
        const now = btn.getAttribute("aria-pressed") !== "true";
        btn.setAttribute("aria-pressed", String(now));
        this.dispatchEvent(new CustomEvent("contour:layer-toggle", { bubbles: true, composed: true, detail: { name, visible: now } }));
      });
      this.addEventListener("keydown", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-layer-switch__toggle") : null;
        if (!btn || !this.contains(btn)) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); btn.click(); }
      });
    }
  }
define("contour-layer-switch", ContourLayerSwitch);
class ContourMapSlot extends ContourBase {
    static get observed() { return ["attribution", "scale", "chrome"]; }
    static get properties() { return { attribution: { attribute: "attribution" }, scale: { attribute: "scale" }, chrome: { attribute: "chrome" } }; }
    render() {
      this.classList.add("c-map-slot");
      const chrome = this.getAttribute("chrome");
      if (chrome) {
        const c = this.ensure(".c-map-slot__chrome", () => { const el = document.createElement("div"); el.className = "c-map-slot__chrome"; return el; });
        c.textContent = chrome;
      } else {
        const c = this.querySelector(".c-map-slot__chrome");
        if (c) c.remove();
      }
      const attribution = this.getAttribute("attribution");
      if (attribution) {
        const a = this.ensure(".c-map-slot__attribution", () => { const el = document.createElement("div"); el.className = "c-map-slot__attribution"; return el; });
        a.textContent = attribution;
      } else {
        const a = this.querySelector(".c-map-slot__attribution");
        if (a) a.remove();
      }
      const scale = this.getAttribute("scale");
      if (scale) {
        const sc = this.ensure(".c-map-slot__scale", () => { const el = document.createElement("div"); el.className = "c-map-slot__scale"; return el; });
        sc.textContent = scale;
      } else {
        const sc = this.querySelector(".c-map-slot__scale");
        if (sc) sc.remove();
      }
    }
  }
  define("contour-map-slot", ContourMapSlot);
class ContourMapArea extends ContourBase {
    static get observed() { return ["attribution", "attribution-mark", "scale", "controls"]; }
    static get properties() { return { attribution: { attribute: "attribution" }, "attribution-mark": { attribute: "attribution-mark" }, scale: { attribute: "scale" }, controls: { attribute: "controls" } }; }
    render() {
      this.classList.add("c-map-area");
      const attribution = this.getAttribute("attribution");
      if (attribution) {
        const a = this.ensure(".c-map-slot__attribution", () => { const el = document.createElement("div"); el.className = "c-map-slot__attribution"; return el; });
        a.textContent = attribution;
      } else {
        const a = this.querySelector(".c-map-slot__attribution");
        if (a) a.remove();
      }
      const mark = this.getAttribute("attribution-mark");
      if (mark) {
        const m = this.ensure(".c-map-slot__attribution-mark", () => { const el = document.createElement("span"); el.className = "c-map-slot__attribution-mark"; return el; });
        m.textContent = mark;
      } else {
        const m = this.querySelector(".c-map-slot__attribution-mark");
        if (m) m.remove();
      }
      const scale = this.getAttribute("scale");
      if (scale) {
        const sc = this.ensure(".c-map-slot__scale", () => { const el = document.createElement("div"); el.className = "c-map-slot__scale"; return el; });
        sc.textContent = scale;
      } else {
        const sc = this.querySelector(".c-map-slot__scale");
        if (sc) sc.remove();
      }
      const controls = this.getAttribute("controls");
      if (controls) {
        try {
          const parsed = JSON.parse(controls);
          const wrap = this.ensure(".c-map-slot__controls", () => { const el = document.createElement("div"); el.className = "c-map-slot__controls"; return el; });
          wrap.innerHTML = "";
          parsed.forEach((c) => {
            const btn = document.createElement("button");
            btn.className = "c-map-slot__control";
            btn.type = "button";
            btn.textContent = typeof c === "string" ? c : (c.label || c);
            wrap.appendChild(btn);
          });
        } catch (e) { /* keep existing */ }
      } else {
        const w = this.querySelector(".c-map-slot__controls");
        if (w) w.remove();
      }
    }
    enhance() {
      if (this._wiredMapArea) return;
      this._wiredMapArea = true;
      // Map-engine seam (BY3-I3): Contour never imports a map library. A
      // consumer attaches a live engine instance via attachMap(); the component
      // stores the reference and reads viewport bounds through duck-typing so
      // the boundary (no engine imports, no GeoJSON) holds. detachMap() clears it.
      this._map = null;
      this.attachMap = (map) => { this._map = map || null; this.dispatchEvent(new CustomEvent("contour:map-attach", { bubbles: true, composed: true })); };
      this.detachMap = () => { this._map = null; this.dispatchEvent(new CustomEvent("contour:map-detach", { bubbles: true, composed: true })); };
      Object.defineProperty(this, "map", { get: () => this._map, set: (m) => this.attachMap(m) });
      this.getViewport = () => {
        const m = this._map;
        if (!m) return null;
        try {
          if (typeof m.getBounds === "function") {
            const b = m.getBounds();
            return { west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() };
          }
          if (m.transform && typeof m.transform === "object") {
            return { zoom: m.transform.zoom, center: m.transform.center };
          }
        } catch (e) { /* engine API mismatch */ }
        return null;
      };
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-map-slot__control") : null;
        if (!btn || !this.contains(btn)) return;
        this.dispatchEvent(new CustomEvent("contour:map-control", { bubbles: true, composed: true, detail: { control: btn.textContent } }));
      });
    }
  }
  define("contour-map-area", ContourMapArea);
class ContourMapPanel extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
     render() {
      this.classList.add("c-map-panel");
      if (!this.hasAttribute("role")) this.setAttribute("role", "region");
      const title = this.getAttribute("title");
      if (title) {
        if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", title);
      } else {
        if (this.getAttribute("aria-label") === this.getAttribute("title")) this.removeAttribute("aria-label");
      }
    }
  }
  define("contour-map-panel", ContourMapPanel);
class ContourMapFooter extends ContourBase {
    static get observed() { return ["brand"]; }
    static get properties() { return { brand: { attribute: "brand" } }; }
     render() {
      this.classList.add("c-map-footer");
      if (!this.hasAttribute("role")) this.setAttribute("role", "contentinfo");
      const brand = this.getAttribute("brand");
      // The footer's own rule is `.c-map-footer > *`, which reaches any direct
      // child, so the brand is a plain span: visible, and inventing no name.
      if (brand) {
        const b = this.ensure("[data-map-footer-brand]", () => { const el = document.createElement("span"); el.setAttribute("data-map-footer-brand", ""); return el; });
        b.textContent = brand;
      } else {
        const b = this.querySelector("[data-map-footer-brand]");
        if (b) b.remove();
      }
    }
  }
  define("contour-map-footer", ContourMapFooter);
class ContourScaleBar extends ContourBase {
    static get observed() { return ["label", "value", "distance", "resolution", "latitude", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" }, distance: { attribute: "distance" }, resolution: { attribute: "resolution" }, latitude: { attribute: "latitude" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-scale-bar");
      wireStates(this);
      loadRemote(this, ["label", "value"]);
      if (renderStates(this, "scale-bar")) return;
      let value = remoteData(this, "value") || (this._remoteData && this._remoteData.value);
      // BY-23: derive the bar width from map resolution + latitude when the
      // author gives a resolution (meters per pixel) instead of a raw pixel
      // length. A scale bar is a ground distance, so its pixel length is
      // distance / resolution; latitude is recorded for the Mercator-aware
      // consumers that read it back.
      const resolution = parseFloat(this.getAttribute("resolution"));
      let derivedLabel = null;
      if (Number.isFinite(resolution) && resolution > 0) {
        const distance = parseFloat(this.getAttribute("distance")) || 1000;
        value = String(Math.round(distance / resolution));
        if (!this.getAttribute("label") && !remoteData(this, "label")) {
          derivedLabel = distance >= 1000 ? (distance / 1000) + " km" : distance + " m";
        }
      }
      const label = derivedLabel || remoteData(this, "label") || (this._remoteData && this._remoteData.label);
      if (label) {
        const l = this.ensure(".c-scale-bar__label", () => { const el = document.createElement("span"); el.className = "c-scale-bar__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-scale-bar__label");
        if (l) l.remove();
      }
      if (!value) {
        renderEmpty(this, "scale-bar");
        return;
      }
      const line = this.ensure(".c-scale-bar__line", () => { const el = document.createElement("span"); el.className = "c-scale-bar__line"; return el; });
        // CSS lengths need a unit; a bare number would be dropped as an invalid
        // property value and the bar would render at zero width.
        line.style.inlineSize = /^\d+(\.\d+)?$/.test(String(value)) ? value + "px" : value;
        const ticks = scaleBarTicks(parseFloat(value) || 0, 4);
        const max = ticks[ticks.length - 1] || 1;
        Array.from(line.querySelectorAll(".c-scale-bar__tick")).forEach((t) => t.remove());
        ticks.forEach((tv) => {
          const tick = document.createElement("span");
          tick.className = "c-scale-bar__tick";
          // Logical (BY-48): insetInlineStart mirrors the bar in RTL instead of
          // pinning the tick to the physical left edge.
          tick.style.insetInlineStart = ((tv / max) * 100) + "%";
          line.appendChild(tick);
        });
    }
  }
define("contour-scale-bar", ContourScaleBar);

class ContourResizeObserver extends ContourBase {
    static get observed() { return ["debounce"]; }
    static get properties() { return { debounce: { attribute: "debounce" } }; }
    render() {
      this.classList.add("c-resize-observer");
      this.setAttribute("aria-hidden", "true");
    }
    enhance() {
      if (this._wiredResizeObserver) return;
      this._wiredResizeObserver = true;
      if (typeof ResizeObserver !== "function") return;
      const debounce = parseInt(this.getAttribute("debounce") || "0", 10) || 0;
      let timer = null;
      const ro = new ResizeObserver((entries) => {
        const fire = () => {
          const e = entries[entries.length - 1];
          const cr = e && e.contentRect ? e.contentRect : this.getBoundingClientRect();
          this.dispatchEvent(new CustomEvent("contour:resize", { bubbles: true, composed: true, detail: { width: cr.width, height: cr.height } }));
        };
        if (debounce > 0) { clearTimeout(timer); timer = setTimeout(fire, debounce); }
        else fire();
      });
      ro.observe(this);
      onDispose(this, () => { ro.disconnect(); clearTimeout(timer); });
    }
  }
  define("contour-resize-observer", ContourResizeObserver);


class ContourReservedFull extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-reserved");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-reserved__title", () => { const el = document.createElement("div"); el.className = "c-reserved__title"; return el; });
        t.textContent = title;
      }
    }
  }
  define("contour-reserved", ContourReservedFull);
class ContourThemeScopeFull extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-theme-scope");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-theme-scope__title", () => { const el = document.createElement("div"); el.className = "c-theme-scope__title"; el.style.padding = "var(--space-sm)"; el.style.fontWeight = "var(--weight-semibold)"; return el; });
        t.textContent = title;
      }
    }
  }
  define("contour-theme-scope", ContourThemeScopeFull);
class ContourActivity extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-activity");
      this.setAttribute("role", "list");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "activity")) return;
      const items = remoteData(this, "items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          Array.from(this.querySelectorAll(".c-activity__item")).forEach((n) => n.remove());
          parsed.forEach((it, i) => {
            const item = document.createElement("div");
            item.className = "c-activity__item";
            item.setAttribute("role", "listitem");
            item.tabIndex = -1;
            const dot = document.createElement("span");
            dot.className = "c-activity__dot c-activity__dot--" + (it.variant || "primary");
            dot.setAttribute("aria-hidden", "true");
            item.appendChild(dot);
            const text = document.createElement("span");
            text.className = "c-activity__text";
            text.textContent = typeof it === "string" ? it : (it.text || it.label || "");
            item.appendChild(text);
            if (it.time) {
              const time = document.createElement("span");
              time.className = "c-activity__time";
              time.textContent = it.time;
              item.appendChild(time);
            }
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      } else {
        renderEmpty(this, "activity");
      }
    }
    enhance() {
      if (this._wiredActivity) return;
      this._wiredActivity = true;
      this.addEventListener("click", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".c-activity__item") : null;
        if (item && this.contains(item)) {
          const items = Array.from(this.querySelectorAll(".c-activity__item"));
          const index = items.indexOf(item);
          const text = item.querySelector(".c-activity__text")?.textContent || "";
          this.dispatchEvent(new CustomEvent("contour:activity-select", { bubbles: true, composed: true, detail: { index, text } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const items = Array.from(this.querySelectorAll(".c-activity__item"));
        if (!items.length) return;
        const active = document.activeElement;
        const idx = items.indexOf(active);
        let next = -1;
        if (e.key === "ArrowDown") next = idx < 0 ? 0 : Math.min(items.length - 1, idx + 1);
        else if (e.key === "ArrowUp") next = idx < 0 ? 0 : Math.max(0, idx - 1);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = items.length - 1;
        if (next >= 0 && next !== idx) {
          e.preventDefault();
          items[next].focus();
          items[next].tabIndex = 0;
          if (idx >= 0) items[idx].tabIndex = -1;
        }
        if ((e.key === "Enter" || e.key === " ") && idx >= 0) {
          e.preventDefault();
          const text = items[idx].querySelector(".c-activity__text")?.textContent || "";
          this.dispatchEvent(new CustomEvent("contour:activity-select", { bubbles: true, composed: true, detail: { index: idx, text } }));
        }
      });
    }
  }
  define("contour-activity", ContourActivity);
class ContourAdvanced extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-advanced");
      this.setAttribute("role", "region");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-advanced__title", () => { const el = document.createElement("div"); el.className = "c-advanced__title"; return el; });
        t.textContent = title;
        this.setAttribute("aria-label", title);
      }
    }
    enhance() {
      if (this._wiredAdvanced) return;
      this._wiredAdvanced = true;
      this.addEventListener("click", (e) => {
        const title = this.getAttribute("title") || "";
        this.dispatchEvent(new CustomEvent("contour:advanced-toggle", { bubbles: true, composed: true, detail: { title } }));
      });
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const title = this.getAttribute("title") || "";
          this.dispatchEvent(new CustomEvent("contour:advanced-toggle", { bubbles: true, composed: true, detail: { title } }));
        }
      });
    }
  }
  define("contour-advanced", ContourAdvanced);
class ContourAffordance extends ContourBase {
    static get observed() { return ["name", "note", "demo"]; }
    static get properties() { return { name: { attribute: "name" }, note: { attribute: "note" }, demo: { attribute: "demo" } }; }
    render() {
      this.classList.add("c-affordance");
      this.setAttribute("role", "group");
      const name = this.getAttribute("name");
      if (name) {
        const n = this.ensure(".c-affordance__name", () => { const el = document.createElement("div"); el.className = "c-affordance__name"; return el; });
        n.textContent = name;
        this.setAttribute("aria-label", name);
      } else {
        const n = this.querySelector(".c-affordance__name");
        if (n) n.remove();
      }
      const note = this.getAttribute("note");
      if (note) {
        const nt = this.ensure(".c-affordance__note", () => { const el = document.createElement("div"); el.className = "c-affordance__note"; return el; });
        nt.textContent = note;
      } else {
        const nt = this.querySelector(".c-affordance__note");
        if (nt) nt.remove();
      }
      const demo = this.getAttribute("demo");
      if (demo) {
        const d = this.ensure(".c-affordance__demo", () => { const el = document.createElement("div"); el.className = "c-affordance__demo"; return el; });
        d.textContent = demo;
      } else {
        const d = this.querySelector(".c-affordance__demo");
        if (d) d.remove();
      }
    }
    enhance() {
      if (this._wiredAffordance) return;
      this._wiredAffordance = true;
      this.addEventListener("click", (e) => {
        const name = this.getAttribute("name") || "";
        this.dispatchEvent(new CustomEvent("contour:affordance-activate", { bubbles: true, composed: true, detail: { name } }));
      });
    }
  }
  define("contour-affordance", ContourAffordance);
class ContourAffordances extends ContourBase {
    static get observed() { return ["name", "title"]; }
    static get properties() { return { name: { attribute: "name" }, title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-affordances");
      this.setAttribute("role", "group");
      if (!this.querySelector(".c-affordance")) {
        const aff = document.createElement("div");
        aff.className = "c-affordance";
        const name = this.getAttribute("name") || this.getAttribute("title") || "Affordance";
        const n = document.createElement("div");
        n.className = "c-affordance__name";
        n.textContent = name;
        aff.appendChild(n);
        const demo = document.createElement("div");
        demo.className = "c-affordance__demo";
        demo.textContent = "Demo";
        aff.appendChild(demo);
        this.appendChild(aff);
      }
    }
  }
  define("contour-affordances", ContourAffordances);




class ContourMenu extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-menu");
      if (!this.hasAttribute("role")) this.setAttribute("role", "menu");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "menu")) return;
      const items = remoteData(this, "items");
      // Slot composition wins over the JSON attribute.
       const authored = Array.from(this.children).filter((n) => !n.classList || !n.classList.contains("c-menu"));
       if (authored.length) {
         if (this.querySelector("ul.c-menu")) return;
         const ul = document.createElement("ul");
         ul.className = "c-menu";
         ul.setAttribute("role", "menu");
         this.appendChild(ul);
         return;
       }
       if (items) {
         try {
           const parsed = JSON.parse(items);
           const ul = this.ensure("ul.c-menu", () => { const el = document.createElement("ul"); el.className = "c-menu"; el.setAttribute("role", "menu"); return el; });
           ul.innerHTML = "";
           ul.setAttribute("role", "menu");
           parsed.forEach((item) => {
             if (item === "---" || item === "separator") {
               const li = document.createElement("li");
               li.className = "c-menu__separator";
               li.setAttribute("role", "separator");
               ul.appendChild(li);
             } else if (typeof item === "string") {
               const li = document.createElement("li");
               li.className = "c-menu__item";
               li.setAttribute("role", "menuitem");
               li.textContent = item;
               ul.appendChild(li);
             } else if (item.group) {
               const li = document.createElement("li");
               li.className = "c-menu__group";
               li.setAttribute("role", "group");
               if (item.group) li.setAttribute("aria-label", String(item.group));
               const hdr = document.createElement("div");
               hdr.className = "c-menu__group-label";
               hdr.textContent = String(item.group);
               li.appendChild(hdr);
               if (Array.isArray(item.items)) {
                 const sub = document.createElement("ul");
                 sub.className = "c-menu";
                 sub.setAttribute("role", "menu");
                 item.items.forEach((subItem) => {
                   const sli = document.createElement("li");
                   sli.className = "c-menu__item" + (subItem.danger ? " c-menu__item--danger" : "") + (subItem.disabled ? " c-menu__item--disabled" : "");
                   sli.setAttribute("role", "menuitem");
                   if (subItem.disabled) sli.setAttribute("aria-disabled", "true");
                   if (subItem.label || subItem.title) {
                     const lbl = document.createElement("span");
                     lbl.className = "c-menu__label";
                     lbl.textContent = subItem.label || subItem.title || "";
                     sli.appendChild(lbl);
                   }
                   sub.appendChild(sli);
                 });
                 li.appendChild(sub);
               }
               ul.appendChild(li);
             } else {
               const li = document.createElement("li");
               li.className = "c-menu__item" + (item.danger ? " c-menu__item--danger" : "") + (item.disabled ? " c-menu__item--disabled" : "");
               li.setAttribute("role", "menuitem");
               if (item.disabled) li.setAttribute("aria-disabled", "true");
               if (item.items && Array.isArray(item.items)) {
                 li.setAttribute("aria-haspopup", "menu");
                 li.setAttribute("aria-expanded", "false");
               }
               if (item.label || item.title) {
                 const lbl = document.createElement("span");
                 lbl.className = "c-menu__label";
                 lbl.textContent = item.label || item.title || "";
                 li.appendChild(lbl);
               }
               if (item.shortcut) {
                 const sc = document.createElement("span");
                 sc.className = "c-menu__shortcut";
                 sc.textContent = item.shortcut;
                 li.appendChild(sc);
               }
               ul.appendChild(li);
             }
           });
           if (ul.parentNode !== this) this.appendChild(ul);
           this.classList.remove("c-menu");
           ul.classList.add("c-menu");
         } catch (e) { /* keep existing */ }
       } else {
         renderEmpty(this, "menu");
       }
    }
    enhance() {
      wireMenu(this);
    }
  }
define("contour-menu", ContourMenu);
class ContourTabs extends ContourBase {
    static get observed() { return ["tabs", "autoplay", "pause", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "persist", "orientation", "closable"]; }
    static get properties() { return { tabs: { attribute: "tabs" }, autoplay: { attribute: "autoplay", type: Number }, pause: { attribute: "pause", type: Boolean }, src: { attribute: "src" }, orientation: { attribute: "orientation" }, closable: { attribute: "closable", type: Boolean } }; }
    render() {
      this.classList.add("c-tabs");
      wireStates(this);
      loadRemote(this, "tabs");
      if (renderStates(this, "tabs")) return;
      const tabs = remoteData(this, "tabs");
      // Slot composition wins over the JSON attribute, same as ContourMenu:
      // authored tab buttons and panels stay across re-renders and the
      // JSON scaffolding only fills in when the host is empty.
      const authored = Array.from(this.children).filter((n) => !n.classList || !n.classList.contains("c-tabs__list"));
      if (tabs && !authored.length) {
         try {
           const parsed = JSON.parse(tabs);
            const list = this.ensure(".c-tabs__list", () => { const el = document.createElement("div"); el.className = "c-tabs__list"; el.setAttribute("role", "tablist"); return el; });
            list.setAttribute("role", "tablist");
            const orientation = this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
            list.setAttribute("aria-orientation", orientation);
            if (orientation === "vertical") this.classList.add("c-tabs--vertical"); else this.classList.remove("c-tabs--vertical");
             // Preserve the selected tab across rebuilds (G-31): read the
             // pre-drop selection before clearing, then re-apply it.
             const _prevTabs = Array.from(list.querySelectorAll("[role='tab']"));
             const _prevSel = _prevTabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
             const _keepIdx = _prevSel >= 0 ? _prevSel : 0;
             list.innerHTML = "";
             // Remove any previously generated panels so re-render doesn't stack.
             Array.from(this.querySelectorAll(".c-tabs__panel")).forEach((n) => n.remove());
             parsed.forEach((t, i) => {
               const label = typeof t === "string" ? t : (t.label || t.title || "");
               const panelId = contourId("c-tabs-panel");
               const btn = document.createElement("button");
               btn.className = "c-tabs__tab";
               btn.setAttribute("role", "tab");
               btn.setAttribute("aria-selected", String(i === _keepIdx));
               btn.setAttribute("aria-controls", panelId);
               btn.tabIndex = i === _keepIdx ? 0 : -1;
              btn.textContent = label;
              if (this.hasAttribute("closable")) {
                const closeBtn = document.createElement("button");
                closeBtn.type = "button";
                closeBtn.className = "c-tabs__close";
                closeBtn.setAttribute("aria-label", "Close " + label);
                closeBtn.textContent = "×";
                closeBtn.addEventListener("click", (e) => {
                  e.stopPropagation();
                  const idx = Array.from(list.querySelectorAll("[role='tab']")).indexOf(btn);
                  // remove tab + panel
                  const ctrl = btn.getAttribute("aria-controls");
                  const panel = ctrl ? document.getElementById(ctrl) : null;
                  btn.remove();
                  if (panel) panel.remove();
                  this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true, detail: { index: idx, label } }));
                  // activate first remaining tab
                  const remaining = list.querySelectorAll("[role='tab']");
                  if (remaining.length) remaining[0].click();
                });
                btn.appendChild(closeBtn);
              }
              list.appendChild(btn);
              const panel = document.createElement("div");
              panel.className = "c-tabs__panel";
              panel.id = panelId;
              panel.setAttribute("role", "tabpanel");
              if (typeof t === "object" && t !== null && t.content !== undefined) {
                panel.textContent = String(t.content);
              }
               if (i !== _keepIdx) panel.hidden = true;
              this.appendChild(panel);
            });
            if (list.parentNode !== this) this.prepend(list);
         } catch (e) { /* keep existing */ }
        } else if (!tabs && !authored.length) {
          const list = this.querySelector(".c-tabs__list");
          if (list) list.remove();
          renderEmpty(this, "tabs");
        }
     }
    enhance() {
      wireTabs(this);
      // Tabs autoplay (BY-29). Mirrors the streaming chart's interval contract
      // (data.mjs): `autoplay` (seconds) advances the selection, `pause` stops
      // it, the timer is owned once and disposed with the host, and the whole
      // thing is gated on reduced motion. The advance is a click on the next
      // tab, so wireTabs' own listener performs the activation and emits the
      // manifest's contour:tab-change — this component never re-emits what its
      // wiring already announced. Hover and focus also stop the loop (WCAG
      // 2.2.2: auto-updating content needs a mechanism to pause, stop or hide;
      // the pause attribute is the explicit one, hover/focus the implicit two).
      const sync = () => {
        const seconds = parseFloat(this.getAttribute("autoplay") || "");
        const paused = this.hasAttribute("pause") || this._tabsHover || this._tabsFocus;
        const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
        const want = Number.isFinite(seconds) && seconds > 0 && !paused && !reduced;
        if (want === this._tabsAutoplayRunning) return;
        this._tabsAutoplayRunning = want;
        if (this._tabsTimer !== undefined) { clearInterval(this._tabsTimer); this._tabsTimer = undefined; }
        if (!want) return;
        this._tabsTimer = setInterval(() => {
          if (!this.isConnected || this.hasAttribute("pause") || this._tabsHover || this._tabsFocus) return;
          const list = this.querySelector(".c-tabs__list");
          const tabs = list ? Array.from(list.querySelectorAll("[role='tab']")) : [];
          if (!tabs.length) return;
          const cur = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
          const next = tabs[(cur + 1) % tabs.length];
          if (next) next.click();
        }, Math.max(1000, seconds * 1000));
      };
      // Re-run on every render so autoplay/pause attribute changes are picked
      // up; the listeners and the disposer are installed exactly once.
      sync();
      if (this._wiredTabsAutoplay) return;
      this._wiredTabsAutoplay = true;
      this.addEventListener("pointerenter", () => { this._tabsHover = true; sync(); });
      this.addEventListener("pointerleave", () => { this._tabsHover = false; sync(); });
      this.addEventListener("focusin", () => { this._tabsFocus = true; sync(); });
      this.addEventListener("focusout", () => { this._tabsFocus = false; sync(); });
      onDispose(this, () => { if (this._tabsTimer !== undefined) { clearInterval(this._tabsTimer); this._tabsTimer = undefined; } });
    }
  }
define("contour-tabs", ContourTabs);
class ContourHeader extends ContourBase {
    static get observed() { return ["brand", "links"]; }
    static get properties() { return { brand: { attribute: "brand" }, links: { attribute: "links" } }; }
    render() {
      this.classList.add("c-header");
      const brand = this.getAttribute("brand");
      const links = this.getAttribute("links");
      const inner = this.ensure(".c-header__inner", () => { const el = document.createElement("div"); el.className = "container c-header__inner"; return el; });
      inner.className = "container c-header__inner";
      // Brand
      let brandEl = inner.querySelector(".c-brand");
      if (brand) {
        if (!brandEl) {
          brandEl = document.createElement("a");
          brandEl.className = "c-brand";
          brandEl.setAttribute("data-contour-generated", "");
          brandEl.href = "#";
          brandEl.innerHTML = `<span class="c-mark"><svg aria-hidden="true"><use href="#i-mark" /></svg></span>`;
          const brandName = document.createElement("span");
          brandName.className = "c-brand__name";
          brandEl.appendChild(brandName);
          inner.insertBefore(brandEl, inner.firstChild);
        }
        const brandName = brandEl.querySelector(".c-brand__name");
        if (brandName) brandName.textContent = brand;
      } else if (brandEl && brandEl.hasAttribute("data-contour-generated")) {
        brandEl.remove();
      }
      // Nav
      let nav = inner.querySelector(".c-header__nav");
      const authoredNav = nav ? Array.from(nav.children).filter((n) => n.tagName === "A") : [];
      if (links && !authoredNav.length) {
        try {
          const parsed = JSON.parse(links);
          if (!nav) {
            nav = document.createElement("nav");
            nav.className = "c-header__nav";
            nav.setAttribute("aria-label", "Main");
            nav.setAttribute("data-contour-generated", "");
            inner.appendChild(nav);
          }
          nav.innerHTML = "";
          parsed.forEach((l) => {
            const a = document.createElement("a");
            a.href = l.href || "#";
            a.textContent = l.label || l;
            nav.appendChild(a);
          });
        } catch (e) { /* skip */ }
      } else if (links && authoredNav.length) {
        // authored nav wins; keep it
      } else if (nav && !links && !authoredNav.length && nav.hasAttribute("data-contour-generated")) {
        nav.remove();
      }
      // Actions container
      if (!inner.querySelector(".c-header__actions")) {
        const actions = document.createElement("div");
        actions.className = "c-header__actions";
        inner.appendChild(actions);
      }
      // Mobile toggle (BY-29). Below 60rem the sheet hides .c-header__nav with
      // no way to open it; the toggle is the way. It is created only when a nav
      // exists, controls that nav by id, and starts closed so the first paint
      // matches the closed CSS state. It rides inside .c-header__actions so the
      // group's margin-inline-start:auto keeps it at the far right under 60rem.
      // `i-grid` stands in for a hamburger: the sprite ships no i-menu symbol
      // (index.html is the guide's own, and a dead <use> would be a defect), so
      // the closest existing menu-like glyph is used with the real label.
      const navEl = inner.querySelector(".c-header__nav");
      if (navEl) {
        if (!navEl.id) navEl.id = "contour-header-nav";
        const actions = inner.querySelector(".c-header__actions");
        if (actions && !actions.querySelector(".c-header__toggle")) {
          const toggle = document.createElement("button");
          toggle.type = "button";
          toggle.className = "c-header__toggle";
          toggle.setAttribute("aria-label", "Toggle navigation");
          toggle.setAttribute("aria-expanded", "false");
          toggle.setAttribute("aria-controls", navEl.id);
          toggle.innerHTML = '<svg aria-hidden="true"><use href="#i-grid" /></svg>';
          actions.appendChild(toggle);
        }
      }
      if (inner.parentNode !== this) this.appendChild(inner);
    }
    enhance() {
      if (this._wiredHeader) return;
      this._wiredHeader = true;
      // Scroll state (BY-29): past a small threshold the header gains
      // c-header--scrolled so the sheet can raise it above the page.
      const update = () => {
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        this.classList.toggle("c-header--scrolled", y > 8);
      };
      update();
      window.addEventListener("scroll", update, { passive: true });
      onDispose(this, () => window.removeEventListener("scroll", update));
      // Toggle: the button shows/hides the nav under 60rem and keeps
      // aria-expanded in step. Close on Escape while open.
      this.addEventListener("click", (e) => {
        const toggle = e.target && e.target.closest ? e.target.closest(".c-header__toggle") : null;
        if (!toggle || !this.contains(toggle)) return;
        const nav = this.querySelector("#" + CSS.escape(toggle.getAttribute("aria-controls") || ""));
        if (!nav) return;
        const open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      this.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        const toggle = this.querySelector(".c-header__toggle");
        const nav = toggle && this.querySelector("#" + CSS.escape(toggle.getAttribute("aria-controls") || ""));
        if (!toggle || !nav || !nav.classList.contains("is-open")) return;
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    }
  }
  define("contour-header", ContourHeader);
class ContourTree extends ContourBase {
    static get updateMode() { return "keyed"; }
    static get observed() { return ["items", "virtual", "item-height", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "persist", "selectable"]; }
    static get properties() { return { items: { attribute: "items" }, src: { attribute: "src" }, "item-height": { attribute: "item-height" } }; }
    _itemHeight() {
      const h = Number(this.getAttribute("item-height"));
      return Number.isFinite(h) && h > 0 ? h : 28;
    }
    _labelToPaths(nodes, pathPrefix, map) {
      (nodes || []).forEach((node, i) => {
        const p = pathPrefix + "." + i;
        const label = String(node.label || node).trim().slice(0, 120);
        if (!map.has(label)) map.set(label, []);
        map.get(label).push(p);
        if (Array.isArray(node.children)) this._labelToPaths(node.children, p, map);
      });
    }
    _restoreExpanded() {
      const persist = this.getAttribute("persist");
      if (!persist || !this._treeData) return;
      let labels = null;
      try {
        if (persist === "storage" && this.id) {
          const saved = localStorage.getItem("contour-tree:" + this.id);
          if (saved !== null) labels = JSON.parse(saved);
        } else if (persist === "url") {
          const v = new URLSearchParams(window.location.search).get("c-tree");
          if (v !== null) labels = JSON.parse(v);
        }
      } catch (e) { labels = null; }
      if (!Array.isArray(labels)) return;
      const want = new Set(labels.map((l) => String(l)));
      const map = new Map();
      this._labelToPaths(this._treeData, "", map);
      const expanded = this._expanded || (this._expanded = new Set());
      for (const lbl of want) {
        const paths = map.get(lbl);
        if (paths) paths.forEach((p) => expanded.add(p));
      }
    }
    _persistExpanded() {
      const persist = this.getAttribute("persist");
      if (!persist || !this._expanded) return;
      // Map expanded paths back to labels.
      const pathToNode = new Map();
      const walk = (nodes, pathPrefix) => {
        (nodes || []).forEach((node, i) => {
          const p = pathPrefix + "." + i;
          pathToNode.set(p, node);
          if (Array.isArray(node.children)) walk(node.children, p);
        });
      };
      walk(this._treeData, "");
      const open = [];
      for (const p of this._expanded) {
        const node = pathToNode.get(p);
        if (node) open.push(String(node.label || node).trim().slice(0, 120));
      }
      try {
        if (persist === "storage" && this.id) {
          localStorage.setItem("contour-tree:" + this.id, JSON.stringify(open));
        } else if (persist === "url") {
          const url = new URL(window.location.href);
          url.searchParams.set("c-tree", JSON.stringify(open));
          window.history.replaceState(null, "", url.toString());
        }
      } catch (e) {}
    }
    _flatten(nodes, pathPrefix, depth, expanded, out) {
      (nodes || []).forEach((node, i) => {
        const p = pathPrefix + "." + i;
        const hasChildren = Array.isArray(node.children) && node.children.length > 0;
        const isExpanded = expanded.has(p);
        out.push({ node, path: p, depth, hasChildren, expanded: isExpanded });
        if (hasChildren && isExpanded) {
          this._flatten(node.children, p, depth + 1, expanded, out);
        }
      });
    }
    _renderNodeFlat(rootUl, f) {
      const node = f.node;
      const depth = f.depth;
      const li = document.createElement("div");
      li.className = "c-tree__node";
      li.setAttribute("role", "treeitem");
      li.setAttribute("aria-level", String(depth));
      li.dataset.path = f.path;
      if (f.hasChildren) {
        li.setAttribute("aria-expanded", String(f.expanded));
        const row = document.createElement("div");
        row.className = "c-tree__row" + (node.active ? " c-tree__row--active" : "") + (node.dir ? " c-tree__row--dir" : "");
        row.style.paddingInlineStart = ((depth - 1) * 1) + "rem";
        const toggle = document.createElement("button");
        toggle.className = "c-tree__toggle";
        toggle.setAttribute("type", "button");
        toggle.setAttribute("aria-expanded", String(f.expanded));
        toggle.setAttribute("aria-label", "Toggle");
        toggle.innerHTML = '<svg aria-hidden="true"><use href="#i-chevron-right" /></svg>';
        row.appendChild(toggle);
        const span = document.createElement("span");
        span.textContent = node.label;
        row.appendChild(span);
        li.appendChild(row);
      } else {
        const leaf = document.createElement("div");
        leaf.className = "c-tree__leaf" + (node.active ? " c-tree__row--active" : "") + (node.dir ? " c-tree__row--dir" : "");
        leaf.style.paddingInlineStart = (depth * 1) + "rem";
        if (this.hasAttribute("selectable")) {
          const cb = document.createElement("input");
          cb.type = "checkbox";
          cb.className = "c-tree__select";
          cb.setAttribute("aria-label", "Select " + (node.label || node));
          const label = String(node.label || node).trim().slice(0, 120);
          if (this._selectedTree && this._selectedTree.has(label)) cb.checked = true;
          leaf.insertBefore(cb, leaf.firstChild);
        }
        leaf.appendChild(document.createTextNode(node.label || node));
        li.appendChild(leaf);
      }
      return li;
    }
    _renderWindow(rootUl, scrollTop) {
      if (!this._treeData) return;
      const ih = this._itemHeight();
      const expanded = this._expanded || (this._expanded = new Set());
      const flat = [];
      this._flatten(this._treeData, "", 1, expanded, flat);
      const total = flat.length;
      const viewportSize = rootUl.clientHeight || 320;
      const visibleCount = Math.ceil(viewportSize / ih) + 6;
      let start = Math.floor((scrollTop || 0) / ih);
      if (start < 0) start = 0;
      if (start > Math.max(0, total - visibleCount)) start = Math.max(0, total - visibleCount);
      const end = Math.min(total, start + visibleCount);
      const topSize = start * ih;
      const bottomSize = Math.max(0, (total - end) * ih);
      rootUl.innerHTML = "";
      const top = document.createElement("div");
      top.className = "c-tree__spacer c-tree__spacer--top";
      top.style.height = topSize + "px";
      rootUl.appendChild(top);
      for (let i = start; i < end; i++) {
        rootUl.appendChild(this._renderNodeFlat(rootUl, flat[i]));
      }
      const bottom = document.createElement("div");
      bottom.className = "c-tree__spacer c-tree__spacer--bottom";
      bottom.style.height = bottomSize + "px";
      rootUl.appendChild(bottom);
    }
render() {
       this.classList.add("c-tree");
       // Slot composition wins over the JSON attribute, same as ContourMenu:
       // an authored tree is preserved across re-renders instead of being
       // rebuilt from `items` and losing whatever the reader put in it.
        const authored = Array.from(this.children).filter((n) => !n.classList || !n.classList.contains("c-tree"));
        wireStates(this);
        loadRemote(this, "items");
        if (renderStates(this, "tree")) return;
        const items = remoteData(this, "items");
        if (items && !authored.length) {
         try {
           const parsed = JSON.parse(items);
           const rootUl = this.ensure("div.c-tree", () => { const el = document.createElement("div"); el.className = "c-tree"; el.setAttribute("role", "tree"); return el; });
           rootUl.innerHTML = "";
           rootUl.className = "c-tree";
           rootUl.setAttribute("role", "tree");
           const virtual = this.hasAttribute("virtual");
           if (virtual) {
             this._treeData = parsed;
             this._expanded = this._expanded || new Set();
             this._treeRoot = rootUl;
             this._restoreExpanded();
             rootUl.style.maxHeight = rootUl.style.maxHeight || "24rem";
             rootUl.style.overflow = "auto";
             const scrollTop = this._treeScrollTop || 0;
             this._renderWindow(rootUl, scrollTop);
             try { rootUl.scrollTop = scrollTop; } catch (e) {}
           } else {
             this._treeData = null;
             const render = (nodes, parent, depth) => {
                const ul = parent ? document.createElement("div") : rootUl;
                if (parent) {
                  ul.className = "c-tree__children";
                  ul.setAttribute("role", "group");
                  if (supportsUntilFound()) ul.setAttribute("hidden", "until-found"); else ul.setAttribute("hidden", "");
                }
               nodes.forEach((node) => {
                const li = document.createElement("div");
                li.className = "c-tree__node";
                li.setAttribute("role", "treeitem");
                li.setAttribute("aria-level", String(depth));
                 if (node.children) {
                    li.setAttribute("aria-expanded", "false");
                    const row = document.createElement("div");
                    row.className = "c-tree__row" + (node.active ? " c-tree__row--active" : "") + (node.dir ? " c-tree__row--dir" : "");
                   if (node.indent) {
                     const ind = document.createElement("span");
                     ind.className = "c-tree__indent";
                     ind.style.inlineSize = (node.indent * 1) + "rem";
                     row.appendChild(ind);
                   }
                   const toggle = document.createElement("button");
                   toggle.className = "c-tree__toggle";
                   toggle.setAttribute("type", "button");
                   toggle.setAttribute("aria-expanded", "false");
                  toggle.setAttribute("aria-label", "Toggle");
                  toggle.innerHTML = '<svg aria-hidden="true"><use href="#i-chevron-right" /></svg>';
                  row.appendChild(toggle);
                  const span = document.createElement("span");
                  span.textContent = node.label;
                  row.appendChild(span);
                  li.appendChild(row);
                  render(node.children, li, depth + 1);
                } else {
                  const leaf = document.createElement("div");
                  leaf.className = "c-tree__leaf" + (node.active ? " c-tree__row--active" : "") + (node.dir ? " c-tree__row--dir" : "");
                  if (node.indent) {
                    const ind = document.createElement("span");
                    ind.className = "c-tree__indent";
                    ind.style.inlineSize = (node.indent * 1) + "rem";
                    leaf.appendChild(ind);
                  }
                  if (this.hasAttribute("selectable")) {
                     const cb = document.createElement("input");
                     cb.type = "checkbox";
                     cb.className = "c-tree__select";
                     cb.setAttribute("aria-label", "Select " + (node.label || node));
                     leaf.insertBefore(cb, leaf.firstChild);
                   }
                   leaf.appendChild(document.createTextNode(node.label || node));
                  li.appendChild(leaf);
                }
                ul.appendChild(li);
              });
              if (parent) parent.appendChild(ul);
            };
            render(parsed, null, 1);
           }
           this.classList.remove("c-tree");
           rootUl.classList.add("c-tree");
           if (rootUl.parentNode !== this) this.appendChild(rootUl);
        } catch (e) { /* keep existing */ }
      } else if (!items && !authored.length) {
        renderEmpty(this, "tree");
      }
    }
    enhance() {
      // Toggle handling via delegation (works for windowed + static trees).
      if (!this._wiredTreeToggle) {
        this._wiredTreeToggle = true;
        this.addEventListener("click", (e) => {
          const toggle = e.target && e.target.closest ? e.target.closest(".c-tree__toggle") : null;
          if (!toggle || !this.contains(toggle)) return;
          e.stopPropagation();
          const nodeEl = toggle.closest(".c-tree__node");
          const path = nodeEl && nodeEl.dataset ? nodeEl.dataset.path : null;
          const expanded = toggle.getAttribute("aria-expanded") === "true";
          if (path && this._expanded) {
            if (expanded) this._expanded.delete(path); else this._expanded.add(path);
          }
          toggle.setAttribute("aria-expanded", String(!expanded));
          const row = toggle.closest(".c-tree__row");
          if (row) row.setAttribute("aria-expanded", String(!expanded));
          if (this.hasAttribute("virtual") && this._treeRoot) {
            const s = this._treeRoot;
            this._treeScrollTop = s.scrollTop || 0;
            this._renderWindow(s, this._treeScrollTop);
            try { s.scrollTop = this._treeScrollTop; } catch (err) {}
            this._persistExpanded();
          }
        });
      }
      // Scroll-driven windowing for virtual trees.
      if (this.hasAttribute("virtual") && !this._wiredTreeScroll) {
        this._wiredTreeScroll = true;
        const attach = () => {
          const s = this.querySelector(".c-tree");
          if (!s || s._treeScrollWired) return;
          s._treeScrollWired = true;
          let raf = 0;
          const onScroll = () => {
            if (raf) return;
            raf = requestAnimationFrame(() => {
              raf = 0;
              this._treeScrollTop = s.scrollTop || 0;
              this._renderWindow(s, this._treeScrollTop);
              try { s.scrollTop = this._treeScrollTop; } catch (err) {}
            });
          };
          s.addEventListener("scroll", onScroll, { passive: true });
          onDispose(this, () => { s.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); });
        };
        attach();
        // retry if root not ready
        if (!this.querySelector(".c-tree")) {
          const mo = new MutationObserver(() => { if (this.querySelector(".c-tree")) { attach(); mo.disconnect(); } });
          mo.observe(this, { childList: true, subtree: true });
          onDispose(this, () => mo.disconnect());
        }
      }
      // Auto-scroll during drag for virtual trees (so off-screen targets
      // become reachable). Delegated on the host; only active in virtual mode.
      if (this.hasAttribute("virtual") && !this._wiredTreeDragScroll) {
        this._wiredTreeDragScroll = true;
        let dragScrollRaf = 0;
        let dragScrollDir = 0;
        const tick = () => {
          if (!dragScrollDir) { dragScrollRaf = 0; return; }
          const s = this._treeRoot;
          if (s) {
            s.scrollTop += dragScrollDir * 8;
            this._treeScrollTop = s.scrollTop;
            this._renderWindow(s, this._treeScrollTop);
          }
          dragScrollRaf = requestAnimationFrame(tick);
        };
        this.addEventListener("dragover", (e) => {
          const s = this._treeRoot;
          if (!s) return;
          const rect = s.getBoundingClientRect();
          const edge = 40;
          if (e.clientY < rect.top + edge) dragScrollDir = -1;
          else if (e.clientY > rect.bottom - edge) dragScrollDir = 1;
          else dragScrollDir = 0;
          if (dragScrollDir && !dragScrollRaf) dragScrollRaf = requestAnimationFrame(tick);
        });
        const stop = () => {
          dragScrollDir = 0;
          if (dragScrollRaf) { cancelAnimationFrame(dragScrollRaf); dragScrollRaf = 0; }
        };
        this.addEventListener("dragend", stop);
        this.addEventListener("drop", stop);
      }
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
      wireTree(this);
    }
  }
  define("contour-tree", ContourTree);
class ContourCodeTabs extends ContourBase {
    static get observed() { return ["tabs", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "persist"]; }
    static get properties() { return { tabs: { attribute: "tabs" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-code-tabs");
      wireStates(this);
      loadRemote(this, "tabs");
      if (renderStates(this, "code-tabs")) return;
      const tabs = remoteData(this, "tabs");
      const list = this.querySelector(".c-code-tabs__list");
      const authored = list ? Array.from(list.children).filter((n) => n.getAttribute && n.getAttribute("role") === "tab") : [];
      if (tabs && !authored.length) {
        try {
          const parsed = JSON.parse(tabs);
           const l = this.ensure(".c-code-tabs__list", () => { const el = document.createElement("div"); el.className = "c-code-tabs__list"; el.setAttribute("role", "tablist"); return el; });
           l.setAttribute("role", "tablist");
            const _prevCodeTabs = Array.from(l.querySelectorAll("[role='tab']"));
            const _prevCodeSel = _prevCodeTabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
            const _keepCodeIdx = _prevCodeSel >= 0 ? _prevCodeSel : 0;
            l.innerHTML = "";
            Array.from(this.querySelectorAll(".c-code-tabs__panel")).forEach((n) => n.remove());
            parsed.forEach((t, i) => {
              const label = typeof t === "string" ? t : (t.label || t.title || "");
              const panelId = contourId("c-code-tabs-panel");
              const btn = document.createElement("button");
              btn.className = "c-code-tabs__tab";
              btn.setAttribute("role", "tab");
              btn.setAttribute("aria-selected", String(i === _keepCodeIdx));
              btn.setAttribute("aria-controls", panelId);
              btn.tabIndex = i === _keepCodeIdx ? 0 : -1;
             btn.textContent = label;
             l.appendChild(btn);
             const panel = document.createElement("div");
             panel.className = "c-code-tabs__panel";
             panel.id = panelId;
             panel.setAttribute("role", "tabpanel");
             if (typeof t === "object" && t !== null && t.content !== undefined) {
               panel.textContent = String(t.content);
             }
              if (i !== _keepCodeIdx) panel.hidden = true;
             this.appendChild(panel);
           });
           if (l.parentNode !== this) this.prepend(l);
        } catch (e) { /* keep existing */ }
      } else if (!tabs && list) {
        list.remove();
        renderEmpty(this, "code-tabs");
      } else if (!tabs && !list) {
        renderEmpty(this, "code-tabs");
      }
    }
    enhance() {
      wireTabs(this);
    }
  }
define("contour-code-tabs", ContourCodeTabs);
class ContourBreadcrumb extends ContourBase {
    static get observed() { return ["items", "separator", "max", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, separator: { attribute: "separator" }, max: { attribute: "max", type: Number }, src: { attribute: "src" } } };
    render() {
      this.classList.add("c-breadcrumb");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "breadcrumb")) return;
      const items = remoteData(this, "items");
      // Slot composition: authored <li> items win over the JSON attribute.
      const nav = this.querySelector("nav");
      const ol = nav ? nav.querySelector("ol") : null;
      const authored = ol ? Array.from(ol.children).filter((n) => n.tagName === "LI") : [];
      if (items && !authored.length) {
        try {
          const parsed = JSON.parse(items);
          const n = this.ensure("nav", () => { const el = document.createElement("nav"); el.setAttribute("aria-label", "Breadcrumb"); el.id = "contour-breadcrumb-list"; return el; });
          n.setAttribute("aria-label", "Breadcrumb");
          n.id = "contour-breadcrumb-list";
          n.innerHTML = "";
          const sep = this.getAttribute("separator") || "/";
          const max = this._overflowExpanded ? null : this.max;
          const shown = Number.isFinite(max) && max > 1 && parsed.length > max
            ? parsed.slice(-max)
            : parsed;
          if (Number.isFinite(max) && max > 1 && parsed.length > max) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "c-breadcrumb__overflow";
            btn.setAttribute("aria-label", `Show ${parsed.length - shown.length + 1} more items`);
            btn.setAttribute("aria-expanded", "false");
            btn.setAttribute("aria-controls", "contour-breadcrumb-list");
            btn.textContent = "…";
            btn.addEventListener("click", () => {
              // A handler-owned property, not an attribute: flipping a
              // self-observed attribute from a handler would re-enter render
              // (the arm-7 trap), so the flag lives outside OBSERVED.
              this._overflowExpanded = true;
              this.requestRender();
            });
            n.appendChild(btn);
          }
          shown.forEach((item, i) => {
            if (i < shown.length - 1) {
              const a = document.createElement("a");
              a.href = item.href || "#";
              a.textContent = item.label || item;
              n.appendChild(a);
              const s = document.createElement("span");
              s.className = "c-breadcrumb__sep";
              s.setAttribute("aria-hidden", "true");
              s.textContent = sep;
              n.appendChild(s);
            } else {
              const span = document.createElement("span");
              span.textContent = item.label || item;
              span.setAttribute("aria-current", "page");
              n.appendChild(span);
            }
          });
        } catch (e) { /* keep existing */ }
       } else if (!items && nav) {
         nav.remove();
       } else if (!items && !nav) {
         renderEmpty(this, "breadcrumb");
       }
    }
  }
define("contour-breadcrumb", ContourBreadcrumb);
class ContourPagination extends ContourBase {
    static get observed() { return ["pages", "current", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "persist"]; }
    static get properties() { return { pages: { attribute: "pages" }, current: { attribute: "current" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-pagination");
      wireStates(this);
      loadRemote(this, "pages");
      if (renderStates(this, "pagination")) return;
      const pages = remoteData(this, "pages");
      // Drop previously generated links so a re-render cannot stack a second set.
      Array.from(this.querySelectorAll(".c-pagination__link")).forEach((n) => n.remove());
      let currentAttr = this.getAttribute("current") || "1";
      if (this.getAttribute("persist") === "storage" && this.id) {
        try { const stored = localStorage.getItem("contour-pagination:" + this.id); if (stored !== null) currentAttr = stored; } catch (e) {}
      } else if (this.getAttribute("persist") === "url") {
        try { const v = new URLSearchParams(window.location.search).get("c-pagination"); if (v !== null) currentAttr = v; } catch (e) {}
      }
      const current = parseInt(currentAttr, "10") || 1;
      if (pages) {
        let count = parseInt(pages, 10);
        if (!Number.isFinite(count) || count < 1) {
          try { const p = JSON.parse(pages); if (Array.isArray(p)) count = p.length; } catch (e) {}
        }
        // Prev button.
        const prev = document.createElement("button");
        prev.type = "button";
        prev.className = "c-pagination__link c-pagination__prev";
        prev.setAttribute("data-action", "prev");
        prev.textContent = "‹";
        prev.setAttribute("aria-label", "Previous page");
        this.appendChild(prev);
        for (let i = 1; i <= count; i++) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "c-pagination__link";
          btn.textContent = String(i);
          if (i === current) {
            btn.setAttribute("aria-current", "page");
          }
          this.appendChild(btn);
        }
        // Next button.
        const next = document.createElement("button");
        next.type = "button";
        next.className = "c-pagination__link c-pagination__next";
        next.setAttribute("data-action", "next");
        next.textContent = "›";
        next.setAttribute("aria-label", "Next page");
        this.appendChild(next);
      } else {
        renderEmpty(this, "pagination");
      }
    }
    enhance() {
      wirePagination(this);
    }
  }
define("contour-pagination", ContourPagination);
class ContourPagerFull extends ContourBase {
    static get observed() { return ["prev", "next"]; }
    static get properties() { return { prev: { attribute: "prev" }, next: { attribute: "next" } }; }
    render() {
      this.classList.add("c-pager");
      // Drop previously generated links so a re-render cannot stack a second set.
      Array.from(this.querySelectorAll(".c-pager__link")).forEach((n) => n.remove());
      const prev = this.getAttribute("prev");
      const next = this.getAttribute("next");
      if (prev) {
        const a = document.createElement("a");
        a.className = "c-pager__link";
        a.href = prev.split("|")[1] || "#";
        const dir = document.createElement("span");
        dir.className = "c-pager__dir";
        dir.textContent = "← Previous";
        a.appendChild(dir);
        const title = document.createElement("span");
        title.className = "c-pager__title";
        title.textContent = prev.split("|")[0];
        a.appendChild(title);
        this.appendChild(a);
      }
      if (next) {
        const a = document.createElement("a");
        a.className = "c-pager__link c-pager__link--next";
        a.href = next.split("|")[1] || "#";
        const dir = document.createElement("span");
        dir.className = "c-pager__dir";
        dir.textContent = "Next →";
        a.appendChild(dir);
        const title = document.createElement("span");
        title.className = "c-pager__title";
        title.textContent = next.split("|")[0];
        a.appendChild(title);
        this.appendChild(a);
      }
    }
  }
  define("contour-pager", ContourPagerFull);
class ContourTocFull extends ContourBase {
    static get observed() { return ["title", "items", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { title: { attribute: "title" }, items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-toc");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "toc")) return;
      const items = remoteData(this, "items");
      const title = this.getAttribute("title") || "On this page";
      const titleEl = this.ensure(".c-toc__title", () => { const el = document.createElement("div"); el.className = "c-toc__title"; return el; });
      titleEl.textContent = title;
      const list = this.querySelector(".c-toc__list");
      const authored = list ? Array.from(list.children).filter((n) => n.tagName === "A") : [];
      if (items && !authored.length) {
        try {
          const parsed = JSON.parse(items);
          const l = this.ensure(".c-toc__list", () => { const el = document.createElement("nav"); el.className = "c-toc__list"; return el; });
          l.className = "c-toc__list";
          l.setAttribute("aria-label", title);
          l.innerHTML = "";
          parsed.forEach((item) => {
            const a = document.createElement("a");
            a.className = "c-toc__link" + (item.sub ? " c-toc__link--sub" : "");
            a.href = item.href || "#";
            a.textContent = item.label || item;
            if (item.current) a.setAttribute("aria-current", "true");
            l.appendChild(a);
          });
        } catch (e) { /* keep existing */ }
      } else if (!items && list) {
        list.remove();
        renderEmpty(this, "toc");
      } else if (!items && !list) {
        renderEmpty(this, "toc");
      }
    }
    enhance() {
      // Scroll-spy (BY-29). The toc links point at page sections by href; when
      // IntersectionObserver exists, the section currently in the reading band
      // marks its link aria-current="true" and clears the rest. The shipped CSS
      // already styles .c-toc__link[aria-current="true"], so the hook needs no
      // new rule. Enhancement-only: without IntersectionObserver the links stay
      // as rendered, with author-provided aria-current left untouched.
      if (this._wiredTocSpy) return;
      if (typeof IntersectionObserver !== "function") return;
      const links = () => Array.from(this.querySelectorAll(".c-toc__link"));
      const targets = links()
        .map((a) => {
          const href = a.getAttribute("href") || "";
          if (!href.startsWith("#") || href.length < 2) return null;
          return document.getElementById(href.slice(1));
        })
        .filter(Boolean);
      if (!targets.length) return;
      this._wiredTocSpy = true;
      const spy = new IntersectionObserver((entries) => {
        const visible = entries.filter((en) => en.isIntersecting).map((en) => en.target.id);
        if (!visible.length) return;
        const top = visible[0];
        links().forEach((a) => {
          const href = a.getAttribute("href") || "";
          const isCurrent = href === "#" + top;
          if (isCurrent && a.getAttribute("aria-current") !== "true") a.setAttribute("aria-current", "true");
          else if (!isCurrent && a.hasAttribute("aria-current")) a.removeAttribute("aria-current");
        });
      }, { rootMargin: "0px 0px -60% 0px", threshold: 0 });
      targets.forEach((t) => spy.observe(t));
      onDispose(this, () => spy.disconnect());
      // Smooth scroll on link click (F-23).
      if (!this._wiredTocScroll) {
        this._wiredTocScroll = true;
        this.addEventListener("click", (e) => {
          const a = e.target && e.target.closest ? e.target.closest(".c-toc__link") : null;
          if (!a || !this.contains(a)) return;
          const href = a.getAttribute("href") || "";
          if (!href.startsWith("#") || href.length < 2) return;
          const target = document.getElementById(href.slice(1));
          if (!target) return;
          e.preventDefault();
          try { target.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (err) { target.scrollIntoView(); }
        });
      }
    }
  }
define("contour-toc", ContourTocFull);
class ContourFilterBar extends ContourBase {
    static get observed() { return ["label", "divider", "items", "input", "placeholder", "mode", "modes", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "count", "clearable"]; }
    static get properties() { return { label: { attribute: "label" }, divider: { attribute: "divider" }, items: { attribute: "items" }, src: { attribute: "src" }, count: { attribute: "count" }, clearable: { attribute: "clearable" } }; }
    render() {
      this.classList.add("c-filter-bar");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "filter-bar")) return;
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-filter-bar__label", () => { const el = document.createElement("span"); el.className = "c-filter-bar__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-filter-bar__label");
        if (l) l.remove();
      }
       if (this.hasAttribute("divider")) {
         this.ensure(".c-filter-bar__divider", () => { const el = document.createElement("span"); el.className = "c-filter-bar__divider"; return el; });
       } else {
         const d = this.querySelector(".c-filter-bar__divider");
         if (d) d.remove();
       }
       // Text input support
       if (this.hasAttribute("input") || this.hasAttribute("placeholder")) {
         let inp = this.querySelector(".c-filter-bar__input");
         if (!inp) { inp = document.createElement("input"); inp.type = "search"; inp.className = "c-filter-bar__input"; this.appendChild(inp); }
         const ph = this.getAttribute("placeholder");
         if (ph) inp.setAttribute("placeholder", ph);
       } else {
         const inp = this.querySelector(".c-filter-bar__input");
         if (inp) inp.remove();
       }
       // Mode toolbar
       const modesAttr = this.getAttribute("modes");
       let modes = null;
       if (modesAttr) { try { modes = JSON.parse(modesAttr); } catch (e) { modes = modesAttr.split(",").map((s) => s.trim()); } }
       if (modes || this.hasAttribute("mode")) {
         let bar = this.querySelector(".c-filter-bar__modes");
         if (!bar) { bar = document.createElement("div"); bar.className = "c-filter-bar__modes"; bar.setAttribute("role", "toolbar"); bar.setAttribute("aria-label", label || "Filter modes"); this.appendChild(bar); }
         bar.innerHTML = "";
         const current = this.getAttribute("mode");
         const list = Array.isArray(modes) ? modes : ["draw", "erase", "select"];
         list.forEach((m) => {
           const name = typeof m === "string" ? m : (m.label || m.value || m);
           const val = typeof m === "string" ? m : (m.value || m.label || m);
           const btn = document.createElement("button");
           btn.type = "button";
           btn.className = "c-filter-bar__mode";
           btn.textContent = name;
           btn.dataset.mode = val;
           if (current && current === val) btn.setAttribute("aria-pressed", "true");
           bar.appendChild(btn);
         });
       } else {
         const bar = this.querySelector(".c-filter-bar__modes");
         if (bar) bar.remove();
       }
       // Render filter pills from items.
      Array.from(this.querySelectorAll(".c-filter-pill")).forEach((n) => n.remove());
      const items = remoteData(this, "items");
      // Slotted content: authored .c-filter-pill children take precedence.
      const authoredPills = Array.from(this.querySelectorAll(":scope > .c-filter-pill"));
      let parsed = null;
      if (authoredPills.length) {
        parsed = authoredPills.map((p) => p.textContent.trim());
        authoredPills.forEach((p) => p.remove());
      } else if (items) { try { parsed = JSON.parse(items); } catch (e) { parsed = null; } }
      if (Array.isArray(parsed)) {
        parsed.forEach((it) => {
          const pill = document.createElement("span");
          pill.className = "c-filter-pill";
          const txt = typeof it === "string" ? it : (it.label || it.value || "");
          pill.textContent = txt;
          if (typeof it === "object" && it !== null && it.removable !== false) {
            const btn = document.createElement("button");
            btn.className = "c-filter-pill__remove";
            btn.type = "button";
            btn.setAttribute("aria-label", "Remove " + txt);
            btn.textContent = "×";
            pill.appendChild(btn);
          }
          this.appendChild(pill);
        });
      }
      // Clear-all affordance (CARTO-inspired): panel-level clear with active count.
      Array.from(this.querySelectorAll(".c-filter-bar__clear-all")).forEach((n) => n.remove());
      if (this.hasAttribute("clearable")) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "c-btn c-btn--ghost c-btn--sm c-filter-bar__clear-all";
        const count = this.getAttribute("count");
        btn.textContent = count ? ("Clear all (" + count + ")") : "Clear all";
        this.appendChild(btn);
      }
      if (!parsed && !label) renderEmpty(this, "filter-bar");
    }
     enhance() {
       wireRemovable(this);
       if (this._wiredFilterBar) return;
       this._wiredFilterBar = true;
       this.addEventListener("click", (e) => {
         const btn = e.target && e.target.closest ? e.target.closest(".c-filter-bar__mode") : null;
         if (!btn || !this.contains(btn)) return;
         const mode = btn.dataset.mode || btn.textContent.trim();
         Array.from(this.querySelectorAll(".c-filter-bar__mode")).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
         this.dispatchEvent(new CustomEvent("contour:mode-change", { bubbles: true, composed: true, detail: { mode } }));
       });
       this.addEventListener("keydown", (e) => {
         const btn = e.target && e.target.closest ? e.target.closest(".c-filter-bar__mode") : null;
         if (!btn || !this.contains(btn)) return;
         const modes = Array.from(this.querySelectorAll(".c-filter-bar__mode"));
         const idx = modes.indexOf(btn);
         let next = -1;
         if (e.key === "ArrowRight") next = Math.min(modes.length - 1, idx + 1);
         else if (e.key === "ArrowLeft") next = Math.max(0, idx - 1);
         if (next >= 0) { e.preventDefault(); try { modes[next].focus(); } catch (err) {} }
         else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); btn.click(); }
       });
       // text input
       const inp = this.querySelector(".c-filter-bar__input");
       if (inp && !inp._wiredFilterInput) {
         inp._wiredFilterInput = true;
         inp.addEventListener("input", () => {
           this.dispatchEvent(new CustomEvent("contour:input", { bubbles: true, composed: true, detail: { value: inp.value } }));
         });
         inp.addEventListener("change", () => {
           this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: inp.value } }));
         });
       }
       // Clear-all (CARTO-inspired): delegated on host.
       if (!this._wiredClearAll) {
         this._wiredClearAll = true;
         this.addEventListener("click", (e) => {
           const btn = e.target && e.target.closest ? e.target.closest(".c-filter-bar__clear-all") : null;
           if (!btn || !this.contains(btn)) return;
           e.preventDefault();
           this.dispatchEvent(new CustomEvent("contour:clear-all", { bubbles: true, composed: true, detail: {} }));
         });
       }
     }
  }
  define("contour-filter-bar", ContourFilterBar);
  class ContourCommand extends ContourBase {
    static get observed() { return ["placeholder", "items", "recent", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { placeholder: { attribute: "placeholder" }, items: { attribute: "items" }, recent: { attribute: "recent" }, empty: { attribute: "empty" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-command");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Command palette");
      if (!this.hasAttribute("popover")) this.setAttribute("popover", "auto");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "command")) return;
      const placeholder = this.getAttribute("placeholder") || "Search…";
       const input = this.ensure(".c-command__input", () => { const el = document.createElement("input"); el.className = "c-command__input"; el.type = "text"; return el; });
       input.type = "text";
       input.placeholder = placeholder;
       input.setAttribute("aria-label", "Command");
       input.setAttribute("role", "combobox");
       input.setAttribute("aria-autocomplete", "list");
       input.setAttribute("aria-expanded", "true");
       const list = this.querySelector(".c-command__list");
       if (list && !list.id) list.id = contourId("c-command-list");
       if (list && list.id) input.setAttribute("aria-controls", list.id);
       const items = remoteData(this, "items");
       const list2 = this.querySelector(".c-command__list");
       const authored = list2 ? Array.from(list2.children).filter((n) => n.classList && n.classList.contains("c-command__item") || n.classList && n.classList.contains("c-command__group")) : [];
      if (items && !authored.length) {
        try {
          const parsed = JSON.parse(items);
           const l = this.ensure(".c-command__list", () => { const el = document.createElement("div"); el.className = "c-command__list"; el.setAttribute("role", "listbox"); el.id = contourId("c-command-list"); return el; });
          l.setAttribute("role", "listbox");
          l.innerHTML = "";
          const recentRaw = this.getAttribute("recent");
          if (recentRaw) {
            try {
              const recentParsed = JSON.parse(recentRaw);
              const group = document.createElement("div");
              group.className = "c-command__group";
              const gt = document.createElement("div");
              gt.className = "c-command__group-title";
              gt.textContent = "Recent";
              group.appendChild(gt);
              recentParsed.forEach((it) => {
                const item = document.createElement("div");
                item.className = "c-command__item";
                item.setAttribute("role", "option");
                const body = document.createElement("div");
                body.className = "c-command__item-body";
                const t = document.createElement("div");
                t.className = "c-command__item-title";
                t.textContent = typeof it === "string" ? it : (it.title || it.label || "");
                body.appendChild(t);
                item.appendChild(body);
                group.appendChild(item);
              });
              l.appendChild(group);
            } catch (e) { /* skip */ }
          }
          parsed.forEach((it) => {
            if (it.group) {
              const group = document.createElement("div");
              group.className = "c-command__group";
              const gt = document.createElement("div");
              gt.className = "c-command__group-title";
              gt.textContent = it.group;
              group.appendChild(gt);
              const item = document.createElement("div");
              item.className = "c-command__item";
              item.setAttribute("role", "option");
              if (it.icon) {
                const ic = document.createElement("span");
                ic.className = "c-command__item-icon";
                ic.textContent = it.icon;
                item.appendChild(ic);
              }
              const body = document.createElement("div");
              body.className = "c-command__item-body";
              if (it.title || it.label) {
                const t = document.createElement("div");
                t.className = "c-command__item-title";
                t.textContent = it.title || it.label;
                body.appendChild(t);
              }
              if (it.hint) {
                const h = document.createElement("span");
                h.className = "c-command__item-hint";
                h.textContent = it.hint;
                body.appendChild(h);
              }
              if (it.shortcut) {
                const sc = document.createElement("kbd");
                sc.className = "c-command__item-shortcut";
                sc.textContent = it.shortcut;
                item.appendChild(sc);
              }
              item.appendChild(body);
              group.appendChild(item);
              l.appendChild(group);
            } else {
              const item = document.createElement("div");
              item.className = "c-command__item";
              item.setAttribute("role", "option");
              if (it.icon) {
                const ic = document.createElement("span");
                ic.className = "c-command__item-icon";
                ic.textContent = it.icon;
                item.appendChild(ic);
              }
              const body = document.createElement("div");
              body.className = "c-command__item-body";
              if (it.title || it.label) {
                const t = document.createElement("div");
                t.className = "c-command__item-title";
                t.textContent = it.title || it.label;
                body.appendChild(t);
              }
              if (it.hint) {
                const h = document.createElement("span");
                h.className = "c-command__item-hint";
                h.textContent = it.hint;
                body.appendChild(h);
              }
              if (it.shortcut) {
                const sc = document.createElement("kbd");
                sc.className = "c-command__item-shortcut";
                sc.textContent = it.shortcut;
                item.appendChild(sc);
              }
              item.appendChild(body);
              l.appendChild(item);
            }
          });
        } catch (e) { /* keep existing */ }
      } else if (!items && list) {
        list.remove();
      }
      const empty = this.getAttribute("empty");
      if (empty) {
        const e = this.ensure(".c-command__empty", () => { const el = document.createElement("div"); el.className = "c-command__empty"; return el; });
        e.textContent = empty;
      } else {
        const e = this.querySelector(".c-command__empty");
        if (e) e.remove();
      }
      // Live filter results (BY-29). The region must exist EMPTY at mount —
      // the contrast gate refuses a pre-populated live region — and is filled
      // only when typing starts. The option ids the keydown handler writes are
      // the "keyed rows" half; this is the aria-live half.
      const status = this.ensure(".c-command__status", () => { const el = document.createElement("div"); el.className = "c-command__status"; el.setAttribute("role", "status"); return el; });
      status.textContent = "";
      if (!items && !list) {
        renderEmpty(this, "command");
      }
    }
    enhance() {
      if (this._wiredCommand) return;
      this._wiredCommand = true;
      const input = () => this.querySelector(".c-command__input");
      const items = () => Array.from(this.querySelectorAll(".c-command__item"));
      let cursor = -1;
      const mark = () => {
        items().forEach((it, i) => {
          it.classList.toggle("c-command__item--active", i === cursor);
          it.setAttribute("aria-selected", String(i === cursor));
          if (i === cursor) {
            if (!it.id) it.id = "contour-command-option-" + i;
            const inp = input();
            if (inp) inp.setAttribute("aria-activedescendant", it.id);
          }
        });
        if (cursor < 0) {
          const inp = input();
          if (inp) inp.removeAttribute("aria-activedescendant");
        }
      };
      this.addEventListener("keydown", (e) => {
        const inp = input();
        if (!inp || e.target !== inp) return;
        const its = items();
        if (!its.length) return;
        if (e.key === "ArrowDown") { e.preventDefault(); cursor = Math.min(cursor + 1, its.length - 1); mark(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); cursor = Math.max(cursor - 1, 0); mark(); }
        else if (e.key === "Home") { e.preventDefault(); cursor = 0; mark(); }
        else if (e.key === "End") { e.preventDefault(); cursor = its.length - 1; mark(); }
         else if (e.key === "Enter") {
           e.preventDefault();
           if (cursor >= 0 && its[cursor]) {
             const item = its[cursor];
             const idx = items().indexOf(item);
             this.dispatchEvent(new CustomEvent("contour:select", { detail: { index: idx, label: item.textContent.trim() }, bubbles: true, composed: true }));
           }
         } else if (e.key === "Escape") {
          if (typeof this.hidePopover === "function") this.hidePopover();
        }
      });
      this.addEventListener("click", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".c-command__item") : null;
        if (item && this.contains(item)) {
          const idx = items().indexOf(item);
          this.dispatchEvent(new CustomEvent("contour:select", { detail: { index: idx, label: item.textContent.trim() }, bubbles: true, composed: true }));
        }
      });
      // Filter (BY-29): typing narrows the option set. The region was created
      // empty at mount; only a real query fills it, so a mount announces
      // nothing. Hidden items are taken out of the cursor walk, matching the
      // tree/keydown roving: cursor is reset and aria-activedescendant cleared
      // so the next mark() cannot point at a hidden option.
      this.addEventListener("input", (e) => {
        const inp = input();
        if (!inp || e.target !== inp) return;
        const q = inp.value.trim().toLowerCase();
        const all = items();
        let visible = 0;
        all.forEach((it) => {
          const match = !q || (it.textContent || "").toLowerCase().includes(q);
          it.hidden = !match;
          if (match) visible += 1;
        });
        this.querySelectorAll(".c-command__group").forEach((g) => {
          const hasVisible = Array.from(g.querySelectorAll(".c-command__item")).some((it) => !it.hidden);
          g.hidden = !hasVisible;
        });
        cursor = -1;
        mark();
        const status = this.querySelector(".c-command__status");
        if (status) status.textContent = q ? `${visible} of ${all.length}` : "";
      });
    }
  }
define("contour-command", ContourCommand);
class ContourFooter extends ContourBase {
    static get observed() { return ["brand", "note", "links", "cols", "heading"]; }
    static get properties() { return { brand: { attribute: "brand" }, note: { attribute: "note" }, links: { attribute: "links" }, cols: { attribute: "cols" } }; }
    render() {
      this.classList.add("c-footer");
      const brand = this.getAttribute("brand");
      if (brand) {
        const b = this.ensure(".c-footer__brand", () => { const el = document.createElement("div"); el.className = "c-footer__brand"; return el; });
        b.textContent = brand;
      } else {
        const b = this.querySelector(".c-footer__brand");
        if (b) b.remove();
      }
      const note = this.getAttribute("note");
      if (note) {
        const n = this.ensure(".c-footer__note", () => { const el = document.createElement("p"); el.className = "c-footer__note"; return el; });
        n.textContent = note;
      } else {
        const n = this.querySelector(".c-footer__note");
        if (n) n.remove();
      }
      const links = this.getAttribute("links");
      if (links) {
        try {
          const parsed = JSON.parse(links);
          const wrap = this.ensure(".c-footer__links", () => { const el = document.createElement("div"); el.className = "c-footer__links"; return el; });
          wrap.innerHTML = "";
          parsed.forEach((l) => {
            const a = document.createElement("a");
            a.href = typeof l === "string" ? "#" : (l.href || "#");
            a.textContent = typeof l === "string" ? l : (l.label || l);
            wrap.appendChild(a);
          });
        } catch (e) { /* keep existing */ }
      } else {
        const w = this.querySelector(".c-footer__links");
        if (w) w.remove();
      }
      const cols = this.getAttribute("cols");
      if (cols) {
        try {
          const parsed = JSON.parse(cols);
          // Remove previous cols
          this.querySelectorAll(".c-footer__col").forEach((c) => c.remove());
          parsed.forEach((col) => {
            const c = document.createElement("div");
            c.className = "c-footer__col";
            if (col.title) {
              const h = document.createElement(headingTag(this, "h3"));
              h.textContent = col.title;
              c.appendChild(h);
            }
            (col.links || []).forEach((l) => {
              const a = document.createElement("a");
              a.href = typeof l === "string" ? "#" : (l.href || "#");
              a.textContent = typeof l === "string" ? l : (l.label || l);
              c.appendChild(a);
            });
            this.appendChild(c);
          });
        } catch (e) { /* keep existing */ }
      } else {
        this.querySelectorAll(".c-footer__col").forEach((c) => c.remove());
      }
    }
  }
  define("contour-footer", ContourFooter);
class ContourSchemeToggle extends ContourBase {
    static get observed() { return []; }
    render() { this.classList.add("c-scheme-toggle"); }
    enhance() {
      if (this._wiredScheme) return;
      this._wiredScheme = true;
      this.addEventListener("click", () => {
        const root = document.documentElement;
        root.classList.add("is-theme-switching");
        const current = root.getAttribute("data-theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        const next = current === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem("contour-theme", next); } catch (e) {}
        requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("is-theme-switching")));
        this.dispatchEvent(new CustomEvent("contour:theme-change", { detail: { theme: next }, bubbles: true, composed: true }));
      });
      // restore persisted theme on connect
      try {
        const stored = localStorage.getItem("contour-theme");
        if (stored) document.documentElement.setAttribute("data-theme", stored);
      } catch (e) {}
    }
  }
  define("contour-scheme-toggle", ContourSchemeToggle);
class ContourSidebar extends ContourBase {
    static get observed() { return ["title", "items", "collapsed"]; }
    static get properties() { return { title: { attribute: "title" }, items: { attribute: "items" }, collapsed: { attribute: "collapsed", type: Boolean } }; }
    render() {
      this.classList.add("c-sidebar");
      if (this.hasAttribute("collapsed")) this.classList.add("c-sidebar--collapsed"); else this.classList.remove("c-sidebar--collapsed");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-sidebar__title", () => { const el = document.createElement("div"); el.className = "c-sidebar__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-sidebar__title");
        if (t) t.remove();
      }
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const nav = this.ensure("nav.c-sidebar__nav", () => { const el = document.createElement("nav"); el.className = "c-sidebar__nav"; return el; });
          nav.innerHTML = "";
          parsed.forEach((it) => {
            const a = document.createElement("a");
            a.className = "c-sidebar__link";
            a.href = (it && it.href) || "#";
            a.textContent = (it && (it.label || it)) || "";
            nav.appendChild(a);
          });
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredSidebar) return;
      this._wiredSidebar = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-sidebar__toggle") : null;
        if (!btn || !this.contains(btn)) return;
        this.toggleAttribute("collapsed");
      });
    }
  }
  define("contour-sidebar", ContourSidebar);
class ContourToolbar extends ContourBase {
    static get observed() { return ["title", "actions", "overflow"]; }
    static get properties() { return { title: { attribute: "title" }, actions: { attribute: "actions" }, overflow: { attribute: "overflow", type: Number } }; }
    render() {
      this.classList.add("c-toolbar");
      const title = this.getAttribute("title");
      this.setAttribute("role", "toolbar");
      if (title) this.setAttribute("aria-label", title);
      const actions = this.getAttribute("actions");
      if (actions) {
        try {
          const parsed = JSON.parse(actions);
          const limit = this.overflow && this.overflow > 0 ? this.overflow : parsed.length;
          const visible = parsed.slice(0, limit);
          const excess = parsed.slice(limit);
          visible.forEach((a) => {
            const btn = document.createElement("button");
            btn.className = "c-toolbar__btn";
            btn.type = "button";
            btn.textContent = typeof a === "string" ? a : (a.label || a);
            this.appendChild(btn);
          });
          if (excess.length) {
            const wrap = document.createElement("div");
            wrap.className = "c-toolbar__overflow";
            const btn = document.createElement("button");
            btn.className = "c-toolbar__btn c-toolbar__overflow-btn";
            btn.type = "button";
            btn.setAttribute("aria-haspopup", "menu");
            btn.setAttribute("aria-expanded", "false");
            btn.textContent = "…";
            wrap.appendChild(btn);
            const menu = document.createElement("div");
            menu.className = "c-toolbar__overflow-menu";
            menu.setAttribute("role", "menu");
            menu.setAttribute("hidden", "");
            excess.forEach((a) => {
              const mbtn = document.createElement("button");
              mbtn.className = "c-toolbar__btn";
              mbtn.type = "button";
              mbtn.setAttribute("role", "menuitem");
              mbtn.textContent = typeof a === "string" ? a : (a.label || a);
              menu.appendChild(mbtn);
            });
            wrap.appendChild(menu);
            this.appendChild(wrap);
          }
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredToolbar) return;
      this._wiredToolbar = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-toolbar__overflow-btn") : null;
        if (!btn || !this.contains(btn)) return;
        const menu = btn.parentElement && btn.parentElement.querySelector(".c-toolbar__overflow-menu");
        if (!menu) return;
        const open = menu.hasAttribute("hidden");
        if (open) menu.removeAttribute("hidden"); else menu.setAttribute("hidden", "");
        btn.setAttribute("aria-expanded", String(open));
      });
    }
  }
  define("contour-toolbar", ContourToolbar);

/**
 * Spatial filter (CARTO-inspired): draw-on-map affordance. Engine-agnostic:
 * Contour renders the mode toolbar and emits `contour:draw-start`/`contour:draw-end`
 * (with a geometry payload) and `contour:clear`; the consumer runs the spatial
 * query against its map engine.
 * Attributes: `modes`, `mode`, `active`, `empty`, `loading`, `error`, `retry`,
 * `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourSpatialFilter extends ContourBase {
    static get observed() { return ["modes", "mode", "active", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { modes: { attribute: "modes" }, mode: { attribute: "mode" }, active: { attribute: "active" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-spatial-filter");
      wireStates(this);
      loadRemote(this, []);
      if (renderStates(this, "spatial-filter")) return;
      const modesAttr = this.getAttribute("modes");
      let modes = null;
      if (modesAttr) { try { modes = JSON.parse(modesAttr); } catch (e) { modes = modesAttr.split(",").map((s) => s.trim()); } }
      const list = Array.isArray(modes) ? modes : ["rect", "circle", "polygon", "clear"];
      let bar = this.querySelector(".c-spatial-filter__modes");
      if (!bar) { bar = document.createElement("div"); bar.className = "c-spatial-filter__modes"; bar.setAttribute("role", "toolbar"); this.appendChild(bar); }
      bar.innerHTML = "";
      const current = this.getAttribute("mode");
      list.forEach((m) => {
        const name = typeof m === "string" ? m : (m.label || m.value || m);
        const val = typeof m === "string" ? m : (m.value || m.label || m);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "c-spatial-filter__mode c-btn c-btn--ghost c-btn--sm";
        btn.textContent = name;
        btn.dataset.mode = val;
        if (current && current === val) btn.setAttribute("aria-pressed", "true");
        bar.appendChild(btn);
      });
      if (this.hasAttribute("active")) {
        this.classList.add("c-spatial-filter--active");
      } else {
        this.classList.remove("c-spatial-filter--active");
      }
    }
    enhance() {
      if (this._wiredSpatialFilter) return;
      this._wiredSpatialFilter = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-spatial-filter__mode") : null;
        if (!btn || !this.contains(btn)) return;
        const mode = btn.dataset.mode || btn.textContent.trim();
        if (mode === "clear") {
          this.classList.remove("c-spatial-filter--active");
          Array.from(this.querySelectorAll(".c-spatial-filter__mode")).forEach((b) => b.setAttribute("aria-pressed", "false"));
          this.dispatchEvent(new CustomEvent("contour:clear", { bubbles: true, composed: true, detail: {} }));
          return;
        }
        this.classList.add("c-spatial-filter--active");
        Array.from(this.querySelectorAll(".c-spatial-filter__mode")).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        this.dispatchEvent(new CustomEvent("contour:draw-start", { bubbles: true, composed: true, detail: { mode } }));
      });
      this.addEventListener("keydown", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-spatial-filter__mode") : null;
        if (!btn || !this.contains(btn)) return;
        const modes = Array.from(this.querySelectorAll(".c-spatial-filter__mode"));
        const idx = modes.indexOf(btn);
        let next = -1;
        if (e.key === "ArrowRight") next = Math.min(modes.length - 1, idx + 1);
        else if (e.key === "ArrowLeft") next = Math.max(0, idx - 1);
        if (next >= 0) { e.preventDefault(); try { modes[next].focus(); } catch (err) {} }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); btn.click(); }
      });
    }
  }
  define("contour-spatial-filter", ContourSpatialFilter);



/**
 * Avatar: a circular avatar with initials (from `name`) or an image (`src`),
 * optional size/variant modifiers and a status dot. Attributes: `name`, `size`,
 * `variant`, `src`, `status`.
 */
class ContourAvatar extends ContourBase {
    static get observed() { return ["name", "size", "variant", "src", "status"]; }
    static get properties() { return { name: { attribute: "name" }, size: { attribute: "size" }, variant: { attribute: "variant" }, src: { attribute: "src" }, status: { attribute: "status" } }; }
    render() {
      this.classList.add("c-avatar");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-avatar--")) this.classList.remove(c); });
      const name = this.getAttribute("name");
      const size = this.getAttribute("size");
      if (size) this.classList.add("c-avatar--" + size);
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-avatar--" + variant);
      // Drop previously generated img/status so re-render doesn't stack.
      const oldImg = this.querySelector("img.c-avatar__img");
      if (oldImg) oldImg.remove();
      const oldDot = this.querySelector(".c-avatar__status");
      if (oldDot) oldDot.remove();
      const src = this.getAttribute("src");
      if (src) {
        this.textContent = "";
        const img = document.createElement("img");
        img.className = "c-avatar__img";
        img.src = src;
        img.alt = name || "";
        this.appendChild(img);
      } else if (name) {
        const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
        // Keep initials as text only when no img.
        if (!this.querySelector("img.c-avatar__img")) {
          // Remove any stray text nodes? Keep simple: set textContent if no img.
        }
        this.textContent = initials;
      }
      const status = this.getAttribute("status");
      if (status) {
        const dot = document.createElement("span");
        dot.className = "c-avatar__status c-avatar__status--" + status;
        dot.setAttribute("aria-hidden", "true");
        this.appendChild(dot);
      }
    }
  }
  define("contour-avatar", ContourAvatar);
/**
 * Badge: a small status label with variant/size modifiers and an optional
 * removable (×) button. Attributes: `variant`, `label`, `size`, `removable`.
 */
class ContourBadgeFull extends ContourBase {
    static get observed() { return ["variant", "label", "size", "removable"]; }
    static get properties() { return { variant: { attribute: "variant" }, label: { attribute: "label" }, size: { attribute: "size" }, removable: { attribute: "removable", type: Boolean } }; }
    render() {
      this.classList.add("c-badge");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-badge--")) this.classList.remove(c); });
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-badge--" + variant);
      const size = this.getAttribute("size");
      if (size) this.classList.add("c-badge--" + size);
      const label = this.getAttribute("label");
      if (label) {
        // Preserve remove button if present.
        let textNode = null;
        for (const n of this.childNodes) { if (n.nodeType === 3) { textNode = n; break; } }
        if (textNode) textNode.nodeValue = label;
        else this.insertBefore(document.createTextNode(label), this.firstChild);
      }
      if (this.hasAttribute("removable")) {
        this.ensure(".c-badge__remove", () => {
          const btn = document.createElement("button");
          btn.className = "c-badge__remove";
          btn.type = "button";
          btn.setAttribute("aria-label", "Remove");
          btn.textContent = "×";
          return btn;
        });
      } else {
        const btn = this.querySelector(".c-badge__remove");
        if (btn) btn.remove();
      }
    }
    enhance() {
      wireRemovable(this);
    }
  }
  define("contour-badge", ContourBadgeFull);
/**
 * Chip: a compact status pill with `key`/`value` text and a variant modifier.
 * Attributes: `variant`, `key`, `value`.
 */
class ContourChipFull extends ContourBase {
    static get observed() { return ["variant", "key", "value"]; }
    static get properties() { return { variant: { attribute: "variant" }, key: { attribute: "key" }, value: { attribute: "value" } }; }
    render() {
      this.classList.add("c-chip");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-chip--")) this.classList.remove(c); });
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-chip--" + variant);
      const key = this.getAttribute("key");
      const value = this.getAttribute("value");
      if (key) {
        const k = this.ensure(".c-chip__key", () => { const el = document.createElement("span"); el.className = "c-chip__key"; return el; });
        k.textContent = key;
      } else {
        const k = this.querySelector(".c-chip__key");
        if (k) k.remove();
      }
      if (value) {
        const v = this.ensure(".c-chip__value", () => { const el = document.createElement("span"); el.className = "c-chip__value"; return el; });
        v.textContent = value;
      } else {
        const v = this.querySelector(".c-chip__value");
        if (v) v.remove();
      }
    }
  }
  define("contour-chip", ContourChipFull);
/**
 * Tag: a removable status label with a variant modifier. Attributes: `label`,
 * `removable`, `variant`.
 */
class ContourTag extends ContourBase {
    static get observed() { return ["label", "removable", "variant"]; }
    static get properties() { return { label: { attribute: "label" }, removable: { attribute: "removable", type: Boolean }, variant: { attribute: "variant" } }; }
    render() {
      this.classList.add("c-tag");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-tag--")) this.classList.remove(c); });
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-tag--" + variant);
      const label = this.getAttribute("label");
      if (label) {
        // Update the text node without clobbering the remove button.
        let textNode = null;
        for (const n of this.childNodes) {
          if (n.nodeType === 3) { textNode = n; break; }
        }
        if (textNode) textNode.nodeValue = label + " ";
        else this.insertBefore(document.createTextNode(label + " "), this.firstChild);
      }
      if (this.hasAttribute("removable")) {
        this.ensure(".c-tag__remove", () => {
          const btn = document.createElement("button");
          btn.className = "c-tag__remove";
          btn.type = "button";
          btn.setAttribute("aria-label", "Remove");
          btn.textContent = "×";
          return btn;
        });
      } else {
        const btn = this.querySelector(".c-tag__remove");
        if (btn) btn.remove();
      }
    }
    enhance() {
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
      wireRemovable(this);
    }
  }
  define("contour-tag", ContourTag);
/**
 * Dot: a small status indicator with variant and live states. Attributes:
 * `variant`, `live`.
 */
class ContourDot extends ContourBase {
    static get observed() { return ["variant", "live"]; }
    static get properties() { return { variant: { attribute: "variant" }, live: { attribute: "live", type: Boolean } }; }
    render() {
      this.classList.add("c-dot");
      if (!this.hasAttribute("role")) this.setAttribute("role", "img");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "status indicator");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-dot--")) this.classList.remove(c); });
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-dot--" + variant);
      if (this.hasAttribute("live")) this.classList.add("c-dot--live"); else this.classList.remove("c-dot--live");
    }
  }
  define("contour-dot", ContourDot);
/**
 * Pill: a rounded status label with live state and variant modifier.
 * Attributes: `label`, `live`, `variant`.
 */
class ContourPill extends ContourBase {
    static get observed() { return ["label", "live", "variant"]; }
    static get properties() { return { label: { attribute: "label" }, live: { attribute: "live", type: Boolean }, variant: { attribute: "variant" } }; }
    render() {
      this.classList.add("c-pill");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-pill--")) this.classList.remove(c); });
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-pill--" + variant);
      const label = this.getAttribute("label");
      if (label) {
        this.textContent = label;
      }
      if (this.hasAttribute("live")) this.classList.add("c-pill--live"); else this.classList.remove("c-pill--live");
    }
  }
  define("contour-pill", ContourPill);
/**
 * Kbd: a keyboard key display. Attribute: `key`.
 */
class ContourKbd extends ContourBase {
    static get observed() { return ["key"]; }
    static get properties() { return { key: { attribute: "key" } }; }
    render() {
      this.classList.add("c-kbd");
      const key = this.getAttribute("key");
      if (key) {
        this.textContent = key;
      }
    }
  }
  define("contour-kbd", ContourKbd);
/**
 * Spinner: a loading indicator with size modifier. Attribute: `size`.
 */
class ContourSpinner extends ContourBase {
    static get observed() { return ["size"]; }
    static get properties() { return { size: { attribute: "size" } }; }
    render() {
      this.classList.add("c-spinner");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-spinner--")) this.classList.remove(c); });
      const size = this.getAttribute("size");
      if (size) this.classList.add("c-spinner--" + size);
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Loading");
    }
  }
  define("contour-spinner", ContourSpinner);
/**
 * Skeleton: a loading placeholder with size and shimmer options. Attributes:
 * `size`, `shimmer`.
 */
class ContourSkeleton extends ContourBase {
    static get observed() { return ["size", "shimmer"]; }
    static get properties() { return { size: { attribute: "size" }, shimmer: { attribute: "shimmer", type: Boolean } }; }
    render() {
      this.classList.add("c-skeleton");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-skeleton--")) this.classList.remove(c); });
      const size = this.getAttribute("size");
      if (size) this.classList.add("c-skeleton--" + size);
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Loading");
      if (!this.hasAttribute("aria-busy")) this.setAttribute("aria-busy", "true");
      if (!this.hasAttribute("aria-hidden")) this.setAttribute("aria-hidden", "true");
      const shimmer = this.getAttribute("shimmer");
      if (shimmer === "false" || shimmer === "off") this.classList.add("c-skeleton--static");
      else this.classList.remove("c-skeleton--static");
    }
  }
  define("contour-skeleton", ContourSkeleton);
/**
 * Tooltip: a popover-triggered tooltip with anchor association, delay, and
 * viewport flip. Attributes: `text`, `anchor`, `delay`, `trigger`.
 */
class ContourTooltip extends ContourBase {
    static get observed() { return ["text", "anchor", "delay", "trigger"]; }
    static get properties() { return { text: { attribute: "text" }, anchor: { attribute: "anchor" }, delay: { attribute: "delay", type: Number }, trigger: { attribute: "trigger" } }; }
    render() {
      this.classList.add("c-tooltip");
      if (!this.hasAttribute("popover")) this.setAttribute("popover", "auto");
      if (!this.hasAttribute("role")) this.setAttribute("role", "tooltip");
      if (!this.id) this.id = contourId("tip");
      const text = this.getAttribute("text");
      if (text !== null && !this.hasChildNodes()) {
        this.textContent = text;
      }
    }
    enhance() {
      if (this._wiredTooltip) return;
      this._wiredTooltip = true;
      // Anchor association: link a trigger element to this tooltip.
      const anchorSel = this.getAttribute("anchor");
      if (anchorSel) {
        let trigger = null;
        if (anchorSel.startsWith("#")) {
          trigger = document.getElementById(anchorSel.slice(1));
        } else {
          trigger = document.querySelector(anchorSel);
        }
        if (trigger) {
          trigger.setAttribute("popovertarget", this.id || (this.id = contourId("tip")));
          trigger.setAttribute("aria-describedby", this.id);
        }
      }
      const delayMs = (this.delay && this.delay > 0) ? this.delay : 0;
      let showTimer = null;
      const hasPopover = typeof this.showPopover === "function";
      const show = () => {
        if (showTimer) clearTimeout(showTimer);
        if (delayMs > 0) showTimer = setTimeout(() => {
          if (hasPopover) { try { this.showPopover(); } catch (e) {} }
          else this.classList.add("is-open");
          try { requestAnimationFrame(flipIfNeeded); } catch (e) { flipIfNeeded(); }
        }, delayMs);
        else {
          if (hasPopover) { try { this.showPopover(); } catch (e) {} }
          else this.classList.add("is-open");
          try { requestAnimationFrame(flipIfNeeded); } catch (e) { flipIfNeeded(); }
        }
      };
      const hide = () => {
        if (showTimer) { clearTimeout(showTimer); showTimer = null; }
        if (hasPopover) { try { this.hidePopover(); } catch (e) {} }
        else this.classList.remove("is-open");
      };
      const triggerMode = this.getAttribute("trigger") || "hover";
      const trigger = anchorSel ? (anchorSel.startsWith("#") ? document.getElementById(anchorSel.slice(1)) : document.querySelector(anchorSel)) : null;
       const target = trigger || this;
       const onEnter = () => { if (triggerMode !== "click") show(); };
       const onLeave = () => { if (triggerMode !== "click") hide(); };
       const onFocus = () => { if (triggerMode !== "click") show(); };
       const onBlur = () => { if (triggerMode !== "click") hide(); };
       const onClick = () => {
         if (triggerMode === "click" || triggerMode === "hover") {
           if (this.matches(":popover-open")) hide(); else show();
         }
       };
       const onTouchStart = () => { if (triggerMode !== "click") show(); };
       const onTouchEnd = () => { if (triggerMode !== "click") { setTimeout(hide, 1500); } };
       target.addEventListener("mouseenter", onEnter);
       target.addEventListener("mouseleave", onLeave);
       target.addEventListener("focus", onFocus);
       target.addEventListener("blur", onBlur);
       target.addEventListener("click", onClick);
       target.addEventListener("touchstart", onTouchStart, { passive: true });
       target.addEventListener("touchend", onTouchEnd, { passive: true });
       // Placement flip: if the tooltip would overflow the viewport, flip it.
       const flipIfNeeded = () => {
         try {
           const r = this.getBoundingClientRect();
           if (r.right > window.innerWidth) this.classList.add("c-tooltip--flip-x");
           else this.classList.remove("c-tooltip--flip-x");
           if (r.bottom > window.innerHeight) this.classList.add("c-tooltip--flip-y");
           else this.classList.remove("c-tooltip--flip-y");
         } catch (e) {}
       };
       const origShow = show;
       // wrap show to flip after display
       onDispose(this, () => {
         target.removeEventListener("mouseenter", onEnter);
         target.removeEventListener("mouseleave", onLeave);
         target.removeEventListener("focus", onFocus);
         target.removeEventListener("blur", onBlur);
         target.removeEventListener("click", onClick);
         target.removeEventListener("touchstart", onTouchStart);
         target.removeEventListener("touchend", onTouchEnd);
         if (showTimer) clearTimeout(showTimer);
       });
      this.addEventListener("toggle", (e) => {
        const t = e.target;
        if (t && t === this) {
          this.dispatchEvent(new CustomEvent("contour:toggle", { detail: { open: this.matches(":popover-open") }, bubbles: true, composed: true }));
        }
      });
      this.addEventListener("beforetoggle", (e) => {
        this.dispatchEvent(new CustomEvent(e.newState === "open" ? "contour:show" : "contour:hide", { bubbles: true, composed: true }));
      });
    }
  }
  define("contour-tooltip", ContourTooltip);
/**
 * Progress: a determinate or indeterminate progress bar with value, min/max,
 * paused and pausable states. Attributes: `value`, `label`, `min`, `max`,
 * `paused`, `pausable`.
 */
class ContourProgress extends ContourBase {
    static get observed() { return ["value", "label", "min", "max", "paused", "pausable"]; }
    static get properties() { return { value: { attribute: "value" }, label: { attribute: "label" }, min: { attribute: "min" }, max: { attribute: "max" }, paused: { attribute: "paused", type: Boolean }, pausable: { attribute: "pausable", type: Boolean } }; }
    render() {
      this.classList.add("c-progress");
      const value = this.getAttribute("value");
      // The normalised percentage is read by the ARIA block below, which runs
      // after this branch. Declaring it inside the `else` made `String(pct)` a
      // ReferenceError: the bar built its node, set its role, and then died
      // before announcing anything, so a determinate progressbar reached a
      // screen reader with no value at all.
      if (value === null) {
        // Indeterminate bar: no fill, no value announced.
        this.style.removeProperty("--progress");
        if (this.getAttribute("aria-valuenow") === this._progressAriaValue) {
          this.removeAttribute("aria-valuenow");
        }
        this._progressAriaValue = null;
      } else {
        const num = Number(value);
        // Accept both 0-1 (fraction) and 0-100 (percentage). A value <= 1
        // without a decimal point is treated as a percentage (e.g. "50" → 50%).
        // A value <= 1 with a decimal point is treated as a fraction (e.g. "0.5" → 50%).
        const pct = Number.isFinite(num) ? (num <= 1 && value.includes(".") ? num * 100 : num) : 0;
        const pctStr = Math.max(0, Math.min(100, pct)) + "%";
        this.style.setProperty("--progress", pctStr);
        const prevVal = this._progressAriaValue;
        if (!this.hasAttribute("aria-valuenow") || this.getAttribute("aria-valuenow") === prevVal) {
          this.setAttribute("aria-valuenow", String(pct));
          this._progressAriaValue = String(pct);
        }
      }
      this.ensure(".c-progress__bar", () => { const el = document.createElement("span"); el.className = "c-progress__bar"; return el; });
       if (!this.hasAttribute("role")) this.setAttribute("role", "progressbar");
       const label = this.getAttribute("label");
       if (label && !this.hasAttribute("aria-label")) this.setAttribute("aria-label", label);
      const min = this.getAttribute("min");
      const max = this.getAttribute("max");
      if (min !== null) this.setAttribute("aria-valuemin", min);
      else if (!this.hasAttribute("aria-valuemin")) this.setAttribute("aria-valuemin", "0");
      if (max !== null) this.setAttribute("aria-valuemax", max);
      else if (!this.hasAttribute("aria-valuemax")) this.setAttribute("aria-valuemax", "100");
      if (this.hasAttribute("paused")) this.classList.add("c-progress--paused");
      else Array.from(this.classList).forEach((c) => { if (c === "c-progress--paused") this.classList.remove(c); });
      if (this.hasAttribute("pausable")) {
        this.ensure(".c-progress__pause", () => {
          const btn = document.createElement("button");
          btn.className = "c-progress__pause";
          btn.type = "button";
          btn.setAttribute("aria-label", "Pause");
          btn.textContent = "⏸";
          return btn;
        });
      } else {
        const btn = this.querySelector(".c-progress__pause");
        if (btn) btn.remove();
      }
    }
  }
  define("contour-progress", ContourProgress);
/**
 * Mark: a highlighted text marker. No attributes.
 */
class ContourMark extends ContourBase {
    render() {
      this.classList.add("c-mark");
    }
  }
  define("contour-mark", ContourMark);
/**
 * Loading: a spinner wrapped in a container. No attributes.
 */
class ContourLoading extends ContourBase {
    render() {
      this.classList.add("c-loading");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-live")) this.setAttribute("aria-live", "polite");
      this.ensure(".c-spinner", () => { const el = document.createElement("span"); el.className = "c-spinner"; el.setAttribute("aria-hidden", "true"); return el; });
    }
  }
  define("contour-loading", ContourLoading);
/**
 * Elevation: a single step of the elevation ramp (`.c-elevation` carries
 * `--shadow-md`). Raises the surface it is given. No attributes.
 */
class ContourElevation extends ContourBase {
    render() {
      // The block is one step of the ramp, not the ramp: .c-elevation carries
      // --shadow-md and nothing else, so this element raises the surface it is
      // given and stops there. The rule has existed since 00e0494 — an earlier
      // note here claimed it did not and dropped the class rather than invent
      // one, which left a shipped rule with no emitter in either layer.
      this.classList.add("c-elevation");
    }
  }
  define("contour-elevation", ContourElevation);
/**
 * VersionBanner: a dismissible info banner with message, link and href.
 * Attributes: `message`, `link`, `href`, `dismissible`.
 */
class ContourVersionBannerFull extends ContourBase {
    static get observed() { return ["message", "link", "href", "dismissible"]; }
    static get properties() { return { message: { attribute: "message" }, link: { attribute: "link" }, href: { attribute: "href" }, dismissible: { attribute: "dismissible", type: Boolean } }; }
    render() {
      this.classList.add("c-version-banner");
      Array.from(this.children).forEach((n) => n.remove());
      const message = this.getAttribute("message");
      if (message) {
        const icon = document.createElement("svg");
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = '<use href="#i-info" />';
        this.appendChild(icon);
        const span = document.createElement("span");
        span.textContent = message;
        this.appendChild(span);
      }
      const link = this.getAttribute("link");
      const href = this.getAttribute("href");
      if (link && href) {
        const a = document.createElement("a");
        a.className = "c-version-banner__link";
        a.href = href;
        a.textContent = link;
        this.appendChild(a);
      }
      if (this.hasAttribute("dismissible")) {
        const btn = document.createElement("button");
        btn.className = "c-version-banner__dismiss";
        btn.type = "button";
        btn.setAttribute("aria-label", "Dismiss");
        btn.textContent = "×";
        this.appendChild(btn);
      }
    }
    enhance() {
      if (this._wiredVersionBanner) return;
      this._wiredVersionBanner = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-version-banner__dismiss") : null;
        if (btn && this.contains(btn)) {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
          this.remove();
        }
      });
    }
  }
  define("contour-version-banner", ContourVersionBannerFull);
/**
 * Banner: a simple message banner with a variant modifier. Attributes:
 * `message`, `variant`.
 */
class ContourBanner extends ContourBase {
    static get observed() { return ["message", "variant"]; }
    static get properties() { return { message: { attribute: "message" }, variant: { attribute: "variant" } }; }
    render() {
      this.classList.add("c-banner");
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-banner--" + variant);
      const message = this.getAttribute("message");
      if (message) {
        const span = this.ensure(".c-banner__message", () => { const el = document.createElement("span"); el.className = "c-banner__message"; return el; });
        span.textContent = message;
      }
    }
  }
  define("contour-banner", ContourBanner);
/**
 * FilterPill: a key/value filter chip with an optional remove button.
 * Attributes: `key`, `value`, `removable`.
 */
class ContourFilterPill extends ContourBase {
    static get observed() { return ["key", "value", "removable"]; }
    static get properties() { return { key: { attribute: "key" }, value: { attribute: "value" }, removable: { attribute: "removable", type: Boolean } }; }
    render() {
      this.classList.add("c-filter-pill");
      const key = this.getAttribute("key");
      const value = this.getAttribute("value");
      if (key) {
        const k = this.ensure(".c-filter-pill__key", () => { const el = document.createElement("span"); el.className = "c-filter-pill__key"; return el; });
        k.textContent = key;
      } else {
        const k = this.querySelector(".c-filter-pill__key");
        if (k) k.remove();
      }
      if (value) {
        const v = this.ensure(".c-filter-pill__value", () => { const el = document.createElement("span"); el.className = "c-filter-pill__value"; return el; });
        v.textContent = value;
      } else {
        const v = this.querySelector(".c-filter-pill__value");
        if (v) v.remove();
      }
      if (this.hasAttribute("removable")) {
        this.ensure(".c-filter-pill__remove", () => {
          const btn = document.createElement("button");
          btn.className = "c-filter-pill__remove";
          btn.type = "button";
          btn.setAttribute("aria-label", "Remove filter");
          btn.textContent = "×";
          return btn;
        });
      } else {
        const btn = this.querySelector(".c-filter-pill__remove");
        if (btn) btn.remove();
      }
    }
    enhance() {
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
      wireRemovable(this);
    }
  }
  define("contour-filter-pill", ContourFilterPill);
/**
 * Datamark: a data value display with optional unit and label. Attributes:
 * `value`, `unit`, `label`.
 */
class ContourDatamark extends ContourBase {
    static get observed() { return ["value", "unit", "label"]; }
    static get properties() { return { value: { attribute: "value" }, unit: { attribute: "unit" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-datamark");
      // The guide sets `value` on this element (`<contour-datamark value="42">`),
      // and the block's own specimen is the number with an optional unit — reading
      // only `label` meant the published specimen rendered an empty box.
      const value = this.getAttribute("value");
      const unit = this.getAttribute("unit");
      const label = this.getAttribute("label");
      const text = value || label;
      if (text) {
        this.textContent = text;
        if (unit) {
          const u = document.createElement("span");
          u.className = "u-subtle";
          u.textContent = " " + unit;
          this.appendChild(u);
        }
      }
    }
  }
  define("contour-datamark", ContourDatamark);
/**
 * DestructiveHint: a text hint for destructive actions. Attribute: `text`.
 */
class ContourDestructiveHint extends ContourBase {
    static get observed() { return ["text"]; }
    static get properties() { return { text: { attribute: "text" } }; }
    render() {
      this.classList.add("c-destructive-hint");
      const text = this.getAttribute("text");
      if (text) this.textContent = text;
    }
  }
  define("contour-destructive-hint", ContourDestructiveHint);
/**
 * IconBadge: an icon from the sprite (i-* convention) with a warning if the
 * name doesn't match. Attribute: `icon`.
 */
class ContourIconBadge extends ContourBase {
    static get observed() { return ["icon"]; }
    static get properties() { return { icon: { attribute: "icon" } }; }
    render() {
      this.classList.add("c-icon-badge");
      const icon = this.getAttribute("icon");
      if (icon) {
        const sanitized = String(icon).replace(/[^a-zA-Z0-9_-]/g, "");
        if (sanitized && !sanitized.startsWith("i-")) {
          // Warn if icon name doesn't follow the i-* convention.
          if (typeof console !== "undefined" && console.warn) {
            console.warn("ContourIconBadge: icon '" + icon + "' may not exist in the sprite (expected i-* name).");
          }
        }
        const existing = this.querySelector("svg");
        const svg = existing || document.createElementNS("http://www.w3.org/2000/svg", "svg");
        if (!existing) {
          svg.setAttribute("aria-hidden", "true");
          const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
          use.setAttribute("href", "#" + sanitized);
          svg.appendChild(use);
          this.appendChild(svg);
        } else {
          const use = svg.querySelector("use");
          if (use) use.setAttribute("href", "#" + sanitized);
        }
      } else {
        const svg = this.querySelector("svg");
        if (svg) svg.remove();
      }
    }
  }
  define("contour-icon-badge", ContourIconBadge);
/**
 * LiveBadge: a connection status badge with state/live modifiers and label.
 * Attributes: `label`, `state`, `live`.
 */
class ContourLiveBadge extends ContourBase {
    static get observed() { return ["label", "state", "live"]; }
    static get properties() { return { label: { attribute: "label" }, state: { attribute: "state" }, live: { attribute: "live", type: Boolean } }; }
    render() {
      this.classList.add("c-live-badge");
      // Remove previous state modifiers.
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-live-badge--")) this.classList.remove(c); });
      const state = this.getAttribute("state");
      if (state) {
        this.classList.add("c-live-badge--" + state);
      } else if (this.hasAttribute("live")) {
        this.classList.add("c-live-badge--connected");
      }
      const label = this.getAttribute("label");
      if (label && !this.hasChildNodes()) this.textContent = label;
    }
  }
  define("contour-live-badge", ContourLiveBadge);

/**
 * SkeletonGroup: a group of N skeleton placeholders. Attribute: `count`.
 */
class ContourSkeletonGroup extends ContourBase {
    static get observed() { return ["count"]; }
    static get properties() { return { count: { attribute: "count", type: Number } }; }
    render() {
      this.classList.add("c-skeleton-group");
      const count = Math.max(1, parseInt(this.getAttribute("count") || "3", 10) || 3);
      Array.from(this.querySelectorAll(".c-skeleton")).forEach((n) => n.remove());
      for (let i = 0; i < count; i++) {
        const sk = document.createElement("div");
        sk.className = "c-skeleton";
        this.appendChild(sk);
      }
    }
  }
  define("contour-skeleton-group", ContourSkeletonGroup);

/**
 * MapPopup: a map popup dialog with title, content, and optional cluster
 * badge (cluster-count / cluster-expanded). Attributes: `title`, `content`,
 * `cluster-count`, `cluster-expanded`.
 */
class ContourMapPopup extends ContourBase {
  static get observed() { return ["title", "content", "cluster-count", "cluster-expanded", "cluster-items"]; }
  static get properties() { return { title: { attribute: "title" }, content: { attribute: "content" }, "cluster-count": { attribute: "cluster-count", type: Number }, "cluster-expanded": { attribute: "cluster-expanded", type: Boolean }, "cluster-items": { attribute: "cluster-items" } }; }
    render() {
      this.classList.add("c-map-popup");
      this.setAttribute("role", "dialog");
      if (!this.hasAttribute("popover")) this.setAttribute("popover", "auto");
      if (!this.id) this.id = contourId("map-popup");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-map-popup__title", () => { const el = document.createElement("div"); el.className = "c-map-popup__title"; return el; });
        t.textContent = title;
      }
      const content = this.getAttribute("content");
      if (content) {
        const c = this.ensure(".c-map-popup__body", () => { const el = document.createElement("div"); el.className = "c-map-popup__body"; return el; });
        c.textContent = content;
      }
      const clusterCount = Number(this.getAttribute("cluster-count"));
      if (Number.isFinite(clusterCount) && clusterCount > 1) {
        const badge = this.ensure(".c-map-popup__cluster", () => { const el = document.createElement("button"); el.className = "c-map-popup__cluster c-btn c-btn--sm"; el.type = "button"; return el; });
        const expanded = this.hasAttribute("cluster-expanded");
        badge.textContent = expanded ? "Hide locations" : `${clusterCount} locations`;
        badge.setAttribute("aria-expanded", String(expanded));
        badge.setAttribute("aria-label", expanded ? "Hide locations" : `Show ${clusterCount} locations`);
      } else {
        const badge = this.querySelector(".c-map-popup__cluster");
        if (badge) badge.remove();
      }
      // Spatial clustering (R14-28): render clustered locations when expanded.
      const expanded = this.hasAttribute("cluster-expanded");
      let items = [];
      try { items = this.getAttribute("cluster-items") ? JSON.parse(this.getAttribute("cluster-items")) : []; } catch (e) { items = []; }
      const list = this.querySelector(".c-map-popup__cluster-list");
      if (expanded && Array.isArray(items) && items.length) {
        const ul = list || document.createElement("ul");
        ul.className = "c-map-popup__cluster-list";
        ul.innerHTML = "";
        items.forEach((it) => {
          const li = document.createElement("li");
          li.className = "c-map-popup__cluster-item";
          li.textContent = typeof it === "string" ? it : (it.label || it.name || JSON.stringify(it));
          ul.appendChild(li);
        });
        if (ul.parentNode !== this) this.appendChild(ul);
      } else if (list) {
        list.remove();
      }
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", title || "Map popup");
    }
    enhance() {
      if (this._wiredMapPopup) return;
      this._wiredMapPopup = true;
      const close = () => { try { this.hidePopover(); } catch (e) {} this.classList.remove("is-open"); this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true })); };
      const keyHandler = (e) => { if (e.key === "Escape" && (this.classList.contains("is-open") || this.matches(":popover-open"))) { e.preventDefault(); close(); } };
      document.addEventListener("keydown", keyHandler);
      onDispose(this, () => document.removeEventListener("keydown", keyHandler));
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-map-popup__close") : null;
        if (btn && this.contains(btn)) close();
        const cluster = e.target && e.target.closest ? e.target.closest(".c-map-popup__cluster") : null;
        if (cluster && this.contains(cluster)) {
          const expanded = !this.hasAttribute("cluster-expanded");
          this.toggleAttribute("cluster-expanded", expanded);
          this.dispatchEvent(new CustomEvent("contour:cluster-toggle", { bubbles: true, composed: true, detail: { count: Number(this.getAttribute("cluster-count")), expanded } }));
        }
      });
    }
  }
  define("contour-map-popup", ContourMapPopup);

/**
 * AnimationControls: a media control toolbar with play/pause, speed, scrubber
 * and caption. Attributes: `playing`, `speed`, `progress`, `min`, `max`,
 * `caption`, `show-thumb`, `show-thumb-caption`.
 */
class ContourAnimationControls extends ContourBase {
    static get observed() { return ["playing", "speed", "progress", "min", "max", "caption", "show-thumb", "show-thumb-caption"]; }
    static get properties() { return { playing: { attribute: "playing", type: Boolean }, speed: { attribute: "speed" }, progress: { attribute: "progress" }, min: { attribute: "min" }, max: { attribute: "max" } }; }
    render() {
      this.classList.add("c-animation-controls");
      this.setAttribute("role", "toolbar");
      this.setAttribute("aria-label", "Animation controls");
      const playBtn = this.ensure(".c-animation-controls__play", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-animation-controls__play"; el.type = "button"; return el; });
      playBtn.textContent = this.hasAttribute("playing") ? "Pause" : "Play";
      playBtn.setAttribute("aria-label", this.hasAttribute("playing") ? "Pause" : "Play");
      const speed = this.getAttribute("speed") || "1x";
      const speedBtn = this.ensure(".c-animation-controls__speed", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-animation-controls__speed"; el.type = "button"; return el; });
      speedBtn.textContent = speed;
      // scrubber
      const scrubber = this.ensure(".c-animation-controls__scrubber", () => { const el = document.createElement("input"); el.className = "c-range c-animation-controls__scrubber"; el.type = "range"; return el; });
      if (this.getAttribute("show-thumb") === "false") scrubber.classList.remove("c-animation-controls__scrubber--thumb");
      else scrubber.classList.add("c-animation-controls__scrubber--thumb");
      scrubber.min = this.getAttribute("min") || "0";
      scrubber.max = this.getAttribute("max") || "100";
      scrubber.value = this.getAttribute("progress") || "0";
      const caption = this.getAttribute("caption");
      if (caption) scrubber.setAttribute("aria-label", caption);
      else if (!scrubber.getAttribute("aria-label")) scrubber.setAttribute("aria-label", "Playhead");
      // caption display
      const showCaption = this.hasAttribute("show-thumb-caption") || this.hasAttribute("show-thumb");
      if (caption && showCaption) {
        const cap = this.ensure(".c-animation-controls__caption", () => { const el = document.createElement("span"); el.className = "c-animation-controls__caption"; return el; });
        cap.textContent = caption;
      } else {
        const cap = this.querySelector(".c-animation-controls__caption");
        if (cap) cap.remove();
      }
      // showThumb: hide thumb via attribute? keep default
    }
    enhance() {
      if (this._wiredAnimControls) return;
      this._wiredAnimControls = true;
      this.addEventListener("click", (e) => {
        const play = e.target && e.target.closest ? e.target.closest(".c-animation-controls__play") : null;
        const speed = e.target && e.target.closest ? e.target.closest(".c-animation-controls__speed") : null;
        if (play && this.contains(play)) {
          this.dispatchEvent(new CustomEvent("contour:toggle", { bubbles: true, composed: true, detail: { playing: !this.hasAttribute("playing") } }));
        }
        if (speed && this.contains(speed)) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { speed: speed.textContent } }));
        }
      });
      this.addEventListener("input", (e) => {
        const scrubber = e.target && e.target.closest ? e.target.closest(".c-animation-controls__scrubber") : null;
        if (scrubber && this.contains(scrubber)) {
          const v = Number(scrubber.value);
          this.dispatchEvent(new CustomEvent("contour:seek", { bubbles: true, composed: true, detail: { progress: v, value: v } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "Enter") {
          const play = this.querySelector(".c-animation-controls__play");
          if (play && (e.target === play || !e.target || e.target === this)) { e.preventDefault(); play.click(); }
        } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          const scrubber = this.querySelector(".c-animation-controls__scrubber");
          if (scrubber) {
            e.preventDefault();
            const step = e.key === "ArrowRight" ? 1 : -1;
            scrubber.value = String(Number(scrubber.value) + step);
            scrubber.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }
      });
      // Playback ownership: when `playing` is set, advance the playhead on a
      // timer and emit contour:time-change so a consumer can sync its data.
      let timer = null;
      const speedFactor = () => {
        const s = this.getAttribute("speed") || "1x";
        const n = parseFloat(s);
        return Number.isFinite(n) && n > 0 ? n : 1;
      };
      const tick = () => {
        const scrubber = this.querySelector(".c-animation-controls__scrubber");
        if (!scrubber) return;
        const min = Number(scrubber.min || 0);
        const max = Number(scrubber.max || 100);
        let v = Number(scrubber.value || 0) + speedFactor();
        if (v > max) v = min;
        scrubber.value = String(v);
        this.dispatchEvent(new CustomEvent("contour:time-change", { bubbles: true, composed: true, detail: { progress: v, value: v } }));
      };
      const start = () => { if (timer) return; timer = setInterval(tick, 100); };
      const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
      if (this.hasAttribute("playing")) start();
      const obs = new MutationObserver(() => { if (this.hasAttribute("playing")) start(); else stop(); });
      obs.observe(this, { attributes: true, attributeFilter: ["playing"] });
      onDispose(this, () => { stop(); obs.disconnect(); });
    }
  }
  define("contour-animation-controls", ContourAnimationControls);

/**
 * Dropdown: a trigger button with a menu of items from JSON `items` or slotted
 * `.c-menu__item` children. Attributes: `label`, `items`.
 */
class ContourDropdown extends ContourBase {
    static get observed() { return ["label", "items"]; }
    static get properties() { return { label: { attribute: "label" }, items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-dropdown");
      const btn = this.ensure(".c-dropdown__trigger", () => { const el = document.createElement("button"); el.className = "c-dropdown__trigger c-btn c-btn--sm"; el.type = "button"; return el; });
      btn.textContent = this.getAttribute("label") || "Menu";
      const menu = this.ensure(".c-dropdown__menu", () => { const el = document.createElement("div"); el.className = "c-dropdown__menu c-menu"; el.setAttribute("role", "menu"); el.hidden = true; return el; });
      // Slotted content: authored .c-menu__item children take precedence over
      // the JSON `items` attribute.
      const authoredItems = Array.from(this.querySelectorAll(":scope > .c-menu__item"));
      const items = this.getAttribute("items");
      if (authoredItems.length) {
        menu.innerHTML = "";
        authoredItems.forEach((it) => { menu.appendChild(it); });
      } else if (items) {
        try {
          const parsed = JSON.parse(items);
          menu.innerHTML = "";
          parsed.forEach((it) => {
            const li = document.createElement("button");
            li.className = "c-menu__item";
            li.setAttribute("role", "menuitem");
            li.textContent = typeof it === "string" ? it : (it.label || it.title || "");
            menu.appendChild(li);
          });
        } catch (e) { /* keep existing */ }
      }
      if (menu.parentNode !== this) this.appendChild(menu);
      if (btn.parentNode !== this) this.insertBefore(btn, menu);
    }
    enhance() {
      if (this._wiredDropdown) return;
      this._wiredDropdown = true;
      const btn = () => this.querySelector(".c-dropdown__trigger");
      const menu = () => this.querySelector(".c-dropdown__menu");
      this.addEventListener("click", (e) => {
        const b = btn();
        const m = menu();
        // Item selection.
        const item = e.target && e.target.closest ? e.target.closest(".c-menu__item") : null;
        if (item && m && m.contains(item) && !m.hidden) {
          const idx = Array.from(m.querySelectorAll(".c-menu__item")).indexOf(item);
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: idx, value: item.textContent } }));
          m.hidden = true;
          if (b) { b.setAttribute("aria-expanded", "false"); try { b.focus(); } catch (err) {} }
          return;
        }
        if (e.target === b || (b && b.contains(e.target))) {
          if (m) {
            m.hidden = !m.hidden;
            b.setAttribute("aria-expanded", String(!m.hidden));
            if (!m.hidden) {
              if (!m.id) m.id = (this.id || contourId("dd")) + "-menu";
              b.setAttribute("aria-controls", m.id);
              const first = m.querySelector(".c-menu__item");
              if (first) try { first.focus(); } catch (err) {}
            }
          }
        }
      });
      const docClick = (e) => {
        const m = menu();
        const b = btn();
        if (m && !m.hidden && !this.contains(e.target)) { m.hidden = true; if (b) b.setAttribute("aria-expanded", "false"); }
      };
      document.addEventListener("click", docClick);
      onDispose(this, () => document.removeEventListener("click", docClick));
      const keyHandler = (e) => {
        const m = menu(); const b = btn();
        if (e.key === "Escape" && m && !m.hidden) { e.preventDefault(); m.hidden = true; if (b) { b.setAttribute("aria-expanded", "false"); try { b.focus(); } catch (err) {} } return; }
        if (!m || m.hidden) return;
        const items = Array.from(m.querySelectorAll(".c-menu__item"));
        const active = document.activeElement;
        const idx = items.indexOf(active);
        if (e.key === "ArrowDown") { e.preventDefault(); const next = items[Math.min(items.length - 1, idx + 1)] || items[0]; if (next) try { next.focus(); } catch (err) {} }
        else if (e.key === "ArrowUp") { e.preventDefault(); const prev = items[Math.max(0, idx - 1)] || items[items.length - 1]; if (prev) try { prev.focus(); } catch (err) {} }
        else if (e.key === "Enter" || e.key === " ") {
          if (active && items.includes(active)) { e.preventDefault(); active.click(); }
        }
      };
      document.addEventListener("keydown", keyHandler);
      onDispose(this, () => document.removeEventListener("keydown", keyHandler));
    }
  }
  define("contour-dropdown", ContourDropdown);

/**
 * Annotation: a positioned note with label and x/y coordinates. Attributes:
 * `label`, `x`, `y`.
 */
class ContourAnnotation extends ContourBase {
    static get observed() { return ["label", "x", "y"]; }
    static get properties() { return { label: { attribute: "label" }, x: { attribute: "x" }, y: { attribute: "y" } }; }
    render() {
      this.classList.add("c-annotation");
      this.setAttribute("role", "note");
      const label = this.getAttribute("label");
      if (label) this.setAttribute("aria-label", label);
      if (label) {
        const l = this.ensure(".c-annotation__label", () => { const el = document.createElement("span"); el.className = "c-annotation__label"; return el; });
        l.textContent = label;
      }
      const x = this.getAttribute("x");
      const y = this.getAttribute("y");
      if (x !== null) this.style.setProperty("--annotation-x", x);
      if (y !== null) this.style.setProperty("--annotation-y", y);
    }
  }
  define("contour-annotation", ContourAnnotation);

/**
 * Style Switcher: web component wrapper.
 * Attributes: `items`, `value`.
 */
class ContourStyleSwitcher extends ContourBase {
    static get observed() { return ["items", "value"]; }
    static get properties() { return { items: { attribute: "items" }, value: { attribute: "value" } }; }
    render() {
      this.classList.add("c-style-switcher");
      const items = this.getAttribute("items");
      const value = this.getAttribute("value");
      Array.from(this.querySelectorAll(".c-style-switcher__option")).forEach((n) => n.remove());
      if (items) {
        try {
          const parsed = JSON.parse(items);
          parsed.forEach((it) => {
            const name = typeof it === "string" ? it : (it.name || it.label || "");
            const btn = document.createElement("button");
            btn.className = "c-style-switcher__option c-btn c-btn--sm";
            btn.type = "button";
            btn.textContent = name;
            if (name === value) btn.classList.add("c-style-switcher__option--active");
            btn.dataset.value = name;
            this.appendChild(btn);
          });
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredStyleSwitcher) return;
      this._wiredStyleSwitcher = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-style-switcher__option") : null;
        if (btn && this.contains(btn)) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: btn.dataset.value } }));
        }
      });
    }
  }
  define("contour-style-switcher", ContourStyleSwitcher);

/**
 * Style Panel: web component wrapper.
 * Attributes: `title`, `layers`, `layer`, `single`, `classification`, `palette`, `breaks`, `opacity`, `n`, `colors`, `property`.
 */
class ContourStylePanel extends ContourBase {
    static get observed() { return ["title", "layers", "layer", "single", "classification", "palette", "breaks", "opacity", "n", "colors", "property"]; }
    static get properties() { return { title: { attribute: "title" }, layers: { attribute: "layers" }, classification: { attribute: "classification" }, palette: { attribute: "palette" }, breaks: { attribute: "breaks" }, opacity: { attribute: "opacity" } }; }
    render() {
      this.classList.add("c-style-panel");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Style panel");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-style-panel__title", () => { const el = document.createElement("div"); el.className = "c-style-panel__title"; return el; });
        t.textContent = title;
      }
       const singleMode = this.hasAttribute("single") || !!this.getAttribute("layer");
       if (singleMode) {
         const body = this.ensure(".c-style-panel__body", () => { const el = document.createElement("div"); el.className = "c-style-panel__body"; return el; });
         body.innerHTML = "";
         // property field
         const propLabel = document.createElement("label"); propLabel.textContent = "Colour field"; propLabel.setAttribute("for", "property"); body.appendChild(propLabel);
         const propIn = document.createElement("input"); propIn.type = "text"; propIn.id = "property"; propIn.className = "c-style-panel__property c-input"; propIn.setAttribute("aria-label", "Colour field");
         const pv = this.getAttribute("property"); if (pv) propIn.value = pv;
         body.appendChild(propIn);
         // classification method selector (policy)
         const clsLabel = document.createElement("label"); clsLabel.textContent = "Classification"; clsLabel.setAttribute("for", "policy"); body.appendChild(clsLabel);
         const clsSel = document.createElement("select"); clsSel.id = "policy"; clsSel.className = "c-style-panel__classification c-input"; clsSel.setAttribute("aria-label", "Classification method");
         ["equal","quantile","jenks","manual"].forEach((m) => { const o = document.createElement("option"); o.value = m; o.textContent = m; clsSel.appendChild(o); });
         const cls = this.getAttribute("classification"); if (cls) clsSel.value = cls;
         body.appendChild(clsSel);
         // palette picker
         const palLabel = document.createElement("label"); palLabel.textContent = "Palette"; palLabel.setAttribute("for", "palette"); body.appendChild(palLabel);
         const pal = document.createElement("input"); pal.type = "text"; pal.id = "palette"; pal.className = "c-style-panel__palette c-input"; pal.placeholder = "palette"; pal.setAttribute("aria-label", "Palette");
         const palv = this.getAttribute("palette"); if (palv) pal.value = palv;
         body.appendChild(pal);
         // n (class count)
         const nLabel = document.createElement("label"); nLabel.textContent = "Classes"; nLabel.setAttribute("for", "n"); body.appendChild(nLabel);
         const nIn = document.createElement("input"); nIn.type = "number"; nIn.id = "n"; nIn.className = "c-style-panel__n c-input"; nIn.min = "2"; nIn.max = "12"; nIn.setAttribute("aria-label", "Class count");
         const nv = this.getAttribute("n"); if (nv) nIn.value = nv; else nIn.value = "5";
         body.appendChild(nIn);
         // opacity slider
         const op = document.createElement("input"); op.type = "range"; op.className = "c-style-panel__opacity"; op.setAttribute("aria-label", "Opacity"); op.min = "0"; op.max = "100";
         const ov = this.getAttribute("opacity"); op.value = ov != null ? ov : "100";
         body.appendChild(op);
         // breaks as .break elements per class
         const breaksAttr = this.getAttribute("breaks");
         let breaksArr = null;
         if (breaksAttr) { try { breaksArr = JSON.parse(breaksAttr); } catch (e) { breaksArr = breaksAttr.split(",").map((s) => s.trim()); } }
         if (Array.isArray(breaksArr) && breaksArr.length) {
           const breaksWrap = document.createElement("div"); breaksWrap.className = "c-style-panel__breaks";
           breaksArr.forEach((b, i) => {
             const br = document.createElement("div"); br.className = "break";
             const span = document.createElement("span"); span.textContent = String(b); br.appendChild(span);
             const inp = document.createElement("input"); inp.type = "number"; inp.className = "c-style-panel__breaks c-input"; inp.setAttribute("aria-label", "Class lower bound"); inp.value = String(b);
             br.appendChild(inp);
             breaksWrap.appendChild(br);
           });
           body.appendChild(breaksWrap);
         }
         // color swatches
         const colorsAttr = this.getAttribute("colors");
         let colors = null;
         if (colorsAttr) { try { colors = JSON.parse(colorsAttr); } catch (e) { colors = colorsAttr.split(",").map((s) => s.trim()); } }
         if (Array.isArray(colors)) {
           const list = document.createElement("div"); list.className = "c-style-panel__colors";
           colors.forEach((c, i) => {
             const sw = document.createElement("input"); sw.type = "color"; sw.className = "c-style-panel__color c-input"; sw.setAttribute("aria-label", "Colour for class " + (i + 1));
             sw.value = c;
             sw.addEventListener("input", () => { sw.setAttribute("data-edited", "true"); });
             list.appendChild(sw);
           });
           body.appendChild(list);
         }
         // Apply/Revert buttons
         const actions = document.createElement("div"); actions.className = "c-style-panel__actions";
         const applyBtn = document.createElement("button"); applyBtn.type = "button"; applyBtn.className = "c-btn c-btn--primary"; applyBtn.textContent = "Apply";
         const revertBtn = document.createElement("button"); revertBtn.type = "button"; revertBtn.className = "c-btn"; revertBtn.textContent = "Revert";
         actions.appendChild(applyBtn); actions.appendChild(revertBtn);
         body.appendChild(actions);
         return;
       }
       const layers = this.getAttribute("layers");
      const body = this.ensure(".c-style-panel__body", () => { const el = document.createElement("div"); el.className = "c-style-panel__body"; return el; });
      // Slotted content support: authored .c-style-panel__row children take
      // precedence over the JSON `layers` attribute.
      const authoredRows = Array.from(this.querySelectorAll(":scope > .c-style-panel__row"));
      let parsed = null;
      if (authoredRows.length) {
        parsed = authoredRows.map((row) => ({
          name: row.querySelector(".c-style-panel__name")?.textContent || "",
          color: row.querySelector(".c-style-panel__color")?.value,
          classification: row.querySelector(".c-style-panel__classification")?.value,
          palette: row.querySelector(".c-style-panel__palette")?.value,
          breaks: row.querySelector(".c-style-panel__breaks")?.value,
          opacity: row.querySelector(".c-style-panel__opacity")?.value,
        }));
        authoredRows.forEach((row) => row.remove());
      } else if (layers) {
        try {
          parsed = JSON.parse(layers);
        } catch (e) { parsed = null; }
      }
      if (parsed) {
        body.innerHTML = "";
        parsed.forEach((l) => {
            const row = document.createElement("div");
            row.className = "c-style-panel__row";
            const name = document.createElement("span");
            name.className = "c-style-panel__name";
            name.textContent = typeof l === "string" ? l : (l.name || l.label || "");
            row.appendChild(name);
            const input = document.createElement("input");
            input.type = "color";
            input.className = "c-style-panel__color";
            input.setAttribute("aria-label", "Colour for " + (typeof l === "string" ? l : (l.name || l.label || "layer")));
            if (typeof l === "object" && l.color) input.value = l.color;
            row.appendChild(input);
            // classification method selector
            const clsSel = document.createElement("select");
            clsSel.className = "c-style-panel__classification";
            clsSel.setAttribute("aria-label", "Classification method");
            ["equal","quantile","jenks","manual"].forEach((m) => { const o = document.createElement("option"); o.value = m; o.textContent = m; clsSel.appendChild(o); });
            if (typeof l === "object" && l.classification) clsSel.value = l.classification;
            row.appendChild(clsSel);
            // palette picker
            const pal = document.createElement("input");
            pal.type = "text";
            pal.className = "c-style-panel__palette";
            pal.setAttribute("aria-label", "Palette");
            pal.placeholder = "palette";
            if (typeof l === "object" && l.palette) pal.value = l.palette;
            row.appendChild(pal);
            // breaks editor
            const breaks = document.createElement("input");
            breaks.type = "text";
            breaks.className = "c-style-panel__breaks";
            breaks.placeholder = "breaks";
            if (typeof l === "object" && l.breaks) breaks.value = (Array.isArray(l.breaks) ? l.breaks.join(",") : l.breaks);
            row.appendChild(breaks);
            // opacity control
            const op = document.createElement("input");
            op.type = "range";
            op.className = "c-style-panel__opacity";
            op.setAttribute("aria-label", "Opacity");
            op.min = "0"; op.max = "100";
            op.value = (typeof l === "object" && l.opacity != null) ? l.opacity : "100";
            row.appendChild(op);
            body.appendChild(row);
          });
      }
    }
    enhance() {
      if (this._wiredStylePanel) return;
      this._wiredStylePanel = true;
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (!t || !this.contains(t)) return;
        const row = t.closest(".c-style-panel__row");
        const name = row ? (row.querySelector(".c-style-panel__name")?.textContent || "") : "";
        if (t.classList.contains("c-style-panel__color")) {
          this.dispatchEvent(new CustomEvent("contour:style-resolved", { detail: { value: t.value, layer: name, property: "color" }, bubbles: true, composed: true }));
        } else if (t.classList.contains("c-style-panel__classification")) {
          this.dispatchEvent(new CustomEvent("contour:break-change", { detail: { value: t.value, layer: name }, bubbles: true, composed: true }));
        } else if (t.classList.contains("c-style-panel__opacity")) {
          this.dispatchEvent(new CustomEvent("contour:layer-opacity", { detail: { name, opacity: Number(t.value) }, bubbles: true, composed: true }));
        } else if (t.classList.contains("c-style-panel__property")) {
          this.dispatchEvent(new CustomEvent("contour:style-resolved", { detail: { value: t.value, layer: name, property: "property" }, bubbles: true, composed: true }));
        } else if (t.classList.contains("c-style-panel__n")) {
          this.dispatchEvent(new CustomEvent("contour:style-resolved", { detail: { value: Number(t.value), layer: name, property: "n" }, bubbles: true, composed: true }));
        }
      });
      this.addEventListener("input", (e) => {
        const t = e.target;
        if (!t || !this.contains(t)) return;
        if (t.classList.contains("c-style-panel__palette") || t.classList.contains("c-style-panel__breaks")) {
          const row = t.closest(".c-style-panel__row");
          const name = row ? (row.querySelector(".c-style-panel__name")?.textContent || "") : "";
          this.dispatchEvent(new CustomEvent("contour:style-resolved", { detail: { value: t.value, layer: name, property: t.classList.contains("c-style-panel__palette") ? "palette" : "breaks" }, bubbles: true, composed: true }));
        }
      });
      this.addEventListener("click", (e) => {
        const t = e.target && e.target.closest ? e.target.closest("button") : null;
        if (!t || !this.contains(t)) return;
        if (t.textContent.trim() === "Apply") {
          this.dispatchEvent(new CustomEvent("contour:style-resolved", { detail: { applied: true }, bubbles: true, composed: true }));
        } else if (t.textContent.trim() === "Revert") {
          this.dispatchEvent(new CustomEvent("contour:style-resolved", { detail: { applied: false }, bubbles: true, composed: true }));
        }
      });
    }
  }
  define("contour-style-panel", ContourStylePanel);

/**
 * Responsive Content: web component wrapper.
 * Attributes: `breakpoint`.
 */
class ContourResponsiveContent extends ContourBase {
    static get observed() { return ["breakpoint"]; }
    static get properties() { return { breakpoint: { attribute: "breakpoint" } }; }
    render() {
      this.classList.add("c-responsive-content");
      const bp = this.getAttribute("breakpoint") || "md";
      this.dataset.breakpoint = bp;
    }
  }
  define("contour-responsive-content", ContourResponsiveContent);

/**
 * Avatar Group: web component wrapper.
 * Attributes: `items`, `max`.
 */
class ContourAvatarGroup extends ContourBase {
    static get observed() { return ["items", "max"]; }
    static get properties() { return { items: { attribute: "items" }, max: { attribute: "max", type: Number } }; }
    render() {
      this.classList.add("c-avatar-group");
      const items = this.getAttribute("items");
      const max = parseInt(this.getAttribute("max") || "4", 10) || 4;
      Array.from(this.querySelectorAll(".c-avatar, .c-avatar-group__overflow")).forEach((n) => n.remove());
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const shown = parsed.slice(0, max);
          shown.forEach((it) => {
            const av = document.createElement("span");
            av.className = "c-avatar";
            const name = typeof it === "string" ? it : (it.name || it.label || "");
            av.textContent = name.slice(0, 2).toUpperCase();
            if (typeof it === "object" && it.color) { av.style.background = it.color; av.dataset.color = it.color; }
            this.appendChild(av);
          });
          if (parsed.length > max) {
            const overflow = document.createElement("span");
            overflow.className = "c-avatar c-avatar-group__overflow";
            overflow.textContent = "+" + (parsed.length - max);
            this.appendChild(overflow);
          }
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-avatar-group", ContourAvatarGroup);

/**
 * Divider: web component wrapper.
 * Attributes: `label`, `orientation`.
 */
class ContourDivider extends ContourBase {
    static get observed() { return ["label", "orientation"]; }
    static get properties() { return { label: { attribute: "label" }, orientation: { attribute: "orientation" } }; }
    render() {
      this.classList.add("c-divider");
      const orientation = this.getAttribute("orientation") || "horizontal";
      this.classList.add("c-divider--" + orientation);
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-divider__label", () => { const el = document.createElement("span"); el.className = "c-divider__label"; return el; });
        l.textContent = label;
      }
    }
  }
  define("contour-divider", ContourDivider);

/**
 * Status Light: web component wrapper.
 * Attributes: `status`, `label`.
 */
class ContourStatusLight extends ContourBase {
    static get observed() { return ["status", "label"]; }
    static get properties() { return { status: { attribute: "status" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-status-light");
      const status = this.getAttribute("status") || "neutral";
      this.classList.add("c-status-light--" + status);
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-status-light__label", () => { const el = document.createElement("span"); el.className = "c-status-light__label"; return el; });
        l.textContent = label;
      }
    }
  }
  define("contour-status-light", ContourStatusLight);

/**
 * Split Button: web component wrapper.
 * Attributes: `label`, `menu`.
 */
class ContourSplitButton extends ContourBase {
    static get observed() { return ["label", "menu"]; }
    static get properties() { return { label: { attribute: "label" }, menu: { attribute: "menu" } }; }
    render() {
      this.classList.add("c-split-button");
      const main = this.ensure(".c-split-button__main", () => { const el = document.createElement("button"); el.className = "c-btn c-split-button__main"; el.type = "button"; return el; });
      main.textContent = this.getAttribute("label") || "Action";
      const toggle = this.ensure(".c-split-button__toggle", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--icon c-split-button__toggle"; el.type = "button"; el.setAttribute("aria-label", "More options"); el.textContent = "▾"; return el; });
      const menu = this.ensure(".c-split-button__menu", () => { const el = document.createElement("div"); el.className = "c-menu c-split-button__menu"; el.setAttribute("role", "menu"); el.hidden = true; return el; });
      const items = this.getAttribute("menu");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          menu.innerHTML = "";
          parsed.forEach((it) => {
            const li = document.createElement("button");
            li.className = "c-menu__item";
            li.setAttribute("role", "menuitem");
            li.textContent = typeof it === "string" ? it : (it.label || it.title || "");
            menu.appendChild(li);
          });
        } catch (e) { /* keep existing */ }
      }
      if (main.parentNode !== this) this.appendChild(main);
      if (toggle.parentNode !== this) this.appendChild(toggle);
      if (menu.parentNode !== this) this.appendChild(menu);
    }
    enhance() {
      if (this._wiredSplitButton) return;
      this._wiredSplitButton = true;
      const toggle = () => this.querySelector(".c-split-button__toggle");
      const menu = () => this.querySelector(".c-split-button__menu");
      this.addEventListener("click", (e) => {
        const t = toggle();
        if (e.target === t || (t && t.contains(e.target))) {
          const m = menu();
          if (m) { m.hidden = !m.hidden; t.setAttribute("aria-expanded", String(!m.hidden)); this.dispatchEvent(new CustomEvent("contour:toggle", { bubbles: true, composed: true, detail: { open: !m.hidden } })); }
        }
        const item = e.target && e.target.closest ? e.target.closest(".c-menu__item") : null;
        if (item && this.contains(item)) {
          const m = menu();
          if (m) { m.hidden = true; const t = toggle(); if (t) t.setAttribute("aria-expanded", "false"); }
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { label: item.textContent } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const t = toggle();
        if ((e.target === t || (t && t.contains(e.target))) && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          const m = menu();
          if (m) { m.hidden = !m.hidden; t.setAttribute("aria-expanded", String(!m.hidden)); }
        } else if (e.key === "Escape") {
          const m = menu();
          if (m && !m.hidden) { m.hidden = true; if (t) t.setAttribute("aria-expanded", "false"); }
        }
      });
      const docClick = (e) => {
        const m = menu();
        const t = toggle();
        if (m && !m.hidden && !this.contains(e.target)) { m.hidden = true; if (t) t.setAttribute("aria-expanded", "false"); }
      };
      document.addEventListener("click", docClick);
      onDispose(this, () => document.removeEventListener("click", docClick));
    }
  }
  define("contour-split-button", ContourSplitButton);

/**
 * Palette Editor: web component wrapper.
 * Attributes: `colors`.
 */
class ContourPaletteEditor extends ContourBase {
    static get observed() { return ["colors"]; }
    static get properties() { return { colors: { attribute: "colors" } }; }
    render() {
      this.classList.add("c-palette-editor");
      const colors = this.getAttribute("colors");
      Array.from(this.querySelectorAll(".c-palette-editor__swatch")).forEach((n) => n.remove());
      if (colors) {
        try {
          const parsed = JSON.parse(colors);
          parsed.forEach((c) => {
            const sw = document.createElement("button");
            sw.className = "c-palette-editor__swatch c-swatch";
            sw.type = "button";
            sw.style.background = typeof c === "string" ? c : (c.color || c.value || "");
            sw.dataset.color = typeof c === "string" ? c : (c.color || c.value || "");
            sw.setAttribute("aria-label", typeof c === "string" ? c : (c.name || c.label || "color"));
            this.appendChild(sw);
          });
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredPaletteEditor) return;
      this._wiredPaletteEditor = true;
      this.addEventListener("click", (e) => {
        const sw = e.target && e.target.closest ? e.target.closest(".c-palette-editor__swatch") : null;
        if (sw && this.contains(sw)) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { color: (sw.dataset && sw.dataset.color) || sw.style.background } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const swatches = Array.from(this.querySelectorAll(".c-palette-editor__swatch"));
        const active = document.activeElement;
        const idx = swatches.indexOf(active);
        if (e.key === "ArrowRight") { e.preventDefault(); const next = swatches[Math.min(swatches.length - 1, idx + 1)] || swatches[0]; if (next) try { next.focus(); } catch (err) {} }
        else if (e.key === "ArrowLeft") { e.preventDefault(); const prev = swatches[Math.max(0, idx - 1)] || swatches[swatches.length - 1]; if (prev) try { prev.focus(); } catch (err) {} }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (active && active.classList.contains("c-palette-editor__swatch")) active.click(); }
      });
    }
  }
  define("contour-palette-editor", ContourPaletteEditor);

/**
 * Date Range: web component wrapper.
 * Attributes: `start`, `end`, `label`, `time`, `min`, `max`, `locale`.
 */
class ContourDateRange extends ContourBase {
  static get observed() { return ["start", "end", "label", "time", "min", "max", "locale"]; }
  static get properties() { return { start: { attribute: "start" }, end: { attribute: "end" }, label: { attribute: "label" }, time: { attribute: "time", type: Boolean }, min: { attribute: "min" }, max: { attribute: "max" }, locale: { attribute: "locale" } }; }
    render() {
      this.classList.add("c-date-range");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Date range");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-date-range__label", () => { const el = document.createElement("span"); el.className = "c-date-range__label"; return el; });
        l.textContent = label;
      }
      const start = this.ensure(".c-date-range__start", () => { const el = document.createElement("input"); el.className = "c-input c-date-range__start"; return el; });
      start.type = this.hasAttribute("time") ? "datetime-local" : "date";
      start.value = this.getAttribute("start") || "";
      const end = this.ensure(".c-date-range__end", () => { const el = document.createElement("input"); el.className = "c-input c-date-range__end"; return el; });
      end.type = start.type;
      end.value = this.getAttribute("end") || "";
      const min = this.getAttribute("min");
      const max = this.getAttribute("max");
      [start, end].forEach((input) => {
        if (min) input.min = min; else input.removeAttribute("min");
        if (max) input.max = max; else input.removeAttribute("max");
        if (this.getAttribute("locale")) input.lang = this.getAttribute("locale");
      });
    }
    enhance() {
      if (this._wiredDateRange) return;
      this._wiredDateRange = true;
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && (t.classList.contains("c-date-range__start") || t.classList.contains("c-date-range__end"))) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { start: this.querySelector(".c-date-range__start")?.value, end: this.querySelector(".c-date-range__end")?.value } }));
        }
      });
    }
  }
  define("contour-date-range", ContourDateRange);

/**
 * Shortcut: web component wrapper.
 * Attributes: `key`, `label`.
 */
class ContourShortcut extends ContourBase {
    static get observed() { return ["key", "label"]; }
    static get properties() { return { key: { attribute: "key" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-shortcut");
      const key = this.getAttribute("key") || "";
      const label = this.getAttribute("label") || "";
      if (key) {
        const k = this.ensure(".c-shortcut__key", () => { const el = document.createElement("kbd"); el.className = "c-shortcut__key"; return el; });
        k.textContent = key;
      }
      if (label) {
        const l = this.ensure(".c-shortcut__label", () => { const el = document.createElement("span"); el.className = "c-shortcut__label"; return el; });
        l.textContent = label;
      }
    }
    enhance() {
      if (this._wiredShortcut) return;
      this._wiredShortcut = true;
      const key = this.getAttribute("key");
      if (key) {
        const handler = (e) => {
          if (e.key === key && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true }));
          }
        };
        document.addEventListener("keydown", handler);
        onDispose(this, () => document.removeEventListener("keydown", handler));
      }
    }
  }
  define("contour-shortcut", ContourShortcut);

/**
 * Popover: web component wrapper.
 * Attributes: `title`, `content`.
 */
class ContourPopover extends ContourBase {
    static get observed() { return ["title", "content"]; }
    static get properties() { return { title: { attribute: "title" }, content: { attribute: "content" } }; }
    render() {
      this.classList.add("c-popover");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Popover");
      if (!this.hasAttribute("popover")) this.setAttribute("popover", "auto");
      if (!this.id) this.id = contourId("popover");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-popover__title", () => { const el = document.createElement("div"); el.className = "c-popover__title"; return el; });
        t.textContent = title;
      }
      const content = this.getAttribute("content");
      if (content) {
        const c = this.ensure(".c-popover__body", () => { const el = document.createElement("div"); el.className = "c-popover__body"; return el; });
        c.textContent = content;
      }
    }
    enhance() {
      if (this._wiredPopover) return;
      this._wiredPopover = true;
      const close = () => { try { this.hidePopover(); } catch (e) {} this.classList.remove("is-open"); this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true })); };
      const keyHandler = (e) => {
        const open = this.classList.contains("is-open") || this.matches(":popover-open");
        if (!open) return;
        if (e.key === "Escape") { e.preventDefault(); close(); return; }
        // Focus trap: keep Tab within the popover.
        if (e.key === "Tab") {
          const focusable = Array.from(this.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
          if (!focusable.length) { e.preventDefault(); return; }
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      };
      document.addEventListener("keydown", keyHandler);
      onDispose(this, () => document.removeEventListener("keydown", keyHandler));
      // Nested popover support: when a nested popover opens, mark this one as parent.
      this.addEventListener("contour:show", (e) => {
        if (e.target && e.target !== this && this.contains(e.target)) {
          this.classList.add("is-parent");
        }
      });
      this.addEventListener("contour:close", (e) => {
        if (e.target && e.target !== this) {
          this.classList.remove("is-parent");
        }
      });
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-popover__close") : null;
        if (btn && this.contains(btn)) close();
      });
    }
  }
  define("contour-popover", ContourPopover);

/**
 * Date Picker: web component wrapper.
 * Attributes: `value`, `range`, `range-start`, `range-end`, `label`, `disabled`, `error`, `help`, `time`, `min`, `max`, `locale`.
 */
class ContourDatePicker extends ContourBase {
  static get observed() { return ["value", "range", "range-start", "range-end", "label", "disabled", "error", "help", "time", "min", "max", "locale"]; }
  static get properties() { return { value: { attribute: "value" }, range: { attribute: "range", type: Boolean }, rangeStart: { attribute: "range-start" }, rangeEnd: { attribute: "range-end" }, label: { attribute: "label" }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" }, time: { attribute: "time", type: Boolean }, min: { attribute: "min" }, max: { attribute: "max" }, locale: { attribute: "locale" } }; }
    render() {
      this.classList.add("c-date-picker");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Date picker");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-date-picker__label", () => { const el = document.createElement("label"); el.className = "c-date-picker__label"; return el; });
        l.textContent = label;
      }
      const input = this.ensure(".c-date-picker__input", () => { const el = document.createElement("input"); el.className = "c-input c-date-picker__input"; return el; });
      const range = this.hasAttribute("range");
      const type = this.hasAttribute("time") ? "datetime-local" : "date";
      const configure = (control, value, name) => {
        control.type = type;
        control.value = value || "";
        control.setAttribute("aria-label", name);
        if (this.hasAttribute("min")) control.min = this.getAttribute("min"); else control.removeAttribute("min");
        if (this.hasAttribute("max")) control.max = this.getAttribute("max"); else control.removeAttribute("max");
        if (this.hasAttribute("locale")) control.lang = this.getAttribute("locale"); else control.removeAttribute("lang");
        if (this.hasAttribute("disabled")) control.setAttribute("disabled", ""); else control.removeAttribute("disabled");
      };
      configure(input, range ? this.getAttribute("range-start") : this.getAttribute("value"), range ? "Start date" : (label || "Date"));
      let end = this.querySelector(".c-date-picker__end");
      if (range) {
        end = end || document.createElement("input");
        end.className = "c-input c-date-picker__input c-date-picker__end";
        configure(end, this.getAttribute("range-end"), "End date");
        if (end.parentNode !== this) this.appendChild(end);
      } else if (end) end.remove();
      if (this.hasAttribute("disabled")) this.classList.add("is-disabled"); else this.classList.remove("is-disabled");
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-date-picker__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-date-picker__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-date-picker__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
      // Calendar affordance (R14-22): a toggle + month grid alongside the native input.
      const toggle = this.ensure(".c-date-picker__calendar-toggle", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-date-picker__calendar-toggle"; el.type = "button"; el.textContent = "📅"; el.setAttribute("aria-label", "Open calendar"); el.setAttribute("aria-expanded", "false"); return el; });
      let cal = this.querySelector(".c-date-picker__calendar");
      if (!cal) { cal = document.createElement("div"); cal.className = "c-date-picker__calendar"; cal.setAttribute("hidden", ""); cal.setAttribute("role", "dialog"); cal.setAttribute("aria-label", "Calendar"); this.appendChild(cal); }
    }
    _renderCalendar() {
      const cal = this.querySelector(".c-date-picker__calendar");
      if (!cal) return;
      const input = this.querySelector(".c-date-picker__input");
      const base = (input && input.value) ? new Date(input.value) : new Date();
      const month = this._calMonth || new Date(base.getFullYear(), base.getMonth(), 1);
      this._calMonth = month;
      const y = month.getFullYear();
      const m = month.getMonth();
      const first = new Date(y, m, 1);
      const startDay = first.getDay();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      cal.innerHTML = "";
      const header = document.createElement("div");
      header.className = "c-date-picker__calendar-header";
      const prev = document.createElement("button"); prev.type = "button"; prev.className = "c-btn c-btn--sm"; prev.textContent = "‹"; prev.setAttribute("aria-label", "Previous month");
      const title = document.createElement("span"); title.className = "c-date-picker__calendar-title"; title.textContent = month.toLocaleString(this.getAttribute("locale") || undefined, { month: "long", year: "numeric" });
      const next = document.createElement("button"); next.type = "button"; next.className = "c-btn c-btn--sm"; next.textContent = "›"; next.setAttribute("aria-label", "Next month");
      header.appendChild(prev); header.appendChild(title); header.appendChild(next);
      cal.appendChild(header);
      const grid = document.createElement("div");
      grid.className = "c-date-picker__calendar-grid";
      grid.setAttribute("role", "grid");
      const weekdays = ["Su","Mo","Tu","We","Th","Fr","Sa"];
      weekdays.forEach((w) => { const h = document.createElement("div"); h.className = "c-date-picker__calendar-weekday"; h.textContent = w; grid.appendChild(h); });
      for (let i = 0; i < startDay; i++) { const empty = document.createElement("div"); empty.className = "c-date-picker__calendar-day c-date-picker__calendar-day--empty"; grid.appendChild(empty); }
      const selected = input ? input.value : "";
      for (let d = 1; d <= daysInMonth; d++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "c-date-picker__calendar-day";
        btn.textContent = String(d);
        const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (selected && selected.startsWith(iso)) btn.classList.add("is-selected");
        btn.addEventListener("click", () => {
          if (input) { input.value = iso; input.dispatchEvent(new Event("change", { bubbles: true })); }
          cal.setAttribute("hidden", "");
          const tgl = this.querySelector(".c-date-picker__calendar-toggle");
          if (tgl) tgl.setAttribute("aria-expanded", "false");
        });
        grid.appendChild(btn);
      }
      cal.appendChild(grid);
      prev.addEventListener("click", () => { this._calMonth = new Date(y, m - 1, 1); this._renderCalendar(); });
      next.addEventListener("click", () => { this._calMonth = new Date(y, m + 1, 1); this._renderCalendar(); });
    }
    enhance() {
      if (this._wiredDatePicker) return;
      this._wiredDatePicker = true;
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && t.classList.contains("c-date-picker__input")) {
          const end = this.querySelector(".c-date-picker__end");
          const detail = end ? { start: this.querySelector(".c-date-picker__input").value, end: end.value } : { value: t.value };
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail }));
        }
      });
      const toggle = () => {
        const cal = this.querySelector(".c-date-picker__calendar");
        const btn = this.querySelector(".c-date-picker__calendar-toggle");
        if (!cal) return;
        const hidden = cal.hasAttribute("hidden");
        if (hidden) { cal.removeAttribute("hidden"); if (btn) btn.setAttribute("aria-expanded", "true"); this._renderCalendar(); }
        else { cal.setAttribute("hidden", ""); if (btn) btn.setAttribute("aria-expanded", "false"); }
      };
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-date-picker__calendar-toggle") : null;
        if (btn && this.contains(btn)) { e.preventDefault(); toggle(); }
      });
    }
  }
  define("contour-date-picker", ContourDatePicker);

/**
 * Rating: web component wrapper.
 * Attributes: `value`, `max`, `color`.
 */
class ContourRating extends ContourBase {
    static get observed() { return ["value", "max", "color"]; }
    static get properties() { return { value: { attribute: "value", type: Number }, max: { attribute: "max", type: Number }, color: { attribute: "color" } }; }
    render() {
      this.classList.add("c-rating");
      this.setAttribute("role", "radiogroup");
      this.setAttribute("aria-label", "Rating");
      const max = parseInt(this.getAttribute("max") || "5", 10) || 5;
      const value = parseInt(this.getAttribute("value") || "0", 10) || 0;
      const color = this.getAttribute("color");
      Array.from(this.querySelectorAll(".c-rating__star")).forEach((n) => n.remove());
      for (let i = 1; i <= max; i++) {
        const star = document.createElement("button");
        star.className = "c-rating__star" + (i <= value ? " c-rating__star--filled" : "");
        star.type = "button";
        star.setAttribute("role", "radio");
        star.setAttribute("aria-checked", String(i === value));
        star.innerHTML = '<span class="c-rating__swatch' + (i <= value ? ' c-rating__swatch--filled' : '') + '" aria-hidden="true"' + (color && i <= value ? ' style="background:' + color + ';border-color:' + color + '"' : '') + '></span>';
        star.dataset.value = String(i);
        star.setAttribute("aria-label", i + " star" + (i > 1 ? "s" : ""));
        this.appendChild(star);
      }
    }
    enhance() {
      if (this._wiredRating) return;
      this._wiredRating = true;
      this.addEventListener("click", (e) => {
        const star = e.target && e.target.closest ? e.target.closest(".c-rating__star") : null;
        if (star && this.contains(star)) {
          const v = parseInt(star.dataset.value, 10);
          Array.from(this.querySelectorAll(".c-rating__star")).forEach((st) => st.setAttribute("aria-checked", String(parseInt(st.dataset.value, 10) === v)));
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: v } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const stars = Array.from(this.querySelectorAll(".c-rating__star"));
        const active = document.activeElement;
        const idx = stars.indexOf(active);
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          const next = stars[Math.min(stars.length - 1, idx + 1)] || stars[0];
          if (next) { try { next.focus(); } catch (err) {} }
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          const prev = stars[Math.max(0, idx - 1)] || stars[stars.length - 1];
          if (prev) { try { prev.focus(); } catch (err) {} }
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (active && active.classList.contains("c-rating__star")) {
            this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: parseInt(active.dataset.value, 10) } }));
          }
        }
      });
    }
  }
  define("contour-rating", ContourRating);

/**
 * Time Picker: web component wrapper.
 * Attributes: `value`, `label`, `disabled`, `error`, `help`.
 */
class ContourTimePicker extends ContourBase {
    static get observed() { return ["value", "label", "disabled", "error", "help"]; }
    static get properties() { return { value: { attribute: "value" }, label: { attribute: "label" }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
    render() {
      this.classList.add("c-time-picker");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Time picker");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-time-picker__label", () => { const el = document.createElement("label"); el.className = "c-time-picker__label"; return el; });
        l.textContent = label;
      }
      const input = this.ensure(".c-time-picker__input", () => { const el = document.createElement("input"); el.className = "c-input c-time-picker__input"; el.type = "time"; return el; });
      input.value = this.getAttribute("value") || "";
      if (this.hasAttribute("disabled")) { input.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
      else { input.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-time-picker__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-time-picker__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-time-picker__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
      // Calendar affordance (R14-22): a toggle + month grid alongside the native input.
      const toggle = this.ensure(".c-date-picker__calendar-toggle", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-date-picker__calendar-toggle"; el.type = "button"; el.textContent = "📅"; el.setAttribute("aria-label", "Open calendar"); el.setAttribute("aria-expanded", "false"); return el; });
      let cal = this.querySelector(".c-date-picker__calendar");
      if (!cal) { cal = document.createElement("div"); cal.className = "c-date-picker__calendar"; cal.setAttribute("hidden", ""); cal.setAttribute("role", "dialog"); cal.setAttribute("aria-label", "Calendar"); this.appendChild(cal); }
    }
    enhance() {
      if (this._wiredTimePicker) return;
      this._wiredTimePicker = true;
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && t.classList.contains("c-time-picker__input")) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: t.value } }));
        }
      });
    }
  }
  define("contour-time-picker", ContourTimePicker);

/**
 * Color Picker: web component wrapper.
 * Attributes: `value`, `label`, `disabled`, `error`, `help`, `alpha`, `presets`.
 */
class ContourColorPicker extends ContourBase {
    static get observed() { return ["value", "label", "disabled", "error", "help", "alpha", "presets"]; }
    static get properties() { return { value: { attribute: "value" }, label: { attribute: "label" }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" }, alpha: { attribute: "alpha", type: Boolean }, presets: { attribute: "presets" } }; }
    render() {
      this.classList.add("c-color-picker");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Color picker");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-color-picker__label", () => { const el = document.createElement("label"); el.className = "c-color-picker__label"; return el; });
        l.textContent = label;
      }
      const input = this.ensure(".c-color-picker__input", () => { const el = document.createElement("input"); el.className = "c-color-picker__input"; el.type = "color"; return el; });
      input.value = (this.getAttribute("value") || "#000000").slice(0, 7);
      if (this.hasAttribute("disabled")) { input.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
      else { input.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      // Alpha channel (optional).
      if (this.hasAttribute("alpha")) {
        const alpha = this.ensure(".c-color-picker__alpha", () => { const el = document.createElement("input"); el.className = "c-color-picker__alpha"; el.type = "range"; el.min = "0"; el.max = "1"; el.step = "0.01"; return el; });
        const v = this.getAttribute("value") || "#000000";
        const a = v.length === 9 ? parseInt(v.slice(7, 9), 16) / 255 : 1;
        alpha.value = String(a);
        alpha.setAttribute("aria-label", "Alpha");
      } else {
        const a = this.querySelector(".c-color-picker__alpha");
        if (a) a.remove();
      }
      // Presets.
      const presetsAttr = this.getAttribute("presets");
      let presets = [];
      if (presetsAttr) { try { presets = JSON.parse(presetsAttr); } catch (e) { presets = []; } }
      const oldPresets = this.querySelector(".c-color-picker__presets");
      if (oldPresets) oldPresets.remove();
      if (Array.isArray(presets) && presets.length) {
        const wrap = document.createElement("div");
        wrap.className = "c-color-picker__presets";
        presets.forEach((c) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "c-color-picker__preset";
          btn.style.background = c;
          btn.dataset.color = c;
          btn.setAttribute("aria-label", "Preset " + c);
          wrap.appendChild(btn);
        });
        this.appendChild(wrap);
      }
      // Eyedropper (if supported).
      if (typeof window !== "undefined" && "EyeDropper" in window) {
        const ed = this.ensure(".c-color-picker__eyedropper", () => { const el = document.createElement("button"); el.className = "c-color-picker__eyedropper"; el.type = "button"; el.textContent = "Pick"; el.setAttribute("aria-label", "Pick color from screen"); return el; });
        if (this.hasAttribute("disabled")) ed.setAttribute("disabled", "");
        else ed.removeAttribute("disabled");
      } else {
        const ed = this.querySelector(".c-color-picker__eyedropper");
        if (ed) ed.remove();
      }
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-color-picker__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-color-picker__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-color-picker__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
      // Calendar affordance (R14-22): a toggle + month grid alongside the native input.
      const toggle = this.ensure(".c-date-picker__calendar-toggle", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-date-picker__calendar-toggle"; el.type = "button"; el.textContent = "📅"; el.setAttribute("aria-label", "Open calendar"); el.setAttribute("aria-expanded", "false"); return el; });
      let cal = this.querySelector(".c-date-picker__calendar");
      if (!cal) { cal = document.createElement("div"); cal.className = "c-date-picker__calendar"; cal.setAttribute("hidden", ""); cal.setAttribute("role", "dialog"); cal.setAttribute("aria-label", "Calendar"); this.appendChild(cal); }
    }
    enhance() {
      if (this._wiredColorPicker) return;
      this._wiredColorPicker = true;
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && t.classList.contains("c-color-picker__input")) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: t.value } }));
        }
        if (t && t.classList.contains("c-color-picker__alpha")) {
          const base = (this.getAttribute("value") || "#000000").slice(0, 7);
          const a = Math.round(parseFloat(t.value) * 255).toString(16).padStart(2, "0");
          const val = base + a;
          this.setAttribute("value", val);
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: val } }));
        }
      });
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-color-picker__preset") : null;
        if (btn && this.contains(btn)) {
          const c = btn.dataset.color;
          if (c) {
            this.setAttribute("value", c);
            const input = this.querySelector(".c-color-picker__input");
            if (input) input.value = c.slice(0, 7);
            this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: c } }));
          }
        }
        const ed = e.target && e.target.closest ? e.target.closest(".c-color-picker__eyedropper") : null;
        if (ed && this.contains(ed) && typeof window !== "undefined" && "EyeDropper" in window) {
          e.preventDefault();
          const dropper = new window.EyeDropper();
          dropper.open().then((r) => {
            if (r && r.sRGBHex) {
              this.setAttribute("value", r.sRGBHex);
              const input = this.querySelector(".c-color-picker__input");
              if (input) input.value = r.sRGBHex;
              this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: r.sRGBHex } }));
            }
          }).catch(() => {});
        }
      });
    }
  }
  define("contour-color-picker", ContourColorPicker);

/**
 * Number Field: web component wrapper.
 * Attributes: `value`, `min`, `max`, `step`, `label`, `disabled`, `error`, `help`.
 */
class ContourNumberField extends ContourBase {
    static get observed() { return ["value", "min", "max", "step", "label", "disabled", "error", "help"]; }
    static get properties() { return { value: { attribute: "value" }, min: { attribute: "min" }, max: { attribute: "max" }, step: { attribute: "step" }, label: { attribute: "label" }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
    render() {
      this.classList.add("c-number-field");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-number-field__label", () => { const el = document.createElement("label"); el.className = "c-number-field__label"; return el; });
        l.textContent = label;
      }
      const input = this.ensure(".c-number-field__input", () => { const el = document.createElement("input"); el.className = "c-input c-number-field__input"; el.type = "number"; el.setAttribute("role", "spinbutton"); return el; });
      if (this.getAttribute("value") !== null) input.value = this.getAttribute("value");
      if (this.getAttribute("min") !== null) input.min = this.getAttribute("min");
      if (this.getAttribute("max") !== null) input.max = this.getAttribute("max");
      if (this.getAttribute("step") !== null) input.step = this.getAttribute("step");
      const v = input.value;
      input.setAttribute("aria-valuenow", v === "" ? "" : v);
      if (input.min !== "") input.setAttribute("aria-valuemin", input.min);
      if (input.max !== "") input.setAttribute("aria-valuemax", input.max);
      if (this.hasAttribute("disabled")) { input.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
      else { input.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-number-field__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-number-field__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-number-field__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
      // Calendar affordance (R14-22): a toggle + month grid alongside the native input.
      const toggle = this.ensure(".c-date-picker__calendar-toggle", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-date-picker__calendar-toggle"; el.type = "button"; el.textContent = "📅"; el.setAttribute("aria-label", "Open calendar"); el.setAttribute("aria-expanded", "false"); return el; });
      let cal = this.querySelector(".c-date-picker__calendar");
      if (!cal) { cal = document.createElement("div"); cal.className = "c-date-picker__calendar"; cal.setAttribute("hidden", ""); cal.setAttribute("role", "dialog"); cal.setAttribute("aria-label", "Calendar"); this.appendChild(cal); }
    }
    enhance() {
      if (this._wiredNumberField) return;
      this._wiredNumberField = true;
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && t.classList.contains("c-number-field__input")) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: t.value } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const input = this.querySelector(".c-number-field__input");
        if (!input || document.activeElement !== input) return;
        const step = Number(input.step) || 1;
        const min = input.min === "" ? -Infinity : Number(input.min);
        const max = input.max === "" ? Infinity : Number(input.max);
        let next = null;
        if (e.key === "ArrowUp") next = (Number(input.value) || 0) + step;
        else if (e.key === "ArrowDown") next = (Number(input.value) || 0) - step;
        else if (e.key === "Home") next = min === -Infinity ? 0 : min;
        else if (e.key === "End") next = max === Infinity ? (Number(input.value) || 0) : max;
        if (next !== null) {
          e.preventDefault();
          next = Math.min(max, Math.max(min, next));
          input.value = String(next);
          input.setAttribute("aria-valuenow", String(next));
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: input.value } }));
        }
      });
    }
  }
  define("contour-number-field", ContourNumberField);

/**
 * Hover Card: web component wrapper.
 * Attributes: `title`, `content`, `anchor`.
 */
class ContourHoverCard extends ContourBase {
    static get observed() { return ["title", "content", "anchor"]; }
    static get properties() { return { title: { attribute: "title" }, content: { attribute: "content" }, anchor: { attribute: "anchor" } }; }
    render() {
      this.classList.add("c-hover-card");
      if (!this.hasAttribute("role")) this.setAttribute("role", "tooltip");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Hover card");
      if (!this.hasAttribute("popover")) this.setAttribute("popover", "auto");
      if (!this.id) this.id = contourId("hover-card");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-hover-card__title", () => { const el = document.createElement("div"); el.className = "c-hover-card__title"; return el; });
        t.textContent = title;
      }
      const content = this.getAttribute("content");
      if (content) {
        const c = this.ensure(".c-hover-card__body", () => { const el = document.createElement("div"); el.className = "c-hover-card__body"; return el; });
        c.textContent = content;
      }
    }
    enhance() {
      if (this._wiredHoverCard) return;
      this._wiredHoverCard = true;
      const anchorSel = this.getAttribute("anchor");
      if (anchorSel) {
        const trigger = anchorSel.startsWith("#") ? document.getElementById(anchorSel.slice(1)) : document.querySelector(anchorSel);
        if (trigger) {
          trigger.setAttribute("popovertarget", this.id);
          let showTimer = null;
          const hasPopover = typeof this.showPopover === "function";
          const show = () => { if (hasPopover) { try { this.showPopover(); } catch (e) {} } else this.classList.add("is-open"); this.dispatchEvent(new CustomEvent("contour:open", { bubbles: true, composed: true })); };
          const hide = () => { if (showTimer) clearTimeout(showTimer); if (hasPopover) { try { this.hidePopover(); } catch (e) {} } else this.classList.remove("is-open"); this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true })); };
          trigger.addEventListener("mouseenter", () => { showTimer = setTimeout(show, 300); });
          trigger.addEventListener("mouseleave", () => { hide(); });
          trigger.addEventListener("focus", show);
          trigger.addEventListener("blur", () => { setTimeout(hide, 100); });
          onDispose(this, () => { if (showTimer) { clearTimeout(showTimer); showTimer = null; } });
        }
      }
      const keyHandler = (e) => { if (e.key === "Escape" && (this.classList.contains("is-open") || this.matches(":popover-open"))) { e.preventDefault(); if (typeof this.hidePopover === "function") { try { this.hidePopover(); } catch (err) {} } this.classList.remove("is-open"); this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true })); } };
      document.addEventListener("keydown", keyHandler);
      onDispose(this, () => document.removeEventListener("keydown", keyHandler));
    }
  }
  define("contour-hover-card", ContourHoverCard);

/**
 * Context Menu: web component wrapper.
 * Attributes: `items`.
 */
class ContourContextMenu extends ContourBase {
    static get observed() { return ["items"]; }
    static get properties() { return { items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-context-menu");
      if (!this.hasAttribute("role")) this.setAttribute("role", "menu");
      if (!this.hasAttribute("popover")) this.setAttribute("popover", "auto");
      if (!this.id) this.id = contourId("context-menu");
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          this.innerHTML = "";
          parsed.forEach((it) => {
            const btn = document.createElement("button");
            btn.className = "c-menu__item";
            btn.setAttribute("role", "menuitem");
            btn.textContent = typeof it === "string" ? it : (it.label || it.title || "");
            this.appendChild(btn);
          });
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredContextMenu) return;
      this._wiredContextMenu = true;
      this.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (typeof this.showPopover === "function") { try { this.showPopover(); } catch (err) {} }
        else this.classList.toggle("is-open");
      });
      this.addEventListener("click", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".c-menu__item") : null;
        if (item && this.contains(item)) {
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { label: item.textContent.trim() } }));
          if (typeof this.hidePopover === "function") { try { this.hidePopover(); } catch (err) {} }
          this.classList.remove("is-open");
        }
      });
      this.addEventListener("keydown", (e) => {
        const items = Array.from(this.querySelectorAll(".c-menu__item"));
        const active = document.activeElement;
        const idx = items.indexOf(active);
        if (e.key === "ArrowDown") { e.preventDefault(); const next = items[Math.min(items.length - 1, idx + 1)] || items[0]; if (next) try { next.focus(); } catch (err) {} }
        else if (e.key === "ArrowUp") { e.preventDefault(); const prev = items[Math.max(0, idx - 1)] || items[items.length - 1]; if (prev) try { prev.focus(); } catch (err) {} }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (active && active.classList.contains("c-menu__item")) active.click(); }
        else if (e.key === "Escape") { e.preventDefault(); if (typeof this.hidePopover === "function") { try { this.hidePopover(); } catch (err) {} } this.classList.remove("is-open"); }
      });
    }
  }
  define("contour-context-menu", ContourContextMenu);

/**
 * Fab: web component wrapper.
 * Attributes: `label`, `icon`.
 */
class ContourFab extends ContourBase {
    static get observed() { return ["label", "icon"]; }
    static get properties() { return { label: { attribute: "label" }, icon: { attribute: "icon" } }; }
    render() {
      this.classList.add("c-fab");
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      const label = this.getAttribute("label");
      if (label) this.setAttribute("aria-label", label);
      const icon = this.getAttribute("icon");
      if (icon && !this.hasChildNodes()) this.textContent = icon;
    }
    enhance() {
      if (this._wiredFab) return;
      this._wiredFab = true;
      this.addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true }));
      });
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true })); }
      });
    }
  }
  define("contour-fab", ContourFab);

/**
 * File Upload: web component wrapper.
 * Attributes: `label`, `accept`, `multiple`, `progress`.
 */
class ContourFileUpload extends ContourBase {
    static get observed() { return ["label", "accept", "multiple", "progress"]; }
    static get properties() { return { label: { attribute: "label" }, accept: { attribute: "accept" }, multiple: { attribute: "multiple", type: Boolean }, progress: { attribute: "progress" } }; }
    render() {
      this.classList.add("c-file-upload");
      const label = this.getAttribute("label") || "Drop files here or click to browse";
      const dz = this.ensure(".c-file-upload__dropzone", () => { const el = document.createElement("div"); el.className = "c-file-upload__dropzone"; el.setAttribute("role", "button"); el.tabIndex = 0; return el; });
      dz.textContent = label;
      const input = this.ensure(".c-file-upload__input", () => { const el = document.createElement("input"); el.className = "c-file-upload__input"; el.type = "file"; el.hidden = true; return el; });
      input.accept = this.getAttribute("accept") || "";
      input.multiple = this.hasAttribute("multiple");
      const p = this.getAttribute("progress");
      if (p !== null) {
        const bar = this.ensure(".c-file-upload__progress", () => { const el = document.createElement("progress"); el.className = "c-file-upload__progress"; return el; });
        bar.value = Number(p) || 0;
        bar.max = 100;
      } else {
        const bar = this.querySelector(".c-file-upload__progress");
        if (bar) bar.remove();
      }
      const preview = this.ensure(".c-file-upload__preview", () => { const el = document.createElement("div"); el.className = "c-file-upload__preview"; return el; });
      if (!preview) {}
    }
    enhance() {
      if (this._wiredFileUpload) return;
      this._wiredFileUpload = true;
      const dz = () => this.querySelector(".c-file-upload__dropzone");
      const input = () => this.querySelector(".c-file-upload__input");
      const activate = () => { const i = input(); if (i) i.click(); };
      this.addEventListener("click", (e) => { const d = dz(); if (e.target === d || (d && d.contains(e.target))) { activate(); } });
      this.addEventListener("keydown", (e) => { const d = dz(); if ((e.target === d || (d && d.contains(e.target))) && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); activate(); } });
      const renderPreview = (files) => {
        const preview = this.querySelector(".c-file-upload__preview");
        if (!preview) return;
        preview.innerHTML = "";
        Array.from(files || []).forEach((f) => {
          const item = document.createElement("div");
          item.className = "c-file-upload__preview-item";
          if (f.type && f.type.startsWith("image/")) {
            const img = document.createElement("img");
            img.className = "c-file-upload__preview-thumb";
            img.alt = f.name;
            try { img.src = URL.createObjectURL(f); } catch (e) {}
            item.appendChild(img);
          } else {
            const name = document.createElement("span");
            name.className = "c-file-upload__preview-name";
            name.textContent = f.name;
            item.appendChild(name);
          }
          preview.appendChild(item);
        });
      };
      this.addEventListener("change", (e) => { const t = e.target; if (t && t.classList.contains("c-file-upload__input")) { renderPreview(t.files); this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { files: t.files } })); } });
      // drag-drop already dispatches contour:change; also render preview there
      this.addEventListener("dragover", (e) => { e.preventDefault(); this.classList.add("is-dragover"); });
      this.addEventListener("dragleave", () => this.classList.remove("is-dragover"));
      this.addEventListener("drop", (e) => { e.preventDefault(); this.classList.remove("is-dragover"); const i = input(); if (i && e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) { try { i.files = e.dataTransfer.files; } catch (err) { /* some browsers disallow */ } const preview = this.querySelector(".c-file-upload__preview"); if (preview) { preview.innerHTML = ""; Array.from(e.dataTransfer.files).forEach((f) => { const item = document.createElement("div"); item.className = "c-file-upload__preview-item"; if (f.type && f.type.startsWith("image/")) { const img = document.createElement("img"); img.className = "c-file-upload__preview-thumb"; img.alt = f.name; try { img.src = URL.createObjectURL(f); } catch (err2) {} item.appendChild(img); } else { const name = document.createElement("span"); name.className = "c-file-upload__preview-name"; name.textContent = f.name; item.appendChild(name); } preview.appendChild(item); }); } this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { files: e.dataTransfer.files } })); } });
    }
  }
  define("contour-file-upload", ContourFileUpload);

/**
 * Notification Center: web component wrapper.
 * Attributes: `count`, `items`, `color`.
 */
class ContourNotificationCenter extends ContourBase {
    static get observed() { return ["count", "items", "color"]; }
    static get properties() { return { count: { attribute: "count" }, items: { attribute: "items" }, color: { attribute: "color" } }; }
    render() {
      this.classList.add("c-notification-center");
      const btn = this.ensure(".c-notification-center__trigger", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-notification-center__trigger"; el.type = "button"; el.innerHTML = '<span class="c-notification-center__bullet" aria-hidden="true"></span>'; el.setAttribute("aria-haspopup", "dialog"); el.setAttribute("aria-expanded", "false"); return el; });
      const color = this.getAttribute("color");
      const bullet = btn.querySelector(".c-notification-center__bullet");
      if (bullet && color) { bullet.style.background = color; bullet.dataset.color = color; }
      const count = this.getAttribute("count");
      let badge = btn.querySelector(".c-notification-center__badge");
      if (count && Number(count) > 0) {
        if (!badge) { badge = document.createElement("span"); badge.className = "c-notification-center__badge c-badge c-badge--dot"; btn.appendChild(badge); }
        badge.textContent = count;
      } else if (badge) { badge.remove(); }
      const panel = this.ensure(".c-notification-center__panel", () => { const el = document.createElement("div"); el.className = "c-notification-center__panel"; el.hidden = true; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Notifications"); return el; });
      // Slotted content: authored .c-notification-center__item children take
      // precedence over the JSON `items` attribute.
      const authoredItems = Array.from(this.querySelectorAll(":scope > .c-notification-center__item"));
      const items = this.getAttribute("items");
      if (authoredItems.length) {
        panel.innerHTML = "";
        authoredItems.forEach((it) => { panel.appendChild(it); });
      } else if (items) {
        try {
          const parsed = JSON.parse(items);
          panel.innerHTML = "";
          parsed.forEach((it) => {
            const row = document.createElement("div");
            row.className = "c-notification-center__item";
            row.setAttribute("tabindex", "0");
            row.setAttribute("role", "option");
            row.textContent = typeof it === "string" ? it : (it.text || it.title || "");
            panel.appendChild(row);
          });
        } catch (e) { /* keep */ }
      }
    }
    enhance() {
      if (this._wiredNotifCenter) return;
      this._wiredNotifCenter = true;
      this.addEventListener("click", (e) => {
        const btn = this.querySelector(".c-notification-center__trigger");
        const panel = this.querySelector(".c-notification-center__panel");
        if (btn && (e.target === btn || btn.contains(e.target))) {
          if (panel) { panel.hidden = !panel.hidden; btn.setAttribute("aria-expanded", String(!panel.hidden)); this.dispatchEvent(new CustomEvent(panel.hidden ? "contour:close" : "contour:open", { bubbles: true, composed: true })); }
        }
      });
      this.addEventListener("click", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".c-notification-center__item") : null;
        if (item && this.contains(item)) {
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { label: item.textContent } }));
        }
      });
      const docClick = (e) => {
        const panel = this.querySelector(".c-notification-center__panel");
        const btn = this.querySelector(".c-notification-center__trigger");
        if (panel && !panel.hidden && !this.contains(e.target)) { panel.hidden = true; if (btn) btn.setAttribute("aria-expanded", "false"); }
      };
      document.addEventListener("click", docClick);
      onDispose(this, () => document.removeEventListener("click", docClick));
      const keyHandler = (e) => {
        const panel = this.querySelector(".c-notification-center__panel");
        const btn = this.querySelector(".c-notification-center__trigger");
        if (e.key === "Escape" && panel && !panel.hidden) { panel.hidden = true; if (btn) { btn.setAttribute("aria-expanded", "false"); try { btn.focus(); } catch (err) {} } return; }
        if (!panel || panel.hidden) return;
        const items = Array.from(panel.querySelectorAll(".c-notification-center__item"));
        if (!items.length) return;
        const active = document.activeElement;
        const idx = items.indexOf(active);
        if (e.key === "ArrowDown") { e.preventDefault(); const next = items[Math.min(items.length - 1, idx + 1)] || items[0]; if (next) try { next.focus(); } catch (err) {} }
        else if (e.key === "ArrowUp") { e.preventDefault(); const prev = items[Math.max(0, idx - 1)] || items[items.length - 1]; if (prev) try { prev.focus(); } catch (err) {} }
      };
      document.addEventListener("keydown", keyHandler);
      onDispose(this, () => document.removeEventListener("keydown", keyHandler));
    }
  }
  define("contour-notification-center", ContourNotificationCenter);

/**
 * Stepper: web component wrapper.
 * Attributes: `steps`, `current`.
 */
class ContourStepper extends ContourBase {
    static get observed() { return ["steps", "current"]; }
    static get properties() { return { steps: { attribute: "steps" }, current: { attribute: "current" } }; }
    render() {
      this.classList.add("c-stepper");
      const steps = this.getAttribute("steps");
      const current = Number(this.getAttribute("current") || 0);
      const list = this.ensure(".c-stepper__list", () => { const el = document.createElement("ol"); el.className = "c-stepper__list"; return el; });
      list.innerHTML = "";
      // Slotted content: authored .c-stepper__step children take precedence.
      const authoredSteps = Array.from(this.querySelectorAll(":scope > .c-stepper__step"));
      let parsed = [];
      if (authoredSteps.length) {
        parsed = authoredSteps.map((el) => el.textContent.trim());
        authoredSteps.forEach((el) => el.remove());
      } else {
        try { parsed = steps ? JSON.parse(steps) : []; } catch (e) { parsed = []; }
      }
      parsed.forEach((s, i) => {
        const li = document.createElement("li");
        li.className = "c-stepper__step" + (i === current ? " is-current" : "") + (i < current ? " is-done" : "");
        if (i === current) li.setAttribute("aria-current", "step");
        li.textContent = typeof s === "string" ? s : (s.title || s.label || "");
        list.appendChild(li);
      });
      const nav = this.ensure(".c-stepper__nav", () => { const el = document.createElement("div"); el.className = "c-stepper__nav"; return el; });
      const prev = this.ensure(".c-stepper__prev", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-stepper__prev"; el.type = "button"; el.textContent = "Back"; return el; });
      const next = this.ensure(".c-stepper__next", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-stepper__next"; el.type = "button"; el.textContent = "Next"; return el; });
      if (!nav.contains(prev)) nav.appendChild(prev);
      if (!nav.contains(next)) nav.appendChild(next);
      if (nav.parentNode !== this) this.appendChild(nav);
    }
    enhance() {
      if (this._wiredStepper) return;
      this._wiredStepper = true;
      const go = (dir) => {
        const list = this.querySelector(".c-stepper__list");
        const total = list ? list.querySelectorAll(".c-stepper__step").length : 0;
        if (!total) return;
        let cur = Number(this.getAttribute("current") || 0);
        if (dir === "prev") cur = Math.max(0, cur - 1);
        else cur = Math.min(total - 1, cur + 1);
        this.setAttribute("current", String(cur));
        this.dispatchEvent(new CustomEvent("contour:step-change", { bubbles: true, composed: true, detail: { direction: dir, index: cur } }));
      };
      this.addEventListener("click", (e) => {
        const prev = e.target && e.target.closest ? e.target.closest(".c-stepper__prev") : null;
        const next = e.target && e.target.closest ? e.target.closest(".c-stepper__next") : null;
        if (prev && this.contains(prev)) go("prev");
        if (next && this.contains(next)) go("next");
      });
      this.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); go("prev"); }
        else if (e.key === "ArrowRight") { e.preventDefault(); go("next"); }
      });
    }
  }
  define("contour-stepper", ContourStepper);

/**
 * Virtual List: web component wrapper.
 * Attributes: `items`, `item-height`, `orientation`, `sticky`.
 */
class ContourVirtualList extends ContourBase {
    static get updateMode() { return "keyed"; }
    static get observed() { return ["items", "item-height", "orientation", "sticky"]; }
    static get properties() { return { items: { attribute: "items" }, "item-height": { attribute: "item-height" }, orientation: { attribute: "orientation" }, sticky: { attribute: "sticky", type: Boolean } }; }
    _items() {
      const items = this.getAttribute("items");
      let parsed = [];
      try { parsed = items ? JSON.parse(items) : []; } catch (e) { parsed = []; }
      return Array.isArray(parsed) ? parsed : [];
    }
    _itemHeight() {
      const h = Number(this.getAttribute("item-height"));
      return Number.isFinite(h) && h > 0 ? h : 28;
    }
    _autoHeight() {
      return this.getAttribute("item-height") === "auto";
    }
    render() {
      this.classList.add("c-virtual-list");
      this.setAttribute("role", "list");
      const scroller = this.ensure(".c-virtual-list__scroller", () => { const el = document.createElement("div"); el.className = "c-virtual-list__scroller"; return el; });
      scroller.setAttribute("role", "presentation");
      const horizontal = this.getAttribute("orientation") === "horizontal";
      scroller.style.overflowX = horizontal ? "auto" : "hidden";
      scroller.style.overflowY = horizontal ? "hidden" : "auto";
      const inner = this.ensure(".c-virtual-list__inner", () => { const el = document.createElement("div"); el.className = "c-virtual-list__inner"; el.style.position = "relative"; return el; });
      if (inner.parentNode !== scroller) scroller.appendChild(inner);
      this._renderWindow(scroller, inner, horizontal ? (scroller.scrollLeft || 0) : (scroller.scrollTop || 0));
    }
    _measureHeights(inner, horizontal) {
      const rows = Array.from(inner.querySelectorAll(".c-virtual-list__item"));
      return rows.map((r) => horizontal ? (r.getBoundingClientRect().width || 28) : (r.getBoundingClientRect().height || 28));
    }
    _renderWindow(scroller, inner, scrollTop) {
      const items = this._items();
      const ih = this._itemHeight();
      const horizontal = this.getAttribute("orientation") === "horizontal";
      const autoHeight = this._autoHeight();
      const viewportSize = horizontal ? (scroller.clientWidth || 320) : (scroller.clientHeight || 320);
      const total = items.length;
      // Reset measured heights when item count changes.
      if (this._vlItemCount !== total) { this._vlHeights = null; this._vlItemCount = total; }
      let heights = autoHeight ? this._vlHeights : null;
      let cumulative = null;
      if (autoHeight && heights && heights.length === total) {
        cumulative = [0];
        for (let i = 0; i < total; i++) cumulative.push(cumulative[i] + (heights[i] || 28));
      }
      const visibleCount = autoHeight && !cumulative ? total : (autoHeight ? Math.ceil(viewportSize / 28) + 6 : Math.ceil(viewportSize / ih) + 4);
      let start = 0;
      if (autoHeight && cumulative) {
        // binary search for start
        let lo = 0, hi = total;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (cumulative[mid] < (scrollTop || 0)) lo = mid + 1; else hi = mid;
        }
        start = Math.max(0, lo - 3);
      } else if (!autoHeight) {
        start = Math.floor((scrollTop || 0) / ih);
      }
      if (start < 0) start = 0;
      const end = autoHeight && cumulative
        ? Math.min(total, start + visibleCount)
        : Math.min(total, start + visibleCount);
      if (start > Math.max(0, total - visibleCount) && !autoHeight) start = Math.max(0, total - visibleCount);
      const topSpacerSize = autoHeight && cumulative ? cumulative[start] : (autoHeight ? 0 : start * ih);
      const bottomSpacerSize = autoHeight && cumulative ? Math.max(0, cumulative[total] - cumulative[end]) : (autoHeight ? 0 : Math.max(0, (total - end) * ih));
      inner.style.display = horizontal ? "flex" : "block";
      inner.style.width = horizontal && autoHeight ? "max-content" : "";
      inner.style.height = horizontal || autoHeight ? "" : (total * ih) + "px";
      inner.innerHTML = "";
      const top = document.createElement("div");
      top.className = "c-virtual-list__spacer c-virtual-list__spacer--top";
      top.style[horizontal ? "width" : "height"] = topSpacerSize + "px";
      inner.appendChild(top);
      for (let i = start; i < end; i++) {
        const row = document.createElement("div");
        row.className = "c-virtual-list__item";
        row.setAttribute("role", "listitem");
        // aria-rowindex omitted: not allowed on role="listitem" (axe aria-allowed-attr)
        row.setAttribute("tabindex", i === 0 ? "0" : "-1");
        row.textContent = typeof items[i] === "string" ? items[i] : (items[i].label || items[i].text || JSON.stringify(items[i]));
        if (this.hasAttribute("sticky") && items[i] && items[i].sticky) {
          row.style.position = "sticky";
          row.style.insetBlockStart = "0";
          row.style.zIndex = "1";
        }
        if (horizontal && !autoHeight) row.style.flex = "0 0 " + ih + "px";
        row.dataset.index = String(i);
        inner.appendChild(row);
      }
      const bottom = document.createElement("div");
      bottom.className = "c-virtual-list__spacer c-virtual-list__spacer--bottom";
      bottom.style[horizontal ? "width" : "height"] = bottomSpacerSize + "px";
      inner.appendChild(bottom);
      if (horizontal && !autoHeight) inner.style.width = (total * ih) + "px";
      // Measure heights in auto mode for future windowing.
      if (autoHeight && !this._vlHeights) {
        // defer measurement to next frame so layout is done
        requestAnimationFrame(() => {
          this._vlHeights = this._measureHeights(inner, horizontal);
          // re-render windowed now that heights known
          const s = scroller;
          const i = inner;
          if (s && i) this._renderWindow(s, i, s.scrollTop || 0);
        });
      }
    }
    enhance() {
      if (this._wiredVirtualList) return;
      this._wiredVirtualList = true;
      const scroller = () => this.querySelector(".c-virtual-list__scroller");
      const inner = () => this.querySelector(".c-virtual-list__inner");
      let raf = 0;
      const onScroll = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const s = scroller(); const i = inner();
          if (s && i) this._renderWindow(s, i, this.getAttribute("orientation") === "horizontal" ? s.scrollLeft : s.scrollTop);
        });
      };
      const s = scroller();
      if (s) {
        s.addEventListener("scroll", onScroll, { passive: true });
        onDispose(this, () => { s.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); });
      }
      // keyboard + selection
      this.addEventListener("keydown", (e) => {
        const rows = Array.from(this.querySelectorAll(".c-virtual-list__item"));
        if (!rows.length) return;
        const active = this.querySelector(".c-virtual-list__item:focus") || rows[0];
        const idx = rows.indexOf(active);
        let next = -1;
        if (e.key === "ArrowDown") next = Math.min(idx + 1, rows.length - 1);
        else if (e.key === "ArrowUp") next = Math.max(idx - 1, 0);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = rows.length - 1;
        else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const i = Number(active.dataset.index);
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: i, value: active.textContent } }));
          return;
        }
        if (next < 0 || next === idx) return;
        e.preventDefault();
        rows.forEach((r, i) => r.setAttribute("tabindex", i === next ? "0" : "-1"));
        try { rows[next].focus(); } catch (err) {}
      });
      this.addEventListener("click", (e) => {
        const row = e.target && e.target.closest ? e.target.closest(".c-virtual-list__item") : null;
        if (!row || !this.contains(row)) return;
        const i = Number(row.dataset.index);
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: i, value: row.textContent } }));
      });
    }
  }
  define("contour-virtual-list", ContourVirtualList);

/**
 * Command Palette: web component wrapper.
 * Attributes: `open`, `items`.
 */
class ContourCommandPalette extends ContourBase {
    static get observed() { return ["open", "items"]; }
    static get properties() { return { open: { attribute: "open", type: Boolean }, items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-command-palette");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
      if (!this.hasAttribute("aria-modal")) this.setAttribute("aria-modal", "true");
      if (!this.hasAttribute("popover")) this.setAttribute("popover", "auto");
      const search = this.ensure(".c-command-palette__search", () => { const el = document.createElement("input"); el.className = "c-input c-command-palette__search"; el.type = "search"; el.placeholder = "Search…"; el.setAttribute("aria-label", "Search commands"); return el; });
      const list = this.ensure(".c-command-palette__list", () => { const el = document.createElement("div"); el.className = "c-command-palette__list"; el.setAttribute("role", "listbox"); return el; });
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          list.innerHTML = "";
          parsed.forEach((it, i) => {
            const row = document.createElement("div");
            row.className = "c-command-palette__item";
            row.setAttribute("role", "option");
            row.id = this.id + "-opt-" + i;
            row.textContent = typeof it === "string" ? it : (it.label || it.title || "");
            row.dataset.index = String(i);
            row.dataset.label = row.textContent;
            list.appendChild(row);
          });
        } catch (e) { /* keep */ }
      }
    }
    show() { if (typeof this.showPopover === "function") { try { this.showPopover(); } catch (e) {} } this.classList.add("is-open"); }
    hide() { if (typeof this.hidePopover === "function") { try { this.hidePopover(); } catch (e) {} } this.classList.remove("is-open"); }
    toggle() { if (this.classList.contains("is-open") || this.matches(":popover-open")) this.hide(); else this.show(); }
    enhance() {
      this._wiredCmdPalette = true;
      const search = () => this.querySelector(".c-command-palette__search");
      const list = () => this.querySelector(".c-command-palette__list");
      const items = () => Array.from(this.querySelectorAll(".c-command-palette__item"));
      const visibleItems = () => items().filter((it) => !it.hidden);
      const setActive = (idx) => {
        const vis = visibleItems();
        vis.forEach((it, i) => it.classList.toggle("is-active", i === idx));
        const active = vis[idx];
        const s = search();
        if (s && active) s.setAttribute("aria-activedescendant", active.id);
        else if (s) s.removeAttribute("aria-activedescendant");
      };
      const filter = (q) => {
        const needle = (q || "").toLowerCase().trim();
        items().forEach((it) => {
          const label = (it.dataset.label || it.textContent || "").toLowerCase();
          it.hidden = needle !== "" && !label.includes(needle);
        });
        setActive(0);
      };
      const select = (it) => {
        if (!it) return;
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: Number(it.dataset.index), label: it.dataset.label || it.textContent } }));
        try { this.hidePopover(); } catch (e) {}
        this.classList.remove("is-open");
      };
      const s = search();
      if (s) {
        s.setAttribute("role", "combobox");
        s.setAttribute("aria-autocomplete", "list");
        s.setAttribute("aria-controls", list() ? list().id || "" : "");
        if (!list().id) list().id = this.id + "-list";
        s.setAttribute("aria-controls", list().id);
        s.addEventListener("input", (e) => filter(e.target.value));
        s.addEventListener("keydown", (e) => {
          const vis = visibleItems();
          const active = this.querySelector(".c-command-palette__item.is-active");
          let idx = active ? vis.indexOf(active) : -1;
          if (e.key === "ArrowDown") { e.preventDefault(); idx = Math.min(vis.length - 1, idx + 1); if (idx < 0) idx = 0; setActive(idx); }
          else if (e.key === "ArrowUp") { e.preventDefault(); idx = Math.max(0, idx - 1); if (vis.length && idx < 0) idx = 0; setActive(idx); }
          else if (e.key === "Home") { e.preventDefault(); setActive(0); }
          else if (e.key === "End") { e.preventDefault(); setActive(vis.length - 1); }
          else if (e.key === "Enter") { e.preventDefault(); if (active) select(active); }
          else if (e.key === "Escape") { e.preventDefault(); try { this.hidePopover(); } catch (e) {} this.classList.remove("is-open"); }
        });
      }
      // click selection
      this.addEventListener("click", (e) => {
        const it = e.target && e.target.closest ? e.target.closest(".c-command-palette__item") : null;
        if (it && this.contains(it) && !it.hidden) select(it);
      });
      // focus return on close
      let lastFocus = null;
      this.addEventListener("beforetoggle", (e) => {
        if (e.newState === "open") lastFocus = document.activeElement;
        else if (lastFocus && typeof lastFocus.focus === "function") { try { lastFocus.focus(); } catch (err) {} }
      });
      // Escape via popover light dismiss is handled by keydown above; also close on outside handled by popover.
      setActive(0);
    }
  }
  define("contour-command-palette", ContourCommandPalette);

/**
 * Badge Overflow: web component wrapper.
 * Attributes: `count`, `max`.
 */
class ContourBadgeOverflow extends ContourBase {
    static get observed() { return ["count", "max"]; }
    static get properties() { return { count: { attribute: "count" }, max: { attribute: "max" } }; }
    render() {
      this.classList.add("c-badge-overflow");
      const count = Number(this.getAttribute("count") || 0);
      const max = Number(this.getAttribute("max") || 3);
      const extra = Math.max(0, count - max);
      this.textContent = "";
      if (extra > 0) {
        const b = document.createElement("span");
        b.className = "c-badge c-badge-overflow__more";
        b.textContent = "+" + extra;
        this.appendChild(b);
      }
    }
  }
  define("contour-badge-overflow", ContourBadgeOverflow);

/**
 * Side Sheet: web component wrapper.
 * Attributes: `open`, `side`, `title`.
 */
class ContourSideSheet extends ContourBase {
    static get observed() { return ["open", "side", "title"]; }
    static get properties() { return { open: { attribute: "open", type: Boolean }, side: { attribute: "side" }, title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-side-sheet");
      this.setAttribute("role", "dialog");
      this.setAttribute("aria-modal", "true");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Side sheet");
      const side = this.getAttribute("side") || "end";
      this.classList.add("c-side-sheet--" + side);
      if (this.hasAttribute("open")) this.classList.add("is-open"); else this.classList.remove("is-open");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-side-sheet__title", () => { const el = document.createElement("div"); el.className = "c-side-sheet__title"; return el; });
        t.textContent = title;
      }
    }
    enhance() {
      if (this._wiredSideSheet) return;
      this._wiredSideSheet = true;
      let lastFocus = null;
      const close = () => this.removeAttribute("open");
      const keyHandler = (e) => {
        if (e.key === "Escape" && this.hasAttribute("open")) { e.preventDefault(); close(); return; }
        if (e.key === "Tab" && this.hasAttribute("open")) {
          const focusables = Array.from(this.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")).filter((el) => !el.hasAttribute("disabled"));
          if (!focusables.length) { e.preventDefault(); return; }
          const first = focusables[0], last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      };
      document.addEventListener("keydown", keyHandler);
      onDispose(this, () => document.removeEventListener("keydown", keyHandler));
      this.addEventListener("click", (e) => {
        if (e.target === this) close();
      });
      // Focus management: capture focus on open, restore on close.
      const obs = new MutationObserver(() => {
        if (this.hasAttribute("open")) {
          lastFocus = document.activeElement;
          const first = this.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
          if (first) try { first.focus(); } catch (err) {}
        } else if (lastFocus) {
          try { lastFocus.focus(); } catch (err) {}
          lastFocus = null;
        }
      });
      obs.observe(this, { attributes: true, attributeFilter: ["open"] });
      onDispose(this, () => obs.disconnect());
    }
  }
  define("contour-side-sheet", ContourSideSheet);

/**
 * Tour: web component wrapper.
 * Attributes: `steps`, `current`.
 */
class ContourTour extends ContourBase {
    static get observed() { return ["steps", "current"]; }
    static get properties() { return { steps: { attribute: "steps" }, current: { attribute: "current" } }; }
    render() {
      this.classList.add("c-tour");
      this.setAttribute("role", "dialog");
      this.setAttribute("aria-modal", "true");
      this.setAttribute("aria-label", "Tour");
      const steps = this.getAttribute("steps");
      const current = Number(this.getAttribute("current") || 0);
      let parsed = [];
      try { parsed = steps ? JSON.parse(steps) : []; } catch (e) { parsed = []; }
      const step = parsed[current] || {};
      const tip = this.ensure(".c-tour__tip", () => { const el = document.createElement("div"); el.className = "c-tour__tip"; return el; });
      tip.textContent = typeof step === "string" ? step : (step.text || step.title || "");
      const nav = this.ensure(".c-tour__nav", () => { const el = document.createElement("div"); el.className = "c-tour__nav"; return el; });
      const next = this.ensure(".c-tour__next", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-tour__next"; el.type = "button"; el.textContent = "Next"; return el; });
      if (!nav.contains(next)) nav.appendChild(next);
    }
    enhance() {
      if (this._wiredTour) return;
      this._wiredTour = true;
      const nextBtn = this.querySelector(".c-tour__next");
      if (nextBtn) try { nextBtn.focus(); } catch (err) {}
      this.addEventListener("click", (e) => {
        const next = e.target && e.target.closest ? e.target.closest(".c-tour__next") : null;
        if (next && this.contains(next)) this.dispatchEvent(new CustomEvent("contour:step-change", { bubbles: true, composed: true, detail: { direction: "next" } }));
      });
      const keyHandler = (e) => { if (e.key === "Escape") this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true })); };
      document.addEventListener("keydown", keyHandler);
      onDispose(this, () => document.removeEventListener("keydown", keyHandler));
    }
  }
  define("contour-tour", ContourTour);

/**
 * Tags Input: web component wrapper.
 * Attributes: `value`, `placeholder`, `disabled`, `error`, `help`.
 */
class ContourTagsInput extends ContourBase {
    static get observed() { return ["value", "placeholder", "disabled", "error", "help"]; }
    static get properties() { return { value: { attribute: "value" }, placeholder: { attribute: "placeholder" }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
    render() {
      this.classList.add("c-tags-input");
      const input = this.ensure(".c-tags-input__input", () => { const el = document.createElement("input"); el.className = "c-input c-tags-input__input"; el.type = "text"; el.setAttribute("aria-label", "Add tag"); return el; });
      input.placeholder = this.getAttribute("placeholder") || "Add tag…";
      if (this.hasAttribute("disabled")) { input.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
      else { input.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-tags-input__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-tags-input__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-tags-input__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
      const tags = this.getAttribute("value");
      let parsed = [];
      try { parsed = tags ? JSON.parse(tags) : []; } catch (e) { parsed = tags ? tags.split(",").map((s) => s.trim()).filter(Boolean) : []; }
      Array.from(this.querySelectorAll(".c-tags-input__tag")).forEach((n) => n.remove());
      parsed.forEach((t) => {
        const chip = document.createElement("span");
        chip.className = "c-tag c-tags-input__tag";
        chip.textContent = t;
        const rm = document.createElement("button");
        rm.className = "c-tags-input__remove";
        rm.type = "button";
        rm.textContent = "×";
        rm.dataset.value = t;
        chip.appendChild(rm);
        this.insertBefore(chip, input);
      });
    }
    enhance() {
      if (this._wiredTagsInput) return;
      this._wiredTagsInput = true;
      let live = this.querySelector(".c-tags-input__live");
      if (!live) { live = document.createElement("span"); live.className = "c-tags-input__live visually-hidden"; live.setAttribute("aria-live", "polite"); live.setAttribute("aria-atomic", "true"); this.appendChild(live); }
      const announce = (msg) => { if (live) live.textContent = msg; };
      this.addEventListener("keydown", (e) => {
        const input = this.querySelector(".c-tags-input__input");
        if (!input) return;
        if (e.key === "Enter" && e.target === input) {
          e.preventDefault();
          const v = input.value.trim();
          if (v) {
            let tags = [];
            try { tags = JSON.parse(this.getAttribute("value") || "[]"); } catch (err) { tags = (this.getAttribute("value") || "").split(",").map((s) => s.trim()).filter(Boolean); }
            if (!Array.isArray(tags)) tags = [];
            if (!tags.includes(v)) tags.push(v);
            this.setAttribute("value", JSON.stringify(tags));
            input.value = "";
            announce("Added " + v);
            this.dispatchEvent(new CustomEvent("contour:add", { bubbles: true, composed: true, detail: { value: v } }));
          }
        } else if (e.key === "Backspace" && e.target === input && input.value === "") {
          let tags = [];
          try { tags = JSON.parse(this.getAttribute("value") || "[]"); } catch (err) { tags = (this.getAttribute("value") || "").split(",").map((s) => s.trim()).filter(Boolean); }
          if (!Array.isArray(tags)) tags = [];
          if (tags.length) {
            const removed = tags.pop();
            this.setAttribute("value", JSON.stringify(tags));
            announce("Removed " + removed);
            this.dispatchEvent(new CustomEvent("contour:remove", { bubbles: true, composed: true, detail: { value: removed } }));
          }
        }
      });
      this.addEventListener("click", (e) => {
        const rm = e.target && e.target.closest ? e.target.closest(".c-tags-input__remove") : null;
        if (rm && this.contains(rm)) {
          const val = rm.dataset.value;
          let tags = [];
          try { tags = JSON.parse(this.getAttribute("value") || "[]"); } catch (err) { tags = (this.getAttribute("value") || "").split(",").map((s) => s.trim()).filter(Boolean); }
          if (!Array.isArray(tags)) tags = [];
          const next = tags.filter((t) => t !== val);
          this.setAttribute("value", JSON.stringify(next));
          announce("Removed " + val);
          this.dispatchEvent(new CustomEvent("contour:remove", { bubbles: true, composed: true, detail: { value: val } }));
        }
      });
    }
  }
  define("contour-tags-input", ContourTagsInput);

/**
 * Sortable List: web component wrapper.
 * Attributes: `items`.
 */
class ContourSortableList extends ContourBase {
    static get updateMode() { return "keyed"; }
    static get observed() { return ["items"]; }
    static get properties() { return { items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-sortable-list");
      const list = this.ensure(".c-sortable-list__list", () => { const el = document.createElement("ul"); el.className = "c-sortable-list__list"; return el; });
      const items = this.getAttribute("items");
      let parsed = [];
      try { parsed = items ? JSON.parse(items) : []; } catch (e) { parsed = []; }
      list.innerHTML = "";
      parsed.forEach((it, i) => {
        const li = document.createElement("li");
        li.className = "c-sortable-list__item";
        li.setAttribute("draggable", "true");
        li.dataset.index = String(i);
        const handle = document.createElement("span");
        handle.className = "c-sortable-list__handle";
        handle.textContent = "⋮⋮";
        handle.setAttribute("role", "button");
        handle.tabIndex = 0;
        li.appendChild(handle);
        const label = document.createElement("span");
        label.className = "c-sortable-list__label";
        label.textContent = typeof it === "string" ? it : (it.label || it.text || "");
        li.appendChild(label);
        list.appendChild(li);
      });
    }
    enhance() {
      if (this._wiredSortableList) return;
      this._wiredSortableList = true;
      const list = () => this.querySelector(".c-sortable-list__list");
      // Live region for position announcements.
      let live = this.querySelector(".c-sortable-list__live");
      if (!live) { live = document.createElement("span"); live.className = "c-sortable-list__live visually-hidden"; live.setAttribute("aria-live", "polite"); live.setAttribute("aria-atomic", "true"); this.appendChild(live); }
      const announce = (msg) => { if (live) live.textContent = msg; };
      const index = (li) => Array.from(list().children).indexOf(li);
      // Pointer drag reorder.
      let dragFrom = null;
      this.addEventListener("dragstart", (e) => {
        const li = e.target && e.target.closest ? e.target.closest(".c-sortable-list__item") : null;
        if (!li || !this.contains(li)) return;
        dragFrom = index(li);
        if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", String(dragFrom)); } catch (err) {} }
        li.classList.add("is-dragging");
      });
      this.addEventListener("dragover", (e) => {
        const li = e.target && e.target.closest ? e.target.closest(".c-sortable-list__item") : null;
        if (!li || !this.contains(li) || dragFrom === null) return;
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      });
      this.addEventListener("drop", (e) => {
        const li = e.target && e.target.closest ? e.target.closest(".c-sortable-list__item") : null;
        if (!li || !this.contains(li) || dragFrom === null) return;
        e.preventDefault();
        const to = index(li);
        const l = list();
        const fromLi = l.children[dragFrom];
        if (fromLi && dragFrom !== to) {
          if (dragFrom < to) l.insertBefore(fromLi, l.children[to + 1] || null);
          else l.insertBefore(fromLi, l.children[to]);
          const item = fromLi.querySelector(".c-sortable-list__label");
          announce((item ? item.textContent : "Item") + " moved to position " + (to + 1));
          this.dispatchEvent(new CustomEvent("contour:reorder", { bubbles: true, composed: true, detail: { from: dragFrom, to } }));
        }
        dragFrom = null;
        Array.from(l.children).forEach((n) => n.classList.remove("is-dragging"));
      });
      this.addEventListener("dragend", () => {
        dragFrom = null;
        const l = list();
        if (l) Array.from(l.children).forEach((n) => n.classList.remove("is-dragging"));
      });
      // Keyboard reorder.
      this.addEventListener("keydown", (e) => {
        const handle = e.target && e.target.closest ? e.target.closest(".c-sortable-list__handle") : null;
        if (!handle) return;
        const li = handle.closest(".c-sortable-list__item");
        if (!li) return;
        const l = list();
        const from = index(li);
        if (e.key === "ArrowUp" && li.previousElementSibling) {
          e.preventDefault();
          l.insertBefore(li, li.previousElementSibling);
          const to = index(li);
          const label = li.querySelector(".c-sortable-list__label");
          announce((label ? label.textContent : "Item") + " moved to position " + (to + 1));
          this.dispatchEvent(new CustomEvent("contour:move", { bubbles: true, composed: true, detail: { direction: "up", from, to } }));
          this.dispatchEvent(new CustomEvent("contour:reorder", { bubbles: true, composed: true, detail: { from, to } }));
        }
        if (e.key === "ArrowDown" && li.nextElementSibling) {
          e.preventDefault();
          l.insertBefore(li.nextElementSibling, li);
          const to = index(li);
          const label = li.querySelector(".c-sortable-list__label");
          announce((label ? label.textContent : "Item") + " moved to position " + (to + 1));
          this.dispatchEvent(new CustomEvent("contour:move", { bubbles: true, composed: true, detail: { direction: "down", from, to } }));
          this.dispatchEvent(new CustomEvent("contour:reorder", { bubbles: true, composed: true, detail: { from, to } }));
        }
      });
    }
  }
  define("contour-sortable-list", ContourSortableList);

/**
 * Swatch: web component wrapper.
 * Attributes: `color`, `selected`, `label`.
 */
class ContourSwatch extends ContourBase {
    static get observed() { return ["color", "selected", "label"]; }
    static get properties() { return { color: { attribute: "color" }, selected: { attribute: "selected", type: Boolean }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-swatch");
      const color = this.getAttribute("color") || "#000";
      this.style.setProperty("--swatch-color", color);
      if (this.hasAttribute("selected")) this.classList.add("is-selected");
      else this.classList.remove("is-selected");
      if (!this.hasAttribute("aria-label")) {
        const label = this.getAttribute("label") || color;
        this.setAttribute("aria-label", label);
      }
      if (!this.querySelector("button") && !this.querySelector("span")) {
        const btn = document.createElement("button");
        btn.className = "c-swatch__btn";
        btn.type = "button";
        this.appendChild(btn);
      }
    }
    enhance() {
      if (this._wiredSwatch) return;
      this._wiredSwatch = true;
      this.addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { value: this.getAttribute("color") } }));
      });
    }
  }
  define("contour-swatch", ContourSwatch);

/**
 * Calendar: web component wrapper.
 * Attributes: `value`.
 */
class ContourCalendar extends ContourBase {
    static get observed() { return ["value"]; }
    static get properties() { return { value: { attribute: "value" }, month: { attribute: "month" }, year: { attribute: "year" } }; }
    render() {
      this.classList.add("c-calendar");
      const now = new Date();
      const year = Number(this.getAttribute("year")) || now.getFullYear();
      const month = Number(this.getAttribute("month")) || now.getMonth();
      const header = this.ensure(".c-calendar__header", () => { const el = document.createElement("div"); el.className = "c-calendar__header"; return el; });
      header.innerHTML = "";
      const prev = document.createElement("button");
      prev.type = "button"; prev.className = "c-btn c-btn--sm c-calendar__prev"; prev.textContent = "‹"; prev.setAttribute("aria-label", "Previous month");
      const title = document.createElement("span");
      title.className = "c-calendar__title";
      title.textContent = new Date(year, month, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
      const next = document.createElement("button");
      next.type = "button"; next.className = "c-btn c-btn--sm c-calendar__next"; next.textContent = "›"; next.setAttribute("aria-label", "Next month");
      header.appendChild(prev); header.appendChild(title); header.appendChild(next);
      const grid = this.ensure(".c-calendar__grid", () => { const el = document.createElement("div"); el.className = "c-calendar__grid"; el.setAttribute("role", "grid"); return el; });
      grid.setAttribute("aria-label", title.textContent);
      grid.innerHTML = "";
      const first = new Date(year, month, 1);
      const startDay = first.getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const selected = this.getAttribute("value");
      for (let i = 0; i < startDay; i++) {
        const empty = document.createElement("div");
        empty.className = "c-calendar__day c-calendar__day--empty";
        grid.appendChild(empty);
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement("button");
        cell.className = "c-calendar__day";
        cell.type = "button";
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("tabindex", "0");
        cell.textContent = String(d);
        const iso = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
        if (iso === selected) { cell.classList.add("is-selected"); cell.setAttribute("aria-selected", "true"); }
        else cell.setAttribute("aria-selected", "false");
        const todayIso = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
        if (iso === todayIso) cell.setAttribute("aria-current", "date");
        cell.dataset.value = iso;
        grid.appendChild(cell);
      }
      if (header.parentNode !== this) this.insertBefore(header, grid);
    }
    enhance() {
      if (this._wiredCalendar) return;
      this._wiredCalendar = true;
      this.addEventListener("click", (e) => {
        const prev = e.target && e.target.closest ? e.target.closest(".c-calendar__prev") : null;
        const next = e.target && e.target.closest ? e.target.closest(".c-calendar__next") : null;
        if (prev && this.contains(prev)) {
          let m = Number(this.getAttribute("month")) || new Date().getMonth();
          let y = Number(this.getAttribute("year")) || new Date().getFullYear();
          m -= 1;
          if (m < 0) { m = 11; y -= 1; }
          this.setAttribute("month", String(m));
          this.setAttribute("year", String(y));
          this.render();
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { month: m, year: y } }));
          return;
        }
        if (next && this.contains(next)) {
          let m = Number(this.getAttribute("month")) || new Date().getMonth();
          let y = Number(this.getAttribute("year")) || new Date().getFullYear();
          m += 1;
          if (m > 11) { m = 0; y += 1; }
          this.setAttribute("month", String(m));
          this.setAttribute("year", String(y));
          this.render();
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { month: m, year: y } }));
          return;
        }
        const cell = e.target && e.target.closest ? e.target.closest(".c-calendar__day") : null;
        if (cell && this.contains(cell) && cell.dataset.value) {
          this.setAttribute("value", cell.dataset.value);
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { value: cell.dataset.value } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-calendar__day") : null;
        if (!cell || !this.contains(cell)) return;
        const cells = Array.from(this.querySelectorAll(".c-calendar__day:not(.c-calendar__day--empty)"));
        const idx = cells.indexOf(cell);
        let next = null;
        if (e.key === "ArrowRight") next = cells[idx + 1];
        else if (e.key === "ArrowLeft") next = cells[idx - 1];
        else if (e.key === "ArrowDown") next = cells[idx + 7];
        else if (e.key === "ArrowUp") next = cells[idx - 7];
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cell.click(); return; }
        if (next) { e.preventDefault(); try { next.focus(); } catch (err) {} }
      });
    }
  }
  define("contour-calendar", ContourCalendar);

/**
 * Carousel: web component wrapper.
 * Attributes: `items`, `index`.
 */
class ContourCarousel extends ContourBase {
    static get observed() { return ["items", "index"]; }
    static get properties() { return { items: { attribute: "items" }, index: { attribute: "index" } }; }
    _items() {
      const items = this.getAttribute("items");
      let parsed = [];
      try { parsed = items ? JSON.parse(items) : []; } catch (e) { parsed = []; }
      return Array.isArray(parsed) ? parsed : [];
    }
    _index() {
      const i = Number(this.getAttribute("index"));
      const items = this._items();
      if (Number.isFinite(i) && i >= 0 && i < items.length) return i;
      return 0;
    }
    render() {
      this.classList.add("c-carousel");
      this.setAttribute("role", "region");
      this.setAttribute("aria-roledescription", "carousel");
      const track = this.ensure(".c-carousel__track", () => { const el = document.createElement("div"); el.className = "c-carousel__track"; el.setAttribute("role", "group"); el.setAttribute("aria-roledescription", "slide container"); return el; });
      const items = this._items();
      track.innerHTML = "";
      const idx = this._index();
      items.forEach((it, i) => {
        const slide = document.createElement("div");
        slide.className = "c-carousel__slide" + (i === idx ? " is-active" : "");
        slide.setAttribute("role", "group");
        slide.setAttribute("aria-roledescription", "slide");
        slide.setAttribute("aria-label", (i + 1) + " of " + items.length);
        slide.setAttribute("aria-hidden", i === idx ? "false" : "true");
        slide.textContent = typeof it === "string" ? it : (it.label || it.text || "");
        slide.dataset.index = String(i);
        track.appendChild(slide);
      });
      const prev = this.ensure(".c-carousel__prev", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-carousel__prev"; el.type = "button"; el.textContent = "‹"; el.setAttribute("aria-label", "Previous slide"); return el; });
      const next = this.ensure(".c-carousel__next", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-carousel__next"; el.type = "button"; el.textContent = "›"; el.setAttribute("aria-label", "Next slide"); return el; });
      const status = this.ensure(".c-carousel__status", () => { const el = document.createElement("span"); el.className = "c-carousel__status"; el.setAttribute("aria-live", "polite"); return el; });
      status.textContent = (idx + 1) + " of " + items.length;
    }
    enhance() {
      if (this._wiredCarousel) return;
      this._wiredCarousel = true;
      const go = (dir) => {
        const items = this._items();
        if (!items.length) return;
        let idx = this._index();
        if (dir === "prev") idx = (idx - 1 + items.length) % items.length;
        else idx = (idx + 1) % items.length;
        this.setAttribute("index", String(idx));
        this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { index: idx, direction: dir } }));
      };
      this.addEventListener("click", (e) => {
        const prev = e.target && e.target.closest ? e.target.closest(".c-carousel__prev") : null;
        const next = e.target && e.target.closest ? e.target.closest(".c-carousel__next") : null;
        if (prev && this.contains(prev)) go("prev");
        if (next && this.contains(next)) go("next");
      });
      this.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); go("prev"); }
        else if (e.key === "ArrowRight") { e.preventDefault(); go("next"); }
        else if (e.key === "Home") { e.preventDefault(); this.setAttribute("index", "0"); this.render(); this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { index: 0, direction: "home" } })); }
        else if (e.key === "End") { e.preventDefault(); const last = this._items().length - 1; if (last >= 0) { this.setAttribute("index", String(last)); this.render(); this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { index: last, direction: "end" } })); } }
      });
    }
  }
  define("contour-carousel", ContourCarousel);

/**
 * Data Grid: web component wrapper.
 * Attributes: `columns`, `rows`, `page`, `filter`, `page-size`, `resizable`.
 */
class ContourDataGrid extends ContourBase {
    static get updateMode() { return "keyed"; }
  static get observed() { return ["columns", "rows", "page", "filter", "page-size", "resizable", "virtual", "row-height"]; }
  static get properties() { return { columns: { attribute: "columns" }, rows: { attribute: "rows" }, page: { attribute: "page" }, filter: { attribute: "filter" }, "page-size": { attribute: "page-size" }, resizable: { attribute: "resizable", type: Boolean }, virtual: { attribute: "virtual", type: Boolean }, "row-height": { attribute: "row-height" } }; }
    render() {
      this.classList.add("c-data-grid");
      if (this.hasAttribute("loading") || this.hasAttribute("error") || this.hasAttribute("empty")) {
        const table = this.ensure(".c-data-grid__table", () => { const el = document.createElement("table"); el.className = "c-table c-data-grid__table"; el.setAttribute("role", "grid"); return el; });
        const tbody = this.ensure("tbody", () => { const el = document.createElement("tbody"); return el; });
        if (tbody.parentNode !== table) table.appendChild(tbody);
        tbody.innerHTML = "";
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 1;
        td.style.textAlign = "center";
        td.style.color = "var(--color-text-muted)";
        if (this.hasAttribute("loading")) td.textContent = this.getAttribute("loading") || "Loading…";
        else if (this.hasAttribute("error")) td.textContent = this.getAttribute("error") || "Error";
        else td.textContent = this.getAttribute("empty") || "No data";
        tr.appendChild(td);
        tbody.appendChild(tr);
        // Wrap in a scroll container for virtualization of large datasets.
      let wrap = this.querySelector(".c-data-grid__wrap");
      if (!wrap) { wrap = document.createElement("div"); wrap.className = "c-data-grid__wrap"; wrap.style.maxHeight = "400px"; wrap.style.overflow = "auto"; }
      if (table.parentNode !== wrap) wrap.appendChild(table);
      if (wrap.parentNode !== this) this.appendChild(wrap);
        return;
      }
      const table = this.ensure(".c-data-grid__table", () => { const el = document.createElement("table"); el.className = "c-table c-data-grid__table"; el.setAttribute("role", "grid"); return el; });
      const thead = this.ensure("thead", () => { const el = document.createElement("thead"); return el; });
      const tbody = this.ensure("tbody", () => { const el = document.createElement("tbody"); return el; });
      if (thead.parentNode !== table) table.appendChild(thead);
      if (tbody.parentNode !== table) table.appendChild(tbody);
      const cols = this.getAttribute("columns");
      let parsedCols = [];
      try { parsedCols = cols ? JSON.parse(cols) : []; } catch (e) { parsedCols = []; }
      if (parsedCols.length && !thead.querySelector("tr")) {
        const tr = document.createElement("tr");
        parsedCols.forEach((c) => {
          const th = document.createElement("th");
          th.setAttribute("role", "columnheader");
          th.setAttribute("aria-sort", "none");
          th.setAttribute("tabindex", "0");
          th.textContent = typeof c === "string" ? c : (c.label || c.key || "");
          tr.appendChild(th);
        });
        thead.appendChild(tr);
      }
      if (this.hasAttribute("resizable")) {
        Array.from(thead.querySelectorAll("th")).forEach((th) => {
          th.style.position = "relative";
          th.setAttribute("data-resizable", "true");
        });
      }
      const rows = this.getAttribute("rows");
      let parsedRows = [];
      try { parsedRows = rows ? JSON.parse(rows) : []; } catch (e) { parsedRows = []; }
      table.setAttribute("aria-rowcount", String(parsedRows.length));
      table.setAttribute("aria-colcount", String(parsedCols.length));
      const filter = this.getAttribute("filter");
      if (filter) {
        const q = filter.toLowerCase();
        parsedRows = parsedRows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
      }
      const page = Number(this.getAttribute("page") || 1);
      const pageSize = Number(this.getAttribute("page-size") || 0);
      if (pageSize > 0) {
        const start = (page - 1) * pageSize;
        parsedRows = parsedRows.slice(start, start + pageSize);
      }
      this._dgCols = parsedCols;
      this._dgRows = parsedRows;
      this._dgFilteredRows = parsedRows;
      const virtual = this.hasAttribute("virtual") && !(Number(this.getAttribute("page-size")) > 0);
      if (virtual) {
        this._renderDataGridWindow(0);
      } else {
        tbody.innerHTML = "";
        parsedRows.forEach((r) => {
          const tr = document.createElement("tr");
          parsedCols.forEach((c) => {
            const key = typeof c === "string" ? c : (c.key || c.label || "");
            const td = document.createElement("td");
            td.setAttribute("role", "gridcell");
            td.setAttribute("tabindex", "0");
            td.textContent = r && r[key] != null ? r[key] : "";
            if (!String(td.textContent).trim()) td.setAttribute("aria-label", "Empty");
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
      }
      // Wrap in a scroll container for virtualization of large datasets.
      let wrap = this.querySelector(".c-data-grid__wrap");
      if (!wrap) { wrap = document.createElement("div"); wrap.className = "c-data-grid__wrap"; wrap.style.maxHeight = "400px"; wrap.style.overflow = "auto"; }
      if (table.parentNode !== wrap) wrap.appendChild(table);
      if (wrap.parentNode !== this) this.appendChild(wrap);
    }
    _rowHeight() {
      const h = Number(this.getAttribute("row-height"));
      return Number.isFinite(h) && h > 0 ? h : 32;
    }
    _renderDataGridWindow(scrollTop) {
      const table = this.querySelector(".c-data-grid__table");
      const tbody = table && table.querySelector("tbody");
      if (!tbody) return;
      const cols = this._dgCols || [];
      const rows = this._dgRows || [];
      const rh = this._rowHeight();
      const viewport = 400;
      const visibleCount = Math.ceil(viewport / rh) + 6;
      let start = Math.floor((scrollTop || 0) / rh);
      if (start < 0) start = 0;
      if (start > Math.max(0, rows.length - visibleCount)) start = Math.max(0, rows.length - visibleCount);
      const end = Math.min(rows.length, start + visibleCount);
      tbody.innerHTML = "";
      // top spacer
      if (start > 0) {
        const sp = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = Math.max(1, cols.length);
        td.style.blockSize = (start * rh) + "px";
        td.style.padding = "0";
        sp.appendChild(td);
        tbody.appendChild(sp);
      }
      for (let i = start; i < end; i++) {
        const r = rows[i];
        const tr = document.createElement("tr");
        tr.dataset.index = String(i);
        cols.forEach((c) => {
          const key = typeof c === "string" ? c : (c.key || c.label || "");
          const td = document.createElement("td");
          td.setAttribute("role", "gridcell");
          td.setAttribute("tabindex", "0");
          td.textContent = r && r[key] != null ? r[key] : "";
          if (!String(td.textContent).trim()) td.setAttribute("aria-label", "Empty");
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      }
      if (end < rows.length) {
        const sp = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = Math.max(1, cols.length);
        td.style.blockSize = ((rows.length - end) * rh) + "px";
        td.style.padding = "0";
        sp.appendChild(td);
        tbody.appendChild(sp);
      }
    }
    enhance() {
      if (this._wiredDataGrid) return;
      this._wiredDataGrid = true;
      const wrap = () => this.querySelector(".c-data-grid__wrap");
      const onScroll = () => {
        const w = wrap();
        if (w && this.hasAttribute("virtual")) this._renderDataGridWindow(w.scrollTop);
      };
      // attach after render creates wrap; use delegated listener on host
      this.addEventListener("scroll", (e) => {
        const w = e.target && e.target.classList && e.target.classList.contains("c-data-grid__wrap") ? e.target : null;
        if (w && this.hasAttribute("virtual")) this._renderDataGridWindow(w.scrollTop);
      }, true);
      let sortCol = -1, sortDir = "asc";
      this.addEventListener("keydown", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest("[role='gridcell'], [role='columnheader']") : null;
        if (!cell || !this.contains(cell)) return;
        const row = cell.parentElement;
        const table = this.querySelector(".c-data-grid__table");
        if (!table) return;
        const rows = Array.from(table.querySelectorAll("tr"));
        const ri = rows.indexOf(row);
        const ci = Array.from(row.children).indexOf(cell);
        let target = null;
        if (e.key === "ArrowRight") target = row.children[ci + 1];
        else if (e.key === "ArrowLeft") target = row.children[ci - 1];
        else if (e.key === "ArrowDown") target = rows[ri + 1] && rows[ri + 1].children[ci];
        else if (e.key === "ArrowUp") target = rows[ri - 1] && rows[ri - 1].children[ci];
        if (target) { e.preventDefault(); try { target.focus(); } catch (err) {} }
      });
      this.addEventListener("click", (e) => {
        const tr = e.target && e.target.closest ? e.target.closest("tr") : null;
        const th = e.target && e.target.closest ? e.target.closest("th") : null;
        if (tr && this.contains(tr) && !th) {
          const idx = Array.from(tr.parentElement.children).indexOf(tr);
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { row: idx } }));
        }
        if (th && this.contains(th)) {
          const idx = Array.from(th.parentElement.children).indexOf(th);
          if (sortCol === idx) sortDir = sortDir === "asc" ? "desc" : "asc";
          else { sortCol = idx; sortDir = "asc"; }
          // Re-render sorted rows.
          const table = this.querySelector(".c-data-grid__table");
          const tbody = table && table.querySelector("tbody");
          const thead = table && table.querySelector("thead");
          if (tbody && thead) {
            const cols = Array.from(thead.querySelectorAll("th")).map((h) => h.textContent);
            const rows = Array.from(tbody.querySelectorAll("tr")).map((tr) => Array.from(tr.querySelectorAll("td")).map((td) => td.textContent));
            rows.sort((a, b) => {
              const va = a[idx] || "", vb = b[idx] || "";
              const na = Number(va), nb = Number(vb);
              const cmp = (!isNaN(na) && !isNaN(nb)) ? na - nb : String(va).localeCompare(String(vb));
              return sortDir === "asc" ? cmp : -cmp;
            });
            tbody.innerHTML = "";
            rows.forEach((r) => {
              const tr = document.createElement("tr");
              r.forEach((v) => { const td = document.createElement("td"); td.textContent = v; tr.appendChild(td); });
              tbody.appendChild(tr);
            });
          }
          // Update aria-sort on headers.
          Array.from(thead.querySelectorAll("th")).forEach((h, i) => {
            h.setAttribute("aria-sort", i === idx ? (sortDir === "asc" ? "ascending" : "descending") : "none");
          });
          this.dispatchEvent(new CustomEvent("contour:sort", { bubbles: true, composed: true, detail: { column: idx, direction: sortDir } }));
        }
      });
      this.addEventListener("pointerdown", (e) => {
        if (!this.hasAttribute("resizable")) return;
        const th = e.target && e.target.closest ? e.target.closest("th[data-resizable]") : null;
        if (!th || !this.contains(th) || th.getBoundingClientRect().right - e.clientX > 10) return;
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = th.getBoundingClientRect().width;
        const index = Array.from(th.parentElement.children).indexOf(th);
        const move = (event) => {
          const width = Math.max(48, startWidth + event.clientX - startX);
          const table = this.querySelector(".c-data-grid__table");
          if (table) Array.from(table.rows).forEach((row) => { if (row.children[index]) row.children[index].style.inlineSize = width + "px"; });
        };
        const stop = () => window.removeEventListener("pointermove", move);
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", stop, { once: true });
        onDispose(this, stop);
      });
    }
  }
  define("contour-data-grid", ContourDataGrid);

/**
 * Tree Grid: web component wrapper.
 * Attributes: `items`, `expanded`.
 */
class ContourTreeGrid extends ContourBase {
    static get updateMode() { return "keyed"; }
    static get observed() { return ["items", "expanded"]; }
    static get properties() { return { items: { attribute: "items" }, expanded: { attribute: "expanded" } }; }
    _expandedSet() {
      const raw = this.getAttribute("expanded");
      if (!raw) return new Set();
      try { return new Set(JSON.parse(raw)); } catch (e) { return new Set([raw]); }
    }
    render() {
      this.classList.add("c-tree-grid");
      const table = this.ensure(".c-tree-grid__table", () => { const el = document.createElement("table"); el.className = "c-table c-tree-grid__table"; el.setAttribute("role", "treegrid"); return el; });
      table.setAttribute("aria-label", "Tree grid");
      const tbody = this.ensure("tbody", () => { const el = document.createElement("tbody"); return el; });
      if (tbody.parentNode !== table) table.appendChild(tbody);
      const items = this.getAttribute("items");
      let parsed = [];
      try { parsed = items ? JSON.parse(items) : []; } catch (e) { parsed = []; }
      const expanded = this._expandedSet();
      tbody.innerHTML = "";
      const rows = [];
      const renderNode = (node, depth, path) => {
        const tr = document.createElement("tr");
        tr.setAttribute("role", "row");
        tr.setAttribute("tabindex", "0");
        tr.setAttribute("aria-level", String(depth + 1));
        tr.dataset.path = path;
        const hasChildren = !!(node && Array.isArray(node.children) && node.children.length);
        if (hasChildren) {
          tr.setAttribute("aria-expanded", expanded.has(path) ? "true" : "false");
        }
        const td = document.createElement("td");
        td.setAttribute("role", "gridcell");
        td.style.paddingInlineStart = (depth * 1.25) + "rem";
        const label = (node && (node.label || node.text || node.name)) || "";
        if (hasChildren) {
          const toggle = document.createElement("button");
          toggle.type = "button";
          toggle.className = "c-tree-grid__toggle";
          toggle.textContent = expanded.has(path) ? "▾" : "▸";
          toggle.setAttribute("aria-label", (expanded.has(path) ? "Collapse" : "Expand") + " " + label);
          td.appendChild(toggle);
        }
        const span = document.createElement("span");
        span.className = "c-tree-grid__label";
        span.textContent = label;
        td.appendChild(span);
        tr.appendChild(td);
        tbody.appendChild(tr);
        rows.push(tr);
        if (hasChildren && expanded.has(path)) {
          node.children.forEach((c, i) => renderNode(c, depth + 1, path + "." + i));
        }
      };
      parsed.forEach((n, i) => renderNode(n, 0, String(i)));
      if (table.parentNode !== this) this.appendChild(table);
    }
    enhance() {
      if (this._wiredTreeGrid) return;
      this._wiredTreeGrid = true;
      const rows = () => Array.from(this.querySelectorAll("tr[role='row']"));
      this.addEventListener("click", (e) => {
        const toggle = e.target && e.target.closest ? e.target.closest(".c-tree-grid__toggle") : null;
        const tr = e.target && e.target.closest ? e.target.closest("tr[role='row']") : null;
        if (!tr || !this.contains(tr)) return;
        const path = tr.dataset.path;
        if (toggle) {
          e.preventDefault();
          const expanded = this._expandedSet();
          if (expanded.has(path)) expanded.delete(path); else expanded.add(path);
          this.setAttribute("expanded", JSON.stringify([...expanded]));
          this.dispatchEvent(new CustomEvent("contour:toggle", { bubbles: true, composed: true, detail: { path, expanded: expanded.has(path) } }));
        } else {
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { path } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const tr = e.target && e.target.closest ? e.target.closest("tr[role='row']") : null;
        if (!tr || !this.contains(tr)) return;
        const all = rows();
        const idx = all.indexOf(tr);
        const path = tr.dataset.path;
        const hasChildren = tr.getAttribute("aria-expanded") !== null;
        const expanded = this._expandedSet();
        if (e.key === "ArrowRight" && hasChildren && !expanded.has(path)) {
          e.preventDefault();
          expanded.add(path);
          this.setAttribute("expanded", JSON.stringify([...expanded]));
          this.dispatchEvent(new CustomEvent("contour:toggle", { bubbles: true, composed: true, detail: { path, expanded: true } }));
        } else if (e.key === "ArrowLeft" && hasChildren && expanded.has(path)) {
          e.preventDefault();
          expanded.delete(path);
          this.setAttribute("expanded", JSON.stringify([...expanded]));
          this.dispatchEvent(new CustomEvent("contour:toggle", { bubbles: true, composed: true, detail: { path, expanded: false } }));
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          if (all[idx + 1]) try { all[idx + 1].focus(); } catch (err) {}
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (all[idx - 1]) try { all[idx - 1].focus(); } catch (err) {}
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const toggle = tr.querySelector(".c-tree-grid__toggle");
          if (toggle) toggle.click();
        }
      });
    }
  }
  define("contour-tree-grid", ContourTreeGrid);


  // ---- Registration: the class-only wrappers run last ------------------
  //
  // Order is the contract. Every complex component above claims its own name and
  // define() skips a name already claimed -- which is why
  // <contour-menu items='["Cut"]'> builds a <ul> instead of only gaining a class.
  // Move this loop back above the complex components and the scaffolding half of
  // this file becomes dead code again: it did, and no gate noticed.
  // Explicit defines (not a loop) so the coverage gate and tooling can see them.
  define("contour-box", simple(["c-box"]));
  define("contour-cluster", simple(["c-cluster"]));
  define("contour-container", simple(["c-container"]));
  define("contour-row", simple(["c-row"]));
  define("contour-scrim", simple(["c-scrim"]));
  define("contour-stack", simple(["c-stack"]));




  // ---- Shadow DOM wrappers (opt-in) ------------------------------------
  //
  // Every block below already ships a light-DOM element; a shadow wrapper is not
  // extra capability, it is the same block handed to a consumer who wants an
  // isolated root and named parts to style through ::part(). So the two tables
  // name the same blocks and must stay in step with each other, which is what
  // the contract gate checks.
  //
  // A CSSStyleSheet is adoptable by any number of roots, so the document's
  // same-origin sheets are serialised and parsed ONCE and shared. Rebuilding
  // them per instance re-parsed the whole 190 kB sheet for every element a page
  // mounted. The cache is keyed on the sheet list, so a stylesheet linked after
  // load is still picked up by the next element.
  //
  // The key counts what each sheet holds, not just how many sheets there are and
  // what they are called: an inline <style> replaced by another inline <style>
  // leaves both unchanged, and a cache keyed on identity alone would hand the
  // next instance a parse of the sheet that is no longer on the page.
  let ADOPTED = null;
  let ADOPTED_KEY = "";
  const adoptedSheets = () => {
    let key = document.styleSheets.length + ":";
    for (const sheet of document.styleSheets) {
      let rules = -1;
      try { rules = sheet.cssRules.length; } catch (e) { /* cross-origin: unreadable */ }
      key += (sheet.href || "") + "~" + rules + "|";
    }
    if (ADOPTED && key === ADOPTED_KEY) return ADOPTED;
    ADOPTED_KEY = key;
    ADOPTED = [];
    // Collect every rule a sheet carries, descending into @imported sheets,
    // because adoptedStyleSheets cannot hold @import rules (the platform
    // rejects them) and the imported sheets are not separate top-level entries
    // in document.styleSheets. Skipping them would hand the shadow root an
    // empty sheet.
    const collect = (sheet, out) => {
      let rules;
      try { rules = sheet.cssRules; } catch (e) { return; }
      if (!rules) return;
      for (const r of rules) {
        if (r instanceof CSSImportRule) {
          if (r.styleSheet) collect(r.styleSheet, out);
        } else {
          try { out.push(r.cssText); } catch (e) { /* unreadable */ }
        }
      }
    };
    for (const sheet of document.styleSheets) {
      try {
        if (sheet.href && new URL(sheet.href).origin === location.origin) {
          const collected = [];
          collect(sheet, collected);
          const built = new CSSStyleSheet();
          if (collected.length) built.replaceSync(collected.join("\n"));
          ADOPTED.push(built);
        }
      } catch (e) { /* cross-origin or unreadable */ }
    }
    return ADOPTED;
  };

  // One base for every wrapper: adopt the sheets, clone the subclass template,
  // then keep the root's modifier classes in step with MODS on the host. The
  // base classes are snapshotted at construction, so a re-render cannot
  // accumulate a stale modifier the way an additive classList would.
  const _ShadowParent = (typeof HTMLElement !== "undefined") ? HTMLElement : Object;
  class ContourShadow extends _ShadowParent {
    static get observedAttributes() { return MODS; }
    constructor() {
      super();
      const root = this.attachShadow({ mode: "open" });
      const sheets = adoptedSheets();
      if (sheets.length) root.adoptedStyleSheets = sheets;
      root.appendChild(this.constructor.contourTemplate.content.cloneNode(true));
      this._shadowBase = root.firstElementChild ? root.firstElementChild.className : "";
    }
    // Subclasses with behaviour beyond the template override this.
    // Lifecycle note: listeners are attached to nodes inside the shadow root
    // (root-owned), not to the host, so they are collected when the root is
    // discarded on disconnect. No host-level disposers are required; the
    // root-owner invariant is what keeps this leak-free (R11-08).
    enhance(root) {
      if (!root) root = this.shadowRoot;
      if (!root) return;
      // ARIA setup is idempotent (guards on hasAttribute), so it re-runs on
      // slotchange to cover slotted content. Behaviour wiring is guarded by
      // wcClaim inside each wire* function, so it stays one-shot.
      // Native <button> already has an implicit role of "button"; do not
      // inject a redundant role (WAI-ARIA Rule 1).
      // ARIA: sync aria-expanded on disclosure/expandable details
      root.querySelectorAll("details").forEach((d) => {
        const summary = d.querySelector("summary");
        if (summary && !summary.hasAttribute("aria-expanded")) {
          summary.setAttribute("aria-expanded", String(d.open));
          d.addEventListener("toggle", () => {
            summary.setAttribute("aria-expanded", String(d.open));
          });
        }
      });
      // ARIA: ensure live regions have proper roles
      root.querySelectorAll("[data-live]").forEach((el) => {
        if (!el.hasAttribute("role")) el.setAttribute("role", "status");
        if (!el.hasAttribute("aria-live")) el.setAttribute("aria-live", "polite");
      });
      // ARIA: spinners and toasts get live region roles (opt-in: an author-set role wins)
      root.querySelectorAll(".c-spinner").forEach((el) => {
        if (!el.hasAttribute("role")) el.setAttribute("role", "status");
        if (!el.hasAttribute("aria-live")) el.setAttribute("aria-live", "polite");
      });
      // ARIA: toast elements get live region roles
      root.querySelectorAll(".c-toast, .c-toast-host").forEach((el) => {
        if (!el.hasAttribute("role")) el.setAttribute("role", "status");
        if (!el.hasAttribute("aria-live")) el.setAttribute("aria-live", "polite");
        if (!el.hasAttribute("aria-atomic")) el.setAttribute("aria-atomic", "true");
      });
      // ARIA: link tabs to panels via aria-controls
      root.querySelectorAll("[role='tab']").forEach((tab) => {
        const ctrl = tab.getAttribute("aria-controls");
        if (ctrl) {
          const panel = root.querySelector("#" + CSS.escape(ctrl)) || document.getElementById(ctrl);
          if (panel && !panel.hasAttribute("aria-labelledby")) {
            if (!tab.id) tab.id = contourId("tab");
            panel.setAttribute("aria-labelledby", tab.id);
          }
        }
      });
      // ARIA: link inputs to their labels/hints via aria-describedby
      root.querySelectorAll("input, textarea, select").forEach((input) => {
        if (input.hasAttribute("aria-describedby")) return;
        const field = input.closest(".c-field");
        if (field) {
          const hint = field.querySelector(".c-field__hint");
          if (hint) {
            if (!hint.id) hint.id = contourId("hint");
            input.setAttribute("aria-describedby", hint.id);
          }
          const err = field.querySelector(".c-field__error");
          if (err) {
            if (!err.id) err.id = contourId("err");
            const existing = input.getAttribute("aria-describedby") || "";
            input.setAttribute("aria-describedby", (existing + " " + err.id).trim());
          }
        }
      });
      // ARIA: alert elements get live region roles
      root.querySelectorAll(".c-alert").forEach((el) => {
        if (!el.hasAttribute("role")) el.setAttribute("role", "alert");
        if (!el.hasAttribute("aria-live")) el.setAttribute("aria-live", "assertive");
      });
      // ARIA: required form fields
      root.querySelectorAll("input[required], textarea[required], select[required]").forEach((el) => {
        if (!el.hasAttribute("aria-required")) el.setAttribute("aria-required", "true");
      });
      // Interaction is delegated to the implementation the light-DOM wrappers
      // call too. This file used to carry its own copy of every behaviour, and the
      // copy queried the root for nodes the author slots into the light DOM, so it
      // found none and wired nothing: measured against the shipped bundle, slotted
      // tabs reported 2 such nodes outside the root and 0 inside it. The shared
      // module looks in both trees and dispatches on the host, the only node an
      // outside listener can reach across a shadow boundary.
      // Behaviour wiring lives in connectedCallback (slotted content present)
      // and is re-run on slotchange; see connectedCallback.
    }
connectedCallback() {
       this.applyMods();
       try { this.enhance(this.shadowRoot); } catch (e) { /* ignore */ }
       // Wire behaviours now that slotted content is present.
       try {
         wcReset(this);
         wireTabs(this); wireSegmented(this); wireCombobox(this); wireTree(this);
         wireMenu(this); wirePagination(this); wireCopy(this); wireRemovable(this);
       } catch (e) { /* ignore */ }
       // Re-wire behaviour when slotted content changes. Reset the wired set so
       // behaviours can claim again now that slotted nodes exist.
       //
       // Guarded: this callback runs again whenever the host is moved in the
       // DOM, and attaching the listener unconditionally accumulated one per
       // move until a panel shuffled inside a tab re-wired on every slotchange
       // it had already handled.
       if (this.shadowRoot && !this._wiredSlotchange) {
         this._wiredSlotchange = true;
          this.shadowRoot.addEventListener("slotchange", () => {
            try { this.enhance(this.shadowRoot);
              wireTabs(this); wireSegmented(this); wireCombobox(this); wireTree(this);
              wireMenu(this); wirePagination(this); wireCopy(this); wireRemovable(this);
            } catch (e) { /* ignore */ }
          });
       }
     }
    attributeChangedCallback() { this.applyMods(); }
    applyMods() {
      const el = this.shadowRoot.firstElementChild;
      if (!el || !this._shadowBase) return;
      const mods = [];
      for (const attr of MODS) {
        const val = this.getAttribute(attr);
        if (!val) continue;
        for (const cls of this._shadowBase.split(/\s+/)) {
          if (cls) mods.push("c-" + cls.replace(/^c-/, "") + "--" + val);
        }
      }
      el.className = (this._shadowBase + " " + mods.join(" ")).trim();
    }
  }

  // Registers a wrapper. The template is parsed once into a <template> and
  // cloned per instance, so the markup below is the markup the root gets.
  const SHADOW_PARTS_PUBLIC = {};
  const shadow = (name, markup) => {
    if (typeof document === "undefined") return;
    const tpl = document.createElement("template");
    tpl.innerHTML = markup;
    SHADOW_PARTS_PUBLIC[name] = [...tpl.content.querySelectorAll("[part]")]
      .flatMap((node) => (node.getAttribute("part") || "").split(/\s+/))
      .filter(Boolean);
    const cls = class extends ContourShadow {};
    cls.contourTemplate = tpl;
    define(name, cls);
  };

  // A wrapper that is one default slot needs no markup of its own: the element,
  // the class, the part and the name all follow from the block, so the table
  // holds the block and the tag.
  const slotWrapper = (tag, block, part) =>
    "<" + tag + ' class="c-' + block + '" part="' + (part || block) + '"' + (tag === "button" ? ' type="button"' : "") + "><slot></slot></" + tag + ">";
  const SHADOW_SLOTS = {
    div: [
      "accordion", "activity", "advanced", "affordance", "affordances", "anchor", "app", "app-body", "box", "btn-group", "chart-grid",
      "catchment", "cluster", "command", "compare", "comparison", "compass",
      "contour-plot", "cta", "dash-freshness", "dash-kpi-row", "dash-shell", "dash-toolbar", "datamark", "delta", "draggable", "drag-handle", "drop-indicator", "drop-zone",
      "destructive-hint", "docs-shell", "drawer", "elevation",
      "filter-bar", "flow-map", "heatmap", "hexbin", "icon-badge", "input-group", "instrument", "range-scale", "resizable", "table-wrap", "time-range", "toast-host", "scroll-area",
      "isochrone", "landing-features", "landing-hero", "layer-panel", "layer-switch", "legend", "logos", "map-area",
      "map-footer", "map-panel", "map-slot", "measure", "metrics", "minimap", "pager", "pagination",
      "panel", "plate", "price", "pricing", "progress", "prose", "pullquote", "radio-list",
      "range", "readout", "recipe", "reserved", "resize-handle", "row",
      "row-action", "scale-bar", "scrim", "segmented", "sheet", "shortcut-list", "shortcut-overlay", "shortcut-panel",
      "shortcut-row", "showcase", "sidebar", "skeleton", "sparkline", "stack", "steps", "streaming-chart",
      "survey", "theme-scope", "time-slider", "timeline", "toast",
      "toolbar", "tooltip", "tree", "version", "version-banner"
    ],
    button: [
      "btn", "pressable", "scheme-toggle"
    ],
    span: [
      "avatar", "badge", "chip", "dot", "flag", "live-badge", "mark", "pill"
    ],
    a: [
      "link", "linkish"
    ],
    kbd: [
      "kbd"
    ],
    label: [
      "check", "radio", "switch"
    ],
    select: [
      "select"
    ],
    nav: [
      "docs-nav"
    ],
  };

  // Two wrappers name their part after the region it holds rather than after
  // the block, and one names it after the banner. Pinned here because the part
  // is the contract a consumer styles against. Declared before the loop that
  // reads it: a const in a temporal dead zone throws at load and takes the
  // whole file down with it.
  const SHADOW_PARTS = {
    "version-banner": "banner",
    "contour-plot": "plot",
  };

  if (typeof document !== "undefined") {
    for (const [tag, blocks] of Object.entries(SHADOW_SLOTS)) {
      for (const block of blocks) {
        const part = SHADOW_PARTS[block] || block;
        shadow("contour-shadow-" + block, slotWrapper(tag, block, part));
      }
    }
  }

  // Structured templates: more than one slot, or a class that is not the block's
  // own, so the markup is the definition and is written out.
  shadow("contour-shadow-callout", `<div class="c-callout" part="callout"><div class="c-callout__title" part="title"><slot name="title"></slot></div><div class="c-callout__body" part="body"><slot></slot></div><button class="c-callout__close" part="close" type="button" aria-label="Close">×</button></div>`);
  shadow("contour-shadow-empty", `<div class="c-empty" part="empty"><div class="c-empty__illustration" part="illustration"><slot name="illustration"></slot></div><div class="c-empty__title" part="title"><slot name="title"></slot></div><div class="c-empty__text" part="body"><slot></slot></div><div><slot name="action"></slot></div></div>`);
  shadow("contour-shadow-feature", `<div class="c-feature" part="feature"><span class="c-feature__index" part="index"><slot name="index"></slot></span><div class="c-feature__title" part="title"><slot name="title"></slot></div><div class="c-feature__body" part="body"><slot></slot></div></div>`);
  shadow("contour-shadow-kpi", `<div class="c-kpi" part="kpi"><div class="c-kpi__value" part="value"><slot name="value"></slot></div><div class="c-kpi__label" part="label"><slot name="label"></slot></div><div class="c-kpi__foot" part="foot"><slot name="delta"></slot><slot name="note"></slot></div></div>`);
  shadow("contour-shadow-stat", `<div class="c-stat" part="stat"><div class="c-stat__value" part="value"><slot name="value"></slot></div><div class="c-stat__label" part="label"><slot name="label"></slot></div><div class="c-stat__delta" part="delta"><slot name="delta"></slot></div></div>`);
  shadow("contour-shadow-meter", `<div class="c-meter" part="meter"><span class="c-meter__core" part="core"><span class="c-meter__value" part="value"><slot name="value"></slot></span><span class="c-meter__label" part="label"><slot name="label"></slot></span></span></div>`);
  shadow("contour-shadow-brownout", `<div class="c-brownout" part="brownout" data-level="0"><slot></slot></div>`);
  shadow("contour-shadow-widget-state", `<div class="c-widget-state" part="widget-state"><slot></slot></div>`);
  shadow("contour-shadow-donut", `<div class="c-donut" part="donut"><svg class="c-donut__ring" part="ring" viewBox="0 0 32 32"></svg><div class="c-donut__center" part="center"><slot name="value"></slot></div><div class="c-donut__list" part="list"><slot></slot></div></div>`);
  shadow("contour-shadow-axis", `<div class="c-axis" part="axis"><slot></slot></div>`);
  shadow("contour-shadow-brush", `<div class="c-brush" part="brush"><div class="c-brush__selection" part="selection"></div></div>`);
  shadow("contour-shadow-stacked-bar", `<div class="c-stacked-bar" part="bar"><slot></slot></div>`);
  shadow("contour-shadow-category", `<div class="c-category" part="category" role="listbox"><slot></slot></div>`);
  shadow("contour-shadow-gauge", `<div class="c-gauge" part="gauge"><svg class="c-gauge__dial" part="dial" aria-hidden="true" viewBox="0 0 100 100"><path class="c-gauge__track" part="track" d="M 10 90 A 40 40 0 0 1 90 90"></path><g class="c-gauge__zones"></g><line class="c-gauge__needle" part="needle" x1="50" y1="50" x2="50" y2="15"></line><circle class="c-gauge__hub" part="hub" cx="50" cy="50" r="4"></circle></svg><div class="c-gauge__value" part="value"><slot name="value"></slot></div><div class="c-gauge__band" part="band"><slot name="band"></slot></div></div>`);
  shadow("contour-shadow-diff", `<div class="c-diff" part="diff"><div class="c-diff__line c-diff__line--del" part="before"><span class="c-diff__sign">−</span><span><slot name="before"></slot></span></div><div class="c-diff__line c-diff__line--add" part="after"><span class="c-diff__sign">+</span><span><slot name="after"></slot></span></div></div>`);
  shadow("contour-shadow-do-dont", `<div class="c-do-dont" part="do-dont"><div class="c-do-dont__item c-do-dont__item--do" part="do"><slot name="do"></slot></div><div class="c-do-dont__item c-do-dont__item--dont" part="dont"><slot name="dont"></slot></div></div>`);
  shadow("contour-shadow-threshold", `<div class="c-threshold" part="threshold"><span class="c-threshold__fill" part="value"></span><span class="c-threshold__target" part="target"></span></div>`);
  shadow("contour-shadow-coordinate", `<div class="c-coordinate" part="coordinate"><span class="c-coordinate__value" part="value"><slot name="value"></slot></span></div>`);
  shadow("contour-shadow-install", `<div class="c-install" part="install"><span class="c-install__prompt" part="prompt"><slot name="prompt"></slot></span><span class="c-install__command" part="command"><slot name="command"></slot></span><button class="c-btn c-btn--ghost c-btn--sm c-install__copy" part="copy" type="button" aria-label="Copy command">Copy</button></div>`);
  shadow("contour-shadow-toc", `<div class="c-toc" part="toc"><div class="c-toc__title" part="title"><slot name="title"></slot></div><nav class="c-toc__list" part="list"><slot></slot></nav></div>`);
  shadow("contour-shadow-testimonial", `<div class="c-testimonial" part="testimonial"><blockquote class="c-testimonial__quote" part="quote"><slot name="quote"></slot></blockquote><div class="c-testimonial__byline" part="byline"><span class="c-testimonial__name" part="name"><slot name="name"></slot></span><span class="c-testimonial__role" part="role"><slot name="role"></slot></span></div></div>`);
  shadow("contour-shadow-search-trigger", `<button class="c-search-trigger" part="trigger"><span><slot name="label"></slot></span><kbd class="c-search-trigger__kbd"><slot name="shortcut"></slot></kbd></button>`);
  shadow("contour-shadow-brand", `<a class="c-brand" part="brand"><span class="c-mark" part="mark"><slot name="mark"></slot></span><span class="c-brand__name" part="name"><slot name="name"></slot></span></a>`);
  shadow("contour-shadow-section-head", `<div class="c-section-head" part="head"><h2 class="c-section-head__title" part="title"><slot name="title"></slot></h2><p class="c-section-head__desc" part="desc"><slot name="desc"></slot></p></div>`);
  shadow("contour-shadow-loading", `<div class="c-loading" part="loading"><span class="c-spinner" part="spinner"></span><slot></slot></div>`);
   // Shadow tabs are a styling shell: panels are authored by the consumer
   // (the light layer generates them from a `tabs` attribute). The default
   // slot below is the panel container; consumers place `c-tabs__panel`
   // elements (or any content) there. See §23 shadow-parity note.
   shadow("contour-shadow-tabs", `<div class="c-tabs" part="tabs"><div class="c-tabs__list" part="list" role="tablist"><slot name="tabs"></slot></div><div class="c-tabs__panels" role="presentation"><slot></slot></div></div>`);
  shadow("contour-shadow-breadcrumb", `<nav class="c-breadcrumb" part="breadcrumb" aria-label="Breadcrumb"><ol><slot></slot></ol></nav>`);
  shadow("contour-shadow-menu", `<div class="c-menu" part="menu" role="menu"><slot></slot></div>`);
  shadow("contour-shadow-combobox", `<div class="c-combobox" part="combobox"><input class="c-combobox__input" part="input" type="text" /><ul class="c-combobox__list" part="list" hidden><slot></slot></ul></div>`);
  shadow("contour-shadow-table", `<div class="c-table-wrap" part="wrap"><table class="c-table" part="table"><thead><slot name="head"></slot></thead><tbody><slot></slot></tbody></table></div>`);
  shadow("contour-shadow-chart", `<div class="c-chart" part="chart"><div class="c-chart__plot" part="plot"><slot></slot></div></div>`);
  shadow("contour-shadow-bivariate", `<div class="c-bivariate" part="bivariate"><div class="c-bivariate__matrix" part="matrix"><slot></slot></div></div>`);
  shadow("contour-shadow-bivariate-legend", `<div class="c-bivariate-legend" part="legend"><div class="c-bivariate-legend__matrix" part="matrix"><slot></slot></div></div>`);
  shadow("contour-shadow-expandable", `<details class="c-expandable" part="expandable"><summary class="c-expandable__summary"><slot name="summary"></slot></summary><div class="c-expandable__body" part="body"><slot></slot></div></details>`);
  shadow("contour-shadow-disclosure", `<details class="c-disclosure" part="disclosure"><summary><slot name="summary"></slot></summary><div class="c-disclosure__body" part="body"><slot></slot></div></details>`);
  shadow("contour-shadow-faq", `<div class="c-faq" part="faq"><div class="c-faq__question" part="question"><slot name="question"></slot></div><div class="c-faq__answer" part="answer"><slot name="answer"></slot></div></div>`);
   shadow("contour-shadow-code-tabs", `<div class="c-code-tabs" part="code-tabs"><div class="c-code-tabs__list" part="list" role="tablist"><slot name="tabs"></slot></div><div class="c-code-tabs__panels"><slot></slot></div></div>`);
  shadow("contour-shadow-header", `<header class="c-header" part="header"><div class="container c-header__inner" part="inner"><a class="c-brand" part="brand"><slot name="brand"></slot></a><nav class="c-header__nav" part="nav"><slot name="nav"></slot></nav><div class="c-header__actions" part="actions"><slot name="actions"></slot></div></div></header>`);
  shadow("contour-shadow-footer", `<footer class="c-footer" part="footer"><div class="container c-footer__grid" part="grid"><div class="c-footer__brand" part="brand"><slot name="brand"></slot></div><div class="c-footer__links" part="links"><slot name="links"></slot></div></div></footer>`);
  shadow("contour-shadow-container", `<div class="container" part="container"><slot></slot></div>`);
  shadow("contour-shadow-input", `<input class="c-input" part="input" />`);
  shadow("contour-shadow-spinner", `<span class="c-spinner" part="spinner" aria-label="Loading"></span>`);
  shadow("contour-shadow-textarea", `<textarea class="c-textarea" part="textarea"></textarea>`);
  shadow("contour-shadow-code", `<pre class="c-code" part="code"><code><slot></slot></code><button class="c-code__copy" part="copy" type="button">Copy</button></pre>`);
  // (folded in from the hand-written component that used to carry its own copy of the sheet logic)
  shadow("contour-shadow-card", `<div class="c-card" part="card"> <div class="c-card__title" part="head"><slot name="title">Untitled</slot></div> <div class="c-card__body" part="body"><slot></slot></div> <div class="c-card__foot" part="foot"><slot name="foot"></slot></div> </div>`);
  // (folded in from the hand-written component that used to carry its own copy of the sheet logic)
  // (folded in from the hand-written component that used to carry its own copy of the sheet logic)
  shadow("contour-shadow-field", `<div class="c-field" part="field"> <label class="c-field__label" part="label"><slot name="label">Label</slot></label> <slot name="input"></slot> <span class="c-field__hint" part="hint"><slot name="hint"></slot></span> </div>`);
  // (folded in from the hand-written component that used to carry its own copy of the sheet logic)
  shadow("contour-shadow-alert", `<div class="c-alert" part="alert"> <div class="c-alert__title" part="title"><slot name="title"></slot></div> <div class="c-alert__body" part="body"><slot></slot></div> <div class="c-alert__actions" part="actions"><slot name="action"></slot></div> <button class="c-alert__close" part="close" type="button" aria-label="Close">×</button> </div>`);
shadow("contour-shadow-tag", `<span class="c-tag" part="tag"><slot></slot><button class="c-tag__remove" part="remove" type="button" aria-label="Remove">×</button></span>`);
shadow("contour-shadow-filter-pill", `<span class="c-filter-pill" part="filter-pill"><slot></slot><button class="c-filter-pill__remove" part="remove" type="button" aria-label="Remove filter">×</button></span>`);

  // The dialog is the one wrapper with behaviour, because a close button that
  // does not close is a control the reader cannot use.
  class ContourShadowDialog extends ContourShadow {
    static contourTemplate = (typeof document !== "undefined") ? (() => {
      const tpl = document.createElement("template");
      tpl.innerHTML = "<dialog class=\"c-dialog\" part=\"dialog\"> <div class=\"c-dialog__head\" part=\"head\"> <slot name=\"title\"></slot> <button class=\"c-btn c-btn--icon c-btn--ghost\" part=\"close\" type=\"button\" aria-label=\"Close\"> <svg aria-hidden=\"true\"><use href=\"#i-close\" /></svg> </button> </div> <div class=\"c-dialog__body\" part=\"body\"><slot></slot></div> <div class=\"c-dialog__foot\" part=\"foot\"><slot name=\"foot\"></slot></div> </dialog>";
      return tpl;
    })() : null;
    enhance(root) {
      super.enhance(root);
      // The base constructor AND connectedCallback both call enhance; the base's
      // own edits are idempotent by guard, so this override must guard as well
      // or one native beforetoggle dispatches contour:open/close twice (measured
      // open:2/close:2 for a single show()/close(), shadow-dialog-events probe).
      if (this._wiredShadowDialog) return;
      this._wiredShadowDialog = true;
      const dlg = root.querySelector("dialog");
      const close = root.querySelector('[part="close"]');
      if (close) close.addEventListener("click", () => dlg?.close());
      if (dlg) {
        let lastFocus = null;
        // `<dialog>` fires no `show` or `close` events in this engine (measured
        // bare-dialog probe, 2026-10-28): the only open/close signal is
        // `beforetoggle` with a `newState`. The earlier `show`/`close` listeners
        // were dead code, so the shadow twin's contour:open/contour:close never
        // fired while the light twin's did — a parity break the dialog-family
        // probe caught at opened:0, closed:0.
        dlg.addEventListener("beforetoggle", (e) => {
          if (e.newState === "open") {
            lastFocus = document.activeElement;
            this.dispatchEvent(new CustomEvent("contour:open", { bubbles: true, composed: true }));
            // Focus the close button or first focusable element
            const focusable = dlg.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
            if (focusable) try { focusable.focus(); } catch (e) {}
          } else if (e.newState === "closed") {
            this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
            // Restore focus
            if (lastFocus && typeof lastFocus.focus === "function") {
              try { lastFocus.focus(); } catch (e) {}
            }
          }
        });
        // Focus trap: keep Tab within the dialog
        dlg.addEventListener("keydown", (e) => {
          if (e.key !== "Tab") return;
          const focusables = Array.from(dlg.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"));
          if (!focusables.length) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        });
      }
    }
    show() { this.shadowRoot?.querySelector("dialog")?.showModal(); }
    close() { this.shadowRoot?.querySelector("dialog")?.close(); }
  }
  define("contour-shadow-dialog", ContourShadowDialog);

  // Published once, at the end, so the array holds what the browser was actually
  // handed rather than what the source appears to say. Frozen: a page that
  // reshapes it would make the next reader's count wrong, which is the failure
  // this array exists to prevent.
  if (typeof window !== "undefined") {
    window.ContourElements = Object.freeze(REGISTERED.slice());
    window.ContourShadowParts = Object.freeze(Object.fromEntries(
      Object.entries(SHADOW_PARTS_PUBLIC).map(([name, parts]) => [name, Object.freeze([...new Set(parts)])]),
    ));
    // Same rule for the event vocabulary: the manifest is frozen at publish so a
    // page cannot add names the source never emitted, which would make the gate's
    // "every dispatchEvent name has an entry" read meaningless.
    window.ContourEvents = Object.freeze(CONTOUR_EVENTS);
  }

})();
