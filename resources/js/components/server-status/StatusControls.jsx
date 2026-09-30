import { useState } from "react";
import useSWR from "swr";
import { RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

export default function StatusControls({ receivedAt }) {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { error, isValidating, mutate } = useSWR("/api/server-status", {
    refreshInterval: autoRefresh ? 60000 : 0,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    shouldRetryOnError: false,
  });
  return (
    <section className="mc-status-controls" aria-label="状态刷新">
      <p role="status">
        {error
          ? "更新失败，当前显示上次成功获取的状态"
          : isValidating
            ? "正在检查服务器状态…"
            : receivedAt
              ? `最近获取 ${new Date(receivedAt).toLocaleTimeString("zh-CN")}`
              : "状态已获取"}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(event) => setAutoRefresh(event.target.checked)}
          />
          每分钟自动刷新
        </label>
        <Button
          size="sm"
          variant="outline"
          onClick={() => mutate()}
          disabled={isValidating}
        >
          <RefreshCw
            size={14}
            aria-hidden="true"
            className={isValidating ? "animate-spin" : ""}
          />
          刷新状态
        </Button>
      </div>
    </section>
  );
}
