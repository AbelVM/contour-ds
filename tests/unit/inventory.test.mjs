import { describe, it, expect } from "vitest";
import { inventory, blockOf, CLASS_RE, figures, toJson } from "../../tools/lib/inventory.mjs";

describe("inventory", () => {
  it("blockOf strips element/variant suffixes", () => {
    expect(blockOf("c-btn--primary")).toBe("c-btn");
    expect(blockOf("c-btn__icon")).toBe("c-btn");
    expect(blockOf("c-card")).toBe("c-card");
  });
  it("CLASS_RE matches c- classes", () => {
    expect(CLASS_RE.test(".c-foo")).toBe(true);
  });
  it("inventory returns components and tokens", () => {
    const inv = inventory();
    expect(inv.components.count).toBeGreaterThan(0);
    expect(inv.tokens.unique).toBeGreaterThan(0);
  });
  it("figures returns numbers", () => {
    const f = figures();
    expect(f).toBeTruthy();
  });
  it("toJson serializes", () => {
    const j = toJson();
    expect(typeof j).toBe("string");
    expect(JSON.parse(j)).toBeTruthy();
  });
});
