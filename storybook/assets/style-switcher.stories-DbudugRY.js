import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s;function c(){return(c=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Map/StyleSwitcher`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{items:{control:`text`},value:{control:`text`}}},r=JSON.stringify([`Streets`,`Satellite`,`Terrain`]),i=(e={})=>{let t=document.createElement(`contour-style-switcher`);return t.setAttribute(`items`,e.items||r),t.setAttribute(`value`,e.value||`Streets`),t},a={args:{items:r,value:`Streets`},render:i,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-style-switcher`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-style-switcher/),await t(n.querySelectorAll(`.c-style-switcher__option`).length).toBe(3),await t(n.querySelector(`.c-style-switcher__option--active`)).toHaveTextContent(`Streets`)}},o={args:{items:r,value:`Satellite`},render:i,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-style-switcher`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-style-switcher/),await t(n.querySelector(`.c-style-switcher__option--active`)).toHaveTextContent(`Satellite`)}},s=[`Default`,`Satellite`],a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    items: ITEMS,
    value: "Streets"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const s = canvasElement.querySelector("contour-style-switcher");
    await expect(s).toBeTruthy();
    await expect(s).toHaveClass(/c-style-switcher/);
    await expect(s.querySelectorAll(".c-style-switcher__option").length).toBe(3);
    await expect(s.querySelector(".c-style-switcher__option--active")).toHaveTextContent("Streets");
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    items: ITEMS,
    value: "Satellite"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const s = canvasElement.querySelector("contour-style-switcher");
    await expect(s).toBeTruthy();
    await expect(s).toHaveClass(/c-style-switcher/);
    await expect(s.querySelector(".c-style-switcher__option--active")).toHaveTextContent("Satellite");
  }
}`,...o.parameters?.docs?.source}}}})))()}c();export{a as Default,o as Satellite,s as __namedExportsOrder,n as default};