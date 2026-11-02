import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Overlays/HoverCard",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {},
};

export const Default = {
  render: () => {
    const h = document.createElement("contour-hover-card");
    const trigger = document.createElement("button");
    trigger.textContent = "Hover";
    h.appendChild(trigger);
    const content = document.createElement("div");
    content.textContent = "Card content";
    h.appendChild(content);
    return h;
  },
  play: async ({ canvasElement }) => {
    const h = canvasElement.querySelector("contour-hover-card");
    await expect(h).toBeTruthy();
  },
};
