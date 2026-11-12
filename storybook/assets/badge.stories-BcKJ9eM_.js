import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{i as t,r as n}from"./metadata-BS3b2Up8.js";var r,i,a,o,s,c,l;function u(){return(u=e((()=>{n(),{expect:r}=__STORYBOOK_MODULE_TEST__,i={title:`Contour/UI/Badge`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{variant:t(`c-badge`),label:{control:`text`},size:{control:`text`},removable:{control:`boolean`}}},a=(e={})=>{let t=document.createElement(`contour-badge`);return e.variant&&t.setAttribute(`variant`,e.variant),e.size&&t.setAttribute(`size`,e.size),e.removable&&t.setAttribute(`removable`,``),t.textContent=e.label?e.label:`New`,t},o={args:{label:`New`},render:a,play:async({canvasElement:e})=>{let t=e.querySelector(`contour-badge`);await r(t).toBeTruthy(),await r(t).toHaveClass(/c-badge/),await r(e.textContent).toContain(`New`)}},s={args:{variant:`primary`,label:`3`},render:a,play:async({canvasElement:e})=>{let t=e.querySelector(`contour-badge`);await r(t).toBeTruthy(),await r(t).toHaveClass(/c-badge/),await r(e.textContent).toContain(`3`)}},c={args:{removable:!0,label:`Tag`},render:a,play:async({canvasElement:e})=>{let t=e.querySelector(`contour-badge`);await r(t).toBeTruthy(),await r(t).toHaveClass(/c-badge/),await r(t).toHaveAttribute(`removable`,``);let n=t.querySelector(`.c-badge__remove`);await r(n).toBeTruthy()}},l=[`Default`,`Count`,`Removable`],o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    label: "New"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const b = canvasElement.querySelector("contour-badge");
    await expect(b).toBeTruthy();
    await expect(b).toHaveClass(/c-badge/);
    await expect(canvasElement.textContent).toContain("New");
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "primary",
    label: "3"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const b = canvasElement.querySelector("contour-badge");
    await expect(b).toBeTruthy();
    await expect(b).toHaveClass(/c-badge/);
    await expect(canvasElement.textContent).toContain("3");
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    removable: true,
    label: "Tag"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const b = canvasElement.querySelector("contour-badge");
    await expect(b).toBeTruthy();
    await expect(b).toHaveClass(/c-badge/);
    await expect(b).toHaveAttribute("removable", "");
    const remove = b.querySelector(".c-badge__remove");
    await expect(remove).toBeTruthy();
  }
}`,...c.parameters?.docs?.source}}}})))()}u();export{s as Count,o as Default,c as Removable,l as __namedExportsOrder,i as default};