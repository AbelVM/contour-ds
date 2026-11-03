import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Overlays/Tooltip`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{text:{control:`text`},anchor:{control:`text`},delay:{control:`text`},trigger:{control:`text`}}},r=(e={})=>{let t=document.createElement(`button`);t.textContent=e.label||`Hover me`;let n=document.createElement(`contour-tooltip`);return e.text?n.setAttribute(`text`,e.text):n.setAttribute(`text`,`Helpful hint`),e.anchor&&n.setAttribute(`anchor`,e.anchor),e.delay&&n.setAttribute(`delay`,e.delay),e.trigger&&n.setAttribute(`trigger`,e.trigger),e.position&&n.setAttribute(`position`,e.position),n.appendChild(t),n},i={args:{text:`Helpful hint`,label:`Hover me`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-tooltip`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-tooltip/),await t(e.textContent).toContain(`Hover me`)}},a={args:{text:`Detailed information`,position:`bottom`,label:`Info`},render:e=>{let t=document.createElement(`button`);t.textContent=e.label||`Info`;let n=document.createElement(`contour-tooltip`);return n.setAttribute(`text`,e.text||`Detailed information`),n.setAttribute(`position`,e.position||`bottom`),n.appendChild(t),n},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-tooltip`);await t(n).toBeTruthy(),await t(e.textContent).toContain(`Info`)}},o=[`Default`,`WithPosition`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    text: "Helpful hint",
    label: "Hover me"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const t = canvasElement.querySelector("contour-tooltip");
    await expect(t).toBeTruthy();
    await expect(t).toHaveClass(/c-tooltip/);
    await expect(canvasElement.textContent).toContain("Hover me");
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    text: "Detailed information",
    position: "bottom",
    label: "Info"
  },
  render: args => {
    const btn = document.createElement("button");
    btn.textContent = args.label || "Info";
    const t = document.createElement("contour-tooltip");
    t.setAttribute("text", args.text || "Detailed information");
    t.setAttribute("position", args.position || "bottom");
    t.appendChild(btn);
    return t;
  },
  play: async ({
    canvasElement
  }) => {
    const t = canvasElement.querySelector("contour-tooltip");
    await expect(t).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Info");
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{i as Default,a as WithPosition,o as __namedExportsOrder,n as default};