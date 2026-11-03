import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s,c,l;function u(){return(u=e((()=>{({expect:t,userEvent:n}=__STORYBOOK_MODULE_TEST__),r={title:`Contour/Navigation/Command`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{placeholder:{control:`text`},items:{control:`text`},recent:{control:`text`},empty:{control:`text`}}},i=JSON.stringify([{group:`Actions`,title:`Create new`,shortcut:`⌘N`},{group:`Actions`,title:`Open settings`,shortcut:`⌘,`},{title:`Search docs`}]),a=(e={})=>{let t=document.createElement(`contour-command`);return t.setAttribute(`items`,e.items||i),e.placeholder&&t.setAttribute(`placeholder`,e.placeholder),e.recent&&t.setAttribute(`recent`,e.recent),e.empty&&t.setAttribute(`empty`,e.empty),e.open!==!1&&t.setAttribute(`open`,``),t},o={args:{items:i,open:!0},render:a,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-command`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-command/);let r=n.querySelectorAll(`.c-command__item`);await t(r.length).toBeGreaterThan(0)}},s={args:{items:`[]`,empty:`No matches`,open:!0},render:a,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-command`);await t(n).toBeTruthy()}},c={args:{items:i,open:!0},render:a,play:async({canvasElement:e})=>{let r=e.querySelector(`contour-command`),i=r.querySelector(`.c-command__input`);await t(i).toBeTruthy(),await t(i).toHaveAttribute(`aria-autocomplete`,`list`),await n.click(i),i.dispatchEvent(new KeyboardEvent(`keydown`,{key:`ArrowDown`,bubbles:!0})),i.dispatchEvent(new KeyboardEvent(`keydown`,{key:`End`,bubbles:!0}));let a=r.querySelectorAll(`.c-command__item`);await t(i).toHaveAttribute(`aria-activedescendant`,a[a.length-1].id);let o=new Promise(e=>r.addEventListener(`contour:select`,t=>e(t.detail),{once:!0}));i.dispatchEvent(new KeyboardEvent(`keydown`,{key:`Enter`,bubbles:!0})),await t(await o).toEqual({index:2,label:`Search docs`})}},l=[`Default`,`EmptyResult`,`KeyboardNavigation`],o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    items: ITEMS,
    open: true
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const cmd = canvasElement.querySelector("contour-command");
    await expect(cmd).toBeTruthy();
    await expect(cmd).toHaveClass(/c-command/);
    const items = cmd.querySelectorAll(".c-command__item");
    await expect(items.length).toBeGreaterThan(0);
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    items: "[]",
    empty: "No matches",
    open: true
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const cmd = canvasElement.querySelector("contour-command");
    await expect(cmd).toBeTruthy();
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    items: ITEMS,
    open: true
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const cmd = canvasElement.querySelector("contour-command");
    const input = cmd.querySelector(".c-command__input");
    await expect(input).toBeTruthy();
    await expect(input).toHaveAttribute("aria-autocomplete", "list");
    await userEvent.click(input);
    input.dispatchEvent(new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true
    }));
    input.dispatchEvent(new KeyboardEvent("keydown", {
      key: "End",
      bubbles: true
    }));
    const items = cmd.querySelectorAll(".c-command__item");
    await expect(input).toHaveAttribute("aria-activedescendant", items[items.length - 1].id);
    const selected = new Promise(resolve => cmd.addEventListener("contour:select", event => resolve(event.detail), {
      once: true
    }));
    input.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true
    }));
    await expect(await selected).toEqual({
      index: 2,
      label: "Search docs"
    });
  }
}`,...c.parameters?.docs?.source}}}})))()}u();export{o as Default,s as EmptyResult,c as KeyboardNavigation,l as __namedExportsOrder,r as default};