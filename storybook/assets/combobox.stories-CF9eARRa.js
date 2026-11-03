import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s;function c(){return(c=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Forms/Combobox`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{label:{control:`text`},options:{control:`text`},placeholder:{control:`text`},value:{control:`text`},multiple:{control:`boolean`},empty:{control:`text`},loading:{control:`boolean`},error:{control:`text`}}},r=JSON.stringify([`Apple`,`Banana`,`Cherry`,`Date`,`Elderberry`]),i=(e={})=>{let t=document.createElement(`contour-combobox`);return t.setAttribute(`label`,e.label||`Fruit`),t.setAttribute(`options`,e.options||r),e.placeholder&&t.setAttribute(`placeholder`,e.placeholder),e.value&&t.setAttribute(`value`,e.value),e.multiple&&t.setAttribute(`multiple`,``),e.empty&&t.setAttribute(`empty`,e.empty),e.loading&&t.setAttribute(`loading`,``),e.error&&t.setAttribute(`error`,e.error),e.help&&t.setAttribute(`help`,e.help),t},a={args:{label:`Fruit`,options:r,multiple:!0},render:i,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-combobox`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-combobox/);let r=n.querySelector(`.c-combobox__list`);await t(r).toBeTruthy(),await t(r).toHaveAttribute(`aria-multiselectable`,`true`)}},o={args:{label:`Fruit`,options:r,empty:`No fruit found`},render:i,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-combobox`);await t(n).toBeTruthy();let r=n.querySelector(`.c-combobox__input`);await t(r).toBeTruthy()}},s=[`MultiSelect`,`NoResults`],a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Fruit",
    options: OPTIONS,
    multiple: true
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const c = canvasElement.querySelector("contour-combobox");
    await expect(c).toBeTruthy();
    await expect(c).toHaveClass(/c-combobox/);
    const list = c.querySelector(".c-combobox__list");
    await expect(list).toBeTruthy();
    await expect(list).toHaveAttribute("aria-multiselectable", "true");
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Fruit",
    options: OPTIONS,
    empty: "No fruit found"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const c = canvasElement.querySelector("contour-combobox");
    await expect(c).toBeTruthy();
    const input = c.querySelector(".c-combobox__input");
    await expect(input).toBeTruthy();
  }
}`,...o.parameters?.docs?.source}}}})))()}c();export{a as MultiSelect,o as NoResults,s as __namedExportsOrder,n as default};