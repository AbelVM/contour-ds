import { ContourBase, define } from './core.mjs';
class ContourDashShell extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-dash-shell");
      const title = this.getAttribute("title");
      if (title) {
        // `.c-dash-shell` is the grid and owns no title; the guide's title lives
        // on the toolbar as `.c-dash-toolbar__title`, so the shell composes that
        // block instead of inventing a part of its own.
        const bar = this.ensure(".c-dash-toolbar", () => { const el = document.createElement("div"); el.className = "c-dash-toolbar"; return el; });
        const h = bar.querySelector(".c-dash-toolbar__title") || (() => { const el = document.createElement("span"); el.className = "c-dash-toolbar__title"; bar.appendChild(el); return el; })();
        h.textContent = title;
      } else {
        const h = this.querySelector(".c-dash-toolbar__title");
        if (h) h.remove();
      }
    }
  }
  define("contour-dash-shell", ContourDashShell);
class ContourDashToolbar extends ContourBase {
    static get observed() { return ["title", "actions"]; }
    static get properties() { return { title: { attribute: "title" }, actions: { attribute: "actions" } }; }
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
    static get observed() { return ["label", "value"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" } }; }
    render() {
      this.classList.add("c-dash-freshness");
      const label = this.getAttribute("label");
      const value = this.getAttribute("value");
      // The block defines no elements of its own: the guide's chip is a live dot
      // followed by its text, so the dot is the real `.c-dot` and the words are a
      // text node rather than two invented parts.
      const dot = this.ensure(".c-dot", () => { const el = document.createElement("span"); el.className = "c-dot c-dot--live c-dot--accent"; el.setAttribute("aria-hidden", "true"); return el; });
      if (dot.parentNode !== this) this.appendChild(dot);
      // Reset stale text node reference after base-class cleanup.
      if (!this._freshnessText || !this._freshnessText.parentNode) {
        this._freshnessText = document.createTextNode("");
        this.appendChild(this._freshnessText);
      }
      this._freshnessText.nodeValue = [label, value].filter(Boolean).join(" ");
    }
  }
  define("contour-dash-freshness", ContourDashFreshness);
