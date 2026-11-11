import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a;function o(){return(o=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Compositions/ChartLegend`,tags:[`autodocs`],parameters:{contour:{maturity:`composition`}}},r={render:()=>{let e=document.createElement(`div`);e.style.display=`grid`,e.style.gap=`1rem`;let t=document.createElement(`contour-chart`);t.setAttribute(`type`,`bar`),t.setAttribute(`axis`,`Weekly volume`),t.setAttribute(`data`,JSON.stringify({labels:[`Mon`,`Tue`,`Wed`],values:[10,20,15]}));let n=document.createElement(`contour-legend`);return n.setAttribute(`items`,JSON.stringify([{label:`Volume`,color:`var(--chart-1)`},{label:`Target`,color:`var(--chart-2)`}])),e.append(t,n),e},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-chart`),r=e.querySelector(`contour-legend`);await t(n).toBeTruthy(),await t(r).toBeTruthy(),await t(r.textContent).toContain(`Volume`),await t(r.textContent).toContain(`Target`)}},i={render:()=>{let e=document.createElement(`div`),t=document.createElement(`contour-legend`);t.setAttribute(`items`,JSON.stringify([{label:`A`,color:`var(--chart-1)`},{label:`B`,color:`var(--chart-2)`}]));let n=document.createElement(`p`);return n.id=`comp-legend-status`,n.textContent=`none`,e.addEventListener(`contour:toggle`,()=>{n.textContent=`toggled`}),e.append(t,n),e},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-legend`),r=n.querySelector(`button, .c-legend__item`);r&&r.click(),await t(n.querySelectorAll(`.c-legend__item, button, [role]`).length).toBeGreaterThan(0)}},a=[`ChartWithLegend`,`LegendToggleEmitsIntent`],r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "1rem";
    const chart = document.createElement("contour-chart");
    chart.setAttribute("type", "bar");
    chart.setAttribute("axis", "Weekly volume");
    chart.setAttribute("data", JSON.stringify({
      labels: ["Mon", "Tue", "Wed"],
      values: [10, 20, 15]
    }));
    const legend = document.createElement("contour-legend");
    legend.setAttribute("items", JSON.stringify([{
      label: "Volume",
      color: "var(--chart-1)"
    }, {
      label: "Target",
      color: "var(--chart-2)"
    }]));
    wrap.append(chart, legend);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const chart = canvasElement.querySelector("contour-chart");
    const legend = canvasElement.querySelector("contour-legend");
    await expect(chart).toBeTruthy();
    await expect(legend).toBeTruthy();
    await expect(legend.textContent).toContain("Volume");
    await expect(legend.textContent).toContain("Target");
  }
}`,...r.parameters?.docs?.source}}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrap = document.createElement("div");
    const legend = document.createElement("contour-legend");
    legend.setAttribute("items", JSON.stringify([{
      label: "A",
      color: "var(--chart-1)"
    }, {
      label: "B",
      color: "var(--chart-2)"
    }]));
    const status = document.createElement("p");
    status.id = "comp-legend-status";
    status.textContent = "none";
    wrap.addEventListener("contour:toggle", () => {
      status.textContent = "toggled";
    });
    wrap.append(legend, status);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const legend = canvasElement.querySelector("contour-legend");
    const btn = legend.querySelector("button, .c-legend__item");
    if (btn) btn.click();
    // Event emission is host-facing intent; presence of interactive legend items is the contract here.
    await expect(legend.querySelectorAll(".c-legend__item, button, [role]").length).toBeGreaterThan(0);
  }
}`,...i.parameters?.docs?.source}}}})))()}o();export{r as ChartWithLegend,i as LegendToggleEmitsIntent,a as __namedExportsOrder,n as default};