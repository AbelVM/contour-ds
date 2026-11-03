/**
 * Form controls: field, field-group, form, combobox, select, check, radio,
 * switch, textarea, input, input-group, range, radio-list, version.
 *
 * All form controls are `ContourBase` subclasses. They render light-DOM markup
 * from observed attributes, reflect properties back to attributes, take part in
 * form association (`formAssociated`, `_internals.setFormValue`) where the
 * platform allows it, and emit `contour:input` / `contour:change` / `contour:submit`
 * events. Inline validation (blur-driven `aria-invalid`) is handled by
 * `ContourField`; `ContourForm` owns submission state and a live-region summary.
 * @module contour-wc/forms
 */

import { ContourBase, define, contourId } from './core.mjs';
import { wireCombobox } from './behaviours.mjs';
import { loadRemote, remoteData, renderStates, renderEmpty, wireStates } from './states.mjs';
/**
 * Combobox: a filterable, keyboard-navigable listbox backed by a JSON `options`
 * attribute or authored `<li>` options. Supports single and multi-select
 * (`multiple`), fixed-row virtualization (`virtual`), async/remote options
 * (`src`, `loading`, `error`, `retry`, `empty`, `skeleton`), a clear button and
 * form association. Emits `contour:select` on commit and `contour:input` on
 * filter. ArrowUp/Down/Home/End rove the cursor; Enter commits; Escape closes.
 */
class ContourCombobox extends ContourBase {
  static get observed() { return ["options", "placeholder", "label", "value", "multiple", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "empty", "skeleton", "virtual"]; }
    static get formAssociated() { return true; }
    static get properties() { return { options: { attribute: "options" }, placeholder: { attribute: "placeholder" }, label: { attribute: "label" }, value: { attribute: "value" }, multiple: { attribute: "multiple", type: Boolean }, virtual: { attribute: "virtual", type: Boolean }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-combobox");
      wireStates(this);
      loadRemote(this, "options");
      if (renderStates(this, "combobox")) return;
      const options = remoteData(this, "options");
      // Slot composition: authored <li> options win over the JSON attribute.
      const authored = Array.from(this.children).filter((n) => !n.classList || (!n.classList.contains("c-combobox__input") && !n.classList.contains("c-combobox__list")));
      if ((options) && !authored.length) {
        try {
          const parsed = options ? JSON.parse(options) : [];
          const input = this.ensure(".c-combobox__input", () => { const el = document.createElement("input"); el.className = "c-combobox__input"; el.type = "text"; return el; });
          input.type = "text";
          input.placeholder = this.getAttribute("placeholder") || "Search…";
          input.setAttribute("aria-label", this.getAttribute("label") || "Search");
          const val = this.getAttribute("value");
          if (val !== null) input.value = val;
          const list = this.ensure(".c-combobox__list", () => { const el = document.createElement("ul"); el.className = "c-combobox__list"; el.setAttribute("hidden", ""); return el; });
          list.innerHTML = "";
          list.setAttribute("hidden", "");
          this._comboboxOptions = parsed;
          this._comboboxVirtual = this.hasAttribute("virtual") && parsed.length > 100;
          if (this._comboboxVirtual) {
            list.classList.add("c-combobox__list--virtual");
            list.style.maxBlockSize = "20rem";
            list.style.overflow = "auto";
            this._renderComboboxWindow("", true);
          } else {
            list.classList.remove("c-combobox__list--virtual");
            list.style.maxBlockSize = "";
            list.style.overflow = "";
            this._renderComboboxWindow("", true);
          }
        } catch (e) { /* keep existing */ }
      } else if (!authored.length && !options) {
        renderEmpty(this, "combobox");
      }
      // Clear button (F-11).
      if (this.getAttribute("value")) {
        this.ensure(".c-combobox__clear", () => {
          const btn = document.createElement("button");
          btn.className = "c-combobox__clear";
          btn.type = "button";
          btn.setAttribute("aria-label", "Clear");
          btn.textContent = "×";
          return btn;
        });
      } else {
        const btn = this.querySelector(".c-combobox__clear");
        if (btn) btn.remove();
      }
    }
    _renderComboboxWindow(query = "", reset = false) {
      const list = this.querySelector(".c-combobox__list");
      const options = this._comboboxOptions || [];
      if (!list) return;
      const q = String(query || "").toLowerCase();
      const filtered = options.map((opt, index) => ({
        opt,
        index,
        label: typeof opt === "string" ? opt : opt.label,
        value: typeof opt === "string" ? opt : opt.value,
      })).filter((item) => !q || String(item.label).toLowerCase().includes(q));
      this._comboboxFiltered = filtered;
      const rowHeight = 32;
      const windowSize = 20;
      const overscan = 6;
      const oldScrollTop = list.scrollTop;
      const start = this._comboboxVirtual && !reset
        ? Math.min(Math.max(0, filtered.length - windowSize), Math.max(0, Math.floor(oldScrollTop / rowHeight) - overscan))
        : 0;
      this._comboboxWindowStart = start;
      const end = this._comboboxVirtual ? Math.min(filtered.length, start + windowSize + overscan * 2) : filtered.length;
      const selectedVals = (this.getAttribute("value") || "").split(",").map((v) => v.trim()).filter(Boolean);
      list.innerHTML = "";
      const addSpacer = (height) => {
        const spacer = document.createElement("li");
        spacer.setAttribute("aria-hidden", "true");
        spacer.style.blockSize = `${height}px`;
        list.appendChild(spacer);
      };
      if (this._comboboxVirtual) addSpacer(start * rowHeight);
      if (!filtered.length) {
        const empty = document.createElement("li");
        empty.className = "c-combobox__empty";
        empty.setAttribute("role", "status");
        empty.textContent = this.getAttribute("empty") || "No matches";
        list.appendChild(empty);
      }
      if (this.hasAttribute("multiple")) list.setAttribute("aria-multiselectable", "true");
      else list.removeAttribute("aria-multiselectable");
      filtered.slice(start, end).forEach((item) => {
        const li = document.createElement("li");
        li.className = "c-combobox__option";
        li.dataset.optionIndex = String(item.index);
        li.setAttribute("role", "option");
        const label = String(item.label);
        const q = String(query || "").toLowerCase();
        if (q && label.toLowerCase().includes(q)) {
          const idx = label.toLowerCase().indexOf(q);
          const before = label.slice(0, idx);
          const match = label.slice(idx, idx + q.length);
          const after = label.slice(idx + q.length);
          li.innerHTML = "";
          if (before) li.appendChild(document.createTextNode(before));
          const mark = document.createElement("mark");
          mark.className = "c-combobox__match";
          mark.textContent = match;
          li.appendChild(mark);
          if (after) li.appendChild(document.createTextNode(after));
        } else {
          li.textContent = label;
        }
        const isSelected = this.hasAttribute("multiple") && selectedVals.includes(String(item.value));
        li.setAttribute("aria-selected", String(isSelected));
        if (isSelected) li.classList.add("c-combobox__option--selected");
        list.appendChild(li);
      });
      if (this._comboboxVirtual) addSpacer(Math.max(0, filtered.length - end) * rowHeight);
      if (this._comboboxVirtual && !reset) list.scrollTop = oldScrollTop;
    }
     enhance() {
       wireCombobox(this);
       // Form sync (D-02): commit writes the input value; mirror it into the
       // form association so the host actually submits.
       if (this._internals && !this._wiredComboboxForm) {
         this._wiredComboboxForm = true;
         this._syncFormValue();
         this.addEventListener("contour:select", (e) => {
           const v = e && e.detail && (e.detail.value || e.detail.label);
           if (v != null) this.setAttribute("value", String(v));
           this._syncFormValue();
         });
       }
       if (!this._wiredComboboxClear) {
         this._wiredComboboxClear = true;
         this.addEventListener("click", (e) => {
           const btn = e.target && e.target.closest ? e.target.closest(".c-combobox__clear") : null;
           if (!btn || !this.contains(btn)) return;
           e.preventDefault();
           this.removeAttribute("value");
           const input = this.querySelector(".c-combobox__input");
           if (input) input.value = "";
           this._syncFormValue();
           this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { name: this.getAttribute("name"), value: null, checked: null } }));
         });
       }
     }
  }
define("contour-combobox", ContourCombobox);
/**
 * Field: a labelled form control wrapper. Renders an `<input>`/`<textarea>`/
 * `<select>` (or adopts an authored one), associates a label via `for`/`id`,
 * and attaches hint and error text with `aria-describedby`. Drives inline
 * validation on blur (`aria-invalid`, `is-invalid`) and keeps the form value in
 * sync via `_internals.setFormValue`. Emits `contour:input` / `contour:change`.
 */
class ContourField extends ContourBase {
    static get observed() { return ["label", "hint", "error", "placeholder", "type", "required"]; }
    static get formAssociated() { return true; }
    static get properties() { return { label: { attribute: "label" }, hint: { attribute: "hint" }, error: { attribute: "error" }, placeholder: { attribute: "placeholder" }, type: { attribute: "type" }, required: { attribute: "required", type: Boolean } }; }
    render() {
      this.classList.add("c-field");
      const label = this.getAttribute("label");
      const hint = this.getAttribute("hint");
      const error = this.getAttribute("error");
      const placeholder = this.getAttribute("placeholder") || "";
      if (label) {
        const lbl = this.ensure(".c-field__label", () => { const el = document.createElement("label"); el.className = "c-field__label"; return el; });
        lbl.textContent = label;
      } else {
        const lbl = this.querySelector(".c-field__label");
        if (lbl) lbl.remove();
      }
      const input = this.ensure("input.c-input, textarea, select", () => {
        const el = document.createElement("input");
        el.className = "c-input";
        return el;
      });
      input.type = this.getAttribute("type") || "text";
      input.placeholder = placeholder;
      if (!input.id) input.id = contourId("contour-field");
      // Associate the label with the input so the control is labelled.
      const lbl = this.querySelector(".c-field__label");
      if (lbl) { if (!input.id) input.id = contourId("contour-field"); lbl.setAttribute("for", input.id); input.setAttribute("aria-label", lbl.textContent); }
      if (hint) {
        const h = this.ensure(".c-field__hint", () => { const el = document.createElement("span"); el.className = "c-field__hint"; return el; });
        h.textContent = hint;
      } else {
        const h = this.querySelector(".c-field__hint");
        if (h) h.remove();
      }
      if (error) {
        const e = this.ensure(".c-field__error", () => { const el = document.createElement("span"); el.className = "c-field__error"; return el; });
        e.textContent = error;
      } else {
        const e = this.querySelector(".c-field__error");
        if (e) e.remove();
      }
      // ARIA: link the input to its hint and its error message (parity with the
      // shadow layer's bootstrap). The ids are generated so a screen reader does
      // not hear one message without the other.
      const hintEl = this.querySelector(".c-field__hint");
      const errEl = this.querySelector(".c-field__error");
      const describedBy = [];
      if (hintEl) { if (!hintEl.id) hintEl.id = contourId("hint"); describedBy.push(hintEl.id); }
      if (errEl) { if (!errEl.id) errEl.id = contourId("err"); describedBy.push(errEl.id); }
      if (describedBy.length) input.setAttribute("aria-describedby", describedBy.join(" "));
      if (this.hasAttribute("required")) input.setAttribute("aria-required", "true");
    }
  }
  ContourField.prototype.enhance = function() {
    if (this._wiredField) return;
    this._wiredField = true;
    const sync = () => {
      const input = this.querySelector("input, textarea, select");
      if (!input || !this._internals) return;
      this._internals.setFormValue(input.value);
    };
    this.addEventListener("input", (e) => {
      const input = this.querySelector("input, textarea, select");
      if (!input || e.target !== input) return;
      sync();
      this._emitForm("contour:input");
    });
    this.addEventListener("change", (e) => {
      const input = this.querySelector("input, textarea, select");
      if (!input || e.target !== input) return;
      sync();
      this._emitForm("contour:change");
    });
    // Inline validation (BY2-U6): on blur, reflect validity on the input via
    // aria-invalid and toggle the error/success state. The CSS already paints
    // the invalid ring (components.css aria-invalid rules); this just drives it.
    this.addEventListener("blur", (e) => {
      const input = this.querySelector("input, textarea, select");
      if (!input || e.target !== input) return;
      const valid = input.checkValidity();
      if (valid) {
        input.setAttribute("aria-invalid", "false");
        this.classList.remove("is-invalid");
        this.removeAttribute("data-invalid");
      } else {
        input.setAttribute("aria-invalid", "true");
        this.classList.add("is-invalid");
        this.setAttribute("data-invalid", "");
        // Surface the browser's validation message when no explicit error attr.
        if (!this.getAttribute("error")) {
          const msg = input.validationMessage || "Invalid value";
          let errEl = this.querySelector(".c-field__error");
          if (!errEl) {
            errEl = document.createElement("span");
            errEl.className = "c-field__error";
            this.appendChild(errEl);
          }
          errEl.textContent = msg;
          if (!errEl.id) errEl.id = contourId("err");
          input.setAttribute("aria-describedby", (input.getAttribute("aria-describedby") || "").split(" ").filter((x) => x && x !== errEl.id).concat(errEl.id).join(" "));
        }
      }
      sync();
    }, true);
    sync();
  };
  define("contour-field", ContourField);

  /**
 * Field-group: a grouped field with a shared label, optional hint and error
 * text. Sets `role="group"` and `aria-required` when required; toggles
 * `is-error` when an error is present. Child fields are labelled by the group.
 */
class ContourFieldGroup extends ContourBase {
    static get observed() { return ["label", "hint", "error", "required"]; }
    static get properties() { return { label: { attribute: "label" }, hint: { attribute: "hint" }, error: { attribute: "error" }, required: { attribute: "required", type: Boolean } }; }
    render() {
      this.classList.add("c-field-group");
      this.setAttribute("role", "group");
      const label = this.getAttribute("label");
      if (label) {
        const lbl = this.ensure(".c-field-group__label", () => { const el = document.createElement("div"); el.className = "c-field-group__label"; return el; });
        lbl.textContent = label;
      } else {
        const lbl = this.querySelector(".c-field-group__label");
        if (lbl) lbl.remove();
      }
      const hint = this.getAttribute("hint");
      if (hint) {
        const h = this.ensure(".c-field-group__hint", () => { const el = document.createElement("span"); el.className = "c-field-group__hint"; return el; });
        h.textContent = hint;
      } else {
        const h = this.querySelector(".c-field-group__hint");
        if (h) h.remove();
      }
      const error = this.getAttribute("error");
      if (error) {
        const e = this.ensure(".c-field-group__error", () => { const el = document.createElement("span"); el.className = "c-field-group__error"; return el; });
        e.textContent = error;
      } else {
        const e = this.querySelector(".c-field-group__error");
        if (e) e.remove();
      }
      if (error) this.classList.add("is-error"); else this.classList.remove("is-error");
      if (this.hasAttribute("required")) this.setAttribute("aria-required", "true");
      else this.removeAttribute("aria-required");
    }
    enhance() {
      if (this._wiredFieldGroup) return;
      this._wiredFieldGroup = true;
    }
  }
  define("contour-field-group", ContourFieldGroup);

  /**
 * Form: a form wrapper with submission state and a validation summary. Adds
 * `is-submitting` and disables the submit button while `submitting` is set.
 * On invalid submit, prevents default and renders a `role="alert"` summary
 * listing the invalid fields. Emits `contour:submit` on valid submit.
 */
class ContourForm extends ContourBase {
    static get observed() { return ["submitting", "error", "summary"]; }
    static get properties() { return { submitting: { attribute: "submitting", type: Boolean }, error: { attribute: "error" }, summary: { attribute: "summary" } }; }
    render() {
      this.classList.add("c-form");
      if (this.hasAttribute("submitting")) this.classList.add("is-submitting"); else this.classList.remove("is-submitting");
      const summaryText = this.getAttribute("summary") || this.getAttribute("error");
      let summary = this.querySelector(".c-form__summary");
      if (summaryText) {
        if (!summary) { summary = document.createElement("div"); summary.className = "c-form__summary"; summary.setAttribute("role", "alert"); this.prepend(summary); }
        summary.textContent = summaryText;
        summary.removeAttribute("hidden");
      } else if (summary) {
        summary.setAttribute("hidden", "");
      }
      const submit = this.querySelector("[type='submit'], .c-form__submit");
      if (submit) {
        if (this.hasAttribute("submitting")) submit.setAttribute("disabled", "");
        else submit.removeAttribute("disabled");
      }
    }
    enhance() {
      if (this._wiredForm) return;
      this._wiredForm = true;
      this.addEventListener("submit", (e) => {
        const form = e.target;
        if (form && typeof form.checkValidity === "function" && !form.checkValidity()) {
          e.preventDefault();
          const invalid = Array.from(form.querySelectorAll(":invalid"));
          const names = invalid.map((el) => el.getAttribute("aria-label") || el.name || el.id || "field").join(", ");
          // Update DOM directly (avoid setAttribute on observed attr -> re-entrancy).
          let summary = this.querySelector(".c-form__summary");
          if (!summary) { summary = document.createElement("div"); summary.className = "c-form__summary"; summary.setAttribute("role", "alert"); this.prepend(summary); }
          summary.textContent = "Please fix: " + (names || "invalid fields");
          summary.removeAttribute("hidden");
          return;
        }
        // submitting state via class + button, not attribute.
        this.classList.add("is-submitting");
        const submit = this.querySelector("[type='submit'], .c-form__submit");
        if (submit) submit.setAttribute("disabled", "");
        this.dispatchEvent(new CustomEvent("contour:submit", { bubbles: true, composed: true, detail: { submitting: true } }));
      });
    }
  }
  define("contour-form", ContourForm);

  /**
 * Range: a native `<input type=range>` wrapper with optional dual-handle range
 * mode (`range`, `low`, `high`) and a sparkline canvas (`sparkline`). Form
 * associated; emits `contour:input` / `contour:change` with the current value
 * (or `{low, high}` in range mode). Renders a `--fill` custom property for the
 * filled track.
 */
class ContourRange extends ContourBase {
    static get observed() { return ["min", "max", "value", "low", "high", "range", "sparkline", "label", "disabled", "error", "help"]; }
    static get formAssociated() { return true; }
    static get properties() { return { min: { attribute: "min" }, max: { attribute: "max" }, value: { attribute: "value" }, label: { attribute: "label" }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
     render() {
       this.classList.add("c-range");
       const min = this.getAttribute("min") || "0";
       const max = this.getAttribute("max") || "100";
       const rangeMode = this.hasAttribute("range") || this.hasAttribute("low") || this.hasAttribute("high");
       // sparkline canvas
       const spark = this.getAttribute("sparkline");
       if (spark) {
         let canvas = this.querySelector(".c-range__sparkline");
         if (!canvas) { canvas = document.createElement("canvas"); canvas.className = "c-range__sparkline"; canvas.setAttribute("part", "sparkline-canvas"); this.insertBefore(canvas, this.firstChild); }
       } else {
         const c = this.querySelector(".c-range__sparkline");
         if (c) c.remove();
       }
       if (rangeMode) {
         // remove single input if present
         const single = this.querySelector("input.c-range:not(.c-range__low):not(.c-range__high)");
         // keep generic input? We'll use two named inputs
         let lowInput = this.querySelector("input.c-range__low");
         if (!lowInput) { lowInput = document.createElement("input"); lowInput.type = "range"; lowInput.className = "c-range c-range__low"; this.appendChild(lowInput); }
         let highInput = this.querySelector("input.c-range__high");
         if (!highInput) { highInput = document.createElement("input"); highInput.type = "range"; highInput.className = "c-range c-range__high"; this.appendChild(highInput); }
         lowInput.min = min; lowInput.max = max;
         highInput.min = min; highInput.max = max;
         const lowVal = this.getAttribute("low") || min;
         const highVal = this.getAttribute("high") || max;
         if (this._rangeUserLow !== null && this._rangeAttrLowAtDirty === (this.getAttribute("low") || min)) lowInput.value = this._rangeUserLow;
         else { lowInput.value = lowVal; this._rangeUserLow = null; this._rangeAttrLowAtDirty = null; }
         if (this._rangeUserHigh !== null && this._rangeAttrHighAtDirty === (this.getAttribute("high") || max)) highInput.value = this._rangeUserHigh;
         else { highInput.value = highVal; this._rangeUserHigh = null; this._rangeAttrHighAtDirty = null; }
         const label = this.getAttribute("label");
         if (label) { lowInput.setAttribute("aria-label", label + " low"); highInput.setAttribute("aria-label", label + " high"); }
       } else {
         // remove dual inputs
         Array.from(this.querySelectorAll("input.c-range__low, input.c-range__high")).forEach((n) => n.remove());
         const input = this.ensure("input.c-range", () => { const el = document.createElement("input"); el.type = "range"; return el; });
         // ensure class
         input.className = "c-range";
         input.type = "range";
         input.min = min;
         input.max = max;
         const attrVal = this.getAttribute("value") || "50";
         if (this._rangeUserValue !== null && this._rangeAttrAtDirty === (this.getAttribute("value") || "50")) {
           input.value = this._rangeUserValue;
         } else {
           input.value = attrVal;
           this._rangeUserValue = null;
           this._rangeAttrAtDirty = null;
         }
         const label = this.getAttribute("label");
         if (label) input.setAttribute("aria-label", label);
         else if (!input.hasAttribute("aria-label")) input.setAttribute("aria-label", "Range");
         const updateFill = () => {
           const mn = Number(input.min) || 0;
           const mx = Number(input.max) || 100;
           const val = Number(input.value) || 0;
           const pct = mx > mn ? ((val - mn) / (mx - mn)) * 100 : 0;
           input.style.setProperty("--fill", pct + "%");
         };
         updateFill();
         if (!input._fillWired) {
           input._fillWired = true;
           input.addEventListener("input", updateFill);
         }
       }
     }
  }
  // patch enhance onto ContourRange
  const _origRangeRender = ContourRange.prototype.render;
   ContourRange.prototype.attributeChangedCallback = function(name, oldValue, newValue) {
     if (name === "value") { this._rangeUserValue = null; this._rangeAttrAtDirty = null; }
     if (name === "low") { this._rangeUserLow = null; this._rangeAttrLowAtDirty = null; }
     if (name === "high") { this._rangeUserHigh = null; this._rangeAttrHighAtDirty = null; }
     return ContourBase.prototype.attributeChangedCallback.call(this, name, oldValue, newValue);
   };
   ContourRange.prototype.enhance = function() {
     if (this._wiredRange) return;
     this._wiredRange = true;
     const sync = () => {
       const low = this.querySelector("input.c-range__low");
       const high = this.querySelector("input.c-range__high");
       const single = this.querySelector("input.c-range:not(.c-range__low):not(.c-range__high)");
       if (this._internals) {
         if (low && high) this._internals.setFormValue(low.value + "," + high.value);
         else if (single) this._internals.setFormValue(single.value);
       }
     };
     this.addEventListener("input", (e) => {
       const low = this.querySelector("input.c-range__low");
       const high = this.querySelector("input.c-range__high");
       const single = this.querySelector("input.c-range:not(.c-range__low):not(.c-range__high)");
       if (low && high && (e.target === low || e.target === high)) {
         this._rangeUserLow = low.value;
         this._rangeUserHigh = high.value;
         this._rangeAttrLowAtDirty = this.getAttribute("low") || (this.getAttribute("min") || "0");
         this._rangeAttrHighAtDirty = this.getAttribute("high") || (this.getAttribute("max") || "100");
         sync();
         this._emitForm("contour:input", { low: Number(low.value), high: Number(high.value) });
         this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { low: Number(low.value), high: Number(high.value) } }));
       } else if (single && e.target === single) {
         this._rangeUserValue = single.value;
         this._rangeAttrAtDirty = this.getAttribute("value") || "50";
         sync();
         this._emitForm("contour:input");
       }
     });
     this.addEventListener("change", (e) => {
       const low = this.querySelector("input.c-range__low");
       const high = this.querySelector("input.c-range__high");
       const single = this.querySelector("input.c-range:not(.c-range__low):not(.c-range__high)");
       if (low && high && (e.target === low || e.target === high)) {
         sync();
         this._emitForm("contour:change", { low: Number(low.value), high: Number(high.value) });
         this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { low: Number(low.value), high: Number(high.value) } }));
       } else if (single && e.target === single) {
         sync();
         this._emitForm("contour:change");
       }
     });
     sync();
   };
  define("contour-range", ContourRange);
/**
 * Switch: a `role="switch"` checkbox control with label, required, disabled,
 * error and help states. Form associated; emits `contour:change` on toggle.
 * Renders a `c-switch__track` element after the input for the sheet's track
 * styling.
 */
class ContourSwitch extends ContourBase {
    static get observed() { return ["label", "required", "checked", "disabled", "error", "help"]; }
    static get properties() { return { label: { attribute: "label" }, required: { attribute: "required", type: Boolean }, checked: { attribute: "checked", type: Boolean }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
    static get formAssociated() { return true; }
    render() {
      this.classList.add("c-switch");
      const label = this.getAttribute("label");
      // The guide's control is `label.c-switch` wrapping `input.c-switch__input`
      // and a bare span of text; the sheet paints the track on the input itself.
       const input = this.ensure("input.c-switch__input", () => { const el = document.createElement("input"); el.className = "c-switch__input"; el.type = "checkbox"; return el; });
       input.checked = this.hasAttribute("checked");
       input.setAttribute("role", "switch");
      input.setAttribute("aria-checked", String(input.checked));
      this._setCustomState("data-checked", input.checked);
      if (this.hasAttribute("disabled")) { input.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
      else { input.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-switch__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-switch__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-switch__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
      // Ensure track element follows the input (CSS: input + track).
      if (!input.nextElementSibling || !input.nextElementSibling.classList.contains("c-switch__track")) {
        const track = document.createElement("span");
        track.className = "c-switch__track";
        track.setAttribute("aria-hidden", "true");
        if (input.nextSibling) this.insertBefore(track, input.nextSibling);
        else this.appendChild(track);
      }
      if (label) {
        input.setAttribute("aria-label", label);
        const txt = this.querySelector(":scope > span:not([class]):not(.c-switch__track)") || (() => { const el = document.createElement("span"); this.appendChild(el); return el; })();
        txt.textContent = label;
      }
    }
    enhance() {
      const input = this.querySelector("input");
      if (input && this._internals) {
        input.setAttribute("aria-checked", String(input.checked));
        this._setCustomState("data-checked", input.checked);
        this._internals.setFormValue(input.checked ? (input.value || "on") : null);
        this._syncValidity(this.hasAttribute("required") && !input.checked);
      }
      if (this._wiredSwitch) return;
      this._wiredSwitch = true;
      this.addEventListener("change", (e) => {
        const inp = this.querySelector("input");
        if (!inp || e.target !== inp || !this._internals) return;
        inp.setAttribute("aria-checked", String(inp.checked));
        this._setCustomState("data-checked", inp.checked);
        this._internals.setFormValue(inp.checked ? (inp.value || "on") : null);
        this._emitForm("contour:change");
        this._syncValidity(this.hasAttribute("required") && !inp.checked);
      });
    }
  }
  define("contour-switch", ContourSwitch);
/**
 * Check: a checkbox (or `type="radio"` when `type` is set) with label, name,
 * value, required, checked, disabled, error and help states. Renders a
 * `c-check__box` element after the input. Form associated; emits
 * `contour:change` on toggle.
 */
class ContourCheck extends ContourBase {
    static get observed() { return ["label", "name", "value", "required", "type", "checked", "disabled", "error", "help"]; }
    static get properties() { return { label: { attribute: "label" }, name: { attribute: "name" }, value: { attribute: "value" }, required: { attribute: "required", type: Boolean }, type: { attribute: "type" }, checked: { attribute: "checked", type: Boolean }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
    static get formAssociated() { return true; }
    render() {
      this.classList.add("c-check");
      const label = this.getAttribute("label");
       const input = this.ensure("input.c-check__input", () => { const el = document.createElement("input"); el.className = "c-check__input"; el.type = this.getAttribute("type") === "radio" ? "radio" : "checkbox"; return el; });
       input.checked = this.hasAttribute("checked");
      // Ensure box element follows the input (CSS: input + box).
      if (!input.nextElementSibling || !input.nextElementSibling.classList.contains("c-check__box")) {
        const box = document.createElement("span");
        box.className = "c-check__box";
        box.setAttribute("aria-hidden", "true");
        if (input.nextSibling) this.insertBefore(box, input.nextSibling);
        else this.appendChild(box);
      }
      if (label) {
        input.setAttribute("aria-label", label);
        const txt = this.querySelector(":scope > span:not([class]):not(.c-check__box)") || (() => { const el = document.createElement("span"); this.appendChild(el); return el; })();
        txt.textContent = label;
      }
      if (this.hasAttribute("name")) input.name = this.getAttribute("name");
      if (this.hasAttribute("value")) input.value = this.getAttribute("value");
      if (this.hasAttribute("disabled")) { input.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
      else { input.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-check__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-check__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-check__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
    }
    enhance() {
      const input = this.querySelector("input");
      if (input && this._internals) {
        this._setCustomState("data-checked", input.checked);
        this._internals.setFormValue(input.checked ? (input.value || "on") : null);
        this._syncValidity(this.hasAttribute("required") && !input.checked);
      }
      if (this._wiredCheck) return;
      this._wiredCheck = true;
      this.addEventListener("change", (e) => {
        const inp = this.querySelector("input");
        if (!inp || e.target !== inp || !this._internals) return;
        this._setCustomState("data-checked", inp.checked);
        this._internals.setFormValue(inp.checked ? (inp.value || "on") : null);
        this._emitForm("contour:change");
        this._syncValidity(this.hasAttribute("required") && !inp.checked);
      });
    }
  }
  define("contour-check", ContourCheck);
/**
 * Radio: a radio button with label, name, value, required, checked, disabled,
 * error and help states. Form associated; unchecking clears the stale FormData
 * entry. Emits `contour:change` on toggle.
 */
class ContourRadio extends ContourBase {
    static get observed() { return ["label", "name", "value", "required", "checked", "disabled", "error", "help"]; }
    static get properties() { return { label: { attribute: "label" }, name: { attribute: "name" }, value: { attribute: "value" }, required: { attribute: "required", type: Boolean }, checked: { attribute: "checked", type: Boolean }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
    static get formAssociated() { return true; }
    render() {
      this.classList.add("c-radio");
      const label = this.getAttribute("label");
       const input = this.ensure("input.c-radio__input", () => { const el = document.createElement("input"); el.className = "c-radio__input"; el.type = "radio"; return el; });
       input.checked = this.hasAttribute("checked");
      if (this.hasAttribute("name")) input.name = this.getAttribute("name");
      if (this.hasAttribute("value")) input.value = this.getAttribute("value");
      if (this.hasAttribute("disabled")) { input.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
      else { input.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-radio__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-radio__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-radio__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
      if (label) {
        input.setAttribute("aria-label", label);
        const txt = this.querySelector(":scope > span:not([class])") || (() => { const el = document.createElement("span"); this.appendChild(el); return el; })();
        txt.textContent = label;
      }
    }
    enhance() {
      const input = this.querySelector("input");
      if (input && this._internals) {
        this._setCustomState("data-checked", input.checked);
        this._internals.setFormValue(input.checked ? (input.value || "on") : null);
        this._syncValidity(this.hasAttribute("required") && !input.checked);
      }
      if (this._wiredRadio) return;
      this._wiredRadio = true;
      this.addEventListener("change", (e) => {
        const inp = this.querySelector("input");
        if (!inp || e.target !== inp || !this._internals) return;
        // Unchecking (group movement) must clear the stale FormData entry,
        // not leave it behind beside the new selection.
        this._setCustomState("data-checked", inp.checked);
        this._internals.setFormValue(inp.checked ? (inp.value || "on") : null);
        this._emitForm("contour:change");
        this._syncValidity(this.hasAttribute("required") && !inp.checked);
      });
    }
  }
  define("contour-radio", ContourRadio);
  /**
 * Select: a native `<select>` wrapper populated from a JSON `options` attribute
 * (with optgroup support) or an authored `<select>`. Supports label, placeholder,
 * required, disabled, error and help. Form associated; emits `contour:change`.
 */
class ContourSelect extends ContourBase {
    static get observed() { return ["options", "required", "label", "placeholder", "disabled", "error", "help"]; }
    static get properties() { return { options: { attribute: "options" }, required: { attribute: "required", type: Boolean }, label: { attribute: "label" }, placeholder: { attribute: "placeholder" }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
    static get formAssociated() { return true; }
    render() {
      this.classList.add("c-select");
      const options = this.getAttribute("options");
      // Slot composition: an authored <select> wins over the JSON attribute.
      const generated = new Set(this._contourGenerated || []);
      const authored = Array.from(this.children).filter((n) => !generated.has(n));
      if (options && !authored.length) {
        try {
          const parsed = JSON.parse(options);
           const select = this.ensure("select.c-select", () => { const el = document.createElement("select"); el.className = "c-select"; return el; });
           select.innerHTML = "";
           const label = this.getAttribute("label");
           if (label) {
             select.setAttribute("aria-label", label);
           }
           const placeholder = this.getAttribute("placeholder");
           if (placeholder) {
             const ph = document.createElement("option");
             ph.value = "";
             ph.textContent = placeholder;
             ph.disabled = true;
             ph.selected = true;
             select.appendChild(ph);
           }
           // Group support.
           const groups = {};
           parsed.forEach((opt) => {
             const g = (typeof opt === "object" && opt !== null) ? opt.group : null;
             if (g) {
               if (!groups[g]) { groups[g] = document.createElement("optgroup"); groups[g].label = g; select.appendChild(groups[g]); }
               const option = document.createElement("option");
               option.value = typeof opt === "string" ? opt : opt.value;
               option.textContent = typeof opt === "string" ? opt : opt.label;
               groups[g].appendChild(option);
             } else {
               const option = document.createElement("option");
               option.value = typeof opt === "string" ? opt : opt.value;
               option.textContent = typeof opt === "string" ? opt : opt.label;
               select.appendChild(option);
             }
           });
          if (select.parentNode !== this) this.appendChild(select);
          this.classList.remove("c-select");
          select.classList.add("c-select");
        } catch (e) { /* keep existing */ }
      }
      // Ensure authored select gets c-select styling.
      const authoredSel = this.querySelector("select");
      if (authoredSel && !authoredSel.classList.contains("c-select")) {
        authoredSel.classList.add("c-select");
        this.classList.remove("c-select");
      }
      // Disabled / error / help contract (applies to authored or generated select).
      const sel = this.querySelector("select");
      if (sel) {
        if (this.hasAttribute("disabled")) { sel.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
        else { sel.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      }
      // Label (applies to both JSON and authored options).
      const label = this.getAttribute("label");
      if (label) {
        let lbl = this.querySelector("label.c-select__label");
        if (!lbl) { lbl = document.createElement("label"); lbl.className = "c-select__label"; this.insertBefore(lbl, sel || this.firstChild); }
        lbl.textContent = label;
        if (sel) sel.setAttribute("aria-label", label);
      }
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-select__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-select__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-select__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
    }
    enhance() {
      const select = this.querySelector("select");
      if (select && this._internals) {
        this._internals.setFormValue(select.value);
        this._syncValidity(this.hasAttribute("required") && !select.value);
      }
      if (this._wiredSelect) return;
      this._wiredSelect = true;
      this.addEventListener("change", (e) => {
        const sel = this.querySelector("select");
        if (!sel || e.target !== sel || !this._internals) return;
        this._internals.setFormValue(sel.value);
        this._emitForm("contour:change");
        this._syncValidity(this.hasAttribute("required") && !sel.value);
      });
    }
  }
  define("contour-select", ContourSelect);
/**
 * Version: a `<select>` of version options from a JSON `options` attribute,
 * with `selected` support per option. Form associated; emits `contour:change`.
 */
class ContourVersion extends ContourBase {
    static get observed() { return ["options"]; }
    static get formAssociated() { return true; }
    static get properties() { return { options: { attribute: "options" } }; }
    render() {
      this.classList.add("c-version");
      const options = this.getAttribute("options");
      const generated = new Set(this._contourGenerated || []);
      const authored = Array.from(this.children).filter((n) => !generated.has(n));
      if (options && !authored.length) {
        try {
          const parsed = JSON.parse(options);
           const select = this.ensure("select.c-version", () => { const el = document.createElement("select"); el.className = "c-version"; return el; });
           select.innerHTML = "";
           if (!select.hasAttribute("aria-label")) select.setAttribute("aria-label", "Version");
          parsed.forEach((opt) => {
            const option = document.createElement("option");
            if (typeof opt === "string") { option.value = opt; option.textContent = opt; }
            else { option.value = opt.value || opt.label; option.textContent = opt.label || opt.value; if (opt.selected) option.selected = true; }
            select.appendChild(option);
          });
          if (select.parentNode !== this) this.appendChild(select);
          this.classList.remove("c-version");
          select.classList.add("c-version");
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredVersion) return;
      this._wiredVersion = true;
      const sync = () => {
        const select = this.querySelector("select");
        if (!select || !this._internals) return;
        this._internals.setFormValue(select.value);
      };
      this.addEventListener("change", (e) => {
        const select = this.querySelector("select");
        if (!select || e.target !== select) return;
        sync();
        this._emitForm("contour:change");
      });
      sync();
    }
  }
  define("contour-version", ContourVersion);
/**
 * Textarea: a `<textarea>` wrapper with placeholder, required, disabled, error
 * and help states. Form associated; emits `contour:input` / `contour:change`.
 */
class ContourTextarea extends ContourBase {
    static get observed() { return ["placeholder", "required", "disabled", "error", "help"]; }
    static get properties() { return { placeholder: { attribute: "placeholder" }, required: { attribute: "required", type: Boolean }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
    static get formAssociated() { return true; }
    render() {
      const ta = this.ensure("textarea", () => { const el = document.createElement("textarea"); el.className = "c-textarea"; return el; });
      ta.className = "c-textarea";
      ta.placeholder = this.getAttribute("placeholder") || "";
      if (this.hasAttribute("required")) ta.setAttribute("required", "");
      else ta.removeAttribute("required");
      if (this.hasAttribute("disabled")) { ta.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
      else { ta.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-textarea__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-textarea__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-textarea__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
    }
    enhance() {
      const ta = this.querySelector("textarea");
      if (ta && this._internals) {
        this._internals.setFormValue(ta.value);
        this._syncValidity(this.hasAttribute("required") && !ta.value.trim());
      }
      if (this._wiredTextarea) return;
      this._wiredTextarea = true;
      this.addEventListener("input", (e) => {
        const t = this.querySelector("textarea");
        if (!t || e.target !== t || !this._internals) return;
        this._internals.setFormValue(t.value);
        this._emitForm("contour:input");
        this._syncValidity(this.hasAttribute("required") && !t.value.trim());
      });
      this.addEventListener("change", (e) => {
        const t = this.querySelector("textarea");
        if (!t || e.target !== t || !this._internals) return;
        this._internals.setFormValue(t.value);
        this._emitForm("contour:change");
        this._syncValidity(this.hasAttribute("required") && !t.value.trim());
      });
    }
  }
  define("contour-textarea", ContourTextarea);
/**
 * Input: an `<input>` wrapper with type, placeholder, required, value, disabled,
 * error and help states. Form associated; emits `contour:input` / `contour:change`.
 */
class ContourInputFull extends ContourBase {
    static get observed() { return ["type", "placeholder", "required", "value", "disabled", "error", "help", "label"]; }
    static get properties() { return { type: { attribute: "type" }, placeholder: { attribute: "placeholder" }, required: { attribute: "required", type: Boolean }, value: { attribute: "value" }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" }, label: { attribute: "label" } }; }
    static get formAssociated() { return true; }
    render() {
      this.classList.add("c-input");
      const input = this.ensure("input", () => { const el = document.createElement("input"); el.className = "c-input"; return el; });
      input.className = "c-input";
      input.type = this.getAttribute("type") || "text";
       input.placeholder = this.getAttribute("placeholder") || "";
       const label = this.getAttribute("label");
       if (label) input.setAttribute("aria-label", label);
       // else: keep any aria-label set by an ancestor (e.g. contour-field).
      if (this.hasAttribute("value")) input.value = this.getAttribute("value");
      if (this.hasAttribute("required")) input.setAttribute("required", "");
      else input.removeAttribute("required");
      if (this.hasAttribute("disabled")) { input.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
      else { input.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      // Error/help text
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-input__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-input__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-input__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
    }
    enhance() {
      const input = this.querySelector("input");
      if (input && this._internals) {
        this._internals.setFormValue(input.value);
        this._syncValidity(this.hasAttribute("required") && !input.value.trim());
      }
      if (this._wiredInput) return;
      this._wiredInput = true;
      this.addEventListener("input", (e) => {
        const inp = this.querySelector("input");
        if (!inp || e.target !== inp || !this._internals) return;
        this._internals.setFormValue(inp.value);
        this._emitForm("contour:input");
        this._syncValidity(this.hasAttribute("required") && !inp.value.trim());
      });
      this.addEventListener("change", (e) => {
        const inp = this.querySelector("input");
        if (!inp || e.target !== inp || !this._internals) return;
        this._internals.setFormValue(inp.value);
        this._emitForm("contour:change");
        this._syncValidity(this.hasAttribute("required") && !inp.value.trim());
      });
    }
  }
  define("contour-input", ContourInputFull);
/**
 * InputGroup: a text input with an optional search icon, a clear (×) affordance
 * and a submit (→) affordance. Attributes: `label`, `placeholder`, `clearable`,
 * `submit`. Emits `contour:change` (bubbles, composed) with `{ value: "" }` on
 * clear.
 */
class ContourInputGroup extends ContourBase {
    static get observed() { return ["label", "placeholder", "clearable", "submit"]; }
    static get properties() { return { label: { attribute: "label" }, placeholder: { attribute: "placeholder" }, clearable: { attribute: "clearable", type: Boolean }, submit: { attribute: "submit", type: Boolean } }; }
    render() {
      this.classList.add("c-input-group");
      const icon = this.ensure("svg", () => { const el = document.createElementNS("http://www.w3.org/2000/svg", "svg"); el.setAttribute("aria-hidden", "true"); const use = document.createElementNS("http://www.w3.org/2000/svg", "use"); use.setAttribute("href", "#i-search"); el.appendChild(use); return el; });
      const input = this.ensure("input.c-input", () => { const el = document.createElement("input"); el.className = "c-input"; el.type = "text"; return el; });
      input.placeholder = this.getAttribute("placeholder") || this.getAttribute("label") || "";
      // Clear affordance.
      const oldClear = this.querySelector(".c-input-group__clear");
      if (oldClear) oldClear.remove();
      if (this.hasAttribute("clearable")) {
        const btn = document.createElement("button");
        btn.className = "c-input-group__clear";
        btn.type = "button";
        btn.setAttribute("aria-label", "Clear");
        btn.textContent = "×";
        this.appendChild(btn);
      }
      // Submit affordance.
      const oldSubmit = this.querySelector(".c-input-group__submit");
      if (oldSubmit) oldSubmit.remove();
      if (this.hasAttribute("submit")) {
        const btn = document.createElement("button");
        btn.className = "c-input-group__submit";
        btn.type = "submit";
        btn.setAttribute("aria-label", "Submit");
        btn.textContent = "→";
        this.appendChild(btn);
      }
    }
    enhance() {
      if (this._wiredInputGroup) return;
      this._wiredInputGroup = true;
      this.addEventListener("click", (e) => {
        const clear = e.target && e.target.closest ? e.target.closest(".c-input-group__clear") : null;
        if (clear && this.contains(clear)) {
          e.preventDefault();
          const input = this.querySelector("input.c-input");
          if (input) { input.value = ""; input.focus(); }
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: "" } }));
        }
      });
    }
  }
  define("contour-input-group", ContourInputGroup);
/**
 * RadioList: a `role="radiogroup"` of radio options from a JSON `items`
 * attribute (or remote `src`). Supports roving tabindex, Home/End navigation,
 * RTL, empty/loading/error states, and `formResetCallback` that re-renders from
 * the authored `items` payload. Form associated; emits `contour:change`.
 */
class ContourRadioList extends ContourBase {
    static get observed() { return ["items", "name", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, name: { attribute: "name" }, src: { attribute: "src" } }; }
    static get formAssociated() { return true; }
    render() {
      this.classList.add("c-radio-list");
      this.setAttribute("role", "radiogroup");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", this.getAttribute("name") || "Options");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "radio-list")) return;
       const items = remoteData(this, "items");
       Array.from(this.querySelectorAll("label.c-radio")).forEach((l) => l.remove());
       if (items) {
         try {
           const parsed = JSON.parse(items);
           const groupName = this.getAttribute("name") || contourId("radio-list");
           parsed.forEach((it) => {
             const lbl = document.createElement("label");
             lbl.className = "c-radio";
             const input = document.createElement("input");
             input.type = "radio";
             input.className = "c-radio__input";
             input.name = groupName;
            input.tabIndex = -1;
            if (typeof it === "string") { input.value = it; lbl.appendChild(input); lbl.appendChild(document.createTextNode(" " + it)); }
            else { input.value = it.value || it.label; if (it.checked) input.checked = true; lbl.appendChild(input); const span = document.createElement("span"); span.textContent = it.label || it.value; lbl.appendChild(span); }
            this.appendChild(lbl);
          });
          // Roving tabindex: only the checked item (or the first) is in the tab
          // order, exactly like a native radiogroup.
          const radios = Array.from(this.querySelectorAll("input.c-radio__input"));
          const checked = radios.find((r) => r.checked) || radios[0];
          if (checked) checked.tabIndex = 0;
        } catch (e) { /* keep existing */ }
      } else {
        renderEmpty(this, "radio-list");
      }
    }
    enhance() {
      const sync = () => {
        if (!this._internals) return;
        const checked = this.querySelector("input.c-radio__input:checked");
        this._internals.setFormValue(checked ? checked.value : null);
      };
      sync();
      if (this._wiredRadioList) return;
      this._wiredRadioList = true;
      // Form life + group semantics, delegated on the host (rule 12): the
      // inputs are rebuilt on every render, so node-bound listeners would die.
      this.addEventListener("change", (e) => {
        const input = e.target && e.target.closest ? e.target.closest("input.c-radio__input") : null;
        if (!input || !this.contains(input)) return;
        sync();
        this._emitForm("contour:change");
      });
      this.addEventListener("keydown", (e) => {
        const radios = Array.from(this.querySelectorAll("input.c-radio__input"));
        if (!radios.length) return;
        const idx = radios.indexOf(e.target);
        if (idx === -1) return;
        const rtl = (this.getAttribute("dir") || document.documentElement.getAttribute("dir") || "").toLowerCase() === "rtl";
        let next = -1;
        if (e.key === "ArrowDown") next = (idx + 1) % radios.length;
        else if (e.key === "ArrowUp") next = (idx - 1 + radios.length) % radios.length;
        else if (e.key === "ArrowRight") next = rtl ? (idx - 1 + radios.length) % radios.length : (idx + 1) % radios.length;
        else if (e.key === "ArrowLeft") next = rtl ? (idx + 1) % radios.length : (idx - 1 + radios.length) % radios.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = radios.length - 1;
        else return;
        e.preventDefault();
        const before = radios.find((r) => r.checked);
        for (const r of radios) r.tabIndex = -1;
        radios[next].tabIndex = 0;
        radios[next].checked = true;
        radios[next].focus();
        sync();
        // Native radio groups fire change when an arrow moves the selection;
        // wrap-around onto the same radio is not a change.
        if (before !== radios[next]) this._emitForm("contour:change");
      });
    }
    formResetCallback() {
      // The authored default lives in the `items` payload (`it.checked`), not
      // in checked attributes on generated radios, so re-render from the data
      // rather than blanking every selection like the generic base reset.
      if (this._contourAuthored) this.requestRender();
    }
  }
define("contour-radio-list", ContourRadioList);
