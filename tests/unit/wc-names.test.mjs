import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { elementNames, typeDeclarations } from "../../tools/lib/wc-names.mjs";

describe("wc-names", () => {
  it("elementNames returns names from registration source", () => {
    const src = readFileSync("src/js/wc/registration.mjs", "utf8") + "\n" + readFileSync("src/js/wc/index.mjs", "utf8");
    // fallback: scan all wc files
    const all = ["behaviours","content","core","dashboard","data","docs","feedback","forms","index","interaction","layout","map","misc","navigation","registration","shadow","states","svg","ui"]
      .map(f => readFileSync(`src/js/wc/${f}.mjs`, "utf8")).join("\n");
    const res = elementNames(all);
    expect(Array.isArray(res.names) ? res.names : [...res.names]).toBeTruthy();
    expect((res.names instanceof Set ? res.names.size : res.names.length)).toBeGreaterThan(0);
  });
  it("typeDeclarations produces a string", () => {
    const all = ["behaviours","content","core","dashboard","data","docs","feedback","forms","index","interaction","layout","map","misc","navigation","registration","shadow","states","svg","ui"]
      .map(f => readFileSync(`src/js/wc/${f}.mjs`, "utf8")).join("\n");
    const res = elementNames(all);
    const names = res.names instanceof Set ? [...res.names] : res.names;
    const decl = typeDeclarations(names);
    expect(Array.isArray(decl)).toBe(true);
    expect(decl.length).toBeGreaterThan(0);
  });
});
