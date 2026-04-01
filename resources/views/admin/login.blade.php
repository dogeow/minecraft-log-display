@extends('layouts.gradient')

@section('gradient-content')
<div class="container mx-auto p-4">
    <div class="max-w-md mx-auto bg-white/10 backdrop-blur rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-semibold text-gray-800 mb-6">管理员登录</h3>
        
        <form method="POST" action="{{ route('login.post') }}">
            @csrf
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="username">
                    用户名
                </label>
                <input type="text" name="username" id="username"
                       class="w-full px-3 py-2 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                       required>
            </div>

            <div class="mb-6">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
                    密码
                </label>
                <input type="password" name="password" id="password"
                       class="w-full px-3 py-2 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                       required>
            </div>

            @if ($errors->any())
            <div class="mb-4 text-red-500">
                {{ $errors->first() }}
            </div>
            @endif

            <button type="submit" 
                    class="w-full bg-blue-500 text-white rounded-lg py-2 px-4 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                登录
            </button>
        </form>
    </div>
</div>
@endsection 