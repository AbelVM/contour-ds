import { expect, userEvent } from "storybook/test";
import "../dist/wc/forms.mjs";

export default {
  title: "Contour/Compositions/ComboboxField",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "composition" } },
};

export const ComboboxWithLabelAndError = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "c-field";
    wrap.innerHTML = `
      <label class="c-label" for="comp-fruit">Fruit</label>
      <contour-combobox id="comp-fruit" label="Fruit" options='["Apple","Banana","Cherry"]' placeholder="Choose"></contour-combobox>
      <p class="c-field__error" id="comp-fruit-err">Select a fruit</p>
    `;
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const combo = canvasElement.querySelector("contour-combobox");
    await expect(combo).toBeTruthy();
    const input = combo.querySelector("input, .c-combobox__input");
    await expect(input || combo).toBeTruthy();
    const err = canvasElement.querySelector("#comp-fruit-err");
    await expect(err.textContent).toContain("Select a fruit");
  },
};
