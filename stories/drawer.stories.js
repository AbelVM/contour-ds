import { expect } from "storybook/test";
import "../dist/wc/feedback.mjs";

export default {
  title: "Contour/Overlays/Drawer",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    title: { control: "text" },
  },
};

export const Default = {
  render: () => {
    const d = document.createElement("contour-drawer");
    d.setAttribute("title", "Settings");
    const p = document.createElement("p");
    p.textContent = "Drawer body";
    d.appendChild(p);
    return d;
  },
  play: async ({ canvasElement }) => {
    const d = canvasElement.querySelector("contour-drawer");
    await expect(d).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Settings");
  },
};
