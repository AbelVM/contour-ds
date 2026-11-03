import { expect } from "storybook/test";
import "../dist/wc/ui.mjs";

export default {
  title: "Contour/Map/MapPopup",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
};

const ITEMS = JSON.stringify(["A", "B", "C"]);

export const ClusterToggle = {
  render: () => {
    const p = document.createElement("contour-map-popup");
    p.setAttribute("title", "Cluster");
    p.setAttribute("cluster-count", "3");
    p.setAttribute("cluster-items", ITEMS);
    return p;
  },
  play: async ({ canvasElement }) => {
    const p = canvasElement.querySelector("contour-map-popup");
    await expect(p).toBeTruthy();
    const badge = p.querySelector(".c-map-popup__cluster");
    await expect(badge).toBeTruthy();
  },
};
