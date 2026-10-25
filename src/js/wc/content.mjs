import { ContourBase, define } from './core.mjs';
class ContourCard extends ContourBase {
    render() {
      this.classList.add("c-card");
      const title = this.getAttribute("title");
      if (title) {
        const h = this.ensure(".c-card__title", () => { const el = document.createElement("h3"); el.className = "c-card__title"; return el; });
        if (h.parentNode === this && this.firstChild !== h) this.prepend(h);
        h.textContent = title;
      } else {
        const h = this.querySelector(".c-card__title");
        if (h) h.remove();
      }
    }
  }
  define("contour-card", ContourCard);
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
class ContourLink extends ContourBase {
    render() {
      this.classList.add("c-link");
      const href = this.getAttribute("href");
      const label = this.getAttribute("label");
      if (href && label) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = label;
        this.appendChild(a);
      }
    }
  }
  define("contour-link", ContourLink);
class ContourBrand extends ContourBase {
    render() {
      this.classList.add("c-brand");
      const name = this.getAttribute("name");
      const tag = this.getAttribute("tag");
      if (name) {
        const n = this.ensure(".c-brand__name", () => { const el = document.createElement("span"); el.className = "c-brand__name"; return el; });
        n.textContent = name;
      } else {
        const n = this.querySelector(".c-brand__name");
        if (n) n.remove();
      }
      if (tag) {
        const t = this.ensure(".c-brand__tag", () => { const el = document.createElement("span"); el.className = "c-brand__tag"; return el; });
        t.textContent = tag;
      } else {
        const t = this.querySelector(".c-brand__tag");
        if (t) t.remove();
      }
    }
  }
  define("contour-brand", ContourBrand);
class ContourSectionHead extends ContourBase {
    render() {
      this.classList.add("c-section-head");
      const title = this.getAttribute("title");
      const desc = this.getAttribute("desc");
      if (title) {
        const t = this.ensure(".c-section-head__title", () => { const el = document.createElement("h2"); el.className = "c-section-head__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-section-head__title");
        if (t) t.remove();
      }
      if (desc) {
        const d = this.ensure(".c-section-head__desc", () => { const el = document.createElement("p"); el.className = "c-section-head__desc"; return el; });
        d.textContent = desc;
      } else {
        const d = this.querySelector(".c-section-head__desc");
        if (d) d.remove();
      }
    }
  }
  define("contour-section-head", ContourSectionHead);
class ContourDiff extends ContourBase {
    render() {
      this.classList.add("c-diff");
      const before = this.getAttribute("before");
      const after = this.getAttribute("after");
      if (before) {
        const b = this.ensure(".c-diff__before", () => { const el = document.createElement("div"); el.className = "c-diff__before"; return el; });
        b.textContent = before;
      } else {
        const b = this.querySelector(".c-diff__before");
        if (b) b.remove();
      }
      if (after) {
        const a = this.ensure(".c-diff__after", () => { const el = document.createElement("div"); el.className = "c-diff__after"; return el; });
        a.textContent = after;
      } else {
        const a = this.querySelector(".c-diff__after");
        if (a) a.remove();
      }
    }
  }
  define("contour-diff", ContourDiff);
class ContourDoDont extends ContourBase {
    render() {
      this.classList.add("c-do-dont");
      const doText = this.getAttribute("do");
      const dontText = this.getAttribute("dont");
      if (doText) {
        const d = this.ensure(".c-do-dont__do", () => { const el = document.createElement("div"); el.className = "c-do-dont__do"; return el; });
        d.textContent = doText;
      } else {
        const d = this.querySelector(".c-do-dont__do");
        if (d) d.remove();
      }
      if (dontText) {
        const d = this.ensure(".c-do-dont__dont", () => { const el = document.createElement("div"); el.className = "c-do-dont__dont"; return el; });
        d.textContent = dontText;
      } else {
        const d = this.querySelector(".c-do-dont__dont");
        if (d) d.remove();
      }
    }
  }
  define("contour-do-dont", ContourDoDont);
class ContourFlag extends ContourBase {
    render() {
      this.classList.add("c-flag");
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-flag--" + variant);
      const label = this.getAttribute("label");
      if (label) {
        if (!this.textContent.trim()) this.textContent = label;
      }
    }
  }
  define("contour-flag", ContourFlag);
class ContourInstallFull extends ContourBase {
    render() {
      this.classList.add("c-install");
      const prompt = this.getAttribute("prompt") || "$";
      const command = this.getAttribute("command") || "";
      if (command) {
        const p = this.ensure(".c-install__prompt", () => { const el = document.createElement("span"); el.className = "c-install__prompt"; return el; });
        p.textContent = prompt;
        const c = this.ensure(".c-install__command", () => { const el = document.createElement("span"); el.className = "c-install__command"; return el; });
        c.textContent = command;
        if (this.hasAttribute("copyable")) {
          this.ensure(".c-install__copy", () => {
            const btn = document.createElement("button");
            btn.className = "c-btn c-btn--ghost c-btn--sm c-install__copy";
            btn.type = "button";
            btn.setAttribute("aria-label", "Copy command");
            btn.textContent = "Copy";
            return btn;
          });
        } else {
          const btn = this.querySelector(".c-install__copy");
          if (btn) btn.remove();
        }
      }
    }
    enhance() {
      if (this._wiredInstall) return;
      this._wiredInstall = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-install__copy") : null;
        if (!btn || !this.contains(btn)) return;
        const cmd = this.querySelector(".c-install__command");
        const text = cmd ? cmd.textContent : "";
        if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
        this.dispatchEvent(new CustomEvent("contour:copy", { detail: { text }, bubbles: true }));
      });
    }
  }
  define("contour-install", ContourInstallFull);
class ContourTestimonialFull extends ContourBase {
    render() {
      this.classList.add("c-testimonial");
      const quote = this.getAttribute("quote");
      if (quote) {
        const q = this.ensure(".c-testimonial__quote", () => { const el = document.createElement("blockquote"); el.className = "c-testimonial__quote"; return el; });
        q.textContent = quote;
      } else {
        const q = this.querySelector(".c-testimonial__quote");
        if (q) q.remove();
      }
      const name = this.getAttribute("name");
      const role = this.getAttribute("role");
      if (name) {
        const by = this.ensure(".c-testimonial__byline", () => { const el = document.createElement("div"); el.className = "c-testimonial__byline"; return el; });
        const n = by.querySelector(".c-testimonial__name") || (() => { const el = document.createElement("span"); el.className = "c-testimonial__name"; by.appendChild(el); return el; })();
        n.className = "c-testimonial__name";
        n.textContent = name;
        if (role) {
          const r = by.querySelector(".c-testimonial__role") || (() => { const el = document.createElement("span"); el.className = "c-testimonial__role"; by.appendChild(el); return el; })();
          r.className = "c-testimonial__role";
          r.textContent = role;
        } else {
          const r = by.querySelector(".c-testimonial__role");
          if (r) r.remove();
        }
      } else {
        const by = this.querySelector(".c-testimonial__byline");
        if (by) by.remove();
      }
    }
  }
  define("contour-testimonial", ContourTestimonialFull);
class ContourShowcaseFull extends ContourBase {
    render() {
      this.classList.add("c-showcase");
      if (this.hasAttribute("reverse")) this.classList.add("c-showcase--reverse");
      else this.classList.remove("c-showcase--reverse");
      const title = this.getAttribute("title");
      const text = this.getAttribute("text");
      const media = this.getAttribute("media");
      if (media) {
        const m = this.ensure(".c-showcase__media", () => { const el = document.createElement("div"); el.className = "c-showcase__media"; return el; });
        m.innerHTML = media;
      } else {
        const m = this.querySelector(".c-showcase__media");
        if (m) m.remove();
      }
      if (title) {
        const t = this.ensure(".c-showcase__title", () => { const el = document.createElement("h3"); el.className = "c-showcase__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-showcase__title");
        if (t) t.remove();
      }
      if (text) {
        const p = this.ensure(".c-showcase__text", () => { const el = document.createElement("p"); el.className = "c-showcase__text"; return el; });
        p.textContent = text;
      } else {
        const p = this.querySelector(".c-showcase__text");
        if (p) p.remove();
      }
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const ul = this.ensure(".c-showcase__list", () => { const el = document.createElement("ul"); el.className = "c-showcase__list"; return el; });
          ul.innerHTML = "";
          parsed.forEach((it) => {
            const li = document.createElement("li");
            li.textContent = typeof it === "string" ? it : it.label;
            ul.appendChild(li);
          });
        } catch (e) { /* keep existing */ }
      } else {
        const ul = this.querySelector(".c-showcase__list");
        if (ul) ul.remove();
      }
    }
  }
  define("contour-showcase", ContourShowcaseFull);
class ContourPricingFull extends ContourBase {
    render() {
      this.classList.add("c-pricing");
      const price = this.getAttribute("price");
      if (price) {
        const p = this.ensure(".c-price", () => { const el = document.createElement("div"); el.className = "c-price"; return el; });
        p.textContent = price;
      } else {
        const p = this.querySelector(".c-price");
        if (p) p.remove();
      }
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-pricing__label", () => { const el = document.createElement("div"); el.className = "c-pricing__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-pricing__label");
        if (l) l.remove();
      }
      const features = this.getAttribute("features");
      if (features) {
        try {
          const parsed = JSON.parse(features);
          const ul = document.createElement("ul");
          parsed.forEach((f) => {
            const li = document.createElement("li");
            li.textContent = typeof f === "string" ? f : f.label;
            ul.appendChild(li);
          });
          this.appendChild(ul);
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-pricing", ContourPricingFull);
class ContourRecipeFull extends ContourBase {
    render() {
      this.classList.add("c-recipe");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-recipe__title", () => { const el = document.createElement("h3"); el.className = "c-recipe__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-recipe__title");
        if (t) t.remove();
      }
      const body = this.getAttribute("body");
      if (body) {
        const b = this.ensure(".c-recipe__body", () => { const el = document.createElement("p"); el.className = "c-recipe__body"; return el; });
        b.textContent = body;
      } else {
        const b = this.querySelector(".c-recipe__body");
        if (b) b.remove();
      }
    }
  }
  define("contour-recipe", ContourRecipeFull);
class ContourLogosFull extends ContourBase {
    render() { this.classList.add("c-logos"); }
  }
  define("contour-logos", ContourLogosFull);
class ContourLandingFeaturesFull extends ContourBase {
    render() { this.classList.add("c-landing-features"); }
  }
  define("contour-landing-features", ContourLandingFeaturesFull);
class ContourLandingHeroFull extends ContourBase {
    render() { this.classList.add("c-landing-hero"); }
  }
  define("contour-landing-hero", ContourLandingHeroFull);
class ContourLinkishFull extends ContourBase {
    render() { this.classList.add("c-linkish"); }
  }
  define("contour-linkish", ContourLinkishFull);
class ContourPriceFull extends ContourBase {
    render() {
      this.classList.add("c-price");
      const value = this.getAttribute("value");
      if (value && !this.querySelector("*") && !this.textContent.trim()) this.textContent = value;
    }
  }
  define("contour-price", ContourPriceFull);
class ContourProseFull extends ContourBase {
    render() { this.classList.add("c-prose"); }
  }
  define("contour-prose", ContourProseFull);
class ContourPanel extends ContourBase {
    render() {
      this.classList.add("c-panel");
      const title = this.getAttribute("title");
      const subtitle = this.getAttribute("subtitle");
      const status = this.getAttribute("status");
      if (title) {
        const h = this.ensure(".c-panel__title", () => { const el = document.createElement("h3"); el.className = "c-panel__title"; return el; });
        if (h.parentNode === this && this.firstChild !== h) this.prepend(h);
        h.textContent = title;
      } else {
        const h = this.querySelector(".c-panel__title");
        if (h) h.remove();
      }
      if (subtitle) {
        const sub = this.ensure(".c-panel__subtitle", () => { const el = document.createElement("p"); el.className = "c-panel__subtitle"; return el; });
        sub.textContent = subtitle;
      } else {
        const sub = this.querySelector(".c-panel__subtitle");
        if (sub) sub.remove();
      }
      if (status) {
        const st = this.ensure(".c-panel__status", () => { const el = document.createElement("span"); el.className = "c-panel__status"; return el; });
        st.textContent = status;
      } else {
        const st = this.querySelector(".c-panel__status");
        if (st) st.remove();
      }
    }
  }
  define("contour-panel", ContourPanel);
class ContourCta extends ContourBase {
    render() {
      this.classList.add("c-cta");
      const title = this.getAttribute("title");
      const text = this.getAttribute("text");
      if (title) {
        const t = this.ensure(".c-cta__title", () => { const el = document.createElement("h3"); el.className = "c-cta__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-cta__title");
        if (t) t.remove();
      }
      if (text) {
        const p = this.ensure(".c-cta__text", () => { const el = document.createElement("p"); el.className = "c-cta__text"; return el; });
        p.textContent = text;
      } else {
        const p = this.querySelector(".c-cta__text");
        if (p) p.remove();
      }
      const actions = this.getAttribute("actions");
      if (actions) {
        try {
          const parsed = JSON.parse(actions);
          const wrap = document.createElement("div");
          wrap.className = "c-cta__actions";
          parsed.forEach((a) => {
            const btn = document.createElement("button");
            btn.className = "c-btn c-btn--primary";
            btn.type = "button";
            btn.textContent = typeof a === "string" ? a : (a.label || a);
            wrap.appendChild(btn);
          });
          this.appendChild(wrap);
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-cta", ContourCta);
class ContourCode extends ContourBase {
    render() {
      this.classList.add("c-code");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-code__title", () => { const el = document.createElement("div"); el.className = "c-code__title"; return el; });
        if (t.parentNode === this && this.firstChild !== t) this.prepend(t);
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-code__title");
        if (t) t.remove();
      }
      if (this.hasAttribute("copyable")) {
        this.ensure(".c-code__copy", () => {
          const btn = document.createElement("button");
          btn.className = "c-code__copy";
          btn.type = "button";
          btn.textContent = "Copy";
          return btn;
        });
      } else {
        const btn = this.querySelector(".c-code__copy");
        if (btn) btn.remove();
      }
    }
    enhance() {
      if (this._wiredCode) return;
      this._wiredCode = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-code__copy") : null;
        if (!btn || !this.contains(btn)) return;
        const text = this.textContent;
        if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
        this.dispatchEvent(new CustomEvent("contour:copy", { detail: { text }, bubbles: true }));
      });
    }
  }
  define("contour-code", ContourCode);
class ContourPlate extends ContourBase {
    render() { this.classList.add("c-plate"); }
  }
  define("contour-plate", ContourPlate);
class ContourPullquote extends ContourBase {
    render() {
      this.classList.add("c-pullquote");
      const quote = this.getAttribute("quote");
      if (quote) {
        const q = this.ensure(".c-pullquote__quote", () => { const el = document.createElement("blockquote"); el.className = "c-pullquote__quote"; return el; });
        q.textContent = quote;
      } else {
        const q = this.querySelector(".c-pullquote__quote");
        if (q) q.remove();
      }
      const name = this.getAttribute("name");
      if (name) {
        const by = this.ensure(".c-pullquote__byline", () => { const el = document.createElement("div"); el.className = "c-pullquote__byline"; return el; });
        by.textContent = name;
      } else {
        const by = this.querySelector(".c-pullquote__byline");
        if (by) by.remove();
      }
    }
  }
  define("contour-pullquote", ContourPullquote);
class ContourAnchor extends ContourBase {
    render() {
      this.classList.add("c-anchor");
      const href = this.getAttribute("href");
      const label = this.getAttribute("label");
      if (href && label) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = label;
        this.appendChild(a);
      }
    }
  }
  define("contour-anchor", ContourAnchor);
