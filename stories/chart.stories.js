import { expect } from "storybook/test";
import "../dist/wc/data.mjs";

export default {
  title: "Contour/Data/Chart",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
};

export const Default = {
  render: () => {
    const chart = document.createElement("contour-chart");
    chart.setAttribute("type", "bar");
    chart.setAttribute("axis", "Sales by category");
    chart.setAttribute("data", JSON.stringify({ labels: ["A", "B", "C"], values: [3, 7, 5] }));
    return chart;
  },
  play: async ({ canvasElement }) => {
    const chart = canvasElement.querySelector("contour-chart");
    await expect(chart).toBeTruthy();
  },
};
