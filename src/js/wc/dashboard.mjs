import { ContourBase, define } from './core.mjs';
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
class ContourDashKpiRow extends ContourBase {
    render() { this.classList.add("c-dash-kpi-row"); }
  }
  define("contour-dash-kpi-row", ContourDashKpiRow);
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
