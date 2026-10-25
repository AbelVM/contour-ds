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
      const span = this.ensure("span", () => { const el = document.createElement("span"); return el; });
      if (!span.textContent.trim() || span.textContent.trim() !== label) span.textContent = label;
      const kbd = this.ensure("kbd.c-kbd", () => { const el = document.createElement("kbd"); el.className = "c-kbd"; return el; });
      kbd.className = "c-kbd";
      kbd.textContent = this.getAttribute("shortcut") || "⌘K";
    }
  }
  define("contour-search-trigger", ContourSearchTriggerFull);
class ContourShortcutListFull extends ContourBase {
    render() { this.classList.add("c-shortcut-list"); }
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
        const k = this.ensure(".c-shortcut-row__keys", () => { const el = document.createElement("kbd"); el.className = "c-kbd"; return el; });
        k.className = "c-kbd";
        k.textContent = key;
      } else {
        const k = this.querySelector("kbd.c-kbd");
        if (k) k.remove();
      }
      if (desc) {
        const s = this.ensure(".c-shortcut-row__label", () => { const el = document.createElement("span"); return el; });
        s.textContent = desc;
      } else {
        // remove the desc span if present (the one without class)
      }
    }
  }
  define("contour-shortcut-row", ContourShortcutRowFull);
class ContourShortcutPanelFull extends ContourBase {
    render() { this.classList.add("c-shortcut-panel"); }
  }
  define("contour-shortcut-panel", ContourShortcutPanelFull);
  class ContourShortcutOverlayFull extends ContourBase {
    render() { this.classList.add("c-shortcut-overlay"); if (!this.hasAttribute("hidden")) this.setAttribute("hidden", ""); }
  }
  define("contour-shortcut-overlay", ContourShortcutOverlayFull);
class ContourRowActionFull extends ContourBase {
    render() { this.classList.add("c-row-action"); }
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
class ContourDropIndicator extends ContourBase { render() { this.classList.add("c-drop-indicator"); } }
  define("contour-drop-indicator", ContourDropIndicator);
class ContourDropZone extends ContourBase { render() { this.classList.add("c-drop-zone"); } }
  define("contour-drop-zone", ContourDropZone);
class ContourResizable extends ContourBase { render() { this.classList.add("c-resizable"); } }
  define("contour-resizable", ContourResizable);
class ContourTableWrap extends ContourBase { render() { this.classList.add("c-table-wrap"); } }
  define("contour-table-wrap", ContourTableWrap);
class ContourScrollArea extends ContourBase { render() { this.classList.add("c-scroll-area"); } }
  define("contour-scroll-area", ContourScrollArea);
class ContourBtn extends ContourBase {
    static get observed() { return ["variant", "size", "color"]; }
    static get properties() { return { variant: { attribute: "variant" }, size: { attribute: "size" }, color: { attribute: "color" } }; }
    render() {
      this.classList.add("c-btn");
      for (const attr of ["variant", "size", "color"]) {
        const val = this.getAttribute(attr);
        if (val) this.classList.add("c-btn--" + val);
      }
      const label = this.getAttribute("label");
      if (label && !this.querySelector("*") && !this.textContent.trim()) this.textContent = label;
    }
  }
  define("contour-btn", ContourBtn);
