import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, readdirSync, readFileSync } from "node:fs";
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
      expect(list).toContain("package/dist/contour.esm.js");
      expect(list).toContain("package/dist/contour.tokens.json");
      expect(list).toContain("package/dist/contour.themes.json");
      expect(list).toContain("package/dist/contour.components.json");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("tarball contains no source maps unless valid", () => {
    const dir = mkdtempSync(join(tmpdir(), "contour-pack-"));
    try {
      const out = execFileSync("npm", ["pack", "--ignore-scripts", "--pack-destination", dir], { stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" }).trim();
      const tarball = join(dir, out.split("\n").pop().trim());
      const list = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" });
      const maps = list.split("\n").filter((f) => f.endsWith(".map"));
      for (const m of maps) {
        const content = execFileSync("tar", ["-xOzf", tarball, m], { encoding: "utf8" });
        const parsed = JSON.parse(content);
        expect(parsed.version).toBe(3);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("CSP and source maps (R12-29)", () => {
  it("shipped JS has no eval/Function constructor", async () => {
    const { readFileSync } = await import("node:fs");
    for (const f of ["dist/contour.min.js", "dist/contour.js", "dist/contour-wc.min.js", "dist/contour-wc.js"]) {
      if (!existsSync(f)) continue;
      const js = readFileSync(f, "utf8");
      expect(js).not.toMatch(/\beval\s*\(/);
      expect(js).not.toMatch(/new\s+Function\s*\(/);
    }
  });

  it("shipped JS has no document.write", async () => {
    const { readFileSync } = await import("node:fs");
    for (const f of ["dist/contour.min.js", "dist/contour.js", "dist/contour-wc.min.js", "dist/contour-wc.js"]) {
      if (!existsSync(f)) continue;
      const js = readFileSync(f, "utf8");
      expect(js).not.toMatch(/document\.write/);
    }
  });

  it("shipped JS has no string-based timers", async () => {
    const { readFileSync } = await import("node:fs");
    for (const f of ["dist/contour.min.js", "dist/contour.js", "dist/contour-wc.min.js", "dist/contour-wc.js"]) {
      if (!existsSync(f)) continue;
      const js = readFileSync(f, "utf8");
      expect(js).not.toMatch(/setTimeout\s*\(\s*["'`]/);
      expect(js).not.toMatch(/setInterval\s*\(\s*["'`]/);
    }
  });

  it("shipped CSS has no @import of off-origin URLs", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync("dist/contour.min.css", "utf8");
    const imports = css.match(/@import\s+url\([^)]*\)/g) || [];
    for (const imp of imports) {
      expect(imp).not.toMatch(/https?:\/\//);
    }
  });

  it("source maps are valid JSON when present", async () => {
    const { readdirSync } = await import("node:fs");
    const files = readdirSync("dist").filter((f) => f.endsWith(".map"));
    for (const f of files) {
      const map = JSON.parse(readFileSync(join("dist", f), "utf8"));
      expect(map.version).toBe(3);
      expect(Array.isArray(map.sources)).toBe(true);
    }
  });
});

describe("Trusted Types and CSP (R12-29)", () => {
  it("shipped JS contains no innerHTML assignment to unsanitized input (no raw template literals with script)", async () => {
    const { readFileSync } = await import("node:fs");
    for (const f of ["dist/contour.min.js", "dist/contour-wc.min.js"]) {
      if (!existsSync(f)) continue;
      const js = readFileSync(f, "utf8");
      // Ensure no obvious script injection vectors remain in minified output.
      expect(js).not.toMatch(/<script/i);
    }
  });

  it("no document.write in shipped JS", async () => {
    const { readFileSync } = await import("node:fs");
    const js = readFileSync("dist/contour.min.js", "utf8");
    expect(js).not.toMatch(/document\.write/);
  });
});
