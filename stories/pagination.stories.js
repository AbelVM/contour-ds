import { expect } from "storybook/test";
import "../dist/wc/navigation.mjs";

export default {
  title: "Contour/Navigation/Pagination",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    current: { control: "number" },
    "page-size": { control: "number" },
  },
};

export const Default = {
  render: () => {
    const p = document.createElement("contour-pagination");
    p.setAttribute("page", "2");
    p.setAttribute("page-size", "10");
    p.setAttribute("total", "50");
    return p;
  },
  play: async ({ canvasElement }) => {
    const p = canvasElement.querySelector("contour-pagination");
    await expect(p).toBeTruthy();
  },
};
