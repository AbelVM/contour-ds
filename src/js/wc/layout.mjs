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
  }
  define("contour-btn-group", ContourBtnGroup);
class ContourRangeScale extends ContourBase {
    static get observed() { return ["label"]; }
    static get properties() { return { label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-range-scale");
      const label = this.getAttribute("label");
      if (label) {
        const t = this.ensure(".c-range-scale__label", () => { const el = document.createElement("span"); el.className = "c-range-scale__label"; return el; });
        t.textContent = label;
      }
    }
  }
  define("contour-range-scale", ContourRangeScale);
class ContourTimeRange extends ContourBase {
    static get observed() { return ["label"]; }
    static get properties() { return { label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-time-range");
      const label = this.getAttribute("label");
      if (label) {
        const t = this.ensure(".c-time-range__label", () => { const el = document.createElement("span"); el.className = "c-time-range__label"; return el; });
        t.textContent = label;
      }
    }
  }
  define("contour-time-range", ContourTimeRange);
