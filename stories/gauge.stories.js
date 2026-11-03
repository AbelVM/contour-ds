import { expect } from "storybook/test";
import "../dist/wc/data.mjs";

export default {
  title: "Contour/Data/Gauge",
  tags: ["autodocs"],
  parameters: {
    contour: { maturity: "complete-widget" },
  },
  argTypes: {
    value: { control: "number" },
    max: { control: "number" },
  },
};

const render = (args = {}) => {
  const g = document.createElement("contour-gauge");
  g.setAttribute("value", args.value != null ? String(args.value) : "72");
  g.setAttribute("max", args.max != null ? String(args.max) : "100");
  g.setAttribute("heading", args.heading || "CPU");
  return g;
};

export const Default = {
  args: { value: "72", max: "100", heading: "CPU" },
  render,
  play: async ({ canvasElement }) => {
    const g = canvasElement.querySelector("contour-gauge");
    await expect(g).toBeTruthy();
    await expect(g).toHaveClass(/c-gauge/);
  },
};
