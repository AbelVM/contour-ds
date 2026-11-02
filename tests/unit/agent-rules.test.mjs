import { describe, it, expect } from "vitest";
import { buildAgentRules, AGENT_RULES_VERSION, agentRulesJson } from "../../tools/lib/agent-rules.mjs";

describe("agent-rules", () => {
  it("AGENT_RULES_VERSION is string", () => {
    expect(typeof AGENT_RULES_VERSION).toBe("string");
  });
  it("buildAgentRules produces a document", () => {
    const doc = buildAgentRules(process.cwd());
    expect(doc).toBeTruthy();
  });
  it("agentRulesJson serializes", () => {
    const doc = buildAgentRules(process.cwd());
    const s = agentRulesJson(doc);
    expect(typeof s).toBe("string");
    expect(s.endsWith("\n")).toBe(true);
  });
});
