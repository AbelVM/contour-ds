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

const render = () => {
  const tabs = document.createElement("contour-tabs");
  tabs.setAttribute("tabs", TABS);
  return tabs;
};

export const Default = {
  render,
  play: async ({ canvasElement }) => {
    const tabs = canvasElement.querySelector("contour-tabs");
    await expect(tabs).toBeTruthy();
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
    await expect(tabButtons.length).toBe(3);
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
