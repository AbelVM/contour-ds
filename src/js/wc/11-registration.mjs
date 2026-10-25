import { CLASS_ONLY, define, simple } from './00-core.mjs';
  // ---- Registration: the class-only wrappers run last ------------------
  //
  // Order is the contract. Every complex component above claims its own name and
  // define() skips a name already claimed -- which is why
  // <contour-menu items='["Cut"]'> builds a <ul> instead of only gaining a class.
  // Move this loop back above the complex components and the scaffolding half of
  // this file becomes dead code again: it did, and no gate noticed.
  for (const block of CLASS_ONLY) {
    define("contour-" + block, simple(["c-" + block]));
  }

