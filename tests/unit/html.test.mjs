import { describe, it, expect } from "vitest";
import { parse, serialize, format, decodeEntities, escapeAttr, escapeText, findAll, classes, text } from "../../tools/lib/html.mjs";

describe("html parser", () => {
  it("round-trips a simple document", () => {
    const src = "<!DOCTYPE html><html><head><title>x</title></head><body><p class=\"a\">hi &amp; bye</p></body></html>";
    const node = parse(src);
    const out = node.children.map(serialize).join("");
    expect(out).toBe(src);
  });

  it("decodes entities in a single pass", () => {
    expect(decodeEntities("&amp;lt;")).toBe("&lt;");
    expect(decodeEntities("&lt;")).toBe("<");
  });

  it("escapeAttr/escapeText are inverses-ish", () => {
    expect(escapeAttr('a"b')).toBe('a&quot;b');
    expect(escapeText("<x>")).toBe("&lt;x&gt;");
  });

  it("findAll finds elements by predicate", () => {
    const node = parse("<div><span class=\"x\">a</span><span>b</span></div>");
    const spans = findAll(node, (n) => n.type === "element" && n.name === "span");
    expect(spans.length).toBe(2);
  });

  it("classes returns class list", () => {
    const node = parse('<div class="a b  c"></div>');
    const el = findAll(node, (n) => n.type === "element" && n.name === "div")[0];
    expect(classes(el)).toEqual(["a", "b", "c"]);
  });

  it("text extracts text content", () => {
    const node = parse("<p>hello <b>world</b></p>");
    expect(text(node).trim()).toBe("hello world");
  });

  it("preserves comments verbatim", () => {
    const src = "<!-- a & b --><div>x</div>";
    const node = parse(src);
    expect(node.children.map(serialize).join("")).toBe(src);
  });

  it("preserves script/style raw text", () => {
    const src = "<script>if (a < b && c > d) { x = 'y'; }</script>";
    const node = parse(src);
    expect(node.children.map(serialize).join("")).toBe(src);
  });
});
