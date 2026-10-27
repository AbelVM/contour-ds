import { ContourBase, define } from './core.mjs';
import { loadRemote, remoteData, remoteRefresh, renderStates, renderEmpty, wireStates } from './states.mjs';
class ContourReservedFull extends ContourBase {
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
    static get properties() { return { items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-activity");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "activity")) return;
      const items = remoteData(this, "items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          Array.from(this.querySelectorAll(".c-activity__item")).forEach((n) => n.remove());
          parsed.forEach((it) => {
            const item = document.createElement("div");
            item.className = "c-activity__item";
            const dot = document.createElement("span");
            dot.className = "c-activity__dot c-activity__dot--" + (it.variant || "primary");
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
        const empty = document.createElement("div");
        empty.className = "c-activity__empty";
        empty.textContent = this.getAttribute("empty") || "No data";
        empty.style.color = "var(--color-text-muted)";
        empty.style.padding = "var(--space-md)";
        this.appendChild(empty);
      }
    }
  }
  define("contour-activity", ContourActivity);
class ContourAdvanced extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-advanced");
      Array.from(this.childNodes).forEach((n) => { if (n.nodeType === Node.TEXT_NODE) n.remove(); else if (n.nodeType === Node.ELEMENT_NODE && n.tagName === "SPAN") n.remove(); });
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-advanced__title", () => { const el = document.createElement("div"); el.className = "c-advanced__title"; return el; });
        t.textContent = title;
      }
    }
  }
  define("contour-advanced", ContourAdvanced);
class ContourAffordance extends ContourBase {
    static get observed() { return ["name", "note", "demo"]; }
    static get properties() { return { name: { attribute: "name" }, note: { attribute: "note" }, demo: { attribute: "demo" } }; }
    render() {
      this.classList.add("c-affordance");
      const name = this.getAttribute("name");
      if (name) {
        const n = this.ensure(".c-affordance__name", () => { const el = document.createElement("div"); el.className = "c-affordance__name"; return el; });
        n.textContent = name;
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
  }
  define("contour-affordance", ContourAffordance);
class ContourAffordances extends ContourBase {
    static get observed() { return ["name", "title"]; }
    static get properties() { return { name: { attribute: "name" }, title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-affordances");
      Array.from(this.childNodes).forEach((n) => { if (n.nodeType === Node.TEXT_NODE) n.remove(); else if (n.nodeType === Node.ELEMENT_NODE && n.tagName === "SPAN") n.remove(); });
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
