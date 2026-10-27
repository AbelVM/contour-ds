import { ContourBase, define } from './core.mjs';
class ContourDocsNav extends ContourBase {
    static get observed() { return ["items", "title", "empty", "loading", "error", "src", "skeleton"]; }
    static get properties() { return { items: { attribute: "items" }, title: { attribute: "title" } }; }
    render() {
      this.classList.add("c-docs-nav");
      const src = this.getAttribute("src");
      const items = this.getAttribute("items") || (this._remoteItems ? JSON.stringify(this._remoteItems) : null) || '[{"title":"Nav","links":["Home","Docs"]}]';
      if (src && !this.getAttribute("items") && this._srcFetched !== src) {
        this._srcFetched = src;
        this._loading = true;
        this.attributeChangedCallback("__rerender__", null, "");
        fetch(src).then((r) => r.json()).then((data) => {
          this._remoteItems = data;
          this._loading = false;
          this.attributeChangedCallback("__rerender__", null, "");
        }).catch(() => {
          this._loading = false;
          this.attributeChangedCallback("__rerender__", null, "");
        });
      }
      const loading = this.hasAttribute("loading") || this._loading;
      if (loading) {
        const loadingEl = document.createElement("div");
        loadingEl.className = "c-docs-nav__loading";
        loadingEl.textContent = this.getAttribute("loading") || "Loading…";
        loadingEl.style.color = "var(--color-text-muted)";
        loadingEl.style.padding = "var(--space-md)";
        this.appendChild(loadingEl);
        return;
      }
      if (this.hasAttribute("error")) {
        const err = document.createElement("div");
        err.className = "c-docs-nav__error";
        err.textContent = this.getAttribute("error") || "Error";
        err.style.color = "var(--color-danger, var(--color-text))";
        err.style.padding = "var(--space-md)";
        this.appendChild(err);
        return;
      }
      if (this.hasAttribute("skeleton")) {
        const count = Math.min(4, Math.max(1, parseInt(this.getAttribute("skeleton") || "3", 10) || 3));
        for (let i = 0; i < count; i++) {
          const sk = document.createElement("div");
          sk.className = "c-skeleton c-docs-nav__skeleton";
          sk.style.blockSize = "1.5rem";
          sk.style.marginBlockEnd = "var(--space-2xs)";
          this.appendChild(sk);
        }
        return;
      }
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
              a.href = (typeof l === "string" ? "#" : (l.href || "#"));
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
                  na.href = (typeof nl === "string" ? "#" : (nl.href || "#"));
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
        } catch (e) { /* keep existing */ }
      } else if (!items && list) {
        list.remove();
        const empty = document.createElement("div");
        empty.className = "c-docs-nav__empty";
        empty.textContent = this.getAttribute("empty") || "No data";
        empty.style.color = "var(--color-text-muted)";
        empty.style.padding = "var(--space-md)";
        this.appendChild(empty);
      } else if (!items && !list) {
        const empty = document.createElement("div");
        empty.className = "c-docs-nav__empty";
        empty.textContent = this.getAttribute("empty") || "No data";
        empty.style.color = "var(--color-text-muted)";
        empty.style.padding = "var(--space-md)";
        this.appendChild(empty);
      }
    }
  }
  define("contour-docs-nav", ContourDocsNav);
class ContourDocsShell extends ContourBase {
    static get observed() { return ["title", "lede", "article"]; }
    static get properties() { return { title: { attribute: "title" }, lede: { attribute: "lede" }, article: { attribute: "article" } }; }
    render() {
      this.classList.add("c-docs-shell");
      const title = this.getAttribute("title");
      if (title) {
        const h = this.ensure(".c-docs-shell__title", () => { const el = document.createElement("h1"); el.className = "c-docs-shell__title"; return el; });
        h.textContent = title;
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
        a.innerHTML = article;
      } else {
        const a = this.querySelector(".c-docs-shell__article");
        if (a) a.remove();
      }
    }
  }
  define("contour-docs-shell", ContourDocsShell);
