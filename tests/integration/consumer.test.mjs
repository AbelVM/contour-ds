import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";

describe("consumer fixture (R12-37)", () => {
  it("dist/wc/index.mjs exists", () => {
    expect(existsSync("dist/wc/index.mjs")).toBe(true);
  });

  it("dist/wc/core.mjs exists", () => {
    expect(existsSync("dist/wc/core.mjs")).toBe(true);
  });

  it("dist/contour.esm.js exists", () => {
    expect(existsSync("dist/contour.esm.js")).toBe(true);
  });

  it("dist/contour-wc.esm.js exists", () => {
    expect(existsSync("dist/contour-wc.esm.js")).toBe(true);
  });
});
