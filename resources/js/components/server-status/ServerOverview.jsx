import LatencyIndicator from "./LatencyIndicator";

export default function ServerOverview({ serverStatus, updates }) {
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
            <span role="img" aria-label="没有服务器图标">
              ?
            </span>
          )}
        </div>

        <div className="mc-server-copy">
          <h1
            className="mc-server-name"
            dangerouslySetInnerHTML={
              serverStatus.motd_html
                ? { __html: serverStatus.motd_html }
                : undefined
            }
          >
            {!serverStatus.motd_html
              ? serverStatus.display_name || "Minecraft 服务器"
              : null}
          </h1>
        </div>

        <div className="mc-server-connection">
          <LatencyIndicator
            latency={serverStatus.ping_latency_ms}
            isOnline={isOnline}
          />
          <div className="mc-player-count">
            <strong>
              {serverStatus.online_players} / {serverStatus.max_players}
            </strong>
            <span>在线玩家</span>
          </div>
        </div>
      </div>

      <footer className="mc-server-panel__footer">
        <span>{softwareLabel || "未知服务端"}</span>
        <span className="mc-update-status" role="status">
          {updates?.error
            ? "更新失败，显示上次状态"
            : updates?.mode === "live"
              ? "实时更新"
              : updates?.mode === "connecting"
                ? "实时连接中"
                : updates?.mode === "paused"
                  ? "更新已暂停"
                  : "自动更新 · 每分钟"}
        </span>
        <span>探测用时 {serverStatus.timer} 秒</span>
      </footer>
    </section>
  );
}
