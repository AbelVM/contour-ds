import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";
import { variantControl } from "./metadata.js";

export default {
  title: "Contour/UI/Chip",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: { variant: variantControl("c-chip") },
};

export const Default = {
  render: (args) => {
    const c = document.createElement("contour-chip");
    if (args.variant) c.setAttribute("variant", args.variant);
    c.textContent = "Filter";
    return c;
  },
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-chip");
    await expect(c).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Filter");
  },
};
