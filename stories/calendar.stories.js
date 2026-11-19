import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Forms/Calendar",
  tags: ["autodocs"],
  parameters: {
    a11y: { test: "error" }, contour: { maturity: "complete-widget" } },
  argTypes: {
    month: { control: "text" },
    year: { control: "text" },
    range: { control: "boolean" },
  },
};

const render = (args = {}) => {
  const c = document.createElement("contour-calendar");
  if (args.month) c.setAttribute("month", args.month);
  if (args.year) c.setAttribute("year", args.year);
  if (args.range) c.setAttribute("range", "");
  return c;
};

export const Default = {
  args: { month: "11", year: "2026" },
  render,
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-calendar");
    await expect(c).toBeTruthy();
    await expect(c).toHaveClass(/c-calendar/);
    const grid = c.querySelector('[role="grid"]');
    await expect(grid).toBeTruthy();
  },
};

export const Range = {
  args: { month: "11", year: "2026", range: true },
  render,
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-calendar");
    await expect(c).toBeTruthy();
    await expect(c).toHaveAttribute("range", "");
  },
};

export const Reactivity = {
  args: { month: "11", year: "2026" },
  render,
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-calendar");
    await expect(c).toBeTruthy();
    c.setAttribute("month", "12");
    await expect(c).toHaveAttribute("month", "12");
  },
};