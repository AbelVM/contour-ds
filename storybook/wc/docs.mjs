import { ContourBase, define, onDispose, sanitizeHtml, headingTag, navKey, safeHref , warnBadJson, label } from './core.mjs';
import { loadRemote, remoteData, renderStates, renderEmpty, wireStates } from './states.mjs';

/* Route matching (CDS-075). The URL is the state for a documentation surface, so
   the sidebar says where the reader is by marking the matching link
   `aria-current="page"` — the shipped CSS already styles that attribute, and a
   reader who cannot see the highlight still hears "current page".

   Two ways to say where the reader is, in order:
     1. a `current` attribute on the host, which is what a client-side router
        sets after it navigates (a path, or a bare `#hash`);
     2. the document's own location, which is what a static docs site has.

   A bare hash also matches the last path segment, because that is the shape a
   docs URL takes: `/docs/install` is the page `#install` points at. */
const routeKey = (value) => {
  const raw = String(value == null ? "" : value).trim();
  if (!raw) return "";
  if (raw.startsWith("#")) return "hash:" + raw;
  try {
    const base = typeof location !== "undefined" ? location.href : "http://localhost/";
    const url = new URL(raw, base);
    return "path:" + url.pathname.replace(/\/+$/, "") + url.search;
  } catch (e) {
    return "raw:" + raw;
  }
};

const hereKey = (explicit) => {
  const raw = String(explicit == null ? "" : explicit).trim();
  if (raw) return routeKey(raw);
  if (typeof location === "undefined") return "";
  return "path:" + String(location.pathname || "").replace(/\/+$/, "") + (location.search || "");
};

const hashMatchesHere = (hash) => {
  if (typeof location === "undefined") return false;
  if (location.hash && location.hash === hash) return true;
  const segment = String(location.pathname || "").split("/").filter(Boolean).pop() || "";
  return Boolean(segment) && hash === "#" + segment;
};

class ContourDocsNav extends ContourBase {
    static get observed() { return ["items", "title", "loading", "error", "retry", "src", "lazy", "refresh", "timeout", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, title: { attribute: "title" }, src: { attribute: "src" } }; }
    render() {
      this.classList.add("c-docs-nav");
      this.setAttribute("role", "navigation");
      const title = this.getAttribute("title");
      if (title) this.setAttribute("aria-label", title);
      else this.setAttribute("aria-label", "Documentation navigation");
      wireStates(this);
      loadRemote(this, "items");
      if (renderStates(this, "docs-nav")) return;
      const _remote = remoteData(this, "items");
      const items = this.hasAttribute("src") ? _remote : (_remote || (this.hasAttribute("items") ? this.getAttribute("items") : null));
      const list = this.querySelector(".c-docs-nav__list");
      const authored = list ? Array.from(list.children).filter((n) => n.classList && n.classList.contains("c-docs-nav__group")) : [];
      if (items && !authored.length) {
        try {
          const parsed = JSON.parse(items);
          const list = this.ensure(".c-docs-nav__list", () => { const el = document.createElement("div"); el.className = "c-docs-nav__list"; return el; });
          list.innerHTML = "";
          parsed.forEach((g) => {
            const group = document.createElement("div");
            group.className = "c-docs-nav__group";
            if (g.title) {
              const gt = document.createElement("div");
              gt.className = "c-docs-nav__group-title";
              gt.textContent = g.title;
              group.appendChild(gt);
            }
            const ul = document.createElement("div");
            ul.className = "c-docs-nav__list";
            (g.links || g.items || []).forEach((l) => {
              const a = document.createElement("a");
              a.className = "c-docs-nav__link";
              a.href = safeHref(typeof l === "string" ? "#" : (l.href || "#"));
              const label = typeof l === "string" ? l : (l.label || l);
              if (typeof l === "object" && l !== null && l.badge) {
                const b = document.createElement("span");
                b.className = "c-docs-nav__badge";
                b.textContent = l.badge;
                a.appendChild(b);
              }
              a.appendChild(document.createTextNode(label));
              if (typeof l === "object" && l !== null && l.chevron) {
                const ch = document.createElement("span");
                ch.className = "c-docs-nav__chevron";
                ch.textContent = l.chevron;
                a.appendChild(ch);
              }
              if (typeof l === "object" && l !== null && Array.isArray(l.items)) {
                a.classList.add("c-docs-nav__link--nested");
                const nested = document.createElement("div");
                nested.className = "c-docs-nav__list c-docs-nav__list--nested";
                l.items.forEach((nl) => {
                  const na = document.createElement("a");
                  na.className = "c-docs-nav__link";
                  na.href = safeHref(typeof nl === "string" ? "#" : (nl.href || "#"));
                  na.textContent = typeof nl === "string" ? nl : (nl.label || nl);
                  nested.appendChild(na);
                });
                ul.appendChild(a);
                ul.appendChild(nested);
              } else {
                ul.appendChild(a);
              }
            });
            group.appendChild(ul);
            list.appendChild(group);
          });
        } catch (e) { warnBadJson(this, "attribute", e); }
      } else if (!items && list) {
        list.remove();
        renderEmpty(this, "docs-nav");
      } else if (!items && !list) {
        renderEmpty(this, "docs-nav");
      }
      this.applyCurrent();
    }
    /* Mark the link the reader is on. Idempotent: it clears every other link
       first, so a re-render or a route change cannot leave two "current" items. */
    applyCurrent() {
      const links = Array.from(this.querySelectorAll(".c-docs-nav__link"));
      if (!links.length) return;
      const explicit = this.getAttribute("current");
      const here = hereKey(explicit);
      links.forEach((a) => {
        const href = a.getAttribute("href") || "";
        const key = routeKey(href);
        const hit = Boolean(here) && (
          (key && key === here) ||
          (href.startsWith("#") && !explicit && hashMatchesHere(href))
        );
        if (hit) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });
    }
    enhance() {
      if (this._wiredDocsNav) return;
      this._wiredDocsNav = true;
      this.addEventListener("click", (e) => {
        const link = e.target && e.target.closest ? e.target.closest(".c-docs-nav__link") : null;
        if (link && this.contains(link)) {
          const label = link.textContent || "";
          this.dispatchEvent(new CustomEvent("contour:docs-nav-select", { bubbles: true, composed: true, detail: { label, href: link.getAttribute("href") } }));
        }
      });
      // Keyboard: roving tabindex over docs-nav links, Enter follows the link.
      this.addEventListener("keydown", (e) => {
        const links = Array.from(this.querySelectorAll(".c-docs-nav__link"));
        if (!links.length) return;
        if (!links.some((l) => l.tabIndex === 0)) links.forEach((l, i) => l.tabIndex = i === 0 ? 0 : -1);
        navKey(e, links, { wrap: true, homeEnd: true, onNavigate: (i) => { links.forEach((l, j) => l.tabIndex = j === i ? 0 : -1); }, onKey: (k) => { if (k === "Enter") { const a = document.activeElement; if (a) { e.preventDefault(); a.click(); } } } });
      });
      // A static docs site navigates by changing the URL, so the highlight has to
      // follow the URL rather than the click. A host that passes `current` owns
      // the state and this listener is a no-op next to it.
      if (typeof window !== "undefined" && window.addEventListener) {
        const sync = () => this.applyCurrent();
        window.addEventListener("hashchange", sync);
        window.addEventListener("popstate", sync);
        onDispose(this, () => {
          window.removeEventListener("hashchange", sync);
          window.removeEventListener("popstate", sync);
        });
      }
    }
  }
  define("contour-docs-nav", ContourDocsNav);
class ContourDocsShell extends ContourBase {
    static get observed() { return ["title", "lede", "article", "heading"]; }
    static get properties() { return { title: { attribute: "title" }, lede: { attribute: "lede" }, article: { attribute: "article" } }; }
    render() {
      this.classList.add("c-docs-shell");
      this.setAttribute("role", "region");
      const title = this.getAttribute("title");
      if (title) {
        const h = this.ensure(".c-docs-shell__title", () => { const el = document.createElement(headingTag(this, "h2")); el.className = "c-docs-shell__title"; return el; });
        h.textContent = title;
        this.setAttribute("aria-label", title);
      } else {
        const h = this.querySelector(".c-docs-shell__title");
        if (h) h.remove();
      }
      const lede = this.getAttribute("lede");
      if (lede) {
        const p = this.ensure(".c-docs-shell__lede", () => { const el = document.createElement("p"); el.className = "c-docs-shell__lede"; return el; });
        p.textContent = lede;
      } else {
        const p = this.querySelector(".c-docs-shell__lede");
        if (p) p.remove();
      }
      const article = this.getAttribute("article");
      if (article) {
        const a = this.ensure(".c-docs-shell__article", () => { const el = document.createElement("article"); el.className = "c-docs-shell__article"; return el; });
        a.innerHTML = sanitizeHtml(article);
      } else {
        const a = this.querySelector(".c-docs-shell__article");
        if (a) a.remove();
      }
    }
  }
  define("contour-docs-shell", ContourDocsShell);


class ContourFileTree extends ContourBase {
    static get updateMode() { return "keyed"; }
    static get observed() { return ["items"]; }
    static get properties() { return { items: { attribute: "items" } }; }
    render() {
      this.classList.add("c-file-tree");
      const items = this.getAttribute("items");
      if (items) {
        try {
          const parsed = JSON.parse(items);
          const renderNode = (node, depth) => {
            const row = document.createElement("div");
            row.className = "c-file-tree__row" + (node.dir ? " c-file-tree__row--dir" : "") + (node.active ? " c-file-tree__row--active" : "");
            row.style.paddingInlineStart = (depth * 1) + "rem";
            const label = document.createElement("span");
            label.textContent = node.label || node.name || "";
            row.appendChild(label);
            this.appendChild(row);
            if (Array.isArray(node.children)) {
              node.children.forEach((c) => renderNode(c, depth + 1));
            }
          };
          // clear generated
          Array.from(this.querySelectorAll(".c-file-tree__row")).forEach((n) => n.remove());
          parsed.forEach((n) => renderNode(n, 0));
        } catch (e) { warnBadJson(this, "attribute", e); }
      }
    }
  }
  define("contour-file-tree", ContourFileTree);

class ContourChangelog extends ContourBase {
    static get observed() { return ["src", "max", "loading", "error"]; }
    static get properties() { return { src: { attribute: "src" }, max: { attribute: "max", type: Number } }; }
    render() {
      this.classList.add("c-changelog");
      const src = this.getAttribute("src");
      if (src) {
        if (this.dataset.loaded === src) return;
        this.dataset.loaded = "";
        const loading = this.ensure(".c-changelog__loading", () => { const el = document.createElement("div"); el.className = "c-changelog__loading"; el.textContent = label(this, "loading", "Loading…"); return el; });
        // clear
        Array.from(this.querySelectorAll(".c-changelog__entry, .c-changelog__error")).forEach((n) => n.remove());
        if (!this.querySelector(".c-changelog__loading")) this.appendChild(loading);
        // Abort the in-flight fetch when the host leaves the page, so a slow
        // changelog cannot write into a detached element.
        try { if (this._changelogAbort) this._changelogAbort.abort(); } catch (e) {}
        this._changelogAbort = typeof AbortController !== "undefined" ? new AbortController() : null;
        fetch(src, this._changelogAbort ? { signal: this._changelogAbort.signal } : undefined).then((r) => {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.text();
        }).then((text) => {
          if (!this.isConnected) return;
          const ld = this.querySelector(".c-changelog__loading");
          if (ld) ld.remove();
          this.dataset.loaded = src;
          const entries = parseChangelog(text);
          const max = parseInt(this.getAttribute("max") || "0", 10);
          const list = (max > 0) ? entries.slice(0, max) : entries;
          if (!list.length) {
            const empty = document.createElement("div");
            empty.className = "c-changelog__empty";
            empty.textContent = label(this, "empty", "No releases found.");
            this.appendChild(empty);
            return;
          }
          list.forEach((e) => {
            const det = document.createElement("details");
            det.className = "c-changelog__entry";
            const sum = document.createElement("summary");
            sum.className = "c-changelog__summary";
            const ver = document.createElement("span");
            ver.className = "c-changelog__version";
            ver.textContent = e.version;
            sum.appendChild(ver);
            if (e.date) {
              const d = document.createElement("span");
              d.className = "c-changelog__date";
              d.textContent = e.date;
              sum.appendChild(d);
            }
            det.appendChild(sum);
            const body = document.createElement("div");
            body.className = "c-changelog__body";
            body.innerHTML = renderChangelogBody(e.body);
            det.appendChild(body);
            this.appendChild(det);
          });
        }).catch((err) => {
          if (!this.isConnected) return;
          const ld = this.querySelector(".c-changelog__loading");
          if (ld) ld.remove();
          const er = document.createElement("div");
          er.className = "c-changelog__error";
          er.textContent = "Failed to load changelog: " + (err && err.message ? err.message : err);
          this.appendChild(er);
        });
      }
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      try { if (this._changelogAbort) this._changelogAbort.abort(); } catch (e) {}
      this._changelogAbort = null;
    }
  }
  define("contour-changelog", ContourChangelog);

  function parseChangelog(text) {
    const lines = String(text).split(/\r?\n/);
    const entries = [];
    let cur = null;
    for (const line of lines) {
      const m = line.match(/^##\s+\[?([^\]\n]+)\]?\s*[-–—]?\s*(.*)$/);
      if (m && (line.startsWith("## ") )) {
        // only treat as version header if it looks like a version or "Unreleased"
        const ver = m[1].trim();
        const rest = m[2].trim();
        if (/^\d|unreleased/i.test(ver)) {
          if (cur) entries.push(cur);
          cur = { version: ver, date: rest.replace(/^[-–—]\s*/, "").trim(), body: "" };
          continue;
        }
      }
      if (cur) cur.body += line + "\n";
    }
    if (cur) entries.push(cur);
    return entries;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderChangelogBody(body) {
    const lines = String(body).trim().split(/\r?\n/);
    const out = [];
    let inList = false;
    for (const raw of lines) {
      const line = raw.trimEnd();
      if (/^###\s+/.test(line)) {
        if (inList) { out.push("</ul>"); inList = false; }
        out.push("<h3>" + escapeHtml(line.replace(/^###\s+/, "")) + "</h3>");
      } else if (/^##\s+/.test(line)) {
        if (inList) { out.push("</ul>"); inList = false; }
        out.push("<h2>" + escapeHtml(line.replace(/^##\s+/, "")) + "</h2>");
      } else if (/^#\s+/.test(line)) {
        if (inList) { out.push("</ul>"); inList = false; }
        out.push("<h2>" + escapeHtml(line.replace(/^#\s+/, "")) + "</h2>");
      } else if (/^[-*]\s+/.test(line)) {
        if (!inList) { out.push("<ul>"); inList = true; }
        out.push("<li>" + escapeHtml(line.replace(/^[-*]\s+/, "")) + "</li>");
      } else if (line.trim() === "") {
        if (inList) { out.push("</ul>"); inList = false; }
      } else {
        if (inList) { out.push("</ul>"); inList = false; }
        out.push("<p>" + escapeHtml(line) + "</p>");
      }
    }
    if (inList) out.push("</ul>");
    return out.join("");
  }
