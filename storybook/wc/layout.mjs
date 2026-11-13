import { ContourBase, define, navKey, isRtl , warnBadJson } from './core.mjs';
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
      // The shell has one content region. Authored children left as siblings of
      // the generated <main> took a share of the flex column and sat outside the
      // document's only main landmark, which is neither the layout nor the
      // outline the block describes.
      Array.from(this.children).forEach((child) => {
        if (child === header || child === main) return;
        main.appendChild(child);
      });
    }
  }
  define("contour-app", ContourApp);
  class ContourAppBody extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-app-body");
      // A document may have one visible <main>. Nested inside `contour-app` the
      // shell already owns it, so the body's content region is a plain div; on
      // its own it is the page's landmark.
      const nested = !!(this.parentElement && this.parentElement.closest && this.parentElement.closest("contour-app"));
      const tag = nested ? "div" : "main";
      let main = this.querySelector(":scope > .c-app-body__main");
      if (main && main.tagName.toLowerCase() !== tag) { main.remove(); main = null; }
      if (!main) {
        main = document.createElement(tag);
        main.className = "c-app-body__main";
        this.appendChild(main);
      }
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

// Skip link: an <a> that is visually hidden until focused, then slides in at
// the top-left. The class does the work; the component wraps it so a consumer
// can drop <contour-skip-link href="#main"> into a page and get the link.
class ContourSkipLink extends ContourBase {
  static get observed() { return ["href", "label"]; }
  static get properties() { return { href: { attribute: "href" }, label: { attribute: "label" } }; }
  render() {
    const a = this.ensure("a", () => { const el = document.createElement("a"); el.className = "c-skip-link"; return el; });
    a.setAttribute("href", this.getAttribute("href") || "#main");
    a.textContent = this.getAttribute("label") || "Skip to content";
  }
}
define("contour-skip-link", ContourSkipLink);

// Icon: renders a sprite <use> by name. The icon set is the guide's sprite;
// a consumer points `name` at an id and the <use> resolves it.
class ContourIcon extends ContourBase {
  static get observed() { return ["name", "size", "label"]; }
  static get properties() { return { name: { attribute: "name" }, size: { attribute: "size" }, label: { attribute: "label" } }; }
  render() {
    const name = this.getAttribute("name") || "";
    const size = this.getAttribute("size");
    const label = this.getAttribute("label");
    this.innerHTML = "";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "c-icon");
    svg.setAttribute("aria-hidden", "true");
    if (size) svg.style.width = size, svg.style.height = size;
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#i-" + name);
    svg.appendChild(use);
    this.appendChild(svg);
    if (label) { this.setAttribute("role", "img"); this.setAttribute("aria-label", label); }
    else { this.removeAttribute("role"); this.removeAttribute("aria-label"); }
  }
}
define("contour-icon", ContourIcon);

// Dashboard grid: a CSS grid of widget cells. The component is a layout
// primitive — it lays out its authored children in a responsive grid.
class ContourDashboardGrid extends ContourBase {
  static get observed() { return ["cols", "gap"]; }
  static get properties() { return { cols: { attribute: "cols" }, gap: { attribute: "gap" } }; }
  render() {
    this.classList.add("c-dashboard-grid");
    const cols = this.getAttribute("cols");
    if (cols) this.style.setProperty("--dashboard-grid-cols", cols);
    const gap = this.getAttribute("gap");
    if (gap) this.style.setProperty("--dashboard-grid-gap", gap);
  }
}
define("contour-dashboard-grid", ContourDashboardGrid);

// Analysis stack: a vertical stack of analysis panels with a shared header.
class ContourAnalysisStack extends ContourBase {
  static get observed() { return ["title"]; }
  static get properties() { return { title: { attribute: "title" } }; }
  render() {
    this.classList.add("c-analysis-stack");
    const title = this.getAttribute("title");
    let header = this.querySelector(".c-analysis-stack__header");
    if (title) {
      if (!header) { header = document.createElement("div"); header.className = "c-analysis-stack__header"; this.prepend(header); }
      let h = header.querySelector(".c-analysis-stack__title");
      if (!h) { h = document.createElement("h3"); h.className = "c-analysis-stack__title"; header.appendChild(h); }
      h.textContent = title;
    } else if (header) header.remove();
  }
}
define("contour-analysis-stack", ContourAnalysisStack);
