import { ContourBase, define, sanitizeHtml } from './core.mjs';
import { loadRemote, remoteData, renderStates, renderEmpty, wireStates } from './states.mjs';
import { wireCopy } from './behaviours.mjs';
class ContourCard extends ContourBase {
    static get observed() { return ["title", "variant"]; }
    static get properties() { return { title: { attribute: "title" }, variant: { attribute: "variant" } }; }
    render() {
      this.classList.add("c-card");
      const variant = this.getAttribute("variant");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-card--")) this.classList.remove(c); });
      if (variant) this.classList.add("c-card--" + variant);
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
    static get observed() { return ["index", "title", "body"]; }
    static get properties() { return { index: { attribute: "index" }, title: { attribute: "title" }, body: { attribute: "body" } }; }
    render() {
      this.classList.add("c-feature");
      // `.c-feature` defines three parts: `__index`, `__title`, `__body`. It has
      // no icon slot, so the index line is the label this block actually carries.
      const index = this.getAttribute("index");
      const title = this.getAttribute("title");
      const body = this.getAttribute("body");
      if (index) {
        const x = this.ensure(".c-feature__index", () => { const el = document.createElement("span"); el.className = "c-feature__index"; return el; });
        x.textContent = index;
      } else {
        const x = this.querySelector(".c-feature__index");
        if (x) x.remove();
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
    static get observed() { return ["steps", "current", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { steps: { attribute: "steps" }, current: { attribute: "current", type: Number }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-steps");
      this.setAttribute("role", "list");
      wireStates(this);
      loadRemote(this, "steps");
      if (renderStates(this, "steps")) return;
      const steps = remoteData(this, "steps");
      const authored = Array.from(this.children).filter((n) => n.classList && n.classList.contains("c-steps__item"));
      if (steps && !authored.length) {
        // Drop previously generated items so a re-render cannot stack a second set.
        Array.from(this.querySelectorAll(".c-steps__item")).forEach((n) => n.remove());
        try {
          const parsed = JSON.parse(steps);
          parsed.forEach((st, i) => {
            const item = document.createElement("div");
            item.className = "c-steps__item";
            item.setAttribute("role", "listitem");
            item.tabIndex = -1;
            const title = typeof st === "string" ? st : st.title;
            const body = typeof st === "string" ? "" : st.body;
            if (title) {
              const h = document.createElement("h3");
              h.className = "c-steps__title";
              h.textContent = title;
              item.appendChild(h);
            }
            if (body) {
              const p = document.createElement("p");
              p.className = "c-steps__body";
              p.textContent = body;
              item.appendChild(p);
            }
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      } else if (!steps && !authored.length) {
        renderEmpty(this, "steps");
      }
      // Reflect the current step onto the items (aria-current) without clobbering
      // a re-render's generated nodes.
      const attrCurrent = this.getAttribute("current");
      const current = (this._current != null) ? this._current : (attrCurrent != null ? parseInt(attrCurrent, 10) : NaN);
      const items = Array.from(this.querySelectorAll(".c-steps__item"));
      items.forEach((it, i) => {
        if (Number.isFinite(current) && i === current) it.setAttribute("aria-current", "step");
        else it.removeAttribute("aria-current");
        it.tabIndex = (Number.isFinite(current) && i === current) ? 0 : -1;
      });
      if (items.length && !Number.isFinite(current)) {
        items[0].tabIndex = 0;
      }
    }
    enhance() {
      if (!this._wiredSteps) {
        this._wiredSteps = true;
        this.addEventListener("keydown", (e) => {
          const items = Array.from(this.querySelectorAll(".c-steps__item"));
          if (!items.length) return;
          const active = document.activeElement;
          const idx = items.indexOf(active);
          let next = -1;
          const rtl = (this.getAttribute("dir") || document.documentElement.getAttribute("dir") || "").toLowerCase() === "rtl";
          if (e.key === "ArrowDown") next = idx < 0 ? 0 : Math.min(items.length - 1, idx + 1);
          else if (e.key === "ArrowUp") next = idx < 0 ? 0 : Math.max(0, idx - 1);
          else if (e.key === "ArrowRight") next = rtl ? (idx < 0 ? 0 : Math.max(0, idx - 1)) : (idx < 0 ? 0 : Math.min(items.length - 1, idx + 1));
          else if (e.key === "ArrowLeft") next = rtl ? (idx < 0 ? 0 : Math.min(items.length - 1, idx + 1)) : (idx < 0 ? 0 : Math.max(0, idx - 1));
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = items.length - 1;
          if (next >= 0 && next !== idx) {
            e.preventDefault();
            items[next].focus();
            this._current = next;
            items.forEach((it, i) => {
              if (i === next) it.setAttribute("aria-current", "step");
              else it.removeAttribute("aria-current");
              it.tabIndex = i === next ? 0 : -1;
            });
            if (idx >= 0) items[idx].tabIndex = -1;
            const title = items[next].querySelector(".c-steps__title")?.textContent || "";
            this.dispatchEvent(new CustomEvent("contour:step-change", { bubbles: true, composed: true, detail: { index: next, title } }));
          }
          if ((e.key === "Enter" || e.key === " ") && idx >= 0) {
            e.preventDefault();
            const title = items[idx].querySelector(".c-steps__title")?.textContent || "";
            this.dispatchEvent(new CustomEvent("contour:step-activate", { bubbles: true, composed: true, detail: { index: idx, title } }));
          }
        });
        this.addEventListener("click", (e) => {
          const item = e.target && e.target.closest ? e.target.closest(".c-steps__item") : null;
          if (!item || !this.contains(item)) return;
          const items = Array.from(this.querySelectorAll(".c-steps__item"));
          const idx = items.indexOf(item);
          if (idx < 0) return;
          this._current = idx;
          items.forEach((it, i) => {
            if (i === idx) it.setAttribute("aria-current", "step");
            else it.removeAttribute("aria-current");
            it.tabIndex = i === idx ? 0 : -1;
          });
          const title = item.querySelector(".c-steps__title")?.textContent || "";
          this.dispatchEvent(new CustomEvent("contour:step-activate", { bubbles: true, composed: true, detail: { index: idx, title } }));
        });
      }
    }
  }
define("contour-steps", ContourSteps);
class ContourLink extends ContourBase {
    static get observed() { return ["href", "label"]; }
    static get properties() { return { href: { attribute: "href" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-link");
      const href = this.getAttribute("href");
      const label = this.getAttribute("label");
      // Clear previously generated link so a re-render cannot stack a second one.
      const prevLink = this.querySelector("a");
      if (prevLink) prevLink.remove();
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
    static get observed() { return ["name", "tag"]; }
    static get properties() { return { name: { attribute: "name" }, tag: { attribute: "tag" } }; }
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
    static get observed() { return ["title", "desc"]; }
    static get properties() { return { title: { attribute: "title" }, desc: { attribute: "desc" } }; }
    render() {
      this.classList.add("c-section-head");
      const title = this.getAttribute("title");
      const desc = this.getAttribute("desc");
      // icon badge
      if (!this.querySelector(".c-icon-badge")) {
        const badge = document.createElement("div");
        badge.className = "c-icon-badge";
        badge.innerHTML = '<svg aria-hidden="true"><use href="#i-crosshair" /></svg>';
        this.prepend(badge);
      }
      // content wrapper
      let content = this.querySelector(":scope > div:not(.c-icon-badge)");
      if (!content) {
        content = document.createElement("div");
        this.appendChild(content);
      }
      if (title) {
        const t = this.ensure(".c-section-head__title", () => { const el = document.createElement("h2"); el.className = "c-section-head__title"; return el; });
        t.textContent = title;
        if (t.parentNode !== content) content.appendChild(t);
      } else {
        const t = this.querySelector(".c-section-head__title");
        if (t) t.remove();
      }
      if (desc) {
        const d = this.ensure(".c-section-head__desc", () => { const el = document.createElement("p"); el.className = "c-section-head__desc"; return el; });
        d.textContent = desc;
        if (d.parentNode !== content) content.appendChild(d);
      } else {
        const d = this.querySelector(".c-section-head__desc");
        if (d) d.remove();
      }
    }
  }
  define("contour-section-head", ContourSectionHead);
class ContourDiff extends ContourBase {
    static get observed() { return ["before", "after"]; }
    static get properties() { return { before: { attribute: "before" }, after: { attribute: "after" } }; }
    render() {
      this.classList.add("c-diff");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Diff");
      // The block is a list of lines, not two panes: `.c-diff__line` carries the
      // +/- sign, the line number, and the text, and `--add`/`--del` are the only
      // two states it defines. A removed line and an added line are what a
      // before/after pair actually becomes in a diff.
      Array.from(this.querySelectorAll(".c-diff__line")).forEach((n) => n.remove());
      const line = (kind, sign, text) => {
        const el = document.createElement("div");
        el.className = kind ? `c-diff__line c-diff__line--${kind}` : "c-diff__line";
        el.setAttribute("role", "listitem");
        const s = document.createElement("span");
        s.className = "c-diff__sign";
        s.textContent = sign;
        const code = document.createElement("span");
        code.textContent = text;
        el.append(s, code);
        return el;
      };
      const before = this.getAttribute("before");
      const after = this.getAttribute("after");
      if (before) this.appendChild(line("del", "−", before));
      if (after) this.appendChild(line("add", "+", after));
    }
    enhance() {
      if (this._wiredDiff) return;
      this._wiredDiff = true;
      this.addEventListener("click", (e) => {
        const line = e.target && e.target.closest ? e.target.closest(".c-diff__line") : null;
        if (line && this.contains(line)) {
          const kind = line.classList.contains("c-diff__line--add") ? "add" : line.classList.contains("c-diff__line--del") ? "del" : "context";
          const text = line.querySelector("span:last-child")?.textContent || "";
          this.dispatchEvent(new CustomEvent("contour:diff-activate", { bubbles: true, composed: true, detail: { kind, text } }));
        }
      });
    }
  }
  define("contour-diff", ContourDiff);
class ContourDoDont extends ContourBase {
    static get observed() { return ["do", "dont"]; }
    static get properties() { return { do: { attribute: "do" }, dont: { attribute: "dont" } }; }
    render() {
      this.classList.add("c-do-dont");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Do and don't");
      // An item is one element with one state modifier — `__item--do`,
      // `__item--dont` — and the word on top of it is `__label`. There is no
      // `__do` or `__dont` element in the system.
      Array.from(this.querySelectorAll(".c-do-dont__item")).forEach((n) => n.remove());
      const item = (kind, word, text) => {
        const el = document.createElement("div");
        el.className = `c-do-dont__item c-do-dont__item--${kind}`;
        el.setAttribute("role", "listitem");
        const label = document.createElement("p");
        label.className = "c-do-dont__label";
        label.textContent = word;
        const body = document.createElement("p");
        body.className = "u-muted";
        body.textContent = text;
        el.append(label, body);
        return el;
      };
      const doText = this.getAttribute("do");
      const dontText = this.getAttribute("dont");
      if (doText) this.appendChild(item("do", "Do", doText));
      if (dontText) this.appendChild(item("dont", "Don't", dontText));
    }
    enhance() {
      if (this._wiredDoDont) return;
      this._wiredDoDont = true;
      this.addEventListener("click", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".c-do-dont__item") : null;
        if (item && this.contains(item)) {
          const kind = item.classList.contains("c-do-dont__item--do") ? "do" : "dont";
          const text = item.querySelector(".u-muted")?.textContent || "";
          this.dispatchEvent(new CustomEvent("contour:do-dont-activate", { bubbles: true, composed: true, detail: { kind, text } }));
        }
      });
    }
  }
  define("contour-do-dont", ContourDoDont);
class ContourFlag extends ContourBase {
    static get observed() { return ["variant", "label"]; }
    static get properties() { return { variant: { attribute: "variant" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-flag");
      const variant = this.getAttribute("variant");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-flag--")) this.classList.remove(c); });
      if (variant) this.classList.add("c-flag--" + variant);
      const label = this.getAttribute("label");
      if (label) {
        this.textContent = label;
      }
    }
  }
  define("contour-flag", ContourFlag);
class ContourInstallFull extends ContourBase {
    static get observed() { return ["command", "prompt", "copyable"]; }
    static get properties() { return { command: { attribute: "command" }, prompt: { attribute: "prompt" }, copyable: { attribute: "copyable" } }; }
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
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
      wireCopy(this);
    }
  }
  define("contour-install", ContourInstallFull);
class ContourTestimonialFull extends ContourBase {
    static get observed() { return ["quote", "name", "role"]; }
    static get properties() { return { quote: { attribute: "quote" }, name: { attribute: "name" }, role: { attribute: "role" } }; }
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
    static get observed() { return ["title", "text", "media", "reverse", "items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { title: { attribute: "title" }, text: { attribute: "text" }, media: { attribute: "media" }, reverse: { attribute: "reverse" }, items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-showcase");
      if (this.hasAttribute("reverse")) this.classList.add("c-showcase--reverse");
      else this.classList.remove("c-showcase--reverse");
      const title = this.getAttribute("title");
      if (title) this.setAttribute("aria-label", title);
      else this.removeAttribute("aria-label");
      this.setAttribute("role", "region");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "showcase")) return;
      const items = remoteData(this, "items");
      const text = this.getAttribute("text");
      const media = this.getAttribute("media");
      if (media) {
        const m = this.ensure(".c-showcase__media", () => { const el = document.createElement("div"); el.className = "c-showcase__media"; el.setAttribute("role", "img"); return el; });
        m.innerHTML = sanitizeHtml(media);
        if (title) m.setAttribute("aria-label", title);
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
      const ul = this.querySelector(".c-showcase__list");
      const authored = ul ? Array.from(ul.children).filter((n) => n.tagName === "LI") : [];
      if (items && !authored.length) {
        try {
          const parsed = JSON.parse(items);
          const l = this.ensure(".c-showcase__list", () => { const el = document.createElement("ul"); el.className = "c-showcase__list"; return el; });
          l.innerHTML = "";
          parsed.forEach((it) => {
            const li = document.createElement("li");
            li.textContent = typeof it === "string" ? it : it.label;
            l.appendChild(li);
          });
        } catch (e) { /* keep existing */ }
      } else if (!items && !authored.length && !title && !text && !media) {
        renderEmpty(this, "showcase");
      } else if (!items && ul) {
        ul.remove();
      }
    }
    enhance() {
      if (this._wiredShowcase) return;
      this._wiredShowcase = true;
      this.addEventListener("click", (e) => {
        const media = e.target && e.target.closest ? e.target.closest(".c-showcase__media") : null;
        if (media && this.contains(media)) {
          const title = this.getAttribute("title") || "";
          this.dispatchEvent(new CustomEvent("contour:showcase-activate", { bubbles: true, composed: true, detail: { title } }));
        }
      });
    }
  }
define("contour-showcase", ContourShowcaseFull);
class ContourPricingFull extends ContourBase {
    render() {
      // `.c-pricing` is the grid; every part the guide shows lives on `.c-price`.
      // A pricing element that scaffolded its own label invented a name no rule
      // defines, so the grid holds its children and stays a container.
      this.classList.add("c-pricing");
    }
  }
  define("contour-pricing", ContourPricingFull);
class ContourRecipeFull extends ContourBase {
    static get observed() { return ["title", "body", "canvas"]; }
    static get properties() { return { title: { attribute: "title" }, body: { attribute: "body" }, canvas: { attribute: "canvas" } }; }
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
        const b = this.ensure(".c-recipe__desc", () => { const el = document.createElement("p"); el.className = "c-recipe__desc"; return el; });
        b.textContent = body;
      } else {
        const b = this.querySelector(".c-recipe__desc");
        if (b) b.remove();
      }
      const canvas = this.getAttribute("canvas");
      if (canvas) {
        const c = this.ensure(".c-recipe__canvas", () => { const el = document.createElement("div"); el.className = "c-recipe__canvas"; return el; });
        c.innerHTML = sanitizeHtml(canvas);
      } else {
        const c = this.querySelector(".c-recipe__canvas");
        if (c) c.remove();
      }
    }
  }
  define("contour-recipe", ContourRecipeFull);
class ContourLogosFull extends ContourBase {
    render() {
      this.classList.add("c-logos");
      if (!this.querySelector(".c-logos__item")) {
        for (const name of ["Cartolab", "Nordwand"]) {
          const span = document.createElement("span");
          span.className = "c-logos__item";
          span.textContent = name;
          this.appendChild(span);
        }
      }
    }
  }
  define("contour-logos", ContourLogosFull);
class ContourLandingFeaturesFull extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-landing-features");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "landing-features")) return;
      const items = remoteData(this, "items");
      const authored = Array.from(this.children).filter((n) => n.classList && n.classList.contains("c-landing-features__item"));
      if (items && !authored.length) {
        try {
          const parsed = JSON.parse(items);
          this.querySelectorAll(".c-landing-features__item").forEach((el) => el.remove());
          parsed.forEach((it) => {
            const item = document.createElement("div");
            item.className = "c-landing-features__item";
            if (it.icon) {
              const ic = document.createElement("span");
              ic.className = "c-landing-features__icon";
              ic.innerHTML = '<svg aria-hidden="true"><use href="#' + String(it.icon).replace(/[^a-zA-Z0-9_-]/g, "") + '" /></svg>';
              item.appendChild(ic);
            }
             if (it.title) {
               const t = document.createElement("span");
               t.className = "c-landing-features__title";
               t.textContent = it.title;
               item.appendChild(t);
             }
            if (it.text) {
              const tx = document.createElement("p");
              tx.className = "c-landing-features__text";
              tx.textContent = it.text;
              item.appendChild(tx);
            }
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      } else if (!items && !authored.length) {
        this.querySelectorAll(".c-landing-features__item").forEach((el) => el.remove());
        renderEmpty(this, "landing-features");
      }
    }
  }
define("contour-landing-features", ContourLandingFeaturesFull);
class ContourLandingHeroFull extends ContourBase {
    static get observed() { return ["actions", "title", "text"]; }
    static get properties() { return { actions: { attribute: "actions" }, title: { attribute: "title" }, text: { attribute: "text" } }; }
    render() {
      this.classList.add("c-landing-hero");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-landing-hero__title", () => { const el = document.createElement("h1"); el.className = "c-landing-hero__title"; return el; });
        t.textContent = title;
      }
      const text = this.getAttribute("text");
      if (text) {
        const t = this.ensure(".c-landing-hero__text", () => { const el = document.createElement("p"); el.className = "c-landing-hero__text"; return el; });
        t.textContent = text;
      }
      const actions = this.getAttribute("actions");
      const a = this.querySelector(".c-landing-hero__actions");
      const authored = a ? Array.from(a.children) : [];
      if (actions && !authored.length) {
        const el = this.ensure(".c-landing-hero__actions", () => { const e = document.createElement("div"); e.className = "c-landing-hero__actions"; return e; });
        el.innerHTML = sanitizeHtml(actions);
      } else if (!actions && a && !authored.length) {
        a.remove();
      }
    }
  }
  define("contour-landing-hero", ContourLandingHeroFull);
class ContourLinkishFull extends ContourBase {
    render() { this.classList.add("c-linkish"); }
  }
  define("contour-linkish", ContourLinkishFull);
class ContourPriceFull extends ContourBase {
    static get observed() { return ["value"]; }
    static get properties() { return { value: { attribute: "value" } }; }
    render() {
      this.classList.add("c-price");
      const value = this.getAttribute("value");
      if (value) this.textContent = value;
    }
  }
  define("contour-price", ContourPriceFull);
class ContourProseFull extends ContourBase {
    render() { this.classList.add("c-prose"); }
  }
  define("contour-prose", ContourProseFull);
class ContourPanel extends ContourBase {
    static get observed() { return ["title", "subtitle", "status"]; }
    static get properties() { return { title: { attribute: "title" }, subtitle: { attribute: "subtitle" }, status: { attribute: "status" } }; }
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
      // Wrap authored content in a body so it picks up the panel's padding.
      const body = this.ensure(".c-panel__body", () => { const el = document.createElement("div"); el.className = "c-panel__body"; return el; });
      const head = this.querySelector(".c-panel__head");
      Array.from(this.childNodes).forEach((n) => {
        if (n === body || n === head) return;
        if (n.nodeType === 1 && (n.classList.contains("c-panel__title") || n.classList.contains("c-panel__subtitle") || n.classList.contains("c-panel__status"))) return;
        body.appendChild(n);
      });
      if (!body.parentNode) this.appendChild(body);
      // keep head before body
      if (head && head.parentNode === this && body.parentNode === this && head.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_PRECEDING) {
        this.insertBefore(body, head.nextSibling);
      }
    }
  }
  define("contour-panel", ContourPanel);
class ContourCta extends ContourBase {
    static get observed() { return ["title", "text", "actions"]; }
    static get properties() { return { title: { attribute: "title" }, text: { attribute: "text" }, actions: { attribute: "actions" } }; }
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
      // Clear previously generated actions wrap so a re-render cannot stack.
      const prevWrap = this.querySelector(".c-cta__actions");
      if (prevWrap) prevWrap.remove();
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
    static get observed() { return ["title", "copyable"]; }
    static get properties() { return { title: { attribute: "title" }, copyable: { attribute: "copyable", type: Boolean } }; }
    render() {
      this.classList.add("c-code");
      const title = this.getAttribute("title");
      if (title) {
        const head = this.ensure(".c-code__head", () => { const el = document.createElement("div"); el.className = "c-code__head"; return el; });
        if (head.parentNode === this && this.firstChild !== head) this.prepend(head);
        const t = head.querySelector(".c-code__title") || (() => { const el = document.createElement("div"); el.className = "c-code__title"; head.appendChild(el); return el; })();
        t.textContent = title;
      } else {
        const head = this.querySelector(".c-code__head");
        if (head) head.remove();
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
      // Wrap authored code text in a pre so it picks up padding.
      const pre = this.ensure("pre", () => { const el = document.createElement("pre"); return el; });
      Array.from(this.childNodes).forEach((n) => {
        if (n === pre || (n.nodeType === 1 && (n.classList.contains("c-code__head") || n.classList.contains("c-code__copy")))) return;
        pre.appendChild(n);
      });
      if (!pre.querySelector("code")) {
        const code = document.createElement("code");
        while (pre.firstChild) code.appendChild(pre.firstChild);
        pre.appendChild(code);
      }
      if (pre.parentNode !== this) this.appendChild(pre);
      // keep head before pre
      const head = this.querySelector(".c-code__head");
      if (head && head.parentNode === this && pre.parentNode === this && head.compareDocumentPosition(pre) & Node.DOCUMENT_POSITION_PRECEDING) {
        this.insertBefore(pre, head.nextSibling);
      }
    }
    enhance() {
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
      wireCopy(this);
    }
  }
  define("contour-code", ContourCode);
class ContourPlate extends ContourBase {
    render() { this.classList.add("c-plate"); }
  }
  define("contour-plate", ContourPlate);
class ContourPullquote extends ContourBase {
    static get observed() { return ["quote", "name"]; }
    static get properties() { return { quote: { attribute: "quote" }, name: { attribute: "name" } }; }
    render() {
      this.classList.add("c-pullquote");
      const quote = this.getAttribute("quote");
      // `.c-pullquote` defines no `__quote` or `__byline`: the guide's specimen is
      // the paragraph itself, and the one element the sheet styles inside it is
      // `cite`, which is what an attribution is.
      if (quote) {
        // Preserve a generated <cite> (attribution) while updating the quote text.
        Array.from(this.childNodes).forEach((n) => { if (n.nodeType === 3) n.remove(); });
        const cite = this.querySelector("cite");
        this.insertBefore(document.createTextNode(quote), cite);
      }
      const name = this.getAttribute("name");
      if (name) {
        const by = this.ensure("cite", () => { const el = document.createElement("cite"); this.appendChild(el); return el; });
        by.textContent = name;
      } else {
        const by = this.querySelector("cite");
        if (by) by.remove();
      }
    }
  }
  define("contour-pullquote", ContourPullquote);
class ContourAnchor extends ContourBase {
    static get observed() { return ["href", "label"]; }
    static get properties() { return { href: { attribute: "href" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-anchor");
      const href = this.getAttribute("href");
      const label = this.getAttribute("label");
      // Clear previously generated link so a re-render cannot stack a second one.
      const prevAnchor = this.querySelector("a");
      if (prevAnchor) prevAnchor.remove();
      if (href && label) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = label;
        this.appendChild(a);
      }
    }
  }
  define("contour-anchor", ContourAnchor);
