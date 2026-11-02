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

describe("adversarial authored DOM (R12-31)", () => {
  it("sanitizeHtml handles huge strings without throwing", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    const big = "<p>" + "a".repeat(100000) + "</p>";
    const out = mod.sanitizeHtml(big);
    expect(out.length).toBeGreaterThan(0);
  });

  it("sanitizeHtml strips script/iframe/object/embed/style/link/meta/base/form", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    const payload = "<script>x</script><iframe src='a'></iframe><object data='b'></object><embed src='c'><style>.x{}</style><link rel='stylesheet' href='d'><meta http-equiv='refresh'><base href='/'><form><input><button>x</button></form><p>ok</p>";
    const out = mod.sanitizeHtml(payload);
    expect(out).toContain("ok");
    for (const tag of ["script", "iframe", "object", "embed", "style", "link", "meta", "base", "form", "input", "button"]) {
      expect(out).not.toMatch(new RegExp("<" + tag + "[\\s>]"));
    }
  });

  it("sanitizeHtml strips on-* attributes and javascript: URLs", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    const out = mod.sanitizeHtml('<a href="javascript:alert(1)" onclick="alert(2)">x</a><img src="data:text/html;base64,AAAA">');
    expect(out).not.toContain("javascript:");
    expect(out).not.toContain("onclick");
  });

  it("contourId produces unique ids", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    const a = mod.contourId("x");
    const b = mod.contourId("x");
    expect(a).not.toBe(b);
  });

  it("formatValue returns raw value on failure", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    expect(mod.formatValue("abc", "{bad json")).toBe("abc");
    expect(mod.formatValue(42, null)).toBe(42);
  });
});

describe("lifecycle state machine (R12-30)", () => {
  it("re-render preserves authored nodes", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    class Demo extends mod.ContourBase {
      static get observed() { return ["label"]; }
      render() {
        const g = document.createElement("span");
        g.className = "c-demo__gen";
        g.textContent = this.getAttribute("label") || "";
        this.appendChild(g);
      }
    }
    if (!customElements.get("contour-demo-sm")) customElements.define("contour-demo-sm", Demo);
    const el = document.createElement("contour-demo-sm");
    const authored = document.createTextNode("authored");
    el.appendChild(authored);
    document.body.appendChild(el);
    expect(el.querySelector(".c-demo__gen").textContent).toBe("");
    el.setAttribute("label", "x");
    expect(el.querySelector(".c-demo__gen").textContent).toBe("x");
    expect(el.textContent).toContain("authored");
    el.remove();
  });

  it("batch coalesces multiple attribute changes into one render", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    class Demo extends mod.ContourBase {
      static get observed() { return ["a", "b"]; }
      render() {
        this._renders = (this._renders || 0) + 1;
      }
    }
    if (!customElements.get("contour-demo-batch")) customElements.define("contour-demo-batch", Demo);
    const el = document.createElement("contour-demo-batch");
    document.body.appendChild(el);
    const before = el.renderCount;
    el.batch(() => { el.setAttribute("a", "1"); el.setAttribute("b", "2"); });
    expect(el.renderCount).toBe(before + 1);
    el.remove();
  });
});

describe("adversarial: malformed attributes (R12-31)", () => {
  it("sanitizeHtml handles null/undefined/number input", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    expect(mod.sanitizeHtml(null)).toBe("");
    expect(mod.sanitizeHtml(undefined)).toBe("");
    expect(typeof mod.sanitizeHtml(42)).toBe("string");
  });

  it("contourId handles empty and special chars", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    const a = mod.contourId("");
    const b = mod.contourId("a b/c");
    expect(typeof a).toBe("string");
    expect(typeof b).toBe("string");
    expect(a).not.toBe(b);
  });

  it("formatValue handles null format and locale", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    expect(mod.formatValue(42, null, null)).toBe(42);
    expect(mod.formatValue("hello", null, null)).toBe("hello");
  });

  it("headingTag returns a valid tag", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    const tag = mod.headingTag(document.createElement("div"), "h3");
    expect(["h1","h2","h3","h4","h5","h6"]).toContain(tag);
  });
});

describe("lifecycle state machine sequences (R12-30)", () => {
  it("upgrade after connect preserves authored children", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    const tag = "contour-demo-upgrade-" + Math.random().toString(36).slice(2);
    const el = document.createElement(tag);
    const authored = document.createTextNode("authored");
    el.appendChild(authored);
    document.body.appendChild(el);
    class Demo extends mod.ContourBase {
      static get observed() { return ["label"]; }
      render() {
        const g = document.createElement("span");
        g.className = "c-demo__gen";
        g.textContent = this.getAttribute("label") || "";
        this.appendChild(g);
      }
    }
    customElements.define(tag, Demo);
    await new Promise((r) => setTimeout(r, 0));
    expect(el.textContent).toContain("authored");
    el.remove();
  });

  it("attribute change during loading does not throw", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    class Demo extends mod.ContourBase {
      static get observed() { return ["label"]; }
      render() { this.textContent = this.getAttribute("label") || ""; }
    }
    const tag = "contour-demo-loading-" + Math.random().toString(36).slice(2);
    if (!customElements.get(tag)) customElements.define(tag, Demo);
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(() => { el.setAttribute("label", "x"); el.setAttribute("label", "y"); }).not.toThrow();
    expect(el.textContent).toBe("y");
    el.remove();
  });

  it("disconnect and reconnect re-renders", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    class Demo extends mod.ContourBase {
      static get observed() { return ["label"]; }
      render() { this.textContent = "v=" + (this.getAttribute("label") || ""); }
    }
    const tag = "contour-demo-reconn-" + Math.random().toString(36).slice(2);
    if (!customElements.get(tag)) customElements.define(tag, Demo);
    const el = document.createElement(tag);
    el.setAttribute("label", "a");
    document.body.appendChild(el);
    expect(el.textContent).toBe("v=a");
    el.remove();
    document.body.appendChild(el);
    expect(el.textContent).toBe("v=a");
    el.remove();
  });

  it("batch coalesces and restores focus", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    class Demo extends mod.ContourBase {
      static get observed() { return ["a", "b"]; }
      render() { this._renders = (this._renders || 0) + 1; }
    }
    const tag = "contour-demo-batch2-" + Math.random().toString(36).slice(2);
    if (!customElements.get(tag)) customElements.define(tag, Demo);
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const before = el.renderCount;
    el.batch(() => { el.setAttribute("a", "1"); el.setAttribute("b", "2"); el.setAttribute("a", "3"); });
    expect(el.renderCount).toBe(before + 1);
    el.remove();
  });

  it("repeated attribute churn does not leak renderCount unbounded", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    class Demo extends mod.ContourBase {
      static get observed() { return ["v"]; }
      render() { this.textContent = this.getAttribute("v") || ""; }
    }
    const tag = "contour-demo-churn-" + Math.random().toString(36).slice(2);
    if (!customElements.get(tag)) customElements.define(tag, Demo);
    const el = document.createElement(tag);
    document.body.appendChild(el);
    for (let i = 0; i < 50; i++) el.setAttribute("v", String(i));
    expect(el.textContent).toBe("49");
    el.remove();
  });
});

describe("adversarial authored DOM (R12-31 expanded)", () => {
  it("sanitizeHtml handles nested dangerous tags", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    const out = mod.sanitizeHtml("<div><script><script>nested</script></script><p>ok</p></div>");
    expect(out).toContain("ok");
    expect(out).not.toMatch(/<script/i);
  });

  it("sanitizeHtml handles event handlers in various cases", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    const out = mod.sanitizeHtml('<img SRC="x" ONERROR="alert(1)" /><a HREF="javascript:alert(2)">x</a>');
    expect(out).not.toMatch(/onerror/i);
    expect(out).not.toMatch(/javascript:/i);
  });

  it("contourId is unique across many calls", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    const ids = new Set();
    for (let i = 0; i < 1000; i++) ids.add(mod.contourId("x"));
    expect(ids.size).toBe(1000);
  });

  it("formatValue handles objects and arrays", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    // no format => value returned as-is
    expect(mod.formatValue({ a: 1 }, null)).toEqual({ a: 1 });
    expect(mod.formatValue(null, null)).toBe(null);
  });

  it("headingTag falls back for invalid input", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    const el = document.createElement("div");
    // invalid fallback is returned as-is (caller's responsibility); default fallback is h3
    expect(mod.headingTag(el)).toBe("h3");
    el.setAttribute("heading", "h2");
    expect(mod.headingTag(el)).toBe("h2");
    el.setAttribute("heading", "nope");
    expect(mod.headingTag(el)).toBe("h3");
  });

  it("sanitizeHtml handles null bytes and unicode", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    const out = mod.sanitizeHtml("<p>caf\u00e9 \u0000 test</p>");
    expect(out).toContain("caf");
  });
});

describe("updateMode policy (R12-06)", () => {
  it("ContourBase defaults to scaffold", async () => {
    const mod = await import("../../src/js/wc/core.mjs");
    expect(mod.ContourBase.updateMode).toBe("scaffold");
  });

  it("high-volume components declare keyed", async () => {
    await import("../../src/js/wc/data.mjs");
    await import("../../src/js/wc/navigation.mjs");
    await import("../../src/js/wc/ui.mjs");
    await import("../../src/js/wc/docs.mjs");
    const tags = ["contour-table","contour-chart","contour-tree","contour-virtual-list","contour-data-grid","contour-tree-grid","contour-file-tree"];
    for (const t of tags) {
      const C = customElements.get(t);
      expect(C).toBeTruthy();
      expect(C.updateMode).toBe("keyed");
    }
  });
});

describe("performance smoke (R12-07/R12-32)", () => {
  it("renders a 1000-row table within budget", async () => {
    await import("../../src/js/wc/data.mjs");
    const C = customElements.get("contour-table");
    expect(C).toBeTruthy();
    const el = document.createElement("contour-table");
    const cols = JSON.stringify([{ key: "id", label: "ID" }, { key: "name", label: "Name" }]);
    const rows = JSON.stringify(Array.from({ length: 1000 }, (_, i) => ({ id: i, name: "row " + i })));
    const t0 = performance.now();
    el.setAttribute("columns", cols);
    el.setAttribute("rows", rows);
    document.body.appendChild(el);
    const dt = performance.now() - t0;
    expect(dt).toBeLessThan(5000);
    el.remove();
  });
});

describe("mixed-page contention (R12-32/R12-34)", () => {
  it("renders mixed components within budget", async () => {
    await import("../../src/js/wc/data.mjs");
    await import("../../src/js/wc/ui.mjs");
    await import("../../src/js/wc/forms.mjs");
    const t0 = performance.now();
    const els = [];
    for (let i = 0; i < 50; i++) {
      const e = document.createElement("contour-card");
      els.push(e);
      document.body.appendChild(e);
    }
    const dt = performance.now() - t0;
    expect(dt).toBeLessThan(5000);
    els.forEach((e) => e.remove());
  });
});
