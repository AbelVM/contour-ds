import { expect } from "storybook/test";
import "../dist/wc/forms.mjs";

export default {
  title: "Contour/Forms/Switch",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    label: { control: "text" },
    checked: { control: "boolean" },
  },
};

export const Default = {
  render: () => {
    const s = document.createElement("contour-switch");
    s.setAttribute("label", "Enable notifications");
    return s;
  },
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-switch");
    await expect(s).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Enable notifications");
  },
};

export const Checked = {
  render: () => {
    const s = document.createElement("contour-switch");
    s.setAttribute("label", "Enable notifications");
    s.setAttribute("checked", "");
    return s;
  },
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-switch");
    await expect(s).toBeTruthy();
    await expect(s).toHaveAttribute("checked", "");
  },
};
