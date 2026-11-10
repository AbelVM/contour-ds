#!/usr/bin/env node
/**
 * Generate framework-specific type augmentations from dist/contour.d.ts (CDS-037).
 * Outputs: dist/contour.react.d.ts, dist/contour.vue.d.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const DIST = join(ROOT, "dist");
const dts = readFileSync(join(DIST, "contour.d.ts"), "utf8");
const m = dts.match(/interface HTMLElementTagNameMap\s*\{([\s\S]*?)\n\s*\}/);
if (!m) throw new Error("HTMLElementTagNameMap not found");
const pairs = [...m[1].matchAll(/"([^"]+)":\s*([^;]+);/g)].map(x => [x[1], x[2].trim()]);
const ifaces = [...new Set(pairs.map(([, i]) => i).filter(i => i !== "ContourElement"))].sort();
const base = "ContourElement";
const all = [base, ...ifaces.filter(i => i !== base)];
const typeImport = `import type { ${all.join(", ")} } from "./contour";`;

const react = [typeImport, "", "declare global {", "  namespace JSX {", "    interface IntrinsicElements {"];
for (const [tag, iface] of pairs) react.push(`      "${tag}": Partial<${iface}> & Record<string, any>;`);
react.push("    }", "  }", "}", "", "export {};");

const vue = [typeImport, "", "declare module 'vue' {", "  export interface GlobalComponents {"];
for (const [tag, iface] of pairs) vue.push(`    "${tag}": ${iface};`);
vue.push("  }", "}", "", "export {};");

writeFileSync(join(DIST, "contour.react.d.ts"), react.join("\n") + "\n");
writeFileSync(join(DIST, "contour.vue.d.ts"), vue.join("\n") + "\n");
console.log(`gen-framework-types: ${pairs.length} tags`);
