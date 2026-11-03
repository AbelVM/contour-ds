import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Map/TimeSlider`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{label:{control:`text`},value:{control:`text`},loop:{control:`boolean`}}},r=(e={})=>{let t=document.createElement(`contour-time-slider`);return t.setAttribute(`value`,e.value||`25`),e.label&&t.setAttribute(`label`,e.label),e.loop&&t.setAttribute(`loop`,``),t},i={args:{value:`25`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-time-slider`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-time-slider/)}},a={args:{value:`25`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-time-slider`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-time-slider/),n.setAttribute(`value`,`75`),await t(n).toBeTruthy()}},o=[`Default`,`Reactivity`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    value: "25"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const s = canvasElement.querySelector("contour-time-slider");
    await expect(s).toBeTruthy();
    await expect(s).toHaveClass(/c-time-slider/);
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    value: "25"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const s = canvasElement.querySelector("contour-time-slider");
    await expect(s).toBeTruthy();
    await expect(s).toHaveClass(/c-time-slider/);
    s.setAttribute("value", "75");
    await expect(s).toBeTruthy();
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{i as Default,a as Reactivity,o as __namedExportsOrder,n as default};