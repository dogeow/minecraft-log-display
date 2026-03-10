<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DailyStatController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\LoginLocationController;
use App\Http\Controllers\AdminController;

// 公开路由
Route::get('/', [DashboardController::class, 'index'])->name('home');
Route::get('/ping', fn () => response()->noContent(204, [
    'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma' => 'no-cache',
]))->name('latency-ping');
Route::get('/users', [DashboardController::class, 'users'])->name('users');
Route::get('/daily-stats', [DailyStatController::class, 'index'])->name('daily-stats.index');
Route::get('/logins', [LoginController::class, 'index'])->name('logins.index');

// 管理员认证路由
Route::middleware('guest')->group(function () {
    Route::get('/login', [AdminController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AdminController::class, 'login'])->name('login.post');
});

Route::post('/logout', [AdminController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

Route::get('/chat', [DashboardController::class, 'chat'])->name('chat');
Route::get('/login-locations', [LoginLocationController::class, 'index'])->name('login-locations.index');
