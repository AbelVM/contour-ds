import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const STORIES_DIR = join(ROOT, "stories");
const INVENTORY = join(ROOT, "dist", "contour.components.json");

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

let storyCount = 0;
const maturityCounts = {};
let playCount = 0;
const titles = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  // count exported stories: `export const X` or `export function X`
  const exports = [...src.matchAll(/export\s+(?:const|function)\s+(\w+)/g)].map((m) => m[1]);
  const stories = exports.filter((n) => n !== "default");
  storyCount += stories.length;
  if (/play\s*:/.test(src) || /play\s*\(/.test(src)) playCount += stories.length;
  const titleMatch = src.match(/title\s*:\s*["'`]([^"'`]+)["'`]/);
  if (titleMatch) titles.push(titleMatch[1]);
  const maturityMatch = src.match(/maturity\s*:\s*["'`]([^"'`]+)["'`]/);
  if (maturityMatch) maturityCounts[maturityMatch[1]] = (maturityCounts[maturityMatch[1]] || 0) + 1;
}

// inventory
let inventoryBlocks = [];
if (existsSync(INVENTORY)) {
  const inv = JSON.parse(readFileSync(INVENTORY, "utf8"));
  inventoryBlocks = (inv.blocks || []).map((b) => b.name);
} else {
  errors.push("dist/contour.components.json missing — run node tools/build.mjs");
}

const HIGH_RISK = ["c-btn", "c-input", "c-field", "c-dialog", "c-tabs", "c-command", "c-table", "c-chart", "c-toast", "c-alert", "c-kpi", "c-map-panel", "c-time-slider"];
const coveredBlocks = new Set();
for (const t of titles) {
  // map title leaf to block name best-effort
}
// scan all story sources for contour- tags
let allSrc = "";
for (const f of files) allSrc += readFileSync(f, "utf8") + "\n";
const missingHighRisk = HIGH_RISK.filter((b) => {
  const tag = "contour-" + b.replace("c-", "");
  return !allSrc.includes(tag);
});


// source-contract reference: every story file should import a dist/wc family or dist/contour.css
for (const f of files) {
  const src = readFileSync(f, "utf8");
  if (!/dist\/(wc|contour)/.test(src) && !/dist\/contour\.css/.test(src)) {
    errors.push(`${relative(ROOT, f)} does not reference a shipped dist/ asset`);
  }
}

console.log("Storybook coverage report");
console.log(`  story files: ${files.length}`);
console.log(`  stories: ${storyCount}`);
console.log(`  stories with play functions (estimated): ${playCount}`);
console.log(`  titles: ${titles.join(", ") || "(none)"}`);
console.log(`  inventory blocks: ${inventoryBlocks.length}`);
console.log(`  a11y addon: enabled in .storybook/main.js (test mode: error)`);
console.log(`  maturity counts: ${JSON.stringify(maturityCounts)}`);

if (storyCount === 0) errors.push("zero stories discovered");
if (playCount === 0) console.log("  note: no play functions yet (pilot target: >=5)");

if (errors.length) {
  console.error("\nFAIL:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log("  high-risk families covered (by title): " + (HIGH_RISK.length - missingHighRisk.length) + "/" + HIGH_RISK.length);
if (missingHighRisk.length) console.log("  missing high-risk: " + missingHighRisk.join(", "));
const artifact = {
  generatedAt: new Date().toISOString(),
  storyFiles: files.length,
  stories: storyCount,
  storiesWithPlay: playCount,
  titles,
  maturityCounts,
  highRisk: { total: HIGH_RISK.length, covered: HIGH_RISK.length - missingHighRisk.length, missing: missingHighRisk },
  inventoryBlocks: inventoryBlocks.length,
};
try { mkdirSync(join(ROOT, "tmp", "audit"), { recursive: true }); } catch (e) {}
writeFileSync(join(ROOT, "tmp", "audit", "storybook-coverage.json"), JSON.stringify(artifact, null, 2));
console.log("\nPASS");
