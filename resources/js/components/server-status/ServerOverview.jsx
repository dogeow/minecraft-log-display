import { Card, CardContent } from "../ui/card";
import LatencyIndicator from "./LatencyIndicator";

export default function ServerOverview({ serverStatus, latency, isDark }) {
  const textPrimary = isDark ? "text-[#FFAA00]" : "text-yellow-600";
  const textMuted = isDark ? "text-[#AAAAAA]" : "text-gray-500";
  const lightCard = !isDark ? "bg-white/95" : "";

  return (
    <div
      className={`relative mx-auto max-w-3xl ${!isDark ? "rounded-xl bg-white/80 shadow-lg" : ""}`}
    >
      <Card
        className={`overflow-hidden rounded-b-none rounded-t-xl border-b-0 ${lightCard}`}
      >
        <div
          className={`flex min-h-10 items-center border-b px-4 py-2 text-sm ${isDark ? "bg-black/30" : "bg-white"} ${textPrimary}`}
        >
          {serverStatus.version}
        </div>
      </Card>

      <Card className={`rounded-none border-x ${lightCard}`}>
        <CardContent className="flex items-start gap-4 p-4">
          <div className="flex w-16 shrink-0 flex-col items-center">
            {serverStatus.favicon ? (
              <img
                src={serverStatus.favicon}
                className="h-16 w-16 rounded-sm border"
                alt="Server favicon"
              />
            ) : (
              <div
                className={`h-16 w-16 rounded-sm border ${isDark ? "bg-black/30" : "bg-muted"}`}
              />
            )}
          </div>

          <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
            <div
              className="min-w-0 flex-1 pt-1 text-base leading-tight tracking-tight"
              dangerouslySetInnerHTML={{ __html: serverStatus.motd_html }}
            />

            <div className="flex shrink-0 flex-col items-end gap-2 self-start pt-1 text-right">
              <LatencyIndicator latency={latency} />
              <div className={`text-xs leading-none ${textPrimary}`}>
                {serverStatus.online_players} / {serverStatus.max_players}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className={`overflow-hidden rounded-b-xl rounded-t-none border-t-0 ${lightCard}`}
      >
        <div
          className={`flex min-h-10 items-center justify-between gap-4 px-4 py-2 text-sm ${textMuted}`}
        >
          <div className="min-w-0 truncate">
            {serverStatus.server_flavor} {serverStatus.software}
          </div>
          <div className="shrink-0">查询用时 {serverStatus.timer} 秒</div>
        </div>
      </Card>
    </div>
  );
}
