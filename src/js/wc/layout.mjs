import { ContourBase, define } from './core.mjs';
class ContourApp extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-app");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-app__title", () => { const el = document.createElement("div"); el.className = "c-app__title"; el.style.padding = "var(--space-md)"; el.style.fontWeight = "var(--weight-semibold)"; return el; });
        t.textContent = title;
      }
    }
  }
  define("contour-app", ContourApp);
class ContourAppBody extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-app-body");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-app-body__title", () => { const el = document.createElement("div"); el.className = "c-app-body__title"; el.style.padding = "var(--space-md)"; return el; });
        t.textContent = title;
      }
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
      if (!this.querySelector(".c-btn")) {
        for (const lbl of ["One", "Two", "Three"]) {
          const b = document.createElement("button");
          b.className = "c-btn c-btn--sm";
          b.type = "button";
          b.textContent = lbl;
          this.appendChild(b);
        }
      }
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
        const active = document.activeElement;
        const idx = buttons.indexOf(active);
        let next = -1;
        const rtl = (this.getAttribute("dir") || document.documentElement.getAttribute("dir") || "").toLowerCase() === "rtl";
        if (e.key === "ArrowDown") next = idx < 0 ? 0 : Math.min(buttons.length - 1, idx + 1);
        else if (e.key === "ArrowUp") next = idx < 0 ? 0 : Math.max(0, idx - 1);
        else if (e.key === "ArrowRight") next = rtl ? (idx < 0 ? 0 : Math.max(0, idx - 1)) : (idx < 0 ? 0 : Math.min(buttons.length - 1, idx + 1));
        else if (e.key === "ArrowLeft") next = rtl ? (idx < 0 ? 0 : Math.min(buttons.length - 1, idx + 1)) : (idx < 0 ? 0 : Math.max(0, idx - 1));
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = buttons.length - 1;
        if (next >= 0 && next !== idx) {
          e.preventDefault();
          buttons[next].focus();
        }
      });
    }
  }
  define("contour-btn-group", ContourBtnGroup);
class ContourRangeScale extends ContourBase {
    static get observed() { return ["label", "value"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" } }; }
    render() {
      this.classList.add("c-range-scale");
      this.setAttribute("role", "group");
      if (this.getAttribute("label")) this.setAttribute("aria-label", this.getAttribute("label"));
      const label = this.getAttribute("label");
      if (label) {
        const t = this.ensure(".c-range-scale__label", () => { const el = document.createElement("span"); el.className = "c-range-scale__label"; return el; });
        t.textContent = label;
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
    static get observed() { return ["label", "value"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" } }; }
    render() {
      this.classList.add("c-time-range");
      this.setAttribute("role", "group");
      if (this.getAttribute("label")) this.setAttribute("aria-label", this.getAttribute("label"));
      const label = this.getAttribute("label");
      if (label) {
        const t = this.ensure(".c-time-range__label", () => { const el = document.createElement("span"); el.className = "c-time-range__label"; return el; });
        t.textContent = label;
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
