import { expect } from "storybook/test";
import "../dist/wc/layout.mjs";

export default {
  title: "Contour/Layout/Primitives",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "primitive" } },
};

const wrap = (tag, label) => {
  const el = document.createElement(tag);
  el.textContent = label || tag;
  return el;
};

export const Box = {
  render: () => wrap("contour-box", "Box"),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector("contour-box");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-box/);
  },
};

export const Cluster = {
  render: () => wrap("contour-cluster", "Cluster"),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector("contour-cluster");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-cluster/);
  },
};

export const Container = {
  render: () => wrap("contour-container", "Container"),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector("contour-container");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-container/);
  },
};

export const Row = {
  render: () => wrap("contour-row", "Row"),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector("contour-row");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-row/);
  },
};

export const Scrim = {
  render: () => wrap("contour-scrim", "Scrim"),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector("contour-scrim");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-scrim/);
  },
};

export const Stack = {
  render: () => wrap("contour-stack", "Stack"),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector("contour-stack");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-stack/);
  },
};
