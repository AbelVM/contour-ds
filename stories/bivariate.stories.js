import { expect } from "storybook/test";
import "../dist/wc/data.mjs";

const COLORS = JSON.stringify([
  "#e8f1ed", "#b8d8ca", "#78b6a0",
  "#d8dfe8", "#9eb4c6", "#5e8ca3",
  "#d9b8a8", "#ba8472", "#8e5148",
]);

const renderBivariate = (tag, args = {}) => {
  const element = document.createElement(tag);
  element.setAttribute("size", args.size || "3");
  element.setAttribute("axis-x", args["axis-x"] || "Access");
  element.setAttribute("axis-y", args["axis-y"] || "Exposure");
  element.setAttribute("colors", args.colors || COLORS);
  element.setAttribute("selected", args.selected || "1,1");
  return element;
};

export default {
  title: "Contour/Data/Bivariate",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    size: { control: "text" },
    "axis-x": { control: "text" },
    "axis-y": { control: "text" },
    colors: { control: "text" },
    selected: { control: "text" },
  },
};

export const Matrix = {
  args: { size: "3", "axis-x": "Access", "axis-y": "Exposure", colors: COLORS, selected: "1,1" },
  render: (args) => renderBivariate("contour-bivariate", args),
  play: async ({ canvasElement }) => {
    const matrix = canvasElement.querySelector("contour-bivariate");
    await expect(matrix).toHaveClass(/c-bivariate/);
    const cells = matrix.querySelectorAll(".c-bivariate__cell");
    await expect(cells.length).toBe(9);
    cells[0].click();
    await expect(cells[0]).toHaveAttribute("data-selected", "");
  },
};

export const Legend = {
  args: { size: "3", "axis-x": "Access", "axis-y": "Exposure", colors: COLORS, selected: "1,1" },
  render: (args) => renderBivariate("contour-bivariate-legend", args),
  play: async ({ canvasElement }) => {
    const legend = canvasElement.querySelector("contour-bivariate-legend");
    await expect(legend).toHaveAttribute("aria-label", "Bivariate legend");
    await expect(legend.querySelectorAll(".c-bivariate-legend__cell").length).toBe(9);
  },
};
