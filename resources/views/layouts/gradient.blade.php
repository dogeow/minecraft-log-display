@extends('layouts.app')

@section('content')
<div class="min-h-screen bg-gradient-to-r from-sky-500 to-indigo-500 text-white flex flex-col">
    <!-- 导航栏 -->
    <nav class="bg-transparent">
        <div class="container mx-auto px-4">
            <div class="flex flex-col md:flex-row md:justify-between md:items-center py-3">
                <div class="flex justify-between items-center">
                    <a href="{{ route('home') }}" class="text-xl font-bold text-white">我的世界</a>
                    <button class="md:hidden rounded-lg focus:outline-none focus:shadow-outline" id="menuBtn">
                        <svg fill="currentColor" viewBox="0 0 20 20" class="w-6 h-6 text-white">
                            <path id="menuIcon" fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9 15a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z"></path>
                            <path id="closeIcon" class="hidden" fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"></path>
                        </svg>
                    </button>
                </div>
                <div class="hidden md:flex md:items-center md:space-x-4" id="menu">
                    <a href="{{ route('users') }}" class="block mt-4 md:inline-block md:mt-0 text-white hover:text-gray-200 {{ request()->routeIs('users') ? 'font-semibold' : '' }}">用户列表</a>
                    <a href="{{ route('daily-stats.index') }}" class="block mt-4 md:inline-block md:mt-0 text-white hover:text-gray-200 {{ request()->routeIs('daily-stats.*') ? 'font-semibold' : '' }}">每日统计</a>
                    <a href="{{ route('logins.index') }}" class="block mt-4 md:inline-block md:mt-0 text-white hover:text-gray-200 {{ request()->routeIs('logins.*') ? 'font-semibold' : '' }}">登录记录</a>
                    <a href="{{ route('chat') }}" class="block mt-4 md:inline-block md:mt-0 text-white hover:text-gray-200 {{ request()->routeIs('chat') ? 'font-semibold' : '' }}">聊天记录</a>
                    <a href="{{ route('login-locations.index') }}" class="block mt-4 md:inline-block md:mt-0 text-white hover:text-gray-200 {{ request()->routeIs('login-locations.*') ? 'font-semibold' : '' }}">登录位置</a>

                    @auth
                        @if(auth()->user()->is_admin)
                            <form method="POST" action="{{ route('logout') }}" class="inline">
                                @csrf
                                <button type="submit" class="block mt-4 md:inline-block md:mt-0 text-white hover:text-gray-200">退出登录</button>
                            </form>
                        @endif
                    @else
                        <a href="{{ route('login') }}" class="block mt-4 md:inline-block md:mt-0 text-white hover:text-gray-200">管理员登录</a>
                    @endauth
                </div>
            </div>
        </div>
    </nav>

    <!-- 内容区域 -->
    <div class="flex-1 flex flex-col justify-between">
        @yield('gradient-content')
    </div>
</div>

<style>
@font-face {
    font-family: 'Minecraft';
    src: url('/fonts/minecraft.ttf') format('truetype');
}
</style>
@endsection 