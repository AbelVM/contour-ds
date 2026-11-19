import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s;function c(){return(c=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Content/LandingHero`,tags:[`autodocs`],parameters:{a11y:{test:`error`},contour:{maturity:`complete-widget`}},argTypes:{title:{control:`text`},text:{control:`text`},preview:{control:`text`},actions:{control:`text`}}},r=(e={})=>{let t=document.createElement(`contour-landing-hero`);return e.title&&t.setAttribute(`title`,e.title),e.text&&t.setAttribute(`text`,e.text),e.preview&&t.setAttribute(`preview`,e.preview),e.actions&&t.setAttribute(`actions`,e.actions),t},i={args:{title:`Build spatial apps`,text:`A design system for location intelligence.`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-landing-hero`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-landing-hero/),await t(e.textContent).toContain(`Build spatial apps`)}},a={args:{title:`Launch`,text:`Ship faster.`,preview:`<div>Product screenshot</div>`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-landing-hero`);await t(n).toBeTruthy();let r=n.querySelector(`.c-landing-hero__preview`);await t(r).toBeTruthy();let i=n.querySelector(`.c-landing-hero__preview-body`);await t(i).toBeTruthy()}},o={args:{title:`Original`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-landing-hero`);await t(n).toBeTruthy(),n.setAttribute(`title`,`Updated`),await t(e.textContent).toContain(`Updated`)}},s=[`Default`,`WithPreview`,`Reactivity`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Build spatial apps",
    text: "A design system for location intelligence."
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const h = canvasElement.querySelector("contour-landing-hero");
    await expect(h).toBeTruthy();
    await expect(h).toHaveClass(/c-landing-hero/);
    await expect(canvasElement.textContent).toContain("Build spatial apps");
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Launch",
    text: "Ship faster.",
    preview: "<div>Product screenshot</div>"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const h = canvasElement.querySelector("contour-landing-hero");
    await expect(h).toBeTruthy();
    const preview = h.querySelector(".c-landing-hero__preview");
    await expect(preview).toBeTruthy();
    const body = h.querySelector(".c-landing-hero__preview-body");
    await expect(body).toBeTruthy();
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Original"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const h = canvasElement.querySelector("contour-landing-hero");
    await expect(h).toBeTruthy();
    h.setAttribute("title", "Updated");
    await expect(canvasElement.textContent).toContain("Updated");
  }
}`,...o.parameters?.docs?.source}}}})))()}c();export{i as Default,o as Reactivity,a as WithPreview,s as __namedExportsOrder,n as default};