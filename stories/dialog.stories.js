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
    dlg.setAttribute("open", "");
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
