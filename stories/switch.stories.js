import { expect, userEvent } from "storybook/test";
import "../dist/wc/forms.mjs";

export default {
  title: "Contour/Forms/Switch",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    label: { control: "text" },
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
    error: { control: "text" },
    help: { control: "text" },
  },
};

const render = (args = {}) => {
  const s = document.createElement("contour-switch");
  if (args.label) s.setAttribute("label", args.label);
  else s.setAttribute("label", "Enable notifications");
  if (args.checked) s.setAttribute("checked", "");
  if (args.disabled) s.setAttribute("disabled", "");
  if (args.error) s.setAttribute("error", args.error);
  if (args.help) s.setAttribute("help", args.help);
  return s;
};

export const Default = {
  args: { label: "Enable notifications" },
  render,
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-switch");
    await expect(s).toBeTruthy();
    await expect(s).toHaveClass(/c-switch/);
    await expect(canvasElement.textContent).toContain("Enable notifications");
  },
};

export const Checked = {
  args: { label: "Enable notifications", checked: true },
  render,
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-switch");
    await expect(s).toBeTruthy();
    await expect(s).toHaveAttribute("checked", "");
  },
};

export const ChangeEvent = {
  args: { label: "Enable notifications" },
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
