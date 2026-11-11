import { expect, userEvent } from "storybook/test";
import "../dist/wc/data.mjs";
import "../dist/wc/forms.mjs";
import "../dist/wc/feedback.mjs";
import "../dist/wc/dashboard.mjs";
import "../dist/wc/interaction.mjs";
import "../dist/wc/misc.mjs";

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

export const SavedView = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "0.5rem";
    const saved = document.createElement("contour-saved-view");
    saved.setAttribute("name", "default-view");
    wrap.appendChild(saved);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("contour-saved-view")).toBeTruthy();
    await expect(canvasElement.querySelectorAll("button").length).toBe(2);
  },
};

export const Provenance = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "0.5rem";
    const prov = document.createElement("contour-provenance");
    prov.setAttribute("source", "OpenStreetMap contributors");
    prov.setAttribute("confidence", "high");
    prov.setAttribute("resolution", "10m");
    prov.setAttribute("coverage", "95%");
    prov.setAttribute("methodology", "Automated extraction with manual review");
    prov.setAttribute("warning", "Data may be outdated in rural areas");
    wrap.appendChild(prov);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("contour-provenance")).toBeTruthy();
    await expect(canvasElement.textContent).toContain("OpenStreetMap");
    await expect(canvasElement.textContent).toContain("Confidence: high");
  },
};

export const FeatureInspector = {
  id: "feature-inspector",
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "0.5rem";
    const inspector = document.createElement("contour-feature-inspector");
    inspector.setAttribute("title", "Route 42");
    inspector.setAttribute("open", "");
    inspector.setAttribute("data", JSON.stringify({ length: "12.4 km", elevation: "340 m", surface: "paved" }));
    wrap.appendChild(inspector);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("contour-feature-inspector")).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Route 42");
  },
};

export const SplitView = {
  id: "split-view",
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "0.5rem";
    wrap.style.height = "300px";
    const split = document.createElement("contour-split-view");
    split.setAttribute("value", "50");
    split.innerHTML = `
      <div class="c-split-view__pane c-split-view__pane--left" style="background:var(--color-surface-1)">Left pane</div>
      <div class="c-split-view__pane c-split-view__pane--right" style="background:var(--color-surface-2)">Right pane</div>
    `;
    wrap.appendChild(split);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    // SplitView test - verify split view renders with divider
    const split = canvasElement.querySelector("contour-split-view");
    await expect(split).toBeTruthy();
    const divider = canvasElement.querySelector(".c-split-view__divider");
    await expect(divider).toBeTruthy();
    // Verify it's not the feature inspector
    const inspector = canvasElement.querySelector("contour-feature-inspector");
    await expect(inspector).toBeNull();
  },
};

export const ActivityFeed = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "0.5rem";
    const feed = document.createElement("contour-activity-feed");
    feed.innerHTML = `
      <div class="c-activity-feed__item c-activity-feed__item--unread" tabindex="0">
        <span class="c-activity-feed__text">Route 42 updated</span>
        <span class="c-activity-feed__time">2 min ago</span>
      </div>
      <div class="c-activity-feed__item" tabindex="0">
        <span class="c-activity-feed__text">New alert in North region</span>
        <span class="c-activity-feed__time">15 min ago</span>
      </div>
    `;
    wrap.appendChild(feed);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("contour-activity-feed")).toBeTruthy();
    await expect(canvasElement.querySelectorAll(".c-activity-feed__item").length).toBe(2);
    await expect(canvasElement.querySelectorAll("button").length).toBe(2);
  },
};
