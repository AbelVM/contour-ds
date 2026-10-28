import { ContourBase, define, onDispose } from './core.mjs';
import { loadRemote, remoteData, renderStates, renderEmpty, wireStates } from './states.mjs';
import { wireRemovable, modalContain } from './behaviours.mjs';
class ContourDialog extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-dialog");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
      const title = this.getAttribute("title");
      let head = this.querySelector(".c-dialog__head");
      if (title) {
        if (!head) {
          head = document.createElement("div");
          head.className = "c-dialog__head";
          const h = document.createElement("h2");
          h.className = "c-dialog__title";
          head.appendChild(h);
          const closeBtn = document.createElement("button");
          closeBtn.className = "c-btn c-btn--icon c-btn--ghost c-dialog__close";
          closeBtn.setAttribute("type", "button");
          closeBtn.setAttribute("aria-label", "Close");
          closeBtn.innerHTML = '<svg aria-hidden="true"><use href="#i-close" /></svg>';
          head.appendChild(closeBtn);
        }
        const h = head.querySelector(".c-dialog__title");
        if (h) h.textContent = title;
      }
      if (head && head.parentNode !== this) this.prepend(head);
      // Wrap authored content in a body so it picks up the dialog's padding.
      const body = this.ensure(".c-dialog__body", () => { const el = document.createElement("div"); el.className = "c-dialog__body"; return el; });
      Array.from(this.childNodes).forEach((n) => {
        if (n === body || n === head) return;
        if (n.nodeType === 1 && n.classList && n.classList.contains("c-dialog__head")) return;
        body.appendChild(n);
      });
      if (head && head.parentNode === this) {
        if (body.parentNode !== this) this.insertBefore(body, head.nextSibling);
        else if (head.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_PRECEDING) this.insertBefore(body, head.nextSibling);
      } else {
        if (body.parentNode !== this) this.appendChild(body);
      }
    }
    enhance() {
      if (this._wiredDialog) return;
      this._wiredDialog = true;
      onDispose(this, () => modalContain(this, false));
      // The open state is carried by the `open` attribute so CSS can target it
      // and a caller can read host.open; it is written here and never observed,
      // so changing it cannot re-enter the render (the shared list excludes it
      // for exactly this reason).
      this.show = () => {
        if (this.hasAttribute("open")) return;
        this._dialogLastFocus = document.activeElement;
        this.setAttribute("open", "");
        const dlg = this.querySelector("dialog") || (this.tagName === "DIALOG" ? this : null);
        if (dlg && typeof dlg.showModal === "function") { try { dlg.showModal(); } catch (e) {} }
        modalContain(this, true);
        // Focus the close button or the first focusable, like the shadow twin.
        const focusable = this.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
        if (focusable) { try { focusable.focus(); } catch (e) {} }
        this.dispatchEvent(new CustomEvent("contour:open", { bubbles: true, composed: true }));
      };
      this.close = () => {
        const wasOpen = this.hasAttribute("open");
        const dlg = this.querySelector("dialog") || (this.tagName === "DIALOG" ? this : null);
        if (dlg && typeof dlg.close === "function") dlg.close();
        if (this.hasAttribute("open")) this.removeAttribute("open");
        if (wasOpen) {
          modalContain(this, false);
          this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
          const last = this._dialogLastFocus;
          if (last && typeof last.focus === "function") { try { last.focus(); } catch (e) {} }
        }
      };
      this.focus = () => {
        const focusable = this.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
        if (focusable) { try { focusable.focus(); } catch (e) {} }
        else { try { HTMLElement.prototype.focus.call(this); } catch (e) {} }
      };
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-dialog__close") : null;
        if (!btn || !this.contains(btn)) return;
        this.close();
      });
      // Close on Escape, only while open: a dialog that is not open has no
      // close to report, and an unconditional event is a claim the component
      // cannot back (F-18).
      this.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.hasAttribute("open")) this.close();
      });
    }
  }
  define("contour-dialog", ContourDialog);
class ContourAlert extends ContourBase {
    static get observed() { return ["title", "body", "variant", "icon", "closable", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() {
      return { title: { attribute: "title" }, body: { attribute: "body" }, variant: { attribute: "variant" }, icon: { attribute: "icon" }, closable: { attribute: "closable", type: Boolean } };
    }
    render() {
      this.classList.add("c-alert");
      // ARIA: an alert is a live region (parity with the shadow layer, which sets
      // the same pair on every .c-alert). Written on the host, so the authored
      // attributes win and the loader's state nodes announce inside the region.
      if (!this.hasAttribute("role")) this.setAttribute("role", "alert");
      if (!this.hasAttribute("aria-live")) this.setAttribute("aria-live", "assertive");
      wireStates(this);
      loadRemote(this, "title");
      if (renderStates(this, "alert")) return;
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
      const title = this.getAttribute("title") || (this._remoteData && this._remoteData.title);
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
      if (!title && !body && !icon) {
        renderEmpty(this, "alert");
      }
    }
  }
  ContourAlert.prototype.enhance = function() {
    if (this._wiredAlert) return;
    this._wiredAlert = true;
    this.addEventListener("click", (e) => {
      const btn = e.target && e.target.closest ? e.target.closest(".c-alert__close") : null;
      if (!btn || !this.contains(btn)) return;
      e.preventDefault();
      this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
      this.remove();
    });
  };
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
          summ.className = "c-disclosure__summary";
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
    static get observed() { return ["question", "answer", "items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { question: { attribute: "question" }, answer: { attribute: "answer" }, items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-faq");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "faq")) return;
      const items = remoteData(this, "items");
      const question = this.getAttribute("question");
      const answer = this.getAttribute("answer");
      const authored = Array.from(this.children).filter((n) => n.classList && n.classList.contains("c-faq__item"));
      if (items && !authored.length) {
        try {
          const parsed = JSON.parse(items);
          Array.from(this.querySelectorAll(".c-faq__item")).forEach((n) => n.remove());
          parsed.forEach((it, i) => {
            // Native disclosure, the same shape the guide authors: details +
            // summary, so the [open] styling and the marker hiding apply. The
            // first item opens like the guide's own FAQ section does.
            const item = document.createElement("details");
            item.className = "c-faq__item";
            if (i === 0) item.setAttribute("open", "");
            const q = document.createElement("summary");
            q.className = "c-faq__question";
            q.textContent = typeof it === "string" ? it : (it.question || it.q || "");
            const sign = document.createElement("span");
            sign.className = "c-faq__sign";
            sign.setAttribute("aria-hidden", "true");
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
       } else if (!items) {
         if (!question && !answer) {
           renderEmpty(this, "faq");
         } else {
           const item = this.ensure("details.c-faq__item", () => { const el = document.createElement("details"); el.className = "c-faq__item"; return el; });
           if (!item.hasAttribute("open")) item.setAttribute("open", "");
           const q = this.ensure("summary.c-faq__question", () => { const el = document.createElement("summary"); el.className = "c-faq__question"; return el; }, item);
           q.textContent = question || "";
           const sign = this.ensure(".c-faq__sign", () => { const el = document.createElement("span"); el.className = "c-faq__sign"; return el; }, q);
           sign.setAttribute("aria-hidden", "true");
           sign.innerHTML = '<svg aria-hidden="true"><use href="#i-plus" /></svg>';
           const a = this.ensure(".c-faq__answer", () => { const el = document.createElement("div"); el.className = "c-faq__answer"; return el; }, item);
           a.textContent = answer || "";
         }
       }
    }
  }
define("contour-faq", ContourFaq);
class ContourAccordion extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" } }; }
    render() {
      // The host is a plain container; the children carry .c-disclosure, which
      // is the block that owns the styling. No .c-accordion rule exists, so the
      // host class is dropped rather than invented.
      const authored = Array.from(this.children).filter((n) => n.tagName === "DETAILS");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "accordion")) return;
      const items = remoteData(this, "items");
      if (items && !authored.length) {
        Array.from(this.querySelectorAll("details.c-disclosure")).forEach((d) => d.remove());
        try {
          const parsed = JSON.parse(items);
          parsed.forEach((item) => {
            const details = document.createElement("details");
            details.className = "c-disclosure";
            const summary = document.createElement("summary");
            summary.className = "c-disclosure__summary";
            summary.textContent = item.title || item.question || item.q || item.label || "";
            details.appendChild(summary);
            const body = document.createElement("div");
            body.className = "c-disclosure__body";
            body.textContent = item.body || item.answer || item.a || item.content || "";
            details.appendChild(body);
            this.appendChild(details);
          });
         } catch (e) { /* keep existing */ }
       } else if (!items && !authored.length) {
         renderEmpty(this, "accordion");
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
    static get observed() { return ["title", "body"]; }
    static get properties() { return { title: { attribute: "title" }, body: { attribute: "body" } }; }
    render() {
      this.classList.add("c-drawer");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
      const title = this.getAttribute("title");
      let head = this.querySelector(".c-drawer__head");
      if (title) {
        if (!head) {
          head = document.createElement("div");
          head.className = "c-drawer__head";
          const t = document.createElement("div");
          t.className = "c-drawer__title";
          head.appendChild(t);
          const closeBtn = document.createElement("button");
          closeBtn.className = "c-btn c-btn--icon c-btn--ghost c-drawer__close";
          closeBtn.setAttribute("type", "button");
          closeBtn.setAttribute("aria-label", "Close");
          closeBtn.innerHTML = '<svg aria-hidden="true"><use href="#i-close" /></svg>';
          head.appendChild(closeBtn);
        }
        const t = head.querySelector(".c-drawer__title");
        if (t) t.textContent = title;
        if (head.parentNode !== this) this.prepend(head);
      } else if (head) {
        head.remove();
      }
      // Open state is the `open` attribute (written, never observed, so it
      // cannot re-enter the render — see the dialog); the `.is-open` class the
      // CSS keys off is re-derived here because the base restores the authored
      // class on every render and would otherwise drop it mid-lock.
      if (this.hasAttribute("open")) this.classList.add("is-open");
      const body = this.getAttribute("body");
      const b = this.querySelector(".c-drawer__body");
      const authored = b ? Array.from(b.children) : [];
      if (body && !authored.length) {
        const el = this.ensure(".c-drawer__body", () => { const e = document.createElement("div"); e.className = "c-drawer__body"; return e; });
        el.innerHTML = body;
      } else if (!body && b && !authored.length) {
        b.remove();
      }
    }
    enhance() {
      if (this._wiredDrawer) return;
      this._wiredDrawer = true;
      onDispose(this, () => modalContain(this, false));
      // Open state is the `open` attribute; the close button clears it and
      // reports a real close.
      this.show = () => {
        if (this.hasAttribute("open")) return;
        this.setAttribute("open", "");
        this.classList.add("is-open");
        modalContain(this, true);
        this.dispatchEvent(new CustomEvent("contour:open", { bubbles: true, composed: true }));
      };
      this.close = () => {
        if (!this.hasAttribute("open")) return;
        this.removeAttribute("open");
        this.classList.remove("is-open");
        modalContain(this, false);
        this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
      };
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-drawer__close") : null;
        if (!btn || !this.contains(btn)) return;
        this.close();
      });
    }
  }
  define("contour-drawer", ContourDrawer);
class ContourSheet extends ContourBase {
    static get observed() { return ["title", "body"]; }
    static get properties() { return { title: { attribute: "title" }, body: { attribute: "body" } }; }
    render() {
      this.classList.add("c-sheet");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
      const title = this.getAttribute("title");
      let head = this.querySelector(".c-sheet__head");
      if (title) {
        if (!head) {
          head = document.createElement("div");
          head.className = "c-sheet__head";
          const t = document.createElement("div");
          t.className = "c-sheet__title";
          head.appendChild(t);
          const closeBtn = document.createElement("button");
          closeBtn.className = "c-btn c-btn--icon c-btn--ghost c-sheet__close";
          closeBtn.setAttribute("type", "button");
          closeBtn.setAttribute("aria-label", "Close");
          closeBtn.innerHTML = '<svg aria-hidden="true"><use href="#i-close" /></svg>';
          head.appendChild(closeBtn);
        }
        const t = head.querySelector(".c-sheet__title");
        if (t) t.textContent = title;
        if (head.parentNode !== this) this.prepend(head);
      } else if (head) {
        head.remove();
      }
      // Open state is the `open` attribute (written, never observed, so it
      // cannot re-enter the render); the `.is-open` class is re-derived because
      // the base restores the authored class on every render (see the drawer).
      if (this.hasAttribute("open")) this.classList.add("is-open");
      const body = this.getAttribute("body");
      const b = this.querySelector(".c-sheet__body");
      const authored = b ? Array.from(b.children) : [];
      if (body && !authored.length) {
        const el = this.ensure(".c-sheet__body", () => { const e = document.createElement("div"); e.className = "c-sheet__body"; return e; });
        el.innerHTML = body;
      } else if (!body && b && !authored.length) {
        b.remove();
      }
    }
    enhance() {
      if (this._wiredSheet) return;
      this._wiredSheet = true;
      onDispose(this, () => modalContain(this, false));
      this.show = () => {
        if (this.hasAttribute("open")) return;
        this.setAttribute("open", "");
        this.classList.add("is-open");
        modalContain(this, true);
        this.dispatchEvent(new CustomEvent("contour:open", { bubbles: true, composed: true }));
      };
      this.close = () => {
        if (!this.hasAttribute("open")) return;
        this.removeAttribute("open");
        this.classList.remove("is-open");
        modalContain(this, false);
        this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
      };
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-sheet__close") : null;
        if (!btn || !this.contains(btn)) return;
        this.close();
      });
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
      if (message && !this.hasChildNodes()) {
        this.textContent = message;
      }
      const variant = this.getAttribute("variant");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-toast--")) this.classList.remove(c); });
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
          summ.className = "c-disclosure__summary";
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
