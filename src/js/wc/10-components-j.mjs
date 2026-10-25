import { ContourBase, define } from './00-core.mjs';
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

