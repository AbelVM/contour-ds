import { describe, it, expect } from "vitest";
import { topLevelSplit, lightDarkPair, resolveLightDark, topLevelFunction } from "../../tools/lib/lightdark.mjs";

describe("lightdark", () => {
  it("topLevelSplit splits on top-level commas", () => {
    expect(topLevelSplit("a, b, c")).toEqual(["a", "b", "c"]);
    expect(topLevelSplit("rgb(1,2,3), x")).toEqual(["rgb(1,2,3)", "x"]);
  });
  it("lightDarkPair parses light-dark()", () => {
    const p = lightDarkPair("light-dark(#fff, #000)");
    expect(p).toBeTruthy();
    expect(p.light).toBe("#fff");
    expect(p.dark).toBe("#000");
  });
  it("resolveLightDark picks branch", () => {
    expect(resolveLightDark("light-dark(#fff, #000)", "light").value).toBe("#fff");
    expect(resolveLightDark("light-dark(#fff, #000)", "dark").value).toBe("#000");
  });
  it("topLevelFunction detects function", () => {
    expect(topLevelFunction("light-dark(a,b)")).toBe("light-dark");
    expect(topLevelFunction("red")).toBeNull();
  });
});
