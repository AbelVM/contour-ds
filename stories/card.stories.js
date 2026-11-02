import { expect } from "storybook/test";
import "../dist/wc/content.mjs";

export default {
  title: "Contour/Content/Card",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    title: { control: "text" },
  },
};

export const Default = {
  render: () => {
    const c = document.createElement("contour-card");
    c.setAttribute("title", "Card title");
    const p = document.createElement("p");
    p.textContent = "Card body content.";
    c.appendChild(p);
    return c;
  },
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-card");
    await expect(c).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Card title");
    await expect(canvasElement.textContent).toContain("Card body");
  },
};
