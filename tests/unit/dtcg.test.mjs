import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { nameFromPath, buildDocuments, REFUSALS, FORMAT_SCHEMA, RESOLVER_VERSION } from "../../tools/lib/dtcg.mjs";

describe("dtcg", () => {
  it("nameFromPath reverses simple path", () => {
    expect(nameFromPath("color.primary")).toBe("--color-primary");
  });
  it("nameFromPath handles density.density", () => {
    expect(nameFromPath("density.density")).toBe("--density");
  });
  it("nameFromPath handles bare group", () => {
    expect(nameFromPath("spacing")).toBe("--spacing");
  });
  it("REFUSALS is non-empty object", () => {
    expect(Object.keys(REFUSALS).length).toBeGreaterThan(0);
  });
  it("constants are strings", () => {
    expect(typeof FORMAT_SCHEMA).toBe("string");
    expect(typeof RESOLVER_VERSION).toBe("string");
  });
  it("buildDocuments produces format and resolver docs", async () => {
    const inv = (await import("../../tools/lib/inventory.mjs")).inventory();
    const declared = Object.entries(inv.tokens.census).map(([name, t]) => ({ name, value: t.value }));
    const tokensCss = readFileSync("src/css/tokens.css", "utf8");
    const docs = buildDocuments(declared, tokensCss);
    expect(docs).toBeTruthy();
    expect(Object.keys(docs).length).toBeGreaterThan(0);
  });
});
