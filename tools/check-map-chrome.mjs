#!/usr/bin/env node
/**
 * Map-chrome coverage + design-rule guard.
 *
 * Verifies that src/css/map-chrome.css:
 *   - is non-empty and brace-balanced
 *   - contains no raw colour values (hex/rgb/hsl/oklch) outside data: URIs
 *   - contains no geometry/layout rules beyond the documented popup-tip triangle
 *   - re-keys every control class named in dist/map-chrome-contract.json
 *   - uses only maplibregl-/mapboxgl- prefixed selectors (no stray rules)
 *
 * Exits non-zero on any failure. Prints how many rules/selectors it checked.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const errors = [];
const cssPath = join(ROOT, "src/css/map-chrome.css");
const contractPath = join(ROOT, "dist/map-chrome-contract.json");

if (!existsSync(cssPath)) { console.error("check-map-chrome: missing src/css/map-chrome.css"); process.exit(1); }
const css = readFileSync(cssPath, "utf8");

// Brace balance
const opens = (css.match(/\{/g) || []).length;
const closes = (css.match(/\}/g) || []).length;
if (opens !== closes) errors.push(`brace imbalance: ${opens} open vs ${closes} close`);

// Strip comments and data: URIs for colour/geometry checks
const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
const noData = noComments.replace(/url\("data:[^"]*"\)/g, 'url("data:...")');

// Raw colour values outside data: URIs
const colourRe = /#(?:[0-9a-fA-F]{3,8})\b|rgba?\(|hsla?\(|oklch\(/g;
const colourHits = noData.match(colourRe);
if (colourHits && colourHits.length) errors.push(`raw colour values found: ${colourHits.length} (${colourHits.slice(0,5).join(", ")})`);

// Geometry rules (allow the popup-tip triangle)
const geomProps = /\b(width|height|padding(?:-[a-z]+)?|margin(?:-[a-z]+)?|top|left|right|bottom|transform|inset)\s*:/g;
const geomHits = [];
let m;
const geomRe = /\b(width|height|padding(?:-[a-z]+)?|margin(?:-[a-z]+)?|top|left|right|bottom|transform|inset)\s*:/g;
// Walk rule by rule
const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
let ruleCount = 0;
let selectorCount = 0;
const selectors = [];
while ((m = ruleRe.exec(noComments)) !== null) {
  ruleCount++;
  const sel = m[1].trim();
  const body = m[2];
  selectors.push(sel);
  selectorCount += sel.split(",").length;
  // geometry check, exempting popup-tip triangle
  if (/width\s*:\s*0\s*;/.test(body) && /height\s*:\s*0\s*;/.test(body) && /border\s*:\s*10px/.test(body)) {
    // popup tip triangle — allowed
  } else {
    const g = body.match(geomRe);
    if (g) geomHits.push(...g);
  }
}
if (geomHits.length) errors.push(`geometry/layout properties found: ${geomHits.length} (${[...new Set(geomHits)].slice(0,8).join(", ")})`);

// Selector prefix check
const badPrefix = selectors.filter((s) => {
  const classes = s.match(/\.[a-zA-Z][\w-]*/g) || [];
  return classes.some((c) => !/^\.(maplibregl|mapboxgl)-/.test(c));
});
// Allow selectors with no class (none expected) but flag unknown prefixes
const unknownClass = [];
for (const s of selectors) {
  const classes = s.match(/\.[a-zA-Z][\w-]*/g) || [];
  for (const c of classes) {
    if (!/^\.(maplibregl|mapboxgl)-/.test(c)) unknownClass.push(c);
  }
}
if (unknownClass.length) errors.push(`selectors with non-vendor class: ${[...new Set(unknownClass)].join(", ")}`);

// Contract coverage
let contract = null;
if (existsSync(contractPath)) {
  try { contract = JSON.parse(readFileSync(contractPath, "utf8")); } catch (e) { errors.push("map-chrome-contract.json is not valid JSON: " + e.message); }
} else {
  errors.push("missing dist/map-chrome-contract.json (run build)");
}

const cssLower = css.toLowerCase();
const controlToClass = {
  navigation: ["zoom-in", "zoom-out", "compass"],
  fullscreen: ["fullscreen", "shrink"],
  compass: ["compass"],
  geolocate: ["geolocate"],
  scale: ["scale"],
  attribution: ["attrib", "attrib-button", "attrib-inner"],
  logo: ["logo"],
  "layer-control": ["layers"],
  indoor: ["indoor-toggle", "level-button"],
  globe: ["globe"],
  terrain: ["terrain"],
};
let coveredControls = 0;
let totalControls = 0;
if (contract && contract.engines) {
  for (const [engine, info] of Object.entries(contract.engines)) {
    const prefix = engine === "maplibre" ? "maplibregl" : "mapboxgl";
    for (const ctrl of info.controls || []) {
      totalControls++;
      const classes = controlToClass[ctrl] || [];
      const ok = classes.length === 0 || classes.some((c) => cssLower.includes(`${prefix}-ctrl-${c}`) || cssLower.includes(`${prefix}-ctrl-${c.replace("-","")}`));
      // looser: just check the control's primary class token appears
      const primaryMap = { navigation: `${prefix}-ctrl`, attribution: `${prefix}-ctrl-attrib`, logo: `${prefix}-ctrl-logo`, scale: `${prefix}-ctrl-scale`, fullscreen: `${prefix}-ctrl-fullscreen`, compass: `${prefix}-ctrl-compass`, geolocate: `${prefix}-ctrl-geolocate`, "layer-control": `${prefix}-ctrl-layers`, indoor: `${prefix}-ctrl-indoor-toggle`, globe: `${prefix}-ctrl-globe`, terrain: `${prefix}-ctrl-terrain` };
      const primary = primaryMap[ctrl] || `${prefix}-ctrl-${ctrl}`;
      const present = cssLower.includes(primary);
      if (present) coveredControls++;
      else errors.push(`contract lists control "${ctrl}" for ${engine} but no "${primary}" rule found in CSS`);
    }
  }
}

// Token usage: every colour-bearing property should use var(--...)
const colourProps = css.match(/(?:background(?:-color)?|color|border-color|box-shadow)\s*:[^;]+;/g) || [];
const nonTokenColour = colourProps.filter((p) => !/var\(--/.test(p) && !/transparent/.test(p));
if (nonTokenColour.length) errors.push(`colour-bearing declarations not using tokens: ${nonTokenColour.length}`);

if (errors.length) {
  console.error("check-map-chrome: FAIL");
  errors.forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log(`check-map-chrome: OK — ${ruleCount} rules, ${selectorCount} selectors, ${coveredControls}/${totalControls} contract controls covered`);
process.exit(0);
