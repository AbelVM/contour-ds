import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Overlays/Drawer`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{title:{control:`text`},body:{control:`text`},size:{control:`text`}}},r=(e={})=>{let t=document.createElement(`contour-drawer`);e.title?t.setAttribute(`title`,e.title):t.setAttribute(`title`,`Settings`),e.size&&t.setAttribute(`size`,e.size),e.open&&t.setAttribute(`open`,``);let n=document.createElement(`p`);return n.textContent=e.body||`Drawer body`,t.appendChild(n),t},i={args:{title:`Settings`,body:`Drawer body`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-drawer`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-drawer/),await t(e.textContent).toContain(`Settings`)}},a={args:{title:`Settings`,body:`Drawer body`,open:!0},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-drawer`);await t(n).toBeTruthy(),await t(n.classList.contains(`is-open`)).toBe(!0)}},o=[`Default`,`Open`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Settings",
    body: "Drawer body"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const d = canvasElement.querySelector("contour-drawer");
    await expect(d).toBeTruthy();
    await expect(d).toHaveClass(/c-drawer/);
    await expect(canvasElement.textContent).toContain("Settings");
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Settings",
    body: "Drawer body",
    open: true
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const d = canvasElement.querySelector("contour-drawer");
    await expect(d).toBeTruthy();
    await expect(d.classList.contains("is-open")).toBe(true);
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{i as Default,a as Open,o as __namedExportsOrder,n as default};