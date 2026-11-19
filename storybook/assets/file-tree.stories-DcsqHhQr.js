import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Docs/FileTree`,tags:[`autodocs`],parameters:{a11y:{test:`error`},contour:{maturity:`complete-widget`}},argTypes:{items:{control:`text`}}},r=(e={})=>{let t=document.createElement(`contour-file-tree`);return e.items&&t.setAttribute(`items`,e.items),t},i={args:{items:JSON.stringify([{label:`src`,children:[{label:`index.mjs`},{label:`core.mjs`},{label:`utils`,children:[{label:`helpers.mjs`}]}]},{label:`package.json`}])},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-file-tree`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-file-tree/)}},a={args:{items:JSON.stringify([{label:`a.mjs`}])},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-file-tree`);await t(n).toBeTruthy(),n.setAttribute(`items`,JSON.stringify([{label:`b.mjs`}])),await t(n).toHaveAttribute(`items`)}},o=[`Default`,`Reactivity`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    items: JSON.stringify([{
      label: "src",
      children: [{
        label: "index.mjs"
      }, {
        label: "core.mjs"
      }, {
        label: "utils",
        children: [{
          label: "helpers.mjs"
        }]
      }]
    }, {
      label: "package.json"
    }])
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const t = canvasElement.querySelector("contour-file-tree");
    await expect(t).toBeTruthy();
    await expect(t).toHaveClass(/c-file-tree/);
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    items: JSON.stringify([{
      label: "a.mjs"
    }])
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const t = canvasElement.querySelector("contour-file-tree");
    await expect(t).toBeTruthy();
    t.setAttribute("items", JSON.stringify([{
      label: "b.mjs"
    }]));
    await expect(t).toHaveAttribute("items");
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{i as Default,a as Reactivity,o as __namedExportsOrder,n as default};