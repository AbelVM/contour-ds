import { ContourBase, define } from './00-core.mjs';
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
      const core = this.ensure(".c-meter__core", () => { const el = document.createElement("span"); el.className = "c-meter__core"; return el; });
      let val = core.querySelector(".c-meter__value");
      if (!val) { val = document.createElement("span"); val.className = "c-meter__value"; core.appendChild(val); }
      val.textContent = Math.round(parseFloat(value) * 100) + "%";
      if (label) {
        const lbl = core.querySelector(".c-meter__label") || (() => { const el = document.createElement("span"); el.className = "c-meter__label"; core.appendChild(el); return el; })();
        lbl.textContent = label;
      }
      if (!this.hasAttribute("role")) this.setAttribute("role", "meter");
      const prevVal = this._meterAriaValue;
      if (!this.hasAttribute("aria-valuenow") || this.getAttribute("aria-valuenow") === prevVal) {
        this.setAttribute("aria-valuenow", value);
        this._meterAriaValue = value;
      }
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
      if (value) {
        const arrow = this.ensure(".c-delta__arrow", () => { const el = document.createElement("span"); el.className = "c-delta__arrow"; return el; });
        arrow.textContent = direction === "up" ? "↑" : direction === "down" ? "↓" : "→";
        const val = this.ensure(".c-delta__value", () => { const el = document.createElement("span"); el.className = "c-delta__value"; return el; });
        val.textContent = value;
      } else {
        const arrow = this.querySelector(".c-delta__arrow");
        if (arrow) arrow.remove();
        const val = this.querySelector(".c-delta__value");
        if (val) val.remove();
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
    }
  }
  define("contour-stat", ContourStat);

  // KPI: already defined above.

  // Instrument readout: generates rows.
  class ContourInstrument extends ContourBase {
    render() {
      this.classList.add("c-instrument");
      const rows = this.getAttribute("rows");
      if (rows) {
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
      const matrix = this.ensure(".c-bivariate__matrix", () => { const el = document.createElement("div"); el.className = "c-bivariate__matrix"; return el; });
      matrix.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      matrix.innerHTML = "";
      for (let i = 0; i < size * size; i++) {
        const cell = document.createElement("div");
        cell.className = "c-bivariate__cell";
        matrix.appendChild(cell);
      }
    }
  }
  define("contour-bivariate", ContourBivariate);

  // Expandable: generates summary + content.
  class ContourExpandable extends ContourBase {
    render() {
      this.classList.add("c-expandable");
      const summary = this.getAttribute("summary");
      if (summary) {
        const captured = this.innerHTML;
        const details = this.ensure("details", () => {
          const d = document.createElement("details");
          const summ = document.createElement("summary");
          summ.textContent = summary;
          d.appendChild(summ);
          const content = document.createElement("div");
          content.className = "c-expandable__body";
          content.innerHTML = captured;
          d.appendChild(content);
          return d;
        });
        const summ = details.querySelector("summary");
        if (summ) summ.textContent = summary;
        if (details.parentNode !== this) { this.innerHTML = ""; this.appendChild(details); }
      } else {
        const details = this.querySelector("details");
        if (details) details.remove();
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
      if (label) {
        if (!this.textContent.trim()) this.textContent = label;
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


