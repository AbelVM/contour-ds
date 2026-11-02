import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

describe("build pipeline", () => {
  it("build.mjs runs successfully", () => {
    execFileSync("node", ["tools/build.mjs"], { stdio: "pipe" });
    expect(existsSync("dist/contour.css")).toBe(true);
    expect(existsSync("dist/contour.components.json")).toBe(true);
  });
  it("check-export passes", () => {
    execFileSync("node", ["tools/check-export.mjs"], { stdio: "pipe" });
  });
  it("check-components passes", () => {
    execFileSync("node", ["tools/check-components.mjs"], { stdio: "pipe" });
  });
  it("check-docs passes", () => {
    execFileSync("node", ["tools/check-docs.mjs"], { stdio: "pipe" });
  });
  it("check-registry passes", () => {
    execFileSync("node", ["tools/check-registry.mjs"], { stdio: "pipe" });
  });
  it("check-tokens passes", () => {
    execFileSync("node", ["tools/check-tokens.mjs"], { stdio: "pipe" });
  });
  it("check-layout passes", () => {
    execFileSync("node", ["tools/check-layout.mjs"], { stdio: "pipe" });
  });
  it("check-css passes", () => {
    execFileSync("node", ["tools/check-css.mjs"], { stdio: "pipe" });
  });
  it("check-ownership passes", () => {
    execFileSync("node", ["tools/check-ownership.mjs"], { stdio: "pipe" });
  });
  it("check-markup passes", () => {
    execFileSync("node", ["tools/check-markup.mjs"], { stdio: "pipe" });
  });
  it("check-motion passes", () => {
    execFileSync("node", ["tools/check-motion.mjs"], { stdio: "pipe" });
  });
  it("check-defs passes", () => {
    execFileSync("node", ["tools/check-defs.mjs"], { stdio: "pipe" });
  });
  it("check-claims passes", () => {
    execFileSync("node", ["tools/check-claims.mjs"], { stdio: "pipe" });
  });
  it("check-wc passes", () => {
    execFileSync("node", ["tools/check-wc.mjs"], { stdio: "pipe" });
  });
  it("check-agent-rules passes", () => {
    execFileSync("node", ["tools/check-agent-rules.mjs"], { stdio: "pipe" });
  });
  it("gen-light-dark --check passes", () => {
    execFileSync("node", ["tools/gen-light-dark.mjs", "--check"], { stdio: "pipe" });
  });
  it("stamp --check passes", () => {
    execFileSync("node", ["tools/stamp.mjs", "--check"], { stdio: "pipe" });
  });
});

describe("snippets idempotency", () => {
  it("running snippets.mjs twice does not change index.html", () => {
    const before = readFileSync("index.html", "utf8");
    execFileSync("node", ["tools/snippets.mjs"], { stdio: "pipe" });
    const after = readFileSync("index.html", "utf8");
    expect(after).toBe(before);
  });
});
