import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s,c;function l(){return(l=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Data/DataGrid`,tags:[`autodocs`],parameters:{a11y:{test:`error`},contour:{maturity:`complete-widget`}},argTypes:{columns:{control:`text`},rows:{control:`text`},"page-size":{control:`text`},filter:{control:`boolean`},virtual:{control:`boolean`}}},r=e=>Array.from({length:e},(e,t)=>({id:t+1,name:`Row ${t+1}`,value:(t+1)*10})),i=(e={})=>{let t=document.createElement(`contour-data-grid`);return e.columns&&t.setAttribute(`columns`,e.columns),e.rows&&t.setAttribute(`rows`,e.rows),e[`page-size`]&&t.setAttribute(`page-size`,e[`page-size`]),e.filter&&t.setAttribute(`filter`,``),e.virtual&&t.setAttribute(`virtual`,``),t},a={args:{columns:`[{"key":"id","label":"ID"},{"key":"name","label":"Name"},{"key":"value","label":"Value"}]`,rows:JSON.stringify(r(10)),"page-size":`5`},render:i,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-data-grid`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-data-grid/);let r=n.querySelector(`table`);await t(r).toBeTruthy()}},o={args:{columns:`[{"key":"name","label":"Name"},{"key":"value","label":"Value"}]`,rows:JSON.stringify(r(20)),"page-size":`10`},render:i,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-data-grid`);await t(n).toBeTruthy();let r=n.querySelector(`table`);await t(r).toBeTruthy()}},s={args:{columns:`[{"key":"name","label":"Name"}]`,rows:JSON.stringify(r(5))},render:i,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-data-grid`);await t(n).toBeTruthy(),n.setAttribute(`rows`,JSON.stringify(r(3))),await t(n).toHaveAttribute(`rows`)}},c=[`Default`,`Filterable`,`Reactivity`],a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    columns: '[{"key":"id","label":"ID"},{"key":"name","label":"Name"},{"key":"value","label":"Value"}]',
    rows: JSON.stringify(makeRows(10)),
    "page-size": "5"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const g = canvasElement.querySelector("contour-data-grid");
    await expect(g).toBeTruthy();
    await expect(g).toHaveClass(/c-data-grid/);
    const table = g.querySelector("table");
    await expect(table).toBeTruthy();
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    columns: '[{"key":"name","label":"Name"},{"key":"value","label":"Value"}]',
    rows: JSON.stringify(makeRows(20)),
    "page-size": "10"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const g = canvasElement.querySelector("contour-data-grid");
    await expect(g).toBeTruthy();
    const table = g.querySelector("table");
    await expect(table).toBeTruthy();
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    columns: '[{"key":"name","label":"Name"}]',
    rows: JSON.stringify(makeRows(5))
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const g = canvasElement.querySelector("contour-data-grid");
    await expect(g).toBeTruthy();
    g.setAttribute("rows", JSON.stringify(makeRows(3)));
    await expect(g).toHaveAttribute("rows");
  }
}`,...s.parameters?.docs?.source}}}})))()}l();export{a as Default,o as Filterable,s as Reactivity,c as __namedExportsOrder,n as default};