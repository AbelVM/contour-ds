import { expect } from "storybook/test";
import "../dist/wc/content.mjs";

export default {
  title: "Contour/Content/LandingHero",
  tags: ["autodocs"],
  parameters: {
    a11y: { test: "error" }, contour: { maturity: "complete-widget" } },
  argTypes: {
    title: { control: "text" },
    text: { control: "text" },
    preview: { control: "text" },
    actions: { control: "text" },
  },
};

const render = (args = {}) => {
  const h = document.createElement("contour-landing-hero");
  if (args.title) h.setAttribute("title", args.title);
  if (args.text) h.setAttribute("text", args.text);
  if (args.preview) h.setAttribute("preview", args.preview);
  if (args.actions) h.setAttribute("actions", args.actions);
  return h;
};

export const Default = {
  args: { title: "Build spatial apps", text: "A design system for location intelligence." },
  render,
  play: async ({ canvasElement }) => {
    const h = canvasElement.querySelector("contour-landing-hero");
    await expect(h).toBeTruthy();
    await expect(h).toHaveClass(/c-landing-hero/);
    await expect(canvasElement.textContent).toContain("Build spatial apps");
  },
};

export const WithPreview = {
  args: { title: "Launch", text: "Ship faster.", preview: "<div>Product screenshot</div>" },
  render,
  play: async ({ canvasElement }) => {
    const h = canvasElement.querySelector("contour-landing-hero");
    await expect(h).toBeTruthy();
    const preview = h.querySelector(".c-landing-hero__preview");
    await expect(preview).toBeTruthy();
    const body = h.querySelector(".c-landing-hero__preview-body");
    await expect(body).toBeTruthy();
  },
};

export const Reactivity = {
  args: { title: "Original" },
  render,
  play: async ({ canvasElement }) => {
    const h = canvasElement.querySelector("contour-landing-hero");
    await expect(h).toBeTruthy();
    h.setAttribute("title", "Updated");
    await expect(canvasElement.textContent).toContain("Updated");
  },
};