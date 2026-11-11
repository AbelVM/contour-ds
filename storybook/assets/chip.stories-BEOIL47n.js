import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{i as t,r as n}from"./metadata-CDq-7Bc5.js";var r,i,a,o,s,c,l,u;function d(){return(d=e((()=>{n(),{expect:r,userEvent:i}=__STORYBOOK_MODULE_TEST__,a={title:`Contour/UI/Chip`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{variant:t(`c-chip`),key:{control:`text`},value:{control:`text`}}},o=(e={})=>{let t=document.createElement(`contour-chip`);return e.variant&&t.setAttribute(`variant`,e.variant),e.key&&t.setAttribute(`key`,e.key),e.value&&t.setAttribute(`value`,e.value),!e.key&&!e.value&&(t.textContent=`Filter`),t},s={args:{label:`Filter`},render:e=>{let t=o(e);return e.label&&!e.key&&!e.value&&(t.textContent=e.label),t},play:async({canvasElement:e})=>{let t=e.querySelector(`contour-chip`);await r(t).toBeTruthy(),await r(t).toHaveClass(/c-chip/),await r(e.textContent).toContain(`Filter`)}},c={args:{key:`Status`,value:`Active`},render:o,play:async({canvasElement:e})=>{let t=e.querySelector(`contour-chip`);await r(t).toBeTruthy(),await r(e.textContent).toContain(`Status`),await r(e.textContent).toContain(`Active`)}},l={args:{value:`42`},render:o,play:async({canvasElement:e})=>{let t=e.querySelector(`contour-chip`);await r(t).toBeTruthy(),await r(e.textContent).toContain(`42`)}},u=[`Default`,`WithKey`,`WithValue`],s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Filter"
  },
  render: args => {
    const c = render(args);
    if (args.label && !args.key && !args.value) c.textContent = args.label;
    return c;
  },
  play: async ({
    canvasElement
  }) => {
    const c = canvasElement.querySelector("contour-chip");
    await expect(c).toBeTruthy();
    await expect(c).toHaveClass(/c-chip/);
    await expect(canvasElement.textContent).toContain("Filter");
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    key: "Status",
    value: "Active"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const c = canvasElement.querySelector("contour-chip");
    await expect(c).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Status");
    await expect(canvasElement.textContent).toContain("Active");
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    value: "42"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const c = canvasElement.querySelector("contour-chip");
    await expect(c).toBeTruthy();
    await expect(canvasElement.textContent).toContain("42");
  }
}`,...l.parameters?.docs?.source}}}})))()}d();export{s as Default,c as WithKey,l as WithValue,u as __namedExportsOrder,a as default};