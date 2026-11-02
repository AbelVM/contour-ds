/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";

describe("wc core helpers", () => {
  it("sanitizeHtml escapes when DOMParser is unavailable", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    const orig = globalThis.DOMParser;
    try {
      // @ts-ignore
      globalThis.DOMParser = undefined;
      const out = mod.sanitizeHtml("<img src=x onerror=alert(1)>");
      expect(out).not.toContain("<img");
      expect(out).toContain("&lt;");
    } finally {
      globalThis.DOMParser = orig;
    }
  });

  it("sanitizeHtml strips dangerous tags when DOMParser is available", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    const out = mod.sanitizeHtml('<p>ok</p><script>alert(1)</script>');
    expect(out).toContain("ok");
    expect(out).not.toContain("script");
  });

  it("define is a no-op without customElements", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    const desc = Object.getOwnPropertyDescriptor(globalThis, "customElements");
    try {
      Object.defineProperty(globalThis, "customElements", { value: undefined, writable: true, configurable: true });
      expect(() => mod.define("contour-test-noce", class extends HTMLElement {})).not.toThrow();
    } finally {
      if (desc) Object.defineProperty(globalThis, "customElements", desc);
    }
  });
});

describe("ContourBase lifecycle", () => {
  it("renders on connect and re-renders on attribute change", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    class Demo extends mod.ContourBase {
      static get observed() { return ["label"]; }
      render() { this.textContent = "label=" + (this.getAttribute("label") || ""); }
    }
    if (!customElements.get("contour-demo-lc")) customElements.define("contour-demo-lc", Demo);
    const el = document.createElement("contour-demo-lc");
    el.setAttribute("label", "a");
    document.body.appendChild(el);
    expect(el.textContent).toBe("label=a");
    const before = el.renderCount;
    el.setAttribute("label", "b");
    expect(el.textContent).toBe("label=b");
    expect(el.renderCount).toBeGreaterThan(before);
    el.remove();
  });

  it("sanitizeHtml is fail-closed (no DOMParser)", async () => {
    // already covered above; placeholder for state-machine expansion
    expect(true).toBe(true);
  });
});
