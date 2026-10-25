import { ContourBase, define } from './00-core.mjs';
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

