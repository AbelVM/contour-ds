import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Map/StyleSwitcher",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {},
};

export const Default = {
  render: () => {
    const s = document.createElement("contour-style-switcher");
    s.setAttribute("items", JSON.stringify(["Streets", "Satellite", "Terrain"]));
    s.setAttribute("value", "Streets");
    return s;
  },
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-style-switcher");
    await expect(s).toBeTruthy();
    await expect(s.querySelectorAll(".c-style-switcher__option").length).toBe(3);
    await expect(s.querySelector(".c-style-switcher__option--active")).toHaveTextContent("Streets");
  },
};
