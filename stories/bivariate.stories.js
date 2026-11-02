import { expect } from "storybook/test";
import "../dist/wc/data.mjs";

const COLORS = JSON.stringify([
  "#e8f1ed", "#b8d8ca", "#78b6a0",
  "#d8dfe8", "#9eb4c6", "#5e8ca3",
  "#d9b8a8", "#ba8472", "#8e5148",
]);

const renderBivariate = (tag) => {
  const element = document.createElement(tag);
  element.setAttribute("size", "3");
  element.setAttribute("axis-x", "Access");
  element.setAttribute("axis-y", "Exposure");
  element.setAttribute("colors", COLORS);
  element.setAttribute("selected", "1,1");
  return element;
};

export default {
  title: "Contour/Data/Bivariate",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" }, a11y: { test: "todo" }, issue: "SB-A11Y-03" },
};

export const Matrix = {
  render: () => renderBivariate("contour-bivariate"),
  play: async ({ canvasElement }) => {
    const matrix = canvasElement.querySelector("contour-bivariate");
    const cells = matrix.querySelectorAll(".c-bivariate__cell");
    await expect(cells.length).toBe(9);
    cells[0].click();
    await expect(cells[0]).toHaveAttribute("data-selected", "");
  },
};

export const Legend = {
  render: () => renderBivariate("contour-bivariate-legend"),
  play: async ({ canvasElement }) => {
    const legend = canvasElement.querySelector("contour-bivariate-legend");
    await expect(legend).toHaveAttribute("aria-label", "Bivariate legend");
    await expect(legend.querySelectorAll(".c-bivariate__cell").length).toBe(9);
  },
};