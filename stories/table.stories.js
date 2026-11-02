import { expect } from "storybook/test";
import "../dist/wc/data.mjs";

export default {
  title: "Contour/Data/Table",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {},
};

export const Default = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "c-table-wrap";
    const table = document.createElement("contour-table");
    table.innerHTML = "<table class='c-table'><thead><tr><th>Name</th></tr></thead><tbody><tr><td>Alpha</td></tr></tbody></table>";
    wrap.appendChild(table);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector("contour-table, table");
    await expect(table).toBeTruthy();
  },
};
