import { ContourBase, define } from './core.mjs';
class ContourAvatar extends ContourBase {
    render() {
      this.classList.add("c-avatar");
      const name = this.getAttribute("name");
      const size = this.getAttribute("size");
      if (size) this.classList.add("c-avatar--" + size);
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-avatar--" + variant);
      if (name) {
        const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
        // Only set if no authored content
        if (!this.textContent.trim()) this.textContent = initials;
      }
    }
  }
  define("contour-avatar", ContourAvatar);
class ContourBadgeFull extends ContourBase {
    render() {
      this.classList.add("c-badge");
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-badge--" + variant);
      const label = this.getAttribute("label");
      if (label) {
        if (!this.textContent.trim()) this.textContent = label;
      }
    }
  }
  define("contour-badge", ContourBadgeFull);
class ContourChipFull extends ContourBase {
    render() {
      this.classList.add("c-chip");
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
    render() {
      this.classList.add("c-tag");
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
      if (this._wiredTag) return;
      this._wiredTag = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-tag__remove") : null;
        if (!btn || !this.contains(btn)) return;
        this.dispatchEvent(new CustomEvent("contour:remove", { detail: { label: this.getAttribute("label") || this.textContent.trim() }, bubbles: true }));
        if (this.parentNode) this.parentNode.removeChild(this);
      });
    }
  }
  define("contour-tag", ContourTag);
class ContourDot extends ContourBase {
    render() {
      this.classList.add("c-dot");
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-dot--" + variant);
      if (this.hasAttribute("live")) this.classList.add("c-dot--live");
    }
  }
  define("contour-dot", ContourDot);
class ContourPill extends ContourBase {
    render() {
      this.classList.add("c-pill");
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-pill--" + variant);
      const label = this.getAttribute("label");
      if (label) {
        if (!this.textContent.trim()) this.textContent = label;
      }
      if (this.hasAttribute("live")) this.classList.add("c-pill--live");
    }
  }
  define("contour-pill", ContourPill);
class ContourKbd extends ContourBase {
    render() {
      this.classList.add("c-kbd");
      const key = this.getAttribute("key");
      if (key) {
        if (!this.textContent.trim()) this.textContent = key;
      }
    }
  }
  define("contour-kbd", ContourKbd);
class ContourSpinner extends ContourBase {
    render() {
      this.classList.add("c-spinner");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Loading");
    }
  }
  define("contour-spinner", ContourSpinner);
class ContourSkeleton extends ContourBase {
    render() {
      this.classList.add("c-skeleton");
    }
  }
  define("contour-skeleton", ContourSkeleton);
class ContourTooltip extends ContourBase {
    render() {
      this.classList.add("c-tooltip");
      const text = this.getAttribute("text");
      if (text && !this.querySelector("*") && !this.textContent.trim()) {
        this.textContent = text;
      }
    }
  }
  define("contour-tooltip", ContourTooltip);
class ContourProgress extends ContourBase {
    render() {
      this.classList.add("c-progress");
      const value = this.getAttribute("value");
      if (value) {
        this.style.setProperty("--progress", value + "%");
      }
      if (!this.hasAttribute("role")) this.setAttribute("role", "progressbar");
      const prevVal = this._progressAriaValue;
      if (!this.hasAttribute("aria-valuenow") || this.getAttribute("aria-valuenow") === prevVal) {
        this.setAttribute("aria-valuenow", value || "0");
        this._progressAriaValue = value || "0";
      }
      if (!this.hasAttribute("aria-valuemin")) this.setAttribute("aria-valuemin", "0");
      if (!this.hasAttribute("aria-valuemax")) this.setAttribute("aria-valuemax", "100");
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
      this.classList.add("c-elevation");
    }
  }
  define("contour-elevation", ContourElevation);
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
class ContourDatamark extends ContourBase {
    render() {
      this.classList.add("c-datamark");
      const label = this.getAttribute("label");
      if (label && !this.querySelector("*") && !this.textContent.trim()) this.textContent = label;
    }
  }
  define("contour-datamark", ContourDatamark);
class ContourDestructiveHint extends ContourBase {
    render() {
      this.classList.add("c-destructive-hint");
      const text = this.getAttribute("text");
      if (text && !this.querySelector("*") && !this.textContent.trim()) this.textContent = text;
    }
  }
  define("contour-destructive-hint", ContourDestructiveHint);
class ContourIconBadge extends ContourBase {
    render() {
      this.classList.add("c-icon-badge");
      const icon = this.getAttribute("icon");
      if (icon) {
        const existing = this.querySelector("svg");
        const svg = existing || document.createElementNS("http://www.w3.org/2000/svg", "svg");
        if (!existing) {
          svg.setAttribute("aria-hidden", "true");
          const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
          use.setAttribute("href", "#" + String(icon).replace(/[^a-zA-Z0-9_-]/g, ""));
          svg.appendChild(use);
          this.appendChild(svg);
        } else {
          const use = svg.querySelector("use");
          if (use) use.setAttribute("href", "#" + String(icon).replace(/[^a-zA-Z0-9_-]/g, ""));
        }
      } else {
        const svg = this.querySelector("svg");
        if (svg) svg.remove();
      }
    }
  }
  define("contour-icon-badge", ContourIconBadge);
class ContourLiveBadge extends ContourBase {
    render() {
      this.classList.add("c-live-badge");
      if (this.hasAttribute("live")) this.classList.add("c-live-badge--live");
      const label = this.getAttribute("label");
      if (label && !this.querySelector("*") && !this.textContent.trim()) this.textContent = label;
    }
  }
  define("contour-live-badge", ContourLiveBadge);
