import { expect, userEvent } from "storybook/test";
import "../dist/wc/forms.mjs";
import { fixtureArgs } from "./fixtures.js";

export default {
  title: "Contour/Forms/Select",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
  },
};

export const Default = {
  render: () => {
    const s = document.createElement("contour-select");
    s.setAttribute("label", "Country");
    const opt1 = document.createElement("option"); opt1.value = "us"; opt1.textContent = "United States";
    const opt2 = document.createElement("option"); opt2.value = "ca"; opt2.textContent = "Canada";
    s.appendChild(opt1); s.appendChild(opt2);
    return s;
  },
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-select");
    await expect(s).toBeTruthy();
    await expect(canvasElement.textContent).toContain("United States");
  },
};

export const Reactivity = {
  render: () => {
    const s = document.createElement("contour-select");
    s.setAttribute("label", "Country");
    return s;
  },
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-select");
    await expect(s).toBeTruthy();
    s.setAttribute("label", "Region");
    await expect(s).toHaveAttribute("label", "Region");
  },
};

export const ChangeEvent = {
  args: fixtureArgs("contour-select"),
  render: ({ options }) => {
    const select = document.createElement("contour-select");
    select.setAttribute("label", "Country");
    select.setAttribute("options", options);
    return select;
  },
  play: async ({ canvasElement }) => {
    const select = canvasElement.querySelector("contour-select");
    const control = canvasElement.querySelector("select");
    const changed = new Promise((resolve) => {
      select.addEventListener("contour:change", (event) => resolve(event.detail), { once: true });
    });
    await userEvent.selectOptions(control, "ca");
    const detail = await changed;
    await expect(detail).toEqual({ name: null, value: "ca", checked: null });
  },
};
