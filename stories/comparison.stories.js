import { expect } from "storybook/test";
import "../dist/wc/data.mjs";

export default {
  title: "Contour/Data/Comparison",
  tags: ["autodocs"],
  parameters: {
    a11y: { test: "error" }, contour: { maturity: "complete-widget" } },
  argTypes: {
    before: { control: "text" },
    after: { control: "text" },
    value: { control: "text" },
    divider: { control: "text" },
  },
};

const render = (args = {}) => {
  const c = document.createElement("contour-comparison");
  if (args.before) c.setAttribute("before", args.before);
  if (args.after) c.setAttribute("after", args.after);
  if (args.value) c.setAttribute("value", args.value);
  if (args.divider) c.setAttribute("divider", args.divider);
  return c;
};

export const Default = {
  args: { before: "Before", after: "After", value: "50", divider: "↔" },
  render,
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-comparison");
    await expect(c).toBeTruthy();
    await expect(c).toHaveClass(/c-comparison/);
    const beforeLabel = c.querySelector(".c-comparison__label--before");
    await expect(beforeLabel).toBeTruthy();
    const afterLabel = c.querySelector(".c-comparison__label--after");
    await expect(afterLabel).toBeTruthy();
  },
};

export const Reactivity = {
  args: { before: "Original", after: "Changed" },
  render,
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-comparison");
    await expect(c).toBeTruthy();
    c.setAttribute("before", "Updated");
    const beforeLabel = c.querySelector(".c-comparison__label--before");
    await expect(beforeLabel.textContent).toBe("Updated");
  },
};