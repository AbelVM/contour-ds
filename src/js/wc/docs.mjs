import { ContourBase, define } from './core.mjs';
class ContourDocsNav extends ContourBase {
    render() {
      this.classList.add("c-docs-nav");
      const items = this.getAttribute("items");
      if (items) {
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
              a.textContent = typeof l === "string" ? l : (l.label || l);
              ul.appendChild(a);
            });
            group.appendChild(ul);
            list.appendChild(group);
          });
        } catch (e) { /* keep existing */ }
      } else {
        const list = this.querySelector(".c-docs-nav__list");
        if (list) list.remove();
      }
    }
  }
  define("contour-docs-nav", ContourDocsNav);
class ContourDocsShell extends ContourBase {
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
    }
  }
  define("contour-docs-shell", ContourDocsShell);
