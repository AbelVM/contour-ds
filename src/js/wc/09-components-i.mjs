import { ContourBase, define } from './00-core.mjs';
  // ---- Expanded scaffolding for remaining components ----

  // Install: generates prompt + command + copy button.
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

  // Pager: generates prev/next links.
  class ContourPagerFull extends ContourBase {
    render() {
      this.classList.add("c-pager");
      const prev = this.getAttribute("prev");
      const next = this.getAttribute("next");
      if (prev) {
        const a = document.createElement("a");
        a.className = "c-pager__link";
        a.href = prev.split("|")[1] || "#";
        const dir = document.createElement("span");
        dir.className = "c-pager__dir";
        dir.textContent = "← Previous";
        a.appendChild(dir);
        const title = document.createElement("span");
        title.className = "c-pager__title";
        title.textContent = prev.split("|")[0];
        a.appendChild(title);
        this.appendChild(a);
      }
      if (next) {
        const a = document.createElement("a");
        a.className = "c-pager__link c-pager__link--next";
        a.href = next.split("|")[1] || "#";
        const dir = document.createElement("span");
        dir.className = "c-pager__dir";
        dir.textContent = "Next →";
        a.appendChild(dir);
        const title = document.createElement("span");
        title.className = "c-pager__title";
        title.textContent = next.split("|")[0];
        a.appendChild(title);
        this.appendChild(a);
      }
    }
  }
  define("contour-pager", ContourPagerFull);

  // TOC: generates title + list from items.
  class ContourTocFull extends ContourBase {
    render() {
      this.classList.add("c-toc");
      const title = this.getAttribute("title") || "On this page";
      const items = this.getAttribute("items");
      const titleEl = this.ensure(".c-toc__title", () => { const el = document.createElement("div"); el.className = "c-toc__title"; return el; });
      titleEl.textContent = title;
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const list = this.ensure(".c-toc__list", () => { const el = document.createElement("nav"); el.className = "c-toc__list"; return el; });
          list.className = "c-toc__list";
          list.setAttribute("aria-label", title);
          list.innerHTML = "";
          parsed.forEach((item) => {
            const a = document.createElement("a");
            a.className = "c-toc__link" + (item.sub ? " c-toc__link--sub" : "");
            a.href = item.href || "#";
            a.textContent = item.label || item;
            if (item.current) a.setAttribute("aria-current", "true");
            list.appendChild(a);
          });
        } catch (e) { /* keep existing */ }
      } else {
        const list = this.querySelector(".c-toc__list");
        if (list) list.remove();
      }
    }
  }
  define("contour-toc", ContourTocFull);

  // Version banner: generates icon + message.
  class ContourVersionBannerFull extends ContourBase {
    render() {
      this.classList.add("c-version-banner");
      const message = this.getAttribute("message");
      if (message && !this.textContent.trim()) {
        const icon = document.createElement("svg");
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = '<use href="#i-info" />';
        this.appendChild(icon);
        const span = document.createElement("span");
        span.textContent = message;
        this.appendChild(span);
      }
    }
  }
  define("contour-version-banner", ContourVersionBannerFull);

  // Testimonial: generates quote + byline.
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

  // Showcase: generates media + title + text + list.
  // Note: the `media` attribute is intentionally treated as raw HTML so a
  // consumer can embed arbitrary media markup (images, video, iframes). It is
  // NOT sanitized — only pass trusted content; sanitize untrusted input first.
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

  // Pricing: generates price + features.
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

  // Recipe: generates title + body.
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

  // Pressable: ensures role + tabindex.
  class ContourPressableFull extends ContourBase {
    render() {
      this.classList.add("c-pressable");
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
    }
  }
  define("contour-pressable", ContourPressableFull);

  // Resize handle: ensures role.
  class ContourResizeHandleFull extends ContourBase {
    render() {
      this.classList.add("c-resize-handle");
      if (!this.hasAttribute("role")) this.setAttribute("role", "separator");
    }
  }
  define("contour-resize-handle", ContourResizeHandleFull);

  // Search trigger: generates kbd hint.
  class ContourSearchTriggerFull extends ContourBase {
    render() {
      this.classList.add("c-search-trigger");
      const label = this.getAttribute("label") || "Search";
      const span = this.ensure("span", () => { const el = document.createElement("span"); return el; });
      if (!span.textContent.trim() || span.textContent.trim() !== label) span.textContent = label;
      const kbd = this.ensure("kbd.c-kbd", () => { const el = document.createElement("kbd"); el.className = "c-kbd"; return el; });
      kbd.className = "c-kbd";
      kbd.textContent = this.getAttribute("shortcut") || "⌘K";
    }
  }
  define("contour-search-trigger", ContourSearchTriggerFull);

  // Shortcut list/row/panel/overlay: simple class wrappers with scaffolding.
  class ContourShortcutListFull extends ContourBase {
    render() { this.classList.add("c-shortcut-list"); }
  }
  define("contour-shortcut-list", ContourShortcutListFull);

  class ContourShortcutRowFull extends ContourBase {
    render() {
      this.classList.add("c-shortcut-row");
      const key = this.getAttribute("key");
      const desc = this.getAttribute("desc");
      if (key) {
        const k = this.ensure(".c-shortcut-row__key", () => { const el = document.createElement("kbd"); el.className = "c-kbd"; return el; });
        k.className = "c-kbd";
        k.textContent = key;
      } else {
        const k = this.querySelector("kbd.c-kbd");
        if (k) k.remove();
      }
      if (desc) {
        const s = this.ensure(".c-shortcut-row__desc", () => { const el = document.createElement("span"); return el; });
        s.textContent = desc;
      } else {
        // remove the desc span if present (the one without class)
      }
    }
  }
  define("contour-shortcut-row", ContourShortcutRowFull);

  class ContourShortcutPanelFull extends ContourBase {
    render() { this.classList.add("c-shortcut-panel"); }
  }
  define("contour-shortcut-panel", ContourShortcutPanelFull);

  class ContourShortcutOverlayFull extends ContourBase {
    render() { this.classList.add("c-shortcut-overlay"); }
  }
  define("contour-shortcut-overlay", ContourShortcutOverlayFull);

  // Row action: simple wrapper.
  class ContourRowActionFull extends ContourBase {
    render() { this.classList.add("c-row-action"); }
  }
  define("contour-row-action", ContourRowActionFull);

  // Metrics: simple wrapper.
  class ContourMetricsFull extends ContourBase {
    render() { this.classList.add("c-metrics"); }
  }
  define("contour-metrics", ContourMetricsFull);

  // Logos: simple wrapper.
  class ContourLogosFull extends ContourBase {
    render() { this.classList.add("c-logos"); }
  }
  define("contour-logos", ContourLogosFull);

  // Landing features/hero: simple wrappers.
  class ContourLandingFeaturesFull extends ContourBase {
    render() { this.classList.add("c-landing-features"); }
  }
  define("contour-landing-features", ContourLandingFeaturesFull);

  class ContourLandingHeroFull extends ContourBase {
    render() { this.classList.add("c-landing-hero"); }
  }
  define("contour-landing-hero", ContourLandingHeroFull);

  // Linkish: simple wrapper.
  class ContourLinkishFull extends ContourBase {
    render() { this.classList.add("c-linkish"); }
  }
  define("contour-linkish", ContourLinkishFull);

  // Compass: simple wrapper.
  class ContourCompassFull extends ContourBase {
    render() { this.classList.add("c-compass"); }
  }
  define("contour-compass", ContourCompassFull);

  // Reserved: simple wrapper.
  class ContourReservedFull extends ContourBase {
    render() { this.classList.add("c-reserved"); }
  }
  define("contour-reserved", ContourReservedFull);

  // Price: simple wrapper with value.
  class ContourPriceFull extends ContourBase {
    render() {
      this.classList.add("c-price");
      const value = this.getAttribute("value");
      if (value && !this.querySelector("*") && !this.textContent.trim()) this.textContent = value;
    }
  }
  define("contour-price", ContourPriceFull);

  // Prose: simple wrapper.
  class ContourProseFull extends ContourBase {
    render() { this.classList.add("c-prose"); }
  }
  define("contour-prose", ContourProseFull);

  // Theme scope: simple wrapper.
  class ContourThemeScopeFull extends ContourBase {
    render() { this.classList.add("c-theme-scope"); }
  }
  define("contour-theme-scope", ContourThemeScopeFull);

  // Segmented: class wrapper with aria-pressed wiring.
  class ContourSegmented extends ContourBase {
    render() { this.classList.add("c-segmented"); }
    enhance() {
      if (this._wiredSegmented) return;
      this._wiredSegmented = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest("button") : null;
        if (!btn || !this.contains(btn)) return;
        const options = Array.from(this.querySelectorAll("button"));
        options.forEach((o) => o.setAttribute("aria-pressed", String(o === btn)));
        this.dispatchEvent(new CustomEvent("contour:change", { detail: { value: btn.dataset.value || btn.textContent }, bubbles: true }));
      });
    }
  }
  define("contour-segmented", ContourSegmented);


  // Install: already defined above.

  // Pager: already defined above.

  // TOC: already defined above.

  // Version banner: already defined above.

  // Testimonial: already defined above.

  // Showcase: already defined above.

  // Pricing: already defined above.

  // Recipe: already defined above.

  // Pressable: already defined above.

  // Resize handle: already defined above.

  // Search trigger: already defined above.

  // Shortcut list: already defined above.

  // Shortcut row: already defined above.

  // Shortcut panel: already defined above.

  // Shortcut overlay: already defined above.

  // Row action: already defined above.

  // Metrics: already defined above.

  // Logos: already defined above.

  // Landing features: already defined above.

  // Landing hero: already defined above.

  // Linkish: already defined above.

  // Compass: already defined above.

  // Reserved: already defined above.

  // Price: already defined above.

  // Prose: already defined above.

  // Theme scope: already defined above.

  // Field: already defined above.

  // Panel: generates head + body + foot from attributes.
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

  // Legend: generates title + items from attributes.
  class ContourLegend extends ContourBase {
    render() {
      this.classList.add("c-legend");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-legend__title", () => { const el = document.createElement("div"); el.className = "c-legend__title"; return el; });
        t.textContent = title;
      } else {
        const t = this.querySelector(".c-legend__title");
        if (t) t.remove();
      }
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const list = this.ensure(".c-legend__items", () => { const el = document.createElement("div"); el.className = "c-legend__items"; return el; });
          list.innerHTML = "";
          parsed.forEach((it) => {
            const item = document.createElement("div");
            item.className = "c-legend__item";
            const sw = document.createElement("span");
            sw.className = "c-legend__swatch";
            if (it.color) sw.style.background = it.color;
            item.appendChild(sw);
            const lbl = document.createElement("span");
            lbl.textContent = typeof it === "string" ? it : (it.label || it);
            item.appendChild(lbl);
            list.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      } else {
        const list = this.querySelector(".c-legend__items");
        if (list) list.remove();
      }
      const method = this.getAttribute("method");
      if (method) {
        const m = this.ensure(".c-legend__method", () => { const el = document.createElement("div"); el.className = "c-legend__method"; return el; });
        m.textContent = method;
      } else {
        const m = this.querySelector(".c-legend__method");
        if (m) m.remove();
      }
      const norm = this.getAttribute("norm");
      if (norm) {
        const n = this.ensure(".c-legend__norm", () => { const el = document.createElement("span"); el.className = "c-legend__norm"; return el; });
        n.textContent = norm;
      } else {
        const n = this.querySelector(".c-legend__norm");
        if (n) n.remove();
      }
    }
  }
  define("contour-legend", ContourLegend);

  // Measure: generates label + value from attributes.
  class ContourMeasure extends ContourBase {
    render() {
      this.classList.add("c-measure");
      const label = this.getAttribute("label");
      const value = this.getAttribute("value");
      if (label) {
        const l = this.ensure(".c-measure__label", () => { const el = document.createElement("span"); el.className = "c-measure__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-measure__label");
        if (l) l.remove();
      }
      if (value) {
        const r = this.ensure(".c-measure__readout", () => { const el = document.createElement("span"); el.className = "c-measure__readout"; return el; });
        r.textContent = value;
      } else {
        const r = this.querySelector(".c-measure__readout");
        if (r) r.remove();
      }
    }
  }
  define("contour-measure", ContourMeasure);

  // Filter pill: generates key + value + remove from attributes.
  class ContourFilterPill extends ContourBase {
    render() {
      this.classList.add("c-filter-pill");
      const key = this.getAttribute("key");
      const value = this.getAttribute("value");
      if (key) {
        const k = this.ensure(".c-filter-pill__key", () => { const el = document.createElement("span"); el.className = "c-filter-pill__key"; return el; });
        k.textContent = key;
      } else {
        const k = this.querySelector(".c-filter-pill__key");
        if (k) k.remove();
      }
      if (value) {
        const v = this.ensure(".c-filter-pill__value", () => { const el = document.createElement("span"); el.className = "c-filter-pill__value"; return el; });
        v.textContent = value;
      } else {
        const v = this.querySelector(".c-filter-pill__value");
        if (v) v.remove();
      }
      if (this.hasAttribute("removable")) {
        this.ensure(".c-filter-pill__remove", () => {
          const btn = document.createElement("button");
          btn.className = "c-filter-pill__remove";
          btn.type = "button";
          btn.setAttribute("aria-label", "Remove filter");
          btn.textContent = "×";
          return btn;
        });
      } else {
        const btn = this.querySelector(".c-filter-pill__remove");
        if (btn) btn.remove();
      }
    }
    enhance() {
      if (this._wiredFilterPill) return;
      this._wiredFilterPill = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-filter-pill__remove") : null;
        if (!btn || !this.contains(btn)) return;
        this.dispatchEvent(new CustomEvent("contour:remove", { detail: { key: this.getAttribute("key"), value: this.getAttribute("value") }, bubbles: true }));
        if (this.parentNode) this.parentNode.removeChild(this);
      });
    }
  }
  define("contour-filter-pill", ContourFilterPill);

  // Timeline: generates items from attribute.
  class ContourTimeline extends ContourBase {
    render() {
      this.classList.add("c-timeline");
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          parsed.forEach((it) => {
            const item = document.createElement("div");
            item.className = "c-timeline__item";
            if (it.time) {
              const t = document.createElement("time");
              t.className = "c-timeline__time";
              t.textContent = it.time;
              item.appendChild(t);
            }
            if (it.title) {
              const ti = document.createElement("div");
              ti.className = "c-timeline__title";
              ti.textContent = it.title;
              item.appendChild(ti);
            }
            if (it.text) {
              const tx = document.createElement("div");
              tx.className = "c-timeline__text";
              tx.textContent = it.text;
              item.appendChild(tx);
            }
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-timeline", ContourTimeline);

  // CTA: generates title + text + actions from attributes.
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

  // Filter bar: generates label + divider from attributes.
  class ContourFilterBar extends ContourBase {
    render() {
      this.classList.add("c-filter-bar");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-filter-bar__label", () => { const el = document.createElement("span"); el.className = "c-filter-bar__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-filter-bar__label");
        if (l) l.remove();
      }
      if (this.hasAttribute("divider")) {
        this.ensure(".c-filter-bar__divider", () => { const el = document.createElement("span"); el.className = "c-filter-bar__divider"; return el; });
      } else {
        const d = this.querySelector(".c-filter-bar__divider");
        if (d) d.remove();
      }
    }
  }
  define("contour-filter-bar", ContourFilterBar);

  // Command: generates input + list from items attribute.
