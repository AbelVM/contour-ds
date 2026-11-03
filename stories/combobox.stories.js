import { expect } from "storybook/test";
import "../dist/wc/forms.mjs";

export default {
  title: "Contour/Forms/Combobox",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    label: { control: "text" },
    options: { control: "text" },
    placeholder: { control: "text" },
    value: { control: "text" },
    multiple: { control: "boolean" },
    empty: { control: "text" },
    loading: { control: "boolean" },
    error: { control: "text" },
  },
};

const OPTIONS = JSON.stringify(["Apple", "Banana", "Cherry", "Date", "Elderberry"]);

const render = (args = {}) => {
  const c = document.createElement("contour-combobox");
  c.setAttribute("label", args.label || "Fruit");
  c.setAttribute("options", args.options || OPTIONS);
  if (args.placeholder) c.setAttribute("placeholder", args.placeholder);
  if (args.value) c.setAttribute("value", args.value);
  if (args.multiple) c.setAttribute("multiple", "");
  if (args.empty) c.setAttribute("empty", args.empty);
  if (args.loading) c.setAttribute("loading", "");
  if (args.error) c.setAttribute("error", args.error);
  if (args.help) c.setAttribute("help", args.help);
  return c;
};

export const MultiSelect = {
  args: { label: "Fruit", options: OPTIONS, multiple: true },
  render,
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-combobox");
    await expect(c).toBeTruthy();
    await expect(c).toHaveClass(/c-combobox/);
    const list = c.querySelector(".c-combobox__list");
    await expect(list).toBeTruthy();
    await expect(list).toHaveAttribute("aria-multiselectable", "true");
  },
};

export const NoResults = {
  args: { label: "Fruit", options: OPTIONS, empty: "No fruit found" },
  render,
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-combobox");
    await expect(c).toBeTruthy();
    const input = c.querySelector(".c-combobox__input");
    await expect(input).toBeTruthy();
  },
};
