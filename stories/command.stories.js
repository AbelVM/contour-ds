import { expect } from "storybook/test";
import "../dist/wc/navigation.mjs";

export default {
  title: "Contour/Navigation/Command",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    placeholder: { control: "text" },
    items: { control: "text" },
    recent: { control: "text" },
  },
};

const ITEMS = JSON.stringify([
  { group: "Actions", title: "Create new", shortcut: "⌘N" },
  { group: "Actions", title: "Open settings", shortcut: "⌘," },
  { title: "Search docs" },
]);

export const Default = {
  render: () => {
    const cmd = document.createElement("contour-command");
    cmd.setAttribute("items", ITEMS);
    cmd.setAttribute("open", "");
    return cmd;
  },
  play: async ({ canvasElement }) => {
    const cmd = canvasElement.querySelector("contour-command");
    await expect(cmd).toBeTruthy();
    const items = cmd.querySelectorAll(".c-command__item");
    await expect(items.length).toBeGreaterThan(0);
  },
};

export const EmptyResult = {
  render: () => {
    const cmd = document.createElement("contour-command");
    cmd.setAttribute("items", "[]");
    cmd.setAttribute("empty", "No matches");
    cmd.setAttribute("open", "");
    return cmd;
  },
  play: async ({ canvasElement }) => {
    const cmd = canvasElement.querySelector("contour-command");
    await expect(cmd).toBeTruthy();
  },
};

export const KeyboardNavigation = {
  render: () => {
    const cmd = document.createElement("contour-command");
    cmd.setAttribute("items", ITEMS);
    cmd.setAttribute("open", "");
    return cmd;
  },
  play: async ({ canvasElement }) => {
    const cmd = canvasElement.querySelector("contour-command");
    const input = cmd.querySelector(".c-command__input");
    await expect(input).toBeTruthy();
    await expect(input).toHaveAttribute("aria-autocomplete", "list");
  },
};
