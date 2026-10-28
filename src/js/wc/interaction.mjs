import { ContourBase, define } from './core.mjs';
import { wireSegmented } from './behaviours.mjs';
class ContourPressableFull extends ContourBase {
    static get observed() { return ["disabled"]; }
    static get properties() { return { disabled: { attribute: "disabled", type: Boolean } }; }
    render() {
      this.classList.add("c-pressable");
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      if (this.hasAttribute("disabled")) {
        this.setAttribute("aria-disabled", "true");
        this.setAttribute("tabindex", "-1");
      } else {
        this.removeAttribute("aria-disabled");
        if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      }
    }
    enhance() {
      if (this._wiredPressable) return;
      this._wiredPressable = true;
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.click(); this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true })); }
      });
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
    static get observed() { return ["label", "disabled"]; }
    static get properties() { return { label: { attribute: "label" }, disabled: { attribute: "disabled", type: Boolean } }; }
    render() {
      this.classList.add("c-row-action");
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      if (this.hasAttribute("disabled")) {
        this.setAttribute("aria-disabled", "true");
        this.setAttribute("tabindex", "-1");
      } else {
        this.removeAttribute("aria-disabled");
        if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      }
      const label = this.getAttribute("label");
      if (label && !this.hasChildNodes()) this.textContent = label;
    }
    enhance() {
      if (this._wiredRowAction) return;
      this._wiredRowAction = true;
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.click(); this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true })); }
      });
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
      if (!this.hasAttribute("draggable")) this.setAttribute("draggable", "true");
    }
    // The value a drop partner receives: the authored `value` attribute, else
    // the `label`, else the element's own text. One shape, so a consumer's
    // contour:drop handler sees the same detail a contour:dragstart carried.
    // `label` and `value` are shared-list attributes (they are not overridden
    // here), so the inherited full shared list stays the observed contract.
    _dragValue() {
      return this.getAttribute("value") || this.getAttribute("label") || (this.textContent || "").trim() || "draggable";
    }
    enhance() {
      if (this._wiredDraggable) return;
      this._wiredDraggable = true;
      // Native drag-and-drop (BY-26). The platform owns the drag gesture; the
      // component owns the payload and the visual state. dragstart writes
      // text/plain (the portable payload nearly every drop partner can read),
      // marks the item with the shipped .c-draggable--dragging state, and
      // announces contour:dragstart so a dashboard can react before the drop.
      this.addEventListener("dragstart", (e) => {
        if (!e.dataTransfer) return;
        const value = this._dragValue();
        try { e.dataTransfer.effectAllowed = "move"; } catch (err) { /* synthetic drag: read-only */ }
        e.dataTransfer.setData("text/plain", value);
        this.classList.add("c-draggable--dragging");
        this.dispatchEvent(new CustomEvent("contour:dragstart", { bubbles: true, composed: true, detail: { value } }));
      });
      this.addEventListener("dragend", () => {
        this.classList.remove("c-draggable--dragging");
        this.dispatchEvent(new CustomEvent("contour:dragend", { bubbles: true, composed: true, detail: { value: this._dragValue() } }));
      });
      // Keyboard alternative: HTML5 DnD has no keyboard story, so the focused
      // draggable offers ArrowUp/ArrowDown as a move action the consumer
      // handles exactly like a drop (the accessible reorder pattern). It rides
      // the same event vocabulary — contour:move {direction} — and never fakes
      // a drag it cannot perform.
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true })); return; }
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:move", { bubbles: true, composed: true, detail: { direction: e.key === "ArrowUp" ? "up" : "down" } }));
        }
      });
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
    enhance() {
      if (this._wiredDropZone) return;
      this._wiredDropZone = true;
      // Native drop target (BY-26), delegated on the host (rule 12). dragover
      // is where the platform asks "may it land here?": a text/plain payload
      // is allowed (preventDefault + the shipped --active state), anything
      // else is refused (--reject, no preventDefault so the drop never lands).
      const accepts = (e) => e.dataTransfer && Array.from(e.dataTransfer.types).includes("text/plain");
      const clear = () => { this.classList.remove("c-drop-zone--active", "c-drop-zone--reject"); };
      this.addEventListener("dragenter", (e) => {
        if (!e.dataTransfer) return;
        this.classList.toggle("c-drop-zone--reject", !accepts(e));
        if (accepts(e)) { e.preventDefault(); this.classList.add("c-drop-zone--active"); }
      });
      this.addEventListener("dragover", (e) => {
        if (!e.dataTransfer) return;
        this.classList.toggle("c-drop-zone--reject", !accepts(e));
        if (accepts(e)) { e.preventDefault(); this.classList.add("c-drop-zone--active"); }
      });
      this.addEventListener("dragleave", clear);
      this.addEventListener("drop", (e) => {
        if (!accepts(e)) return;
        e.preventDefault();
        clear();
        const value = e.dataTransfer.getData("text/plain") || "";
        this.dispatchEvent(new CustomEvent("contour:drop", { bubbles: true, composed: true, detail: { value, label: this.getAttribute("label") } }));
      });
      // The keyboard path lives on the draggable (contour:move, BY-26):
      // HTML5 DnD has no keyboard story, and a target that only receives a
      // pointer gesture does not get a focus role it cannot act on alone.
    }
  }
  define("contour-drop-zone", ContourDropZone);
class ContourResizable extends ContourBase {
    static get observed() { return ["direction"]; }
    static get properties() { return { direction: { attribute: "direction" } }; }
    render() {
      this.classList.add("c-resizable");
      const vertical = this.getAttribute("direction") === "vertical";
      this.classList.add(vertical ? "c-resizable--vertical" : "c-resizable--horizontal");
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
    enhance() {
      if (this._wiredResizable) return;
      this._wiredResizable = true;
      // Pointer resize (BY-27): the handle is generated on every render, so
      // the listeners are delegated on the host and re-query per event (rule
      // 12). Dragging sets the first pane's flex-basis; the second pane's
      // `flex: 1 1 0` takes the rest, so the split is the drag's own number.
      const setSplit = (clientX, clientY) => {
        const rect = this.getBoundingClientRect();
        const vertical = this.classList.contains("c-resizable--vertical");
        const span = vertical ? rect.height : rect.width;
        const pos = vertical ? clientY - rect.top : clientX - rect.left;
        const frac = span > 0 ? Math.min(0.9, Math.max(0.1, pos / span)) : 0.5;
        const p1 = this.querySelector(".c-resizable__pane");
        if (p1) p1.style.flex = `0 0 ${Math.round(frac * 100)}%`;
      };
      this.addEventListener("pointerdown", (e) => {
        const handle = this.querySelector(".c-resize-handle");
        if (!handle || e.target !== handle) return;
        this._resizing = true;
        handle.classList.add("c-resize-handle--dragging");
        if (handle.setPointerCapture) { try { handle.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer: ignore */ } }
        e.preventDefault();
      });
      this.addEventListener("pointermove", (e) => {
        if (!this._resizing) return;
        setSplit(e.clientX, e.clientY);
      });
      const stopResize = (e) => {
        if (!this._resizing) return;
        this._resizing = false;
        const handle = this.querySelector(".c-resize-handle");
        if (handle) {
          handle.classList.remove("c-resize-handle--dragging");
          if (handle.hasPointerCapture && handle.hasPointerCapture(e.pointerId)) {
            try { handle.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
          }
        }
      };
      this.addEventListener("pointerup", stopResize);
      this.addEventListener("pointercancel", stopResize);
    }
  }
  define("contour-resizable", ContourResizable);
class ContourTableWrap extends ContourBase {
    static get observed() { return []; }
    static get properties() { return {}; }
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
    static get observed() { return ["variant", "size", "color", "label", "disabled"]; }
    static get properties() { return { variant: { attribute: "variant" }, size: { attribute: "size" }, color: { attribute: "color" }, label: { attribute: "label" }, disabled: { attribute: "disabled", type: Boolean } }; }
    render() {
      this.classList.add("c-btn");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-btn--")) this.classList.remove(c); });
      for (const attr of ["variant", "size", "color"]) {
        const val = this.getAttribute(attr);
        if (val) this.classList.add("c-btn--" + val);
      }
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      if (this.hasAttribute("disabled")) {
        this.setAttribute("aria-disabled", "true");
        this.setAttribute("tabindex", "-1");
      } else {
        this.removeAttribute("aria-disabled");
        if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      }
      const label = this.getAttribute("label");
      if (label && !this.hasChildNodes()) this.textContent = label;
      if (label && !this.hasAttribute("aria-label")) this.setAttribute("aria-label", label);
    }
    enhance() {
      if (this._wiredBtn) return;
      this._wiredBtn = true;
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.click(); this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true })); }
      });
    }
  }
  define("contour-btn", ContourBtn);
