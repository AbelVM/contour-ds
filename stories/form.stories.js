import { expect, userEvent } from "storybook/test";
import "../dist/wc/forms.mjs";

export default {
  title: "Contour/Forms/Form",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    "submit-label": { control: "text" },
    submitting: { control: "boolean" },
    error: { control: "text" },
    summary: { control: "text" },
  },
};

const render = (args = {}) => {
  const f = document.createElement("contour-form");
  f.setAttribute("title", args.title || "Route form");
  f.setAttribute("submit-label", args["submit-label"] || "Save");
  if (args.submitting) f.setAttribute("submitting", "");
  if (args.error) f.setAttribute("error", args.error);
  if (args.summary) f.setAttribute("summary", args.summary);
  return f;
};

export const Default = {
  args: { title: "Route form", "submit-label": "Save" },
  render,
  play: async ({ canvasElement }) => {
    const f = canvasElement.querySelector("contour-form");
    await expect(f).toBeTruthy();
    await expect(f).toHaveClass(/c-form/);
  },
};

export const WithFields = {
  args: { title: "Route form", "submit-label": "Save" },
  render: (args = {}) => {
    const f = document.createElement("contour-form");
    f.setAttribute("title", args.title || "Route form");
    f.setAttribute("submit-label", args["submit-label"] || "Save");
    const input = document.createElement("contour-input");
    input.setAttribute("label", "Route name");
    input.setAttribute("placeholder", "Morning loop");
    f.appendChild(input);
    return f;
  },
  play: async ({ canvasElement }) => {
    const f = canvasElement.querySelector("contour-form");
    await expect(f).toBeTruthy();
    await expect(f.querySelector("contour-input")).toBeTruthy();
  },
};

export const SubmitState = {
  args: { title: "Route form", "submit-label": "Save", submitting: true },
  render: (args = {}) => {
    const f = document.createElement("contour-form");
    f.setAttribute("title", args.title || "Route form");
    f.setAttribute("submit-label", args["submit-label"] || "Save");
    f.setAttribute("submitting", "");
    const btn = document.createElement("button");
    btn.className = "c-btn c-btn--primary c-form__submit";
    btn.type = "submit";
    btn.textContent = "Save";
    btn.setAttribute("disabled", "");
    f.appendChild(btn);
    return f;
  },
  play: async ({ canvasElement }) => {
    const f = canvasElement.querySelector("contour-form");
    await expect(f).toBeTruthy();
    await expect(f.classList.contains("is-submitting")).toBe(true);
  },
};
