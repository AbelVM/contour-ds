import { expect } from "storybook/test";
import "../dist/wc/data.mjs";
import "../dist/wc/forms.mjs";
import "../dist/wc/feedback.mjs";
import "../dist/wc/map.mjs";
import "../dist/wc/navigation.mjs";
import "../dist/wc/layout.mjs";

export default {
  title: "Contour/Compositions/RealWorldDemos",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "composition" } },
};

export const SpatialDashboardDemo = {
  render: () => {
    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gridTemplateColumns = "260px 1fr";
    root.style.gap = "1rem";
    root.innerHTML = `
      <aside class="c-panel">
        <h3>Layers</h3>
        <contour-layer-panel items='[{"name":"Base map","visible":true},{"name":"Routes","visible":true}]'></contour-layer-panel>
        <h3 style="margin-top:1rem">Filter</h3>
        <contour-input name="q" placeholder="Search region"></contour-input>
      </aside>
      <main style="display:grid;gap:1rem">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem">
          <contour-kpi label="Active routes" value="842"></contour-kpi>
          <contour-kpi label="Alerts" value="3"></contour-kpi>
          <contour-kpi label="Coverage" value="96%"></contour-kpi>
        </div>
        <contour-chart axis="Weekly volume" series='[{"label":"Volume","type":"bar","values":[12,18,15,23,28]}]'></contour-chart>
        <div class="c-table-wrap"><contour-table columns='["Region","Volume","Status"]' rows='[["North","842","Open"],["South","617","Review"]]'></contour-table></div>
      </main>`;
    return root;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("contour-layer-panel")).toBeTruthy();
    await expect(canvasElement.querySelectorAll("contour-kpi").length).toBe(3);
    await expect(canvasElement.querySelector("contour-chart")).toBeTruthy();
    // `data=` is not an attribute ContourChart reads: a chart fed that way
    // renders the empty branch, so assert the marks exist.
    await expect(canvasElement.querySelector("contour-chart .c-chart__empty")).toBeNull();
    await expect(canvasElement.querySelectorAll("contour-chart .c-chart__bar").length).toBe(5);
    await expect(canvasElement.querySelector("contour-table")).toBeTruthy();
  },
};

export const DocumentationPageDemo = {
  render: () => {
    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gridTemplateColumns = "220px 1fr";
    root.style.gap = "1rem";
    root.innerHTML = `
      <aside class="c-panel">
        <contour-toc items='[{"label":"Overview","href":"#demo-overview"},{"label":"Usage","href":"#demo-usage"}]'></contour-toc>
      </aside>
      <article>
        <h2 id="demo-overview">Overview</h2>
        <p>Contour provides composable UI primitives for spatial and analytical interfaces.</p>
        <h2 id="demo-usage">Usage</h2>
        <pre class="c-code"><code>import "contour-ds/contour.min.css";</code></pre>
        <contour-alert title="Note" body="Use semantic HTML first, then enhance."></contour-alert>
      </article>`;
    return root;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("contour-toc")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-alert")).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Overview");
  },
};

export const LandingPageDemo = {
  render: () => {
    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gap = "1.5rem";
    root.innerHTML = `
      <section class="c-hero" style="padding:2rem;border:1px solid var(--color-border)">
        <h1>Contour DS</h1>
        <p>Token-driven design system for spatial interfaces.</p>
        <button class="c-button c-button--primary">Get started</button>
      </section>
      <section style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem">
        <article class="c-card"><h3>Landing</h3><p>Expressive storytelling.</p></article>
        <article class="c-card"><h3>Documentation</h3><p>Readable technical content.</p></article>
        <article class="c-card"><h3>Dashboards</h3><p>Dense analytical views.</p></article>
      </section>
      <contour-metrics items='[{"label":"Components","value":"231"},{"label":"Tokens","value":"306"}]'></contour-metrics>`;
    return root;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector(".c-hero")).toBeTruthy();
    await expect(canvasElement.querySelectorAll(".c-card").length).toBe(3);
    await expect(canvasElement.querySelector("contour-metrics")).toBeTruthy();
  },
};

export const AnalyticsWorkspaceDemo = {
  render: () => {
    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gridTemplateColumns = "280px 1fr 240px";
    root.style.gap = "0.5rem";
    root.style.height = "80vh";
    root.innerHTML = `
      <aside class="c-panel" style="display:flex;flex-direction:column;gap:1rem">
        <h3>Data Layers</h3>
        <contour-layer-panel items='[{"name":"Base Map","visible":true},{"name":"Heatmap","visible":true},{"name":"Boundaries","visible":false}]'></contour-layer-panel>
        <h3>Time Range</h3>
        <contour-animation-controls min="0" max="11" step="1" value="0" markers='["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]' loop></contour-animation-controls>
        <h3>Filters</h3>
        <contour-filter-bar label="" items='[{"name":"metric","label":"Metric","type":"select","options":[{"value":"volume","label":"Volume"},{"value":"value","label":"Value"},{"value":"count","label":"Count"}]}' count="1"></contour-filter-bar>
      </aside>
      <main style="display:flex;flex-direction:column;gap:0.5rem">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h2>Regional Performance</h2>
          <contour-segmented items='[{"label":"Map"},{"label":"Chart"},{"label":"Table"}]' value="Chart"></contour-segmented>
        </div>
        <div style="flex:1;position:relative;border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden">
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);font-family:var(--font-mono);font-size:var(--type-sm)">
            MapLibre GL JS canvas would render here
          </div>
        </div>
      </main>
      <aside class="c-panel" style="display:flex;flex-direction:column;gap:1rem">
        <h3>Inspection</h3>
        <contour-feature-inspector title="Selected Feature" open data='{"name":"Route 66","type":"Highway","length":"3940 km","status":"Active"}'></contour-feature-inspector>
        <h3>Metrics</h3>
        <contour-kpi label="Total Length" value="3,940 km"></contour-kpi>
        <contour-kpi label="Active Segments" value="142"></contour-kpi>
        <contour-kpi label="Maintenance Alerts" value="3"></contour-kpi>
        <h3>Provenance</h3>
        <contour-provenance source="National Highway Authority" confidence="high" resolution="10m" coverage="98%" warning="Partial data for Alaska" methodology="Satellite imagery + ground survey"></contour-provenance>
      </aside>`;
    return root;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("contour-layer-panel")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-animation-controls")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-filter-bar")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-feature-inspector")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-provenance")).toBeTruthy();
  },
};

export const DocumentationPortalDemo = {
  render: () => {
    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gridTemplateColumns = "240px 1fr 200px";
    root.style.gap = "1rem";
    root.innerHTML = `
      <aside class="c-panel">
        <h3>Documentation</h3>
        <contour-docs-nav items='[{"title":"Getting Started","links":[{"label":"Introduction","href":"#intro"},{"label":"Installation","href":"#install"}]},{"title":"Components","links":[{"label":"Buttons","href":"#buttons"},{"label":"Forms","href":"#forms"}]}]'></contour-docs-nav>
      </aside>
      <article class="c-prose" style="max-width: 72ch;">
        <h2 id="intro">Introduction</h2>
        <p>Contour is a token-driven design system for spatial interfaces.</p>
        <h2 id="install">Installation</h2>
        <pre class="c-code"><code>npm install contour-ds</code></pre>
        <contour-code-tabs tabs='["npm","pnpm","yarn"]' persist>
          <div role="tabpanel" class="c-code-tabs__panel"><code>npm install contour-ds</code></div>
          <div role="tabpanel" class="c-code-tabs__panel"><code>pnpm add contour-ds</code></div>
          <div role="tabpanel" class="c-code-tabs__panel"><code>yarn add contour-ds</code></div>
        </contour-code-tabs>
        <h2 id="buttons">Buttons</h2>
        <p>Use native buttons with Contour classes.</p>
        <contour-callout type="tip" title="Tip" body="Prefer native <code><button></code> over custom elements for simple actions."></contour-callout>
      </article>
      <aside class="c-panel">
        <h3>On this page</h3>
        <contour-toc items='[{"label":"Introduction","href":"#intro"},{"label":"Installation","href":"#install"},{"label":"Buttons","href":"#buttons"}]'></contour-toc>
      </aside>`;
    return root;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("contour-docs-nav")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-code-tabs")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-callout")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-toc")).toBeTruthy();
  },
};

export const ComparisonWorkspaceDemo = {
  render: () => {
    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gridTemplateRows = "auto 1fr";
    root.style.gap = "1rem";
    root.innerHTML = `
      <header style="display:flex;justify-content:space-between;align-items:center">
        <h1>Scenario Comparison</h1>
        <div style="display:flex;gap:0.5rem">
          <contour-saved-view name="Baseline" active></contour-saved-view>
          <contour-saved-view name="Scenario A"></contour-saved-view>
          <contour-saved-view name="Scenario B"></contour-saved-view>
        </div>
      </header>
      <main style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <section>
          <h3>Scenario A — Optimistic</h3>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.5rem;margin-bottom:1rem">
            <contour-kpi label="Revenue" value="$2.4M" delta="+12%"></contour-kpi>
            <contour-kpi label="Users" value="45.2K" delta="+8%"></contour-kpi>
          </div>
          <contour-chart axis="Quarter" series='[{"label":"Optimistic","type":"bar","values":[520,580,620,680]}]'></contour-chart>
        </section>
        <section>
          <h3>Scenario B — Conservative</h3>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.5rem;margin-bottom:1rem">
            <contour-kpi label="Revenue" value="$1.9M" delta="-5%"></contour-kpi>
            <contour-kpi label="Users" value="38.1K" delta="-3%"></contour-kpi>
          </div>
          <contour-chart axis="Quarter" series='[{"label":"Conservative","type":"bar","values":[480,460,470,490]}]'></contour-chart>
        </section>
      </main>`;
    return root;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("contour-saved-view").length).toBe(3);
    await expect(canvasElement.querySelectorAll("contour-kpi").length).toBe(4);
    await expect(canvasElement.querySelectorAll("contour-chart").length).toBe(2);
    await expect(canvasElement.querySelectorAll("contour-chart .c-chart__empty").length).toBe(0);
    await expect(canvasElement.querySelectorAll("contour-chart .c-chart__bar").length).toBe(8);
  },
};