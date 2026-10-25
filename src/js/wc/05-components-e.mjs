import { ContourBase, define } from './00-core.mjs';
  // ---- Additional complex components with scaffolding ----

  // Callout: generates icon + title + body.
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

  // Empty state: generates icon + title + body + action.
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

  // FAQ: generates question + answer.
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

  // Feature: generates icon + title + body.
  class ContourFeature extends ContourBase {
    render() {
      this.classList.add("c-feature");
      const title = this.getAttribute("title");
      const body = this.getAttribute("body");
      const icon = this.getAttribute("icon");
      if (icon) {
        const i = this.ensure(".c-feature__icon", () => {
          const el = document.createElement("div");
          el.className = "c-feature__icon";
          const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("aria-hidden", "true");
          const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
          use.setAttribute("href", "#" + String(icon).replace(/[^a-zA-Z0-9_-]/g, ""));
          svg.appendChild(use);
          el.appendChild(svg);
          return el;
        });
        const use = i.querySelector("use");
        if (use) use.setAttribute("href", "#" + String(icon).replace(/[^a-zA-Z0-9_-]/g, ""));
      } else {
        const i = this.querySelector(".c-feature__icon");
        if (i) i.remove();
      }
      if (title) {
        const t = this.ensure(".c-feature__title", () => { const el = document.createElement("h3"); el.className = "c-feature__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-feature__title");
        if (t) t.remove();
      }
      if (body) {
        const b = this.ensure(".c-feature__body", () => { const el = document.createElement("p"); el.className = "c-feature__body"; return el; });
        b.textContent = body;
      } else {
        const b = this.querySelector(".c-feature__body");
        if (b) b.remove();
      }
    }
  }
  define("contour-feature", ContourFeature);

  // Code tabs: generates tab list + panels.
  class ContourCodeTabs extends ContourBase {
    render() {
      this.classList.add("c-code-tabs");
      const tabs = this.getAttribute("tabs");
      if (tabs) {
        try {
          const parsed = JSON.parse(tabs);
          const list = this.ensure(".c-code-tabs__list", () => { const el = document.createElement("div"); el.className = "c-code-tabs__list"; el.setAttribute("role", "tablist"); return el; });
          list.setAttribute("role", "tablist");
          list.innerHTML = "";
          parsed.forEach((t, i) => {
            const btn = document.createElement("button");
            btn.className = "c-code-tabs__tab" + (i === 0 ? " c-code-tabs__tab--active" : "");
            btn.setAttribute("role", "tab");
            btn.setAttribute("aria-selected", String(i === 0));
            btn.tabIndex = i === 0 ? 0 : -1;
            btn.textContent = typeof t === "string" ? t : t.label;
            list.appendChild(btn);
          });
          if (list.parentNode !== this) this.prepend(list);
        } catch (e) { /* keep existing */ }
      } else {
        const list = this.querySelector(".c-code-tabs__list");
        if (list) list.remove();
      }
    }
    enhance() {
      if (this._wiredCodeTabs) return;
      this._wiredCodeTabs = true;
      const activate = (tab, focus) => {
        const list = this.querySelector(".c-code-tabs__list");
        if (!list) return;
        const tabs = Array.from(list.querySelectorAll("[role='tab']"));
        tabs.forEach((t) => {
          const selected = t === tab;
          t.setAttribute("aria-selected", String(selected));
          t.tabIndex = selected ? 0 : -1;
          t.classList.toggle("c-code-tabs__tab--active", selected);
          const ctrl = t.getAttribute("aria-controls");
          if (ctrl) {
            const panel = document.getElementById(ctrl) || this.querySelector("#" + CSS.escape(ctrl));
            if (panel) panel.hidden = !selected;
          }
        });
        const panels = Array.from(this.querySelectorAll(".c-code-tabs__panel"));
        if (panels.length) {
          const idx = tabs.indexOf(tab);
          panels.forEach((p, i) => { p.hidden = i !== idx; });
        }
        if (focus) try { tab.focus(); } catch (e) {}
      };
      this.addEventListener("click", (e) => {
        const tab = e.target && e.target.closest ? e.target.closest("[role='tab']") : null;
        if (tab && this.contains(tab)) activate(tab, false);
      });
      this.addEventListener("keydown", (e) => {
        const tab = e.target && e.target.closest ? e.target.closest("[role='tab']") : null;
        if (!tab) return;
        const list = this.querySelector(".c-code-tabs__list");
        if (!list) return;
        const tabs = Array.from(list.querySelectorAll("[role='tab']"));
        const index = tabs.indexOf(tab);
        const map = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
        if (!(e.key in map)) return;
        e.preventDefault();
        const next = tabs[(map[e.key] + tabs.length) % tabs.length];
        if (next) activate(next, true);
      });
      const first = this.querySelector(".c-code-tabs__list [role='tab']");
      if (first) activate(first, false);
    }
  }
  define("contour-code-tabs", ContourCodeTabs);

  // Steps: generates numbered steps.
  class ContourSteps extends ContourBase {
    render() {
      this.classList.add("c-steps");
      const steps = this.getAttribute("steps");
      if (steps) {
        try {
          const parsed = JSON.parse(steps);
          parsed.forEach((s, i) => {
            const item = document.createElement("div");
            item.className = "c-steps__item";
            const num = document.createElement("span");
            num.className = "c-steps__num";
            num.textContent = String(i + 1);
            item.appendChild(num);
            const text = document.createElement("span");
            text.className = "c-steps__text";
            text.textContent = typeof s === "string" ? s : s.text;
            item.appendChild(text);
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-steps", ContourSteps);

  // Callout: already defined above.

  // Accordion: generates details/summary.
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


