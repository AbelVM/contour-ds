import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Forms/DatePicker",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    label: { control: "text" },
    value: { control: "text" },
    range: { control: "boolean" },
    "range-start": { control: "text" },
    "range-end": { control: "text" },
    disabled: { control: "boolean" },
    error: { control: "text" },
    help: { control: "text" },
    time: { control: "boolean" },
    min: { control: "text" },
    max: { control: "text" },
    locale: { control: "text" },
  },
};

const render = (args = {}) => {
  const d = document.createElement("contour-date-picker");
  if (args.label) d.setAttribute("label", args.label); else d.setAttribute("label", "Start date");
  if (args.value) d.setAttribute("value", args.value); else d.setAttribute("value", "2026-06-15");
  if (args.range) d.setAttribute("range", "");
  if (args["range-start"]) d.setAttribute("range-start", args["range-start"]);
  if (args["range-end"]) d.setAttribute("range-end", args["range-end"]);
  if (args.disabled) d.setAttribute("disabled", "");
  if (args.error) d.setAttribute("error", args.error);
  if (args.help) d.setAttribute("help", args.help);
  if (args.time) d.setAttribute("time", "");
  if (args.min) d.setAttribute("min", args.min);
  if (args.max) d.setAttribute("max", args.max);
  if (args.locale) d.setAttribute("locale", args.locale);
  return d;
};

export const CalendarToggle = {
  args: { label: "Start date", value: "2026-06-15" },
  render,
  play: async ({ canvasElement }) => {
    const d = canvasElement.querySelector("contour-date-picker");
    await expect(d).toBeTruthy();
    await expect(d).toHaveClass(/c-date-picker/);
    const toggle = d.querySelector(".c-date-picker__calendar-toggle");
    await expect(toggle).toBeTruthy();
    const cal = d.querySelector(".c-date-picker__calendar");
    await expect(cal).toBeTruthy();
  },
};

export const RangeMode = {
  args: { label: "Range", range: true, "range-start": "2026-06-01", "range-end": "2026-06-30" },
  render,
  play: async ({ canvasElement }) => {
    const d = canvasElement.querySelector("contour-date-picker");
    await expect(d).toBeTruthy();
    const inputs = d.querySelectorAll(".c-date-picker__input");
    await expect(inputs.length).toBe(2);
  },
};
