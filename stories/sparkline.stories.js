import { expect } from "storybook/test";
import "../dist/wc/data.mjs";

export default {
  title: "Contour/Data/Sparkline",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {},
};

export const Default = {
  render: () => {
    const s = document.createElement("contour-sparkline");
    s.setAttribute("data", JSON.stringify([1, 3, 2, 5, 4, 6]));
    return s;
  },
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-sparkline");
    await expect(s).toBeTruthy();
  },
};
