import { expect } from "storybook/test";
import "../dist/wc/content.mjs";

export default {
  title: "Contour/Content/Recipe",
  tags: ["autodocs"],
  parameters: {
    a11y: { test: "error" }, contour: { maturity: "complete-widget" } },
  argTypes: {
    title: { control: "text" },
    body: { control: "text" },
    url: { control: "text" },
    head: { control: "text" },
    index: { control: "text" },
    tags: { control: "text" },
  },
};

const render = (args = {}) => {
  const r = document.createElement("contour-recipe");
  if (args.title) r.setAttribute("title", args.title);
  if (args.body) r.setAttribute("body", args.body);
  if (args.url) r.setAttribute("url", args.url);
  if (args.head) r.setAttribute("head", args.head);
  if (args.index) r.setAttribute("index", args.index);
  if (args.tags) r.setAttribute("tags", args.tags);
  return r;
};

export const Default = {
  args: { title: "Margherita", body: "Tomato, mozzarella, basil.", head: "Pizza", index: "01", tags: "italian,vegetarian" },
  render,
  play: async ({ canvasElement }) => {
    const r = canvasElement.querySelector("contour-recipe");
    await expect(r).toBeTruthy();
    await expect(r).toHaveClass(/c-recipe/);
    await expect(canvasElement.textContent).toContain("Margherita");
  },
};

export const WithFrame = {
  args: { title: "Documentation recipe", url: "https://example.com/contour", head: "Docs", index: "02", tags: "guide,reference" },
  render,
  play: async ({ canvasElement }) => {
    const r = canvasElement.querySelector("contour-recipe");
    await expect(r).toBeTruthy();
    const frame = r.querySelector(".c-recipe__frame");
    await expect(frame).toBeTruthy();
    const url = r.querySelector(".c-recipe__frame-url");
    await expect(url.textContent).toBe("https://example.com/contour");
  },
};

export const Reactivity = {
  args: { title: "Original", head: "Category" },
  render,
  play: async ({ canvasElement }) => {
    const r = canvasElement.querySelector("contour-recipe");
    await expect(r).toBeTruthy();
    r.setAttribute("title", "Updated");
    await expect(canvasElement.textContent).toContain("Updated");
  },
};