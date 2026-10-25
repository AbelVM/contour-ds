import { ContourBase, define } from './core.mjs';
class ContourMinimap extends ContourBase {
    render() {
      this.classList.add("c-minimap");
    }
  }
  define("contour-minimap", ContourMinimap);
class ContourCoordinate extends ContourBase {
    render() {
      this.classList.add("c-coordinate");
      const value = this.getAttribute("value");
      if (value) {
        const span = this.ensure(".c-coordinate__value", () => { const el = document.createElement("span"); el.className = "c-coordinate__value"; return el; });
        span.textContent = value;
      } else {
        const span = this.querySelector(".c-coordinate__value");
        if (span) span.remove();
      }
    }
  }
  define("contour-coordinate", ContourCoordinate);
class ContourLayerPanel extends ContourBase {
    render() {
      this.classList.add("c-layer-panel");
    }
  }
  define("contour-layer-panel", ContourLayerPanel);
class ContourTimeSlider extends ContourBase {
    render() {
      this.classList.add("c-time-slider");
    }
  }
  define("contour-time-slider", ContourTimeSlider);
class ContourHexbin extends ContourBase {
    render() {
      this.classList.add("c-hexbin");
    }
  }
  define("contour-hexbin", ContourHexbin);
class ContourFlowMap extends ContourBase {
    render() { this.classList.add("c-flow-map"); }
  }
  define("contour-flow-map", ContourFlowMap);
class ContourIsochrone extends ContourBase {
    render() { this.classList.add("c-isochrone"); }
  }
  define("contour-isochrone", ContourIsochrone);
class ContourCatchment extends ContourBase {
    render() { this.classList.add("c-catchment"); }
  }
  define("contour-catchment", ContourCatchment);
class ContourCompassFull extends ContourBase {
    render() { this.classList.add("c-compass"); }
  }
  define("contour-compass", ContourCompassFull);
class ContourLayerSwitch extends ContourBase {
    render() {
      this.classList.add("c-layer-switch");
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          parsed.forEach((it) => {
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
            toggle.textContent = "Toggle";
            item.appendChild(toggle);
            this.appendChild(item);
          });
        } catch (e) { /* keep existing */ }
      }
    }
  }
  define("contour-layer-switch", ContourLayerSwitch);
class ContourMapSlot extends ContourBase {
    render() {
      this.classList.add("c-map-slot");
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
    render() {
      this.classList.add("c-map-area");
      const attribution = this.getAttribute("attribution");
      if (attribution) {
        const a = this.ensure(".c-map-area__attribution", () => { const el = document.createElement("div"); el.className = "c-map-area__attribution"; return el; });
        a.textContent = attribution;
      } else {
        const a = this.querySelector(".c-map-area__attribution");
        if (a) a.remove();
      }
      const mark = this.getAttribute("attribution-mark");
      if (mark) {
        const m = this.ensure(".c-map-area__attribution-mark", () => { const el = document.createElement("span"); el.className = "c-map-area__attribution-mark"; return el; });
        m.textContent = mark;
      } else {
        const m = this.querySelector(".c-map-area__attribution-mark");
        if (m) m.remove();
      }
      const scale = this.getAttribute("scale");
      if (scale) {
        const sc = this.ensure(".c-map-area__scale", () => { const el = document.createElement("div"); el.className = "c-map-area__scale"; return el; });
        sc.textContent = scale;
      } else {
        const sc = this.querySelector(".c-map-area__scale");
        if (sc) sc.remove();
      }
      const controls = this.getAttribute("controls");
      if (controls) {
        try {
          const parsed = JSON.parse(controls);
          const wrap = this.ensure(".c-map-area__controls", () => { const el = document.createElement("div"); el.className = "c-map-area__controls"; return el; });
          wrap.innerHTML = "";
          parsed.forEach((c) => {
            const btn = document.createElement("button");
            btn.className = "c-map-area__control";
            btn.type = "button";
            btn.textContent = typeof c === "string" ? c : (c.label || c);
            wrap.appendChild(btn);
          });
        } catch (e) { /* keep existing */ }
      } else {
        const w = this.querySelector(".c-map-area__controls");
        if (w) w.remove();
      }
    }
  }
  define("contour-map-area", ContourMapArea);
class ContourMapPanel extends ContourBase {
    render() {
      this.classList.add("c-map-panel");
      const title = this.getAttribute("title");
      if (title) {
        const h = this.ensure(".c-map-panel__title", () => { const el = document.createElement("h3"); el.className = "c-map-panel__title"; return el; });
        if (h.parentNode === this && this.firstChild !== h) this.prepend(h);
        h.textContent = title;
      } else {
        const h = this.querySelector(".c-map-panel__title");
        if (h) h.remove();
      }
    }
  }
  define("contour-map-panel", ContourMapPanel);
class ContourMapFooter extends ContourBase {
    render() {
      this.classList.add("c-map-footer");
      const brand = this.getAttribute("brand");
      if (brand) {
        const b = this.ensure(".c-map-footer__brand", () => { const el = document.createElement("span"); el.className = "c-map-footer__brand"; return el; });
        b.textContent = brand;
      } else {
        const b = this.querySelector(".c-map-footer__brand");
        if (b) b.remove();
      }
    }
  }
  define("contour-map-footer", ContourMapFooter);
class ContourScaleBar extends ContourBase {
    render() {
      this.classList.add("c-scale-bar");
      const label = this.getAttribute("label");
      if (label) {
        const l = this.ensure(".c-scale-bar__label", () => { const el = document.createElement("span"); el.className = "c-scale-bar__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-scale-bar__label");
        if (l) l.remove();
      }
    }
  }
  define("contour-scale-bar", ContourScaleBar);
