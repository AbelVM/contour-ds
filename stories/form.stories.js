import { expect } from "storybook/test";
import "../dist/wc/forms.mjs";

export default {
  title: "Contour/Forms/Form",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
};

export const Default = {
  render: () => {
    const f = document.createElement("contour-form");
    return f;
  },
  play: async ({ canvasElement }) => {
    const f = canvasElement.querySelector("contour-form");
    await expect(f).toBeTruthy();
  },
};
