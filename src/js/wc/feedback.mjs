import { ContourBase, define } from './core.mjs';
import { wireRemovable } from './behaviours.mjs';
class ContourDialog extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-dialog");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
      const title = this.getAttribute("title");
      if (title) {
        let head = this.querySelector(".c-dialog__head");
        if (!head) {
          head = document.createElement("div");
          head.className = "c-dialog__head";
          const h = document.createElement("h2");
          h.className = "c-dialog__title";
          head.appendChild(h);
          const closeBtn = document.createElement("button");
          closeBtn.className = "c-btn c-btn--icon c-btn--ghost";
          closeBtn.setAttribute("type", "button");
          closeBtn.setAttribute("aria-label", "Close");
          closeBtn.innerHTML = '<svg aria-hidden="true"><use href="#i-close" /></svg>';
          head.appendChild(closeBtn);
          this.prepend(head);
        }
        const h = head.querySelector(".c-dialog__title");
        if (h) h.textContent = title;
      }
    }
    enhance() {
      if (this._wiredDialog) return;
      this._wiredDialog = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-btn--icon") : null;
        if (!btn || !this.contains(btn)) return;
        const dlg = this.querySelector("dialog") || (this.tagName === "DIALOG" ? this : null);
        if (dlg && typeof dlg.close === "function") dlg.close();
        this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
      });
      // Close on Escape
      this.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          const dlg = this.querySelector("dialog") || (this.tagName === "DIALOG" ? this : null);
          if (dlg && typeof dlg.close === "function") dlg.close();
          this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
        }
      });
    }
  }
  define("contour-dialog", ContourDialog);
class ContourAlert extends ContourBase {
    static get observed() { return ["title", "body", "variant", "icon", "closable"]; }
    static get properties() {
      return { title: { attribute: "title" }, body: { attribute: "body" }, variant: { attribute: "variant" }, icon: { attribute: "icon" }, closable: { attribute: "closable", type: Boolean } };
    }
    render() {
      this.classList.add("c-alert");
      const variant = this.getAttribute("variant");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-alert--")) this.classList.remove(c); });
      if (variant) this.classList.add("c-alert--" + variant);
      const icon = this.getAttribute("icon");
      if (icon) {
        const ic = this.ensure(".c-alert__icon", () => { const el = document.createElement("span"); el.className = "c-alert__icon"; return el; });
        if (ic.parentNode === this && this.firstChild !== ic) this.prepend(ic);
        ic.innerHTML = '<svg aria-hidden="true"><use href="#' + String(icon).replace(/[^a-zA-Z0-9_-]/g, "") + '" /></svg>';
      } else {
        const ic = this.querySelector(".c-alert__icon");
        if (ic) ic.remove();
      }
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-alert__title", () => { const el = document.createElement("div"); el.className = "c-alert__title"; return el; });
        if (t.parentNode === this && this.firstChild !== t) this.prepend(t);
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-alert__title");
        if (t) t.remove();
      }
      const body = this.getAttribute("body");
      if (body) {
        const b = this.ensure(".c-alert__body", () => { const el = document.createElement("div"); el.className = "c-alert__body"; return el; });
        b.textContent = body;
      } else {
        const b = this.querySelector(".c-alert__body");
        if (b) b.remove();
      }
      if (this.hasAttribute("closable")) {
        this.ensure(".c-alert__close", () => {
          const btn = document.createElement("button");
          btn.className = "c-alert__close";
          btn.type = "button";
          btn.setAttribute("aria-label", "Close");
          btn.textContent = "×";
          return btn;
        });
      } else {
        const btn = this.querySelector(".c-alert__close");
        if (btn) btn.remove();
      }
    }
  }
  define("contour-alert", ContourAlert);
class ContourDisclosure extends ContourBase {
    static get observed() { return ["summary", "icon"]; }
    static get properties() { return { summary: { attribute: "summary" }, icon: { attribute: "icon" } }; }
    disconnectedCallback() { this._disclosureContent = null; super.disconnectedCallback(); }
    connectedCallback() {
      if (this.innerHTML.trim() && !this._disclosureContent) {
        this._disclosureContent = this.innerHTML;
      }
      super.connectedCallback();
    }
    attributeChangedCallback(name, oldValue, newValue) {
      // Preserve authored content before the base reset removes the generated
      // container that holds it.
      const details = this.querySelector("details");
      if (details) {
        const body = details.querySelector(".c-disclosure__body");
        if (body) this._disclosureContent = body.innerHTML;
      } else if (this.innerHTML.trim()) {
        this._disclosureContent = this.innerHTML;
      }
      super.attributeChangedCallback(name, oldValue, newValue);
    }
    render() {
      this.classList.add("c-disclosure");
      const summary = this.getAttribute("summary");
      const icon = this.getAttribute("icon");
      if (summary) {
        let captured = this.innerHTML.trim() ? this.innerHTML : (this._disclosureContent || "");
        if (captured.trim()) this._disclosureContent = captured;
        const details = this.ensure("details", () => {
          const d = document.createElement("details");
          const summ = document.createElement("summary");
          if (icon) {
            const ic = document.createElement("span");
            ic.className = "c-disclosure__icon";
            ic.innerHTML = '<svg aria-hidden="true"><use href="#' + String(icon).replace(/[^a-zA-Z0-9_-]/g, "") + '" /></svg>';
            summ.appendChild(ic);
          }
          summ.appendChild(document.createTextNode(summary));
          d.appendChild(summ);
          const content = document.createElement("div");
          content.className = "c-disclosure__body";
          content.innerHTML = captured;
          d.appendChild(content);
          return d;
        });
        // update summary if already existed
        const summ = details.querySelector("summary");
        if (summ) {
          const ic = summ.querySelector(".c-disclosure__icon");
          if (icon && !ic) {
            const newIc = document.createElement("span");
            newIc.className = "c-disclosure__icon";
            newIc.innerHTML = '<svg aria-hidden="true"><use href="#' + String(icon).replace(/[^a-zA-Z0-9_-]/g, "") + '" /></svg>';
            summ.insertBefore(newIc, summ.firstChild);
          } else if (!icon && ic) {
            ic.remove();
          }
          // Update text content (remove icon text, set summary)
          const textNodes = Array.from(summ.childNodes).filter(n => n.nodeType === 3);
          textNodes.forEach(n => n.remove());
          summ.appendChild(document.createTextNode(summary));
        }
        const body = details.querySelector(".c-disclosure__body");
        if (body) body.innerHTML = captured;
        if (details.parentNode !== this) { this.innerHTML = ""; this.appendChild(details); }
      } else {
        const details = this.querySelector("details");
        if (details) details.remove();
      }
    }
    enhance() {
      if (this._wiredDisclosure) return;
      this._wiredDisclosure = true;
      this.addEventListener("toggle", (e) => {
        const t = e.target;
        if (t && t.tagName === "DETAILS") {
          this.dispatchEvent(new CustomEvent("contour:toggle", { detail: { open: t.open }, bubbles: true, composed: true }));
        }
      }, true);
    }
  }
  define("contour-disclosure", ContourDisclosure);
class ContourCallout extends ContourBase {
    static get observed() { return ["variant", "title", "icon"]; }
    static get properties() { return { variant: { attribute: "variant" }, title: { attribute: "title" }, icon: { attribute: "icon" } }; }
    render() {
      this.classList.add("c-callout");
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-callout--" + variant);
      const icon = this.getAttribute("icon");
      if (icon) {
        const ic = this.ensure(".c-callout__icon", () => { const el = document.createElement("span"); el.className = "c-callout__icon"; return el; });
        if (ic.parentNode === this && this.firstChild !== ic) this.prepend(ic);
        ic.innerHTML = '<svg aria-hidden="true"><use href="#' + String(icon).replace(/[^a-zA-Z0-9_-]/g, "") + '" /></svg>';
      } else {
        const ic = this.querySelector(".c-callout__icon");
        if (ic) ic.remove();
      }
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-callout__title", () => { const el = document.createElement("div"); el.className = "c-callout__title"; return el; });
        if (t.parentNode === this && this.firstChild !== t) this.prepend(t);
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-callout__title");
        if (t) t.remove();
      }
    }
  }
  define("contour-callout", ContourCallout);
class ContourEmpty extends ContourBase {
    static get observed() { return ["state", "title", "body", "action", "icon"]; }
    static get properties() { return { state: { attribute: "state" }, title: { attribute: "title" }, body: { attribute: "body" }, action: { attribute: "action" }, icon: { attribute: "icon" } }; }
    render() {
      this.classList.add("c-empty");
      const state = this.getAttribute("state") || "empty";
      const title = this.getAttribute("title") || (state === "filtered" ? "Nothing matches" : state === "error" ? "Could not load" : "No data yet");
      const body = this.getAttribute("body") || (state === "filtered" ? "Try clearing some filters." : state === "error" ? "Check your connection and try again." : "There is nothing to show here yet.");
      const action = this.getAttribute("action") || (state === "filtered" ? "Clear filters" : state === "error" ? "Retry" : "");
      const icon = this.getAttribute("icon");
      if (icon) {
        const ic = this.ensure(".c-empty__icon", () => { const el = document.createElement("span"); el.className = "c-empty__icon"; return el; });
        ic.innerHTML = '<svg aria-hidden="true"><use href="#' + String(icon).replace(/[^a-zA-Z0-9_-]/g, "") + '" /></svg>';
      } else {
        const ic = this.querySelector(".c-empty__icon");
        if (ic) ic.remove();
      }
      if (title) {
        const t = this.ensure(".c-empty__title", () => { const el = document.createElement("h3"); el.className = "c-empty__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-empty__title");
        if (t) t.remove();
      }
      if (body) {
        const b = this.ensure(".c-empty__text", () => { const el = document.createElement("p"); el.className = "c-empty__text"; return el; });
        b.textContent = body;
      } else {
        const b = this.querySelector(".c-empty__text");
        if (b) b.remove();
      }
      if (action) {
        // `.c-empty` defines `__icon`, `__title` and `__text`, and no action
        // element: the action is a real `.c-btn`. The invented action class
        // matched no rule, so it styled nothing yet was the click hook in both
        // layers — `data-empty-action` is the same hook without the invented name.
        const a = this.ensure("button.c-btn[data-empty-action]", () => {
          const el = document.createElement("button");
          el.className = "c-btn c-btn--primary";
          el.type = "button";
          el.setAttribute("data-empty-action", "");
          return el;
        });
        a.textContent = action;
      } else {
        const a = this.querySelector("[data-empty-action]");
        if (a) a.remove();
      }
    }
    enhance() {
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
      wireRemovable(this);
    }
  }
  define("contour-empty", ContourEmpty);
class ContourFaq extends ContourBase {
    static get observed() { return ["question", "answer", "items"]; }
    static get properties() { return { question: { attribute: "question" }, answer: { attribute: "answer" }, items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-faq");
      const question = this.getAttribute("question");
      const answer = this.getAttribute("answer");
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          // Clear previous items
          Array.from(this.querySelectorAll(".c-faq__item")).forEach((n) => n.remove());
          parsed.forEach((it) => {
            const item = document.createElement("div");
            item.className = "c-faq__item";
            const q = document.createElement("div");
            q.className = "c-faq__question";
            q.textContent = typeof it === "string" ? it : (it.question || it.q || "");
            const sign = document.createElement("span");
            sign.className = "c-faq__sign";
            sign.innerHTML = '<svg aria-hidden="true"><use href="#i-plus" /></svg>';
            q.appendChild(sign);
            item.appendChild(q);
            const a = document.createElement("div");
            a.className = "c-faq__answer";
            a.textContent = typeof it === "string" ? "" : (it.answer || it.a || "");
            item.appendChild(a);
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      } else {
        if (question) {
          const q = this.ensure(".c-faq__question", () => { const el = document.createElement("div"); el.className = "c-faq__question"; return el; });
          q.textContent = question;
        } else {
          const q = this.querySelector(".c-faq__question");
          if (q) q.remove();
        }
        if (answer) {
          const a = this.ensure(".c-faq__answer", () => { const el = document.createElement("div"); el.className = "c-faq__answer"; return el; });
          a.textContent = answer;
        } else {
          const a = this.querySelector(".c-faq__answer");
          if (a) a.remove();
        }
      }
    }
  }
  define("contour-faq", ContourFaq);
class ContourAccordion extends ContourBase {
    static get observed() { return ["items"]; }
    static get properties() { return { items: { attribute: "items" } }; }
    render() {
      // The host is a plain container; the children carry .c-disclosure, which
      // is the block that owns the styling. No .c-accordion rule exists, so the
      // host class is dropped rather than invented.
      Array.from(this.querySelectorAll("details.c-disclosure")).forEach((d) => d.remove());
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          parsed.forEach((item) => {
            const details = document.createElement("details");
            details.className = "c-disclosure";
            const summary = document.createElement("summary");
            summary.textContent = item.title || item.question || "";
            details.appendChild(summary);
            const body = document.createElement("div");
            body.className = "c-disclosure__body";
            body.textContent = item.body || item.answer || "";
            details.appendChild(body);
            this.appendChild(details);
          });
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredAccordion) return;
      this._wiredAccordion = true;
      this.addEventListener("toggle", (e) => {
        const t = e.target;
        if (t && t.tagName === "DETAILS") {
          this.dispatchEvent(new CustomEvent("contour:toggle", { detail: { open: t.open }, bubbles: true, composed: true }));
        }
      }, true);
    }
  }
  define("contour-accordion", ContourAccordion);
class ContourDrawer extends ContourBase {
    render() {
      this.classList.add("c-drawer");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
    }
  }
  define("contour-drawer", ContourDrawer);
class ContourSheet extends ContourBase {
    render() {
      this.classList.add("c-sheet");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
    }
  }
  define("contour-sheet", ContourSheet);
class ContourToast extends ContourBase {
    static get observed() { return ["message", "variant"]; }
    static get properties() { return { message: { attribute: "message" }, variant: { attribute: "variant" } }; }
    render() {
      this.classList.add("c-toast");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-live")) this.setAttribute("aria-live", "polite");
      if (!this.hasAttribute("aria-atomic")) this.setAttribute("aria-atomic", "true");
      const message = this.getAttribute("message");
      if (message && !this.textContent.trim()) {
        this.textContent = message;
      }
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-toast--" + variant);
    }
  }
  define("contour-toast", ContourToast);
class ContourExpandable extends ContourBase {
    static get observed() { return ["summary"]; }
    static get properties() { return { summary: { attribute: "summary" } }; }
    disconnectedCallback() { this._expandableContent = null; super.disconnectedCallback(); }
    connectedCallback() {
      if (this.innerHTML.trim() && !this._expandableContent) {
        this._expandableContent = this.innerHTML;
      }
      super.connectedCallback();
    }
    attributeChangedCallback(name, oldValue, newValue) {
      const details = this.querySelector("details");
      if (details) {
        const body = details.querySelector(".c-expandable__body");
        if (body) this._expandableContent = body.innerHTML;
      } else if (this.innerHTML.trim()) {
        this._expandableContent = this.innerHTML;
      }
      super.attributeChangedCallback(name, oldValue, newValue);
    }
    render() {
      this.classList.add("c-expandable");
      const summary = this.getAttribute("summary");
      if (summary) {
        let captured = this.innerHTML.trim() ? this.innerHTML : (this._expandableContent || "");
        if (captured.trim()) this._expandableContent = captured;
        const details = this.ensure("details", () => {
          const d = document.createElement("details");
          const summ = document.createElement("summary");
          summ.textContent = summary;
          d.appendChild(summ);
          const content = document.createElement("div");
          content.className = "c-expandable__body";
          content.innerHTML = captured;
          d.appendChild(content);
          return d;
        });
        const summ = details.querySelector("summary");
        if (summ) summ.textContent = summary;
        const body = details.querySelector(".c-expandable__body");
        if (body) body.innerHTML = captured;
        if (details.parentNode !== this) { this.innerHTML = ""; this.appendChild(details); }
      } else {
        const details = this.querySelector("details");
        if (details) details.remove();
      }
    }
    enhance() {
      if (this._wiredExpandable) return;
      this._wiredExpandable = true;
      this.addEventListener("toggle", (e) => {
        const t = e.target;
        if (t && t.tagName === "DETAILS") {
          this.dispatchEvent(new CustomEvent("contour:toggle", { detail: { open: t.open }, bubbles: true, composed: true }));
        }
      }, true);
    }
  }
  define("contour-expandable", ContourExpandable);
class ContourToastHost extends ContourBase {
    render() {
      this.classList.add("c-toast-host");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-live")) this.setAttribute("aria-live", "polite");
      if (!this.hasAttribute("aria-atomic")) this.setAttribute("aria-atomic", "true");
    }
  }
  define("contour-toast-host", ContourToastHost);
