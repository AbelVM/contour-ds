import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s;function c(){return(c=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Content/Recipe`,tags:[`autodocs`],parameters:{a11y:{test:`error`},contour:{maturity:`complete-widget`}},argTypes:{title:{control:`text`},body:{control:`text`},url:{control:`text`},head:{control:`text`},index:{control:`text`},tags:{control:`text`}}},r=(e={})=>{let t=document.createElement(`contour-recipe`);return e.title&&t.setAttribute(`title`,e.title),e.body&&t.setAttribute(`body`,e.body),e.url&&t.setAttribute(`url`,e.url),e.head&&t.setAttribute(`head`,e.head),e.index&&t.setAttribute(`index`,e.index),e.tags&&t.setAttribute(`tags`,e.tags),t},i={args:{title:`Margherita`,body:`Tomato, mozzarella, basil.`,head:`Pizza`,index:`01`,tags:`italian,vegetarian`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-recipe`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-recipe/),await t(e.textContent).toContain(`Margherita`)}},a={args:{title:`Documentation recipe`,url:`https://example.com/contour`,head:`Docs`,index:`02`,tags:`guide,reference`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-recipe`);await t(n).toBeTruthy();let r=n.querySelector(`.c-recipe__frame`);await t(r).toBeTruthy();let i=n.querySelector(`.c-recipe__frame-url`);await t(i.textContent).toBe(`https://example.com/contour`)}},o={args:{title:`Original`,head:`Category`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-recipe`);await t(n).toBeTruthy(),n.setAttribute(`title`,`Updated`),await t(e.textContent).toContain(`Updated`)}},s=[`Default`,`WithFrame`,`Reactivity`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Margherita",
    body: "Tomato, mozzarella, basil.",
    head: "Pizza",
    index: "01",
    tags: "italian,vegetarian"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const r = canvasElement.querySelector("contour-recipe");
    await expect(r).toBeTruthy();
    await expect(r).toHaveClass(/c-recipe/);
    await expect(canvasElement.textContent).toContain("Margherita");
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Documentation recipe",
    url: "https://example.com/contour",
    head: "Docs",
    index: "02",
    tags: "guide,reference"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const r = canvasElement.querySelector("contour-recipe");
    await expect(r).toBeTruthy();
    const frame = r.querySelector(".c-recipe__frame");
    await expect(frame).toBeTruthy();
    const url = r.querySelector(".c-recipe__frame-url");
    await expect(url.textContent).toBe("https://example.com/contour");
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Original",
    head: "Category"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const r = canvasElement.querySelector("contour-recipe");
    await expect(r).toBeTruthy();
    r.setAttribute("title", "Updated");
    await expect(canvasElement.textContent).toContain("Updated");
  }
}`,...o.parameters?.docs?.source}}}})))()}c();export{i as Default,o as Reactivity,a as WithFrame,s as __namedExportsOrder,n as default};