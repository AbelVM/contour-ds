import { expect } from "storybook/test";
import "../dist/wc/data.mjs";

export default {
  title: "Contour/Compositions/ChartLegend",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "composition" } },
};

export const ChartWithLegend = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "1rem";
    const chart = document.createElement("contour-chart");
    chart.setAttribute("axis", "Weekly volume");
    chart.setAttribute("series", JSON.stringify([{ label: "Volume", type: "bar", values: [10, 20, 15] }]));
    const legend = document.createElement("contour-legend");
    legend.setAttribute("items", JSON.stringify([{ label: "Volume", color: "var(--chart-1)" }, { label: "Target", color: "var(--chart-2)" }]));
    wrap.append(chart, legend);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const chart = canvasElement.querySelector("contour-chart");
    const legend = canvasElement.querySelector("contour-legend");
    await expect(chart).toBeTruthy();
    await expect(legend).toBeTruthy();
    // The chart must paint its series, not fall through to the empty branch:
    // `data=` is not an attribute ContourChart reads, so a chart fed that way
    // renders "No data" and the composition certifies nothing.
    await expect(chart.querySelector(".c-chart__empty")).toBeNull();
    await expect(chart.querySelectorAll(".c-chart__bar").length).toBe(3);
    await expect(legend.textContent).toContain("Volume");
    await expect(legend.textContent).toContain("Target");
  },
};

export const LegendToggleEmitsIntent = {
  render: () => {
    const wrap = document.createElement("div");
    const legend = document.createElement("contour-legend");
    legend.setAttribute("selectable", "");
    legend.setAttribute("items", JSON.stringify([{ label: "A", key: "a", color: "var(--chart-1)" }, { label: "B", key: "b", color: "var(--chart-2)" }]));
    const status = document.createElement("p");
    status.id = "comp-legend-status";
    status.textContent = "none";
    // ContourLegend emits `contour:legend-toggle` (and `contour:select`), not
    // `contour:toggle`. A listener on the wrong name passes a presence check
    // while certifying an event no component dispatches.
    wrap.addEventListener("contour:legend-toggle", (e) => {
      status.textContent = `${e.detail.key}:${e.detail.pressed}`;
    });
    wrap.append(legend, status);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const legend = canvasElement.querySelector("contour-legend");
    const status = canvasElement.querySelector("#comp-legend-status");
    const item = legend.querySelector(".c-legend__item");
    await expect(item).toBeTruthy();
    item.click();
    await expect(status.textContent).toBe("a:false");
    await expect(item).toHaveAttribute("aria-pressed", "false");
  },
};
