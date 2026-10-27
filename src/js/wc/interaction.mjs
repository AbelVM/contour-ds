import { ContourBase, define } from './core.mjs';
import { wireSegmented } from './behaviours.mjs';
class ContourPressableFull extends ContourBase {
    render() {
      this.classList.add("c-pressable");
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
    }
  }
  define("contour-pressable", ContourPressableFull);
class ContourResizeHandleFull extends ContourBase {
    render() {
      this.classList.add("c-resize-handle");
      if (!this.hasAttribute("role")) this.setAttribute("role", "separator");
    }
  }
  define("contour-resize-handle", ContourResizeHandleFull);
class ContourSearchTriggerFull extends ContourBase {
    static get observed() { return ["label", "shortcut"]; }
    static get properties() { return { label: { attribute: "label" }, shortcut: { attribute: "shortcut" } }; }
    render() {
      this.classList.add("c-search-trigger");
      const label = this.getAttribute("label") || "Search";
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", label);
      const span = this.ensure(".c-search-trigger__text", () => { const el = document.createElement("span"); el.className = "c-search-trigger__text"; return el; });
      span.className = "c-search-trigger__text";
      if (!span.textContent.trim() || span.textContent.trim() !== label) span.textContent = label;
      const kbd = this.ensure("kbd.c-search-trigger__kbd", () => { const el = document.createElement("kbd"); el.className = "c-search-trigger__kbd"; return el; });
      kbd.className = "c-search-trigger__kbd";
      kbd.textContent = this.getAttribute("shortcut") || "⌘K";
    }
  }
  define("contour-search-trigger", ContourSearchTriggerFull);
class ContourShortcutListFull extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-shortcut-list");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-shortcut-list__title", () => { const el = document.createElement("div"); el.className = "c-shortcut-list__title"; el.style.padding = "var(--space-sm)"; el.style.fontWeight = "var(--weight-semibold)"; return el; });
        t.textContent = title;
      }
    }
  }
  define("contour-shortcut-list", ContourShortcutListFull);
class ContourShortcutRowFull extends ContourBase {
    static get observed() { return ["desc", "key"]; }
    static get properties() { return { desc: { attribute: "desc" }, key: { attribute: "key" } }; }
    render() {
      this.classList.add("c-shortcut-row");
      const key = this.getAttribute("key");
      const desc = this.getAttribute("desc");
      if (key) {
        const k = this.ensure(".c-shortcut-row__keys", () => { const el = document.createElement("kbd"); el.className = "c-shortcut-row__keys"; return el; });
        k.className = "c-shortcut-row__keys";
        k.textContent = key;
      } else {
        const k = this.querySelector(".c-shortcut-row__keys");
        if (k) k.remove();
      }
      if (desc) {
        const s = this.ensure(".c-shortcut-row__label", () => { const el = document.createElement("span"); el.className = "c-shortcut-row__label"; return el; });
        s.className = "c-shortcut-row__label";
        s.textContent = desc;
      } else {
        const s = this.querySelector(".c-shortcut-row__label");
        if (s) s.remove();
      }
    }
  }
  define("contour-shortcut-row", ContourShortcutRowFull);
class ContourShortcutPanelFull extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-shortcut-panel");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-shortcut-panel__title", () => { const el = document.createElement("div"); el.className = "c-shortcut-panel__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-shortcut-panel__title");
        if (t) t.remove();
      }
    }
  }
  define("contour-shortcut-panel", ContourShortcutPanelFull);
  class ContourShortcutOverlayFull extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-shortcut-overlay");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-shortcut-overlay__title", () => { const el = document.createElement("div"); el.className = "c-shortcut-overlay__title"; el.style.padding = "var(--space-sm)"; return el; });
        t.textContent = title;
      }
      if (!this.hasAttribute("hidden")) this.setAttribute("hidden", "");
    }
  }
  define("contour-shortcut-overlay", ContourShortcutOverlayFull);
class ContourRowActionFull extends ContourBase {
    static get observed() { return ["label"]; }
    static get properties() { return { label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-row-action");
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      const label = this.getAttribute("label");
      if (label && !this.hasChildNodes()) this.textContent = label;
    }
  }
  define("contour-row-action", ContourRowActionFull);
class ContourSegmented extends ContourBase {
    render() { this.classList.add("c-segmented"); }
    enhance() {
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
      wireSegmented(this);
    }
  }
  define("contour-segmented", ContourSegmented);
class ContourDraggable extends ContourBase {
    render() {
      this.classList.add("c-draggable");
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
    }
  }
  define("contour-draggable", ContourDraggable);
class ContourDragHandle extends ContourBase {
    render() {
      this.classList.add("c-drag-handle");
      if (!this.hasAttribute("role")) this.setAttribute("role", "separator");
    }
  }
  define("contour-drag-handle", ContourDragHandle);
class ContourDropIndicator extends ContourBase {
    static get observed() { return ["label"]; }
    static get properties() { return { label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-drop-indicator");
      this.classList.add("c-drop-indicator--visible");
      Array.from(this.childNodes).forEach((n) => { if (n.nodeType === Node.TEXT_NODE) n.remove(); else if (n.nodeType === Node.ELEMENT_NODE && n.tagName === "SPAN") n.remove(); });
      const label = this.getAttribute("label");
      if (label) {
        const t = this.ensure(".c-drop-indicator__label", () => { const el = document.createElement("span"); el.className = "c-drop-indicator__label"; return el; });
        t.textContent = label;
      }
    }
  }
  define("contour-drop-indicator", ContourDropIndicator);
class ContourDropZone extends ContourBase {
    static get observed() { return ["label"]; }
    static get properties() { return { label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-drop-zone");
      Array.from(this.childNodes).forEach((n) => { if (n.nodeType === Node.TEXT_NODE) n.remove(); else if (n.nodeType === Node.ELEMENT_NODE && n.tagName === "SPAN") n.remove(); });
      const label = this.getAttribute("label");
      if (label) {
        const t = this.ensure(".c-drop-zone__label", () => { const el = document.createElement("p"); el.className = "c-drop-zone__label"; return el; });
        t.textContent = label;
      }
    }
  }
  define("contour-drop-zone", ContourDropZone);
class ContourResizable extends ContourBase {
    static get observed() { return ["title", "direction"]; }
    static get properties() { return { title: { attribute: "title" }, direction: { attribute: "direction" } }; }
    render() {
      this.classList.add("c-resizable");
      this.classList.add("c-resizable--horizontal");
      if (!this.querySelector(".c-resizable__pane")) {
        const p1 = document.createElement("div");
        p1.className = "c-resizable__pane";
        p1.textContent = "Pane A";
        const handle = document.createElement("div");
        handle.className = "c-resize-handle";
        const p2 = document.createElement("div");
        p2.className = "c-resizable__pane";
        p2.textContent = "Pane B";
        this.appendChild(p1);
        this.appendChild(handle);
        this.appendChild(p2);
      }
    }
  }
  define("contour-resizable", ContourResizable);
class ContourTableWrap extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-table-wrap");
      Array.from(this.childNodes).forEach((n) => { if (n.nodeType === Node.TEXT_NODE) n.remove(); else if (n.nodeType === Node.ELEMENT_NODE && n.tagName === "SPAN") n.remove(); });
      if (!this.querySelector("table")) {
        const t = document.createElement("table");
        t.className = "c-table";
        const thead = document.createElement("thead");
        const tr = document.createElement("tr");
        for (const h of ["A", "B"]) { const th = document.createElement("th"); th.textContent = h; tr.appendChild(th); }
        thead.appendChild(tr);
        t.appendChild(thead);
        const tbody = document.createElement("tbody");
        const tr2 = document.createElement("tr");
        for (const v of ["1", "2"]) { const td = document.createElement("td"); td.textContent = v; tr2.appendChild(td); }
        tbody.appendChild(tr2);
        t.appendChild(tbody);
        this.appendChild(t);
      }
    }
  }
  define("contour-table-wrap", ContourTableWrap);
class ContourScrollArea extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-scroll-area");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-scroll-area__title", () => { const el = document.createElement("div"); el.className = "c-scroll-area__title"; el.style.padding = "var(--space-sm)"; el.style.fontWeight = "var(--weight-semibold)"; return el; });
        t.textContent = title;
      }
    }
  }
  define("contour-scroll-area", ContourScrollArea);
class ContourBtn extends ContourBase {
    static get observed() { return ["variant", "size", "color", "label"]; }
    static get properties() { return { variant: { attribute: "variant" }, size: { attribute: "size" }, color: { attribute: "color" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-btn");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-btn--")) this.classList.remove(c); });
      for (const attr of ["variant", "size", "color"]) {
        const val = this.getAttribute(attr);
        if (val) this.classList.add("c-btn--" + val);
      }
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      const label = this.getAttribute("label");
      if (label && !this.hasChildNodes()) this.textContent = label;
      if (label && !this.hasAttribute("aria-label")) this.setAttribute("aria-label", label);
    }
  }
  define("contour-btn", ContourBtn);
