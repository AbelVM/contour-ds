import { expect, userEvent } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Overlays/Popover",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {},
};

export const Default = {
  render: () => {
    const p = document.createElement("contour-popover");
    const btn = document.createElement("button");
    btn.textContent = "Toggle";
    p.appendChild(btn);
    const content = document.createElement("div");
    content.textContent = "Popover content";
    p.appendChild(content);
    return p;
  },
  play: async ({ canvasElement }) => {
    const p = canvasElement.querySelector("contour-popover");
    await expect(p).toBeTruthy();
  },
};

export const TriggerAndDismiss = {
  render: () => {
    const wrap = document.createElement("div");
    const trigger = document.createElement("button");
    trigger.textContent = "Open popover";
    const popover = document.createElement("contour-popover");
    popover.id = "storybook-popover-trigger";
    popover.setAttribute("title", "Details");
    trigger.setAttribute("popovertarget", popover.id);
    wrap.append(trigger, popover);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector("button");
    const popover = canvasElement.querySelector("contour-popover");
    let closed = false;
    popover.addEventListener("contour:close", () => { closed = true; });
    trigger.click();
    await expect(popover.matches(":popover-open")).toBe(true);
    await userEvent.keyboard("{Escape}");
    await expect(closed).toBe(true);
    await expect(popover.matches(":popover-open")).toBe(false);
  },
};
