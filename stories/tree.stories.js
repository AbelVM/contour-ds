import { expect, userEvent } from "storybook/test";
import "../dist/wc/navigation.mjs";

export default {
  title: "Contour/Navigation/Tree",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    items: { control: "text" },
  },
};

const ITEMS = JSON.stringify([
  { label: "Routes", children: [{ label: "North" }] },
  { label: "Stations" },
]);

export const KeyboardNavigation = {
  render: () => {
    const tree = document.createElement("contour-tree");
    tree.setAttribute("items", ITEMS);
    return tree;
  },
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