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

// A host is wired once per behaviour. Re-entering is normal — the base class
// calls enhance() after every render — so the guard lives in a WeakMap keyed on
// the node, where a re-render cannot drop it.
const WIRED_HOSTS = new WeakMap();
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
    };
    wcListen(host, "click", (e) => {
      const tab = wcClosest(host, e.target, "[role='tab']");
      if (tab && tabsOf().includes(tab)) activate(tab, false);
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
      if (next) activate(next, true);
    });
    const first = tabsOf()[0];
    if (first) activate(first, false);
  }
}

/**
 * Segmented control: one pressed option, and `contour:change`. The guide's own
 * markup carries the option value in a `data-*-value` hook, so the event reads
 * the hook it can see and falls back to the label the reader sees.
 */
export function wireSegmented(host) {
  if (!wcClaim(host, "segmented")) return;
  const groups = wcSelfOrAll(host, ".c-segmented");
  const activate = (btn) => {
    const seg = groups.find((g) => wcGroup(host, g, "button").includes(btn));
    if (!seg) return;
    wcGroup(host, seg, "button").forEach((o) => o.setAttribute("aria-pressed", String(o === btn)));
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
  if (!wcClaim(host, "combobox")) return;
  const input = wcOne(host, ".c-combobox__input");
  const list = wcOne(host, ".c-combobox__list");
  if (!input || !list) return;
  const options = () => wcAll(host, ".c-combobox__option");
  let cursor = -1;
  const mark = (visible) => visible.forEach((o, i) => o.classList.toggle("c-combobox__option--active", i === cursor));
  const filter = (query) => {
    const q = (query || "").toLowerCase();
    options().forEach((o) => { o.hidden = !!(q && !o.textContent.toLowerCase().includes(q)); });
    cursor = -1;
  };
  const open = () => list.removeAttribute("hidden");
  const close = () => { list.setAttribute("hidden", ""); cursor = -1; mark([]); };
  const commit = (opt) => {
    input.value = opt.textContent;
    wcEmit(host, "contour:select", { value: input.value });
    close();
    input.focus();
  };
  input.addEventListener("input", () => { filter(input.value); open(); });
  input.addEventListener("focus", () => { filter(input.value); open(); });
  input.addEventListener("keydown", (e) => {
    const visible = options().filter((o) => !o.hidden);
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

/** Tree: one toggle per branch, and `contour:toggle` so a page can persist it. */
export function wireTree(host) {
  if (!wcClaim(host, "tree")) return;
  const toggleNode = (toggle) => {
    const wasOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!wasOpen));
    const row = toggle.closest(".c-tree__row") || toggle.parentElement;
    if (row) row.setAttribute("aria-expanded", String(!wasOpen));
    const node = toggle.closest(".c-tree__node");
    const children = node ? node.querySelector(":scope > .c-tree__children") : null;
    if (children) children.hidden = wasOpen;
    wcEmit(host, "contour:toggle", { open: !wasOpen, label: (row ? row.textContent : "").trim().slice(0, 120) });
  };
  wcListen(host, "click", (e) => {
    const toggle = wcClosest(host, e.target, ".c-tree__toggle");
    if (!toggle) return;
    e.preventDefault();
    e.stopPropagation();
    toggleNode(toggle);
  });
  wcListen(host, "keydown", (e) => {
    const toggle = wcClosest(host, e.target, ".c-tree__toggle, .c-tree__leaf");
    if (!toggle) return;
    const items = wcAll(host, ".c-tree__toggle, .c-tree__leaf");
    const idx = items.indexOf(toggle);
    if (e.key === "Enter" || e.key === " ") {
      if (toggle.classList.contains("c-tree__toggle")) { e.preventDefault(); toggleNode(toggle); }
      return;
    }
    let next = -1;
    if (e.key === "ArrowDown") next = Math.min(idx + 1, items.length - 1);
    else if (e.key === "ArrowUp") next = Math.max(idx - 1, 0);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next >= 0 && next !== idx) { e.preventDefault(); items[next].focus(); }
  });
  // A toggle that cannot be reached by key is a control the keyboard cannot use.
  wcAll(host, ".c-tree__toggle, .c-tree__leaf").forEach((el) => {
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  });
}

/** Menu: roving focus over items, `contour:select` from key or pointer. */
export function wireMenu(host) {
  if (!wcClaim(host, "menu")) return;
  const items = () => wcAll(host, "[role='menuitem']");
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
  items().forEach((it) => { if (!it.hasAttribute("tabindex")) it.setAttribute("tabindex", "-1"); });
}

/** Pagination: `[aria-current="page"]` is the state the sheet paints. */
export function wirePagination(host) {
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
  wcAll(host, ".c-pagination__link").forEach((b) => { if (!b.hasAttribute("tabindex")) b.setAttribute("tabindex", "0"); });
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
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => { /* denied: the event still says what was copied */ });
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
