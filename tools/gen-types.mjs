#!/usr/bin/env node
import { inventory } from "./lib/inventory.mjs";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const inv = inventory();
const names = inv.components.names;
const tokens = Object.keys(inv.tokens.census);

// Parse CONTOUR_EVENTS from core.mjs for the event detail-payload interfaces (BY3-I7).
import { readFileSync } from "node:fs";
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

const lines = [];
lines.push("/**");
lines.push(" * Contour Design System — TypeScript definitions");
lines.push(" * Generated from src/css. Do not edit by hand.");
lines.push(" */");
lines.push("");
lines.push("/** All component class names shipped by Contour. */");
lines.push("export type ContourComponent =");
names.map((n) => `  | "${n}"`).forEach((l) => lines.push(l));
lines.push(";");
lines.push("");
lines.push("/** All design tokens declared by Contour. */");
lines.push("export type ContourToken =");
tokens.map((t) => `  | "${t}"`).forEach((l) => lines.push(l));
lines.push(";");
lines.push("");
lines.push("/** The Contour JavaScript API (window.Contour). */");
lines.push("export interface ContourAPI {");
lines.push("  __loaded: true;");
lines.push("  version: string;");
lines.push("  toast: (message: string) => void;");
lines.push("  setScheme: (scheme: 'dark' | 'light') => void;");
lines.push("  scrollTo: (id: string | HTMLElement) => void;");
lines.push("  copy: (text: string) => Promise<void>;");
lines.push("  chart: {");
lines.push("    scale: (domain: [number, number], range: [number, number]) => (v: number) => number;");
lines.push("    ticks: (min: number, max: number, count: number) => number[];");
lines.push("    datum: (x: number, y: number) => { x: number; y: number };");
lines.push("  };");
lines.push("  commands: {");
lines.push("    register: (cmd: { title: string; hint?: string; icon?: string; shortcut?: string; run: () => void }) => void;");
lines.push("    list: () => Array<{ title: string; hint: string; icon: string; shortcut: string | null }>; ");
lines.push("  };");
lines.push("}");
lines.push("");
lines.push("declare global {");
lines.push("  interface HTMLElementTagNameMap {");
for (const n of names) {
  const tag = "contour-" + n.replace(/^c-/, "");
  lines.push(`    "${tag}": HTMLElement;`);
}
lines.push("  }");
lines.push("  interface Window {");
lines.push("    Contour: ContourAPI;");
lines.push("  }");
lines.push("}");
lines.push("");

// Event detail-payload interfaces (BY3-I7).
if (events.length) {
  lines.push("/** Detail payloads for the Contour event vocabulary. */");
  lines.push("export interface ContourEventDetailMap {");
  for (const ev of events) {
    const iface = ev.keys.length
      ? "{ " + ev.keys.map((k) => k + ": unknown").join("; ") + " }"
      : "undefined";
    lines.push(`  "${ev.name}": ${iface};`);
  }
  lines.push("}");
  lines.push("");
  lines.push("export type ContourEventName = keyof ContourEventDetailMap;");
  lines.push("");
}

const out = join(ROOT, "dist", "contour.d.ts");
writeFileSync(out, lines.join("\n"));
console.log("Wrote", out, "—", names.length, "components,", tokens.length, "tokens,", events.length, "events");
