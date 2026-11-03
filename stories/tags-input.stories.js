import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Forms/TagsInput",
  tags: ["autodocs"],
  parameters: {
    contour: { maturity: "complete-widget" },
    a11y: { test: "todo" },
    issue: "SB-A11Y-03",
    a11yTodo: { owner: "Contour maintainers", rootCause: "isolated tags input lacks form context", mitigation: "verify labels and validation in form workflow", review: "2026-12-01" },
  },
  argTypes: {
    value: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    error: { control: "text" },
    help: { control: "text" },
  },
};

const render = (args = {}) => {
  const t = document.createElement("contour-tags-input");
  if (args.label) t.setAttribute("label", args.label); else t.setAttribute("label", "Tags");
  if (args.value) t.setAttribute("value", args.value);
  if (args.placeholder) t.setAttribute("placeholder", args.placeholder);
  if (args.disabled) t.setAttribute("disabled", "");
  if (args.error) t.setAttribute("error", args.error);
  if (args.help) t.setAttribute("help", args.help);
  return t;
};

export const Default = {
  args: { label: "Tags", value: JSON.stringify(["Route A", "Route B"]) },
  render,
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-tags-input");
    await expect(t).toBeTruthy();
    await expect(t).toHaveClass(/c-tags-input/);
    await expect(t.querySelectorAll(".c-tag").length).toBe(2);
  },
};

export const Empty = {
  args: { label: "Tags", placeholder: "Add tag" },
  render,
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-tags-input");
    await expect(t).toBeTruthy();
    await expect(t).toHaveClass(/c-tags-input/);
  },
};

export const WithMax = {
  args: { label: "Tags", value: JSON.stringify(["A", "B", "C"]) },
  render,
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-tags-input");
    await expect(t).toBeTruthy();
    await expect(t.querySelectorAll(".c-tag").length).toBe(3);
  },
};
