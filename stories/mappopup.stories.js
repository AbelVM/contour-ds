import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Map/MapPopup",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    title: { control: "text" },
    content: { control: "text" },
    "cluster-count": { control: "text" },
    "cluster-items": { control: "text" },
  },
};

const ITEMS = JSON.stringify(["A", "B", "C"]);

const renderDefault = (args = {}) => {
  const p = document.createElement("contour-map-popup");
  p.setAttribute("title", args.title || "Route info");
  p.setAttribute("content", args.content || "12 min");
  return p;
};

export const Default = {
  args: { title: "Route info", body: "12 min" },
  render: renderDefault,
  play: async ({ canvasElement }) => {
    const p = canvasElement.querySelector("contour-map-popup");
    await expect(p).toBeTruthy();
    await expect(p).toHaveClass(/c-map-popup/);
    await expect(canvasElement.textContent).toContain("Route info");
  },
};

export const ClusterToggle = {
  args: { title: "Cluster", "cluster-count": "3", "cluster-items": ITEMS },
  render: (args = {}) => {
    const p = document.createElement("contour-map-popup");
    p.setAttribute("title", args.title || "Cluster");
    p.setAttribute("cluster-count", args["cluster-count"] || "3");
    p.setAttribute("cluster-items", args["cluster-items"] || ITEMS);
    return p;
  },
  play: async ({ canvasElement }) => {
    const p = canvasElement.querySelector("contour-map-popup");
    await expect(p).toBeTruthy();
    await expect(p).toHaveClass(/c-map-popup/);
    const badge = p.querySelector(".c-map-popup__cluster");
    await expect(badge).toBeTruthy();
  },
};

export const WithActions = {
  args: { title: "Stop", body: "Bus 42" },
  render: (args = {}) => {
    const p = document.createElement("contour-map-popup");
    p.setAttribute("title", args.title || "Stop");
    p.setAttribute("content", args.content || "Bus 42");
    const btn = document.createElement("button");
    btn.textContent = "Navigate";
    p.appendChild(btn);
    return p;
  },
  play: async ({ canvasElement }) => {
    const p = canvasElement.querySelector("contour-map-popup");
    await expect(p).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Navigate");
  },
};
