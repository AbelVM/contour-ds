import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a;function o(){return(o=e((()=>{({expect:t,userEvent:n}=__STORYBOOK_MODULE_TEST__),r={title:`Contour/Compositions/DialogForm`,tags:[`autodocs`],parameters:{contour:{maturity:`composition`}}},i={render:()=>{let e=document.createElement(`div`),t=document.createElement(`button`);t.className=`c-button`,t.textContent=`Open form`;let n=document.createElement(`contour-dialog`);n.setAttribute(`title`,`Edit profile`);let r=document.createElement(`form`);return r.innerHTML=`
      <label class="c-label" for="comp-name">Name</label>
      <input id="comp-name" class="c-input" name="name" required />
      <p class="c-field__error" id="comp-name-err" hidden>Name is required</p>
      <button type="submit" class="c-button c-button--primary">Save</button>
    `,r.addEventListener(`submit`,e=>{e.preventDefault();let t=r.querySelector(`input`),i=r.querySelector(`#comp-name-err`);t.value?(i.hidden=!0,t.removeAttribute(`aria-invalid`),n.close()):(i.hidden=!1,t.setAttribute(`aria-invalid`,`true`))}),n.appendChild(r),t.addEventListener(`click`,()=>n.show()),e.append(t,n),e},play:async({canvasElement:e})=>{let r=e.querySelector(`button`),i=e.querySelector(`contour-dialog`);r.click(),await t(i).toHaveAttribute(`open`,``);let a=e.querySelector(`button[type="submit"]`);a.click();let o=e.querySelector(`#comp-name-err`);await t(o.hidden).toBe(!1);let s=e.querySelector(`input`);await n.type(s,`Ada`),a.click(),await t(i).not.toHaveAttribute(`open`)}},a=[`DialogWithFormValidation`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrap = document.createElement("div");
    const trigger = document.createElement("button");
    trigger.className = "c-button";
    trigger.textContent = "Open form";
    const dlg = document.createElement("contour-dialog");
    dlg.setAttribute("title", "Edit profile");
    const form = document.createElement("form");
    form.innerHTML = \`
      <label class="c-label" for="comp-name">Name</label>
      <input id="comp-name" class="c-input" name="name" required />
      <p class="c-field__error" id="comp-name-err" hidden>Name is required</p>
      <button type="submit" class="c-button c-button--primary">Save</button>
    \`;
    form.addEventListener("submit", e => {
      e.preventDefault();
      const input = form.querySelector("input");
      const err = form.querySelector("#comp-name-err");
      if (!input.value) {
        err.hidden = false;
        input.setAttribute("aria-invalid", "true");
      } else {
        err.hidden = true;
        input.removeAttribute("aria-invalid");
        dlg.close();
      }
    });
    dlg.appendChild(form);
    trigger.addEventListener("click", () => dlg.show());
    wrap.append(trigger, dlg);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const trigger = canvasElement.querySelector("button");
    const dlg = canvasElement.querySelector("contour-dialog");
    trigger.click();
    await expect(dlg).toHaveAttribute("open", "");
    const submit = canvasElement.querySelector('button[type="submit"]');
    submit.click();
    const err = canvasElement.querySelector("#comp-name-err");
    await expect(err.hidden).toBe(false);
    const input = canvasElement.querySelector("input");
    await userEvent.type(input, "Ada");
    submit.click();
    await expect(dlg).not.toHaveAttribute("open");
  }
}`,...i.parameters?.docs?.source}}}})))()}o();export{i as DialogWithFormValidation,a as __namedExportsOrder,r as default};