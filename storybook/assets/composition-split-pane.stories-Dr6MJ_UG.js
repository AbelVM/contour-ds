import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a;function o(){return(o=e((()=>{({expect:t,userEvent:n}=__STORYBOOK_MODULE_TEST__),r={title:`Contour/Compositions/SplitPaneOverlays`,tags:[`autodocs`],parameters:{contour:{maturity:`composition`}}},i={render:()=>{let e=document.createElement(`div`);e.className=`c-split-view`,e.style.display=`grid`,e.style.gridTemplateColumns=`1fr auto 1fr`,e.style.gap=`0.5rem`;let t=document.createElement(`section`);t.innerHTML=`<h3>Inspector</h3><p>Region details</p>`;let n=document.createElement(`div`);n.className=`c-resize-handle c-resize-handle--vertical`,n.setAttribute(`role`,`separator`),n.setAttribute(`tabindex`,`0`),n.setAttribute(`aria-orientation`,`vertical`),n.setAttribute(`aria-label`,`Resize panes`);let r=document.createElement(`section`),i=document.createElement(`button`);i.className=`c-button`,i.textContent=`Open details`;let a=document.createElement(`contour-dialog`);return a.setAttribute(`title`,`Details`),a.innerHTML=`<p>Overlay inside split workspace.</p>`,i.addEventListener(`click`,()=>a.show()),r.append(i,a),e.append(t,n,r),e},play:async({canvasElement:e})=>{let r=e.querySelector(`.c-resize-handle`);await t(r).toBeTruthy(),await t(r).toHaveAttribute(`role`,`separator`);let i=e.querySelector(`.c-button`);i.click();let a=e.querySelector(`contour-dialog`);await t(a).toHaveAttribute(`open`,``),await n.keyboard(`{Escape}`),await t(a).not.toHaveAttribute(`open`),await t(i).toHaveFocus()}},a=[`SplitPaneWithDialog`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
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
    const handle = canvasElement.querySelector(".c-resize-handle");
    await expect(handle).toBeTruthy();
    await expect(handle).toHaveAttribute("role", "separator");
    const btn = canvasElement.querySelector(".c-button");
    btn.click();
    const dlg = canvasElement.querySelector("contour-dialog");
    await expect(dlg).toHaveAttribute("open", "");
    // Close with Escape
    await userEvent.keyboard("{Escape}");
    await expect(dlg).not.toHaveAttribute("open");
    // Focus should return to trigger button
    await expect(btn).toHaveFocus();
  }
}`,...i.parameters?.docs?.source}}}})))()}o();export{i as SplitPaneWithDialog,a as __namedExportsOrder,r as default};