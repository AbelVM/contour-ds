import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import"./iframe-DJiQjjwr.js";import{n as t,t as n}from"./contour.components-0UKI_snV.js";import{r,t as i}from"./fixtures-BBc-B3PQ.js";var a,o,s,c;function l(){return(l=e((()=>{t(),r(),{expect:a}=__STORYBOOK_MODULE_TEST__,o={title:`Contour/Catalog/Registered elements`,tags:[`autodocs`],parameters:{contour:{maturity:`composition`},a11y:{test:`todo`},issue:`SB-31`,a11yTodo:{owner:`Contour maintainers`,rootCause:`catalogue includes mixed maturity elements`,mitigation:`review generated elements individually`,review:`2026-12-01`}}},s={render:()=>{let e=document.createElement(`div`);e.style.display=`grid`,e.style.gridTemplateColumns=`repeat(auto-fit, minmax(14rem, 1fr))`,e.style.gap=`1rem`;let t=n.blocks.map(({name:e})=>`contour-`+e.slice(2)).filter(e=>customElements.get(e));for(let n of t){let t=document.createElement(`article`);t.style.display=`grid`,t.style.gap=`0.5rem`,t.style.padding=`1rem`,t.style.border=`1px solid var(--color-border)`;let r=document.createElement(`code`);r.textContent=n;let a=document.createElement(n);a.setAttribute(`aria-label`,n),i(a,n),t.append(r,a),e.appendChild(t)}return e},play:async({canvasElement:e})=>{let t=e.querySelectorAll(`article > :where(:not(code))`);await a(t.length).toBeGreaterThan(0);for(let e of t)await a(customElements.get(e.tagName.toLowerCase())).toBeTruthy()}},c=[`AllRegistered`],s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gridTemplateColumns = "repeat(auto-fit, minmax(14rem, 1fr))";
    root.style.gap = "1rem";
    const tags = inventory.blocks.map(({
      name
    }) => "contour-" + name.slice(2)).filter(tag => customElements.get(tag));
    for (const tag of tags) {
      const card = document.createElement("article");
      card.style.display = "grid";
      card.style.gap = "0.5rem";
      card.style.padding = "1rem";
      card.style.border = "1px solid var(--color-border)";
      const label = document.createElement("code");
      label.textContent = tag;
      const element = document.createElement(tag);
      element.setAttribute("aria-label", tag);
      applyFixture(element, tag);
      card.append(label, element);
      root.appendChild(card);
    }
    return root;
  },
  play: async ({
    canvasElement
  }) => {
    const elements = canvasElement.querySelectorAll("article > :where(:not(code))");
    await expect(elements.length).toBeGreaterThan(0);
    for (const element of elements) {
      await expect(customElements.get(element.tagName.toLowerCase())).toBeTruthy();
    }
  }
}`,...s.parameters?.docs?.source}}}})))()}l();export{s as AllRegistered,c as __namedExportsOrder,o as default};