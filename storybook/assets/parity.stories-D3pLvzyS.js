import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a;function o(){return(o=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Foundations/LightVsShadow`,tags:[`autodocs`],parameters:{contour:{maturity:`primitive`}}},r={render:()=>{let e=document.createElement(`div`),t=document.createElement(`contour-dialog`);t.setAttribute(`title`,`light dom`);let n=document.createElement(`contour-shadow-dialog`);return n.setAttribute(`title`,`shadow dom`),e.appendChild(t),e.appendChild(n),e},play:async({canvasElement:e})=>{await t(e.querySelector(`contour-dialog`)).toBeTruthy(),await t(e.querySelector(`contour-shadow-dialog`)).toBeTruthy()}},i={render:()=>{let e=document.createElement(`div`),t=document.createElement(`contour-dialog`);return t.setAttribute(`title`,`light dom`),e.appendChild(t),e},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-dialog`);await t(n).toBeTruthy(),n.setAttribute(`title`,`updated`),await t(n).toHaveAttribute(`title`,`updated`)}},a=[`Default`,`Reactivity`],r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrap = document.createElement("div");
    const light = document.createElement("contour-dialog");
    light.setAttribute("title", "light dom");
    const shadow = document.createElement("contour-shadow-dialog");
    shadow.setAttribute("title", "shadow dom");
    wrap.appendChild(light);
    wrap.appendChild(shadow);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement.querySelector("contour-dialog")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-shadow-dialog")).toBeTruthy();
  }
}`,...r.parameters?.docs?.source}}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrap = document.createElement("div");
    const light = document.createElement("contour-dialog");
    light.setAttribute("title", "light dom");
    wrap.appendChild(light);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const light = canvasElement.querySelector("contour-dialog");
    await expect(light).toBeTruthy();
    light.setAttribute("title", "updated");
    await expect(light).toHaveAttribute("title", "updated");
  }
}`,...i.parameters?.docs?.source}}}})))()}o();export{r as Default,i as Reactivity,a as __namedExportsOrder,n as default};