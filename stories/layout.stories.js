import { expect, userEvent } from "storybook/test";
import "../dist/wc/layout.mjs";

export default {
  title: "Contour/Layout/Primitives",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "primitive" } },
};

const wrap = (tag, label) => {
  const el = document.createElement(tag);
  el.textContent = label || tag;
  return el;
};

export const Box = {
  render: () => wrap("contour-box", "Box"),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector("contour-box");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-box/);
  },
};

export const Cluster = {
  render: () => wrap("contour-cluster", "Cluster"),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector("contour-cluster");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-cluster/);
  },
};

export const Container = {
  render: () => wrap("contour-container", "Container"),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector("contour-container");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-container/);
  },
};

export const Row = {
  render: () => wrap("contour-row", "Row"),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector("contour-row");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-row/);
  },
};

export const Scrim = {
  render: () => wrap("contour-scrim", "Scrim"),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector("contour-scrim");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-scrim/);
  },
};

export const Stack = {
  render: () => wrap("contour-stack", "Stack"),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector("contour-stack");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-stack/);
  },
};


export const SidebarResponsiveShell = {
  render: () => {
    const shell = document.createElement("div");
    shell.style.display = "grid";
    shell.style.gridTemplateColumns = "240px 1fr";
    shell.style.gap = "1rem";
    shell.style.minHeight = "16rem";

    const sidebar = document.createElement("contour-sidebar");
    sidebar.setAttribute("title", "Navigation");
    sidebar.setAttribute("items", JSON.stringify([
      { label: "Overview", href: "#overview" },
      { label: "Layers", href: "#layers" },
      { label: "Settings", href: "#settings" }
    ]));

    const toggle = document.createElement("button");
    toggle.className = "c-button c-button--secondary c-sidebar__toggle";
    toggle.type = "button";
    toggle.textContent = "Toggle sidebar";

    const main = document.createElement("main");
    main.className = "c-panel";
    main.innerHTML = "<h3>Workspace</h3><p id='sidebar-shell-status'>expanded</p>";

    const aside = document.createElement("aside");
    // The toggle belongs inside the sidebar: `contour-sidebar` wires the
    // `.c-sidebar__toggle` it contains and emits `contour:toggle`. A button
    // placed beside the host would be a control nobody listens to.
    sidebar.prepend(toggle);
    aside.append(sidebar);
    shell.append(aside, main);

    const sync = () => {
      const collapsed = sidebar.hasAttribute("collapsed");
      shell.style.gridTemplateColumns = collapsed ? "4rem 1fr" : "240px 1fr";
      main.querySelector("#sidebar-shell-status").textContent = collapsed ? "collapsed" : "expanded";
    };
    sidebar.addEventListener("contour:toggle", sync);
    sync();
    return shell;
  },
  play: async ({ canvasElement }) => {
    const sidebar = canvasElement.querySelector("contour-sidebar");
    const toggle = canvasElement.querySelector(".c-sidebar__toggle");
    const status = canvasElement.querySelector("#sidebar-shell-status");
    await expect(sidebar).toBeTruthy();
    await expect(sidebar).toHaveAttribute("role", "navigation");
    await expect(status.textContent).toBe("expanded");
    await userEvent.click(toggle);
    await expect(sidebar).toHaveAttribute("collapsed", "");
    await expect(status.textContent).toBe("collapsed");
  },
};
