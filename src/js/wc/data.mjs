import { ContourBase, define } from './core.mjs';
class ContourReadout extends ContourBase {
    static get observed() { return ["rows"]; }
    static get properties() { return { rows: { attribute: "rows" } }; }
    render() {
      this.classList.add("c-readout");
      // Drop previously generated rows so a re-render cannot stack a second set.
      Array.from(this.querySelectorAll(".c-readout__row")).forEach((n) => n.remove());
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
            val.className = "c-readout__value" + (r.primary ? " c-readout__value--primary" : "") + (r.accent ? " c-readout__value--accent" : "") + (r.coord ? " c-readout__value--coord" : "");
            val.textContent = r.value || r[1];
            row.appendChild(key);
            row.appendChild(val);
            if (r.order) {
              const ord = document.createElement("span");
              ord.className = "c-readout__order";
              ord.textContent = r.order;
              row.appendChild(ord);
            }
            this.appendChild(row);
          });
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-readout", ContourReadout);
class ContourKpi extends ContourBase {
    static get observed() { return ["value", "label", "delta", "direction", "note", "variant", "unit"]; }
    static get properties() {
      return {
        value: { attribute: "value" },
        label: { attribute: "label" },
        delta: { attribute: "delta" },
        direction: { attribute: "direction" },
        note: { attribute: "note" },
        variant: { attribute: "variant" },
        unit: { attribute: "unit" },
      };
    }
    render() {
      this.classList.add("c-kpi");
      // Apply variant modifier if declared.
      const variant = this.getAttribute("variant");
      // Remove any previous variant modifier.
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-kpi--")) this.classList.remove(c); });
      if (variant) this.classList.add("c-kpi--" + variant);
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
        const h = this.ensure(".c-kpi__head", () => { const el = document.createElement("div"); el.className = "c-kpi__head"; return el; });
        let l = h.querySelector(".c-kpi__label");
        if (!l) { l = document.createElement("div"); l.className = "c-kpi__label"; h.appendChild(l); }
        l.textContent = label;
        if (h.parentNode !== this) this.insertBefore(h, this.firstChild);
      } else {
        const h = this.querySelector(".c-kpi__head");
        if (h) h.remove();
      }
      if (delta) {
        // `.c-kpi` has no `__delta` element. The guide's card puts a `.c-delta`
        // inside `.c-kpi__foot`, beside the note, so the foot is built here and
        // the delta is carried by the block that owns it.
        const f = this.ensure(".c-kpi__foot", () => { const el = document.createElement("div"); el.className = "c-kpi__foot"; return el; });
        const d = f.querySelector(".c-delta") || document.createElement("span");
        if (!d.parentNode) f.insertBefore(d, f.firstChild);
        d.className = "c-delta c-delta--" + (this.getAttribute("direction") || "up");
        d.textContent = delta;
      } else {
        const d = this.querySelector(".c-kpi__foot .c-delta");
        if (d) d.remove();
      }
      const note = this.getAttribute("note");
      if (note) {
        const f = this.ensure(".c-kpi__foot", () => { const el = document.createElement("div"); el.className = "c-kpi__foot"; return el; });
        const n = f.querySelector(".c-kpi__note") || (() => { const el = document.createElement("span"); el.className = "c-kpi__note"; f.appendChild(el); return el; })();
        n.textContent = note;
      } else {
        const n = this.querySelector(".c-kpi__note");
        if (n) n.remove();
      }
      const unit = this.getAttribute("unit");
      if (unit) {
        const v = this.querySelector(".c-kpi__value");
        if (v) {
          let u = v.querySelector(".c-kpi__unit");
          if (!u) { u = document.createElement("span"); u.className = "c-kpi__unit"; v.appendChild(u); }
          u.textContent = unit;
        }
      }
    }
  }
  define("contour-kpi", ContourKpi);
class ContourTable extends ContourBase {
    static get observed() { return ["columns", "rows"]; }
    static get properties() { return { columns: { attribute: "columns" }, rows: { attribute: "rows" } }; }
    render() {
      // The host is not a <table>, so it carries no table rule. The scroller the
      // reflow contract requires is a real block element inside it.
      const columns = this.getAttribute("columns");
      const rows = this.getAttribute("rows");
      if (columns && rows) {
        try {
          const cols = JSON.parse(columns);
          const data = JSON.parse(rows);
          const wrap = this.ensure(".c-table-wrap", () => { const el = document.createElement("div"); el.className = "c-table-wrap"; return el; });
          // Reuse the existing table when columns are unchanged, rebuilding
          // only the body. This avoids O(n) DOM churn on row-only updates.
          const colsKey = JSON.stringify(cols);
          const table = (wrap.querySelector("table.c-table") && this._tableCols === colsKey)
            ? wrap.querySelector("table.c-table")
            : (() => {
                const t = document.createElement("table");
                t.className = "c-table";
                const thead = document.createElement("thead");
                const tr = document.createElement("tr");
                cols.forEach((c) => {
                  const colLabel = typeof c === "string" ? c : (c.label || c.title || c);
                  const th = document.createElement("th");
                  if (typeof c === "object" && c !== null && c.sort) {
                    th.setAttribute("aria-sort", c.sort === true ? "none" : c.sort);
                    const wrap = document.createElement("span");
                    wrap.className = "c-table__sort";
                    wrap.textContent = colLabel;
                    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    svg.setAttribute("aria-hidden", "true");
                    svg.innerHTML = '<use href="#i-chevron-down" />';
                    wrap.appendChild(svg);
                    th.appendChild(wrap);
                  } else if (typeof c === "object" && c !== null && c.pinned) {
                    th.className = "c-table__pinned";
                    th.textContent = colLabel;
                  } else {
                    th.textContent = colLabel;
                  }
                  if (typeof c === "object" && c !== null && c.select) {
                    th.className = (th.className + " c-table__select").trim();
                  }
                  tr.appendChild(th);
                });
                thead.appendChild(tr);
                t.appendChild(thead);
                t.appendChild(document.createElement("tbody"));
                return t;
              })();
          this._tableCols = colsKey;
          const tbody = table.querySelector("tbody");
          tbody.innerHTML = "";
          data.forEach((row) => {
            const tr = document.createElement("tr");
            row.forEach((cell) => {
              const td = document.createElement("td");
              td.textContent = cell;
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });
          if (table.parentNode !== wrap) {
            wrap.innerHTML = "";
            wrap.appendChild(table);
          }
          if (wrap.parentNode !== this) this.appendChild(wrap);
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-table", ContourTable);
class ContourChart extends ContourBase {
    static get observed() { return ["series", "axis"]; }
    static get properties() { return { series: { attribute: "series" }, axis: { attribute: "axis" } }; }
    render() {
      this.classList.add("c-chart");
      const axis = this.getAttribute("axis");
      if (axis) {
        const ax = this.ensure(".c-chart__axis", () => { const el = document.createElement("div"); el.className = "c-chart__axis"; return el; });
        ax.textContent = axis;
      } else {
        const ax = this.querySelector(".c-chart__axis");
        if (ax) ax.remove();
      }
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
class ContourComparison extends ContourBase {
    static get observed() { return ["divider"]; }
    static get properties() { return { divider: { attribute: "divider" } }; }
    render() {
      this.classList.add("c-comparison");
      const divider = this.getAttribute("divider");
      if (divider !== null) {
        const d = this.ensure(".c-comparison__divider", () => { const el = document.createElement("div"); el.className = "c-comparison__divider"; return el; });
        if (divider) d.textContent = divider;
      } else {
        const d = this.querySelector(".c-comparison__divider");
        if (d) d.remove();
      }
    }
  }
  define("contour-comparison", ContourComparison);
class ContourStreamingChart extends ContourBase {
    static get observed() { return ["line", "dot"]; }
    static get properties() { return { line: { attribute: "line" }, dot: { attribute: "dot" } }; }
    render() {
      this.classList.add("c-streaming-chart");
      const line = this.getAttribute("line");
      if (line) {
        let svg = this.querySelector("svg");
        if (!svg) {
          svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("viewBox", "0 0 300 192");
          svg.setAttribute("aria-hidden", "true");
          this.appendChild(svg);
        }
        let path = svg.querySelector(".c-streaming-chart__line");
        if (!path) {
          path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("class", "c-streaming-chart__line");
          svg.appendChild(path);
        }
        path.setAttribute("d", line);
        const dot = this.getAttribute("dot");
        if (dot) {
          let circle = svg.querySelector(".c-streaming-chart__live-dot");
          if (!circle) {
            circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("class", "c-streaming-chart__live-dot");
            circle.setAttribute("r", "4");
            svg.appendChild(circle);
          }
          const parts = dot.split(/[ ,]+/);
          if (parts.length >= 2) {
            circle.setAttribute("cx", parts[0]);
            circle.setAttribute("cy", parts[1]);
          }
        }
      }
    }
  }
  define("contour-streaming-chart", ContourStreamingChart);
class ContourMeter extends ContourBase {
    static get observed() { return ["value", "label", "variant"]; }
    static get properties() { return { value: { attribute: "value" }, label: { attribute: "label" }, variant: { attribute: "variant" } }; }
    render() {
      this.classList.add("c-meter");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-meter--")) this.classList.remove(c); });
      const value = this.getAttribute("value");
      const label = this.getAttribute("label") || "";
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-meter--" + variant);
      if (value === null) {
        this.style.removeProperty("--meter-value");
      } else {
        this.style.setProperty("--meter-value", value);
      }
      const core = this.ensure(".c-meter__core", () => { const el = document.createElement("span"); el.className = "c-meter__core"; return el; });
      let val = core.querySelector(".c-meter__value");
      if (!val) { val = document.createElement("span"); val.className = "c-meter__value"; core.appendChild(val); }
      const num = parseFloat(value);
      val.textContent = (Number.isFinite(num) ? Math.round(num * 100) : 0) + "%";
      if (label) {
        const lbl = core.querySelector(".c-meter__label") || (() => { const el = document.createElement("span"); el.className = "c-meter__label"; core.appendChild(el); return el; })();
        lbl.textContent = label;
      }
      if (!this.hasAttribute("role")) this.setAttribute("role", "meter");
      const ariaValue = value === null ? "0" : value;
      const prevVal = this._meterAriaValue;
      if (!this.hasAttribute("aria-valuenow") || this.getAttribute("aria-valuenow") === prevVal) {
        this.setAttribute("aria-valuenow", ariaValue);
        this._meterAriaValue = ariaValue;
      }
      if (!this.hasAttribute("aria-valuemin")) this.setAttribute("aria-valuemin", "0");
      if (!this.hasAttribute("aria-valuemax")) this.setAttribute("aria-valuemax", "1");
    }
  }
  define("contour-meter", ContourMeter);
class ContourDelta extends ContourBase {
    static get observed() { return ["value", "direction"]; }
    static get properties() { return { value: { attribute: "value" }, direction: { attribute: "direction" } }; }
    render() {
      this.classList.add("c-delta");
      const value = this.getAttribute("value") || "";
      const direction = this.getAttribute("direction") || "up";
      // `.c-delta` carries no `__arrow` or `__value` element: `.c-delta svg` is
      // the rule the block defines, so the arrow is a sprite icon and the number
      // is a text node. The direction is a state modifier, never a node.
      this.classList.add("c-delta--" + direction);
      const icon = { up: "#i-arrow-up", down: "#i-arrow-down", flat: "#i-minus" }[direction] || "#i-arrow-up";
      // The base class drops every node this render appended before running
      // again, so the icon and the text are rebuilt, not guarded.
      this.querySelectorAll("svg").forEach((s) => s.remove());
      if (value) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("aria-hidden", "true");
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttribute("href", icon);
        svg.appendChild(use);
        this.appendChild(svg);
        this.appendChild(document.createTextNode(" " + value));
      }
    }
  }
  define("contour-delta", ContourDelta);
class ContourStat extends ContourBase {
    static get observed() { return ["value", "label", "delta", "unit"]; }
    static get properties() { return { value: { attribute: "value" }, label: { attribute: "label" }, delta: { attribute: "delta" }, unit: { attribute: "unit" } }; }
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
      const unit = this.getAttribute("unit");
      if (unit) {
        const v = this.querySelector(".c-stat__value");
        if (v) {
          let u = v.querySelector(".c-stat__unit");
          if (!u) { u = document.createElement("span"); u.className = "c-stat__unit"; v.appendChild(u); }
          u.textContent = unit;
        }
      }
    }
  }
  define("contour-stat", ContourStat);
class ContourInstrument extends ContourBase {
    static get observed() { return ["rows"]; }
    static get properties() { return { rows: { attribute: "rows" } }; }
    render() {
      this.classList.add("c-instrument");
      // The block's two parts are `__item` and `__value`: the label is the text
      // the item opens with, and the value is the span inside it. There is no
      // `__row` and no `__key` — the separators between items are CSS `::before`.
      Array.from(this.querySelectorAll(".c-instrument__item")).forEach((n) => n.remove());
      const rows = this.getAttribute("rows");
      if (rows) {
        try {
          const parsed = JSON.parse(rows);
          parsed.forEach((r) => {
            const item = document.createElement("span");
            item.className = "c-instrument__item";
            item.appendChild(document.createTextNode(String(r.key || r[0] || "")));
            const val = document.createElement("span");
            val.className = "c-instrument__value";
            val.textContent = r.value || r[1] || "";
            item.appendChild(val);
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-instrument", ContourInstrument);
class ContourBivariate extends ContourBase {
    static get observed() { return ["size", "axis-x", "axis-y"]; }
    static get properties() { return { size: { attribute: "size" }, axisX: { attribute: "axis-x" }, axisY: { attribute: "axis-y" } }; }
    render() {
      this.classList.add("c-bivariate");
      const size = Math.min(12, Math.max(1, parseInt(this.getAttribute("size") || "3", 10) || 3));
      const matrix = this.ensure(".c-bivariate__matrix", () => { const el = document.createElement("div"); el.className = "c-bivariate__matrix"; return el; });
      matrix.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      matrix.innerHTML = "";
      for (let i = 0; i < size * size; i++) {
        const cell = document.createElement("div");
        cell.className = "c-bivariate__cell";
        matrix.appendChild(cell);
      }
      const axisX = this.getAttribute("axis-x");
      if (axisX) {
        const ax = this.ensure(".c-bivariate__axis--x", () => { const el = document.createElement("div"); el.className = "c-bivariate__axis c-bivariate__axis--x"; return el; });
        ax.textContent = axisX;
      } else {
        const ax = this.querySelector(".c-bivariate__axis--x");
        if (ax) ax.remove();
      }
      const axisY = this.getAttribute("axis-y");
      if (axisY) {
        const ay = this.ensure(".c-bivariate__axis--y", () => { const el = document.createElement("div"); el.className = "c-bivariate__axis c-bivariate__axis--y"; return el; });
        ay.textContent = axisY;
      } else {
        const ay = this.querySelector(".c-bivariate__axis--y");
        if (ay) ay.remove();
      }
    }
  }
  define("contour-bivariate", ContourBivariate);
class ContourSurvey extends ContourBase {
    static get observed() { return ["date", "instrument"]; }
    static get properties() { return { date: { attribute: "date" }, instrument: { attribute: "instrument" } }; }
    render() {
      this.classList.add("c-survey");
      // Drop previously generated nodes so a re-render cannot stack a second set.
      Array.from(this.childNodes).forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) { if (n.textContent.trim() === "Surveyed" || n.textContent.trim() === "·") n.remove(); }
        else if (n.classList && (n.classList.contains("c-survey__value") || n.classList.contains("c-survey__sep"))) n.remove();
      });
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
class ContourThreshold extends ContourBase {
    static get observed() { return ["label", "norm", "state", "value"]; }
    static get properties() { return { label: { attribute: "label" }, norm: { attribute: "norm" }, state: { attribute: "state" }, value: { attribute: "value" } }; }
    render() {
      this.classList.add("c-threshold");
      // The sheet reads this block through custom properties and a state
      // attribute — `.c-threshold__fill { inline-size: var(--value) }`,
      // `.c-threshold__target { inset-inline-start: var(--target) }` and
      // `.c-threshold[data-state="…"]` — so the element sets those, not text.
      const value = this.getAttribute("value");
      const target = this.getAttribute("norm");
      const state = this.getAttribute("state");
      const label = this.getAttribute("label");
      const pct = (v) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return String(v);
        return (n <= 1 ? n * 100 : n) + "%";
      };
      if (value) {
        const v = this.ensure(".c-threshold__fill", () => { const el = document.createElement("span"); el.className = "c-threshold__fill"; return el; });
        v.style.setProperty("--value", pct(value));
      } else {
        const v = this.querySelector(".c-threshold__fill");
        if (v) v.remove();
      }
      if (target) {
        const t = this.ensure(".c-threshold__target", () => { const el = document.createElement("span"); el.className = "c-threshold__target"; return el; });
        t.style.setProperty("--target", pct(target));
      } else {
        const t = this.querySelector(".c-threshold__target");
        if (t) t.remove();
      }
      if (state) this.setAttribute("data-state", state);
      else this.removeAttribute("data-state");
      if (label) this.setAttribute("aria-label", label);
    }
  }
  define("contour-threshold", ContourThreshold);
class ContourMetricsFull extends ContourBase {
    render() { this.classList.add("c-metrics"); }
  }
  define("contour-metrics", ContourMetricsFull);
class ContourLegend extends ContourBase {
    static get observed() { return ["title", "ramp", "scale", "items", "method", "norm"]; }
    static get properties() { return { title: { attribute: "title" }, ramp: { attribute: "ramp" }, scale: { attribute: "scale" }, items: { attribute: "items" }, method: { attribute: "method" }, norm: { attribute: "norm" } }; }
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
      const ramp = this.getAttribute("ramp");
      if (ramp) {
        const r = this.ensure(".c-legend__ramp", () => { const el = document.createElement("div"); el.className = "c-legend__ramp"; return el; });
        r.style.background = ramp;
      } else {
        const r = this.querySelector(".c-legend__ramp");
        if (r) r.remove();
      }
      const scale = this.getAttribute("scale");
      if (scale) {
        const sc = this.ensure(".c-legend__scale", () => { const el = document.createElement("div"); el.className = "c-legend__scale"; return el; });
        sc.textContent = scale;
      } else {
        const sc = this.querySelector(".c-legend__scale");
        if (sc) sc.remove();
      }
    }
  }
  define("contour-legend", ContourLegend);
class ContourMeasure extends ContourBase {
    static get observed() { return ["label", "value", "point", "line"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" }, point: { attribute: "point" }, line: { attribute: "line" } }; }
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
      const point = this.getAttribute("point");
      if (point) {
        const p = this.ensure(".c-measure__point", () => { const el = document.createElement("span"); el.className = "c-measure__point"; return el; });
        p.textContent = point;
      } else {
        const p = this.querySelector(".c-measure__point");
        if (p) p.remove();
      }
      const line = this.getAttribute("line");
      if (line) {
        const ln = this.ensure(".c-measure__line", () => { const el = document.createElement("span"); el.className = "c-measure__line"; return el; });
        ln.style.inlineSize = line;
      } else {
        const ln = this.querySelector(".c-measure__line");
        if (ln) ln.remove();
      }
    }
  }
  define("contour-measure", ContourMeasure);
class ContourTimeline extends ContourBase {
    static get observed() { return ["items"]; }
    static get properties() { return { items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-timeline");
      // Drop previously generated items so a re-render cannot stack a second set.
      Array.from(this.querySelectorAll(".c-timeline__item")).forEach((n) => n.remove());
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
class ContourHeatmap extends ContourBase {
    static get observed() { return ["cells", "count", "legend"]; }
    static get properties() { return { cells: { attribute: "cells" }, count: { attribute: "count" }, legend: { attribute: "legend" } }; }
    render() {
      this.classList.add("c-heatmap");
      // Drop previously generated cells so a re-render cannot stack a second set.
      Array.from(this.querySelectorAll(".c-heatmap__cell")).forEach((n) => n.remove());
      const count = Math.min(200, Math.max(0, parseInt(this.getAttribute("cells") || this.getAttribute("count") || "0", 10) || 0));
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const cell = document.createElement("div");
          cell.className = "c-heatmap__cell";
          this.appendChild(cell);
        }
      }
      if (this.hasAttribute("legend")) {
        const leg = this.ensure(".c-heatmap__legend", () => {
          const el = document.createElement("div");
          el.className = "c-heatmap__legend";
          const bar = document.createElement("div");
          bar.className = "c-heatmap__legend-bar";
          el.appendChild(bar);
          return el;
        });
      } else {
        const leg = this.querySelector(".c-heatmap__legend");
        if (leg) leg.remove();
      }
    }
  }
  define("contour-heatmap", ContourHeatmap);
class ContourCompare extends ContourBase {
    static get observed() { return ["no", "text", "yes"]; }
    static get properties() { return { no: { attribute: "no" }, text: { attribute: "text" }, yes: { attribute: "yes" } }; }
    render() {
      this.classList.add("c-compare");
      // Drop previously generated children so a re-render cannot stack a second set.
      Array.from(this.querySelectorAll(".c-compare__yes, .c-compare__no, .c-compare__text")).forEach((n) => n.remove());
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
class ContourSparkline extends ContourBase {
    static get observed() { return ["points"]; }
    static get properties() { return { points: { attribute: "points" } }; }
    render() {
      this.classList.add("c-sparkline");
      const points = this.getAttribute("points");
      if (points) {
        try {
          const parsed = JSON.parse(points);
          Array.from(this.querySelectorAll(".c-sparkline__dot, .c-sparkline__line, .c-sparkline__area")).forEach((n) => n.remove());
          const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("class", "c-sparkline__line");
          svg.setAttribute("viewBox", "0 0 100 30");
          svg.setAttribute("preserveAspectRatio", "none");
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", parsed.map((p, i) => (i === 0 ? "M" : "L") + " " + (i * 100 / (parsed.length - 1)) + " " + (30 - p * 30)).join(" "));
          svg.appendChild(path);
          this.appendChild(svg);
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-sparkline", ContourSparkline);
class ContourChartGrid extends ContourBase { render() { this.classList.add("c-chart-grid"); } }
  define("contour-chart-grid", ContourChartGrid);
class ContourContourPlot extends ContourBase {
    static get observed() { return ["axis", "label"]; }
    static get properties() { return { axis: { attribute: "axis" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-contour-plot");
      const axis = this.getAttribute("axis");
      if (axis) {
        let svg = this.querySelector("svg");
        if (!svg) {
          svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("viewBox", "0 0 100 100");
          svg.setAttribute("aria-hidden", "true");
          this.appendChild(svg);
        }
        let ax = svg.querySelector(".c-contour-plot__axis");
        if (!ax) {
          ax = document.createElementNS("http://www.w3.org/2000/svg", "line");
          ax.setAttribute("class", "c-contour-plot__axis");
          svg.appendChild(ax);
        }
      }
      const label = this.getAttribute("label");
      if (label) {
        let svg = this.querySelector("svg");
        if (!svg) {
          svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("viewBox", "0 0 100 100");
          svg.setAttribute("aria-hidden", "true");
          this.appendChild(svg);
        }
        let lbl = svg.querySelector(".c-contour-plot__label");
        if (!lbl) {
          lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
          lbl.setAttribute("class", "c-contour-plot__label");
          svg.appendChild(lbl);
        }
        lbl.textContent = label;
      }
    }
  }
  define("contour-contour-plot", ContourContourPlot);
