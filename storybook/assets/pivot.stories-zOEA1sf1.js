import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Data/Pivot`,tags:[`autodocs`],parameters:{a11y:{test:`error`},contour:{maturity:`complete-widget`}},argTypes:{rows:{control:`text`},columns:{control:`text`},values:{control:`text`},data:{control:`text`}}},r=(e={})=>{let t=document.createElement(`contour-pivot`);return e.rows&&t.setAttribute(`rows`,e.rows),e.columns&&t.setAttribute(`columns`,e.columns),e.values&&t.setAttribute(`values`,e.values),e.data&&t.setAttribute(`data`,e.data),t},i={args:{rows:`["region"]`,columns:`["product"]`,values:`["revenue"]`,data:JSON.stringify([{region:`North`,product:`A`,revenue:100},{region:`North`,product:`B`,revenue:200},{region:`South`,product:`A`,revenue:150}])},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-pivot`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-pivot/)}},a={args:{rows:`["region"]`,data:JSON.stringify([{region:`North`,revenue:100}])},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-pivot`);await t(n).toBeTruthy(),n.setAttribute(`rows`,`["product"]`),await t(n).toHaveAttribute(`rows`)}},o=[`Default`,`Reactivity`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    rows: '["region"]',
    columns: '["product"]',
    values: '["revenue"]',
    data: JSON.stringify([{
      region: "North",
      product: "A",
      revenue: 100
    }, {
      region: "North",
      product: "B",
      revenue: 200
    }, {
      region: "South",
      product: "A",
      revenue: 150
    }])
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const p = canvasElement.querySelector("contour-pivot");
    await expect(p).toBeTruthy();
    await expect(p).toHaveClass(/c-pivot/);
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    rows: '["region"]',
    data: JSON.stringify([{
      region: "North",
      revenue: 100
    }])
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const p = canvasElement.querySelector("contour-pivot");
    await expect(p).toBeTruthy();
    p.setAttribute("rows", '["product"]');
    await expect(p).toHaveAttribute("rows");
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{i as Default,a as Reactivity,o as __namedExportsOrder,n as default};