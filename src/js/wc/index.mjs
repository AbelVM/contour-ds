// Entry point for the web-component modules. Importing this module registers
// every Contour custom element as a side effect.

import { REGISTERED } from "./core.mjs";
import "./core.mjs";
import "./behaviours.mjs";
import "./states.mjs";
import "./content.mjs";
import "./dashboard.mjs";
import "./data.mjs";
import "./docs.mjs";
import "./feedback.mjs";
import "./forms.mjs";
import "./interaction.mjs";
import "./layout.mjs";
import "./map.mjs";
import "./misc.mjs";
import "./navigation.mjs";
import "./ui.mjs";
import "./registration.mjs";
import "./shadow.mjs";

// Published version + readiness signal. Fires after every fragment has run, so
// a consumer listening for `contour:ready` can assume the full registry exists.
export const CONTOUR_VERSION = "1.0.0";
if (typeof window !== "undefined") {
  window.ContourVersion = CONTOUR_VERSION;
  queueMicrotask(() => {
    try {
      window.dispatchEvent(new CustomEvent("contour:ready", {
        detail: { version: CONTOUR_VERSION, count: REGISTERED.length },
      }));
    } catch (e) { /* ignore */ }
  });
}
