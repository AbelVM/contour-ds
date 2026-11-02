import { expect, userEvent, within } from "storybook/test";
import "../dist/wc/navigation.mjs";

export default {
  title: "Contour/Navigation/Tabs",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {},
};

export const Default = {
  render: () => {
    const tabs = document.createElement("contour-tabs");
    const t1 = document.createElement("button"); t1.textContent = "Overview"; t1.setAttribute("slot", "tab");
    const t2 = document.createElement("button"); t2.textContent = "Details"; t2.setAttribute("slot", "tab");
    const p1 = document.createElement("div"); p1.textContent = "Overview panel"; p1.setAttribute("slot", "panel");
    const p2 = document.createElement("div"); p2.textContent = "Details panel"; p2.setAttribute("slot", "panel");
    tabs.appendChild(t1); tabs.appendChild(t2); tabs.appendChild(p1); tabs.appendChild(p2);
    return tabs;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabs = canvasElement.querySelector("contour-tabs");
    await expect(tabs).toBeTruthy();
  },
};
