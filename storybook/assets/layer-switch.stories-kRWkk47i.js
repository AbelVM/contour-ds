import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Map/LayerSwitch`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{items:{control:`text`}}},r=(e={})=>{let t=document.createElement(`contour-layer-switch`);return t.setAttribute(`items`,e.items||JSON.stringify([{name:`Base map`,color:`#61758a`,count:1},{name:`Buildings`,color:`#d97757`,count:1240},{name:`Routes`,color:`#2f8f83`,count:86}])),t},i={args:{items:JSON.stringify([{name:`Base map`,color:`#61758a`,count:1},{name:`Buildings`,color:`#d97757`,count:1240},{name:`Routes`,color:`#2f8f83`,count:86}])},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-layer-switch`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-layer-switch/);let r=n.querySelector(`.c-layer-switch__toggle`);await t(r).toHaveAttribute(`aria-pressed`,`true`),r.click(),await t(r).toHaveAttribute(`aria-pressed`,`false`)}},a={args:{items:JSON.stringify([{name:`Base map`,color:`#61758a`,count:1,visible:!0},{name:`Buildings`,color:`#d97757`,count:1240,visible:!0}])},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-layer-switch`);await t(n).toBeTruthy();let r=n.querySelectorAll(`.c-layer-switch__toggle`);await t(r.length).toBe(2)}},o=[`Default`,`AllVisible`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    items: JSON.stringify([{
      name: "Base map",
      color: "#61758a",
      count: 1
    }, {
      name: "Buildings",
      color: "#d97757",
      count: 1240
    }, {
      name: "Routes",
      color: "#2f8f83",
      count: 86
    }])
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const l = canvasElement.querySelector("contour-layer-switch");
    await expect(l).toBeTruthy();
    await expect(l).toHaveClass(/c-layer-switch/);
    const toggle = l.querySelector(".c-layer-switch__toggle");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    items: JSON.stringify([{
      name: "Base map",
      color: "#61758a",
      count: 1,
      visible: true
    }, {
      name: "Buildings",
      color: "#d97757",
      count: 1240,
      visible: true
    }])
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const l = canvasElement.querySelector("contour-layer-switch");
    await expect(l).toBeTruthy();
    const toggles = l.querySelectorAll(".c-layer-switch__toggle");
    await expect(toggles.length).toBe(2);
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{a as AllVisible,i as Default,o as __namedExportsOrder,n as default};