const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./interaction-DDFqH0EP.js","./rolldown-runtime-sJBDdmOt.js"])))=>i.map(i=>d[i]);
import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{n as t,t as n}from"./preload-helper-Dt5pTa-y.js";var r,i,a,o,s;function c(){return(c=e((()=>{t(),{expect:r}=__STORYBOOK_MODULE_TEST__,i={title:`Contour/Foundations/LateDefinition`,tags:[`autodocs`],parameters:{contour:{maturity:`primitive`}}},a={render:()=>{let e=document.createElement(`button`);return e.className=`c-btn`,e.textContent=`Native fallback`,e},play:async({canvasElement:e})=>{await r(e.querySelector(`button`)).toBeTruthy(),await r(e.textContent).toContain(`Native fallback`)}},o={render:()=>{let e=document.createElement(`contour-btn`);return e.setAttribute(`label`,`Upgraded`),e},play:async({canvasElement:e})=>{await n(()=>import(`./interaction-DDFqH0EP.js`),__vite__mapDeps([0,1]),import.meta.url);let t=e.querySelector(`contour-btn`);await r(t).toBeTruthy(),await r(t).toHaveAttribute(`role`,`button`)}},s=[`NativeFallback`,`LateUpgrade`],a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    const btn = document.createElement("button");
    btn.className = "c-btn";
    btn.textContent = "Native fallback";
    return btn;
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement.querySelector("button")).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Native fallback");
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    const el = document.createElement("contour-btn");
    el.setAttribute("label", "Upgraded");
    return el;
  },
  play: async ({
    canvasElement
  }) => {
    await import("../dist/wc/interaction.mjs");
    const el = canvasElement.querySelector("contour-btn");
    await expect(el).toBeTruthy();
    await expect(el).toHaveAttribute("role", "button");
  }
}`,...o.parameters?.docs?.source}}}})))()}c();export{o as LateUpgrade,a as NativeFallback,s as __namedExportsOrder,i as default};