import { expect } from "storybook/test";

export default {
  title: "Contour/Foundations/LateDefinition",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "primitive" } },
};

export const NativeFallback = {
  render: () => {
    const btn = document.createElement("button");
    btn.className = "c-btn";
    btn.textContent = "Native fallback";
    return btn;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("button")).toBeTruthy();
  },
};

export const LateUpgrade = {
  render: () => {
    const el = document.createElement("contour-btn");
    el.setAttribute("label", "Upgraded");
    return el;
  },
  play: async ({ canvasElement }) => {
    await import("../dist/wc/interaction.mjs");
    const el = canvasElement.querySelector("contour-btn");
    await expect(el).toBeTruthy();
  },
};
