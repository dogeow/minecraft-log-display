// Reverb speaks the Pusher protocol; no hosted Pusher service is contacted.
export async function createStatusTransport(config, callbacks) {
  const [{ default: Echo }, { default: Pusher }] = await Promise.all([
    import("laravel-echo"),
    import("pusher-js"),
  ]);
  const echo = new Echo({
    broadcaster: "reverb",
    Pusher,
    key: config.key,
    wsHost: config.host,
    wsPort: Number(config.port),
    wssPort: Number(config.port),
    forceTLS: config.scheme === "https",
    enabledTransports: ["ws", "wss"],
    disableStats: true,
  });
  const connection = echo.connector.pusher.connection;
  const stateChanged = ({ current }) => {
    if (current !== "connected") callbacks.disconnected(current);
  };
  connection.bind("state_change", stateChanged);
  echo
    .channel("minecraft.status")
    .subscribed(callbacks.ready)
    .error(() => callbacks.disconnected("failed"))
    .listen(".status.changed", (payload) => {
      const revision = payload?.revision;
      if (
        typeof revision === "string" &&
        revision.length > 0 &&
        revision.length <= 64
      ) {
        callbacks.invalidated(revision);
      }
    });

  return {
    reconnect: () => echo.connector.pusher.connect(),
    disconnect: () => {
      connection.unbind("state_change", stateChanged);
      echo.leaveChannel("minecraft.status");
      echo.disconnect();
    },
  };
}
