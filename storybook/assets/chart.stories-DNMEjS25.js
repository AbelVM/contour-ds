import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{r as t,t as n}from"./metadata-hRL6GB-Y.js";var r,i,a,o,s,c,l,u,d,f,p;function m(){return(m=e((()=>{t(),{expect:r}=__STORYBOOK_MODULE_TEST__,i={title:`Contour/Data/Chart`,tags:[`autodocs`],argTypes:{...n(`c-chart`),series:{control:`text`},axis:{control:`text`}},parameters:{contour:{maturity:`complete-widget`}}},a=JSON.stringify({labels:[`A`,`B`,`C`],values:[3,7,5]}),o=JSON.stringify([{label:`Sales`,type:`donut`,values:[3,7,5]}]),s={render:(e={})=>{let t=document.createElement(`contour-chart`);return t.setAttribute(`type`,e.type||`bar`),t.setAttribute(`axis`,e.axis||`Sales by category`),t.setAttribute(`data`,e.data||a),t},play:async({canvasElement:e})=>{let t=e.querySelector(`contour-chart`);await r(t).toBeTruthy(),await r(t).toHaveClass(/c-chart/),await r(t).toHaveAttribute(`aria-label`,`Sales by category`)}},c={render:(e={})=>{let t=document.createElement(`contour-chart`);return t.setAttribute(`type`,`bar`),t.setAttribute(`axis`,`Sales by category`),t.setAttribute(`loading`,e.loading||`Loading chart…`),t},play:async({canvasElement:e})=>{let t=e.querySelector(`contour-chart`);await r(t).toBeTruthy(),await r(t).toHaveClass(/c-chart/),await r(t.textContent).toContain(`Loading`)}},l={render:(e={})=>{let t=document.createElement(`contour-chart`);return t.setAttribute(`type`,`bar`),t.setAttribute(`axis`,`Sales by category`),t.setAttribute(`empty`,e.empty||`No data`),t},play:async({canvasElement:e})=>{let t=e.querySelector(`contour-chart`);await r(t).toBeTruthy()}},u={render:(e={})=>{let t=document.createElement(`contour-chart`);return t.setAttribute(`type`,`bar`),t.setAttribute(`axis`,`Sales by category`),t.setAttribute(`series`,e.series||o),t.setAttribute(`data-table`,e[`data-table`]||`true`),t},play:async({canvasElement:e})=>{let t=e.querySelector(`contour-chart`);await new Promise(e=>setTimeout(e,150)),await r(t.querySelector(`.c-chart__data-table`)).toBeTruthy(),await r(t.textContent).toContain(`Sales`),await r(t.textContent).toContain(`3`)}},d={parameters:{},render:(e={})=>{let t=document.createElement(`contour-legend`);return t.setAttribute(`title`,`Routes`),t.setAttribute(`selectable`,``),t.setAttribute(`items`,JSON.stringify([{key:`walking`,label:`Walking`,color:`var(--chart-1)`},{key:`cycling`,label:`Cycling`,color:`var(--chart-2)`}])),t},play:async({canvasElement:e})=>{let t=e.querySelector(`contour-legend`).querySelector(`.c-legend__item`);await r(t).toHaveAttribute(`aria-pressed`,`true`),t.click(),await r(t).toHaveAttribute(`aria-pressed`,`false`)}},f={render:(e={})=>{let t=document.createElement(`contour-chart`);return t.setAttribute(`type`,e.type||`bar`),t.setAttribute(`axis`,e.axis||`Sales by category`),t.setAttribute(`data`,e.data||a),t},play:async({canvasElement:e})=>{let t=e.querySelector(`contour-chart`);await r(t).toHaveAttribute(`aria-label`,`Sales by category`),t.setAttribute(`axis`,`Updated axis`),await r(t).toBeTruthy()}},p=[`Default`,`Loading`,`Empty`,`DataTable`,`Legend`,`Reactivity`],s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const chart = document.createElement("contour-chart");
    chart.setAttribute("type", args.type || "bar");
    chart.setAttribute("axis", args.axis || "Sales by category");
    chart.setAttribute("data", args.data || DATA);
    return chart;
  },
  play: async ({
    canvasElement
  }) => {
    const chart = canvasElement.querySelector("contour-chart");
    await expect(chart).toBeTruthy();
    await expect(chart).toHaveClass(/c-chart/);
    await expect(chart).toHaveAttribute("aria-label", "Sales by category");
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const chart = document.createElement("contour-chart");
    chart.setAttribute("type", "bar");
    chart.setAttribute("axis", "Sales by category");
    chart.setAttribute("loading", args.loading || "Loading chart…");
    return chart;
  },
  play: async ({
    canvasElement
  }) => {
    const chart = canvasElement.querySelector("contour-chart");
    await expect(chart).toBeTruthy();
    await expect(chart).toHaveClass(/c-chart/);
    await expect(chart.textContent).toContain("Loading");
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const chart = document.createElement("contour-chart");
    chart.setAttribute("type", "bar");
    chart.setAttribute("axis", "Sales by category");
    chart.setAttribute("empty", args.empty || "No data");
    return chart;
  },
  play: async ({
    canvasElement
  }) => {
    const chart = canvasElement.querySelector("contour-chart");
    await expect(chart).toBeTruthy();
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const chart = document.createElement("contour-chart");
    chart.setAttribute("type", "bar");
    chart.setAttribute("axis", "Sales by category");
    chart.setAttribute("series", args.series || SERIES);
    chart.setAttribute("data-table", args["data-table"] || "true");
    return chart;
  },
  play: async ({
    canvasElement
  }) => {
    const chart = canvasElement.querySelector("contour-chart");
    await new Promise(resolve => setTimeout(resolve, 150));
    await expect(chart.querySelector(".c-chart__data-table")).toBeTruthy();
    await expect(chart.textContent).toContain("Sales");
    await expect(chart.textContent).toContain("3");
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  parameters: {},
  render: (args = {}) => {
    const legend = document.createElement("contour-legend");
    legend.setAttribute("title", "Routes");
    legend.setAttribute("selectable", "");
    legend.setAttribute("items", JSON.stringify([{
      key: "walking",
      label: "Walking",
      color: "var(--chart-1)"
    }, {
      key: "cycling",
      label: "Cycling",
      color: "var(--chart-2)"
    }]));
    return legend;
  },
  play: async ({
    canvasElement
  }) => {
    const legend = canvasElement.querySelector("contour-legend");
    const item = legend.querySelector(".c-legend__item");
    await expect(item).toHaveAttribute("aria-pressed", "true");
    item.click();
    await expect(item).toHaveAttribute("aria-pressed", "false");
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: (args = {}) => {
    const chart = document.createElement("contour-chart");
    chart.setAttribute("type", args.type || "bar");
    chart.setAttribute("axis", args.axis || "Sales by category");
    chart.setAttribute("data", args.data || DATA);
    return chart;
  },
  play: async ({
    canvasElement
  }) => {
    const chart = canvasElement.querySelector("contour-chart");
    await expect(chart).toHaveAttribute("aria-label", "Sales by category");
    chart.setAttribute("axis", "Updated axis");
    await expect(chart).toBeTruthy();
  }
}`,...f.parameters?.docs?.source}}}})))()}m();export{u as DataTable,s as Default,l as Empty,d as Legend,c as Loading,f as Reactivity,p as __namedExportsOrder,i as default};