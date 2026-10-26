// The element names a consumer can put in markup, derived from where they are
// registered, so one list can be written into the type declarations by
// tools/build.mjs and then checked by tools/audit/wc-contract.mjs against the
// registry the bundle actually hands `customElements` in a real browser.
//
// This is a generator, not an authority. The layer is half table-driven, and a
// scrape that counts whatever shape the source happens to be in is how this repo
// once certified a fraction of its own registry as the whole of it — so the gate,
// not this file, decides whether the list is right.
//
// Every shape must be found or this throws. A silently short list would type-check
// and ship, which is the failure worth being loud about.
const die = (m) => { throw new Error("wc-names: " + m); };

const literals = (src, re, label) => {
  const found = [...src.matchAll(re)].map((m) => m[1]);
  if (!found.length) die(`no ${label} found — update this file, do not emit a short list`);
  return found;
};

// Both tables close on their own line at two spaces of indent. Stopping at the
// first `}` or `]` instead would cut SHADOW_SLOTS short at the end of its first
// tag's array — capturing `div`'s blocks and reporting every other tag's wrappers
// as if they had never been declared.
const tableBlocks = (src, name, open, close) => {
  const decl = new RegExp(`(?:export\\s+)?(?:const|var)\\s+${name}\\s*=\\s*\\${open}[\\s\\S]*?\\n {2}\\${close};`).exec(src);
  if (!decl) die(`${name} not found — the derivation is stale, not empty`);
  const blocks = [...decl[0].matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]);
  if (!blocks.length) die(`${name} resolved to no blocks`);
  return blocks;
};

/** @returns {{names: string[], counts: Record<string, number>}} */
export function elementNames(src) {
  const counts = {};
  const names = new Set();
  const add = (shape, found) => { counts[shape] = found.length; for (const n of found) names.add(n); };

  add("explicit", literals(src, /define\("(contour-[a-z0-9-]+)"/g, "explicit registrations"));
  add("class-only", tableBlocks(src, "CLASS_ONLY", "[", "]").map((b) => "contour-" + b));
  add("shadow-markup", literals(src, /shadow\("(contour-shadow-[a-z0-9-]+)"/g, "shadow template registrations"));
  add("shadow-slots", tableBlocks(src, "SHADOW_SLOTS", "{", "}").map((b) => "contour-shadow-" + b));

  const sorted = [...names].sort();
  if (new Set(sorted).size !== sorted.length) die("the same name came from two shapes");
  return { names: sorted, counts };
}

/**
 * `ContourElement` is deliberately the shared surface. The two wrappers differ in
 * where their markup lives, not in what they offer, and typing members per tag
 * here would promise APIs the runtime does not have.
 */
export function typeDeclarations(names) {
  return [
    "/**",
    " * Common attributes every Contour element may carry. Reflected to the DOM",
    " * as attributes; setting them on the instance updates the element.",
    " */",
    "export interface ContourProps {",
    "  action?: string | null;",
    "  actions?: string | null;",
    "  after?: string | null;",
    "  anchor?: string | null;",
    "  answer?: string | null;",
    "  area?: string | null;",
    "  article?: string | null;",
    "  attribution?: string | null;",
    "  attribution-mark?: string | null;",
    "  axis?: string | null;",
    "  axis-x?: string | null;",
    "  axis-y?: string | null;",
    "  before?: string | null;",
    "  body?: string | null;",
    "  brand?: string | null;",
    "  canvas?: string | null;",
    "  cells?: string | null;",
    "  center?: string | null;",
    "  chrome?: string | null;",
    "  closable?: string | null;",
    "  color?: string | null;",
    "  cols?: string | null;",
    "  columns?: string | null;",
    "  command?: string | null;",
    "  controls?: string | null;",
    "  copyable?: string | null;",
    "  count?: string | null;",
    "  current?: string | null;",
    "  date?: string | null;",
    "  delta?: string | null;",
    "  demo?: string | null;",
    "  desc?: string | null;",
    "  direction?: string | null;",
    "  divider?: string | null;",
    "  do?: string | null;",
    "  dont?: string | null;",
    "  dot?: string | null;",
    "  empty?: string | null;",
    "  error?: string | null;",
    "  hint?: string | null;",
    "  href?: string | null;",
    "  icon?: string | null;",
    "  index?: string | null;",
    "  instrument?: string | null;",
    "  items?: string | null;",
    "  key?: string | null;",
    "  label?: string | null;",
    "  lede?: string | null;",
    "  legend?: string | null;",
    "  line?: string | null;",
    "  links?: string | null;",
    "  live?: string | null;",
    "  max?: string | null;",
    "  media?: string | null;",
    "  message?: string | null;",
    "  method?: string | null;",
    "  min?: string | null;",
    "  name?: string | null;",
    "  needle?: string | null;",
    "  next?: string | null;",
    "  no?: string | null;",
    "  nodes?: string | null;",
    "  norm?: string | null;",
    "  note?: string | null;",
    "  options?: string | null;",
    "  pages?: string | null;",
    "  placeholder?: string | null;",
    "  point?: string | null;",
    "  points?: string | null;",
    "  prev?: string | null;",
    "  prompt?: string | null;",
    "  question?: string | null;",
    "  quote?: string | null;",
    "  ramp?: string | null;",
    "  removable?: string | null;",
    "  required?: string | null;",
    "  reverse?: string | null;",
    "  rings?: string | null;",
    "  rows?: string | null;",
    "  scale?: string | null;",
    "  separator?: string | null;",
    "  series?: string | null;",
    "  shortcut?: string | null;",
    "  size?: string | null;",
    "  state?: string | null;",
    "  status?: string | null;",
    "  steps?: string | null;",
    "  subtitle?: string | null;",
    "  summary?: string | null;",
    "  tabs?: string | null;",
    "  tag?: string | null;",
    "  text?: string | null;",
    "  title?: string | null;",
    "  type?: string | null;",
    "  unit?: string | null;",
    "  value?: string | null;",
    "  variant?: string | null;",
    "  viewport?: string | null;",
    "  yes?: string | null;",
    "}",
    "",
    "/**",
    " * A Contour custom element, light-DOM wrapper or shadow wrapper.",
    " * A wrapper's styling contract is its `part` list; every interaction",
    " * announces itself as a bubbling `contour:*` CustomEvent dispatched on the",
    " * host, so one listener serves both layers and slotted content alike.",
    " */",
    "export interface ContourElement extends HTMLElement, ContourProps {}",
    "",
    // No separate `ContourTagName` union. Writing the same list twice is what put
    // this file over its budget the first time: the map below already names every
    // tag once, and `keyof HTMLElementTagNameMap` is how a consumer derives the
    // union, so a second copy here would only have to be kept in step by hand.
    "",
    "declare global {",
    "  interface HTMLElementTagNameMap {",
    ...names.map((n) => `    "${n}": ContourElement;`),
    "  }",
    "}",
  ];
}
