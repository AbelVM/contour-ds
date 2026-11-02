import { describe, it, expect } from "vitest";
import { guideProvenance, readGuide, stampTables, buildDocs, provenance } from "../../tools/lib/docs.mjs";

describe("docs", () => {
  it("guideProvenance returns source", () => {
    const g = guideProvenance(process.cwd());
    expect(g).toBeTruthy();
    expect(typeof g.source).toBe("string");
  });
  it("readGuide parses guide", () => {
    const g = guideProvenance(process.cwd());
    const guide = readGuide(g.source);
    expect(guide).toBeTruthy();
  });
  it("stampTables returns object", () => {
    const t = stampTables(process.cwd());
    expect(t).toBeTruthy();
  });
  it("buildDocs produces docs", async () => {
    const g = guideProvenance(process.cwd());
    const guide = readGuide(g.source);
    const inv = (await import("../../tools/lib/inventory.mjs")).inventory();
    const docs = buildDocs(guide, inv, g.src, stampTables(process.cwd()));
    expect(docs).toBeTruthy();
  });
  it("provenance helper", () => {
    const p = provenance({ file: "index.html", sha256: "abc", fileLastChanged: "2026-01-01" });
    expect(p).toBeTruthy();
  });
});
