import { expect } from "storybook/test";
import "../dist/wc/feedback.mjs";

export default {
  title: "Contour/Feedback/Accordion",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    items: { control: "text" },
    exclusive: { control: "boolean" },
  },
};

export const Default = {
  render: (args = {}) => {
    const a = document.createElement("contour-accordion");
    if (args.items) a.setAttribute("items", args.items);
    if (args.exclusive) a.setAttribute("exclusive", "");
    const item = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Section 1";
    const p = document.createElement("p");
    p.textContent = "Content here";
    item.appendChild(summary);
    item.appendChild(p);
    a.appendChild(item);
    const item2 = document.createElement("details");
    const summary2 = document.createElement("summary");
    summary2.textContent = "Section 2";
    const p2 = document.createElement("p");
    p2.textContent = "More content";
    item2.appendChild(summary2);
    item2.appendChild(p2);
    a.appendChild(item2);
    return a;
  },
  play: async ({ canvasElement }) => {
    const a = canvasElement.querySelector("contour-accordion");
    await expect(a).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Section 1");
    await expect(canvasElement.textContent).toContain("Section 2");
    await expect(canvasElement.textContent).toContain("Section 2");
  },
};

export const SingleOpen = {
  render: (args = {}) => {
    const a = document.createElement("contour-accordion");
    a.setAttribute("single", "");
    if (args.items) a.setAttribute("items", args.items);
    const item = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Section 1";
    const p = document.createElement("p");
    p.textContent = "Content here";
    item.appendChild(summary);
    item.appendChild(p);
    a.appendChild(item);
    return a;
  },
  play: async ({ canvasElement }) => {
    const a = canvasElement.querySelector("contour-accordion");
    await expect(a).toBeTruthy();
    await expect(a.hasAttribute("single")).toBe(true);
  },
};
