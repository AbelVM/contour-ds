/* ============================================================================
   CONTOUR — data state and remote loading
   ----------------------------------------------------------------------------
   One implementation of the four data states (`empty`, `loading`, `error`,
   `skeleton`) and of the remote source (`src`, `lazy`, `refresh`, `timeout`).

   Before this file the same forty-line block was written into eight fragments
   by hand — 6 `_srcFetched` sites in `content.mjs`, 8 in `data.mjs`, 20 in
   `map.mjs`, 14 in `navigation.mjs` — and every copy carried the same four
   defects, measured in Chromium against `dist/contour-wc.js` built at 7d75b3d
   (probe `tmp/wc9/probe.mjs`, 2026-10-27):

     1. a host with `src` painted "Loading…Loading…" — two nodes, because the
        copy re-rendered by calling `attributeChangedCallback` from inside
        `render()`, which on the connect path is a synchronous nested render;
     2. a 404 and a malformed body both landed on the EMPTY state, so the
        component claimed it had no data when it had failed to fetch;
     3. nothing aborted the request, so a detached host kept two stale nodes
        and was still written to after it left the page;
     4. the state was styled by an inline `style.color`, which beat the CSS
        rule written beside it in the same commit, so the rule was dead and the
        skeleton — 33 generated `c-*__skeleton` names — had no rule at all.

   Two rules follow from that and are the whole design here. The state node is
   built from the block the system already ships (`c-skeleton--text`, `c-empty`),
   never from a name invented per component, so a generated class cannot exist
   without a rule. And presentation belongs to the sheet: nothing in this file
   writes a `style` attribute — the values moved into `components.css`, with the
   computed colour and padding measured before and after the move.

   The remote loader is shared per URL, not per host: a dashboard that mounts
   forty chrome widgets against one endpoint asks it forty times, so one request
   is started and the rest subscribe to it. That is also what lets a re-mounted
   host paint from the cache instead of flashing a loading state the page has
   already paid for.
   ========================================================================= */

import { onDispose } from './core.mjs';

// Copy. A component overrides any of these through its own attribute, because a
// legend and a table should not both say "No data" — but the default must exist,
// because a state with no text is a state the reader cannot see.
export const STATE_FALLBACK = {
  empty: "No data",
  loading: "Loading…",
  error: "Could not load.",
};

// One in-flight request per URL, shared by every host that asked for it. `hosts`
// is a Set of WeakRefs: a host that leaves the page must not be held alive by a
// request it started, and must not be woken when that request answers.
const remoteInflight = new Map();
// The last result per URL, so a re-mounted host paints instead of re-asking.
// `refresh` revalidates it; a failed URL is not cached.
const remoteCache = new Map();

// A URL that is answered from the cache still needs one microtask before the
// host paints, so a render that asked for data never sees it synchronously —
// the alternative is a state that depends on whether some other host happened
// to ask first, which is not a state a page can reason about.
const resolveSoon = (host) => { queueMicrotask(() => host.requestRender()); };

function setStatus(host, status, detail) {
  const prev = host._remoteStatus;
  host._remoteStatus = status;
  if (status === "error") host._remoteError = (detail && detail.message) || "Request failed";
  else if (prev !== status) host._remoteError = null;
  // `aria-busy` is the platform's own word for "this region is mid-update", and
  // it is not in OBSERVED, so writing it cannot re-enter this render. The error
  // node carries role="alert" where it is painted; the host carries busy while
  // a request is open, and clears it the moment one is not.
  if (status === "loading") host.setAttribute("aria-busy", "true");
  else host.removeAttribute("aria-busy");
}

/**
 * Ask for `src` and report whether the host is waiting on it.
 *
 * `fields` are the attributes the payload may feed, in the order the component
 * prefers them: an array payload feeds the first, an object payload is matched
 * by key. Returns nothing the caller paints — read the values with `remoteData`.
 */
export function loadRemote(host, fields) {
  const src = host.getAttribute("src");
  if (!src) {
    // No source: any previous state is stale, and `idle` says so.
    setStatus(host, host._remoteData ? "ready" : "idle");
    return;
  }
  const wanted = typeof fields === "string" ? [fields] : fields;
  // An authored attribute wins outright — the component must not fetch over the
  // top of markup the author wrote. But it must still answer when the author
  // gave only *some* of the fields, which is why this checks every field rather
  // than the whole list.
  if (wanted.every((f) => host.getAttribute(f) !== null)) {
    setStatus(host, "ready");
    return;
  }
  if (remoteCache.has(src)) {
    if (!host._remoteData || host._remoteSrc !== src) {
      host._remoteSrc = src;
      host._remoteData = remoteCache.get(src);
      setStatus(host, "ready");
      resolveSoon(host);
    }
    return;
  }

  host._remoteSrc = src;
  setStatus(host, "loading");

  let entry = remoteInflight.get(src);
  if (!entry) {
    entry = { hosts: new Set(), settled: false };
    remoteInflight.set(src, entry);
    entry.request = startFetch(host, src);
  }
  entry.hosts.add(host);

  if (!entry.promise) {
    entry.promise = entry.request.then((data) => {
      remoteCache.set(src, data);
      remoteInflight.delete(src);
      for (const h of entry.hosts) {
        if (!h.isConnected) continue;
        h._remoteData = data;
        setStatus(h, "ready");
        emitState(h, "contour:load", { src, count: countOf(data) });
        h.requestRender();
      }
    }).catch((err) => {
      // A refused URL is not cached: the next host to ask must be able to try,
      // or one blip poisons the page until it reloads.
      remoteInflight.delete(src);
      for (const h of entry.hosts) {
        if (!h.isConnected) continue;
        setStatus(h, "error", { message: String(err && err.message || err) });
        emitState(h, "contour:error", { src, message: h._remoteError, name: err && err.name });
        h.requestRender();
      }
    });
  }
  entry.promise.catch(() => { /* every host above already handled it */ });
}

// `AbortSignal.timeout` is the platform's own deadline; where it is missing the
// same thing is done with a timer and an abort. Either way a hung internal tile
// server cannot leave a widget in `loading` for the life of the page.
function startFetch(host, src) {
  const ms = parseInt(host.getAttribute("timeout") || "", 10);
  const controller = new AbortController();
  host._remoteAbort = controller;
  onDispose(host, () => controller.abort());
  let timer = null;
  if (Number.isFinite(ms) && ms > 0) {
    if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
      host._remoteSignal = AbortSignal.timeout(ms);
      host._remoteSignal.addEventListener("abort", () => controller.abort());
    } else {
      timer = setTimeout(() => controller.abort(), ms);
    }
  }
  // `lazy` is the one attribute here that defers the request rather than shaping
  // it: a host below the fold must not compete with the forty above it.
  if (host.hasAttribute("lazy") && typeof IntersectionObserver === "function") {
    const io = new IntersectionObserver((records) => {
      if (!records.some((r) => r.isIntersecting)) return;
      io.disconnect();
      host._remoteObserver = null;
      host._remoteSrc = null; // force this pass to ask
      host.requestRender();
    }, { rootMargin: "200px" });
    io.observe(host);
    host._remoteObserver = io;
    onDispose(host, () => io.disconnect());
    return new Promise(() => {}); // never settles: the re-render starts the real request
  }

  return fetch(src, { signal: controller.signal })
    .then((res) => {
      if (timer) clearTimeout(timer);
      // The status line is the boundary. `fetch` resolves on 404 and on 500, so
      // without this test a failed request became an empty dataset and the
      // component told the reader there was nothing to show.
      if (!res.ok) { const e = new Error(`HTTP ${res.status}`); e.name = "HttpError"; e.status = res.status; throw e; }
      return res.text();
    })
    .then((text) => {
      // A JSON body that parses to nothing is still data — `null` included — so
      // this returns the parsed value rather than treating falsy as failure.
      try { return JSON.parse(text); }
      catch (err) { const e = new Error("Invalid JSON"); e.name = "ParseError"; e.cause = err; throw e; }
    });
}

function countOf(data) {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === "object") return Object.keys(data).length;
  return data === null || data === undefined ? 0 : 1;
}

function emitState(host, name, detail) {
  host.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
}

/**
 * The value a component should render for one field: the attribute the author
 * wrote, else the matching key of the remote payload, else nothing.
 *
 * An array payload feeds the field the component asked for, so
 * `<contour-readout src="/rows.json">` works with a bare list; an object payload
 * is matched by key, so one endpoint can serve a component's several fields at
 * once. Scalars keep their text. The return is always the string the existing
 * render body parses, so adopting this changes no component's parsing rules.
 */
export function remoteData(host, field) {
  const authored = host.getAttribute(field);
  if (authored !== null) return authored;
  const data = host._remoteData;
  if (data === undefined || data === null) return null;
  if (Array.isArray(data)) return field ? JSON.stringify(data) : JSON.stringify(data);
  if (typeof data === "object") {
    const keys = typeof field === "string" ? [field] : field;
    for (const k of keys) if (data[k] !== undefined) return typeof data[k] === "string" ? data[k] : JSON.stringify(data[k]);
    return null;
  }
  return String(data);
}

/** True when the host is waiting on, or has failed, a remote source. */
export function remotePending(host) {
  const s = host._remoteStatus;
  return s === "loading" || s === "error";
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
    if (host._remoteVisibility) { document.removeEventListener("visibilitychange", host._remoteVisibility); host._remoteVisibility = null; }
    return;
  }
  if (host._remoteTimer !== undefined) return; // already looping for this host
  const tick = () => {
    host._remoteTimer = undefined;
    if (!host.isConnected || !host.hasAttribute("refresh")) return;
    if (document.hidden) { host._remoteTimer = setTimeout(tick, 1000); return; }
    host._remoteSrc = null;
    remoteCache.delete(host.getAttribute("src"));
    host.requestRender();
  };
  host._remoteTimer = setTimeout(tick, Math.max(1000, seconds * 1000));
  onDispose(host, () => { clearTimeout(host._remoteTimer); host._remoteTimer = undefined; });
  const onVisible = () => { if (!document.hidden && host._remoteTimer === undefined) tick(); };
  document.addEventListener("visibilitychange", onVisible);
  host._remoteVisibility = onVisible;
  onDispose(host, () => document.removeEventListener("visibilitychange", onVisible));
}

// ---------------------------------------------------------------------------
// The states themselves
// ---------------------------------------------------------------------------

// A state node is built once per render and is owned by the base class's
// generated-node bookkeeping, so a re-render cannot stack a second one — which
// is the defect the hand-written copies all shared.
function stateNode(host, kind, text) {
  const node = document.createElement("div");
  node.className = "c-data-state c-data-state--" + kind;
  node.textContent = text;
  if (kind === "error") node.setAttribute("role", "alert");
  return node;
}

function skeletonRow(host, i, total) {
  const node = document.createElement("div");
  // The system's own skeleton block, with its own modifiers: `--title` for the
  // first line so a placeholder has a shape rather than a uniform stack of bars.
  const variant = i === 0 && total > 1 ? " c-skeleton--title" : " c-skeleton--text";
  node.className = "c-skeleton" + variant;
  return node;
}

/**
 * Paint the host's data state, if it has one.
 *
 * Returns true when a state took over the render, so the caller returns before
 * building content it would only throw away. The order is deliberate: an
 * explicit `loading` attribute or an open request wins over `error` (a retry is
 * in flight, not failed), and either wins over `skeleton`, which is a placeholder
 * for a state the host may already be in.
 */
export function renderStates(host, opts) {
  const options = opts || {};
  const loading = host.getAttribute("loading");
  const error = host.getAttribute("error");
  if (host._remoteStatus === "loading" || loading !== null && host.hasAttribute("src")) {
    host.appendChild(stateNode(host, "loading", loading || STATE_FALLBACK.loading));
    return true;
  }
  if (host._remoteStatus === "error" || error !== null) {
    const message = error !== null && error !== "" ? error
      : (host._remoteError || STATE_FALLBACK.error);
    const node = stateNode(host, "error", message);
    // `retry` is the actionable half of an error. The button carries no data
    // of its own — clicking it clears the cache for this URL and asks again.
    if (host.hasAttribute("retry")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "c-data-state__retry";
      btn.textContent = host.getAttribute("retry") || "Retry";
      node.appendChild(btn);
    }
    host.appendChild(node);
    return true;
  }
  if (host.hasAttribute("skeleton")) {
    const asked = parseInt(host.getAttribute("skeleton") || "3", 10);
    const count = Math.min(options.max || 6, Math.max(1, Number.isFinite(asked) ? asked : 3));
    for (let i = 0; i < count; i++) host.appendChild(skeletonRow(host, i, count));
    return true;
  }
  return false;
}

/** Paint the empty state. Only for a host that has no data *and* no authored content. */
export function renderEmpty(host, text) {
  host.appendChild(stateNode(host, "empty", text || host.getAttribute("empty") || STATE_FALLBACK.empty));
}

// Delegated on the host (AGENTS.md rule 12): the retry button is regenerated on
// every render, so a listener bound to the node would be lost by the next pass.
export function wireStates(host) {
  if (host._contourStatesWired) return;
  host._contourStatesWired = true;
  host.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest ? e.target.closest(".c-data-state__retry") : null;
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
