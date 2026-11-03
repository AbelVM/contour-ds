import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Map/StyleSwitcher",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    items: { control: "text" },
    value: { control: "text" },
  },
};

const ITEMS = JSON.stringify(["Streets", "Satellite", "Terrain"]);

const render = (args = {}) => {
  const s = document.createElement("contour-style-switcher");
  s.setAttribute("items", args.items || ITEMS);
  s.setAttribute("value", args.value || "Streets");
  return s;
};

export const Default = {
  args: { items: ITEMS, value: "Streets" },
  render,
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-style-switcher");
    await expect(s).toBeTruthy();
    await expect(s).toHaveClass(/c-style-switcher/);
    await expect(s.querySelectorAll(".c-style-switcher__option").length).toBe(3);
    await expect(s.querySelector(".c-style-switcher__option--active")).toHaveTextContent("Streets");
  },
};

export const Satellite = {
  args: { items: ITEMS, value: "Satellite" },
  render,
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-style-switcher");
    await expect(s).toBeTruthy();
    await expect(s).toHaveClass(/c-style-switcher/);
    await expect(s.querySelector(".c-style-switcher__option--active")).toHaveTextContent("Satellite");
  },
};
