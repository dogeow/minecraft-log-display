import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import { appConfig } from "../lib/appConfig";
import { startStatusUpdates } from "../lib/statusUpdates";

export default function useServerStatusUpdates(active) {
  const { mutate } = useSWRConfig();
  const [mode, setMode] = useState("fallback");
  useEffect(() => {
    if (!active) return;
    return startStatusUpdates({
      config: appConfig.realtime,
      refresh: () => mutate("/api/server-status"),
      onState: setMode,
    });
  }, [active, mutate]);
  return mode;
}
