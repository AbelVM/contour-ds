import { expect } from "storybook/test";
import "../dist/wc/data.mjs";

export default {
  title: "Contour/Data/Pivot",
  tags: ["autodocs"],
  parameters: {
    a11y: { test: "error" }, contour: { maturity: "complete-widget" } },
  argTypes: {
    rows: { control: "text" },
    columns: { control: "text" },
    values: { control: "text" },
    data: { control: "text" },
  },
};

const render = (args = {}) => {
  const p = document.createElement("contour-pivot");
  if (args.rows) p.setAttribute("rows", args.rows);
  if (args.columns) p.setAttribute("columns", args.columns);
  if (args.values) p.setAttribute("values", args.values);
  if (args.data) p.setAttribute("data", args.data);
  return p;
};

export const Default = {
  args: {
    rows: '["region"]',
    columns: '["product"]',
    values: '["revenue"]',
    data: JSON.stringify([
      { region: "North", product: "A", revenue: 100 },
      { region: "North", product: "B", revenue: 200 },
      { region: "South", product: "A", revenue: 150 },
    ]),
  },
  render,
  play: async ({ canvasElement }) => {
    const p = canvasElement.querySelector("contour-pivot");
    await expect(p).toBeTruthy();
    await expect(p).toHaveClass(/c-pivot/);
  },
};

export const Reactivity = {
  args: {
    rows: '["region"]',
    data: JSON.stringify([{ region: "North", revenue: 100 }]),
  },
  render,
  play: async ({ canvasElement }) => {
    const p = canvasElement.querySelector("contour-pivot");
    await expect(p).toBeTruthy();
    p.setAttribute("rows", '["product"]');
    await expect(p).toHaveAttribute("rows");
  },
};