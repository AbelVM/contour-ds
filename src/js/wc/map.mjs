import { ContourBase, define } from './core.mjs';
import { loadRemote, remoteData, renderStates, renderEmpty, wireStates } from './states.mjs';
import { compassNeedle, scaleBarTicks } from './svg.mjs';
class ContourMinimap extends ContourBase {
    static get observed() { return ["label", "viewport", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, viewport: { attribute: "viewport" } }; }
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
  }
define("contour-minimap", ContourMinimap);
class ContourCoordinate extends ContourBase {
    static get observed() { return ["value", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { value: { attribute: "value" } }; }
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
      const span = this.ensure(".c-coordinate__value", () => { const el = document.createElement("span"); el.className = "c-coordinate__value"; return el; });
      span.textContent = value;
    }
  }
define("contour-coordinate", ContourCoordinate);
class ContourLayerPanel extends ContourBase {
    static get observed() { return ["label", "items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, items: { attribute: "items" } }; }
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
      if (items) {
        try {
          const parsed = JSON.parse(items);
          Array.from(this.querySelectorAll(".c-layer-panel__item")).forEach((el) => el.remove());
          parsed.forEach((it) => {
            const name = typeof it === "string" ? it : (it.name || it.label || "");
            const item = document.createElement("div");
            item.className = "c-layer-panel__item" + (it.dragging ? " c-layer-panel__item--dragging" : "");
             const toggle = document.createElement("input");
             toggle.type = "checkbox";
             toggle.className = "c-layer-panel__toggle";
             toggle.setAttribute("aria-label", "Toggle layer");
             if (typeof it === "object" && it.visible !== false) toggle.checked = true;
            item.appendChild(toggle);
            const nm = document.createElement("span");
            nm.className = "c-layer-panel__name";
            nm.textContent = name;
            item.appendChild(nm);
             const opacity = document.createElement("input");
             opacity.type = "range";
             opacity.className = "c-layer-panel__opacity";
             opacity.min = "0";
             opacity.max = "100";
             opacity.setAttribute("aria-label", "Opacity");
             opacity.value = (typeof it === "object" && it.opacity != null) ? it.opacity : "100";
            item.appendChild(opacity);
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      } else {
        Array.from(this.querySelectorAll(".c-layer-panel__item")).forEach((el) => el.remove());
        renderEmpty(this, "layer-panel");
      }
    }
  }
define("contour-layer-panel", ContourLayerPanel);
class ContourTimeSlider extends ContourBase {
    static get observed() { return ["label", "value"]; }
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" } }; }
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
      track.value = this.getAttribute("value") || "0";
      track.setAttribute("aria-label", this.getAttribute("label") || "Time");
      const time = this.ensure(".c-time-slider__time", () => { const el = document.createElement("span"); el.className = "c-time-slider__time"; return el; });
      time.textContent = this.getAttribute("label") || "";
    }
    enhance() {
      if (this._wiredTimeSlider) return;
      this._wiredTimeSlider = true;
      this.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".c-time-slider__play") : null;
        if (!btn) return;
        const playing = btn.getAttribute("data-state") === "play";
        btn.setAttribute("data-state", playing ? "pause" : "play");
        btn.setAttribute("aria-label", playing ? "Pause" : "Play");
        const use = btn.querySelector("use");
        if (use) use.setAttribute("href", playing ? "#i-pause" : "#i-play");
      });
    }
  }
  define("contour-time-slider", ContourTimeSlider);
class ContourHexbin extends ContourBase {
    static get observed() { return ["label", "cells", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, cells: { attribute: "cells" } }; }
    render() {
      this.classList.add("c-hexbin");
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
      if (effectiveCells) {
       try {
         const parsed = JSON.parse(effectiveCells);
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
      } else {
        Array.from(this.querySelectorAll(".c-hexbin__cell")).forEach((n) => n.remove());
        renderEmpty(this, "hexbin");
      }
     }
    enhance() {
      if (this._wiredHexbin) return;
      this._wiredHexbin = true;
      // Per-event re-query (rule 12): the tip is rebuilt on every render, so a
      // capture at wiring time is a detached node after the first change.
      const showTip = (e) => {
        const tip = this.querySelector(".c-hexbin__tooltip");
        if (!tip) return;
        const cell = e.target && e.target.closest ? e.target.closest(".c-hexbin__cell") : null;
        if (!cell || !this.contains(cell)) { tip.setAttribute("hidden", ""); return; }
        const title = cell.getAttribute("title");
        if (title) tip.textContent = title;
        const rect = this.getBoundingClientRect();
        const cr = cell.getBoundingClientRect();
        tip.style.left = (cr.left - rect.left + cr.width / 2) + "px";
        tip.style.top = (cr.top - rect.top) + "px";
        tip.removeAttribute("hidden");
      };
      const hideTip = () => {
        const tip = this.querySelector(".c-hexbin__tooltip");
        if (tip) tip.setAttribute("hidden", "");
      };
      this.addEventListener("mouseover", showTip);
      this.addEventListener("mouseout", (e) => {
        if (!e.relatedTarget || !this.contains(e.relatedTarget)) hideTip();
      });
      // Keyboard path (BY-39): the cells now carry roving tabindex.
      this.addEventListener("focusin", (e) => {
        const cell = e.target && e.target.closest ? e.target.closest(".c-hexbin__cell") : null;
        if (cell && this.contains(cell)) showTip({ target: cell });
      });
      this.addEventListener("focusout", (e) => {
        if (!this.contains(e.relatedTarget)) hideTip();
      });
    }
  }
define("contour-hexbin", ContourHexbin);
class ContourFlowMap extends ContourBase {
    static get observed() { return ["label", "nodes", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, nodes: { attribute: "nodes" } }; }
    render() {
      this.classList.add("c-flow-map");
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
      if (effectiveNodes) {
       try {
         const parsed = JSON.parse(effectiveNodes);
         Array.from(this.querySelectorAll(".c-flow-map__node, .c-flow-map__flow")).forEach((n) => n.remove());
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
      } else {
        Array.from(this.querySelectorAll(".c-flow-map__node, .c-flow-map__flow")).forEach((n) => n.remove());
        renderEmpty(this, "flow-map");
      }
     }
    enhance() {
      if (this._wiredFlowMap) return;
      this._wiredFlowMap = true;
      // Per-event re-query (rule 12): the tip is rebuilt on every render, so a
      // capture at wiring time is a detached node after the first change.
      const showTip = (e) => {
        const tip = this.querySelector(".c-flow-map__tooltip");
        if (!tip) return;
        const node = e.target && e.target.closest ? e.target.closest(".c-flow-map__node") : null;
        if (!node || !this.contains(node)) { tip.setAttribute("hidden", ""); return; }
        const title = node.getAttribute("title");
        if (title) tip.textContent = title;
        const rect = this.getBoundingClientRect();
        const nr = node.getBoundingClientRect();
        tip.style.left = (nr.left - rect.left + nr.width / 2) + "px";
        tip.style.top = (nr.top - rect.top) + "px";
        tip.removeAttribute("hidden");
      };
      const hideTip = () => {
        const tip = this.querySelector(".c-flow-map__tooltip");
        if (tip) tip.setAttribute("hidden", "");
      };
      this.addEventListener("mouseover", showTip);
      this.addEventListener("mouseout", (e) => {
        if (!e.relatedTarget || !this.contains(e.relatedTarget)) hideTip();
      });
      // Keyboard path (BY-39): the nodes now carry roving tabindex.
      this.addEventListener("focusin", (e) => {
        const node = e.target && e.target.closest ? e.target.closest(".c-flow-map__node") : null;
        if (node && this.contains(node)) showTip({ target: node });
      });
      this.addEventListener("focusout", (e) => {
        if (!this.contains(e.relatedTarget)) hideTip();
      });
    }
  }
define("contour-flow-map", ContourFlowMap);
class ContourIsochrone extends ContourBase {
    static get observed() { return ["label", "center", "rings", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, center: { attribute: "center" }, rings: { attribute: "rings" } }; }
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
      if (effectiveRings) {
         try {
           const parsed = JSON.parse(effectiveRings);
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
       } else {
         Array.from(this.querySelectorAll(".c-isochrone__ring")).forEach((n) => n.remove());
         renderEmpty(this, "isochrone");
       }
     }
    enhance() {
      if (this._wiredIsochrone) return;
      this._wiredIsochrone = true;
      // Per-event re-query (rule 12): the tip is rebuilt on every render, so a
      // capture at wiring time is a detached node after the first change.
      const showTip = (e) => {
        const tip = this.querySelector(".c-isochrone__tooltip");
        if (!tip) return;
        const ring = e.target && e.target.closest ? e.target.closest(".c-isochrone__ring") : null;
        if (!ring || !this.contains(ring)) { tip.setAttribute("hidden", ""); return; }
        const title = ring.getAttribute("title");
        if (title) tip.textContent = title;
        const rect = this.getBoundingClientRect();
        const rr = ring.getBoundingClientRect();
        tip.style.left = (rr.left - rect.left + rr.width / 2) + "px";
        tip.style.top = (rr.top - rect.top) + "px";
        tip.removeAttribute("hidden");
      };
      const hideTip = () => {
        const tip = this.querySelector(".c-isochrone__tooltip");
        if (tip) tip.setAttribute("hidden", "");
      };
      this.addEventListener("mouseover", showTip);
      this.addEventListener("mouseout", (e) => {
        if (!e.relatedTarget || !this.contains(e.relatedTarget)) hideTip();
      });
      // Keyboard path (BY-39): the rings now carry roving tabindex.
      this.addEventListener("focusin", (e) => {
        const ring = e.target && e.target.closest ? e.target.closest(".c-isochrone__ring") : null;
        if (ring && this.contains(ring)) showTip({ target: ring });
      });
      this.addEventListener("focusout", (e) => {
        if (!this.contains(e.relatedTarget)) hideTip();
      });
    }
  }
define("contour-isochrone", ContourIsochrone);
class ContourCatchment extends ContourBase {
    static get observed() { return ["label", "area", "center", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { label: { attribute: "label" }, area: { attribute: "area" }, center: { attribute: "center" } }; }
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
    static get properties() { return { label: { attribute: "label" }, needle: { attribute: "needle" } }; }
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
          this.appendChild(l);
        }
      }
      if (label && label.toLowerCase() !== "compass") {
        const l = this.ensure(".c-compass__label", () => { const el = document.createElement("span"); el.className = "c-compass__label"; return el; });
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
  }
define("contour-compass", ContourCompassFull);
class ContourLayerSwitch extends ContourBase {
    static get observed() { return ["items", "empty", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" } }; }
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
            const sw = document.createElement("span");
            sw.className = "c-layer-switch__swatch";
            if (it.color) sw.style.background = it.color;
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
            toggle.setAttribute("aria-label", "Toggle layer");
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
  }
  define("contour-map-area", ContourMapArea);
class ContourMapPanel extends ContourBase {
    static get observed() { return ["title"]; }
    static get properties() { return { title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-map-panel");
      const title = this.getAttribute("title");
      // `.c-map-panel` defines placement variants and no title element, so the
      // title names the region — a node carrying an invented class styled nothing.
      if (title) this.setAttribute("aria-label", title);
      else this.removeAttribute("aria-label");
    }
  }
  define("contour-map-panel", ContourMapPanel);
class ContourMapFooter extends ContourBase {
    static get observed() { return ["brand"]; }
    static get properties() { return { brand: { attribute: "brand" } }; }
    render() {
      this.classList.add("c-map-footer");
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
    static get properties() { return { label: { attribute: "label" }, value: { attribute: "value" } }; }
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
        line.style.inlineSize = value;
        const ticks = scaleBarTicks(parseFloat(value) || 0, 4);
        const max = ticks[ticks.length - 1] || 1;
        Array.from(line.querySelectorAll(".c-scale-bar__tick")).forEach((t) => t.remove());
        ticks.forEach((tv) => {
          const tick = document.createElement("span");
          tick.className = "c-scale-bar__tick";
          tick.style.left = ((tv / max) * 100) + "%";
          line.appendChild(tick);
        });
    }
  }
define("contour-scale-bar", ContourScaleBar);
