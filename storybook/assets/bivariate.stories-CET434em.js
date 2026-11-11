import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s;function c(){return(c=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n=JSON.stringify([`#e8f1ed`,`#b8d8ca`,`#78b6a0`,`#d8dfe8`,`#9eb4c6`,`#5e8ca3`,`#d9b8a8`,`#ba8472`,`#8e5148`]),r=(e,t={})=>{let r=document.createElement(e);return r.setAttribute(`size`,t.size||`3`),r.setAttribute(`axis-x`,t[`axis-x`]||`Access`),r.setAttribute(`axis-y`,t[`axis-y`]||`Exposure`),r.setAttribute(`colors`,t.colors||n),r.setAttribute(`selected`,t.selected||`1,1`),r},i={title:`Contour/Data/Bivariate`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{size:{control:`text`},"axis-x":{control:`text`},"axis-y":{control:`text`},colors:{control:`text`},selected:{control:`text`}}},a={args:{size:`3`,"axis-x":`Access`,"axis-y":`Exposure`,colors:n,selected:`1,1`},render:e=>r(`contour-bivariate`,e),play:async({canvasElement:e})=>{let n=e.querySelector(`contour-bivariate`);await t(n).toHaveClass(/c-bivariate/);let r=n.querySelectorAll(`.c-bivariate__cell`);await t(r.length).toBe(9),r[0].click(),await t(r[0]).toHaveAttribute(`data-selected`,``)}},o={args:{size:`3`,"axis-x":`Access`,"axis-y":`Exposure`,colors:n,selected:`1,1`},render:e=>r(`contour-bivariate-legend`,e),play:async({canvasElement:e})=>{let n=e.querySelector(`contour-bivariate-legend`);await t(n).toHaveAttribute(`aria-label`,`Bivariate legend`),await t(n.querySelectorAll(`.c-bivariate-legend__cell`).length).toBe(9)}},s=[`Matrix`,`Legend`],a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    size: "3",
    "axis-x": "Access",
    "axis-y": "Exposure",
    colors: COLORS,
    selected: "1,1"
  },
  render: args => renderBivariate("contour-bivariate", args),
  play: async ({
    canvasElement
  }) => {
    const matrix = canvasElement.querySelector("contour-bivariate");
    await expect(matrix).toHaveClass(/c-bivariate/);
    const cells = matrix.querySelectorAll(".c-bivariate__cell");
    await expect(cells.length).toBe(9);
    cells[0].click();
    await expect(cells[0]).toHaveAttribute("data-selected", "");
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    size: "3",
    "axis-x": "Access",
    "axis-y": "Exposure",
    colors: COLORS,
    selected: "1,1"
  },
  render: args => renderBivariate("contour-bivariate-legend", args),
  play: async ({
    canvasElement
  }) => {
    const legend = canvasElement.querySelector("contour-bivariate-legend");
    await expect(legend).toHaveAttribute("aria-label", "Bivariate legend");
    await expect(legend.querySelectorAll(".c-bivariate-legend__cell").length).toBe(9);
  }
}`,...o.parameters?.docs?.source}}}})))()}c();export{o as Legend,a as Matrix,s as __namedExportsOrder,i as default};