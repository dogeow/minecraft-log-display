@extends('layouts.gradient')

@section('gradient-content')
    <div class="container mx-auto p-2">
        <div class="mx-auto max-w-3xl">
            <div class="flex min-h-10 items-center rounded-t-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-[#FFAA00]">
                {{ $serverStatus['version'] }}
            </div>

            <div class="flex items-start gap-4 border border-t-0 border-white/10 bg-black/20 p-4">
                <div class="flex w-16 shrink-0 flex-col items-center">
                    @if($serverStatus['favicon'])
                        <img
                            src="{{ $serverStatus['favicon'] }}"
                            class="h-16 w-16 rounded-sm border border-white/10"
                            alt="Server favicon"
                        >
                    @else
                        <div class="h-16 w-16 rounded-sm border border-white/10 bg-black/30"></div>
                    @endif
                </div>

                <div class="flex min-w-0 flex-1 items-start justify-between gap-4">
                    <div class="min-w-0 flex-1 pt-1 text-base leading-tight tracking-tight [&_span]:align-middle">
                        {!! $serverStatus['motd_html'] !!}
                    </div>

                    <div class="flex shrink-0 flex-col items-end gap-2 self-start pt-1 text-right">
                        <div
                            id="latency-signal"
                            data-ping-url="{{ route('latency-ping') }}"
                            class="flex items-end gap-0.5"
                            title="正在测量延迟"
                            aria-label="正在测量延迟"
                        >
                            <span data-bar class="w-1 rounded-sm bg-[#555555]" style="height: 4px;"></span>
                            <span data-bar class="w-1 rounded-sm bg-[#555555]" style="height: 7px;"></span>
                            <span data-bar class="w-1 rounded-sm bg-[#555555]" style="height: 10px;"></span>
                            <span data-bar class="w-1 rounded-sm bg-[#555555]" style="height: 13px;"></span>
                            <span data-bar class="w-1 rounded-sm bg-[#555555]" style="height: 16px;"></span>
                        </div>

                        <div class="text-xs leading-none text-[#FFAA00]">
                            {{ $serverStatus['online_players'] }} / {{ $serverStatus['max_players'] }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex min-h-10 items-center justify-between gap-4 rounded-b-xl border border-t-0 border-white/10 bg-black/30 px-4 py-2 text-sm text-[#AAAAAA]">
                <div class="min-w-0 truncate">
                    {{ $serverStatus['server_flavor'] }}
                    {{ $serverStatus['software'] }}
                </div>
                <div class="shrink-0">
                    查询用时 {{ $serverStatus['timer'] }} 秒
                </div>
            </div>
        </div>

        @if($serverStatus['errors'] !== [])
            <div class="mx-auto mt-6 max-w-3xl space-y-3">
                @foreach($serverStatus['errors'] as $error)
                    <div class="rounded-lg border border-yellow-400/30 bg-yellow-300/10 px-4 py-3 text-sm text-yellow-100">
                        {{ $error }}
                    </div>
                @endforeach
            </div>
        @endif

        @if($serverStatus['query_unavailable'])
            <div class="mx-auto mt-6 max-w-3xl rounded-lg border border-sky-400/30 bg-sky-300/10 px-4 py-3 text-sm text-sky-100">
                服务器在线，但 Query 协议未响应，因此玩家列表和部分详细字段可能不完整。
            </div>
        @endif

        <div class="mt-8">
            @if(!empty($serverStatus['players']))
                <div class="flex content-center space-x-2">
                    <div class="flex space-x-1 justify-center flex-wrap">
                        @foreach($serverStatus['players'] as $player)
                            <div class="m-1 flex flex-col space-x-1 rounded-lg border border-[#FFAA00] bg-white/10 p-2 backdrop-blur">
                                <img src="https://minotar.net/cube/{{ $player }}/64.png"
                                     class="mx-auto h-8 w-8" alt="cube">
                                <div>{{ $player }}</div>
                            </div>
                        @endforeach
                    </div>
                </div>
            @endif
        </div>
    </div>

    @if(!empty($serverStatus['players']))
        <div style="border-bottom: 3rem solid;border-image: url(/images/minecraft_grass_block_texture.jpg) 1280 0 repeat;">
            <div class="flex items-center justify-center">
                @foreach($serverStatus['players'] as $player)
                    <img src="https://minotar.net/body/{{ $player }}/64.png" class="h-24 mx-1" alt="body">
                @endforeach
            </div>
        </div>
    @else
        <div style="border-bottom: 3rem solid;border-image: url(/images/minecraft_grass_block_texture.jpg) 1280 0 repeat;" />
    @endif

    <script>
        (() => {
            const signal = document.getElementById('latency-signal');

            if (!signal) {
                return;
            }

            const bars = Array.from(signal.querySelectorAll('[data-bar]'));
            const activeClass = 'bg-[#55FF55]';
            const inactiveClass = 'bg-[#555555]';

            const setBars = (count, label) => {
                bars.forEach((bar, index) => {
                    bar.classList.remove(activeClass, inactiveClass);
                    bar.classList.add(index < count ? activeClass : inactiveClass);
                });

                signal.title = label;
                signal.setAttribute('aria-label', label);
            };

            const barsForLatency = (latency) => {
                if (!Number.isFinite(latency)) {
                    return 0;
                }

                if (latency < 150) {
                    return 5;
                }

                if (latency < 300) {
                    return 4;
                }

                if (latency < 600) {
                    return 3;
                }

                if (latency < 1000) {
                    return 2;
                }

                return 1;
            };

            const measureLatency = async () => {
                const url = signal.dataset.pingUrl;

                if (!url) {
                    setBars(0, '无法测量延迟');
                    return;
                }

                const samples = [];

                for (let index = 0; index < 3; index++) {
                    const startedAt = performance.now();

                    const response = await fetch(`${url}?t=${Date.now()}-${index}`, {
                        cache: 'no-store',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    });

                    if (!response.ok) {
                        throw new Error(`Unexpected status ${response.status}`);
                    }

                    samples.push(performance.now() - startedAt);
                }

                const latency = Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length);
                setBars(barsForLatency(latency), `当前站点延迟 ${latency} ms`);
            };

            setBars(0, '正在测量延迟');

            measureLatency().catch(() => {
                setBars(0, '无法测量延迟');
            });
        })();
    </script>
@endsection
