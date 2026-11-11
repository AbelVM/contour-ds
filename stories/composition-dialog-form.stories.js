import { expect, userEvent } from "storybook/test";
import "../dist/wc/feedback.mjs";
import "../dist/wc/forms.mjs";

export default {
  title: "Contour/Compositions/DialogForm",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "composition" } },
};

export const DialogWithFormValidation = {
  render: () => {
    const wrap = document.createElement("div");
    const trigger = document.createElement("button");
    trigger.className = "c-button";
    trigger.textContent = "Open form";
    const dlg = document.createElement("contour-dialog");
    dlg.setAttribute("title", "Edit profile");
    dlg.innerHTML = "<p>Test dialog content</p>";
    trigger.addEventListener("click", () => dlg.show());
    wrap.appendChild(trigger);
    wrap.appendChild(dlg);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector("button");
    const dlg = canvasElement.querySelector("contour-dialog");
    trigger.click();
    await expect(dlg).toHaveAttribute("open", "");
    await expect(dlg).not.toHaveAttribute("open");
  },
};
