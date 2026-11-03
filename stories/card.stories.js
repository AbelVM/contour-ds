import { expect } from "storybook/test";
import "../dist/wc/content.mjs";

export default {
  title: "Contour/Content/Card",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    title: { control: "text" },
    variant: { control: "text" },
    heading: { control: "text" },
  },
};

const render = (args = {}) => {
  const c = document.createElement("contour-card");
  if (args.title) c.setAttribute("title", args.title);
  else c.setAttribute("title", "Card title");
  if (args.variant) c.setAttribute("variant", args.variant);
  if (args.heading) c.setAttribute("heading", args.heading);
  const p = document.createElement("p");
  p.textContent = args.body || "Card body content.";
  c.appendChild(p);
  return c;
};

export const Default = {
  args: { title: "Card title", body: "Card body content." },
  render,
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-card");
    await expect(c).toBeTruthy();
    await expect(c).toHaveClass(/c-card/);
    await expect(c.querySelector(".c-card__title")).toHaveTextContent("Card title");
    await expect(canvasElement.textContent).toContain("Card body");
  },
};

export const Raised = {
  args: { title: "Raised", variant: "raised", body: "Raised surface." },
  render,
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-card");
    await expect(c).toBeTruthy();
    await expect(c.classList.contains("c-card--raised")).toBe(true);
  },
};

export const Sunken = {
  args: { title: "Sunken", variant: "sunken", body: "Sunken surface." },
  render,
  play: async ({ canvasElement }) => {
    const c = canvasElement.querySelector("contour-card");
    await expect(c).toBeTruthy();
    await expect(c.classList.contains("c-card--sunken")).toBe(true);
  },
};
