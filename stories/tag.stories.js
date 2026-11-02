import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";
import { variantControl } from "./metadata.js";

export default {
  title: "Contour/UI/Tag",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: { variant: variantControl("c-tag") },
};

export const Default = {
  render: (args) => {
    const t = document.createElement("contour-tag");
    if (args.variant) t.setAttribute("variant", args.variant);
    t.textContent = "v1.2";
    return t;
  },
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-tag");
    await expect(t).toBeTruthy();
    await expect(canvasElement.textContent).toContain("v1.2");
  },
};
