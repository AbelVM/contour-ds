import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s;function c(){return(c=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Data/QueryBuilder`,tags:[`autodocs`],parameters:{a11y:{test:`error`},contour:{maturity:`complete-widget`}},argTypes:{fields:{control:`text`},query:{control:`text`}}},r=(e={})=>{let t=document.createElement(`contour-query-builder`);return e.fields&&t.setAttribute(`fields`,e.fields),e.query&&t.setAttribute(`query`,e.query),t},i={args:{fields:`["status","region","population"]`,query:`[{"field":"status","op":"=","value":"active"}]`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-query-builder`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-query-builder/);let r=n.querySelector(`.c-query-builder__row`);await t(r).toBeTruthy()}},a={args:{fields:`["status","region"]`,query:`[{"field":"status","op":"=","value":"active"},{"field":"region","op":"contains","value":"north","connector":"OR"}]`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-query-builder`);await t(n).toBeTruthy();let r=n.querySelectorAll(`.c-query-builder__row`);await t(r.length).toBe(2);let i=n.querySelector(`.c-query-builder__connector`);await t(i).toBeTruthy()}},o={args:{fields:`["status"]`,query:`[{"field":"status","op":"=","value":"active"},{"field":"status","op":"=","value":"pending"}]`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-query-builder`);await t(n).toBeTruthy();let r=n.querySelector(`.c-query-builder__remove`);await t(r).toBeTruthy(),r.click();let i=n.querySelectorAll(`.c-query-builder__row`);await t(i.length).toBe(1)}},s=[`Default`,`MultipleRules`,`RemoveRule`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    fields: '["status","region","population"]',
    query: '[{"field":"status","op":"=","value":"active"}]'
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const q = canvasElement.querySelector("contour-query-builder");
    await expect(q).toBeTruthy();
    await expect(q).toHaveClass(/c-query-builder/);
    const row = q.querySelector(".c-query-builder__row");
    await expect(row).toBeTruthy();
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    fields: '["status","region"]',
    query: '[{"field":"status","op":"=","value":"active"},{"field":"region","op":"contains","value":"north","connector":"OR"}]'
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const q = canvasElement.querySelector("contour-query-builder");
    await expect(q).toBeTruthy();
    const rows = q.querySelectorAll(".c-query-builder__row");
    await expect(rows.length).toBe(2);
    const connector = q.querySelector(".c-query-builder__connector");
    await expect(connector).toBeTruthy();
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    fields: '["status"]',
    query: '[{"field":"status","op":"=","value":"active"},{"field":"status","op":"=","value":"pending"}]'
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const q = canvasElement.querySelector("contour-query-builder");
    await expect(q).toBeTruthy();
    const removeBtn = q.querySelector(".c-query-builder__remove");
    await expect(removeBtn).toBeTruthy();
    removeBtn.click();
    const rows = q.querySelectorAll(".c-query-builder__row");
    await expect(rows.length).toBe(1);
  }
}`,...o.parameters?.docs?.source}}}})))()}c();export{i as Default,a as MultipleRules,o as RemoveRule,s as __namedExportsOrder,n as default};