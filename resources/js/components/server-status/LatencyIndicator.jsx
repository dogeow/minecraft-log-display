function barsForLatency(milliseconds, isOnline) {
  if (!isOnline || !Number.isFinite(milliseconds)) return 0;
  if (milliseconds < 80) return 5;
  if (milliseconds < 150) return 4;
  if (milliseconds < 300) return 3;
  if (milliseconds < 600) return 2;
  return 1;
}

export default function LatencyIndicator({ latency, isOnline }) {
  const activeBars = barsForLatency(latency, isOnline);
  const label = isOnline
    ? Number.isFinite(latency)
      ? `Minecraft 服务器延迟 ${latency} 毫秒`
      : "Minecraft 服务器在线，延迟未知"
    : "Minecraft 服务器离线，无信号";

  return (
    <div
      className={`mc-signal ${isOnline ? "mc-signal--online" : "mc-signal--offline"}`}
      aria-label={label}
      title={label}
      data-online={isOnline ? "true" : "false"}
    >
      <div className="mc-signal__bars" aria-hidden="true">
        {[5, 8, 11, 14, 17].map((height, index) => (
          <span
            key={height}
            className={`mc-signal__bar ${index < activeBars ? "mc-signal__bar--active" : ""}`}
            style={{ height: `${height}px` }}
          />
        ))}
        {!isOnline && <span className="mc-signal__cross">×</span>}
      </div>
      <span className="mc-signal__label">
        {isOnline && Number.isFinite(latency) ? `${latency} ms` : "离线"}
      </span>
    </div>
  );
}
