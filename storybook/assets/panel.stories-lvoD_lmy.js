import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s,c;function l(){return(l=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Content/Panel`,tags:[`autodocs`],parameters:{a11y:{test:`error`},contour:{maturity:`complete-widget`}},argTypes:{title:{control:`text`},subtitle:{control:`text`},status:{control:`text`},flush:{control:`boolean`},collapsible:{control:`boolean`}}},r=(e={})=>{let t=document.createElement(`contour-panel`);e.title&&t.setAttribute(`title`,e.title),e.subtitle&&t.setAttribute(`subtitle`,e.subtitle),e.status&&t.setAttribute(`status`,e.status),e.flush&&t.setAttribute(`flush`,``),e.collapsible&&t.setAttribute(`collapsible`,``);let n=document.createElement(`p`);return n.textContent=`Panel content goes here.`,t.appendChild(n),t},i={args:{title:`Overview`,subtitle:`Key metrics`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-panel`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-panel/),await t(e.textContent).toContain(`Overview`)}},a={args:{title:`Live data`,status:`live`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-panel`);await t(n).toBeTruthy();let r=n.querySelector(`.c-panel__status--live`);await t(r).toBeTruthy()}},o={args:{title:`Edge-to-edge`,flush:!0},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-panel`);await t(n).toBeTruthy();let r=n.querySelector(`.c-panel__body--flush`);await t(r).toBeTruthy()}},s={args:{title:`Collapsible panel`,collapsible:!0},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-panel`);await t(n).toBeTruthy();let r=n.querySelector(`.c-panel__collapse`);await t(r).toBeTruthy()}},c=[`Default`,`WithStatus`,`Flush`,`Collapsible`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Overview",
    subtitle: "Key metrics"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const p = canvasElement.querySelector("contour-panel");
    await expect(p).toBeTruthy();
    await expect(p).toHaveClass(/c-panel/);
    await expect(canvasElement.textContent).toContain("Overview");
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Live data",
    status: "live"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const p = canvasElement.querySelector("contour-panel");
    await expect(p).toBeTruthy();
    const status = p.querySelector(".c-panel__status--live");
    await expect(status).toBeTruthy();
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Edge-to-edge",
    flush: true
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const p = canvasElement.querySelector("contour-panel");
    await expect(p).toBeTruthy();
    const body = p.querySelector(".c-panel__body--flush");
    await expect(body).toBeTruthy();
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Collapsible panel",
    collapsible: true
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const p = canvasElement.querySelector("contour-panel");
    await expect(p).toBeTruthy();
    const btn = p.querySelector(".c-panel__collapse");
    await expect(btn).toBeTruthy();
  }
}`,...s.parameters?.docs?.source}}}})))()}l();export{s as Collapsible,i as Default,o as Flush,a as WithStatus,c as __namedExportsOrder,n as default};