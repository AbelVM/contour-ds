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
    "contour:brush-start": { payload: ["end", "range", "start", "value"], composed: true },
    "contour:brush-end": { payload: ["end", "range", "start", "value"], composed: true },
    "contour:brush": { payload: ["end", "range", "start", "value"], composed: true },
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
    "contour:select": { payload: ["area", "col", "expanded", "href", "index", "key", "label", "labels", "path", "range", "result", "row", "rows", "series", "value"], composed: true },
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
    "fields", "gap",
    "controls",
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
      // ARIA: alert elements are live regions, and the variant sets the volume.
      // A warning/danger interrupts; info/success/accent speaks politely. An
      // information alert that asserts itself on load talks over the reader.
      root.querySelectorAll(".c-alert").forEach((el) => {
        const urgent = el.classList.contains("c-alert--warning") || el.classList.contains("c-alert--danger");
        const role = urgent ? "alert" : "status";
        const live = urgent ? "assertive" : "polite";
        if (!el.hasAttribute("role") || el.dataset.contourAutoRole) {
          el.setAttribute("role", role);
          el.dataset.contourAutoRole = role;
        }
        if (!el.hasAttribute("aria-live") || el.dataset.contourAutoLive) {
          el.setAttribute("aria-live", live);
          el.dataset.contourAutoLive = live;
        }
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
      // An alert's live region follows its variant, and rewriting the class above
      // is the only signal a variant change produces. `dataset.contourAutoRole`
      // marks a role this code set, so an authored one is never overwritten.
      if (el.classList.contains("c-alert")) {
        const urgent = el.classList.contains("c-alert--warning") || el.classList.contains("c-alert--danger");
        const role = urgent ? "alert" : "status";
        const live = urgent ? "assertive" : "polite";
        if (!el.hasAttribute("role") || el.dataset.contourAutoRole) {
          el.setAttribute("role", role);
          el.dataset.contourAutoRole = role;
        }
        if (!el.hasAttribute("aria-live") || el.dataset.contourAutoLive) {
          el.setAttribute("aria-live", live);
          el.dataset.contourAutoLive = live;
        }
      }
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

  // The slot wrappers are recorded wherever this module runs. `shadow()` already
  // returns before touching `document` when there is none, so the markup is
  // available to Node/SSR either way — which is the whole point of recording it.
  // This loop used to sit inside the browser guard, so `renderShadowDSD` could
  // only resolve the 50 hand-written wrappers in Node and returned null for the
  // 121 slot wrappers, i.e. it failed in the one environment it exists for.
  for (const [tag, blocks] of Object.entries(SHADOW_SLOTS)) {
    for (const block of blocks) {
      const part = SHADOW_PARTS[block] || block;
      shadow("contour-shadow-" + block, slotWrapper(tag, block, part));
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
        } catch (e) { warnBadJson(this, "attribute", e); }
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
 * Attributes: `columns`, `rows`, `page`, `page-size`, `sort`, `sort-dir`, `virtual`, `title`, `empty`, `loading`, `error`, `retry`, `skeleton`, `persist`.
 */
class ContourTable extends ContourBase {
    static get updateMode() { return "keyed"; }
    static get observed() { return ["columns", "rows", "page", "page-size", "sort", "sort-dir", "virtual", "title", "empty", "loading", "error", "retry", "skeleton", "persist"]; }
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "region");
      // An authored label names the table; "Table" is the fallback.
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", this.getAttribute("title") || "Table");
      wireStates(this);
      loadRemote(this, "rows");
      if (renderStates(this, "table")) return;
      // The host is not a <table>, so it carries no table rule. The scroller the
      // reflow contract requires is a real block element inside it.
      const columns = this.getAttribute("columns");
      const rows = remoteData(this, "rows");
      // Slot composition: an authored table wins over the JSON attributes.
      const authored = Array.from(this.children).filter((n) => !n.classList || !n.classList.contains("c-table-wrap"));
      if (columns && rows && !authored.length) {
        try {
          const cols = JSON.parse(columns);
          const data = JSON.parse(rows);
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
          // Keep the row objects in memory instead of serializing each one into
          // a data-row attribute: the JSON duplicated the data the component
          // already holds and bloated every row.
          this._rowData = pageData;

          const wrap = this.ensure(".c-table-wrap", () => { const el = document.createElement("div"); el.className = "c-table-wrap"; return el; });
          // Reuse the existing table when columns are unchanged, rebuilding
          // only the body. This avoids O(n) DOM churn on row-only updates.
          const colsKey = JSON.stringify(cols);
          const table = (wrap.querySelector("table.c-table") && this._tableCols === colsKey)
            ? wrap.querySelector("table.c-table")
            : (() => {
                const t = document.createElement("table");
                t.className = "c-table";
                // A table needs a caption: the host's region label is outside the
                // table, so a reader who enters it hears column headers with no
                // statement of what the table is. Visually hidden keeps the block
                // layout unchanged.
                const captionEl = document.createElement("caption");
                captionEl.className = "visually-hidden";
                captionEl.textContent = this.getAttribute("title") || this.getAttribute("aria-label") || "Table";
                t.appendChild(captionEl);
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
                    // A placeholder is not a label: a reader who tabs into the
                    // filter hears "edit text" with no column name. Name it.
                    inp.setAttribute("aria-label", "Filter " + colLabel);
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
          const rowHeight = this._measuredRowHeight || cssLength("--data-grid-row-height", 36);
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
              // One tab stop per grid, not one per row: every row is -1 and the
              // arrow keys move a roving tabindex. A 1,000-row table was 1,000
              // tab stops before this.
              tr.setAttribute("tabindex", "-1");
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
          // Keep exactly one row in the tab order: the first rendered row when
          // none is active yet, so the grid is a single tab stop.
          if (!tbody.querySelector('tr[tabindex="0"]')) {
            const first = tbody.querySelector("tr[data-row-index]");
            if (first) first.setAttribute("tabindex", "0");
          }
          // Measure a real row so the virtual window uses the rendered height,
          // not a guess: the old fixed 36px disagreed with the measured 64.1px,
          // so the spacers and the scroll math were both wrong.
          if (!this._measuredRowHeight && !this._measuringRow) {
            const firstRow = tbody.querySelector("tr[data-row-index]");
            const h = firstRow ? firstRow.getBoundingClientRect().height : 0;
            if (h > 0) {
              this._measuredRowHeight = h;
              if (Math.abs(h - rowHeight) > 1) {
                this._measuringRow = true;
                requestAnimationFrame(() => { this._measuringRow = false; this.render(); });
              }
            }
          }
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
        } catch (e) { warnBadJson(this, "attribute", e); }
      } else if (!rows && !authored.length) {
        renderEmpty(this, "table");
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
        this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "table", filter: { sort: idx, sortDir: this._sortDir === 1 ? "ascending" : "descending" } } }));
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
            this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "table", filter: { page } } }));
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
        this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "table", filter: { column: idx, value: inp.value } } }));
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
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "table", filter: { selectedRows: Array.from(this._selectedRows) } } }));
          return;
        }
        const all = e.target && e.target.closest ? e.target.closest(".c-table__select-all") : null;
        if (all && this.contains(all)) {
          const cbs = Array.from(this.querySelectorAll(".c-table__row-select"));
          cbs.forEach((c) => { c.checked = all.checked; });
          this._selectedRows = new Set(all.checked ? cbs.map((c) => Number(c.dataset.rowIndex)) : []);
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { rows: Array.from(this._selectedRows) } }));
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "table", filter: { selectedRows: Array.from(this._selectedRows) } } }));
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
      // Map-linked table (R16-17): click-to-zoom on a row emits contour:zoom so
      // a map consumer can zoom to the corresponding feature. Contour stays
      // engine-agnostic: it only announces the row index and data.
      this.addEventListener("click", (e) => {
        const tr = e.target && e.target.closest ? e.target.closest("tbody tr") : null;
        if (!tr || !this.contains(tr)) return;
        const idx = Number(tr.dataset.rowIndex);
        if (!Number.isFinite(idx)) return;
        const rowData = (this._rowData && this._rowData[idx]) || null;
        this.dispatchEvent(new CustomEvent("contour:zoom", { bubbles: true, composed: true, detail: { row: idx, index: idx, data: rowData } }));
      });
      this.addEventListener("keydown", (e) => {
        const tr = e.target && e.target.closest ? e.target.closest("tbody tr") : null;
        if (!tr || !this.contains(tr)) return;
        const idx = Number(tr.dataset.rowIndex);
        if (!Number.isFinite(idx)) return;
        // Roving tabindex: arrows move the single tab stop, Home/End jump.
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
          const rows = Array.from(this.querySelectorAll("tbody tr[data-row-index]"));
          const at = rows.indexOf(tr);
          let next = at;
          if (e.key === "ArrowDown") next = Math.min(rows.length - 1, at + 1);
          else if (e.key === "ArrowUp") next = Math.max(0, at - 1);
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = rows.length - 1;
          if (next !== at && rows[next]) {
            e.preventDefault();
            rows.forEach((r) => r.setAttribute("tabindex", "-1"));
            rows[next].setAttribute("tabindex", "0");
            try { rows[next].focus(); } catch (err) {}
          }
          return;
        }
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true, detail: { row: idx } }));
      });
      // Cross-filter contract (R16-16): clear-all resets table sort/page/filter state.
      this.addEventListener("contour:clear-all", () => {
        let changed = false;
        if (this.hasAttribute("sort")) { this.removeAttribute("sort"); changed = true; }
        if (this.hasAttribute("sort-dir")) { this.removeAttribute("sort-dir"); changed = true; }
        if (this.hasAttribute("page")) { this.removeAttribute("page"); changed = true; }
        if (this._filters && Object.keys(this._filters).length) { this._filters = {}; changed = true; }
        if (changed) {
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "table", filter: { sort: null, sortDir: null, page: null, filters: null } } }));
          this.requestRender();
        }
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
 * Coerce a histogram bin into the published shape.
 *
 * A bin may arrive from the author (`series[].bins`) or be pushed by a binder
 * (`chart.bins = …`). Both go through here so `bins` reads back the same way
 * whichever door it came through, and a malformed entry is dropped rather than
 * rendered as NaN geometry.
 */
const normalizeChartBin = (bin) => {
  if (!bin || typeof bin !== "object") return null;
  const x0 = Number(bin.x0);
  const x1 = Number(bin.x1);
  const count = Number(bin.count);
  if (!Number.isFinite(x0) || !Number.isFinite(x1) || !Number.isFinite(count)) return null;
  const out = { x0, x1, count };
  const normalized = Number(bin.normalized);
  if (Number.isFinite(normalized)) out.normalized = normalized;
  return out;
};

/**
 * Chart: web component wrapper.
 * Attributes: `series`, `axis`, `empty`, `loading`, `error`, `retry`, `skeleton`, `zoomable`, `data-table`, `brush`, `brush-min`, `brush-max`, `brush-start`, `brush-end`.
 */
class ContourChart extends ContourBase {
    static get updateMode() { return "keyed"; }
  static get observed() { return ["series", "axis", "color", "empty", "loading", "error", "retry", "skeleton", "zoomable", "data-table", "brush", "brush-min", "brush-max", "brush-start", "brush-end", "note", "bucket-count", "limit-values"]; }
  static get properties() { return { series: { attribute: "series" }, axis: { attribute: "axis" }, color: { attribute: "color" }, zoomable: { attribute: "zoomable", type: Boolean }, brush: { attribute: "brush", type: Boolean }, note: { attribute: "note" }, "bucket-count": { attribute: "bucket-count" }, "limit-values": { attribute: "limit-values" } }; }
  // Bindable histogram contract (R18-68). A histogram consumer drives a widget
  // by assigning `bins` / `backgroundData` and reading `range`; libreship's
  // `bindHistogram` is the one this was written against, and it writes those
  // three as JS properties, not attributes. These accessors are the widget's
  // side of that contract: a push re-renders, and a read returns the bins
  // actually drawn rather than the last thing someone assigned.
  get bins() {
    const pushed = this._pushedBins;
    return (pushed && pushed.length ? pushed : this._renderedBins || []).map((b) => ({ ...b }));
  }
  set bins(value) {
    this._pushedBins = Array.isArray(value) ? value.map(normalizeChartBin).filter(Boolean) : [];
    this.requestRender();
  }
  get backgroundData() {
    const pushed = this._pushedBackground;
    return (pushed && pushed.length ? pushed : this._renderedBackground || []).map((b) => ({ ...b }));
  }
  set backgroundData(value) {
    this._pushedBackground = Array.isArray(value) ? value.map(normalizeChartBin).filter(Boolean) : [];
    this.requestRender();
  }
  // `range` is a JS property, not an attribute write: the chart observes
  // brush/brush-start/brush-end, so a setter that called `setAttribute` on
  // itself would fire the callback that renders it (wc-contract's re-entrancy
  // rule). The override is consumed by render() and never reflected back into
  // attributes, which stay the author's.
  _showsBrush() {
    return this.hasAttribute("brush") || this._rangeOverride !== undefined;
  }
  get range() {
    const override = this._rangeOverride;
    if (override !== undefined) return override ? override.slice() : null;
    if (!this.hasAttribute("brush")) return null;
    const start = parseFloat(this.getAttribute("brush-start"));
    const end = parseFloat(this.getAttribute("brush-end"));
    return Number.isFinite(start) && Number.isFinite(end) ? [start, end] : null;
  }
  set range(value) {
    if (value == null) {
      this._rangeOverride = null;
      this.requestRender();
      return;
    }
    const pair = Array.isArray(value) ? value : [value, value];
    const start = Number(pair[0]);
    const end = Number(pair[1]);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return;
    this._rangeOverride = [start, end];
    this.requestRender();
  }
    _axisLabel() {
      const raw = this.getAttribute("axis");
      if (!raw) return "";
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed.label || parsed.title || parsed.name || "";
        return String(parsed);
      } catch (e) { return raw; }
    }
    _axisConfig() {
      const raw = this.getAttribute("axis");
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        return (parsed && typeof parsed === "object") ? parsed : null;
      } catch (e) { return null; }
    }
    _valueDomain() {
      const series = this.getAttribute("series");
      if (!series) return null;
      try {
        const parsed = JSON.parse(series);
        let min = Infinity, max = -Infinity;
        (Array.isArray(parsed) ? parsed : []).forEach((s) => {
          if (s && Array.isArray(s.values)) s.values.forEach((v) => {
            const n = Number(v);
            if (Number.isFinite(n)) { if (n < min) min = n; if (n > max) max = n; }
          });
        });
        return Number.isFinite(min) && Number.isFinite(max) ? [min, max] : null;
      } catch (e) { return null; }
    }
    _renderValueAxis() {
      const ax = this.querySelector(".c-chart__axis");
      if (!ax) return;
      const cfg = this._axisConfig();
      const y = cfg && cfg.y;
      const domain = (y && y.domain) || this._valueDomain();
      if (!domain) { ax.textContent = this._axisLabel(); return; }
      const chart = (typeof window !== "undefined" && window.Contour && window.Contour.chart) || null;
      const ticks = (y && y.ticks) || (chart && chart.ticks ? chart.ticks(domain[0], domain[1], 5) : [domain[0], domain[1]]);
      const format = (y && y.format) || ((v) => String(v));
      ax.textContent = "";
      ticks.forEach((t) => {
        const span = document.createElement("span");
        span.className = "c-chart__tick";
        span.textContent = typeof format === "function" ? format(t) : String(t);
        ax.appendChild(span);
      });
      this.style.setProperty("--chart-ticks", String(ticks.length));
    }
    _renderLegend() {
      const series = this.getAttribute("series");
      if (!series) return;
      try {
        const parsed = JSON.parse(series);
        const labelled = (Array.isArray(parsed) ? parsed : []).filter((s) => s && s.label);
        let legend = this.querySelector(".c-chart__legend");
        if (!labelled.length) { if (legend) legend.remove(); return; }
        if (!legend) { legend = document.createElement("div"); legend.className = "c-chart__legend"; this.appendChild(legend); }
        legend.textContent = "";
        labelled.forEach((s, i) => {
          const item = document.createElement("span");
          item.className = "c-chart__legend-item";
          const swatch = document.createElement("span");
          swatch.className = "c-chart__legend-swatch";
          swatch.style.setProperty("--c", this.getAttribute("color") || `var(--chart-${i + 1})`);
          item.appendChild(swatch);
          item.appendChild(document.createTextNode(s.label));
          legend.appendChild(item);
        });
      } catch (e) { /* ignore */ }
    }
    render() {
      this.classList.add("c-chart");
      // A chart with brush handles has focusable descendants, which role="img"
      // forbids (an img is a leaf). A named group exposes the marks and keeps
      // the controls reachable; the data table remains the alternative.
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-roledescription")) this.setAttribute("aria-roledescription", "chart");
      if (this.getAttribute("axis") && !this.hasAttribute("aria-label")) this.setAttribute("aria-label", this._axisLabel());
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
          ax.textContent = this._axisLabel();
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
          btn.classList.add("u-mbs-sm");
          err.appendChild(btn);
        }
        plot.appendChild(err);
        const axis = this.getAttribute("axis");
        if (axis) {
          const ax = this.ensure(".c-chart__axis", () => { const el = document.createElement("div"); el.className = "c-chart__axis"; return el; });
          ax.textContent = this._axisLabel();
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
          sk.classList.add("u-mbe-2xs");
          plot.appendChild(sk);
        }
        const axis = this.getAttribute("axis");
        if (axis) {
          const ax = this.ensure(".c-chart__axis", () => { const el = document.createElement("div"); el.className = "c-chart__axis"; return el; });
          ax.textContent = this._axisLabel();
        }
        return;
      }
      const axis = this.getAttribute("axis");
      if (axis) {
        const ax = this.ensure(".c-chart__axis", () => { const el = document.createElement("div"); el.className = "c-chart__axis"; return el; });
        ax.textContent = this._axisLabel();
      } else {
        const ax = this.querySelector(".c-chart__axis");
        if (ax) ax.remove();
      }
      // Value axis: when `axis` is {y:{domain,ticks,format}} (or the series
      // carries values), print the ticks and publish --chart-ticks.
      this._renderValueAxis();
      // Legend from series[].label, so a chart with named series is readable
      // without the consumer hand-building a legend.
      this._renderLegend();
// A bindable histogram may be driven by `bins` alone: a binder pushes the
// engine's distribution rather than serialising a `series` attribute, so with
// no series declared the pushed bins become the series this render reads.
let series = this.getAttribute("series");
if (!series && this._pushedBins && this._pushedBins.length) {
  series = JSON.stringify([{ type: "histogram", bins: this._pushedBins }]);
}
       if (series) {
         let parsed = null;
         try {
           parsed = JSON.parse(series);
           const plot = this.ensure(".c-chart__plot", () => { const el = document.createElement("div"); el.className = "c-chart__plot"; return el; });
           plot.innerHTML = "";
           // Structured series: an item may carry `values` plus a `type`
           // ("donut" | "histogram" | "line") instead of a pre-computed `d`
           // path, or carry pre-binned `bins` instead of raw `values`. The
           // helpers in svg.mjs turn those into geometry so a consumer does
           // not have to hand-compute arc or bar math.
           const hasStructured = parsed.some((s) => s && (Array.isArray(s.values) || Array.isArray(s.bins)));
           if (hasStructured) {
             // Each structured render rebuilds the published bins from the
             // series it draws; without this a chart switched from a histogram
             // to a line keeps reporting the old distribution.
             this._renderedBins = [];
             this._renderedBackground = [];
              parsed.forEach((s, i) => {
                const layerColor = this.getAttribute("color");
                const color = layerColor || `var(--chart-${i + 1})`;
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
                } else if (s.type === "bar") {
                  // A bar series is the histogram's geometry without the
                  // bucketing: one rect per value, in value order. The
                  // histogram branch bins its input into equal-width buckets
                  // and plots the counts, which is a different question, so
                  // `bar` cannot be folded into it. `barRects()` already
                  // normalises the values against the plot box, so the only
                  // difference here is that `plotVals` is the series itself.
                  const vals = Array.isArray(s.values) ? s.values : [];
                  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                  svg.setAttribute("viewBox", "0 0 300 120");
                  svg.setAttribute("preserveAspectRatio", "none");
                  svg.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%";
                  barRects(vals).forEach((r, ri) => {
                    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    rect.setAttribute("class", "c-chart__bar");
                    rect.setAttribute("data-series", String(i + 1));
                    rect.style.setProperty("--c", color);
                    rect.setAttribute("x", r.x);
                    rect.setAttribute("y", r.y);
                    rect.setAttribute("width", r.width);
                    rect.setAttribute("height", r.height);
                    rect.setAttribute("title", String(vals[ri]));
                    rect.setAttribute("aria-label", "Series " + (i + 1) + ": " + String(vals[ri]));
                    rect.setAttribute("tabindex", "0");
                    rect.setAttribute("role", "button");
                    rect.dataset.index = String(ri);
                    svg.appendChild(rect);
                  });
                  plot.appendChild(svg);
                } else if (s.type === "histogram") {
                  // R16-23: bucket-count / limit-values controls.
                  // `limit-values` truncates the input array; `bucket-count`
                  // bins values into equal-width buckets and renders the
                  // per-bucket counts as bars. R18-68 adds the other door: a
                  // series may arrive pre-binned (`bins`) or be pushed whole by
                  // a binder, and either way the boundaries are published as
                  // `chart.bins` so a consumer can read them back.
                  let vals = Array.isArray(s.values) ? s.values.slice() : [];
                  const limitValues = parseInt(this.getAttribute("limit-values") || "0", 10);
                  if (limitValues > 0) vals = vals.slice(0, limitValues);
                  const bucketCount = parseInt(this.getAttribute("bucket-count") || "0", 10);
                  const pushedBins = this._pushedBins && this._pushedBins.length ? this._pushedBins : null;
                  const declaredBins = Array.isArray(s.bins) ? s.bins.map(normalizeChartBin).filter(Boolean) : null;
                  let bins = pushedBins || (declaredBins && declaredBins.length ? declaredBins : null);
                  let plotVals = vals;
                  if (!bins && bucketCount > 0 && vals.length) {
                    const nums = vals.map((v) => Number(v) || 0);
                    const min = Math.min.apply(null, nums);
                    const max = Math.max.apply(null, nums);
                    const range = max - min || 1;
                    const width = range / bucketCount;
                    const buckets = new Array(bucketCount).fill(0);
                    nums.forEach((v) => {
                      const bi = Math.min(bucketCount - 1, Math.floor((v - min) / width));
                      buckets[bi] += 1;
                    });
                    plotVals = buckets;
                    bins = buckets.map((count, bi) => ({ x0: min + bi * width, x1: min + (bi + 1) * width, count }));
                  }
                  if (bins) plotVals = bins.map((b) => b.count);
                  // Raw values with no bucket count have no boundaries to
                  // publish: those bars are counts at index positions, not a
                  // distribution over a domain, so `bins` stays empty and the
                  // consumer is told there is nothing to map a range onto.
                  this._renderedBins = bins ? bins.slice() : [];
                  const pushedBackground = this._pushedBackground && this._pushedBackground.length ? this._pushedBackground : null;
                  const declaredBackground = Array.isArray(s.background) ? s.background.map(normalizeChartBin).filter(Boolean) : null;
                  const background = pushedBackground || (declaredBackground && declaredBackground.length ? declaredBackground : []);
                  this._renderedBackground = background.slice();
                  const backgroundVals = background.map((b) => Number(b.count) || 0);
                  let sharedMax = 1;
                  if (backgroundVals.length) {
                    plotVals.concat(backgroundVals).forEach((v) => { const n = Number(v) || 0; if (n > sharedMax) sharedMax = n; });
                  }
                  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                  svg.setAttribute("viewBox", "0 0 300 120");
                  svg.setAttribute("preserveAspectRatio", "none");
                  svg.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%";
                  if (backgroundVals.length) {
                    // Context bars: the unfiltered distribution behind the
                    // selection. Deliberately not focusable and not announced —
                    // they are the backdrop the marks are read against, and a
                    // second set of stops would double the tab sequence.
                    barRects(backgroundVals, { max: sharedMax }).forEach((r) => {
                      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                      rect.setAttribute("class", "c-chart__bar");
                      rect.setAttribute("data-context", "");
                      rect.setAttribute("aria-hidden", "true");
                      rect.style.setProperty("--c", color);
                      rect.setAttribute("x", r.x);
                      rect.setAttribute("y", r.y);
                      rect.setAttribute("width", r.width);
                      rect.setAttribute("height", r.height);
                      svg.appendChild(rect);
                    });
                  }
                  barRects(plotVals, backgroundVals.length ? { max: sharedMax } : undefined).forEach((r, ri) => {
                    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    rect.setAttribute("class", "c-chart__bar");
                    rect.setAttribute("data-series", String(i + 1));
                    rect.style.setProperty("--c", color);
                    rect.setAttribute("x", r.x);
                    rect.setAttribute("y", r.y);
                    rect.setAttribute("width", r.width);
                    rect.setAttribute("height", r.height);
                    const markValue = bins ? bins[ri].count : (Array.isArray(s.values) ? s.values[ri] : ri);
                    rect.setAttribute("title", String(markValue));
                    rect.setAttribute("aria-label", "Series " + (i + 1) + ": " + String(markValue));
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
          } catch (e) { warnBadJson(this, "attribute", e); }
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
            // A caption names the table: a reader who lands on it hears what it
            // holds before the first cell, not "table, 5 rows, 3 columns".
            const title = this.getAttribute("title") || this.getAttribute("aria-label") || "Chart data";
            const cap = document.createElement("caption");
            cap.textContent = title;
            table.appendChild(cap);
            const thead = document.createElement("thead");
            const hr = document.createElement("tr");
            const h = document.createElement("th");
            h.setAttribute("scope", "col");
            h.textContent = "Series";
            hr.appendChild(h);
            const maxLen = parsed.reduce((m, s) => Math.max(m, Array.isArray(s.values) ? s.values.length : (Array.isArray(s) ? s.length : 0)), 0);
            for (let i = 0; i < maxLen; i++) {
              const th = document.createElement("th");
              th.setAttribute("scope", "col");
              th.textContent = "Value " + (i + 1);
              hr.appendChild(th);
            }
            thead.appendChild(hr);
            table.appendChild(thead);
            const tbody = document.createElement("tbody");
            parsed.forEach((s, si) => {
              const vals = Array.isArray(s.values) ? s.values : (Array.isArray(s) ? s : []);
              const tr = document.createElement("tr");
              const td0 = document.createElement("th");
              td0.setAttribute("scope", "row");
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
            if (this._showsBrush()) {
              const brush = this.ensure("contour-brush", () => document.createElement("contour-brush"));
              // A binned histogram's brush is in data units, so the track
              // defaults to the bins' own extent; a consumer that supplies
              // brush-min/brush-max still wins. Without this a binder's
              // `range` would be positioned against a 0–100 track it never set.
              const drawnBins = this._renderedBins || [];
              const trackMin = this.getAttribute("brush-min") || (drawnBins.length ? String(drawnBins[0].x0) : "0");
              const trackMax = this.getAttribute("brush-max") || (drawnBins.length ? String(drawnBins[drawnBins.length - 1].x1) : "100");
              const override = Array.isArray(this._rangeOverride) ? this._rangeOverride : null;
              // `range = null` means "no constraint": the brush keeps its
              // affordance and shows the full track, rather than vanishing.
              const cleared = this._rangeOverride === null;
              brush.setAttribute("min", trackMin);
              brush.setAttribute("max", trackMax);
              brush.setAttribute("start", override ? String(override[0]) : cleared ? trackMin : (this.getAttribute("brush-start") || trackMin));
              brush.setAttribute("end", override ? String(override[1]) : cleared ? trackMax : (this.getAttribute("brush-end") || trackMax));
              const plotEl = this.querySelector(".c-chart__plot");
              if (brush.previousElementSibling !== plotEl) this.insertBefore(brush, plotEl ? plotEl.nextSibling : null);
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
         // No series: nothing is drawn, so nothing is published either. A
         // consumer reading `bins` must see the empty state, not the last one.
         this._renderedBins = [];
         this._renderedBackground = [];
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
      // Series toggle responding to legend (F-10): hide/show series when a
      // legend item is toggled. The legend may be a sibling of the chart, so
      // listen on the shared parent (which catches both a child and a sibling
      // legend) and match by key, data-key, or the item's index.
      const legendHost = this.parentElement || document;
      const onLegendToggle = (e) => {
        const key = e && e.detail && (e.detail.key != null ? e.detail.key : e.detail.label);
        const index = e && e.detail && e.detail.index;
        const pressed = e && e.detail && e.detail.pressed;
        if (key == null && index == null) return;
        const nodes = this.querySelectorAll("[data-series]");
        nodes.forEach((n) => {
          const s = n.getAttribute("data-series");
          const match = String(s) === String(key)
            || n.getAttribute("data-key") === String(key)
            || (index != null && String(s) === String(index + 1));
          if (match) n.style.display = pressed === false ? "none" : "";
        });
      };
      legendHost.addEventListener("contour:legend-toggle", onLegendToggle);
      onDispose(this, () => legendHost.removeEventListener("contour:legend-toggle", onLegendToggle));
      this.addEventListener("contour:brush-end", (e) => {
        if (!this._showsBrush() || !e.target || !e.target.matches("contour-brush")) return;
        // The brush moves its own attributes, so a chart already driven through the
        // `range` property records the new pair here; an author-driven chart stays
        // attribute-only and reads the brush itself. `undefined` is the switch:
        // once the property has been written, drags keep it current.
        if (this._rangeOverride !== undefined && e.detail && Array.isArray(e.detail.range)) {
          this._rangeOverride = e.detail.range.slice();
        }
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
          if (!point || !plot2.contains(point)) return;
          const series = parseInt(point.getAttribute("data-series") || "1", 10);
          const points = Array.from(plot2.querySelectorAll('.c-chart__point[data-series="' + series + '"]'));
          const idx = points.indexOf(point);
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const index = parseInt(point.dataset.index || "0", 10);
            this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series, index } }));
            return;
          }
          navKey(e, points, {
            wrap: false,
            rtl: isRtl(this),
            onNavigate: (i) => points.forEach((p, j) => p.setAttribute("tabindex", j === i ? "0" : "-1")),
            onKey: () => {}
          });
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
      // Cross-filter contract (R16-16): clear-all resets chart brush state.
      this.addEventListener("contour:clear-all", () => {
        if (this.hasAttribute("brush")) {
          this.removeAttribute("brush");
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "chart", filter: { brush: null } } }));
          this.requestRender();
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "img");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Streaming chart");
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
        else valueEl.setAttribute("aria-label", valueEl.textContent || "Gauge");
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "img");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Axis");
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
    // The selection as a numeric pair in the track's own units. `start`/`end`
    // stay the attribute strings they have always been; `range` is the shape a
    // cross-filter consumer wants, and libreship's histogram binder reads it.
    _rangeValue() {
      const start = parseFloat(this.getAttribute("start"));
      const end = parseFloat(this.getAttribute("end"));
      return Number.isFinite(start) && Number.isFinite(end) ? [start, end] : null;
    }
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
        this.dispatchEvent(new CustomEvent("contour:brush-start", { bubbles: true, composed: true, detail: { value: this.getAttribute("start"), start: this.getAttribute("start"), end: this.getAttribute("end"), range: this._rangeValue() } }));
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
        this.dispatchEvent(new CustomEvent("contour:brush", { bubbles: true, composed: true, detail: { start: ns, end: ne, value: ns, range: [ns, ne] } }));
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
        this.dispatchEvent(new CustomEvent("contour:brush-end", { bubbles: true, composed: true, detail: { value: this.getAttribute("end"), start: this.getAttribute("start"), end: this.getAttribute("end"), range: this._rangeValue() } }));
        this.dispatchEvent(new CustomEvent("contour:brush", { bubbles: true, composed: true, detail: { start: this.getAttribute("start"), end: this.getAttribute("end"), value: this.getAttribute("end"), range: this._rangeValue() } }));
      });
      // Keyboard: Enter/Space emits brush-start/brush-end (WC-P1-08).
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:brush-start", { bubbles: true, composed: true, detail: { value: this.getAttribute("start"), start: this.getAttribute("start"), end: this.getAttribute("end"), range: this._rangeValue() } }));
        }
      });
      // Cross-filter contract (R16-16): clear-all resets brush range.
      this.addEventListener("contour:clear-all", () => {
        if (this.hasAttribute("start") || this.hasAttribute("end")) {
          this.removeAttribute("start");
          this.removeAttribute("end");
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "brush", filter: { start: null, end: null } } }));
          this.requestRender();
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
      // The bar carries a listbox of selectable segments; role=img would make
      // every one of them presentational. A named group exposes them.
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Stacked bar");
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
    static get observed() { return ["items", "search", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "note", "limit", "sort"]; }
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
        navKey(e, all, {
          wrap: false,
          homeEnd: true,
          rtl: isRtl(this),
          onNavigate: (i) => all.forEach((it, j) => it.setAttribute("tabindex", j === i ? "0" : "-1")),
          onKey: () => {
            if (e.key === "Enter" || e.key === " ") {
              const idx2 = all.indexOf(document.activeElement);
              all.forEach((o, j) => o.setAttribute("aria-selected", j === idx2 ? "true" : "false"));
              this.dispatchEvent(new CustomEvent("contour:select", {
                bubbles: true,
                composed: true,
                detail: {
                  index: idx2,
                  label: document.activeElement.querySelector(".c-category__label")
                    ? document.activeElement.querySelector(".c-category__label").textContent
                    : document.activeElement.textContent.trim()
                }
              }));
            }
          }
        });
      });
      // Cross-filter contract (R16-16): clear-all resets search filter.
      this.addEventListener("contour:clear-all", () => {
        if (this.hasAttribute("search")) {
          this.removeAttribute("search");
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "category", filter: { search: null } } }));
        }
      });
    }
  }
define("contour-category", ContourCategory);
/**
 * Donut: web component wrapper.
 * Attributes: `value`, `values`, `items`, `label`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`, `brownout`, `brownout-level`.
 */
class ContourDonut extends ContourBase {
    static get observed() { return ["value", "values", "items", "label", "color", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "brownout", "brownout-level", "note"]; }
    static get properties() { return { value: { attribute: "value" }, values: { attribute: "values" }, items: { attribute: "items" }, label: { attribute: "label" }, color: { attribute: "color" }, src: { attribute: "src" }, note: { attribute: "note" } }; }
    render() {
      this.classList.add("c-donut");
      // The donut renders a list of segments beside the ring; an image role
      // would flatten that list out of the accessibility tree.
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Donut chart");
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
      const layerColor = this.getAttribute("color");
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
          circle.setAttribute("stroke", layerColor || (typeof it === "object" && it.color ? it.color : "var(--chart-" + ((i % 8) + 1) + ")"));
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
      list.setAttribute("role", "list");
      items.forEach((it, i) => {
        const row = document.createElement("div");
        row.className = "c-donut__item";
        row.setAttribute("role", "listitem");
        const sw = document.createElement("span");
        sw.className = "c-donut__swatch";
        sw.style.background = layerColor || (typeof it === "object" && it.color ? it.color : "var(--chart-" + ((i % 8) + 1) + ")");
            if (sw.style.background) sw.dataset.color = layerColor || (typeof it === "object" && it.color ? it.color : sw.style.background);
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
    static get observed() { return ["values", "points", "series", "style", "title", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "annotations", "note"]; }
    static get properties() { return { values: { attribute: "values" }, points: { attribute: "points" }, series: { attribute: "series" }, style: { attribute: "style" }, src: { attribute: "src" }, annotations: { attribute: "annotations" }, note: { attribute: "note" } }; }
    render() {
      this.classList.add("c-time-series");
      // Points and bars are focusable marks (roving tabindex below); role=img
      // hides them. A named group keeps the name and exposes the marks.
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", this.getAttribute("title") || "Time series");
      wireStates(this);
      loadRemote(this, ["values", "points", "series"]);
      if (renderStates(this, "time-series")) return;
      Array.from(this.querySelectorAll(".c-time-series__plot, .c-time-series__axis")).forEach((n) => n.remove());
      // Series management (R16-21): support multiple series via `series` JSON
      // attribute, with per-series style (line|bar), color binding, and
      // interval control. Falls back to single `values` attribute for
      // backward compatibility.
      let series = [];
      const sAttr = this.getAttribute("series");
      if (sAttr) { try { series = JSON.parse(sAttr); } catch (e) { series = []; } }
      const remote = remoteData(this, "series");
      if (Array.isArray(remote)) series = remote;
      // Backward compat: single `values` attribute becomes one series.
      if (!series.length) {
        let values = [];
        const vAttr = this.getAttribute("values");
        if (vAttr) { try { values = JSON.parse(vAttr); } catch (e) { values = vAttr.split(",").map(Number); } }
        if (values.length) {
          series = [{ label: "Series 1", values, style: this.getAttribute("style") || "bar", color: "var(--chart-1)" }];
        }
      }
      const max = series.reduce((m, s) => { const v = Array.isArray(s.values) ? Math.max(...s.values, 0) : 0; return Math.max(m, v); }, 1);
      const min = series.reduce((m, s) => { const v = Array.isArray(s.values) ? Math.min(...s.values, 0) : 0; return Math.min(m, v); }, 0);
      const plot = document.createElement("div");
      plot.className = "c-time-series__plot";
      plot.setAttribute("part", "plot");
      series.forEach((s, si) => {
        const values = Array.isArray(s.values) ? s.values : [];
        const style = s.style || "bar";
        const color = s.color || `var(--chart-${((si % 8) + 1)})`;
        const label = s.label || `Series ${si + 1}`;
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
          path.setAttribute("data-series", String(si));
          path.setAttribute("d", "M " + pts.replace(/ /g, " L "));
          path.style.stroke = color;
          path.style.fill = "none";
          path.style.strokeWidth = "2";
          svg.appendChild(path);
          // point markers
          values.forEach((v, i) => {
            const x = (i / Math.max(1, n - 1)) * 300;
            const y = 120 - ((v - min) / range) * 120;
            const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            c.setAttribute("class", "c-time-series__point");
            c.setAttribute("data-series", String(si));
            c.setAttribute("data-index", String(i));
            c.setAttribute("cx", x.toFixed(2));
            c.setAttribute("cy", y.toFixed(2));
            c.setAttribute("r", "3");
            c.setAttribute("tabindex", i === 0 && si === 0 ? "0" : "-1");
            c.setAttribute("role", "button");
            c.setAttribute("title", String(v));
            c.setAttribute("aria-label", label + ": " + String(v));
            svg.appendChild(c);
          });
          plot.appendChild(svg);
        } else {
          values.forEach((v, i) => {
            const bar = document.createElement("div");
            bar.className = "c-time-series__bar";
            bar.setAttribute("data-series", String(si));
            bar.setAttribute("data-index", String(i));
            bar.style.blockSize = ((v / max) * 100) + "%";
            bar.style.background = color;
            bar.setAttribute("title", String(v));
            // A clickable, focusable mark is a button, not an image; the point
            // marks above already carry this role.
            bar.setAttribute("role", "button");
            bar.setAttribute("aria-label", label + ": " + String(v));
            bar.setAttribute("tabindex", i === 0 && si === 0 ? "0" : "-1");
            plot.appendChild(bar);
          });
        }
      });
      this.appendChild(plot);
      if (!series.length || !series.some((s) => Array.isArray(s.values) && s.values.length)) renderEmpty(this, "time-series");
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
      const points = () => Array.from(this.querySelectorAll(".c-time-series__point"));
      this.addEventListener("click", (e) => {
        const bar = e.target && e.target.closest ? e.target.closest(".c-time-series__bar") : null;
        if (!bar || !this.contains(bar)) return;
        const seriesIdx = Number(bar.dataset.series || "0");
        const idx = Number(bar.dataset.index || "0");
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series: seriesIdx, index: idx, value: bar.getAttribute("title") } }));
        return;
      });
      const pointClick = (e) => {
        const point = e.target && e.target.closest ? e.target.closest(".c-time-series__point") : null;
        if (!point || !this.contains(point)) return;
        const seriesIdx = Number(point.dataset.series || "0");
        const idx = Number(point.dataset.index || "0");
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series: seriesIdx, index: idx, value: point.getAttribute("title") } }));
      };
      this.addEventListener("click", pointClick);
      this.addEventListener("keydown", (e) => {
        const bar = e.target && e.target.closest ? e.target.closest(".c-time-series__bar") : null;
        if (!bar || !this.contains(bar)) return;
        const all = bars();
        const idx = all.indexOf(bar);
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const seriesIdx = Number(bar.dataset.series || "0");
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series: seriesIdx, index: idx, value: bar.getAttribute("title") } }));
          return;
        }
        navKey(e, all, {
          wrap: false,
          homeEnd: true,
          rtl: isRtl(this),
          onNavigate: (i) => all.forEach((b, j) => b.setAttribute("tabindex", j === i ? "0" : "-1")),
          onKey: () => {}
        });
      });
      // focus tooltip
      this.addEventListener("focusin", (e) => {
        const bar = e.target && e.target.closest ? e.target.closest(".c-time-series__bar") : null;
        if (bar && this.contains(bar)) {
          const tip = this.querySelector(".c-time-series__tooltip");
          if (tip) { tip.textContent = bar.getAttribute("title"); tip.removeAttribute("hidden"); }
        }
        const point = e.target && e.target.closest ? e.target.closest(".c-time-series__point") : null;
        if (point && this.contains(point)) {
          const tip = this.querySelector(".c-time-series__tooltip");
          if (tip) { tip.textContent = point.getAttribute("title"); tip.removeAttribute("hidden"); }
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
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "pivot", filter: { filter: fi.value } } }));
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
      // Cross-filter contract (R16-16): clear-all resets pivot filter.
      this.addEventListener("contour:clear-all", () => {
        if (this.hasAttribute("filter")) {
          this.removeAttribute("filter");
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "pivot", filter: { filter: null } } }));
        }
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
        } catch (e) { warnBadJson(this, "attribute", e); }
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
      this.classList.add("c-bivariate-legend");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Bivariate legend");
      const size = Math.min(12, Math.max(1, parseInt(this.getAttribute("size") || "3", 10) || 3));
      const matrix = this.ensure(".c-bivariate-legend__matrix", () => { const el = document.createElement("div"); el.className = "c-bivariate-legend__matrix"; return el; });
      matrix.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      matrix.style.gridTemplateRows = `repeat(${size}, 1fr)`;
      // Slot composition: authored cells win over the generated grid.
      const authored = Array.from(matrix.children).filter((n) => n.classList && n.classList.contains("c-bivariate-legend__cell"));
      if (!authored.length) {
        matrix.innerHTML = "";
        let colors = [];
        const cAttr = this.getAttribute("colors");
        if (cAttr) { try { colors = JSON.parse(cAttr); } catch (e) { colors = []; } }
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const cell = document.createElement("div");
            cell.className = "c-bivariate-legend__cell";
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
          const cells = Array.from(matrix.querySelectorAll(".c-bivariate-legend__cell"));
          cells.forEach((cell, i) => {
            const rr = Math.floor(i / size);
            const cc = i % size;
            if (rr === sr && cc === sc) cell.setAttribute("data-selected", "");
            else cell.removeAttribute("data-selected");
          });
        }
        // aria-live region
        let live = this.querySelector(".c-bivariate-legend__live");
        if (!live) { live = document.createElement("div"); live.className = "c-bivariate-legend__live"; live.setAttribute("aria-live", "polite"); live.style.position = "absolute"; live.style.width = "1px"; live.style.height = "1px"; live.style.overflow = "hidden"; live.style.clip = "rect(0,0,0,0)"; this.appendChild(live); }
      }
      const axisX = this.getAttribute("axis-x");
      if (axisX) {
        const ax = this.ensure(".c-bivariate-legend__axis--x", () => { const el = document.createElement("div"); el.className = "c-bivariate-legend__axis c-bivariate-legend__axis--x"; return el; });
        ax.textContent = axisX;
      } else {
        const ax = this.querySelector(".c-bivariate-legend__axis--x");
        if (ax) ax.remove();
      }
      const axisY = this.getAttribute("axis-y");
      if (axisY) {
        const ay = this.ensure(".c-bivariate-legend__axis--y", () => { const el = document.createElement("div"); el.className = "c-bivariate-legend__axis c-bivariate-legend__axis--y"; return el; });
        ay.textContent = axisY;
      } else {
        const ay = this.querySelector(".c-bivariate-legend__axis--y");
        if (ay) ay.remove();
      }
    }
    enhance() {
      if (this._wiredBivLegend) return;
      this._wiredBivLegend = true;
      const selectCell = (cell) => {
        const matrix = this.querySelector(".c-bivariate-legend__matrix");
        const cells = Array.from(matrix ? matrix.querySelectorAll(".c-bivariate-legend__cell") : []);
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
        const cell = e.target && e.target.closest ? e.target.closest(".c-bivariate-legend__cell") : null;
        if (cell && this.contains(cell)) selectCell(cell);
      });
      this.addEventListener("keydown", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-bivariate-legend__cell") : null;
        if (!cell || !this.contains(cell)) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectCell(cell); }
      });
    }
    clear() {
      this.removeAttribute("selected");
      const cells = Array.from(this.querySelectorAll(".c-bivariate-legend__cell"));
      cells.forEach((c) => c.removeAttribute("data-selected"));
      this.dispatchEvent(new CustomEvent("contour:clear", { bubbles: true, composed: true }));
    }
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
    enhance() {
      if (this._wiredThreshold) return;
      this._wiredThreshold = true;
      // Cross-filter contract (R16-16): clear-all resets threshold norm/target.
      this.addEventListener("contour:clear-all", () => {
        if (this.hasAttribute("norm") || this.hasAttribute("value")) {
          this.removeAttribute("norm");
          this.removeAttribute("value");
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "threshold", filter: { norm: null, value: null } } }));
          this.requestRender();
        }
      });
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
      this.setAttribute("role", "list");
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
          item.setAttribute("role", "listitem");
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
    static get observed() { return ["title", "ramp", "scale", "items", "method", "norm", "selectable", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "glyphs", "thresholds", "breaks", "no-data-color", "no-data-label", "size", "table", "classification", "audit", "continuous", "ends", "caption", "graduated"]; }
    static get properties() { return { title: { attribute: "title" }, ramp: { attribute: "ramp" }, scale: { attribute: "scale" }, items: { attribute: "items" }, method: { attribute: "method" }, norm: { attribute: "norm" }, selectable: { attribute: "selectable", type: Boolean }, src: { attribute: "src" }, graduated: { attribute: "graduated", type: Boolean } }; }
    render() {
      this.classList.add("c-legend");
      const graduated = this.hasAttribute("graduated");
      if (graduated) this.classList.add("c-legend--graduated");
      const continuous = this.hasAttribute("continuous");
      if (continuous || this.hasAttribute("selectable")) {
        this.setAttribute("role", "group");
      } else {
        this.setAttribute("role", "list");
      }
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
          if (this.hasAttribute("selectable")) {
            list.setAttribute("role", "group");
          } else {
            // Host already has role="list"; inner container should be generic
            list.removeAttribute("role");
          }
          if (title) list.setAttribute("aria-label", title);
          list.innerHTML = "";
          parsed.forEach((it) => {
            const label = typeof it === "string" ? it : (it.label || String(it));
            const key = typeof it === "string" ? it : (it.key || it.label || String(it));
            const item = document.createElement("div");
            item.className = "c-legend__item";
            item.setAttribute("tabindex", "-1");
            if (selectable) {
              item.setAttribute("role", "button");
              item.setAttribute("aria-pressed", "true");
              item.dataset.key = key;
            } else {
              item.setAttribute("role", "listitem");
              // aria-selected is not valid on role="listitem"; omit for non-selectable legends
            }
            const sw = document.createElement("span");
            if (graduated) {
              sw.className = "c-legend__swatch c-legend__swatch--graduated";
              const gSize = it && it.size != null ? it.size : (it && it.value != null ? it.value : 1);
              const sizePx = Math.max(6, Math.min(24, parseFloat(gSize) * 4));
              sw.style.inlineSize = sizePx + "px";
              sw.style.blockSize = sizePx + "px";
            } else {
              sw.className = "c-legend__swatch";
            }
            if (it && it.color) { sw.style.background = it.color; sw.dataset.color = it.color; }
            item.appendChild(sw);
            // graduated break label
            if (graduated && (it && it.break != null)) {
              const bl = document.createElement("span");
              bl.className = "c-legend__break-label";
              bl.textContent = String(it.break);
              item.appendChild(bl);
            }
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
        } catch (e) { warnBadJson(this, "attribute", e); }
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
       const ndLabel = this.getAttribute("no-data-label") || "No data";
       if (ndColor) {
         let nd = this.querySelector(".c-legend__no-data");
         if (!nd) { nd = document.createElement("div"); nd.className = "c-legend__no-data"; this.appendChild(nd); }
         nd.setAttribute("part", "no-data");
         nd.setAttribute("aria-label", ndLabel);
         nd.textContent = ndLabel;
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
      const selectable = this.hasAttribute("selectable");
      this.addEventListener("click", (e) => {
        if (!selectable) return;
        const btn = e.target && e.target.closest ? e.target.closest(".c-legend__item") : null;
        if (!btn || !this.contains(btn)) return;
        const pressed = btn.getAttribute("aria-pressed") !== "true";
        btn.setAttribute("aria-pressed", String(pressed));
        const items = Array.from(this.querySelectorAll(".c-legend__item"));
        const index = items.indexOf(btn);
        this.dispatchEvent(new CustomEvent("contour:legend-toggle", {
          detail: { label: btn.textContent.trim(), key: btn.dataset.key || btn.textContent.trim(), pressed, index },
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
      // keyboard nav (listbox) - only for selectable legends
      if (selectable) {
        this.addEventListener("keydown", (e) => {
          const items = Array.from(this.querySelectorAll(".c-legend__item"));
          if (!items.length) return;
          const active = document.activeElement;
          const idx = items.indexOf(active);
          if (e.key === "Escape") {
            // clear selection
            items.forEach((o) => o.setAttribute("aria-pressed", "false"));
            this.dispatchEvent(new CustomEvent("contour:clear", { bubbles: true, composed: true }));
            return;
          }
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
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
            return;
          }
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (active && active.classList.contains("c-legend__item")) {
              active.click();
            }
            return;
          }
          navKey(e, items, {
            wrap: true,
            homeEnd: true,
            rtl: isRtl(this),
            onNavigate: (i) => items.forEach((o, j) => o.setAttribute("tabindex", j === i ? "0" : "-1")),
            onKey: () => {}
          });
        });
      }
      // Cross-filter contract (R16-16): clear-all resets legend selection.
      this.addEventListener("contour:clear-all", () => {
        const items = Array.from(this.querySelectorAll(".c-legend__item"));
        let changed = false;
        items.forEach((o) => {
          if (o.getAttribute("role") === "button" && o.getAttribute("aria-pressed") === "true") {
            o.setAttribute("aria-pressed", "false");
            changed = true;
          }
        });
        if (changed) {
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "legend", filter: { selection: null } } }));
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
      // Native list semantics: an <ol> with <li> items, not a role="list" on a
      // <div> recreating the platform's list numbering and association.
      let list = this.querySelector(".c-timeline__list");
      if (!list) { list = document.createElement("ol"); list.className = "c-timeline__list"; list.setAttribute("aria-label", this.getAttribute("aria-label") || "Timeline"); this.appendChild(list); }
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "timeline")) return;
      const authored = Array.from(this.children).filter((n) => n.classList && n.classList.contains("c-timeline__item"));
      const items = remoteData(this, "items");
      if (items && !authored.length) {
        Array.from(list.querySelectorAll(".c-timeline__item")).forEach((n) => n.remove());
        try {
          const parsed = JSON.parse(items);
          parsed.forEach((it) => {
            const item = document.createElement("li");
            item.className = "c-timeline__item";
            item.setAttribute("tabindex", "-1");
            if (it.time) {
              const t = document.createElement("time");
              t.className = "c-timeline__time";
              t.setAttribute("datetime", String(it.time));
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
            list.appendChild(item);
          });
        } catch (e) { warnBadJson(this, "attribute", e); }
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
          navKey(e, items, { wrap: false, homeEnd: true, onNavigate: (i) => items.forEach((it, j) => it.setAttribute("tabindex", j === i ? "0" : "-1")), onKey: () => { if (e.key === "Enter" || e.key === " ") this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: items.indexOf(document.activeElement) } })); } });
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
        // Wrap authored cells in rows so gridcells have a required row parent
        let row = null;
        let col = 0;
        const newRow = () => { row = document.createElement("div"); row.setAttribute("role", "row"); this.appendChild(row); col = 0; };
        newRow();
        authoredCells.forEach((cell) => {
          cell.setAttribute("role", "gridcell");
          row.appendChild(cell);
          col++;
          if (col === cols) newRow();
        });
      } else {
        Array.from(this.querySelectorAll(".c-heatmap__cell")).forEach((n) => n.remove());
        const count = Math.min(200, Math.max(0, parseInt(this.getAttribute("cells") || this.getAttribute("count") || "0", 10) || 0));
        const cols = count > 0 ? Math.ceil(Math.sqrt(count)) : 1;
        this.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
        this.style.inlineSize = "16rem";
        if (count > 0) {
         let values = [];
         try { values = JSON.parse(this.getAttribute("values") || "[]"); } catch (e) { values = []; }
         let row = null;
         let col = 0;
         const newRow = () => { row = document.createElement("div"); row.setAttribute("role", "row"); this.appendChild(row); col = 0; };
         newRow();
           for (let i = 0; i < count; i++) {
            const cell = document.createElement("div");
            cell.className = "c-heatmap__cell";
            cell.setAttribute("role", "gridcell");
            cell.setAttribute("tabindex", i === 0 ? "0" : "-1");
            cell.dataset.index = String(i);
            if (values[i] !== undefined) cell.setAttribute("title", String(values[i]));
            row.appendChild(cell);
            col++;
            if (col === cols && i < count - 1) newRow();
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
 * Attributes: `values` (row-major 2D field), `levels`, `label`.
 */
class ContourContourPlot extends ContourBase {
    static get observed() { return ["values", "levels", "label"]; }
    static get properties() { return { values: { attribute: "values" }, levels: { attribute: "levels" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-contour-plot");
      if (!this.hasAttribute("role")) this.setAttribute("role", "img");
      const label = this.getAttribute("label");
      if (label || !this.hasAttribute("aria-label")) this.setAttribute("aria-label", label || "Contour plot");
      const valuesAttr = this.getAttribute("values");
      const levelsAttr = this.getAttribute("levels");
      let grid = null;
      if (valuesAttr) { try { grid = JSON.parse(valuesAttr); } catch (e) { grid = null; } }
      let levels = [0.3, 0.5, 0.7];
      if (levelsAttr) { try { const l = JSON.parse(levelsAttr); if (Array.isArray(l) && l.length) levels = l; } catch (e) { /* keep defaults */ } }

      let svg = this.querySelector("svg");
      if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "c-contour-plot__svg");
        svg.setAttribute("aria-hidden", "true");
        this.appendChild(svg);
      }
      // Clear previous contours so a re-render cannot stack a second set.
      Array.from(svg.querySelectorAll(".c-contour-plot__contour")).forEach((n) => n.remove());

      if (Array.isArray(grid) && grid.length > 1 && Array.isArray(grid[0]) && grid[0].length > 1) {
        const draw = () => {
          const w = this.clientWidth || 300;
          const h = this.clientHeight || 300;
          svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
          svg.querySelectorAll(".c-contour-plot__contour").forEach((n) => n.remove());
          contourPaths(grid, levels, w, h).forEach((line, li) => {
            if (!line.d) return;
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", line.d);
            path.setAttribute("class", "c-contour-plot__contour" + (li > 0 ? " c-contour-plot__contour--level-" + (li + 1) : ""));
            svg.appendChild(path);
          });
        };
        draw();
        // Re-render on resize so pixel-space paths track the container.
        if (typeof ResizeObserver !== "undefined" && !this._contourResize) {
          this._contourResize = new ResizeObserver(() => draw());
          this._contourResize.observe(this);
          onDispose(this, () => { this._contourResize.disconnect(); this._contourResize = null; });
        }
      } else if (!Array.isArray(grid)) {
        const empty = document.createElement("div");
        empty.className = "c-contour-plot__empty";
        empty.textContent = this.getAttribute("empty") || "No field";
        this.appendChild(empty);
      }
    }
  }
define("contour-contour-plot", ContourContourPlot);
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
        this.dispatchEvent(new CustomEvent("contour:error", { bubbles: true, composed: true, detail: { message: msg } }));
      }, true);
    }
  }
  define("contour-error-boundary", ContourErrorBoundary);

class ContourDataExport extends ContourBase {
    static get observed() { return ["data", "format", "filename", "label"]; }
    static get properties() { return { data: { attribute: "data" }, format: { attribute: "format" }, filename: { attribute: "filename" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-data-export");
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Data export");
      const fmt = (this.getAttribute("format") || "json").toLowerCase();
      const btn = this.ensure(".c-data-export__btn", () => {
        const b = document.createElement("button");
        b.className = "c-data-export__btn";
        b.type = "button";
        return b;
      });
      btn.textContent = this.getAttribute("label") || ("Export " + fmt.toUpperCase());
      if (btn.parentNode !== this) this.appendChild(btn);
    }
    enhance() {
      if (this._wiredDataExport) return;
      this._wiredDataExport = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-data-export__btn") : null;
        if (!btn || !this.contains(btn)) return;
        const fmt = (this.getAttribute("format") || "json").toLowerCase();
        const raw = this.getAttribute("data") || "[]";
        let text = raw;
        if (fmt === "csv") {
          try {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr) && arr.length) {
              const keys = Object.keys(arr[0]);
              text = [keys.join(",")].concat(arr.map((r) => keys.map((k) => JSON.stringify(r[k] ?? "")).join(","))).join("\n");
            }
          } catch (e) {}
        }
        const blob = new Blob([text], { type: fmt === "csv" ? "text/csv" : "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = this.getAttribute("filename") || ("export." + fmt);
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.dispatchEvent(new CustomEvent("contour:export", { bubbles: true, composed: true, detail: { format: fmt } }));
      });
    }
  }
  define("contour-data-export", ContourDataExport);

// Query builder: a list of field/operator/value rows with an Add rule button.
// The component renders the rows from a `query` JSON attribute and emits
// contour:change with the serialised query.
class ContourQueryBuilder extends ContourBase {
  static get observed() { return ["query", "fields"]; }
  static get properties() { return { query: { attribute: "query" }, fields: { attribute: "fields" } }; }
  render() {
    this.classList.add("c-query-builder");
    const fields = this.getAttribute("fields");
    let fieldList = [];
    if (fields) { try { fieldList = JSON.parse(fields); } catch (e) { fieldList = []; } }
    const query = this.getAttribute("query");
    let rules = [];
    if (query) { try { rules = JSON.parse(query); } catch (e) { rules = []; } }
    const list = this.ensure(".c-query-builder__list", () => { const el = document.createElement("div"); el.className = "c-query-builder__list"; return el; });
    Array.from(list.querySelectorAll(".c-query-builder__row")).forEach((n) => n.remove());
    rules.forEach((rule, i) => {
      const row = document.createElement("div");
      row.className = "c-query-builder__row";
      const field = document.createElement("select");
      field.className = "c-query-builder__field";
      field.setAttribute("aria-label", "Field " + (i + 1));
      fieldList.forEach((f) => {
        const opt = document.createElement("option");
        opt.value = typeof f === "string" ? f : (f.value || f.label || "");
        opt.textContent = typeof f === "string" ? f : (f.label || f.value || "");
        if (opt.value === rule.field) opt.selected = true;
        field.appendChild(opt);
      });
      const op = document.createElement("select");
      op.className = "c-query-builder__op";
      op.setAttribute("aria-label", "Operator " + (i + 1));
      ["=", "!=", ">", "<", "contains"].forEach((o) => {
        const opt = document.createElement("option");
        opt.value = o; opt.textContent = o;
        if (o === rule.op) opt.selected = true;
        op.appendChild(opt);
      });
      const val = document.createElement("input");
      val.className = "c-query-builder__value";
      val.type = "text";
      val.value = rule.value || "";
      val.setAttribute("aria-label", "Value " + (i + 1));
      row.appendChild(field); row.appendChild(op); row.appendChild(val);
      list.appendChild(row);
    });
    const add = this.ensure(".c-query-builder__add", () => { const b = document.createElement("button"); b.type = "button"; b.className = "c-btn c-btn--sm c-query-builder__add"; b.textContent = "Add rule"; return b; });
    if (add.parentNode !== this) this.appendChild(add);
  }
  enhance() {
    if (this._wiredQueryBuilder) return;
    this._wiredQueryBuilder = true;
    this.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.closest && t.closest(".c-query-builder__add")) {
        const rows = Array.from(this.querySelectorAll(".c-query-builder__row")).map((r) => ({
          field: r.querySelector(".c-query-builder__field")?.value || "",
          op: r.querySelector(".c-query-builder__op")?.value || "=",
          value: r.querySelector(".c-query-builder__value")?.value || "",
        }));
        rows.push({ field: "", op: "=", value: "" });
        this.setAttribute("query", JSON.stringify(rows));
        this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { query: rows } }));
      }
    });
  }
}
define("contour-query-builder", ContourQueryBuilder);

