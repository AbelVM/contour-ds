import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Data/VirtualList",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
};

const ITEMS = JSON.stringify(Array.from({ length: 200 }, (_, i) => `Item ${i}`));

export const MeasuredHeights = {
  render: () => {
    const v = document.createElement("contour-virtual-list");
    v.setAttribute("items", ITEMS);
    v.setAttribute("item-height", "auto");
    return v;
  },
  play: async ({ canvasElement }) => {
    const v = canvasElement.querySelector("contour-virtual-list");
    await expect(v).toBeTruthy();
    const scroller = v.querySelector(".c-virtual-list__scroller");
    await expect(scroller).toBeTruthy();
    const items = v.querySelectorAll(".c-virtual-list__item");
    await expect(items.length).toBeGreaterThan(0);
  },
};

export const Horizontal = {
  render: () => {
    const v = document.createElement("contour-virtual-list");
    v.setAttribute("items", ITEMS);
    v.setAttribute("orientation", "horizontal");
    return v;
  },
  play: async ({ canvasElement }) => {
    const v = canvasElement.querySelector("contour-virtual-list");
    await expect(v).toBeTruthy();
  },
};
