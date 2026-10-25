import { ContourBase, define } from './core.mjs';
class ContourReservedFull extends ContourBase {
    render() { this.classList.add("c-reserved"); }
  }
  define("contour-reserved", ContourReservedFull);
class ContourThemeScopeFull extends ContourBase {
    render() { this.classList.add("c-theme-scope"); }
  }
  define("contour-theme-scope", ContourThemeScopeFull);
class ContourActivity extends ContourBase { render() { this.classList.add("c-activity"); } }
  define("contour-activity", ContourActivity);
class ContourAdvanced extends ContourBase { render() { this.classList.add("c-advanced"); } }
  define("contour-advanced", ContourAdvanced);
class ContourAffordance extends ContourBase { render() { this.classList.add("c-affordance"); } }
  define("contour-affordance", ContourAffordance);
class ContourAffordances extends ContourBase { render() { this.classList.add("c-affordances"); } }
  define("contour-affordances", ContourAffordances);
