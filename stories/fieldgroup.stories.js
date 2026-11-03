import { expect } from "storybook/test";
import "../dist/wc/forms.mjs";

export default {
  title: "Contour/Forms/FieldGroup",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
};

export const Default = {
  render: () => {
    const g = document.createElement("contour-field-group");
    g.setAttribute("label", "Group");
    return g;
  },
  play: async ({ canvasElement }) => {
    const g = canvasElement.querySelector("contour-field-group");
    await expect(g).toBeTruthy();
  },
};
