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
