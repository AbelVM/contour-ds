import { expect, userEvent } from "storybook/test";
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

export const ChangeEvent = {
  render: Default.render,
  play: async ({ canvasElement }) => {
    const switchControl = canvasElement.querySelector("contour-switch");
    const input = canvasElement.querySelector("input");
    const changed = new Promise((resolve) => {
      switchControl.addEventListener("contour:change", (event) => resolve(event.detail), { once: true });
    });
    await userEvent.click(input);
    const detail = await changed;
    await expect(detail).toEqual({ name: null, value: "on", checked: true });
    await expect(input).toBeChecked();
    await expect(input).toHaveAttribute("aria-checked", "true");
  },
};
