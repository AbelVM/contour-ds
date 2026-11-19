import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Interaction/SortableList`,tags:[`autodocs`],parameters:{a11y:{test:`error`},contour:{maturity:`complete-widget`}},argTypes:{items:{control:`text`}}},r=(e={})=>{let t=document.createElement(`contour-sortable-list`);return e.items&&t.setAttribute(`items`,e.items),t},i={args:{items:JSON.stringify([`First`,`Second`,`Third`])},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-sortable-list`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-sortable-list/)}},a={args:{items:JSON.stringify([`A`,`B`])},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-sortable-list`);await t(n).toBeTruthy(),n.setAttribute(`items`,JSON.stringify([`X`,`Y`,`Z`])),await t(n).toHaveAttribute(`items`)}},o=[`Default`,`Reactivity`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    items: JSON.stringify(["First", "Second", "Third"])
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const s = canvasElement.querySelector("contour-sortable-list");
    await expect(s).toBeTruthy();
    await expect(s).toHaveClass(/c-sortable-list/);
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    items: JSON.stringify(["A", "B"])
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const s = canvasElement.querySelector("contour-sortable-list");
    await expect(s).toBeTruthy();
    s.setAttribute("items", JSON.stringify(["X", "Y", "Z"]));
    await expect(s).toHaveAttribute("items");
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{i as Default,a as Reactivity,o as __namedExportsOrder,n as default};