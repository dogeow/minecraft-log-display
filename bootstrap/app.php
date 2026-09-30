<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withSchedule(function (Schedule $schedule) {
        $schedule->command('minecraft:process-logs')
            ->everySecond()
            ->sendOutputTo(storage_path('logs/process.log'), true);

        $schedule->command('minecraft:publish-status')
            ->everyTenSeconds()
            ->withoutOverlapping(1)
            ->when(fn () => config('realtime.enabled') && config('broadcasting.default') === 'reverb');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
