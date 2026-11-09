import { expect } from "storybook/test";
import inventory from "../dist/contour.components.json";
import "../dist/wc/content.mjs";
import "../dist/wc/dashboard.mjs";
import "../dist/wc/data.mjs";
import "../dist/wc/docs.mjs";
import "../dist/wc/feedback.mjs";
import "../dist/wc/forms.mjs";
import "../dist/wc/interaction.mjs";
import "../dist/wc/layout.mjs";
import "../dist/wc/map.mjs";
import "../dist/wc/misc.mjs";
import "../dist/wc/navigation.mjs";
import "../dist/wc/registration.mjs";
import "../dist/wc/shadow.mjs";
import "../dist/wc/ui.mjs";
import "../dist/contour.css";
import { applyFixture } from "./fixtures.js";

export default {
  title: "Contour/Catalog/Registered elements",
  tags: ["autodocs"],
  parameters: {
    contour: { maturity: "composition" },
    a11y: { test: "todo" },
    issue: "SB-31",
    a11yTodo: {
      owner: "Contour maintainers",
      rootCause: "catalogue renders all registered elements without per-element a11y review",
      mitigation: "promote mature elements to focused stories with dedicated a11y tests",
      review: "2026-12-01",
    },
  },
};

export const AllRegistered = {
  render: () => {
    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gridTemplateColumns = "repeat(auto-fit, minmax(14rem, 1fr))";
    root.style.gap = "1rem";

    const tags = inventory.blocks
      .map(({ name }) => "contour-" + name.slice(2))
      .filter((tag) => customElements.get(tag));
    for (const tag of tags) {
      const card = document.createElement("article");
      card.style.display = "grid";
      card.style.gap = "0.5rem";
      card.style.padding = "1rem";
      card.style.border = "1px solid var(--color-border)";
      const label = document.createElement("code");
      label.textContent = tag;
      const element = document.createElement(tag);
      element.setAttribute("aria-label", tag);
      applyFixture(element, tag);
      card.append(label, element);
      root.appendChild(card);
    }
    return root;
  },
  play: async ({ canvasElement }) => {
    const elements = canvasElement.querySelectorAll("article > :where(:not(code))");
    await expect(elements.length).toBeGreaterThan(0);
    for (const element of elements) {
      await expect(customElements.get(element.tagName.toLowerCase())).toBeTruthy();
    }
  },
};
