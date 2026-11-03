import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s,c,l;function u(){return(u=e((()=>{({expect:t,userEvent:n}=__STORYBOOK_MODULE_TEST__),r={title:`Contour/Data/DataGrid`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{columns:{control:`text`},rows:{control:`text`},filter:{control:`text`},virtual:{control:`boolean`},"page-size":{control:`text`},resizable:{control:`boolean`}}},i=JSON.stringify([`Name`,`Value`]),a=JSON.stringify(Array.from({length:100},(e,t)=>({Name:`Row ${t}`,Value:t}))),o=(e={})=>{let t=document.createElement(`contour-data-grid`);return t.setAttribute(`columns`,e.columns||i),t.setAttribute(`rows`,e.rows||a),e.filter&&t.setAttribute(`filter`,e.filter),e.virtual&&t.setAttribute(`virtual`,``),e[`page-size`]&&t.setAttribute(`page-size`,e[`page-size`]),e.resizable&&t.setAttribute(`resizable`,``),t},s={args:{columns:i,rows:a,virtual:!0},render:o,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-data-grid`);await t(n).toHaveClass(/c-data-grid/);let r=n.querySelector(`.c-data-grid__table`);await t(r).toBeTruthy();let i=n.querySelector(`.c-data-grid__wrap`);await t(i).toBeTruthy();let a=r.querySelectorAll(`tbody tr`);await t(a.length).toBeLessThan(100)}},c={args:{columns:i,rows:a,filter:`Row 1`},render:o,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-data-grid`);await t(n).toHaveClass(/c-data-grid/);let r=n.querySelector(`.c-data-grid__table`);await t(r).toBeTruthy();let i=r.querySelectorAll(`tbody tr`);await t(i.length).toBeLessThan(100)}},l=[`VirtualWindowing`,`SortAndFilter`],s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    columns: COLS,
    rows: ROWS,
    virtual: true
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const g = canvasElement.querySelector("contour-data-grid");
    await expect(g).toHaveClass(/c-data-grid/);
    const table = g.querySelector(".c-data-grid__table");
    await expect(table).toBeTruthy();
    const wrap = g.querySelector(".c-data-grid__wrap");
    await expect(wrap).toBeTruthy();
    const rows = table.querySelectorAll("tbody tr");
    await expect(rows.length).toBeLessThan(100);
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    columns: COLS,
    rows: ROWS,
    filter: "Row 1"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const g = canvasElement.querySelector("contour-data-grid");
    await expect(g).toHaveClass(/c-data-grid/);
    const table = g.querySelector(".c-data-grid__table");
    await expect(table).toBeTruthy();
    const rows = table.querySelectorAll("tbody tr");
    await expect(rows.length).toBeLessThan(100);
  }
}`,...c.parameters?.docs?.source}}}})))()}u();export{c as SortAndFilter,s as VirtualWindowing,l as __namedExportsOrder,r as default};