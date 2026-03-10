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
                    'description' => [
                        'text' => '',
                        'extra' => [
                            ['text' => '4B ', 'color' => 'gray', 'bold' => true],
                            ['text' => '欢迎来玩⛏', 'color' => 'gold'],
                            ['text' => "\n"],
                            ['text' => '4T QQ群162436048', 'color' => 'light_purple'],
                        ],
                    ],
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
        $this->assertSame("4B 欢迎来玩⛏\n4T QQ群162436048", $status['display_name']);
        $this->assertSame('服务器在线', $status['display_subtitle']);
        $this->assertSame('Mod 服务器', $status['server_flavor']);
        $this->assertSame('多人游戏', $status['game_mode']);
        $this->assertSame(2, $status['online_players']);
        $this->assertSame(20, $status['max_players']);
        $this->assertSame(['Alex', 'Steve'], $status['players']);
        $this->assertSame('data:image/png;base64,abc', $status['favicon']);
        $this->assertSame([], $status['errors']);
        $this->assertStringContainsString('<br>', $status['motd_html']);
        $this->assertStringContainsString('color: #AAAAAA', $status['motd_html']);
        $this->assertStringContainsString('font-weight: 700', $status['motd_html']);
        $this->assertStringContainsString('color: #FF55FF', $status['motd_html']);
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
        $this->assertSame('Welcome Builders', $status['display_name']);
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
                    'description' => "§7§l4B§r §6☻欢迎来玩⛏§r，记得先入群加白名单哦O_o\n§7§l4T§5 QQ群§d162436048",
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

        $this->assertSame("4B ☻欢迎来玩⛏，记得先入群加白名单哦O_o\n4T QQ群162436048", $status['display_name']);
        $this->assertSame('服务器在线', $status['display_subtitle']);
        $this->assertStringContainsString('<br>', $status['motd_html']);
        $this->assertStringContainsString('color: #AAAAAA', $status['motd_html']);
        $this->assertStringContainsString('color: #FFAA00', $status['motd_html']);
        $this->assertStringContainsString('color: #FF55FF', $status['motd_html']);
    }

    public function test_it_uses_query_hostname_when_ping_description_is_missing(): void
    {
        config([
            'minecraft.server.ip' => 'mc.example.com',
            'minecraft.server.port' => 25565,
            'minecraft.server.query_port' => 25565,
            'minecraft.server.timeout' => 1,
        ]);

        $service = new FakeMinecraftServerStatus(
            [
                'info' => [],
                'error' => null,
            ],
            [
                'info' => [
                    'HostName' => "§a第一行\f§b第二行",
                ],
                'players' => [],
                'error' => null,
            ]
        );

        $status = $service->getServerStatus();

        $this->assertSame("第一行\n第二行", $status['display_name']);
        $this->assertStringContainsString('<br>', $status['motd_html']);
        $this->assertStringContainsString('color: #55FF55', $status['motd_html']);
        $this->assertStringContainsString('color: #55FFFF', $status['motd_html']);
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
