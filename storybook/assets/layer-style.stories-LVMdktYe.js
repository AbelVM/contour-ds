import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a;function o(){return(o=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Map/LayerAndStyle`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{title:{control:`text`},items:{control:`text`},layers:{control:`text`}}},r={args:{title:`Map layers`,items:JSON.stringify([{name:`North loop`,visible:!0},{name:`Harbor path`,visible:!1}])},render:(e={})=>{let t=document.createElement(`contour-layer-panel`);return t.setAttribute(`title`,e.title||`Map layers`),t.setAttribute(`items`,e.items||JSON.stringify([{name:`North loop`,visible:!0},{name:`Harbor path`,visible:!1}])),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-layer-panel`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-layer-panel/)}},i={args:{title:`Style layers`,layers:JSON.stringify([{name:`Buildings`,color:`#d97757`,classification:`quantile`,opacity:85},{name:`Routes`,color:`#2f8f83`,classification:`equal`,opacity:100}])},render:(e={})=>{let t=document.createElement(`contour-style-panel`);return t.setAttribute(`title`,e.title||`Style layers`),t.setAttribute(`layers`,e.layers||JSON.stringify([{name:`Buildings`,color:`#d97757`,classification:`quantile`,opacity:85},{name:`Routes`,color:`#2f8f83`,classification:`equal`,opacity:100}])),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-style-panel`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-style-panel/),await t(n.querySelectorAll(`.c-style-panel__row`).length).toBe(2)}},a=[`LayerPanel`,`StylePanel`],r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Map layers",
    items: JSON.stringify([{
      name: "North loop",
      visible: true
    }, {
      name: "Harbor path",
      visible: false
    }])
  },
  render: (args = {}) => {
    const panel = document.createElement("contour-layer-panel");
    panel.setAttribute("title", args.title || "Map layers");
    panel.setAttribute("items", args.items || JSON.stringify([{
      name: "North loop",
      visible: true
    }, {
      name: "Harbor path",
      visible: false
    }]));
    return panel;
  },
  play: async ({
    canvasElement
  }) => {
    const panel = canvasElement.querySelector("contour-layer-panel");
    await expect(panel).toBeTruthy();
    await expect(panel).toHaveClass(/c-layer-panel/);
  }
}`,...r.parameters?.docs?.source}}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Style layers",
    layers: JSON.stringify([{
      name: "Buildings",
      color: "#d97757",
      classification: "quantile",
      opacity: 85
    }, {
      name: "Routes",
      color: "#2f8f83",
      classification: "equal",
      opacity: 100
    }])
  },
  render: (args = {}) => {
    const panel = document.createElement("contour-style-panel");
    panel.setAttribute("title", args.title || "Style layers");
    panel.setAttribute("layers", args.layers || JSON.stringify([{
      name: "Buildings",
      color: "#d97757",
      classification: "quantile",
      opacity: 85
    }, {
      name: "Routes",
      color: "#2f8f83",
      classification: "equal",
      opacity: 100
    }]));
    return panel;
  },
  play: async ({
    canvasElement
  }) => {
    const panel = canvasElement.querySelector("contour-style-panel");
    await expect(panel).toBeTruthy();
    await expect(panel).toHaveClass(/c-style-panel/);
    await expect(panel.querySelectorAll(".c-style-panel__row").length).toBe(2);
  }
}`,...i.parameters?.docs?.source}}}})))()}o();export{r as LayerPanel,i as StylePanel,a as __namedExportsOrder,n as default};