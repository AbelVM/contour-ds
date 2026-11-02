import { expect } from "storybook/test";
import "../dist/wc/feedback.mjs";

export default {
  title: "Contour/Feedback/Alert",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {},
};

export const Default = {
  render: () => {
    const a = document.createElement("contour-alert");
    a.setAttribute("variant", "info");
    a.textContent = "Heads up: something happened.";
    return a;
  },
  play: async ({ canvasElement }) => {
    const a = canvasElement.querySelector("contour-alert");
    await expect(a).toBeTruthy();
    await expect(a).toHaveAttribute("role", "alert");
    await expect(canvasElement.textContent).toContain("Heads up");
  },
};

export const Danger = {
  render: () => {
    const a = document.createElement("contour-alert");
    a.setAttribute("variant", "danger");
    a.textContent = "Something failed.";
    return a;
  },
  play: async ({ canvasElement }) => {
    const a = canvasElement.querySelector("contour-alert");
    await expect(a).toBeTruthy();
    await expect(a).toHaveClass(/c-alert--danger/);
  },
};
