import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{n as t,r as n}from"./fixtures-BBc-B3PQ.js";var r,i,a,o,s,c,l,u;function d(){return(d=e((()=>{n(),{expect:r,userEvent:i}=__STORYBOOK_MODULE_TEST__,a={title:`Contour/Forms/Select`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{label:{control:`text`},placeholder:{control:`text`},options:{control:`text`},disabled:{control:`boolean`},error:{control:`text`},help:{control:`text`}}},o=(e={})=>{let t=document.createElement(`contour-select`);if(e.label?t.setAttribute(`label`,e.label):t.setAttribute(`label`,`Country`),e.placeholder&&t.setAttribute(`placeholder`,e.placeholder),e.options&&t.setAttribute(`options`,e.options),e.value&&t.setAttribute(`value`,e.value),e.multiple&&t.setAttribute(`multiple`,``),e.disabled&&t.setAttribute(`disabled`,``),e.error&&t.setAttribute(`error`,e.error),e.help&&t.setAttribute(`help`,e.help),!e.options){let e=document.createElement(`select`),n=document.createElement(`option`);n.value=`us`,n.textContent=`United States`;let r=document.createElement(`option`);r.value=`ca`,r.textContent=`Canada`,e.appendChild(n),e.appendChild(r),t.appendChild(e)}return t},s={args:{label:`Country`},render:o,play:async({canvasElement:e})=>{let t=e.querySelector(`contour-select`);await r(t).toBeTruthy(),await r(t.querySelector(`select`)).toHaveClass(/c-select/),await r(e.textContent).toContain(`United States`)}},c={args:{label:`Country`},render:o,play:async({canvasElement:e})=>{let t=e.querySelector(`contour-select`);await r(t).toBeTruthy(),t.setAttribute(`label`,`Region`),await r(t).toHaveAttribute(`label`,`Region`)}},l={args:t(`contour-select`),render:({options:e})=>{let t=document.createElement(`contour-select`);return t.setAttribute(`label`,`Country`),t.setAttribute(`options`,e),t},play:async({canvasElement:e})=>{let t=e.querySelector(`contour-select`),n=e.querySelector(`select`),a=new Promise(e=>{t.addEventListener(`contour:change`,t=>e(t.detail),{once:!0})});await i.selectOptions(n,`ca`);let o=await a;await r(o).toEqual({name:null,value:`ca`,checked:null})}},u=[`Default`,`Reactivity`,`ChangeEvent`],s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Country"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const s = canvasElement.querySelector("contour-select");
    await expect(s).toBeTruthy();
    await expect(s.querySelector("select")).toHaveClass(/c-select/);
    await expect(canvasElement.textContent).toContain("United States");
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Country"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const s = canvasElement.querySelector("contour-select");
    await expect(s).toBeTruthy();
    s.setAttribute("label", "Region");
    await expect(s).toHaveAttribute("label", "Region");
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: fixtureArgs("contour-select"),
  render: ({
    options
  }) => {
    const select = document.createElement("contour-select");
    select.setAttribute("label", "Country");
    select.setAttribute("options", options);
    return select;
  },
  play: async ({
    canvasElement
  }) => {
    const select = canvasElement.querySelector("contour-select");
    const control = canvasElement.querySelector("select");
    const changed = new Promise(resolve => {
      select.addEventListener("contour:change", event => resolve(event.detail), {
        once: true
      });
    });
    await userEvent.selectOptions(control, "ca");
    const detail = await changed;
    await expect(detail).toEqual({
      name: null,
      value: "ca",
      checked: null
    });
  }
}`,...l.parameters?.docs?.source}}}})))()}d();export{l as ChangeEvent,s as Default,c as Reactivity,u as __namedExportsOrder,a as default};