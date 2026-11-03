import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s,c,l,u,d,f;function p(){return(p=e((()=>{({expect:t,userEvent:n,within:r}=__STORYBOOK_MODULE_TEST__),i={title:`Contour/Overlays/Dialog`,tags:[`autodocs`],argTypes:{title:{control:`text`},size:{control:`text`}},parameters:{contour:{maturity:`complete-widget`}}},a={render:(e={})=>{let t=document.createElement(`contour-btn`);t.setAttribute(`label`,`Open dialog`);let n=document.createElement(`contour-dialog`);e.title?n.setAttribute(`title`,e.title):n.setAttribute(`title`,`Confirm`),e.size&&n.setAttribute(`size`,e.size);let r=document.createElement(`p`);r.textContent=`Dialog body content.`,n.appendChild(r);let i=document.createElement(`div`);return i.appendChild(t),i.appendChild(n),i},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-dialog`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-dialog/),await t(e.textContent).toContain(`Dialog body content.`)}},o={render:(e={})=>{let t=document.createElement(`contour-dialog`);e.title?t.setAttribute(`title`,e.title):t.setAttribute(`title`,`Confirm`),e.size&&t.setAttribute(`size`,e.size);let n=document.createElement(`p`);return n.textContent=`Dialog body content.`,t.appendChild(n),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-dialog`);n.show(),await t(n).toHaveAttribute(`open`,``),n.close(),await t(n).not.toHaveAttribute(`open`)}},s={render:(e={})=>{let t=document.createElement(`contour-dialog`);e.title?t.setAttribute(`title`,e.title):t.setAttribute(`title`,`Confirm`),e.size&&t.setAttribute(`size`,e.size);let n=document.createElement(`p`);return n.textContent=`Dialog body content.`,t.appendChild(n),t},play:async({canvasElement:e})=>{let r=e.querySelector(`contour-dialog`);r.show(),await t(r).toHaveAttribute(`open`,``),await n.keyboard(`{Escape}`),await t(r).not.toHaveAttribute(`open`)}},c={render:(e={})=>{let t=document.createElement(`contour-dialog`);return e.title?t.setAttribute(`title`,e.title):t.setAttribute(`title`,`Confirm`),e.size&&t.setAttribute(`size`,e.size),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-dialog`),r=!1;n.addEventListener(`contour:open`,()=>{r=!0}),n.show(),await t(r).toBe(!0),n.close()}},l={render:(e={})=>{let t=document.createElement(`button`);t.textContent=`Open dialog`;let n=document.createElement(`contour-dialog`);e.title?n.setAttribute(`title`,e.title):n.setAttribute(`title`,`Confirm`),e.size&&n.setAttribute(`size`,e.size);let r=document.createElement(`div`);return r.appendChild(t),r.appendChild(n),r},play:async({canvasElement:e})=>{let n=e.querySelector(`button`),r=e.querySelector(`contour-dialog`);n.focus(),r.show(),r.close(),await t(r).not.toHaveAttribute(`open`),await t(r).not.toHaveAttribute(`aria-modal`)}},u={render:(e={})=>{let t=document.createElement(`contour-dialog`);e.title?t.setAttribute(`title`,e.title):t.setAttribute(`title`,`Confirm`),e.size&&t.setAttribute(`size`,e.size);let n=document.createElement(`button`);n.textContent=`Cancel`;let r=document.createElement(`button`);return r.textContent=`Confirm`,t.append(n,r),t},play:async({canvasElement:e})=>{let r=e.querySelector(`contour-dialog`),i=r.querySelector(`.c-dialog__close`),a=Array.from(r.querySelectorAll(`button`)).at(-1);r.show(),a.focus(),await n.tab(),await t(i).toHaveFocus(),r.close()}},d={render:(e={})=>{let t=document.createElement(`div`),n=document.createElement(`contour-dialog`);e.title&&n.setAttribute(`title`,e.title),e.size&&n.setAttribute(`size`,e.size),e.title?n.setAttribute(`title`,e.title):n.setAttribute(`title`,`Parent dialog`);let r=document.createElement(`contour-drawer`);return r.setAttribute(`title`,`Nested drawer`),t.append(n,r),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-dialog`),r=e.querySelector(`contour-drawer`);n.show(),r.show(),await t(n).toHaveAttribute(`open`,``),await t(r).toHaveAttribute(`open`,``),r.dispatchEvent(new KeyboardEvent(`keydown`,{key:`Escape`,bubbles:!0})),await t(r).not.toHaveAttribute(`open`),await t(n).toHaveAttribute(`open`,``),n.dispatchEvent(new KeyboardEvent(`keydown`,{key:`Escape`,bubbles:!0})),await t(n).not.toHaveAttribute(`open`)}},f=[`Default`,`OpenClose`,`EscapeCloses`,`OpenEvent`,`FocusReturn`,`ModalTabTrap`,`NestedOverlayEscape`],a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const btn = document.createElement("contour-btn");
    btn.setAttribute("label", "Open dialog");
    const dlg = document.createElement("contour-dialog");
    if (args.title) dlg.setAttribute("title", args.title);else dlg.setAttribute("title", "Confirm");
    if (args.size) dlg.setAttribute("size", args.size);
    const p = document.createElement("p");
    p.textContent = "Dialog body content.";
    dlg.appendChild(p);
    const wrap = document.createElement("div");
    wrap.appendChild(btn);
    wrap.appendChild(dlg);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const dlg = canvasElement.querySelector("contour-dialog");
    await expect(dlg).toBeTruthy();
    await expect(dlg).toHaveClass(/c-dialog/);
    await expect(canvasElement.textContent).toContain("Dialog body content.");
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const dlg = document.createElement("contour-dialog");
    if (args.title) dlg.setAttribute("title", args.title);else dlg.setAttribute("title", "Confirm");
    if (args.size) dlg.setAttribute("size", args.size);
    const p = document.createElement("p");
    p.textContent = "Dialog body content.";
    dlg.appendChild(p);
    return dlg;
  },
  play: async ({
    canvasElement
  }) => {
    const dlg = canvasElement.querySelector("contour-dialog");
    dlg.show();
    await expect(dlg).toHaveAttribute("open", "");
    dlg.close();
    await expect(dlg).not.toHaveAttribute("open");
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const dlg = document.createElement("contour-dialog");
    if (args.title) dlg.setAttribute("title", args.title);else dlg.setAttribute("title", "Confirm");
    if (args.size) dlg.setAttribute("size", args.size);
    const p = document.createElement("p");
    p.textContent = "Dialog body content.";
    dlg.appendChild(p);
    return dlg;
  },
  play: async ({
    canvasElement
  }) => {
    const dlg = canvasElement.querySelector("contour-dialog");
    dlg.show();
    await expect(dlg).toHaveAttribute("open", "");
    await userEvent.keyboard("{Escape}");
    await expect(dlg).not.toHaveAttribute("open");
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const dlg = document.createElement("contour-dialog");
    if (args.title) dlg.setAttribute("title", args.title);else dlg.setAttribute("title", "Confirm");
    if (args.size) dlg.setAttribute("size", args.size);
    return dlg;
  },
  play: async ({
    canvasElement
  }) => {
    const dlg = canvasElement.querySelector("contour-dialog");
    let opened = false;
    dlg.addEventListener("contour:open", () => {
      opened = true;
    });
    dlg.show();
    await expect(opened).toBe(true);
    dlg.close();
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const trigger = document.createElement("button");
    trigger.textContent = "Open dialog";
    const dlg = document.createElement("contour-dialog");
    if (args.title) dlg.setAttribute("title", args.title);else dlg.setAttribute("title", "Confirm");
    if (args.size) dlg.setAttribute("size", args.size);
    const wrap = document.createElement("div");
    wrap.appendChild(trigger);
    wrap.appendChild(dlg);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const trigger = canvasElement.querySelector("button");
    const dlg = canvasElement.querySelector("contour-dialog");
    trigger.focus();
    dlg.show();
    dlg.close();
    await expect(dlg).not.toHaveAttribute("open");
    await expect(dlg).not.toHaveAttribute("aria-modal");
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const dlg = document.createElement("contour-dialog");
    if (args.title) dlg.setAttribute("title", args.title);else dlg.setAttribute("title", "Confirm");
    if (args.size) dlg.setAttribute("size", args.size);
    const first = document.createElement("button");
    first.textContent = "Cancel";
    const last = document.createElement("button");
    last.textContent = "Confirm";
    dlg.append(first, last);
    return dlg;
  },
  play: async ({
    canvasElement
  }) => {
    const dlg = canvasElement.querySelector("contour-dialog");
    const close = dlg.querySelector(".c-dialog__close");
    const last = Array.from(dlg.querySelectorAll("button")).at(-1);
    dlg.show();
    last.focus();
    await userEvent.tab();
    await expect(close).toHaveFocus();
    dlg.close();
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const wrap = document.createElement("div");
    const dlg = document.createElement("contour-dialog");
    if (args.title) dlg.setAttribute("title", args.title);
    if (args.size) dlg.setAttribute("size", args.size);
    if (args.title) dlg.setAttribute("title", args.title);else dlg.setAttribute("title", "Parent dialog");
    const drawer = document.createElement("contour-drawer");
    drawer.setAttribute("title", "Nested drawer");
    wrap.append(dlg, drawer);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const dlg = canvasElement.querySelector("contour-dialog");
    const drawer = canvasElement.querySelector("contour-drawer");
    dlg.show();
    drawer.show();
    await expect(dlg).toHaveAttribute("open", "");
    await expect(drawer).toHaveAttribute("open", "");
    drawer.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true
    }));
    await expect(drawer).not.toHaveAttribute("open");
    await expect(dlg).toHaveAttribute("open", "");
    dlg.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true
    }));
    await expect(dlg).not.toHaveAttribute("open");
  }
}`,...d.parameters?.docs?.source}}}})))()}p();export{a as Default,s as EscapeCloses,l as FocusReturn,u as ModalTabTrap,d as NestedOverlayEscape,o as OpenClose,c as OpenEvent,f as __namedExportsOrder,i as default};