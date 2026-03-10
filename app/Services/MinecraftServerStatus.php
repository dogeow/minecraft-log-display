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

        $timer = microtime(true);

        $info = $this->createPing($host, $port, $timeout);
        [$queryInfo, $players] = $this->createQuery($host, $queryPort, $timeout);

        $timer = number_format(microtime(true) - $timer, 4, '.', '');
        $players = is_array($players) ? $players : [];
        $queryInfo = is_array($queryInfo) ? $queryInfo : [];

        $queryInfo = array_merge([
            'GameName' => '未知',
            'HostName' => '未知',
            'Version' => '未知',
            'Plugins' => '',
            'Software' => '',
            'GameType' => '',
            'Players' => 0,
            'MaxPlayers' => 0,
        ], $queryInfo);

        return [
            'info' => $info,
            'queryInfo' => $queryInfo,
            'players' => $players,
            'timer' => $timer,
        ];
    }

    private function createPing(string $host, int $port, float $timeout): array
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

            return is_array($info) ? $info : [];
        } catch (\Throwable) {
            return [];
        } finally {
            if ($ping instanceof MinecraftPing) {
                $ping->Close();
            }
        }
    }

    private function createQuery(string $host, int $port, float $timeout): array
    {
        try {
            $query = new MinecraftQuery();
            $query->Connect($host, $port, $timeout);
            $info = $query->GetInfo();
            $players = $query->GetPlayers();

            return [
                is_array($info) ? $info : [],
                is_array($players) ? array_values($players) : [],
            ];
        } catch (\Throwable) {
            return [[], []];
        }
    }
}
