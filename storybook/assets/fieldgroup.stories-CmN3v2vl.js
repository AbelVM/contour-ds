import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Forms/FieldGroup`,tags:[`autodocs`],parameters:{contour:{maturity:`complete-widget`}},argTypes:{label:{control:`text`},hint:{control:`text`}}},r=(e={})=>{let t=document.createElement(`contour-field-group`);return e.label?t.setAttribute(`label`,e.label):t.setAttribute(`label`,`Coordinates`),e.hint?t.setAttribute(`hint`,e.hint):t.setAttribute(`hint`,`Decimal degrees`),t},i={args:{label:`Coordinates`,hint:`Decimal degrees`},render:r,play:async({canvasElement:e})=>{let n=e.querySelector(`contour-field-group`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-field-group/)}},a={args:{label:`Coordinates`,hint:`Decimal degrees`},render:(e={})=>{let t=document.createElement(`contour-field-group`);t.setAttribute(`label`,e.label||`Coordinates`),t.setAttribute(`hint`,e.hint||`Decimal degrees`);let n=document.createElement(`input`);n.className=`c-input`,n.setAttribute(`placeholder`,`Lat`);let r=document.createElement(`input`);return r.className=`c-input`,r.setAttribute(`placeholder`,`Lon`),t.appendChild(n),t.appendChild(r),t},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-field-group`);await t(n).toBeTruthy(),await t(n.querySelectorAll(`input`).length).toBe(2)}},o=[`Default`,`WithFields`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Coordinates",
    hint: "Decimal degrees"
  },
  render,
  play: async ({
    canvasElement
  }) => {
    const g = canvasElement.querySelector("contour-field-group");
    await expect(g).toBeTruthy();
    await expect(g).toHaveClass(/c-field-group/);
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Coordinates",
    hint: "Decimal degrees"
  },
  render: (args = {}) => {
    const g = document.createElement("contour-field-group");
    g.setAttribute("label", args.label || "Coordinates");
    g.setAttribute("hint", args.hint || "Decimal degrees");
    const lat = document.createElement("input");
    lat.className = "c-input";
    lat.setAttribute("placeholder", "Lat");
    const lon = document.createElement("input");
    lon.className = "c-input";
    lon.setAttribute("placeholder", "Lon");
    g.appendChild(lat);
    g.appendChild(lon);
    return g;
  },
  play: async ({
    canvasElement
  }) => {
    const g = canvasElement.querySelector("contour-field-group");
    await expect(g).toBeTruthy();
    await expect(g.querySelectorAll("input").length).toBe(2);
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{i as Default,a as WithFields,o as __namedExportsOrder,n as default};