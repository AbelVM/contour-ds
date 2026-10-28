import { ContourBase, define, onDispose, formatValue } from './core.mjs';
import { loadRemote, remoteData, renderStates, renderEmpty, wireStates, remoteInvalidate } from './states.mjs';
import { donutSlices, barRects, smoothPath, polylinePoints } from './svg.mjs';
class ContourReadout extends ContourBase {
    static get observed() { return ["rows", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "format", "locale"]; }
    static get properties() { return { rows: { attribute: "rows" }, format: { attribute: "format" }, locale: { attribute: "locale" } }; }
    render() {
      this.classList.add("c-readout");
      wireStates(this);
      loadRemote(this, "rows");
      if (renderStates(this, "readout")) return;
      const rows = remoteData(this, "rows");
      // Drop previously generated rows so a re-render cannot stack a second set.
      Array.from(this.querySelectorAll(".c-readout__row")).forEach((n) => n.remove());
      const authored = Array.from(this.children).filter((n) => !n.classList || !n.classList.contains("c-readout__row"));
      if (rows && !authored.length) {
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
            val.textContent = formatValue(r.value || r[1], this.getAttribute("format"), this.getAttribute("locale"));
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
      } else if (!rows && !authored.length) {
        renderEmpty(this, "readout");
      }
    }
  }
define("contour-readout", ContourReadout);
class ContourKpi extends ContourBase {
    static get observed() { return ["value", "label", "delta", "direction", "note", "variant", "unit", "format", "locale", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() {
      return { value: { attribute: "value" }, label: { attribute: "label" }, delta: { attribute: "delta" }, direction: { attribute: "direction" }, note: { attribute: "note" }, variant: { attribute: "variant" }, unit: { attribute: "unit" }, format: { attribute: "format" }, locale: { attribute: "locale" } };
    }
    render() {
      this.classList.add("c-kpi");
      wireStates(this);
      loadRemote(this, ["value", "label"]);
      if (renderStates(this, "kpi")) return;
      const value = remoteData(this, "value");
      const label = remoteData(this, "label");
      const delta = this.getAttribute("delta");
      const variant = this.getAttribute("variant");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-kpi--")) this.classList.remove(c); });
      if (variant) this.classList.add("c-kpi--" + variant);
      if (value) {
        const v = this.ensure(".c-kpi__value", () => { const el = document.createElement("div"); el.className = "c-kpi__value"; return el; });
        v.textContent = formatValue(value, this.getAttribute("format"), this.getAttribute("locale"));
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
      const v = this.querySelector(".c-kpi__value");
      if (v) {
        if (unit) {
          let u = v.querySelector(".c-kpi__unit");
          if (!u) { u = document.createElement("span"); u.className = "c-kpi__unit"; v.appendChild(u); }
          u.textContent = unit;
        } else {
          const u = v.querySelector(".c-kpi__unit");
          if (u) u.remove();
        }
      }
      if (!value && !label) {
        renderEmpty(this, "kpi");
      }
    }
  }
define("contour-kpi", ContourKpi);
class ContourTable extends ContourBase {
    static get observed() { return ["columns", "rows", "page", "page-size", "sort", "sort-dir", "virtual", "empty", "loading", "error", "retry", "skeleton"]; }
    static get properties() { return { columns: { attribute: "columns" }, rows: { attribute: "rows" }, page: { attribute: "page", type: Number }, pageSize: { attribute: "page-size", type: Number } }; }
    _cellValue(cell) {
      if (cell === null || cell === undefined) return "";
      if (typeof cell === "object") return cell.value !== undefined ? cell.value : (cell.label !== undefined ? cell.label : JSON.stringify(cell));
      return cell;
    }
    _compare(a, b, type) {
      const av = this._cellValue(a);
      const bv = this._cellValue(b);
      if (type === "number" || type === "numeric") {
        return (parseFloat(av) || 0) - (parseFloat(bv) || 0);
      }
      return String(av).localeCompare(String(bv), undefined, { numeric: true });
    }
    render() {
      // The host is not a <table>, so it carries no table rule. The scroller the
      // reflow contract requires is a real block element inside it.
      const columns = this.getAttribute("columns");
      const rows = this.getAttribute("rows");
      // Slot composition: an authored table wins over the JSON attributes.
      const authored = Array.from(this.children).filter((n) => !n.classList || !n.classList.contains("c-table-wrap"));
      if (columns && rows && !authored.length) {
        try {
          const cols = JSON.parse(columns);
          const data = JSON.parse(rows);
          // Loading state: show a spinner row instead of data.
          if (this.hasAttribute("loading")) {
            const wrap = this.ensure(".c-table-wrap", () => { const el = document.createElement("div"); el.className = "c-table-wrap"; return el; });
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
                    th.textContent = colLabel;
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
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = cols.length;
            td.style.textAlign = "center";
            td.style.color = "var(--color-text-muted)";
            td.textContent = this.getAttribute("loading") || "Loading…";
            tr.appendChild(td);
            tbody.appendChild(tr);
            if (table.parentNode !== wrap) { wrap.innerHTML = ""; wrap.appendChild(table); }
            if (wrap.parentNode !== this) this.appendChild(wrap);
            const footer = this.querySelector(".c-table__pagination");
            if (footer) footer.remove();
            return;
          }
          if (this.hasAttribute("error")) {
            const wrap = this.ensure(".c-table-wrap", () => { const el = document.createElement("div"); el.className = "c-table-wrap"; return el; });
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
                    th.textContent = colLabel;
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
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = cols.length;
            td.textContent = this.getAttribute("error") || "Error";
            td.style.textAlign = "center";
            td.style.color = "var(--color-danger, var(--color-text))";
            if (this.hasAttribute("retry")) {
              const btn = document.createElement("button");
              btn.className = "c-btn c-btn--ghost c-btn--sm";
              btn.type = "button";
              btn.textContent = this.getAttribute("retry") || "Retry";
              btn.style.marginInlineStart = "var(--space-sm)";
              btn.dataset.action = "retry";
              td.appendChild(btn);
            }
            tr.appendChild(td);
            tbody.appendChild(tr);
            if (table.parentNode !== wrap) { wrap.innerHTML = ""; wrap.appendChild(table); }
            if (wrap.parentNode !== this) this.appendChild(wrap);
            const footer = this.querySelector(".c-table__pagination");
            if (footer) footer.remove();
            return;
          }
          if (this.hasAttribute("skeleton")) {
            const wrap = this.ensure(".c-table-wrap", () => { const el = document.createElement("div"); el.className = "c-table-wrap"; return el; });
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
                    th.textContent = colLabel;
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
            const count = Math.min(5, Math.max(1, parseInt(this.getAttribute("skeleton") || "3", 10) || 3));
            for (let i = 0; i < count; i++) {
              const tr = document.createElement("tr");
              cols.forEach(() => {
                const td = document.createElement("td");
                const sk = document.createElement("span");
                sk.className = "c-skeleton";
                sk.style.display = "inline-block";
                sk.style.inlineSize = "60%";
                sk.style.blockSize = "0.8rem";
                td.appendChild(sk);
                tr.appendChild(td);
              });
              tbody.appendChild(tr);
            }
            if (table.parentNode !== wrap) { wrap.innerHTML = ""; wrap.appendChild(table); }
            if (wrap.parentNode !== this) this.appendChild(wrap);
            const footer = this.querySelector(".c-table__pagination");
            if (footer) footer.remove();
            return;
          }
          // Initialise sort state from attributes on first render.
          if (this._sortCol === undefined) {
            const sortAttr = this.getAttribute("sort");
            if (sortAttr !== null) {
              const idx = Number(sortAttr);
              this._sortCol = Number.isFinite(idx) ? idx : cols.findIndex((c) => (typeof c === "object" && c && (c.label || c.title || c) === sortAttr));
              if (this._sortCol < 0) this._sortCol = null;
            } else {
              this._sortCol = null;
            }
            const dirAttr = this.getAttribute("sort-dir");
            this._sortDir = dirAttr === "descending" || dirAttr === "desc" ? -1 : 1;
          }
          // Apply sort.
          let working = Array.isArray(data) ? data.slice() : [];
          if (this._sortCol !== null && this._sortCol !== undefined && this._sortCol >= 0 && this._sortCol < cols.length) {
            const col = this._sortCol;
            const dir = this._sortDir || 1;
            const colSpec = cols[col];
            const type = (typeof colSpec === "object" && colSpec && colSpec.sortType) ? colSpec.sortType : "text";
            working.sort((a, b) => this._compare(a && a[col], b && b[col], type) * dir);
          }
          // Pagination.
          const pageSizeRaw = this.getAttribute("page-size");
          const pageSize = pageSizeRaw !== null ? parseInt(pageSizeRaw, 10) : NaN;
          const usePaging = Number.isFinite(pageSize) && pageSize > 0;
          // Sync internal page state with external attribute changes.
          const pageAttr = this.getAttribute("page");
          if (this._pageInternal) {
            this._pageInternal = false;
            this._pageAttrLast = pageAttr;
          } else if (pageAttr !== this._pageAttrLast) {
            this._page = null;
            this._pageAttrLast = pageAttr;
          }
          let page = this._page !== null ? this._page : (parseInt(pageAttr || "1", 10));
          if (!Number.isFinite(page) || page < 1) page = 1;
          let totalPages = 1;
          let pageData = working;
          if (usePaging) {
            totalPages = Math.max(1, Math.ceil(working.length / pageSize));
            if (page > totalPages) page = totalPages;
            const start = (page - 1) * pageSize;
            pageData = working.slice(start, start + pageSize);
          }
          this._page = page;
          this._totalPages = totalPages;
          this._pageSize = pageSize;

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
                cols.forEach((c, i) => {
                  const colLabel = typeof c === "string" ? c : (c.label || c.title || c);
                  const th = document.createElement("th");
                  const sortable = (typeof c === "object" && c !== null && c.sort);
                  if (sortable) {
                    th.setAttribute("aria-sort", (this._sortCol === i)
                      ? (this._sortDir === -1 ? "descending" : "ascending")
                      : "none");
                    const wrapEl = document.createElement("span");
                    wrapEl.className = "c-table__sort";
                    wrapEl.textContent = colLabel;
                    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    svg.setAttribute("aria-hidden", "true");
                    svg.innerHTML = '<use href="#i-chevron-down" />';
                    wrapEl.appendChild(svg);
                    th.appendChild(wrapEl);
                  } else if (typeof c === "object" && c !== null && c.pinned) {
                    th.className = "c-table__pinned";
                    th.textContent = colLabel;
                  } else {
                    th.textContent = colLabel;
                  }
                  if (typeof c === "object" && c !== null && c.select) {
                    th.className = (th.className + " c-table__select").trim();
                  }
                  if (sortable) {
                    th.setAttribute("tabindex", "0");
                    th.setAttribute("role", "columnheader");
                    th.dataset.sortIndex = String(i);
                  }
                  tr.appendChild(th);
                });
                thead.appendChild(tr);
                t.appendChild(thead);
                t.appendChild(document.createElement("tbody"));
                return t;
              })();
          this._tableCols = colsKey;
          // Keep sort indicators in sync even when the table element is reused.
          cols.forEach((c, i) => {
            if (typeof c === "object" && c !== null && c.sort) {
              const th = table.querySelector("thead tr th:nth-child(" + (i + 1) + ")");
              if (th) th.setAttribute("aria-sort", (this._sortCol === i) ? (this._sortDir === -1 ? "descending" : "ascending") : "none");
            }
          });
          const tbody = table.querySelector("tbody");
          tbody.innerHTML = "";
          if (pageData.length === 0) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = cols.length;
            td.textContent = this.getAttribute("empty") || "No data";
            td.style.textAlign = "center";
            td.style.color = "var(--color-text-muted)";
            tr.appendChild(td);
            tbody.appendChild(tr);
          } else {
            pageData.forEach((row) => {
              const tr = document.createElement("tr");
              row.forEach((cell) => {
                const td = document.createElement("td");
                td.textContent = this._cellValue(cell);
                tr.appendChild(td);
              });
              tbody.appendChild(tr);
            });
          }
          if (table.parentNode !== wrap) {
            wrap.innerHTML = "";
            wrap.appendChild(table);
          }
          if (wrap.parentNode !== this) this.appendChild(wrap);
          // Optional virtualization: native content-visibility windowing for
          // large datasets, without a JS scroll handler. Opt-in via `virtual`.
          if (this.hasAttribute("virtual")) {
            wrap.style.maxHeight = wrap.style.maxHeight || "24rem";
            wrap.style.overflow = "auto";
            table.classList.add("c-table--virtual");
            Array.from(tbody.querySelectorAll("tr")).forEach((tr) => {
              tr.style.contentVisibility = "auto";
              tr.style.containIntrinsicSize = "auto 2rem";
            });
          } else {
            wrap.style.maxHeight = "";
            wrap.style.overflow = "";
            table.classList.remove("c-table--virtual");
          }
          // Pagination footer.
          if (usePaging) {
            const footer = this.ensure(".c-table__pagination", () => { const el = document.createElement("div"); el.className = "c-table__pagination"; return el; });
            footer.innerHTML = "";
            const prev = document.createElement("button");
            prev.className = "c-btn c-btn--ghost c-btn--sm";
            prev.type = "button";
            prev.textContent = "Previous";
            prev.disabled = page <= 1;
            prev.dataset.action = "prev";
            const info = document.createElement("span");
            info.textContent = `Page ${page} of ${totalPages}`;
            const next = document.createElement("button");
            next.className = "c-btn c-btn--ghost c-btn--sm";
            next.type = "button";
            next.textContent = "Next";
            next.disabled = page >= totalPages;
            next.dataset.action = "next";
            footer.appendChild(prev);
            footer.appendChild(info);
            footer.appendChild(next);
          } else {
            const footer = this.querySelector(".c-table__pagination");
            if (footer) footer.remove();
          }
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredTable) return;
      this._wiredTable = true;
      const handleSort = (th) => {
        const idx = Number(th.dataset.sortIndex);
        if (!Number.isFinite(idx)) return;
        if (this._sortCol === idx) {
          this._sortDir = (this._sortDir === 1) ? -1 : 1;
        } else {
          this._sortCol = idx;
          this._sortDir = 1;
        }
        this.dispatchEvent(new CustomEvent("contour:sort", { bubbles: true, composed: true, detail: { column: idx, direction: this._sortDir === 1 ? "ascending" : "descending" } }));
        this.requestRender();
      };
      this.addEventListener("click", (e) => {
        const retryBtn = e.target && e.target.closest ? e.target.closest('button[data-action="retry"]') : null;
        if (retryBtn && this.contains(retryBtn)) {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:retry", { detail: { src: this.getAttribute("src") }, bubbles: true, composed: true }));
          return;
        }
        const th = e.target && e.target.closest ? e.target.closest("th[aria-sort]") : null;
        if (th && this.contains(th)) {
          e.preventDefault();
          handleSort(th);
          return;
        }
          const btn = e.target && e.target.closest ? e.target.closest(".c-table__pagination button") : null;
        if (btn && this.contains(btn)) {
          e.preventDefault();
          const action = btn.dataset.action;
          let page = this._page !== null ? this._page : (parseInt(this.getAttribute("page") || "1", 10));
          if (!Number.isFinite(page) || page < 1) page = 1;
          if (action === "prev" && page > 1) page -= 1;
          if (action === "next") page += 1;
          this._page = page;
          this._pageAttrLast = String(page);
          // Mark the change as internal so the render sync preserves _page
          // instead of nulling it (B3-01). Trigger the re-render directly
          // rather than writing the observed `page` attribute, which would
          // re-enter the attributeChangedCallback and trip the wc-contract
          // re-entrancy guard.
          this._pageInternal = true;
          this.requestRender();
          this.dispatchEvent(new CustomEvent("contour:page", { bubbles: true, composed: true, detail: { page } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const th = e.target && e.target.closest ? e.target.closest("th[aria-sort]") : null;
        if (th && this.contains(th)) {
          e.preventDefault();
          handleSort(th);
        }
      });
    }
  }
  define("contour-table", ContourTable);
class ContourChart extends ContourBase {
    static get observed() { return ["series", "axis", "empty", "loading", "error", "retry", "skeleton"]; }
    static get properties() { return { series: { attribute: "series" }, axis: { attribute: "axis" } }; }
    render() {
      this.classList.add("c-chart");
      if (!this.hasAttribute("role")) this.setAttribute("role", "img");
      if (this.getAttribute("axis") && !this.hasAttribute("aria-label")) this.setAttribute("aria-label", this.getAttribute("axis"));
      if (this.hasAttribute("loading")) {
        const plot = this.ensure(".c-chart__plot", () => { const el = document.createElement("div"); el.className = "c-chart__plot"; return el; });
        plot.innerHTML = "";
        const loading = document.createElement("div");
        loading.className = "c-chart__loading";
        loading.textContent = this.getAttribute("loading") || "Loading…";
        loading.style.display = "grid";
        loading.style.placeItems = "center";
        loading.style.height = "100%";
        loading.style.color = "var(--color-text-muted)";
        plot.appendChild(loading);
        const axis = this.getAttribute("axis");
        if (axis) {
          const ax = this.ensure(".c-chart__axis", () => { const el = document.createElement("div"); el.className = "c-chart__axis"; return el; });
          ax.textContent = axis;
        }
        return;
      }
      if (this.hasAttribute("error")) {
        const plot = this.ensure(".c-chart__plot", () => { const el = document.createElement("div"); el.className = "c-chart__plot"; return el; });
        plot.innerHTML = "";
        const err = document.createElement("div");
        err.className = "c-chart__error";
        err.textContent = this.getAttribute("error") || "Error";
        err.style.display = "grid";
        err.style.placeItems = "center";
        err.style.height = "100%";
        err.style.color = "var(--color-danger, var(--color-text))";
        if (this.hasAttribute("retry")) {
          const btn = document.createElement("button");
          btn.className = "c-btn c-btn--ghost c-btn--sm";
          btn.type = "button";
          btn.textContent = this.getAttribute("retry") || "Retry";
          btn.dataset.action = "retry";
          btn.style.marginBlockStart = "var(--space-sm)";
          err.appendChild(btn);
        }
        plot.appendChild(err);
        const axis = this.getAttribute("axis");
        if (axis) {
          const ax = this.ensure(".c-chart__axis", () => { const el = document.createElement("div"); el.className = "c-chart__axis"; return el; });
          ax.textContent = axis;
        }
        return;
      }
      if (this.hasAttribute("skeleton")) {
        const plot = this.ensure(".c-chart__plot", () => { const el = document.createElement("div"); el.className = "c-chart__plot"; return el; });
        plot.innerHTML = "";
        const count = Math.min(5, Math.max(1, parseInt(this.getAttribute("skeleton") || "3", 10) || 3));
        for (let i = 0; i < count; i++) {
          const sk = document.createElement("div");
          sk.className = "c-skeleton";
          sk.style.display = "block";
          sk.style.inlineSize = "100%";
          sk.style.blockSize = "0.6rem";
          sk.style.marginBlockEnd = "var(--space-2xs)";
          plot.appendChild(sk);
        }
        const axis = this.getAttribute("axis");
        if (axis) {
          const ax = this.ensure(".c-chart__axis", () => { const el = document.createElement("div"); el.className = "c-chart__axis"; return el; });
          ax.textContent = axis;
        }
        return;
      }
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
           // Structured series: an item may carry `values` plus a `type`
           // ("donut" | "histogram" | "line") instead of a pre-computed `d`
           // path. The helpers in svg.mjs turn those into geometry so a
           // consumer does not have to hand-compute arc or bar math.
           const hasStructured = parsed.some((s) => s && Array.isArray(s.values));
           if (hasStructured) {
             parsed.forEach((s, i) => {
               const color = `var(--chart-${i + 1})`;
               if (s.type === "donut") {
                 const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                 svg.setAttribute("viewBox", "0 0 200 200");
                 svg.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%";
                 svg.setAttribute("aria-hidden", "true");
                  donutSlices(s.values).forEach((sl, si) => {
                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute("class", "c-chart__line");
                    path.setAttribute("data-series", String(i + 1));
                    path.style.setProperty("--c", color);
                    path.setAttribute("d", sl.path);
                    path.setAttribute("title", String(s.values[si]));
                    svg.appendChild(path);
                  });
                 plot.appendChild(svg);
               } else if (s.type === "histogram") {
                 const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                 svg.setAttribute("viewBox", "0 0 300 120");
                 svg.setAttribute("preserveAspectRatio", "none");
                 svg.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%";
                  barRects(s.values).forEach((r, ri) => {
                    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    rect.setAttribute("class", "c-chart__bar");
                    rect.setAttribute("data-series", String(i + 1));
                    rect.style.setProperty("--c", color);
                    rect.setAttribute("x", r.x);
                    rect.setAttribute("y", r.y);
                    rect.setAttribute("width", r.width);
                     rect.setAttribute("height", r.height);
                     rect.setAttribute("title", String(s.values[ri]));
                     rect.setAttribute("tabindex", "0");
                     rect.setAttribute("role", "button");
                     rect.dataset.index = String(ri);
                     svg.appendChild(rect);
                  });
                 plot.appendChild(svg);
               } else {
                 const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                 svg.setAttribute("viewBox", "0 0 300 120");
                 svg.setAttribute("preserveAspectRatio", "none");
                 svg.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%";
                 const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                 path.setAttribute("class", "c-chart__line");
                 path.setAttribute("data-series", String(i + 1));
                 path.style.setProperty("--c", color);
                 path.setAttribute("d", smoothPath(s.values));
                 svg.appendChild(path);
                 // Point markers for keyboard/click access.
                 const pts = polylinePoints(s.values).split(" ").map((p) => p.split(",").map(Number));
                 pts.forEach((pt, pi) => {
                   const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                   circle.setAttribute("class", "c-chart__point");
                   circle.setAttribute("data-series", String(i + 1));
                   circle.setAttribute("data-index", String(pi));
                   circle.style.setProperty("--c", color);
                   circle.setAttribute("cx", String(pt[0]));
                   circle.setAttribute("cy", String(pt[1]));
                   circle.setAttribute("r", "3");
                   circle.setAttribute("tabindex", pi === 0 ? "0" : "-1");
                   circle.setAttribute("role", "button");
                   circle.setAttribute("title", String(s.values[pi]));
                   svg.appendChild(circle);
                 });
                 plot.appendChild(svg);
               }
             });
           } else {
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
           }
          } catch (e) { /* keep existing */ }
          // Styled tooltip element (positioned via --chart-tip-*).
          const tip = this.ensure(".c-chart__tooltip", () => { const el = document.createElement("div"); el.className = "c-chart__tooltip"; el.setAttribute("role", "tooltip"); el.setAttribute("hidden", ""); return el; });
          tip.setAttribute("hidden", "");
         } else {
         const plot = this.ensure(".c-chart__plot", () => { const el = document.createElement("div"); el.className = "c-chart__plot"; return el; });
         plot.innerHTML = "";
         const empty = document.createElement("div");
         empty.className = "c-chart__empty";
         empty.textContent = this.getAttribute("empty") || "No data";
         empty.style.display = "grid";
         empty.style.placeItems = "center";
         empty.style.height = "100%";
         empty.style.color = "var(--color-text-muted)";
         plot.appendChild(empty);
       }
     }
    enhance() {
      if (this._wiredChart) return;
      this._wiredChart = true;
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      // Tooltip: show on hover of a mark.
      const showTip = (e) => {
        const plot = this.querySelector(".c-chart__plot");
        const tip = this.querySelector(".c-chart__tooltip");
        if (!plot || !tip) return;
        const mark = e.target && e.target.closest ? e.target.closest(".c-chart__bar, .c-chart__point, .c-chart__line") : null;
        if (!mark || !plot.contains(mark)) { tip.setAttribute("hidden", ""); return; }
        const title = mark.getAttribute("title");
        if (title) tip.textContent = title;
        const rect = plot.getBoundingClientRect();
        const mr = mark.getBoundingClientRect();
        const x = mr.left - rect.left + mr.width / 2;
        const y = mr.top - rect.top;
        plot.style.setProperty("--chart-tip-inline-start", x + "px");
        plot.style.setProperty("--chart-tip-block-start", y + "px");
        tip.removeAttribute("hidden");
      };
      const hideTip = () => {
        const tip = this.querySelector(".c-chart__tooltip");
        if (tip) tip.setAttribute("hidden", "");
      };
      // Host-delegated so the handlers survive re-renders (rule 12).
      this.addEventListener("mousemove", showTip);
      this.addEventListener("mouseleave", hideTip);
      // Keyboard path (BY-39): the marks already carry roving tabindex, so a
      // focused mark shows the same tooltip as a hovered one.
      this.addEventListener("focusin", (e) => {
        const mark = e.target && e.target.closest ? e.target.closest(".c-chart__bar, .c-chart__point, .c-chart__line") : null;
        if (mark && this.contains(mark)) showTip({ target: mark });
      });
      this.addEventListener("focusout", (e) => {
        if (!this.contains(e.relatedTarget)) hideTip();
      });
      // Per-bar keyboard/click handling for histogram bars (host-delegated).
      this.addEventListener("click", (e) => {
        const plot2 = this.querySelector(".c-chart__plot");
        if (!plot2) return;
        const bar = e.target && e.target.closest ? e.target.closest(".c-chart__bar") : null;
        if (bar && plot2.contains(bar)) {
            const series = parseInt(bar.getAttribute("data-series") || "1", 10);
            const index = parseInt(bar.dataset.index || "0", 10);
            this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series, index } }));
            return;
          }
          const point = e.target && e.target.closest ? e.target.closest(".c-chart__point") : null;
          if (point && plot2.contains(point)) {
            const series = parseInt(point.getAttribute("data-series") || "1", 10);
            const index = parseInt(point.dataset.index || "0", 10);
            this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series, index } }));
          }
        });
        this.addEventListener("keydown", (e) => {
          const plot2 = this.querySelector(".c-chart__plot");
          if (!plot2) return;
          const bar = e.target && e.target.closest ? e.target.closest(".c-chart__bar") : null;
          if (bar && plot2.contains(bar)) {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              const series = parseInt(bar.getAttribute("data-series") || "1", 10);
              const index = parseInt(bar.dataset.index || "0", 10);
              this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series, index } }));
            }
            return;
          }
          const point = e.target && e.target.closest ? e.target.closest(".c-chart__point") : null;
          if (point && plot2.contains(point)) {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              const series = parseInt(point.getAttribute("data-series") || "1", 10);
              const index = parseInt(point.dataset.index || "0", 10);
              this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series, index } }));
            } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              const points = Array.from(plot2.querySelectorAll('.c-chart__point[data-series="' + point.getAttribute("data-series") + '"]'));
              const idx = points.indexOf(point);
              const next = e.key === "ArrowRight" ? Math.min(idx + 1, points.length - 1) : Math.max(idx - 1, 0);
              if (next !== idx && points[next]) {
                points.forEach((p, i) => p.setAttribute("tabindex", i === next ? "0" : "-1"));
                try { points[next].focus(); } catch (err) {}
              }
            }
          }
        });
      // Retry button handling.
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest('button[data-action="retry"]') : null;
        if (btn && this.contains(btn)) {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:retry", { detail: { src: this.getAttribute("src") }, bubbles: true, composed: true }));
        }
      });
      this.addEventListener("keydown", (e) => {
        // Only the host itself drives series switching; marks handle their own
        // keys (B3-03). Without this gate one Enter fires contour:select twice.
        if (e.target !== this) return;
        let seriesCount = 0;
        try { seriesCount = JSON.parse(this.getAttribute("series") || "[]").length; } catch (e) { seriesCount = 0; }
        if (seriesCount === 0) return;
        if (this._activeSeries === undefined) this._activeSeries = 0;
        let next = this._activeSeries;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.min(this._activeSeries + 1, seriesCount - 1);
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.max(this._activeSeries - 1, 0);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = seriesCount - 1;
        else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series: this._activeSeries } }));
          return;
        } else return;
        if (next !== this._activeSeries) {
          e.preventDefault();
          this._activeSeries = next;
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series: next } }));
        }
      });
    }
  }
  define("contour-chart", ContourChart);
class ContourComparison extends ContourBase {
    static get observed() { return ["divider"]; }
    static get properties() { return { divider: { attribute: "divider" } }; }
    render() {
      this.classList.add("c-comparison");
      this.style.blockSize = "12rem";
      // Ensure two panes exist.
      if (!this.querySelector(".c-comparison__pane--before")) {
        const p = document.createElement("div");
        p.className = "c-comparison__pane c-comparison__pane--before";
        p.textContent = "Before";
        this.appendChild(p);
      }
      if (!this.querySelector(".c-comparison__pane:not(.c-comparison__pane--before)")) {
        const p = document.createElement("div");
        p.className = "c-comparison__pane";
        p.textContent = "After";
        this.appendChild(p);
      }
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
    static get observed() { return ["line", "dot", "interval", "pause", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { line: { attribute: "line" }, dot: { attribute: "dot" }, interval: { attribute: "interval", type: Number }, pause: { attribute: "pause", type: Boolean } }; }
    render() {
      this.classList.add("c-streaming-chart");
      wireStates(this);
      loadRemote(this, "line");
      if (renderStates(this, "streaming-chart")) return;
      const line = remoteData(this, "line");
      const dot = remoteData(this, "dot");
      if (!line) {
        const svg = this.querySelector("svg");
        if (svg) svg.remove();
        renderEmpty(this, "streaming-chart");
        return;
      }
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
    enhance() {
      // Stream cadence (BY-40). The layer had no timer at all — the literal
      // gap the row names — so the chart gets its own `interval` loop rather
      // than a second clock inside the loader. Each tick emits contour:tick
      // and, when a src is present, re-validates through the loader's own
      // cache path (remoteInvalidate + requestRender — the two steps the
      // loader's refresh tick performs), so the shared cache and abort
      // semantics stay the loader's. The loader's `refresh` attribute is NOT
      // written here: an attribute a component writes to itself must never be
      // observed, or the write re-enters render (measured by the gate).
      // `pause` stops the loop; `interval` growth is clamped to the loader's
      // own 1 s floor so the two cannot disagree.
      const sync = () => {
        const seconds = parseFloat(this.getAttribute("interval") || "");
        const want = Number.isFinite(seconds) && seconds > 0 && !this.hasAttribute("pause");
        if (want === this._streamRunning) return;
        this._streamRunning = want;
        if (this._streamTimer !== undefined) { clearInterval(this._streamTimer); this._streamTimer = undefined; }
        this.dispatchEvent(new CustomEvent("contour:stream-state", { detail: { running: want }, bubbles: true, composed: true }));
        if (!want) return;
        this._streamTimer = setInterval(() => {
          if (!this.isConnected || this.hasAttribute("pause")) return;
          this._streamFrame += 1;
          this.dispatchEvent(new CustomEvent("contour:tick", { detail: { frame: this._streamFrame }, bubbles: true, composed: true }));
          const src = this.getAttribute("src");
          if (src) { remoteInvalidate(src); this.requestRender(); }
        }, Math.max(1000, seconds * 1000));
      };
      sync();
      // The base re-runs enhance after every render, so interval/pause changes
      // are picked up by sync() above; the timer itself is owned exactly once.
      if (this._wiredStream) return;
      this._wiredStream = true;
      this._streamFrame = 0;
      onDispose(this, () => { if (this._streamTimer !== undefined) { clearInterval(this._streamTimer); this._streamTimer = undefined; } });
    }
  }
define("contour-streaming-chart", ContourStreamingChart);
class ContourMeter extends ContourBase {
    static get observed() { return ["value", "label", "variant", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { value: { attribute: "value" }, label: { attribute: "label" }, variant: { attribute: "variant" } }; }
    render() {
      this.classList.add("c-meter");
      wireStates(this);
      loadRemote(this, ["value", "label"]);
      if (renderStates(this, "meter")) return;
      const rValue = remoteData(this, "value") || (this._remoteData && this._remoteData.value);
      const label = remoteData(this, "label") || (this._remoteData && this._remoteData.label) || "";
      const variant = this.getAttribute("variant");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-meter--")) this.classList.remove(c); });
      if (variant) this.classList.add("c-meter--" + variant);
      if (!rValue && !label) {
        renderEmpty(this, "meter");
        return;
      }
      if (rValue === null) {
        this.style.removeProperty("--meter-value");
      } else {
        this.style.setProperty("--meter-value", rValue);
      }
      const core = this.ensure(".c-meter__core", () => { const el = document.createElement("span"); el.className = "c-meter__core"; return el; });
      let val = core.querySelector(".c-meter__value");
      if (!val) { val = document.createElement("span"); val.className = "c-meter__value"; core.appendChild(val); }
      const num = parseFloat(rValue);
      val.textContent = (Number.isFinite(num) ? Math.round(num * 100) : 0) + "%";
      if (label) {
        const lbl = core.querySelector(".c-meter__label") || (() => { const el = document.createElement("span"); el.className = "c-meter__label"; core.appendChild(el); return el; })();
        lbl.textContent = label;
      }
       if (!this.hasAttribute("role")) this.setAttribute("role", "meter");
       if (label && !this.hasAttribute("aria-label")) this.setAttribute("aria-label", label);
      const ariaValue = rValue === null ? "0" : rValue;
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
    static get observed() { return ["value", "direction", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { value: { attribute: "value" }, direction: { attribute: "direction" } }; }
    render() {
      this.classList.add("c-delta");
      wireStates(this);
      loadRemote(this, "value");
      if (renderStates(this, "delta")) return;
      const value = remoteData(this, "value") || "";
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-delta--")) this.classList.remove(c); });
      const direction = this.getAttribute("direction") || (this._remoteData && this._remoteData.direction) || "up";
      if (!value) {
        renderEmpty(this, "delta");
        return;
      }
      this.classList.add("c-delta--" + direction);
      const icon = { up: "#i-arrow-up", down: "#i-arrow-down", flat: "#i-minus" }[direction] || "#i-arrow-up";
      this.querySelectorAll("svg").forEach((s) => s.remove());
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("aria-hidden", "true");
      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute("href", icon);
      svg.appendChild(use);
      this.appendChild(svg);
      this.appendChild(document.createTextNode(" " + value));
    }
  }
define("contour-delta", ContourDelta);
class ContourStat extends ContourBase {
    static get observed() { return ["value", "label", "delta", "unit", "format", "locale", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { value: { attribute: "value" }, label: { attribute: "label" }, delta: { attribute: "delta" }, unit: { attribute: "unit" }, format: { attribute: "format" }, locale: { attribute: "locale" } }; }
    render() {
      this.classList.add("c-stat");
      wireStates(this);
      loadRemote(this, ["value", "label"]);
      if (renderStates(this, "stat")) return;
      const value = remoteData(this, "value");
      const label = remoteData(this, "label");
      const delta = this.getAttribute("delta");
      if (value) {
        const v = this.ensure(".c-stat__value", () => { const el = document.createElement("div"); el.className = "c-stat__value"; return el; });
        v.textContent = formatValue(value, this.getAttribute("format"), this.getAttribute("locale"));
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
      const v = this.querySelector(".c-stat__value");
      if (v) {
        if (unit) {
          let u = v.querySelector(".c-stat__unit");
          if (!u) { u = document.createElement("span"); u.className = "c-stat__unit"; v.appendChild(u); }
          u.textContent = unit;
        } else {
          const u = v.querySelector(".c-stat__unit");
          if (u) u.remove();
        }
      }
      if (!value && !label) {
        renderEmpty(this, "stat");
      }
    }
  }
define("contour-stat", ContourStat);
class ContourInstrument extends ContourBase {
    static get observed() { return ["rows", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { rows: { attribute: "rows" } }; }
    render() {
      this.classList.add("c-instrument");
      wireStates(this);
      loadRemote(this, "rows");
      if (renderStates(this, "instrument")) return;
      const rows = remoteData(this, "rows");
      // The block's two parts are `__item` and `__value`: the label is the text
      // the item opens with, and the value is the span inside it. There is no
      // `__row` and no `__key` — the separators between items are CSS `::before`.
      Array.from(this.querySelectorAll(".c-instrument__item")).forEach((n) => n.remove());
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
      } else {
        renderEmpty(this, "instrument");
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
      // Slot composition: authored cells win over the generated grid.
      const authored = Array.from(matrix.children).filter((n) => n.classList && n.classList.contains("c-bivariate__cell"));
      if (!authored.length) {
        matrix.innerHTML = "";
        for (let i = 0; i < size * size; i++) {
          const cell = document.createElement("div");
          cell.className = "c-bivariate__cell";
          matrix.appendChild(cell);
        }
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
    static get observed() { return ["date", "instrument", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { date: { attribute: "date" }, instrument: { attribute: "instrument" } }; }
    render() {
      this.classList.add("c-survey");
      wireStates(this);
      loadRemote(this, "date");
      if (renderStates(this, "survey")) return;
      const date = remoteData(this, "date");
      Array.from(this.childNodes).forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) { if (n.textContent.trim() === "Surveyed" || n.textContent.trim() === "·") n.remove(); }
        else if (n.classList && (n.classList.contains("c-survey__value") || n.classList.contains("c-survey__sep"))) n.remove();
      });
      const rDate = date || (this._remoteData && this._remoteData.date);
      const instrument = this.getAttribute("instrument") || (this._remoteData && this._remoteData.instrument);
      if (!rDate) {
        renderEmpty(this, "survey");
        return;
      }
      const v = document.createElement("span");
      v.className = "c-survey__value";
      v.textContent = rDate;
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
define("contour-survey", ContourSurvey);
class ContourThreshold extends ContourBase {
    static get observed() { return ["label", "norm", "state", "value", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, norm: { attribute: "norm" }, state: { attribute: "state" }, value: { attribute: "value" } }; }
    render() {
      this.classList.add("c-threshold");
      wireStates(this);
      loadRemote(this, "value");
      if (renderStates(this, "threshold")) return;
      const pct = (v) => { const n = Number(v); if (!Number.isFinite(n)) return String(v); return (n <= 1 ? n * 100 : n) + "%"; };
      const rValue = remoteData(this, "value") || (this._remoteData && this._remoteData.value);
      const target = this.getAttribute("norm") || (this._remoteData && this._remoteData.norm);
      const state = this.getAttribute("state") || (this._remoteData && this._remoteData.state);
      const label = this.getAttribute("label") || (this._remoteData && this._remoteData.label);
      if (!rValue && !target && !label) {
        renderEmpty(this, "threshold");
        return;
      }
      if (rValue) {
        const v = this.ensure(".c-threshold__fill", () => { const el = document.createElement("span"); el.className = "c-threshold__fill"; return el; });
        v.style.setProperty("--value", pct(rValue));
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
    render() {
      this.classList.add("c-metrics");
      if (!this.querySelector(".c-metrics__item")) {
        const item = document.createElement("div");
        item.className = "c-metrics__item";
        const v = document.createElement("div");
        v.className = "c-metrics__value";
        v.textContent = "42";
        const l = document.createElement("div");
        l.className = "c-metrics__label";
        l.textContent = "Metric";
        item.appendChild(v);
        item.appendChild(l);
        this.appendChild(item);
      }
    }
  }
  define("contour-metrics", ContourMetricsFull);
class ContourLegend extends ContourBase {
    static get observed() { return ["title", "ramp", "scale", "items", "method", "norm", "selectable", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { title: { attribute: "title" }, ramp: { attribute: "ramp" }, scale: { attribute: "scale" }, items: { attribute: "items" }, method: { attribute: "method" }, norm: { attribute: "norm" }, selectable: { attribute: "selectable", type: Boolean } }; }
    render() {
      this.classList.add("c-legend");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "legend")) return;
      // Selectable legends (BY-41): items become toggle buttons with
      // aria-pressed, and the sheet's existing `.c-legend--interactive` rules
      // (hover, dim when pressed=false) apply.
      const selectable = this.hasAttribute("selectable");
      const items = remoteData(this, "items");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-legend__title", () => { const el = document.createElement("div"); el.className = "c-legend__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-legend__title");
        if (t) t.remove();
      }
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const list = this.ensure(".c-legend__items", () => { const el = document.createElement("div"); el.className = "c-legend__items"; return el; });
          list.innerHTML = "";
          parsed.forEach((it) => {
            const label = typeof it === "string" ? it : (it.label || String(it));
            const key = typeof it === "string" ? it : (it.key || it.label || String(it));
            const item = document.createElement(selectable ? "button" : "div");
            item.className = "c-legend__item";
            if (selectable) {
              item.type = "button";
              item.setAttribute("aria-pressed", "true");
              item.dataset.key = key;
            }
            const sw = document.createElement("span");
            sw.className = "c-legend__swatch";
            if (it && it.color) sw.style.background = it.color;
            item.appendChild(sw);
            const lbl = document.createElement("span");
            lbl.textContent = label;
            item.appendChild(lbl);
            list.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      } else {
        const list = this.querySelector(".c-legend__items");
        if (list) list.remove();
        const hasOther = this.getAttribute("title") || this.getAttribute("ramp") || this.getAttribute("scale") || this.getAttribute("method") || this.getAttribute("norm");
        if (!hasOther) {
          renderEmpty(this, "legend");
        }
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
    enhance() {
      if (this._wiredLegend) return;
      this._wiredLegend = true;
      // Host-delegated (rule 12): the item buttons are rebuilt by every
      // render, so the handler re-queries per click. The gate-visible name is
      // `contour:legend-toggle` — the plan's `contour:legend:toggle` carries a
      // colon inside the name, which the check-wc manifest regex cannot see.
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-legend__item") : null;
        if (!btn || !this.contains(btn)) return;
        const pressed = btn.getAttribute("aria-pressed") !== "true";
        btn.setAttribute("aria-pressed", String(pressed));
        this.dispatchEvent(new CustomEvent("contour:legend-toggle", {
          detail: { label: btn.textContent.trim(), key: btn.dataset.key || btn.textContent.trim(), pressed },
          bubbles: true,
          composed: true,
        }));
      });
    }
  }
define("contour-legend", ContourLegend);
class ContourMeasure extends ContourBase {
    static get observed() { return ["label", "value", "point", "line", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" }, point: { attribute: "point" }, line: { attribute: "line" } }; }
    render() {
      this.classList.add("c-measure");
      wireStates(this);
      loadRemote(this, ["label", "value", "point", "line"]);
      if (renderStates(this, "measure")) return;
      const rLabel = remoteData(this, "label");
      const rValue = remoteData(this, "value");
      const rPoint = remoteData(this, "point");
      const rLine = remoteData(this, "line");
      if (!rLabel && !rValue && !rPoint && !rLine) {
        renderEmpty(this, "measure");
        return;
      }
      if (rLabel) {
        const l = this.ensure(".c-measure__label", () => { const el = document.createElement("span"); el.className = "c-measure__label"; return el; });
        l.textContent = rLabel;
      } else {
        const l = this.querySelector(".c-measure__label");
        if (l) l.remove();
      }
      if (rValue) {
        const r = this.ensure(".c-measure__readout", () => { const el = document.createElement("span"); el.className = "c-measure__readout"; return el; });
        r.textContent = rValue;
      } else {
        const r = this.querySelector(".c-measure__readout");
        if (r) r.remove();
      }
      if (rPoint) {
        const p = this.ensure(".c-measure__point", () => { const el = document.createElement("span"); el.className = "c-measure__point"; return el; });
        p.textContent = rPoint;
      } else {
        const p = this.querySelector(".c-measure__point");
        if (p) p.remove();
      }
      if (!rLine) {
        const svg = this.querySelector("svg");
        if (svg) svg.remove();
        return;
      }
      if (rLine) {
        const ln = this.ensure(".c-measure__line", () => { const el = document.createElement("span"); el.className = "c-measure__line"; return el; });
        ln.style.inlineSize = rLine;
      } else {
        const ln = this.querySelector(".c-measure__line");
        if (ln) ln.remove();
      }
    }
  }
define("contour-measure", ContourMeasure);
class ContourTimeline extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-timeline");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "timeline")) return;
      const authored = Array.from(this.children).filter((n) => n.classList && n.classList.contains("c-timeline__item"));
      const items = remoteData(this, "items");
      if (items && !authored.length) {
        Array.from(this.querySelectorAll(".c-timeline__item")).forEach((n) => n.remove());
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
      } else if (!authored.length) {
        renderEmpty(this, "timeline");
      }
     }
    enhance() {
      if (this._wiredTimeline) return;
      this._wiredTimeline = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest('button[data-action="retry"]') : null;
        if (btn && this.contains(btn)) {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:retry", { detail: { src: this.getAttribute("src") }, bubbles: true, composed: true }));
        }
      });
    }
  }
define("contour-timeline", ContourTimeline);
class ContourHeatmap extends ContourBase {
    static get observed() { return ["cells", "count", "legend", "empty", "loading", "values", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { cells: { attribute: "cells" }, count: { attribute: "count" }, legend: { attribute: "legend" } }; }
    render() {
      this.classList.add("c-heatmap");
      if (!this.hasAttribute("role")) this.setAttribute("role", "grid");
      wireStates(this);
      loadRemote(this, "cells");
      if (renderStates(this, "heatmap")) return;
      Array.from(this.querySelectorAll(".c-heatmap__cell")).forEach((n) => n.remove());
      const count = Math.min(200, Math.max(0, parseInt(this.getAttribute("cells") || this.getAttribute("count") || "0", 10) || 0));
      const cols = count > 0 ? Math.ceil(Math.sqrt(count)) : 1;
      this.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
      this.style.inlineSize = "16rem";
       if (count > 0) {
         let values = [];
         try { values = JSON.parse(this.getAttribute("values") || "[]"); } catch (e) { values = []; }
         for (let i = 0; i < count; i++) {
           const cell = document.createElement("div");
           cell.className = "c-heatmap__cell";
           cell.setAttribute("role", "gridcell");
           cell.setAttribute("tabindex", i === 0 ? "0" : "-1");
           cell.dataset.index = String(i);
           if (values[i] !== undefined) cell.setAttribute("title", String(values[i]));
           this.appendChild(cell);
         }
         const tip = this.ensure(".c-heatmap__tooltip", () => { const el = document.createElement("div"); el.className = "c-heatmap__tooltip"; el.setAttribute("role", "tooltip"); el.setAttribute("hidden", ""); return el; });
         tip.setAttribute("hidden", "");
       } else {
         renderEmpty(this, "heatmap");
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
    enhance() {
      if (this._wiredHeatmap) return;
      this._wiredHeatmap = true;
      const cells = () => Array.from(this.querySelectorAll(".c-heatmap__cell"));
      // The tip is rebuilt on every render (the base wipes generated children),
      // so handlers re-query it per event (rule 12) — a captured node would be
      // detached after the first re-render and the tooltip would silently die.
      const showTip = (e) => {
        const tip = this.querySelector(".c-heatmap__tooltip");
        if (!tip) return;
        const cell = e.target && e.target.closest ? e.target.closest(".c-heatmap__cell") : null;
        if (!cell || !this.contains(cell)) { tip.setAttribute("hidden", ""); return; }
        const title = cell.getAttribute("title");
        if (title) tip.textContent = title;
        else tip.textContent = "Cell " + (cell.dataset.index || "");
        const rect = this.getBoundingClientRect();
        const cr = cell.getBoundingClientRect();
        this.style.position = this.style.position || "relative";
        // Logical positioning (BY-48): the CSS positions the tip through the
        // --chart-tip-* tokens, the same contract the chart tooltip uses, so
        // the block flips with dir="rtl" instead of staying pinned to the
        // physical left edge of an RTL host.
        tip.style.setProperty("--chart-tip-inline-start", (cr.left - rect.left + cr.width / 2) + "px");
        tip.style.setProperty("--chart-tip-block-start", (cr.top - rect.top) + "px");
        tip.removeAttribute("hidden");
      };
      const hideTip = () => {
        const tip = this.querySelector(".c-heatmap__tooltip");
        if (tip) tip.setAttribute("hidden", "");
      };
      this.addEventListener("mouseover", showTip);
      this.addEventListener("mouseout", (e) => {
        if (!e.relatedTarget || !this.contains(e.relatedTarget)) hideTip();
       });
      this.addEventListener("focusin", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-heatmap__cell") : null;
        if (cell && this.contains(cell)) showTip({ target: cell });
      });
      this.addEventListener("focusout", (e) => {
        if (!this.contains(e.relatedTarget)) hideTip();
      });
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest('button[data-action="retry"]') : null;
        if (btn && this.contains(btn)) {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:retry", { detail: { src: this.getAttribute("src") }, bubbles: true, composed: true }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-heatmap__cell") : null;
        if (!cell || !this.contains(cell)) return;
        const list = cells();
        const idx = list.indexOf(cell);
        let next = -1;
        if (e.key === "ArrowRight") next = Math.min(idx + 1, list.length - 1);
        else if (e.key === "ArrowLeft") next = Math.max(idx - 1, 0);
        else if (e.key === "ArrowDown") next = Math.min(idx + Math.ceil(Math.sqrt(list.length)), list.length - 1);
        else if (e.key === "ArrowUp") next = Math.max(idx - Math.ceil(Math.sqrt(list.length)), 0);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = list.length - 1;
        else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: idx } }));
          return;
        }
        if (next >= 0 && next !== idx) {
          e.preventDefault();
          list.forEach((c, i) => c.setAttribute("tabindex", i === next ? "0" : "-1"));
          try { list[next].focus(); } catch (e) {}
        }
      });
      this.addEventListener("click", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-heatmap__cell") : null;
        if (!cell || !this.contains(cell)) return;
        const idx = cells().indexOf(cell);
        if (idx >= 0) this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: idx } }));
      });
    }
  }
define("contour-heatmap", ContourHeatmap);
class ContourCompare extends ContourBase {
    static get observed() { return ["no", "text", "yes", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { no: { attribute: "no" }, text: { attribute: "text" }, yes: { attribute: "yes" } }; }
    render() {
      this.classList.add("c-compare");
      this.style.padding = "var(--space-md)";
      wireStates(this);
      loadRemote(this, ["no", "text", "yes"]);
      if (renderStates(this, "compare")) return;
      const rYes = remoteData(this, "yes") || (this._remoteData && this._remoteData.yes);
      const rNo = remoteData(this, "no") || (this._remoteData && this._remoteData.no);
      const rText = remoteData(this, "text") || (this._remoteData && this._remoteData.text);
      Array.from(this.querySelectorAll(".c-compare__yes, .c-compare__no, .c-compare__text")).forEach((n) => n.remove());
      if (rYes) {
        const y = document.createElement("span");
        y.className = "c-compare__yes";
        y.innerHTML = '<svg aria-hidden="true"><use href="#i-check" /></svg>';
        this.appendChild(y);
      }
      if (rNo) {
        const n = document.createElement("div");
        n.className = "c-compare__no";
        n.textContent = rNo;
        this.appendChild(n);
      }
      if (rText) {
        const t = document.createElement("p");
        t.className = "c-compare__text";
        t.textContent = rText;
        this.appendChild(t);
      }
      if (!rYes && !rNo && !rText) {
        renderEmpty(this, "compare");
      }
    }
  }
define("contour-compare", ContourCompare);
class ContourSparkline extends ContourBase {
    static get observed() { return ["points", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { points: { attribute: "points" } }; }
    render() {
      this.classList.add("c-sparkline");
      if (!this.hasAttribute("role")) this.setAttribute("role", "img");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Sparkline");
      wireStates(this);
      loadRemote(this, "points");
      if (renderStates(this, "sparkline")) return;
      const points = remoteData(this, "points");
      if (points) {
        try {
          const parsed = JSON.parse(points);
          if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("empty");
          Array.from(this.querySelectorAll(".c-sparkline__dot, .c-sparkline__line, .c-sparkline__area")).forEach((n) => n.remove());
          const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("class", "c-sparkline__line");
          svg.setAttribute("viewBox", "0 0 100 30");
          svg.setAttribute("preserveAspectRatio", "none");
          svg.style.inlineSize = "100%";
          svg.style.blockSize = "100%";
          svg.setAttribute("width", "100%");
          svg.setAttribute("height", "100%");
          svg.setAttribute("title", this.getAttribute("aria-label") || "Sparkline");
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", parsed.map((p, i) => (i === 0 ? "M" : "L") + " " + (i * 100 / (parsed.length - 1)) + " " + (30 - p * 30)).join(" "));
           svg.appendChild(path);
           const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
           dot.setAttribute("class", "c-sparkline__dot");
           dot.setAttribute("r", "2");
           dot.setAttribute("cx", "0");
           dot.setAttribute("cy", "15");
           dot.setAttribute("hidden", "");
           svg.appendChild(dot);
           this.appendChild(svg);
           this._sparkPoints = parsed;
           const tip = this.ensure(".c-sparkline__tooltip", () => { const el = document.createElement("div"); el.className = "c-sparkline__tooltip"; el.setAttribute("role", "tooltip"); el.setAttribute("hidden", ""); return el; });
           tip.setAttribute("hidden", "");
        } catch (e) {
           Array.from(this.querySelectorAll("svg")).forEach((n) => n.remove());
           renderEmpty(this, "sparkline");
        }
      } else {
        renderEmpty(this, "sparkline");
      }
    }
    enhance() {
      if (this._wiredSparkline) return;
      this._wiredSparkline = true;
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      // The svg, dot and tip are rebuilt on every render (the base wipes
      // generated children), so the handlers re-query them per event (rule 12);
      // a capture made at wiring time is a detached node the moment the first
      // attribute changes, and every tooltip after that writes into limbo.
      const showTip = (e) => {
        const svg = this.querySelector("svg");
        const tip = this.querySelector(".c-sparkline__tooltip");
        const dot = this.querySelector(".c-sparkline__dot");
        if (!tip || !svg) return;
        const rect = svg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        const pts = this._sparkPoints || [];
        if (pts.length === 0) return;
        const idx = Math.round(pct * (pts.length - 1));
        const val = pts[idx];
        const cx = (idx * 100 / (pts.length - 1));
        const cy = 30 - val * 30;
        if (dot) {
          dot.setAttribute("cx", String(cx));
          dot.setAttribute("cy", String(cy));
          dot.removeAttribute("hidden");
        }
        tip.textContent = String(val);
        const tipX = (cx / 100) * rect.width;
        // Logical positioning (BY-48): same token contract as the heatmap and
        // the chart tooltip, so the pointer-tracking tip stays inside the
        // block in an RTL layout rather than being measured from the left.
        tip.style.setProperty("--chart-tip-inline-start", tipX + "px");
        tip.style.setProperty("--chart-tip-block-start", "0px");
        tip.removeAttribute("hidden");
      };
      const hideTip = () => {
        const tip = this.querySelector(".c-sparkline__tooltip");
        const dot = this.querySelector(".c-sparkline__dot");
        if (tip) tip.setAttribute("hidden", "");
        if (dot) dot.setAttribute("hidden", "");
      };
      this.addEventListener("mousemove", showTip);
      this.addEventListener("mouseleave", hideTip);
      // Keyboard path (BY-39): the host carries tabindex; a focused sparkline
      // shows its last value, which is the point a keyboard reader can reach.
      this.addEventListener("focusin", () => {
        const pts = this._sparkPoints || [];
        if (!pts.length) return;
        const svg = this.querySelector("svg");
        if (!svg) return;
        const r = svg.getBoundingClientRect();
        showTip({ clientX: r.left + r.width - 1 });
      });
      this.addEventListener("focusout", hideTip);
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest('button[data-action="retry"]') : null;
        if (btn && this.contains(btn)) {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:retry", { detail: { src: this.getAttribute("src") }, bubbles: true, composed: true }));
        }
      });
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: {} }));
        }
      });
    }
  }
define("contour-sparkline", ContourSparkline);
class ContourChartGrid extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-chart-grid");
      if (!this.querySelector(".c-chart")) {
        const c = document.createElement("div");
        c.className = "c-chart";
        c.textContent = "Chart";
        this.appendChild(c);
      }
    }
  }
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
