/**
 * The docs package (C-45): `dist/docs/`, generated from the style guide.
 *
 * Why a machine copy of the docs exists at all. `index.html` is the best human
 * artifact the project has and a poor machine one: 573.9 kB of specimens, CSS and
 * script around prose an agent has to dig out. Publishing a small per-section
 * file plus one index means an agent that installs the package reads the
 * documentation it was shipped, in the version it installed — which is the trick
 * Next.js uses for docs in `node_modules`.
 *
 * Three rules this generator obeys, each one learned as a defect here:
 *
 *  - **Nothing is authored here.** Every sentence in a doc is the guide's own
 *    prose, lifted from its DOM; every number is counted from
 *    `tools/lib/inventory.mjs`. A description this file wrote would be a claim
 *    with no author and no gate, which is how `--color-panel` came to be
 *    published as a surface nobody declared.
 *  - **No URL appears in the output.** The project is private until v1.0 and its
 *    Pages deployment answers 404, so a link out of an installed package would
 *    be an instruction to fetch something that does not resolve. Provenance is
 *    therefore a path, a content hash, and what git actually recorded — not a
 *    site.
 *  - **A doc points at the contracts, it does not restate them.** The block
 *    facts already ship in `contour.components.json`; inlining them per section
 *    is duplicated content wearing a size budget as a symptom.
 *
 * The HTML is read with `tools/lib/html.mjs`, the parser the guide's own snippet
 * tool uses. A second DOM walker in this repository is how `blockOf()` ended up
 * with unreachable code that hid 292 element classes behind a correct-looking
 * count of 134 blocks.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { parse, findAll, text, classes, decodeEntities } from "./html.mjs";

/**
 * Where the docs came from, computed the same way by the build and the gate.
 *
 * This lives here rather than inline in build.mjs because the gate has to rebuild
 * the same package to prove the shipped bytes are a derivation and not an edit.
 * Two recipes for one hash is how a guard starts failing on a file that is
 * actually current — or, worse, passes on one that isn't.
 *
 * No URL: the project is private until v1.0, so an installed package must not
 * tell a reader to fetch a page that does not resolve.
 */
export function guideProvenance(root) {
  const source = readFileSync(join(root, "index.html"), "utf8");
  let fileLastChanged = null;
  try {
    fileLastChanged = execFileSync("git", ["log", "-1", "--format=%cI", "--", "index.html"], { cwd: root, encoding: "utf8" }).trim() || null;
  } catch {
    // No git (an extracted tarball, a machine without it): the artifact says the
    // date is unknown rather than inventing one or failing the build.
    fileLastChanged = null;
  }
  return {
    source,
    src: { file: "index.html", sha256: createHash("sha256").update(source).digest("hex").slice(0, 16), fileLastChanged },
  };
}

/** What a doc says about its own origin, as far as it can honestly say. */
export function provenance({ file, sha256, fileLastChanged }) {
  return { file, sha256, fileLastChanged, generatedBy: "tools/build.mjs, from index.html" };
}

/**
 * The tables `tools/stamp.mjs` already computes, taken from stamp itself.
 *
 * C-45 asks the docs to carry the census table, and the rule that matters most
 * here is that the docs must not compute it again: this repository has already
 * been bitten by a second parser inventing its own count of something the
 * inventory owns. `stamp.mjs` cannot be imported — its module body ends in
 * `process.exit(main())`, so importing it would run the document-rewriting pass
 * inside the build and then kill the process. Its `--json` path returns before
 * any rewrite, so stamp is invoked as a subprocess instead. That is the shape
 * `tools/audit/dtcg-contract.mjs` already uses to reach dembrandt: reuse the
 * computation, do not duplicate the recipe.
 *
 * @returns {{ figures: Record<string, unknown>, tables: Record<string, string> }}
 */
export function stampTables(root) {
  let payload;
  try {
    payload = JSON.parse(execFileSync("node", ["tools/stamp.mjs", "--json"], { cwd: root, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }));
  } catch (e) {
    // stamp exits non-zero when a figure cannot be resolved from the source. The
    // docs must not paper over that with an empty table: a missing census reads
    // as "this package has none" and nobody asks why it was withheld.
    throw new Error(`the docs package needs tools/stamp.mjs --json: ${String(e.message).split("\n")[0]}`);
  }
  const figures = payload.figures ?? {};
  const tables = {};
  // Only the tables. The scalar figures are already published by the contracts the
  // docs point at, and restating a number in a second file is how a document
  // starts disagreeing with itself.
  for (const [key, value] of Object.entries(figures)) {
    if (typeof value === "string" && value.startsWith("|") && value.includes("\n|")) tables[key] = value;
  }
  if (!Object.keys(tables).length) throw new Error("tools/stamp.mjs --json returned no table — the census would be silently absent from dist/docs/");
  return { figures, tables };
}

const squash = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

/**
 * The guide as plain prose, using the ONE reduction that reproduces what the DOM
 * reports. Chosen by measurement, not by reasoning about serialization: raw bytes
 * left 24 of 187 paragraphs unexplained (the parser decodes `&amp;` that the
 * source escapes), and stripping tags with a space left 8 (`a<b>B</b>c` reads as
 * "aBc" in the DOM, never "a B c"). Stripping tags with nothing explains all 187
 * while still refusing an invented sentence and a one-word twist of a real one —
 * so the rule is exact, not merely loosened until it passes.
 *
 * Order matters: tags are removed from the SOURCE before decoding, so a literal
 * `&lt;div&gt;` in prose survives as text instead of being eaten as markup.
 * Decoding goes through html.mjs's own decoder — the one the parser uses — because
 * a second entity table is how the gate and the build stop agreeing about what the
 * guide says.
 */
export function guideProse(source) {
  return squash(decodeEntities(source.replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]*>/g, "")));
}

/**
 * The guide's sections, in document order, as the docs index must list them.
 *
 * The rail is read alongside them rather than trusted: `#field` was added to the
 * guide with the marker `13b` and no rail entry, so an index built from the rail
 * alone would silently omit the section that is this system's differentiator.
 * The gate is what turns that observation into something that cannot persist.
 */
export function readGuide(source) {
  const tree = parse(source);
  const sections = findAll(tree, (n) => n.name === "section" && n.attrs.id);

  const railLinks = [];
  for (const nav of findAll(tree, (n) => n.name === "nav" && classes(n).includes("ds-rail__list"))) {
    for (const a of findAll(nav, (n) => n.name === "a" && (n.attrs.href ?? "").startsWith("#"))) {
      const num = findAll(a, (n) => classes(n).includes("ds-rail__num"))[0];
      // Guarded: text() of an absent node is not a string, and a rail entry added
      // without its number span would otherwise throw inside the build.
      const number = num ? squash(text(num)) : "";
      const full = squash(text(a));
      railLinks.push({ id: a.attrs.href.slice(1), number, label: number ? full.replace(number, "").trim() : full });
    }
  }
  const railById = new Map(railLinks.map((r) => [r.id, r]));

  const markers = [...source.matchAll(/<!--\s*=+\s*([0-9]+[a-z]?)\s*·\s*(.+?)\s*=+\s*-->/g)].map((m) => ({ number: m[1], label: squash(m[2]) }));
  const markerBefore = new Map();
  for (const s of sections) {
    const at = source.indexOf(`id="${s.attrs.id}"`);
    let best = null;
    for (const m of source.matchAll(/<!--\s*=+\s*([0-9]+[a-z]?)\s*·\s*(.+?)\s*=+\s*-->/g)) {
      if (m.index < at) best = { number: m[1], label: squash(m[2]) };
      else break;
    }
    markerBefore.set(s.attrs.id, best);
  }

  const out = sections.map((s, order) => {
    const id = s.attrs.id;
    const h2 = findAll(s, (n) => n.name === "h2")[0];
    // Prose only, and only outside a specimen: the guide's own `<pre>` blocks are
    // copy targets for consumers, and lifting them into prose would have the docs
    // quote markup as if it explained something.
    const prose = findAll(s, (n) => n.name === "p")
      .filter((p) => !findAll(p, (n) => n.name === "code" && classes(p).some((c) => c.startsWith("ds-"))).length)
      .map((p) => squash(text(p)))
      .filter((t) => t.length > 1);
    const subsections = findAll(s, (n) => n.name === "h3").map((h) => squash(text(h))).filter(Boolean);
    const blocks = [...new Set(
      findAll(s, (n) => n.attrs.class)
        .flatMap((n) => classes(n).filter((c) => /^c-[a-z0-9-]+$/.test(c)))
        .map((c) => c.replace(/__.*$/, "").replace(/--.*$/, "")),
    )].sort();

    return {
      id,
      order,
      title: h2 ? squash(text(h2)) : null,
      marker: markerBefore.get(id) ?? null,
      rail: railById.get(id) ?? null,
      railOrder: railLinks.findIndex((r) => r.id === id),
      prose,
      subsections,
      blocks,
    };
  });

  return { sections: out, rail: railLinks, markerCount: markers.length };
}

/**
 * The docs package: one markdown file per guide section, plus the index.
 *
 * @param {ReturnType<typeof readGuide>} guide
 * @param {ReturnType<import('./inventory.mjs').inventory>} inv
 * @param {{ file: string, sha256: string, fileLastChanged: string|null }} src
 * @param {ReturnType<typeof stampTables>} stamp the tables stamp already computes
 */
export function buildDocs(guide, inv, src, stamp) {
  // Required, not optional. C-45's deliverable is a docs package that carries the
  // census; an absent `stamp` would quietly produce an index with no table, and a
  // missing table reads as "this system has none" rather than as a broken build.
  if (!stamp || !stamp.tables || !Object.keys(stamp.tables).length) {
    throw new Error("buildDocs() needs stampTables(root): the census table is a deliverable of the docs package, not an optional extra");
  }
  const contract = new Map(inv.components.names.map((n) => [n, inv.components.rules[n]]));
  const files = {};

  // Filtered ONCE, here, so the per-file lists and index.counts cannot disagree.
  // The previous version rebuilt each section inside the loop, which left
  // `blocksReferenced` still counting `.c-cursor-demo` — a class only the guide
  // defines — while the file beside it correctly said the block is not in the
  // contract. An artifact that contradicts itself is worse than a thin one.
  const sections = guide.sections.map((s) => ({
    ...s,
    blocks: s.blocks.filter((b) => contract.has(b)),
    guideOnly: s.blocks.filter((b) => !contract.has(b)),
  }));

  const rows = sections.map((s, i) => {
    const marker = s.marker?.number ?? "(no marker)";
    const lines = [
      `# ${s.title ?? s.id}`,
      "",
      `Section \`${s.id}\` — marker \`${marker}\`, position ${i + 1} of ${guide.sections.length} in the guide.`,
      "Generated from `index.html`; prose quoted, counts from the inventory, no URL (the project is",
      "private until v1.0). See `index.json` for the whole set and the shared statement.",
      "",
    ];

    if (s.prose.length) {
      lines.push("## What the guide says", "");
      for (const p of s.prose) lines.push(p, "");
    }
    if (s.subsections.length) {
      lines.push("## Subsections", "");
      for (const h of s.subsections) lines.push(`- ${h}`);
      lines.push("");
    }
    // The guide-only list must come from the field buildDocs already computed. It
    // used to be re-derived from s.blocks, which the filter above had already
    // reduced to contract members — so guideOnly was empty by construction, the
    // heading never printed, and index.json still counted the class. An artifact
    // whose summary and body disagree is worse than a thin one, and no file ever
    // named `.c-cursor-demo` even though the index said one was hidden.
    if (s.blocks.length || s.guideOnly.length) {
      lines.push("## Blocks documented here", "");
      // Names only. The element/variant/state counts already ship in
      // contour.components.json; repeating them per section is what doubled the
      // docs' byte cost while adding no fact.
      if (s.blocks.length) {
        lines.push(`${s.blocks.length} block(s). Their facts live in \`../contour.components.json\`;`,
          "only the names are here, because the same figure in two files is how a document",
          "starts disagreeing with itself.", "");
        for (const b of s.blocks) lines.push(`- \`.${b}\``);
        lines.push("");
      } else {
        lines.push("No block of the system is shown here.", "");
      }
      if (s.guideOnly.length) {
        lines.push("### Defined by the guide, not the system", "",
          "These appear in the specimen markup and in no sheet under `src/css`, so they are not",
          "part of the component contract and nothing in an installed package defines them:", "");
        for (const b of s.guideOnly) lines.push(`- \`.${b}\``);
        lines.push("");
      }
    }
    if (!s.rail) {
      lines.push("## Not in the contents rail", "", `The guide's rail does not link \`#${s.id}\`, so a reader who navigates by`,
        "the rail never reaches this section. The rail is the guide's table of contents; a section",
        "outside it is undocumented by the thing meant to document it.", "");
    }

    // Provenance in one line per file: the shared statement, the contracts and the
    // source hash live in index.json, and repeating four bullets 23 times made
    // boilerplate the biggest part of the docs package.
    lines.push("---", "",
      `Source \`${src.file}\` @ \`${src.sha256}\` · last committed ${src.fileLastChanged ?? "unknown (no git history)"} · no URL: the project is private until v1.0.`, "");
    const name = `docs/${s.id}.md`;
    files[name] = lines.join("\n");
    return { id: s.id, title: s.title, marker, file: name, blocks: s.blocks.length, inRail: Boolean(s.rail) };
  });

  const missingRail = rows.filter((r) => !r.inRail).map((r) => r.id);
  const index = {
    version: "1.0",
    source: src.file,
    sourceSha256: src.sha256,
    // Git-derived, exactly as C-45 asks, and recomputed by the gate from the same
    // recipe. `null` is a legitimate value — an extracted tarball has no history —
    // but an INVENTED date is not, which is why the artifact carries the commit
    // date of the file it was generated from rather than the moment of generation:
    // a build timestamp would make every shipped byte move on every rebuild.
    lastUpdated: src.fileLastChanged,
    generatedBy: "tools/build.mjs, from index.html",
    statement: "Machine-readable copy of the style guide's prose, generated and never hand-edited. Sections are listed in guide order; titles, prose and counts are quoted or counted, not authored. Prose is verbatim: a paragraph here is the guide's own sentence, never a sentence this generator wrote. Contains no URL: the project is private until v1.0.",
    counts: {
      sections: rows.length,
      inRail: rows.filter((r) => r.inRail).length,
      titled: rows.filter((r) => r.title).length,
      // Counted from the same filtered `sections` the files are built from, not
      // from guide.sections — otherwise the index advertises a block count that
      // includes classes only the guide defines, contradicting every file below.
      blocksReferenced: [...new Set(sections.flatMap((s) => s.blocks))].length,
      guideOnlyClasses: [...new Set(sections.flatMap((s) => s.guideOnly))].length,
    },
    sections: rows,
    coverage: {
      contractBlocks: contract.size,
      namedBySections: new Set(sections.flatMap((s) => s.blocks)).size,
      // Published, not hidden. A block the contract ships that no section names is
      // one a reader cannot learn from a section page. Measured cause, per block:
      // it is the guide's own furniture (`.c-container`, `.c-app`, `.c-box` sit
      // outside every `<section id>` subtree this index scans) or it reaches a
      // section only as escaped snippet text, so no live specimen carries the
      // class. Naming them is what lets a gate refuse to let the set grow quietly,
      // instead of trusting a coverage sentence nobody can recompute.
      notNamedByAnySection: [...contract.keys()].filter((n) => !sections.some((s) => s.blocks.includes(n))).sort(),
    },
    contracts: {
      tokens: "../contour.tokens.json",
      themes: "../contour.themes.json",
      components: "../contour.components.json",
    },
    // The tables `tools/stamp.mjs` already computes, verbatim from stamp's own
    // `--json` output rather than re-derived here. C-45 asks the docs to carry the
    // census, and the second copy of a count is the failure this repository keeps
    // paying for — so the gate does not compare the docs against a third recipe,
    // it compares them against stamp and against the inventory the table claims.
    tables: stamp.tables,
    missingRail,
  };

  return { index, files };
}
