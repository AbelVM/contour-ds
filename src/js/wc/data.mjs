import { ContourBase, define, onDispose, formatValue, contourId, navKey, isRtl, cssLength , warnBadJson } from './core.mjs';
import { loadRemote, remoteData, renderStates, renderEmpty, wireStates, remoteInvalidate, watchViewport } from './states.mjs';
import { donutSlices, barRects, smoothPath, polylinePoints, contourPaths } from './svg.mjs';
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
        } catch (e) { warnBadJson(this, "attribute", e); }
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
      wireStates(this);
      loadRemote(this, "rows");
      if (renderStates(this, "table")) return;
      // The host is not a <table>, so it carries no table rule. The scroller the
      // reflow contract requires is a real block element inside it.
      const columns = this.getAttribute("columns");
      const rows = remoteData(this, "rows");
      // Slot composition: an authored table wins over the JSON attributes.
      const authored = Array.from(this.children).filter((n) => !n.classList || !n.classList.contains("c-table-wrap"));
      if (columns && rows && !authored.length) {
        try {
          const cols = JSON.parse(columns);
          const data = JSON.parse(rows);
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
          // Keep the row objects in memory instead of serializing each one into
          // a data-row attribute: the JSON duplicated the data the component
          // already holds and bloated every row.
          this._rowData = pageData;

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
                    // A placeholder is not a label: a reader who tabs into the
                    // filter hears "edit text" with no column name. Name it.
                    inp.setAttribute("aria-label", "Filter " + colLabel);
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
          const rowHeight = this._measuredRowHeight || cssLength("--data-grid-row-height", 36);
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
              // One tab stop per grid, not one per row: every row is -1 and the
              // arrow keys move a roving tabindex. A 1,000-row table was 1,000
              // tab stops before this.
              tr.setAttribute("tabindex", "-1");
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
          // Keep exactly one row in the tab order: the first rendered row when
          // none is active yet, so the grid is a single tab stop.
          if (!tbody.querySelector('tr[tabindex="0"]')) {
            const first = tbody.querySelector("tr[data-row-index]");
            if (first) first.setAttribute("tabindex", "0");
          }
          // Measure a real row so the virtual window uses the rendered height,
          // not a guess: the old fixed 36px disagreed with the measured 64.1px,
          // so the spacers and the scroll math were both wrong.
          if (!this._measuredRowHeight && !this._measuringRow) {
            const firstRow = tbody.querySelector("tr[data-row-index]");
            const h = firstRow ? firstRow.getBoundingClientRect().height : 0;
            if (h > 0) {
              this._measuredRowHeight = h;
              if (Math.abs(h - rowHeight) > 1) {
                this._measuringRow = true;
                requestAnimationFrame(() => { this._measuringRow = false; this.render(); });
              }
            }
          }
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
        } catch (e) { warnBadJson(this, "attribute", e); }
      } else if (!rows && !authored.length) {
        renderEmpty(this, "table");
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
        this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "table", filter: { sort: idx, sortDir: this._sortDir === 1 ? "ascending" : "descending" } } }));
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
            this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "table", filter: { page } } }));
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
        this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "table", filter: { column: idx, value: inp.value } } }));
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
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "table", filter: { selectedRows: Array.from(this._selectedRows) } } }));
          return;
        }
        const all = e.target && e.target.closest ? e.target.closest(".c-table__select-all") : null;
        if (all && this.contains(all)) {
          const cbs = Array.from(this.querySelectorAll(".c-table__row-select"));
          cbs.forEach((c) => { c.checked = all.checked; });
          this._selectedRows = new Set(all.checked ? cbs.map((c) => Number(c.dataset.rowIndex)) : []);
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { rows: Array.from(this._selectedRows) } }));
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "table", filter: { selectedRows: Array.from(this._selectedRows) } } }));
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
      // Map-linked table (R16-17): click-to-zoom on a row emits contour:zoom so
      // a map consumer can zoom to the corresponding feature. Contour stays
      // engine-agnostic: it only announces the row index and data.
      this.addEventListener("click", (e) => {
        const tr = e.target && e.target.closest ? e.target.closest("tbody tr") : null;
        if (!tr || !this.contains(tr)) return;
        const idx = Number(tr.dataset.rowIndex);
        if (!Number.isFinite(idx)) return;
        const rowData = (this._rowData && this._rowData[idx]) || null;
        this.dispatchEvent(new CustomEvent("contour:zoom", { bubbles: true, composed: true, detail: { row: idx, index: idx, data: rowData } }));
      });
      this.addEventListener("keydown", (e) => {
        const tr = e.target && e.target.closest ? e.target.closest("tbody tr") : null;
        if (!tr || !this.contains(tr)) return;
        const idx = Number(tr.dataset.rowIndex);
        if (!Number.isFinite(idx)) return;
        // Roving tabindex: arrows move the single tab stop, Home/End jump.
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
          const rows = Array.from(this.querySelectorAll("tbody tr[data-row-index]"));
          const at = rows.indexOf(tr);
          let next = at;
          if (e.key === "ArrowDown") next = Math.min(rows.length - 1, at + 1);
          else if (e.key === "ArrowUp") next = Math.max(0, at - 1);
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = rows.length - 1;
          if (next !== at && rows[next]) {
            e.preventDefault();
            rows.forEach((r) => r.setAttribute("tabindex", "-1"));
            rows[next].setAttribute("tabindex", "0");
            try { rows[next].focus(); } catch (err) {}
          }
          return;
        }
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true, detail: { row: idx } }));
      });
      // Cross-filter contract (R16-16): clear-all resets table sort/page/filter state.
      this.addEventListener("contour:clear-all", () => {
        let changed = false;
        if (this.hasAttribute("sort")) { this.removeAttribute("sort"); changed = true; }
        if (this.hasAttribute("sort-dir")) { this.removeAttribute("sort-dir"); changed = true; }
        if (this.hasAttribute("page")) { this.removeAttribute("page"); changed = true; }
        if (this._filters && Object.keys(this._filters).length) { this._filters = {}; changed = true; }
        if (changed) {
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "table", filter: { sort: null, sortDir: null, page: null, filters: null } } }));
          this.requestRender();
        }
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
 * Coerce a histogram bin into the published shape.
 *
 * A bin may arrive from the author (`series[].bins`) or be pushed by a binder
 * (`chart.bins = …`). Both go through here so `bins` reads back the same way
 * whichever door it came through, and a malformed entry is dropped rather than
 * rendered as NaN geometry.
 */
const normalizeChartBin = (bin) => {
  if (!bin || typeof bin !== "object") return null;
  const x0 = Number(bin.x0);
  const x1 = Number(bin.x1);
  const count = Number(bin.count);
  if (!Number.isFinite(x0) || !Number.isFinite(x1) || !Number.isFinite(count)) return null;
  const out = { x0, x1, count };
  const normalized = Number(bin.normalized);
  if (Number.isFinite(normalized)) out.normalized = normalized;
  return out;
};

/**
 * Chart: web component wrapper.
 * Attributes: `series`, `axis`, `empty`, `loading`, `error`, `retry`, `skeleton`, `zoomable`, `data-table`, `brush`, `brush-min`, `brush-max`, `brush-start`, `brush-end`.
 */
class ContourChart extends ContourBase {
    static get updateMode() { return "keyed"; }
  static get observed() { return ["series", "axis", "color", "empty", "loading", "error", "retry", "skeleton", "zoomable", "data-table", "brush", "brush-min", "brush-max", "brush-start", "brush-end", "note", "bucket-count", "limit-values"]; }
  static get properties() { return { series: { attribute: "series" }, axis: { attribute: "axis" }, color: { attribute: "color" }, zoomable: { attribute: "zoomable", type: Boolean }, brush: { attribute: "brush", type: Boolean }, note: { attribute: "note" }, "bucket-count": { attribute: "bucket-count" }, "limit-values": { attribute: "limit-values" } }; }
  // Bindable histogram contract (R18-68). A histogram consumer drives a widget
  // by assigning `bins` / `backgroundData` and reading `range`; libreship's
  // `bindHistogram` is the one this was written against, and it writes those
  // three as JS properties, not attributes. These accessors are the widget's
  // side of that contract: a push re-renders, and a read returns the bins
  // actually drawn rather than the last thing someone assigned.
  get bins() {
    const pushed = this._pushedBins;
    return (pushed && pushed.length ? pushed : this._renderedBins || []).map((b) => ({ ...b }));
  }
  set bins(value) {
    this._pushedBins = Array.isArray(value) ? value.map(normalizeChartBin).filter(Boolean) : [];
    this.requestRender();
  }
  get backgroundData() {
    const pushed = this._pushedBackground;
    return (pushed && pushed.length ? pushed : this._renderedBackground || []).map((b) => ({ ...b }));
  }
  set backgroundData(value) {
    this._pushedBackground = Array.isArray(value) ? value.map(normalizeChartBin).filter(Boolean) : [];
    this.requestRender();
  }
  // `range` is a JS property, not an attribute write: the chart observes
  // brush/brush-start/brush-end, so a setter that called `setAttribute` on
  // itself would fire the callback that renders it (wc-contract's re-entrancy
  // rule). The override is consumed by render() and never reflected back into
  // attributes, which stay the author's.
  _showsBrush() {
    return this.hasAttribute("brush") || this._rangeOverride !== undefined;
  }
  get range() {
    const override = this._rangeOverride;
    if (override !== undefined) return override ? override.slice() : null;
    if (!this.hasAttribute("brush")) return null;
    const start = parseFloat(this.getAttribute("brush-start"));
    const end = parseFloat(this.getAttribute("brush-end"));
    return Number.isFinite(start) && Number.isFinite(end) ? [start, end] : null;
  }
  set range(value) {
    if (value == null) {
      this._rangeOverride = null;
      this.requestRender();
      return;
    }
    const pair = Array.isArray(value) ? value : [value, value];
    const start = Number(pair[0]);
    const end = Number(pair[1]);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return;
    this._rangeOverride = [start, end];
    this.requestRender();
  }
    _axisLabel() {
      const raw = this.getAttribute("axis");
      if (!raw) return "";
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed.label || parsed.title || parsed.name || "";
        return String(parsed);
      } catch (e) { return raw; }
    }
    _axisConfig() {
      const raw = this.getAttribute("axis");
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        return (parsed && typeof parsed === "object") ? parsed : null;
      } catch (e) { return null; }
    }
    _valueDomain() {
      const series = this.getAttribute("series");
      if (!series) return null;
      try {
        const parsed = JSON.parse(series);
        let min = Infinity, max = -Infinity;
        (Array.isArray(parsed) ? parsed : []).forEach((s) => {
          if (s && Array.isArray(s.values)) s.values.forEach((v) => {
            const n = Number(v);
            if (Number.isFinite(n)) { if (n < min) min = n; if (n > max) max = n; }
          });
        });
        return Number.isFinite(min) && Number.isFinite(max) ? [min, max] : null;
      } catch (e) { return null; }
    }
    _renderValueAxis() {
      const ax = this.querySelector(".c-chart__axis");
      if (!ax) return;
      const cfg = this._axisConfig();
      const y = cfg && cfg.y;
      const domain = (y && y.domain) || this._valueDomain();
      if (!domain) { ax.textContent = this._axisLabel(); return; }
      const chart = (typeof window !== "undefined" && window.Contour && window.Contour.chart) || null;
      const ticks = (y && y.ticks) || (chart && chart.ticks ? chart.ticks(domain[0], domain[1], 5) : [domain[0], domain[1]]);
      const format = (y && y.format) || ((v) => String(v));
      ax.textContent = "";
      ticks.forEach((t) => {
        const span = document.createElement("span");
        span.className = "c-chart__tick";
        span.textContent = typeof format === "function" ? format(t) : String(t);
        ax.appendChild(span);
      });
      this.style.setProperty("--chart-ticks", String(ticks.length));
    }
    _renderLegend() {
      const series = this.getAttribute("series");
      if (!series) return;
      try {
        const parsed = JSON.parse(series);
        const labelled = (Array.isArray(parsed) ? parsed : []).filter((s) => s && s.label);
        let legend = this.querySelector(".c-chart__legend");
        if (!labelled.length) { if (legend) legend.remove(); return; }
        if (!legend) { legend = document.createElement("div"); legend.className = "c-chart__legend"; this.appendChild(legend); }
        legend.textContent = "";
        labelled.forEach((s, i) => {
          const item = document.createElement("span");
          item.className = "c-chart__legend-item";
          const swatch = document.createElement("span");
          swatch.className = "c-chart__legend-swatch";
          swatch.style.setProperty("--c", this.getAttribute("color") || `var(--chart-${i + 1})`);
          item.appendChild(swatch);
          item.appendChild(document.createTextNode(s.label));
          legend.appendChild(item);
        });
      } catch (e) { /* ignore */ }
    }
    render() {
      this.classList.add("c-chart");
      // A chart with brush handles has focusable descendants, which role="img"
      // forbids (an img is a leaf). A named group exposes the marks and keeps
      // the controls reachable; the data table remains the alternative.
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-roledescription")) this.setAttribute("aria-roledescription", "chart");
      if (this.getAttribute("axis") && !this.hasAttribute("aria-label")) this.setAttribute("aria-label", this._axisLabel());
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
          ax.textContent = this._axisLabel();
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
          btn.classList.add("u-mbs-sm");
          err.appendChild(btn);
        }
        plot.appendChild(err);
        const axis = this.getAttribute("axis");
        if (axis) {
          const ax = this.ensure(".c-chart__axis", () => { const el = document.createElement("div"); el.className = "c-chart__axis"; return el; });
          ax.textContent = this._axisLabel();
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
          sk.classList.add("u-mbe-2xs");
          plot.appendChild(sk);
        }
        const axis = this.getAttribute("axis");
        if (axis) {
          const ax = this.ensure(".c-chart__axis", () => { const el = document.createElement("div"); el.className = "c-chart__axis"; return el; });
          ax.textContent = this._axisLabel();
        }
        return;
      }
      const axis = this.getAttribute("axis");
      if (axis) {
        const ax = this.ensure(".c-chart__axis", () => { const el = document.createElement("div"); el.className = "c-chart__axis"; return el; });
        ax.textContent = this._axisLabel();
      } else {
        const ax = this.querySelector(".c-chart__axis");
        if (ax) ax.remove();
      }
      // Value axis: when `axis` is {y:{domain,ticks,format}} (or the series
      // carries values), print the ticks and publish --chart-ticks.
      this._renderValueAxis();
      // Legend from series[].label, so a chart with named series is readable
      // without the consumer hand-building a legend.
      this._renderLegend();
// A bindable histogram may be driven by `bins` alone: a binder pushes the
// engine's distribution rather than serialising a `series` attribute, so with
// no series declared the pushed bins become the series this render reads.
let series = this.getAttribute("series");
if (!series && this._pushedBins && this._pushedBins.length) {
  series = JSON.stringify([{ type: "histogram", bins: this._pushedBins }]);
}
       if (series) {
         let parsed = null;
         try {
           parsed = JSON.parse(series);
           const plot = this.ensure(".c-chart__plot", () => { const el = document.createElement("div"); el.className = "c-chart__plot"; return el; });
           plot.innerHTML = "";
           // Structured series: an item may carry `values` plus a `type`
           // ("donut" | "histogram" | "line") instead of a pre-computed `d`
           // path, or carry pre-binned `bins` instead of raw `values`. The
           // helpers in svg.mjs turn those into geometry so a consumer does
           // not have to hand-compute arc or bar math.
           const hasStructured = parsed.some((s) => s && (Array.isArray(s.values) || Array.isArray(s.bins)));
           if (hasStructured) {
             // Each structured render rebuilds the published bins from the
             // series it draws; without this a chart switched from a histogram
             // to a line keeps reporting the old distribution.
             this._renderedBins = [];
             this._renderedBackground = [];
              parsed.forEach((s, i) => {
                const layerColor = this.getAttribute("color");
                const color = layerColor || `var(--chart-${i + 1})`;
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
                } else if (s.type === "bar") {
                  // A bar series is the histogram's geometry without the
                  // bucketing: one rect per value, in value order. The
                  // histogram branch bins its input into equal-width buckets
                  // and plots the counts, which is a different question, so
                  // `bar` cannot be folded into it. `barRects()` already
                  // normalises the values against the plot box, so the only
                  // difference here is that `plotVals` is the series itself.
                  const vals = Array.isArray(s.values) ? s.values : [];
                  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                  svg.setAttribute("viewBox", "0 0 300 120");
                  svg.setAttribute("preserveAspectRatio", "none");
                  svg.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%";
                  barRects(vals).forEach((r, ri) => {
                    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    rect.setAttribute("class", "c-chart__bar");
                    rect.setAttribute("data-series", String(i + 1));
                    rect.style.setProperty("--c", color);
                    rect.setAttribute("x", r.x);
                    rect.setAttribute("y", r.y);
                    rect.setAttribute("width", r.width);
                    rect.setAttribute("height", r.height);
                    rect.setAttribute("title", String(vals[ri]));
                    rect.setAttribute("aria-label", "Series " + (i + 1) + ": " + String(vals[ri]));
                    rect.setAttribute("tabindex", "0");
                    rect.setAttribute("role", "button");
                    rect.dataset.index = String(ri);
                    svg.appendChild(rect);
                  });
                  plot.appendChild(svg);
                } else if (s.type === "histogram") {
                  // R16-23: bucket-count / limit-values controls.
                  // `limit-values` truncates the input array; `bucket-count`
                  // bins values into equal-width buckets and renders the
                  // per-bucket counts as bars. R18-68 adds the other door: a
                  // series may arrive pre-binned (`bins`) or be pushed whole by
                  // a binder, and either way the boundaries are published as
                  // `chart.bins` so a consumer can read them back.
                  let vals = Array.isArray(s.values) ? s.values.slice() : [];
                  const limitValues = parseInt(this.getAttribute("limit-values") || "0", 10);
                  if (limitValues > 0) vals = vals.slice(0, limitValues);
                  const bucketCount = parseInt(this.getAttribute("bucket-count") || "0", 10);
                  const pushedBins = this._pushedBins && this._pushedBins.length ? this._pushedBins : null;
                  const declaredBins = Array.isArray(s.bins) ? s.bins.map(normalizeChartBin).filter(Boolean) : null;
                  let bins = pushedBins || (declaredBins && declaredBins.length ? declaredBins : null);
                  let plotVals = vals;
                  if (!bins && bucketCount > 0 && vals.length) {
                    const nums = vals.map((v) => Number(v) || 0);
                    const min = Math.min.apply(null, nums);
                    const max = Math.max.apply(null, nums);
                    const range = max - min || 1;
                    const width = range / bucketCount;
                    const buckets = new Array(bucketCount).fill(0);
                    nums.forEach((v) => {
                      const bi = Math.min(bucketCount - 1, Math.floor((v - min) / width));
                      buckets[bi] += 1;
                    });
                    plotVals = buckets;
                    bins = buckets.map((count, bi) => ({ x0: min + bi * width, x1: min + (bi + 1) * width, count }));
                  }
                  if (bins) plotVals = bins.map((b) => b.count);
                  // Raw values with no bucket count have no boundaries to
                  // publish: those bars are counts at index positions, not a
                  // distribution over a domain, so `bins` stays empty and the
                  // consumer is told there is nothing to map a range onto.
                  this._renderedBins = bins ? bins.slice() : [];
                  const pushedBackground = this._pushedBackground && this._pushedBackground.length ? this._pushedBackground : null;
                  const declaredBackground = Array.isArray(s.background) ? s.background.map(normalizeChartBin).filter(Boolean) : null;
                  const background = pushedBackground || (declaredBackground && declaredBackground.length ? declaredBackground : []);
                  this._renderedBackground = background.slice();
                  const backgroundVals = background.map((b) => Number(b.count) || 0);
                  let sharedMax = 1;
                  if (backgroundVals.length) {
                    plotVals.concat(backgroundVals).forEach((v) => { const n = Number(v) || 0; if (n > sharedMax) sharedMax = n; });
                  }
                  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                  svg.setAttribute("viewBox", "0 0 300 120");
                  svg.setAttribute("preserveAspectRatio", "none");
                  svg.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%";
                  if (backgroundVals.length) {
                    // Context bars: the unfiltered distribution behind the
                    // selection. Deliberately not focusable and not announced —
                    // they are the backdrop the marks are read against, and a
                    // second set of stops would double the tab sequence.
                    barRects(backgroundVals, { max: sharedMax }).forEach((r) => {
                      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                      rect.setAttribute("class", "c-chart__bar");
                      rect.setAttribute("data-context", "");
                      rect.setAttribute("aria-hidden", "true");
                      rect.style.setProperty("--c", color);
                      rect.setAttribute("x", r.x);
                      rect.setAttribute("y", r.y);
                      rect.setAttribute("width", r.width);
                      rect.setAttribute("height", r.height);
                      svg.appendChild(rect);
                    });
                  }
                  barRects(plotVals, backgroundVals.length ? { max: sharedMax } : undefined).forEach((r, ri) => {
                    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    rect.setAttribute("class", "c-chart__bar");
                    rect.setAttribute("data-series", String(i + 1));
                    rect.style.setProperty("--c", color);
                    rect.setAttribute("x", r.x);
                    rect.setAttribute("y", r.y);
                    rect.setAttribute("width", r.width);
                    rect.setAttribute("height", r.height);
                    const markValue = bins ? bins[ri].count : (Array.isArray(s.values) ? s.values[ri] : ri);
                    rect.setAttribute("title", String(markValue));
                    rect.setAttribute("aria-label", "Series " + (i + 1) + ": " + String(markValue));
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
          } catch (e) { warnBadJson(this, "attribute", e); }
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
            // A caption names the table: a reader who lands on it hears what it
            // holds before the first cell, not "table, 5 rows, 3 columns".
            const title = this.getAttribute("title") || this.getAttribute("aria-label") || "Chart data";
            const cap = document.createElement("caption");
            cap.textContent = title;
            table.appendChild(cap);
            const thead = document.createElement("thead");
            const hr = document.createElement("tr");
            const h = document.createElement("th");
            h.setAttribute("scope", "col");
            h.textContent = "Series";
            hr.appendChild(h);
            const maxLen = parsed.reduce((m, s) => Math.max(m, Array.isArray(s.values) ? s.values.length : (Array.isArray(s) ? s.length : 0)), 0);
            for (let i = 0; i < maxLen; i++) {
              const th = document.createElement("th");
              th.setAttribute("scope", "col");
              th.textContent = "Value " + (i + 1);
              hr.appendChild(th);
            }
            thead.appendChild(hr);
            table.appendChild(thead);
            const tbody = document.createElement("tbody");
            parsed.forEach((s, si) => {
              const vals = Array.isArray(s.values) ? s.values : (Array.isArray(s) ? s : []);
              const tr = document.createElement("tr");
              const td0 = document.createElement("th");
              td0.setAttribute("scope", "row");
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
            if (this._showsBrush()) {
              const brush = this.ensure("contour-brush", () => document.createElement("contour-brush"));
              // A binned histogram's brush is in data units, so the track
              // defaults to the bins' own extent; a consumer that supplies
              // brush-min/brush-max still wins. Without this a binder's
              // `range` would be positioned against a 0–100 track it never set.
              const drawnBins = this._renderedBins || [];
              const trackMin = this.getAttribute("brush-min") || (drawnBins.length ? String(drawnBins[0].x0) : "0");
              const trackMax = this.getAttribute("brush-max") || (drawnBins.length ? String(drawnBins[drawnBins.length - 1].x1) : "100");
              const override = Array.isArray(this._rangeOverride) ? this._rangeOverride : null;
              // `range = null` means "no constraint": the brush keeps its
              // affordance and shows the full track, rather than vanishing.
              const cleared = this._rangeOverride === null;
              brush.setAttribute("min", trackMin);
              brush.setAttribute("max", trackMax);
              brush.setAttribute("start", override ? String(override[0]) : cleared ? trackMin : (this.getAttribute("brush-start") || trackMin));
              brush.setAttribute("end", override ? String(override[1]) : cleared ? trackMax : (this.getAttribute("brush-end") || trackMax));
              const plotEl = this.querySelector(".c-chart__plot");
              if (brush.previousElementSibling !== plotEl) this.insertBefore(brush, plotEl ? plotEl.nextSibling : null);
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
         // No series: nothing is drawn, so nothing is published either. A
         // consumer reading `bins` must see the empty state, not the last one.
         this._renderedBins = [];
         this._renderedBackground = [];
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
      // Series toggle responding to legend (F-10): hide/show series when a
      // legend item is toggled. The legend may be a sibling of the chart, so
      // listen on the shared parent (which catches both a child and a sibling
      // legend) and match by key, data-key, or the item's index.
      const legendHost = this.parentElement || document;
      const onLegendToggle = (e) => {
        const key = e && e.detail && (e.detail.key != null ? e.detail.key : e.detail.label);
        const index = e && e.detail && e.detail.index;
        const pressed = e && e.detail && e.detail.pressed;
        if (key == null && index == null) return;
        const nodes = this.querySelectorAll("[data-series]");
        nodes.forEach((n) => {
          const s = n.getAttribute("data-series");
          const match = String(s) === String(key)
            || n.getAttribute("data-key") === String(key)
            || (index != null && String(s) === String(index + 1));
          if (match) n.style.display = pressed === false ? "none" : "";
        });
      };
      legendHost.addEventListener("contour:legend-toggle", onLegendToggle);
      onDispose(this, () => legendHost.removeEventListener("contour:legend-toggle", onLegendToggle));
      this.addEventListener("contour:brush-end", (e) => {
        if (!this._showsBrush() || !e.target || !e.target.matches("contour-brush")) return;
        // The brush moves its own attributes, so a chart already driven through the
        // `range` property records the new pair here; an author-driven chart stays
        // attribute-only and reads the brush itself. `undefined` is the switch:
        // once the property has been written, drags keep it current.
        if (this._rangeOverride !== undefined && e.detail && Array.isArray(e.detail.range)) {
          this._rangeOverride = e.detail.range.slice();
        }
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
          if (!point || !plot2.contains(point)) return;
          const series = parseInt(point.getAttribute("data-series") || "1", 10);
          const points = Array.from(plot2.querySelectorAll('.c-chart__point[data-series="' + series + '"]'));
          const idx = points.indexOf(point);
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const index = parseInt(point.dataset.index || "0", 10);
            this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series, index } }));
            return;
          }
          navKey(e, points, {
            wrap: false,
            rtl: isRtl(this),
            onNavigate: (i) => points.forEach((p, j) => p.setAttribute("tabindex", j === i ? "0" : "-1")),
            onKey: () => {}
          });
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
      // Cross-filter contract (R16-16): clear-all resets chart brush state.
      this.addEventListener("contour:clear-all", () => {
        if (this.hasAttribute("brush")) {
          this.removeAttribute("brush");
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "chart", filter: { brush: null } } }));
          this.requestRender();
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
      const brownoutLevel = this.brownoutLevel();
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
      const shedDial = this.shed("dial", 3);
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
        else valueEl.setAttribute("aria-label", valueEl.textContent || "Gauge");
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
    // The selection as a numeric pair in the track's own units. `start`/`end`
    // stay the attribute strings they have always been; `range` is the shape a
    // cross-filter consumer wants, and libreship's histogram binder reads it.
    _rangeValue() {
      const start = parseFloat(this.getAttribute("start"));
      const end = parseFloat(this.getAttribute("end"));
      return Number.isFinite(start) && Number.isFinite(end) ? [start, end] : null;
    }
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
        this.dispatchEvent(new CustomEvent("contour:brush-start", { bubbles: true, composed: true, detail: { value: this.getAttribute("start"), start: this.getAttribute("start"), end: this.getAttribute("end"), range: this._rangeValue() } }));
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
        this.dispatchEvent(new CustomEvent("contour:brush", { bubbles: true, composed: true, detail: { start: ns, end: ne, value: ns, range: [ns, ne] } }));
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
        this.dispatchEvent(new CustomEvent("contour:brush-end", { bubbles: true, composed: true, detail: { value: this.getAttribute("end"), start: this.getAttribute("start"), end: this.getAttribute("end"), range: this._rangeValue() } }));
        this.dispatchEvent(new CustomEvent("contour:brush", { bubbles: true, composed: true, detail: { start: this.getAttribute("start"), end: this.getAttribute("end"), value: this.getAttribute("end"), range: this._rangeValue() } }));
      });
      // Keyboard: Enter/Space emits brush-start/brush-end (WC-P1-08).
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:brush-start", { bubbles: true, composed: true, detail: { value: this.getAttribute("start"), start: this.getAttribute("start"), end: this.getAttribute("end"), range: this._rangeValue() } }));
        }
      });
      // Cross-filter contract (R16-16): clear-all resets brush range.
      this.addEventListener("contour:clear-all", () => {
        if (this.hasAttribute("start") || this.hasAttribute("end")) {
          this.removeAttribute("start");
          this.removeAttribute("end");
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "brush", filter: { start: null, end: null } } }));
          this.requestRender();
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
          color: (el.dataset && el.dataset.color) || el.style.background || undefined,
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
        el.dataset.color = (typeof seg === "object" && seg.color) ? seg.color : el.style.background;
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
    static get observed() { return ["items", "search", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "note", "limit", "sort"]; }
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
        navKey(e, all, {
          wrap: false,
          homeEnd: true,
          rtl: isRtl(this),
          onNavigate: (i) => all.forEach((it, j) => it.setAttribute("tabindex", j === i ? "0" : "-1")),
          onKey: () => {
            if (e.key === "Enter" || e.key === " ") {
              const idx2 = all.indexOf(document.activeElement);
              all.forEach((o, j) => o.setAttribute("aria-selected", j === idx2 ? "true" : "false"));
              this.dispatchEvent(new CustomEvent("contour:select", {
                bubbles: true,
                composed: true,
                detail: {
                  index: idx2,
                  label: document.activeElement.querySelector(".c-category__label")
                    ? document.activeElement.querySelector(".c-category__label").textContent
                    : document.activeElement.textContent.trim()
                }
              }));
            }
          }
        });
      });
      // Cross-filter contract (R16-16): clear-all resets search filter.
      this.addEventListener("contour:clear-all", () => {
        if (this.hasAttribute("search")) {
          this.removeAttribute("search");
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "category", filter: { search: null } } }));
        }
      });
    }
  }
define("contour-category", ContourCategory);
/**
 * Donut: web component wrapper.
 * Attributes: `value`, `values`, `items`, `label`, `empty`, `loading`, `error`, `retry`, `src`, `lazy`, `refresh`, `timeout`, `skeleton`, `brownout`, `brownout-level`.
 */
class ContourDonut extends ContourBase {
    static get observed() { return ["value", "values", "items", "label", "color", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "brownout", "brownout-level", "note"]; }
    static get properties() { return { value: { attribute: "value" }, values: { attribute: "values" }, items: { attribute: "items" }, label: { attribute: "label" }, color: { attribute: "color" }, src: { attribute: "src" }, note: { attribute: "note" } }; }
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
          items.push({ label: text.replace(/—\s*\d+(?:\.\d+)?$/, "").trim(), value: match ? Number(match[1]) : 0, color: sw ? (sw.dataset && sw.dataset.color) || sw.style.background : undefined });
        });
        // remove authored items from DOM (they will be regenerated below)
        authoredItems.forEach((el) => el.remove());
      } else {
        const iAttr = this.getAttribute("items");
        if (iAttr) { try { items = JSON.parse(iAttr); } catch (e) { items = []; } }
      }
      const values = items.map((it) => (typeof it === "object" ? (it.value || 0) : Number(it) || 0));
      const total = values.reduce((a, b) => a + b, 0) || 1;
      const brownoutLevel = this.brownoutLevel();
      const layerColor = this.getAttribute("color");
      const shedRing = this.shed("ring", 3);
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
          circle.setAttribute("stroke", layerColor || (typeof it === "object" && it.color ? it.color : "var(--chart-" + ((i % 8) + 1) + ")"));
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
      list.setAttribute("role", "list");
      items.forEach((it, i) => {
        const row = document.createElement("div");
        row.className = "c-donut__item";
        row.setAttribute("role", "listitem");
        const sw = document.createElement("span");
        sw.className = "c-donut__swatch";
        sw.style.background = layerColor || (typeof it === "object" && it.color ? it.color : "var(--chart-" + ((i % 8) + 1) + ")");
            if (sw.style.background) sw.dataset.color = layerColor || (typeof it === "object" && it.color ? it.color : sw.style.background);
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
    static get observed() { return ["values", "points", "series", "style", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "annotations", "note"]; }
    static get properties() { return { values: { attribute: "values" }, points: { attribute: "points" }, series: { attribute: "series" }, style: { attribute: "style" }, src: { attribute: "src" }, annotations: { attribute: "annotations" }, note: { attribute: "note" } }; }
    render() {
      this.classList.add("c-time-series");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Time series");
      wireStates(this);
      loadRemote(this, ["values", "points", "series"]);
      if (renderStates(this, "time-series")) return;
      Array.from(this.querySelectorAll(".c-time-series__plot, .c-time-series__axis")).forEach((n) => n.remove());
      // Series management (R16-21): support multiple series via `series` JSON
      // attribute, with per-series style (line|bar), color binding, and
      // interval control. Falls back to single `values` attribute for
      // backward compatibility.
      let series = [];
      const sAttr = this.getAttribute("series");
      if (sAttr) { try { series = JSON.parse(sAttr); } catch (e) { series = []; } }
      const remote = remoteData(this, "series");
      if (Array.isArray(remote)) series = remote;
      // Backward compat: single `values` attribute becomes one series.
      if (!series.length) {
        let values = [];
        const vAttr = this.getAttribute("values");
        if (vAttr) { try { values = JSON.parse(vAttr); } catch (e) { values = vAttr.split(",").map(Number); } }
        if (values.length) {
          series = [{ label: "Series 1", values, style: this.getAttribute("style") || "bar", color: "var(--chart-1)" }];
        }
      }
      const max = series.reduce((m, s) => { const v = Array.isArray(s.values) ? Math.max(...s.values, 0) : 0; return Math.max(m, v); }, 1);
      const min = series.reduce((m, s) => { const v = Array.isArray(s.values) ? Math.min(...s.values, 0) : 0; return Math.min(m, v); }, 0);
      const plot = document.createElement("div");
      plot.className = "c-time-series__plot";
      plot.setAttribute("part", "plot");
      series.forEach((s, si) => {
        const values = Array.isArray(s.values) ? s.values : [];
        const style = s.style || "bar";
        const color = s.color || `var(--chart-${((si % 8) + 1)})`;
        const label = s.label || `Series ${si + 1}`;
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
          path.setAttribute("data-series", String(si));
          path.setAttribute("d", "M " + pts.replace(/ /g, " L "));
          path.style.stroke = color;
          path.style.fill = "none";
          path.style.strokeWidth = "2";
          svg.appendChild(path);
          // point markers
          values.forEach((v, i) => {
            const x = (i / Math.max(1, n - 1)) * 300;
            const y = 120 - ((v - min) / range) * 120;
            const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            c.setAttribute("class", "c-time-series__point");
            c.setAttribute("data-series", String(si));
            c.setAttribute("data-index", String(i));
            c.setAttribute("cx", x.toFixed(2));
            c.setAttribute("cy", y.toFixed(2));
            c.setAttribute("r", "3");
            c.setAttribute("tabindex", i === 0 && si === 0 ? "0" : "-1");
            c.setAttribute("role", "button");
            c.setAttribute("title", String(v));
            c.setAttribute("aria-label", label + ": " + String(v));
            svg.appendChild(c);
          });
          plot.appendChild(svg);
        } else {
          values.forEach((v, i) => {
            const bar = document.createElement("div");
            bar.className = "c-time-series__bar";
            bar.setAttribute("data-series", String(si));
            bar.setAttribute("data-index", String(i));
            bar.style.blockSize = ((v / max) * 100) + "%";
            bar.style.background = color;
            bar.setAttribute("title", String(v));
            bar.setAttribute("role", "img");
            bar.setAttribute("aria-label", label + ": " + String(v));
            bar.setAttribute("tabindex", i === 0 && si === 0 ? "0" : "-1");
            plot.appendChild(bar);
          });
        }
      });
      this.appendChild(plot);
      if (!series.length || !series.some((s) => Array.isArray(s.values) && s.values.length)) renderEmpty(this, "time-series");
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
      const points = () => Array.from(this.querySelectorAll(".c-time-series__point"));
      this.addEventListener("click", (e) => {
        const bar = e.target && e.target.closest ? e.target.closest(".c-time-series__bar") : null;
        if (!bar || !this.contains(bar)) return;
        const seriesIdx = Number(bar.dataset.series || "0");
        const idx = Number(bar.dataset.index || "0");
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series: seriesIdx, index: idx, value: bar.getAttribute("title") } }));
        return;
      });
      const pointClick = (e) => {
        const point = e.target && e.target.closest ? e.target.closest(".c-time-series__point") : null;
        if (!point || !this.contains(point)) return;
        const seriesIdx = Number(point.dataset.series || "0");
        const idx = Number(point.dataset.index || "0");
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series: seriesIdx, index: idx, value: point.getAttribute("title") } }));
      };
      this.addEventListener("click", pointClick);
      this.addEventListener("keydown", (e) => {
        const bar = e.target && e.target.closest ? e.target.closest(".c-time-series__bar") : null;
        if (!bar || !this.contains(bar)) return;
        const all = bars();
        const idx = all.indexOf(bar);
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const seriesIdx = Number(bar.dataset.series || "0");
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { series: seriesIdx, index: idx, value: bar.getAttribute("title") } }));
          return;
        }
        navKey(e, all, {
          wrap: false,
          homeEnd: true,
          rtl: isRtl(this),
          onNavigate: (i) => all.forEach((b, j) => b.setAttribute("tabindex", j === i ? "0" : "-1")),
          onKey: () => {}
        });
      });
      // focus tooltip
      this.addEventListener("focusin", (e) => {
        const bar = e.target && e.target.closest ? e.target.closest(".c-time-series__bar") : null;
        if (bar && this.contains(bar)) {
          const tip = this.querySelector(".c-time-series__tooltip");
          if (tip) { tip.textContent = bar.getAttribute("title"); tip.removeAttribute("hidden"); }
        }
        const point = e.target && e.target.closest ? e.target.closest(".c-time-series__point") : null;
        if (point && this.contains(point)) {
          const tip = this.querySelector(".c-time-series__tooltip");
          if (tip) { tip.textContent = point.getAttribute("title"); tip.removeAttribute("hidden"); }
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
      corner.setAttribute("aria-label", "Row");
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
          if (!td.textContent.trim()) td.setAttribute("aria-label", "Empty");
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
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "pivot", filter: { filter: fi.value } } }));
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
      // Cross-filter contract (R16-16): clear-all resets pivot filter.
      this.addEventListener("contour:clear-all", () => {
        if (this.hasAttribute("filter")) {
          this.removeAttribute("filter");
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "pivot", filter: { filter: null } } }));
        }
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
        } catch (e) { warnBadJson(this, "attribute", e); }
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
      this.setAttribute("role", "group");
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
            if (colors[srcIndex]) { cell.style.background = colors[srcIndex]; cell.dataset.color = colors[srcIndex]; }
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
      this.classList.add("c-bivariate-legend");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Bivariate legend");
      const size = Math.min(12, Math.max(1, parseInt(this.getAttribute("size") || "3", 10) || 3));
      const matrix = this.ensure(".c-bivariate-legend__matrix", () => { const el = document.createElement("div"); el.className = "c-bivariate-legend__matrix"; return el; });
      matrix.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      matrix.style.gridTemplateRows = `repeat(${size}, 1fr)`;
      // Slot composition: authored cells win over the generated grid.
      const authored = Array.from(matrix.children).filter((n) => n.classList && n.classList.contains("c-bivariate-legend__cell"));
      if (!authored.length) {
        matrix.innerHTML = "";
        let colors = [];
        const cAttr = this.getAttribute("colors");
        if (cAttr) { try { colors = JSON.parse(cAttr); } catch (e) { colors = []; } }
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const cell = document.createElement("div");
            cell.className = "c-bivariate-legend__cell";
            cell.setAttribute("role", "button");
            cell.setAttribute("tabindex", "0");
            cell.setAttribute("aria-label", "Cell " + c + "," + r);
            // Palette runs from bottom-left (low/low) to top-right (high/high):
            // reverse the row order so the first palette row sits at the bottom.
            const srcIndex = (size - 1 - r) * size + c;
            if (colors[srcIndex]) { cell.style.background = colors[srcIndex]; cell.dataset.color = colors[srcIndex]; }
            matrix.appendChild(cell);
          }
        }
        // selected highlight
        const sel = this.getAttribute("selected");
        if (sel) {
          const parts = sel.split(",");
          const sr = parseInt(parts[0], 10);
          const sc = parseInt(parts[1], 10);
          const cells = Array.from(matrix.querySelectorAll(".c-bivariate-legend__cell"));
          cells.forEach((cell, i) => {
            const rr = Math.floor(i / size);
            const cc = i % size;
            if (rr === sr && cc === sc) cell.setAttribute("data-selected", "");
            else cell.removeAttribute("data-selected");
          });
        }
        // aria-live region
        let live = this.querySelector(".c-bivariate-legend__live");
        if (!live) { live = document.createElement("div"); live.className = "c-bivariate-legend__live"; live.setAttribute("aria-live", "polite"); live.style.position = "absolute"; live.style.width = "1px"; live.style.height = "1px"; live.style.overflow = "hidden"; live.style.clip = "rect(0,0,0,0)"; this.appendChild(live); }
      }
      const axisX = this.getAttribute("axis-x");
      if (axisX) {
        const ax = this.ensure(".c-bivariate-legend__axis--x", () => { const el = document.createElement("div"); el.className = "c-bivariate-legend__axis c-bivariate-legend__axis--x"; return el; });
        ax.textContent = axisX;
      } else {
        const ax = this.querySelector(".c-bivariate-legend__axis--x");
        if (ax) ax.remove();
      }
      const axisY = this.getAttribute("axis-y");
      if (axisY) {
        const ay = this.ensure(".c-bivariate-legend__axis--y", () => { const el = document.createElement("div"); el.className = "c-bivariate-legend__axis c-bivariate-legend__axis--y"; return el; });
        ay.textContent = axisY;
      } else {
        const ay = this.querySelector(".c-bivariate-legend__axis--y");
        if (ay) ay.remove();
      }
    }
    enhance() {
      if (this._wiredBivLegend) return;
      this._wiredBivLegend = true;
      const selectCell = (cell) => {
        const matrix = this.querySelector(".c-bivariate-legend__matrix");
        const cells = Array.from(matrix ? matrix.querySelectorAll(".c-bivariate-legend__cell") : []);
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
        const cell = e.target && e.target.closest ? e.target.closest(".c-bivariate-legend__cell") : null;
        if (cell && this.contains(cell)) selectCell(cell);
      });
      this.addEventListener("keydown", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-bivariate-legend__cell") : null;
        if (!cell || !this.contains(cell)) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectCell(cell); }
      });
    }
    clear() {
      this.removeAttribute("selected");
      const cells = Array.from(this.querySelectorAll(".c-bivariate-legend__cell"));
      cells.forEach((c) => c.removeAttribute("data-selected"));
      this.dispatchEvent(new CustomEvent("contour:clear", { bubbles: true, composed: true }));
    }
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
    enhance() {
      if (this._wiredThreshold) return;
      this._wiredThreshold = true;
      // Cross-filter contract (R16-16): clear-all resets threshold norm/target.
      this.addEventListener("contour:clear-all", () => {
        if (this.hasAttribute("norm") || this.hasAttribute("value")) {
          this.removeAttribute("norm");
          this.removeAttribute("value");
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "threshold", filter: { norm: null, value: null } } }));
          this.requestRender();
        }
      });
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
      this.setAttribute("role", "list");
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
          item.setAttribute("role", "listitem");
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
    static get observed() { return ["title", "ramp", "scale", "items", "method", "norm", "selectable", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "glyphs", "thresholds", "breaks", "no-data-color", "no-data-label", "size", "table", "classification", "audit", "continuous", "ends", "caption", "graduated"]; }
    static get properties() { return { title: { attribute: "title" }, ramp: { attribute: "ramp" }, scale: { attribute: "scale" }, items: { attribute: "items" }, method: { attribute: "method" }, norm: { attribute: "norm" }, selectable: { attribute: "selectable", type: Boolean }, src: { attribute: "src" }, graduated: { attribute: "graduated", type: Boolean } }; }
    render() {
      this.classList.add("c-legend");
      const graduated = this.hasAttribute("graduated");
      if (graduated) this.classList.add("c-legend--graduated");
      const continuous = this.hasAttribute("continuous");
      if (continuous || this.hasAttribute("selectable")) {
        this.setAttribute("role", "group");
      } else {
        this.setAttribute("role", "list");
      }
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
          return { label: lbl ? lbl.textContent.trim() : el.textContent.trim(), color: sw ? (sw.dataset && sw.dataset.color) || sw.style.background || undefined : undefined };
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
          if (this.hasAttribute("selectable")) {
            list.setAttribute("role", "group");
          } else {
            // Host already has role="list"; inner container should be generic
            list.removeAttribute("role");
          }
          if (title) list.setAttribute("aria-label", title);
          list.innerHTML = "";
          parsed.forEach((it) => {
            const label = typeof it === "string" ? it : (it.label || String(it));
            const key = typeof it === "string" ? it : (it.key || it.label || String(it));
            const item = document.createElement("div");
            item.className = "c-legend__item";
            item.setAttribute("tabindex", "-1");
            if (selectable) {
              item.setAttribute("role", "button");
              item.setAttribute("aria-pressed", "true");
              item.dataset.key = key;
            } else {
              item.setAttribute("role", "listitem");
              // aria-selected is not valid on role="listitem"; omit for non-selectable legends
            }
            const sw = document.createElement("span");
            if (graduated) {
              sw.className = "c-legend__swatch c-legend__swatch--graduated";
              const gSize = it && it.size != null ? it.size : (it && it.value != null ? it.value : 1);
              const sizePx = Math.max(6, Math.min(24, parseFloat(gSize) * 4));
              sw.style.inlineSize = sizePx + "px";
              sw.style.blockSize = sizePx + "px";
            } else {
              sw.className = "c-legend__swatch";
            }
            if (it && it.color) { sw.style.background = it.color; sw.dataset.color = it.color; }
            item.appendChild(sw);
            // graduated break label
            if (graduated && (it && it.break != null)) {
              const bl = document.createElement("span");
              bl.className = "c-legend__break-label";
              bl.textContent = String(it.break);
              item.appendChild(bl);
            }
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
        } catch (e) { warnBadJson(this, "attribute", e); }
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
       const ndLabel = this.getAttribute("no-data-label") || "No data";
       if (ndColor) {
         let nd = this.querySelector(".c-legend__no-data");
         if (!nd) { nd = document.createElement("div"); nd.className = "c-legend__no-data"; this.appendChild(nd); }
         nd.setAttribute("part", "no-data");
         nd.setAttribute("aria-label", ndLabel);
         nd.textContent = ndLabel;
         const glyph = document.createElement("span");
         glyph.className = "glyph";
         glyph.style.background = ndColor;
         glyph.dataset.color = ndColor;
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
      const selectable = this.hasAttribute("selectable");
      this.addEventListener("click", (e) => {
        if (!selectable) return;
        const btn = e.target && e.target.closest ? e.target.closest(".c-legend__item") : null;
        if (!btn || !this.contains(btn)) return;
        const pressed = btn.getAttribute("aria-pressed") !== "true";
        btn.setAttribute("aria-pressed", String(pressed));
        const items = Array.from(this.querySelectorAll(".c-legend__item"));
        const index = items.indexOf(btn);
        this.dispatchEvent(new CustomEvent("contour:legend-toggle", {
          detail: { label: btn.textContent.trim(), key: btn.dataset.key || btn.textContent.trim(), pressed, index },
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
      // keyboard nav (listbox) - only for selectable legends
      if (selectable) {
        this.addEventListener("keydown", (e) => {
          const items = Array.from(this.querySelectorAll(".c-legend__item"));
          if (!items.length) return;
          const active = document.activeElement;
          const idx = items.indexOf(active);
          if (e.key === "Escape") {
            // clear selection
            items.forEach((o) => o.setAttribute("aria-pressed", "false"));
            this.dispatchEvent(new CustomEvent("contour:clear", { bubbles: true, composed: true }));
            return;
          }
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
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
            return;
          }
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (active && active.classList.contains("c-legend__item")) {
              active.click();
            }
            return;
          }
          navKey(e, items, {
            wrap: true,
            homeEnd: true,
            rtl: isRtl(this),
            onNavigate: (i) => items.forEach((o, j) => o.setAttribute("tabindex", j === i ? "0" : "-1")),
            onKey: () => {}
          });
        });
      }
      // Cross-filter contract (R16-16): clear-all resets legend selection.
      this.addEventListener("contour:clear-all", () => {
        const items = Array.from(this.querySelectorAll(".c-legend__item"));
        let changed = false;
        items.forEach((o) => {
          if (o.getAttribute("role") === "button" && o.getAttribute("aria-pressed") === "true") {
            o.setAttribute("aria-pressed", "false");
            changed = true;
          }
        });
        if (changed) {
          this.dispatchEvent(new CustomEvent("contour:filter-change", { bubbles: true, composed: true, detail: { source: "legend", filter: { selection: null } } }));
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
      // Native list semantics: an <ol> with <li> items, not a role="list" on a
      // <div> recreating the platform's list numbering and association.
      let list = this.querySelector(".c-timeline__list");
      if (!list) { list = document.createElement("ol"); list.className = "c-timeline__list"; list.setAttribute("aria-label", this.getAttribute("aria-label") || "Timeline"); this.appendChild(list); }
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "timeline")) return;
      const authored = Array.from(this.children).filter((n) => n.classList && n.classList.contains("c-timeline__item"));
      const items = remoteData(this, "items");
      if (items && !authored.length) {
        Array.from(list.querySelectorAll(".c-timeline__item")).forEach((n) => n.remove());
        try {
          const parsed = JSON.parse(items);
          parsed.forEach((it) => {
            const item = document.createElement("li");
            item.className = "c-timeline__item";
            item.setAttribute("tabindex", "-1");
            if (it.time) {
              const t = document.createElement("time");
              t.className = "c-timeline__time";
              t.setAttribute("datetime", String(it.time));
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
            list.appendChild(item);
          });
        } catch (e) { warnBadJson(this, "attribute", e); }
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
          navKey(e, items, { wrap: false, homeEnd: true, onNavigate: (i) => items.forEach((it, j) => it.setAttribute("tabindex", j === i ? "0" : "-1")), onKey: () => { if (e.key === "Enter" || e.key === " ") this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: items.indexOf(document.activeElement) } })); } });
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
        // Wrap authored cells in rows so gridcells have a required row parent
        let row = null;
        let col = 0;
        const newRow = () => { row = document.createElement("div"); row.setAttribute("role", "row"); this.appendChild(row); col = 0; };
        newRow();
        authoredCells.forEach((cell) => {
          cell.setAttribute("role", "gridcell");
          row.appendChild(cell);
          col++;
          if (col === cols) newRow();
        });
      } else {
        Array.from(this.querySelectorAll(".c-heatmap__cell")).forEach((n) => n.remove());
        const count = Math.min(200, Math.max(0, parseInt(this.getAttribute("cells") || this.getAttribute("count") || "0", 10) || 0));
        const cols = count > 0 ? Math.ceil(Math.sqrt(count)) : 1;
        this.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
        this.style.inlineSize = "16rem";
        if (count > 0) {
         let values = [];
         try { values = JSON.parse(this.getAttribute("values") || "[]"); } catch (e) { values = []; }
         let row = null;
         let col = 0;
         const newRow = () => { row = document.createElement("div"); row.setAttribute("role", "row"); this.appendChild(row); col = 0; };
         newRow();
           for (let i = 0; i < count; i++) {
            const cell = document.createElement("div");
            cell.className = "c-heatmap__cell";
            cell.setAttribute("role", "gridcell");
            cell.setAttribute("tabindex", i === 0 ? "0" : "-1");
            cell.dataset.index = String(i);
            if (values[i] !== undefined) cell.setAttribute("title", String(values[i]));
            row.appendChild(cell);
            col++;
            if (col === cols && i < count - 1) newRow();
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
 * Attributes: `values` (row-major 2D field), `levels`, `label`.
 */
class ContourContourPlot extends ContourBase {
    static get observed() { return ["values", "levels", "label"]; }
    static get properties() { return { values: { attribute: "values" }, levels: { attribute: "levels" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-contour-plot");
      this.setAttribute("role", "img");
      const label = this.getAttribute("label");
      this.setAttribute("aria-label", label || "Contour plot");
      const valuesAttr = this.getAttribute("values");
      const levelsAttr = this.getAttribute("levels");
      let grid = null;
      if (valuesAttr) { try { grid = JSON.parse(valuesAttr); } catch (e) { grid = null; } }
      let levels = [0.3, 0.5, 0.7];
      if (levelsAttr) { try { const l = JSON.parse(levelsAttr); if (Array.isArray(l) && l.length) levels = l; } catch (e) { /* keep defaults */ } }

      let svg = this.querySelector("svg");
      if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "c-contour-plot__svg");
        svg.setAttribute("aria-hidden", "true");
        this.appendChild(svg);
      }
      // Clear previous contours so a re-render cannot stack a second set.
      Array.from(svg.querySelectorAll(".c-contour-plot__contour")).forEach((n) => n.remove());

      if (Array.isArray(grid) && grid.length > 1 && Array.isArray(grid[0]) && grid[0].length > 1) {
        const draw = () => {
          const w = this.clientWidth || 300;
          const h = this.clientHeight || 300;
          svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
          svg.querySelectorAll(".c-contour-plot__contour").forEach((n) => n.remove());
          contourPaths(grid, levels, w, h).forEach((line, li) => {
            if (!line.d) return;
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", line.d);
            path.setAttribute("class", "c-contour-plot__contour" + (li > 0 ? " c-contour-plot__contour--level-" + (li + 1) : ""));
            svg.appendChild(path);
          });
        };
        draw();
        // Re-render on resize so pixel-space paths track the container.
        if (typeof ResizeObserver !== "undefined" && !this._contourResize) {
          this._contourResize = new ResizeObserver(() => draw());
          this._contourResize.observe(this);
          onDispose(this, () => { this._contourResize.disconnect(); this._contourResize = null; });
        }
      } else if (!Array.isArray(grid)) {
        const empty = document.createElement("div");
        empty.className = "c-contour-plot__empty";
        empty.textContent = this.getAttribute("empty") || "No field";
        this.appendChild(empty);
      }
    }
  }
define("contour-contour-plot", ContourContourPlot);
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
        this.dispatchEvent(new CustomEvent("contour:error", { bubbles: true, composed: true, detail: { message: msg } }));
      }, true);
    }
  }
  define("contour-error-boundary", ContourErrorBoundary);

class ContourDataExport extends ContourBase {
    static get observed() { return ["data", "format", "filename", "label"]; }
    static get properties() { return { data: { attribute: "data" }, format: { attribute: "format" }, filename: { attribute: "filename" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-data-export");
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Data export");
      const fmt = (this.getAttribute("format") || "json").toLowerCase();
      const btn = this.ensure(".c-data-export__btn", () => {
        const b = document.createElement("button");
        b.className = "c-data-export__btn";
        b.type = "button";
        return b;
      });
      btn.textContent = this.getAttribute("label") || ("Export " + fmt.toUpperCase());
      if (btn.parentNode !== this) this.appendChild(btn);
    }
    enhance() {
      if (this._wiredDataExport) return;
      this._wiredDataExport = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-data-export__btn") : null;
        if (!btn || !this.contains(btn)) return;
        const fmt = (this.getAttribute("format") || "json").toLowerCase();
        const raw = this.getAttribute("data") || "[]";
        let text = raw;
        if (fmt === "csv") {
          try {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr) && arr.length) {
              const keys = Object.keys(arr[0]);
              text = [keys.join(",")].concat(arr.map((r) => keys.map((k) => JSON.stringify(r[k] ?? "")).join(","))).join("\n");
            }
          } catch (e) {}
        }
        const blob = new Blob([text], { type: fmt === "csv" ? "text/csv" : "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = this.getAttribute("filename") || ("export." + fmt);
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.dispatchEvent(new CustomEvent("contour:export", { bubbles: true, composed: true, detail: { format: fmt } }));
      });
    }
  }
  define("contour-data-export", ContourDataExport);

// Query builder: a list of field/operator/value rows with an Add rule button.
// The component renders the rows from a `query` JSON attribute and emits
// contour:change with the serialised query.
class ContourQueryBuilder extends ContourBase {
  static get observed() { return ["query", "fields"]; }
  static get properties() { return { query: { attribute: "query" }, fields: { attribute: "fields" } }; }
  render() {
    this.classList.add("c-query-builder");
    const fields = this.getAttribute("fields");
    let fieldList = [];
    if (fields) { try { fieldList = JSON.parse(fields); } catch (e) { fieldList = []; } }
    const query = this.getAttribute("query");
    let rules = [];
    if (query) { try { rules = JSON.parse(query); } catch (e) { rules = []; } }
    const list = this.ensure(".c-query-builder__list", () => { const el = document.createElement("div"); el.className = "c-query-builder__list"; return el; });
    Array.from(list.querySelectorAll(".c-query-builder__row")).forEach((n) => n.remove());
    rules.forEach((rule, i) => {
      const row = document.createElement("div");
      row.className = "c-query-builder__row";
      const field = document.createElement("select");
      field.className = "c-query-builder__field";
      field.setAttribute("aria-label", "Field " + (i + 1));
      fieldList.forEach((f) => {
        const opt = document.createElement("option");
        opt.value = typeof f === "string" ? f : (f.value || f.label || "");
        opt.textContent = typeof f === "string" ? f : (f.label || f.value || "");
        if (opt.value === rule.field) opt.selected = true;
        field.appendChild(opt);
      });
      const op = document.createElement("select");
      op.className = "c-query-builder__op";
      op.setAttribute("aria-label", "Operator " + (i + 1));
      ["=", "!=", ">", "<", "contains"].forEach((o) => {
        const opt = document.createElement("option");
        opt.value = o; opt.textContent = o;
        if (o === rule.op) opt.selected = true;
        op.appendChild(opt);
      });
      const val = document.createElement("input");
      val.className = "c-query-builder__value";
      val.type = "text";
      val.value = rule.value || "";
      val.setAttribute("aria-label", "Value " + (i + 1));
      row.appendChild(field); row.appendChild(op); row.appendChild(val);
      list.appendChild(row);
    });
    const add = this.ensure(".c-query-builder__add", () => { const b = document.createElement("button"); b.type = "button"; b.className = "c-btn c-btn--sm c-query-builder__add"; b.textContent = "Add rule"; return b; });
    if (add.parentNode !== this) this.appendChild(add);
  }
  enhance() {
    if (this._wiredQueryBuilder) return;
    this._wiredQueryBuilder = true;
    this.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.closest && t.closest(".c-query-builder__add")) {
        const rows = Array.from(this.querySelectorAll(".c-query-builder__row")).map((r) => ({
          field: r.querySelector(".c-query-builder__field")?.value || "",
          op: r.querySelector(".c-query-builder__op")?.value || "=",
          value: r.querySelector(".c-query-builder__value")?.value || "",
        }));
        rows.push({ field: "", op: "=", value: "" });
        this.setAttribute("query", JSON.stringify(rows));
        this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { query: rows } }));
      }
    });
  }
}
define("contour-query-builder", ContourQueryBuilder);
