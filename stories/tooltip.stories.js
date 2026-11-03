import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Overlays/Tooltip",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    text: { control: "text" },
    anchor: { control: "text" },
    delay: { control: "text" },
    trigger: { control: "text" },
  },
};

const render = (args = {}) => {
  const btn = document.createElement("button");
  btn.textContent = args.label || "Hover me";
  const t = document.createElement("contour-tooltip");
  if (args.text) t.setAttribute("text", args.text);
  else t.setAttribute("text", "Helpful hint");
  if (args.anchor) t.setAttribute("anchor", args.anchor);
  if (args.delay) t.setAttribute("delay", args.delay);
  if (args.trigger) t.setAttribute("trigger", args.trigger);
  if (args.position) t.setAttribute("position", args.position);
  t.appendChild(btn);
  return t;
};

export const Default = {
  args: { text: "Helpful hint", label: "Hover me" },
  render,
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-tooltip");
    await expect(t).toBeTruthy();
    await expect(t).toHaveClass(/c-tooltip/);
    await expect(canvasElement.textContent).toContain("Hover me");
  },
};

export const WithPosition = {
  args: { text: "Detailed information", position: "bottom", label: "Info" },
  render: (args) => {
    const btn = document.createElement("button");
    btn.textContent = args.label || "Info";
    const t = document.createElement("contour-tooltip");
    t.setAttribute("text", args.text || "Detailed information");
    t.setAttribute("position", args.position || "bottom");
    t.appendChild(btn);
    return t;
  },
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-tooltip");
    await expect(t).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Info");
  },
};
