import { expect, userEvent } from "storybook/test";
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

export const TableControlledRows = {
  render: Default.render,
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector("contour-table");
    table.rows = JSON.stringify([["Gamma", "3"]]);
    await expect(table).toHaveAttribute("rows", JSON.stringify([["Gamma", "3"]]));
    await expect(table.textContent).toContain("Gamma");
    await expect(table.textContent).not.toContain("Alpha");
  },
};

export const ErrorRetry = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "c-table-wrap";
    const table = document.createElement("contour-table");
    table.setAttribute("columns", COLS);
    table.setAttribute("rows", ROWS);
    table.setAttribute("error", "Could not load rows");
    table.setAttribute("retry", "Try again");
    wrap.appendChild(table);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector("contour-table");
    const wrapper = canvasElement.querySelector(".c-table-wrap");
    let detail = null;
    wrapper.addEventListener("contour:retry", (event) => { detail = event.detail; });
    await expect(canvasElement.textContent).toContain("Could not load rows");
    await userEvent.click(table.querySelector("button[data-action='retry']"));
    await expect(detail).toEqual({ src: null });
  },
};
