import { expect } from "storybook/test";
import "../dist/wc/map.mjs";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Map/LayerAndStyle",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    title: { control: "text" },
    items: { control: "text" },
    layers: { control: "text" },
  },
};

export const LayerPanel = {
  args: { title: "Map layers", items: JSON.stringify([{ name: "North loop", visible: true }, { name: "Harbor path", visible: false }]) },
  render: (args = {}) => {
    const panel = document.createElement("contour-layer-panel");
    panel.setAttribute("title", args.title || "Map layers");
    panel.setAttribute("items", args.items || JSON.stringify([{ name: "North loop", visible: true }, { name: "Harbor path", visible: false }]));
    return panel;
  },
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector("contour-layer-panel");
    await expect(panel).toBeTruthy();
    await expect(panel).toHaveClass(/c-layer-panel/);
  },
};

export const StylePanel = {
  args: { title: "Style layers", layers: JSON.stringify([{ name: "Buildings", color: "#d97757", classification: "quantile", opacity: 85 }, { name: "Routes", color: "#2f8f83", classification: "equal", opacity: 100 }]) },
  render: (args = {}) => {
    const panel = document.createElement("contour-style-panel");
    panel.setAttribute("title", args.title || "Style layers");
    panel.setAttribute("layers", args.layers || JSON.stringify([{ name: "Buildings", color: "#d97757", classification: "quantile", opacity: 85 }, { name: "Routes", color: "#2f8f83", classification: "equal", opacity: 100 }]));
    return panel;
  },
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector("contour-style-panel");
    await expect(panel).toBeTruthy();
    await expect(panel).toHaveClass(/c-style-panel/);
    await expect(panel.querySelectorAll(".c-style-panel__row").length).toBe(2);
  },
};
