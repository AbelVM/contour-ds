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

const render = (args = {}) => {
  const panel = document.createElement("contour-map-panel");
  panel.setAttribute("title", args.title || "Layers");
  return panel;
};

export const Default = {
  args: { title: "Layers" },
  render,
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector("contour-map-panel");
    await expect(panel).toBeTruthy();
    await expect(panel).toHaveClass(/c-map-panel/);
    await expect(panel).toHaveAttribute("aria-label", "Layers");
  },
};

export const Reactivity = {
  args: { title: "Layers" },
  render,
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector("contour-map-panel");
    await expect(panel).toBeTruthy();
    panel.setAttribute("title", "Updated");
    await expect(panel).toBeTruthy();
  },
};
