function barsForLatency(milliseconds) {
  if (!Number.isFinite(milliseconds)) return 0;
  if (milliseconds < 150) return 5;
  if (milliseconds < 300) return 4;
  if (milliseconds < 600) return 3;
  if (milliseconds < 1000) return 2;
  return 1;
}

export default function LatencyIndicator({ latency }) {
  const activeBars = barsForLatency(latency);

  return (
    <div
      className="flex items-end gap-0.5"
      title={
        latency != null ? `当前站点延迟 ${latency} ms` : "正在测量延迟"
      }
    >
      {[4, 7, 10, 13, 16].map((height, index) => (
        <span
          key={height}
          className={`w-1 rounded-sm ${index < activeBars ? "bg-green-500" : "bg-gray-500"}`}
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
}
