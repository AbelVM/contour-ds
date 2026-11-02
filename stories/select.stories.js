import { expect } from "storybook/test";
import "../dist/wc/forms.mjs";

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
