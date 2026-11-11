import { expect, userEvent } from "storybook/test";
import "../dist/wc/layout.mjs";
import "../dist/wc/feedback.mjs";

export default {
  title: "Contour/Compositions/SplitPaneOverlays",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "composition" } },
};

export const SplitPaneWithDialog = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "c-split-view";
    wrap.style.display = "grid";
    wrap.style.gridTemplateColumns = "1fr auto 1fr";
    wrap.style.gap = "0.5rem";
    const left = document.createElement("section");
    left.innerHTML = "<h3>Inspector</h3><p>Region details</p>";
    const handle = document.createElement("div");
    handle.className = "c-resize-handle c-resize-handle--vertical";
    handle.setAttribute("role", "separator");
    handle.setAttribute("tabindex", "0");
    handle.setAttribute("aria-orientation", "vertical");
    handle.setAttribute("aria-label", "Resize panes");
    const right = document.createElement("section");
    const btn = document.createElement("button");
    btn.className = "c-button";
    btn.textContent = "Open details";
    const dlg = document.createElement("contour-dialog");
    dlg.setAttribute("title", "Details");
    dlg.innerHTML = "<p>Overlay inside split workspace.</p>";
    btn.addEventListener("click", () => dlg.show());
    right.append(btn, dlg);
    wrap.append(left, handle, right);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const handle = canvasElement.querySelector(".c-resize-handle");
    await expect(handle).toBeTruthy();
    await expect(handle).toHaveAttribute("role", "separator");
    handle.focus();
    await expect(handle).toHaveFocus();
    const btn = canvasElement.querySelector(".c-button");
    btn.click();
    const dlg = canvasElement.querySelector("contour-dialog");
    await expect(dlg).toHaveAttribute("open", "");
    // Focus moves to dialog; after closing, verify handle can be focused again
    await userEvent.keyboard("{Escape}");
    await expect(dlg).not.toHaveAttribute("open");
    handle.focus();
    await expect(handle).toHaveFocus();
  },
};
