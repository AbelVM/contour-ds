#!/usr/bin/env node
/**
 * The stamp — every number the prose publishes is computed here.
 *
 * The review's first priority finding (T-18) was that three documents quoted
 * three different component counts, because each one was typed by hand. This
 * script owns those numbers: the documents carry markers, and the value
 * between them is generated from `tools/lib/inventory.mjs`.
 *
 *   node tools/stamp.mjs            rewrite the documents in place
 *   node tools/stamp.mjs --check    fail if a document has drifted   (CI)
 *   node tools/stamp.mjs --json     print the figures, for other gates
 *
 * Three forms of replacement, because documents differ in what they may carry:
 *
 *   `<!-- ds:key -->value<!-- /ds:key -->`   in prose; invisible when rendered
 *   an anchored rewrite (REWRITES)           for machine-facing files that must
 *                                            not carry comments, pinned to a
 *                                            narrow phrase rather than a sentence
 *   a front-matter path (FRONT_MATTER)       for YAML, where `<!-- -->` is not
 *                                            legal syntax at all
 *
 * plus the `<meta name="description">` content, regenerated whole from a
 * template, because an HTML comment inside an attribute would be printed.
 *
 * `--check` is the gate, and it is the same function as the write, so a
 * document cannot be correct at write time and wrong at check time.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { inventory } from "./lib/inventory.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

const inv = inventory();

/**
 * Figures that could not be computed. Populated while FIGURES is built, so it
 * must exist before that object literal runs, and surfaced by every mode — a
 * mode that exits 0 while an ambiguity is pending would report green over a
 * number it did not actually resolve.
 */
const PROBLEMS = [];

const FIGURES = {
  components: String(inv.components.count),
  tokens: String(inv.tokens.unique),
  declarations: String(inv.tokens.declarations),
  "tokens-read": String(inv.tokens.readCount),
  "tokens-unread": String(inv.tokens.unreadCount),
  specCount: String(inv.components.specCount),
  noSpecimen: String(inv.components.noSpecimen.length),
  "components-line": `${inv.components.count} components, ${inv.tokens.unique} design tokens`,
  // Counted from AGENTS.md itself, because "contains ten rules" was already
  // stale there by one: the file had grown an eleventh rule.
  "agents-rules": agentsRules(),
};

/**
 * How many numbered rules `AGENTS.md` states. Read from the document, because
 * the figure is quoted in prose and a hand-copied count drifts the moment a
 * rule is added — which is exactly what had happened to `DESIGN.md`.
 */
function agentsRules() {
  const agents = readFileSync(join(ROOT, "AGENTS.md"), "utf8");
  const headings = [...agents.matchAll(/^### (\d+)\./gm)].map((m) => Number(m[1]));
  if (headings.length === 0) {
    PROBLEMS.push("found no numbered rules in AGENTS.md — the rule-count figure cannot be computed");
    return "0";
  }
  // The count of headings is the claim ("contains N rules"). The highest number
  // equals it only while the rules run 1..N, so a gap — a rule deleted without
  // renumbering — is reported rather than being papered over by trusting one
  // figure or the other.
  const max = Math.max(...headings);
  if (max !== headings.length) {
    PROBLEMS.push(`AGENTS.md numbers its rules up to ${max} but states ${headings.length} of them — renumber, or the published count is ambiguous`);
  }
  return String(headings.length);
}
/** Prose each taxonomy group covers. The numbers are computed; this is copy. */
const COVERS = {
  "Colour ramps": "`--basalt-…`, `--tidal-…`, `--lumen-…`, `--plasma-…`, `--sol-…`, `--clay-…`",
  "Brand ramp": "`--brand-hue` and the ramp derived from it",
  "Semantic colours": "`--color-…` — text, surface, border, primary; every one `light-dark()`",
  Chart: "categorical, sequential, diverging, dash patterns, chart chrome",
  "Fill patterns": "`--fill-hatch-…`, `--fill-dot` — the shape branch of a filled mark",
  Gradients: "canvas, plate, heat, rule",
  Typography: "families, sizes, weights, leading, tracking, measures",
  "Space and layout": "the 4 px scale, containers, gutter, header height, target sizes",
  Shape: "radii, borders, hairline, shadows, elevation",
  Motion: "durations and easings",
  "Z-index": "`--z-raised` … `--z-tooltip`",
  Density: "row height, cell padding, label size",
  Focus: "the focus ring perimeter",
  Miscellaneous: "no documented prefix — fix the taxonomy",
};

const readCount = (group) => group.list.filter((n) => inv.tokens.census[n].total > 0).length;

/**
 * The token taxonomy table, generated so its rows must sum to the real count.
 * The hand-kept version of this table was ten tokens short of the file it
 * described, which is the whole argument for generating it.
 */
function taxonomyTable() {
  const rows = inv.tokens.groups
    .filter((g) => g.count > 0)
    .map((g) => {
      const read = readCount(g);
      const unread = g.count - read;
      return `| ${g.label} | ${g.count} | ${read} | ${unread === 0 ? "—" : unread} | ${COVERS[g.label] ?? "—"} |`;
    });
  return [
    "| Group | Count | Read | Unread | Covers |",
    "|---|---|---|---|---|",
    ...rows,
    `| **Total** | **${inv.tokens.unique}** | **${inv.tokens.readCount}** | **${inv.tokens.unreadCount}** | unique custom properties in \`src/css/tokens.css\` |`,
  ].join("\n");
}

FIGURES["taxonomy-table"] = taxonomyTable();

const DESCRIPTION = `Contour is a token-driven design system for spatial interfaces. Dark and light themes, ${FIGURES.components} components, ${FIGURES.tokens} design tokens, zero runtime dependencies.`;

/**
 * Anchored prose rewrites, for the documents that must not carry markers.
 *
 * `llms.txt` is read by machines and `DESIGN.md`'s numbers live in YAML front
 * matter, where an HTML comment is not legal syntax. So these match a narrow
 * span around the number rather than wrapping it in markers.
 *
 * Each is deliberately tight — one number, one phrase — because a rewrite that
 * owns a whole sentence owns its author's prose, and would overwrite any
 * rewording they later make.
 *
 * `required` is the point of the mechanism. The marker pass silently skips a
 * file with no markers in it, which is how `stamp --check` came to pass over
 * `llms.txt` and `DESIGN.md` while both still published 83 and 260: a green
 * check that never looked at the document. A pattern listed here that matches
 * nothing is an error, not a no-op.
 */
const REWRITES = [
  {
    file: "llms.txt",
    label: "headline counts",
    re: /(Dark and light themes, )\d+ components, \d+ design tokens(?: \(\d+[^)]*\))?/,
    to: (_m, head) =>
      `${head}${FIGURES.components} components, ${FIGURES.tokens} design tokens (${FIGURES["tokens-read"]} read, ${FIGURES["tokens-unread"]} unread)`,
  },
  {
    file: "llms.txt",
    label: "components heading",
    re: /^## Components \(\d+ blocks in src\/css\/\)$/m,
    to: () => `## Components (${FIGURES.components} blocks in src/css/)`,
  },
  {
    file: "llms.txt",
    label: "token layer count",
    re: /^- \d+ custom properties in the token layer/m,
    to: () => `- ${FIGURES.tokens} custom properties in the token layer`,
  },
  {
    // DESIGN.md said "contains ten rules" while AGENTS.md had grown an
    // eleventh. Spelled-out numbers are matched as words or digits, because
    // the fix below writes digits and a later edit may not.
    file: "DESIGN.md",
    label: "AGENTS rule count",
    re: /(`AGENTS\.md` contains )\w+ rules/,
    to: (_m, head) => `${head}${FIGURES["agents-rules"]} rules`,
  },
];

/**
 * Numeric fields owned in YAML front matter, addressed by path rather than by
 * marker: `tokens: count:` is the child `count` of the `tokens` mapping, and
 * `components` is a top-level scalar.
 */
const FRONT_MATTER = [
  { file: "DESIGN.md", path: ["tokens", "count"], figure: "tokens", label: "DESIGN.md tokens.count" },
  { file: "DESIGN.md", path: ["components"], figure: "components", label: "DESIGN.md components" },
];

/**
 * Set one scalar inside a YAML front-matter block, addressed by key path.
 *
 * Only the leading `---` … `---` region is ever touched, and a nested key is
 * only replaced while the walk is inside its parent's indentation, so a `count:`
 * elsewhere in the document cannot be hit by accident.
 *
 * @returns {{ text: string, hit: boolean }}
 */
function setFrontMatter(text, path, value) {
  const fm = /^---\r?\n([\s\S]*?)(\r?\n---\s*\r?\n)/.exec(text);
  if (!fm) return { text, hit: false };
  const lines = fm[1].split(/\r?\n/);
  const leaf = path[path.length - 1];

  // Track which parents we are currently inside, by indentation.
  const stack = [];
  let hit = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const keyMatch = /^(\s*)([A-Za-z0-9_]+):(.*)$/.exec(line);
    if (!keyMatch) continue;
    const indent = keyMatch[1].length;
    const key = keyMatch[2];
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();

    if (key === leaf) {
      const wanted = path.length === 1 ? stack.length === 0 : stack.map((s) => s.key).join(".") === path.slice(0, -1).join(".");
      if (wanted) {
        lines[i] = `${keyMatch[1]}${key}: ${value}`;
        hit = true;
        break;
      }
    }
    if (keyMatch[3].trim() === "") stack.push({ key, indent });
  }
  if (!hit) return { text, hit: false };
  return { text: text.slice(0, fm.index) + `---\n${lines.join("\n")}${fm[2]}` + text.slice(fm.index + fm[0].length), hit: true };
}

const TARGETS = [
  "README.md",
  "AGENTS.md",
  "llms.txt",
  "DESIGN.md",
  "CHANGELOG.md",
  "index.html",
  "templates/landing.html",
  "templates/dashboard.html",
  "templates/documentation.html",
];

const markerRe = (key) => new RegExp(`<!-- ds:${key} -->[\\s\\S]*?<!-- /ds:${key} -->`, "g");

/**
 * Apply every substitution to one document.
 * @param {string} name
 * @param {string} text
 * @returns {{ text: string, changes: string[] }}
 */
function stamp(name, text) {
  const changes = [];
  const misses = [];
  let out = text;

  for (const [key, value] of Object.entries(FIGURES)) {
    out = out.replace(markerRe(key), (whole) => {
      const next = `<!-- ds:${key} -->${value}<!-- /ds:${key} -->`;
      if (next !== whole) changes.push(`${name}: ${key}`);
      return next;
    });
  }

  if (name === "index.html") {
    out = out.replace(/(<meta name="description" content=")[^"]*(")/, (whole, head, tail) => {
      const next = `${head}${DESCRIPTION}${tail}`;
      if (next !== whole) changes.push(`${name}: meta description`);
      return next;
    });
  }

  for (const r of REWRITES) {
    if (r.file !== name) continue;
    let fired = false;
    out = out.replace(r.re, (...args) => {
      fired = true;
      const next = r.to(...args);
      if (next !== args[0]) changes.push(`${name}: ${r.label}`);
      return next;
    });
    // A declared rewrite that matches nothing means the sentence it was pinned
    // to has been reworded or moved. Say so, or the number goes unowned again
    // with a green check — which is the exact bug this pass exists to close.
    if (!fired) misses.push(`${name}: ${r.label} — pattern found no match`);
  }

  for (const f of FRONT_MATTER) {
    if (f.file !== name) continue;
    const before = out;
    const { text: next, hit } = setFrontMatter(out, f.path, FIGURES[f.figure]);
    if (!hit) {
      misses.push(`${name}: ${f.label} — front-matter path not found`);
      continue;
    }
    if (next !== before) changes.push(f.label);
    out = next;
  }

  return { text: out, changes, misses };
}

/** Files the marker pass alone would never visit, because they hold no markers. */
function ownedByRewrite(name) {
  return REWRITES.some((r) => r.file === name) || FRONT_MATTER.some((f) => f.file === name);
}

function main() {
  const args = process.argv.slice(2);

  // First, in every mode: a figure that could not be resolved makes any output
  // untrustworthy, including --json for other gates and --check in CI.
  if (PROBLEMS.length) {
    console.error(`stamp: ${PROBLEMS.length} figure(s) could not be resolved from the source:`);
    for (const p of PROBLEMS) console.error("  " + p);
    return 1;
  }

  if (args.includes("--json")) {
    console.log(JSON.stringify({ figures: FIGURES, description: DESCRIPTION, unread: inv.tokens.unread }, null, 2));
    return 0;
  }

  const check = args.includes("--check");
  const allChanges = [];
  const allMisses = [];

  // Fact check (T-128): README API list must match window.Contour members.
  const dsSource = readFileSync(join(ROOT, "src/js/ds.js"), "utf8");
  const memberMatch = dsSource.match(/window\.Contour\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/);
  // Only top-level keys (depth 0 inside the freeze object).
  const members = [];
  if (memberMatch) {
    let depth = 0;
    let buf = "";
    for (const ch of memberMatch[1]) {
      if (ch === "{") { depth++; buf += ch; }
      else if (ch === "}") { depth--; buf += ch; }
      else if (ch === "," && depth === 0) {
        const m = buf.trim().match(/^(\w+)\s*:/);
        if (m && m[1] !== "__loaded") members.push(m[1]);
        buf = "";
      } else { buf += ch; }
    }
    const m = buf.trim().match(/^(\w+)\s*:/);
    if (m && m[1] !== "__loaded") members.push(m[1]);
  }
  const readme = readFileSync(join(ROOT, "README.md"), "utf8");
  const readmeApi = readme.match(/API on `window\.Contour` \(([^)]*)\)/);
  if (readmeApi) {
    const listed = readmeApi[1].split(",").map((s) => s.trim().replace(/`/g, ""));
    const missing = members.filter((m) => !listed.includes(m));
    const extra = listed.filter((m) => !members.includes(m));
    if (missing.length || extra.length) {
      allMisses.push(`README.md: API list drift — missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}`);
    }
  }

  for (const name of TARGETS) {
    const path = join(ROOT, name);
    let text;
    try {
      text = readFileSync(path, "utf8");
    } catch {
      // A file named by REWRITES or FRONT_MATTER that does not exist is a miss,
      // reported after the loop; an ordinary target simply is not present.
      if (ownedByRewrite(name)) allMisses.push(`${name}: listed but not found`);
      continue;
    }
    // Skip a document with nothing to own: no markers, and no rewrite pinned to
    // it. The second half of the test is the fix — a marker-less file could
    // always slip through here unnoticed.
    if (!text.includes("<!-- ds:") && !ownedByRewrite(name)) continue;
    const { text: next, changes, misses } = stamp(name, text);
    allChanges.push(...changes);
    allMisses.push(...misses);
    if (!check && next !== text) writeFileSync(path, next, "utf8");
  }

  if (allMisses.length) {
    console.error(`stamp: ${allMisses.length} owned number(s) could not be found to write:`);
    for (const m of allMisses) console.error("  " + m);
    console.error("\nThe sentence a figure was pinned to has moved or been reworded.");
    console.error("Update tools/stamp.mjs to match it, or the number is no longer computed.");
    return 1;
  }

  if (check) {
    if (allChanges.length) {
      console.error(`stamp: ${allChanges.length} published number(s) have drifted from the source:`);
      for (const c of allChanges) console.error("  " + c);
      console.error("\nRun: node tools/stamp.mjs");
      return 1;
    }
    console.log(`stamp: every published number matches src/ (${FIGURES.components} components, ${FIGURES.tokens} tokens). OK`);
    return 0;
  }

  console.log(`stamp: rewrote ${allChanges.length} number(s)`);
  for (const c of allChanges) console.log("  " + c);
  console.log(`figures: ${FIGURES.components} components, ${FIGURES.tokens} tokens (${FIGURES["tokens-read"]} read, ${FIGURES["tokens-unread"]} unread)`);
  return 0;
}

process.exit(main());
