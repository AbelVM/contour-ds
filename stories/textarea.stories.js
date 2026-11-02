import { expect, userEvent } from "storybook/test";
import "../dist/wc/forms.mjs";

export default {
  title: "Contour/Forms/Textarea",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" },
    // a11y todo: isolated story lacks full context. Tracked as SB-A11Y-04.
    a11y: { test: "todo" },
    a11yTodo: { owner: "Contour maintainers", rootCause: "isolated textarea label association is incomplete", mitigation: "provide a labelled form context", review: "2026-12-01" },
  },
  argTypes: {
    placeholder: { control: "text" },
  },
};

export const Default = {
  render: () => {
    const t = document.createElement("contour-textarea");
    t.setAttribute("label", "Notes");
    t.setAttribute("placeholder", "Write something…");
    return t;
  },
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-textarea");
    await expect(t).toBeTruthy();
    const ta = canvasElement.querySelector("textarea");
    if (ta) await expect(ta).toHaveAttribute("placeholder", "Write something…");
  },
};

export const Reactivity = {
  render: () => {
    const t = document.createElement("contour-textarea");
    t.setAttribute("label", "Notes");
    return t;
  },
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-textarea");
    await expect(t).toBeTruthy();
    t.setAttribute("label", "Comments");
    await expect(t).toHaveAttribute("label", "Comments");
  },
};

export const InputEvent = {
  render: Default.render,
  play: async ({ canvasElement }) => {
    const textarea = canvasElement.querySelector("contour-textarea");
    const control = canvasElement.querySelector("textarea");
    const changed = new Promise((resolve) => {
      textarea.addEventListener("contour:input", (event) => resolve(event.detail), { once: true });
    });
    await userEvent.type(control, "N");
    const detail = await changed;
    await expect(detail).toEqual({ name: null, value: "N", checked: null });
  },
};
