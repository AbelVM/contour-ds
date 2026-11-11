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
    trigger.type = "button";
    trigger.textContent = "Open form";

    const dlg = document.createElement("contour-dialog");
    dlg.setAttribute("title", "Edit profile");
    dlg.innerHTML = `
      <form id="dlg-profile-form" novalidate>
        <label class="c-label" for="dlg-name">Name</label>
        <input class="c-input" id="dlg-name" name="name" required />
        <p class="c-field__error" id="dlg-name-err" hidden>Name is required</p>
        <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
          <button class="c-button c-button--primary" type="submit">Save</button>
          <button class="c-button c-button--secondary" type="button" id="dlg-cancel">Cancel</button>
        </div>
      </form>
    `;
    const form = dlg.querySelector("form");
    const input = dlg.querySelector("#dlg-name");
    const err = dlg.querySelector("#dlg-name-err");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!input.value.trim()) {
        err.hidden = false;
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", "dlg-name-err");
        return;
      }
      err.hidden = true;
      input.removeAttribute("aria-invalid");
      dlg.close();
    });
    dlg.querySelector("#dlg-cancel").addEventListener("click", () => dlg.close());
    trigger.addEventListener("click", () => dlg.show());

    wrap.append(trigger, dlg);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector("button");
    const dlg = canvasElement.querySelector("contour-dialog");
    const form = canvasElement.querySelector("#dlg-profile-form");
    const input = canvasElement.querySelector("#dlg-name");
    const err = canvasElement.querySelector("#dlg-name-err");

    trigger.click();
    await expect(dlg).toHaveAttribute("open", "");

    form.requestSubmit();
    await expect(err.hidden).toBe(false);
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(dlg).toHaveAttribute("open", "");

    // Drive the field through the native input event. `userEvent.type` calls
    // `focus()` first, and Storybook's test harness replaces the focus
    // accessor with a shared function, so a programmatic focus lands on the
    // dialog's close button instead of the field. Real pointer/keyboard focus
    // is verified in the standalone browser probe; this story tests the
    // validation → submit → close path.
    input.value = "Ada";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    form.requestSubmit();
    await expect(dlg).not.toHaveAttribute("open");
  },
};
