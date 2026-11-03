import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a;function o(){return(o=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Data/Gauge`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{value:{control:`number`},max:{control:`number`}}},r=(e={})=>{let t=document.createElement(`contour-gauge`);return t.setAttribute(`value`,e.value==null?`72`:String(e.value)),t.setAttribute(`max`,e.max==null?`100`:String(e.max)),t.setAttribute(`heading`,e.heading||`CPU`),t},i={args:{value:`72`,max:`100`,heading:`CPU`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-gauge`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-gauge/)}},a=[`Default`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    value: "72",
    max: "100",
    heading: "CPU"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const g = canvasElement.querySelector("contour-gauge");
    await expect(g).toBeTruthy();
    await expect(g).toHaveClass(/c-gauge/);
  }
}`,...i.parameters?.docs?.source}}}})))()}o();export{i as Default,a as __namedExportsOrder,n as default};