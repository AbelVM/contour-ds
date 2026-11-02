import { expect } from "storybook/test";
import "../dist/wc/data.mjs";

const ITEMS = JSON.stringify([
  { key: "parks", label: "Parks", color: "#2f8f83", shape: "circle" },
  { key: "roads", label: "Roads", color: "#d97757", shape: "line" },
  { key: "water", label: "Water", color: "#61758a", shape: "square" },
]);

export default {
  title: "Contour/Data/Legend",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" }, a11y: { test: "todo" }, issue: "SB-A11Y-02", a11yTodo: { owner: "Contour maintainers", rootCause: "legend semantics depend on chart context", mitigation: "verify with chart and data-table composition", review: "2026-12-01" } },
};

export const Selectable = {
  render: () => {
    const legend = document.createElement("contour-legend");
    legend.setAttribute("title", "Map layers");
    legend.setAttribute("items", ITEMS);
    legend.setAttribute("selectable", "");
    legend.setAttribute("caption", "Toggle visible map layers");
    return legend;
  },
  play: async ({ canvasElement }) => {
    const legend = canvasElement.querySelector("contour-legend");
    const items = legend.querySelectorAll(".c-legend__item");
    await expect(items.length).toBe(3);
    await expect(items[0]).toHaveAttribute("aria-pressed", "true");
    items[0].click();
    await expect(items[0]).toHaveAttribute("aria-pressed", "false");
  },
};

export const Continuous = {
  render: () => {
    const legend = document.createElement("contour-legend");
    legend.setAttribute("title", "Population density");
    legend.setAttribute("continuous", "");
    legend.setAttribute("ends", JSON.stringify(["Low", "High"]));
    legend.setAttribute("ramp", "linear-gradient(90deg, #dcefe9, #2f8f83)");
    legend.setAttribute("classification", "Quantile");
    return legend;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector(".c-legend__ramp")).toBeTruthy();
    await expect(canvasElement.querySelector(".c-legend__classification")).toHaveTextContent("Quantile");
  },
};