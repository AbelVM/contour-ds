import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s;function c(){return(c=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Data/Brownout`,tags:[`autodocs`],parameters:{a11y:{test:`error`},contour:{maturity:`complete-widget`}},argTypes:{level:{control:`select`,options:[`0`,`1`,`2`,`3`]}}},r=(e={})=>{let t=document.createElement(`contour-brownout`);return e.level&&t.setAttribute(`level`,e.level),t},i={args:{level:`0`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-brownout`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-brownout/);let r=n.querySelector(`.c-brownout__decorative`);await t(r).toBeTruthy();let i=n.querySelector(`.c-brownout__label`);await t(i).toBeTruthy()}},a={args:{level:`3`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-brownout`);await t(n).toBeTruthy(),await t(n).toHaveAttribute(`data-level`,`3`);let r=n.querySelector(`.c-brownout__label`);await t(r.textContent).toContain(`3`)}},o={args:{level:`0`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-brownout`);await t(n).toBeTruthy(),n.setAttribute(`level`,`2`),await t(n).toHaveAttribute(`data-level`,`2`)}},s=[`Default`,`Level3`,`Reactivity`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    level: "0"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const b = canvasElement.querySelector("contour-brownout");
    await expect(b).toBeTruthy();
    await expect(b).toHaveClass(/c-brownout/);
    const deco = b.querySelector(".c-brownout__decorative");
    await expect(deco).toBeTruthy();
    const label = b.querySelector(".c-brownout__label");
    await expect(label).toBeTruthy();
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    level: "3"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const b = canvasElement.querySelector("contour-brownout");
    await expect(b).toBeTruthy();
    await expect(b).toHaveAttribute("data-level", "3");
    const label = b.querySelector(".c-brownout__label");
    await expect(label.textContent).toContain("3");
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    level: "0"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const b = canvasElement.querySelector("contour-brownout");
    await expect(b).toBeTruthy();
    b.setAttribute("level", "2");
    await expect(b).toHaveAttribute("data-level", "2");
  }
}`,...o.parameters?.docs?.source}}}})))()}c();export{i as Default,a as Level3,o as Reactivity,s as __namedExportsOrder,n as default};