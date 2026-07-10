import { useTheme } from "../contexts/ThemeContext";
import SkyBackground from "../components/SkyBackground";
import SkyDecoration from "../components/SkyDecoration";
import GrassFooter from "../components/GrassFooter";
import PlayerGrid from "../components/server-status/PlayerGrid";
import ServerOverview from "../components/server-status/ServerOverview";
import StatusNotices from "../components/server-status/StatusNotices";
import useLatency from "../hooks/useLatency";

export default function ServerStatusPage({ serverStatus }) {
  const { theme, toggleTheme } = useTheme();
  const latency = useLatency();
  const isDark = theme === "dark";

  if (!serverStatus) return null;

  return (
    <>
      <SkyBackground isDark={isDark} />
      <div className="relative container mx-auto p-2 pt-6">
        <ServerOverview
          serverStatus={serverStatus}
          latency={latency}
          isDark={isDark}
        />

        <SkyDecoration isDark={isDark} onToggle={toggleTheme} />
        <StatusNotices serverStatus={serverStatus} isDark={isDark} />
        <PlayerGrid players={serverStatus.players} isDark={isDark} />
      </div>

      <GrassFooter players={serverStatus.players} />
    </>
  );
}
