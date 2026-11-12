import { ContourBase, define, onDispose, supportsUntilFound, contourId, headingTag, navKey, safeHref, cssLength , warnBadJson } from './core.mjs';
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
      // Authored menu items (li[role="menuitem"] or li.c-menu__item in light DOM)
      // are used as-is; the JSON `items` attribute only fills in when the host
      // has no authored menu content.
      const authoredItems = Array.from(this.querySelectorAll("li[role='menuitem'], li.c-menu__item, [role='menuitem']"));
      const authoredUl = this.querySelector("ul.c-menu");
      if (authoredItems.length) {
        // Ensure authored items are inside a ul.c-menu wrapper.
        if (!authoredUl) {
          const ul = document.createElement("ul");
          ul.className = "c-menu";
          ul.setAttribute("role", "menu");
          // Re-parent authored items into the wrapper, preserving order.
          for (const item of authoredItems) {
            if (item.parentElement === this) ul.appendChild(item);
          }
          this.appendChild(ul);
        } else {
          // Ensure classes/roles on authored items inside the existing wrapper.
          for (const item of authoredItems) {
            if (!item.classList.contains("c-menu__item")) item.classList.add("c-menu__item");
            if (!item.getAttribute("role")) item.setAttribute("role", "menuitem");
            if (!item.hasAttribute("tabindex")) item.setAttribute("tabindex", "-1");
          }
        }
        // Set the first enabled item to tabindex 0 for roving focus.
        const first = authoredItems.find((it) => it.getAttribute("aria-disabled") !== "true");
        if (first) first.setAttribute("tabindex", "0");
        this.classList.remove("c-menu");
        if (authoredUl) authoredUl.classList.add("c-menu");
        return;
      }
      if (authoredUl) {
        // Authored ul.c-menu exists but no menu items yet: keep it, don't generate.
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
               // A checkbox/radio item carries its state, not just a label.
               const role = item.type === "checkbox" ? "menuitemcheckbox" : item.type === "radio" ? "menuitemradio" : "menuitem";
               li.setAttribute("role", role);
               if (item.type === "checkbox" || item.type === "radio") li.setAttribute("aria-checked", String(!!item.checked));
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
               // Build the nested submenu the haspopup promised: without it the
               // item advertises a menu that opens onto nothing.
               if (item.items && Array.isArray(item.items)) {
                 const sub = document.createElement("ul");
                 sub.className = "c-menu";
                 sub.setAttribute("role", "menu");
                 item.items.forEach((subItem) => {
                   const sli = document.createElement("li");
                   sli.className = "c-menu__item" + (subItem.danger ? " c-menu__item--danger" : "") + (subItem.disabled ? " c-menu__item--disabled" : "");
                   sli.setAttribute("role", "menuitem");
                   if (subItem.disabled) sli.setAttribute("aria-disabled", "true");
                   if (subItem.label || subItem.title) {
                     const sl = document.createElement("span");
                     sl.className = "c-menu__label";
                     sl.textContent = subItem.label || subItem.title || "";
                     sli.appendChild(sl);
                   }
                   sub.appendChild(sli);
                 });
                 li.appendChild(sub);
               }
               ul.appendChild(li);
             }
           });
           if (ul.parentNode !== this) this.appendChild(ul);
           this.classList.remove("c-menu");
           ul.classList.add("c-menu");
         } catch (e) { warnBadJson(this, "attribute", e); }
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
    static get observed() { return ["tabs", "autoplay", "pause", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "persist", "orientation", "closable"]; }
    static get properties() { return { tabs: { attribute: "tabs" }, autoplay: { attribute: "autoplay", type: Number }, pause: { attribute: "pause", type: Boolean }, src: { attribute: "src" }, orientation: { attribute: "orientation" }, closable: { attribute: "closable", type: Boolean } }; }
    render() {
      this.classList.add("c-tabs");
      wireStates(this);
      loadRemote(this, "tabs");
      if (renderStates(this, "tabs")) return;
      const tabs = remoteData(this, "tabs");
      // Slot composition wins over the JSON attribute, same as ContourMenu:
      // authored tab buttons ([role='tab']) and panels (.c-tabs__panel) in light
      // DOM are used as-is; the JSON `tabs` attribute only fills in when the host
      // has no authored tab content.
      const authoredTabs = Array.from(this.querySelectorAll("[role='tab']"));
      const authoredList = this.querySelector(".c-tabs__list");
      const authoredPanels = Array.from(this.querySelectorAll(".c-tabs__panel"));

      if (authoredTabs.length) {
        // Ensure authored tabs are inside a .c-tabs__list wrapper.
        if (!authoredList) {
          const list = document.createElement("div");
          list.className = "c-tabs__list";
          list.setAttribute("role", "tablist");
          const orientation = this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
          list.setAttribute("aria-orientation", orientation);
          if (orientation === "vertical") this.classList.add("c-tabs--vertical"); else this.classList.remove("c-tabs--vertical");
          for (const tab of authoredTabs) {
            if (tab.parentElement === this) list.appendChild(tab);
          }
          this.prepend(list);
        }
        // Normalise attributes on authored tabs and link panels.
        const orientation = this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
        if (authoredList) authoredList.setAttribute("aria-orientation", orientation);
        if (orientation === "vertical") this.classList.add("c-tabs--vertical"); else this.classList.remove("c-tabs--vertical");

        authoredTabs.forEach((tab, i) => {
          if (!tab.classList.contains("c-tabs__tab")) tab.classList.add("c-tabs__tab");
          if (!tab.getAttribute("role")) tab.setAttribute("role", "tab");
          let panelId = tab.getAttribute("aria-controls");
          if (!panelId) {
            panelId = contourId("c-tabs-panel");
            tab.setAttribute("aria-controls", panelId);
            let panel = authoredPanels.find((p) => p.id === panelId);
            if (!panel) {
              panel = document.createElement("div");
              panel.className = "c-tabs__panel";
              panel.id = panelId;
              panel.setAttribute("role", "tabpanel");
              this.appendChild(panel);
            }
          }
          const selected = i === 0 || tab.getAttribute("aria-selected") === "true";
          tab.setAttribute("aria-selected", String(selected));
          tab.tabIndex = selected ? 0 : -1;
          const ctrl = tab.getAttribute("aria-controls");
          const panel = ctrl ? document.getElementById(ctrl) : null;
          if (panel) panel.hidden = !selected;
        });
        return;
      }

      if (tabs && !authoredTabs.length) {
         try {
           const parsed = JSON.parse(tabs);
            const list = this.ensure(".c-tabs__list", () => { const el = document.createElement("div"); el.className = "c-tabs__list"; el.setAttribute("role", "tablist"); return el; });
            list.setAttribute("role", "tablist");
            const orientation = this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
            list.setAttribute("aria-orientation", orientation);
            if (orientation === "vertical") this.classList.add("c-tabs--vertical"); else this.classList.remove("c-tabs--vertical");
             // Preserve the selected tab across rebuilds (G-31): read the
             // pre-drop selection before clearing, then re-apply it.
             const _prevTabs = Array.from(list.querySelectorAll("[role='tab']"));
             const _prevSel = _prevTabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
             const _keepIdx = _prevSel >= 0 ? _prevSel : 0;
             list.innerHTML = "";
             // Remove any previously generated panels so re-render doesn't stack.
             Array.from(this.querySelectorAll(".c-tabs__panel")).forEach((n) => n.remove());
             parsed.forEach((t, i) => {
               const label = typeof t === "string" ? t : (t.label || t.title || "");
               const panelId = contourId("c-tabs-panel");
               const btn = document.createElement("button");
               btn.className = "c-tabs__tab";
               btn.setAttribute("role", "tab");
               btn.setAttribute("aria-selected", String(i === _keepIdx));
               btn.setAttribute("aria-controls", panelId);
               btn.tabIndex = i === _keepIdx ? 0 : -1;
              btn.textContent = label;
              if (this.hasAttribute("closable")) {
                const closeBtn = document.createElement("button");
                closeBtn.type = "button";
                closeBtn.className = "c-tabs__close";
                closeBtn.setAttribute("aria-label", "Close " + label);
                closeBtn.textContent = "×";
                closeBtn.addEventListener("click", (e) => {
                  e.stopPropagation();
                  const idx = Array.from(list.querySelectorAll("[role='tab']")).indexOf(btn);
                  // remove tab + panel
                  const ctrl = btn.getAttribute("aria-controls");
                  const panel = ctrl ? document.getElementById(ctrl) : null;
                  btn.remove();
                  if (panel) panel.remove();
                  this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true, detail: { index: idx, label } }));
                  // activate first remaining tab
                  const remaining = list.querySelectorAll("[role='tab']");
                  if (remaining.length) remaining[0].click();
                });
                btn.appendChild(closeBtn);
              }
              list.appendChild(btn);
              const panel = document.createElement("div");
              panel.className = "c-tabs__panel";
              panel.id = panelId;
              panel.setAttribute("role", "tabpanel");
              if (typeof t === "object" && t !== null && t.content !== undefined) {
                panel.textContent = String(t.content);
              }
               if (i !== _keepIdx) panel.hidden = true;
              this.appendChild(panel);
            });
            if (list.parentNode !== this) this.prepend(list);
         } catch (e) { warnBadJson(this, "attribute", e); }
        } else if (!tabs && !authoredTabs.length) {
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "banner");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", this.getAttribute("brand") || "Header");
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
            a.href = safeHref(l.href || "#");
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
        this.dispatchEvent(new CustomEvent("contour:toggle", { bubbles: true, composed: true, detail: { open } }));
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
    static get updateMode() { return "keyed"; }
    static get observed() { return ["items", "virtual", "item-height", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "persist", "selectable"]; }
    static get properties() { return { items: { attribute: "items" }, src: { attribute: "src" }, "item-height": { attribute: "item-height" } }; }
    _itemHeight() {
      const h = Number(this.getAttribute("item-height"));
      if (Number.isFinite(h) && h > 0) return h;
      return cssLength("--virtual-list-item-height", 28);
    }
    _labelToPaths(nodes, pathPrefix, map) {
      (nodes || []).forEach((node, i) => {
        const p = pathPrefix + "." + i;
        const label = String(node.label || node).trim().slice(0, 120);
        if (!map.has(label)) map.set(label, []);
        map.get(label).push(p);
        if (Array.isArray(node.children)) this._labelToPaths(node.children, p, map);
      });
    }
    _restoreExpanded() {
      const persist = this.getAttribute("persist");
      if (!persist || !this._treeData) return;
      let labels = null;
      try {
        if (persist === "storage" && this.id) {
          const saved = localStorage.getItem("contour-tree:" + this.id);
          if (saved !== null) labels = JSON.parse(saved);
        } else if (persist === "url") {
          const v = new URLSearchParams(window.location.search).get("c-tree");
          if (v !== null) labels = JSON.parse(v);
        }
      } catch (e) { labels = null; }
      if (!Array.isArray(labels)) return;
      const want = new Set(labels.map((l) => String(l)));
      const map = new Map();
      this._labelToPaths(this._treeData, "", map);
      const expanded = this._expanded || (this._expanded = new Set());
      for (const lbl of want) {
        const paths = map.get(lbl);
        if (paths) paths.forEach((p) => expanded.add(p));
      }
    }
    _persistExpanded() {
      const persist = this.getAttribute("persist");
      if (!persist || !this._expanded) return;
      // Map expanded paths back to labels.
      const pathToNode = new Map();
      const walk = (nodes, pathPrefix) => {
        (nodes || []).forEach((node, i) => {
          const p = pathPrefix + "." + i;
          pathToNode.set(p, node);
          if (Array.isArray(node.children)) walk(node.children, p);
        });
      };
      walk(this._treeData, "");
      const open = [];
      for (const p of this._expanded) {
        const node = pathToNode.get(p);
        if (node) open.push(String(node.label || node).trim().slice(0, 120));
      }
      try {
        if (persist === "storage" && this.id) {
          localStorage.setItem("contour-tree:" + this.id, JSON.stringify(open));
        } else if (persist === "url") {
          const url = new URL(window.location.href);
          url.searchParams.set("c-tree", JSON.stringify(open));
          window.history.replaceState(null, "", url.toString());
        }
      } catch (e) {}
    }
    _flatten(nodes, pathPrefix, depth, expanded, out) {
      (nodes || []).forEach((node, i) => {
        const p = pathPrefix + "." + i;
        const hasChildren = Array.isArray(node.children) && node.children.length > 0;
        const isExpanded = expanded.has(p);
        out.push({ node, path: p, depth, hasChildren, expanded: isExpanded });
        if (hasChildren && isExpanded) {
          this._flatten(node.children, p, depth + 1, expanded, out);
        }
      });
    }
    _renderNodeFlat(rootUl, f) {
      const node = f.node;
      const depth = f.depth;
      const li = document.createElement("div");
      li.className = "c-tree__node";
      li.setAttribute("role", "treeitem");
      li.setAttribute("aria-level", String(depth));
      li.dataset.path = f.path;
      if (f.hasChildren) {
        li.setAttribute("aria-expanded", String(f.expanded));
        const row = document.createElement("div");
        row.className = "c-tree__row" + (node.active ? " c-tree__row--active" : "") + (node.dir ? " c-tree__row--dir" : "");
        row.style.paddingInlineStart = ((depth - 1) * 1) + "rem";
        const toggle = document.createElement("button");
        toggle.className = "c-tree__toggle";
        toggle.setAttribute("type", "button");
        toggle.setAttribute("aria-expanded", String(f.expanded));
        toggle.setAttribute("aria-label", "Toggle");
        toggle.innerHTML = '<svg aria-hidden="true"><use href="#i-chevron-right" /></svg>';
        row.appendChild(toggle);
        const span = document.createElement("span");
        span.textContent = node.label;
        row.appendChild(span);
        li.appendChild(row);
      } else {
        const leaf = document.createElement("div");
        leaf.className = "c-tree__leaf" + (node.active ? " c-tree__row--active" : "") + (node.dir ? " c-tree__row--dir" : "");
        leaf.style.paddingInlineStart = (depth * 1) + "rem";
        if (this.hasAttribute("selectable")) {
          const cb = document.createElement("input");
          cb.type = "checkbox";
          cb.className = "c-tree__select";
          cb.setAttribute("aria-label", "Select " + (node.label || node));
          const label = String(node.label || node).trim().slice(0, 120);
          if (this._selectedTree && this._selectedTree.has(label)) cb.checked = true;
          leaf.insertBefore(cb, leaf.firstChild);
        }
        leaf.appendChild(document.createTextNode(node.label || node));
        li.appendChild(leaf);
      }
      return li;
    }
    _renderWindow(rootUl, scrollTop) {
      if (!this._treeData) return;
      const ih = this._itemHeight();
      const expanded = this._expanded || (this._expanded = new Set());
      const flat = [];
      this._flatten(this._treeData, "", 1, expanded, flat);
      const total = flat.length;
      const viewportSize = rootUl.clientHeight || 320;
      const visibleCount = Math.ceil(viewportSize / ih) + 6;
      let start = Math.floor((scrollTop || 0) / ih);
      if (start < 0) start = 0;
      if (start > Math.max(0, total - visibleCount)) start = Math.max(0, total - visibleCount);
      const end = Math.min(total, start + visibleCount);
      const topSize = start * ih;
      const bottomSize = Math.max(0, (total - end) * ih);
      rootUl.innerHTML = "";
      const top = document.createElement("div");
      top.className = "c-tree__spacer c-tree__spacer--top";
      top.style.height = topSize + "px";
      rootUl.appendChild(top);
      for (let i = start; i < end; i++) {
        rootUl.appendChild(this._renderNodeFlat(rootUl, flat[i]));
      }
      const bottom = document.createElement("div");
      bottom.className = "c-tree__spacer c-tree__spacer--bottom";
      bottom.style.height = bottomSize + "px";
      rootUl.appendChild(bottom);
    }
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
           rootUl.setAttribute("role", "tree");
           const virtual = this.hasAttribute("virtual");
           if (virtual) {
             this._treeData = parsed;
             this._expanded = this._expanded || new Set();
             this._treeRoot = rootUl;
             this._restoreExpanded();
             rootUl.style.maxHeight = rootUl.style.maxHeight || "24rem";
             rootUl.style.overflow = "auto";
             const scrollTop = this._treeScrollTop || 0;
             this._renderWindow(rootUl, scrollTop);
             try { rootUl.scrollTop = scrollTop; } catch (e) {}
           } else {
             this._treeData = null;
             const render = (nodes, parent, depth) => {
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
                li.setAttribute("aria-level", String(depth));
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
                  render(node.children, li, depth + 1);
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
            render(parsed, null, 1);
           }
           this.classList.remove("c-tree");
           rootUl.classList.add("c-tree");
           if (rootUl.parentNode !== this) this.appendChild(rootUl);
        } catch (e) { warnBadJson(this, "attribute", e); }
      } else if (!items && !authored.length) {
        renderEmpty(this, "tree");
      }
    }
    enhance() {
      // Toggle handling via delegation (works for windowed + static trees).
      if (!this._wiredTreeToggle) {
        this._wiredTreeToggle = true;
        this.addEventListener("click", (e) => {
          const toggle = e.target && e.target.closest ? e.target.closest(".c-tree__toggle") : null;
          if (!toggle || !this.contains(toggle)) return;
          e.stopPropagation();
          const nodeEl = toggle.closest(".c-tree__node");
          const path = nodeEl && nodeEl.dataset ? nodeEl.dataset.path : null;
          const expanded = toggle.getAttribute("aria-expanded") === "true";
          if (path && this._expanded) {
            if (expanded) this._expanded.delete(path); else this._expanded.add(path);
          }
          toggle.setAttribute("aria-expanded", String(!expanded));
          const row = toggle.closest(".c-tree__row");
          if (row) row.setAttribute("aria-expanded", String(!expanded));
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { path, expanded: !expanded } }));
          if (this.hasAttribute("virtual") && this._treeRoot) {
            const s = this._treeRoot;
            this._treeScrollTop = s.scrollTop || 0;
            this._renderWindow(s, this._treeScrollTop);
            try { s.scrollTop = this._treeScrollTop; } catch (err) {}
            this._persistExpanded();
          }
        });
      }
      // Scroll-driven windowing for virtual trees.
      if (this.hasAttribute("virtual") && !this._wiredTreeScroll) {
        this._wiredTreeScroll = true;
        const attach = () => {
          const s = this.querySelector(".c-tree");
          if (!s || s._treeScrollWired) return;
          s._treeScrollWired = true;
          let raf = 0;
          const onScroll = () => {
            if (raf) return;
            raf = requestAnimationFrame(() => {
              raf = 0;
              this._treeScrollTop = s.scrollTop || 0;
              this._renderWindow(s, this._treeScrollTop);
              try { s.scrollTop = this._treeScrollTop; } catch (err) {}
            });
          };
          s.addEventListener("scroll", onScroll, { passive: true });
          onDispose(this, () => { s.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); });
        };
        attach();
        // retry if root not ready
        if (!this.querySelector(".c-tree")) {
          const mo = new MutationObserver(() => { if (this.querySelector(".c-tree")) { attach(); mo.disconnect(); } });
          mo.observe(this, { childList: true, subtree: true });
          onDispose(this, () => mo.disconnect());
        }
      }
      // Auto-scroll during drag for virtual trees (so off-screen targets
      // become reachable). Delegated on the host; only active in virtual mode.
      if (this.hasAttribute("virtual") && !this._wiredTreeDragScroll) {
        this._wiredTreeDragScroll = true;
        let dragScrollRaf = 0;
        let dragScrollDir = 0;
        const tick = () => {
          if (!dragScrollDir) { dragScrollRaf = 0; return; }
          const s = this._treeRoot;
          if (s) {
            s.scrollTop += dragScrollDir * 8;
            this._treeScrollTop = s.scrollTop;
            this._renderWindow(s, this._treeScrollTop);
          }
          dragScrollRaf = requestAnimationFrame(tick);
        };
        this.addEventListener("dragover", (e) => {
          const s = this._treeRoot;
          if (!s) return;
          const rect = s.getBoundingClientRect();
          const edge = 40;
          if (e.clientY < rect.top + edge) dragScrollDir = -1;
          else if (e.clientY > rect.bottom - edge) dragScrollDir = 1;
          else dragScrollDir = 0;
          if (dragScrollDir && !dragScrollRaf) dragScrollRaf = requestAnimationFrame(tick);
        });
        const stop = () => {
          dragScrollDir = 0;
          if (dragScrollRaf) { cancelAnimationFrame(dragScrollRaf); dragScrollRaf = 0; }
        };
        this.addEventListener("dragend", stop);
        this.addEventListener("drop", stop);
      }
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
            const _prevCodeTabs = Array.from(l.querySelectorAll("[role='tab']"));
            const _prevCodeSel = _prevCodeTabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
            const _keepCodeIdx = _prevCodeSel >= 0 ? _prevCodeSel : 0;
            l.innerHTML = "";
            Array.from(this.querySelectorAll(".c-code-tabs__panel")).forEach((n) => n.remove());
            parsed.forEach((t, i) => {
              const label = typeof t === "string" ? t : (t.label || t.title || "");
              const panelId = contourId("c-code-tabs-panel");
              const btn = document.createElement("button");
              btn.className = "c-code-tabs__tab";
              btn.setAttribute("role", "tab");
              btn.setAttribute("aria-selected", String(i === _keepCodeIdx));
              btn.setAttribute("aria-controls", panelId);
              btn.tabIndex = i === _keepCodeIdx ? 0 : -1;
             btn.textContent = label;
             l.appendChild(btn);
             const panel = document.createElement("div");
             panel.className = "c-code-tabs__panel";
             panel.id = panelId;
             panel.setAttribute("role", "tabpanel");
             if (typeof t === "object" && t !== null && t.content !== undefined) {
               panel.textContent = String(t.content);
             }
              if (i !== _keepCodeIdx) panel.hidden = true;
             this.appendChild(panel);
           });
           if (l.parentNode !== this) this.prepend(l);
        } catch (e) { warnBadJson(this, "attribute", e); }
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "navigation");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Breadcrumb");
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
          const n = this.ensure("nav", () => { const el = document.createElement("nav"); el.setAttribute("aria-label", "Breadcrumb"); return el; });
          n.setAttribute("aria-label", "Breadcrumb");
          // A unique id per instance: two breadcrumbs on a page must not share
          // one, and the overflow button points at this one through aria-controls.
          if (!n.id) n.id = contourId("contour-breadcrumb-list");
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
            btn.setAttribute("aria-controls", n.id);
            btn.textContent = "…";
            btn.addEventListener("click", () => {
              // A handler-owned property, not an attribute: flipping a
              // self-observed attribute from a handler would re-enter render
              // (the arm-7 trap), so the flag lives outside OBSERVED.
              this._overflowExpanded = true;
              this.requestRender();
              this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { expanded: true } }));
            });
            n.appendChild(btn);
          }
          shown.forEach((item, i) => {
            if (i < shown.length - 1) {
              const a = document.createElement("a");
              a.href = safeHref(item.href || "#");
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
        } catch (e) { warnBadJson(this, "attribute", e); }
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
        a.href = safeHref(prev.split("|")[1] || "#");
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
        a.href = safeHref(next.split("|")[1] || "#");
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
      this.setAttribute("role", "group");
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
          parsed.forEach((item, i) => {
            const a = document.createElement("a");
            a.className = "c-toc__link" + (item.sub ? " c-toc__link--sub" : "");
            a.href = safeHref(item.href || "#");
            a.textContent = item.label || item;
            a.tabIndex = i === 0 ? 0 : -1;
            if (item.current) a.setAttribute("aria-current", "true");
            l.appendChild(a);
          });
        } catch (e) { warnBadJson(this, "attribute", e); }
      } else if (!items && list) {
        list.remove();
        renderEmpty(this, "toc");
      } else if (!items && !list) {
        renderEmpty(this, "toc");
      }
    }
    enhance() {
      // Scroll-spy (BY-29, CDS-075). The toc links point at page sections by
      // href; the section whose top has most recently crossed the reading line
      // marks its link aria-current="true" and clears the rest. The shipped CSS
      // already styles .c-toc__link[aria-current="true"], so the hook needs no
      // new rule.
      //
      // This reads geometry on scroll rather than IntersectionObserver: an
      // observer callback reports the entries that changed, not the current
      // reading position, so `visible[0]` is whichever section happened to
      // fire first — order is delivery, not document order. Geometry has one
      // answer for one scroll position. rAF-throttled, passive listener.
      // Enhancement-only: without it the links stay as rendered, with any
      // author-provided aria-current left untouched.
      if (this._wiredTocSpy) return;
      const links = () => Array.from(this.querySelectorAll(".c-toc__link"));
      const pairs = () => links()
        .map((a) => {
          const href = a.getAttribute("href") || "";
          if (!href.startsWith("#") || href.length < 2) return null;
          const el = document.getElementById(href.slice(1));
          return el ? { a, el } : null;
        })
        .filter(Boolean);
      if (!pairs().length) return;
      this._wiredTocSpy = true;

      const readingLine = () => {
        const raw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height"));
        return (Number.isFinite(raw) ? raw : 0) + Math.min(120, window.innerHeight * 0.2);
      };

      const update = () => {
        const all = pairs();
        if (!all.length) return;
        const line = readingLine();
        let current = all[0];
        for (const p of all) {
          if (p.el.getBoundingClientRect().top <= line) current = p;
        }
        // The last section never crosses the line on a short page; at the
        // bottom of a scrollable document the last link is the honest answer.
        // A document shorter than the viewport is not "at the bottom" — it is
        // simply not scrollable, and the first section is where the reader is.
        const scrollable = document.documentElement.scrollHeight > window.innerHeight + 2;
        if (scrollable && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
          current = all[all.length - 1];
        }
        const id = current.el.id;
        links().forEach((a) => {
          const isCurrent = a.getAttribute("href") === "#" + id;
          if (isCurrent) {
            if (a.getAttribute("aria-current") !== "true") a.setAttribute("aria-current", "true");
          } else if (a.hasAttribute("aria-current")) {
            a.removeAttribute("aria-current");
          }
        });
      };

      let queued = 0;
      const schedule = () => {
        if (queued) return;
        queued = requestAnimationFrame(() => { queued = 0; update(); });
      };
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      window.addEventListener("hashchange", schedule);
      update();
      onDispose(this, () => {
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        window.removeEventListener("hashchange", schedule);
        if (queued) cancelAnimationFrame(queued);
      });
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
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { href } }));
        });
        // Keyboard: roving tabindex over TOC links, Enter follows the link.
        this.addEventListener("keydown", (e) => {
          const links = Array.from(this.querySelectorAll(".c-toc__link"));
          if (!links.length) return;
          navKey(e, links, { wrap: true, homeEnd: true, onNavigate: (i) => { links.forEach((a, j) => a.tabIndex = j === i ? 0 : -1); }, onKey: (k) => { if (k === "Enter") { const a = document.activeElement; if (a) { e.preventDefault(); a.click(); } } } });
        });
      }
    }
  }
define("contour-toc", ContourTocFull);
class ContourFilterBar extends ContourBase {
    static get observed() { return ["label", "divider", "items", "input", "placeholder", "mode", "modes", "scope", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "count", "clearable"]; }
    static get properties() { return { label: { attribute: "label" }, divider: { attribute: "divider" }, items: { attribute: "items" }, src: { attribute: "src" }, count: { attribute: "count" }, clearable: { attribute: "clearable" }, scope: { attribute: "scope" } }; }
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
       // Text input support
       if (this.hasAttribute("input") || this.hasAttribute("placeholder")) {
         let inp = this.querySelector(".c-filter-bar__input");
         if (!inp) { inp = document.createElement("input"); inp.type = "search"; inp.className = "c-filter-bar__input"; this.appendChild(inp); }
         const ph = this.getAttribute("placeholder");
         if (ph) inp.setAttribute("placeholder", ph);
       } else {
         const inp = this.querySelector(".c-filter-bar__input");
         if (inp) inp.remove();
       }
       // Mode toolbar
       const modesAttr = this.getAttribute("modes");
       let modes = null;
       if (modesAttr) { try { modes = JSON.parse(modesAttr); } catch (e) { modes = modesAttr.split(",").map((s) => s.trim()); } }
       if (modes || this.hasAttribute("mode")) {
         let bar = this.querySelector(".c-filter-bar__modes");
         if (!bar) { bar = document.createElement("div"); bar.className = "c-filter-bar__modes"; bar.setAttribute("role", "toolbar"); bar.setAttribute("aria-label", label || "Filter modes"); this.appendChild(bar); }
         bar.innerHTML = "";
         const current = this.getAttribute("mode");
         const list = Array.isArray(modes) ? modes : ["draw", "erase", "select"];
         list.forEach((m) => {
           const name = typeof m === "string" ? m : (m.label || m.value || m);
           const val = typeof m === "string" ? m : (m.value || m.label || m);
           const btn = document.createElement("button");
           btn.type = "button";
           btn.className = "c-filter-bar__mode";
           btn.textContent = name;
           btn.dataset.mode = val;
           if (current && current === val) btn.setAttribute("aria-pressed", "true");
           bar.appendChild(btn);
         });
        } else {
          const bar = this.querySelector(".c-filter-bar__modes");
          if (bar) bar.remove();
        }
        // Scope toggle (viewport / global) — CARTO-inspired.
        const scope = this.getAttribute("scope");
        if (scope === "viewport" || scope === "global") {
          Array.from(this.querySelectorAll(".c-filter-bar__scope")).forEach((n) => n.remove());
          const bar = document.createElement("div");
          bar.className = "c-filter-bar__modes c-filter-bar__scope";
          bar.setAttribute("role", "toolbar");
          bar.setAttribute("aria-label", "Data scope");
          ["viewport", "global"].forEach((s) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "c-filter-bar__mode c-filter-bar__scope-btn";
            btn.textContent = s === "viewport" ? "Viewport" : "Global";
            btn.dataset.scope = s;
            if (scope === s) btn.setAttribute("aria-pressed", "true");
            bar.appendChild(btn);
          });
          this.appendChild(bar);
        } else {
          const bar = this.querySelector(".c-filter-bar__scope");
          if (bar) bar.remove();
        }
        // Render filter pills from items.
      Array.from(this.querySelectorAll(".c-filter-pill")).forEach((n) => n.remove());
      const items = remoteData(this, "items");
      // Slotted content: authored .c-filter-pill children take precedence.
      const authoredPills = Array.from(this.querySelectorAll(":scope > .c-filter-pill"));
      let parsed = null;
      if (authoredPills.length) {
        parsed = authoredPills.map((p) => p.textContent.trim());
        authoredPills.forEach((p) => p.remove());
      } else if (items) { try { parsed = JSON.parse(items); } catch (e) { parsed = null; } }
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
      // Clear-all affordance (CARTO-inspired): panel-level clear with active count.
      Array.from(this.querySelectorAll(".c-filter-bar__clear-all")).forEach((n) => n.remove());
      if (this.hasAttribute("clearable")) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "c-btn c-btn--ghost c-btn--sm c-filter-bar__clear-all";
        const count = this.getAttribute("count");
        btn.textContent = count ? ("Clear all (" + count + ")") : "Clear all";
        this.appendChild(btn);
      }
      if (!parsed && !label) renderEmpty(this, "filter-bar");
    }
     enhance() {
       wireRemovable(this);
       if (this._wiredFilterBar) return;
       this._wiredFilterBar = true;
        this.addEventListener("click", (e) => {
          const btn = e.target && e.target.closest ? e.target.closest(".c-filter-bar__mode") : null;
          if (!btn || !this.contains(btn)) return;
          const mode = btn.dataset.mode || btn.textContent.trim();
          Array.from(this.querySelectorAll(".c-filter-bar__mode")).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
          this.dispatchEvent(new CustomEvent("contour:mode-change", { bubbles: true, composed: true, detail: { mode } }));
          // Scope toggle: dispatch contour:scope-change for viewport/global buttons.
          if (btn.classList.contains("c-filter-bar__scope-btn")) {
            const scope = btn.dataset.scope || null;
            if (scope) this.setAttribute("scope", scope);
            this.dispatchEvent(new CustomEvent("contour:scope-change", { bubbles: true, composed: true, detail: { scope } }));
          }
        });
        this.addEventListener("keydown", (e) => {
          const modes = Array.from(this.querySelectorAll(".c-filter-bar__mode"));
          navKey(e, modes, { wrap: false, onKey: () => { document.activeElement.click(); } });
        });
       // text input
       const inp = this.querySelector(".c-filter-bar__input");
       if (inp && !inp._wiredFilterInput) {
         inp._wiredFilterInput = true;
         inp.addEventListener("input", () => {
           this.dispatchEvent(new CustomEvent("contour:input", { bubbles: true, composed: true, detail: { value: inp.value } }));
         });
         inp.addEventListener("change", () => {
           this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: inp.value } }));
         });
       }
       // Clear-all (CARTO-inspired): delegated on host.
       if (!this._wiredClearAll) {
         this._wiredClearAll = true;
         this.addEventListener("click", (e) => {
           const btn = e.target && e.target.closest ? e.target.closest(".c-filter-bar__clear-all") : null;
           if (!btn || !this.contains(btn)) return;
           e.preventDefault();
           this.dispatchEvent(new CustomEvent("contour:clear-all", { bubbles: true, composed: true, detail: {} }));
         });
       }
     }
  }
  define("contour-filter-bar", ContourFilterBar);
  class ContourCommand extends ContourBase {
    static get observed() { return ["placeholder", "items", "recent", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { placeholder: { attribute: "placeholder" }, items: { attribute: "items" }, recent: { attribute: "recent" }, empty: { attribute: "empty" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-command");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Command palette");
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
        } catch (e) { warnBadJson(this, "attribute", e); }
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
    static get observed() { return ["brand", "note", "links", "cols", "heading"]; }
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
            a.href = safeHref(typeof l === "string" ? "#" : (l.href || "#"));
            a.textContent = typeof l === "string" ? l : (l.label || l);
            wrap.appendChild(a);
          });
        } catch (e) { warnBadJson(this, "attribute", e); }
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
              const h = document.createElement(headingTag(this, "h3"));
              h.textContent = col.title;
              c.appendChild(h);
            }
            (col.links || []).forEach((l) => {
              const a = document.createElement("a");
              a.href = safeHref(typeof l === "string" ? "#" : (l.href || "#"));
              a.textContent = typeof l === "string" ? l : (l.label || l);
              c.appendChild(a);
            });
            this.appendChild(c);
          });
        } catch (e) { warnBadJson(this, "attribute", e); }
      } else {
        this.querySelectorAll(".c-footer__col").forEach((c) => c.remove());
      }
    }
  }
  define("contour-footer", ContourFooter);
class ContourSchemeToggle extends ContourBase {
    static get observed() { return []; }
    render() { this.classList.add("c-scheme-toggle"); if (!this.hasAttribute("role")) this.setAttribute("role", "button"); if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0"); if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Toggle color scheme"); }
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
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.click();
        }
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "navigation");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", this.getAttribute("title") || "Sidebar");
      if (this.hasAttribute("collapsed")) this.classList.add("c-sidebar--collapsed"); else this.classList.remove("c-sidebar--collapsed");
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
          parsed.forEach((it, i) => {
            const a = document.createElement("a");
            a.className = "c-sidebar__link";
            a.href = safeHref((it && it.href) || "#");
            a.textContent = (it && (it.label || it)) || "";
            a.tabIndex = i === 0 ? 0 : -1;
            nav.appendChild(a);
          });
        } catch (e) { warnBadJson(this, "attribute", e); }
      }
    }
    enhance() {
      if (this._wiredSidebar) return;
      this._wiredSidebar = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-sidebar__toggle") : null;
        if (!btn || !this.contains(btn)) return;
        this.toggleAttribute("collapsed");
        this.dispatchEvent(new CustomEvent("contour:toggle", { bubbles: true, composed: true, detail: { collapsed: this.hasAttribute("collapsed") } }));
      });
      // Keyboard: roving tabindex over sidebar links, Enter follows the link.
      this.addEventListener("keydown", (e) => {
        const nav = this.querySelector("nav.c-sidebar__nav");
        if (!nav) return;
        const links = Array.from(nav.querySelectorAll(".c-sidebar__link"));
        if (!links.length) return;
        navKey(e, links, { wrap: true, homeEnd: true, onNavigate: (i) => { links.forEach((l, j) => l.tabIndex = j === i ? 0 : -1); }, onKey: (k) => { if (k === "Enter") { const a = document.activeElement; if (a) { e.preventDefault(); a.click(); } } } });
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
          visible.forEach((a, i) => {
            const btn = document.createElement("button");
            btn.className = "c-toolbar__btn";
            btn.type = "button";
            btn.tabIndex = i === 0 ? 0 : -1;
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
        } catch (e) { warnBadJson(this, "attribute", e); }
      }
    }
    enhance() {
      if (this._wiredToolbar) return;
      this._wiredToolbar = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-toolbar__overflow-btn") : null;
        if (btn && this.contains(btn)) {
          const menu = btn.parentElement && btn.parentElement.querySelector(".c-toolbar__overflow-menu");
          if (menu) {
            const open = menu.hasAttribute("hidden");
            if (open) menu.removeAttribute("hidden"); else menu.setAttribute("hidden", "");
            btn.setAttribute("aria-expanded", String(open));
          }
          return;
        }
        const actionBtn = e.target && e.target.closest ? e.target.closest(".c-toolbar__btn") : null;
        if (actionBtn && this.contains(actionBtn)) {
          this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true, detail: { label: actionBtn.textContent.trim() } }));
        }
      });
      // Keyboard: roving tabindex over visible toolbar buttons, Enter/Space activates.
      this.addEventListener("keydown", (e) => {
        const btns = Array.from(this.querySelectorAll(":scope > .c-toolbar__btn:not(.c-toolbar__overflow-btn)"));
        if (!btns.length) return;
        navKey(e, btns, { wrap: true, homeEnd: true, onNavigate: (i) => { btns.forEach((b, j) => b.tabIndex = j === i ? 0 : -1); }, onKey: (k) => { if (k === "Enter" || k === " ") { const b = document.activeElement; if (b) { e.preventDefault(); b.click(); } } } });
      });
    }
  }
  define("contour-toolbar", ContourToolbar);

/**
 * Spatial filter (CARTO-inspired): draw-on-map affordance. Engine-agnostic:
 * Contour renders the mode toolbar and emits `contour:draw-start`/`contour:draw-end`
 * (with a geometry payload) and `contour:clear`; the consumer runs the spatial
 * query against its map engine.
 * Attributes: `modes`, `mode`, `active`, `empty`, `loading`, `error`, `retry`,
 * `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourSpatialFilter extends ContourBase {
    static get observed() { return ["modes", "mode", "active", "bounds", "operator", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { modes: { attribute: "modes" }, mode: { attribute: "mode" }, active: { attribute: "active" }, bounds: { attribute: "bounds" }, operator: { attribute: "operator" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-spatial-filter");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Spatial filter");
      wireStates(this);
      loadRemote(this, []);
      if (renderStates(this, "spatial-filter")) return;
      const modesAttr = this.getAttribute("modes");
      let modes = null;
      if (modesAttr) { try { modes = JSON.parse(modesAttr); } catch (e) { modes = modesAttr.split(",").map((s) => s.trim()); } }
      const list = Array.isArray(modes) ? modes : ["rect", "circle", "polygon", "clear"];
      let bar = this.querySelector(".c-spatial-filter__modes");
      if (!bar) { bar = document.createElement("div"); bar.className = "c-spatial-filter__modes"; bar.setAttribute("role", "toolbar"); this.appendChild(bar); }
      bar.innerHTML = "";
      const current = this.getAttribute("mode");
      list.forEach((m) => {
        const name = typeof m === "string" ? m : (m.label || m.value || m);
        const val = typeof m === "string" ? m : (m.value || m.label || m);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "c-spatial-filter__mode c-btn c-btn--ghost c-btn--sm";
        btn.textContent = name;
        btn.dataset.mode = val;
        if (current && current === val) btn.setAttribute("aria-pressed", "true");
        bar.appendChild(btn);
      });
      // Operator selection
      let operator = this.querySelector(".c-spatial-filter__operator");
      if (!operator) { operator = document.createElement("div"); operator.className = "c-spatial-filter__operator"; this.appendChild(operator); }
      const ops = ["intersects", "contains", "within", "disjoint"];
      const currentOp = this.getAttribute("operator") || "intersects";
      operator.innerHTML = "";
      const opLabel = document.createElement("span");
      opLabel.textContent = "Operator:";
      operator.appendChild(opLabel);
      const opSelect = document.createElement("select");
      opSelect.className = "c-spatial-filter__operator-select";
      ops.forEach((op) => {
        const o = document.createElement("option");
        o.value = op;
        o.textContent = op;
        if (op === currentOp) o.setAttribute("selected", "");
        opSelect.appendChild(o);
      });
      operator.appendChild(opSelect);
      // Bounds readout
      let readout = this.querySelector(".c-spatial-filter__readout");
      if (!readout) { readout = document.createElement("div"); readout.className = "c-spatial-filter__readout"; this.appendChild(readout); }
      const bounds = this.getAttribute("bounds");
      readout.textContent = bounds || "—";
      // Clear all
      let clearAll = this.querySelector(".c-spatial-filter__clear-all");
      if (!clearAll) { clearAll = document.createElement("button"); clearAll.type = "button"; clearAll.className = "c-spatial-filter__clear-all"; this.appendChild(clearAll); }
      clearAll.textContent = "Clear all";
      if (this.hasAttribute("active")) {
        this.classList.add("c-spatial-filter--active");
      } else {
        this.classList.remove("c-spatial-filter--active");
      }
    }
    enhance() {
      if (this._wiredSpatialFilter) return;
      this._wiredSpatialFilter = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest("button") : null;
        if (!btn || !this.contains(btn)) return;
        if (btn.classList.contains("c-spatial-filter__clear-all")) {
          this.classList.remove("c-spatial-filter--active");
          Array.from(this.querySelectorAll(".c-spatial-filter__mode")).forEach((b) => b.setAttribute("aria-pressed", "false"));
          this.dispatchEvent(new CustomEvent("contour:clear", { bubbles: true, composed: true, detail: {} }));
          this.dispatchEvent(new CustomEvent("contour:spatial-filter", { bubbles: true, composed: true, detail: { action: "clear-all" } }));
          return;
        }
        const modeBtn = btn.closest(".c-spatial-filter__mode");
        if (!modeBtn) return;
        const mode = modeBtn.dataset.mode || modeBtn.textContent.trim();
        if (mode === "clear") {
          this.classList.remove("c-spatial-filter--active");
          Array.from(this.querySelectorAll(".c-spatial-filter__mode")).forEach((b) => b.setAttribute("aria-pressed", "false"));
          this.dispatchEvent(new CustomEvent("contour:clear", { bubbles: true, composed: true, detail: {} }));
          return;
        }
        this.classList.add("c-spatial-filter--active");
        Array.from(this.querySelectorAll(".c-spatial-filter__mode")).forEach((b) => b.setAttribute("aria-pressed", String(b === modeBtn)));
        this.dispatchEvent(new CustomEvent("contour:draw-start", { bubbles: true, composed: true, detail: { mode } }));
        this.dispatchEvent(new CustomEvent("contour:spatial-filter", { bubbles: true, composed: true, detail: { action: "draw-start", mode } }));
      });
      this.addEventListener("change", (e) => {
        const select = e.target;
        if (select && select.classList.contains("c-spatial-filter__operator-select")) {
          this.setAttribute("operator", select.value);
          this.dispatchEvent(new CustomEvent("contour:spatial-filter", { bubbles: true, composed: true, detail: { action: "operator", operator: select.value } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const modes = Array.from(this.querySelectorAll(".c-spatial-filter__mode"));
        navKey(e, modes, { wrap: false, onKey: () => { document.activeElement.click(); } });
      });
    }
  }
  define("contour-spatial-filter", ContourSpatialFilter);
