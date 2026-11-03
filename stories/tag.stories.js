import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";
import { variantControl } from "./metadata.js";

export default {
  title: "Contour/UI/Tag",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    variant: variantControl("c-tag"),
    removable: { control: "boolean" },
    label: { control: "text" },
  },
};

const render = (args = {}) => {
  const t = document.createElement("contour-tag");
  if (args.variant) t.setAttribute("variant", args.variant);
  if (args.removable) t.setAttribute("removable", "");
  if (args.label) t.setAttribute("label", args.label);
  else t.setAttribute("label", "v1.2");
  return t;
};

export const Default = {
  args: { label: "v1.2" },
  render,
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-tag");
    await expect(t).toBeTruthy();
    await expect(t).toHaveClass(/c-tag/);
    await expect(canvasElement.textContent).toContain("v1.2");
  },
};

export const Removable = {
  args: { removable: true, label: "beta" },
  render,
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-tag");
    await expect(t).toBeTruthy();
    const remove = t.querySelector(".c-tag__remove");
    await expect(remove).toBeTruthy();
  },
};

export const WithIcon = {
  args: { label: "Route" },
  render,
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-tag");
    await expect(t).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Route");
  },
};
