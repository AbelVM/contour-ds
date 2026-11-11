import { ContourBase, define, formatValue, navKey } from './core.mjs';

/**
 * Dashboard state machine (R13-06).
 *
 * A dashboard widget moves through a small, well-defined set of states:
 *   loading  -> data is being fetched/rendered (show skeleton/spinner)
 *   empty    -> fetch resolved but no rows/points (show empty state)
 *   error    -> fetch failed (show error + retry affordance)
 *   stale    -> data present but older than the freshness threshold
 *   ready    -> data present and current (default)
 *
 * Components that participate:
 *   - contour-widget-state  : renders the state chrome (loading/empty/error)
 *     via its `state` attribute; emits `contour:retry` on retry click.
 *   - contour-brownout      : sheds non-essential chrome at levels 1-3
 *     (level 3 drops the dial/ring entirely).
 *   - contour-dash-freshness : live region announcing the last-updated value;
 *     consumers set `value` to an ISO timestamp and `format`/`locale`.
 *   - contour-dash-kpi-row  : renders one contour-kpi per item; emits
 *     `contour:select` with { index } on click.
 *
 * Retry/offline handling lives in the consumer (libreship): contour-ds only
 * provides the affordances (retry button in widget-state, brownout levels,
 * freshness live region). No data fetching or state management is shipped.
 *
 * Slot contracts (R13-17):
 *   - contour-dash-shell    : light-DOM children become the grid cells; the
 *     optional `title` attribute generates a contour-dash-toolbar with a
 *     `.c-dash-toolbar__title`. No shadow slots.
 *   - contour-dash-toolbar  : light-DOM children are appended after the
 *     generated title/actions; `.c-dash-toolbar__actions` is generated from
 *     the `actions` JSON attribute.
 *   - contour-dash-kpi-row  : light-DOM children are replaced by generated
 *     contour-kpi elements from the `items` attribute; authored children are
 *     only kept when no items are provided.
 *   - contour-dash-freshness : no slots; renders a `.c-dot` + text node.
 *   - contour-widget-state   : light-DOM children are the fallback content
 *     shown in the ready state.
 *   - contour-brownout       : light-DOM children are the content that may be
 *     shed at higher brownout levels.
 */
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
      this.addEventListener("keydown", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-btn") : null;
        if (!btn || !this.contains(btn)) return;
        const btns = Array.from(this.querySelectorAll(".c-btn"));
        const idx = btns.indexOf(btn);
        let next = -1;
        if (e.key === "ArrowRight") next = Math.min(btns.length - 1, idx + 1);
        else if (e.key === "ArrowLeft") next = Math.max(0, idx - 1);
        if (next >= 0) { e.preventDefault(); try { btns[next].focus(); } catch (err) {} }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); btn.click(); }
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
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "KPI row");
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
    enhance() {
      if (this._wiredDashKpiRow) return;
      this._wiredDashKpiRow = true;
      this.addEventListener("click", (e) => {
        const kpi = e.target && e.target.closest ? e.target.closest("contour-kpi") : null;
        if (kpi && this.contains(kpi)) {
          const kpis = Array.from(this.querySelectorAll("contour-kpi"));
          const idx = kpis.indexOf(kpi);
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: idx } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const kpis = Array.from(this.querySelectorAll("contour-kpi"));
        if (!kpis.length) return;
        navKey(e, kpis, { wrap: true, homeEnd: true, onNavigate: (i) => this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: i } })), onKey: () => {} });
      });
    }
  }
  define("contour-dash-kpi-row", ContourDashKpiRow);
class ContourDashFreshness extends ContourBase {
    static get observed() { return ["label", "value", "format", "locale"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" }, format: { attribute: "format" }, locale: { attribute: "locale" } }; }
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
      const formattedValue = value ? formatValue(value, this.getAttribute("format"), this.getAttribute("locale")) : value;
      this._freshnessText.nodeValue = [label, formattedValue].filter(Boolean).join(" ");
    }
  }
  define("contour-dash-freshness", ContourDashFreshness);
class ContourSavedView extends ContourBase {
    static get observed() { return ["name", "updated", "source", "active"]; }
    static get properties() { return { name: { attribute: "name" }, updated: { attribute: "updated" }, source: { attribute: "source" }, active: { attribute: "active", type: Boolean } }; }
    render() {
      this.classList.add("c-saved-view");
      this.setAttribute("role", "region");
      if (this.getAttribute("name")) this.setAttribute("aria-label", this.getAttribute("name"));
      if (this.hasAttribute("active")) {
        this.classList.add("c-saved-view--active");
      } else {
        this.classList.remove("c-saved-view--active");
      }
      const thumb = this.ensure(".c-saved-view__thumb", () => { const el = document.createElement("div"); el.className = "c-saved-view__thumb"; el.setAttribute("aria-hidden", "true"); return el; });
      if (thumb.parentNode !== this) this.appendChild(thumb);
      const name = this.ensure(".c-saved-view__name", () => { const el = document.createElement("div"); el.className = "c-saved-view__name"; return el; });
      name.textContent = this.getAttribute("name") || "Saved view";
      let meta = this.querySelector(".c-saved-view__meta");
      if (!meta) { meta = document.createElement("div"); meta.className = "c-saved-view__meta"; this.appendChild(meta); }
      const updated = this.getAttribute("updated");
      const source = this.getAttribute("source");
      meta.replaceChildren();
      if (updated) {
        const wrap = document.createElement("span");
        wrap.textContent = `Updated ${updated}`;
        meta.appendChild(wrap);
      }
      if (source) {
        if (meta.childNodes.length) meta.appendChild(document.createTextNode(" · "));
        const wrap = document.createElement("span");
        wrap.textContent = `Source: ${source}`;
        meta.appendChild(wrap);
      }
      let actions = this.querySelector(".c-saved-view__actions");
      if (!actions) { actions = document.createElement("div"); actions.className = "c-saved-view__actions"; this.appendChild(actions); }
      const apply = actions.querySelector(".c-saved-view__apply") || (() => { const b = document.createElement("button"); b.type = "button"; b.className = "c-btn c-btn--ghost c-btn--sm"; b.textContent = "Apply"; actions.appendChild(b); return b; })();
      const remove = actions.querySelector(".c-saved-view__remove") || (() => { const b = document.createElement("button"); b.type = "button"; b.className = "c-btn c-btn--ghost c-btn--sm"; b.textContent = "Remove"; actions.appendChild(b); return b; })();
    }
    enhance() {
      if (this._wiredSavedView) return;
      this._wiredSavedView = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest("button") : null;
        if (!btn || !this.contains(btn)) return;
        if (btn.textContent === "Apply") {
          this.dispatchEvent(new CustomEvent("contour:apply", { bubbles: true, composed: true, detail: { name: this.getAttribute("name") } }));
        } else if (btn.textContent === "Remove") {
          this.dispatchEvent(new CustomEvent("contour:remove", { bubbles: true, composed: true, detail: { name: this.getAttribute("name") } }));
        }
      });
    }
  }
  define("contour-saved-view", ContourSavedView);
class ContourProvenance extends ContourBase {
    static get observed() { return ["source", "confidence", "resolution", "coverage", "warning", "methodology"]; }
    static get properties() { return { source: { attribute: "source" }, confidence: { attribute: "confidence" }, resolution: { attribute: "resolution" }, coverage: { attribute: "coverage" }, warning: { attribute: "warning" }, methodology: { attribute: "methodology" } }; }
    render() {
      this.classList.add("c-provenance");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Data provenance");
      const source = this.getAttribute("source");
      if (source) {
        const s = this.ensure(".c-provenance__source", () => { const el = document.createElement("span"); el.className = "c-provenance__source"; return el; });
        const b = document.createElement("b");
        b.textContent = "Source:";
        s.replaceChildren(b, document.createTextNode(" " + source));
      } else {
        const s = this.querySelector(".c-provenance__source");
        if (s) s.remove();
      }
      const confidence = this.getAttribute("confidence");
      if (confidence) {
        const c = this.ensure(".c-provenance__confidence", () => { const el = document.createElement("span"); el.className = "c-provenance__confidence"; return el; });
        c.className = `c-provenance__confidence c-provenance__confidence--${confidence}`;
        c.textContent = `Confidence: ${confidence}`;
      } else {
        const c = this.querySelector(".c-provenance__confidence");
        if (c) c.remove();
      }
      const resolution = this.getAttribute("resolution");
      if (resolution) {
        const r = this.ensure(".c-provenance__resolution", () => { const el = document.createElement("span"); el.className = "c-provenance__resolution"; return el; });
        r.textContent = `Resolution: ${resolution}`;
      } else {
        const r = this.querySelector(".c-provenance__resolution");
        if (r) r.remove();
      }
      const coverage = this.getAttribute("coverage");
      if (coverage) {
        const c = this.ensure(".c-provenance__coverage", () => { const el = document.createElement("span"); el.className = "c-provenance__coverage"; return el; });
        c.textContent = `Coverage: ${coverage}`;
      } else {
        const c = this.querySelector(".c-provenance__coverage");
        if (c) c.remove();
      }
      const methodology = this.getAttribute("methodology");
      if (methodology) {
        const m = this.ensure(".c-provenance__methodology", () => { const el = document.createElement("span"); el.className = "c-provenance__methodology"; return el; });
        m.textContent = `Methodology: ${methodology}`;
      } else {
        const m = this.querySelector(".c-provenance__methodology");
        if (m) m.remove();
      }
      const warning = this.getAttribute("warning");
      if (warning) {
        const w = this.ensure(".c-provenance__warning", () => { const el = document.createElement("span"); el.className = "c-provenance__warning"; return el; });
        w.textContent = `Warning: ${warning}`;
      } else {
        const w = this.querySelector(".c-provenance__warning");
        if (w) w.remove();
      }
    }
  }
  define("contour-provenance", ContourProvenance);
class ContourFeatureInspector extends ContourBase {
    static get observed() { return ["title", "open"]; }
    static get properties() { return { title: { attribute: "title" }, open: { attribute: "open", type: Boolean } }; }
    render() {
      this.classList.add("c-feature-inspector");
      this.setAttribute("role", "region");
      if (this.getAttribute("title")) this.setAttribute("aria-label", this.getAttribute("title"));
      if (this.hasAttribute("open")) this.setAttribute("open", "");
      else this.removeAttribute("open");
      const head = this.ensure(".c-feature-inspector__head", () => { const el = document.createElement("div"); el.className = "c-feature-inspector__head"; return el; });
      const title = this.ensure(".c-feature-inspector__title", () => { const el = document.createElement("span"); el.className = "c-feature-inspector__title"; return el; });
      title.textContent = this.getAttribute("title") || "Feature inspector";
      const body = this.ensure(".c-feature-inspector__body", () => { const el = document.createElement("div"); el.className = "c-feature-inspector__body"; return el; });
      const fields = this.querySelectorAll(".c-feature-inspector__field");
      fields.forEach((f) => f.remove());
      const data = this.getAttribute("data");
      if (data) {
        try {
          const parsed = JSON.parse(data);
          for (const [k, v] of Object.entries(parsed)) {
            const field = document.createElement("div");
            field.className = "c-feature-inspector__field";
            const label = document.createElement("span");
            label.className = "c-feature-inspector__label";
            label.textContent = k;
            const value = document.createElement("span");
            value.className = "c-feature-inspector__value";
            value.textContent = String(v);
            field.appendChild(label);
            field.appendChild(value);
            body.appendChild(field);
          }
        } catch (e) { /* keep existing */ }
      }
      const actions = this.ensure(".c-feature-inspector__actions", () => { const el = document.createElement("div"); el.className = "c-feature-inspector__actions"; return el; });
    }
    enhance() {
      if (this._wiredFeatureInspector) return;
      this._wiredFeatureInspector = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest("button") : null;
        if (!btn || !this.contains(btn)) return;
        this.dispatchEvent(new CustomEvent("contour:inspect-action", { bubbles: true, composed: true, detail: { label: btn.textContent } }));
      });
    }
  }
  define("contour-feature-inspector", ContourFeatureInspector);
