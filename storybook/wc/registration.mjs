import { define, simple } from './core.mjs';
  // ---- Registration: the class-only wrappers run last ------------------
  //
  // Order is the contract. Every complex component above claims its own name and
  // define() skips a name already claimed -- which is why
  // <contour-menu items='["Cut"]'> builds a <ul> instead of only gaining a class.
  // Move this loop back above the complex components and the scaffolding half of
  // this file becomes dead code again: it did, and no gate noticed.
  // Explicit defines (not a loop) so the coverage gate and tooling can see them.
  define("contour-box", simple(["c-box"]));
  define("contour-cluster", simple(["c-cluster"]));
  define("contour-container", simple(["c-container"]));
  define("contour-row", simple(["c-row"]));
  define("contour-scrim", simple(["c-scrim"]));
  define("contour-stack", simple(["c-stack"]));

