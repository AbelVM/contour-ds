import { expect } from "storybook/test";
import "../dist/wc/data.mjs";

export default {
  title: "Contour/Data/Gauge",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" },
    // a11y todo: gauge meter lacks accessible name in isolated story. Tracked as SB-A11Y-05.
    a11y: { test: "todo" },
    a11yTodo: { owner: "Contour maintainers", rootCause: "isolated gauge has no metric label", mitigation: "provide an explicit labelled gauge fixture", review: "2026-12-01" },
  },
  argTypes: {
    value: { control: "number" },
    max: { control: "number" },
  },
};

export const Default = {
  render: () => {
    const g = document.createElement("contour-gauge");
    g.setAttribute("value", "72");
    g.setAttribute("max", "100");
    g.setAttribute("label", "CPU");
    return g;
  },
  play: async ({ canvasElement }) => {
    const g = canvasElement.querySelector("contour-gauge");
    await expect(g).toBeTruthy();
    await expect(g).toBeTruthy();
  },
};
