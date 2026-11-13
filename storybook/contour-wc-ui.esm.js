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
        img.loading = "lazy";
        img.decoding = "async";
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
    static get observed() { return ["variant", "key", "value", "live"]; }
    static get properties() { return { variant: { attribute: "variant" }, key: { attribute: "key" }, value: { attribute: "value" }, live: { attribute: "live", type: Boolean } }; }
    render() {
      this.classList.add("c-chip");
      // A static filter chip is a label, not a live region. Only a chip the
      // author marks `live` announces; otherwise a page with 50 chips creates
      // 50 politeness regions that may speak on load.
      if (this.hasAttribute("live") && !this.hasAttribute("role")) this.setAttribute("role", "status");
      else if (!this.hasAttribute("live") && this.getAttribute("role") === "status" && this._autoChipRole) this.removeAttribute("role");
      this._autoChipRole = this.hasAttribute("live");
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
    static get observed() { return ["label", "removable", "variant", "live"]; }
    static get properties() { return { label: { attribute: "label" }, removable: { attribute: "removable", type: Boolean }, variant: { attribute: "variant" }, live: { attribute: "live", type: Boolean } }; }
    render() {
      this.classList.add("c-tag");
      // A tag is normally a static label. `live` opts it into a polite region,
      // so a wall of tags does not create a wall of announcements.
      if (this.hasAttribute("live") && !this.hasAttribute("role")) this.setAttribute("role", "status");
      else if (!this.hasAttribute("live") && this.getAttribute("role") === "status" && this._autoTagRole) this.removeAttribute("role");
      this._autoTagRole = this.hasAttribute("live");
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
      // `live` is the pill's opt-in to a polite region. A static pill is a label:
      // role=status on every instance makes a page of pills announce itself.
      if (this.hasAttribute("live") && !this.hasAttribute("role")) this.setAttribute("role", "status");
      else if (!this.hasAttribute("live") && this.getAttribute("role") === "status" && this._autoPillRole) this.removeAttribute("role");
      this._autoPillRole = this.hasAttribute("live");
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
      // A skeleton is a decorative placeholder: it is hidden from assistive
      // technology, and the loading state (contour-loading) is what announces.
      // The old code set role=status AND aria-hidden=true, which is a live
      // region that can never speak.
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
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Tooltip");
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
       if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", label || "Progress");
      const min = this.getAttribute("min");
      const max = this.getAttribute("max");
      const minV = min !== null ? Number(min) : 0;
      const maxV = max !== null ? Number(max) : 100;
      if (min !== null) this.setAttribute("aria-valuemin", min);
      else if (!this.hasAttribute("aria-valuemin")) this.setAttribute("aria-valuemin", "0");
      if (max !== null) this.setAttribute("aria-valuemax", max);
      else if (!this.hasAttribute("aria-valuemax")) this.setAttribute("aria-valuemax", "100");
      // aria-valuenow must sit inside the declared min/max, not always 0-100.
      if (this.hasAttribute("aria-valuenow")) {
        const now = Number(this.getAttribute("aria-valuenow"));
        if (Number.isFinite(now)) this.setAttribute("aria-valuenow", String(Math.max(minV, Math.min(maxV, now))));
      }
      if (this.hasAttribute("paused")) this.classList.add("c-progress--paused");
      else Array.from(this.classList).forEach((c) => { if (c === "c-progress--paused") this.classList.remove(c); });
      if (this.hasAttribute("pausable")) {
        const paused = this.hasAttribute("paused");
        const btn = this.ensure(".c-progress__pause", () => {
          const el = document.createElement("button");
          el.className = "c-progress__pause";
          el.type = "button";
          return el;
        });
        btn.setAttribute("aria-label", paused ? "Resume" : "Pause");
        btn.textContent = paused ? "▶" : "⏸";
      } else {
        const btn = this.querySelector(".c-progress__pause");
        if (btn) btn.remove();
      }
    }
    enhance() {
      if (this._wiredProgress) return;
      this._wiredProgress = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-progress__pause") : null;
        if (!btn || !this.contains(btn)) return;
        e.preventDefault();
        const paused = !this.hasAttribute("paused");
        this.toggleAttribute("paused", paused);
        this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { paused } }));
      });
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
    static get observed() { return ["label"]; }
    static get properties() { return { label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-loading");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-live")) this.setAttribute("aria-live", "polite");
      this.ensure(".c-spinner", () => { const el = document.createElement("span"); el.className = "c-spinner"; el.setAttribute("aria-hidden", "true"); return el; });
      // A status region with no text announces nothing: give it a label the
      // reader can hear, visually hidden so the spinner stays the visual.
      const label = this.getAttribute("label") || "Loading";
      let text = this.querySelector("[data-loading-label]");
      if (!text) { text = document.createElement("span"); text.className = "visually-hidden"; text.setAttribute("data-loading-label", ""); this.appendChild(text); }
      text.textContent = label;
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", label);
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", this.getAttribute("message") || "Version banner");
      Array.from(this.children).forEach((n) => n.remove());
      const message = this.getAttribute("message");
      if (message) {
        // createElement("svg") builds an HTMLUnknownElement, not an SVG: the
        // <use> inside it never renders. SVG needs the SVG namespace.
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
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
        a.href = safeHref(href);
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
        // Same rule as `contour-skeleton`: a placeholder is decorative. An
        // exposed empty div adds noise and says nothing.
        sk.setAttribute("aria-hidden", "true");
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
  static get observed() { return ["title", "content", "cluster-count", "cluster-expanded", "cluster-items", "anchor", "position", "collision"]; }
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
      // CDS-072: anchor + collision handling.
      const anchorSel = this.getAttribute("anchor");
      let anchorEl = null;
      if (anchorSel) {
        anchorEl = anchorSel.startsWith("#") ? document.getElementById(anchorSel.slice(1)) : document.querySelector(anchorSel);
      }
      const anchorName = "--map-popup-" + this.id;
      const applyAnchor = () => {
        if (anchorEl) {
          anchorEl.style.setProperty("anchor-name", anchorName);
          this.style.setProperty("position-anchor", anchorName);
        }
      };
      const flipIfNeeded = () => {
        try {
          const r = this.getBoundingClientRect();
          const flipX = r.right > window.innerWidth || r.left < 0;
          const flipY = r.bottom > window.innerHeight || r.top < 0;
          const flipped = flipX || flipY;
          this.classList.toggle("c-map-popup--flip-x", flipX && !flipY);
          this.classList.toggle("c-map-popup--flip-y", flipY && !flipX);
          this.classList.toggle("c-map-popup--flip-both", flipX && flipY);
          if (flipped) {
            this.dispatchEvent(new CustomEvent("contour:map-popup-reposition", {
              bubbles: true, composed: true,
              detail: { anchor: anchorSel || "", flippedX: flipX, flippedY: flipY, left: Math.round(r.left), top: Math.round(r.top) }
            }));
          }
        } catch (e) {}
      };
      applyAnchor();
      this.addEventListener("toggle", (e) => {
        if (e.newState === "open") {
          requestAnimationFrame(() => { applyAnchor(); flipIfNeeded(); });
        }
      });
      // Re-check on resize/scroll so the popup stays in view.
      const onResize = () => flipIfNeeded();
      window.addEventListener("resize", onResize);
      onDispose(this, () => { window.removeEventListener("resize", onResize); if (anchorEl) anchorEl.style.removeProperty("anchor-name"); });
    }
  }
  define("contour-map-popup", ContourMapPopup);

/**
 * AnimationControls: a media control toolbar with play/pause, speed, scrubber
 * and caption. Attributes: `playing`, `speed`, `progress`, `min`, `max`,
 * `caption`, `show-thumb`, `show-thumb-caption`.
 */
class ContourAnimationControls extends ContourBase {
    static get observed() { return ["playing", "speed", "progress", "min", "max", "caption", "show-thumb", "show-thumb-caption", "loop", "step", "markers"]; }
    static get properties() { return { playing: { attribute: "playing", type: Boolean }, speed: { attribute: "speed" }, progress: { attribute: "progress" }, min: { attribute: "min" }, max: { attribute: "max" }, loop: { attribute: "loop", type: Boolean }, step: { attribute: "step" }, markers: { attribute: "markers" } }; }
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
      scrubber.step = this.getAttribute("step") || "1";
      scrubber.value = this.getAttribute("progress") || "0";
      // Accessible time values: expose current position as aria-valuenow and a
      // human-readable label as aria-valuetext so screen readers announce it.
      const min = Number(scrubber.min) || 0;
      const max = Number(scrubber.max) || 100;
      const v = Number(scrubber.value) || min;
      scrubber.setAttribute("aria-valuenow", String(v));
      scrubber.setAttribute("aria-valuetext", String(Math.round(v)));
      scrubber.setAttribute("aria-valuemin", String(min));
      scrubber.setAttribute("aria-valuemax", String(max));
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
      // loop indicator
      if (this.hasAttribute("loop")) {
        this.setAttribute("aria-label", "Animation controls, loop");
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
            const step = Number(scrubber.step || 1);
            const delta = e.key === "ArrowRight" ? step : -step;
            scrubber.value = String(Math.min(Number(scrubber.max || 100), Math.max(Number(scrubber.min || 0), Number(scrubber.value || 0) + delta)));
            scrubber.dispatchEvent(new Event("input", { bubbles: true }));
          }
        } else if (e.key === "Home") {
          const scrubber = this.querySelector(".c-animation-controls__scrubber");
          if (scrubber) { e.preventDefault(); scrubber.value = scrubber.min || "0"; scrubber.dispatchEvent(new Event("input", { bubbles: true })); }
        } else if (e.key === "End") {
          const scrubber = this.querySelector(".c-animation-controls__scrubber");
          if (scrubber) { e.preventDefault(); scrubber.value = scrubber.max || "100"; scrubber.dispatchEvent(new Event("input", { bubbles: true })); }
        } else if (e.key === "PageUp" || e.key === "PageDown") {
          const scrubber = this.querySelector(".c-animation-controls__scrubber");
          if (scrubber) {
            e.preventDefault();
            const step = Number(scrubber.step || 1) * 10;
            const delta = e.key === "PageUp" ? step : -step;
            scrubber.value = String(Math.min(Number(scrubber.max || 100), Math.max(Number(scrubber.min || 0), Number(scrubber.value || 0) + delta)));
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
        if (v > max) {
          if (this.hasAttribute("loop")) v = min;
          else { v = max; stop(); }
        }
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
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Dropdown");
      const btn = this.ensure(".c-dropdown__trigger", () => { const el = document.createElement("button"); el.className = "c-dropdown__trigger c-btn c-btn--sm"; el.type = "button"; return el; });
      btn.textContent = this.getAttribute("label") || "Menu";
      // The trigger advertises the menu it opens before it is opened: a reader
      // who tabs to it hears "has popup menu, collapsed", not "button".
      btn.setAttribute("aria-haspopup", "menu");
      btn.setAttribute("aria-expanded", "false");
      const menu = this.ensure(".c-dropdown__menu", () => { const el = document.createElement("div"); el.className = "c-dropdown__menu c-menu"; el.setAttribute("role", "menu"); el.hidden = true; return el; });
      if (!menu.id) menu.id = (this.id || contourId("dd")) + "-menu";
      btn.setAttribute("aria-controls", menu.id);
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
        } catch (e) { warnBadJson(this, "attribute", e); }
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
        navKey(e, items, { wrap: true, enter: false, onKey: (k) => { if (k === "Enter" || k === " ") document.activeElement.click(); } });
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Style switcher");
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
            if (name === value) { btn.classList.add("c-style-switcher__option--active"); btn.setAttribute("aria-pressed", "true"); }
            else btn.setAttribute("aria-pressed", "false");
            btn.dataset.value = name;
            this.appendChild(btn);
          });
        } catch (e) { warnBadJson(this, "attribute", e); }
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
      this.addEventListener("keydown", (e) => {
        const opts = Array.from(this.querySelectorAll(".c-style-switcher__option"));
        navKey(e, opts, { onKey: (k) => { if (k === "Enter" || k === " ") { const btn = document.activeElement; if (btn && btn.dataset.value != null) this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: btn.dataset.value } })); } } });
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
         // Unique ids: the old code used the global "property"/"policy"/"palette"/"n",
         // so two panels on a page produced duplicate ids and broken label[for].
         const uid = contourId("style-panel");
         const propId = uid + "-property";
         const policyId = uid + "-policy";
         const paletteId = uid + "-palette";
         const nId = uid + "-n";
         // property field
         const propLabel = document.createElement("label"); propLabel.textContent = "Colour field"; propLabel.setAttribute("for", propId); body.appendChild(propLabel);
         const propIn = document.createElement("input"); propIn.type = "text"; propIn.id = propId; propIn.className = "c-style-panel__property c-input"; propIn.setAttribute("aria-label", "Colour field");
         const pv = this.getAttribute("property"); if (pv) propIn.value = pv;
         body.appendChild(propIn);
         // classification method selector (policy)
         const clsLabel = document.createElement("label"); clsLabel.textContent = "Classification"; clsLabel.setAttribute("for", policyId); body.appendChild(clsLabel);
         const clsSel = document.createElement("select"); clsSel.id = policyId; clsSel.className = "c-style-panel__classification c-input"; clsSel.setAttribute("aria-label", "Classification method");
         ["equal","quantile","jenks","manual"].forEach((m) => { const o = document.createElement("option"); o.value = m; o.textContent = m; clsSel.appendChild(o); });
         const cls = this.getAttribute("classification"); if (cls) clsSel.value = cls;
         body.appendChild(clsSel);
         // palette picker
         const palLabel = document.createElement("label"); palLabel.textContent = "Palette"; palLabel.setAttribute("for", paletteId); body.appendChild(palLabel);
         const pal = document.createElement("input"); pal.type = "text"; pal.id = paletteId; pal.className = "c-style-panel__palette c-input"; pal.placeholder = "palette"; pal.setAttribute("aria-label", "Palette");
         const palv = this.getAttribute("palette"); if (palv) pal.value = palv;
         body.appendChild(pal);
         // n (class count)
         const nLabel = document.createElement("label"); nLabel.textContent = "Classes"; nLabel.setAttribute("for", nId); body.appendChild(nLabel);
         const nIn = document.createElement("input"); nIn.type = "number"; nIn.id = nId; nIn.className = "c-style-panel__n c-input"; nIn.min = "2"; nIn.max = "12"; nIn.setAttribute("aria-label", "Class count");
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
         const actions = document.createElement("div"); actions.className = "c-style-panel__actions c-btn-group";
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
            breaks.setAttribute("aria-label", "Class breaks");
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
          // Carry the current control values, not just { applied: true }: a
          // consumer listening for the apply needs to know what was applied.
          const body = this.querySelector(".c-style-panel__body");
          const payload = { applied: true };
          if (body) {
            const prop = body.querySelector(".c-style-panel__property");
            const cls = body.querySelector(".c-style-panel__classification");
            const pal = body.querySelector(".c-style-panel__palette");
            const n = body.querySelector(".c-style-panel__n");
            const colors = Array.from(body.querySelectorAll(".c-style-panel__color")).map((c) => c.value);
            if (prop) payload.property = prop.value;
            if (cls) payload.classification = cls.value;
            if (pal) payload.palette = pal.value;
            if (n) payload.n = Number(n.value);
            if (colors.length) payload.colors = colors;
          }
          this.dispatchEvent(new CustomEvent("contour:style-resolved", { detail: payload, bubbles: true, composed: true }));
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
        } catch (e) { warnBadJson(this, "attribute", e); }
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
      // A status light is a labelled graphic: give it a role and a name so the
      // colour is not the only carrier of the state.
      if (!this.hasAttribute("role")) this.setAttribute("role", "img");
      const label = this.getAttribute("label");
      if (label && !this.hasAttribute("aria-label")) this.setAttribute("aria-label", label);
      else if (!label && !this.hasAttribute("aria-label")) this.setAttribute("aria-label", status);
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
      // The toggle opens a menu: it says so, it owns the state, and it names the
      // node it opens. Without all three a reader hears an unlabelled "▾".
      if (!menu.id) menu.id = (this.id || contourId("split")) + "-menu";
      toggle.setAttribute("aria-haspopup", "menu");
      toggle.setAttribute("aria-controls", menu.id);
      toggle.setAttribute("aria-expanded", String(!menu.hidden));
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
        } catch (e) { warnBadJson(this, "attribute", e); }
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Palette editor");
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
        } catch (e) { warnBadJson(this, "attribute", e); }
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
        navKey(e, swatches, { wrap: true, enter: true, onKey: () => { if (document.activeElement.classList.contains("c-palette-editor__swatch")) document.activeElement.click(); } });
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
      start.setAttribute("aria-label", this.getAttribute("label") || "Start date");
      const end = this.ensure(".c-date-range__end", () => { const el = document.createElement("input"); el.className = "c-input c-date-range__end"; return el; });
      end.type = start.type;
      end.value = this.getAttribute("end") || "";
      end.setAttribute("aria-label", this.getAttribute("label") || "End date");
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", this.getAttribute("label") || "Keyboard shortcut");
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
  static get formAssociated() { return true; }
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
        // Don't clobber a value the user is typing: only write when the control
        // is not focused and the incoming value differs. The old code set
        // control.value on every render, so a typed date reverted on any
        // attribute change.
        const next = value || "";
        if (document.activeElement !== control && control.value !== next) control.value = next;
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
      // A grid is rows of cells. The rows use `display: contents`, so the visual
      // seven-column layout is untouched while the accessibility tree gets a
      // real row/gridcell structure instead of thirty loose buttons.
      grid.setAttribute("aria-label", title.textContent);
      const rowEl = () => {
        const row = document.createElement("div");
        row.className = "c-date-picker__calendar-row";
        row.setAttribute("role", "row");
        grid.appendChild(row);
        return row;
      };
      let row = rowEl();
      let cells = 0;
      const push = (cell) => {
        if (cells === 7) { row = rowEl(); cells = 0; }
        row.appendChild(cell);
        cells++;
      };
      const weekdays = ["Su","Mo","Tu","We","Th","Fr","Sa"];
      const weekdayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      weekdays.forEach((w, i) => {
        const h = document.createElement("div");
        h.className = "c-date-picker__calendar-weekday";
        h.setAttribute("role", "columnheader");
        h.setAttribute("aria-label", weekdayNames[i]);
        h.textContent = w;
        push(h);
      });
      for (let i = 0; i < startDay; i++) {
        const empty = document.createElement("div");
        empty.className = "c-date-picker__calendar-day c-date-picker__calendar-day--empty";
        empty.setAttribute("role", "gridcell");
        empty.setAttribute("aria-hidden", "true");
        push(empty);
      }
      const selected = input ? input.value : "";
      const inMonth = selected && selected.slice(0, 7) === `${y}-${String(m + 1).padStart(2, "0")}`;
      const stopDay = inMonth ? parseInt(selected.slice(8, 10), 10) || 1 : 1;
      for (let d = 1; d <= daysInMonth; d++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "c-date-picker__calendar-day";
        btn.textContent = String(d);
        btn.setAttribute("role", "gridcell");
        // One tab stop for the month; arrows move within the grid.
        btn.setAttribute("tabindex", d === stopDay ? "0" : "-1");
        // "12" is a number, not a date. The cell's name says the whole date.
        btn.setAttribute("aria-label", new Date(y, m, d).toLocaleDateString(this.getAttribute("locale") || undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
        const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (selected && selected.startsWith(iso)) { btn.classList.add("is-selected"); btn.setAttribute("aria-selected", "true"); }
        btn.addEventListener("click", () => {
          if (input) { input.value = iso; input.dispatchEvent(new Event("change", { bubbles: true })); }
          cal.setAttribute("hidden", "");
          const tgl = this.querySelector(".c-date-picker__calendar-toggle");
          if (tgl) tgl.setAttribute("aria-expanded", "false");
        });
        push(btn);
      }
      cal.appendChild(grid);
      prev.addEventListener("click", () => { this._calMonth = new Date(y, m - 1, 1); this._renderCalendar(); });
      next.addEventListener("click", () => { this._calMonth = new Date(y, m + 1, 1); this._renderCalendar(); });
      if (this._internals) this._syncFormValue();
    }
    _syncFormValue() {
      if (!this._internals) return;
      const start = this.querySelector(".c-date-picker__input");
      const end = this.querySelector(".c-date-picker__end");
      // A range picker submits both ends; a single picker submits its value.
      if (this.hasAttribute("range") && end) {
        this._internals.setFormValue((start ? start.value : "") + "," + end.value);
      } else {
        this._internals.setFormValue(start && start.value ? start.value : null);
      }
      this._syncValidity(this.hasAttribute("required") && !(start && start.value));
    }
    enhance() {
      if (this._wiredDatePicker) return;
      this._wiredDatePicker = true;
      this._syncFormValue();
      this.addEventListener("change", () => { this._syncFormValue(); });
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
      // Grid keyboard: one tab stop enters the month, arrows move between days,
      // Home/End reach the ends of the month and PageUp/PageDown change month.
      // Delegated on the host because `_renderCalendar()` rebuilds the cells.
      this.addEventListener("keydown", (e) => {
        const cal = this.querySelector(".c-date-picker__calendar");
        if (!cal || cal.hasAttribute("hidden")) return;
        const cells = Array.from(cal.querySelectorAll('[role="gridcell"]:not([aria-hidden="true"])'));
        const i = cells.indexOf(document.activeElement);
        if (i < 0) return;
        if (e.key === "PageUp" || e.key === "PageDown") {
          e.preventDefault();
          const btn = this.querySelector(e.key === "PageUp" ? ".c-date-picker__calendar-header button:first-child" : ".c-date-picker__calendar-header button:last-child");
          if (btn) btn.click();
          return;
        }
        let next = -1;
        if (e.key === "ArrowRight") next = i + 1;
        else if (e.key === "ArrowLeft") next = i - 1;
        else if (e.key === "ArrowDown") next = i + 7;
        else if (e.key === "ArrowUp") next = i - 7;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = cells.length - 1;
        else return;
        e.preventDefault();
        if (next < 0 || next >= cells.length) return;
        cells.forEach((cell, j) => cell.setAttribute("tabindex", j === next ? "0" : "-1"));
        cells[next].focus();
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "radiogroup");
      // The group's name is the author's choice; "Rating" is only the fallback.
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Rating");
      const max = parseInt(this.getAttribute("max") || "5", 10) || 5;
      const value = parseInt(this.getAttribute("value") || "0", 10) || 0;
      const color = this.getAttribute("color");
      Array.from(this.querySelectorAll(".c-rating__star")).forEach((n) => n.remove());
      // A radiogroup is one tab stop, arrow keys move within it. The checked
      // star (or the first when nothing is rated) is the one Tab reaches.
      const stop = value >= 1 && value <= max ? value : 1;
      for (let i = 1; i <= max; i++) {
        const star = document.createElement("button");
        star.className = "c-rating__star" + (i <= value ? " c-rating__star--filled" : "");
        star.type = "button";
        star.setAttribute("role", "radio");
        star.setAttribute("aria-checked", String(i === value));
        star.setAttribute("tabindex", String(i === stop ? 0 : -1));
        star.innerHTML = '<span class="c-rating__swatch' + (i <= value ? ' c-rating__swatch--filled' : '') + '" aria-hidden="true"></span>';
        if (color && i <= value) {
          const sw = star.firstChild;
          const safe = safeColor(color);
          if (sw && safe) {
            sw.style.backgroundColor = safe;
            sw.style.borderColor = safe;
          }
        }
        star.dataset.value = String(i);
        star.setAttribute("aria-label", i + " star" + (i > 1 ? "s" : ""));
        this.appendChild(star);
      }
    }
    enhance() {
      if (this._wiredRating) return;
      this._wiredRating = true;
      const stars = () => Array.from(this.querySelectorAll(".c-rating__star"));
      // Selection is one state change: aria-checked, the roving tab stop and the
      // event move together. The old arrow handler moved focus and announced a
      // value without ever updating aria-checked, so AT kept reading star 2.
      const select = (v) => {
        stars().forEach((st) => {
          const on = parseInt(st.dataset.value, 10) === v;
          st.setAttribute("aria-checked", String(on));
          st.setAttribute("tabindex", on ? "0" : "-1");
          st.classList.toggle("c-rating__star--filled", parseInt(st.dataset.value, 10) <= v);
          const sw = st.querySelector(".c-rating__swatch");
          if (sw) sw.classList.toggle("c-rating__swatch--filled", parseInt(st.dataset.value, 10) <= v);
        });
        this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: v } }));
      };
      this.addEventListener("click", (e) => {
        const star = e.target && e.target.closest ? e.target.closest(".c-rating__star") : null;
        if (star && this.contains(star)) select(parseInt(star.dataset.value, 10));
      });
      this.addEventListener("keydown", (e) => {
        const all = stars();
        if (!all.length) return;
        navKey(e, all, {
          wrap: false,
          homeEnd: true,
          onNavigate: (i) => { select(parseInt(all[i].dataset.value, 10)); },
          onKey: (key, i) => { if (key === "Enter" || key === " ") select(parseInt(all[i].dataset.value, 10)); },
        });
      });
    }
  }
  define("contour-rating", ContourRating);

/**
 * Time Picker: web component wrapper.
 * Attributes: `value`, `label`, `disabled`, `error`, `help`.
 */
class ContourTimePicker extends ContourBase {
    static get formAssociated() { return true; }
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
      const input = this.ensure(".c-time-picker__input", () => { const el = document.createElement("input"); el.className = "c-input c-time-picker__input"; el.type = "time"; el.setAttribute("aria-label", this.getAttribute("label") || "Time picker"); return el; });
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
      if (this._internals) this._syncFormValue();
    }
    enhance() {
      if (this._wiredTimePicker) return;
      this._wiredTimePicker = true;
      this._syncFormValue();
      this.addEventListener("change", () => { this._syncFormValue(); });
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
    static get formAssociated() { return true; }
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
      if (!input.hasAttribute("aria-label")) input.setAttribute("aria-label", label || "Color");
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
      if (this._internals) this._syncFormValue();
    }
    enhance() {
      if (this._wiredColorPicker) return;
      this._wiredColorPicker = true;
      this._syncFormValue();
      this.addEventListener("change", () => { this._syncFormValue(); });
      this.addEventListener("contour:change", () => { this._syncFormValue(); });
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
    static get formAssociated() { return true; }
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
      if (!input.hasAttribute("aria-label")) input.setAttribute("aria-label", label || "Number");
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
      if (this._internals) this._syncFormValue();
    }
    enhance() {
      if (this._wiredNumberField) return;
      this._wiredNumberField = true;
      this._syncFormValue();
      this.addEventListener("change", () => { this._syncFormValue(); });
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
          const onEnter = () => { showTimer = setTimeout(show, 300); };
          const onLeave = () => { hide(); };
          const onFocus = () => show();
          const onBlur = () => { setTimeout(hide, 100); };
          trigger.addEventListener("mouseenter", onEnter);
          trigger.addEventListener("mouseleave", onLeave);
          trigger.addEventListener("focus", onFocus);
          trigger.addEventListener("blur", onBlur);
          // Remove the trigger listeners too: the old cleanup only cleared the
          // timer, so a removed trigger kept four live handlers.
          onDispose(this, () => {
            if (showTimer) { clearTimeout(showTimer); showTimer = null; }
            trigger.removeEventListener("mouseenter", onEnter);
            trigger.removeEventListener("mouseleave", onLeave);
            trigger.removeEventListener("focus", onFocus);
            trigger.removeEventListener("blur", onBlur);
          });
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
    static get observed() { return ["items", "trigger"]; }
    static get properties() { return { items: { attribute: "items" }, trigger: { attribute: "trigger" } }; }
    render() {
      this.classList.add("c-context-menu");
      if (!this.hasAttribute("role")) this.setAttribute("role", "menu");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Context menu");
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
        } catch (e) { warnBadJson(this, "attribute", e); }
      }
    }
    enhance() {
      if (this._wiredContextMenu) return;
      this._wiredContextMenu = true;
      const openAt = (x, y) => {
        if (typeof this.showPopover === "function") { try { this.showPopover(); } catch (err) {} }
        else this.classList.add("is-open");
        if (Number.isFinite(x) && Number.isFinite(y)) {
          this.style.position = "fixed";
          this.style.left = x + "px";
          this.style.top = y + "px";
        }
      };
      // A context menu is opened by its trigger, not by a right-click on the
      // menu itself (which is empty until opened). `trigger` names the element.
      const triggerSel = this.getAttribute("trigger");
      if (triggerSel) {
        const trigger = document.querySelector(triggerSel);
        if (trigger) {
          if (!trigger.hasAttribute("aria-haspopup")) trigger.setAttribute("aria-haspopup", "menu");
          const onCtx = (e) => { e.preventDefault(); openAt(e.clientX, e.clientY); };
          trigger.addEventListener("contextmenu", onCtx);
          onDispose(this, () => trigger.removeEventListener("contextmenu", onCtx));
        }
      }
      this.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        openAt(e.clientX, e.clientY);
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
        navKey(e, items, { wrap: true, onKey: () => { if (e.key === "Enter" || e.key === " ") document.activeElement.click(); } });
        if (e.key === "Escape") { e.preventDefault(); if (typeof this.hidePopover === "function") { try { this.hidePopover(); } catch (err) {} } this.classList.remove("is-open"); }
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
      if (icon && !this.querySelector("svg")) {
        // Render the icon through the sprite, not as text: an <svg><use> paints
        // the glyph; the old code wrote the icon name into the button.
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("aria-hidden", "true");
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttribute("href", icon.startsWith("#") ? icon : "#" + icon);
        svg.appendChild(use);
        this.appendChild(svg);
      }
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
    static get formAssociated() { return true; }
    static get observed() { return ["label", "accept", "multiple", "progress", "name"]; }
    static get properties() { return { label: { attribute: "label" }, accept: { attribute: "accept" }, multiple: { attribute: "multiple", type: Boolean }, progress: { attribute: "progress" }, name: { attribute: "name" } }; }
    render() {
      this.classList.add("c-file-upload");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", this.getAttribute("label") || "File upload");
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
      if (this._internals) this._syncFormValue();
    }
    enhance() {
      if (this._wiredFileUpload) return;
      this._wiredFileUpload = true;
      this._syncFormValue();
      this.addEventListener("change", () => { this._syncFormValue(); });
      const dz = () => this.querySelector(".c-file-upload__dropzone");
      const input = () => this.querySelector(".c-file-upload__input");
      const activate = () => { const i = input(); if (i) i.click(); };
      this.addEventListener("click", (e) => { const d = dz(); if (e.target === d || (d && d.contains(e.target))) { activate(); } });
      this.addEventListener("keydown", (e) => { const d = dz(); if ((e.target === d || (d && d.contains(e.target))) && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); activate(); } });
      const renderPreview = (files) => {
        const preview = this.querySelector(".c-file-upload__preview");
        if (!preview) return;
        // Revoke the previous object URLs before dropping the <img> nodes, or
        // every re-render leaks a blob.
        this._revokeObjectUrls();
        preview.innerHTML = "";
        Array.from(files || []).forEach((f) => {
          const item = document.createElement("div");
          item.className = "c-file-upload__preview-item";
          if (f.type && f.type.startsWith("image/")) {
            const img = document.createElement("img");
            img.className = "c-file-upload__preview-thumb";
            img.alt = f.name;
            img.loading = "lazy";
            img.decoding = "async";
            try { const u = URL.createObjectURL(f); img.src = u; (this._objectUrls || (this._objectUrls = [])).push(u); } catch (e) {}
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
      this.addEventListener("drop", (e) => { e.preventDefault(); this.classList.remove("is-dragover"); const i = input(); if (i && e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) { try { i.files = e.dataTransfer.files; } catch (err) { /* some browsers disallow */ } renderPreview(e.dataTransfer.files); this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { files: e.dataTransfer.files } })); } });
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._revokeObjectUrls();
    }
    _revokeObjectUrls() {
      if (!this._objectUrls) return;
      this._objectUrls.forEach((u) => { try { URL.revokeObjectURL(u); } catch (e) {} });
      this._objectUrls = [];
    }
    // Form-value sync override (R16-06): submit the selected File(s) via
    // FormData rather than the input's (useless) path string.
    _syncFormValue() {
      if (!this._internals) return;
      const inp = this.querySelector(".c-file-upload__input");
      if (inp && inp.files && inp.files.length) {
        const fd = new FormData();
        // Use the host's name so the entry matches the control the author
        // declared, not a hard-coded "file" key.
        const key = this.getAttribute("name") || "file";
        Array.from(inp.files).forEach((f) => fd.append(key, f));
        this._internals.setFormValue(fd);
      } else {
        this._internals.setFormValue(null);
      }
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
      this.setAttribute("role", "group");
      const btn = this.ensure(".c-notification-center__trigger", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-notification-center__trigger"; el.type = "button"; el.innerHTML = '<span class="c-notification-center__bullet" aria-hidden="true"></span>'; el.setAttribute("aria-haspopup", "dialog"); el.setAttribute("aria-expanded", "false"); el.setAttribute("aria-label", "Notifications"); return el; });
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
            row.className = "c-notification-center__item" + (it && it.read ? " is-read" : "");
            row.setAttribute("tabindex", "0");
            row.setAttribute("role", "option");
            row.dataset.read = it && it.read ? "true" : "false";
            const label = document.createElement("span");
            label.className = "c-notification-center__item-label";
            label.textContent = typeof it === "string" ? it : (it.text || it.title || "");
            row.appendChild(label);
            // Dismiss control: a notification the reader can clear, not just read.
            const dismiss = document.createElement("button");
            dismiss.type = "button";
            dismiss.className = "c-notification-center__dismiss";
            dismiss.setAttribute("aria-label", "Dismiss notification");
            dismiss.textContent = "×";
            row.appendChild(dismiss);
            panel.appendChild(row);
          });
          if (!parsed.length) {
            const empty = document.createElement("div");
            empty.className = "c-notification-center__empty";
            empty.textContent = label(this, "empty", "No notifications");
            panel.appendChild(empty);
          }
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
        const dismiss = e.target && e.target.closest ? e.target.closest(".c-notification-center__dismiss") : null;
        if (dismiss && this.contains(dismiss)) {
          const item = dismiss.closest(".c-notification-center__item");
          if (item) {
            item.remove();
            this.dispatchEvent(new CustomEvent("contour:dismiss", { bubbles: true, composed: true, detail: { label: item.textContent } }));
          }
          return;
        }
        const item = e.target && e.target.closest ? e.target.closest(".c-notification-center__item") : null;
        if (item && this.contains(item)) {
          // Mark read on open: the unread dot is the state the reader clears.
          if (item.dataset.read !== "true") {
            item.dataset.read = "true";
            item.classList.add("is-read");
            this.dispatchEvent(new CustomEvent("contour:read", { bubbles: true, composed: true, detail: { label: item.textContent } }));
          }
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
        navKey(e, items, { wrap: true });
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Stepper");
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
      const nav = this.ensure(".c-stepper__nav", () => { const el = document.createElement("div"); el.className = "c-stepper__nav c-btn-group"; return el; });
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
        if (prev && this.contains(prev)) { go("prev"); return; }
        if (next && this.contains(next)) { go("next"); return; }
        // Click a step to jump to it: the step is a control, not just a label.
        const step = e.target && e.target.closest ? e.target.closest(".c-stepper__step") : null;
        if (step && this.contains(step)) {
          const items = Array.from(this.querySelectorAll(".c-stepper__step"));
          const idx = items.indexOf(step);
          if (idx >= 0 && idx !== Number(this.getAttribute("current") || 0)) {
            this.setAttribute("current", String(idx));
            this.dispatchEvent(new CustomEvent("contour:step-change", { bubbles: true, composed: true, detail: { direction: "jump", index: idx } }));
          }
        }
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
      if (Number.isFinite(h) && h > 0) return h;
      return cssLength("--virtual-list-item-height", 28);
    }
    _autoHeight() {
      return this.getAttribute("item-height") === "auto";
    }
    render() {
      this.classList.add("c-virtual-list");
      this.setAttribute("role", "list");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Virtual list");
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
      return rows.map((r) => horizontal ? (r.getBoundingClientRect().width || this._itemHeight()) : (r.getBoundingClientRect().height || this._itemHeight()));
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
        for (let i = 0; i < total; i++) cumulative.push(cumulative[i] + (heights[i] || this._itemHeight()));
      }
      const visibleCount = autoHeight && !cumulative ? total : (autoHeight ? Math.ceil(viewportSize / this._itemHeight()) + 6 : Math.ceil(viewportSize / ih) + 4);
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
        // A windowed list must publish its position in the whole set, or a
        // screen reader cannot tell "item 3 of 1,000" from "item 3 of 12".
        row.setAttribute("aria-setsize", String(total));
        row.setAttribute("aria-posinset", String(i + 1));
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
        const horizontal = this.getAttribute("orientation") === "horizontal";
        const fwd = horizontal ? "ArrowRight" : "ArrowDown";
        const back = horizontal ? "ArrowLeft" : "ArrowUp";
        const active = document.activeElement;
        const at = rows.indexOf(active);
        const scroller = this.querySelector(".c-virtual-list__scroller");
        const inner = this.querySelector(".c-virtual-list__inner");
        // At the window edge the next item is not rendered: scroll one row and
        // re-render, then move focus, instead of stopping at the last node.
        if ((e.key === fwd && at === rows.length - 1) || (e.key === back && at === 0 && Number(active && active.dataset.index) > 0)) {
          e.preventDefault();
          if (scroller && inner) {
            const delta = (e.key === fwd ? 1 : -1) * this._itemHeight();
            if (horizontal) scroller.scrollLeft += delta; else scroller.scrollTop += delta;
            this._renderWindow(scroller, inner, horizontal ? scroller.scrollLeft : scroller.scrollTop);
            const targetIndex = Number(active && active.dataset.index) + (e.key === fwd ? 1 : -1);
            requestAnimationFrame(() => {
              const next = this.querySelector(`.c-virtual-list__item[data-index="${targetIndex}"]`);
              if (next) { rows.forEach((r) => r.setAttribute("tabindex", "-1")); next.setAttribute("tabindex", "0"); try { next.focus(); } catch (err) {} }
            });
          }
          return;
        }
        navKey(e, rows, { wrap: false, homeEnd: true, onNavigate: (i) => rows.forEach((r, j) => r.setAttribute("tabindex", j === i ? "0" : "-1")), onKey: () => { if (e.key === "Enter" || e.key === " ") { const i = Number(document.activeElement.dataset.index); this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: i, value: document.activeElement.textContent } })); } } });
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
      const search = this.ensure(".c-command-palette__search", () => { const el = document.createElement("input"); el.className = "c-input c-command-palette__search"; el.type = "search"; el.placeholder = "Search…"; el.setAttribute("aria-label", "Search commands"); el.setAttribute("aria-expanded", "false"); el.setAttribute("aria-controls", ""); return el; });
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
    show() { if (typeof this.showPopover === "function") { try { this.showPopover(); } catch (e) {} } this.classList.add("is-open"); modalContain(this, true); const s = this.querySelector(".c-command-palette__search"); if (s) s.setAttribute("aria-expanded", "true"); }
    hide() { if (typeof this.hidePopover === "function") { try { this.hidePopover(); } catch (e) {} } this.classList.remove("is-open"); modalContain(this, false); const s = this.querySelector(".c-command-palette__search"); if (s) s.setAttribute("aria-expanded", "false"); }
    toggle() { if (this.classList.contains("is-open") || this.matches(":popover-open")) this.hide(); else this.show(); }
    enhance() {
      if (this._wiredCmdPalette) return;
      this._wiredCmdPalette = true;
      const search = () => this.querySelector(".c-command-palette__search");
      const list = () => this.querySelector(".c-command-palette__list");
      const items = () => Array.from(this.querySelectorAll(".c-command-palette__item"));
      const visibleItems = () => items().filter((it) => !it.hidden);
      // A cursor, not the focus position: the items are not focusable (focus
      // stays in the search field), so asking `navKey` about the active element
      // always returned -1 and the arrow keys did nothing. The cursor is the
      // single source of truth for the active option.
      let cursor = 0;
      const setActive = (idx) => {
        const vis = visibleItems();
        if (!vis.length) { cursor = 0; return; }
        cursor = Math.max(0, Math.min(idx, vis.length - 1));
        vis.forEach((it, i) => it.classList.toggle("is-active", i === cursor));
        const active = vis[cursor];
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
        this.hide();
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
          if (!vis.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive(cursor + 1); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive(cursor - 1); }
          else if (e.key === "Home") { e.preventDefault(); setActive(0); }
          else if (e.key === "End") { e.preventDefault(); setActive(vis.length - 1); }
          else if (e.key === "Enter") { e.preventDefault(); select(vis[cursor]); }
          else if (e.key === "Escape") { e.preventDefault(); this.hide(); }
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
        if (e.newState === "open") {
          lastFocus = document.activeElement;
          this.dispatchEvent(new CustomEvent("contour:open", { bubbles: true, composed: true }));
        } else if (lastFocus && typeof lastFocus.focus === "function") {
          this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
          try { lastFocus.focus(); } catch (err) {}
        }
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
      // Keep authored children: the component adds the "+N" overflow badge, it
      // does not replace whatever the author put inside.
      const existing = this.querySelector(".c-badge-overflow__more");
      if (existing) existing.remove();
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
      const close = () => { this.removeAttribute("open"); this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true })); };
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
          this.dispatchEvent(new CustomEvent("contour:open", { bubbles: true, composed: true }));
          lastFocus = document.activeElement;
          modalContain(this, true);
          const first = this.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
          if (first) try { first.focus(); } catch (err) {}
        } else if (lastFocus) {
          modalContain(this, false);
          try { lastFocus.focus(); } catch (err) {}
          lastFocus = null;
        }
      });
      obs.observe(this, { attributes: true, attributeFilter: ["open"] });
      onDispose(this, () => { obs.disconnect(); if (this.hasAttribute("open")) modalContain(this, false); });
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
      // No aria-modal: a tour is a coach mark, not a modal. It points at a
      // target in the page (step.target), so the page behind it stays
      // scrollable, clickable and focusable, and assistive tech must not be
      // told the rest of the document is inert.
      this.setAttribute("aria-label", "Tour");
      const steps = this.getAttribute("steps");
      const current = Number(this.getAttribute("current") || 0);
      let parsed = [];
      try { parsed = steps ? JSON.parse(steps) : []; } catch (e) { parsed = []; }
      const step = parsed[current] || {};
      const tip = this.ensure(".c-tour__tip", () => { const el = document.createElement("div"); el.className = "c-tour__tip"; return el; });
      tip.textContent = typeof step === "string" ? step : (step.text || step.title || "");
      const nav = this.ensure(".c-tour__nav", () => { const el = document.createElement("div"); el.className = "c-tour__nav c-btn-group"; return el; });
      const back = this.ensure(".c-tour__back", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-tour__back"; el.type = "button"; el.textContent = "Back"; return el; }, nav);
      const next = this.ensure(".c-tour__next", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-tour__next"; el.type = "button"; el.textContent = "Next"; return el; }, nav);
      const close = this.ensure(".c-tour__close", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-tour__close"; el.type = "button"; el.textContent = "Close"; return el; }, nav);
      // Keep the three controls in order regardless of which were just created.
      if (nav.firstChild !== back) nav.insertBefore(back, nav.firstChild);
      if (next.previousSibling !== back) nav.insertBefore(next, back.nextSibling);
      if (close.previousSibling !== next) nav.insertBefore(close, next.nextSibling);
      // Target highlight: a step may name the element it points at, so the
      // reader sees what the tip is about instead of a floating box.
      if (this._tourTarget && this._tourTarget.classList) this._tourTarget.classList.remove("c-tour__target");
      this._tourTarget = null;
      const targetSel = typeof step === "object" && step ? step.target : null;
      if (targetSel) {
        const target = document.querySelector(targetSel);
        if (target && target.classList) { target.classList.add("c-tour__target"); this._tourTarget = target; }
      }
    }
    enhance() {
      if (this._wiredTour) return;
      this._wiredTour = true;
      // A tour is a coach mark, not a modal, so it must not take the page with
      // it. Two things used to happen here on upgrade and both took the guide
      // offline: modalContain() locked the document scroll and inerted every
      // sibling of the host out to the body, and focusing the Next button
      // scrolled the viewport to the tour and stole focus from the reader.
      // Neither has an open transition to undo it — the overlay family
      // modalises in show() and releases in close(); the tour has neither.
      this.addEventListener("click", (e) => {
        const next = e.target && e.target.closest ? e.target.closest(".c-tour__next") : null;
        const back = e.target && e.target.closest ? e.target.closest(".c-tour__back") : null;
        const close = e.target && e.target.closest ? e.target.closest(".c-tour__close") : null;
        if (next && this.contains(next)) { this.dispatchEvent(new CustomEvent("contour:step-change", { bubbles: true, composed: true, detail: { direction: "next" } })); return; }
        if (back && this.contains(back)) { this.dispatchEvent(new CustomEvent("contour:step-change", { bubbles: true, composed: true, detail: { direction: "prev" } })); return; }
        if (close && this.contains(close)) { this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true })); }
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
    static get formAssociated() { return true; }
    static get observed() { return ["value", "placeholder", "disabled", "error", "help"]; }
    static get properties() { return { value: { attribute: "value" }, placeholder: { attribute: "placeholder" }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
    render() {
      this.classList.add("c-tags-input");
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Tags input");
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
      if (this._internals) this._syncFormValue();
    }
    enhance() {
      if (this._wiredTagsInput) return;
      this._wiredTagsInput = true;
      this._syncFormValue();
      this.addEventListener("contour:add", () => { this._syncFormValue(); });
      this.addEventListener("contour:remove", () => { this._syncFormValue(); });
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
    // Form-value sync override (R16-06): tags are stored as a JSON array on the
    // host, not in the inner input, so the base class's generic sync would read
    // the empty add-tag input. Submit the host's value instead.
    _syncFormValue() {
      if (!this._internals) return;
      this._internals.setFormValue(this.getAttribute("value") || "[]");
      this._syncValidity(this.hasAttribute("required") && !(this.getAttribute("value")));
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
        const itemLabel = typeof it === "string" ? it : (it.label || it.text || "");
        const handle = document.createElement("span");
        handle.className = "c-sortable-list__handle";
        handle.textContent = "⋮⋮";
        handle.setAttribute("role", "button");
        // "⋮⋮" is the glyph, not a name. A screen reader hears the glyph as
        // punctuation unless the handle says what it moves.
        handle.setAttribute("aria-label", label(this, "reorder", "Reorder") + " " + (itemLabel || String(i + 1)));
        handle.tabIndex = 0;
        li.appendChild(handle);
        const labelEl = document.createElement("span");
        labelEl.className = "c-sortable-list__label";
        labelEl.textContent = itemLabel;
        li.appendChild(labelEl);
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      // role=button on a span is not focusable by itself. Without a tab stop the
      // swatch is mouse-only; a keyboard user cannot reach the picker at all.
      if (this.getAttribute("role") === "button" && !this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", this.getAttribute("label") || this.getAttribute("color") || "Swatch");
      const color = this.getAttribute("color") || "#000";
      this.style.setProperty("--swatch-color", color);
      if (this.hasAttribute("selected")) this.classList.add("is-selected");
      else this.classList.remove("is-selected");
      if (!this.hasAttribute("aria-label")) {
        const label = this.getAttribute("label") || color;
        this.setAttribute("aria-label", label);
      }
      if (!this.querySelector("button") && !this.querySelector("span")) {
        const span = document.createElement("span");
        span.className = "c-swatch__btn";
        span.setAttribute("aria-hidden", "true");
        this.appendChild(span);
      }
    }
    enhance() {
      if (this._wiredSwatch) return;
      this._wiredSwatch = true;
      this.addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { value: this.getAttribute("color") } }));
      });
      // A role=button must answer Enter and Space as well as the pointer.
      this.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
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
    static get observed() { return ["value", "month", "year"]; }
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
      let row = null;
      let col = 0;
      const newRow = () => { row = document.createElement("div"); row.setAttribute("role", "row"); grid.appendChild(row); col = 0; };
      newRow();
      for (let i = 0; i < startDay; i++) {
        const empty = document.createElement("div");
        empty.className = "c-calendar__day c-calendar__day--empty";
        row.appendChild(empty);
        col++;
        if (col === 7) newRow();
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
        row.appendChild(cell);
        col++;
        if (col === 7) newRow();
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
      // Indicators: one dot per slide, so a reader can jump directly and see
      // where they are without reading the status text.
      const dots = this.ensure(".c-carousel__dots", () => { const el = document.createElement("div"); el.className = "c-carousel__dots"; el.setAttribute("role", "tablist"); el.setAttribute("aria-label", "Slides"); return el; });
      dots.innerHTML = "";
      items.forEach((it, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "c-carousel__dot" + (i === idx ? " is-active" : "");
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", "Go to slide " + (i + 1));
        dot.setAttribute("aria-selected", i === idx ? "true" : "false");
        dot.dataset.index = String(i);
        dots.appendChild(dot);
      });
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
        if (prev && this.contains(prev)) { go("prev"); return; }
        if (next && this.contains(next)) { go("next"); return; }
        const dot = e.target && e.target.closest ? e.target.closest(".c-carousel__dot") : null;
        if (dot && this.contains(dot)) {
          const i = Number(dot.dataset.index);
          if (Number.isFinite(i) && i !== this._index()) {
            this.setAttribute("index", String(i));
            this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { index: i, direction: "jump" } }));
          }
        }
      });
      // Swipe: a horizontal drag past the threshold advances one slide.
      let startX = null;
      this.addEventListener("pointerdown", (e) => { startX = e.clientX; });
      this.addEventListener("pointerup", (e) => {
        if (startX === null) return;
        const dx = e.clientX - startX;
        startX = null;
        if (Math.abs(dx) > 40) { if (dx < 0) go("next"); else go("prev"); }
      });
      this.addEventListener("pointercancel", () => { startX = null; });
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
  static get observed() { return ["columns", "rows", "page", "filter", "page-size", "resizable", "virtual", "row-height", "loading", "error", "empty"]; }
  static get properties() { return { columns: { attribute: "columns" }, rows: { attribute: "rows" }, page: { attribute: "page" }, filter: { attribute: "filter" }, "page-size": { attribute: "page-size" }, resizable: { attribute: "resizable", type: Boolean }, virtual: { attribute: "virtual", type: Boolean }, "row-height": { attribute: "row-height" }, loading: { attribute: "loading" }, error: { attribute: "error" }, empty: { attribute: "empty" } }; }
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
      if (!wrap) { wrap = document.createElement("div"); wrap.className = "c-table-wrap c-data-grid__wrap"; }
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
            td.setAttribute("tabindex", "-1");
            td.textContent = r && r[key] != null ? r[key] : "";
            if (!String(td.textContent).trim()) td.setAttribute("aria-label", "Empty");
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
      }
      // Wrap in a scroll container for virtualization of large datasets.
      let wrap = this.querySelector(".c-data-grid__wrap");
      if (!wrap) { wrap = document.createElement("div"); wrap.className = "c-table-wrap c-data-grid__wrap"; }
      if (table.parentNode !== wrap) wrap.appendChild(table);
      if (wrap.parentNode !== this) this.appendChild(wrap);
      // One tab stop per grid: cells are -1 and the arrow keys move a roving
      // tabindex, so a 1,000-row grid is not 1,000 tab stops.
      if (!table.querySelector('[tabindex="0"]')) {
        const first = table.querySelector("tbody td, thead th");
        if (first) first.setAttribute("tabindex", "0");
      }
    }
    _rowHeight() {
      const h = Number(this.getAttribute("row-height"));
      if (Number.isFinite(h) && h > 0) return h;
      if (this._measuredRowHeight > 0) return this._measuredRowHeight;
      return cssLength("--data-grid-row-height", 32);
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
          td.setAttribute("tabindex", "-1");
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
      // The window re-renders rows, so the single tab stop has to be re-seeded
      // here too, or a scroll would leave the grid with no tabbable cell.
      if (!tbody.querySelector('[tabindex="0"]')) {
        const first = tbody.querySelector("tr[data-index] td");
        if (first) first.setAttribute("tabindex", "0");
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
        if (target) {
          e.preventDefault();
          // Move the single tab stop with the focus.
          table.querySelectorAll('[tabindex="0"]').forEach((c) => c.setAttribute("tabindex", "-1"));
          target.setAttribute("tabindex", "0");
          try { target.focus(); } catch (err) {}
        }
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
          // Sort the full filtered dataset, not just the rendered page: a page
          // slice sorted on its own leaves the other pages in the wrong order.
          const table = this.querySelector(".c-data-grid__table");
          const tbody = table && table.querySelector("tbody");
          const thead = table && table.querySelector("thead");
          const cols = this._dgCols || [];
          const key = cols[idx] ? (typeof cols[idx] === "string" ? cols[idx] : (cols[idx].key || cols[idx].label || "")) : String(idx);
          const full = (this._dgFilteredRows || []).slice();
          full.sort((a, b) => {
            const va = a && a[key] != null ? a[key] : "";
            const vb = b && b[key] != null ? b[key] : "";
            const na = Number(va), nb = Number(vb);
            const cmp = (!isNaN(na) && !isNaN(nb)) ? na - nb : String(va).localeCompare(String(vb));
            return sortDir === "asc" ? cmp : -cmp;
          });
          this._dgFilteredRows = full;
          if (tbody) {
            const page = Number(this.getAttribute("page") || 1);
            const pageSize = Number(this.getAttribute("page-size") || 0);
            let pageRows = full;
            if (pageSize > 0) { const start = (page - 1) * pageSize; pageRows = full.slice(start, start + pageSize); }
            tbody.innerHTML = "";
            pageRows.forEach((r) => {
              const tr = document.createElement("tr");
              cols.forEach((c) => {
                const k = typeof c === "string" ? c : (c.key || c.label || "");
                const td = document.createElement("td");
                td.setAttribute("role", "gridcell");
                td.setAttribute("tabindex", "-1");
                td.textContent = r && r[k] != null ? r[k] : "";
                tr.appendChild(td);
              });
              tbody.appendChild(tr);
            });
          }
          // Update aria-sort on headers.
          if (thead) Array.from(thead.querySelectorAll("th")).forEach((h, i) => {
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
    static get observed() { return ["items", "expanded", "loading", "error", "empty"]; }
    static get properties() { return { items: { attribute: "items" }, expanded: { attribute: "expanded" }, loading: { attribute: "loading" }, error: { attribute: "error" }, empty: { attribute: "empty" } }; }
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
      // Wrap the table in the same scroller the reflow gate requires, so a
      // tree grid is not a bare .c-table that stretches the page.
      let wrap = this.querySelector(".c-tree-grid__wrap");
      if (!wrap) { wrap = document.createElement("div"); wrap.className = "c-table-wrap c-tree-grid__wrap"; }
      if (table.parentNode !== wrap) wrap.appendChild(table);
      if (wrap.parentNode !== this) this.appendChild(wrap);
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

class ContourPullToRefresh extends ContourBase {
    static get observed() { return ["threshold"]; }
    static get properties() { return { threshold: { attribute: "threshold" } }; }
    render() {
      this.classList.add("c-pull-to-refresh");
      if (!this.hasAttribute("role")) this.setAttribute("role", "region");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", label(this, "label", "Pull to refresh"));
      const ind = this.ensure(".c-pull-to-refresh__indicator", () => {
        const e = document.createElement("div");
        e.className = "c-pull-to-refresh__indicator";
        e.textContent = label(this, "label", "Pull to refresh");
        return e;
      });
      if (ind.parentNode !== this) this.prepend(ind);
    }
    enhance() {
      if (this._wiredPullToRefresh) return;
      this._wiredPullToRefresh = true;
      let startY = 0;
      let pulling = false;
      this.addEventListener("touchstart", (e) => {
        if (this.scrollTop > 0) return;
        const t = e.touches && e.touches[0];
        if (t) { startY = t.clientY; pulling = true; }
      }, { passive: true });
      this.addEventListener("touchmove", (e) => {
        if (!pulling) return;
        const t = e.touches && e.touches[0];
        if (!t) return;
        const dy = t.clientY - startY;
        if (dy > 0 && dy < 120) {
          this.style.setProperty("--ptr-offset", dy + "px");
        }
      }, { passive: true });
      this.addEventListener("touchend", (e) => {
        if (!pulling) return;
        pulling = false;
        const t = e.changedTouches && e.changedTouches[0];
        const dy = t ? t.clientY - startY : 0;
        const thr = Number(this.getAttribute("threshold")) || 60;
        if (dy >= thr) {
          this.classList.add("is-refreshing");
          this.dispatchEvent(new CustomEvent("contour:refresh", { bubbles: true, composed: true }));
          setTimeout(() => this.classList.remove("is-refreshing"), 800);
        }
        this.style.removeProperty("--ptr-offset");
      }, { passive: true });
    }
  }
  define("contour-pull-to-refresh", ContourPullToRefresh);

