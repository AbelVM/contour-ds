import { expect } from "storybook/test";
import "../dist/wc/data.mjs";

export default {
  title: "Contour/Data/Table",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    columns: { control: "text" },
    rows: { control: "text" },
    page: { control: "text" },
    "page-size": { control: "text" },
    "sort-dir": { control: "text" },
  },
};

const COLS = JSON.stringify([{ key: "name", label: "Name" }, { key: "value", label: "Value" }]);
const ROWS = JSON.stringify([["Alpha", "1"], ["Beta", "2"]]);

export const Default = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "c-table-wrap";
    const table = document.createElement("contour-table");
    table.setAttribute("columns", COLS);
    table.setAttribute("rows", ROWS);
    wrap.appendChild(table);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector("contour-table");
    await expect(table).toBeTruthy();
    await expect(table.textContent).toContain("Alpha");
  },
};

export const Loading = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "c-table-wrap";
    const table = document.createElement("contour-table");
    table.setAttribute("loading", "Loading…");
    wrap.appendChild(table);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector("contour-table");
    await expect(table).toBeTruthy();
  },
};

export const Empty = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "c-table-wrap";
    const table = document.createElement("contour-table");
    table.setAttribute("empty", "No rows");
    wrap.appendChild(table);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector("contour-table");
    await expect(table).toBeTruthy();
  },
};
