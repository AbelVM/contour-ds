/* ============================================================================
   CONTOUR — Web Components (progressive enhancement)
   ----------------------------------------------------------------------------
   Thin wrappers around the CSS classes. Simple components just add classes.
   Complex components generate their full HTML scaffolding from attributes
   and slotted content. No shadow DOM — styles come from ds.css.
   ========================================================================= */
(function () {
  "use strict";

  const define = (name, cls) => {
    if (!customElements.get(name)) customElements.define(name, cls);
  };

  // The attributes a component may READ from its host. This list is the render
  // contract: an attribute that is not here cannot ask an element to re-render,
  // and an attribute a component WRITES to itself must never be here, because
  // that write would fire the callback that performs the render.
  //
  // Excluded because the render bodies below set them on the host:
  //   role, open, aria-label, aria-valuenow, aria-valuemin, aria-valuemax, tabindex
  // Adding one of those back to this list makes that component recurse.
  const OBSERVED = [
    "action", "after", "answer", "before", "body", "brand", "columns", "command",
    "copyable", "current", "date", "delta", "desc", "direction", "do", "dont",
    "error", "features", "hint", "href", "icon", "instrument", "items", "key",
    "label", "links", "live", "max", "media", "message", "min", "name", "next",
    "options", "pages", "placeholder", "prev", "price", "prompt", "question",
    "quote", "removable", "reverse", "rows", "series", "shortcut", "size",
    "steps", "summary", "tabs", "tag", "text", "title", "type", "value",
    "variant",
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
      } finally {
        this._contourRendering = false;
      }
    }

    disconnectedCallback() {
      // Override in subclasses that attach event listeners or timers.
    }

    // Subclasses override this. It must be safe to call repeatedly.
    render() {}
  }

  // Simple component: just adds CSS classes.
  const simple = (classes) => class extends ContourBase {
    render() {
      classes.forEach((c) => this.classList.add(c));
      ["variant", "size", "color"].forEach((attr) => {
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

  // ---- Simple components (class-only) ----
  const simpleMap = {
    "contour-activity": ["c-activity"],
    "contour-advanced": ["c-advanced"],
    "contour-affordance": ["c-affordance"],
    "contour-affordances": ["c-affordances"],
    "contour-alert": ["c-alert"],
    "contour-anchor": ["c-anchor"],
    "contour-app": ["c-app"],
    "contour-app-body": ["c-app-body"],
    "contour-avatar": ["c-avatar"],
    "contour-badge": ["c-badge"],
    "contour-bivariate": ["c-bivariate"],
    "contour-box": ["c-box"],
    "contour-brand": ["c-brand"],
    "contour-breadcrumb": ["c-breadcrumb"],
    "contour-btn": ["c-btn"],
    "contour-btn-group": ["c-btn-group"],
    "contour-callout": ["c-callout"],
    "contour-card": ["c-card"],
    "contour-chart": ["c-chart"],
    "contour-chart-grid": ["c-chart-grid"],
    "contour-check": ["c-check"],
    "contour-chip": ["c-chip"],
    "contour-cluster": ["c-cluster"],
    "contour-code": ["c-code"],
    "contour-code-tabs": ["c-code-tabs"],
    "contour-combobox": ["c-combobox"],
    "contour-command": ["c-command"],
    "contour-compare": ["c-compare"],
    "contour-container": ["c-container"],
    "contour-contour-plot": ["c-contour-plot"],
    "contour-cta": ["c-cta"],
    "contour-dash-freshness": ["c-dash-freshness"],
    "contour-dash-kpi-row": ["c-dash-kpi-row"],
    "contour-dash-shell": ["c-dash-shell"],
    "contour-dash-toolbar": ["c-dash-toolbar"],
    "contour-datamark": ["c-datamark"],
    "contour-delta": ["c-delta"],
    "contour-destructive-hint": ["c-destructive-hint"],
    "contour-dialog": ["c-dialog"],
    "contour-diff": ["c-diff"],
    "contour-disclosure": ["c-disclosure"],
    "contour-do-dont": ["c-do-dont"],
    "contour-docs-nav": ["c-docs-nav"],
    "contour-docs-shell": ["c-docs-shell"],
    "contour-dot": ["c-dot"],
    "contour-drag-handle": ["c-drag-handle"],
    "contour-draggable": ["c-draggable"],
    "contour-drawer": ["c-drawer"],
    "contour-drop-indicator": ["c-drop-indicator"],
    "contour-drop-zone": ["c-drop-zone"],
    "contour-empty": ["c-empty"],
    "contour-expandable": ["c-expandable"],
    "contour-faq": ["c-faq"],
    "contour-feature": ["c-feature"],
    "contour-field": ["c-field"],
    "contour-filter-bar": ["c-filter-bar"],
    "contour-filter-pill": ["c-filter-pill"],
    "contour-flag": ["c-flag"],
    "contour-footer": ["c-footer"],
    "contour-header": ["c-header"],
    "contour-heatmap": ["c-heatmap"],
    "contour-icon-badge": ["c-icon-badge"],
    "contour-input": ["c-input"],
    "contour-input-group": ["c-input-group"],
    "contour-instrument": ["c-instrument"],
    "contour-kbd": ["c-kbd"],
    "contour-kpi": ["c-kpi"],
    "contour-layer-switch": ["c-layer-switch"],
    "contour-legend": ["c-legend"],
    "contour-link": ["c-link"],
    "contour-live-badge": ["c-live-badge"],
    "contour-map-area": ["c-map-area"],
    "contour-map-footer": ["c-map-footer"],
    "contour-map-panel": ["c-map-panel"],
    "contour-map-slot": ["c-map-slot"],
    "contour-mark": ["c-mark"],
    "contour-measure": ["c-measure"],
    "contour-menu": ["c-menu"],
    "contour-meter": ["c-meter"],
    "contour-pagination": ["c-pagination"],
    "contour-panel": ["c-panel"],
    "contour-pill": ["c-pill"],
    "contour-plate": ["c-plate"],
    "contour-progress": ["c-progress"],
    "contour-pullquote": ["c-pullquote"],
    "contour-radio": ["c-radio"],
    "contour-radio-list": ["c-radio-list"],
    "contour-range": ["c-range"],
    "contour-range-scale": ["c-range-scale"],
    "contour-readout": ["c-readout"],
    "contour-resizable": ["c-resizable"],
    "contour-row": ["c-row"],
    "contour-scale-bar": ["c-scale-bar"],
    "contour-scheme-toggle": ["c-scheme-toggle"],
    "contour-scrim": ["c-scrim"],
    "contour-section-head": ["c-section-head"],
    "contour-segmented": ["c-segmented"],
    "contour-select": ["c-select"],
    "contour-sheet": ["c-sheet"],
    "contour-sidebar": ["c-sidebar"],
    "contour-skeleton": ["c-skeleton"],
    "contour-spinner": ["c-spinner"],
    "contour-sparkline": ["c-sparkline"],
    "contour-stack": ["c-stack"],
    "contour-stat": ["c-stat"],
    "contour-survey": ["c-survey"],
    "contour-switch": ["c-switch"],
    "contour-table": ["c-table"],
    "contour-table-wrap": ["c-table-wrap"],
    "contour-tabs": ["c-tabs"],
    "contour-textarea": ["c-textarea"],
    "contour-threshold": ["c-threshold"],
    "contour-timeline": ["c-timeline"],
    "contour-time-range": ["c-time-range"],
    "contour-toast": ["c-toast"],
    "contour-toast-host": ["c-toast-host"],
    "contour-toolbar": ["c-toolbar"],
    "contour-tooltip": ["c-tooltip"],
    "contour-tree": ["c-tree"],
    "contour-virtual-scroll": ["c-virtual-scroll"],
  };


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
            btn.textContent = typeof t === "string" ? t : t.label;
            list.appendChild(btn);
          });
          this.prepend(list);
        } catch (e) { /* keep existing */ }
      }
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
        brandEl.innerHTML = `<span class="c-mark"><svg aria-hidden="true"><use href="#i-mark" /></svg></span><span class="c-brand__name">${brand}</span>`;
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
      this.classList.add("c-table");
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
          this.innerHTML = "";
          this.appendChild(table);
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
        i.innerHTML = `<svg aria-hidden="true"><use href="#${icon}" /></svg>`;
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
            btn.textContent = typeof t === "string" ? t : t.label;
            list.appendChild(btn);
          });
          this.prepend(list);
        } catch (e) { /* keep existing */ }
      }
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
      if (!this.hasAttribute("aria-valuenow")) this.setAttribute("aria-valuenow", value || "0");
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
      if (!this.hasAttribute("aria-valuenow")) this.setAttribute("aria-valuenow", value);
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
        this.innerHTML = `Surveyed <span class="c-survey__value">${date}</span>`;
        if (instrument) {
          this.innerHTML += ` <span class="c-survey__sep">·</span> <span class="c-survey__value">${instrument}</span>`;
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
        a.innerHTML = `<span class="c-pager__dir">← Previous</span><span class="c-pager__title">${prev.split("|")[0]}</span>`;
        this.appendChild(a);
      }
      if (next && !this.querySelector(".c-pager__link--next")) {
        const a = document.createElement("a");
        a.className = "c-pager__link c-pager__link--next";
        a.href = next.split("|")[1] || "#";
        a.innerHTML = `<span class="c-pager__dir">Next →</span><span class="c-pager__title">${next.split("|")[0]}</span>`;
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

  // ---- Registration: the class-only wrappers run last ------------------
  //
  // Order is the contract. Every complex component above claims its own name and
  // define() skips a name already claimed -- which is why
  // <contour-menu items='["Cut"]'> builds a <ul> instead of only gaining a class.
  // Move this loop back above the complex components and the scaffolding half of
  // this file becomes dead code again: it did, and no gate noticed.
  Object.entries(simpleMap).forEach(([name, classes]) => {
    define(name, simple(classes));
  });
})();

  // ---- Shadow DOM + slots + template demonstration ----
  // A card that uses Shadow DOM with named slots and a <template>.
  // Styles are adopted from the document's stylesheets so ds.css still applies.
  const shadowTemplate = document.createElement("template");
  shadowTemplate.innerHTML = `
    <style>
      :host { display: block; }
      .shadow-card { border: 1px solid var(--color-border, #ccc); border-radius: var(--radius-md, 0.5rem); padding: var(--space-md, 1rem); background: var(--color-surface-1, #fff); }
      .shadow-card__head { font-weight: 600; margin-block-end: 0.5rem; }
    </style>
    <div class="shadow-card">
      <div class="shadow-card__head"><slot name="title">Untitled</slot></div>
      <div class="shadow-card__body"><slot></slot></div>
    </div>
  `;

  class ContourShadowCard extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({ mode: "open" });
      shadow.appendChild(shadowTemplate.content.cloneNode(true));
    }
  }
  try { customElements.define("contour-shadow-card", ContourShadowCard); } catch (e) {}
