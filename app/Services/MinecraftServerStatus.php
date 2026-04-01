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
            $query = new MinecraftQuery;
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

        $motd = $this->buildMotd(
            $info['description'] ?? null,
            $normalizedQueryInfo['HostName'] !== '未知' ? (string) $normalizedQueryInfo['HostName'] : ''
        );
        $statusText = ($pingResult['error'] ?? null) === null ? '服务器在线' : '服务器离线或不可访问';

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
            'display_name' => $motd['plain'],
            'display_subtitle' => $statusText,
            'motd_html' => $motd['html'],
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

    protected function buildMotd(mixed $description, string $hostName): array
    {
        $fragments = $this->extractMinecraftFragments($description);

        if ($fragments === [] && $hostName !== '') {
            $fragments = $this->parseLegacyMinecraftText($hostName);
        }

        if ($fragments === []) {
            $fallback = 'Minecraft 服务器';

            return [
                'plain' => $fallback,
                'html' => htmlspecialchars($fallback, ENT_QUOTES, 'UTF-8'),
            ];
        }

        $plain = trim(implode('', array_column($fragments, 'text')));

        return [
            'plain' => $plain,
            'html' => $this->renderMinecraftFragmentsAsHtml($fragments),
        ];
    }

    protected function extractMinecraftFragments(mixed $description, ?array $parentStyle = null): array
    {
        $style = $parentStyle ?? $this->defaultMinecraftStyle();

        if (is_scalar($description)) {
            return $this->parseLegacyMinecraftText((string) $description, $style);
        }

        if (! is_array($description)) {
            return [];
        }

        if (array_is_list($description)) {
            $fragments = [];

            foreach ($description as $item) {
                array_push($fragments, ...$this->extractMinecraftFragments($item, $style));
            }

            return $fragments;
        }

        $style = $this->applyComponentStyle($style, $description);
        $fragments = [];

        if (isset($description['text']) && is_scalar($description['text'])) {
            array_push($fragments, ...$this->parseLegacyMinecraftText((string) $description['text'], $style));
        } elseif (isset($description['translate']) && is_scalar($description['translate'])) {
            array_push($fragments, ...$this->parseLegacyMinecraftText((string) $description['translate'], $style));
        }

        if (isset($description['extra']) && is_array($description['extra'])) {
            foreach ($description['extra'] as $item) {
                array_push($fragments, ...$this->extractMinecraftFragments($item, $style));
            }
        }

        return $fragments;
    }

    protected function parseLegacyMinecraftText(string $text, ?array $baseStyle = null): array
    {
        $style = $baseStyle ?? $this->defaultMinecraftStyle();
        $text = str_replace(["\r\n", "\r", "\f"], "\n", $text);
        $chars = preg_split('//u', $text, -1, PREG_SPLIT_NO_EMPTY);

        if ($chars === false) {
            return [[
                'text' => $text,
                'style' => $style,
            ]];
        }

        $fragments = [];
        $buffer = '';
        $charCount = count($chars);

        for ($index = 0; $index < $charCount; $index++) {
            $char = $chars[$index];

            if ($char !== '§') {
                $buffer .= $char;

                continue;
            }

            if ($index + 1 >= $charCount) {
                $buffer .= $char;

                continue;
            }

            $code = strtolower($chars[$index + 1]);
            $hexColor = null;

            if ($code === 'x' && $index + 13 < $charCount) {
                $hexDigits = '';
                $isHexSequence = true;

                for ($hexIndex = 0; $hexIndex < 6; $hexIndex++) {
                    $sectionIndex = $index + 2 + ($hexIndex * 2);
                    $digitIndex = $sectionIndex + 1;

                    if (($chars[$sectionIndex] ?? null) !== '§' || ! ctype_xdigit($chars[$digitIndex] ?? '')) {
                        $isHexSequence = false;
                        break;
                    }

                    $hexDigits .= $chars[$digitIndex];
                }

                if ($isHexSequence) {
                    $hexColor = '#'.strtoupper($hexDigits);
                    $index += 13;
                }
            }

            if ($buffer !== '') {
                $fragments[] = [
                    'text' => $buffer,
                    'style' => $style,
                ];
                $buffer = '';
            }

            if ($hexColor !== null) {
                $style = $this->applyLegacyFormattingCode($style, $hexColor);

                continue;
            }

            $style = $this->applyLegacyFormattingCode($style, $code);
            $index++;
        }

        if ($buffer !== '') {
            $fragments[] = [
                'text' => $buffer,
                'style' => $style,
            ];
        }

        return $fragments;
    }

    protected function applyLegacyFormattingCode(array $style, string $code): array
    {
        $colors = $this->minecraftColorMap();

        if (str_starts_with($code, '#')) {
            return array_merge($this->defaultMinecraftStyle(), ['color' => $code]);
        }

        if (isset($colors[$code])) {
            return array_merge($this->defaultMinecraftStyle(), ['color' => $colors[$code]]);
        }

        return match ($code) {
            'k' => array_merge($style, ['obfuscated' => true]),
            'l' => array_merge($style, ['bold' => true]),
            'm' => array_merge($style, ['strikethrough' => true]),
            'n' => array_merge($style, ['underlined' => true]),
            'o' => array_merge($style, ['italic' => true]),
            'r' => $this->defaultMinecraftStyle(),
            default => $style,
        };
    }

    protected function applyComponentStyle(array $style, array $component): array
    {
        if (isset($component['color']) && is_string($component['color'])) {
            $style['color'] = $this->resolveMinecraftColor($component['color']) ?? $style['color'];
        }

        foreach ([
            'bold' => 'bold',
            'italic' => 'italic',
            'underlined' => 'underlined',
            'strikethrough' => 'strikethrough',
            'obfuscated' => 'obfuscated',
        ] as $key => $target) {
            if (array_key_exists($key, $component)) {
                $style[$target] = (bool) $component[$key];
            }
        }

        return $style;
    }

    protected function renderMinecraftFragmentsAsHtml(array $fragments): string
    {
        $html = '';

        foreach ($fragments as $fragment) {
            $text = $fragment['text'] ?? '';

            if ($text === '') {
                continue;
            }

            $style = is_array($fragment['style'] ?? null) ? $fragment['style'] : $this->defaultMinecraftStyle();
            $escaped = nl2br(htmlspecialchars($text, ENT_QUOTES, 'UTF-8'), false);
            $css = [];

            if ($style['color'] !== null) {
                $css[] = 'color: '.$style['color'];
            }

            if ($style['bold']) {
                $css[] = 'font-weight: 700';
            }

            if ($style['italic']) {
                $css[] = 'font-style: italic';
            }

            $decorations = [];

            if ($style['underlined']) {
                $decorations[] = 'underline';
            }

            if ($style['strikethrough']) {
                $decorations[] = 'line-through';
            }

            if ($decorations !== []) {
                $css[] = 'text-decoration: '.implode(' ', $decorations);
            }

            if ($style['obfuscated']) {
                $css[] = 'filter: blur(0.08em)';
            }

            if ($css === []) {
                $html .= $escaped;

                continue;
            }

            $html .= sprintf(
                '<span style="%s">%s</span>',
                htmlspecialchars(implode('; ', $css), ENT_QUOTES, 'UTF-8'),
                $escaped
            );
        }

        return $html;
    }

    protected function resolveMinecraftColor(string $color): ?string
    {
        if (preg_match('/^#[0-9a-f]{6}$/i', $color) === 1) {
            return strtoupper($color);
        }

        $colors = [
            'black' => '#000000',
            'dark_blue' => '#0000AA',
            'dark_green' => '#00AA00',
            'dark_aqua' => '#00AAAA',
            'dark_red' => '#AA0000',
            'dark_purple' => '#AA00AA',
            'gold' => '#FFAA00',
            'gray' => '#AAAAAA',
            'dark_gray' => '#555555',
            'blue' => '#5555FF',
            'green' => '#55FF55',
            'aqua' => '#55FFFF',
            'red' => '#FF5555',
            'light_purple' => '#FF55FF',
            'yellow' => '#FFFF55',
            'white' => '#FFFFFF',
        ];

        return $colors[strtolower($color)] ?? null;
    }

    protected function minecraftColorMap(): array
    {
        return [
            '0' => '#000000',
            '1' => '#0000AA',
            '2' => '#00AA00',
            '3' => '#00AAAA',
            '4' => '#AA0000',
            '5' => '#AA00AA',
            '6' => '#FFAA00',
            '7' => '#AAAAAA',
            '8' => '#555555',
            '9' => '#5555FF',
            'a' => '#55FF55',
            'b' => '#55FFFF',
            'c' => '#FF5555',
            'd' => '#FF55FF',
            'e' => '#FFFF55',
            'f' => '#FFFFFF',
        ];
    }

    protected function defaultMinecraftStyle(): array
    {
        return [
            'color' => null,
            'bold' => false,
            'italic' => false,
            'underlined' => false,
            'strikethrough' => false,
            'obfuscated' => false,
        ];
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
