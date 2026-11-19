import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Content/Carousel",
  tags: ["autodocs"],
  parameters: {
    a11y: { test: "error" }, contour: { maturity: "complete-widget" } },
  argTypes: {
    autoplay: { control: "text" },
    index: { control: "text" },
  },
};

const render = (args = {}) => {
  const c = document.createElement("contour-carousel");
  if (args.autoplay) c.setAttribute("autoplay", args.autoplay);
  if (args.index) c.setAttribute("index", args.index);
  for (let i = 1; i <= 3; i++) {
    const slide = document.createElement("div");
    slide.className = "c-carousel__slide";
    slide.textContent = `Slide ${i}`;
    c.appendChild(slide);
  }
  return c;
};

export const Default = {
  args: {},
  render,
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-carousel");
    await expect(c).toBeTruthy();
    await expect(c).toHaveClass(/c-carousel/);
    const prev = c.querySelector(".c-carousel__prev");
    const next = c.querySelector(".c-carousel__next");
    await expect(prev).toBeTruthy();
    await expect(next).toBeTruthy();
  },
};

export const Autoplay = {
  args: { autoplay: "3000" },
  render,
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-carousel");
    await expect(c).toBeTruthy();
    await expect(c).toHaveAttribute("autoplay", "3000");
  },
};

export const Reactivity = {
  args: { index: "0" },
  render,
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-carousel");
    await expect(c).toBeTruthy();
    c.setAttribute("index", "1");
    await expect(c).toHaveAttribute("index", "1");
  },
};