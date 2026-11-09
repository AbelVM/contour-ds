import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{i as t,r as n,t as r}from"./metadata-hRL6GB-Y.js";var i,a,o,s,c,l;function u(){return(u=e((()=>{n(),{expect:i}=__STORYBOOK_MODULE_TEST__,a={title:`Contour/Feedback/Alert`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{...r(`c-alert`),title:{control:`text`},body:{control:`text`},variant:t(`c-alert`),icon:{control:`text`},action:{control:`text`},actions:{control:`text`},closable:{control:`boolean`}}},o=(e={})=>{let t=document.createElement(`contour-alert`);return e.variant?t.setAttribute(`variant`,e.variant):t.setAttribute(`variant`,`warning`),e.title&&t.setAttribute(`title`,e.title),e.body&&t.setAttribute(`body`,e.body),e.icon&&t.setAttribute(`icon`,e.icon),e.action&&t.setAttribute(`action`,e.action),e.actions&&t.setAttribute(`actions`,e.actions),e.closable&&t.setAttribute(`closable`,``),e.title||e.body||e.icon||(t.textContent=`Heads up: something happened.`),t},s={args:{variant:`warning`,title:`This is a title`,body:`This is the body of the alert.
`},render:o,play:async({canvasElement:e})=>{let t=e.querySelector(`contour-alert`);await i(t).toBeTruthy(),await i(t).toHaveAttribute(`role`,`alert`),await i(t).toHaveAttribute(`aria-live`,`assertive`),await i(t).toHaveClass(/c-alert/),await i(t.querySelector(`.c-alert__title`)).toHaveTextContent(`This is a title`),await i(t.querySelector(`.c-alert__body`)).toHaveTextContent(`This is the body of the alert.`)}},c={args:{variant:`danger`},render:o,play:async({canvasElement:e})=>{let t=e.querySelector(`contour-alert`);await i(t).toBeTruthy(),await i(t).toHaveClass(/c-alert/),await i(t).toHaveClass(/c-alert--danger/),await i(t).toHaveAttribute(`role`,`alert`)}},l=[`Default`,`Danger`],s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "warning",
    title: "This is a title",
    body: "This is the body of the alert.\\n"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const a = canvasElement.querySelector("contour-alert");
    await expect(a).toBeTruthy();
    await expect(a).toHaveAttribute("role", "alert");
    await expect(a).toHaveAttribute("aria-live", "assertive");
    await expect(a).toHaveClass(/c-alert/);
    await expect(a.querySelector(".c-alert__title")).toHaveTextContent("This is a title");
    await expect(a.querySelector(".c-alert__body")).toHaveTextContent("This is the body of the alert.");
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "danger"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const a = canvasElement.querySelector("contour-alert");
    await expect(a).toBeTruthy();
    await expect(a).toHaveClass(/c-alert/);
    await expect(a).toHaveClass(/c-alert--danger/);
    await expect(a).toHaveAttribute("role", "alert");
  }
}`,...c.parameters?.docs?.source}}}})))()}u();export{c as Danger,s as Default,l as __namedExportsOrder,a as default};