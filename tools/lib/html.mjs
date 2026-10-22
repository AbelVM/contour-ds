/**
 * A very small HTML parser.
 *
 * The tools need to read the style guide's markup, pull an example out of
 * it, and write it back — and they need to do that without adding a
 * dependency to a project that ships none. So: one file, a few hundred
 * lines, and the parts of the spec that matter for well-formed HTML.
 *
 * Handles: elements, void elements, raw-text elements (script, style),
 * comments, doctypes, quoted and unquoted attributes, self-closing tags.
 */

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

const RAW_TEXT = new Set(["script", "style"]);

const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00A0",
};

/**
 * Decode the character references in a string.
 *
 * The parser stores values as they will be *read*, and the serialiser
 * escapes them again on the way out. Without this step every run of a tool
 * would escape the file one level deeper than the last, and `&amp;` would
 * grow into `&amp;amp;` for ever.
 *
 * One pass, so `&amp;lt;` decodes to `&lt;` and not to `<`.
 *
 * @param {string} value
 * @returns {string}
 */
export function decodeEntities(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (match, body) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    }
    const key = body.toLowerCase();
    return key in NAMED_ENTITIES ? NAMED_ENTITIES[key] : match;
  });
}

/**
 * @typedef {{ type: 'element', name: string, attrs: Record<string,string>,
 *             children: Node[], selfClosing: boolean }} Element
 * @typedef {{ type: 'text', value: string }} Text
 * @typedef {{ type: 'raw', value: string }} Raw
 * @typedef {Element | Text | Raw} Node
 */

/**
 * Parse an HTML string into a tree.
 * @param {string} html
 * @returns {Element}
 */
export function parse(html) {
  const root = { type: "element", name: "#root", attrs: {}, children: [], selfClosing: false };
  const stack = [root];
  let index = 0;

  const push = (node) => stack[stack.length - 1].children.push(node);

  while (index < html.length) {
    const lt = html.indexOf("<", index);
    if (lt === -1) {
      push({ type: "text", value: decodeEntities(html.slice(index)) });
      break;
    }
    if (lt > index) {
      push({ type: "text", value: decodeEntities(html.slice(index, lt)) });
    }

    // Comment
    if (html.startsWith("<!--", lt)) {
      const end = html.indexOf("-->", lt);
      const stop = end === -1 ? html.length : end + 3;
      push({ type: "raw", value: html.slice(lt, stop) });
      index = stop;
      continue;
    }

    // Doctype / processing instruction
    if (html.startsWith("<!", lt) || html.startsWith("<?", lt)) {
      const end = html.indexOf(">", lt);
      const stop = end === -1 ? html.length : end + 1;
      push({ type: "raw", value: html.slice(lt, stop) });
      index = stop;
      continue;
    }

    // Closing tag
    if (html.startsWith("</", lt)) {
      const end = html.indexOf(">", lt);
      const name = html.slice(lt + 2, end).trim().toLowerCase();
      // Pop to the matching open tag, if there is one.
      for (let depth = stack.length - 1; depth > 0; depth--) {
        if (stack[depth].name === name) {
          stack.length = depth;
          break;
        }
      }
      index = end === -1 ? html.length : end + 1;
      continue;
    }

    // Opening tag
    const parsed = parseTag(html, lt);
    if (!parsed) {
      push({ type: "text", value: "<" });
      index = lt + 1;
      continue;
    }

    const { name, attrs, selfClosing, end } = parsed;
    const element = { type: "element", name, attrs, children: [], selfClosing };
    push(element);
    index = end;

    if (VOID.has(name) || selfClosing) continue;

    if (RAW_TEXT.has(name)) {
      // Raw text: the content is not markup.
      const closeIndex = html.toLowerCase().indexOf(`</${name}`, index);
      const stop = closeIndex === -1 ? html.length : closeIndex;
      const value = html.slice(index, stop);
      if (value) element.children.push({ type: "text", value });
      if (closeIndex === -1) {
        index = html.length;
      } else {
        const closeEnd = html.indexOf(">", closeIndex);
        index = closeEnd === -1 ? html.length : closeEnd + 1;
      }
      continue;
    }

    stack.push(element);
  }

  return root;
}

/**
 * Parse a single tag starting at `start`.
 * @returns {{name: string, attrs: Record<string,string>, selfClosing: boolean, end: number} | null}
 */
function parseTag(html, start) {
  const nameMatch = /^<([a-zA-Z][a-zA-Z0-9:-]*)/.exec(html.slice(start));
  if (!nameMatch) return null;
  const name = nameMatch[1].toLowerCase();

  const attrs = {};
  let index = start + nameMatch[0].length;
  let selfClosing = false;

  while (index < html.length) {
    while (index < html.length && /\s/.test(html[index])) index++;
    if (html[index] === ">" || html.startsWith("/>", index)) {
      if (html.startsWith("/>", index)) {
        selfClosing = true;
        index += 2;
      } else {
        index += 1;
      }
      break;
    }
    if (html[index] === "/") {
      index++;
      continue;
    }

    const attrMatch = /^([^\s=/>]+)/.exec(html.slice(index));
    if (!attrMatch) {
      index++;
      continue;
    }
    const attrName = attrMatch[1].toLowerCase();
    index += attrMatch[0].length;

    while (index < html.length && /\s/.test(html[index])) index++;
    if (html[index] !== "=") {
      attrs[attrName] = "";
      continue;
    }
    index++;
    while (index < html.length && /\s/.test(html[index])) index++;

    const quote = html[index];
    if (quote === '"' || quote === "'") {
      const close = html.indexOf(quote, index + 1);
      const stop = close === -1 ? html.length : close;
      attrs[attrName] = decodeEntities(html.slice(index + 1, stop));
      index = stop + 1;
    } else {
      const valueMatch = /^[^\s>]*/.exec(html.slice(index));
      attrs[attrName] = valueMatch ? decodeEntities(valueMatch[0]) : "";
      index += valueMatch ? valueMatch[0].length : 0;
    }
  }

  return { name, attrs, selfClosing, end: index };
}

/**
 * Serialise a node back to HTML.
 *
 * Text and attribute values are escaped; the values in the tree are stored
 * decoded, so this is the exact inverse of the parser.
 *
 * @param {Node} node
 * @returns {string}
 */
export function serialize(node) {
  if (node.type === "raw") return node.value;
  if (node.type === "text") return escapeText(node.value);

  const attrs = Object.entries(node.attrs)
    .map(([key, value]) => (value === "" ? ` ${key}` : ` ${key}="${escapeAttr(value)}"`))
    .join("");

  if (node.selfClosing) {
    return `<${node.name}${attrs} />`;
  }

  // Script and style hold raw text, not markup: escaping it would break it.
  const raw = RAW_TEXT.has(node.name);
  const inner = node.children
    .map((child) => (raw && child.type === "text" ? child.value : serialize(child)))
    .join("");
  return `<${node.name}${attrs}>${inner}</${node.name}>`;
}

/**
 * Format an element as indented, readable HTML.
 *
 * The output is raw markup — attribute values are written as they are, so
 * the caller escapes the whole string once, for the place it goes into.
 *
 * @param {Node} node
 * @param {number} depth
 * @returns {string}
 */
export function format(node, depth = 0) {
  const pad = "  ".repeat(depth);

  if (node.type === "raw") return pad + node.value;

  if (node.type === "text") {
    const value = node.value.replace(/\s+/g, " ").trim();
    return value ? pad + value : "";
  }

  const attrs = Object.entries(node.attrs)
    .map(([key, value]) => (value === "" ? ` ${key}` : ` ${key}="${value}"`))
    .join("");

  const meaningful = node.children.filter(
    (child) => child.type === "element" || child.value.trim(),
  );

  if (!meaningful.length) {
    return node.selfClosing ? `${pad}<${node.name}${attrs} />` : `${pad}<${node.name}${attrs}></${node.name}>`;
  }

  // A single short text child stays on one line.
  if (
    meaningful.length === 1 &&
    meaningful[0].type === "text" &&
    meaningful[0].value.trim().length < 60
  ) {
    return `${pad}<${node.name}${attrs}>${meaningful[0].value.trim()}</${node.name}>`;
  }

  const inner = meaningful
    .map((child) => format(child, depth + 1))
    .filter(Boolean)
    .join("\n");

  return `${pad}<${node.name}${attrs}>\n${inner}\n${pad}</${node.name}>`;
}

/**
 * Escape a value for an attribute.
 * @param {string} value
 */
export function escapeAttr(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/\u00A0/g, "&nbsp;");
}

/**
 * Escape text for HTML content.
 * @param {string} value
 */
export function escapeText(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\u00A0/g, "&nbsp;");
}

/**
 * Walk the tree.
 * @param {Node} node
 * @param {(node: Element) => boolean} predicate
 * @returns {Element[]}
 */
export function findAll(node, predicate) {
  const found = [];
  const visit = (current) => {
    if (current.type !== "element") return;
    if (predicate(current)) found.push(current);
    for (const child of current.children) visit(child);
  };
  visit(node);
  return found;
}

/**
 * Remove every element that matches the predicate.
 * @param {Element} root
 * @param {(node: Element) => boolean} predicate
 */
export function removeWhere(root, predicate) {
  const visit = (node) => {
    if (node.type !== "element") return;
    node.children = node.children.filter((child) => {
      if (child.type === "element" && predicate(child)) return false;
      visit(child);
      return true;
    });
  };
  visit(root);
}

/**
 * The class list of an element.
 * @param {Element} element
 */
export function classes(element) {
  return (element.attrs.class || "").split(/\s+/).filter(Boolean);
}

/**
 * Does the element carry the class?
 * @param {Element} element
 * @param {string} name
 */
export function hasClass(element, name) {
  return classes(element).includes(name);
}

/**
 * The concatenated text of a node.
 * @param {Node} node
 */
export function text(node) {
  if (node.type === "text") return node.value;
  if (node.type === "raw") return "";
  return node.children.map(text).join("");
}
