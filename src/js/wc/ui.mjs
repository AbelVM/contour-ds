import { ContourBase, define, contourId, onDispose } from './core.mjs';
import { wireRemovable } from './behaviours.mjs';
class ContourAvatar extends ContourBase {
    static get observed() { return ["name", "size", "variant", "src", "status"]; }
    static get properties() { return { name: { attribute: "name" }, size: { attribute: "size" }, variant: { attribute: "variant" }, src: { attribute: "src" }, status: { attribute: "status" } }; }
    render() {
      this.classList.add("c-avatar");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-avatar--")) this.classList.remove(c); });
      const name = this.getAttribute("name");
      const size = this.getAttribute("size");
      if (size) this.classList.add("c-avatar--" + size);
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-avatar--" + variant);
      // Drop previously generated img/status so re-render doesn't stack.
      const oldImg = this.querySelector("img.c-avatar__img");
      if (oldImg) oldImg.remove();
      const oldDot = this.querySelector(".c-avatar__status");
      if (oldDot) oldDot.remove();
      const src = this.getAttribute("src");
      if (src) {
        this.textContent = "";
        const img = document.createElement("img");
        img.className = "c-avatar__img";
        img.src = src;
        img.alt = name || "";
        this.appendChild(img);
      } else if (name) {
        const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
        // Keep initials as text only when no img.
        if (!this.querySelector("img.c-avatar__img")) {
          // Remove any stray text nodes? Keep simple: set textContent if no img.
        }
        this.textContent = initials;
      }
      const status = this.getAttribute("status");
      if (status) {
        const dot = document.createElement("span");
        dot.className = "c-avatar__status c-avatar__status--" + status;
        dot.setAttribute("aria-hidden", "true");
        this.appendChild(dot);
      }
    }
  }
  define("contour-avatar", ContourAvatar);
class ContourBadgeFull extends ContourBase {
    static get observed() { return ["variant", "label", "size", "removable"]; }
    static get properties() { return { variant: { attribute: "variant" }, label: { attribute: "label" }, size: { attribute: "size" }, removable: { attribute: "removable", type: Boolean } }; }
    render() {
      this.classList.add("c-badge");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-badge--")) this.classList.remove(c); });
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-badge--" + variant);
      const size = this.getAttribute("size");
      if (size) this.classList.add("c-badge--" + size);
      const label = this.getAttribute("label");
      if (label) {
        // Preserve remove button if present.
        let textNode = null;
        for (const n of this.childNodes) { if (n.nodeType === 3) { textNode = n; break; } }
        if (textNode) textNode.nodeValue = label;
        else this.insertBefore(document.createTextNode(label), this.firstChild);
      }
      if (this.hasAttribute("removable")) {
        this.ensure(".c-badge__remove", () => {
          const btn = document.createElement("button");
          btn.className = "c-badge__remove";
          btn.type = "button";
          btn.setAttribute("aria-label", "Remove");
          btn.textContent = "×";
          return btn;
        });
      } else {
        const btn = this.querySelector(".c-badge__remove");
        if (btn) btn.remove();
      }
    }
    enhance() {
      wireRemovable(this);
    }
  }
  define("contour-badge", ContourBadgeFull);
class ContourChipFull extends ContourBase {
    static get observed() { return ["variant", "key", "value"]; }
    static get properties() { return { variant: { attribute: "variant" }, key: { attribute: "key" }, value: { attribute: "value" } }; }
    render() {
      this.classList.add("c-chip");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-chip--")) this.classList.remove(c); });
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-chip--" + variant);
      const key = this.getAttribute("key");
      const value = this.getAttribute("value");
      if (key) {
        const k = this.ensure(".c-chip__key", () => { const el = document.createElement("span"); el.className = "c-chip__key"; return el; });
        k.textContent = key;
      } else {
        const k = this.querySelector(".c-chip__key");
        if (k) k.remove();
      }
      if (value) {
        const v = this.ensure(".c-chip__value", () => { const el = document.createElement("span"); el.className = "c-chip__value"; return el; });
        v.textContent = value;
      } else {
        const v = this.querySelector(".c-chip__value");
        if (v) v.remove();
      }
    }
  }
  define("contour-chip", ContourChipFull);
class ContourTag extends ContourBase {
    static get observed() { return ["label", "removable", "variant"]; }
    static get properties() { return { label: { attribute: "label" }, removable: { attribute: "removable", type: Boolean }, variant: { attribute: "variant" } }; }
    render() {
      this.classList.add("c-tag");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-tag--")) this.classList.remove(c); });
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-tag--" + variant);
      const label = this.getAttribute("label");
      if (label) {
        // Update the text node without clobbering the remove button.
        let textNode = null;
        for (const n of this.childNodes) {
          if (n.nodeType === 3) { textNode = n; break; }
        }
        if (textNode) textNode.nodeValue = label + " ";
        else this.insertBefore(document.createTextNode(label + " "), this.firstChild);
      }
      if (this.hasAttribute("removable")) {
        this.ensure(".c-tag__remove", () => {
          const btn = document.createElement("button");
          btn.className = "c-tag__remove";
          btn.type = "button";
          btn.setAttribute("aria-label", "Remove");
          btn.textContent = "×";
          return btn;
        });
      } else {
        const btn = this.querySelector(".c-tag__remove");
        if (btn) btn.remove();
      }
    }
    enhance() {
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
      wireRemovable(this);
    }
  }
  define("contour-tag", ContourTag);
class ContourDot extends ContourBase {
    static get observed() { return ["variant", "live"]; }
    static get properties() { return { variant: { attribute: "variant" }, live: { attribute: "live", type: Boolean } }; }
    render() {
      this.classList.add("c-dot");
      if (!this.hasAttribute("role")) this.setAttribute("role", "img");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "status indicator");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-dot--")) this.classList.remove(c); });
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-dot--" + variant);
      if (this.hasAttribute("live")) this.classList.add("c-dot--live");
    }
  }
  define("contour-dot", ContourDot);
class ContourPill extends ContourBase {
    static get observed() { return ["label", "live", "variant"]; }
    static get properties() { return { label: { attribute: "label" }, live: { attribute: "live", type: Boolean }, variant: { attribute: "variant" } }; }
    render() {
      this.classList.add("c-pill");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-pill--")) this.classList.remove(c); });
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-pill--" + variant);
      const label = this.getAttribute("label");
      if (label) {
        this.textContent = label;
      }
      if (this.hasAttribute("live")) this.classList.add("c-pill--live");
    }
  }
  define("contour-pill", ContourPill);
class ContourKbd extends ContourBase {
    static get observed() { return ["key"]; }
    static get properties() { return { key: { attribute: "key" } }; }
    render() {
      this.classList.add("c-kbd");
      const key = this.getAttribute("key");
      if (key) {
        this.textContent = key;
      }
    }
  }
  define("contour-kbd", ContourKbd);
class ContourSpinner extends ContourBase {
    static get observed() { return ["size"]; }
    static get properties() { return { size: { attribute: "size" } }; }
    render() {
      this.classList.add("c-spinner");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-spinner--")) this.classList.remove(c); });
      const size = this.getAttribute("size");
      if (size) this.classList.add("c-spinner--" + size);
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Loading");
    }
  }
  define("contour-spinner", ContourSpinner);
class ContourSkeleton extends ContourBase {
    static get observed() { return ["size"]; }
    static get properties() { return { size: { attribute: "size" } }; }
    render() {
      this.classList.add("c-skeleton");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-skeleton--")) this.classList.remove(c); });
      const size = this.getAttribute("size");
      if (size) this.classList.add("c-skeleton--" + size);
    }
  }
  define("contour-skeleton", ContourSkeleton);
class ContourTooltip extends ContourBase {
    static get observed() { return ["text", "anchor", "delay", "trigger"]; }
    static get properties() { return { text: { attribute: "text" }, anchor: { attribute: "anchor" }, delay: { attribute: "delay", type: Number }, trigger: { attribute: "trigger" } }; }
    render() {
      this.classList.add("c-tooltip");
      if (!this.hasAttribute("popover")) this.setAttribute("popover", "auto");
      if (!this.hasAttribute("role")) this.setAttribute("role", "tooltip");
      if (!this.id) this.id = contourId("tip");
      const text = this.getAttribute("text");
      if (text !== null && !this.hasChildNodes()) {
        this.textContent = text;
      }
    }
    enhance() {
      if (this._wiredTooltip) return;
      this._wiredTooltip = true;
      // Anchor association: link a trigger element to this tooltip.
      const anchorSel = this.getAttribute("anchor");
      if (anchorSel) {
        let trigger = null;
        if (anchorSel.startsWith("#")) {
          trigger = document.getElementById(anchorSel.slice(1));
        } else {
          trigger = document.querySelector(anchorSel);
        }
        if (trigger) {
          trigger.setAttribute("popovertarget", this.id || (this.id = contourId("tip")));
          trigger.setAttribute("aria-describedby", this.id);
        }
      }
      const delayMs = (this.delay && this.delay > 0) ? this.delay : 0;
      let showTimer = null;
      const hasPopover = typeof this.showPopover === "function";
      const show = () => {
        if (showTimer) clearTimeout(showTimer);
        if (delayMs > 0) showTimer = setTimeout(() => {
          if (hasPopover) { try { this.showPopover(); } catch (e) {} }
          else this.classList.add("is-open");
        }, delayMs);
        else {
          if (hasPopover) { try { this.showPopover(); } catch (e) {} }
          else this.classList.add("is-open");
        }
      };
      const hide = () => {
        if (showTimer) { clearTimeout(showTimer); showTimer = null; }
        if (hasPopover) { try { this.hidePopover(); } catch (e) {} }
        else this.classList.remove("is-open");
      };
      const triggerMode = this.getAttribute("trigger") || "hover";
      const trigger = anchorSel ? (anchorSel.startsWith("#") ? document.getElementById(anchorSel.slice(1)) : document.querySelector(anchorSel)) : null;
       const target = trigger || this;
       const onEnter = () => { if (triggerMode !== "click") show(); };
       const onLeave = () => { if (triggerMode !== "click") hide(); };
       const onFocus = () => { if (triggerMode !== "click") show(); };
       const onBlur = () => { if (triggerMode !== "click") hide(); };
       const onClick = () => {
         if (triggerMode === "click" || triggerMode === "hover") {
           if (this.matches(":popover-open")) hide(); else show();
         }
       };
       target.addEventListener("mouseenter", onEnter);
       target.addEventListener("mouseleave", onLeave);
       target.addEventListener("focus", onFocus);
       target.addEventListener("blur", onBlur);
       target.addEventListener("click", onClick);
       onDispose(this, () => {
         target.removeEventListener("mouseenter", onEnter);
         target.removeEventListener("mouseleave", onLeave);
         target.removeEventListener("focus", onFocus);
         target.removeEventListener("blur", onBlur);
         target.removeEventListener("click", onClick);
         if (showTimer) clearTimeout(showTimer);
       });
      this.addEventListener("toggle", (e) => {
        const t = e.target;
        if (t && t === this) {
          this.dispatchEvent(new CustomEvent("contour:toggle", { detail: { open: this.matches(":popover-open") }, bubbles: true, composed: true }));
        }
      });
      this.addEventListener("beforetoggle", (e) => {
        this.dispatchEvent(new CustomEvent(e.newState === "open" ? "contour:show" : "contour:hide", { bubbles: true, composed: true }));
      });
    }
  }
  define("contour-tooltip", ContourTooltip);
class ContourProgress extends ContourBase {
    static get observed() { return ["value", "label", "min", "max", "paused", "pausable"]; }
    static get properties() { return { value: { attribute: "value" }, label: { attribute: "label" }, min: { attribute: "min" }, max: { attribute: "max" }, paused: { attribute: "paused", type: Boolean }, pausable: { attribute: "pausable", type: Boolean } }; }
    render() {
      this.classList.add("c-progress");
      const value = this.getAttribute("value");
      // The normalised percentage is read by the ARIA block below, which runs
      // after this branch. Declaring it inside the `else` made `String(pct)` a
      // ReferenceError: the bar built its node, set its role, and then died
      // before announcing anything, so a determinate progressbar reached a
      // screen reader with no value at all.
      if (value === null) {
        // Indeterminate bar: no fill, no value announced.
        this.style.removeProperty("--progress");
        if (this.getAttribute("aria-valuenow") === this._progressAriaValue) {
          this.removeAttribute("aria-valuenow");
        }
        this._progressAriaValue = null;
      } else {
        const num = Number(value);
        // Accept both 0-1 (fraction) and 0-100 (percentage). A value <= 1
        // without a decimal point is treated as a percentage (e.g. "50" → 50%).
        // A value <= 1 with a decimal point is treated as a fraction (e.g. "0.5" → 50%).
        const pct = Number.isFinite(num) ? (num <= 1 && value.includes(".") ? num * 100 : num) : 0;
        const pctStr = Math.max(0, Math.min(100, pct)) + "%";
        this.style.setProperty("--progress", pctStr);
        const prevVal = this._progressAriaValue;
        if (!this.hasAttribute("aria-valuenow") || this.getAttribute("aria-valuenow") === prevVal) {
          this.setAttribute("aria-valuenow", String(pct));
          this._progressAriaValue = String(pct);
        }
      }
      this.ensure(".c-progress__bar", () => { const el = document.createElement("span"); el.className = "c-progress__bar"; return el; });
       if (!this.hasAttribute("role")) this.setAttribute("role", "progressbar");
       const label = this.getAttribute("label");
       if (label && !this.hasAttribute("aria-label")) this.setAttribute("aria-label", label);
      const min = this.getAttribute("min");
      const max = this.getAttribute("max");
      if (min !== null) this.setAttribute("aria-valuemin", min);
      else if (!this.hasAttribute("aria-valuemin")) this.setAttribute("aria-valuemin", "0");
      if (max !== null) this.setAttribute("aria-valuemax", max);
      else if (!this.hasAttribute("aria-valuemax")) this.setAttribute("aria-valuemax", "100");
      if (this.hasAttribute("paused")) this.classList.add("c-progress--paused");
      else Array.from(this.classList).forEach((c) => { if (c === "c-progress--paused") this.classList.remove(c); });
      if (this.hasAttribute("pausable")) {
        this.ensure(".c-progress__pause", () => {
          const btn = document.createElement("button");
          btn.className = "c-progress__pause";
          btn.type = "button";
          btn.setAttribute("aria-label", "Pause");
          btn.textContent = "⏸";
          return btn;
        });
      } else {
        const btn = this.querySelector(".c-progress__pause");
        if (btn) btn.remove();
      }
    }
  }
  define("contour-progress", ContourProgress);
class ContourMark extends ContourBase {
    render() {
      this.classList.add("c-mark");
    }
  }
  define("contour-mark", ContourMark);
class ContourLoading extends ContourBase {
    render() {
      this.classList.add("c-loading");
      this.ensure(".c-spinner", () => { const el = document.createElement("span"); el.className = "c-spinner"; return el; });
    }
  }
  define("contour-loading", ContourLoading);
class ContourElevation extends ContourBase {
    render() {
      // The block is one step of the ramp, not the ramp: .c-elevation carries
      // --shadow-md and nothing else, so this element raises the surface it is
      // given and stops there. The rule has existed since 00e0494 — an earlier
      // note here claimed it did not and dropped the class rather than invent
      // one, which left a shipped rule with no emitter in either layer.
      this.classList.add("c-elevation");
    }
  }
  define("contour-elevation", ContourElevation);
class ContourVersionBannerFull extends ContourBase {
    static get observed() { return ["message", "link", "href", "dismissible"]; }
    static get properties() { return { message: { attribute: "message" }, link: { attribute: "link" }, href: { attribute: "href" }, dismissible: { attribute: "dismissible", type: Boolean } }; }
    render() {
      this.classList.add("c-version-banner");
      Array.from(this.children).forEach((n) => n.remove());
      const message = this.getAttribute("message");
      if (message) {
        const icon = document.createElement("svg");
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = '<use href="#i-info" />';
        this.appendChild(icon);
        const span = document.createElement("span");
        span.textContent = message;
        this.appendChild(span);
      }
      const link = this.getAttribute("link");
      const href = this.getAttribute("href");
      if (link && href) {
        const a = document.createElement("a");
        a.className = "c-version-banner__link";
        a.href = href;
        a.textContent = link;
        this.appendChild(a);
      }
      if (this.hasAttribute("dismissible")) {
        const btn = document.createElement("button");
        btn.className = "c-version-banner__dismiss";
        btn.type = "button";
        btn.setAttribute("aria-label", "Dismiss");
        btn.textContent = "×";
        this.appendChild(btn);
      }
    }
    enhance() {
      if (this._wiredVersionBanner) return;
      this._wiredVersionBanner = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-version-banner__dismiss") : null;
        if (btn && this.contains(btn)) {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
          this.remove();
        }
      });
    }
  }
  define("contour-version-banner", ContourVersionBannerFull);
class ContourBanner extends ContourBase {
    static get observed() { return ["message", "variant"]; }
    static get properties() { return { message: { attribute: "message" }, variant: { attribute: "variant" } }; }
    render() {
      this.classList.add("c-banner");
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-banner--" + variant);
      const message = this.getAttribute("message");
      if (message) {
        const span = this.ensure(".c-banner__message", () => { const el = document.createElement("span"); el.className = "c-banner__message"; return el; });
        span.textContent = message;
      }
    }
  }
  define("contour-banner", ContourBanner);
class ContourFilterPill extends ContourBase {
    static get observed() { return ["key", "value", "removable"]; }
    static get properties() { return { key: { attribute: "key" }, value: { attribute: "value" }, removable: { attribute: "removable", type: Boolean } }; }
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
      // Interaction lives in behaviours.mjs, which the shadow wrappers call too.
      // One implementation, so the two layers cannot drift apart again: the shadow
      // copy queried its root for slotted nodes, found none, and wired nothing.
      wireRemovable(this);
    }
  }
  define("contour-filter-pill", ContourFilterPill);
class ContourDatamark extends ContourBase {
    static get observed() { return ["value", "unit", "label"]; }
    static get properties() { return { value: { attribute: "value" }, unit: { attribute: "unit" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-datamark");
      // The guide sets `value` on this element (`<contour-datamark value="42">`),
      // and the block's own specimen is the number with an optional unit — reading
      // only `label` meant the published specimen rendered an empty box.
      const value = this.getAttribute("value");
      const unit = this.getAttribute("unit");
      const label = this.getAttribute("label");
      const text = value || label;
      if (text) {
        this.textContent = text;
        if (unit) {
          const u = document.createElement("span");
          u.className = "u-subtle";
          u.textContent = " " + unit;
          this.appendChild(u);
        }
      }
    }
  }
  define("contour-datamark", ContourDatamark);
class ContourDestructiveHint extends ContourBase {
    static get observed() { return ["text"]; }
    static get properties() { return { text: { attribute: "text" } }; }
    render() {
      this.classList.add("c-destructive-hint");
      const text = this.getAttribute("text");
      if (text) this.textContent = text;
    }
  }
  define("contour-destructive-hint", ContourDestructiveHint);
class ContourIconBadge extends ContourBase {
    static get observed() { return ["icon"]; }
    static get properties() { return { icon: { attribute: "icon" } }; }
    render() {
      this.classList.add("c-icon-badge");
      const icon = this.getAttribute("icon");
      if (icon) {
        const sanitized = String(icon).replace(/[^a-zA-Z0-9_-]/g, "");
        if (sanitized && !sanitized.startsWith("i-")) {
          // Warn if icon name doesn't follow the i-* convention.
          if (typeof console !== "undefined" && console.warn) {
            console.warn("ContourIconBadge: icon '" + icon + "' may not exist in the sprite (expected i-* name).");
          }
        }
        const existing = this.querySelector("svg");
        const svg = existing || document.createElementNS("http://www.w3.org/2000/svg", "svg");
        if (!existing) {
          svg.setAttribute("aria-hidden", "true");
          const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
          use.setAttribute("href", "#" + sanitized);
          svg.appendChild(use);
          this.appendChild(svg);
        } else {
          const use = svg.querySelector("use");
          if (use) use.setAttribute("href", "#" + sanitized);
        }
      } else {
        const svg = this.querySelector("svg");
        if (svg) svg.remove();
      }
    }
  }
  define("contour-icon-badge", ContourIconBadge);
class ContourLiveBadge extends ContourBase {
    static get observed() { return ["label", "state", "live"]; }
    static get properties() { return { label: { attribute: "label" }, state: { attribute: "state" }, live: { attribute: "live", type: Boolean } }; }
    render() {
      this.classList.add("c-live-badge");
      // Remove previous state modifiers.
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-live-badge--")) this.classList.remove(c); });
      const state = this.getAttribute("state");
      if (state) {
        this.classList.add("c-live-badge--" + state);
      } else if (this.hasAttribute("live")) {
        this.classList.add("c-live-badge--connected");
      }
      const label = this.getAttribute("label");
      if (label && !this.hasChildNodes()) this.textContent = label;
    }
  }
  define("contour-live-badge", ContourLiveBadge);

class ContourSkeletonGroup extends ContourBase {
    static get observed() { return ["count"]; }
    static get properties() { return { count: { attribute: "count", type: Number } }; }
    render() {
      this.classList.add("c-skeleton-group");
      const count = Math.max(1, parseInt(this.getAttribute("count") || "3", 10) || 3);
      Array.from(this.querySelectorAll(".c-skeleton")).forEach((n) => n.remove());
      for (let i = 0; i < count; i++) {
        const sk = document.createElement("div");
        sk.className = "c-skeleton";
        this.appendChild(sk);
      }
    }
  }
  define("contour-skeleton-group", ContourSkeletonGroup);

class ContourMapPopup extends ContourBase {
    static get observed() { return ["title", "content"]; }
    static get properties() { return { title: { attribute: "title" }, content: { attribute: "content" } }; }
    render() {
      this.classList.add("c-map-popup");
      if (!this.hasAttribute("popover")) this.setAttribute("popover", "auto");
      if (!this.id) this.id = contourId("map-popup");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-map-popup__title", () => { const el = document.createElement("div"); el.className = "c-map-popup__title"; return el; });
        t.textContent = title;
      }
      const content = this.getAttribute("content");
      if (content) {
        const c = this.ensure(".c-map-popup__body", () => { const el = document.createElement("div"); el.className = "c-map-popup__body"; return el; });
        c.textContent = content;
      }
    }
  }
  define("contour-map-popup", ContourMapPopup);

class ContourAnimationControls extends ContourBase {
    static get observed() { return ["playing", "speed", "progress", "min", "max", "caption", "show-thumb", "show-thumb-caption"]; }
    static get properties() { return { playing: { attribute: "playing", type: Boolean }, speed: { attribute: "speed" }, progress: { attribute: "progress" }, min: { attribute: "min" }, max: { attribute: "max" } }; }
    render() {
      this.classList.add("c-animation-controls");
      const playBtn = this.ensure(".c-animation-controls__play", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-animation-controls__play"; el.type = "button"; return el; });
      playBtn.textContent = this.hasAttribute("playing") ? "Pause" : "Play";
      playBtn.setAttribute("aria-label", this.hasAttribute("playing") ? "Pause" : "Play");
      const speed = this.getAttribute("speed") || "1x";
      const speedBtn = this.ensure(".c-animation-controls__speed", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-animation-controls__speed"; el.type = "button"; return el; });
      speedBtn.textContent = speed;
      // scrubber
      const scrubber = this.ensure(".c-animation-controls__scrubber", () => { const el = document.createElement("input"); el.className = "c-animation-controls__scrubber"; el.type = "range"; return el; });
      if (this.getAttribute("show-thumb") === "false") scrubber.classList.remove("c-animation-controls__scrubber--thumb");
      else scrubber.classList.add("c-animation-controls__scrubber--thumb");
      scrubber.min = this.getAttribute("min") || "0";
      scrubber.max = this.getAttribute("max") || "100";
      scrubber.value = this.getAttribute("progress") || "0";
      const caption = this.getAttribute("caption");
      if (caption) scrubber.setAttribute("aria-label", caption);
      else if (!scrubber.getAttribute("aria-label")) scrubber.setAttribute("aria-label", "Playhead");
      // caption display
      const showCaption = this.hasAttribute("show-thumb-caption") || this.hasAttribute("show-thumb");
      if (caption && showCaption) {
        const cap = this.ensure(".c-animation-controls__caption", () => { const el = document.createElement("span"); el.className = "c-animation-controls__caption"; return el; });
        cap.textContent = caption;
      } else {
        const cap = this.querySelector(".c-animation-controls__caption");
        if (cap) cap.remove();
      }
      // showThumb: hide thumb via attribute? keep default
    }
    enhance() {
      if (this._wiredAnimControls) return;
      this._wiredAnimControls = true;
      this.addEventListener("click", (e) => {
        const play = e.target && e.target.closest ? e.target.closest(".c-animation-controls__play") : null;
        const speed = e.target && e.target.closest ? e.target.closest(".c-animation-controls__speed") : null;
        if (play && this.contains(play)) {
          this.dispatchEvent(new CustomEvent("contour:toggle", { bubbles: true, composed: true, detail: { playing: !this.hasAttribute("playing") } }));
        }
        if (speed && this.contains(speed)) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { speed: speed.textContent } }));
        }
      });
      this.addEventListener("input", (e) => {
        const scrubber = e.target && e.target.closest ? e.target.closest(".c-animation-controls__scrubber") : null;
        if (scrubber && this.contains(scrubber)) {
          const v = Number(scrubber.value);
          this.dispatchEvent(new CustomEvent("contour:seek", { bubbles: true, composed: true, detail: { progress: v, value: v } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "Enter") {
          const play = this.querySelector(".c-animation-controls__play");
          if (play && (e.target === play || !e.target || e.target === this)) { e.preventDefault(); play.click(); }
        } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          const scrubber = this.querySelector(".c-animation-controls__scrubber");
          if (scrubber) {
            e.preventDefault();
            const step = e.key === "ArrowRight" ? 1 : -1;
            scrubber.value = String(Number(scrubber.value) + step);
            scrubber.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }
      });
      // Playback ownership: when `playing` is set, advance the playhead on a
      // timer and emit contour:time-change so a consumer can sync its data.
      let timer = null;
      const speedFactor = () => {
        const s = this.getAttribute("speed") || "1x";
        const n = parseFloat(s);
        return Number.isFinite(n) && n > 0 ? n : 1;
      };
      const tick = () => {
        const scrubber = this.querySelector(".c-animation-controls__scrubber");
        if (!scrubber) return;
        const min = Number(scrubber.min || 0);
        const max = Number(scrubber.max || 100);
        let v = Number(scrubber.value || 0) + speedFactor();
        if (v > max) v = min;
        scrubber.value = String(v);
        this.dispatchEvent(new CustomEvent("contour:time-change", { bubbles: true, composed: true, detail: { progress: v, value: v } }));
      };
      const start = () => { if (timer) return; timer = setInterval(tick, 100); };
      const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
      if (this.hasAttribute("playing")) start();
      const obs = new MutationObserver(() => { if (this.hasAttribute("playing")) start(); else stop(); });
      obs.observe(this, { attributes: true, attributeFilter: ["playing"] });
      onDispose(this, () => { stop(); obs.disconnect(); });
    }
  }
  define("contour-animation-controls", ContourAnimationControls);

class ContourDropdown extends ContourBase {
    static get observed() { return ["label", "items"]; }
    static get properties() { return { label: { attribute: "label" }, items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-dropdown");
      const btn = this.ensure(".c-dropdown__trigger", () => { const el = document.createElement("button"); el.className = "c-dropdown__trigger c-btn c-btn--sm"; el.type = "button"; return el; });
      btn.textContent = this.getAttribute("label") || "Menu";
      const menu = this.ensure(".c-dropdown__menu", () => { const el = document.createElement("div"); el.className = "c-dropdown__menu c-menu"; el.setAttribute("role", "menu"); el.hidden = true; return el; });
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          menu.innerHTML = "";
          parsed.forEach((it) => {
            const li = document.createElement("button");
            li.className = "c-menu__item";
            li.setAttribute("role", "menuitem");
            li.textContent = typeof it === "string" ? it : (it.label || it.title || "");
            menu.appendChild(li);
          });
        } catch (e) { /* keep existing */ }
      }
      if (menu.parentNode !== this) this.appendChild(menu);
      if (btn.parentNode !== this) this.insertBefore(btn, menu);
    }
    enhance() {
      if (this._wiredDropdown) return;
      this._wiredDropdown = true;
      const btn = () => this.querySelector(".c-dropdown__trigger");
      const menu = () => this.querySelector(".c-dropdown__menu");
      this.addEventListener("click", (e) => {
        const b = btn();
        const m = menu();
        // Item selection.
        const item = e.target && e.target.closest ? e.target.closest(".c-menu__item") : null;
        if (item && m && m.contains(item) && !m.hidden) {
          const idx = Array.from(m.querySelectorAll(".c-menu__item")).indexOf(item);
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: idx, value: item.textContent } }));
          m.hidden = true;
          if (b) { b.setAttribute("aria-expanded", "false"); try { b.focus(); } catch (err) {} }
          return;
        }
        if (e.target === b || (b && b.contains(e.target))) {
          if (m) {
            m.hidden = !m.hidden;
            b.setAttribute("aria-expanded", String(!m.hidden));
            if (!m.hidden) {
              if (!m.id) m.id = (this.id || contourId("dd")) + "-menu";
              b.setAttribute("aria-controls", m.id);
              const first = m.querySelector(".c-menu__item");
              if (first) try { first.focus(); } catch (err) {}
            }
          }
        }
      });
      const docClick = (e) => {
        const m = menu();
        const b = btn();
        if (m && !m.hidden && !this.contains(e.target)) { m.hidden = true; if (b) b.setAttribute("aria-expanded", "false"); }
      };
      document.addEventListener("click", docClick);
      onDispose(this, () => document.removeEventListener("click", docClick));
      const keyHandler = (e) => {
        const m = menu(); const b = btn();
        if (e.key === "Escape" && m && !m.hidden) { e.preventDefault(); m.hidden = true; if (b) { b.setAttribute("aria-expanded", "false"); try { b.focus(); } catch (err) {} } return; }
        if (!m || m.hidden) return;
        const items = Array.from(m.querySelectorAll(".c-menu__item"));
        const active = document.activeElement;
        const idx = items.indexOf(active);
        if (e.key === "ArrowDown") { e.preventDefault(); const next = items[Math.min(items.length - 1, idx + 1)] || items[0]; if (next) try { next.focus(); } catch (err) {} }
        else if (e.key === "ArrowUp") { e.preventDefault(); const prev = items[Math.max(0, idx - 1)] || items[items.length - 1]; if (prev) try { prev.focus(); } catch (err) {} }
        else if (e.key === "Enter" || e.key === " ") {
          if (active && items.includes(active)) { e.preventDefault(); active.click(); }
        }
      };
      document.addEventListener("keydown", keyHandler);
      onDispose(this, () => document.removeEventListener("keydown", keyHandler));
    }
  }
  define("contour-dropdown", ContourDropdown);

class ContourAnnotation extends ContourBase {
    static get observed() { return ["label", "x", "y"]; }
    static get properties() { return { label: { attribute: "label" }, x: { attribute: "x" }, y: { attribute: "y" } }; }
    render() {
      this.classList.add("c-annotation");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-annotation__label", () => { const el = document.createElement("span"); el.className = "c-annotation__label"; return el; });
        l.textContent = label;
      }
      const x = this.getAttribute("x");
      const y = this.getAttribute("y");
      if (x !== null) this.style.setProperty("--annotation-x", x);
      if (y !== null) this.style.setProperty("--annotation-y", y);
    }
  }
  define("contour-annotation", ContourAnnotation);

class ContourStyleSwitcher extends ContourBase {
    static get observed() { return ["items", "value"]; }
    static get properties() { return { items: { attribute: "items" }, value: { attribute: "value" } }; }
    render() {
      this.classList.add("c-style-switcher");
      const items = this.getAttribute("items");
      const value = this.getAttribute("value");
      Array.from(this.querySelectorAll(".c-style-switcher__option")).forEach((n) => n.remove());
      if (items) {
        try {
          const parsed = JSON.parse(items);
          parsed.forEach((it) => {
            const name = typeof it === "string" ? it : (it.name || it.label || "");
            const btn = document.createElement("button");
            btn.className = "c-style-switcher__option c-btn c-btn--sm";
            btn.type = "button";
            btn.textContent = name;
            if (name === value) btn.classList.add("c-style-switcher__option--active");
            btn.dataset.value = name;
            this.appendChild(btn);
          });
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredStyleSwitcher) return;
      this._wiredStyleSwitcher = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-style-switcher__option") : null;
        if (btn && this.contains(btn)) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: btn.dataset.value } }));
        }
      });
    }
  }
  define("contour-style-switcher", ContourStyleSwitcher);

class ContourStylePanel extends ContourBase {
    static get observed() { return ["title", "layers", "layer", "single", "classification", "palette", "breaks", "opacity", "n", "colors", "property"]; }
    static get properties() { return { title: { attribute: "title" }, layers: { attribute: "layers" }, classification: { attribute: "classification" }, palette: { attribute: "palette" }, breaks: { attribute: "breaks" }, opacity: { attribute: "opacity" } }; }
    render() {
      this.classList.add("c-style-panel");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-style-panel__title", () => { const el = document.createElement("div"); el.className = "c-style-panel__title"; return el; });
        t.textContent = title;
      }
       const singleMode = this.hasAttribute("single") || !!this.getAttribute("layer");
       if (singleMode) {
         const body = this.ensure(".c-style-panel__body", () => { const el = document.createElement("div"); el.className = "c-style-panel__body"; return el; });
         body.innerHTML = "";
         // property field
         const propLabel = document.createElement("label"); propLabel.textContent = "Colour field"; propLabel.setAttribute("for", "property"); body.appendChild(propLabel);
         const propIn = document.createElement("input"); propIn.type = "text"; propIn.id = "property"; propIn.className = "c-style-panel__property c-input"; propIn.setAttribute("aria-label", "Colour field");
         const pv = this.getAttribute("property"); if (pv) propIn.value = pv;
         body.appendChild(propIn);
         // classification method selector (policy)
         const clsLabel = document.createElement("label"); clsLabel.textContent = "Classification"; clsLabel.setAttribute("for", "policy"); body.appendChild(clsLabel);
         const clsSel = document.createElement("select"); clsSel.id = "policy"; clsSel.className = "c-style-panel__classification c-input"; clsSel.setAttribute("aria-label", "Classification method");
         ["equal","quantile","jenks","manual"].forEach((m) => { const o = document.createElement("option"); o.value = m; o.textContent = m; clsSel.appendChild(o); });
         const cls = this.getAttribute("classification"); if (cls) clsSel.value = cls;
         body.appendChild(clsSel);
         // palette picker
         const palLabel = document.createElement("label"); palLabel.textContent = "Palette"; palLabel.setAttribute("for", "palette"); body.appendChild(palLabel);
         const pal = document.createElement("input"); pal.type = "text"; pal.id = "palette"; pal.className = "c-style-panel__palette c-input"; pal.placeholder = "palette"; pal.setAttribute("aria-label", "Palette");
         const palv = this.getAttribute("palette"); if (palv) pal.value = palv;
         body.appendChild(pal);
         // n (class count)
         const nLabel = document.createElement("label"); nLabel.textContent = "Classes"; nLabel.setAttribute("for", "n"); body.appendChild(nLabel);
         const nIn = document.createElement("input"); nIn.type = "number"; nIn.id = "n"; nIn.className = "c-style-panel__n c-input"; nIn.min = "2"; nIn.max = "12"; nIn.setAttribute("aria-label", "Class count");
         const nv = this.getAttribute("n"); if (nv) nIn.value = nv; else nIn.value = "5";
         body.appendChild(nIn);
         // opacity slider
         const op = document.createElement("input"); op.type = "range"; op.className = "c-style-panel__opacity"; op.min = "0"; op.max = "100";
         const ov = this.getAttribute("opacity"); op.value = ov != null ? ov : "100";
         body.appendChild(op);
         // breaks as .break elements per class
         const breaksAttr = this.getAttribute("breaks");
         let breaksArr = null;
         if (breaksAttr) { try { breaksArr = JSON.parse(breaksAttr); } catch (e) { breaksArr = breaksAttr.split(",").map((s) => s.trim()); } }
         if (Array.isArray(breaksArr) && breaksArr.length) {
           const breaksWrap = document.createElement("div"); breaksWrap.className = "c-style-panel__breaks";
           breaksArr.forEach((b, i) => {
             const br = document.createElement("div"); br.className = "break";
             br.textContent = String(b);
             breaksWrap.appendChild(br);
           });
           body.appendChild(breaksWrap);
         }
         // color swatches
         const colorsAttr = this.getAttribute("colors");
         let colors = null;
         if (colorsAttr) { try { colors = JSON.parse(colorsAttr); } catch (e) { colors = colorsAttr.split(",").map((s) => s.trim()); } }
         if (Array.isArray(colors)) {
           const list = document.createElement("div"); list.className = "c-style-panel__colors";
           colors.forEach((c, i) => {
             const sw = document.createElement("input"); sw.type = "color"; sw.className = "c-style-panel__color c-input"; sw.setAttribute("aria-label", "Colour for class " + (i + 1));
             sw.value = c;
             sw.addEventListener("input", () => { sw.setAttribute("data-edited", "true"); });
             list.appendChild(sw);
           });
           body.appendChild(list);
         }
         // Apply/Revert buttons
         const actions = document.createElement("div"); actions.className = "c-style-panel__actions";
         const applyBtn = document.createElement("button"); applyBtn.type = "button"; applyBtn.className = "c-btn primary"; applyBtn.textContent = "Apply";
         const revertBtn = document.createElement("button"); revertBtn.type = "button"; revertBtn.className = "c-btn"; revertBtn.textContent = "Revert";
         actions.appendChild(applyBtn); actions.appendChild(revertBtn);
         body.appendChild(actions);
         return;
       }
       const layers = this.getAttribute("layers");
      const body = this.ensure(".c-style-panel__body", () => { const el = document.createElement("div"); el.className = "c-style-panel__body"; return el; });
      // Slotted content support: authored .c-style-panel__row children take
      // precedence over the JSON `layers` attribute.
      const authoredRows = Array.from(this.querySelectorAll(":scope > .c-style-panel__row"));
      let parsed = null;
      if (authoredRows.length) {
        parsed = authoredRows.map((row) => ({
          name: row.querySelector(".c-style-panel__name")?.textContent || "",
          color: row.querySelector(".c-style-panel__color")?.value,
          classification: row.querySelector(".c-style-panel__classification")?.value,
          palette: row.querySelector(".c-style-panel__palette")?.value,
          breaks: row.querySelector(".c-style-panel__breaks")?.value,
          opacity: row.querySelector(".c-style-panel__opacity")?.value,
        }));
        authoredRows.forEach((row) => row.remove());
      } else if (layers) {
        try {
          parsed = JSON.parse(layers);
        } catch (e) { parsed = null; }
      }
      if (parsed) {
        body.innerHTML = "";
        parsed.forEach((l) => {
            const row = document.createElement("div");
            row.className = "c-style-panel__row";
            const name = document.createElement("span");
            name.className = "c-style-panel__name";
            name.textContent = typeof l === "string" ? l : (l.name || l.label || "");
            row.appendChild(name);
            const input = document.createElement("input");
            input.type = "color";
            input.className = "c-style-panel__color";
            if (typeof l === "object" && l.color) input.value = l.color;
            row.appendChild(input);
            // classification method selector
            const clsSel = document.createElement("select");
            clsSel.className = "c-style-panel__classification";
            ["equal","quantile","jenks","manual"].forEach((m) => { const o = document.createElement("option"); o.value = m; o.textContent = m; clsSel.appendChild(o); });
            if (typeof l === "object" && l.classification) clsSel.value = l.classification;
            row.appendChild(clsSel);
            // palette picker
            const pal = document.createElement("input");
            pal.type = "text";
            pal.className = "c-style-panel__palette";
            pal.placeholder = "palette";
            if (typeof l === "object" && l.palette) pal.value = l.palette;
            row.appendChild(pal);
            // breaks editor
            const breaks = document.createElement("input");
            breaks.type = "text";
            breaks.className = "c-style-panel__breaks";
            breaks.placeholder = "breaks";
            if (typeof l === "object" && l.breaks) breaks.value = (Array.isArray(l.breaks) ? l.breaks.join(",") : l.breaks);
            row.appendChild(breaks);
            // opacity control
            const op = document.createElement("input");
            op.type = "range";
            op.className = "c-style-panel__opacity";
            op.min = "0"; op.max = "100";
            op.value = (typeof l === "object" && l.opacity != null) ? l.opacity : "100";
            row.appendChild(op);
            body.appendChild(row);
          });
      }
    }
    enhance() {
      if (this._wiredStylePanel) return;
      this._wiredStylePanel = true;
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (!t || !this.contains(t)) return;
        const row = t.closest(".c-style-panel__row");
        const name = row ? (row.querySelector(".c-style-panel__name")?.textContent || "") : "";
        if (t.classList.contains("c-style-panel__color")) {
          this.dispatchEvent(new CustomEvent("contour:style-resolved", { detail: { value: t.value, layer: name, property: "color" }, bubbles: true, composed: true }));
        } else if (t.classList.contains("c-style-panel__classification")) {
          this.dispatchEvent(new CustomEvent("contour:break-change", { detail: { value: t.value, layer: name }, bubbles: true, composed: true }));
        } else if (t.classList.contains("c-style-panel__opacity")) {
          this.dispatchEvent(new CustomEvent("contour:layer-opacity", { detail: { name, opacity: Number(t.value) }, bubbles: true, composed: true }));
        } else if (t.classList.contains("c-style-panel__property")) {
          this.dispatchEvent(new CustomEvent("contour:style-resolved", { detail: { value: t.value, layer: name, property: "property" }, bubbles: true, composed: true }));
        } else if (t.classList.contains("c-style-panel__n")) {
          this.dispatchEvent(new CustomEvent("contour:style-resolved", { detail: { value: Number(t.value), layer: name, property: "n" }, bubbles: true, composed: true }));
        }
      });
      this.addEventListener("input", (e) => {
        const t = e.target;
        if (!t || !this.contains(t)) return;
        if (t.classList.contains("c-style-panel__palette") || t.classList.contains("c-style-panel__breaks")) {
          const row = t.closest(".c-style-panel__row");
          const name = row ? (row.querySelector(".c-style-panel__name")?.textContent || "") : "";
          this.dispatchEvent(new CustomEvent("contour:style-resolved", { detail: { value: t.value, layer: name, property: t.classList.contains("c-style-panel__palette") ? "palette" : "breaks" }, bubbles: true, composed: true }));
        }
      });
      this.addEventListener("click", (e) => {
        const t = e.target && e.target.closest ? e.target.closest("button") : null;
        if (!t || !this.contains(t)) return;
        if (t.textContent.trim() === "Apply") {
          this.dispatchEvent(new CustomEvent("contour:style-resolved", { detail: { applied: true }, bubbles: true, composed: true }));
        } else if (t.textContent.trim() === "Revert") {
          this.dispatchEvent(new CustomEvent("contour:style-resolved", { detail: { applied: false }, bubbles: true, composed: true }));
        }
      });
    }
  }
  define("contour-style-panel", ContourStylePanel);

class ContourResponsiveContent extends ContourBase {
    static get observed() { return ["breakpoint"]; }
    static get properties() { return { breakpoint: { attribute: "breakpoint" } }; }
    render() {
      this.classList.add("c-responsive-content");
      const bp = this.getAttribute("breakpoint") || "md";
      this.dataset.breakpoint = bp;
    }
  }
  define("contour-responsive-content", ContourResponsiveContent);

class ContourAvatarGroup extends ContourBase {
    static get observed() { return ["items", "max"]; }
    static get properties() { return { items: { attribute: "items" }, max: { attribute: "max", type: Number } }; }
    render() {
      this.classList.add("c-avatar-group");
      const items = this.getAttribute("items");
      const max = parseInt(this.getAttribute("max") || "4", 10) || 4;
      Array.from(this.querySelectorAll(".c-avatar, .c-avatar-group__overflow")).forEach((n) => n.remove());
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const shown = parsed.slice(0, max);
          shown.forEach((it) => {
            const av = document.createElement("span");
            av.className = "c-avatar";
            const name = typeof it === "string" ? it : (it.name || it.label || "");
            av.textContent = name.slice(0, 2).toUpperCase();
            if (typeof it === "object" && it.color) av.style.background = it.color;
            this.appendChild(av);
          });
          if (parsed.length > max) {
            const overflow = document.createElement("span");
            overflow.className = "c-avatar c-avatar-group__overflow";
            overflow.textContent = "+" + (parsed.length - max);
            this.appendChild(overflow);
          }
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-avatar-group", ContourAvatarGroup);

class ContourDivider extends ContourBase {
    static get observed() { return ["label", "orientation"]; }
    static get properties() { return { label: { attribute: "label" }, orientation: { attribute: "orientation" } }; }
    render() {
      this.classList.add("c-divider");
      const orientation = this.getAttribute("orientation") || "horizontal";
      this.classList.add("c-divider--" + orientation);
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-divider__label", () => { const el = document.createElement("span"); el.className = "c-divider__label"; return el; });
        l.textContent = label;
      }
    }
  }
  define("contour-divider", ContourDivider);

class ContourStatusLight extends ContourBase {
    static get observed() { return ["status", "label"]; }
    static get properties() { return { status: { attribute: "status" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-status-light");
      const status = this.getAttribute("status") || "neutral";
      this.classList.add("c-status-light--" + status);
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-status-light__label", () => { const el = document.createElement("span"); el.className = "c-status-light__label"; return el; });
        l.textContent = label;
      }
    }
  }
  define("contour-status-light", ContourStatusLight);

class ContourSplitButton extends ContourBase {
    static get observed() { return ["label", "menu"]; }
    static get properties() { return { label: { attribute: "label" }, menu: { attribute: "menu" } }; }
    render() {
      this.classList.add("c-split-button");
      const main = this.ensure(".c-split-button__main", () => { const el = document.createElement("button"); el.className = "c-btn c-split-button__main"; el.type = "button"; return el; });
      main.textContent = this.getAttribute("label") || "Action";
      const toggle = this.ensure(".c-split-button__toggle", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--icon c-split-button__toggle"; el.type = "button"; el.setAttribute("aria-label", "More options"); el.textContent = "▾"; return el; });
      const menu = this.ensure(".c-split-button__menu", () => { const el = document.createElement("div"); el.className = "c-menu c-split-button__menu"; el.setAttribute("role", "menu"); el.hidden = true; return el; });
      const items = this.getAttribute("menu");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          menu.innerHTML = "";
          parsed.forEach((it) => {
            const li = document.createElement("button");
            li.className = "c-menu__item";
            li.setAttribute("role", "menuitem");
            li.textContent = typeof it === "string" ? it : (it.label || it.title || "");
            menu.appendChild(li);
          });
        } catch (e) { /* keep existing */ }
      }
      if (main.parentNode !== this) this.appendChild(main);
      if (toggle.parentNode !== this) this.appendChild(toggle);
      if (menu.parentNode !== this) this.appendChild(menu);
    }
    enhance() {
      if (this._wiredSplitButton) return;
      this._wiredSplitButton = true;
      const toggle = () => this.querySelector(".c-split-button__toggle");
      const menu = () => this.querySelector(".c-split-button__menu");
      this.addEventListener("click", (e) => {
        const t = toggle();
        if (e.target === t || (t && t.contains(e.target))) {
          const m = menu();
          if (m) { m.hidden = !m.hidden; t.setAttribute("aria-expanded", String(!m.hidden)); }
        }
      });
      const docClick = (e) => {
        const m = menu();
        const t = toggle();
        if (m && !m.hidden && !this.contains(e.target)) { m.hidden = true; if (t) t.setAttribute("aria-expanded", "false"); }
      };
      document.addEventListener("click", docClick);
      onDispose(this, () => document.removeEventListener("click", docClick));
    }
  }
  define("contour-split-button", ContourSplitButton);

class ContourPaletteEditor extends ContourBase {
    static get observed() { return ["colors"]; }
    static get properties() { return { colors: { attribute: "colors" } }; }
    render() {
      this.classList.add("c-palette-editor");
      const colors = this.getAttribute("colors");
      Array.from(this.querySelectorAll(".c-palette-editor__swatch")).forEach((n) => n.remove());
      if (colors) {
        try {
          const parsed = JSON.parse(colors);
          parsed.forEach((c) => {
            const sw = document.createElement("button");
            sw.className = "c-palette-editor__swatch c-swatch";
            sw.type = "button";
            sw.style.background = typeof c === "string" ? c : (c.color || c.value || "");
            sw.setAttribute("aria-label", typeof c === "string" ? c : (c.name || c.label || "color"));
            this.appendChild(sw);
          });
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredPaletteEditor) return;
      this._wiredPaletteEditor = true;
      this.addEventListener("click", (e) => {
        const sw = e.target && e.target.closest ? e.target.closest(".c-palette-editor__swatch") : null;
        if (sw && this.contains(sw)) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { color: sw.style.background } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const swatches = Array.from(this.querySelectorAll(".c-palette-editor__swatch"));
        const active = document.activeElement;
        const idx = swatches.indexOf(active);
        if (e.key === "ArrowRight") { e.preventDefault(); const next = swatches[Math.min(swatches.length - 1, idx + 1)] || swatches[0]; if (next) try { next.focus(); } catch (err) {} }
        else if (e.key === "ArrowLeft") { e.preventDefault(); const prev = swatches[Math.max(0, idx - 1)] || swatches[swatches.length - 1]; if (prev) try { prev.focus(); } catch (err) {} }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (active && active.classList.contains("c-palette-editor__swatch")) active.click(); }
      });
    }
  }
  define("contour-palette-editor", ContourPaletteEditor);

class ContourDateRange extends ContourBase {
    static get observed() { return ["start", "end", "label"]; }
    static get properties() { return { start: { attribute: "start" }, end: { attribute: "end" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-date-range");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-date-range__label", () => { const el = document.createElement("span"); el.className = "c-date-range__label"; return el; });
        l.textContent = label;
      }
      const start = this.ensure(".c-date-range__start", () => { const el = document.createElement("input"); el.className = "c-input c-date-range__start"; el.type = "date"; return el; });
      start.value = this.getAttribute("start") || "";
      const end = this.ensure(".c-date-range__end", () => { const el = document.createElement("input"); el.className = "c-input c-date-range__end"; el.type = "date"; return el; });
      end.value = this.getAttribute("end") || "";
    }
    enhance() {
      if (this._wiredDateRange) return;
      this._wiredDateRange = true;
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && (t.classList.contains("c-date-range__start") || t.classList.contains("c-date-range__end"))) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { start: this.querySelector(".c-date-range__start")?.value, end: this.querySelector(".c-date-range__end")?.value } }));
        }
      });
    }
  }
  define("contour-date-range", ContourDateRange);

class ContourShortcut extends ContourBase {
    static get observed() { return ["key", "label"]; }
    static get properties() { return { key: { attribute: "key" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-shortcut");
      const key = this.getAttribute("key") || "";
      const label = this.getAttribute("label") || "";
      if (key) {
        const k = this.ensure(".c-shortcut__key", () => { const el = document.createElement("kbd"); el.className = "c-shortcut__key"; return el; });
        k.textContent = key;
      }
      if (label) {
        const l = this.ensure(".c-shortcut__label", () => { const el = document.createElement("span"); el.className = "c-shortcut__label"; return el; });
        l.textContent = label;
      }
    }
    enhance() {
      if (this._wiredShortcut) return;
      this._wiredShortcut = true;
      const key = this.getAttribute("key");
      if (key) {
        const handler = (e) => {
          if (e.key === key && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true }));
          }
        };
        document.addEventListener("keydown", handler);
        onDispose(this, () => document.removeEventListener("keydown", handler));
      }
    }
  }
  define("contour-shortcut", ContourShortcut);

class ContourPopover extends ContourBase {
    static get observed() { return ["title", "content"]; }
    static get properties() { return { title: { attribute: "title" }, content: { attribute: "content" } }; }
    render() {
      this.classList.add("c-popover");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
      if (!this.hasAttribute("popover")) this.setAttribute("popover", "auto");
      if (!this.id) this.id = contourId("popover");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-popover__title", () => { const el = document.createElement("div"); el.className = "c-popover__title"; return el; });
        t.textContent = title;
      }
      const content = this.getAttribute("content");
      if (content) {
        const c = this.ensure(".c-popover__body", () => { const el = document.createElement("div"); el.className = "c-popover__body"; return el; });
        c.textContent = content;
      }
    }
  }
  define("contour-popover", ContourPopover);

class ContourDatePicker extends ContourBase {
    static get observed() { return ["value", "label"]; }
    static get properties() { return { value: { attribute: "value" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-date-picker");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-date-picker__label", () => { const el = document.createElement("label"); el.className = "c-date-picker__label"; return el; });
        l.textContent = label;
      }
      const input = this.ensure(".c-date-picker__input", () => { const el = document.createElement("input"); el.className = "c-input c-date-picker__input"; el.type = "date"; return el; });
      input.value = this.getAttribute("value") || "";
    }
    enhance() {
      if (this._wiredDatePicker) return;
      this._wiredDatePicker = true;
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && t.classList.contains("c-date-picker__input")) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: t.value } }));
        }
      });
    }
  }
  define("contour-date-picker", ContourDatePicker);

class ContourRating extends ContourBase {
    static get observed() { return ["value", "max"]; }
    static get properties() { return { value: { attribute: "value", type: Number }, max: { attribute: "max", type: Number } }; }
    render() {
      this.classList.add("c-rating");
      const max = parseInt(this.getAttribute("max") || "5", 10) || 5;
      const value = parseInt(this.getAttribute("value") || "0", 10) || 0;
      Array.from(this.querySelectorAll(".c-rating__star")).forEach((n) => n.remove());
      for (let i = 1; i <= max; i++) {
        const star = document.createElement("button");
        star.className = "c-rating__star" + (i <= value ? " c-rating__star--filled" : "");
        star.type = "button";
        star.textContent = "★";
        star.dataset.value = String(i);
        star.setAttribute("aria-label", i + " star" + (i > 1 ? "s" : ""));
        this.appendChild(star);
      }
    }
    enhance() {
      if (this._wiredRating) return;
      this._wiredRating = true;
      this.addEventListener("click", (e) => {
        const star = e.target && e.target.closest ? e.target.closest(".c-rating__star") : null;
        if (star && this.contains(star)) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: parseInt(star.dataset.value, 10) } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const stars = Array.from(this.querySelectorAll(".c-rating__star"));
        const active = document.activeElement;
        const idx = stars.indexOf(active);
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          const next = stars[Math.min(stars.length - 1, idx + 1)] || stars[0];
          if (next) { try { next.focus(); } catch (err) {} }
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          const prev = stars[Math.max(0, idx - 1)] || stars[stars.length - 1];
          if (prev) { try { prev.focus(); } catch (err) {} }
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (active && active.classList.contains("c-rating__star")) {
            this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: parseInt(active.dataset.value, 10) } }));
          }
        }
      });
    }
  }
  define("contour-rating", ContourRating);

class ContourTimePicker extends ContourBase {
    static get observed() { return ["value", "label"]; }
    static get properties() { return { value: { attribute: "value" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-time-picker");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-time-picker__label", () => { const el = document.createElement("label"); el.className = "c-time-picker__label"; return el; });
        l.textContent = label;
      }
      const input = this.ensure(".c-time-picker__input", () => { const el = document.createElement("input"); el.className = "c-input c-time-picker__input"; el.type = "time"; return el; });
      input.value = this.getAttribute("value") || "";
    }
    enhance() {
      if (this._wiredTimePicker) return;
      this._wiredTimePicker = true;
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && t.classList.contains("c-time-picker__input")) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: t.value } }));
        }
      });
    }
  }
  define("contour-time-picker", ContourTimePicker);

class ContourColorPicker extends ContourBase {
    static get observed() { return ["value", "label"]; }
    static get properties() { return { value: { attribute: "value" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-color-picker");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-color-picker__label", () => { const el = document.createElement("label"); el.className = "c-color-picker__label"; return el; });
        l.textContent = label;
      }
      const input = this.ensure(".c-color-picker__input", () => { const el = document.createElement("input"); el.className = "c-color-picker__input"; el.type = "color"; return el; });
      input.value = this.getAttribute("value") || "#000000";
    }
    enhance() {
      if (this._wiredColorPicker) return;
      this._wiredColorPicker = true;
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && t.classList.contains("c-color-picker__input")) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: t.value } }));
        }
      });
    }
  }
  define("contour-color-picker", ContourColorPicker);

class ContourNumberField extends ContourBase {
    static get observed() { return ["value", "min", "max", "step", "label"]; }
    static get properties() { return { value: { attribute: "value" }, min: { attribute: "min" }, max: { attribute: "max" }, step: { attribute: "step" }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-number-field");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-number-field__label", () => { const el = document.createElement("label"); el.className = "c-number-field__label"; return el; });
        l.textContent = label;
      }
      const input = this.ensure(".c-number-field__input", () => { const el = document.createElement("input"); el.className = "c-input c-number-field__input"; el.type = "number"; return el; });
      if (this.getAttribute("value") !== null) input.value = this.getAttribute("value");
      if (this.getAttribute("min") !== null) input.min = this.getAttribute("min");
      if (this.getAttribute("max") !== null) input.max = this.getAttribute("max");
      if (this.getAttribute("step") !== null) input.step = this.getAttribute("step");
    }
    enhance() {
      if (this._wiredNumberField) return;
      this._wiredNumberField = true;
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && t.classList.contains("c-number-field__input")) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: t.value } }));
        }
      });
    }
  }
  define("contour-number-field", ContourNumberField);

class ContourHoverCard extends ContourBase {
    static get observed() { return ["title", "content", "anchor"]; }
    static get properties() { return { title: { attribute: "title" }, content: { attribute: "content" }, anchor: { attribute: "anchor" } }; }
    render() {
      this.classList.add("c-hover-card");
      if (!this.hasAttribute("role")) this.setAttribute("role", "tooltip");
      if (!this.hasAttribute("popover")) this.setAttribute("popover", "auto");
      if (!this.id) this.id = contourId("hover-card");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-hover-card__title", () => { const el = document.createElement("div"); el.className = "c-hover-card__title"; return el; });
        t.textContent = title;
      }
      const content = this.getAttribute("content");
      if (content) {
        const c = this.ensure(".c-hover-card__body", () => { const el = document.createElement("div"); el.className = "c-hover-card__body"; return el; });
        c.textContent = content;
      }
    }
    enhance() {
      if (this._wiredHoverCard) return;
      this._wiredHoverCard = true;
      const anchorSel = this.getAttribute("anchor");
      if (anchorSel) {
        const trigger = anchorSel.startsWith("#") ? document.getElementById(anchorSel.slice(1)) : document.querySelector(anchorSel);
        if (trigger) {
          trigger.setAttribute("popovertarget", this.id);
          let showTimer = null;
          const hasPopover = typeof this.showPopover === "function";
          trigger.addEventListener("mouseenter", () => { showTimer = setTimeout(() => { if (hasPopover) { try { this.showPopover(); } catch (e) {} } else this.classList.add("is-open"); }, 300); });
          trigger.addEventListener("mouseleave", () => { if (showTimer) clearTimeout(showTimer); if (hasPopover) { try { this.hidePopover(); } catch (e) {} } else this.classList.remove("is-open"); });
        }
      }
    }
  }
  define("contour-hover-card", ContourHoverCard);

class ContourContextMenu extends ContourBase {
    static get observed() { return ["items"]; }
    static get properties() { return { items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-context-menu");
      if (!this.hasAttribute("role")) this.setAttribute("role", "menu");
      if (!this.hasAttribute("popover")) this.setAttribute("popover", "auto");
      if (!this.id) this.id = contourId("context-menu");
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          this.innerHTML = "";
          parsed.forEach((it) => {
            const btn = document.createElement("button");
            btn.className = "c-menu__item";
            btn.setAttribute("role", "menuitem");
            btn.textContent = typeof it === "string" ? it : (it.label || it.title || "");
            this.appendChild(btn);
          });
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredContextMenu) return;
      this._wiredContextMenu = true;
      this.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (typeof this.showPopover === "function") { try { this.showPopover(); } catch (err) {} }
        else this.classList.toggle("is-open");
      });
      this.addEventListener("click", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".c-menu__item") : null;
        if (item && this.contains(item)) {
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { label: item.textContent.trim() } }));
          if (typeof this.hidePopover === "function") { try { this.hidePopover(); } catch (err) {} }
          this.classList.remove("is-open");
        }
      });
      this.addEventListener("keydown", (e) => {
        const items = Array.from(this.querySelectorAll(".c-menu__item"));
        const active = document.activeElement;
        const idx = items.indexOf(active);
        if (e.key === "ArrowDown") { e.preventDefault(); const next = items[Math.min(items.length - 1, idx + 1)] || items[0]; if (next) try { next.focus(); } catch (err) {} }
        else if (e.key === "ArrowUp") { e.preventDefault(); const prev = items[Math.max(0, idx - 1)] || items[items.length - 1]; if (prev) try { prev.focus(); } catch (err) {} }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (active && active.classList.contains("c-menu__item")) active.click(); }
        else if (e.key === "Escape") { e.preventDefault(); if (typeof this.hidePopover === "function") { try { this.hidePopover(); } catch (err) {} } this.classList.remove("is-open"); }
      });
    }
  }
  define("contour-context-menu", ContourContextMenu);

class ContourFab extends ContourBase {
    static get observed() { return ["label", "icon"]; }
    static get properties() { return { label: { attribute: "label" }, icon: { attribute: "icon" } }; }
    render() {
      this.classList.add("c-fab");
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      const label = this.getAttribute("label");
      if (label) this.setAttribute("aria-label", label);
      const icon = this.getAttribute("icon");
      if (icon && !this.hasChildNodes()) this.textContent = icon;
    }
    enhance() {
      if (this._wiredFab) return;
      this._wiredFab = true;
      this.addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true }));
      });
    }
  }
  define("contour-fab", ContourFab);

class ContourFileUpload extends ContourBase {
    static get observed() { return ["label", "accept", "multiple", "progress"]; }
    static get properties() { return { label: { attribute: "label" }, accept: { attribute: "accept" }, multiple: { attribute: "multiple", type: Boolean }, progress: { attribute: "progress" } }; }
    render() {
      this.classList.add("c-file-upload");
      const label = this.getAttribute("label") || "Drop files here or click to browse";
      const dz = this.ensure(".c-file-upload__dropzone", () => { const el = document.createElement("div"); el.className = "c-file-upload__dropzone"; el.setAttribute("role", "button"); el.tabIndex = 0; return el; });
      dz.textContent = label;
      const input = this.ensure(".c-file-upload__input", () => { const el = document.createElement("input"); el.className = "c-file-upload__input"; el.type = "file"; el.hidden = true; return el; });
      input.accept = this.getAttribute("accept") || "";
      input.multiple = this.hasAttribute("multiple");
      const p = this.getAttribute("progress");
      if (p !== null) {
        const bar = this.ensure(".c-file-upload__progress", () => { const el = document.createElement("progress"); el.className = "c-file-upload__progress"; return el; });
        bar.value = Number(p) || 0;
        bar.max = 100;
      }
    }
    enhance() {
      if (this._wiredFileUpload) return;
      this._wiredFileUpload = true;
      const dz = () => this.querySelector(".c-file-upload__dropzone");
      const input = () => this.querySelector(".c-file-upload__input");
      const activate = () => { const i = input(); if (i) i.click(); };
      this.addEventListener("click", (e) => { const d = dz(); if (e.target === d || (d && d.contains(e.target))) { activate(); } });
      this.addEventListener("keydown", (e) => { const d = dz(); if ((e.target === d || (d && d.contains(e.target))) && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); activate(); } });
      this.addEventListener("change", (e) => { const t = e.target; if (t && t.classList.contains("c-file-upload__input")) { this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { files: t.files } })); } });
      this.addEventListener("dragover", (e) => { e.preventDefault(); this.classList.add("is-dragover"); });
      this.addEventListener("dragleave", () => this.classList.remove("is-dragover"));
      this.addEventListener("drop", (e) => { e.preventDefault(); this.classList.remove("is-dragover"); const i = input(); if (i && e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) { try { i.files = e.dataTransfer.files; } catch (err) { /* some browsers disallow */ } this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { files: e.dataTransfer.files } })); } });
    }
  }
  define("contour-file-upload", ContourFileUpload);

class ContourNotificationCenter extends ContourBase {
    static get observed() { return ["count", "items"]; }
    static get properties() { return { count: { attribute: "count" }, items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-notification-center");
      const btn = this.ensure(".c-notification-center__trigger", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-notification-center__trigger"; el.type = "button"; el.textContent = "🔔"; return el; });
      const count = this.getAttribute("count");
      let badge = this.querySelector(".c-notification-center__badge");
      if (count && Number(count) > 0) {
        if (!badge) { badge = document.createElement("span"); badge.className = "c-notification-center__badge c-badge c-badge--dot"; this.appendChild(badge); }
        badge.textContent = count;
      } else if (badge) { badge.remove(); }
      const panel = this.ensure(".c-notification-center__panel", () => { const el = document.createElement("div"); el.className = "c-notification-center__panel"; el.hidden = true; return el; });
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          panel.innerHTML = "";
          parsed.forEach((it) => {
            const row = document.createElement("div");
            row.className = "c-notification-center__item";
            row.setAttribute("tabindex", "0");
            row.setAttribute("role", "option");
            row.textContent = typeof it === "string" ? it : (it.text || it.title || "");
            panel.appendChild(row);
          });
        } catch (e) { /* keep */ }
      }
    }
    enhance() {
      if (this._wiredNotifCenter) return;
      this._wiredNotifCenter = true;
      this.addEventListener("click", (e) => {
        const btn = this.querySelector(".c-notification-center__trigger");
        const panel = this.querySelector(".c-notification-center__panel");
        if (btn && (e.target === btn || btn.contains(e.target))) {
          if (panel) { panel.hidden = !panel.hidden; btn.setAttribute("aria-expanded", String(!panel.hidden)); }
        }
      });
      const docClick = (e) => {
        const panel = this.querySelector(".c-notification-center__panel");
        const btn = this.querySelector(".c-notification-center__trigger");
        if (panel && !panel.hidden && !this.contains(e.target)) { panel.hidden = true; if (btn) btn.setAttribute("aria-expanded", "false"); }
      };
      document.addEventListener("click", docClick);
      onDispose(this, () => document.removeEventListener("click", docClick));
      const keyHandler = (e) => {
        const panel = this.querySelector(".c-notification-center__panel");
        const btn = this.querySelector(".c-notification-center__trigger");
        if (e.key === "Escape" && panel && !panel.hidden) { panel.hidden = true; if (btn) { btn.setAttribute("aria-expanded", "false"); try { btn.focus(); } catch (err) {} } return; }
        if (!panel || panel.hidden) return;
        const items = Array.from(panel.querySelectorAll(".c-notification-center__item"));
        if (!items.length) return;
        const active = document.activeElement;
        const idx = items.indexOf(active);
        if (e.key === "ArrowDown") { e.preventDefault(); const next = items[Math.min(items.length - 1, idx + 1)] || items[0]; if (next) try { next.focus(); } catch (err) {} }
        else if (e.key === "ArrowUp") { e.preventDefault(); const prev = items[Math.max(0, idx - 1)] || items[items.length - 1]; if (prev) try { prev.focus(); } catch (err) {} }
      };
      document.addEventListener("keydown", keyHandler);
      onDispose(this, () => document.removeEventListener("keydown", keyHandler));
    }
  }
  define("contour-notification-center", ContourNotificationCenter);

class ContourStepper extends ContourBase {
    static get observed() { return ["steps", "current"]; }
    static get properties() { return { steps: { attribute: "steps" }, current: { attribute: "current" } }; }
    render() {
      this.classList.add("c-stepper");
      const steps = this.getAttribute("steps");
      const current = Number(this.getAttribute("current") || 0);
      const list = this.ensure(".c-stepper__list", () => { const el = document.createElement("ol"); el.className = "c-stepper__list"; return el; });
      list.innerHTML = "";
      let parsed = [];
      try { parsed = steps ? JSON.parse(steps) : []; } catch (e) { parsed = []; }
      parsed.forEach((s, i) => {
        const li = document.createElement("li");
        li.className = "c-stepper__step" + (i === current ? " is-current" : "") + (i < current ? " is-done" : "");
        if (i === current) li.setAttribute("aria-current", "step");
        li.textContent = typeof s === "string" ? s : (s.title || s.label || "");
        list.appendChild(li);
      });
      const nav = this.ensure(".c-stepper__nav", () => { const el = document.createElement("div"); el.className = "c-stepper__nav"; return el; });
      const prev = this.ensure(".c-stepper__prev", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-stepper__prev"; el.type = "button"; el.textContent = "Back"; return el; });
      const next = this.ensure(".c-stepper__next", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-stepper__next"; el.type = "button"; el.textContent = "Next"; return el; });
      if (!nav.contains(prev)) nav.appendChild(prev);
      if (!nav.contains(next)) nav.appendChild(next);
      if (nav.parentNode !== this) this.appendChild(nav);
    }
    enhance() {
      if (this._wiredStepper) return;
      this._wiredStepper = true;
      this.addEventListener("click", (e) => {
        const prev = e.target && e.target.closest ? e.target.closest(".c-stepper__prev") : null;
        const next = e.target && e.target.closest ? e.target.closest(".c-stepper__next") : null;
        if (prev && this.contains(prev)) this.dispatchEvent(new CustomEvent("contour:step-change", { bubbles: true, composed: true, detail: { direction: "prev" } }));
        if (next && this.contains(next)) this.dispatchEvent(new CustomEvent("contour:step-change", { bubbles: true, composed: true, detail: { direction: "next" } }));
      });
    }
  }
  define("contour-stepper", ContourStepper);

class ContourVirtualList extends ContourBase {
    static get observed() { return ["items", "item-height"]; }
    static get properties() { return { items: { attribute: "items" }, "item-height": { attribute: "item-height" } }; }
    _items() {
      const items = this.getAttribute("items");
      let parsed = [];
      try { parsed = items ? JSON.parse(items) : []; } catch (e) { parsed = []; }
      return Array.isArray(parsed) ? parsed : [];
    }
    _itemHeight() {
      const h = Number(this.getAttribute("item-height"));
      return Number.isFinite(h) && h > 0 ? h : 28;
    }
    render() {
      this.classList.add("c-virtual-list");
      const scroller = this.ensure(".c-virtual-list__scroller", () => { const el = document.createElement("div"); el.className = "c-virtual-list__scroller"; return el; });
      const inner = this.ensure(".c-virtual-list__inner", () => { const el = document.createElement("div"); el.className = "c-virtual-list__inner"; el.style.position = "relative"; return el; });
      if (inner.parentNode !== scroller) scroller.appendChild(inner);
      this._renderWindow(scroller, inner, scroller.scrollTop || 0);
    }
    _renderWindow(scroller, inner, scrollTop) {
      const items = this._items();
      const ih = this._itemHeight();
      const viewportH = scroller.clientHeight || 320;
      const visibleCount = Math.ceil(viewportH / ih) + 4;
      const total = items.length;
      let start = Math.floor((scrollTop || 0) / ih);
      if (start < 0) start = 0;
      if (start > Math.max(0, total - visibleCount)) start = Math.max(0, total - visibleCount);
      const end = Math.min(total, start + visibleCount);
      const topSpacerH = start * ih;
      const bottomSpacerH = Math.max(0, (total - end) * ih);
      inner.innerHTML = "";
      const top = document.createElement("div");
      top.className = "c-virtual-list__spacer c-virtual-list__spacer--top";
      top.style.height = topSpacerH + "px";
      inner.appendChild(top);
      for (let i = start; i < end; i++) {
        const row = document.createElement("div");
        row.className = "c-virtual-list__item";
        row.textContent = typeof items[i] === "string" ? items[i] : (items[i].label || items[i].text || JSON.stringify(items[i]));
        row.dataset.index = String(i);
        inner.appendChild(row);
      }
      const bottom = document.createElement("div");
      bottom.className = "c-virtual-list__spacer c-virtual-list__spacer--bottom";
      bottom.style.height = bottomSpacerH + "px";
      inner.appendChild(bottom);
      inner.style.height = (total * ih) + "px";
    }
    enhance() {
      if (this._wiredVirtualList) return;
      this._wiredVirtualList = true;
      const scroller = () => this.querySelector(".c-virtual-list__scroller");
      const inner = () => this.querySelector(".c-virtual-list__inner");
      let raf = 0;
      const onScroll = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const s = scroller(); const i = inner();
          if (s && i) this._renderWindow(s, i, s.scrollTop);
        });
      };
      const s = scroller();
      if (s) {
        s.addEventListener("scroll", onScroll, { passive: true });
        onDispose(this, () => { s.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); });
      }
    }
  }
  define("contour-virtual-list", ContourVirtualList);

class ContourCommandPalette extends ContourBase {
    static get observed() { return ["open", "items"]; }
    static get properties() { return { open: { attribute: "open", type: Boolean }, items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-command-palette");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
      if (!this.hasAttribute("aria-modal")) this.setAttribute("aria-modal", "true");
      if (!this.hasAttribute("popover")) this.setAttribute("popover", "auto");
      const search = this.ensure(".c-command-palette__search", () => { const el = document.createElement("input"); el.className = "c-input c-command-palette__search"; el.type = "search"; el.placeholder = "Search…"; return el; });
      const list = this.ensure(".c-command-palette__list", () => { const el = document.createElement("div"); el.className = "c-command-palette__list"; el.setAttribute("role", "listbox"); return el; });
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          list.innerHTML = "";
          parsed.forEach((it, i) => {
            const row = document.createElement("div");
            row.className = "c-command-palette__item";
            row.setAttribute("role", "option");
            row.id = this.id + "-opt-" + i;
            row.textContent = typeof it === "string" ? it : (it.label || it.title || "");
            row.dataset.index = String(i);
            row.dataset.label = row.textContent;
            list.appendChild(row);
          });
        } catch (e) { /* keep */ }
      }
    }
    show() { if (typeof this.showPopover === "function") { try { this.showPopover(); } catch (e) {} } this.classList.add("is-open"); }
    hide() { if (typeof this.hidePopover === "function") { try { this.hidePopover(); } catch (e) {} } this.classList.remove("is-open"); }
    toggle() { if (this.classList.contains("is-open") || this.matches(":popover-open")) this.hide(); else this.show(); }
    enhance() {
      this._wiredCmdPalette = true;
      const search = () => this.querySelector(".c-command-palette__search");
      const list = () => this.querySelector(".c-command-palette__list");
      const items = () => Array.from(this.querySelectorAll(".c-command-palette__item"));
      const visibleItems = () => items().filter((it) => !it.hidden);
      const setActive = (idx) => {
        const vis = visibleItems();
        vis.forEach((it, i) => it.classList.toggle("is-active", i === idx));
        const active = vis[idx];
        const s = search();
        if (s && active) s.setAttribute("aria-activedescendant", active.id);
        else if (s) s.removeAttribute("aria-activedescendant");
      };
      const filter = (q) => {
        const needle = (q || "").toLowerCase().trim();
        items().forEach((it) => {
          const label = (it.dataset.label || it.textContent || "").toLowerCase();
          it.hidden = needle !== "" && !label.includes(needle);
        });
        setActive(0);
      };
      const select = (it) => {
        if (!it) return;
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: Number(it.dataset.index), label: it.dataset.label || it.textContent } }));
        try { this.hidePopover(); } catch (e) {}
        this.classList.remove("is-open");
      };
      const s = search();
      if (s) {
        s.setAttribute("role", "combobox");
        s.setAttribute("aria-autocomplete", "list");
        s.setAttribute("aria-controls", list() ? list().id || "" : "");
        if (!list().id) list().id = this.id + "-list";
        s.setAttribute("aria-controls", list().id);
        s.addEventListener("input", (e) => filter(e.target.value));
        s.addEventListener("keydown", (e) => {
          const vis = visibleItems();
          const active = this.querySelector(".c-command-palette__item.is-active");
          let idx = active ? vis.indexOf(active) : -1;
          if (e.key === "ArrowDown") { e.preventDefault(); idx = Math.min(vis.length - 1, idx + 1); if (idx < 0) idx = 0; setActive(idx); }
          else if (e.key === "ArrowUp") { e.preventDefault(); idx = Math.max(0, idx - 1); if (vis.length && idx < 0) idx = 0; setActive(idx); }
          else if (e.key === "Home") { e.preventDefault(); setActive(0); }
          else if (e.key === "End") { e.preventDefault(); setActive(vis.length - 1); }
          else if (e.key === "Enter") { e.preventDefault(); if (active) select(active); }
          else if (e.key === "Escape") { e.preventDefault(); try { this.hidePopover(); } catch (e) {} this.classList.remove("is-open"); }
        });
      }
      // click selection
      this.addEventListener("click", (e) => {
        const it = e.target && e.target.closest ? e.target.closest(".c-command-palette__item") : null;
        if (it && this.contains(it) && !it.hidden) select(it);
      });
      // focus return on close
      let lastFocus = null;
      this.addEventListener("beforetoggle", (e) => {
        if (e.newState === "open") lastFocus = document.activeElement;
        else if (lastFocus && typeof lastFocus.focus === "function") { try { lastFocus.focus(); } catch (err) {} }
      });
      // Escape via popover light dismiss is handled by keydown above; also close on outside handled by popover.
      setActive(0);
    }
  }
  define("contour-command-palette", ContourCommandPalette);

class ContourBadgeOverflow extends ContourBase {
    static get observed() { return ["count", "max"]; }
    static get properties() { return { count: { attribute: "count" }, max: { attribute: "max" } }; }
    render() {
      this.classList.add("c-badge-overflow");
      const count = Number(this.getAttribute("count") || 0);
      const max = Number(this.getAttribute("max") || 3);
      const extra = Math.max(0, count - max);
      this.textContent = "";
      if (extra > 0) {
        const b = document.createElement("span");
        b.className = "c-badge c-badge-overflow__more";
        b.textContent = "+" + extra;
        this.appendChild(b);
      }
    }
  }
  define("contour-badge-overflow", ContourBadgeOverflow);

class ContourSideSheet extends ContourBase {
    static get observed() { return ["open", "side", "title"]; }
    static get properties() { return { open: { attribute: "open", type: Boolean }, side: { attribute: "side" }, title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-side-sheet");
      this.setAttribute("role", "dialog");
      this.setAttribute("aria-modal", "true");
      const side = this.getAttribute("side") || "end";
      this.classList.add("c-side-sheet--" + side);
      if (this.hasAttribute("open")) this.classList.add("is-open");
      else this.classList.remove("is-open");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-side-sheet__title", () => { const el = document.createElement("div"); el.className = "c-side-sheet__title"; return el; });
        t.textContent = title;
      }
    }
    enhance() {
      if (this._wiredSideSheet) return;
      this._wiredSideSheet = true;
      let lastFocus = null;
      const close = () => this.removeAttribute("open");
      const keyHandler = (e) => {
        if (e.key === "Escape" && this.hasAttribute("open")) { e.preventDefault(); close(); return; }
        if (e.key === "Tab" && this.hasAttribute("open")) {
          const focusables = Array.from(this.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")).filter((el) => !el.hasAttribute("disabled"));
          if (!focusables.length) { e.preventDefault(); return; }
          const first = focusables[0], last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      };
      document.addEventListener("keydown", keyHandler);
      onDispose(this, () => document.removeEventListener("keydown", keyHandler));
      this.addEventListener("click", (e) => {
        if (e.target === this) close();
      });
      // Focus management: capture focus on open, restore on close.
      const obs = new MutationObserver(() => {
        if (this.hasAttribute("open")) {
          lastFocus = document.activeElement;
          const first = this.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
          if (first) try { first.focus(); } catch (err) {}
        } else if (lastFocus) {
          try { lastFocus.focus(); } catch (err) {}
          lastFocus = null;
        }
      });
      obs.observe(this, { attributes: true, attributeFilter: ["open"] });
      onDispose(this, () => obs.disconnect());
    }
  }
  define("contour-side-sheet", ContourSideSheet);

class ContourTour extends ContourBase {
    static get observed() { return ["steps", "current"]; }
    static get properties() { return { steps: { attribute: "steps" }, current: { attribute: "current" } }; }
    render() {
      this.classList.add("c-tour");
      this.setAttribute("role", "dialog");
      this.setAttribute("aria-modal", "true");
      const steps = this.getAttribute("steps");
      const current = Number(this.getAttribute("current") || 0);
      let parsed = [];
      try { parsed = steps ? JSON.parse(steps) : []; } catch (e) { parsed = []; }
      const step = parsed[current] || {};
      const tip = this.ensure(".c-tour__tip", () => { const el = document.createElement("div"); el.className = "c-tour__tip"; return el; });
      tip.textContent = typeof step === "string" ? step : (step.text || step.title || "");
      const nav = this.ensure(".c-tour__nav", () => { const el = document.createElement("div"); el.className = "c-tour__nav"; return el; });
      const next = this.ensure(".c-tour__next", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-tour__next"; el.type = "button"; el.textContent = "Next"; return el; });
      if (!nav.contains(next)) nav.appendChild(next);
    }
    enhance() {
      if (this._wiredTour) return;
      this._wiredTour = true;
      const nextBtn = this.querySelector(".c-tour__next");
      if (nextBtn) try { nextBtn.focus(); } catch (err) {}
      this.addEventListener("click", (e) => {
        const next = e.target && e.target.closest ? e.target.closest(".c-tour__next") : null;
        if (next && this.contains(next)) this.dispatchEvent(new CustomEvent("contour:step-change", { bubbles: true, composed: true, detail: { direction: "next" } }));
      });
      const keyHandler = (e) => { if (e.key === "Escape") this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true })); };
      document.addEventListener("keydown", keyHandler);
      onDispose(this, () => document.removeEventListener("keydown", keyHandler));
    }
  }
  define("contour-tour", ContourTour);

class ContourTagsInput extends ContourBase {
    static get observed() { return ["value", "placeholder"]; }
    static get properties() { return { value: { attribute: "value" }, placeholder: { attribute: "placeholder" } }; }
    render() {
      this.classList.add("c-tags-input");
      const input = this.ensure(".c-tags-input__input", () => { const el = document.createElement("input"); el.className = "c-input c-tags-input__input"; el.type = "text"; return el; });
      input.placeholder = this.getAttribute("placeholder") || "Add tag…";
      const tags = this.getAttribute("value");
      let parsed = [];
      try { parsed = tags ? JSON.parse(tags) : []; } catch (e) { parsed = tags ? tags.split(",").map((s) => s.trim()).filter(Boolean) : []; }
      Array.from(this.querySelectorAll(".c-tags-input__tag")).forEach((n) => n.remove());
      parsed.forEach((t) => {
        const chip = document.createElement("span");
        chip.className = "c-tag c-tags-input__tag";
        chip.textContent = t;
        const rm = document.createElement("button");
        rm.className = "c-tags-input__remove";
        rm.type = "button";
        rm.textContent = "×";
        rm.dataset.value = t;
        chip.appendChild(rm);
        this.insertBefore(chip, input);
      });
    }
    enhance() {
      if (this._wiredTagsInput) return;
      this._wiredTagsInput = true;
      let live = this.querySelector(".c-tags-input__live");
      if (!live) { live = document.createElement("span"); live.className = "c-tags-input__live visually-hidden"; live.setAttribute("aria-live", "polite"); live.setAttribute("aria-atomic", "true"); this.appendChild(live); }
      const announce = (msg) => { if (live) live.textContent = msg; };
      this.addEventListener("keydown", (e) => {
        const input = this.querySelector(".c-tags-input__input");
        if (!input) return;
        if (e.key === "Enter" && e.target === input) {
          e.preventDefault();
          const v = input.value.trim();
          if (v) {
            let tags = [];
            try { tags = JSON.parse(this.getAttribute("value") || "[]"); } catch (err) { tags = (this.getAttribute("value") || "").split(",").map((s) => s.trim()).filter(Boolean); }
            if (!Array.isArray(tags)) tags = [];
            if (!tags.includes(v)) tags.push(v);
            this.setAttribute("value", JSON.stringify(tags));
            input.value = "";
            announce("Added " + v);
            this.dispatchEvent(new CustomEvent("contour:add", { bubbles: true, composed: true, detail: { value: v } }));
          }
        } else if (e.key === "Backspace" && e.target === input && input.value === "") {
          let tags = [];
          try { tags = JSON.parse(this.getAttribute("value") || "[]"); } catch (err) { tags = (this.getAttribute("value") || "").split(",").map((s) => s.trim()).filter(Boolean); }
          if (!Array.isArray(tags)) tags = [];
          if (tags.length) {
            const removed = tags.pop();
            this.setAttribute("value", JSON.stringify(tags));
            announce("Removed " + removed);
            this.dispatchEvent(new CustomEvent("contour:remove", { bubbles: true, composed: true, detail: { value: removed } }));
          }
        }
      });
      this.addEventListener("click", (e) => {
        const rm = e.target && e.target.closest ? e.target.closest(".c-tags-input__remove") : null;
        if (rm && this.contains(rm)) {
          const val = rm.dataset.value;
          let tags = [];
          try { tags = JSON.parse(this.getAttribute("value") || "[]"); } catch (err) { tags = (this.getAttribute("value") || "").split(",").map((s) => s.trim()).filter(Boolean); }
          if (!Array.isArray(tags)) tags = [];
          const next = tags.filter((t) => t !== val);
          this.setAttribute("value", JSON.stringify(next));
          announce("Removed " + val);
          this.dispatchEvent(new CustomEvent("contour:remove", { bubbles: true, composed: true, detail: { value: val } }));
        }
      });
    }
  }
  define("contour-tags-input", ContourTagsInput);

class ContourSortableList extends ContourBase {
    static get observed() { return ["items"]; }
    static get properties() { return { items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-sortable-list");
      const list = this.ensure(".c-sortable-list__list", () => { const el = document.createElement("ul"); el.className = "c-sortable-list__list"; return el; });
      const items = this.getAttribute("items");
      let parsed = [];
      try { parsed = items ? JSON.parse(items) : []; } catch (e) { parsed = []; }
      list.innerHTML = "";
      parsed.forEach((it, i) => {
        const li = document.createElement("li");
        li.className = "c-sortable-list__item";
        li.setAttribute("draggable", "true");
        li.dataset.index = String(i);
        const handle = document.createElement("span");
        handle.className = "c-sortable-list__handle";
        handle.textContent = "⋮⋮";
        handle.setAttribute("role", "button");
        handle.tabIndex = 0;
        li.appendChild(handle);
        const label = document.createElement("span");
        label.className = "c-sortable-list__label";
        label.textContent = typeof it === "string" ? it : (it.label || it.text || "");
        li.appendChild(label);
        list.appendChild(li);
      });
    }
    enhance() {
      if (this._wiredSortableList) return;
      this._wiredSortableList = true;
      const list = () => this.querySelector(".c-sortable-list__list");
      // Live region for position announcements.
      let live = this.querySelector(".c-sortable-list__live");
      if (!live) { live = document.createElement("span"); live.className = "c-sortable-list__live visually-hidden"; live.setAttribute("aria-live", "polite"); live.setAttribute("aria-atomic", "true"); this.appendChild(live); }
      const announce = (msg) => { if (live) live.textContent = msg; };
      const index = (li) => Array.from(list().children).indexOf(li);
      // Pointer drag reorder.
      let dragFrom = null;
      this.addEventListener("dragstart", (e) => {
        const li = e.target && e.target.closest ? e.target.closest(".c-sortable-list__item") : null;
        if (!li || !this.contains(li)) return;
        dragFrom = index(li);
        if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", String(dragFrom)); } catch (err) {} }
        li.classList.add("is-dragging");
      });
      this.addEventListener("dragover", (e) => {
        const li = e.target && e.target.closest ? e.target.closest(".c-sortable-list__item") : null;
        if (!li || !this.contains(li) || dragFrom === null) return;
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      });
      this.addEventListener("drop", (e) => {
        const li = e.target && e.target.closest ? e.target.closest(".c-sortable-list__item") : null;
        if (!li || !this.contains(li) || dragFrom === null) return;
        e.preventDefault();
        const to = index(li);
        const l = list();
        const fromLi = l.children[dragFrom];
        if (fromLi && dragFrom !== to) {
          if (dragFrom < to) l.insertBefore(fromLi, l.children[to + 1] || null);
          else l.insertBefore(fromLi, l.children[to]);
          const item = fromLi.querySelector(".c-sortable-list__label");
          announce((item ? item.textContent : "Item") + " moved to position " + (to + 1));
          this.dispatchEvent(new CustomEvent("contour:reorder", { bubbles: true, composed: true, detail: { from: dragFrom, to } }));
        }
        dragFrom = null;
        Array.from(l.children).forEach((n) => n.classList.remove("is-dragging"));
      });
      this.addEventListener("dragend", () => {
        dragFrom = null;
        const l = list();
        if (l) Array.from(l.children).forEach((n) => n.classList.remove("is-dragging"));
      });
      // Keyboard reorder.
      this.addEventListener("keydown", (e) => {
        const handle = e.target && e.target.closest ? e.target.closest(".c-sortable-list__handle") : null;
        if (!handle) return;
        const li = handle.closest(".c-sortable-list__item");
        if (!li) return;
        const l = list();
        const from = index(li);
        if (e.key === "ArrowUp" && li.previousElementSibling) {
          e.preventDefault();
          l.insertBefore(li, li.previousElementSibling);
          const to = index(li);
          const label = li.querySelector(".c-sortable-list__label");
          announce((label ? label.textContent : "Item") + " moved to position " + (to + 1));
          this.dispatchEvent(new CustomEvent("contour:move", { bubbles: true, composed: true, detail: { direction: "up", from, to } }));
          this.dispatchEvent(new CustomEvent("contour:reorder", { bubbles: true, composed: true, detail: { from, to } }));
        }
        if (e.key === "ArrowDown" && li.nextElementSibling) {
          e.preventDefault();
          l.insertBefore(li.nextElementSibling, li);
          const to = index(li);
          const label = li.querySelector(".c-sortable-list__label");
          announce((label ? label.textContent : "Item") + " moved to position " + (to + 1));
          this.dispatchEvent(new CustomEvent("contour:move", { bubbles: true, composed: true, detail: { direction: "down", from, to } }));
          this.dispatchEvent(new CustomEvent("contour:reorder", { bubbles: true, composed: true, detail: { from, to } }));
        }
      });
    }
  }
  define("contour-sortable-list", ContourSortableList);

class ContourSwatch extends ContourBase {
    static get observed() { return ["color", "selected", "label"]; }
    static get properties() { return { color: { attribute: "color" }, selected: { attribute: "selected", type: Boolean }, label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-swatch");
      const color = this.getAttribute("color") || "#000";
      this.style.setProperty("--swatch-color", color);
      if (this.hasAttribute("selected")) this.classList.add("is-selected");
      else this.classList.remove("is-selected");
      if (!this.hasAttribute("aria-label")) {
        const label = this.getAttribute("label") || color;
        this.setAttribute("aria-label", label);
      }
      if (!this.querySelector("button") && !this.querySelector("span")) {
        const btn = document.createElement("button");
        btn.className = "c-swatch__btn";
        btn.type = "button";
        this.appendChild(btn);
      }
    }
    enhance() {
      if (this._wiredSwatch) return;
      this._wiredSwatch = true;
      this.addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { value: this.getAttribute("color") } }));
      });
    }
  }
  define("contour-swatch", ContourSwatch);

class ContourCalendar extends ContourBase {
    static get observed() { return ["value"]; }
    static get properties() { return { value: { attribute: "value" }, month: { attribute: "month" }, year: { attribute: "year" } }; }
    render() {
      this.classList.add("c-calendar");
      const now = new Date();
      const year = Number(this.getAttribute("year")) || now.getFullYear();
      const month = Number(this.getAttribute("month")) || now.getMonth();
      const header = this.ensure(".c-calendar__header", () => { const el = document.createElement("div"); el.className = "c-calendar__header"; return el; });
      header.innerHTML = "";
      const prev = document.createElement("button");
      prev.type = "button"; prev.className = "c-btn c-btn--sm c-calendar__prev"; prev.textContent = "‹"; prev.setAttribute("aria-label", "Previous month");
      const title = document.createElement("span");
      title.className = "c-calendar__title";
      title.textContent = new Date(year, month, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
      const next = document.createElement("button");
      next.type = "button"; next.className = "c-btn c-btn--sm c-calendar__next"; next.textContent = "›"; next.setAttribute("aria-label", "Next month");
      header.appendChild(prev); header.appendChild(title); header.appendChild(next);
      const grid = this.ensure(".c-calendar__grid", () => { const el = document.createElement("div"); el.className = "c-calendar__grid"; el.setAttribute("role", "grid"); return el; });
      grid.setAttribute("aria-label", title.textContent);
      grid.innerHTML = "";
      const first = new Date(year, month, 1);
      const startDay = first.getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const selected = this.getAttribute("value");
      for (let i = 0; i < startDay; i++) {
        const empty = document.createElement("div");
        empty.className = "c-calendar__day c-calendar__day--empty";
        grid.appendChild(empty);
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement("button");
        cell.className = "c-calendar__day";
        cell.type = "button";
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("tabindex", "0");
        cell.textContent = String(d);
        const iso = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
        if (iso === selected) cell.classList.add("is-selected");
        cell.dataset.value = iso;
        grid.appendChild(cell);
      }
      if (header.parentNode !== this) this.insertBefore(header, grid);
    }
    enhance() {
      if (this._wiredCalendar) return;
      this._wiredCalendar = true;
      this.addEventListener("click", (e) => {
        const prev = e.target && e.target.closest ? e.target.closest(".c-calendar__prev") : null;
        const next = e.target && e.target.closest ? e.target.closest(".c-calendar__next") : null;
        if (prev && this.contains(prev)) {
          let m = Number(this.getAttribute("month")) || new Date().getMonth();
          let y = Number(this.getAttribute("year")) || new Date().getFullYear();
          m -= 1;
          if (m < 0) { m = 11; y -= 1; }
          this.setAttribute("month", String(m));
          this.setAttribute("year", String(y));
          this.render();
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { month: m, year: y } }));
          return;
        }
        if (next && this.contains(next)) {
          let m = Number(this.getAttribute("month")) || new Date().getMonth();
          let y = Number(this.getAttribute("year")) || new Date().getFullYear();
          m += 1;
          if (m > 11) { m = 0; y += 1; }
          this.setAttribute("month", String(m));
          this.setAttribute("year", String(y));
          this.render();
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { month: m, year: y } }));
          return;
        }
        const cell = e.target && e.target.closest ? e.target.closest(".c-calendar__day") : null;
        if (cell && this.contains(cell) && cell.dataset.value) {
          this.setAttribute("value", cell.dataset.value);
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { value: cell.dataset.value } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-calendar__day") : null;
        if (!cell || !this.contains(cell)) return;
        const cells = Array.from(this.querySelectorAll(".c-calendar__day:not(.c-calendar__day--empty)"));
        const idx = cells.indexOf(cell);
        let next = null;
        if (e.key === "ArrowRight") next = cells[idx + 1];
        else if (e.key === "ArrowLeft") next = cells[idx - 1];
        else if (e.key === "ArrowDown") next = cells[idx + 7];
        else if (e.key === "ArrowUp") next = cells[idx - 7];
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cell.click(); return; }
        if (next) { e.preventDefault(); try { next.focus(); } catch (err) {} }
      });
    }
  }
  define("contour-calendar", ContourCalendar);

class ContourCarousel extends ContourBase {
    static get observed() { return ["items", "index"]; }
    static get properties() { return { items: { attribute: "items" }, index: { attribute: "index" } }; }
    render() {
      this.classList.add("c-carousel");
      this.setAttribute("role", "region");
      this.setAttribute("aria-roledescription", "carousel");
      const track = this.ensure(".c-carousel__track", () => { const el = document.createElement("div"); el.className = "c-carousel__track"; el.setAttribute("role", "group"); el.setAttribute("aria-roledescription", "slide container"); return el; });
      const items = this.getAttribute("items");
      let parsed = [];
      try { parsed = items ? JSON.parse(items) : []; } catch (e) { parsed = []; }
      track.innerHTML = "";
      parsed.forEach((it, i) => {
        const slide = document.createElement("div");
        slide.className = "c-carousel__slide";
        slide.setAttribute("role", "group");
        slide.setAttribute("aria-roledescription", "slide");
        slide.setAttribute("aria-label", (i + 1) + " of " + parsed.length);
        slide.textContent = typeof it === "string" ? it : (it.label || it.text || "");
        slide.dataset.index = String(i);
        track.appendChild(slide);
      });
      const prev = this.ensure(".c-carousel__prev", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-carousel__prev"; el.type = "button"; el.textContent = "‹"; return el; });
      const next = this.ensure(".c-carousel__next", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-carousel__next"; el.type = "button"; el.textContent = "›"; return el; });
    }
    enhance() {
      if (this._wiredCarousel) return;
      this._wiredCarousel = true;
      this.addEventListener("click", (e) => {
        const prev = e.target && e.target.closest ? e.target.closest(".c-carousel__prev") : null;
        const next = e.target && e.target.closest ? e.target.closest(".c-carousel__next") : null;
        if (prev && this.contains(prev)) this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { direction: "prev" } }));
        if (next && this.contains(next)) this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { direction: "next" } }));
      });
    }
  }
  define("contour-carousel", ContourCarousel);

class ContourDataGrid extends ContourBase {
    static get observed() { return ["columns", "rows", "page", "filter", "page-size"]; }
    static get properties() { return { columns: { attribute: "columns" }, rows: { attribute: "rows" }, page: { attribute: "page" }, filter: { attribute: "filter" }, "page-size": { attribute: "page-size" } }; }
    render() {
      this.classList.add("c-data-grid");
      if (this.hasAttribute("loading") || this.hasAttribute("error") || this.hasAttribute("empty")) {
        const table = this.ensure(".c-data-grid__table", () => { const el = document.createElement("table"); el.className = "c-table c-data-grid__table"; el.setAttribute("role", "grid"); return el; });
        const tbody = this.ensure("tbody", () => { const el = document.createElement("tbody"); return el; });
        if (tbody.parentNode !== table) table.appendChild(tbody);
        tbody.innerHTML = "";
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 1;
        td.style.textAlign = "center";
        td.style.color = "var(--color-text-muted)";
        if (this.hasAttribute("loading")) td.textContent = this.getAttribute("loading") || "Loading…";
        else if (this.hasAttribute("error")) td.textContent = this.getAttribute("error") || "Error";
        else td.textContent = this.getAttribute("empty") || "No data";
        tr.appendChild(td);
        tbody.appendChild(tr);
        // Wrap in a scroll container for virtualization of large datasets.
      let wrap = this.querySelector(".c-data-grid__wrap");
      if (!wrap) { wrap = document.createElement("div"); wrap.className = "c-data-grid__wrap"; wrap.style.maxHeight = "400px"; wrap.style.overflow = "auto"; }
      if (table.parentNode !== wrap) wrap.appendChild(table);
      if (wrap.parentNode !== this) this.appendChild(wrap);
        return;
      }
      const table = this.ensure(".c-data-grid__table", () => { const el = document.createElement("table"); el.className = "c-table c-data-grid__table"; el.setAttribute("role", "grid"); return el; });
      const thead = this.ensure("thead", () => { const el = document.createElement("thead"); return el; });
      const tbody = this.ensure("tbody", () => { const el = document.createElement("tbody"); return el; });
      if (thead.parentNode !== table) table.appendChild(thead);
      if (tbody.parentNode !== table) table.appendChild(tbody);
      const cols = this.getAttribute("columns");
      let parsedCols = [];
      try { parsedCols = cols ? JSON.parse(cols) : []; } catch (e) { parsedCols = []; }
      if (parsedCols.length && !thead.querySelector("tr")) {
        const tr = document.createElement("tr");
        parsedCols.forEach((c) => {
          const th = document.createElement("th");
          th.setAttribute("role", "columnheader");
          th.textContent = typeof c === "string" ? c : (c.label || c.key || "");
          tr.appendChild(th);
        });
        thead.appendChild(tr);
      }
      const rows = this.getAttribute("rows");
      let parsedRows = [];
      try { parsedRows = rows ? JSON.parse(rows) : []; } catch (e) { parsedRows = []; }
      const filter = this.getAttribute("filter");
      if (filter) {
        const q = filter.toLowerCase();
        parsedRows = parsedRows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
      }
      const page = Number(this.getAttribute("page") || 1);
      const pageSize = Number(this.getAttribute("page-size") || 0);
      if (pageSize > 0) {
        const start = (page - 1) * pageSize;
        parsedRows = parsedRows.slice(start, start + pageSize);
      }
      tbody.innerHTML = "";
      parsedRows.forEach((r) => {
        const tr = document.createElement("tr");
        parsedCols.forEach((c) => {
          const key = typeof c === "string" ? c : (c.key || c.label || "");
          const td = document.createElement("td");
          td.setAttribute("role", "gridcell");
          td.setAttribute("tabindex", "0");
          td.textContent = r && r[key] != null ? r[key] : "";
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      // Wrap in a scroll container for virtualization of large datasets.
      let wrap = this.querySelector(".c-data-grid__wrap");
      if (!wrap) { wrap = document.createElement("div"); wrap.className = "c-data-grid__wrap"; wrap.style.maxHeight = "400px"; wrap.style.overflow = "auto"; }
      if (table.parentNode !== wrap) wrap.appendChild(table);
      if (wrap.parentNode !== this) this.appendChild(wrap);
    }
    enhance() {
      if (this._wiredDataGrid) return;
      this._wiredDataGrid = true;
      let sortCol = -1, sortDir = "asc";
      this.addEventListener("keydown", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest("[role='gridcell'], [role='columnheader']") : null;
        if (!cell || !this.contains(cell)) return;
        const row = cell.parentElement;
        const table = this.querySelector(".c-data-grid__table");
        if (!table) return;
        const rows = Array.from(table.querySelectorAll("tr"));
        const ri = rows.indexOf(row);
        const ci = Array.from(row.children).indexOf(cell);
        let target = null;
        if (e.key === "ArrowRight") target = row.children[ci + 1];
        else if (e.key === "ArrowLeft") target = row.children[ci - 1];
        else if (e.key === "ArrowDown") target = rows[ri + 1] && rows[ri + 1].children[ci];
        else if (e.key === "ArrowUp") target = rows[ri - 1] && rows[ri - 1].children[ci];
        if (target) { e.preventDefault(); try { target.focus(); } catch (err) {} }
      });
      this.addEventListener("click", (e) => {
        const tr = e.target && e.target.closest ? e.target.closest("tr") : null;
        const th = e.target && e.target.closest ? e.target.closest("th") : null;
        if (tr && this.contains(tr) && !th) {
          const idx = Array.from(tr.parentElement.children).indexOf(tr);
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { row: idx } }));
        }
        if (th && this.contains(th)) {
          const idx = Array.from(th.parentElement.children).indexOf(th);
          if (sortCol === idx) sortDir = sortDir === "asc" ? "desc" : "asc";
          else { sortCol = idx; sortDir = "asc"; }
          // Re-render sorted rows.
          const table = this.querySelector(".c-data-grid__table");
          const tbody = table && table.querySelector("tbody");
          const thead = table && table.querySelector("thead");
          if (tbody && thead) {
            const cols = Array.from(thead.querySelectorAll("th")).map((h) => h.textContent);
            const rows = Array.from(tbody.querySelectorAll("tr")).map((tr) => Array.from(tr.querySelectorAll("td")).map((td) => td.textContent));
            rows.sort((a, b) => {
              const va = a[idx] || "", vb = b[idx] || "";
              const na = Number(va), nb = Number(vb);
              const cmp = (!isNaN(na) && !isNaN(nb)) ? na - nb : String(va).localeCompare(String(vb));
              return sortDir === "asc" ? cmp : -cmp;
            });
            tbody.innerHTML = "";
            rows.forEach((r) => {
              const tr = document.createElement("tr");
              r.forEach((v) => { const td = document.createElement("td"); td.textContent = v; tr.appendChild(td); });
              tbody.appendChild(tr);
            });
          }
          this.dispatchEvent(new CustomEvent("contour:sort", { bubbles: true, composed: true, detail: { column: idx, direction: sortDir } }));
        }
      });
    }
  }
  define("contour-data-grid", ContourDataGrid);

class ContourTreeGrid extends ContourBase {
    static get observed() { return ["items", "expanded"]; }
    static get properties() { return { items: { attribute: "items" }, expanded: { attribute: "expanded" } }; }
    _expandedSet() {
      const raw = this.getAttribute("expanded");
      if (!raw) return new Set();
      try { return new Set(JSON.parse(raw)); } catch (e) { return new Set([raw]); }
    }
    render() {
      this.classList.add("c-tree-grid");
      const table = this.ensure(".c-tree-grid__table", () => { const el = document.createElement("table"); el.className = "c-table c-tree-grid__table"; el.setAttribute("role", "treegrid"); return el; });
      const tbody = this.ensure("tbody", () => { const el = document.createElement("tbody"); return el; });
      if (tbody.parentNode !== table) table.appendChild(tbody);
      const items = this.getAttribute("items");
      let parsed = [];
      try { parsed = items ? JSON.parse(items) : []; } catch (e) { parsed = []; }
      const expanded = this._expandedSet();
      tbody.innerHTML = "";
      const rows = [];
      const renderNode = (node, depth, path) => {
        const tr = document.createElement("tr");
        tr.setAttribute("role", "row");
        tr.setAttribute("tabindex", "0");
        tr.dataset.path = path;
        const hasChildren = !!(node && Array.isArray(node.children) && node.children.length);
        if (hasChildren) {
          tr.setAttribute("aria-expanded", expanded.has(path) ? "true" : "false");
        }
        const td = document.createElement("td");
        td.setAttribute("role", "gridcell");
        td.style.paddingInlineStart = (depth * 1.25) + "rem";
        const label = (node && (node.label || node.text || node.name)) || "";
        if (hasChildren) {
          const toggle = document.createElement("button");
          toggle.type = "button";
          toggle.className = "c-tree-grid__toggle";
          toggle.textContent = expanded.has(path) ? "▾" : "▸";
          toggle.setAttribute("aria-label", (expanded.has(path) ? "Collapse" : "Expand") + " " + label);
          td.appendChild(toggle);
        }
        const span = document.createElement("span");
        span.className = "c-tree-grid__label";
        span.textContent = label;
        td.appendChild(span);
        tr.appendChild(td);
        tbody.appendChild(tr);
        rows.push(tr);
        if (hasChildren && expanded.has(path)) {
          node.children.forEach((c, i) => renderNode(c, depth + 1, path + "." + i));
        }
      };
      parsed.forEach((n, i) => renderNode(n, 0, String(i)));
      if (table.parentNode !== this) this.appendChild(table);
    }
    enhance() {
      if (this._wiredTreeGrid) return;
      this._wiredTreeGrid = true;
      const rows = () => Array.from(this.querySelectorAll("tr[role='row']"));
      this.addEventListener("click", (e) => {
        const toggle = e.target && e.target.closest ? e.target.closest(".c-tree-grid__toggle") : null;
        const tr = e.target && e.target.closest ? e.target.closest("tr[role='row']") : null;
        if (!tr || !this.contains(tr)) return;
        const path = tr.dataset.path;
        if (toggle) {
          e.preventDefault();
          const expanded = this._expandedSet();
          if (expanded.has(path)) expanded.delete(path); else expanded.add(path);
          this.setAttribute("expanded", JSON.stringify([...expanded]));
          this.dispatchEvent(new CustomEvent("contour:toggle", { bubbles: true, composed: true, detail: { path, expanded: expanded.has(path) } }));
        } else {
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { path } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const tr = e.target && e.target.closest ? e.target.closest("tr[role='row']") : null;
        if (!tr || !this.contains(tr)) return;
        const all = rows();
        const idx = all.indexOf(tr);
        const path = tr.dataset.path;
        const hasChildren = tr.getAttribute("aria-expanded") !== null;
        const expanded = this._expandedSet();
        if (e.key === "ArrowRight" && hasChildren && !expanded.has(path)) {
          e.preventDefault();
          expanded.add(path);
          this.setAttribute("expanded", JSON.stringify([...expanded]));
          this.dispatchEvent(new CustomEvent("contour:toggle", { bubbles: true, composed: true, detail: { path, expanded: true } }));
        } else if (e.key === "ArrowLeft" && hasChildren && expanded.has(path)) {
          e.preventDefault();
          expanded.delete(path);
          this.setAttribute("expanded", JSON.stringify([...expanded]));
          this.dispatchEvent(new CustomEvent("contour:toggle", { bubbles: true, composed: true, detail: { path, expanded: false } }));
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          if (all[idx + 1]) try { all[idx + 1].focus(); } catch (err) {}
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (all[idx - 1]) try { all[idx - 1].focus(); } catch (err) {}
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const toggle = tr.querySelector(".c-tree-grid__toggle");
          if (toggle) toggle.click();
        }
      });
    }
  }
  define("contour-tree-grid", ContourTreeGrid);
