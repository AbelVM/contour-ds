import { expect, userEvent } from "storybook/test";
import "../dist/wc/data.mjs";
import "../dist/wc/forms.mjs";

export default {
  title: "Contour/Compositions/TableFilters",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "composition" } },
};

export const TableWithFilterBar = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "1rem";
    wrap.innerHTML = `
      <contour-filter-bar
        label="Filters"
        items='[{"name":"status","label":"Status","type":"select","options":[{"value":"all","label":"All"},{"value":"open","label":"Open"},{"value":"closed","label":"Closed"}]}'
        count="2"
        clearable
      ></contour-filter-bar>
      <div class="c-table-wrap">
        <contour-table
          columns='["Region","Volume","Status"]'
          rows='[["North","842","Open"],["South","617","Review"],["East","423","Closed"],["West","291","Open"]]'
        ></contour-table>
      </div>
    `;
    return wrap;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("contour-filter-bar")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-table")).toBeTruthy();
    await expect(canvasElement.querySelector(".c-table-wrap")).toBeTruthy();
  },
};

export const TableWithPaginationAndSorting = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "1rem";
    wrap.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3>Regional Metrics</h3>
        <contour-pagination pages="5" current="1" persist="storage" id="demo-pagination"></contour-pagination>
      </div>
      <div class="c-table-wrap">
        <contour-table
          columns='["Region","Volume","Status","Last Updated"]'
          rows='[["North","842","Open","2024-01-15"],["South","617","Review","2024-01-14"],["East","423","Closed","2024-01-13"],["West","291","Open","2024-01-12"],["Central","156","Pending","2024-01-11"]]'
        ></contour-table>
      </div>
    `;
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const pagination = canvasElement.querySelector("contour-pagination");
    await expect(canvasElement.querySelector("contour-table")).toBeTruthy();
    await expect(pagination).toBeTruthy();
    await expect(pagination.querySelector("[aria-current='page']")?.textContent).toBe("1");
    const next = pagination.querySelector("[data-action='next']");
    await expect(next).toBeTruthy();
    await userEvent.click(next);
    await expect(pagination).toHaveAttribute("page", "2");
    await expect(pagination.querySelector("[aria-current='page']")?.textContent).toBe("2");
  },
};

export const TableWithSelectionAndBulkActions = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "1rem";
    wrap.innerHTML = `
      <div style="display:flex;gap:0.5rem;align-items:center">
        <span id="selection-count">0 selected</span>
        <button class="c-button c-button--secondary" id="bulk-action" disabled>Bulk Action</button>
      </div>
      <div class="c-table-wrap">
        <contour-table
          id="selection-table"
          columns='["Select","Region","Volume","Status"]'
          rows='[["","North","842","Open"],["","South","617","Review"],["","East","423","Closed"],["","West","291","Open"]]'
        ></contour-table>
      </div>
    `;
    return wrap;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("contour-table")).toBeTruthy();
    await expect(canvasElement.querySelector("#selection-count")).toBeTruthy();
  },
};
