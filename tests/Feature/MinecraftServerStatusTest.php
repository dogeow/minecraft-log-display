<?php

namespace Tests\Feature;

use App\Services\MinecraftServerStatus;
use Tests\TestCase;

class MinecraftServerStatusTest extends TestCase
{
    public function test_it_uses_query_response_when_available(): void
    {
        config([
            'minecraft.server.ip' => 'mc.example.com',
            'minecraft.server.port' => 25565,
            'minecraft.server.query_port' => 25565,
            'minecraft.server.timeout' => 1,
        ]);

        $service = new FakeMinecraftServerStatus(
            [
                'info' => [
                    'version' => ['name' => '1.21.4'],
                    'players' => ['online' => 2, 'max' => 20],
                    'description' => ['text' => 'Welcome'],
                    'favicon' => "data:image/png;base64,abc\n",
                ],
                'error' => null,
            ],
            [
                'info' => [
                    'GameName' => 'DogeOW',
                    'HostName' => 'Creative Server',
                    'Version' => '1.21.4',
                    'Plugins' => ['WorldEdit'],
                    'Software' => 'Paper',
                    'GameType' => 'SMP',
                    'Players' => 2,
                    'MaxPlayers' => 20,
                ],
                'players' => ['Alex', 'Steve'],
                'error' => null,
            ]
        );

        $status = $service->getServerStatus();

        $this->assertTrue($status['is_online']);
        $this->assertTrue($status['query_available']);
        $this->assertSame('Welcome', $status['display_name']);
        $this->assertSame('服务器在线', $status['display_subtitle']);
        $this->assertSame('Mod 服务器', $status['server_flavor']);
        $this->assertSame('多人游戏', $status['game_mode']);
        $this->assertSame(2, $status['online_players']);
        $this->assertSame(20, $status['max_players']);
        $this->assertSame(['Alex', 'Steve'], $status['players']);
        $this->assertSame('data:image/png;base64,abc', $status['favicon']);
        $this->assertSame([], $status['errors']);
    }

    public function test_it_falls_back_to_ping_data_when_query_is_unavailable(): void
    {
        config([
            'minecraft.server.ip' => 'mc.example.com',
            'minecraft.server.port' => 25565,
            'minecraft.server.query_port' => 25565,
            'minecraft.server.timeout' => 1,
        ]);

        $service = new FakeMinecraftServerStatus(
            [
                'info' => [
                    'version' => ['name' => '1.20.6'],
                    'players' => ['online' => 0, 'max' => 10],
                    'description' => [
                        'text' => 'Welcome ',
                        'extra' => [
                            ['text' => 'Builders'],
                        ],
                    ],
                ],
                'error' => null,
            ],
            [
                'info' => [],
                'players' => [],
                'error' => '服务器 Query 不可用',
            ]
        );

        $status = $service->getServerStatus();

        $this->assertTrue($status['is_online']);
        $this->assertFalse($status['query_available']);
        $this->assertTrue($status['query_unavailable']);
        $this->assertSame('Welcome Builders', $status['display_name']);
        $this->assertSame('服务器在线', $status['display_subtitle']);
        $this->assertSame('1.20.6', $status['version']);
        $this->assertSame(0, $status['online_players']);
        $this->assertSame(10, $status['max_players']);
        $this->assertSame(['服务器 Query 不可用'], $status['errors']);
    }

    public function test_it_strips_legacy_formatting_codes_from_ping_description(): void
    {
        config([
            'minecraft.server.ip' => 'mc.example.com',
            'minecraft.server.port' => 25565,
            'minecraft.server.query_port' => 25565,
            'minecraft.server.timeout' => 1,
        ]);

        $service = new FakeMinecraftServerStatus(
            [
                'info' => [
                    'description' => '§7§l4B§r§l 正确服务器名',
                ],
                'error' => null,
            ],
            [
                'info' => [
                    'HostName' => '§7§l4B§r§l §6 ;§2"Îe©§3Ï§r§4°He¤ } Uæ§8O_o§r §7§l4T§5 QQ¤§d162436048',
                ],
                'players' => [],
                'error' => null,
            ]
        );

        $status = $service->getServerStatus();

        $this->assertSame('4B 正确服务器名', $status['display_name']);
        $this->assertSame('服务器在线', $status['display_subtitle']);
    }
}

class FakeMinecraftServerStatus extends MinecraftServerStatus
{
    public function __construct(
        private readonly array $pingResult,
        private readonly array $queryResult,
    ) {
    }

    protected function pingServer(string $host, int $port, float $timeout): array
    {
        return $this->pingResult;
    }

    protected function queryServer(string $host, int $port, float $timeout): array
    {
        return $this->queryResult;
    }
}
