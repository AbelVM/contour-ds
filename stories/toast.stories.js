import { expect } from "storybook/test";
import "../dist/wc/feedback.mjs";

export default {
  title: "Contour/Feedback/Toast",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {},
};

export const Default = {
  render: () => {
    const t = document.createElement("contour-toast");
    t.textContent = "Saved successfully";
    return t;
  },
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-toast");
    await expect(t).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Saved");
  },
};

export const Reactivity = {
  render: () => {
    const t = document.createElement("contour-toast");
    t.textContent = "Saved successfully";
    return t;
  },
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-toast");
    await expect(t).toBeTruthy();
    t.textContent = "Updated";
    await expect(canvasElement.textContent).toContain("Updated");
  },
};
