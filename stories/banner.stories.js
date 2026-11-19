import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Feedback/Banner",
  tags: ["autodocs"],
  parameters: {
    a11y: { test: "error" }, contour: { maturity: "complete-widget" } },
  argTypes: {
    message: { control: "text" },
    variant: { control: "select", options: ["", "success", "warning", "danger", "info"] },
  },
};

const render = (args = {}) => {
  const b = document.createElement("contour-banner");
  if (args.message) b.setAttribute("message", args.message);
  if (args.variant) b.setAttribute("variant", args.variant);
  return b;
};

export const Default = {
  args: { message: "Deploy complete" },
  render,
  play: async ({ canvasElement }) => {
    const b = canvasElement.querySelector("contour-banner");
    await expect(b).toBeTruthy();
    await expect(b).toHaveClass(/c-banner/);
    await expect(canvasElement.textContent).toContain("Deploy");
  },
};

export const Success = {
  args: { message: "All systems operational", variant: "success" },
  render,
  play: async ({ canvasElement }) => {
    const b = canvasElement.querySelector("contour-banner");
    await expect(b).toBeTruthy();
    await expect(b).toHaveClass(/c-banner--success/);
  },
};

export const Reactivity = {
  args: { message: "Original", variant: "info" },
  render,
  play: async ({ canvasElement }) => {
    const b = canvasElement.querySelector("contour-banner");
    await expect(b).toBeTruthy();
    b.setAttribute("variant", "danger");
    await expect(b).toHaveClass(/c-banner--danger/);
    await expect(b).not.toHaveClass(/c-banner--info/);
  },
};