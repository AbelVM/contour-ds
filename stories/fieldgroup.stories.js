import { expect } from "storybook/test";
import "../dist/wc/forms.mjs";

export default {
  title: "Contour/Forms/FieldGroup",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    label: { control: "text" },
    hint: { control: "text" },
  },
};

const render = (args = {}) => {
  const g = document.createElement("contour-field-group");
  if (args.label) g.setAttribute("label", args.label); else g.setAttribute("label", "Coordinates");
  if (args.hint) g.setAttribute("hint", args.hint); else g.setAttribute("hint", "Decimal degrees");
  return g;
};

export const Default = {
  args: { label: "Coordinates", hint: "Decimal degrees" },
  render,
  play: async ({ canvasElement }) => {
    const g = canvasElement.querySelector("contour-field-group");
    await expect(g).toBeTruthy();
    await expect(g).toHaveClass(/c-field-group/);
  },
};

export const WithFields = {
  args: { label: "Coordinates", hint: "Decimal degrees" },
  render: (args = {}) => {
    const g = document.createElement("contour-field-group");
    g.setAttribute("label", args.label || "Coordinates");
    g.setAttribute("hint", args.hint || "Decimal degrees");
    const lat = document.createElement("input");
    lat.className = "c-input";
    lat.setAttribute("placeholder", "Lat");
    const lon = document.createElement("input");
    lon.className = "c-input";
    lon.setAttribute("placeholder", "Lon");
    g.appendChild(lat);
    g.appendChild(lon);
    return g;
  },
  play: async ({ canvasElement }) => {
    const g = canvasElement.querySelector("contour-field-group");
    await expect(g).toBeTruthy();
    await expect(g.querySelectorAll("input").length).toBe(2);
  },
};
