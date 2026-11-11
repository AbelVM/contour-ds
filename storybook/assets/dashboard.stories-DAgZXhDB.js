import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s,c,l,u,d;function f(){return(f=e((()=>{({expect:t,userEvent:n}=__STORYBOOK_MODULE_TEST__),r={title:`Contour/Workflows/Dashboard`,tags:[`autodocs`],parameters:{contour:{maturity:`composition`}}},i={render:(e={})=>{let t=document.createElement(`div`);t.style.display=`grid`,t.style.gap=`1rem`;let n=document.createElement(`contour-kpi`);n.setAttribute(`label`,`Active users`),n.setAttribute(`value`,`1,234`);let r=document.createElement(`contour-chart`);r.setAttribute(`type`,`bar`),r.setAttribute(`axis`,`Weekly activity`),r.setAttribute(`data`,JSON.stringify({labels:[`Mon`,`Tue`],values:[10,20]}));let i=document.createElement(`div`);i.className=`c-table-wrap`;let a=document.createElement(`contour-table`);return a.innerHTML=`<table class='c-table'><thead><tr><th>Region</th></tr></thead><tbody><tr><td>North</td></tr></tbody></table>`,i.appendChild(a),t.appendChild(n),t.appendChild(r),t.appendChild(i),t},play:async({canvasElement:e})=>{await t(e.querySelector(`contour-kpi`)).toBeTruthy(),await t(e.querySelector(`contour-chart`)).toBeTruthy(),await t(e.querySelector(`contour-table`)).toBeTruthy(),await t(e.textContent).toContain(`Active users`)}},a={render:(e={})=>{let t=document.createElement(`div`),n=document.createElement(`contour-input`);n.setAttribute(`name`,`filter`),n.setAttribute(`placeholder`,`Filter regions`);let r=document.createElement(`div`);r.className=`c-table-wrap`;let i=document.createElement(`contour-table`);return i.setAttribute(`columns`,JSON.stringify([{key:`region`,label:`Region`}])),i.setAttribute(`rows`,JSON.stringify([[`North`],[`South`]])),r.appendChild(i),t.append(n,r),t.addEventListener(`contour:input`,e=>{let t=e.detail.value;i.rows=JSON.stringify(t?[[t]]:[[`North`],[`South`]])}),t},play:async({canvasElement:e})=>{let r=e.querySelector(`input`),i=e.querySelector(`contour-table`);await n.type(r,`West`),await t(i.textContent).toContain(`West`),await t(i.textContent).not.toContain(`North`)}},o={render:()=>{let e=document.createElement(`div`);e.style.display=`grid`,e.style.gap=`0.5rem`;let t=document.createElement(`contour-saved-view`);return t.setAttribute(`name`,`default-view`),e.appendChild(t),e},play:async({canvasElement:e})=>{await t(e.querySelector(`contour-saved-view`)).toBeTruthy(),await t(e.querySelectorAll(`button`).length).toBe(2)}},s={render:()=>{let e=document.createElement(`div`);e.style.display=`grid`,e.style.gap=`0.5rem`;let t=document.createElement(`contour-provenance`);return t.setAttribute(`source`,`OpenStreetMap contributors`),t.setAttribute(`confidence`,`high`),t.setAttribute(`resolution`,`10m`),t.setAttribute(`coverage`,`95%`),t.setAttribute(`methodology`,`Automated extraction with manual review`),t.setAttribute(`warning`,`Data may be outdated in rural areas`),e.appendChild(t),e},play:async({canvasElement:e})=>{await t(e.querySelector(`contour-provenance`)).toBeTruthy(),await t(e.textContent).toContain(`OpenStreetMap`),await t(e.textContent).toContain(`Confidence: high`)}},c={id:`feature-inspector`,render:()=>{let e=document.createElement(`div`);e.style.display=`grid`,e.style.gap=`0.5rem`;let t=document.createElement(`contour-feature-inspector`);return t.setAttribute(`title`,`Route 42`),t.setAttribute(`open`,``),t.setAttribute(`data`,JSON.stringify({length:`12.4 km`,elevation:`340 m`,surface:`paved`})),e.appendChild(t),e},play:async({canvasElement:e})=>{await t(e.querySelector(`contour-feature-inspector`)).toBeTruthy(),await t(e.textContent).toContain(`Route 42`)}},l={id:`split-view`,render:()=>{let e=document.createElement(`div`);e.style.display=`grid`,e.style.gap=`0.5rem`,e.style.height=`300px`;let t=document.createElement(`contour-split-view`);return t.setAttribute(`value`,`50`),t.innerHTML=`
      <div class="c-split-view__pane c-split-view__pane--left" style="background:var(--color-surface-1)">Left pane</div>
      <div class="c-split-view__pane c-split-view__pane--right" style="background:var(--color-surface-2)">Right pane</div>
    `,e.appendChild(t),e},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-split-view`);await t(n).toBeTruthy();let r=e.querySelector(`.c-split-view__divider`);await t(r).toBeTruthy();let i=e.querySelector(`contour-feature-inspector`);await t(i).toBeNull()}},u={render:()=>{let e=document.createElement(`div`);e.style.display=`grid`,e.style.gap=`0.5rem`;let t=document.createElement(`contour-activity-feed`);return t.innerHTML=`
      <div class="c-activity-feed__item c-activity-feed__item--unread" tabindex="0">
        <span class="c-activity-feed__text">Route 42 updated</span>
        <span class="c-activity-feed__time">2 min ago</span>
      </div>
      <div class="c-activity-feed__item" tabindex="0">
        <span class="c-activity-feed__text">New alert in North region</span>
        <span class="c-activity-feed__time">15 min ago</span>
      </div>
    `,e.appendChild(t),e},play:async({canvasElement:e})=>{await t(e.querySelector(`contour-activity-feed`)).toBeTruthy(),await t(e.querySelectorAll(`.c-activity-feed__item`).length).toBe(2),await t(e.querySelectorAll(`button`).length).toBe(2)}},d=[`Default`,`DashboardFilterToData`,`SavedView`,`Provenance`,`FeatureInspector`,`SplitView`,`ActivityFeed`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "1rem";
    const kpi = document.createElement("contour-kpi");
    kpi.setAttribute("label", "Active users");
    kpi.setAttribute("value", "1,234");
    const chart = document.createElement("contour-chart");
    chart.setAttribute("type", "bar");
    chart.setAttribute("axis", "Weekly activity");
    chart.setAttribute("data", JSON.stringify({
      labels: ["Mon", "Tue"],
      values: [10, 20]
    }));
    const tableWrap = document.createElement("div");
    tableWrap.className = "c-table-wrap";
    const table = document.createElement("contour-table");
    table.innerHTML = "<table class='c-table'><thead><tr><th>Region</th></tr></thead><tbody><tr><td>North</td></tr></tbody></table>";
    tableWrap.appendChild(table);
    wrap.appendChild(kpi);
    wrap.appendChild(chart);
    wrap.appendChild(tableWrap);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement.querySelector("contour-kpi")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-chart")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-table")).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Active users");
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const wrap = document.createElement("div");
    const input = document.createElement("contour-input");
    input.setAttribute("name", "filter");
    input.setAttribute("placeholder", "Filter regions");
    const tableWrap = document.createElement("div");
    tableWrap.className = "c-table-wrap";
    const table = document.createElement("contour-table");
    table.setAttribute("columns", JSON.stringify([{
      key: "region",
      label: "Region"
    }]));
    table.setAttribute("rows", JSON.stringify([["North"], ["South"]]));
    tableWrap.appendChild(table);
    wrap.append(input, tableWrap);
    wrap.addEventListener("contour:input", event => {
      const value = event.detail.value;
      const rows = value ? [[value]] : [["North"], ["South"]];
      table.rows = JSON.stringify(rows);
    });
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const input = canvasElement.querySelector("input");
    const table = canvasElement.querySelector("contour-table");
    await userEvent.type(input, "West");
    await expect(table.textContent).toContain("West");
    await expect(table.textContent).not.toContain("North");
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "0.5rem";
    const saved = document.createElement("contour-saved-view");
    saved.setAttribute("name", "default-view");
    wrap.appendChild(saved);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement.querySelector("contour-saved-view")).toBeTruthy();
    await expect(canvasElement.querySelectorAll("button").length).toBe(2);
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "0.5rem";
    const prov = document.createElement("contour-provenance");
    prov.setAttribute("source", "OpenStreetMap contributors");
    prov.setAttribute("confidence", "high");
    prov.setAttribute("resolution", "10m");
    prov.setAttribute("coverage", "95%");
    prov.setAttribute("methodology", "Automated extraction with manual review");
    prov.setAttribute("warning", "Data may be outdated in rural areas");
    wrap.appendChild(prov);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement.querySelector("contour-provenance")).toBeTruthy();
    await expect(canvasElement.textContent).toContain("OpenStreetMap");
    await expect(canvasElement.textContent).toContain("Confidence: high");
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  id: "feature-inspector",
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "0.5rem";
    const inspector = document.createElement("contour-feature-inspector");
    inspector.setAttribute("title", "Route 42");
    inspector.setAttribute("open", "");
    inspector.setAttribute("data", JSON.stringify({
      length: "12.4 km",
      elevation: "340 m",
      surface: "paved"
    }));
    wrap.appendChild(inspector);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement.querySelector("contour-feature-inspector")).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Route 42");
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  id: "split-view",
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "0.5rem";
    wrap.style.height = "300px";
    const split = document.createElement("contour-split-view");
    split.setAttribute("value", "50");
    split.innerHTML = \`
      <div class="c-split-view__pane c-split-view__pane--left" style="background:var(--color-surface-1)">Left pane</div>
      <div class="c-split-view__pane c-split-view__pane--right" style="background:var(--color-surface-2)">Right pane</div>
    \`;
    wrap.appendChild(split);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    // SplitView test - verify split view renders with divider
    const split = canvasElement.querySelector("contour-split-view");
    await expect(split).toBeTruthy();
    const divider = canvasElement.querySelector(".c-split-view__divider");
    await expect(divider).toBeTruthy();
    // Verify it's not the feature inspector
    const inspector = canvasElement.querySelector("contour-feature-inspector");
    await expect(inspector).toBeNull();
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "0.5rem";
    const feed = document.createElement("contour-activity-feed");
    feed.innerHTML = \`
      <div class="c-activity-feed__item c-activity-feed__item--unread" tabindex="0">
        <span class="c-activity-feed__text">Route 42 updated</span>
        <span class="c-activity-feed__time">2 min ago</span>
      </div>
      <div class="c-activity-feed__item" tabindex="0">
        <span class="c-activity-feed__text">New alert in North region</span>
        <span class="c-activity-feed__time">15 min ago</span>
      </div>
    \`;
    wrap.appendChild(feed);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement.querySelector("contour-activity-feed")).toBeTruthy();
    await expect(canvasElement.querySelectorAll(".c-activity-feed__item").length).toBe(2);
    await expect(canvasElement.querySelectorAll("button").length).toBe(2);
  }
}`,...u.parameters?.docs?.source}}}})))()}f();export{u as ActivityFeed,a as DashboardFilterToData,i as Default,c as FeatureInspector,s as Provenance,o as SavedView,l as SplitView,d as __namedExportsOrder,r as default};