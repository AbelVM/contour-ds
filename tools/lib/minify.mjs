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
export function minifyCss(css) {
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
      // A space only matters when it separates two word-ish characters.
      if (/[a-zA-Z0-9_\-]/.test(before) && /[a-zA-Z0-9_\-]/.test(after)) {
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

  return out
    .replace(/[ \t]+([=+\-*/%<>!&|?:,;{}()[\]])/g, "$1")
    .replace(/([=+\-*/%<>!&|?:,;{}()[\]])[ \t]+/g, "$1")
    .replace(/;}/g, "}")
    .trim();
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
