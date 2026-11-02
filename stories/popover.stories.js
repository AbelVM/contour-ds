import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Overlays/Popover",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {},
};

export const Default = {
  render: () => {
    const p = document.createElement("contour-popover");
    const btn = document.createElement("button");
    btn.textContent = "Toggle";
    p.appendChild(btn);
    const content = document.createElement("div");
    content.textContent = "Popover content";
    p.appendChild(content);
    return p;
  },
  play: async ({ canvasElement }) => {
    const p = canvasElement.querySelector("contour-popover");
    await expect(p).toBeTruthy();
  },
};
