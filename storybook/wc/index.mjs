/**
 * Contour web-component entry point.
 * Importing this module registers every light-DOM and shadow-DOM element.
 * NOTE: This is the all-in convenience bundle (~740 kB minified).
 * For production, prefer importing individual family bundles:
 * `contour-ds/wc/<family>.mjs` (e.g. `contour-ds/wc/forms.mjs`, `contour-ds/wc/data.mjs`).
 * @module contour-wc
 */

import { REGISTERED } from "./core.mjs";
import { formatValue } from "./core.mjs";
import { MARKER_SHAPES, markerStyles, assignMarkers } from "./svg.mjs";
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
import { SHADOW_MARKUP, renderShadowDSD } from "./shadow.mjs";
export { SHADOW_MARKUP, renderShadowDSD };

// Published version + readiness signal. Fires after every fragment has run, so
// a consumer listening for `contour:ready` can assume the full registry exists.
// The version is stamped from package.json at build time (tools/build.mjs
// `stampVersion`); the literal here is the source-time fallback and is never
// shipped — the build replaces it with the package.json version.
/** Published component runtime version. */
export const CONTOUR_VERSION = "1.8.1";
if (typeof window !== "undefined") {
  window.ContourVersion = CONTOUR_VERSION;
  if (!window.Contour) {
    window.Contour = {
      format: {
        value: formatValue,
        number: (value, format, locale) => formatValue(value, format, locale),
        time: (value, locale) => {
          try { return new Intl.DateTimeFormat(locale || undefined).format(new Date(value)); } catch (e) { return String(value); }
        },
        locale: (locale) => locale || (typeof navigator !== "undefined" ? navigator.language : "en"),
      },
      markers: {
        shapes: MARKER_SHAPES,
        styles: markerStyles,
        assign: assignMarkers,
      },
    };
  } else {
    // ds.js may have already published window.Contour (frozen); top up
    // non-frozen namespaces only when writable.
    try { if (!window.Contour.format) window.Contour.format = { value: formatValue, number: (v, f, l) => formatValue(v, f, l), time: (v, l) => { try { return new Intl.DateTimeFormat(l || undefined).format(new Date(v)); } catch (e) { return String(v); } }, locale: (l) => l || (typeof navigator !== "undefined" ? navigator.language : "en") }; } catch (e) {}
    try { if (!window.Contour.markers) window.Contour.markers = { shapes: MARKER_SHAPES, styles: markerStyles, assign: assignMarkers }; } catch (e) {}
  }
  queueMicrotask(() => {
    try {
      window.dispatchEvent(new CustomEvent("contour:ready", {
        detail: { version: CONTOUR_VERSION, count: REGISTERED.length },
      }));
    } catch (e) { /* ignore */ }
  });
}
