import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Data/KPI`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{value:{control:`text`},label:{control:`text`},delta:{control:`text`},direction:{control:`select`,options:[``,`up`,`down`]}}},r=(e={})=>{let t=document.createElement(`contour-kpi`);return e.label?t.setAttribute(`label`,e.label):t.setAttribute(`label`,`Active users`),e.value?t.setAttribute(`value`,e.value):t.setAttribute(`value`,`1,234`),e.delta?t.setAttribute(`delta`,e.delta):t.setAttribute(`delta`,`+5%`),e.direction?t.setAttribute(`direction`,e.direction):t.setAttribute(`direction`,`up`),t},i={args:{label:`Active users`,value:`1,234`,delta:`+5%`,direction:`up`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-kpi`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-kpi/),await t(e.textContent).toContain(`Active users`),await t(e.textContent).toContain(`1,234`)}},a={args:{label:`Active users`,value:`1,234`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-kpi`);await t(n).toBeTruthy(),n.setAttribute(`value`,`2,000`),await t(e.textContent).toContain(`2,000`)}},o=[`Default`,`Reactivity`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Active users",
    value: "1,234",
    delta: "+5%",
    direction: "up"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const k = canvasElement.querySelector("contour-kpi");
    await expect(k).toBeTruthy();
    await expect(k).toHaveClass(/c-kpi/);
    await expect(canvasElement.textContent).toContain("Active users");
    await expect(canvasElement.textContent).toContain("1,234");
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Active users",
    value: "1,234"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const k = canvasElement.querySelector("contour-kpi");
    await expect(k).toBeTruthy();
    k.setAttribute("value", "2,000");
    await expect(canvasElement.textContent).toContain("2,000");
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{i as Default,a as Reactivity,o as __namedExportsOrder,n as default};