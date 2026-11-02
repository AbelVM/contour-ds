import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Overlays/Tooltip",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    text: { control: "text" },
  },
};

export const Default = {
  render: () => {
    const btn = document.createElement("button");
    btn.textContent = "Hover me";
    const t = document.createElement("contour-tooltip");
    t.setAttribute("content", "Helpful hint");
    t.appendChild(btn);
    return t;
  },
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-tooltip");
    await expect(t).toBeTruthy();
  },
};
