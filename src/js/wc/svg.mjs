/* ============================================================================
   CONTOUR — SVG geometry helpers (pure functions, zero dependencies)
   ----------------------------------------------------------------------------
   Lightweight path generators for the spatial chart variants that Contour's
   CSS already styles (.c-chart--donut, .c-chart--histogram, .c-sparkline).
   They return strings suitable for an SVG `d` attribute or a list of
   {x, y, width, height} rectangles, so a consumer never has to hand-compute
   arc math or bar widths for a basic cartographic control.

   Every function is pure: no DOM, no state, no side effects. They are
   exported so a consumer can import them directly, and the chart component
   uses them when its `series` attribute carries structured data rather than
   a pre-computed path string.
   ========================================================================= */
"use strict";

/**
 * Build an SVG arc path for a single donut slice.
 *
 * @param {number} cx centre x
 * @param {number} cy centre y
 * @param {number} r  outer radius
 * @param {number} inner inner radius (0 for a pie)
 * @param {number} startAngle start angle in radians
 * @param {number} endAngle   end angle in radians
 * @returns {string} SVG path `d` attribute
 */
export function arcPath(cx, cy, r, inner, startAngle, endAngle) {
  // Clamp non-finite inputs so a bad value cannot emit NaN/Infinity into the
  // path string (B3-22). A degenerate slice collapses to a point.
  cx = Number.isFinite(cx) ? cx : 0;
  cy = Number.isFinite(cy) ? cy : 0;
  r = Number.isFinite(r) && r > 0 ? r : 0;
  inner = Number.isFinite(inner) && inner >= 0 ? inner : 0;
  startAngle = Number.isFinite(startAngle) ? startAngle : 0;
  endAngle = Number.isFinite(endAngle) ? endAngle : 0;
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  if (inner <= 0) {
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }
  const ix1 = cx + inner * Math.cos(endAngle);
  const iy1 = cy + inner * Math.sin(endAngle);
  const ix2 = cx + inner * Math.cos(startAngle);
  const iy2 = cy + inner * Math.sin(startAngle);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${inner} ${inner} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
}

/**
 * Convert a list of values into donut slice paths.
 *
 * @param {number[]} values
 * @param {object} [opts]
 * @param {number} [opts.cx=100]
 * @param {number} [opts.cy=100]
 * @param {number} [opts.r=90]
 * @param {number} [opts.inner=55]
 * @param {number} [opts.gap=0.02] angular gap between slices in radians
 * @returns {{path: string, value: number, index: number}[]}
 */
export function donutSlices(values, opts) {
  opts = opts || {};
  const cx = opts.cx != null ? opts.cx : 100;
  const cy = opts.cy != null ? opts.cy : 100;
  const r = opts.r != null ? opts.r : 90;
  const inner = opts.inner != null ? opts.inner : 55;
  const gap = opts.gap != null ? opts.gap : 0.02;
  const total = values.reduce((a, b) => a + (Number(b) || 0), 0) || 1;
  let angle = -Math.PI / 2;
  const out = [];
  values.forEach((v, i) => {
    const frac = (Number(v) || 0) / total;
    const sweep = frac * Math.PI * 2 - gap;
    const start = angle + gap / 2;
    const end = start + Math.max(0, sweep);
    out.push({ path: arcPath(cx, cy, r, inner, start, end), value: Number(v) || 0, index: i });
    angle += frac * Math.PI * 2;
  });
  return out;
}

/**
 * Compute bar rectangles for a histogram.
 *
 * @param {number[]} values
 * @param {object} [opts]
 * @param {number} [opts.width=300]
 * @param {number} [opts.height=120]
 * @param {number} [opts.gap=2]
 * @param {number} [opts.max] override max value (defaults to max of values)
 * @returns {{x:number,y:number,width:number,height:number}[]}
 */
export function barRects(values, opts) {
  opts = opts || {};
  const width = opts.width != null ? opts.width : 300;
  const height = opts.height != null ? opts.height : 120;
  const gap = opts.gap != null ? opts.gap : 2;
  const max = opts.max != null ? opts.max : (Math.max.apply(null, values.map((v) => Number(v) || 0)) || 1);
  if (!Number.isFinite(max) || max <= 0) return values.map(() => ({ x: 0, y: height, width: 0, height: 0 }));
  const n = values.length || 1;
  const slot = width / n;
  const barW = Math.max(1, slot - gap);
  return values.map((v, i) => {
    const h = ((Number(v) || 0) / max) * height;
    return { x: i * slot + gap / 2, y: height - h, width: barW, height: h };
  });
}

/**
 * Build an SVG polyline `points` attribute from a list of numbers.
 *
 * @param {number[]} values
 * @param {object} [opts]
 * @param {number} [opts.width=300]
 * @param {number} [opts.height=120]
 * @param {number} [opts.max] override max
 * @param {number} [opts.min] override min
 * @returns {string} "x,y x,y ..."
 */
export function polylinePoints(values, opts) {
  opts = opts || {};
  const width = opts.width != null ? opts.width : 300;
  const height = opts.height != null ? opts.height : 120;
  const nums = values.map((v) => Number(v) || 0);
  if (!nums.length) return "";
  const max = opts.max != null ? opts.max : Math.max.apply(null, nums);
  const min = opts.min != null ? opts.min : Math.min.apply(null, nums);
  const range = (Number.isFinite(max - min) && (max - min) !== 0) ? (max - min) : 1;
  const n = nums.length || 1;
  return nums.map((v, i) => {
    const x = (i / Math.max(1, n - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return x.toFixed(2) + "," + y.toFixed(2);
  }).join(" ");
}

/**
 * Build a smooth (monotone) SVG path through a list of numbers.
 *
 * @param {number[]} values
 * @param {object} [opts] same as polylinePoints
 * @returns {string} SVG path `d` attribute
 */
export function smoothPath(values, opts) {
  const pts = polylinePoints(values, opts).split(" ").map((p) => p.split(",").map(Number));
  if (!pts.length) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const cpx = (prev[0] + cur[0]) / 2;
    d += ` C ${cpx} ${prev[1]}, ${cpx} ${cur[1]}, ${cur[0]} ${cur[1]}`;
  }
  return d;
}

/**
 * Build an SVG path for a compass needle pointing at `angleDeg` (clockwise
 * from north/up). The needle is a thin triangle from the centre to the tip,
 * with a short tail in the opposite direction.
 *
 * @param {number} cx centre x
 * @param {number} cy centre y
 * @param {number} length needle length (tip distance from centre)
 * @param {number} [angleDeg=0] bearing in degrees, clockwise from up
 * @param {number} [width=3] half-width of the needle at the base
 * @returns {string} SVG path `d` attribute
 */
export function compassNeedle(cx, cy, length, angleDeg, width) {
  angleDeg = angleDeg == null ? 0 : angleDeg;
  width = width == null ? 3 : width;
  const a = (angleDeg - 90) * Math.PI / 180; // 0deg = up
  const tipX = cx + length * Math.cos(a);
  const tipY = cy + length * Math.sin(a);
  const tail = length * 0.25;
  const tailX = cx - tail * Math.cos(a);
  const tailY = cy - tail * Math.sin(a);
  const perpX = Math.cos(a + Math.PI / 2);
  const perpY = Math.sin(a + Math.PI / 2);
  const b1x = cx + width * perpX;
  const b1y = cy + width * perpY;
  const b2x = cx - width * perpX;
  const b2y = cy - width * perpY;
  return `M ${tipX.toFixed(2)} ${tipY.toFixed(2)} L ${b1x.toFixed(2)} ${b1y.toFixed(2)} L ${tailX.toFixed(2)} ${tailY.toFixed(2)} L ${b2x.toFixed(2)} ${b2y.toFixed(2)} Z`;
}

/**
 * Compute tick values for a scale bar.
 *
 * @param {number} value total value (max)
 * @param {number} [segments=4] number of segments
 * @returns {number[]} tick values from 0 to value inclusive
 */
export function scaleBarTicks(value, segments) {
  value = Number(value) || 0;
  segments = Math.max(1, Math.round(segments || 4));
  const out = [];
  for (let i = 0; i <= segments; i++) {
    out.push((value / segments) * i);
  }
  return out;
}