import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "../components/ui/card";

export default function ServerStatusPage({ serverStatus, csrfToken }) {
    if (!serverStatus) return null;
    const { theme } = useTheme();
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

    // Day sky elements (sun, clouds, gradient)
    const daySky = !isDark && (
        <>
            {/* Gradient sky background - below nav */}
            <div
                className="fixed start-0 end-0 top-[60px] bottom-0 z-20"
                style={{
                    background:
                        "linear-gradient(to bottom, #87CEEB 0%, #FFFFFF 100%)",
                }}
            />
            {/* Sun */}
            <div className="fixed top-4 right-20 w-14 h-14 rounded-full bg-[#FFD700] shadow-[0_0_40px_15px_rgba(255,215,0,0.4)] z-20" />
            {/* Clouds */}
            <div className="fixed top-12 left-[10%] w-28 h-9 bg-white/90 rounded-full blur-[1px] z-20" />
            <div className="fixed top-20 left-[50%] w-24 h-7 bg-white/80 rounded-full blur-[1px] z-20" />
            <div className="fixed top-8 left-[75%] w-20 h-6 bg-white/85 rounded-full blur-[1px] z-20" />
            <div className="fixed top-28 left-[30%] w-16 h-5 bg-white/70 rounded-full blur-[1px] z-20" />
        </>
    );

    // Night sky elements (stars, moon, clouds)
    const nightSky = isDark && (
        <>
            {/* Stars */}
            {[
                "top-[8%] left-[12%]",
                "top-[15%] left-[35%]",
                "top-[5%] left-[55%]",
                "top-[20%] left-[75%]",
                "top-[12%] left-[88%]",
                "top-[25%] left-[22%]",
                "top-[30%] left-[65%]",
                "top-[18%] left-[45%]",
                "top-[35%] left-[8%]",
                "top-[10%] left-[92%]",
            ].map((pos, i) => (
                <div
                    key={`star-${i}`}
                    className={`fixed ${pos} w-0.5 h-0.5 rounded-full bg-white animate-pulse z-20`}
                    style={{
                        animationDelay: `${i * 0.3}s`,
                        opacity: 0.7 + (i % 3) * 0.1,
                    }}
                />
            ))}
            {/* Moon */}
            <div className="fixed top-6 right-16 w-12 h-12 rounded-full bg-[#F4F1C9] shadow-[0_0_30px_10px_rgba(244,241,201,0.3)] z-20">
                <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-[#D4D1A0] opacity-60" />
                <div className="absolute top-4 left-2 w-2 h-2 rounded-full bg-[#D4D1A0] opacity-50" />
            </div>
            {/* Clouds */}
            <div className="fixed top-16 left-[15%] w-24 h-8 bg-white/20 rounded-full blur-[2px] z-20" />
            <div className="fixed top-24 left-[60%] w-20 h-6 bg-white/15 rounded-full blur-[2px] z-20" />
            <div className="fixed top-10 left-[40%] w-16 h-5 bg-white/10 rounded-full blur-[2px] z-20" />
        </>
    );

    return (
        <>
            {daySky}
            {nightSky}
            <div className="relative container mx-auto p-2">
                <div
                    className={`mx-auto max-w-3xl ${!isDark ? "bg-white/80 rounded-xl shadow-lg" : ""}`}
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
                                    ></div>
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
                        <div className="flex content-center flex-wrap justify-center gap-2">
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

                <div
                    className="relative z-[60]"
                    style={{ borderBottom: "3rem solid transparent" }}
                >
                    {serverStatus.players?.length > 0 && (
                        <div
                            className="fixed start-0 end-0 bottom-0 h-12 z-30"
                            style={{
                                backgroundImage:
                                    "url('/images/minecraft_grass_block_texture.jpg')",
                                backgroundSize: "auto 3rem",
                                backgroundRepeat: "repeat-x",
                            }}
                        />
                    )}
                    {serverStatus.players?.length > 0 && (
                        <div className="fixed start-0 end-0 bottom-12 flex items-center justify-center z-[60]">
                            {serverStatus.players?.map((player) => (
                                <img
                                    key={player}
                                    src={`https://minotar.net/body/${player}/64.png`}
                                    className="h-24 mx-1"
                                    alt="body"
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
