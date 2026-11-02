import { describe, it, expect } from "vitest";

describe("WC SSR-safe import (R12-25)", () => {
  it("core.mjs imports without throwing in node", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    expect(typeof mod.define).toBe("function");
    expect(typeof mod.sanitizeHtml).toBe("function");
  });

  it("index.mjs imports without throwing in node", async () => {
    // index.mjs imports all families; define() is now a no-op without customElements.
    await expect(import("../../src/js/wc/index.mjs")).resolves.toBeTruthy();
  });

  it("define is a no-op without customElements", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    // In node, customElements is undefined; define should not throw.
    expect(() => mod.define("contour-ssr-test", class {})).not.toThrow();
  });
});
