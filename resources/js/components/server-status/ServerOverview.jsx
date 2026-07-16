import LatencyIndicator from "./LatencyIndicator";

export default function ServerOverview({ serverStatus }) {
  const isOnline = serverStatus.is_online;
  const softwareLabel = [serverStatus.server_flavor, serverStatus.software]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      className={`mc-server-panel ${isOnline ? "mc-server-panel--online" : "mc-server-panel--offline"}`}
      aria-label="Minecraft 服务器状态"
    >
      <header className="mc-server-panel__header">
        <div className="mc-server-panel__eyebrow">
          <span className="mc-status-pixel" aria-hidden="true" />
          世界状态
        </div>
        <div className="mc-server-version">{serverStatus.version}</div>
      </header>

      <div className="mc-server-panel__body">
        <div className="mc-server-icon">
          {serverStatus.favicon ? (
            <img src={serverStatus.favicon} alt="服务器图标" />
          ) : (
            <span aria-label="没有服务器图标">?</span>
          )}
        </div>

        <div className="mc-server-copy">
          <div className="mc-server-state">
            {isOnline ? "世界可进入" : "世界暂时不可进入"}
          </div>
          <h1
            className="mc-server-name"
            dangerouslySetInnerHTML={{ __html: serverStatus.motd_html }}
          />
          <div className="mc-server-endpoint">
            <span>{serverStatus.display_subtitle}</span>
            <span aria-hidden="true">•</span>
            <span>{serverStatus.endpoint}</span>
          </div>
        </div>

        <div className="mc-server-connection">
          <LatencyIndicator
            latency={serverStatus.ping_latency_ms}
            isOnline={isOnline}
          />
          <div className="mc-player-count" aria-label="在线玩家">
            <strong>
              {serverStatus.online_players} / {serverStatus.max_players}
            </strong>
            <span>在线玩家</span>
          </div>
        </div>
      </div>

      <footer className="mc-server-panel__footer">
        <span>{softwareLabel || "未知服务端"}</span>
        <span>探测用时 {serverStatus.timer} 秒</span>
      </footer>
    </section>
  );
}
