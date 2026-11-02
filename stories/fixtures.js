const sampleRows = [
  { key: "Distance", value: "4.8 km" },
  { key: "Time", value: "19 min" },
];

export const fixtures = {
  "contour-alert": { title: "Route updated", body: "North loop is ready." },
  "contour-accordion": { items: JSON.stringify([{ title: "North loop", body: "842 pedestrians" }]) },
  "contour-activity": { items: JSON.stringify([{ text: "Route opened", time: "09:42" }]) },
  "contour-breadcrumb": { items: JSON.stringify(["Routes", "North loop"]) },
  "contour-bivariate": { data: JSON.stringify([[12, 18], [20, 27]]) },
  "contour-bivariate-legend": { items: JSON.stringify(["Low", "High"]) },
  "contour-category": { items: JSON.stringify(["North", "South", "Harbor"]) },
  "contour-chart": {
    series: JSON.stringify([{ name: "Volume", values: [12, 18, 15, 23, 28] }]),
    axis: JSON.stringify({ x: ["Mon", "Tue", "Wed", "Thu", "Fri"] }),
    "data-table": "true",
  },
  "contour-code-tabs": { tabs: JSON.stringify(["JavaScript", "CSS"]) },
  "contour-command": { items: JSON.stringify(["Open route", "Duplicate route"]) },
  "contour-combobox": { options: JSON.stringify(["North loop", "Harbor path"]) },
  "contour-docs-nav": { items: JSON.stringify([{ label: "Overview", href: "#overview" }]) },
  "contour-donut": { items: JSON.stringify([{ label: "Open", value: 64 }, { label: "Review", value: 36 }]) },
  "contour-faq": { items: JSON.stringify([{ question: "What changed?", answer: "The route is ready." }]) },
  "contour-flow-map": { nodes: JSON.stringify([{ id: "north", label: "North" }, { id: "harbor", label: "Harbor" }]) },
  "contour-gauge": { value: "72", max: "100", label: "CPU" },
  "contour-heatmap": { cells: "9", values: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9]) },
  "contour-hexbin": { cells: JSON.stringify([[1, 2], [3, 5], [4, 3]]) },
  "contour-instrument": { rows: JSON.stringify(sampleRows) },
  "contour-isochrone": { rings: JSON.stringify([{ value: 5 }, { value: 10 }]) },
  "contour-kpi": { value: "12,480", label: "Active routes", delta: "+8.4%", direction: "up" },
  "contour-landing-features": { items: JSON.stringify([{ title: "Reliable", text: "Stable route data." }]) },
  "contour-layer-panel": { items: JSON.stringify([{ name: "North loop", visible: true }, { name: "Harbor path", visible: false }]) },
  "contour-layer-switch": { items: JSON.stringify([{ id: "north", label: "North loop", visible: true }]) },
  "contour-legend": { items: JSON.stringify([{ label: "Low", color: "var(--chart-1)" }, { label: "High", color: "var(--chart-2)" }]) },
  "contour-metrics": { items: JSON.stringify([{ label: "Volume", value: "842" }]) },
  "contour-menu": { items: JSON.stringify(["Open", "Duplicate", "Remove"]) },
  "contour-pagination": { pages: "3" },
  "contour-pivot": { data: JSON.stringify([{ route: "North loop", volume: 842 }, { route: "Harbor path", volume: 617 }]) },
  "contour-radio-list": { items: JSON.stringify(["North loop", "Harbor path"]) },
  "contour-readout": { rows: JSON.stringify(sampleRows) },
  "contour-scale": { values: JSON.stringify([0, 25, 50, 75, 100]) },
  "contour-sparkline": { points: JSON.stringify([1, 3, 2, 5, 4, 6]) },
  "contour-stacked-bar": { segments: JSON.stringify([{ label: "Open", value: 64 }, { label: "Review", value: 36 }]) },
  "contour-steps": { steps: JSON.stringify([{ title: "Plan", body: "Choose a route." }, { title: "Review", body: "Confirm the result." }]) },
  "contour-streaming-chart": { line: "true", dot: "true" },
  "contour-survey": { date: "2026-11-02", instrument: "Pedestrian count" },
  "contour-table": {
    columns: JSON.stringify(["Route", "Volume", "Status"]),
    rows: JSON.stringify([["North loop", 842, "Open"], ["Harbor path", 617, "Review"]]),
  },
  "contour-tabs": { tabs: JSON.stringify(["Overview", "Activity"]) },
  "contour-time-series": { values: JSON.stringify([12, 18, 15, 23, 28]) },
  "contour-timeline": { items: JSON.stringify([{ title: "Route opened", text: "North loop", time: "09:42" }]) },
  "contour-tree": { items: JSON.stringify([{ label: "Routes", children: ["North loop", "Harbor path"] }]) },
  "contour-toc": { items: JSON.stringify([{ label: "Overview", href: "#overview" }]) },
};

const textFixtures = {
  label: "North loop",
  title: "Route overview",
  text: "A representative Contour component.",
  value: "42",
};

export function applyFixture(element, tag) {
  const attributes = { ...textFixtures, ...(fixtures[tag] || {}) };
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (!element.textContent.trim()) element.textContent = "North loop";
  return element;
}