import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Data/Comparison`,tags:[`autodocs`],parameters:{a11y:{test:`error`},contour:{maturity:`complete-widget`}},argTypes:{before:{control:`text`},after:{control:`text`},value:{control:`text`},divider:{control:`text`}}},r=(e={})=>{let t=document.createElement(`contour-comparison`);return e.before&&t.setAttribute(`before`,e.before),e.after&&t.setAttribute(`after`,e.after),e.value&&t.setAttribute(`value`,e.value),e.divider&&t.setAttribute(`divider`,e.divider),t},i={args:{before:`Before`,after:`After`,value:`50`,divider:`↔`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-comparison`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-comparison/);let r=n.querySelector(`.c-comparison__label--before`);await t(r).toBeTruthy();let i=n.querySelector(`.c-comparison__label--after`);await t(i).toBeTruthy()}},a={args:{before:`Original`,after:`Changed`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-comparison`);await t(n).toBeTruthy(),n.setAttribute(`before`,`Updated`);let r=n.querySelector(`.c-comparison__label--before`);await t(r.textContent).toBe(`Updated`)}},o=[`Default`,`Reactivity`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    before: "Before",
    after: "After",
    value: "50",
    divider: "↔"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const c = canvasElement.querySelector("contour-comparison");
    await expect(c).toBeTruthy();
    await expect(c).toHaveClass(/c-comparison/);
    const beforeLabel = c.querySelector(".c-comparison__label--before");
    await expect(beforeLabel).toBeTruthy();
    const afterLabel = c.querySelector(".c-comparison__label--after");
    await expect(afterLabel).toBeTruthy();
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    before: "Original",
    after: "Changed"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const c = canvasElement.querySelector("contour-comparison");
    await expect(c).toBeTruthy();
    c.setAttribute("before", "Updated");
    const beforeLabel = c.querySelector(".c-comparison__label--before");
    await expect(beforeLabel.textContent).toBe("Updated");
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{i as Default,a as Reactivity,o as __namedExportsOrder,n as default};