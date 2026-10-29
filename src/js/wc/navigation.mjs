import { ContourBase, define, onDispose, supportsUntilFound, contourId } from './core.mjs';
import { loadRemote, remoteData, renderStates, renderEmpty, wireStates } from './states.mjs';
import { wireMenu, wirePagination, wireTabs, wireTree, wireRemovable } from './behaviours.mjs';
class ContourMenu extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-menu");
      if (!this.hasAttribute("role")) this.setAttribute("role", "menu");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "menu")) return;
      const items = remoteData(this, "items");
      // Slot composition wins over the JSON attribute.
       const authored = Array.from(this.children).filter((n) => !n.classList || !n.classList.contains("c-menu"));
       if (authored.length) {
         if (this.querySelector("ul.c-menu")) return;
         const ul = document.createElement("ul");
         ul.className = "c-menu";
         ul.setAttribute("role", "menu");
         this.appendChild(ul);
         return;
       }
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
             } else if (item.group) {
               const li = document.createElement("li");
               li.className = "c-menu__group";
               li.setAttribute("role", "group");
               if (item.group) li.setAttribute("aria-label", String(item.group));
               const hdr = document.createElement("div");
               hdr.className = "c-menu__group-label";
               hdr.textContent = String(item.group);
               li.appendChild(hdr);
               if (Array.isArray(item.items)) {
                 const sub = document.createElement("ul");
                 sub.className = "c-menu";
                 sub.setAttribute("role", "menu");
                 item.items.forEach((subItem) => {
                   const sli = document.createElement("li");
                   sli.className = "c-menu__item" + (subItem.danger ? " c-menu__item--danger" : "") + (subItem.disabled ? " c-menu__item--disabled" : "");
                   sli.setAttribute("role", "menuitem");
                   if (subItem.disabled) sli.setAttribute("aria-disabled", "true");
                   if (subItem.label || subItem.title) {
                     const lbl = document.createElement("span");
                     lbl.className = "c-menu__label";
                     lbl.textContent = subItem.label || subItem.title || "";
                     sli.appendChild(lbl);
                   }
                   sub.appendChild(sli);
                 });
                 li.appendChild(sub);
               }
               ul.appendChild(li);
             } else {
               const li = document.createElement("li");
               li.className = "c-menu__item" + (item.danger ? " c-menu__item--danger" : "") + (item.disabled ? " c-menu__item--disabled" : "");
               li.setAttribute("role", "menuitem");
               if (item.disabled) li.setAttribute("aria-disabled", "true");
               if (item.items && Array.isArray(item.items)) {
                 li.setAttribute("aria-haspopup", "menu");
                 li.setAttribute("aria-expanded", "false");
               }
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
         } catch (e) { /* keep existing */ }
       } else {
         renderEmpty(this, "menu");
       }
    }
    enhance() {
      wireMenu(this);
    }
  }
define("contour-menu", ContourMenu);
class ContourTabs extends ContourBase {
    static get observed() { return ["tabs", "autoplay", "pause", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "persist"]; }
    static get properties() { return { tabs: { attribute: "tabs" }, autoplay: { attribute: "autoplay", type: Number }, pause: { attribute: "pause", type: Boolean }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-tabs");
      wireStates(this);
      loadRemote(this, "tabs");
      if (renderStates(this, "tabs")) return;
      const tabs = remoteData(this, "tabs");
      // Slot composition wins over the JSON attribute, same as ContourMenu:
      // authored tab buttons and panels stay across re-renders and the
      // JSON scaffolding only fills in when the host is empty.
      const authored = Array.from(this.children).filter((n) => !n.classList || !n.classList.contains("c-tabs__list"));
      if (tabs && !authored.length) {
         try {
           const parsed = JSON.parse(tabs);
            const list = this.ensure(".c-tabs__list", () => { const el = document.createElement("div"); el.className = "c-tabs__list"; el.setAttribute("role", "tablist"); return el; });
            list.setAttribute("role", "tablist");
            list.innerHTML = "";
            // Remove any previously generated panels so re-render doesn't stack.
            Array.from(this.querySelectorAll(".c-tabs__panel")).forEach((n) => n.remove());
            parsed.forEach((t, i) => {
              const label = typeof t === "string" ? t : (t.label || t.title || "");
              const panelId = contourId("c-tabs-panel");
              const btn = document.createElement("button");
              btn.className = "c-tabs__tab";
              btn.setAttribute("role", "tab");
              btn.setAttribute("aria-selected", String(i === 0));
              btn.setAttribute("aria-controls", panelId);
              btn.tabIndex = i === 0 ? 0 : -1;
              btn.textContent = label;
              list.appendChild(btn);
              const panel = document.createElement("div");
              panel.className = "c-tabs__panel";
              panel.id = panelId;
              panel.setAttribute("role", "tabpanel");
              if (typeof t === "object" && t !== null && t.content !== undefined) {
                panel.textContent = String(t.content);
              }
              if (i !== 0) panel.hidden = true;
              this.appendChild(panel);
            });
            if (list.parentNode !== this) this.prepend(list);
         } catch (e) { /* keep existing */ }
        } else if (!tabs && !authored.length) {
          const list = this.querySelector(".c-tabs__list");
          if (list) list.remove();
          renderEmpty(this, "tabs");
        }
     }
    enhance() {
      wireTabs(this);
      // Tabs autoplay (BY-29). Mirrors the streaming chart's interval contract
      // (data.mjs): `autoplay` (seconds) advances the selection, `pause` stops
      // it, the timer is owned once and disposed with the host, and the whole
      // thing is gated on reduced motion. The advance is a click on the next
      // tab, so wireTabs' own listener performs the activation and emits the
      // manifest's contour:tab-change — this component never re-emits what its
      // wiring already announced. Hover and focus also stop the loop (WCAG
      // 2.2.2: auto-updating content needs a mechanism to pause, stop or hide;
      // the pause attribute is the explicit one, hover/focus the implicit two).
      const sync = () => {
        const seconds = parseFloat(this.getAttribute("autoplay") || "");
        const paused = this.hasAttribute("pause") || this._tabsHover || this._tabsFocus;
        const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
        const want = Number.isFinite(seconds) && seconds > 0 && !paused && !reduced;
        if (want === this._tabsAutoplayRunning) return;
        this._tabsAutoplayRunning = want;
        if (this._tabsTimer !== undefined) { clearInterval(this._tabsTimer); this._tabsTimer = undefined; }
        if (!want) return;
        this._tabsTimer = setInterval(() => {
          if (!this.isConnected || this.hasAttribute("pause") || this._tabsHover || this._tabsFocus) return;
          const list = this.querySelector(".c-tabs__list");
          const tabs = list ? Array.from(list.querySelectorAll("[role='tab']")) : [];
          if (!tabs.length) return;
          const cur = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
          const next = tabs[(cur + 1) % tabs.length];
          if (next) next.click();
        }, Math.max(1000, seconds * 1000));
      };
      // Re-run on every render so autoplay/pause attribute changes are picked
      // up; the listeners and the disposer are installed exactly once.
      sync();
      if (this._wiredTabsAutoplay) return;
      this._wiredTabsAutoplay = true;
      this.addEventListener("pointerenter", () => { this._tabsHover = true; sync(); });
      this.addEventListener("pointerleave", () => { this._tabsHover = false; sync(); });
      this.addEventListener("focusin", () => { this._tabsFocus = true; sync(); });
      this.addEventListener("focusout", () => { this._tabsFocus = false; sync(); });
      onDispose(this, () => { if (this._tabsTimer !== undefined) { clearInterval(this._tabsTimer); this._tabsTimer = undefined; } });
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
          brandEl.setAttribute("data-contour-generated", "");
          brandEl.href = "#";
          brandEl.innerHTML = `<span class="c-mark"><svg aria-hidden="true"><use href="#i-mark" /></svg></span>`;
          const brandName = document.createElement("span");
          brandName.className = "c-brand__name";
          brandEl.appendChild(brandName);
          inner.insertBefore(brandEl, inner.firstChild);
        }
        const brandName = brandEl.querySelector(".c-brand__name");
        if (brandName) brandName.textContent = brand;
      } else if (brandEl && brandEl.hasAttribute("data-contour-generated")) {
        brandEl.remove();
      }
      // Nav
      let nav = inner.querySelector(".c-header__nav");
      const authoredNav = nav ? Array.from(nav.children).filter((n) => n.tagName === "A") : [];
      if (links && !authoredNav.length) {
        try {
          const parsed = JSON.parse(links);
          if (!nav) {
            nav = document.createElement("nav");
            nav.className = "c-header__nav";
            nav.setAttribute("aria-label", "Main");
            nav.setAttribute("data-contour-generated", "");
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
      } else if (links && authoredNav.length) {
        // authored nav wins; keep it
      } else if (nav && !links && !authoredNav.length && nav.hasAttribute("data-contour-generated")) {
        nav.remove();
      }
      // Actions container
      if (!inner.querySelector(".c-header__actions")) {
        const actions = document.createElement("div");
        actions.className = "c-header__actions";
        inner.appendChild(actions);
      }
      // Mobile toggle (BY-29). Below 60rem the sheet hides .c-header__nav with
      // no way to open it; the toggle is the way. It is created only when a nav
      // exists, controls that nav by id, and starts closed so the first paint
      // matches the closed CSS state. It rides inside .c-header__actions so the
      // group's margin-inline-start:auto keeps it at the far right under 60rem.
      // `i-grid` stands in for a hamburger: the sprite ships no i-menu symbol
      // (index.html is the guide's own, and a dead <use> would be a defect), so
      // the closest existing menu-like glyph is used with the real label.
      const navEl = inner.querySelector(".c-header__nav");
      if (navEl) {
        if (!navEl.id) navEl.id = "contour-header-nav";
        const actions = inner.querySelector(".c-header__actions");
        if (actions && !actions.querySelector(".c-header__toggle")) {
          const toggle = document.createElement("button");
          toggle.type = "button";
          toggle.className = "c-header__toggle";
          toggle.setAttribute("aria-label", "Toggle navigation");
          toggle.setAttribute("aria-expanded", "false");
          toggle.setAttribute("aria-controls", navEl.id);
          toggle.innerHTML = '<svg aria-hidden="true"><use href="#i-grid" /></svg>';
          actions.appendChild(toggle);
        }
      }
      if (inner.parentNode !== this) this.appendChild(inner);
    }
    enhance() {
      if (this._wiredHeader) return;
      this._wiredHeader = true;
      // Scroll state (BY-29): past a small threshold the header gains
      // c-header--scrolled so the sheet can raise it above the page.
      const update = () => {
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        this.classList.toggle("c-header--scrolled", y > 8);
      };
      update();
      window.addEventListener("scroll", update, { passive: true });
      onDispose(this, () => window.removeEventListener("scroll", update));
      // Toggle: the button shows/hides the nav under 60rem and keeps
      // aria-expanded in step. Close on Escape while open.
      this.addEventListener("click", (e) => {
        const toggle = e.target && e.target.closest ? e.target.closest(".c-header__toggle") : null;
        if (!toggle || !this.contains(toggle)) return;
        const nav = this.querySelector("#" + CSS.escape(toggle.getAttribute("aria-controls") || ""));
        if (!nav) return;
        const open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      this.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        const toggle = this.querySelector(".c-header__toggle");
        const nav = toggle && this.querySelector("#" + CSS.escape(toggle.getAttribute("aria-controls") || ""));
        if (!toggle || !nav || !nav.classList.contains("is-open")) return;
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    }
  }
  define("contour-header", ContourHeader);
class ContourTree extends ContourBase {
    static get observed() { return ["items", "virtual", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "persist"]; }
    static get properties() { return { items: { attribute: "items" }, src: { attribute: "src" } }; }
render() {
       this.classList.add("c-tree");
       // Slot composition wins over the JSON attribute, same as ContourMenu:
       // an authored tree is preserved across re-renders instead of being
       // rebuilt from `items` and losing whatever the reader put in it.
        const authored = Array.from(this.children).filter((n) => !n.classList || !n.classList.contains("c-tree"));
        wireStates(this);
        loadRemote(this, "items");
        if (renderStates(this, "tree")) return;
        const items = remoteData(this, "items");
        if (items && !authored.length) {
         try {
           const parsed = JSON.parse(items);
            const rootUl = this.ensure("div.c-tree", () => { const el = document.createElement("div"); el.className = "c-tree"; el.setAttribute("role", "tree"); return el; });
           rootUl.innerHTML = "";
           rootUl.className = "c-tree";
           const render = (nodes, parent) => {
              const ul = parent ? document.createElement("div") : rootUl;
              if (parent) {
                ul.className = "c-tree__children";
                ul.setAttribute("role", "group");
                if (supportsUntilFound()) ul.setAttribute("hidden", "until-found"); else ul.setAttribute("hidden", "");
              }
             nodes.forEach((node) => {
              const li = document.createElement("div");
              li.className = "c-tree__node";
              li.setAttribute("role", "treeitem");
               if (node.children) {
                  li.setAttribute("aria-expanded", "false");
                  const row = document.createElement("div");
                  row.className = "c-tree__row" + (node.active ? " c-tree__row--active" : "") + (node.dir ? " c-tree__row--dir" : "");
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
                if (this.hasAttribute("selectable")) {
                   const cb = document.createElement("input");
                   cb.type = "checkbox";
                   cb.className = "c-tree__select";
                   cb.setAttribute("aria-label", "Select " + (node.label || node));
                   leaf.insertBefore(cb, leaf.firstChild);
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
           if (this.hasAttribute("virtual")) {
             rootUl.style.maxHeight = rootUl.style.maxHeight || "24rem";
             rootUl.style.overflow = "auto";
             rootUl.querySelectorAll(".c-tree__node").forEach((n) => {
               n.style.contentVisibility = "auto";
               n.style.containIntrinsicSize = "auto 1.5rem";
             });
           }
           if (rootUl.parentNode !== this) this.appendChild(rootUl);
        } catch (e) { /* keep existing */ }
      } else if (!items && !authored.length) {
        renderEmpty(this, "tree");
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
    static get observed() { return ["tabs", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "persist"]; }
    static get properties() { return { tabs: { attribute: "tabs" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-code-tabs");
      wireStates(this);
      loadRemote(this, "tabs");
      if (renderStates(this, "code-tabs")) return;
      const tabs = remoteData(this, "tabs");
      const list = this.querySelector(".c-code-tabs__list");
      const authored = list ? Array.from(list.children).filter((n) => n.getAttribute && n.getAttribute("role") === "tab") : [];
      if (tabs && !authored.length) {
        try {
          const parsed = JSON.parse(tabs);
           const l = this.ensure(".c-code-tabs__list", () => { const el = document.createElement("div"); el.className = "c-code-tabs__list"; el.setAttribute("role", "tablist"); return el; });
           l.setAttribute("role", "tablist");
           l.innerHTML = "";
           Array.from(this.querySelectorAll(".c-code-tabs__panel")).forEach((n) => n.remove());
           parsed.forEach((t, i) => {
             const label = typeof t === "string" ? t : (t.label || t.title || "");
             const panelId = contourId("c-code-tabs-panel");
             const btn = document.createElement("button");
             btn.className = "c-code-tabs__tab";
             btn.setAttribute("role", "tab");
             btn.setAttribute("aria-selected", String(i === 0));
             btn.setAttribute("aria-controls", panelId);
             btn.tabIndex = i === 0 ? 0 : -1;
             btn.textContent = label;
             l.appendChild(btn);
             const panel = document.createElement("div");
             panel.className = "c-code-tabs__panel";
             panel.id = panelId;
             panel.setAttribute("role", "tabpanel");
             if (typeof t === "object" && t !== null && t.content !== undefined) {
               panel.textContent = String(t.content);
             }
             if (i !== 0) panel.hidden = true;
             this.appendChild(panel);
           });
           if (l.parentNode !== this) this.prepend(l);
        } catch (e) { /* keep existing */ }
      } else if (!tabs && list) {
        list.remove();
        renderEmpty(this, "code-tabs");
      } else if (!tabs && !list) {
        renderEmpty(this, "code-tabs");
      }
    }
    enhance() {
      wireTabs(this);
    }
  }
define("contour-code-tabs", ContourCodeTabs);
class ContourBreadcrumb extends ContourBase {
    static get observed() { return ["items", "separator", "max", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, separator: { attribute: "separator" }, max: { attribute: "max", type: Number }, src: { attribute: "src" } } };
    render() {
      this.classList.add("c-breadcrumb");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "breadcrumb")) return;
      const items = remoteData(this, "items");
      // Slot composition: authored <li> items win over the JSON attribute.
      const nav = this.querySelector("nav");
      const ol = nav ? nav.querySelector("ol") : null;
      const authored = ol ? Array.from(ol.children).filter((n) => n.tagName === "LI") : [];
      if (items && !authored.length) {
        try {
          const parsed = JSON.parse(items);
          const n = this.ensure("nav", () => { const el = document.createElement("nav"); el.setAttribute("aria-label", "Breadcrumb"); el.id = "contour-breadcrumb-list"; return el; });
          n.setAttribute("aria-label", "Breadcrumb");
          n.id = "contour-breadcrumb-list";
          n.innerHTML = "";
          const sep = this.getAttribute("separator") || "/";
          const max = this._overflowExpanded ? null : this.max;
          const shown = Number.isFinite(max) && max > 1 && parsed.length > max
            ? parsed.slice(-max)
            : parsed;
          if (Number.isFinite(max) && max > 1 && parsed.length > max) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "c-breadcrumb__overflow";
            btn.setAttribute("aria-label", `Show ${parsed.length - shown.length + 1} more items`);
            btn.setAttribute("aria-expanded", "false");
            btn.setAttribute("aria-controls", "contour-breadcrumb-list");
            btn.textContent = "…";
            btn.addEventListener("click", () => {
              // A handler-owned property, not an attribute: flipping a
              // self-observed attribute from a handler would re-enter render
              // (the arm-7 trap), so the flag lives outside OBSERVED.
              this._overflowExpanded = true;
              this.requestRender();
            });
            n.appendChild(btn);
          }
          shown.forEach((item, i) => {
            if (i < shown.length - 1) {
              const a = document.createElement("a");
              a.href = item.href || "#";
              a.textContent = item.label || item;
              n.appendChild(a);
              const s = document.createElement("span");
              s.className = "c-breadcrumb__sep";
              s.setAttribute("aria-hidden", "true");
              s.textContent = sep;
              n.appendChild(s);
            } else {
              const span = document.createElement("span");
              span.textContent = item.label || item;
              span.setAttribute("aria-current", "page");
              n.appendChild(span);
            }
          });
        } catch (e) { /* keep existing */ }
       } else if (!items && nav) {
         nav.remove();
       } else if (!items && !nav) {
         renderEmpty(this, "breadcrumb");
       }
    }
  }
define("contour-breadcrumb", ContourBreadcrumb);
class ContourPagination extends ContourBase {
    static get observed() { return ["pages", "current", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "persist"]; }
    static get properties() { return { pages: { attribute: "pages" }, current: { attribute: "current" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-pagination");
      wireStates(this);
      loadRemote(this, "pages");
      if (renderStates(this, "pagination")) return;
      const pages = remoteData(this, "pages");
      // Drop previously generated links so a re-render cannot stack a second set.
      Array.from(this.querySelectorAll(".c-pagination__link")).forEach((n) => n.remove());
      let currentAttr = this.getAttribute("current") || "1";
      if (this.getAttribute("persist") === "storage" && this.id) {
        try { const stored = localStorage.getItem("contour-pagination:" + this.id); if (stored !== null) currentAttr = stored; } catch (e) {}
      } else if (this.getAttribute("persist") === "url") {
        try { const v = new URLSearchParams(window.location.search).get("c-pagination"); if (v !== null) currentAttr = v; } catch (e) {}
      }
      const current = parseInt(currentAttr, "10") || 1;
      if (pages) {
        let count = parseInt(pages, 10);
        if (!Number.isFinite(count) || count < 1) {
          try { const p = JSON.parse(pages); if (Array.isArray(p)) count = p.length; } catch (e) {}
        }
        // Prev button.
        const prev = document.createElement("button");
        prev.type = "button";
        prev.className = "c-pagination__link c-pagination__prev";
        prev.setAttribute("data-action", "prev");
        prev.textContent = "‹";
        prev.setAttribute("aria-label", "Previous page");
        this.appendChild(prev);
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
        // Next button.
        const next = document.createElement("button");
        next.type = "button";
        next.className = "c-pagination__link c-pagination__next";
        next.setAttribute("data-action", "next");
        next.textContent = "›";
        next.setAttribute("aria-label", "Next page");
        this.appendChild(next);
      } else {
        renderEmpty(this, "pagination");
      }
    }
    enhance() {
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
    static get observed() { return ["title", "items", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { title: { attribute: "title" }, items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-toc");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "toc")) return;
      const items = remoteData(this, "items");
      const title = this.getAttribute("title") || "On this page";
      const titleEl = this.ensure(".c-toc__title", () => { const el = document.createElement("div"); el.className = "c-toc__title"; return el; });
      titleEl.textContent = title;
      const list = this.querySelector(".c-toc__list");
      const authored = list ? Array.from(list.children).filter((n) => n.tagName === "A") : [];
      if (items && !authored.length) {
        try {
          const parsed = JSON.parse(items);
          const l = this.ensure(".c-toc__list", () => { const el = document.createElement("nav"); el.className = "c-toc__list"; return el; });
          l.className = "c-toc__list";
          l.setAttribute("aria-label", title);
          l.innerHTML = "";
          parsed.forEach((item) => {
            const a = document.createElement("a");
            a.className = "c-toc__link" + (item.sub ? " c-toc__link--sub" : "");
            a.href = item.href || "#";
            a.textContent = item.label || item;
            if (item.current) a.setAttribute("aria-current", "true");
            l.appendChild(a);
          });
        } catch (e) { /* keep existing */ }
      } else if (!items && list) {
        list.remove();
        renderEmpty(this, "toc");
      } else if (!items && !list) {
        renderEmpty(this, "toc");
      }
    }
    enhance() {
      // Scroll-spy (BY-29). The toc links point at page sections by href; when
      // IntersectionObserver exists, the section currently in the reading band
      // marks its link aria-current="true" and clears the rest. The shipped CSS
      // already styles .c-toc__link[aria-current="true"], so the hook needs no
      // new rule. Enhancement-only: without IntersectionObserver the links stay
      // as rendered, with author-provided aria-current left untouched.
      if (this._wiredTocSpy) return;
      if (typeof IntersectionObserver !== "function") return;
      const links = () => Array.from(this.querySelectorAll(".c-toc__link"));
      const targets = links()
        .map((a) => {
          const href = a.getAttribute("href") || "";
          if (!href.startsWith("#") || href.length < 2) return null;
          return document.getElementById(href.slice(1));
        })
        .filter(Boolean);
      if (!targets.length) return;
      this._wiredTocSpy = true;
      const spy = new IntersectionObserver((entries) => {
        const visible = entries.filter((en) => en.isIntersecting).map((en) => en.target.id);
        if (!visible.length) return;
        const top = visible[0];
        links().forEach((a) => {
          const href = a.getAttribute("href") || "";
          const isCurrent = href === "#" + top;
          if (isCurrent && a.getAttribute("aria-current") !== "true") a.setAttribute("aria-current", "true");
          else if (!isCurrent && a.hasAttribute("aria-current")) a.removeAttribute("aria-current");
        });
      }, { rootMargin: "0px 0px -60% 0px", threshold: 0 });
      targets.forEach((t) => spy.observe(t));
      onDispose(this, () => spy.disconnect());
      // Smooth scroll on link click (F-23).
      if (!this._wiredTocScroll) {
        this._wiredTocScroll = true;
        this.addEventListener("click", (e) => {
          const a = e.target && e.target.closest ? e.target.closest(".c-toc__link") : null;
          if (!a || !this.contains(a)) return;
          const href = a.getAttribute("href") || "";
          if (!href.startsWith("#") || href.length < 2) return;
          const target = document.getElementById(href.slice(1));
          if (!target) return;
          e.preventDefault();
          try { target.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (err) { target.scrollIntoView(); }
        });
      }
    }
  }
define("contour-toc", ContourTocFull);
class ContourFilterBar extends ContourBase {
    static get observed() { return ["label", "divider", "items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, divider: { attribute: "divider" }, items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-filter-bar");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "filter-bar")) return;
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
      // Render filter pills from items.
      Array.from(this.querySelectorAll(".c-filter-pill")).forEach((n) => n.remove());
      const items = remoteData(this, "items");
      let parsed = null;
      if (items) { try { parsed = JSON.parse(items); } catch (e) { parsed = null; } }
      if (Array.isArray(parsed)) {
        parsed.forEach((it) => {
          const pill = document.createElement("span");
          pill.className = "c-filter-pill";
          const txt = typeof it === "string" ? it : (it.label || it.value || "");
          pill.textContent = txt;
          if (typeof it === "object" && it !== null && it.removable !== false) {
            const btn = document.createElement("button");
            btn.className = "c-filter-pill__remove";
            btn.type = "button";
            btn.setAttribute("aria-label", "Remove " + txt);
            btn.textContent = "×";
            pill.appendChild(btn);
          }
          this.appendChild(pill);
        });
      }
      if (!parsed && !label) renderEmpty(this, "filter-bar");
    }
    enhance() {
      wireRemovable(this);
    }
  }
  define("contour-filter-bar", ContourFilterBar);
  class ContourCommand extends ContourBase {
    static get observed() { return ["placeholder", "items", "recent", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { placeholder: { attribute: "placeholder" }, items: { attribute: "items" }, recent: { attribute: "recent" }, empty: { attribute: "empty" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-command");
      if (!this.hasAttribute("popover")) this.setAttribute("popover", "auto");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "command")) return;
      const placeholder = this.getAttribute("placeholder") || "Search…";
       const input = this.ensure(".c-command__input", () => { const el = document.createElement("input"); el.className = "c-command__input"; el.type = "text"; return el; });
       input.type = "text";
       input.placeholder = placeholder;
       input.setAttribute("aria-label", "Command");
       input.setAttribute("role", "combobox");
       input.setAttribute("aria-autocomplete", "list");
       input.setAttribute("aria-expanded", "true");
       const list = this.querySelector(".c-command__list");
       if (list && !list.id) list.id = contourId("c-command-list");
       if (list && list.id) input.setAttribute("aria-controls", list.id);
       const items = remoteData(this, "items");
       const list2 = this.querySelector(".c-command__list");
       const authored = list2 ? Array.from(list2.children).filter((n) => n.classList && n.classList.contains("c-command__item") || n.classList && n.classList.contains("c-command__group")) : [];
      if (items && !authored.length) {
        try {
          const parsed = JSON.parse(items);
           const l = this.ensure(".c-command__list", () => { const el = document.createElement("div"); el.className = "c-command__list"; el.setAttribute("role", "listbox"); el.id = contourId("c-command-list"); return el; });
          l.setAttribute("role", "listbox");
          l.innerHTML = "";
          const recentRaw = this.getAttribute("recent");
          if (recentRaw) {
            try {
              const recentParsed = JSON.parse(recentRaw);
              const group = document.createElement("div");
              group.className = "c-command__group";
              const gt = document.createElement("div");
              gt.className = "c-command__group-title";
              gt.textContent = "Recent";
              group.appendChild(gt);
              recentParsed.forEach((it) => {
                const item = document.createElement("div");
                item.className = "c-command__item";
                item.setAttribute("role", "option");
                const body = document.createElement("div");
                body.className = "c-command__item-body";
                const t = document.createElement("div");
                t.className = "c-command__item-title";
                t.textContent = typeof it === "string" ? it : (it.title || it.label || "");
                body.appendChild(t);
                item.appendChild(body);
                group.appendChild(item);
              });
              l.appendChild(group);
            } catch (e) { /* skip */ }
          }
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
              item.setAttribute("role", "option");
              if (it.icon) {
                const ic = document.createElement("span");
                ic.className = "c-command__item-icon";
                ic.textContent = it.icon;
                item.appendChild(ic);
              }
              const body = document.createElement("div");
              body.className = "c-command__item-body";
              if (it.title || it.label) {
                const t = document.createElement("div");
                t.className = "c-command__item-title";
                t.textContent = it.title || it.label;
                body.appendChild(t);
              }
              if (it.hint) {
                const h = document.createElement("span");
                h.className = "c-command__item-hint";
                h.textContent = it.hint;
                body.appendChild(h);
              }
              if (it.shortcut) {
                const sc = document.createElement("kbd");
                sc.className = "c-command__item-shortcut";
                sc.textContent = it.shortcut;
                item.appendChild(sc);
              }
              item.appendChild(body);
              group.appendChild(item);
              l.appendChild(group);
            } else {
              const item = document.createElement("div");
              item.className = "c-command__item";
              item.setAttribute("role", "option");
              if (it.icon) {
                const ic = document.createElement("span");
                ic.className = "c-command__item-icon";
                ic.textContent = it.icon;
                item.appendChild(ic);
              }
              const body = document.createElement("div");
              body.className = "c-command__item-body";
              if (it.title || it.label) {
                const t = document.createElement("div");
                t.className = "c-command__item-title";
                t.textContent = it.title || it.label;
                body.appendChild(t);
              }
              if (it.hint) {
                const h = document.createElement("span");
                h.className = "c-command__item-hint";
                h.textContent = it.hint;
                body.appendChild(h);
              }
              if (it.shortcut) {
                const sc = document.createElement("kbd");
                sc.className = "c-command__item-shortcut";
                sc.textContent = it.shortcut;
                item.appendChild(sc);
              }
              item.appendChild(body);
              l.appendChild(item);
            }
          });
        } catch (e) { /* keep existing */ }
      } else if (!items && list) {
        list.remove();
      }
      const empty = this.getAttribute("empty");
      if (empty) {
        const e = this.ensure(".c-command__empty", () => { const el = document.createElement("div"); el.className = "c-command__empty"; return el; });
        e.textContent = empty;
      } else {
        const e = this.querySelector(".c-command__empty");
        if (e) e.remove();
      }
      // Live filter results (BY-29). The region must exist EMPTY at mount —
      // the contrast gate refuses a pre-populated live region — and is filled
      // only when typing starts. The option ids the keydown handler writes are
      // the "keyed rows" half; this is the aria-live half.
      const status = this.ensure(".c-command__status", () => { const el = document.createElement("div"); el.className = "c-command__status"; el.setAttribute("role", "status"); return el; });
      status.textContent = "";
      if (!items && !list) {
        renderEmpty(this, "command");
      }
    }
    enhance() {
      if (this._wiredCommand) return;
      this._wiredCommand = true;
      const input = () => this.querySelector(".c-command__input");
      const items = () => Array.from(this.querySelectorAll(".c-command__item"));
      let cursor = -1;
      const mark = () => {
        items().forEach((it, i) => {
          it.classList.toggle("c-command__item--active", i === cursor);
          it.setAttribute("aria-selected", String(i === cursor));
          if (i === cursor) {
            if (!it.id) it.id = "contour-command-option-" + i;
            const inp = input();
            if (inp) inp.setAttribute("aria-activedescendant", it.id);
          }
        });
        if (cursor < 0) {
          const inp = input();
          if (inp) inp.removeAttribute("aria-activedescendant");
        }
      };
      this.addEventListener("keydown", (e) => {
        const inp = input();
        if (!inp || e.target !== inp) return;
        const its = items();
        if (!its.length) return;
        if (e.key === "ArrowDown") { e.preventDefault(); cursor = Math.min(cursor + 1, its.length - 1); mark(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); cursor = Math.max(cursor - 1, 0); mark(); }
        else if (e.key === "Home") { e.preventDefault(); cursor = 0; mark(); }
        else if (e.key === "End") { e.preventDefault(); cursor = its.length - 1; mark(); }
         else if (e.key === "Enter") {
           e.preventDefault();
           if (cursor >= 0 && its[cursor]) {
             const item = its[cursor];
             const idx = items().indexOf(item);
             this.dispatchEvent(new CustomEvent("contour:select", { detail: { index: idx, label: item.textContent.trim() }, bubbles: true, composed: true }));
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
      // Filter (BY-29): typing narrows the option set. The region was created
      // empty at mount; only a real query fills it, so a mount announces
      // nothing. Hidden items are taken out of the cursor walk, matching the
      // tree/keydown roving: cursor is reset and aria-activedescendant cleared
      // so the next mark() cannot point at a hidden option.
      this.addEventListener("input", (e) => {
        const inp = input();
        if (!inp || e.target !== inp) return;
        const q = inp.value.trim().toLowerCase();
        const all = items();
        let visible = 0;
        all.forEach((it) => {
          const match = !q || (it.textContent || "").toLowerCase().includes(q);
          it.hidden = !match;
          if (match) visible += 1;
        });
        this.querySelectorAll(".c-command__group").forEach((g) => {
          const hasVisible = Array.from(g.querySelectorAll(".c-command__item")).some((it) => !it.hidden);
          g.hidden = !hasVisible;
        });
        cursor = -1;
        mark();
        const status = this.querySelector(".c-command__status");
        if (status) status.textContent = q ? `${visible} of ${all.length}` : "";
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
        root.classList.add("is-theme-switching");
        const current = root.getAttribute("data-theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        const next = current === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem("contour-theme", next); } catch (e) {}
        requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("is-theme-switching")));
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
    static get observed() { return ["title", "items", "collapsed"]; }
    static get properties() { return { title: { attribute: "title" }, items: { attribute: "items" }, collapsed: { attribute: "collapsed", type: Boolean } }; }
    render() {
      this.classList.add("c-sidebar");
      if (this.hasAttribute("collapsed")) this.classList.add("c-sidebar--collapsed");
      else Array.from(this.classList).forEach((c) => { if (c === "c-sidebar--collapsed") this.classList.remove(c); });
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-sidebar__title", () => { const el = document.createElement("div"); el.className = "c-sidebar__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-sidebar__title");
        if (t) t.remove();
      }
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const nav = this.ensure("nav.c-sidebar__nav", () => { const el = document.createElement("nav"); el.className = "c-sidebar__nav"; return el; });
          nav.innerHTML = "";
          parsed.forEach((it) => {
            const a = document.createElement("a");
            a.className = "c-sidebar__link";
            a.href = (it && it.href) || "#";
            a.textContent = (it && (it.label || it)) || "";
            nav.appendChild(a);
          });
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredSidebar) return;
      this._wiredSidebar = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-sidebar__toggle") : null;
        if (!btn || !this.contains(btn)) return;
        if (this.hasAttribute("collapsed")) this.removeAttribute("collapsed");
        else this.setAttribute("collapsed", "");
      });
    }
  }
  define("contour-sidebar", ContourSidebar);
class ContourToolbar extends ContourBase {
    static get observed() { return ["title", "actions", "overflow"]; }
    static get properties() { return { title: { attribute: "title" }, actions: { attribute: "actions" }, overflow: { attribute: "overflow", type: Number } }; }
    render() {
      this.classList.add("c-toolbar");
      const title = this.getAttribute("title");
      this.setAttribute("role", "toolbar");
      if (title) this.setAttribute("aria-label", title);
      const actions = this.getAttribute("actions");
      if (actions) {
        try {
          const parsed = JSON.parse(actions);
          const limit = this.overflow && this.overflow > 0 ? this.overflow : parsed.length;
          const visible = parsed.slice(0, limit);
          const excess = parsed.slice(limit);
          visible.forEach((a) => {
            const btn = document.createElement("button");
            btn.className = "c-toolbar__btn";
            btn.type = "button";
            btn.textContent = typeof a === "string" ? a : (a.label || a);
            this.appendChild(btn);
          });
          if (excess.length) {
            const wrap = document.createElement("div");
            wrap.className = "c-toolbar__overflow";
            const btn = document.createElement("button");
            btn.className = "c-toolbar__btn c-toolbar__overflow-btn";
            btn.type = "button";
            btn.setAttribute("aria-haspopup", "menu");
            btn.setAttribute("aria-expanded", "false");
            btn.textContent = "…";
            wrap.appendChild(btn);
            const menu = document.createElement("div");
            menu.className = "c-toolbar__overflow-menu";
            menu.setAttribute("role", "menu");
            menu.setAttribute("hidden", "");
            excess.forEach((a) => {
              const mbtn = document.createElement("button");
              mbtn.className = "c-toolbar__btn";
              mbtn.type = "button";
              mbtn.setAttribute("role", "menuitem");
              mbtn.textContent = typeof a === "string" ? a : (a.label || a);
              menu.appendChild(mbtn);
            });
            wrap.appendChild(menu);
            this.appendChild(wrap);
          }
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredToolbar) return;
      this._wiredToolbar = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-toolbar__overflow-btn") : null;
        if (!btn || !this.contains(btn)) return;
        const menu = btn.parentElement && btn.parentElement.querySelector(".c-toolbar__overflow-menu");
        if (!menu) return;
        const open = menu.hasAttribute("hidden");
        if (open) menu.removeAttribute("hidden"); else menu.setAttribute("hidden", "");
        btn.setAttribute("aria-expanded", String(open));
      });
    }
  }
  define("contour-toolbar", ContourToolbar);
