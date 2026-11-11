import { expect } from "storybook/test";
import "../dist/wc/map.mjs";

export default {
  title: "Contour/Compositions/LayerPanelMap",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "composition" } },
};

export const LayerPanelEmitsVisibilityIntent = {
  render: () => {
    const wrap = document.createElement("div");
    const panel = document.createElement("contour-layer-panel");
    panel.setAttribute("items", JSON.stringify([
      { name: "Base map", color: "#61758a", count: 1, visible: true },
      { name: "Routes", color: "#2f8f83", count: 86, visible: false },
    ]));
    const status = document.createElement("p");
    status.id = "comp-layer-status";
    status.textContent = "idle";
    wrap.addEventListener("contour:layer-visibility", () => { status.textContent = "toggled"; });
    wrap.append(panel, status);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector("contour-layer-panel");
    await expect(panel).toBeTruthy();
    const toggle = panel.querySelector("button, .c-layer-panel__toggle, .c-layer-switch__toggle, [aria-pressed]");
    await expect(toggle).toBeTruthy();
    toggle.click();
    await expect(canvasElement.querySelector("#comp-layer-status").textContent).toBe("toggled");
  },
};
