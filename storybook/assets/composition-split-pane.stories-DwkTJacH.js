import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i;function a(){return(a=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Compositions/SplitPaneOverlays`,tags:[`autodocs`],parameters:{contour:{maturity:`composition`}}},r={render:()=>{let e=document.createElement(`div`);e.className=`c-split-view`,e.style.display=`grid`,e.style.gridTemplateColumns=`1fr auto 1fr`,e.style.gap=`0.5rem`;let t=document.createElement(`section`);t.innerHTML=`<h3>Inspector</h3><p>Region details</p>`;let n=document.createElement(`div`);n.className=`c-resize-handle c-resize-handle--vertical`,n.setAttribute(`role`,`separator`),n.setAttribute(`tabindex`,`0`),n.setAttribute(`aria-orientation`,`vertical`),n.setAttribute(`aria-valuenow`,`50`),n.setAttribute(`aria-label`,`Resize panes`);let r=document.createElement(`section`),i=document.createElement(`button`);i.className=`c-button`,i.textContent=`Open details`;let a=document.createElement(`contour-dialog`);return a.setAttribute(`title`,`Details`),a.innerHTML=`<p>Overlay inside split workspace.</p>`,i.addEventListener(`click`,()=>a.show()),r.append(i,a),e.append(t,n,r),e},play:async({canvasElement:e})=>{let n=e.querySelector(`.c-button`),r=e.querySelector(`contour-dialog`),i=0;r.addEventListener(`contour:close`,()=>{i+=1}),n.click(),await t(r).toHaveAttribute(`open`,``),r.querySelector(`.c-dialog__close`).click(),await t(r).not.toHaveAttribute(`open`),await t(i).toBe(1)}},i=[`SplitPaneWithDialog`],r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "c-split-view";
    wrap.style.display = "grid";
    wrap.style.gridTemplateColumns = "1fr auto 1fr";
    wrap.style.gap = "0.5rem";
    const left = document.createElement("section");
    left.innerHTML = "<h3>Inspector</h3><p>Region details</p>";
    const handle = document.createElement("div");
    handle.className = "c-resize-handle c-resize-handle--vertical";
    handle.setAttribute("role", "separator");
    handle.setAttribute("tabindex", "0");
    handle.setAttribute("aria-orientation", "vertical");
    handle.setAttribute("aria-valuenow", "50");
    handle.setAttribute("aria-label", "Resize panes");
    const right = document.createElement("section");
    const btn = document.createElement("button");
    btn.className = "c-button";
    btn.textContent = "Open details";
    const dlg = document.createElement("contour-dialog");
    dlg.setAttribute("title", "Details");
    dlg.innerHTML = "<p>Overlay inside split workspace.</p>";
    btn.addEventListener("click", () => dlg.show());
    right.append(btn, dlg);
    wrap.append(left, handle, right);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const btn = canvasElement.querySelector(".c-button");
    const dlg = canvasElement.querySelector("contour-dialog");
    let closed = 0;
    dlg.addEventListener("contour:close", () => {
      closed += 1;
    });
    btn.click();
    await expect(dlg).toHaveAttribute("open", "");
    dlg.querySelector(".c-dialog__close").click();
    await expect(dlg).not.toHaveAttribute("open");
    await expect(closed).toBe(1);
    // Focus return is asserted in the browser probe, not here: Storybook's
    // test harness replaces the focus accessor, so \`btn.focus()\` would land on
    // the dialog's close button and the assertion would measure the harness.
  }
}`,...r.parameters?.docs?.source}}}})))()}a();export{r as SplitPaneWithDialog,i as __namedExportsOrder,n as default};