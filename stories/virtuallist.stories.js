import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Data/VirtualList",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    items: { control: "text" },
    "item-height": { control: "text" },
    orientation: { control: "text" },
    sticky: { control: "boolean" },
  },
};

const ITEMS = JSON.stringify(Array.from({ length: 200 }, (_, i) => `Item ${i}`));

export const MeasuredHeights = {
  args: { items: ITEMS, "item-height": "auto" },
  render: (args = {}) => {
    const v = document.createElement("contour-virtual-list");
    v.setAttribute("items", args.items || ITEMS);
    v.setAttribute("item-height", args["item-height"] || "auto");
    if (args.sticky) v.setAttribute("sticky", "");
    return v;
  },
  play: async ({ canvasElement }) => {
    const v = canvasElement.querySelector("contour-virtual-list");
    await expect(v).toBeTruthy();
    await expect(v).toHaveClass(/c-virtual-list/);
    const scroller = v.querySelector(".c-virtual-list__scroller");
    await expect(scroller).toBeTruthy();
    const items = v.querySelectorAll(".c-virtual-list__item");
    await expect(items.length).toBeGreaterThan(0);
  },
};

export const Horizontal = {
  args: { items: ITEMS, orientation: "horizontal" },
  render: (args = {}) => {
    const v = document.createElement("contour-virtual-list");
    v.setAttribute("items", args.items || ITEMS);
    v.setAttribute("orientation", args.orientation || "horizontal");
    if (args.sticky) v.setAttribute("sticky", "");
    return v;
  },
  play: async ({ canvasElement }) => {
    const v = canvasElement.querySelector("contour-virtual-list");
    await expect(v).toBeTruthy();
  },
};
