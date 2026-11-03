import { ContourBase, define, onDispose, formatValue, contourId } from './core.mjs';
import { loadRemote, remoteData, renderStates, renderEmpty, wireStates, remoteInvalidate, watchViewport } from './states.mjs';
import { donutSlices, barRects, smoothPath, polylinePoints } from './svg.mjs';
/**
 * Readout: web component wrapper.
 * Attributes: `rows`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`, `format`, `locale`.
 */
class ContourReadout extends ContourBase {
    static get observed() { return ["rows", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "format", "locale"]; }
    static get properties() { return { rows: { attribute: "rows" }, format: { attribute: "format" }, locale: { attribute: "locale" }, src: { attribute: "src" } }; }
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
             val.setAttribute("aria-live", "polite");
            val.textContent = formatValue(r.value || r[1], this.getAttribute("format"), this.getAttribute("locale"), (r.unit !== undefined ? r.unit : this.getAttribute("unit")));
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
/**
 * Kpi: web component wrapper.
 * Attributes: `value`, `label`, `delta`, `direction`, `note`, `variant`, `unit`, `format`, `locale`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`, `thresholds`, `threshold`, `sparkline`, `polarity`.
 */
class ContourKpi extends ContourBase {
    static get observed() { return ["value", "label", "delta", "direction", "note", "variant", "unit", "format", "locale", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "thresholds", "threshold", "sparkline", "polarity"]; }
    static get properties() {
      return { value: { attribute: "value" }, label: { attribute: "label" }, delta: { attribute: "delta" }, direction: { attribute: "direction" }, note: { attribute: "note" }, variant: { attribute: "variant" }, unit: { attribute: "unit" }, format: { attribute: "format" }, locale: { attribute: "locale" }, thresholds: { attribute: "thresholds" }, threshold: { attribute: "threshold" }, sparkline: { attribute: "sparkline" }, polarity: { attribute: "polarity" } };
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
        const v = this.ensure(".c-kpi__value", () => { const el = document.createElement("div"); el.className = "c-kpi__value"; el.setAttribute("aria-live", "polite"); return el; });
        v.textContent = formatValue(value, this.getAttribute("format"), this.getAttribute("locale"), this.getAttribute("unit"));
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
         const dir = this.getAttribute("direction") || "up";
         const polarity = this.getAttribute("polarity") || "neutral";
         let tone = "neutral";
         if (polarity === "good") tone = (dir === "up") ? "good" : "bad";
         else if (polarity === "bad") tone = (dir === "up") ? "bad" : "good";
         d.className = "c-delta c-delta--" + dir + " c-delta--" + tone;
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
      // threshold badge
      const threshold = this.getAttribute("threshold") || this.getAttribute("thresholds");
      if (threshold) {
        const f = this.ensure(".c-kpi__foot", () => { const el = document.createElement("div"); el.className = "c-kpi__foot"; return el; });
        let badge = f.querySelector(".c-kpi__threshold-badge");
        if (!badge) { badge = document.createElement("span"); badge.className = "c-kpi__threshold-badge"; f.appendChild(badge); }
        badge.textContent = threshold;
        badge.setAttribute("part", "threshold-badge");
      } else {
        const b = this.querySelector(".c-kpi__threshold-badge");
        if (b) b.remove();
      }
      // remove orphaned foot container when no children remain
      const foot = this.querySelector(".c-kpi__foot");
      if (foot && !foot.querySelector(".c-delta, .c-kpi__note, .c-kpi__threshold-badge")) foot.remove();
      // sparkline canvas
      const spark = this.getAttribute("sparkline");
      if (spark) {
        let canvas = this.querySelector(".c-kpi__sparkline-canvas");
        if (!canvas) { canvas = document.createElement("canvas"); canvas.className = "c-kpi__sparkline-canvas"; canvas.setAttribute("part", "sparkline-canvas"); this.appendChild(canvas); }
      } else {
        const c = this.querySelector(".c-kpi__sparkline-canvas");
        if (c) c.remove();
      }
      if (!value && !label) {
        renderEmpty(this, "kpi");
      }
    }
  }
define("contour-kpi", ContourKpi);
/**
 * Table: web component wrapper.
 * Attributes: `columns`, `rows`, `page`, `page-size`, `sort`, `sort-dir`, `virtual`, `empty`, `loading`, `error`, `retry`, `skeleton`, `persist`.
 */
class ContourTable extends ContourBase {
    static get updateMode() { return "keyed"; }
    static get observed() { return ["columns", "rows", "page", "page-size", "sort", "sort-dir", "virtual", "empty", "loading", "error", "retry", "skeleton", "persist"]; }
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
      this.setAttribute("role", "region");
      this.setAttribute("aria-label", "Table");
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
          // Column filters (F-09): narrow `working` by each active filter.
          if (!this._filters) this._filters = {};
          const activeFilters = Object.keys(this._filters).filter((k) => this._filters[k]);
          if (activeFilters.length) {
            working = working.filter((row) => activeFilters.every((k) => {
              const ci = Number(k);
              const q = String(this._filters[ci] || "").toLowerCase();
              if (!q) return true;
              return String(this._cellValue(row[ci])).toLowerCase().includes(q);
            }));
          }
          // Pagination.
          const pageSizeRaw = this.getAttribute("page-size");
          const pageSize = pageSizeRaw !== null ? parseInt(pageSizeRaw, 10) : NaN;
          const usePaging = Number.isFinite(pageSize) && pageSize > 0;
          // Sync internal page state with external attribute changes.
          let pageAttr = this.getAttribute("page");
          if (this.getAttribute("persist") && this.id) {
            const mode = this.getAttribute("persist");
            let stored = null;
            if (mode === "storage") { try { stored = localStorage.getItem("contour-table:" + this.id); } catch (e) {} }
            else if (mode === "url") { try { stored = new URLSearchParams(window.location.search).get("c-table"); } catch (e) {} }
            if (stored !== null) pageAttr = stored;
          }
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
                  const isSelect = (typeof c === "object" && c !== null && c.select);
                  const isFilter = (typeof c === "object" && c !== null && c.filter);
                  if (isFilter) {
                    th.className = (th.className + " c-table__filter").trim();
                    const inp = document.createElement("input");
                    inp.type = "search";
                    inp.className = "c-table__filter-input";
                    inp.placeholder = colLabel;
                    inp.dataset.filterIndex = String(i);
                    if (this._filters && this._filters[i]) inp.value = this._filters[i];
                    th.appendChild(inp);
                  } else if (isSelect) {
                    th.className = (th.className + " c-table__select").trim();
                    const cb = document.createElement("input");
                    cb.type = "checkbox";
                    cb.className = "c-table__select-all";
                    cb.setAttribute("aria-label", "Select all rows");
                    th.appendChild(cb);
                  } else if (sortable) {
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
          const useVirtual = this.hasAttribute("virtual") && !usePaging && pageData.length > 100;
          const rowHeight = 36;
          const windowSize = 30;
          const overscan = 10;
          let windowStart = 0;
          let visibleData = pageData;
          if (useVirtual) {
            const maxStart = Math.max(0, pageData.length - windowSize);
            windowStart = Math.min(maxStart, Math.max(0, Math.floor(wrap.scrollTop / rowHeight) - overscan));
            visibleData = pageData.slice(windowStart, windowStart + windowSize + overscan * 2);
            table.setAttribute("aria-rowcount", String(pageData.length + 1));
          } else {
            table.removeAttribute("aria-rowcount");
          }
          const addSpacer = (height) => {
            const tr = document.createElement("tr");
            tr.setAttribute("aria-hidden", "true");
            const td = document.createElement("td");
            td.colSpan = cols.length;
            td.style.blockSize = `${height}px`;
            td.style.padding = "0";
            tr.appendChild(td);
            tbody.appendChild(tr);
          };
          if (useVirtual) addSpacer(windowStart * rowHeight);
          if (visibleData.length === 0) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = cols.length;
            td.textContent = this.getAttribute("empty") || "No data";
            td.style.textAlign = "center";
            td.style.color = "var(--color-text-muted)";
            tr.appendChild(td);
            tbody.appendChild(tr);
          } else {
            visibleData.forEach((row, ri) => {
              const tr = document.createElement("tr");
              tr.dataset.rowIndex = String(windowStart + ri);
              tr.setAttribute("tabindex", "0");
              cols.forEach((c, ci) => {
                const isSelect = (typeof c === "object" && c !== null && c.select);
                const td = document.createElement("td");
                if (isSelect) {
                  const cb = document.createElement("input");
                  cb.type = "checkbox";
                  cb.className = "c-table__row-select";
                  cb.dataset.rowIndex = String(windowStart + ri);
                  if (this._selectedRows && this._selectedRows.has(windowStart + ri)) cb.checked = true;
                  td.appendChild(cb);
                } else {
                  td.textContent = this._cellValue(row[ci]);
                }
                tr.appendChild(td);
              });
              tbody.appendChild(tr);
            });
          }
          if (useVirtual) addSpacer(Math.max(0, pageData.length - windowStart - visibleData.length) * rowHeight);
          if (table.parentNode !== wrap) {
            wrap.innerHTML = "";
            wrap.appendChild(table);
          }
          if (wrap.parentNode !== this) this.appendChild(wrap);
          // Optional fixed-row DOM windowing for large datasets. Opt-in via `virtual`.
          if (this.hasAttribute("virtual")) {
            wrap.style.maxHeight = wrap.style.maxHeight || "24rem";
            wrap.style.overflow = "auto";
            table.classList.add("c-table--virtual");
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
           // Reflect the page on the host so consumers can key off the attribute
           // (D-04). Marked internal so the resulting render preserves _page
           // instead of nulling it (B3-01).
           this._pageInternal = true;
           this.setAttribute("page", String(page));
           this.dispatchEvent(new CustomEvent("contour:page", { bubbles: true, composed: true, detail: { page } }));
          const persist = this.getAttribute("persist");
          if (persist === "storage" && this.id) { try { localStorage.setItem("contour-table:" + this.id, String(page)); } catch (e) {} }
          else if (persist === "url") { try { const url = new URL(window.location.href); url.searchParams.set("c-table", String(page)); window.history.replaceState(null, "", url.toString()); } catch (e) {} }
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
      // Column filter (F-09): re-render on filter input change.
      this.addEventListener("input", (e) => {
        const inp = e.target && e.target.closest ? e.target.closest(".c-table__filter-input") : null;
        if (!inp || !this.contains(inp)) return;
        const idx = Number(inp.dataset.filterIndex);
        if (!Number.isFinite(idx)) return;
        if (!this._filters) this._filters = {};
        this._filters[idx] = inp.value;
        this.requestRender();
      });
      this.addEventListener("scroll", (e) => {
        if (!this.hasAttribute("virtual") || !e.target || !e.target.classList || !e.target.classList.contains("c-table-wrap")) return;
        if (this._tableVirtualRaf) return;
        const run = () => { this._tableVirtualRaf = 0; this.requestRender(); };
        this._tableVirtualRaf = typeof requestAnimationFrame === "function" ? requestAnimationFrame(run) : setTimeout(run, 16);
      }, true);
      // Row selection (F-09): track checked rows and emit contour:select.
      this._selectedRows = this._selectedRows || new Set();
      this.addEventListener("change", (e) => {
        const cb = e.target && e.target.closest ? e.target.closest(".c-table__row-select") : null;
        if (cb && this.contains(cb)) {
          const idx = Number(cb.dataset.rowIndex);
          if (!Number.isFinite(idx)) return;
          if (cb.checked) this._selectedRows.add(idx); else this._selectedRows.delete(idx);
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { rows: Array.from(this._selectedRows) } }));
          return;
        }
        const all = e.target && e.target.closest ? e.target.closest(".c-table__select-all") : null;
        if (all && this.contains(all)) {
          const cbs = Array.from(this.querySelectorAll(".c-table__row-select"));
          cbs.forEach((c) => { c.checked = all.checked; });
          this._selectedRows = new Set(all.checked ? cbs.map((c) => Number(c.dataset.rowIndex)) : []);
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { rows: Array.from(this._selectedRows) } }));
        }
      });
      // Map-linked table (CARTO-inspired): emit contour:hover on row hover so a
      // consumer can highlight/zoom the corresponding feature on the map.
      // Contour stays engine-agnostic: it only announces the row.
      this.addEventListener("mouseover", (e) => {
        const tr = e.target && e.target.closest ? e.target.closest("tbody tr") : null;
        if (!tr || !this.contains(tr)) return;
        const idx = Number(tr.dataset.rowIndex);
        if (!Number.isFinite(idx)) return;
        if (this._hoveredRow === idx) return;
        this._hoveredRow = idx;
        this.dispatchEvent(new CustomEvent("contour:hover", { bubbles: true, composed: true, detail: { row: idx } }));
      });
      this.addEventListener("mouseout", (e) => {
        const tr = e.target && e.target.closest ? e.target.closest("tbody tr") : null;
        if (!tr || !this.contains(tr)) return;
        const related = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest("tbody tr") : null;
        if (related === tr) return;
        this._hoveredRow = null;
        this.dispatchEvent(new CustomEvent("contour:leave", { bubbles: true, composed: true, detail: {} }));
      });
      this.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const tr = e.target && e.target.closest ? e.target.closest("tbody tr") : null;
        if (!tr || !this.contains(tr)) return;
        e.preventDefault();
        const idx = Number(tr.dataset.rowIndex);
        if (!Number.isFinite(idx)) return;
        this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true, detail: { row: idx } }));
      });
    }
  }
  define("contour-table", ContourTable);
class ContourDataTable extends ContourTable {
    render() {
      super.render();
      this.classList.add("c-data-table");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Data table");
    }
  }
  define("contour-data-table", ContourDataTable);
/**
 * Chart: web component wrapper.
 * Attributes: `series`, `axis`, `empty`, `loading`, `error`, `retry`, `skeleton`, `zoomable`, `data-table`, `brush`, `brush-min`, `brush-max`, `brush-start`, `brush-end`.
 */
class ContourChart extends ContourBase {
    static get updateMode() { return "keyed"; }
  static get observed() { return ["series", "axis", "empty", "loading", "error", "retry", "skeleton", "zoomable", "data-table", "brush", "brush-min", "brush-max", "brush-start", "brush-end", "note"]; }
  static get properties() { return { series: { attribute: "series" }, axis: { attribute: "axis" }, zoomable: { attribute: "zoomable", type: Boolean }, brush: { attribute: "brush", type: Boolean }, note: { attribute: "note" } }; }
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
         let parsed = null;
         try {
           parsed = JSON.parse(series);
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
                    path.setAttribute("aria-label", "Series " + (i + 1) + ": " + String(s.values[si]));
                    path.setAttribute("role", "img");
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
                      rect.setAttribute("aria-label", "Series " + (i + 1) + ": " + String(s.values[ri]));
                      rect.setAttribute("tabindex", "0");
                     rect.setAttribute("role", "button");
                     rect.dataset.index = String(ri);
                     svg.appendChild(rect);
                  });
                 plot.appendChild(svg);
               } else if (s.type === "scatter") {
                 const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                 svg.setAttribute("viewBox", "0 0 300 120");
                 svg.setAttribute("preserveAspectRatio", "none");
                 svg.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%";
                 const pts = (Array.isArray(s.values) ? s.values : []).map((v) => {
                   if (Array.isArray(v)) return { x: Number(v[0]) || 0, y: Number(v[1]) || 0 };
                   return { x: Number(v && v.x) || 0, y: Number(v && v.y) || 0 };
                 });
                 const xs = pts.map((p) => p.x);
                 const ys = pts.map((p) => p.y);
                 const minX = xs.length ? Math.min.apply(null, xs) : 0;
                 const maxX = xs.length ? Math.max.apply(null, xs) : 1;
                 const minY = ys.length ? Math.min.apply(null, ys) : 0;
                 const maxY = ys.length ? Math.max.apply(null, ys) : 1;
                 const xRange = (maxX - minX) || 1;
                 const yRange = (maxY - minY) || 1;
                 pts.forEach((p, pi) => {
                   const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                   circle.setAttribute("class", "c-chart__point");
                   circle.setAttribute("data-series", String(i + 1));
                   circle.setAttribute("data-index", String(pi));
                   circle.style.setProperty("--c", color);
                   const cx = ((p.x - minX) / xRange) * 300;
                   const cy = 120 - ((p.y - minY) / yRange) * 120;
                   circle.setAttribute("cx", cx.toFixed(2));
                   circle.setAttribute("cy", cy.toFixed(2));
                   circle.setAttribute("r", "3");
                   circle.setAttribute("tabindex", pi === 0 ? "0" : "-1");
                   circle.setAttribute("role", "button");
                   circle.setAttribute("title", p.x + ", " + p.y);
                   circle.setAttribute("aria-label", "Series " + (i + 1) + ": " + p.x + ", " + p.y);
                   svg.appendChild(circle);
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
                    circle.setAttribute("aria-label", "Series " + (i + 1) + ": " + String(s.values[pi]));
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
          // Accessible data-table fallback (R12-18): opt-in via `data-table`
          // attribute. Renders a visually-hidden table of the series values so
          // screen readers and no-JS consumers can read the data behind the
          // graphic. The graphic remains the primary presentation.
          if (this.hasAttribute("data-table")) {
            let table = this.querySelector(".c-chart__data-table");
            if (!table) {
              table = document.createElement("table");
              table.className = "c-chart__data-table visually-hidden";
              this.appendChild(table);
            }
            table.innerHTML = "";
            const thead = document.createElement("thead");
            const hr = document.createElement("tr");
            const h = document.createElement("th");
            h.textContent = "Series";
            hr.appendChild(h);
            const maxLen = parsed.reduce((m, s) => Math.max(m, Array.isArray(s.values) ? s.values.length : (Array.isArray(s) ? s.length : 0)), 0);
            for (let i = 0; i < maxLen; i++) {
              const th = document.createElement("th");
              th.textContent = "Value " + (i + 1);
              hr.appendChild(th);
            }
            thead.appendChild(hr);
            table.appendChild(thead);
            const tbody = document.createElement("tbody");
            parsed.forEach((s, si) => {
              const vals = Array.isArray(s.values) ? s.values : (Array.isArray(s) ? s : []);
              const tr = document.createElement("tr");
              const td0 = document.createElement("td");
              td0.textContent = s.label || ("Series " + (si + 1));
              tr.appendChild(td0);
              for (let i = 0; i < maxLen; i++) {
                const td = document.createElement("td");
                td.textContent = vals[i] != null ? String(vals[i]) : "";
                tr.appendChild(td);
              }
              tbody.appendChild(tr);
            });
            table.appendChild(tbody);
          } else {
            const old = this.querySelector(".c-chart__data-table");
            if (old) old.remove();
          }
            if (this.hasAttribute("brush")) {
              const brush = this.ensure("contour-brush", () => document.createElement("contour-brush"));
              brush.setAttribute("min", this.getAttribute("brush-min") || "0");
              brush.setAttribute("max", this.getAttribute("brush-max") || "100");
              brush.setAttribute("start", this.getAttribute("brush-start") || this.getAttribute("brush-min") || "0");
              brush.setAttribute("end", this.getAttribute("brush-end") || this.getAttribute("brush-max") || "100");
              if (brush.previousElementSibling !== plot) this.appendChild(brush);
            } else {
              const brush = this.querySelector("contour-brush");
              if (brush) brush.remove();
            }
            const note = this.getAttribute("note");
            let noteEl = this.querySelector(".c-chart__note");
            if (note) {
              if (!noteEl) { noteEl = document.createElement("div"); noteEl.className = "c-chart__note"; this.appendChild(noteEl); }
              noteEl.textContent = note;
            } else if (noteEl) {
              noteEl.remove();
            }
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
         const note = this.getAttribute("note");
         let noteEl2 = this.querySelector(".c-chart__note");
         if (note) {
           if (!noteEl2) { noteEl2 = document.createElement("div"); noteEl2.className = "c-chart__note"; this.appendChild(noteEl2); }
           noteEl2.textContent = note;
         } else if (noteEl2) {
           noteEl2.remove();
         }
       }
     }
    enhance() {
      if (this._wiredChart) return;
      this._wiredChart = true;
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      // Series toggle responding to legend (F-10): hide/show series when a
      // legend item is toggled.
      this.addEventListener("contour:legend-toggle", (e) => {
        const key = e && e.detail && (e.detail.key || e.detail.label);
        const pressed = e && e.detail && e.detail.pressed;
        if (key == null) return;
        const nodes = this.querySelectorAll("[data-series]");
        nodes.forEach((n) => {
          const s = n.getAttribute("data-series");
          if (String(s) === String(key) || n.getAttribute("data-key") === String(key)) {
            n.style.display = pressed === false ? "none" : "";
          }
        });
      });
      this.addEventListener("contour:brush-end", (e) => {
        if (!this.hasAttribute("brush") || !e.target || !e.target.matches("contour-brush")) return;
        this.dispatchEvent(new CustomEvent("contour:select", {
          bubbles: true,
          composed: true,
          detail: e.detail,
        }));
      });
      // Zoom/pan (F-10 deferred): wheel to zoom, drag to pan, double-click to reset.
      if (this.hasAttribute("zoomable")) {
        let zoom = 1, panX = 0, panY = 0;
        const plot = this.querySelector(".c-chart__plot");
        const apply = () => {
          if (!plot) return;
          plot.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
          plot.style.transformOrigin = "center center";
        };
        this.addEventListener("wheel", (e) => {
          e.preventDefault();
          const factor = e.deltaY < 0 ? 1.1 : 0.9;
          zoom = Math.min(5, Math.max(0.5, zoom * factor));
          apply();
        }, { passive: false });
        let dragging = false, startX = 0, startY = 0, startPanX = 0, startPanY = 0;
        this.addEventListener("mousedown", (e) => {
          if (e.button !== 0) return;
          dragging = true; startX = e.clientX; startY = e.clientY; startPanX = panX; startPanY = panY;
          this.style.cursor = "grabbing";
        });
        const onMove = (e) => {
          if (!dragging) return;
          panX = startPanX + (e.clientX - startX);
          panY = startPanY + (e.clientY - startY);
          apply();
        };
        const onUp = () => { if (dragging) { dragging = false; this.style.cursor = ""; } };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        onDispose(this, () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); });
        this.addEventListener("dblclick", () => { zoom = 1; panX = 0; panY = 0; apply(); });
      }
      // Tooltip: show on hover of a mark.
      // Cache the plot rect across mousemove events: it only changes on
      // resize/scroll, so re-measuring it on every pixel of movement is
      // wasted layout work (B3-22). A ResizeObserver invalidates the cache;
      // scroll invalidates via the same observer-less fallback (recompute).
      let plotRectCache = null;
      let plotRectObserver = null;
      const invalidatePlotRect = () => { plotRectCache = null; };
      const showTip = (e) => {
        const plot = this.querySelector(".c-chart__plot");
        const tip = this.querySelector(".c-chart__tooltip");
        if (!plot || !tip) return;
        const mark = e.target && e.target.closest ? e.target.closest(".c-chart__bar, .c-chart__point, .c-chart__line") : null;
        if (!mark || !plot.contains(mark)) { tip.setAttribute("hidden", ""); return; }
        const title = mark.getAttribute("title");
        if (title) tip.textContent = title;
        if (!plotRectCache) {
          plotRectCache = plot.getBoundingClientRect();
          if (!plotRectObserver && typeof ResizeObserver === "function") {
            plotRectObserver = new ResizeObserver(invalidatePlotRect);
            plotRectObserver.observe(plot);
          }
        }
        const rect = plotRectCache;
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
      onDispose(this, () => { if (plotRectObserver) { plotRectObserver.disconnect(); plotRectObserver = null; } });
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
      this.addEventListener("keydown", (e) => {
        // Only the host itself drives series switching; marks handle their own
        // keys (B3-03). Without this gate one Enter fires contour:select twice.
        if (e.target !== this) return;
        let seriesCount = 0;
        try { seriesCount = JSON.parse(this.getAttribute("series") || "[]").length; } catch (e) { seriesCount = 0; }
        if (seriesCount === 0) return;
        if (this._activeSeries === undefined) this._activeSeries = 0;
        let next = this._activeSeries;
        const rtl = (this.getAttribute("dir") || document.documentElement.getAttribute("dir") || "").toLowerCase() === "rtl";
        if (e.key === "ArrowRight") next = rtl ? Math.max(this._activeSeries - 1, 0) : Math.min(this._activeSeries + 1, seriesCount - 1);
        else if (e.key === "ArrowLeft") next = rtl ? Math.min(this._activeSeries + 1, seriesCount - 1) : Math.max(this._activeSeries - 1, 0);
        else if (e.key === "ArrowDown") next = Math.min(this._activeSeries + 1, seriesCount - 1);
        else if (e.key === "ArrowUp") next = Math.max(this._activeSeries - 1, 0);
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
/**
 * Comparison: web component wrapper.
 * Attributes: `divider`, `value`, `before`, `after`.
 */
class ContourComparison extends ContourBase {
    static get observed() { return ["divider", "value", "before", "after"]; }
    static get properties() { return { divider: { attribute: "divider" }, value: { attribute: "value" }, before: { attribute: "before" }, after: { attribute: "after" } }; }
    render() {
      this.classList.add("c-comparison");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Comparison");
      if (!this.style.blockSize) this.style.blockSize = "12rem";
      this.style.setProperty("--comparison-pos", (this.getAttribute("value") || "50") + "%");
      // Ensure two panes exist.
      const beforeLabel = this.getAttribute("before") || "Before";
      const afterLabel = this.getAttribute("after") || "After";
      if (!this.querySelector(".c-comparison__pane--before")) {
        const p = document.createElement("div");
        p.className = "c-comparison__pane c-comparison__pane--before";
        p.textContent = beforeLabel;
        this.appendChild(p);
      } else {
        const p = this.querySelector(".c-comparison__pane--before");
        if (p) p.textContent = beforeLabel;
      }
      if (!this.querySelector(".c-comparison__pane:not(.c-comparison__pane--before)")) {
        const p = document.createElement("div");
        p.className = "c-comparison__pane";
        p.textContent = afterLabel;
        this.appendChild(p);
      } else {
        const p = this.querySelector(".c-comparison__pane:not(.c-comparison__pane--before)");
        if (p) p.textContent = afterLabel;
      }
      const divider = this.getAttribute("divider");
      if (divider !== null) {
        const d = this.ensure(".c-comparison__divider", () => { const el = document.createElement("div"); el.className = "c-comparison__divider"; el.setAttribute("role", "separator"); el.setAttribute("aria-orientation", "vertical"); el.setAttribute("tabindex", "0"); return el; });
        if (divider) d.textContent = divider;
      } else {
        const d = this.querySelector(".c-comparison__divider");
        if (d) d.remove();
      }
    }
    enhance() {
      if (this._wiredComparison) return;
      this._wiredComparison = true;
      const divider = () => this.querySelector(".c-comparison__divider");
      const setPos = (pct) => {
        const clamped = Math.max(0, Math.min(100, pct));
        this.style.setProperty("--comparison-pos", clamped + "%");
        this.setAttribute("value", String(Math.round(clamped)));
        this.dispatchEvent(new CustomEvent("contour:drag", { bubbles: true, composed: true, detail: { value: clamped } }));
      };
      let dragging = false;
      const onMove = (e) => {
        if (!dragging) return;
        const rect = this.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        setPos(pct);
      };
      const onUp = () => { dragging = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
      onDispose(this, () => { dragging = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); });
      this.addEventListener("mousedown", (e) => {
        const d = divider();
        if (!d || !d.contains(e.target)) return;
        dragging = true;
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        e.preventDefault();
      });
      this.addEventListener("keydown", (e) => {
        const d = divider();
        if (!d || document.activeElement !== d) return;
        const cur = parseFloat(this.style.getPropertyValue("--comparison-pos")) || 50;
        if (e.key === "ArrowLeft") { e.preventDefault(); setPos(cur - 5); }
        else if (e.key === "ArrowRight") { e.preventDefault(); setPos(cur + 5); }
      });
    }
  }
  define("contour-comparison", ContourComparison);
/**
 * Streaming Chart: web component wrapper.
 * Attributes: `line`, `dot`, `interval`, `pause`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourStreamingChart extends ContourBase {
    static get updateMode() { return "keyed"; }
    static get observed() { return ["line", "dot", "interval", "pause", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { line: { attribute: "line" }, dot: { attribute: "dot" }, interval: { attribute: "interval", type: Number }, pause: { attribute: "pause", type: Boolean }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-streaming-chart");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Streaming chart");
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
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
        const want = Number.isFinite(seconds) && seconds > 0 && !this.hasAttribute("pause") && !this._streamPausedByUser && this._viewVisible !== false;
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
      // Pause the stream while the chart is off-screen (B3-22): watchViewport
      // is the loader's own visibility seam, so the stream reuses it instead of
      // a second observer. A user-set `pause` still wins; this only adds an
      // off-screen pause on top.
      if (!this._wiredStreamView) {
        this._wiredStreamView = true;
        this._viewVisible = true;
        watchViewport(this);
        this.addEventListener("contour:view-enter", () => { this._viewVisible = true; sync(); });
        this.addEventListener("contour:view-leave", () => { this._viewVisible = false; sync(); });
      }
      // The base re-runs enhance after every render, so interval/pause changes
      // are picked up by sync() above; the timer itself is owned exactly once.
      if (this._wiredStream) return;
      this._wiredStream = true;
      this._streamFrame = 0;
      onDispose(this, () => { if (this._streamTimer !== undefined) { clearInterval(this._streamTimer); this._streamTimer = undefined; } });
      // Keyboard: Space/Enter toggles pause (BY-08 keyboard contract).
      // Uses an internal flag so the toggle does not re-enter render.
      this._streamPausedByUser = false;
      this.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          this._streamPausedByUser = !this._streamPausedByUser;
          if (this._streamPausedByUser) this.setAttribute("data-user-paused", "");
          else this.removeAttribute("data-user-paused");
          sync();
        }
      });
    }
  }
define("contour-streaming-chart", ContourStreamingChart);
/**
 * Meter: web component wrapper.
 * Attributes: `value`, `label`, `variant`, `min`, `max`, `low`, `high`, `optimum`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourMeter extends ContourBase {
    static get observed() { return ["value", "label", "variant", "min", "max", "low", "high", "optimum", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { value: { attribute: "value" }, label: { attribute: "label" }, variant: { attribute: "variant" }, min: { attribute: "min" }, max: { attribute: "max" }, low: { attribute: "low" }, high: { attribute: "high" }, optimum: { attribute: "optimum" }, src: { attribute: "src" } }; }
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
         const num = parseFloat(rValue);
         if (Number.isFinite(num)) this.style.setProperty("--meter-value", rValue);
         else this.style.removeProperty("--meter-value");
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
      const min = this.getAttribute("min");
      const max = this.getAttribute("max");
      if (min !== null) this.setAttribute("aria-valuemin", min);
      else if (!this.hasAttribute("aria-valuemin")) this.setAttribute("aria-valuemin", "0");
      if (max !== null) this.setAttribute("aria-valuemax", max);
      else if (!this.hasAttribute("aria-valuemax")) this.setAttribute("aria-valuemax", "1");
      for (const a of ["low", "high", "optimum"]) {
        const v = this.getAttribute(a);
        if (v !== null) this.setAttribute("data-" + a, v);
        else this.removeAttribute("data-" + a);
      }
    }
  }
define("contour-meter", ContourMeter);
/**
 * Delta: web component wrapper.
 * Attributes: `value`, `direction`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourDelta extends ContourBase {
    static get observed() { return ["value", "direction", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { value: { attribute: "value" }, direction: { attribute: "direction" }, src: { attribute: "src" } }; }
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
/**
 * Stat: web component wrapper.
 * Attributes: `value`, `label`, `delta`, `unit`, `format`, `locale`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourStat extends ContourBase {
    static get observed() { return ["value", "label", "delta", "unit", "format", "locale", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { value: { attribute: "value" }, label: { attribute: "label" }, delta: { attribute: "delta" }, unit: { attribute: "unit" }, format: { attribute: "format" }, locale: { attribute: "locale" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-stat");
      wireStates(this);
      loadRemote(this, ["value", "label"]);
      if (renderStates(this, "stat")) return;
      const value = remoteData(this, "value");
      const label = remoteData(this, "label");
      const delta = this.getAttribute("delta");
      if (value) {
        const v = this.ensure(".c-stat__value", () => { const el = document.createElement("div"); el.className = "c-stat__value"; el.setAttribute("aria-live", "polite"); return el; });
        v.textContent = formatValue(value, this.getAttribute("format"), this.getAttribute("locale"), this.getAttribute("unit"));
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
/**
 * Gauge: web component wrapper.
 * Attributes: `value`, `min`, `max`, `heading`, `thresholds`, `format`, `locale`, `unit`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`, `brownout`, `brownout-level`, `no-data-message`, `show-header`, `description`.
 */
class ContourGauge extends ContourBase {
    static get observed() { return ["value", "min", "max", "heading", "thresholds", "format", "locale", "unit", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "brownout", "brownout-level", "no-data-message", "show-header", "description"]; }
    static get properties() { return { value: { attribute: "value" }, min: { attribute: "min" }, max: { attribute: "max" }, heading: { attribute: "heading" }, thresholds: { attribute: "thresholds" }, format: { attribute: "format" }, locale: { attribute: "locale" }, unit: { attribute: "unit" }, src: { attribute: "src" }, brownout: { attribute: "brownout" } }; }
    render() {
      this.classList.add("c-gauge");
      wireStates(this);
      loadRemote(this, ["value"]);
      if (renderStates(this, "gauge")) return;
      const rawValue = this.getAttribute("value");
      const num = parseFloat(rawValue);
      const hasValue = rawValue !== null && rawValue !== "" && Number.isFinite(num);
      const min = parseFloat(this.getAttribute("min") || "0");
      const max = parseFloat(this.getAttribute("max") || "100");
      const heading = this.getAttribute("heading");
      const showHeader = this.getAttribute("show-header") !== "false";
      const description = this.getAttribute("description");
      const noDataMessage = this.getAttribute("no-data-message") || "No readings in view";
      const brownoutLevel = parseInt(this.getAttribute("brownout-level") || this.getAttribute("brownout") || "0", 10) || 0;
      // empty state
      if (!hasValue) {
        if (heading && showHeader) {
          const t = this.ensure(".c-gauge__title", () => { const el = document.createElement("div"); el.className = "c-gauge__title"; return el; });
          t.textContent = heading;
        }
        const empty = this.ensure(".c-gauge__empty", () => { const el = document.createElement("div"); el.className = "c-gauge__empty"; el.setAttribute("part", "empty"); return el; });
        empty.textContent = noDataMessage;
        // remove dial/value/band if present
        [".c-gauge__dial", ".c-gauge__value", ".c-gauge__band"].forEach((sel) => { const n = this.querySelector(sel); if (n) n.remove(); });
        return;
      }
      // heading
      if (heading && showHeader) {
        const t = this.ensure(".c-gauge__title", () => { const el = document.createElement("div"); el.className = "c-gauge__title"; el.setAttribute("part", "title"); return el; });
        t.textContent = heading;
      } else {
        const t = this.querySelector(".c-gauge__title"); if (t) t.remove();
      }
      // thresholds
      let thresholds = [];
      const tAttr = this.getAttribute("thresholds");
      if (tAttr) { try { thresholds = JSON.parse(tAttr); } catch (e) { thresholds = []; } }
      // band determination
      let band = null;
      if (thresholds && thresholds.length) {
        // thresholds sorted ascending by value
        const sorted = [...thresholds].sort((a, b) => (a.value || 0) - (b.value || 0));
        for (let i = sorted.length - 1; i >= 0; i--) {
          if (num >= (sorted[i].value || 0)) { band = sorted[i]; break; }
        }
      }
      // dial (unless brownout >= 3)
      const shedDial = brownoutLevel >= 3;
      let dial = this.querySelector(".c-gauge__dial");
      if (shedDial) {
        if (dial) dial.remove();
      } else {
        if (!dial) {
          dial = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          dial.setAttribute("class", "c-gauge__dial");
          dial.setAttribute("part", "dial");
          dial.setAttribute("aria-hidden", "true");
          dial.setAttribute("viewBox", "0 0 100 100");
          this.appendChild(dial);
        }
        // rebuild dial content
        dial.innerHTML = "";
        // track arc (semicircle)
        const track = document.createElementNS("http://www.w3.org/2000/svg", "path");
        track.setAttribute("class", "c-gauge__track");
        track.setAttribute("d", "M 10 90 A 40 40 0 0 1 90 90");
        dial.appendChild(track);
        // zones: each threshold defines a band from its value to the next
        // threshold's value (or max), drawn as an arc along the track so the
        // bands no longer stack on top of one another.
        if (thresholds && thresholds.length) {
          const sorted = [...thresholds].sort((a, b) => (a.value || 0) - (b.value || 0));
          const toPoint = (v) => {
            const pos = (1 - (v - min) / (max - min || 1)) * Math.PI;
            return { x: 50 + 40 * Math.cos(pos), y: 90 - 40 * Math.sin(pos) };
          };
          for (let i = 0; i < sorted.length; i++) {
            const v1 = sorted[i].value || 0;
            const v2 = (i + 1 < sorted.length) ? (sorted[i + 1].value || max) : max;
            const p1 = toPoint(v1);
            const p2 = toPoint(v2);
            const z = document.createElementNS("http://www.w3.org/2000/svg", "path");
            z.setAttribute("class", "c-gauge__zone");
            z.setAttribute("stroke", sorted[i].color || "var(--color-primary)");
            z.setAttribute("d", "M " + p1.x.toFixed(2) + " " + p1.y.toFixed(2) + " A 40 40 0 0 1 " + p2.x.toFixed(2) + " " + p2.y.toFixed(2));
            dial.appendChild(z);
          }
        }
        // needle (pivot at dial centre 50,90; 0 -> left, 100 -> right)
        const ratio = (num - min) / (max - min || 1);
        const angle = Math.PI * (1 - ratio);
        const needle = document.createElementNS("http://www.w3.org/2000/svg", "line");
        needle.setAttribute("class", "c-gauge__needle needle");
        needle.setAttribute("x1", "50"); needle.setAttribute("y1", "90");
        needle.setAttribute("x2", String(50 + 35 * Math.cos(angle)));
        needle.setAttribute("y2", String(90 - 35 * Math.sin(angle)));
        dial.appendChild(needle);
        const hub = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        hub.setAttribute("class", "c-gauge__hub hub");
        hub.setAttribute("cx", "50"); hub.setAttribute("cy", "90"); hub.setAttribute("r", "4");
        dial.appendChild(hub);
      }
      // value element (meter)
      const valueEl = this.ensure(".c-gauge__value", () => { const el = document.createElement("div"); el.className = "c-gauge__value"; el.setAttribute("part", "value"); return el; });
      valueEl.textContent = formatValue(String(num), this.getAttribute("format"), this.getAttribute("locale")) + (this.getAttribute("unit") ? " " + this.getAttribute("unit") : "");
      valueEl.setAttribute("role", "meter");
      valueEl.setAttribute("aria-valuenow", String(num));
      valueEl.setAttribute("aria-valuemin", String(min));
      valueEl.setAttribute("aria-valuemax", String(max));
      if (heading) {
        // labelledby
        if (!valueEl.id) valueEl.id = contourId("gauge-value");
      }
      if (band) {
        valueEl.setAttribute("aria-valuetext", num + ", " + (band.label || (">= " + band.value)));
      } else {
        valueEl.setAttribute("aria-valuetext", String(num));
      }
      // aria-labelledby / aria-label
      const titleEl = this.querySelector(".c-gauge__title");
      if (titleEl) {
        if (!titleEl.id) titleEl.id = contourId("gauge-title");
        valueEl.setAttribute("aria-labelledby", titleEl.id);
        valueEl.removeAttribute("aria-label");
      } else {
        valueEl.removeAttribute("aria-labelledby");
        if (heading) valueEl.setAttribute("aria-label", heading);
      }
      // band word
      const bandEl = this.querySelector(".c-gauge__band");
      if (band) {
        const b = this.ensure(".c-gauge__band", () => { const el = document.createElement("div"); el.className = "c-gauge__band"; el.setAttribute("part", "band"); return el; });
        b.textContent = band.label || (">= " + band.value);
      } else {
        if (bandEl) bandEl.remove();
      }
      // description
      if (description) {
        let d = this.querySelector(".c-gauge__desc");
        if (!d) { d = document.createElement("div"); d.className = "c-gauge__desc"; this.appendChild(d); }
        d.textContent = description;
      }
    }
    enhance() {}
  }
define("contour-gauge", ContourGauge);
/**
 * Axis: web component wrapper.
 * Attributes: `orientation`, `values`, `ticks`, `format`, `locale`, `padding`, `min`, `max`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourAxis extends ContourBase {
    static get observed() { return ["orientation", "values", "ticks", "format", "locale", "padding", "min", "max", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { orientation: { attribute: "orientation" }, values: { attribute: "values" }, ticks: { attribute: "ticks" }, format: { attribute: "format" }, locale: { attribute: "locale" }, padding: { attribute: "padding" }, min: { attribute: "min" }, max: { attribute: "max" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-axis");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Axis");
      const orientation = this.getAttribute("orientation") || "horizontal";
      this.classList.toggle("c-axis--horizontal", orientation === "horizontal");
      this.classList.toggle("c-axis--vertical", orientation === "vertical");
      if (orientation === "horizontal") this.setAttribute("part", "axis-x");
      else this.setAttribute("part", "axis-y");
      wireStates(this);
      loadRemote(this, ["values"]);
      if (renderStates(this, "axis")) return;
      // parse values
      let values = [];
      const vAttr = this.getAttribute("values");
      if (vAttr) { try { values = JSON.parse(vAttr); } catch (e) { values = vAttr.split(",").map((x) => x.trim()); } }
      const ticks = parseInt(this.getAttribute("ticks") || "0", 10) || values.length;
      // Slotted content support: authored .c-axis__tick children take
      // precedence over the JSON `values` attribute.
      const authoredTicks = Array.from(this.querySelectorAll(":scope > .c-axis__tick"));
      if (authoredTicks.length) {
        // keep authored ticks, just ensure labels are formatted
        authoredTicks.forEach((tick) => {
          const label = tick.querySelector(".c-axis__label");
          if (label && !label.textContent) label.textContent = tick.textContent;
        });
      } else {
        // clear
        Array.from(this.querySelectorAll(".c-axis__tick")).forEach((n) => n.remove());
        const list = values.length ? values : Array.from({ length: ticks }, (_, i) => i);
        list.forEach((v) => {
          const tick = document.createElement("span");
          tick.className = "c-axis__tick";
          const label = document.createElement("span");
          label.className = "c-axis__label";
          label.textContent = formatValue(String(v), this.getAttribute("format"), this.getAttribute("locale"));
          tick.appendChild(label);
          this.appendChild(tick);
        });
      }
    }
    enhance() {}
  }
define("contour-axis", ContourAxis);
/**
 * Brush: web component wrapper.
 * Attributes: `start`, `end`, `min`, `max`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourBrush extends ContourBase {
    static get observed() { return ["start", "end", "min", "max", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { start: { attribute: "start" }, end: { attribute: "end" }, min: { attribute: "min" }, max: { attribute: "max" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-brush");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Brush selection");
      wireStates(this);
      loadRemote(this, []);
      if (renderStates(this, "brush")) return;
      let sel = this.querySelector(".c-brush__selection");
      if (!sel) { sel = document.createElement("div"); sel.className = "c-brush__selection"; this.appendChild(sel); }
      const start = parseFloat(this.getAttribute("start") || "0");
      const end = parseFloat(this.getAttribute("end") || "100");
      const min = parseFloat(this.getAttribute("min") || "0");
      const max = parseFloat(this.getAttribute("max") || "100");
      const range = max - min || 1;
      const left = ((start - min) / range) * 100;
      const width = ((end - start) / range) * 100;
      sel.style.insetInlineStart = left + "%";
      sel.style.inlineSize = width + "%";
      // handles
      ["start","end"].forEach((h) => {
        let handle = this.querySelector(".c-brush__handle--" + h);
        if (!handle) { handle = document.createElement("div"); handle.className = "c-brush__handle c-brush__handle--" + h; this.appendChild(handle); }
        const val = h === "start" ? start : end;
        handle.style.insetInlineStart = (((val - min) / range) * 100) + "%";
      });
    }
    enhance() {
      if (this._wiredBrush) return;
      this._wiredBrush = true;
      let dragging = null;
      const min = () => parseFloat(this.getAttribute("min") || "0");
      const max = () => parseFloat(this.getAttribute("max") || "100");
      const toValue = (clientX) => {
        const r = this.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - r.left) / (r.width || 1)));
        return min() + ratio * (max() - min());
      };
      this.addEventListener("pointerdown", (e) => {
        const handle = e.target && e.target.classList && e.target.classList.contains("c-brush__handle") ? e.target : null;
        dragging = handle ? (handle.classList.contains("c-brush__handle--start") ? "start" : "end") : "move";
        try { this.setPointerCapture(e.pointerId); } catch (err) {}
        this.dispatchEvent(new CustomEvent("contour:brush-start", { bubbles: true, composed: true, detail: { value: this.getAttribute("start"), start: this.getAttribute("start"), end: this.getAttribute("end") } }));
      });
      this.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const v = toValue(e.clientX);
        const mn = min(), mx = max(), range = mx - mn || 1;
        const sel = this.querySelector(".c-brush__selection");
        let ns = parseFloat(this.getAttribute("start") || "0");
        let ne = parseFloat(this.getAttribute("end") || "100");
        if (dragging === "start") {
          ns = Math.min(v, ne);
        } else if (dragging === "end") {
          ne = Math.max(v, ns);
        } else {
          const width = ne - ns;
          ns = v - width / 2;
          ne = v + width / 2;
          if (ns < mn) { ne += mn - ns; ns = mn; }
          if (ne > mx) { ns -= ne - mx; ne = mx; }
        }
        ns = Math.max(mn, Math.min(mx, ns));
        ne = Math.max(mn, Math.min(mx, ne));
        // update DOM directly to avoid re-render during drag
        if (sel) {
          sel.style.insetInlineStart = (((ns - mn) / range) * 100) + "%";
          sel.style.inlineSize = (((ne - ns) / range) * 100) + "%";
        }
        const sh = this.querySelector(".c-brush__handle--start");
        const eh = this.querySelector(".c-brush__handle--end");
        if (sh) sh.style.insetInlineStart = (((ns - mn) / range) * 100) + "%";
        if (eh) eh.style.insetInlineStart = (((ne - mn) / range) * 100) + "%";
        // stash pending values
        this._brushPending = { start: ns, end: ne };
      });
      this.addEventListener("pointerup", (e) => {
        if (!dragging) return;
        dragging = null;
        const p = this._brushPending;
        if (p) {
          this.setAttribute("start", String(p.start));
          this.setAttribute("end", String(p.end));
          this._brushPending = null;
        }
        this.dispatchEvent(new CustomEvent("contour:brush-end", { bubbles: true, composed: true, detail: { value: this.getAttribute("end"), start: this.getAttribute("start"), end: this.getAttribute("end") } }));
      });
      // Keyboard: Enter/Space emits brush-start/brush-end (WC-P1-08).
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:brush-start", { bubbles: true, composed: true, detail: { value: this.getAttribute("start"), start: this.getAttribute("start"), end: this.getAttribute("end") } }));
        }
      });
    }
  }
define("contour-brush", ContourBrush);
/**
 * Stacked Bar: web component wrapper.
 * Attributes: `segments`, `values`, `colors`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`, `normalize`.
 */
class ContourStackedBar extends ContourBase {
    static get observed() { return ["segments", "values", "colors", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "normalize"]; }
    static get properties() { return { segments: { attribute: "segments" }, values: { attribute: "values" }, colors: { attribute: "colors" }, src: { attribute: "src" }, normalize: { attribute: "normalize" } }; }
    render() {
      this.classList.add("c-stacked-bar");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Stacked bar");
      wireStates(this);
      loadRemote(this, ["segments", "values"]);
      if (renderStates(this, "stacked-bar")) return;
      Array.from(this.querySelectorAll(".c-stacked-bar__segment")).forEach((n) => n.remove());
      // Slotted content support: authored .c-stacked-bar__segment children take
      // precedence over the JSON `segments` attribute.
      const authoredSegments = Array.from(this.querySelectorAll(":scope > .c-stacked-bar__segment"));
      let segments = [];
      if (authoredSegments.length) {
        segments = authoredSegments.map((el) => ({
          label: el.getAttribute("title") || el.textContent || "",
          value: parseFloat(el.style.inlineSize) || 0,
          color: el.style.background || undefined,
        }));
        authoredSegments.forEach((el) => el.remove());
      } else {
        const sAttr = this.getAttribute("segments");
        if (sAttr) { try { segments = JSON.parse(sAttr); } catch (e) { segments = []; } }
      }
      const values = segments.map((seg) => (typeof seg === "object" ? (seg.value || 0) : Number(seg) || 0));
      const total = values.reduce((a, b) => a + b, 0) || 1;
      const normalize = this.hasAttribute("normalize");
      const denom = normalize ? total : (parseFloat(this.getAttribute("max") || String(total)) || total);
      segments.forEach((seg, i) => {
        const v = values[i];
        const el = document.createElement("div");
        el.className = "c-stacked-bar__segment";
        el.style.inlineSize = ((v / denom) * 100) + "%";
        el.style.background = (typeof seg === "object" && seg.color) ? seg.color : "var(--chart-" + ((i % 8) + 1) + ")";
        el.setAttribute("title", (typeof seg === "object" ? (seg.label || "") : "") + " " + v);
        this.appendChild(el);
      });
      if (!segments.length) renderEmpty(this, "stacked-bar");
    }
    enhance() {}
  }
define("contour-stacked-bar", ContourStackedBar);
/**
 * Category: web component wrapper.
 * Attributes: `items`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`, `search`.
 */
class ContourCategory extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "search", "note", "limit", "sort"]; }
    static get properties() { return { items: { attribute: "items" }, src: { attribute: "src" }, search: { attribute: "search" }, note: { attribute: "note" }, limit: { attribute: "limit" }, sort: { attribute: "sort" } }; }
    render() {
      this.classList.add("c-category");
      this.setAttribute("role", "listbox");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Category");
      wireStates(this);
      loadRemote(this, ["items"]);
      if (renderStates(this, "category")) return;
      Array.from(this.querySelectorAll(".c-category__item")).forEach((n) => n.remove());
      // Slotted content support: authored .c-category__item children take
      // precedence over the JSON `items` attribute.
      const authoredItems = Array.from(this.querySelectorAll(":scope > .c-category__item"));
      let items = [];
      if (authoredItems.length) {
        authoredItems.forEach((el) => {
          const lbl = el.querySelector(".c-category__label");
          items.push({ label: lbl ? lbl.textContent : el.textContent, value: 0 });
        });
        authoredItems.forEach((el) => el.remove());
      } else {
        const iAttr = this.getAttribute("items");
        if (iAttr) { try { items = JSON.parse(iAttr); } catch (e) { items = []; } }
      }
      // Top-N + sort (CARTO-inspired): optional `limit` and `sort` attributes.
      const sort = this.getAttribute("sort") || "value-desc";
      items.sort((a, b) => {
        const va = (typeof a === "object") ? (a.value || 0) : (Number(a) || 0);
        const vb = (typeof b === "object") ? (b.value || 0) : (Number(b) || 0);
        const la = (typeof a === "object") ? (a.label || a.name || "") : String(a);
        const lb = (typeof b === "object") ? (b.label || b.name || "") : String(b);
        if (sort === "value-asc") return va - vb;
        if (sort === "alpha-asc") return String(la).localeCompare(String(lb));
        if (sort === "alpha-desc") return String(lb).localeCompare(String(la));
        return vb - va; // value-desc (default)
      });
      const limit = parseInt(this.getAttribute("limit") || "0", 10);
      if (limit > 0) items = items.slice(0, limit);
      const max = items.reduce((m, it) => Math.max(m, (typeof it === "object" ? (it.value || 0) : Number(it) || 0)), 0) || 1;
      items.forEach((it, idx) => {
        const value = (typeof it === "object") ? (it.value || 0) : (Number(it) || 0);
        const label = (typeof it === "object") ? (it.label || it.name || "") : String(it);
        const item = document.createElement("div");
        item.className = "c-category__item";
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", "false");
        item.setAttribute("tabindex", idx === 0 ? "0" : "-1");
        const lbl = document.createElement("span");
        lbl.className = "c-category__label";
        lbl.textContent = label;
        const barWrap = document.createElement("div");
        barWrap.style.flex = "1";
        const bar = document.createElement("div");
        bar.className = "c-category__bar";
        bar.style.inlineSize = ((value / max) * 100) + "%";
        barWrap.appendChild(bar);
        const val = document.createElement("span");
        val.className = "c-category__value";
        val.textContent = String(value);
        item.appendChild(lbl);
        item.appendChild(barWrap);
        item.appendChild(val);
        this.appendChild(item);
      });
      if (!items.length) renderEmpty(this, "category");
      const note = this.getAttribute("note");
      let noteEl = this.querySelector(".c-category__note");
      if (note) {
        if (!noteEl) { noteEl = document.createElement("div"); noteEl.className = "c-category__note"; this.appendChild(noteEl); }
        noteEl.textContent = note;
      } else if (noteEl) {
        noteEl.remove();
      }
    }
    enhance() {
      if (this._wiredCategory) return;
      this._wiredCategory = true;
      const items = () => Array.from(this.querySelectorAll(".c-category__item"));
      const showTip = (e) => {};
      this.addEventListener("click", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".c-category__item") : null;
        if (!item || !this.contains(item)) return;
        const all = items();
        const idx = all.indexOf(item);
        all.forEach((o, i) => o.setAttribute("aria-selected", i === idx ? "true" : "false"));
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: idx, label: item.querySelector(".c-category__label") ? item.querySelector(".c-category__label").textContent : item.textContent.trim() } }));
      });
      this.addEventListener("keydown", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".c-category__item") : null;
        if (!item || !this.contains(item)) return;
        const all = items();
        const idx = all.indexOf(item);
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          all.forEach((o, i) => o.setAttribute("aria-selected", i === idx ? "true" : "false"));
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: idx, label: item.querySelector(".c-category__label") ? item.querySelector(".c-category__label").textContent : item.textContent.trim() } }));
          return;
        }
        let next = -1;
        const rtl = (this.getAttribute("dir") || document.documentElement.getAttribute("dir") || "").toLowerCase() === "rtl";
        if (e.key === "ArrowDown") next = Math.min(idx + 1, all.length - 1);
        else if (e.key === "ArrowUp") next = Math.max(idx - 1, 0);
        else if (e.key === "ArrowRight") next = rtl ? Math.max(idx - 1, 0) : Math.min(idx + 1, all.length - 1);
        else if (e.key === "ArrowLeft") next = rtl ? Math.min(idx + 1, all.length - 1) : Math.max(idx - 1, 0);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = all.length - 1;
        if (next < 0 || next === idx) return;
        e.preventDefault();
        all.forEach((c, i) => c.setAttribute("tabindex", i === next ? "0" : "-1"));
        try { all[next].focus(); } catch (err) {}
      });
    }
  }
define("contour-category", ContourCategory);
/**
 * Donut: web component wrapper.
 * Attributes: `value`, `values`, `items`, `label`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`, `brownout`, `brownout-level`.
 */
class ContourDonut extends ContourBase {
    static get observed() { return ["value", "values", "items", "label", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "brownout", "brownout-level", "note"]; }
    static get properties() { return { value: { attribute: "value" }, values: { attribute: "values" }, items: { attribute: "items" }, label: { attribute: "label" }, src: { attribute: "src" }, note: { attribute: "note" } }; }
    render() {
      this.classList.add("c-donut");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Donut chart");
      wireStates(this);
      loadRemote(this, ["items", "values"]);
      if (renderStates(this, "donut")) return;
      Array.from(this.querySelectorAll(".c-donut__ring, .c-donut__center, .c-donut__list, .c-donut__empty")).forEach((n) => n.remove());
      // Slotted content support: authored .c-donut__item children take precedence
      // over the JSON `items` attribute, so consumers can compose legend rows
      // by hand instead of serialising them into an attribute.
      const authoredItems = Array.from(this.querySelectorAll(":scope > .c-donut__item"));
      let items = [];
      if (authoredItems.length) {
        authoredItems.forEach((el) => {
          const sw = el.querySelector(".c-donut__swatch");
          const lbl = el.querySelector("span:last-child");
          const text = lbl ? lbl.textContent : el.textContent;
          const match = text.match(/—\s*(\d+(?:\.\d+)?)$/);
          items.push({ label: text.replace(/—\s*\d+(?:\.\d+)?$/, "").trim(), value: match ? Number(match[1]) : 0, color: sw ? sw.style.background : undefined });
        });
        // remove authored items from DOM (they will be regenerated below)
        authoredItems.forEach((el) => el.remove());
      } else {
        const iAttr = this.getAttribute("items");
        if (iAttr) { try { items = JSON.parse(iAttr); } catch (e) { items = []; } }
      }
      const values = items.map((it) => (typeof it === "object" ? (it.value || 0) : Number(it) || 0));
      const total = values.reduce((a, b) => a + b, 0) || 1;
      const brownoutLevel = parseInt(this.getAttribute("brownout-level") || this.getAttribute("brownout") || "0", 10) || 0;
      const shedRing = brownoutLevel >= 3;
      if (!shedRing) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "c-donut__ring");
        svg.setAttribute("viewBox", "0 0 32 32");
        let offset = 0;
        items.forEach((it, i) => {
          const v = values[i];
          const pct = v / total;
          const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          circle.setAttribute("cx", "16"); circle.setAttribute("cy", "16"); circle.setAttribute("r", "12");
          circle.setAttribute("fill", "none");
          circle.setAttribute("stroke", (typeof it === "object" && it.color) ? it.color : "var(--chart-" + ((i % 8) + 1) + ")");
          circle.setAttribute("stroke-width", "6");
          const circ = 2 * Math.PI * 12;
          circle.setAttribute("stroke-dasharray", (pct * circ) + " " + (circ - pct * circ));
          circle.setAttribute("stroke-dashoffset", String(-offset * circ));
          circle.setAttribute("transform", "rotate(-90 16 16)");
          svg.appendChild(circle);
          offset += pct;
        });
        // center hole
        const hole = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        hole.setAttribute("cx", "16"); hole.setAttribute("cy", "16"); hole.setAttribute("r", "9");
        hole.setAttribute("fill", "var(--color-surface-0)");
        svg.appendChild(hole);
        this.appendChild(svg);
      }
      const center = document.createElement("div");
      center.className = "c-donut__center";
      center.textContent = this.getAttribute("value") || String(total);
      this.appendChild(center);
      // text list
      const list = document.createElement("div");
      list.className = "c-donut__list";
      items.forEach((it, i) => {
        const row = document.createElement("div");
        row.className = "c-donut__item";
        const sw = document.createElement("span");
        sw.className = "c-donut__swatch";
        sw.style.background = (typeof it === "object" && it.color) ? it.color : "var(--chart-" + ((i % 8) + 1) + ")";
        row.appendChild(sw);
        const lbl = document.createElement("span");
        lbl.textContent = (typeof it === "object" ? (it.label || "") : String(it)) + " — " + values[i];
        row.appendChild(lbl);
        list.appendChild(row);
      });
      this.appendChild(list);
      if (!items.length) renderEmpty(this, "donut");
      const note = this.getAttribute("note");
      let noteEl = this.querySelector(".c-donut__note");
      if (note) {
        if (!noteEl) { noteEl = document.createElement("div"); noteEl.className = "c-donut__note"; this.appendChild(noteEl); }
        noteEl.textContent = note;
      } else if (noteEl) {
        noteEl.remove();
      }
    }
    enhance() {}
  }
define("contour-donut", ContourDonut);
/**
 * Time Series: web component wrapper.
 * Attributes: `values`, `points`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`, `annotations`.
 */
class ContourTimeSeries extends ContourBase {
    static get observed() { return ["values", "points", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "annotations", "note", "style"]; }
    static get properties() { return { values: { attribute: "values" }, points: { attribute: "points" }, src: { attribute: "src" }, annotations: { attribute: "annotations" }, note: { attribute: "note" }, style: { attribute: "style" } }; }
    render() {
      this.classList.add("c-time-series");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Time series");
      wireStates(this);
      loadRemote(this, ["values", "points"]);
      if (renderStates(this, "time-series")) return;
      Array.from(this.querySelectorAll(".c-time-series__plot, .c-time-series__axis")).forEach((n) => n.remove());
      let values = [];
      const vAttr = this.getAttribute("values");
      if (vAttr) { try { values = JSON.parse(vAttr); } catch (e) { values = vAttr.split(",").map(Number); } }
      const max = Math.max(...values, 1);
      const min = Math.min(...values, 0);
      const style = this.getAttribute("style") || "bar";
      const plot = document.createElement("div");
      plot.className = "c-time-series__plot";
      plot.setAttribute("part", "plot");
      if (style === "line") {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 300 120");
        svg.setAttribute("preserveAspectRatio", "none");
        svg.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%";
        const range = (max - min) || 1;
        const n = values.length || 1;
        const pts = values.map((v, i) => {
          const x = (i / Math.max(1, n - 1)) * 300;
          const y = 120 - ((v - min) / range) * 120;
          return x.toFixed(2) + "," + y.toFixed(2);
        }).join(" ");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", "c-time-series__line");
        path.setAttribute("d", "M " + pts.replace(/ /g, " L "));
        path.style.stroke = "var(--chart-1)";
        path.style.fill = "none";
        path.style.strokeWidth = "2";
        svg.appendChild(path);
        // point markers
        values.forEach((v, i) => {
          const x = (i / Math.max(1, n - 1)) * 300;
          const y = 120 - ((v - min) / range) * 120;
          const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          c.setAttribute("class", "c-time-series__point");
          c.setAttribute("cx", x.toFixed(2));
          c.setAttribute("cy", y.toFixed(2));
          c.setAttribute("r", "3");
          c.setAttribute("tabindex", i === 0 ? "0" : "-1");
          c.setAttribute("role", "button");
          c.setAttribute("title", String(v));
          c.setAttribute("aria-label", "Value " + v);
          svg.appendChild(c);
        });
        plot.appendChild(svg);
      } else {
        values.forEach((v, i) => {
          const bar = document.createElement("div");
          bar.className = "c-time-series__bar";
          bar.style.blockSize = ((v / max) * 100) + "%";
          bar.setAttribute("title", String(v));
          bar.setAttribute("role", "img");
          bar.setAttribute("aria-label", "Value " + v);
          bar.setAttribute("tabindex", i === 0 ? "0" : "-1");
          plot.appendChild(bar);
        });
      }
      this.appendChild(plot);
      if (!values.length) renderEmpty(this, "time-series");
      const note = this.getAttribute("note");
      let noteEl = this.querySelector(".c-time-series__note");
      if (note) {
        if (!noteEl) { noteEl = document.createElement("div"); noteEl.className = "c-time-series__note"; this.appendChild(noteEl); }
        noteEl.textContent = note;
      } else if (noteEl) {
        noteEl.remove();
      }
    }
    enhance() {
      if (this._wiredTimeSeries) return;
      this._wiredTimeSeries = true;
      const bars = () => Array.from(this.querySelectorAll(".c-time-series__bar"));
      this.addEventListener("click", (e) => {
        const bar = e.target && e.target.closest ? e.target.closest(".c-time-series__bar") : null;
        if (!bar || !this.contains(bar)) return;
        const idx = bars().indexOf(bar);
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: idx, value: bar.getAttribute("title") } }));
      });
      this.addEventListener("keydown", (e) => {
        const bar = e.target && e.target.closest ? e.target.closest(".c-time-series__bar") : null;
        if (!bar || !this.contains(bar)) return;
        const all = bars();
        const idx = all.indexOf(bar);
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: idx, value: bar.getAttribute("title") } }));
          return;
        }
        let next = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.min(idx + 1, all.length - 1);
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.max(idx - 1, 0);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = all.length - 1;
        if (next < 0 || next === idx) return;
        e.preventDefault();
        all.forEach((b, i) => b.setAttribute("tabindex", i === next ? "0" : "-1"));
        try { all[next].focus(); } catch (err) {}
      });
      // focus tooltip
      this.addEventListener("focusin", (e) => {
        const bar = e.target && e.target.closest ? e.target.closest(".c-time-series__bar") : null;
        if (bar && this.contains(bar)) {
          const tip = this.querySelector(".c-time-series__tooltip");
          if (tip) { tip.textContent = bar.getAttribute("title"); tip.removeAttribute("hidden"); }
        }
      });
      this.addEventListener("focusout", (e) => {
        const tip = this.querySelector(".c-time-series__tooltip");
        if (tip && !this.contains(e.relatedTarget)) tip.setAttribute("hidden", "");
      });
    }
  }
define("contour-time-series", ContourTimeSeries);
/**
 * Pivot: web component wrapper.
 * Attributes: `rows`, `columns`, `values`, `data`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourPivot extends ContourBase {
    static get observed() { return ["rows", "columns", "values", "data", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { rows: { attribute: "rows" }, columns: { attribute: "columns" }, values: { attribute: "values" }, data: { attribute: "data" }, src: { attribute: "src" }, filter: { attribute: "filter" }, aggregate: { attribute: "aggregate" } }; }
    _aggregateFn(name) {
      const n = (name || "sum").toLowerCase();
      if (n === "avg" || n === "average" || n === "mean") return (vals) => vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
      if (n === "count") return (vals) => vals.length;
      if (n === "min") return (vals) => vals.length ? Math.min(...vals) : 0;
      if (n === "max") return (vals) => vals.length ? Math.max(...vals) : 0;
      return (vals) => vals.reduce((a,b)=>a+b,0);
    }
    render() {
      this.classList.add("c-pivot");
      wireStates(this);
      loadRemote(this, ["data"]);
      if (renderStates(this, "pivot")) return;
      Array.from(this.querySelectorAll("table, .c-pivot__toolbar")).forEach((n) => n.remove());
      let data = [];
      const dAttr = this.getAttribute("data");
      if (dAttr) { try { data = JSON.parse(dAttr); } catch (e) { data = []; } }
      const rows = this.getAttribute("rows") ? this.getAttribute("rows").split(",").map((s)=>s.trim()).filter(Boolean) : [];
      const cols = this.getAttribute("columns") ? this.getAttribute("columns").split(",").map((s)=>s.trim()).filter(Boolean) : [];
      const aggName = this.getAttribute("aggregate") || "sum";
      const aggFn = this._aggregateFn(aggName);
      const filterQ = (this.getAttribute("filter") || "").toLowerCase().trim();
      // Toolbar: filter input + aggregate selector.
      const toolbar = document.createElement("div");
      toolbar.className = "c-pivot__toolbar";
      toolbar.style.display = "flex";
      toolbar.style.gap = "0.5rem";
      toolbar.style.marginBlockEnd = "0.5rem";
      const filterInput = document.createElement("input");
      filterInput.type = "search";
      filterInput.className = "c-input c-pivot__filter";
      filterInput.placeholder = "Filter…";
      filterInput.value = this.getAttribute("filter") || "";
      filterInput.setAttribute("aria-label", "Filter pivot");
      const aggSelect = document.createElement("select");
      aggSelect.className = "c-select c-pivot__aggregate";
      aggSelect.setAttribute("aria-label", "Aggregation");
      ["sum","avg","count","min","max"].forEach((a) => {
        const opt = document.createElement("option");
        opt.value = a; opt.textContent = a;
        if (a === aggName) opt.selected = true;
        aggSelect.appendChild(opt);
      });
      toolbar.appendChild(filterInput);
      toolbar.appendChild(aggSelect);
      this.appendChild(toolbar);
      // Filter rows/cols.
      let visibleRows = rows;
      let visibleCols = cols;
      if (filterQ) {
        visibleRows = rows.filter((r) => r.toLowerCase().includes(filterQ) || data.some((d) => d.row === r && String(d.value).toLowerCase().includes(filterQ)));
        visibleCols = cols.filter((c) => c.toLowerCase().includes(filterQ) || data.some((d) => d.col === c && String(d.value).toLowerCase().includes(filterQ)));
        if (!visibleRows.length) visibleRows = rows;
        if (!visibleCols.length) visibleCols = cols;
      }
      const table = document.createElement("table");
      table.setAttribute("role", "grid");
      table.setAttribute("aria-rowcount", String(visibleRows.length + 1));
      table.setAttribute("aria-colcount", String(visibleCols.length + 1));
      const thead = document.createElement("thead");
      const hr = document.createElement("tr");
      const corner = document.createElement("th");
      corner.textContent = "";
      corner.setAttribute("role", "columnheader");
      hr.appendChild(corner);
      visibleCols.forEach((c) => { const th = document.createElement("th"); th.textContent = c; th.setAttribute("role", "columnheader"); th.setAttribute("tabindex", "0"); hr.appendChild(th); });
      thead.appendChild(hr);
      table.appendChild(thead);
      const tbody = document.createElement("tbody");
      visibleRows.forEach((r) => {
        const tr = document.createElement("tr");
        tr.setAttribute("role", "row");
        const th = document.createElement("th");
        th.textContent = r;
        th.setAttribute("role", "rowheader");
        th.setAttribute("tabindex", "0");
        tr.appendChild(th);
        visibleCols.forEach((c) => {
          const td = document.createElement("td");
          td.setAttribute("role", "gridcell");
          td.setAttribute("tabindex", "0");
          const cellData = data.filter((d) => d.row === r && d.col === c);
          const vals = cellData.map((d) => Number(d.value)).filter((n) => Number.isFinite(n));
          if (cellData.length && vals.length === cellData.length && vals.length) {
            const v = aggFn(vals);
            td.textContent = Number.isInteger(v) ? String(v) : v.toFixed(2);
          } else if (cellData.length) {
            td.textContent = cellData.map((d) => d.value).join(", ");
          } else {
            td.textContent = "";
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      this.appendChild(table);
      if (!data.length && !rows.length && !cols.length) renderEmpty(this, "pivot");
    }
    enhance() {
      if (this._wiredPivot) return;
      this._wiredPivot = true;
      this.addEventListener("click", (e) => {
        const th = e.target && e.target.closest ? e.target.closest("th") : null;
        const td = e.target && e.target.closest ? e.target.closest("td") : null;
        const filterInput = e.target && e.target.closest ? e.target.closest(".c-pivot__filter") : null;
        const aggSelect = e.target && e.target.closest ? e.target.closest(".c-pivot__aggregate") : null;
        if (filterInput) return;
        if (aggSelect) return;
        if (th && this.contains(th) && th.parentElement && th.parentElement.parentElement && th.parentElement.parentElement.tagName === "THEAD") {
          this.dispatchEvent(new CustomEvent("contour:sort", { bubbles: true, composed: true, detail: { column: th.textContent.trim() } }));
          return;
        }
        if (td && this.contains(td)) {
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { value: td.textContent } }));
        }
      });
      this.addEventListener("input", (e) => {
        const fi = e.target && e.target.closest ? e.target.closest(".c-pivot__filter") : null;
        if (fi && this.contains(fi)) {
          this.setAttribute("filter", fi.value);
          this.render();
          this.dispatchEvent(new CustomEvent("contour:filter", { bubbles: true, composed: true, detail: { query: fi.value } }));
        }
      });
      this.addEventListener("change", (e) => {
        const as = e.target && e.target.closest ? e.target.closest(".c-pivot__aggregate") : null;
        if (as && this.contains(as)) {
          this.setAttribute("aggregate", as.value);
          this.render();
          this.dispatchEvent(new CustomEvent("contour:aggregate", { bubbles: true, composed: true, detail: { aggregate: as.value } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest("th, td") : null;
        if (!cell || !this.contains(cell)) return;
        const table = this.querySelector("table");
        if (!table) return;
        const rows = Array.from(table.querySelectorAll("tr"));
        const ri = rows.indexOf(cell.parentElement);
        const ci = Array.from(cell.parentElement.children).indexOf(cell);
        let target = null;
        if (e.key === "ArrowRight") target = cell.parentElement.children[ci + 1];
        else if (e.key === "ArrowLeft") target = cell.parentElement.children[ci - 1];
        else if (e.key === "ArrowDown") target = rows[ri + 1] && rows[ri + 1].children[ci];
        else if (e.key === "ArrowUp") target = rows[ri - 1] && rows[ri - 1].children[ci];
        else if (e.key === "Home") target = cell.parentElement.children[0];
        else if (e.key === "End") target = cell.parentElement.children[cell.parentElement.children.length - 1];
        if (target) { e.preventDefault(); try { target.focus(); } catch (err) {} }
      });
    }
  }
define("contour-pivot", ContourPivot);
/**
 * Widget State: web component wrapper.
 * Attributes: `loading`, `error`, `empty`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourWidgetState extends ContourBase {
    static get observed() { return ["loading", "error", "empty", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { loading: { attribute: "loading" }, error: { attribute: "error" }, empty: { attribute: "empty" }, retry: { attribute: "retry" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-widget-state");
      wireStates(this);
      loadRemote(this, []);
      if (renderStates(this, "widget-state")) return;
      // if no state, render slotted content (already in DOM)
    }
    enhance() {}
  }
define("contour-widget-state", ContourWidgetState);
/**
 * Brownout: web component wrapper.
 * Attributes: `level`.
 */
class ContourBrownout extends ContourBase {
    static get observed() { return ["level"]; }
    static get properties() { return { level: { attribute: "level" } }; }
    render() {
      this.classList.add("c-brownout");
      const level = this.getAttribute("level") || "0";
      this.dataset.level = level;
      this.setAttribute("data-level", level);
    }
    enhance() {}
  }
define("contour-brownout", ContourBrownout);
/**
 * Instrument: web component wrapper.
 * Attributes: `rows`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourInstrument extends ContourBase {
    static get observed() { return ["rows", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { rows: { attribute: "rows" }, src: { attribute: "src" } }; }
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
/**
 * Bivariate: web component wrapper.
 * Attributes: `size`, `axis-x`, `axis-y`, `colors`, `selected`.
 */
class ContourBivariate extends ContourBase {
    static get observed() { return ["size", "axis-x", "axis-y", "colors", "selected"]; }
    static get properties() { return { size: { attribute: "size" }, axisX: { attribute: "axis-x" }, axisY: { attribute: "axis-y" }, colors: { attribute: "colors" }, selected: { attribute: "selected" } }; }
    render() {
      this.classList.add("c-bivariate");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Bivariate legend");
      const size = Math.min(12, Math.max(1, parseInt(this.getAttribute("size") || "3", 10) || 3));
      const matrix = this.ensure(".c-bivariate__matrix", () => { const el = document.createElement("div"); el.className = "c-bivariate__matrix"; return el; });
      matrix.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      matrix.style.gridTemplateRows = `repeat(${size}, 1fr)`;
      // Slot composition: authored cells win over the generated grid.
      const authored = Array.from(matrix.children).filter((n) => n.classList && n.classList.contains("c-bivariate__cell"));
      if (!authored.length) {
        matrix.innerHTML = "";
        let colors = [];
        const cAttr = this.getAttribute("colors");
        if (cAttr) { try { colors = JSON.parse(cAttr); } catch (e) { colors = []; } }
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const cell = document.createElement("div");
            cell.className = "c-bivariate__cell";
            cell.setAttribute("role", "button");
            cell.setAttribute("tabindex", "0");
            cell.setAttribute("aria-label", "Cell " + c + "," + r);
            // Palette runs from bottom-left (low/low) to top-right (high/high):
            // reverse the row order so the first palette row sits at the bottom.
            const srcIndex = (size - 1 - r) * size + c;
            if (colors[srcIndex]) cell.style.background = colors[srcIndex];
            matrix.appendChild(cell);
          }
        }
        // selected highlight
        const sel = this.getAttribute("selected");
        if (sel) {
          const parts = sel.split(",");
          const sr = parseInt(parts[0], 10);
          const sc = parseInt(parts[1], 10);
          const cells = Array.from(matrix.querySelectorAll(".c-bivariate__cell"));
          cells.forEach((cell, i) => {
            const rr = Math.floor(i / size);
            const cc = i % size;
            // matrix is row-major in DOM? cells appended row by row r then c, so index = r*size+c
            if (rr === sr && cc === sc) cell.setAttribute("data-selected", "");
            else cell.removeAttribute("data-selected");
          });
        }
        // aria-live region
        let live = this.querySelector(".c-bivariate__live");
        if (!live) { live = document.createElement("div"); live.className = "c-bivariate__live"; live.setAttribute("aria-live", "polite"); live.style.position = "absolute"; live.style.width = "1px"; live.style.height = "1px"; live.style.overflow = "hidden"; live.style.clip = "rect(0,0,0,0)"; this.appendChild(live); }
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
    enhance() {
      if (this._wiredBivariate) return;
      this._wiredBivariate = true;
      const selectCell = (cell) => {
        const matrix = this.querySelector(".c-bivariate__matrix");
        const cells = Array.from(matrix ? matrix.querySelectorAll(".c-bivariate__cell") : []);
        const idx = cells.indexOf(cell);
        if (idx < 0) return;
        const size = Math.min(12, Math.max(1, parseInt(this.getAttribute("size") || "3", 10) || 3));
        const row = Math.floor(idx / size);
        const col = idx % size;
        cells.forEach((cell, i) => {
          const rr = Math.floor(i / size);
          const cc = i % size;
          if (rr === row && cc === col) cell.setAttribute("data-selected", "");
          else cell.removeAttribute("data-selected");
        });
        this.dispatchEvent(new CustomEvent("contour:select", { detail: { row, col }, bubbles: true, composed: true }));
      };
      this.addEventListener("click", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-bivariate__cell") : null;
        if (cell && this.contains(cell)) selectCell(cell);
      });
      this.addEventListener("keydown", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-bivariate__cell") : null;
        if (!cell || !this.contains(cell)) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectCell(cell);
        }
      });
    }
    clear() {
      this.removeAttribute("selected");
      this.dispatchEvent(new CustomEvent("contour:clear", { bubbles: true, composed: true }));
    }
  }
  define("contour-bivariate", ContourBivariate);
class ContourBivariateLegend extends ContourBivariate {
    static get observed() { return ["size", "axis-x", "axis-y", "colors", "selected"]; }
    static get properties() { return { size: { attribute: "size" }, axisX: { attribute: "axis-x" }, axisY: { attribute: "axis-y" }, colors: { attribute: "colors" }, selected: { attribute: "selected" } }; }
    render() {
      super.render();
      this.classList.add("c-bivariate-legend");
    }
    enhance() {
      if (this._wiredBivLegend) return;
      this._wiredBivLegend = true;
      const selectCell = (cell) => {
        const matrix = this.querySelector(".c-bivariate__matrix");
        const cells = Array.from(matrix ? matrix.querySelectorAll(".c-bivariate__cell") : []);
        const idx = cells.indexOf(cell);
        if (idx < 0) return;
        const size = Math.min(8, Math.max(1, parseInt(this.getAttribute("size") || "3", 10) || 3));
        const row = Math.floor(idx / size);
        const col = idx % size;
        cells.forEach((cell, i) => {
          const rr = Math.floor(i / size);
          const cc = i % size;
          if (rr === row && cc === col) cell.setAttribute("data-selected", "");
          else cell.removeAttribute("data-selected");
        });
        this.dispatchEvent(new CustomEvent("contour:select", { detail: { row, col }, bubbles: true, composed: true }));
      };
      this.addEventListener("click", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-bivariate__cell") : null;
        if (cell && this.contains(cell)) selectCell(cell);
      });
      this.addEventListener("keydown", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-bivariate__cell") : null;
        if (!cell || !this.contains(cell)) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectCell(cell); }
      });
    }
    clear() { this.removeAttribute("selected"); this.dispatchEvent(new CustomEvent("contour:clear", { bubbles: true, composed: true })); }
  }
define("contour-bivariate-legend", ContourBivariateLegend);
/**
 * Survey: web component wrapper.
 * Attributes: `date`, `instrument`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourSurvey extends ContourBase {
    static get observed() { return ["date", "instrument", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { date: { attribute: "date" }, instrument: { attribute: "instrument" }, src: { attribute: "src" } }; }
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
/**
 * Threshold: web component wrapper.
 * Attributes: `label`, `norm`, `state`, `value`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourThreshold extends ContourBase {
    static get observed() { return ["label", "norm", "state", "value", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, norm: { attribute: "norm" }, state: { attribute: "state" }, value: { attribute: "value" }, src: { attribute: "src" } }; }
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
/**
 * Metrics Full: web component wrapper.
 * Attributes: `items`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourMetricsFull extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-metrics");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "metrics")) return;
      const items = remoteData(this, "items");
      // Drop previously generated items so re-render doesn't stack.
      Array.from(this.querySelectorAll(".c-metrics__item")).forEach((n) => n.remove());
      let parsed = null;
      if (items) { try { parsed = JSON.parse(items); } catch (e) { parsed = null; } }
      if (Array.isArray(parsed) && parsed.length) {
        parsed.forEach((it) => {
          const item = document.createElement("div");
          item.className = "c-metrics__item";
          const v = document.createElement("div");
          v.className = "c-metrics__value";
          v.textContent = (typeof it === "object" && it !== null) ? (it.value ?? it.v ?? "") : String(it);
          const l = document.createElement("div");
          l.className = "c-metrics__label";
          l.textContent = (typeof it === "object" && it !== null) ? (it.label ?? it.l ?? "") : "";
          item.appendChild(v);
          item.appendChild(l);
          this.appendChild(item);
        });
      } else if (!items) {
        renderEmpty(this, "metrics");
      }
    }
    enhance() { wireStates(this); }
  }
  define("contour-metrics", ContourMetricsFull);
/**
 * Legend: web component wrapper.
 * Attributes: `title`, `ramp`, `scale`, `items`, `method`, `norm`, `selectable`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`, `glyphs`, `thresholds`, `breaks`, `no-data-color`, `size`, `table`, `classification`, `audit`, `continuous`, `ends`, `caption`.
 */
class ContourLegend extends ContourBase {
    static get observed() { return ["title", "ramp", "scale", "items", "method", "norm", "selectable", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "glyphs", "thresholds", "breaks", "no-data-color", "size", "table", "classification", "audit", "continuous", "ends", "caption"]; }
    static get properties() { return { title: { attribute: "title" }, ramp: { attribute: "ramp" }, scale: { attribute: "scale" }, items: { attribute: "items" }, method: { attribute: "method" }, norm: { attribute: "norm" }, selectable: { attribute: "selectable", type: Boolean }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-legend");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "legend")) return;
      // Selectable legends (BY-41): items become toggle buttons with
      // aria-pressed, and the sheet's existing `.c-legend--interactive` rules
      // (hover, dim when pressed=false) apply.
      const selectable = this.hasAttribute("selectable");
      // Slotted content support: authored .c-legend__item children take
      // precedence over the JSON `items` attribute.
      const authoredLegendItems = Array.from(this.querySelectorAll(":scope > .c-legend__item"));
      let items = remoteData(this, "items");
      if (authoredLegendItems.length) {
        items = JSON.stringify(authoredLegendItems.map((el) => {
          const sw = el.querySelector(".c-legend__swatch");
          const lbl = el.querySelector(".c-legend__label") || el;
          return { label: lbl ? lbl.textContent.trim() : el.textContent.trim(), color: sw ? sw.style.background || undefined : undefined };
        }));
        authoredLegendItems.forEach((el) => el.remove());
      }
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
          list.setAttribute("role", selectable ? "group" : "listbox");
          if (title) list.setAttribute("aria-label", title);
          list.innerHTML = "";
          parsed.forEach((it) => {
            const label = typeof it === "string" ? it : (it.label || String(it));
            const key = typeof it === "string" ? it : (it.key || it.label || String(it));
            const item = document.createElement(selectable ? "button" : "div");
            item.className = "c-legend__item";
            item.setAttribute("tabindex", "-1");
            if (selectable) {
              item.type = "button";
              item.setAttribute("role", "button");
              item.setAttribute("aria-pressed", "true");
              item.dataset.key = key;
            } else {
              item.setAttribute("role", "option");
              item.setAttribute("aria-selected", "false");
            }
            const sw = document.createElement("span");
            sw.className = "c-legend__swatch";
            if (it && it.color) sw.style.background = it.color;
            item.appendChild(sw);
            // geometry glyph
             const glyphShape = (it && (it.shape || it.marker || it.glyph)) || this.getAttribute("glyphs");
             if (glyphShape) {
               const g = document.createElement("span");
               g.className = "c-legend__glyph";
               g.setAttribute("part", "glyph");
               g.textContent = glyphShape === "circle" ? "●" : glyphShape === "square" ? "■" : glyphShape === "triangle" ? "▲" : glyphShape === "diamond" ? "◆" : glyphShape === "star" ? "★" : String(glyphShape);
               if (it && it.size != null) g.style.fontSize = (typeof it.size === "number" ? it.size + "px" : String(it.size));
               item.appendChild(g);
             }
            // threshold break marker
            if (it && it.break != null) {
              const b = document.createElement("span");
              b.className = "c-legend__break";
              b.textContent = String(it.break);
              item.appendChild(b);
            }
             const lbl = document.createElement("span");
             lbl.textContent = label;
             item.appendChild(lbl);
             // caption (source-and-method line)
             const caption = (typeof it === "object" && it) ? (it.caption || it.note || "") : "";
             if (caption) {
               const cap = document.createElement("span");
               cap.className = "c-legend__caption";
               cap.textContent = caption;
               item.appendChild(cap);
             }
             // threshold mark: outline on swatches that begin at a threshold
             if (it && (it.threshold || it.break != null)) {
               sw.style.outline = "2px solid var(--color-border-strong)";
             }
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
       // caption as option description (aria-describedby), not part of name
       const caption = this.getAttribute("caption");
       let captionEl = this.querySelector(".c-legend__caption");
       if (caption) {
         if (!captionEl) { captionEl = document.createElement("span"); captionEl.className = "c-legend__caption"; this.appendChild(captionEl); }
         captionEl.id = captionEl.id || ("legend-caption-" + Math.random().toString(36).slice(2));
         captionEl.textContent = caption;
         captionEl.style.position = "absolute"; captionEl.style.width = "1px"; captionEl.style.height = "1px"; captionEl.style.overflow = "hidden"; captionEl.style.clip = "rect(0,0,0,0)";
       } else if (captionEl) {
         captionEl.remove();
       }
       // single tab stop: first option
       const _items = this.querySelector(".c-legend__items");
       if (_items) {
         const opts = Array.from(_items.querySelectorAll(".c-legend__item"));
         opts.forEach((o, i) => o.setAttribute("tabindex", i === 0 ? "0" : "-1"));
         if (captionEl) opts.forEach((o) => o.setAttribute("aria-describedby", captionEl.id));
       }
       // no-data entry from palette / no-data-color
       const ndColor = this.getAttribute("no-data-color");
       if (ndColor) {
         let nd = this.querySelector(".c-legend__no-data");
         if (!nd) { nd = document.createElement("div"); nd.className = "c-legend__no-data"; this.appendChild(nd); }
         nd.setAttribute("part", "no-data");
         nd.textContent = "No data";
         const glyph = document.createElement("span");
         glyph.className = "glyph";
         glyph.style.background = ndColor;
         nd.prepend(glyph);
       } else {
         const nd = this.querySelector(".c-legend__no-data");
         if (nd) nd.remove();
       }
       // audit notice
       const audit = this.getAttribute("audit");
       if (audit) {
         const a = this.ensure(".c-legend__audit", () => { const el = document.createElement("div"); el.className = "c-legend__audit"; return el; });
         a.textContent = audit;
       } else {
         const a = this.querySelector(".c-legend__audit");
         if (a) a.remove();
       }
       // continuous variant: ramp with two ends labelled
       if (this.hasAttribute("continuous")) {
         const ends = this.getAttribute("ends");
         let parsedEnds = null;
         if (ends) { try { parsedEnds = JSON.parse(ends); } catch (e) { parsedEnds = ends.split(","); } }
         if (Array.isArray(parsedEnds) && parsedEnds.length >= 2) {
           const r = this.ensure(".c-legend__ramp", () => { const el = document.createElement("div"); el.className = "c-legend__ramp"; return el; });
           // labels
           let left = this.querySelector(".c-legend__ramp-label--start");
           if (!left) { left = document.createElement("span"); left.className = "c-legend__ramp-label c-legend__ramp-label--start"; r.appendChild(left); }
           left.textContent = parsedEnds[0];
           let right = this.querySelector(".c-legend__ramp-label--end");
           if (!right) { right = document.createElement("span"); right.className = "c-legend__ramp-label c-legend__ramp-label--end"; r.appendChild(right); }
           right.textContent = parsedEnds[parsedEnds.length - 1];
         }
       }
       // size variant: differently-sized glyphs
       const sizeAttr = this.getAttribute("size");
       if (sizeAttr) {
         const sc = this.ensure(".c-legend__size", () => { const el = document.createElement("div"); el.className = "c-legend__size"; return el; });
         sc.textContent = sizeAttr;
       } else {
         const sc = this.querySelector(".c-legend__size");
         if (sc) sc.remove();
       }
       // classification line
       const classification = this.getAttribute("classification");
       if (classification) {
         const c = this.ensure(".c-legend__classification", () => { const el = document.createElement("div"); el.className = "c-legend__classification"; return el; });
         c.textContent = classification;
       } else {
         const c = this.querySelector(".c-legend__classification");
         if (c) c.remove();
       }
       // data table (collapsible)
       const tableAttr = this.getAttribute("table");
       if (tableAttr) {
         let parsed = null;
         try { parsed = JSON.parse(tableAttr); } catch (e) { parsed = null; }
         if (Array.isArray(parsed)) {
           let det = this.querySelector(".c-legend__table-wrap");
           if (!det) { det = document.createElement("details"); det.className = "c-legend__table-wrap"; this.appendChild(det); }
           det.innerHTML = "";
           const sum = document.createElement("summary"); sum.textContent = "Data table"; det.appendChild(sum);
           const tbl = document.createElement("table"); tbl.className = "c-legend__table";
           const tbody = document.createElement("tbody");
           parsed.forEach((row) => {
             const tr = document.createElement("tr");
             const cells = Array.isArray(row) ? row : [row.label ?? row.key ?? "", row.value ?? ""];
             cells.forEach((cell) => { const td = document.createElement("td"); td.textContent = cell; tr.appendChild(td); });
             tbody.appendChild(tr);
           });
           tbl.appendChild(tbody);
           det.appendChild(tbl);
         }
       } else {
         const det = this.querySelector(".c-legend__table-wrap");
         if (det) det.remove();
       }
       // size variant on glyphs
       if (items) {
         // apply size to glyphs already rendered? handled below via re-render not needed
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
         // ramp routing: equal-width segments with break labels
         const breaksAttr = this.getAttribute("breaks");
         if (breaksAttr) {
           let breaks = null;
           try { breaks = JSON.parse(breaksAttr); } catch (e) { breaks = breaksAttr.split(",").map((s) => s.trim()); }
           if (Array.isArray(breaks)) {
             // remove old segments
             Array.from(r.querySelectorAll(".c-legend__ramp-segment")).forEach((n) => n.remove());
             breaks.forEach((b, i) => {
               const seg = document.createElement("span");
               seg.className = "c-legend__ramp-segment";
               seg.style.flex = "1";
               const lbl = document.createElement("span");
               lbl.className = "c-legend__ramp-break";
               lbl.textContent = String(b);
               seg.appendChild(lbl);
               r.appendChild(seg);
             });
           }
         }
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
        this.dispatchEvent(new CustomEvent("contour:select", {
          detail: { label: btn.textContent.trim(), key: btn.dataset.key || btn.textContent.trim(), value: btn.dataset.key || btn.textContent.trim() },
          bubbles: true,
          composed: true,
        }));
      });
      // emit style-resolved once on enhance
      try {
        let parsed = null;
        try { parsed = JSON.parse(this.getAttribute("items") || "null"); } catch (e) { parsed = this.getAttribute("items"); }
        this.dispatchEvent(new CustomEvent("contour:style-resolved", { detail: { value: this.getAttribute("items"), items: parsed }, bubbles: true, composed: true }));
      } catch (e) {}
      // break-change delegated
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && t.classList && t.classList.contains("c-legend__break-input")) {
          this.dispatchEvent(new CustomEvent("contour:break-change", { detail: { value: t.value }, bubbles: true, composed: true }));
        }
      });
      // keyboard nav (listbox)
      this.addEventListener("keydown", (e) => {
        const items = Array.from(this.querySelectorAll(".c-legend__item"));
        if (!items.length) return;
        const idx = items.indexOf(document.activeElement);
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          const next = items[(idx + 1) % items.length];
          if (next) { next.focus(); items.forEach((o,i)=>o.setAttribute("tabindex", o===next?"0":"-1")); }
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          const prev = items[(idx - 1 + items.length) % items.length];
          if (prev) { prev.focus(); items.forEach((o)=>o.setAttribute("tabindex", o===prev?"0":"-1")); }
        } else if (e.key === "Home") {
          if (items.length > 4) { e.preventDefault(); items[0].focus(); items.forEach((o,i)=>o.setAttribute("tabindex", i===0?"0":"-1")); }
        } else if (e.key === "End") {
          if (items.length > 4) { e.preventDefault(); const last = items[items.length-1]; last.focus(); items.forEach((o)=>o.setAttribute("tabindex", o===last?"0":"-1")); }
        } else if (e.key === "Escape") {
          // clear selection
          items.forEach((o) => { if (o.getAttribute("role") === "option") o.setAttribute("aria-selected", "false"); else o.setAttribute("aria-pressed", "false"); });
          this.dispatchEvent(new CustomEvent("contour:clear", { bubbles: true, composed: true }));
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          // type-ahead
          if (items.length > 7) {
            const start = idx >= 0 ? idx + 1 : 0;
            for (let i = 0; i < items.length; i++) {
              const ii = (start + i) % items.length;
              const txt = (items[ii].textContent || "").trim().toLowerCase();
              if (txt.startsWith(e.key.toLowerCase())) {
                e.preventDefault();
                items[ii].focus();
                items.forEach((o,j)=>o.setAttribute("tabindex", j===ii?"0":"-1"));
                break;
              }
            }
          }
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (document.activeElement && document.activeElement.classList.contains("c-legend__item")) {
            document.activeElement.click();
          }
        }
      });
    }
  }
define("contour-legend", ContourLegend);
/**
 * Measure: web component wrapper.
 * Attributes: `label`, `value`, `point`, `line`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourMeasure extends ContourBase {
    static get observed() { return ["label", "value", "point", "line", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" }, point: { attribute: "point" }, line: { attribute: "line" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-measure");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Measure");
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
      // unit selector
      let sel = this.querySelector(".c-measure__unit-select");
      if (!sel) { sel = document.createElement("select"); sel.className = "c-measure__unit-select"; this.appendChild(sel); }
      ["m","km","mi","ft"].forEach((u) => {
        if (!sel.querySelector('option[value="' + u + '"]')) { const o = document.createElement("option"); o.value = u; o.textContent = u; sel.appendChild(o); }
      });
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
    enhance() {
      if (this._wiredMeasure) return;
      this._wiredMeasure = true;
      this.addEventListener("change", (e) => {
        const sel = e.target && e.target.closest ? e.target.closest(".c-measure__unit-select") : null;
        if (sel && this.contains(sel)) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { unit: sel.value } }));
        }
      });
    }
  }
define("contour-measure", ContourMeasure);
/**
 * Timeline: web component wrapper.
 * Attributes: `items`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourTimeline extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-timeline");
      this.setAttribute("role", "list");
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
            item.setAttribute("role", "listitem");
            item.setAttribute("tabindex", "-1");
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
       const items = Array.from(this.querySelectorAll(".c-timeline__item"));
       items.forEach((it, i) => it.setAttribute("tabindex", i === 0 ? "0" : "-1"));
       this.addEventListener("click", (e) => {
         const item = e.target && e.target.closest ? e.target.closest(".c-timeline__item") : null;
         if (!item || !this.contains(item)) return;
         const items = Array.from(this.querySelectorAll(".c-timeline__item"));
         const idx = items.indexOf(item);
         this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: idx } }));
       });
       this.addEventListener("keydown", (e) => {
         const items = Array.from(this.querySelectorAll(".c-timeline__item"));
         if (!items.length) return;
         const active = this.querySelector(".c-timeline__item:focus") || items[0];
         const idx = items.indexOf(active);
         let next = -1;
         if (e.key === "ArrowDown") next = Math.min(idx + 1, items.length - 1);
         else if (e.key === "ArrowUp") next = Math.max(idx - 1, 0);
         else if (e.key === "Home") next = 0;
         else if (e.key === "End") next = items.length - 1;
         else if (e.key === "Enter" || e.key === " ") {
           e.preventDefault();
           this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: idx } }));
           return;
         }
         if (next < 0 || next === idx) return;
         e.preventDefault();
         items.forEach((it, i) => it.setAttribute("tabindex", i === next ? "0" : "-1"));
         try { items[next].focus(); } catch (err) {}
       });
     }
  }
define("contour-timeline", ContourTimeline);
/**
 * Heatmap: web component wrapper.
 * Attributes: `cells`, `count`, `legend`, `empty`, `loading`, `values`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourHeatmap extends ContourBase {
    static get observed() { return ["cells", "count", "legend", "empty", "loading", "values", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { cells: { attribute: "cells" }, count: { attribute: "count" }, legend: { attribute: "legend" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-heatmap");
      if (!this.hasAttribute("role")) this.setAttribute("role", "grid");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Heatmap");
      wireStates(this);
      loadRemote(this, "cells");
      if (renderStates(this, "heatmap")) return;
      // Slotted content support: authored .c-heatmap__cell children take
      // precedence over the generated grid.
      const authoredCells = Array.from(this.querySelectorAll(":scope > .c-heatmap__cell"));
      if (authoredCells.length) {
        const cols = Math.ceil(Math.sqrt(authoredCells.length));
        this.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
        this.style.inlineSize = "16rem";
      } else {
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
       } else if (!authoredCells.length) {
         renderEmpty(this, "heatmap");
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
       this.addEventListener("keydown", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-heatmap__cell") : null;
        if (!cell || !this.contains(cell)) return;
        const list = cells();
        const idx = list.indexOf(cell);
        let next = -1;
        const rtl = (this.getAttribute("dir") || document.documentElement.getAttribute("dir") || "").toLowerCase() === "rtl";
        if (e.key === "ArrowRight") next = rtl ? Math.max(idx - 1, 0) : Math.min(idx + 1, list.length - 1);
        else if (e.key === "ArrowLeft") next = rtl ? Math.min(idx + 1, list.length - 1) : Math.max(idx - 1, 0);
        else if (e.key === "ArrowDown") next = Math.min(idx + Math.ceil(Math.sqrt(list.length)), list.length - 1);
        else if (e.key === "ArrowUp") next = Math.max(idx - Math.ceil(Math.sqrt(list.length)), 0);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = list.length - 1;
        else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series: 1, index: idx } }));
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
        if (idx >= 0) this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series: 1, index: idx } }));
      });
    }
  }
define("contour-heatmap", ContourHeatmap);
/**
 * Compare: web component wrapper.
 * Attributes: `no`, `text`, `yes`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourCompare extends ContourBase {
    static get observed() { return ["no", "text", "yes", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { no: { attribute: "no" }, text: { attribute: "text" }, yes: { attribute: "yes" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-compare");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Comparison");
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
/**
 * Sparkline: web component wrapper.
 * Attributes: `points`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourSparkline extends ContourBase {
    static get observed() { return ["points", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { points: { attribute: "points" }, src: { attribute: "src" } }; }
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
       this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series: 1 } }));
        }
      });
    }
  }
define("contour-sparkline", ContourSparkline);
/**
 * Chart Grid: web component wrapper.
 * Attributes: `title`, `series`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`.
 */
class ContourChartGrid extends ContourBase {
    static get updateMode() { return "keyed"; }
    static get observed() { return ["title", "series", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { title: { attribute: "title" }, series: { attribute: "series" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-chart-grid");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Chart grid");
      wireStates(this);
      loadRemote(this, "series");
      if (renderStates(this, "chart-grid")) return;
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-chart-grid__title", () => { const el = document.createElement("div"); el.className = "c-chart-grid__title"; return el; });
        t.textContent = title;
      }
      const series = remoteData(this, "series");
      if (!series && !title) renderEmpty(this, "chart-grid");
    }
  }
  define("contour-chart-grid", ContourChartGrid);
/**
 * Contour Plot: web component wrapper.
 * Attributes: `axis`, `label`.
 */
class ContourContourPlot extends ContourBase {
    static get observed() { return ["axis", "label"]; }
    static get properties() { return { axis: { attribute: "axis" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-contour-plot");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Contour plot");
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
/**
 * Error Boundary: web component wrapper.
 * Attributes: `fallback`, `error`.
 */
class ContourErrorBoundary extends ContourBase {
    static get observed() { return ["fallback", "error"]; }
    static get properties() { return { fallback: { attribute: "fallback" }, error: { attribute: "error" } }; }
    render() {
      this.classList.add("c-error-boundary");
      this.setAttribute("role", "region");
      this.setAttribute("aria-live", "polite");
      const err = this.getAttribute("error");
      if (err) {
        this.dataset.state = "error";
        // Hide authored children, show fallback.
        Array.from(this.children).forEach((c) => { if (!c.hasAttribute("data-fallback")) c.style.display = "none"; });
        let fb = this.querySelector("[data-fallback]");
        if (!fb) {
          fb = document.createElement("div");
          fb.className = "c-error-boundary__fallback";
          fb.dataset.fallback = "";
          fb.textContent = this.getAttribute("fallback") || "Something went wrong.";
          this.appendChild(fb);
        } else {
          fb.textContent = this.getAttribute("fallback") || fb.textContent || "Something went wrong.";
        }
      } else {
        this.dataset.state = "ready";
        Array.from(this.children).forEach((c) => { c.style.display = ""; });
        const fb = this.querySelector("[data-fallback]");
        if (fb) fb.remove();
      }
    }
    enhance() {
      if (this._wiredErrorBoundary) return;
      this._wiredErrorBoundary = true;
      // Catch errors thrown by descendants during render/event handling.
      this.addEventListener("error", (e) => {
        e.stopPropagation();
        const msg = (e && e.error && e.error.message) ? e.error.message : (e && e.message) ? e.message : "Unknown error";
        this.setAttribute("error", msg);
      }, true);
    }
  }
  define("contour-error-boundary", ContourErrorBoundary);
