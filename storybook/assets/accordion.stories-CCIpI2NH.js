import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a;function o(){return(o=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Feedback/Accordion`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{items:{control:`text`},exclusive:{control:`boolean`}}},r={render:(e={})=>{let t=document.createElement(`contour-accordion`);e.items&&t.setAttribute(`items`,e.items),e.exclusive&&t.setAttribute(`exclusive`,``);let n=document.createElement(`details`),r=document.createElement(`summary`);r.textContent=`Section 1`;let i=document.createElement(`p`);i.textContent=`Content here`,n.appendChild(r),n.appendChild(i),t.appendChild(n);let a=document.createElement(`details`),o=document.createElement(`summary`);o.textContent=`Section 2`;let s=document.createElement(`p`);return s.textContent=`More content`,a.appendChild(o),a.appendChild(s),t.appendChild(a),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-accordion`);await t(n).toBeTruthy(),await t(e.textContent).toContain(`Section 1`),await t(e.textContent).toContain(`Section 2`),await t(e.textContent).toContain(`Section 2`)}},i={render:(e={})=>{let t=document.createElement(`contour-accordion`);t.setAttribute(`single`,``),e.items&&t.setAttribute(`items`,e.items);let n=document.createElement(`details`),r=document.createElement(`summary`);r.textContent=`Section 1`;let i=document.createElement(`p`);return i.textContent=`Content here`,n.appendChild(r),n.appendChild(i),t.appendChild(n),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-accordion`);await t(n).toBeTruthy(),await t(n.hasAttribute(`single`)).toBe(!0)}},a=[`Default`,`SingleOpen`],r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const a = document.createElement("contour-accordion");
    if (args.items) a.setAttribute("items", args.items);
    if (args.exclusive) a.setAttribute("exclusive", "");
    const item = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Section 1";
    const p = document.createElement("p");
    p.textContent = "Content here";
    item.appendChild(summary);
    item.appendChild(p);
    a.appendChild(item);
    const item2 = document.createElement("details");
    const summary2 = document.createElement("summary");
    summary2.textContent = "Section 2";
    const p2 = document.createElement("p");
    p2.textContent = "More content";
    item2.appendChild(summary2);
    item2.appendChild(p2);
    a.appendChild(item2);
    return a;
  },
  play: async ({
    canvasElement
  }) => {
    const a = canvasElement.querySelector("contour-accordion");
    await expect(a).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Section 1");
    await expect(canvasElement.textContent).toContain("Section 2");
    await expect(canvasElement.textContent).toContain("Section 2");
  }
}`,...r.parameters?.docs?.source}}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const a = document.createElement("contour-accordion");
    a.setAttribute("single", "");
    if (args.items) a.setAttribute("items", args.items);
    const item = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Section 1";
    const p = document.createElement("p");
    p.textContent = "Content here";
    item.appendChild(summary);
    item.appendChild(p);
    a.appendChild(item);
    return a;
  },
  play: async ({
    canvasElement
  }) => {
    const a = canvasElement.querySelector("contour-accordion");
    await expect(a).toBeTruthy();
    await expect(a.hasAttribute("single")).toBe(true);
  }
}`,...i.parameters?.docs?.source}}}})))()}o();export{r as Default,i as SingleOpen,a as __namedExportsOrder,n as default};