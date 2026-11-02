import { expect } from "storybook/test";
import "../dist/wc/forms.mjs";

export default {
  title: "Contour/Forms/Field",
  tags: ["autodocs"],
  parameters: {
    contour: { maturity: "complete-widget" },
    a11y: { test: "todo" },
    issue: "SB-A11Y-05",
    a11yTodo: { owner: "Contour maintainers", rootCause: "field story lacks consumer form context", mitigation: "add labelled form workflow before promotion", review: "2026-12-01" },
  },
};

export const Default = {
  render: () => {
    const field = document.createElement("contour-field");
    field.setAttribute("label", "Email address");
    field.setAttribute("hint", "Used for release notifications");
    const input = document.createElement("contour-input");
    input.setAttribute("type", "email");
    input.setAttribute("placeholder", "you@example.com");
    field.appendChild(input);
    return field;
  },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("contour-field");
    await expect(field).toBeTruthy();
    await expect(field.querySelector(".c-field__label")).toHaveTextContent("Email address");
    await expect(field.querySelector("input")).toHaveAttribute("type", "email");
  },
};