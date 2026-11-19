import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Navigation/Stepper",
  tags: ["autodocs"],
  parameters: {
    a11y: { test: "error" }, contour: { maturity: "complete-widget" } },
  argTypes: {
    steps: { control: "text" },
    current: { control: "text" },
  },
};

const render = (args = {}) => {
  const s = document.createElement("contour-stepper");
  if (args.steps) s.setAttribute("steps", args.steps);
  if (args.current) s.setAttribute("current", args.current);
  return s;
};

export const Default = {
  args: { steps: '["Cart","Shipping","Payment"]', current: "1" },
  render,
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-stepper");
    await expect(s).toBeTruthy();
    await expect(s).toHaveClass(/c-stepper/);
    const list = s.querySelector(".c-stepper__list");
    await expect(list).toBeTruthy();
  },
};

export const Reactivity = {
  args: { steps: '["A","B","C"]', current: "0" },
  render,
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-stepper");
    await expect(s).toBeTruthy();
    s.setAttribute("current", "2");
    await expect(s).toHaveAttribute("current", "2");
  },
};