import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Data/VirtualList`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{items:{control:`text`},"item-height":{control:`text`},orientation:{control:`text`},sticky:{control:`boolean`}}},r=JSON.stringify(Array.from({length:200},(e,t)=>`Item ${t}`)),i={args:{items:r,"item-height":`auto`},render:(e={})=>{let t=document.createElement(`contour-virtual-list`);return t.setAttribute(`items`,e.items||r),t.setAttribute(`item-height`,e[`item-height`]||`auto`),e.sticky&&t.setAttribute(`sticky`,``),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-virtual-list`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-virtual-list/);let r=n.querySelector(`.c-virtual-list__scroller`);await t(r).toBeTruthy();let i=n.querySelectorAll(`.c-virtual-list__item`);await t(i.length).toBeGreaterThan(0)}},a={args:{items:r,orientation:`horizontal`},render:(e={})=>{let t=document.createElement(`contour-virtual-list`);return t.setAttribute(`items`,e.items||r),t.setAttribute(`orientation`,e.orientation||`horizontal`),e.sticky&&t.setAttribute(`sticky`,``),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-virtual-list`);await t(n).toBeTruthy()}},o=[`MeasuredHeights`,`Horizontal`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    items: ITEMS,
    "item-height": "auto"
  },
  render: (args = {}) => {
    const v = document.createElement("contour-virtual-list");
    v.setAttribute("items", args.items || ITEMS);
    v.setAttribute("item-height", args["item-height"] || "auto");
    if (args.sticky) v.setAttribute("sticky", "");
    return v;
  },
  play: async ({
    canvasElement
  }) => {
    const v = canvasElement.querySelector("contour-virtual-list");
    await expect(v).toBeTruthy();
    await expect(v).toHaveClass(/c-virtual-list/);
    const scroller = v.querySelector(".c-virtual-list__scroller");
    await expect(scroller).toBeTruthy();
    const items = v.querySelectorAll(".c-virtual-list__item");
    await expect(items.length).toBeGreaterThan(0);
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    items: ITEMS,
    orientation: "horizontal"
  },
  render: (args = {}) => {
    const v = document.createElement("contour-virtual-list");
    v.setAttribute("items", args.items || ITEMS);
    v.setAttribute("orientation", args.orientation || "horizontal");
    if (args.sticky) v.setAttribute("sticky", "");
    return v;
  },
  play: async ({
    canvasElement
  }) => {
    const v = canvasElement.querySelector("contour-virtual-list");
    await expect(v).toBeTruthy();
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{a as Horizontal,i as MeasuredHeights,o as __namedExportsOrder,n as default};