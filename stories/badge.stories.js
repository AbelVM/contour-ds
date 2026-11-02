import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";
import { variantControl } from "./metadata.js";

export default {
  title: "Contour/UI/Badge",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    variant: variantControl("c-badge"),
  },
};

export const Default = {
  render: (args) => {
    const b = document.createElement("contour-badge");
    if (args.variant) b.setAttribute("variant", args.variant);
    b.textContent = "New";
    return b;
  },
  play: async ({ canvasElement }) => {
    const b = canvasElement.querySelector("contour-badge");
    await expect(b).toBeTruthy();
    await expect(canvasElement.textContent).toContain("New");
  },
};
