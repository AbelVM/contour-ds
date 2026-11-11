import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Compositions/RealWorldDemos`,tags:[`autodocs`],parameters:{contour:{maturity:`composition`}}},r={render:()=>{let e=document.createElement(`div`);return e.style.display=`grid`,e.style.gridTemplateColumns=`260px 1fr`,e.style.gap=`1rem`,e.innerHTML=`
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
        <contour-chart type="bar" axis="Weekly volume" data='{"labels":["Mon","Tue","Wed","Thu","Fri"],"values":[12,18,15,23,28]}'></contour-chart>
        <div class="c-table-wrap"><contour-table columns='["Region","Volume","Status"]' rows='[["North","842","Open"],["South","617","Review"]]'></contour-table></div>
      </main>`,e},play:async({canvasElement:e})=>{await t(e.querySelector(`contour-layer-panel`)).toBeTruthy(),await t(e.querySelectorAll(`contour-kpi`).length).toBe(3),await t(e.querySelector(`contour-chart`)).toBeTruthy(),await t(e.querySelector(`contour-table`)).toBeTruthy()}},i={render:()=>{let e=document.createElement(`div`);return e.style.display=`grid`,e.style.gridTemplateColumns=`220px 1fr`,e.style.gap=`1rem`,e.innerHTML=`
      <aside class="c-panel">
        <contour-toc items='[{"label":"Overview","href":"#demo-overview"},{"label":"Usage","href":"#demo-usage"}]'></contour-toc>
      </aside>
      <article>
        <h2 id="demo-overview">Overview</h2>
        <p>Contour provides composable UI primitives for spatial and analytical interfaces.</p>
        <h2 id="demo-usage">Usage</h2>
        <pre class="c-code"><code>import "contour-ds/contour.min.css";</code></pre>
        <contour-alert title="Note" body="Use semantic HTML first, then enhance."></contour-alert>
      </article>`,e},play:async({canvasElement:e})=>{await t(e.querySelector(`contour-toc`)).toBeTruthy(),await t(e.querySelector(`contour-alert`)).toBeTruthy(),await t(e.textContent).toContain(`Overview`)}},a={render:()=>{let e=document.createElement(`div`);return e.style.display=`grid`,e.style.gap=`1.5rem`,e.innerHTML=`
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
      <contour-metrics items='[{"label":"Components","value":"231"},{"label":"Tokens","value":"306"}]'></contour-metrics>`,e},play:async({canvasElement:e})=>{await t(e.querySelector(`.c-hero`)).toBeTruthy(),await t(e.querySelectorAll(`.c-card`).length).toBe(3),await t(e.querySelector(`contour-metrics`)).toBeTruthy()}},o=[`SpatialDashboardDemo`,`DocumentationPageDemo`,`LandingPageDemo`],r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gridTemplateColumns = "260px 1fr";
    root.style.gap = "1rem";
    root.innerHTML = \`
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
        <contour-chart type="bar" axis="Weekly volume" data='{"labels":["Mon","Tue","Wed","Thu","Fri"],"values":[12,18,15,23,28]}'></contour-chart>
        <div class="c-table-wrap"><contour-table columns='["Region","Volume","Status"]' rows='[["North","842","Open"],["South","617","Review"]]'></contour-table></div>
      </main>\`;
    return root;
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement.querySelector("contour-layer-panel")).toBeTruthy();
    await expect(canvasElement.querySelectorAll("contour-kpi").length).toBe(3);
    await expect(canvasElement.querySelector("contour-chart")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-table")).toBeTruthy();
  }
}`,...r.parameters?.docs?.source}}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gridTemplateColumns = "220px 1fr";
    root.style.gap = "1rem";
    root.innerHTML = \`
      <aside class="c-panel">
        <contour-toc items='[{"label":"Overview","href":"#demo-overview"},{"label":"Usage","href":"#demo-usage"}]'></contour-toc>
      </aside>
      <article>
        <h2 id="demo-overview">Overview</h2>
        <p>Contour provides composable UI primitives for spatial and analytical interfaces.</p>
        <h2 id="demo-usage">Usage</h2>
        <pre class="c-code"><code>import "contour-ds/contour.min.css";</code></pre>
        <contour-alert title="Note" body="Use semantic HTML first, then enhance."></contour-alert>
      </article>\`;
    return root;
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement.querySelector("contour-toc")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-alert")).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Overview");
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gap = "1.5rem";
    root.innerHTML = \`
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
      <contour-metrics items='[{"label":"Components","value":"231"},{"label":"Tokens","value":"306"}]'></contour-metrics>\`;
    return root;
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement.querySelector(".c-hero")).toBeTruthy();
    await expect(canvasElement.querySelectorAll(".c-card").length).toBe(3);
    await expect(canvasElement.querySelector("contour-metrics")).toBeTruthy();
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{i as DocumentationPageDemo,a as LandingPageDemo,r as SpatialDashboardDemo,o as __namedExportsOrder,n as default};