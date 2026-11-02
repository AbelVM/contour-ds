import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/UI/Tag",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {},
};

export const Default = {
  render: () => {
    const t = document.createElement("contour-tag");
    t.textContent = "v1.2";
    return t;
  },
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-tag");
    await expect(t).toBeTruthy();
    await expect(canvasElement.textContent).toContain("v1.2");
  },
};
