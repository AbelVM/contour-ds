import { expect, userEvent } from "storybook/test";
import "../dist/wc/navigation.mjs";

export default {
  title: "Contour/Navigation/Tree",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    items: { control: "text" },
    virtual: { control: "boolean" },
    "item-height": { control: "text" },
  },
};

const ITEMS = JSON.stringify([
  { label: "Routes", children: [{ label: "North" }] },
  { label: "Stations" },
]);

const render = (args = {}) => {
  const tree = document.createElement("contour-tree");
  tree.setAttribute("items", args.items || ITEMS);
  if (args.virtual) tree.setAttribute("virtual", "");
  if (args["item-height"]) tree.setAttribute("item-height", args["item-height"]);
  if (args.maxHeight) tree.style.maxHeight = args.maxHeight;
  return tree;
};

export const KeyboardNavigation = {
  args: { items: ITEMS },
  render,
  play: async ({ canvasElement }) => {
    const tree = canvasElement.querySelector("contour-tree");
    const toggle = tree.querySelector(".c-tree__toggle");
    toggle.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const visibleItems = tree.querySelectorAll("[role='treeitem']:not([hidden])");
    await userEvent.keyboard("{ArrowDown}");
    await expect(document.activeElement).toBe(visibleItems[1].querySelector(".c-tree__leaf"));
    await userEvent.keyboard("{ArrowLeft}");
    await expect(document.activeElement).toBe(toggle);
  },
};

export const VirtualWindowing = {
  args: { virtual: true, "item-height": "28", items: JSON.stringify(Array.from({ length: 1000 }, (_, i) => ({ label: "Node " + i }))), maxHeight: "12rem" },
  render: (args = {}) => {
    const tree = document.createElement("contour-tree");
    tree.setAttribute("virtual", "");
    tree.setAttribute("item-height", args["item-height"] || "28");
    const items = args.items || JSON.stringify(Array.from({ length: 1000 }, (_, i) => ({ label: "Node " + i })));
    tree.setAttribute("items", items);
    tree.style.maxHeight = args.maxHeight || "12rem";
    return tree;
  },
  play: async ({ canvasElement }) => {
    const tree = canvasElement.querySelector("contour-tree");
    const scroller = tree.querySelector(".c-tree");
    const rendered = scroller.querySelectorAll(".c-tree__node").length;
    await expect(rendered).toBeLessThan(50);
    await expect(rendered).toBeGreaterThan(0);
  },
};
