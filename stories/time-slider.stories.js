import { expect } from "storybook/test";
import "../dist/wc/map.mjs";

export default {
  title: "Contour/Map/TimeSlider",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    label: { control: "text" },
    value: { control: "text" },
    loop: { control: "boolean" },
  },
};

const render = (args = {}) => {
  const s = document.createElement("contour-time-slider");
  s.setAttribute("value", args.value || "25");
  if (args.label) s.setAttribute("label", args.label);
  if (args.loop) s.setAttribute("loop", "");
  return s;
};

export const Default = {
  args: { value: "25" },
  render,
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-time-slider");
    await expect(s).toBeTruthy();
    await expect(s).toHaveClass(/c-time-slider/);
  },
};

export const Reactivity = {
  args: { value: "25" },
  render,
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-time-slider");
    await expect(s).toBeTruthy();
    await expect(s).toHaveClass(/c-time-slider/);
    s.setAttribute("value", "75");
    await expect(s).toBeTruthy();
  },
};
