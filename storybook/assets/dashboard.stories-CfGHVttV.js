import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t,userEvent:n}=__STORYBOOK_MODULE_TEST__),r={title:`Contour/Workflows/Dashboard`,tags:[`autodocs`],parameters:{contour:{maturity:`composition`}}},i={render:(e={})=>{let t=document.createElement(`div`);t.style.display=`grid`,t.style.gap=`1rem`;let n=document.createElement(`contour-kpi`);n.setAttribute(`label`,`Active users`),n.setAttribute(`value`,`1,234`);let r=document.createElement(`contour-chart`);r.setAttribute(`type`,`bar`),r.setAttribute(`axis`,`Weekly activity`),r.setAttribute(`data`,JSON.stringify({labels:[`Mon`,`Tue`],values:[10,20]}));let i=document.createElement(`div`);i.className=`c-table-wrap`;let a=document.createElement(`contour-table`);return a.innerHTML=`<table class='c-table'><thead><tr><th>Region</th></tr></thead><tbody><tr><td>North</td></tr></tbody></table>`,i.appendChild(a),t.appendChild(n),t.appendChild(r),t.appendChild(i),t},play:async({canvasElement:e})=>{await t(e.querySelector(`contour-kpi`)).toBeTruthy(),await t(e.querySelector(`contour-chart`)).toBeTruthy(),await t(e.querySelector(`contour-table`)).toBeTruthy(),await t(e.textContent).toContain(`Active users`)}},a={render:(e={})=>{let t=document.createElement(`div`),n=document.createElement(`contour-input`);n.setAttribute(`name`,`filter`),n.setAttribute(`placeholder`,`Filter regions`);let r=document.createElement(`div`);r.className=`c-table-wrap`;let i=document.createElement(`contour-table`);return i.setAttribute(`columns`,JSON.stringify([{key:`region`,label:`Region`}])),i.setAttribute(`rows`,JSON.stringify([[`North`],[`South`]])),r.appendChild(i),t.append(n,r),t.addEventListener(`contour:input`,e=>{let t=e.detail.value;i.rows=JSON.stringify(t?[[t]]:[[`North`],[`South`]])}),t},play:async({canvasElement:e})=>{let r=e.querySelector(`input`),i=e.querySelector(`contour-table`);await n.type(r,`West`),await t(i.textContent).toContain(`West`),await t(i.textContent).not.toContain(`North`)}},o=[`Default`,`DashboardFilterToData`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
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
}`,...a.parameters?.docs?.source}}}})))()}s();export{a as DashboardFilterToData,i as Default,o as __namedExportsOrder,r as default};