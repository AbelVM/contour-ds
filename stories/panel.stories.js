import { expect } from "storybook/test";
import "../dist/wc/content.mjs";

export default {
  title: "Contour/Content/Panel",
  tags: ["autodocs"],
  parameters: {
    a11y: { test: "error" }, contour: { maturity: "complete-widget" } },
  argTypes: {
    title: { control: "text" },
    subtitle: { control: "text" },
    status: { control: "text" },
    flush: { control: "boolean" },
    collapsible: { control: "boolean" },
  },
};

const render = (args = {}) => {
  const p = document.createElement("contour-panel");
  if (args.title) p.setAttribute("title", args.title);
  if (args.subtitle) p.setAttribute("subtitle", args.subtitle);
  if (args.status) p.setAttribute("status", args.status);
  if (args.flush) p.setAttribute("flush", "");
  if (args.collapsible) p.setAttribute("collapsible", "");
  const body = document.createElement("p");
  body.textContent = "Panel content goes here.";
  p.appendChild(body);
  return p;
};

export const Default = {
  args: { title: "Overview", subtitle: "Key metrics" },
  render,
  play: async ({ canvasElement }) => {
    const p = canvasElement.querySelector("contour-panel");
    await expect(p).toBeTruthy();
    await expect(p).toHaveClass(/c-panel/);
    await expect(canvasElement.textContent).toContain("Overview");
  },
};

export const WithStatus = {
  args: { title: "Live data", status: "live" },
  render,
  play: async ({ canvasElement }) => {
    const p = canvasElement.querySelector("contour-panel");
    await expect(p).toBeTruthy();
    const status = p.querySelector(".c-panel__status--live");
    await expect(status).toBeTruthy();
  },
};

export const Flush = {
  args: { title: "Edge-to-edge", flush: true },
  render,
  play: async ({ canvasElement }) => {
    const p = canvasElement.querySelector("contour-panel");
    await expect(p).toBeTruthy();
    const body = p.querySelector(".c-panel__body--flush");
    await expect(body).toBeTruthy();
  },
};

export const Collapsible = {
  args: { title: "Collapsible panel", collapsible: true },
  render,
  play: async ({ canvasElement }) => {
    const p = canvasElement.querySelector("contour-panel");
    await expect(p).toBeTruthy();
    const btn = p.querySelector(".c-panel__collapse");
    await expect(btn).toBeTruthy();
  },
};