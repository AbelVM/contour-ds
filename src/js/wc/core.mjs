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
  export const REGISTERED = [];

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
  export const onDispose = (host, fn) => {
    let list = DISPOSERS.get(host);
    if (!list) { list = []; DISPOSERS.set(host, list); }
    list.push(fn);
  };
  const runDisposers = (host) => {
    const list = DISPOSERS.get(host);
    if (!list) return;
    DISPOSERS.delete(host);
    for (const fn of list) { try { fn(); } catch (e) { /* one bad cleanup cannot strand the rest */ } }
  };

  // Monotonic counter for unique IDs (avoids Math.random() collision risk).
  let _contourIdCounter = 0;
  export const contourId = (prefix) => prefix + "-" + (++_contourIdCounter).toString(36);

  export const define = (name, cls) => {
    if (customElements.get(name)) return;
    customElements.define(name, cls);
    REGISTERED.push(name);
  };

  // The attributes a consumer may set to ask for a modifier class. Both layers
  // read this one list: a wrapper that added a modifier from a different list is
  // how the light and shadow halves drifted apart over "color".
  export const MODS = ["variant", "size", "color"];

  // Every event this layer emits, with the payload keys each one carries and
  // its composed flag. This is the count — a number written anywhere would go
  // stale silently, so the gate compares the emitted names in the source
  // against THIS object, and the publish freezes it exactly like ContourElements.
  // Payload keys are the union of keys every emission site passes, read from
  // the source rather than invented: contour:select carries {series, index},
  // {index, label} and {value} across its sites, so all three are listed.
  export const CONTOUR_EVENTS = Object.freeze({
    "contour:activate": { payload: [], composed: true },
    "contour:activity-select": { payload: ["index", "text"], composed: true },
    "contour:advanced-toggle": { payload: ["title"], composed: true },
    "contour:affordance-activate": { payload: ["name"], composed: true },
    "contour:bearing": { payload: ["direction", "degrees"], composed: true },
    "contour:btn-group-change": { payload: ["index", "label"], composed: true },
    "contour:change": { payload: ["name", "value", "checked"], composed: true },
    "contour:close": { payload: [], composed: true },
    "contour:copy": { payload: ["text"], composed: true },
    "contour:dash-action": { payload: ["label"], composed: true },
    "contour:diff-activate": { payload: ["kind", "text"], composed: true },
    "contour:drag": { payload: ["value"], composed: true },
    "contour:do-dont-activate": { payload: ["kind", "text"], composed: true },
    "contour:docs-nav-select": { payload: ["label", "href"], composed: true },
    "contour:dragend": { payload: ["value"], composed: true },
    "contour:dragstart": { payload: ["value"], composed: true },
    "contour:drop": { payload: ["value", "label"], composed: true },
    "contour:empty-action": { payload: ["state"], composed: true },
    "contour:error": { payload: ["src", "message", "name", "status"], composed: true },
    "contour:hide": { payload: [], composed: true },
    "contour:input": { payload: ["name", "value", "checked"], composed: true },
    "contour:layer-opacity": { payload: ["name", "opacity"], composed: true },
    "contour:layer-toggle": { payload: ["name"], composed: true },
    "contour:layer-visibility": { payload: ["name", "visible"], composed: true },
    "contour:legend-toggle": { payload: ["label", "key", "pressed"], composed: true },
    "contour:load": { payload: ["src", "count"], composed: true },
    "contour:map-control": { payload: ["control"], composed: true },
    "contour:map-attach": { payload: [], composed: true },
    "contour:map-detach": { payload: [], composed: true },
    "contour:move": { payload: ["direction"], composed: true },
    "contour:open": { payload: [], composed: true },
    "contour:page": { payload: ["page"], composed: true },
    "contour:ready": { payload: ["version", "count"], composed: true },
    "contour:remove": { payload: ["label", "key", "value"], composed: true },
    "contour:range-change": { payload: ["value"], composed: true },
    "contour:retry": { payload: ["src"], composed: true },
    "contour:select": { payload: ["series", "index", "label", "value"], composed: true },
    "contour:showcase-activate": { payload: ["title"], composed: true },
    "contour:step-activate": { payload: ["index", "title"], composed: true },
    "contour:step-change": { payload: ["index", "title"], composed: true },
    "contour:show": { payload: [], composed: true },
    "contour:sort": { payload: ["column", "direction"], composed: true },
    "contour:stream-state": { payload: ["running"], composed: true },
    "contour:tab-change": { payload: ["index", "label"], composed: true },
    "contour:theme-change": { payload: ["theme"], composed: true },
    "contour:tick": { payload: ["frame"], composed: true },
    "contour:time-change": { payload: ["value"], composed: true },
    "contour:time-range-change": { payload: ["value"], composed: true },
    "contour:toggle": { payload: ["open", "label"], composed: true },
    "contour:view-enter": { payload: [], composed: true },
    "contour:view-leave": { payload: [], composed: true },
  });

  // Shared HTML sanitizer (B3-18): allowlist via DOMParser instead of a
  // blacklist regex, so single-quoted, unquoted and javascript: payloads
  // cannot slip through.
  export function sanitizeHtml(input) {
    const str = String(input == null ? "" : input);
    if (typeof DOMParser === "undefined") return str;
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
  export const OBSERVED = [
    "action", "actions", "after", "anchor", "answer", "area", "article", "attribution", "attribution-mark", "autoplay", "axis", "axis-x", "axis-y", "before", "body", "brand", "cache-key", "canvas", "center", "clearable", "cols", "columns", "color", "command",
    "cells", "checked", "chrome", "closable", "controls", "copyable", "count", "current", "date", "delta", "demo", "density", "desc", "dir", "direction", "disabled", "dismissible", "divider", "do", "dont", "dot",
    "empty", "error", "exclusive", "format", "heading", "hint", "href", "icon", "illustration", "index", "instrument", "interval", "items", "key",
    "label", "lazy", "lede", "legend", "line", "link", "links", "live", "loading", "locale", "max", "media", "message", "method", "min", "multiple", "name", "needle", "next", "no", "no-cache", "nodes", "note", "norm",
    "options", "orientation", "page-size", "pages", "pause", "paused", "pausable", "persist", "placeholder", "point", "points", "prev", "prompt", "question", "recent", "required",
    "quote", "ramp", "refresh", "removable", "reverse", "rings", "retry", "rows", "scale", "selectable", "selected", "separator", "series", "shortcut", "size", "skeleton", "sort", "sort-dir", "status", "submit", "timeout", "trigger", "virtual",
    "state", "steps", "subtitle", "summary", "src", "tabs", "tag", "text", "title", "type", "unit",
    "variant", "values", "viewport", "yes", "zoomable",
  ];

  export function headingTag(host, fallback = "h3") {
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
  export class ContourBase extends HTMLElement {
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

    // How many times this host has run `render()`, counting the first connect.
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
            if (raw === null) return spec && spec.default !== undefined ? spec.default : null;
            if (type === Boolean) return true;
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

  // Simple component: just adds CSS classes.
  export const simple = (classes) => class extends ContourBase {
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
  export const CLASS_ONLY = [
    "box", "cluster", "container", "row", "scrim", "stack"
  ];

  // Feature detection for `hidden="until-found"` (BY-51). Browsers that do not
  // support it treat the value as the boolean hidden attribute, which would
  // hide the content permanently — so we only upgrade where supported.
  export function supportsUntilFound() {
    try {
      const t = document.createElement("div");
      t.setAttribute("hidden", "until-found");
      return t.getAttribute("hidden") === "until-found";
    } catch (e) { return false; }
  }

  // Value formatting (BY-31): opt-in Intl formatting for kpi/stat/readout/coordinate.
  // `format` is a preset ("number","currency","percent","compact","date","time")
  // or a JSON string of Intl.NumberFormat/DateTimeFormat options. `locale`
  // defaults to the runtime locale. Returns the raw value when formatting fails.
  export function formatValue(value, format, locale) {
    if (!format) return value;
    const loc = locale || (typeof navigator !== "undefined" && navigator.language) || "en";
    if (format === "date" || format === "time") {
      try {
        const opts = format === "time" ? { timeStyle: "short" } : undefined;
        return new Intl.DateTimeFormat(loc, opts).format(new Date(value));
      } catch (e) { return value; }
    }
    let opts = {};
    if (format === "currency") opts = { style: "currency", currency: "USD" };
    else if (format === "percent") opts = { style: "percent" };
    else if (format === "compact") opts = { notation: "compact" };
    else if (format !== "number") {
      try { opts = JSON.parse(format); } catch (e) { return value; }
    }
    try { return new Intl.NumberFormat(loc, opts).format(Number(value)); }
    catch (e) { return value; }
  }


