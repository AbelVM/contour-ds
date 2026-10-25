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




  // ---- Complex components with scaffolding ----

  // Menu: generates <ul> with items from data-items attribute.
  class ContourMenu extends ContourBase {
    render() {
      this.classList.add("c-menu");
      if (!this.hasAttribute("role")) this.setAttribute("role", "menu");
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const ul = this.ensure("ul.c-menu", () => { const el = document.createElement("ul"); el.className = "c-menu"; el.setAttribute("role", "menu"); return el; });
          ul.innerHTML = "";
          ul.setAttribute("role", "menu");
          parsed.forEach((item) => {
            if (item === "---" || item === "separator") {
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
          if (ul.parentNode !== this) { this.innerHTML = ""; this.appendChild(ul); }
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
      const title = this.getAttribute("title");
      if (title) {
        const h = this.ensure(".c-card__title", () => { const el = document.createElement("h3"); el.className = "c-card__title"; return el; });
        if (h.parentNode === this && this.firstChild !== h) this.prepend(h);
        h.textContent = title;
      } else {
        const h = this.querySelector(".c-card__title");
        if (h) h.remove();
      }
    }
  }
  define("contour-card", ContourCard);

  // Tabs: generates tab list from data-tabs attribute.
  class ContourTabs extends ContourBase {
    render() {
      this.classList.add("c-tabs");
      const tabs = this.getAttribute("tabs");
      if (tabs) {
        try {
          const parsed = JSON.parse(tabs);
          const list = this.ensure(".c-tabs__list", () => { const el = document.createElement("div"); el.className = "c-tabs__list"; el.setAttribute("role", "tablist"); return el; });
          list.setAttribute("role", "tablist");
          list.innerHTML = "";
          parsed.forEach((t, i) => {
            const btn = document.createElement("button");
            btn.className = "c-tabs__tab" + (i === 0 ? " c-tabs__tab--active" : "");
            btn.setAttribute("role", "tab");
            btn.setAttribute("aria-selected", String(i === 0));
            btn.tabIndex = i === 0 ? 0 : -1;
            btn.textContent = typeof t === "string" ? t : t.label;
            list.appendChild(btn);
          });
          if (list.parentNode !== this) this.prepend(list);
        } catch (e) { /* keep existing */ }
      } else {
        const list = this.querySelector(".c-tabs__list");
        if (list) list.remove();
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
      if (brand) {
        const inner = this.ensure(".c-header__inner", () => { const el = document.createElement("div"); el.className = "container c-header__inner"; return el; });
        inner.innerHTML = "";
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
        if (inner.parentNode !== this) { this.innerHTML = ""; this.appendChild(inner); }
      }
    }
  }
  define("contour-header", ContourHeader);

  // Combobox: generates input + list from data-options.
  class ContourCombobox extends ContourBase {
    render() {
      this.classList.add("c-combobox");
      const options = this.getAttribute("options");
      if (options) {
        try {
          const parsed = JSON.parse(options);
          const input = this.ensure(".c-combobox__input", () => { const el = document.createElement("input"); el.className = "c-combobox__input"; el.type = "text"; return el; });
          input.type = "text";
          input.placeholder = this.getAttribute("placeholder") || "Search…";
          input.setAttribute("aria-label", this.getAttribute("label") || "Search");
          const list = this.ensure(".c-combobox__list", () => { const el = document.createElement("ul"); el.className = "c-combobox__list"; el.setAttribute("hidden", ""); return el; });
          list.innerHTML = "";
          list.setAttribute("hidden", "");
          parsed.forEach((opt) => {
            const li = document.createElement("li");
            li.className = "c-combobox__option";
            li.textContent = typeof opt === "string" ? opt : opt.label;
            list.appendChild(li);
          });
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
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const rootUl = this.ensure("ul.c-tree", () => { const el = document.createElement("ul"); el.className = "c-tree"; el.setAttribute("role", "tree"); return el; });
          rootUl.innerHTML = "";
          rootUl.className = "c-tree";
          const render = (nodes, parent) => {
            const ul = parent ? document.createElement("ul") : rootUl;
            if (parent) {
              ul.className = "c-tree__children";
              ul.setAttribute("hidden", "");
            }
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
          };
          render(parsed, null);
          this.classList.remove("c-tree");
          rootUl.classList.add("c-tree");
          if (rootUl.parentNode !== this) this.appendChild(rootUl);
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
      if (title) {
        let head = this.querySelector(".c-dialog__head");
        if (!head) {
          head = document.createElement("div");
          head.className = "c-dialog__head";
          const h = document.createElement("h2");
          h.className = "c-dialog__title";
          head.appendChild(h);
          const closeBtn = document.createElement("button");
          closeBtn.className = "c-btn c-btn--icon c-btn--ghost";
          closeBtn.setAttribute("type", "button");
          closeBtn.setAttribute("aria-label", "Close");
          closeBtn.innerHTML = '<svg aria-hidden="true"><use href="#i-close" /></svg>';
          head.appendChild(closeBtn);
          this.prepend(head);
        }
        const h = head.querySelector(".c-dialog__title");
        if (h) h.textContent = title;
      }
    }
    enhance() {
      if (this._wiredDialog) return;
      this._wiredDialog = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-btn--icon") : null;
        if (!btn || !this.contains(btn)) return;
        const dlg = this.querySelector("dialog") || (this.tagName === "DIALOG" ? this : null);
        if (dlg && typeof dlg.close === "function") dlg.close();
        this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true }));
      });
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
      if (title) {
        const t = this.ensure(".c-alert__title", () => { const el = document.createElement("div"); el.className = "c-alert__title"; return el; });
        if (t.parentNode === this && this.firstChild !== t) this.prepend(t);
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-alert__title");
        if (t) t.remove();
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
      if (label) {
        const lbl = this.ensure(".c-field__label", () => { const el = document.createElement("label"); el.className = "c-field__label"; return el; });
        lbl.textContent = label;
      } else {
        const lbl = this.querySelector(".c-field__label");
        if (lbl) lbl.remove();
      }
      if (!this.querySelector("input, textarea, select")) {
        const input = document.createElement("input");
        input.className = "c-input";
        input.type = this.getAttribute("type") || "text";
        input.placeholder = placeholder;
        input.id = input.id || ("contour-field-" + Math.random().toString(36).slice(2, 9));
        this.appendChild(input);
      }
      // Associate the label with the input so the control is labelled.
      const lbl = this.querySelector(".c-field__label");
      const inp = this.querySelector("input, textarea, select");
      if (lbl && inp) { if (!inp.id) inp.id = "contour-field-" + Math.random().toString(36).slice(2, 9); lbl.setAttribute("for", inp.id); }
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
    }
  }
  define("contour-field", ContourField);

  // Readout: generates rows from data-rows attribute.
  class ContourReadout extends ContourBase {
    render() {
      this.classList.add("c-readout");
      const rows = this.getAttribute("rows");
      if (rows) {
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
      if (value) {
        const v = this.ensure(".c-kpi__value", () => { const el = document.createElement("div"); el.className = "c-kpi__value"; return el; });
        v.textContent = value;
      } else {
        const v = this.querySelector(".c-kpi__value");
        if (v) v.remove();
      }
      if (label) {
        const l = this.ensure(".c-kpi__label", () => { const el = document.createElement("div"); el.className = "c-kpi__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-kpi__label");
        if (l) l.remove();
      }
      if (delta) {
        const d = this.ensure(".c-kpi__delta", () => { const el = document.createElement("div"); el.className = "c-kpi__delta"; return el; });
        d.textContent = delta;
      } else {
        const d = this.querySelector(".c-kpi__delta");
        if (d) d.remove();
      }
    }
  }
  define("contour-kpi", ContourKpi);

  // Accordion/Disclosure: generates summary + content.
  class ContourDisclosure extends ContourBase {
    render() {
      this.classList.add("c-disclosure");
      const summary = this.getAttribute("summary");
      if (summary) {
        const captured = this.innerHTML;
        const details = this.ensure("details", () => {
          const d = document.createElement("details");
          const summ = document.createElement("summary");
          summ.textContent = summary;
          d.appendChild(summ);
          const content = document.createElement("div");
          content.className = "c-disclosure__body";
          content.innerHTML = captured;
          d.appendChild(content);
          return d;
        });
        // update summary if already existed
        const summ = details.querySelector("summary");
        if (summ) summ.textContent = summary;
        if (details.parentNode !== this) { this.innerHTML = ""; this.appendChild(details); }
      } else {
        const details = this.querySelector("details");
        if (details) details.remove();
      }
    }
  }
  define("contour-disclosure", ContourDisclosure);

  // Table: generates from data-columns and data-rows.
  class ContourTable extends ContourBase {
    render() {
      // The host is not a <table>, so it carries no table rule. The scroller the
      // reflow contract requires is a real block element inside it.
      const columns = this.getAttribute("columns");
      const rows = this.getAttribute("rows");
      if (columns && rows) {
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
          const wrap = this.ensure(".c-table-wrap", () => { const el = document.createElement("div"); el.className = "c-table-wrap"; return el; });
          wrap.innerHTML = "";
          wrap.appendChild(table);
          if (wrap.parentNode !== this) this.appendChild(wrap);
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
      if (series) {
        try {
          const parsed = JSON.parse(series);
          const plot = this.ensure(".c-chart__plot", () => { const el = document.createElement("div"); el.className = "c-chart__plot"; return el; });
          plot.innerHTML = "";
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
        } catch (e) { /* keep existing */ }
      } else {
        const plot = this.querySelector(".c-chart__plot");
        if (plot) plot.remove();
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
      if (value) {
        const span = this.ensure(".c-coordinate__value", () => { const el = document.createElement("span"); el.className = "c-coordinate__value"; return el; });
        span.textContent = value;
      } else {
        const span = this.querySelector(".c-coordinate__value");
        if (span) span.remove();
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
      if (title) {
        const t = this.ensure(".c-callout__title", () => { const el = document.createElement("div"); el.className = "c-callout__title"; return el; });
        if (t.parentNode === this && this.firstChild !== t) this.prepend(t);
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-callout__title");
        if (t) t.remove();
      }
    }
  }
  define("contour-callout", ContourCallout);

  // Empty state: generates icon + title + body + action.
  class ContourEmpty extends ContourBase {
    render() {
      this.classList.add("c-empty");
      const state = this.getAttribute("state") || "empty";
      const title = this.getAttribute("title") || (state === "filtered" ? "Nothing matches" : state === "error" ? "Could not load" : "No data yet");
      const body = this.getAttribute("body") || (state === "filtered" ? "Try clearing some filters." : state === "error" ? "Check your connection and try again." : "There is nothing to show here yet.");
      const action = this.getAttribute("action") || (state === "filtered" ? "Clear filters" : state === "error" ? "Retry" : "");
      if (title) {
        const t = this.ensure(".c-empty__title", () => { const el = document.createElement("h3"); el.className = "c-empty__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-empty__title");
        if (t) t.remove();
      }
      if (body) {
        const b = this.ensure(".c-empty__body", () => { const el = document.createElement("p"); el.className = "c-empty__body"; return el; });
        b.textContent = body;
      } else {
        const b = this.querySelector(".c-empty__body");
        if (b) b.remove();
      }
      if (action) {
        const a = this.ensure(".c-empty__action", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--primary c-empty__action"; el.type = "button"; return el; });
        a.textContent = action;
      } else {
        const a = this.querySelector(".c-empty__action");
        if (a) a.remove();
      }
    }
    enhance() {
      if (this._wiredEmpty) return;
      this._wiredEmpty = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-empty__action") : null;
        if (!btn || !this.contains(btn)) return;
        this.dispatchEvent(new CustomEvent("contour:empty-action", { detail: { state: this.getAttribute("state") || "empty" }, bubbles: true }));
      });
    }
  }
  define("contour-empty", ContourEmpty);

  // FAQ: generates question + answer.
  class ContourFaq extends ContourBase {
    render() {
      this.classList.add("c-faq");
      const question = this.getAttribute("question");
      const answer = this.getAttribute("answer");
      if (question) {
        const q = this.ensure(".c-faq__question", () => { const el = document.createElement("div"); el.className = "c-faq__question"; return el; });
        q.textContent = question;
      } else {
        const q = this.querySelector(".c-faq__question");
        if (q) q.remove();
      }
      if (answer) {
        const a = this.ensure(".c-faq__answer", () => { const el = document.createElement("div"); el.className = "c-faq__answer"; return el; });
        a.textContent = answer;
      } else {
        const a = this.querySelector(".c-faq__answer");
        if (a) a.remove();
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
      if (icon) {
        const i = this.ensure(".c-feature__icon", () => {
          const el = document.createElement("div");
          el.className = "c-feature__icon";
          const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("aria-hidden", "true");
          const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
          use.setAttribute("href", "#" + String(icon).replace(/[^a-zA-Z0-9_-]/g, ""));
          svg.appendChild(use);
          el.appendChild(svg);
          return el;
        });
        const use = i.querySelector("use");
        if (use) use.setAttribute("href", "#" + String(icon).replace(/[^a-zA-Z0-9_-]/g, ""));
      } else {
        const i = this.querySelector(".c-feature__icon");
        if (i) i.remove();
      }
      if (title) {
        const t = this.ensure(".c-feature__title", () => { const el = document.createElement("h3"); el.className = "c-feature__title"; return el; });
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

  // Code tabs: generates tab list + panels.
  class ContourCodeTabs extends ContourBase {
    render() {
      this.classList.add("c-code-tabs");
      const tabs = this.getAttribute("tabs");
      if (tabs) {
        try {
          const parsed = JSON.parse(tabs);
          const list = this.ensure(".c-code-tabs__list", () => { const el = document.createElement("div"); el.className = "c-code-tabs__list"; el.setAttribute("role", "tablist"); return el; });
          list.setAttribute("role", "tablist");
          list.innerHTML = "";
          parsed.forEach((t, i) => {
            const btn = document.createElement("button");
            btn.className = "c-code-tabs__tab" + (i === 0 ? " c-code-tabs__tab--active" : "");
            btn.setAttribute("role", "tab");
            btn.setAttribute("aria-selected", String(i === 0));
            btn.tabIndex = i === 0 ? 0 : -1;
            btn.textContent = typeof t === "string" ? t : t.label;
            list.appendChild(btn);
          });
          if (list.parentNode !== this) this.prepend(list);
        } catch (e) { /* keep existing */ }
      } else {
        const list = this.querySelector(".c-code-tabs__list");
        if (list) list.remove();
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
      if (steps) {
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
      if (items) {
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
      if (name) {
        const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
        // Only set if no authored content
        if (!this.textContent.trim()) this.textContent = initials;
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
      if (label) {
        if (!this.textContent.trim()) this.textContent = label;
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

  // Tag: generates text + remove button.
  class ContourTag extends ContourBase {
    render() {
      this.classList.add("c-tag");
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
      if (this._wiredTag) return;
      this._wiredTag = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-tag__remove") : null;
        if (!btn || !this.contains(btn)) return;
        this.dispatchEvent(new CustomEvent("contour:remove", { detail: { label: this.getAttribute("label") || this.textContent.trim() }, bubbles: true }));
        if (this.parentNode) this.parentNode.removeChild(this);
      });
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
      if (label) {
        if (!this.textContent.trim()) this.textContent = label;
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
      if (key) {
        if (!this.textContent.trim()) this.textContent = key;
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
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const nav = this.ensure("nav", () => { const el = document.createElement("nav"); el.setAttribute("aria-label", "Breadcrumb"); return el; });
          nav.setAttribute("aria-label", "Breadcrumb");
          const ol = nav.querySelector("ol") || (() => { const el = document.createElement("ol"); nav.appendChild(el); return el; })();
          ol.innerHTML = "";
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
        } catch (e) { /* keep existing */ }
      } else {
        const nav = this.querySelector("nav");
        if (nav) nav.remove();
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
      if (pages) {
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
    enhance() {
      if (this._wiredPagination) return;
      this._wiredPagination = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-pagination__link") : null;
        if (!btn || !this.contains(btn)) return;
        const page = parseInt(btn.textContent, 10);
        // Update active state in place rather than setAttribute("current"), which
        // would re-enter the render that owns this list.
        this.querySelectorAll(".c-pagination__link").forEach((b) => {
          const active = parseInt(b.textContent, 10) === page;
          b.classList.toggle("c-pagination__current", active);
          if (active) b.setAttribute("aria-current", "page");
          else b.removeAttribute("aria-current");
        });
        this.dispatchEvent(new CustomEvent("contour:page", { detail: { page }, bubbles: true }));
      });
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
      if (text && !this.querySelector("*") && !this.textContent.trim()) {
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
      if (message && !this.querySelector("*") && !this.textContent.trim()) {
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
      if (label) {
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
      if (label) {
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
      if (label) {
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
      if (options) {
        try {
          const parsed = JSON.parse(options);
          const select = this.ensure("select.c-select", () => { const el = document.createElement("select"); el.className = "c-select"; return el; });
          select.innerHTML = "";
          parsed.forEach((opt) => {
            const option = document.createElement("option");
            option.value = typeof opt === "string" ? opt : opt.value;
            option.textContent = typeof opt === "string" ? opt : opt.label;
            select.appendChild(option);
          });
          if (select.parentNode !== this) this.appendChild(select);
          this.classList.remove("c-select");
          select.classList.add("c-select");
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
      if (options) {
        try {
          const parsed = JSON.parse(options);
          const select = this.ensure("select.c-version", () => { const el = document.createElement("select"); el.className = "c-version"; return el; });
          select.innerHTML = "";
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
      if (href && label) {
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

  // Section head: generates from title and desc.
  class ContourSectionHead extends ContourBase {
    render() {
      this.classList.add("c-section-head");
      const title = this.getAttribute("title");
      const desc = this.getAttribute("desc");
      if (title) {
        const t = this.ensure(".c-section-head__title", () => { const el = document.createElement("h2"); el.className = "c-section-head__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-section-head__title");
        if (t) t.remove();
      }
      if (desc) {
        const d = this.ensure(".c-section-head__desc", () => { const el = document.createElement("p"); el.className = "c-section-head__desc"; return el; });
        d.textContent = desc;
      } else {
        const d = this.querySelector(".c-section-head__desc");
        if (d) d.remove();
      }
    }
  }
  define("contour-section-head", ContourSectionHead);

  // Empty state: already defined above.

  // Loading: generates spinner.
  class ContourLoading extends ContourBase {
    render() {
      this.classList.add("c-loading");
      this.ensure(".c-spinner", () => { const el = document.createElement("span"); el.className = "c-spinner"; return el; });
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
      if (before) {
        const b = this.ensure(".c-diff__before", () => { const el = document.createElement("div"); el.className = "c-diff__before"; return el; });
        b.textContent = before;
      } else {
        const b = this.querySelector(".c-diff__before");
        if (b) b.remove();
      }
      if (after) {
        const a = this.ensure(".c-diff__after", () => { const el = document.createElement("div"); el.className = "c-diff__after"; return el; });
        a.textContent = after;
      } else {
        const a = this.querySelector(".c-diff__after");
        if (a) a.remove();
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
      if (doText) {
        const d = this.ensure(".c-do-dont__do", () => { const el = document.createElement("div"); el.className = "c-do-dont__do"; return el; });
        d.textContent = doText;
      } else {
        const d = this.querySelector(".c-do-dont__do");
        if (d) d.remove();
      }
      if (dontText) {
        const d = this.ensure(".c-do-dont__dont", () => { const el = document.createElement("div"); el.className = "c-do-dont__dont"; return el; });
        d.textContent = dontText;
      } else {
        const d = this.querySelector(".c-do-dont__dont");
        if (d) d.remove();
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
      const core = this.ensure(".c-meter__core", () => { const el = document.createElement("span"); el.className = "c-meter__core"; return el; });
      let val = core.querySelector(".c-meter__value");
      if (!val) { val = document.createElement("span"); val.className = "c-meter__value"; core.appendChild(val); }
      val.textContent = Math.round(parseFloat(value) * 100) + "%";
      if (label) {
        const lbl = core.querySelector(".c-meter__label") || (() => { const el = document.createElement("span"); el.className = "c-meter__label"; core.appendChild(el); return el; })();
        lbl.textContent = label;
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
      if (value) {
        const arrow = this.ensure(".c-delta__arrow", () => { const el = document.createElement("span"); el.className = "c-delta__arrow"; return el; });
        arrow.textContent = direction === "up" ? "↑" : direction === "down" ? "↓" : "→";
        const val = this.ensure(".c-delta__value", () => { const el = document.createElement("span"); el.className = "c-delta__value"; return el; });
        val.textContent = value;
      } else {
        const arrow = this.querySelector(".c-delta__arrow");
        if (arrow) arrow.remove();
        const val = this.querySelector(".c-delta__value");
        if (val) val.remove();
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
      if (value) {
        const v = this.ensure(".c-stat__value", () => { const el = document.createElement("div"); el.className = "c-stat__value"; return el; });
        v.textContent = value;
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
    }
  }
  define("contour-stat", ContourStat);

  // KPI: already defined above.

  // Instrument readout: generates rows.
  class ContourInstrument extends ContourBase {
    render() {
      this.classList.add("c-instrument");
      const rows = this.getAttribute("rows");
      if (rows) {
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
      const matrix = this.ensure(".c-bivariate__matrix", () => { const el = document.createElement("div"); el.className = "c-bivariate__matrix"; return el; });
      matrix.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      matrix.innerHTML = "";
      for (let i = 0; i < size * size; i++) {
        const cell = document.createElement("div");
        cell.className = "c-bivariate__cell";
        matrix.appendChild(cell);
      }
    }
  }
  define("contour-bivariate", ContourBivariate);

  // Expandable: generates summary + content.
  class ContourExpandable extends ContourBase {
    render() {
      this.classList.add("c-expandable");
      const summary = this.getAttribute("summary");
      if (summary) {
        const captured = this.innerHTML;
        const details = this.ensure("details", () => {
          const d = document.createElement("details");
          const summ = document.createElement("summary");
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
        if (details.parentNode !== this) { this.innerHTML = ""; this.appendChild(details); }
      } else {
        const details = this.querySelector("details");
        if (details) details.remove();
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
      if (label) {
        if (!this.textContent.trim()) this.textContent = label;
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
      if (date) {
        const v = document.createElement("span");
        v.className = "c-survey__value";
        v.textContent = date;
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
  }
  define("contour-survey", ContourSurvey);

  // Threshold: generates from value and label.
  class ContourThreshold extends ContourBase {
    render() {
      this.classList.add("c-threshold");
      const value = this.getAttribute("value");
      const label = this.getAttribute("label");
      if (value) {
        const v = this.ensure(".c-threshold__value", () => { const el = document.createElement("span"); el.className = "c-threshold__value"; return el; });
        v.textContent = value;
      } else {
        const v = this.querySelector(".c-threshold__value");
        if (v) v.remove();
      }
      if (label) {
        const l = this.ensure(".c-threshold__label", () => { const el = document.createElement("span"); el.className = "c-threshold__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-threshold__label");
        if (l) l.remove();
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
      if (this._wiredInstall) return;
      this._wiredInstall = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-install__copy") : null;
        if (!btn || !this.contains(btn)) return;
        const cmd = this.querySelector(".c-install__command");
        const text = cmd ? cmd.textContent : "";
        if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
        this.dispatchEvent(new CustomEvent("contour:copy", { detail: { text }, bubbles: true }));
      });
    }
  }
  define("contour-install", ContourInstallFull);

  // Pager: generates prev/next links.
  class ContourPagerFull extends ContourBase {
    render() {
      this.classList.add("c-pager");
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

  // TOC: generates title + list from items.
  class ContourTocFull extends ContourBase {
    render() {
      this.classList.add("c-toc");
      const title = this.getAttribute("title") || "On this page";
      const items = this.getAttribute("items");
      const titleEl = this.ensure(".c-toc__title", () => { const el = document.createElement("div"); el.className = "c-toc__title"; return el; });
      titleEl.textContent = title;
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const list = this.ensure(".c-toc__list", () => { const el = document.createElement("nav"); el.className = "c-toc__list"; return el; });
          list.className = "c-toc__list";
          list.setAttribute("aria-label", title);
          list.innerHTML = "";
          parsed.forEach((item) => {
            const a = document.createElement("a");
            a.className = "c-toc__link" + (item.sub ? " c-toc__link--sub" : "");
            a.href = item.href || "#";
            a.textContent = item.label || item;
            if (item.current) a.setAttribute("aria-current", "true");
            list.appendChild(a);
          });
        } catch (e) { /* keep existing */ }
      } else {
        const list = this.querySelector(".c-toc__list");
        if (list) list.remove();
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

  // Showcase: generates media + title + text + list.
  // Note: the `media` attribute is intentionally treated as raw HTML so a
  // consumer can embed arbitrary media markup (images, video, iframes). It is
  // NOT sanitized — only pass trusted content; sanitize untrusted input first.
  class ContourShowcaseFull extends ContourBase {
    render() {
      this.classList.add("c-showcase");
      if (this.hasAttribute("reverse")) this.classList.add("c-showcase--reverse");
      else this.classList.remove("c-showcase--reverse");
      const title = this.getAttribute("title");
      const text = this.getAttribute("text");
      const media = this.getAttribute("media");
      if (media) {
        const m = this.ensure(".c-showcase__media", () => { const el = document.createElement("div"); el.className = "c-showcase__media"; return el; });
        m.innerHTML = media;
      } else {
        const m = this.querySelector(".c-showcase__media");
        if (m) m.remove();
      }
      if (title) {
        const t = this.ensure(".c-showcase__title", () => { const el = document.createElement("h3"); el.className = "c-showcase__title"; return el; });
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
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const ul = this.ensure(".c-showcase__list", () => { const el = document.createElement("ul"); el.className = "c-showcase__list"; return el; });
          ul.innerHTML = "";
          parsed.forEach((it) => {
            const li = document.createElement("li");
            li.textContent = typeof it === "string" ? it : it.label;
            ul.appendChild(li);
          });
        } catch (e) { /* keep existing */ }
      } else {
        const ul = this.querySelector(".c-showcase__list");
        if (ul) ul.remove();
      }
    }
  }
  define("contour-showcase", ContourShowcaseFull);

  // Pricing: generates price + features.
  class ContourPricingFull extends ContourBase {
    render() {
      this.classList.add("c-pricing");
      const price = this.getAttribute("price");
      if (price) {
        const p = this.ensure(".c-price", () => { const el = document.createElement("div"); el.className = "c-price"; return el; });
        p.textContent = price;
      } else {
        const p = this.querySelector(".c-price");
        if (p) p.remove();
      }
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-pricing__label", () => { const el = document.createElement("div"); el.className = "c-pricing__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-pricing__label");
        if (l) l.remove();
      }
      const features = this.getAttribute("features");
      if (features) {
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
      if (title) {
        const t = this.ensure(".c-recipe__title", () => { const el = document.createElement("h3"); el.className = "c-recipe__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-recipe__title");
        if (t) t.remove();
      }
      const body = this.getAttribute("body");
      if (body) {
        const b = this.ensure(".c-recipe__body", () => { const el = document.createElement("p"); el.className = "c-recipe__body"; return el; });
        b.textContent = body;
      } else {
        const b = this.querySelector(".c-recipe__body");
        if (b) b.remove();
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
      const span = this.ensure("span", () => { const el = document.createElement("span"); return el; });
      if (!span.textContent.trim() || span.textContent.trim() !== label) span.textContent = label;
      const kbd = this.ensure("kbd.c-kbd", () => { const el = document.createElement("kbd"); el.className = "c-kbd"; return el; });
      kbd.className = "c-kbd";
      kbd.textContent = this.getAttribute("shortcut") || "⌘K";
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
      if (key) {
        const k = this.ensure(".c-shortcut-row__key", () => { const el = document.createElement("kbd"); el.className = "c-kbd"; return el; });
        k.className = "c-kbd";
        k.textContent = key;
      } else {
        const k = this.querySelector("kbd.c-kbd");
        if (k) k.remove();
      }
      if (desc) {
        const s = this.ensure(".c-shortcut-row__desc", () => { const el = document.createElement("span"); return el; });
        s.textContent = desc;
      } else {
        // remove the desc span if present (the one without class)
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
      if (value && !this.querySelector("*") && !this.textContent.trim()) this.textContent = value;
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
      if (title) {
        const h = this.ensure(".c-panel__title", () => { const el = document.createElement("h3"); el.className = "c-panel__title"; return el; });
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
    }
  }
  define("contour-panel", ContourPanel);

  // Legend: generates title + items from attributes.
  class ContourLegend extends ContourBase {
    render() {
      this.classList.add("c-legend");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-legend__title", () => { const el = document.createElement("div"); el.className = "c-legend__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-legend__title");
        if (t) t.remove();
      }
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const list = this.ensure(".c-legend__items", () => { const el = document.createElement("div"); el.className = "c-legend__items"; return el; });
          list.innerHTML = "";
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
        } catch (e) { /* keep existing */ }
      } else {
        const list = this.querySelector(".c-legend__items");
        if (list) list.remove();
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
    }
  }
  define("contour-legend", ContourLegend);

  // Measure: generates label + value from attributes.
  class ContourMeasure extends ContourBase {
    render() {
      this.classList.add("c-measure");
      const label = this.getAttribute("label");
      const value = this.getAttribute("value");
      if (label) {
        const l = this.ensure(".c-measure__label", () => { const el = document.createElement("span"); el.className = "c-measure__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-measure__label");
        if (l) l.remove();
      }
      if (value) {
        const r = this.ensure(".c-measure__readout", () => { const el = document.createElement("span"); el.className = "c-measure__readout"; return el; });
        r.textContent = value;
      } else {
        const r = this.querySelector(".c-measure__readout");
        if (r) r.remove();
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
      if (this._wiredFilterPill) return;
      this._wiredFilterPill = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-filter-pill__remove") : null;
        if (!btn || !this.contains(btn)) return;
        this.dispatchEvent(new CustomEvent("contour:remove", { detail: { key: this.getAttribute("key"), value: this.getAttribute("value") }, bubbles: true }));
        if (this.parentNode) this.parentNode.removeChild(this);
      });
    }
  }
  define("contour-filter-pill", ContourFilterPill);

  // Timeline: generates items from attribute.
  class ContourTimeline extends ContourBase {
    render() {
      this.classList.add("c-timeline");
      const items = this.getAttribute("items");
      if (items) {
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
      if (title) {
        const t = this.ensure(".c-cta__title", () => { const el = document.createElement("h3"); el.className = "c-cta__title"; return el; });
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

  // Filter bar: generates label + divider from attributes.
  class ContourFilterBar extends ContourBase {
    render() {
      this.classList.add("c-filter-bar");
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
    }
  }
  define("contour-filter-bar", ContourFilterBar);

  // Command: generates input + list from items attribute.


  class ContourCommand extends ContourBase {
    render() {
      this.classList.add("c-command");
      const placeholder = this.getAttribute("placeholder") || "Search…";
      const input = this.ensure(".c-command__input", () => { const el = document.createElement("input"); el.className = "c-command__input"; el.type = "text"; return el; });
      input.type = "text";
      input.placeholder = placeholder;
      input.setAttribute("aria-label", "Command");
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const list = this.ensure(".c-command__list", () => { const el = document.createElement("div"); el.className = "c-command__list"; return el; });
          list.innerHTML = "";
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
        } catch (e) { /* keep existing */ }
      } else {
        const list = this.querySelector(".c-command__list");
        if (list) list.remove();
      }
      const empty = this.getAttribute("empty");
      if (empty) {
        const e = this.ensure(".c-command__empty", () => { const el = document.createElement("div"); el.className = "c-command__empty"; return el; });
        e.textContent = empty;
      } else {
        const e = this.querySelector(".c-command__empty");
        if (e) e.remove();
      }
    }
  }
  define("contour-command", ContourCommand);

  // Heatmap: generates cells from count attribute.
  class ContourHeatmap extends ContourBase {
    render() {
      this.classList.add("c-heatmap");
      const count = parseInt(this.getAttribute("cells") || this.getAttribute("count") || "0", 10);
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const cell = document.createElement("div");
          cell.className = "c-heatmap__cell";
          this.appendChild(cell);
        }
      }
      if (this.hasAttribute("legend")) {
        if (!this.querySelector(".c-heatmap__legend")) {
          const leg = document.createElement("div");
          leg.className = "c-heatmap__legend";
          const bar = document.createElement("div");
          bar.className = "c-heatmap__legend-bar";
          leg.appendChild(bar);
          this.appendChild(leg);
        }
      } else {
        const leg = this.querySelector(".c-heatmap__legend");
        if (leg) leg.remove();
      }
    }
  }
  define("contour-heatmap", ContourHeatmap);

  // Layer switch: generates items from attribute.
  class ContourLayerSwitch extends ContourBase {
    render() {
      this.classList.add("c-layer-switch");
      const items = this.getAttribute("items");
      if (items) {
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

  // Map area: generates attribution + scale + controls from attributes.
  class ContourMapArea extends ContourBase {
    render() {
      this.classList.add("c-map-area");
      const attribution = this.getAttribute("attribution");
      if (attribution) {
        const a = this.ensure(".c-map-area__attribution", () => { const el = document.createElement("div"); el.className = "c-map-area__attribution"; return el; });
        a.textContent = attribution;
      } else {
        const a = this.querySelector(".c-map-area__attribution");
        if (a) a.remove();
      }
      const mark = this.getAttribute("attribution-mark");
      if (mark) {
        const m = this.ensure(".c-map-area__attribution-mark", () => { const el = document.createElement("span"); el.className = "c-map-area__attribution-mark"; return el; });
        m.textContent = mark;
      } else {
        const m = this.querySelector(".c-map-area__attribution-mark");
        if (m) m.remove();
      }
      const scale = this.getAttribute("scale");
      if (scale) {
        const sc = this.ensure(".c-map-area__scale", () => { const el = document.createElement("div"); el.className = "c-map-area__scale"; return el; });
        sc.textContent = scale;
      } else {
        const sc = this.querySelector(".c-map-area__scale");
        if (sc) sc.remove();
      }
      const controls = this.getAttribute("controls");
      if (controls) {
        try {
          const parsed = JSON.parse(controls);
          const wrap = this.ensure(".c-map-area__controls", () => { const el = document.createElement("div"); el.className = "c-map-area__controls"; return el; });
          wrap.innerHTML = "";
          parsed.forEach((c) => {
            const btn = document.createElement("button");
            btn.className = "c-map-area__control";
            btn.type = "button";
            btn.textContent = typeof c === "string" ? c : (c.label || c);
            wrap.appendChild(btn);
          });
        } catch (e) { /* keep existing */ }
      } else {
        const w = this.querySelector(".c-map-area__controls");
        if (w) w.remove();
      }
    }
  }
  define("contour-map-area", ContourMapArea);

  // Map panel: generates head + body + foot from attributes.
  class ContourMapPanel extends ContourBase {
    render() {
      this.classList.add("c-map-panel");
      const title = this.getAttribute("title");
      if (title) {
        const h = this.ensure(".c-map-panel__title", () => { const el = document.createElement("h3"); el.className = "c-map-panel__title"; return el; });
        if (h.parentNode === this && this.firstChild !== h) this.prepend(h);
        h.textContent = title;
      } else {
        const h = this.querySelector(".c-map-panel__title");
        if (h) h.remove();
      }
    }
  }
  define("contour-map-panel", ContourMapPanel);

  // Map footer: generates brand + links from attributes.
  class ContourMapFooter extends ContourBase {
    render() {
      this.classList.add("c-map-footer");
      const brand = this.getAttribute("brand");
      if (brand) {
        const b = this.ensure(".c-map-footer__brand", () => { const el = document.createElement("span"); el.className = "c-map-footer__brand"; return el; });
        b.textContent = brand;
      } else {
        const b = this.querySelector(".c-map-footer__brand");
        if (b) b.remove();
      }
    }
  }
  define("contour-map-footer", ContourMapFooter);

  // Docs nav: generates groups/links from items attribute.
  class ContourDocsNav extends ContourBase {
    render() {
      this.classList.add("c-docs-nav");
      const items = this.getAttribute("items");
      if (items) {
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
              a.textContent = typeof l === "string" ? l : (l.label || l);
              ul.appendChild(a);
            });
            group.appendChild(ul);
            list.appendChild(group);
          });
        } catch (e) { /* keep existing */ }
      } else {
        const list = this.querySelector(".c-docs-nav__list");
        if (list) list.remove();
      }
    }
  }
  define("contour-docs-nav", ContourDocsNav);

  // Docs shell: generates title + lede from attributes.
  class ContourDocsShell extends ContourBase {
    render() {
      this.classList.add("c-docs-shell");
      const title = this.getAttribute("title");
      if (title) {
        const h = this.ensure(".c-docs-shell__title", () => { const el = document.createElement("h1"); el.className = "c-docs-shell__title"; return el; });
        h.textContent = title;
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
    }
  }
  define("contour-docs-shell", ContourDocsShell);

  // Footer: generates brand + note + links from attributes.
  class ContourFooter extends ContourBase {
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
    }
  }
  define("contour-footer", ContourFooter);

  // Dash shell: generates title from attribute.
  class ContourDashShell extends ContourBase {
    render() {
      this.classList.add("c-dash-shell");
      const title = this.getAttribute("title");
      if (title) {
        const h = this.ensure(".c-dash-shell__title", () => { const el = document.createElement("h1"); el.className = "c-dash-shell__title"; return el; });
        h.textContent = title;
      } else {
        const h = this.querySelector(".c-dash-shell__title");
        if (h) h.remove();
      }
    }
  }
  define("contour-dash-shell", ContourDashShell);

  // Dash toolbar: generates title + actions from attributes.
  class ContourDashToolbar extends ContourBase {
    render() {
      this.classList.add("c-dash-toolbar");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-dash-toolbar__title", () => { const el = document.createElement("span"); el.className = "c-dash-toolbar__title"; return el; });
        t.textContent = title;
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
  }
  define("contour-dash-toolbar", ContourDashToolbar);

  // Dash KPI row: simple wrapper.
  class ContourDashKpiRow extends ContourBase {
    render() { this.classList.add("c-dash-kpi-row"); }
  }
  define("contour-dash-kpi-row", ContourDashKpiRow);

  // Dash freshness: generates label + value from attributes.
  class ContourDashFreshness extends ContourBase {
    render() {
      this.classList.add("c-dash-freshness");
      const label = this.getAttribute("label");
      const value = this.getAttribute("value");
      if (label) {
        const l = this.ensure(".c-dash-freshness__label", () => { const el = document.createElement("span"); el.className = "c-dash-freshness__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-dash-freshness__label");
        if (l) l.remove();
      }
      if (value) {
        const v = this.ensure(".c-dash-freshness__value", () => { const el = document.createElement("span"); el.className = "c-dash-freshness__value"; return el; });
        v.textContent = value;
      } else {
        const v = this.querySelector(".c-dash-freshness__value");
        if (v) v.remove();
      }
    }
  }
  define("contour-dash-freshness", ContourDashFreshness);

  // Code: generates title + copy button from attributes.
  class ContourCode extends ContourBase {
    render() {
      this.classList.add("c-code");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-code__title", () => { const el = document.createElement("div"); el.className = "c-code__title"; return el; });
        if (t.parentNode === this && this.firstChild !== t) this.prepend(t);
        t.textContent = title;
      } else {
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
    }
    enhance() {
      if (this._wiredCode) return;
      this._wiredCode = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-code__copy") : null;
        if (!btn || !this.contains(btn)) return;
        const text = this.textContent;
        if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
        this.dispatchEvent(new CustomEvent("contour:copy", { detail: { text }, bubbles: true }));
      });
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
      if (yes) {
        const y = document.createElement("div");
        y.className = "c-compare__yes";
        y.textContent = yes;
        this.appendChild(y);
      }
      if (no) {
        const n = document.createElement("div");
        n.className = "c-compare__no";
        n.textContent = no;
        this.appendChild(n);
      }
      if (text) {
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
      if (label && !this.querySelector("*") && !this.textContent.trim()) this.textContent = label;
    }
  }
  define("contour-datamark", ContourDatamark);

  // Destructive hint: generates text from attribute.
  class ContourDestructiveHint extends ContourBase {
    render() {
      this.classList.add("c-destructive-hint");
      const text = this.getAttribute("text");
      if (text && !this.querySelector("*") && !this.textContent.trim()) this.textContent = text;
    }
  }
  define("contour-destructive-hint", ContourDestructiveHint);

  // Icon badge: generates icon from attribute.
  class ContourIconBadge extends ContourBase {
    render() {
      this.classList.add("c-icon-badge");
      const icon = this.getAttribute("icon");
      if (icon) {
        const existing = this.querySelector("svg");
        const svg = existing || document.createElementNS("http://www.w3.org/2000/svg", "svg");
        if (!existing) {
          svg.setAttribute("aria-hidden", "true");
          const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
          use.setAttribute("href", "#" + String(icon).replace(/[^a-zA-Z0-9_-]/g, ""));
          svg.appendChild(use);
          this.appendChild(svg);
        } else {
          const use = svg.querySelector("use");
          if (use) use.setAttribute("href", "#" + String(icon).replace(/[^a-zA-Z0-9_-]/g, ""));
        }
      } else {
        const svg = this.querySelector("svg");
        if (svg) svg.remove();
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
      if (label && !this.querySelector("*") && !this.textContent.trim()) this.textContent = label;
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
      if (quote) {
        const q = this.ensure(".c-pullquote__quote", () => { const el = document.createElement("blockquote"); el.className = "c-pullquote__quote"; return el; });
        q.textContent = quote;
      } else {
        const q = this.querySelector(".c-pullquote__quote");
        if (q) q.remove();
      }
      const name = this.getAttribute("name");
      if (name) {
        const by = this.ensure(".c-pullquote__byline", () => { const el = document.createElement("div"); el.className = "c-pullquote__byline"; return el; });
        by.textContent = name;
      } else {
        const by = this.querySelector(".c-pullquote__byline");
        if (by) by.remove();
      }
    }
  }
  define("contour-pullquote", ContourPullquote);

  // Scale bar: generates label from attribute.
  class ContourScaleBar extends ContourBase {
    render() {
      this.classList.add("c-scale-bar");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-scale-bar__label", () => { const el = document.createElement("span"); el.className = "c-scale-bar__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-scale-bar__label");
        if (l) l.remove();
      }
    }
  }
  define("contour-scale-bar", ContourScaleBar);

  // Scheme toggle: simple wrapper.
  class ContourSchemeToggle extends ContourBase {
    render() { this.classList.add("c-scheme-toggle"); }
    enhance() {
      if (this._wiredScheme) return;
      this._wiredScheme = true;
      this.addEventListener("click", () => {
        const root = document.documentElement;
        const current = root.getAttribute("data-theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        const next = current === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem("contour-theme", next); } catch (e) {}
        this.dispatchEvent(new CustomEvent("contour:theme-change", { detail: { theme: next }, bubbles: true }));
      });
      // restore persisted theme on connect
      try {
        const stored = localStorage.getItem("contour-theme");
        if (stored) document.documentElement.setAttribute("data-theme", stored);
      } catch (e) {}
    }
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
      if (title) {
        const t = document.createElement("span");
        t.className = "c-toolbar__title";
        t.textContent = title;
        this.appendChild(t);
      }
      const actions = this.getAttribute("actions");
      if (actions) {
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

  // Activity: simple wrapper.
  class ContourActivity extends ContourBase { render() { this.classList.add("c-activity"); } }
  define("contour-activity", ContourActivity);

  // Advanced: simple wrapper.
  class ContourAdvanced extends ContourBase { render() { this.classList.add("c-advanced"); } }
  define("contour-advanced", ContourAdvanced);

  // Affordance: simple wrapper.
  class ContourAffordance extends ContourBase { render() { this.classList.add("c-affordance"); } }
  define("contour-affordance", ContourAffordance);

  // Affordances: simple wrapper.
  class ContourAffordances extends ContourBase { render() { this.classList.add("c-affordances"); } }
  define("contour-affordances", ContourAffordances);

  // Anchor: generates href + label.
  class ContourAnchor extends ContourBase {
    render() {
      this.classList.add("c-anchor");
      const href = this.getAttribute("href");
      const label = this.getAttribute("label");
      if (href && label) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = label;
        this.appendChild(a);
      }
    }
  }
  define("contour-anchor", ContourAnchor);

  // App: simple wrapper.
  class ContourApp extends ContourBase { render() { this.classList.add("c-app"); } }
  define("contour-app", ContourApp);

  // App body: simple wrapper.
  class ContourAppBody extends ContourBase { render() { this.classList.add("c-app-body"); } }
  define("contour-app-body", ContourAppBody);

  // Btn group: simple wrapper.
  class ContourBtnGroup extends ContourBase { render() { this.classList.add("c-btn-group"); } }
  define("contour-btn-group", ContourBtnGroup);

  // Chart grid: simple wrapper.
  class ContourChartGrid extends ContourBase { render() { this.classList.add("c-chart-grid"); } }
  define("contour-chart-grid", ContourChartGrid);

  // Draggable: ensures role + tabindex.
  class ContourDraggable extends ContourBase {
    render() {
      this.classList.add("c-draggable");
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
    }
  }
  define("contour-draggable", ContourDraggable);

  // Drag handle: ensures role.
  class ContourDragHandle extends ContourBase {
    render() {
      this.classList.add("c-drag-handle");
      if (!this.hasAttribute("role")) this.setAttribute("role", "separator");
    }
  }
  define("contour-drag-handle", ContourDragHandle);

  // Drop indicator: simple wrapper.
  class ContourDropIndicator extends ContourBase { render() { this.classList.add("c-drop-indicator"); } }
  define("contour-drop-indicator", ContourDropIndicator);

  // Drop zone: simple wrapper.
  class ContourDropZone extends ContourBase { render() { this.classList.add("c-drop-zone"); } }
  define("contour-drop-zone", ContourDropZone);

  // Range scale: simple wrapper.
  class ContourRangeScale extends ContourBase { render() { this.classList.add("c-range-scale"); } }
  define("contour-range-scale", ContourRangeScale);

  // Resizable: simple wrapper.
  class ContourResizable extends ContourBase { render() { this.classList.add("c-resizable"); } }
  define("contour-resizable", ContourResizable);

  // Table wrap: simple wrapper.
  class ContourTableWrap extends ContourBase { render() { this.classList.add("c-table-wrap"); } }
  define("contour-table-wrap", ContourTableWrap);

  // Time range: simple wrapper.
  class ContourTimeRange extends ContourBase { render() { this.classList.add("c-time-range"); } }
  define("contour-time-range", ContourTimeRange);

  // Toast host: ensures role.
  class ContourToastHost extends ContourBase {
    render() {
      this.classList.add("c-toast-host");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
    }
  }
  define("contour-toast-host", ContourToastHost);

  // Virtual scroll: simple wrapper.
  class ContourVirtualScroll extends ContourBase { render() { this.classList.add("c-virtual-scroll"); } }
  define("contour-virtual-scroll", ContourVirtualScroll);

  // Btn: generates label from attribute.
  class ContourBtn extends ContourBase {
    render() {
      this.classList.add("c-btn");
      for (const attr of ["variant", "size", "color"]) {
        const val = this.getAttribute(attr);
        if (val) this.classList.add("c-btn--" + val);
      }
      const label = this.getAttribute("label");
      if (label && !this.querySelector("*") && !this.textContent.trim()) this.textContent = label;
    }
  }
  define("contour-btn", ContourBtn);

  // Radio list: generates from items attribute.
  class ContourRadioList extends ContourBase {
    render() {
      this.classList.add("c-radio-list");
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          parsed.forEach((it) => {
            const lbl = document.createElement("label");
            lbl.className = "c-radio";
            const input = document.createElement("input");
            input.type = "radio";
            input.name = this.getAttribute("name") || "radio-list";
            if (typeof it === "string") { input.value = it; lbl.appendChild(input); lbl.appendChild(document.createTextNode(" " + it)); }
            else { input.value = it.value || it.label; lbl.appendChild(input); const span = document.createElement("span"); span.className = "c-radio__label"; span.textContent = it.label || it.value; lbl.appendChild(span); }
            this.appendChild(lbl);
          });
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-radio-list", ContourRadioList);

  // Contour plot: simple wrapper.
  class ContourContourPlot extends ContourBase {
    render() { this.classList.add("c-contour-plot"); }
  }
  define("contour-contour-plot", ContourContourPlot);



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

// Entry point for the web-component modules. Importing this module registers
// every Contour custom element as a side effect.













})();
