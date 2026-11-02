import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/UI/Badge",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    variant: { control: "text" },
  },
};

export const Default = {
  render: () => {
    const b = document.createElement("contour-badge");
    b.textContent = "New";
    return b;
  },
  play: async ({ canvasElement }) => {
    const b = canvasElement.querySelector("contour-badge");
    await expect(b).toBeTruthy();
    await expect(canvasElement.textContent).toContain("New");
  },
};
