import { ContourBase, define, contourId, onDispose } from './core.mjs';
import { wireRemovable } from './behaviours.mjs';
/**
 * Avatar: a circular avatar with initials (from `name`) or an image (`src`),
 * optional size/variant modifiers and a status dot. Attributes: `name`, `size`,
 * `variant`, `src`, `status`.
 */
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
        img.loading = "lazy";
        img.decoding = "async";
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
/**
 * Badge: a small status label with variant/size modifiers and an optional
 * removable (×) button. Attributes: `variant`, `label`, `size`, `removable`.
 */
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
/**
 * Chip: a compact status pill with `key`/`value` text and a variant modifier.
 * Attributes: `variant`, `key`, `value`.
 */
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
/**
 * Tag: a removable status label with a variant modifier. Attributes: `label`,
 * `removable`, `variant`.
 */
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
/**
 * Dot: a small status indicator with variant and live states. Attributes:
 * `variant`, `live`.
 */
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
      if (this.hasAttribute("live")) this.classList.add("c-dot--live"); else this.classList.remove("c-dot--live");
    }
  }
  define("contour-dot", ContourDot);
/**
 * Pill: a rounded status label with live state and variant modifier.
 * Attributes: `label`, `live`, `variant`.
 */
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
      if (this.hasAttribute("live")) this.classList.add("c-pill--live"); else this.classList.remove("c-pill--live");
    }
  }
  define("contour-pill", ContourPill);
/**
 * Kbd: a keyboard key display. Attribute: `key`.
 */
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
/**
 * Spinner: a loading indicator with size modifier. Attribute: `size`.
 */
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
/**
 * Skeleton: a loading placeholder with size and shimmer options. Attributes:
 * `size`, `shimmer`.
 */
class ContourSkeleton extends ContourBase {
    static get observed() { return ["size", "shimmer"]; }
    static get properties() { return { size: { attribute: "size" }, shimmer: { attribute: "shimmer", type: Boolean } }; }
    render() {
      this.classList.add("c-skeleton");
      Array.from(this.classList).forEach((c) => { if (c.startsWith("c-skeleton--")) this.classList.remove(c); });
      const size = this.getAttribute("size");
      if (size) this.classList.add("c-skeleton--" + size);
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Loading");
      if (!this.hasAttribute("aria-busy")) this.setAttribute("aria-busy", "true");
      if (!this.hasAttribute("aria-hidden")) this.setAttribute("aria-hidden", "true");
      const shimmer = this.getAttribute("shimmer");
      if (shimmer === "false" || shimmer === "off") this.classList.add("c-skeleton--static");
      else this.classList.remove("c-skeleton--static");
    }
  }
  define("contour-skeleton", ContourSkeleton);
/**
 * Tooltip: a popover-triggered tooltip with anchor association, delay, and
 * viewport flip. Attributes: `text`, `anchor`, `delay`, `trigger`.
 */
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
          try { requestAnimationFrame(flipIfNeeded); } catch (e) { flipIfNeeded(); }
        }, delayMs);
        else {
          if (hasPopover) { try { this.showPopover(); } catch (e) {} }
          else this.classList.add("is-open");
          try { requestAnimationFrame(flipIfNeeded); } catch (e) { flipIfNeeded(); }
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
       const onTouchStart = () => { if (triggerMode !== "click") show(); };
       const onTouchEnd = () => { if (triggerMode !== "click") { setTimeout(hide, 1500); } };
       target.addEventListener("mouseenter", onEnter);
       target.addEventListener("mouseleave", onLeave);
       target.addEventListener("focus", onFocus);
       target.addEventListener("blur", onBlur);
       target.addEventListener("click", onClick);
       target.addEventListener("touchstart", onTouchStart, { passive: true });
       target.addEventListener("touchend", onTouchEnd, { passive: true });
       // Placement flip: if the tooltip would overflow the viewport, flip it.
       const flipIfNeeded = () => {
         try {
           const r = this.getBoundingClientRect();
           if (r.right > window.innerWidth) this.classList.add("c-tooltip--flip-x");
           else this.classList.remove("c-tooltip--flip-x");
           if (r.bottom > window.innerHeight) this.classList.add("c-tooltip--flip-y");
           else this.classList.remove("c-tooltip--flip-y");
         } catch (e) {}
       };
       const origShow = show;
       // wrap show to flip after display
       onDispose(this, () => {
         target.removeEventListener("mouseenter", onEnter);
         target.removeEventListener("mouseleave", onLeave);
         target.removeEventListener("focus", onFocus);
         target.removeEventListener("blur", onBlur);
         target.removeEventListener("click", onClick);
         target.removeEventListener("touchstart", onTouchStart);
         target.removeEventListener("touchend", onTouchEnd);
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
/**
 * Progress: a determinate or indeterminate progress bar with value, min/max,
 * paused and pausable states. Attributes: `value`, `label`, `min`, `max`,
 * `paused`, `pausable`.
 */
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
/**
 * Mark: a highlighted text marker. No attributes.
 */
class ContourMark extends ContourBase {
    render() {
      this.classList.add("c-mark");
    }
  }
  define("contour-mark", ContourMark);
/**
 * Loading: a spinner wrapped in a container. No attributes.
 */
class ContourLoading extends ContourBase {
    render() {
      this.classList.add("c-loading");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-live")) this.setAttribute("aria-live", "polite");
      this.ensure(".c-spinner", () => { const el = document.createElement("span"); el.className = "c-spinner"; el.setAttribute("aria-hidden", "true"); return el; });
    }
  }
  define("contour-loading", ContourLoading);
/**
 * Elevation: a single step of the elevation ramp (`.c-elevation` carries
 * `--shadow-md`). Raises the surface it is given. No attributes.
 */
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
/**
 * VersionBanner: a dismissible info banner with message, link and href.
 * Attributes: `message`, `link`, `href`, `dismissible`.
 */
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
/**
 * Banner: a simple message banner with a variant modifier. Attributes:
 * `message`, `variant`.
 */
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
/**
 * FilterPill: a key/value filter chip with an optional remove button.
 * Attributes: `key`, `value`, `removable`.
 */
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
/**
 * Datamark: a data value display with optional unit and label. Attributes:
 * `value`, `unit`, `label`.
 */
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
/**
 * DestructiveHint: a text hint for destructive actions. Attribute: `text`.
 */
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
/**
 * IconBadge: an icon from the sprite (i-* convention) with a warning if the
 * name doesn't match. Attribute: `icon`.
 */
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
/**
 * LiveBadge: a connection status badge with state/live modifiers and label.
 * Attributes: `label`, `state`, `live`.
 */
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

/**
 * SkeletonGroup: a group of N skeleton placeholders. Attribute: `count`.
 */
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

/**
 * MapPopup: a map popup dialog with title, content, and optional cluster
 * badge (cluster-count / cluster-expanded). Attributes: `title`, `content`,
 * `cluster-count`, `cluster-expanded`.
 */
class ContourMapPopup extends ContourBase {
  static get observed() { return ["title", "content", "cluster-count", "cluster-expanded", "cluster-items"]; }
  static get properties() { return { title: { attribute: "title" }, content: { attribute: "content" }, "cluster-count": { attribute: "cluster-count", type: Number }, "cluster-expanded": { attribute: "cluster-expanded", type: Boolean }, "cluster-items": { attribute: "cluster-items" } }; }
    render() {
      this.classList.add("c-map-popup");
      this.setAttribute("role", "dialog");
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
      const clusterCount = Number(this.getAttribute("cluster-count"));
      if (Number.isFinite(clusterCount) && clusterCount > 1) {
        const badge = this.ensure(".c-map-popup__cluster", () => { const el = document.createElement("button"); el.className = "c-map-popup__cluster c-btn c-btn--sm"; el.type = "button"; return el; });
        const expanded = this.hasAttribute("cluster-expanded");
        badge.textContent = expanded ? "Hide locations" : `${clusterCount} locations`;
        badge.setAttribute("aria-expanded", String(expanded));
        badge.setAttribute("aria-label", expanded ? "Hide locations" : `Show ${clusterCount} locations`);
      } else {
        const badge = this.querySelector(".c-map-popup__cluster");
        if (badge) badge.remove();
      }
      // Spatial clustering (R14-28): render clustered locations when expanded.
      const expanded = this.hasAttribute("cluster-expanded");
      let items = [];
      try { items = this.getAttribute("cluster-items") ? JSON.parse(this.getAttribute("cluster-items")) : []; } catch (e) { items = []; }
      const list = this.querySelector(".c-map-popup__cluster-list");
      if (expanded && Array.isArray(items) && items.length) {
        const ul = list || document.createElement("ul");
        ul.className = "c-map-popup__cluster-list";
        ul.innerHTML = "";
        items.forEach((it) => {
          const li = document.createElement("li");
          li.className = "c-map-popup__cluster-item";
          li.textContent = typeof it === "string" ? it : (it.label || it.name || JSON.stringify(it));
          ul.appendChild(li);
        });
        if (ul.parentNode !== this) this.appendChild(ul);
      } else if (list) {
        list.remove();
      }
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", title || "Map popup");
    }
    enhance() {
      if (this._wiredMapPopup) return;
      this._wiredMapPopup = true;
      const close = () => { try { this.hidePopover(); } catch (e) {} this.classList.remove("is-open"); this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true })); };
      const keyHandler = (e) => { if (e.key === "Escape" && (this.classList.contains("is-open") || this.matches(":popover-open"))) { e.preventDefault(); close(); } };
      document.addEventListener("keydown", keyHandler);
      onDispose(this, () => document.removeEventListener("keydown", keyHandler));
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-map-popup__close") : null;
        if (btn && this.contains(btn)) close();
        const cluster = e.target && e.target.closest ? e.target.closest(".c-map-popup__cluster") : null;
        if (cluster && this.contains(cluster)) {
          const expanded = !this.hasAttribute("cluster-expanded");
          this.toggleAttribute("cluster-expanded", expanded);
          this.dispatchEvent(new CustomEvent("contour:cluster-toggle", { bubbles: true, composed: true, detail: { count: Number(this.getAttribute("cluster-count")), expanded } }));
        }
      });
    }
  }
  define("contour-map-popup", ContourMapPopup);

/**
 * AnimationControls: a media control toolbar with play/pause, speed, scrubber
 * and caption. Attributes: `playing`, `speed`, `progress`, `min`, `max`,
 * `caption`, `show-thumb`, `show-thumb-caption`.
 */
class ContourAnimationControls extends ContourBase {
    static get observed() { return ["playing", "speed", "progress", "min", "max", "caption", "show-thumb", "show-thumb-caption"]; }
    static get properties() { return { playing: { attribute: "playing", type: Boolean }, speed: { attribute: "speed" }, progress: { attribute: "progress" }, min: { attribute: "min" }, max: { attribute: "max" } }; }
    render() {
      this.classList.add("c-animation-controls");
      this.setAttribute("role", "toolbar");
      this.setAttribute("aria-label", "Animation controls");
      const playBtn = this.ensure(".c-animation-controls__play", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-animation-controls__play"; el.type = "button"; return el; });
      playBtn.textContent = this.hasAttribute("playing") ? "Pause" : "Play";
      playBtn.setAttribute("aria-label", this.hasAttribute("playing") ? "Pause" : "Play");
      const speed = this.getAttribute("speed") || "1x";
      const speedBtn = this.ensure(".c-animation-controls__speed", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-animation-controls__speed"; el.type = "button"; return el; });
      speedBtn.textContent = speed;
      // scrubber
      const scrubber = this.ensure(".c-animation-controls__scrubber", () => { const el = document.createElement("input"); el.className = "c-range c-animation-controls__scrubber"; el.type = "range"; return el; });
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

/**
 * Dropdown: a trigger button with a menu of items from JSON `items` or slotted
 * `.c-menu__item` children. Attributes: `label`, `items`.
 */
class ContourDropdown extends ContourBase {
    static get observed() { return ["label", "items"]; }
    static get properties() { return { label: { attribute: "label" }, items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-dropdown");
      const btn = this.ensure(".c-dropdown__trigger", () => { const el = document.createElement("button"); el.className = "c-dropdown__trigger c-btn c-btn--sm"; el.type = "button"; return el; });
      btn.textContent = this.getAttribute("label") || "Menu";
      const menu = this.ensure(".c-dropdown__menu", () => { const el = document.createElement("div"); el.className = "c-dropdown__menu c-menu"; el.setAttribute("role", "menu"); el.hidden = true; return el; });
      // Slotted content: authored .c-menu__item children take precedence over
      // the JSON `items` attribute.
      const authoredItems = Array.from(this.querySelectorAll(":scope > .c-menu__item"));
      const items = this.getAttribute("items");
      if (authoredItems.length) {
        menu.innerHTML = "";
        authoredItems.forEach((it) => { menu.appendChild(it); });
      } else if (items) {
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

/**
 * Annotation: a positioned note with label and x/y coordinates. Attributes:
 * `label`, `x`, `y`.
 */
class ContourAnnotation extends ContourBase {
    static get observed() { return ["label", "x", "y"]; }
    static get properties() { return { label: { attribute: "label" }, x: { attribute: "x" }, y: { attribute: "y" } }; }
    render() {
      this.classList.add("c-annotation");
      this.setAttribute("role", "note");
      const label = this.getAttribute("label");
      if (label) this.setAttribute("aria-label", label);
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

/**
 * Style Switcher: web component wrapper.
 * Attributes: `items`, `value`.
 */
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

/**
 * Style Panel: web component wrapper.
 * Attributes: `title`, `layers`, `layer`, `single`, `classification`, `palette`, `breaks`, `opacity`, `n`, `colors`, `property`.
 */
class ContourStylePanel extends ContourBase {
    static get observed() { return ["title", "layers", "layer", "single", "classification", "palette", "breaks", "opacity", "n", "colors", "property"]; }
    static get properties() { return { title: { attribute: "title" }, layers: { attribute: "layers" }, classification: { attribute: "classification" }, palette: { attribute: "palette" }, breaks: { attribute: "breaks" }, opacity: { attribute: "opacity" } }; }
    render() {
      this.classList.add("c-style-panel");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Style panel");
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
         const op = document.createElement("input"); op.type = "range"; op.className = "c-style-panel__opacity"; op.setAttribute("aria-label", "Opacity"); op.min = "0"; op.max = "100";
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
             const span = document.createElement("span"); span.textContent = String(b); br.appendChild(span);
             const inp = document.createElement("input"); inp.type = "number"; inp.className = "c-style-panel__breaks c-input"; inp.setAttribute("aria-label", "Class lower bound"); inp.value = String(b);
             br.appendChild(inp);
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
         const actions = document.createElement("div"); actions.className = "c-style-panel__actions c-btn-group";
         const applyBtn = document.createElement("button"); applyBtn.type = "button"; applyBtn.className = "c-btn c-btn--primary"; applyBtn.textContent = "Apply";
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
            input.setAttribute("aria-label", "Colour for " + (typeof l === "string" ? l : (l.name || l.label || "layer")));
            if (typeof l === "object" && l.color) input.value = l.color;
            row.appendChild(input);
            // classification method selector
            const clsSel = document.createElement("select");
            clsSel.className = "c-style-panel__classification";
            clsSel.setAttribute("aria-label", "Classification method");
            ["equal","quantile","jenks","manual"].forEach((m) => { const o = document.createElement("option"); o.value = m; o.textContent = m; clsSel.appendChild(o); });
            if (typeof l === "object" && l.classification) clsSel.value = l.classification;
            row.appendChild(clsSel);
            // palette picker
            const pal = document.createElement("input");
            pal.type = "text";
            pal.className = "c-style-panel__palette";
            pal.setAttribute("aria-label", "Palette");
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
            op.setAttribute("aria-label", "Opacity");
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

/**
 * Responsive Content: web component wrapper.
 * Attributes: `breakpoint`.
 */
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

/**
 * Avatar Group: web component wrapper.
 * Attributes: `items`, `max`.
 */
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
            if (typeof it === "object" && it.color) { av.style.background = it.color; av.dataset.color = it.color; }
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

/**
 * Divider: web component wrapper.
 * Attributes: `label`, `orientation`.
 */
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

/**
 * Status Light: web component wrapper.
 * Attributes: `status`, `label`.
 */
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

/**
 * Split Button: web component wrapper.
 * Attributes: `label`, `menu`.
 */
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
          if (m) { m.hidden = !m.hidden; t.setAttribute("aria-expanded", String(!m.hidden)); this.dispatchEvent(new CustomEvent("contour:toggle", { bubbles: true, composed: true, detail: { open: !m.hidden } })); }
        }
        const item = e.target && e.target.closest ? e.target.closest(".c-menu__item") : null;
        if (item && this.contains(item)) {
          const m = menu();
          if (m) { m.hidden = true; const t = toggle(); if (t) t.setAttribute("aria-expanded", "false"); }
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { label: item.textContent } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const t = toggle();
        if ((e.target === t || (t && t.contains(e.target))) && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          const m = menu();
          if (m) { m.hidden = !m.hidden; t.setAttribute("aria-expanded", String(!m.hidden)); }
        } else if (e.key === "Escape") {
          const m = menu();
          if (m && !m.hidden) { m.hidden = true; if (t) t.setAttribute("aria-expanded", "false"); }
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

/**
 * Palette Editor: web component wrapper.
 * Attributes: `colors`.
 */
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
            sw.dataset.color = typeof c === "string" ? c : (c.color || c.value || "");
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
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { color: (sw.dataset && sw.dataset.color) || sw.style.background } }));
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

/**
 * Date Range: web component wrapper.
 * Attributes: `start`, `end`, `label`, `time`, `min`, `max`, `locale`.
 */
class ContourDateRange extends ContourBase {
  static get observed() { return ["start", "end", "label", "time", "min", "max", "locale"]; }
  static get properties() { return { start: { attribute: "start" }, end: { attribute: "end" }, label: { attribute: "label" }, time: { attribute: "time", type: Boolean }, min: { attribute: "min" }, max: { attribute: "max" }, locale: { attribute: "locale" } }; }
    render() {
      this.classList.add("c-date-range");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Date range");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-date-range__label", () => { const el = document.createElement("span"); el.className = "c-date-range__label"; return el; });
        l.textContent = label;
      }
      const start = this.ensure(".c-date-range__start", () => { const el = document.createElement("input"); el.className = "c-input c-date-range__start"; return el; });
      start.type = this.hasAttribute("time") ? "datetime-local" : "date";
      start.value = this.getAttribute("start") || "";
      const end = this.ensure(".c-date-range__end", () => { const el = document.createElement("input"); el.className = "c-input c-date-range__end"; return el; });
      end.type = start.type;
      end.value = this.getAttribute("end") || "";
      const min = this.getAttribute("min");
      const max = this.getAttribute("max");
      [start, end].forEach((input) => {
        if (min) input.min = min; else input.removeAttribute("min");
        if (max) input.max = max; else input.removeAttribute("max");
        if (this.getAttribute("locale")) input.lang = this.getAttribute("locale");
      });
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

/**
 * Shortcut: web component wrapper.
 * Attributes: `key`, `label`.
 */
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

/**
 * Popover: web component wrapper.
 * Attributes: `title`, `content`.
 */
class ContourPopover extends ContourBase {
    static get observed() { return ["title", "content"]; }
    static get properties() { return { title: { attribute: "title" }, content: { attribute: "content" } }; }
    render() {
      this.classList.add("c-popover");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Popover");
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
    enhance() {
      if (this._wiredPopover) return;
      this._wiredPopover = true;
      const close = () => { try { this.hidePopover(); } catch (e) {} this.classList.remove("is-open"); this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true })); };
      const keyHandler = (e) => {
        const open = this.classList.contains("is-open") || this.matches(":popover-open");
        if (!open) return;
        if (e.key === "Escape") { e.preventDefault(); close(); return; }
        // Focus trap: keep Tab within the popover.
        if (e.key === "Tab") {
          const focusable = Array.from(this.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
          if (!focusable.length) { e.preventDefault(); return; }
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      };
      document.addEventListener("keydown", keyHandler);
      onDispose(this, () => document.removeEventListener("keydown", keyHandler));
      // Nested popover support: when a nested popover opens, mark this one as parent.
      this.addEventListener("contour:show", (e) => {
        if (e.target && e.target !== this && this.contains(e.target)) {
          this.classList.add("is-parent");
        }
      });
      this.addEventListener("contour:close", (e) => {
        if (e.target && e.target !== this) {
          this.classList.remove("is-parent");
        }
      });
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-popover__close") : null;
        if (btn && this.contains(btn)) close();
      });
    }
  }
  define("contour-popover", ContourPopover);

/**
 * Date Picker: web component wrapper.
 * Attributes: `value`, `range`, `range-start`, `range-end`, `label`, `disabled`, `error`, `help`, `time`, `min`, `max`, `locale`.
 */
class ContourDatePicker extends ContourBase {
  static get observed() { return ["value", "range", "range-start", "range-end", "label", "disabled", "error", "help", "time", "min", "max", "locale"]; }
  static get properties() { return { value: { attribute: "value" }, range: { attribute: "range", type: Boolean }, rangeStart: { attribute: "range-start" }, rangeEnd: { attribute: "range-end" }, label: { attribute: "label" }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" }, time: { attribute: "time", type: Boolean }, min: { attribute: "min" }, max: { attribute: "max" }, locale: { attribute: "locale" } }; }
    render() {
      this.classList.add("c-date-picker");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Date picker");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-date-picker__label", () => { const el = document.createElement("label"); el.className = "c-date-picker__label"; return el; });
        l.textContent = label;
      }
      const input = this.ensure(".c-date-picker__input", () => { const el = document.createElement("input"); el.className = "c-input c-date-picker__input"; return el; });
      const range = this.hasAttribute("range");
      const type = this.hasAttribute("time") ? "datetime-local" : "date";
      const configure = (control, value, name) => {
        control.type = type;
        control.value = value || "";
        control.setAttribute("aria-label", name);
        if (this.hasAttribute("min")) control.min = this.getAttribute("min"); else control.removeAttribute("min");
        if (this.hasAttribute("max")) control.max = this.getAttribute("max"); else control.removeAttribute("max");
        if (this.hasAttribute("locale")) control.lang = this.getAttribute("locale"); else control.removeAttribute("lang");
        if (this.hasAttribute("disabled")) control.setAttribute("disabled", ""); else control.removeAttribute("disabled");
      };
      configure(input, range ? this.getAttribute("range-start") : this.getAttribute("value"), range ? "Start date" : (label || "Date"));
      let end = this.querySelector(".c-date-picker__end");
      if (range) {
        end = end || document.createElement("input");
        end.className = "c-input c-date-picker__input c-date-picker__end";
        configure(end, this.getAttribute("range-end"), "End date");
        if (end.parentNode !== this) this.appendChild(end);
      } else if (end) end.remove();
      if (this.hasAttribute("disabled")) this.classList.add("is-disabled"); else this.classList.remove("is-disabled");
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-date-picker__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-date-picker__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-date-picker__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
      // Calendar affordance (R14-22): a toggle + month grid alongside the native input.
      const toggle = this.ensure(".c-date-picker__calendar-toggle", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-date-picker__calendar-toggle"; el.type = "button"; el.textContent = "📅"; el.setAttribute("aria-label", "Open calendar"); el.setAttribute("aria-expanded", "false"); return el; });
      let cal = this.querySelector(".c-date-picker__calendar");
      if (!cal) { cal = document.createElement("div"); cal.className = "c-date-picker__calendar"; cal.setAttribute("hidden", ""); cal.setAttribute("role", "dialog"); cal.setAttribute("aria-label", "Calendar"); this.appendChild(cal); }
    }
    _renderCalendar() {
      const cal = this.querySelector(".c-date-picker__calendar");
      if (!cal) return;
      const input = this.querySelector(".c-date-picker__input");
      const base = (input && input.value) ? new Date(input.value) : new Date();
      const month = this._calMonth || new Date(base.getFullYear(), base.getMonth(), 1);
      this._calMonth = month;
      const y = month.getFullYear();
      const m = month.getMonth();
      const first = new Date(y, m, 1);
      const startDay = first.getDay();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      cal.innerHTML = "";
      const header = document.createElement("div");
      header.className = "c-date-picker__calendar-header";
      const prev = document.createElement("button"); prev.type = "button"; prev.className = "c-btn c-btn--sm"; prev.textContent = "‹"; prev.setAttribute("aria-label", "Previous month");
      const title = document.createElement("span"); title.className = "c-date-picker__calendar-title"; title.textContent = month.toLocaleString(this.getAttribute("locale") || undefined, { month: "long", year: "numeric" });
      const next = document.createElement("button"); next.type = "button"; next.className = "c-btn c-btn--sm"; next.textContent = "›"; next.setAttribute("aria-label", "Next month");
      header.appendChild(prev); header.appendChild(title); header.appendChild(next);
      cal.appendChild(header);
      const grid = document.createElement("div");
      grid.className = "c-date-picker__calendar-grid";
      grid.setAttribute("role", "grid");
      const weekdays = ["Su","Mo","Tu","We","Th","Fr","Sa"];
      weekdays.forEach((w) => { const h = document.createElement("div"); h.className = "c-date-picker__calendar-weekday"; h.textContent = w; grid.appendChild(h); });
      for (let i = 0; i < startDay; i++) { const empty = document.createElement("div"); empty.className = "c-date-picker__calendar-day c-date-picker__calendar-day--empty"; grid.appendChild(empty); }
      const selected = input ? input.value : "";
      for (let d = 1; d <= daysInMonth; d++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "c-date-picker__calendar-day";
        btn.textContent = String(d);
        const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (selected && selected.startsWith(iso)) btn.classList.add("is-selected");
        btn.addEventListener("click", () => {
          if (input) { input.value = iso; input.dispatchEvent(new Event("change", { bubbles: true })); }
          cal.setAttribute("hidden", "");
          const tgl = this.querySelector(".c-date-picker__calendar-toggle");
          if (tgl) tgl.setAttribute("aria-expanded", "false");
        });
        grid.appendChild(btn);
      }
      cal.appendChild(grid);
      prev.addEventListener("click", () => { this._calMonth = new Date(y, m - 1, 1); this._renderCalendar(); });
      next.addEventListener("click", () => { this._calMonth = new Date(y, m + 1, 1); this._renderCalendar(); });
    }
    enhance() {
      if (this._wiredDatePicker) return;
      this._wiredDatePicker = true;
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && t.classList.contains("c-date-picker__input")) {
          const end = this.querySelector(".c-date-picker__end");
          const detail = end ? { start: this.querySelector(".c-date-picker__input").value, end: end.value } : { value: t.value };
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail }));
        }
      });
      const toggle = () => {
        const cal = this.querySelector(".c-date-picker__calendar");
        const btn = this.querySelector(".c-date-picker__calendar-toggle");
        if (!cal) return;
        const hidden = cal.hasAttribute("hidden");
        if (hidden) { cal.removeAttribute("hidden"); if (btn) btn.setAttribute("aria-expanded", "true"); this._renderCalendar(); }
        else { cal.setAttribute("hidden", ""); if (btn) btn.setAttribute("aria-expanded", "false"); }
      };
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-date-picker__calendar-toggle") : null;
        if (btn && this.contains(btn)) { e.preventDefault(); toggle(); }
      });
    }
  }
  define("contour-date-picker", ContourDatePicker);

/**
 * Rating: web component wrapper.
 * Attributes: `value`, `max`, `color`.
 */
class ContourRating extends ContourBase {
    static get observed() { return ["value", "max", "color"]; }
    static get properties() { return { value: { attribute: "value", type: Number }, max: { attribute: "max", type: Number }, color: { attribute: "color" } }; }
    render() {
      this.classList.add("c-rating");
      this.setAttribute("role", "radiogroup");
      this.setAttribute("aria-label", "Rating");
      const max = parseInt(this.getAttribute("max") || "5", 10) || 5;
      const value = parseInt(this.getAttribute("value") || "0", 10) || 0;
      const color = this.getAttribute("color");
      Array.from(this.querySelectorAll(".c-rating__star")).forEach((n) => n.remove());
      for (let i = 1; i <= max; i++) {
        const star = document.createElement("button");
        star.className = "c-rating__star" + (i <= value ? " c-rating__star--filled" : "");
        star.type = "button";
        star.setAttribute("role", "radio");
        star.setAttribute("aria-checked", String(i === value));
        star.innerHTML = '<span class="c-rating__swatch' + (i <= value ? ' c-rating__swatch--filled' : '') + '" aria-hidden="true"' + (color && i <= value ? ' style="background:' + color + ';border-color:' + color + '"' : '') + '></span>';
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
          const v = parseInt(star.dataset.value, 10);
          Array.from(this.querySelectorAll(".c-rating__star")).forEach((st) => st.setAttribute("aria-checked", String(parseInt(st.dataset.value, 10) === v)));
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: v } }));
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

/**
 * Time Picker: web component wrapper.
 * Attributes: `value`, `label`, `disabled`, `error`, `help`.
 */
class ContourTimePicker extends ContourBase {
    static get observed() { return ["value", "label", "disabled", "error", "help"]; }
    static get properties() { return { value: { attribute: "value" }, label: { attribute: "label" }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
    render() {
      this.classList.add("c-time-picker");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Time picker");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-time-picker__label", () => { const el = document.createElement("label"); el.className = "c-time-picker__label"; return el; });
        l.textContent = label;
      }
      const input = this.ensure(".c-time-picker__input", () => { const el = document.createElement("input"); el.className = "c-input c-time-picker__input"; el.type = "time"; return el; });
      input.value = this.getAttribute("value") || "";
      if (this.hasAttribute("disabled")) { input.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
      else { input.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-time-picker__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-time-picker__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-time-picker__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
      // Calendar affordance (R14-22): a toggle + month grid alongside the native input.
      const toggle = this.ensure(".c-date-picker__calendar-toggle", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-date-picker__calendar-toggle"; el.type = "button"; el.textContent = "📅"; el.setAttribute("aria-label", "Open calendar"); el.setAttribute("aria-expanded", "false"); return el; });
      let cal = this.querySelector(".c-date-picker__calendar");
      if (!cal) { cal = document.createElement("div"); cal.className = "c-date-picker__calendar"; cal.setAttribute("hidden", ""); cal.setAttribute("role", "dialog"); cal.setAttribute("aria-label", "Calendar"); this.appendChild(cal); }
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

/**
 * Color Picker: web component wrapper.
 * Attributes: `value`, `label`, `disabled`, `error`, `help`, `alpha`, `presets`.
 */
class ContourColorPicker extends ContourBase {
    static get observed() { return ["value", "label", "disabled", "error", "help", "alpha", "presets"]; }
    static get properties() { return { value: { attribute: "value" }, label: { attribute: "label" }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" }, alpha: { attribute: "alpha", type: Boolean }, presets: { attribute: "presets" } }; }
    render() {
      this.classList.add("c-color-picker");
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Color picker");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-color-picker__label", () => { const el = document.createElement("label"); el.className = "c-color-picker__label"; return el; });
        l.textContent = label;
      }
      const input = this.ensure(".c-color-picker__input", () => { const el = document.createElement("input"); el.className = "c-color-picker__input"; el.type = "color"; return el; });
      input.value = (this.getAttribute("value") || "#000000").slice(0, 7);
      if (this.hasAttribute("disabled")) { input.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
      else { input.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      // Alpha channel (optional).
      if (this.hasAttribute("alpha")) {
        const alpha = this.ensure(".c-color-picker__alpha", () => { const el = document.createElement("input"); el.className = "c-color-picker__alpha"; el.type = "range"; el.min = "0"; el.max = "1"; el.step = "0.01"; return el; });
        const v = this.getAttribute("value") || "#000000";
        const a = v.length === 9 ? parseInt(v.slice(7, 9), 16) / 255 : 1;
        alpha.value = String(a);
        alpha.setAttribute("aria-label", "Alpha");
      } else {
        const a = this.querySelector(".c-color-picker__alpha");
        if (a) a.remove();
      }
      // Presets.
      const presetsAttr = this.getAttribute("presets");
      let presets = [];
      if (presetsAttr) { try { presets = JSON.parse(presetsAttr); } catch (e) { presets = []; } }
      const oldPresets = this.querySelector(".c-color-picker__presets");
      if (oldPresets) oldPresets.remove();
      if (Array.isArray(presets) && presets.length) {
        const wrap = document.createElement("div");
        wrap.className = "c-color-picker__presets";
        presets.forEach((c) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "c-color-picker__preset";
          btn.style.background = c;
          btn.dataset.color = c;
          btn.setAttribute("aria-label", "Preset " + c);
          wrap.appendChild(btn);
        });
        this.appendChild(wrap);
      }
      // Eyedropper (if supported).
      if (typeof window !== "undefined" && "EyeDropper" in window) {
        const ed = this.ensure(".c-color-picker__eyedropper", () => { const el = document.createElement("button"); el.className = "c-color-picker__eyedropper"; el.type = "button"; el.textContent = "Pick"; el.setAttribute("aria-label", "Pick color from screen"); return el; });
        if (this.hasAttribute("disabled")) ed.setAttribute("disabled", "");
        else ed.removeAttribute("disabled");
      } else {
        const ed = this.querySelector(".c-color-picker__eyedropper");
        if (ed) ed.remove();
      }
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-color-picker__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-color-picker__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-color-picker__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
      // Calendar affordance (R14-22): a toggle + month grid alongside the native input.
      const toggle = this.ensure(".c-date-picker__calendar-toggle", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-date-picker__calendar-toggle"; el.type = "button"; el.textContent = "📅"; el.setAttribute("aria-label", "Open calendar"); el.setAttribute("aria-expanded", "false"); return el; });
      let cal = this.querySelector(".c-date-picker__calendar");
      if (!cal) { cal = document.createElement("div"); cal.className = "c-date-picker__calendar"; cal.setAttribute("hidden", ""); cal.setAttribute("role", "dialog"); cal.setAttribute("aria-label", "Calendar"); this.appendChild(cal); }
    }
    enhance() {
      if (this._wiredColorPicker) return;
      this._wiredColorPicker = true;
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && t.classList.contains("c-color-picker__input")) {
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: t.value } }));
        }
        if (t && t.classList.contains("c-color-picker__alpha")) {
          const base = (this.getAttribute("value") || "#000000").slice(0, 7);
          const a = Math.round(parseFloat(t.value) * 255).toString(16).padStart(2, "0");
          const val = base + a;
          this.setAttribute("value", val);
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: val } }));
        }
      });
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-color-picker__preset") : null;
        if (btn && this.contains(btn)) {
          const c = btn.dataset.color;
          if (c) {
            this.setAttribute("value", c);
            const input = this.querySelector(".c-color-picker__input");
            if (input) input.value = c.slice(0, 7);
            this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: c } }));
          }
        }
        const ed = e.target && e.target.closest ? e.target.closest(".c-color-picker__eyedropper") : null;
        if (ed && this.contains(ed) && typeof window !== "undefined" && "EyeDropper" in window) {
          e.preventDefault();
          const dropper = new window.EyeDropper();
          dropper.open().then((r) => {
            if (r && r.sRGBHex) {
              this.setAttribute("value", r.sRGBHex);
              const input = this.querySelector(".c-color-picker__input");
              if (input) input.value = r.sRGBHex;
              this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: r.sRGBHex } }));
            }
          }).catch(() => {});
        }
      });
    }
  }
  define("contour-color-picker", ContourColorPicker);

/**
 * Number Field: web component wrapper.
 * Attributes: `value`, `min`, `max`, `step`, `label`, `disabled`, `error`, `help`.
 */
class ContourNumberField extends ContourBase {
    static get observed() { return ["value", "min", "max", "step", "label", "disabled", "error", "help"]; }
    static get properties() { return { value: { attribute: "value" }, min: { attribute: "min" }, max: { attribute: "max" }, step: { attribute: "step" }, label: { attribute: "label" }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
    render() {
      this.classList.add("c-number-field");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-number-field__label", () => { const el = document.createElement("label"); el.className = "c-number-field__label"; return el; });
        l.textContent = label;
      }
      const input = this.ensure(".c-number-field__input", () => { const el = document.createElement("input"); el.className = "c-input c-number-field__input"; el.type = "number"; el.setAttribute("role", "spinbutton"); return el; });
      if (this.getAttribute("value") !== null) input.value = this.getAttribute("value");
      if (this.getAttribute("min") !== null) input.min = this.getAttribute("min");
      if (this.getAttribute("max") !== null) input.max = this.getAttribute("max");
      if (this.getAttribute("step") !== null) input.step = this.getAttribute("step");
      const v = input.value;
      input.setAttribute("aria-valuenow", v === "" ? "" : v);
      if (input.min !== "") input.setAttribute("aria-valuemin", input.min);
      if (input.max !== "") input.setAttribute("aria-valuemax", input.max);
      if (this.hasAttribute("disabled")) { input.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
      else { input.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-number-field__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-number-field__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-number-field__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
      // Calendar affordance (R14-22): a toggle + month grid alongside the native input.
      const toggle = this.ensure(".c-date-picker__calendar-toggle", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-date-picker__calendar-toggle"; el.type = "button"; el.textContent = "📅"; el.setAttribute("aria-label", "Open calendar"); el.setAttribute("aria-expanded", "false"); return el; });
      let cal = this.querySelector(".c-date-picker__calendar");
      if (!cal) { cal = document.createElement("div"); cal.className = "c-date-picker__calendar"; cal.setAttribute("hidden", ""); cal.setAttribute("role", "dialog"); cal.setAttribute("aria-label", "Calendar"); this.appendChild(cal); }
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
      this.addEventListener("keydown", (e) => {
        const input = this.querySelector(".c-number-field__input");
        if (!input || document.activeElement !== input) return;
        const step = Number(input.step) || 1;
        const min = input.min === "" ? -Infinity : Number(input.min);
        const max = input.max === "" ? Infinity : Number(input.max);
        let next = null;
        if (e.key === "ArrowUp") next = (Number(input.value) || 0) + step;
        else if (e.key === "ArrowDown") next = (Number(input.value) || 0) - step;
        else if (e.key === "Home") next = min === -Infinity ? 0 : min;
        else if (e.key === "End") next = max === Infinity ? (Number(input.value) || 0) : max;
        if (next !== null) {
          e.preventDefault();
          next = Math.min(max, Math.max(min, next));
          input.value = String(next);
          input.setAttribute("aria-valuenow", String(next));
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: input.value } }));
        }
      });
    }
  }
  define("contour-number-field", ContourNumberField);

/**
 * Hover Card: web component wrapper.
 * Attributes: `title`, `content`, `anchor`.
 */
class ContourHoverCard extends ContourBase {
    static get observed() { return ["title", "content", "anchor"]; }
    static get properties() { return { title: { attribute: "title" }, content: { attribute: "content" }, anchor: { attribute: "anchor" } }; }
    render() {
      this.classList.add("c-hover-card");
      if (!this.hasAttribute("role")) this.setAttribute("role", "tooltip");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Hover card");
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
          const show = () => { if (hasPopover) { try { this.showPopover(); } catch (e) {} } else this.classList.add("is-open"); this.dispatchEvent(new CustomEvent("contour:open", { bubbles: true, composed: true })); };
          const hide = () => { if (showTimer) clearTimeout(showTimer); if (hasPopover) { try { this.hidePopover(); } catch (e) {} } else this.classList.remove("is-open"); this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true })); };
          trigger.addEventListener("mouseenter", () => { showTimer = setTimeout(show, 300); });
          trigger.addEventListener("mouseleave", () => { hide(); });
          trigger.addEventListener("focus", show);
          trigger.addEventListener("blur", () => { setTimeout(hide, 100); });
          onDispose(this, () => { if (showTimer) { clearTimeout(showTimer); showTimer = null; } });
        }
      }
      const keyHandler = (e) => { if (e.key === "Escape" && (this.classList.contains("is-open") || this.matches(":popover-open"))) { e.preventDefault(); if (typeof this.hidePopover === "function") { try { this.hidePopover(); } catch (err) {} } this.classList.remove("is-open"); this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true })); } };
      document.addEventListener("keydown", keyHandler);
      onDispose(this, () => document.removeEventListener("keydown", keyHandler));
    }
  }
  define("contour-hover-card", ContourHoverCard);

/**
 * Context Menu: web component wrapper.
 * Attributes: `items`.
 */
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

/**
 * Fab: web component wrapper.
 * Attributes: `label`, `icon`.
 */
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
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true })); }
      });
    }
  }
  define("contour-fab", ContourFab);

/**
 * File Upload: web component wrapper.
 * Attributes: `label`, `accept`, `multiple`, `progress`.
 */
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
      } else {
        const bar = this.querySelector(".c-file-upload__progress");
        if (bar) bar.remove();
      }
      const preview = this.ensure(".c-file-upload__preview", () => { const el = document.createElement("div"); el.className = "c-file-upload__preview"; return el; });
      if (!preview) {}
    }
    enhance() {
      if (this._wiredFileUpload) return;
      this._wiredFileUpload = true;
      const dz = () => this.querySelector(".c-file-upload__dropzone");
      const input = () => this.querySelector(".c-file-upload__input");
      const activate = () => { const i = input(); if (i) i.click(); };
      this.addEventListener("click", (e) => { const d = dz(); if (e.target === d || (d && d.contains(e.target))) { activate(); } });
      this.addEventListener("keydown", (e) => { const d = dz(); if ((e.target === d || (d && d.contains(e.target))) && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); activate(); } });
      const renderPreview = (files) => {
        const preview = this.querySelector(".c-file-upload__preview");
        if (!preview) return;
        preview.innerHTML = "";
        Array.from(files || []).forEach((f) => {
          const item = document.createElement("div");
          item.className = "c-file-upload__preview-item";
          if (f.type && f.type.startsWith("image/")) {
            const img = document.createElement("img");
            img.className = "c-file-upload__preview-thumb";
            img.alt = f.name;
            img.loading = "lazy";
            img.decoding = "async";
            try { img.src = URL.createObjectURL(f); } catch (e) {}
            item.appendChild(img);
          } else {
            const name = document.createElement("span");
            name.className = "c-file-upload__preview-name";
            name.textContent = f.name;
            item.appendChild(name);
          }
          preview.appendChild(item);
        });
      };
      this.addEventListener("change", (e) => { const t = e.target; if (t && t.classList.contains("c-file-upload__input")) { renderPreview(t.files); this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { files: t.files } })); } });
      // drag-drop already dispatches contour:change; also render preview there
      this.addEventListener("dragover", (e) => { e.preventDefault(); this.classList.add("is-dragover"); });
      this.addEventListener("dragleave", () => this.classList.remove("is-dragover"));
      this.addEventListener("drop", (e) => { e.preventDefault(); this.classList.remove("is-dragover"); const i = input(); if (i && e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) { try { i.files = e.dataTransfer.files; } catch (err) { /* some browsers disallow */ } const preview = this.querySelector(".c-file-upload__preview"); if (preview) { preview.innerHTML = ""; Array.from(e.dataTransfer.files).forEach((f) => { const item = document.createElement("div"); item.className = "c-file-upload__preview-item"; if (f.type && f.type.startsWith("image/")) { const img = document.createElement("img"); img.className = "c-file-upload__preview-thumb"; img.alt = f.name; try { img.src = URL.createObjectURL(f); } catch (err2) {} item.appendChild(img); } else { const name = document.createElement("span"); name.className = "c-file-upload__preview-name"; name.textContent = f.name; item.appendChild(name); } preview.appendChild(item); }); } this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { files: e.dataTransfer.files } })); } });
    }
  }
  define("contour-file-upload", ContourFileUpload);

/**
 * Notification Center: web component wrapper.
 * Attributes: `count`, `items`, `color`.
 */
class ContourNotificationCenter extends ContourBase {
    static get observed() { return ["count", "items", "color"]; }
    static get properties() { return { count: { attribute: "count" }, items: { attribute: "items" }, color: { attribute: "color" } }; }
    render() {
      this.classList.add("c-notification-center");
      this.setAttribute("role", "list");
      const btn = this.ensure(".c-notification-center__trigger", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-notification-center__trigger"; el.type = "button"; el.innerHTML = '<span class="c-notification-center__bullet" aria-hidden="true"></span>'; el.setAttribute("aria-haspopup", "dialog"); el.setAttribute("aria-expanded", "false"); return el; });
      const color = this.getAttribute("color");
      const bullet = btn.querySelector(".c-notification-center__bullet");
      if (bullet && color) { bullet.style.background = color; bullet.dataset.color = color; }
      const count = this.getAttribute("count");
      let badge = btn.querySelector(".c-notification-center__badge");
      if (count && Number(count) > 0) {
        if (!badge) { badge = document.createElement("span"); badge.className = "c-notification-center__badge c-badge c-badge--dot"; btn.appendChild(badge); }
        badge.textContent = count;
      } else if (badge) { badge.remove(); }
      const panel = this.ensure(".c-notification-center__panel", () => { const el = document.createElement("div"); el.className = "c-notification-center__panel"; el.hidden = true; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Notifications"); return el; });
      // Slotted content: authored .c-notification-center__item children take
      // precedence over the JSON `items` attribute.
      const authoredItems = Array.from(this.querySelectorAll(":scope > .c-notification-center__item"));
      const items = this.getAttribute("items");
      if (authoredItems.length) {
        panel.innerHTML = "";
        authoredItems.forEach((it) => { panel.appendChild(it); });
      } else if (items) {
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
          if (panel) { panel.hidden = !panel.hidden; btn.setAttribute("aria-expanded", String(!panel.hidden)); this.dispatchEvent(new CustomEvent(panel.hidden ? "contour:close" : "contour:open", { bubbles: true, composed: true })); }
        }
      });
      this.addEventListener("click", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".c-notification-center__item") : null;
        if (item && this.contains(item)) {
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { label: item.textContent } }));
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

/**
 * Stepper: web component wrapper.
 * Attributes: `steps`, `current`.
 */
class ContourStepper extends ContourBase {
    static get observed() { return ["steps", "current"]; }
    static get properties() { return { steps: { attribute: "steps" }, current: { attribute: "current" } }; }
    render() {
      this.classList.add("c-stepper");
      const steps = this.getAttribute("steps");
      const current = Number(this.getAttribute("current") || 0);
      const list = this.ensure(".c-stepper__list", () => { const el = document.createElement("ol"); el.className = "c-stepper__list"; return el; });
      list.innerHTML = "";
      // Slotted content: authored .c-stepper__step children take precedence.
      const authoredSteps = Array.from(this.querySelectorAll(":scope > .c-stepper__step"));
      let parsed = [];
      if (authoredSteps.length) {
        parsed = authoredSteps.map((el) => el.textContent.trim());
        authoredSteps.forEach((el) => el.remove());
      } else {
        try { parsed = steps ? JSON.parse(steps) : []; } catch (e) { parsed = []; }
      }
      parsed.forEach((s, i) => {
        const li = document.createElement("li");
        li.className = "c-stepper__step" + (i === current ? " is-current" : "") + (i < current ? " is-done" : "");
        if (i === current) li.setAttribute("aria-current", "step");
        li.textContent = typeof s === "string" ? s : (s.title || s.label || "");
        list.appendChild(li);
      });
      const nav = this.ensure(".c-stepper__nav", () => { const el = document.createElement("div"); el.className = "c-stepper__nav c-btn-group"; return el; });
      const prev = this.ensure(".c-stepper__prev", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-stepper__prev"; el.type = "button"; el.textContent = "Back"; return el; });
      const next = this.ensure(".c-stepper__next", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-stepper__next"; el.type = "button"; el.textContent = "Next"; return el; });
      if (!nav.contains(prev)) nav.appendChild(prev);
      if (!nav.contains(next)) nav.appendChild(next);
      if (nav.parentNode !== this) this.appendChild(nav);
    }
    enhance() {
      if (this._wiredStepper) return;
      this._wiredStepper = true;
      const go = (dir) => {
        const list = this.querySelector(".c-stepper__list");
        const total = list ? list.querySelectorAll(".c-stepper__step").length : 0;
        if (!total) return;
        let cur = Number(this.getAttribute("current") || 0);
        if (dir === "prev") cur = Math.max(0, cur - 1);
        else cur = Math.min(total - 1, cur + 1);
        this.setAttribute("current", String(cur));
        this.dispatchEvent(new CustomEvent("contour:step-change", { bubbles: true, composed: true, detail: { direction: dir, index: cur } }));
      };
      this.addEventListener("click", (e) => {
        const prev = e.target && e.target.closest ? e.target.closest(".c-stepper__prev") : null;
        const next = e.target && e.target.closest ? e.target.closest(".c-stepper__next") : null;
        if (prev && this.contains(prev)) go("prev");
        if (next && this.contains(next)) go("next");
      });
      this.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); go("prev"); }
        else if (e.key === "ArrowRight") { e.preventDefault(); go("next"); }
      });
    }
  }
  define("contour-stepper", ContourStepper);

/**
 * Virtual List: web component wrapper.
 * Attributes: `items`, `item-height`, `orientation`, `sticky`.
 */
class ContourVirtualList extends ContourBase {
    static get updateMode() { return "keyed"; }
    static get observed() { return ["items", "item-height", "orientation", "sticky"]; }
    static get properties() { return { items: { attribute: "items" }, "item-height": { attribute: "item-height" }, orientation: { attribute: "orientation" }, sticky: { attribute: "sticky", type: Boolean } }; }
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
    _autoHeight() {
      return this.getAttribute("item-height") === "auto";
    }
    render() {
      this.classList.add("c-virtual-list");
      this.setAttribute("role", "list");
      const scroller = this.ensure(".c-virtual-list__scroller", () => { const el = document.createElement("div"); el.className = "c-virtual-list__scroller"; return el; });
      scroller.setAttribute("role", "presentation");
      const horizontal = this.getAttribute("orientation") === "horizontal";
      scroller.style.overflowX = horizontal ? "auto" : "hidden";
      scroller.style.overflowY = horizontal ? "hidden" : "auto";
      const inner = this.ensure(".c-virtual-list__inner", () => { const el = document.createElement("div"); el.className = "c-virtual-list__inner"; el.style.position = "relative"; return el; });
      if (inner.parentNode !== scroller) scroller.appendChild(inner);
      this._renderWindow(scroller, inner, horizontal ? (scroller.scrollLeft || 0) : (scroller.scrollTop || 0));
    }
    _measureHeights(inner, horizontal) {
      const rows = Array.from(inner.querySelectorAll(".c-virtual-list__item"));
      return rows.map((r) => horizontal ? (r.getBoundingClientRect().width || 28) : (r.getBoundingClientRect().height || 28));
    }
    _renderWindow(scroller, inner, scrollTop) {
      const items = this._items();
      const ih = this._itemHeight();
      const horizontal = this.getAttribute("orientation") === "horizontal";
      const autoHeight = this._autoHeight();
      const viewportSize = horizontal ? (scroller.clientWidth || 320) : (scroller.clientHeight || 320);
      const total = items.length;
      // Reset measured heights when item count changes.
      if (this._vlItemCount !== total) { this._vlHeights = null; this._vlItemCount = total; }
      let heights = autoHeight ? this._vlHeights : null;
      let cumulative = null;
      if (autoHeight && heights && heights.length === total) {
        cumulative = [0];
        for (let i = 0; i < total; i++) cumulative.push(cumulative[i] + (heights[i] || 28));
      }
      const visibleCount = autoHeight && !cumulative ? total : (autoHeight ? Math.ceil(viewportSize / 28) + 6 : Math.ceil(viewportSize / ih) + 4);
      let start = 0;
      if (autoHeight && cumulative) {
        // binary search for start
        let lo = 0, hi = total;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (cumulative[mid] < (scrollTop || 0)) lo = mid + 1; else hi = mid;
        }
        start = Math.max(0, lo - 3);
      } else if (!autoHeight) {
        start = Math.floor((scrollTop || 0) / ih);
      }
      if (start < 0) start = 0;
      const end = autoHeight && cumulative
        ? Math.min(total, start + visibleCount)
        : Math.min(total, start + visibleCount);
      if (start > Math.max(0, total - visibleCount) && !autoHeight) start = Math.max(0, total - visibleCount);
      const topSpacerSize = autoHeight && cumulative ? cumulative[start] : (autoHeight ? 0 : start * ih);
      const bottomSpacerSize = autoHeight && cumulative ? Math.max(0, cumulative[total] - cumulative[end]) : (autoHeight ? 0 : Math.max(0, (total - end) * ih));
      inner.style.display = horizontal ? "flex" : "block";
      inner.style.width = horizontal && autoHeight ? "max-content" : "";
      inner.style.height = horizontal || autoHeight ? "" : (total * ih) + "px";
      inner.innerHTML = "";
      const top = document.createElement("div");
      top.className = "c-virtual-list__spacer c-virtual-list__spacer--top";
      top.style[horizontal ? "width" : "height"] = topSpacerSize + "px";
      inner.appendChild(top);
      for (let i = start; i < end; i++) {
        const row = document.createElement("div");
        row.className = "c-virtual-list__item";
        row.setAttribute("role", "listitem");
        // aria-rowindex omitted: not allowed on role="listitem" (axe aria-allowed-attr)
        row.setAttribute("tabindex", i === 0 ? "0" : "-1");
        row.textContent = typeof items[i] === "string" ? items[i] : (items[i].label || items[i].text || JSON.stringify(items[i]));
        if (this.hasAttribute("sticky") && items[i] && items[i].sticky) {
          row.style.position = "sticky";
          row.style.insetBlockStart = "0";
          row.style.zIndex = "1";
        }
        if (horizontal && !autoHeight) row.style.flex = "0 0 " + ih + "px";
        row.dataset.index = String(i);
        inner.appendChild(row);
      }
      const bottom = document.createElement("div");
      bottom.className = "c-virtual-list__spacer c-virtual-list__spacer--bottom";
      bottom.style[horizontal ? "width" : "height"] = bottomSpacerSize + "px";
      inner.appendChild(bottom);
      if (horizontal && !autoHeight) inner.style.width = (total * ih) + "px";
      // Measure heights in auto mode for future windowing.
      if (autoHeight && !this._vlHeights) {
        // defer measurement to next frame so layout is done
        requestAnimationFrame(() => {
          this._vlHeights = this._measureHeights(inner, horizontal);
          // re-render windowed now that heights known
          const s = scroller;
          const i = inner;
          if (s && i) this._renderWindow(s, i, s.scrollTop || 0);
        });
      }
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
          if (s && i) this._renderWindow(s, i, this.getAttribute("orientation") === "horizontal" ? s.scrollLeft : s.scrollTop);
        });
      };
      const s = scroller();
      if (s) {
        s.addEventListener("scroll", onScroll, { passive: true });
        onDispose(this, () => { s.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); });
      }
      // keyboard + selection
      this.addEventListener("keydown", (e) => {
        const rows = Array.from(this.querySelectorAll(".c-virtual-list__item"));
        if (!rows.length) return;
        const active = this.querySelector(".c-virtual-list__item:focus") || rows[0];
        const idx = rows.indexOf(active);
        let next = -1;
        if (e.key === "ArrowDown") next = Math.min(idx + 1, rows.length - 1);
        else if (e.key === "ArrowUp") next = Math.max(idx - 1, 0);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = rows.length - 1;
        else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const i = Number(active.dataset.index);
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: i, value: active.textContent } }));
          return;
        }
        if (next < 0 || next === idx) return;
        e.preventDefault();
        rows.forEach((r, i) => r.setAttribute("tabindex", i === next ? "0" : "-1"));
        try { rows[next].focus(); } catch (err) {}
      });
      this.addEventListener("click", (e) => {
        const row = e.target && e.target.closest ? e.target.closest(".c-virtual-list__item") : null;
        if (!row || !this.contains(row)) return;
        const i = Number(row.dataset.index);
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: i, value: row.textContent } }));
      });
    }
  }
  define("contour-virtual-list", ContourVirtualList);

/**
 * Command Palette: web component wrapper.
 * Attributes: `open`, `items`.
 */
class ContourCommandPalette extends ContourBase {
    static get observed() { return ["open", "items"]; }
    static get properties() { return { open: { attribute: "open", type: Boolean }, items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-command-palette");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
      if (!this.hasAttribute("aria-modal")) this.setAttribute("aria-modal", "true");
      if (!this.hasAttribute("popover")) this.setAttribute("popover", "auto");
      const search = this.ensure(".c-command-palette__search", () => { const el = document.createElement("input"); el.className = "c-input c-command-palette__search"; el.type = "search"; el.placeholder = "Search…"; el.setAttribute("aria-label", "Search commands"); return el; });
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

/**
 * Badge Overflow: web component wrapper.
 * Attributes: `count`, `max`.
 */
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

/**
 * Side Sheet: web component wrapper.
 * Attributes: `open`, `side`, `title`.
 */
class ContourSideSheet extends ContourBase {
    static get observed() { return ["open", "side", "title"]; }
    static get properties() { return { open: { attribute: "open", type: Boolean }, side: { attribute: "side" }, title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-side-sheet");
      this.setAttribute("role", "dialog");
      this.setAttribute("aria-modal", "true");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Side sheet");
      const side = this.getAttribute("side") || "end";
      this.classList.add("c-side-sheet--" + side);
      if (this.hasAttribute("open")) this.classList.add("is-open"); else this.classList.remove("is-open");
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

/**
 * Tour: web component wrapper.
 * Attributes: `steps`, `current`.
 */
class ContourTour extends ContourBase {
    static get observed() { return ["steps", "current"]; }
    static get properties() { return { steps: { attribute: "steps" }, current: { attribute: "current" } }; }
    render() {
      this.classList.add("c-tour");
      this.setAttribute("role", "dialog");
      this.setAttribute("aria-modal", "true");
      this.setAttribute("aria-label", "Tour");
      const steps = this.getAttribute("steps");
      const current = Number(this.getAttribute("current") || 0);
      let parsed = [];
      try { parsed = steps ? JSON.parse(steps) : []; } catch (e) { parsed = []; }
      const step = parsed[current] || {};
      const tip = this.ensure(".c-tour__tip", () => { const el = document.createElement("div"); el.className = "c-tour__tip"; return el; });
      tip.textContent = typeof step === "string" ? step : (step.text || step.title || "");
      const nav = this.ensure(".c-tour__nav", () => { const el = document.createElement("div"); el.className = "c-tour__nav c-btn-group"; return el; });
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

/**
 * Tags Input: web component wrapper.
 * Attributes: `value`, `placeholder`, `disabled`, `error`, `help`.
 */
class ContourTagsInput extends ContourBase {
    static get observed() { return ["value", "placeholder", "disabled", "error", "help"]; }
    static get properties() { return { value: { attribute: "value" }, placeholder: { attribute: "placeholder" }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" } }; }
    render() {
      this.classList.add("c-tags-input");
      const input = this.ensure(".c-tags-input__input", () => { const el = document.createElement("input"); el.className = "c-input c-tags-input__input"; el.type = "text"; el.setAttribute("aria-label", "Add tag"); return el; });
      input.placeholder = this.getAttribute("placeholder") || "Add tag…";
      if (this.hasAttribute("disabled")) { input.setAttribute("disabled", ""); this.classList.add("is-disabled"); }
      else { input.removeAttribute("disabled"); this.classList.remove("is-disabled"); }
      const err = this.getAttribute("error");
      const help = this.getAttribute("help");
      let msg = this.querySelector(".c-tags-input__message");
      if (err || help) {
        if (!msg) { msg = document.createElement("div"); msg.className = "c-tags-input__message"; this.appendChild(msg); }
        msg.textContent = err || help || "";
        msg.classList.toggle("c-tags-input__message--error", !!err);
      } else if (msg) { msg.remove(); }
      if (err) this.classList.add("is-error"); else this.classList.remove("is-error");
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

/**
 * Sortable List: web component wrapper.
 * Attributes: `items`.
 */
class ContourSortableList extends ContourBase {
    static get updateMode() { return "keyed"; }
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

/**
 * Swatch: web component wrapper.
 * Attributes: `color`, `selected`, `label`.
 */
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

/**
 * Calendar: web component wrapper.
 * Attributes: `value`.
 */
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
        if (iso === selected) { cell.classList.add("is-selected"); cell.setAttribute("aria-selected", "true"); }
        else cell.setAttribute("aria-selected", "false");
        const todayIso = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
        if (iso === todayIso) cell.setAttribute("aria-current", "date");
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

/**
 * Carousel: web component wrapper.
 * Attributes: `items`, `index`.
 */
class ContourCarousel extends ContourBase {
    static get observed() { return ["items", "index"]; }
    static get properties() { return { items: { attribute: "items" }, index: { attribute: "index" } }; }
    _items() {
      const items = this.getAttribute("items");
      let parsed = [];
      try { parsed = items ? JSON.parse(items) : []; } catch (e) { parsed = []; }
      return Array.isArray(parsed) ? parsed : [];
    }
    _index() {
      const i = Number(this.getAttribute("index"));
      const items = this._items();
      if (Number.isFinite(i) && i >= 0 && i < items.length) return i;
      return 0;
    }
    render() {
      this.classList.add("c-carousel");
      this.setAttribute("role", "region");
      this.setAttribute("aria-roledescription", "carousel");
      const track = this.ensure(".c-carousel__track", () => { const el = document.createElement("div"); el.className = "c-carousel__track"; el.setAttribute("role", "group"); el.setAttribute("aria-roledescription", "slide container"); return el; });
      const items = this._items();
      track.innerHTML = "";
      const idx = this._index();
      items.forEach((it, i) => {
        const slide = document.createElement("div");
        slide.className = "c-carousel__slide" + (i === idx ? " is-active" : "");
        slide.setAttribute("role", "group");
        slide.setAttribute("aria-roledescription", "slide");
        slide.setAttribute("aria-label", (i + 1) + " of " + items.length);
        slide.setAttribute("aria-hidden", i === idx ? "false" : "true");
        slide.textContent = typeof it === "string" ? it : (it.label || it.text || "");
        slide.dataset.index = String(i);
        track.appendChild(slide);
      });
      const prev = this.ensure(".c-carousel__prev", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-carousel__prev"; el.type = "button"; el.textContent = "‹"; el.setAttribute("aria-label", "Previous slide"); return el; });
      const next = this.ensure(".c-carousel__next", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-carousel__next"; el.type = "button"; el.textContent = "›"; el.setAttribute("aria-label", "Next slide"); return el; });
      const status = this.ensure(".c-carousel__status", () => { const el = document.createElement("span"); el.className = "c-carousel__status"; el.setAttribute("aria-live", "polite"); return el; });
      status.textContent = (idx + 1) + " of " + items.length;
    }
    enhance() {
      if (this._wiredCarousel) return;
      this._wiredCarousel = true;
      const go = (dir) => {
        const items = this._items();
        if (!items.length) return;
        let idx = this._index();
        if (dir === "prev") idx = (idx - 1 + items.length) % items.length;
        else idx = (idx + 1) % items.length;
        this.setAttribute("index", String(idx));
        this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { index: idx, direction: dir } }));
      };
      this.addEventListener("click", (e) => {
        const prev = e.target && e.target.closest ? e.target.closest(".c-carousel__prev") : null;
        const next = e.target && e.target.closest ? e.target.closest(".c-carousel__next") : null;
        if (prev && this.contains(prev)) go("prev");
        if (next && this.contains(next)) go("next");
      });
      this.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); go("prev"); }
        else if (e.key === "ArrowRight") { e.preventDefault(); go("next"); }
        else if (e.key === "Home") { e.preventDefault(); this.setAttribute("index", "0"); this.render(); this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { index: 0, direction: "home" } })); }
        else if (e.key === "End") { e.preventDefault(); const last = this._items().length - 1; if (last >= 0) { this.setAttribute("index", String(last)); this.render(); this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { index: last, direction: "end" } })); } }
      });
    }
  }
  define("contour-carousel", ContourCarousel);

/**
 * Data Grid: web component wrapper.
 * Attributes: `columns`, `rows`, `page`, `filter`, `page-size`, `resizable`.
 */
class ContourDataGrid extends ContourBase {
    static get updateMode() { return "keyed"; }
  static get observed() { return ["columns", "rows", "page", "filter", "page-size", "resizable", "virtual", "row-height"]; }
  static get properties() { return { columns: { attribute: "columns" }, rows: { attribute: "rows" }, page: { attribute: "page" }, filter: { attribute: "filter" }, "page-size": { attribute: "page-size" }, resizable: { attribute: "resizable", type: Boolean }, virtual: { attribute: "virtual", type: Boolean }, "row-height": { attribute: "row-height" } }; }
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
          th.setAttribute("aria-sort", "none");
          th.setAttribute("tabindex", "0");
          th.textContent = typeof c === "string" ? c : (c.label || c.key || "");
          tr.appendChild(th);
        });
        thead.appendChild(tr);
      }
      if (this.hasAttribute("resizable")) {
        Array.from(thead.querySelectorAll("th")).forEach((th) => {
          th.style.position = "relative";
          th.setAttribute("data-resizable", "true");
        });
      }
      const rows = this.getAttribute("rows");
      let parsedRows = [];
      try { parsedRows = rows ? JSON.parse(rows) : []; } catch (e) { parsedRows = []; }
      table.setAttribute("aria-rowcount", String(parsedRows.length));
      table.setAttribute("aria-colcount", String(parsedCols.length));
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
      this._dgCols = parsedCols;
      this._dgRows = parsedRows;
      this._dgFilteredRows = parsedRows;
      const virtual = this.hasAttribute("virtual") && !(Number(this.getAttribute("page-size")) > 0);
      if (virtual) {
        this._renderDataGridWindow(0);
      } else {
        tbody.innerHTML = "";
        parsedRows.forEach((r) => {
          const tr = document.createElement("tr");
          parsedCols.forEach((c) => {
            const key = typeof c === "string" ? c : (c.key || c.label || "");
            const td = document.createElement("td");
            td.setAttribute("role", "gridcell");
            td.setAttribute("tabindex", "0");
            td.textContent = r && r[key] != null ? r[key] : "";
            if (!String(td.textContent).trim()) td.setAttribute("aria-label", "Empty");
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
      }
      // Wrap in a scroll container for virtualization of large datasets.
      let wrap = this.querySelector(".c-data-grid__wrap");
      if (!wrap) { wrap = document.createElement("div"); wrap.className = "c-data-grid__wrap"; wrap.style.maxHeight = "400px"; wrap.style.overflow = "auto"; }
      if (table.parentNode !== wrap) wrap.appendChild(table);
      if (wrap.parentNode !== this) this.appendChild(wrap);
    }
    _rowHeight() {
      const h = Number(this.getAttribute("row-height"));
      return Number.isFinite(h) && h > 0 ? h : 32;
    }
    _renderDataGridWindow(scrollTop) {
      const table = this.querySelector(".c-data-grid__table");
      const tbody = table && table.querySelector("tbody");
      if (!tbody) return;
      const cols = this._dgCols || [];
      const rows = this._dgRows || [];
      const rh = this._rowHeight();
      const viewport = 400;
      const visibleCount = Math.ceil(viewport / rh) + 6;
      let start = Math.floor((scrollTop || 0) / rh);
      if (start < 0) start = 0;
      if (start > Math.max(0, rows.length - visibleCount)) start = Math.max(0, rows.length - visibleCount);
      const end = Math.min(rows.length, start + visibleCount);
      tbody.innerHTML = "";
      // top spacer
      if (start > 0) {
        const sp = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = Math.max(1, cols.length);
        td.style.blockSize = (start * rh) + "px";
        td.style.padding = "0";
        sp.appendChild(td);
        tbody.appendChild(sp);
      }
      for (let i = start; i < end; i++) {
        const r = rows[i];
        const tr = document.createElement("tr");
        tr.dataset.index = String(i);
        cols.forEach((c) => {
          const key = typeof c === "string" ? c : (c.key || c.label || "");
          const td = document.createElement("td");
          td.setAttribute("role", "gridcell");
          td.setAttribute("tabindex", "0");
          td.textContent = r && r[key] != null ? r[key] : "";
          if (!String(td.textContent).trim()) td.setAttribute("aria-label", "Empty");
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      }
      if (end < rows.length) {
        const sp = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = Math.max(1, cols.length);
        td.style.blockSize = ((rows.length - end) * rh) + "px";
        td.style.padding = "0";
        sp.appendChild(td);
        tbody.appendChild(sp);
      }
    }
    enhance() {
      if (this._wiredDataGrid) return;
      this._wiredDataGrid = true;
      const wrap = () => this.querySelector(".c-data-grid__wrap");
      const onScroll = () => {
        const w = wrap();
        if (w && this.hasAttribute("virtual")) this._renderDataGridWindow(w.scrollTop);
      };
      // attach after render creates wrap; use delegated listener on host
      this.addEventListener("scroll", (e) => {
        const w = e.target && e.target.classList && e.target.classList.contains("c-data-grid__wrap") ? e.target : null;
        if (w && this.hasAttribute("virtual")) this._renderDataGridWindow(w.scrollTop);
      }, true);
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
          // Update aria-sort on headers.
          Array.from(thead.querySelectorAll("th")).forEach((h, i) => {
            h.setAttribute("aria-sort", i === idx ? (sortDir === "asc" ? "ascending" : "descending") : "none");
          });
          this.dispatchEvent(new CustomEvent("contour:sort", { bubbles: true, composed: true, detail: { column: idx, direction: sortDir } }));
        }
      });
      this.addEventListener("pointerdown", (e) => {
        if (!this.hasAttribute("resizable")) return;
        const th = e.target && e.target.closest ? e.target.closest("th[data-resizable]") : null;
        if (!th || !this.contains(th) || th.getBoundingClientRect().right - e.clientX > 10) return;
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = th.getBoundingClientRect().width;
        const index = Array.from(th.parentElement.children).indexOf(th);
        const move = (event) => {
          const width = Math.max(48, startWidth + event.clientX - startX);
          const table = this.querySelector(".c-data-grid__table");
          if (table) Array.from(table.rows).forEach((row) => { if (row.children[index]) row.children[index].style.inlineSize = width + "px"; });
        };
        const stop = () => window.removeEventListener("pointermove", move);
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", stop, { once: true });
        onDispose(this, stop);
      });
    }
  }
  define("contour-data-grid", ContourDataGrid);

/**
 * Tree Grid: web component wrapper.
 * Attributes: `items`, `expanded`.
 */
class ContourTreeGrid extends ContourBase {
    static get updateMode() { return "keyed"; }
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
      table.setAttribute("aria-label", "Tree grid");
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
        tr.setAttribute("aria-level", String(depth + 1));
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

class ContourPullToRefresh extends ContourBase {
    static get observed() { return ["threshold"]; }
    static get properties() { return { threshold: { attribute: "threshold" } }; }
    render() {
      this.classList.add("c-pull-to-refresh");
      const ind = this.ensure(".c-pull-to-refresh__indicator", () => {
        const e = document.createElement("div");
        e.className = "c-pull-to-refresh__indicator";
        e.textContent = "Pull to refresh";
        return e;
      });
      if (ind.parentNode !== this) this.prepend(ind);
    }
    enhance() {
      if (this._wiredPullToRefresh) return;
      this._wiredPullToRefresh = true;
      let startY = 0;
      let pulling = false;
      this.addEventListener("touchstart", (e) => {
        if (this.scrollTop > 0) return;
        const t = e.touches && e.touches[0];
        if (t) { startY = t.clientY; pulling = true; }
      }, { passive: true });
      this.addEventListener("touchmove", (e) => {
        if (!pulling) return;
        const t = e.touches && e.touches[0];
        if (!t) return;
        const dy = t.clientY - startY;
        if (dy > 0 && dy < 120) {
          this.style.setProperty("--ptr-offset", dy + "px");
        }
      }, { passive: true });
      this.addEventListener("touchend", (e) => {
        if (!pulling) return;
        pulling = false;
        const t = e.changedTouches && e.changedTouches[0];
        const dy = t ? t.clientY - startY : 0;
        const thr = Number(this.getAttribute("threshold")) || 60;
        if (dy >= thr) {
          this.classList.add("is-refreshing");
          this.dispatchEvent(new CustomEvent("contour:refresh", { bubbles: true, composed: true }));
          setTimeout(() => this.classList.remove("is-refreshing"), 800);
        }
        this.style.removeProperty("--ptr-offset");
      }, { passive: true });
    }
  }
  define("contour-pull-to-refresh", ContourPullToRefresh);
