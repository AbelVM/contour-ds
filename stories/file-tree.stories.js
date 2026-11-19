import { expect } from "storybook/test";
import "../dist/wc/docs.mjs";

export default {
  title: "Contour/Docs/FileTree",
  tags: ["autodocs"],
  parameters: {
    a11y: { test: "error" }, contour: { maturity: "complete-widget" } },
  argTypes: {
    items: { control: "text" },
  },
};

const render = (args = {}) => {
  const t = document.createElement("contour-file-tree");
  if (args.items) t.setAttribute("items", args.items);
  return t;
};

export const Default = {
  args: {
    items: JSON.stringify([
      { label: "src", children: [{ label: "index.mjs" }, { label: "core.mjs" }, { label: "utils", children: [{ label: "helpers.mjs" }] }] },
      { label: "package.json" },
    ]),
  },
  render,
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-file-tree");
    await expect(t).toBeTruthy();
    await expect(t).toHaveClass(/c-file-tree/);
  },
};

export const Reactivity = {
  args: {
    items: JSON.stringify([{ label: "a.mjs" }]),
  },
  render,
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-file-tree");
    await expect(t).toBeTruthy();
    t.setAttribute("items", JSON.stringify([{ label: "b.mjs" }]));
    await expect(t).toHaveAttribute("items");
  },
};