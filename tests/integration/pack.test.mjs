import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

describe("published package (R12-29)", () => {
  it("package.json declares dist/ and integrations/ in files", () => {
    const pkg = JSON.parse(execFileSync("node", ["-e", "console.log(JSON.stringify(require('./package.json')))"], { encoding: "utf8" }));
    expect(pkg.files).toContain("dist/");
    expect(pkg.files).toContain("integrations/");
  });

  it("dist/contour-wc.js exists and parses", () => {
    expect(existsSync("dist/contour-wc.js")).toBe(true);
    execFileSync(process.execPath, ["--check", "dist/contour-wc.js"], { stdio: "pipe" });
  });

  it("dist/contour.d.ts exists", () => {
    expect(existsSync("dist/contour.d.ts")).toBe(true);
  });

  it("no top-level inline <script> without src in shipped pages", () => {
    // Smoke: ensure index.html has no <script> without src except the allowlisted ones.
    // Full CSP audit is tools/check-markup.mjs.
    execFileSync("node", ["tools/check-markup.mjs"], { stdio: "pipe" });
  });
});
