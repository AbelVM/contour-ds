  // ---- Additional advanced chart and map components ----

  class ContourFlowMap extends ContourBase {
    render() { this.classList.add("c-flow-map"); }
  }
  define("contour-flow-map", ContourFlowMap);

  class ContourIsochrone extends ContourBase {
    render() { this.classList.add("c-isochrone"); }
  }
  define("contour-isochrone", ContourIsochrone);

  class ContourCatchment extends ContourBase {
    render() { this.classList.add("c-catchment"); }
  }
  define("contour-catchment", ContourCatchment);

  class ContourStreamingChart extends ContourBase {
    render() { this.classList.add("c-streaming-chart"); }
  }
  define("contour-streaming-chart", ContourStreamingChart);


