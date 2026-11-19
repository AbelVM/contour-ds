import { expect } from "storybook/test";
import "../dist/wc/interaction.mjs";

export default {
  title: "Contour/Interaction/SortableList",
  tags: ["autodocs"],
  parameters: {
    a11y: { test: "error" }, contour: { maturity: "complete-widget" } },
  argTypes: {
    items: { control: "text" },
  },
};

const render = (args = {}) => {
  const s = document.createElement("contour-sortable-list");
  if (args.items) s.setAttribute("items", args.items);
  return s;
};

export const Default = {
  args: {
    items: JSON.stringify(["First", "Second", "Third"]),
  },
  render,
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-sortable-list");
    await expect(s).toBeTruthy();
    await expect(s).toHaveClass(/c-sortable-list/);
  },
};

export const Reactivity = {
  args: {
    items: JSON.stringify(["A", "B"]),
  },
  render,
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-sortable-list");
    await expect(s).toBeTruthy();
    s.setAttribute("items", JSON.stringify(["X", "Y", "Z"]));
    await expect(s).toHaveAttribute("items");
  },
};