import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s,c,l,u,d;function f(){return(f=e((()=>{({expect:t,userEvent:n}=__STORYBOOK_MODULE_TEST__),r={title:`Contour/Data/Table`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{columns:{control:`text`},rows:{control:`text`},page:{control:`text`},"page-size":{control:`text`},"sort-dir":{control:`text`}}},i=JSON.stringify([{key:`name`,label:`Name`},{key:`value`,label:`Value`}]),a=JSON.stringify([[`Alpha`,`1`],[`Beta`,`2`]]),o={render:(e={})=>{let t=document.createElement(`div`);t.className=`c-table-wrap`;let n=document.createElement(`contour-table`);return n.setAttribute(`columns`,e.columns||i),n.setAttribute(`rows`,e.rows||a),e.page&&n.setAttribute(`page`,e.page),t.appendChild(n),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-table`);await t(n).toBeTruthy(),await t(e.querySelector(`table.c-table`)).toBeTruthy(),await t(n.textContent).toContain(`Alpha`)}},s={render:(e={})=>{let t=document.createElement(`div`);t.className=`c-table-wrap`;let n=document.createElement(`contour-table`);return n.setAttribute(`loading`,e.loading||`Loading…`),t.appendChild(n),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-table`);await t(n).toBeTruthy()}},c={render:(e={})=>{let t=document.createElement(`div`);t.className=`c-table-wrap`;let n=document.createElement(`contour-table`);return n.setAttribute(`empty`,e.empty||`No rows`),t.appendChild(n),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-table`);await t(n).toBeTruthy()}},l={render:o.render,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-table`);n.rows=JSON.stringify([[`Gamma`,`3`]]),await t(n).toHaveAttribute(`rows`,JSON.stringify([[`Gamma`,`3`]])),await t(n.textContent).toContain(`Gamma`),await t(n.textContent).not.toContain(`Alpha`)}},u={render:(e={})=>{let t=document.createElement(`div`);t.className=`c-table-wrap`;let n=document.createElement(`contour-table`);return n.setAttribute(`columns`,e.columns||i),n.setAttribute(`rows`,e.rows||a),e.page&&n.setAttribute(`page`,e.page),n.setAttribute(`error`,`Could not load rows`),n.setAttribute(`retry`,`Try again`),t.appendChild(n),t},play:async({canvasElement:e})=>{let r=e.querySelector(`contour-table`),i=e.querySelector(`.c-table-wrap`),a=null;i.addEventListener(`contour:retry`,e=>{a=e.detail}),await t(e.textContent).toContain(`Could not load rows`),await n.click(r.querySelector(`button[data-action='retry']`)),await t(a).toEqual({src:null})}},d=[`Default`,`Loading`,`Empty`,`TableControlledRows`,`ErrorRetry`],o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const wrap = document.createElement("div");
    wrap.className = "c-table-wrap";
    const table = document.createElement("contour-table");
    table.setAttribute("columns", args.columns || COLS);
    table.setAttribute("rows", args.rows || ROWS);
    if (args.page) table.setAttribute("page", args.page);
    wrap.appendChild(table);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const table = canvasElement.querySelector("contour-table");
    await expect(table).toBeTruthy();
    await expect(canvasElement.querySelector("table.c-table")).toBeTruthy();
    await expect(table.textContent).toContain("Alpha");
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const wrap = document.createElement("div");
    wrap.className = "c-table-wrap";
    const table = document.createElement("contour-table");
    table.setAttribute("loading", args.loading || "Loading…");
    wrap.appendChild(table);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const table = canvasElement.querySelector("contour-table");
    await expect(table).toBeTruthy();
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const wrap = document.createElement("div");
    wrap.className = "c-table-wrap";
    const table = document.createElement("contour-table");
    table.setAttribute("empty", args.empty || "No rows");
    wrap.appendChild(table);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const table = canvasElement.querySelector("contour-table");
    await expect(table).toBeTruthy();
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: Default.render,
  play: async ({
    canvasElement
  }) => {
    const table = canvasElement.querySelector("contour-table");
    table.rows = JSON.stringify([["Gamma", "3"]]);
    await expect(table).toHaveAttribute("rows", JSON.stringify([["Gamma", "3"]]));
    await expect(table.textContent).toContain("Gamma");
    await expect(table.textContent).not.toContain("Alpha");
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const wrap = document.createElement("div");
    wrap.className = "c-table-wrap";
    const table = document.createElement("contour-table");
    table.setAttribute("columns", args.columns || COLS);
    table.setAttribute("rows", args.rows || ROWS);
    if (args.page) table.setAttribute("page", args.page);
    table.setAttribute("error", "Could not load rows");
    table.setAttribute("retry", "Try again");
    wrap.appendChild(table);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const table = canvasElement.querySelector("contour-table");
    const wrapper = canvasElement.querySelector(".c-table-wrap");
    let detail = null;
    wrapper.addEventListener("contour:retry", event => {
      detail = event.detail;
    });
    await expect(canvasElement.textContent).toContain("Could not load rows");
    await userEvent.click(table.querySelector("button[data-action='retry']"));
    await expect(detail).toEqual({
      src: null
    });
  }
}`,...u.parameters?.docs?.source}}}})))()}f();export{o as Default,c as Empty,u as ErrorRetry,s as Loading,l as TableControlledRows,d as __namedExportsOrder,r as default};