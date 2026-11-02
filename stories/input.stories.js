import { expect, userEvent, within } from "storybook/test";
import "../dist/wc/forms.mjs";

export default {
  title: "Contour/Forms/Input",
  tags: ["autodocs"],
  parameters: {
    contour: { maturity: "complete-widget" },
    a11y: { test: "todo" },
  },
};

const render = (args) => {
  const field = document.createElement("contour-field");
  if (args.label) field.setAttribute("label", args.label);
  const input = document.createElement("contour-input");
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
    const input = canvasElement.querySelector("contour-input, input");
    await expect(input).toBeTruthy();
  },
};

export const WithValue = {
  render,
  args: { label: "Email", value: "abel@example.com" },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector("contour-input, input");
    await expect(input).toBeTruthy();
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
