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
  /** Register teardown work for the host's current connection. */
  export const onDispose = (host, fn) => {
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
  export const contourId = (prefix) => prefix + "-" + (++_contourIdCounter).toString(36);

  /** Define a custom element once, while remaining safe in SSR runtimes. */
  export const define = (name, cls) => {
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
  export const MODS = ["variant", "size", "color"];

  // Every event this layer emits, with the payload keys each one carries and
  // its composed flag. This is the count — a number written anywhere would go
  // stale silently, so the gate compares the emitted names in the source
  // against THIS object, and the publish freezes it exactly like ContourElements.
  // Payload keys are the union of keys every emission site passes, read from
  // the source rather than invented: contour:select carries {series, index},
  // {index, label} and {value} across its sites, so all three are listed.
  /** Frozen event vocabulary with the public detail keys for each event. */
  export const CONTOUR_EVENTS = Object.freeze({
    "contour:activate": { payload: ["files", "label", "row", "value"], composed: true },
    "contour:add": { payload: ["value"], composed: true },
    "contour:activity-clear": { payload: [], composed: true },
    "contour:activity-filter": { payload: ["unread"], composed: true },
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
    "contour:change": { payload: ["checked", "color", "direction", "end", "files", "high", "index", "low", "month", "name", "paused", "query", "speed", "start", "unit", "value", "values", "year"], composed: true },
    "contour:collapse": { payload: ["collapsed"], composed: true },
      "contour:cluster-toggle": { payload: ["count", "expanded"], composed: true },
    "contour:clear": { payload: [], composed: true },
    "contour:clear-all": { payload: [], composed: true },
    "contour:close": { payload: ["count", "index", "label", "message", "open", "value"], composed: true },
    "contour:copy": { payload: ["text"], composed: true },
    "contour:apply": { payload: ["name"], composed: true },
    "contour:dash-action": { payload: ["label"], composed: true },
    "contour:diff-activate": { payload: ["kind", "text"], composed: true },
    "contour:dismiss": { payload: ["label"], composed: true },
    "contour:draw-start": { payload: ["mode"], composed: true },
    "contour:drag": { payload: ["delta", "key", "value"], composed: true },
    "contour:do-dont-activate": { payload: ["kind", "text"], composed: true },
    "contour:docs-nav-select": { payload: ["label", "href"], composed: true },
    "contour:dragend": { payload: ["value"], composed: true },
    "contour:dragstart": { payload: ["value"], composed: true },
    "contour:drop": { payload: ["value", "label"], composed: true },
    "contour:empty-action": { payload: ["state"], composed: true },
    "contour:filter": { payload: ["query"], composed: true },
    "contour:filter-change": { payload: ["source", "filter"], composed: true },
     "contour:error": { payload: ["src", "message", "name", "status"], composed: true },
     "contour:export": { payload: ["format"], composed: true },
     "contour:refresh": { payload: [], composed: true },
    "contour:hide": { payload: [], composed: true },
    "contour:hover": { payload: ["row"], composed: true },
    "contour:input": { payload: ["name", "value", "checked"], composed: true },
    "contour:inspect-action": { payload: ["label"], composed: true },
    "contour:layer-opacity": { payload: ["name", "opacity"], composed: true },
    "contour:layer-rename": { payload: ["name", "newName"], composed: true },
    "contour:layer-duplicate": { payload: ["name"], composed: true },
    "contour:layer-zoom": { payload: ["name"], composed: true },
    "contour:zoom": { payload: ["data", "index", "row"], composed: true },
    "contour:layer-projection": { payload: ["name", "projection"], composed: true },
    "contour:layer-remove": { payload: ["name"], composed: true },
    "contour:layer-reorder": { payload: ["layerIds"], composed: true },
    "contour:layer-toggle": { payload: ["name", "visible"], composed: true },
    "contour:layer-visibility": { payload: ["name", "visible"], composed: true },
    "contour:legend-toggle": { payload: ["index", "key", "label", "pressed"], composed: true },
    "contour:leave": { payload: [], composed: true },
    "contour:load": { payload: ["src", "count"], composed: true },
    "contour:map-control": { payload: ["control"], composed: true },
    "contour:map-attach": { payload: [], composed: true },
    "contour:map-detach": { payload: [], composed: true },
    "contour:map-popup-reposition": { payload: ["anchor", "flippedX", "flippedY", "left", "top"], composed: true },
    "contour:mode-change": { payload: ["mode"], composed: true },
    "contour:scope-change": { payload: ["scope"], composed: true },
    "contour:move": { payload: ["direction", "from", "to"], composed: true },
    "contour:open": { payload: [], composed: true },
    "contour:page": { payload: ["page"], composed: true },
    "contour:ready": { payload: ["version", "count"], composed: true },
    "contour:read": { payload: ["label"], composed: true },
    "contour:remove": { payload: ["key", "label", "name", "value"], composed: true },
    "contour:reorder": { payload: ["from", "to"], composed: true },
    "contour:range-change": { payload: ["value"], composed: true },
    "contour:resize": { payload: ["delta", "height", "value", "width"], composed: true },
    "contour:retry": { payload: ["src"], composed: true },
    "contour:loop-change": { payload: ["loop"], composed: true },
    "contour:pause": { payload: [], composed: true },
    "contour:play": { payload: [], composed: true },
    "contour:seek": { payload: ["progress", "value"], composed: true },
    "contour:select": { payload: ["area", "col", "expanded", "href", "index", "key", "label", "labels", "path", "result", "row", "rows", "series", "value"], composed: true },
    "contour:search": { payload: ["query"], composed: true },
    "contour:spatial-filter": { payload: ["action", "mode", "operator"], composed: true },
    "contour:split-change": { payload: ["value", "width", "height"], composed: true },
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
    "contour:toggle": { payload: ["collapsed", "expanded", "label", "open", "path", "playing"], composed: true },
    "contour:view-enter": { payload: [], composed: true },
    "contour:view-leave": { payload: [], composed: true },
  });

  // Shared HTML sanitizer (B3-18): allowlist via DOMParser instead of a
  // blacklist regex, so single-quoted, unquoted and javascript: payloads
  // cannot slip through.
  /** Sanitize consumer-provided HTML using a DOM allowlist. */
  export function sanitizeHtml(input) {
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
  /**
   * Validate a CSS colour for use in an inline style.
   *
   * Returns the trimmed value when it is a plain colour (named, hex, or a
   * known colour function) and an empty string otherwise. Anything that could
   * break out of the declaration, load a resource, or run script is rejected,
   * so a consumer-supplied `color` attribute cannot become an injection sink.
   *
   * @param {unknown} value candidate colour
   * @returns {string} the safe colour, or "" when rejected
   */
  export function safeColor(value) {
    const raw = String(value == null ? "" : value).trim();
    if (!raw) return "";
    if (/[;{}<>"'`\\]/.test(raw)) return "";
    if (/url\s*\(/i.test(raw) || /expression\s*\(/i.test(raw)) return "";
    if (/^#[0-9a-f]{3,8}$/i.test(raw)) return raw;
    if (/^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(/i.test(raw)) return raw;
    if (/^[a-z]+$/i.test(raw)) return raw;
    return "";
  }
  /**
   * Resolve an href candidate to a value that is safe to assign to a sink.
   *
   * Fragments, relative paths and the schemes we can vouch for pass through
   * unchanged; `javascript:`, `data:` and any other scheme collapse to "#".
   * This closes the attribute-to-property path that `sanitizeHtml` does not
   * cover, because assigning `a.href = "javascript:…"` executes on click.
   *
   * @param {unknown} value candidate href
   * @returns {string} the safe href, or "#"
   */
  export function safeHref(value) {
    const raw = String(value == null ? "" : value).trim();
    if (!raw) return "#";
    if (raw.startsWith("#") || raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../") || raw.startsWith("?")) return raw;
    if (typeof document === "undefined" || !document.baseURI) return "#";
    try {
      const url = new URL(raw, document.baseURI);
      return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) ? raw : "#";
    } catch (e) {
      return "#";
    }
  }
  /**
   * Read a length token from the document root, in pixels.
   *
   * Virtualized components used to hard-code 36/32/28 px row heights, which
   * disagreed with the rendered row and ignored density. The height is now a
   * token (`--data-grid-row-height`, …) and this reads its computed value.
   *
   * @param {string} name custom-property name
   * @param {number} fallback pixels to use when the token is absent or invalid
   * @returns {number} the resolved length in pixels
   */
  export function cssLength(name, fallback) {
    if (typeof getComputedStyle === "undefined" || typeof document === "undefined") return fallback;
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
    return Number.isFinite(v) && v > 0 ? v : fallback;
  }
  /**
   * Surface a malformed JSON attribute instead of swallowing it.
   *
   * A bare `catch (e) { /* keep existing *\/ }` turns a typo in a component
   * attribute into a silent no-op: the render keeps whatever was there before
   * and the defect is invisible. This warns once, with the component name and
   * the parser message, so the author can find it.
   *
   * @param {Element|null} host the component that owns the attribute
   * @param {string} label the attribute (or a short description)
   * @param {unknown} error the thrown parse error
   */
  export function warnBadJson(host, label, error) {
    if (typeof console === "undefined" || !console.warn) return;
    const name = host && host.tagName ? host.tagName.toLowerCase() : "component";
    const msg = (error && error.message) || String(error);
    console.warn(`[contour] ${name}: malformed ${label || "attribute"} — ${msg}`);
  }
  // contract: an attribute that is not here cannot ask an element to re-render,
  // and an attribute a component WRITES to itself must never be here, because
  // that write would fire the callback that performs the render.
  //
  // Excluded because the render bodies below set them on the host:
  //   role, open, aria-label, aria-valuenow, aria-valuemin, aria-valuemax, tabindex
  // Adding one of those back to this list makes that component recurse.
  /** Shared attribute vocabulary used by components that opt into defaults. */
  export const OBSERVED = [
    "accept", "action", "actions", "active", "after", "allow-duplicate", "allow-remove", "allow-rename", "allow-zoom", "alpha", "anchor", "answer", "area", "article", "attribution", "attribution-mark", "audit", "autoplay", "axis", "axis-x", "axis-y", "brownout", "brownout-level", "before", "body", "brand", "bounds", "breakpoint", "breaks", "brush", "brush-end", "brush-max", "brush-min", "brush-start", "cache-key", "canvas", "center", "clearable", "cols", "columns", "color", "command",
    "cells", "checked", "chrome", "confidence", "coverage", "debounce", "closable", "collapsed", "collapsible", "classification", "colors", "continuous", "content", "controls", "copyable", "count", "data", "data-table", "date", "delta",     "description", "glyphs", "graduated", "demo", "density", "desc", "dir", "direction", "disabled", "distance", "dismissible", "divider", "do", "dont", "dot", "ends", "high", "input", "layer", "low", "mode", "modes", "n", "opacity", "palette", "polarity", "precision", "range", "single",
    "empty", "exclusive", "fallback", "filename", "format", "heading", "help", "hint", "href", "icon", "illustration", "instrument", "interval", "items", "key", "layers", "level", "range-end", "range-start",
    "label", "labels", "lazy", "lede", "legend", "left-label", "right-label", "line", "limit", "link", "links", "live", "loading", "locale", "loop", "max", "media", "message", "method", "methodology", "menu", "min", "multiple", "name", "needle", "next", "no", "no-cache", "no-data-message", "nodes", "note", "norm", "normalize",
    "options", "orientation", "page-size", "pages", "pause", "paused", "pausable", "persist", "placeholder", "playing", "point", "points", "prev", "presets", "progress", "prompt", "question", "recent", "required",
    "quote", "ramp", "refresh", "removable", "resolution", "reverse", "rings", "retry", "results", "rows", "scale", "selectable", "segments", "show-header", "sparkline", "threshold", "thresholds", "selected", "separator", "series", "shortcut", "side", "size", "skeleton", "sort", "sort-dir", "speed", "status", "step", "submit", "submitting", "timeout", "trigger", "virtual", "sticky", "cluster-count", "cluster-expanded", "time", "resizable",
    "state", "steps", "style", "subtitle", "summary", "src", "source", "table", "tabs", "tag", "text", "ticks",     "title", "type", "unread-only", "unit", "updated", "cluster-items", "row-height",
    "variant", "values", "viewport", "warning", "yes", "zoomable", "x", "y",
    "caption", "current-time", "is-playing", "loop-label",     "no-data-color", "no-data-label", "property", "show-loop", "show-thumb", "show-thumb-caption", "speeds", "item-height", "pause-label", "play-label", "speed-label", "time-label", "shimmer",
    "search",
    "numbered",
    "bucket-count", "limit-values",
    "autocomplete", "levels", "submit-label",
  ];

  /** Resolve an authored heading level while keeping the fallback valid. */
  export function headingTag(host, fallback = "h3") {
    const v = host && host.getAttribute ? host.getAttribute("heading") : null;
    return /^h[1-6]$/.test(v || "") ? v : fallback;
  }

  /**
   * Resolve a localised label for a host (R18-63). A consumer supplies a
   * `labels` JSON attribute (e.g. `labels='{"clear":"Effacer"}'`); it is merged
   * over the English `fallback`, so a partial object localises only the keys it
   * names. A malformed attribute is ignored rather than thrown — a bad label
   * must not take the widget down. Returns `fallback` when no override exists.
   */
  export function label(host, key, fallback) {
    const def = fallback !== undefined ? fallback : key;
    const raw = host && host.getAttribute ? host.getAttribute("labels") : null;
    if (!raw) return def;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && typeof parsed[key] === "string" && parsed[key]) return parsed[key];
    } catch (e) { /* a malformed labels attribute is ignored, not fatal */ }
    return def;
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
  export class ContourBase extends _ContourBaseParent {
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
      const declared = new Set();
      for (const [name, spec] of Object.entries(props)) {
        const attr = (spec && spec.attribute) || name;
        declared.add(attr);
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
      // Default reflection (R18-54): every observed attribute a component reads
      // but does not declare in properties() still gets an accessor, so
      // `el.allowDuplicate = true` writes `allow-duplicate=""` instead of being
      // a silent no-op. The property name is the camelCase form of the
      // attribute (kebab -> camel); a kebab attribute with no valid identifier
      // form is skipped rather than guessed. Declared properties win.
      const observed = ctor.observed || OBSERVED;
      for (const attr of observed) {
        if (declared.has(attr)) continue;
        const prop = attr.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        if (!/^[a-zA-Z_$][\w$]*$/.test(prop)) continue;
        if (prop in ctor.prototype) continue; // an inherited accessor already exists
        const isBool = attr === "disabled" || attr === "checked" || attr === "required" || attr === "readonly" || attr === "multiple" || attr === "selected" || attr === "open" || attr === "hidden";
        Object.defineProperty(ctor.prototype, prop, {
          get() {
            const raw = this.getAttribute(attr);
            if (isBool) return raw !== null;
            return raw;
          },
          set(v) {
            if (v === null || v === undefined || v === false) this.removeAttribute(attr);
            else if (isBool) { if (v) this.setAttribute(attr, ""); else this.removeAttribute(attr); }
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
         const savedValues = savedControls.map((el) => ({
           key: el.name || el.id || null,
           preserveKey: el.getAttribute("data-contour-preserve-key") || null,
           value: el.value,
           checked: el.checked,
           type: el.type,
         }));
         // Preserve focus, scroll position and <details> open state across the
         // rebuild, so a host attribute change does not yank focus to <body>
         // or collapse an open disclosure.
          const hadFocus = this.contains(document.activeElement) ? document.activeElement : null;
          // Capture a recovery key for unkeyed active elements: an id is the
          // strongest key, then a `data-contour-preserve-key`, then a `name`,
          // then the relative index among all focusable controls inside the host.
          // Without these, an attribute update that rebuilds an unkeyed input
          // drops focus to <body>.
          const _focusableSelector = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
          const _focusablesBefore = Array.from(this.querySelectorAll(_focusableSelector));
          const hadFocusIndex = hadFocus ? _focusablesBefore.indexOf(hadFocus) : -1;
          const hadFocusKey = hadFocus ? (hadFocus.id || null) : null;
          const hadFocusPreserveKey = hadFocus ? (hadFocus.getAttribute("data-contour-preserve-key") || null) : null;
          const hadFocusName = hadFocus ? (hadFocus.getAttribute("name") || null) : null;
         const savedScrolls = Array.from(this.querySelectorAll("*")).filter((el) => el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth).map((el) => ({ el, id: el.id || null, preserveKey: el.getAttribute("data-contour-preserve-key") || null, top: el.scrollTop, left: el.scrollLeft }));
         const savedDetails = Array.from(this.querySelectorAll("details")).map((d) => ({ id: d.id || null, preserveKey: d.getAttribute("data-contour-preserve-key") || null, open: d.open }));
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
        const keyed = savedValues.filter((sv) => sv.key || sv.preserveKey);
        const unkeyed = savedValues.filter((sv) => !sv.key && !sv.preserveKey);
        const used = new Set();
        for (const el of newControls) {
          const key = el.name || el.id || el.getAttribute("data-contour-preserve-key") || null;
          if (!key) continue;
          const match = keyed.find((sv) => (sv.key === key || sv.preserveKey === key) && !used.has(sv));
          if (!match) continue;
          used.add(match);
          if (el.value === "" && el.getAttribute("value") === null) {
            el.value = match.value;
          }
           if ((el.type === "checkbox" || el.type === "radio") && typeof match.checked === "boolean" && !this._checkedAttrChanged) {
             el.checked = match.checked;
           }
        }
        // Restore unkeyed controls by type-aware index matching: group saved
        // unkeyed controls by type, then match new unkeyed controls by type and
        // index within that type group. This prevents misalignment when elements
        // are inserted or removed between renders (F-R4). A textarea removed
        // from the middle no longer shifts its value onto a following input.
        const savedByType = new Map();
        for (const sv of unkeyed) {
          const group = savedByType.get(sv.type) || [];
          group.push(sv);
          savedByType.set(sv.type, group);
        }
        const usedByType = new Map();
        for (const el of newControls) {
          if (el.name || el.id) continue;
          const type = el.type;
          const group = savedByType.get(type) || [];
          const used = usedByType.get(type) || 0;
          if (used >= group.length) continue;
          const saved = group[used];
          usedByType.set(type, used + 1);
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
        const keyedDetails = savedDetails.filter((sd) => sd.id || sd.preserveKey);
        const usedIds = new Set();
        for (const d of newDetails) {
          const id = d.id || null;
          const preserveKey = d.getAttribute("data-contour-preserve-key") || null;
          if (!id && !preserveKey) continue;
          const match = keyedDetails.find((sd) => (sd.id === id || sd.preserveKey === preserveKey) && !usedIds.has(sd.id || sd.preserveKey));
          if (!match) continue;
          usedIds.add(match.id || match.preserveKey);
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
        const keyedScrolls = savedScrolls.filter((s) => s.id || s.preserveKey);
        const usedScrolls = new Set();
        for (const el of newScrolls) {
          const id = el.id || null;
          const preserveKey = el.getAttribute("data-contour-preserve-key") || null;
          if (!id && !preserveKey) continue;
          const match = keyedScrolls.find((s) => (s.id === id || s.preserveKey === preserveKey) && !usedScrolls.has(s.el));
          if (!match) continue;
          usedScrolls.add(match.el);
          el.scrollTop = match.top;
          el.scrollLeft = match.left;
        }
        let si = 0;
        const plainScrolls = savedScrolls.filter((s) => !s.id && !s.preserveKey);
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
            if (hadFocusKey) {
              try { target = this.querySelector("#" + CSS.escape(hadFocusKey)); } catch (e) { target = null; }
            }
            if (!target && hadFocusPreserveKey) {
              try { target = this.querySelector('[data-contour-preserve-key="' + CSS.escape(hadFocusPreserveKey) + '"]'); } catch (e) { target = null; }
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
  export function withBrownout(Base) {
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
  /** Blocks whose custom elements need no generated markup. */
  export const CLASS_ONLY = [
    "box", "cluster", "container", "row", "scrim", "stack"
  ];

  // Feature detection for `hidden="until-found"` (BY-51). Browsers that do not
  // support it treat the value as the boolean hidden attribute, which would
  // hide the content permanently — so we only upgrade where supported.
  /** Detect support for the non-destructive `hidden="until-found"` value. */
  export function supportsUntilFound() {
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
  export function formatValue(value, format, locale, unit) {
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

  // Shared keyboard navigation for roving-tabindex patterns.
  // `items`: array of focusable elements, `e`: KeyboardEvent.
  // Options: `{ wrap (default true), enter (default true), homeEnd (false),
  //           onKey(key, idx, item) }` — return truthy to preventDefault.
  //           `onNavigate(newIdx)` — called after focus moves with new index.
  //           `rtl` — if true, ArrowRight/Left swap direction; defaults to dir attribute.
  /** Navigate a roving-tabindex group with arrow keys, Home/End, Enter/Space. */
  export function navKey(e, items, { wrap = true, enter = true, homeEnd = false, onKey, onNavigate, rtl } = {}) {
    const idx = items.indexOf(document.activeElement);
    if (idx < 0) return;
    let next = -1;
    // Determine direction: ArrowRight/Down always advance forward in LTR.
    // With RTL, ArrowRight goes back and ArrowLeft goes forward.
    const fwdKey = rtl ? "ArrowLeft" : "ArrowRight";
    const revKey = rtl ? "ArrowRight" : "ArrowLeft";
    if (e.key === fwdKey || e.key === "ArrowDown") next = wrap ? (idx + 1) % items.length : Math.min(idx + 1, items.length - 1);
    else if (e.key === revKey || e.key === "ArrowUp") next = wrap ? (idx - 1 + items.length) % items.length : Math.max(0, idx - 1);
    else if ((homeEnd || wrap) && e.key === "Home") next = 0;
    else if ((homeEnd || wrap) && e.key === "End") next = items.length - 1;
    if (next >= 0 && next !== idx) {
      e.preventDefault();
      try { items[next].focus(); } catch (_) {}
      if (onNavigate) onNavigate(next);
      if (onKey) onKey(e.key, idx, items[idx]);
    } else if ((enter || wrap) && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      if (onKey) onKey(e.key, idx, items[idx]);
    }
  }

  // Resolve RTL direction from element or document. Returns true for RTL layout.
  /** Check whether the given element uses right-to-left text direction. */
  export function isRtl(el) {
    let node = el;
    while (node && node.nodeType === 1) {
      const d = node.getAttribute && node.getAttribute("dir");
      if (d) return d.toLowerCase() === "rtl";
      node = node.parentElement;
    }
    try { return (typeof document !== "undefined" && (document.documentElement.getAttribute("dir") || "").toLowerCase() === "rtl"); }
    catch (e) { return false; }
  }

  // Spatial maths (BY-23): pure functions on the host's own attributes.
  // Haversine distance in meters between two lat/lon points.
  /** Return the great-circle distance between two latitude/longitude points. */
  export function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (d) => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }
  // Bearing in degrees (clockwise from north) from point 1 to point 2.
  /** Return the initial bearing from one latitude/longitude point to another. */
  export function bearing(lat1, lon1, lat2, lon2) {
    const toRad = (d) => d * Math.PI / 180;
    const toDeg = (r) => r * 180 / Math.PI;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }
  // Mercator resolution (meters per pixel) at a given latitude and zoom.
  /** Return meters per pixel for Web Mercator at a latitude and zoom level. */
  export function mercatorResolution(lat, zoom) {
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
export function arcPath(cx, cy, r, inner, startAngle, endAngle) {
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
export function donutSlices(values, opts) {
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
export function barRects(values, opts) {
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
export function polylinePoints(values, opts) {
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
export function smoothPath(values, opts) {
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
export function compassNeedle(cx, cy, length, angleDeg, width) {
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
export function scaleBarTicks(value, segments) {
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
export const MARKER_SHAPES = ["circle", "square", "triangle", "diamond", "star"];
/** Return CSS styles for a marker shape. */
export function markerStyles(shape) {
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
export function assignMarkers(items) {
  return (items || []).map((it, i) => ({ ...it, marker: MARKER_SHAPES[i % MARKER_SHAPES.length] }));
}

/* ---------------------------------------------------------------------------
 * Contour lines — marching squares over a 2D field.
 *
 * The same algorithm as tools/contour-gen.py, ported to the browser. Iso-lines
 * of different levels of one continuous field cannot cross; the asymptotic
 * saddle decider below is what guarantees that, so a hand-drawn path is never
 * a substitute. Shared by the `contour-contour-plot` element and the guide's
 * `data-contour-plot` renderer so the two cannot drift.
 * ------------------------------------------------------------------------- */

/**
 * Extract the iso-line segments of a scalar field at one level.
 *
 * @param {number[][]} grid row-major field values
 * @param {number} level iso-level to extract
 * @returns {Array<[{x:number,y:number},{x:number,y:number}]>} segments in grid space
 */
export function marchingSquares(grid, level) {
  const rows = grid.length;
  const cols = rows ? grid[0].length : 0;
  const segments = [];
  if (!rows || !cols) return segments;

  const lerp = (a, b, va, vb) => (vb === va ? 0.5 : (level - va) / (vb - va));

  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols - 1; x++) {
      const tl = grid[y][x];
      const tr = grid[y][x + 1];
      const bl = grid[y + 1][x];
      const br = grid[y + 1][x + 1];
      const code =
        (tl >= level ? 8 : 0) |
        (tr >= level ? 4 : 0) |
        (br >= level ? 2 : 0) |
        (bl >= level ? 1 : 0);
      if (code === 0 || code === 15) continue;

      const top = { x: x + lerp(tl, tr, tl, tr), y };
      const right = { x: x + 1, y: y + lerp(tr, br, tr, br) };
      const bottom = { x: x + lerp(bl, br, bl, br), y: y + 1 };
      const left = { x, y: y + lerp(tl, bl, tl, bl) };

      let connect;
      if (code === 5) {
        const center = (tl + tr + bl + br) / 4;
        connect = center >= level ? "top-bottom" : "left-right";
      } else if (code === 10) {
        const center = (tl + tr + bl + br) / 4;
        connect = center >= level ? "left-right" : "top-bottom";
      }

      switch (code) {
        case 1: case 14: segments.push([left, bottom]); break;
        case 2: case 13: segments.push([bottom, right]); break;
        case 3: case 12: segments.push([left, right]); break;
        case 4: case 11: segments.push([top, right]); break;
        case 6: case 9: segments.push([top, bottom]); break;
        case 7: case 8: segments.push([left, top]); break;
        case 5:
          if (connect === "top-bottom") {
            segments.push([top, bottom], [left, right]);
          } else {
            segments.push([top, right], [left, bottom]);
          }
          break;
        case 10:
          if (connect === "left-right") {
            segments.push([left, right], [top, bottom]);
          } else {
            segments.push([top, right], [left, bottom]);
          }
          break;
      }
    }
  }
  return segments;
}

/**
 * Build the SVG `d` path for every level of a field.
 *
 * @param {number[][]} grid row-major field values
 * @param {number[]} levels iso-levels, one path per level
 * @param {number} width viewBox width in px
 * @param {number} height viewBox height in px
 * @returns {Array<{level:number, d:string}>} one entry per level
 */
export function contourPaths(grid, levels, width, height) {
  const rows = grid.length;
  const cols = rows ? grid[0].length : 0;
  if (rows < 2 || cols < 2) return [];
  const sx = width / (cols - 1);
  const sy = height / (rows - 1);
  return (levels || []).map((level) => {
    const segs = marchingSquares(grid, level);
    let d = "";
    for (const [a, b] of segs) {
      d += `M ${(a.x * sx).toFixed(2)} ${(a.y * sy).toFixed(2)} L ${(b.x * sx).toFixed(2)} ${(b.y * sy).toFixed(2)} `;
    }
    return { level, d: d.trim() };
  });
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
export const wcReset = (host) => { WIRED_HOSTS.delete(host); };
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
/** Wire tab keyboard navigation and selection for a host. */
export function wireTabs(host) {
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
      if (!tab.id) tab.id = contourId("c-tab");
      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.tabIndex = selected ? 0 : -1;
        const ctrl = t.getAttribute("aria-controls");
        if (!ctrl) return;
        const panel = wcOne(host, "#" + CSS.escape(ctrl)) || document.getElementById(ctrl);
        if (panel) {
          panel.hidden = !selected;
          // A tabpanel is named by its tab: without this a screen reader
          // announces the panel with no name.
          if (selected) panel.setAttribute("aria-labelledby", t.id);
        }
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
    // Same-document View Transitions (BY-24). A tab swap runs inside
    // document.startViewTransition, so the browser cross-fades the whole
    // document between the old and new panel. This is a document cross-fade,
    // not a named-element morph: the component does not set
    // --view-transition-name, and a consumer who names elements gets the
    // browser's own morph on top of this. The initial mount activation below
    // stays direct — a transition on load is a page fade nobody asked for —
    // and the plain swap is the entire fallback, because the CSS harness
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
      if (tab && tabsOf().includes(tab)) {
        // A button nested inside a tab (a close control, say) is its own
        // target: activating the tab underneath it would be a surprise.
        const inner = e.target && e.target.closest ? e.target.closest("button") : null;
        if (inner && inner !== tab && tab.contains(inner)) return;
        runActivation(tab, false);
      }
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
export function wireSegmented(host) {
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
    navKey(e, opts, { wrap: false, homeEnd: true, rtl: isRtl(host), onNavigate: (i) => activate(opts[i]), onKey: () => activate(btn) });
  });
}

/**
 * Combobox: filter, arrow-cursor the visible options, commit, dismiss outside.
 * Native `<select>` stays native elsewhere — its popup cannot be styled — so the
 * one list this file drives is the one the system does draw.
 */
/** Wire combobox filtering, keyboard nav and selection for a host. */
export function wireCombobox(host) {
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
        : (opt.dataset.optionValue != null ? opt.dataset.optionValue : opt.textContent.trim());
      const position = selected.indexOf(String(value));
      if (now && position >= 0) selected.splice(position, 1);
      if (!now && position < 0) selected.push(String(value));
      host.setAttribute("value", selected.join(","));
      if (typeof host._syncFormValue === "function") host._syncFormValue();
      wcEmit(host, "contour:select", { value: selected });
      field.focus();
      return;
    }
    // Commit the option's value, not its label: the field shows the label, the
    // form submits the value, and `contour:select` carries the value.
    const value = opt.dataset.optionValue != null ? opt.dataset.optionValue : opt.textContent.trim();
    field.value = opt.textContent;
    host.setAttribute("value", value);
    if (typeof host._syncFormValue === "function") host._syncFormValue();
    wcEmit(host, "contour:select", { value });
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
export function wireTree(host) {
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
    navKey(e, items, { wrap: false, homeEnd: true, onNavigate: (i) => rove(items[i]) });
  });
}

/** Menu: roving focus over items, `contour:select` from key or pointer. */
/** Wire menu keyboard navigation and selection for a host. */
export function wireMenu(host) {
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

    navKey(e, its, { wrap: true, homeEnd: true, onKey: () => { if (e.key === "Enter" || e.key === " ") { const idx = its.indexOf(document.activeElement); if (idx >= 0 && !(target && target.getAttribute("aria-haspopup") === "menu")) { wcEmit(host, "contour:select", { index: idx, label: its[idx].textContent.trim() }); closeAllSubmenus(); } } } });
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
export function wirePagination(host) {
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
export function wireCopy(host) {
  if (!wcClaim(host, "copy")) return;
  wcListen(host, "click", (e) => {
    const btn = wcClosest(host, e.target, ".c-code__copy, .c-install__copy");
    if (!btn) return;
    const owner = wcClosest(host, btn, ".c-code") || wcClosest(host, btn, ".c-install") || host;
    const src = owner.querySelector("code, .c-install__command");
    // A numbered block carries its gutter as elements inside the <code>, so
    // `textContent` would copy the numbers and lose the line breaks between the
    // line spans. Read the lines back instead: the gutter is dropped, the breaks
    // are restored, and the clipboard gets the code the reader sees.
    const readSource = (el) => {
      const lines = el && el.querySelectorAll ? el.querySelectorAll(".c-code__line") : null;
      if (!lines || !lines.length) return el ? el.textContent || "" : "";
      return Array.from(lines).map((l) => Array.from(l.childNodes)
        .filter((n) => !(n.classList && n.classList.contains("c-code__line-number")))
        .map((n) => n.textContent).join("")).join("\n");
    };
    const text = readSource(src) || (src ? "" : owner.textContent) || "";
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
export function wireRemovable(host) {
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
export function modalContain(host, open) {
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
export const STATE_FALLBACK = {
  empty: "No data",
  loading: "Loading…",
  error: "Could not load.",
};

/**
 * Resolve a state label for a host (R18-63). A consumer supplies a `labels`
 * JSON attribute (e.g. `labels='{"loading":"Chargement…"}'`); it is merged over
 * the English default, so a partial object localises only the keys it names.
 * A malformed attribute is ignored rather than thrown — a bad label must not
 * take the widget down. Returns the default when no override is present.
 */
export function stateLabel(host, key) {
  const fallback = STATE_FALLBACK[key] || key;
  const raw = host && host.getAttribute ? host.getAttribute("labels") : null;
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed[key] === "string" && parsed[key]) return parsed[key];
  } catch (e) { /* a malformed labels attribute is ignored, not fatal */ }
  return fallback;
}

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
export function loadRemote(host, fields) {
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
export function remoteInvalidate(srcOrKey) {
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
export function remoteData(host, field) {
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
export function remoteRefresh(host) {
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
export function remoteVisible(host) {
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
export function watchViewport(host) {
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
export function renderStates(host, block, opts) {
  const options = opts || {};
  const loading = host.getAttribute("loading");
  if (loading !== null || host._remoteStatus === "loading") {
    host.appendChild(stateNode(block, "loading", loading || stateLabel(host, "loading")));
    return true;
  }
  const error = host.getAttribute("error");
  if (error !== null || host._remoteStatus === "error") {
    const message = (error !== null && error !== "") ? error : (host._remoteError || stateLabel(host, "error"));
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
export function renderEmpty(host, block) {
  host.appendChild(stateNode(block, "empty", host.getAttribute("empty") || stateLabel(host, "empty")));
}

// Delegated on the host (AGENTS.md rule 12): the retry button is regenerated on
// every render, so a listener bound to the node would be dropped by the next pass.
/** Wire state (loading/empty/error) interactions for a host. */
export function wireStates(host) {
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
      // Reuse a Declarative Shadow Root when the platform already attached one
      // (SSR/DSD hydration); otherwise create and populate the shadow root.
      let root = this.shadowRoot;
      if (!root) {
        root = this.attachShadow({ mode: "open" });
        if (this.constructor.contourTemplate) {
          root.appendChild(this.constructor.contourTemplate.content.cloneNode(true));
        }
      }
      const sheets = adoptedSheets();
      if (sheets.length) {
        try { root.adoptedStyleSheets = sheets; } catch (e) { /* unsupported or read-only */ }
      }
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

  // Registers a wrapper. The template markup is always recorded so Node/SSR
  // tooling can emit Declarative Shadow DOM strings; in a browser the template
  // is also parsed once into a <template> and cloned per instance.
  const SHADOW_PARTS_PUBLIC = {};
  const SHADOW_MARKUP = {};
  const recordParts = (name, markup) => {
    SHADOW_PARTS_PUBLIC[name] = [...markup.matchAll(/part="([^"]+)"/g)]
      .flatMap((m) => m[1].split(/\s+/))
      .filter(Boolean);
  };
  const shadow = (name, markup) => {
    SHADOW_MARKUP[name] = markup;
    recordParts(name, markup);
    if (typeof document === "undefined") return;
    const tpl = document.createElement("template");
    tpl.innerHTML = markup;
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
  const DIALOG_MARKUP = "<dialog class=\"c-dialog\" part=\"dialog\"> <div class=\"c-dialog__head\" part=\"head\"> <slot name=\"title\"></slot> <button class=\"c-btn c-btn--icon c-btn--ghost\" part=\"close\" type=\"button\" aria-label=\"Close\"> <svg aria-hidden=\"true\"><use href=\"#i-x\" /></svg> </button> </div> <div class=\"c-dialog__body\" part=\"body\"><slot></slot></div> <div class=\"c-dialog__foot\" part=\"foot\"><slot name=\"foot\"></slot></div> </dialog>";
  SHADOW_MARKUP["contour-shadow-dialog"] = DIALOG_MARKUP;
  recordParts("contour-shadow-dialog", DIALOG_MARKUP);
  class ContourShadowDialog extends ContourShadow {
    static contourTemplate = (typeof document !== "undefined") ? (() => {
      const tpl = document.createElement("template");
      tpl.innerHTML = DIALOG_MARKUP;
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

  /**
   * Render a Declarative Shadow DOM string for a registered contour-shadow-* element.
   * Intended for SSR/string emission; returns null for unknown tags.
   */
  const renderShadowDSD = (tag, attrs = "", light = "") => {
    const markup = SHADOW_MARKUP[tag];
    if (typeof markup !== "string") return null;
    const attrStr = attrs ? (attrs.startsWith(" ") ? attrs : " " + attrs) : "";
    return `<${tag}${attrStr}><template shadowrootmode="open">${markup}</template>${light}</${tag}>`;
  };

  // Published once, at the end, so the array holds what the browser was actually
  // handed rather than what the source appears to say. Frozen: a page that
  // reshapes it would make the next reader's count wrong, which is the failure
  // this array exists to prevent.
  const FROZEN_SHADOW_MARKUP = Object.freeze({ ...SHADOW_MARKUP });
  if (typeof globalThis !== "undefined") {
    globalThis.ContourShadowTemplates = FROZEN_SHADOW_MARKUP;
  }
  if (typeof window !== "undefined") {
    window.ContourElements = Object.freeze(REGISTERED.slice());
    window.ContourShadowParts = Object.freeze(Object.fromEntries(
      Object.entries(SHADOW_PARTS_PUBLIC).map(([name, parts]) => [name, Object.freeze([...new Set(parts)])]),
    ));
    // Same rule for the event vocabulary: the manifest is frozen at publish so a
    // page cannot add names the source never emitted, which would make the gate's
    // "every dispatchEvent name has an entry" read meaningless.
    window.ContourEvents = Object.freeze(CONTOUR_EVENTS);
    if (!window.Contour) window.Contour = {};
    try { window.Contour.shadowTemplates = FROZEN_SHADOW_MARKUP; } catch {}
  }

  export { SHADOW_MARKUP, renderShadowDSD };

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
            item.setAttribute("role", "button");
            item.setAttribute("tabindex", "-1");
            const dot = document.createElement("span");
            dot.className = "c-activity__dot c-activity__dot--" + (it.variant || "primary");
            dot.setAttribute("aria-hidden", "true");
            item.appendChild(dot);
            const text = document.createElement("span");
            text.className = "c-activity__text";
            text.textContent = typeof it === "string" ? it : (it.text || it.label || "");
            if (!item.hasAttribute("aria-label")) item.setAttribute("aria-label", text.textContent);
            item.appendChild(text);
            if (it.time) {
              const time = document.createElement("span");
              time.className = "c-activity__time";
              time.textContent = it.time;
              item.appendChild(time);
            }
            this.appendChild(item);
          });
        } catch (e) { warnBadJson(this, "attribute", e); }
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
        navKey(e, items, { wrap: false, homeEnd: true, onNavigate: (i) => { items.forEach((it, j) => it.tabIndex = j === i ? 0 : -1); }, onKey: () => { if (e.key === "Enter" || e.key === " ") { const idx = items.indexOf(document.activeElement); this.dispatchEvent(new CustomEvent("contour:activity-select", { bubbles: true, composed: true, detail: { index: idx, text: document.activeElement.querySelector(".c-activity__text")?.textContent || "" } })); } } });
      });
    }
  }
  define("contour-activity", ContourActivity);
class ContourActivityFeed extends ContourBase {
    static get observed() { return ["items", "filter", "unread-only", "empty", "loading", "error", "labels"]; }
    static get properties() { return { items: { attribute: "items" }, filter: { attribute: "filter" }, "unread-only": { attribute: "unread-only", type: Boolean } }; }
    render() {
      this.classList.add("c-activity-feed");
      this.setAttribute("role", "region");
      this.setAttribute("aria-label", "Activity feed");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "activity-feed")) return;
      const items = remoteData(this, "items");
      const filter = this.getAttribute("filter");
      const unreadOnly = this.hasAttribute("unread-only");
      let header = this.querySelector(".c-activity-feed__header");
      if (!header) { header = document.createElement("div"); header.className = "c-activity-feed__header"; this.insertBefore(header, this.firstChild); }
      let title = header.querySelector(".c-activity-feed__title");
      if (!title) { title = document.createElement("div"); title.className = "c-activity-feed__title"; header.appendChild(title); }
      title.textContent = label(this, "title", "Activity feed");
      let toolbar = this.querySelector(".c-activity-feed__toolbar");
      if (!toolbar) { toolbar = document.createElement("div"); toolbar.className = "c-activity-feed__toolbar"; this.appendChild(toolbar); }
      const clear = toolbar.querySelector(".c-activity-feed__clear") || (() => { const b = document.createElement("button"); b.type = "button"; b.className = "c-btn c-btn--ghost c-btn--sm"; b.textContent = label(this, "clear", "Clear all"); toolbar.appendChild(b); return b; })();
      const unreadBtn = toolbar.querySelector(".c-activity-feed__unread") || (() => { const b = document.createElement("button"); b.type = "button"; b.className = "c-btn c-btn--ghost c-btn--sm"; b.textContent = label(this, "unread", "Unread only"); toolbar.appendChild(b); return b; })();
      if (unreadOnly) unreadBtn.setAttribute("aria-pressed", "true");
      let list = this.querySelector(".c-activity-feed__list");
      if (!list) { list = document.createElement("ol"); list.className = "c-activity-feed__list"; this.appendChild(list); }
      if (items) {
        try {
          const parsed = JSON.parse(items);
          let filtered = parsed;
          if (filter) filtered = filtered.filter((it) => String(it.severity || it.type || "").toLowerCase() === filter.toLowerCase());
          if (unreadOnly) filtered = filtered.filter((it) => !it.read);
          Array.from(list.querySelectorAll(".c-activity-feed__item")).forEach((n) => n.remove());
          if (filtered.length === 0) {
            let empty = list.querySelector(".c-activity-feed__empty");
            if (!empty) { empty = document.createElement("div"); empty.className = "c-activity-feed__empty"; empty.textContent = label(this, "empty", "No activity"); list.appendChild(empty); }
          } else {
            const empty = list.querySelector(".c-activity-feed__empty");
            if (empty) empty.remove();
            filtered.forEach((it) => {
              const item = document.createElement("li");
              item.className = "c-activity-feed__item" + (it.read ? "" : " c-activity-feed__item--unread");
              item.setAttribute("role", "button");
              item.setAttribute("tabindex", "-1");
              const dot = document.createElement("span");
              dot.className = "c-activity-feed__dot c-activity-feed__dot--" + (it.severity || "info");
              dot.setAttribute("aria-hidden", "true");
              item.appendChild(dot);
              const text = document.createElement("span");
              text.className = "c-activity-feed__text";
              text.textContent = typeof it === "string" ? it : (it.text || it.label || "");
              item.appendChild(text);
              const time = document.createElement("time");
              time.className = "c-activity-feed__time";
              if (it.time) time.setAttribute("datetime", String(it.time));
              time.textContent = it.time || "";
              item.appendChild(time);
              const sev = document.createElement("span");
              sev.className = "c-activity-feed__severity";
              sev.textContent = it.severity || "";
              item.appendChild(sev);
              list.appendChild(item);
            });
          }
        } catch (e) { warnBadJson(this, "attribute", e); }
      }
    }
    enhance() {
      if (this._wiredActivityFeed) return;
      this._wiredActivityFeed = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest("button") : null;
        if (!btn || !this.contains(btn)) return;
        if (btn.textContent === "Clear all") {
          this.dispatchEvent(new CustomEvent("contour:activity-clear", { bubbles: true, composed: true, detail: {} }));
        } else if (btn.textContent === "Unread only") {
          this.toggleAttribute("unread-only");
          this.dispatchEvent(new CustomEvent("contour:activity-filter", { bubbles: true, composed: true, detail: { unread: this.hasAttribute("unread-only") } }));
        } else {
          const item = e.target.closest(".c-activity-feed__item");
          if (item && this.contains(item)) {
            const items = Array.from(this.querySelectorAll(".c-activity-feed__item"));
            const index = items.indexOf(item);
            const text = item.querySelector(".c-activity-feed__text")?.textContent || "";
            item.classList.remove("c-activity-feed__item--unread");
            this.dispatchEvent(new CustomEvent("contour:activity-select", { bubbles: true, composed: true, detail: { index, text } }));
          }
        }
      });
      this.addEventListener("keydown", (e) => {
        const items = Array.from(this.querySelectorAll(".c-activity-feed__item"));
        if (!items.length) return;
        navKey(e, items, { wrap: false, homeEnd: true, onNavigate: (i) => { items.forEach((it, j) => it.tabIndex = j === i ? 0 : -1); }, onKey: () => { if (e.key === "Enter" || e.key === " ") { const idx = items.indexOf(document.activeElement); this.dispatchEvent(new CustomEvent("contour:activity-select", { bubbles: true, composed: true, detail: { index: idx, text: document.activeElement.querySelector(".c-activity-feed__text")?.textContent || "" } })); } } });
      });
    }
  }
  define("contour-activity-feed", ContourActivityFeed);
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
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const name = this.getAttribute("name") || "";
          this.dispatchEvent(new CustomEvent("contour:affordance-activate", { bubbles: true, composed: true, detail: { name } }));
        }
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

