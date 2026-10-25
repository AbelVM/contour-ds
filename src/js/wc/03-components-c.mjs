import { ContourBase, define } from './00-core.mjs';
  // ---- Additional map-native and chart components ----

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

  class ContourComparison extends ContourBase {
    render() {
      this.classList.add("c-comparison");
    }
  }
  define("contour-comparison", ContourComparison);

  class ContourHexbin extends ContourBase {
    render() {
      this.classList.add("c-hexbin");
    }
  }
  define("contour-hexbin", ContourHexbin);


