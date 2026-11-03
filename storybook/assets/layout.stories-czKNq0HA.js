import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s,c,l,u;function d(){return(d=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Layout/Primitives`,tags:[`autodocs`],parameters:{contour:{maturity:`primitive`}}},r=(e,t)=>{let n=document.createElement(e);return n.textContent=t||e,n},i={render:()=>r(`contour-box`,`Box`),play:async({canvasElement:e})=>{let n=e.querySelector(`contour-box`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-box/)}},a={render:()=>r(`contour-cluster`,`Cluster`),play:async({canvasElement:e})=>{let n=e.querySelector(`contour-cluster`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-cluster/)}},o={render:()=>r(`contour-container`,`Container`),play:async({canvasElement:e})=>{let n=e.querySelector(`contour-container`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-container/)}},s={render:()=>r(`contour-row`,`Row`),play:async({canvasElement:e})=>{let n=e.querySelector(`contour-row`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-row/)}},c={render:()=>r(`contour-scrim`,`Scrim`),play:async({canvasElement:e})=>{let n=e.querySelector(`contour-scrim`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-scrim/)}},l={render:()=>r(`contour-stack`,`Stack`),play:async({canvasElement:e})=>{let n=e.querySelector(`contour-stack`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-stack/)}},u=[`Box`,`Cluster`,`Container`,`Row`,`Scrim`,`Stack`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => wrap("contour-box", "Box"),
  play: async ({
    canvasElement
  }) => {
    const el = canvasElement.querySelector("contour-box");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-box/);
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => wrap("contour-cluster", "Cluster"),
  play: async ({
    canvasElement
  }) => {
    const el = canvasElement.querySelector("contour-cluster");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-cluster/);
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => wrap("contour-container", "Container"),
  play: async ({
    canvasElement
  }) => {
    const el = canvasElement.querySelector("contour-container");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-container/);
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => wrap("contour-row", "Row"),
  play: async ({
    canvasElement
  }) => {
    const el = canvasElement.querySelector("contour-row");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-row/);
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => wrap("contour-scrim", "Scrim"),
  play: async ({
    canvasElement
  }) => {
    const el = canvasElement.querySelector("contour-scrim");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-scrim/);
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => wrap("contour-stack", "Stack"),
  play: async ({
    canvasElement
  }) => {
    const el = canvasElement.querySelector("contour-stack");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-stack/);
  }
}`,...l.parameters?.docs?.source}}}})))()}d();export{i as Box,a as Cluster,o as Container,s as Row,c as Scrim,l as Stack,u as __namedExportsOrder,n as default};