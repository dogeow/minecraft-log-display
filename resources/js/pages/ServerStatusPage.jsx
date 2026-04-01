import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { Card, CardContent } from "../components/ui/card";
import SkyBackground from "../components/SkyBackground";
import SkyDecoration from "../components/SkyDecoration";
import GrassFooter from "../components/GrassFooter";

export default function ServerStatusPage({ serverStatus, csrfToken }) {
    if (!serverStatus) return null;

    const { theme, toggleTheme } = useTheme();
    const [latency, setLatency] = useState(null);

    useEffect(() => {
        const measureLatency = async () => {
            const samples = [];
            for (let i = 0; i < 3; i++) {
                const startedAt = performance.now();
                try {
                    await fetch(`/ping?t=${Date.now()}-${i}`, {
                        cache: "no-store",
                        headers: { "X-Requested-With": "XMLHttpRequest" },
                    });
                    samples.push(performance.now() - startedAt);
                } catch {
                    samples.push(Infinity);
                }
            }
            const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
            setLatency(Math.round(avg));
        };
        measureLatency();
    }, []);

    const barsForLatency = (ms) => {
        if (!Number.isFinite(ms)) return 0;
        if (ms < 150) return 5;
        if (ms < 300) return 4;
        if (ms < 600) return 3;
        if (ms < 1000) return 2;
        return 1;
    };

    const bars = barsForLatency(latency);
    const isDark = theme === "dark";
    const textPrimary = isDark ? "text-[#FFAA00]" : "text-yellow-600";
    const textMuted = isDark ? "text-[#AAAAAA]" : "text-gray-500";

    return (
        <>
            <SkyBackground isDark={isDark} />
            <div className="relative container mx-auto p-2 pt-6">
                <div
                    className={`relative mx-auto max-w-3xl ${!isDark ? "bg-white/80 rounded-xl shadow-lg" : ""}`}
                >
                    <Card
                        className={`overflow-hidden rounded-t-xl rounded-b-none border-b-0 ${!isDark ? "bg-white/95" : ""}`}
                    >
                        <div
                            className={`flex min-h-10 items-center border-b ${isDark ? "bg-black/30" : "bg-white"} px-4 py-2 text-sm ${textPrimary}`}
                        >
                            {serverStatus.version}
                        </div>
                    </Card>

                    <Card
                        className={`rounded-none border-x ${!isDark ? "bg-white/95" : ""}`}
                    >
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
                                    dangerouslySetInnerHTML={{
                                        __html: serverStatus.motd_html,
                                    }}
                                />

                                <div className="flex shrink-0 flex-col items-end gap-2 self-start pt-1 text-right">
                                    <div
                                        className="flex items-end gap-0.5"
                                        title={
                                            latency != null
                                                ? `当前站点延迟 ${latency} ms`
                                                : "正在测量延迟"
                                        }
                                    >
                                        {[4, 7, 10, 13, 16].map((h, i) => (
                                            <span
                                                key={i}
                                                className={`w-1 rounded-sm ${i < bars ? "bg-green-500" : "bg-gray-500"}`}
                                                style={{ height: `${h}px` }}
                                            />
                                        ))}
                                    </div>
                                    <div
                                        className={`text-xs leading-none ${textPrimary}`}
                                    >
                                        {serverStatus.online_players} /{" "}
                                        {serverStatus.max_players}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className={`overflow-hidden rounded-t-none rounded-b-xl border-t-0 ${!isDark ? "bg-white/95" : ""}`}
                    >
                        <div
                            className={`flex min-h-10 items-center justify-between gap-4 px-4 py-2 text-sm ${textMuted}`}
                        >
                            <div className="min-w-0 truncate">
                                {serverStatus.server_flavor}{" "}
                                {serverStatus.software}
                            </div>
                            <div className="shrink-0">
                                查询用时 {serverStatus.timer} 秒
                            </div>
                        </div>
                    </Card>
                </div>

                <SkyDecoration isDark={isDark} onToggle={toggleTheme} />

                {serverStatus.errors?.length > 0 && (
                    <div className="mx-auto mt-6 max-w-3xl space-y-3">
                        {serverStatus.errors.map((error, i) => (
                            <div
                                key={i}
                                className={`rounded-lg border border-yellow-400/30 bg-yellow-300/10 px-4 py-3 text-sm ${isDark ? "text-yellow-100" : "text-yellow-700"}`}
                            >
                                {error}
                            </div>
                        ))}
                    </div>
                )}

                {serverStatus.query_unavailable && (
                    <div
                        className={`mx-auto mt-6 max-w-3xl rounded-lg border border-sky-400/30 bg-sky-300/10 px-4 py-3 text-sm ${isDark ? "text-sky-100" : "text-sky-700"}`}
                    >
                        服务器在线，但 Query
                        协议未响应，因此玩家列表和部分详细字段可能不完整。
                    </div>
                )}

                <div className="mt-8">
                    {serverStatus.players?.length > 0 && (
                        <div className="flex flex-wrap content-center justify-center gap-2">
                            {serverStatus.players.map((player) => (
                                <div
                                    key={player}
                                    className={`m-1 flex flex-col gap-1 rounded-lg border p-2 backdrop-blur ${isDark ? "border-[#FFAA00] bg-white/10" : "border-yellow-400 bg-gray-100"}`}
                                >
                                    <img
                                        src={`https://minotar.net/cube/${player}/64.png`}
                                        className="mx-auto h-8 w-8"
                                        alt="cube"
                                    />
                                    <div className="text-center text-sm">
                                        {player}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <GrassFooter players={serverStatus.players} />
        </>
    );
}
