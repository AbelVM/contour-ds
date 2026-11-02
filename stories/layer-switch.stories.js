import { expect } from "storybook/test";
import "../dist/wc/map.mjs";

export default {
  title: "Contour/Map/LayerSwitch",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {},
};

export const Default = {
  render: () => {
    const l = document.createElement("contour-layer-switch");
    l.setAttribute("items", JSON.stringify([
      { name: "Base map", color: "#61758a", count: 1 },
      { name: "Buildings", color: "#d97757", count: 1240 },
      { name: "Routes", color: "#2f8f83", count: 86 },
    ]));
    return l;
  },
  play: async ({ canvasElement }) => {
    const l = canvasElement.querySelector("contour-layer-switch");
    await expect(l).toBeTruthy();
    const toggle = l.querySelector(".c-layer-switch__toggle");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  },
};
