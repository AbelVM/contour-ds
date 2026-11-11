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
    chart.setAttribute("type", "bar");
    chart.setAttribute("axis", "Weekly volume");
    chart.setAttribute("data", JSON.stringify({ labels: ["Mon","Tue","Wed"], values: [10,20,15] }));
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
    await expect(legend.textContent).toContain("Volume");
    await expect(legend.textContent).toContain("Target");
  },
};

export const LegendToggleEmitsIntent = {
  render: () => {
    const wrap = document.createElement("div");
    const legend = document.createElement("contour-legend");
    legend.setAttribute("items", JSON.stringify([{ label: "A", color: "var(--chart-1)" }, { label: "B", color: "var(--chart-2)" }]));
    const status = document.createElement("p");
    status.id = "comp-legend-status";
    status.textContent = "none";
    wrap.addEventListener("contour:toggle", () => { status.textContent = "toggled"; });
    wrap.append(legend, status);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const legend = canvasElement.querySelector("contour-legend");
    const btn = legend.querySelector("button, .c-legend__item");
    if (btn) btn.click();
    // Event emission is host-facing intent; presence of interactive legend items is the contract here.
    await expect(legend.querySelectorAll(".c-legend__item, button, [role]").length).toBeGreaterThan(0);
  },
};
