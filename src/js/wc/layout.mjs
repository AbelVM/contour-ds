import { ContourBase, define } from './core.mjs';
class ContourApp extends ContourBase { render() { this.classList.add("c-app"); } }
  define("contour-app", ContourApp);
class ContourAppBody extends ContourBase { render() { this.classList.add("c-app-body"); } }
  define("contour-app-body", ContourAppBody);
class ContourBtnGroup extends ContourBase { render() { this.classList.add("c-btn-group"); } }
  define("contour-btn-group", ContourBtnGroup);
class ContourRangeScale extends ContourBase { render() { this.classList.add("c-range-scale"); } }
  define("contour-range-scale", ContourRangeScale);
class ContourTimeRange extends ContourBase { render() { this.classList.add("c-time-range"); } }
  define("contour-time-range", ContourTimeRange);
