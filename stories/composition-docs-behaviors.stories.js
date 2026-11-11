import { expect, userEvent } from "storybook/test";
import "../dist/wc/docs.mjs";
import "../dist/wc/navigation.mjs";
import "../dist/wc/content.mjs";

export default {
  title: "Contour/Compositions/DocsBehaviors",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "composition" } },
};

const NAV_ITEMS = JSON.stringify([
  { title: "Getting started", links: [{ label: "Introduction", href: "#doc-intro" }, { label: "Installation", href: "#doc-install" }] },
  { title: "Guides", links: [{ label: "Theming", href: "#doc-theming" }] },
]);

const TOC_ITEMS = JSON.stringify([
  { label: "Introduction", href: "#doc-intro", current: true },
  { label: "Installation", href: "#doc-install" },
  { label: "Theming", href: "#doc-theming" },
]);

export const DocsShellNavigationTocAndCode = {
  render: () => {
    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gridTemplateColumns = "220px minmax(0,1fr) 180px";
    root.style.gap = "1rem";
    root.style.alignItems = "start";
    root.innerHTML = `
      <aside class="c-panel">
        <contour-docs-nav id="demo-docs-nav" title="Documentation" items='${NAV_ITEMS}'></contour-docs-nav>
        <p id="docs-nav-status" style="margin-top:0.5rem">none</p>
      </aside>
      <article id="docs-article">
        <h1 id="doc-intro">Introduction</h1>
        <p>Contour docs compose navigation, article content, and on-page TOC.</p>
        <h2 id="doc-install">Installation</h2>
        <contour-code id="docs-code" title="Install" copyable numbered>npm install contour-ds</contour-code>
        <h2 id="doc-theming">Theming</h2>
        <p>Use tokens and theme attributes to adapt surfaces.</p>
      </article>
      <aside class="c-panel">
        <contour-toc id="docs-toc" title="On this page" items='${TOC_ITEMS}'></contour-toc>
      </aside>`;

    const nav = root.querySelector("#demo-docs-nav");
    const status = root.querySelector("#docs-nav-status");
    // A docs shell owns routing: the link's href is the route, and the host
    // (here, the story) decides when the document follows it. Letting the
    // iframe navigate away would replace the story document and take the test
    // with it.
    root.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("a");
      if (a && (a.getAttribute("href") || "").startsWith("#")) e.preventDefault();
    });
    nav.addEventListener("contour:docs-nav-select", (e) => {
      status.textContent = e.detail.label || "selected";
    });
    return root;
  },
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector("contour-docs-nav");
    const toc = canvasElement.querySelector("contour-toc");
    const code = canvasElement.querySelector("contour-code");
    const status = canvasElement.querySelector("#docs-nav-status");
    const copyBtn = canvasElement.querySelector(".c-code__copy");

    await expect(nav).toBeTruthy();
    await expect(nav).toHaveAttribute("role", "navigation");
    await expect(toc).toBeTruthy();
    await expect(code).toBeTruthy();
    await expect(canvasElement.querySelector("#doc-intro")).toBeTruthy();
    await expect(canvasElement.querySelector("#doc-install")).toBeTruthy();

    const links = Array.from(nav.querySelectorAll(".c-docs-nav__link"));
    await expect(links.length).toBeGreaterThan(1);
    await userEvent.click(links[1]);
    await expect(status.textContent).toBe("Installation");

    const tocLinks = Array.from(toc.querySelectorAll(".c-toc__link"));
    await expect(tocLinks.length).toBe(3);
    // The spy marks the last heading that crossed the reading line, and in this
    // compact fixture several headings sit above it. Exactly one link is
    // current, and it points at a heading that exists; the scroll-by-scroll
    // positions are measured by node tools/audit/docs-behaviours.mjs.
    const marked = tocLinks.filter((a) => a.getAttribute("aria-current") === "true");
    await expect(marked.length).toBe(1);
    await expect(canvasElement.querySelector(marked[0].getAttribute("href"))).toBeTruthy();

    await expect(copyBtn).toBeTruthy();
    await expect(copyBtn.textContent).toContain("Copy");
  },
};

/* Route matching (CDS-075): the URL is the state, so the sidebar marks the link
   the reader is on. A host that owns a client-side router passes `current`; a
   static site lets the component read the document location. */
export const DocsNavRouteMatching = {
  render: () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <contour-docs-nav id="route-nav" title="Documentation" current="#doc-install" items='${NAV_ITEMS}'></contour-docs-nav>
      <p id="route-out">none</p>`;
    const nav = root.querySelector("#route-nav");
    const out = root.querySelector("#route-out");
    // The host owns routing, so a hash link must not navigate the story
    // document away; the component's event carries the href instead.
    root.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("a");
      if (a && (a.getAttribute("href") || "").startsWith("#")) e.preventDefault();
    });
    nav.addEventListener("contour:docs-nav-select", (e) => { out.textContent = e.detail.href || "none"; });
    return root;
  },
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector("contour-docs-nav");
    const links = Array.from(nav.querySelectorAll(".c-docs-nav__link"));
    await expect(links.length).toBe(3);

    const current = nav.querySelectorAll('[aria-current="page"]');
    await expect(current.length).toBe(1);
    await expect(current[0].textContent).toContain("Installation");

    // Exactly one current item: a second one would tell a screen reader two
    // places are "the current page".
    await userEvent.click(links[2]);
    await expect(canvasElement.querySelector("#route-out").textContent).toBe("#doc-theming");
    await expect(nav.querySelectorAll('[aria-current="page"]').length).toBe(1);
  },
};

/* Line numbers (CDS-075): the gutter is real elements so a drag can leave it
   behind and the clipboard can drop it. */
export const CodeBlockLineNumbers = {
  render: () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <contour-code id="numbered-code" title="Install" copyable numbered>npm install contour-ds
pnpm add contour-ds
yarn add contour-ds</contour-code>
      <contour-code id="plain-code" title="Plain">npm install contour-ds</contour-code>`;
    return root;
  },
  play: async ({ canvasElement }) => {
    const numbered = canvasElement.querySelector("#numbered-code");
    const plain = canvasElement.querySelector("#plain-code");

    await expect(numbered).toHaveClass("c-code--numbered");
    await expect(plain).not.toHaveClass("c-code--numbered");

    const lines = Array.from(numbered.querySelectorAll(".c-code__line"));
    await expect(lines.length).toBe(3);

    const numbers = Array.from(numbered.querySelectorAll(".c-code__line-number"));
    await expect(numbers.map((n) => n.textContent)).toEqual(["1", "2", "3"]);
    for (const n of numbers) {
      await expect(n).toHaveAttribute("aria-hidden", "true");
    }

    // The code reads as code: the gutter is not part of the text a reader or a
    // copy action takes.
    const gutterless = lines.map((l) => Array.from(l.childNodes)
      .filter((n) => !(n.nodeType === 1 && n.classList && n.classList.contains("c-code__line-number")))
      .map((n) => n.textContent).join("")).join("\n");
    await expect(gutterless).toBe("npm install contour-ds\npnpm add contour-ds\nyarn add contour-ds");

    // The un-numbered block keeps its single text flow.
    await expect(plain.querySelectorAll(".c-code__line").length).toBe(0);
    await expect(plain.querySelector("code").textContent).toContain("npm install contour-ds");
  },
};

/* Drawer contract (CDS-075). The navigation is a native popover: on a wide
   screen it is an ordinary column and the toggle is not rendered; below 56rem
   the toggle opens the same element as a drawer. The behaviour is measured at
   both widths by `node tools/audit/docs-behaviours.mjs`; this story keeps the
   markup contract executable in the workshop. */
export const DocsNavDrawerContract = {
  render: () => {
    const root = document.createElement("div");
    root.className = "c-docs-shell";
    root.innerHTML = `
      <button class="c-docs-shell__nav-toggle" type="button" popovertarget="docs-drawer-nav" aria-label="Documentation menu">Menu</button>
      <nav class="c-docs-shell__nav" id="docs-drawer-nav" popover aria-label="Documentation">
        <div class="c-docs-nav">
          <a class="c-docs-nav__link" href="#drawer-intro" aria-current="page">Introduction</a>
          <a class="c-docs-nav__link" href="#drawer-install">Installation</a>
        </div>
      </nav>
      <article class="c-docs-shell__article">
        <h1 id="drawer-intro">Introduction</h1>
        <p>Article content.</p>
        <h2 id="drawer-install">Installation</h2>
      </article>`;
    return root;
  },
  play: async ({ canvasElement }) => {
    const toggle = canvasElement.querySelector(".c-docs-shell__nav-toggle");
    const nav = canvasElement.querySelector("#docs-drawer-nav");
    await expect(toggle).toBeTruthy();
    await expect(toggle).toHaveAttribute("popovertarget", "docs-drawer-nav");
    await expect(nav).toHaveAttribute("popover", "");

    // Exactly one of the two states is true: wide screens render the column
    // and hide the controller, narrow screens hide the column until opened.
    const toggleVisible = getComputedStyle(toggle).display !== "none";
    const navVisible = getComputedStyle(nav).display !== "none";
    await expect(toggleVisible).not.toBe(navVisible);

    // The element is a real popover at any width: the platform can open and
    // close it without a script of ours.
    nav.showPopover();
    await expect(nav.matches(":popover-open")).toBe(true);
    nav.hidePopover();
    await expect(nav.matches(":popover-open")).toBe(false);
  },
};