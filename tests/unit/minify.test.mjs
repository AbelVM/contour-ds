import { describe, it, expect } from "vitest";
import { minifyCss, minifyJs } from "../../tools/lib/minify.mjs";

describe("minify", () => {
  it("minifies css removing comments and whitespace", () => {
    const css = "/* c */\n.a {\n  color: red;\n}\n";
    expect(minifyCss(css)).toBe(".a{color:red;}");
  });
  it("preserves strings", () => {
    const css = '.a { content: "  x  "; }';
    expect(minifyCss(css)).toBe('.a{content:"  x  "}');
  });
  it("minifies js basic", () => {
    const js = "// c\nfunction f() {\n  return 1;\n}\n";
    const out = minifyJs(js);
    expect(out).toContain("function f()");
    expect(out).not.toContain("// c");
  });
});
