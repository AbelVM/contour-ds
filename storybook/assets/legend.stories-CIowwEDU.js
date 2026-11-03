import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n=JSON.stringify([{key:`parks`,label:`Parks`,color:`#2f8f83`,shape:`circle`},{key:`roads`,label:`Roads`,color:`#d97757`,shape:`line`},{key:`water`,label:`Water`,color:`#61758a`,shape:`square`}]),r={title:`Contour/Data/Legend`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{title:{control:`text`},items:{control:`text`},selectable:{control:`boolean`},caption:{control:`text`},continuous:{control:`boolean`},ends:{control:`text`},ramp:{control:`text`},classification:{control:`text`}}},i={args:{title:`Map layers`,items:n,selectable:!0,caption:`Toggle visible map layers`},render:(e={})=>{let t=document.createElement(`contour-legend`);return t.setAttribute(`title`,e.title||`Map layers`),t.setAttribute(`items`,e.items||n),e.selectable&&t.setAttribute(`selectable`,``),e.caption&&t.setAttribute(`caption`,e.caption),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-legend`);await t(n).toHaveClass(/c-legend/);let r=n.querySelectorAll(`.c-legend__item`);await t(r.length).toBe(3),await t(r[0]).toHaveAttribute(`aria-pressed`,`true`),r[0].click(),await t(r[0]).toHaveAttribute(`aria-pressed`,`false`)}},a={args:{title:`Population density`,continuous:!0,ends:JSON.stringify([`Low`,`High`]),ramp:`linear-gradient(90deg, #dcefe9, #2f8f83)`,classification:`Quantile`},render:(e={})=>{let t=document.createElement(`contour-legend`);return t.setAttribute(`title`,e.title||`Population density`),e.continuous&&t.setAttribute(`continuous`,``),t.setAttribute(`ends`,e.ends||JSON.stringify([`Low`,`High`])),t.setAttribute(`ramp`,e.ramp||`linear-gradient(90deg, #dcefe9, #2f8f83)`),t.setAttribute(`classification`,e.classification||`Quantile`),t},play:async({canvasElement:e})=>{await t(e.querySelector(`.c-legend__ramp`)).toBeTruthy(),await t(e.querySelector(`.c-legend__classification`)).toHaveTextContent(`Quantile`)}},o=[`Selectable`,`Continuous`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Map layers",
    items: ITEMS,
    selectable: true,
    caption: "Toggle visible map layers"
  },
  render: (args = {}) => {
    const legend = document.createElement("contour-legend");
    legend.setAttribute("title", args.title || "Map layers");
    legend.setAttribute("items", args.items || ITEMS);
    if (args.selectable) legend.setAttribute("selectable", "");
    if (args.caption) legend.setAttribute("caption", args.caption);
    return legend;
  },
  play: async ({
    canvasElement
  }) => {
    const legend = canvasElement.querySelector("contour-legend");
    await expect(legend).toHaveClass(/c-legend/);
    const items = legend.querySelectorAll(".c-legend__item");
    await expect(items.length).toBe(3);
    await expect(items[0]).toHaveAttribute("aria-pressed", "true");
    items[0].click();
    await expect(items[0]).toHaveAttribute("aria-pressed", "false");
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Population density",
    continuous: true,
    ends: JSON.stringify(["Low", "High"]),
    ramp: "linear-gradient(90deg, #dcefe9, #2f8f83)",
    classification: "Quantile"
  },
  render: (args = {}) => {
    const legend = document.createElement("contour-legend");
    legend.setAttribute("title", args.title || "Population density");
    if (args.continuous) legend.setAttribute("continuous", "");
    legend.setAttribute("ends", args.ends || JSON.stringify(["Low", "High"]));
    legend.setAttribute("ramp", args.ramp || "linear-gradient(90deg, #dcefe9, #2f8f83)");
    legend.setAttribute("classification", args.classification || "Quantile");
    return legend;
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement.querySelector(".c-legend__ramp")).toBeTruthy();
    await expect(canvasElement.querySelector(".c-legend__classification")).toHaveTextContent("Quantile");
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{a as Continuous,i as Selectable,o as __namedExportsOrder,r as default};