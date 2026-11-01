import { ContourBase, define, onDispose, formatValue } from './core.mjs';
import { loadRemote, remoteData, renderStates, renderEmpty, wireStates } from './states.mjs';
import { compassNeedle, scaleBarTicks } from './svg.mjs';

// Shared tooltip + roving + select wiring for the map components that render a
// grid of items (hexbin cells, flow-map nodes, isochrone rings). Extracted from
// three near-identical copies (D-13) so the behaviour cannot drift apart again.
function wireMapItems(host, itemSelector, tooltipClass) {
  if (host._wiredMapItems) return;
  host._wiredMapItems = true;
  const items = () => Array.from(host.querySelectorAll(itemSelector));
  const showTip = (e) => {
    const tip = host.querySelector(tooltipClass);
    if (!tip) return;
    const item = e && e.target && typeof e.target.closest === "function" ? e.target.closest(itemSelector) : null;
    if (!item || !host.contains(item)) { tip.setAttribute("hidden", ""); return; }
    const title = item.getAttribute("title");
    if (title) tip.textContent = title;
    const rect = host.getBoundingClientRect();
    const ir = item.getBoundingClientRect();
    tip.style.setProperty("--chart-tip-inline-start", (ir.left - rect.left + ir.width / 2) + "px");
    tip.style.setProperty("--chart-tip-block-start", (ir.top - rect.top) + "px");
    tip.removeAttribute("hidden");
  };
  const hideTip = () => {
    const tip = host.querySelector(tooltipClass);
    if (tip) tip.setAttribute("hidden", "");
  };
  host.addEventListener("mouseover", showTip);
  host.addEventListener("mouseout", (e) => { if (!e.relatedTarget || !host.contains(e.relatedTarget)) hideTip(); });
  host.addEventListener("focusin", (e) => {
    const item = e && e.target && typeof e.target.closest === "function" ? e.target.closest(itemSelector) : null;
    if (item && host.contains(item)) showTip({ target: item });
  });
  host.addEventListener("focusout", (e) => { if (!host.contains(e.relatedTarget)) hideTip(); });
  host.addEventListener("click", (e) => {
    const item = e && e.target && typeof e.target.closest === "function" ? e.target.closest(itemSelector) : null;
    if (!item || !host.contains(item)) return;
    const all = items();
    const index = all.indexOf(item);
    if (index < 0) return;
    host.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index, label: item.getAttribute("title") || item.textContent.trim() } }));
  });
  host.addEventListener("keydown", (e) => {
    const item = e && e.target && typeof e.target.closest === "function" ? e.target.closest(itemSelector) : null;
    if (!item || !host.contains(item)) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const all = items();
      const index = all.indexOf(item);
      if (index < 0) return;
      host.dispatchEvent(new CustomEvent("contour:select", { bubbles: true, composed: true, detail: { index, label: item.getAttribute("title") || item.textContent.trim() } }));
    }
    // Roving tabindex keyboard nav.
    const all = items();
    const idx = all.indexOf(item);
    if (idx < 0) return;
    let next = -1;
    const rtl = (host.getAttribute("dir") || document.documentElement.getAttribute("dir") || "").toLowerCase() === "rtl";
    if (e.key === "ArrowDown") next = Math.min(idx + 1, all.length - 1);
    else if (e.key === "ArrowUp") next = Math.max(idx - 1, 0);
    else if (e.key === "ArrowRight") next = rtl ? Math.max(idx - 1, 0) : Math.min(idx + 1, all.length - 1);
    else if (e.key === "ArrowLeft") next = rtl ? Math.min(idx + 1, all.length - 1) : Math.max(idx - 1, 0);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = all.length - 1;
    if (next < 0 || next === idx) return;
    e.preventDefault();
    all.forEach((c, i) => c.setAttribute("tabindex", i === next ? "0" : "-1"));
    try { all[next].focus(); } catch (err) {}
  });
}

class ContourMinimap extends ContourBase {
    static get observed() { return ["label", "viewport", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, viewport: { attribute: "viewport" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-minimap");
      wireStates(this);
      loadRemote(this, ["label", "viewport"]);
      if (renderStates(this, "minimap")) return;
      const label = remoteData(this, "label") || (this._remoteData && this._remoteData.label);
      const viewport = remoteData(this, "viewport") || (this._remoteData && (this._remoteData.viewport || this._remoteData.value));
      if (!label && !viewport) {
        renderEmpty(this, "minimap");
        return;
      }
      if (label) {
        const l = this.ensure(".c-minimap__label", () => { const el = document.createElement("span"); el.className = "c-minimap__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-minimap__label");
        if (l) l.remove();
      }
      if (viewport) {
        const v = this.ensure(".c-minimap__viewport", () => { const el = document.createElement("div"); el.className = "c-minimap__viewport"; return el; });
        v.textContent = viewport;
      } else {
        const v = this.querySelector(".c-minimap__viewport");
        if (v) v.remove();
      }
    }
    enhance() {
      if (this._wiredMinimap) return;
      this._wiredMinimap = true;
      let dragging = false;
      this.addEventListener("pointerdown", (e) => {
        const vp = this.querySelector(".c-minimap__viewport");
        if (!vp || !vp.contains(e.target)) return;
        dragging = true;
        try { vp.setPointerCapture(e.pointerId); } catch (err) {}
      });
      this.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        this.dispatchEvent(new CustomEvent("contour:move", { detail: { direction: "drag" }, bubbles: true, composed: true }));
      });
      this.addEventListener("pointerup", () => { dragging = false; });
    }
  }
define("contour-minimap", ContourMinimap);
class ContourCoordinate extends ContourBase {
    static get observed() { return ["value", "format", "locale", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { value: { attribute: "value" }, format: { attribute: "format" }, locale: { attribute: "locale" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-coordinate");
      wireStates(this);
      loadRemote(this, "value");
      if (renderStates(this, "coordinate")) return;
      const value = remoteData(this, "value") || (this._remoteData && (this._remoteData.value || this._remoteData.coordinate));
      if (!value) {
        renderEmpty(this, "coordinate");
        return;
      }
      const format = this.getAttribute("format") || "decimal";
      let text = String(value);
      if (format === "dms") {
        // simple DMS conversion assuming decimal degrees "lat,lon"
        const parts = String(value).split(/[,\s]+/).map(Number);
        if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
          const toDMS = (d) => {
            const deg = Math.floor(Math.abs(d));
            const min = Math.floor((Math.abs(d) - deg) * 60);
            const sec = (((Math.abs(d) - deg) * 60) - min) * 60;
            return deg + "°" + min + "'" + sec.toFixed(1) + '"' + (d < 0 ? "S" : "N");
          };
          text = toDMS(parts[0]) + " " + toDMS(parts[1]);
        }
      } else if (format === "web-mercator") {
        const parts = String(value).split(/[,\s]+/).map(Number);
        if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
          const x = parts[1] * 20037508.34 / 180;
          const y = Math.log(Math.tan((90 + parts[0]) * Math.PI / 360)) / (Math.PI / 180) * 20037508.34 / 180;
          text = x.toFixed(2) + ", " + y.toFixed(2);
        }
      } else {
        text = formatValue(value, this.getAttribute("format"), this.getAttribute("locale"));
      }
      const span = this.ensure(".c-coordinate__value", () => { const el = document.createElement("span"); el.className = "c-coordinate__value"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); return el; });
      span.textContent = text;
      // copy button
      let btn = this.querySelector(".c-coordinate__copy");
      if (!btn) { btn = document.createElement("button"); btn.type = "button"; btn.className = "c-coordinate__copy"; btn.textContent = "Copy"; btn.setAttribute("aria-label", "Copy coordinate"); this.appendChild(btn); }
      btn.onclick = () => {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(() => { fallbackCopy(text); });
          } else {
            fallbackCopy(text);
          }
        } catch (e) { fallbackCopy(text); }
        this.dispatchEvent(new CustomEvent("contour:copy", { detail: { text }, bubbles: true, composed: true }));
      };
      function fallbackCopy(t) {
        try {
          const ta = document.createElement("textarea");
          ta.value = t;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        } catch (e) {}
      }
    }
  }
define("contour-coordinate", ContourCoordinate);
class ContourLayerPanel extends ContourBase {
    static get observed() { return ["label", "items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton", "allow-rename", "allow-remove", "allow-duplicate", "allow-zoom"]; }
    static get properties() { return { label: { attribute: "label" }, items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-layer-panel");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "layer-panel")) return;
      const items = remoteData(this, "items");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-layer-panel__label", () => { const el = document.createElement("span"); el.className = "c-layer-panel__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-layer-panel__label");
        if (l) l.remove();
      }
      // Slotted content support: authored .c-layer-panel__item children take
      // precedence over the JSON `items` attribute.
      const authoredLayerItems = Array.from(this.querySelectorAll(":scope > .c-layer-panel__item"));
      // Preserve user-toggled visibility across re-renders (B3-09): a src
      // reload must not re-check a layer the user un-checked.
       const savedVisibility = new Map();
       this.querySelectorAll(".c-layer-panel__item").forEach((el) => {
         const nm = el.querySelector(".c-layer-panel__name");
         const tg = el.querySelector(".c-layer-panel__toggle");
         if (nm && tg) {
           const v = tg.hasAttribute("aria-pressed") ? tg.getAttribute("aria-pressed") === "true" : !!tg.checked;
           savedVisibility.set(nm.textContent, v);
         }
       });
      let parsed = null;
      if (authoredLayerItems.length) {
         parsed = authoredLayerItems.map((el) => {
           const nm = el.querySelector(".c-layer-panel__name");
           const tg = el.querySelector(".c-layer-panel__toggle");
           const visible = tg ? (tg.hasAttribute("aria-pressed") ? tg.getAttribute("aria-pressed") === "true" : !!tg.checked) : true;
           const cap = el.querySelector(".c-layer-panel__caption");
           return { name: nm ? nm.textContent : "", visible, caption: cap ? cap.textContent : (el.dataset.caption || undefined) };
         });
        authoredLayerItems.forEach((el) => el.remove());
      } else if (items) {
        try {
          parsed = JSON.parse(items);
          Array.from(this.querySelectorAll(".c-layer-panel__item")).forEach((el) => el.remove());
        } catch (e) { /* keep existing */ }
      }
      if (parsed) { parsed.forEach((it) => {
           const name = typeof it === "string" ? it : (it.name || it.label || "");
           const caption = (typeof it === "object" && it) ? (it.caption || it.subtitle || "") : "";
           const item = document.createElement("div");
           item.className = "c-layer-panel__item" + (it.dragging ? " c-layer-panel__item--dragging" : "");
            const toggle = document.createElement("button");
            toggle.type = "button";
            toggle.className = "c-layer-panel__toggle";
            toggle.setAttribute("part", "visibility-toggle");
            toggle.setAttribute("aria-label", "Toggle " + (name || "layer"));
            const isVisible = savedVisibility.has(name) ? savedVisibility.get(name) : (typeof it === "object" && it.visible !== false);
            toggle.setAttribute("aria-pressed", String(!!isVisible));
            toggle.checked = !!isVisible;
            toggle.textContent = isVisible ? "●" : "○";
            item.appendChild(toggle);
            const nm = document.createElement("span");
            nm.className = "c-layer-panel__name";
            nm.textContent = name;
            item.appendChild(nm);
            if (caption) {
              const cap = document.createElement("span");
              cap.className = "c-layer-panel__caption";
              cap.textContent = caption;
              item.appendChild(cap);
            }
            const opacity = document.createElement("input");
             opacity.type = "range";
             opacity.className = "c-layer-panel__opacity";
             opacity.min = "0";
             opacity.max = "100";
              opacity.setAttribute("aria-label", "Opacity of " + (name || "layer"));
             opacity.value = (typeof it === "object" && it.opacity != null) ? it.opacity : "100";
            item.appendChild(opacity);
            // rename input (hidden by default, toggled via button)
            if (this.getAttribute("allow-rename") !== "false") {
            const renameBtn = document.createElement("button");
            renameBtn.type = "button";
            renameBtn.className = "c-layer-panel__rename";
            renameBtn.textContent = "Rename";
            renameBtn.setAttribute("aria-label", "Rename " + (name || "layer"));
            item.appendChild(renameBtn);
            }
            if (this.getAttribute("allow-duplicate") !== "false") {
            const dupBtn = document.createElement("button");
            dupBtn.type = "button";
            dupBtn.className = "c-layer-panel__duplicate";
            dupBtn.textContent = "Duplicate";
            dupBtn.setAttribute("aria-label", "Duplicate " + (name || "layer"));
            item.appendChild(dupBtn);
            }
            if (this.getAttribute("allow-zoom") !== "false") {
            const zoomBtn = document.createElement("button");
            zoomBtn.type = "button";
            zoomBtn.className = "c-layer-panel__zoom";
            zoomBtn.textContent = "Zoom";
            zoomBtn.setAttribute("aria-label", "Zoom to " + (name || "layer"));
            item.appendChild(zoomBtn);
            }
            if (this.getAttribute("allow-remove") !== "false") {
            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "c-layer-panel__remove";
            removeBtn.textContent = "✕";
            removeBtn.setAttribute("aria-label", "Remove " + (name || "layer"));
            item.appendChild(removeBtn);
            }
            const projSel = document.createElement("select");
            projSel.className = "c-layer-panel__projection";
            projSel.setAttribute("aria-label", "Projection of " + (name || "layer"));
            ["EPSG:4326","EPSG:3857"].forEach((p) => { const o = document.createElement("option"); o.value = p; o.textContent = p; projSel.appendChild(o); });
            item.appendChild(projSel);
            this.appendChild(item);
          });
      }
      if (!parsed && !authoredLayerItems.length && !items) {
        Array.from(this.querySelectorAll(".c-layer-panel__item")).forEach((el) => el.remove());
        renderEmpty(this, "layer-panel");
      }
    }
    enhance() {
      if (this._wiredLayerPanel) return;
      this._wiredLayerPanel = true;
      // The panel's two controls (visibility toggle, opacity range) are rebuilt
      // on every render, so both keep the host-delegated pattern (rule 12).
       this.addEventListener("change", (e) => {
         const item = e.target && e.target.closest ? e.target.closest(".c-layer-panel__item") : null;
         if (!item || !this.contains(item)) return;
         const name = item.querySelector(".c-layer-panel__name")?.textContent || "";
         if (e.target.classList.contains("c-layer-panel__toggle")) {
           const now = (typeof e.target.checked === "boolean") ? e.target.checked : (e.target.getAttribute("aria-pressed") !== "true");
           e.target.checked = now;
           e.target.setAttribute("aria-pressed", String(now));
           e.target.textContent = now ? "●" : "○";
           this.dispatchEvent(new CustomEvent("contour:layer-visibility", { bubbles: true, composed: true, detail: { name, visible: now } }));
         } else if (e.target.classList.contains("c-layer-panel__opacity")) {
           this.dispatchEvent(new CustomEvent("contour:layer-opacity", { bubbles: true, composed: true, detail: { name, opacity: Number(e.target.value) } }));
         } else if (e.target.classList.contains("c-layer-panel__projection")) {
           this.dispatchEvent(new CustomEvent("contour:layer-projection", { bubbles: true, composed: true, detail: { name, projection: e.target.value } }));
         }
       });
       this.addEventListener("click", (e) => {
         const btn = e.target && e.target.closest ? e.target.closest("button") : null;
         if (!btn || !this.contains(btn)) return;
         const item = btn.closest(".c-layer-panel__item");
         if (btn.classList.contains("c-layer-panel__toggle")) {
           if (!item) return;
           const name = item.querySelector(".c-layer-panel__name")?.textContent || "";
           const now = btn.getAttribute("aria-pressed") !== "true";
           btn.setAttribute("aria-pressed", String(now));
           btn.checked = now;
           btn.textContent = now ? "●" : "○";
           this.dispatchEvent(new CustomEvent("contour:layer-visibility", { bubbles: true, composed: true, detail: { name, visible: now } }));
           return;
         }
         if (!item) return;
         const name = item.querySelector(".c-layer-panel__name")?.textContent || "";
         if (btn.classList.contains("c-layer-panel__rename")) {
           const nm = item.querySelector(".c-layer-panel__name");
           if (nm) {
             const input = document.createElement("input");
             input.type = "text";
             input.className = "c-input c-layer-panel__rename-input";
             input.value = name;
             input.setAttribute("aria-label", "Rename layer");
             nm.replaceWith(input);
             input.focus();
             input.select();
             const commit = () => {
               const trimmed = (input.value || "").trim();
               const span = document.createElement("span");
               span.className = "c-layer-panel__name";
               span.textContent = trimmed || name;
               input.replaceWith(span);
               if (trimmed && trimmed !== name) {
                 this.dispatchEvent(new CustomEvent("contour:layer-rename", { bubbles: true, composed: true, detail: { name, newName: trimmed } }));
               }
             };
             input.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); commit(); } else if (ev.key === "Escape") { ev.preventDefault(); input.value = name; commit(); } });
             input.addEventListener("blur", commit, { once: true });
           }
         } else if (btn.classList.contains("c-layer-panel__duplicate")) {
           this.dispatchEvent(new CustomEvent("contour:layer-duplicate", { bubbles: true, composed: true, detail: { name } }));
         } else if (btn.classList.contains("c-layer-panel__zoom")) {
           this.dispatchEvent(new CustomEvent("contour:layer-zoom", { bubbles: true, composed: true, detail: { name } }));
         } else if (btn.classList.contains("c-layer-panel__remove")) {
           this.dispatchEvent(new CustomEvent("contour:layer-remove", { bubbles: true, composed: true, detail: { name } }));
         }
       });
        this.addEventListener("keydown", (e) => {
          if (e.target && e.target.classList && e.target.classList.contains("c-layer-panel__toggle") && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            e.target.click();
            return;
          }
          const item = e.target && e.target.closest ? e.target.closest(".c-layer-panel__item") : null;
          if (!item || !this.contains(item)) return;
         if (!(e.altKey) || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
         e.preventDefault();
         const items = Array.from(this.querySelectorAll(".c-layer-panel__item"));
         const idx = items.indexOf(item);
         if (idx < 0) return;
         const dir = e.key === "ArrowUp" ? -1 : 1;
         const newIdx = idx + dir;
         if (newIdx < 0 || newIdx >= items.length) return;
         item.classList.add("c-layer-panel__item--dragging");
         if (dir < 0) this.insertBefore(item, items[newIdx]);
         else this.insertBefore(items[newIdx], item);
         item.focus();
         setTimeout(() => item.classList.remove("c-layer-panel__item--dragging"), 200);
         const layerIds = Array.from(this.querySelectorAll(".c-layer-panel__item")).map((el) => el.querySelector(".c-layer-panel__name")?.textContent || "");
         this.dispatchEvent(new CustomEvent("contour:layer-reorder", { bubbles: true, composed: true, detail: { layerIds } }));
       });
     }
  }
define("contour-layer-panel", ContourLayerPanel);
class ContourTimeSlider extends ContourBase {
    static get observed() { return ["label", "value", "loop", "speed", "speeds", "show-loop", "loop-label", "current-time", "time-format", "is-playing"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-time-slider");
      const play = this.ensure(".c-time-slider__play", () => {
        const el = document.createElement("button");
        el.className = "c-time-slider__play";
        el.type = "button";
        el.setAttribute("aria-label", "Play");
        el.setAttribute("data-state", "play");
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("aria-hidden", "true");
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttribute("href", "#i-play");
        svg.appendChild(use);
        el.appendChild(svg);
        return el;
      });
      const track = this.ensure(".c-time-slider__track", () => { const el = document.createElement("input"); el.className = "c-time-slider__track"; el.type = "range"; el.min = "0"; el.max = "100"; el.setAttribute("aria-label", "Time"); return el; });
      const _attrVal = this.getAttribute("value") || "0";
      if (this._timeSliderAttrLast !== _attrVal) {
        track.value = _attrVal;
        this._timeSliderAttrLast = _attrVal;
      }
      track.setAttribute("aria-label", this.getAttribute("label") || "Time");
      const time = this.ensure(".c-time-slider__time", () => { const el = document.createElement("span"); el.className = "c-time-slider__time"; return el; });
      const ct = this.getAttribute("current-time");
      time.textContent = ct ? ct : (this.getAttribute("label") || "");
      // speed selector
      let speeds = null;
      const speedsAttr = this.getAttribute("speeds");
      if (speedsAttr) { try { speeds = JSON.parse(speedsAttr); } catch (e) { speeds = null; } }
      const speedSel = this.ensure(".c-time-slider__speed", () => { const el = document.createElement("select"); el.className = "c-time-slider__speed"; el.setAttribute("aria-label", "Speed"); return el; });
      speedSel.innerHTML = "";
      const speedList = Array.isArray(speeds) ? speeds : [0.5, 1, 2, 5, 10];
      speedList.forEach((sp) => {
        const opt = document.createElement("option");
        opt.value = String(sp);
        opt.textContent = String(sp);
        if (String(sp) === (this.getAttribute("speed") || "")) opt.selected = true;
        speedSel.appendChild(opt);
      });
      const speedAttr = this.getAttribute("speed");
      if (speedAttr) speedSel.value = speedAttr;
      // loop toggle
      const showLoop = this.hasAttribute("show-loop");
      if (showLoop) {
        const loopBtn = this.ensure(".c-time-slider__loop", () => { const el = document.createElement("button"); el.className = "c-time-slider__loop"; el.type = "button"; el.setAttribute("aria-label", this.getAttribute("loop-label") || "Loop"); return el; });
        loopBtn.setAttribute("aria-pressed", this.hasAttribute("loop") ? "true" : "false");
        loopBtn.textContent = this.getAttribute("loop-label") || "Loop";
      } else {
        const lb = this.querySelector(".c-time-slider__loop");
        if (lb) lb.remove();
      }
      // is-playing reflects on play button
      if (this.hasAttribute("is-playing")) {
        play.setAttribute("data-state", "pause");
        play.setAttribute("aria-label", "Pause");
        const use = play.querySelector("use");
        if (use) use.setAttribute("href", "#i-pause");
      }
    }
    enhance() {
      if (this._wiredTimeSlider) return;
      this._wiredTimeSlider = true;
      // Play advances the track one step per second and announces each move as
      // contour:time-change, so a dashboard can animate a chart in lockstep.
      // The loop stops at max, or on a second click, or when the host leaves
      // the page (the disposer is registered once, like the loader's).
      let timer = undefined;
      const stop = () => { if (timer !== undefined) { clearInterval(timer); timer = undefined; } };
      const step = () => {
        const track = this.querySelector(".c-time-slider__track");
        if (!track) { stop(); return; }
        const max = Number(track.max) || 100;
        const loop = this.hasAttribute("loop");
        let next = (Number(track.value) || 0) + 1;
        if (next > max) {
          if (loop) next = 0;
          else next = max;
        }
        track.value = String(next);
        this.dispatchEvent(new CustomEvent("contour:time-change", { detail: { value: String(next) }, bubbles: true, composed: true }));
        if (!loop && next >= max) {
          stop();
          const btn = this.querySelector(".c-time-slider__play");
          if (btn) {
            btn.setAttribute("data-state", "play");
            btn.setAttribute("aria-label", "Play");
            const use = btn.querySelector("use");
            if (use) use.setAttribute("href", "#i-play");
          }
        }
      };
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-time-slider__play") : null;
        if (btn) {
          const playing = btn.getAttribute("data-state") === "play";
          btn.setAttribute("data-state", playing ? "pause" : "play");
          btn.setAttribute("aria-label", playing ? "Pause" : "Play");
          const use = btn.querySelector("use");
          if (use) use.setAttribute("href", playing ? "#i-pause" : "#i-play");
          if (playing) {
            stop();
            const speed = parseFloat(this.getAttribute("speed") || "1") || 1;
            const delay = Math.max(100, 1000 / speed);
            timer = setInterval(step, delay);
            this.dispatchEvent(new CustomEvent("contour:play", { bubbles: true, composed: true }));
          } else {
            stop();
            this.dispatchEvent(new CustomEvent("contour:pause", { bubbles: true, composed: true }));
          }
          return;
        }
        const loopBtn = e.target && e.target.closest ? e.target.closest(".c-time-slider__loop") : null;
        if (loopBtn) {
          const next = loopBtn.getAttribute("aria-pressed") !== "true";
          loopBtn.setAttribute("aria-pressed", String(next));
          this.toggleAttribute("loop", next);
          this.dispatchEvent(new CustomEvent("contour:loop-change", { detail: { loop: next }, bubbles: true, composed: true }));
        }
      });
      // speed select change (delegated)
      this.addEventListener("change", (e) => {
        const sel = e.target && e.target.closest ? e.target.closest(".c-time-slider__speed") : null;
        if (!sel) return;
        const speed = Number(sel.value);
        this.dispatchEvent(new CustomEvent("contour:speed-change", { detail: { speed }, bubbles: true, composed: true }));
      });
      onDispose(this, stop);
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._wiredTimeSlider = false;
    }
  }
  define("contour-time-slider", ContourTimeSlider);
class ContourHexbin extends ContourBase {
    static get observed() { return ["label", "cells", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, cells: { attribute: "cells" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-hexbin");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Hexbin");
      const label = this.getAttribute("label") || (this._remoteData && this._remoteData.label);
      if (label) {
        const l = this.ensure(".c-hexbin__label", () => { const el = document.createElement("span"); el.className = "c-hexbin__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-hexbin__label");
        if (l) l.remove();
      }
      wireStates(this);
      loadRemote(this, "cells");
      if (renderStates(this, "hexbin")) return;
      const cells = remoteData(this, "cells");
      const effectiveCells = cells || (this._remoteData && this._remoteData.cells ? JSON.stringify(this._remoteData.cells) : null);
      // Slotted content support: authored .c-hexbin__cell children take
      // precedence over the JSON `cells` attribute.
      const authoredCells = Array.from(this.querySelectorAll(":scope > .c-hexbin__cell"));
      let parsed = null;
      if (authoredCells.length) {
        parsed = authoredCells.map((el) => el.textContent || el.getAttribute("title") || "");
        authoredCells.forEach((el) => el.remove());
      } else if (effectiveCells) {
        try { parsed = JSON.parse(effectiveCells); } catch (e) { parsed = null; }
      }
      if (parsed) {
       try {
         Array.from(this.querySelectorAll(".c-hexbin__cell")).forEach((n) => n.remove());
         const cols = Math.ceil(Math.sqrt(parsed.length || 1));
         this.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
         this.style.inlineSize = "16rem";
           parsed.forEach((c, i) => {
             const cell = document.createElement("div");
             cell.className = "c-hexbin__cell";
             cell.setAttribute("tabindex", i === 0 ? "0" : "-1");
             if (typeof c === "object" && c.value != null) { cell.textContent = c.value; cell.setAttribute("title", String(c.value)); }
             else if (typeof c !== "object") { cell.textContent = c; cell.setAttribute("title", String(c)); }
             this.appendChild(cell);
           });
           const tip = this.ensure(".c-hexbin__tooltip", () => { const el = document.createElement("div"); el.className = "c-hexbin__tooltip"; el.setAttribute("role", "tooltip"); el.setAttribute("hidden", ""); return el; });
           tip.setAttribute("hidden", "");
       } catch (e) { /* keep existing */ }
      } else if (!parsed) {
        Array.from(this.querySelectorAll(".c-hexbin__cell")).forEach((n) => n.remove());
        renderEmpty(this, "hexbin");
      }
     }
     enhance() {
       if (this._wiredHexbin) return;
       this._wiredHexbin = true;
       wireMapItems(this, ".c-hexbin__cell", ".c-hexbin__tooltip");
     }
  }
define("contour-hexbin", ContourHexbin);
class ContourFlowMap extends ContourBase {
    static get observed() { return ["label", "nodes", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, nodes: { attribute: "nodes" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-flow-map");
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", "Flow map");
      const label = this.getAttribute("label") || (this._remoteData && this._remoteData.label);
      if (label) {
        const l = this.ensure(".c-flow-map__label", () => { const el = document.createElement("span"); el.className = "c-flow-map__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-flow-map__label");
        if (l) l.remove();
      }
      wireStates(this);
      loadRemote(this, "nodes");
      if (renderStates(this, "flow-map")) return;
      const nodes = remoteData(this, "nodes");
      const effectiveNodes = nodes || (this._remoteData && this._remoteData.nodes ? JSON.stringify(this._remoteData.nodes) : null);
      // Slotted content support: authored .c-flow-map__node children take
      // precedence over the JSON `nodes` attribute.
      const authoredNodes = Array.from(this.querySelectorAll(":scope > .c-flow-map__node"));
      let parsed = null;
      if (authoredNodes.length) {
        parsed = authoredNodes.map((el) => el.textContent || el.getAttribute("title") || "");
        authoredNodes.forEach((el) => el.remove());
      } else if (effectiveNodes) {
        try { parsed = JSON.parse(effectiveNodes); } catch (e) { parsed = null; }
      }
      if (parsed) {
       try {
         Array.from(this.querySelectorAll(".c-flow-map__node")).forEach((n) => n.remove());
           parsed.forEach((n, i) => {
            const node = document.createElement("span");
            node.className = "c-flow-map__node" + (n.source ? " c-flow-map__node--source" : "") + (n.target ? " c-flow-map__node--target" : "");
            node.setAttribute("tabindex", i === 0 ? "0" : "-1");
            node.textContent = typeof n === "string" ? n : (n.label || n.name || "");
            if (typeof n === "object" && (n.label || n.name)) node.setAttribute("title", n.label || n.name);
            this.appendChild(node);
          });
          const tip = this.ensure(".c-flow-map__tooltip", () => { const el = document.createElement("div"); el.className = "c-flow-map__tooltip"; el.setAttribute("role", "tooltip"); el.setAttribute("hidden", ""); return el; });
          tip.setAttribute("hidden", "");
       } catch (e) { /* keep existing */ }
      } else if (!parsed) {
        Array.from(this.querySelectorAll(".c-flow-map__node")).forEach((n) => n.remove());
        renderEmpty(this, "flow-map");
      }
     }
     enhance() {
       if (this._wiredFlowMap) return;
       this._wiredFlowMap = true;
       wireMapItems(this, ".c-flow-map__node", ".c-flow-map__tooltip");
     }
   }
define("contour-flow-map", ContourFlowMap);
class ContourIsochrone extends ContourBase {
    static get observed() { return ["label", "center", "rings", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, center: { attribute: "center" }, rings: { attribute: "rings" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-isochrone");
      const label = this.getAttribute("label") || (this._remoteData && this._remoteData.label);
      if (label) {
        const l = this.ensure(".c-isochrone__label", () => { const el = document.createElement("span"); el.className = "c-isochrone__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-isochrone__label");
        if (l) l.remove();
      }
      const center = this.getAttribute("center") || (this._remoteData && this._remoteData.center);
      if (center) {
        const c = this.ensure(".c-isochrone__center", () => { const el = document.createElement("span"); el.className = "c-isochrone__center"; return el; });
        c.textContent = center;
      } else {
        const c = this.querySelector(".c-isochrone__center");
        if (c) c.remove();
      }
      wireStates(this);
      loadRemote(this, "rings");
      if (renderStates(this, "isochrone")) return;
      const rings = remoteData(this, "rings");
      const effectiveRings = rings || (this._remoteData && this._remoteData.rings ? JSON.stringify(this._remoteData.rings) : null);
      // Slotted content support: authored .c-isochrone__ring children take
      // precedence over the JSON `rings` attribute.
      const authoredRings = Array.from(this.querySelectorAll(":scope > .c-isochrone__ring"));
      let parsed = null;
      if (authoredRings.length) {
        parsed = authoredRings.map((el) => el.textContent || el.getAttribute("title") || "");
        authoredRings.forEach((el) => el.remove());
      } else if (effectiveRings) {
        try { parsed = JSON.parse(effectiveRings); } catch (e) { parsed = null; }
      }
      if (parsed) {
         try {
           Array.from(this.querySelectorAll(".c-isochrone__ring")).forEach((n) => n.remove());
           parsed.forEach((r, i) => {
             const ring = document.createElement("span");
             ring.className = "c-isochrone__ring c-isochrone__ring--" + (r.label || r);
             ring.setAttribute("tabindex", i === 0 ? "0" : "-1");
             if (r.label) ring.setAttribute("title", r.label || r);
             this.appendChild(ring);
           });
           const tip = this.ensure(".c-isochrone__tooltip", () => { const el = document.createElement("div"); el.className = "c-isochrone__tooltip"; el.setAttribute("role", "tooltip"); el.setAttribute("hidden", ""); return el; });
           tip.setAttribute("hidden", "");
         } catch (e) { /* keep existing */ }
       } else if (!parsed) {
         Array.from(this.querySelectorAll(".c-isochrone__ring")).forEach((n) => n.remove());
         renderEmpty(this, "isochrone");
       }
     }
     enhance() {
       if (this._wiredIsochrone) return;
       this._wiredIsochrone = true;
       wireMapItems(this, ".c-isochrone__ring", ".c-isochrone__tooltip");
     }
   }
define("contour-isochrone", ContourIsochrone);
class ContourCatchment extends ContourBase {
    static get observed() { return ["label", "area", "center", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, area: { attribute: "area" }, center: { attribute: "center" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-catchment");
      const label = this.getAttribute("label") || (this._remoteData && this._remoteData.label);
      if (label) {
        const l = this.ensure(".c-catchment__label", () => { const el = document.createElement("span"); el.className = "c-catchment__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-catchment__label");
        if (l) l.remove();
      }
      const area = this.getAttribute("area") || (this._remoteData && this._remoteData.area);
      if (area) {
        const a = this.ensure(".c-catchment__area", () => { const el = document.createElement("span"); el.className = "c-catchment__area"; return el; });
        a.textContent = area;
      } else {
        const a = this.querySelector(".c-catchment__area");
        if (a) a.remove();
      }
      const center = this.getAttribute("center") || (this._remoteData && this._remoteData.center);
       if (center) {
         const c = this.ensure(".c-catchment__center", () => { const el = document.createElement("span"); el.className = "c-catchment__center"; return el; });
         c.textContent = center;
       } else {
         const c = this.querySelector(".c-catchment__center");
         if (c) c.remove();
       }
      wireStates(this);
      loadRemote(this, ["label", "area", "center"]);
      if (renderStates(this, "catchment")) return;
      const rLabel = remoteData(this, "label") || (this._remoteData && this._remoteData.label);
      const rArea = remoteData(this, "area") || (this._remoteData && this._remoteData.area);
      const rCenter = remoteData(this, "center") || (this._remoteData && this._remoteData.center);
      if (!rLabel && !rArea && !rCenter) {
        renderEmpty(this, "catchment");
        return;
      }
       const tip = this.ensure(".c-catchment__tooltip", () => { const el = document.createElement("div"); el.className = "c-catchment__tooltip"; el.setAttribute("role", "tooltip"); el.setAttribute("hidden", ""); return el; });
       tip.setAttribute("hidden", "");
       if (rArea) tip.textContent = rArea;
     }
    enhance() {
      if (this._wiredCatchment) return;
      this._wiredCatchment = true;
      // Per-event re-query (rule 12): the tip is rebuilt on every render, so a
      // capture at wiring time is a detached node after the first change.
      const showTip = () => {
        const tip = this.querySelector(".c-catchment__tooltip");
        if (tip) tip.removeAttribute("hidden");
      };
      const hideTip = () => {
        const tip = this.querySelector(".c-catchment__tooltip");
        if (tip) tip.setAttribute("hidden", "");
      };
      this.addEventListener("mouseenter", showTip);
      this.addEventListener("mouseleave", hideTip);
      // Keyboard path (BY-39): catchment has no per-cell marks to rove, so the
      // host itself is the focusable surface, exactly like the sparkline.
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
      this.addEventListener("focusin", showTip);
      this.addEventListener("focusout", hideTip);
    }
  }
define("contour-catchment", ContourCatchment);
class ContourCompassFull extends ContourBase {
    static get observed() { return ["label", "needle", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, needle: { attribute: "needle" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-compass");
      const label = this.getAttribute("label") || (this._remoteData && this._remoteData.label);
      wireStates(this);
      loadRemote(this, "needle");
      if (renderStates(this, "compass")) return;
      const needle = remoteData(this, "needle") || (this._remoteData && (this._remoteData.needle || this._remoteData.value));
      // Cardinal directions.
      for (const dir of ["n", "s", "e", "w"]) {
        const cls = ".c-compass__label--" + dir;
        let l = this.querySelector(cls);
        if (!l) {
          l = document.createElement("span");
          l.className = "c-compass__label " + cls.slice(1);
          l.textContent = dir.toUpperCase();
          // The cardinals are the compass's input: each one is a button-like
          // target that sets the bearing (BY-22 `contour:bearing`).
          l.setAttribute("role", "button");
          l.setAttribute("tabindex", "0");
          this.appendChild(l);
        }
      }
      if (label && label.toLowerCase() !== "compass") {
        const l = this.ensure(".c-compass__label:not([class*='--'])", () => { const el = document.createElement("span"); el.className = "c-compass__label"; return el; });
        l.textContent = label;
      }
      if (needle) {
        const deg = Number(needle) || 0;
        const n = this.ensure("svg.c-compass__needle", () => {
          const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          el.setAttribute("class", "c-compass__needle");
          el.setAttribute("viewBox", "0 0 40 40");
          el.setAttribute("aria-hidden", "true");
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", compassNeedle(20, 20, 16, deg));
          el.appendChild(path);
          return el;
        });
        const path = n.querySelector("path");
        if (path) path.setAttribute("d", compassNeedle(20, 20, 16, deg));
      } else {
        const n = this.querySelector("svg.c-compass__needle, .c-compass__needle");
        if (n) n.remove();
      }
      if (!needle && !label) {
        renderEmpty(this, "compass");
      }
    }
    enhance() {
      if (this._wiredCompass) return;
      this._wiredCompass = true;
      // A cardinal is the compass's input: activate one to set the bearing and
      // report it. The labels are rebuilt by render, so the handler is delegated
      // on the host (rule 12) and resolves the degrees from the label itself.
      const DEGREES = { n: 0, e: 90, s: 180, w: 270 };
      const setBearing = (dir) => {
        const deg = DEGREES[dir];
        if (deg === undefined) return;
        const n = this.querySelector(".c-compass__needle");
        if (n) {
          const path = n.querySelector("path");
          if (path) path.setAttribute("d", compassNeedle(20, 20, 16, deg));
        }
        this.dispatchEvent(new CustomEvent("contour:bearing", { bubbles: true, composed: true, detail: { direction: dir, degrees: deg } }));
      };
      this.addEventListener("click", (e) => {
        const label = e.target && e.target.closest ? e.target.closest(".c-compass__label--n, .c-compass__label--e, .c-compass__label--s, .c-compass__label--w") : null;
        if (!label || !this.contains(label)) return;
        const m = label.className.match(/c-compass__label--([nsew])/);
        if (m) setBearing(m[1]);
      });
      this.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const label = e.target && e.target.closest ? e.target.closest(".c-compass__label--n, .c-compass__label--e, .c-compass__label--s, .c-compass__label--w") : null;
        if (!label || !this.contains(label)) return;
        e.preventDefault();
        const m = label.className.match(/c-compass__label--([nsew])/);
        if (m) setBearing(m[1]);
      });
    }
  }
define("contour-compass", ContourCompassFull);
class ContourLayerSwitch extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-layer-switch");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "layer-switch")) return;
      const items = remoteData(this, "items");
      const authored = Array.from(this.children).filter((n) => n.classList && n.classList.contains("c-layer-switch__item"));
      if (items && !authored.length) {
        Array.from(this.querySelectorAll(".c-layer-switch__item")).forEach((n) => n.remove());
        try {
          const parsed = JSON.parse(items);
          const capped = Array.isArray(parsed) ? parsed.slice(0, 50) : parsed;
          capped.forEach((it) => {
            const item = document.createElement("div");
            item.className = "c-layer-switch__item";
            item.setAttribute("role", "group");
            const sw = document.createElement("span");
            sw.className = "c-layer-switch__swatch";
            if (it.color) sw.style.background = it.color;
            sw.setAttribute("aria-hidden", "true");
            item.appendChild(sw);
            const name = document.createElement("span");
            name.className = "c-layer-switch__name";
            name.textContent = typeof it === "string" ? it : (it.name || it.label || "");
            item.appendChild(name);
            if (it.count != null) {
              const c = document.createElement("span");
              c.className = "c-layer-switch__count";
              c.textContent = it.count;
              item.appendChild(c);
            }
            const toggle = document.createElement("button");
            toggle.className = "c-layer-switch__toggle";
            toggle.type = "button";
             toggle.setAttribute("aria-label", "Toggle " + (typeof it === "string" ? it : (it.name || it.label || "layer")));
             toggle.setAttribute("aria-pressed", "true");
            toggle.innerHTML = '<svg aria-hidden="true"><use href="#i-check" /></svg>';
            item.appendChild(toggle);
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      } else if (!items && !authored.length) {
        Array.from(this.querySelectorAll(".c-layer-switch__item")).forEach((n) => n.remove());
        renderEmpty(this, "layer-switch");
      }
    }
    enhance() {
      if (this._wiredLayerSwitch) return;
      this._wiredLayerSwitch = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-layer-switch__toggle") : null;
        if (!btn || !this.contains(btn)) return;
        const item = btn.closest(".c-layer-switch__item");
        const name = item ? (item.querySelector(".c-layer-switch__name")?.textContent || "") : "";
        const now = btn.getAttribute("aria-pressed") !== "true";
        btn.setAttribute("aria-pressed", String(now));
        this.dispatchEvent(new CustomEvent("contour:layer-toggle", { bubbles: true, composed: true, detail: { name, visible: now } }));
      });
      this.addEventListener("keydown", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-layer-switch__toggle") : null;
        if (!btn || !this.contains(btn)) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); btn.click(); }
      });
    }
  }
define("contour-layer-switch", ContourLayerSwitch);
class ContourMapSlot extends ContourBase {
    static get observed() { return ["attribution", "scale", "chrome"]; }
    static get properties() { return { attribution: { attribute: "attribution" }, scale: { attribute: "scale" }, chrome: { attribute: "chrome" } }; }
    render() {
      this.classList.add("c-map-slot");
      const chrome = this.getAttribute("chrome");
      if (chrome) {
        const c = this.ensure(".c-map-slot__chrome", () => { const el = document.createElement("div"); el.className = "c-map-slot__chrome"; return el; });
        c.textContent = chrome;
      } else {
        const c = this.querySelector(".c-map-slot__chrome");
        if (c) c.remove();
      }
      const attribution = this.getAttribute("attribution");
      if (attribution) {
        const a = this.ensure(".c-map-slot__attribution", () => { const el = document.createElement("div"); el.className = "c-map-slot__attribution"; return el; });
        a.textContent = attribution;
      } else {
        const a = this.querySelector(".c-map-slot__attribution");
        if (a) a.remove();
      }
      const scale = this.getAttribute("scale");
      if (scale) {
        const sc = this.ensure(".c-map-slot__scale", () => { const el = document.createElement("div"); el.className = "c-map-slot__scale"; return el; });
        sc.textContent = scale;
      } else {
        const sc = this.querySelector(".c-map-slot__scale");
        if (sc) sc.remove();
      }
    }
  }
  define("contour-map-slot", ContourMapSlot);
class ContourMapArea extends ContourBase {
    static get observed() { return ["attribution", "attribution-mark", "scale", "controls"]; }
    static get properties() { return { attribution: { attribute: "attribution" }, "attribution-mark": { attribute: "attribution-mark" }, scale: { attribute: "scale" }, controls: { attribute: "controls" } }; }
    render() {
      this.classList.add("c-map-area");
      const attribution = this.getAttribute("attribution");
      if (attribution) {
        const a = this.ensure(".c-map-slot__attribution", () => { const el = document.createElement("div"); el.className = "c-map-slot__attribution"; return el; });
        a.textContent = attribution;
      } else {
        const a = this.querySelector(".c-map-slot__attribution");
        if (a) a.remove();
      }
      const mark = this.getAttribute("attribution-mark");
      if (mark) {
        const m = this.ensure(".c-map-slot__attribution-mark", () => { const el = document.createElement("span"); el.className = "c-map-slot__attribution-mark"; return el; });
        m.textContent = mark;
      } else {
        const m = this.querySelector(".c-map-slot__attribution-mark");
        if (m) m.remove();
      }
      const scale = this.getAttribute("scale");
      if (scale) {
        const sc = this.ensure(".c-map-slot__scale", () => { const el = document.createElement("div"); el.className = "c-map-slot__scale"; return el; });
        sc.textContent = scale;
      } else {
        const sc = this.querySelector(".c-map-slot__scale");
        if (sc) sc.remove();
      }
      const controls = this.getAttribute("controls");
      if (controls) {
        try {
          const parsed = JSON.parse(controls);
          const wrap = this.ensure(".c-map-slot__controls", () => { const el = document.createElement("div"); el.className = "c-map-slot__controls"; return el; });
          wrap.innerHTML = "";
          parsed.forEach((c) => {
            const btn = document.createElement("button");
            btn.className = "c-map-slot__control";
            btn.type = "button";
            btn.textContent = typeof c === "string" ? c : (c.label || c);
            wrap.appendChild(btn);
          });
        } catch (e) { /* keep existing */ }
      } else {
        const w = this.querySelector(".c-map-slot__controls");
        if (w) w.remove();
      }
    }
    enhance() {
      if (this._wiredMapArea) return;
      this._wiredMapArea = true;
      // Map-engine seam (BY3-I3): Contour never imports a map library. A
      // consumer attaches a live engine instance via attachMap(); the component
      // stores the reference and reads viewport bounds through duck-typing so
      // the boundary (no engine imports, no GeoJSON) holds. detachMap() clears it.
      this._map = null;
      this.attachMap = (map) => { this._map = map || null; this.dispatchEvent(new CustomEvent("contour:map-attach", { bubbles: true, composed: true })); };
      this.detachMap = () => { this._map = null; this.dispatchEvent(new CustomEvent("contour:map-detach", { bubbles: true, composed: true })); };
      Object.defineProperty(this, "map", { get: () => this._map, set: (m) => this.attachMap(m) });
      this.getViewport = () => {
        const m = this._map;
        if (!m) return null;
        try {
          if (typeof m.getBounds === "function") {
            const b = m.getBounds();
            return { west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() };
          }
          if (m.transform && typeof m.transform === "object") {
            return { zoom: m.transform.zoom, center: m.transform.center };
          }
        } catch (e) { /* engine API mismatch */ }
        return null;
      };
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-map-slot__control") : null;
        if (!btn || !this.contains(btn)) return;
        this.dispatchEvent(new CustomEvent("contour:map-control", { bubbles: true, composed: true, detail: { control: btn.textContent } }));
      });
    }
  }
  define("contour-map-area", ContourMapArea);
class ContourMapPanel extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
     render() {
      this.classList.add("c-map-panel");
      if (!this.hasAttribute("role")) this.setAttribute("role", "region");
      const title = this.getAttribute("title");
      if (title) {
        if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", title);
      } else {
        if (this.getAttribute("aria-label") === this.getAttribute("title")) this.removeAttribute("aria-label");
      }
    }
  }
  define("contour-map-panel", ContourMapPanel);
class ContourMapFooter extends ContourBase {
    static get observed() { return ["brand"]; }
    static get properties() { return { brand: { attribute: "brand" } }; }
     render() {
      this.classList.add("c-map-footer");
      if (!this.hasAttribute("role")) this.setAttribute("role", "contentinfo");
      const brand = this.getAttribute("brand");
      // The footer's own rule is `.c-map-footer > *`, which reaches any direct
      // child, so the brand is a plain span: visible, and inventing no name.
      if (brand) {
        const b = this.ensure("[data-map-footer-brand]", () => { const el = document.createElement("span"); el.setAttribute("data-map-footer-brand", ""); return el; });
        b.textContent = brand;
      } else {
        const b = this.querySelector("[data-map-footer-brand]");
        if (b) b.remove();
      }
    }
  }
  define("contour-map-footer", ContourMapFooter);
class ContourScaleBar extends ContourBase {
    static get observed() { return ["label", "value", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-scale-bar");
      wireStates(this);
      loadRemote(this, ["label", "value"]);
      if (renderStates(this, "scale-bar")) return;
      const label = remoteData(this, "label") || (this._remoteData && this._remoteData.label);
      if (label) {
        const l = this.ensure(".c-scale-bar__label", () => { const el = document.createElement("span"); el.className = "c-scale-bar__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-scale-bar__label");
        if (l) l.remove();
      }
      const value = remoteData(this, "value") || (this._remoteData && this._remoteData.value);
      if (!value) {
        renderEmpty(this, "scale-bar");
        return;
      }
      const line = this.ensure(".c-scale-bar__line", () => { const el = document.createElement("span"); el.className = "c-scale-bar__line"; return el; });
        // CSS lengths need a unit; a bare number would be dropped as an invalid
        // property value and the bar would render at zero width.
        line.style.inlineSize = /^\d+(\.\d+)?$/.test(String(value)) ? value + "px" : value;
        const ticks = scaleBarTicks(parseFloat(value) || 0, 4);
        const max = ticks[ticks.length - 1] || 1;
        Array.from(line.querySelectorAll(".c-scale-bar__tick")).forEach((t) => t.remove());
        ticks.forEach((tv) => {
          const tick = document.createElement("span");
          tick.className = "c-scale-bar__tick";
          // Logical (BY-48): insetInlineStart mirrors the bar in RTL instead of
          // pinning the tick to the physical left edge.
          tick.style.insetInlineStart = ((tv / max) * 100) + "%";
          line.appendChild(tick);
        });
    }
  }
define("contour-scale-bar", ContourScaleBar);
