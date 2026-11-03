import { expect } from "storybook/test";
import "../dist/wc/data.mjs";

export default {
  title: "Contour/Data/Gauge",
  tags: ["autodocs"],
  parameters: {
    contour: { maturity: "complete-widget" },
    a11y: { test: "todo" },
    issue: "SB-A11Y-05",
    a11yTodo: { owner: "Contour maintainers", rootCause: "isolated gauge has no metric label", mitigation: "provide an explicit labelled gauge fixture", review: "2026-12-01" },
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
  g.setAttribute("label", args.label || "CPU");
  return g;
};

export const Default = {
  args: { value: "72", max: "100", label: "CPU" },
  render,
  play: async ({ canvasElement }) => {
    const g = canvasElement.querySelector("contour-gauge");
    await expect(g).toBeTruthy();
    await expect(g).toHaveClass(/c-gauge/);
  },
};
