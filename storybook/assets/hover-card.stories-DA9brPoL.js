import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Overlays/HoverCard`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{title:{control:`text`}}},r=(e={})=>{let t=document.createElement(`contour-hover-card`);e.title&&t.setAttribute(`title`,e.title);let n=document.createElement(`button`);n.textContent=`Hover`,t.appendChild(n);let r=document.createElement(`div`);return r.textContent=`Card content`,t.appendChild(r),t},i={args:{},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-hover-card`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-hover-card/),await t(e.textContent).toContain(`Hover`),await t(e.textContent).toContain(`Card content`)}},a={args:{title:`Preview`},render:(e={})=>{let t=document.createElement(`contour-hover-card`);t.setAttribute(`title`,e.title||`Preview`);let n=document.createElement(`a`);return n.textContent=`Link`,n.href=`#`,t.appendChild(n),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-hover-card`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-hover-card/),await t(e.textContent).toContain(`Link`)}},o=[`Default`,`WithTitle`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {},
  render: renderDefault,
  play: async ({
    canvasElement
  }) => {
    const h = canvasElement.querySelector("contour-hover-card");
    await expect(h).toBeTruthy();
    await expect(h).toHaveClass(/c-hover-card/);
    await expect(canvasElement.textContent).toContain("Hover");
    await expect(canvasElement.textContent).toContain("Card content");
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Preview"
  },
  render: (args = {}) => {
    const h = document.createElement("contour-hover-card");
    h.setAttribute("title", args.title || "Preview");
    const trigger = document.createElement("a");
    trigger.textContent = "Link";
    trigger.href = "#";
    h.appendChild(trigger);
    return h;
  },
  play: async ({
    canvasElement
  }) => {
    const h = canvasElement.querySelector("contour-hover-card");
    await expect(h).toBeTruthy();
    await expect(h).toHaveClass(/c-hover-card/);
    await expect(canvasElement.textContent).toContain("Link");
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{i as Default,a as WithTitle,o as __namedExportsOrder,n as default};