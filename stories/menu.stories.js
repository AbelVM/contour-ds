import { expect, userEvent } from "storybook/test";
import "../dist/wc/navigation.mjs";
import { fixtureArgs } from "./fixtures.js";

export default {
  title: "Contour/Navigation/Menu",
  tags: ["autodocs"],
  parameters: {
    contour: { maturity: "complete-widget" },
  },
  argTypes: {
    items: { control: "text" },
  },
};

export const Default = {
  args: {},
  render: (args = {}) => {
    const m = document.createElement("contour-menu");
    m.setAttribute("items", JSON.stringify(["New", "Open", "Save"]));
    return m;
  },
  play: async ({ canvasElement }) => {
    const m = canvasElement.querySelector("contour-menu");
    await expect(m).toBeTruthy();
    await expect(m.querySelector(".c-menu")).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Save");
  },
};

export const KeyboardNavigation = {
  args: fixtureArgs("contour-menu"),
  render: ({ items }) => {
    const menu = document.createElement("contour-menu");
    menu.setAttribute("items", items);
    return menu;
  },
  play: async ({ canvasElement }) => {
    const menu = canvasElement.querySelector("contour-menu");
    const items = menu.querySelectorAll("[role='menuitem']");
    await expect(items).toHaveLength(3);
    items[0].focus();
    await userEvent.keyboard("{ArrowDown}{End}");
    await expect(items[2]).toHaveFocus();
    const selected = new Promise((resolve) => menu.addEventListener("contour:select", (event) => resolve(event.detail), { once: true }));
    await userEvent.keyboard("{Enter}");
    await expect(await selected).toEqual({ index: 2, label: "Remove" });
  },
};
