import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s,c;function l(){return(l=e((()=>{({expect:t,userEvent:n}=__STORYBOOK_MODULE_TEST__),r={title:`Contour/Navigation/Tree`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{items:{control:`text`},virtual:{control:`boolean`},"item-height":{control:`text`}}},i=JSON.stringify([{label:`Routes`,children:[{label:`North`}]},{label:`Stations`}]),a=(e={})=>{let t=document.createElement(`contour-tree`);return t.setAttribute(`items`,e.items||i),e.virtual&&t.setAttribute(`virtual`,``),e[`item-height`]&&t.setAttribute(`item-height`,e[`item-height`]),e.maxHeight&&(t.style.maxHeight=e.maxHeight),t},o={args:{items:i},render:a,play:async({canvasElement:e})=>{let r=e.querySelector(`contour-tree`),i=r.querySelector(`.c-tree__toggle`);i.focus(),await n.keyboard(`{ArrowRight}`),await t(i).toHaveAttribute(`aria-expanded`,`true`);let a=r.querySelectorAll(`[role='treeitem']:not([hidden])`);await n.keyboard(`{ArrowDown}`),await t(document.activeElement).toBe(a[1].querySelector(`.c-tree__leaf`)),await n.keyboard(`{ArrowLeft}`),await t(document.activeElement).toBe(i)}},s={args:{virtual:!0,"item-height":`28`,items:JSON.stringify(Array.from({length:1e3},(e,t)=>({label:`Node `+t}))),maxHeight:`12rem`},render:(e={})=>{let t=document.createElement(`contour-tree`);t.setAttribute(`virtual`,``),t.setAttribute(`item-height`,e[`item-height`]||`28`);let n=e.items||JSON.stringify(Array.from({length:1e3},(e,t)=>({label:`Node `+t})));return t.setAttribute(`items`,n),t.style.maxHeight=e.maxHeight||`12rem`,t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-tree`).querySelector(`.c-tree`).querySelectorAll(`.c-tree__node`).length;await t(n).toBeLessThan(50),await t(n).toBeGreaterThan(0)}},c=[`KeyboardNavigation`,`VirtualWindowing`],o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    items: ITEMS
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const tree = canvasElement.querySelector("contour-tree");
    const toggle = tree.querySelector(".c-tree__toggle");
    toggle.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const visibleItems = tree.querySelectorAll("[role='treeitem']:not([hidden])");
    await userEvent.keyboard("{ArrowDown}");
    await expect(document.activeElement).toBe(visibleItems[1].querySelector(".c-tree__leaf"));
    await userEvent.keyboard("{ArrowLeft}");
    await expect(document.activeElement).toBe(toggle);
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    virtual: true,
    "item-height": "28",
    items: JSON.stringify(Array.from({
      length: 1000
    }, (_, i) => ({
      label: "Node " + i
    }))),
    maxHeight: "12rem"
  },
  render: (args = {}) => {
    const tree = document.createElement("contour-tree");
    tree.setAttribute("virtual", "");
    tree.setAttribute("item-height", args["item-height"] || "28");
    const items = args.items || JSON.stringify(Array.from({
      length: 1000
    }, (_, i) => ({
      label: "Node " + i
    })));
    tree.setAttribute("items", items);
    tree.style.maxHeight = args.maxHeight || "12rem";
    return tree;
  },
  play: async ({
    canvasElement
  }) => {
    const tree = canvasElement.querySelector("contour-tree");
    const scroller = tree.querySelector(".c-tree");
    const rendered = scroller.querySelectorAll(".c-tree__node").length;
    await expect(rendered).toBeLessThan(50);
    await expect(rendered).toBeGreaterThan(0);
  }
}`,...s.parameters?.docs?.source}}}})))()}l();export{o as KeyboardNavigation,s as VirtualWindowing,c as __namedExportsOrder,r as default};