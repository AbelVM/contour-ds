import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s,c;function l(){return(l=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Map/MapPopup`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{title:{control:`text`},content:{control:`text`},"cluster-count":{control:`text`},"cluster-items":{control:`text`}}},r=JSON.stringify([`A`,`B`,`C`]),i=(e={})=>{let t=document.createElement(`contour-map-popup`);return t.setAttribute(`title`,e.title||`Route info`),t.setAttribute(`content`,e.content||`12 min`),t},a={args:{title:`Route info`,body:`12 min`},render:i,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-map-popup`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-map-popup/),await t(e.textContent).toContain(`Route info`)}},o={args:{title:`Cluster`,"cluster-count":`3`,"cluster-items":r},render:(e={})=>{let t=document.createElement(`contour-map-popup`);return t.setAttribute(`title`,e.title||`Cluster`),t.setAttribute(`cluster-count`,e[`cluster-count`]||`3`),t.setAttribute(`cluster-items`,e[`cluster-items`]||r),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-map-popup`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-map-popup/);let r=n.querySelector(`.c-map-popup__cluster`);await t(r).toBeTruthy()}},s={args:{title:`Stop`,body:`Bus 42`},render:(e={})=>{let t=document.createElement(`contour-map-popup`);t.setAttribute(`title`,e.title||`Stop`),t.setAttribute(`content`,e.content||`Bus 42`);let n=document.createElement(`button`);return n.textContent=`Navigate`,t.appendChild(n),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-map-popup`);await t(n).toBeTruthy(),await t(e.textContent).toContain(`Navigate`)}},c=[`Default`,`ClusterToggle`,`WithActions`],a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Route info",
    body: "12 min"
  },
  render: renderDefault,
  play: async ({
    canvasElement
  }) => {
    const p = canvasElement.querySelector("contour-map-popup");
    await expect(p).toBeTruthy();
    await expect(p).toHaveClass(/c-map-popup/);
    await expect(canvasElement.textContent).toContain("Route info");
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Cluster",
    "cluster-count": "3",
    "cluster-items": ITEMS
  },
  render: (args = {}) => {
    const p = document.createElement("contour-map-popup");
    p.setAttribute("title", args.title || "Cluster");
    p.setAttribute("cluster-count", args["cluster-count"] || "3");
    p.setAttribute("cluster-items", args["cluster-items"] || ITEMS);
    return p;
  },
  play: async ({
    canvasElement
  }) => {
    const p = canvasElement.querySelector("contour-map-popup");
    await expect(p).toBeTruthy();
    await expect(p).toHaveClass(/c-map-popup/);
    const badge = p.querySelector(".c-map-popup__cluster");
    await expect(badge).toBeTruthy();
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Stop",
    body: "Bus 42"
  },
  render: (args = {}) => {
    const p = document.createElement("contour-map-popup");
    p.setAttribute("title", args.title || "Stop");
    p.setAttribute("content", args.content || "Bus 42");
    const btn = document.createElement("button");
    btn.textContent = "Navigate";
    p.appendChild(btn);
    return p;
  },
  play: async ({
    canvasElement
  }) => {
    const p = canvasElement.querySelector("contour-map-popup");
    await expect(p).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Navigate");
  }
}`,...s.parameters?.docs?.source}}}})))()}l();export{o as ClusterToggle,a as Default,s as WithActions,c as __namedExportsOrder,n as default};