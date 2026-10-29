import { ContourBase, define, contourId } from './core.mjs';
import { wireCombobox } from './behaviours.mjs';
import { loadRemote, remoteData, renderStates, renderEmpty, wireStates } from './states.mjs';
class ContourCombobox extends ContourBase {
    static get observed() { return ["options", "placeholder", "label", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "empty", "skeleton"]; }
    static get formAssociated() { return true; }
    static get properties() { return { options: { attribute: "options" }, placeholder: { attribute: "placeholder" }, label: { attribute: "label" } }; }
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
          const list = this.ensure(".c-combobox__list", () => { const el = document.createElement("ul"); el.className = "c-combobox__list"; el.setAttribute("hidden", ""); return el; });
          list.innerHTML = "";
          list.setAttribute("hidden", "");
          parsed.forEach((opt) => {
            const li = document.createElement("li");
            li.className = "c-combobox__option";
            li.textContent = typeof opt === "string" ? opt : opt.label;
            list.appendChild(li);
          });
        } catch (e) { /* keep existing */ }
      } else if (!authored.length && !options) {
        renderEmpty(this, "combobox");
      }
    }
     enhance() {
       wireCombobox(this);
       // Form sync (D-02): commit writes the input value; mirror it into the
       // form association so the host actually submits.
       if (this._internals && !this._wiredComboboxForm) {
         this._wiredComboboxForm = true;
         this._syncFormValue();
         this.addEventListener("contour:select", () => { this._syncFormValue(); });
       }
     }
  }
define("contour-combobox", ContourCombobox);
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
      if (lbl) { if (!input.id) input.id = contourId("contour-field"); lbl.setAttribute("for", input.id); }
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
        input.removeAttribute("aria-invalid");
        input.setAttribute("aria-invalid", "false");
      } else {
        input.setAttribute("aria-invalid", "true");
      }
      sync();
    }, true);
    sync();
  };
  define("contour-field", ContourField);
  class ContourRange extends ContourBase {
    static get observed() { return ["min", "max", "value", "label"]; }
    static get formAssociated() { return true; }
    static get properties() { return { min: { attribute: "min" }, max: { attribute: "max" }, value: { attribute: "value" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-range");
      const input = this.ensure("input", () => { const el = document.createElement("input"); el.type = "range"; return el; });
      input.type = "range";
      input.className = "c-range";
      input.min = this.getAttribute("min") || "0";
      input.max = this.getAttribute("max") || "100";
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
      // Fill the track to the left of the thumb.
      const updateFill = () => {
        const min = Number(input.min) || 0;
        const max = Number(input.max) || 100;
        const val = Number(input.value) || 0;
        const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
        input.style.setProperty("--fill", pct + "%");
      };
      updateFill();
      if (!input._fillWired) {
        input._fillWired = true;
        input.addEventListener("input", updateFill);
      }
    }
  }
  // patch enhance onto ContourRange
  const _origRangeRender = ContourRange.prototype.render;
  ContourRange.prototype.attributeChangedCallback = function(name, oldValue, newValue) {
    if (name === "value") { this._rangeUserValue = null; this._rangeAttrAtDirty = null; }
    return ContourBase.prototype.attributeChangedCallback.call(this, name, oldValue, newValue);
  };
  ContourRange.prototype.enhance = function() {
    if (this._wiredRange) return;
    this._wiredRange = true;
    const sync = () => {
      const input = this.querySelector("input");
      if (!input || !this._internals) return;
      this._internals.setFormValue(input.value);
    };
    this.addEventListener("input", (e) => {
      const input = this.querySelector("input");
      if (!input || e.target !== input) return;
      this._rangeUserValue = input.value;
      this._rangeAttrAtDirty = this.getAttribute("value") || "50";
      sync();
      this._emitForm("contour:input");
    });
    this.addEventListener("change", (e) => {
      const input = this.querySelector("input");
      if (!input || e.target !== input) return;
      sync();
      this._emitForm("contour:change");
    });
    sync();
  };
  define("contour-range", ContourRange);
class ContourSwitch extends ContourBase {
    static get observed() { return ["label", "required", "checked"]; }
    static get properties() { return { label: { attribute: "label" }, required: { attribute: "required", type: Boolean }, checked: { attribute: "checked", type: Boolean } }; }
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
class ContourCheck extends ContourBase {
    static get observed() { return ["label", "name", "value", "required", "type", "checked"]; }
    static get properties() { return { label: { attribute: "label" }, name: { attribute: "name" }, value: { attribute: "value" }, required: { attribute: "required", type: Boolean }, type: { attribute: "type" }, checked: { attribute: "checked", type: Boolean } }; }
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
class ContourRadio extends ContourBase {
    static get observed() { return ["label", "name", "value", "required", "checked"]; }
    static get properties() { return { label: { attribute: "label" }, name: { attribute: "name" }, value: { attribute: "value" }, required: { attribute: "required", type: Boolean }, checked: { attribute: "checked", type: Boolean } }; }
    static get formAssociated() { return true; }
    render() {
      this.classList.add("c-radio");
      const label = this.getAttribute("label");
       const input = this.ensure("input.c-radio__input", () => { const el = document.createElement("input"); el.className = "c-radio__input"; el.type = "radio"; return el; });
       input.checked = this.hasAttribute("checked");
      if (this.hasAttribute("name")) input.name = this.getAttribute("name");
      if (this.hasAttribute("value")) input.value = this.getAttribute("value");
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
  class ContourSelect extends ContourBase {
    static get observed() { return ["options", "required", "label"]; }
    static get properties() { return { options: { attribute: "options" }, required: { attribute: "required", type: Boolean }, label: { attribute: "label" } }; }
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
           if (label) select.setAttribute("aria-label", label);
           else if (!select.hasAttribute("aria-label")) select.setAttribute("aria-label", "Select");
          parsed.forEach((opt) => {
            const option = document.createElement("option");
            option.value = typeof opt === "string" ? opt : opt.value;
            option.textContent = typeof opt === "string" ? opt : opt.label;
            select.appendChild(option);
          });
          if (select.parentNode !== this) this.appendChild(select);
          this.classList.remove("c-select");
          select.classList.add("c-select");
        } catch (e) { /* keep existing */ }
      }
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
class ContourTextarea extends ContourBase {
    static get observed() { return ["placeholder", "required"]; }
    static get properties() { return { placeholder: { attribute: "placeholder" }, required: { attribute: "required", type: Boolean } }; }
    static get formAssociated() { return true; }
    render() {
      this.classList.add("c-textarea");
      const ta = this.ensure("textarea", () => { const el = document.createElement("textarea"); el.className = "c-textarea"; return el; });
      ta.className = "c-textarea";
      ta.placeholder = this.getAttribute("placeholder") || "";
      if (this.hasAttribute("required")) ta.setAttribute("required", "");
      else ta.removeAttribute("required");
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
class ContourInputFull extends ContourBase {
    static get observed() { return ["type", "placeholder", "required", "value"]; }
    static get properties() { return { type: { attribute: "type" }, placeholder: { attribute: "placeholder" }, required: { attribute: "required", type: Boolean }, value: { attribute: "value" } }; }
    static get formAssociated() { return true; }
    render() {
      this.classList.add("c-input");
      const input = this.ensure("input", () => { const el = document.createElement("input"); el.className = "c-input"; return el; });
      input.className = "c-input";
      input.type = this.getAttribute("type") || "text";
      input.placeholder = this.getAttribute("placeholder") || "";
      if (this.hasAttribute("value")) input.value = this.getAttribute("value");
      if (this.hasAttribute("required")) input.setAttribute("required", "");
      else input.removeAttribute("required");
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
class ContourRadioList extends ContourBase {
    static get observed() { return ["items", "name", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, name: { attribute: "name" } }; }
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
          parsed.forEach((it) => {
            const lbl = document.createElement("label");
            lbl.className = "c-radio";
            const input = document.createElement("input");
            input.type = "radio";
            input.className = "c-radio__input";
            input.name = this.getAttribute("name") || contourId("radio-list");
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
