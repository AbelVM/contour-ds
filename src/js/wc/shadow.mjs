import { define, MODS, REGISTERED, contourId } from './core.mjs';
  import { wireTabs, wireSegmented, wireCombobox, wireTree, wireMenu, wirePagination, wireCopy, wireRemovable, wcReset } from './behaviours.mjs';
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
    for (const sheet of document.styleSheets) {
      try {
        if (sheet.href && new URL(sheet.href).origin === location.origin) {
          const built = new CSSStyleSheet();
          built.replaceSync(Array.from(sheet.cssRules, (r) => r.cssText).join("\n"));
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
  class ContourShadow extends HTMLElement {
    static get observedAttributes() { return MODS; }
    constructor() {
      super();
      const root = this.attachShadow({ mode: "open" });
      const sheets = adoptedSheets();
      if (sheets.length) root.adoptedStyleSheets = sheets;
      root.appendChild(this.constructor.contourTemplate.content.cloneNode(true));
      this._shadowBase = root.firstElementChild ? root.firstElementChild.className : "";
      this.enhance(root);
    }
    // Subclasses with behaviour beyond the template override this.
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
      wireTabs(this);
      wireSegmented(this);
      wireCombobox(this);
      wireTree(this);
      wireMenu(this);
      wirePagination(this);
      wireCopy(this);
      wireRemovable(this);
    }
connectedCallback() {
       this.applyMods();
       try { this.enhance(this.shadowRoot); } catch (e) { /* ignore */ }
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
           try { wcReset(this); this.enhance(this.shadowRoot); } catch (e) { /* ignore */ }
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
  const shadow = (name, markup) => {
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
    "<" + tag + ' class="c-' + block + '" part="' + (part || block) + '"><slot></slot></' + tag + ">";
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

  for (const [tag, blocks] of Object.entries(SHADOW_SLOTS)) {
    for (const block of blocks) {
      const part = SHADOW_PARTS[block] || block;
      shadow("contour-shadow-" + block, slotWrapper(tag, block, part));
    }
  }

  // Structured templates: more than one slot, or a class that is not the block's
  // own, so the markup is the definition and is written out.
  shadow("contour-shadow-callout", `<div class="c-callout" part="callout"><div class="c-callout__title" part="title"><slot name="title"></slot></div><div class="c-callout__body" part="body"><slot></slot></div></div>`);
  shadow("contour-shadow-empty", `<div class="c-empty" part="empty"><div class="c-empty__title" part="title"><slot name="title"></slot></div><div class="c-empty__text" part="body"><slot></slot></div><div part="action"><slot name="action"></slot></div></div>`);
  shadow("contour-shadow-feature", `<div class="c-feature" part="feature"><span class="c-feature__index" part="index"><slot name="index"></slot></span><div class="c-feature__title" part="title"><slot name="title"></slot></div><div class="c-feature__body" part="body"><slot></slot></div></div>`);
  shadow("contour-shadow-kpi", `<div class="c-kpi" part="kpi"><div class="c-kpi__value" part="value"><slot name="value"></slot></div><div class="c-kpi__label" part="label"><slot name="label"></slot></div><div class="c-kpi__foot" part="foot"><slot name="delta"></slot><slot name="note"></slot></div></div>`);
  shadow("contour-shadow-stat", `<div class="c-stat" part="stat"><div class="c-stat__value" part="value"><slot name="value"></slot></div><div class="c-stat__label" part="label"><slot name="label"></slot></div><div class="c-stat__delta" part="delta"><slot name="delta"></slot></div></div>`);
  shadow("contour-shadow-meter", `<div class="c-meter" part="meter"><span class="c-meter__core" part="core"><span class="c-meter__value" part="value"><slot name="value"></slot></span><span class="c-meter__label" part="label"><slot name="label"></slot></span></span></div>`);
  shadow("contour-shadow-diff", `<div class="c-diff" part="diff"><div class="c-diff__line c-diff__line--del" part="before"><span class="c-diff__sign">−</span><span><slot name="before"></slot></span></div><div class="c-diff__line c-diff__line--add" part="after"><span class="c-diff__sign">+</span><span><slot name="after"></slot></span></div></div>`);
  shadow("contour-shadow-do-dont", `<div class="c-do-dont" part="do-dont"><div class="c-do-dont__item c-do-dont__item--do" part="do"><slot name="do"></slot></div><div class="c-do-dont__item c-do-dont__item--dont" part="dont"><slot name="dont"></slot></div></div>`);
  shadow("contour-shadow-threshold", `<div class="c-threshold" part="threshold"><span class="c-threshold__fill" part="value"></span><span class="c-threshold__target" part="target"></span></div>`);
  shadow("contour-shadow-coordinate", `<div class="c-coordinate" part="coordinate"><span class="c-coordinate__value" part="value"><slot name="value"></slot></span></div>`);
  shadow("contour-shadow-install", `<div class="c-install" part="install"><span class="c-install__prompt" part="prompt"><slot name="prompt"></slot></span><span class="c-install__command" part="command"><slot name="command"></slot></span><button class="c-btn c-btn--ghost c-btn--sm c-install__copy" part="copy" type="button" aria-label="Copy command">Copy</button></div>`);
  shadow("contour-shadow-toc", `<div class="c-toc" part="toc"><div class="c-toc__title" part="title"><slot name="title"></slot></div><nav class="c-toc__list" part="list"><slot></slot></nav></div>`);
  shadow("contour-shadow-testimonial", `<div class="c-testimonial" part="testimonial"><blockquote class="c-testimonial__quote" part="quote"><slot name="quote"></slot></blockquote><div class="c-testimonial__byline" part="byline"><span class="c-testimonial__name" part="name"><slot name="name"></slot></span><span class="c-testimonial__role" part="role"><slot name="role"></slot></span></div></div>`);
  shadow("contour-shadow-search-trigger", `<button class="c-search-trigger" part="trigger"><span><slot name="label"></slot></span><kbd class="c-kbd"><slot name="shortcut"></slot></kbd></button>`);
  shadow("contour-shadow-brand", `<a class="c-brand" part="brand"><span class="c-mark" part="mark"><slot name="mark"></slot></span><span class="c-brand__name" part="name"><slot name="name"></slot></span></a>`);
  shadow("contour-shadow-section-head", `<div class="c-section-head" part="head"><h2 class="c-section-head__title" part="title"><slot name="title"></slot></h2><p class="c-section-head__desc" part="desc"><slot name="desc"></slot></p></div>`);
  shadow("contour-shadow-loading", `<div class="c-loading" part="loading"><span class="c-spinner" part="spinner"></span><slot></slot></div>`);
  shadow("contour-shadow-tabs", `<div class="c-tabs" part="tabs"><div class="c-tabs__list" part="list"><slot name="tabs"></slot></div><div part="panels"><slot></slot></div></div>`);
  shadow("contour-shadow-breadcrumb", `<nav class="c-breadcrumb" part="breadcrumb" aria-label="Breadcrumb"><ol part="list"><slot></slot></ol></nav>`);
  shadow("contour-shadow-menu", `<div class="c-menu" part="menu" role="menu"><slot></slot></div>`);
  shadow("contour-shadow-combobox", `<div class="c-combobox" part="combobox"><input class="c-combobox__input" part="input" type="text" /><ul class="c-combobox__list" part="list" hidden><slot></slot></ul></div>`);
  shadow("contour-shadow-table", `<div class="c-table-wrap" part="wrap"><table class="c-table" part="table"><thead part="head"><slot name="head"></slot></thead><tbody part="body"><slot></slot></tbody></table></div>`);
  shadow("contour-shadow-chart", `<div class="c-chart" part="chart"><div class="c-chart__plot" part="plot"><slot></slot></div></div>`);
  shadow("contour-shadow-bivariate", `<div class="c-bivariate" part="bivariate"><div class="c-bivariate__matrix" part="matrix"><slot></slot></div></div>`);
  shadow("contour-shadow-expandable", `<details class="c-expandable" part="expandable"><summary part="summary"><slot name="summary"></slot></summary><div class="c-expandable__body" part="body"><slot></slot></div></details>`);
  shadow("contour-shadow-disclosure", `<details class="c-disclosure" part="disclosure"><summary part="summary"><slot name="summary"></slot></summary><div class="c-disclosure__body" part="body"><slot></slot></div></details>`);
  shadow("contour-shadow-faq", `<div class="c-faq" part="faq"><div class="c-faq__question" part="question"><slot name="question"></slot></div><div class="c-faq__answer" part="answer"><slot name="answer"></slot></div></div>`);
  shadow("contour-shadow-code-tabs", `<div class="c-code-tabs" part="code-tabs"><div class="c-code-tabs__list" part="list"><slot name="tabs"></slot></div><div part="panels"><slot></slot></div></div>`);
  shadow("contour-shadow-header", `<header class="c-header" part="header"><div class="container c-header__inner" part="inner"><a class="c-brand" part="brand"><slot name="brand"></slot></a><nav class="c-header__nav" part="nav"><slot name="nav"></slot></nav><div class="c-header__actions" part="actions"><slot name="actions"></slot></div></div></header>`);
  shadow("contour-shadow-footer", `<footer class="c-footer" part="footer"><div class="container c-footer__grid" part="grid"><div class="c-footer__brand" part="brand"><slot name="brand"></slot></div><div class="c-footer__links" part="links"><slot name="links"></slot></div></div></footer>`);
  shadow("contour-shadow-container", `<div class="container" part="container"><slot></slot></div>`);
  shadow("contour-shadow-input", `<input class="c-input" part="input" />`);
  shadow("contour-shadow-spinner", `<span class="c-spinner" part="spinner" role="status" aria-label="Loading"></span>`);
  shadow("contour-shadow-textarea", `<textarea class="c-textarea" part="textarea"></textarea>`);
  shadow("contour-shadow-code", `<pre class="c-code" part="code"><code><slot></slot></code><button class="c-code__copy" part="copy" type="button">Copy</button></pre>`);
  // (folded in from the hand-written component that used to carry its own copy of the sheet logic)
  shadow("contour-shadow-card", `<div class="c-card" part="card"> <div class="c-card__title" part="head"><slot name="title">Untitled</slot></div> <div class="c-card__body" part="body"><slot></slot></div> <div class="c-card__foot" part="foot"><slot name="foot"></slot></div> </div>`);
  // (folded in from the hand-written component that used to carry its own copy of the sheet logic)
  // (folded in from the hand-written component that used to carry its own copy of the sheet logic)
  shadow("contour-shadow-field", `<div class="c-field" part="field"> <label class="c-field__label" part="label"><slot name="label">Label</slot></label> <slot name="input"></slot> <span class="c-field__hint" part="hint"><slot name="hint"></slot></span> </div>`);
  // (folded in from the hand-written component that used to carry its own copy of the sheet logic)
  shadow("contour-shadow-alert", `<div class="c-alert" part="alert"> <div class="c-alert__title" part="title"><slot name="title"></slot></div> <div class="c-alert__body" part="body"><slot></slot></div> </div>`);
shadow("contour-shadow-tag", `<span class="c-tag" part="tag"><slot></slot><button class="c-tag__remove" part="remove" type="button" aria-label="Remove">×</button></span>`);
shadow("contour-shadow-filter-pill", `<span class="c-filter-pill" part="filter-pill"><slot></slot><button class="c-filter-pill__remove" part="remove" type="button" aria-label="Remove filter">×</button></span>`);

  // The dialog is the one wrapper with behaviour, because a close button that
  // does not close is a control the reader cannot use.
  class ContourShadowDialog extends ContourShadow {
    static contourTemplate = (() => {
      const tpl = document.createElement("template");
      tpl.innerHTML = "<dialog class=\"c-dialog\" part=\"dialog\"> <div class=\"c-dialog__head\" part=\"head\"> <slot name=\"title\"></slot> <button class=\"c-btn c-btn--icon c-btn--ghost\" part=\"close\" type=\"button\" aria-label=\"Close\"> <svg aria-hidden=\"true\"><use href=\"#i-close\" /></svg> </button> </div> <div class=\"c-dialog__body\" part=\"body\"><slot></slot></div> <div class=\"c-dialog__foot\" part=\"foot\"><slot name=\"foot\"></slot></div> </dialog>";
      return tpl;
    })();
    enhance(root) {
      super.enhance(root);
      const dlg = root.querySelector("dialog");
      const close = root.querySelector('[part="close"]');
      if (close) close.addEventListener("click", () => dlg?.close());
      if (dlg) {
        let lastFocus = null;
        dlg.addEventListener("show", () => {
          lastFocus = document.activeElement;
          this.dispatchEvent(new CustomEvent("contour:open", { bubbles: true, composed: true }));
          // Focus the close button or first focusable element
          const focusable = dlg.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
          if (focusable) try { focusable.focus(); } catch (e) {}
        });
        dlg.addEventListener("close", () => {
          this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
          // Restore focus
          if (lastFocus && typeof lastFocus.focus === "function") {
            try { lastFocus.focus(); } catch (e) {}
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
  window.ContourElements = Object.freeze(REGISTERED.slice());
