/**
 * The inventory — the one place the system's numbers are computed.
 *
 * Every count the project publishes (components, tokens, tokens that are
 * read, the taxonomy table, specimen coverage, bytes per file) comes from
 * here, so a number in a document can no longer disagree with the source.
 *
 * The counting rules are the contract, stated once:
 *
 *   component  a distinct `.c-<block>` selector in src/css, folding the
 *              `__element` and `--variant` suffixes away. `.c-btn`,
 *              `.c-btn--primary` and `.c-btn__icon` are one component.
 *   token      a distinct custom property *declared* in src/css/tokens.css.
 *              `--brand-200`, declared in `:root` and again in `.c-theme-scope`,
 *              is one token: the scope re-derivation is the same declaration.
 *   read       a token named by a live `var()` in src/css, src/js,
 *              assets/js, index.html or templates. Comments are stripped
 *              first, so a token named only in prose is not read. A step
 *              consumed by another token inside tokens.css counts: a ramp is
 *              a vocabulary and a step that composes is doing work.
 *
 * @module
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const CSS_DIR = join(ROOT, "src/css");

const escapeRe = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

/** Comments are prose, not markup: a token named in one is not read. */
function withoutComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:"'\\])\/\/[^\n]*/g, "$1");
}

function read(...parts) {
  const path = join(ROOT, ...parts);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function cssFiles() {
  return readdirSync(CSS_DIR).filter((f) => f.endsWith(".css"));
}

/** Every `selector { body }` block, comments already gone. */
function blocks(css) {
  const source = withoutComments(css);
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = re.exec(source))) {
    const selector = match[1].trim().replace(/\s+/g, " ");
    if (!selector || selector.startsWith("@")) continue;
    out.push({ selector, body: match[2] });
  }
  return out;
}

const blockOf = (cls) => cls.replace(/__.*$/, "").replace(/--.*$/, "");

/** The source areas the census searches, keyed by the label a report prints. */
function areas() {
  const css = cssFiles()
    .map((f) => readFileSync(join(CSS_DIR, f), "utf8"))
    .join("\n");
  const templates = readdirSync(join(ROOT, "templates"))
    .filter((f) => f.endsWith(".html"))
    .map((f) => readFileSync(join(ROOT, "templates", f), "utf8"))
    .join("\n");
  return {
    "src/css": css,
    "src/js": read("src/js/ds.js"),
    "assets/js": read("assets/js/guide.js"),
    "assets/css": read("assets/css/docs.css"),
    guide: read("index.html"),
    templates,
  };
}

// First match wins, so the taxonomy sums to the total and no token is
// counted twice. The last entry is a true catch-all: a prefix nobody
// documented lands there and the reconciliation check says so out loud
// rather than dropping the token the way a guessed regex would.
const TAXONOMY = [
  ["Colour ramps", /^--(basalt|tidal|lumen|plasma|sol|clay)-/],
  ["Brand ramp", /^--brand-/],
  ["Semantic colours", /^--color-/],
  ["Chart", /^--chart-/],
  ["Fill patterns", /^--fill-/],
  ["Gradients", /^--gradient-/],
  ["Typography", /^--(font|text-size|type|weight|leading|tracking|measure)-|^--text-/],
  ["Space and layout", /^--(space|container|section|target)-|^--(gutter|header-height)$/],
  ["Shape", /^--(radius|shadow)-|^--(border-width|hairline)(-|$)/],
  ["Motion", /^--(dur|ease)-/],
  ["Z-index", /^--z-/],
  ["Density", /^--density/],
  ["Focus", /^--focus-/],
  ["Miscellaneous", () => true],
];

/** A taxonomy entry accepts a regex or a predicate. */
const inGroup = (rx, name) => (typeof rx === "function" ? rx(name) : rx.test(name));


export function inventory() {
  const files = cssFiles();
  const tokensSource = withoutComments(readFileSync(join(CSS_DIR, "tokens.css"), "utf8"));

  const declarations = [];
  const re = /(--[a-z0-9][a-z0-9-]*)\s*:\s*([^;{}]+)/g;
  let match;
  while ((match = re.exec(tokensSource))) {
    declarations.push({ name: match[1], value: match[2].trim() });
  }
  const names = [...new Set(declarations.map((d) => d.name))];

  // The first declaration wins, matching how the cascade reads a single file for
  // a given selector: a token re-declared in `.c-theme-scope` is the same token
  // re-derived locally, not a different value to publish.
  const firstValue = new Map();
  for (const d of declarations) {
    if (!firstValue.has(d.name)) firstValue.set(d.name, d.value);
  }

  const source = areas();
  const varRe = (name) => new RegExp(`var\\(\\s*${escapeRe(name)}\\s*[,)]`, "g");

  const census = names.map((name) => {
    const hits = [];
    let total = 0;
    for (const [label, text] of Object.entries(source)) {
      const n = (text.match(varRe(name)) || []).length;
      if (n > 0) {
        hits.push(label);
        total += n;
      }
    }
    // The declared text travels with the entry so a consumer can tell a
    // `light-dark()` token from a fixed one without parsing tokens.css a second
    // time. Without it, any gate that wants the value invents its own parser and
    // the two disagree — which is how the export came to hold 151 of 273 tokens
    // while the census reported 273 with confidence.
    return { name, total, areas: hits, value: firstValue.get(name) ?? "" };
  });

  const read = census.filter((c) => c.total > 0);
  const unread = census.filter((c) => c.total === 0);

  const claimed = new Set();
  const groups = TAXONOMY.map(([label, rx]) => {
    const list = names.filter((n) => inGroup(rx, n) && !claimed.has(n));
    list.forEach((n) => claimed.add(n));
    return { label, count: list.length, list };
  });

  // ---- components -------------------------------------------------------
  const byComponent = new Map();
  for (const file of files) {
    for (const b of blocks(readFileSync(join(CSS_DIR, file), "utf8"))) {
      for (const part of b.selector.split(",")) {
        for (const cls of part.matchAll(/\.(c-[a-z0-9-]+)/g)) {
          const name = blockOf(cls[1]);
          if (!byComponent.has(name)) byComponent.set(name, { files: new Set(), rules: 0 });
          byComponent.get(name).files.add(file);
          byComponent.get(name).rules += 1;
        }
      }
    }
  }
  const components = [...byComponent.keys()].sort();

  const guideHtml = source.guide;
  const templateHtml = source.templates;
  const renderedIn = (name) => {
    const patterns = [
      new RegExp(`class="[^"]*\\b${escapeRe(name)}\\b`),
      new RegExp(`class='[^']*\\b${escapeRe(name)}\\b`),
    ];
    const hit = (text) => patterns.some((re) => re.test(text));
    return { guide: hit(guideHtml), templates: hit(templateHtml) };
  };
  const specimens = Object.fromEntries(components.map((name) => [name, renderedIn(name)]));
  const noSpecimen = components.filter((name) => !specimens[name].guide);

  // ---- hygiene ----------------------------------------------------------
  const countBy = new Map();
  for (const d of declarations) countBy.set(d.name, (countBy.get(d.name) || 0) + 1);
  const duplicated = [...countBy.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const rawDurations = [];
  const rawZIndex = [];
  const colourLiterals = [];
  const infiniteAnimations = [];
  for (const file of files) {
    for (const b of blocks(readFileSync(join(CSS_DIR, file), "utf8"))) {
      for (const stmt of b.body.split(";")) {
        const decl = stmt.trim();
        if (!decl) continue;
        if (/^(animation|transition)\s*:/.test(decl) && !decl.includes("var(--dur") && /\b\d+(\.\d+)?m?s\b/.test(decl)) {
          rawDurations.push({ file, selector: b.selector, decl });
        }
        // Every `animation: … infinite` is a WCAG 2.2.2 candidate: it starts
        // automatically and never stops on its own. The motion contract needs
        // this list from the same parser the census uses, because a gate that
        // re-derives it with its own regex disagrees with the published count.
        if (/^animation\s*:/.test(decl) && /\binfinite\b/.test(decl)) {
          infiniteAnimations.push({
            file,
            selector: b.selector,
            decl,
            duration: (decl.match(/var\(--dur-[a-z-]+\)|\b\d+(\.\d+)?m?s\b/) || [""])[0],
          });
        }
        if (/^z-index\s*:/.test(decl) && !decl.includes("var(--z-")) {
          rawZIndex.push({ file, selector: b.selector, decl });
        }
        // A hex or oklch() literal in a component rule is a token that was
        // never declared. AGENTS.md calls this a bug outright.
        if (/:\s*[^;]*\b(oklch\(|#[0-9a-f]{3,8}\b)/i.test(decl) && !/^\s*--/.test(decl)) {
          colourLiterals.push({ file, selector: b.selector, decl });
        }
      }
    }
  }

  const distSize = (p) => (existsSync(join(ROOT, "dist", p)) ? statSync(join(ROOT, "dist", p)).size : null);

  return {
    root: ROOT,
    components: {
      count: components.length,
      names: components,
      rules: Object.fromEntries([...byComponent].map(([k, v]) => [k, { files: [...v.files], rules: v.rules }])),
      specimens,
      noSpecimen,
      specCount: components.length - noSpecimen.length,
    },
    tokens: {
      declarations: declarations.length,
      unique: names.length,
      readCount: read.length,
      unreadCount: unread.length,
      unread: unread.map((u) => u.name),
      duplicated,
      groups,
      census: Object.fromEntries(census.map((c) => [c.name, c])),
    },
    hygiene: { rawDurations, rawZIndex, colourLiterals, infiniteAnimations },
    cssBytes: Object.fromEntries(files.map((f) => [f, statSync(join(CSS_DIR, f)).size])),
    dist: {
      css: distSize("contour.css"),
      minCss: distSize("contour.min.css"),
      js: distSize("contour.js"),
      minJs: distSize("contour.min.js"),
      tokens: distSize("contour.tokens.json"),
    },
  };
}

/** The numbers a document quotes, in the shape the documents want them. */
export function figures() {
  const inv = inventory();
  return {
    inv,
    components: inv.components.count,
    tokens: inv.tokens.unique,
    declarations: inv.tokens.declarations,
    read: inv.tokens.readCount,
    unread: inv.tokens.unreadCount,
    noSpecimen: inv.components.noSpecimen.length,
    headline: `${inv.components.count} components, ${inv.tokens.unique} design tokens`,
  };
}

/** Print the whole inventory as one JSON blob — the hand a script can read. */
export function toJson(inv = inventory()) {
  return JSON.stringify(
    {
      components: {
        count: inv.components.count,
        specCount: inv.components.specCount,
        noSpecimen: inv.components.noSpecimen,
      },
      tokens: {
        declared: inv.tokens.declarations,
        unique: inv.tokens.unique,
        read: inv.tokens.readCount,
        unread: inv.tokens.unread,
        duplicated: inv.tokens.duplicated,
        groups: inv.tokens.groups.map((g) => ({ label: g.label, count: g.count })),
      },
      hygiene: {
        rawDurations: inv.hygiene.rawDurations,
        rawZIndex: inv.hygiene.rawZIndex,
        colourLiterals: inv.hygiene.colourLiterals.length,
      },
      dist: inv.dist,
    },
    null,
    2,
  );
}
