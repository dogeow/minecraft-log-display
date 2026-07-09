<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Minecraft 日志路径
    |--------------------------------------------------------------------------
    |
    | 这里配置 Minecraft 服务器日志文件的存储路径
    |
    */
    'log_path' => env('MINECRAFT_LOG_PATH', storage_path('logs/minecraft')),
    'server' => [
        'ip' => env('MINECRAFT_SERVER_IP', '127.0.0.1'),
        'port' => env('MINECRAFT_SERVER_PORT', 25565),
        'query_port' => env('MINECRAFT_SERVER_QUERY_PORT', 25565),
        'timeout' => (float) env('MINECRAFT_SERVER_TIMEOUT', 1),
        'status_cache_ttl' => (int) env('MINECRAFT_SERVER_STATUS_CACHE_TTL', 10),
    ],
];
