import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s,c;function l(){return(l=e((()=>{({expect:t,userEvent:n}=__STORYBOOK_MODULE_TEST__),r={title:`Contour/Forms/Switch`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{label:{control:`text`},checked:{control:`boolean`},disabled:{control:`boolean`},error:{control:`text`},help:{control:`text`}}},i=(e={})=>{let t=document.createElement(`contour-switch`);return e.label?t.setAttribute(`label`,e.label):t.setAttribute(`label`,`Enable notifications`),e.checked&&t.setAttribute(`checked`,``),e.disabled&&t.setAttribute(`disabled`,``),e.error&&t.setAttribute(`error`,e.error),e.help&&t.setAttribute(`help`,e.help),t},a={args:{label:`Enable notifications`},render:i,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-switch`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-switch/),await t(e.textContent).toContain(`Enable notifications`)}},o={args:{label:`Enable notifications`,checked:!0},render:i,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-switch`);await t(n).toBeTruthy(),await t(n).toHaveAttribute(`checked`,``)}},s={args:{label:`Enable notifications`},render:a.render,play:async({canvasElement:e})=>{let r=e.querySelector(`contour-switch`),i=e.querySelector(`input`),a=new Promise(e=>{r.addEventListener(`contour:change`,t=>e(t.detail),{once:!0})});await n.click(i);let o=await a;await t(o).toEqual({name:null,value:`on`,checked:!0}),await t(i).toBeChecked(),await t(i).toHaveAttribute(`aria-checked`,`true`)}},c=[`Default`,`Checked`,`ChangeEvent`],a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Enable notifications"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const s = canvasElement.querySelector("contour-switch");
    await expect(s).toBeTruthy();
    await expect(s).toHaveClass(/c-switch/);
    await expect(canvasElement.textContent).toContain("Enable notifications");
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Enable notifications",
    checked: true
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const s = canvasElement.querySelector("contour-switch");
    await expect(s).toBeTruthy();
    await expect(s).toHaveAttribute("checked", "");
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Enable notifications"
  },
  render: Default.render,
  play: async ({
    canvasElement
  }) => {
    const switchControl = canvasElement.querySelector("contour-switch");
    const input = canvasElement.querySelector("input");
    const changed = new Promise(resolve => {
      switchControl.addEventListener("contour:change", event => resolve(event.detail), {
        once: true
      });
    });
    await userEvent.click(input);
    const detail = await changed;
    await expect(detail).toEqual({
      name: null,
      value: "on",
      checked: true
    });
    await expect(input).toBeChecked();
    await expect(input).toHaveAttribute("aria-checked", "true");
  }
}`,...s.parameters?.docs?.source}}}})))()}l();export{s as ChangeEvent,o as Checked,a as Default,c as __namedExportsOrder,r as default};