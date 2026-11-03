import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a;function o(){return(o=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Navigation/ContextMenu`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{items:{control:`text`}}},r={render:(e={})=>{let t=document.createElement(`contour-context-menu`);e.items&&t.setAttribute(`items`,e.items);let n=document.createElement(`button`);n.textContent=`Copy`,t.appendChild(n);let r=document.createElement(`button`);return r.textContent=`Paste`,t.appendChild(r),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-context-menu`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-context-menu/),await t(e.textContent).toContain(`Copy`),await t(e.textContent).toContain(`Paste`)}},i={render:(e={})=>{let t=document.createElement(`contour-context-menu`);e.items&&t.setAttribute(`items`,e.items);let n=document.createElement(`button`);return n.textContent=`Delete`,t.appendChild(n),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-context-menu`);await t(n).toBeTruthy(),await t(e.textContent).toContain(`Delete`)}},a=[`Default`,`WithIcons`],r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const c = document.createElement("contour-context-menu");
    if (args.items) c.setAttribute("items", args.items);
    const item = document.createElement("button");
    item.textContent = "Copy";
    c.appendChild(item);
    const item2 = document.createElement("button");
    item2.textContent = "Paste";
    c.appendChild(item2);
    return c;
  },
  play: async ({
    canvasElement
  }) => {
    const c = canvasElement.querySelector("contour-context-menu");
    await expect(c).toBeTruthy();
    await expect(c).toHaveClass(/c-context-menu/);
    await expect(canvasElement.textContent).toContain("Copy");
    await expect(canvasElement.textContent).toContain("Paste");
  }
}`,...r.parameters?.docs?.source}}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const c = document.createElement("contour-context-menu");
    if (args.items) c.setAttribute("items", args.items);
    const item = document.createElement("button");
    item.textContent = "Delete";
    c.appendChild(item);
    return c;
  },
  play: async ({
    canvasElement
  }) => {
    const c = canvasElement.querySelector("contour-context-menu");
    await expect(c).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Delete");
  }
}`,...i.parameters?.docs?.source}}}})))()}o();export{r as Default,i as WithIcons,a as __namedExportsOrder,n as default};