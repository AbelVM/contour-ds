import { expect, userEvent } from "storybook/test";
import "../dist/wc/data.mjs";
import "../dist/wc/forms.mjs";
import "../dist/wc/feedback.mjs";

export default {
  title: "Contour/Workflows/Dashboard",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "composition" } },
};

export const Default = {
  render: (args = {}) => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "1rem";
    const kpi = document.createElement("contour-kpi");
    kpi.setAttribute("label", "Active users");
    kpi.setAttribute("value", "1,234");
    const chart = document.createElement("contour-chart");
    chart.setAttribute("type", "bar");
    chart.setAttribute("axis", "Weekly activity");
    chart.setAttribute("data", JSON.stringify({ labels: ["Mon", "Tue"], values: [10, 20] }));
    const tableWrap = document.createElement("div");
    tableWrap.className = "c-table-wrap";
    const table = document.createElement("contour-table");
    table.innerHTML = "<table class='c-table'><thead><tr><th>Region</th></tr></thead><tbody><tr><td>North</td></tr></tbody></table>";
    tableWrap.appendChild(table);
    wrap.appendChild(kpi);
    wrap.appendChild(chart);
    wrap.appendChild(tableWrap);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("contour-kpi")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-chart")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-table")).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Active users");
  },
};

export const DashboardFilterToData = {
  render: (args = {}) => {
    const wrap = document.createElement("div");
    const input = document.createElement("contour-input");
    input.setAttribute("name", "filter");
    input.setAttribute("placeholder", "Filter regions");
    const tableWrap = document.createElement("div");
    tableWrap.className = "c-table-wrap";
    const table = document.createElement("contour-table");
    table.setAttribute("columns", JSON.stringify([{ key: "region", label: "Region" }]));
    table.setAttribute("rows", JSON.stringify([["North"], ["South"]]));
    tableWrap.appendChild(table);
    wrap.append(input, tableWrap);
    wrap.addEventListener("contour:input", (event) => {
      const value = event.detail.value;
      const rows = value ? [[value]] : [["North"], ["South"]];
      table.rows = JSON.stringify(rows);
    });
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector("input");
    const table = canvasElement.querySelector("contour-table");
    await userEvent.type(input, "West");
    await expect(table.textContent).toContain("West");
    await expect(table.textContent).not.toContain("North");
  },
};
