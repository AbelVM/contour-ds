import { expect } from "storybook/test";
import "../dist/wc/map.mjs";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Map/LayerAndStyle",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" }, a11y: { test: "todo" }, issue: "SB-A11Y-04" },
};

export const LayerPanel = {
  render: () => {
    const panel = document.createElement("contour-layer-panel");
    panel.setAttribute("title", "Map layers");
    panel.setAttribute("items", JSON.stringify(["Base map", "Buildings", "Routes"]));
    return panel;
  },
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector("contour-layer-panel");
    await expect(panel).toBeTruthy();
  },
};

export const StylePanel = {
  render: () => {
    const panel = document.createElement("contour-style-panel");
    panel.setAttribute("title", "Style layers");
    panel.setAttribute("layers", JSON.stringify([
      { name: "Buildings", color: "#d97757", classification: "quantile", opacity: 85 },
      { name: "Routes", color: "#2f8f83", classification: "equal", opacity: 100 },
    ]));
    return panel;
  },
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector("contour-style-panel");
    await expect(panel).toBeTruthy();
    await expect(panel.querySelectorAll(".c-style-panel__row").length).toBe(2);
  },
};