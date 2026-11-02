import { expect } from "storybook/test";
import "../dist/wc/data.mjs";

export default {
  title: "Contour/Data/KPI",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    value: { control: "text" },
    label: { control: "text" },
    delta: { control: "text" },
    direction: { control: "select", options: ["", "up", "down"] },
  },
};

export const Default = {
  render: () => {
    const k = document.createElement("contour-kpi");
    k.setAttribute("label", "Active users");
    k.setAttribute("value", "1,234");
    k.setAttribute("delta", "+5%");
    k.setAttribute("direction", "up");
    return k;
  },
  play: async ({ canvasElement }) => {
    const k = canvasElement.querySelector("contour-kpi");
    await expect(k).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Active users");
    await expect(canvasElement.textContent).toContain("1,234");
  },
};

export const Reactivity = {
  render: () => {
    const k = document.createElement("contour-kpi");
    k.setAttribute("label", "Active users");
    k.setAttribute("value", "1,234");
    return k;
  },
  play: async ({ canvasElement }) => {
    const k = canvasElement.querySelector("contour-kpi");
    await expect(k).toBeTruthy();
    k.setAttribute("value", "2,000");
    await expect(canvasElement.textContent).toContain("2,000");
  },
};
