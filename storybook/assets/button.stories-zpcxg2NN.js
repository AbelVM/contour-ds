import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{i as t,r as n}from"./metadata-DhdfTLN7.js";var r,i,a,o,s,c,l,u,d,f,p;function m(){return(m=e((()=>{n(),{expect:r,userEvent:i,within:a}=__STORYBOOK_MODULE_TEST__,o={title:`Contour/Interaction/Button`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{variant:t(`c-btn`),size:{control:`select`,options:[``,`sm`,`lg`]},color:{control:`text`},label:{control:`text`},disabled:{control:`boolean`}}},s=e=>{let t=document.createElement(`contour-btn`);return e.variant&&t.setAttribute(`variant`,e.variant),e.size&&t.setAttribute(`size`,e.size),e.color&&t.setAttribute(`color`,e.color),e.label&&t.setAttribute(`label`,e.label),e.disabled&&t.setAttribute(`disabled`,``),e.label||(t.textContent=`Button`),t},c={render:s,args:{label:`Save changes`},play:async({canvasElement:e})=>{let t=a(e).getByRole(`button`);await r(t).toHaveTextContent(`Save changes`),await r(t).toHaveClass(/c-btn/),await i.click(t),await r(t).toHaveAttribute(`tabindex`,`0`)}},l={render:s,args:{label:`Save changes`,disabled:!0},play:async({canvasElement:e})=>{let t=a(e).getByRole(`button`);await r(t).toHaveAttribute(`aria-disabled`,`true`),await r(t).toHaveAttribute(`tabindex`,`-1`)}},u={render:s,args:{label:`Save changes`,variant:`primary`},play:async({canvasElement:e})=>{let t=a(e).getByRole(`button`);await r(t).toHaveClass(/c-btn--primary/)}},d={render:s,args:{label:`Save changes`},play:async({canvasElement:e})=>{let t=e.querySelector(`contour-btn`),n=!1;t.addEventListener(`contour:activate`,()=>{n=!0}),t.focus(),await i.keyboard(`{Enter}`),await r(n).toBe(!0)}},f={render:s,args:{label:`Save changes`},play:async({canvasElement:e})=>{let t=e.querySelector(`contour-btn`);await r(t).not.toHaveClass(/c-btn--danger/),t.setAttribute(`variant`,`danger`),await r(t).toHaveClass(/c-btn--danger/)}},p=[`Default`,`Disabled`,`Primary`,`KeyboardActivate`,`Reactivity`],c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render,
  args: {
    label: "Save changes"
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole("button");
    await expect(btn).toHaveTextContent("Save changes");
    await expect(btn).toHaveClass(/c-btn/);
    await userEvent.click(btn);
    await expect(btn).toHaveAttribute("tabindex", "0");
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render,
  args: {
    label: "Save changes",
    disabled: true
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole("button");
    await expect(btn).toHaveAttribute("aria-disabled", "true");
    await expect(btn).toHaveAttribute("tabindex", "-1");
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render,
  args: {
    label: "Save changes",
    variant: "primary"
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole("button");
    await expect(btn).toHaveClass(/c-btn--primary/);
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render,
  args: {
    label: "Save changes"
  },
  play: async ({
    canvasElement
  }) => {
    const btn = canvasElement.querySelector("contour-btn");
    let activated = false;
    btn.addEventListener("contour:activate", () => {
      activated = true;
    });
    btn.focus();
    await userEvent.keyboard("{Enter}");
    await expect(activated).toBe(true);
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render,
  args: {
    label: "Save changes"
  },
  play: async ({
    canvasElement
  }) => {
    const btn = canvasElement.querySelector("contour-btn");
    await expect(btn).not.toHaveClass(/c-btn--danger/);
    btn.setAttribute("variant", "danger");
    await expect(btn).toHaveClass(/c-btn--danger/);
  }
}`,...f.parameters?.docs?.source}}}})))()}m();export{c as Default,l as Disabled,d as KeyboardActivate,u as Primary,f as Reactivity,p as __namedExportsOrder,o as default};