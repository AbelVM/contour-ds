import { expect } from "storybook/test";
import "../dist/wc/feedback.mjs";
import "../dist/wc/shadow.mjs";

export default {
  title: "Contour/Foundations/LightVsShadow",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "primitive" } },
};

export const Default = {
  render: () => {
    const wrap = document.createElement("div");
    const light = document.createElement("contour-dialog");
    light.textContent = "light dom";
    const shadow = document.createElement("contour-shadow-dialog");
    shadow.textContent = "shadow dom";
    wrap.appendChild(light);
    wrap.appendChild(shadow);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("contour-dialog")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-shadow-dialog")).toBeTruthy();
  },
};
