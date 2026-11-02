import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/UI/Chip",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {},
};

export const Default = {
  render: () => {
    const c = document.createElement("contour-chip");
    c.textContent = "Filter";
    return c;
  },
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-chip");
    await expect(c).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Filter");
  },
};
