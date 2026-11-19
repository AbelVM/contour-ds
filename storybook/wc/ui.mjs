import { ContourBase, define, contourId, onDispose, navKey, safeColor, safeHref, cssLength , warnBadJson, labelText } from './core.mjs';
import { wireRemovable, modalContain } from './behaviours.mjs';
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
    static get observed() { return ["variant", "key", "value", "live"]; }
    static get properties() { return { variant: { attribute: "variant" }, key: { attribute: "key" }, value: { attribute: "value" }, live: { attribute: "live", type: Boolean } }; }
    render() {
      this.classList.add("c-chip");
      // A static filter chip is a label, not a live region. Only a chip the
      // author marks `live` announces; otherwise a page with 50 chips creates
      // 50 politeness regions that may speak on load.
      if (this.hasAttribute("live") && !this.hasAttribute("role")) this.setAttribute("role", "status");
      else if (!this.hasAttribute("live") && this.getAttribute("role") === "status" && this._autoChipRole) this.removeAttribute("role");
      this._autoChipRole = this.hasAttribute("live");
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
    static get observed() { return ["label", "removable", "variant", "live"]; }
    static get properties() { return { label: { attribute: "label" }, removable: { attribute: "removable", type: Boolean }, variant: { attribute: "variant" }, live: { attribute: "live", type: Boolean } }; }
    render() {
      this.classList.add("c-tag");
      // A tag is normally a static label. `live` opts it into a polite region,
      // so a wall of tags does not create a wall of announcements.
      if (this.hasAttribute("live") && !this.hasAttribute("role")) this.setAttribute("role", "status");
      else if (!this.hasAttribute("live") && this.getAttribute("role") === "status" && this._autoTagRole) this.removeAttribute("role");
      this._autoTagRole = this.hasAttribute("live");
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
      // `live` is the pill's opt-in to a polite region. A static pill is a label:
      // role=status on every instance makes a page of pills announce itself.
      if (this.hasAttribute("live") && !this.hasAttribute("role")) this.setAttribute("role", "status");
      else if (!this.hasAttribute("live") && this.getAttribute("role") === "status" && this._autoPillRole) this.removeAttribute("role");
      this._autoPillRole = this.hasAttribute("live");
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
      // A skeleton is a decorative placeholder: it is hidden from assistive
      // technology, and the loading state (contour-loading) is what announces.
      // The old code set role=status AND aria-hidden=true, which is a live
      // region that can never speak.
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
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Tooltip");
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
       if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", label || "Progress");
      const min = this.getAttribute("min");
      const max = this.getAttribute("max");
      const minV = min !== null ? Number(min) : 0;
      const maxV = max !== null ? Number(max) : 100;
      if (min !== null) this.setAttribute("aria-valuemin", min);
      else if (!this.hasAttribute("aria-valuemin")) this.setAttribute("aria-valuemin", "0");
      if (max !== null) this.setAttribute("aria-valuemax", max);
      else if (!this.hasAttribute("aria-valuemax")) this.setAttribute("aria-valuemax", "100");
      // aria-valuenow must sit inside the declared min/max, not always 0-100.
      if (this.hasAttribute("aria-valuenow")) {
        const now = Number(this.getAttribute("aria-valuenow"));
        if (Number.isFinite(now)) this.setAttribute("aria-valuenow", String(Math.max(minV, Math.min(maxV, now))));
      }
      if (this.hasAttribute("paused")) this.classList.add("c-progress--paused");
      else Array.from(this.classList).forEach((c) => { if (c === "c-progress--paused") this.classList.remove(c); });
      if (this.hasAttribute("pausable")) {
        const paused = this.hasAttribute("paused");
        const btn = this.ensure(".c-progress__pause", () => {
          const el = document.createElement("button");
          el.className = "c-progress__pause";
          el.type = "button";
          return el;
        });
        btn.setAttribute("aria-label", paused ? "Resume" : "Pause");
        btn.textContent = paused ? "▶" : "⏸";
      } else {
        const btn = this.querySelector(".c-progress__pause");
        if (btn) btn.remove();
      }
    }
    enhance() {
      if (this._wiredProgress) return;
      this._wiredProgress = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-progress__pause") : null;
        if (!btn || !this.contains(btn)) return;
        e.preventDefault();
        const paused = !this.hasAttribute("paused");
        this.toggleAttribute("paused", paused);
        this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { paused } }));
      });
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
    static get observed() { return ["label"]; }
    static get properties() { return { label: { attribute: "label" } }; }
    render() {
      this.classList.add("c-loading");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-live")) this.setAttribute("aria-live", "polite");
      this.ensure(".c-spinner", () => { const el = document.createElement("span"); el.className = "c-spinner"; el.setAttribute("aria-hidden", "true"); return el; });
      // A status region with no text announces nothing: give it a label the
      // reader can hear, visually hidden so the spinner stays the visual.
      const label = this.getAttribute("label") || "Loading";
      let text = this.querySelector("[data-loading-label]");
      if (!text) { text = document.createElement("span"); text.className = "visually-hidden"; text.setAttribute("data-loading-label", ""); this.appendChild(text); }
      text.textContent = label;
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", label);
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", this.getAttribute("message") || "Version banner");
      Array.from(this.children).forEach((n) => n.remove());
      const message = this.getAttribute("message");
      if (message) {
        // createElement("svg") builds an HTMLUnknownElement, not an SVG: the
        // <use> inside it never renders. SVG needs the SVG namespace.
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
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
        a.href = safeHref(href);
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
        // Same rule as `contour-skeleton`: a placeholder is decorative. An
        // exposed empty div adds noise and says nothing.
        sk.setAttribute("aria-hidden", "true");
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
  static get observed() { return ["title", "content", "cluster-count", "cluster-expanded", "cluster-items", "anchor", "position", "collision"]; }
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
      // CDS-072: anchor + collision handling.
      const anchorSel = this.getAttribute("anchor");
      let anchorEl = null;
      if (anchorSel) {
        anchorEl = anchorSel.startsWith("#") ? document.getElementById(anchorSel.slice(1)) : document.querySelector(anchorSel);
      }
      const anchorName = "--map-popup-" + this.id;
      const applyAnchor = () => {
        if (anchorEl) {
          anchorEl.style.setProperty("anchor-name", anchorName);
          this.style.setProperty("position-anchor", anchorName);
        }
      };
      const flipIfNeeded = () => {
        try {
          const r = this.getBoundingClientRect();
          const flipX = r.right > window.innerWidth || r.left < 0;
          const flipY = r.bottom > window.innerHeight || r.top < 0;
          const flipped = flipX || flipY;
          this.classList.toggle("c-map-popup--flip-x", flipX && !flipY);
          this.classList.toggle("c-map-popup--flip-y", flipY && !flipX);
          this.classList.toggle("c-map-popup--flip-both", flipX && flipY);
          if (flipped) {
            this.dispatchEvent(new CustomEvent("contour:map-popup-reposition", {
              bubbles: true, composed: true,
              detail: { anchor: anchorSel || "", flippedX: flipX, flippedY: flipY, left: Math.round(r.left), top: Math.round(r.top) }
            }));
          }
        } catch (e) {}
      };
      applyAnchor();
      this.addEventListener("toggle", (e) => {
        if (e.newState === "open") {
          requestAnimationFrame(() => { applyAnchor(); flipIfNeeded(); });
        }
      });
      // Re-check on resize/scroll so the popup stays in view.
      const onResize = () => flipIfNeeded();
      window.addEventListener("resize", onResize);
      onDispose(this, () => { window.removeEventListener("resize", onResize); if (anchorEl) anchorEl.style.removeProperty("anchor-name"); });
    }
  }
  define("contour-map-popup", ContourMapPopup);

/**
 * AnimationControls: a media control toolbar with play/pause, speed, scrubber
 * and caption. Attributes: `playing`, `speed`, `progress`, `min`, `max`,
 * `caption`, `show-thumb`, `show-thumb-caption`.
 */
class ContourAnimationControls extends ContourBase {
    static get observed() { return ["playing", "speed", "progress", "min", "max", "caption", "show-thumb", "show-thumb-caption", "loop", "step", "markers"]; }
    static get properties() { return { playing: { attribute: "playing", type: Boolean }, speed: { attribute: "speed" }, progress: { attribute: "progress" }, min: { attribute: "min" }, max: { attribute: "max" }, loop: { attribute: "loop", type: Boolean }, step: { attribute: "step" }, markers: { attribute: "markers" } }; }
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
      speedBtn.setAttribute("aria-label", "Playback speed " + speed);
      // Loop is a control, not just an aria-label suffix (R20 T-10).
      const loopBtn = this.ensure(".c-animation-controls__loop", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-animation-controls__loop"; el.type = "button"; el.textContent = "Loop"; return el; });
      loopBtn.setAttribute("aria-pressed", String(this.hasAttribute("loop")));
      // Toolbar: one tab stop, arrows rove (the scrubber keeps native keys).
      playBtn.tabIndex = 0;
      speedBtn.tabIndex = -1;
      loopBtn.tabIndex = -1;
      // scrubber
      const scrubber = this.ensure(".c-animation-controls__scrubber", () => { const el = document.createElement("input"); el.className = "c-range c-animation-controls__scrubber"; el.type = "range"; return el; });
      if (this.getAttribute("show-thumb") === "false") scrubber.classList.remove("c-animation-controls__scrubber--thumb");
      else scrubber.classList.add("c-animation-controls__scrubber--thumb");
      scrubber.min = this.getAttribute("min") || "0";
      scrubber.max = this.getAttribute("max") || "100";
      scrubber.step = this.getAttribute("step") || "1";
      scrubber.value = this.getAttribute("progress") || "0";
      // Accessible time values: expose current position as aria-valuenow and a
      // human-readable label as aria-valuetext so screen readers announce it.
      const min = Number(scrubber.min) || 0;
      const max = Number(scrubber.max) || 100;
      const v = Number(scrubber.value) || min;
      scrubber.setAttribute("aria-valuenow", String(v));
      scrubber.setAttribute("aria-valuetext", String(Math.round(v)));
      scrubber.setAttribute("aria-valuemin", String(min));
      scrubber.setAttribute("aria-valuemax", String(max));
      const caption = this.getAttribute("caption");
      if (caption) scrubber.setAttribute("aria-label", caption);
      else if (!scrubber.getAttribute("aria-label")) scrubber.setAttribute("aria-label", "Playhead");
      // Markers (R20 T-10): the attribute was observed but never read. The
      // native range draws datalist ticks, so the platform renders them.
      const markersRaw = this.getAttribute("markers");
      let markers = [];
      if (markersRaw) { try { const p = JSON.parse(markersRaw); markers = Array.isArray(p) ? p : []; } catch (e) { warnBadJson(this, "markers", e); } }
      const oldList = this.querySelector("datalist.c-animation-controls__markers");
      if (markers.length) {
        const dl = this.ensure("datalist.c-animation-controls__markers", () => { const el = document.createElement("datalist"); el.className = "c-animation-controls__markers"; return el; });
        if (!dl.id) dl.id = this._animMarkersId || (this._animMarkersId = contourId("anim-markers"));
        dl.innerHTML = "";
        markers.forEach((m) => {
          const opt = document.createElement("option");
          const val = typeof m === "object" && m !== null ? m.value : m;
          opt.value = String(val);
          if (typeof m === "object" && m !== null && m.label) opt.label = String(m.label);
          dl.appendChild(opt);
        });
        scrubber.setAttribute("list", dl.id);
      } else {
        if (oldList) oldList.remove();
        scrubber.removeAttribute("list");
      }
      // caption display
      const showCaption = this.hasAttribute("show-thumb-caption") || this.hasAttribute("show-thumb");
      if (caption && showCaption) {
        const cap = this.ensure(".c-animation-controls__caption", () => { const el = document.createElement("span"); el.className = "c-animation-controls__caption"; return el; });
        cap.textContent = caption;
      } else {
        const cap = this.querySelector(".c-animation-controls__caption");
        if (cap) cap.remove();
      }
      // loop indicator
      if (this.hasAttribute("loop")) {
        this.setAttribute("aria-label", "Animation controls, loop");
      }
      // showThumb: hide thumb via attribute? keep default
    }
    enhance() {
      if (this._wiredAnimControls) return;
      this._wiredAnimControls = true;
      const SPEEDS = [0.5, 1, 2, 4];
      // The playhead writes back to `progress` so a consumer reading the
      // attribute sees it — but not mid-drag: the write re-renders, and a
      // rebuilt scrubber would break the gesture (the time-slider's rule).
      const writeProgress = (v) => { if (!this._animScrubbing) this.setAttribute("progress", String(v)); };
      this.addEventListener("pointerdown", (e) => {
        if (e.target && e.target.closest && e.target.closest(".c-animation-controls__scrubber")) this._animScrubbing = true;
      }, { passive: true });
      const endScrub = () => { this._animScrubbing = false; };
      this.addEventListener("pointerup", endScrub, { passive: true });
      this.addEventListener("pointercancel", endScrub, { passive: true });
      this.addEventListener("click", (e) => {
        const play = e.target && e.target.closest ? e.target.closest(".c-animation-controls__play") : null;
        if (play && this.contains(play)) {
          // The attribute is the source of truth: the observer below starts
          // and stops the timer from it, and the re-render flips the label.
          const next = !this.hasAttribute("playing");
          this.toggleAttribute("playing", next);
          this.dispatchEvent(new CustomEvent("contour:toggle", { bubbles: true, composed: true, detail: { playing: next } }));
          return;
        }
        const speed = e.target && e.target.closest ? e.target.closest(".c-animation-controls__speed") : null;
        if (speed && this.contains(speed)) {
          const cur = parseFloat(this.getAttribute("speed") || "1x");
          const idx = SPEEDS.indexOf(Number.isFinite(cur) ? cur : 1);
          const next = SPEEDS[(idx + 1) % SPEEDS.length];
          this.setAttribute("speed", next + "x");
          this.dispatchEvent(new CustomEvent("contour:speed-change", { bubbles: true, composed: true, detail: { speed: next } }));
          return;
        }
        const loop = e.target && e.target.closest ? e.target.closest(".c-animation-controls__loop") : null;
        if (loop && this.contains(loop)) {
          const next = !this.hasAttribute("loop");
          this.toggleAttribute("loop", next);
          this.dispatchEvent(new CustomEvent("contour:loop-change", { bubbles: true, composed: true, detail: { loop: next } }));
        }
      });
      this.addEventListener("input", (e) => {
        const scrubber = e.target && e.target.closest ? e.target.closest(".c-animation-controls__scrubber") : null;
        if (scrubber && this.contains(scrubber)) {
          const v = Number(scrubber.value);
          writeProgress(v);
          this.dispatchEvent(new CustomEvent("contour:seek", { bubbles: true, composed: true, detail: { progress: v, value: v } }));
        }
      });
      this.addEventListener("change", (e) => {
        const scrubber = e.target && e.target.closest ? e.target.closest(".c-animation-controls__scrubber") : null;
        if (scrubber && this.contains(scrubber)) this.setAttribute("progress", scrubber.value);
      });
      // Toolbar keyboard: arrows rove the buttons; the scrubber keeps the
      // native range keys (arrows, Home/End, PageUp/PageDown) when focused.
      this.addEventListener("keydown", (e) => {
        if (e.target && e.target.closest && e.target.closest(".c-animation-controls__scrubber")) return;
        const buttons = Array.from(this.querySelectorAll(".c-animation-controls__play, .c-animation-controls__speed, .c-animation-controls__loop"));
        if (!buttons.includes(e.target)) return;
        navKey(e, buttons, { wrap: true, homeEnd: true, onNavigate: (i) => { buttons.forEach((b, j) => { b.tabIndex = j === i ? 0 : -1; }); }, onKey: (k, idx, item) => { if (k === "Enter" || k === " ") item.click(); } });
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
        let ended = false;
        if (v > max) {
          if (this.hasAttribute("loop")) v = min;
          else { v = max; stop(); ended = true; }
        }
        scrubber.value = String(v);
        writeProgress(v);
        this.dispatchEvent(new CustomEvent("contour:time-change", { bubbles: true, composed: true, detail: { progress: v, value: v } }));
        if (ended) {
          this.removeAttribute("playing");
          this.dispatchEvent(new CustomEvent("contour:toggle", { bubbles: true, composed: true, detail: { playing: false } }));
        }
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
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Dropdown");
      const btn = this.ensure(".c-dropdown__trigger", () => { const el = document.createElement("button"); el.className = "c-dropdown__trigger c-btn c-btn--sm"; el.type = "button"; return el; });
      btn.textContent = this.getAttribute("label") || "Menu";
      // The trigger advertises the menu it opens before it is opened: a reader
      // who tabs to it hears "has popup menu, collapsed", not "button".
      btn.setAttribute("aria-haspopup", "menu");
      btn.setAttribute("aria-expanded", "false");
      const menu = this.ensure(".c-dropdown__menu", () => { const el = document.createElement("div"); el.className = "c-dropdown__menu c-menu"; el.setAttribute("role", "menu"); el.hidden = true; return el; });
      if (!menu.id) menu.id = (this.id || contourId("dd")) + "-menu";
      btn.setAttribute("aria-controls", menu.id);
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
        } catch (e) { warnBadJson(this, "attribute", e); }
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
        navKey(e, items, { wrap: true, enter: false, onKey: (k) => { if (k === "Enter" || k === " ") document.activeElement.click(); } });
      };
      document.addEventListener("keydown", keyHandler);
      onDispose(this, () => document.removeEventListener("keydown", keyHandler));
    }
  }
  define("contour-dropdown", ContourDropdown);

/**
 * Annotation: a positioned, movable note. Attributes: `label`, `x`, `y`
 * (percentages of the offset parent, e.g. "40%"). The note is focusable:
 * dragging it or nudging with the arrow keys (Shift for 10% steps) writes
 * `x`/`y` back — the attributes ARE the serialization — and emits
 * `contour:drag` per move and `contour:dragend` on release (R20 T-11).
 */
class ContourAnnotation extends ContourBase {
    static get observed() { return ["label", "x", "y"]; }
    static get properties() { return { label: { attribute: "label" }, x: { attribute: "x" }, y: { attribute: "y" } }; }
    render() {
      this.classList.add("c-annotation");
      this.setAttribute("role", "note");
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
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
    enhance() {
      if (this._wiredAnnotation) return;
      this._wiredAnnotation = true;
      // Percent of the offset parent, clamped to [0, 100]. The host itself is
      // the dragged node and survives re-render (only generated children are
      // rebuilt), so pointer capture on the host holds across writeback.
      const pct = (v, fallback) => {
        const n = parseFloat(v);
        return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : fallback;
      };
      const write = (x, y, key) => {
        // One render per move, not two: batch coalesces the x and y writes.
        this.batch(() => {
          this.setAttribute("x", x + "%");
          this.setAttribute("y", y + "%");
        });
        this.dispatchEvent(new CustomEvent("contour:drag", { bubbles: true, composed: true, detail: { delta: key ? 1 : 0, key: key || "pointer", value: x + "," + y } }));
      };
      let drag = null;
      this.addEventListener("pointerdown", (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        const parent = this.offsetParent || this.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        drag = { px: e.clientX, py: e.clientY, x: pct(this.getAttribute("x"), 50), y: pct(this.getAttribute("y"), 50), w: rect.width || 1, h: rect.height || 1 };
        try { this.setPointerCapture(e.pointerId); } catch (err) {}
        try { this.focus(); } catch (err) {}
        e.preventDefault();
      });
      this.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const x = Math.round((drag.x + ((e.clientX - drag.px) / drag.w) * 100) * 10) / 10;
        const y = Math.round((drag.y + ((e.clientY - drag.py) / drag.h) * 100) * 10) / 10;
        write(Math.min(100, Math.max(0, x)), Math.min(100, Math.max(0, y)));
      });
      const endDrag = () => {
        if (!drag) return;
        drag = null;
        this.dispatchEvent(new CustomEvent("contour:dragend", { bubbles: true, composed: true, detail: { value: (this.getAttribute("x") || "") + "," + (this.getAttribute("y") || "") } }));
      };
      this.addEventListener("pointerup", endDrag);
      this.addEventListener("pointercancel", endDrag);
      this.addEventListener("keydown", (e) => {
        const step = e.shiftKey ? 10 : 1;
        let dx = 0, dy = 0;
        if (e.key === "ArrowLeft") dx = -step;
        else if (e.key === "ArrowRight") dx = step;
        else if (e.key === "ArrowUp") dy = -step;
        else if (e.key === "ArrowDown") dy = step;
        else return;
        e.preventDefault();
        const x = Math.min(100, Math.max(0, pct(this.getAttribute("x"), 50) + dx));
        const y = Math.min(100, Math.max(0, pct(this.getAttribute("y"), 50) + dy));
        write(x, y, e.key);
        this.dispatchEvent(new CustomEvent("contour:dragend", { bubbles: true, composed: true, detail: { value: x + "," + y } }));
      });
    }
  }
  define("contour-annotation", ContourAnnotation);

/**
 * Style Switcher: a toggle-button group over map/styles. Attributes: `items`
 * (JSON) or authored `.c-style-switcher__option` buttons, and `value`.
 * Selecting an option writes `value` back — the pressed/active state is the
 * attribute's projection, not a one-shot render — and emits `contour:change`
 * (R20 T-12). Arrow keys rove one tab stop; Enter/Space select.
 */
class ContourStyleSwitcher extends ContourBase {
    static get observed() { return ["items", "value"]; }
    static get properties() { return { items: { attribute: "items" }, value: { attribute: "value" } }; }
    render() {
      this.classList.add("c-style-switcher");
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Style switcher");
      const items = this.getAttribute("items");
      const value = this.getAttribute("value");
      // Authored options win over the JSON attribute (the dropdown contract);
      // they used to be destroyed on every render.
      const authored = Array.from(this.children).filter((n) => n.classList && n.classList.contains("c-style-switcher__option"));
      if (items && !authored.length) {
        Array.from(this.querySelectorAll(".c-style-switcher__option")).forEach((n) => n.remove());
        try {
          const parsed = JSON.parse(items);
          parsed.forEach((it) => {
            const name = typeof it === "string" ? it : (it.name || it.label || "");
            const btn = document.createElement("button");
            btn.className = "c-style-switcher__option c-btn c-btn--sm";
            btn.type = "button";
            btn.textContent = name;
            btn.dataset.value = name;
            this.appendChild(btn);
          });
        } catch (e) { warnBadJson(this, "attribute", e); }
      }
      // Project the value onto every option, authored or generated, and keep
      // one tab stop: the active option (or the first).
      const opts = Array.from(this.querySelectorAll(".c-style-switcher__option"));
      let active = null;
      opts.forEach((btn) => {
        const v = btn.dataset.value != null ? btn.dataset.value : btn.textContent.trim();
        const on = v === value;
        btn.classList.toggle("c-style-switcher__option--active", on);
        btn.setAttribute("aria-pressed", String(on));
        btn.tabIndex = -1;
        if (on && !active) active = btn;
      });
      (active || opts[0])?.setAttribute("tabindex", "0");
    }
    enhance() {
      if (this._wiredStyleSwitcher) return;
      this._wiredStyleSwitcher = true;
      const select = (btn) => {
        const v = btn.dataset.value != null ? btn.dataset.value : btn.textContent.trim();
        // The writeback re-renders the pressed state; the event carries the
        // same value the attribute now holds.
        this.setAttribute("value", v);
        this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: v } }));
      };
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-style-switcher__option") : null;
        if (btn && this.contains(btn)) select(btn);
      });
      this.addEventListener("keydown", (e) => {
        const opts = Array.from(this.querySelectorAll(".c-style-switcher__option"));
        navKey(e, opts, { onKey: (k) => { if (k === "Enter" || k === " ") { const btn = document.activeElement; if (btn && btn.classList.contains("c-style-switcher__option")) select(btn); } } });
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
      // Authored defaults captured once, before any edit or Revert writes:
      // Revert restores THESE, not the last rendered state (R20 T-12).
      if (!this._stylePanelDefault) {
        this._stylePanelDefault = {};
        for (const a of ["property", "classification", "palette", "breaks", "opacity", "n", "colors"]) this._stylePanelDefault[a] = this.getAttribute(a);
      }
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
         // Unique ids: the old code used the global "property"/"policy"/"palette"/"n",
         // so two panels on a page produced duplicate ids and broken label[for].
         const uid = contourId("style-panel");
         const propId = uid + "-property";
         const policyId = uid + "-policy";
         const paletteId = uid + "-palette";
         const nId = uid + "-n";
         // property field
         const propLabel = document.createElement("label"); propLabel.textContent = labelText(this, "colour-field", "Colour field"); propLabel.setAttribute("for", propId); body.appendChild(propLabel);
         const propIn = document.createElement("input"); propIn.type = "text"; propIn.id = propId; propIn.className = "c-style-panel__property c-input"; propIn.setAttribute("aria-label", labelText(this, "colour-field", "Colour field"));
         const pv = this.getAttribute("property"); if (pv) propIn.value = pv;
         body.appendChild(propIn);
         // classification method selector (policy)
         const clsLabel = document.createElement("label"); clsLabel.textContent = labelText(this, "classification", "Classification"); clsLabel.setAttribute("for", policyId); body.appendChild(clsLabel);
         const clsSel = document.createElement("select"); clsSel.id = policyId; clsSel.className = "c-style-panel__classification c-input"; clsSel.setAttribute("aria-label", labelText(this, "classification-method", "Classification method"));
         ["equal","quantile","jenks","manual"].forEach((m) => { const o = document.createElement("option"); o.value = m; o.textContent = m; clsSel.appendChild(o); });
         const cls = this.getAttribute("classification"); if (cls) clsSel.value = cls;
         body.appendChild(clsSel);
         // palette picker
         const palLabel = document.createElement("label"); palLabel.textContent = labelText(this, "palette", "Palette"); palLabel.setAttribute("for", paletteId); body.appendChild(palLabel);
         const pal = document.createElement("input"); pal.type = "text"; pal.id = paletteId; pal.className = "c-style-panel__palette c-input"; pal.placeholder = labelText(this, "palette", "Palette"); pal.setAttribute("aria-label", labelText(this, "palette", "Palette"));
         const palv = this.getAttribute("palette"); if (palv) pal.value = palv;
         body.appendChild(pal);
         // n (class count)
         const nLabel = document.createElement("label"); nLabel.textContent = labelText(this, "classes", "Classes"); nLabel.setAttribute("for", nId); body.appendChild(nLabel);
         const nIn = document.createElement("input"); nIn.type = "number"; nIn.id = nId; nIn.className = "c-style-panel__n c-input"; nIn.min = "2"; nIn.max = "12"; nIn.setAttribute("aria-label", labelText(this, "class-count", "Class count"));
         const nv = this.getAttribute("n"); if (nv) nIn.value = nv; else nIn.value = "5";
         body.appendChild(nIn);
         // opacity slider
         const op = document.createElement("input"); op.type = "range"; op.className = "c-style-panel__opacity"; op.setAttribute("aria-label", labelText(this, "opacity", "Opacity")); op.min = "0"; op.max = "100";
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
             const inp = document.createElement("input"); inp.type = "number"; inp.className = "c-style-panel__breaks c-input"; inp.setAttribute("aria-label", labelText(this, "class-lower-bound", "Class lower bound")); inp.value = String(b);
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
             const sw = document.createElement("input"); sw.type = "color"; sw.className = "c-style-panel__color c-input"; sw.setAttribute("aria-label", labelText(this, "colour-for-class", "Colour for class") + " " + (i + 1));
             sw.value = c;
             // data-edited is marked by the delegated input handler in
             // enhance() — a per-node listener here died with the render.
             list.appendChild(sw);
           });
           body.appendChild(list);
         }
         // Apply/Revert buttons
         const actions = document.createElement("div"); actions.className = "c-style-panel__actions c-btn-group";
         const applyBtn = document.createElement("button"); applyBtn.type = "button"; applyBtn.className = "c-btn c-btn--primary"; applyBtn.textContent = labelText(this, "apply", "Apply"); applyBtn.dataset.action = "apply";
         const revertBtn = document.createElement("button"); revertBtn.type = "button"; revertBtn.className = "c-btn"; revertBtn.textContent = labelText(this, "revert", "Revert"); revertBtn.dataset.action = "revert";
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
            clsSel.setAttribute("aria-label", labelText(this, "classification-method", "Classification method"));
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
            breaks.setAttribute("aria-label", "Class breaks");
            if (typeof l === "object" && l.breaks) breaks.value = (Array.isArray(l.breaks) ? l.breaks.join(",") : l.breaks);
            row.appendChild(breaks);
            // opacity control
            const op = document.createElement("input");
            op.type = "range";
            op.className = "c-style-panel__opacity";
            op.setAttribute("aria-label", labelText(this, "opacity", "Opacity"));
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
        if (t.classList.contains("c-style-panel__color")) t.setAttribute("data-edited", "true");
        if (t.classList.contains("c-style-panel__palette") || t.classList.contains("c-style-panel__breaks")) {
          const row = t.closest(".c-style-panel__row");
          const name = row ? (row.querySelector(".c-style-panel__name")?.textContent || "") : "";
          this.dispatchEvent(new CustomEvent("contour:style-resolved", { detail: { value: t.value, layer: name, property: t.classList.contains("c-style-panel__palette") ? "palette" : "breaks" }, bubbles: true, composed: true }));
        }
      });
      this.addEventListener("click", (e) => {
        const t = e.target && e.target.closest ? e.target.closest("button") : null;
        if (!t || !this.contains(t)) return;
        // Match the action, not the English label: a localized panel used to
        // go inert because the handler compared textContent to "Apply".
        if (t.dataset.action === "apply") {
          // Carry the current control values, not just { applied: true }: a
          // consumer listening for the apply needs to know what was applied.
          const body = this.querySelector(".c-style-panel__body");
          const payload = { applied: true };
          if (body) {
            const prop = body.querySelector(".c-style-panel__property");
            const cls = body.querySelector(".c-style-panel__classification");
            const pal = body.querySelector(".c-style-panel__palette");
            const n = body.querySelector(".c-style-panel__n");
            const colors = Array.from(body.querySelectorAll(".c-style-panel__color")).map((c) => c.value);
            if (prop) payload.property = prop.value;
            if (cls) payload.classification = cls.value;
            if (pal) payload.palette = pal.value;
            if (n) payload.n = Number(n.value);
            if (colors.length) payload.colors = colors;
          }
          this.dispatchEvent(new CustomEvent("contour:style-resolved", { detail: payload, bubbles: true, composed: true }));
        } else if (t.dataset.action === "revert") {
          // Revert restores the authored defaults captured at first render —
          // it used to emit { applied: false } and restore nothing. The
          // controls are the live state, so the rebuild must skip the base
          // class's value-restore (_contourResetting); otherwise an edited
          // control is written straight back over the default it was meant
          // to lose. The explicit __rerender__ fires even when no attribute
          // actually changed — a user who edited only the live controls
          // leaves every attribute at its authored value, so batch() alone
          // would coalesce to nothing and the panel would keep the edit.
          const def = this._stylePanelDefault || {};
          this._contourResetting = true;
          try {
            for (const a of ["property", "classification", "palette", "breaks", "opacity", "n", "colors"]) {
              if (def[a] === null || def[a] === undefined) this.removeAttribute(a);
              else this.setAttribute(a, def[a]);
            }
            this.attributeChangedCallback("__rerender__", null, "");
          } finally {
            this._contourResetting = false;
          }
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
        } catch (e) { warnBadJson(this, "attribute", e); }
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
      // A status light is a labelled graphic: give it a role and a name so the
      // colour is not the only carrier of the state.
      if (!this.hasAttribute("role")) this.setAttribute("role", "img");
      const label = this.getAttribute("label");
      if (label && !this.hasAttribute("aria-label")) this.setAttribute("aria-label", label);
      else if (!label && !this.hasAttribute("aria-label")) this.setAttribute("aria-label", status);
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
      // The toggle opens a menu: it says so, it owns the state, and it names the
      // node it opens. Without all three a reader hears an unlabelled "▾".
      if (!menu.id) menu.id = (this.id || contourId("split")) + "-menu";
      toggle.setAttribute("aria-haspopup", "menu");
      toggle.setAttribute("aria-controls", menu.id);
      toggle.setAttribute("aria-expanded", String(!menu.hidden));
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
        } catch (e) { warnBadJson(this, "attribute", e); }
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
      const items = () => Array.from(menu()?.querySelectorAll(".c-menu__item") || []);
      // One open/close path for click, keyboard and outside-click, so the
      // toggle event and aria-expanded fire exactly once per transition on
      // every path (the keyboard path used to skip the event).
      const setOpen = (open, focusFirst) => {
        const m = menu(); const t = toggle();
        if (!m) return;
        const was = !m.hidden;
        m.hidden = !open;
        if (t) t.setAttribute("aria-expanded", String(open));
        if (open && focusFirst) { const first = items()[0]; if (first) try { first.focus(); } catch (e) {} }
        if (was !== open) this.dispatchEvent(new CustomEvent("contour:toggle", { bubbles: true, composed: true, detail: { open } }));
      };
      this.addEventListener("click", (e) => {
        const main = e.target && e.target.closest ? e.target.closest(".c-split-button__main") : null;
        if (main && this.contains(main)) {
          // The primary action is half the widget; it used to do nothing.
          this.dispatchEvent(new CustomEvent("contour:activate", { bubbles: true, composed: true, detail: { label: main.textContent } }));
          return;
        }
        const t = toggle();
        if (e.target === t || (t && t.contains(e.target))) {
          const m = menu();
          setOpen(m ? m.hidden : false, true);
          return;
        }
        const item = e.target && e.target.closest ? e.target.closest(".c-menu__item") : null;
        if (item && this.contains(item)) {
          const index = items().indexOf(item);
          setOpen(false, false);
          try { toggle()?.focus(); } catch (err) {}
          this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { label: item.textContent, index } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const t = toggle();
        const m = menu();
        const list = items();
        const onToggle = e.target === t || (t && t.contains(e.target));
        const idx = list.indexOf(e.target);
        if (onToggle && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
          e.preventDefault();
          setOpen(true, true);
        } else if (onToggle && e.key === "ArrowUp") {
          e.preventDefault();
          setOpen(true, false);
          const last = list[list.length - 1]; if (last) try { last.focus(); } catch (err) {}
        } else if (idx >= 0) {
          if (e.key === "ArrowDown") { e.preventDefault(); list[(idx + 1) % list.length]?.focus(); }
          else if (e.key === "ArrowUp") { e.preventDefault(); list[(idx - 1 + list.length) % list.length]?.focus(); }
          else if (e.key === "Home") { e.preventDefault(); list[0]?.focus(); }
          else if (e.key === "End") { e.preventDefault(); list[list.length - 1]?.focus(); }
          else if (e.key === "Escape") { e.preventDefault(); setOpen(false, false); try { t?.focus(); } catch (err) {} }
          // Enter/Space on a menuitem is the native button's own click.
        } else if (e.key === "Escape" && m && !m.hidden) {
          setOpen(false, false); try { t?.focus(); } catch (err) {}
        }
      });
      const docClick = (e) => {
        const m = menu();
        if (m && !m.hidden && !this.contains(e.target)) setOpen(false, false);
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
    _palette() {
      let parsed = [];
      try { const c = this.getAttribute("colors"); parsed = c ? JSON.parse(c) : []; } catch (e) { warnBadJson(this, "colors", e); }
      if (!Array.isArray(parsed)) parsed = [];
      return parsed.map((c) => typeof c === "string" ? { color: c, name: c } : { color: String(c.color || c.value || "#000000"), name: String(c.name || c.label || c.color || c.value || "color") });
    }
    _writePalette(entries) {
      // The colors attribute IS the serialization (R20 T-15): every edit,
      // add and remove writes it back, so a re-render keeps the user's work.
      this.setAttribute("colors", JSON.stringify(entries.map((e) => e.name === e.color ? e.color : { color: e.color, name: e.name })));
    }
    render() {
      this.classList.add("c-palette-editor");
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Palette editor");
      const entries = this._palette();
      Array.from(this.querySelectorAll(".c-palette-editor__swatch, .c-palette-editor__edit, .c-palette-editor__remove, .c-palette-editor__add, .c-palette-editor__contrast")).forEach((n) => n.remove());
      entries.forEach((entry, i) => {
        const sw = document.createElement("button");
        sw.className = "c-palette-editor__swatch c-swatch" + (this._paletteSelected === i ? " is-selected" : "");
        sw.type = "button";
        sw.style.background = safeColor(entry.color);
        sw.dataset.color = entry.color;
        sw.dataset.index = String(i);
        sw.setAttribute("aria-label", entry.name);
        sw.setAttribute("aria-pressed", String(this._paletteSelected === i));
        this.appendChild(sw);
        // The native color input is the edit surface — the platform's picker,
        // not a reinvented one.
        const edit = document.createElement("input");
        edit.type = "color";
        edit.className = "c-palette-editor__edit";
        edit.value = /^#[0-9a-f]{6}$/i.test(entry.color) ? entry.color : "#000000";
        edit.dataset.index = String(i);
        edit.setAttribute("aria-label", "Edit " + entry.name);
        this.appendChild(edit);
        const rm = document.createElement("button");
        rm.type = "button";
        rm.className = "c-palette-editor__remove";
        rm.dataset.index = String(i);
        rm.setAttribute("aria-label", "Remove " + entry.name);
        rm.textContent = "×";
        this.appendChild(rm);
      });
      const add = document.createElement("button");
      add.type = "button";
      add.className = "c-palette-editor__add";
      add.setAttribute("aria-label", labelText(this, "add-color", "Add color"));
      add.textContent = "+";
      this.appendChild(add);
      // Contrast feedback for the selected color: the ratio against white
      // and black, and whether the better one meets AA for body text.
      const sel = entries[this._paletteSelected];
      if (sel) {
        const lum = (hex) => {
          const m = /^#([0-9a-f]{6})$/i.exec(hex);
          if (!m) return null;
          const n = parseInt(m[1], 16);
          const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
          return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
        };
        const l = lum(sel.color);
        const out = document.createElement("span");
        out.className = "c-palette-editor__contrast";
        if (l === null) {
          out.textContent = sel.color;
        } else {
          const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
          const onWhite = ratio(l, 1), onBlack = ratio(l, 0);
          const best = Math.max(onWhite, onBlack);
          out.textContent = sel.name + ": " + onWhite.toFixed(1) + ":1 on white, " + onBlack.toFixed(1) + ":1 on black — " + (best >= 4.5 ? "AA" : "below AA");
        }
        this.appendChild(out);
      }
    }
    enhance() {
      if (this._wiredPaletteEditor) return;
      this._wiredPaletteEditor = true;
      this.addEventListener("click", (e) => {
        const t = e.target && e.target.closest ? e.target : null;
        if (!t) return;
        const sw = t.closest(".c-palette-editor__swatch");
        if (sw && this.contains(sw)) {
          this._paletteSelected = Number(sw.dataset.index);
          this.requestRender();
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { color: sw.dataset.color } }));
          return;
        }
        const rm = t.closest(".c-palette-editor__remove");
        if (rm && this.contains(rm)) {
          const entries = this._palette();
          const i = Number(rm.dataset.index);
          const [gone] = entries.splice(i, 1);
          if (this._paletteSelected >= entries.length) this._paletteSelected = entries.length - 1;
          this._writePalette(entries);
          this.dispatchEvent(new CustomEvent("contour:remove", { bubbles: true, composed: true, detail: { value: gone ? gone.color : "" } }));
          return;
        }
        if (t.closest(".c-palette-editor__add")) {
          const entries = this._palette();
          const next = "#888888";
          entries.push({ color: next, name: next });
          this._paletteSelected = entries.length - 1;
          this._writePalette(entries);
          this.dispatchEvent(new CustomEvent("contour:add", { bubbles: true, composed: true, detail: { value: next } }));
        }
      });
      this.addEventListener("change", (e) => {
        const edit = e.target && e.target.closest ? e.target.closest(".c-palette-editor__edit") : null;
        if (!edit || !this.contains(edit)) return;
        const entries = this._palette();
        const i = Number(edit.dataset.index);
        if (!entries[i]) return;
        entries[i].color = edit.value;
        if (entries[i].name === entries[i].color || /^#[0-9a-f]{6}$/i.test(entries[i].name)) entries[i].name = edit.value;
        this._writePalette(entries);
        this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { color: edit.value, values: entries.map((en) => en.color) } }));
      });
      this.addEventListener("keydown", (e) => {
        const swatches = Array.from(this.querySelectorAll(".c-palette-editor__swatch"));
        if (!swatches.includes(e.target)) return;
        navKey(e, swatches, { wrap: true, enter: true, onKey: (k, idx, item) => { if (k === "Enter" || k === " ") item.click(); } });
      });
    }
  }
  define("contour-palette-editor", ContourPaletteEditor);

/**
 * Date Range: two native date (or datetime-local with `time`) inputs with a
 * shared label. Attributes: `start`, `end`, `label`, `time`, `min`, `max`,
 * `locale`, `name`, `required`, `disabled`. Form associated (R20 T-16): the
 * host submits the two dates as repeated entries under its name, reports
 * required/inverted validity, and resets to the authored defaults. The
 * inputs are distinctly named for assistive tech and cross-constrained
 * (end.min = start, start.max = end); a committed change writes start/end
 * back. The native pickers supply the calendar; timezone is the consumer's
 * (the values are local ISO strings, date-only unless `time`).
 */
class ContourDateRange extends ContourBase {
  static get observed() { return ["start", "end", "label", "time", "min", "max", "locale", "name", "required", "disabled"]; }
  static get properties() { return { start: { attribute: "start" }, end: { attribute: "end" }, label: { attribute: "label" }, time: { attribute: "time", type: Boolean }, min: { attribute: "min" }, max: { attribute: "max" }, locale: { attribute: "locale" }, name: { attribute: "name" }, required: { attribute: "required", type: Boolean }, disabled: { attribute: "disabled", type: Boolean } }; }
  static get formAssociated() { return true; }
    render() {
      this.classList.add("c-date-range");
      // Authored defaults captured before any commit reflects into them.
      if (this._dateRangeDefaultStart === undefined) {
        this._dateRangeDefaultStart = this.getAttribute("start");
        this._dateRangeDefaultEnd = this.getAttribute("end");
      }
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", this.getAttribute("label") || "Date range");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-date-range__label", () => { const el = document.createElement("span"); el.className = "c-date-range__label"; return el; });
        l.textContent = label;
      }
      const start = this.ensure(".c-date-range__start", () => { const el = document.createElement("input"); el.className = "c-input c-date-range__start"; return el; });
      start.type = this.hasAttribute("time") ? "datetime-local" : "date";
      start.value = this.getAttribute("start") || "";
      // Distinct names: both inputs used to carry the identical aria-label,
      // so a screen reader could not tell start from end.
      start.setAttribute("aria-label", label ? label + " — start" : "Start date");
      const end = this.ensure(".c-date-range__end", () => { const el = document.createElement("input"); el.className = "c-input c-date-range__end"; return el; });
      end.type = start.type;
      end.value = this.getAttribute("end") || "";
      end.setAttribute("aria-label", label ? label + " — end" : "End date");
      const min = this.getAttribute("min");
      const max = this.getAttribute("max");
      [start, end].forEach((input) => {
        if (min) input.min = min; else input.removeAttribute("min");
        if (max) input.max = max; else input.removeAttribute("max");
        if (this.getAttribute("locale")) input.lang = this.getAttribute("locale");
        if (this.hasAttribute("disabled")) input.setAttribute("disabled", ""); else input.removeAttribute("disabled");
      });
      // Cross-constraint: the picker cannot offer an inverted range.
      if (start.value) end.min = min && min > start.value ? min : start.value;
      if (end.value) start.max = max && max < end.value ? max : end.value;
      if (this.hasAttribute("required")) this.setAttribute("aria-required", "true"); else this.removeAttribute("aria-required");
      if (this._internals) this._syncFormValue();
    }
    enhance() {
      if (this._wiredDateRange) return;
      this._wiredDateRange = true;
      this.addEventListener("change", (e) => {
        const t = e.target;
        if (t && (t.classList.contains("c-date-range__start") || t.classList.contains("c-date-range__end"))) {
          const s = this.querySelector(".c-date-range__start");
          const en = this.querySelector(".c-date-range__end");
          // Commit writes back; the re-render re-applies the same values and
          // refreshes the cross-constraint.
          this.batch(() => {
            if (s) this.setAttribute("start", s.value);
            if (en) this.setAttribute("end", en.value);
          });
          this._syncFormValue();
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { start: s?.value, end: en?.value } }));
        }
      });
    }
    _syncFormValue() {
      if (!this._internals) return;
      const start = this.querySelector(".c-date-range__start")?.value || "";
      const end = this.querySelector(".c-date-range__end")?.value || "";
      const name = this.getAttribute("name");
      if (name && (start || end)) {
        const fd = new FormData();
        if (start) fd.append(name, start);
        if (end) fd.append(name, end);
        this._internals.setFormValue(fd);
      } else {
        this._internals.setFormValue(null);
      }
      const missing = this.hasAttribute("required") && (!start || !end);
      const inverted = !!(start && end && start > end);
      if (missing) this._internals.setValidity({ valueMissing: true }, "Both dates are required.");
      else if (inverted) this._internals.setValidity({ customError: true }, "Start must be on or before end.");
      else this._internals.setValidity({});
      this._setCustomState("data-invalid", missing || inverted);
      for (const input of this.querySelectorAll("input")) input.setAttribute("aria-invalid", String(missing || inverted));
    }
    formResetCallback() {
      this._contourResetting = true;
      try {
        if (this._dateRangeDefaultStart === null) this.removeAttribute("start"); else this.setAttribute("start", this._dateRangeDefaultStart);
        if (this._dateRangeDefaultEnd === null) this.removeAttribute("end"); else this.setAttribute("end", this._dateRangeDefaultEnd);
        this._syncFormValue();
      } finally {
        this._contourResetting = false;
      }
    }
    formStateRestoreCallback(state) {
      if (!this._internals || state == null) return;
      const values = state instanceof FormData ? Array.from(state.getAll(this.getAttribute("name"))).map(String) : String(state).split(",");
      this._contourResetting = true;
      try {
        this.setAttribute("start", values[0] || "");
        this.setAttribute("end", values[1] || "");
        this._syncFormValue();
      } finally {
        this._contourResetting = false;
      }
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", this.getAttribute("label") || "Keyboard shortcut");
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
  static get formAssociated() { return true; }
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
        // Don't clobber a value the user is typing: only write when the control
        // is not focused and the incoming value differs. The old code set
        // control.value on every render, so a typed date reverted on any
        // attribute change.
        const next = value || "";
        if (document.activeElement !== control && control.value !== next) control.value = next;
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
      // A grid is rows of cells. The rows use `display: contents`, so the visual
      // seven-column layout is untouched while the accessibility tree gets a
      // real row/gridcell structure instead of thirty loose buttons.
      grid.setAttribute("aria-label", title.textContent);
      const rowEl = () => {
        const row = document.createElement("div");
        row.className = "c-date-picker__calendar-row";
        row.setAttribute("role", "row");
        grid.appendChild(row);
        return row;
      };
      let row = rowEl();
      let cells = 0;
      const push = (cell) => {
        if (cells === 7) { row = rowEl(); cells = 0; }
        row.appendChild(cell);
        cells++;
      };
      const weekdays = ["Su","Mo","Tu","We","Th","Fr","Sa"];
      const weekdayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      weekdays.forEach((w, i) => {
        const h = document.createElement("div");
        h.className = "c-date-picker__calendar-weekday";
        h.setAttribute("role", "columnheader");
        h.setAttribute("aria-label", weekdayNames[i]);
        h.textContent = w;
        push(h);
      });
      for (let i = 0; i < startDay; i++) {
        const empty = document.createElement("div");
        empty.className = "c-date-picker__calendar-day c-date-picker__calendar-day--empty";
        empty.setAttribute("role", "gridcell");
        empty.setAttribute("aria-hidden", "true");
        push(empty);
      }
      const selected = input ? input.value : "";
      const inMonth = selected && selected.slice(0, 7) === `${y}-${String(m + 1).padStart(2, "0")}`;
      const stopDay = inMonth ? parseInt(selected.slice(8, 10), 10) || 1 : 1;
      for (let d = 1; d <= daysInMonth; d++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "c-date-picker__calendar-day";
        btn.textContent = String(d);
        btn.setAttribute("role", "gridcell");
        // One tab stop for the month; arrows move within the grid.
        btn.setAttribute("tabindex", d === stopDay ? "0" : "-1");
        // "12" is a number, not a date. The cell's name says the whole date.
        btn.setAttribute("aria-label", new Date(y, m, d).toLocaleDateString(this.getAttribute("locale") || undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
        const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (selected && selected.startsWith(iso)) { btn.classList.add("is-selected"); btn.setAttribute("aria-selected", "true"); }
        btn.addEventListener("click", () => {
          if (input) { input.value = iso; input.dispatchEvent(new Event("change", { bubbles: true })); }
          cal.setAttribute("hidden", "");
          const tgl = this.querySelector(".c-date-picker__calendar-toggle");
          if (tgl) tgl.setAttribute("aria-expanded", "false");
        });
        push(btn);
      }
      cal.appendChild(grid);
      prev.addEventListener("click", () => { this._calMonth = new Date(y, m - 1, 1); this._renderCalendar(); });
      next.addEventListener("click", () => { this._calMonth = new Date(y, m + 1, 1); this._renderCalendar(); });
      if (this._internals) this._syncFormValue();
    }
    _syncFormValue() {
      if (!this._internals) return;
      const start = this.querySelector(".c-date-picker__input");
      const end = this.querySelector(".c-date-picker__end");
      // A range picker submits both ends; a single picker submits its value.
      if (this.hasAttribute("range") && end) {
        this._internals.setFormValue((start ? start.value : "") + "," + end.value);
      } else {
        this._internals.setFormValue(start && start.value ? start.value : null);
      }
      this._syncValidity(this.hasAttribute("required") && !(start && start.value));
    }
    enhance() {
      if (this._wiredDatePicker) return;
      this._wiredDatePicker = true;
      this._syncFormValue();
      this.addEventListener("change", () => { this._syncFormValue(); });
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
      // Grid keyboard: one tab stop enters the month, arrows move between days,
      // Home/End reach the ends of the month and PageUp/PageDown change month.
      // Delegated on the host because `_renderCalendar()` rebuilds the cells.
      this.addEventListener("keydown", (e) => {
        const cal = this.querySelector(".c-date-picker__calendar");
        if (!cal || cal.hasAttribute("hidden")) return;
        const cells = Array.from(cal.querySelectorAll('[role="gridcell"]:not([aria-hidden="true"])'));
        const i = cells.indexOf(document.activeElement);
        if (i < 0) return;
        if (e.key === "PageUp" || e.key === "PageDown") {
          e.preventDefault();
          const btn = this.querySelector(e.key === "PageUp" ? ".c-date-picker__calendar-header button:first-child" : ".c-date-picker__calendar-header button:last-child");
          if (btn) btn.click();
          return;
        }
        let next = -1;
        if (e.key === "ArrowRight") next = i + 1;
        else if (e.key === "ArrowLeft") next = i - 1;
        else if (e.key === "ArrowDown") next = i + 7;
        else if (e.key === "ArrowUp") next = i - 7;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = cells.length - 1;
        else return;
        e.preventDefault();
        if (next < 0 || next >= cells.length) return;
        cells.forEach((cell, j) => cell.setAttribute("tabindex", j === next ? "0" : "-1"));
        cells[next].focus();
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "radiogroup");
      // The group's name is the author's choice; "Rating" is only the fallback.
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Rating");
      const max = parseInt(this.getAttribute("max") || "5", 10) || 5;
      const value = parseInt(this.getAttribute("value") || "0", 10) || 0;
      const color = this.getAttribute("color");
      Array.from(this.querySelectorAll(".c-rating__star")).forEach((n) => n.remove());
      // A radiogroup is one tab stop, arrow keys move within it. The checked
      // star (or the first when nothing is rated) is the one Tab reaches.
      const stop = value >= 1 && value <= max ? value : 1;
      for (let i = 1; i <= max; i++) {
        const star = document.createElement("button");
        star.className = "c-rating__star" + (i <= value ? " c-rating__star--filled" : "");
        star.type = "button";
        star.setAttribute("role", "radio");
        star.setAttribute("aria-checked", String(i === value));
        star.setAttribute("tabindex", String(i === stop ? 0 : -1));
        star.innerHTML = '<span class="c-rating__swatch' + (i <= value ? ' c-rating__swatch--filled' : '') + '" aria-hidden="true"></span>';
        if (color && i <= value) {
          const sw = star.firstChild;
          const safe = safeColor(color);
          if (sw && safe) {
            sw.style.backgroundColor = safe;
            sw.style.borderColor = safe;
          }
        }
        star.dataset.value = String(i);
        star.setAttribute("aria-label", i + " star" + (i > 1 ? "s" : ""));
        this.appendChild(star);
      }
    }
    enhance() {
      if (this._wiredRating) return;
      this._wiredRating = true;
      const stars = () => Array.from(this.querySelectorAll(".c-rating__star"));
      // Selection is one state change: aria-checked, the roving tab stop and the
      // event move together. The old arrow handler moved focus and announced a
      // value without ever updating aria-checked, so AT kept reading star 2.
      const select = (v) => {
        stars().forEach((st) => {
          const on = parseInt(st.dataset.value, 10) === v;
          st.setAttribute("aria-checked", String(on));
          st.setAttribute("tabindex", on ? "0" : "-1");
          st.classList.toggle("c-rating__star--filled", parseInt(st.dataset.value, 10) <= v);
          const sw = st.querySelector(".c-rating__swatch");
          if (sw) sw.classList.toggle("c-rating__swatch--filled", parseInt(st.dataset.value, 10) <= v);
        });
        this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { value: v } }));
      };
      this.addEventListener("click", (e) => {
        const star = e.target && e.target.closest ? e.target.closest(".c-rating__star") : null;
        if (star && this.contains(star)) select(parseInt(star.dataset.value, 10));
      });
      this.addEventListener("keydown", (e) => {
        const all = stars();
        if (!all.length) return;
        navKey(e, all, {
          wrap: false,
          homeEnd: true,
          onNavigate: (i) => { select(parseInt(all[i].dataset.value, 10)); },
          onKey: (key, i) => { if (key === "Enter" || key === " ") select(parseInt(all[i].dataset.value, 10)); },
        });
      });
    }
  }
  define("contour-rating", ContourRating);

/**
 * Time Picker: web component wrapper.
 * Attributes: `value`, `label`, `disabled`, `error`, `help`.
 */
class ContourTimePicker extends ContourBase {
    static get formAssociated() { return true; }
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
      const input = this.ensure(".c-time-picker__input", () => { const el = document.createElement("input"); el.className = "c-input c-time-picker__input"; el.type = "time"; el.setAttribute("aria-label", this.getAttribute("label") || "Time picker"); return el; });
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
      if (this._internals) this._syncFormValue();
    }
    enhance() {
      if (this._wiredTimePicker) return;
      this._wiredTimePicker = true;
      this._syncFormValue();
      this.addEventListener("change", () => { this._syncFormValue(); });
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
    static get formAssociated() { return true; }
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
      if (!input.hasAttribute("aria-label")) input.setAttribute("aria-label", label || "Color");
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
          btn.setAttribute("aria-label", labelText(this, "preset", "Preset") + " " + c);
          wrap.appendChild(btn);
        });
        this.appendChild(wrap);
      }
      // Eyedropper (if supported).
      if (typeof window !== "undefined" && "EyeDropper" in window) {
        const ed = this.ensure(".c-color-picker__eyedropper", () => { const el = document.createElement("button"); el.className = "c-color-picker__eyedropper"; el.type = "button"; el.textContent = labelText(this, "pick", "Pick"); el.setAttribute("aria-label", labelText(this, "pick-color", "Pick color from screen")); return el; });
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
      if (this._internals) this._syncFormValue();
    }
    enhance() {
      if (this._wiredColorPicker) return;
      this._wiredColorPicker = true;
      this._syncFormValue();
      this.addEventListener("change", () => { this._syncFormValue(); });
      this.addEventListener("contour:change", () => { this._syncFormValue(); });
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
    static get formAssociated() { return true; }
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
      if (!input.hasAttribute("aria-label")) input.setAttribute("aria-label", label || "Number");
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
      if (this._internals) this._syncFormValue();
    }
    enhance() {
      if (this._wiredNumberField) return;
      this._wiredNumberField = true;
      this._syncFormValue();
      this.addEventListener("change", () => { this._syncFormValue(); });
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
          const onEnter = () => { showTimer = setTimeout(show, 300); };
          const onLeave = () => { hide(); };
          const onFocus = () => show();
          const onBlur = () => { setTimeout(hide, 100); };
          trigger.addEventListener("mouseenter", onEnter);
          trigger.addEventListener("mouseleave", onLeave);
          trigger.addEventListener("focus", onFocus);
          trigger.addEventListener("blur", onBlur);
          // Remove the trigger listeners too: the old cleanup only cleared the
          // timer, so a removed trigger kept four live handlers.
          onDispose(this, () => {
            if (showTimer) { clearTimeout(showTimer); showTimer = null; }
            trigger.removeEventListener("mouseenter", onEnter);
            trigger.removeEventListener("mouseleave", onLeave);
            trigger.removeEventListener("focus", onFocus);
            trigger.removeEventListener("blur", onBlur);
          });
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
    static get observed() { return ["items", "trigger"]; }
    static get properties() { return { items: { attribute: "items" }, trigger: { attribute: "trigger" } }; }
    render() {
      this.classList.add("c-context-menu");
      if (!this.hasAttribute("role")) this.setAttribute("role", "menu");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Context menu");
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
        } catch (e) { warnBadJson(this, "attribute", e); }
      }
    }
    enhance() {
      if (this._wiredContextMenu) return;
      this._wiredContextMenu = true;
      const openAt = (x, y) => {
        if (typeof this.showPopover === "function") { try { this.showPopover(); } catch (err) {} }
        else this.classList.add("is-open");
        if (Number.isFinite(x) && Number.isFinite(y)) {
          this.style.position = "fixed";
          this.style.left = x + "px";
          this.style.top = y + "px";
        }
      };
      // A context menu is opened by its trigger, not by a right-click on the
      // menu itself (which is empty until opened). `trigger` names the element.
      const triggerSel = this.getAttribute("trigger");
      if (triggerSel) {
        const trigger = document.querySelector(triggerSel);
        if (trigger) {
          if (!trigger.hasAttribute("aria-haspopup")) trigger.setAttribute("aria-haspopup", "menu");
          const onCtx = (e) => { e.preventDefault(); openAt(e.clientX, e.clientY); };
          trigger.addEventListener("contextmenu", onCtx);
          onDispose(this, () => trigger.removeEventListener("contextmenu", onCtx));
        }
      }
      this.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        openAt(e.clientX, e.clientY);
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
        navKey(e, items, { wrap: true, onKey: () => { if (e.key === "Enter" || e.key === " ") document.activeElement.click(); } });
        if (e.key === "Escape") { e.preventDefault(); if (typeof this.hidePopover === "function") { try { this.hidePopover(); } catch (err) {} } this.classList.remove("is-open"); }
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
      if (icon && !this.querySelector("svg")) {
        // Render the icon through the sprite, not as text: an <svg><use> paints
        // the glyph; the old code wrote the icon name into the button.
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("aria-hidden", "true");
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttribute("href", icon.startsWith("#") ? icon : "#" + icon);
        svg.appendChild(use);
        this.appendChild(svg);
      }
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
    static get formAssociated() { return true; }
    static get observed() { return ["label", "accept", "multiple", "progress", "name"]; }
    static get properties() { return { label: { attribute: "label" }, accept: { attribute: "accept" }, multiple: { attribute: "multiple", type: Boolean }, progress: { attribute: "progress" }, name: { attribute: "name" } }; }
    render() {
      this.classList.add("c-file-upload");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", this.getAttribute("label") || "File upload");
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
      if (this._internals) this._syncFormValue();
    }
    enhance() {
      if (this._wiredFileUpload) return;
      this._wiredFileUpload = true;
      this._syncFormValue();
      this.addEventListener("change", () => { this._syncFormValue(); });
      const dz = () => this.querySelector(".c-file-upload__dropzone");
      const input = () => this.querySelector(".c-file-upload__input");
      const activate = () => { const i = input(); if (i) i.click(); };
      this.addEventListener("click", (e) => { const d = dz(); if (e.target === d || (d && d.contains(e.target))) { activate(); } });
      this.addEventListener("keydown", (e) => { const d = dz(); if ((e.target === d || (d && d.contains(e.target))) && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); activate(); } });
      const renderPreview = (files) => {
        const preview = this.querySelector(".c-file-upload__preview");
        if (!preview) return;
        // Revoke the previous object URLs before dropping the <img> nodes, or
        // every re-render leaks a blob.
        this._revokeObjectUrls();
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
            try { const u = URL.createObjectURL(f); img.src = u; (this._objectUrls || (this._objectUrls = [])).push(u); } catch (e) {}
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
      this.addEventListener("drop", (e) => { e.preventDefault(); this.classList.remove("is-dragover"); const i = input(); if (i && e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) { try { i.files = e.dataTransfer.files; } catch (err) { /* some browsers disallow */ } renderPreview(e.dataTransfer.files); this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { files: e.dataTransfer.files } })); } });
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._revokeObjectUrls();
    }
    _revokeObjectUrls() {
      if (!this._objectUrls) return;
      this._objectUrls.forEach((u) => { try { URL.revokeObjectURL(u); } catch (e) {} });
      this._objectUrls = [];
    }
    // Form-value sync override (R16-06): submit the selected File(s) via
    // FormData rather than the input's (useless) path string.
    _syncFormValue() {
      if (!this._internals) return;
      const inp = this.querySelector(".c-file-upload__input");
      if (inp && inp.files && inp.files.length) {
        const fd = new FormData();
        // Use the host's name so the entry matches the control the author
        // declared, not a hard-coded "file" key.
        const key = this.getAttribute("name") || "file";
        Array.from(inp.files).forEach((f) => fd.append(key, f));
        this._internals.setFormValue(fd);
      } else {
        this._internals.setFormValue(null);
      }
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
      this.setAttribute("role", "group");
      const btn = this.ensure(".c-notification-center__trigger", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-notification-center__trigger"; el.type = "button"; el.innerHTML = '<span class="c-notification-center__bullet" aria-hidden="true"></span>'; el.setAttribute("aria-haspopup", "dialog"); el.setAttribute("aria-expanded", "false"); el.setAttribute("aria-label", "Notifications"); return el; });
      const color = this.getAttribute("color");
      const bullet = btn.querySelector(".c-notification-center__bullet");
      if (bullet && color) { bullet.style.background = safeColor(color); bullet.dataset.color = color; }
      const panel = this.ensure(".c-notification-center__panel", () => { const el = document.createElement("div"); el.className = "c-notification-center__panel"; el.hidden = true; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Notifications"); return el; });
      // The panel is a generated node: a re-render (show more, items change)
      // rebuilds it, so the open state lives on the host, not on the node.
      panel.hidden = !this._notifOpen;
      btn.setAttribute("aria-expanded", String(!!this._notifOpen));
      // Slotted content: authored .c-notification-center__item children take
      // precedence over the JSON `items` attribute.
      const authoredItems = Array.from(this.querySelectorAll(":scope > .c-notification-center__item"));
      const items = this.getAttribute("items");
      if (authoredItems.length) {
        panel.innerHTML = "";
        const lb = document.createElement("div");
        lb.setAttribute("role", "listbox");
        lb.setAttribute("aria-label", "Notifications");
        authoredItems.forEach((it) => { lb.appendChild(it); });
        panel.appendChild(lb);
      } else if (items) {
        let parsed = null;
        try { parsed = JSON.parse(items); } catch (e) { warnBadJson(this, "items", e); }
        panel.innerHTML = "";
        if (!Array.isArray(parsed)) {
          // A malformed payload is an error state, not a silent empty panel.
          const err = document.createElement("div");
          err.className = "c-notification-center__error";
          err.setAttribute("role", "alert");
          err.textContent = labelText(this, "error", "Could not load notifications");
          panel.appendChild(err);
        } else {
          const lb = document.createElement("div");
          lb.setAttribute("role", "listbox");
          lb.setAttribute("aria-label", "Notifications");
          // Incremental rendering keeps a long list's DOM bounded: the first
          // window renders, and a control asks for the next (R20 T-17).
          const shown = this._notifShown || 50;
          parsed.slice(0, shown).forEach((it) => {
            const row = document.createElement("div");
            row.className = "c-notification-center__item" + (it && it.read ? " is-read" : "");
            row.setAttribute("tabindex", "-1");
            row.setAttribute("role", "option");
            row.setAttribute("aria-selected", "false");
            row.dataset.read = it && it.read ? "true" : "false";
            const label = document.createElement("span");
            label.className = "c-notification-center__item-label";
            label.textContent = typeof it === "string" ? it : (it.text || it.title || "");
            row.appendChild(label);
            // Archive keeps the notification out of the list without the
            // dismiss semantics; both are reachable by keyboard.
            const archive = document.createElement("button");
            archive.type = "button";
            archive.className = "c-notification-center__archive";
            archive.setAttribute("aria-label", labelText(this, "archive", "Archive notification"));
            archive.textContent = "⤓";
            row.appendChild(archive);
            const dismiss = document.createElement("button");
            dismiss.type = "button";
            dismiss.className = "c-notification-center__dismiss";
            dismiss.setAttribute("aria-label", labelText(this, "dismiss", "Dismiss notification"));
            dismiss.textContent = "×";
            row.appendChild(dismiss);
            lb.appendChild(row);
          });
          // Roving tab stop: the first row is reachable, arrows rove.
          const firstRow = lb.querySelector(".c-notification-center__item");
          if (firstRow) firstRow.tabIndex = 0;
          panel.appendChild(lb);
          if (!parsed.length) {
            const empty = document.createElement("div");
            empty.className = "c-notification-center__empty";
            empty.textContent = labelText(this, "empty", "No notifications");
            panel.appendChild(empty);
          } else if (parsed.length > shown) {
            const more = document.createElement("button");
            more.type = "button";
            more.className = "c-btn c-btn--sm c-notification-center__more";
            more.textContent = labelText(this, "more", "Show more") + " (" + (parsed.length - shown) + ")";
            panel.appendChild(more);
          }
        }
      }
      this._syncNotifBadge();
    }
    // The badge follows the LIVE unread count after read/dismiss/archive;
    // the authored `count` seeds it until the first interaction (R20 T-17).
    _syncNotifBadge() {
      const btn = this.querySelector(".c-notification-center__trigger");
      if (!btn) return;
      const rows = Array.from(this.querySelectorAll(".c-notification-center__item"));
      let unread;
      if (this._notifInteracted || !this.hasAttribute("count")) unread = rows.filter((r) => r.dataset.read !== "true").length;
      else unread = Number(this.getAttribute("count")) || 0;
      let badge = btn.querySelector(".c-notification-center__badge");
      if (unread > 0) {
        if (!badge) { badge = document.createElement("span"); badge.className = "c-notification-center__badge c-badge c-badge--dot"; btn.appendChild(badge); }
        badge.textContent = String(unread);
      } else if (badge) { badge.remove(); }
    }
    enhance() {
      if (this._wiredNotifCenter) return;
      this._wiredNotifCenter = true;
      const activate = (item) => {
        if (item.dataset.read !== "true") {
          item.dataset.read = "true";
          item.classList.add("is-read");
          this._notifInteracted = true;
          this._syncNotifBadge();
          this.dispatchEvent(new CustomEvent("contour:read", { bubbles: true, composed: true, detail: { label: item.querySelector(".c-notification-center__item-label")?.textContent || item.textContent } }));
        }
        for (const r of this.querySelectorAll(".c-notification-center__item")) r.setAttribute("aria-selected", String(r === item));
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { label: item.querySelector(".c-notification-center__item-label")?.textContent || item.textContent } }));
      };
      const removeRow = (item, kind) => {
        const label = item.querySelector(".c-notification-center__item-label")?.textContent || item.textContent;
        item.remove();
        this._notifInteracted = true;
        this._syncNotifBadge();
        this.dispatchEvent(new CustomEvent(kind === "archive" ? "contour:remove" : "contour:dismiss", { bubbles: true, composed: true, detail: { label } }));
      };
      this.addEventListener("click", (e) => {
        const btn = this.querySelector(".c-notification-center__trigger");
        const panel = this.querySelector(".c-notification-center__panel");
        if (btn && (e.target === btn || btn.contains(e.target))) {
          if (panel) { panel.hidden = !panel.hidden; this._notifOpen = !panel.hidden; btn.setAttribute("aria-expanded", String(!panel.hidden)); this.dispatchEvent(new CustomEvent(panel.hidden ? "contour:close" : "contour:open", { bubbles: true, composed: true })); }
          return;
        }
        const more = e.target && e.target.closest ? e.target.closest(".c-notification-center__more") : null;
        if (more && this.contains(more)) {
          this._notifShown = (this._notifShown || 50) + 50;
          this.requestRender();
          return;
        }
        const archive = e.target && e.target.closest ? e.target.closest(".c-notification-center__archive") : null;
        if (archive && this.contains(archive)) {
          const item = archive.closest(".c-notification-center__item");
          if (item) removeRow(item, "archive");
          return;
        }
        const dismiss = e.target && e.target.closest ? e.target.closest(".c-notification-center__dismiss") : null;
        if (dismiss && this.contains(dismiss)) {
          const item = dismiss.closest(".c-notification-center__item");
          if (item) removeRow(item, "dismiss");
          return;
        }
        const item = e.target && e.target.closest ? e.target.closest(".c-notification-center__item") : null;
        if (item && this.contains(item)) activate(item);
      });
      const docClick = (e) => {
        const panel = this.querySelector(".c-notification-center__panel");
        const btn = this.querySelector(".c-notification-center__trigger");
        if (panel && !panel.hidden && !this.contains(e.target)) { panel.hidden = true; this._notifOpen = false; if (btn) btn.setAttribute("aria-expanded", "false"); }
      };
      document.addEventListener("click", docClick);
      onDispose(this, () => document.removeEventListener("click", docClick));
      const keyHandler = (e) => {
        const panel = this.querySelector(".c-notification-center__panel");
        const btn = this.querySelector(".c-notification-center__trigger");
        if (e.key === "Escape" && panel && !panel.hidden) { panel.hidden = true; this._notifOpen = false; if (btn) { btn.setAttribute("aria-expanded", "false"); try { btn.focus(); } catch (err) {} } return; }
        if (!panel || panel.hidden) return;
        const items = Array.from(panel.querySelectorAll(".c-notification-center__item"));
        if (!items.length) return;
        // Enter/Space activate the focused row (a div synthesizes no click);
        // Delete dismisses it. navKey roves the tab stop with the focus.
        if ((e.key === "Enter" || e.key === " ") && items.includes(e.target)) {
          e.preventDefault();
          activate(e.target);
          return;
        }
        if ((e.key === "Delete" || e.key === "Backspace") && items.includes(e.target)) {
          e.preventDefault();
          const idx = items.indexOf(e.target);
          removeRow(e.target, "dismiss");
          const next = items[idx + 1] || items[idx - 1];
          if (next && next.isConnected) { try { next.focus(); } catch (err) {} }
          return;
        }
        navKey(e, items, { wrap: true, onNavigate: (i) => { items.forEach((r, j) => { r.tabIndex = j === i ? 0 : -1; }); } });
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Stepper");
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
      const prev = this.ensure(".c-stepper__prev", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-stepper__prev"; el.type = "button"; return el; });
      // Copy is set on every render, not only at creation: `ensure()` builds the
      // node once, so a `labels` change would otherwise reach nothing.
      prev.textContent = labelText(this, "prev", "Back");
      const next = this.ensure(".c-stepper__next", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-stepper__next"; el.type = "button"; return el; });
      next.textContent = labelText(this, "next", "Next");
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
        if (prev && this.contains(prev)) { go("prev"); return; }
        if (next && this.contains(next)) { go("next"); return; }
        // Click a step to jump to it: the step is a control, not just a label.
        const step = e.target && e.target.closest ? e.target.closest(".c-stepper__step") : null;
        if (step && this.contains(step)) {
          const items = Array.from(this.querySelectorAll(".c-stepper__step"));
          const idx = items.indexOf(step);
          if (idx >= 0 && idx !== Number(this.getAttribute("current") || 0)) {
            this.setAttribute("current", String(idx));
            this.dispatchEvent(new CustomEvent("contour:step-change", { bubbles: true, composed: true, detail: { direction: "jump", index: idx } }));
          }
        }
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
      if (Number.isFinite(h) && h > 0) return h;
      return cssLength("--virtual-list-item-height", 28);
    }
    _autoHeight() {
      return this.getAttribute("item-height") === "auto";
    }
    render() {
      this.classList.add("c-virtual-list");
      this.setAttribute("role", "list");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Virtual list");
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
      return rows.map((r) => horizontal ? (r.getBoundingClientRect().width || this._itemHeight()) : (r.getBoundingClientRect().height || this._itemHeight()));
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
        for (let i = 0; i < total; i++) cumulative.push(cumulative[i] + (heights[i] || this._itemHeight()));
      }
      const visibleCount = autoHeight && !cumulative ? total : (autoHeight ? Math.ceil(viewportSize / this._itemHeight()) + 6 : Math.ceil(viewportSize / ih) + 4);
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
        // A windowed list must publish its position in the whole set, or a
        // screen reader cannot tell "item 3 of 1,000" from "item 3 of 12".
        row.setAttribute("aria-setsize", String(total));
        row.setAttribute("aria-posinset", String(i + 1));
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
        const horizontal = this.getAttribute("orientation") === "horizontal";
        const fwd = horizontal ? "ArrowRight" : "ArrowDown";
        const back = horizontal ? "ArrowLeft" : "ArrowUp";
        const active = document.activeElement;
        const at = rows.indexOf(active);
        const scroller = this.querySelector(".c-virtual-list__scroller");
        const inner = this.querySelector(".c-virtual-list__inner");
        // At the window edge the next item is not rendered: scroll one row and
        // re-render, then move focus, instead of stopping at the last node.
        if ((e.key === fwd && at === rows.length - 1) || (e.key === back && at === 0 && Number(active && active.dataset.index) > 0)) {
          e.preventDefault();
          if (scroller && inner) {
            const delta = (e.key === fwd ? 1 : -1) * this._itemHeight();
            if (horizontal) scroller.scrollLeft += delta; else scroller.scrollTop += delta;
            this._renderWindow(scroller, inner, horizontal ? scroller.scrollLeft : scroller.scrollTop);
            const targetIndex = Number(active && active.dataset.index) + (e.key === fwd ? 1 : -1);
            requestAnimationFrame(() => {
              const next = this.querySelector(`.c-virtual-list__item[data-index="${targetIndex}"]`);
              if (next) { rows.forEach((r) => r.setAttribute("tabindex", "-1")); next.setAttribute("tabindex", "0"); try { next.focus(); } catch (err) {} }
            });
          }
          return;
        }
        navKey(e, rows, { wrap: false, homeEnd: true, onNavigate: (i) => rows.forEach((r, j) => r.setAttribute("tabindex", j === i ? "0" : "-1")), onKey: () => { if (e.key === "Enter" || e.key === " ") { const i = Number(document.activeElement.dataset.index); this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index: i, value: document.activeElement.textContent } })); } } });
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
    attributeChangedCallback(name, oldValue, newValue) {
      super.attributeChangedCallback(name, oldValue, newValue);
      // The open attribute is a first-class input (R20 T-18): setting it opens
      // the palette, removing it closes. It used to be observed but ignored.
      if (name === "open" && this.isConnected && oldValue !== newValue) {
        if (newValue !== null) this.show(); else this.hide();
      }
    }
    _recentsKey() { return "contour-command-palette:" + (this.id || "default") + ":recents"; }
    _recents() {
      try { const r = JSON.parse(localStorage.getItem(this._recentsKey()) || "[]"); return Array.isArray(r) ? r : []; } catch (e) { return []; }
    }
    _remember(label) {
      try {
        const r = this._recents().filter((l) => l !== label);
        r.unshift(label);
        localStorage.setItem(this._recentsKey(), JSON.stringify(r.slice(0, 5)));
      } catch (e) { /* storage is best-effort */ }
    }
    _cmdRow(label, index, recent) {
      const row = document.createElement("div");
      row.className = "c-command-palette__item";
      row.setAttribute("role", "option");
      row.id = this.id + "-opt-" + (recent ? "r" : "") + index;
      row.textContent = label;
      row.dataset.index = String(index);
      row.dataset.label = label;
      if (recent) row.dataset.recent = "true";
      return row;
    }
    render() {
      this.classList.add("c-command-palette");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
      if (!this.hasAttribute("aria-modal")) this.setAttribute("aria-modal", "true");
      if (!this.hasAttribute("popover")) this.setAttribute("popover", "auto");
      if (!this.id) this.id = contourId("cmd-palette");
      const search = this.ensure(".c-command-palette__search", () => { const el = document.createElement("input"); el.className = "c-input c-command-palette__search"; el.type = "search"; el.placeholder = "Search…"; el.setAttribute("aria-label", "Search commands"); el.setAttribute("role", "combobox"); el.setAttribute("aria-autocomplete", "list"); el.setAttribute("aria-expanded", "false"); return el; });
      const list = this.ensure(".c-command-palette__list", () => { const el = document.createElement("div"); el.className = "c-command-palette__list"; el.setAttribute("role", "listbox"); return el; });
      if (!list.id) list.id = this.id + "-list";
      search.setAttribute("aria-controls", list.id);
      let parsed = [];
      const items = this.getAttribute("items");
      if (items) { try { parsed = JSON.parse(items); } catch (e) { warnBadJson(this, "items", e); } }
      if (!Array.isArray(parsed)) parsed = [];
      const labelOf = (it) => typeof it === "string" ? it : (it.label || it.title || "");
      list.innerHTML = "";
      // Recents: the last committed labels, shown while the query is empty.
      const q = (this._cmdQuery || "").toLowerCase().trim();
      const recents = q ? [] : this._recents().filter((l) => parsed.some((it) => labelOf(it) === l));
      if (recents.length) {
        const g = document.createElement("div");
        g.className = "c-command-palette__group";
        g.setAttribute("role", "presentation");
        g.textContent = labelText(this, "recent", "Recent");
        list.appendChild(g);
        recents.forEach((label) => list.appendChild(this._cmdRow(label, parsed.findIndex((it) => labelOf(it) === label), true)));
      }
      // Group headers for items that carry {group}; presentation rows, not
      // options, so the cursor and the filter skip them.
      let lastGroup = null;
      parsed.forEach((it, i) => {
        const g = typeof it === "object" && it !== null ? (it.group || null) : null;
        if (g && g !== lastGroup) {
          const h = document.createElement("div");
          h.className = "c-command-palette__group";
          h.setAttribute("role", "presentation");
          h.textContent = g;
          list.appendChild(h);
          lastGroup = g;
        }
        list.appendChild(this._cmdRow(labelOf(it), i, false));
      });
      // The query survives re-render: the search node is rebuilt, the host
      // remembers what was typed and re-applies the filter.
      if (this._cmdQuery) search.value = this._cmdQuery;
      if (this._cmdFilter) this._cmdFilter(this._cmdQuery || "");
      else if (this._cmdSetActive) this._cmdSetActive(this._cmdCursor || 0);
    }
    show() {
      if (this.classList.contains("is-open") || this.matches(":popover-open")) {
        if (!this.hasAttribute("open")) this.setAttribute("open", "");
        return;
      }
      if (typeof this.showPopover === "function") { try { this.showPopover(); } catch (e) {} }
      this.classList.add("is-open");
      modalContain(this, true);
      const s = this.querySelector(".c-command-palette__search");
      if (s) { s.setAttribute("aria-expanded", "true"); try { s.focus(); } catch (e) {} }
      if (!this.hasAttribute("open")) this.setAttribute("open", "");
    }
    hide() {
      const isOpen = this.classList.contains("is-open") || this.matches(":popover-open");
      if (!isOpen) { if (this.hasAttribute("open")) this.removeAttribute("open"); return; }
      if (typeof this.hidePopover === "function") { try { this.hidePopover(); } catch (e) {} }
      this.classList.remove("is-open");
      modalContain(this, false);
      const s = this.querySelector(".c-command-palette__search");
      if (s) s.setAttribute("aria-expanded", "false");
      if (this.hasAttribute("open")) this.removeAttribute("open");
    }
    toggle() { if (this.classList.contains("is-open") || this.matches(":popover-open")) this.hide(); else this.show(); }
    enhance() {
      // Rows are rebuilt on every render: re-apply the cursor before the
      // one-shot wiring guard.
      if (this._cmdSetActive) this._cmdSetActive(this._cmdCursor || 0);
      if (this._wiredCmdPalette) return;
      this._wiredCmdPalette = true;
      const search = () => this.querySelector(".c-command-palette__search");
      const list = () => this.querySelector(".c-command-palette__list");
      const items = () => Array.from(this.querySelectorAll(".c-command-palette__item"));
      const visibleItems = () => items().filter((it) => !it.hidden);
      // A cursor, not the focus position: the items are not focusable (focus
      // stays in the search field). The cursor is the single source of truth
      // for the active option, and it lives on the host across re-renders.
      const setActive = (idx) => {
        const vis = visibleItems();
        if (!vis.length) { this._cmdCursor = 0; return; }
        this._cmdCursor = Math.max(0, Math.min(idx, vis.length - 1));
        vis.forEach((it, i) => it.classList.toggle("is-active", i === this._cmdCursor));
        const active = vis[this._cmdCursor];
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
        // A group header stays only while it has a visible item before the
        // next header.
        Array.from(list().querySelectorAll(".c-command-palette__group")).forEach((g) => {
          let n = g.nextElementSibling, any = false;
          while (n && !n.classList.contains("c-command-palette__group")) {
            if (!n.hidden && n.classList.contains("c-command-palette__item")) any = true;
            n = n.nextElementSibling;
          }
          g.hidden = !any;
        });
        // No-results is a state, not an empty box.
        let empty = list().querySelector(".c-command-palette__empty");
        const anyVisible = items().some((it) => !it.hidden);
        if (!anyVisible) {
          if (!empty) { empty = document.createElement("div"); empty.className = "c-command-palette__empty"; empty.setAttribute("role", "status"); list().appendChild(empty); }
          empty.textContent = labelText(this, "no-matches", "No matches");
          empty.hidden = false;
        } else if (empty) empty.hidden = true;
        setActive(0);
      };
      const select = (it) => {
        if (!it) return;
        const detail = { index: Number(it.dataset.index), label: it.dataset.label || it.textContent };
        // The return value: the last committed command, readable without
        // listening for the event (R20 T-18).
        this.value = detail;
        this._remember(detail.label);
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail }));
        this.hide();
      };
      this._cmdSetActive = setActive;
      this._cmdFilter = filter;
      // Delegated on the host (rule 12): the search node is rebuilt on every
      // re-render, and node-bound listeners died with it — typing and the
      // arrow keys stopped after any attribute change.
      this.addEventListener("input", (e) => {
        const s = search();
        if (!s || e.target !== s) return;
        this._cmdQuery = s.value;
        filter(s.value);
      });
      this.addEventListener("keydown", (e) => {
        const s = search();
        if (!s || e.target !== s) return;
        const vis = visibleItems();
        if (e.key === "Escape") { e.preventDefault(); this.hide(); return; }
        if (!vis.length) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setActive(this._cmdCursor + 1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActive(this._cmdCursor - 1); }
        else if (e.key === "Home") { e.preventDefault(); setActive(0); }
        else if (e.key === "End") { e.preventDefault(); setActive(vis.length - 1); }
        else if (e.key === "Enter") { e.preventDefault(); select(vis[this._cmdCursor]); }
      });
      this.addEventListener("click", (e) => {
        const it = e.target && e.target.closest ? e.target.closest(".c-command-palette__item") : null;
        if (it && this.contains(it) && !it.hidden) select(it);
      });
      // focus return on close
      let lastFocus = null;
      this.addEventListener("beforetoggle", (e) => {
        if (e.newState === "open") {
          lastFocus = document.activeElement;
          this.dispatchEvent(new CustomEvent("contour:open", { bubbles: true, composed: true }));
        } else if (lastFocus && typeof lastFocus.focus === "function") {
          this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
          try { lastFocus.focus(); } catch (err) {}
        }
      });
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
      // Keep authored children: the component adds the "+N" overflow badge, it
      // does not replace whatever the author put inside.
      const existing = this.querySelector(".c-badge-overflow__more");
      if (existing) existing.remove();
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
    static get observed() { return ["open", "side", "title", "mode", "size"]; }
    static get properties() { return { open: { attribute: "open", type: Boolean }, side: { attribute: "side" }, title: { attribute: "title" }, mode: { attribute: "mode" }, size: { attribute: "size" } }; }
    // Dialog-family parity (R20 T-19/T-32): the open attribute is the state;
    // these methods route through it so the observer below owns the events,
    // containment and focus on every path.
    show() { this.setAttribute("open", ""); }
    // showModal is an action, not a state write (native dialog semantics):
    // it forces the modal path for this opening without touching `mode`.
    showModal() { this._sheetForceModal = true; this.show(); }
    close() { this.removeAttribute("open"); }
    get open() { return this.hasAttribute("open"); }
    set open(v) { if (v) this.show(); else this.close(); }
    _modal() { return this._sheetForceModal || (this.getAttribute("mode") || "modal") !== "non-modal"; }
    render() {
      this.classList.add("c-side-sheet");
      this.setAttribute("role", "dialog");
      // Non-modal mode keeps the background live: no aria-modal, no
      // containment, no focus trap (R20 T-19).
      if (this._modal()) this.setAttribute("aria-modal", "true");
      else this.removeAttribute("aria-modal");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", this.getAttribute("title") || "Side sheet");
      // Strip stale modifiers before projecting the current ones: changing
      // `side` or `size` used to accumulate classes.
      for (const c of Array.from(this.classList)) {
        if (/^c-side-sheet--(start|end|sm|md|lg)$/.test(c)) this.classList.remove(c);
      }
      const side = this.getAttribute("side") === "start" ? "start" : "end";
      this.classList.add("c-side-sheet--" + side);
      const size = this.getAttribute("size");
      if (size === "sm" || size === "md" || size === "lg") this.classList.add("c-side-sheet--" + size);
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
      const keyHandler = (e) => {
        if (e.key === "Escape" && this.hasAttribute("open")) { e.preventDefault(); this.close(); return; }
        // The focus trap is modal-only; a non-modal sheet shares the page.
        if (e.key === "Tab" && this.hasAttribute("open") && this._modal()) {
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
        if (e.target === this) this.close();
      });
      // Focus management: capture focus on open, restore on close. The
      // transition guard (not lastFocus) decides whether a close happened,
      // so a sheet mounted open still reports its close.
      let wasOpen = false;
      const transition = () => {
        const isOpen = this.hasAttribute("open");
        if (isOpen && !wasOpen) {
          wasOpen = true;
          lastFocus = document.activeElement;
          if (this._modal()) modalContain(this, true);
          const first = this.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
          if (first) try { first.focus(); } catch (err) {}
          this.dispatchEvent(new CustomEvent("contour:open", { bubbles: true, composed: true }));
        } else if (!isOpen && wasOpen) {
          wasOpen = false;
          if (this._modal()) modalContain(this, false);
          this._sheetForceModal = false;
          if (lastFocus && typeof lastFocus.focus === "function") try { lastFocus.focus(); } catch (err) {}
          lastFocus = null;
          this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
        }
      };
      const obs = new MutationObserver(transition);
      obs.observe(this, { attributes: true, attributeFilter: ["open"] });
      if (this.hasAttribute("open")) transition();
      onDispose(this, () => { obs.disconnect(); if (this.hasAttribute("open") && this._modal()) modalContain(this, false); });
    }
  }
  define("contour-side-sheet", ContourSideSheet);

/**
 * Tour: a coach-mark walkthrough. Attributes: `steps` (JSON of strings or
 * {text, target}), `current`, `open`, and `persist` (with an `id`) to remember
 * completion in localStorage. The tour advances `current` itself (R20 T-20) —
 * clicks used to emit events only, so without a consumer round-trip the tour
 * never moved. ArrowLeft/Right step, Escape closes (only while open), the tip
 * positions near its step's target, and a step counter names the place.
 * Non-modal by design: the page behind stays live.
 */
class ContourTour extends ContourBase {
    static get observed() { return ["steps", "current", "open", "persist", "id"]; }
    static get properties() { return { steps: { attribute: "steps" }, current: { attribute: "current" }, open: { attribute: "open", type: Boolean }, persist: { attribute: "persist", type: Boolean } }; }
    _steps() {
      let parsed = [];
      try { const s = this.getAttribute("steps"); parsed = s ? JSON.parse(s) : []; } catch (e) { parsed = []; }
      return Array.isArray(parsed) ? parsed : [];
    }
    _current(n) {
      const c = Number(this.getAttribute("current") || 0);
      return Number.isFinite(c) ? Math.min(Math.max(0, c), Math.max(0, n - 1)) : 0;
    }
    _storageKey() { return this.id ? "contour-tour:" + this.id : null; }
    _completed() {
      if (!this.hasAttribute("persist")) return false;
      const key = this._storageKey();
      try { return key ? localStorage.getItem(key) === "done" : false; } catch (e) { return false; }
    }
    _markCompleted() {
      if (!this.hasAttribute("persist")) return;
      const key = this._storageKey();
      try { if (key) localStorage.setItem(key, "done"); } catch (e) { /* storage is best-effort */ }
    }
    show() { this.setAttribute("open", ""); }
    close() {
      if (!this.hasAttribute("open")) return;
      this.removeAttribute("open");
      this._markCompleted();
      this.dispatchEvent(new CustomEvent("contour:close", { bubbles: true, composed: true }));
    }
    render() {
      this.classList.add("c-tour");
      this.setAttribute("role", "dialog");
      // No aria-modal: a tour is a coach mark, not a modal. It points at a
      // target in the page (step.target), so the page behind it stays
      // scrollable, clickable and focusable, and assistive tech must not be
      // told the rest of the document is inert.
      this.setAttribute("aria-label", labelText(this, "tour", "Tour"));
      const parsed = this._steps();
      // First render normalizes the open state: a tour with steps starts open
      // unless persistence says it was completed. After that, `open` is the
      // single source of truth (close removes it; nothing re-normalizes).
      if (!this._tourInitialized) {
        this._tourInitialized = true;
        if (parsed.length && !this.hasAttribute("open") && !this._completed()) this.setAttribute("open", "");
      }
      const isOpen = this.hasAttribute("open") && parsed.length > 0;
      if (isOpen) this.removeAttribute("hidden"); else this.setAttribute("hidden", "");
      const current = this._current(parsed.length);
      const step = parsed[current] || {};
      const counter = this.ensure(".c-tour__step", () => { const el = document.createElement("div"); el.className = "c-tour__step"; return el; });
      counter.textContent = labelText(this, "step", "Step") + " " + (current + 1) + " / " + parsed.length;
      const tip = this.ensure(".c-tour__tip", () => { const el = document.createElement("div"); el.className = "c-tour__tip"; return el; });
      tip.textContent = typeof step === "string" ? step : (step.text || step.title || "");
      if (counter.nextSibling !== tip) this.insertBefore(counter, tip);
      const nav = this.ensure(".c-tour__nav", () => { const el = document.createElement("div"); el.className = "c-tour__nav c-btn-group"; return el; });
      const back = this.ensure(".c-tour__back", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-tour__back"; el.type = "button"; return el; }, nav);
      back.textContent = labelText(this, "back", "Back");
      back.disabled = current === 0;
      const next = this.ensure(".c-tour__next", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-tour__next"; el.type = "button"; return el; }, nav);
      next.textContent = current >= parsed.length - 1 ? labelText(this, "done", "Done") : labelText(this, "next", "Next");
      const close = this.ensure(".c-tour__close", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-tour__close"; el.type = "button"; return el; }, nav);
      close.textContent = labelText(this, "close", "Close");
      // Keep the controls in order regardless of which were just created.
      if (nav.firstChild !== back) nav.insertBefore(back, nav.firstChild);
      if (back.nextSibling !== next) nav.insertBefore(next, back.nextSibling);
      if (next.nextSibling !== close) nav.insertBefore(close, next.nextSibling);
      // Target highlight: a step may name the element it points at, so the
      // reader sees what the tip is about instead of a floating box.
      if (this._tourTarget && this._tourTarget.classList) this._tourTarget.classList.remove("c-tour__target");
      this._tourTarget = null;
      const targetSel = isOpen && typeof step === "object" && step ? step.target : null;
      if (targetSel) {
        const target = document.querySelector(targetSel);
        if (target && target.classList) { target.classList.add("c-tour__target"); this._tourTarget = target; }
      }
      if (isOpen) this._positionTour();
    }
    _positionTour() {
      // Near the target when there is one (below, or above when there is no
      // room), clamped to the viewport; otherwise bottom-center. The host is
      // position:fixed with no inset in the sheet, so without this it sat at
      // its static position.
      const vw = window.innerWidth, vh = window.innerHeight;
      const w = this.offsetWidth || 280, h = this.offsetHeight || 120;
      const target = this._tourTarget;
      if (target && target.getBoundingClientRect) {
        const r = target.getBoundingClientRect();
        let top = r.bottom + 8;
        if (top + h > vh - 8) top = Math.max(8, r.top - h - 8);
        const left = Math.min(Math.max(8, r.left), Math.max(8, vw - w - 8));
        this.style.insetBlockStart = top + "px";
        this.style.insetInlineStart = left + "px";
        this.style.insetBlockEnd = "auto";
        this.style.transform = "";
      } else {
        this.style.insetBlockStart = "auto";
        this.style.insetBlockEnd = "1rem";
        this.style.insetInlineStart = "50%";
        this.style.transform = "translateX(-50%)";
      }
    }
    enhance() {
      if (this._wiredTour) return;
      this._wiredTour = true;
      // A tour is a coach mark, not a modal, so it must not take the page with
      // it: no modalContain, no focus steal (the guide went offline when both
      // happened on upgrade). Stepping writes `current` back — the event is
      // for consumers, not the mechanism.
      const step = (dir) => {
        const parsed = this._steps();
        if (!parsed.length || !this.hasAttribute("open")) return;
        const cur = this._current(parsed.length);
        if (dir === "next") {
          if (cur >= parsed.length - 1) { this.close(); return; }
          this.setAttribute("current", String(cur + 1));
          this.dispatchEvent(new CustomEvent("contour:step-change", { bubbles: true, composed: true, detail: { direction: "next", index: cur + 1 } }));
        } else {
          if (cur === 0) return;
          this.setAttribute("current", String(cur - 1));
          this.dispatchEvent(new CustomEvent("contour:step-change", { bubbles: true, composed: true, detail: { direction: "prev", index: cur - 1 } }));
        }
      };
      this._tourStep = step;
      this.addEventListener("click", (e) => {
        const t = e.target && e.target.closest ? e.target : null;
        if (!t) return;
        if (t.closest(".c-tour__next")) { step("next"); return; }
        if (t.closest(".c-tour__back")) { step("prev"); return; }
        if (t.closest(".c-tour__close")) this.close();
      });
      const keyHandler = (e) => {
        if (!this.hasAttribute("open")) return;
        const tag = e.target && e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if (e.key === "Escape") { e.preventDefault(); this.close(); }
        else if (e.key === "ArrowRight") { e.preventDefault(); step("next"); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); step("prev"); }
      };
      document.addEventListener("keydown", keyHandler);
      const reposition = () => { if (this.hasAttribute("open")) this._positionTour(); };
      window.addEventListener("scroll", reposition, { passive: true, capture: true });
      window.addEventListener("resize", reposition, { passive: true });
      onDispose(this, () => {
        document.removeEventListener("keydown", keyHandler);
        window.removeEventListener("scroll", reposition, { capture: true });
        window.removeEventListener("resize", reposition);
        if (this._tourTarget && this._tourTarget.classList) this._tourTarget.classList.remove("c-tour__target");
      });
    }
  }
  define("contour-tour", ContourTour);

/**
 * Tags Input: web component wrapper.
 * Attributes: `value`, `placeholder`, `disabled`, `error`, `help`.
 */
class ContourTagsInput extends ContourBase {
    static get formAssociated() { return true; }
    static get observed() { return ["value", "placeholder", "disabled", "error", "help", "required", "max"]; }
    static get properties() { return { value: { attribute: "value" }, placeholder: { attribute: "placeholder" }, disabled: { attribute: "disabled", type: Boolean }, error: { attribute: "error" }, help: { attribute: "help" }, required: { attribute: "required", type: Boolean }, max: { attribute: "max" } }; }
    render() {
      this.classList.add("c-tags-input");
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Tags input");
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
      if (this._internals) this._syncFormValue();
    }
    enhance() {
      if (this._wiredTagsInput) return;
      this._wiredTagsInput = true;
      this._syncFormValue();
      this.addEventListener("contour:add", () => { this._syncFormValue(); });
      this.addEventListener("contour:remove", () => { this._syncFormValue(); });
      // The live region is a generated node: a re-render drops it, so look
      // it up (and recreate it) per announcement — rule 12.
      const announce = (msg) => {
        let live = this.querySelector(".c-tags-input__live");
        if (!live) {
          live = document.createElement("span");
          live.className = "c-tags-input__live visually-hidden";
          live.setAttribute("aria-live", "polite");
          live.setAttribute("aria-atomic", "true");
          this.appendChild(live);
        }
        live.textContent = msg;
      };
      const readTags = () => {
        const raw = this.getAttribute("value") || "";
        let tags = [];
        try { tags = JSON.parse(raw); } catch (err) { tags = raw.split(",").map((s) => s.trim()).filter(Boolean); }
        return Array.isArray(tags) ? tags.map(String) : [];
      };
      // One add path for Enter, comma and paste (R20 T-21): dedupe and the
      // `max` limit are announced, not silent.
      const addMany = (candidates) => {
        if (this.hasAttribute("disabled")) return;
        const tags = readTags();
        const max = Number(this.getAttribute("max"));
        const added = [], dups = [];
        let limitHit = false;
        for (const raw of candidates) {
          const v = String(raw).trim();
          if (!v) continue;
          if (tags.includes(v)) { dups.push(v); continue; }
          if (Number.isFinite(max) && max > 0 && tags.length >= max) { limitHit = true; break; }
          tags.push(v);
          added.push(v);
        }
        if (added.length) {
          this.setAttribute("value", JSON.stringify(tags));
          for (const v of added) this.dispatchEvent(new CustomEvent("contour:add", { bubbles: true, composed: true, detail: { value: v } }));
        }
        // One composed announcement AFTER the writeback re-render, so the
        // limit/duplicate feedback is not overwritten by the "Added" line.
        const parts = [];
        if (added.length) parts.push("Added " + added.join(", "));
        if (dups.length) parts.push(dups.join(", ") + " already added");
        if (limitHit) parts.push("Tag limit reached (" + max + ")");
        if (parts.length) announce(parts.join(". "));
      };
      this.addEventListener("keydown", (e) => {
        const input = this.querySelector(".c-tags-input__input");
        if (!input || this.hasAttribute("disabled")) return;
        if (e.key === "Enter" && e.target === input) {
          e.preventDefault();
          // Clear BEFORE addMany: its attribute write re-renders, and a
          // clear afterwards would land on the detached node while the base
          // restore resurrects the committed text in the new one.
          const v = input.value;
          input.value = "";
          addMany([v]);
        } else if (e.key === "Backspace" && e.target === input && input.value === "") {
          const tags = readTags();
          if (tags.length) {
            const removed = tags.pop();
            this.setAttribute("value", JSON.stringify(tags));
            announce("Removed " + removed);
            this.dispatchEvent(new CustomEvent("contour:remove", { bubbles: true, composed: true, detail: { value: removed } }));
          }
        }
      });
      // A typed comma commits the segment before it, the way tag fields do.
      this.addEventListener("input", (e) => {
        const input = this.querySelector(".c-tags-input__input");
        if (!input || e.target !== input || this.hasAttribute("disabled")) return;
        if (input.value.includes(",")) {
          const parts = input.value.split(",");
          input.value = parts.pop();
          addMany(parts);
        }
      });
      // Paste splits on commas, semicolons and newlines into separate tags.
      this.addEventListener("paste", (e) => {
        const input = this.querySelector(".c-tags-input__input");
        if (!input || e.target !== input || this.hasAttribute("disabled")) return;
        const text = e.clipboardData && e.clipboardData.getData("text/plain");
        if (text && /[,;\n]/.test(text)) {
          e.preventDefault();
          addMany(text.split(/[,;\n]+/));
        }
      });
      this.addEventListener("click", (e) => {
        const rm = e.target && e.target.closest ? e.target.closest(".c-tags-input__remove") : null;
        // The remove buttons used to work while the host was disabled.
        if (rm && this.contains(rm) && !this.hasAttribute("disabled")) {
          const val = rm.dataset.value;
          const next = readTags().filter((t) => t !== val);
          this.setAttribute("value", JSON.stringify(next));
          announce("Removed " + val);
          this.dispatchEvent(new CustomEvent("contour:remove", { bubbles: true, composed: true, detail: { value: val } }));
        }
      });
    }
    // Form-value sync override (R16-06): tags are stored as a JSON array on the
    // host, not in the inner input, so the base class's generic sync would read
    // the empty add-tag input. Submit the host's value instead. Required means
    // at least one TAG — "[]" is a present attribute but an empty answer.
    _syncFormValue() {
      if (!this._internals) return;
      this._internals.setFormValue(this.getAttribute("value") || "[]");
      let count = 0;
      try { const p = JSON.parse(this.getAttribute("value") || "[]"); count = Array.isArray(p) ? p.length : 0; } catch (err) { count = (this.getAttribute("value") || "").split(",").filter((s) => s.trim()).length; }
      this._syncValidity(this.hasAttribute("required") && count === 0);
    }
  }
  define("contour-tags-input", ContourTagsInput);

/**
 * Sortable List: a reorderable list. Attributes: `items` (JSON, the authored
 * data) and `order` (JSON array of source indices — the user's permutation,
 * written back on every move so a re-render never reverts it, R20 T-22).
 * Drag with the pointer, or focus a handle and use ArrowUp/Down/Home/End;
 * moves announce position and emit contour:move + contour:reorder.
 * Update mode is scaffold: the list rebuilds on render (the old "keyed"
 * claim was false — render cleared innerHTML).
 */
class ContourSortableList extends ContourBase {
    static get observed() { return ["items", "order"]; }
    static get properties() { return { items: { attribute: "items" }, order: { attribute: "order" } }; }
    render() {
      this.classList.add("c-sortable-list");
      const list = this.ensure(".c-sortable-list__list", () => { const el = document.createElement("ul"); el.className = "c-sortable-list__list"; return el; });
      const items = this.getAttribute("items");
      let parsed = [];
      try { parsed = items ? JSON.parse(items) : []; } catch (e) { parsed = []; }
      if (!Array.isArray(parsed)) parsed = [];
      // Apply the user's permutation when it still fits the data; a changed
      // items payload with a stale order falls back to the authored sequence.
      let sourceOrder = Array.from({ length: parsed.length }, (_, i) => i);
      const orderRaw = this.getAttribute("order");
      if (orderRaw) {
        try {
          const order = JSON.parse(orderRaw);
          if (Array.isArray(order) && order.length === parsed.length && order.every((i) => Number.isInteger(i) && i >= 0 && i < parsed.length)) {
            sourceOrder = order.slice();
            parsed = order.map((i) => parsed[i]);
          }
        } catch (e) { /* a malformed order is ignored, not fatal */ }
      }
      this._sortableSourceOrder = sourceOrder;
      this._sortableItems = parsed;
      list.innerHTML = "";
      parsed.forEach((it, i) => {
        const li = document.createElement("li");
        li.className = "c-sortable-list__item";
        li.setAttribute("draggable", "true");
        li.dataset.index = String(i);
        const itemLabel = typeof it === "string" ? it : (it.label || it.text || "");
        const handle = document.createElement("span");
        handle.className = "c-sortable-list__handle";
        handle.textContent = "⋮⋮";
        handle.setAttribute("role", "button");
        // "⋮⋮" is the glyph, not a name. A screen reader hears the glyph as
        // punctuation unless the handle says what it moves.
        handle.setAttribute("aria-label", labelText(this, "reorder", "Reorder") + " " + (itemLabel || String(i + 1)));
        // The writeback re-render rebuilds the list; the preserve key puts
        // focus back on the handle that moved, not the one at its old index.
        handle.setAttribute("data-contour-preserve-key", itemLabel || String(i));
        handle.tabIndex = 0;
        li.appendChild(handle);
        const labelEl = document.createElement("span");
        labelEl.className = "c-sortable-list__label";
        labelEl.textContent = itemLabel;
        li.appendChild(labelEl);
        list.appendChild(li);
      });
    }
    enhance() {
      if (this._wiredSortableList) return;
      this._wiredSortableList = true;
      const list = () => this.querySelector(".c-sortable-list__list");
      // Live region for position announcements. Generated node: the writeback
      // re-render drops it, so look it up (and recreate it) per call — rule 12.
      const announce = (msg) => {
        let live = this.querySelector(".c-sortable-list__live");
        if (!live) {
          live = document.createElement("span");
          live.className = "c-sortable-list__live visually-hidden";
          live.setAttribute("aria-live", "polite");
          live.setAttribute("aria-atomic", "true");
          this.appendChild(live);
        }
        live.textContent = msg;
      };
      const index = (li) => Array.from(list().children).indexOf(li);
      // Persist the permutation (R20 T-22): the DOM move alone was reverted
      // by the next attribute-triggered re-render. `order` maps display
      // positions back to source indices; `items` stays the authored data.
      const writeBack = (from, to) => {
        const n = (this._sortableItems || []).length;
        const cur = Array.isArray(this._sortableSourceOrder) && this._sortableSourceOrder.length === n
          ? this._sortableSourceOrder.slice()
          : Array.from({ length: n }, (_, i) => i);
        const [src] = cur.splice(from, 1);
        cur.splice(to, 0, src);
        this.setAttribute("order", JSON.stringify(cur));
      };
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
          const from = dragFrom;
          writeBack(from, to);
          this.dispatchEvent(new CustomEvent("contour:reorder", { bubbles: true, composed: true, detail: { from, to } }));
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
        const moved = (direction, to) => {
          const label = li.querySelector(".c-sortable-list__label");
          announce((label ? label.textContent : "Item") + " moved to position " + (to + 1));
          writeBack(from, to);
          this.dispatchEvent(new CustomEvent("contour:move", { bubbles: true, composed: true, detail: { direction, from, to } }));
          this.dispatchEvent(new CustomEvent("contour:reorder", { bubbles: true, composed: true, detail: { from, to } }));
        };
        if (e.key === "ArrowUp" && li.previousElementSibling) {
          e.preventDefault();
          l.insertBefore(li, li.previousElementSibling);
          moved("up", index(li));
        } else if (e.key === "ArrowDown" && li.nextElementSibling) {
          e.preventDefault();
          l.insertBefore(li.nextElementSibling, li);
          moved("down", index(li));
        } else if (e.key === "Home" && from > 0) {
          e.preventDefault();
          l.insertBefore(li, l.firstElementChild);
          moved("up", 0);
        } else if (e.key === "End" && from < l.children.length - 1) {
          e.preventDefault();
          l.appendChild(li);
          moved("down", l.children.length - 1);
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      // role=button on a span is not focusable by itself. Without a tab stop the
      // swatch is mouse-only; a keyboard user cannot reach the picker at all.
      if (this.getAttribute("role") === "button" && !this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", this.getAttribute("label") || this.getAttribute("color") || "Swatch");
      const color = this.getAttribute("color") || "#000";
      this.style.setProperty("--swatch-color", color);
      if (this.hasAttribute("selected")) this.classList.add("is-selected");
      else this.classList.remove("is-selected");
      if (!this.hasAttribute("aria-label")) {
        const label = this.getAttribute("label") || color;
        this.setAttribute("aria-label", label);
      }
      if (!this.querySelector("button") && !this.querySelector("span")) {
        const span = document.createElement("span");
        span.className = "c-swatch__btn";
        span.setAttribute("aria-hidden", "true");
        this.appendChild(span);
      }
    }
    enhance() {
      if (this._wiredSwatch) return;
      this._wiredSwatch = true;
      this.addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { value: this.getAttribute("color") } }));
      });
      // A role=button must answer Enter and Space as well as the pointer.
      this.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { value: this.getAttribute("color") } }));
      });
    }
  }
  define("contour-swatch", ContourSwatch);

/**
 * Calendar: a month grid with keyboard navigation and optional range
 * selection (R20 T-23). Attributes: `value` (ISO date), `month` (0-11),
 * `year`, and `range` with `start`/`end`. Dates are local ISO date strings —
 * deliberately timezone-free; a consumer who needs instants converts at its
 * own boundary. One tab stop roves the grid: arrows move by day/week and
 * cross month boundaries, PageUp/PageDown change month (Shift: year),
 * Home/End jump to the month's first/last day. Weekday columnheaders name
 * the columns. In range mode the first click sets start, the second sets
 * end (ordered), and contour:select carries { value, range: [start, end] }.
 */
class ContourCalendar extends ContourBase {
    static get observed() { return ["value", "month", "year", "range", "start", "end"]; }
    static get properties() { return { value: { attribute: "value" }, month: { attribute: "month" }, year: { attribute: "year" }, range: { attribute: "range", type: Boolean }, start: { attribute: "start" }, end: { attribute: "end" } }; }
    // month="0" is January, not "unset": the old `Number(attr) || fallback`
    // made January unreachable unless the current month happened to be it.
    _attrNum(name, fallback) {
      const raw = this.getAttribute(name);
      const n = Number(raw);
      return raw !== null && Number.isFinite(n) ? n : fallback;
    }
    _ym() {
      const now = new Date();
      return { year: this._attrNum("year", now.getFullYear()), month: this._attrNum("month", now.getMonth()) };
    }
    render() {
      this.classList.add("c-calendar");
      const now = new Date();
      const { year, month } = this._ym();
      const header = this.ensure(".c-calendar__header", () => { const el = document.createElement("div"); el.className = "c-calendar__header"; return el; });
      header.innerHTML = "";
      const navBtn = (cls, glyph, label) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "c-btn c-btn--sm " + cls; b.textContent = glyph; b.setAttribute("aria-label", label);
        return b;
      };
      const prevYear = navBtn("c-calendar__prev-year", "«", "Previous year");
      const prev = navBtn("c-calendar__prev", "‹", "Previous month");
      const title = document.createElement("span");
      title.className = "c-calendar__title";
      title.textContent = new Date(year, month, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
      const next = navBtn("c-calendar__next", "›", "Next month");
      const nextYear = navBtn("c-calendar__next-year", "»", "Next year");
      header.append(prevYear, prev, title, next, nextYear);
      const grid = this.ensure(".c-calendar__grid", () => { const el = document.createElement("div"); el.className = "c-calendar__grid"; el.setAttribute("role", "grid"); return el; });
      grid.setAttribute("aria-label", title.textContent);
      grid.innerHTML = "";
      const first = new Date(year, month, 1);
      const startDay = first.getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const isRange = this.hasAttribute("range");
      const selected = this.getAttribute("value");
      const rStart = this.getAttribute("start");
      const rEnd = this.getAttribute("end");
      let row = null;
      let col = 0;
      const newRow = () => { row = document.createElement("div"); row.className = "c-calendar__row"; row.setAttribute("role", "row"); grid.appendChild(row); col = 0; };
      // Weekday columnheaders: the grid's columns had no names.
      const wdFmt = new Intl.DateTimeFormat(undefined, { weekday: "short" });
      newRow();
      for (let i = 0; i < 7; i++) {
        const wd = document.createElement("div");
        wd.className = "c-calendar__weekday";
        wd.setAttribute("role", "columnheader");
        wd.textContent = wdFmt.format(new Date(2023, 0, 1 + i)); // 2023-01-01 was a Sunday
        row.appendChild(wd);
      }
      newRow();
      for (let i = 0; i < startDay; i++) {
        const empty = document.createElement("div");
        empty.className = "c-calendar__day c-calendar__day--empty";
        row.appendChild(empty);
        col++;
        if (col === 7) newRow();
      }
      const todayIso = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
      // One tab stop: the selected day, else today, else the first of the month.
      const focusIso = (selected && selected.startsWith(year + "-" + String(month + 1).padStart(2, "0"))) ? selected
        : (todayIso.startsWith(year + "-" + String(month + 1).padStart(2, "0")) ? todayIso : year + "-" + String(month + 1).padStart(2, "0") + "-01");
      for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement("button");
        cell.className = "c-calendar__day";
        cell.type = "button";
        cell.setAttribute("role", "gridcell");
        cell.textContent = String(d);
        const iso = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
        const isSelected = isRange ? (iso === rStart || iso === rEnd) : iso === selected;
        if (isSelected) cell.classList.add("is-selected");
        if (isRange && rStart && rEnd && iso > rStart && iso < rEnd) cell.classList.add("is-in-range");
        cell.setAttribute("aria-selected", String(isSelected));
        if (iso === todayIso) cell.setAttribute("aria-current", "date");
        cell.setAttribute("tabindex", iso === focusIso ? "0" : "-1");
        cell.dataset.value = iso;
        row.appendChild(cell);
        col++;
        if (col === 7) newRow();
      }
      if (header.parentNode !== this) this.insertBefore(header, grid);
    }
    enhance() {
      if (this._wiredCalendar) return;
      this._wiredCalendar = true;
      const navigate = (m, y) => {
        this.batch(() => {
          this.setAttribute("month", String(m));
          this.setAttribute("year", String(y));
        });
        this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { month: m, year: y } }));
      };
      const focusIso = (iso) => {
        const cell = this.querySelector('.c-calendar__day[data-value="' + iso + '"]');
        if (cell) { try { cell.focus(); } catch (err) {} }
      };
      // Roving tab stop follows focus wherever it lands (click or keyboard).
      this.addEventListener("focusin", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-calendar__day:not(.c-calendar__day--empty)") : null;
        if (!cell || !this.contains(cell)) return;
        for (const c of this.querySelectorAll(".c-calendar__day")) c.tabIndex = -1;
        cell.tabIndex = 0;
      });
      this.addEventListener("click", (e) => {
        const t = e.target && e.target.closest ? e.target : null;
        if (!t) return;
        const { year, month } = this._ym();
        if (t.closest(".c-calendar__prev")) { const d = new Date(year, month - 1, 1); navigate(d.getMonth(), d.getFullYear()); return; }
        if (t.closest(".c-calendar__next")) { const d = new Date(year, month + 1, 1); navigate(d.getMonth(), d.getFullYear()); return; }
        if (t.closest(".c-calendar__prev-year")) { navigate(month, year - 1); return; }
        if (t.closest(".c-calendar__next-year")) { navigate(month, year + 1); return; }
        const cell = t.closest(".c-calendar__day");
        if (cell && this.contains(cell) && cell.dataset.value) {
          const iso = cell.dataset.value;
          if (this.hasAttribute("range")) {
            const start = this.getAttribute("start");
            const end = this.getAttribute("end");
            let s, en;
            if (!start || (start && end)) { s = iso; en = null; }
            else { s = iso < start ? iso : start; en = iso < start ? start : iso; }
            this.batch(() => {
              this.setAttribute("start", s);
              if (en === null) this.removeAttribute("end"); else this.setAttribute("end", en);
            });
            this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { value: iso, range: en ? [s, en] : [s] } }));
          } else {
            this.setAttribute("value", iso);
            this.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { value: iso } }));
          }
        }
      });
      this.addEventListener("keydown", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-calendar__day:not(.c-calendar__day--empty)") : null;
        if (!cell || !this.contains(cell) || !cell.dataset.value) return;
        const [y, m, d] = cell.dataset.value.split("-").map(Number);
        const cur = new Date(y, m - 1, d);
        const { year, month } = this._ym();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const isoOf = (dt) => dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
        let target = null;
        if (e.key === "ArrowRight") target = new Date(y, m - 1, d + 1);
        else if (e.key === "ArrowLeft") target = new Date(y, m - 1, d - 1);
        else if (e.key === "ArrowDown") target = new Date(y, m - 1, d + 7);
        else if (e.key === "ArrowUp") target = new Date(y, m - 1, d - 7);
        else if (e.key === "PageUp") target = e.shiftKey ? new Date(y - 1, m - 1, Math.min(d, new Date(y - 1, m, 0).getDate())) : new Date(y, m - 2, Math.min(d, new Date(y, m - 1, 0).getDate()));
        else if (e.key === "PageDown") target = e.shiftKey ? new Date(y + 1, m - 1, Math.min(d, new Date(y + 1, m, 0).getDate())) : new Date(y, m, Math.min(d, new Date(y, m + 1, 0).getDate()));
        else if (e.key === "Home") target = new Date(year, month, 1);
        else if (e.key === "End") target = new Date(year, month, daysInMonth);
        else return; // Enter/Space are the native button's own click
        e.preventDefault();
        const iso = isoOf(target);
        if (target.getFullYear() === year && target.getMonth() === month) {
          focusIso(iso);
        } else {
          // Cross the month boundary, then land on the target day.
          navigate(target.getMonth(), target.getFullYear());
          focusIso(iso);
        }
      });
    }
  }
  define("contour-calendar", ContourCalendar);

/**
 * Carousel: slides with prev/next, dots, swipe and arrow keys. Attributes:
 * `items`, `index`, `autoplay` (milliseconds per slide) and `paused`.
 * Autoplay ships with a pause/play control and never starts under
 * prefers-reduced-motion (WCAG 2.2.2, R20 T-24); the timer reconciles with
 * the attributes on every render and dies with the host.
 */
class ContourCarousel extends ContourBase {
    static get observed() { return ["items", "index", "autoplay", "paused"]; }
    static get properties() { return { items: { attribute: "items" }, index: { attribute: "index" }, autoplay: { attribute: "autoplay" }, paused: { attribute: "paused", type: Boolean } }; }
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
      // Indicators: one dot per slide, so a reader can jump directly and see
      // where they are without reading the status text.
      const dots = this.ensure(".c-carousel__dots", () => { const el = document.createElement("div"); el.className = "c-carousel__dots"; el.setAttribute("role", "tablist"); el.setAttribute("aria-label", "Slides"); return el; });
      dots.innerHTML = "";
      items.forEach((it, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "c-carousel__dot" + (i === idx ? " is-active" : "");
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", "Go to slide " + (i + 1));
        dot.setAttribute("aria-selected", i === idx ? "true" : "false");
        dot.dataset.index = String(i);
        dots.appendChild(dot);
      });
      // Autoplay ships with its own pause control (WCAG 2.2.2): moving
      // content that starts automatically must be pausable by a control on
      // the page, and this one is on the component itself.
      const autoplay = Number(this.getAttribute("autoplay"));
      if (Number.isFinite(autoplay) && autoplay > 0) {
        const paused = this.hasAttribute("paused") || this._reducedMotion();
        const pp = this.ensure(".c-carousel__pause", () => { const el = document.createElement("button"); el.className = "c-btn c-btn--sm c-carousel__pause"; el.type = "button"; return el; });
        pp.textContent = paused ? "▶" : "⏸";
        pp.setAttribute("aria-label", paused ? "Play slides automatically" : "Pause automatic slides");
        pp.setAttribute("aria-pressed", String(paused));
      } else {
        const pp = this.querySelector(".c-carousel__pause");
        if (pp) pp.remove();
      }
    }
    _reducedMotion() {
      try { return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
    }
    enhance() {
      // Autoplay reconciles with the attributes on every render: `paused`,
      // a removed `autoplay`, or reduced motion stops the timer; the next
      // render under the right conditions starts it again.
      const autoplay = Number(this.getAttribute("autoplay"));
      const want = Number.isFinite(autoplay) && autoplay > 0 && !this.hasAttribute("paused") && !this._reducedMotion() && this._items().length > 1;
      if (want && !this._carouselTimer) {
        this._carouselTimer = setInterval(() => {
          const items = this._items();
          if (!items.length) return;
          const idx = (this._index() + 1) % items.length;
          this.setAttribute("index", String(idx));
          this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { index: idx, direction: "next" } }));
        }, Math.max(500, autoplay));
      } else if (!want && this._carouselTimer) {
        clearInterval(this._carouselTimer);
        this._carouselTimer = null;
      }
      if (this._wiredCarousel) return;
      this._wiredCarousel = true;
      onDispose(this, () => { if (this._carouselTimer) { clearInterval(this._carouselTimer); this._carouselTimer = null; } });
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
        const pp = e.target && e.target.closest ? e.target.closest(".c-carousel__pause") : null;
        if (pp && this.contains(pp)) {
          // Reduced motion keeps the carousel static; the control cannot
          // start motion the reader asked not to see.
          if (this._reducedMotion()) return;
          const nowPaused = !this.hasAttribute("paused");
          this.toggleAttribute("paused", nowPaused);
          this.dispatchEvent(new CustomEvent(nowPaused ? "contour:pause" : "contour:play", { bubbles: true, composed: true }));
          return;
        }
        const prev = e.target && e.target.closest ? e.target.closest(".c-carousel__prev") : null;
        const next = e.target && e.target.closest ? e.target.closest(".c-carousel__next") : null;
        if (prev && this.contains(prev)) { go("prev"); return; }
        if (next && this.contains(next)) { go("next"); return; }
        const dot = e.target && e.target.closest ? e.target.closest(".c-carousel__dot") : null;
        if (dot && this.contains(dot)) {
          const i = Number(dot.dataset.index);
          if (Number.isFinite(i) && i !== this._index()) {
            this.setAttribute("index", String(i));
            this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { index: i, direction: "jump" } }));
          }
        }
      });
      // Swipe: a horizontal drag past the threshold advances one slide.
      let startX = null;
      this.addEventListener("pointerdown", (e) => { startX = e.clientX; });
      this.addEventListener("pointerup", (e) => {
        if (startX === null) return;
        const dx = e.clientX - startX;
        startX = null;
        if (Math.abs(dx) > 40) { if (dx < 0) go("next"); else go("prev"); }
      });
      this.addEventListener("pointercancel", () => { startX = null; });
      this.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); go("prev"); }
        else if (e.key === "ArrowRight") { e.preventDefault(); go("next"); }
        // index is observed: the attribute write re-renders through the base
        // lifecycle (snapshot/restore/focus). The old direct this.render()
        // bypassed it and dropped focus.
        else if (e.key === "Home") { e.preventDefault(); this.setAttribute("index", "0"); this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { index: 0, direction: "home" } })); }
        else if (e.key === "End") { e.preventDefault(); const last = this._items().length - 1; if (last >= 0) { this.setAttribute("index", String(last)); this.dispatchEvent(new CustomEvent("contour:change", { bubbles: true, composed: true, detail: { index: last, direction: "end" } })); } }
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
  static get observed() { return ["columns", "rows", "page", "filter", "page-size", "resizable", "virtual", "row-height", "loading", "error", "empty"]; }
  static get properties() { return { columns: { attribute: "columns" }, rows: { attribute: "rows" }, page: { attribute: "page" }, filter: { attribute: "filter" }, "page-size": { attribute: "page-size" }, resizable: { attribute: "resizable", type: Boolean }, virtual: { attribute: "virtual", type: Boolean }, "row-height": { attribute: "row-height" }, loading: { attribute: "loading" }, error: { attribute: "error" }, empty: { attribute: "empty" } }; }
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
      if (!wrap) { wrap = document.createElement("div"); wrap.className = "c-table-wrap c-data-grid__wrap"; }
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
            td.setAttribute("tabindex", "-1");
            td.textContent = r && r[key] != null ? r[key] : "";
            if (!String(td.textContent).trim()) td.setAttribute("aria-label", "Empty");
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
      }
      // Wrap in a scroll container for virtualization of large datasets.
      let wrap = this.querySelector(".c-data-grid__wrap");
      if (!wrap) { wrap = document.createElement("div"); wrap.className = "c-table-wrap c-data-grid__wrap"; }
      if (table.parentNode !== wrap) wrap.appendChild(table);
      if (wrap.parentNode !== this) this.appendChild(wrap);
      // One tab stop per grid: cells are -1 and the arrow keys move a roving
      // tabindex, so a 1,000-row grid is not 1,000 tab stops.
      if (!table.querySelector('[tabindex="0"]')) {
        const first = table.querySelector("tbody td, thead th");
        if (first) first.setAttribute("tabindex", "0");
      }
    }
    _rowHeight() {
      const h = Number(this.getAttribute("row-height"));
      if (Number.isFinite(h) && h > 0) return h;
      if (this._measuredRowHeight > 0) return this._measuredRowHeight;
      return cssLength("--data-grid-row-height", 32);
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
          td.setAttribute("tabindex", "-1");
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
      // The window re-renders rows, so the single tab stop has to be re-seeded
      // here too, or a scroll would leave the grid with no tabbable cell.
      if (!tbody.querySelector('[tabindex="0"]')) {
        const first = tbody.querySelector("tr[data-index] td");
        if (first) first.setAttribute("tabindex", "0");
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
        if (target) {
          e.preventDefault();
          // Move the single tab stop with the focus.
          table.querySelectorAll('[tabindex="0"]').forEach((c) => c.setAttribute("tabindex", "-1"));
          target.setAttribute("tabindex", "0");
          try { target.focus(); } catch (err) {}
        }
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
          // Sort the full filtered dataset, not just the rendered page: a page
          // slice sorted on its own leaves the other pages in the wrong order.
          const table = this.querySelector(".c-data-grid__table");
          const tbody = table && table.querySelector("tbody");
          const thead = table && table.querySelector("thead");
          const cols = this._dgCols || [];
          const key = cols[idx] ? (typeof cols[idx] === "string" ? cols[idx] : (cols[idx].key || cols[idx].label || "")) : String(idx);
          const full = (this._dgFilteredRows || []).slice();
          full.sort((a, b) => {
            const va = a && a[key] != null ? a[key] : "";
            const vb = b && b[key] != null ? b[key] : "";
            const na = Number(va), nb = Number(vb);
            const cmp = (!isNaN(na) && !isNaN(nb)) ? na - nb : String(va).localeCompare(String(vb));
            return sortDir === "asc" ? cmp : -cmp;
          });
          this._dgFilteredRows = full;
          if (tbody) {
            const page = Number(this.getAttribute("page") || 1);
            const pageSize = Number(this.getAttribute("page-size") || 0);
            let pageRows = full;
            if (pageSize > 0) { const start = (page - 1) * pageSize; pageRows = full.slice(start, start + pageSize); }
            tbody.innerHTML = "";
            pageRows.forEach((r) => {
              const tr = document.createElement("tr");
              cols.forEach((c) => {
                const k = typeof c === "string" ? c : (c.key || c.label || "");
                const td = document.createElement("td");
                td.setAttribute("role", "gridcell");
                td.setAttribute("tabindex", "-1");
                td.textContent = r && r[k] != null ? r[k] : "";
                tr.appendChild(td);
              });
              tbody.appendChild(tr);
            });
          }
          // Update aria-sort on headers.
          if (thead) Array.from(thead.querySelectorAll("th")).forEach((h, i) => {
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
    static get observed() { return ["items", "expanded", "loading", "error", "empty"]; }
    static get properties() { return { items: { attribute: "items" }, expanded: { attribute: "expanded" }, loading: { attribute: "loading" }, error: { attribute: "error" }, empty: { attribute: "empty" } }; }
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
      // Wrap the table in the same scroller the reflow gate requires, so a
      // tree grid is not a bare .c-table that stretches the page.
      let wrap = this.querySelector(".c-tree-grid__wrap");
      if (!wrap) { wrap = document.createElement("div"); wrap.className = "c-table-wrap c-tree-grid__wrap"; }
      if (table.parentNode !== wrap) wrap.appendChild(table);
      if (wrap.parentNode !== this) this.appendChild(wrap);
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
      if (!this.hasAttribute("role")) this.setAttribute("role", "region");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", labelText(this, "label", "Pull to refresh"));
      const ind = this.ensure(".c-pull-to-refresh__indicator", () => {
        const e = document.createElement("div");
        e.className = "c-pull-to-refresh__indicator";
        return e;
      });
      ind.innerHTML = "";
      const label = document.createElement("span");
      label.className = "c-pull-to-refresh__label";
      label.setAttribute("aria-live", "polite");
      label.textContent = this._ptrError
        ? this._ptrError
        : (this._ptrRefreshing ? labelText(this, "refreshing", "Refreshing…") : labelText(this, "label", "Pull to refresh"));
      ind.appendChild(label);
      // A keyboard-reachable refresh alternative: the gesture is pointer-only,
      // and a control the reader can press must exist anyway (R20 T-25).
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "c-pull-to-refresh__btn";
      btn.textContent = labelText(this, "refresh", "Refresh");
      ind.appendChild(btn);
      if (ind.parentNode !== this) this.prepend(ind);
      this.classList.toggle("is-refreshing", !!this._ptrRefreshing);
      this.classList.toggle("has-error", !!this._ptrError);
      this.setAttribute("aria-busy", String(!!this._ptrRefreshing));
    }
    // Completion is consumer-driven (R20 T-25): the old fixed 800 ms timeout
    // faked it. The consumer calls complete() when its fetch settles, or
    // fail(message) to surface the error; both clear the pull offset.
    complete() {
      this._ptrRefreshing = false;
      this._ptrError = null;
      this.style.removeProperty("--ptr-offset");
      this.requestRender();
    }
    fail(message) {
      this._ptrRefreshing = false;
      this._ptrError = String(message || labelText(this, "error", "Refresh failed"));
      this.style.removeProperty("--ptr-offset");
      this.requestRender();
      this.dispatchEvent(new CustomEvent("contour:error", { bubbles: true, composed: true, detail: { message: this._ptrError } }));
    }
    _refresh() {
      if (this._ptrRefreshing) return;
      this._ptrRefreshing = true;
      this._ptrError = null;
      this.style.removeProperty("--ptr-offset");
      this.requestRender();
      this.dispatchEvent(new CustomEvent("contour:refresh", { bubbles: true, composed: true }));
    }
    enhance() {
      if (this._wiredPullToRefresh) return;
      this._wiredPullToRefresh = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-pull-to-refresh__btn") : null;
        if (btn && this.contains(btn)) this._refresh();
      });
      // Pointer events cover touch AND mouse; the gesture had been touch-only.
      let startY = 0;
      let pulling = false;
      let offset = 0;
      this.addEventListener("pointerdown", (e) => {
        if (this._ptrRefreshing || this.scrollTop > 0) return;
        if (e.target && e.target.closest && e.target.closest(".c-pull-to-refresh__btn")) return;
        startY = e.clientY;
        pulling = true;
        offset = 0;
        try { this.setPointerCapture(e.pointerId); } catch (err) {}
      });
      this.addEventListener("pointermove", (e) => {
        if (!pulling) return;
        const dy = e.clientY - startY;
        if (dy > 0) {
          offset = Math.min(120, dy * 0.6);
          this.style.setProperty("--ptr-offset", offset + "px");
        }
      });
      const end = () => {
        if (!pulling) return;
        pulling = false;
        const thr = Number(this.getAttribute("threshold")) || 60;
        if (offset >= thr) this._refresh();
        else this.style.removeProperty("--ptr-offset");
        offset = 0;
      };
      this.addEventListener("pointerup", end);
      this.addEventListener("pointercancel", end);
    }
  }
  define("contour-pull-to-refresh", ContourPullToRefresh);
