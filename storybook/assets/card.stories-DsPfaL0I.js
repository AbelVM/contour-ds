import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s;function c(){return(c=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Content/Card`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{title:{control:`text`},variant:{control:`text`},heading:{control:`text`}}},r=(e={})=>{let t=document.createElement(`contour-card`);e.title?t.setAttribute(`title`,e.title):t.setAttribute(`title`,`Card title`),e.variant&&t.setAttribute(`variant`,e.variant),e.heading&&t.setAttribute(`heading`,e.heading);let n=document.createElement(`p`);return n.textContent=e.body||`Card body content.`,t.appendChild(n),t},i={args:{title:`Card title`,body:`Card body content.`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-card`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-card/),await t(n.querySelector(`.c-card__title`)).toHaveTextContent(`Card title`),await t(e.textContent).toContain(`Card body`)}},a={args:{title:`Raised`,variant:`raised`,body:`Raised surface.`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-card`);await t(n).toBeTruthy(),await t(n.classList.contains(`c-card--raised`)).toBe(!0)}},o={args:{title:`Sunken`,variant:`sunken`,body:`Sunken surface.`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-card`);await t(n).toBeTruthy(),await t(n.classList.contains(`c-card--sunken`)).toBe(!0)}},s=[`Default`,`Raised`,`Sunken`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Card title",
    body: "Card body content."
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const c = canvasElement.querySelector("contour-card");
    await expect(c).toBeTruthy();
    await expect(c).toHaveClass(/c-card/);
    await expect(c.querySelector(".c-card__title")).toHaveTextContent("Card title");
    await expect(canvasElement.textContent).toContain("Card body");
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Raised",
    variant: "raised",
    body: "Raised surface."
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const c = canvasElement.querySelector("contour-card");
    await expect(c).toBeTruthy();
    await expect(c.classList.contains("c-card--raised")).toBe(true);
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Sunken",
    variant: "sunken",
    body: "Sunken surface."
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const c = canvasElement.querySelector("contour-card");
    await expect(c).toBeTruthy();
    await expect(c.classList.contains("c-card--sunken")).toBe(true);
  }
}`,...o.parameters?.docs?.source}}}})))()}c();export{i as Default,a as Raised,o as Sunken,s as __namedExportsOrder,n as default};