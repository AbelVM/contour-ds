/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";

let mapMod;

beforeEach(async () => {
  mapMod = await import("../../src/js/wc/map.mjs");
});

afterEach(() => {
  document.body.innerHTML = "";
});

function keyDown(el, key, opts = {}) {
  el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, composed: true, ...opts }));
}

function itemNames(host) {
  return Array.from(host.querySelectorAll(".c-layer-panel__item")).map(
    (i) => i.querySelector(".c-layer-panel__name")?.textContent || ""
  );
}

describe("ContourLayerPanel keyboard reorder (CDS-049)", () => {
  it("renders a drag handle on each layer panel item", async () => {
    const host = document.createElement("contour-layer-panel");
    host.setAttribute("items", '["Roads","Satellite","Terrain"]');
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    const handles = host.querySelectorAll(".c-drag-handle--dots");
    expect(handles.length).toBe(3);
    handles.forEach((h) => {
      expect(h.getAttribute("tabindex")).toBe("0");
      expect(h.getAttribute("aria-label")).toMatch(/Reorder/);
      expect(h.type).toBe("button");
    });
    host.remove();
  });

  it("reorders up via drag handle ArrowUp", async () => {
    const host = document.createElement("contour-layer-panel");
    host.setAttribute("items", '["Roads","Satellite","Terrain"]');
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    const items = host.querySelectorAll(".c-layer-panel__item");
    const drag = items[2].querySelector(".c-drag-handle--dots");
    drag.focus();
    keyDown(drag, "ArrowUp");

    expect(itemNames(host)).toEqual(["Roads", "Terrain", "Satellite"]);
    host.remove();
  });

  it("reorders down via drag handle ArrowDown", async () => {
    const host = document.createElement("contour-layer-panel");
    host.setAttribute("items", '["Roads","Satellite","Terrain"]');
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    const items = host.querySelectorAll(".c-layer-panel__item");
    const drag = items[0].querySelector(".c-drag-handle--dots");
    drag.focus();
    keyDown(drag, "ArrowDown");

    expect(itemNames(host)).toEqual(["Satellite", "Roads", "Terrain"]);
    host.remove();
  });

  it("does not move past the top on ArrowUp", async () => {
    const host = document.createElement("contour-layer-panel");
    host.setAttribute("items", '["Roads","Satellite"]');
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    const drag = host.querySelectorAll(".c-drag-handle--dots")[0];
    drag.focus();
    keyDown(drag, "ArrowUp");

    expect(itemNames(host)).toEqual(["Roads", "Satellite"]);
    host.remove();
  });

  it("does not move past the bottom on ArrowDown", async () => {
    const host = document.createElement("contour-layer-panel");
    host.setAttribute("items", '["Roads","Satellite"]');
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    const drags = host.querySelectorAll(".c-drag-handle--dots");
    drags[1].focus();
    keyDown(drags[1], "ArrowDown");

    expect(itemNames(host)).toEqual(["Roads", "Satellite"]);
    host.remove();
  });

  it("reorders via Alt+ArrowUp on the item (alternative)", async () => {
    const host = document.createElement("contour-layer-panel");
    host.setAttribute("items", '["Roads","Satellite","Terrain"]');
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    const item = host.querySelectorAll(".c-layer-panel__item")[2];
    item.focus();
    keyDown(item, "ArrowUp", { altKey: true });

    expect(itemNames(host)).toEqual(["Roads", "Terrain", "Satellite"]);
    host.remove();
  });

  it("dispatches contour:layer-reorder with layerIds on drag handle reorder", async () => {
    const host = document.createElement("contour-layer-panel");
    host.setAttribute("items", '["Roads","Satellite","Terrain"]');
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    let captured = null;
    host.addEventListener("contour:layer-reorder", (e) => {
      captured = e.detail;
    });

    const drag = host.querySelectorAll(".c-drag-handle--dots")[2];
    drag.focus();
    keyDown(drag, "ArrowUp");

    expect(captured).toBeTruthy();
    expect(captured.layerIds).toEqual(["Roads", "Terrain", "Satellite"]);
    expect(host.isConnected).toBe(true);
    host.remove();
  });

  it("ignores non-arrow keys on drag handle", async () => {
    const host = document.createElement("contour-layer-panel");
    host.setAttribute("items", '["Roads","Satellite"]');
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    const drag = host.querySelectorAll(".c-drag-handle--dots")[0];
    drag.focus();
    keyDown(drag, "Enter");

    expect(itemNames(host)).toEqual(["Roads", "Satellite"]);
    host.remove();
  });
});
