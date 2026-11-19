import { expect } from "storybook/test";
import "../dist/wc/data.mjs";

export default {
  title: "Contour/Data/QueryBuilder",
  tags: ["autodocs"],
  parameters: {
    a11y: { test: "error" }, contour: { maturity: "complete-widget" } },
  argTypes: {
    fields: { control: "text" },
    query: { control: "text" },
  },
};

const render = (args = {}) => {
  const q = document.createElement("contour-query-builder");
  if (args.fields) q.setAttribute("fields", args.fields);
  if (args.query) q.setAttribute("query", args.query);
  return q;
};

export const Default = {
  args: {
    fields: '["status","region","population"]',
    query: '[{"field":"status","op":"=","value":"active"}]',
  },
  render,
  play: async ({ canvasElement }) => {
    const q = canvasElement.querySelector("contour-query-builder");
    await expect(q).toBeTruthy();
    await expect(q).toHaveClass(/c-query-builder/);
    const row = q.querySelector(".c-query-builder__row");
    await expect(row).toBeTruthy();
  },
};

export const MultipleRules = {
  args: {
    fields: '["status","region"]',
    query: '[{"field":"status","op":"=","value":"active"},{"field":"region","op":"contains","value":"north","connector":"OR"}]',
  },
  render,
  play: async ({ canvasElement }) => {
    const q = canvasElement.querySelector("contour-query-builder");
    await expect(q).toBeTruthy();
    const rows = q.querySelectorAll(".c-query-builder__row");
    await expect(rows.length).toBe(2);
    const connector = q.querySelector(".c-query-builder__connector");
    await expect(connector).toBeTruthy();
  },
};

export const RemoveRule = {
  args: {
    fields: '["status"]',
    query: '[{"field":"status","op":"=","value":"active"},{"field":"status","op":"=","value":"pending"}]',
  },
  render,
  play: async ({ canvasElement }) => {
    const q = canvasElement.querySelector("contour-query-builder");
    await expect(q).toBeTruthy();
    const removeBtn = q.querySelector(".c-query-builder__remove");
    await expect(removeBtn).toBeTruthy();
    removeBtn.click();
    const rows = q.querySelectorAll(".c-query-builder__row");
    await expect(rows.length).toBe(1);
  },
};