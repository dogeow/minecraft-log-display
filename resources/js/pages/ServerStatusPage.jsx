import { useTheme } from "../contexts/ThemeContext";
import SkyBackground from "../components/SkyBackground";
import SkyDecoration from "../components/SkyDecoration";
import GrassFooter from "../components/GrassFooter";
import PlayerGrid from "../components/server-status/PlayerGrid";
import ServerOverview from "../components/server-status/ServerOverview";
import StatusNotices from "../components/server-status/StatusNotices";

export default function ServerStatusPage({ serverStatus }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (!serverStatus) return null;

  return (
    <div className="mc-status-page">
      <SkyBackground isDark={isDark} />
      <main className="mc-world-stage">
        <SkyDecoration isDark={isDark} onToggle={toggleTheme} />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-44 pt-24 sm:px-6">
          <ServerOverview serverStatus={serverStatus} />
          <StatusNotices serverStatus={serverStatus} />
          <PlayerGrid players={serverStatus.players} />
        </div>
      </main>

      <GrassFooter players={serverStatus.players} />
    </div>
  );
}
