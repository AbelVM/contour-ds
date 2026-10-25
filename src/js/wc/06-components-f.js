  // ---- Additional simple components with attribute scaffolding ----

  // Avatar: generates initials from name attribute.
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

  // Badge: generates text from label attribute.
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

  // Chip: generates key + value from attributes.
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

  // Tag: generates text + remove button.
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

  // Dot: generates from variant attribute.
  class ContourDot extends ContourBase {
    render() {
      this.classList.add("c-dot");
      const variant = this.getAttribute("variant");
      if (variant) this.classList.add("c-dot--" + variant);
      if (this.hasAttribute("live")) this.classList.add("c-dot--live");
    }
  }
  define("contour-dot", ContourDot);

  // Pill: generates text from label attribute.
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

  // Kbd: generates key text.
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

  // Spinner: simple class wrapper.
  class ContourSpinner extends ContourBase {
    render() {
      this.classList.add("c-spinner");
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Loading");
    }
  }
  define("contour-spinner", ContourSpinner);

  // Skeleton: simple class wrapper.
  class ContourSkeleton extends ContourBase {
    render() {
      this.classList.add("c-skeleton");
    }
  }
  define("contour-skeleton", ContourSkeleton);

  // Breadcrumb & pagination: generates nav from items.
  class ContourBreadcrumb extends ContourBase {
    render() {
      this.classList.add("c-breadcrumb");
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const nav = this.ensure("nav", () => { const el = document.createElement("nav"); el.setAttribute("aria-label", "Breadcrumb"); return el; });
          nav.setAttribute("aria-label", "Breadcrumb");
          const ol = nav.querySelector("ol") || (() => { const el = document.createElement("ol"); nav.appendChild(el); return el; })();
          ol.innerHTML = "";
          parsed.forEach((item, i) => {
            const li = document.createElement("li");
            if (i < parsed.length - 1) {
              const a = document.createElement("a");
              a.href = item.href || "#";
              a.textContent = item.label || item;
              li.appendChild(a);
            } else {
              li.textContent = item.label || item;
              li.setAttribute("aria-current", "page");
            }
            ol.appendChild(li);
          });
        } catch (e) { /* keep existing */ }
      } else {
        const nav = this.querySelector("nav");
        if (nav) nav.remove();
      }
    }
  }
  define("contour-breadcrumb", ContourBreadcrumb);

  // Pagination: generates page links.
  class ContourPagination extends ContourBase {
    render() {
      this.classList.add("c-pagination");
      const pages = this.getAttribute("pages");
      const current = parseInt(this.getAttribute("current") || "1", 10);
      if (pages) {
        const count = parseInt(pages, 10);
        for (let i = 1; i <= count; i++) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "c-pagination__link";
          btn.textContent = String(i);
          if (i === current) {
            btn.setAttribute("aria-current", "page");
            btn.classList.add("c-pagination__current");
          }
          this.appendChild(btn);
        }
      }
    }
    enhance() {
      if (this._wiredPagination) return;
      this._wiredPagination = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-pagination__link") : null;
        if (!btn || !this.contains(btn)) return;
        const page = parseInt(btn.textContent, 10);
        // Update active state in place rather than setAttribute("current"), which
        // would re-enter the render that owns this list.
        this.querySelectorAll(".c-pagination__link").forEach((b) => {
          const active = parseInt(b.textContent, 10) === page;
          b.classList.toggle("c-pagination__current", active);
          if (active) b.setAttribute("aria-current", "page");
          else b.removeAttribute("aria-current");
        });
        this.dispatchEvent(new CustomEvent("contour:page", { detail: { page }, bubbles: true }));
      });
    }
  }
  define("contour-pagination", ContourPagination);

  // Drawer: ensures proper role.
  class ContourDrawer extends ContourBase {
    render() {
      this.classList.add("c-drawer");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
    }
  }
  define("contour-drawer", ContourDrawer);

  // Sheet: ensures proper role.
  class ContourSheet extends ContourBase {
    render() {
      this.classList.add("c-sheet");
      if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
    }
  }
  define("contour-sheet", ContourSheet);

  // Tooltip: generates text from label attribute.
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

  // Toast: generates message.
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

  // Progress: generates from value attribute.
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

  // Range: generates from attributes.
  class ContourRange extends ContourBase {
    render() {
      this.classList.add("c-range");
      if (!this.querySelector("input")) {
        const input = document.createElement("input");
        input.type = "range";
        input.min = this.getAttribute("min") || "0";
        input.max = this.getAttribute("max") || "100";
        input.value = this.getAttribute("value") || "50";
        this.appendChild(input);
      }
    }
  }
  define("contour-range", ContourRange);

  // Switch: generates from label attribute.
  class ContourSwitch extends ContourBase {
    render() {
      this.classList.add("c-switch");
      const label = this.getAttribute("label");
      if (label) {
        const lbl = document.createElement("span");
        lbl.className = "c-switch__label";
        lbl.textContent = label;
        this.appendChild(lbl);
      }
    }
  }
  define("contour-switch", ContourSwitch);

  // Check: generates from label attribute.
  class ContourCheck extends ContourBase {
    render() {
      this.classList.add("c-check");
      const label = this.getAttribute("label");
      if (label) {
        const lbl = document.createElement("label");
        lbl.className = "c-check__label";
        lbl.textContent = label;
        this.appendChild(lbl);
      }
    }
  }
  define("contour-check", ContourCheck);

  // Radio: generates from label attribute.
  class ContourRadio extends ContourBase {
    render() {
      this.classList.add("c-radio");
      const label = this.getAttribute("label");
      if (label) {
        const lbl = document.createElement("label");
        lbl.className = "c-radio__label";
        lbl.textContent = label;
        this.appendChild(lbl);
      }
    }
  }
  define("contour-radio", ContourRadio);

  // Select: generates from options attribute.
  class ContourSelect extends ContourBase {
    render() {
      this.classList.add("c-select");
      const options = this.getAttribute("options");
      if (options) {
        try {
          const parsed = JSON.parse(options);
          const select = this.ensure("select.c-select", () => { const el = document.createElement("select"); el.className = "c-select"; return el; });
          select.innerHTML = "";
          parsed.forEach((opt) => {
            const option = document.createElement("option");
            option.value = typeof opt === "string" ? opt : opt.value;
            option.textContent = typeof opt === "string" ? opt : opt.label;
            select.appendChild(option);
          });
          if (select.parentNode !== this) this.appendChild(select);
          this.classList.remove("c-select");
          select.classList.add("c-select");
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-select", ContourSelect);

  // Version: a native select styled as a version picker.
  class ContourVersion extends ContourBase {
    render() {
      this.classList.add("c-version");
      const options = this.getAttribute("options");
      if (options) {
        try {
          const parsed = JSON.parse(options);
          const select = this.ensure("select.c-version", () => { const el = document.createElement("select"); el.className = "c-version"; return el; });
          select.innerHTML = "";
          parsed.forEach((opt) => {
            const option = document.createElement("option");
            if (typeof opt === "string") { option.value = opt; option.textContent = opt; }
            else { option.value = opt.value || opt.label; option.textContent = opt.label || opt.value; if (opt.selected) option.selected = true; }
            select.appendChild(option);
          });
          if (select.parentNode !== this) this.appendChild(select);
          this.classList.remove("c-version");
          select.classList.add("c-version");
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-version", ContourVersion);

  // Textarea: generates from placeholder attribute.
  class ContourTextarea extends ContourBase {
    render() {
      this.classList.add("c-textarea");
      if (!this.querySelector("textarea")) {
        const ta = document.createElement("textarea");
        ta.className = "c-textarea";
        ta.placeholder = this.getAttribute("placeholder") || "";
        this.appendChild(ta);
      }
    }
  }
  define("contour-textarea", ContourTextarea);

  // Input: generates from placeholder attribute.
  class ContourInputFull extends ContourBase {
    render() {
      this.classList.add("c-input");
      if (!this.querySelector("input")) {
        const input = document.createElement("input");
        input.className = "c-input";
        input.type = this.getAttribute("type") || "text";
        input.placeholder = this.getAttribute("placeholder") || "";
        this.appendChild(input);
      }
    }
  }
  define("contour-input", ContourInputFull);

  // Link: generates from href and label.
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

  // Mark: generates from variant.
  class ContourMark extends ContourBase {
    render() {
      this.classList.add("c-mark");
    }
  }
  define("contour-mark", ContourMark);

  // Brand: generates from name and tag.
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

  // Section head: generates from title and desc.
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

  // Empty state: already defined above.

  // Loading: generates spinner.
  class ContourLoading extends ContourBase {
    render() {
      this.classList.add("c-loading");
      this.ensure(".c-spinner", () => { const el = document.createElement("span"); el.className = "c-spinner"; return el; });
    }
  }
  define("contour-loading", ContourLoading);

  // Elevation: simple class wrapper.
  class ContourElevation extends ContourBase {
    render() {
      this.classList.add("c-elevation");
    }
  }
  define("contour-elevation", ContourElevation);

  // Diff: generates from before/after attributes.
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

  // Do/Don't: generates from do/dont attributes.
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

  // Steps: already defined above.

  // FAQ: already defined above.

  // Callout: already defined above.


