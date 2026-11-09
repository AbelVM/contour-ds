#!/usr/bin/env node
import { inventory } from "./lib/inventory.mjs";
import { writeFileSync, readFileSync, readdirSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const inv = inventory();
const names = inv.components.names;
const tokens = Object.keys(inv.tokens.census);

// Parse CONTOUR_EVENTS from core.mjs for the event detail-payload interfaces (BY3-I7).
const coreSrc = readFileSync(join(ROOT, "src/js/wc/core.mjs"), "utf-8");
const evBlock = /CONTOUR_EVENTS\s*=\s*Object\.freeze\(\{([\s\S]*?)\n\s*\}\);/.exec(coreSrc);
const events = [];
if (evBlock) {
  for (const line of evBlock[1].split("\n")) {
    const m = line.match(/"(contour:[a-z-]+)"\s*:\s*\{\s*payload:\s*\[([^\]]*)\]/);
    if (!m) continue;
    const name = m[1];
    const payload = m[2].trim();
    const keys = payload ? payload.split(",").map((k) => k.trim().replace(/^"|"$/g, "")).filter(Boolean) : [];
    events.push({ name, keys });
  }
}

/** Map a Contour class name (ContourBtn) to its tag name (contour-btn). */
const classToTag = (className) => {
  // Strip "Contour" prefix, then kebab-case the rest
  const base = className.replace(/^Contour/, "");
  // Convert PascalCase to kebab-case
  const kebab = base.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  // Avoid double "contour-" prefix (e.g. ContourContourPlot → contour-plot, not contour-contour-plot)
  if (kebab.startsWith("contour-")) return kebab;
  return "contour-" + kebab;
};

/** Map a block name (c-btn) to its tag name (contour-btn). */
const blockToTag = (block) => {
  const base = block.replace(/^c-/, "");
  // Avoid double "contour-" prefix (e.g. c-contour-plot → contour-plot, not contour-contour-plot)
  if (base.startsWith("contour-")) return base;
  return "contour-" + base;
};

/** Parse a WC fragment file for Contour class definitions with observed/properties. */
const parseComponentFile = (filePath) => {
  const src = readFileSync(filePath, "utf-8");
  const components = [];

  // Find all class ContourXxx extends ContourBase { ... } blocks
  const classRegex = /class\s+(Contour\w+)\s+extends\s+ContourBase\s*\{([\s\S]*?)(?=\nclass\s+Contour|\n\/\/\s*==|$)/g;
  let match;
  while ((match = classRegex.exec(src)) !== null) {
    const className = match[1];
    const body = match[2];

    // Extract the return value of a static getter by counting braces/brackets.
    // Finds `static get X() { return <value>; }` and returns the raw <value> text.
    const extractReturn = (getterName) => {
      const startIdx = body.indexOf(`static get ${getterName}()`);
      if (startIdx === -1) return null;
      const retIdx = body.indexOf("return ", startIdx);
      if (retIdx === -1) return null;
      // Find the opening bracket/brace after "return "
      let openPos = -1;
      let openChar = "";
      for (let i = retIdx + 7; i < body.length; i++) {
        const ch = body[i];
        if (ch === "[" || ch === "{") { openPos = i; openChar = ch; break; }
        if (ch === ";") break; // no return value
      }
      if (openPos === -1) return null;
      const closeChar = openChar === "[" ? "]" : "}";
      let depth = 0;
      let closePos = -1;
      for (let i = openPos; i < body.length; i++) {
        if (body[i] === openChar) depth++;
        if (body[i] === closeChar) { depth--; if (depth === 0) { closePos = i; break; } }
      }
      if (closePos === -1) return null;
      return body.slice(openPos, closePos + 1);
    };

    const observedRaw = extractReturn("observed");
    const observed = observedRaw ? eval("(" + observedRaw + ")") : [];

    const propertiesRaw = extractReturn("properties");
    const properties = propertiesRaw ? eval("(" + propertiesRaw + ")") : {};

    // Extract event emissions: this.dispatchEvent(new CustomEvent("contour:xxx", ...))
    const eventMatches = body.matchAll(/new\s+CustomEvent\(\s*"(contour:[a-z-]+)"\s*,\s*\{[\s\S]*?detail:\s*\{([\s\S]*?)\}/g);
    const emittedEvents = new Set();
    for (const em of eventMatches) {
      emittedEvents.add(em[1]);
    }

    components.push({
      className,
      tag: classToTag(className),
      observed,
      properties,
      events: Array.from(emittedEvents),
    });
  }

  return components;
};

// Parse all WC fragment files for component definitions.
const wcDir = join(ROOT, "src/js/wc");
const fragmentFiles = readdirSync(wcDir)
  .filter((f) => f.endsWith(".mjs") && f !== "core.mjs" && f !== "shadow.mjs" && f !== "registration.mjs" && f !== "index.mjs")
  .sort();

const allComponents = [];
for (const file of fragmentFiles) {
  const comps = parseComponentFile(join(wcDir, file));
  allComponents.push(...comps);
}

// Parse actual registered light-DOM tags from all WC source files for
// define("contour-...") calls, so the TagNameMap never promises elements
// the bundle does not define.
const registeredTags = new Set();
for (const file of readdirSync(wcDir)) {
  if (!file.endsWith(".mjs")) continue;
  const src = readFileSync(join(wcDir, file), "utf-8");
  for (const m of src.matchAll(/define\("contour-([a-z0-9-]+)"/g)) {
    registeredTags.add("contour-" + m[1]);
  }
}
// calls and dynamic ones from SHADOW_SLOTS (contour-shadow-<block>).
const shadowSrc = readFileSync(join(wcDir, "shadow.mjs"), "utf-8");
const actualShadowTags = new Set();

// Static: shadow("contour-shadow-<name>", ...)
for (const m of shadowSrc.matchAll(/shadow\("contour-shadow-([a-z0-9-]+)"/g)) {
  actualShadowTags.add("contour-shadow-" + m[1]);
}

// Dynamic: SHADOW_SLOTS maps host tag -> array of blocks; each block becomes contour-shadow-<block>
const slotsMatch = shadowSrc.match(/const\s+SHADOW_SLOTS\s*=\s*\{([\s\S]*?)\n\s*\};/);
if (slotsMatch) {
  const slotsBody = slotsMatch[1];
  for (const block of slotsBody.matchAll(/"([a-z0-9-]+)"/g)) {
    actualShadowTags.add("contour-shadow-" + block[1]);
  }
}

// Also catch define("contour-shadow-<name>", ...) calls (e.g. contour-shadow-dialog)
for (const m of shadowSrc.matchAll(/define\("contour-shadow-([a-z0-9-]+)"/g)) {
  actualShadowTags.add("contour-shadow-" + m[1]);
}

// Convert a JS property type to a TypeScript type.
const propTypeToTS = (spec) => {
  if (!spec) return "string | null";
  const t = spec.type;
  if (t === Boolean) return "boolean";
  if (t === Number) return "number";
  if (t === String) return "S";
  return "S";
};

// Determine the base interface for a component based on its characteristics.
const baseInterfaceFor = (comp) => {
  const formTags = ["contour-input", "contour-textarea", "contour-select", "contour-check", "contour-radio",
    "contour-switch", "contour-range", "contour-color-picker", "contour-date-picker", "contour-time-picker",
    "contour-number-field", "contour-file-upload", "contour-tags-input", "contour-segmented", "contour-version",
    "contour-rating", "contour-combobox", "contour-date-range", "contour-time-range", "contour-range-scale"];
  const dataTags = ["contour-chart", "contour-table", "contour-data-table", "contour-data-grid", "contour-kpi",
    "contour-gauge", "contour-donut", "contour-stat", "contour-delta", "contour-metrics", "contour-readout",
    "contour-category", "contour-stacked-bar", "contour-bivariate", "contour-heatmap", "contour-hexbin",
    "contour-flow-map", "contour-isochrone", "contour-catchment", "contour-brush", "contour-measure",
    "contour-axis", "contour-legend", "contour-sparkline", "contour-streaming-chart", "contour-timeline",
    "contour-time-series", "contour-pivot", "contour-threshold", "contour-dash-kpi-row", "contour-dash-freshness",
    "contour-instrument", "contour-plot"];
  if (formTags.includes(comp.tag)) return "ContourFormElement";
  if (dataTags.includes(comp.tag)) return "ContourDataElement";
  return "ContourElement";
};

// Properties covered by each base interface (so we don't duplicate them).
const baseProps = new Map([
  ["ContourElement", new Set([
    "action","actions","after","anchor","answer","area","article","attribution","attribution-mark","axis","axis-x","axis-y",
    "before","body","brand","canvas","cells","center","chrome","closable","color","cols","columns","command","controls",
    "copyable","count","current","date","delta","demo","desc","direction","divider","do","dont","dot","empty","error","hint",
    "href","icon","index","instrument","items","key","label","lede","legend","line","links","live","max","media","message",
    "method","min","name","needle","next","no","nodes","norm","note","options","pages","placeholder","point","points","prev",
    "prompt","question","quote","ramp","removable","required","reverse","rings","rows","scale","separator","series","shortcut",
    "size","state","status","steps","subtitle","summary","tabs","tag","text","title","type","unit","value","variant","viewport","yes"
  ])],
  ["ContourFormElement", new Set([
    "value","checked","disabled","required","name","placeholder","min","max","step"
  ])],
  ["ContourDataElement", new Set([
    "data","series","src","loading","error","empty","skeleton"
  ])],
]);

// Generate per-component interfaces only for components with properties
// not already covered by their base interface.
const componentInterfaces = [];
for (const comp of allComponents) {
  const ifaceName = "Contour" + comp.className.replace(/^Contour/, "") + "Element";
  const base = baseInterfaceFor(comp);
  const props = comp.properties;
  const observed = comp.observed;

  // Skip if all props are already in the base interface.
  const covered = baseProps.get(base) || new Set();
  const uniqueProps = {};
  for (const [propName, spec] of Object.entries(props)) {
    if (!covered.has(propName)) uniqueProps[propName] = spec;
  }
  if (Object.keys(uniqueProps).length === 0) continue;

  componentInterfaces.push({
    ifaceName,
    base,
    tag: comp.tag,
    props: uniqueProps,
    observed,
    events: comp.events,
  });
}

// Sort interfaces by tag name for stable output.
componentInterfaces.sort((a, b) => a.tag.localeCompare(b.tag));

// Build a map from tag name to component spec (built from componentInterfaces
// so it carries ifaceName for the TagNameMap).
const componentByTag = new Map();
for (const ci of componentInterfaces) {
  componentByTag.set(ci.tag, ci);
}

// Map every component tag to its base interface (for components without
// a per-component interface, all props are covered by the base).
const tagToBase = new Map();
for (const comp of allComponents) {
  tagToBase.set(comp.tag, baseInterfaceFor(comp));
}

const lines = [];
lines.push("type S=string|null;");
lines.push("export interface ContourAPI{__loaded:true;version:string;toast:(m:string)=>void;setScheme:(s:'dark'|'light')=>void;scrollTo:(id:string|HTMLElement)=>void;copy:(t:string)=>Promise<void>;chart:{scale:(d:[number,number],r:[number,number])=>(v:number)=>number;ticks:(min:number,max:number,c:number)=>number[];datum:(x:number,y:number)=>{x:number;y:number};};commands:{register:(cmd:{title:string;hint?:S;icon?:S;shortcut?:S;run:()=>void})=>void;list:()=>Array<{title:string;hint:S;icon:S;shortcut:S|null}>;};};");
lines.push("");
lines.push("export interface ContourProps{action?:S;actions?:S;after?:S;anchor?:S;answer?:S;area?:S;article?:S;attribution?:S;attribution-mark?:S;axis?:S;axis-x?:S;axis-y?:S;before?:S;body?:S;brand?:S;canvas?:S;cells?:S;center?:S;chrome?:S;closable?:S;color?:S;cols?:S;columns?:S;command?:S;controls?:S;copyable?:S;count?:S;current?:S;date?:S;delta?:S;demo?:S;desc?:S;direction?:S;divider?:S;do?:S;dont?:S;dot?:S;empty?:S;error?:S;hint?:S;href?:S;icon?:S;index?:S;instrument?:S;items?:S;key?:S;label?:S;lede?:S;legend?:S;line?:S;links?:S;live?:S;max?:S;media?:S;message?:S;method?:S;min?:S;name?:S;needle?:S;next?:S;no?:S;nodes?:S;norm?:S;note?:S;options?:S;pages?:S;placeholder?:S;point?:S;points?:S;prev?:S;prompt?:S;question?:S;quote?:S;ramp?:S;removable?:S;required?:S;reverse?:S;rings?:S;rows?:S;scale?:S;separator?:S;series?:S;shortcut?:S;size?:S;state?:S;status?:S;steps?:S;subtitle?:S;summary?:S;tabs?:S;tag?:S;text?:S;title?:S;type?:S;unit?:S;value?:S;variant?:S;viewport?:S;yes?:S;}");
lines.push("");
lines.push("export interface ContourElement extends HTMLElement,ContourProps{}");
lines.push("");
lines.push("export interface ContourFormElement extends ContourElement{value?:S;checked?:boolean;disabled?:boolean;required?:boolean;name?:S;placeholder?:S;min?:S;max?:S;step?:S;}");
lines.push("");
lines.push("export interface ContourDataElement extends ContourElement{data?:S;series?:S;src?:S;loading?:S;error?:S;empty?:S;skeleton?:S;}");
lines.push("");

// Per-component interfaces.
for (const ci of componentInterfaces) {
  const propLines = [];
  for (const [propName, spec] of Object.entries(ci.props)) {
    const tsType = propTypeToTS(spec);
    const safeName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(propName) ? propName : JSON.stringify(propName);
    propLines.push(`${safeName}?:${tsType};`);
  }
  const propsBlock = propLines.length ? propLines.join("") : "";
  lines.push(`export interface ${ci.ifaceName} extends ${ci.base}{${propsBlock}}`);
}

lines.push("declare global { interface HTMLElementTagNameMap {");
// Light-DOM components: only tags actually registered via define() are typed,
// so the map never promises elements the bundle does not define.
for (const n of names) {
  const tag = blockToTag(n);
  if (!registeredTags.has(tag)) continue;
  const ci = componentByTag.get(tag);
  if (ci) {
    lines.push(`  "${tag}":${ci.ifaceName};`);
  } else {
    lines.push(`  "${tag}":${tagToBase.get(tag) || "ContourElement"};`);
  }
}
// Shadow-DOM components: map to ContourElement (they delegate to light-DOM counterparts).
// Only tags that actually exist in shadow.mjs are declared.
for (const tag of [...actualShadowTags].sort()) {
  lines.push(`  "${tag}":ContourElement;`);
}
lines.push("  }");
lines.push("interface Window { Contour: ContourAPI; } }");

const out = join(ROOT, "dist", "contour.d.ts");

export { generateTypes };
function generateTypes() {
  let out = lines.join("\n");
  // Minify: strip comment blocks, blank lines, and trailing whitespace.
  out = out
    .replace(/\/\*\*[\s\S]*?\*\//g, "")      // remove /** ... */ comment blocks
    .replace(/\/\/[^\n]*/g, "")              // remove // comments
    .replace(/^[ \t]+$/gm, "")               // remove trailing whitespace
    .replace(/\n{3,}/g, "\n\n")              // collapse 3+ newlines to 2
    .replace(/^\n+/, "")                     // strip leading newlines
    .replace(/\n+$/, "\n");                  // ensure single trailing newline
  return out;
}

// Standalone: write the file when run directly.
if (import.meta.main) {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, generateTypes());
  console.log("Wrote", out, "—", names.length, "components,", tokens.length, "tokens,", events.length, "events,", componentInterfaces.length, "per-component interfaces");
}
