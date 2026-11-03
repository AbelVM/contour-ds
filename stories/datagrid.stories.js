import { expect, userEvent } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Data/DataGrid",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
};

const COLS = JSON.stringify(["Name", "Value"]);
const ROWS = JSON.stringify(Array.from({ length: 100 }, (_, i) => ({ Name: `Row ${i}`, Value: i })));

export const VirtualWindowing = {
  render: () => {
    const g = document.createElement("contour-data-grid");
    g.setAttribute("columns", COLS);
    g.setAttribute("rows", ROWS);
    g.setAttribute("virtual", "");
    return g;
  },
  play: async ({ canvasElement }) => {
    const g = canvasElement.querySelector("contour-data-grid");
    const table = g.querySelector(".c-data-grid__table");
    await expect(table).toBeTruthy();
    const wrap = g.querySelector(".c-data-grid__wrap");
    await expect(wrap).toBeTruthy();
    const rows = table.querySelectorAll("tbody tr");
    await expect(rows.length).toBeLessThan(100);
  },
};

export const SortAndFilter = {
  render: () => {
    const g = document.createElement("contour-data-grid");
    g.setAttribute("columns", COLS);
    g.setAttribute("rows", ROWS);
    g.setAttribute("filter", "Row 1");
    return g;
  },
  play: async ({ canvasElement }) => {
    const g = canvasElement.querySelector("contour-data-grid");
    const table = g.querySelector(".c-data-grid__table");
    await expect(table).toBeTruthy();
    const rows = table.querySelectorAll("tbody tr");
    await expect(rows.length).toBeLessThan(100);
  },
};
