import { ContourBase, define } from './00-core.mjs';
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


