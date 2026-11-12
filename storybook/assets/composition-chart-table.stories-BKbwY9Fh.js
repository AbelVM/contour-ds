import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o;function s(){return(s=e((()=>{({expect:t}=__STORYBOOK_MODULE_TEST__),n={title:`Contour/Compositions/ChartTable`,tags:[`autodocs`],parameters:{contour:{maturity:`composition`}}},r={render:()=>{let e=document.createElement(`div`);return e.style.display=`grid`,e.style.gridTemplateColumns=`1fr 1fr`,e.style.gap=`1rem`,e.innerHTML=`
      <div>
        <h3>Volume by Region</h3>
        <contour-chart
          id="demo-chart"
          axis="Volume"
          series='[{"label":"Volume","type":"bar","values":[842,617,423,291]}]'
        ></contour-chart>
        <contour-legend
          id="demo-legend"
          items='[{"label":"Volume","color":"var(--chart-1)"}]'
        ></contour-legend>
      </div>
      <div>
        <h3>Regional Data</h3>
        <div class="c-table-wrap">
          <contour-table
            id="demo-table"
            columns='["Region","Volume","Status"]'
            rows='[["North","842","Open"],["South","617","Review"],["East","423","Closed"],["West","291","Open"]]'
          ></contour-table>
        </div>
      </div>
    `,e},play:async({canvasElement:e})=>{await t(e.querySelector(`contour-chart`)).toBeTruthy(),await t(e.querySelector(`contour-table`)).toBeTruthy(),await t(e.querySelector(`contour-legend`)).toBeTruthy(),await t(e.querySelector(`contour-chart .c-chart__empty`)).toBeNull(),await t(e.querySelectorAll(`contour-chart .c-chart__bar`).length).toBe(4)}},i={render:()=>{let e=document.createElement(`div`);return e.style.display=`grid`,e.style.gap=`1rem`,e.innerHTML=`
      <contour-chart
        id="timeseries-chart"
        axis="Time"
        series='[{"label":"Volume","type":"line","values":[10,15,13,18,22,20]}]'
      ></contour-chart>
      <contour-animation-controls
        id="time-slider"
        min="0"
        max="5"
        step="1"
        value="0"
        markers='["Jan","Feb","Mar","Apr","May","Jun"]'
        loop
      ></contour-animation-controls>
    `,e},play:async({canvasElement:e})=>{await t(e.querySelector(`contour-chart`)).toBeTruthy(),await t(e.querySelector(`contour-animation-controls`)).toBeTruthy(),await t(e.querySelector(`contour-chart .c-chart__empty`)).toBeNull(),await t(e.querySelectorAll(`contour-chart .c-chart__line`).length).toBe(1)}},a={render:()=>{let e=document.createElement(`div`);return e.style.display=`grid`,e.style.gap=`1rem`,e.innerHTML=`
      <contour-chart
        id="multi-chart"
        axis="Time"
        series='[{"label":"Actual","type":"line","values":[10,15,13,18,22]},{"label":"Target","type":"line","values":[12,14,16,18,20]}]'
      ></contour-chart>
      <contour-legend
        id="multi-legend"
        items='[{"label":"Actual","color":"var(--chart-1)"},{"label":"Target","color":"var(--chart-2)"}]'
      ></contour-legend>
    `,e},play:async({canvasElement:e})=>{await t(e.querySelector(`contour-chart`)).toBeTruthy(),await t(e.querySelector(`contour-legend`)).toBeTruthy(),await t(e.querySelector(`contour-chart .c-chart__empty`)).toBeNull(),await t(e.querySelectorAll(`contour-chart .c-chart__line`).length).toBe(2)}},o=[`ChartWithTableCrossSelection`,`ChartWithTimeSlider`,`MultiSeriesChartWithLegendToggle`],r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gridTemplateColumns = "1fr 1fr";
    wrap.style.gap = "1rem";
    wrap.innerHTML = \`
      <div>
        <h3>Volume by Region</h3>
        <contour-chart
          id="demo-chart"
          axis="Volume"
          series='[{"label":"Volume","type":"bar","values":[842,617,423,291]}]'
        ></contour-chart>
        <contour-legend
          id="demo-legend"
          items='[{"label":"Volume","color":"var(--chart-1)"}]'
        ></contour-legend>
      </div>
      <div>
        <h3>Regional Data</h3>
        <div class="c-table-wrap">
          <contour-table
            id="demo-table"
            columns='["Region","Volume","Status"]'
            rows='[["North","842","Open"],["South","617","Review"],["East","423","Closed"],["West","291","Open"]]'
          ></contour-table>
        </div>
      </div>
    \`;
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement.querySelector("contour-chart")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-table")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-legend")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-chart .c-chart__empty")).toBeNull();
    await expect(canvasElement.querySelectorAll("contour-chart .c-chart__bar").length).toBe(4);
  }
}`,...r.parameters?.docs?.source}}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "1rem";
    wrap.innerHTML = \`
      <contour-chart
        id="timeseries-chart"
        axis="Time"
        series='[{"label":"Volume","type":"line","values":[10,15,13,18,22,20]}]'
      ></contour-chart>
      <contour-animation-controls
        id="time-slider"
        min="0"
        max="5"
        step="1"
        value="0"
        markers='["Jan","Feb","Mar","Apr","May","Jun"]'
        loop
      ></contour-animation-controls>
    \`;
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement.querySelector("contour-chart")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-animation-controls")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-chart .c-chart__empty")).toBeNull();
    await expect(canvasElement.querySelectorAll("contour-chart .c-chart__line").length).toBe(1);
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "1rem";
    wrap.innerHTML = \`
      <contour-chart
        id="multi-chart"
        axis="Time"
        series='[{"label":"Actual","type":"line","values":[10,15,13,18,22]},{"label":"Target","type":"line","values":[12,14,16,18,20]}]'
      ></contour-chart>
      <contour-legend
        id="multi-legend"
        items='[{"label":"Actual","color":"var(--chart-1)"},{"label":"Target","color":"var(--chart-2)"}]'
      ></contour-legend>
    \`;
    return wrap;
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement.querySelector("contour-chart")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-legend")).toBeTruthy();
    await expect(canvasElement.querySelector("contour-chart .c-chart__empty")).toBeNull();
    await expect(canvasElement.querySelectorAll("contour-chart .c-chart__line").length).toBe(2);
  }
}`,...a.parameters?.docs?.source}}}})))()}s();export{r as ChartWithTableCrossSelection,i as ChartWithTimeSlider,a as MultiSeriesChartWithLegendToggle,o as __namedExportsOrder,n as default};