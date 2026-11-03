import { expect } from "storybook/test";
import "../dist/wc/forms.mjs";

export default {
  title: "Contour/Forms/Combobox",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
};

const OPTIONS = JSON.stringify(["Apple", "Banana", "Cherry", "Date", "Elderberry"]);

export const MultiSelect = {
  render: () => {
    const c = document.createElement("contour-combobox");
    c.setAttribute("label", "Fruit");
    c.setAttribute("options", OPTIONS);
    c.setAttribute("multiple", "");
    return c;
  },
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-combobox");
    await expect(c).toBeTruthy();
    const list = c.querySelector(".c-combobox__list");
    await expect(list).toBeTruthy();
    await expect(list).toHaveAttribute("aria-multiselectable", "true");
  },
};

export const NoResults = {
  render: () => {
    const c = document.createElement("contour-combobox");
    c.setAttribute("label", "Fruit");
    c.setAttribute("options", OPTIONS);
    c.setAttribute("empty", "No fruit found");
    return c;
  },
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-combobox");
    await expect(c).toBeTruthy();
    const input = c.querySelector(".c-combobox__input");
    await expect(input).toBeTruthy();
  },
};
