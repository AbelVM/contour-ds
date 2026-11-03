import { expect } from "storybook/test";
import "../dist/wc/forms.mjs";

export default {
  title: "Contour/Forms/Field",
  tags: ["autodocs"],
  parameters: {
    contour: { maturity: "complete-widget" },

  },
  argTypes: {
    label: { control: "text" },
    hint: { control: "text" },
    error: { control: "text" },
    required: { control: "boolean" },
  },
};

const render = (args = {}) => {
  const field = document.createElement("contour-field");
  if (args.label) field.setAttribute("label", args.label); else field.setAttribute("label", "Email address");
  if (args.hint) field.setAttribute("hint", args.hint); else field.setAttribute("hint", "Used for release notifications");
  if (args.error) field.setAttribute("error", args.error);
  if (args.required) field.setAttribute("required", "");
  const input = document.createElement("contour-input");
  input.setAttribute("type", "email");
  input.setAttribute("placeholder", "you@example.com");
  field.appendChild(input);
  return field;
};

export const Default = {
  args: { label: "Email address", hint: "Used for release notifications" },
  render,
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("contour-field");
    await expect(field).toBeTruthy();
    await expect(field).toHaveClass(/c-field/);
    await expect(field.querySelector(".c-field__label")).toHaveTextContent("Email address");
    await expect(field.querySelector("input")).toHaveAttribute("type", "email");
  },
};
