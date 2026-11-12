import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a;function o(){return(o=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Compositions/ChartLegend`,tags:[`autodocs`],parameters:{contour:{maturity:`composition`}}},r={render:()=>{let e=document.createElement(`div`);e.style.display=`grid`,e.style.gap=`1rem`;let t=document.createElement(`contour-chart`);t.setAttribute(`axis`,`Weekly volume`),t.setAttribute(`series`,JSON.stringify([{label:`Volume`,type:`bar`,values:[10,20,15]}]));let n=document.createElement(`contour-legend`);return n.setAttribute(`items`,JSON.stringify([{label:`Volume`,color:`var(--chart-1)`},{label:`Target`,color:`var(--chart-2)`}])),e.append(t,n),e},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-chart`),r=e.querySelector(`contour-legend`);await t(n).toBeTruthy(),await t(r).toBeTruthy(),await t(n.querySelector(`.c-chart__empty`)).toBeNull(),await t(n.querySelectorAll(`.c-chart__bar`).length).toBe(3),await t(r.textContent).toContain(`Volume`),await t(r.textContent).toContain(`Target`)}},i={render:()=>{let e=document.createElement(`div`),t=document.createElement(`contour-legend`);t.setAttribute(`selectable`,``),t.setAttribute(`items`,JSON.stringify([{label:`A`,key:`a`,color:`var(--chart-1)`},{label:`B`,key:`b`,color:`var(--chart-2)`}]));let n=document.createElement(`p`);return n.id=`comp-legend-status`,n.textContent=`none`,e.addEventListener(`contour:legend-toggle`,e=>{n.textContent=`${e.detail.key}:${e.detail.pressed}`}),e.append(t,n),e},play:async({canvasElement:e})=>{let n=e.querySelector(`contour-legend`),r=e.querySelector(`#comp-legend-status`),i=n.querySelector(`.c-legend__item`);await t(i).toBeTruthy(),i.click(),await t(r.textContent).toBe(`a:false`),await t(i).toHaveAttribute(`aria-pressed`,`false`)}},a=[`ChartWithLegend`,`LegendToggleEmitsIntent`],r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "1rem";
    const chart = document.createElement("contour-chart");
    chart.setAttribute("axis", "Weekly volume");
    chart.setAttribute("series", JSON.stringify([{
      label: "Volume",
      type: "bar",
      values: [10, 20, 15]
    }]));
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
    // The chart must paint its series, not fall through to the empty branch:
    // \`data=\` is not an attribute ContourChart reads, so a chart fed that way
    // renders "No data" and the composition certifies nothing.
    await expect(chart.querySelector(".c-chart__empty")).toBeNull();
    await expect(chart.querySelectorAll(".c-chart__bar").length).toBe(3);
    await expect(legend.textContent).toContain("Volume");
    await expect(legend.textContent).toContain("Target");
  }
}`,...r.parameters?.docs?.source}}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrap = document.createElement("div");
    const legend = document.createElement("contour-legend");
    legend.setAttribute("selectable", "");
    legend.setAttribute("items", JSON.stringify([{
      label: "A",
      key: "a",
      color: "var(--chart-1)"
    }, {
      label: "B",
      key: "b",
      color: "var(--chart-2)"
    }]));
    const status = document.createElement("p");
    status.id = "comp-legend-status";
    status.textContent = "none";
    // ContourLegend emits \`contour:legend-toggle\` (and \`contour:select\`), not
    // \`contour:toggle\`. A listener on the wrong name passes a presence check
    // while certifying an event no component dispatches.
    wrap.addEventListener("contour:legend-toggle", e => {
      status.textContent = \`\${e.detail.key}:\${e.detail.pressed}\`;
    });
    wrap.append(legend, status);
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    const legend = canvasElement.querySelector("contour-legend");
    const status = canvasElement.querySelector("#comp-legend-status");
    const item = legend.querySelector(".c-legend__item");
    await expect(item).toBeTruthy();
    item.click();
    await expect(status.textContent).toBe("a:false");
    await expect(item).toHaveAttribute("aria-pressed", "false");
  }
}`,...i.parameters?.docs?.source}}}})))()}o();export{r as ChartWithLegend,i as LegendToggleEmitsIntent,a as __namedExportsOrder,n as default};