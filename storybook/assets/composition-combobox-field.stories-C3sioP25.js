import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a;function o(){return(o=e((()=>{({expect:t,userEvent:n}=__STORYBOOK_MODULE_TEST__),r={title:`Contour/Compositions/ComboboxField`,tags:[`autodocs`],parameters:{contour:{maturity:`composition`}}},i={render:()=>{let e=document.createElement(`div`);return e.className=`c-field`,e.innerHTML=`
      <label class="c-label" for="comp-fruit">Fruit</label>
      <contour-combobox id="comp-fruit" label="Fruit" options='["Apple","Banana","Cherry"]' placeholder="Choose"></contour-combobox>
      <p class="c-field__error" id="comp-fruit-err">Select a fruit</p>
    `,e},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-combobox`);await t(n).toBeTruthy();let r=n.querySelector(`input, .c-combobox__input`);await t(r||n).toBeTruthy();let i=e.querySelector(`#comp-fruit-err`);await t(i.textContent).toContain(`Select a fruit`)}},a=[`ComboboxWithLabelAndError`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "c-field";
    wrap.innerHTML = \`
      <label class="c-label" for="comp-fruit">Fruit</label>
      <contour-combobox id="comp-fruit" label="Fruit" options='["Apple","Banana","Cherry"]' placeholder="Choose"></contour-combobox>
      <p class="c-field__error" id="comp-fruit-err">Select a fruit</p>
    \`;
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const combo = canvasElement.querySelector("contour-combobox");
    await expect(combo).toBeTruthy();
    const input = combo.querySelector("input, .c-combobox__input");
    await expect(input || combo).toBeTruthy();
    const err = canvasElement.querySelector("#comp-fruit-err");
    await expect(err.textContent).toContain("Select a fruit");
  }
}`,...i.parameters?.docs?.source}}}})))()}o();export{i as ComboboxWithLabelAndError,a as __namedExportsOrder,r as default};