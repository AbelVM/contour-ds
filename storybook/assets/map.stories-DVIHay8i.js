import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Map/Panel`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{title:{control:`text`}}},r=(e={})=>{let t=document.createElement(`contour-map-panel`);return t.setAttribute(`title`,e.title||`Layers`),t},i={args:{title:`Layers`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-map-panel`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-map-panel/),await t(n).toHaveAttribute(`aria-label`,`Layers`)}},a={args:{title:`Layers`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-map-panel`);await t(n).toBeTruthy(),n.setAttribute(`title`,`Updated`),await t(n).toBeTruthy()}},o=[`Default`,`Reactivity`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Layers"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const panel = canvasElement.querySelector("contour-map-panel");
    await expect(panel).toBeTruthy();
    await expect(panel).toHaveClass(/c-map-panel/);
    await expect(panel).toHaveAttribute("aria-label", "Layers");
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Layers"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const panel = canvasElement.querySelector("contour-map-panel");
    await expect(panel).toBeTruthy();
    panel.setAttribute("title", "Updated");
    await expect(panel).toBeTruthy();
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{i as Default,a as Reactivity,o as __namedExportsOrder,n as default};