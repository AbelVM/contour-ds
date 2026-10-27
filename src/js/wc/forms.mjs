import { ContourBase, define, contourId } from './core.mjs';
import { wireCombobox } from './behaviours.mjs';
class ContourCombobox extends ContourBase {
    static get observed() { return ["options", "placeholder", "label", "loading", "src", "error", "empty", "skeleton"]; }
    static get formAssociated() { return true; }
    static get properties() { return { options: { attribute: "options" }, placeholder: { attribute: "placeholder" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-combobox");
      if (this.hasAttribute("error")) {
        const err = document.createElement("div");
        err.className = "c-combobox__error";
        err.textContent = this.getAttribute("error") || "Error";
        err.style.color = "var(--color-danger, var(--color-text))";
        err.style.padding = "var(--space-md)";
        this.appendChild(err);
        return;
      }
      if (this.hasAttribute("skeleton")) {
        const sk = document.createElement("div");
        sk.className = "c-skeleton c-combobox__skeleton";
        sk.style.blockSize = "2rem";
        this.appendChild(sk);
        return;
      }
       const options = this.getAttribute("options") || (this._remoteOptions ? JSON.stringify(this._remoteOptions) : null);
       const src = this.getAttribute("src");
       // Remote loading: fetch options from `src` and populate internal state.
       if (src && !this.getAttribute("options") && this._srcFetched !== src) {
         this._srcFetched = src;
         this._loading = true;
         this.attributeChangedCallback("__rerender__", null, "");
         fetch(src).then((r) => r.json()).then((data) => {
           this._remoteOptions = data;
           this._loading = false;
           this.attributeChangedCallback("__rerender__", null, "");
         }).catch(() => {
           this._loading = false;
           this.attributeChangedCallback("__rerender__", null, "");
         });
       }
       const loading = this.hasAttribute("loading") || this._loading;
       // Slot composition: authored <li> options win over the JSON attribute.
       const authored = Array.from(this.children).filter((n) => !n.classList || (!n.classList.contains("c-combobox__input") && !n.classList.contains("c-combobox__list")));
       if ((options || loading) && !authored.length) {
         try {
           const parsed = options ? JSON.parse(options) : [];
           const input = this.ensure(".c-combobox__input", () => { const el = document.createElement("input"); el.className = "c-combobox__input"; el.type = "text"; return el; });
           input.type = "text";
           input.placeholder = this.getAttribute("placeholder") || "Search…";
           input.setAttribute("aria-label", this.getAttribute("label") || "Search");
           const list = this.ensure(".c-combobox__list", () => { const el = document.createElement("ul"); el.className = "c-combobox__list"; el.setAttribute("hidden", ""); return el; });
           list.innerHTML = "";
           list.setAttribute("hidden", "");
           if (loading) {
             const li = document.createElement("li");
             li.className = "c-combobox__option c-combobox__loading";
             li.textContent = (typeof this.getAttribute("loading") === "string" && this.getAttribute("loading")) ? this.getAttribute("loading") : "Loading…";
             list.appendChild(li);
             list.removeAttribute("hidden");
           } else {
             parsed.forEach((opt) => {
               const li = document.createElement("li");
               li.className = "c-combobox__option";
               li.textContent = typeof opt === "string" ? opt : opt.label;
               list.appendChild(li);
             });
           }
         } catch (e) { /* keep existing */ }
       } else if (!authored.length && !options && !loading) {
         const empty = document.createElement("div");
         empty.className = "c-combobox__empty";
         empty.textContent = this.getAttribute("empty") || "No data";
         empty.style.color = "var(--color-text-muted)";
         empty.style.padding = "var(--space-md)";
         this.appendChild(empty);
       }
    }
    enhance() {
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
      wireCombobox(this);
      if (this._wiredComboboxForm) return;
      this._wiredComboboxForm = true;
      const sync = () => {
        const input = this.querySelector("input, .c-combobox__input");
        if (!input || !this._internals) return;
        this._internals.setFormValue(input.value);
      };
      this.addEventListener("input", sync);
      this.addEventListener("change", sync);
      sync();
    }
  }
  define("contour-combobox", ContourCombobox);
class ContourField extends ContourBase {
    static get observed() { return ["label", "hint", "error", "placeholder", "type"]; }
    static get formAssociated() { return true; }
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
    });
    this.addEventListener("change", (e) => {
      const input = this.querySelector("input, textarea, select");
      if (!input || e.target !== input) return;
      sync();
    });
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
      input.value = this.getAttribute("value") || "50";
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
      sync();
    });
    this.addEventListener("change", (e) => {
      const input = this.querySelector("input");
      if (!input || e.target !== input) return;
      sync();
    });
    sync();
  };
  define("contour-range", ContourRange);
class ContourSwitch extends ContourBase {
    static get observed() { return ["label", "required"]; }
    static get properties() { return { label: { attribute: "label" }, required: { attribute: "required", type: Boolean } }; }
    static get formAssociated() { return true; }
    render() {
      this.classList.add("c-switch");
      const label = this.getAttribute("label");
      // The guide's control is `label.c-switch` wrapping `input.c-switch__input`
      // and a bare span of text; the sheet paints the track on the input itself.
      const input = this.ensure("input.c-switch__input", () => { const el = document.createElement("input"); el.className = "c-switch__input"; el.type = "checkbox"; return el; });
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
        this._internals.setFormValue(input.checked ? (input.value || "on") : null);
        if (this.hasAttribute("required") && !input.checked) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else {
          this._internals.setValidity({});
        }
      }
      if (this._wiredSwitch) return;
      this._wiredSwitch = true;
      this.addEventListener("change", (e) => {
        const inp = this.querySelector("input");
        if (!inp || e.target !== inp || !this._internals) return;
        this._internals.setFormValue(inp.checked ? (inp.value || "on") : null);
        if (this.hasAttribute("required") && !inp.checked) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else {
          this._internals.setValidity({});
        }
      });
    }
  }
  define("contour-switch", ContourSwitch);
class ContourCheck extends ContourBase {
    static get observed() { return ["label", "name", "value", "required", "type"]; }
    static get properties() { return { label: { attribute: "label" }, name: { attribute: "name" }, value: { attribute: "value" }, required: { attribute: "required", type: Boolean }, type: { attribute: "type" } }; }
    static get formAssociated() { return true; }
    render() {
      this.classList.add("c-check");
      const label = this.getAttribute("label");
      const input = this.ensure("input.c-check__input", () => { const el = document.createElement("input"); el.className = "c-check__input"; el.type = this.getAttribute("type") === "radio" ? "radio" : "checkbox"; return el; });
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
    }
    enhance() {
      const input = this.querySelector("input");
      if (input && this._internals) {
        this._internals.setFormValue(input.checked ? (input.value || "on") : null);
        if (this.hasAttribute("required") && !input.checked) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else {
          this._internals.setValidity({});
        }
      }
      if (this._wiredCheck) return;
      this._wiredCheck = true;
      this.addEventListener("change", (e) => {
        const inp = this.querySelector("input");
        if (!inp || e.target !== inp || !this._internals) return;
        this._internals.setFormValue(inp.checked ? (inp.value || "on") : null);
        if (this.hasAttribute("required") && !inp.checked) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else {
          this._internals.setValidity({});
        }
      });
    }
  }
  define("contour-check", ContourCheck);
class ContourRadio extends ContourBase {
    static get observed() { return ["label", "name", "value", "required"]; }
    static get properties() { return { label: { attribute: "label" }, name: { attribute: "name" }, value: { attribute: "value" }, required: { attribute: "required", type: Boolean } }; }
    static get formAssociated() { return true; }
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
      const input = this.querySelector("input");
      if (input && this._internals) {
        if (input.checked) this._internals.setFormValue(input.value || "on");
        if (this.hasAttribute("required") && !input.checked) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else if (input.checked) {
          this._internals.setValidity({});
        }
      }
      if (this._wiredRadio) return;
      this._wiredRadio = true;
      this.addEventListener("change", (e) => {
        const inp = this.querySelector("input");
        if (!inp || e.target !== inp || !this._internals) return;
        if (inp.checked) this._internals.setFormValue(inp.value || "on");
        if (this.hasAttribute("required") && !inp.checked) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else if (inp.checked) {
          this._internals.setValidity({});
        }
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
        if (this.hasAttribute("required") && !select.value) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else {
          this._internals.setValidity({});
        }
      }
      if (this._wiredSelect) return;
      this._wiredSelect = true;
      this.addEventListener("change", (e) => {
        const sel = this.querySelector("select");
        if (!sel || e.target !== sel || !this._internals) return;
        this._internals.setFormValue(sel.value);
        if (this.hasAttribute("required") && !sel.value) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else {
          this._internals.setValidity({});
        }
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
        if (this.hasAttribute("required") && !ta.value.trim()) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else {
          this._internals.setValidity({});
        }
      }
      if (this._wiredTextarea) return;
      this._wiredTextarea = true;
      this.addEventListener("input", (e) => {
        const t = this.querySelector("textarea");
        if (!t || e.target !== t || !this._internals) return;
        this._internals.setFormValue(t.value);
        if (this.hasAttribute("required") && !t.value.trim()) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else {
          this._internals.setValidity({});
        }
      });
      this.addEventListener("change", (e) => {
        const t = this.querySelector("textarea");
        if (!t || e.target !== t || !this._internals) return;
        this._internals.setFormValue(t.value);
        if (this.hasAttribute("required") && !t.value.trim()) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else {
          this._internals.setValidity({});
        }
      });
    }
  }
  define("contour-textarea", ContourTextarea);
class ContourInputFull extends ContourBase {
    static get observed() { return ["type", "placeholder", "required"]; }
    static get properties() { return { type: { attribute: "type" }, placeholder: { attribute: "placeholder" }, required: { attribute: "required", type: Boolean } }; }
    static get formAssociated() { return true; }
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
      const input = this.querySelector("input");
      if (input && this._internals) {
        this._internals.setFormValue(input.value);
        if (this.hasAttribute("required") && !input.value.trim()) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else {
          this._internals.setValidity({});
        }
      }
      if (this._wiredInput) return;
      this._wiredInput = true;
      this.addEventListener("input", (e) => {
        const inp = this.querySelector("input");
        if (!inp || e.target !== inp || !this._internals) return;
        this._internals.setFormValue(inp.value);
        if (this.hasAttribute("required") && !inp.value.trim()) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else {
          this._internals.setValidity({});
        }
      });
      this.addEventListener("change", (e) => {
        const inp = this.querySelector("input");
        if (!inp || e.target !== inp || !this._internals) return;
        this._internals.setFormValue(inp.value);
        if (this.hasAttribute("required") && !inp.value.trim()) {
          this._internals.setValidity({ valueMissing: true }, "This field is required.");
        } else {
          this._internals.setValidity({});
        }
      });
    }
  }
  define("contour-input", ContourInputFull);
class ContourInputGroup extends ContourBase {
    static get observed() { return ["label", "placeholder"]; }
    static get properties() { return { label: { attribute: "label" }, placeholder: { attribute: "placeholder" } }; }
    render() {
      this.classList.add("c-input-group");
      const icon = this.ensure("svg", () => { const el = document.createElementNS("http://www.w3.org/2000/svg", "svg"); el.setAttribute("aria-hidden", "true"); const use = document.createElementNS("http://www.w3.org/2000/svg", "use"); use.setAttribute("href", "#i-search"); el.appendChild(use); return el; });
      const input = this.ensure("input.c-input", () => { const el = document.createElement("input"); el.className = "c-input"; el.type = "text"; return el; });
      input.placeholder = this.getAttribute("placeholder") || this.getAttribute("label") || "";
    }
  }
  define("contour-input-group", ContourInputGroup);
class ContourRadioList extends ContourBase {
    static get observed() { return ["items", "name", "empty", "loading", "error", "src", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, name: { attribute: "name" } }; }
    render() {
      this.classList.add("c-radio-list");
      const src = this.getAttribute("src");
      const items = this.getAttribute("items") || (this._remoteItems ? JSON.stringify(this._remoteItems) : null);
      if (src && !this.getAttribute("items") && this._srcFetched !== src) {
        this._srcFetched = src;
        this._loading = true;
        this.attributeChangedCallback("__rerender__", null, "");
        fetch(src).then((r) => r.json()).then((data) => {
          this._remoteItems = data;
          this._loading = false;
          this.attributeChangedCallback("__rerender__", null, "");
        }).catch(() => {
          this._loading = false;
          this.attributeChangedCallback("__rerender__", null, "");
        });
      }
      const loading = this.hasAttribute("loading") || this._loading;
      if (loading) {
        const loadingEl = document.createElement("div");
        loadingEl.className = "c-radio-list__loading";
        loadingEl.textContent = this.getAttribute("loading") || "Loading…";
        loadingEl.style.color = "var(--color-text-muted)";
        loadingEl.style.padding = "var(--space-md)";
        this.appendChild(loadingEl);
        return;
      }
      if (this.hasAttribute("error")) {
        const err = document.createElement("div");
        err.className = "c-radio-list__error";
        err.textContent = this.getAttribute("error") || "Error";
        err.style.color = "var(--color-danger, var(--color-text))";
        err.style.padding = "var(--space-md)";
        this.appendChild(err);
        return;
      }
      if (this.hasAttribute("skeleton")) {
        const count = Math.min(4, Math.max(1, parseInt(this.getAttribute("skeleton") || "3", 10) || 3));
        for (let i = 0; i < count; i++) {
          const sk = document.createElement("div");
          sk.className = "c-skeleton c-radio-list__skeleton";
          sk.style.blockSize = "1.5rem";
          sk.style.marginBlockEnd = "var(--space-2xs)";
          this.appendChild(sk);
        }
        return;
      }
      // Clear previously generated radios before rebuilding.
      Array.from(this.querySelectorAll("label.c-radio")).forEach((l) => l.remove());
      if (items) {
        try {
          const parsed = JSON.parse(items);
          parsed.forEach((it, i) => {
            const lbl = document.createElement("label");
            lbl.className = "c-radio";
            const input = document.createElement("input");
            input.type = "radio";
            input.className = "c-radio__input";
            input.name = this.getAttribute("name") || "radio-list";
            if (i === 0) input.checked = true;
            if (typeof it === "string") { input.value = it; lbl.appendChild(input); lbl.appendChild(document.createTextNode(" " + it)); }
            // The guide's own radio carries its text in a bare span; the sheet has
            // no `__label` part on this block.
            else { input.value = it.value || it.label; if (it.checked) input.checked = true; lbl.appendChild(input); const span = document.createElement("span"); span.textContent = it.label || it.value; lbl.appendChild(span); }
            this.appendChild(lbl);
          });
        } catch (e) { /* keep existing */ }
      } else {
        const empty = document.createElement("div");
        empty.className = "c-radio-list__empty";
        empty.textContent = this.getAttribute("empty") || "No data";
        empty.style.color = "var(--color-text-muted)";
        empty.style.padding = "var(--space-md)";
        this.appendChild(empty);
      }
    }
  }
  define("contour-radio-list", ContourRadioList);
