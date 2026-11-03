import { expect } from "storybook/test";
import "../dist/wc/data.mjs";

export default {
  title: "Contour/Data/Sparkline",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    points: { control: "text" },
  },
};

const DATA = JSON.stringify([1, 3, 2, 5, 4, 6]);

const render = (args = {}) => {
  const s = document.createElement("contour-sparkline");
  s.setAttribute("points", args.points || DATA);
  if (args.variant) s.setAttribute("variant", args.variant);
  return s;
};

export const Default = {
  args: { points: DATA },
  render,
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-sparkline");
    await expect(s).toBeTruthy();
    await expect(s).toHaveClass(/c-sparkline/);
  },
};

export const Rising = {
  args: { points: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8]), variant: "success" },
  render,
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-sparkline");
    await expect(s).toBeTruthy();
    await expect(s).toHaveClass(/c-sparkline/);
  },
};

export const Falling = {
  args: { points: JSON.stringify([8, 7, 6, 5, 4, 3, 2, 1]), variant: "danger" },
  render,
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-sparkline");
    await expect(s).toBeTruthy();
    await expect(s).toHaveClass(/c-sparkline/);
  },
};
