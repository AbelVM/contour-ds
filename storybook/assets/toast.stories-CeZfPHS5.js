import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s;function c(){return(c=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Feedback/Toast`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{message:{control:`text`},variant:{control:`text`},duration:{control:`text`}}},r=(e={})=>{let t=document.createElement(`contour-toast`);return e.variant&&t.setAttribute(`variant`,e.variant),e.duration&&t.setAttribute(`duration`,e.duration),t.textContent=e.message?e.message:`Saved successfully`,t},i={args:{message:`Saved successfully`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-toast`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-toast/),await t(e.textContent).toContain(`Saved`)}},a={args:{message:`Saved successfully`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-toast`);await t(n).toBeTruthy(),n.textContent=`Updated`,await t(e.textContent).toContain(`Updated`)}},o={render:()=>{let e=document.createElement(`div`);e.style.display=`grid`,e.style.gap=`0.75rem`;let t=document.createElement(`contour-toast-host`);t.setAttribute(`id`,`demo-toast-host`);let n=document.createElement(`button`);n.className=`c-button`,n.type=`button`,n.textContent=`Trigger async action`;let r=document.createElement(`p`);return r.id=`toast-async-status`,r.textContent=`idle`,n.addEventListener(`click`,async()=>{r.textContent=`loading`,await new Promise(e=>setTimeout(e,10)),t.show(`Saved successfully`,{variant:`success`,duration:1200}),r.textContent=`done`}),e.append(t,n,r),e},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-toast-host`),r=e.querySelector(`button`),i=e.querySelector(`#toast-async-status`);await t(n).toBeTruthy(),await t(n).toHaveAttribute(`role`,`status`),await t(n).toHaveAttribute(`aria-live`,`polite`),await t(n).toHaveAttribute(`aria-atomic`,`true`),r.click(),await new Promise(e=>setTimeout(e,30)),await t(i.textContent).toBe(`done`),await t(n.querySelector(`.c-toast`)).toBeTruthy(),await t(n.textContent).toContain(`Saved successfully`)}},s=[`Default`,`Reactivity`,`ToastHostAsyncAction`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    message: "Saved successfully"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const t = canvasElement.querySelector("contour-toast");
    await expect(t).toBeTruthy();
    await expect(t).toHaveClass(/c-toast/);
    await expect(canvasElement.textContent).toContain("Saved");
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    message: "Saved successfully"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const t = canvasElement.querySelector("contour-toast");
    await expect(t).toBeTruthy();
    t.textContent = "Updated";
    await expect(canvasElement.textContent).toContain("Updated");
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "0.75rem";
    const host = document.createElement("contour-toast-host");
    host.setAttribute("id", "demo-toast-host");
    const btn = document.createElement("button");
    btn.className = "c-button";
    btn.type = "button";
    btn.textContent = "Trigger async action";
    const status = document.createElement("p");
    status.id = "toast-async-status";
    status.textContent = "idle";
    btn.addEventListener("click", async () => {
      status.textContent = "loading";
      await new Promise(r => setTimeout(r, 10));
      host.show("Saved successfully", {
        variant: "success",
        duration: 1200
      });
      status.textContent = "done";
    });
    wrap.append(host, btn, status);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const host = canvasElement.querySelector("contour-toast-host");
    const btn = canvasElement.querySelector("button");
    const status = canvasElement.querySelector("#toast-async-status");
    await expect(host).toBeTruthy();
    await expect(host).toHaveAttribute("role", "status");
    await expect(host).toHaveAttribute("aria-live", "polite");
    await expect(host).toHaveAttribute("aria-atomic", "true");
    btn.click();
    await new Promise(r => setTimeout(r, 30));
    await expect(status.textContent).toBe("done");
    await expect(host.querySelector(".c-toast")).toBeTruthy();
    await expect(host.textContent).toContain("Saved successfully");
  }
}`,...o.parameters?.docs?.source}}}})))()}c();export{i as Default,a as Reactivity,o as ToastHostAsyncAction,s as __namedExportsOrder,n as default};