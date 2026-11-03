import { expect, userEvent, within } from "storybook/test";
import "../dist/wc/forms.mjs";

export default {
  title: "Contour/Forms/Input",
  tags: ["autodocs"],
  parameters: {
    contour: { maturity: "complete-widget" },
  },
};

const render = (args) => {
  const field = document.createElement("contour-field");
  if (args.label) field.setAttribute("label", args.label);
  if (args.hint) field.setAttribute("hint", args.hint);
  if (args.error) field.setAttribute("error", args.error);
  if (args.required) field.setAttribute("required", "");
  const input = document.createElement("contour-input");
  if (args.name) input.setAttribute("name", args.name);
  if (args.value) input.setAttribute("value", args.value);
  if (args.placeholder) input.setAttribute("placeholder", args.placeholder);
  if (args.disabled) input.setAttribute("disabled", "");
  field.appendChild(input);
  return field;
};

export const Default = {
  render,
  args: { label: "Email", placeholder: "you@example.com" },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector("input");
    await expect(input).toBeTruthy();
    await expect(input).toHaveAttribute("placeholder", "you@example.com");
    await expect(canvasElement.querySelector("contour-field")).toHaveClass(/c-field/);
  },
};

export const WithValue = {
  render,
  args: { label: "Email", value: "abel@example.com" },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector("input");
    await expect(input).toBeTruthy();
    await expect(input.value).toBe("abel@example.com");
  },
};

export const Disabled = {
  render,
  args: { label: "Email", disabled: true },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector("input");
    if (input) await expect(input).toBeDisabled();
  },
};

export const Typing = {
  render,
  args: { label: "Email", placeholder: "you@example.com" },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector("input");
    await userEvent.type(input, "abel@example.com");
    await expect(input.value).toBe("abel@example.com");
  },
};

export const InputEvent = {
  render,
  args: { label: "Email", name: "email", placeholder: "you@example.com" },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("contour-field");
    const input = canvasElement.querySelector("input");
    const changed = new Promise((resolve) => {
      field.addEventListener("contour:input", (event) => resolve(event.detail), { once: true });
    });
    await userEvent.type(input, "a");
    const detail = await changed;
    await expect(detail).toEqual({ name: "email", value: "a", checked: null });
  },
};

export const RequiredValidation = {
  render,
  args: { label: "Email", required: true },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("contour-field");
    await expect(field).toHaveAttribute("required", "");
    const input = canvasElement.querySelector("input");
    await expect(input).toBeTruthy();
  },
};

export const Reactivity = {
  render,
  args: { label: "Email", value: "first" },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector("input");
    await expect(input.value).toBe("first");
  },
};

export const InputPropertyReflection = {
  render: (args = {}) => document.createElement("contour-input"),
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector("contour-input");
    input.value = "from-property";
    await expect(input).toHaveAttribute("value", "from-property");
    await expect(input.value).toBe("from-property");
    input.setAttribute("value", "from-attribute");
    await expect(input.value).toBe("from-attribute");
    input.value = null;
    await expect(input).not.toHaveAttribute("value");
  },
};
