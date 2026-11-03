import { expect, userEvent, within } from "storybook/test";
import "../dist/wc/interaction.mjs";
import { variantControl } from "./metadata.js";

export default {
  title: "Contour/Interaction/Button",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    variant: variantControl("c-btn"),
    size: { control: "select", options: ["", "sm", "lg"] },
    color: { control: "text" },
    label: { control: "text" },
    disabled: { control: "boolean" },
  },
};

const render = (args) => {
  const el = document.createElement("contour-btn");
  if (args.variant) el.setAttribute("variant", args.variant);
  if (args.size) el.setAttribute("size", args.size);
  if (args.color) el.setAttribute("color", args.color);
  if (args.label) el.setAttribute("label", args.label);
  if (args.disabled) el.setAttribute("disabled", "");
  if (!args.label) el.textContent = "Button";
  return el;
};

export const Default = {
  render,
  args: { label: "Save changes" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole("button");
    await expect(btn).toHaveTextContent("Save changes");
    await expect(btn).toHaveClass(/c-btn/);
    await userEvent.click(btn);
    await expect(btn).toHaveAttribute("tabindex", "0");
  },
};

export const Disabled = {
  render,
  args: { label: "Save changes", disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole("button");
    await expect(btn).toHaveAttribute("aria-disabled", "true");
    await expect(btn).toHaveAttribute("tabindex", "-1");
  },
};

export const Primary = {
  render,
  args: { label: "Save changes", variant: "primary" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole("button");
    await expect(btn).toHaveClass(/c-btn--primary/);
  },
};

export const KeyboardActivate = {
  render,
  args: { label: "Save changes" },
  play: async ({ canvasElement }) => {
    const btn = canvasElement.querySelector("contour-btn");
    let activated = false;
    btn.addEventListener("contour:activate", () => { activated = true; });
    btn.focus();
    await userEvent.keyboard("{Enter}");
    await expect(activated).toBe(true);
  },
};

export const Reactivity = {
  render,
  args: { label: "Save changes" },
  play: async ({ canvasElement }) => {
    const btn = canvasElement.querySelector("contour-btn");
    await expect(btn).not.toHaveClass(/c-btn--danger/);
    btn.setAttribute("variant", "danger");
    await expect(btn).toHaveClass(/c-btn--danger/);
  },
};
