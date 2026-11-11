import { ContourBase, define, navKey, isRtl } from './core.mjs';
  class ContourApp extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-app");
      const header = this.ensure(".c-app__header", () => { const el = document.createElement("header"); el.className = "c-app__header"; return el; });
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-app__title", () => { const el = document.createElement("div"); el.className = "c-app__title"; return el; });
        t.textContent = title;
        if (t.parentNode !== header) header.appendChild(t);
      }
      const main = this.ensure(".c-app__main", () => { const el = document.createElement("main"); el.className = "c-app__main"; return el; });
      if (main.parentNode !== this) this.appendChild(main);
      if (header.parentNode !== this) this.insertBefore(header, main);
    }
  }
  define("contour-app", ContourApp);
  class ContourAppBody extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-app-body");
      const main = this.ensure(".c-app-body__main", () => { const el = document.createElement("main"); el.className = "c-app-body__main"; return el; });
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-app-body__title", () => { const el = document.createElement("div"); el.className = "c-app-body__title"; return el; });
        t.textContent = title;
        if (t.parentNode !== main) main.appendChild(t);
      }
      if (main.parentNode !== this) this.appendChild(main);
    }
  }
  define("contour-app-body", ContourAppBody);
class ContourBtnGroup extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-btn-group");
      this.setAttribute("role", "group");
      if (this.getAttribute("title")) this.setAttribute("aria-label", this.getAttribute("title"));
      // A shipped component must not invent its own buttons: the author supplies
      // the <button> children. The old code rendered One/Two/Three when empty.
    }
    enhance() {
      if (this._wiredBtnGroup) return;
      this._wiredBtnGroup = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-btn") : null;
        if (btn && this.contains(btn)) {
          const buttons = Array.from(this.querySelectorAll(".c-btn"));
          const index = buttons.indexOf(btn);
          this.dispatchEvent(new CustomEvent("contour:btn-group-change", { bubbles: true, composed: true, detail: { index, label: btn.textContent } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const buttons = Array.from(this.querySelectorAll(".c-btn"));
        if (!buttons.length) return;
        navKey(e, buttons, { wrap: false, homeEnd: true, rtl: isRtl(this) });
      });
    }
  }
  define("contour-btn-group", ContourBtnGroup);
  class ContourRangeScale extends ContourBase {
    static get observed() { return ["label", "value", "ticks"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" }, ticks: { attribute: "ticks" } }; }
    render() {
      this.classList.add("c-range-scale");
      this.setAttribute("role", "group");
      if (this.getAttribute("label")) this.setAttribute("aria-label", this.getAttribute("label"));
      const label = this.getAttribute("label");
      if (label) {
        const t = this.ensure(".c-range-scale__label", () => { const el = document.createElement("span"); el.className = "c-range-scale__label"; return el; });
        t.textContent = label;
      }
      // Tick marks (G-10): render a tick for each comma-separated value.
      const ticksAttr = this.getAttribute("ticks");
      Array.from(this.querySelectorAll(".c-range-scale__tick")).forEach((n) => n.remove());
      if (ticksAttr) {
        ticksAttr.split(",").map((s) => s.trim()).filter(Boolean).forEach((tk) => {
          const t = document.createElement("span");
          t.className = "c-range-scale__tick";
          t.textContent = tk;
          this.appendChild(t);
        });
      }
    }
    enhance() {
      if (this._wiredRangeScale) return;
      this._wiredRangeScale = true;
      this.addEventListener("input", (e) => {
        const t = e.target;
        if (t && t.matches && t.matches("input")) {
          this.dispatchEvent(new CustomEvent("contour:range-change", { bubbles: true, composed: true, detail: { value: t.value } }));
        }
      });
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && t.matches && t.matches("input")) {
          this.dispatchEvent(new CustomEvent("contour:range-change", { bubbles: true, composed: true, detail: { value: t.value } }));
        }
      });
    }
  }
  define("contour-range-scale", ContourRangeScale);
  class ContourTimeRange extends ContourBase {
    static get observed() { return ["label", "value", "ticks"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" }, ticks: { attribute: "ticks" } }; }
    render() {
      this.classList.add("c-time-range");
      this.setAttribute("role", "group");
      if (this.getAttribute("label")) this.setAttribute("aria-label", this.getAttribute("label"));
      const label = this.getAttribute("label");
      if (label) {
        const t = this.ensure(".c-time-range__label", () => { const el = document.createElement("span"); el.className = "c-time-range__label"; return el; });
        t.textContent = label;
      }
      const ticksAttr = this.getAttribute("ticks");
      Array.from(this.querySelectorAll(".c-time-range__tick")).forEach((n) => n.remove());
      if (ticksAttr) {
        ticksAttr.split(",").map((s) => s.trim()).filter(Boolean).forEach((tk) => {
          const t = document.createElement("span");
          t.className = "c-time-range__tick";
          t.textContent = tk;
          this.appendChild(t);
        });
      }
    }
    enhance() {
      if (this._wiredTimeRange) return;
      this._wiredTimeRange = true;
      this.addEventListener("input", (e) => {
        const t = e.target;
        if (t && t.matches && t.matches("input")) {
          this.dispatchEvent(new CustomEvent("contour:time-range-change", { bubbles: true, composed: true, detail: { value: t.value } }));
        }
      });
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && t.matches && t.matches("input")) {
          this.dispatchEvent(new CustomEvent("contour:time-range-change", { bubbles: true, composed: true, detail: { value: t.value } }));
        }
      });
    }
  }
  define("contour-time-range", ContourTimeRange);
