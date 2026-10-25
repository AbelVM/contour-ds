import { ContourBase, define } from './core.mjs';
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
    render() {
      this.classList.add("c-shortcut-row");
      const key = this.getAttribute("key");
      const desc = this.getAttribute("desc");
      if (key) {
        const k = this.ensure(".c-shortcut-row__key", () => { const el = document.createElement("kbd"); el.className = "c-kbd"; return el; });
        k.className = "c-kbd";
        k.textContent = key;
      } else {
        const k = this.querySelector("kbd.c-kbd");
        if (k) k.remove();
      }
      if (desc) {
        const s = this.ensure(".c-shortcut-row__desc", () => { const el = document.createElement("span"); return el; });
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
    render() { this.classList.add("c-shortcut-overlay"); }
  }
  define("contour-shortcut-overlay", ContourShortcutOverlayFull);
class ContourRowActionFull extends ContourBase {
    render() { this.classList.add("c-row-action"); }
  }
  define("contour-row-action", ContourRowActionFull);
class ContourSegmented extends ContourBase {
    render() { this.classList.add("c-segmented"); }
    enhance() {
      if (this._wiredSegmented) return;
      this._wiredSegmented = true;
      const activate = (btn) => {
        const options = Array.from(this.querySelectorAll("button"));
        options.forEach((o) => o.setAttribute("aria-pressed", String(o === btn)));
        this.dispatchEvent(new CustomEvent("contour:change", { detail: { value: btn.dataset.value || btn.textContent }, bubbles: true }));
      };
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest("button") : null;
        if (!btn || !this.contains(btn)) return;
        activate(btn);
      });
      this.addEventListener("keydown", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest("button") : null;
        if (!btn || !this.contains(btn)) return;
        const options = Array.from(this.querySelectorAll("button"));
        const idx = options.indexOf(btn);
        let next = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.min(idx + 1, options.length - 1);
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.max(idx - 1, 0);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = options.length - 1;
        if (next >= 0 && next !== idx) {
          e.preventDefault();
          options[next].focus();
          activate(options[next]);
        }
      });
      // Make buttons focusable
      this.querySelectorAll("button").forEach((b) => {
        if (!b.hasAttribute("tabindex")) b.setAttribute("tabindex", "0");
      });
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
class ContourVirtualScroll extends ContourBase { render() { this.classList.add("c-virtual-scroll"); } }
  define("contour-virtual-scroll", ContourVirtualScroll);
class ContourBtn extends ContourBase {
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
