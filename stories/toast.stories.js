import { expect } from "storybook/test";
import "../dist/wc/feedback.mjs";

export default {
  title: "Contour/Feedback/Toast",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    message: { control: "text" },
    variant: { control: "text" },
    duration: { control: "text" },
  },
};

const render = (args = {}) => {
  const t = document.createElement("contour-toast");
  if (args.variant) t.setAttribute("variant", args.variant);
  if (args.duration) t.setAttribute("duration", args.duration);
  if (args.message) t.textContent = args.message;
  else t.textContent = "Saved successfully";
  return t;
};

export const Default = {
  args: { message: "Saved successfully" },
  render,
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-toast");
    await expect(t).toBeTruthy();
    await expect(t).toHaveClass(/c-toast/);
    await expect(canvasElement.textContent).toContain("Saved");
  },
};

export const Reactivity = {
  args: { message: "Saved successfully" },
  render,
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-toast");
    await expect(t).toBeTruthy();
    t.textContent = "Updated";
    await expect(canvasElement.textContent).toContain("Updated");
  },
};
