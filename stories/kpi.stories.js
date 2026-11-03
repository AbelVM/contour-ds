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

const render = (args = {}) => {
  const k = document.createElement("contour-kpi");
  if (args.label) k.setAttribute("label", args.label); else k.setAttribute("label", "Active users");
  if (args.value) k.setAttribute("value", args.value); else k.setAttribute("value", "1,234");
  if (args.delta) k.setAttribute("delta", args.delta); else k.setAttribute("delta", "+5%");
  if (args.direction) k.setAttribute("direction", args.direction); else k.setAttribute("direction", "up");
  return k;
};

export const Default = {
  args: { label: "Active users", value: "1,234", delta: "+5%", direction: "up" },
  render,
  play: async ({ canvasElement }) => {
    const k = canvasElement.querySelector("contour-kpi");
    await expect(k).toBeTruthy();
    await expect(k).toHaveClass(/c-kpi/);
    await expect(canvasElement.textContent).toContain("Active users");
    await expect(canvasElement.textContent).toContain("1,234");
  },
};

export const Reactivity = {
  args: { label: "Active users", value: "1,234" },
  render,
  play: async ({ canvasElement }) => {
    const k = canvasElement.querySelector("contour-kpi");
    await expect(k).toBeTruthy();
    k.setAttribute("value", "2,000");
    await expect(canvasElement.textContent).toContain("2,000");
  },
};
