import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s;function c(){return(c=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Feedback/Banner`,tags:[`autodocs`],parameters:{a11y:{test:`error`},contour:{maturity:`complete-widget`}},argTypes:{message:{control:`text`},variant:{control:`select`,options:[``,`success`,`warning`,`danger`,`info`]}}},r=(e={})=>{let t=document.createElement(`contour-banner`);return e.message&&t.setAttribute(`message`,e.message),e.variant&&t.setAttribute(`variant`,e.variant),t},i={args:{message:`Deploy complete`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-banner`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-banner/),await t(e.textContent).toContain(`Deploy`)}},a={args:{message:`All systems operational`,variant:`success`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-banner`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-banner--success/)}},o={args:{message:`Original`,variant:`info`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-banner`);await t(n).toBeTruthy(),n.setAttribute(`variant`,`danger`),await t(n).toHaveClass(/c-banner--danger/),await t(n).not.toHaveClass(/c-banner--info/)}},s=[`Default`,`Success`,`Reactivity`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    message: "Deploy complete"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const b = canvasElement.querySelector("contour-banner");
    await expect(b).toBeTruthy();
    await expect(b).toHaveClass(/c-banner/);
    await expect(canvasElement.textContent).toContain("Deploy");
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    message: "All systems operational",
    variant: "success"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const b = canvasElement.querySelector("contour-banner");
    await expect(b).toBeTruthy();
    await expect(b).toHaveClass(/c-banner--success/);
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    message: "Original",
    variant: "info"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const b = canvasElement.querySelector("contour-banner");
    await expect(b).toBeTruthy();
    b.setAttribute("variant", "danger");
    await expect(b).toHaveClass(/c-banner--danger/);
    await expect(b).not.toHaveClass(/c-banner--info/);
  }
}`,...o.parameters?.docs?.source}}}})))()}c();export{i as Default,o as Reactivity,a as Success,s as __namedExportsOrder,n as default};