import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { startStatusUpdates } from "../../resources/js/lib/statusUpdates";

const config = {
  enabled: true,
  key: "test-public-key",
  host: "mc.example.test",
  port: 443,
  scheme: "https",
};
let cleanup;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1000000);
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: true,
  });
});
afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  vi.useRealTimers();
});

async function setup(options = {}) {
  let callbacks;
  const refresh = vi.fn().mockResolvedValue(undefined);
  const onState = vi.fn();
  const client = { disconnect: vi.fn(), reconnect: vi.fn() };
  const createTransport = vi.fn(async (_, handlers) => {
    callbacks = handlers;
    return client;
  });
  cleanup = startStatusUpdates({
    config,
    refresh,
    onState,
    createTransport,
    ...options,
  });
  await vi.advanceTimersByTimeAsync(0);
  return {
    refresh,
    onState,
    client,
    createTransport,
    get callbacks() {
      return callbacks;
    },
  };
}
function visibility(value) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

it("coalesces connection and message bursts, ignores duplicates and refetches on reconnect", async () => {
  const service = await setup();
  service.callbacks.ready();
  service.callbacks.invalidated("one");
  service.callbacks.invalidated("two");
  await vi.advanceTimersByTimeAsync(250);
  expect(service.refresh).toHaveBeenCalledTimes(1);
  service.callbacks.invalidated("two");
  await vi.advanceTimersByTimeAsync(5000);
  expect(service.refresh).toHaveBeenCalledTimes(1);
  service.callbacks.disconnected("unavailable");
  service.callbacks.ready();
  await vi.advanceTimersByTimeAsync(250);
  expect(service.refresh).toHaveBeenCalledTimes(2);
});

it("does not race in-flight refreshes and retains one trailing update", async () => {
  let complete;
  const refresh = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    )
    .mockResolvedValue(undefined);
  const service = await setup({ refresh });
  service.callbacks.ready();
  await vi.advanceTimersByTimeAsync(250);
  service.callbacks.invalidated("newer");
  service.callbacks.invalidated("newest");
  await vi.advanceTimersByTimeAsync(6000);
  expect(refresh).toHaveBeenCalledTimes(1);
  complete();
  await vi.advanceTimersByTimeAsync(250);
  expect(refresh).toHaveBeenCalledTimes(2);
});

it("uses a quiet one-minute fallback when unconfigured or connection fails", async () => {
  const service = await setup({ config: { enabled: false } });
  expect(service.createTransport).not.toHaveBeenCalled();
  expect(service.onState).toHaveBeenLastCalledWith("fallback");
  await vi.advanceTimersByTimeAsync(60250);
  expect(service.refresh).toHaveBeenCalledTimes(1);
});

it("recovers from a transport initialization failure without leaking unhandled errors", async () => {
  const createTransport = vi.fn().mockRejectedValue(new Error("unavailable"));
  const service = await setup({ createTransport });
  expect(service.onState).toHaveBeenLastCalledWith("fallback");
  await vi.advanceTimersByTimeAsync(60250);
  expect(service.refresh).toHaveBeenCalledTimes(1);
  expect(createTransport).toHaveBeenCalledTimes(2);
});

it("closes the socket and stops requests while hidden, then catches up on return", async () => {
  const service = await setup();
  service.callbacks.ready();
  visibility("hidden");
  await vi.advanceTimersByTimeAsync(180000);
  expect(service.refresh).not.toHaveBeenCalled();
  expect(service.client.disconnect).toHaveBeenCalledTimes(1);
  visibility("visible");
  await vi.advanceTimersByTimeAsync(250);
  expect(service.createTransport).toHaveBeenCalledTimes(2);
  expect(service.refresh).toHaveBeenCalledTimes(1);
});

it("pauses while offline, resumes online, and disconnects late clients after unmount", async () => {
  const service = await setup();
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: false,
  });
  window.dispatchEvent(new Event("offline"));
  await vi.advanceTimersByTimeAsync(120000);
  expect(service.refresh).not.toHaveBeenCalled();
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: true,
  });
  window.dispatchEvent(new Event("online"));
  await vi.advanceTimersByTimeAsync(250);
  expect(service.refresh).toHaveBeenCalledTimes(1);
  cleanup();
  let resolve;
  const client = { disconnect: vi.fn() };
  await setup({
    createTransport: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  cleanup();
  resolve(client);
  await vi.advanceTimersByTimeAsync(0);
  expect(client.disconnect).toHaveBeenCalledTimes(1);
});

it("falls back if the socket stays connected but publisher heartbeats stop", async () => {
  const service = await setup();
  service.callbacks.ready();
  await vi.advanceTimersByTimeAsync(60250);
  expect(service.refresh).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(60000);
  expect(service.refresh).toHaveBeenCalledTimes(2);
  expect(service.onState).toHaveBeenLastCalledWith("fallback");
  service.callbacks.invalidated("recovered");
  expect(service.onState).toHaveBeenLastCalledWith("live");
});

it("never opens insecure WS from an HTTPS page", async () => {
  const browser = {
    location: { protocol: "https:" },
    navigator: { onLine: true },
    setTimeout: window.setTimeout.bind(window),
    clearTimeout: window.clearTimeout.bind(window),
    addEventListener: window.addEventListener.bind(window),
    removeEventListener: window.removeEventListener.bind(window),
  };
  const service = await setup({
    config: { ...config, scheme: "http", port: 80 },
    browser,
  });
  expect(service.createTransport).not.toHaveBeenCalled();
  expect(service.onState).toHaveBeenLastCalledWith("fallback");
});

it("does not connect when initially hidden or process events after cleanup", async () => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "hidden",
  });
  const service = await setup();
  await vi.advanceTimersByTimeAsync(180000);
  expect(service.createTransport).not.toHaveBeenCalled();
  expect(service.refresh).not.toHaveBeenCalled();
  visibility("visible");
  await vi.advanceTimersByTimeAsync(0);
  const callbacks = service.callbacks;
  cleanup();
  callbacks.ready();
  callbacks.invalidated("too-late");
  await vi.advanceTimersByTimeAsync(60000);
  expect(service.refresh).not.toHaveBeenCalled();
});
