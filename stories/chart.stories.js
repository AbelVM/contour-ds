import { expect } from "storybook/test";
import "../dist/wc/data.mjs";
import { booleanControls } from "./metadata.js";

export default {
  title: "Contour/Data/Chart",
  tags: ["autodocs"],
  argTypes: {
    ...booleanControls("c-chart"),
    series: { control: "text" },
    axis: { control: "text" },
  },
  parameters: { contour: { maturity: "complete-widget" } },
};

const DATA = JSON.stringify({ labels: ["A", "B", "C"], values: [3, 7, 5] });
const SERIES = JSON.stringify([{ label: "Sales", type: "donut", values: [3, 7, 5] }]);

export const Default = {
  render: (args = {}) => {
    const chart = document.createElement("contour-chart");
    chart.setAttribute("type", args.type || "bar");
    chart.setAttribute("axis", args.axis || "Sales by category");
    chart.setAttribute("data", args.data || DATA);
    return chart;
  },
  play: async ({ canvasElement }) => {
    const chart = canvasElement.querySelector("contour-chart");
    await expect(chart).toBeTruthy();
    await expect(chart).toHaveClass(/c-chart/);
    await expect(chart).toHaveAttribute("aria-label", "Sales by category");
  },
};

export const Loading = {
  render: (args = {}) => {
    const chart = document.createElement("contour-chart");
    chart.setAttribute("type", "bar");
    chart.setAttribute("axis", "Sales by category");
    chart.setAttribute("loading", args.loading || "Loading chart…");
    return chart;
  },
  play: async ({ canvasElement }) => {
    const chart = canvasElement.querySelector("contour-chart");
    await expect(chart).toBeTruthy();
    await expect(chart).toHaveClass(/c-chart/);
    await expect(chart.textContent).toContain("Loading");
  },
};

export const Empty = {
  render: (args = {}) => {
    const chart = document.createElement("contour-chart");
    chart.setAttribute("type", "bar");
    chart.setAttribute("axis", "Sales by category");
    chart.setAttribute("empty", args.empty || "No data");
    return chart;
  },
  play: async ({ canvasElement }) => {
    const chart = canvasElement.querySelector("contour-chart");
    await expect(chart).toBeTruthy();
  },
};

export const DataTable = {
  render: (args = {}) => {
    const chart = document.createElement("contour-chart");
    chart.setAttribute("type", "bar");
    chart.setAttribute("axis", "Sales by category");
    chart.setAttribute("series", args.series || SERIES);
    chart.setAttribute("data-table", args["data-table"] || "true");
    return chart;
  },
  play: async ({ canvasElement }) => {
    const chart = canvasElement.querySelector("contour-chart");
    await new Promise((resolve) => setTimeout(resolve, 150));
    await expect(chart.querySelector(".c-chart__data-table")).toBeTruthy();
    await expect(chart.textContent).toContain("Sales");
    await expect(chart.textContent).toContain("3");
  },
};

export const Legend = {
  parameters: { a11y: { test: "todo" }, issue: "SB-A11Y-02", a11yTodo: { owner: "Contour maintainers", rootCause: "selectable legend dims inactive items via opacity, dropping contrast below 4.5:1", mitigation: "verify contrast in chart composition; consider color-based dimming", review: "2026-12-01" } },
  render: (args = {}) => {
    const legend = document.createElement("contour-legend");
    legend.setAttribute("title", "Routes");
    legend.setAttribute("selectable", "");
    legend.setAttribute("items", JSON.stringify([
      { key: "walking", label: "Walking", color: "var(--chart-1)" },
      { key: "cycling", label: "Cycling", color: "var(--chart-2)" },
    ]));
    return legend;
  },
  play: async ({ canvasElement }) => {
    const legend = canvasElement.querySelector("contour-legend");
    const item = legend.querySelector(".c-legend__item");
    await expect(item).toHaveAttribute("aria-pressed", "true");
    item.click();
    await expect(item).toHaveAttribute("aria-pressed", "false");
  },
};

export const Reactivity = {
  render: (args = {}) => {
    const chart = document.createElement("contour-chart");
    chart.setAttribute("type", args.type || "bar");
    chart.setAttribute("axis", args.axis || "Sales by category");
    chart.setAttribute("data", args.data || DATA);
    return chart;
  },
  play: async ({ canvasElement }) => {
    const chart = canvasElement.querySelector("contour-chart");
    await expect(chart).toHaveAttribute("aria-label", "Sales by category");
    chart.setAttribute("axis", "Updated axis");
    await expect(chart).toBeTruthy();
  },
};
