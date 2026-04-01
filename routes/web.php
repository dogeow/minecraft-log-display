<?php

use App\Http\Controllers\ApiController;
use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;

// Ping（必须在 catch-all 之前）
Route::get('/ping', fn () => response()->noContent(204, [
    'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma' => 'no-cache',
]))->name('latency-ping');

// API 路由 - 返回 JSON
Route::prefix('api')->group(function () {
    Route::get('/server-status', [ApiController::class, 'serverStatus']);
    Route::get('/users', [ApiController::class, 'users']);
    Route::get('/daily-stats', [ApiController::class, 'dailyStats']);
    Route::get('/logins', [ApiController::class, 'logins']);
    Route::get('/chat', [ApiController::class, 'chat']);
    Route::get('/login-locations', [ApiController::class, 'loginLocations']);
});

// 管理员认证
Route::middleware('guest')->group(function () {
    Route::post('/login', [AdminController::class, 'login'])->name('login.post');
});

Route::post('/logout', [AdminController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

// SPA 入口页 - 排除 ping 和 api
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!ping|api).*$');
