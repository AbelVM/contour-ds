import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s,c,l,u,d,f,p,m;function h(){return(h=e((()=>{({expect:t,userEvent:n,within:r}=__STORYBOOK_MODULE_TEST__),i={title:`Contour/Forms/Input`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}}},a=e=>{let t=document.createElement(`contour-field`);e.label&&t.setAttribute(`label`,e.label),e.hint&&t.setAttribute(`hint`,e.hint),e.error&&t.setAttribute(`error`,e.error),e.required&&t.setAttribute(`required`,``);let n=document.createElement(`contour-input`);return e.name&&n.setAttribute(`name`,e.name),e.value&&n.setAttribute(`value`,e.value),e.placeholder&&n.setAttribute(`placeholder`,e.placeholder),e.disabled&&n.setAttribute(`disabled`,``),t.appendChild(n),t},o={render:a,args:{label:`Email`,placeholder:`you@example.com`},play:async({canvasElement:e})=>{let n=e.querySelector(`input`);await t(n).toBeTruthy(),await t(n).toHaveAttribute(`placeholder`,`you@example.com`),await t(e.querySelector(`contour-field`)).toHaveClass(/c-field/)}},s={render:a,args:{label:`Email`,value:`abel@example.com`},play:async({canvasElement:e})=>{let n=e.querySelector(`input`);await t(n).toBeTruthy(),await t(n.value).toBe(`abel@example.com`)}},c={render:a,args:{label:`Email`,disabled:!0},play:async({canvasElement:e})=>{let n=e.querySelector(`input`);n&&await t(n).toBeDisabled()}},l={render:a,args:{label:`Email`,placeholder:`you@example.com`},play:async({canvasElement:e})=>{let r=e.querySelector(`input`);await n.type(r,`abel@example.com`),await t(r.value).toBe(`abel@example.com`)}},u={render:a,args:{label:`Email`,name:`email`,placeholder:`you@example.com`},play:async({canvasElement:e})=>{let r=e.querySelector(`contour-field`),i=e.querySelector(`input`),a=new Promise(e=>{r.addEventListener(`contour:input`,t=>e(t.detail),{once:!0})});await n.type(i,`a`);let o=await a;await t(o).toEqual({name:`email`,value:`a`,checked:null})}},d={render:a,args:{label:`Email`,required:!0},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-field`);await t(n).toHaveAttribute(`required`,``);let r=e.querySelector(`input`);await t(r).toBeTruthy()}},f={render:a,args:{label:`Email`,value:`first`},play:async({canvasElement:e})=>{let n=e.querySelector(`input`);await t(n.value).toBe(`first`)}},p={render:(e={})=>document.createElement(`contour-input`),play:async({canvasElement:e})=>{let n=e.querySelector(`contour-input`);n.value=`from-property`,await t(n).toHaveAttribute(`value`,`from-property`),await t(n.value).toBe(`from-property`),n.setAttribute(`value`,`from-attribute`),await t(n.value).toBe(`from-attribute`),n.value=null,await t(n).not.toHaveAttribute(`value`)}},m=[`Default`,`WithValue`,`Disabled`,`Typing`,`InputEvent`,`RequiredValidation`,`Reactivity`,`InputPropertyReflection`],o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render,
  args: {
    label: "Email",
    placeholder: "you@example.com"
  },
  play: async ({
    canvasElement
  }) => {
    const input = canvasElement.querySelector("input");
    await expect(input).toBeTruthy();
    await expect(input).toHaveAttribute("placeholder", "you@example.com");
    await expect(canvasElement.querySelector("contour-field")).toHaveClass(/c-field/);
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render,
  args: {
    label: "Email",
    value: "abel@example.com"
  },
  play: async ({
    canvasElement
  }) => {
    const input = canvasElement.querySelector("input");
    await expect(input).toBeTruthy();
    await expect(input.value).toBe("abel@example.com");
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render,
  args: {
    label: "Email",
    disabled: true
  },
  play: async ({
    canvasElement
  }) => {
    const input = canvasElement.querySelector("input");
    if (input) await expect(input).toBeDisabled();
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render,
  args: {
    label: "Email",
    placeholder: "you@example.com"
  },
  play: async ({
    canvasElement
  }) => {
    const input = canvasElement.querySelector("input");
    await userEvent.type(input, "abel@example.com");
    await expect(input.value).toBe("abel@example.com");
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render,
  args: {
    label: "Email",
    name: "email",
    placeholder: "you@example.com"
  },
  play: async ({
    canvasElement
  }) => {
    const field = canvasElement.querySelector("contour-field");
    const input = canvasElement.querySelector("input");
    const changed = new Promise(resolve => {
      field.addEventListener("contour:input", event => resolve(event.detail), {
        once: true
      });
    });
    await userEvent.type(input, "a");
    const detail = await changed;
    await expect(detail).toEqual({
      name: "email",
      value: "a",
      checked: null
    });
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render,
  args: {
    label: "Email",
    required: true
  },
  play: async ({
    canvasElement
  }) => {
    const field = canvasElement.querySelector("contour-field");
    await expect(field).toHaveAttribute("required", "");
    const input = canvasElement.querySelector("input");
    await expect(input).toBeTruthy();
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render,
  args: {
    label: "Email",
    value: "first"
  },
  play: async ({
    canvasElement
  }) => {
    const input = canvasElement.querySelector("input");
    await expect(input.value).toBe("first");
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => document.createElement("contour-input"),
  play: async ({
    canvasElement
  }) => {
    const input = canvasElement.querySelector("contour-input");
    input.value = "from-property";
    await expect(input).toHaveAttribute("value", "from-property");
    await expect(input.value).toBe("from-property");
    input.setAttribute("value", "from-attribute");
    await expect(input.value).toBe("from-attribute");
    input.value = null;
    await expect(input).not.toHaveAttribute("value");
  }
}`,...p.parameters?.docs?.source}}}})))()}h();export{o as Default,c as Disabled,u as InputEvent,p as InputPropertyReflection,f as Reactivity,d as RequiredValidation,l as Typing,s as WithValue,m as __namedExportsOrder,i as default};