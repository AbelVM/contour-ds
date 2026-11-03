import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Feedback/Toast`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{message:{control:`text`},variant:{control:`text`},duration:{control:`text`}}},r=(e={})=>{let t=document.createElement(`contour-toast`);return e.variant&&t.setAttribute(`variant`,e.variant),e.duration&&t.setAttribute(`duration`,e.duration),t.textContent=e.message?e.message:`Saved successfully`,t},i={args:{message:`Saved successfully`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-toast`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-toast/),await t(e.textContent).toContain(`Saved`)}},a={args:{message:`Saved successfully`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-toast`);await t(n).toBeTruthy(),n.textContent=`Updated`,await t(e.textContent).toContain(`Updated`)}},o=[`Default`,`Reactivity`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    message: "Saved successfully"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const t = canvasElement.querySelector("contour-toast");
    await expect(t).toBeTruthy();
    await expect(t).toHaveClass(/c-toast/);
    await expect(canvasElement.textContent).toContain("Saved");
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    message: "Saved successfully"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const t = canvasElement.querySelector("contour-toast");
    await expect(t).toBeTruthy();
    t.textContent = "Updated";
    await expect(canvasElement.textContent).toContain("Updated");
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{i as Default,a as Reactivity,o as __namedExportsOrder,n as default};