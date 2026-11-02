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
    light.setAttribute("title", "light dom");
    const shadow = document.createElement("contour-shadow-dialog");
    shadow.setAttribute("title", "shadow dom");
    wrap.appendChild(light);
    wrap.appendChild(shadow);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("contour-dialog")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-shadow-dialog")).toBeTruthy();
  },
};

export const Reactivity = {
  render: () => {
    const wrap = document.createElement("div");
    const light = document.createElement("contour-dialog");
    light.setAttribute("title", "light dom");
    wrap.appendChild(light);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const light = canvasElement.querySelector("contour-dialog");
    await expect(light).toBeTruthy();
    light.setAttribute("title", "updated");
    await expect(light).toHaveAttribute("title", "updated");
  },
};
