import { expect } from "storybook/test";
import "../dist/wc/feedback.mjs";
import { booleanControls, variantControl } from "./metadata.js";

export default {
  title: "Contour/Feedback/Alert",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    ...booleanControls("c-alert"),
    title: { control: "text" },
    body: { control: "text" },
    variant: variantControl("c-alert"),
    icon: { control: "text" },
    action: { control: "text" },
    actions: { control: "text" },
    closable: { control: "boolean" },
  },
};

const render = (args = {}) => {
  const a = document.createElement("contour-alert");
  if (args.variant) a.setAttribute("variant", args.variant);
  else a.setAttribute("variant", "warning");
  if (args.title) a.setAttribute("title", args.title);
  if (args.body) a.setAttribute("body", args.body);
  if (args.icon) a.setAttribute("icon", args.icon);
  if (args.action) a.setAttribute("action", args.action);
  if (args.actions) a.setAttribute("actions", args.actions);
  if (args.closable) a.setAttribute("closable", "");
  if (!args.title && !args.body && !args.icon) a.textContent = "Heads up: something happened.";
  return a;
};

export const Default = {
  args: {
    variant: "warning",
    title: "This is a title",
    body: "This is the body of the alert.\n",
  },
  render,
  play: async ({ canvasElement }) => {
    const a = canvasElement.querySelector("contour-alert");
    await expect(a).toBeTruthy();
    await expect(a).toHaveAttribute("role", "alert");
    await expect(a).toHaveAttribute("aria-live", "assertive");
    await expect(a).toHaveClass(/c-alert/);
    await expect(a.querySelector(".c-alert__title")).toHaveTextContent("This is a title");
    await expect(a.querySelector(".c-alert__body")).toHaveTextContent("This is the body of the alert.");
  },
};

export const Danger = {
  args: { variant: "danger" },
  render,
  play: async ({ canvasElement }) => {
    const a = canvasElement.querySelector("contour-alert");
    await expect(a).toBeTruthy();
    await expect(a).toHaveClass(/c-alert/);
    await expect(a).toHaveClass(/c-alert--danger/);
    await expect(a).toHaveAttribute("role", "alert");
  },
};
