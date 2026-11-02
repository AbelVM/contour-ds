import { expect } from "storybook/test";
import "../dist/wc/map.mjs";

export default {
  title: "Contour/Map/TimeSlider",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    value: { control: "text" },
  },
};

export const Default = {
  render: () => {
    const s = document.createElement("contour-time-slider");
    s.setAttribute("min", "0");
    s.setAttribute("max", "100");
    s.setAttribute("value", "25");
    return s;
  },
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-time-slider");
    await expect(s).toBeTruthy();
  },
};

export const Reactivity = {
  render: () => {
    const s = document.createElement("contour-time-slider");
    s.setAttribute("min", "0");
    s.setAttribute("max", "100");
    s.setAttribute("value", "25");
    return s;
  },
  play: async ({ canvasElement }) => {
    const s = canvasElement.querySelector("contour-time-slider");
    await expect(s).toBeTruthy();
    s.setAttribute("value", "75");
    await expect(s).toBeTruthy();
  },
};
