/* ============================================================================
   CONTOUR — shared behaviour
   ----------------------------------------------------------------------------
   One implementation of each interaction, called by both layers: the light-DOM
   wrappers and the `contour-shadow-*` wrappers.

   Before this file the two layers each carried a copy, and the copies had
   already drifted in the one direction source review cannot see: the shadow copy
   queried its own root for nodes the author slots into the light DOM, so it
   found nothing and wired nothing. Measured against the shipped artifact
   (tmp/r3/behaviour-baseline.mjs):

     PASS  light contour-tabs renders 2 tabs, ArrowRight moves selection
     PASS  light segmented emits contour:change
     PASS  light pagination emits contour:page
     FAIL  shadow tabs: inner query sees slotted tabs   [inside shadow root: 0; slotted: 2]
     FAIL  shadow segmented / shadow menu: event reaches the document

   Two rules fall out of that, and they are the whole design of this file:
   a behaviour looks in BOTH trees, because slotted content lives in the light
   DOM; and it dispatches on the HOST, because a bubbling event from a node
   inside a shadow root reaches neither the host nor the document:

     bubbles-only -> reachedHost:false  reachedDoc:false

   Names are prefixed where they could collide: `stripWc` concatenates every
   fragment into one IIFE scope, so `emit`, `on` or `once` as bare top-level
   consts would silently shadow another module's. Nothing here owns markup or
   styling; a component decides what to render, this file only what happens when
   the reader acts on it.
   ========================================================================= */

// `contourId` is the shared counter: a generated node that needs an id (a
// listbox's options, an aria-controls target) takes it from here rather than
// calling Math.random(), which can hand two instances the same id and then point
// one control at another's list.
import { contourId, supportsUntilFound } from './core.mjs';

// A host is wired once per behaviour. Re-entering is normal — the base class
// calls enhance() after every render — so the guard lives in a WeakMap keyed on
// the node, where a re-render cannot drop it.
const WIRED_HOSTS = new WeakMap();
export const wcReset = (host) => { WIRED_HOSTS.delete(host); };
const wcClaim = (host, name) => {
  let set = WIRED_HOSTS.get(host);
  if (!set) { set = new Set(); WIRED_HOSTS.set(host, set); }
  if (set.has(name)) return false;
  set.add(name);
  return true;
};

// Authored content sits in the light DOM even when a shadow template slots it,
// and a template's own parts sit in the root: a behaviour owns both.
const wcScopes = (host) => (host.shadowRoot ? [host, host.shadowRoot] : [host]);
const wcAll = (host, sel) => {
  const found = [];
  for (const scope of wcScopes(host)) {
    for (const el of scope.querySelectorAll(sel)) if (!found.includes(el)) found.push(el);
  }
  return found;
};
const wcOne = (host, sel) => wcAll(host, sel)[0] || null;
// A custom element carries its own block class, and `querySelectorAll` never
// returns the node it was called on, so a group element that IS the host has to
// be added explicitly or the light wrappers find no group at all.
const wcSelfOrAll = (host, sel) => {
  const found = typeof host.matches === "function" && host.matches(sel) ? [host] : [];
  for (const el of wcAll(host, sel)) if (!found.includes(el)) found.push(el);
  return found;
};
// The flat tree is not the node tree. A group element inside a shadow root and
// the nodes slotted into it are in different trees, so `group.contains(node)` is
// false for exactly the authored content the group exists to hold. A group's
// nodes are therefore its own subtree plus, when the group is template-owned,
// the host's light DOM — which is what a reader actually slotted into it.
const wcShadowOf = (node) => {
  const root = node && node.getRootNode ? node.getRootNode() : null;
  return root && root.host ? root : null;
};
const wcGroup = (host, group, sel) => {
  const found = Array.from(group.querySelectorAll(sel));
  if (wcShadowOf(group) && wcShadowOf(group).host === host) {
    for (const el of host.querySelectorAll(sel)) if (!found.includes(el)) found.push(el);
  }
  return found;
};
// Both scopes are listened to because retargeting is the asymmetry that decides
// where a node is visible from: a listener on the host sees the author's slotted
// nodes with their real target, but an event that started inside a shadow tree
// arrives there retargeted to the host, so `closest` finds nothing. The root
// listener sees those inner nodes unretargeted.
//
// A composed event is therefore heard twice on its way out, so each handler runs
// once per event — but keyed on the handler too. A set of events alone would let
// one component swallow the click of a component nested inside it, and each host
// owns its own interaction.
const HEARD = new WeakMap();
const wcListen = (host, type, handler) => {
  const scoped = (e) => {
    let seen = HEARD.get(e);
    if (!seen) { seen = new Set(); HEARD.set(e, seen); }
    if (seen.has(scoped)) return;
    seen.add(scoped);
    handler(e);
  };
  for (const scope of wcScopes(host)) scope.addEventListener(type, scoped);
};
const wcOwned = (host, node) =>
  !!node && wcScopes(host).some((scope) => scope.contains(node));
// `closest` is asked of the event's own target, which is unretargeted inside the
// tree that heard it; `wcOwned` then rejects a match outside this host.
const wcClosest = (host, target, sel) =>
  (typeof target?.closest === "function" && wcOwned(host, target)) ? target.closest(sel) : null;
// Dispatched on the HOST, so a listener outside this layer hears it whatever the flag
// says — which is why an event reaching the document proves nothing about `composed`.
// The flag is for a boundary this layer does not own: A/B on a wrapper mounted inside a
// foreign component's shadow root, the option pressed in both runs, and the document
// heard the event in one of them — `composed: false` arrived 0 times, `composed: true`
// once. Consumers that wrap contour inside their own shadow tree are who it serves.
const wcEmit = (host, name, detail) => {
  host.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
};

/**
 * Tabs and code-tabs: roving tabindex, Arrow/Home/End, panel show-hide.
 * The active tab is `[aria-selected="true"]`, which is the rule the sheet
 * paints, so no state class is ever written — and none is invented either.
 */
export function wireTabs(host) {
  if (!wcClaim(host, "tabs")) return;
  for (const list of wcSelfOrAll(host, ".c-tabs__list, .c-code-tabs__list")) {
    const isCode = list.classList.contains("c-code-tabs__list");
    const panelSel = isCode ? ".c-code-tabs__panel" : ".c-tabs__panel";
    // `list.contains(tab)` is the test that fails on a shadow wrapper: the list
    // is in the root and the tabs the author wrote are slotted light DOM, so the
    // node tree says they are unrelated even though the flat tree does not.
    const tabsOf = () => wcGroup(host, list, "[role='tab']");
    const activate = (tab, focus) => {
      const tabs = tabsOf();
      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.tabIndex = selected ? 0 : -1;
        const ctrl = t.getAttribute("aria-controls");
        if (!ctrl) return;
        const panel = wcOne(host, "#" + CSS.escape(ctrl)) || document.getElementById(ctrl);
        if (panel) panel.hidden = !selected;
      });
      const panels = wcAll(host, panelSel);
      if (panels.length) {
        const index = tabs.indexOf(tab);
        panels.forEach((p, i) => { p.hidden = i !== index; });
      }
      if (focus) try { tab.focus(); } catch (e) { /* detached mid-key */ }
      // Emit activation so consumers can observe tab changes (B3-10).
      const name = tab.getAttribute("aria-controls") || tab.textContent || "";
      host.dispatchEvent(new CustomEvent("contour:tab-change", { bubbles: true, composed: true, detail: { index: tabs.indexOf(tab), label: name } }));
    };
    // Same-document View Transitions (BY-24). A consumer who names elements via
    // `data-view-transition` / `--view-transition-name` gets a cross-fade on a
    // tab swap; the morph must run inside startViewTransition so the browser
    // has an old and a new state to interpolate. The initial mount activation
    // below stays direct — a transition on load is a page fade nobody asked
    // for — and the plain swap is the entire fallback, because the CSS harness
    // (components.css) is enhancement-only too.
    const runActivation = (tab, focus) => {
      const can = typeof document.startViewTransition === "function"
        && !(typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
      if (can) {
        try { document.startViewTransition(() => activate(tab, focus)); return; }
        catch (e) { /* an in-flight transition or a private context: plain swap */ }
      }
      activate(tab, focus);
    };
    wcListen(host, "click", (e) => {
      const tab = wcClosest(host, e.target, "[role='tab']");
      if (tab && tabsOf().includes(tab)) runActivation(tab, false);
    });
    wcListen(host, "keydown", (e) => {
      const tab = wcClosest(host, e.target, "[role='tab']");
      const tabs = tabsOf();
      const index = tabs.indexOf(tab);
      if (index < 0) return;
      const move = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in move)) return;
      e.preventDefault();
      const next = tabs[(move[e.key] + tabs.length) % tabs.length];
      if (next) runActivation(next, true);
    });
    // Respect an author-marked selected tab; fall back to the first.
    const tabs = tabsOf();
    const marked = tabs.find((t) => t.getAttribute("aria-selected") === "true");
    const first = marked || tabs[0];
    if (first) activate(first, false);
  }
}

/**
 * Segmented control: one pressed option, and `contour:change`. The guide's own
 * markup carries the option value in a `data-*-value` hook, so the event reads
 * the hook it can see and falls back to the label the reader sees.
 */
export function wireSegmented(host) {
  const groups = wcSelfOrAll(host, ".c-segmented");
  // The block's contract is the option class, a group role and an explicit
  // pressed state — that is what the sheet styles (`.c-segmented__option
  // [aria-pressed="true"]`) and what the guide's raw specimens write by hand. A
  // wrapper that only classes the host leaves the author's buttons unstyled:
  // measured in §23, three buttons with no class and no `aria-pressed` at all.
  // Normalised here, on every pass, so both layers and slotted markup agree.
  const normalize = () => {
    // Who owns the pressed state. The author's `value` wins when it CHANGES — an
    // attribute the author writes again is a new instruction — and the reader's own
    // click wins in between, because the pressed attribute on the option is that
    // choice and these buttons are the author's nodes, which survive a re-render.
    // The one remembered value is what makes both halves hold: without it a click
    // would move the state and the next re-render would move it back to `value`;
    // with a bare "reader has picked" flag, an author writing `value` later would
    // be ignored forever.
    const authored = host.getAttribute("value");
    const chosen = authored !== host._segAuthorValue ? authored : null;
    if (chosen !== null) host._segAuthorValue = authored;
    let seen = 0;
    for (const g of groups) {
      if (!g.hasAttribute("role")) g.setAttribute("role", "group");
      const label = host.getAttribute("label");
      if (label && !g.hasAttribute("aria-label")) g.setAttribute("aria-label", label);
      const opts = wcGroup(host, g, "button");
      seen += opts.length;
      opts.forEach((b) => {
        b.classList.add("c-segmented__option");
        b.setAttribute("aria-pressed", chosen !== null && chosen !== undefined ? String(b.dataset.value === chosen) : (b.getAttribute("aria-pressed") === "true" ? "true" : "false"));
      });
      // One tab stop for the group, on the pressed option — or the first when the
      // author chose none. Arrow keys then move it along with focus.
      const chosenOpt = opts.find((b) => b.getAttribute("aria-pressed") === "true") || opts[0];
      opts.forEach((b) => { b.tabIndex = b === chosenOpt ? 0 : -1; });
    }
    return seen;
  };
  // A classic `<script src="dist/contour-wc.js">` in `<head>` upgrades the host
  // while the parser is still inside it, so the author's buttons do not exist yet
  // and this pass normalises nothing — measured across three arms: head gave 0
  // option classes, 0 pressed states and 2 tab stops, where the same bundle with
  // `defer` and the ESM entry (deferred by spec) both gave 2, 2, 1. The listeners
  // below are unaffected because they delegate on the host, which outlives the
  // parse. One retry on a later task is all the missing children need; a group
  // that is genuinely empty just re-runs an idempotent pass once.
  if (!normalize()) {
    if (!host._segRetryScheduled) {
      host._segRetryScheduled = true;
      setTimeout(() => { host._segRetryScheduled = false; normalize(); }, 0);
    }
  }
  if (!wcClaim(host, "segmented")) return;
  const activate = (btn) => {
    const seg = groups.find((g) => wcGroup(host, g, "button").includes(btn));
    if (!seg) return;
    // `value` is deliberately not written back to the host here: it sits in the
    // shared OBSERVED list, so writing it would spend a full re-render on every
    // click. The pressed attribute on the option is the state, and it survives a
    // re-render because these buttons are the author's nodes, not generated ones.
    wcGroup(host, seg, "button").forEach((o) => {
      const on = o === btn;
      o.setAttribute("aria-pressed", String(on));
      o.tabIndex = on ? 0 : -1;
    });
    wcEmit(host, "contour:change", { value: btn.dataset.value || btn.textContent.trim() });
  };
  wcListen(host, "click", (e) => {
    const btn = wcClosest(host, e.target, "button");
    if (!btn) return;
    activate(btn);
  });
  wcListen(host, "keydown", (e) => {
    const btn = wcClosest(host, e.target, "button");
    if (!btn) return;
    const seg = groups.find((g) => wcGroup(host, g, "button").includes(btn));
    if (!seg) return;
    const opts = wcGroup(host, seg, "button");
    const idx = opts.indexOf(btn);
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.min(idx + 1, opts.length - 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.max(idx - 1, 0);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = opts.length - 1;
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(btn); return; }
    if (next >= 0 && next !== idx) { e.preventDefault(); opts[next].focus(); }
  });
}

/**
 * Combobox: filter, arrow-cursor the visible options, commit, dismiss outside.
 * Native `<select>` stays native elsewhere — its popup cannot be styled — so the
 * one list this file drives is the one the system does draw.
 */
export function wireCombobox(host) {
  wireComboboxDocDismiss();
  const input = wcOne(host, ".c-combobox__input");
  const list = wcOne(host, ".c-combobox__list");
  if (!input || !list) return;
  const optionList = () => wcAll(host, ".c-combobox__option");

  // Roles are re-applied on every pass, not claimed once. A re-render drops the
  // generated input and list and rebuilds them, so an attribute set on the first
  // pass is simply gone; the roles also belong to the markup, which the shared
  // implementation is what both layers have in common. Idempotent, so re-running
  // it cannot stack anything.
  if (!list.id) list.id = contourId("c-combobox-list");
  list.setAttribute("role", "listbox");
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-haspopup", "listbox");
  input.setAttribute("aria-controls", list.id);
  input.setAttribute("aria-expanded", list.hasAttribute("hidden") ? "false" : "true");
  if (!input.hasAttribute("aria-autocomplete")) input.setAttribute("aria-autocomplete", "list");
  optionList().forEach((opt, i) => {
    if (!opt.id) opt.id = contourId("c-combobox-option");
    opt.setAttribute("role", "option");
    if (!opt.hasAttribute("aria-selected")) opt.setAttribute("aria-selected", "false");
  });

  // Listeners are claimed once, and they are delegated on the HOST for the same
  // reason the other behaviours are: a listener bound to the generated input died
  // with it on the next render while the per-host claim was already spent, so a
  // combobox that changed any attribute stopped opening and stopped answering the
  // arrow keys. Measured: fresh -> openedOnFocus true, activeOptionCount 1; after
  // a placeholder change -> false and 0. The host outlives every rebuild, so the
  // nodes are looked up again per event instead of captured.
  if (!wcClaim(host, "combobox")) return;
  const liveInput = () => wcOne(host, ".c-combobox__input");
  const liveList = () => wcOne(host, ".c-combobox__list");
  let cursor = -1;
  const mark = (visible) => {
    const field = liveInput();
    visible.forEach((o, i) => {
      const on = i === cursor;
      o.classList.toggle("c-combobox__option--active", on);
      o.setAttribute("aria-selected", String(on));
    });
    if (field) {
      const active = cursor >= 0 ? visible[cursor] : null;
      if (active) field.setAttribute("aria-activedescendant", active.id);
      else field.removeAttribute("aria-activedescendant");
    }
  };
  const filter = (query) => {
    const q = (query || "").toLowerCase();
    optionList().forEach((o) => { o.hidden = !!(q && !o.textContent.toLowerCase().includes(q)); });
    cursor = -1;
  };
  const open = () => {
    const l = liveList();
    if (!l) return;
    l.removeAttribute("hidden");
    const field = liveInput();
    if (field) field.setAttribute("aria-expanded", "true");
  };
  const close = () => {
    const l = liveList();
    if (l) l.setAttribute("hidden", "");
    const field = liveInput();
    if (field) {
      field.setAttribute("aria-expanded", "false");
      field.removeAttribute("aria-activedescendant");
    }
    cursor = -1;
    // Cleared across every option, not the visible subset: an option that was
    // cursorred and then filtered out would otherwise keep `aria-selected="true"`
    // into the next open, and a listbox may report only one selected option.
    optionList().forEach((o) => {
      o.classList.remove("c-combobox__option--active");
      o.setAttribute("aria-selected", "false");
    });
  };
  const commit = (opt) => {
    const field = liveInput();
    if (!field) return;
    field.value = opt.textContent;
    wcEmit(host, "contour:select", { value: field.value });
    close();
    field.focus();
  };

  // `input` and `focus` do not both bubble out of a shadow root in the same way,
  // so `focusin` is what the focus-driven open listens to, and every handler
  // checks the event actually came from this host's field.
  const isField = (target) => wcClosest(host, target, ".c-combobox__input") !== null;
  wcListen(host, "input", (e) => {
    if (!isField(e.target)) return;
    filter(e.target.value);
    open();
    // The form-value event (BY-44) rides on the same interaction; the shadow
    // wrappers share this behaviour but have no `_emitForm`, so guard it.
    if (typeof host._emitForm === "function") host._emitForm("contour:input");
  });
  wcListen(host, "focusin", (e) => {
    if (!isField(e.target)) return;
    filter(e.target.value);
    open();
  });
  wcListen(host, "keydown", (e) => {
    if (!isField(e.target)) return;
    const visible = optionList().filter((o) => !o.hidden);
    if (e.key === "ArrowDown") { e.preventDefault(); cursor = Math.min(cursor + 1, visible.length - 1); mark(visible); }
    else if (e.key === "ArrowUp") { e.preventDefault(); cursor = Math.max(cursor - 1, 0); mark(visible); }
    else if (e.key === "Enter") { e.preventDefault(); if (cursor >= 0 && visible[cursor]) commit(visible[cursor]); }
    else if (e.key === "Escape") close();
  });
  wcListen(host, "click", (e) => {
    const opt = wcClosest(host, e.target, ".c-combobox__option");
    if (opt) { commit(opt); return; }
    if (!wcOwned(host, e.target) || !host.contains(e.target)) close();
  });
}

// Outside-click dismissal for comboboxes. A single document listener is cheaper and
// leak-free compared to one per instance; it closes every open list whose host
// does not contain the click target.
let _comboboxDocWired = false;
function wireComboboxDocDismiss() {
  if (_comboboxDocWired) return;
  _comboboxDocWired = true;
  document.addEventListener("click", (e) => {
    for (const host of document.querySelectorAll("contour-combobox, contour-shadow-combobox")) {
      const list = host.shadowRoot ? host.shadowRoot.querySelector(".c-combobox__list") : host.querySelector(".c-combobox__list");
      const input = host.shadowRoot ? host.shadowRoot.querySelector(".c-combobox__input") : host.querySelector(".c-combobox__input");
      if (!list || list.hasAttribute("hidden")) continue;
      const root = host.shadowRoot || host;
      if (root.contains(e.target)) continue;
      list.setAttribute("hidden", "");
    }
  });
}

/**
 * The tree items a keyboard reader can actually reach. A collapsed branch carries
 * `hidden`, and a hidden element is not focusable, so a tab stop placed on one is
 * a stop the reader never arrives at — measured when this was missed: ArrowDown
 * left focus where it was and moved the only stop onto a hidden child.
 */
const visibleStops = (host) => wcAll(host, ".c-tree__toggle, .c-tree__leaf").filter((el) => !el.closest(".c-tree__children[hidden]"));

/** Tree: one toggle per branch, and `contour:toggle` so a page can persist it. */
export function wireTree(host) {
  // The ARIA shape and the tab stop are re-applied on every pass, before the
  // claim. Two reasons, both measured on the shipped guide: the generated items
  // carried `role="tree"` on the list and NO `role="treeitem"` anywhere, so the
  // structure announced nothing to a screen reader; and every toggle and leaf was
  // stamped `tabindex="-1"` with nothing ever set to 0, so the tree had no tab
  // stop and a keyboard reader could not reach it at all. Roles cannot be guarded
  // by a one-shot claim, because a re-render rebuilds the nodes that carry them.
  const nodes = () => wcAll(host, ".c-tree__node");
  const rootList = wcSelfOrAll(host, "ul.c-tree")[0];
  if (rootList && !rootList.hasAttribute("role")) rootList.setAttribute("role", "tree");
  wcAll(host, ".c-tree__children").forEach((ul) => {
    if (!ul.hasAttribute("role")) ul.setAttribute("role", "group");
  });
  const levelOf = (node) => {
    let level = 1;
    for (let p = node.parentElement; p; p = p.parentElement) if (p.classList && p.classList.contains("c-tree__children")) level++;
    return level;
  };
  nodes().forEach((node) => {
    if (node.getAttribute("role") !== "treeitem") node.setAttribute("role", "treeitem");
    node.setAttribute("aria-level", String(levelOf(node)));
    const row = node.querySelector(":scope > .c-tree__row");
    if (row) node.setAttribute("aria-expanded", row.getAttribute("aria-expanded") || "false");
    else if (node.hasAttribute("aria-expanded")) node.removeAttribute("aria-expanded");
  });
  // Exactly one tab stop. The author's own `tabindex="0"` is the choice, then the
  // element that already holds focus, then the first item — in that order, so the
  // invariant (one stop, never none, never N) holds without overriding intent.
  // Only the VISIBLE items count: a collapsed branch is `hidden`, and a stop on a
  // node the browser will not focus is a stop the reader never reaches. Measured
  // when this was missed — ArrowDown left focus on item 0 and moved the stop onto
  // a hidden child, so the tree reported one tab stop that nothing could hold.
  const stops = visibleStops(host);
  const authored = stops.find((el) => el.getAttribute("tabindex") === "0");
  const active = authored || stops.find((el) => el === document.activeElement) || stops[0];
  stops.forEach((el) => el.setAttribute("tabindex", el === active ? "0" : "-1"));
  // Hidden items are taken out of the sequence entirely, not left at whatever
  // value a previous pass gave them.
  wcAll(host, ".c-tree__toggle, .c-tree__leaf").forEach((el) => {
    if (!stops.includes(el)) el.setAttribute("tabindex", "-1");
  });

  if (!wcClaim(host, "tree")) return;
  const toggleNode = (toggle) => {
    const wasOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!wasOpen));
    const row = toggle.closest(".c-tree__row") || toggle.parentElement;
    if (row) row.setAttribute("aria-expanded", String(!wasOpen));
    const node = toggle.closest(".c-tree__node");
    const children = node ? node.querySelector(":scope > .c-tree__children") : null;
    if (children) {
      if (wasOpen) {
        if (supportsUntilFound()) children.setAttribute("hidden", "until-found");
        else children.hidden = true;
      } else {
        children.removeAttribute("hidden");
      }
    }
    if (node) node.setAttribute("aria-expanded", String(!wasOpen));
    wcEmit(host, "contour:toggle", { open: !wasOpen, label: (row ? row.textContent : "").trim().slice(0, 120) });
  };
  const branchOf = (el) => (el.classList && el.classList.contains("c-tree__toggle") ? el : null);
  const stopsOf = () => visibleStops(host);
  // The kept element takes the single stop; every other item — visible or hidden —
  // is dropped to -1, so opening a branch cannot leave two stops behind.
  const rove = (keep) => {
    wcAll(host, ".c-tree__toggle, .c-tree__leaf").forEach((el) => el.setAttribute("tabindex", el === keep ? "0" : "-1"));
  };
  wcListen(host, "click", (e) => {
    let toggle = wcClosest(host, e.target, ".c-tree__toggle");
    if (!toggle) {
      const row = wcClosest(host, e.target, ".c-tree__row");
      if (row) toggle = row.querySelector(":scope > .c-tree__toggle");
    }
    if (!toggle) return;
    e.preventDefault();
    e.stopPropagation();
    toggleNode(toggle);
  });
  wcListen(host, "focusin", (e) => {
    // Roving the tab stop with focus, so the tree is one Tab and not N.
    if (!wcClosest(host, e.target, ".c-tree__toggle, .c-tree__leaf")) return;
    rove(e.target);
  });
  wcListen(host, "keydown", (e) => {
    const toggle = wcClosest(host, e.target, ".c-tree__toggle, .c-tree__leaf");
    if (!toggle) return;
    const items = stopsOf();
    const idx = items.indexOf(toggle);
    if (e.key === "Enter" || e.key === " ") {
      if (branchOf(toggle)) { e.preventDefault(); toggleNode(toggle); }
      return;
    }
    // Right opens a branch, Left closes it — the pair a tree reader expects, and
    // the only way to reach a collapsed branch's children without a mouse.
    if (e.key === "ArrowRight") {
      const branch = branchOf(toggle);
      const closed = branch && branch.getAttribute("aria-expanded") === "false";
      e.preventDefault();
      if (closed) { toggleNode(branch); rove(toggle); }
      else { const next = items[idx + 1]; if (next) { next.focus(); rove(next); } }
      return;
    }
    if (e.key === "ArrowLeft") {
      const branch = branchOf(toggle);
      if (branch && branch.getAttribute("aria-expanded") === "true") {
        e.preventDefault();
        toggleNode(branch);
        rove(toggle);
      } else {
        const parent = toggle.closest(".c-tree__children");
        const owner = parent ? parent.closest(".c-tree__node") : null;
        const up = owner ? owner.querySelector(":scope > .c-tree__row > .c-tree__toggle") : null;
        if (up) { e.preventDefault(); up.focus(); rove(up); }
      }
      return;
    }
    let next = -1;
    if (e.key === "ArrowDown") next = Math.min(idx + 1, items.length - 1);
    else if (e.key === "ArrowUp") next = Math.max(idx - 1, 0);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next >= 0 && next !== idx) {
      e.preventDefault();
      items[next].focus();
      rove(items[next]);
    }
  });
}

/** Menu: roving focus over items, `contour:select` from key or pointer. */
export function wireMenu(host) {
  const items = () => wcAll(host, "[role='menuitem']");
  items().forEach((it) => { if (!it.hasAttribute("tabindex")) it.setAttribute("tabindex", "-1"); });
  if (!items().some((it) => it.getAttribute("tabindex") === "0") && items().length) {
    items()[0].setAttribute("tabindex", "0");
  }
  if (!wcClaim(host, "menu")) return;
  wcListen(host, "keydown", (e) => {
    const its = items();
    if (!its.length) return;
    const index = its.indexOf(e.target);
    let next = -1;
    if (e.key === "ArrowDown") next = index < 0 ? 0 : Math.min(index + 1, its.length - 1);
    else if (e.key === "ArrowUp") next = index < 0 ? its.length - 1 : Math.max(index - 1, 0);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = its.length - 1;
    if (next >= 0) { e.preventDefault(); its[next].focus(); return; }
    if ((e.key === "Enter" || e.key === " ") && index >= 0) {
      e.preventDefault();
      wcEmit(host, "contour:select", { index, label: its[index].textContent.trim() });
    }
  });
  wcListen(host, "click", (e) => {
    const item = wcClosest(host, e.target, "[role='menuitem']");
    if (!item) return;
    const index = items().indexOf(item);
    if (index >= 0) wcEmit(host, "contour:select", { index, label: item.textContent.trim() });
  });
}

/** Pagination: `[aria-current="page"]` is the state the sheet paints. */
export function wirePagination(host) {
  wcAll(host, ".c-pagination__link").forEach((b) => { if (!b.hasAttribute("tabindex")) b.setAttribute("tabindex", "0"); });
  if (!wcClaim(host, "pagination")) return;
  const activate = (btn) => {
    const page = parseInt(btn.textContent, 10);
    if (!Number.isFinite(page)) return;
    wcAll(host, ".c-pagination__link").forEach((b) => {
      if (parseInt(b.textContent, 10) === page) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    wcEmit(host, "contour:page", { page });
  };
  wcListen(host, "click", (e) => {
    const btn = wcClosest(host, e.target, ".c-pagination__link");
    if (!btn) return;
    e.preventDefault();
    activate(btn);
  });
  wcListen(host, "keydown", (e) => {
    const btn = wcClosest(host, e.target, ".c-pagination__link");
    if (!btn) return;
    const links = wcAll(host, ".c-pagination__link");
    const idx = links.indexOf(btn);
    let next = -1;
    if (e.key === "ArrowRight") next = Math.min(idx + 1, links.length - 1);
    else if (e.key === "ArrowLeft") next = Math.max(idx - 1, 0);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = links.length - 1;
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(btn); return; }
    if (next >= 0 && next !== idx) { e.preventDefault(); links[next].focus(); }
  });
  }

/**
 * Copy. `.c-code__copy` copies its block, `.c-install__copy` its command — one
 * handler because both need the same three things: the text, the clipboard, and
 * a `contour:copy` a page can toast from when the clipboard is denied.
 */
export function wireCopy(host) {
  if (!wcClaim(host, "copy")) return;
  wcListen(host, "click", (e) => {
    const btn = wcClosest(host, e.target, ".c-code__copy, .c-install__copy");
    if (!btn) return;
    const owner = wcClosest(host, btn, ".c-code") || wcClosest(host, btn, ".c-install") || host;
    const src = owner.querySelector("code, .c-install__command");
    const text = (src ? src.textContent : owner.textContent) || "";
    // The confirmation is the one the system script paints for the guide's own
    // copy buttons: a label swap, `data-copied` (which the shipped CSS styles)
    // and an icon check on the trigger, reverted after the same beat. The
    // trigger keeps focus, so the label change is what a screen reader hears.
    const confirm = (ok) => {
      const icon = btn.querySelector("use");
      const originalHref = icon && icon.getAttribute("href");
      const originalLabel = btn.getAttribute("aria-label") || btn.title || "";
      if (ok && icon) icon.setAttribute("href", "#i-check");
      btn.setAttribute("aria-label", ok ? "Copied" : "Copy failed");
      btn.dataset.copied = String(ok);
      setTimeout(() => {
        if (icon && originalHref) icon.setAttribute("href", originalHref);
        btn.setAttribute("aria-label", originalLabel);
        delete btn.dataset.copied;
      }, 1600);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => confirm(true)).catch(() => confirm(false));
    wcEmit(host, "contour:copy", { text });
  });
}

/**
 * Removable things: a tag, a filter pill, and the empty state's retry. The
 * affordance is the control's job to remove and to say so; keeping the node in
 * sync with the event is what makes the two copies of this rule agree.
 */
export function wireRemovable(host) {
  if (!wcClaim(host, "removable")) return;
  wcListen(host, "click", (e) => {
    const drop = (node) => { if (node && node.parentNode) node.parentNode.removeChild(node); };
    const tagBtn = wcClosest(host, e.target, ".c-tag__remove");
    if (tagBtn) {
      e.preventDefault();
      const tag = wcClosest(host, tagBtn, ".c-tag");
      wcEmit(host, "contour:remove", { label: (tag && tag.getAttribute("label")) || (tag ? tag.textContent.trim() : "") });
      drop(tag);
      return;
    }
    const pillBtn = wcClosest(host, e.target, ".c-filter-pill__remove");
    if (pillBtn) {
      e.preventDefault();
      const pill = wcClosest(host, pillBtn, ".c-filter-pill");
      wcEmit(host, "contour:remove", { key: pill && pill.getAttribute("key"), value: pill && pill.getAttribute("value") });
      drop(pill);
      return;
    }
    if (wcClosest(host, e.target, "[data-empty-action]")) {
      wcEmit(host, "contour:empty-action", { state: host.getAttribute("state") || "empty" });
    }
  });
}

// Modal containment for the light dialog family (BY-46). A native <dialog> in
// showModal() modalises the page for free — top layer, backdrop, background
// inert — but the light contour-dialog/drawer/sheet have no platform modal, so
// opening one must lock the document scroll and inert the background or the
// page behind it stays reachable. Stacked: two open surfaces must not unlock
// the page on the first close. The guide's own modalise() is the pattern; this
// is the system's copy, since a rule that only works inside the guide does not
// ship.
const modalDepth = { n: 0 };
let modalSavedOverflow = null;
let modalSavedX = 0;
let modalSavedY = 0;
const modalInerted = new Set();

export function modalContain(host, open) {
  if (open) {
    if (modalDepth.n === 0) {
      // The lock itself clamps the scroll (overflow:hidden on the scroller),
      // so the position must be captured BEFORE it is applied or the restore
      // puts a clamped 0 back (measured: open-after-scrollTo read scrollY 0).
      modalSavedX = window.scrollX;
      modalSavedY = window.scrollY;
      modalSavedOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
    }
    modalDepth.n += 1;
    // An ancestor cannot be inert (it would inert the whole subtree); the
    // background is therefore each ancestor's SIBLINGS, walked out to the body.
    for (let el = host; el && el !== document.body; el = el.parentElement) {
      for (const sib of el.parentElement.children) {
        if (sib === el || sib.inert || modalInerted.has(sib)) continue;
        sib.inert = true;
        modalInerted.add(sib);
      }
    }
  } else {
    modalDepth.n = Math.max(0, modalDepth.n - 1);
    if (modalDepth.n === 0) {
      for (const el of modalInerted) el.inert = false;
      modalInerted.clear();
      document.documentElement.style.overflow = modalSavedOverflow || "";
      // Locking overflow can move the page if a scrollbar disappears; put the
      // position back so a close never lands the reader elsewhere.
      window.scrollTo(modalSavedX, modalSavedY);
    }
  }
}
