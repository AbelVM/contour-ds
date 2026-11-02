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

export const Default = {
  render: () => {
    const chart = document.createElement("contour-chart");
    chart.setAttribute("type", "bar");
    chart.setAttribute("axis", "Sales by category");
    chart.setAttribute("data", DATA);
    return chart;
  },
  play: async ({ canvasElement }) => {
    const chart = canvasElement.querySelector("contour-chart");
    await expect(chart).toBeTruthy();
    await expect(chart).toHaveAttribute("aria-label", "Sales by category");
  },
};

export const Loading = {
  render: () => {
    const chart = document.createElement("contour-chart");
    chart.setAttribute("type", "bar");
    chart.setAttribute("axis", "Sales by category");
    chart.setAttribute("loading", "Loading chart…");
    return chart;
  },
  play: async ({ canvasElement }) => {
    const chart = canvasElement.querySelector("contour-chart");
    await expect(chart).toBeTruthy();
    await expect(chart.textContent).toContain("Loading");
  },
};

export const Empty = {
  render: () => {
    const chart = document.createElement("contour-chart");
    chart.setAttribute("type", "bar");
    chart.setAttribute("axis", "Sales by category");
    chart.setAttribute("empty", "No data");
    return chart;
  },
  play: async ({ canvasElement }) => {
    const chart = canvasElement.querySelector("contour-chart");
    await expect(chart).toBeTruthy();
  },
};

export const Reactivity = {
  render: () => {
    const chart = document.createElement("contour-chart");
    chart.setAttribute("type", "bar");
    chart.setAttribute("axis", "Sales by category");
    chart.setAttribute("data", DATA);
    return chart;
  },
  play: async ({ canvasElement }) => {
    const chart = canvasElement.querySelector("contour-chart");
    await expect(chart).toHaveAttribute("aria-label", "Sales by category");
    chart.setAttribute("axis", "Updated axis");
    await expect(chart).toBeTruthy();
  },
};
