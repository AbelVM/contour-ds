import { ContourBase, define } from './core.mjs';
import { wireCombobox } from './behaviours.mjs';
class ContourCombobox extends ContourBase {
    static get observed() { return ["options", "placeholder", "label"]; }
    static get properties() { return { options: { attribute: "options" }, placeholder: { attribute: "placeholder" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-combobox");
      const options = this.getAttribute("options");
      if (options) {
        try {
          const parsed = JSON.parse(options);
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
      }
    }
    enhance() {
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
      wireCombobox(this);
    }
  }
  define("contour-combobox", ContourCombobox);
class ContourField extends ContourBase {
    static get observed() { return ["label", "hint", "error", "placeholder", "type"]; }
    static get properties() { return { label: { attribute: "label" }, hint: { attribute: "hint" }, error: { attribute: "error" }, placeholder: { attribute: "placeholder" }, type: { attribute: "type" } }; }
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
      if (!input.id) input.id = "contour-field-" + Math.random().toString(36).slice(2, 9);
      // Associate the label with the input so the control is labelled.
      const lbl = this.querySelector(".c-field__label");
      if (lbl) { if (!input.id) input.id = "contour-field-" + Math.random().toString(36).slice(2, 9); lbl.setAttribute("for", input.id); }
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
    }
  }
  define("contour-field", ContourField);
class ContourRange extends ContourBase {
    static get observed() { return ["min", "max", "value"]; }
    static get properties() { return { min: { attribute: "min" }, max: { attribute: "max" }, value: { attribute: "value" } }; }
    render() {
      this.classList.add("c-range");
      const input = this.ensure("input", () => { const el = document.createElement("input"); el.type = "range"; return el; });
      input.type = "range";
      input.min = this.getAttribute("min") || "0";
      input.max = this.getAttribute("max") || "100";
      input.value = this.getAttribute("value") || "50";
    }
  }
  define("contour-range", ContourRange);
class ContourSwitch extends ContourBase {
    static get observed() { return ["label", "required"]; }
    static get properties() { return { label: { attribute: "label" }, required: { attribute: "required", type: Boolean } }; }
    static get formAssociated() { return true; }
    constructor() { super(); this._internals = (typeof this.attachInternals === "function") ? this.attachInternals() : null; }
    render() {
      this.classList.add("c-switch");
      const label = this.getAttribute("label");
      // The guide's control is `label.c-switch` wrapping `input.c-switch__input`
      // and a bare span of text; the sheet paints the track on the input itself.
      const input = this.ensure("input.c-switch__input", () => { const el = document.createElement("input"); el.className = "c-switch__input"; el.type = "checkbox"; return el; });
      if (label) {
        input.setAttribute("aria-label", label);
        const txt = this.querySelector(":scope > span:not([class])") || (() => { const el = document.createElement("span"); this.appendChild(el); return el; })();
        txt.textContent = label;
      }
    }
    enhance() {
      if (this._wiredSwitch) return;
      this._wiredSwitch = true;
      const input = this.querySelector("input");
      if (!input) return;
      const sync = () => {
        if (!this._internals) return;
        this._internals.setFormValue(input.checked ? (input.value || "on") : null);
        if (this.hasAttribute("required") && !input.checked) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else {
          this._internals.setValidity({});
        }
      };
      input.addEventListener("change", sync);
      sync();
    }
  }
  define("contour-switch", ContourSwitch);
class ContourCheck extends ContourBase {
    static get observed() { return ["label", "name", "value", "required", "type"]; }
    static get properties() { return { label: { attribute: "label" }, name: { attribute: "name" }, value: { attribute: "value" }, required: { attribute: "required", type: Boolean }, type: { attribute: "type" } }; }
    static get formAssociated() { return true; }
    constructor() { super(); this._internals = (typeof this.attachInternals === "function") ? this.attachInternals() : null; }
    render() {
      this.classList.add("c-check");
      const label = this.getAttribute("label");
      const input = this.ensure("input.c-check__input", () => { const el = document.createElement("input"); el.className = "c-check__input"; el.type = this.getAttribute("type") === "radio" ? "radio" : "checkbox"; return el; });
      if (label) {
        input.setAttribute("aria-label", label);
        const txt = this.querySelector(":scope > span:not([class])") || (() => { const el = document.createElement("span"); this.appendChild(el); return el; })();
        txt.textContent = label;
      }
    }
    enhance() {
      if (this._wiredCheck) return;
      this._wiredCheck = true;
      const input = this.querySelector("input");
      if (!input) return;
      const sync = () => {
        if (!this._internals) return;
        this._internals.setFormValue(input.checked ? (input.value || "on") : null);
        if (this.hasAttribute("required") && !input.checked) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else {
          this._internals.setValidity({});
        }
      };
      input.addEventListener("change", sync);
      sync();
    }
  }
  define("contour-check", ContourCheck);
class ContourRadio extends ContourBase {
    static get observed() { return ["label", "name", "value", "required"]; }
    static get properties() { return { label: { attribute: "label" }, name: { attribute: "name" }, value: { attribute: "value" }, required: { attribute: "required", type: Boolean } }; }
    static get formAssociated() { return true; }
    constructor() { super(); this._internals = (typeof this.attachInternals === "function") ? this.attachInternals() : null; }
    render() {
      this.classList.add("c-radio");
      const label = this.getAttribute("label");
      const input = this.ensure("input.c-radio__input", () => { const el = document.createElement("input"); el.className = "c-radio__input"; el.type = "radio"; return el; });
      if (this.hasAttribute("name")) input.name = this.getAttribute("name");
      if (this.hasAttribute("value")) input.value = this.getAttribute("value");
      if (label) {
        input.setAttribute("aria-label", label);
        const txt = this.querySelector(":scope > span:not([class])") || (() => { const el = document.createElement("span"); this.appendChild(el); return el; })();
        txt.textContent = label;
      }
    }
    enhance() {
      if (this._wiredRadio) return;
      this._wiredRadio = true;
      const input = this.querySelector("input");
      if (!input) return;
      const sync = () => {
        if (!this._internals) return;
        if (input.checked) this._internals.setFormValue(input.value || "on");
        if (this.hasAttribute("required") && !input.checked) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else if (input.checked) {
          this._internals.setValidity({});
        }
      };
      input.addEventListener("change", sync);
      if (input.checked) sync();
    }
  }
  define("contour-radio", ContourRadio);
class ContourSelect extends ContourBase {
    static get observed() { return ["options", "required"]; }
    static get properties() { return { options: { attribute: "options" }, required: { attribute: "required", type: Boolean } }; }
    static get formAssociated() { return true; }
    constructor() { super(); this._internals = (typeof this.attachInternals === "function") ? this.attachInternals() : null; }
    render() {
      this.classList.add("c-select");
      const options = this.getAttribute("options");
      if (options) {
        try {
          const parsed = JSON.parse(options);
          const select = this.ensure("select.c-select", () => { const el = document.createElement("select"); el.className = "c-select"; return el; });
          select.innerHTML = "";
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
      if (this._wiredSelect) return;
      this._wiredSelect = true;
      const select = this.querySelector("select");
      if (!select) return;
      const sync = () => {
        if (!this._internals) return;
        this._internals.setFormValue(select.value);
        if (this.hasAttribute("required") && !select.value) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else {
          this._internals.setValidity({});
        }
      };
      select.addEventListener("change", sync);
      sync();
    }
  }
  define("contour-select", ContourSelect);
class ContourVersion extends ContourBase {
    static get observed() { return ["options"]; }
    static get properties() { return { options: { attribute: "options" } }; }
    render() {
      this.classList.add("c-version");
      const options = this.getAttribute("options");
      if (options) {
        try {
          const parsed = JSON.parse(options);
          const select = this.ensure("select.c-version", () => { const el = document.createElement("select"); el.className = "c-version"; return el; });
          select.innerHTML = "";
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
  }
  define("contour-version", ContourVersion);
class ContourTextarea extends ContourBase {
    static get observed() { return ["placeholder", "required"]; }
    static get properties() { return { placeholder: { attribute: "placeholder" }, required: { attribute: "required", type: Boolean } }; }
    static get formAssociated() { return true; }
    constructor() { super(); this._internals = (typeof this.attachInternals === "function") ? this.attachInternals() : null; }
    render() {
      this.classList.add("c-textarea");
      const ta = this.ensure("textarea", () => { const el = document.createElement("textarea"); el.className = "c-textarea"; return el; });
      ta.className = "c-textarea";
      ta.placeholder = this.getAttribute("placeholder") || "";
      if (this.hasAttribute("required")) ta.setAttribute("required", "");
      else ta.removeAttribute("required");
    }
    enhance() {
      if (this._wiredTextarea) return;
      this._wiredTextarea = true;
      const ta = this.querySelector("textarea");
      if (!ta) return;
      const sync = () => {
        if (!this._internals) return;
        this._internals.setFormValue(ta.value);
        if (this.hasAttribute("required") && !ta.value.trim()) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else {
          this._internals.setValidity({});
        }
      };
      ta.addEventListener("input", sync);
      ta.addEventListener("change", sync);
      sync();
    }
  }
  define("contour-textarea", ContourTextarea);
class ContourInputFull extends ContourBase {
    static get observed() { return ["type", "placeholder", "required"]; }
    static get properties() { return { type: { attribute: "type" }, placeholder: { attribute: "placeholder" }, required: { attribute: "required", type: Boolean } }; }
    static get formAssociated() { return true; }
    constructor() { super(); this._internals = (typeof this.attachInternals === "function") ? this.attachInternals() : null; }
    render() {
      this.classList.add("c-input");
      const input = this.ensure("input", () => { const el = document.createElement("input"); el.className = "c-input"; return el; });
      input.className = "c-input";
      input.type = this.getAttribute("type") || "text";
      input.placeholder = this.getAttribute("placeholder") || "";
      if (this.hasAttribute("required")) input.setAttribute("required", "");
      else input.removeAttribute("required");
    }
    enhance() {
      if (this._wiredInput) return;
      this._wiredInput = true;
      const input = this.querySelector("input");
      if (!input) return;
      const sync = () => {
        if (!this._internals) return;
        this._internals.setFormValue(input.value);
        if (this.hasAttribute("required") && !input.value.trim()) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else {
          this._internals.setValidity({});
        }
      };
      input.addEventListener("input", sync);
      input.addEventListener("change", sync);
      sync();
    }
  }
  define("contour-input", ContourInputFull);
class ContourInputGroup extends ContourBase {
    render() { this.classList.add("c-input-group"); }
  }
  define("contour-input-group", ContourInputGroup);
class ContourRadioList extends ContourBase {
    static get observed() { return ["items", "name"]; }
    static get properties() { return { items: { attribute: "items" }, name: { attribute: "name" } }; }
    render() {
      this.classList.add("c-radio-list");
      // Clear previously generated radios before rebuilding.
      Array.from(this.querySelectorAll("label.c-radio")).forEach((l) => l.remove());
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          parsed.forEach((it) => {
            const lbl = document.createElement("label");
            lbl.className = "c-radio";
            const input = document.createElement("input");
            input.type = "radio";
            input.name = this.getAttribute("name") || "radio-list";
            if (typeof it === "string") { input.value = it; lbl.appendChild(input); lbl.appendChild(document.createTextNode(" " + it)); }
            // The guide's own radio carries its text in a bare span; the sheet has
            // no `__label` part on this block.
            else { input.value = it.value || it.label; lbl.appendChild(input); const span = document.createElement("span"); span.textContent = it.label || it.value; lbl.appendChild(span); }
            this.appendChild(lbl);
          });
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-radio-list", ContourRadioList);
