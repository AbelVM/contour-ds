import { ContourBase, define } from './core.mjs';
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
      // Click to select
      this.addEventListener("click", (e) => {
        const item = e.target && e.target.closest ? e.target.closest("[role='menuitem']") : null;
        if (!item || !this.contains(item)) return;
        const its = items();
        const idx = its.indexOf(item);
        if (idx >= 0) {
          this.dispatchEvent(new CustomEvent("contour:select", { detail: { index: idx, label: item.textContent }, bubbles: true }));
        }
      });
    }
  }
  define("contour-menu", ContourMenu);
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
      const toggleNode = (toggle) => {
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
        this.dispatchEvent(new CustomEvent("contour:toggle", { detail: { open: !expanded, label: (row ? row.textContent.trim() : "") }, bubbles: true }));
      };
      this.addEventListener("click", (e) => {
        const toggle = e.target && e.target.closest ? e.target.closest(".c-tree__toggle") : null;
        if (!toggle || !this.contains(toggle)) return;
        e.stopPropagation();
        toggleNode(toggle);
      });
      // Keyboard navigation
      const visibleNodes = () => {
        const result = [];
        const walk = (ul) => {
          if (!ul) return;
          Array.from(ul.children).forEach((li) => {
            if (!li.classList.contains("c-tree__node")) return;
            result.push(li);
            const children = li.querySelector(":scope > .c-tree__children");
            if (children && !children.hasAttribute("hidden")) walk(children);
          });
        };
        const root = this.querySelector("ul.c-tree, ul[role='tree']") || this.querySelector("ul");
        walk(root);
        return result;
      };
      const focusNode = (li) => {
        const toggle = li.querySelector(":scope > .c-tree__row .c-tree__toggle");
        const leaf = li.querySelector(":scope > .c-tree__leaf");
        const target = toggle || leaf;
        if (target) { try { target.focus(); } catch (e) {} }
        // make focusable
        if (target && !target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      };
      this.addEventListener("keydown", (e) => {
        const target = e.target && e.target.closest ? e.target.closest(".c-tree__toggle, .c-tree__leaf") : null;
        if (!target || !this.contains(target)) return;
        const nodes = visibleNodes();
        const currentLi = target.closest(".c-tree__node");
        const idx = nodes.indexOf(currentLi);
        let next = -1;
        if (e.key === "ArrowDown") next = idx < 0 ? 0 : Math.min(idx + 1, nodes.length - 1);
        else if (e.key === "ArrowUp") next = idx < 0 ? nodes.length - 1 : Math.max(idx - 1, 0);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = nodes.length - 1;
        if (next >= 0 && next !== idx) {
          e.preventDefault();
          focusNode(nodes[next]);
          return;
        }
        if (e.key === "ArrowRight") {
          const toggle = currentLi ? currentLi.querySelector(":scope > .c-tree__row .c-tree__toggle") : null;
          if (toggle) {
            const expanded = toggle.getAttribute("aria-expanded") === "true";
            if (!expanded) { e.preventDefault(); toggleNode(toggle); }
            else {
              const children = currentLi.querySelector(":scope > .c-tree__children");
              if (children) {
                const firstChild = children.querySelector(":scope > .c-tree__node");
                if (firstChild) { e.preventDefault(); focusNode(firstChild); }
              }
            }
          }
          return;
        }
        if (e.key === "ArrowLeft") {
          const toggle = currentLi ? currentLi.querySelector(":scope > .c-tree__row .c-tree__toggle") : null;
          if (toggle) {
            const expanded = toggle.getAttribute("aria-expanded") === "true";
            if (expanded) { e.preventDefault(); toggleNode(toggle); }
            else {
              const parent = currentLi.parentElement && currentLi.parentElement.closest ? currentLi.parentElement.closest(".c-tree__node") : null;
              if (parent) { e.preventDefault(); focusNode(parent); }
            }
          } else {
            const parent = currentLi && currentLi.parentElement ? currentLi.parentElement.closest(".c-tree__node") : null;
            if (parent) { e.preventDefault(); focusNode(parent); }
          }
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          const toggle = currentLi ? currentLi.querySelector(":scope > .c-tree__row .c-tree__toggle") : null;
          if (toggle) { e.preventDefault(); toggleNode(toggle); }
          return;
        }
      });
      // Make toggles and leaves focusable
      this.querySelectorAll(".c-tree__toggle, .c-tree__leaf").forEach((el) => {
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      });
    }
  }
  define("contour-tree", ContourTree);
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
class ContourSidebar extends ContourBase {
    render() { this.classList.add("c-sidebar"); }
  }
  define("contour-sidebar", ContourSidebar);
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
