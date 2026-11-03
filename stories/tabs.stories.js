import { expect, userEvent, within } from "storybook/test";
import "../dist/wc/navigation.mjs";
import { booleanControls } from "./metadata.js";

export default {
  title: "Contour/Navigation/Tabs",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    ...booleanControls("c-tabs"),
    tabs: { control: "text" },
    orientation: { control: "text" },
  },
};

const TABS = JSON.stringify(["Overview", "Details", "Settings"]);

const render = (args = {}) => {
  const tabs = document.createElement("contour-tabs");
  tabs.setAttribute("tabs", args.tabs || TABS);
  if (args.orientation) tabs.setAttribute("orientation", args.orientation);
  return tabs;
};

export const Default = {
  render,
  play: async ({ canvasElement }) => {
    const tabs = canvasElement.querySelector("contour-tabs");
    await expect(tabs).toBeTruthy();
    await expect(tabs).toHaveClass(/c-tabs/);
    const tabButtons = tabs.querySelectorAll("[role='tab']");
    await expect(tabButtons.length).toBe(3);
  },
};

export const KeyboardRoving = {
  render,
  play: async ({ canvasElement }) => {
    const tabs = canvasElement.querySelector("contour-tabs");
    const tabButtons = Array.from(tabs.querySelectorAll("[role='tab']"));
    tabButtons[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(document.activeElement).toBe(tabButtons[1]);
  },
};

export const TabChangeEvent = {
  render,
  play: async ({ canvasElement }) => {
    const tabs = canvasElement.querySelector("contour-tabs");
    let detail = null;
    tabs.addEventListener("contour:tab-change", (e) => { detail = e.detail; });
    const tabButtons = Array.from(tabs.querySelectorAll("[role='tab']"));
    tabButtons[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(detail.index).toBe(1);
    await expect(detail.label).toBe(tabButtons[1].getAttribute("aria-controls"));
    await expect(tabButtons[1]).toHaveAttribute("aria-selected", "true");
  },
};

export const HorizontalKeyboardMatrix = {
  render,
  play: async ({ canvasElement }) => {
    const tabs = canvasElement.querySelector("contour-tabs");
    const tabButtons = Array.from(tabs.querySelectorAll("[role='tab']"));
    tabButtons[0].focus();
    await userEvent.keyboard("{ArrowRight}{End}");
    await expect(tabButtons[2]).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}{Home}");
    await expect(tabButtons[0]).toHaveFocus();
  },
};

export const VerticalKeyboardMatrix = {
  render: () => {
    const tabs = render();
    tabs.setAttribute("orientation", "vertical");
    return tabs;
  },
  play: async ({ canvasElement }) => {
    const tabs = canvasElement.querySelector("contour-tabs");
    const tabButtons = Array.from(tabs.querySelectorAll("[role='tab']"));
    tabButtons[0].focus();
    await userEvent.keyboard("{ArrowDown}{End}");
    await expect(tabButtons[2]).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}{Home}");
    await expect(tabButtons[0]).toHaveFocus();
  },
};

export const Reactivity = {
  render,
  play: async ({ canvasElement }) => {
    const tabs = canvasElement.querySelector("contour-tabs");
    const before = tabs.querySelectorAll("[role='tab']").length;
    await expect(before).toBe(3);
  },
};
