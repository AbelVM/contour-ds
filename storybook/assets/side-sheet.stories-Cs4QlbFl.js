import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Overlays/SideSheet`,tags:[`autodocs`],parameters:{a11y:{test:`error`},contour:{maturity:`complete-widget`}},argTypes:{side:{control:`select`,options:[`start`,`end`]},size:{control:`select`,options:[`sm`,`md`,`lg`]},mode:{control:`select`,options:[`push`,`overlay`]}}},r=(e={})=>{let t=document.createElement(`contour-side-sheet`);e.side&&t.setAttribute(`side`,e.side),e.size&&t.setAttribute(`size`,e.size),e.mode&&t.setAttribute(`mode`,e.mode);let n=document.createElement(`p`);return n.textContent=`Side sheet content`,t.appendChild(n),t},i={args:{side:`end`,size:`md`,mode:`overlay`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-side-sheet`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-side-sheet/)}},a={args:{side:`start`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-side-sheet`);await t(n).toBeTruthy(),n.setAttribute(`side`,`end`),await t(n).toHaveAttribute(`side`,`end`)}},o=[`Default`,`Reactivity`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    side: "end",
    size: "md",
    mode: "overlay"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const s = canvasElement.querySelector("contour-side-sheet");
    await expect(s).toBeTruthy();
    await expect(s).toHaveClass(/c-side-sheet/);
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    side: "start"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const s = canvasElement.querySelector("contour-side-sheet");
    await expect(s).toBeTruthy();
    s.setAttribute("side", "end");
    await expect(s).toHaveAttribute("side", "end");
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{i as Default,a as Reactivity,o as __namedExportsOrder,n as default};