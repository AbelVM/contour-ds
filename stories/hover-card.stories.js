import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Overlays/HoverCard",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    title: { control: "text" },
  },
};

const renderDefault = (args = {}) => {
  const h = document.createElement("contour-hover-card");
  if (args.title) h.setAttribute("title", args.title);
  const trigger = document.createElement("button");
  trigger.textContent = "Hover";
  h.appendChild(trigger);
  const content = document.createElement("div");
  content.textContent = "Card content";
  h.appendChild(content);
  return h;
};

export const Default = {
  args: {},
  render: renderDefault,
  play: async ({ canvasElement }) => {
    const h = canvasElement.querySelector("contour-hover-card");
    await expect(h).toBeTruthy();
    await expect(h).toHaveClass(/c-hover-card/);
    await expect(canvasElement.textContent).toContain("Hover");
    await expect(canvasElement.textContent).toContain("Card content");
  },
};

export const WithTitle = {
  args: { title: "Preview" },
  render: (args = {}) => {
    const h = document.createElement("contour-hover-card");
    h.setAttribute("title", args.title || "Preview");
    const trigger = document.createElement("a");
    trigger.textContent = "Link";
    trigger.href = "#";
    h.appendChild(trigger);
    return h;
  },
  play: async ({ canvasElement }) => {
    const h = canvasElement.querySelector("contour-hover-card");
    await expect(h).toBeTruthy();
    await expect(h).toHaveClass(/c-hover-card/);
    await expect(canvasElement.textContent).toContain("Link");
  },
};
