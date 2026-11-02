import { expect, userEvent, within } from "storybook/test";
import "../dist/wc/feedback.mjs";

export default {
  title: "Contour/Overlays/Dialog",
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    size: { control: "text" },
  },
  parameters: { contour: { maturity: "complete-widget" } },
};

export const Default = {
  render: () => {
    const btn = document.createElement("contour-btn");
    btn.setAttribute("label", "Open dialog");
    const dlg = document.createElement("contour-dialog");
    dlg.setAttribute("title", "Confirm");
    const p = document.createElement("p");
    p.textContent = "Dialog body content.";
    dlg.appendChild(p);
    const wrap = document.createElement("div");
    wrap.appendChild(btn);
    wrap.appendChild(dlg);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const dlg = canvasElement.querySelector("contour-dialog");
    await expect(dlg).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Dialog body content.");
  },
};

export const OpenClose = {
  render: () => {
    const dlg = document.createElement("contour-dialog");
    dlg.setAttribute("title", "Confirm");
    const p = document.createElement("p");
    p.textContent = "Dialog body content.";
    dlg.appendChild(p);
    return dlg;
  },
  play: async ({ canvasElement }) => {
    const dlg = canvasElement.querySelector("contour-dialog");
    dlg.show();
    await expect(dlg).toHaveAttribute("open", "");
    dlg.close();
    await expect(dlg).not.toHaveAttribute("open");
  },
};

export const EscapeCloses = {
  render: () => {
    const dlg = document.createElement("contour-dialog");
    dlg.setAttribute("title", "Confirm");
    const p = document.createElement("p");
    p.textContent = "Dialog body content.";
    dlg.appendChild(p);
    return dlg;
  },
  play: async ({ canvasElement }) => {
    const dlg = canvasElement.querySelector("contour-dialog");
    dlg.show();
    await expect(dlg).toHaveAttribute("open", "");
    await userEvent.keyboard("{Escape}");
    await expect(dlg).not.toHaveAttribute("open");
  },
};

export const OpenEvent = {
  render: () => {
    const dlg = document.createElement("contour-dialog");
    dlg.setAttribute("title", "Confirm");
    return dlg;
  },
  play: async ({ canvasElement }) => {
    const dlg = canvasElement.querySelector("contour-dialog");
    let opened = false;
    dlg.addEventListener("contour:open", () => { opened = true; });
    dlg.show();
    await expect(opened).toBe(true);
    dlg.close();
  },
};

export const FocusReturn = {
  render: () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Open dialog";
    const dlg = document.createElement("contour-dialog");
    dlg.setAttribute("title", "Confirm");
    const wrap = document.createElement("div");
    wrap.appendChild(trigger);
    wrap.appendChild(dlg);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector("button");
    const dlg = canvasElement.querySelector("contour-dialog");
    trigger.focus();
    dlg.show();
    dlg.close();
    await expect(dlg).not.toHaveAttribute("open");
    await expect(dlg).not.toHaveAttribute("aria-modal");
  },
};

export const ModalTabTrap = {
  render: () => {
    const dlg = document.createElement("contour-dialog");
    dlg.setAttribute("title", "Confirm");
    const first = document.createElement("button");
    first.textContent = "Cancel";
    const last = document.createElement("button");
    last.textContent = "Confirm";
    dlg.append(first, last);
    return dlg;
  },
  play: async ({ canvasElement }) => {
    const dlg = canvasElement.querySelector("contour-dialog");
    const close = dlg.querySelector(".c-dialog__close");
    const last = Array.from(dlg.querySelectorAll("button")).at(-1);
    dlg.show();
    last.focus();
    await userEvent.tab();
    await expect(close).toHaveFocus();
    dlg.close();
  },
};

export const NestedOverlayEscape = {
  render: () => {
    const wrap = document.createElement("div");
    const dlg = document.createElement("contour-dialog");
    dlg.setAttribute("title", "Parent dialog");
    const drawer = document.createElement("contour-drawer");
    drawer.setAttribute("title", "Nested drawer");
    wrap.append(dlg, drawer);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const dlg = canvasElement.querySelector("contour-dialog");
    const drawer = canvasElement.querySelector("contour-drawer");
    dlg.show();
    drawer.show();
    await expect(dlg).toHaveAttribute("open", "");
    await expect(drawer).toHaveAttribute("open", "");
    drawer.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await expect(drawer).not.toHaveAttribute("open");
    await expect(dlg).toHaveAttribute("open", "");
    dlg.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await expect(dlg).not.toHaveAttribute("open");
  },
};
