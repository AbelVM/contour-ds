/* ============================================================================
   CONTOUR — data state and remote loading
   ----------------------------------------------------------------------------
   One implementation of the four data states (`empty`, `loading`, `error`,
   `skeleton`) and of the remote source (`src`, plus `lazy`, `refresh`,
   `timeout`).

   Before this file the same forty-line block was written into eight fragments by
   hand — 6 copies in `content.mjs`, 8 in `data.mjs`, 20 in `map.mjs`, 14 in
   `navigation.mjs` — and every copy carried the same defects, measured in
   Chromium against `dist/contour-wc.js` built at 7d75b3d (probe
   `tmp/wc9/probe.mjs`, 2026-10-27):

     1. a host with `src` painted `"Loading…Loading…"` — two nodes — because the
        copy re-rendered by calling `attributeChangedCallback` from inside
        `render()`, which on the connect path is a synchronous nested render;
     2. a 404 and a malformed body both landed on the EMPTY state
        (`{"empty":1,"error":0,"text":"No data"}`), so the component claimed it
        had no data when in fact it had failed to fetch it;
     3. nothing aborted the request: a host removed mid-flight kept
        `loadingAfterDetach: 2` stale nodes and was still written to;
     4. the state was styled by an inline `style.color`, which beat the CSS rule
        written beside it in the same commit, so the rule was dead — and 33
        generated `c-*__skeleton` names had no rule anywhere.

   Three rules fall out of that, and they are the whole design here.

   Presentation belongs to the sheet. Nothing in this file writes a `style`
   attribute; the state nodes carry the block-scoped element class the system
   already defines (102 of them exist in `src/css/`), so a generated class cannot
   be one the system cannot style.

   A state is not a live region. `role="alert"` on a node inserted already
   carrying text is exactly what `tools/audit/contrast-and-aria.mjs` refuses — it
   scans every `[role="status"],[role="alert"],[aria-live]` whose text is non-empty
   at load, because such a region "has no change left to announce". So the widget
   says `aria-busy` while it works and nothing at all when it has failed; the
   consumer that wants the failure spoken routes `contour:error` to the page's own
   `#toast-host`, which exists empty for that purpose.

   The loader is shared per URL, not per host: a dashboard that mounts forty
   chrome widgets against one endpoint should ask it once.
   ========================================================================= */

import { onDispose } from './core.mjs';

// Copy. A component overrides any of these through its own attribute, because a
// legend and a table should not both say "No data" — but a default must exist,
// because a state with no text is a state the reader cannot see.
export const STATE_FALLBACK = {
  empty: "No data",
  loading: "Loading…",
  error: "Could not load.",
};

// One in-flight request per URL, shared by every host that asked for it.
const remoteInflight = new Map();
// The last result per URL, so a re-mounted host paints instead of re-asking. A
// refused URL is never cached: one blip must not black out a widget until reload.
const remoteCache = new Map();

// A URL answered from the cache still waits one microtask before the host paints,
// so a render that asked for data never sees it synchronously. The alternative
// makes the state depend on whether some other host happened to ask first, which
// is not a state a page can reason about.
const soon = (host) => { queueMicrotask(() => { if (host.isConnected) host.requestRender(); }); };

function setStatus(host, status, detail) {
  host._remoteStatus = status;
  if (status === "error") host._remoteError = (detail && detail.message) || "Request failed";
  else if (status !== "loading") host._remoteError = null;
  // `aria-busy` is the platform's own word for "this region is mid-update", it is
  // not in OBSERVED, so writing it cannot re-enter this render, and it is removed
  // the moment a request is not open.
  if (status === "loading") host.setAttribute("aria-busy", "true");
  else host.removeAttribute("aria-busy");
}

function emitState(host, name, detail) {
  host.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
}

function countOf(data) {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === "object") return Object.keys(data).length;
  return data === null || data === undefined ? 0 : 1;
}

/**
 * Ask for `src` and report whether the host is waiting on it.
 *
 * `fields` are the attributes the payload may feed, in the order the component
 * prefers them. Reads nothing and writes nothing the component paints — the
 * values come back through `remoteData`.
 */
export function loadRemote(host, fields) {
  const src = host.getAttribute("src");
  if (!src) {
    setStatus(host, host._remoteData !== undefined ? "ready" : "idle");
    return;
  }
  remoteRefresh(host);
  const wanted = typeof fields === "string" ? [fields] : fields;
  // An authored attribute wins outright: the component must not fetch over the
  // top of markup the author wrote.
  if (wanted.every((f) => host.getAttribute(f) !== null)) {
    setStatus(host, "ready");
    return;
  }
  if (!remoteVisible(host)) {
    setStatus(host, "idle");
    return;
  }
  const cached = remoteCache.get(src);
  if (cached !== undefined) {
    host._remoteSrc = src;
    host._remoteData = cached;
    setStatus(host, "ready");
    return;
  }
  if (host._remoteSrc === src && host._remoteStatus === "loading") return; // already asked

  host._remoteSrc = src;
  setStatus(host, "loading");

  let entry = remoteInflight.get(src);
  if (!entry) {
    entry = { hosts: new Set() };
    remoteInflight.set(src, entry);
    entry.promise = startFetch(host, src).then(
      (data) => {
        remoteCache.set(src, data);
        remoteInflight.delete(src);
        for (const h of entry.hosts) {
          h._remoteData = data;
          setStatus(h, "ready");
          emitState(h, "contour:load", { src, count: countOf(data) });
        }
      },
      (err) => {
        remoteInflight.delete(src);
        for (const h of entry.hosts) {
          const message = err && err.name === "HttpError" ? `Could not load (${err.status})` : STATE_FALLBACK.error;
          setStatus(h, "error", { message });
          emitState(h, "contour:error", { src, message, name: err && err.name });
        }
      }
    ).finally(() => { for (const h of entry.hosts) if (h.isConnected) h.requestRender(); });
  }
  entry.hosts.add(host);
}

// `AbortSignal.timeout` is the platform's own deadline; where it is missing, the
// same thing is a timer and an abort. Either way an unreachable internal tile
// server cannot leave a widget in `loading` for the life of the page.
function startFetch(host, src) {
  const ms = parseInt(host.getAttribute("timeout") || "", 10);
  const controller = new AbortController();
  let timer = null;
  if (Number.isFinite(ms) && ms > 0) {
    if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
      host._remoteSignal = AbortSignal.timeout(ms);
      host._remoteSignal.addEventListener("abort", () => controller.abort(), { once: true });
    } else {
      timer = setTimeout(() => controller.abort(), ms);
    }
  }
  // The request belongs to the mount, not to the element's lifetime in a drawer.
  onDispose(host, () => { controller.abort(); if (timer) clearTimeout(timer); });

  return fetch(src, { signal: controller.signal })
    .then((res) => {
      if (timer) clearTimeout(timer);
      // The status line is the boundary. `fetch` resolves on 404 and on 500, so
      // without this test a failed request became an empty dataset and the
      // component told the reader there was nothing to show.
      if (!res.ok) {
        const e = new Error(`Could not load (${res.status})`);
        e.name = "HttpError";
        e.status = res.status;
        throw e;
      }
      return res.text();
    })
    .then((text) => {
      try { return JSON.parse(text); }
      catch (err) {
        const e = new Error(STATE_FALLBACK.error);
        e.name = "ParseError";
        e.cause = err;
        throw e;
      }
    });
}

/**
 * The value a component should render for one field: the attribute the author
 * wrote, else the matching key of the remote payload, else nothing.
 *
 * An array payload feeds the field the component asked for, so
 * `<contour-readout src="/rows.json">` works with a bare list; an object payload
 * is matched by key, so one endpoint can serve several fields of one component.
 * The return is always the string the render body already parses, so adopting
 * this changes no component's parsing.
 */
export function remoteData(host, field) {
  const authored = host.getAttribute(field);
  if (authored !== null) return authored;
  const data = host._remoteData;
  if (data === undefined || data === null) return null;
  if (Array.isArray(data)) return JSON.stringify(data);
  if (typeof data === "object") {
    const keys = typeof field === "string" ? [field] : field;
    for (const k of keys) {
      if (data[k] === undefined) continue;
      return typeof data[k] === "string" ? data[k] : JSON.stringify(data[k]);
    }
    return null;
  }
  return String(data);
}

/** True while a remote source is open. Lets a component keep content it already drew. */
export function remotePending(host) {
  return host._remoteStatus === "loading";
}

/**
 * `refresh="<seconds>"`: revalidate the source on a timer. The loop pauses while
 * the tab is hidden and stops when the host leaves the page, because a dashboard
 * left open in a background tab is the common way a design system becomes the
 * reason a laptop is warm.
 */
export function remoteRefresh(host) {
  const seconds = parseFloat(host.getAttribute("refresh") || "");
  const want = host.hasAttribute("src") && Number.isFinite(seconds) && seconds > 0;
  if (!want) {
    if (host._remoteTimer !== undefined) { clearTimeout(host._remoteTimer); host._remoteTimer = undefined; }
    return;
  }
  if (host._remoteTimer !== undefined) return; // already looping for this mount
  const tick = () => {
    host._remoteTimer = undefined;
    if (!host.isConnected || !host.hasAttribute("refresh")) return;
    if (document.hidden) { host._remoteTimer = setTimeout(tick, 1000); return; }
    const src = host.getAttribute("src");
    remoteCache.delete(src);
    host._remoteSrc = null;
    host.requestRender();
  };
  host._remoteTimer = setTimeout(tick, Math.max(1000, seconds * 1000));
  onDispose(host, () => { clearTimeout(host._remoteTimer); host._remoteTimer = undefined; });
}

// `loading="lazy"` belongs to the markup, not to the platform: an element below
// the fold must not compete with the forty above it for the same connection.
// Observed through IntersectionObserver where it exists; without it the host
// simply asks, which is the honest fallback rather than never asking.
export function remoteVisible(host) {
  if (!host.hasAttribute("lazy")) return true;
  if (typeof IntersectionObserver !== "function") return true;
  if (host._remoteVisible) return true;
  const io = new IntersectionObserver((records) => {
    if (!records.some((r) => r.isIntersecting)) return;
    io.disconnect();
    host._remoteVisible = true;
    soon(host);
  }, { rootMargin: "200px" });
  io.observe(host);
  onDispose(host, () => io.disconnect());
  return false;
}

// ---------------------------------------------------------------------------
// The states themselves
// ---------------------------------------------------------------------------

// A state node carries the block-scoped element class the sheet already defines
// (`c-readout__loading`, `c-tree__empty`, …) so an author can theme one block's
// state without reaching for the whole system, and never carries a `style`
// attribute — which is the defect that made the matching CSS rule dead.
//
// It also carries `data-contour-state`, and that is the only new hook here. The
// error state has to read as a failure, but the 34 `__error` rules in the sheets
// group it with `__empty` and `__loading` as muted text, so giving it the danger
// hue would mean editing 34 rules in the four sheets an active writer is landing
// changes into. A data attribute is a host-set input, not a published class: it
// needs no specimen, adds nothing to the component inventory, and cannot be
// mistaken for a retunable token.
function stateNode(host, block, kind, text) {
  const node = document.createElement("div");
  node.className = "c-" + block + "__" + kind;
  node.dataset.contourState = kind;
  node.textContent = text;
  return node;
}

function skeletonRow(i, total) {
  // The system's own skeleton block and its own modifiers: `--title` for the
  // first line so a placeholder has a shape instead of a uniform stack of bars,
  // `--text` for the rest. No per-block name is invented here, which is how the
  // 33 undefined `c-*__skeleton` classes stayed undefined.
  const node = document.createElement("div");
  node.className = "c-skeleton " + (i === 0 && total > 1 ? "c-skeleton--title" : "c-skeleton--text");
  return node;
}

/**
 * Paint the host's data state, if it has one. Returns true when a state took over
 * the render, so the caller returns before building content it would discard.
 *
 * The order is deliberate: `loading` (attribute or open request) wins over
 * `error`, because a retry in flight is not a failure, and either wins over
 * `skeleton`, which is a placeholder for a state the host may already be in.
 */
export function renderStates(host, block, opts) {
  const options = opts || {};
  const loading = host.getAttribute("loading");
  if (loading !== null || host._remoteStatus === "loading") {
    host.appendChild(stateNode(host, block, "loading", loading || STATE_FALLBACK.loading));
    return true;
  }
  const error = host.getAttribute("error");
  if (error !== null || host._remoteStatus === "error") {
    const message = (error !== null && error !== "") ? error
      : (host._remoteError || STATE_FALLBACK.error);
    const node = stateNode(host, block, "error", message);
    // `retry` is the actionable half of an error, and it reuses the button the
    // system already ships and the `contour:retry` event three components already
    // emit, rather than inventing a control for the same job.
    if (host.hasAttribute("retry")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "c-btn c-btn--ghost c-btn--sm";
      btn.textContent = host.getAttribute("retry") || "Retry";
      btn.dataset.action = "retry";
      node.appendChild(btn);
    }
    host.appendChild(node);
    return true;
  }
  if (host.hasAttribute("skeleton")) {
    const asked = parseInt(host.getAttribute("skeleton") || "3", 10);
    const count = Math.min(options.max || 6, Math.max(1, Number.isFinite(asked) ? asked : 3));
    for (let i = 0; i < count; i++) host.appendChild(skeletonRow(i, count));
    return true;
  }
  return false;
}

/** Paint the empty state — for a host with no data and no authored content. */
export function renderEmpty(host, block) {
  host.appendChild(stateNode(host, block, "empty", host.getAttribute("empty") || STATE_FALLBACK.empty));
}

// Delegated on the host (AGENTS.md rule 12): the retry button is regenerated on
// every render, so a listener bound to the node would be dropped by the next pass.
export function wireStates(host) {
  if (host._contourStatesWired) return;
  host._contourStatesWired = true;
  host.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-action="retry"]') : null;
    if (!btn || !host.contains(btn)) return;
    e.preventDefault();
    const src = host.getAttribute("src");
    if (src) remoteCache.delete(src);
    host._remoteSrc = null;
    host._remoteData = undefined;
    setStatus(host, "idle");
    emitState(host, "contour:retry", { src });
    host.requestRender();
  });
}
