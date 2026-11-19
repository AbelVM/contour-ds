import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s;function c(){return(c=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Content/Carousel`,tags:[`autodocs`],parameters:{a11y:{test:`error`},contour:{maturity:`complete-widget`}},argTypes:{autoplay:{control:`text`},index:{control:`text`}}},r=(e={})=>{let t=document.createElement(`contour-carousel`);e.autoplay&&t.setAttribute(`autoplay`,e.autoplay),e.index&&t.setAttribute(`index`,e.index);for(let e=1;e<=3;e++){let n=document.createElement(`div`);n.className=`c-carousel__slide`,n.textContent=`Slide ${e}`,t.appendChild(n)}return t},i={args:{},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-carousel`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-carousel/);let r=n.querySelector(`.c-carousel__prev`),i=n.querySelector(`.c-carousel__next`);await t(r).toBeTruthy(),await t(i).toBeTruthy()}},a={args:{autoplay:`3000`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-carousel`);await t(n).toBeTruthy(),await t(n).toHaveAttribute(`autoplay`,`3000`)}},o={args:{index:`0`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-carousel`);await t(n).toBeTruthy(),n.setAttribute(`index`,`1`),await t(n).toHaveAttribute(`index`,`1`)}},s=[`Default`,`Autoplay`,`Reactivity`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {},
  render,
  play: async ({
    canvasElement
  }) => {
    const c = canvasElement.querySelector("contour-carousel");
    await expect(c).toBeTruthy();
    await expect(c).toHaveClass(/c-carousel/);
    const prev = c.querySelector(".c-carousel__prev");
    const next = c.querySelector(".c-carousel__next");
    await expect(prev).toBeTruthy();
    await expect(next).toBeTruthy();
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    autoplay: "3000"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const c = canvasElement.querySelector("contour-carousel");
    await expect(c).toBeTruthy();
    await expect(c).toHaveAttribute("autoplay", "3000");
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    index: "0"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const c = canvasElement.querySelector("contour-carousel");
    await expect(c).toBeTruthy();
    c.setAttribute("index", "1");
    await expect(c).toHaveAttribute("index", "1");
  }
}`,...o.parameters?.docs?.source}}}})))()}c();export{a as Autoplay,i as Default,o as Reactivity,s as __namedExportsOrder,n as default};