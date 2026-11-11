import { expect } from "storybook/test";
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
    handle.setAttribute("aria-valuenow", "50");
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
    const btn = canvasElement.querySelector(".c-button");
    const dlg = canvasElement.querySelector("contour-dialog");
    let closed = 0;
    dlg.addEventListener("contour:close", () => { closed += 1; });
    btn.click();
    await expect(dlg).toHaveAttribute("open", "");
    dlg.querySelector(".c-dialog__close").click();
    await expect(dlg).not.toHaveAttribute("open");
    await expect(closed).toBe(1);
    // Focus return is asserted in the browser probe, not here: Storybook's
    // test harness replaces the focus accessor, so `btn.focus()` would land on
    // the dialog's close button and the assertion would measure the harness.
  },
};