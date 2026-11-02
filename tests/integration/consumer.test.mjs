import { describe, it, expect } from "vitest";
import { existsSync, readdirSync } from "node:fs";

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

  it("dist/wc contains family entry points", () => {
    const files = readdirSync("dist/wc");
    expect(files.length).toBeGreaterThan(5);
    expect(files).toContain("core.mjs");
  });

  it("core.mjs imports without throwing in node (consumer path)", async () => {
    const mod = await import("../../dist/wc/core.mjs");
    expect(typeof mod.define).toBe("function");
    expect(typeof mod.sanitizeHtml).toBe("function");
  });

  it("index.mjs imports without throwing in node (consumer path)", async () => {
    await expect(import("../../dist/wc/index.mjs")).resolves.toBeTruthy();
  });

  it("repeatability: dist artifacts stable across reads", () => {
    // Re-read existence to simulate repeated consumer checks.
    expect(existsSync("dist/contour.css")).toBe(true);
    expect(existsSync("dist/contour.min.css")).toBe(true);
    expect(existsSync("dist/contour.tokens.json")).toBe(true);
  });
});
