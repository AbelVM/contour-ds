#!/usr/bin/env node
/**
 * The docs package's guard (C-45).
 *
 *     node tools/check-docs.mjs
 *
 * Reads `dist/docs/` — the bytes a consumer actually receives — and does not take
 * `index.html` on faith for what shipped. Six things are asserted, each one a way
 * the artifact could go wrong without this file noticing:
 *
 *  1. POPULATION. The package exists, is non-empty, every index row names a file
 *     on disk and every file on disk is named by a row. A guard that reports zero
 *     problems over a directory nobody built is a green lie, so emptiness is an
 *     error here rather than a pass.
 *  2. DERIVATION. The shipped bytes equal a fresh run of the same library the
 *     build calls. That is what makes "generated, never hand-edited" a checked
 *     property instead of a sentence: a hand-edit to one `.md`, a stale `dist/`,
 *     and an emitter that drifted from its own recorded hash all land here.
 *  3. VERBATIM PROSE. Every paragraph under "What the guide says" is a substring of
 *     the guide's own text. The generator is not allowed a sentence of its own —
 *     and the check reports how many paragraphs it compared, because a comparison
 *     that silently matched nothing would pass forever.
 *  4. CORRESPONDENCE. Every block a doc presents as part of the system resolves in
 *     `dist/contour.components.json`, and every class filed under "not the system"
 *     must genuinely be absent from it. The other direction is published rather
 *     than asserted away: `coverage.notNamedByAnySection` names the blocks no
 *     section documents, so that set cannot grow quietly.
 *  5. HONEST SUMMARY. `counts` and `coverage` agree with the arrays and the file
 *     text they summarize, both directions, and the two coverage halves sum to the
 *     whole contract.
 *  6. BOUNDARY. No URL, no markup, no CSS declaration, no guide asset path. The
 *     project is private until v1.0, so a link inside an installed package would
 *     instruct a reader to fetch a page that 404s; and `docs/` is prose, not a
 *     second copy of the specimen layer.
 *
 * The rail is read as data, never trusted: a section the rail does not link is
 * recorded in `missingRail` and says so in its own file. `#field` — this system's
 * differentiator — is precisely such a section.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buildDocs, guideProse, guideProvenance, readGuide, stampTables } from "./lib/docs.mjs";
import { inventory } from "./lib/inventory.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const DIST = join(ROOT, "dist");
const DOCS = join(DIST, "docs");
const errors = [];
const squash = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

/** The system-block list of a doc: the bullets under its own heading. */
const systemNames = (t) => {
  const seg = t.split("## Blocks documented here")[1]?.split("### Defined by the guide, not the system")[0] ?? "";
  return [...new Set([...seg.matchAll(/^- `\.(c-[a-z0-9-]+)`$/gm)].map((m) => m[1]))];
};
/** The guide-only list, which lives in the heading after it and means the opposite. */
const guideOnlyNames = (t) => {
  const seg = t.split("### Defined by the guide, not the system")[1]?.split(/^## /m)[0] ?? "";
  return [...new Set([...seg.matchAll(/^- `\.(c-[a-z0-9-]+)`$/gm)].map((m) => m[1]))];
};
const RAIL_HEADING = "## Not in the contents rail";

// -- Without these there is nothing to check, and "nothing to check" must not
//    be the same exit as "everything holds". ---------------------------------
for (const required of ["docs/index.json", "contour.components.json", "build-manifest.json"]) {
  if (!existsSync(join(DIST, required))) errors.push(`missing dist/${required} — run \`node tools/build.mjs\` before this gate`);
}
if (errors.length) {
  for (const e of errors) console.error("check-docs: " + e);
  process.exit(1);
}

const indexRaw = readFileSync(join(DOCS, "index.json"), "utf8");
const index = JSON.parse(indexRaw);
const rows = Array.isArray(index.sections) ? index.sections : [];
const mdFiles = readdirSync(DOCS).filter((f) => f.endsWith(".md")).sort();
const bodies = new Map(mdFiles.map((f) => [f, readFileSync(join(DOCS, f), "utf8")]));

// -- 1. population, both directions ------------------------------------------
if (!rows.length) errors.push("dist/docs/index.json names no section: an empty index documents nothing and passes every loop below by running zero times");
if (!mdFiles.length) errors.push("dist/docs/ holds no markdown file");
for (const r of rows) {
  const rel = r.file.replace(/^docs\//, "");
  if (!bodies.has(rel)) errors.push(`index row for #${r.id} names ${r.file}, which is not on disk`);
}
for (const f of mdFiles) {
  if (!rows.some((r) => r.file.endsWith(f))) errors.push(`docs/${f} is on disk but named by no index row — an artifact nothing points at`);
}

// -- 2. the shipped bytes are a derivation of the current source --------------
const guide = guideProvenance(ROOT);
const inv = inventory();
const freshStamp = stampTables(ROOT);
const fresh = buildDocs(readGuide(guide.source), inv, guide.src, freshStamp);
let compared = 0;
if (indexRaw !== `${JSON.stringify(fresh.index, null, 2)}\n`) {
  errors.push("dist/docs/index.json is not what the current index.html produces — hand-edited, or dist/ is stale. Run: node tools/build.mjs");
}
compared += 1;
for (const [f, t] of bodies) {
  compared += 1;
  const want = fresh.files[`docs/${f}`];
  if (want === undefined) errors.push(`docs/${f} is not produced by the generator at all`);
  else if (want !== t) errors.push(`docs/${f} differs from a fresh derivation — hand-edited, or dist/ is stale`);
}

// -- 3. every paragraph is the guide's own sentence ---------------------------
const prose = guideProse(guide.source);
let paragraphs = 0;
for (const [f, t] of bodies) {
  const seg = t.split("## What the guide says")[1]?.split(/^## /m)[0] ?? "";
  for (const p of seg.split("\n").map((s) => s.trim()).filter((s) => s.length > 1)) {
    paragraphs += 1;
    if (!prose.includes(squash(p))) errors.push(`docs/${f} carries a sentence the guide does not say: "${squash(p).slice(0, 80)}"`);
  }
}
if (!paragraphs) errors.push("no paragraph in the whole package was compared against the guide — the verbatim rule is not being exercised");

// -- 4. correspondence with the component contract ----------------------------
const contract = JSON.parse(readFileSync(join(DIST, "contour.components.json"), "utf8"));
const contractNames = new Set(contract.blocks.map((b) => b.name));
const sysAll = new Set();
const onlyAll = new Set();
for (const [f, t] of bodies) {
  for (const n of systemNames(t)) {
    sysAll.add(n);
    if (!contractNames.has(n)) errors.push(`docs/${f} presents .${n} as part of the system; contour.components.json does not define it`);
  }
  for (const n of guideOnlyNames(t)) {
    onlyAll.add(n);
    if (contractNames.has(n)) errors.push(`docs/${f} files .${n} under "not the system", but the contract defines it`);
  }
  // A doc that shows nothing must say so, rather than print an empty heading.
  if (!systemNames(t).length && !guideOnlyNames(t).length && t.includes("## Blocks documented here")) {
    errors.push(`docs/${f} has a blocks heading with no list and no "No block of the system is shown here"`);
  }
}

const cov = index.coverage ?? {};
if (cov.contractBlocks !== contractNames.size) errors.push(`coverage.contractBlocks ${cov.contractBlocks} != ${contractNames.size} blocks in the shipped contract`);
if (cov.namedBySections !== sysAll.size) errors.push(`coverage.namedBySections ${cov.namedBySections} != ${sysAll.size} distinct blocks named by the docs`);
if (cov.contractBlocks !== cov.namedBySections + (cov.notNamedByAnySection?.length ?? -1)) {
  errors.push(`coverage does not account for itself: ${cov.namedBySections} named + ${cov.notNamedByAnySection?.length} not named != ${cov.contractBlocks} in the contract`);
}
const wantGap = [...contractNames].filter((n) => !sysAll.has(n)).sort();
const gotGap = [...(cov.notNamedByAnySection ?? [])];
if (gotGap.join(",") !== wantGap.join(",")) errors.push(`coverage.notNamedByAnySection is ${gotGap.join(", ") || "(none)"} but the docs name a different set: ${wantGap.join(", ") || "(none)"}`);

// -- 4b. the census table the index carries -----------------------------------
// Two questions, and only the second is answered by byte equality. Is the shipped
// table still the one `tools/stamp.mjs` computes? And does that table tell the
// truth about the token layer it is a census *of*? The Total row is reconciled
// against the inventory, and the group rows against their own total — the same
// arithmetic stamp enforces when it rewrites a document, re-checked here on the
// bytes a consumer reads, because the docs are now a publisher of this table too.
const tables = index.tables ?? {};
if (!Object.keys(tables).length) {
  errors.push("dist/docs/index.json carries no table: the docs are meant to publish the census, and an index that silently dropped one reports a thinner package instead of a broken one");
}
for (const [name, body] of Object.entries(tables)) {
  if (typeof body !== "string" || !body.includes("\n|")) {
    errors.push(`index.tables["${name}"] is not a markdown table`);
    continue;
  }
  if (body !== freshStamp.tables[name]) errors.push(`index.tables["${name}"] is not the table tools/stamp.mjs computes today`);
  const rows = body.split("\n").filter((l) => l.startsWith("|"));
  const cell = (row, i) => String(row.split("|")[i] ?? "").replace(/\*\*/g, "").trim();
  const num = (v) => (v === "—" || v === "" ? 0 : Number(v));
  const totalRow = rows.find((l) => l.includes("**Total**"));
  const groupRows = rows.filter((l) => !l.includes("**Total**") && !l.startsWith("| Group") && !l.startsWith("|---"));
  if (!totalRow) { errors.push(`index.tables["${name}"] has no Total row, so nothing can be reconciled`); continue; }
  if (!groupRows.length) { errors.push(`index.tables["${name}"] has a Total row and no groups to sum — a table with one row proves nothing`); continue; }
  const count = num(cell(totalRow, 2));
  const read = num(cell(totalRow, 3));
  const unread = num(cell(totalRow, 4));
  if ([count, read, unread].some(Number.isNaN)) errors.push(`index.tables["${name}"] has a non-numeric Total row: ${totalRow}`);
  else {
    if (count !== inv.tokens.unique) errors.push(`the docs' census totals ${count} unique properties; the inventory counts ${inv.tokens.unique}`);
    if (read !== inv.tokens.readCount) errors.push(`the docs' census says ${read} properties are read; the inventory counts ${inv.tokens.readCount}`);
    if (unread !== inv.tokens.unreadCount) errors.push(`the docs' census says ${unread} properties are unread; the inventory counts ${inv.tokens.unreadCount}`);
    const sum = groupRows.reduce((a, l) => a + num(cell(l, 2)), 0);
    if (sum !== count) errors.push(`the docs' census rows sum to ${sum} across ${groupRows.length} groups but its own Total says ${count}`);
  }
}

// -- 5. the summary agrees with what it summarizes ----------------------------
const c = index.counts ?? {};
if (c.sections !== rows.length) errors.push(`counts.sections ${c.sections} != ${rows.length} rows`);
if (c.inRail !== rows.filter((r) => r.inRail).length) errors.push(`counts.inRail ${c.inRail} != ${rows.filter((r) => r.inRail).length} rows marked in the rail`);
if (c.titled !== rows.filter((r) => r.title).length) errors.push(`counts.titled ${c.titled} != ${rows.filter((r) => r.title).length} rows with a title`);
if (c.blocksReferenced !== sysAll.size) errors.push(`counts.blocksReferenced ${c.blocksReferenced} != ${sysAll.size} distinct system blocks named in the files`);
if (c.guideOnlyClasses !== onlyAll.size) errors.push(`counts.guideOnlyClasses ${c.guideOnlyClasses} != ${onlyAll.size} classes filed as guide-only in the files`);

const wantMissing = rows.filter((r) => !r.inRail).map((r) => r.id);
if ((index.missingRail ?? []).join(",") !== wantMissing.join(",")) {
  errors.push(`missingRail ${(index.missingRail ?? []).join(", ") || "(none)"} != the rows whose inRail is false: ${wantMissing.join(", ") || "(none)"}`);
}
for (const r of rows) {
  const t = bodies.get(r.file.replace(/^docs\//, ""));
  if (!t) continue;
  if (!r.inRail && !t.includes(RAIL_HEADING)) errors.push(`docs/${r.file} covers a section outside the rail but never says so — a reader would assume it is reachable`);
  if (r.inRail && t.includes(RAIL_HEADING)) errors.push(`docs/${r.file} claims #${r.id} is outside the rail, and the rail links it`);
}

// Every file must bind itself to the source it came from, or a doc swapped in
// from another build would sit here unmarked.
for (const [f, t] of bodies) {
  if (!t.includes(index.sourceSha256)) errors.push(`docs/${f} does not carry the source hash ${index.sourceSha256} that index.json records`);
}
if (index.sourceSha256 !== guide.src.sha256) errors.push(`index.sourceSha256 ${index.sourceSha256} != the current index.html hash ${guide.src.sha256}`);

// The date is git's, not the build's. C-45 asks for a git-derived lastUpdated, and
// the difference matters: a generation timestamp would move every shipped byte on
// every rebuild, so the artifact carries the commit date of the file it came from
// and the gate re-reads that record rather than trusting the field. `null` is an
// honest answer for an extracted tarball; an invented date is not.
if (index.lastUpdated !== guide.src.fileLastChanged) {
  errors.push(`index.lastUpdated ${JSON.stringify(index.lastUpdated)} != the date git records for index.html (${JSON.stringify(guide.src.fileLastChanged)})`);
}
if (index.lastUpdated) {
  for (const [f, t] of bodies) {
    if (!t.includes(index.lastUpdated)) errors.push(`docs/${f} does not carry the git-derived lastUpdated that index.json publishes`);
  }
}

// -- 6. the package's boundary ------------------------------------------------
// Applied to the markdown in full, and to the index without the CSS shape: JSON
// braces are structural, so a rule meant to catch a stylesheet has nothing to
// mean there. The URL and asset rules do apply to both.
const URL_SHAPES = { "a URL": /https?:\/\/\S+/i, "a www. host": /\bwww\./i, "a mail address": /mailto:/i };
const GUIDE_SHAPES = {
  ...URL_SHAPES,
  "markup": /<[a-zA-Z/!][^>]*>/,
  "an HTML attribute": /class\s*=\s*"/,
  "an inline style": /style\s*=\s*"/,
  // Two halves, because a copy-paste arrives in more than one shape. The earlier
  // single pattern demanded a leading `{` or `;`, so a bare `color: var(--x);`
  // line — the commonest thing to fall out of a stylesheet — passed it, which a
  // falsification run caught. Both were measured at zero occurrences on the
  // shipped bytes before being adopted, so this is a tightening that stays exact
  // rather than a rule loosened until the build went green.
  "a CSS declaration": /^[ \t]*[-a-z]+[ \t]*:[ \t]*[^;\n]+;[ \t]*$/m,
  "a CSS rule block": /\{[^}]*:[^}]*\}/,
  "a guide asset": /(?:^|[\s(`])assets\//,
  "an SVG reference": /\.svg\b/,
};
let scanned = 0;
for (const [f, t] of bodies) {
  scanned += 1;
  for (const [what, re] of Object.entries(GUIDE_SHAPES)) {
    const hit = t.match(re);
    if (hit) errors.push(`docs/${f} contains ${what} ("${hit[0].slice(0, 60)}") — the docs are prose and pointers, not the specimen layer`);
  }
}
scanned += 1;
for (const [what, re] of Object.entries(URL_SHAPES)) {
  const hit = indexRaw.match(re);
  if (hit) errors.push(`docs/index.json contains ${what} ("${hit[0].slice(0, 60)}") — the project is private until v1.0, so an installed package must not point at a page that 404s`);
}

// The docs' own pointers must resolve inside the package.
for (const [kind, rel] of Object.entries(index.contracts ?? {})) {
  if (!existsSync(join(DOCS, rel))) errors.push(`index.contracts.${kind} points at ${rel}, which is not in the shipped package`);
}

// -- report -------------------------------------------------------------------
if (errors.length) {
  console.error(`check-docs: ${errors.length} problem(s) in dist/docs/`);
  for (const e of errors.slice(0, 25)) console.error("  - " + e);
  if (errors.length > 25) console.error(`  ... and ${errors.length - 25} more`);
  process.exit(1);
}
console.log(
  `check-docs: ${compared} shipped files re-derived byte for byte from index.html @ ${index.sourceSha256}; ` +
    `${paragraphs} paragraphs compared against the guide's own prose and every one of them is the guide's; ` +
    `${sysAll.size} system blocks + ${onlyAll.size} guide-only class(es) named and resolved against the contract; ` +
    `${cov.namedBySections}/${cov.contractBlocks} contract blocks documented, the ${wantGap.length} that are not listed by name in the index; ` +
    `${scanned} files scanned for URL/markup/CSS/asset shapes and none found (the scan is what makes that zero mean something). OK`,
);
