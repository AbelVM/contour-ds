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
    l.setAttribute("layers", JSON.stringify(["Base", "Satellite", "Terrain"]));
    return l;
  },
  play: async ({ canvasElement }) => {
    const l = canvasElement.querySelector("contour-layer-switch");
    await expect(l).toBeTruthy();
  },
};
