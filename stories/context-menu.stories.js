import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Navigation/ContextMenu",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    items: { control: "text" },
  },
};

export const Default = {
  render: (args = {}) => {
    const c = document.createElement("contour-context-menu");
    if (args.items) c.setAttribute("items", args.items);
    const item = document.createElement("button");
    item.textContent = "Copy";
    c.appendChild(item);
    const item2 = document.createElement("button");
    item2.textContent = "Paste";
    c.appendChild(item2);
    return c;
  },
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-context-menu");
    await expect(c).toBeTruthy();
    await expect(c).toHaveClass(/c-context-menu/);
    await expect(canvasElement.textContent).toContain("Copy");
    await expect(canvasElement.textContent).toContain("Paste");
  },
};

export const WithIcons = {
  render: (args = {}) => {
    const c = document.createElement("contour-context-menu");
    if (args.items) c.setAttribute("items", args.items);
    const item = document.createElement("button");
    item.textContent = "Delete";
    c.appendChild(item);
    return c;
  },
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-context-menu");
    await expect(c).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Delete");
  },
};
