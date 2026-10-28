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
        (`{"empty":1,"error":0,"text":"No data"}`), so the component claimed it had
        no data when in fact it had failed to fetch it;
     3. nothing aborted the request: a host removed mid-flight kept
        `loadingAfterDetach: 2` stale nodes and was still written to;
     4. the state was styled by an inline `style.color`, which beat the CSS rule
        written beside it in the same commit, so the rule was dead — and 33
        generated `c-*__skeleton` names had no rule anywhere.

   Three rules fall out of that, and they are the whole design here.

   Presentation belongs to the sheet. Nothing in this file writes a `style`
   attribute; a state node carries the block-scoped element class the system
   already defines (`c-readout__loading` — 102 of those exist in `src/css/`), so a
   generated class is never one the system cannot style.

   A state is not a live region. `role="alert"` on a node that is inserted already
   carrying text is exactly what `tools/audit/contrast-and-aria.mjs` refuses: it
   scans every `[role="status"],[role="alert"],[aria-live]` whose text is non-empty
   at load, because such a region has no change left to announce. So the widget
   says `aria-busy` while it works and nothing at all when it has failed. A
   consumer that wants the failure spoken routes `contour:error` to the page's own
   `#toast-host`, which is present and empty for that purpose.

   The loader is shared per URL, not per host: a dashboard that mounts forty
   chrome widgets against one endpoint should ask it once. That is also why the
   abort belongs to the last host out, not the first — see `leaveRequest`.
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
// Bounded, because a page that routes through a hundred tile URLs is not going to
// re-ask the first ten, and an unbounded Map is a leak with a cache's vocabulary.
const REMOTE_CACHE_MAX = 64;
const remoteCache = new Map();

function cacheResult(src, data) {
  if (remoteCache.size >= REMOTE_CACHE_MAX) remoteCache.delete(remoteCache.keys().next().value);
  remoteCache.set(src, data);
}

function setStatus(host, status) {
  host._remoteStatus = status;
  if (status !== "error") host._remoteError = null;
  // `aria-busy` is the platform's own word for "this region is mid-update", it is
  // not in OBSERVED, so writing it cannot re-enter this render, and it is cleared
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
 * Leave a shared request. The host stops listening, and if it was the last host
 * that cared, the request itself is cancelled.
 *
 * This is why the abort is not simply `onDispose(host, () => controller.abort())`:
 * with a shared URL, the first widget to be removed from the page would cancel the
 * request its nine siblings are still waiting on, and the defect would look like a
 * network failure that only happens on a dashboard.
 */
function leaveRequest(host) {
  const entry = host._remoteEntry;
  host._remoteEntry = null;
  if (!entry) return;
  entry.hosts.delete(host);
  if (entry.hosts.size === 0 && entry.controller) entry.controller.abort();
}

/**
 * Ask for `src`, and report whether the host is waiting on it.
 *
 * `fields` are the attributes the payload may feed, in the order the component
 * prefers them. Reads nothing and writes nothing the component paints — the
 * values come back through `remoteData`.
 */
export function loadRemote(host, fields) {
  const src = host.getAttribute("src");
  if (!src) {
    leaveRequest(host);
    setStatus(host, host._remoteData !== undefined ? "ready" : "idle");
    return;
  }
  remoteRefresh(host);
  const wanted = typeof fields === "string" ? [fields] : fields;
  // An authored attribute wins outright: the component must not fetch over the top
  // of markup the author wrote.
  if (wanted.every((f) => host.getAttribute(f) !== null)) {
    leaveRequest(host);
    setStatus(host, "ready");
    return;
  }
  // A host below the fold must not compete with the forty above it for the same
  // connection. It reports `loading` while it waits, because that is what it is —
  // painting "No data" here would claim an empty dataset for data that has not
  // been asked for yet.
  if (!remoteVisible(host)) {
    setStatus(host, "loading");
    return;
  }
  const cached = remoteCache.get(src);
  if (cached !== undefined) {
    host._remoteSrc = src;
    host._remoteData = cached;
    setStatus(host, "ready");
    return;
  }
  // Already asked: a host still waiting, or one whose last ask settled in
  // error, must not re-ask on its own. The retry button (wireStates) and the
  // refresh timer are the only re-askers, and both clear `_remoteSrc` first —
  // without this guard, an errored host re-fetched on every settle's re-render,
  // so a permanent 404 looped forever painting `loading`, and a flaky endpoint
  // "recovered" to rows without the user ever clicking retry (both measured by
  // the state-contract arm in wc-contract, which is the first lane to mount src).
  if (host._remoteSrc === src && (host._remoteStatus === "loading" || host._remoteStatus === "error")) return; // already asked

  leaveRequest(host);
  host._remoteSrc = src;
  setStatus(host, "loading");

  let entry = remoteInflight.get(src);
  if (!entry) {
    entry = { hosts: new Set(), controller: new AbortController() };
    remoteInflight.set(src, entry);
    // All three arguments: `host` carries the timeout attribute and owns the
    // disposer, `src` is the URL to ask, `entry` holds the shared controller.
    // Dropping `host` (as the call did between 8cde6ba and 566b85a) shifts
    // `entry` into its slot, so `host.getAttribute` runs against the URL
    // string and every fetch throws before it starts — caught by the
    // state-contract arm in wc-contract, which is the first lane to mount src.
    entry.promise = startFetch(host, src, entry).then(
      (data) => {
        if (remoteInflight.get(src) === entry) remoteInflight.delete(src);
        cacheResult(src, data);
        for (const h of entry.hosts) {
          h._remoteData = data;
          h._remoteEntry = null;
          setStatus(h, "ready");
          emitState(h, "contour:load", { src, count: countOf(data) });
        }
      },
      (err) => {
        if (remoteInflight.get(src) === entry) remoteInflight.delete(src);
        for (const h of entry.hosts) {
          h._remoteEntry = null;
          setStatus(h, "error");
          h._remoteError = err && err.name === "HttpError" ? `Could not load (${err.status})` : STATE_FALLBACK.error;
          emitState(h, "contour:error", {
            src,
            message: h._remoteError,
            name: err && err.name,
            status: err && err.status,
          });
        }
      }
    ).finally(() => {
      for (const h of entry.hosts) if (h.isConnected) h.requestRender();
      entry.hosts.clear();
    });
  }
  entry.hosts.add(host);
  host._remoteEntry = entry;
  // Leaving the page is not failing the request; the host simply stops caring.
  // Registered once per mount, because `loadRemote` runs from `render()` and a
  // disposers list that grows with the render count is the leak this file exists
  // to stop. The flag is cleared inside the disposer, so a reconnect re-registers.
  if (!host._remoteDisposeRegistered) {
    host._remoteDisposeRegistered = true;
    onDispose(host, () => {
      host._remoteDisposeRegistered = false;
      leaveRequest(host);
    });
  }
}

// `AbortSignal.timeout` is the platform's own deadline; where it is missing, the
// same thing is a timer and an abort. Either way an unreachable internal tile
// server cannot leave a widget in `loading` for the life of the page.
function startFetch(host, src, entry) {
  const ms = parseInt(host.getAttribute("timeout") || "", 10);
  let timer = null;
  let signal = entry.controller.signal;
  if (Number.isFinite(ms) && ms > 0) {
    if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
      // `AbortSignal.any` needs no guard: it ships with `AbortSignal.timeout`, and
      // a host on an engine without the former has no use for the latter either.
      signal = AbortSignal.any([signal, AbortSignal.timeout(ms)]);
    } else {
      timer = setTimeout(() => entry.controller.abort(), ms);
    }
  }
  // The deadline belongs to the request, so the last host out already aborts it;
  // the timer is cleared on any settle so a cached answer costs nothing later.
  onDispose(host, () => { if (timer) clearTimeout(timer); });

  return fetch(src, { signal })
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
 * The return is always the string the render body already parses, so adopting this
 * changes no component's parsing.
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

/**
 * `refresh="<seconds>"`: revalidate the source on a timer. The loop pauses while
 * the tab is hidden and stops when the host leaves the page, because a dashboard
 * left open in a background tab is the common way a design system becomes the
 * reason a laptop is warm.
 *
 * Registered once per mount: `remoteRefresh` is called from `render()`, and a
 * timer scheduled here fires and clears `_remoteTimer`, so the guard has to be a
 * flag that survives the tick or every re-render adds another loop.
 */
export function remoteRefresh(host) {
  const seconds = parseFloat(host.getAttribute("refresh") || "");
  const want = host.hasAttribute("src") && Number.isFinite(seconds) && seconds > 0;
  if (!want) {
    if (host._remoteTimer !== undefined) { clearTimeout(host._remoteTimer); host._remoteTimer = undefined; }
    return;
  }
  if (host._remoteLoop) return;
  host._remoteLoop = true;
  const tick = () => {
    host._remoteTimer = undefined;
    if (!host.isConnected || !host.hasAttribute("refresh")) { host._remoteLoop = false; return; }
    if (document.hidden) { host._remoteTimer = setTimeout(tick, 1000); return; }
    const src = host.getAttribute("src");
    remoteCache.delete(src);
    host._remoteSrc = null;
    host._remoteLoop = false;
    host.requestRender();
  };
  host._remoteTimer = setTimeout(tick, Math.max(1000, seconds * 1000));
  onDispose(host, () => {
    clearTimeout(host._remoteTimer);
    host._remoteTimer = undefined;
    host._remoteLoop = false;
  });
}

// `loading="lazy"` belongs to the markup, not to the platform: an element below
// the fold must not compete with the forty above it. Where IntersectionObserver
// is missing the host simply asks, which is the honest fallback rather than never
// asking at all.
export function remoteVisible(host) {
  if (!host.hasAttribute("lazy")) return true;
  if (typeof IntersectionObserver !== "function") return true;
  if (host._remoteVisible) return true;
  const io = new IntersectionObserver((records) => {
    if (!records.some((r) => r.isIntersecting)) return;
    io.disconnect();
    host._remoteVisible = true;
    host.requestRender();
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
// It also carries `data-contour-state`, the only new hook here. The error state has
// to read as a failure, but the per-block rules group `__error` with `__empty` and
// `__loading` as muted text, so a failure looks exactly like a placeholder that
// simply has not arrived yet. Colouring it by name would mean editing 34 rules in
// the four sheets another writer is landing changes into; one rule on this
// attribute does it, and an attribute is a host-set input rather than a published
// class — no specimen, no inventory entry, nothing to deprecate.
function stateNode(block, kind, text) {
  const node = document.createElement("div");
  node.className = "c-" + block + "__" + kind;
  node.dataset.contourState = kind;
  node.textContent = text;
  return node;
}

function skeletonRow(i, total) {
  // The system's own skeleton block and its own modifiers: `--title` for the first
  // line so a placeholder has a shape instead of a uniform stack of bars, `--text`
  // for the rest. No per-block name is invented here, which is how the 33
  // undefined `c-*__skeleton` classes stop being generated at all.
  const node = document.createElement("div");
  node.className = "c-skeleton " + (i === 0 && total > 1 ? "c-skeleton--title" : "c-skeleton--text");
  node.dataset.contourState = "skeleton";
  return node;
}

/**
 * Paint the host's data state, if it has one. Returns true when a state took over
 * the render, so the caller returns before building content it would discard.
 *
 * The order is deliberate: `loading` (attribute or open request) wins over `error`,
 * because a retry in flight is not a failure, and either wins over `skeleton`,
 * which is a placeholder for a state the host may already be in.
 */
export function renderStates(host, block, opts) {
  const options = opts || {};
  const loading = host.getAttribute("loading");
  if (loading !== null || host._remoteStatus === "loading") {
    host.appendChild(stateNode(block, "loading", loading || STATE_FALLBACK.loading));
    return true;
  }
  const error = host.getAttribute("error");
  if (error !== null || host._remoteStatus === "error") {
    const message = (error !== null && error !== "") ? error : (host._remoteError || STATE_FALLBACK.error);
    const node = stateNode(block, "error", message);
    // `retry` is the actionable half of an error. It reuses the button the system
    // already ships and the `contour:retry` event three components already emit,
    // rather than inventing a control for the same job.
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
  host.appendChild(stateNode(block, "empty", host.getAttribute("empty") || STATE_FALLBACK.empty));
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
    leaveRequest(host);
    host._remoteSrc = null;
    host._remoteData = undefined;
    setStatus(host, "idle");
    emitState(host, "contour:retry", { src });
    host.requestRender();
  });
}
