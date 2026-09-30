<?php

return [
    // Off until the operator has configured and verified the Reverb/WSS service.
    'enabled' => (bool) env('MINECRAFT_REALTIME_ENABLED', false),
    'heartbeat_seconds' => 60,
    'fallback_ms' => 60000,
    'public' => [
        'key' => env('REVERB_APP_KEY', ''),
        'host' => env('REVERB_PUBLIC_HOST', parse_url(env('APP_URL', 'http://localhost'), PHP_URL_HOST)),
        'port' => (int) env('REVERB_PUBLIC_PORT', 443),
        'scheme' => env('REVERB_PUBLIC_SCHEME', 'https'),
    ],
];
