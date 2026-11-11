import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a;function o(){return(o=e((()=>{({expect:t,userEvent:n}=__STORYBOOK_MODULE_TEST__),r={title:`Contour/Compositions/DialogForm`,tags:[`autodocs`],parameters:{contour:{maturity:`composition`}}},i={render:()=>{let e=document.createElement(`div`),t=document.createElement(`button`);t.className=`c-button`,t.textContent=`Open form`;let n=document.createElement(`contour-dialog`);return n.setAttribute(`title`,`Edit profile`),n.innerHTML=`<p>Test dialog content</p><button class="c-dialog__close" aria-label="Close">×</button>`,t.addEventListener(`click`,()=>n.show()),e.appendChild(t),e.appendChild(n),e},play:async({canvasElement:e})=>{let n=e.querySelector(`button`),r=e.querySelector(`contour-dialog`);n.click(),await t(r).toHaveAttribute(`open`,``);let i=r.querySelector(`.c-dialog__close`);i&&i.click(),await t(r).not.toHaveAttribute(`open`)}},a=[`DialogWithFormValidation`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrap = document.createElement("div");
    const trigger = document.createElement("button");
    trigger.className = "c-button";
    trigger.textContent = "Open form";
    const dlg = document.createElement("contour-dialog");
    dlg.setAttribute("title", "Edit profile");
    dlg.innerHTML = "<p>Test dialog content</p><button class=\\"c-dialog__close\\" aria-label=\\"Close\\">×</button>";
    trigger.addEventListener("click", () => dlg.show());
    wrap.appendChild(trigger);
    wrap.appendChild(dlg);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const trigger = canvasElement.querySelector("button");
    const dlg = canvasElement.querySelector("contour-dialog");
    trigger.click();
    await expect(dlg).toHaveAttribute("open", "");
    const closeBtn = dlg.querySelector(".c-dialog__close");
    if (closeBtn) closeBtn.click();
    await expect(dlg).not.toHaveAttribute("open");
  }
}`,...i.parameters?.docs?.source}}}})))()}o();export{i as DialogWithFormValidation,a as __namedExportsOrder,r as default};