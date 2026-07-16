export default function StatusNotices({ serverStatus }) {
  if (!serverStatus.is_online) {
    return (
      <div className="mc-notice mc-notice--offline" role="status">
        <span className="mc-notice__icon" aria-hidden="true">
          !
        </span>
        <div>
          <strong>服务器暂时离线</strong>
          <p>无法进入这个世界。请确认 Minecraft 服务已启动后再刷新页面。</p>
        </div>
      </div>
    );
  }

  if (serverStatus.query_unavailable) {
    return (
      <div className="mc-notice mc-notice--warning" role="status">
        <span className="mc-notice__icon" aria-hidden="true">
          !
        </span>
        <div>
          <strong>世界在线，详细信息暂不可用</strong>
          <p>Query 未响应，玩家列表、服务端类型等字段可能不完整。</p>
        </div>
      </div>
    );
  }

  const uniqueErrors = [...new Set(serverStatus.errors ?? [])];

  if (uniqueErrors.length === 0) return null;

  return (
    <div className="mc-notice mc-notice--warning" role="status">
      <span className="mc-notice__icon" aria-hidden="true">
        !
      </span>
      <div>
        <strong>部分状态获取失败</strong>
        <p>{uniqueErrors.join("；")}</p>
      </div>
    </div>
  );
}
