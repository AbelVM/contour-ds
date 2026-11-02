import { expect, userEvent, within } from "storybook/test";
import "../dist/wc/feedback.mjs";

export default {
  title: "Contour/Overlays/Dialog",
  tags: ["autodocs"],
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
  },
};
