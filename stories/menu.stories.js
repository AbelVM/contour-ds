import { expect } from "storybook/test";
import "../dist/wc/navigation.mjs";

export default {
  title: "Contour/Navigation/Menu",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" },
    // a11y todo: isolated story lacks full context. Tracked as SB-A11Y-02.
    a11y: { test: "todo" },
  },
  argTypes: {},
};

export const Default = {
  render: () => {
    const m = document.createElement("contour-menu");
    const items = ["New", "Open", "Save"];
    for (const it of items) {
      const el = document.createElement("button");
      el.textContent = it;
      m.appendChild(el);
    }
    return m;
  },
  play: async ({ canvasElement }) => {
    const m = canvasElement.querySelector("contour-menu");
    await expect(m).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Save");
  },
};
