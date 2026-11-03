import { expect, userEvent } from "storybook/test";
import "../dist/wc/ui.mjs";
import { variantControl } from "./metadata.js";

export default {
  title: "Contour/UI/Chip",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    variant: variantControl("c-chip"),
    key: { control: "text" },
    value: { control: "text" },
  },
};

const render = (args = {}) => {
  const c = document.createElement("contour-chip");
  if (args.variant) c.setAttribute("variant", args.variant);
  if (args.key) c.setAttribute("key", args.key);
  if (args.value) c.setAttribute("value", args.value);
  if (!args.key && !args.value) c.textContent = "Filter";
  return c;
};

export const Default = {
  args: { label: "Filter" },
  render: (args) => {
    const c = render(args);
    if (args.label && !args.key && !args.value) c.textContent = args.label;
    return c;
  },
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-chip");
    await expect(c).toBeTruthy();
    await expect(c).toHaveClass(/c-chip/);
    await expect(canvasElement.textContent).toContain("Filter");
  },
};

export const WithKey = {
  args: { key: "Status", value: "Active" },
  render,
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-chip");
    await expect(c).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Status");
    await expect(canvasElement.textContent).toContain("Active");
  },
};

export const WithValue = {
  args: { value: "42" },
  render,
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-chip");
    await expect(c).toBeTruthy();
    await expect(canvasElement.textContent).toContain("42");
  },
};
