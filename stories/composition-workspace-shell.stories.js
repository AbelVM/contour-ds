import { expect, userEvent } from "storybook/test";
import "../dist/wc/layout.mjs";
import "../dist/wc/navigation.mjs";
import "../dist/wc/data.mjs";
import "../dist/wc/feedback.mjs";

export default {
  title: "Contour/Compositions/WorkspaceShell",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "composition" } },
};

export const DockWorkspaceShell = {
  render: () => {
    const root = document.createElement("div");
    root.className = "c-workspace-shell";
    root.style.minHeight = "24rem";

    const header = document.createElement("contour-header");
    header.setAttribute("brand", "Contour Workspace");
    header.setAttribute("nav", JSON.stringify([
      { label: "Dashboard", href: "#dashboard", current: true },
      { label: "Layers", href: "#layers" },
      { label: "Settings", href: "#settings" }
    ]));

    const body = document.createElement("div");
    body.className = "c-workspace-shell__body";

    const sidebar = document.createElement("aside");
    sidebar.className = "c-workspace-shell__sidebar c-panel";
    sidebar.style.padding = "var(--space-sm)";
    sidebar.innerHTML = `
      <h3>Navigation</h3>
      <nav aria-label="Workspace sections">
        <ul style="margin:0;padding:0;list-style:none;display:grid;gap:0.25rem">
          <li><a href="#overview" aria-current="page">Overview</a></li>
          <li><a href="#routes">Routes</a></li>
          <li><a href="#reports">Reports</a></li>
        </ul>
      </nav>`;

    const stage = document.createElement("main");
    stage.className = "c-workspace-shell__stage c-panel";
    stage.style.padding = "var(--space-sm)";
    stage.innerHTML = `
      <button class="c-workspace-shell__inspector-toggle" type="button" popovertarget="workspace-inspector">Inspector</button>
      <h3 id="workspace-stage-title">Central stage</h3>
      <p id="workspace-stage-status">Overview selected</p>
      <div class="c-table-wrap" style="margin-top:0.5rem">
        <contour-table columns='["Region","Volume","Status"]' rows='[["North","842","Open"],["South","617","Review"]]'></contour-table>
      </div>`;

    const handle = document.createElement("contour-resize-handle");
    handle.className = "c-workspace-shell__resize";
    handle.setAttribute("label", "Resize inspector");

    const inspector = document.createElement("contour-panel");
    inspector.className = "c-workspace-shell__inspector";
    inspector.id = "workspace-inspector";
    inspector.setAttribute("popover", "");
    inspector.setAttribute("title", "Docked inspector");
    inspector.setAttribute("subtitle", "Selection details");
    inspector.setAttribute("collapsible", "");
    inspector.innerHTML = `
      <contour-kpi label="Coverage" value="96%"></contour-kpi>
      <p style="margin-top:0.5rem">Inspector remains docked beside the central stage.</p>`;

    body.append(sidebar, stage, handle, inspector);
    root.append(header, body);

    // Lightweight composition behavior: reflect nav clicks in stage status.
    sidebar.addEventListener("click", (e) => {
      const a = e.target && e.target.closest ? e.target.closest("a") : null;
      if (!a) return;
      e.preventDefault();
      sidebar.querySelectorAll("a").forEach((link) => link.removeAttribute("aria-current"));
      a.setAttribute("aria-current", "page");
      stage.querySelector("#workspace-stage-status").textContent = `${a.textContent} selected`;
    });

    return root;
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector(".c-workspace-shell");
    const header = canvasElement.querySelector("contour-header");
    const sidebar = canvasElement.querySelector("aside nav");
    const stage = canvasElement.querySelector("main");
    const handle = canvasElement.querySelector("contour-resize-handle");
    const inspector = canvasElement.querySelector("contour-panel");
    const table = canvasElement.querySelector("contour-table");
    const status = canvasElement.querySelector("#workspace-stage-status");

    await expect(root).toBeTruthy();
    await expect(header).toBeTruthy();
    await expect(sidebar).toBeTruthy();
    await expect(stage).toBeTruthy();
    await expect(handle).toBeTruthy();
    await expect(inspector).toBeTruthy();
    await expect(table).toBeTruthy();
    await expect(inspector).toHaveAttribute("title", "Docked inspector");
    await expect(inspector).toHaveAttribute("popover", "");
    await expect(canvasElement.querySelector(".c-workspace-shell__inspector-toggle")).toBeTruthy();
    await expect(canvasElement.querySelector(".c-workspace-shell__body")).toBeTruthy();

    const routes = sidebar.querySelectorAll("a")[1];
    await userEvent.click(routes);
    await expect(status.textContent).toBe("Routes selected");
    await expect(routes).toHaveAttribute("aria-current", "page");
  },
};
