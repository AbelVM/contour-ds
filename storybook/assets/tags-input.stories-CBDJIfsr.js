import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s;function c(){return(c=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Forms/TagsInput`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{value:{control:`text`},placeholder:{control:`text`},disabled:{control:`boolean`},error:{control:`text`},help:{control:`text`}}},r=(e={})=>{let t=document.createElement(`contour-tags-input`);return e.label?t.setAttribute(`label`,e.label):t.setAttribute(`label`,`Tags`),e.value&&t.setAttribute(`value`,e.value),e.placeholder&&t.setAttribute(`placeholder`,e.placeholder),e.disabled&&t.setAttribute(`disabled`,``),e.error&&t.setAttribute(`error`,e.error),e.help&&t.setAttribute(`help`,e.help),t},i={args:{label:`Tags`,value:JSON.stringify([`Route A`,`Route B`])},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-tags-input`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-tags-input/),await t(n.querySelectorAll(`.c-tag`).length).toBe(2)}},a={args:{label:`Tags`,placeholder:`Add tag`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-tags-input`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-tags-input/)}},o={args:{label:`Tags`,value:JSON.stringify([`A`,`B`,`C`])},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-tags-input`);await t(n).toBeTruthy(),await t(n.querySelectorAll(`.c-tag`).length).toBe(3)}},s=[`Default`,`Empty`,`WithMax`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Tags",
    value: JSON.stringify(["Route A", "Route B"])
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const t = canvasElement.querySelector("contour-tags-input");
    await expect(t).toBeTruthy();
    await expect(t).toHaveClass(/c-tags-input/);
    await expect(t.querySelectorAll(".c-tag").length).toBe(2);
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Tags",
    placeholder: "Add tag"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const t = canvasElement.querySelector("contour-tags-input");
    await expect(t).toBeTruthy();
    await expect(t).toHaveClass(/c-tags-input/);
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Tags",
    value: JSON.stringify(["A", "B", "C"])
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const t = canvasElement.querySelector("contour-tags-input");
    await expect(t).toBeTruthy();
    await expect(t.querySelectorAll(".c-tag").length).toBe(3);
  }
}`,...o.parameters?.docs?.source}}}})))()}c();export{i as Default,a as Empty,o as WithMax,s as __namedExportsOrder,n as default};