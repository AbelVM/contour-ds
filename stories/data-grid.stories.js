import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Data/DataGrid",
  tags: ["autodocs"],
  parameters: {
    a11y: { test: "error" }, contour: { maturity: "complete-widget" } },
  argTypes: {
    columns: { control: "text" },
    rows: { control: "text" },
    "page-size": { control: "text" },
    filter: { control: "boolean" },
    virtual: { control: "boolean" },
  },
};

const makeRows = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}`, value: (i + 1) * 10 }));

const render = (args = {}) => {
  const g = document.createElement("contour-data-grid");
  if (args.columns) g.setAttribute("columns", args.columns);
  if (args.rows) g.setAttribute("rows", args.rows);
  if (args["page-size"]) g.setAttribute("page-size", args["page-size"]);
  if (args.filter) g.setAttribute("filter", "");
  if (args.virtual) g.setAttribute("virtual", "");
  return g;
};

export const Default = {
  args: {
    columns: '[{"key":"id","label":"ID"},{"key":"name","label":"Name"},{"key":"value","label":"Value"}]',
    rows: JSON.stringify(makeRows(10)),
    "page-size": "5",
  },
  render,
  play: async ({ canvasElement }) => {
    const g = canvasElement.querySelector("contour-data-grid");
    await expect(g).toBeTruthy();
    await expect(g).toHaveClass(/c-data-grid/);
    const table = g.querySelector("table");
    await expect(table).toBeTruthy();
  },
};

export const Filterable = {
  args: {
    columns: '[{"key":"name","label":"Name"},{"key":"value","label":"Value"}]',
    rows: JSON.stringify(makeRows(20)),
    "page-size": "10",
  },
  render,
  play: async ({ canvasElement }) => {
    const g = canvasElement.querySelector("contour-data-grid");
    await expect(g).toBeTruthy();
    const table = g.querySelector("table");
    await expect(table).toBeTruthy();
  },
};

export const Reactivity = {
  args: {
    columns: '[{"key":"name","label":"Name"}]',
    rows: JSON.stringify(makeRows(5)),
  },
  render,
  play: async ({ canvasElement }) => {
    const g = canvasElement.querySelector("contour-data-grid");
    await expect(g).toBeTruthy();
    g.setAttribute("rows", JSON.stringify(makeRows(3)));
    await expect(g).toHaveAttribute("rows");
  },
};