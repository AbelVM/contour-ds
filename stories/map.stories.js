import { expect } from "storybook/test";
import "../dist/wc/map.mjs";

export default {
  title: "Contour/Map/Panel",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "scaffold" } },
  argTypes: {},
};

export const Default = {
  render: () => {
    const panel = document.createElement("contour-map-panel");
    panel.setAttribute("title", "Layers");
    return panel;
  },
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector("contour-map-panel");
    await expect(panel).toBeTruthy();
  },
};
