import { ContourBase, define } from './core.mjs';
class ContourCombobox extends ContourBase {
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
      if (this._wiredCombobox) return;
      this._wiredCombobox = true;
      const input = () => this.querySelector(".c-combobox__input");
      const list = () => this.querySelector(".c-combobox__list");
      const options = () => Array.from(this.querySelectorAll(".c-combobox__option"));
      let activeIndex = -1;
      const filter = (query) => {
        const q = (query || "").toLowerCase();
        options().forEach((opt) => {
          const text = opt.textContent.toLowerCase();
          opt.hidden = !!(q && !text.includes(q));
        });
        activeIndex = -1;
      };
      const open = () => { const l = list(); if (l) l.removeAttribute("hidden"); };
      const close = () => { const l = list(); if (l) l.setAttribute("hidden", ""); };
      const inp = input();
      if (!inp) return;
      const lst = list();
      inp.addEventListener("input", () => { filter(inp.value); open(); });
      inp.addEventListener("focus", () => { filter(inp.value); open(); });
      inp.addEventListener("keydown", (e) => {
        const visible = options().filter((o) => !o.hidden);
        if (e.key === "ArrowDown") {
          e.preventDefault();
          activeIndex = Math.min(activeIndex + 1, visible.length - 1);
          visible.forEach((o, i) => o.classList.toggle("c-combobox__option--active", i === activeIndex));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          activeIndex = Math.max(activeIndex - 1, 0);
          visible.forEach((o, i) => o.classList.toggle("c-combobox__option--active", i === activeIndex));
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (activeIndex >= 0 && visible[activeIndex]) {
            inp.value = visible[activeIndex].textContent;
            close();
          }
        } else if (e.key === "Escape") {
          close();
        }
      });
      if (lst) {
        lst.addEventListener("click", (e) => {
          const opt = e.target && e.target.closest ? e.target.closest(".c-combobox__option") : null;
          if (opt) {
            inp.value = opt.textContent;
            close();
            inp.focus();
          }
        });
      }
      const docClick = (e) => {
        if (!this.isConnected) { document.removeEventListener("click", docClick); return; }
        if (!this.contains(e.target)) close();
      };
      document.addEventListener("click", docClick);
    }
  }
  define("contour-combobox", ContourCombobox);
class ContourField extends ContourBase {
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
      if (!this.querySelector("input, textarea, select")) {
        const input = document.createElement("input");
        input.className = "c-input";
        input.type = this.getAttribute("type") || "text";
        input.placeholder = placeholder;
        input.id = input.id || ("contour-field-" + Math.random().toString(36).slice(2, 9));
        this.appendChild(input);
      }
      // Associate the label with the input so the control is labelled.
      const lbl = this.querySelector(".c-field__label");
      const inp = this.querySelector("input, textarea, select");
      if (lbl && inp) { if (!inp.id) inp.id = "contour-field-" + Math.random().toString(36).slice(2, 9); lbl.setAttribute("for", inp.id); }
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
    render() {
      this.classList.add("c-range");
      if (!this.querySelector("input")) {
        const input = document.createElement("input");
        input.type = "range";
        input.min = this.getAttribute("min") || "0";
        input.max = this.getAttribute("max") || "100";
        input.value = this.getAttribute("value") || "50";
        this.appendChild(input);
      }
    }
  }
  define("contour-range", ContourRange);
class ContourSwitch extends ContourBase {
    render() {
      this.classList.add("c-switch");
      const label = this.getAttribute("label");
      if (label) {
        const lbl = document.createElement("span");
        lbl.className = "c-switch__label";
        lbl.textContent = label;
        this.appendChild(lbl);
      }
    }
  }
  define("contour-switch", ContourSwitch);
class ContourCheck extends ContourBase {
    render() {
      this.classList.add("c-check");
      const label = this.getAttribute("label");
      if (label) {
        const lbl = document.createElement("label");
        lbl.className = "c-check__label";
        lbl.textContent = label;
        this.appendChild(lbl);
      }
    }
  }
  define("contour-check", ContourCheck);
class ContourRadio extends ContourBase {
    render() {
      this.classList.add("c-radio");
      const label = this.getAttribute("label");
      if (label) {
        const lbl = document.createElement("label");
        lbl.className = "c-radio__label";
        lbl.textContent = label;
        this.appendChild(lbl);
      }
    }
  }
  define("contour-radio", ContourRadio);
class ContourSelect extends ContourBase {
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
  }
  define("contour-select", ContourSelect);
class ContourVersion extends ContourBase {
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
    render() {
      this.classList.add("c-textarea");
      if (!this.querySelector("textarea")) {
        const ta = document.createElement("textarea");
        ta.className = "c-textarea";
        ta.placeholder = this.getAttribute("placeholder") || "";
        this.appendChild(ta);
      }
    }
  }
  define("contour-textarea", ContourTextarea);
class ContourInputFull extends ContourBase {
    render() {
      this.classList.add("c-input");
      if (!this.querySelector("input")) {
        const input = document.createElement("input");
        input.className = "c-input";
        input.type = this.getAttribute("type") || "text";
        input.placeholder = this.getAttribute("placeholder") || "";
        this.appendChild(input);
      }
    }
  }
  define("contour-input", ContourInputFull);
class ContourInputGroup extends ContourBase {
    render() { this.classList.add("c-input-group"); }
  }
  define("contour-input-group", ContourInputGroup);
class ContourRadioList extends ContourBase {
    render() {
      this.classList.add("c-radio-list");
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
            else { input.value = it.value || it.label; lbl.appendChild(input); const span = document.createElement("span"); span.className = "c-radio__label"; span.textContent = it.label || it.value; lbl.appendChild(span); }
            this.appendChild(lbl);
          });
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-radio-list", ContourRadioList);
