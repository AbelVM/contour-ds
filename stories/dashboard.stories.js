import { expect } from "storybook/test";
import "../dist/wc/data.mjs";
import "../dist/wc/forms.mjs";
import "../dist/wc/feedback.mjs";

export default {
  title: "Contour/Workflows/Dashboard",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "composition" } },
};

export const Default = {
  render: () => {
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
