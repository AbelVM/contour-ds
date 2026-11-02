import { expect, userEvent } from "storybook/test";
import "../dist/wc/navigation.mjs";
import { fixtureArgs } from "./fixtures.js";

export default {
  title: "Contour/Navigation/Menu",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" },
    // a11y todo: isolated story lacks full context. Tracked as SB-A11Y-02.
    a11y: { test: "todo" },
    a11yTodo: { owner: "Contour maintainers", rootCause: "isolated menu lacks trigger and dismissal context", mitigation: "add trigger-owned overlay workflow", review: "2026-12-01" },
  },
};

export const Default = {
  render: () => {
    const m = document.createElement("contour-menu");
    const items = ["New", "Open", "Save"];
    for (const it of items) {
      const el = document.createElement("button");
      el.textContent = it;
      m.appendChild(el);
    }
    return m;
  },
  play: async ({ canvasElement }) => {
    const m = canvasElement.querySelector("contour-menu");
    await expect(m).toBeTruthy();
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
