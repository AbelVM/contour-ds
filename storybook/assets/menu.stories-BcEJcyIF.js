import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{n as t,r as n}from"./fixtures-BBc-B3PQ.js";var r,i,a,o,s,c;function l(){return(l=e((()=>{n(),{expect:r,userEvent:i}=__STORYBOOK_MODULE_TEST__,a={title:`Contour/Navigation/Menu`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{items:{control:`text`}}},o={args:{},render:(e={})=>{let t=document.createElement(`contour-menu`);return t.setAttribute(`items`,JSON.stringify([`New`,`Open`,`Save`])),t},play:async({canvasElement:e})=>{let t=e.querySelector(`contour-menu`);await r(t).toBeTruthy(),await r(t.querySelector(`.c-menu`)).toBeTruthy(),await r(e.textContent).toContain(`Save`)}},s={args:t(`contour-menu`),render:({items:e})=>{let t=document.createElement(`contour-menu`);return t.setAttribute(`items`,e),t},play:async({canvasElement:e})=>{let t=e.querySelector(`contour-menu`),n=t.querySelectorAll(`[role='menuitem']`);await r(n).toHaveLength(3),n[0].focus(),await i.keyboard(`{ArrowDown}{End}`),await r(n[2]).toHaveFocus();let a=new Promise(e=>t.addEventListener(`contour:select`,t=>e(t.detail),{once:!0}));await i.keyboard(`{Enter}`),await r(await a).toEqual({index:2,label:`Remove`})}},c=[`Default`,`KeyboardNavigation`],o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {},
  render: (args = {}) => {
    const m = document.createElement("contour-menu");
    m.setAttribute("items", JSON.stringify(["New", "Open", "Save"]));
    return m;
  },
  play: async ({
    canvasElement
  }) => {
    const m = canvasElement.querySelector("contour-menu");
    await expect(m).toBeTruthy();
    await expect(m.querySelector(".c-menu")).toBeTruthy();
    await expect(canvasElement.textContent).toContain("Save");
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: fixtureArgs("contour-menu"),
  render: ({
    items
  }) => {
    const menu = document.createElement("contour-menu");
    menu.setAttribute("items", items);
    return menu;
  },
  play: async ({
    canvasElement
  }) => {
    const menu = canvasElement.querySelector("contour-menu");
    const items = menu.querySelectorAll("[role='menuitem']");
    await expect(items).toHaveLength(3);
    items[0].focus();
    await userEvent.keyboard("{ArrowDown}{End}");
    await expect(items[2]).toHaveFocus();
    const selected = new Promise(resolve => menu.addEventListener("contour:select", event => resolve(event.detail), {
      once: true
    }));
    await userEvent.keyboard("{Enter}");
    await expect(await selected).toEqual({
      index: 2,
      label: "Remove"
    });
  }
}`,...s.parameters?.docs?.source}}}})))()}l();export{o as Default,s as KeyboardNavigation,c as __namedExportsOrder,a as default};