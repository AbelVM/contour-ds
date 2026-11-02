import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("published tarball (R12-29)", () => {
  it("npm pack --ignore-scripts produces a tarball with dist/", () => {
    const dir = mkdtempSync(join(tmpdir(), "contour-pack-"));
    try {
      const out = execFileSync("npm", ["pack", "--ignore-scripts", "--pack-destination", dir], { stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" }).trim();
      const tarball = join(dir, out.split("\n").pop().trim());
      expect(existsSync(tarball)).toBe(true);
      const list = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" });
      expect(list).toContain("package/dist/contour.css");
      expect(list).toContain("package/dist/contour-wc.js");
      expect(list).toContain("package/dist/contour.d.ts");
      expect(list).toContain("package/package.json");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("CSP and source maps (R12-29)", () => {
  it("shipped JS has no eval/Function constructor", async () => {
    const { readFileSync } = await import("node:fs");
    const js = readFileSync("dist/contour.min.js", "utf8");
    expect(js).not.toMatch(/\beval\s*\(/);
    expect(js).not.toMatch(/new\s+Function\s*\(/);
  });

  it("shipped CSS has no @import of off-origin URLs", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync("dist/contour.min.css", "utf8");
    const imports = css.match(/@import\s+url\([^)]*\)/g) || [];
    for (const imp of imports) {
      expect(imp).not.toMatch(/https?:\/\//);
    }
  });

  it("source maps are not shipped (or are valid)", async () => {
    const { existsSync } = await import("node:fs");
    // Source maps are optional; if present they must be valid JSON.
    if (existsSync("dist/contour.min.js.map")) {
      const { readFileSync } = await import("node:fs");
      const map = JSON.parse(readFileSync("dist/contour.min.js.map", "utf8"));
      expect(map.version).toBe(3);
    }
  });
});
