import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i;function a(){return(a=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Compositions/LayerPanelMap`,tags:[`autodocs`],parameters:{contour:{maturity:`composition`}}},r={render:()=>{let e=document.createElement(`div`),t=document.createElement(`contour-layer-panel`);t.setAttribute(`items`,JSON.stringify([{name:`Base map`,color:`#61758a`,count:1,visible:!0},{name:`Routes`,color:`#2f8f83`,count:86,visible:!1}]));let n=document.createElement(`p`);return n.id=`comp-layer-status`,n.textContent=`idle`,e.addEventListener(`contour:layer-visibility`,()=>{n.textContent=`toggled`}),e.append(t,n),e},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-layer-panel`);await t(n).toBeTruthy(),await new Promise(e=>setTimeout(e,100));let r=n.querySelector(`.c-layer-panel__toggle`);await t(r).toBeTruthy(),r.click(),await t(e.querySelector(`#comp-layer-status`).textContent).toBe(`toggled`)}},i=[`LayerPanelEmitsVisibilityIntent`],r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrap = document.createElement("div");
    const panel = document.createElement("contour-layer-panel");
    panel.setAttribute("items", JSON.stringify([{
      name: "Base map",
      color: "#61758a",
      count: 1,
      visible: true
    }, {
      name: "Routes",
      color: "#2f8f83",
      count: 86,
      visible: false
    }]));
    const status = document.createElement("p");
    status.id = "comp-layer-status";
    status.textContent = "idle";
    wrap.addEventListener("contour:layer-visibility", () => {
      status.textContent = "toggled";
    });
    wrap.append(panel, status);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const panel = canvasElement.querySelector("contour-layer-panel");
    await expect(panel).toBeTruthy();
    // Wait for component to render
    await new Promise(r => setTimeout(r, 100));
    const toggle = panel.querySelector(".c-layer-panel__toggle");
    await expect(toggle).toBeTruthy();
    toggle.click();
    await expect(canvasElement.querySelector("#comp-layer-status").textContent).toBe("toggled");
  }
}`,...r.parameters?.docs?.source}}}})))()}a();export{r as LayerPanelEmitsVisibilityIntent,i as __namedExportsOrder,n as default};