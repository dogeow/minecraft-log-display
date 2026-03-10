<?php

namespace App\Services;

use xPaw\MinecraftPing;
use xPaw\MinecraftQuery;

class MinecraftServerStatus
{
    public function getServerStatus(): array
    {
        $host = (string) config('minecraft.server.ip');
        $port = (int) config('minecraft.server.port');
        $queryPort = (int) config('minecraft.server.query_port');
        $timeout = (float) config('minecraft.server.timeout', 1);

        $startedAt = microtime(true);
        $pingResult = $this->pingServer($host, $port, $timeout);
        $queryResult = $this->queryServer($host, $queryPort, $timeout);

        return $this->buildServerStatus(
            $pingResult,
            $queryResult,
            microtime(true) - $startedAt,
            $host
        );
    }

    protected function pingServer(string $host, int $port, float $timeout): array
    {
        $ping = null;

        try {
            $ping = new MinecraftPing($host, $port, $timeout);
            $info = $ping->Query();

            if ($info === false) {
                $ping->Close();
                $ping->Connect();
                $info = $ping->QueryOldPre17();
            }

            return [
                'info' => is_array($info) ? $info : [],
                'error' => null,
            ];
        } catch (\Throwable) {
            return [
                'info' => [],
                'error' => '服务器 Ping 不可用',
            ];
        } finally {
            if ($ping instanceof MinecraftPing) {
                $ping->Close();
            }
        }
    }

    protected function queryServer(string $host, int $port, float $timeout): array
    {
        try {
            $query = new MinecraftQuery();
            $query->Connect($host, $port, $timeout);
            $info = $query->GetInfo();
            $players = $query->GetPlayers();

            return [
                'info' => is_array($info) ? $info : [],
                'players' => is_array($players) ? array_values($players) : [],
                'error' => null,
            ];
        } catch (\Throwable) {
            return [
                'info' => [],
                'players' => [],
                'error' => '服务器 Query 不可用',
            ];
        }
    }

    protected function buildServerStatus(array $pingResult, array $queryResult, float $elapsed, string $host): array
    {
        $info = is_array($pingResult['info'] ?? null) ? $pingResult['info'] : [];
        $queryInfo = is_array($queryResult['info'] ?? null) ? $queryResult['info'] : [];
        $players = is_array($queryResult['players'] ?? null) ? array_values($queryResult['players']) : [];
        $description = $this->minecraftDescriptionToText($info['description'] ?? null);
        $queryAvailable = ($queryResult['error'] ?? null) === null;

        $normalizedQueryInfo = array_merge([
            'GameName' => '未知',
            'HostName' => '未知',
            'Version' => '未知',
            'Plugins' => '',
            'Software' => '',
            'GameType' => '',
            'Players' => 0,
            'MaxPlayers' => 0,
        ], $queryInfo);

        if ($normalizedQueryInfo['Version'] === '未知' && isset($info['version']['name'])) {
            $normalizedQueryInfo['Version'] = (string) $info['version']['name'];
        }

        if ((int) $normalizedQueryInfo['Players'] === 0 && isset($info['players']['online'])) {
            $normalizedQueryInfo['Players'] = (int) $info['players']['online'];
        }

        if ((int) $normalizedQueryInfo['MaxPlayers'] === 0 && isset($info['players']['max'])) {
            $normalizedQueryInfo['MaxPlayers'] = (int) $info['players']['max'];
        }

        $displaySubtitle = $normalizedQueryInfo['HostName'] !== '未知'
            ? (string) $normalizedQueryInfo['HostName']
            : ($description !== '' ? $description : (($pingResult['error'] ?? null) === null ? '服务器在线' : '服务器离线或不可访问'));

        return [
            'info' => $info,
            'queryInfo' => $normalizedQueryInfo,
            'players' => $players,
            'timer' => number_format($elapsed, 4, '.', ''),
            'favicon' => $this->normalizeFavicon($info),
            'is_online' => ($pingResult['error'] ?? null) === null,
            'query_available' => $queryAvailable,
            'query_unavailable' => ! $queryAvailable && ($pingResult['error'] ?? null) === null,
            'errors' => array_values(array_filter([
                $pingResult['error'] ?? null,
                $queryResult['error'] ?? null,
            ])),
            'display_name' => $normalizedQueryInfo['GameName'] !== '未知'
                ? (string) $normalizedQueryInfo['GameName']
                : 'Minecraft 服务器',
            'display_subtitle' => $displaySubtitle,
            'version' => (string) $normalizedQueryInfo['Version'],
            'server_flavor' => empty($normalizedQueryInfo['Plugins']) ? '原版服务器' : 'Mod 服务器',
            'software' => $normalizedQueryInfo['Software'] !== ''
                ? (string) $normalizedQueryInfo['Software']
                : ($queryAvailable ? 'Vanilla' : 'Query 不可用'),
            'game_mode' => $normalizedQueryInfo['GameType'] === 'SMP'
                ? '多人游戏'
                : ($normalizedQueryInfo['GameType'] === '' ? '未知' : '单人游戏'),
            'online_players' => (int) $normalizedQueryInfo['Players'],
            'max_players' => (int) $normalizedQueryInfo['MaxPlayers'],
            'endpoint' => sprintf('%s:%d', $host, config('minecraft.server.port')),
        ];
    }

    protected function minecraftDescriptionToText(mixed $description): string
    {
        if (is_scalar($description)) {
            return trim((string) $description);
        }

        if (! is_array($description)) {
            return '';
        }

        $parts = [];

        if (isset($description['text']) && is_scalar($description['text'])) {
            $parts[] = (string) $description['text'];
        }

        if (isset($description['extra']) && is_array($description['extra'])) {
            foreach ($description['extra'] as $item) {
                $parts[] = $this->minecraftDescriptionToText($item);
            }
        }

        if ($parts === []) {
            foreach ($description as $item) {
                $parts[] = $this->minecraftDescriptionToText($item);
            }
        }

        return trim(preg_replace('/\s+/', ' ', implode('', $parts)) ?? '');
    }

    protected function normalizeFavicon(array $info): ?string
    {
        if (! isset($info['favicon'])) {
            return null;
        }

        $favicon = str_replace("\n", '', (string) $info['favicon']);

        if ($favicon === '' || ! str_starts_with($favicon, 'data:image/')) {
            return null;
        }

        return $favicon;
    }
}
