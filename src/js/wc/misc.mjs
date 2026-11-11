class ContourResizeObserver extends ContourBase {
    static get observed() { return ["debounce"]; }
    static get properties() { return { debounce: { attribute: "debounce" } }; }
    render() {
      this.classList.add("c-resize-observer");
      this.setAttribute("aria-hidden", "true");
    }
    enhance() {
      if (this._wiredResizeObserver) return;
      this._wiredResizeObserver = true;
      if (typeof ResizeObserver !== "function") return;
      const debounce = parseInt(this.getAttribute("debounce") || "0", 10) || 0;
      let timer = null;
      const ro = new ResizeObserver((entries) => {
        const fire = () => {
          const e = entries[entries.length - 1];
          const cr = e && e.contentRect ? e.contentRect : this.getBoundingClientRect();
          this.dispatchEvent(new CustomEvent("contour:resize", { bubbles: true, composed: true, detail: { width: cr.width, height: cr.height } }));
        };
        if (debounce > 0) { clearTimeout(timer); timer = setTimeout(fire, debounce); }
        else fire();
      });
      ro.observe(this);
      onDispose(this, () => { ro.disconnect(); clearTimeout(timer); });
    }
  }
  define("contour-resize-observer", ContourResizeObserver);
import { ContourBase, define, onDispose, navKey } from './core.mjs';
import { loadRemote, remoteData, remoteRefresh, renderStates, renderEmpty, wireStates } from './states.mjs';
class ContourReservedFull extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-reserved");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-reserved__title", () => { const el = document.createElement("div"); el.className = "c-reserved__title"; return el; });
        t.textContent = title;
      }
    }
  }
  define("contour-reserved", ContourReservedFull);
class ContourThemeScopeFull extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-theme-scope");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-theme-scope__title", () => { const el = document.createElement("div"); el.className = "c-theme-scope__title"; el.style.padding = "var(--space-sm)"; el.style.fontWeight = "var(--weight-semibold)"; return el; });
        t.textContent = title;
      }
    }
  }
  define("contour-theme-scope", ContourThemeScopeFull);
class ContourActivity extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-activity");
      this.setAttribute("role", "list");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "activity")) return;
      const items = remoteData(this, "items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          Array.from(this.querySelectorAll(".c-activity__item")).forEach((n) => n.remove());
          parsed.forEach((it, i) => {
            const item = document.createElement("div");
            item.className = "c-activity__item";
            item.setAttribute("role", "button");
            item.setAttribute("tabindex", "-1");
            const dot = document.createElement("span");
            dot.className = "c-activity__dot c-activity__dot--" + (it.variant || "primary");
            dot.setAttribute("aria-hidden", "true");
            item.appendChild(dot);
            const text = document.createElement("span");
            text.className = "c-activity__text";
            text.textContent = typeof it === "string" ? it : (it.text || it.label || "");
            if (!item.hasAttribute("aria-label")) item.setAttribute("aria-label", text.textContent);
            item.appendChild(text);
            if (it.time) {
              const time = document.createElement("span");
              time.className = "c-activity__time";
              time.textContent = it.time;
              item.appendChild(time);
            }
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      } else {
        renderEmpty(this, "activity");
      }
    }
    enhance() {
      if (this._wiredActivity) return;
      this._wiredActivity = true;
      this.addEventListener("click", (e) => {
        const item = e.target && e.target.closest ? e.target.closest(".c-activity__item") : null;
        if (item && this.contains(item)) {
          const items = Array.from(this.querySelectorAll(".c-activity__item"));
          const index = items.indexOf(item);
          const text = item.querySelector(".c-activity__text")?.textContent || "";
          this.dispatchEvent(new CustomEvent("contour:activity-select", { bubbles: true, composed: true, detail: { index, text } }));
        }
      });
      this.addEventListener("keydown", (e) => {
        const items = Array.from(this.querySelectorAll(".c-activity__item"));
        if (!items.length) return;
        navKey(e, items, { wrap: false, homeEnd: true, onNavigate: (i) => { items.forEach((it, j) => it.tabIndex = j === i ? 0 : -1); }, onKey: () => { if (e.key === "Enter" || e.key === " ") { const idx = items.indexOf(document.activeElement); this.dispatchEvent(new CustomEvent("contour:activity-select", { bubbles: true, composed: true, detail: { index: idx, text: document.activeElement.querySelector(".c-activity__text")?.textContent || "" } })); } } });
      });
    }
  }
  define("contour-activity", ContourActivity);
class ContourActivityFeed extends ContourBase {
    static get observed() { return ["items", "filter", "unread-only", "empty", "loading", "error"]; }
    static get properties() { return { items: { attribute: "items" }, filter: { attribute: "filter" }, "unread-only": { attribute: "unread-only", type: Boolean } }; }
    render() {
      this.classList.add("c-activity-feed");
      this.setAttribute("role", "region");
      this.setAttribute("aria-label", "Activity feed");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "activity-feed")) return;
      const items = remoteData(this, "items");
      const filter = this.getAttribute("filter");
      const unreadOnly = this.hasAttribute("unread-only");
      let header = this.querySelector(".c-activity-feed__header");
      if (!header) { header = document.createElement("div"); header.className = "c-activity-feed__header"; this.insertBefore(header, this.firstChild); }
      let title = header.querySelector(".c-activity-feed__title");
      if (!title) { title = document.createElement("div"); title.className = "c-activity-feed__title"; header.appendChild(title); }
      title.textContent = "Activity feed";
      let toolbar = this.querySelector(".c-activity-feed__toolbar");
      if (!toolbar) { toolbar = document.createElement("div"); toolbar.className = "c-activity-feed__toolbar"; this.appendChild(toolbar); }
      const clear = toolbar.querySelector(".c-activity-feed__clear") || (() => { const b = document.createElement("button"); b.type = "button"; b.className = "c-btn c-btn--ghost c-btn--sm"; b.textContent = "Clear all"; toolbar.appendChild(b); return b; })();
      const unreadBtn = toolbar.querySelector(".c-activity-feed__unread") || (() => { const b = document.createElement("button"); b.type = "button"; b.className = "c-btn c-btn--ghost c-btn--sm"; b.textContent = "Unread only"; toolbar.appendChild(b); return b; })();
      if (unreadOnly) unreadBtn.setAttribute("aria-pressed", "true");
      let list = this.querySelector(".c-activity-feed__list");
      if (!list) { list = document.createElement("div"); list.className = "c-activity-feed__list"; this.appendChild(list); }
      if (items) {
        try {
          const parsed = JSON.parse(items);
          let filtered = parsed;
          if (filter) filtered = filtered.filter((it) => String(it.severity || it.type || "").toLowerCase() === filter.toLowerCase());
          if (unreadOnly) filtered = filtered.filter((it) => !it.read);
          Array.from(list.querySelectorAll(".c-activity-feed__item")).forEach((n) => n.remove());
          if (filtered.length === 0) {
            let empty = list.querySelector(".c-activity-feed__empty");
            if (!empty) { empty = document.createElement("div"); empty.className = "c-activity-feed__empty"; empty.textContent = "No activity"; list.appendChild(empty); }
          } else {
            const empty = list.querySelector(".c-activity-feed__empty");
            if (empty) empty.remove();
            filtered.forEach((it) => {
              const item = document.createElement("div");
              item.className = "c-activity-feed__item" + (it.read ? "" : " c-activity-feed__item--unread");
              item.setAttribute("role", "button");
              item.setAttribute("tabindex", "-1");
              const dot = document.createElement("span");
              dot.className = "c-activity-feed__dot c-activity-feed__dot--" + (it.severity || "info");
              dot.setAttribute("aria-hidden", "true");
              item.appendChild(dot);
              const text = document.createElement("span");
              text.className = "c-activity-feed__text";
              text.textContent = typeof it === "string" ? it : (it.text || it.label || "");
              item.appendChild(text);
              const time = document.createElement("span");
              time.className = "c-activity-feed__time";
              time.textContent = it.time || "";
              item.appendChild(time);
              const sev = document.createElement("span");
              sev.className = "c-activity-feed__severity";
              sev.textContent = it.severity || "";
              item.appendChild(sev);
              list.appendChild(item);
            });
          }
        } catch (e) { /* keep existing */ }
      }
    }
    enhance() {
      if (this._wiredActivityFeed) return;
      this._wiredActivityFeed = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest("button") : null;
        if (!btn || !this.contains(btn)) return;
        if (btn.textContent === "Clear all") {
          this.dispatchEvent(new CustomEvent("contour:activity-clear", { bubbles: true, composed: true, detail: {} }));
        } else if (btn.textContent === "Unread only") {
          this.toggleAttribute("unread-only");
          this.dispatchEvent(new CustomEvent("contour:activity-filter", { bubbles: true, composed: true, detail: { unread: this.hasAttribute("unread-only") } }));
        } else {
          const item = e.target.closest(".c-activity-feed__item");
          if (item && this.contains(item)) {
            const items = Array.from(this.querySelectorAll(".c-activity-feed__item"));
            const index = items.indexOf(item);
            const text = item.querySelector(".c-activity-feed__text")?.textContent || "";
            item.classList.remove("c-activity-feed__item--unread");
            this.dispatchEvent(new CustomEvent("contour:activity-select", { bubbles: true, composed: true, detail: { index, text } }));
          }
        }
      });
      this.addEventListener("keydown", (e) => {
        const items = Array.from(this.querySelectorAll(".c-activity-feed__item"));
        if (!items.length) return;
        navKey(e, items, { wrap: false, homeEnd: true, onNavigate: (i) => { items.forEach((it, j) => it.tabIndex = j === i ? 0 : -1); }, onKey: () => { if (e.key === "Enter" || e.key === " ") { const idx = items.indexOf(document.activeElement); this.dispatchEvent(new CustomEvent("contour:activity-select", { bubbles: true, composed: true, detail: { index: idx, text: document.activeElement.querySelector(".c-activity-feed__text")?.textContent || "" } })); } } });
      });
    }
  }
  define("contour-activity-feed", ContourActivityFeed);
class ContourAdvanced extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-advanced");
      this.setAttribute("role", "region");
      const title = this.getAttribute("title");
      if (title) {
        const t = this.ensure(".c-advanced__title", () => { const el = document.createElement("div"); el.className = "c-advanced__title"; return el; });
        t.textContent = title;
        this.setAttribute("aria-label", title);
      }
    }
    enhance() {
      if (this._wiredAdvanced) return;
      this._wiredAdvanced = true;
      this.addEventListener("click", (e) => {
        const title = this.getAttribute("title") || "";
        this.dispatchEvent(new CustomEvent("contour:advanced-toggle", { bubbles: true, composed: true, detail: { title } }));
      });
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const title = this.getAttribute("title") || "";
          this.dispatchEvent(new CustomEvent("contour:advanced-toggle", { bubbles: true, composed: true, detail: { title } }));
        }
      });
    }
  }
  define("contour-advanced", ContourAdvanced);
class ContourAffordance extends ContourBase {
    static get observed() { return ["name", "note", "demo"]; }
    static get properties() { return { name: { attribute: "name" }, note: { attribute: "note" }, demo: { attribute: "demo" } }; }
    render() {
      this.classList.add("c-affordance");
      this.setAttribute("role", "group");
      const name = this.getAttribute("name");
      if (name) {
        const n = this.ensure(".c-affordance__name", () => { const el = document.createElement("div"); el.className = "c-affordance__name"; return el; });
        n.textContent = name;
        this.setAttribute("aria-label", name);
      } else {
        const n = this.querySelector(".c-affordance__name");
        if (n) n.remove();
      }
      const note = this.getAttribute("note");
      if (note) {
        const nt = this.ensure(".c-affordance__note", () => { const el = document.createElement("div"); el.className = "c-affordance__note"; return el; });
        nt.textContent = note;
      } else {
        const nt = this.querySelector(".c-affordance__note");
        if (nt) nt.remove();
      }
      const demo = this.getAttribute("demo");
      if (demo) {
        const d = this.ensure(".c-affordance__demo", () => { const el = document.createElement("div"); el.className = "c-affordance__demo"; return el; });
        d.textContent = demo;
      } else {
        const d = this.querySelector(".c-affordance__demo");
        if (d) d.remove();
      }
    }
    enhance() {
      if (this._wiredAffordance) return;
      this._wiredAffordance = true;
      this.addEventListener("click", (e) => {
        const name = this.getAttribute("name") || "";
        this.dispatchEvent(new CustomEvent("contour:affordance-activate", { bubbles: true, composed: true, detail: { name } }));
      });
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const name = this.getAttribute("name") || "";
          this.dispatchEvent(new CustomEvent("contour:affordance-activate", { bubbles: true, composed: true, detail: { name } }));
        }
      });
    }
  }
  define("contour-affordance", ContourAffordance);
class ContourAffordances extends ContourBase {
    static get observed() { return ["name", "title"]; }
    static get properties() { return { name: { attribute: "name" }, title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-affordances");
      this.setAttribute("role", "group");
      if (!this.querySelector(".c-affordance")) {
        const aff = document.createElement("div");
        aff.className = "c-affordance";
        const name = this.getAttribute("name") || this.getAttribute("title") || "Affordance";
        const n = document.createElement("div");
        n.className = "c-affordance__name";
        n.textContent = name;
        aff.appendChild(n);
        const demo = document.createElement("div");
        demo.className = "c-affordance__demo";
        demo.textContent = "Demo";
        aff.appendChild(demo);
        this.appendChild(aff);
      }
    }
  }
  define("contour-affordances", ContourAffordances);
