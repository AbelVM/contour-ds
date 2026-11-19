import { expect } from "storybook/test";
import "../dist/wc/interaction.mjs";

export default {
  title: "Contour/Overlays/SideSheet",
  tags: ["autodocs"],
  parameters: {
    a11y: { test: "error" }, contour: { maturity: "complete-widget" } },
  argTypes: {
    side: { control: "select", options: ["start", "end"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
    mode: { control: "select", options: ["push", "overlay"] },
  },
};

const render = (args = {}) => {
  const s = document.createElement("contour-side-sheet");
  if (args.side) s.setAttribute("side", args.side);
  if (args.size) s.setAttribute("size", args.size);
  if (args.mode) s.setAttribute("mode", args.mode);
  const body = document.createElement("p");
  body.textContent = "Side sheet content";
  s.appendChild(body);
  return s;
};

export const Default = {
  args: { side: "end", size: "md", mode: "overlay" },
  render,
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-side-sheet");
    await expect(s).toBeTruthy();
    await expect(s).toHaveClass(/c-side-sheet/);
  },
};

export const Reactivity = {
  args: { side: "start" },
  render,
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-side-sheet");
    await expect(s).toBeTruthy();
    s.setAttribute("side", "end");
    await expect(s).toHaveAttribute("side", "end");
  },
};