import { ContourBase, define } from './00-core.mjs';
  // ---- Additional complex components with scaffolding ----

  // Survey: generates from date and instrument attributes.
  class ContourSurvey extends ContourBase {
    render() {
      this.classList.add("c-survey");
      const date = this.getAttribute("date");
      const instrument = this.getAttribute("instrument");
      if (date) {
        const v = document.createElement("span");
        v.className = "c-survey__value";
        v.textContent = date;
        this.appendChild(document.createTextNode("Surveyed "));
        this.appendChild(v);
        if (instrument) {
          const sep = document.createElement("span");
          sep.className = "c-survey__sep";
          sep.textContent = "·";
          this.appendChild(sep);
          const v2 = document.createElement("span");
          v2.className = "c-survey__value";
          v2.textContent = instrument;
          this.appendChild(v2);
        }
      }
    }
  }
  define("contour-survey", ContourSurvey);

  // Threshold: generates from value and label.
  class ContourThreshold extends ContourBase {
    render() {
      this.classList.add("c-threshold");
      const value = this.getAttribute("value");
      const label = this.getAttribute("label");
      if (value) {
        const v = this.ensure(".c-threshold__value", () => { const el = document.createElement("span"); el.className = "c-threshold__value"; return el; });
        v.textContent = value;
      } else {
        const v = this.querySelector(".c-threshold__value");
        if (v) v.remove();
      }
      if (label) {
        const l = this.ensure(".c-threshold__label", () => { const el = document.createElement("span"); el.className = "c-threshold__label"; return el; });
        l.textContent = label;
      } else {
        const l = this.querySelector(".c-threshold__label");
        if (l) l.remove();
      }
    }
  }
  define("contour-threshold", ContourThreshold);

  // Expandable: already defined above.

  // Deltas: already defined above.

  // Stat: already defined above.

  // Instrument: already defined above.

  // Bivariate: already defined above.


