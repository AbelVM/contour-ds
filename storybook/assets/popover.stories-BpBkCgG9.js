import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t,userEvent:n}=__STORYBOOK_MODULE_TEST__),r={title:`Contour/Overlays/Popover`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{title:{control:`text`}}},i={args:{},render:(e={})=>{let t=document.createElement(`contour-popover`),n=document.createElement(`button`);n.textContent=`Toggle`,t.appendChild(n);let r=document.createElement(`div`);return r.textContent=`Popover content`,t.appendChild(r),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-popover`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-popover/)}},a={args:{title:`Details`},render:(e={})=>{let t=document.createElement(`div`),n=document.createElement(`button`);n.textContent=`Open popover`;let r=document.createElement(`contour-popover`);return r.id=`storybook-popover-trigger`,r.setAttribute(`title`,e.title||`Details`),n.setAttribute(`popovertarget`,r.id),t.append(n,r),t},play:async({canvasElement:e})=>{let r=e.querySelector(`button`),i=e.querySelector(`contour-popover`);await t(i).toHaveClass(/c-popover/);let a=!1;i.addEventListener(`contour:close`,()=>{a=!0}),r.click(),await t(i.matches(`:popover-open`)).toBe(!0),await n.keyboard(`{Escape}`),await t(a).toBe(!0),await t(i.matches(`:popover-open`)).toBe(!1)}},o=[`Default`,`TriggerAndDismiss`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {},
  render: (args = {}) => {
    const p = document.createElement("contour-popover");
    const btn = document.createElement("button");
    btn.textContent = "Toggle";
    p.appendChild(btn);
    const content = document.createElement("div");
    content.textContent = "Popover content";
    p.appendChild(content);
    return p;
  },
  play: async ({
    canvasElement
  }) => {
    const p = canvasElement.querySelector("contour-popover");
    await expect(p).toBeTruthy();
    await expect(p).toHaveClass(/c-popover/);
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Details"
  },
  render: (args = {}) => {
    const wrap = document.createElement("div");
    const trigger = document.createElement("button");
    trigger.textContent = "Open popover";
    const popover = document.createElement("contour-popover");
    popover.id = "storybook-popover-trigger";
    popover.setAttribute("title", args.title || "Details");
    trigger.setAttribute("popovertarget", popover.id);
    wrap.append(trigger, popover);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const trigger = canvasElement.querySelector("button");
    const popover = canvasElement.querySelector("contour-popover");
    await expect(popover).toHaveClass(/c-popover/);
    let closed = false;
    popover.addEventListener("contour:close", () => {
      closed = true;
    });
    trigger.click();
    await expect(popover.matches(":popover-open")).toBe(true);
    await userEvent.keyboard("{Escape}");
    await expect(closed).toBe(true);
    await expect(popover.matches(":popover-open")).toBe(false);
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{i as Default,a as TriggerAndDismiss,o as __namedExportsOrder,r as default};