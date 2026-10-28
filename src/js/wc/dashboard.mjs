import { ContourBase, define } from './core.mjs';
class ContourDashShell extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-dash-shell");
      this.setAttribute("role", "region");
      const title = this.getAttribute("title");
      if (title) {
        // `.c-dash-shell` is the grid and owns no title; the guide's title lives
        // on the toolbar as `.c-dash-toolbar__title`, so the shell composes that
        // block instead of inventing a part of its own.
        const bar = this.ensure(".c-dash-toolbar", () => { const el = document.createElement("div"); el.className = "c-dash-toolbar"; return el; });
        const h = bar.querySelector(".c-dash-toolbar__title") || (() => { const el = document.createElement("span"); el.className = "c-dash-toolbar__title"; bar.appendChild(el); return el; })();
        h.textContent = title;
        this.setAttribute("aria-label", title);
      }
    }
  }
  define("contour-dash-shell", ContourDashShell);
class ContourDashToolbar extends ContourBase {
    static get observed() { return ["title", "actions"]; }
    static get properties() { return { title: { attribute: "title" }, actions: { attribute: "actions" } }; }
    render() {
      this.classList.add("c-dash-toolbar");
      this.setAttribute("role", "toolbar");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-dash-toolbar__title", () => { const el = document.createElement("span"); el.className = "c-dash-toolbar__title"; return el; });
        t.textContent = title;
        this.setAttribute("aria-label", title);
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
    enhance() {
      if (this._wiredDashToolbar) return;
      this._wiredDashToolbar = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-btn") : null;
        if (btn && this.contains(btn)) {
          const label = btn.textContent || "";
          this.dispatchEvent(new CustomEvent("contour:dash-action", { bubbles: true, composed: true, detail: { label } }));
        }
      });
    }
  }
  define("contour-dash-toolbar", ContourDashToolbar);
class ContourDashKpiRow extends ContourBase {
    static get observed() { return ["items"]; }
    static get properties() { return { items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-dash-kpi-row");
      this.setAttribute("role", "group");
      // Drop previously generated kpis so re-render doesn't stack.
      Array.from(this.querySelectorAll("contour-kpi")).forEach((n) => n.remove());
      const items = this.getAttribute("items");
      let parsed = null;
      if (items) { try { parsed = JSON.parse(items); } catch (e) { parsed = null; } }
      if (Array.isArray(parsed) && parsed.length) {
        parsed.forEach((it) => {
          const k = document.createElement("contour-kpi");
          if (typeof it === "object" && it !== null) {
            if (it.value !== undefined) k.setAttribute("value", String(it.value));
            if (it.label !== undefined) k.setAttribute("label", String(it.label));
          } else {
            k.setAttribute("value", String(it));
          }
          this.appendChild(k);
        });
      } else if (!this.querySelector("contour-kpi")) {
        // Fallback: keep a single placeholder kpi only when no items provided.
        const k = document.createElement("contour-kpi");
        k.setAttribute("value", "0");
        k.setAttribute("label", "KPI");
        this.appendChild(k);
      }
    }
  }
  define("contour-dash-kpi-row", ContourDashKpiRow);
class ContourDashFreshness extends ContourBase {
    static get observed() { return ["label", "value"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" } }; }
    render() {
      this.classList.add("c-dash-freshness");
      this.setAttribute("role", "status");
      this.setAttribute("aria-live", "polite");
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
