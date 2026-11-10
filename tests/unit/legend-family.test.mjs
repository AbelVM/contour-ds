/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";

let dataMod;

beforeEach(async () => {
  dataMod = await import("../../src/js/wc/data.mjs");
});

afterEach(() => {
  document.body.innerHTML = "";
});

function keyDown(el, key) {
  el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, composed: true }));
}

function cellNames(host) {
  return Array.from(host.querySelectorAll(".c-bivariate-legend__cell")).map(
    (c) => c.style.background || ""
  );
}

describe("ContourBivariateLegend (CDS-050)", () => {
  it("renders a matrix with c-bivariate-legend__matrix class", async () => {
    const host = document.createElement("contour-bivariate-legend");
    host.setAttribute("size", "3");
    host.setAttribute("axis-x", "X");
    host.setAttribute("axis-y", "Y");
    host.setAttribute("colors", '["#e8f5e9","#a5d6a7","#66bb6a","#c8e6c9","#81c784","#43a047","#a5d6a7","#66bb6a","#2e7d32"]');
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    const matrix = host.querySelector(".c-bivariate-legend__matrix");
    expect(matrix).toBeTruthy();
    expect(matrix.style.gridTemplateColumns).toBe("repeat(3, 1fr)");
    expect(matrix.style.gridTemplateRows).toBe("repeat(3, 1fr)");

    const cells = host.querySelectorAll(".c-bivariate-legend__cell");
    expect(cells.length).toBe(9);
    cells.forEach((c) => {
      expect(c.getAttribute("role")).toBe("button");
      expect(c.getAttribute("tabindex")).toBe("0");
    });
    host.remove();
  });

  it("renders axis labels with c-bivariate-legend__axis classes", async () => {
    const host = document.createElement("contour-bivariate-legend");
    host.setAttribute("size", "3");
    host.setAttribute("axis-x", "Traffic");
    host.setAttribute("axis-y", "Elevation");
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    const ax = host.querySelector(".c-bivariate-legend__axis--x");
    const ay = host.querySelector(".c-bivariate-legend__axis--y");
    expect(ax.textContent).toBe("Traffic");
    expect(ay.textContent).toBe("Elevation");
    host.remove();
  });

  it("applies colors from the colors attribute", async () => {
    const host = document.createElement("contour-bivariate-legend");
    host.setAttribute("size", "2");
    host.setAttribute("colors", '["#ff0000","#00ff00","#0000ff","#ffff00"]');
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    const cells = host.querySelectorAll(".c-bivariate-legend__cell");
    // Colors run bottom-left to top-right: cells[2] (r=1,c=0) = first color, cells[3] (r=1,c=1) = second
    expect(cells[2].style.background).toContain("rgb(255, 0, 0)");
    expect(cells[3].style.background).toContain("rgb(0, 255, 0)");
    host.remove();
  });

  it("selects a cell on click and dispatches contour:select", async () => {
    const host = document.createElement("contour-bivariate-legend");
    host.setAttribute("size", "3");
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    let captured = null;
    host.addEventListener("contour:select", (e) => { captured = e.detail; });

    const cells = host.querySelectorAll(".c-bivariate-legend__cell");
    cells[4].click();

    expect(captured).toBeTruthy();
    expect(captured.row).toBe(1);
    expect(captured.col).toBe(1);
    expect(cells[4].hasAttribute("data-selected")).toBe(true);
    host.remove();
  });

  it("selects a cell on Enter key and dispatches contour:select", async () => {
    const host = document.createElement("contour-bivariate-legend");
    host.setAttribute("size", "3");
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    let captured = null;
    host.addEventListener("contour:select", (e) => { captured = e.detail; });

    const cells = host.querySelectorAll(".c-bivariate-legend__cell");
    cells[2].focus();
    keyDown(cells[2], "Enter");

    expect(captured).toBeTruthy();
    expect(captured.row).toBe(0);
    expect(captured.col).toBe(2);
    host.remove();
  });

  it("clears selection via clear()", async () => {
    const host = document.createElement("contour-bivariate-legend");
    host.setAttribute("size", "3");
    host.setAttribute("selected", "1,1");
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    const cells = host.querySelectorAll(".c-bivariate-legend__cell");
    expect(cells[4].hasAttribute("data-selected")).toBe(true);

    host.clear();
    const cellsAfter = host.querySelectorAll(".c-bivariate-legend__cell");
    expect(cellsAfter[4].hasAttribute("data-selected")).toBe(false);
    host.remove();
  });
});

describe("ContourLegend graduated (CDS-050)", () => {
  it("adds c-legend--graduated class when graduated attribute is set", async () => {
    const host = document.createElement("contour-legend");
    host.setAttribute("graduated", "");
    host.setAttribute("items", '[{"label":"Low","break":"0-10","size":1,"color":"#e8f5e9"},{"label":"High","break":"10-100","size":3,"color":"#2e7d32"}]');
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    expect(host.classList.contains("c-legend--graduated")).toBe(true);
    host.remove();
  });

  it("renders graduated swatches with break labels", async () => {
    const host = document.createElement("contour-legend");
    host.setAttribute("graduated", "");
    host.setAttribute("items", '[{"label":"Low","break":"0-10","size":1,"color":"#e8f5e9"},{"label":"High","break":"10-100","size":3,"color":"#2e7d32"}]');
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    const swatches = host.querySelectorAll(".c-legend__swatch--graduated");
    expect(swatches.length).toBe(2);
    // First swatch smaller (size=1), second larger (size=3)
    const s1 = parseFloat(swatches[0].style.inlineSize);
    const s2 = parseFloat(swatches[1].style.inlineSize);
    expect(s2).toBeGreaterThan(s1);

    const labels = host.querySelectorAll(".c-legend__break-label");
    expect(labels.length).toBe(2);
    expect(labels[0].textContent).toBe("0-10");
    expect(labels[1].textContent).toBe("10-100");
    host.remove();
  });

  it("does not add c-legend--graduated without the attribute", async () => {
    const host = document.createElement("contour-legend");
    host.setAttribute("items", '["A","B"]');
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    expect(host.classList.contains("c-legend--graduated")).toBe(false);
    host.remove();
  });
});

describe("ContourLegend no-data semantics (CDS-050)", () => {
  it("renders no-data entry with custom label and aria-label", async () => {
    const host = document.createElement("contour-legend");
    host.setAttribute("no-data-color", "#cccccc");
    host.setAttribute("no-data-label", "No data available");
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    const nd = host.querySelector(".c-legend__no-data");
    expect(nd).toBeTruthy();
    expect(nd.textContent).toBe("No data available");
    expect(nd.getAttribute("aria-label")).toBe("No data available");
    expect(nd.getAttribute("part")).toBe("no-data");
    host.remove();
  });

  it("uses default 'No data' label when no-data-label is absent", async () => {
    const host = document.createElement("contour-legend");
    host.setAttribute("no-data-color", "#cccccc");
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    const nd = host.querySelector(".c-legend__no-data");
    expect(nd.textContent).toBe("No data");
    expect(nd.getAttribute("aria-label")).toBe("No data");
    host.remove();
  });

  it("removes no-data entry when no-data-color is removed", async () => {
    const host = document.createElement("contour-legend");
    host.setAttribute("no-data-color", "#cccccc");
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));

    expect(host.querySelector(".c-legend__no-data")).toBeTruthy();

    host.removeAttribute("no-data-color");
    await new Promise((r) => setTimeout(r, 0));

    expect(host.querySelector(".c-legend__no-data")).toBeNull();
    host.remove();
  });
});
