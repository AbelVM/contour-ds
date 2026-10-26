import { ContourBase, define } from './core.mjs';
import { wireMenu, wirePagination, wireTabs, wireTree } from './behaviours.mjs';
class ContourMenu extends ContourBase {
    static get observed() { return ["items"]; }
    static get properties() { return { items: { attribute: "items" } }; }
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
        } catch (e) { /* keep existing content */ }
      }
    }
    enhance() {
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
      wireMenu(this);
    }
  }
  define("contour-menu", ContourMenu);
class ContourTabs extends ContourBase {
    static get observed() { return ["tabs"]; }
    static get properties() { return { tabs: { attribute: "tabs" } }; }
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
            btn.className = "c-tabs__tab";
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
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
      wireTabs(this);
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
          brandEl.href = "#";
          brandEl.innerHTML = `<span class="c-mark"><svg aria-hidden="true"><use href="#i-mark" /></svg></span>`;
          const brandName = document.createElement("span");
          brandName.className = "c-brand__name";
          brandEl.appendChild(brandName);
          inner.insertBefore(brandEl, inner.firstChild);
        }
        const brandName = brandEl.querySelector(".c-brand__name");
        if (brandName) brandName.textContent = brand;
      } else if (brandEl) {
        brandEl.remove();
      }
      // Nav
      let nav = inner.querySelector(".c-header__nav");
      if (links) {
        try {
          const parsed = JSON.parse(links);
          if (!nav) {
            nav = document.createElement("nav");
            nav.className = "c-header__nav";
            nav.setAttribute("aria-label", "Main");
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
      } else if (nav) {
        nav.remove();
      }
      // Actions slot
      if (!inner.querySelector(".c-header__actions")) {
        const actions = document.createElement("div");
        actions.className = "c-header__actions";
        const slot = document.createElement("slot");
        actions.appendChild(slot);
        inner.appendChild(actions);
      }
      if (inner.parentNode !== this) this.appendChild(inner);
    }
  }
  define("contour-header", ContourHeader);
class ContourTree extends ContourBase {
    static get observed() { return ["items"]; }
    static get properties() { return { items: { attribute: "items" } }; }
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
                row.className = "c-tree__row" + (node.active ? " c-tree__row--active" : "") + (node.dir ? " c-tree__row--dir" : "");
                row.setAttribute("aria-expanded", "false");
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
                render(node.children, li);
              } else {
                const leaf = document.createElement("div");
                leaf.className = "c-tree__leaf" + (node.active ? " c-tree__row--active" : "") + (node.dir ? " c-tree__row--dir" : "");
                if (node.indent) {
                  const ind = document.createElement("span");
                  ind.className = "c-tree__indent";
                  ind.style.inlineSize = (node.indent * 1) + "rem";
                  leaf.appendChild(ind);
                }
                leaf.appendChild(document.createTextNode(node.label || node));
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
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
      wireTree(this);
    }
  }
  define("contour-tree", ContourTree);
class ContourCodeTabs extends ContourBase {
    static get observed() { return ["tabs"]; }
    static get properties() { return { tabs: { attribute: "tabs" } }; }
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
            btn.className = "c-code-tabs__tab";
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
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
      wireTabs(this);
    }
  }
  define("contour-code-tabs", ContourCodeTabs);
class ContourBreadcrumb extends ContourBase {
    static get observed() { return ["items", "separator"]; }
    static get properties() { return { items: { attribute: "items" }, separator: { attribute: "separator" } }; }
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
          const sep = this.getAttribute("separator") || "/";
          parsed.forEach((item, i) => {
            const li = document.createElement("li");
            if (i < parsed.length - 1) {
              const a = document.createElement("a");
              a.href = item.href || "#";
              a.textContent = item.label || item;
              li.appendChild(a);
              const s = document.createElement("span");
              s.className = "c-breadcrumb__sep";
              s.setAttribute("aria-hidden", "true");
              s.textContent = sep;
              li.appendChild(s);
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
class ContourPagination extends ContourBase {
    static get observed() { return ["pages", "current"]; }
    static get properties() { return { pages: { attribute: "pages" }, current: { attribute: "current" } }; }
    render() {
      this.classList.add("c-pagination");
      // Drop previously generated links so a re-render cannot stack a second set.
      Array.from(this.querySelectorAll(".c-pagination__link")).forEach((n) => n.remove());
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
          }
          this.appendChild(btn);
        }
      }
    }
    enhance() {
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
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
    static get observed() { return ["title", "items"]; }
    static get properties() { return { title: { attribute: "title" }, items: { attribute: "items" } }; }
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
class ContourFilterBar extends ContourBase {
    static get observed() { return ["label", "divider", "placeholder", "items", "empty"]; }
    static get properties() { return { label: { attribute: "label" }, divider: { attribute: "divider" }, placeholder: { attribute: "placeholder" }, items: { attribute: "items" }, empty: { attribute: "empty" } }; }
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
  class ContourCommand extends ContourBase {
    static get observed() { return ["placeholder", "items", "empty"]; }
    static get properties() { return { placeholder: { attribute: "placeholder" }, items: { attribute: "items" }, empty: { attribute: "empty" } }; }
    render() {
      this.classList.add("c-command");
      if (!this.hasAttribute("popover")) this.setAttribute("popover", "auto");
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
            if (it.group) {
              const group = document.createElement("div");
              group.className = "c-command__group";
              const gt = document.createElement("div");
              gt.className = "c-command__group-title";
              gt.textContent = it.group;
              group.appendChild(gt);
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
              group.appendChild(item);
              list.appendChild(group);
            } else {
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
            }
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
    enhance() {
      if (this._wiredCommand) return;
      this._wiredCommand = true;
      const input = () => this.querySelector(".c-command__input");
      const items = () => Array.from(this.querySelectorAll(".c-command__item"));
      let cursor = -1;
      const mark = () => items().forEach((it, i) => it.classList.toggle("c-command__item--active", i === cursor));
      this.addEventListener("keydown", (e) => {
        const inp = input();
        if (!inp || e.target !== inp) return;
        const its = items();
        if (!its.length) return;
        if (e.key === "ArrowDown") { e.preventDefault(); cursor = Math.min(cursor + 1, its.length - 1); mark(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); cursor = Math.max(cursor - 1, 0); mark(); }
        else if (e.key === "Enter") {
          e.preventDefault();
          if (cursor >= 0 && its[cursor]) {
            its[cursor].click();
            this.dispatchEvent(new CustomEvent("contour:select", { detail: { index: cursor, label: its[cursor].textContent.trim() }, bubbles: true, composed: true }));
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
    }
  }
  define("contour-command", ContourCommand);
class ContourFooter extends ContourBase {
    static get observed() { return ["brand", "note", "links", "cols"]; }
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
              const h = document.createElement("h3");
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
    render() { this.classList.add("c-sidebar"); }
  }
  define("contour-sidebar", ContourSidebar);
class ContourToolbar extends ContourBase {
    static get observed() { return ["title", "actions"]; }
    static get properties() { return { title: { attribute: "title" }, actions: { attribute: "actions" } }; }
    render() {
      this.classList.add("c-toolbar");
      const title = this.getAttribute("title");
      // `.c-toolbar` defines exactly one part, `__btn`, and the guide names the
      // container through ARIA. A title node carried a class the sheet never had.
      this.setAttribute("role", "toolbar");
      if (title) this.setAttribute("aria-label", title);
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
