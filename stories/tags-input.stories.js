import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Forms/TagsInput",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" },
    // a11y todo: isolated story lacks full context. Tracked as SB-A11Y-03.
    a11y: { test: "todo" },
    a11yTodo: { owner: "Contour maintainers", rootCause: "isolated tags input lacks form context", mitigation: "verify labels and validation in form workflow", review: "2026-12-01" },
  },
  argTypes: {},
};

export const Default = {
  render: () => {
    const t = document.createElement("contour-tags-input");
    t.setAttribute("label", "Tags");
    return t;
  },
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-tags-input");
    await expect(t).toBeTruthy();
  },
};
