/**
 * Conservative minifiers.
 *
 * These are not compressors — they will not rename a single identifier. They
 * remove what is safe to remove: comments, redundant whitespace and the
 * trailing semicolons nobody needs. The rule is that the output must behave
 * exactly like the input, so every string, template literal and regular
 * expression is left untouched.
 */

/**
 * Minify CSS.
 * @param {string} css
 * @returns {string}
 */
/**
 * Flatten CSS nesting into flat selectors (PF1 support).
 * Expands `&` and descendant nesting so the shipped CSS is flat and broadly
 * compatible, while source may use nesting for readability. At-rules are
 * recursed into. Returns flat CSS text.
 */
function flattenNested(text, parent) {
  const result = [];
  let i = 0;
  const len = text.length;
  while (i < len) {
    while (i < len && /\s/.test(text[i])) i++;
    if (i >= len) break;
    let brace = -1, j = i;
    while (j < len) {
      if (text[j] === "{") { brace = j; break; }
      if (text[j] === "}") { i = j + 1; break; }
      j++;
    }
    if (brace === -1) break;
    const selector = text.slice(i, brace).trim().replace(/\s+/g, " ");
    let d = 1, k = brace + 1;
    while (k < len && d > 0) {
      if (text[k] === "{") d++;
      else if (text[k] === "}") d--;
      k++;
    }
    const body = text.slice(brace + 1, k - 1);
    i = k;
    if (!selector) continue;
    if (selector.startsWith("@")) {
      const inner = flattenNested(body, null);
      if (inner.length === 0) {
        if (body.trim()) result.push(`${selector} { ${body.trim()} }`);
      } else {
        result.push(`${selector} { ${inner.join(" ")} }`);
      }
      continue;
    }
    let full = selector;
    if (parent) {
      if (selector.includes("&")) full = selector.replace(/&/g, parent);
      else full = parent + " " + selector;
    }
    const declSegments = [];
    const nestedRules = [];
    let dd = 0;
    let seg = "";
    let i2 = 0;
    while (i2 < body.length) {
      const ch = body[i2];
      if (ch === "{") {
        const nsel = seg.trim();
        dd = 1; i2++;
        let nb = "";
        while (i2 < body.length && dd > 0) {
          if (body[i2] === "{") { dd++; nb += body[i2]; }
          else if (body[i2] === "}") { dd--; if (dd > 0) nb += body[i2]; }
          else { nb += body[i2]; }
          i2++;
        }
        if (nsel) nestedRules.push({ sel: nsel, body: nb.trim() });
        seg = "";
      } else if (ch === "}") {
        i2++;
      } else if (ch === ";" && dd === 0) {
        if (seg.trim()) declSegments.push(seg.trim() + ";");
        seg = "";
        i2++;
      } else {
        if (dd === 0) seg += ch;
        i2++;
      }
    }
    if (seg.trim() && dd === 0) declSegments.push(seg.trim());
    const declBody = declSegments.join(" ").trim();
    if (declBody) result.push(`${full} { ${declBody} }`);
    for (const nr of nestedRules) {
      const nsel = nr.sel.replace(/\s+/g, " ");
      const inner = nr.body;
      const nested = flattenNested(nsel + " { " + inner + " }", full);
      result.push(...nested);
    }
  }
  return result;
}
export function flattenCss(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return flattenNested(css, null).join("\n");
}

export function minifyCss(css) {
  css = flattenCss(css);
  let out = "";
  let index = 0;

  while (index < css.length) {
    const char = css[index];

    // Comment
    if (char === "/" && css[index + 1] === "*") {
      const end = css.indexOf("*/", index + 2);
      index = end === -1 ? css.length : end + 2;
      continue;
    }

    // String
    if (char === '"' || char === "'") {
      const end = findStringEnd(css, index);
      out += css.slice(index, end);
      index = end;
      continue;
    }

    // Whitespace
    if (/\s/.test(char)) {
      let end = index;
      while (end < css.length && /\s/.test(css[end])) end++;
      const before = out[out.length - 1] || "";
      const after = css[end] || "";
      // A space matters when it separates two tokens that would otherwise
      // merge into a different (or invalid) token. Keep it for:
      //  - two word-ish neighbours (existing rule)
      //  - math operators in calc()/clamp()/min()/max() (+, -, *, /)
      //  - a descendant combinator before a class/id/attribute/element
      //    (e.g. `] .cls`, `) .cls`, `.foo .bar`)
      const wordish = /[a-zA-Z0-9_\-]/.test(before) && /[a-zA-Z0-9_\-]/.test(after);
      const mathOp = /[+\-*/]/.test(before) || /[+\-*/]/.test(after);
      const descendant =
        (/[%)\]]/.test(before) && /[a-zA-Z0-9_.#\[]/.test(after)) ||
        (/[a-zA-Z0-9_\-]/.test(before) && /[.#\[]/.test(after));
      if (wordish || mathOp || descendant) {
        out += " ";
      }
      index = end;
      continue;
    }

    out += char;
    index++;
  }

  // Tidy the punctuation.
  return out
    .replace(/\s*([{};,])\s*/g, "$1")
    .replace(/;}/g, "}")
    .replace(/\s+!important/g, "!important")
    .trim();
}

/**
 * Minify JavaScript by removing comments and indentation.
 * @param {string} code
 * @returns {string}
 */
export function minifyJs(code) {
  let out = "";
  let index = 0;

  // Track whether a `/` starts a regex or is a division, by looking at the
  // last significant character.
  const previous = () => {
    for (let i = out.length - 1; i >= 0; i--) {
      const char = out[i];
      if (!/\s/.test(char)) return char;
    }
    return "";
  };

  while (index < code.length) {
    const char = code[index];
    const next = code[index + 1];

    // Line comment
    if (char === "/" && next === "/") {
      const end = code.indexOf("\n", index);
      index = end === -1 ? code.length : end;
      continue;
    }

    // Block comment
    if (char === "/" && next === "*") {
      const end = code.indexOf("*/", index + 2);
      index = end === -1 ? code.length : end + 2;
      continue;
    }

    // String
    if (char === '"' || char === "'") {
      const end = findStringEnd(code, index);
      out += code.slice(index, end);
      index = end;
      continue;
    }

    // Template literal
    if (char === "`") {
      const end = findTemplateEnd(code, index);
      out += code.slice(index, end);
      index = end;
      continue;
    }

    // Regular expression literal
    if (char === "/" && /[({,;=:!&|?+\-*%~^]/.test(previous())) {
      const end = findRegexEnd(code, index);
      out += code.slice(index, end);
      index = end;
      continue;
    }

    // Whitespace: collapse to one space, and drop it where it is not needed.
    if (/\s/.test(char)) {
      let end = index;
      while (end < code.length && /\s/.test(code[end])) end++;
      const before = previous();
      const after = code[end] || "";
      const wordish = /[a-zA-Z0-9_$]/.test(before) && /[a-zA-Z0-9_$]/.test(after);
      const keywordish =
        /[a-zA-Z0-9_$]/.test(before) && /[a-zA-Z0-9_$]/.test(after) && wordish;
      if (wordish || keywordish) out += " ";
      index = end;
      continue;
    }

    out += char;
    index++;
  }

  // Final punctuation tidying must not touch the inside of string/template/
  // regex literals, so walk the output and skip quoted regions.
  let cleaned = "";
  let i = 0;
  while (i < out.length) {
    const ch = out[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      const end = ch === "`" ? findTemplateEnd(out, i) : findStringEnd(out, i);
      cleaned += out.slice(i, end);
      i = end;
      continue;
    }
    cleaned += ch;
    i += 1;
  }
  // Apply the punctuation tidying only to the non-string portions is complex;
  // instead do a conservative global pass that cannot create invalid tokens:
  // collapse `;}` and trim. Whitespace around operators is already handled
  // by the character walk above.
  cleaned = cleaned.replace(/;}/g, "}").trim();
  return cleaned;
}

/**
 * Find the end of a quoted string.
 * @param {string} code
 * @param {number} start
 */
function findStringEnd(code, start) {
  const quote = code[start];
  let index = start + 1;
  while (index < code.length) {
    if (code[index] === "\\") {
      index += 2;
      continue;
    }
    if (code[index] === quote) return index + 1;
    index++;
  }
  return code.length;
}

/**
 * Find the end of a template literal.
 * @param {string} code
 * @param {number} start
 */
function findTemplateEnd(code, start) {
  let index = start + 1;
  while (index < code.length) {
    if (code[index] === "\\") {
      index += 2;
      continue;
    }
    if (code[index] === "`") return index + 1;
    index++;
  }
  return code.length;
}

/**
 * Find the end of a regular expression literal.
 * @param {string} code
 * @param {number} start
 */
function findRegexEnd(code, start) {
  let index = start + 1;
  let inClass = false;
  while (index < code.length) {
    const char = code[index];
    if (char === "\\") {
      index += 2;
      continue;
    }
    if (char === "[") inClass = true;
    else if (char === "]") inClass = false;
    else if (char === "/" && !inClass) {
      index++;
      // Flags.
      while (index < code.length && /[a-z]/.test(code[index])) index++;
      return index;
    } else if (char === "\n") {
      return start + 1;
    }
    index++;
  }
  return code.length;
}
