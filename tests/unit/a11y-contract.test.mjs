import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";

describe("accessibility contract (R12-17/R12-35)", () => {
  it("ACCESSIBILITY.md exists and pins APG patterns", () => {
    expect(existsSync("ACCESSIBILITY.md")).toBe(true);
    const md = readFileSync("ACCESSIBILITY.md", "utf8");
    expect(md.toLowerCase()).toContain("apg");
  });

  it("LOCALE.md exists", () => {
    expect(existsSync("LOCALE.md")).toBe(true);
  });

  it("CSS contains reduced-motion media query", () => {
    const css = readFileSync("src/css/components-brand.css", "utf8") + readFileSync("src/css/components-buttons.css", "utf8") + readFileSync("src/css/components-cards.css", "utf8") + readFileSync("src/css/components-navigation.css", "utf8") + readFileSync("src/css/components-forms.css", "utf8") + readFileSync("src/css/components-display.css", "utf8") + readFileSync("src/css/components-overlay.css", "utf8") + readFileSync("src/css/components-misc.css", "utf8") + readFileSync("src/css/base.css", "utf8");
    expect(css).toContain("prefers-reduced-motion");
  });

  it("CSS contains forced-colors media query", () => {
    const css = readFileSync("src/css/utilities.css", "utf8");
    expect(css).toContain("forced-colors");
  });

  it("RELEASE.md exists", () => {
    expect(existsSync("RELEASE.md")).toBe(true);
  });
});

describe("docs artifacts (R12-14/R12-16)", () => {
  it("LIBRESHIP.md exists and states ownership boundary", () => {
    const md = readFileSync("LIBRESHIP.md", "utf8");
    expect(md).toContain("Contour owns");
    expect(md).toContain("Libreship owns");
  });

  it("CSS-VOCABULARY.md exists", () => {
    expect(existsSync("CSS-VOCABULARY.md")).toBe(true);
  });

  it("PERFORMANCE.md exists", () => {
    expect(existsSync("PERFORMANCE.md")).toBe(true);
  });
});

describe("type declarations (R12-12)", () => {
  it("contour.d.ts contains form and data element interfaces", () => {
    const dts = readFileSync("dist/contour.d.ts", "utf8");
    expect(dts).toContain("ContourFormElement");
    expect(dts).toContain("ContourDataElement");
  });
});
