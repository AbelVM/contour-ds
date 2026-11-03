import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a;function o(){return(o=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Forms/Field`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{label:{control:`text`},hint:{control:`text`},error:{control:`text`},required:{control:`boolean`}}},r=(e={})=>{let t=document.createElement(`contour-field`);e.label?t.setAttribute(`label`,e.label):t.setAttribute(`label`,`Email address`),e.hint?t.setAttribute(`hint`,e.hint):t.setAttribute(`hint`,`Used for release notifications`),e.error&&t.setAttribute(`error`,e.error),e.required&&t.setAttribute(`required`,``);let n=document.createElement(`contour-input`);return n.setAttribute(`type`,`email`),n.setAttribute(`placeholder`,`you@example.com`),t.appendChild(n),t},i={args:{label:`Email address`,hint:`Used for release notifications`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-field`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-field/),await t(n.querySelector(`.c-field__label`)).toHaveTextContent(`Email address`),await t(n.querySelector(`input`)).toHaveAttribute(`type`,`email`)}},a=[`Default`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Email address",
    hint: "Used for release notifications"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const field = canvasElement.querySelector("contour-field");
    await expect(field).toBeTruthy();
    await expect(field).toHaveClass(/c-field/);
    await expect(field.querySelector(".c-field__label")).toHaveTextContent("Email address");
    await expect(field.querySelector("input")).toHaveAttribute("type", "email");
  }
}`,...i.parameters?.docs?.source}}}})))()}o();export{i as Default,a as __namedExportsOrder,n as default};