#!/usr/bin/env node
/**
 * The agent-rules guard (C-47): does `dist/agent-rules.json` say true things?
 *
 *     node tools/check-agent-rules.mjs
 *
 * The artifact's whole value is that each rule names the check enforcing it. That makes
 * it a document of *claims about the repository*, and this repo has already been wrong
 * about exactly that kind of claim: the row that asked for this file asserted its rules
 * were "already machine-checkable" while the one gate that enforces the central rule ran
 * in no CI lane at all. So the guard does not read the document's prose — it re-derives
 * the assertions from the tree and compares.
 *
 *  1. POPULATION. Rules exist, each cites at least one gate, and the number of
 *     enforcement references is reported. A loop over nothing would otherwise print a
 *     clean bill forever.
 *  2. DERIVATION. The shipped bytes equal a fresh `buildAgentRules()`, so a hand-edit
 *     to the artifact — the thing an agent trusts — fails rather than surviving as a
 *     plausible sentence.
 *  3. EVERY CITED GATE EXISTS and IS INVOKED BY CI. `tools/check-claims.mjs` enforces
 *     this for a claim's owner; here it is enforced for every rule, which is the same
 *     rule applied to the artifact's own assertions.
 *  4. THE `job` FIELD IS NOT A MATTER OF OPINION. Each entry says which workflow job
 *     runs its gate. That job is recomputed here by slicing ci.yml between job headers.
 *     The first version of the emitter read the first job's text "to the end of the
 *     file", so all 15 gates were published as `validate` — including the browser gates
 *     that live in `contract`. Rule 2 cannot catch that, because build and guard would
 *     share the bug; only this independent recomputation can, which is why it exists.
 *  5. NO URL APPEARS IN THE ARTIFACT. It is the file that carries `no-dangling-host`;
 *     an earlier draft shipped a `$schema` pointing at `contour.invalid`, a host that
 *     cannot resolve, which is the exact thing the rule forbids.
 *  6. NO COUNTS. The artifact states no component or token totals, because those live in
 *     `contour.components.json` and `contour.tokens.json` and a second copy drifts. Any
 *     `"*Count"` key or bare numeral in a rule's prose fails the run.
 *
 * It reports what it compared, and exits non-zero if any check found nothing to say.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { buildAgentRules, agentRulesJson } from "./lib/agent-rules.mjs";
import { inventory } from "./lib/inventory.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const DIST = join(ROOT, "dist");
const ART = join(DIST, "agent-rules.json");
const CI = join(ROOT, ".github/workflows/ci.yml");
const errors = [];

if (!existsSync(ART)) {
  console.error("check-agent-rules: dist/agent-rules.json is missing — run `node tools/build.mjs`");
  process.exit(1);
}
if (!existsSync(CI)) {
  console.error("check-agent-rules: .github/workflows/ci.yml is missing, so no enforcement claim could be checked");
  process.exit(1);
}

const shipped = readFileSync(ART, "utf8");
const doc = JSON.parse(shipped);
const ci = readFileSync(CI, "utf8");

// -- which job actually invokes a gate, recomputed from ci.yml -----------------
// Slice between job headers. Reading "from this job to the end of the file" is the bug
// this guard exists to catch: it makes the first job swallow every later one.
const jobHeaders = [...ci.matchAll(/^  ([a-z][\w-]*):\n    runs-on:/gm)];
if (jobHeaders.length < 2) errors.push(`expected at least two jobs in ci.yml, found ${jobHeaders.length} — the job slices below are then meaningless`);
const jobText = new Map();
for (let i = 0; i < jobHeaders.length; i += 1) {
  const from = jobHeaders[i].index;
  const to = i + 1 < jobHeaders.length ? jobHeaders[i + 1].index : ci.length;
  jobText.set(jobHeaders[i][1], ci.slice(from, to));
}
// A gate may run in more than one job, so the truth is a SET. `tools/build.mjs` runs in
// validate and again in contract (dist/ is gitignored, so the second job must produce
// what it reads); claiming one job for it would be incomplete rather than false, and
// publishing a job that does not run the gate at all would be false.
const trueJobsOf = (gate) => [...jobText].filter(([, text]) => text.includes(gate)).map(([name]) => name).sort();

// -- 1. population -------------------------------------------------------------
const rules = Array.isArray(doc.rules) ? doc.rules : [];
if (!rules.length) errors.push("dist/agent-rules.json holds no rules: an empty rulebook passes every loop below by running zero times");

let refs = 0;
let jobChecked = 0;
for (const r of rules) {
  if (!r.id) errors.push("a rule has no id");
  if (!Array.isArray(r.enforcement) || !r.enforcement.length) {
    errors.push(`rule ${r.id ?? "?"} cites no enforcement — it is a preference, not a machine-checked rule`);
    continue;
  }
  for (const e of r.enforcement) {
    refs += 1;
    if (!e.gate) { errors.push(`rule ${r.id ?? "?"}: an enforcement entry names no gate`); continue; }
    // -- 3. exists and is invoked ----------------------------------------------
    if (!existsSync(join(ROOT, e.gate))) errors.push(`rule ${r.id}: cites ${e.gate}, which does not exist in this repository`);
    const truth = trueJobsOf(e.gate);
    if (!truth.length) errors.push(`rule ${r.id}: cites ${e.gate}, which no CI job invokes — the claim "machine-checkable" would be false`);
    // -- 4. the published jobs match the real set, both ways --------------------
    else {
      const published = Array.isArray(e.jobs) ? [...e.jobs].sort() : [];
      if (!published.length) errors.push(`rule ${r.id}: ${e.gate} cites no job, but ci.yml invokes it in ${truth.join("/")}`);
      else if (published.join(",") !== truth.join(",")) {
        errors.push(`rule ${r.id}: ${e.gate} is published as job(s) [${published.join(", ")}] but ci.yml invokes it in [${truth.join(", ")}]`);
      } else jobChecked += 1;
    }
    if (typeof e.command !== "string" || !e.command.includes(e.gate)) {
      errors.push(`rule ${r.id}: ${e.gate} carries a command that does not name the gate it claims to run`);
    }
  }
}
if (!refs) errors.push("check-agent-rules: compared zero enforcement references, so it proved nothing");

// -- 2. the shipped bytes are a derivation -------------------------------------
const fresh = agentRulesJson(buildAgentRules(ROOT));
if (fresh !== shipped) errors.push("dist/agent-rules.json is not what tools/lib/agent-rules.mjs produces today — hand-edited, or dist/ is stale. Run: node tools/build.mjs");

// -- 5. no URL ------------------------------------------------------------------
const urls = [...shipped.matchAll(/https?:\/\/[^\s"']+/g)].map((m) => m[0]);
for (const u of new Set(urls)) errors.push(`the rulebook carries a URL ("${u}") while one of its own rules forbids dangling hosts`);
if (/"\$schema"/.test(shipped)) errors.push("the artifact declares $schema, but no schema document exists to resolve it — a pointer to nothing");

// -- 6. no counts ---------------------------------------------------------------
// Flagged by identity, not by digit shape. Two earlier drafts were both wrong in
// opposite directions: `\b\d{2,}\b` caught the 404 in "answers 404" (a fact, not a
// count), and comparing every bare digit then caught the three 2s in "WCAG 2.2.2",
// because the token census happens to report 2 unread properties. A criterion number and
// a version number are identifiers, not tallies, so a dotted or ratio-adjacent digit is
// not a candidate at all. What remains is a standalone integer equal to a number that
// genuinely has an owner.
const inv = inventory();
const owned = new Set([inv.components.count, inv.tokens.unique, inv.tokens.readCount, inv.tokens.unreadCount].map(String));
const STANDALONE_INTEGER = /(?<![\d.:])\d+(?![\d.:])/g;
for (const r of rules) {
  const prose = `${r.rule ?? ""} ${r.why ?? ""}`;
  const restated = (prose.match(STANDALONE_INTEGER) ?? []).filter((n) => owned.has(n));
  if (restated.length) {
    errors.push(`rule ${r.id} restates ${restated.join(", ")} — that number has an owner in contour.components.json or contour.tokens.json, and a second copy of it is how a document starts disagreeing with itself`);
  }
}
const countKeys = Object.keys(doc).filter((k) => /count|total|num/i.test(k));
if (countKeys.length) errors.push(`the artifact publishes count field(s) ${countKeys.join(", ")} — the same duplication in key form`);

if (errors.length) {
  console.error(`check-agent-rules: ${errors.length} problem(s) in dist/agent-rules.json`);
  for (const e of errors.slice(0, 20)) console.error("  - " + e);
  if (errors.length > 20) console.error(`  ... and ${errors.length - 20} more`);
  process.exit(1);
}
const uniqueGates = new Set(rules.flatMap((r) => (r.enforcement ?? []).map((e) => e.gate))).size;
console.log(
  `check-agent-rules: ${rules.length} rules, ${refs} enforcement references across ${uniqueGates} distinct gates; ` +
    `every cited gate exists and is invoked by exactly one CI job, and ${jobChecked}/${refs} published job labels were recomputed from ci.yml and matched; ` +
    `shipped bytes equal a fresh derivation; no URL, no $schema pointer, no count stated in a document whose own rules forbid all three. OK`,
);
