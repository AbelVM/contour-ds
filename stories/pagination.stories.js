import { expect, userEvent } from "storybook/test";
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
  render: (args = {}) => {
    const p = document.createElement("contour-pagination");
    if (args.page) p.setAttribute("page", String(args.page)); else p.setAttribute("page", "2");
    if (args["page-size"]) p.setAttribute("page-size", String(args["page-size"])); else p.setAttribute("page-size", "10");
    if (args.total) p.setAttribute("total", String(args.total)); else p.setAttribute("total", "50");
    return p;
  },
  play: async ({ canvasElement }) => {
    const p = canvasElement.querySelector("contour-pagination");
    await expect(p).toBeTruthy();
    await expect(p).toHaveClass(/c-pagination/);
  },
};

export const NextPage = {
  render: (args = {}) => {
    const pagination = document.createElement("contour-pagination");
    if (args.pages) pagination.setAttribute("pages", String(args.pages)); else pagination.setAttribute("pages", "3");
    if (args.current) pagination.setAttribute("current", String(args.current)); else pagination.setAttribute("current", "1");
    return pagination;
  },
  play: async ({ canvasElement }) => {
    const pagination = canvasElement.querySelector("contour-pagination");
    const next = pagination.querySelector("[data-action='next']");
    await userEvent.click(next);
    await expect(pagination).toHaveAttribute("page", "2");
    await expect(pagination.querySelector("[aria-current='page']")).toHaveTextContent("2");
  },
};

export const DisabledEdges = {
  render: NextPage.render,
  play: async ({ canvasElement }) => {
    const pagination = canvasElement.querySelector("contour-pagination");
    const previous = pagination.querySelector("[data-action='prev']");
    const next = pagination.querySelector("[data-action='next']");
    await userEvent.click(previous);
    await expect(pagination).toHaveAttribute("page", "1");
    await userEvent.click(next);
    await userEvent.click(next);
    await userEvent.click(next);
    await expect(pagination).toHaveAttribute("page", "3");
    await expect(pagination.querySelector("[aria-current='page']")).toHaveTextContent("3");
  },
};
