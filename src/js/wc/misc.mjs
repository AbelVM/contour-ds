import { ContourBase, define } from './core.mjs';
import { loadRemote, remoteData, remoteRefresh, renderStates, renderEmpty, wireStates } from './states.mjs';
class ContourReservedFull extends ContourBase {
    static get observed() { return ["title"]; }
    render() {
      this.classList.add("c-reserved");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-reserved__title", () => { const el = document.createElement("div"); el.className = "c-reserved__title"; return el; });
        t.textContent = title;
      }
    }
  }
  define("contour-reserved", ContourReservedFull);
class ContourThemeScopeFull extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-theme-scope");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-theme-scope__title", () => { const el = document.createElement("div"); el.className = "c-theme-scope__title"; el.style.padding = "var(--space-sm)"; el.style.fontWeight = "var(--weight-semibold)"; return el; });
        t.textContent = title;
      }
    }
  }
  define("contour-theme-scope", ContourThemeScopeFull);
class ContourActivity extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-activity");
      this.setAttribute("role", "list");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "activity")) return;
      const items = remoteData(this, "items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          Array.from(this.querySelectorAll(".c-activity__item")).forEach((n) => n.remove());
          parsed.forEach((it, i) => {
            const item = document.createElement("div");
            item.className = "c-activity__item";
            item.setAttribute("role", "listitem");
            item.tabIndex = -1;
            const dot = document.createElement("span");
            dot.className = "c-activity__dot c-activity__dot--" + (it.variant || "primary");
            dot.setAttribute("aria-hidden", "true");
            item.appendChild(dot);
            const text = document.createElement("span");
            text.className = "c-activity__text";
            text.textContent = typeof it === "string" ? it : (it.text || it.label || "");
            item.appendChild(text);
            if (it.time) {
              const time = document.createElement("span");
              time.className = "c-activity__time";
              time.textContent = it.time;
              item.appendChild(time);
            }
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      } else {
        renderEmpty(this, "activity");
      }
    }
    enhance() {
      if (this._wiredActivity) return;
      this._wiredActivity = true;
      this.addEventListener("click", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".c-activity__item") : null;
        if (item && this.contains(item)) {
          const items = Array.from(this.querySelectorAll(".c-activity__item"));
          const index = items.indexOf(item);
          const text = item.querySelector(".c-activity__text")?.textContent || "";
          this.dispatchEvent(new CustomEvent("contour:activity-select", { bubbles: true, composed: true, detail: { index, text } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const items = Array.from(this.querySelectorAll(".c-activity__item"));
        if (!items.length) return;
        const active = document.activeElement;
        const idx = items.indexOf(active);
        let next = -1;
        if (e.key === "ArrowDown") next = idx < 0 ? 0 : Math.min(items.length - 1, idx + 1);
        else if (e.key === "ArrowUp") next = idx < 0 ? 0 : Math.max(0, idx - 1);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = items.length - 1;
        if (next >= 0 && next !== idx) {
          e.preventDefault();
          items[next].focus();
          items[next].tabIndex = 0;
          if (idx >= 0) items[idx].tabIndex = -1;
        }
        if ((e.key === "Enter" || e.key === " ") && idx >= 0) {
          e.preventDefault();
          const text = items[idx].querySelector(".c-activity__text")?.textContent || "";
          this.dispatchEvent(new CustomEvent("contour:activity-select", { bubbles: true, composed: true, detail: { index: idx, text } }));
        }
      });
    }
  }
  define("contour-activity", ContourActivity);
class ContourAdvanced extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-advanced");
      this.setAttribute("role", "region");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-advanced__title", () => { const el = document.createElement("div"); el.className = "c-advanced__title"; return el; });
        t.textContent = title;
        this.setAttribute("aria-label", title);
      }
    }
    enhance() {
      if (this._wiredAdvanced) return;
      this._wiredAdvanced = true;
      this.addEventListener("click", (e) => {
        const title = this.getAttribute("title") || "";
        this.dispatchEvent(new CustomEvent("contour:advanced-toggle", { bubbles: true, composed: true, detail: { title } }));
      });
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const title = this.getAttribute("title") || "";
          this.dispatchEvent(new CustomEvent("contour:advanced-toggle", { bubbles: true, composed: true, detail: { title } }));
        }
      });
    }
  }
  define("contour-advanced", ContourAdvanced);
class ContourAffordance extends ContourBase {
    static get observed() { return ["name", "note", "demo"]; }
    static get properties() { return { name: { attribute: "name" }, note: { attribute: "note" }, demo: { attribute: "demo" } }; }
    render() {
      this.classList.add("c-affordance");
      this.setAttribute("role", "group");
      const name = this.getAttribute("name");
      if (name) {
        const n = this.ensure(".c-affordance__name", () => { const el = document.createElement("div"); el.className = "c-affordance__name"; return el; });
        n.textContent = name;
        this.setAttribute("aria-label", name);
      } else {
        const n = this.querySelector(".c-affordance__name");
        if (n) n.remove();
      }
      const note = this.getAttribute("note");
      if (note) {
        const nt = this.ensure(".c-affordance__note", () => { const el = document.createElement("div"); el.className = "c-affordance__note"; return el; });
        nt.textContent = note;
      } else {
        const nt = this.querySelector(".c-affordance__note");
        if (nt) nt.remove();
      }
      const demo = this.getAttribute("demo");
      if (demo) {
        const d = this.ensure(".c-affordance__demo", () => { const el = document.createElement("div"); el.className = "c-affordance__demo"; return el; });
        d.textContent = demo;
      } else {
        const d = this.querySelector(".c-affordance__demo");
        if (d) d.remove();
      }
    }
    enhance() {
      if (this._wiredAffordance) return;
      this._wiredAffordance = true;
      this.addEventListener("click", (e) => {
        const name = this.getAttribute("name") || "";
        this.dispatchEvent(new CustomEvent("contour:affordance-activate", { bubbles: true, composed: true, detail: { name } }));
      });
    }
  }
  define("contour-affordance", ContourAffordance);
class ContourAffordances extends ContourBase {
    static get observed() { return ["name", "title"]; }
    static get properties() { return { name: { attribute: "name" }, title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-affordances");
      this.setAttribute("role", "group");
      if (!this.querySelector(".c-affordance")) {
        const aff = document.createElement("div");
        aff.className = "c-affordance";
        const name = this.getAttribute("name") || this.getAttribute("title") || "Affordance";
        const n = document.createElement("div");
        n.className = "c-affordance__name";
        n.textContent = name;
        aff.appendChild(n);
        const demo = document.createElement("div");
        demo.className = "c-affordance__demo";
        demo.textContent = "Demo";
        aff.appendChild(demo);
        this.appendChild(aff);
      }
    }
  }
  define("contour-affordances", ContourAffordances);
