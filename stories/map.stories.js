import { expect } from "storybook/test";
import "../dist/wc/map.mjs";

export default {
  title: "Contour/Map/Panel",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "scaffold" } },
  argTypes: {
    title: { control: "text" },
  },
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
    await expect(panel).toHaveAttribute("aria-label", "Layers");
  },
};

export const Reactivity = {
  render: () => {
    const panel = document.createElement("contour-map-panel");
    panel.setAttribute("title", "Layers");
    return panel;
  },
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector("contour-map-panel");
    await expect(panel).toBeTruthy();
    panel.setAttribute("title", "Updated");
    await expect(panel).toBeTruthy();
  },
};
