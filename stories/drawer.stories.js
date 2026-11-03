import { expect } from "storybook/test";
import "../dist/wc/feedback.mjs";

export default {
  title: "Contour/Overlays/Drawer",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    title: { control: "text" },
    body: { control: "text" },
    size: { control: "text" },
  },
};

const render = (args = {}) => {
  const d = document.createElement("contour-drawer");
  if (args.title) d.setAttribute("title", args.title);
  else d.setAttribute("title", "Settings");
  if (args.size) d.setAttribute("size", args.size);
  if (args.open) d.setAttribute("open", "");
  const p = document.createElement("p");
  p.textContent = args.body || "Drawer body";
  d.appendChild(p);
  return d;
};

export const Default = {
  args: { title: "Settings", body: "Drawer body" },
  render,
  play: async ({ canvasElement }) => {
    const d = canvasElement.querySelector("contour-drawer");
    await expect(d).toBeTruthy();
    await expect(d).toHaveClass(/c-drawer/);
    await expect(canvasElement.textContent).toContain("Settings");
  },
};

export const Open = {
  args: { title: "Settings", body: "Drawer body", open: true },
  render,
  play: async ({ canvasElement }) => {
    const d = canvasElement.querySelector("contour-drawer");
    await expect(d).toBeTruthy();
    await expect(d.classList.contains("is-open")).toBe(true);
  },
};
