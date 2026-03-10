@extends('layouts.gradient')

@section('gradient-content')
    <div class="container mx-auto p-2">
        <div class="flex justify-center space-x-4 items-center">
            @if($serverStatus['favicon'])
                <img src="{{ $serverStatus['favicon'] }}" style="width:64px;height:64px;" alt="Server favicon">
            @endif
            <div>
                <div class="mb-2 flex items-center gap-2 text-xs">
                    <span class="rounded-full px-3 py-1 {{ $serverStatus['is_online'] ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300' }}">
                        {{ $serverStatus['is_online'] ? '在线' : '离线' }}
                    </span>
                    <span class="rounded-full bg-white/10 px-3 py-1 text-[#AAAAAA]">
                        {{ $serverStatus['query_available'] ? 'Query 可用' : '仅 Ping' }}
                    </span>
                </div>
                <h1 class="text-3xl font-bold text-[#55FF55]">
                    {{ $serverStatus['display_name'] }}
                </h1>
                <h2 class="text-[#AAAAAA]">{{ $serverStatus['display_subtitle'] }}</h2>
            </div>
        </div>

        <div class="flex flex-col items-center space-y-4">
            <div class="text-[#AAAAAA]">
                版本：<span class="text-[#55FF55]">{{ $serverStatus['version'] }}</span>
                {{ $serverStatus['server_flavor'] }}
                {{ $serverStatus['software'] }}
            </div>

            <div class="text-[#AAAAAA]">
                单人｜多人：{{ $serverStatus['game_mode'] }}
            </div>

            <div class="text-sm text-[#AAAAAA]">
                服务器地址 {{ $serverStatus['endpoint'] }}，查询用时 {{ $serverStatus['timer'] }} 秒
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
            <div class="text-[#FFAA00] mb-4">在线玩家：{{ $serverStatus['online_players'] }} / {{ $serverStatus['max_players'] }}</div>

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
            @elseif($serverStatus['is_online'])
                <div class="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#AAAAAA]">
                    当前没有在线玩家，或者服务器没有返回玩家列表。
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
@endsection
