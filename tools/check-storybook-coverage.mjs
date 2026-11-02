import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const STORIES_DIR = join(ROOT, "stories");
const INVENTORY = join(ROOT, "dist", "contour.components.json");
const WC_DIR = join(ROOT, "dist", "wc");

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (/\.(stories|mdx)\.(js|jsx|mjs|ts|tsx|mdx)$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk(STORIES_DIR);
const errors = [];
if (files.length === 0) errors.push("no story files discovered under stories/");

// registry of defined custom elements
const registrySrc = existsSync(WC_DIR)
  ? readdirSync(WC_DIR).map((f) => readFileSync(join(WC_DIR, f), "utf8")).join("\n")
  : "";
const definedTags = new Set([...registrySrc.matchAll(/define\("([^"]+)"\s*,/g)].map((m) => m[1]));

// observed attributes per tag, parsed from src/js/wc/*.mjs
const observedByTag = {};
for (const f of readdirSync(join(ROOT, "src", "js", "wc"))) {
  if (!f.endsWith(".mjs")) continue;
  const src = readFileSync(join(ROOT, "src", "js", "wc", f), "utf8");
  for (const m of src.matchAll(/define\("(contour-[a-z-]+)",\s*(\w+)\)/g)) {
    const tag = m[1]; const cls = m[2];
    const om = src.match(new RegExp("class\\s+" + cls + "\\s+extends\\s+ContourBase\\s*\\{[\\s\\S]*?static get observed\\(\\)\\s*\\{\\s*return\\s*\\[([^\\]]*)\\]", "s"));
    if (om) {
      observedByTag[tag] = om[1].split(",").map((a) => a.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    }
  }
}

// inventory
let inventoryBlocks = [];
if (existsSync(INVENTORY)) {
  const inv = JSON.parse(readFileSync(INVENTORY, "utf8"));
  inventoryBlocks = (inv.blocks || []).map((b) => b.name);
} else {
  errors.push("dist/contour.components.json missing — run node tools/build.mjs");
}
let storyCount = 0;
let playCount = 0;
const titles = [];
const maturityCounts = {};
const a11yStatus = { error: 0, todo: 0, off: 0, unset: 0 };
const perStory = [];
const inventedTags = new Set();

for (const f of files) {
  const src = readFileSync(f, "utf8");
  const exports = [...src.matchAll(/export\s+(?:const|function)\s+(\w+)/g)].map((m) => m[1]);
  const stories = exports.filter((n) => n !== "default");
  storyCount += stories.length;

  const titleMatch = src.match(/title\s*:\s*["'`]([^"'`]+)["'`]/);
  const title = titleMatch ? titleMatch[1] : "(untitled)";
  if (titleMatch) titles.push(title);

  const maturityMatch = src.match(/maturity\s*:\s*["'`]([^"'`]+)["'`]/);
  const maturity = maturityMatch ? maturityMatch[1] : "unspecified";
  maturityCounts[maturity] = (maturityCounts[maturity] || 0) + 1;
  const ALLOWED_MATURITY = new Set(["primitive", "scaffold", "complete-widget", "composition", "unspecified"]);
  if (!ALLOWED_MATURITY.has(maturity)) errors.push(`${relative(ROOT, f)} uses unknown maturity: ${maturity}`);



  // a11y status for this file
  let a11y = "error";
  const a11yMatch = src.match(/a11y\s*:\s*\{[^}]*test\s*:\s*["'`]([^"'`]+)["'`]/);
  if (a11yMatch) a11y = a11yMatch[1];
  else if (!/a11y/.test(src)) a11y = "unset";
  a11yStatus[a11y] = (a11yStatus[a11y] || 0) + 1;
  if (a11y === "off") errors.push(`${relative(ROOT, f)} disables a11y (test: "off") — not allowed`);
  if (a11y === "todo" && !/SB-[A-Z0-9-]+|issue/i.test(src)) errors.push(`${relative(ROOT, f)} marks a11y as todo without a task/issue id`);

  // play functions: count stories that contain a play property in the file (heuristic)
  const hasPlay = /play\s*:/.test(src) || /play\s*\(/.test(src);
  const filePlayCount = hasPlay ? stories.length : 0;
  playCount += filePlayCount;

  // invented tags check
  const tagsInFile = [...src.matchAll(/contour-[a-z][a-z0-9-]*/g)].map((m) => m[0]);
  for (const t of tagsInFile) {
    if (!definedTags.has(t)) inventedTags.add(t);
  }
  // CSS class leak check: any c- class referenced must exist in the inventory's
  // token/var lists or be a known primitive; we at least ensure no ds- guide
  // classes leak into stories.
  const guideClasses = [...src.matchAll(/ds-[a-z][a-z0-9-]*/g)].map((m) => m[0]);
  for (const c of new Set(guideClasses)) {
    errors.push(`${relative(ROOT, f)} references guide-only class ${c} in a story`);
  }

  // argTypes validation (SB-04b): top-level keys must be observed attributes
  // of a contour-* tag used in this file.
  const argTypesIdx = src.indexOf("argTypes");
  if (argTypesIdx !== -1) {
    const braceStart = src.indexOf("{", argTypesIdx);
    if (braceStart !== -1) {
      let depth = 0;
      let end = braceStart;
      for (let i = braceStart; i < src.length; i++) {
        if (src[i] === "{") depth++;
        else if (src[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
      }
      const block = src.slice(braceStart + 1, end);
      // top-level keys: identifiers followed by colon at depth 0
      const keys = [];
      let d = 0;
      let i = 0;
      while (i < block.length) {
        if (block[i] === "{") { d++; i++; continue; }
        if (block[i] === "}") { d--; i++; continue; }
        if (d === 0) {
          const m = block.slice(i).match(/^\s*([\w-]+)\s*:/);
          if (m) { keys.push(m[1]); i += m[0].length; continue; }
        }
        i++;
      }
      if (keys.length) {
        const tagsInFile = [...new Set([...src.matchAll(/contour-[a-z][a-z0-9-]*/g)].map((m) => m[0]))];
        const allowed = new Set();
        for (const t of tagsInFile) for (const a of (observedByTag[t] || [])) allowed.add(a);
        for (const k of keys) {
          if (allowed.size && !allowed.has(k)) {
            errors.push(`${relative(ROOT, f)} argTypes key "${k}" is not an observed attribute of ${tagsInFile.join(", ")}`);
          }
        }
      }
    }
  }

  // inventory block existence: every contour- tag must map to a c- block in the inventory
  for (const t of new Set(tagsInFile)) {
    if (t.includes("shadow-")) continue;
    const blockName = "c-" + t.replace("contour-", "");
    if (inventoryBlocks.length && !inventoryBlocks.includes(blockName)) {
      errors.push(`${relative(ROOT, f)} references ${t} but ${blockName} is absent from contour.components.json`);
    }
  }

  // source-contract reference
  if (!/dist\/(wc|contour)/.test(src) && !/dist\/contour\.css/.test(src)) {
    errors.push(`${relative(ROOT, f)} does not reference a shipped dist/ asset`);
  }

  perStory.push({ file: relative(ROOT, f), title, stories: stories.length, maturity, a11y, play: filePlayCount });
}

if (inventedTags.size) {
  for (const t of inventedTags) errors.push(`story references undefined custom element: ${t}`);
}


const HIGH_RISK = ["c-btn", "c-input", "c-field", "c-dialog", "c-tabs", "c-command", "c-table", "c-chart", "c-toast", "c-alert", "c-kpi", "c-map-panel", "c-time-slider"];
let allSrc = "";
for (const f of files) allSrc += readFileSync(f, "utf8") + "\n";
const missingHighRisk = HIGH_RISK.filter((b) => {
  const tag = "contour-" + b.replace("c-", "");
  return !allSrc.includes(tag);
});

console.log("Storybook coverage report");
console.log(`  story files: ${files.length}`);
console.log(`  stories: ${storyCount}`);
console.log(`  stories with play functions (estimated): ${playCount}`);
console.log(`  titles: ${titles.join(", ") || "(none)"}`);
console.log(`  inventory blocks: ${inventoryBlocks.length}`);
console.log(`  defined custom elements: ${definedTags.size}`);
console.log(`  a11y status (files): ${JSON.stringify(a11yStatus)}`);
console.log(`  maturity counts: ${JSON.stringify(maturityCounts)}`);

if (storyCount === 0) errors.push("zero stories discovered");
if (playCount < 5) errors.push(`only ${playCount} stories with play functions (pilot target: >=5)`);

if (errors.length) {
  console.error("\nFAIL:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log("  high-risk families covered: " + (HIGH_RISK.length - missingHighRisk.length) + "/" + HIGH_RISK.length);
if (missingHighRisk.length) console.log("  missing high-risk: " + missingHighRisk.join(", "));
const artifact = {
  generatedAt: new Date().toISOString(),
  storyFiles: files.length,
  stories: storyCount,
  storiesWithPlay: playCount,
  titles,
  maturityCounts,
  a11yStatus,
  perStory,
  highRisk: { total: HIGH_RISK.length, covered: HIGH_RISK.length - missingHighRisk.length, missing: missingHighRisk },
  inventoryBlocks: inventoryBlocks.length,
  definedElements: definedTags.size,
};
try { mkdirSync(join(ROOT, "tmp", "audit"), { recursive: true }); } catch (e) {}
writeFileSync(join(ROOT, "tmp", "audit", "storybook-coverage.json"), JSON.stringify(artifact, null, 2));
console.log("\nPASS");
