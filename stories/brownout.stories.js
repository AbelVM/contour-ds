import { expect } from "storybook/test";
import "../dist/wc/data.mjs";

export default {
  title: "Contour/Data/Brownout",
  tags: ["autodocs"],
  parameters: {
    a11y: { test: "error" }, contour: { maturity: "complete-widget" } },
  argTypes: {
    level: { control: "select", options: ["0", "1", "2", "3"] },
  },
};

const render = (args = {}) => {
  const b = document.createElement("contour-brownout");
  if (args.level) b.setAttribute("level", args.level);
  return b;
};

export const Default = {
  args: { level: "0" },
  render,
  play: async ({ canvasElement }) => {
    const b = canvasElement.querySelector("contour-brownout");
    await expect(b).toBeTruthy();
    await expect(b).toHaveClass(/c-brownout/);
    const deco = b.querySelector(".c-brownout__decorative");
    await expect(deco).toBeTruthy();
    const label = b.querySelector(".c-brownout__label");
    await expect(label).toBeTruthy();
  },
};

export const Level3 = {
  args: { level: "3" },
  render,
  play: async ({ canvasElement }) => {
    const b = canvasElement.querySelector("contour-brownout");
    await expect(b).toBeTruthy();
    await expect(b).toHaveAttribute("data-level", "3");
    const label = b.querySelector(".c-brownout__label");
    await expect(label.textContent).toContain("3");
  },
};

export const Reactivity = {
  args: { level: "0" },
  render,
  play: async ({ canvasElement }) => {
    const b = canvasElement.querySelector("contour-brownout");
    await expect(b).toBeTruthy();
    b.setAttribute("level", "2");
    await expect(b).toHaveAttribute("data-level", "2");
  },
};