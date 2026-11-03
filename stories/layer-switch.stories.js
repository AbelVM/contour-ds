import { expect } from "storybook/test";
import "../dist/wc/map.mjs";

export default {
  title: "Contour/Map/LayerSwitch",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    items: { control: "text" },
  },
};

const render = (args = {}) => {
  const l = document.createElement("contour-layer-switch");
  l.setAttribute("items", args.items || JSON.stringify([
    { name: "Base map", color: "#61758a", count: 1 },
    { name: "Buildings", color: "#d97757", count: 1240 },
    { name: "Routes", color: "#2f8f83", count: 86 },
  ]));
  return l;
};

export const Default = {
  args: { items: JSON.stringify([{ name: "Base map", color: "#61758a", count: 1 }, { name: "Buildings", color: "#d97757", count: 1240 }, { name: "Routes", color: "#2f8f83", count: 86 }]) },
  render,
  play: async ({ canvasElement }) => {
    const l = canvasElement.querySelector("contour-layer-switch");
    await expect(l).toBeTruthy();
    await expect(l).toHaveClass(/c-layer-switch/);
    const toggle = l.querySelector(".c-layer-switch__toggle");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  },
};

export const AllVisible = {
  args: { items: JSON.stringify([{ name: "Base map", color: "#61758a", count: 1, visible: true }, { name: "Buildings", color: "#d97757", count: 1240, visible: true }]) },
  render,
  play: async ({ canvasElement }) => {
    const l = canvasElement.querySelector("contour-layer-switch");
    await expect(l).toBeTruthy();
    const toggles = l.querySelectorAll(".c-layer-switch__toggle");
    await expect(toggles.length).toBe(2);
  },
};
