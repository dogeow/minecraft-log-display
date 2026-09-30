import { createStatusTransport } from "./statusTransport";

export function startStatusUpdates({
  refresh,
  config = {},
  onState = () => {},
  createTransport = createStatusTransport,
  page = document,
  browser = window,
  now = () => Date.now(),
}) {
  const fallbackMs = Math.max(60000, Number(config.fallbackMs) || 60000);
  const configured = Boolean(
    config.enabled &&
    config.key &&
    config.host &&
    ["http", "https"].includes(config.scheme) &&
    Number(config.port) > 0 &&
    Number(config.port) <= 65535 &&
    !(browser.location?.protocol === "https:" && config.scheme !== "https"),
  );
  let stopped = false;
  let generation = 0;
  let transport = null;
  let connecting = false;
  let live = false;
  let needsReconnect = false;
  let refreshTimer = null;
  let fallbackTimer = null;
  let inFlight = false;
  let dirty = false;
  let lastRefreshAt = -Infinity;
  let lastMessageAt = 0;
  let lastRevision = null;
  const visible = () =>
    !stopped &&
    page.visibilityState !== "hidden" &&
    browser.navigator.onLine !== false;
  const state = (mode) => {
    if (!stopped) onState(mode);
  };

  function requestRefresh() {
    dirty = true;
    if (!visible() || inFlight || refreshTimer !== null) return;
    // Collapse event bursts and avoid racing an in-flight revalidation.
    const delay = Math.max(250, 5000 - (now() - lastRefreshAt));
    refreshTimer = browser.setTimeout(async () => {
      refreshTimer = null;
      if (!visible()) return;
      dirty = false;
      inFlight = true;
      lastRefreshAt = now();
      try {
        await refresh();
      } catch {
        /* SWR exposes the request error in the existing UI. */
      } finally {
        inFlight = false;
        if (dirty && !stopped) requestRefresh();
      }
    }, delay);
  }

  function connect() {
    if (!configured || !visible() || connecting || transport) return;
    const current = generation;
    connecting = true;
    state("connecting");
    const active = () => !stopped && current === generation && visible();
    Promise.resolve()
      .then(() =>
        createTransport(config, {
          ready() {
            if (!active()) return;
            live = true;
            needsReconnect = false;
            lastMessageAt = now();
            state("live");
            requestRefresh();
          },
          disconnected(reason) {
            if (!active()) return;
            live = false;
            needsReconnect = reason === "failed" || reason === "disconnected";
            state("fallback");
          },
          invalidated(revision) {
            if (!active()) return;
            live = true;
            lastMessageAt = now();
            state("live");
            if (revision === lastRevision) return;
            lastRevision = revision;
            requestRefresh();
          },
        }),
      )
      .then((client) => {
        if (!active()) client.disconnect();
        else {
          transport = client;
          connecting = false;
        }
      })
      .catch(() => {
        if (!active()) return;
        connecting = false;
        state("fallback");
      });
  }

  function armFallback() {
    if (!visible() || fallbackTimer !== null) return;
    fallbackTimer = browser.setTimeout(() => {
      fallbackTimer = null;
      if (!visible()) return;
      // Also recover when a socket is connected but the publisher/heartbeat stopped.
      if (!live || now() - lastMessageAt > 90000) {
        state("fallback");
        requestRefresh();
        if (needsReconnect) transport?.reconnect();
        if (!transport) connect();
      }
      armFallback();
    }, fallbackMs);
  }

  function suspend() {
    generation++;
    const previous = transport;
    transport = null;
    connecting = false;
    live = false;
    dirty = true;
    if (refreshTimer !== null) browser.clearTimeout(refreshTimer);
    if (fallbackTimer !== null) browser.clearTimeout(fallbackTimer);
    refreshTimer = fallbackTimer = null;
    previous?.disconnect();
    state("paused");
  }

  function resume() {
    if (!visible()) {
      suspend();
      return;
    }
    state(live ? "live" : configured ? "connecting" : "fallback");
    connect();
    armFallback();
    requestRefresh();
  }

  page.addEventListener("visibilitychange", resume);
  browser.addEventListener("online", resume);
  browser.addEventListener("offline", suspend);
  if (visible()) {
    state(configured ? "connecting" : "fallback");
    connect();
    armFallback();
  } else state("paused");

  return () => {
    stopped = true;
    suspend();
    page.removeEventListener("visibilitychange", resume);
    browser.removeEventListener("online", resume);
    browser.removeEventListener("offline", suspend);
  };
}
