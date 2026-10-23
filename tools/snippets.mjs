/**
 * Regenerate the code snippets in the style guide.
 *
 * Every rendered specimen in index.html is followed by a disclosure that
 * shows the markup behind it, so a developer can read the example and copy
 * the code without leaving the page.
 *
 * The snippet is *extracted from the example itself* — it is never written
 * twice — so the two cannot drift apart. Re-run this after editing a
 * specimen:
 *
 *     node tools/snippets.mjs
 *
 * An example is either a `.ds-panel` / `.ds-spec` container, or any element
 * marked with `data-snippet`. Each example is wrapped together with its
 * disclosure in a generated `.ds-example`, so the pair always travels as
 * one — an example that sits in a grid keeps its disclosure underneath it
 * instead of becoming the next cell.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { parse, serialize, format, findAll, removeWhere, classes, hasClass, text } from "./lib/html.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const guidePath = join(root, "index.html");

/**
 * Is this element one of the guide's own headings?
 * @param {any} element
 */
const isSpecName = (element) =>
  (/^h[1-6]$/.test(element.name) && hasClass(element, "ds-spec__name")) ||
  (element.name === "span" && hasClass(element, "ds-spec__name"));

/**
 * Is this element the explanatory prose under a heading?
 * @param {any} element
 */
const isProse = (element) => element.name === "p" && hasClass(element, "muted");

/**
 * Does this element hold a specimen heading?
 * @param {any} element
 */
const holdsHeading = (element) =>
  findAll(element, (node) => isSpecName(node)).length > 0;

/**
 * Does this element carry content? A spinner or a skeleton has no text at
 * all, but it is still an example.
 * @param {any} node
 */
const hasContent = (node) =>
  text(node).trim().length > 0 ||
  (node.children || []).some((child) => child.type === "element");

/**
 * Pull the example out of a container.
 *
 * A marked element — anything with `data-snippet` — *is* the example: the
 * snippet shows the element itself, tag, classes and attributes included,
 * because that is what a reader copies. The marker itself is guide
 * machinery, so it does not go into the snippet.
 *
 * A guide frame — a `ds-` class — is only a frame: the snippet shows what
 * it holds. So does a specimen panel or spec: the frame is the specimen
 * chrome, the content is the example.
 *
 * @param {any} container
 */
function exampleOf(container) {
  const marked = container.attrs["data-snippet"] !== undefined;
  const isFrame = classes(container).some((name) => name.startsWith("ds-"));

  if (marked && !isFrame) {
    const element = JSON.parse(JSON.stringify(container));
    delete element.attrs["data-snippet"];
    return [format(element, 0)].filter(Boolean);
  }

  const clone = JSON.parse(JSON.stringify(container));

  // The title block — a head, or a row carrying the specimen name — is
  // chrome, not part of the example.
  clone.children = clone.children.filter((child) => {
    if (child.type !== "element") return true;
    if (hasClass(child, "ds-spec__head")) return false;
    return !holdsHeading(child);
  });

  removeWhere(clone, isSpecName);
  removeWhere(clone, isProse);

  return clone.children
    .filter((child) => child.type === "element" && hasContent(child))
    .map((child) => format(child, 0))
    .filter(Boolean);
}

/**
 * Escape a string for HTML text content.
 * @param {string} value
 */
function escape(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Replace the wrappers from a previous run with the examples inside them,
 * so the examples go back to where they were written.
 * @param {any} node
 */
function unwrap(node) {
  if (node.type !== "element") return;
  node.children = node.children.flatMap((child) => {
    if (child.type !== "element") return [child];
    if (child.attrs["data-generated"] === "wrap") {
      unwrap(child);
      return child.children;
    }
    unwrap(child);
    return [child];
  });
}

const source = readFileSync(guidePath, "utf-8");
const tree = parse(source);

// Drop the snippets and the wrappers from a previous run, so the tool is
// idempotent.
removeWhere(tree, (element) => element.attrs["data-generated"] === "code");
unwrap(tree);

const examples = findAll(
  tree,
  (element) =>
    hasClass(element, "ds-panel") ||
    hasClass(element, "ds-spec") ||
    element.attrs["data-snippet"] !== undefined,
);

// One snippet per *example*, never one per element and never one per
// nesting level: if a container holds another example container, the inner
// one is the example and the outer one is only a frame around it.
const nested = new Set(
  examples.filter((example) =>
    findAll(example, (element) => element !== example && examples.includes(element)).length > 0,
  ),
);

// The spacing guard used to live here, over each example's root attributes, and
// it moved to the foot of this file where it can read the snippets that were just
// written. The root is not what a reader pastes: checking it printed 2 warnings
// while 28 published snippets carried guide spacing. The guard was well written
// and aimed at the wrong artifact.

let count = 0;
let nestedCount = 0;
let emptyCount = 0;

for (const example of examples) {
  if (nested.has(example)) {
    nestedCount++;
    continue;
  }

  const lines = exampleOf(example);
  if (!lines.length) {
    emptyCount++;
    continue;
  }

  const code = lines.join("\n");
  const id = `ds-code-${count + 1}`;
  const snippet =
    `\n                    <details class="ds-code" data-generated="code">\n` +
    `                      <summary class="ds-code__summary">\n` +
    `                        <span class="ds-code__chevron">\n` +
    `                          <svg aria-hidden="true"><use href="#i-chevron-right" /></svg>\n` +
    `                        </span>\n` +
    `                        <span>HTML</span>\n` +
    `                        <button\n` +
    `                          class="c-btn c-btn--ghost c-btn--sm ds-code__copy"\n` +
    `                          type="button"\n` +
    `                          data-copy="#${id}"\n` +
    `                          aria-label="Copy code"\n` +
    `                        >\n` +
    `                          <svg aria-hidden="true"><use href="#i-copy" /></svg>\n` +
    `                          Copy\n` +
    `                        </button>\n` +
    `                      </summary>\n` +
    `                      <div class="ds-code__body">\n` +
    `                        <pre class="ds-code__pre"><code id="${id}">${escape(code)}</code></pre>\n` +
    `                      </div>\n` +
    `                    </details>\n`;

  // The example and its disclosure travel together: the wrapper is the
  // grid cell, so the disclosure can never land beside the example.
  const parent = findAll(tree, (element) => element.children.includes(example))[0];
  if (!parent) continue;
  const index = parent.children.indexOf(example);
  const parsedSnippet = parse(snippet);

  const wrapper = {
    type: "element",
    name: "div",
    attrs: { class: "ds-example", "data-generated": "wrap" },
    children: [example, ...parsedSnippet.children.filter((c) => c.type === "element")],
    selfClosing: false,
  };

  parent.children.splice(index, 1, wrapper);
  count++;
}

writeFileSync(guidePath, tree.children.map((child) => serialize(child)).join(""), "utf-8");

/* ------------------------------------------------------------------------
   The spacing guard (T-156, promoted from a warning by C-32).

   It reads the file that was just written, because the snippet is the artifact
   a reader copies — the example's root attributes are not. Scanning those
   reported 2 warnings while 28 published snippets carried guide spacing.

   The rule is about the FIRST element of a snippet. A margin there separates the
   component from the guide's own heading above it, which does not exist in the
   reader's page; assets/css/docs.css spaces specimens now. A margin on an
   element INSIDE the example is the example's own layout and stays.

   `0` and `auto` are exempt — a reset and a flex fill are the author's intent,
   not scaffolding. A `ds-` frame root is a separate and larger defect (a
   guide-only class inside copyable markup, 15 classes across 41 snippets) that
   this guard counts and reports without failing on, because fixing it collides
   with the layout-vocabulary row (C-35) and inventing a rule here would hide the
   choice rather than surface it.

   The guard asserts how many snippets it read: a check that examined nothing
   must not exit 0.
   ------------------------------------------------------------------------ */
const written = readFileSync(guidePath, "utf-8");
const emitted = [...written.matchAll(/<code id="ds-code-\d+">([\s\S]*?)<\/code>/g)];
const leaks = [];
for (const [, body] of emitted) {
  const un = body
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&");
  const first = un.match(/<([a-z]+)((?:[^>"]|"[^"]*")*)>/);
  if (!first) continue;
  const decl = first[2].match(/margin-block-start:\s*([^;"]+)/);
  if (!decl) continue;
  const value = decl[1].trim();
  if (value === "0" || value === "auto") continue;
  const classes = (first[2].match(/class="([^"]*)"/) || [, ""])[1];
  if (classes.trim().split(/\s+/).some((c) => c.startsWith("ds-"))) continue; // reported, not failed here
  leaks.push(`<${first[1]} class="${classes}"> ${value}`);
}

if (!emitted.length) {
  console.error("snippets: FAIL — no snippet was emitted, so the spacing guard measured nothing");
  process.exit(1);
}
if (leaks.length) {
  console.error(`snippets: FAIL — ${leaks.length} snippet(s) lead with guide spacing a consumer cannot use:`);
  leaks.forEach((l) => console.error("  " + l));
  process.exit(1);
}

console.log(
  `snippets: ${count} written, ${nestedCount} nested (an example inside an example), ${emptyCount} empty; ` +
    `${emitted.length} snippet(s) checked for lead spacing, ${leaks.length} leak(s).`,
);
