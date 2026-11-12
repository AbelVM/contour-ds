import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{i as t,r as n}from"./metadata-Bv5oBLsO.js";var r,i,a,o,s,c,l;function u(){return(u=e((()=>{n(),{expect:r}=__STORYBOOK_MODULE_TEST__,i={title:`Contour/UI/Tag`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{variant:t(`c-tag`),removable:{control:`boolean`},label:{control:`text`}}},a=(e={})=>{let t=document.createElement(`contour-tag`);return e.variant&&t.setAttribute(`variant`,e.variant),e.removable&&t.setAttribute(`removable`,``),e.label?t.setAttribute(`label`,e.label):t.setAttribute(`label`,`v1.2`),t},o={args:{label:`v1.2`},render:a,play:async({canvasElement:e})=>{let t=e.querySelector(`contour-tag`);await r(t).toBeTruthy(),await r(t).toHaveClass(/c-tag/),await r(e.textContent).toContain(`v1.2`)}},s={args:{removable:!0,label:`beta`},render:a,play:async({canvasElement:e})=>{let t=e.querySelector(`contour-tag`);await r(t).toBeTruthy();let n=t.querySelector(`.c-tag__remove`);await r(n).toBeTruthy()}},c={args:{label:`Route`},render:a,play:async({canvasElement:e})=>{let t=e.querySelector(`contour-tag`);await r(t).toBeTruthy(),await r(e.textContent).toContain(`Route`)}},l=[`Default`,`Removable`,`WithIcon`],o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    label: "v1.2"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const t = canvasElement.querySelector("contour-tag");
    await expect(t).toBeTruthy();
    await expect(t).toHaveClass(/c-tag/);
    await expect(canvasElement.textContent).toContain("v1.2");
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    removable: true,
    label: "beta"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const t = canvasElement.querySelector("contour-tag");
    await expect(t).toBeTruthy();
    const remove = t.querySelector(".c-tag__remove");
    await expect(remove).toBeTruthy();
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Route"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const t = canvasElement.querySelector("contour-tag");
    await expect(t).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Route");
  }
}`,...c.parameters?.docs?.source}}}})))()}u();export{o as Default,s as Removable,c as WithIcon,l as __namedExportsOrder,i as default};