/**
 * The one parser for `light-dark()` in the tooling.
 *
 * Both the build (which publishes the token export) and the export gate (which
 * checks it) need to answer the same question — "is this token a top-level
 * light-dark() call, and what are its two themes?" — and they must answer it the
 * same way. Two parsers is how the build came to print 151 tokens while the
 * census printed 273 and both looked self-consistent.
 *
 * A regex cannot do this correctly, for two reasons this file exists to fix:
 *
 *   - `.` does not match a newline, and tokens.css writes long `light-dark()`
 *     calls across several lines. The exporter's `/^light-dark\(([^,]+),\s*(.+)\)$/`
 *     therefore silently failed to split --color-focus-halo, --color-primary-soft
 *     and --color-on-primary-solid, publishing them as one opaque string.
 *   - `light-dark(` also appears *nested* inside a composition, e.g.
 *     `--shadow-xs: 0 1px 2px light-dark(…)`. That is not a two-theme token: the
 *     browser resolves the whole expression per theme, and a tool cannot split an
 *     offset shadow into a "light shadow" and a "dark shadow". Only a value that
 *     is exactly one top-level call qualifies.
 *
 * So: scan, do not pattern-match. Parentheses are counted, quotes are respected,
 * and the top-level comma is found by walking.
 */

/**
 * Split a CSS value into whitespace-separated top-level chunks, respecting
 * parentheses and quotes.
 * @param {string} value
 * @returns {string[]}
 */
function topLevelSplit(value, separator = ",") {
  const parts = [];
  let depth = 0;
  let quote = null;
  let current = "";
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (quote) {
      current += ch;
      if (ch === quote && value[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    if (ch === separator && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  parts.push(current);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

/**
 * Whether a declared value is exactly one top-level `light-dark(a, b)` call.
 * Returns the two themes with whitespace collapsed onto one line, or null when
 * the value is anything else — a fixed colour, or a composition that merely
 * contains a `light-dark()` call somewhere inside it.
 *
 * @param {string} value the declared text, as written in tokens.css
 * @returns {{ light: string, dark: string } | null}
 */
export function lightDarkPair(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("light-dark(")) return null;
  // Must close the call at the very end: `light-dark(a, b) solid red` is a
  // composition, not a two-theme colour.
  if (!trimmed.endsWith(")")) return null;
  // The matching close paren for the opening one must be the last character.
  const inner = trimmed.slice("light-dark(".length, -1);
  let depth = 0;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    if (depth < 0) return null;
  }
  if (depth !== 0) return null;

  const args = topLevelSplit(inner);
  if (args.length !== 2) return null;
  const oneLine = (s) => s.replace(/\s+/g, " ").trim();
  return { light: oneLine(args[0]), dark: oneLine(args[1]) };
}

/**
 * The function name a value is *built from*, when the whole value is one call.
 * Used to tell `linear-gradient(...)` from a value that mentions a gradient.
 * @param {string} value
 * @returns {string | null}
 */
export function topLevelFunction(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const open = trimmed.indexOf("(");
  if (open <= 0 || !trimmed.endsWith(")")) return null;
  const name = trimmed.slice(0, open).trim();
  return /^[a-z-]+$/.test(name) ? name : null;
}
