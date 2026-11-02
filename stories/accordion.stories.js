import { expect } from "storybook/test";
import "../dist/wc/feedback.mjs";

export default {
  title: "Contour/Feedback/Accordion",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {},
};

export const Default = {
  render: () => {
    const a = document.createElement("contour-accordion");
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
    await expect(canvasElement.textContent).toContain("Section 1");
  },
};
