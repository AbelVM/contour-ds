import { ContourBase, define } from './core.mjs';
class ContourDialog extends ContourBase {
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
        this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true }));
      });
    }
  }
  define("contour-dialog", ContourDialog);
class ContourAlert extends ContourBase {
    render() {
      this.classList.add("c-alert");
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-alert--" + variant);
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-alert__title", () => { const el = document.createElement("div"); el.className = "c-alert__title"; return el; });
        if (t.parentNode === this && this.firstChild !== t) this.prepend(t);
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-alert__title");
        if (t) t.remove();
      }
    }
  }
  define("contour-alert", ContourAlert);
class ContourDisclosure extends ContourBase {
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
      if (summary) {
        let captured = this.innerHTML.trim() ? this.innerHTML : (this._disclosureContent || "");
        if (captured.trim()) this._disclosureContent = captured;
        const details = this.ensure("details", () => {
          const d = document.createElement("details");
          const summ = document.createElement("summary");
          summ.textContent = summary;
          d.appendChild(summ);
          const content = document.createElement("div");
          content.className = "c-disclosure__body";
          content.innerHTML = captured;
          d.appendChild(content);
          return d;
        });
        // update summary if already existed
        const summ = details.querySelector("summary");
        if (summ) summ.textContent = summary;
        const body = details.querySelector(".c-disclosure__body");
        if (body) body.innerHTML = captured;
        if (details.parentNode !== this) { this.innerHTML = ""; this.appendChild(details); }
      } else {
        const details = this.querySelector("details");
        if (details) details.remove();
      }
    }
  }
  define("contour-disclosure", ContourDisclosure);
class ContourCallout extends ContourBase {
    render() {
      this.classList.add("c-callout");
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-callout--" + variant);
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
    render() {
      this.classList.add("c-empty");
      const state = this.getAttribute("state") || "empty";
      const title = this.getAttribute("title") || (state === "filtered" ? "Nothing matches" : state === "error" ? "Could not load" : "No data yet");
      const body = this.getAttribute("body") || (state === "filtered" ? "Try clearing some filters." : state === "error" ? "Check your connection and try again." : "There is nothing to show here yet.");
      const action = this.getAttribute("action") || (state === "filtered" ? "Clear filters" : state === "error" ? "Retry" : "");
      if (title) {
        const t = this.ensure(".c-empty__title", () => { const el = document.createElement("h3"); el.className = "c-empty__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-empty__title");
        if (t) t.remove();
      }
      if (body) {
        const b = this.ensure(".c-empty__body", () => { const el = document.createElement("p"); el.className = "c-empty__body"; return el; });
        b.textContent = body;
      } else {
        const b = this.querySelector(".c-empty__body");
        if (b) b.remove();
      }
      if (action) {
        const a = this.ensure(".c-empty__action", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--primary c-empty__action"; el.type = "button"; return el; });
        a.textContent = action;
      } else {
        const a = this.querySelector(".c-empty__action");
        if (a) a.remove();
      }
    }
    enhance() {
      if (this._wiredEmpty) return;
      this._wiredEmpty = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-empty__action") : null;
        if (!btn || !this.contains(btn)) return;
        this.dispatchEvent(new CustomEvent("contour:empty-action", { detail: { state: this.getAttribute("state") || "empty" }, bubbles: true }));
      });
    }
  }
  define("contour-empty", ContourEmpty);
class ContourFaq extends ContourBase {
    render() {
      this.classList.add("c-faq");
      const question = this.getAttribute("question");
      const answer = this.getAttribute("answer");
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
  define("contour-faq", ContourFaq);
class ContourAccordion extends ContourBase {
    render() {
      this.classList.add("c-accordion");
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
    render() {
      this.classList.add("c-toast");
      const message = this.getAttribute("message");
      if (message && !this.querySelector("*") && !this.textContent.trim()) {
        this.textContent = message;
      }
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-toast--" + variant);
    }
  }
  define("contour-toast", ContourToast);
class ContourExpandable extends ContourBase {
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
  }
  define("contour-expandable", ContourExpandable);
class ContourToastHost extends ContourBase {
    render() {
      this.classList.add("c-toast-host");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
    }
  }
  define("contour-toast-host", ContourToastHost);
