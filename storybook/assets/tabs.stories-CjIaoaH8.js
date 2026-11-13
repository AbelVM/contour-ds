import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{r as t,t as n}from"./metadata-D6equHaI.js";var r,i,a,o,s,c,l,u,d,f,p,m,h;function g(){return(g=e((()=>{t(),{expect:r,userEvent:i,within:a}=__STORYBOOK_MODULE_TEST__,o={title:`Contour/Navigation/Tabs`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{...n(`c-tabs`),tabs:{control:`text`},orientation:{control:`text`}}},s=JSON.stringify([`Overview`,`Details`,`Settings`]),c=(e={})=>{let t=document.createElement(`contour-tabs`);return t.setAttribute(`tabs`,e.tabs||s),e.orientation&&t.setAttribute(`orientation`,e.orientation),t},l={render:c,play:async({canvasElement:e})=>{let t=e.querySelector(`contour-tabs`);await r(t).toBeTruthy(),await r(t).toHaveClass(/c-tabs/);let n=t.querySelectorAll(`[role='tab']`);await r(n.length).toBe(3)}},u={render:c,play:async({canvasElement:e})=>{let t=e.querySelector(`contour-tabs`),n=Array.from(t.querySelectorAll(`[role='tab']`));n[0].focus(),await i.keyboard(`{ArrowRight}`),await r(document.activeElement).toBe(n[1])}},d={render:c,play:async({canvasElement:e})=>{let t=e.querySelector(`contour-tabs`),n=null;t.addEventListener(`contour:tab-change`,e=>{n=e.detail});let a=Array.from(t.querySelectorAll(`[role='tab']`));a[0].focus(),await i.keyboard(`{ArrowRight}`),await r(n.index).toBe(1),await r(n.label).toBe(a[1].getAttribute(`aria-controls`)),await r(a[1]).toHaveAttribute(`aria-selected`,`true`)}},f={render:c,play:async({canvasElement:e})=>{let t=e.querySelector(`contour-tabs`),n=Array.from(t.querySelectorAll(`[role='tab']`));n[0].focus(),await i.keyboard(`{ArrowRight}{End}`),await r(n[2]).toHaveFocus(),await i.keyboard(`{ArrowLeft}{Home}`),await r(n[0]).toHaveFocus()}},p={render:()=>{let e=c();return e.setAttribute(`orientation`,`vertical`),e},play:async({canvasElement:e})=>{let t=e.querySelector(`contour-tabs`),n=Array.from(t.querySelectorAll(`[role='tab']`));n[0].focus(),await i.keyboard(`{ArrowDown}{End}`),await r(n[2]).toHaveFocus(),await i.keyboard(`{ArrowUp}{Home}`),await r(n[0]).toHaveFocus()}},m={render:c,play:async({canvasElement:e})=>{let t=e.querySelector(`contour-tabs`).querySelectorAll(`[role='tab']`).length;await r(t).toBe(3)}},h=[`Default`,`KeyboardRoving`,`TabChangeEvent`,`HorizontalKeyboardMatrix`,`VerticalKeyboardMatrix`,`Reactivity`],l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render,
  play: async ({
    canvasElement
  }) => {
    const tabs = canvasElement.querySelector("contour-tabs");
    await expect(tabs).toBeTruthy();
    await expect(tabs).toHaveClass(/c-tabs/);
    const tabButtons = tabs.querySelectorAll("[role='tab']");
    await expect(tabButtons.length).toBe(3);
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render,
  play: async ({
    canvasElement
  }) => {
    const tabs = canvasElement.querySelector("contour-tabs");
    const tabButtons = Array.from(tabs.querySelectorAll("[role='tab']"));
    tabButtons[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(document.activeElement).toBe(tabButtons[1]);
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render,
  play: async ({
    canvasElement
  }) => {
    const tabs = canvasElement.querySelector("contour-tabs");
    let detail = null;
    tabs.addEventListener("contour:tab-change", e => {
      detail = e.detail;
    });
    const tabButtons = Array.from(tabs.querySelectorAll("[role='tab']"));
    tabButtons[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(detail.index).toBe(1);
    await expect(detail.label).toBe(tabButtons[1].getAttribute("aria-controls"));
    await expect(tabButtons[1]).toHaveAttribute("aria-selected", "true");
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render,
  play: async ({
    canvasElement
  }) => {
    const tabs = canvasElement.querySelector("contour-tabs");
    const tabButtons = Array.from(tabs.querySelectorAll("[role='tab']"));
    tabButtons[0].focus();
    await userEvent.keyboard("{ArrowRight}{End}");
    await expect(tabButtons[2]).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}{Home}");
    await expect(tabButtons[0]).toHaveFocus();
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => {
    const tabs = render();
    tabs.setAttribute("orientation", "vertical");
    return tabs;
  },
  play: async ({
    canvasElement
  }) => {
    const tabs = canvasElement.querySelector("contour-tabs");
    const tabButtons = Array.from(tabs.querySelectorAll("[role='tab']"));
    tabButtons[0].focus();
    await userEvent.keyboard("{ArrowDown}{End}");
    await expect(tabButtons[2]).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}{Home}");
    await expect(tabButtons[0]).toHaveFocus();
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render,
  play: async ({
    canvasElement
  }) => {
    const tabs = canvasElement.querySelector("contour-tabs");
    const before = tabs.querySelectorAll("[role='tab']").length;
    await expect(before).toBe(3);
  }
}`,...m.parameters?.docs?.source}}}})))()}g();export{l as Default,f as HorizontalKeyboardMatrix,u as KeyboardRoving,m as Reactivity,d as TabChangeEvent,p as VerticalKeyboardMatrix,h as __namedExportsOrder,o as default};