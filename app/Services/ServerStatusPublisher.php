<?php

namespace App\Services;

use App\Events\ServerStatusChanged;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ServerStatusPublisher
{
    public function __construct(private readonly MinecraftServerStatus $status) {}

    public function publish(): bool
    {
        if (! config('realtime.enabled') || config('broadcasting.default') !== 'reverb') {
            return false;
        }

        // A caller inside a transaction must not announce uncommitted or rolled-back changes.
        if (DB::transactionLevel() > 0) {
            DB::afterCommit(fn () => $this->publish());

            return false;
        }

        $key = 'minecraft-status-publisher:'.sha1(json_encode([
            config('minecraft.server.ip'), config('minecraft.server.port'), config('minecraft.server.query_port'),
        ]));

        return (bool) Cache::lock($key.':lock', 15)->get(function () use ($key) {
            $status = $this->status->getServerStatus();
            $players = $status['players'] ?? [];
            sort($players, SORT_STRING);
            $snapshot = ['players' => $players];
            foreach (['is_online', 'query_available', 'query_unavailable', 'online_players', 'max_players', 'display_name', 'display_subtitle', 'version', 'motd_html', 'server_flavor', 'software', 'game_mode', 'favicon'] as $field) {
                $snapshot[$field] = $status[$field] ?? null;
            }
            // Ignore probe duration / latency jitter. A heartbeat still refreshes them every minute.
            $fingerprint = hash('sha256', json_encode($snapshot));
            $previous = Cache::get($key);
            if (($previous['fingerprint'] ?? null) === $fingerprint
                && now()->timestamp - ($previous['sent_at'] ?? 0) < config('realtime.heartbeat_seconds', 60)) {
                return false;
            }

            event(new ServerStatusChanged((string) Str::uuid()));
            // Only mark the snapshot delivered after synchronous broadcast succeeds.
            Cache::put($key, ['fingerprint' => $fingerprint, 'sent_at' => now()->timestamp], 600);

            return true;
        });
    }
}
