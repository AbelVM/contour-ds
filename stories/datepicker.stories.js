import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Forms/DatePicker",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
};

export const CalendarToggle = {
  render: () => {
    const d = document.createElement("contour-date-picker");
    d.setAttribute("label", "Start date");
    d.setAttribute("value", "2026-06-15");
    return d;
  },
  play: async ({ canvasElement }) => {
    const d = canvasElement.querySelector("contour-date-picker");
    await expect(d).toBeTruthy();
    const toggle = d.querySelector(".c-date-picker__calendar-toggle");
    await expect(toggle).toBeTruthy();
    const cal = d.querySelector(".c-date-picker__calendar");
    await expect(cal).toBeTruthy();
  },
};

export const RangeMode = {
  render: () => {
    const d = document.createElement("contour-date-picker");
    d.setAttribute("label", "Range");
    d.setAttribute("range", "");
    d.setAttribute("range-start", "2026-06-01");
    d.setAttribute("range-end", "2026-06-30");
    return d;
  },
  play: async ({ canvasElement }) => {
    const d = canvasElement.querySelector("contour-date-picker");
    await expect(d).toBeTruthy();
    const inputs = d.querySelectorAll(".c-date-picker__input");
    await expect(inputs.length).toBe(2);
  },
};
