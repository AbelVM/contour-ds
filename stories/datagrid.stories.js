import { expect, userEvent } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Data/DataGrid",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    columns: { control: "text" },
    rows: { control: "text" },
    filter: { control: "text" },
    virtual: { control: "boolean" },
    "page-size": { control: "text" },
    resizable: { control: "boolean" },
  },
};

const COLS = JSON.stringify(["Name", "Value"]);
const ROWS = JSON.stringify(Array.from({ length: 100 }, (_, i) => ({ Name: `Row ${i}`, Value: i })));

const render = (args = {}) => {
  const g = document.createElement("contour-data-grid");
  g.setAttribute("columns", args.columns || COLS);
  g.setAttribute("rows", args.rows || ROWS);
  if (args.filter) g.setAttribute("filter", args.filter);
  if (args.virtual) g.setAttribute("virtual", "");
  if (args["page-size"]) g.setAttribute("page-size", args["page-size"]);
  if (args.resizable) g.setAttribute("resizable", "");
  return g;
};

export const VirtualWindowing = {
  args: { columns: COLS, rows: ROWS, virtual: true },
  render,
  play: async ({ canvasElement }) => {
    const g = canvasElement.querySelector("contour-data-grid");
    await expect(g).toHaveClass(/c-data-grid/);
    const table = g.querySelector(".c-data-grid__table");
    await expect(table).toBeTruthy();
    const wrap = g.querySelector(".c-data-grid__wrap");
    await expect(wrap).toBeTruthy();
    const rows = table.querySelectorAll("tbody tr");
    await expect(rows.length).toBeLessThan(100);
  },
};

export const SortAndFilter = {
  args: { columns: COLS, rows: ROWS, filter: "Row 1" },
  render,
  play: async ({ canvasElement }) => {
    const g = canvasElement.querySelector("contour-data-grid");
    await expect(g).toHaveClass(/c-data-grid/);
    const table = g.querySelector(".c-data-grid__table");
    await expect(table).toBeTruthy();
    const rows = table.querySelectorAll("tbody tr");
    await expect(rows.length).toBeLessThan(100);
  },
};
