import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s,c;function l(){return(l=e((()=>{({expect:t,userEvent:n}=__STORYBOOK_MODULE_TEST__),r={title:`Contour/Forms/Textarea`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{placeholder:{control:`text`},required:{control:`boolean`},disabled:{control:`boolean`},error:{control:`text`},help:{control:`text`}}},i=(e={})=>{let t=document.createElement(`contour-textarea`);return e.label?t.setAttribute(`label`,e.label):t.setAttribute(`label`,`Notes`),e.placeholder?t.setAttribute(`placeholder`,e.placeholder):t.setAttribute(`placeholder`,`Write something…`),e.value&&t.setAttribute(`value`,e.value),e.required&&t.setAttribute(`required`,``),e.disabled&&t.setAttribute(`disabled`,``),e.error&&t.setAttribute(`error`,e.error),e.help&&t.setAttribute(`help`,e.help),t},a={args:{label:`Notes`,placeholder:`Write something…`},render:i,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-textarea`);await t(n).toBeTruthy(),await t(e.querySelector(`textarea.c-textarea`)).toBeTruthy();let r=e.querySelector(`textarea`);r&&await t(r).toHaveAttribute(`placeholder`,`Write something…`)}},o={args:{label:`Notes`},render:i,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-textarea`);await t(n).toBeTruthy(),n.setAttribute(`label`,`Comments`),await t(n).toHaveAttribute(`label`,`Comments`)}},s={args:{label:`Notes`,placeholder:`Write something…`},render:a.render,play:async({canvasElement:e})=>{let r=e.querySelector(`contour-textarea`),i=e.querySelector(`textarea`),a=new Promise(e=>{r.addEventListener(`contour:input`,t=>e(t.detail),{once:!0})});await n.type(i,`N`);let o=await a;await t(o).toEqual({name:null,value:`N`,checked:null})}},c=[`Default`,`Reactivity`,`InputEvent`],a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Notes",
    placeholder: "Write something…"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const t = canvasElement.querySelector("contour-textarea");
    await expect(t).toBeTruthy();
    await expect(canvasElement.querySelector("textarea.c-textarea")).toBeTruthy();
    const ta = canvasElement.querySelector("textarea");
    if (ta) await expect(ta).toHaveAttribute("placeholder", "Write something…");
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Notes"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const t = canvasElement.querySelector("contour-textarea");
    await expect(t).toBeTruthy();
    t.setAttribute("label", "Comments");
    await expect(t).toHaveAttribute("label", "Comments");
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Notes",
    placeholder: "Write something…"
  },
  render: Default.render,
  play: async ({
    canvasElement
  }) => {
    const textarea = canvasElement.querySelector("contour-textarea");
    const control = canvasElement.querySelector("textarea");
    const changed = new Promise(resolve => {
      textarea.addEventListener("contour:input", event => resolve(event.detail), {
        once: true
      });
    });
    await userEvent.type(control, "N");
    const detail = await changed;
    await expect(detail).toEqual({
      name: null,
      value: "N",
      checked: null
    });
  }
}`,...s.parameters?.docs?.source}}}})))()}l();export{a as Default,s as InputEvent,o as Reactivity,c as __namedExportsOrder,r as default};