import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s;function c(){return(c=e((()=>{({expect:t,userEvent:n}=__STORYBOOK_MODULE_TEST__),r={title:`Contour/Navigation/Pagination`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{current:{control:`number`},"page-size":{control:`number`}}},i={render:(e={})=>{let t=document.createElement(`contour-pagination`);return e.page?t.setAttribute(`page`,String(e.page)):t.setAttribute(`page`,`2`),e[`page-size`]?t.setAttribute(`page-size`,String(e[`page-size`])):t.setAttribute(`page-size`,`10`),e.total?t.setAttribute(`total`,String(e.total)):t.setAttribute(`total`,`50`),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-pagination`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-pagination/)}},a={render:(e={})=>{let t=document.createElement(`contour-pagination`);return e.pages?t.setAttribute(`pages`,String(e.pages)):t.setAttribute(`pages`,`3`),e.current?t.setAttribute(`current`,String(e.current)):t.setAttribute(`current`,`1`),t},play:async({canvasElement:e})=>{let r=e.querySelector(`contour-pagination`),i=r.querySelector(`[data-action='next']`);await n.click(i),await t(r).toHaveAttribute(`page`,`2`),await t(r.querySelector(`[aria-current='page']`)).toHaveTextContent(`2`)}},o={render:a.render,play:async({canvasElement:e})=>{let r=e.querySelector(`contour-pagination`),i=r.querySelector(`[data-action='prev']`),a=r.querySelector(`[data-action='next']`);await n.click(i),await t(r).toHaveAttribute(`page`,`1`),await n.click(a),await n.click(a),await n.click(a),await t(r).toHaveAttribute(`page`,`3`),await t(r.querySelector(`[aria-current='page']`)).toHaveTextContent(`3`)}},s=[`Default`,`NextPage`,`DisabledEdges`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const p = document.createElement("contour-pagination");
    if (args.page) p.setAttribute("page", String(args.page));else p.setAttribute("page", "2");
    if (args["page-size"]) p.setAttribute("page-size", String(args["page-size"]));else p.setAttribute("page-size", "10");
    if (args.total) p.setAttribute("total", String(args.total));else p.setAttribute("total", "50");
    return p;
  },
  play: async ({
    canvasElement
  }) => {
    const p = canvasElement.querySelector("contour-pagination");
    await expect(p).toBeTruthy();
    await expect(p).toHaveClass(/c-pagination/);
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const pagination = document.createElement("contour-pagination");
    if (args.pages) pagination.setAttribute("pages", String(args.pages));else pagination.setAttribute("pages", "3");
    if (args.current) pagination.setAttribute("current", String(args.current));else pagination.setAttribute("current", "1");
    return pagination;
  },
  play: async ({
    canvasElement
  }) => {
    const pagination = canvasElement.querySelector("contour-pagination");
    const next = pagination.querySelector("[data-action='next']");
    await userEvent.click(next);
    await expect(pagination).toHaveAttribute("page", "2");
    await expect(pagination.querySelector("[aria-current='page']")).toHaveTextContent("2");
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: NextPage.render,
  play: async ({
    canvasElement
  }) => {
    const pagination = canvasElement.querySelector("contour-pagination");
    const previous = pagination.querySelector("[data-action='prev']");
    const next = pagination.querySelector("[data-action='next']");
    await userEvent.click(previous);
    await expect(pagination).toHaveAttribute("page", "1");
    await userEvent.click(next);
    await userEvent.click(next);
    await userEvent.click(next);
    await expect(pagination).toHaveAttribute("page", "3");
    await expect(pagination.querySelector("[aria-current='page']")).toHaveTextContent("3");
  }
}`,...o.parameters?.docs?.source}}}})))()}c();export{i as Default,o as DisabledEdges,a as NextPage,s as __namedExportsOrder,r as default};