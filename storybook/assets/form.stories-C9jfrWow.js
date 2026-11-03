import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s,c;function l(){return(l=e((()=>{({expect:t,userEvent:n}=__STORYBOOK_MODULE_TEST__),r={title:`Contour/Forms/Form`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{"submit-label":{control:`text`},submitting:{control:`boolean`},error:{control:`text`},summary:{control:`text`}}},i=(e={})=>{let t=document.createElement(`contour-form`);return t.setAttribute(`title`,e.title||`Route form`),t.setAttribute(`submit-label`,e[`submit-label`]||`Save`),e.submitting&&t.setAttribute(`submitting`,``),e.error&&t.setAttribute(`error`,e.error),e.summary&&t.setAttribute(`summary`,e.summary),t},a={args:{title:`Route form`,"submit-label":`Save`},render:i,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-form`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-form/)}},o={args:{title:`Route form`,"submit-label":`Save`},render:(e={})=>{let t=document.createElement(`contour-form`);t.setAttribute(`title`,e.title||`Route form`),t.setAttribute(`submit-label`,e[`submit-label`]||`Save`);let n=document.createElement(`contour-input`);return n.setAttribute(`label`,`Route name`),n.setAttribute(`placeholder`,`Morning loop`),t.appendChild(n),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-form`);await t(n).toBeTruthy(),await t(n.querySelector(`contour-input`)).toBeTruthy()}},s={args:{title:`Route form`,"submit-label":`Save`,submitting:!0},render:(e={})=>{let t=document.createElement(`contour-form`);t.setAttribute(`title`,e.title||`Route form`),t.setAttribute(`submit-label`,e[`submit-label`]||`Save`),t.setAttribute(`submitting`,``);let n=document.createElement(`button`);return n.className=`c-btn c-btn--primary c-form__submit`,n.type=`submit`,n.textContent=`Save`,n.setAttribute(`disabled`,``),t.appendChild(n),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-form`);await t(n).toBeTruthy(),await t(n.classList.contains(`is-submitting`)).toBe(!0)}},c=[`Default`,`WithFields`,`SubmitState`],a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Route form",
    "submit-label": "Save"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const f = canvasElement.querySelector("contour-form");
    await expect(f).toBeTruthy();
    await expect(f).toHaveClass(/c-form/);
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Route form",
    "submit-label": "Save"
  },
  render: (args = {}) => {
    const f = document.createElement("contour-form");
    f.setAttribute("title", args.title || "Route form");
    f.setAttribute("submit-label", args["submit-label"] || "Save");
    const input = document.createElement("contour-input");
    input.setAttribute("label", "Route name");
    input.setAttribute("placeholder", "Morning loop");
    f.appendChild(input);
    return f;
  },
  play: async ({
    canvasElement
  }) => {
    const f = canvasElement.querySelector("contour-form");
    await expect(f).toBeTruthy();
    await expect(f.querySelector("contour-input")).toBeTruthy();
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Route form",
    "submit-label": "Save",
    submitting: true
  },
  render: (args = {}) => {
    const f = document.createElement("contour-form");
    f.setAttribute("title", args.title || "Route form");
    f.setAttribute("submit-label", args["submit-label"] || "Save");
    f.setAttribute("submitting", "");
    const btn = document.createElement("button");
    btn.className = "c-btn c-btn--primary c-form__submit";
    btn.type = "submit";
    btn.textContent = "Save";
    btn.setAttribute("disabled", "");
    f.appendChild(btn);
    return f;
  },
  play: async ({
    canvasElement
  }) => {
    const f = canvasElement.querySelector("contour-form");
    await expect(f).toBeTruthy();
    await expect(f.classList.contains("is-submitting")).toBe(true);
  }
}`,...s.parameters?.docs?.source}}}})))()}l();export{a as Default,s as SubmitState,o as WithFields,c as __namedExportsOrder,r as default};