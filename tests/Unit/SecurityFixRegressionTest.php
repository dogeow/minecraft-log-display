<?php

namespace Tests\Unit;

use App\Models\Login;
use App\Services\MinecraftLogService;
use App\Services\MinecraftServerStatus;
use Carbon\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class SecurityFixRegressionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
        ]);

        Artisan::call('migrate:fresh', ['--quiet' => true]);
        Cache::flush();
    }

    public function test_minecraft_server_status_result_is_cached_and_reused(): void
    {
        config([
            'minecraft.server.ip' => 'mc.example.com',
            'minecraft.server.port' => 25565,
            'minecraft.server.query_port' => 25565,
            'minecraft.server.timeout' => 1,
            'minecraft.server.status_cache_ttl' => 60,
        ]);

        $service = new CachedMinecraftServerStatusService();
        $first = $service->getServerStatus();
        $second = $service->getServerStatus();

        $this->assertSame($first, $second);
        $this->assertSame(1, $service->computeServerStatusCallCount);

        $cacheKey = $service->getCurrentCacheKey();
        $this->assertNotNull(Cache::get($cacheKey));
    }

    public function test_minecraft_log_service_uses_login_position_cache_for_login_location(): void
    {
        $service = new MinecraftLogService();
        $service->cacheLoginPosition('player_one', [
            'world' => 'world',
            'x' => 10.5,
            'y' => 64.0,
            'z' => -20.5,
            'entity_id' => 777,
            'ip' => '10.0.0.1',
        ]);

        $this->assertSame(
            [
                'world' => 'world',
                'x' => 10.5,
                'y' => 64.0,
                'z' => -20.5,
                'entity_id' => 777,
                'ip' => '10.0.0.1',
            ],
            $service->pullLoginPosition('player_one')
        );
        $this->assertNull($service->pullLoginPosition('player_one'));

        $service->cacheLoginPosition('player_one', [
            'world' => 'world',
            'x' => 11.5,
            'y' => 65.0,
            'z' => -21.0,
            'entity_id' => 778,
            'ip' => '10.0.0.2',
        ]);

        $timestamp = Carbon::parse('2026-07-09 12:00:00');
        $login = $service->handleLogin(
            'player_one',
            '11111111-1111-1111-1111-111111111111',
            $timestamp,
            '/tmp/mc.log',
            'latest.log',
            null
        );

        $this->assertNotNull($login);
        $this->assertInstanceOf(Login::class, $login);

        $this->assertDatabaseHas('login_locations', [
            'login_id' => $login->id,
            'user_id' => $login->user_id,
            'world' => 'world',
            'x' => 11.5,
            'y' => 65.0,
            'z' => -21.0,
            'entity_id' => 778,
            'ip' => '10.0.0.2',
        ]);
    }
}

class CachedMinecraftServerStatusService extends MinecraftServerStatus
{
    public int $computeServerStatusCallCount = 0;

    public function getCurrentCacheKey(): string
    {
        return $this->buildCacheKey(
            (string) config('minecraft.server.ip'),
            (int) config('minecraft.server.port'),
            (int) config('minecraft.server.query_port'),
            (float) config('minecraft.server.timeout', 1),
        );
    }

    protected function computeServerStatus(string $host, int $port, int $queryPort, float $timeout): array
    {
        $this->computeServerStatusCallCount++;

        return [
            'is_online' => true,
            'query_available' => true,
            'query_unavailable' => false,
            'timer' => '0.0000',
            'display_name' => 'DogeOW',
            'display_subtitle' => '服务器在线',
            'version' => '1.21.4',
            'server_flavor' => 'Mod 服务器',
            'software' => 'Paper',
            'game_mode' => '多人游戏',
            'online_players' => 0,
            'max_players' => 20,
            'motd_html' => '',
            'errors' => [],
            'info' => [],
            'queryInfo' => [],
            'players' => [],
            'favicon' => null,
            'endpoint' => sprintf('%s:%d', $host, $queryPort),
        ];
    }
}
