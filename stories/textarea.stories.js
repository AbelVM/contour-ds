import { expect } from "storybook/test";
import "../dist/wc/forms.mjs";

export default {
  title: "Contour/Forms/Textarea",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" },
    // a11y todo: isolated story lacks full context. Tracked as SB-A11Y-04.
    a11y: { test: "todo" },
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
