import { describe, it, expect } from "vitest";
import { buildComponentsDocument, CONTRACT_VERSION } from "../../tools/lib/components.mjs";
import { inventory } from "../../tools/lib/inventory.mjs";

describe("components", () => {
  it("CONTRACT_VERSION is string", () => {
    expect(typeof CONTRACT_VERSION).toBe("string");
  });
  it("buildComponentsDocument produces a document", () => {
    const doc = buildComponentsDocument(inventory());
    expect(doc).toBeTruthy();
    expect(typeof doc).toBe("object");
  });
});
