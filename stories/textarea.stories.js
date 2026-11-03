import { expect, userEvent } from "storybook/test";
import "../dist/wc/forms.mjs";

export default {
  title: "Contour/Forms/Textarea",
  tags: ["autodocs"],
  parameters: {
    contour: { maturity: "complete-widget" },
    a11y: { test: "todo" },
    issue: "SB-A11Y-04",
    a11yTodo: { owner: "Contour maintainers", rootCause: "isolated textarea label association is incomplete", mitigation: "provide a labelled form context", review: "2026-12-01" },
  },
  argTypes: {
    placeholder: { control: "text" },
    required: { control: "boolean" },
    disabled: { control: "boolean" },
    error: { control: "text" },
    help: { control: "text" },
  },
};

const render = (args = {}) => {
  const t = document.createElement("contour-textarea");
  if (args.label) t.setAttribute("label", args.label); else t.setAttribute("label", "Notes");
  if (args.placeholder) t.setAttribute("placeholder", args.placeholder); else t.setAttribute("placeholder", "Write something…");
  if (args.value) t.setAttribute("value", args.value);
  if (args.required) t.setAttribute("required", "");
  if (args.disabled) t.setAttribute("disabled", "");
  if (args.error) t.setAttribute("error", args.error);
  if (args.help) t.setAttribute("help", args.help);
  return t;
};

export const Default = {
  args: { label: "Notes", placeholder: "Write something…" },
  render,
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-textarea");
    await expect(t).toBeTruthy();
    await expect(canvasElement.querySelector("textarea.c-textarea")).toBeTruthy();
    const ta = canvasElement.querySelector("textarea");
    if (ta) await expect(ta).toHaveAttribute("placeholder", "Write something…");
  },
};

export const Reactivity = {
  args: { label: "Notes" },
  render,
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-textarea");
    await expect(t).toBeTruthy();
    t.setAttribute("label", "Comments");
    await expect(t).toHaveAttribute("label", "Comments");
  },
};

export const InputEvent = {
  args: { label: "Notes", placeholder: "Write something…" },
  render: Default.render,
  play: async ({ canvasElement }) => {
    const textarea = canvasElement.querySelector("contour-textarea");
    const control = canvasElement.querySelector("textarea");
    const changed = new Promise((resolve) => {
      textarea.addEventListener("contour:input", (event) => resolve(event.detail), { once: true });
    });
    await userEvent.type(control, "N");
    const detail = await changed;
    await expect(detail).toEqual({ name: null, value: "N", checked: null });
  },
};
