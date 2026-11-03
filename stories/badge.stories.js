import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";
import { variantControl } from "./metadata.js";

export default {
  title: "Contour/UI/Badge",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    variant: variantControl("c-badge"),
    label: { control: "text" },
    size: { control: "text" },
    removable: { control: "boolean" },
  },
};

const render = (args = {}) => {
  const b = document.createElement("contour-badge");
  if (args.variant) b.setAttribute("variant", args.variant);
  if (args.size) b.setAttribute("size", args.size);
  if (args.removable) b.setAttribute("removable", "");
  if (args.label) b.textContent = args.label;
  else b.textContent = "New";
  return b;
};

export const Default = {
  args: { label: "New" },
  render,
  play: async ({ canvasElement }) => {
    const b = canvasElement.querySelector("contour-badge");
    await expect(b).toBeTruthy();
    await expect(b).toHaveClass(/c-badge/);
    await expect(canvasElement.textContent).toContain("New");
  },
};

export const Count = {
  args: { variant: "primary", label: "3" },
  render,
  play: async ({ canvasElement }) => {
    const b = canvasElement.querySelector("contour-badge");
    await expect(b).toBeTruthy();
    await expect(b).toHaveClass(/c-badge/);
    await expect(canvasElement.textContent).toContain("3");
  },
};

export const Removable = {
  args: { removable: true, label: "Tag" },
  render,
  play: async ({ canvasElement }) => {
    const b = canvasElement.querySelector("contour-badge");
    await expect(b).toBeTruthy();
    await expect(b).toHaveClass(/c-badge/);
    await expect(b).toHaveAttribute("removable", "");
    const remove = b.querySelector(".c-badge__remove");
    await expect(remove).toBeTruthy();
  },
};
