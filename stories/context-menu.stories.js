import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Navigation/ContextMenu",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {},
};

export const Default = {
  render: () => {
    const c = document.createElement("contour-context-menu");
    const item = document.createElement("button");
    item.textContent = "Copy";
    c.appendChild(item);
    return c;
  },
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-context-menu");
    await expect(c).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Copy");
  },
};
