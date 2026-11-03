import { expect, userEvent } from "storybook/test";
import "../dist/wc/navigation.mjs";

export default {
  title: "Contour/Navigation/Command",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    placeholder: { control: "text" },
    items: { control: "text" },
    recent: { control: "text" },
    empty: { control: "text" },
  },
};

const ITEMS = JSON.stringify([
  { group: "Actions", title: "Create new", shortcut: "⌘N" },
  { group: "Actions", title: "Open settings", shortcut: "⌘," },
  { title: "Search docs" },
]);

const render = (args = {}) => {
  const cmd = document.createElement("contour-command");
  cmd.setAttribute("items", args.items || ITEMS);
  if (args.placeholder) cmd.setAttribute("placeholder", args.placeholder);
  if (args.recent) cmd.setAttribute("recent", args.recent);
  if (args.empty) cmd.setAttribute("empty", args.empty);
  if (args.open !== false) cmd.setAttribute("open", "");
  return cmd;
};

export const Default = {
  args: { items: ITEMS, open: true },
  render,
  play: async ({ canvasElement }) => {
    const cmd = canvasElement.querySelector("contour-command");
    await expect(cmd).toBeTruthy();
    await expect(cmd).toHaveClass(/c-command/);
    const items = cmd.querySelectorAll(".c-command__item");
    await expect(items.length).toBeGreaterThan(0);
  },
};

export const EmptyResult = {
  args: { items: "[]", empty: "No matches", open: true },
  render,
  play: async ({ canvasElement }) => {
    const cmd = canvasElement.querySelector("contour-command");
    await expect(cmd).toBeTruthy();
  },
};

export const KeyboardNavigation = {
  args: { items: ITEMS, open: true },
  render,
  play: async ({ canvasElement }) => {
    const cmd = canvasElement.querySelector("contour-command");
    const input = cmd.querySelector(".c-command__input");
    await expect(input).toBeTruthy();
    await expect(input).toHaveAttribute("aria-autocomplete", "list");
    await userEvent.click(input);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    const items = cmd.querySelectorAll(".c-command__item");
    await expect(input).toHaveAttribute("aria-activedescendant", items[items.length - 1].id);
    const selected = new Promise((resolve) => cmd.addEventListener("contour:select", (event) => resolve(event.detail), { once: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect(await selected).toEqual({ index: 2, label: "Search docs" });
  },
};
