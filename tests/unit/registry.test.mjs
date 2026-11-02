import { describe, it, expect } from "vitest";
import { buildRegistry, REGISTRY_VERSION, REGISTRY_SCHEMA_URL, ITEM_SCHEMA_URL } from "../../tools/lib/registry.mjs";

describe("registry", () => {
  it("constants are strings", () => {
    expect(typeof REGISTRY_VERSION).toBe("string");
    expect(typeof REGISTRY_SCHEMA_URL).toBe("string");
    expect(typeof ITEM_SCHEMA_URL).toBe("string");
  });
  it("buildRegistry produces a registry from dist", () => {
    const reg = buildRegistry(process.cwd() + "/dist");
    expect(reg).toBeTruthy();
  });
});
