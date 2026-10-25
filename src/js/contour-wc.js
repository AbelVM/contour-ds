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
    "steps", "subtitle", "summary", "tabs", "tag", "text", "title", "type", "value",
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
        this.enhance();
      } finally {
        this._contourRendering = false;
      }
    }

    disconnectedCallback() {
      // Override in subclasses that attach event listeners or timers.
    }

    // Subclasses override this. It must be safe to call repeatedly.
    render() {}
    // Subclasses override this to attach behaviour. Called after every render;
    // implementations must be idempotent (guard with a flag).
    enhance() {}
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
    "activity", "advanced", "affordance", "affordances", "alert", "anchor", "app", "app-body",
    "avatar", "badge", "bivariate", "box", "brand", "breadcrumb", "btn", "btn-group",
    "callout", "card", "chart", "chart-grid", "check", "chip", "cluster",
    "code-tabs", "combobox", "container", "contour-plot", "delta", "dialog", "diff",
    "disclosure", "do-dont", "dot", "drag-handle", "draggable", "drawer",
    "drop-indicator", "drop-zone", "empty", "expandable", "faq", "feature", "field",
    "flag", "header", "input",
    "instrument", "kbd", "kpi", "link",
    "mark", "menu", "meter", "pagination",
    "pill", "progress", "radio", "radio-list", "range",
    "range-scale", "readout", "resizable", "row", "scrim", "section-head",
    "select", "sheet", "skeleton", "spinner", "stack",
    "stat", "survey", "switch", "table", "table-wrap", "tabs", "textarea", "threshold",
    "time-range", "toast", "toast-host", "toolbar", "tooltip", "tree", "virtual-scroll"
  ];


  // ---- Complex components with scaffolding ----

  // Menu: generates <ul> with items from data-items attribute.
  class ContourMenu extends ContourBase {
    render() {
      this.classList.add("c-menu");
      if (!this.hasAttribute("role")) this.setAttribute("role", "menu");
      const items = this.getAttribute("items");
      if (items && !this.querySelector(".c-menu__item")) {
        try {
          const parsed = JSON.parse(items);
          const ul = document.createElement("ul");
          ul.className = "c-menu";
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
            } else {
              const li = document.createElement("li");
              li.className = "c-menu__item" + (item.danger ? " c-menu__item--danger" : "");
              li.setAttribute("role", "menuitem");
              li.textContent = item.label || item.title || "";
              ul.appendChild(li);
            }
          });
          this.innerHTML = "";
          this.appendChild(ul);
          this.classList.remove("c-menu");
          ul.classList.add("c-menu");
        } catch (e) { /* keep existing content */ }
      }
    }
    enhance() {
      if (this._wiredMenu) return;
      this._wiredMenu = true;
      const items = () => Array.from(this.querySelectorAll("[role='menuitem']"));
      this.addEventListener("keydown", (e) => {
        const its = items();
        if (!its.length) return;
        const current = document.activeElement;
        const idx = its.indexOf(current);
        let next = -1;
        if (e.key === "ArrowDown") next = idx < 0 ? 0 : Math.min(idx + 1, its.length - 1);
        else if (e.key === "ArrowUp") next = idx < 0 ? its.length - 1 : Math.max(idx - 1, 0);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = its.length - 1;
        if (next >= 0) {
          e.preventDefault();
          its[next].focus();
          return;
        }
        if ((e.key === "Enter" || e.key === " ") && idx >= 0) {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:select", { detail: { index: idx, label: its[idx].textContent }, bubbles: true }));
        }
      });
      // make items focusable
      items().forEach((it) => { if (!it.hasAttribute("tabindex")) it.setAttribute("tabindex", "-1"); });
    }
  }
  define("contour-menu", ContourMenu);

  // Card: wraps slotted content in card structure.
  class ContourCard extends ContourBase {
    render() {
      this.classList.add("c-card");
      // If title attribute provided, prepend title.
      const title = this.getAttribute("title");
      if (title && !this.querySelector(".c-card__title")) {
        const h = document.createElement("h3");
        h.className = "c-card__title";
        h.textContent = title;
        this.prepend(h);
      }
    }
  }
  define("contour-card", ContourCard);

  // Tabs: generates tab list from data-tabs attribute.
  class ContourTabs extends ContourBase {
    render() {
      this.classList.add("c-tabs");
      const tabs = this.getAttribute("tabs");
      if (tabs && !this.querySelector(".c-tabs__list")) {
        try {
          const parsed = JSON.parse(tabs);
          const list = document.createElement("div");
          list.className = "c-tabs__list";
          list.setAttribute("role", "tablist");
          parsed.forEach((t, i) => {
            const btn = document.createElement("button");
            btn.className = "c-tabs__tab" + (i === 0 ? " c-tabs__tab--active" : "");
            btn.setAttribute("role", "tab");
            btn.setAttribute("aria-selected", String(i === 0));
            btn.tabIndex = i === 0 ? 0 : -1;
            btn.textContent = typeof t === "string" ? t : t.label;
            list.appendChild(btn);
          });
          this.prepend(list);
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredTabs) return;
      this._wiredTabs = true;
      const activate = (tab, focus) => {
        const list = this.querySelector(".c-tabs__list");
        if (!list) return;
        const tabs = Array.from(list.querySelectorAll("[role='tab']"));
        tabs.forEach((t) => {
          const selected = t === tab;
          t.setAttribute("aria-selected", String(selected));
          t.tabIndex = selected ? 0 : -1;
          t.classList.toggle("c-tabs__tab--active", selected);
          const ctrl = t.getAttribute("aria-controls");
          if (ctrl) {
            const panel = document.getElementById(ctrl) || this.querySelector("#" + CSS.escape(ctrl));
            if (panel) panel.hidden = !selected;
          }
        });
        // index-based panels fallback
        const panels = Array.from(this.querySelectorAll(".c-tabs__panel"));
        if (panels.length) {
          const idx = tabs.indexOf(tab);
          panels.forEach((p, i) => { p.hidden = i !== idx; });
        }
        if (focus) try { tab.focus(); } catch (e) {}
      };
      this.addEventListener("click", (e) => {
        const tab = e.target && e.target.closest ? e.target.closest("[role='tab']") : null;
        if (tab && this.contains(tab)) activate(tab, false);
      });
      this.addEventListener("keydown", (e) => {
        const tab = e.target && e.target.closest ? e.target.closest("[role='tab']") : null;
        if (!tab) return;
        const list = this.querySelector(".c-tabs__list");
        if (!list) return;
        const tabs = Array.from(list.querySelectorAll("[role='tab']"));
        const index = tabs.indexOf(tab);
        const map = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
        if (!(e.key in map)) return;
        e.preventDefault();
        const next = tabs[(map[e.key] + tabs.length) % tabs.length];
        if (next) activate(next, true);
      });
      // initialise
      const first = this.querySelector(".c-tabs__list [role='tab']");
      if (first) activate(first, false);
    }
  }
  define("contour-tabs", ContourTabs);

  // Header: generates brand + nav + actions.
  class ContourHeader extends ContourBase {
    render() {
      this.classList.add("c-header");
      const brand = this.getAttribute("brand");
      const links = this.getAttribute("links");
      if (brand && !this.querySelector(".c-brand")) {
        const inner = document.createElement("div");
        inner.className = "container c-header__inner";
        // Brand
        const brandEl = document.createElement("a");
        brandEl.className = "c-brand";
        brandEl.href = "#";
        brandEl.innerHTML = `<span class="c-mark"><svg aria-hidden="true"><use href="#i-mark" /></svg></span>`;
        const brandName = document.createElement("span");
        brandName.className = "c-brand__name";
        brandName.textContent = brand;
        brandEl.appendChild(brandName);
        inner.appendChild(brandEl);
        // Nav
        if (links) {
          try {
            const parsed = JSON.parse(links);
            const nav = document.createElement("nav");
            nav.className = "c-header__nav";
            nav.setAttribute("aria-label", "Main");
            parsed.forEach((l) => {
              const a = document.createElement("a");
              a.href = l.href || "#";
              a.textContent = l.label || l;
              nav.appendChild(a);
            });
            inner.appendChild(nav);
          } catch (e) { /* skip */ }
        }
        // Actions slot
        const actions = document.createElement("div");
        actions.className = "c-header__actions";
        const slot = document.createElement("slot");
        actions.appendChild(slot);
        inner.appendChild(actions);
        this.innerHTML = "";
        this.appendChild(inner);
      }
    }
  }
  define("contour-header", ContourHeader);

  // Combobox: generates input + list from data-options.
  class ContourCombobox extends ContourBase {
    render() {
      this.classList.add("c-combobox");
      const options = this.getAttribute("options");
      if (options && !this.querySelector(".c-combobox__input")) {
        try {
          const parsed = JSON.parse(options);
          const input = document.createElement("input");
          input.className = "c-combobox__input";
          input.type = "text";
          input.placeholder = this.getAttribute("placeholder") || "Search…";
          input.setAttribute("aria-label", this.getAttribute("label") || "Search");
          const list = document.createElement("ul");
          list.className = "c-combobox__list";
          list.setAttribute("hidden", "");
          parsed.forEach((opt) => {
            const li = document.createElement("li");
            li.className = "c-combobox__option";
            li.textContent = typeof opt === "string" ? opt : opt.label;
            list.appendChild(li);
          });
          this.innerHTML = "";
          this.appendChild(input);
          this.appendChild(list);
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredCombobox) return;
      this._wiredCombobox = true;
      const input = () => this.querySelector(".c-combobox__input");
      const list = () => this.querySelector(".c-combobox__list");
      const options = () => Array.from(this.querySelectorAll(".c-combobox__option"));
      let activeIndex = -1;
      const filter = (query) => {
        const q = (query || "").toLowerCase();
        options().forEach((opt) => {
          const text = opt.textContent.toLowerCase();
          opt.hidden = !!(q && !text.includes(q));
        });
        activeIndex = -1;
      };
      const open = () => { const l = list(); if (l) l.removeAttribute("hidden"); };
      const close = () => { const l = list(); if (l) l.setAttribute("hidden", ""); };
      const inp = input();
      if (!inp) return;
      const lst = list();
      inp.addEventListener("input", () => { filter(inp.value); open(); });
      inp.addEventListener("focus", () => { filter(inp.value); open(); });
      inp.addEventListener("keydown", (e) => {
        const visible = options().filter((o) => !o.hidden);
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
            inp.value = visible[activeIndex].textContent;
            close();
          }
        } else if (e.key === "Escape") {
          close();
        }
      });
      if (lst) {
        lst.addEventListener("click", (e) => {
          const opt = e.target && e.target.closest ? e.target.closest(".c-combobox__option") : null;
          if (opt) {
            inp.value = opt.textContent;
            close();
            inp.focus();
          }
        });
      }
      const docClick = (e) => {
        if (!this.isConnected) { document.removeEventListener("click", docClick); return; }
        if (!this.contains(e.target)) close();
      };
      document.addEventListener("click", docClick);
    }
  }
  define("contour-combobox", ContourCombobox);

  // Tree: generates from data-items.
  class ContourTree extends ContourBase {
    render() {
      this.classList.add("c-tree");
      const items = this.getAttribute("items");
      if (items && !this.querySelector(".c-tree__node")) {
        try {
          const parsed = JSON.parse(items);
          const render = (nodes, parent) => {
            const ul = document.createElement("ul");
            ul.className = parent ? "c-tree__children" : "c-tree";
            if (parent) ul.setAttribute("hidden", "");
            nodes.forEach((node) => {
              const li = document.createElement("li");
              li.className = "c-tree__node";
              if (node.children) {
                const row = document.createElement("div");
                row.className = "c-tree__row";
                row.setAttribute("aria-expanded", "false");
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
                render(node.children, li);
              } else {
                const leaf = document.createElement("div");
                leaf.className = "c-tree__leaf";
                leaf.textContent = node.label || node;
                li.appendChild(leaf);
              }
              ul.appendChild(li);
            });
            if (parent) parent.appendChild(ul);
            else { this.innerHTML = ""; this.appendChild(ul); this.classList.remove("c-tree"); ul.classList.add("c-tree"); }
          };
          render(parsed, null);
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredTree) return;
      this._wiredTree = true;
      this.addEventListener("click", (e) => {
        const toggle = e.target && e.target.closest ? e.target.closest(".c-tree__toggle") : null;
        if (!toggle || !this.contains(toggle)) return;
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
    }
  }
  define("contour-tree", ContourTree);

  // ---- Additional complex components with scaffolding ----

  // Dialog: generates head + body + foot from attributes.
  class ContourDialog extends ContourBase {
    render() {
      this.classList.add("c-dialog");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
      const title = this.getAttribute("title");
      if (title && !this.querySelector(".c-dialog__head")) {
        const head = document.createElement("div");
        head.className = "c-dialog__head";
        const h = document.createElement("h2");
        h.className = "c-dialog__title";
        h.textContent = title;
        head.appendChild(h);
        const closeBtn = document.createElement("button");
        closeBtn.className = "c-btn c-btn--icon c-btn--ghost";
        closeBtn.setAttribute("type", "button");
        closeBtn.setAttribute("aria-label", "Close");
        closeBtn.innerHTML = '<svg aria-hidden="true"><use href="#i-close" /></svg>';
        head.appendChild(closeBtn);
        this.prepend(head);
      }
    }
  }
  define("contour-dialog", ContourDialog);

  // Alert: generates icon + title + body.
  class ContourAlert extends ContourBase {
    render() {
      this.classList.add("c-alert");
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-alert--" + variant);
      const title = this.getAttribute("title");
      if (title && !this.querySelector(".c-alert__title")) {
        const t = document.createElement("div");
        t.className = "c-alert__title";
        t.textContent = title;
        this.prepend(t);
      }
    }
  }
  define("contour-alert", ContourAlert);

  // Field: generates label + input + hint/error.
  class ContourField extends ContourBase {
    render() {
      this.classList.add("c-field");
      const label = this.getAttribute("label");
      const hint = this.getAttribute("hint");
      const error = this.getAttribute("error");
      const placeholder = this.getAttribute("placeholder") || "";
      if (label && !this.querySelector(".c-field__label")) {
        const lbl = document.createElement("label");
        lbl.className = "c-field__label";
        lbl.textContent = label;
        this.appendChild(lbl);
      }
      if (!this.querySelector("input, textarea, select")) {
        const input = document.createElement("input");
        input.className = "c-input";
        input.type = this.getAttribute("type") || "text";
        input.placeholder = placeholder;
        this.appendChild(input);
      }
      if (hint && !this.querySelector(".c-field__hint")) {
        const h = document.createElement("span");
        h.className = "c-field__hint";
        h.textContent = hint;
        this.appendChild(h);
      }
      if (error && !this.querySelector(".c-field__error")) {
        const e = document.createElement("span");
        e.className = "c-field__error";
        e.textContent = error;
        this.appendChild(e);
      }
    }
  }
  define("contour-field", ContourField);

  // Readout: generates rows from data-rows attribute.
  class ContourReadout extends ContourBase {
    render() {
      this.classList.add("c-readout");
      const rows = this.getAttribute("rows");
      if (rows && !this.querySelector(".c-readout__row")) {
        try {
          const parsed = JSON.parse(rows);
          parsed.forEach((r) => {
            const row = document.createElement("div");
            row.className = "c-readout__row";
            const key = document.createElement("span");
            key.className = "c-readout__key";
            key.textContent = r.key || r[0];
            const val = document.createElement("span");
            val.className = "c-readout__value" + (r.primary ? " c-readout__value--primary" : "") + (r.accent ? " c-readout__value--accent" : "");
            val.textContent = r.value || r[1];
            row.appendChild(key);
            row.appendChild(val);
            this.appendChild(row);
          });
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-readout", ContourReadout);

  // KPI: generates value + label + delta.
  class ContourKpi extends ContourBase {
    render() {
      this.classList.add("c-kpi");
      const value = this.getAttribute("value");
      const label = this.getAttribute("label");
      const delta = this.getAttribute("delta");
      if (value && !this.querySelector(".c-kpi__value")) {
        const v = document.createElement("div");
        v.className = "c-kpi__value";
        v.textContent = value;
        this.appendChild(v);
      }
      if (label && !this.querySelector(".c-kpi__label")) {
        const l = document.createElement("div");
        l.className = "c-kpi__label";
        l.textContent = label;
        this.appendChild(l);
      }
      if (delta && !this.querySelector(".c-kpi__delta")) {
        const d = document.createElement("div");
        d.className = "c-kpi__delta";
        d.textContent = delta;
        this.appendChild(d);
      }
    }
  }
  define("contour-kpi", ContourKpi);

  // Accordion/Disclosure: generates summary + content.
  class ContourDisclosure extends ContourBase {
    render() {
      this.classList.add("c-disclosure");
      const summary = this.getAttribute("summary");
      if (summary && !this.querySelector("summary")) {
        const details = document.createElement("details");
        const summ = document.createElement("summary");
        summ.textContent = summary;
        details.appendChild(summ);
        const content = document.createElement("div");
        content.className = "c-disclosure__body";
        content.innerHTML = this.innerHTML;
        details.appendChild(content);
        this.innerHTML = "";
        this.appendChild(details);
      }
    }
  }
  define("contour-disclosure", ContourDisclosure);

  // Table: generates from data-columns and data-rows.
  class ContourTable extends ContourBase {
    render() {
      // The host is not a <table>, so it carries no table rule. The scroller the
      // reflow contract requires is a real block element inside it: a custom
      // element is display: inline, and overflow does not apply to an inline
      // box, so putting c-table-wrap on the host would satisfy the selector and
      // break the scroll — which is the exact failure that gate was written for.
      const columns = this.getAttribute("columns");
      const rows = this.getAttribute("rows");
      if (columns && rows && !this.querySelector("thead")) {
        try {
          const cols = JSON.parse(columns);
          const data = JSON.parse(rows);
          const table = document.createElement("table");
          table.className = "c-table";
          const thead = document.createElement("thead");
          const tr = document.createElement("tr");
          cols.forEach((c) => {
            const th = document.createElement("th");
            th.textContent = c;
            tr.appendChild(th);
          });
          thead.appendChild(tr);
          table.appendChild(thead);
          const tbody = document.createElement("tbody");
          data.forEach((row) => {
            const tr = document.createElement("tr");
            row.forEach((cell) => {
              const td = document.createElement("td");
              td.textContent = cell;
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });
          table.appendChild(tbody);
          const wrap = document.createElement("div");
          wrap.className = "c-table-wrap";
          wrap.appendChild(table);
          this.innerHTML = "";
          this.appendChild(wrap);
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-table", ContourTable);

  // Chart: generates SVG plot from data-series.
  class ContourChart extends ContourBase {
    render() {
      this.classList.add("c-chart");
      const series = this.getAttribute("series");
      if (series && !this.querySelector(".c-chart__plot")) {
        try {
          const parsed = JSON.parse(series);
          const plot = document.createElement("div");
          plot.className = "c-chart__plot";
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
          this.appendChild(plot);
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-chart", ContourChart);

  // Tabs: already defined above, but enhance with panel switching.
  // (The simple version just generates the tab list.)

  // Breadcrumb: already defined above.

  // Header: already defined above.


  // ---- Additional map-native and chart components ----

  class ContourMinimap extends ContourBase {
    render() {
      this.classList.add("c-minimap");
    }
  }
  define("contour-minimap", ContourMinimap);

  class ContourCoordinate extends ContourBase {
    render() {
      this.classList.add("c-coordinate");
      const value = this.getAttribute("value");
      if (value && !this.querySelector(".c-coordinate__value")) {
        const span = document.createElement("span");
        span.className = "c-coordinate__value";
        span.textContent = value;
        this.appendChild(span);
      }
    }
  }
  define("contour-coordinate", ContourCoordinate);

  class ContourLayerPanel extends ContourBase {
    render() {
      this.classList.add("c-layer-panel");
    }
  }
  define("contour-layer-panel", ContourLayerPanel);

  class ContourTimeSlider extends ContourBase {
    render() {
      this.classList.add("c-time-slider");
    }
  }
  define("contour-time-slider", ContourTimeSlider);

  class ContourComparison extends ContourBase {
    render() {
      this.classList.add("c-comparison");
    }
  }
  define("contour-comparison", ContourComparison);

  class ContourHexbin extends ContourBase {
    render() {
      this.classList.add("c-hexbin");
    }
  }
  define("contour-hexbin", ContourHexbin);


  // ---- Additional advanced chart and map components ----

  class ContourFlowMap extends ContourBase {
    render() { this.classList.add("c-flow-map"); }
  }
  define("contour-flow-map", ContourFlowMap);

  class ContourIsochrone extends ContourBase {
    render() { this.classList.add("c-isochrone"); }
  }
  define("contour-isochrone", ContourIsochrone);

  class ContourCatchment extends ContourBase {
    render() { this.classList.add("c-catchment"); }
  }
  define("contour-catchment", ContourCatchment);

  class ContourStreamingChart extends ContourBase {
    render() { this.classList.add("c-streaming-chart"); }
  }
  define("contour-streaming-chart", ContourStreamingChart);


  // ---- Additional complex components with scaffolding ----

  // Callout: generates icon + title + body.
  class ContourCallout extends ContourBase {
    render() {
      this.classList.add("c-callout");
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-callout--" + variant);
      const title = this.getAttribute("title");
      if (title && !this.querySelector(".c-callout__title")) {
        const t = document.createElement("div");
        t.className = "c-callout__title";
        t.textContent = title;
        this.prepend(t);
      }
    }
  }
  define("contour-callout", ContourCallout);

  // Empty state: generates icon + title + body + action.
  class ContourEmpty extends ContourBase {
    render() {
      this.classList.add("c-empty");
      const title = this.getAttribute("title");
      const body = this.getAttribute("body");
      const action = this.getAttribute("action");
      if (title && !this.querySelector(".c-empty__title")) {
        const t = document.createElement("h3");
        t.className = "c-empty__title";
        t.textContent = title;
        this.appendChild(t);
      }
      if (body && !this.querySelector(".c-empty__body")) {
        const b = document.createElement("p");
        b.className = "c-empty__body";
        b.textContent = body;
        this.appendChild(b);
      }
      if (action && !this.querySelector(".c-empty__action")) {
        const a = document.createElement("button");
        a.className = "c-btn c-btn--primary c-empty__action";
        a.type = "button";
        a.textContent = action;
        this.appendChild(a);
      }
    }
  }
  define("contour-empty", ContourEmpty);

  // FAQ: generates question + answer.
  class ContourFaq extends ContourBase {
    render() {
      this.classList.add("c-faq");
      const question = this.getAttribute("question");
      const answer = this.getAttribute("answer");
      if (question && !this.querySelector(".c-faq__question")) {
        const q = document.createElement("div");
        q.className = "c-faq__question";
        q.textContent = question;
        this.appendChild(q);
      }
      if (answer && !this.querySelector(".c-faq__answer")) {
        const a = document.createElement("div");
        a.className = "c-faq__answer";
        a.textContent = answer;
        this.appendChild(a);
      }
    }
  }
  define("contour-faq", ContourFaq);

  // Feature: generates icon + title + body.
  class ContourFeature extends ContourBase {
    render() {
      this.classList.add("c-feature");
      const title = this.getAttribute("title");
      const body = this.getAttribute("body");
      const icon = this.getAttribute("icon");
      if (icon && !this.querySelector(".c-feature__icon")) {
        const i = document.createElement("div");
        i.className = "c-feature__icon";
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("aria-hidden", "true");
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttribute("href", "#" + String(icon).replace(/[^a-zA-Z0-9_-]/g, ""));
        svg.appendChild(use);
        i.appendChild(svg);
        this.appendChild(i);
      }
      if (title && !this.querySelector(".c-feature__title")) {
        const t = document.createElement("h3");
        t.className = "c-feature__title";
        t.textContent = title;
        this.appendChild(t);
      }
      if (body && !this.querySelector(".c-feature__body")) {
        const b = document.createElement("p");
        b.className = "c-feature__body";
        b.textContent = body;
        this.appendChild(b);
      }
    }
  }
  define("contour-feature", ContourFeature);

  // Code tabs: generates tab list + panels.
  class ContourCodeTabs extends ContourBase {
    render() {
      this.classList.add("c-code-tabs");
      const tabs = this.getAttribute("tabs");
      if (tabs && !this.querySelector(".c-code-tabs__list")) {
        try {
          const parsed = JSON.parse(tabs);
          const list = document.createElement("div");
          list.className = "c-code-tabs__list";
          list.setAttribute("role", "tablist");
          parsed.forEach((t, i) => {
            const btn = document.createElement("button");
            btn.className = "c-code-tabs__tab" + (i === 0 ? " c-code-tabs__tab--active" : "");
            btn.setAttribute("role", "tab");
            btn.setAttribute("aria-selected", String(i === 0));
            btn.tabIndex = i === 0 ? 0 : -1;
            btn.textContent = typeof t === "string" ? t : t.label;
            list.appendChild(btn);
          });
          this.prepend(list);
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredCodeTabs) return;
      this._wiredCodeTabs = true;
      const activate = (tab, focus) => {
        const list = this.querySelector(".c-code-tabs__list");
        if (!list) return;
        const tabs = Array.from(list.querySelectorAll("[role='tab']"));
        tabs.forEach((t) => {
          const selected = t === tab;
          t.setAttribute("aria-selected", String(selected));
          t.tabIndex = selected ? 0 : -1;
          t.classList.toggle("c-code-tabs__tab--active", selected);
          const ctrl = t.getAttribute("aria-controls");
          if (ctrl) {
            const panel = document.getElementById(ctrl) || this.querySelector("#" + CSS.escape(ctrl));
            if (panel) panel.hidden = !selected;
          }
        });
        const panels = Array.from(this.querySelectorAll(".c-code-tabs__panel"));
        if (panels.length) {
          const idx = tabs.indexOf(tab);
          panels.forEach((p, i) => { p.hidden = i !== idx; });
        }
        if (focus) try { tab.focus(); } catch (e) {}
      };
      this.addEventListener("click", (e) => {
        const tab = e.target && e.target.closest ? e.target.closest("[role='tab']") : null;
        if (tab && this.contains(tab)) activate(tab, false);
      });
      this.addEventListener("keydown", (e) => {
        const tab = e.target && e.target.closest ? e.target.closest("[role='tab']") : null;
        if (!tab) return;
        const list = this.querySelector(".c-code-tabs__list");
        if (!list) return;
        const tabs = Array.from(list.querySelectorAll("[role='tab']"));
        const index = tabs.indexOf(tab);
        const map = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
        if (!(e.key in map)) return;
        e.preventDefault();
        const next = tabs[(map[e.key] + tabs.length) % tabs.length];
        if (next) activate(next, true);
      });
      const first = this.querySelector(".c-code-tabs__list [role='tab']");
      if (first) activate(first, false);
    }
  }
  define("contour-code-tabs", ContourCodeTabs);

  // Steps: generates numbered steps.
  class ContourSteps extends ContourBase {
    render() {
      this.classList.add("c-steps");
      const steps = this.getAttribute("steps");
      if (steps && !this.querySelector(".c-steps__item")) {
        try {
          const parsed = JSON.parse(steps);
          parsed.forEach((s, i) => {
            const item = document.createElement("div");
            item.className = "c-steps__item";
            const num = document.createElement("span");
            num.className = "c-steps__num";
            num.textContent = String(i + 1);
            item.appendChild(num);
            const text = document.createElement("span");
            text.className = "c-steps__text";
            text.textContent = typeof s === "string" ? s : s.text;
            item.appendChild(text);
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-steps", ContourSteps);

  // Callout: already defined above.

  // Accordion: generates details/summary.
  class ContourAccordion extends ContourBase {
    render() {
      this.classList.add("c-accordion");
      const items = this.getAttribute("items");
      if (items && !this.querySelector("details")) {
        try {
          const parsed = JSON.parse(items);
          parsed.forEach((item) => {
            const details = document.createElement("details");
            details.className = "c-disclosure";
            const summary = document.createElement("summary");
            summary.textContent = item.title || item.question || "";
            details.appendChild(summary);
            const body = document.createElement("div");
            body.className = "c-disclosure__body";
            body.textContent = item.body || item.answer || "";
            details.appendChild(body);
            this.appendChild(details);
          });
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-accordion", ContourAccordion);


  // ---- Additional simple components with attribute scaffolding ----

  // Avatar: generates initials from name attribute.
  class ContourAvatar extends ContourBase {
    render() {
      this.classList.add("c-avatar");
      const name = this.getAttribute("name");
      const size = this.getAttribute("size");
      if (size) this.classList.add("c-avatar--" + size);
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-avatar--" + variant);
      if (name && !this.textContent.trim()) {
        const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
        this.textContent = initials;
      }
    }
  }
  define("contour-avatar", ContourAvatar);

  // Badge: generates text from label attribute.
  class ContourBadgeFull extends ContourBase {
    render() {
      this.classList.add("c-badge");
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-badge--" + variant);
      const label = this.getAttribute("label");
      if (label && !this.textContent.trim()) {
        this.textContent = label;
      }
    }
  }
  define("contour-badge", ContourBadgeFull);

  // Chip: generates key + value from attributes.
  class ContourChipFull extends ContourBase {
    render() {
      this.classList.add("c-chip");
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-chip--" + variant);
      const key = this.getAttribute("key");
      const value = this.getAttribute("value");
      if (key && !this.querySelector(".c-chip__key")) {
        const k = document.createElement("span");
        k.className = "c-chip__key";
        k.textContent = key;
        this.appendChild(k);
      }
      if (value && !this.querySelector(".c-chip__value")) {
        const v = document.createElement("span");
        v.className = "c-chip__value";
        v.textContent = value;
        this.appendChild(v);
      }
    }
  }
  define("contour-chip", ContourChipFull);

  // Tag: generates text + remove button.
  class ContourTag extends ContourBase {
    render() {
      this.classList.add("c-tag");
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-tag--" + variant);
      const label = this.getAttribute("label");
      if (label && !this.textContent.trim()) {
        this.textContent = label;
      }
      if (this.hasAttribute("removable") && !this.querySelector(".c-tag__remove")) {
        const btn = document.createElement("button");
        btn.className = "c-tag__remove";
        btn.type = "button";
        btn.setAttribute("aria-label", "Remove");
        btn.textContent = "×";
        this.appendChild(btn);
      }
    }
  }
  define("contour-tag", ContourTag);

  // Dot: generates from variant attribute.
  class ContourDot extends ContourBase {
    render() {
      this.classList.add("c-dot");
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-dot--" + variant);
      if (this.hasAttribute("live")) this.classList.add("c-dot--live");
    }
  }
  define("contour-dot", ContourDot);

  // Pill: generates text from label attribute.
  class ContourPill extends ContourBase {
    render() {
      this.classList.add("c-pill");
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-pill--" + variant);
      const label = this.getAttribute("label");
      if (label && !this.textContent.trim()) {
        this.textContent = label;
      }
      if (this.hasAttribute("live")) this.classList.add("c-pill--live");
    }
  }
  define("contour-pill", ContourPill);

  // Kbd: generates key text.
  class ContourKbd extends ContourBase {
    render() {
      this.classList.add("c-kbd");
      const key = this.getAttribute("key");
      if (key && !this.textContent.trim()) {
        this.textContent = key;
      }
    }
  }
  define("contour-kbd", ContourKbd);

  // Spinner: simple class wrapper.
  class ContourSpinner extends ContourBase {
    render() {
      this.classList.add("c-spinner");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Loading");
    }
  }
  define("contour-spinner", ContourSpinner);

  // Skeleton: simple class wrapper.
  class ContourSkeleton extends ContourBase {
    render() {
      this.classList.add("c-skeleton");
    }
  }
  define("contour-skeleton", ContourSkeleton);

  // Breadcrumb & pagination: generates nav from items.
  class ContourBreadcrumb extends ContourBase {
    render() {
      this.classList.add("c-breadcrumb");
      const items = this.getAttribute("items");
      if (items && !this.querySelector("a")) {
        try {
          const parsed = JSON.parse(items);
          const nav = document.createElement("nav");
          nav.setAttribute("aria-label", "Breadcrumb");
          const ol = document.createElement("ol");
          parsed.forEach((item, i) => {
            const li = document.createElement("li");
            if (i < parsed.length - 1) {
              const a = document.createElement("a");
              a.href = item.href || "#";
              a.textContent = item.label || item;
              li.appendChild(a);
            } else {
              li.textContent = item.label || item;
              li.setAttribute("aria-current", "page");
            }
            ol.appendChild(li);
          });
          nav.appendChild(ol);
          this.innerHTML = "";
          this.appendChild(nav);
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-breadcrumb", ContourBreadcrumb);

  // Pagination: generates page links.
  class ContourPagination extends ContourBase {
    render() {
      this.classList.add("c-pagination");
      const pages = this.getAttribute("pages");
      const current = parseInt(this.getAttribute("current") || "1", 10);
      if (pages && !this.querySelector("a, button")) {
        const count = parseInt(pages, 10);
        for (let i = 1; i <= count; i++) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "c-pagination__link";
          btn.textContent = String(i);
          if (i === current) {
            btn.setAttribute("aria-current", "page");
            btn.classList.add("c-pagination__current");
          }
          this.appendChild(btn);
        }
      }
    }
  }
  define("contour-pagination", ContourPagination);

  // Drawer: ensures proper role.
  class ContourDrawer extends ContourBase {
    render() {
      this.classList.add("c-drawer");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
    }
  }
  define("contour-drawer", ContourDrawer);

  // Sheet: ensures proper role.
  class ContourSheet extends ContourBase {
    render() {
      this.classList.add("c-sheet");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
    }
  }
  define("contour-sheet", ContourSheet);

  // Tooltip: generates text from label attribute.
  class ContourTooltip extends ContourBase {
    render() {
      this.classList.add("c-tooltip");
      const text = this.getAttribute("text");
      if (text && !this.textContent.trim()) {
        this.textContent = text;
      }
    }
  }
  define("contour-tooltip", ContourTooltip);

  // Toast: generates message.
  class ContourToast extends ContourBase {
    render() {
      this.classList.add("c-toast");
      const message = this.getAttribute("message");
      if (message && !this.textContent.trim()) {
        this.textContent = message;
      }
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-toast--" + variant);
    }
  }
  define("contour-toast", ContourToast);

  // Progress: generates from value attribute.
  class ContourProgress extends ContourBase {
    render() {
      this.classList.add("c-progress");
      const value = this.getAttribute("value");
      if (value) {
        this.style.setProperty("--progress", value + "%");
      }
      if (!this.hasAttribute("role")) this.setAttribute("role", "progressbar");
      const prevVal = this._progressAriaValue;
      if (!this.hasAttribute("aria-valuenow") || this.getAttribute("aria-valuenow") === prevVal) {
        this.setAttribute("aria-valuenow", value || "0");
        this._progressAriaValue = value || "0";
      }
      if (!this.hasAttribute("aria-valuemin")) this.setAttribute("aria-valuemin", "0");
      if (!this.hasAttribute("aria-valuemax")) this.setAttribute("aria-valuemax", "100");
    }
  }
  define("contour-progress", ContourProgress);

  // Range: generates from attributes.
  class ContourRange extends ContourBase {
    render() {
      this.classList.add("c-range");
      if (!this.querySelector("input")) {
        const input = document.createElement("input");
        input.type = "range";
        input.min = this.getAttribute("min") || "0";
        input.max = this.getAttribute("max") || "100";
        input.value = this.getAttribute("value") || "50";
        this.appendChild(input);
      }
    }
  }
  define("contour-range", ContourRange);

  // Switch: generates from label attribute.
  class ContourSwitch extends ContourBase {
    render() {
      this.classList.add("c-switch");
      const label = this.getAttribute("label");
      if (label && !this.querySelector(".c-switch__label")) {
        const lbl = document.createElement("span");
        lbl.className = "c-switch__label";
        lbl.textContent = label;
        this.appendChild(lbl);
      }
    }
  }
  define("contour-switch", ContourSwitch);

  // Check: generates from label attribute.
  class ContourCheck extends ContourBase {
    render() {
      this.classList.add("c-check");
      const label = this.getAttribute("label");
      if (label && !this.querySelector(".c-check__label")) {
        const lbl = document.createElement("label");
        lbl.className = "c-check__label";
        lbl.textContent = label;
        this.appendChild(lbl);
      }
    }
  }
  define("contour-check", ContourCheck);

  // Radio: generates from label attribute.
  class ContourRadio extends ContourBase {
    render() {
      this.classList.add("c-radio");
      const label = this.getAttribute("label");
      if (label && !this.querySelector(".c-radio__label")) {
        const lbl = document.createElement("label");
        lbl.className = "c-radio__label";
        lbl.textContent = label;
        this.appendChild(lbl);
      }
    }
  }
  define("contour-radio", ContourRadio);

  // Select: generates from options attribute.
  class ContourSelect extends ContourBase {
    render() {
      this.classList.add("c-select");
      const options = this.getAttribute("options");
      if (options && !this.querySelector("option")) {
        try {
          const parsed = JSON.parse(options);
          const select = document.createElement("select");
          select.className = "c-select";
          parsed.forEach((opt) => {
            const option = document.createElement("option");
            option.value = typeof opt === "string" ? opt : opt.value;
            option.textContent = typeof opt === "string" ? opt : opt.label;
            select.appendChild(option);
          });
          this.innerHTML = "";
          this.appendChild(select);
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-select", ContourSelect);

  // Version: a native select styled as a version picker.
  class ContourVersion extends ContourBase {
    render() {
      this.classList.add("c-version");
      const options = this.getAttribute("options");
      if (options && !this.querySelector("option")) {
        try {
          const parsed = JSON.parse(options);
          const select = document.createElement("select");
          select.className = "c-version";
          parsed.forEach((opt) => {
            const option = document.createElement("option");
            if (typeof opt === "string") { option.value = opt; option.textContent = opt; }
            else { option.value = opt.value || opt.label; option.textContent = opt.label || opt.value; if (opt.selected) option.selected = true; }
            select.appendChild(option);
          });
          this.innerHTML = "";
          this.appendChild(select);
          this.classList.remove("c-version");
          select.classList.add("c-version");
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-version", ContourVersion);

  // Textarea: generates from placeholder attribute.
  class ContourTextarea extends ContourBase {
    render() {
      this.classList.add("c-textarea");
      if (!this.querySelector("textarea")) {
        const ta = document.createElement("textarea");
        ta.className = "c-textarea";
        ta.placeholder = this.getAttribute("placeholder") || "";
        this.appendChild(ta);
      }
    }
  }
  define("contour-textarea", ContourTextarea);

  // Input: generates from placeholder attribute.
  class ContourInputFull extends ContourBase {
    render() {
      this.classList.add("c-input");
      if (!this.querySelector("input")) {
        const input = document.createElement("input");
        input.className = "c-input";
        input.type = this.getAttribute("type") || "text";
        input.placeholder = this.getAttribute("placeholder") || "";
        this.appendChild(input);
      }
    }
  }
  define("contour-input", ContourInputFull);

  // Link: generates from href and label.
  class ContourLink extends ContourBase {
    render() {
      this.classList.add("c-link");
      const href = this.getAttribute("href");
      const label = this.getAttribute("label");
      if (href && label && !this.querySelector("a")) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = label;
        this.appendChild(a);
      }
    }
  }
  define("contour-link", ContourLink);

  // Mark: generates from variant.
  class ContourMark extends ContourBase {
    render() {
      this.classList.add("c-mark");
    }
  }
  define("contour-mark", ContourMark);

  // Brand: generates from name and tag.
  class ContourBrand extends ContourBase {
    render() {
      this.classList.add("c-brand");
      const name = this.getAttribute("name");
      const tag = this.getAttribute("tag");
      if (name && !this.querySelector(".c-brand__name")) {
        const n = document.createElement("span");
        n.className = "c-brand__name";
        n.textContent = name;
        this.appendChild(n);
      }
      if (tag && !this.querySelector(".c-brand__tag")) {
        const t = document.createElement("span");
        t.className = "c-brand__tag";
        t.textContent = tag;
        this.appendChild(t);
      }
    }
  }
  define("contour-brand", ContourBrand);

  // Section head: generates from title and desc.
  class ContourSectionHead extends ContourBase {
    render() {
      this.classList.add("c-section-head");
      const title = this.getAttribute("title");
      const desc = this.getAttribute("desc");
      if (title && !this.querySelector(".c-section-head__title")) {
        const t = document.createElement("h2");
        t.className = "c-section-head__title";
        t.textContent = title;
        this.appendChild(t);
      }
      if (desc && !this.querySelector(".c-section-head__desc")) {
        const d = document.createElement("p");
        d.className = "c-section-head__desc";
        d.textContent = desc;
        this.appendChild(d);
      }
    }
  }
  define("contour-section-head", ContourSectionHead);

  // Empty state: already defined above.

  // Loading: generates spinner.
  class ContourLoading extends ContourBase {
    render() {
      this.classList.add("c-loading");
      if (!this.querySelector(".c-spinner")) {
        const s = document.createElement("span");
        s.className = "c-spinner";
        this.appendChild(s);
      }
    }
  }
  define("contour-loading", ContourLoading);

  // Elevation: simple class wrapper.
  class ContourElevation extends ContourBase {
    render() {
      this.classList.add("c-elevation");
    }
  }
  define("contour-elevation", ContourElevation);

  // Diff: generates from before/after attributes.
  class ContourDiff extends ContourBase {
    render() {
      this.classList.add("c-diff");
      const before = this.getAttribute("before");
      const after = this.getAttribute("after");
      if (before && !this.querySelector(".c-diff__before")) {
        const b = document.createElement("div");
        b.className = "c-diff__before";
        b.textContent = before;
        this.appendChild(b);
      }
      if (after && !this.querySelector(".c-diff__after")) {
        const a = document.createElement("div");
        a.className = "c-diff__after";
        a.textContent = after;
        this.appendChild(a);
      }
    }
  }
  define("contour-diff", ContourDiff);

  // Do/Don't: generates from do/dont attributes.
  class ContourDoDont extends ContourBase {
    render() {
      this.classList.add("c-do-dont");
      const doText = this.getAttribute("do");
      const dontText = this.getAttribute("dont");
      if (doText && !this.querySelector(".c-do-dont__do")) {
        const d = document.createElement("div");
        d.className = "c-do-dont__do";
        d.textContent = doText;
        this.appendChild(d);
      }
      if (dontText && !this.querySelector(".c-do-dont__dont")) {
        const d = document.createElement("div");
        d.className = "c-do-dont__dont";
        d.textContent = dontText;
        this.appendChild(d);
      }
    }
  }
  define("contour-do-dont", ContourDoDont);

  // Steps: already defined above.

  // FAQ: already defined above.

  // Callout: already defined above.


  // ---- Additional complex components with scaffolding ----

  // Meter: generates core + value + label from attributes.
  class ContourMeter extends ContourBase {
    render() {
      this.classList.add("c-meter");
      const value = this.getAttribute("value") || "0";
      const label = this.getAttribute("label") || "";
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-meter--" + variant);
      this.style.setProperty("--meter-value", value);
      if (!this.querySelector(".c-meter__core")) {
        const core = document.createElement("span");
        core.className = "c-meter__core";
        const val = document.createElement("span");
        val.className = "c-meter__value";
        val.textContent = Math.round(parseFloat(value) * 100) + "%";
        core.appendChild(val);
        if (label) {
          const lbl = document.createElement("span");
          lbl.className = "c-meter__label";
          lbl.textContent = label;
          core.appendChild(lbl);
        }
        this.appendChild(core);
      }
      if (!this.hasAttribute("role")) this.setAttribute("role", "meter");
      const prevVal = this._meterAriaValue;
      if (!this.hasAttribute("aria-valuenow") || this.getAttribute("aria-valuenow") === prevVal) {
        this.setAttribute("aria-valuenow", value);
        this._meterAriaValue = value;
      }
      if (!this.hasAttribute("aria-valuemin")) this.setAttribute("aria-valuemin", "0");
      if (!this.hasAttribute("aria-valuemax")) this.setAttribute("aria-valuemax", "1");
    }
  }
  define("contour-meter", ContourMeter);

  // Delta: generates arrow + value from attributes.
  class ContourDelta extends ContourBase {
    render() {
      this.classList.add("c-delta");
      const value = this.getAttribute("value") || "";
      const direction = this.getAttribute("direction") || "up";
      this.classList.add("c-delta--" + direction);
      if (value && !this.textContent.trim()) {
        const arrow = document.createElement("span");
        arrow.className = "c-delta__arrow";
        arrow.textContent = direction === "up" ? "↑" : direction === "down" ? "↓" : "→";
        this.appendChild(arrow);
        const val = document.createElement("span");
        val.className = "c-delta__value";
        val.textContent = value;
        this.appendChild(val);
      }
    }
  }
  define("contour-delta", ContourDelta);

  // Readout: already defined above.

  // Stat: generates value + label + delta.
  class ContourStat extends ContourBase {
    render() {
      this.classList.add("c-stat");
      const value = this.getAttribute("value");
      const label = this.getAttribute("label");
      const delta = this.getAttribute("delta");
      if (value && !this.querySelector(".c-stat__value")) {
        const v = document.createElement("div");
        v.className = "c-stat__value";
        v.textContent = value;
        this.appendChild(v);
      }
      if (label && !this.querySelector(".c-stat__label")) {
        const l = document.createElement("div");
        l.className = "c-stat__label";
        l.textContent = label;
        this.appendChild(l);
      }
      if (delta && !this.querySelector(".c-stat__delta")) {
        const d = document.createElement("div");
        d.className = "c-stat__delta";
        d.textContent = delta;
        this.appendChild(d);
      }
    }
  }
  define("contour-stat", ContourStat);

  // KPI: already defined above.

  // Instrument readout: generates rows.
  class ContourInstrument extends ContourBase {
    render() {
      this.classList.add("c-instrument");
      const rows = this.getAttribute("rows");
      if (rows && !this.querySelector(".c-instrument__row")) {
        try {
          const parsed = JSON.parse(rows);
          parsed.forEach((r) => {
            const row = document.createElement("div");
            row.className = "c-instrument__row";
            const key = document.createElement("span");
            key.className = "c-instrument__key";
            key.textContent = r.key || r[0];
            const val = document.createElement("span");
            val.className = "c-instrument__value";
            val.textContent = r.value || r[1];
            row.appendChild(key);
            row.appendChild(val);
            this.appendChild(row);
          });
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-instrument", ContourInstrument);

  // Bivariate legend: generates matrix.
  class ContourBivariate extends ContourBase {
    render() {
      this.classList.add("c-bivariate");
      const size = parseInt(this.getAttribute("size") || "3", 10);
      if (!this.querySelector(".c-bivariate__matrix")) {
        const matrix = document.createElement("div");
        matrix.className = "c-bivariate__matrix";
        matrix.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        for (let i = 0; i < size * size; i++) {
          const cell = document.createElement("div");
          cell.className = "c-bivariate__cell";
          matrix.appendChild(cell);
        }
        this.appendChild(matrix);
      }
    }
  }
  define("contour-bivariate", ContourBivariate);

  // Expandable: generates summary + content.
  class ContourExpandable extends ContourBase {
    render() {
      this.classList.add("c-expandable");
      const summary = this.getAttribute("summary");
      if (summary && !this.querySelector("summary")) {
        const details = document.createElement("details");
        const summ = document.createElement("summary");
        summ.textContent = summary;
        details.appendChild(summ);
        const content = document.createElement("div");
        content.className = "c-expandable__body";
        content.innerHTML = this.innerHTML;
        details.appendChild(content);
        this.innerHTML = "";
        this.appendChild(details);
      }
    }
  }
  define("contour-expandable", ContourExpandable);

  // Flag: generates from variant.
  class ContourFlag extends ContourBase {
    render() {
      this.classList.add("c-flag");
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-flag--" + variant);
      const label = this.getAttribute("label");
      if (label && !this.textContent.trim()) {
        this.textContent = label;
      }
    }
  }
  define("contour-flag", ContourFlag);

  // Link: already defined above.

  // Deltas: already defined above.

  // Callout: already defined above.

  // Empty state: already defined above.

  // FAQ: already defined above.

  // Feature: already defined above.

  // Code tabs: already defined above.

  // Steps: already defined above.

  // Accordion: already defined above.

  // Avatar: already defined above.

  // Badge: already defined above.

  // Chip: already defined above.

  // Tag: already defined above.

  // Dot: already defined above.

  // Pill: already defined above.

  // Kbd: already defined above.

  // Spinner: already defined above.

  // Skeleton: already defined above.

  // Breadcrumb: already defined above.

  // Pagination: already defined above.

  // Drawer: already defined above.

  // Sheet: already defined above.

  // Tooltip: already defined above.

  // Toast: already defined above.

  // Progress: already defined above.

  // Range: already defined above.

  // Switch: already defined above.

  // Check: already defined above.

  // Radio: already defined above.

  // Select: already defined above.

  // Textarea: already defined above.

  // Input: already defined above.

  // Link: already defined above.

  // Mark: already defined above.

  // Brand: already defined above.

  // Section head: already defined above.

  // Loading: already defined above.

  // Elevation: already defined above.

  // Diff: already defined above.

  // Do/Don't: already defined above.


  // ---- Additional complex components with scaffolding ----

  // Survey: generates from date and instrument attributes.
  class ContourSurvey extends ContourBase {
    render() {
      this.classList.add("c-survey");
      const date = this.getAttribute("date");
      const instrument = this.getAttribute("instrument");
      if (date && !this.querySelector(".c-survey__value")) {
        this.textContent = "Surveyed ";
        const v = document.createElement("span");
        v.className = "c-survey__value";
        v.textContent = date;
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
  }
  define("contour-survey", ContourSurvey);

  // Threshold: generates from value and label.
  class ContourThreshold extends ContourBase {
    render() {
      this.classList.add("c-threshold");
      const value = this.getAttribute("value");
      const label = this.getAttribute("label");
      if (value && !this.querySelector(".c-threshold__value")) {
        const v = document.createElement("span");
        v.className = "c-threshold__value";
        v.textContent = value;
        this.appendChild(v);
      }
      if (label && !this.querySelector(".c-threshold__label")) {
        const l = document.createElement("span");
        l.className = "c-threshold__label";
        l.textContent = label;
        this.appendChild(l);
      }
    }
  }
  define("contour-threshold", ContourThreshold);

  // Expandable: already defined above.

  // Deltas: already defined above.

  // Stat: already defined above.

  // Instrument: already defined above.

  // Bivariate: already defined above.


  // ---- Expanded scaffolding for remaining components ----

  // Install: generates prompt + command + copy button.
  class ContourInstallFull extends ContourBase {
    render() {
      this.classList.add("c-install");
      const prompt = this.getAttribute("prompt") || "$";
      const command = this.getAttribute("command") || "";
      if (command && !this.querySelector(".c-install__command")) {
        const p = document.createElement("span");
        p.className = "c-install__prompt";
        p.textContent = prompt;
        this.appendChild(p);
        const c = document.createElement("span");
        c.className = "c-install__command";
        c.textContent = command;
        this.appendChild(c);
        if (this.hasAttribute("copyable")) {
          const btn = document.createElement("button");
          btn.className = "c-btn c-btn--ghost c-btn--sm c-install__copy";
          btn.type = "button";
          btn.setAttribute("aria-label", "Copy command");
          btn.textContent = "Copy";
          this.appendChild(btn);
        }
      }
    }
  }
  define("contour-install", ContourInstallFull);

  // Pager: generates prev/next links.
  class ContourPagerFull extends ContourBase {
    render() {
      this.classList.add("c-pager");
      const prev = this.getAttribute("prev");
      const next = this.getAttribute("next");
      if (prev && !this.querySelector(".c-pager__link--prev")) {
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
      if (next && !this.querySelector(".c-pager__link--next")) {
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

  // TOC: generates title + list from items.
  class ContourTocFull extends ContourBase {
    render() {
      this.classList.add("c-toc");
      const title = this.getAttribute("title") || "On this page";
      const items = this.getAttribute("items");
      if (!this.querySelector(".c-toc__title")) {
        const t = document.createElement("div");
        t.className = "c-toc__title";
        t.textContent = title;
        this.appendChild(t);
      }
      if (items && !this.querySelector(".c-toc__list")) {
        try {
          const parsed = JSON.parse(items);
          const list = document.createElement("nav");
          list.className = "c-toc__list";
          list.setAttribute("aria-label", title);
          parsed.forEach((item) => {
            const a = document.createElement("a");
            a.className = "c-toc__link" + (item.sub ? " c-toc__link--sub" : "");
            a.href = item.href || "#";
            a.textContent = item.label || item;
            if (item.current) a.setAttribute("aria-current", "true");
            list.appendChild(a);
          });
          this.appendChild(list);
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-toc", ContourTocFull);

  // Version banner: generates icon + message.
  class ContourVersionBannerFull extends ContourBase {
    render() {
      this.classList.add("c-version-banner");
      const message = this.getAttribute("message");
      if (message && !this.textContent.trim()) {
        const icon = document.createElement("svg");
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = '<use href="#i-info" />';
        this.appendChild(icon);
        const span = document.createElement("span");
        span.textContent = message;
        this.appendChild(span);
      }
    }
  }
  define("contour-version-banner", ContourVersionBannerFull);

  // Testimonial: generates quote + byline.
  class ContourTestimonialFull extends ContourBase {
    render() {
      this.classList.add("c-testimonial");
      const quote = this.getAttribute("quote");
      const name = this.getAttribute("name");
      const role = this.getAttribute("role");
      if (quote && !this.querySelector(".c-testimonial__quote")) {
        const q = document.createElement("blockquote");
        q.className = "c-testimonial__quote";
        q.textContent = quote;
        this.appendChild(q);
      }
      if (name && !this.querySelector(".c-testimonial__byline")) {
        const by = document.createElement("div");
        by.className = "c-testimonial__byline";
        const n = document.createElement("span");
        n.className = "c-testimonial__name";
        n.textContent = name;
        by.appendChild(n);
        if (role) {
          const r = document.createElement("span");
          r.className = "c-testimonial__role";
          r.textContent = role;
          by.appendChild(r);
        }
        this.appendChild(by);
      }
    }
  }
  define("contour-testimonial", ContourTestimonialFull);

  // Showcase: generates media + title + text + list.
  // Note: the `media` attribute is intentionally treated as raw HTML so a
  // consumer can embed arbitrary media markup (images, video, iframes). It is
  // NOT sanitized — only pass trusted content; sanitize untrusted input first.
  class ContourShowcaseFull extends ContourBase {
    render() {
      this.classList.add("c-showcase");
      if (this.hasAttribute("reverse")) this.classList.add("c-showcase--reverse");
      const title = this.getAttribute("title");
      const text = this.getAttribute("text");
      const media = this.getAttribute("media");
      if (media && !this.querySelector(".c-showcase__media")) {
        const m = document.createElement("div");
        m.className = "c-showcase__media";
        m.innerHTML = media;
        this.appendChild(m);
      }
      if (title && !this.querySelector(".c-showcase__title")) {
        const t = document.createElement("h3");
        t.className = "c-showcase__title";
        t.textContent = title;
        this.appendChild(t);
      }
      if (text && !this.querySelector(".c-showcase__text")) {
        const p = document.createElement("p");
        p.className = "c-showcase__text";
        p.textContent = text;
        this.appendChild(p);
      }
      const items = this.getAttribute("items");
      if (items && !this.querySelector(".c-showcase__list")) {
        try {
          const parsed = JSON.parse(items);
          const ul = document.createElement("ul");
          ul.className = "c-showcase__list";
          parsed.forEach((it) => {
            const li = document.createElement("li");
            li.textContent = typeof it === "string" ? it : it.label;
            ul.appendChild(li);
          });
          this.appendChild(ul);
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-showcase", ContourShowcaseFull);

  // Pricing: generates price + features.
  class ContourPricingFull extends ContourBase {
    render() {
      this.classList.add("c-pricing");
      const price = this.getAttribute("price");
      const label = this.getAttribute("label");
      if (price && !this.querySelector(".c-price")) {
        const p = document.createElement("div");
        p.className = "c-price";
        p.textContent = price;
        this.appendChild(p);
      }
      if (label && !this.querySelector(".c-pricing__label")) {
        const l = document.createElement("div");
        l.className = "c-pricing__label";
        l.textContent = label;
        this.appendChild(l);
      }
      const features = this.getAttribute("features");
      if (features && !this.querySelector("ul")) {
        try {
          const parsed = JSON.parse(features);
          const ul = document.createElement("ul");
          parsed.forEach((f) => {
            const li = document.createElement("li");
            li.textContent = typeof f === "string" ? f : f.label;
            ul.appendChild(li);
          });
          this.appendChild(ul);
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-pricing", ContourPricingFull);

  // Recipe: generates title + body.
  class ContourRecipeFull extends ContourBase {
    render() {
      this.classList.add("c-recipe");
      const title = this.getAttribute("title");
      const body = this.getAttribute("body");
      if (title && !this.querySelector(".c-recipe__title")) {
        const t = document.createElement("h3");
        t.className = "c-recipe__title";
        t.textContent = title;
        this.appendChild(t);
      }
      if (body && !this.querySelector(".c-recipe__body")) {
        const b = document.createElement("p");
        b.className = "c-recipe__body";
        b.textContent = body;
        this.appendChild(b);
      }
    }
  }
  define("contour-recipe", ContourRecipeFull);

  // Pressable: ensures role + tabindex.
  class ContourPressableFull extends ContourBase {
    render() {
      this.classList.add("c-pressable");
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
    }
  }
  define("contour-pressable", ContourPressableFull);

  // Resize handle: ensures role.
  class ContourResizeHandleFull extends ContourBase {
    render() {
      this.classList.add("c-resize-handle");
      if (!this.hasAttribute("role")) this.setAttribute("role", "separator");
    }
  }
  define("contour-resize-handle", ContourResizeHandleFull);

  // Search trigger: generates kbd hint.
  class ContourSearchTriggerFull extends ContourBase {
    render() {
      this.classList.add("c-search-trigger");
      const label = this.getAttribute("label") || "Search";
      if (!this.textContent.trim()) {
        const span = document.createElement("span");
        span.textContent = label;
        this.appendChild(span);
        const kbd = document.createElement("kbd");
        kbd.className = "c-kbd";
        kbd.textContent = this.getAttribute("shortcut") || "⌘K";
        this.appendChild(kbd);
      }
    }
  }
  define("contour-search-trigger", ContourSearchTriggerFull);

  // Shortcut list/row/panel/overlay: simple class wrappers with scaffolding.
  class ContourShortcutListFull extends ContourBase {
    render() { this.classList.add("c-shortcut-list"); }
  }
  define("contour-shortcut-list", ContourShortcutListFull);

  class ContourShortcutRowFull extends ContourBase {
    render() {
      this.classList.add("c-shortcut-row");
      const key = this.getAttribute("key");
      const desc = this.getAttribute("desc");
      if (key && !this.querySelector(".c-kbd")) {
        const k = document.createElement("kbd");
        k.className = "c-kbd";
        k.textContent = key;
        this.appendChild(k);
      }
      if (desc && !this.querySelector("span")) {
        const s = document.createElement("span");
        s.textContent = desc;
        this.appendChild(s);
      }
    }
  }
  define("contour-shortcut-row", ContourShortcutRowFull);

  class ContourShortcutPanelFull extends ContourBase {
    render() { this.classList.add("c-shortcut-panel"); }
  }
  define("contour-shortcut-panel", ContourShortcutPanelFull);

  class ContourShortcutOverlayFull extends ContourBase {
    render() { this.classList.add("c-shortcut-overlay"); }
  }
  define("contour-shortcut-overlay", ContourShortcutOverlayFull);

  // Row action: simple wrapper.
  class ContourRowActionFull extends ContourBase {
    render() { this.classList.add("c-row-action"); }
  }
  define("contour-row-action", ContourRowActionFull);

  // Metrics: simple wrapper.
  class ContourMetricsFull extends ContourBase {
    render() { this.classList.add("c-metrics"); }
  }
  define("contour-metrics", ContourMetricsFull);

  // Logos: simple wrapper.
  class ContourLogosFull extends ContourBase {
    render() { this.classList.add("c-logos"); }
  }
  define("contour-logos", ContourLogosFull);

  // Landing features/hero: simple wrappers.
  class ContourLandingFeaturesFull extends ContourBase {
    render() { this.classList.add("c-landing-features"); }
  }
  define("contour-landing-features", ContourLandingFeaturesFull);

  class ContourLandingHeroFull extends ContourBase {
    render() { this.classList.add("c-landing-hero"); }
  }
  define("contour-landing-hero", ContourLandingHeroFull);

  // Linkish: simple wrapper.
  class ContourLinkishFull extends ContourBase {
    render() { this.classList.add("c-linkish"); }
  }
  define("contour-linkish", ContourLinkishFull);

  // Compass: simple wrapper.
  class ContourCompassFull extends ContourBase {
    render() { this.classList.add("c-compass"); }
  }
  define("contour-compass", ContourCompassFull);

  // Reserved: simple wrapper.
  class ContourReservedFull extends ContourBase {
    render() { this.classList.add("c-reserved"); }
  }
  define("contour-reserved", ContourReservedFull);

  // Price: simple wrapper with value.
  class ContourPriceFull extends ContourBase {
    render() {
      this.classList.add("c-price");
      const value = this.getAttribute("value");
      if (value && !this.textContent.trim()) this.textContent = value;
    }
  }
  define("contour-price", ContourPriceFull);

  // Prose: simple wrapper.
  class ContourProseFull extends ContourBase {
    render() { this.classList.add("c-prose"); }
  }
  define("contour-prose", ContourProseFull);

  // Theme scope: simple wrapper.
  class ContourThemeScopeFull extends ContourBase {
    render() { this.classList.add("c-theme-scope"); }
  }
  define("contour-theme-scope", ContourThemeScopeFull);

  // Segmented: class wrapper with aria-pressed wiring.
  class ContourSegmented extends ContourBase {
    render() { this.classList.add("c-segmented"); }
    enhance() {
      if (this._wiredSegmented) return;
      this._wiredSegmented = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest("button") : null;
        if (!btn || !this.contains(btn)) return;
        const options = Array.from(this.querySelectorAll("button"));
        options.forEach((o) => o.setAttribute("aria-pressed", String(o === btn)));
        this.dispatchEvent(new CustomEvent("contour:change", { detail: { value: btn.dataset.value || btn.textContent }, bubbles: true }));
      });
    }
  }
  define("contour-segmented", ContourSegmented);


  // Install: already defined above.

  // Pager: already defined above.

  // TOC: already defined above.

  // Version banner: already defined above.

  // Testimonial: already defined above.

  // Showcase: already defined above.

  // Pricing: already defined above.

  // Recipe: already defined above.

  // Pressable: already defined above.

  // Resize handle: already defined above.

  // Search trigger: already defined above.

  // Shortcut list: already defined above.

  // Shortcut row: already defined above.

  // Shortcut panel: already defined above.

  // Shortcut overlay: already defined above.

  // Row action: already defined above.

  // Metrics: already defined above.

  // Logos: already defined above.

  // Landing features: already defined above.

  // Landing hero: already defined above.

  // Linkish: already defined above.

  // Compass: already defined above.

  // Reserved: already defined above.

  // Price: already defined above.

  // Prose: already defined above.

  // Theme scope: already defined above.

  // Field: already defined above.

  // Panel: generates head + body + foot from attributes.
  class ContourPanel extends ContourBase {
    render() {
      this.classList.add("c-panel");
      const title = this.getAttribute("title");
      const subtitle = this.getAttribute("subtitle");
      const status = this.getAttribute("status");
      if (title && !this.querySelector(".c-panel__title")) {
        const h = document.createElement("h3");
        h.className = "c-panel__title";
        h.textContent = title;
        this.prepend(h);
      }
      if (subtitle && !this.querySelector(".c-panel__subtitle")) {
        const sub = document.createElement("p");
        sub.className = "c-panel__subtitle";
        sub.textContent = subtitle;
        this.appendChild(sub);
      }
      if (status && !this.querySelector(".c-panel__status")) {
        const st = document.createElement("span");
        st.className = "c-panel__status";
        st.textContent = status;
        this.appendChild(st);
      }
    }
  }
  define("contour-panel", ContourPanel);

  // Legend: generates title + items from attributes.
  class ContourLegend extends ContourBase {
    render() {
      this.classList.add("c-legend");
      const title = this.getAttribute("title");
      const method = this.getAttribute("method");
      const norm = this.getAttribute("norm");
      if (title && !this.querySelector(".c-legend__title")) {
        const t = document.createElement("div");
        t.className = "c-legend__title";
        t.textContent = title;
        this.appendChild(t);
      }
      const items = this.getAttribute("items");
      if (items && !this.querySelector(".c-legend__items")) {
        try {
          const parsed = JSON.parse(items);
          const list = document.createElement("div");
          list.className = "c-legend__items";
          parsed.forEach((it) => {
            const item = document.createElement("div");
            item.className = "c-legend__item";
            const sw = document.createElement("span");
            sw.className = "c-legend__swatch";
            if (it.color) sw.style.background = it.color;
            item.appendChild(sw);
            const lbl = document.createElement("span");
            lbl.textContent = typeof it === "string" ? it : (it.label || it);
            item.appendChild(lbl);
            list.appendChild(item);
          });
          this.appendChild(list);
        } catch (e) { /* keep existing */ }
      }
      if (method && !this.querySelector(".c-legend__method")) {
        const m = document.createElement("div");
        m.className = "c-legend__method";
        m.textContent = method;
        this.appendChild(m);
      }
      if (norm && !this.querySelector(".c-legend__norm")) {
        const n = document.createElement("span");
        n.className = "c-legend__norm";
        n.textContent = norm;
        this.appendChild(n);
      }
    }
  }
  define("contour-legend", ContourLegend);

  // Measure: generates label + value from attributes.
  class ContourMeasure extends ContourBase {
    render() {
      this.classList.add("c-measure");
      const label = this.getAttribute("label");
      const value = this.getAttribute("value");
      if (label && !this.querySelector(".c-measure__label")) {
        const l = document.createElement("span");
        l.className = "c-measure__label";
        l.textContent = label;
        this.appendChild(l);
      }
      if (value && !this.querySelector(".c-measure__readout")) {
        const r = document.createElement("span");
        r.className = "c-measure__readout";
        r.textContent = value;
        this.appendChild(r);
      }
    }
  }
  define("contour-measure", ContourMeasure);

  // Filter pill: generates key + value + remove from attributes.
  class ContourFilterPill extends ContourBase {
    render() {
      this.classList.add("c-filter-pill");
      const key = this.getAttribute("key");
      const value = this.getAttribute("value");
      if (key && !this.querySelector(".c-filter-pill__key")) {
        const k = document.createElement("span");
        k.className = "c-filter-pill__key";
        k.textContent = key;
        this.appendChild(k);
      }
      if (value && !this.querySelector(".c-filter-pill__value")) {
        const v = document.createElement("span");
        v.className = "c-filter-pill__value";
        v.textContent = value;
        this.appendChild(v);
      }
      if (this.hasAttribute("removable") && !this.querySelector(".c-filter-pill__remove")) {
        const btn = document.createElement("button");
        btn.className = "c-filter-pill__remove";
        btn.type = "button";
        btn.setAttribute("aria-label", "Remove filter");
        btn.textContent = "×";
        this.appendChild(btn);
      }
    }
  }
  define("contour-filter-pill", ContourFilterPill);

  // Timeline: generates items from attribute.
  class ContourTimeline extends ContourBase {
    render() {
      this.classList.add("c-timeline");
      const items = this.getAttribute("items");
      if (items && !this.querySelector(".c-timeline__item")) {
        try {
          const parsed = JSON.parse(items);
          parsed.forEach((it) => {
            const item = document.createElement("div");
            item.className = "c-timeline__item";
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
      }
    }
  }
  define("contour-timeline", ContourTimeline);

  // CTA: generates title + text + actions from attributes.
  class ContourCta extends ContourBase {
    render() {
      this.classList.add("c-cta");
      const title = this.getAttribute("title");
      const text = this.getAttribute("text");
      if (title && !this.querySelector(".c-cta__title")) {
        const t = document.createElement("h3");
        t.className = "c-cta__title";
        t.textContent = title;
        this.appendChild(t);
      }
      if (text && !this.querySelector(".c-cta__text")) {
        const p = document.createElement("p");
        p.className = "c-cta__text";
        p.textContent = text;
        this.appendChild(p);
      }
      const actions = this.getAttribute("actions");
      if (actions && !this.querySelector(".c-cta__actions")) {
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

  // Filter bar: generates label + divider from attributes.
  class ContourFilterBar extends ContourBase {
    render() {
      this.classList.add("c-filter-bar");
      const label = this.getAttribute("label");
      if (label && !this.querySelector(".c-filter-bar__label")) {
        const l = document.createElement("span");
        l.className = "c-filter-bar__label";
        l.textContent = label;
        this.appendChild(l);
      }
      if (this.hasAttribute("divider") && !this.querySelector(".c-filter-bar__divider")) {
        const d = document.createElement("span");
        d.className = "c-filter-bar__divider";
        this.appendChild(d);
      }
    }
  }
  define("contour-filter-bar", ContourFilterBar);

  // Command: generates input + list from items attribute.
  class ContourCommand extends ContourBase {
    render() {
      this.classList.add("c-command");
      const placeholder = this.getAttribute("placeholder") || "Search…";
      if (!this.querySelector(".c-command__input")) {
        const input = document.createElement("input");
        input.className = "c-command__input";
        input.type = "text";
        input.placeholder = placeholder;
        input.setAttribute("aria-label", "Command");
        this.appendChild(input);
      }
      const items = this.getAttribute("items");
      if (items && !this.querySelector(".c-command__list")) {
        try {
          const parsed = JSON.parse(items);
          const list = document.createElement("div");
          list.className = "c-command__list";
          parsed.forEach((it) => {
            const item = document.createElement("div");
            item.className = "c-command__item";
            if (it.icon) {
              const ic = document.createElement("span");
              ic.className = "c-command__item-icon";
              ic.textContent = it.icon;
              item.appendChild(ic);
            }
            const body = document.createElement("div");
            body.className = "c-command__item-body";
            if (it.title) {
              const t = document.createElement("div");
              t.className = "c-command__item-title";
              t.textContent = it.title;
              body.appendChild(t);
            }
            if (it.hint) {
              const h = document.createElement("span");
              h.className = "c-command__item-hint";
              h.textContent = it.hint;
              body.appendChild(h);
            }
            item.appendChild(body);
            list.appendChild(item);
          });
          this.appendChild(list);
        } catch (e) { /* keep existing */ }
      }
      const empty = this.getAttribute("empty");
      if (empty && !this.querySelector(".c-command__empty")) {
        const e = document.createElement("div");
        e.className = "c-command__empty";
        e.textContent = empty;
        this.appendChild(e);
      }
    }
  }
  define("contour-command", ContourCommand);

  // Heatmap: generates cells from count attribute.
  class ContourHeatmap extends ContourBase {
    render() {
      this.classList.add("c-heatmap");
      const count = parseInt(this.getAttribute("cells") || this.getAttribute("count") || "0", 10);
      if (count > 0 && !this.querySelector(".c-heatmap__cell")) {
        for (let i = 0; i < count; i++) {
          const cell = document.createElement("div");
          cell.className = "c-heatmap__cell";
          this.appendChild(cell);
        }
      }
      if (this.hasAttribute("legend") && !this.querySelector(".c-heatmap__legend")) {
        const leg = document.createElement("div");
        leg.className = "c-heatmap__legend";
        const bar = document.createElement("div");
        bar.className = "c-heatmap__legend-bar";
        leg.appendChild(bar);
        this.appendChild(leg);
      }
    }
  }
  define("contour-heatmap", ContourHeatmap);

  // Layer switch: generates items from attribute.
  class ContourLayerSwitch extends ContourBase {
    render() {
      this.classList.add("c-layer-switch");
      const items = this.getAttribute("items");
      if (items && !this.querySelector(".c-layer-switch__item")) {
        try {
          const parsed = JSON.parse(items);
          parsed.forEach((it) => {
            const item = document.createElement("div");
            item.className = "c-layer-switch__item";
            const sw = document.createElement("span");
            sw.className = "c-layer-switch__swatch";
            if (it.color) sw.style.background = it.color;
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
            toggle.textContent = "Toggle";
            item.appendChild(toggle);
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-layer-switch", ContourLayerSwitch);

  // Map slot: generates attribution + scale from attributes.
  class ContourMapSlot extends ContourBase {
    render() {
      this.classList.add("c-map-slot");
      const attribution = this.getAttribute("attribution");
      if (attribution && !this.querySelector(".c-map-slot__attribution")) {
        const a = document.createElement("div");
        a.className = "c-map-slot__attribution";
        a.textContent = attribution;
        this.appendChild(a);
      }
      const scale = this.getAttribute("scale");
      if (scale && !this.querySelector(".c-map-slot__scale")) {
        const sc = document.createElement("div");
        sc.className = "c-map-slot__scale";
        sc.textContent = scale;
        this.appendChild(sc);
      }
    }
  }
  define("contour-map-slot", ContourMapSlot);

  // Map area: generates attribution + scale + controls from attributes.
  class ContourMapArea extends ContourBase {
    render() {
      this.classList.add("c-map-area");
      const attribution = this.getAttribute("attribution");
      if (attribution && !this.querySelector(".c-map-area__attribution")) {
        const a = document.createElement("div");
        a.className = "c-map-area__attribution";
        a.textContent = attribution;
        this.appendChild(a);
      }
      const mark = this.getAttribute("attribution-mark");
      if (mark && !this.querySelector(".c-map-area__attribution-mark")) {
        const m = document.createElement("span");
        m.className = "c-map-area__attribution-mark";
        m.textContent = mark;
        this.appendChild(m);
      }
      const scale = this.getAttribute("scale");
      if (scale && !this.querySelector(".c-map-area__scale")) {
        const sc = document.createElement("div");
        sc.className = "c-map-area__scale";
        sc.textContent = scale;
        this.appendChild(sc);
      }
      const controls = this.getAttribute("controls");
      if (controls && !this.querySelector(".c-map-area__controls")) {
        try {
          const parsed = JSON.parse(controls);
          const wrap = document.createElement("div");
          wrap.className = "c-map-area__controls";
          parsed.forEach((c) => {
            const btn = document.createElement("button");
            btn.className = "c-map-area__control";
            btn.type = "button";
            btn.textContent = typeof c === "string" ? c : (c.label || c);
            wrap.appendChild(btn);
          });
          this.appendChild(wrap);
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-map-area", ContourMapArea);

  // Map panel: generates head + body + foot from attributes.
  class ContourMapPanel extends ContourBase {
    render() {
      this.classList.add("c-map-panel");
      const title = this.getAttribute("title");
      if (title && !this.querySelector(".c-map-panel__title")) {
        const h = document.createElement("h3");
        h.className = "c-map-panel__title";
        h.textContent = title;
        this.prepend(h);
      }
    }
  }
  define("contour-map-panel", ContourMapPanel);

  // Map footer: generates brand + links from attributes.
  class ContourMapFooter extends ContourBase {
    render() {
      this.classList.add("c-map-footer");
      const brand = this.getAttribute("brand");
      if (brand && !this.querySelector(".c-map-footer__brand")) {
        const b = document.createElement("span");
        b.className = "c-map-footer__brand";
        b.textContent = brand;
        this.appendChild(b);
      }
    }
  }
  define("contour-map-footer", ContourMapFooter);

  // Docs nav: generates groups/links from items attribute.
  class ContourDocsNav extends ContourBase {
    render() {
      this.classList.add("c-docs-nav");
      const items = this.getAttribute("items");
      if (items && !this.querySelector(".c-docs-nav__list")) {
        try {
          const parsed = JSON.parse(items);
          const list = document.createElement("div");
          list.className = "c-docs-nav__list";
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
              a.textContent = typeof l === "string" ? l : (l.label || l);
              ul.appendChild(a);
            });
            group.appendChild(ul);
            list.appendChild(group);
          });
          this.appendChild(list);
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-docs-nav", ContourDocsNav);

  // Docs shell: generates title + lede from attributes.
  class ContourDocsShell extends ContourBase {
    render() {
      this.classList.add("c-docs-shell");
      const title = this.getAttribute("title");
      if (title && !this.querySelector(".c-docs-shell__title")) {
        const h = document.createElement("h1");
        h.className = "c-docs-shell__title";
        h.textContent = title;
        this.appendChild(h);
      }
      const lede = this.getAttribute("lede");
      if (lede && !this.querySelector(".c-docs-shell__lede")) {
        const p = document.createElement("p");
        p.className = "c-docs-shell__lede";
        p.textContent = lede;
        this.appendChild(p);
      }
    }
  }
  define("contour-docs-shell", ContourDocsShell);

  // Footer: generates brand + note + links from attributes.
  class ContourFooter extends ContourBase {
    render() {
      this.classList.add("c-footer");
      const brand = this.getAttribute("brand");
      if (brand && !this.querySelector(".c-footer__brand")) {
        const b = document.createElement("div");
        b.className = "c-footer__brand";
        b.textContent = brand;
        this.appendChild(b);
      }
      const note = this.getAttribute("note");
      if (note && !this.querySelector(".c-footer__note")) {
        const n = document.createElement("p");
        n.className = "c-footer__note";
        n.textContent = note;
        this.appendChild(n);
      }
      const links = this.getAttribute("links");
      if (links && !this.querySelector(".c-footer__links")) {
        try {
          const parsed = JSON.parse(links);
          const wrap = document.createElement("div");
          wrap.className = "c-footer__links";
          parsed.forEach((l) => {
            const a = document.createElement("a");
            a.href = typeof l === "string" ? "#" : (l.href || "#");
            a.textContent = typeof l === "string" ? l : (l.label || l);
            wrap.appendChild(a);
          });
          this.appendChild(wrap);
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-footer", ContourFooter);

  // Dash shell: generates title from attribute.
  class ContourDashShell extends ContourBase {
    render() {
      this.classList.add("c-dash-shell");
      const title = this.getAttribute("title");
      if (title && !this.querySelector(".c-dash-shell__title")) {
        const h = document.createElement("h1");
        h.className = "c-dash-shell__title";
        h.textContent = title;
        this.appendChild(h);
      }
    }
  }
  define("contour-dash-shell", ContourDashShell);

  // Dash toolbar: generates title + actions from attributes.
  class ContourDashToolbar extends ContourBase {
    render() {
      this.classList.add("c-dash-toolbar");
      const title = this.getAttribute("title");
      if (title && !this.querySelector(".c-dash-toolbar__title")) {
        const t = document.createElement("span");
        t.className = "c-dash-toolbar__title";
        t.textContent = title;
        this.appendChild(t);
      }
      const actions = this.getAttribute("actions");
      if (actions && !this.querySelector(".c-dash-toolbar__actions")) {
        try {
          const parsed = JSON.parse(actions);
          const wrap = document.createElement("div");
          wrap.className = "c-dash-toolbar__actions";
          parsed.forEach((a) => {
            const btn = document.createElement("button");
            btn.className = "c-btn c-btn--ghost c-btn--sm";
            btn.type = "button";
            btn.textContent = typeof a === "string" ? a : (a.label || a);
            wrap.appendChild(btn);
          });
          this.appendChild(wrap);
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-dash-toolbar", ContourDashToolbar);

  // Dash KPI row: simple wrapper.
  class ContourDashKpiRow extends ContourBase {
    render() { this.classList.add("c-dash-kpi-row"); }
  }
  define("contour-dash-kpi-row", ContourDashKpiRow);

  // Code: generates title + copy button from attributes.
  class ContourCode extends ContourBase {
    render() {
      this.classList.add("c-code");
      const title = this.getAttribute("title");
      if (title && !this.querySelector(".c-code__title")) {
        const t = document.createElement("div");
        t.className = "c-code__title";
        t.textContent = title;
        this.prepend(t);
      }
      if (this.hasAttribute("copyable") && !this.querySelector(".c-code__copy")) {
        const btn = document.createElement("button");
        btn.className = "c-code__copy";
        btn.type = "button";
        btn.textContent = "Copy";
        this.appendChild(btn);
      }
    }
  }
  define("contour-code", ContourCode);

  // Compare: generates yes/no/text from attributes.
  class ContourCompare extends ContourBase {
    render() {
      this.classList.add("c-compare");
      const yes = this.getAttribute("yes");
      const no = this.getAttribute("no");
      const text = this.getAttribute("text");
      if (yes && !this.querySelector(".c-compare__yes")) {
        const y = document.createElement("div");
        y.className = "c-compare__yes";
        y.textContent = yes;
        this.appendChild(y);
      }
      if (no && !this.querySelector(".c-compare__no")) {
        const n = document.createElement("div");
        n.className = "c-compare__no";
        n.textContent = no;
        this.appendChild(n);
      }
      if (text && !this.querySelector(".c-compare__text")) {
        const t = document.createElement("p");
        t.className = "c-compare__text";
        t.textContent = text;
        this.appendChild(t);
      }
    }
  }
  define("contour-compare", ContourCompare);

  // Input group: simple wrapper.
  class ContourInputGroup extends ContourBase {
    render() { this.classList.add("c-input-group"); }
  }
  define("contour-input-group", ContourInputGroup);

  // Datamark: generates label from attribute.
  class ContourDatamark extends ContourBase {
    render() {
      this.classList.add("c-datamark");
      const label = this.getAttribute("label");
      if (label && !this.textContent.trim()) this.textContent = label;
    }
  }
  define("contour-datamark", ContourDatamark);

  // Destructive hint: generates text from attribute.
  class ContourDestructiveHint extends ContourBase {
    render() {
      this.classList.add("c-destructive-hint");
      const text = this.getAttribute("text");
      if (text && !this.textContent.trim()) this.textContent = text;
    }
  }
  define("contour-destructive-hint", ContourDestructiveHint);

  // Icon badge: generates icon from attribute.
  class ContourIconBadge extends ContourBase {
    render() {
      this.classList.add("c-icon-badge");
      const icon = this.getAttribute("icon");
      if (icon && !this.querySelector("svg")) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("aria-hidden", "true");
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttribute("href", "#" + String(icon).replace(/[^a-zA-Z0-9_-]/g, ""));
        svg.appendChild(use);
        this.appendChild(svg);
      }
    }
  }
  define("contour-icon-badge", ContourIconBadge);

  // Live badge: generates label + live dot.
  class ContourLiveBadge extends ContourBase {
    render() {
      this.classList.add("c-live-badge");
      if (this.hasAttribute("live")) this.classList.add("c-live-badge--live");
      const label = this.getAttribute("label");
      if (label && !this.textContent.trim()) this.textContent = label;
    }
  }
  define("contour-live-badge", ContourLiveBadge);

  // Plate: simple wrapper.
  class ContourPlate extends ContourBase {
    render() { this.classList.add("c-plate"); }
  }
  define("contour-plate", ContourPlate);

  // Pullquote: generates quote + byline from attributes.
  class ContourPullquote extends ContourBase {
    render() {
      this.classList.add("c-pullquote");
      const quote = this.getAttribute("quote");
      if (quote && !this.querySelector(".c-pullquote__quote")) {
        const q = document.createElement("blockquote");
        q.className = "c-pullquote__quote";
        q.textContent = quote;
        this.appendChild(q);
      }
      const name = this.getAttribute("name");
      if (name && !this.querySelector(".c-pullquote__byline")) {
        const by = document.createElement("div");
        by.className = "c-pullquote__byline";
        by.textContent = name;
        this.appendChild(by);
      }
    }
  }
  define("contour-pullquote", ContourPullquote);

  // Scale bar: generates label from attribute.
  class ContourScaleBar extends ContourBase {
    render() {
      this.classList.add("c-scale-bar");
      const label = this.getAttribute("label");
      if (label && !this.querySelector(".c-scale-bar__label")) {
        const l = document.createElement("span");
        l.className = "c-scale-bar__label";
        l.textContent = label;
        this.appendChild(l);
      }
    }
  }
  define("contour-scale-bar", ContourScaleBar);

  // Scheme toggle: simple wrapper.
  class ContourSchemeToggle extends ContourBase {
    render() { this.classList.add("c-scheme-toggle"); }
  }
  define("contour-scheme-toggle", ContourSchemeToggle);

  // Sidebar: simple wrapper.
  class ContourSidebar extends ContourBase {
    render() { this.classList.add("c-sidebar"); }
  }
  define("contour-sidebar", ContourSidebar);

  // Sparkline: simple wrapper.
  class ContourSparkline extends ContourBase {
    render() { this.classList.add("c-sparkline"); }
  }
  define("contour-sparkline", ContourSparkline);

  // Toolbar: generates title + actions from attributes.
  class ContourToolbar extends ContourBase {
    render() {
      this.classList.add("c-toolbar");
      const title = this.getAttribute("title");
      if (title && !this.querySelector(".c-toolbar__title")) {
        const t = document.createElement("span");
        t.className = "c-toolbar__title";
        t.textContent = title;
        this.appendChild(t);
      }
      const actions = this.getAttribute("actions");
      if (actions && !this.querySelector(".c-toolbar__btn")) {
        try {
          const parsed = JSON.parse(actions);
          parsed.forEach((a) => {
            const btn = document.createElement("button");
            btn.className = "c-toolbar__btn";
            btn.type = "button";
            btn.textContent = typeof a === "string" ? a : (a.label || a);
            this.appendChild(btn);
          });
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-toolbar", ContourToolbar);

  // ---- Registration: the class-only wrappers run last ------------------
  //
  // Order is the contract. Every complex component above claims its own name and
  // define() skips a name already claimed -- which is why
  // <contour-menu items='["Cut"]'> builds a <ul> instead of only gaining a class.
  // Move this loop back above the complex components and the scaffolding half of
  // this file becomes dead code again: it did, and no gate noticed.
  for (const block of CLASS_ONLY) {
    define("contour-" + block, simple(["c-" + block]));
  }

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
      "accordion", "activity", "advanced", "affordance", "affordances", "app", "app-body", "box",
      "btn-group", "catchment", "chart-grid", "cluster", "command", "compare", "comparison", "compass",
      "contour-plot", "cta", "dash-freshness", "dash-kpi-row", "dash-shell", "dash-toolbar", "datamark", "delta",
      "destructive-hint", "docs-shell", "drag-handle", "draggable", "drawer", "drop-indicator", "drop-zone", "elevation",
      "filter-bar", "filter-pill", "flow-map", "heatmap", "hexbin", "icon-badge", "input-group", "instrument",
      "isochrone", "landing-features", "landing-hero", "layer-panel", "layer-switch", "legend", "logos", "map-area",
      "map-footer", "map-panel", "map-slot", "measure", "metrics", "minimap", "pager", "pagination",
      "panel", "plate", "price", "pricing", "progress", "prose", "pullquote", "radio-list",
      "range", "range-scale", "readout", "recipe", "reserved", "resizable", "resize-handle", "row",
      "row-action", "scale-bar", "scrim", "segmented", "sheet", "shortcut-list", "shortcut-overlay", "shortcut-panel",
      "shortcut-row", "showcase", "sidebar", "skeleton", "sparkline", "stack", "steps", "streaming-chart",
      "survey", "table-wrap", "theme-scope", "time-range", "time-slider", "timeline", "toast", "toast-host",
      "toolbar", "tooltip", "tree", "version", "version-banner", "virtual-scroll"
    ],
    button: [
      "btn", "pressable", "scheme-toggle"
    ],
    span: [
      "avatar", "badge", "chip", "dot", "flag", "live-badge", "mark", "pill",
      "tag"
    ],
    a: [
      "anchor", "link", "linkish"
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
  shadow("contour-shadow-install", `<div class="c-install" part="install"><span class="c-install__prompt" part="prompt"><slot name="prompt"></slot></span><span class="c-install__command" part="command"><slot name="command"></slot></span></div>`);
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
  shadow("contour-shadow-code", `<pre class="c-code" part="code"><code><slot></slot></code></pre>`);
  // (folded in from the hand-written component that used to carry its own copy of the sheet logic)
  shadow("contour-shadow-card", `<div class="c-card" part="card"> <div class="c-card__head" part="head"><slot name="title">Untitled</slot></div> <div class="c-card__body" part="body"><slot></slot></div> <div class="c-card__foot" part="foot"><slot name="foot"></slot></div> </div>`);
  // (folded in from the hand-written component that used to carry its own copy of the sheet logic)
  // (folded in from the hand-written component that used to carry its own copy of the sheet logic)
  shadow("contour-shadow-field", `<div class="c-field" part="field"> <label class="c-field__label" part="label"><slot name="label">Label</slot></label> <slot name="input"></slot> <span class="c-field__hint" part="hint"><slot name="hint"></slot></span> </div>`);
  // (folded in from the hand-written component that used to carry its own copy of the sheet logic)
  shadow("contour-shadow-alert", `<div class="c-alert" part="alert"> <div class="c-alert__title" part="title"><slot name="title"></slot></div> <div class="c-alert__body" part="body"><slot></slot></div> </div>`);

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
