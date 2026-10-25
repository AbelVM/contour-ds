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
  let ADOPTED = null;
  let ADOPTED_KEY = "";
  const adoptedSheets = () => {
    const key = Array.from(document.styleSheets, (s) => s.href || "").join("|");
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
      if (!root || this._wiredShadow) return;
      this._wiredShadow = true;
      // Tabs / code-tabs panel switching
      const tabLists = root.querySelectorAll(".c-tabs__list, .c-code-tabs__list");
      tabLists.forEach((list) => {
        const isCode = list.classList.contains("c-code-tabs__list");
        const tabSel = isCode ? ".c-code-tabs__tab" : ".c-tabs__tab";
        const activeCls = isCode ? "c-code-tabs__tab--active" : "c-tabs__tab--active";
        const activate = (tab, focus) => {
          const tabs = Array.from(list.querySelectorAll("[role='tab']"));
          tabs.forEach((t) => {
            const selected = t === tab;
            t.setAttribute("aria-selected", String(selected));
            t.tabIndex = selected ? 0 : -1;
            t.classList.toggle(activeCls, selected);
            const ctrl = t.getAttribute("aria-controls");
            if (ctrl) {
              const panel = root.querySelector("#" + CSS.escape(ctrl)) || document.getElementById(ctrl);
              if (panel) panel.hidden = !selected;
            }
          });
          const panels = Array.from(root.querySelectorAll(isCode ? ".c-code-tabs__panel" : ".c-tabs__panel"));
          if (panels.length) {
            const idx = tabs.indexOf(tab);
            panels.forEach((p, i) => { p.hidden = i !== idx; });
          }
          if (focus) try { tab.focus(); } catch (e) {}
        };
        root.addEventListener("click", (e) => {
          const tab = e.target && e.target.closest ? e.target.closest("[role='tab']") : null;
          if (tab && list.contains(tab)) activate(tab, false);
        });
        root.addEventListener("keydown", (e) => {
          const tab = e.target && e.target.closest ? e.target.closest("[role='tab']") : null;
          if (!tab || !list.contains(tab)) return;
          const tabs = Array.from(list.querySelectorAll("[role='tab']"));
          const index = tabs.indexOf(tab);
          const map = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
          if (!(e.key in map)) return;
          e.preventDefault();
          const next = tabs[(map[e.key] + tabs.length) % tabs.length];
          if (next) activate(next, true);
        });
        const first = list.querySelector("[role='tab']");
        if (first) activate(first, false);
      });
      // Segmented
      const segs = root.querySelectorAll(".c-segmented");
      segs.forEach((seg) => {
        seg.addEventListener("click", (e) => {
          const btn = e.target && e.target.closest ? e.target.closest("button") : null;
          if (!btn || !seg.contains(btn)) return;
          const options = Array.from(seg.querySelectorAll("button"));
          options.forEach((o) => o.setAttribute("aria-pressed", String(o === btn)));
          seg.dispatchEvent(new CustomEvent("contour:change", { detail: { value: btn.dataset.value || btn.textContent }, bubbles: true }));
        });
      });
      // Combobox
      const combos = root.querySelectorAll(".c-combobox");
      combos.forEach((combo) => {
        const input = combo.querySelector(".c-combobox__input");
        const list = combo.querySelector(".c-combobox__list");
        if (!input || !list) return;
        const opts = () => Array.from(combo.querySelectorAll(".c-combobox__option"));
        let activeIndex = -1;
        const filter = (q) => {
          const query = (q || "").toLowerCase();
          opts().forEach((o) => {
            const text = o.textContent.toLowerCase();
            o.hidden = !!(query && !text.includes(query));
          });
          activeIndex = -1;
        };
        const open = () => list.removeAttribute("hidden");
        const close = () => list.setAttribute("hidden", "");
        input.addEventListener("input", () => { filter(input.value); open(); });
        input.addEventListener("focus", () => { filter(input.value); open(); });
        input.addEventListener("keydown", (e) => {
          const visible = opts().filter((o) => !o.hidden);
          if (e.key === "ArrowDown") {
            e.preventDefault();
            activeIndex = Math.min(activeIndex + 1, visible.length - 1);
            visible.forEach((o, i) => o.classList.toggle("c-combobox__option--active", i === activeIndex));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            activeIndex = Math.max(activeIndex - 1, 0);
            visible.forEach((o, i) => o.classList.toggle("c-combobox__option--active", i === activeIndex));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeIndex >= 0 && visible[activeIndex]) {
              input.value = visible[activeIndex].textContent;
              close();
            }
          } else if (e.key === "Escape") {
            close();
          }
        });
        list.addEventListener("click", (e) => {
          const opt = e.target && e.target.closest ? e.target.closest(".c-combobox__option") : null;
          if (opt) {
            input.value = opt.textContent;
            close();
            input.focus();
          }
        });
        root.addEventListener("click", (e) => {
          if (!combo.contains(e.target)) close();
        });
      });
      // Tree
      const toggles = root.querySelectorAll(".c-tree__toggle");
      toggles.forEach((toggle) => {
        toggle.addEventListener("click", (e) => {
          e.stopPropagation();
          const expanded = toggle.getAttribute("aria-expanded") === "true";
          toggle.setAttribute("aria-expanded", String(!expanded));
          const row = toggle.closest(".c-tree__row");
          if (row) row.setAttribute("aria-expanded", String(!expanded));
          const node = toggle.closest(".c-tree__node");
          const children = node ? node.querySelector(":scope > .c-tree__children") : null;
          if (children) {
            if (expanded) children.setAttribute("hidden", "");
            else children.removeAttribute("hidden");
          }
        });
      });
      // Menu
      const menus = root.querySelectorAll(".c-menu");
      menus.forEach((menu) => {
        const items = () => Array.from(menu.querySelectorAll("[role='menuitem']"));
        items().forEach((it) => { if (!it.hasAttribute("tabindex")) it.setAttribute("tabindex", "-1"); });
        menu.addEventListener("keydown", (e) => {
          const its = items();
          if (!its.length) return;
          const current = (typeof document !== "undefined") ? document.activeElement : null;
          const idx = its.indexOf(current);
          let next = -1;
          if (e.key === "ArrowDown") next = idx < 0 ? 0 : Math.min(idx + 1, its.length - 1);
          else if (e.key === "ArrowUp") next = idx < 0 ? its.length - 1 : Math.max(idx - 1, 0);
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = its.length - 1;
          if (next >= 0) { e.preventDefault(); its[next].focus(); return; }
          if ((e.key === "Enter" || e.key === " ") && idx >= 0) {
            e.preventDefault();
            menu.dispatchEvent(new CustomEvent("contour:select", { detail: { index: idx, label: its[idx].textContent }, bubbles: true }));
          }
        });
      });
      // Code copy
      const codes = root.querySelectorAll(".c-code");
      codes.forEach((code) => {
        const btn = code.querySelector(".c-code__copy");
        if (btn && !btn._wired) {
          btn._wired = true;
          btn.addEventListener("click", () => {
            const text = code.textContent;
            if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
            this.dispatchEvent(new CustomEvent("contour:copy", { detail: { text }, bubbles: true }));
          });
        }
      });
      // Install copy
      const installs = root.querySelectorAll(".c-install");
      installs.forEach((inst) => {
        const btn = inst.querySelector(".c-install__copy");
        if (btn && !btn._wired) {
          btn._wired = true;
          btn.addEventListener("click", () => {
            const cmd = inst.querySelector(".c-install__command");
            const text = cmd ? cmd.textContent : "";
            if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
            this.dispatchEvent(new CustomEvent("contour:copy", { detail: { text }, bubbles: true }));
          });
        }
      });
      // Pagination
      const pagers = root.querySelectorAll(".c-pagination");
      pagers.forEach((pager) => {
        if (pager._wired) return;
        pager._wired = true;
        pager.addEventListener("click", (e) => {
          const btn = e.target && e.target.closest ? e.target.closest(".c-pagination__link") : null;
          if (!btn || !pager.contains(btn)) return;
          const page = parseInt(btn.textContent, 10);
          pager.querySelectorAll(".c-pagination__link").forEach((b) => {
            const active = parseInt(b.textContent, 10) === page;
            b.classList.toggle("c-pagination__current", active);
            if (active) b.setAttribute("aria-current", "page");
            else b.removeAttribute("aria-current");
          });
          this.dispatchEvent(new CustomEvent("contour:page", { detail: { page }, bubbles: true }));
        });
      });
      // Tag remove
      const tags = root.querySelectorAll(".c-tag");
      tags.forEach((tag) => {
        const btn = tag.querySelector(".c-tag__remove");
        if (btn && !btn._wired) {
          btn._wired = true;
          btn.addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("contour:remove", { detail: { label: tag.getAttribute("label") || tag.textContent.trim() }, bubbles: true }));
            if (tag.parentNode) tag.parentNode.removeChild(tag);
          });
        }
      });
      // Filter pill remove
      const pills = root.querySelectorAll(".c-filter-pill");
      pills.forEach((pill) => {
        const btn = pill.querySelector(".c-filter-pill__remove");
        if (btn && !btn._wired) {
          btn._wired = true;
          btn.addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("contour:remove", { detail: { key: pill.getAttribute("key"), value: pill.getAttribute("value") }, bubbles: true }));
            if (pill.parentNode) pill.parentNode.removeChild(pill);
          });
        }
      });
      // Empty action
      const empties = root.querySelectorAll(".c-empty");
      empties.forEach((empty) => {
        const btn = empty.querySelector(".c-empty__action");
        if (btn && !btn._wired) {
          btn._wired = true;
          btn.addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("contour:empty-action", { detail: { state: this.getAttribute("state") || "empty" }, bubbles: true }));
          });
        }
      });
    }
    connectedCallback() { this.applyMods(); }
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
      "filter-bar", "flow-map", "heatmap", "hexbin", "icon-badge", "input-group", "instrument", "range-scale", "resizable", "table-wrap", "time-range", "toast-host", "virtual-scroll",
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
  shadow("contour-shadow-empty", `<div class="c-empty" part="empty"><div class="c-empty__title" part="title"><slot name="title"></slot></div><div class="c-empty__body" part="body"><slot></slot></div><div class="c-empty__action" part="action"><slot name="action"></slot></div></div>`);
  shadow("contour-shadow-feature", `<div class="c-feature" part="feature"><div class="c-feature__icon" part="icon"><slot name="icon"></slot></div><div class="c-feature__title" part="title"><slot name="title"></slot></div><div class="c-feature__body" part="body"><slot></slot></div></div>`);
  shadow("contour-shadow-kpi", `<div class="c-kpi" part="kpi"><div class="c-kpi__value" part="value"><slot name="value"></slot></div><div class="c-kpi__label" part="label"><slot name="label"></slot></div><div class="c-kpi__delta" part="delta"><slot name="delta"></slot></div></div>`);
  shadow("contour-shadow-stat", `<div class="c-stat" part="stat"><div class="c-stat__value" part="value"><slot name="value"></slot></div><div class="c-stat__label" part="label"><slot name="label"></slot></div><div class="c-stat__delta" part="delta"><slot name="delta"></slot></div></div>`);
  shadow("contour-shadow-meter", `<div class="c-meter" part="meter"><span class="c-meter__core" part="core"><span class="c-meter__value" part="value"><slot name="value"></slot></span><span class="c-meter__label" part="label"><slot name="label"></slot></span></span></div>`);
  shadow("contour-shadow-diff", `<div class="c-diff" part="diff"><div class="c-diff__before" part="before"><slot name="before"></slot></div><div class="c-diff__after" part="after"><slot name="after"></slot></div></div>`);
  shadow("contour-shadow-do-dont", `<div class="c-do-dont" part="do-dont"><div class="c-do-dont__do" part="do"><slot name="do"></slot></div><div class="c-do-dont__dont" part="dont"><slot name="dont"></slot></div></div>`);
  shadow("contour-shadow-threshold", `<div class="c-threshold" part="threshold"><span class="c-threshold__value" part="value"><slot name="value"></slot></span><span class="c-threshold__label" part="label"><slot name="label"></slot></span></div>`);
  shadow("contour-shadow-coordinate", `<div class="c-coordinate" part="coordinate"><span class="c-coordinate__value" part="value"><slot name="value"></slot></span></div>`);
  shadow("contour-shadow-install", `<div class="c-install" part="install"><span class="c-install__prompt" part="prompt"><slot name="prompt"></slot></span><span class="c-install__command" part="command"><slot name="command"></slot></span><button class="c-btn c-btn--ghost c-btn--sm c-install__copy" part="copy" type="button" aria-label="Copy command">Copy</button></div>`);
  shadow("contour-shadow-toc", `<div class="c-toc" part="toc"><div class="c-toc__title" part="title"><slot name="title"></slot></div><nav class="c-toc__list" part="list"><slot></slot></nav></div>`);
  shadow("contour-shadow-testimonial", `<div class="c-testimonial" part="testimonial"><blockquote class="c-testimonial__quote" part="quote"><slot name="quote"></slot></blockquote><div class="c-testimonial__byline" part="byline"><span class="c-testimonial__name" part="name"><slot name="name"></slot></span><span class="c-testimonial__role" part="role"><slot name="role"></slot></span></div></div>`);
  shadow("contour-shadow-search-trigger", `<button class="c-search-trigger" part="trigger"><span><slot name="label"></slot></span><kbd class="c-kbd"><slot name="shortcut"></slot></kbd></button>`);
  shadow("contour-shadow-brand", `<a class="c-brand" part="brand"><span class="c-mark" part="mark"><slot name="mark"></slot></span><span class="c-brand__name" part="name"><slot name="name"></slot></span></a>`);
  shadow("contour-shadow-section-head", `<div class="c-section-head" part="head"><h2 class="c-section-head__title" part="title"><slot name="title"></slot></h2><p class="c-section-head__desc" part="desc"><slot name="desc"></slot></p></div>`);
  shadow("contour-shadow-loading", `<div class="c-loading" part="loading"><span class="c-spinner" part="spinner"></span><slot></slot></div>`);
  shadow("contour-shadow-tabs", `<div class="c-tabs" part="tabs"><div class="c-tabs__list" part="list"><slot name="tabs"></slot></div><div class="c-tabs__panels" part="panels"><slot></slot></div></div>`);
  shadow("contour-shadow-breadcrumb", `<nav class="c-breadcrumb" part="breadcrumb" aria-label="Breadcrumb"><ol part="list"><slot></slot></ol></nav>`);
  shadow("contour-shadow-menu", `<div class="c-menu" part="menu" role="menu"><slot></slot></div>`);
  shadow("contour-shadow-combobox", `<div class="c-combobox" part="combobox"><input class="c-combobox__input" part="input" type="text" /><ul class="c-combobox__list" part="list" hidden><slot></slot></ul></div>`);
  shadow("contour-shadow-table", `<div class="c-table-wrap" part="wrap"><table class="c-table" part="table"><thead part="head"><slot name="head"></slot></thead><tbody part="body"><slot></slot></tbody></table></div>`);
  shadow("contour-shadow-chart", `<div class="c-chart" part="chart"><div class="c-chart__plot" part="plot"><slot></slot></div></div>`);
  shadow("contour-shadow-bivariate", `<div class="c-bivariate" part="bivariate"><div class="c-bivariate__matrix" part="matrix"><slot></slot></div></div>`);
  shadow("contour-shadow-expandable", `<details class="c-expandable" part="expandable"><summary part="summary"><slot name="summary"></slot></summary><div class="c-expandable__body" part="body"><slot></slot></div></details>`);
  shadow("contour-shadow-disclosure", `<details class="c-disclosure" part="disclosure"><summary part="summary"><slot name="summary"></slot></summary><div class="c-disclosure__body" part="body"><slot></slot></div></details>`);
  shadow("contour-shadow-faq", `<div class="c-faq" part="faq"><div class="c-faq__question" part="question"><slot name="question"></slot></div><div class="c-faq__answer" part="answer"><slot name="answer"></slot></div></div>`);
  shadow("contour-shadow-code-tabs", `<div class="c-code-tabs" part="code-tabs"><div class="c-code-tabs__list" part="list"><slot name="tabs"></slot></div><div class="c-code-tabs__panels" part="panels"><slot></slot></div></div>`);
  shadow("contour-shadow-header", `<header class="c-header" part="header"><div class="container c-header__inner" part="inner"><a class="c-brand" part="brand"><slot name="brand"></slot></a><nav class="c-header__nav" part="nav"><slot name="nav"></slot></nav><div class="c-header__actions" part="actions"><slot name="actions"></slot></div></div></header>`);
  shadow("contour-shadow-footer", `<footer class="c-footer" part="footer"><div class="container c-footer__grid" part="grid"><div class="c-footer__brand" part="brand"><slot name="brand"></slot></div><div class="c-footer__links" part="links"><slot name="links"></slot></div></div></footer>`);
  shadow("contour-shadow-container", `<div class="container" part="container"><slot></slot></div>`);
  shadow("contour-shadow-input", `<input class="c-input" part="input" />`);
  shadow("contour-shadow-spinner", `<span class="c-spinner" part="spinner" role="status" aria-label="Loading"></span>`);
  shadow("contour-shadow-textarea", `<textarea class="c-textarea" part="textarea"></textarea>`);
  shadow("contour-shadow-code", `<pre class="c-code" part="code"><code><slot></slot></code><button class="c-code__copy" part="copy" type="button">Copy</button></pre>`);
  // (folded in from the hand-written component that used to carry its own copy of the sheet logic)
  shadow("contour-shadow-card", `<div class="c-card" part="card"> <div class="c-card__head" part="head"><slot name="title">Untitled</slot></div> <div class="c-card__body" part="body"><slot></slot></div> <div class="c-card__foot" part="foot"><slot name="foot"></slot></div> </div>`);
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
      const close = root.querySelector('[part="close"]');
      if (close) close.addEventListener("click", () => root.querySelector("dialog")?.close());
    }
    show() { this.shadowRoot?.querySelector("dialog")?.showModal(); }
  }
  define("contour-shadow-dialog", ContourShadowDialog);

  // Published once, at the end, so the array holds what the browser was actually
  // handed rather than what the source appears to say. Frozen: a page that
  // reshapes it would make the next reader's count wrong, which is the failure
  // this array exists to prevent.
  window.ContourElements = Object.freeze(REGISTERED.slice());
})();
